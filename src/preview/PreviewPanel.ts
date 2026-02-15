import * as vscode from 'vscode';
import * as crypto from 'crypto';

// ***************************  THIS CODE IS SHARED WITH TE CUSTOM EDITOR *******************************

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

// ********************************************************************************************************

/**
 * A simple WebviewPanel used for "preview".
 *
 * Key goals:
 * - Create a fresh panel each time (simpler while debugging).
 * - Single message handler (no duplicates).
 * - No infinite reveal loops (reveal only when needed).
 * - Cancel all timers when panel is disposed.
 */
export class PreviewPanel {
        public static readonly viewType = 'delphinePreview';

        //private static current?: PreviewPanel;

        private readonly panel: vscode.WebviewPanel;
        private readonly context: vscode.ExtensionContext;
        private disposed = false;
        private readonly timers: NodeJS.Timeout[] = [];

        //private gotBoot = false;
        //private gotClick = false;
        private runId = 0;

        private constructor(context: vscode.ExtensionContext, panel: vscode.WebviewPanel) {
                this.context = context;
                this.panel = panel;

                this.panel.onDidDispose(() => this.dispose(), null, context.subscriptions);

                // One handler, once.
                this.panel.webview.onDidReceiveMessage((msg) => this.onMessage(msg), null, context.subscriptions);
                /*
                // If the webview becomes visible again, ask it to re-focus itself.
                this.panel.onDidChangeViewState(
                        (e) => {
                                if (!e.webviewPanel.visible) return;
                                // Reveal once, not in bursts.
                                try {
                                        e.webviewPanel.reveal(e.webviewPanel.viewColumn, false);
                                } catch {
                                        // ignored
                                }
                                void e.webviewPanel.webview.postMessage({ type: 'focusNow' });
                        },
                        null,
                        context.subscriptions
                );
                */
        }

        public static async createOrShow(context: vscode.ExtensionContext, docUri: vscode.Uri): Promise<void> {
                // Dispose previous preview (fresh panel per run).
                //PreviewPanel.current?.dispose();

                const panel = vscode.window.createWebviewPanel(PreviewPanel.viewType, 'Delphine Preview', vscode.ViewColumn.Beside, {
                        enableScripts: true,
                        retainContextWhenHidden: false,
                        // Restrict file access to the extension's media folder.
                        localResourceRoots: [vscode.Uri.joinPath(context.extensionUri, 'media')]
                });

                const instance = new PreviewPanel(context, panel);
                //PreviewPanel.current = instance;

                instance.runId++;
                //instance.gotBoot = false;
                //instance.gotClick = false;

                panel.webview.html = instance.buildHtml(panel.webview, docUri);

                // One gentle activation attempt (no retries storm).
                instance.safeReveal(0);
                instance.safeReveal(80);

                // Optional: a short watchdog to log OK/KO.
                //instance.startWatchdog(3000);
        }

        private buildHtml(webview: vscode.Webview, _docUri: vscode.Uri): string {
                const editor = vscode.window.activeTextEditor;
                if (!editor) return '';

                const nonce = crypto.randomBytes(16).toString('base64url');

                const bootUri = webview.asWebviewUri(vscode.Uri.joinPath(this.context.extensionUri, 'media', 'bootPreview.js'));
                const compiledUri = webview.asWebviewUri(vscode.Uri.joinPath(this.context.extensionUri, 'media', 'zaza.compiled.js'));

                const { bodyInnerHtml, cssText } = splitHtmlForGrapes(editor.document.getText());
                console.log('---------------------------bodyInnerHtml---------------------------');
                console.log(bodyInnerHtml);
                console.log('--------------------------------------------------------------');

                // IMPORTANT:
                // VS Code Webviews run inside a wrapper page ("fake.html").
                // Sometimes you see warnings about CSP meta being "outside <head>".
                // You can ignore those warnings as long as your own scripts load and run.
                //
                // Also note: use nonce AND allow webview.cspSource.
                const csp = [
                        `default-src 'none'`,
                        `img-src ${webview.cspSource} https: data:`,
                        `style-src ${webview.cspSource} 'unsafe-inline'`,
                        `font-src ${webview.cspSource} https: data:`,
                        `connect-src ${webview.cspSource} https:`,
                        `script-src 'nonce-${nonce}' ${webview.cspSource}`,
                        `script-src-elem 'nonce-${nonce}' ${webview.cspSource}`
                ].join('; ');

                return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta http-equiv="Content-Security-Policy" content="${csp}">
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Delphine Preview</title>
</head>
<body id="delphine-root" data-component="TForm" data-name="zaza" data-onclick="zaza_onclick">
  ${bodyInnerHtml}
  <script nonce="${nonce}" type="module" src="${bootUri}"></script>
  <script nonce="${nonce}" type="module" src="${compiledUri}"></script>
</body>
</html>`;
        }

        private onMessage(msg: any): void {
                if (!msg || typeof msg.type !== 'string') return;

                //if (msg.type === 'boot:loaded') this.gotBoot = true;
                //if (msg.type === 'ui:click' && (msg.id === 'btn' || msg.id === 'button1')) this.gotClick = true;

                if (msg.type === 'ready') {
                        // Webview says it's ready; bring it to the front once.
                        this.safeReveal(0);
                }
        }
        /*
        private startWatchdog(timeoutMs: number): void {
                const run = this.runId;
                const t = setTimeout(() => {
                        if (this.disposed) return;
                        const ok = this.gotBoot && this.gotClick;
                        const tag = ok ? 'OK' : 'KO';
                        // Keep your exact semantics: KO = "not alive".
                        console.log(`[RUN ${run}] ${tag} boot=${this.gotBoot} clickBtn=${this.gotClick}`);
                }, timeoutMs);
                this.timers.push(t);
        }
                */

        private safeReveal(delayMs: number): void {
                const t = setTimeout(() => {
                        if (this.disposed) return;
                        try {
                                this.panel.reveal(this.panel.viewColumn, false);
                        } catch {
                                /* ignored */
                        }
                }, delayMs);
                this.timers.push(t);
        }

        public dispose(): void {
                if (this.disposed) return;
                this.disposed = true;

                for (const t of this.timers) clearTimeout(t);
                this.timers.length = 0;

                try {
                        this.panel.dispose();
                } catch {
                        /* ignored */
                }

                //if (PreviewPanel.current === this) PreviewPanel.current = undefined;
        }
}
