"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PluginRegistry = exports.TPluginHost = exports.TMetaPluginHost = exports.TApplication = exports.TMetaApplication = exports.TMetaButton = exports.TButton = exports.TForm = exports.TMetaForm = exports.TMetaDocument = exports.TDocument = exports.TComponentRegistry = exports.TMetaComponentRegistry = exports.THandler = exports.TColor = exports.TComponentTypeRegistry = exports.TMetaComponentTypeRegistry = exports.TComponent = exports.TMetaComponent = exports.TMetaObject = exports.TObject = exports.TMetaclass = void 0;
const registerVcl_1 = require("./registerVcl");
class TMetaclass {
    typeName = 'TMetaclass';
    static metaclass;
    superClass = null;
    constructor(superClass, typeName = 'TMetaclass') {
        this.superClass = superClass;
        this.typeName = typeName;
    }
}
exports.TMetaclass = TMetaclass;
class TObject {
    getMetaClass() {
        return TMetaObject.metaClass;
    }
}
exports.TObject = TObject;
class TMetaObject extends TMetaclass {
    static metaClass = new TMetaObject(TMetaclass.metaclass);
    getMetaclass() {
        return TMetaObject.metaClass;
    }
    constructor(superClass) {
        super(superClass, 'TObject');
    }
}
exports.TMetaObject = TMetaObject;
class TMetaComponent extends TMetaclass {
    static metaclass = new TMetaComponent(TMetaclass.metaclass);
    // The symbolic name used in HTML: data-component="TButton" or "my-button"
    constructor(superClass) {
        super(superClass, 'TComponent');
    }
    getMetaclass() {
        return TMetaComponent.metaclass;
    }
    // Create the runtime instance and attach it to the DOM element.
    create(name, form, parent) {
        return new TComponent(name, form, parent);
    }
    //allDefPropsCollected: PropSpec<any>[] = [];
    //domEvents?(): string[]; // default [];
    /*
    // Optional: parse HTML attributes -> props/state
    // Example: data-caption="OK" -> { caption: "OK" }
    parseProps?(elem: HTMLElement): Json;

    // Optional: apply props to the component (can be called after create)
    applyProps?(c: T, props: Json): void;

    // Optional: Design-time metadata (palette, inspector, etc.)
    designTime?: {
            paletteGroup?: string;
            displayName?: string;
            icon?: string; // later
            // property schema could live here
    };
    */
    defProps() {
        return [
            { name: 'color', kind: 'color', apply: (o, v) => (o.color = new TColor(String(v))) },
            { name: 'onclick', kind: 'handler', apply: (o, v) => (o.onclick = new THandler(String(v))) }
            //{ name: 'oncreate', kind: 'handler', apply: (o, v) => (o.oncreate = new THandler(String(v))) }
        ];
    }
}
exports.TMetaComponent = TMetaComponent;
//type RawProp = Record<string, string>;
class TComponent {
    getMetaclass() {
        return TMetaComponent.metaclass;
    }
    name;
    parent = null;
    form = null;
    children = [];
    elem = null;
    get htmlElement() {
        return this.elem;
    }
    constructor(name, form, parent) {
        this.name = name;
        this.parent = parent;
        parent?.children.push(this);
        this.form = form;
        this.name = name;
    }
    //rawProps: RawProp[] = [];
    /** May contain child components */
    allowsChildren() {
        return false;
    }
    get color() {
        return this.props.color ?? new TColor('default');
    }
    set color(color) {
        this.props.color = color;
        const el = this.htmlElement;
        if (!el)
            return;
        this.setStyleProp('color', this.color.s);
    }
    get onclick() {
        return this.props.onclick ?? new THandler('');
    }
    set onclick(handler) {
        this.props.onclick = handler;
    }
    syncDomFromProps() {
        const el = this.htmlElement;
        if (!el)
            return;
        this.setStyleProp('color', this.color.s);
    }
    get backgroundColor() {
        return new TColor(this.getStyleProp('background-color'));
    }
    set backgroundColor(v) {
        this.setStyleProp('background-color', v.s);
    }
    get width() {
        return parseInt(this.getStyleProp('width'));
    }
    set width(v) {
        this.setStyleProp('width', v.toString());
    }
    get height() {
        return parseInt(this.getStyleProp('height'));
    }
    set height(v) {
        this.setStyleProp('height', v.toString());
    }
    get offsetWidth() {
        return this.htmlElement.offsetWidth;
    }
    get offsetHeight() {
        return this.htmlElement.offsetHeight;
    }
    setStyleProp(name, value) {
        this.htmlElement.style.setProperty(name, value);
    }
    getStyleProp(name) {
        return this.htmlElement.style.getPropertyValue(name);
    }
    setProp(name, value) {
        this.htmlElement.setAttribute(name, value);
    }
    getProp(name) {
        return this.htmlElement.getAttribute(name);
    }
}
exports.TComponent = TComponent;
class TMetaComponentTypeRegistry extends TMetaObject {
    static metaclass = new TMetaComponentTypeRegistry(TMetaObject.metaClass);
    constructor(superClass) {
        super(superClass);
        // et vous changez juste le nom :
        this.typeName = 'TObject';
    }
    getMetaclass() {
        return TMetaComponentTypeRegistry.metaclass;
    }
}
exports.TMetaComponentTypeRegistry = TMetaComponentTypeRegistry;
class TComponentTypeRegistry extends TObject {
    // We store heterogeneous metas, so we keep them as TMetaComponent<any>.
    getMetaclass() {
        return TMetaComponentTypeRegistry.metaClass;
    }
    classes = new Map();
    register(meta) {
        if (this.classes.has(meta.typeName)) {
            throw new Error(`Component type already registered: ${meta.typeName}`);
        }
        this.classes.set(meta.typeName, meta);
    }
    // If you just need "something meta", return any-meta.
    get(typeName) {
        return this.classes.get(typeName);
    }
    has(typeName) {
        return this.classes.has(typeName);
    }
    list() {
        return [...this.classes.keys()].sort();
    }
}
exports.TComponentTypeRegistry = TComponentTypeRegistry;
class TColor {
    s;
    constructor(s) {
        this.s = s;
    }
    /* factory */ static rgb(r, g, b) {
        return new TColor(`rgb(${r}, ${g}, ${b})`);
    }
    /* factory */ static rgba(r, g, b, a) {
        return new TColor(`rgba(${r}, ${g}, ${b}, ${a})`);
    }
}
exports.TColor = TColor;
class THandler {
    s;
    constructor(s) {
        this.s = s;
    }
    fire(form, handlerName, ev, sender) {
        const maybeMethod = form[this.s];
        if (typeof maybeMethod !== 'function') {
            console.log('NOT A METHOD', handlerName);
            return false;
        }
        // If sender is missing, fallback to the form itself (safe)
        maybeMethod.call(form, ev, sender ?? this);
    }
}
exports.THandler = THandler;
class TMetaComponentRegistry extends TMetaclass {
    static metaclass = new TMetaComponentRegistry(TMetaclass.metaclass);
    constructor(superClass) {
        super(superClass, 'TComponentRegistry');
    }
    getMetaclass() {
        return TMetaComponentRegistry.metaclass;
    }
}
exports.TMetaComponentRegistry = TMetaComponentRegistry;
class TComponentRegistry extends TObject {
    getMetaclass() {
        return TMetaComponentRegistry.metaclass;
    }
    instances = new Map();
    logger = {
        debug(msg, data) { },
        info(msg, data) { },
        warn(msg, data) { },
        error(msg, data) { }
    };
    eventBus = {
        on(event, handler) {
            return () => void {};
        },
        emit(event, payload) { }
    };
    storage = {
        get(key) {
            return null;
        },
        set(key, value) {
            return null;
        },
        remove(key) {
            return null;
        }
    };
    constructor() {
        super();
    }
    registerInstance(name, c) {
        this.instances.set(name, c);
    }
    get(name) {
        return this.instances.get(name);
    }
    services = {
        log: this.logger,
        bus: this.eventBus,
        storage: this.storage
    };
    clear() {
        this.instances.clear();
    }
    resolveRoot() {
        // Prefer body as the canonical root.
        if (document.body?.dataset?.component)
            return document.body;
        // Backward compatibility: old wrapper div.
        const legacy = document.getElementById('delphine-root');
        if (legacy)
            return legacy;
        // Last resort.
        return document.body ?? document.documentElement;
    }
    convert(raw, kind) {
        if (typeof raw === 'string') {
            switch (kind) {
                case 'string':
                    return raw;
                case 'number':
                    return Number(raw);
                case 'boolean':
                    return raw === 'true' || raw === '1' || raw === '';
                case 'color':
                    return new TColor(raw); // ou parse en TColor si vous avez
                case 'handler':
                    return new THandler(raw);
            }
        }
    }
    // Parse HTML attributes into a plain object
    // This function is called juste once, in buildComponentTree(), after the Form is created.
    parsePropsFromElement(el, defProps) {
        const out = {};
        // 1) JSON bulk
        const raw = el.getAttribute('data-props');
        if (raw) {
            try {
                const r = raw ? JSON.parse(raw) : {};
                //for (const p of props()) {
                for (const spec of defProps) {
                    const v = r[spec.name];
                    if (v != undefined && v != null) {
                        const value = this.convert(v, spec.kind);
                        out[spec.name] = value; // This is done by spec.apply()
                        //spec.apply(out, v);
                    }
                }
                //}
            }
            catch (e) {
                console.error('Invalid JSON in data-props', raw, e);
            }
        }
        // 2) Whitelist: only declared props override / complement
        //const defProps = this.collectDefProps();
        for (const p of defProps) {
            const attr = el.getAttribute(`data-${p.name}`);
            if (attr !== null) {
                const x = this.convert(attr, p.kind);
                out[p.name] = x;
            }
        }
        return out;
    }
    collectDefProps(comp) {
        const out = [];
        const seen = new Set();
        // Walk up metaclass inheritance: this -> super -> super...
        let mc = comp;
        while (mc) {
            if (typeof mc.defProps === 'function') {
                for (const spec of mc.defProps()) {
                    // Child overrides parent if same name.
                    if (!seen.has(spec.name)) {
                        out.push(spec);
                        seen.add(spec.name);
                    }
                }
            }
            mc = mc.superClass ?? null;
        }
        return out;
    }
    processElem(el, form, parent) {
        const name = el.getAttribute('data-name');
        const type = el.getAttribute('data-component');
        const cls = TApplication.TheApplication.types.get(type);
        if (!cls)
            return;
        let child = parent;
        if (cls != TMetaForm.metaclass) {
            // The TForm is already created by the user.
            child = cls.create(name, form, parent);
        }
        this.registerInstance(name, child);
        // name: string, form: TForm, parent: TComponent, elem: HTMLElement
        if (!child)
            return;
        //child.parent = component;
        child.elem = el;
        //child.form = form;
        //child.name = name!;
        // Optional props
        // We collect
        const allDefPropsCollected = this.collectDefProps(cls); // This is done during runtime, but could be done at compiletime
        child.props = this.parsePropsFromElement(el, allDefPropsCollected);
        child.syncDomFromProps();
        //const rawProps = child.rawProps;
        //child.props = new Object();
        //for (const props in child.props) {
        //const props = cls.applyPropsFromElement(child, el);
        //child.props = props;
        child.onAttachedToDom?.();
        //this.applyProps(child, cls);
        parent.children.push(child);
        const maybeHost = child;
        if (maybeHost && typeof maybeHost.setPluginSpec === 'function') {
            const plugin = el.getAttribute('data-plugin');
            const raw = el.getAttribute('data-props');
            const props = raw ? JSON.parse(raw) : {};
            maybeHost.setPluginSpec({ plugin, props });
            maybeHost.mountPluginIfReady(this.services);
            //maybeHost.mountFromRegistry(services);
        }
        // Actually this does not work for TForm : infinite recursion
        if (child.allowsChildren()) {
            //this.buildComponentTree(form, child);
        }
        //if (el === root) return; // No need to go higher in the hierachy
    }
    // This function is called juste once, when the form is created
    buildComponentTree(form, root) {
        this.clear();
        // --- FORM ---
        // provisoirement if (root.getAttribute('data-component') === 'TForm') {
        //const el = root.elem!;
        //this.registerInstance(root.name, form);
        //}
        const rootElem = root.elem;
        this.processElem(rootElem, form, root);
        // --- CHILD COMPONENTS ---
        rootElem.querySelectorAll(':scope > [data-component]').forEach((el) => {
            this.processElem(el, form, root);
            //if (el === root) return;
        });
    }
}
exports.TComponentRegistry = TComponentRegistry;
class TDocument extends TObject {
    static document = new TDocument(document);
    static body = document.body;
    htmlDoc;
    constructor(htmlDoc) {
        super();
        this.htmlDoc = htmlDoc;
    }
}
exports.TDocument = TDocument;
class TMetaDocument extends TMetaObject {
    static metaclass = new TMetaDocument(TMetaObject.metaclass);
    constructor(superClass) {
        super(superClass);
        // et vous changez juste le nom :
        this.typeName = 'TDocument';
    }
    getMetaclass() {
        return TMetaDocument.metaclass;
    }
}
exports.TMetaDocument = TMetaDocument;
class TMetaForm extends TMetaComponent {
    static metaclass = new TMetaForm(TMetaComponent.metaclass);
    getMetaClass() {
        return TMetaForm.metaclass;
    }
    constructor(superClass) {
        super(superClass);
        // et vous changez juste le nom :
        this.typeName = 'TForm';
    }
    //readonly typeName = 'TForm';
    create(name, form, parent) {
        return new TForm(name);
    }
    //props(): PropSpec<TForm>[] {
    //return [];
    //}
    defProps() {
        return [
        //{ name: 'caption', kind: 'string', apply: (o, v) => (o.caption = String(v)) },
        //{ name: 'enabled', kind: 'boolean', apply: (o, v) => (o.enabled = Boolean(v)) }
        ];
    }
}
exports.TMetaForm = TMetaForm;
//type FormProps = ComponentProps & {
//caption?: string;
//enabled?: boolean;
//color?: TColor; // ou TColor, etc.
//};
class TForm extends TComponent {
    getMetaclass() {
        return TMetaForm.metaclass;
    }
    allowsChildren() {
        return true;
    }
    static forms = new Map();
    _mounted = false;
    // Each Form has its own componentRegistry
    componentRegistry = new TComponentRegistry();
    constructor(name) {
        super(name, null, null);
        this.form = this;
        TForm.forms.set(name, this);
    }
    get application() {
        return this.form?.application ?? TApplication.TheApplication;
    }
    // English comments as requested.
    findFormFromEventTarget(target) {
        // 1) Find the nearest element that looks like a form container
        const formElem = target.closest('[data-component="TForm"][data-name]');
        if (!formElem)
            return null;
        // 2) Resolve the TForm instance
        const formName = formElem.getAttribute('data-name');
        if (!formName)
            return null;
        return TForm.forms.get(formName) ?? null;
    }
    _ac = null;
    installEventRouter() {
        this._ac?.abort();
        this._ac = new AbortController();
        const { signal } = this._ac;
        const root = this.elem;
        if (!root)
            return;
        // same handler for everybody
        const handler = (ev) => this.dispatchDomEvent(ev);
        for (const type of ['click', 'input', 'change', 'keydown']) {
            root.addEventListener(type, handler, { capture: true, signal });
        }
        for (const type in this.getMetaclass().domEvents) {
            root.addEventListener(type, handler, { capture: true, signal });
        }
    }
    disposeEventRouter() {
        this._ac?.abort();
        this._ac = null;
    }
    // We received an DOM Event. Dispatch it
    dispatchDomEvent(ev) {
        const targetElem = ev.target;
        if (!targetElem)
            return;
        const propName = `on${ev.type}`;
        let el = targetElem.closest('[data-component]');
        if (!el)
            return;
        const name = el.getAttribute('data-name');
        let comp = name ? this.componentRegistry.get(name) : null;
        while (comp) {
            const handler = comp?.props[propName];
            if (handler && handler.s && handler.s != '') {
                handler.fire(this, propName, ev, comp);
                return;
            }
            //el = next ?? el.parentElement?.closest('[data-component]') ?? null;
            comp = comp.parent;
        }
        // No handler here: try going "up" using your component tree if possible
    }
    show() {
        // Must be done before buildComponentTree() because `buildComponentTree()` does not do `resolveRoot()` itself.
        if (!this.elem) {
            this.elem = this.componentRegistry.resolveRoot(); // ou this.resolveRoot()
        }
        if (!this._mounted) {
            this.componentRegistry.buildComponentTree(this, this);
            this.onCreate(); // Maybe could be done after installEventRouter()
            this.installEventRouter();
            this._mounted = true;
        }
        this.onShown();
        // TODO
    }
    onCreate() {
        const onShownName = this.elem.getAttribute('data-oncreate');
        if (onShownName) {
            queueMicrotask(() => {
                const fn = this[onShownName];
                if (typeof fn === 'function')
                    fn.call(this, null, this);
            });
        }
    }
    onShown() {
        const onShownName = this.elem.getAttribute('data-onshown');
        if (onShownName) {
            queueMicrotask(() => {
                const fn = this[onShownName];
                if (typeof fn === 'function')
                    fn.call(this, null, this);
            });
        }
    }
}
exports.TForm = TForm;
class TButton extends TComponent {
    getMetaclass() {
        return TMetaButton.metaclass;
    }
    htmlButton() {
        return this.htmlElement;
    }
    get bprops() {
        return this.props;
    }
    get caption() {
        return this.bprops.caption ?? '';
    }
    set caption(caption) {
        this.bprops.caption = caption;
        const el = this.htmlElement;
        if (!el)
            return;
        el.textContent = this.caption;
    }
    get enabled() {
        return this.bprops.enabled ?? true;
    }
    set enabled(enabled) {
        this.bprops.enabled = enabled;
        this.htmlButton().disabled = !enabled;
    }
    constructor(name, form, parent) {
        super(name, form, parent);
    }
    syncDomFromProps() {
        const el = this.htmlElement;
        if (!el)
            return;
        el.textContent = this.caption;
        this.htmlButton().disabled = !this.enabled;
        super.syncDomFromProps();
    }
}
exports.TButton = TButton;
class TMetaButton extends TMetaComponent {
    static metaclass = new TMetaButton(TMetaComponent.metaclass);
    constructor(superClass) {
        super(superClass);
        // et vous changez juste le nom :
        this.typeName = 'TButton';
    }
    getMetaclass() {
        return TMetaButton.metaclass;
    }
    typeName = 'TButton';
    create(name, form, parent) {
        return new TButton(name, form, parent);
    }
    defProps() {
        return [
            { name: 'caption', kind: 'string', apply: (o, v) => (o.caption = String(v)) },
            { name: 'enabled', kind: 'boolean', apply: (o, v) => (o.enabled = Boolean(v)) }
        ];
    }
}
exports.TMetaButton = TMetaButton;
class TMetaApplication extends TMetaclass {
    static metaclass = new TMetaApplication(TMetaclass.metaclass);
    constructor(superClass) {
        super(superClass, 'TApplication');
    }
    getMetaclass() {
        return TMetaApplication.metaclass;
    }
}
exports.TMetaApplication = TMetaApplication;
class TApplication {
    getMetaclass() {
        return TMetaApplication.metaclass;
    }
    static TheApplication;
    //static pluginRegistry = new PluginRegistry();
    //plugins: IPluginRegistry;
    forms = [];
    types = new TComponentTypeRegistry();
    mainForm = null;
    constructor() {
        TApplication.TheApplication = this;
        (0, registerVcl_1.registerBuiltins)(this.types);
    }
    createForm(ctor, name) {
        const f = new ctor(name);
        this.forms.push(f);
        if (!this.mainForm)
            this.mainForm = f;
        return f;
    }
    run() {
        this.runWhenDomReady(() => {
            if (this.mainForm)
                this.mainForm.show();
            else
                this.autoStart();
        });
    }
    autoStart() {
        // fallback: choisir une form enregistrée, ou créer une form implicite
    }
    runWhenDomReady(fn) {
        if (document.readyState === 'loading') {
            window.addEventListener('DOMContentLoaded', fn, { once: true });
        }
        else {
            fn();
        }
    }
}
exports.TApplication = TApplication;
// ============================================= PLUGINHOST ==========================================================
/*

export class VueComponent extends TComponent {}

export class ReactComponent extends TComponent {}

export class SvelteComponent extends TComponent {}

export class PluginHost<Props extends Json = Json> extends TComponent {
        private plugin: Plugin<Props>;
        private services: DelphineServices;
        private mounted = false;

        constructor(plugin: UIPlugin<Props>, services: DelphineServices) {
                super('toto', null, null);
                this.plugin = plugin;
                this.services = services;
        }

        mount(props: Props) {
                if (this.mounted) throw new Error('Plugin already mounted');
                //this.plugin.mount(this.htmlElement, props, this.services);
                this.mounted = true;
        }

        update(props: Props) {
                if (!this.mounted) throw new Error('Plugin not mounted');
                this.plugin.update(props);
        }

        unmount() {
                if (!this.mounted) return;
                this.plugin.unmount();
                this.mounted = false;
        }
}
        */
class TMetaPluginHost extends TMetaComponent {
    static metaclass = new TMetaPluginHost(TMetaComponent.metaclass);
    getMetaclass() {
        return TMetaPluginHost.metaclass;
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
class TPluginHost extends TComponent {
    instance = null;
    pluginName = null;
    pluginProps = {};
    factory = null;
    constructor(name, form, parent) {
        super(name, form, parent);
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
        const app = TApplication.TheApplication; // ou un accès équivalent
        const def = PluginRegistry.pluginRegistry.get(this.pluginName);
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
class PluginRegistry {
    static pluginRegistry = new PluginRegistry();
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
//# sourceMappingURL=StdCtrls.js.map