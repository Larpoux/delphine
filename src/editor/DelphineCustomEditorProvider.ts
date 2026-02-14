import * as vscode from 'vscode';
import * as crypto from 'crypto';
import { parse } from 'parse5';
import * as prettier from 'prettier';
import type {
        Document as DefaultTreeDocument,
        Element as DefaultTreeElement,
        Node as DefaultTreeNode,
        //ParentNode as DefaultTreeParentNode,
        TextNode as DefaultTreeTextNode
} from 'parse5/dist/tree-adapters/default';

/**
 * Result of the HTML split for GrapesJS
 */
export interface GrapesInput {
        cssText: string;
        bodyInnerHtml: string;
        bodyAttrs: string;
}

/**
 * Result of the HTML split for GrapesJS
 */
export interface GrapesInput {
        cssText: string;
        bodyInnerHtml: string;
        bodyAttrs: string;
}

// --- Small helpers ---
function isElement(n: DefaultTreeNode, tag: string): n is DefaultTreeElement {
        return (n as any).nodeName === tag;
}

function childNodes(n: DefaultTreeNode): DefaultTreeNode[] {
        return ((n as any).childNodes ?? []) as DefaultTreeNode[];
}

function findFirst(node: DefaultTreeNode, pred: (n: DefaultTreeNode) => boolean): DefaultTreeNode | null {
        if (pred(node)) return node;
        for (const ch of childNodes(node)) {
                const found = findFirst(ch, pred);
                if (found) return found;
        }
        return null;
}

function findAll(node: DefaultTreeNode, pred: (n: DefaultTreeNode) => boolean, acc: DefaultTreeNode[] = []): DefaultTreeNode[] {
        if (pred(node)) acc.push(node);
        for (const ch of childNodes(node)) {
                findAll(ch, pred, acc);
        }
        return acc;
}

function extractStyleText(styleEl: DefaultTreeElement): string {
        // In parse5 default tree, <style> content is usually a single TextNode with `.value`
        const texts = childNodes(styleEl).filter((n) => (n as any).nodeName === '#text') as DefaultTreeTextNode[];
        return texts.map((t) => t.value ?? '').join('');
}

function extractBodyParts(fullHtml: string): { bodyAttrs: string; bodyInnerHtml: string } {
        const m = fullHtml.match(/<body([^>]*)>([\s\S]*?)<\/body>/i);
        if (!m) return { bodyAttrs: '', bodyInnerHtml: fullHtml };

        const bodyAttrs = (m[1] ?? '').trim();
        const bodyInnerHtml = (m[2] ?? '').trim();
        return { bodyAttrs, bodyInnerHtml };
}

// --- Main ---
export function splitHtmlForGrapes(fullHtml: string): GrapesInput {
        const doc = parse(fullHtml) as DefaultTreeDocument;

        const { bodyAttrs, bodyInnerHtml } = extractBodyParts(fullHtml);

        const headNode = findFirst(doc as any, (n) => isElement(n, 'head')) as DefaultTreeElement | null;
        const styleNodes = headNode ? (findAll(headNode, (n) => isElement(n, 'style')) as DefaultTreeElement[]) : [];

        const cssText = styleNodes
                .map((el) => extractStyleText(el).trim())
                .filter(Boolean)
                .join('\n\n');

        return {
                bodyInnerHtml,
                bodyAttrs,
                cssText: cssText.trim()
        };
}
/**
 * Minimal custom editor provider.
 *
 * This is intentionally clean + boring:
 * - no preview logic here
 * - no reveal loops
 * - one update path
 */
export class DelphineCustomEditorProvider implements vscode.CustomTextEditorProvider {
        public static readonly viewType = 'delphine.customEditor';
        private static _context: vscode.ExtensionContext;
        private _panel: vscode.WebviewPanel | undefined;
        private _extensionUri: vscode.Uri | undefined;

