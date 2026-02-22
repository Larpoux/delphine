var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);

// src/vcl/registerVcl.ts
function registerBuiltins(types) {
  types.register(TMetaButton.metaClass);
  types.register(TMetaPluginHost.metaClass);
}

// src/vcl/StdCtrls.ts
var TMetaclass = class {
  constructor() {
    __publicField(this, "typeName", "Metaclass");
  }
};
__publicField(TMetaclass, "metaclass");
var TMetaComponent2 = class extends TMetaclass {
  //static metaClass: TMetaComponent<T> = new TMetaComponent<T>();
  //abstract readonly metaclass: TMetaComponent<T>;
  constructor() {
    super();
  }
  //abstract getMetaClass(): TMetaComponent<T>;
  //abstract getMetaClass(): TMetaComponent<T>; //{
  //return TMetaComponent.metaclass;
  //}
  // Create the runtime instance and attach it to the DOM element.
  create(name, form, parent) {
    return new TComponent2(this.getMetaClass(), name, form, parent);
  }
  /** Property schema for this component type */
  props() {
    return [];
  }
  // default [];
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
};
var ComponentTypeRegistry2 = class {
  constructor() {
    // We store heterogeneous metas, so we keep them as TMetaComponent<any>.
    __publicField(this, "classes", /* @__PURE__ */ new Map());
  }
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
};
var TColor = class _TColor {
  constructor(s) {
    __publicField(this, "s");
    this.s = s;
  }
  /* factory */
  static rgb(r, g, b) {
    return new _TColor(`rgb(${r}, ${g}, ${b})`);
  }
  /* factory */
  static rgba(r, g, b, a) {
    return new _TColor(`rgba(${r}, ${g}, ${b}, ${a})`);
  }
};
var ComponentRegistry = class {
  constructor() {
    __publicField(this, "instances", /* @__PURE__ */ new Map());
    __publicField(this, "logger", {
      debug(msg, data) {
      },
      info(msg, data) {
      },
      warn(msg, data) {
      },
      error(msg, data) {
      }
    });
    __publicField(this, "eventBus", {
      on(event, handler) {
        return () => void {};
      },
      emit(event, payload) {
      }
    });
    __publicField(this, "storage", {
      get(key) {
        return null;
      },
      set(key, value) {
        return null;
      },
      remove(key) {
        return null;
      }
    });
    __publicField(this, "services", {
      log: this.logger,
      bus: this.eventBus,
      storage: this.storage
    });
  }
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
    if (document.body?.dataset?.component) return document.body;
    const legacy = document.getElementById("delphine-root");
    if (legacy) return legacy;
    return document.body ?? document.documentElement;
  }
  readProps(el, meta) {
    const out = {};
    for (const spec of meta.props()) {
      const raw = el.getAttribute(`data-${spec.name}`);
      if (raw == null) continue;
      out[spec.name] = this.convert(raw, spec.kind);
    }
    return out;
  }
  convert(raw, kind) {
    switch (kind) {
      case "string":
        return raw;
      case "number":
        return Number(raw);
      case "boolean":
        return raw === "true" || raw === "1" || raw === "";
      case "color":
        return raw;
    }
  }
  applyProps(child, cls) {
    const props = this.readProps(child.elem, cls);
    for (const spec of cls.props()) {
      if (props[spec.name] !== void 0) {
        spec.apply(child, props[spec.name]);
      }
    }
  }
  buildComponentTree(form, component) {
    this.clear();
    this.registerInstance(component.name, form);
    const root = component.elem;
    root.querySelectorAll(":scope > [data-component]").forEach((el) => {
      if (el === root) return;
      const name = el.getAttribute("data-name");
      const type = el.getAttribute("data-component");
      const cls = TApplication.TheApplication.types.get(type);
      if (!cls) return;
      const child = cls.create(name, form, component);
      if (!child) return;
      child.elem = el;
      this.applyProps(child, cls);
      this.registerInstance(name, child);
      component.children.push(child);
      const maybeHost = child;
      if (maybeHost && typeof maybeHost.setPluginSpec === "function") {
        const plugin = el.getAttribute("data-plugin");
        const raw = el.getAttribute("data-props");
        const props = raw ? JSON.parse(raw) : {};
        maybeHost.setPluginSpec({ plugin, props });
        maybeHost.mountPluginIfReady(this.services);
      }
      if (child.allowsChildren()) {
        this.buildComponentTree(form, child);
      }
    });
  }
};
var TComponent2 = class {
  constructor(metaClass, name, form, parent) {
    __publicField(this, "metaClass");
    __publicField(this, "name");
    __publicField(this, "parent", null);
    __publicField(this, "form", null);
    __publicField(this, "children", []);
    __publicField(this, "elem", null);
    this.metaClass = metaClass;
    this.name = name;
    this.parent = parent;
    parent?.children.push(this);
    this.form = form;
    this.name = name;
  }
  get htmlElement() {
    return this.elem;
  }
  /** May contain child components */
  allowsChildren() {
    return true;
  }
  get color() {
    return new TColor(this.getStyleProp("color"));
  }
  set color(v) {
    this.setStyleProp("color", v.s);
  }
  get backgroundColor() {
    return new TColor(this.getStyleProp("background-color"));
  }
  set backgroundColor(v) {
    this.setStyleProp("background-color", v.s);
  }
  get width() {
    return parseInt(this.getStyleProp("width"));
  }
  set width(v) {
    this.setStyleProp("width", v.toString());
  }
  get height() {
    return parseInt(this.getStyleProp("height"));
  }
  set height(v) {
    this.setStyleProp("height", v.toString());
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
};
var _TDocument = class _TDocument {
  constructor(htmlDoc) {
    __publicField(this, "htmlDoc");
    this.htmlDoc = htmlDoc;
  }
};
__publicField(_TDocument, "document", new _TDocument(document));
__publicField(_TDocument, "body", document.body);
var TDocument = _TDocument;
var _TMetaForm = class _TMetaForm extends TMetaComponent2 {
  constructor() {
    super(...arguments);
    __publicField(this, "typeName", "TForm");
  }
  getMetaClass() {
    return _TMetaForm.metaclass;
  }
  create(name, form, parent) {
    return new TForm2(name);
  }
  props() {
    return [];
  }
};
//metaclass: TMetaComponent<TForm>;
__publicField(_TMetaForm, "metaclass", new _TMetaForm());
var TMetaForm = _TMetaForm;
var _TForm = class _TForm extends TComponent2 {
  constructor(name) {
    super(TMetaForm.metaclass, name, null, null);
    __publicField(this, "_mounted", false);
    // Each Form has its own componentRegistry
    __publicField(this, "componentRegistry", new ComponentRegistry());
    __publicField(this, "_ac", null);
    this.form = this;
    _TForm.forms.set(name, this);
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
    const formElem = target.closest('[data-component="TForm"][data-name]');
    if (!formElem) return null;
    const formName = formElem.getAttribute("data-name");
    if (!formName) return null;
    return _TForm.forms.get(formName) ?? null;
  }
  installEventRouter() {
    this._ac?.abort();
    this._ac = new AbortController();
    const { signal } = this._ac;
    const root = this.elem;
    if (!root) return;
    const handler = (ev) => this.dispatchDomEvent(ev);
    for (const type of ["click", "input", "change", "keydown"]) {
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
    if (handlerName && handlerName !== "") {
      const name = el.getAttribute("data-name");
      const sender = name ? this.componentRegistry.get(name) ?? null : null;
      const maybeMethod = this[handlerName];
      if (typeof maybeMethod !== "function") {
        console.log("NOT A METHOD", handlerName);
        return false;
      }
      maybeMethod.call(this, ev, sender ?? this);
      return true;
    }
    return false;
  }
  // We received an DOM Event. Dispatch it
  dispatchDomEvent(ev) {
    const targetElem = ev.target;
    if (!targetElem) return;
    const evType = ev.type;
    let el = targetElem.closest("[data-component]");
    while (el) {
      if (this.handleEvent(ev, el, `data-on${evType}`)) return;
      const name = el.getAttribute("data-name");
      const comp = name ? this.componentRegistry.get(name) : null;
      const next = comp?.parent?.elem ?? null;
      el = next ?? el.parentElement?.closest("[data-component]") ?? null;
    }
  }
  show() {
    if (!this.elem) {
      this.elem = this.componentRegistry.resolveRoot();
    }
    if (!this._mounted) {
      this.componentRegistry.buildComponentTree(this, this);
      this.onCreate();
      this.installEventRouter();
      this._mounted = true;
    }
    this.onShown();
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
    const onShownName = this.elem.getAttribute("data-oncreate");
    if (onShownName) {
      queueMicrotask(() => {
        const fn = this[onShownName];
        if (typeof fn === "function") fn.call(this, null, this);
      });
    }
  }
  onShown() {
    const onShownName = this.elem.getAttribute("data-onshown");
    if (onShownName) {
      queueMicrotask(() => {
        const fn = this[onShownName];
        if (typeof fn === "function") fn.call(this, null, this);
      });
    }
  }
};
__publicField(_TForm, "forms", /* @__PURE__ */ new Map());
var TForm2 = _TForm;
var TButton2 = class extends TComponent2 {
  constructor(name, form, parent) {
    super(TMetaButton.metaClass, name, form, parent);
    __publicField(this, "_caption", "");
    __publicField(this, "_enabled", true);
  }
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
    if (this.htmlElement) this.htmlElement.textContent = s;
  }
  get enabled() {
    return this._enabled;
  }
  set enabled(enabled) {
    this.setEnabled(enabled);
  }
  setEnabled(enabled) {
    this._enabled = enabled;
    if (this.htmlElement) this.htmlButton().disabled = !enabled;
  }
  allowsChildren() {
    return false;
  }
};
var _TMetaButton = class _TMetaButton extends TMetaComponent2 {
  constructor() {
    super();
    __publicField(this, "typeName", "TButton");
  }
  getMetaClass() {
    return _TMetaButton.metaClass;
  }
  create(name, form, parent) {
    return new TButton2(name, form, parent);
  }
  props() {
    return [
      { name: "caption", kind: "string", apply: (o, v) => o.caption = String(v) },
      { name: "enabled", kind: "boolean", apply: (o, v) => o.enabled = Boolean(v) },
      { name: "color", kind: "color", apply: (o, v) => o.color = v }
    ];
  }
};
__publicField(_TMetaButton, "metaClass", new _TMetaButton());
var TMetaButton = _TMetaButton;
var _TApplication = class _TApplication {
  constructor() {
    //static pluginRegistry = new PluginRegistry();
    //plugins: IPluginRegistry;
    __publicField(this, "forms", []);
    __publicField(this, "types", new ComponentTypeRegistry2());
    __publicField(this, "mainForm", null);
    _TApplication.TheApplication = this;
    registerBuiltins(this.types);
  }
  createForm(ctor, name) {
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
  autoStart() {
  }
  runWhenDomReady(fn) {
    if (document.readyState === "loading") {
      window.addEventListener("DOMContentLoaded", fn, { once: true });
    } else {
      fn();
    }
  }
};
__publicField(_TApplication, "TheApplication");
var TApplication = _TApplication;
var _TMetaPluginHost = class _TMetaPluginHost extends TMetaComponent2 {
  constructor() {
    super(...arguments);
    __publicField(this, "typeName", "TPluginHost");
  }
  getMetaClass() {
    return _TMetaPluginHost.metaClass;
  }
  create(name, form, parent) {
    return new TPluginHost(name, form, parent);
  }
  props() {
    return [];
  }
};
__publicField(_TMetaPluginHost, "metaClass", new _TMetaPluginHost());
var TMetaPluginHost = _TMetaPluginHost;
var TPluginHost = class extends TComponent2 {
  constructor(name, form, parent) {
    super(TMetaPluginHost.metaClass, name, form, parent);
    __publicField(this, "instance", null);
    __publicField(this, "pluginName", null);
    __publicField(this, "pluginProps", {});
    __publicField(this, "factory", null);
  }
  // Called by the metaclass (or by your registry) right after creation
  setPluginFactory(factory) {
    this.factory = factory;
  }
  mountPlugin(props, services) {
    const container = this.htmlElement;
    if (!container) return;
    if (!this.factory) {
      services.log.warn("TPluginHost: no plugin factory set", { host: this.name });
      return;
    }
    this.unmount();
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
    if (!container || !this.form || !this.pluginName) return;
    const app = TApplication.TheApplication;
    const def = PluginRegistry.pluginRegistry.get(this.pluginName);
    if (!def) {
      services.log.warn("Unknown plugin", { plugin: this.pluginName });
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
    } finally {
      this.instance = null;
    }
  }
};
var _PluginRegistry = class _PluginRegistry {
  constructor() {
    __publicField(this, "plugins", /* @__PURE__ */ new Map());
  }
  register(name, def) {
    if (this.plugins.has(name)) throw new Error(`Plugin already registered: ${name}`);
    this.plugins.set(name, def);
  }
  get(name) {
    return this.plugins.get(name);
  }
  has(name) {
    return this.plugins.has(name);
  }
};
__publicField(_PluginRegistry, "pluginRegistry", new _PluginRegistry());
var PluginRegistry = _PluginRegistry;

// examples/zaza/zaza.ts
console.log("I AM ZAZA");
console.log("I AM ZAZA");
var Zaza = class extends TForm2 {
  // Form components - This list is auto generated by Delphine
  // ---------------
  //button1 : TButton = new TButton("button1", this, this);
  //button2 : TButton = new TButton("button2", this, this);
  //button3 : TButton = new TButton("button3", this, this);
  // ---------------
  constructor(name) {
    super(name);
  }
  //import { installDelphineRuntime } from "./drt";
  /*
  const runtime = {   
    handleClick({ element }: { element: Element }) {
      console.log("clicked!", element);
      //(element as HTMLElement).style.backgroundColor = "red";
    },
  }; 
  */
  onMyCreate(_ev, _sender) {
    const btn = this.componentRegistry.get("button2");
    if (btn) btn.color = TColor.rgb(0, 0, 255);
  }
  onMyShown(_ev, _sender) {
    const btn = this.componentRegistry.get("button3");
    if (btn) btn.color = TColor.rgb(0, 255, 255);
  }
  button1_onclick(_ev, _sender) {
    const btn = this.componentRegistry.get("button1");
    if (!btn) {
      console.warn("button1 not found in registry");
      return;
    }
    btn.color = TColor.rgb(255, 0, 0);
    btn.setCaption("MIMI");
    console.log("Button1 clicked!!!!");
  }
  zaza_onclick(_ev, _sender) {
    const btn = this.componentRegistry.get("buttonx");
    btn.color = TColor.rgb(0, 255, 0);
    console.log("zaza clicked!!!!");
  }
  //installDelphineRuntime(runtime);
};
var MyApplication = class extends TApplication {
  constructor() {
    super();
    __publicField(this, "zaza");
    this.zaza = new Zaza("zaza");
    this.mainForm = this.zaza;
  }
  run() {
    this.runWhenDomReady(() => {
      this.zaza.show();
    });
  }
};
var myApplication = new MyApplication();
myApplication.run();
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vc3JjL3ZjbC9yZWdpc3RlclZjbC50cyIsICIuLi9zcmMvdmNsL1N0ZEN0cmxzLnRzIiwgIi4uL2V4YW1wbGVzL3phemEvemF6YS50cyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiLy8gRW5nbGlzaCBjb21tZW50cyBhcyByZXF1ZXN0ZWQuXG5cbi8vaW1wb3J0IHsgQ29tcG9uZW50VHlwZVJlZ2lzdHJ5IH0gZnJvbSAnQGRydCc7XG5pbXBvcnQgeyBUQnV0dG9uLCBUTWV0YUNvbXBvbmVudCwgVEZvcm0sIFRDb21wb25lbnQsIENvbXBvbmVudFR5cGVSZWdpc3RyeSwgVE1ldGFCdXR0b24sIFRNZXRhUGx1Z2luSG9zdCB9IGZyb20gJ0B2Y2wnO1xuLy9pbXBvcnQgeyBUTWV0YVBsdWdpbkhvc3QgfSBmcm9tICcuLi9kcnQvVUlQbHVnaW4nOyAvLyBOT1QgR09PRCAhIGltcG9ydCBWQ0whXG5cbi8vIEVuZ2xpc2ggY29tbWVudHMgYXMgcmVxdWVzdGVkLlxuZXhwb3J0IGZ1bmN0aW9uIHJlZ2lzdGVyQnVpbHRpbnModHlwZXM6IENvbXBvbmVudFR5cGVSZWdpc3RyeSkge1xuICAgICAgICB0eXBlcy5yZWdpc3RlcihUTWV0YUJ1dHRvbi5tZXRhQ2xhc3MpO1xuICAgICAgICB0eXBlcy5yZWdpc3RlcihUTWV0YVBsdWdpbkhvc3QubWV0YUNsYXNzKTtcbiAgICAgICAgLy8gdHlwZXMucmVnaXN0ZXIoVEVkaXRDbGFzcyk7XG4gICAgICAgIC8vIHR5cGVzLnJlZ2lzdGVyKFRMYWJlbENsYXNzKTtcbn1cbiIsICIvL2ltcG9ydCB7IENvbXBvbmVudFR5cGVSZWdpc3RyeSB9IGZyb20gJy4uL2RydC9VSVBsdWdpbic7IC8vIFBBUyBcImltcG9ydCB0eXBlXCJcbi8vIC8vaW1wb3J0IHR5cGUgeyBKc29uLCBEZWxwaGluZVNlcnZpY2VzLCBDb21wb25lbnRUeXBlUmVnaXN0cnkgfSBmcm9tICcuLi9kcnQvVUlQbHVnaW4nO1xuLy9pbXBvcnQgeyByZWdpc3RlclZjbFR5cGVzIH0gZnJvbSAnLi9yZWdpc3RlclZjbCc7XG4vL2ltcG9ydCB7IEJ1dHRvbiB9IGZyb20gJ2dyYXBlc2pzJztcbmltcG9ydCB7IHJlZ2lzdGVyQnVpbHRpbnMgfSBmcm9tICcuL3JlZ2lzdGVyVmNsJztcblxuZXhwb3J0IHR5cGUgQ29tcG9uZW50RmFjdG9yeSA9IChuYW1lOiBzdHJpbmcsIGZvcm06IFRGb3JtLCBvd25lcjogVENvbXBvbmVudCkgPT4gVENvbXBvbmVudDtcblxuLy9pbXBvcnQgdHlwZSB7IEpzb24gfSBmcm9tICcuL0pzb24nO1xuZXhwb3J0IHR5cGUgSnNvbiA9IG51bGwgfCBib29sZWFuIHwgbnVtYmVyIHwgc3RyaW5nIHwgSnNvbltdIHwgeyBba2V5OiBzdHJpbmddOiBKc29uIH07XG5cbnR5cGUgUHJvcEtpbmQgPSAnc3RyaW5nJyB8ICdudW1iZXInIHwgJ2Jvb2xlYW4nIHwgJ2NvbG9yJztcbmV4cG9ydCB0eXBlIFByb3BTcGVjPFQsIFYgPSB1bmtub3duPiA9IHtcbiAgICAgICAgbmFtZTogc3RyaW5nO1xuICAgICAgICBraW5kOiBQcm9wS2luZDtcbiAgICAgICAgYXBwbHk6IChvYmo6IFQsIHZhbHVlOiBWKSA9PiB2b2lkO1xufTtcblxuZXhwb3J0IGludGVyZmFjZSBJUGx1Z2luSG9zdCB7XG4gICAgICAgIHNldFBsdWdpblNwZWMoc3BlYzogeyBwbHVnaW46IHN0cmluZyB8IG51bGw7IHByb3BzOiBhbnkgfSk6IHZvaWQ7XG4gICAgICAgIG1vdW50UGx1Z2luSWZSZWFkeShzZXJ2aWNlczogRGVscGhpbmVTZXJ2aWNlcyk6IHZvaWQ7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgRGVscGhpbmVMb2dnZXIge1xuICAgICAgICBkZWJ1Zyhtc2c6IHN0cmluZywgZGF0YT86IEpzb24pOiB2b2lkO1xuICAgICAgICBpbmZvKG1zZzogc3RyaW5nLCBkYXRhPzogSnNvbik6IHZvaWQ7XG4gICAgICAgIHdhcm4obXNnOiBzdHJpbmcsIGRhdGE/OiBKc29uKTogdm9pZDtcbiAgICAgICAgZXJyb3IobXNnOiBzdHJpbmcsIGRhdGE/OiBKc29uKTogdm9pZDtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBEZWxwaGluZUV2ZW50QnVzIHtcbiAgICAgICAgLy8gU3Vic2NyaWJlIHRvIGFuIGFwcCBldmVudC5cbiAgICAgICAgb24oZXZlbnROYW1lOiBzdHJpbmcsIGhhbmRsZXI6IChwYXlsb2FkOiBKc29uKSA9PiB2b2lkKTogKCkgPT4gdm9pZDtcblxuICAgICAgICAvLyBQdWJsaXNoIGFuIGFwcCBldmVudC5cbiAgICAgICAgZW1pdChldmVudE5hbWU6IHN0cmluZywgcGF5bG9hZDogSnNvbik6IHZvaWQ7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgRGVscGhpbmVTdG9yYWdlIHtcbiAgICAgICAgZ2V0KGtleTogc3RyaW5nKTogUHJvbWlzZTxKc29uIHwgdW5kZWZpbmVkPjtcbiAgICAgICAgc2V0KGtleTogc3RyaW5nLCB2YWx1ZTogSnNvbik6IFByb21pc2U8dm9pZD47XG4gICAgICAgIHJlbW92ZShrZXk6IHN0cmluZyk6IFByb21pc2U8dm9pZD47XG59XG5leHBvcnQgaW50ZXJmYWNlIERlbHBoaW5lU2VydmljZXMge1xuICAgICAgICBsb2c6IHtcbiAgICAgICAgICAgICAgICBkZWJ1Zyhtc2c6IHN0cmluZywgZGF0YT86IGFueSk6IHZvaWQ7XG4gICAgICAgICAgICAgICAgaW5mbyhtc2c6IHN0cmluZywgZGF0YT86IGFueSk6IHZvaWQ7XG4gICAgICAgICAgICAgICAgd2Fybihtc2c6IHN0cmluZywgZGF0YT86IGFueSk6IHZvaWQ7XG4gICAgICAgICAgICAgICAgZXJyb3IobXNnOiBzdHJpbmcsIGRhdGE/OiBhbnkpOiB2b2lkO1xuICAgICAgICB9O1xuXG4gICAgICAgIGJ1czoge1xuICAgICAgICAgICAgICAgIG9uKGV2ZW50OiBzdHJpbmcsIGhhbmRsZXI6IChwYXlsb2FkOiBhbnkpID0+IHZvaWQpOiAoKSA9PiB2b2lkO1xuICAgICAgICAgICAgICAgIGVtaXQoZXZlbnQ6IHN0cmluZywgcGF5bG9hZDogYW55KTogdm9pZDtcbiAgICAgICAgfTtcblxuICAgICAgICBzdG9yYWdlOiB7XG4gICAgICAgICAgICAgICAgZ2V0KGtleTogc3RyaW5nKTogUHJvbWlzZTxhbnk+IHwgbnVsbDtcbiAgICAgICAgICAgICAgICBzZXQoa2V5OiBzdHJpbmcsIHZhbHVlOiBhbnkpOiBQcm9taXNlPHZvaWQ+IHwgbnVsbDtcbiAgICAgICAgICAgICAgICByZW1vdmUoa2V5OiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHwgbnVsbDtcbiAgICAgICAgfTtcblxuICAgICAgICAvLyBmdXR1clxuICAgICAgICAvLyBpMThuPzogLi4uXG4gICAgICAgIC8vIG5hdj86IC4uLlxufVxuXG5leHBvcnQgaW50ZXJmYWNlIFVJUGx1Z2luSW5zdGFuY2U8UHJvcHMgZXh0ZW5kcyBKc29uID0gSnNvbj4ge1xuICAgICAgICByZWFkb25seSBpZDogc3RyaW5nO1xuXG4gICAgICAgIC8vIENhbGxlZCBleGFjdGx5IG9uY2UgYWZ0ZXIgY3JlYXRpb24gKGZvciBhIGdpdmVuIGluc3RhbmNlKS5cbiAgICAgICAgbW91bnQoY29udGFpbmVyOiBIVE1MRWxlbWVudCwgcHJvcHM6IFByb3BzLCBzZXJ2aWNlczogRGVscGhpbmVTZXJ2aWNlcyk6IHZvaWQ7XG5cbiAgICAgICAgLy8gQ2FsbGVkIGFueSB0aW1lIHByb3BzIGNoYW5nZSAobWF5IGJlIGZyZXF1ZW50KS5cbiAgICAgICAgdXBkYXRlKHByb3BzOiBQcm9wcyk6IHZvaWQ7XG5cbiAgICAgICAgLy8gQ2FsbGVkIGV4YWN0bHkgb25jZSBiZWZvcmUgZGlzcG9zYWwuXG4gICAgICAgIHVubW91bnQoKTogdm9pZDtcblxuICAgICAgICAvLyBPcHRpb25hbCBlcmdvbm9taWNzLlxuICAgICAgICBnZXRTaXplSGludHM/KCk6IG51bWJlcjtcbiAgICAgICAgZm9jdXM/KCk6IHZvaWQ7XG5cbiAgICAgICAgLy8gT3B0aW9uYWwgcGVyc2lzdGVuY2UgaG9vayAoRGVscGhpbmUgbWF5IHN0b3JlICYgcmVzdG9yZSB0aGlzKS5cbiAgICAgICAgc2VyaWFsaXplU3RhdGU/KCk6IEpzb247XG59XG5leHBvcnQgYWJzdHJhY3QgY2xhc3MgVE1ldGFjbGFzczxUIGV4dGVuZHMgVE1ldGFjbGFzczxhbnk+ID0gYW55PiB7XG4gICAgICAgIHJlYWRvbmx5IHR5cGVOYW1lOiBzdHJpbmcgPSAnTWV0YWNsYXNzJztcbiAgICAgICAgc3RhdGljIG1ldGFjbGFzczogVE1ldGFjbGFzcztcblxuICAgICAgICBhYnN0cmFjdCBnZXRNZXRhQ2xhc3MoKTogVE1ldGFjbGFzcztcbiAgICAgICAgY29uc3RydWN0b3IoKSB7fVxuICAgICAgICBhYnN0cmFjdCBjcmVhdGUobmFtZTogc3RyaW5nLCBmb3JtOiBURm9ybSwgcGFyZW50OiBUT2JqZWN0PGFueT4pOiBUO1xufVxuXG5leHBvcnQgY2xhc3MgVE9iamVjdDxUU2VsZiBleHRlbmRzIFRPYmplY3Q8YW55PiA9IGFueT4ge31cblxuZXhwb3J0IGFic3RyYWN0IGNsYXNzIFRNZXRhT2JqZWN0IGV4dGVuZHMgVE1ldGFjbGFzcyB7XG4gICAgICAgIC8vc3RhdGljIG1ldGFDbGFzczogVE1ldGFPYmplY3QgPSBuZXcgVE1ldGFPYmplY3QoKTtcbiAgICAgICAgcmVhZG9ubHkgdHlwZU5hbWU6IHN0cmluZyA9ICdPYmplY3QnO1xuXG4gICAgICAgIGFic3RyYWN0IGdldE1ldGFDbGFzcygpOiBUTWV0YU9iamVjdDtcbiAgICAgICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgICAgICAgICAgc3VwZXIoKTtcbiAgICAgICAgfVxuICAgICAgICBhYnN0cmFjdCBjcmVhdGUoKTogVE9iamVjdDtcblxuICAgICAgICAvL2Fic3RyYWN0IGdldE1ldGFDbGFzcygpOiBUTWV0YUNvbXBvbmVudDxUPjtcbn1cblxuLy8gRW5nbGlzaCBjb21tZW50cyBhcyByZXF1ZXN0ZWQuXG5leHBvcnQgYWJzdHJhY3QgY2xhc3MgVE1ldGFDb21wb25lbnQ8VCBleHRlbmRzIFRDb21wb25lbnQ+IGV4dGVuZHMgVE1ldGFjbGFzcyB7XG4gICAgICAgIC8vIFRoZSBzeW1ib2xpYyBuYW1lIHVzZWQgaW4gSFRNTDogZGF0YS1jb21wb25lbnQ9XCJUQnV0dG9uXCIgb3IgXCJteS1idXR0b25cIlxuICAgICAgICBhYnN0cmFjdCByZWFkb25seSB0eXBlTmFtZTogc3RyaW5nO1xuICAgICAgICAvL3N0YXRpYyBtZXRhQ2xhc3M6IFRNZXRhQ29tcG9uZW50PFQ+ID0gbmV3IFRNZXRhQ29tcG9uZW50PFQ+KCk7XG4gICAgICAgIC8vYWJzdHJhY3QgcmVhZG9ubHkgbWV0YWNsYXNzOiBUTWV0YUNvbXBvbmVudDxUPjtcbiAgICAgICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgICAgICAgICAgc3VwZXIoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGFic3RyYWN0IGdldE1ldGFDbGFzcygpOiBUTWV0YUNvbXBvbmVudDxUPjtcbiAgICAgICAgLy9hYnN0cmFjdCBnZXRNZXRhQ2xhc3MoKTogVE1ldGFDb21wb25lbnQ8VD47XG4gICAgICAgIC8vYWJzdHJhY3QgZ2V0TWV0YUNsYXNzKCk6IFRNZXRhQ29tcG9uZW50PFQ+OyAvL3tcbiAgICAgICAgLy9yZXR1cm4gVE1ldGFDb21wb25lbnQubWV0YWNsYXNzO1xuICAgICAgICAvL31cblxuICAgICAgICAvLyBDcmVhdGUgdGhlIHJ1bnRpbWUgaW5zdGFuY2UgYW5kIGF0dGFjaCBpdCB0byB0aGUgRE9NIGVsZW1lbnQuXG4gICAgICAgIGNyZWF0ZShuYW1lOiBzdHJpbmcsIGZvcm06IFRGb3JtLCBwYXJlbnQ6IFRDb21wb25lbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gbmV3IFRDb21wb25lbnQodGhpcy5nZXRNZXRhQ2xhc3MoKSwgbmFtZSwgZm9ybSwgcGFyZW50KTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8qKiBQcm9wZXJ0eSBzY2hlbWEgZm9yIHRoaXMgY29tcG9uZW50IHR5cGUgKi9cbiAgICAgICAgcHJvcHMoKTogUHJvcFNwZWM8VD5bXSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIFtdO1xuICAgICAgICB9XG5cbiAgICAgICAgZG9tRXZlbnRzPygpOiBzdHJpbmdbXTsgLy8gZGVmYXVsdCBbXTtcblxuICAgICAgICAvKlxuICAgICAgICAvLyBPcHRpb25hbDogcGFyc2UgSFRNTCBhdHRyaWJ1dGVzIC0+IHByb3BzL3N0YXRlXG4gICAgICAgIC8vIEV4YW1wbGU6IGRhdGEtY2FwdGlvbj1cIk9LXCIgLT4geyBjYXB0aW9uOiBcIk9LXCIgfVxuICAgICAgICBwYXJzZVByb3BzPyhlbGVtOiBIVE1MRWxlbWVudCk6IEpzb247XG5cbiAgICAgICAgLy8gT3B0aW9uYWw6IGFwcGx5IHByb3BzIHRvIHRoZSBjb21wb25lbnQgKGNhbiBiZSBjYWxsZWQgYWZ0ZXIgY3JlYXRlKVxuICAgICAgICBhcHBseVByb3BzPyhjOiBULCBwcm9wczogSnNvbik6IHZvaWQ7XG5cbiAgICAgICAgLy8gT3B0aW9uYWw6IERlc2lnbi10aW1lIG1ldGFkYXRhIChwYWxldHRlLCBpbnNwZWN0b3IsIGV0Yy4pXG4gICAgICAgIGRlc2lnblRpbWU/OiB7XG4gICAgICAgICAgICAgICAgcGFsZXR0ZUdyb3VwPzogc3RyaW5nO1xuICAgICAgICAgICAgICAgIGRpc3BsYXlOYW1lPzogc3RyaW5nO1xuICAgICAgICAgICAgICAgIGljb24/OiBzdHJpbmc7IC8vIGxhdGVyXG4gICAgICAgICAgICAgICAgLy8gcHJvcGVydHkgc2NoZW1hIGNvdWxkIGxpdmUgaGVyZVxuICAgICAgICB9O1xuICAgICAgICAqL1xufVxuXG4vL2ltcG9ydCB0eXBlIHsgVENvbXBvbmVudENsYXNzIH0gZnJvbSAnLi9UQ29tcG9uZW50Q2xhc3MnO1xuLy9pbXBvcnQgdHlwZSB7IFRDb21wb25lbnQgfSBmcm9tICdAdmNsJztcblxuZXhwb3J0IGNsYXNzIENvbXBvbmVudFR5cGVSZWdpc3RyeSB7XG4gICAgICAgIC8vIFdlIHN0b3JlIGhldGVyb2dlbmVvdXMgbWV0YXMsIHNvIHdlIGtlZXAgdGhlbSBhcyBUTWV0YUNvbXBvbmVudDxhbnk+LlxuICAgICAgICBwcml2YXRlIHJlYWRvbmx5IGNsYXNzZXMgPSBuZXcgTWFwPHN0cmluZywgVE1ldGFDb21wb25lbnQ8VENvbXBvbmVudD4+KCk7XG5cbiAgICAgICAgcmVnaXN0ZXIobWV0YTogVE1ldGFDb21wb25lbnQ8YW55Pikge1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLmNsYXNzZXMuaGFzKG1ldGEudHlwZU5hbWUpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYENvbXBvbmVudCB0eXBlIGFscmVhZHkgcmVnaXN0ZXJlZDogJHttZXRhLnR5cGVOYW1lfWApO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB0aGlzLmNsYXNzZXMuc2V0KG1ldGEudHlwZU5hbWUsIG1ldGEpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gSWYgeW91IGp1c3QgbmVlZCBcInNvbWV0aGluZyBtZXRhXCIsIHJldHVybiBhbnktbWV0YS5cbiAgICAgICAgZ2V0KHR5cGVOYW1lOiBzdHJpbmcpOiBUTWV0YUNvbXBvbmVudDxUQ29tcG9uZW50PiB8IHVuZGVmaW5lZCB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuY2xhc3Nlcy5nZXQodHlwZU5hbWUpO1xuICAgICAgICB9XG5cbiAgICAgICAgaGFzKHR5cGVOYW1lOiBzdHJpbmcpOiBib29sZWFuIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5jbGFzc2VzLmhhcyh0eXBlTmFtZSk7XG4gICAgICAgIH1cblxuICAgICAgICBsaXN0KCk6IHN0cmluZ1tdIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gWy4uLnRoaXMuY2xhc3Nlcy5rZXlzKCldLnNvcnQoKTtcbiAgICAgICAgfVxufVxuXG4vKlxuXG4vL2V4cG9ydCB0eXBlIENvbXBvbmVudEZhY3RvcnkgPSAobmFtZTogc3RyaW5nLCBmb3JtOiBURm9ybSwgcGFyZW50OiBUQ29tcG9uZW50KSA9PiBUQ29tcG9uZW50O1xuXG5leHBvcnQgY2xhc3MgQ29tcG9uZW50VHlwZVJlZ2lzdHJ5IHtcbiAgICAgICAgcHJpdmF0ZSBmYWN0b3JpZXMgPSBuZXcgTWFwPHN0cmluZywgQ29tcG9uZW50RmFjdG9yeT4oKTtcblxuICAgICAgICBnZXQobmFtZTogc3RyaW5nKTogQ29tcG9uZW50RmFjdG9yeSB8IG51bGwgfCB1bmRlZmluZWQge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmZhY3Rvcmllcy5nZXQobmFtZSk7XG4gICAgICAgIH1cblxuICAgICAgICByZWdpc3RlclR5cGUodHlwZU5hbWU6IHN0cmluZywgZmFjdG9yeTogQ29tcG9uZW50RmFjdG9yeSkge1xuICAgICAgICAgICAgICAgIHRoaXMuZmFjdG9yaWVzLnNldCh0eXBlTmFtZSwgZmFjdG9yeSk7XG4gICAgICAgIH1cblxuICAgICAgICBjcmVhdGUobmFtZTogc3RyaW5nLCBmb3JtOiBURm9ybSwgcGFyZW50OiBUQ29tcG9uZW50KTogVENvbXBvbmVudCB8IG51bGwge1xuICAgICAgICAgICAgICAgIGNvbnN0IGYgPSB0aGlzLmZhY3Rvcmllcy5nZXQobmFtZSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGYgPyBmKG5hbWUsIGZvcm0sIHBhcmVudCkgOiBudWxsO1xuICAgICAgICB9XG59XG5cbiovXG5cbmV4cG9ydCBjbGFzcyBUQ29sb3Ige1xuICAgICAgICBzOiBzdHJpbmc7XG5cbiAgICAgICAgY29uc3RydWN0b3Ioczogc3RyaW5nKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5zID0gcztcbiAgICAgICAgfVxuICAgICAgICAvKiBmYWN0b3J5ICovIHN0YXRpYyByZ2IocjogbnVtYmVyLCBnOiBudW1iZXIsIGI6IG51bWJlcik6IFRDb2xvciB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBUQ29sb3IoYHJnYigke3J9LCAke2d9LCAke2J9KWApO1xuICAgICAgICB9XG4gICAgICAgIC8qIGZhY3RvcnkgKi8gc3RhdGljIHJnYmEocjogbnVtYmVyLCBnOiBudW1iZXIsIGI6IG51bWJlciwgYTogbnVtYmVyKTogVENvbG9yIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gbmV3IFRDb2xvcihgcmdiYSgke3J9LCAke2d9LCAke2J9LCAke2F9KWApO1xuICAgICAgICB9XG59XG5cbmV4cG9ydCBjbGFzcyBDb21wb25lbnRSZWdpc3RyeSB7XG4gICAgICAgIHByaXZhdGUgaW5zdGFuY2VzID0gbmV3IE1hcDxzdHJpbmcsIFRDb21wb25lbnQ+KCk7XG5cbiAgICAgICAgbG9nZ2VyID0ge1xuICAgICAgICAgICAgICAgIGRlYnVnKG1zZzogc3RyaW5nLCBkYXRhPzogSnNvbik6IHZvaWQge30sXG4gICAgICAgICAgICAgICAgaW5mbyhtc2c6IHN0cmluZywgZGF0YT86IEpzb24pOiB2b2lkIHt9LFxuICAgICAgICAgICAgICAgIHdhcm4obXNnOiBzdHJpbmcsIGRhdGE/OiBKc29uKTogdm9pZCB7fSxcbiAgICAgICAgICAgICAgICBlcnJvcihtc2c6IHN0cmluZywgZGF0YT86IEpzb24pOiB2b2lkIHt9XG4gICAgICAgIH07XG5cbiAgICAgICAgZXZlbnRCdXMgPSB7XG4gICAgICAgICAgICAgICAgb24oZXZlbnQ6IHN0cmluZywgaGFuZGxlcjogKHBheWxvYWQ6IGFueSkgPT4gdm9pZCk6ICgpID0+IHZvaWQge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuICgpID0+IHZvaWQge307XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBlbWl0KGV2ZW50OiBzdHJpbmcsIHBheWxvYWQ6IGFueSk6IHZvaWQge31cbiAgICAgICAgfTtcblxuICAgICAgICBzdG9yYWdlID0ge1xuICAgICAgICAgICAgICAgIGdldChrZXk6IHN0cmluZyk6IFByb21pc2U8YW55PiB8IG51bGwge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBzZXQoa2V5OiBzdHJpbmcsIHZhbHVlOiBhbnkpOiBQcm9taXNlPHZvaWQ+IHwgbnVsbCB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIHJlbW92ZShrZXk6IHN0cmluZyk6IFByb21pc2U8dm9pZD4gfCBudWxsIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgfTtcblxuICAgICAgICBjb25zdHJ1Y3RvcigpIHt9XG5cbiAgICAgICAgcmVnaXN0ZXJJbnN0YW5jZShuYW1lOiBzdHJpbmcsIGM6IFRDb21wb25lbnQpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmluc3RhbmNlcy5zZXQobmFtZSwgYyk7XG4gICAgICAgIH1cbiAgICAgICAgZ2V0PFQgZXh0ZW5kcyBUQ29tcG9uZW50ID0gVENvbXBvbmVudD4obmFtZTogc3RyaW5nKTogVCB8IHVuZGVmaW5lZCB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuaW5zdGFuY2VzLmdldChuYW1lKSBhcyBUIHwgdW5kZWZpbmVkO1xuICAgICAgICB9XG5cbiAgICAgICAgc2VydmljZXM6IERlbHBoaW5lU2VydmljZXMgPSB7XG4gICAgICAgICAgICAgICAgbG9nOiB0aGlzLmxvZ2dlcixcbiAgICAgICAgICAgICAgICBidXM6IHRoaXMuZXZlbnRCdXMsXG4gICAgICAgICAgICAgICAgc3RvcmFnZTogdGhpcy5zdG9yYWdlXG4gICAgICAgIH07XG5cbiAgICAgICAgY2xlYXIoKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5pbnN0YW5jZXMuY2xlYXIoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJlc29sdmVSb290KCk6IEhUTUxFbGVtZW50IHtcbiAgICAgICAgICAgICAgICAvLyBQcmVmZXIgYm9keSBhcyB0aGUgY2Fub25pY2FsIHJvb3QuXG4gICAgICAgICAgICAgICAgaWYgKGRvY3VtZW50LmJvZHk/LmRhdGFzZXQ/LmNvbXBvbmVudCkgcmV0dXJuIGRvY3VtZW50LmJvZHk7XG5cbiAgICAgICAgICAgICAgICAvLyBCYWNrd2FyZCBjb21wYXRpYmlsaXR5OiBvbGQgd3JhcHBlciBkaXYuXG4gICAgICAgICAgICAgICAgY29uc3QgbGVnYWN5ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2RlbHBoaW5lLXJvb3QnKTtcbiAgICAgICAgICAgICAgICBpZiAobGVnYWN5KSByZXR1cm4gbGVnYWN5O1xuXG4gICAgICAgICAgICAgICAgLy8gTGFzdCByZXNvcnQuXG4gICAgICAgICAgICAgICAgcmV0dXJuIGRvY3VtZW50LmJvZHkgPz8gZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50O1xuICAgICAgICB9XG5cbiAgICAgICAgcHJpdmF0ZSByZWFkUHJvcHMoZWw6IEVsZW1lbnQsIG1ldGE6IFRNZXRhQ29tcG9uZW50PFRDb21wb25lbnQ+KSB7XG4gICAgICAgICAgICAgICAgY29uc3Qgb3V0OiBSZWNvcmQ8c3RyaW5nLCBhbnk+ID0ge307XG4gICAgICAgICAgICAgICAgZm9yIChjb25zdCBzcGVjIG9mIG1ldGEucHJvcHMoKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgcmF3ID0gZWwuZ2V0QXR0cmlidXRlKGBkYXRhLSR7c3BlYy5uYW1lfWApO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHJhdyA9PSBudWxsKSBjb250aW51ZTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgb3V0W3NwZWMubmFtZV0gPSB0aGlzLmNvbnZlcnQocmF3LCBzcGVjLmtpbmQpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gb3V0O1xuICAgICAgICB9XG5cbiAgICAgICAgcHJpdmF0ZSBjb252ZXJ0KHJhdzogc3RyaW5nLCBraW5kOiBQcm9wS2luZCkge1xuICAgICAgICAgICAgICAgIHN3aXRjaCAoa2luZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSAnc3RyaW5nJzpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJhdztcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgJ251bWJlcic6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBOdW1iZXIocmF3KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgJ2Jvb2xlYW4nOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmF3ID09PSAndHJ1ZScgfHwgcmF3ID09PSAnMScgfHwgcmF3ID09PSAnJztcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgJ2NvbG9yJzpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJhdzsgLy8gb3UgcGFyc2UgZW4gVENvbG9yIHNpIHZvdXMgYXZlelxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGFwcGx5UHJvcHMoY2hpbGQ6IFRDb21wb25lbnQsIGNsczogVE1ldGFDb21wb25lbnQ8VENvbXBvbmVudD4pIHtcbiAgICAgICAgICAgICAgICBjb25zdCBwcm9wcyA9IHRoaXMucmVhZFByb3BzKGNoaWxkLmVsZW0hLCBjbHMpO1xuICAgICAgICAgICAgICAgIGZvciAoY29uc3Qgc3BlYyBvZiBjbHMucHJvcHMoKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHByb3BzW3NwZWMubmFtZV0gIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzcGVjLmFwcGx5KGNoaWxkLCBwcm9wc1tzcGVjLm5hbWVdKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBidWlsZENvbXBvbmVudFRyZWUoZm9ybTogVEZvcm0sIGNvbXBvbmVudDogVENvbXBvbmVudCkge1xuICAgICAgICAgICAgICAgIHRoaXMuY2xlYXIoKTtcbiAgICAgICAgICAgICAgICAvLyByZXNvbHZlUm9vdCBlc3QgbWFpbnRlbmFudCBhcHBlbFx1MDBFOSBwYXIgVEZvcm06OnNob3coKS4gSW51dGlsZSBkZSBsZSBmYWlyZSBpY2lcbiAgICAgICAgICAgICAgICAvL2NvbnN0IHJvb3QgPSBURG9jdW1lbnQuYm9keTtcbiAgICAgICAgICAgICAgICAvL2NvbnN0IHJvb3QgPSAoZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2RlbHBoaW5lLXJvb3QnKSA/PyBkb2N1bWVudC5ib2R5KSBhcyBIVE1MRWxlbWVudDtcbiAgICAgICAgICAgICAgICAvL2NvbnN0IHJvb3QgPSAoZG9jdW1lbnQuYm9keT8ubWF0Y2hlcygnW2RhdGEtY29tcG9uZW50XScpID8gZG9jdW1lbnQuYm9keSA6IG51bGwpID8/IChkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnZGVscGhpbmUtcm9vdCcpIGFzIEhUTUxFbGVtZW50IHwgbnVsbCkgPz8gZG9jdW1lbnQuYm9keTtcbiAgICAgICAgICAgICAgICAvL2NvbnN0IHJvb3QgPSB0aGlzLnJlc29sdmVSb290KCk7XG5cbiAgICAgICAgICAgICAgICAvLyAtLS0gRk9STSAtLS1cbiAgICAgICAgICAgICAgICAvLyBwcm92aXNvaXJlbWVudCBpZiAocm9vdC5nZXRBdHRyaWJ1dGUoJ2RhdGEtY29tcG9uZW50JykgPT09ICdURm9ybScpIHtcblxuICAgICAgICAgICAgICAgIHRoaXMucmVnaXN0ZXJJbnN0YW5jZShjb21wb25lbnQubmFtZSwgZm9ybSk7XG4gICAgICAgICAgICAgICAgLy99XG4gICAgICAgICAgICAgICAgY29uc3Qgcm9vdCA9IGNvbXBvbmVudC5lbGVtITtcblxuICAgICAgICAgICAgICAgIC8vIC0tLSBDSElMRCBDT01QT05FTlRTIC0tLVxuICAgICAgICAgICAgICAgIHJvb3QucXVlcnlTZWxlY3RvckFsbCgnOnNjb3BlID4gW2RhdGEtY29tcG9uZW50XScpLmZvckVhY2goKGVsKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoZWwgPT09IHJvb3QpIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IG5hbWUgPSBlbC5nZXRBdHRyaWJ1dGUoJ2RhdGEtbmFtZScpO1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgdHlwZSA9IGVsLmdldEF0dHJpYnV0ZSgnZGF0YS1jb21wb25lbnQnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vY29uc3QgdGl0aSA9IGVsLmdldEF0dHJpYnV0ZSgnZGF0YS1vbmNsaWNrJyk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIC8vY29uc29sZS5sb2coYHRpdGkgPSAke3RpdGl9YCk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIC8vbGV0IGNvbXA6IFRDb21wb25lbnQgfCBudWxsID0gbnVsbDtcblxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gVGhlIGZvbGxvd2luZyBzd2l0Y2ggaXMganVzdCBmb3Igbm93LiBJbiB0aGUgZnV0dXJlIGl0IHdpbGwgbm90IGJlIG5lY2Vzc2FyeVxuICAgICAgICAgICAgICAgICAgICAgICAgLypcbiAgICAgICAgICAgICAgICAgICAgICAgIHN3aXRjaCAodHlwZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYXNlICdteS1idXR0b24nOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbXAgPSBuZXcgVEJ1dHRvbihuYW1lISwgZm9ybSwgZm9ybSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSAnZGVscGhpbmUtcGx1Z2luJzpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvL2NvbXAgPSBuZXcgUGx1Z2luSG9zdChuYW1lLCBmb3JtLCBmb3JtKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSovXG4gICAgICAgICAgICAgICAgICAgICAgICAvL2NvbnN0IGFwcGxpY2F0aW9uOiBUQXBwbGljYXRpb24gPSBuZXcgVEFwcGxpY2F0aW9uKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAvL2NvbnN0IGZhY3RvcnkgPSBUQXBwbGljYXRpb24uVGhlQXBwbGljYXRpb24udHlwZXMuZ2V0KHR5cGUhKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8qXG4gICAgICAgICAgICAgICAgICAgICAgICBsZXQgY29tcDogVENvbXBvbmVudCB8IG51bGwgPSBudWxsO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGZhY3RvcnkpIGNvbXAgPSBmYWN0b3J5KG5hbWUhLCBmb3JtLCBmb3JtKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGNvbXApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29tcC5lbGVtID0gZWw7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucmVnaXN0ZXIobmFtZSEsIGNvbXApO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAqL1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBjbHMgPSBUQXBwbGljYXRpb24uVGhlQXBwbGljYXRpb24udHlwZXMuZ2V0KHR5cGUhKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghY2xzKSByZXR1cm47XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGNoaWxkID0gY2xzLmNyZWF0ZShuYW1lISwgZm9ybSwgY29tcG9uZW50KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIG5hbWU6IHN0cmluZywgZm9ybTogVEZvcm0sIHBhcmVudDogVENvbXBvbmVudCwgZWxlbTogSFRNTEVsZW1lbnRcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghY2hpbGQpIHJldHVybjtcblxuICAgICAgICAgICAgICAgICAgICAgICAgLy9jaGlsZC5wYXJlbnQgPSBjb21wb25lbnQ7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGNoaWxkLmVsZW0gPSBlbDtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vY2hpbGQuZm9ybSA9IGZvcm07XG4gICAgICAgICAgICAgICAgICAgICAgICAvL2NoaWxkLm5hbWUgPSBuYW1lITtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIE9wdGlvbmFsIHByb3BzXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmFwcGx5UHJvcHMoY2hpbGQsIGNscyk7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnJlZ2lzdGVySW5zdGFuY2UobmFtZSEsIGNoaWxkKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbXBvbmVudC5jaGlsZHJlbi5wdXNoKGNoaWxkKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IG1heWJlSG9zdCA9IGNoaWxkIGFzIHVua25vd24gYXMgUGFydGlhbDxJUGx1Z2luSG9zdD47XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAobWF5YmVIb3N0ICYmIHR5cGVvZiBtYXliZUhvc3Quc2V0UGx1Z2luU3BlYyA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBwbHVnaW4gPSBlbC5nZXRBdHRyaWJ1dGUoJ2RhdGEtcGx1Z2luJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHJhdyA9IGVsLmdldEF0dHJpYnV0ZSgnZGF0YS1wcm9wcycpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBwcm9wcyA9IHJhdyA/IEpTT04ucGFyc2UocmF3KSA6IHt9O1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1heWJlSG9zdC5zZXRQbHVnaW5TcGVjKHsgcGx1Z2luLCBwcm9wcyB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbWF5YmVIb3N0Lm1vdW50UGx1Z2luSWZSZWFkeSEodGhpcy5zZXJ2aWNlcyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vbWF5YmVIb3N0Lm1vdW50RnJvbVJlZ2lzdHJ5KHNlcnZpY2VzKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGNoaWxkLmFsbG93c0NoaWxkcmVuKCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5idWlsZENvbXBvbmVudFRyZWUoZm9ybSwgY2hpbGQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG59XG5cbmV4cG9ydCBjbGFzcyBUQ29tcG9uZW50IHtcbiAgICAgICAgcmVhZG9ubHkgbWV0YUNsYXNzOiBUTWV0YUNvbXBvbmVudDxhbnk+O1xuICAgICAgICByZWFkb25seSBuYW1lOiBzdHJpbmc7XG4gICAgICAgIHJlYWRvbmx5IHBhcmVudDogVENvbXBvbmVudCB8IG51bGwgPSBudWxsO1xuICAgICAgICBmb3JtOiBURm9ybSB8IG51bGwgPSBudWxsO1xuICAgICAgICBjaGlsZHJlbjogVENvbXBvbmVudFtdID0gW107XG5cbiAgICAgICAgZWxlbTogRWxlbWVudCB8IG51bGwgPSBudWxsO1xuICAgICAgICBnZXQgaHRtbEVsZW1lbnQoKTogSFRNTEVsZW1lbnQgfCBudWxsIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5lbGVtIGFzIEhUTUxFbGVtZW50IHwgbnVsbDtcbiAgICAgICAgfVxuICAgICAgICBjb25zdHJ1Y3RvcihtZXRhQ2xhc3M6IFRNZXRhQ29tcG9uZW50PGFueT4sIG5hbWU6IHN0cmluZywgZm9ybTogVEZvcm0gfCBudWxsLCBwYXJlbnQ6IFRDb21wb25lbnQgfCBudWxsKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5tZXRhQ2xhc3MgPSBtZXRhQ2xhc3M7XG4gICAgICAgICAgICAgICAgdGhpcy5uYW1lID0gbmFtZTtcbiAgICAgICAgICAgICAgICB0aGlzLnBhcmVudCA9IHBhcmVudDtcbiAgICAgICAgICAgICAgICBwYXJlbnQ/LmNoaWxkcmVuLnB1c2godGhpcyk7XG4gICAgICAgICAgICAgICAgdGhpcy5mb3JtID0gZm9ybTtcbiAgICAgICAgICAgICAgICB0aGlzLm5hbWUgPSBuYW1lO1xuICAgICAgICAgICAgICAgIC8vdGhpcy5tZXRhQ2xhc3MgPSBtZXRhQ2xhc3M7XG4gICAgICAgIH1cblxuICAgICAgICAvKiogTWF5IGNvbnRhaW4gY2hpbGQgY29tcG9uZW50cyAqL1xuICAgICAgICBhbGxvd3NDaGlsZHJlbigpOiBib29sZWFuIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGdldCBjb2xvcigpOiBUQ29sb3Ige1xuICAgICAgICAgICAgICAgIHJldHVybiBuZXcgVENvbG9yKHRoaXMuZ2V0U3R5bGVQcm9wKCdjb2xvcicpKTtcbiAgICAgICAgfVxuICAgICAgICBzZXQgY29sb3IodjogVENvbG9yKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5zZXRTdHlsZVByb3AoJ2NvbG9yJywgdi5zKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGdldCBiYWNrZ3JvdW5kQ29sb3IoKTogVENvbG9yIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gbmV3IFRDb2xvcih0aGlzLmdldFN0eWxlUHJvcCgnYmFja2dyb3VuZC1jb2xvcicpKTtcbiAgICAgICAgfVxuICAgICAgICBzZXQgYmFja2dyb3VuZENvbG9yKHY6IFRDb2xvcikge1xuICAgICAgICAgICAgICAgIHRoaXMuc2V0U3R5bGVQcm9wKCdiYWNrZ3JvdW5kLWNvbG9yJywgdi5zKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGdldCB3aWR0aCgpOiBudW1iZXIge1xuICAgICAgICAgICAgICAgIHJldHVybiBwYXJzZUludCh0aGlzLmdldFN0eWxlUHJvcCgnd2lkdGgnKSk7XG4gICAgICAgIH1cbiAgICAgICAgc2V0IHdpZHRoKHY6IG51bWJlcikge1xuICAgICAgICAgICAgICAgIHRoaXMuc2V0U3R5bGVQcm9wKCd3aWR0aCcsIHYudG9TdHJpbmcoKSk7XG4gICAgICAgIH1cblxuICAgICAgICBnZXQgaGVpZ2h0KCk6IG51bWJlciB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHBhcnNlSW50KHRoaXMuZ2V0U3R5bGVQcm9wKCdoZWlnaHQnKSk7XG4gICAgICAgIH1cbiAgICAgICAgc2V0IGhlaWdodCh2OiBudW1iZXIpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnNldFN0eWxlUHJvcCgnaGVpZ2h0Jywgdi50b1N0cmluZygpKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGdldCBvZmZzZXRXaWR0aCgpOiBudW1iZXIge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmh0bWxFbGVtZW50IS5vZmZzZXRXaWR0aDtcbiAgICAgICAgfVxuICAgICAgICBnZXQgb2Zmc2V0SGVpZ2h0KCk6IG51bWJlciB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuaHRtbEVsZW1lbnQhLm9mZnNldEhlaWdodDtcbiAgICAgICAgfVxuXG4gICAgICAgIHNldFN0eWxlUHJvcChuYW1lOiBzdHJpbmcsIHZhbHVlOiBzdHJpbmcpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmh0bWxFbGVtZW50IS5zdHlsZS5zZXRQcm9wZXJ0eShuYW1lLCB2YWx1ZSk7XG4gICAgICAgIH1cblxuICAgICAgICBnZXRTdHlsZVByb3AobmFtZTogc3RyaW5nKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuaHRtbEVsZW1lbnQhLnN0eWxlLmdldFByb3BlcnR5VmFsdWUobmFtZSk7XG4gICAgICAgIH1cblxuICAgICAgICBzZXRQcm9wKG5hbWU6IHN0cmluZywgdmFsdWU6IHN0cmluZykge1xuICAgICAgICAgICAgICAgIHRoaXMuaHRtbEVsZW1lbnQhLnNldEF0dHJpYnV0ZShuYW1lLCB2YWx1ZSk7XG4gICAgICAgIH1cblxuICAgICAgICBnZXRQcm9wKG5hbWU6IHN0cmluZykge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzIS5odG1sRWxlbWVudCEuZ2V0QXR0cmlidXRlKG5hbWUpO1xuICAgICAgICB9XG59XG5cbmV4cG9ydCBjbGFzcyBURG9jdW1lbnQge1xuICAgICAgICBzdGF0aWMgZG9jdW1lbnQ6IFREb2N1bWVudCA9IG5ldyBURG9jdW1lbnQoZG9jdW1lbnQpO1xuICAgICAgICBzdGF0aWMgYm9keSA9IGRvY3VtZW50LmJvZHk7XG4gICAgICAgIGh0bWxEb2M6IERvY3VtZW50O1xuICAgICAgICBjb25zdHJ1Y3RvcihodG1sRG9jOiBEb2N1bWVudCkge1xuICAgICAgICAgICAgICAgIHRoaXMuaHRtbERvYyA9IGh0bWxEb2M7XG4gICAgICAgIH1cbn1cblxuZXhwb3J0IGNsYXNzIFRNZXRhRm9ybSBleHRlbmRzIFRNZXRhQ29tcG9uZW50PFRGb3JtPiB7XG4gICAgICAgIC8vbWV0YWNsYXNzOiBUTWV0YUNvbXBvbmVudDxURm9ybT47XG4gICAgICAgIHN0YXRpYyBtZXRhY2xhc3M6IFRNZXRhRm9ybSA9IG5ldyBUTWV0YUZvcm0oKTtcbiAgICAgICAgZ2V0TWV0YUNsYXNzKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBUTWV0YUZvcm0ubWV0YWNsYXNzO1xuICAgICAgICB9XG4gICAgICAgIHJlYWRvbmx5IHR5cGVOYW1lID0gJ1RGb3JtJztcblxuICAgICAgICBjcmVhdGUobmFtZTogc3RyaW5nLCBmb3JtOiBURm9ybSwgcGFyZW50OiBUQ29tcG9uZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBURm9ybShuYW1lKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHByb3BzKCk6IFByb3BTcGVjPFRGb3JtPltdIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gW107XG4gICAgICAgIH1cbn1cblxuZXhwb3J0IGNsYXNzIFRGb3JtIGV4dGVuZHMgVENvbXBvbmVudCB7XG4gICAgICAgIHN0YXRpYyBmb3JtcyA9IG5ldyBNYXA8c3RyaW5nLCBURm9ybT4oKTtcbiAgICAgICAgcHJpdmF0ZSBfbW91bnRlZCA9IGZhbHNlO1xuICAgICAgICAvLyBFYWNoIEZvcm0gaGFzIGl0cyBvd24gY29tcG9uZW50UmVnaXN0cnlcbiAgICAgICAgY29tcG9uZW50UmVnaXN0cnk6IENvbXBvbmVudFJlZ2lzdHJ5ID0gbmV3IENvbXBvbmVudFJlZ2lzdHJ5KCk7XG4gICAgICAgIGNvbnN0cnVjdG9yKG5hbWU6IHN0cmluZykge1xuICAgICAgICAgICAgICAgIHN1cGVyKFRNZXRhRm9ybS5tZXRhY2xhc3MsIG5hbWUsIG51bGwsIG51bGwpO1xuICAgICAgICAgICAgICAgIHRoaXMuZm9ybSA9IHRoaXM7XG4gICAgICAgICAgICAgICAgVEZvcm0uZm9ybXMuc2V0KG5hbWUsIHRoaXMpO1xuICAgICAgICAgICAgICAgIC8vdGhpcy5wYXJlbnQgPSB0aGlzO1xuICAgICAgICB9XG5cbiAgICAgICAgZ2V0IGFwcGxpY2F0aW9uKCk6IFRBcHBsaWNhdGlvbiB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuZm9ybT8uYXBwbGljYXRpb24gPz8gVEFwcGxpY2F0aW9uLlRoZUFwcGxpY2F0aW9uO1xuICAgICAgICB9XG5cbiAgICAgICAgLyogICAgICAgIGZpbmRGb3JtRnJvbUV2ZW50VGFyZ2V0KGN1cnJlbnRUYXJnZXRFbGVtOiBFbGVtZW50KTogVEZvcm0gfCBudWxsIHtcbiAgICAgICAgICAgICAgICBjb25zdCBmb3JtTmFtZSA9IGN1cnJlbnRUYXJnZXRFbGVtLmdldEF0dHJpYnV0ZSgnZGF0YS1uYW1lJyk7XG4gICAgICAgICAgICAgICAgY29uc3QgZm9ybTogVEZvcm0gPSBURm9ybS5mb3Jtcy5nZXQoZm9ybU5hbWUhKSE7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZvcm07XG4gICAgICAgIH1cbiAgICAgICAgICAgICAgICAqL1xuXG4gICAgICAgIC8vIEVuZ2xpc2ggY29tbWVudHMgYXMgcmVxdWVzdGVkLlxuXG4gICAgICAgIGZpbmRGb3JtRnJvbUV2ZW50VGFyZ2V0KHRhcmdldDogRWxlbWVudCk6IFRGb3JtIHwgbnVsbCB7XG4gICAgICAgICAgICAgICAgLy8gMSkgRmluZCB0aGUgbmVhcmVzdCBlbGVtZW50IHRoYXQgbG9va3MgbGlrZSBhIGZvcm0gY29udGFpbmVyXG4gICAgICAgICAgICAgICAgY29uc3QgZm9ybUVsZW0gPSB0YXJnZXQuY2xvc2VzdCgnW2RhdGEtY29tcG9uZW50PVwiVEZvcm1cIl1bZGF0YS1uYW1lXScpIGFzIEVsZW1lbnQgfCBudWxsO1xuICAgICAgICAgICAgICAgIGlmICghZm9ybUVsZW0pIHJldHVybiBudWxsO1xuXG4gICAgICAgICAgICAgICAgLy8gMikgUmVzb2x2ZSB0aGUgVEZvcm0gaW5zdGFuY2VcbiAgICAgICAgICAgICAgICBjb25zdCBmb3JtTmFtZSA9IGZvcm1FbGVtLmdldEF0dHJpYnV0ZSgnZGF0YS1uYW1lJyk7XG4gICAgICAgICAgICAgICAgaWYgKCFmb3JtTmFtZSkgcmV0dXJuIG51bGw7XG5cbiAgICAgICAgICAgICAgICByZXR1cm4gVEZvcm0uZm9ybXMuZ2V0KGZvcm1OYW1lKSA/PyBudWxsO1xuICAgICAgICB9XG5cbiAgICAgICAgcHJpdmF0ZSBfYWM6IEFib3J0Q29udHJvbGxlciB8IG51bGwgPSBudWxsO1xuXG4gICAgICAgIGluc3RhbGxFdmVudFJvdXRlcigpIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9hYz8uYWJvcnQoKTtcbiAgICAgICAgICAgICAgICB0aGlzLl9hYyA9IG5ldyBBYm9ydENvbnRyb2xsZXIoKTtcbiAgICAgICAgICAgICAgICBjb25zdCB7IHNpZ25hbCB9ID0gdGhpcy5fYWM7XG5cbiAgICAgICAgICAgICAgICBjb25zdCByb290ID0gdGhpcy5lbGVtIGFzIEVsZW1lbnQgfCBudWxsO1xuICAgICAgICAgICAgICAgIGlmICghcm9vdCkgcmV0dXJuO1xuXG4gICAgICAgICAgICAgICAgLy8gc2FtZSBoYW5kbGVyIGZvciBldmVyeWJvZHlcbiAgICAgICAgICAgICAgICBjb25zdCBoYW5kbGVyID0gKGV2OiBFdmVudCkgPT4gdGhpcy5kaXNwYXRjaERvbUV2ZW50KGV2KTtcblxuICAgICAgICAgICAgICAgIGZvciAoY29uc3QgdHlwZSBvZiBbJ2NsaWNrJywgJ2lucHV0JywgJ2NoYW5nZScsICdrZXlkb3duJ10pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJvb3QuYWRkRXZlbnRMaXN0ZW5lcih0eXBlLCBoYW5kbGVyLCB7IGNhcHR1cmU6IHRydWUsIHNpZ25hbCB9KTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBmb3IgKGNvbnN0IHR5cGUgaW4gdGhpcy5tZXRhQ2xhc3MuZG9tRXZlbnRzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByb290LmFkZEV2ZW50TGlzdGVuZXIodHlwZSwgaGFuZGxlciwgeyBjYXB0dXJlOiB0cnVlLCBzaWduYWwgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgZGlzcG9zZUV2ZW50Um91dGVyKCkge1xuICAgICAgICAgICAgICAgIHRoaXMuX2FjPy5hYm9ydCgpO1xuICAgICAgICAgICAgICAgIHRoaXMuX2FjID0gbnVsbDtcbiAgICAgICAgfVxuXG4gICAgICAgIHByaXZhdGUgaGFuZGxlRXZlbnQoZXY6IEV2ZW50LCBlbDogRWxlbWVudCwgYXR0cmlidXRlOiBzdHJpbmcpOiBib29sZWFuIHtcbiAgICAgICAgICAgICAgICBjb25zdCBoYW5kbGVyTmFtZSA9IGVsLmdldEF0dHJpYnV0ZShhdHRyaWJ1dGUpO1xuXG4gICAgICAgICAgICAgICAgLy8gSWYgd2UgZm91bmQgYSBoYW5kbGVyIG9uIHRoaXMgZWxlbWVudCwgZGlzcGF0Y2ggaXRcbiAgICAgICAgICAgICAgICBpZiAoaGFuZGxlck5hbWUgJiYgaGFuZGxlck5hbWUgIT09ICcnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBuYW1lID0gZWwuZ2V0QXR0cmlidXRlKCdkYXRhLW5hbWUnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHNlbmRlciA9IG5hbWUgPyAodGhpcy5jb21wb25lbnRSZWdpc3RyeS5nZXQobmFtZSkgPz8gbnVsbCkgOiBudWxsO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBtYXliZU1ldGhvZCA9ICh0aGlzIGFzIGFueSlbaGFuZGxlck5hbWVdO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBtYXliZU1ldGhvZCAhPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnTk9UIEEgTUVUSE9EJywgaGFuZGxlck5hbWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIElmIHNlbmRlciBpcyBtaXNzaW5nLCBmYWxsYmFjayB0byB0aGUgZm9ybSBpdHNlbGYgKHNhZmUpXG4gICAgICAgICAgICAgICAgICAgICAgICAobWF5YmVNZXRob2QgYXMgKGV2ZW50OiBFdmVudCwgc2VuZGVyOiBhbnkpID0+IGFueSkuY2FsbCh0aGlzLCBldiwgc2VuZGVyID8/IHRoaXMpO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFdlIHJlY2VpdmVkIGFuIERPTSBFdmVudC4gRGlzcGF0Y2ggaXRcbiAgICAgICAgcHJpdmF0ZSBkaXNwYXRjaERvbUV2ZW50KGV2OiBFdmVudCkge1xuICAgICAgICAgICAgICAgIGNvbnN0IHRhcmdldEVsZW0gPSBldi50YXJnZXQgYXMgRWxlbWVudCB8IG51bGw7XG4gICAgICAgICAgICAgICAgaWYgKCF0YXJnZXRFbGVtKSByZXR1cm47XG5cbiAgICAgICAgICAgICAgICBjb25zdCBldlR5cGUgPSBldi50eXBlO1xuXG4gICAgICAgICAgICAgICAgbGV0IGVsOiBFbGVtZW50IHwgbnVsbCA9IHRhcmdldEVsZW0uY2xvc2VzdCgnW2RhdGEtY29tcG9uZW50XScpO1xuICAgICAgICAgICAgICAgIHdoaWxlIChlbCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMuaGFuZGxlRXZlbnQoZXYsIGVsLCBgZGF0YS1vbiR7ZXZUeXBlfWApKSByZXR1cm47XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIC8vZWwgPSB0aGlzLm5leHRDb21wb25lbnRFbGVtZW50VXAoZWwpO1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgbmFtZSA9IGVsLmdldEF0dHJpYnV0ZSgnZGF0YS1uYW1lJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBjb21wID0gbmFtZSA/IHRoaXMuY29tcG9uZW50UmVnaXN0cnkuZ2V0KG5hbWUpIDogbnVsbDtcblxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gUHJlZmVyIHlvdXIgVkNMLWxpa2UgcGFyZW50IGNoYWluIHdoZW4gYXZhaWxhYmxlXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBuZXh0ID0gY29tcD8ucGFyZW50Py5lbGVtID8/IG51bGw7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIEZhbGxiYWNrOiBzdGFuZGFyZCBET00gcGFyZW50XG4gICAgICAgICAgICAgICAgICAgICAgICBlbCA9IG5leHQgPz8gZWwucGFyZW50RWxlbWVudD8uY2xvc2VzdCgnW2RhdGEtY29tcG9uZW50XScpID8/IG51bGw7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLy8gTm8gaGFuZGxlciBoZXJlOiB0cnkgZ29pbmcgXCJ1cFwiIHVzaW5nIHlvdXIgY29tcG9uZW50IHRyZWUgaWYgcG9zc2libGVcbiAgICAgICAgfVxuXG4gICAgICAgIHNob3coKSB7XG4gICAgICAgICAgICAgICAgLy8gTXVzdCBiZSBkb25lIGJlZm9yZSBidWlsZENvbXBvbmVudFRyZWUoKSBiZWNhdXNlIGBidWlsZENvbXBvbmVudFRyZWUoKWAgZG9lcyBub3QgZG8gYHJlc29sdmVSb290KClgIGl0c2VsZi5cbiAgICAgICAgICAgICAgICBpZiAoIXRoaXMuZWxlbSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5lbGVtID0gdGhpcy5jb21wb25lbnRSZWdpc3RyeS5yZXNvbHZlUm9vdCgpOyAvLyBvdSB0aGlzLnJlc29sdmVSb290KClcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKCF0aGlzLl9tb3VudGVkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmNvbXBvbmVudFJlZ2lzdHJ5LmJ1aWxkQ29tcG9uZW50VHJlZSh0aGlzLCB0aGlzKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMub25DcmVhdGUoKTsgLy8gTWF5YmUgY291bGQgYmUgZG9uZSBhZnRlciBpbnN0YWxsRXZlbnRSb3V0ZXIoKVxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5pbnN0YWxsRXZlbnRSb3V0ZXIoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vbW91bnRQbHVnaW5JZlJlYWR5KCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAvL3RoaXMuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vdGhpcy5hZGRFdmVudExpc3RlbmVyKCdpbnB1dCcpO1xuICAgICAgICAgICAgICAgICAgICAgICAgLy90aGlzLmFkZEV2ZW50TGlzdGVuZXIoJ2NoYW5nZScpO1xuICAgICAgICAgICAgICAgICAgICAgICAgLy90aGlzLmFkZEV2ZW50TGlzdGVuZXIoJ2tleWRvd24nKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX21vdW50ZWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB0aGlzLm9uU2hvd24oKTtcblxuICAgICAgICAgICAgICAgIC8vIFRPRE9cbiAgICAgICAgfVxuXG4gICAgICAgIC8qXG4gICAgICAgIGFkZEV2ZW50TGlzdGVuZXJ4eHgodHlwZTogc3RyaW5nKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ2FkZEV2ZW50TGlzdGVuZXIgRU5URVInLCB7IGhhc0JvZHk6ICEhZG9jdW1lbnQuYm9keSwgaGFzRWxlbTogISF0aGlzLmVsZW0gfSk7XG4gICAgICAgICAgICAgICAgY29uc3QgZyA9IHdpbmRvdyBhcyBhbnk7XG5cbiAgICAgICAgICAgICAgICAvLyBBYm9ydCBvbGQgbGlzdGVuZXJzIChpZiBhbnkpXG4gICAgICAgICAgICAgICAgaWYgKGcuX19kZWxwaGluZV9hYm9ydF9jb250cm9sbGVyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBnLl9fZGVscGhpbmVfYWJvcnRfY29udHJvbGxlci5hYm9ydCgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBjb25zdCBhYyA9IG5ldyBBYm9ydENvbnRyb2xsZXIoKTtcbiAgICAgICAgICAgICAgICBnLl9fZGVscGhpbmVfYWJvcnRfY29udHJvbGxlciA9IGFjO1xuICAgICAgICAgICAgICAgIGNvbnN0IHsgc2lnbmFsIH0gPSBhYztcblxuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdJbnN0YWxsaW5nIGdsb2JhbCBkZWJ1ZyBsaXN0ZW5lcnMgKHJlc2V0K3JlaW5zdGFsbCknKTtcblxuICAgICAgICAgICAgICAgIGNvbnN0IHJvb3QgPSB0aGlzLmVsZW07XG4gICAgICAgICAgICAgICAgaWYgKCFyb290KSByZXR1cm47XG5cbiAgICAgICAgICAgICAgICAvLyBWb3RyZSBoYW5kbGVyIHN1ciBsZSByb290XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuZWxlbSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gRW5nbGlzaCBjb21tZW50cyBhcyByZXF1ZXN0ZWQuXG5cbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIEVuZ2xpc2ggY29tbWVudHMgYXMgcmVxdWVzdGVkLlxuXG4gICAgICAgICAgICAgICAgICAgICAgICByb290LmFkZEV2ZW50TGlzdGVuZXIoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIChldjogRXZlbnQpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCB0YXJnZXRFbGVtID0gZXYudGFyZ2V0IGFzIEVsZW1lbnQgfCBudWxsO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICghdGFyZ2V0RWxlbSkgcmV0dXJuO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgZm9ybSA9IHRoaXMuZmluZEZvcm1Gcm9tRXZlbnRUYXJnZXQodGFyZ2V0RWxlbSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFmb3JtKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnTm8gZm9ybSByZXNvbHZlZDsgZXZlbnQgaWdub3JlZCcpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGV2VHlwZSA9IGV2LnR5cGU7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBTdGFydCBmcm9tIHRoZSBjbGlja2VkIGNvbXBvbmVudCAob3IgYW55IGNvbXBvbmVudCB3cmFwcGVyKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxldCB0MTogRWxlbWVudCB8IG51bGwgPSB0YXJnZXRFbGVtLmNsb3Nlc3QoJ1tkYXRhLWNvbXBvbmVudF0nKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB3aGlsZSAodDEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGhhbmRsZXJOYW1lID0gdDEuZ2V0QXR0cmlidXRlKGBkYXRhLW9uJHtldlR5cGV9YCk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIElmIHdlIGZvdW5kIGEgaGFuZGxlciBvbiB0aGlzIGVsZW1lbnQsIGRpc3BhdGNoIGl0XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoaGFuZGxlck5hbWUgJiYgaGFuZGxlck5hbWUgIT09ICcnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IG5hbWUgPSB0MS5nZXRBdHRyaWJ1dGUoJ2RhdGEtbmFtZScpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBzZW5kZXIgPSBuYW1lID8gKGZvcm0uY29tcG9uZW50UmVnaXN0cnkuZ2V0KG5hbWUpID8/IG51bGwpIDogbnVsbDtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBtYXliZU1ldGhvZCA9IChmb3JtIGFzIGFueSlbaGFuZGxlck5hbWVdO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAodHlwZW9mIG1heWJlTWV0aG9kICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ05PVCBBIE1FVEhPRCcsIGhhbmRsZXJOYW1lKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBJZiBzZW5kZXIgaXMgbWlzc2luZywgZmFsbGJhY2sgdG8gdGhlIGZvcm0gaXRzZWxmIChzYWZlKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAobWF5YmVNZXRob2QgYXMgKHRoaXM6IFRGb3JtLCBzZW5kZXI6IGFueSkgPT4gYW55KS5jYWxsKGZvcm0sIHNlbmRlciA/PyBmb3JtKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBObyBoYW5kbGVyIGhlcmU6IHRyeSBnb2luZyBcInVwXCIgdXNpbmcgeW91ciBjb21wb25lbnQgdHJlZSBpZiBwb3NzaWJsZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgbmFtZSA9IHQxLmdldEF0dHJpYnV0ZSgnZGF0YS1uYW1lJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBjb21wID0gbmFtZSA/IGZvcm0uY29tcG9uZW50UmVnaXN0cnkuZ2V0KG5hbWUpIDogbnVsbDtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gUHJlZmVyIHlvdXIgVkNMLWxpa2UgcGFyZW50IGNoYWluIHdoZW4gYXZhaWxhYmxlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBuZXh0ID0gY29tcD8ucGFyZW50Py5lbGVtID8/IG51bGw7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEZhbGxiYWNrOiBzdGFuZGFyZCBET00gcGFyZW50XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0MSA9IG5leHQgPz8gdDEucGFyZW50RWxlbWVudD8uY2xvc2VzdCgnW2RhdGEtY29tcG9uZW50XScpID8/IG51bGw7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ0V2ZW50IG5vdCBoYW5kbGVkJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRydWVcbiAgICAgICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgICAgICAgICAgKi9cblxuICAgICAgICBwcm90ZWN0ZWQgb25DcmVhdGUoKSB7XG4gICAgICAgICAgICAgICAgLy9jb25zdCBidG4gPSB0aGlzLmNvbXBvbmVudFJlZ2lzdHJ5LmdldCgnYnV0dG9uMicpO1xuICAgICAgICAgICAgICAgIGNvbnN0IG9uU2hvd25OYW1lID0gdGhpcy5lbGVtIS5nZXRBdHRyaWJ1dGUoJ2RhdGEtb25jcmVhdGUnKTtcbiAgICAgICAgICAgICAgICBpZiAob25TaG93bk5hbWUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHF1ZXVlTWljcm90YXNrKCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgZm4gPSAodGhpcyBhcyBhbnkpW29uU2hvd25OYW1lXTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBmbiA9PT0gJ2Z1bmN0aW9uJykgZm4uY2FsbCh0aGlzLCBudWxsLCB0aGlzKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAvL2lmIChidG4pIGJ0bi5jb2xvciA9IFRDb2xvci5yZ2IoMCwgMCwgMjU1KTtcbiAgICAgICAgfVxuXG4gICAgICAgIHByb3RlY3RlZCBvblNob3duKCkge1xuICAgICAgICAgICAgICAgIC8vY29uc3QgYnRuID0gdGhpcy5jb21wb25lbnRSZWdpc3RyeS5nZXQoJ2J1dHRvbjMnKTtcbiAgICAgICAgICAgICAgICAvL2lmIChidG4pIGJ0bi5jb2xvciA9IFRDb2xvci5yZ2IoMCwgMjU1LCAyNTUpO1xuICAgICAgICAgICAgICAgIGNvbnN0IG9uU2hvd25OYW1lID0gdGhpcy5lbGVtIS5nZXRBdHRyaWJ1dGUoJ2RhdGEtb25zaG93bicpO1xuICAgICAgICAgICAgICAgIGlmIChvblNob3duTmFtZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcXVldWVNaWNyb3Rhc2soKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBmbiA9ICh0aGlzIGFzIGFueSlbb25TaG93bk5hbWVdO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAodHlwZW9mIGZuID09PSAnZnVuY3Rpb24nKSBmbi5jYWxsKHRoaXMsIG51bGwsIHRoaXMpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICB9XG59XG5cbmV4cG9ydCBjbGFzcyBUQnV0dG9uIGV4dGVuZHMgVENvbXBvbmVudCB7XG4gICAgICAgIHByaXZhdGUgX2NhcHRpb246IHN0cmluZyA9ICcnO1xuXG4gICAgICAgIGh0bWxCdXR0b24oKTogSFRNTEJ1dHRvbkVsZW1lbnQge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmh0bWxFbGVtZW50ISBhcyBIVE1MQnV0dG9uRWxlbWVudDtcbiAgICAgICAgfVxuXG4gICAgICAgIGdldCBjYXB0aW9uKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLl9jYXB0aW9uO1xuICAgICAgICB9XG4gICAgICAgIHNldCBjYXB0aW9uKGNhcHRpb24pIHtcbiAgICAgICAgICAgICAgICB0aGlzLnNldENhcHRpb24oY2FwdGlvbik7XG4gICAgICAgIH1cbiAgICAgICAgc2V0Q2FwdGlvbihzOiBzdHJpbmcpIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9jYXB0aW9uID0gcztcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5odG1sRWxlbWVudCkgdGhpcy5odG1sRWxlbWVudC50ZXh0Q29udGVudCA9IHM7XG4gICAgICAgIH1cblxuICAgICAgICBwcml2YXRlIF9lbmFibGVkOiBib29sZWFuID0gdHJ1ZTtcbiAgICAgICAgZ2V0IGVuYWJsZWQoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2VuYWJsZWQ7XG4gICAgICAgIH1cbiAgICAgICAgc2V0IGVuYWJsZWQoZW5hYmxlZCkge1xuICAgICAgICAgICAgICAgIHRoaXMuc2V0RW5hYmxlZChlbmFibGVkKTtcbiAgICAgICAgfVxuICAgICAgICBzZXRFbmFibGVkKGVuYWJsZWQ6IGJvb2xlYW4pIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9lbmFibGVkID0gZW5hYmxlZDtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5odG1sRWxlbWVudCkgdGhpcy5odG1sQnV0dG9uKCkuZGlzYWJsZWQgPSAhZW5hYmxlZDtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0cnVjdG9yKG5hbWU6IHN0cmluZywgZm9ybTogVEZvcm0sIHBhcmVudDogVENvbXBvbmVudCkge1xuICAgICAgICAgICAgICAgIHN1cGVyKFRNZXRhQnV0dG9uLm1ldGFDbGFzcywgbmFtZSwgZm9ybSwgcGFyZW50KTtcbiAgICAgICAgICAgICAgICAvL3N1cGVyKG5hbWUsIGZvcm0sIHBhcmVudCk7XG4gICAgICAgICAgICAgICAgLy90aGlzLm5hbWUgPSBuYW1lO1xuICAgICAgICAgICAgICAgIC8vdGhpcy5mb3JtID0gZm9ybTtcbiAgICAgICAgICAgICAgICAvL3RoaXMucGFyZW50ID0gcGFyZW50O1xuICAgICAgICB9XG4gICAgICAgIGFsbG93c0NoaWxkcmVuKCk6IGJvb2xlYW4ge1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxufVxuXG5leHBvcnQgY2xhc3MgVE1ldGFCdXR0b24gZXh0ZW5kcyBUTWV0YUNvbXBvbmVudDxUQnV0dG9uPiB7XG4gICAgICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICAgICAgICAgIHN1cGVyKCk7XG4gICAgICAgIH1cbiAgICAgICAgc3RhdGljIG1ldGFDbGFzczogVE1ldGFCdXR0b24gPSBuZXcgVE1ldGFCdXR0b24oKTtcbiAgICAgICAgZ2V0TWV0YUNsYXNzKCk6IFRNZXRhQnV0dG9uIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gVE1ldGFCdXR0b24ubWV0YUNsYXNzO1xuICAgICAgICB9XG4gICAgICAgIHJlYWRvbmx5IHR5cGVOYW1lID0gJ1RCdXR0b24nO1xuXG4gICAgICAgIGNyZWF0ZShuYW1lOiBzdHJpbmcsIGZvcm06IFRGb3JtLCBwYXJlbnQ6IFRDb21wb25lbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gbmV3IFRCdXR0b24obmFtZSwgZm9ybSwgcGFyZW50KTtcbiAgICAgICAgfVxuXG4gICAgICAgIHByb3BzKCk6IFByb3BTcGVjPFRCdXR0b24+W10ge1xuICAgICAgICAgICAgICAgIHJldHVybiBbXG4gICAgICAgICAgICAgICAgICAgICAgICB7IG5hbWU6ICdjYXB0aW9uJywga2luZDogJ3N0cmluZycsIGFwcGx5OiAobywgdikgPT4gKG8uY2FwdGlvbiA9IFN0cmluZyh2KSkgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHsgbmFtZTogJ2VuYWJsZWQnLCBraW5kOiAnYm9vbGVhbicsIGFwcGx5OiAobywgdikgPT4gKG8uZW5hYmxlZCA9IEJvb2xlYW4odikpIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICB7IG5hbWU6ICdjb2xvcicsIGtpbmQ6ICdjb2xvcicsIGFwcGx5OiAobywgdikgPT4gKG8uY29sb3IgPSB2IGFzIGFueSkgfVxuICAgICAgICAgICAgICAgIF07XG4gICAgICAgIH1cbn1cblxuZXhwb3J0IGNsYXNzIFRBcHBsaWNhdGlvbiB7XG4gICAgICAgIHN0YXRpYyBUaGVBcHBsaWNhdGlvbjogVEFwcGxpY2F0aW9uO1xuICAgICAgICAvL3N0YXRpYyBwbHVnaW5SZWdpc3RyeSA9IG5ldyBQbHVnaW5SZWdpc3RyeSgpO1xuICAgICAgICAvL3BsdWdpbnM6IElQbHVnaW5SZWdpc3RyeTtcbiAgICAgICAgcHJpdmF0ZSBmb3JtczogVEZvcm1bXSA9IFtdO1xuICAgICAgICByZWFkb25seSB0eXBlcyA9IG5ldyBDb21wb25lbnRUeXBlUmVnaXN0cnkoKTtcbiAgICAgICAgbWFpbkZvcm06IFRGb3JtIHwgbnVsbCA9IG51bGw7XG5cbiAgICAgICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgICAgICAgICAgVEFwcGxpY2F0aW9uLlRoZUFwcGxpY2F0aW9uID0gdGhpcztcbiAgICAgICAgICAgICAgICByZWdpc3RlckJ1aWx0aW5zKHRoaXMudHlwZXMpO1xuICAgICAgICB9XG5cbiAgICAgICAgY3JlYXRlRm9ybTxUIGV4dGVuZHMgVEZvcm0+KGN0b3I6IG5ldyAoLi4uYXJnczogYW55W10pID0+IFQsIG5hbWU6IHN0cmluZyk6IFQge1xuICAgICAgICAgICAgICAgIGNvbnN0IGYgPSBuZXcgY3RvcihuYW1lKTtcbiAgICAgICAgICAgICAgICB0aGlzLmZvcm1zLnB1c2goZik7XG4gICAgICAgICAgICAgICAgaWYgKCF0aGlzLm1haW5Gb3JtKSB0aGlzLm1haW5Gb3JtID0gZjtcbiAgICAgICAgICAgICAgICByZXR1cm4gZjtcbiAgICAgICAgfVxuXG4gICAgICAgIHJ1bigpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnJ1bldoZW5Eb21SZWFkeSgoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5tYWluRm9ybSkgdGhpcy5tYWluRm9ybS5zaG93KCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlIHRoaXMuYXV0b1N0YXJ0KCk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cblxuICAgICAgICBwcm90ZWN0ZWQgYXV0b1N0YXJ0KCkge1xuICAgICAgICAgICAgICAgIC8vIGZhbGxiYWNrOiBjaG9pc2lyIHVuZSBmb3JtIGVucmVnaXN0clx1MDBFOWUsIG91IGNyXHUwMEU5ZXIgdW5lIGZvcm0gaW1wbGljaXRlXG4gICAgICAgIH1cblxuICAgICAgICBydW5XaGVuRG9tUmVhZHkoZm46ICgpID0+IHZvaWQpIHtcbiAgICAgICAgICAgICAgICBpZiAoZG9jdW1lbnQucmVhZHlTdGF0ZSA9PT0gJ2xvYWRpbmcnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignRE9NQ29udGVudExvYWRlZCcsIGZuLCB7IG9uY2U6IHRydWUgfSk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGZuKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICB9XG59XG5cbi8qXG5cbmV4cG9ydCBjbGFzcyBWdWVDb21wb25lbnQgZXh0ZW5kcyBUQ29tcG9uZW50IHt9XG5cbmV4cG9ydCBjbGFzcyBSZWFjdENvbXBvbmVudCBleHRlbmRzIFRDb21wb25lbnQge31cblxuZXhwb3J0IGNsYXNzIFN2ZWx0ZUNvbXBvbmVudCBleHRlbmRzIFRDb21wb25lbnQge31cblxuZXhwb3J0IGNsYXNzIFBsdWdpbkhvc3Q8UHJvcHMgZXh0ZW5kcyBKc29uID0gSnNvbj4gZXh0ZW5kcyBUQ29tcG9uZW50IHtcbiAgICAgICAgcHJpdmF0ZSBwbHVnaW46IFBsdWdpbjxQcm9wcz47XG4gICAgICAgIHByaXZhdGUgc2VydmljZXM6IERlbHBoaW5lU2VydmljZXM7XG4gICAgICAgIHByaXZhdGUgbW91bnRlZCA9IGZhbHNlO1xuXG4gICAgICAgIGNvbnN0cnVjdG9yKHBsdWdpbjogVUlQbHVnaW48UHJvcHM+LCBzZXJ2aWNlczogRGVscGhpbmVTZXJ2aWNlcykge1xuICAgICAgICAgICAgICAgIHN1cGVyKCd0b3RvJywgbnVsbCwgbnVsbCk7XG4gICAgICAgICAgICAgICAgdGhpcy5wbHVnaW4gPSBwbHVnaW47XG4gICAgICAgICAgICAgICAgdGhpcy5zZXJ2aWNlcyA9IHNlcnZpY2VzO1xuICAgICAgICB9XG5cbiAgICAgICAgbW91bnQocHJvcHM6IFByb3BzKSB7XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMubW91bnRlZCkgdGhyb3cgbmV3IEVycm9yKCdQbHVnaW4gYWxyZWFkeSBtb3VudGVkJyk7XG4gICAgICAgICAgICAgICAgLy90aGlzLnBsdWdpbi5tb3VudCh0aGlzLmh0bWxFbGVtZW50LCBwcm9wcywgdGhpcy5zZXJ2aWNlcyk7XG4gICAgICAgICAgICAgICAgdGhpcy5tb3VudGVkID0gdHJ1ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIHVwZGF0ZShwcm9wczogUHJvcHMpIHtcbiAgICAgICAgICAgICAgICBpZiAoIXRoaXMubW91bnRlZCkgdGhyb3cgbmV3IEVycm9yKCdQbHVnaW4gbm90IG1vdW50ZWQnKTtcbiAgICAgICAgICAgICAgICB0aGlzLnBsdWdpbi51cGRhdGUocHJvcHMpO1xuICAgICAgICB9XG5cbiAgICAgICAgdW5tb3VudCgpIHtcbiAgICAgICAgICAgICAgICBpZiAoIXRoaXMubW91bnRlZCkgcmV0dXJuO1xuICAgICAgICAgICAgICAgIHRoaXMucGx1Z2luLnVubW91bnQoKTtcbiAgICAgICAgICAgICAgICB0aGlzLm1vdW50ZWQgPSBmYWxzZTtcbiAgICAgICAgfVxufVxuICAgICAgICAqL1xuXG5leHBvcnQgY2xhc3MgVE1ldGFQbHVnaW5Ib3N0IGV4dGVuZHMgVE1ldGFDb21wb25lbnQ8VFBsdWdpbkhvc3Q+IHtcbiAgICAgICAgc3RhdGljIG1ldGFDbGFzcyA9IG5ldyBUTWV0YVBsdWdpbkhvc3QoKTtcbiAgICAgICAgZ2V0TWV0YUNsYXNzKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBUTWV0YVBsdWdpbkhvc3QubWV0YUNsYXNzO1xuICAgICAgICB9XG4gICAgICAgIHJlYWRvbmx5IHR5cGVOYW1lID0gJ1RQbHVnaW5Ib3N0JztcblxuICAgICAgICBjcmVhdGUobmFtZTogc3RyaW5nLCBmb3JtOiBURm9ybSwgcGFyZW50OiBUQ29tcG9uZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBUUGx1Z2luSG9zdChuYW1lLCBmb3JtLCBwYXJlbnQpO1xuICAgICAgICB9XG5cbiAgICAgICAgcHJvcHMoKTogUHJvcFNwZWM8VFBsdWdpbkhvc3Q+W10ge1xuICAgICAgICAgICAgICAgIHJldHVybiBbXTtcbiAgICAgICAgfVxufVxuXG5leHBvcnQgY2xhc3MgVFBsdWdpbkhvc3QgZXh0ZW5kcyBUQ29tcG9uZW50IHtcbiAgICAgICAgcHJpdmF0ZSBpbnN0YW5jZTogVUlQbHVnaW5JbnN0YW5jZSB8IG51bGwgPSBudWxsO1xuXG4gICAgICAgIHBsdWdpbk5hbWU6IHN0cmluZyB8IG51bGwgPSBudWxsO1xuICAgICAgICBwbHVnaW5Qcm9wczogSnNvbiA9IHt9O1xuICAgICAgICBwcml2YXRlIGZhY3Rvcnk6IFVJUGx1Z2luRmFjdG9yeSB8IG51bGwgPSBudWxsO1xuXG4gICAgICAgIGNvbnN0cnVjdG9yKG5hbWU6IHN0cmluZywgZm9ybTogVEZvcm0sIHBhcmVudDogVENvbXBvbmVudCkge1xuICAgICAgICAgICAgICAgIHN1cGVyKFRNZXRhUGx1Z2luSG9zdC5tZXRhQ2xhc3MsIG5hbWUsIGZvcm0sIHBhcmVudCk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBDYWxsZWQgYnkgdGhlIG1ldGFjbGFzcyAob3IgYnkgeW91ciByZWdpc3RyeSkgcmlnaHQgYWZ0ZXIgY3JlYXRpb25cbiAgICAgICAgc2V0UGx1Z2luRmFjdG9yeShmYWN0b3J5OiBVSVBsdWdpbkZhY3RvcnkpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmZhY3RvcnkgPSBmYWN0b3J5O1xuICAgICAgICB9XG5cbiAgICAgICAgbW91bnRQbHVnaW4ocHJvcHM6IEpzb24sIHNlcnZpY2VzOiBEZWxwaGluZVNlcnZpY2VzKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgY29udGFpbmVyID0gdGhpcy5odG1sRWxlbWVudDtcbiAgICAgICAgICAgICAgICBpZiAoIWNvbnRhaW5lcikgcmV0dXJuO1xuXG4gICAgICAgICAgICAgICAgaWYgKCF0aGlzLmZhY3RvcnkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlcnZpY2VzLmxvZy53YXJuKCdUUGx1Z2luSG9zdDogbm8gcGx1Z2luIGZhY3Rvcnkgc2V0JywgeyBob3N0OiB0aGlzLm5hbWUgYXMgYW55IH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8vIERpc3Bvc2Ugb2xkIGluc3RhbmNlIGlmIGFueVxuICAgICAgICAgICAgICAgIHRoaXMudW5tb3VudCgpO1xuXG4gICAgICAgICAgICAgICAgLy8gQ3JlYXRlIHBsdWdpbiBpbnN0YW5jZSB0aGVuIG1vdW50XG4gICAgICAgICAgICAgICAgdGhpcy5pbnN0YW5jZSA9IHRoaXMuZmFjdG9yeSh7IGhvc3Q6IHRoaXMsIGZvcm06IHRoaXMuZm9ybSEgfSk7XG4gICAgICAgICAgICAgICAgdGhpcy5pbnN0YW5jZSEubW91bnQoY29udGFpbmVyLCBwcm9wcywgc2VydmljZXMpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gQ2FsbGVkIGJ5IGJ1aWxkQ29tcG9uZW50VHJlZSgpXG4gICAgICAgIHNldFBsdWdpblNwZWMoc3BlYzogeyBwbHVnaW46IHN0cmluZyB8IG51bGw7IHByb3BzOiBhbnkgfSkge1xuICAgICAgICAgICAgICAgIHRoaXMucGx1Z2luTmFtZSA9IHNwZWMucGx1Z2luO1xuICAgICAgICAgICAgICAgIHRoaXMucGx1Z2luUHJvcHMgPSBzcGVjLnByb3BzID8/IHt9O1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gQ2FsbGVkIGJ5IGJ1aWxkQ29tcG9uZW50VHJlZSgpXG4gICAgICAgIG1vdW50UGx1Z2luSWZSZWFkeShzZXJ2aWNlczogRGVscGhpbmVTZXJ2aWNlcykge1xuICAgICAgICAgICAgICAgIGNvbnN0IGNvbnRhaW5lciA9IHRoaXMuaHRtbEVsZW1lbnQ7XG4gICAgICAgICAgICAgICAgaWYgKCFjb250YWluZXIgfHwgIXRoaXMuZm9ybSB8fCAhdGhpcy5wbHVnaW5OYW1lKSByZXR1cm47XG5cbiAgICAgICAgICAgICAgICBjb25zdCBhcHAgPSBUQXBwbGljYXRpb24uVGhlQXBwbGljYXRpb247IC8vIG91IHVuIGFjY1x1MDBFOHMgXHUwMEU5cXVpdmFsZW50XG4gICAgICAgICAgICAgICAgY29uc3QgZGVmID0gUGx1Z2luUmVnaXN0cnkucGx1Z2luUmVnaXN0cnkuZ2V0KHRoaXMucGx1Z2luTmFtZSk7XG5cbiAgICAgICAgICAgICAgICBpZiAoIWRlZikge1xuICAgICAgICAgICAgICAgICAgICAgICAgc2VydmljZXMubG9nLndhcm4oJ1Vua25vd24gcGx1Z2luJywgeyBwbHVnaW46IHRoaXMucGx1Z2luTmFtZSBhcyBhbnkgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgdGhpcy51bm1vdW50KCk7XG4gICAgICAgICAgICAgICAgdGhpcy5pbnN0YW5jZSA9IGRlZi5mYWN0b3J5KHsgaG9zdDogdGhpcywgZm9ybTogdGhpcy5mb3JtIH0pO1xuICAgICAgICAgICAgICAgIHRoaXMuaW5zdGFuY2UhLm1vdW50KGNvbnRhaW5lciwgdGhpcy5wbHVnaW5Qcm9wcywgc2VydmljZXMpO1xuICAgICAgICB9XG5cbiAgICAgICAgdXBkYXRlKHByb3BzOiBhbnkpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnBsdWdpblByb3BzID0gcHJvcHM7XG4gICAgICAgICAgICAgICAgdGhpcy5pbnN0YW5jZT8udXBkYXRlKHByb3BzKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHVubW91bnQoKSB7XG4gICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuaW5zdGFuY2U/LnVubW91bnQoKTtcbiAgICAgICAgICAgICAgICB9IGZpbmFsbHkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5pbnN0YW5jZSA9IG51bGw7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICB9XG59XG5cbmV4cG9ydCB0eXBlIFVJUGx1Z2luRmFjdG9yeTxQcm9wcyBleHRlbmRzIEpzb24gPSBKc29uPiA9IChhcmdzOiB7IGhvc3Q6IFRQbHVnaW5Ib3N0OyBmb3JtOiBURm9ybSB9KSA9PiBVSVBsdWdpbkluc3RhbmNlPFByb3BzPjtcblxuZXhwb3J0IGludGVyZmFjZSBTaXplSGludHMge1xuICAgICAgICBtaW5XaWR0aD86IG51bWJlcjtcbiAgICAgICAgbWluSGVpZ2h0PzogbnVtYmVyO1xuICAgICAgICBwcmVmZXJyZWRXaWR0aD86IG51bWJlcjtcbiAgICAgICAgcHJlZmVycmVkSGVpZ2h0PzogbnVtYmVyO1xufVxuXG5leHBvcnQgdHlwZSBVSVBsdWdpbkRlZiA9IHtcbiAgICAgICAgZmFjdG9yeTogVUlQbHVnaW5GYWN0b3J5O1xuICAgICAgICAvLyBvcHRpb25uZWwgOiB1biBzY2hcdTAwRTltYSBkZSBwcm9wcywgYWlkZSBhdSBkZXNpZ25lclxuICAgICAgICAvLyBwcm9wcz86IFByb3BTY2hlbWE7XG59O1xuXG5leHBvcnQgY2xhc3MgUGx1Z2luUmVnaXN0cnkge1xuICAgICAgICBzdGF0aWMgcGx1Z2luUmVnaXN0cnkgPSBuZXcgUGx1Z2luUmVnaXN0cnkoKTtcbiAgICAgICAgcHJpdmF0ZSByZWFkb25seSBwbHVnaW5zID0gbmV3IE1hcDxzdHJpbmcsIFVJUGx1Z2luRGVmPigpO1xuXG4gICAgICAgIHJlZ2lzdGVyKG5hbWU6IHN0cmluZywgZGVmOiBVSVBsdWdpbkRlZikge1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLnBsdWdpbnMuaGFzKG5hbWUpKSB0aHJvdyBuZXcgRXJyb3IoYFBsdWdpbiBhbHJlYWR5IHJlZ2lzdGVyZWQ6ICR7bmFtZX1gKTtcbiAgICAgICAgICAgICAgICB0aGlzLnBsdWdpbnMuc2V0KG5hbWUsIGRlZik7XG4gICAgICAgIH1cblxuICAgICAgICBnZXQobmFtZTogc3RyaW5nKTogVUlQbHVnaW5EZWYgfCB1bmRlZmluZWQge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLnBsdWdpbnMuZ2V0KG5hbWUpO1xuICAgICAgICB9XG5cbiAgICAgICAgaGFzKG5hbWU6IHN0cmluZyk6IGJvb2xlYW4ge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLnBsdWdpbnMuaGFzKG5hbWUpO1xuICAgICAgICB9XG59XG4iLCAiLy8vIDxyZWZlcmVuY2UgbGliPVwiZG9tXCIgLz5cbmNvbnNvbGUubG9nKCdJIEFNIFpBWkEnKTtcbi8vaW1wb3J0IHsgaW5zdGFsbERlbHBoaW5lUnVudGltZSB9IGZyb20gXCIuL3NyYy9kcnRcIjsgLy8gPC0tIFRTLCBwYXMgLmpzXG5pbXBvcnQgeyBURm9ybSwgVENvbG9yLCBUQXBwbGljYXRpb24sIFRDb21wb25lbnQsIFRCdXR0b24gfSBmcm9tICdAdmNsJztcbi8vaW1wb3J0IHsgQ29tcG9uZW50VHlwZVJlZ2lzdHJ5IH0gZnJvbSAnQHZjbC9TdGRDdHJscyc7XG4vL2ltcG9ydCB7IENvbXBvbmVudFJlZ2lzdHJ5IH0gZnJvbSAnQGRydC9Db21wb25lbnRSZWdpc3RyeSc7XG4vL2ltcG9ydCB7IFRQbHVnaW5Ib3N0IH0gZnJvbSAnQGRydC9VSVBsdWdpbic7XG4vKlxuZXhwb3J0IGZ1bmN0aW9uIHJlZ2lzdGVyUGx1Z2luVHlwZXMocmVnOiBDb21wb25lbnRUeXBlUmVnaXN0cnkpOiB2b2lkIHtcbiAgICAgICAgLyAqXG4gICAgICAgIC8vIEV4YW1wbGU6IGFueSB0eXBlIG5hbWUgY2FuIGJlIHByb3ZpZGVkIGJ5IGEgcGx1Z2luLlxuICAgICAgICByZWcucmVnaXN0ZXIucmVnaXN0ZXJUeXBlKCdjaGFydGpzLXBpZScsIChuYW1lOiBzdHJpbmcsIGZvcm06IFRGb3JtLCBwYXJlbnQ6IFRDb21wb25lbnQpID0+IHtcbiAgICAgICAgICAgICAgICByZXR1cm4gbmV3IFBsdWdpbkhvc3QobmFtZSwgZm9ybSwgcGFyZW50KTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgcmVnLnJlZ2lzdGVyVHlwZSgndnVlLWhlbGxvJywgKG5hbWU6IHN0cmluZywgZm9ybTogVEZvcm0sIHBhcmVudDogVENvbXBvbmVudCkgPT4ge1xuICAgICAgICAgICAgICAgIHJldHVybiBuZXcgUGx1Z2luSG9zdChuYW1lLCBmb3JtLCBwYXJlbnQpO1xuICAgICAgICB9KTtcbiAgICAgICAgKiAvXG59XG4qL1xuY29uc29sZS5sb2coJ0kgQU0gWkFaQScpO1xuXG5jbGFzcyBaYXphIGV4dGVuZHMgVEZvcm0ge1xuICAgICAgICAvLyBGb3JtIGNvbXBvbmVudHMgLSBUaGlzIGxpc3QgaXMgYXV0byBnZW5lcmF0ZWQgYnkgRGVscGhpbmVcbiAgICAgICAgLy8gLS0tLS0tLS0tLS0tLS0tXG4gICAgICAgIC8vYnV0dG9uMSA6IFRCdXR0b24gPSBuZXcgVEJ1dHRvbihcImJ1dHRvbjFcIiwgdGhpcywgdGhpcyk7XG4gICAgICAgIC8vYnV0dG9uMiA6IFRCdXR0b24gPSBuZXcgVEJ1dHRvbihcImJ1dHRvbjJcIiwgdGhpcywgdGhpcyk7XG4gICAgICAgIC8vYnV0dG9uMyA6IFRCdXR0b24gPSBuZXcgVEJ1dHRvbihcImJ1dHRvbjNcIiwgdGhpcywgdGhpcyk7XG4gICAgICAgIC8vIC0tLS0tLS0tLS0tLS0tLVxuXG4gICAgICAgIGNvbnN0cnVjdG9yKG5hbWU6IHN0cmluZykge1xuICAgICAgICAgICAgICAgIHN1cGVyKG5hbWUpO1xuICAgICAgICB9XG4gICAgICAgIC8vaW1wb3J0IHsgaW5zdGFsbERlbHBoaW5lUnVudGltZSB9IGZyb20gXCIuL2RydFwiO1xuXG4gICAgICAgIC8qXG5jb25zdCBydW50aW1lID0geyAgIFxuICBoYW5kbGVDbGljayh7IGVsZW1lbnQgfTogeyBlbGVtZW50OiBFbGVtZW50IH0pIHtcbiAgICBjb25zb2xlLmxvZyhcImNsaWNrZWQhXCIsIGVsZW1lbnQpO1xuICAgIC8vKGVsZW1lbnQgYXMgSFRNTEVsZW1lbnQpLnN0eWxlLmJhY2tncm91bmRDb2xvciA9IFwicmVkXCI7XG4gIH0sXG59OyBcbiovXG5cbiAgICAgICAgcHJvdGVjdGVkIG9uTXlDcmVhdGUoX2V2OiBFdmVudCB8IG51bGwsIF9zZW5kZXI6IFRDb21wb25lbnQpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBidG4gPSB0aGlzLmNvbXBvbmVudFJlZ2lzdHJ5LmdldCgnYnV0dG9uMicpO1xuICAgICAgICAgICAgICAgIGlmIChidG4pIGJ0bi5jb2xvciA9IFRDb2xvci5yZ2IoMCwgMCwgMjU1KTtcbiAgICAgICAgfVxuXG4gICAgICAgIHByb3RlY3RlZCBvbk15U2hvd24oX2V2OiBFdmVudCB8IG51bGwsIF9zZW5kZXI6IFRDb21wb25lbnQpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBidG4gPSB0aGlzLmNvbXBvbmVudFJlZ2lzdHJ5LmdldCgnYnV0dG9uMycpO1xuICAgICAgICAgICAgICAgIGlmIChidG4pIGJ0bi5jb2xvciA9IFRDb2xvci5yZ2IoMCwgMjU1LCAyNTUpO1xuICAgICAgICB9XG5cbiAgICAgICAgYnV0dG9uMV9vbmNsaWNrKF9ldjogRXZlbnQgfCBudWxsLCBfc2VuZGVyOiBUQ29tcG9uZW50KSB7XG4gICAgICAgICAgICAgICAgY29uc3QgYnRuID0gdGhpcy5jb21wb25lbnRSZWdpc3RyeS5nZXQ8VEJ1dHRvbj4oJ2J1dHRvbjEnKTtcbiAgICAgICAgICAgICAgICBpZiAoIWJ0bikge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS53YXJuKCdidXR0b24xIG5vdCBmb3VuZCBpbiByZWdpc3RyeScpO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAvL2J0bi5jb2xvciA9IFRDb2xvci5yZ2IoMCwgMCwgMjU1KTtcbiAgICAgICAgICAgICAgICBidG4hLmNvbG9yID0gVENvbG9yLnJnYigyNTUsIDAsIDApO1xuICAgICAgICAgICAgICAgIGJ0biEuc2V0Q2FwdGlvbignTUlNSScpO1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdCdXR0b24xIGNsaWNrZWQhISEhJyk7XG4gICAgICAgIH1cblxuICAgICAgICB6YXphX29uY2xpY2soX2V2OiBFdmVudCB8IG51bGwsIF9zZW5kZXI6IFRDb21wb25lbnQpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBidG4gPSB0aGlzLmNvbXBvbmVudFJlZ2lzdHJ5LmdldDxUQnV0dG9uPignYnV0dG9ueCcpO1xuICAgICAgICAgICAgICAgIGJ0biEuY29sb3IgPSBUQ29sb3IucmdiKDAsIDI1NSwgMCk7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ3phemEgY2xpY2tlZCEhISEnKTtcbiAgICAgICAgICAgICAgICAvL2J0biEuZW5hYmxlZCA9IGZhbHNlO1xuICAgICAgICB9XG5cbiAgICAgICAgLy9pbnN0YWxsRGVscGhpbmVSdW50aW1lKHJ1bnRpbWUpO1xufSAvLyBjbGFzcyB6YXphXG5cbmNsYXNzIE15QXBwbGljYXRpb24gZXh0ZW5kcyBUQXBwbGljYXRpb24ge1xuICAgICAgICB6YXphOiBaYXphO1xuXG4gICAgICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICAgICAgICAgIHN1cGVyKCk7XG4gICAgICAgICAgICAgICAgdGhpcy56YXphID0gbmV3IFphemEoJ3phemEnKTtcbiAgICAgICAgICAgICAgICB0aGlzLm1haW5Gb3JtID0gdGhpcy56YXphO1xuICAgICAgICB9XG5cbiAgICAgICAgcnVuKCkge1xuICAgICAgICAgICAgICAgIC8vdGhpcy56YXphLmNvbXBvbmVudFJlZ2lzdHJ5LmJ1aWxkQ29tcG9uZW50VHJlZSh0aGlzLnphemEpO1xuICAgICAgICAgICAgICAgIC8vdGhpcy56YXphLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJyk7XG5cbiAgICAgICAgICAgICAgICAvLyBhdSBsYW5jZW1lbnRcbiAgICAgICAgICAgICAgICB0aGlzLnJ1bldoZW5Eb21SZWFkeSgoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnphemEuc2hvdygpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG59IC8vIGNsYXNzIE15QXBwbGljYXRpb25cblxuY29uc3QgbXlBcHBsaWNhdGlvbjogTXlBcHBsaWNhdGlvbiA9IG5ldyBNeUFwcGxpY2F0aW9uKCk7XG5teUFwcGxpY2F0aW9u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Q1I7QUFmUSxjQURLLGlCQUNFLGtCQUFpQixJQUFJLGdCQUFlO0FBRDVDLElBQU0saUJBQU47OztBQ3Q5QlAsUUFBUSxJQUFJLFdBQVc7QUFvQnZCLFFBQVEsSUFBSSxXQUFXO0FBRXZCLElBQU0sT0FBTixjQUFtQkksT0FBTTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBUWpCLFlBQVksTUFBYztBQUNsQixVQUFNLElBQUk7QUFBQSxFQUNsQjtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBWVUsV0FBVyxLQUFtQixTQUFxQjtBQUNyRCxVQUFNLE1BQU0sS0FBSyxrQkFBa0IsSUFBSSxTQUFTO0FBQ2hELFFBQUksSUFBSyxLQUFJLFFBQVEsT0FBTyxJQUFJLEdBQUcsR0FBRyxHQUFHO0FBQUEsRUFDakQ7QUFBQSxFQUVVLFVBQVUsS0FBbUIsU0FBcUI7QUFDcEQsVUFBTSxNQUFNLEtBQUssa0JBQWtCLElBQUksU0FBUztBQUNoRCxRQUFJLElBQUssS0FBSSxRQUFRLE9BQU8sSUFBSSxHQUFHLEtBQUssR0FBRztBQUFBLEVBQ25EO0FBQUEsRUFFQSxnQkFBZ0IsS0FBbUIsU0FBcUI7QUFDaEQsVUFBTSxNQUFNLEtBQUssa0JBQWtCLElBQWEsU0FBUztBQUN6RCxRQUFJLENBQUMsS0FBSztBQUNGLGNBQVEsS0FBSywrQkFBK0I7QUFDNUM7QUFBQSxJQUNSO0FBRUEsUUFBSyxRQUFRLE9BQU8sSUFBSSxLQUFLLEdBQUcsQ0FBQztBQUNqQyxRQUFLLFdBQVcsTUFBTTtBQUN0QixZQUFRLElBQUkscUJBQXFCO0FBQUEsRUFDekM7QUFBQSxFQUVBLGFBQWEsS0FBbUIsU0FBcUI7QUFDN0MsVUFBTSxNQUFNLEtBQUssa0JBQWtCLElBQWEsU0FBUztBQUN6RCxRQUFLLFFBQVEsT0FBTyxJQUFJLEdBQUcsS0FBSyxDQUFDO0FBQ2pDLFlBQVEsSUFBSSxrQkFBa0I7QUFBQSxFQUV0QztBQUFBO0FBR1I7QUFFQSxJQUFNLGdCQUFOLGNBQTRCLGFBQWE7QUFBQSxFQUdqQyxjQUFjO0FBQ04sVUFBTTtBQUhkO0FBSVEsU0FBSyxPQUFPLElBQUksS0FBSyxNQUFNO0FBQzNCLFNBQUssV0FBVyxLQUFLO0FBQUEsRUFDN0I7QUFBQSxFQUVBLE1BQU07QUFLRSxTQUFLLGdCQUFnQixNQUFNO0FBQ25CLFdBQUssS0FBSyxLQUFLO0FBQUEsSUFDdkIsQ0FBQztBQUFBLEVBQ1Q7QUFDUjtBQUVBLElBQU0sZ0JBQStCLElBQUksY0FBYztBQUN2RCxjQUFjLElBQUk7IiwKICAibmFtZXMiOiBbIlRNZXRhQ29tcG9uZW50IiwgIlRDb21wb25lbnQiLCAiQ29tcG9uZW50VHlwZVJlZ2lzdHJ5IiwgIlRGb3JtIiwgIlRCdXR0b24iLCAiVEZvcm0iXQp9Cg==
