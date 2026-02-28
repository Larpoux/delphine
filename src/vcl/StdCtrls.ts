import { registerBuiltins } from './registerVcl';

/*
   To create a new component type:

   To create a new component attribut

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

export type ComponentFactory = (name: string, form: TForm, owner: TComponent) => TComponent;

export type Json = null | boolean | number | string | Json[] | { [key: string]: Json };

type PropKind = 'string' | 'number' | 'boolean' | 'color' | 'handler';
export type PropSpec<T, V = unknown> = {
        name: string;
        kind: PropKind;
        apply: (obj: T, value: V) => void;
};

type UnknownRecord = Record<string, unknown>;

const RESERVED_DATA_ATTRS = new Set<string>([
        'data-component',
        'data-name',
        'data-props',
        'data-plugin',
        'data-message' // add any meta/framework attrs you don't want treated as props
]);

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
        static readonly metaClass: TMetaObject = new TMetaObject(TMetaclass.metaclass, 'TObject');

        getMetaclass(): TMetaObject {
                return TMetaObject.metaClass;
        }
        constructor(superClass: TMetaclass, name: string) {
                super(superClass, name);
        }
}

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
                parent?.children.push(this); // Could be done in buildComponentTree()
                this.form = form;
        }

        declare props: ComponentProps;

        /** May contain child components */
        allowsChildren(): boolean {
                return false;
        }
        get color(): TColor {
                return new TColor(this.getStyleProp('color'));
        }

        set color(color) {
                this.setStyleProp('color', color.s);
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
        }

        get backgroundColor(): TColor {
                return new TColor(this.getStyleProp('background-color'));
        }
        set backgroundColor(v: TColor) {
                this.setStyleProp('background-color', v.s);
        }

        get width(): string {
                return this.getProp('width') ?? '';
        }
        set width(v: string) {
                this.setProp('width', v);
        }

        get height(): string {
                return this.getProp('height') ?? '';
        }
        set height(v: string) {
                this.setProp('height', v);
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

export class TMetaComponent extends TMetaclass {
        static readonly metaclass: TMetaComponent = new TMetaComponent(TMetaclass.metaclass, 'TComponent');
        // The symbolic name used in HTML: data-component="TButton" or "my-button"
        protected constructor(superClass: TMetaclass, name: string) {
                super(superClass, name);
        }

        getMetaclass(): TMetaComponent {
                return TMetaComponent.metaclass;
        }

        // Create the runtime instance and attach it to the DOM element.
        create(name: string, form: TForm, parent: TComponent) {
                return new TComponent(name, form, parent);
        }

        defProps(): PropSpec<any>[] {
                return [
                        //{ name: 'color', kind: 'color', apply: (o, v) => (o.color = new TColor(String(v))) },
                        { name: 'onclick', kind: 'handler', apply: (o, v) => (o.onclick = new THandler(String(v))) }
                        //{ name: 'oncreate', kind: 'handler', apply: (o, v) => (o.oncreate = new THandler(String(v))) }
                ];
        }

        domEvents?(): string[]; // default [];
}

export class TMetaComponentTypeRegistry extends TMetaObject {
        static readonly metaclass: TMetaComponentTypeRegistry = new TMetaComponentTypeRegistry(TMetaObject.metaClass, 'TComponentTypeRegistry');
        protected constructor(superClass: TMetaObject, name: string) {
                super(superClass, name);
                // et vous changez juste le nom :
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

export class TMetaComponentRegistry extends TMetaclass {
        static readonly metaclass: TMetaComponentRegistry = new TMetaComponentRegistry(TMetaclass.metaclass, 'TComponentTypeRegistry');

        protected constructor(superClass: TMetaclass, name: string) {
                super(superClass, name);
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
        // ==================================================================================

        // English comments as requested.

        // Cache: per metaclass -> (propName -> nearest PropSpec or null if not found)
        private readonly _propSpecCache = new WeakMap<TMetaComponent, Map<string, PropSpec<any> | null>>();

        /**
         * Parse HTML attributes + JSON bulk into a plain object of typed props.
         * - Reads JSON from data-props
         * - Reads data-xxx attributes (excluding reserved ones)
         * - For each candidate prop name, resolves the nearest PropSpec by walking metaclass inheritance.
         * - Applies conversion based on spec.kind
         * - data-xxx overrides data-props
         */
        parsePropsFromElement(el: Element, meta: TMetaComponent): UnknownRecord {
                const out: UnknownRecord = {};

                // 1) Extract JSON bulk props from data-props
                const jsonProps = this.extractJsonProps(el);

                // 2) Extract data-xxx attributes (excluding reserved)
                const dataAttrs = this.extractDataAttributes(el);

                // 3) Apply JSON first, then data-xxx overrides
                this.applyPropsFromSource(out, jsonProps, meta);
                this.applyPropsFromSource(out, dataAttrs, meta);

                return out;
        }

        // -------------------- helpers --------------------

        private extractJsonProps(el: Element): UnknownRecord {
                const raw = el.getAttribute('data-props');
                if (!raw) return {};

                try {
                        const parsed = JSON.parse(raw);
                        // Only accept plain objects
                        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
                                return parsed as UnknownRecord;
                        }
                        return {};
                } catch (e) {
                        console.error('Invalid JSON in data-props', raw, e);
                        return {};
                }
        }

        private extractDataAttributes(el: Element): UnknownRecord {
                const out: UnknownRecord = {};

                // Iterate all attributes, keep only data-xxx (except reserved)
                for (const attr of Array.from(el.attributes)) {
                        const attrName = attr.name;
                        if (!attrName.startsWith('data-')) continue;
                        if (RESERVED_DATA_ATTRS.has(attrName)) continue;

                        const propName = attrName.slice('data-'.length);
                        // Skip empty names
                        if (!propName) continue;

                        out[propName] = attr.value;
                }

                return out;
        }

        private applyPropsFromSource(out: UnknownRecord, src: UnknownRecord, meta: TMetaComponent) {
                for (const [name, rawValue] of Object.entries(src)) {
                        const spec = this.resolveNearestPropSpec(meta, name);
                        if (!spec) continue; // Not a declared prop -> ignore
                        const v: string = rawValue as string;
                        // Note: data-xxx gives strings; data-props can give any JSON type.
                        const value = this.convert(v, spec.kind);
                        out[name] = value;
                }
        }

        /**
         * Find the nearest PropSpec for a prop name by walking meta inheritance:
         * meta -> meta.superClass -> ...
         * Uses caching for speed.
         */
        private resolveNearestPropSpec(meta: TMetaComponent, propName: string): PropSpec<any> | null {
                let perMeta = this._propSpecCache.get(meta);
                if (!perMeta) {
                        perMeta = new Map<string, PropSpec<any> | null>();
                        this._propSpecCache.set(meta, perMeta);
                }

                if (perMeta.has(propName)) {
                        return perMeta.get(propName)!;
                }

                // Walk up metaclass inheritance: child first (nearest wins)
                let mc: TMetaComponent | null = meta;

                while (mc) {
                        if (typeof mc.defProps === 'function') {
                                const defs = mc.defProps();
                                for (const spec of defs) {
                                        if (spec.name === propName) {
                                                perMeta.set(propName, spec);
                                                return spec;
                                        }
                                }
                        }
                        mc = (mc.superClass as TMetaComponent) ?? null;
                }

                perMeta.set(propName, null);
                return null;
        }

        // ==================================================================================
        // Parse HTML attributes into a plain object
        // This function is called juste once, in buildComponentTree(), after the Form is created.
        parsePropsFromElementXXX(el: Element, defProps: PropSpec<any>[]): Record<string, unknown> {
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

        collectDefPropsXXX(comp: TMetaComponent): PropSpec<any>[] {
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

        private processElem(el: Element, form: TForm, parent: TComponent): TComponent | null {
                const name = el.getAttribute('data-name');
                const type = el.getAttribute('data-component');

                const cls = TApplication.TheApplication.types.get(type!);

                if (!cls) return null;

                let child = parent;
                if (cls != TMetaForm.metaclass) {
                        // The TForm are already created by the user.
                        child = cls.create(name!, form, parent);
                }

                this.registerInstance(name!, child);
                // name: string, form: TForm, parent: TComponent, elem: HTMLElement
                if (!child) return null;

                //child.parent = component;

                child.elem = el;
                //child.form = form;
                //child.name = name!;

                // We collect
                //const allDefPropsCollected = this.collectDefProps(cls); // This is done during runtime, but could be done at compiletime
                child.props = this.parsePropsFromElement(el, cls);
                child.syncDomFromProps();
                (child as any).onAttachedToDom?.();

                // Done in the constructor //parent.children.push(child);
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
                        el.querySelectorAll(':scope > [data-component]').forEach((el) => {
                                this.processElem(el, form, child);
                                //if (el === root) return;
                        });
                }
                return child;
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
        }
}

type ComponentProps = {
        onclick?: THandler;
        oncreate?: THandler;
        //color?: TColor; // ou TColor, etc.
        name?: string;
        component?: string;
};

//type RawProp = Record<string, string>;

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
        static readonly metaclass: TMetaDocument = new TMetaDocument(TMetaObject.metaclass, 'TDocument');

        protected constructor(superClass: TMetaObject, name: string) {
                super(superClass, name);
                // et vous changez juste le nom :
        }
        getMetaclass(): TMetaDocument {
                return TMetaDocument.metaclass;
        }
}

type ContainerProps = ComponentProps & {
        //caption?: string;
        //enabled?: boolean;
        //color?: TColor; // ou TColor, etc.
};

export class TContainer extends TComponent {
        getMetaclass() {
                return TMetaContainer.metaclass;
        }

        //private get cprops(): ContainerProps {
        //return this.props as ContainerProps;
        //}

        constructor(name: string, form: TForm | null, parent: TComponent | null) {
                super(name, form, parent);
        }

        syncDomFromProps() {
                const el = this.htmlElement;
                if (!el) return;

                super.syncDomFromProps();
        }

        allowsChildren(): boolean {
                return true;
        }
}

export class TMetaContainer extends TMetaComponent {
        static readonly metaclass: TMetaContainer = new TMetaContainer(TMetaComponent.metaclass, 'TContainer');

        protected constructor(superClass: TMetaComponent, name: string) {
                super(superClass, name);
        }
        getMetaclass(): TMetaContainer {
                return TMetaContainer.metaclass;
        }

        create(name: string, form: TForm, parent: TComponent): TContainer {
                return new TContainer(name, form, parent);
        }

        defProps(): PropSpec<any>[] {
                return [
                        //{ name: 'caption', kind: 'string', apply: (o, v) => (o.caption = String(v)) },
                        //{ name: 'enabled', kind: 'boolean', apply: (o, v) => (o.enabled = Boolean(v)) }
                ];
        }
}

type PanelProps = ContainerProps & {
        //caption?: string;
        //enabled?: boolean;
        //color?: TColor; // ou TColor, etc.
};

export class TPanel extends TContainer {
        getMetaclass() {
                return TMetaPanel.metaclass;
        }

        //protected get pprops(): PanelProps {
        //return this.props as PanelProps;
        //}

        constructor(name: string, form: TForm | null, parent: TComponent | null) {
                super(name, form, parent);
        }
        syncDomFromProps() {
                const el = this.htmlElement;
                if (!el) return;

                super.syncDomFromProps();
        }
}

export class TMetaPanel extends TMetaContainer {
        static readonly metaclass: TMetaPanel = new TMetaPanel(TMetaContainer.metaclass, 'TPanel');

        protected constructor(superClass: TMetaPanel, name: string) {
                super(superClass, name);
                // et vous changez juste le nom :
        }
        getMetaclass(): TMetaPanel {
                return TMetaPanel.metaclass;
        }

        create(name: string, form: TForm, parent: TComponent): TPanel {
                return new TPanel(name, form, parent);
        }

        defProps(): PropSpec<TPanel>[] {
                return [
                        //{ name: 'caption', kind: 'string', apply: (o, v) => (o.caption = String(v)) },
                        //{ name: 'enabled', kind: 'boolean', apply: (o, v) => (o.enabled = Boolean(v)) }
                ];
        }
}

type FormProps = ContainerProps & {
        //caption?: string;
        //enabled?: boolean;
        //color?: TColor; // ou TColor, etc.
};

export class TMetaForm extends TMetaContainer {
        static readonly metaclass: TMetaForm = new TMetaForm(TMetaComponent.metaclass, 'TForm');
        getMetaClass(): TMetaForm {
                return TMetaForm.metaclass;
        }

        protected constructor(superClass: TMetaComponent, name: string) {
                super(superClass, name);
                // et vous changez juste le nom :
        }

        create(name: string, form: TForm, parent: TComponent) {
                return new TForm(name);
        }

        defProps(): PropSpec<TForm>[] {
                return [
                        //{ name: 'caption', kind: 'string', apply: (o, v) => (o.caption = String(v)) },
                        //{ name: 'enabled', kind: 'boolean', apply: (o, v) => (o.enabled = Boolean(v)) }
                ];
        }
}

export class TForm extends TContainer {
        getMetaclass(): TMetaForm {
                return TMetaForm.metaclass;
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
        static readonly metaclass: TMetaButton = new TMetaButton(TMetaComponent.metaclass, 'TButton');

        protected constructor(superClass: TMetaComponent, name: string) {
                super(superClass, name);
                // et vous changez juste le nom :
        }
        getMetaclass(): TMetaButton {
                return TMetaButton.metaclass;
        }

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
        static readonly metaclass: TMetaApplication = new TMetaApplication(TMetaclass.metaclass, 'TApplication');

        protected constructor(superClass: TMetaclass, name: string) {
                super(superClass, name);
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

export class TMetaPluginHost extends TMetaComponent {
        static metaclass = new TMetaPluginHost(TMetaComponent.metaclass, 'TPluginHost');
        getMetaclass() {
                return TMetaPluginHost.metaclass;
        }

        protected constructor(superClass: TMetaclass, name: string) {
                super(superClass, name);
        }

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
