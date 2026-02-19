"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TApplication = exports.TButtonClass = exports.TButton = exports.TForm = exports.TDocument = exports.TComponent = exports.ComponentRegistry = exports.TColor = exports.ComponentTypeRegistry = void 0;
//import { ComponentTypeRegistry } from '../drt/UIPlugin'; // PAS "import type"
// //import type { Json, DelphineServices, ComponentTypeRegistry } from '../drt/UIPlugin';
//import { registerVclTypes } from './registerVcl';
const registerVcl_1 = require("./registerVcl");
//import type { TComponentClass } from './TComponentClass';
//import type { TComponent } from '@vcl';
// English comments as requested.
class ComponentTypeRegistry {
    classes = new Map();
    register(cls) {
        if (this.classes.has(cls.typeName)) {
            throw new Error(`Component type already registered: ${cls.typeName}`);
        }
        this.classes.set(cls.typeName, cls);
    }
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
    constructor() { }
    registerInstance(name, c) {
        this.instances.set(name, c);
    }
    get(name) {
        return this.instances.get(name);
    }
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
            const child = cls.create(name, form, component, el);
            // name: string, form: TForm, parent: TComponent, elem: HTMLElement
            if (!child)
                return;
            child.parent = component;
            child.elem = el;
            child.form = form;
            // Optional props
            if (cls.parseProps && cls.applyProps) {
                const props = cls.parseProps(el);
                cls.applyProps(child, props);
            }
            this.registerInstance(name, child);
            component.children.push(child);
            if (child.allowsChildren()) {
                this.buildComponentTree(form, child);
            }
        });
        form.addEventListener('click');
    }
}
exports.ComponentRegistry = ComponentRegistry;
class TComponent {
    parent = null;
    form = null;
    children = [];
    elem = null;
    get htmlElement() {
        return this.elem;
    }
    name;
    constructor(name, form, parent) {
        this.name = name;
        this.parent = parent;
        parent?.children.push(this);
        this.form = form;
        this.name = name;
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
class TForm extends TComponent {
    static forms = new Map();
    _mounted = false;
    componentRegistry = new ComponentRegistry();
    constructor(name) {
        super(name, null, null);
        this.form = this;
        TForm.forms.set(name, this);
        //this.parent = this;
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
    show() {
        // Must be done before buildComponentTree() because `buildComponentTree()` does not do `resolveRoot()` itself.
        if (!this.elem) {
            this.elem = this.componentRegistry.resolveRoot(); // ou this.resolveRoot()
        }
        if (!this._mounted) {
            this.componentRegistry.buildComponentTree(this, this);
            this._mounted = true;
        }
        // TODO
    }
    addEventListener(type) {
        console.log('addEventListener ENTER', { hasBody: !!document.body, hasElem: !!this.elem });
        const g = window;
        // Abort old listeners (if any)
        if (g.__delphine_abort_controller) {
            g.__delphine_abort_controller.abort();
        }
        const ac = new AbortController();
        g.__delphine_abort_controller = ac;
        const { signal } = ac;
        console.log('Installing global debug listeners (reset+reinstall)');
        const root = this.elem;
        if (!root)
            return;
        // Votre handler sur le root
        if (this.elem) {
            // English comments as requested.
            // English comments as requested.
            root.addEventListener(type, (ev) => {
                const targetElem = ev.target;
                if (!targetElem)
                    return;
                const form = this.findFormFromEventTarget(targetElem);
                if (!form) {
                    console.log('No form resolved; event ignored');
                    return;
                }
                const evType = ev.type;
                // Start from the clicked component (or any component wrapper)
                let t1 = targetElem.closest('[data-component]');
                while (t1) {
                    const handlerName = t1.getAttribute(`data-on${evType}`);
                    // If we found a handler on this element, dispatch it
                    if (handlerName && handlerName !== '') {
                        const name = t1.getAttribute('data-name');
                        const sender = name ? (form.componentRegistry.get(name) ?? null) : null;
                        const maybeMethod = form[handlerName];
                        if (typeof maybeMethod !== 'function') {
                            console.log('NOT A METHOD', handlerName);
                            return;
                        }
                        // If sender is missing, fallback to the form itself (safe)
                        maybeMethod.call(form, sender ?? form);
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
            }, true);
        }
    }
}
exports.TForm = TForm;
class TButton extends TComponent {
    caption = '';
    constructor(name, form, parent) {
        super(name, form, parent);
        //super(name, form, parent);
        //this.name = name;
        //this.form = form;
        //this.parent = parent;
    }
    allowsChildren() {
        return false;
    }
    setCaption(s) {
        this.caption = s;
        if (this.htmlElement)
            this.htmlElement.textContent = s;
    }
}
exports.TButton = TButton;
// English comments as requested.
exports.TButtonClass = {
    typeName: 'TButton',
    create(name, form, parent, elem) {
        const b = new TButton(name, form, parent);
        b.elem = elem;
        return b;
    },
    parseProps(elem) {
        // Minimal example: data-caption="OK"
        const caption = elem.getAttribute('data-caption') ?? '';
        return { caption };
    },
    applyProps(b, props) {
        // Note: props is Json; narrow it safely.
        const o = props;
        if (typeof o.caption === 'string')
            b.setCaption(o.caption);
    },
    designTime: {
        paletteGroup: 'Standard',
        displayName: 'Button'
    }
};
class TApplication {
    static TheApplication;
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