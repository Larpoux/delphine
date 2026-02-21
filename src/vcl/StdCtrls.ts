//import { ComponentTypeRegistry } from '../drt/UIPlugin'; // PAS "import type"
// //import type { Json, DelphineServices, ComponentTypeRegistry } from '../drt/UIPlugin';
//import { registerVclTypes } from './registerVcl';
//import { Button } from 'grapesjs';
import { registerBuiltins } from './registerVcl';

export type ComponentFactory = (name: string, form: TForm, owner: TComponent) => TComponent;

//import type { Json } from './Json';
export type Json = null | boolean | number | string | Json[] | { [key: string]: Json };

type PropKind = 'string' | 'number' | 'boolean' | 'color';
export type PropSpec<T, V = unknown> = {
        name: string;
        kind: PropKind;
        apply: (obj: T, value: V) => void;
};

export interface IPluginHost {
        setPluginSpec(spec: { plugin: string | null; props: any }): void;
        mountPluginIfReady(services: DelphineServices): void;
}

export interface DelphineLogger {
        debug(msg: string, data?: Json): void;
        info(msg: string, data?: Json): void;
        warn(msg: string, data?: Json): void;
        error(msg: string, data?: Json): void;
}

export interface DelphineEventBus {
        // Subscribe to an app event.
        on(eventName: string, handler: (payload: Json) => void): () => void;

        // Publish an app event.
        emit(eventName: string, payload: Json): void;
}

export interface DelphineStorage {
        get(key: string): Promise<Json | undefined>;
        set(key: string, value: Json): Promise<void>;
        remove(key: string): Promise<void>;
}
export interface DelphineServices {
        log: {
                debug(msg: string, data?: any): void;
                info(msg: string, data?: any): void;
                warn(msg: string, data?: any): void;
                error(msg: string, data?: any): void;
        };

        bus: {
                on(event: string, handler: (payload: any) => void): () => void;
                emit(event: string, payload: any): void;
        };

        storage: {
                get(key: string): Promise<any> | null;
                set(key: string, value: any): Promise<void> | null;
                remove(key: string): Promise<void> | null;
        };

        // futur
        // i18n?: ...
        // nav?: ...
}

export abstract class TMetaclass<T extends TMetaclass<any> = any> {
        readonly typeName: string = 'Metaclass';
        static metaclass: TMetaclass;

        abstract getMetaClass(): TMetaclass;
        constructor() {}
        abstract create(name: string, form: TForm, parent: TObject<any>): T;
}

export class TObject<TSelf extends TObject<any> = any> {}

export abstract class TMetaObject extends TMetaclass {
        //static metaClass: TMetaObject = new TMetaObject();
        readonly typeName: string = 'Object';

        abstract getMetaClass(): TMetaObject;
        constructor() {
                super();
        }
        abstract create(): TObject;

        //abstract getMetaClass(): TMetaComponent<T>;
}

// English comments as requested.
export abstract class TMetaComponent<T extends TComponent> extends TMetaclass {
        // The symbolic name used in HTML: data-component="TButton" or "my-button"
        abstract readonly typeName: string;
        //static metaClass: TMetaComponent<T> = new TMetaComponent<T>();
        //abstract readonly metaclass: TMetaComponent<T>;
        constructor() {
                super();
        }

        abstract getMetaClass(): TMetaComponent<T>;
        //abstract getMetaClass(): TMetaComponent<T>;
        //abstract getMetaClass(): TMetaComponent<T>; //{
        //return TMetaComponent.metaclass;
        //}

        // Create the runtime instance and attach it to the DOM element.
        create(name: string, form: TForm, parent: TComponent) {
                return new TComponent(this.getMetaClass(), name, form, parent);
        }

        /** Property schema for this component type */
        props(): PropSpec<T>[] {
                return [];
        }

        domEvents?(): string[]; // default [];

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
}

//import type { TComponentClass } from './TComponentClass';
//import type { TComponent } from '@vcl';

export class ComponentTypeRegistry {
        // We store heterogeneous metas, so we keep them as TMetaComponent<any>.
        private readonly classes = new Map<string, TMetaComponent<TComponent>>();

        register(meta: TMetaComponent<any>) {
                if (this.classes.has(meta.typeName)) {
                        throw new Error(`Component type already registered: ${meta.typeName}`);
                }
                this.classes.set(meta.typeName, meta);
        }

        // If you just need "something meta", return any-meta.
        get(typeName: string): TMetaComponent<TComponent> | undefined {
                return this.classes.get(typeName);
        }

        has(typeName: string): boolean {
                return this.classes.has(typeName);
        }