        public static register(context: vscode.ExtensionContext): vscode.Disposable {
                DelphineCustomEditorProvider._context = context;
                console.log('*** Delphine: registering custom editor provider ***');
                const provider = new DelphineCustomEditorProvider(context);
                return vscode.window.registerCustomEditorProvider(DelphineCustomEditorProvider.viewType, provider, {
                        webviewOptions: {
                                retainContextWhenHidden: true
                        }
                });
        }
        private isApplyingFromWebview = false;

        constructor(private readonly context: vscode.ExtensionContext) {}
        /**
         * Apply a full-document replace coming from the webview.
         * Note: we must await applyEdit, otherwise isApplyingFromWebview is released too early.
         */
        private async updateTextDocument(
                document: vscode.TextDocument,
                html: string
                //css: string
        ): Promise<boolean> {
                if (html === document.getText()) return false; // ✅ évite de salir le doc pour rien
                this.isApplyingFromWebview = true;

                try {
                        const edit = new vscode.WorkspaceEdit();
                        const fullRange = new vscode.Range(document.positionAt(0), document.positionAt(document.getText().length));

                        edit.replace(document.uri, fullRange, html);

                        const ok = await vscode.workspace.applyEdit(edit);
                        return ok;
                } finally {
                        // Release on next tick to avoid races with onDidChangeTextDocument handlers
                        setTimeout(() => {
                                this.isApplyingFromWebview = false;
                        }, 0);
                }
        }

        async resolveCustomTextEditor(document: vscode.TextDocument, webviewPanel: vscode.WebviewPanel, _token: vscode.CancellationToken): Promise<void> {
                this._extensionUri = DelphineCustomEditorProvider._context.extensionUri;
                webviewPanel.webview.options = {
                        enableScripts: true,
                        localResourceRoots: [vscode.Uri.joinPath(this.context.extensionUri, 'media')]
                };
                this._panel = webviewPanel;

                webviewPanel.webview.html = this.buildHtml(webviewPanel.webview, document);

                console.log('---------------------------- HTML ---------------------------------');
                console.log(webviewPanel.webview.html);
                console.log('-------------------------------------------------------------------');

                const updateWebview = () => {
                        const { bodyInnerHtml, cssText } = splitHtmlForGrapes(document.getText());

                        void webviewPanel.webview.postMessage({
                                html: bodyInnerHtml,
                                type: 'doc:update',
                                css: cssText ?? ''
                        });
                };

                // Keep it small and deterministic
                async function formatHtml(html: string): Promise<string> {
                        try {
                                // Comments in English (as you prefer)
                                // Use the HTML parser; Prettier will also format embedded <style> blocks if present,
                                // but since you export CSS separately, we keep it as plain HTML here.
                                return await prettier.format(html, {
                                        parser: 'html',

                                        // Indentation style
                                        tabWidth: 8,
                                        useTabs: false,

                                        // Layout
                                        printWidth: 120,
                                        htmlWhitespaceSensitivity: 'css',
                                        proseWrap: 'preserve',

                                        // Consistency
                                        singleQuote: false
                                });
                        } catch (e) {
                                console.warn('Prettier HTML failed, keeping raw HTML:', e);
                                return html;
                        }
                }

                // Update the webview when the document changes.
                const changeSubscription = vscode.workspace.onDidChangeTextDocument((e) => {
                        if (e.document.uri.toString() === document.uri.toString()) {
                                updateWebview();
                        }
                });

                webviewPanel.onDidDispose(() => changeSubscription.dispose());

                // Receive messages from the webview.
                webviewPanel.webview.onDidReceiveMessage((msg) => {
                        if (!msg || typeof msg.type !== 'string') return;

                        // Example: the webview wants to replace the whole document.
                        if (msg.type === 'doc:replace' && typeof msg.text === 'string') {
                                this.replaceDocument(document, msg.text);
                        }
                });
                let lastRev = 0;
                webviewPanel.webview.onDidReceiveMessage(async (msg) => {
                        //const msg = await e;
                        switch (msg.type) {
                                case 'alert':
                                        vscode.window.showErrorMessage(msg.text);
                                        return;

                                case 'log':
                                        console.log(msg.msg);
                                        return;

                                case 'contentChanged': {
                                        if (msg.rev && msg.rev <= lastRev) return;
                                        lastRev = msg.rev ?? lastRev + 1;

                                        //const prettyHtml = await formatHtml(msg.html ?? "");
                                        //const prettyCss  = await formatCss(msg.css ?? "");
                                        // Actually zaza.js is hard coded here. Should be modified TODO
                                        const prettyDoc = await formatHtml(
                                                `<!DOCTYPE html> 
<html lang="en-US"> <head> <meta charset="UTF-8"><meta http-equiv="X-UA-Compatible" content="IE=Edge"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Cat Scratch Editor</title><style>` +
                                                        msg.css +
                                                        `</style></head>` +
                                                        msg.html +
                                                        `</html>`
                                        );

                                        await this.updateTextDocument(document, prettyDoc);
                                        return;
                                }
                        }
                });

                // Initial content.
                updateWebview();
        }

