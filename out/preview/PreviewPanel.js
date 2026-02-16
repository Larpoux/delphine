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
exports.PreviewPanel = void 0;
exports.splitHtmlForGrapes = splitHtmlForGrapes;
exports.watchFileNoWorkspace = watchFileNoWorkspace;
const crypto = __importStar(require("crypto"));
const vscode = __importStar(require("vscode"));
const fs = __importStar(require("node:fs"));
const path = __importStar(require("node:path"));
// ***************************  The following code is a duplicate from the Custom Editor *******************************
// **************************** We should use a shared code. TODO ******************************************************
const parse5_1 = require("parse5");
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
class PreviewPanel {
    static viewType = 'delphinePreview';
    //private static current?: PreviewPanel;
    panel;
    context;
    docUri = null;
    compiledUri = null;
    disposed = false;
    timers = [];
    //private gotBoot = false;
    //private gotClick = false;
    runId = 0;
    // English comments: example integration
    compiledWatcher;
    constructor(context, panel) {
        this.context = context;
        this.panel = panel;
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
    // createOrShow() is a factory
    static async createOrShow(context, docUri) {
        // Dispose previous preview (fresh panel per run).
        //PreviewPanel.current?.dispose();
        const panel = vscode.window.createWebviewPanel(PreviewPanel.viewType, 'Delphine Preview', vscode.ViewColumn.Beside, {
            enableScripts: true,
            retainContextWhenHidden: false,
            // Restrict file access to the extension's media folder.
            localResourceRoots: [vscode.Uri.joinPath(context.extensionUri, 'media')]
        });
        // The object constructor
        const instance = await new PreviewPanel(context, panel);
        //PreviewPanel.current = instance;
        instance.docUri = docUri;
        instance.init(context, panel);
        return instance;
        // Optional: a short watchdog to log OK/KO.
        //instance.startWatchdog(3000);
    }
    docChangeTimer;
    init(context, panel) {
        this.runId++;
        //instance.gotBoot = false;
        //instance.gotClick = false;
        const docName = this.getStem(this.docUri);
        this.compiledUri = panel.webview.asWebviewUri(vscode.Uri.joinPath(this.context.extensionUri, 'media', `${docName}.compiled.js`));
        panel.onDidDispose(() => this.dispose(), null, context.subscriptions);
        // One handler, once.
        panel.webview.onDidReceiveMessage((msg) => this.onMessage(msg), null, context.subscriptions);
        vscode.workspace.onDidChangeTextDocument((ev) => {
            const doc = ev.document;
            console.log('onDidChangeTextDocument');
            //if (doc.uri.toString() !== this.docUri!.toString()) return;
            // Only refresh if it's the document this panel shows
            // Debounce
            if (this.docChangeTimer)
                clearTimeout(this.docChangeTimer);
            this.docChangeTimer = setTimeout(() => {
                this.docChangeTimer = undefined;
                this.onDocChanged(doc);
            }, 300);
        });
        this.startWatchingCompiledJs(this.compiledUri);
        panel.webview.html = this.buildHtml(panel.webview);
        // One gentle activation attempt (no retries storm).
        this.safeReveal(0);
        this.safeReveal(80);
    }
    buildHtml(webview) {
        const editor = vscode.window.activeTextEditor;
        if (!editor)
            return '';
        const nonce = crypto.randomBytes(16).toString('base64url');
        const bootUri = webview.asWebviewUri(vscode.Uri.joinPath(this.context.extensionUri, 'media', 'bootPreview.js'));
        if (!fs.existsSync(bootUri.fsPath)) {
            console.warn('bootPreview.js not found:', bootUri.fsPath);
            // fallback, message, placeholder, etc.
        }
        if (!fs.existsSync(this.compiledUri.fsPath)) {
            console.warn('Compiled JS not found:', this.compiledUri.fsPath);
            // fallback, message, placeholder, etc.
        }
        const { bodyInnerHtml, bodyAttrs, cssText } = splitHtmlForGrapes(editor.document.getText());
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
                        <body ${bodyAttrs}>
                        ${bodyInnerHtml}
                        <script nonce="${nonce}" type="module" src="${bootUri}"></script>
                        <script nonce="${nonce}" type="module" src="${this.compiledUri}"></script>
                        </body>
                        </html>
                `;
    }
    getStem(uri) {
        const basename = uri.path.split('/').pop() ?? 'document.html';
        const stem = basename.replace(/\.[^.]+$/, ''); // "zaza.html" -> "zaza"
        return stem;
    }
    // Actually not used. Just for future if needed
    getCompiledJsUriSav(webview, doc) {
        const htmlUri = doc.uri;
        // Change extension: zaza.html → zaza.compiled.js
        const compiledUri = htmlUri.with({
            path: htmlUri.path.replace(/\.html$/i, '.compiled.js')
        });
        return webview.asWebviewUri(compiledUri);
    }
    // Actually not used. Just for future if needed
    getCompiledJsUriWithSuffix(uri, fromExt, suffix) {
        return uri.with({
            path: uri.path.replace(new RegExp(`${fromExt}$`, 'i'), `${suffix}`)
        });
    }
    refresh() {
        this.panel.webview.html = this.buildHtml(this.panel.webview);
    }
    onDocChanged(doc) {
        const x = this.getCompiledJsUriWithSuffix(this.docUri, '.html', '.ts');
        // Case 1 : le HTML itself changed
        if (doc.uri === this.docUri) {
            this.refresh();
            return;
        }
        // Case 2 : The compiled URI
        //if (doc.uri === this.compiledUri) {
        //        this.refresh();
        //        return;
        //}
    }
    onMessage(msg) {
        if (!msg || typeof msg.type !== 'string')
            return;
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
    safeReveal(delayMs) {
        const t = setTimeout(() => {
            if (this.disposed)
                return;
            try {
                this.panel.reveal(this.panel.viewColumn, false);
            }
            catch {
                /* ignored */
            }
        }, delayMs);
        this.timers.push(t);
    }
    dispose() {
        if (this.disposed)
            return;
        this.disposed = true;
        for (const t of this.timers)
            clearTimeout(t);
        this.timers.length = 0;
        try {
            this.panel.dispose();
        }
        catch {
            /* ignored */
        }
        //if (PreviewPanel.current === this) PreviewPanel.current = undefined;
    }
    startWatchingCompiledJs(compiledUri) {
        //const stem = path.basename(htmlUri.fsPath, path.extname(htmlUri.fsPath));
        // Where is the compiled JS?
        // Today: extension/media/<stem>.compiled.js
        //const compiledAbs = vscode.Uri.joinPath(this.context.extensionUri, 'media', `${stem}.compiled.js`).fsPath;
        this.compiledWatcher?.dispose();
        this.compiledWatcher = watchFileNoWorkspace(compiledUri.fsPath, () => {
            // Rebuild webview HTML so the <script src="...compiled.js"> is reloaded
            this.refresh();
        });
        this.panel.onDidDispose(() => this.compiledWatcher?.dispose());
    }
}
exports.PreviewPanel = PreviewPanel;
function debounce(fn, ms) {
    let t;
    return () => {
        if (t)
            clearTimeout(t);
        t = setTimeout(() => {
            t = undefined;
            fn();
        }, ms);
    };
}
/**
 * Watch a target file path even when no workspace is open.
 * We watch the directory and filter by filename to survive atomic writes (rename).
 */
function watchFileNoWorkspace(targetFileAbsPath, onChanged) {
    //const dir = path.dirname(targetFileAbsPath);
    //const base = path.basename(targetFileAbsPath);
    const fire = debounce(onChanged, 150);
    const dir = path.dirname(targetFileAbsPath);
    const target = path.basename(targetFileAbsPath);
    // Note: fs.watch can be flaky on some network shares; directory watching is usually better than file watching.
    const watcher = fs.watch(dir, { persistent: false }, (_evt, filename) => {
        // filename can be null on some platforms
        if (!filename)
            return;
        // On macOS/Linux, filename is usually just the base name
        if (filename.toString() === target) {
            fire();
        }
    });
    return {
        dispose() {
            try {
                watcher.close();
            }
            catch { }
        }
    };
}
//# sourceMappingURL=PreviewPanel.js.map