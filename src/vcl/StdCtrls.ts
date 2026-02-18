//import { ComponentTypeRegistry } from '../drt/UIPlugin'; // PAS "import type"
// //import type { Json, DelphineServices, ComponentTypeRegistry } from '../drt/UIPlugin';
import { registerVclTypes } from './registerVcl';

export type ComponentFactory = (name: string, form: TForm, owner: TComponent) => TComponent;

/*
export class ComponentRegistry {
        private factories = new Map<string, ComponentFactory>();

        registerType(typeName: string, factory: ComponentFactory): void {
                this.factories.set(typeName, factory);
        }

        has(typeName: string): boolean {
                return this.factories.has(typeName);
        }

        create(typeName: string, name: string, form: TForm, owner: TComponent): TComponent | null {
                const f = this.factories.get(typeName);
                return f ? f(name, form, owner) : null;
        }
}
        */

export class TColor {
        s: string;

        constructor(s: string) {
                this.s = s;
        }
        /* factory */ static rgb(r: number, g: number, b: number): TColor {
                return new TColor(`rgb(${r}, ${g}, ${b})`);
        }
        /* factory */ static rgba(r: number, g: number, b: number, a: number): TColor {
                return new TColor(`rgba(${r}, ${g}, ${b}, ${a})`);
        }
}

export class ComponentRegistry {
        private byName = new Map<string, TComponent>();

        register(name: string, c: TComponent) {
                this.byName.set(name, c);
        }

        get<T extends TComponent = TComponent>(name: string): T | undefined {
                return this.byName.get(name) as T | undefined;
        }

        clear() {
                this.byName.clear();
        }

        resolveRoot(): HTMLElement {
                // Prefer body as the canonical root.
                if (document.body?.dataset?.component) return document.body;

                // Backward compatibility: old wrapper div.
                const legacy = document.getElementById('delphine-root');
                if (legacy) return legacy;

                // Last resort.
                return document.body ?? document.documentElement;
        }

        buildComponentTree(form: TForm) {
                this.clear();
                // resolveRoot est maintenant appelé par TForm::show(). Inutile de le faire ici
                //const root = TDocument.body;
                //const root = (document.getElementById('delphine-root') ?? document.body) as HTMLElement;
                //const root = (document.body?.matches('[data-component]') ? document.body : null) ?? (document.getElementById('delphine-root') as HTMLElement | null) ?? document.body;
                //const root = this.resolveRoot();

                // --- FORM ---
                // provisoirement if (root.getAttribute('data-component') === 'TForm') {
                this.register(form.name, form);
                //}
                const root = form.elem!;

                // --- CHILD COMPONENTS ---
                root.querySelectorAll('[data-component]').forEach((el) => {
                        if (el === root) return;
                        const name = el.getAttribute('data-name');
                        const type = el.getAttribute('data-component');
                        const titi = el.getAttribute('data-onclick');

                        console.log(`titi = ${titi}`);

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
                        const factory = TApplication.TheApplication.types.get(type!);
                        let comp: TComponent | null = null;
                        if (factory) comp = factory(name!, form, form);

                        if (comp) {
                                comp.elem = el;
                                this.register(name!, comp);
                        }
                });
                form.addEventListener('click');
        }
}

export class TComponent {
        parent: TComponent | null = null;
        form: TForm | null = null;
        children: TComponent[] = [];

        elem: Element | null = null;
        get htmlElement(): HTMLElement | null {
                return this.elem as HTMLElement | null;
        }
        name: string;
        constructor(name: string, form: TForm | null, parent: TComponent | null) {
                this.name = name;
                this.parent = parent;
                parent?.children.push(this);
                this.form = form;
                this.name = name;
        }

        get color(): TColor {
                return new TColor(this.getStyleProp('color'));
        }
        set color(v: TColor) {
                this.setStyleProp('color', v.s);
        }

        get backgroundColor(): TColor {
                return new TColor(this.getStyleProp('background-color'));
        }
        set backgroundColor(v: TColor) {
                this.setStyleProp('background-color', v.s);
        }

        get width(): number {
                return parseInt(this.getStyleProp('width'));
        }
        set width(v: number) {
                this.setStyleProp('width', v.toString());
        }

        get height(): number {
                return parseInt(this.getStyleProp('height'));
        }
        set height(v: number) {
                this.setStyleProp('height', v.toString());
        }

        get offsetWidth(): number {
                return this.htmlElement!.offsetWidth;
        }
        get offsetHeight(): number {
                return this.htmlElement!.offsetHeight;
        }

        setStyleProp(name: string, value: string) {
                this.htmlElement!.style.setProperty(name, value);
        }

        getStyleProp(name: string) {
                return this.htmlElement!.style.getPropertyValue(name);
        }

        setProp(name: string, value: string) {
                this.htmlElement!.setAttribute(name, value);
        }

        getProp(name: string) {
                return this!.htmlElement!.getAttribute(name);
        }
}

export class TDocument {
        static document: TDocument = new TDocument(document);
        static body = document.body;

        htmlDoc: Document;
        constructor(htmlDoc: Document) {
                this.htmlDoc = htmlDoc;
        }
}

export class TForm extends TComponent {
        static forms = new Map<string, TForm>();
        private _mounted = false;
        componentRegistry: ComponentRegistry = new ComponentRegistry();
        constructor(name: string) {
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

        findFormFromEventTarget(target: Element): TForm | null {
                // 1) Find the nearest element that looks like a form container
                const formElem = target.closest('[data-component="TForm"][data-name]') as Element | null;
                if (!formElem) return null;

                // 2) Resolve the TForm instance
                const formName = formElem.getAttribute('data-name');
                if (!formName) return null;

                return TForm.forms.get(formName) ?? null;
        }

        show() {
                // Must be done before buildComponentTree() because `buildComponentTree()` does not do `resolveRoot()` itself.
                if (!this.elem) {
                        this.elem = this.componentRegistry.resolveRoot(); // ou this.resolveRoot()
                }
                if (!this._mounted) {
                        this.componentRegistry.buildComponentTree(this);
                        this._mounted = true;
                }

                // TODO
        }

        addEventListener(type: string) {
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
}

export class TButton extends TComponent {
        constructor(name: string, form: TForm, parent: TComponent) {
                super(name, form, parent);
        }
}

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

export class TApplication {
        static TheApplication: TApplication;
        private forms: TForm[] = [];
        readonly types = new ComponentTypeRegistry();
        mainForm: TForm | null = null;

        constructor() {
                TApplication.TheApplication = this;
                registerVclTypes(this.types);
        }

        createForm<T extends TForm>(ctor: new (...args: any[]) => T, name: string): T {
                const f = new ctor(name);
                this.forms.push(f);
                if (!this.mainForm) this.mainForm = f;
                return f;
        }

        run() {
                this.runWhenDomReady(() => {
                        if (this.mainForm) this.mainForm.show();
                        else this.autoStart();
                });
        }

        protected autoStart() {
                // fallback: choisir une form enregistrée, ou créer une form implicite
        }

        runWhenDomReady(fn: () => void) {
                if (document.readyState === 'loading') {
                        window.addEventListener('DOMContentLoaded', fn, { once: true });
                } else {
                        fn();
                }
        }
}

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
