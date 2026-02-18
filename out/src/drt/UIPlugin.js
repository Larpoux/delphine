"use strict";
// delphine-ui-plugin.ts
// A framework-agnostic contract.
// Delphine never talks to React/Vue/Svelte directly — only to this interface.
Object.defineProperty(exports, "__esModule", { value: true });
exports.PluginHost = exports.ComponentTypeRegistry = void 0;
const _vcl_1 = require("@vcl");
class ComponentTypeRegistry {
    factories = new Map();
    registerType(typeName, factory) {
        this.factories.set(typeName, factory);
    }
    create(name, form, parent) {
        const f = this.factories.get(name);
        return f ? f(name, form, parent) : null;
    }
}
exports.ComponentTypeRegistry = ComponentTypeRegistry;
// English comments as requested.
class PluginHost extends _vcl_1.TComponent {
    instance = null;
    constructor(name, form, parent) {
        super(name, form, parent);
        this.form = form;
        this.parent = parent;
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