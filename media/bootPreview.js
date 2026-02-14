console.log('[boot] starting, grapesjs=', window.grapesjs);
function tryAcquireVsCodeApi() {
    try {
        // acquireVsCodeApi exists only inside a real VSCode webview
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const api = globalThis.acquireVsCodeApi?.();
        return api ?? null;
    }
    catch {
        return null;
    }
}
function post(msg) {
    const api = window.__delphineVsCodeApi;
    if (api)
        api.postMessage(msg);
}
function setBtnRedIfExists(target) {
    const el = target instanceof Element ? target : null;
    if (!el)
        return;
    // Make the "life signal" visible.
    if (el.id === 'btn') {
        el.style.color = 'rgb(255, 0, 0)';
    }
}
function installListenersOnce() {
    if (window.__delphineBootInstalled)
        return;
    window.__delphineBootInstalled = true;
    console.log('[boot] installed');
    // Tell extension host we are alive (optional).
    post({ type: 'boot:loaded' });
    // Capture phase is more robust when other code stops propagation.
    document.addEventListener('pointerdown', (e) => {
        // Useful probe when debugging "dead" runs.
        const t = e.target;
        if (t && t.id === 'btn') {
            console.log('[boot] pointerdown #btn');
        }
    }, true);
    document.addEventListener('click', (e) => {
        setBtnRedIfExists(e.target);
        const t = e.target;
        if (!t)
            return;
        // Example: report button click to extension (optional).
        if (t.id === 'btn') {
            console.log('[boot] click #btn');
            post({ type: 'ui:click', id: 'btn' });
        }
    }, true);
    // Optional: react to extension asking us to focus something.
    window.addEventListener('message', (ev) => {
        const msg = ev.data;
        if (!msg?.type)
            return;
        if (msg.type === 'focusNow') {
            // Focus the button if present, otherwise focus body.
            const btn = document.getElementById('btn');
            if (btn)
                btn.focus();
            else
                document.body?.focus();
        }
    });
}
function main() {
    // Avoid running too early if DOM isn’t ready yet.
    const start = Date.now();
    const retryEveryMs = 50;
    const maxWaitMs = 1500;
    const tick = () => {
        if (!window.__delphineVsCodeApi) {
            window.__delphineVsCodeApi = tryAcquireVsCodeApi();
        }
        // Install listeners even if the VSCode API is not available
        // (so "preview" still works outside real webview contexts).
        if (window.__delphineVsCodeApi) {
            console.log('[boot] api=true');
            installListenersOnce();
            return;
        }
        if (Date.now() - start >= maxWaitMs) {
            console.log('[boot] api=false (gave up)');
            installListenersOnce();
            return;
        }
        setTimeout(tick, retryEveryMs);
    };
    // If the document is still loading, wait for it.
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', tick, { once: true });
    }
    else {
        tick();
    }
}
// Run after DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', main);
}
else {
    main();
}
export {};