        private buildHtml(webview: vscode.Webview, document: vscode.TextDocument): string {
                const nonce = crypto.randomBytes(16).toString('base64url');

                const grapesCssUri = webview.asWebviewUri(vscode.Uri.joinPath(this.context.extensionUri, 'media', 'grapes.min.css'));
                const grapesJsUri = webview.asWebviewUri(vscode.Uri.joinPath(this.context.extensionUri, 'media', 'grapes.min.js'));
                const bootUri = webview.asWebviewUri(vscode.Uri.joinPath(this.context.extensionUri, 'media', 'bootEditor.js'));

                const csp = [
                        `default-src 'none'`,
                        `img-src ${webview.cspSource} https: data:`,
                        `style-src ${webview.cspSource} 'unsafe-inline' https://cdnjs.cloudflare.com`,
                        `font-src ${webview.cspSource} https: data:`,
                        `connect-src ${webview.cspSource} https:`,
                        `script-src 'nonce-${nonce}' ${webview.cspSource}`
                ].join('; ');

                return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta http-equiv="Content-Security-Policy" content="${csp}">
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <link rel="stylesheet" href="${grapesCssUri}">
  <style>
    html, body { height: 100%; margin: 0; overflow: hidden; }
    #gjs { height: 100vh; }
  </style>
</head>
<body>
  <div id="gjs"></div>

  <script nonce="${nonce}" src="${grapesJsUri}"></script>
  <script nonce="${nonce}" type="module" src="${bootUri}"></script>
</body>
</html>`;
        }

        private async replaceDocument(document: vscode.TextDocument, text: string): Promise<void> {
                const edit = new vscode.WorkspaceEdit();
                const fullRange = new vscode.Range(document.positionAt(0), document.positionAt(document.getText().length));
                edit.replace(document.uri, fullRange, text);
                await vscode.workspace.applyEdit(edit);
        }
}

function escapeHtml(s: string): string {
        return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

/*
const nonce = crypto.randomBytes(16).toString('base64url');
const txt = document.getText();

const { bodyInnerHtml, bodyAttrs, cssText } = splitHtmlForGrapes(txt);
const escaped = escapeHtml(bodyInnerHtml);

const grapesCssUri = webview.asWebviewUri(vscode.Uri.joinPath(this.context.extensionUri, 'media', 'grapes.min.css'));
const grapesJsUri = webview.asWebviewUri(vscode.Uri.joinPath(this.context.extensionUri, 'media', 'grapes.min.js'));
const bootUri = webview.asWebviewUri(vscode.Uri.joinPath(this.context.extensionUri, 'media', 'bootEditor.js'));

// IMPORTANT: allow loading scripts/styles from this webview only
const csp = [`default-src 'none'`, `img-src ${webview.cspSource} https: data:`, `style-src ${webview.cspSource} 'unsafe-inline'`, `font-src ${webview.cspSource} https: data:`, `connect-src ${webview.cspSource} https:`, `script-src 'nonce-${nonce}' ${webview.cspSource}`].join(
        '; '
);
*/
