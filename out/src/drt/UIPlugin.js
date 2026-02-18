"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PluginHost = void 0;
// delphine-ui-plugin.ts
// A framework-agnostic contract.
// Delphine never talks to React/Vue/Svelte directly — only to this interface.
require("@vcl");
const _vcl_1 = require("@vcl");
// English comments as requested.
class PluginHost extends _vcl_1.TComponent {
    instance = null;
    constructor(name, form, parent) {
        super(name, form, parent);
        //this.form = form;
        //this.parent = parent;
        // you likely add this to parent's children elsewhere
    }
    mountPlugin(factory, props, services) {
        const container = this.htmlElement;
        if (!container)
            return;
        //this.instance = factory.mount(container, props, services);
    }
    update(props) {
        this.instance?.update?.(props);
    }
    unmount() {
        this.instance?.unmount?.();
        this.instance = null;
    }
}
exports.PluginHost = PluginHost;
//# sourceMappingURL=UIPlugin.js.map