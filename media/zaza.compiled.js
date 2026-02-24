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
    return false;
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
  allowsChildren() {
    return true;
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

// examples/zaza/test.ts
var _MetaRoot = class _MetaRoot {
  constructor(superClass, typeName = "TMetaRoot") {
    __publicField(this, "superClass");
    __publicField(this, "typeName");
    this.superClass = superClass;
    this.typeName = typeName;
  }
  getMetaclass() {
    return _MetaRoot.metaclass;
  }
};
__publicField(_MetaRoot, "metaclass", new _MetaRoot(null));
var MetaRoot = _MetaRoot;
var _MetaTestA = class _MetaTestA extends MetaRoot {
  constructor(superClass) {
    super(superClass, "TestA");
  }
  getMetaclass() {
    return _MetaTestA.metaclass;
  }
};
__publicField(_MetaTestA, "metaclass", new _MetaTestA(MetaRoot.metaclass));
var MetaTestA = _MetaTestA;
var _MetaTestB = class _MetaTestB extends MetaTestA {
  constructor(superClass) {
    super(superClass);
    this.typeName = "TestB";
  }
  getMetaclass() {
    return _MetaTestB.metaclass;
  }
};
__publicField(_MetaTestB, "metaclass", new _MetaTestB(MetaTestA.metaclass));
var MetaTestB = _MetaTestB;
var _MetaTestC = class _MetaTestC extends MetaTestB {
  constructor(superClass) {
    super(superClass);
    this.typeName = "TestC";
  }
  getMetaclass() {
    return _MetaTestC.metaclass;
  }
};
__publicField(_MetaTestC, "metaclass", new _MetaTestC(MetaTestB.metaclass));
var MetaTestC = _MetaTestC;
function test() {
  let c = MetaTestC.metaclass;
  while (c) {
    console.log(`${c.getMetaclass().typeName} - ${c.typeName} -> ${c.superClass?.typeName}`);
    c = c.superClass;
  }
}

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
test();
myApplication.run();
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vc3JjL3ZjbC9yZWdpc3RlclZjbC50cyIsICIuLi9zcmMvdmNsL1N0ZEN0cmxzLnRzIiwgIi4uL2V4YW1wbGVzL3phemEvdGVzdC50cyIsICIuLi9leGFtcGxlcy96YXphL3phemEudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbIi8vIEVuZ2xpc2ggY29tbWVudHMgYXMgcmVxdWVzdGVkLlxuXG4vL2ltcG9ydCB7IENvbXBvbmVudFR5cGVSZWdpc3RyeSB9IGZyb20gJ0BkcnQnO1xuaW1wb3J0IHsgVEJ1dHRvbiwgVE1ldGFDb21wb25lbnQsIFRGb3JtLCBUQ29tcG9uZW50LCBDb21wb25lbnRUeXBlUmVnaXN0cnksIFRNZXRhQnV0dG9uLCBUTWV0YVBsdWdpbkhvc3QgfSBmcm9tICdAdmNsJztcbi8vaW1wb3J0IHsgVE1ldGFQbHVnaW5Ib3N0IH0gZnJvbSAnLi4vZHJ0L1VJUGx1Z2luJzsgLy8gTk9UIEdPT0QgISBpbXBvcnQgVkNMIVxuXG4vLyBFbmdsaXNoIGNvbW1lbnRzIGFzIHJlcXVlc3RlZC5cbmV4cG9ydCBmdW5jdGlvbiByZWdpc3RlckJ1aWx0aW5zKHR5cGVzOiBDb21wb25lbnRUeXBlUmVnaXN0cnkpIHtcbiAgICAgICAgdHlwZXMucmVnaXN0ZXIoVE1ldGFCdXR0b24ubWV0YUNsYXNzKTtcbiAgICAgICAgdHlwZXMucmVnaXN0ZXIoVE1ldGFQbHVnaW5Ib3N0Lm1ldGFDbGFzcyk7XG4gICAgICAgIC8vIHR5cGVzLnJlZ2lzdGVyKFRFZGl0Q2xhc3MpO1xuICAgICAgICAvLyB0eXBlcy5yZWdpc3RlcihUTGFiZWxDbGFzcyk7XG59XG4iLCAiLy9pbXBvcnQgeyBDb21wb25lbnRUeXBlUmVnaXN0cnkgfSBmcm9tICcuLi9kcnQvVUlQbHVnaW4nOyAvLyBQQVMgXCJpbXBvcnQgdHlwZVwiXG4vLyAvL2ltcG9ydCB0eXBlIHsgSnNvbiwgRGVscGhpbmVTZXJ2aWNlcywgQ29tcG9uZW50VHlwZVJlZ2lzdHJ5IH0gZnJvbSAnLi4vZHJ0L1VJUGx1Z2luJztcbi8vaW1wb3J0IHsgcmVnaXN0ZXJWY2xUeXBlcyB9IGZyb20gJy4vcmVnaXN0ZXJWY2wnO1xuLy9pbXBvcnQgeyBCdXR0b24gfSBmcm9tICdncmFwZXNqcyc7XG5pbXBvcnQgeyByZWdpc3RlckJ1aWx0aW5zIH0gZnJvbSAnLi9yZWdpc3RlclZjbCc7XG5cbmV4cG9ydCB0eXBlIENvbXBvbmVudEZhY3RvcnkgPSAobmFtZTogc3RyaW5nLCBmb3JtOiBURm9ybSwgb3duZXI6IFRDb21wb25lbnQpID0+IFRDb21wb25lbnQ7XG5cbi8vaW1wb3J0IHR5cGUgeyBKc29uIH0gZnJvbSAnLi9Kc29uJztcbmV4cG9ydCB0eXBlIEpzb24gPSBudWxsIHwgYm9vbGVhbiB8IG51bWJlciB8IHN0cmluZyB8IEpzb25bXSB8IHsgW2tleTogc3RyaW5nXTogSnNvbiB9O1xuXG50eXBlIFByb3BLaW5kID0gJ3N0cmluZycgfCAnbnVtYmVyJyB8ICdib29sZWFuJyB8ICdjb2xvcic7XG5leHBvcnQgdHlwZSBQcm9wU3BlYzxULCBWID0gdW5rbm93bj4gPSB7XG4gICAgICAgIG5hbWU6IHN0cmluZztcbiAgICAgICAga2luZDogUHJvcEtpbmQ7XG4gICAgICAgIGFwcGx5OiAob2JqOiBULCB2YWx1ZTogVikgPT4gdm9pZDtcbn07XG5cbmV4cG9ydCBpbnRlcmZhY2UgSVBsdWdpbkhvc3Qge1xuICAgICAgICBzZXRQbHVnaW5TcGVjKHNwZWM6IHsgcGx1Z2luOiBzdHJpbmcgfCBudWxsOyBwcm9wczogYW55IH0pOiB2b2lkO1xuICAgICAgICBtb3VudFBsdWdpbklmUmVhZHkoc2VydmljZXM6IERlbHBoaW5lU2VydmljZXMpOiB2b2lkO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIERlbHBoaW5lTG9nZ2VyIHtcbiAgICAgICAgZGVidWcobXNnOiBzdHJpbmcsIGRhdGE/OiBKc29uKTogdm9pZDtcbiAgICAgICAgaW5mbyhtc2c6IHN0cmluZywgZGF0YT86IEpzb24pOiB2b2lkO1xuICAgICAgICB3YXJuKG1zZzogc3RyaW5nLCBkYXRhPzogSnNvbik6IHZvaWQ7XG4gICAgICAgIGVycm9yKG1zZzogc3RyaW5nLCBkYXRhPzogSnNvbik6IHZvaWQ7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgRGVscGhpbmVFdmVudEJ1cyB7XG4gICAgICAgIC8vIFN1YnNjcmliZSB0byBhbiBhcHAgZXZlbnQuXG4gICAgICAgIG9uKGV2ZW50TmFtZTogc3RyaW5nLCBoYW5kbGVyOiAocGF5bG9hZDogSnNvbikgPT4gdm9pZCk6ICgpID0+IHZvaWQ7XG5cbiAgICAgICAgLy8gUHVibGlzaCBhbiBhcHAgZXZlbnQuXG4gICAgICAgIGVtaXQoZXZlbnROYW1lOiBzdHJpbmcsIHBheWxvYWQ6IEpzb24pOiB2b2lkO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIERlbHBoaW5lU3RvcmFnZSB7XG4gICAgICAgIGdldChrZXk6IHN0cmluZyk6IFByb21pc2U8SnNvbiB8IHVuZGVmaW5lZD47XG4gICAgICAgIHNldChrZXk6IHN0cmluZywgdmFsdWU6IEpzb24pOiBQcm9taXNlPHZvaWQ+O1xuICAgICAgICByZW1vdmUoa2V5OiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+O1xufVxuZXhwb3J0IGludGVyZmFjZSBEZWxwaGluZVNlcnZpY2VzIHtcbiAgICAgICAgbG9nOiB7XG4gICAgICAgICAgICAgICAgZGVidWcobXNnOiBzdHJpbmcsIGRhdGE/OiBhbnkpOiB2b2lkO1xuICAgICAgICAgICAgICAgIGluZm8obXNnOiBzdHJpbmcsIGRhdGE/OiBhbnkpOiB2b2lkO1xuICAgICAgICAgICAgICAgIHdhcm4obXNnOiBzdHJpbmcsIGRhdGE/OiBhbnkpOiB2b2lkO1xuICAgICAgICAgICAgICAgIGVycm9yKG1zZzogc3RyaW5nLCBkYXRhPzogYW55KTogdm9pZDtcbiAgICAgICAgfTtcblxuICAgICAgICBidXM6IHtcbiAgICAgICAgICAgICAgICBvbihldmVudDogc3RyaW5nLCBoYW5kbGVyOiAocGF5bG9hZDogYW55KSA9PiB2b2lkKTogKCkgPT4gdm9pZDtcbiAgICAgICAgICAgICAgICBlbWl0KGV2ZW50OiBzdHJpbmcsIHBheWxvYWQ6IGFueSk6IHZvaWQ7XG4gICAgICAgIH07XG5cbiAgICAgICAgc3RvcmFnZToge1xuICAgICAgICAgICAgICAgIGdldChrZXk6IHN0cmluZyk6IFByb21pc2U8YW55PiB8IG51bGw7XG4gICAgICAgICAgICAgICAgc2V0KGtleTogc3RyaW5nLCB2YWx1ZTogYW55KTogUHJvbWlzZTx2b2lkPiB8IG51bGw7XG4gICAgICAgICAgICAgICAgcmVtb3ZlKGtleTogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB8IG51bGw7XG4gICAgICAgIH07XG5cbiAgICAgICAgLy8gZnV0dXJcbiAgICAgICAgLy8gaTE4bj86IC4uLlxuICAgICAgICAvLyBuYXY/OiAuLi5cbn1cblxuZXhwb3J0IGludGVyZmFjZSBVSVBsdWdpbkluc3RhbmNlPFByb3BzIGV4dGVuZHMgSnNvbiA9IEpzb24+IHtcbiAgICAgICAgcmVhZG9ubHkgaWQ6IHN0cmluZztcblxuICAgICAgICAvLyBDYWxsZWQgZXhhY3RseSBvbmNlIGFmdGVyIGNyZWF0aW9uIChmb3IgYSBnaXZlbiBpbnN0YW5jZSkuXG4gICAgICAgIG1vdW50KGNvbnRhaW5lcjogSFRNTEVsZW1lbnQsIHByb3BzOiBQcm9wcywgc2VydmljZXM6IERlbHBoaW5lU2VydmljZXMpOiB2b2lkO1xuXG4gICAgICAgIC8vIENhbGxlZCBhbnkgdGltZSBwcm9wcyBjaGFuZ2UgKG1heSBiZSBmcmVxdWVudCkuXG4gICAgICAgIHVwZGF0ZShwcm9wczogUHJvcHMpOiB2b2lkO1xuXG4gICAgICAgIC8vIENhbGxlZCBleGFjdGx5IG9uY2UgYmVmb3JlIGRpc3Bvc2FsLlxuICAgICAgICB1bm1vdW50KCk6IHZvaWQ7XG5cbiAgICAgICAgLy8gT3B0aW9uYWwgZXJnb25vbWljcy5cbiAgICAgICAgZ2V0U2l6ZUhpbnRzPygpOiBudW1iZXI7XG4gICAgICAgIGZvY3VzPygpOiB2b2lkO1xuXG4gICAgICAgIC8vIE9wdGlvbmFsIHBlcnNpc3RlbmNlIGhvb2sgKERlbHBoaW5lIG1heSBzdG9yZSAmIHJlc3RvcmUgdGhpcykuXG4gICAgICAgIHNlcmlhbGl6ZVN0YXRlPygpOiBKc29uO1xufVxuZXhwb3J0IGFic3RyYWN0IGNsYXNzIFRNZXRhY2xhc3M8VCBleHRlbmRzIFRNZXRhY2xhc3M8YW55PiA9IGFueT4ge1xuICAgICAgICByZWFkb25seSB0eXBlTmFtZTogc3RyaW5nID0gJ01ldGFjbGFzcyc7XG4gICAgICAgIHN0YXRpYyBtZXRhY2xhc3M6IFRNZXRhY2xhc3M7XG5cbiAgICAgICAgYWJzdHJhY3QgZ2V0TWV0YUNsYXNzKCk6IFRNZXRhY2xhc3M7XG4gICAgICAgIGNvbnN0cnVjdG9yKCkge31cbiAgICAgICAgYWJzdHJhY3QgY3JlYXRlKG5hbWU6IHN0cmluZywgZm9ybTogVEZvcm0sIHBhcmVudDogVE9iamVjdDxhbnk+KTogVDtcbn1cblxuZXhwb3J0IGNsYXNzIFRPYmplY3Q8VFNlbGYgZXh0ZW5kcyBUT2JqZWN0PGFueT4gPSBhbnk+IHt9XG5cbmV4cG9ydCBhYnN0cmFjdCBjbGFzcyBUTWV0YU9iamVjdCBleHRlbmRzIFRNZXRhY2xhc3Mge1xuICAgICAgICAvL3N0YXRpYyBtZXRhQ2xhc3M6IFRNZXRhT2JqZWN0ID0gbmV3IFRNZXRhT2JqZWN0KCk7XG4gICAgICAgIHJlYWRvbmx5IHR5cGVOYW1lOiBzdHJpbmcgPSAnT2JqZWN0JztcblxuICAgICAgICBhYnN0cmFjdCBnZXRNZXRhQ2xhc3MoKTogVE1ldGFPYmplY3Q7XG4gICAgICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICAgICAgICAgIHN1cGVyKCk7XG4gICAgICAgIH1cbiAgICAgICAgYWJzdHJhY3QgY3JlYXRlKCk6IFRPYmplY3Q7XG5cbiAgICAgICAgLy9hYnN0cmFjdCBnZXRNZXRhQ2xhc3MoKTogVE1ldGFDb21wb25lbnQ8VD47XG59XG5cbi8vIEVuZ2xpc2ggY29tbWVudHMgYXMgcmVxdWVzdGVkLlxuZXhwb3J0IGFic3RyYWN0IGNsYXNzIFRNZXRhQ29tcG9uZW50PFQgZXh0ZW5kcyBUQ29tcG9uZW50PiBleHRlbmRzIFRNZXRhY2xhc3Mge1xuICAgICAgICAvLyBUaGUgc3ltYm9saWMgbmFtZSB1c2VkIGluIEhUTUw6IGRhdGEtY29tcG9uZW50PVwiVEJ1dHRvblwiIG9yIFwibXktYnV0dG9uXCJcbiAgICAgICAgYWJzdHJhY3QgcmVhZG9ubHkgdHlwZU5hbWU6IHN0cmluZztcbiAgICAgICAgLy9zdGF0aWMgbWV0YUNsYXNzOiBUTWV0YUNvbXBvbmVudDxUPiA9IG5ldyBUTWV0YUNvbXBvbmVudDxUPigpO1xuICAgICAgICAvL2Fic3RyYWN0IHJlYWRvbmx5IG1ldGFjbGFzczogVE1ldGFDb21wb25lbnQ8VD47XG4gICAgICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICAgICAgICAgIHN1cGVyKCk7XG4gICAgICAgIH1cblxuICAgICAgICBhYnN0cmFjdCBnZXRNZXRhQ2xhc3MoKTogVE1ldGFDb21wb25lbnQ8VD47XG4gICAgICAgIC8vYWJzdHJhY3QgZ2V0TWV0YUNsYXNzKCk6IFRNZXRhQ29tcG9uZW50PFQ+O1xuICAgICAgICAvL2Fic3RyYWN0IGdldE1ldGFDbGFzcygpOiBUTWV0YUNvbXBvbmVudDxUPjsgLy97XG4gICAgICAgIC8vcmV0dXJuIFRNZXRhQ29tcG9uZW50Lm1ldGFjbGFzcztcbiAgICAgICAgLy99XG5cbiAgICAgICAgLy8gQ3JlYXRlIHRoZSBydW50aW1lIGluc3RhbmNlIGFuZCBhdHRhY2ggaXQgdG8gdGhlIERPTSBlbGVtZW50LlxuICAgICAgICBjcmVhdGUobmFtZTogc3RyaW5nLCBmb3JtOiBURm9ybSwgcGFyZW50OiBUQ29tcG9uZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBUQ29tcG9uZW50KHRoaXMuZ2V0TWV0YUNsYXNzKCksIG5hbWUsIGZvcm0sIHBhcmVudCk7XG4gICAgICAgIH1cblxuICAgICAgICAvKiogUHJvcGVydHkgc2NoZW1hIGZvciB0aGlzIGNvbXBvbmVudCB0eXBlICovXG4gICAgICAgIHByb3BzKCk6IFByb3BTcGVjPFQ+W10ge1xuICAgICAgICAgICAgICAgIHJldHVybiBbXTtcbiAgICAgICAgfVxuXG4gICAgICAgIGRvbUV2ZW50cz8oKTogc3RyaW5nW107IC8vIGRlZmF1bHQgW107XG5cbiAgICAgICAgLypcbiAgICAgICAgLy8gT3B0aW9uYWw6IHBhcnNlIEhUTUwgYXR0cmlidXRlcyAtPiBwcm9wcy9zdGF0ZVxuICAgICAgICAvLyBFeGFtcGxlOiBkYXRhLWNhcHRpb249XCJPS1wiIC0+IHsgY2FwdGlvbjogXCJPS1wiIH1cbiAgICAgICAgcGFyc2VQcm9wcz8oZWxlbTogSFRNTEVsZW1lbnQpOiBKc29uO1xuXG4gICAgICAgIC8vIE9wdGlvbmFsOiBhcHBseSBwcm9wcyB0byB0aGUgY29tcG9uZW50IChjYW4gYmUgY2FsbGVkIGFmdGVyIGNyZWF0ZSlcbiAgICAgICAgYXBwbHlQcm9wcz8oYzogVCwgcHJvcHM6IEpzb24pOiB2b2lkO1xuXG4gICAgICAgIC8vIE9wdGlvbmFsOiBEZXNpZ24tdGltZSBtZXRhZGF0YSAocGFsZXR0ZSwgaW5zcGVjdG9yLCBldGMuKVxuICAgICAgICBkZXNpZ25UaW1lPzoge1xuICAgICAgICAgICAgICAgIHBhbGV0dGVHcm91cD86IHN0cmluZztcbiAgICAgICAgICAgICAgICBkaXNwbGF5TmFtZT86IHN0cmluZztcbiAgICAgICAgICAgICAgICBpY29uPzogc3RyaW5nOyAvLyBsYXRlclxuICAgICAgICAgICAgICAgIC8vIHByb3BlcnR5IHNjaGVtYSBjb3VsZCBsaXZlIGhlcmVcbiAgICAgICAgfTtcbiAgICAgICAgKi9cbn1cblxuLy9pbXBvcnQgdHlwZSB7IFRDb21wb25lbnRDbGFzcyB9IGZyb20gJy4vVENvbXBvbmVudENsYXNzJztcbi8vaW1wb3J0IHR5cGUgeyBUQ29tcG9uZW50IH0gZnJvbSAnQHZjbCc7XG5cbmV4cG9ydCBjbGFzcyBDb21wb25lbnRUeXBlUmVnaXN0cnkge1xuICAgICAgICAvLyBXZSBzdG9yZSBoZXRlcm9nZW5lb3VzIG1ldGFzLCBzbyB3ZSBrZWVwIHRoZW0gYXMgVE1ldGFDb21wb25lbnQ8YW55Pi5cbiAgICAgICAgcHJpdmF0ZSByZWFkb25seSBjbGFzc2VzID0gbmV3IE1hcDxzdHJpbmcsIFRNZXRhQ29tcG9uZW50PFRDb21wb25lbnQ+PigpO1xuXG4gICAgICAgIHJlZ2lzdGVyKG1ldGE6IFRNZXRhQ29tcG9uZW50PGFueT4pIHtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5jbGFzc2VzLmhhcyhtZXRhLnR5cGVOYW1lKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBDb21wb25lbnQgdHlwZSBhbHJlYWR5IHJlZ2lzdGVyZWQ6ICR7bWV0YS50eXBlTmFtZX1gKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdGhpcy5jbGFzc2VzLnNldChtZXRhLnR5cGVOYW1lLCBtZXRhKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIElmIHlvdSBqdXN0IG5lZWQgXCJzb21ldGhpbmcgbWV0YVwiLCByZXR1cm4gYW55LW1ldGEuXG4gICAgICAgIGdldCh0eXBlTmFtZTogc3RyaW5nKTogVE1ldGFDb21wb25lbnQ8VENvbXBvbmVudD4gfCB1bmRlZmluZWQge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmNsYXNzZXMuZ2V0KHR5cGVOYW1lKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGhhcyh0eXBlTmFtZTogc3RyaW5nKTogYm9vbGVhbiB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuY2xhc3Nlcy5oYXModHlwZU5hbWUpO1xuICAgICAgICB9XG5cbiAgICAgICAgbGlzdCgpOiBzdHJpbmdbXSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIFsuLi50aGlzLmNsYXNzZXMua2V5cygpXS5zb3J0KCk7XG4gICAgICAgIH1cbn1cblxuLypcblxuLy9leHBvcnQgdHlwZSBDb21wb25lbnRGYWN0b3J5ID0gKG5hbWU6IHN0cmluZywgZm9ybTogVEZvcm0sIHBhcmVudDogVENvbXBvbmVudCkgPT4gVENvbXBvbmVudDtcblxuZXhwb3J0IGNsYXNzIENvbXBvbmVudFR5cGVSZWdpc3RyeSB7XG4gICAgICAgIHByaXZhdGUgZmFjdG9yaWVzID0gbmV3IE1hcDxzdHJpbmcsIENvbXBvbmVudEZhY3Rvcnk+KCk7XG5cbiAgICAgICAgZ2V0KG5hbWU6IHN0cmluZyk6IENvbXBvbmVudEZhY3RvcnkgfCBudWxsIHwgdW5kZWZpbmVkIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5mYWN0b3JpZXMuZ2V0KG5hbWUpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmVnaXN0ZXJUeXBlKHR5cGVOYW1lOiBzdHJpbmcsIGZhY3Rvcnk6IENvbXBvbmVudEZhY3RvcnkpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmZhY3Rvcmllcy5zZXQodHlwZU5hbWUsIGZhY3RvcnkpO1xuICAgICAgICB9XG5cbiAgICAgICAgY3JlYXRlKG5hbWU6IHN0cmluZywgZm9ybTogVEZvcm0sIHBhcmVudDogVENvbXBvbmVudCk6IFRDb21wb25lbnQgfCBudWxsIHtcbiAgICAgICAgICAgICAgICBjb25zdCBmID0gdGhpcy5mYWN0b3JpZXMuZ2V0KG5hbWUpO1xuICAgICAgICAgICAgICAgIHJldHVybiBmID8gZihuYW1lLCBmb3JtLCBwYXJlbnQpIDogbnVsbDtcbiAgICAgICAgfVxufVxuXG4qL1xuXG5leHBvcnQgY2xhc3MgVENvbG9yIHtcbiAgICAgICAgczogc3RyaW5nO1xuXG4gICAgICAgIGNvbnN0cnVjdG9yKHM6IHN0cmluZykge1xuICAgICAgICAgICAgICAgIHRoaXMucyA9IHM7XG4gICAgICAgIH1cbiAgICAgICAgLyogZmFjdG9yeSAqLyBzdGF0aWMgcmdiKHI6IG51bWJlciwgZzogbnVtYmVyLCBiOiBudW1iZXIpOiBUQ29sb3Ige1xuICAgICAgICAgICAgICAgIHJldHVybiBuZXcgVENvbG9yKGByZ2IoJHtyfSwgJHtnfSwgJHtifSlgKTtcbiAgICAgICAgfVxuICAgICAgICAvKiBmYWN0b3J5ICovIHN0YXRpYyByZ2JhKHI6IG51bWJlciwgZzogbnVtYmVyLCBiOiBudW1iZXIsIGE6IG51bWJlcik6IFRDb2xvciB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBUQ29sb3IoYHJnYmEoJHtyfSwgJHtnfSwgJHtifSwgJHthfSlgKTtcbiAgICAgICAgfVxufVxuXG5leHBvcnQgY2xhc3MgQ29tcG9uZW50UmVnaXN0cnkge1xuICAgICAgICBwcml2YXRlIGluc3RhbmNlcyA9IG5ldyBNYXA8c3RyaW5nLCBUQ29tcG9uZW50PigpO1xuXG4gICAgICAgIGxvZ2dlciA9IHtcbiAgICAgICAgICAgICAgICBkZWJ1Zyhtc2c6IHN0cmluZywgZGF0YT86IEpzb24pOiB2b2lkIHt9LFxuICAgICAgICAgICAgICAgIGluZm8obXNnOiBzdHJpbmcsIGRhdGE/OiBKc29uKTogdm9pZCB7fSxcbiAgICAgICAgICAgICAgICB3YXJuKG1zZzogc3RyaW5nLCBkYXRhPzogSnNvbik6IHZvaWQge30sXG4gICAgICAgICAgICAgICAgZXJyb3IobXNnOiBzdHJpbmcsIGRhdGE/OiBKc29uKTogdm9pZCB7fVxuICAgICAgICB9O1xuXG4gICAgICAgIGV2ZW50QnVzID0ge1xuICAgICAgICAgICAgICAgIG9uKGV2ZW50OiBzdHJpbmcsIGhhbmRsZXI6IChwYXlsb2FkOiBhbnkpID0+IHZvaWQpOiAoKSA9PiB2b2lkIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAoKSA9PiB2b2lkIHt9O1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgZW1pdChldmVudDogc3RyaW5nLCBwYXlsb2FkOiBhbnkpOiB2b2lkIHt9XG4gICAgICAgIH07XG5cbiAgICAgICAgc3RvcmFnZSA9IHtcbiAgICAgICAgICAgICAgICBnZXQoa2V5OiBzdHJpbmcpOiBQcm9taXNlPGFueT4gfCBudWxsIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgc2V0KGtleTogc3RyaW5nLCB2YWx1ZTogYW55KTogUHJvbWlzZTx2b2lkPiB8IG51bGwge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICByZW1vdmUoa2V5OiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHwgbnVsbCB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgIH07XG5cbiAgICAgICAgY29uc3RydWN0b3IoKSB7fVxuXG4gICAgICAgIHJlZ2lzdGVySW5zdGFuY2UobmFtZTogc3RyaW5nLCBjOiBUQ29tcG9uZW50KSB7XG4gICAgICAgICAgICAgICAgdGhpcy5pbnN0YW5jZXMuc2V0KG5hbWUsIGMpO1xuICAgICAgICB9XG4gICAgICAgIGdldDxUIGV4dGVuZHMgVENvbXBvbmVudCA9IFRDb21wb25lbnQ+KG5hbWU6IHN0cmluZyk6IFQgfCB1bmRlZmluZWQge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmluc3RhbmNlcy5nZXQobmFtZSkgYXMgVCB8IHVuZGVmaW5lZDtcbiAgICAgICAgfVxuXG4gICAgICAgIHNlcnZpY2VzOiBEZWxwaGluZVNlcnZpY2VzID0ge1xuICAgICAgICAgICAgICAgIGxvZzogdGhpcy5sb2dnZXIsXG4gICAgICAgICAgICAgICAgYnVzOiB0aGlzLmV2ZW50QnVzLFxuICAgICAgICAgICAgICAgIHN0b3JhZ2U6IHRoaXMuc3RvcmFnZVxuICAgICAgICB9O1xuXG4gICAgICAgIGNsZWFyKCkge1xuICAgICAgICAgICAgICAgIHRoaXMuaW5zdGFuY2VzLmNsZWFyKCk7XG4gICAgICAgIH1cblxuICAgICAgICByZXNvbHZlUm9vdCgpOiBIVE1MRWxlbWVudCB7XG4gICAgICAgICAgICAgICAgLy8gUHJlZmVyIGJvZHkgYXMgdGhlIGNhbm9uaWNhbCByb290LlxuICAgICAgICAgICAgICAgIGlmIChkb2N1bWVudC5ib2R5Py5kYXRhc2V0Py5jb21wb25lbnQpIHJldHVybiBkb2N1bWVudC5ib2R5O1xuXG4gICAgICAgICAgICAgICAgLy8gQmFja3dhcmQgY29tcGF0aWJpbGl0eTogb2xkIHdyYXBwZXIgZGl2LlxuICAgICAgICAgICAgICAgIGNvbnN0IGxlZ2FjeSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdkZWxwaGluZS1yb290Jyk7XG4gICAgICAgICAgICAgICAgaWYgKGxlZ2FjeSkgcmV0dXJuIGxlZ2FjeTtcblxuICAgICAgICAgICAgICAgIC8vIExhc3QgcmVzb3J0LlxuICAgICAgICAgICAgICAgIHJldHVybiBkb2N1bWVudC5ib2R5ID8/IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudDtcbiAgICAgICAgfVxuXG4gICAgICAgIHByaXZhdGUgcmVhZFByb3BzKGVsOiBFbGVtZW50LCBtZXRhOiBUTWV0YUNvbXBvbmVudDxUQ29tcG9uZW50Pikge1xuICAgICAgICAgICAgICAgIGNvbnN0IG91dDogUmVjb3JkPHN0cmluZywgYW55PiA9IHt9O1xuICAgICAgICAgICAgICAgIGZvciAoY29uc3Qgc3BlYyBvZiBtZXRhLnByb3BzKCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHJhdyA9IGVsLmdldEF0dHJpYnV0ZShgZGF0YS0ke3NwZWMubmFtZX1gKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChyYXcgPT0gbnVsbCkgY29udGludWU7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIG91dFtzcGVjLm5hbWVdID0gdGhpcy5jb252ZXJ0KHJhdywgc3BlYy5raW5kKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIG91dDtcbiAgICAgICAgfVxuXG4gICAgICAgIHByaXZhdGUgY29udmVydChyYXc6IHN0cmluZywga2luZDogUHJvcEtpbmQpIHtcbiAgICAgICAgICAgICAgICBzd2l0Y2ggKGtpbmQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgJ3N0cmluZyc6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiByYXc7XG4gICAgICAgICAgICAgICAgICAgICAgICBjYXNlICdudW1iZXInOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gTnVtYmVyKHJhdyk7XG4gICAgICAgICAgICAgICAgICAgICAgICBjYXNlICdib29sZWFuJzpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJhdyA9PT0gJ3RydWUnIHx8IHJhdyA9PT0gJzEnIHx8IHJhdyA9PT0gJyc7XG4gICAgICAgICAgICAgICAgICAgICAgICBjYXNlICdjb2xvcic6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiByYXc7IC8vIG91IHBhcnNlIGVuIFRDb2xvciBzaSB2b3VzIGF2ZXpcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBhcHBseVByb3BzKGNoaWxkOiBUQ29tcG9uZW50LCBjbHM6IFRNZXRhQ29tcG9uZW50PFRDb21wb25lbnQ+KSB7XG4gICAgICAgICAgICAgICAgY29uc3QgcHJvcHMgPSB0aGlzLnJlYWRQcm9wcyhjaGlsZC5lbGVtISwgY2xzKTtcbiAgICAgICAgICAgICAgICBmb3IgKGNvbnN0IHNwZWMgb2YgY2xzLnByb3BzKCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChwcm9wc1tzcGVjLm5hbWVdICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3BlYy5hcHBseShjaGlsZCwgcHJvcHNbc3BlYy5uYW1lXSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgYnVpbGRDb21wb25lbnRUcmVlKGZvcm06IFRGb3JtLCBjb21wb25lbnQ6IFRDb21wb25lbnQpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmNsZWFyKCk7XG4gICAgICAgICAgICAgICAgLy8gcmVzb2x2ZVJvb3QgZXN0IG1haW50ZW5hbnQgYXBwZWxcdTAwRTkgcGFyIFRGb3JtOjpzaG93KCkuIEludXRpbGUgZGUgbGUgZmFpcmUgaWNpXG4gICAgICAgICAgICAgICAgLy9jb25zdCByb290ID0gVERvY3VtZW50LmJvZHk7XG4gICAgICAgICAgICAgICAgLy9jb25zdCByb290ID0gKGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdkZWxwaGluZS1yb290JykgPz8gZG9jdW1lbnQuYm9keSkgYXMgSFRNTEVsZW1lbnQ7XG4gICAgICAgICAgICAgICAgLy9jb25zdCByb290ID0gKGRvY3VtZW50LmJvZHk/Lm1hdGNoZXMoJ1tkYXRhLWNvbXBvbmVudF0nKSA/IGRvY3VtZW50LmJvZHkgOiBudWxsKSA/PyAoZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2RlbHBoaW5lLXJvb3QnKSBhcyBIVE1MRWxlbWVudCB8IG51bGwpID8/IGRvY3VtZW50LmJvZHk7XG4gICAgICAgICAgICAgICAgLy9jb25zdCByb290ID0gdGhpcy5yZXNvbHZlUm9vdCgpO1xuXG4gICAgICAgICAgICAgICAgLy8gLS0tIEZPUk0gLS0tXG4gICAgICAgICAgICAgICAgLy8gcHJvdmlzb2lyZW1lbnQgaWYgKHJvb3QuZ2V0QXR0cmlidXRlKCdkYXRhLWNvbXBvbmVudCcpID09PSAnVEZvcm0nKSB7XG5cbiAgICAgICAgICAgICAgICB0aGlzLnJlZ2lzdGVySW5zdGFuY2UoY29tcG9uZW50Lm5hbWUsIGZvcm0pO1xuICAgICAgICAgICAgICAgIC8vfVxuICAgICAgICAgICAgICAgIGNvbnN0IHJvb3QgPSBjb21wb25lbnQuZWxlbSE7XG5cbiAgICAgICAgICAgICAgICAvLyAtLS0gQ0hJTEQgQ09NUE9ORU5UUyAtLS1cbiAgICAgICAgICAgICAgICByb290LnF1ZXJ5U2VsZWN0b3JBbGwoJzpzY29wZSA+IFtkYXRhLWNvbXBvbmVudF0nKS5mb3JFYWNoKChlbCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGVsID09PSByb290KSByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBuYW1lID0gZWwuZ2V0QXR0cmlidXRlKCdkYXRhLW5hbWUnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHR5cGUgPSBlbC5nZXRBdHRyaWJ1dGUoJ2RhdGEtY29tcG9uZW50Jyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAvL2NvbnN0IHRpdGkgPSBlbC5nZXRBdHRyaWJ1dGUoJ2RhdGEtb25jbGljaycpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAvL2NvbnNvbGUubG9nKGB0aXRpID0gJHt0aXRpfWApO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAvL2xldCBjb21wOiBUQ29tcG9uZW50IHwgbnVsbCA9IG51bGw7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIFRoZSBmb2xsb3dpbmcgc3dpdGNoIGlzIGp1c3QgZm9yIG5vdy4gSW4gdGhlIGZ1dHVyZSBpdCB3aWxsIG5vdCBiZSBuZWNlc3NhcnlcbiAgICAgICAgICAgICAgICAgICAgICAgIC8qXG4gICAgICAgICAgICAgICAgICAgICAgICBzd2l0Y2ggKHR5cGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSAnbXktYnV0dG9uJzpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb21wID0gbmV3IFRCdXR0b24obmFtZSEsIGZvcm0sIGZvcm0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgJ2RlbHBoaW5lLXBsdWdpbic6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy9jb21wID0gbmV3IFBsdWdpbkhvc3QobmFtZSwgZm9ybSwgZm9ybSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgIH0qL1xuICAgICAgICAgICAgICAgICAgICAgICAgLy9jb25zdCBhcHBsaWNhdGlvbjogVEFwcGxpY2F0aW9uID0gbmV3IFRBcHBsaWNhdGlvbigpO1xuICAgICAgICAgICAgICAgICAgICAgICAgLy9jb25zdCBmYWN0b3J5ID0gVEFwcGxpY2F0aW9uLlRoZUFwcGxpY2F0aW9uLnR5cGVzLmdldCh0eXBlISk7XG4gICAgICAgICAgICAgICAgICAgICAgICAvKlxuICAgICAgICAgICAgICAgICAgICAgICAgbGV0IGNvbXA6IFRDb21wb25lbnQgfCBudWxsID0gbnVsbDtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChmYWN0b3J5KSBjb21wID0gZmFjdG9yeShuYW1lISwgZm9ybSwgZm9ybSk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChjb21wKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbXAuZWxlbSA9IGVsO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnJlZ2lzdGVyKG5hbWUhLCBjb21wKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKi9cblxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgY2xzID0gVEFwcGxpY2F0aW9uLlRoZUFwcGxpY2F0aW9uLnR5cGVzLmdldCh0eXBlISk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIWNscykgcmV0dXJuO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBjaGlsZCA9IGNscy5jcmVhdGUobmFtZSEsIGZvcm0sIGNvbXBvbmVudCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBuYW1lOiBzdHJpbmcsIGZvcm06IFRGb3JtLCBwYXJlbnQ6IFRDb21wb25lbnQsIGVsZW06IEhUTUxFbGVtZW50XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIWNoaWxkKSByZXR1cm47XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIC8vY2hpbGQucGFyZW50ID0gY29tcG9uZW50O1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBjaGlsZC5lbGVtID0gZWw7XG4gICAgICAgICAgICAgICAgICAgICAgICAvL2NoaWxkLmZvcm0gPSBmb3JtO1xuICAgICAgICAgICAgICAgICAgICAgICAgLy9jaGlsZC5uYW1lID0gbmFtZSE7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBPcHRpb25hbCBwcm9wc1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5hcHBseVByb3BzKGNoaWxkLCBjbHMpO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5yZWdpc3Rlckluc3RhbmNlKG5hbWUhLCBjaGlsZCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb21wb25lbnQuY2hpbGRyZW4ucHVzaChjaGlsZCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBtYXliZUhvc3QgPSBjaGlsZCBhcyB1bmtub3duIGFzIFBhcnRpYWw8SVBsdWdpbkhvc3Q+O1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG1heWJlSG9zdCAmJiB0eXBlb2YgbWF5YmVIb3N0LnNldFBsdWdpblNwZWMgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgcGx1Z2luID0gZWwuZ2V0QXR0cmlidXRlKCdkYXRhLXBsdWdpbicpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCByYXcgPSBlbC5nZXRBdHRyaWJ1dGUoJ2RhdGEtcHJvcHMnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgcHJvcHMgPSByYXcgPyBKU09OLnBhcnNlKHJhdykgOiB7fTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtYXliZUhvc3Quc2V0UGx1Z2luU3BlYyh7IHBsdWdpbiwgcHJvcHMgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1heWJlSG9zdC5tb3VudFBsdWdpbklmUmVhZHkhKHRoaXMuc2VydmljZXMpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvL21heWJlSG9zdC5tb3VudEZyb21SZWdpc3RyeShzZXJ2aWNlcyk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChjaGlsZC5hbGxvd3NDaGlsZHJlbigpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuYnVpbGRDb21wb25lbnRUcmVlKGZvcm0sIGNoaWxkKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgfVxufVxuXG5leHBvcnQgY2xhc3MgVENvbXBvbmVudCB7XG4gICAgICAgIHJlYWRvbmx5IG1ldGFDbGFzczogVE1ldGFDb21wb25lbnQ8YW55PjtcbiAgICAgICAgcmVhZG9ubHkgbmFtZTogc3RyaW5nO1xuICAgICAgICByZWFkb25seSBwYXJlbnQ6IFRDb21wb25lbnQgfCBudWxsID0gbnVsbDtcbiAgICAgICAgZm9ybTogVEZvcm0gfCBudWxsID0gbnVsbDtcbiAgICAgICAgY2hpbGRyZW46IFRDb21wb25lbnRbXSA9IFtdO1xuXG4gICAgICAgIGVsZW06IEVsZW1lbnQgfCBudWxsID0gbnVsbDtcbiAgICAgICAgZ2V0IGh0bWxFbGVtZW50KCk6IEhUTUxFbGVtZW50IHwgbnVsbCB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuZWxlbSBhcyBIVE1MRWxlbWVudCB8IG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3RydWN0b3IobWV0YUNsYXNzOiBUTWV0YUNvbXBvbmVudDxhbnk+LCBuYW1lOiBzdHJpbmcsIGZvcm06IFRGb3JtIHwgbnVsbCwgcGFyZW50OiBUQ29tcG9uZW50IHwgbnVsbCkge1xuICAgICAgICAgICAgICAgIHRoaXMubWV0YUNsYXNzID0gbWV0YUNsYXNzO1xuICAgICAgICAgICAgICAgIHRoaXMubmFtZSA9IG5hbWU7XG4gICAgICAgICAgICAgICAgdGhpcy5wYXJlbnQgPSBwYXJlbnQ7XG4gICAgICAgICAgICAgICAgcGFyZW50Py5jaGlsZHJlbi5wdXNoKHRoaXMpO1xuICAgICAgICAgICAgICAgIHRoaXMuZm9ybSA9IGZvcm07XG4gICAgICAgICAgICAgICAgdGhpcy5uYW1lID0gbmFtZTtcbiAgICAgICAgICAgICAgICAvL3RoaXMubWV0YUNsYXNzID0gbWV0YUNsYXNzO1xuICAgICAgICB9XG5cbiAgICAgICAgLyoqIE1heSBjb250YWluIGNoaWxkIGNvbXBvbmVudHMgKi9cbiAgICAgICAgYWxsb3dzQ2hpbGRyZW4oKTogYm9vbGVhbiB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG5cbiAgICAgICAgZ2V0IGNvbG9yKCk6IFRDb2xvciB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBUQ29sb3IodGhpcy5nZXRTdHlsZVByb3AoJ2NvbG9yJykpO1xuICAgICAgICB9XG4gICAgICAgIHNldCBjb2xvcih2OiBUQ29sb3IpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnNldFN0eWxlUHJvcCgnY29sb3InLCB2LnMpO1xuICAgICAgICB9XG5cbiAgICAgICAgZ2V0IGJhY2tncm91bmRDb2xvcigpOiBUQ29sb3Ige1xuICAgICAgICAgICAgICAgIHJldHVybiBuZXcgVENvbG9yKHRoaXMuZ2V0U3R5bGVQcm9wKCdiYWNrZ3JvdW5kLWNvbG9yJykpO1xuICAgICAgICB9XG4gICAgICAgIHNldCBiYWNrZ3JvdW5kQ29sb3IodjogVENvbG9yKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5zZXRTdHlsZVByb3AoJ2JhY2tncm91bmQtY29sb3InLCB2LnMpO1xuICAgICAgICB9XG5cbiAgICAgICAgZ2V0IHdpZHRoKCk6IG51bWJlciB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHBhcnNlSW50KHRoaXMuZ2V0U3R5bGVQcm9wKCd3aWR0aCcpKTtcbiAgICAgICAgfVxuICAgICAgICBzZXQgd2lkdGgodjogbnVtYmVyKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5zZXRTdHlsZVByb3AoJ3dpZHRoJywgdi50b1N0cmluZygpKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGdldCBoZWlnaHQoKTogbnVtYmVyIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcGFyc2VJbnQodGhpcy5nZXRTdHlsZVByb3AoJ2hlaWdodCcpKTtcbiAgICAgICAgfVxuICAgICAgICBzZXQgaGVpZ2h0KHY6IG51bWJlcikge1xuICAgICAgICAgICAgICAgIHRoaXMuc2V0U3R5bGVQcm9wKCdoZWlnaHQnLCB2LnRvU3RyaW5nKCkpO1xuICAgICAgICB9XG5cbiAgICAgICAgZ2V0IG9mZnNldFdpZHRoKCk6IG51bWJlciB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuaHRtbEVsZW1lbnQhLm9mZnNldFdpZHRoO1xuICAgICAgICB9XG4gICAgICAgIGdldCBvZmZzZXRIZWlnaHQoKTogbnVtYmVyIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5odG1sRWxlbWVudCEub2Zmc2V0SGVpZ2h0O1xuICAgICAgICB9XG5cbiAgICAgICAgc2V0U3R5bGVQcm9wKG5hbWU6IHN0cmluZywgdmFsdWU6IHN0cmluZykge1xuICAgICAgICAgICAgICAgIHRoaXMuaHRtbEVsZW1lbnQhLnN0eWxlLnNldFByb3BlcnR5KG5hbWUsIHZhbHVlKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGdldFN0eWxlUHJvcChuYW1lOiBzdHJpbmcpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5odG1sRWxlbWVudCEuc3R5bGUuZ2V0UHJvcGVydHlWYWx1ZShuYW1lKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHNldFByb3AobmFtZTogc3RyaW5nLCB2YWx1ZTogc3RyaW5nKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5odG1sRWxlbWVudCEuc2V0QXR0cmlidXRlKG5hbWUsIHZhbHVlKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGdldFByb3AobmFtZTogc3RyaW5nKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMhLmh0bWxFbGVtZW50IS5nZXRBdHRyaWJ1dGUobmFtZSk7XG4gICAgICAgIH1cbn1cblxuZXhwb3J0IGNsYXNzIFREb2N1bWVudCB7XG4gICAgICAgIHN0YXRpYyBkb2N1bWVudDogVERvY3VtZW50ID0gbmV3IFREb2N1bWVudChkb2N1bWVudCk7XG4gICAgICAgIHN0YXRpYyBib2R5ID0gZG9jdW1lbnQuYm9keTtcbiAgICAgICAgaHRtbERvYzogRG9jdW1lbnQ7XG4gICAgICAgIGNvbnN0cnVjdG9yKGh0bWxEb2M6IERvY3VtZW50KSB7XG4gICAgICAgICAgICAgICAgdGhpcy5odG1sRG9jID0gaHRtbERvYztcbiAgICAgICAgfVxufVxuXG5leHBvcnQgY2xhc3MgVE1ldGFGb3JtIGV4dGVuZHMgVE1ldGFDb21wb25lbnQ8VEZvcm0+IHtcbiAgICAgICAgLy9tZXRhY2xhc3M6IFRNZXRhQ29tcG9uZW50PFRGb3JtPjtcbiAgICAgICAgc3RhdGljIG1ldGFjbGFzczogVE1ldGFGb3JtID0gbmV3IFRNZXRhRm9ybSgpO1xuICAgICAgICBnZXRNZXRhQ2xhc3MoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIFRNZXRhRm9ybS5tZXRhY2xhc3M7XG4gICAgICAgIH1cbiAgICAgICAgcmVhZG9ubHkgdHlwZU5hbWUgPSAnVEZvcm0nO1xuXG4gICAgICAgIGNyZWF0ZShuYW1lOiBzdHJpbmcsIGZvcm06IFRGb3JtLCBwYXJlbnQ6IFRDb21wb25lbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gbmV3IFRGb3JtKG5hbWUpO1xuICAgICAgICB9XG5cbiAgICAgICAgcHJvcHMoKTogUHJvcFNwZWM8VEZvcm0+W10ge1xuICAgICAgICAgICAgICAgIHJldHVybiBbXTtcbiAgICAgICAgfVxufVxuXG5leHBvcnQgY2xhc3MgVEZvcm0gZXh0ZW5kcyBUQ29tcG9uZW50IHtcbiAgICAgICAgYWxsb3dzQ2hpbGRyZW4oKTogYm9vbGVhbiB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cbiAgICAgICAgc3RhdGljIGZvcm1zID0gbmV3IE1hcDxzdHJpbmcsIFRGb3JtPigpO1xuICAgICAgICBwcml2YXRlIF9tb3VudGVkID0gZmFsc2U7XG4gICAgICAgIC8vIEVhY2ggRm9ybSBoYXMgaXRzIG93biBjb21wb25lbnRSZWdpc3RyeVxuICAgICAgICBjb21wb25lbnRSZWdpc3RyeTogQ29tcG9uZW50UmVnaXN0cnkgPSBuZXcgQ29tcG9uZW50UmVnaXN0cnkoKTtcbiAgICAgICAgY29uc3RydWN0b3IobmFtZTogc3RyaW5nKSB7XG4gICAgICAgICAgICAgICAgc3VwZXIoVE1ldGFGb3JtLm1ldGFjbGFzcywgbmFtZSwgbnVsbCwgbnVsbCk7XG4gICAgICAgICAgICAgICAgdGhpcy5mb3JtID0gdGhpcztcbiAgICAgICAgICAgICAgICBURm9ybS5mb3Jtcy5zZXQobmFtZSwgdGhpcyk7XG4gICAgICAgICAgICAgICAgLy90aGlzLnBhcmVudCA9IHRoaXM7XG4gICAgICAgIH1cblxuICAgICAgICBnZXQgYXBwbGljYXRpb24oKTogVEFwcGxpY2F0aW9uIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5mb3JtPy5hcHBsaWNhdGlvbiA/PyBUQXBwbGljYXRpb24uVGhlQXBwbGljYXRpb247XG4gICAgICAgIH1cblxuICAgICAgICAvKiAgICAgICAgZmluZEZvcm1Gcm9tRXZlbnRUYXJnZXQoY3VycmVudFRhcmdldEVsZW06IEVsZW1lbnQpOiBURm9ybSB8IG51bGwge1xuICAgICAgICAgICAgICAgIGNvbnN0IGZvcm1OYW1lID0gY3VycmVudFRhcmdldEVsZW0uZ2V0QXR0cmlidXRlKCdkYXRhLW5hbWUnKTtcbiAgICAgICAgICAgICAgICBjb25zdCBmb3JtOiBURm9ybSA9IFRGb3JtLmZvcm1zLmdldChmb3JtTmFtZSEpITtcbiAgICAgICAgICAgICAgICByZXR1cm4gZm9ybTtcbiAgICAgICAgfVxuICAgICAgICAgICAgICAgICovXG5cbiAgICAgICAgLy8gRW5nbGlzaCBjb21tZW50cyBhcyByZXF1ZXN0ZWQuXG5cbiAgICAgICAgZmluZEZvcm1Gcm9tRXZlbnRUYXJnZXQodGFyZ2V0OiBFbGVtZW50KTogVEZvcm0gfCBudWxsIHtcbiAgICAgICAgICAgICAgICAvLyAxKSBGaW5kIHRoZSBuZWFyZXN0IGVsZW1lbnQgdGhhdCBsb29rcyBsaWtlIGEgZm9ybSBjb250YWluZXJcbiAgICAgICAgICAgICAgICBjb25zdCBmb3JtRWxlbSA9IHRhcmdldC5jbG9zZXN0KCdbZGF0YS1jb21wb25lbnQ9XCJURm9ybVwiXVtkYXRhLW5hbWVdJykgYXMgRWxlbWVudCB8IG51bGw7XG4gICAgICAgICAgICAgICAgaWYgKCFmb3JtRWxlbSkgcmV0dXJuIG51bGw7XG5cbiAgICAgICAgICAgICAgICAvLyAyKSBSZXNvbHZlIHRoZSBURm9ybSBpbnN0YW5jZVxuICAgICAgICAgICAgICAgIGNvbnN0IGZvcm1OYW1lID0gZm9ybUVsZW0uZ2V0QXR0cmlidXRlKCdkYXRhLW5hbWUnKTtcbiAgICAgICAgICAgICAgICBpZiAoIWZvcm1OYW1lKSByZXR1cm4gbnVsbDtcblxuICAgICAgICAgICAgICAgIHJldHVybiBURm9ybS5mb3Jtcy5nZXQoZm9ybU5hbWUpID8/IG51bGw7XG4gICAgICAgIH1cblxuICAgICAgICBwcml2YXRlIF9hYzogQWJvcnRDb250cm9sbGVyIHwgbnVsbCA9IG51bGw7XG5cbiAgICAgICAgaW5zdGFsbEV2ZW50Um91dGVyKCkge1xuICAgICAgICAgICAgICAgIHRoaXMuX2FjPy5hYm9ydCgpO1xuICAgICAgICAgICAgICAgIHRoaXMuX2FjID0gbmV3IEFib3J0Q29udHJvbGxlcigpO1xuICAgICAgICAgICAgICAgIGNvbnN0IHsgc2lnbmFsIH0gPSB0aGlzLl9hYztcblxuICAgICAgICAgICAgICAgIGNvbnN0IHJvb3QgPSB0aGlzLmVsZW0gYXMgRWxlbWVudCB8IG51bGw7XG4gICAgICAgICAgICAgICAgaWYgKCFyb290KSByZXR1cm47XG5cbiAgICAgICAgICAgICAgICAvLyBzYW1lIGhhbmRsZXIgZm9yIGV2ZXJ5Ym9keVxuICAgICAgICAgICAgICAgIGNvbnN0IGhhbmRsZXIgPSAoZXY6IEV2ZW50KSA9PiB0aGlzLmRpc3BhdGNoRG9tRXZlbnQoZXYpO1xuXG4gICAgICAgICAgICAgICAgZm9yIChjb25zdCB0eXBlIG9mIFsnY2xpY2snLCAnaW5wdXQnLCAnY2hhbmdlJywgJ2tleWRvd24nXSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcm9vdC5hZGRFdmVudExpc3RlbmVyKHR5cGUsIGhhbmRsZXIsIHsgY2FwdHVyZTogdHJ1ZSwgc2lnbmFsIH0pO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGZvciAoY29uc3QgdHlwZSBpbiB0aGlzLm1ldGFDbGFzcy5kb21FdmVudHMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJvb3QuYWRkRXZlbnRMaXN0ZW5lcih0eXBlLCBoYW5kbGVyLCB7IGNhcHR1cmU6IHRydWUsIHNpZ25hbCB9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBkaXNwb3NlRXZlbnRSb3V0ZXIoKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fYWM/LmFib3J0KCk7XG4gICAgICAgICAgICAgICAgdGhpcy5fYWMgPSBudWxsO1xuICAgICAgICB9XG5cbiAgICAgICAgcHJpdmF0ZSBoYW5kbGVFdmVudChldjogRXZlbnQsIGVsOiBFbGVtZW50LCBhdHRyaWJ1dGU6IHN0cmluZyk6IGJvb2xlYW4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IGhhbmRsZXJOYW1lID0gZWwuZ2V0QXR0cmlidXRlKGF0dHJpYnV0ZSk7XG5cbiAgICAgICAgICAgICAgICAvLyBJZiB3ZSBmb3VuZCBhIGhhbmRsZXIgb24gdGhpcyBlbGVtZW50LCBkaXNwYXRjaCBpdFxuICAgICAgICAgICAgICAgIGlmIChoYW5kbGVyTmFtZSAmJiBoYW5kbGVyTmFtZSAhPT0gJycpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IG5hbWUgPSBlbC5nZXRBdHRyaWJ1dGUoJ2RhdGEtbmFtZScpO1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3Qgc2VuZGVyID0gbmFtZSA/ICh0aGlzLmNvbXBvbmVudFJlZ2lzdHJ5LmdldChuYW1lKSA/PyBudWxsKSA6IG51bGw7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IG1heWJlTWV0aG9kID0gKHRoaXMgYXMgYW55KVtoYW5kbGVyTmFtZV07XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodHlwZW9mIG1heWJlTWV0aG9kICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdOT1QgQSBNRVRIT0QnLCBoYW5kbGVyTmFtZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gSWYgc2VuZGVyIGlzIG1pc3NpbmcsIGZhbGxiYWNrIHRvIHRoZSBmb3JtIGl0c2VsZiAoc2FmZSlcbiAgICAgICAgICAgICAgICAgICAgICAgIChtYXliZU1ldGhvZCBhcyAoZXZlbnQ6IEV2ZW50LCBzZW5kZXI6IGFueSkgPT4gYW55KS5jYWxsKHRoaXMsIGV2LCBzZW5kZXIgPz8gdGhpcyk7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gV2UgcmVjZWl2ZWQgYW4gRE9NIEV2ZW50LiBEaXNwYXRjaCBpdFxuICAgICAgICBwcml2YXRlIGRpc3BhdGNoRG9tRXZlbnQoZXY6IEV2ZW50KSB7XG4gICAgICAgICAgICAgICAgY29uc3QgdGFyZ2V0RWxlbSA9IGV2LnRhcmdldCBhcyBFbGVtZW50IHwgbnVsbDtcbiAgICAgICAgICAgICAgICBpZiAoIXRhcmdldEVsZW0pIHJldHVybjtcblxuICAgICAgICAgICAgICAgIGNvbnN0IGV2VHlwZSA9IGV2LnR5cGU7XG5cbiAgICAgICAgICAgICAgICBsZXQgZWw6IEVsZW1lbnQgfCBudWxsID0gdGFyZ2V0RWxlbS5jbG9zZXN0KCdbZGF0YS1jb21wb25lbnRdJyk7XG4gICAgICAgICAgICAgICAgd2hpbGUgKGVsKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5oYW5kbGVFdmVudChldiwgZWwsIGBkYXRhLW9uJHtldlR5cGV9YCkpIHJldHVybjtcblxuICAgICAgICAgICAgICAgICAgICAgICAgLy9lbCA9IHRoaXMubmV4dENvbXBvbmVudEVsZW1lbnRVcChlbCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBuYW1lID0gZWwuZ2V0QXR0cmlidXRlKCdkYXRhLW5hbWUnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGNvbXAgPSBuYW1lID8gdGhpcy5jb21wb25lbnRSZWdpc3RyeS5nZXQobmFtZSkgOiBudWxsO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBQcmVmZXIgeW91ciBWQ0wtbGlrZSBwYXJlbnQgY2hhaW4gd2hlbiBhdmFpbGFibGVcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IG5leHQgPSBjb21wPy5wYXJlbnQ/LmVsZW0gPz8gbnVsbDtcblxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gRmFsbGJhY2s6IHN0YW5kYXJkIERPTSBwYXJlbnRcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsID0gbmV4dCA/PyBlbC5wYXJlbnRFbGVtZW50Py5jbG9zZXN0KCdbZGF0YS1jb21wb25lbnRdJykgPz8gbnVsbDtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvLyBObyBoYW5kbGVyIGhlcmU6IHRyeSBnb2luZyBcInVwXCIgdXNpbmcgeW91ciBjb21wb25lbnQgdHJlZSBpZiBwb3NzaWJsZVxuICAgICAgICB9XG5cbiAgICAgICAgc2hvdygpIHtcbiAgICAgICAgICAgICAgICAvLyBNdXN0IGJlIGRvbmUgYmVmb3JlIGJ1aWxkQ29tcG9uZW50VHJlZSgpIGJlY2F1c2UgYGJ1aWxkQ29tcG9uZW50VHJlZSgpYCBkb2VzIG5vdCBkbyBgcmVzb2x2ZVJvb3QoKWAgaXRzZWxmLlxuICAgICAgICAgICAgICAgIGlmICghdGhpcy5lbGVtKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmVsZW0gPSB0aGlzLmNvbXBvbmVudFJlZ2lzdHJ5LnJlc29sdmVSb290KCk7IC8vIG91IHRoaXMucmVzb2x2ZVJvb3QoKVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoIXRoaXMuX21vdW50ZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuY29tcG9uZW50UmVnaXN0cnkuYnVpbGRDb21wb25lbnRUcmVlKHRoaXMsIHRoaXMpO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5vbkNyZWF0ZSgpOyAvLyBNYXliZSBjb3VsZCBiZSBkb25lIGFmdGVyIGluc3RhbGxFdmVudFJvdXRlcigpXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmluc3RhbGxFdmVudFJvdXRlcigpO1xuICAgICAgICAgICAgICAgICAgICAgICAgLy9tb3VudFBsdWdpbklmUmVhZHkoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vdGhpcy5hZGRFdmVudExpc3RlbmVyKCdjbGljaycpO1xuICAgICAgICAgICAgICAgICAgICAgICAgLy90aGlzLmFkZEV2ZW50TGlzdGVuZXIoJ2lucHV0Jyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAvL3RoaXMuYWRkRXZlbnRMaXN0ZW5lcignY2hhbmdlJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAvL3RoaXMuYWRkRXZlbnRMaXN0ZW5lcigna2V5ZG93bicpO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5fbW91bnRlZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHRoaXMub25TaG93bigpO1xuXG4gICAgICAgICAgICAgICAgLy8gVE9ET1xuICAgICAgICB9XG5cbiAgICAgICAgLypcbiAgICAgICAgYWRkRXZlbnRMaXN0ZW5lcnh4eCh0eXBlOiBzdHJpbmcpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnYWRkRXZlbnRMaXN0ZW5lciBFTlRFUicsIHsgaGFzQm9keTogISFkb2N1bWVudC5ib2R5LCBoYXNFbGVtOiAhIXRoaXMuZWxlbSB9KTtcbiAgICAgICAgICAgICAgICBjb25zdCBnID0gd2luZG93IGFzIGFueTtcblxuICAgICAgICAgICAgICAgIC8vIEFib3J0IG9sZCBsaXN0ZW5lcnMgKGlmIGFueSlcbiAgICAgICAgICAgICAgICBpZiAoZy5fX2RlbHBoaW5lX2Fib3J0X2NvbnRyb2xsZXIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGcuX19kZWxwaGluZV9hYm9ydF9jb250cm9sbGVyLmFib3J0KCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGNvbnN0IGFjID0gbmV3IEFib3J0Q29udHJvbGxlcigpO1xuICAgICAgICAgICAgICAgIGcuX19kZWxwaGluZV9hYm9ydF9jb250cm9sbGVyID0gYWM7XG4gICAgICAgICAgICAgICAgY29uc3QgeyBzaWduYWwgfSA9IGFjO1xuXG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ0luc3RhbGxpbmcgZ2xvYmFsIGRlYnVnIGxpc3RlbmVycyAocmVzZXQrcmVpbnN0YWxsKScpO1xuXG4gICAgICAgICAgICAgICAgY29uc3Qgcm9vdCA9IHRoaXMuZWxlbTtcbiAgICAgICAgICAgICAgICBpZiAoIXJvb3QpIHJldHVybjtcblxuICAgICAgICAgICAgICAgIC8vIFZvdHJlIGhhbmRsZXIgc3VyIGxlIHJvb3RcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5lbGVtKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBFbmdsaXNoIGNvbW1lbnRzIGFzIHJlcXVlc3RlZC5cblxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gRW5nbGlzaCBjb21tZW50cyBhcyByZXF1ZXN0ZWQuXG5cbiAgICAgICAgICAgICAgICAgICAgICAgIHJvb3QuYWRkRXZlbnRMaXN0ZW5lcihcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKGV2OiBFdmVudCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHRhcmdldEVsZW0gPSBldi50YXJnZXQgYXMgRWxlbWVudCB8IG51bGw7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCF0YXJnZXRFbGVtKSByZXR1cm47XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBmb3JtID0gdGhpcy5maW5kRm9ybUZyb21FdmVudFRhcmdldCh0YXJnZXRFbGVtKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoIWZvcm0pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdObyBmb3JtIHJlc29sdmVkOyBldmVudCBpZ25vcmVkJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgZXZUeXBlID0gZXYudHlwZTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFN0YXJ0IGZyb20gdGhlIGNsaWNrZWQgY29tcG9uZW50IChvciBhbnkgY29tcG9uZW50IHdyYXBwZXIpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbGV0IHQxOiBFbGVtZW50IHwgbnVsbCA9IHRhcmdldEVsZW0uY2xvc2VzdCgnW2RhdGEtY29tcG9uZW50XScpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHdoaWxlICh0MSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgaGFuZGxlck5hbWUgPSB0MS5nZXRBdHRyaWJ1dGUoYGRhdGEtb24ke2V2VHlwZX1gKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gSWYgd2UgZm91bmQgYSBoYW5kbGVyIG9uIHRoaXMgZWxlbWVudCwgZGlzcGF0Y2ggaXRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChoYW5kbGVyTmFtZSAmJiBoYW5kbGVyTmFtZSAhPT0gJycpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgbmFtZSA9IHQxLmdldEF0dHJpYnV0ZSgnZGF0YS1uYW1lJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHNlbmRlciA9IG5hbWUgPyAoZm9ybS5jb21wb25lbnRSZWdpc3RyeS5nZXQobmFtZSkgPz8gbnVsbCkgOiBudWxsO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IG1heWJlTWV0aG9kID0gKGZvcm0gYXMgYW55KVtoYW5kbGVyTmFtZV07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgbWF5YmVNZXRob2QgIT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnTk9UIEEgTUVUSE9EJywgaGFuZGxlck5hbWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIElmIHNlbmRlciBpcyBtaXNzaW5nLCBmYWxsYmFjayB0byB0aGUgZm9ybSBpdHNlbGYgKHNhZmUpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIChtYXliZU1ldGhvZCBhcyAodGhpczogVEZvcm0sIHNlbmRlcjogYW55KSA9PiBhbnkpLmNhbGwoZm9ybSwgc2VuZGVyID8/IGZvcm0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIE5vIGhhbmRsZXIgaGVyZTogdHJ5IGdvaW5nIFwidXBcIiB1c2luZyB5b3VyIGNvbXBvbmVudCB0cmVlIGlmIHBvc3NpYmxlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBuYW1lID0gdDEuZ2V0QXR0cmlidXRlKCdkYXRhLW5hbWUnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGNvbXAgPSBuYW1lID8gZm9ybS5jb21wb25lbnRSZWdpc3RyeS5nZXQobmFtZSkgOiBudWxsO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBQcmVmZXIgeW91ciBWQ0wtbGlrZSBwYXJlbnQgY2hhaW4gd2hlbiBhdmFpbGFibGVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IG5leHQgPSBjb21wPy5wYXJlbnQ/LmVsZW0gPz8gbnVsbDtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gRmFsbGJhY2s6IHN0YW5kYXJkIERPTSBwYXJlbnRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHQxID0gbmV4dCA/PyB0MS5wYXJlbnRFbGVtZW50Py5jbG9zZXN0KCdbZGF0YS1jb21wb25lbnRdJykgPz8gbnVsbDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnRXZlbnQgbm90IGhhbmRsZWQnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdHJ1ZVxuICAgICAgICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgICAgICAgICAqL1xuXG4gICAgICAgIHByb3RlY3RlZCBvbkNyZWF0ZSgpIHtcbiAgICAgICAgICAgICAgICAvL2NvbnN0IGJ0biA9IHRoaXMuY29tcG9uZW50UmVnaXN0cnkuZ2V0KCdidXR0b24yJyk7XG4gICAgICAgICAgICAgICAgY29uc3Qgb25TaG93bk5hbWUgPSB0aGlzLmVsZW0hLmdldEF0dHJpYnV0ZSgnZGF0YS1vbmNyZWF0ZScpO1xuICAgICAgICAgICAgICAgIGlmIChvblNob3duTmFtZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcXVldWVNaWNyb3Rhc2soKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBmbiA9ICh0aGlzIGFzIGFueSlbb25TaG93bk5hbWVdO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAodHlwZW9mIGZuID09PSAnZnVuY3Rpb24nKSBmbi5jYWxsKHRoaXMsIG51bGwsIHRoaXMpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIC8vaWYgKGJ0bikgYnRuLmNvbG9yID0gVENvbG9yLnJnYigwLCAwLCAyNTUpO1xuICAgICAgICB9XG5cbiAgICAgICAgcHJvdGVjdGVkIG9uU2hvd24oKSB7XG4gICAgICAgICAgICAgICAgLy9jb25zdCBidG4gPSB0aGlzLmNvbXBvbmVudFJlZ2lzdHJ5LmdldCgnYnV0dG9uMycpO1xuICAgICAgICAgICAgICAgIC8vaWYgKGJ0bikgYnRuLmNvbG9yID0gVENvbG9yLnJnYigwLCAyNTUsIDI1NSk7XG4gICAgICAgICAgICAgICAgY29uc3Qgb25TaG93bk5hbWUgPSB0aGlzLmVsZW0hLmdldEF0dHJpYnV0ZSgnZGF0YS1vbnNob3duJyk7XG4gICAgICAgICAgICAgICAgaWYgKG9uU2hvd25OYW1lKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBxdWV1ZU1pY3JvdGFzaygoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGZuID0gKHRoaXMgYXMgYW55KVtvblNob3duTmFtZV07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgZm4gPT09ICdmdW5jdGlvbicpIGZuLmNhbGwodGhpcywgbnVsbCwgdGhpcyk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgIH1cbn1cblxuZXhwb3J0IGNsYXNzIFRCdXR0b24gZXh0ZW5kcyBUQ29tcG9uZW50IHtcbiAgICAgICAgcHJpdmF0ZSBfY2FwdGlvbjogc3RyaW5nID0gJyc7XG5cbiAgICAgICAgaHRtbEJ1dHRvbigpOiBIVE1MQnV0dG9uRWxlbWVudCB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuaHRtbEVsZW1lbnQhIGFzIEhUTUxCdXR0b25FbGVtZW50O1xuICAgICAgICB9XG5cbiAgICAgICAgZ2V0IGNhcHRpb24oKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2NhcHRpb247XG4gICAgICAgIH1cbiAgICAgICAgc2V0IGNhcHRpb24oY2FwdGlvbikge1xuICAgICAgICAgICAgICAgIHRoaXMuc2V0Q2FwdGlvbihjYXB0aW9uKTtcbiAgICAgICAgfVxuICAgICAgICBzZXRDYXB0aW9uKHM6IHN0cmluZykge1xuICAgICAgICAgICAgICAgIHRoaXMuX2NhcHRpb24gPSBzO1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLmh0bWxFbGVtZW50KSB0aGlzLmh0bWxFbGVtZW50LnRleHRDb250ZW50ID0gcztcbiAgICAgICAgfVxuXG4gICAgICAgIHByaXZhdGUgX2VuYWJsZWQ6IGJvb2xlYW4gPSB0cnVlO1xuICAgICAgICBnZXQgZW5hYmxlZCgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5fZW5hYmxlZDtcbiAgICAgICAgfVxuICAgICAgICBzZXQgZW5hYmxlZChlbmFibGVkKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5zZXRFbmFibGVkKGVuYWJsZWQpO1xuICAgICAgICB9XG4gICAgICAgIHNldEVuYWJsZWQoZW5hYmxlZDogYm9vbGVhbikge1xuICAgICAgICAgICAgICAgIHRoaXMuX2VuYWJsZWQgPSBlbmFibGVkO1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLmh0bWxFbGVtZW50KSB0aGlzLmh0bWxCdXR0b24oKS5kaXNhYmxlZCA9ICFlbmFibGVkO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3RydWN0b3IobmFtZTogc3RyaW5nLCBmb3JtOiBURm9ybSwgcGFyZW50OiBUQ29tcG9uZW50KSB7XG4gICAgICAgICAgICAgICAgc3VwZXIoVE1ldGFCdXR0b24ubWV0YUNsYXNzLCBuYW1lLCBmb3JtLCBwYXJlbnQpO1xuICAgICAgICAgICAgICAgIC8vc3VwZXIobmFtZSwgZm9ybSwgcGFyZW50KTtcbiAgICAgICAgICAgICAgICAvL3RoaXMubmFtZSA9IG5hbWU7XG4gICAgICAgICAgICAgICAgLy90aGlzLmZvcm0gPSBmb3JtO1xuICAgICAgICAgICAgICAgIC8vdGhpcy5wYXJlbnQgPSBwYXJlbnQ7XG4gICAgICAgIH1cbn1cblxuZXhwb3J0IGNsYXNzIFRNZXRhQnV0dG9uIGV4dGVuZHMgVE1ldGFDb21wb25lbnQ8VEJ1dHRvbj4ge1xuICAgICAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgICAgICAgICBzdXBlcigpO1xuICAgICAgICB9XG4gICAgICAgIHN0YXRpYyBtZXRhQ2xhc3M6IFRNZXRhQnV0dG9uID0gbmV3IFRNZXRhQnV0dG9uKCk7XG4gICAgICAgIGdldE1ldGFDbGFzcygpOiBUTWV0YUJ1dHRvbiB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIFRNZXRhQnV0dG9uLm1ldGFDbGFzcztcbiAgICAgICAgfVxuICAgICAgICByZWFkb25seSB0eXBlTmFtZSA9ICdUQnV0dG9uJztcblxuICAgICAgICBjcmVhdGUobmFtZTogc3RyaW5nLCBmb3JtOiBURm9ybSwgcGFyZW50OiBUQ29tcG9uZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBUQnV0dG9uKG5hbWUsIGZvcm0sIHBhcmVudCk7XG4gICAgICAgIH1cblxuICAgICAgICBwcm9wcygpOiBQcm9wU3BlYzxUQnV0dG9uPltdIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gW1xuICAgICAgICAgICAgICAgICAgICAgICAgeyBuYW1lOiAnY2FwdGlvbicsIGtpbmQ6ICdzdHJpbmcnLCBhcHBseTogKG8sIHYpID0+IChvLmNhcHRpb24gPSBTdHJpbmcodikpIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICB7IG5hbWU6ICdlbmFibGVkJywga2luZDogJ2Jvb2xlYW4nLCBhcHBseTogKG8sIHYpID0+IChvLmVuYWJsZWQgPSBCb29sZWFuKHYpKSB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgeyBuYW1lOiAnY29sb3InLCBraW5kOiAnY29sb3InLCBhcHBseTogKG8sIHYpID0+IChvLmNvbG9yID0gdiBhcyBhbnkpIH1cbiAgICAgICAgICAgICAgICBdO1xuICAgICAgICB9XG59XG5cbmV4cG9ydCBjbGFzcyBUQXBwbGljYXRpb24ge1xuICAgICAgICBzdGF0aWMgVGhlQXBwbGljYXRpb246IFRBcHBsaWNhdGlvbjtcbiAgICAgICAgLy9zdGF0aWMgcGx1Z2luUmVnaXN0cnkgPSBuZXcgUGx1Z2luUmVnaXN0cnkoKTtcbiAgICAgICAgLy9wbHVnaW5zOiBJUGx1Z2luUmVnaXN0cnk7XG4gICAgICAgIHByaXZhdGUgZm9ybXM6IFRGb3JtW10gPSBbXTtcbiAgICAgICAgcmVhZG9ubHkgdHlwZXMgPSBuZXcgQ29tcG9uZW50VHlwZVJlZ2lzdHJ5KCk7XG4gICAgICAgIG1haW5Gb3JtOiBURm9ybSB8IG51bGwgPSBudWxsO1xuXG4gICAgICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICAgICAgICAgIFRBcHBsaWNhdGlvbi5UaGVBcHBsaWNhdGlvbiA9IHRoaXM7XG4gICAgICAgICAgICAgICAgcmVnaXN0ZXJCdWlsdGlucyh0aGlzLnR5cGVzKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNyZWF0ZUZvcm08VCBleHRlbmRzIFRGb3JtPihjdG9yOiBuZXcgKC4uLmFyZ3M6IGFueVtdKSA9PiBULCBuYW1lOiBzdHJpbmcpOiBUIHtcbiAgICAgICAgICAgICAgICBjb25zdCBmID0gbmV3IGN0b3IobmFtZSk7XG4gICAgICAgICAgICAgICAgdGhpcy5mb3Jtcy5wdXNoKGYpO1xuICAgICAgICAgICAgICAgIGlmICghdGhpcy5tYWluRm9ybSkgdGhpcy5tYWluRm9ybSA9IGY7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGY7XG4gICAgICAgIH1cblxuICAgICAgICBydW4oKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5ydW5XaGVuRG9tUmVhZHkoKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMubWFpbkZvcm0pIHRoaXMubWFpbkZvcm0uc2hvdygpO1xuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSB0aGlzLmF1dG9TdGFydCgpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgcHJvdGVjdGVkIGF1dG9TdGFydCgpIHtcbiAgICAgICAgICAgICAgICAvLyBmYWxsYmFjazogY2hvaXNpciB1bmUgZm9ybSBlbnJlZ2lzdHJcdTAwRTllLCBvdSBjclx1MDBFOWVyIHVuZSBmb3JtIGltcGxpY2l0ZVxuICAgICAgICB9XG5cbiAgICAgICAgcnVuV2hlbkRvbVJlYWR5KGZuOiAoKSA9PiB2b2lkKSB7XG4gICAgICAgICAgICAgICAgaWYgKGRvY3VtZW50LnJlYWR5U3RhdGUgPT09ICdsb2FkaW5nJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ0RPTUNvbnRlbnRMb2FkZWQnLCBmbiwgeyBvbmNlOiB0cnVlIH0pO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBmbigpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgfVxufVxuXG4vKlxuXG5leHBvcnQgY2xhc3MgVnVlQ29tcG9uZW50IGV4dGVuZHMgVENvbXBvbmVudCB7fVxuXG5leHBvcnQgY2xhc3MgUmVhY3RDb21wb25lbnQgZXh0ZW5kcyBUQ29tcG9uZW50IHt9XG5cbmV4cG9ydCBjbGFzcyBTdmVsdGVDb21wb25lbnQgZXh0ZW5kcyBUQ29tcG9uZW50IHt9XG5cbmV4cG9ydCBjbGFzcyBQbHVnaW5Ib3N0PFByb3BzIGV4dGVuZHMgSnNvbiA9IEpzb24+IGV4dGVuZHMgVENvbXBvbmVudCB7XG4gICAgICAgIHByaXZhdGUgcGx1Z2luOiBQbHVnaW48UHJvcHM+O1xuICAgICAgICBwcml2YXRlIHNlcnZpY2VzOiBEZWxwaGluZVNlcnZpY2VzO1xuICAgICAgICBwcml2YXRlIG1vdW50ZWQgPSBmYWxzZTtcblxuICAgICAgICBjb25zdHJ1Y3RvcihwbHVnaW46IFVJUGx1Z2luPFByb3BzPiwgc2VydmljZXM6IERlbHBoaW5lU2VydmljZXMpIHtcbiAgICAgICAgICAgICAgICBzdXBlcigndG90bycsIG51bGwsIG51bGwpO1xuICAgICAgICAgICAgICAgIHRoaXMucGx1Z2luID0gcGx1Z2luO1xuICAgICAgICAgICAgICAgIHRoaXMuc2VydmljZXMgPSBzZXJ2aWNlcztcbiAgICAgICAgfVxuXG4gICAgICAgIG1vdW50KHByb3BzOiBQcm9wcykge1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLm1vdW50ZWQpIHRocm93IG5ldyBFcnJvcignUGx1Z2luIGFscmVhZHkgbW91bnRlZCcpO1xuICAgICAgICAgICAgICAgIC8vdGhpcy5wbHVnaW4ubW91bnQodGhpcy5odG1sRWxlbWVudCwgcHJvcHMsIHRoaXMuc2VydmljZXMpO1xuICAgICAgICAgICAgICAgIHRoaXMubW91bnRlZCA9IHRydWU7XG4gICAgICAgIH1cblxuICAgICAgICB1cGRhdGUocHJvcHM6IFByb3BzKSB7XG4gICAgICAgICAgICAgICAgaWYgKCF0aGlzLm1vdW50ZWQpIHRocm93IG5ldyBFcnJvcignUGx1Z2luIG5vdCBtb3VudGVkJyk7XG4gICAgICAgICAgICAgICAgdGhpcy5wbHVnaW4udXBkYXRlKHByb3BzKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHVubW91bnQoKSB7XG4gICAgICAgICAgICAgICAgaWYgKCF0aGlzLm1vdW50ZWQpIHJldHVybjtcbiAgICAgICAgICAgICAgICB0aGlzLnBsdWdpbi51bm1vdW50KCk7XG4gICAgICAgICAgICAgICAgdGhpcy5tb3VudGVkID0gZmFsc2U7XG4gICAgICAgIH1cbn1cbiAgICAgICAgKi9cblxuZXhwb3J0IGNsYXNzIFRNZXRhUGx1Z2luSG9zdCBleHRlbmRzIFRNZXRhQ29tcG9uZW50PFRQbHVnaW5Ib3N0PiB7XG4gICAgICAgIHN0YXRpYyBtZXRhQ2xhc3MgPSBuZXcgVE1ldGFQbHVnaW5Ib3N0KCk7XG4gICAgICAgIGdldE1ldGFDbGFzcygpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gVE1ldGFQbHVnaW5Ib3N0Lm1ldGFDbGFzcztcbiAgICAgICAgfVxuICAgICAgICByZWFkb25seSB0eXBlTmFtZSA9ICdUUGx1Z2luSG9zdCc7XG5cbiAgICAgICAgY3JlYXRlKG5hbWU6IHN0cmluZywgZm9ybTogVEZvcm0sIHBhcmVudDogVENvbXBvbmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBuZXcgVFBsdWdpbkhvc3QobmFtZSwgZm9ybSwgcGFyZW50KTtcbiAgICAgICAgfVxuXG4gICAgICAgIHByb3BzKCk6IFByb3BTcGVjPFRQbHVnaW5Ib3N0PltdIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gW107XG4gICAgICAgIH1cbn1cblxuZXhwb3J0IGNsYXNzIFRQbHVnaW5Ib3N0IGV4dGVuZHMgVENvbXBvbmVudCB7XG4gICAgICAgIHByaXZhdGUgaW5zdGFuY2U6IFVJUGx1Z2luSW5zdGFuY2UgfCBudWxsID0gbnVsbDtcblxuICAgICAgICBwbHVnaW5OYW1lOiBzdHJpbmcgfCBudWxsID0gbnVsbDtcbiAgICAgICAgcGx1Z2luUHJvcHM6IEpzb24gPSB7fTtcbiAgICAgICAgcHJpdmF0ZSBmYWN0b3J5OiBVSVBsdWdpbkZhY3RvcnkgfCBudWxsID0gbnVsbDtcblxuICAgICAgICBjb25zdHJ1Y3RvcihuYW1lOiBzdHJpbmcsIGZvcm06IFRGb3JtLCBwYXJlbnQ6IFRDb21wb25lbnQpIHtcbiAgICAgICAgICAgICAgICBzdXBlcihUTWV0YVBsdWdpbkhvc3QubWV0YUNsYXNzLCBuYW1lLCBmb3JtLCBwYXJlbnQpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gQ2FsbGVkIGJ5IHRoZSBtZXRhY2xhc3MgKG9yIGJ5IHlvdXIgcmVnaXN0cnkpIHJpZ2h0IGFmdGVyIGNyZWF0aW9uXG4gICAgICAgIHNldFBsdWdpbkZhY3RvcnkoZmFjdG9yeTogVUlQbHVnaW5GYWN0b3J5KSB7XG4gICAgICAgICAgICAgICAgdGhpcy5mYWN0b3J5ID0gZmFjdG9yeTtcbiAgICAgICAgfVxuXG4gICAgICAgIG1vdW50UGx1Z2luKHByb3BzOiBKc29uLCBzZXJ2aWNlczogRGVscGhpbmVTZXJ2aWNlcykge1xuICAgICAgICAgICAgICAgIGNvbnN0IGNvbnRhaW5lciA9IHRoaXMuaHRtbEVsZW1lbnQ7XG4gICAgICAgICAgICAgICAgaWYgKCFjb250YWluZXIpIHJldHVybjtcblxuICAgICAgICAgICAgICAgIGlmICghdGhpcy5mYWN0b3J5KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzZXJ2aWNlcy5sb2cud2FybignVFBsdWdpbkhvc3Q6IG5vIHBsdWdpbiBmYWN0b3J5IHNldCcsIHsgaG9zdDogdGhpcy5uYW1lIGFzIGFueSB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvLyBEaXNwb3NlIG9sZCBpbnN0YW5jZSBpZiBhbnlcbiAgICAgICAgICAgICAgICB0aGlzLnVubW91bnQoKTtcblxuICAgICAgICAgICAgICAgIC8vIENyZWF0ZSBwbHVnaW4gaW5zdGFuY2UgdGhlbiBtb3VudFxuICAgICAgICAgICAgICAgIHRoaXMuaW5zdGFuY2UgPSB0aGlzLmZhY3RvcnkoeyBob3N0OiB0aGlzLCBmb3JtOiB0aGlzLmZvcm0hIH0pO1xuICAgICAgICAgICAgICAgIHRoaXMuaW5zdGFuY2UhLm1vdW50KGNvbnRhaW5lciwgcHJvcHMsIHNlcnZpY2VzKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIENhbGxlZCBieSBidWlsZENvbXBvbmVudFRyZWUoKVxuICAgICAgICBzZXRQbHVnaW5TcGVjKHNwZWM6IHsgcGx1Z2luOiBzdHJpbmcgfCBudWxsOyBwcm9wczogYW55IH0pIHtcbiAgICAgICAgICAgICAgICB0aGlzLnBsdWdpbk5hbWUgPSBzcGVjLnBsdWdpbjtcbiAgICAgICAgICAgICAgICB0aGlzLnBsdWdpblByb3BzID0gc3BlYy5wcm9wcyA/PyB7fTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIENhbGxlZCBieSBidWlsZENvbXBvbmVudFRyZWUoKVxuICAgICAgICBtb3VudFBsdWdpbklmUmVhZHkoc2VydmljZXM6IERlbHBoaW5lU2VydmljZXMpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBjb250YWluZXIgPSB0aGlzLmh0bWxFbGVtZW50O1xuICAgICAgICAgICAgICAgIGlmICghY29udGFpbmVyIHx8ICF0aGlzLmZvcm0gfHwgIXRoaXMucGx1Z2luTmFtZSkgcmV0dXJuO1xuXG4gICAgICAgICAgICAgICAgY29uc3QgYXBwID0gVEFwcGxpY2F0aW9uLlRoZUFwcGxpY2F0aW9uOyAvLyBvdSB1biBhY2NcdTAwRThzIFx1MDBFOXF1aXZhbGVudFxuICAgICAgICAgICAgICAgIGNvbnN0IGRlZiA9IFBsdWdpblJlZ2lzdHJ5LnBsdWdpblJlZ2lzdHJ5LmdldCh0aGlzLnBsdWdpbk5hbWUpO1xuXG4gICAgICAgICAgICAgICAgaWYgKCFkZWYpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlcnZpY2VzLmxvZy53YXJuKCdVbmtub3duIHBsdWdpbicsIHsgcGx1Z2luOiB0aGlzLnBsdWdpbk5hbWUgYXMgYW55IH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHRoaXMudW5tb3VudCgpO1xuICAgICAgICAgICAgICAgIHRoaXMuaW5zdGFuY2UgPSBkZWYuZmFjdG9yeSh7IGhvc3Q6IHRoaXMsIGZvcm06IHRoaXMuZm9ybSB9KTtcbiAgICAgICAgICAgICAgICB0aGlzLmluc3RhbmNlIS5tb3VudChjb250YWluZXIsIHRoaXMucGx1Z2luUHJvcHMsIHNlcnZpY2VzKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHVwZGF0ZShwcm9wczogYW55KSB7XG4gICAgICAgICAgICAgICAgdGhpcy5wbHVnaW5Qcm9wcyA9IHByb3BzO1xuICAgICAgICAgICAgICAgIHRoaXMuaW5zdGFuY2U/LnVwZGF0ZShwcm9wcyk7XG4gICAgICAgIH1cblxuICAgICAgICB1bm1vdW50KCkge1xuICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmluc3RhbmNlPy51bm1vdW50KCk7XG4gICAgICAgICAgICAgICAgfSBmaW5hbGx5IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuaW5zdGFuY2UgPSBudWxsO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgfVxufVxuXG5leHBvcnQgdHlwZSBVSVBsdWdpbkZhY3Rvcnk8UHJvcHMgZXh0ZW5kcyBKc29uID0gSnNvbj4gPSAoYXJnczogeyBob3N0OiBUUGx1Z2luSG9zdDsgZm9ybTogVEZvcm0gfSkgPT4gVUlQbHVnaW5JbnN0YW5jZTxQcm9wcz47XG5cbmV4cG9ydCBpbnRlcmZhY2UgU2l6ZUhpbnRzIHtcbiAgICAgICAgbWluV2lkdGg/OiBudW1iZXI7XG4gICAgICAgIG1pbkhlaWdodD86IG51bWJlcjtcbiAgICAgICAgcHJlZmVycmVkV2lkdGg/OiBudW1iZXI7XG4gICAgICAgIHByZWZlcnJlZEhlaWdodD86IG51bWJlcjtcbn1cblxuZXhwb3J0IHR5cGUgVUlQbHVnaW5EZWYgPSB7XG4gICAgICAgIGZhY3Rvcnk6IFVJUGx1Z2luRmFjdG9yeTtcbiAgICAgICAgLy8gb3B0aW9ubmVsIDogdW4gc2NoXHUwMEU5bWEgZGUgcHJvcHMsIGFpZGUgYXUgZGVzaWduZXJcbiAgICAgICAgLy8gcHJvcHM/OiBQcm9wU2NoZW1hO1xufTtcblxuZXhwb3J0IGNsYXNzIFBsdWdpblJlZ2lzdHJ5IHtcbiAgICAgICAgc3RhdGljIHBsdWdpblJlZ2lzdHJ5ID0gbmV3IFBsdWdpblJlZ2lzdHJ5KCk7XG4gICAgICAgIHByaXZhdGUgcmVhZG9ubHkgcGx1Z2lucyA9IG5ldyBNYXA8c3RyaW5nLCBVSVBsdWdpbkRlZj4oKTtcblxuICAgICAgICByZWdpc3RlcihuYW1lOiBzdHJpbmcsIGRlZjogVUlQbHVnaW5EZWYpIHtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5wbHVnaW5zLmhhcyhuYW1lKSkgdGhyb3cgbmV3IEVycm9yKGBQbHVnaW4gYWxyZWFkeSByZWdpc3RlcmVkOiAke25hbWV9YCk7XG4gICAgICAgICAgICAgICAgdGhpcy5wbHVnaW5zLnNldChuYW1lLCBkZWYpO1xuICAgICAgICB9XG5cbiAgICAgICAgZ2V0KG5hbWU6IHN0cmluZyk6IFVJUGx1Z2luRGVmIHwgdW5kZWZpbmVkIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5wbHVnaW5zLmdldChuYW1lKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGhhcyhuYW1lOiBzdHJpbmcpOiBib29sZWFuIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5wbHVnaW5zLmhhcyhuYW1lKTtcbiAgICAgICAgfVxufVxuIiwgImV4cG9ydCBjbGFzcyBNZXRhUm9vdCB7XG4gICAgICAgIHN0YXRpYyByZWFkb25seSBtZXRhY2xhc3M6IE1ldGFSb290ID0gbmV3IE1ldGFSb290KG51bGwpO1xuXG4gICAgICAgIHJlYWRvbmx5IHN1cGVyQ2xhc3M6IE1ldGFSb290IHwgbnVsbDtcbiAgICAgICAgcmVhZG9ubHkgdHlwZU5hbWU6IHN0cmluZztcblxuICAgICAgICBwcm90ZWN0ZWQgY29uc3RydWN0b3Ioc3VwZXJDbGFzczogTWV0YVJvb3QgfCBudWxsLCB0eXBlTmFtZSA9ICdUTWV0YVJvb3QnKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5zdXBlckNsYXNzID0gc3VwZXJDbGFzcztcbiAgICAgICAgICAgICAgICB0aGlzLnR5cGVOYW1lID0gdHlwZU5hbWU7XG4gICAgICAgIH1cbiAgICAgICAgZ2V0TWV0YWNsYXNzKCk6IE1ldGFSb290IHtcbiAgICAgICAgICAgICAgICByZXR1cm4gTWV0YVJvb3QubWV0YWNsYXNzO1xuICAgICAgICB9XG59XG5cbmV4cG9ydCBjbGFzcyBNZXRhVGVzdEEgZXh0ZW5kcyBNZXRhUm9vdCB7XG4gICAgICAgIHN0YXRpYyByZWFkb25seSBtZXRhY2xhc3M6IE1ldGFUZXN0QSA9IG5ldyBNZXRhVGVzdEEoTWV0YVJvb3QubWV0YWNsYXNzKTtcblxuICAgICAgICBwcm90ZWN0ZWQgY29uc3RydWN0b3Ioc3VwZXJDbGFzczogTWV0YVJvb3QpIHtcbiAgICAgICAgICAgICAgICBzdXBlcihzdXBlckNsYXNzLCAnVGVzdEEnKTtcbiAgICAgICAgfVxuICAgICAgICBnZXRNZXRhY2xhc3MoKTogTWV0YVRlc3RBIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gTWV0YVRlc3RBLm1ldGFjbGFzcztcbiAgICAgICAgfVxufVxuXG5leHBvcnQgY2xhc3MgTWV0YVRlc3RCIGV4dGVuZHMgTWV0YVRlc3RBIHtcbiAgICAgICAgc3RhdGljIHJlYWRvbmx5IG1ldGFjbGFzczogTWV0YVRlc3RCID0gbmV3IE1ldGFUZXN0QihNZXRhVGVzdEEubWV0YWNsYXNzKTtcblxuICAgICAgICBwcm90ZWN0ZWQgY29uc3RydWN0b3Ioc3VwZXJDbGFzczogTWV0YVRlc3RBKSB7XG4gICAgICAgICAgICAgICAgc3VwZXIoc3VwZXJDbGFzcyk7XG4gICAgICAgICAgICAgICAgLy8gZXQgdm91cyBjaGFuZ2V6IGp1c3RlIGxlIG5vbSA6XG4gICAgICAgICAgICAgICAgKHRoaXMgYXMgYW55KS50eXBlTmFtZSA9ICdUZXN0Qic7XG4gICAgICAgIH1cbiAgICAgICAgZ2V0TWV0YWNsYXNzKCk6IE1ldGFUZXN0QiB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIE1ldGFUZXN0Qi5tZXRhY2xhc3M7XG4gICAgICAgIH1cbn1cblxuZXhwb3J0IGNsYXNzIE1ldGFUZXN0QyBleHRlbmRzIE1ldGFUZXN0QiB7XG4gICAgICAgIHN0YXRpYyByZWFkb25seSBtZXRhY2xhc3M6IE1ldGFUZXN0QyA9IG5ldyBNZXRhVGVzdEMoTWV0YVRlc3RCLm1ldGFjbGFzcyk7XG5cbiAgICAgICAgcHJvdGVjdGVkIGNvbnN0cnVjdG9yKHN1cGVyQ2xhc3M6IE1ldGFUZXN0Qikge1xuICAgICAgICAgICAgICAgIHN1cGVyKHN1cGVyQ2xhc3MpO1xuICAgICAgICAgICAgICAgICh0aGlzIGFzIGFueSkudHlwZU5hbWUgPSAnVGVzdEMnO1xuICAgICAgICB9XG5cbiAgICAgICAgZ2V0TWV0YWNsYXNzKCk6IE1ldGFUZXN0QyB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIE1ldGFUZXN0Qy5tZXRhY2xhc3M7XG4gICAgICAgIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHRlc3QoKSB7XG4gICAgICAgIGxldCBjOiBNZXRhUm9vdCB8IG51bGwgPSBNZXRhVGVzdEMubWV0YWNsYXNzO1xuICAgICAgICB3aGlsZSAoYykge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGAke2MuZ2V0TWV0YWNsYXNzKCkudHlwZU5hbWV9IC0gJHtjLnR5cGVOYW1lfSAtPiAke2Muc3VwZXJDbGFzcz8udHlwZU5hbWV9YCk7XG4gICAgICAgICAgICAgICAgYyA9IGMuc3VwZXJDbGFzcztcbiAgICAgICAgfVxufVxuIiwgIi8vLyA8cmVmZXJlbmNlIGxpYj1cImRvbVwiIC8+XG5jb25zb2xlLmxvZygnSSBBTSBaQVpBJyk7XG4vL2ltcG9ydCB7IGluc3RhbGxEZWxwaGluZVJ1bnRpbWUgfSBmcm9tIFwiLi9zcmMvZHJ0XCI7IC8vIDwtLSBUUywgcGFzIC5qc1xuaW1wb3J0IHsgVEZvcm0sIFRDb2xvciwgVEFwcGxpY2F0aW9uLCBUQ29tcG9uZW50LCBUQnV0dG9uIH0gZnJvbSAnQHZjbCc7XG5pbXBvcnQgeyB0ZXN0IH0gZnJvbSAnLi90ZXN0JztcblxuLy9pbXBvcnQgeyBDb21wb25lbnRUeXBlUmVnaXN0cnkgfSBmcm9tICdAdmNsL1N0ZEN0cmxzJztcbi8vaW1wb3J0IHsgQ29tcG9uZW50UmVnaXN0cnkgfSBmcm9tICdAZHJ0L0NvbXBvbmVudFJlZ2lzdHJ5Jztcbi8vaW1wb3J0IHsgVFBsdWdpbkhvc3QgfSBmcm9tICdAZHJ0L1VJUGx1Z2luJztcbi8qXG5leHBvcnQgZnVuY3Rpb24gcmVnaXN0ZXJQbHVnaW5UeXBlcyhyZWc6IENvbXBvbmVudFR5cGVSZWdpc3RyeSk6IHZvaWQge1xuICAgICAgICAvICpcbiAgICAgICAgLy8gRXhhbXBsZTogYW55IHR5cGUgbmFtZSBjYW4gYmUgcHJvdmlkZWQgYnkgYSBwbHVnaW4uXG4gICAgICAgIHJlZy5yZWdpc3Rlci5yZWdpc3RlclR5cGUoJ2NoYXJ0anMtcGllJywgKG5hbWU6IHN0cmluZywgZm9ybTogVEZvcm0sIHBhcmVudDogVENvbXBvbmVudCkgPT4ge1xuICAgICAgICAgICAgICAgIHJldHVybiBuZXcgUGx1Z2luSG9zdChuYW1lLCBmb3JtLCBwYXJlbnQpO1xuICAgICAgICB9KTtcblxuICAgICAgICByZWcucmVnaXN0ZXJUeXBlKCd2dWUtaGVsbG8nLCAobmFtZTogc3RyaW5nLCBmb3JtOiBURm9ybSwgcGFyZW50OiBUQ29tcG9uZW50KSA9PiB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBQbHVnaW5Ib3N0KG5hbWUsIGZvcm0sIHBhcmVudCk7XG4gICAgICAgIH0pO1xuICAgICAgICAqIC9cbn1cbiovXG5jb25zb2xlLmxvZygnSSBBTSBaQVpBJyk7XG5cbmNsYXNzIFphemEgZXh0ZW5kcyBURm9ybSB7XG4gICAgICAgIC8vIEZvcm0gY29tcG9uZW50cyAtIFRoaXMgbGlzdCBpcyBhdXRvIGdlbmVyYXRlZCBieSBEZWxwaGluZVxuICAgICAgICAvLyAtLS0tLS0tLS0tLS0tLS1cbiAgICAgICAgLy9idXR0b24xIDogVEJ1dHRvbiA9IG5ldyBUQnV0dG9uKFwiYnV0dG9uMVwiLCB0aGlzLCB0aGlzKTtcbiAgICAgICAgLy9idXR0b24yIDogVEJ1dHRvbiA9IG5ldyBUQnV0dG9uKFwiYnV0dG9uMlwiLCB0aGlzLCB0aGlzKTtcbiAgICAgICAgLy9idXR0b24zIDogVEJ1dHRvbiA9IG5ldyBUQnV0dG9uKFwiYnV0dG9uM1wiLCB0aGlzLCB0aGlzKTtcbiAgICAgICAgLy8gLS0tLS0tLS0tLS0tLS0tXG5cbiAgICAgICAgY29uc3RydWN0b3IobmFtZTogc3RyaW5nKSB7XG4gICAgICAgICAgICAgICAgc3VwZXIobmFtZSk7XG4gICAgICAgIH1cbiAgICAgICAgLy9pbXBvcnQgeyBpbnN0YWxsRGVscGhpbmVSdW50aW1lIH0gZnJvbSBcIi4vZHJ0XCI7XG5cbiAgICAgICAgLypcbmNvbnN0IHJ1bnRpbWUgPSB7ICAgXG4gIGhhbmRsZUNsaWNrKHsgZWxlbWVudCB9OiB7IGVsZW1lbnQ6IEVsZW1lbnQgfSkge1xuICAgIGNvbnNvbGUubG9nKFwiY2xpY2tlZCFcIiwgZWxlbWVudCk7XG4gICAgLy8oZWxlbWVudCBhcyBIVE1MRWxlbWVudCkuc3R5bGUuYmFja2dyb3VuZENvbG9yID0gXCJyZWRcIjtcbiAgfSxcbn07IFxuKi9cblxuICAgICAgICBwcm90ZWN0ZWQgb25NeUNyZWF0ZShfZXY6IEV2ZW50IHwgbnVsbCwgX3NlbmRlcjogVENvbXBvbmVudCkge1xuICAgICAgICAgICAgICAgIGNvbnN0IGJ0biA9IHRoaXMuY29tcG9uZW50UmVnaXN0cnkuZ2V0KCdidXR0b24yJyk7XG4gICAgICAgICAgICAgICAgaWYgKGJ0bikgYnRuLmNvbG9yID0gVENvbG9yLnJnYigwLCAwLCAyNTUpO1xuICAgICAgICB9XG5cbiAgICAgICAgcHJvdGVjdGVkIG9uTXlTaG93bihfZXY6IEV2ZW50IHwgbnVsbCwgX3NlbmRlcjogVENvbXBvbmVudCkge1xuICAgICAgICAgICAgICAgIGNvbnN0IGJ0biA9IHRoaXMuY29tcG9uZW50UmVnaXN0cnkuZ2V0KCdidXR0b24zJyk7XG4gICAgICAgICAgICAgICAgaWYgKGJ0bikgYnRuLmNvbG9yID0gVENvbG9yLnJnYigwLCAyNTUsIDI1NSk7XG4gICAgICAgIH1cblxuICAgICAgICBidXR0b24xX29uY2xpY2soX2V2OiBFdmVudCB8IG51bGwsIF9zZW5kZXI6IFRDb21wb25lbnQpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBidG4gPSB0aGlzLmNvbXBvbmVudFJlZ2lzdHJ5LmdldDxUQnV0dG9uPignYnV0dG9uMScpO1xuICAgICAgICAgICAgICAgIGlmICghYnRuKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oJ2J1dHRvbjEgbm90IGZvdW5kIGluIHJlZ2lzdHJ5Jyk7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIC8vYnRuLmNvbG9yID0gVENvbG9yLnJnYigwLCAwLCAyNTUpO1xuICAgICAgICAgICAgICAgIGJ0biEuY29sb3IgPSBUQ29sb3IucmdiKDI1NSwgMCwgMCk7XG4gICAgICAgICAgICAgICAgYnRuIS5zZXRDYXB0aW9uKCdNSU1JJyk7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ0J1dHRvbjEgY2xpY2tlZCEhISEnKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHphemFfb25jbGljayhfZXY6IEV2ZW50IHwgbnVsbCwgX3NlbmRlcjogVENvbXBvbmVudCkge1xuICAgICAgICAgICAgICAgIGNvbnN0IGJ0biA9IHRoaXMuY29tcG9uZW50UmVnaXN0cnkuZ2V0PFRCdXR0b24+KCdidXR0b254Jyk7XG4gICAgICAgICAgICAgICAgYnRuIS5jb2xvciA9IFRDb2xvci5yZ2IoMCwgMjU1LCAwKTtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnemF6YSBjbGlja2VkISEhIScpO1xuICAgICAgICAgICAgICAgIC8vYnRuIS5lbmFibGVkID0gZmFsc2U7XG4gICAgICAgIH1cblxuICAgICAgICAvL2luc3RhbGxEZWxwaGluZVJ1bnRpbWUocnVudGltZSk7XG59IC8vIGNsYXNzIHphemFcblxuY2xhc3MgTXlBcHBsaWNhdGlvbiBleHRlbmRzIFRBcHBsaWNhdGlvbiB7XG4gICAgICAgIHphemE6IFphemE7XG5cbiAgICAgICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgICAgICAgICAgc3VwZXIoKTtcbiAgICAgICAgICAgICAgICB0aGlzLnphemEgPSBuZXcgWmF6YSgnemF6YScpO1xuICAgICAgICAgICAgICAgIHRoaXMubWFpbkZvcm0gPSB0aGlzLnphemE7XG4gICAgICAgIH1cblxuICAgICAgICBydW4oKSB7XG4gICAgICAgICAgICAgICAgLy90aGlzLnphemEuY29tcG9uZW50UmVnaXN0cnkuYnVpbGRDb21wb25lbnRUcmVlKHRoaXMuemF6YSk7XG4gICAgICAgICAgICAgICAgLy90aGlzLnphemEuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snKTtcblxuICAgICAgICAgICAgICAgIC8vIGF1IGxhbmNlbWVudFxuICAgICAgICAgICAgICAgIHRoaXMucnVuV2hlbkRvbVJlYWR5KCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuemF6YS5zaG93KCk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbn0gLy8gY2xhc3MgTXlBcHBsaWNhdGlvblxuXG5jb25zdCBteUFwcGxpY2F0aW9uOiBNeUFwcGxpY2F0aW9uID0gbmV3IE15QXBwbGljYXRpb24oKTtcbnRlc3QoKTtcbm15QXBwbGljYXRpb24ucnVuKCk7XG4iXSwKICAibWFwcGluZ3MiOiAiOzs7OztBQU9PLFNBQVMsaUJBQWlCLE9BQThCO0FBQ3ZELFFBQU0sU0FBUyxZQUFZLFNBQVM7QUFDcEMsUUFBTSxTQUFTLGdCQUFnQixTQUFTO0FBR2hEOzs7QUMwRU8sSUFBZSxhQUFmLE1BQTJEO0FBQUEsRUFLMUQsY0FBYztBQUpkLHdCQUFTLFlBQW1CO0FBQUEsRUFJYjtBQUV2QjtBQUxRLGNBRmMsWUFFUDtBQXVCUixJQUFlQSxrQkFBZixjQUE0RCxXQUFXO0FBQUE7QUFBQTtBQUFBLEVBS3RFLGNBQWM7QUFDTixVQUFNO0FBQUEsRUFDZDtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQVNBLE9BQU8sTUFBYyxNQUFhLFFBQW9CO0FBQzlDLFdBQU8sSUFBSUMsWUFBVyxLQUFLLGFBQWEsR0FBRyxNQUFNLE1BQU0sTUFBTTtBQUFBLEVBQ3JFO0FBQUE7QUFBQSxFQUdBLFFBQXVCO0FBQ2YsV0FBTyxDQUFDO0FBQUEsRUFDaEI7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBb0JSO0FBS08sSUFBTUMseUJBQU4sTUFBNEI7QUFBQSxFQUE1QjtBQUVDO0FBQUEsd0JBQWlCLFdBQVUsb0JBQUksSUFBd0M7QUFBQTtBQUFBLEVBRXZFLFNBQVMsTUFBMkI7QUFDNUIsUUFBSSxLQUFLLFFBQVEsSUFBSSxLQUFLLFFBQVEsR0FBRztBQUM3QixZQUFNLElBQUksTUFBTSxzQ0FBc0MsS0FBSyxRQUFRLEVBQUU7QUFBQSxJQUM3RTtBQUNBLFNBQUssUUFBUSxJQUFJLEtBQUss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SyxHQUFHLENBQUM7QUFDakMsUUFBSyxXQUFXLE1BQU07QUFDdEIsWUFBUSxJQUFJLHFCQUFxQjtBQUFBLEVBQ3pDO0FBQUEsRUFFQSxhQUFhLEtBQW1CLFNBQXFCO0FBQzdDLFVBQU0sTUFBTSxLQUFLLGtCQUFrQixJQUFhLFNBQVM7QUFDekQsUUFBSyxRQUFRLE9BQU8sSUFBSSxHQUFHLEtBQUssQ0FBQztBQUNqQyxZQUFRLElBQUksa0JBQWtCO0FBQUEsRUFFdEM7QUFBQTtBQUdSO0FBRUEsSUFBTSxnQkFBTixjQUE0QixhQUFhO0FBQUEsRUFHakMsY0FBYztBQUNOLFVBQU07QUFIZDtBQUlRLFNBQUssT0FBTyxJQUFJLEtBQUssTUFBTTtBQUMzQixTQUFLLFdBQVcsS0FBSztBQUFBLEVBQzdCO0FBQUEsRUFFQSxNQUFNO0FBS0UsU0FBSyxnQkFBZ0IsTUFBTTtBQUNuQixXQUFLLEtBQUssS0FBSztBQUFBLElBQ3ZCLENBQUM7QUFBQSxFQUNUO0FBQ1I7QUFFQSxJQUFNLGdCQUErQixJQUFJLGNBQWM7QUFDdkQsS0FBSztBQUNMLGNBQWMsSUFBSTsiLAogICJuYW1lcyI6IFsiVE1ldGFDb21wb25lbnQiLCAiVENvbXBvbmVudCIsICJDb21wb25lbnRUeXBlUmVnaXN0cnkiLCAiVEZvcm0iLCAiVEJ1dHRvbiIsICJURm9ybSJdCn0K
