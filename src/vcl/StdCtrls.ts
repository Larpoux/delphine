import { registerBuiltins } from './registerVcl';

/*
   To create a new component type:

   To create a new component attribut

*/

export type ComponentFactory = (name: string, form: TForm, owner: TComponent) => TComponent;

export type Json = null | boolean | number | string | Json[] | { [key: string]: Json };

type PropKind = 'string' | 'number' | 'boolean' | 'color' | 'handler';
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

export interface UIPluginInstance<Props extends Json = Json> {
        readonly id: string;

        // Called exactly once after creation (for a given instance).
        mount(container: HTMLElement, props: Props, services: DelphineServices): void;

        // Called any time props change (may be frequent).
        update(props: Props): void;

        // Called exactly once before disposal.
        unmount(): void;

        // Optional ergonomics.
        getSizeHints?(): number;
        focus?(): void;

        // Optional persistence hook (Delphine may store & restore this).
        serializeState?(): Json;
}

export abstract class TMetaclass {
        readonly typeName: string = 'TMetaclass';
        static metaclass: TMetaclass;
        readonly superClass: TMetaclass | null = null;

        abstract getMetaclass(): TMetaclass;
        protected constructor(superClass: TMetaclass | null, typeName = 'TMetaclass') {
                this.superClass = superClass;
                this.typeName = typeName;
        }
}

export class TObject {
        getMetaClass(): TMetaObject {
                return TMetaObject.metaClass;
        }
}

export class TMetaObject extends TMetaclass {
        static readonly metaClass: TMetaObject = new TMetaObject(TMetaclass.metaclass);

        getMetaclass(): TMetaObject {
                return TMetaObject.metaClass;
        }
        constructor(superClass: TMetaclass) {
                super(superClass, 'TObject');
        }
}

export class TMetaComponent extends TMetaclass {
        static readonly metaclass: TMetaComponent = new TMetaComponent(TMetaclass.metaclass);
        // The symbolic name used in HTML: data-component="TButton" or "my-button"
        protected constructor(superClass: TMetaclass) {
                super(superClass, 'TComponent');
        }

        getMetaclass(): TMetaComponent {
                return TMetaComponent.metaclass;
        }

        // Create the runtime instance and attach it to the DOM element.
        create(name: string, form: TForm, parent: TComponent) {
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
        defProps(): PropSpec<any>[] {
                return [
                        { name: 'color', kind: 'color', apply: (o, v) => (o.color = new TColor(String(v))) },
                        { name: 'onclick', kind: 'handler', apply: (o, v) => (o.onclick = new THandler(String(v))) }
                        //{ name: 'oncreate', kind: 'handler', apply: (o, v) => (o.oncreate = new THandler(String(v))) }
                ];
        }

        /*
        applyProps(obj: any, values: Record<string, unknown>) {
                for (const p of this.defProps()) {
                        if (Object.prototype.hasOwnProperty.call(values, p.name)) {
                                p.apply(obj, values[p.name]);
                        }
                }
        }
                */

        // English comments as requested.

        /*
        applyPropsFromElement(obj: any, el: Element) {
                const props = this.parsePropsFromElement(el);
                this.applyProps(obj, props);
                return props;
        }
                */
        // Apply parsed props to the component instance

        domEvents?(): string[]; // default [];
}

type ComponentProps = {
        onclick?: THandler;
        oncreate?: THandler;
        color?: TColor; // ou TColor, etc.
        name?: string;
        component?: string;
};

//type RawProp = Record<string, string>;

export class TComponent {
        getMetaclass(): TMetaComponent {
                return TMetaComponent.metaclass;
        }

        readonly name: string;
        readonly parent: TComponent | null = null;
        form: TForm | null = null;
        children: TComponent[] = [];

        elem: Element | null = null;
        get htmlElement(): HTMLElement | null {
                return this.elem as HTMLElement | null;
        }
        constructor(name: string, form: TForm | null, parent: TComponent | null) {
                this.name = name;
                this.parent = parent;
                parent?.children.push(this);
                this.form = form;
                this.name = name;
        }

        declare props: ComponentProps;
        //rawProps: RawProp[] = [];

        /** May contain child components */
        allowsChildren(): boolean {
                return false;
        }

        get color(): TColor {
                return this.props.color ?? new TColor('default');
        }

        set color(color) {
                this.props.color = color;
                const el = this.htmlElement;
                if (!el) return;

                this.setStyleProp('color', this.color.s);
        }

