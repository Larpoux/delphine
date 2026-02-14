"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.previewWebview = void 0;
exports.splitHtmlForGrapes = splitHtmlForGrapes;
const vscode = require("vscode");
//import { getNonce } from './util';
const prettier = require("prettier");
const parse5_1 = require("parse5");
const crypto = require("crypto");
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
/*
function extractBody(html: string): string | null {
        const bodyMatch = html.match(/<body\b[^>]*>[\s\S]*?<\/body>/i);
        if (!bodyMatch) return null;
        return bodyMatch ? bodyMatch[0].trim() : null;
}
    

function extractBodyInner(html: string): string {
        const m = html.match(/<body\b[^>]*>([\s\S]*?)<\/body>/i);
        return m ? m[1].trim() : '';
}
    */
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
/*
function stripScripts(html: string): string {
        return html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '');
}
    */
/**
 * Provider for cat scratch editors.
 *
 * Cat scratch editors are used for `.cscratch` files, which are just json files.
 * To get started, run this extension and open an empty `.cscratch` file in VS Code.
 *
 * This provider demonstrates:
 *
 * - Setting up the initial webview for a custom editor.
 * - Loading scripts and styles in a custom editor.
 * - Synchronizing changes between a text document and a custom editor.
 *
 */
// Place this OUTSIDE the command handler (e.g. top-level in extension.ts)
let runId = 0;
let currentPanel;
class previewWebview {
    static register(context) {
        previewWebview._context = context;
        console.log('Congratulations, your extension "helloworld-sample" is now active!');
        context.subscriptions.push(vscode.commands.registerCommand('delphine', () => {
            const toto = vscode.window.activeTextEditor?.document.uri;
            console.log(toto?.toString());
            vscode.commands.executeCommand('vscode.openWith', toto, 'catCustoms.catScratch');
            console.log('delphine!');
            //CatCodingPanel.createOrShow(context.extensionUri);
        }));
        context.subscriptions.push(vscode.commands.registerCommand('marinette', () => {
            const totox = vscode.window.activeTextEditor;
            const toto = totox?.document.uri;
            console.log(toto?.toString());
            vscode.commands.executeCommand('vscode.openWith', toto, 'html');
            console.log('marinette!');
            //CatCodingPanel.createOrShow(context.extensionUri);
        }));
        context.subscriptions.push(vscode.commands.registerCommand('preview', async () => {
            const activeTextEditor = vscode.window.activeTextEditor;
            const docUri = activeTextEditor?.document.uri;
            console.log(docUri?.toString());
            // Identify which VS Code instance/process logs this (very useful!)
            const TAG = `[sid:${vscode.env.sessionId} pid:${process.pid}]`;
            currentPanel?.dispose();
            const panel = vscode.window.createWebviewPanel('delphinePreview', 'Delphine Preview', vscode.ViewColumn.Beside, {
                enableScripts: true,
                retainContextWhenHidden: false, // important to test
                localResourceRoots: [vscode.Uri.joinPath(context.extensionUri, 'media')]
            });
            currentPanel = panel;
            runId++;
            const thisRun = runId;
            let gotBoot = false;
            let gotClickBtn = false;
            // Single message handler
            const msgDisposable = panel.webview.onDidReceiveMessage((msg) => {
                if (!msg?.type)
                    return;
                if (msg.type === 'boot:loaded')
                    gotBoot = true;
                if (msg.type === 'ui:click' && (msg.id === 'btn' || msg.id === 'button1'))
                    gotClickBtn = true;
                if (msg.type === 'ready') {
                    panel.reveal(panel.viewColumn, false);
                }
            });
            panel.onDidChangeViewState((e) => {
                if (e.webviewPanel.visible) {
                    e.webviewPanel.reveal(e.webviewPanel.viewColumn, false);
                    e.webviewPanel.webview.postMessage({ type: 'focusNow' });
                }
            });
            const html = previewWebview.buildPreviewHtml(panel.webview);
            console.log('---------------------------html---------------------------');
            console.log(html);
            console.log('----------------------------------------------------------');
            panel.webview.html = html;
            panel.reveal(undefined, false);
            // English comments.
            // Force the webview to be the active editor so it receives pointer events.
            function forceActivate(panel) {
                panel.reveal(undefined, false); // bring to front
                setTimeout(() => panel.reveal(undefined, false), 50);
                setTimeout(() => panel.reveal(undefined, false), 200);
                setTimeout(() => panel.reveal(undefined, false), 500);
                // Bonus: steal focus back to VSCode then to panel (helps in some "zombie" cases)
                setTimeout(() => vscode.commands.executeCommand('workbench.action.focusActiveEditorGroup'), 20);
                setTimeout(() => panel.reveal(undefined, false), 80);
            }
            // After setting panel.webview.html:
            forceActivate(panel);
            // Whenever VSCode changes tab focus / group / visibility:
            panel.onDidChangeViewState(() => forceActivate(panel));
            // English comments.
            // Some VSCode/Electron builds need a delayed re-focus/reveal for pointer events.
            setTimeout(() => panel.reveal(undefined, false), 50);
            setTimeout(() => panel.reveal(undefined, false), 200);
            //const timeoutMs = 15000; // vous cliquez quand vous voulez
            let done = false;
            const timeoutMs = 3000;
            function maybeDone() {
                if (done)
                    return;
                if (gotBoot && gotClickBtn) {
                    done = true;
                    console.log(`[RUN ${thisRun}] OK boot=${gotBoot} clickBtn=${gotClickBtn}`);
                }
            }
            panel.webview.onDidReceiveMessage((msg) => {
                if (!msg?.type)
                    return;
                if (msg.type === 'boot:loaded')
                    gotBoot = true;
                if (msg.type === 'ui:click' && (msg.id === 'btn' || msg.id === 'button1'))
                    gotClickBtn = true;
                maybeDone();
            });
            setTimeout(() => {
                if (done)
                    return;
                done = true;
                console.log(`[RUN ${thisRun}] KO boot=${gotBoot} clickBtn=${gotClickBtn}`);
            }, timeoutMs);
            const timer = setTimeout(() => {
                console.log(`[RUN ${thisRun}] KO boot=${gotBoot} clickBtn=${gotClickBtn}`);
            }, timeoutMs);
            function maybeOk() {
                if (gotBoot && gotClickBtn) {
                    clearTimeout(timer);
                    console.log(`[RUN ${thisRun}] OK boot=${gotBoot} clickBtn=${gotClickBtn}`);
                }
            }
            /*
            panel.webview.onDidReceiveMessage((msg) => {
                    if (!msg?.type) return;

                    if (msg.type === 'boot:loaded') gotBoot = true;
                    if (msg.type === 'ui:click' && (msg.id === 'btn' || msg.id === 'button1')) gotClickBtn = true;

                    maybeOk();
            });
*/
            panel.onDidDispose(() => {
                clearTimeout(timer);
                msgDisposable.dispose();
                // Optional: log disposal for sanity
                // console.log(`${TAG} [RUN ${thisRun}] disposed`);
            });
        }));
        const provider = new previewWebview(context);
        const providerRegistration = vscode.window.registerCustomEditorProvider(previewWebview.viewType, provider, { webviewOptions: { retainContextWhenHidden: true } });
        return providerRegistration;
    }
    constructor(context) {
        this.context = context;
        this.isApplyingFromWebview = false;
        this._panel = undefined;
        //this.context = context;
    }
    static bodyAttrsToObject(bodyAttrs) {
        const out = {};
        // matches key="value" and key='value'
        const re = /([^\s=]+)\s*=\s*"([^"]*)"|([^\s=]+)\s*=\s*'([^']*)'/g;
        let m;
        while ((m = re.exec(bodyAttrs))) {
            const k = (m[1] ?? m[3]);
            const v = m[2] ?? m[4] ?? '';
            out[k] = v;
        }
        return out;
    }
    static buildPreviewHtml(webview) {
        const editor = vscode.window.activeTextEditor;
        if (!editor)
            return;
        const nonce = crypto.randomBytes(16).toString('base64url');
        const bootOnDisk = vscode.Uri.joinPath(previewWebview._context.extensionUri, 'media', 'boot.js');
        const zazaOnDisk = vscode.Uri.joinPath(previewWebview._context.extensionUri, 'media', 'zaza.compiled.js');
        const bootUri = webview.asWebviewUri(bootOnDisk);
        const compiledUri = webview.asWebviewUri(zazaOnDisk);
        // Keep CSP on ONE line, and allow VSCode webview source + nonce
        const vscodeInlineHash = `'sha256-javf7Fs9Ekx1AL0XUOEE6RODf6g4df/uGZ+0HsW6rxA='`;
        const csp = [
            `default-src 'none'`,
            `img-src ${webview.cspSource} https: data:`,
            `style-src ${webview.cspSource} 'unsafe-inline'`,
            `font-src ${webview.cspSource} https: data:`,
            `connect-src ${webview.cspSource} https:`,
            `script-src 'nonce-${nonce}' ${webview.cspSource} ${vscodeInlineHash}`,
            `script-src-elem 'nonce-${nonce}' ${webview.cspSource} ${vscodeInlineHash}`
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
  <div>
    <h1>Preview minimal</h1>
    <button data-component="my-button" data-name="button1" data-onclick="button1_onclick" id="btn">Click me</button>
  </div>

<script nonce="${nonce}" type="module" src="${bootUri}"></script>
<script nonce="${nonce}" type="module" src="${compiledUri}"></script>
</body>
</html>`;
    }
    /**
     * Called when our custom editor is opened.
     *
     *
     */
    async resolveCustomTextEditor(document, webviewPanel, _token) {
        this._panel = webviewPanel;
        this._extensionUri = previewWebview._context.extensionUri;
        // Setup initial content for the webview
        webviewPanel.webview.options = {
            enableScripts: true
        };
        webviewPanel.webview.html = this.getHtmlForWebview(webviewPanel.webview);
        function updateWebview() {
            const txt = document.getText();
            const { bodyInnerHtml, bodyAttrs, cssText } = splitHtmlForGrapes(txt);
            console.log('Attrs', bodyAttrs);
            webviewPanel.webview.postMessage({
                type: 'update',
                html: bodyInnerHtml,
                css: cssText
            });
        }
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
        // Hook up event handlers so that we can synchronize the webview with the text document.
        //
        // The text document acts as our model, so we have to sync change in the document to our
        // editor and sync changes in the editor back to the document.
        //
        // Remember that a single text document can also be shared between multiple custom
        // editors (this happens for example when you split a custom editor)
        let pendingTimer = undefined;
        const changeDocumentSubscription = vscode.workspace.onDidChangeTextDocument((e) => {
            if (e.document.uri.toString() !== document.uri.toString()) {
                return;
            }
            // Change initiated by webview -> don't echo back to webview
            if (this.isApplyingFromWebview) {
                return;
            }
            // Change initiated by VSCode/user/formatters -> update the webview (debounced)
            clearTimeout(pendingTimer);
            pendingTimer = setTimeout(() => {
                updateWebview(); // <- your postMessage to the webview
            }, 150);
        });
        // Read on next tick to be safe
        setTimeout(() => {
            //console.log('Document changed:', e.document.getText());
        }, 0);
        // Make sure we get rid of the listener when our editor is closed.
        webviewPanel.onDidDispose(() => {
            changeDocumentSubscription.dispose();
            if (pendingTimer) {
                clearTimeout(pendingTimer);
            }
        });
        let lastRev = 0;
        // Receive message from the webview.
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
                }
            }
        });
        //
        updateWebview();
    }
    /**
     * Get the static html used for the editor webviews.
     */
    getHtmlForWebview(webview) {
        // Local path to script and css for the webview
        // Use a nonce to whitelist which scripts can be run
        //const nonce = getNonce();
        if (!this._extensionUri || !this._panel) {
            return '';
        }
        const grapesCss = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'grapes.min.css'));
        const toto = vscode.Uri.joinPath(this._extensionUri, 'media', 'grapes.min.js');
        console.log('toto', toto.toString());
        const grapesJs = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'grapes.min.js'));
        return `
		<!doctype html>
		<html lang="en">
		<head>
		<meta charset="utf-8" />
		<title>GrapesJS</title>
		<style>
		body,
		html {
			height: 100%;
			margin: 0;
		}
		</style>


		content="default-src 'none';
			style-src ${this._panel.webview.cspSource} 'unsafe-inline';
			script-src ${this._panel.webview.cspSource} 'unsafe-inline';
			img-src ${this._panel.webview.cspSource} https: data:;
			font-src ${this._panel.webview.cspSource} https: data:;">
		<link rel="stylesheet" href="${grapesCss}">



		</head>

		<body>


		<script src="${grapesJs}"></script>

		<div id="gjs" style="height: 500px; overflow: hidden">




		<div class="panel">
			<h1 class="welcome">BOUDI BOUDI zozo !!!!!!!! Welcome to</h1>
			<div class="big-title">
			<svg class="logo" viewBox="0 0 100 100">
			<path
			d="M40 5l-12.9 7.4 -12.9 7.4c-1.4 0.8-2.7 2.3-3.7 3.9 -0.9 1.6-1.5 3.5-1.5 5.1v14.9 14.9c0 1.7 0.6 3.5 1.5 5.1 0.9 1.6 2.2 3.1 3.7 3.9l12.9 7.4 12.9 7.4c1.4 0.8 3.3 1.2 5.2 1.2 1.9 0 3.8-0.4 5.2-1.2l12.9-7.4 12.9-7.4c1.4-0.8 2.7-2.2 3.7-3.9 0.9-1.6 1.5-3.5 1.5-5.1v-14.9 -12.7c0-4.6-3.8-6-6.8-4.2l-28 16.2"
			/>
			</svg>
			<span>GrapesJS</span>
			</div>
			<div class="description">
			This is a demo content from index.html. For the development, you shouldn't edit this file, instead you can
			copy and rename it to _index.html, on next server start the new file will be served, and it will be ignored by
			git.
			</div>
		</div>
		<style>
			.panel {
			width: 90%;
			max-width: 700px;
			border-radius: 3px;
			padding: 30px 20px;
			margin: 150px auto 0px;
			background-color: #d983a6;
			box-shadow: 0px 3px 10px 0px rgba(0, 0, 0, 0.25);
			color: rgba(255, 255, 255, 0.75);
			font: caption;
			font-weight: 100;
			}

			.welcome {
			text-align: center;
			font-weight: 100;
			margin: 0px;
			}

			.logo {
			width: 70px;
			height: 70px;
			vertical-align: middle;
			}

			.logo path {
			pointer-events: none;
			fill: none;
			stroke-linecap: round;
			stroke-width: 7;
			stroke: #fff;
			}

			.big-title {
			text-align: center;
			font-size: 3.5rem;
			margin: 15px 0;
			}

			.description {
			text-align: justify;
			font-size: 1rem;
			line-height: 1.5rem;
			}
		</style>
		</div>

		<script type="text/javascript">

			const vscode = acquireVsCodeApi();
			//vscode.postMessage({ type: 'log', msg: 'et AH AH AH' });
			//console.log('et AH AH AH' );


			var editor = grapesjs.init
			({
				showOffsets: 1,
				noticeOnUnload: 0,
				container: '#gjs',
				height: '100%',
				fromElement: true,
				storageManager: { autoload: 0 },
				styleManager: 
				{
					sectors: 
					[
						{
							name: 'General',
							open: false,
							buildProps: ['float', 'display', 'position', 'top', 'right', 'left', 'bottom'],
						},
						{
							name: 'Flex',
							open: false,
							buildProps: 
							[
								'flex-direction',
								'flex-wrap',
								'justify-content',
								'align-items',
								'align-content',
								'order',
								'flex-basis',
								'flex-grow',
								'flex-shrink',
								'align-self',
							],
						},
						{
						name: 'Dimension',
						open: false,
						buildProps: ['width', 'height', 'max-width', 'min-height', 'margin', 'padding'],
						},
						{
							name: 'Typography',
							open: false,
							buildProps: 
							[
								'font-family',
								'font-size',
								'font-weight',
								'letter-spacing',
								'color',
								'line-height',
								'text-shadow',
							],
						},
						{
						name: 'Decorations',
						open: false,
						buildProps: 
						[
							'border-radius-c',
							'background-color',
							'border-radius',
							'border',
							'box-shadow',
							'background',
						],
						},
						{
						name: 'Extra',
						open: false,
						buildProps: ['transition', 'perspective', 'transform'],
						},
					],
				},
			});


			editor.BlockManager.add('testBlock', 
			{
				label: 'Block',
				attributes: { class: 'gjs-fonts gjs-f-b1' },
				content: \`<div style="padding-top:50px; padding-bottom:50px; text-align:center">Test block</div>\`,
			});

			editor.BlockManager.add('my-heading', 
			{
				label: 'Titre',
				category: 'Basic',
				content: '<h1>Mon titre</h1>',
			});



			editor.Components.addType('my-button', 
			{
				isComponent: (el) => 
				{
					// el est un HTMLElement quand Grapes parse du DOM/HTML
					if (el.tagName === 'BUTTON' && el.hasAttribute('data-onclick')) 
					{
						return { type: 'my-button' };
					}
					return false;
				},


				model: 
				{
					defaults: 
					{
						tagName: 'button',
						content: 'Clique-moi',
						attributes: 
						{
							'data-component': 'my-button',
							'data-name': 'Button1',
							'data-onclick': '',
							'data-color': 'default',
						},
						traits: 
						[
							{ type: 'text', name: 'data-name', label: 'Name' },
							{ type: 'text', name: 'data-onclick', label: 'onclick' },
							{ type: 'select', name: 'data-color', label: 'Color', options: 
								[
									{ id: 'default', name: 'Default' },
									{ id: 'primary', name: 'Primary' },
									{ id: 'warning', name: 'Warning' },
								]
							},
						],
					},
				},
			});

			editor.DomComponents.addType('text', 
			{
				model: 
				{
					defaults: 
					{
						traits: 
						[
							{
								type: 'text',
								label: 'OnClick',
								name: 'data-onclick',
								placeholder: 'handleClick',
							},
							{ type: 'text', name: 'data-name', label: 'Name' },
							{
								type: 'select', name: 'data-color', label: 'Color', options: 
								[
									{ id: 'default', name: 'Default' },
									{ id: 'primary', name: 'Primary' },
									{ id: 'warning', name: 'Warning' },
								]
							},

						],
					},
				},
			});

			editor.BlockManager.add('my-button-block', 
			{
				label: 'Bouton',
				category: 'My Components',
				content: 
				{
					type: 'my-button',
				},
			});

			editor.DomComponents.addType('delphine-body', 
			{
				extend: 'body',
				model: 
				{
					defaults: 
					{
						traits: 
						[
							{ type: 'text', label: 'OnCreate', name: 'data-oncreate', placeholder: 'FormCreate' },
							{ type: 'text', name: 'data-name', label: 'Name' },
							{ type: 'text', name: 'data-onclick', label: 'OnClick' },
							{
							type: 'select', name: 'data-color', label: 'Color',
							options: [
							{ id: 'default', name: 'Default' },
							{ id: 'primary', name: 'Primary' },
							{ id: 'warning', name: 'Warning' },
							],
							},
						],
					},
				},
			});

			function getBodyComponent(editor) 
			{
				const wrapper = editor.getWrapper();

				// In most cases, the <body> is the first component inside the wrapper
				const first = wrapper.components().at(0);
				console.log('FIRST', first.get('tagName'));
				if (first && (first.get('tagName') || '').toLowerCase() === 'body') return first;

				// Fallback: search by tagName
				const found = wrapper.find('[data-gjs-type]') // any selector, we just want to traverse
				console.log('Found : ', found);
				// Better: recursive search
				let body = null;
				wrapper.findType && (body = wrapper.findType('body')?.[0]);
				console.log('XXX', body);
				if (body) return body;

				// Another fallback: manual deep walk
				const walk = (cmp) => 
				{
					console.log('Walk:', cmp.get('tagName'));
					if ((cmp.get('tagName') || '').toLowerCase() === 'body') 
					{
						console.log('!!!FOUND!!!');
						return cmp;
					}
					for (const child of cmp.components().models) 
					{
						const res = walk(child);
						if (res) return res;
					}
					return null;
				};
				return walk(wrapper);
			}


			function applyDelphineBodyTraits() 
			{
				const wrapper = editor.getWrapper();
				console.log('Wrapper tag:', editor.getWrapper().get('tagName'));
				console.log('Wrapper children:', editor.getWrapper().components().length);
				for (let i = 0; i < editor.getWrapper().components().length; i++) 
				{
					console.log('Child tag:', i, editor.getWrapper().components().at(i)?.get('tagName'));
				}
				const bodyCmp = getBodyComponent(editor);
				if (!bodyCmp) {
					console.log('No BODY component found');
					return;
				}
				// IMPORTANT: defaults.traits ne se “rejouent” pas automatiquement après un set(type)
				const delphBodyType = editor.DomComponents.getType('delphine-body');
				const delphTraits = delphBodyType?.model?.prototype?.defaults?.traits
						?? delphBodyType?.model?.defaults?.traits;

				if (delphTraits) 
				{
				bodyCmp.set('traits', delphTraits);
				}

				bodyCmp.addAttributes({ 'data-component': 'TForm' });

				// debug
				console.log('BODY type now:', bodyCmp.get('type'));
  				console.log('BODY traits now:', bodyCmp.get('traits'));
			}

			

			let lastText = null;
			let lastCss = null;

			function loadDocument({ html, css }) 
			{
				if (html === lastText && css === lastCss) return;

				isApplyingFromVscode = true;
				lastText = html;
				lastCss = css;

				editor.DomComponents.clear();
				editor.CssComposer.clear();

				editor.setComponents(html);
				editor.setStyle(css);
				applyDelphineBodyTraits();
				// Release AFTER GrapesJS processed update
				requestAnimationFrame(() => 
				{
					isApplyingFromVscode = false;
				});
			}
			
		
			window.addEventListener('message', (event) => 
			{
				const msg = event.data;
				if (msg?.type === 'update') {
				loadDocument({ html: msg.html ?? '', css: msg.css ?? '' });
				}
			});

			let pendingExport = false;
			let rev = 0;
			let lastExportHtml = '';
			let lastExportCss = '';

			function scheduleExport(reason) 
			{
				if (isApplyingFromVscode) return;
				if (pendingExport) return;
				pendingExport = true;

				requestAnimationFrame(() => 
				{
					pendingExport = false;
					if (isApplyingFromVscode) return;

					const wrapper = editor.getWrapper();
					const html = wrapper ? wrapper.toHTML() : editor.getHtml();
					const css = editor.getCss();

					// ✅ IMPORTANT : si focus/sélection n'a rien changé -> ne rien envoyer
					if (html === lastExportHtml && css === lastExportCss) return;

					lastExportHtml = html;
					lastExportCss = css;

					vscode.postMessage({ type: 'contentChanged', html, css, rev: ++rev, reason });
				});
			}


			let inTextEdit = false;
			let pendingDirty = false;

			function markDirty(reason) 
			{
				// Si on est dans un champ texte, on ne commit pas tout de suite
				if (inTextEdit) {
					pendingDirty = true;
					// Optionnel: log minimal
					// console.log('dirty deferred:', reason);
					return;
				}
				scheduleExport(reason);
			}

			editor.on('rte:enable', () => 
			{
				inTextEdit = true;
				pendingDirty = false; // on repart propre au début d'une session RTE
			});

			editor.on('rte:disable', () => 
			{
				inTextEdit = false;
				// Commit final seulement si quelque chose a changé pendant RTE
				if (pendingDirty) {
					pendingDirty = false;
					scheduleExport('rte:disable commit');
				}
			});

			// Structure: on exporte tout de suite (ça vous marche déjà bien)
			editor.on('component:add component:remove style:property:update', () => 
			{
				markDirty('structure/style');
			});

			// Updates: si ça vient d'un edit texte, on diffère; sinon on exporte
			editor.on('component:update', () => 
			{
				markDirty('component:update');
			});
		</script>
		<div>ZOZO!!!</div>
		</body>
		</html>
		`;
    }
    /**
     * Try to get a current document as json text.
     */
    getDocumentAsJson(document) {
        const text = document.getText();
        if (text.trim().length === 0) {
            return {};
        }
        try {
            return JSON.parse(text);
        }
        catch {
            throw new Error('Could not get document as json. Content is not valid json');
        }
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
}
exports.previewWebview = previewWebview;
previewWebview.viewType = 'catCustoms.catScratch';
previewWebview.scratchCharacters = ['😸', '😹', '😺', '😻', '😼', '😽', '😾', '🙀', '😿', '🐱'];
//# sourceMappingURL=previewWebview.js.map