        list(): string[] {
                return [...this.classes.keys()].sort();
        }
}

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
        private instances = new Map<string, TComponent>();

        logger = {
                debug(msg: string, data?: Json): void {},
                info(msg: string, data?: Json): void {},
                warn(msg: string, data?: Json): void {},
                error(msg: string, data?: Json): void {}
        };

        eventBus = {
                on(event: string, handler: (payload: any) => void): () => void {
                        return () => void {};
                },
                emit(event: string, payload: any): void {}
        };

        storage = {
                get(key: string): Promise<any> | null {
                        return null;
                },
                set(key: string, value: any): Promise<void> | null {
                        return null;
                },
                remove(key: string): Promise<void> | null {
                        return null;
                }
        };

        constructor() {}

        registerInstance(name: string, c: TComponent) {
                this.instances.set(name, c);
        }
        get<T extends TComponent = TComponent>(name: string): T | undefined {
                return this.instances.get(name) as T | undefined;
        }

        services: DelphineServices = {
                log: this.logger,
                bus: this.eventBus,
                storage: this.storage
        };

        clear() {
                this.instances.clear();
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

        private readProps(el: Element, meta: TMetaComponent<TComponent>) {
                const out: Record<string, any> = {};
                for (const spec of meta.props()) {
                        const raw = el.getAttribute(`data-${spec.name}`);
                        if (raw == null) continue;

                        out[spec.name] = this.convert(raw, spec.kind);
                }
                return out;
        }

        private convert(raw: string, kind: PropKind) {
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

        applyProps(child: TComponent, cls: TMetaComponent<TComponent>) {
                const props = this.readProps(child.elem!, cls);
                for (const spec of cls.props()) {
                        if (props[spec.name] !== undefined) {
                                spec.apply(child, props[spec.name]);
                        }
                }
        }

        buildComponentTree(form: TForm, component: TComponent) {
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
                const root = component.elem!;

                // --- CHILD COMPONENTS ---
                root.querySelectorAll(':scope > [data-component]').forEach((el) => {
                        if (el === root) return;
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

                        const cls = TApplication.TheApplication.types.get(type!);
                        if (!cls) return;

                        const child = cls.create(name!, form, component);
                        // name: string, form: TForm, parent: TComponent, elem: HTMLElement
                        if (!child) return;

                        //child.parent = component;

                        child.elem = el;
                        //child.form = form;
                        //child.name = name!;
                        // Optional props
                        this.applyProps(child, cls);
                        this.registerInstance(name!, child);
                        component.children.push(child);
                        const maybeHost = child as unknown as Partial<IPluginHost>;
                        if (maybeHost && typeof maybeHost.setPluginSpec === 'function') {
                                const plugin = el.getAttribute('data-plugin');
                                const raw = el.getAttribute('data-props');
                                const props = raw ? JSON.parse(raw) : {};

                                maybeHost.setPluginSpec({ plugin, props });
                                maybeHost.mountPluginIfReady!(this.services);
                                //maybeHost.mountFromRegistry(services);
                        }

                        if (child.allowsChildren()) {
                                this.buildComponentTree(form, child);
                        }
                });
        }
}

export class TComponent {
        readonly metaClass: TMetaComponent<any>;
        readonly name: string;
        readonly parent: TComponent | null = null;
        form: TForm | null = null;
        children: TComponent[] = [];

        elem: Element | null = null;
        get htmlElement(): HTMLElement | null {
                return this.elem as HTMLElement | null;
        }
        constructor(metaClass: TMetaComponent<any>, name: string, form: TForm | null, parent: TComponent | null) {
                this.metaClass = metaClass;
                this.name = name;
                this.parent = parent;
                parent?.children.push(this);
                this.form = form;
                this.name = name;
                //this.metaClass = metaClass;
        }

        /** May contain child components */
        allowsChildren(): boolean {
                return true;
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

export class TMetaForm extends TMetaComponent<TForm> {
        //metaclass: TMetaComponent<TForm>;
        static metaclass: TMetaForm = new TMetaForm();
        getMetaClass() {
                return TMetaForm.metaclass;
        }
        readonly typeName = 'TForm';

        create(name: string, form: TForm, parent: TComponent) {
                return new TForm(name);
        }

        props(): PropSpec<TForm>[] {
                return [];
        }
}

export class TForm extends TComponent {
        static forms = new Map<string, TForm>();
        private _mounted = false;
        componentRegistry: ComponentRegistry = new ComponentRegistry();
        constructor(name: string) {
                super(TMetaForm.metaclass, name, null, null);
                this.form = this;
                TForm.forms.set(name, this);
                //this.parent = this;
        }

        get application(): TApplication {
                return this.form?.application ?? TApplication.TheApplication;
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

        private _ac: AbortController | null = null;

        installEventRouter() {
                this._ac?.abort();
                this._ac = new AbortController();
                const { signal } = this._ac;

                const root = this.elem as Element | null;
                if (!root) return;

                // same handler for everybody
                const handler = (ev: Event) => this.dispatchDomEvent(ev);

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

        private handleEvent(ev: Event, el: Element, attribute: string): boolean {
                const handlerName = el.getAttribute(attribute);

                // If we found a handler on this element, dispatch it
                if (handlerName && handlerName !== '') {
                        const name = el.getAttribute('data-name');
                        const sender = name ? (this.componentRegistry.get(name) ?? null) : null;

                        const maybeMethod = (this as any)[handlerName];
                        if (typeof maybeMethod !== 'function') {
                                console.log('NOT A METHOD', handlerName);
                                return false;
                        }

                        // If sender is missing, fallback to the form itself (safe)
                        (maybeMethod as (event: Event, sender: any) => any).call(this, ev, sender ?? this);
                        return true;
                }
                return false;
        }

        // We received an DOM Event. Dispatch it
        private dispatchDomEvent(ev: Event) {
                const targetElem = ev.target as Element | null;
                if (!targetElem) return;

                const evType = ev.type;

                let el: Element | null = targetElem.closest('[data-component]');
                while (el) {
                        if (this.handleEvent(ev, el, `data-on${evType}`)) return;

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

        protected onCreate() {
                //const btn = this.componentRegistry.get('button2');
                const onShownName = this.elem!.getAttribute('data-oncreate');
                if (onShownName) {
                        queueMicrotask(() => {
                                const fn = (this as any)[onShownName];
                                if (typeof fn === 'function') fn.call(this, null, this);
                        });
                }
                //if (btn) btn.color = TColor.rgb(0, 0, 255);
        }

        protected onShown() {
                //const btn = this.componentRegistry.get('button3');
                //if (btn) btn.color = TColor.rgb(0, 255, 255);
                const onShownName = this.elem!.getAttribute('data-onshown');
                if (onShownName) {
                        queueMicrotask(() => {
                                const fn = (this as any)[onShownName];
                                if (typeof fn === 'function') fn.call(this, null, this);
                        });
                }
        }
}

export class TButton extends TComponent {
        private _caption: string = '';

        htmlButton(): HTMLButtonElement {
                return this.htmlElement! as HTMLButtonElement;
        }

        get caption() {
                return this._caption;
        }
        set caption(caption) {
                this.setCaption(caption);
        }
        setCaption(s: string) {
                this._caption = s;
                if (this.htmlElement) this.htmlElement.textContent = s;
        }

        private _enabled: boolean = true;
        get enabled() {
                return this._enabled;
        }
        set enabled(enabled) {
                this.setEnabled(enabled);
        }
        setEnabled(enabled: boolean) {
                this._enabled = enabled;
                if (this.htmlElement) this.htmlButton().disabled = !enabled;
        }

        constructor(name: string, form: TForm, parent: TComponent) {
                super(TMetaButton.metaClass, name, form, parent);
                //super(name, form, parent);
                //this.name = name;
                //this.form = form;
                //this.parent = parent;
        }
        allowsChildren(): boolean {
                return false;
        }
}

export class TMetaButton extends TMetaComponent<TButton> {
        constructor() {
                super();
        }
        static metaClass: TMetaButton = new TMetaButton();
        getMetaClass(): TMetaButton {
                return TMetaButton.metaClass;
        }
        readonly typeName = 'TButton';

        create(name: string, form: TForm, parent: TComponent) {
                return new TButton(name, form, parent);
        }

        props(): PropSpec<TButton>[] {
                return [
                        { name: 'caption', kind: 'string', apply: (o, v) => (o.caption = String(v)) },
                        { name: 'enabled', kind: 'boolean', apply: (o, v) => (o.enabled = Boolean(v)) },
                        { name: 'color', kind: 'color', apply: (o, v) => (o.color = v as any) }
                ];
        }
}

export class TApplication {
        static TheApplication: TApplication;
        //static pluginRegistry = new PluginRegistry();
        //plugins: IPluginRegistry;
        private forms: TForm[] = [];
        readonly types = new ComponentTypeRegistry();
        mainForm: TForm | null = null;

        constructor() {
                TApplication.TheApplication = this;
                registerBuiltins(this.types);
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
