"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TApplication = exports.TMetaButton = exports.TButton = exports.TForm = exports.TMetaForm = exports.TDocument = exports.TComponent = exports.ComponentRegistry = exports.TColor = exports.ComponentTypeRegistry = exports.TMetaComponent = void 0;
//import { ComponentTypeRegistry } from '../drt/UIPlugin'; // PAS "import type"
// //import type { Json, DelphineServices, ComponentTypeRegistry } from '../drt/UIPlugin';
//import { registerVclTypes } from './registerVcl';
//import { Button } from 'grapesjs';
const registerVcl_1 = require("./registerVcl");
// English comments as requested.
class TMetaComponent {
    constructor() { }
    /** Property schema for this component type */
    props() {
        return [];
    }
}
exports.TMetaComponent = TMetaComponent;
//import type { TComponentClass } from './TComponentClass';
//import type { TComponent } from '@vcl';
class ComponentTypeRegistry {
    // We store heterogeneous metas, so we keep them as TMetaComponent<any>.
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
exports.ComponentTypeRegistry = ComponentTypeRegistry;
/*

//export type ComponentFactory = (name: string, form: TForm, parent: TComponent) => TComponent;

export class ComponentTypeRegistry {
        private factories = new Map<string, ComponentFactory>();

        get(name: string): ComponentFactory | null | undefined {
                return this.factories.get(name);
        }

        registerType(typeName: string, factory: ComponentFactory) {
                this.factories.set(typeName, factory);
        }

        create(name: string, form: TForm, parent: TComponent): TComponent | null {
                const f = this.factories.get(name);
                return f ? f(name, form, parent) : null;
        }
}

*/
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
class ComponentRegistry {
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
    constructor() { }
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
    readProps(el, meta) {
        const out = {};
        for (const spec of meta.props()) {
            const raw = el.getAttribute(`data-${spec.name}`);
            if (raw == null)
                continue;
            out[spec.name] = this.convert(raw, spec.kind);
        }
        return out;
    }
    convert(raw, kind) {
        switch (kind) {
            case 'string':
                return raw;
            case 'number':
                return Number(raw);
            case 'boolean':
                return raw === 'true' || raw === '1' || raw === '';
            case 'color':
                return raw; // ou parse en TColor si vous avez
        }
    }
    applyProps(child, cls) {
        const props = this.readProps(child.elem, cls);
        for (const spec of cls.props()) {
            if (props[spec.name] !== undefined) {
                spec.apply(child, props[spec.name]);
            }
        }
    }
    buildComponentTree(form, component) {
        this.clear();
        // resolveRoot est maintenant appelé par TForm::show(). Inutile de le faire ici
        //const root = TDocument.body;
        //const root = (document.getElementById('delphine-root') ?? document.body) as HTMLElement;
        //const root = (document.body?.matches('[data-component]') ? document.body : null) ?? (document.getElementById('delphine-root') as HTMLElement | null) ?? document.body;
        //const root = this.resolveRoot();
        // --- FORM ---
        // provisoirement if (root.getAttribute('data-component') === 'TForm') {
        this.registerInstance(component.name, form);
        //}
        const root = component.elem;
        // --- CHILD COMPONENTS ---
        root.querySelectorAll(':scope > [data-component]').forEach((el) => {
            if (el === root)
                return;
            const name = el.getAttribute('data-name');
            const type = el.getAttribute('data-component');
            //const titi = el.getAttribute('data-onclick');
            //console.log(`titi = ${titi}`);
            //let comp: TComponent | null = null;
            // The following switch is just for now. In the future it will not be necessary
            /*
            switch (type) {
                    case 'my-button':
                            comp = new TButton(name!, form, form);
                            break;

                    case 'delphine-plugin':
                            //comp = new PluginHost(name, form, form);
                            break;

                    default:
                            break;
            }*/
            //const application: TApplication = new TApplication();
            //const factory = TApplication.TheApplication.types.get(type!);
            /*
            let comp: TComponent | null = null;
            if (factory) comp = factory(name!, form, form);

            if (comp) {
                    comp.elem = el;
                    this.register(name!, comp);
            }
                    */
            const cls = TApplication.TheApplication.types.get(type);
            if (!cls)
                return;
            const child = cls.create(name, form, component);
            // name: string, form: TForm, parent: TComponent, elem: HTMLElement
            if (!child)
                return;
            //child.parent = component;
            child.elem = el;
            //child.form = form;
            //child.name = name!;
            // Optional props
            this.applyProps(child, cls);
            this.registerInstance(name, child);
            component.children.push(child);
            const maybeHost = child;
            if (maybeHost && typeof maybeHost.setPluginSpec === 'function') {
                const plugin = el.getAttribute('data-plugin');
                const raw = el.getAttribute('data-props');
                const props = raw ? JSON.parse(raw) : {};
                maybeHost.setPluginSpec({ plugin, props });
                maybeHost.mountPluginIfReady(this.services);
                //maybeHost.mountFromRegistry(services);
            }
            if (child.allowsChildren()) {
                this.buildComponentTree(form, child);
            }
        });
    }
}
exports.ComponentRegistry = ComponentRegistry;
class TComponent {
    metaClass;
    name;
    parent = null;
    form = null;
    children = [];
    elem = null;
    get htmlElement() {
        return this.elem;
    }
    constructor(metaClass, name, form, parent) {
        this.metaClass = metaClass;
        this.name = name;
        this.parent = parent;
        parent?.children.push(this);
        this.form = form;
        this.name = name;
        //this.metaClass = metaClass;
    }
    /** May contain child components */
    allowsChildren() {
        return true;
    }
    get color() {
        return new TColor(this.getStyleProp('color'));
    }
    set color(v) {
        this.setStyleProp('color', v.s);
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
class TDocument {
    static document = new TDocument(document);
    static body = document.body;
    htmlDoc;
    constructor(htmlDoc) {
        this.htmlDoc = htmlDoc;
    }
}
exports.TDocument = TDocument;
class TMetaForm extends TMetaComponent {
    static metaClass = new TMetaForm();
    getMetaClass() {
        return TMetaForm.metaClass;
    }
    typeName = 'TForm';
    create(name, form, parent) {
        return new TForm(name);
    }
    props() {
        return [];
    }
}
exports.TMetaForm = TMetaForm;
class TForm extends TComponent {
    static forms = new Map();
    _mounted = false;
    componentRegistry = new ComponentRegistry();
    constructor(name) {
        super(TMetaForm.metaClass, name, null, null);
        this.form = this;
        TForm.forms.set(name, this);
        //this.parent = this;
    }
    get application() {
        return this.form?.application ?? TApplication.TheApplication;
    }
    /*        findFormFromEventTarget(currentTargetElem: Element): TForm | null {
            const formName = currentTargetElem.getAttribute('data-name');
            const form: TForm = TForm.forms.get(formName!)!;
            return form;
    }
            */
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
        for (const type in this.metaClass.domEvents) {
            root.addEventListener(type, handler, { capture: true, signal });
        }
    }
    disposeEventRouter() {
        this._ac?.abort();
        this._ac = null;
    }
    handleEvent(ev, el, attribute) {
        const handlerName = el.getAttribute(attribute);
        // If we found a handler on this element, dispatch it
        if (handlerName && handlerName !== '') {
            const name = el.getAttribute('data-name');
            const sender = name ? (this.componentRegistry.get(name) ?? null) : null;
            const maybeMethod = this[handlerName];
            if (typeof maybeMethod !== 'function') {
                console.log('NOT A METHOD', handlerName);
                return false;
            }
            // If sender is missing, fallback to the form itself (safe)
            maybeMethod.call(this, ev, sender ?? this);
            return true;
        }
        return false;
    }
    // We received an DOM Event. Dispatch it
    dispatchDomEvent(ev) {
        const targetElem = ev.target;
        if (!targetElem)
            return;
        const evType = ev.type;
        let el = targetElem.closest('[data-component]');
        while (el) {
            if (this.handleEvent(ev, el, `data-on${evType}`))
                return;
            //el = this.nextComponentElementUp(el);
            const name = el.getAttribute('data-name');
            const comp = name ? this.componentRegistry.get(name) : null;
            // Prefer your VCL-like parent chain when available
            const next = comp?.parent?.elem ?? null;
            // Fallback: standard DOM parent
            el = next ?? el.parentElement?.closest('[data-component]') ?? null;
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
            //mountPluginIfReady();
            //this.addEventListener('click');
            //this.addEventListener('input');
            //this.addEventListener('change');
            //this.addEventListener('keydown');
            this._mounted = true;
        }
        this.onShown();
        // TODO
    }
    /*
    addEventListenerxxx(type: string) {
            console.log('addEventListener ENTER', { hasBody: !!document.body, hasElem: !!this.elem });
            const g = window as any;

            // Abort old listeners (if any)
            if (g.__delphine_abort_controller) {
                    g.__delphine_abort_controller.abort();
            }
            const ac = new AbortController();
            g.__delphine_abort_controller = ac;
            const { signal } = ac;

            console.log('Installing global debug listeners (reset+reinstall)');

            const root = this.elem;
            if (!root) return;

            // Votre handler sur le root
            if (this.elem) {
                    // English comments as requested.

                    // English comments as requested.

                    root.addEventListener(
                            type,
                            (ev: Event) => {
                                    const targetElem = ev.target as Element | null;
                                    if (!targetElem) return;

                                    const form = this.findFormFromEventTarget(targetElem);
                                    if (!form) {
                                            console.log('No form resolved; event ignored');
                                            return;
                                    }

                                    const evType = ev.type;

                                    // Start from the clicked component (or any component wrapper)
                                    let t1: Element | null = targetElem.closest('[data-component]');
                                    while (t1) {
                                            const handlerName = t1.getAttribute(`data-on${evType}`);

                                            // If we found a handler on this element, dispatch it
                                            if (handlerName && handlerName !== '') {
                                                    const name = t1.getAttribute('data-name');
                                                    const sender = name ? (form.componentRegistry.get(name) ?? null) : null;

                                                    const maybeMethod = (form as any)[handlerName];
                                                    if (typeof maybeMethod !== 'function') {
                                                            console.log('NOT A METHOD', handlerName);
                                                            return;
                                                    }

                                                    // If sender is missing, fallback to the form itself (safe)
                                                    (maybeMethod as (this: TForm, sender: any) => any).call(form, sender ?? form);
                                                    return;
                                            }

                                            // No handler here: try going "up" using your component tree if possible
                                            const name = t1.getAttribute('data-name');
                                            const comp = name ? form.componentRegistry.get(name) : null;

                                            // Prefer your VCL-like parent chain when available
                                            const next = comp?.parent?.elem ?? null;

                                            // Fallback: standard DOM parent
                                            t1 = next ?? t1.parentElement?.closest('[data-component]') ?? null;
                                    }

                                    console.log('Event not handled');
                            },
                            true
                    );
            }
    }
            */
    onCreate() {
        //const btn = this.componentRegistry.get('button2');
        const onShownName = this.elem.getAttribute('data-oncreate');
        if (onShownName) {
            queueMicrotask(() => {
                const fn = this[onShownName];
                if (typeof fn === 'function')
                    fn.call(this, null, this);
            });
        }
        //if (btn) btn.color = TColor.rgb(0, 0, 255);
    }
    onShown() {
        //const btn = this.componentRegistry.get('button3');
        //if (btn) btn.color = TColor.rgb(0, 255, 255);
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
    _caption = '';
    htmlButton() {
        return this.htmlElement;
    }
    get caption() {
        return this._caption;
    }
    set caption(caption) {
        this.setCaption(caption);
    }
    setCaption(s) {
        this._caption = s;
        if (this.htmlElement)
            this.htmlElement.textContent = s;
    }
    _enabled = true;
    get enabled() {
        return this._enabled;
    }
    set enabled(enabled) {
        this.setEnabled(enabled);
    }
    setEnabled(enabled) {
        this._enabled = enabled;
        if (this.htmlElement)
            this.htmlButton().disabled = !enabled;
    }
    constructor(name, form, parent) {
        super(TMetaButton.metaClass, name, form, parent);
        //super(name, form, parent);
        //this.name = name;
        //this.form = form;
        //this.parent = parent;
    }
    allowsChildren() {
        return false;
    }
}
exports.TButton = TButton;
class TMetaButton extends TMetaComponent {
    constructor() {
        super();
    }
    static metaClass = new TMetaButton();
    getMetaClass() {
        return TMetaButton.metaClass;
    }
    typeName = 'TButton';
    create(name, form, parent) {
        return new TButton(name, form, parent);
    }
    props() {
        return [
            { name: 'caption', kind: 'string', apply: (o, v) => (o.caption = String(v)) },
            { name: 'enabled', kind: 'boolean', apply: (o, v) => (o.enabled = Boolean(v)) },
            { name: 'color', kind: 'color', apply: (o, v) => (o.color = v) }
        ];
    }
}
exports.TMetaButton = TMetaButton;
class TApplication {
    static TheApplication;
    //static pluginRegistry = new PluginRegistry();
    //plugins: IPluginRegistry;
    forms = [];
    types = new ComponentTypeRegistry();
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
//# sourceMappingURL=StdCtrls.js.map