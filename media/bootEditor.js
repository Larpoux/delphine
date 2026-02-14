// boot.ts (compiled to boot.js)
// English comments as requested.
//import * as vscode from 'vscode';
console.log('[boot] top?', window === window.top);
console.log('[boot] parent===self?', window.parent === window);
console.log('[boot] typeof acquireVsCodeApi =', typeof globalThis.acquireVsCodeApi);
console.log('[boot] location =', location.href);
function findAcquireVsCodeApiFn() {
    // We may run inside an iframe (fake.html). VS Code might inject the API in a parent frame.
    const frames = [globalThis, window, window.parent, window.top];
    for (const f of frames) {
        try {
            const fn = f?.acquireVsCodeApi;
            if (typeof fn === 'function')
                return fn;
        }
        catch {
            // cross-origin or blocked; ignore
        }
    }
    return undefined;
}
const acquireFn = findAcquireVsCodeApiFn();
const vscode = acquireFn ? acquireFn() : undefined;
console.log('[bootEditor] frame', { top: window === window.top, hasApi: !!vscode });
vscode?.postMessage({ type: 'bootEditor:loaded' });
// Bridge: reçoit les messages des iframes (canvas GrapesJS) et les forward à VS Code
window.addEventListener('message', (ev) => {
    const msg = ev.data;
    if (!msg || msg.__delphine !== true)
        return;
    vscode?.postMessage(msg.payload);
});
function postToVsCode(payload) {
    // postMessage marche même cross-origin, contrairement à accéder parent.acquireVsCodeApi
    window.parent.postMessage({ __delphine: true, payload }, '*');
}
console.log('[boot] bridge installed');
console.log('[boot] starting, grapesjs=', window.grapesjs);
function grapesJSEditor(grapesJs) {
    //const grapesJs = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'grapes.min.js'));
    //const vscode = acquireVsCodeApi();
    //vscode.postMessage({ type: 'log', msg: 'et AH AH AH' });
    //console.log('et AH AH AH' );
    var editor = grapesJs.init({
        showOffsets: 1,
        noticeOnUnload: 0,
        container: '#gjs',
        height: '100%',
        fromElement: false,
        storageManager: { autoload: 0 },
        styleManager: {
            sectors: [
                {
                    name: 'General',
                    open: false,
                    buildProps: ['float', 'display', 'position', 'top', 'right', 'left', 'bottom']
                },
                {
                    name: 'Flex',
                    open: false,
                    buildProps: ['flex-direction', 'flex-wrap', 'justify-content', 'align-items', 'align-content', 'order', 'flex-basis', 'flex-grow', 'flex-shrink', 'align-self']
                },
                {
                    name: 'Dimension',
                    open: false,
                    buildProps: ['width', 'height', 'max-width', 'min-height', 'margin', 'padding']
                },
                {
                    name: 'Typography',
                    open: false,
                    buildProps: ['font-family', 'font-size', 'font-weight', 'letter-spacing', 'color', 'line-height', 'text-shadow']
                },
                {
                    name: 'Decorations',
                    open: false,
                    buildProps: ['border-radius-c', 'background-color', 'border-radius', 'border', 'box-shadow', 'background']
                },
                {
                    name: 'Extra',
                    open: false,
                    buildProps: ['transition', 'perspective', 'transform']
                }
            ]
        }
    });
    let isApplyingFromVscode = false;
    let pending = false;
    let lastHtml = '';
    let lastCss = '';
    let rev = 0;
    let inRte = false;
    let rteDirty = false;
    function exportNow(reason) {
        //const vscode = getVsCodeApi();
        const html = editor.getHtml(); // <- je conseille ça plutôt que wrapper.toHTML pour commencer
        const css = editor.getCss();
        if (html === lastHtml && css === lastCss)
            return;
        lastHtml = html;
        lastCss = css;
        //vscode?.postMessage({ type: 'contentChanged', html, css, rev: ++rev, reason });
        // vscode.postMessage(...)
        postToVsCode({ type: 'contentChanged', html, css, reason, rev: ++rev });
    }
    function scheduleExport(reason) {
        if (isApplyingFromVscode)
            return;
        // During RTE typing: don't export yet (model can be "behind")
        if (inRte) {
            rteDirty = true;
            return;
        }
        if (pending)
            return;
        pending = true;
        requestAnimationFrame(() => {
            pending = false;
            if (isApplyingFromVscode)
                return;
            exportNow(reason);
        });
    }
    console.log('[editorBoot] GrapesJS ready');
    window.addEventListener('message', (event) => {
        const msg = event.data;
        if (msg?.type !== 'doc:update')
            return;
        editor.setComponents(msg.html || '');
        editor.setStyle(msg.css || '');
        console.log('[editorBoot] document loaded');
    });
    // Change hooks (keep it simple first)
    editor.on('component:add component:remove component:update style:property:update', () => {
        scheduleExport('gjs:change');
    });
    // ---- RTE hooks (commit point) ----
    editor.on('rte:enable', () => {
        inRte = true;
        rteDirty = false;
    });
    editor.on('rte:disable', () => {
        inRte = false;
        if (rteDirty) {
            rteDirty = false;
            scheduleExport('gjs:rte:disable');
        }
    });
    // ---- Change hooks ----
    editor.on('component:add component:remove style:property:update', () => {
        scheduleExport('gjs:structure/style');
    });
    // This one fires a lot; keep it, but it will be deferred during RTE
    editor.on('component:update', () => {
        scheduleExport('gjs:component:update');
    });
    /*

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
*/
    return editor;
}
function waitForGrapesJs(timeoutMs = 5000) {
    const start = Date.now();
    return new Promise((resolve, reject) => {
        const tick = () => {
            const api = window.grapesjs;
            if (api && typeof api.init === 'function')
                return resolve(api);
            if (Date.now() - start > timeoutMs) {
                return reject(new Error('GrapesJS not found on window.grapesjs'));
            }
            setTimeout(tick, 25);
        };
        tick();
    });
}
async function main() {
    //const vscode = window.acquireVsCodeApi?.();
    try {
        const grapes = await waitForGrapesJs();
        console.log('grapes', grapes);
        const editor = grapesJSEditor(grapes);
        console.log('[editorBoot] Grapes ready', editor);
        //const vscode = getVsCodeApi();
        vscode?.postMessage?.({ type: 'boot:loaded' });
        // vscode.postMessage(...)
        postToVsCode({ type: 'bootEditor:loaded' });
    }
    catch (e) {
        console.error('[editorBoot] FAIL', e);
        //vscode?.postMessage?.({ type: 'boot:error', message: String((e as any)?.message ?? e) });
    }
}
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => void main());
}
else {
    void main();
}
export {};
