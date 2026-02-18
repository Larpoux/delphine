"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.DelphineCustomEditorProvider = void 0;
exports.splitHtmlForGrapes = splitHtmlForGrapes;
const vscode = __importStar(require("vscode"));
const crypto = __importStar(require("crypto"));
const parse5_1 = require("parse5");
const prettier = __importStar(require("prettier"));
// --- Small helpers ---
function isElement(n, tag) {
    return n.nodeName === tag;
}
function childNodes(n) {
    return (n.childNodes ?? []);
}
function findFirst(node, pred) {
    if (pred(node))
        return node;
    for (const ch of childNodes(node)) {
        const found = findFirst(ch, pred);
        if (found)
            return found;
    }
    return null;
}
function findAll(node, pred, acc = []) {
    if (pred(node))
        acc.push(node);
    for (const ch of childNodes(node)) {
        findAll(ch, pred, acc);
    }
    return acc;
}
function extractStyleText(styleEl) {
    // In parse5 default tree, <style> content is usually a single TextNode with `.value`
    const texts = childNodes(styleEl).filter((n) => n.nodeName === '#text');
    return texts.map((t) => t.value ?? '').join('');
}
function extractBodyParts(fullHtml) {
    const m = fullHtml.match(/<body([^>]*)>([\s\S]*?)<\/body>/i);
    if (!m)
        return { bodyAttrs: '', bodyInnerHtml: fullHtml };
    const bodyAttrs = (m[1] ?? '').trim();
    const bodyInnerHtml = (m[2] ?? '').trim();
    return { bodyAttrs, bodyInnerHtml };
}
// --- Main ---
function splitHtmlForGrapes(fullHtml) {
    const doc = (0, parse5_1.parse)(fullHtml);
    const { bodyAttrs, bodyInnerHtml } = extractBodyParts(fullHtml);
    const headNode = findFirst(doc, (n) => isElement(n, 'head'));
    const styleNodes = headNode ? findAll(headNode, (n) => isElement(n, 'style')) : [];
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
class DelphineCustomEditorProvider {
    context;
    static viewType = 'delphine.customEditor';
    static _context;
    _panel;
    _extensionUri;
    static register(context) {
        DelphineCustomEditorProvider._context = context;
        console.log('*** Delphine: registering custom editor provider ***');
        const provider = new DelphineCustomEditorProvider(context);
        return vscode.window.registerCustomEditorProvider(DelphineCustomEditorProvider.viewType, provider, {
            webviewOptions: {
                retainContextWhenHidden: true
            }
        });
    }
    isApplyingFromWebview = false;
    constructor(context) {
        this.context = context;
    }
    /**
     * Apply a full-document replace coming from the webview.
     * Note: we must await applyEdit, otherwise isApplyingFromWebview is released too early.
     */
    async updateTextDocument(document, html
    //css: string
    ) {
        if (html === document.getText())
            return false; // ✅ évite de salir le doc pour rien
        this.isApplyingFromWebview = true;
        try {
            const edit = new vscode.WorkspaceEdit();
            const fullRange = new vscode.Range(document.positionAt(0), document.positionAt(document.getText().length));
            edit.replace(document.uri, fullRange, html);
            const ok = await vscode.workspace.applyEdit(edit);
            return ok;
        }
        finally {
            // Release on next tick to avoid races with onDidChangeTextDocument handlers
            setTimeout(() => {
                this.isApplyingFromWebview = false;
            }, 0);
        }
    }
    async resolveCustomTextEditor(document, webviewPanel, _token) {
        let lastRev = 0;
        webviewPanel.webview.onDidReceiveMessage(async (msg) => {
            //const msg = await e;
            console.log(`[VSCode] ${msg.type} <- from bootEditor`);
            switch (msg.type) {
                case 'alert':
                    vscode.window.showErrorMessage(msg.text);
                    return;
                case 'log':
                    console.log(`[VSCode] ${msg.type} <- from bootEditor : '${msg.text}'`);
                    return;
                case 'contentChanged':
                    if (msg.rev && msg.rev <= lastRev)
                        return;
                    lastRev = msg.rev ?? lastRev + 1;
                    //const prettyHtml = await formatHtml(msg.html ?? "");
                    //const prettyCss  = await formatCss(msg.css ?? "");
                    // Actually zaza.js is hard coded here. Should be modified TODO
                    const prettyDoc = await formatHtml(`<!DOCTYPE html> 
<html lang="en-US"> <head> <meta charset="UTF-8"><meta http-equiv="X-UA-Compatible" content="IE=Edge"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Cat Scratch Editor</title><style>` +
                        msg.css +
                        `</style></head>` +
                        msg.html +
                        `</html>`);
                    await this.updateTextDocument(document, prettyDoc);
                    return;
                case 'bootEditor:ready':
                    updateWebview();
                    return;
                case 'bootEditor:loaded':
                    updateWebview();
                    return;
            }
        });
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
            console.log(`[VSCode] doc:update -> bootEditor`);
            void webviewPanel.webview.postMessage({
                html: bodyInnerHtml,
                type: 'doc:update',
                css: cssText ?? ''
            });
        };
        // Update the webview when the document changes.
        const changeSubscription = vscode.workspace.onDidChangeTextDocument((e) => {
            if (e.document.uri.toString() === document.uri.toString()) {
                updateWebview();
            }
        });
        webviewPanel.onDidDispose(() => changeSubscription.dispose());
        // Receive messages from the webview.
        /*
        webviewPanel.webview.onDidReceiveMessage((msg) => {
                if (!msg || typeof msg.type !== 'string') return;

                // Example: the webview wants to replace the whole document.
                if (msg.type === 'doc:replace' && typeof msg.text === 'string') {
                        this.replaceDocument(document, msg.text);
                }
        });
        */
        // Initial content.
        // updateWebview(); // Not necessary
        console.log('[VSCODE] vsc:ready -> bootEditor');
        void webviewPanel.webview.postMessage({
            type: 'vsc:ready'
        });
        // ******************************************************************* Functions *********************************************
        // Keep it small and deterministic
        async function formatHtml(html) {
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
            }
            catch (e) {
                console.warn('Prettier HTML failed, keeping raw HTML:', e);
                return html;
            }
        }
    }
    buildHtml(webview, document) {
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
    async replaceDocument(document, text) {
        const edit = new vscode.WorkspaceEdit();
        const fullRange = new vscode.Range(document.positionAt(0), document.positionAt(document.getText().length));
        edit.replace(document.uri, fullRange, text);
        await vscode.workspace.applyEdit(edit);
    }
}
exports.DelphineCustomEditorProvider = DelphineCustomEditorProvider;
function escapeHtml(s) {
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
//# sourceMappingURL=DelphineCustomEditorProvider.js.map