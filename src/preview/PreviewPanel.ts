import * as crypto from 'crypto';
import * as vscode from 'vscode';
import * as fs from 'node:fs';
import * as path from 'node:path';

type Disposer = { dispose(): void };

// ***************************  The following code is a duplicate from the Custom Editor *******************************
// **************************** We should use a shared code. TODO ******************************************************
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

        panel: vscode.WebviewPanel;
        context: vscode.ExtensionContext;
        docUri: vscode.Uri | null = null;
        compiledUri: vscode.Uri | null = null;
        disposed = false;
        timers: NodeJS.Timeout[] = [];

        //private gotBoot = false;
        //private gotClick = false;
        private runId = 0;
        // English comments: example integration
        private compiledWatcher?: { dispose(): void };

        private constructor(context: vscode.ExtensionContext, panel: vscode.WebviewPanel) {
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
        public static async createOrShow(context: vscode.ExtensionContext, docUri: vscode.Uri): Promise<PreviewPanel> {
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

        private docChangeTimer: NodeJS.Timeout | undefined;

        private init(context: vscode.ExtensionContext, panel: vscode.WebviewPanel) {
                this.runId++;
                //instance.gotBoot = false;
                //instance.gotClick = false;

                const docName = this.getStem(this.docUri!);
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
                        if (this.docChangeTimer) clearTimeout(this.docChangeTimer);
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

        private buildHtml(webview: vscode.Webview): string {
                const editor = vscode.window.activeTextEditor;
                if (!editor) return '';

                const nonce = crypto.randomBytes(16).toString('base64url');

                const bootUri = webview.asWebviewUri(vscode.Uri.joinPath(this.context.extensionUri, 'media', 'bootPreview.js'));
                if (!fs.existsSync(bootUri.fsPath)) {
                        console.warn('bootPreview.js not found:', bootUri.fsPath);
                        // fallback, message, placeholder, etc.
                }

                if (!fs.existsSync(this.compiledUri!.fsPath)) {
                        console.warn('Compiled JS not found:', this.compiledUri!.fsPath);
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
                        <script nonce="${nonce}" type="module" src="${this.compiledUri!}"></script>
                        </body>
                        </html>
                `;
        }

        private getStem(uri: vscode.Uri): string {
                const basename = uri.path.split('/').pop() ?? 'document.html';
                const stem = basename.replace(/\.[^.]+$/, ''); // "zaza.html" -> "zaza"
                return stem;
        }

        // Actually not used. Just for future if needed
        private getCompiledJsUriSav(webview: vscode.Webview, doc: vscode.TextDocument): vscode.Uri {
                const htmlUri = doc.uri;

                // Change extension: zaza.html → zaza.compiled.js
                const compiledUri = htmlUri.with({
                        path: htmlUri.path.replace(/\.html$/i, '.compiled.js')
                });

                return webview.asWebviewUri(compiledUri);
        }

        // Actually not used. Just for future if needed
        private getCompiledJsUriWithSuffix(uri: vscode.Uri, fromExt: string, suffix: string): vscode.Uri {
                return uri.with({
                        path: uri.path.replace(new RegExp(`${fromExt}$`, 'i'), `${suffix}`)
                });
        }

        private refresh() {
                this.panel.webview.html = this.buildHtml(this.panel.webview);
        }

        private onDocChanged(doc: vscode.TextDocument) {
                const x = this.getCompiledJsUriWithSuffix(this.docUri!, '.html', '.ts');

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

        private startWatchingCompiledJs(compiledUri: vscode.Uri) {
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

function debounce(fn: () => void, ms: number) {
        let t: NodeJS.Timeout | undefined;
        return () => {
                if (t) clearTimeout(t);
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
export function watchFileNoWorkspace(targetFileAbsPath: string, onChanged: () => void): Disposer {
        //const dir = path.dirname(targetFileAbsPath);
        //const base = path.basename(targetFileAbsPath);

        const fire = debounce(onChanged, 150);

        const dir = path.dirname(targetFileAbsPath);
        const target = path.basename(targetFileAbsPath);

        // Note: fs.watch can be flaky on some network shares; directory watching is usually better than file watching.
        const watcher = fs.watch(dir, { persistent: false }, (_evt, filename) => {
                // filename can be null on some platforms
                if (!filename) return;

                // On macOS/Linux, filename is usually just the base name
                if (filename.toString() === target) {
                        fire();
                }
        });

        return {
                dispose() {
                        try {
                                watcher.close();
                        } catch {}
                }
        };
}