        get onclick(): THandler {
                return this.props.onclick ?? new THandler('');
        }
        set onclick(handler) {
                this.props.onclick = handler;
        }

        syncDomFromProps() {
                const el = this.htmlElement;
                if (!el) return;

                this.setStyleProp('color', this.color.s);
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

export class TMetaComponentTypeRegistry extends TMetaObject {
        static readonly metaclass: TMetaComponentTypeRegistry = new TMetaComponentTypeRegistry(TMetaObject.metaClass);
        protected constructor(superClass: TMetaObject) {
                super(superClass);
                // et vous changez juste le nom :
                (this as any).typeName = 'TObject';
        }
        getMetaclass(): TMetaComponentTypeRegistry {
                return TMetaComponentTypeRegistry.metaclass;
        }
}

export class TComponentTypeRegistry extends TObject {
        // We store heterogeneous metas, so we keep them as TMetaComponent<any>.
        getMetaclass(): TMetaComponentTypeRegistry {
                return TMetaComponentTypeRegistry.metaClass;
        }
        private readonly classes = new Map<string, TMetaComponent>();

        register(meta: TMetaComponent) {
                if (this.classes.has(meta.typeName)) {
                        throw new Error(`Component type already registered: ${meta.typeName}`);
                }
                this.classes.set(meta.typeName, meta);
        }

        // If you just need "something meta", return any-meta.
        get(typeName: string): TMetaComponent | undefined {
                return this.classes.get(typeName);
        }

        has(typeName: string): boolean {
                return this.classes.has(typeName);
        }

        list(): string[] {
                return [...this.classes.keys()].sort();
        }
}

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

export class THandler {
        s: string;

        constructor(s: string) {
                this.s = s;
        }
        fire(form: TForm, handlerName: string, ev: Event, sender: any) {
                const maybeMethod = (form as any)[this.s];
                if (typeof maybeMethod !== 'function') {
                        console.log('NOT A METHOD', handlerName);
                        return false;
                }

                // If sender is missing, fallback to the form itself (safe)
                (maybeMethod as (event: Event, sender: any) => any).call(form, ev, sender ?? this);
        }
}

export class TMetaComponentRegistry extends TMetaclass {
        static readonly metaclass: TMetaComponentRegistry = new TMetaComponentRegistry(TMetaclass.metaclass);

        protected constructor(superClass: TMetaclass) {
                super(superClass, 'TComponentRegistry');
        }
        getMetaclass(): TMetaComponentRegistry {
                return TMetaComponentRegistry.metaclass;
        }
}

export class TComponentRegistry extends TObject {
        getMetaclass(): TMetaComponentRegistry {
                return TMetaComponentRegistry.metaclass;
        }

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

        constructor() {
                super();
        }

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

        private convert(raw: string, kind: PropKind) {
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
        parsePropsFromElement(el: Element, defProps: PropSpec<any>[]): Record<string, unknown> {
                const out: Record<string, unknown> = {};

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
                        } catch (e) {
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

        collectDefProps(comp: TMetaComponent): PropSpec<any>[] {
                const out: PropSpec<any>[] = [];
                const seen = new Set<string>();

                // Walk up metaclass inheritance: this -> super -> super...
                let mc: TMetaComponent | null = comp;

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
                        mc = (mc.superClass as TMetaComponent) ?? null;
                }

                return out;
        }

        private processElem(el: Element, form: TForm, parent: TComponent) {
                const name = el.getAttribute('data-name');
                const type = el.getAttribute('data-component');

                const cls = TApplication.TheApplication.types.get(type!);

                if (!cls) return;

                let child = parent;
                if (cls != TMetaForm.metaclass) {
                        // The TForm are already created by the user.
                        child = cls.create(name!, form, parent);
                }

                this.registerInstance(name!, child);
                // name: string, form: TForm, parent: TComponent, elem: HTMLElement
                if (!child) return;

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
                (child as any).onAttachedToDom?.();

                //this.applyProps(child, cls);

                parent.children.push(child);
                const maybeHost = child as unknown as Partial<IPluginHost>;
                if (maybeHost && typeof maybeHost.setPluginSpec === 'function') {
                        const plugin = el.getAttribute('data-plugin');
                        const raw = el.getAttribute('data-props');
                        const props = raw ? JSON.parse(raw) : {};

                        maybeHost.setPluginSpec({ plugin, props });
                        maybeHost.mountPluginIfReady!(this.services);
                        //maybeHost.mountFromRegistry(services);
                }

                // Actually this does not work for TForm : infinite recursion
                if (child.allowsChildren()) {
                        //this.buildComponentTree(form, child);
                }
                //if (el === root) return; // No need to go higher in the hierachy
        }

        // This function is called juste once, when the form is created
        buildComponentTree(form: TForm, root: TComponent) {
                this.clear();
                // --- FORM ---
                // provisoirement if (root.getAttribute('data-component') === 'TForm') {
                //const el = root.elem!;

                //this.registerInstance(root.name, form);
                //}
                const rootElem = root.elem!;
                this.processElem(rootElem, form, root);

                // --- CHILD COMPONENTS ---
                rootElem.querySelectorAll(':scope > [data-component]').forEach((el) => {
                        this.processElem(el, form, root);
                        //if (el === root) return;
                });
        }

        /*

        buildComponentTree(form: TForm, component: TComponent) {
                const el = component.elem!;

                // ---- CHILD COMPONENTS ----
                el.querySelectorAll(':scope > [data-component]').forEach((childEl) => {
                        const name = childEl.getAttribute('data-name');
                        const childType = childEl.getAttribute('data-component');
                        if (!name || !childType) return;

                        const childClass = TApplication.TheApplication.types.get(childType);
                        if (!childClass) return;

                        const child = childClass.create(name, form, component);
                        child.elem = childEl;

                        // ✅ Parent/children link (you already do it elsewhere too; keep one place)
                        component.children.push(child);

                        // ✅ Register child instance
                        this.registerInstance(name, child);

                        // ---- Apply props on child now (so syncDom works before deeper build) ----
                        const allDefPropsCollected = this.collectDefProps(childClass);
                        child.props = this.parsePropsFromElement(childEl, allDefPropsCollected);
                        child.syncDomFromProps();
                        (child as any).onAttachedToDom?.();

                        // ---- Plugin host on child ----
                        const maybeHost2 = child as unknown as Partial<IPluginHost>;
                        if (maybeHost2 && typeof maybeHost2.setPluginSpec === 'function') {
                                const plugin = childEl.getAttribute('data-plugin');
                                const raw = childEl.getAttribute('data-props');
                                const props = raw ? JSON.parse(raw) : {};
                                maybeHost2.setPluginSpec({ plugin, props });
                                maybeHost2.mountPluginIfReady!(this.services);
                        }

                        if (child.allowsChildren()) {
                                this.buildComponentTree(form, child);
                        }
                });

                // We must process the root itself, like all the children

                // ✅ Register current instance (root of this call)
                this.registerInstance(component.name, component); //(or perhaps component.name, form)
                //if (!el) return;

                // ---- APPLY PROPS ON CURRENT COMPONENT ----
                const type = el.getAttribute('data-component');
                if (type) {
                        const cls = TApplication.TheApplication.types.get(type);
                        if (cls) {
                                const allDefPropsCollected = this.collectDefProps(cls);
                                component.props = this.parsePropsFromElement(el, allDefPropsCollected);
                                component.syncDomFromProps();
                        }
                }

                (component as any).onAttachedToDom?.();

                // ---- PLUGIN HOST (if current is a host) ----
                const maybeHost = component as unknown as Partial<IPluginHost>;
                if (maybeHost && typeof maybeHost.setPluginSpec === 'function') {
                        const plugin = el.getAttribute('data-plugin');
                        const raw = el.getAttribute('data-props');
                        const props = raw ? JSON.parse(raw) : {};
                        maybeHost.setPluginSpec({ plugin, props });
                        maybeHost.mountPluginIfReady!(this.services);
                }
        }
                */
}

export class TDocument extends TObject {
        static document: TDocument = new TDocument(document);
        static body = document.body;
        htmlDoc: Document;
        constructor(htmlDoc: Document) {
                super();
                this.htmlDoc = htmlDoc;
        }
}

export class TMetaDocument extends TMetaObject {
        static readonly metaclass: TMetaDocument = new TMetaDocument(TMetaObject.metaclass);

        protected constructor(superClass: TMetaObject) {
                super(superClass);
                // et vous changez juste le nom :
                (this as any).typeName = 'TDocument';
        }
        getMetaclass(): TMetaDocument {
                return TMetaDocument.metaclass;
        }
}

export class TMetaForm extends TMetaComponent {
        static readonly metaclass: TMetaForm = new TMetaForm(TMetaComponent.metaclass);
        getMetaClass(): TMetaForm {
                return TMetaForm.metaclass;
        }

        protected constructor(superClass: TMetaComponent) {
                super(superClass);
                // et vous changez juste le nom :
                (this as any).typeName = 'TForm';
        }

        //readonly typeName = 'TForm';

        create(name: string, form: TForm, parent: TComponent) {
                return new TForm(name);
        }

        //props(): PropSpec<TForm>[] {
        //return [];
        //}

        defProps(): PropSpec<TForm>[] {
                return [
                        //{ name: 'caption', kind: 'string', apply: (o, v) => (o.caption = String(v)) },
                        //{ name: 'enabled', kind: 'boolean', apply: (o, v) => (o.enabled = Boolean(v)) }
                ];
        }
}

//type FormProps = ComponentProps & {
//caption?: string;
//enabled?: boolean;
//color?: TColor; // ou TColor, etc.
//};
export class TForm extends TComponent {
        getMetaclass(): TMetaForm {
                return TMetaForm.metaclass;
        }
        allowsChildren(): boolean {
                return true;
        }
        static forms = new Map<string, TForm>();
        private _mounted = false;
        // Each Form has its own componentRegistry
        componentRegistry: TComponentRegistry = new TComponentRegistry();
        constructor(name: string) {
                super(name, null, null);
                this.form = this;
                TForm.forms.set(name, this);
        }

        get application(): TApplication {
                return this.form?.application ?? TApplication.TheApplication;
        }

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

                for (const type in this.getMetaclass().domEvents) {
                        root.addEventListener(type, handler, { capture: true, signal });
                }
        }

        disposeEventRouter() {
                this._ac?.abort();
                this._ac = null;
        }

        // We received an DOM Event. Dispatch it
        private dispatchDomEvent(ev: Event) {
                const targetElem = ev.target as Element | null;
                if (!targetElem) return;

                const propName = `on${ev.type}`;

                let el: Element | null = targetElem.closest('[data-component]');
                if (!el) return;
                const name = el.getAttribute('data-name');
                let comp = name ? this.componentRegistry.get(name) : null;
                while (comp) {
                        const handler = comp?.props[propName as keyof typeof comp.props] as THandler | null;
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

        protected onCreate() {
                const onShownName = this.elem!.getAttribute('data-oncreate');
                if (onShownName) {
                        queueMicrotask(() => {
                                const fn = (this as any)[onShownName];
                                if (typeof fn === 'function') fn.call(this, null, this);
                        });
                }
        }

        protected onShown() {
                const onShownName = this.elem!.getAttribute('data-onshown');
                if (onShownName) {
                        queueMicrotask(() => {
                                const fn = (this as any)[onShownName];
                                if (typeof fn === 'function') fn.call(this, null, this);
                        });
                }
        }
}

type ButtonProps = ComponentProps & {
        caption?: string;
        enabled?: boolean;
        //color?: TColor; // ou TColor, etc.
};

export class TButton extends TComponent {
        getMetaclass() {
                return TMetaButton.metaclass;
        }

        htmlButton(): HTMLButtonElement {
                return this.htmlElement! as HTMLButtonElement;
        }

        protected get bprops(): ButtonProps {
                return this.props as ButtonProps;
        }

        get caption(): string {
                return this.bprops.caption ?? '';
        }
        set caption(caption: string) {
                this.bprops.caption = caption;
                const el = this.htmlElement;
                if (!el) return;
                el.textContent = this.caption;
        }

        get enabled(): boolean {
                return this.bprops.enabled ?? true;
        }
        set enabled(enabled) {
                this.bprops.enabled = enabled;
                this.htmlButton().disabled = !enabled;
        }

        constructor(name: string, form: TForm, parent: TComponent) {
                super(name, form, parent);
        }
        syncDomFromProps() {
                const el = this.htmlElement;
                if (!el) return;

                el.textContent = this.caption;
                this.htmlButton().disabled = !this.enabled;
                super.syncDomFromProps();
        }
}

export class TMetaButton extends TMetaComponent {
        static readonly metaclass: TMetaButton = new TMetaButton(TMetaComponent.metaclass);

        protected constructor(superClass: TMetaComponent) {
                super(superClass);
                // et vous changez juste le nom :
                (this as any).typeName = 'TButton';
        }
        getMetaclass(): TMetaButton {
                return TMetaButton.metaclass;
        }

        readonly typeName = 'TButton';

        create(name: string, form: TForm, parent: TComponent) {
                return new TButton(name, form, parent);
        }

        defProps(): PropSpec<TButton>[] {
                return [
                        { name: 'caption', kind: 'string', apply: (o, v) => (o.caption = String(v)) },
                        { name: 'enabled', kind: 'boolean', apply: (o, v) => (o.enabled = Boolean(v)) }
                ];
        }
}

export class TMetaApplication extends TMetaclass {
        static readonly metaclass: TMetaApplication = new TMetaApplication(TMetaclass.metaclass);

        protected constructor(superClass: TMetaclass) {
                super(superClass, 'TApplication');
        }
        getMetaclass(): TMetaApplication {
                return TMetaApplication.metaclass;
        }
}

export class TApplication {
        getMetaclass(): TMetaApplication {
                return TMetaApplication.metaclass;
        }
        static TheApplication: TApplication;
        //static pluginRegistry = new PluginRegistry();
        //plugins: IPluginRegistry;
        private forms: TForm[] = [];
        readonly types = new TComponentTypeRegistry();
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

export class TMetaPluginHost extends TMetaComponent {
        static metaclass = new TMetaPluginHost(TMetaComponent.metaclass);
        getMetaclass() {
                return TMetaPluginHost.metaclass;
        }
        readonly typeName = 'TPluginHost';

        create(name: string, form: TForm, parent: TComponent) {
                return new TPluginHost(name, form, parent);
        }

        props(): PropSpec<TPluginHost>[] {
                return [];
        }
}

export class TPluginHost extends TComponent {
        private instance: UIPluginInstance | null = null;

        pluginName: string | null = null;
        pluginProps: Json = {};
        private factory: UIPluginFactory | null = null;

        constructor(name: string, form: TForm, parent: TComponent) {
                super(name, form, parent);
        }

        // Called by the metaclass (or by your registry) right after creation
        setPluginFactory(factory: UIPluginFactory) {
                this.factory = factory;
        }

        mountPlugin(props: Json, services: DelphineServices) {
                const container = this.htmlElement;
                if (!container) return;

                if (!this.factory) {
                        services.log.warn('TPluginHost: no plugin factory set', { host: this.name as any });
                        return;
                }

                // Dispose old instance if any
                this.unmount();

                // Create plugin instance then mount
                this.instance = this.factory({ host: this, form: this.form! });
                this.instance!.mount(container, props, services);
        }

        // Called by buildComponentTree()
        setPluginSpec(spec: { plugin: string | null; props: any }) {
                this.pluginName = spec.plugin;
                this.pluginProps = spec.props ?? {};
        }

        // Called by buildComponentTree()
        mountPluginIfReady(services: DelphineServices) {
                const container = this.htmlElement;
                if (!container || !this.form || !this.pluginName) return;

                const app = TApplication.TheApplication; // ou un accès équivalent
                const def = PluginRegistry.pluginRegistry.get(this.pluginName);

                if (!def) {
                        services.log.warn('Unknown plugin', { plugin: this.pluginName as any });
                        return;
                }

                this.unmount();
                this.instance = def.factory({ host: this, form: this.form });
                this.instance!.mount(container, this.pluginProps, services);
        }

        update(props: any) {
                this.pluginProps = props;
                this.instance?.update(props);
        }

        unmount() {
                try {
                        this.instance?.unmount();
                } finally {
                        this.instance = null;
                }
        }
}

export type UIPluginFactory<Props extends Json = Json> = (args: { host: TPluginHost; form: TForm }) => UIPluginInstance<Props>;

export interface SizeHints {
        minWidth?: number;
        minHeight?: number;
        preferredWidth?: number;
        preferredHeight?: number;
}

export type UIPluginDef = {
        factory: UIPluginFactory;
        // optionnel : un schéma de props, aide au designer
        // props?: PropSchema;
};

export class PluginRegistry {
        static pluginRegistry = new PluginRegistry();
        private readonly plugins = new Map<string, UIPluginDef>();

        register(name: string, def: UIPluginDef) {
                if (this.plugins.has(name)) throw new Error(`Plugin already registered: ${name}`);
                this.plugins.set(name, def);
        }

        get(name: string): UIPluginDef | undefined {
                return this.plugins.get(name);
        }

        has(name: string): boolean {
                return this.plugins.has(name);
        }
}
