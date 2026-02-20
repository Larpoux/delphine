"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TPluginHost = exports.TMetaPluginHost = exports.PluginRegistry = void 0;
exports.registerChartJsPie = registerChartJsPie;
exports.registerUserPlugins = registerUserPlugins;
const _vcl_1 = require("@vcl");
class PluginRegistry {
    plugins = new Map();
    register(name, def) {
        if (this.plugins.has(name))
            throw new Error(`Plugin already registered: ${name}`);
        this.plugins.set(name, def);
    }
    get(name) {
        return this.plugins.get(name);
    }
    has(name) {
        return this.plugins.has(name);
    }
}
exports.PluginRegistry = PluginRegistry;
// ==================================================================================== PluginHost ============================================================================================
class TMetaPluginHost extends _vcl_1.TMetaComponent {
    static metaClass = new TMetaPluginHost();
    getMetaClass() {
        return TMetaPluginHost.metaClass;
    }
    typeName = 'TPluginHost';
    create(name, form, parent) {
        return new TPluginHost(name, form, parent);
    }
    props() {
        return [];
    }
}
exports.TMetaPluginHost = TMetaPluginHost;
class TPluginHost extends _vcl_1.TComponent {
    static pluginRegistry = new PluginRegistry();
    instance = null;
    pluginName = null;
    pluginProps = {};
    factory = null;
    constructor(name, form, parent) {
        super(TMetaPluginHost.metaClass, name, form, parent);
    }
    // Called by the metaclass (or by your registry) right after creation
    setPluginFactory(factory) {
        this.factory = factory;
    }
    mountPlugin(props, services) {
        const container = this.htmlElement;
        if (!container)
            return;
        if (!this.factory) {
            services.log.warn('TPluginHost: no plugin factory set', { host: this.name });
            return;
        }
        // Dispose old instance if any
        this.unmount();
        // Create plugin instance then mount
        this.instance = this.factory({ host: this, form: this.form });
        this.instance.mount(container, props, services);
    }
    // Called by buildComponentTree()
    setPluginSpec(spec) {
        this.pluginName = spec.plugin;
        this.pluginProps = spec.props ?? {};
    }
    // Called by buildComponentTree()
    mountPluginIfReady(services) {
        const container = this.htmlElement;
        if (!container || !this.form || !this.pluginName)
            return;
        const app = _vcl_1.TApplication.TheApplication; // ou un accès équivalent
        const def = TPluginHost.pluginRegistry.get(this.pluginName);
        if (!def) {
            services.log.warn('Unknown plugin', { plugin: this.pluginName });
            return;
        }
        this.unmount();
        this.instance = def.factory({ host: this, form: this.form });
        this.instance.mount(container, this.pluginProps, services);
    }
    update(props) {
        this.pluginProps = props;
        this.instance?.update(props);
    }
    unmount() {
        try {
            this.instance?.unmount();
        }
        finally {
            this.instance = null;
        }
    }
}
exports.TPluginHost = TPluginHost;
// ===========================================================  Hello  ===========================================================================
function registerChartJsPie(app) {
    TPluginHost.pluginRegistry.register('chartjs-pie', {
        factory: ({ host, form }) => new ChartJsPieInstance()
    });
}
//import { registerChartJsPie } from './plugins/chartjs-pie';
function registerUserPlugins(app) {
    registerChartJsPie(app);
}
class ChartJsPieInstance {
    id = 'toto';
    mount(container, props, services) { }
    // Called any time props change (may be frequent).
    update(props) { }
    // Called exactly once before disposal.
    unmount() { }
}
//# sourceMappingURL=UIPlugin.js.map