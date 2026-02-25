var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);

// src/vcl/registerVcl.ts
function registerBuiltins(types) {
  types.register(TMetaButton.metaclass);
  types.register(TMetaPluginHost.metaClass);
}

// src/vcl/StdCtrls.ts
var TMetaclass = class {
  constructor(superClass, typeName = "TMetaclass") {
    __publicField(this, "typeName", "TMetaclass");
    __publicField(this, "superClass", null);
    this.superClass = superClass;
    this.typeName = typeName;
  }
};
__publicField(TMetaclass, "metaclass");
var TObject = class {
  getMetaClass() {
    return TMetaObject.metaClass;
  }
};
var _TMetaObject = class _TMetaObject extends TMetaclass {
  getMetaclass() {
    return _TMetaObject.metaClass;
  }
  constructor(superClass) {
    super(superClass, "TObject");
  }
};
__publicField(_TMetaObject, "metaClass", new _TMetaObject(TMetaclass.metaclass));
var TMetaObject = _TMetaObject;
var _TMetaComponent = class _TMetaComponent extends TMetaclass {
  // The symbolic name used in HTML: data-component="TButton" or "my-button"
  constructor(superClass) {
    super(superClass, "TComponent");
  }
  getMetaclass() {
    return _TMetaComponent.metaclass;
  }
  // Create the runtime instance and attach it to the DOM element.
  create(name, form, parent) {
    return new TComponent2(name, form, parent);
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
      { name: "color", kind: "color", apply: (o, v) => o.color = new TColor(String(v)) },
      { name: "onclick", kind: "handler", apply: (o, v) => o.onclick = new THandler(String(v)) }
      //{ name: 'oncreate', kind: 'handler', apply: (o, v) => (o.oncreate = new THandler(String(v))) }
    ];
  }
  // default [];
};
__publicField(_TMetaComponent, "metaclass", new _TMetaComponent(TMetaclass.metaclass));
var TMetaComponent2 = _TMetaComponent;
var TComponent2 = class {
  constructor(name, form, parent) {
    __publicField(this, "name");
    __publicField(this, "parent", null);
    __publicField(this, "form", null);
    __publicField(this, "children", []);
    __publicField(this, "elem", null);
    this.name = name;
    this.parent = parent;
    parent?.children.push(this);
    this.form = form;
    this.name = name;
  }
  getMetaclass() {
    return TMetaComponent2.metaclass;
  }
  get htmlElement() {
    return this.elem;
  }
  //rawProps: RawProp[] = [];
  /** May contain child components */
  allowsChildren() {
    return false;
  }
  get color() {
    return this.props.color ?? new TColor("default");
  }
  set color(color) {
    this.props.color = color;
    const el = this.htmlElement;
    if (!el) return;
    this.setStyleProp("color", this.color.s);
  }
  get onclick() {
    return this.props.onclick ?? new THandler("");
  }
  set onclick(handler) {
    this.props.onclick = handler;
  }
  syncDomFromProps() {
    const el = this.htmlElement;
    if (!el) return;
    this.setStyleProp("color", this.color.s);
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
var _TMetaComponentTypeRegistry = class _TMetaComponentTypeRegistry extends TMetaObject {
  constructor(superClass) {
    super(superClass);
    this.typeName = "TObject";
  }
  getMetaclass() {
    return _TMetaComponentTypeRegistry.metaclass;
  }
};
__publicField(_TMetaComponentTypeRegistry, "metaclass", new _TMetaComponentTypeRegistry(TMetaObject.metaClass));
var TMetaComponentTypeRegistry = _TMetaComponentTypeRegistry;
var TComponentTypeRegistry2 = class extends TObject {
  constructor() {
    super(...arguments);
    __publicField(this, "classes", /* @__PURE__ */ new Map());
  }
  // We store heterogeneous metas, so we keep them as TMetaComponent<any>.
  getMetaclass() {
    return TMetaComponentTypeRegistry.metaClass;
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
var THandler = class {
  constructor(s) {
    __publicField(this, "s");
    this.s = s;
  }
};
var _TMetaComponentRegistry = class _TMetaComponentRegistry extends TMetaclass {
  constructor(superClass) {
    super(superClass, "TComponentRegistry");
  }
  getMetaclass() {
    return _TMetaComponentRegistry.metaclass;
  }
};
__publicField(_TMetaComponentRegistry, "metaclass", new _TMetaComponentRegistry(TMetaclass.metaclass));
var TMetaComponentRegistry = _TMetaComponentRegistry;
var TComponentRegistry = class extends TObject {
  constructor() {
    super();
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
  getMetaclass() {
    return TMetaComponentRegistry.metaclass;
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
  convert(raw, kind) {
    if (typeof raw === "string") {
      switch (kind) {
        case "string":
          return raw;
        case "number":
          return Number(raw);
        case "boolean":
          return raw === "true" || raw === "1" || raw === "";
        case "color":
          return new TColor(raw);
      }
    }
  }
  // Parse HTML attributes into a plain object
  // This function is called juste once, in buildComponentTree(), after the Form is created.
  parsePropsFromElement(el, defProps) {
    const out = {};
    const raw = el.getAttribute("data-props");
    if (raw) {
      try {
        const r = raw ? JSON.parse(raw) : {};
        for (const spec of defProps) {
          const v = r[spec.name];
          if (v != void 0 && v != null) {
            const value = this.convert(v, spec.kind);
            out[spec.name] = value;
          }
        }
      } catch (e) {
        console.error("Invalid JSON in data-props", raw, e);
      }
    }
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
    const seen = /* @__PURE__ */ new Set();
    let mc = comp;
    while (mc) {
      if (typeof mc.defProps === "function") {
        for (const spec of mc.defProps()) {
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
  // This function is called juste once, in buildComponentTree(), when the form is created
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
      const allDefPropsCollected = this.collectDefProps(cls);
      child.props = this.parsePropsFromElement(el, allDefPropsCollected);
      child.syncDomFromProps();
      child.onAttachedToDom?.();
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
var _TDocument = class _TDocument extends TObject {
  constructor(htmlDoc) {
    super();
    __publicField(this, "htmlDoc");
    this.htmlDoc = htmlDoc;
  }
};
__publicField(_TDocument, "document", new _TDocument(document));
__publicField(_TDocument, "body", document.body);
var TDocument = _TDocument;
var _TMetaDocument = class _TMetaDocument extends TMetaObject {
  constructor(superClass) {
    super(superClass);
    this.typeName = "TestB";
  }
  getMetaclass() {
    return _TMetaDocument.metaclass;
  }
};
__publicField(_TMetaDocument, "metaclass", new _TMetaDocument(TMetaObject.metaclass));
var TMetaDocument = _TMetaDocument;
var _TMetaForm = class _TMetaForm extends TMetaComponent2 {
  getMetaClass() {
    return _TMetaForm.metaclass;
  }
  constructor(superClass) {
    super(superClass);
    this.typeName = "TComponent";
  }
  //readonly typeName = 'TForm';
  create(name, form, parent) {
    return new TForm2(name);
  }
  props() {
    return [];
  }
};
__publicField(_TMetaForm, "metaclass", new _TMetaForm(TMetaComponent2.metaclass));
var TMetaForm = _TMetaForm;
var _TForm = class _TForm extends TComponent2 {
  constructor(name) {
    super(name, null, null);
    __publicField(this, "_mounted", false);
    // Each Form has its own componentRegistry
    __publicField(this, "componentRegistry", new TComponentRegistry());
    __publicField(this, "_ac", null);
    this.form = this;
    _TForm.forms.set(name, this);
  }
  getMetaclass() {
    return TMetaForm.metaclass;
  }
  allowsChildren() {
    return true;
  }
  get application() {
    return this.form?.application ?? TApplication.TheApplication;
  }
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
    for (const type in this.getMetaclass().domEvents) {
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
    return this.bprops.caption ?? "";
  }
  set caption(caption) {
    this.bprops.caption = caption;
    const el = this.htmlElement;
    if (!el) return;
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
    if (!el) return;
    el.textContent = this.caption;
    this.htmlButton().disabled = !this.enabled;
    super.syncDomFromProps();
  }
};
var _TMetaButton = class _TMetaButton extends TMetaComponent2 {
  constructor(superClass) {
    super(superClass);
    __publicField(this, "typeName", "TButton");
    this.typeName = "TButton";
  }
  getMetaclass() {
    return _TMetaButton.metaclass;
  }
  create(name, form, parent) {
    return new TButton2(name, form, parent);
  }
  defProps() {
    return [
      { name: "caption", kind: "string", apply: (o, v) => o.caption = String(v) },
      { name: "enabled", kind: "boolean", apply: (o, v) => o.enabled = Boolean(v) }
    ];
  }
};
__publicField(_TMetaButton, "metaclass", new _TMetaButton(TMetaComponent2.metaclass));
var TMetaButton = _TMetaButton;
var _TMetaApplication = class _TMetaApplication extends TMetaclass {
  constructor(superClass) {
    super(superClass, "TApplication");
  }
  getMetaclass() {
    return _TMetaApplication.metaclass;
  }
};
__publicField(_TMetaApplication, "metaclass", new _TMetaApplication(TMetaclass.metaclass));
var TMetaApplication = _TMetaApplication;
var _TApplication = class _TApplication {
  constructor() {
    //static pluginRegistry = new PluginRegistry();
    //plugins: IPluginRegistry;
    __publicField(this, "forms", []);
    __publicField(this, "types", new TComponentTypeRegistry2());
    __publicField(this, "mainForm", null);
    _TApplication.TheApplication = this;
    registerBuiltins(this.types);
  }
  getMetaclass() {
    return TMetaApplication.metaclass;
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
__publicField(_TMetaPluginHost, "metaClass", new _TMetaPluginHost(TMetaComponent2.metaclass));
var TMetaPluginHost = _TMetaPluginHost;
var TPluginHost = class extends TComponent2 {
  constructor(name, form, parent) {
    super(name, form, parent);
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
    btn.caption = "MIMI";
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vc3JjL3ZjbC9yZWdpc3RlclZjbC50cyIsICIuLi9zcmMvdmNsL1N0ZEN0cmxzLnRzIiwgIi4uL2V4YW1wbGVzL3phemEvdGVzdC50cyIsICIuLi9leGFtcGxlcy96YXphL3phemEudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbIi8vIEVuZ2xpc2ggY29tbWVudHMgYXMgcmVxdWVzdGVkLlxuXG4vL2ltcG9ydCB7IENvbXBvbmVudFR5cGVSZWdpc3RyeSB9IGZyb20gJ0BkcnQnO1xuaW1wb3J0IHsgVEJ1dHRvbiwgVE1ldGFDb21wb25lbnQsIFRGb3JtLCBUQ29tcG9uZW50LCBUQ29tcG9uZW50VHlwZVJlZ2lzdHJ5LCBUTWV0YUJ1dHRvbiwgVE1ldGFQbHVnaW5Ib3N0IH0gZnJvbSAnQHZjbCc7XG4vL2ltcG9ydCB7IFRNZXRhUGx1Z2luSG9zdCB9IGZyb20gJy4uL2RydC9VSVBsdWdpbic7IC8vIE5PVCBHT09EICEgaW1wb3J0IFZDTCFcblxuLy8gRW5nbGlzaCBjb21tZW50cyBhcyByZXF1ZXN0ZWQuXG5leHBvcnQgZnVuY3Rpb24gcmVnaXN0ZXJCdWlsdGlucyh0eXBlczogVENvbXBvbmVudFR5cGVSZWdpc3RyeSkge1xuICAgICAgICB0eXBlcy5yZWdpc3RlcihUTWV0YUJ1dHRvbi5tZXRhY2xhc3MpO1xuICAgICAgICB0eXBlcy5yZWdpc3RlcihUTWV0YVBsdWdpbkhvc3QubWV0YUNsYXNzKTtcbiAgICAgICAgLy8gdHlwZXMucmVnaXN0ZXIoVEVkaXRDbGFzcyk7XG4gICAgICAgIC8vIHR5cGVzLnJlZ2lzdGVyKFRMYWJlbENsYXNzKTtcbn1cbiIsICJpbXBvcnQgeyByZWdpc3RlckJ1aWx0aW5zIH0gZnJvbSAnLi9yZWdpc3RlclZjbCc7XG5cbi8qXG4gICBUbyBjcmVhdGUgYSBuZXcgY29tcG9uZW50IHR5cGU6XG5cbiAgIFRvIGNyZWF0ZSBhIG5ldyBjb21wb25lbnQgYXR0cmlidXRcblxuKi9cblxuZXhwb3J0IHR5cGUgQ29tcG9uZW50RmFjdG9yeSA9IChuYW1lOiBzdHJpbmcsIGZvcm06IFRGb3JtLCBvd25lcjogVENvbXBvbmVudCkgPT4gVENvbXBvbmVudDtcblxuZXhwb3J0IHR5cGUgSnNvbiA9IG51bGwgfCBib29sZWFuIHwgbnVtYmVyIHwgc3RyaW5nIHwgSnNvbltdIHwgeyBba2V5OiBzdHJpbmddOiBKc29uIH07XG5cbnR5cGUgUHJvcEtpbmQgPSAnc3RyaW5nJyB8ICdudW1iZXInIHwgJ2Jvb2xlYW4nIHwgJ2NvbG9yJyB8ICdoYW5kbGVyJztcbmV4cG9ydCB0eXBlIFByb3BTcGVjPFQsIFYgPSB1bmtub3duPiA9IHtcbiAgICAgICAgbmFtZTogc3RyaW5nO1xuICAgICAgICBraW5kOiBQcm9wS2luZDtcbiAgICAgICAgYXBwbHk6IChvYmo6IFQsIHZhbHVlOiBWKSA9PiB2b2lkO1xufTtcblxuZXhwb3J0IGludGVyZmFjZSBJUGx1Z2luSG9zdCB7XG4gICAgICAgIHNldFBsdWdpblNwZWMoc3BlYzogeyBwbHVnaW46IHN0cmluZyB8IG51bGw7IHByb3BzOiBhbnkgfSk6IHZvaWQ7XG4gICAgICAgIG1vdW50UGx1Z2luSWZSZWFkeShzZXJ2aWNlczogRGVscGhpbmVTZXJ2aWNlcyk6IHZvaWQ7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgRGVscGhpbmVMb2dnZXIge1xuICAgICAgICBkZWJ1Zyhtc2c6IHN0cmluZywgZGF0YT86IEpzb24pOiB2b2lkO1xuICAgICAgICBpbmZvKG1zZzogc3RyaW5nLCBkYXRhPzogSnNvbik6IHZvaWQ7XG4gICAgICAgIHdhcm4obXNnOiBzdHJpbmcsIGRhdGE/OiBKc29uKTogdm9pZDtcbiAgICAgICAgZXJyb3IobXNnOiBzdHJpbmcsIGRhdGE/OiBKc29uKTogdm9pZDtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBEZWxwaGluZUV2ZW50QnVzIHtcbiAgICAgICAgLy8gU3Vic2NyaWJlIHRvIGFuIGFwcCBldmVudC5cbiAgICAgICAgb24oZXZlbnROYW1lOiBzdHJpbmcsIGhhbmRsZXI6IChwYXlsb2FkOiBKc29uKSA9PiB2b2lkKTogKCkgPT4gdm9pZDtcblxuICAgICAgICAvLyBQdWJsaXNoIGFuIGFwcCBldmVudC5cbiAgICAgICAgZW1pdChldmVudE5hbWU6IHN0cmluZywgcGF5bG9hZDogSnNvbik6IHZvaWQ7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgRGVscGhpbmVTdG9yYWdlIHtcbiAgICAgICAgZ2V0KGtleTogc3RyaW5nKTogUHJvbWlzZTxKc29uIHwgdW5kZWZpbmVkPjtcbiAgICAgICAgc2V0KGtleTogc3RyaW5nLCB2YWx1ZTogSnNvbik6IFByb21pc2U8dm9pZD47XG4gICAgICAgIHJlbW92ZShrZXk6IHN0cmluZyk6IFByb21pc2U8dm9pZD47XG59XG5leHBvcnQgaW50ZXJmYWNlIERlbHBoaW5lU2VydmljZXMge1xuICAgICAgICBsb2c6IHtcbiAgICAgICAgICAgICAgICBkZWJ1Zyhtc2c6IHN0cmluZywgZGF0YT86IGFueSk6IHZvaWQ7XG4gICAgICAgICAgICAgICAgaW5mbyhtc2c6IHN0cmluZywgZGF0YT86IGFueSk6IHZvaWQ7XG4gICAgICAgICAgICAgICAgd2Fybihtc2c6IHN0cmluZywgZGF0YT86IGFueSk6IHZvaWQ7XG4gICAgICAgICAgICAgICAgZXJyb3IobXNnOiBzdHJpbmcsIGRhdGE/OiBhbnkpOiB2b2lkO1xuICAgICAgICB9O1xuXG4gICAgICAgIGJ1czoge1xuICAgICAgICAgICAgICAgIG9uKGV2ZW50OiBzdHJpbmcsIGhhbmRsZXI6IChwYXlsb2FkOiBhbnkpID0+IHZvaWQpOiAoKSA9PiB2b2lkO1xuICAgICAgICAgICAgICAgIGVtaXQoZXZlbnQ6IHN0cmluZywgcGF5bG9hZDogYW55KTogdm9pZDtcbiAgICAgICAgfTtcblxuICAgICAgICBzdG9yYWdlOiB7XG4gICAgICAgICAgICAgICAgZ2V0KGtleTogc3RyaW5nKTogUHJvbWlzZTxhbnk+IHwgbnVsbDtcbiAgICAgICAgICAgICAgICBzZXQoa2V5OiBzdHJpbmcsIHZhbHVlOiBhbnkpOiBQcm9taXNlPHZvaWQ+IHwgbnVsbDtcbiAgICAgICAgICAgICAgICByZW1vdmUoa2V5OiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHwgbnVsbDtcbiAgICAgICAgfTtcblxuICAgICAgICAvLyBmdXR1clxuICAgICAgICAvLyBpMThuPzogLi4uXG4gICAgICAgIC8vIG5hdj86IC4uLlxufVxuXG5leHBvcnQgaW50ZXJmYWNlIFVJUGx1Z2luSW5zdGFuY2U8UHJvcHMgZXh0ZW5kcyBKc29uID0gSnNvbj4ge1xuICAgICAgICByZWFkb25seSBpZDogc3RyaW5nO1xuXG4gICAgICAgIC8vIENhbGxlZCBleGFjdGx5IG9uY2UgYWZ0ZXIgY3JlYXRpb24gKGZvciBhIGdpdmVuIGluc3RhbmNlKS5cbiAgICAgICAgbW91bnQoY29udGFpbmVyOiBIVE1MRWxlbWVudCwgcHJvcHM6IFByb3BzLCBzZXJ2aWNlczogRGVscGhpbmVTZXJ2aWNlcyk6IHZvaWQ7XG5cbiAgICAgICAgLy8gQ2FsbGVkIGFueSB0aW1lIHByb3BzIGNoYW5nZSAobWF5IGJlIGZyZXF1ZW50KS5cbiAgICAgICAgdXBkYXRlKHByb3BzOiBQcm9wcyk6IHZvaWQ7XG5cbiAgICAgICAgLy8gQ2FsbGVkIGV4YWN0bHkgb25jZSBiZWZvcmUgZGlzcG9zYWwuXG4gICAgICAgIHVubW91bnQoKTogdm9pZDtcblxuICAgICAgICAvLyBPcHRpb25hbCBlcmdvbm9taWNzLlxuICAgICAgICBnZXRTaXplSGludHM/KCk6IG51bWJlcjtcbiAgICAgICAgZm9jdXM/KCk6IHZvaWQ7XG5cbiAgICAgICAgLy8gT3B0aW9uYWwgcGVyc2lzdGVuY2UgaG9vayAoRGVscGhpbmUgbWF5IHN0b3JlICYgcmVzdG9yZSB0aGlzKS5cbiAgICAgICAgc2VyaWFsaXplU3RhdGU/KCk6IEpzb247XG59XG5cbmV4cG9ydCBhYnN0cmFjdCBjbGFzcyBUTWV0YWNsYXNzIHtcbiAgICAgICAgcmVhZG9ubHkgdHlwZU5hbWU6IHN0cmluZyA9ICdUTWV0YWNsYXNzJztcbiAgICAgICAgc3RhdGljIG1ldGFjbGFzczogVE1ldGFjbGFzcztcbiAgICAgICAgcmVhZG9ubHkgc3VwZXJDbGFzczogVE1ldGFjbGFzcyB8IG51bGwgPSBudWxsO1xuXG4gICAgICAgIGFic3RyYWN0IGdldE1ldGFjbGFzcygpOiBUTWV0YWNsYXNzO1xuICAgICAgICBwcm90ZWN0ZWQgY29uc3RydWN0b3Ioc3VwZXJDbGFzczogVE1ldGFjbGFzcyB8IG51bGwsIHR5cGVOYW1lID0gJ1RNZXRhY2xhc3MnKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5zdXBlckNsYXNzID0gc3VwZXJDbGFzcztcbiAgICAgICAgICAgICAgICB0aGlzLnR5cGVOYW1lID0gdHlwZU5hbWU7XG4gICAgICAgIH1cbn1cblxuZXhwb3J0IGNsYXNzIFRPYmplY3Qge1xuICAgICAgICBnZXRNZXRhQ2xhc3MoKTogVE1ldGFPYmplY3Qge1xuICAgICAgICAgICAgICAgIHJldHVybiBUTWV0YU9iamVjdC5tZXRhQ2xhc3M7XG4gICAgICAgIH1cbn1cblxuZXhwb3J0IGNsYXNzIFRNZXRhT2JqZWN0IGV4dGVuZHMgVE1ldGFjbGFzcyB7XG4gICAgICAgIHN0YXRpYyByZWFkb25seSBtZXRhQ2xhc3M6IFRNZXRhT2JqZWN0ID0gbmV3IFRNZXRhT2JqZWN0KFRNZXRhY2xhc3MubWV0YWNsYXNzKTtcblxuICAgICAgICBnZXRNZXRhY2xhc3MoKTogVE1ldGFPYmplY3Qge1xuICAgICAgICAgICAgICAgIHJldHVybiBUTWV0YU9iamVjdC5tZXRhQ2xhc3M7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3RydWN0b3Ioc3VwZXJDbGFzczogVE1ldGFjbGFzcykge1xuICAgICAgICAgICAgICAgIHN1cGVyKHN1cGVyQ2xhc3MsICdUT2JqZWN0Jyk7XG4gICAgICAgIH1cbn1cblxuZXhwb3J0IGNsYXNzIFRNZXRhQ29tcG9uZW50IGV4dGVuZHMgVE1ldGFjbGFzcyB7XG4gICAgICAgIHN0YXRpYyByZWFkb25seSBtZXRhY2xhc3M6IFRNZXRhQ29tcG9uZW50ID0gbmV3IFRNZXRhQ29tcG9uZW50KFRNZXRhY2xhc3MubWV0YWNsYXNzKTtcbiAgICAgICAgLy8gVGhlIHN5bWJvbGljIG5hbWUgdXNlZCBpbiBIVE1MOiBkYXRhLWNvbXBvbmVudD1cIlRCdXR0b25cIiBvciBcIm15LWJ1dHRvblwiXG4gICAgICAgIHByb3RlY3RlZCBjb25zdHJ1Y3RvcihzdXBlckNsYXNzOiBUTWV0YWNsYXNzKSB7XG4gICAgICAgICAgICAgICAgc3VwZXIoc3VwZXJDbGFzcywgJ1RDb21wb25lbnQnKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGdldE1ldGFjbGFzcygpOiBUTWV0YUNvbXBvbmVudCB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIFRNZXRhQ29tcG9uZW50Lm1ldGFjbGFzcztcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIENyZWF0ZSB0aGUgcnVudGltZSBpbnN0YW5jZSBhbmQgYXR0YWNoIGl0IHRvIHRoZSBET00gZWxlbWVudC5cbiAgICAgICAgY3JlYXRlKG5hbWU6IHN0cmluZywgZm9ybTogVEZvcm0sIHBhcmVudDogVENvbXBvbmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBuZXcgVENvbXBvbmVudChuYW1lLCBmb3JtLCBwYXJlbnQpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy9hbGxEZWZQcm9wc0NvbGxlY3RlZDogUHJvcFNwZWM8YW55PltdID0gW107XG4gICAgICAgIC8vZG9tRXZlbnRzPygpOiBzdHJpbmdbXTsgLy8gZGVmYXVsdCBbXTtcblxuICAgICAgICAvKlxuICAgICAgICAvLyBPcHRpb25hbDogcGFyc2UgSFRNTCBhdHRyaWJ1dGVzIC0+IHByb3BzL3N0YXRlXG4gICAgICAgIC8vIEV4YW1wbGU6IGRhdGEtY2FwdGlvbj1cIk9LXCIgLT4geyBjYXB0aW9uOiBcIk9LXCIgfVxuICAgICAgICBwYXJzZVByb3BzPyhlbGVtOiBIVE1MRWxlbWVudCk6IEpzb247XG5cbiAgICAgICAgLy8gT3B0aW9uYWw6IGFwcGx5IHByb3BzIHRvIHRoZSBjb21wb25lbnQgKGNhbiBiZSBjYWxsZWQgYWZ0ZXIgY3JlYXRlKVxuICAgICAgICBhcHBseVByb3BzPyhjOiBULCBwcm9wczogSnNvbik6IHZvaWQ7XG5cbiAgICAgICAgLy8gT3B0aW9uYWw6IERlc2lnbi10aW1lIG1ldGFkYXRhIChwYWxldHRlLCBpbnNwZWN0b3IsIGV0Yy4pXG4gICAgICAgIGRlc2lnblRpbWU/OiB7XG4gICAgICAgICAgICAgICAgcGFsZXR0ZUdyb3VwPzogc3RyaW5nO1xuICAgICAgICAgICAgICAgIGRpc3BsYXlOYW1lPzogc3RyaW5nO1xuICAgICAgICAgICAgICAgIGljb24/OiBzdHJpbmc7IC8vIGxhdGVyXG4gICAgICAgICAgICAgICAgLy8gcHJvcGVydHkgc2NoZW1hIGNvdWxkIGxpdmUgaGVyZVxuICAgICAgICB9O1xuICAgICAgICAqL1xuICAgICAgICBkZWZQcm9wcygpOiBQcm9wU3BlYzxhbnk+W10ge1xuICAgICAgICAgICAgICAgIHJldHVybiBbXG4gICAgICAgICAgICAgICAgICAgICAgICB7IG5hbWU6ICdjb2xvcicsIGtpbmQ6ICdjb2xvcicsIGFwcGx5OiAobywgdikgPT4gKG8uY29sb3IgPSBuZXcgVENvbG9yKFN0cmluZyh2KSkpIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICB7IG5hbWU6ICdvbmNsaWNrJywga2luZDogJ2hhbmRsZXInLCBhcHBseTogKG8sIHYpID0+IChvLm9uY2xpY2sgPSBuZXcgVEhhbmRsZXIoU3RyaW5nKHYpKSkgfVxuICAgICAgICAgICAgICAgICAgICAgICAgLy97IG5hbWU6ICdvbmNyZWF0ZScsIGtpbmQ6ICdoYW5kbGVyJywgYXBwbHk6IChvLCB2KSA9PiAoby5vbmNyZWF0ZSA9IG5ldyBUSGFuZGxlcihTdHJpbmcodikpKSB9XG4gICAgICAgICAgICAgICAgXTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8qXG4gICAgICAgIGFwcGx5UHJvcHMob2JqOiBhbnksIHZhbHVlczogUmVjb3JkPHN0cmluZywgdW5rbm93bj4pIHtcbiAgICAgICAgICAgICAgICBmb3IgKGNvbnN0IHAgb2YgdGhpcy5kZWZQcm9wcygpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKHZhbHVlcywgcC5uYW1lKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwLmFwcGx5KG9iaiwgdmFsdWVzW3AubmFtZV0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICAgICAgICAgICovXG5cbiAgICAgICAgLy8gRW5nbGlzaCBjb21tZW50cyBhcyByZXF1ZXN0ZWQuXG5cbiAgICAgICAgLypcbiAgICAgICAgYXBwbHlQcm9wc0Zyb21FbGVtZW50KG9iajogYW55LCBlbDogRWxlbWVudCkge1xuICAgICAgICAgICAgICAgIGNvbnN0IHByb3BzID0gdGhpcy5wYXJzZVByb3BzRnJvbUVsZW1lbnQoZWwpO1xuICAgICAgICAgICAgICAgIHRoaXMuYXBwbHlQcm9wcyhvYmosIHByb3BzKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gcHJvcHM7XG4gICAgICAgIH1cbiAgICAgICAgICAgICAgICAqL1xuICAgICAgICAvLyBBcHBseSBwYXJzZWQgcHJvcHMgdG8gdGhlIGNvbXBvbmVudCBpbnN0YW5jZVxuXG4gICAgICAgIGRvbUV2ZW50cz8oKTogc3RyaW5nW107IC8vIGRlZmF1bHQgW107XG59XG5cbnR5cGUgQ29tcG9uZW50UHJvcHMgPSB7XG4gICAgICAgIG9uY2xpY2s/OiBUSGFuZGxlcjtcbiAgICAgICAgb25jcmVhdGU/OiBUSGFuZGxlcjtcbiAgICAgICAgY29sb3I/OiBUQ29sb3I7IC8vIG91IFRDb2xvciwgZXRjLlxuICAgICAgICBuYW1lPzogc3RyaW5nO1xuICAgICAgICBjb21wb25lbnQ/OiBzdHJpbmc7XG59O1xuXG4vL3R5cGUgUmF3UHJvcCA9IFJlY29yZDxzdHJpbmcsIHN0cmluZz47XG5cbmV4cG9ydCBjbGFzcyBUQ29tcG9uZW50IHtcbiAgICAgICAgZ2V0TWV0YWNsYXNzKCk6IFRNZXRhQ29tcG9uZW50IHtcbiAgICAgICAgICAgICAgICByZXR1cm4gVE1ldGFDb21wb25lbnQubWV0YWNsYXNzO1xuICAgICAgICB9XG5cbiAgICAgICAgcmVhZG9ubHkgbmFtZTogc3RyaW5nO1xuICAgICAgICByZWFkb25seSBwYXJlbnQ6IFRDb21wb25lbnQgfCBudWxsID0gbnVsbDtcbiAgICAgICAgZm9ybTogVEZvcm0gfCBudWxsID0gbnVsbDtcbiAgICAgICAgY2hpbGRyZW46IFRDb21wb25lbnRbXSA9IFtdO1xuXG4gICAgICAgIGVsZW06IEVsZW1lbnQgfCBudWxsID0gbnVsbDtcbiAgICAgICAgZ2V0IGh0bWxFbGVtZW50KCk6IEhUTUxFbGVtZW50IHwgbnVsbCB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuZWxlbSBhcyBIVE1MRWxlbWVudCB8IG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3RydWN0b3IobmFtZTogc3RyaW5nLCBmb3JtOiBURm9ybSB8IG51bGwsIHBhcmVudDogVENvbXBvbmVudCB8IG51bGwpIHtcbiAgICAgICAgICAgICAgICB0aGlzLm5hbWUgPSBuYW1lO1xuICAgICAgICAgICAgICAgIHRoaXMucGFyZW50ID0gcGFyZW50O1xuICAgICAgICAgICAgICAgIHBhcmVudD8uY2hpbGRyZW4ucHVzaCh0aGlzKTtcbiAgICAgICAgICAgICAgICB0aGlzLmZvcm0gPSBmb3JtO1xuICAgICAgICAgICAgICAgIHRoaXMubmFtZSA9IG5hbWU7XG4gICAgICAgIH1cblxuICAgICAgICBkZWNsYXJlIHByb3BzOiBDb21wb25lbnRQcm9wcztcbiAgICAgICAgLy9yYXdQcm9wczogUmF3UHJvcFtdID0gW107XG5cbiAgICAgICAgLyoqIE1heSBjb250YWluIGNoaWxkIGNvbXBvbmVudHMgKi9cbiAgICAgICAgYWxsb3dzQ2hpbGRyZW4oKTogYm9vbGVhbiB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG5cbiAgICAgICAgZ2V0IGNvbG9yKCk6IFRDb2xvciB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMucHJvcHMuY29sb3IgPz8gbmV3IFRDb2xvcignZGVmYXVsdCcpO1xuICAgICAgICB9XG5cbiAgICAgICAgc2V0IGNvbG9yKGNvbG9yKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5wcm9wcy5jb2xvciA9IGNvbG9yO1xuICAgICAgICAgICAgICAgIGNvbnN0IGVsID0gdGhpcy5odG1sRWxlbWVudDtcbiAgICAgICAgICAgICAgICBpZiAoIWVsKSByZXR1cm47XG5cbiAgICAgICAgICAgICAgICB0aGlzLnNldFN0eWxlUHJvcCgnY29sb3InLCB0aGlzLmNvbG9yLnMpO1xuICAgICAgICB9XG5cbiAgICAgICAgZ2V0IG9uY2xpY2soKTogVEhhbmRsZXIge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLnByb3BzLm9uY2xpY2sgPz8gbmV3IFRIYW5kbGVyKCcnKTtcbiAgICAgICAgfVxuICAgICAgICBzZXQgb25jbGljayhoYW5kbGVyKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5wcm9wcy5vbmNsaWNrID0gaGFuZGxlcjtcbiAgICAgICAgfVxuXG4gICAgICAgIHN5bmNEb21Gcm9tUHJvcHMoKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgZWwgPSB0aGlzLmh0bWxFbGVtZW50O1xuICAgICAgICAgICAgICAgIGlmICghZWwpIHJldHVybjtcblxuICAgICAgICAgICAgICAgIHRoaXMuc2V0U3R5bGVQcm9wKCdjb2xvcicsIHRoaXMuY29sb3Iucyk7XG4gICAgICAgIH1cblxuICAgICAgICBnZXQgYmFja2dyb3VuZENvbG9yKCk6IFRDb2xvciB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBUQ29sb3IodGhpcy5nZXRTdHlsZVByb3AoJ2JhY2tncm91bmQtY29sb3InKSk7XG4gICAgICAgIH1cbiAgICAgICAgc2V0IGJhY2tncm91bmRDb2xvcih2OiBUQ29sb3IpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnNldFN0eWxlUHJvcCgnYmFja2dyb3VuZC1jb2xvcicsIHYucyk7XG4gICAgICAgIH1cblxuICAgICAgICBnZXQgd2lkdGgoKTogbnVtYmVyIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcGFyc2VJbnQodGhpcy5nZXRTdHlsZVByb3AoJ3dpZHRoJykpO1xuICAgICAgICB9XG4gICAgICAgIHNldCB3aWR0aCh2OiBudW1iZXIpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnNldFN0eWxlUHJvcCgnd2lkdGgnLCB2LnRvU3RyaW5nKCkpO1xuICAgICAgICB9XG5cbiAgICAgICAgZ2V0IGhlaWdodCgpOiBudW1iZXIge1xuICAgICAgICAgICAgICAgIHJldHVybiBwYXJzZUludCh0aGlzLmdldFN0eWxlUHJvcCgnaGVpZ2h0JykpO1xuICAgICAgICB9XG4gICAgICAgIHNldCBoZWlnaHQodjogbnVtYmVyKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5zZXRTdHlsZVByb3AoJ2hlaWdodCcsIHYudG9TdHJpbmcoKSk7XG4gICAgICAgIH1cblxuICAgICAgICBnZXQgb2Zmc2V0V2lkdGgoKTogbnVtYmVyIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5odG1sRWxlbWVudCEub2Zmc2V0V2lkdGg7XG4gICAgICAgIH1cbiAgICAgICAgZ2V0IG9mZnNldEhlaWdodCgpOiBudW1iZXIge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmh0bWxFbGVtZW50IS5vZmZzZXRIZWlnaHQ7XG4gICAgICAgIH1cblxuICAgICAgICBzZXRTdHlsZVByb3AobmFtZTogc3RyaW5nLCB2YWx1ZTogc3RyaW5nKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5odG1sRWxlbWVudCEuc3R5bGUuc2V0UHJvcGVydHkobmFtZSwgdmFsdWUpO1xuICAgICAgICB9XG5cbiAgICAgICAgZ2V0U3R5bGVQcm9wKG5hbWU6IHN0cmluZykge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmh0bWxFbGVtZW50IS5zdHlsZS5nZXRQcm9wZXJ0eVZhbHVlKG5hbWUpO1xuICAgICAgICB9XG5cbiAgICAgICAgc2V0UHJvcChuYW1lOiBzdHJpbmcsIHZhbHVlOiBzdHJpbmcpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmh0bWxFbGVtZW50IS5zZXRBdHRyaWJ1dGUobmFtZSwgdmFsdWUpO1xuICAgICAgICB9XG5cbiAgICAgICAgZ2V0UHJvcChuYW1lOiBzdHJpbmcpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcyEuaHRtbEVsZW1lbnQhLmdldEF0dHJpYnV0ZShuYW1lKTtcbiAgICAgICAgfVxufVxuXG5leHBvcnQgY2xhc3MgVE1ldGFDb21wb25lbnRUeXBlUmVnaXN0cnkgZXh0ZW5kcyBUTWV0YU9iamVjdCB7XG4gICAgICAgIHN0YXRpYyByZWFkb25seSBtZXRhY2xhc3M6IFRNZXRhQ29tcG9uZW50VHlwZVJlZ2lzdHJ5ID0gbmV3IFRNZXRhQ29tcG9uZW50VHlwZVJlZ2lzdHJ5KFRNZXRhT2JqZWN0Lm1ldGFDbGFzcyk7XG4gICAgICAgIHByb3RlY3RlZCBjb25zdHJ1Y3RvcihzdXBlckNsYXNzOiBUTWV0YU9iamVjdCkge1xuICAgICAgICAgICAgICAgIHN1cGVyKHN1cGVyQ2xhc3MpO1xuICAgICAgICAgICAgICAgIC8vIGV0IHZvdXMgY2hhbmdleiBqdXN0ZSBsZSBub20gOlxuICAgICAgICAgICAgICAgICh0aGlzIGFzIGFueSkudHlwZU5hbWUgPSAnVE9iamVjdCc7XG4gICAgICAgIH1cbiAgICAgICAgZ2V0TWV0YWNsYXNzKCk6IFRNZXRhQ29tcG9uZW50VHlwZVJlZ2lzdHJ5IHtcbiAgICAgICAgICAgICAgICByZXR1cm4gVE1ldGFDb21wb25lbnRUeXBlUmVnaXN0cnkubWV0YWNsYXNzO1xuICAgICAgICB9XG59XG5cbmV4cG9ydCBjbGFzcyBUQ29tcG9uZW50VHlwZVJlZ2lzdHJ5IGV4dGVuZHMgVE9iamVjdCB7XG4gICAgICAgIC8vIFdlIHN0b3JlIGhldGVyb2dlbmVvdXMgbWV0YXMsIHNvIHdlIGtlZXAgdGhlbSBhcyBUTWV0YUNvbXBvbmVudDxhbnk+LlxuICAgICAgICBnZXRNZXRhY2xhc3MoKTogVE1ldGFDb21wb25lbnRUeXBlUmVnaXN0cnkge1xuICAgICAgICAgICAgICAgIHJldHVybiBUTWV0YUNvbXBvbmVudFR5cGVSZWdpc3RyeS5tZXRhQ2xhc3M7XG4gICAgICAgIH1cbiAgICAgICAgcHJpdmF0ZSByZWFkb25seSBjbGFzc2VzID0gbmV3IE1hcDxzdHJpbmcsIFRNZXRhQ29tcG9uZW50PigpO1xuXG4gICAgICAgIHJlZ2lzdGVyKG1ldGE6IFRNZXRhQ29tcG9uZW50KSB7XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuY2xhc3Nlcy5oYXMobWV0YS50eXBlTmFtZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgQ29tcG9uZW50IHR5cGUgYWxyZWFkeSByZWdpc3RlcmVkOiAke21ldGEudHlwZU5hbWV9YCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHRoaXMuY2xhc3Nlcy5zZXQobWV0YS50eXBlTmFtZSwgbWV0YSk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBJZiB5b3UganVzdCBuZWVkIFwic29tZXRoaW5nIG1ldGFcIiwgcmV0dXJuIGFueS1tZXRhLlxuICAgICAgICBnZXQodHlwZU5hbWU6IHN0cmluZyk6IFRNZXRhQ29tcG9uZW50IHwgdW5kZWZpbmVkIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5jbGFzc2VzLmdldCh0eXBlTmFtZSk7XG4gICAgICAgIH1cblxuICAgICAgICBoYXModHlwZU5hbWU6IHN0cmluZyk6IGJvb2xlYW4ge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmNsYXNzZXMuaGFzKHR5cGVOYW1lKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGxpc3QoKTogc3RyaW5nW10ge1xuICAgICAgICAgICAgICAgIHJldHVybiBbLi4udGhpcy5jbGFzc2VzLmtleXMoKV0uc29ydCgpO1xuICAgICAgICB9XG59XG5cbmV4cG9ydCBjbGFzcyBUQ29sb3Ige1xuICAgICAgICBzOiBzdHJpbmc7XG5cbiAgICAgICAgY29uc3RydWN0b3Ioczogc3RyaW5nKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5zID0gcztcbiAgICAgICAgfVxuICAgICAgICAvKiBmYWN0b3J5ICovIHN0YXRpYyByZ2IocjogbnVtYmVyLCBnOiBudW1iZXIsIGI6IG51bWJlcik6IFRDb2xvciB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBUQ29sb3IoYHJnYigke3J9LCAke2d9LCAke2J9KWApO1xuICAgICAgICB9XG4gICAgICAgIC8qIGZhY3RvcnkgKi8gc3RhdGljIHJnYmEocjogbnVtYmVyLCBnOiBudW1iZXIsIGI6IG51bWJlciwgYTogbnVtYmVyKTogVENvbG9yIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gbmV3IFRDb2xvcihgcmdiYSgke3J9LCAke2d9LCAke2J9LCAke2F9KWApO1xuICAgICAgICB9XG59XG5cbmV4cG9ydCBjbGFzcyBUSGFuZGxlciB7XG4gICAgICAgIHM6IHN0cmluZztcblxuICAgICAgICBjb25zdHJ1Y3RvcihzOiBzdHJpbmcpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnMgPSBzO1xuICAgICAgICB9XG59XG5cbmV4cG9ydCBjbGFzcyBUTWV0YUNvbXBvbmVudFJlZ2lzdHJ5IGV4dGVuZHMgVE1ldGFjbGFzcyB7XG4gICAgICAgIHN0YXRpYyByZWFkb25seSBtZXRhY2xhc3M6IFRNZXRhQ29tcG9uZW50UmVnaXN0cnkgPSBuZXcgVE1ldGFDb21wb25lbnRSZWdpc3RyeShUTWV0YWNsYXNzLm1ldGFjbGFzcyk7XG5cbiAgICAgICAgcHJvdGVjdGVkIGNvbnN0cnVjdG9yKHN1cGVyQ2xhc3M6IFRNZXRhY2xhc3MpIHtcbiAgICAgICAgICAgICAgICBzdXBlcihzdXBlckNsYXNzLCAnVENvbXBvbmVudFJlZ2lzdHJ5Jyk7XG4gICAgICAgIH1cbiAgICAgICAgZ2V0TWV0YWNsYXNzKCk6IFRNZXRhQ29tcG9uZW50UmVnaXN0cnkge1xuICAgICAgICAgICAgICAgIHJldHVybiBUTWV0YUNvbXBvbmVudFJlZ2lzdHJ5Lm1ldGFjbGFzcztcbiAgICAgICAgfVxufVxuXG5leHBvcnQgY2xhc3MgVENvbXBvbmVudFJlZ2lzdHJ5IGV4dGVuZHMgVE9iamVjdCB7XG4gICAgICAgIGdldE1ldGFjbGFzcygpOiBUTWV0YUNvbXBvbmVudFJlZ2lzdHJ5IHtcbiAgICAgICAgICAgICAgICByZXR1cm4gVE1ldGFDb21wb25lbnRSZWdpc3RyeS5tZXRhY2xhc3M7XG4gICAgICAgIH1cblxuICAgICAgICBwcml2YXRlIGluc3RhbmNlcyA9IG5ldyBNYXA8c3RyaW5nLCBUQ29tcG9uZW50PigpO1xuXG4gICAgICAgIGxvZ2dlciA9IHtcbiAgICAgICAgICAgICAgICBkZWJ1Zyhtc2c6IHN0cmluZywgZGF0YT86IEpzb24pOiB2b2lkIHt9LFxuICAgICAgICAgICAgICAgIGluZm8obXNnOiBzdHJpbmcsIGRhdGE/OiBKc29uKTogdm9pZCB7fSxcbiAgICAgICAgICAgICAgICB3YXJuKG1zZzogc3RyaW5nLCBkYXRhPzogSnNvbik6IHZvaWQge30sXG4gICAgICAgICAgICAgICAgZXJyb3IobXNnOiBzdHJpbmcsIGRhdGE/OiBKc29uKTogdm9pZCB7fVxuICAgICAgICB9O1xuXG4gICAgICAgIGV2ZW50QnVzID0ge1xuICAgICAgICAgICAgICAgIG9uKGV2ZW50OiBzdHJpbmcsIGhhbmRsZXI6IChwYXlsb2FkOiBhbnkpID0+IHZvaWQpOiAoKSA9PiB2b2lkIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAoKSA9PiB2b2lkIHt9O1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgZW1pdChldmVudDogc3RyaW5nLCBwYXlsb2FkOiBhbnkpOiB2b2lkIHt9XG4gICAgICAgIH07XG5cbiAgICAgICAgc3RvcmFnZSA9IHtcbiAgICAgICAgICAgICAgICBnZXQoa2V5OiBzdHJpbmcpOiBQcm9taXNlPGFueT4gfCBudWxsIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgc2V0KGtleTogc3RyaW5nLCB2YWx1ZTogYW55KTogUHJvbWlzZTx2b2lkPiB8IG51bGwge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICByZW1vdmUoa2V5OiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHwgbnVsbCB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgIH07XG5cbiAgICAgICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgICAgICAgICAgc3VwZXIoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJlZ2lzdGVySW5zdGFuY2UobmFtZTogc3RyaW5nLCBjOiBUQ29tcG9uZW50KSB7XG4gICAgICAgICAgICAgICAgdGhpcy5pbnN0YW5jZXMuc2V0KG5hbWUsIGMpO1xuICAgICAgICB9XG4gICAgICAgIGdldDxUIGV4dGVuZHMgVENvbXBvbmVudCA9IFRDb21wb25lbnQ+KG5hbWU6IHN0cmluZyk6IFQgfCB1bmRlZmluZWQge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmluc3RhbmNlcy5nZXQobmFtZSkgYXMgVCB8IHVuZGVmaW5lZDtcbiAgICAgICAgfVxuXG4gICAgICAgIHNlcnZpY2VzOiBEZWxwaGluZVNlcnZpY2VzID0ge1xuICAgICAgICAgICAgICAgIGxvZzogdGhpcy5sb2dnZXIsXG4gICAgICAgICAgICAgICAgYnVzOiB0aGlzLmV2ZW50QnVzLFxuICAgICAgICAgICAgICAgIHN0b3JhZ2U6IHRoaXMuc3RvcmFnZVxuICAgICAgICB9O1xuXG4gICAgICAgIGNsZWFyKCkge1xuICAgICAgICAgICAgICAgIHRoaXMuaW5zdGFuY2VzLmNsZWFyKCk7XG4gICAgICAgIH1cblxuICAgICAgICByZXNvbHZlUm9vdCgpOiBIVE1MRWxlbWVudCB7XG4gICAgICAgICAgICAgICAgLy8gUHJlZmVyIGJvZHkgYXMgdGhlIGNhbm9uaWNhbCByb290LlxuICAgICAgICAgICAgICAgIGlmIChkb2N1bWVudC5ib2R5Py5kYXRhc2V0Py5jb21wb25lbnQpIHJldHVybiBkb2N1bWVudC5ib2R5O1xuXG4gICAgICAgICAgICAgICAgLy8gQmFja3dhcmQgY29tcGF0aWJpbGl0eTogb2xkIHdyYXBwZXIgZGl2LlxuICAgICAgICAgICAgICAgIGNvbnN0IGxlZ2FjeSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdkZWxwaGluZS1yb290Jyk7XG4gICAgICAgICAgICAgICAgaWYgKGxlZ2FjeSkgcmV0dXJuIGxlZ2FjeTtcblxuICAgICAgICAgICAgICAgIC8vIExhc3QgcmVzb3J0LlxuICAgICAgICAgICAgICAgIHJldHVybiBkb2N1bWVudC5ib2R5ID8/IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudDtcbiAgICAgICAgfVxuXG4gICAgICAgIHByaXZhdGUgY29udmVydChyYXc6IHN0cmluZywga2luZDogUHJvcEtpbmQpIHtcbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIHJhdyA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHN3aXRjaCAoa2luZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYXNlICdzdHJpbmcnOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiByYXc7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgJ251bWJlcic6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIE51bWJlcihyYXcpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYXNlICdib29sZWFuJzpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmF3ID09PSAndHJ1ZScgfHwgcmF3ID09PSAnMScgfHwgcmF3ID09PSAnJztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSAnY29sb3InOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBuZXcgVENvbG9yKHJhdyk7IC8vIG91IHBhcnNlIGVuIFRDb2xvciBzaSB2b3VzIGF2ZXpcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvLyBQYXJzZSBIVE1MIGF0dHJpYnV0ZXMgaW50byBhIHBsYWluIG9iamVjdFxuICAgICAgICAvLyBUaGlzIGZ1bmN0aW9uIGlzIGNhbGxlZCBqdXN0ZSBvbmNlLCBpbiBidWlsZENvbXBvbmVudFRyZWUoKSwgYWZ0ZXIgdGhlIEZvcm0gaXMgY3JlYXRlZC5cbiAgICAgICAgcGFyc2VQcm9wc0Zyb21FbGVtZW50KGVsOiBFbGVtZW50LCBkZWZQcm9wczogUHJvcFNwZWM8YW55PltdKTogUmVjb3JkPHN0cmluZywgdW5rbm93bj4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IG91dDogUmVjb3JkPHN0cmluZywgdW5rbm93bj4gPSB7fTtcblxuICAgICAgICAgICAgICAgIC8vIDEpIEpTT04gYnVsa1xuICAgICAgICAgICAgICAgIGNvbnN0IHJhdyA9IGVsLmdldEF0dHJpYnV0ZSgnZGF0YS1wcm9wcycpO1xuICAgICAgICAgICAgICAgIGlmIChyYXcpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHIgPSByYXcgPyBKU09OLnBhcnNlKHJhdykgOiB7fTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy9mb3IgKGNvbnN0IHAgb2YgcHJvcHMoKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3IgKGNvbnN0IHNwZWMgb2YgZGVmUHJvcHMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCB2ID0gcltzcGVjLm5hbWVdO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICh2ICE9IHVuZGVmaW5lZCAmJiB2ICE9IG51bGwpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHZhbHVlID0gdGhpcy5jb252ZXJ0KHYsIHNwZWMua2luZCk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG91dFtzcGVjLm5hbWVdID0gdmFsdWU7IC8vIFRoaXMgaXMgZG9uZSBieSBzcGVjLmFwcGx5KClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vc3BlYy5hcHBseShvdXQsIHYpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvL31cbiAgICAgICAgICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcignSW52YWxpZCBKU09OIGluIGRhdGEtcHJvcHMnLCByYXcsIGUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8vIDIpIFdoaXRlbGlzdDogb25seSBkZWNsYXJlZCBwcm9wcyBvdmVycmlkZSAvIGNvbXBsZW1lbnRcbiAgICAgICAgICAgICAgICAvL2NvbnN0IGRlZlByb3BzID0gdGhpcy5jb2xsZWN0RGVmUHJvcHMoKTtcbiAgICAgICAgICAgICAgICBmb3IgKGNvbnN0IHAgb2YgZGVmUHJvcHMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGF0dHIgPSBlbC5nZXRBdHRyaWJ1dGUoYGRhdGEtJHtwLm5hbWV9YCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoYXR0ciAhPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCB4ID0gdGhpcy5jb252ZXJ0KGF0dHIsIHAua2luZCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG91dFtwLm5hbWVdID0geDtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICByZXR1cm4gb3V0O1xuICAgICAgICB9XG5cbiAgICAgICAgY29sbGVjdERlZlByb3BzKGNvbXA6IFRNZXRhQ29tcG9uZW50KTogUHJvcFNwZWM8YW55PltdIHtcbiAgICAgICAgICAgICAgICBjb25zdCBvdXQ6IFByb3BTcGVjPGFueT5bXSA9IFtdO1xuICAgICAgICAgICAgICAgIGNvbnN0IHNlZW4gPSBuZXcgU2V0PHN0cmluZz4oKTtcblxuICAgICAgICAgICAgICAgIC8vIFdhbGsgdXAgbWV0YWNsYXNzIGluaGVyaXRhbmNlOiB0aGlzIC0+IHN1cGVyIC0+IHN1cGVyLi4uXG4gICAgICAgICAgICAgICAgbGV0IG1jOiBUTWV0YUNvbXBvbmVudCB8IG51bGwgPSBjb21wO1xuXG4gICAgICAgICAgICAgICAgd2hpbGUgKG1jKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodHlwZW9mIG1jLmRlZlByb3BzID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvciAoY29uc3Qgc3BlYyBvZiBtYy5kZWZQcm9wcygpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gQ2hpbGQgb3ZlcnJpZGVzIHBhcmVudCBpZiBzYW1lIG5hbWUuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFzZWVuLmhhcyhzcGVjLm5hbWUpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvdXQucHVzaChzcGVjKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNlZW4uYWRkKHNwZWMubmFtZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBtYyA9IChtYy5zdXBlckNsYXNzIGFzIFRNZXRhQ29tcG9uZW50KSA/PyBudWxsO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHJldHVybiBvdXQ7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBUaGlzIGZ1bmN0aW9uIGlzIGNhbGxlZCBqdXN0ZSBvbmNlLCBpbiBidWlsZENvbXBvbmVudFRyZWUoKSwgd2hlbiB0aGUgZm9ybSBpcyBjcmVhdGVkXG5cbiAgICAgICAgYnVpbGRDb21wb25lbnRUcmVlKGZvcm06IFRGb3JtLCBjb21wb25lbnQ6IFRDb21wb25lbnQpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmNsZWFyKCk7XG4gICAgICAgICAgICAgICAgLy8gLS0tIEZPUk0gLS0tXG4gICAgICAgICAgICAgICAgLy8gcHJvdmlzb2lyZW1lbnQgaWYgKHJvb3QuZ2V0QXR0cmlidXRlKCdkYXRhLWNvbXBvbmVudCcpID09PSAnVEZvcm0nKSB7XG5cbiAgICAgICAgICAgICAgICB0aGlzLnJlZ2lzdGVySW5zdGFuY2UoY29tcG9uZW50Lm5hbWUsIGZvcm0pO1xuICAgICAgICAgICAgICAgIC8vfVxuICAgICAgICAgICAgICAgIGNvbnN0IHJvb3QgPSBjb21wb25lbnQuZWxlbSE7XG5cbiAgICAgICAgICAgICAgICAvLyAtLS0gQ0hJTEQgQ09NUE9ORU5UUyAtLS1cbiAgICAgICAgICAgICAgICByb290LnF1ZXJ5U2VsZWN0b3JBbGwoJzpzY29wZSA+IFtkYXRhLWNvbXBvbmVudF0nKS5mb3JFYWNoKChlbCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGVsID09PSByb290KSByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBuYW1lID0gZWwuZ2V0QXR0cmlidXRlKCdkYXRhLW5hbWUnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHR5cGUgPSBlbC5nZXRBdHRyaWJ1dGUoJ2RhdGEtY29tcG9uZW50Jyk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGNscyA9IFRBcHBsaWNhdGlvbi5UaGVBcHBsaWNhdGlvbi50eXBlcy5nZXQodHlwZSEpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFjbHMpIHJldHVybjtcblxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgY2hpbGQ6IFRDb21wb25lbnQgPSBjbHMuY3JlYXRlKG5hbWUhLCBmb3JtLCBjb21wb25lbnQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gbmFtZTogc3RyaW5nLCBmb3JtOiBURm9ybSwgcGFyZW50OiBUQ29tcG9uZW50LCBlbGVtOiBIVE1MRWxlbWVudFxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFjaGlsZCkgcmV0dXJuO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAvL2NoaWxkLnBhcmVudCA9IGNvbXBvbmVudDtcblxuICAgICAgICAgICAgICAgICAgICAgICAgY2hpbGQuZWxlbSA9IGVsO1xuICAgICAgICAgICAgICAgICAgICAgICAgLy9jaGlsZC5mb3JtID0gZm9ybTtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vY2hpbGQubmFtZSA9IG5hbWUhO1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gT3B0aW9uYWwgcHJvcHNcblxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gV2UgY29sbGVjdFxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgYWxsRGVmUHJvcHNDb2xsZWN0ZWQgPSB0aGlzLmNvbGxlY3REZWZQcm9wcyhjbHMpOyAvLyBUaGlzIGlzIGRvbmUgZHVyaW5nIHJ1bnRpbWUsIGJ1dCBjb3VsZCBiZSBkb25lIGF0IGNvbXBpbGV0aW1lXG4gICAgICAgICAgICAgICAgICAgICAgICBjaGlsZC5wcm9wcyA9IHRoaXMucGFyc2VQcm9wc0Zyb21FbGVtZW50KGVsLCBhbGxEZWZQcm9wc0NvbGxlY3RlZCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBjaGlsZC5zeW5jRG9tRnJvbVByb3BzKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAvL2NvbnN0IHJhd1Byb3BzID0gY2hpbGQucmF3UHJvcHM7XG4gICAgICAgICAgICAgICAgICAgICAgICAvL2NoaWxkLnByb3BzID0gbmV3IE9iamVjdCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgLy9mb3IgKGNvbnN0IHByb3BzIGluIGNoaWxkLnByb3BzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvKlxuICAgICAgICAgICAgICAgICAgICAgICAgZm9yIChjb25zdCBzcGVjIG9mIGNscy5hbGxEZWZQcm9wc0NvbGxlY3RlZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBzcGVjTmFtZSA6IHN0cmluZyA9IHNwZWMubmFtZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgdmFsdWUgID0gcmF3UHJvcHNbc3BlY05hbWVdO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvL2lmIChzcGVjLm5hbWUgPT0gcHJvcHNbc3BlYy5uYW1lXSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vc3BlYy5hcHBseShjaGlsZCwgdGhpcy5jb252ZXJ0KHByb3BzW3NwZWMubmFtZV0sIHNwZWMua2luZCkpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHZhbHVlICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNoaWxkLnByb3BzW3Byb3BOYW1lXSA9ICB0aGlzLmNvbnZlcnQodmFsdWUsIHNwZWMua2luZCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzcGVjLmFwcGx5KGNoaWxkLCBjaGlsZC5wcm9wc1twcm9wTmFtZV0gKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIC8vfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICBmb3IgKGNvbnN0IHNwZWMgb2YgY2xzLmFsbERlZlByb3BzQ29sbGVjdGVkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChwcm9wc1tzcGVjLm5hbWVdICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzcGVjLmFwcGx5KGNoaWxkLCBwcm9wc1tzcGVjLm5hbWVdKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICBmb3IgKGNvbnN0IHByb3BzIGluIGNoaWxkLnByb3BzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvciAoY29uc3Qgc3BlYyBvZiBjbHMuZGVmUHJvcHMoKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChwcm9wc1tzcGVjLm5hbWVdICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNwZWMuYXBwbHkoY2hpbGQsIHByb3BzW3NwZWMubmFtZV0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcblxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5hcHBseVByb3BzKGNoaWxkLCBjbHMpO1xuICAgICAgICAgICAgICAgICAgICAgICAgKi9cblxuICAgICAgICAgICAgICAgICAgICAgICAgLy9jb25zdCBwcm9wcyA9IGNscy5hcHBseVByb3BzRnJvbUVsZW1lbnQoY2hpbGQsIGVsKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vY2hpbGQucHJvcHMgPSBwcm9wcztcbiAgICAgICAgICAgICAgICAgICAgICAgIChjaGlsZCBhcyBhbnkpLm9uQXR0YWNoZWRUb0RvbT8uKCk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIC8vdGhpcy5hcHBseVByb3BzKGNoaWxkLCBjbHMpO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5yZWdpc3Rlckluc3RhbmNlKG5hbWUhLCBjaGlsZCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb21wb25lbnQuY2hpbGRyZW4ucHVzaChjaGlsZCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBtYXliZUhvc3QgPSBjaGlsZCBhcyB1bmtub3duIGFzIFBhcnRpYWw8SVBsdWdpbkhvc3Q+O1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG1heWJlSG9zdCAmJiB0eXBlb2YgbWF5YmVIb3N0LnNldFBsdWdpblNwZWMgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgcGx1Z2luID0gZWwuZ2V0QXR0cmlidXRlKCdkYXRhLXBsdWdpbicpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCByYXcgPSBlbC5nZXRBdHRyaWJ1dGUoJ2RhdGEtcHJvcHMnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgcHJvcHMgPSByYXcgPyBKU09OLnBhcnNlKHJhdykgOiB7fTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtYXliZUhvc3Quc2V0UGx1Z2luU3BlYyh7IHBsdWdpbiwgcHJvcHMgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1heWJlSG9zdC5tb3VudFBsdWdpbklmUmVhZHkhKHRoaXMuc2VydmljZXMpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvL21heWJlSG9zdC5tb3VudEZyb21SZWdpc3RyeShzZXJ2aWNlcyk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChjaGlsZC5hbGxvd3NDaGlsZHJlbigpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuYnVpbGRDb21wb25lbnRUcmVlKGZvcm0sIGNoaWxkKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgfVxufVxuXG5leHBvcnQgY2xhc3MgVERvY3VtZW50IGV4dGVuZHMgVE9iamVjdCB7XG4gICAgICAgIHN0YXRpYyBkb2N1bWVudDogVERvY3VtZW50ID0gbmV3IFREb2N1bWVudChkb2N1bWVudCk7XG4gICAgICAgIHN0YXRpYyBib2R5ID0gZG9jdW1lbnQuYm9keTtcbiAgICAgICAgaHRtbERvYzogRG9jdW1lbnQ7XG4gICAgICAgIGNvbnN0cnVjdG9yKGh0bWxEb2M6IERvY3VtZW50KSB7XG4gICAgICAgICAgICAgICAgc3VwZXIoKTtcbiAgICAgICAgICAgICAgICB0aGlzLmh0bWxEb2MgPSBodG1sRG9jO1xuICAgICAgICB9XG59XG5cbmV4cG9ydCBjbGFzcyBUTWV0YURvY3VtZW50IGV4dGVuZHMgVE1ldGFPYmplY3Qge1xuICAgICAgICBzdGF0aWMgcmVhZG9ubHkgbWV0YWNsYXNzOiBUTWV0YURvY3VtZW50ID0gbmV3IFRNZXRhRG9jdW1lbnQoVE1ldGFPYmplY3QubWV0YWNsYXNzKTtcblxuICAgICAgICBwcm90ZWN0ZWQgY29uc3RydWN0b3Ioc3VwZXJDbGFzczogVE1ldGFPYmplY3QpIHtcbiAgICAgICAgICAgICAgICBzdXBlcihzdXBlckNsYXNzKTtcbiAgICAgICAgICAgICAgICAvLyBldCB2b3VzIGNoYW5nZXoganVzdGUgbGUgbm9tIDpcbiAgICAgICAgICAgICAgICAodGhpcyBhcyBhbnkpLnR5cGVOYW1lID0gJ1Rlc3RCJztcbiAgICAgICAgfVxuICAgICAgICBnZXRNZXRhY2xhc3MoKTogVE1ldGFEb2N1bWVudCB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIFRNZXRhRG9jdW1lbnQubWV0YWNsYXNzO1xuICAgICAgICB9XG59XG5cbmV4cG9ydCBjbGFzcyBUTWV0YUZvcm0gZXh0ZW5kcyBUTWV0YUNvbXBvbmVudCB7XG4gICAgICAgIHN0YXRpYyByZWFkb25seSBtZXRhY2xhc3M6IFRNZXRhRm9ybSA9IG5ldyBUTWV0YUZvcm0oVE1ldGFDb21wb25lbnQubWV0YWNsYXNzKTtcbiAgICAgICAgZ2V0TWV0YUNsYXNzKCk6IFRNZXRhRm9ybSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIFRNZXRhRm9ybS5tZXRhY2xhc3M7XG4gICAgICAgIH1cblxuICAgICAgICBwcm90ZWN0ZWQgY29uc3RydWN0b3Ioc3VwZXJDbGFzczogVE1ldGFDb21wb25lbnQpIHtcbiAgICAgICAgICAgICAgICBzdXBlcihzdXBlckNsYXNzKTtcbiAgICAgICAgICAgICAgICAvLyBldCB2b3VzIGNoYW5nZXoganVzdGUgbGUgbm9tIDpcbiAgICAgICAgICAgICAgICAodGhpcyBhcyBhbnkpLnR5cGVOYW1lID0gJ1RDb21wb25lbnQnO1xuICAgICAgICB9XG5cbiAgICAgICAgLy9yZWFkb25seSB0eXBlTmFtZSA9ICdURm9ybSc7XG5cbiAgICAgICAgY3JlYXRlKG5hbWU6IHN0cmluZywgZm9ybTogVEZvcm0sIHBhcmVudDogVENvbXBvbmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBuZXcgVEZvcm0obmFtZSk7XG4gICAgICAgIH1cblxuICAgICAgICBwcm9wcygpOiBQcm9wU3BlYzxURm9ybT5bXSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIFtdO1xuICAgICAgICB9XG59XG5cbmV4cG9ydCBjbGFzcyBURm9ybSBleHRlbmRzIFRDb21wb25lbnQge1xuICAgICAgICBnZXRNZXRhY2xhc3MoKTogVE1ldGFGb3JtIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gVE1ldGFGb3JtLm1ldGFjbGFzcztcbiAgICAgICAgfVxuICAgICAgICBhbGxvd3NDaGlsZHJlbigpOiBib29sZWFuIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICBzdGF0aWMgZm9ybXMgPSBuZXcgTWFwPHN0cmluZywgVEZvcm0+KCk7XG4gICAgICAgIHByaXZhdGUgX21vdW50ZWQgPSBmYWxzZTtcbiAgICAgICAgLy8gRWFjaCBGb3JtIGhhcyBpdHMgb3duIGNvbXBvbmVudFJlZ2lzdHJ5XG4gICAgICAgIGNvbXBvbmVudFJlZ2lzdHJ5OiBUQ29tcG9uZW50UmVnaXN0cnkgPSBuZXcgVENvbXBvbmVudFJlZ2lzdHJ5KCk7XG4gICAgICAgIGNvbnN0cnVjdG9yKG5hbWU6IHN0cmluZykge1xuICAgICAgICAgICAgICAgIHN1cGVyKG5hbWUsIG51bGwsIG51bGwpO1xuICAgICAgICAgICAgICAgIHRoaXMuZm9ybSA9IHRoaXM7XG4gICAgICAgICAgICAgICAgVEZvcm0uZm9ybXMuc2V0KG5hbWUsIHRoaXMpO1xuICAgICAgICB9XG5cbiAgICAgICAgZ2V0IGFwcGxpY2F0aW9uKCk6IFRBcHBsaWNhdGlvbiB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuZm9ybT8uYXBwbGljYXRpb24gPz8gVEFwcGxpY2F0aW9uLlRoZUFwcGxpY2F0aW9uO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gRW5nbGlzaCBjb21tZW50cyBhcyByZXF1ZXN0ZWQuXG5cbiAgICAgICAgZmluZEZvcm1Gcm9tRXZlbnRUYXJnZXQodGFyZ2V0OiBFbGVtZW50KTogVEZvcm0gfCBudWxsIHtcbiAgICAgICAgICAgICAgICAvLyAxKSBGaW5kIHRoZSBuZWFyZXN0IGVsZW1lbnQgdGhhdCBsb29rcyBsaWtlIGEgZm9ybSBjb250YWluZXJcbiAgICAgICAgICAgICAgICBjb25zdCBmb3JtRWxlbSA9IHRhcmdldC5jbG9zZXN0KCdbZGF0YS1jb21wb25lbnQ9XCJURm9ybVwiXVtkYXRhLW5hbWVdJykgYXMgRWxlbWVudCB8IG51bGw7XG4gICAgICAgICAgICAgICAgaWYgKCFmb3JtRWxlbSkgcmV0dXJuIG51bGw7XG5cbiAgICAgICAgICAgICAgICAvLyAyKSBSZXNvbHZlIHRoZSBURm9ybSBpbnN0YW5jZVxuICAgICAgICAgICAgICAgIGNvbnN0IGZvcm1OYW1lID0gZm9ybUVsZW0uZ2V0QXR0cmlidXRlKCdkYXRhLW5hbWUnKTtcbiAgICAgICAgICAgICAgICBpZiAoIWZvcm1OYW1lKSByZXR1cm4gbnVsbDtcblxuICAgICAgICAgICAgICAgIHJldHVybiBURm9ybS5mb3Jtcy5nZXQoZm9ybU5hbWUpID8/IG51bGw7XG4gICAgICAgIH1cblxuICAgICAgICBwcml2YXRlIF9hYzogQWJvcnRDb250cm9sbGVyIHwgbnVsbCA9IG51bGw7XG5cbiAgICAgICAgaW5zdGFsbEV2ZW50Um91dGVyKCkge1xuICAgICAgICAgICAgICAgIHRoaXMuX2FjPy5hYm9ydCgpO1xuICAgICAgICAgICAgICAgIHRoaXMuX2FjID0gbmV3IEFib3J0Q29udHJvbGxlcigpO1xuICAgICAgICAgICAgICAgIGNvbnN0IHsgc2lnbmFsIH0gPSB0aGlzLl9hYztcblxuICAgICAgICAgICAgICAgIGNvbnN0IHJvb3QgPSB0aGlzLmVsZW0gYXMgRWxlbWVudCB8IG51bGw7XG4gICAgICAgICAgICAgICAgaWYgKCFyb290KSByZXR1cm47XG5cbiAgICAgICAgICAgICAgICAvLyBzYW1lIGhhbmRsZXIgZm9yIGV2ZXJ5Ym9keVxuICAgICAgICAgICAgICAgIGNvbnN0IGhhbmRsZXIgPSAoZXY6IEV2ZW50KSA9PiB0aGlzLmRpc3BhdGNoRG9tRXZlbnQoZXYpO1xuXG4gICAgICAgICAgICAgICAgZm9yIChjb25zdCB0eXBlIG9mIFsnY2xpY2snLCAnaW5wdXQnLCAnY2hhbmdlJywgJ2tleWRvd24nXSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcm9vdC5hZGRFdmVudExpc3RlbmVyKHR5cGUsIGhhbmRsZXIsIHsgY2FwdHVyZTogdHJ1ZSwgc2lnbmFsIH0pO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGZvciAoY29uc3QgdHlwZSBpbiB0aGlzLmdldE1ldGFjbGFzcygpLmRvbUV2ZW50cykge1xuICAgICAgICAgICAgICAgICAgICAgICAgcm9vdC5hZGRFdmVudExpc3RlbmVyKHR5cGUsIGhhbmRsZXIsIHsgY2FwdHVyZTogdHJ1ZSwgc2lnbmFsIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGRpc3Bvc2VFdmVudFJvdXRlcigpIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9hYz8uYWJvcnQoKTtcbiAgICAgICAgICAgICAgICB0aGlzLl9hYyA9IG51bGw7XG4gICAgICAgIH1cblxuICAgICAgICBwcml2YXRlIGhhbmRsZUV2ZW50KGV2OiBFdmVudCwgZWw6IEVsZW1lbnQsIGF0dHJpYnV0ZTogc3RyaW5nKTogYm9vbGVhbiB7XG4gICAgICAgICAgICAgICAgY29uc3QgaGFuZGxlck5hbWUgPSBlbC5nZXRBdHRyaWJ1dGUoYXR0cmlidXRlKTtcblxuICAgICAgICAgICAgICAgIC8vIElmIHdlIGZvdW5kIGEgaGFuZGxlciBvbiB0aGlzIGVsZW1lbnQsIGRpc3BhdGNoIGl0XG4gICAgICAgICAgICAgICAgaWYgKGhhbmRsZXJOYW1lICYmIGhhbmRsZXJOYW1lICE9PSAnJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgbmFtZSA9IGVsLmdldEF0dHJpYnV0ZSgnZGF0YS1uYW1lJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBzZW5kZXIgPSBuYW1lID8gKHRoaXMuY29tcG9uZW50UmVnaXN0cnkuZ2V0KG5hbWUpID8/IG51bGwpIDogbnVsbDtcblxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgbWF5YmVNZXRob2QgPSAodGhpcyBhcyBhbnkpW2hhbmRsZXJOYW1lXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgbWF5YmVNZXRob2QgIT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ05PVCBBIE1FVEhPRCcsIGhhbmRsZXJOYW1lKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBJZiBzZW5kZXIgaXMgbWlzc2luZywgZmFsbGJhY2sgdG8gdGhlIGZvcm0gaXRzZWxmIChzYWZlKVxuICAgICAgICAgICAgICAgICAgICAgICAgKG1heWJlTWV0aG9kIGFzIChldmVudDogRXZlbnQsIHNlbmRlcjogYW55KSA9PiBhbnkpLmNhbGwodGhpcywgZXYsIHNlbmRlciA/PyB0aGlzKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBXZSByZWNlaXZlZCBhbiBET00gRXZlbnQuIERpc3BhdGNoIGl0XG4gICAgICAgIHByaXZhdGUgZGlzcGF0Y2hEb21FdmVudChldjogRXZlbnQpIHtcbiAgICAgICAgICAgICAgICBjb25zdCB0YXJnZXRFbGVtID0gZXYudGFyZ2V0IGFzIEVsZW1lbnQgfCBudWxsO1xuICAgICAgICAgICAgICAgIGlmICghdGFyZ2V0RWxlbSkgcmV0dXJuO1xuXG4gICAgICAgICAgICAgICAgY29uc3QgZXZUeXBlID0gZXYudHlwZTtcblxuICAgICAgICAgICAgICAgIGxldCBlbDogRWxlbWVudCB8IG51bGwgPSB0YXJnZXRFbGVtLmNsb3Nlc3QoJ1tkYXRhLWNvbXBvbmVudF0nKTtcbiAgICAgICAgICAgICAgICB3aGlsZSAoZWwpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLmhhbmRsZUV2ZW50KGV2LCBlbCwgYGRhdGEtb24ke2V2VHlwZX1gKSkgcmV0dXJuO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAvL2VsID0gdGhpcy5uZXh0Q29tcG9uZW50RWxlbWVudFVwKGVsKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IG5hbWUgPSBlbC5nZXRBdHRyaWJ1dGUoJ2RhdGEtbmFtZScpO1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgY29tcCA9IG5hbWUgPyB0aGlzLmNvbXBvbmVudFJlZ2lzdHJ5LmdldChuYW1lKSA6IG51bGw7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIFByZWZlciB5b3VyIFZDTC1saWtlIHBhcmVudCBjaGFpbiB3aGVuIGF2YWlsYWJsZVxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgbmV4dCA9IGNvbXA/LnBhcmVudD8uZWxlbSA/PyBudWxsO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBGYWxsYmFjazogc3RhbmRhcmQgRE9NIHBhcmVudFxuICAgICAgICAgICAgICAgICAgICAgICAgZWwgPSBuZXh0ID8/IGVsLnBhcmVudEVsZW1lbnQ/LmNsb3Nlc3QoJ1tkYXRhLWNvbXBvbmVudF0nKSA/PyBudWxsO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8vIE5vIGhhbmRsZXIgaGVyZTogdHJ5IGdvaW5nIFwidXBcIiB1c2luZyB5b3VyIGNvbXBvbmVudCB0cmVlIGlmIHBvc3NpYmxlXG4gICAgICAgIH1cblxuICAgICAgICBzaG93KCkge1xuICAgICAgICAgICAgICAgIC8vIE11c3QgYmUgZG9uZSBiZWZvcmUgYnVpbGRDb21wb25lbnRUcmVlKCkgYmVjYXVzZSBgYnVpbGRDb21wb25lbnRUcmVlKClgIGRvZXMgbm90IGRvIGByZXNvbHZlUm9vdCgpYCBpdHNlbGYuXG4gICAgICAgICAgICAgICAgaWYgKCF0aGlzLmVsZW0pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZWxlbSA9IHRoaXMuY29tcG9uZW50UmVnaXN0cnkucmVzb2x2ZVJvb3QoKTsgLy8gb3UgdGhpcy5yZXNvbHZlUm9vdCgpXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmICghdGhpcy5fbW91bnRlZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5jb21wb25lbnRSZWdpc3RyeS5idWlsZENvbXBvbmVudFRyZWUodGhpcywgdGhpcyk7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLm9uQ3JlYXRlKCk7IC8vIE1heWJlIGNvdWxkIGJlIGRvbmUgYWZ0ZXIgaW5zdGFsbEV2ZW50Um91dGVyKClcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuaW5zdGFsbEV2ZW50Um91dGVyKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl9tb3VudGVkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdGhpcy5vblNob3duKCk7XG5cbiAgICAgICAgICAgICAgICAvLyBUT0RPXG4gICAgICAgIH1cblxuICAgICAgICBwcm90ZWN0ZWQgb25DcmVhdGUoKSB7XG4gICAgICAgICAgICAgICAgY29uc3Qgb25TaG93bk5hbWUgPSB0aGlzLmVsZW0hLmdldEF0dHJpYnV0ZSgnZGF0YS1vbmNyZWF0ZScpO1xuICAgICAgICAgICAgICAgIGlmIChvblNob3duTmFtZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcXVldWVNaWNyb3Rhc2soKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBmbiA9ICh0aGlzIGFzIGFueSlbb25TaG93bk5hbWVdO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAodHlwZW9mIGZuID09PSAnZnVuY3Rpb24nKSBmbi5jYWxsKHRoaXMsIG51bGwsIHRoaXMpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcHJvdGVjdGVkIG9uU2hvd24oKSB7XG4gICAgICAgICAgICAgICAgY29uc3Qgb25TaG93bk5hbWUgPSB0aGlzLmVsZW0hLmdldEF0dHJpYnV0ZSgnZGF0YS1vbnNob3duJyk7XG4gICAgICAgICAgICAgICAgaWYgKG9uU2hvd25OYW1lKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBxdWV1ZU1pY3JvdGFzaygoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGZuID0gKHRoaXMgYXMgYW55KVtvblNob3duTmFtZV07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgZm4gPT09ICdmdW5jdGlvbicpIGZuLmNhbGwodGhpcywgbnVsbCwgdGhpcyk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgIH1cbn1cblxudHlwZSBCdXR0b25Qcm9wcyA9IENvbXBvbmVudFByb3BzICYge1xuICAgICAgICBjYXB0aW9uPzogc3RyaW5nO1xuICAgICAgICBlbmFibGVkPzogYm9vbGVhbjtcbiAgICAgICAgLy9jb2xvcj86IFRDb2xvcjsgLy8gb3UgVENvbG9yLCBldGMuXG59O1xuXG5leHBvcnQgY2xhc3MgVEJ1dHRvbiBleHRlbmRzIFRDb21wb25lbnQge1xuICAgICAgICBnZXRNZXRhY2xhc3MoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIFRNZXRhQnV0dG9uLm1ldGFjbGFzcztcbiAgICAgICAgfVxuXG4gICAgICAgIGh0bWxCdXR0b24oKTogSFRNTEJ1dHRvbkVsZW1lbnQge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmh0bWxFbGVtZW50ISBhcyBIVE1MQnV0dG9uRWxlbWVudDtcbiAgICAgICAgfVxuXG4gICAgICAgIHByb3RlY3RlZCBnZXQgYnByb3BzKCk6IEJ1dHRvblByb3BzIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5wcm9wcyBhcyBCdXR0b25Qcm9wcztcbiAgICAgICAgfVxuXG4gICAgICAgIGdldCBjYXB0aW9uKCk6IHN0cmluZyB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuYnByb3BzLmNhcHRpb24gPz8gJyc7XG4gICAgICAgIH1cbiAgICAgICAgc2V0IGNhcHRpb24oY2FwdGlvbjogc3RyaW5nKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5icHJvcHMuY2FwdGlvbiA9IGNhcHRpb247XG4gICAgICAgICAgICAgICAgY29uc3QgZWwgPSB0aGlzLmh0bWxFbGVtZW50O1xuICAgICAgICAgICAgICAgIGlmICghZWwpIHJldHVybjtcbiAgICAgICAgICAgICAgICBlbC50ZXh0Q29udGVudCA9IHRoaXMuY2FwdGlvbjtcbiAgICAgICAgfVxuXG4gICAgICAgIGdldCBlbmFibGVkKCk6IGJvb2xlYW4ge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmJwcm9wcy5lbmFibGVkID8/IHRydWU7XG4gICAgICAgIH1cbiAgICAgICAgc2V0IGVuYWJsZWQoZW5hYmxlZCkge1xuICAgICAgICAgICAgICAgIHRoaXMuYnByb3BzLmVuYWJsZWQgPSBlbmFibGVkO1xuICAgICAgICAgICAgICAgIHRoaXMuaHRtbEJ1dHRvbigpLmRpc2FibGVkID0gIWVuYWJsZWQ7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdHJ1Y3RvcihuYW1lOiBzdHJpbmcsIGZvcm06IFRGb3JtLCBwYXJlbnQ6IFRDb21wb25lbnQpIHtcbiAgICAgICAgICAgICAgICBzdXBlcihuYW1lLCBmb3JtLCBwYXJlbnQpO1xuICAgICAgICB9XG4gICAgICAgIHN5bmNEb21Gcm9tUHJvcHMoKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgZWwgPSB0aGlzLmh0bWxFbGVtZW50O1xuICAgICAgICAgICAgICAgIGlmICghZWwpIHJldHVybjtcblxuICAgICAgICAgICAgICAgIGVsLnRleHRDb250ZW50ID0gdGhpcy5jYXB0aW9uO1xuICAgICAgICAgICAgICAgIHRoaXMuaHRtbEJ1dHRvbigpLmRpc2FibGVkID0gIXRoaXMuZW5hYmxlZDtcbiAgICAgICAgICAgICAgICBzdXBlci5zeW5jRG9tRnJvbVByb3BzKCk7XG4gICAgICAgIH1cbn1cblxuZXhwb3J0IGNsYXNzIFRNZXRhQnV0dG9uIGV4dGVuZHMgVE1ldGFDb21wb25lbnQge1xuICAgICAgICBzdGF0aWMgcmVhZG9ubHkgbWV0YWNsYXNzOiBUTWV0YUJ1dHRvbiA9IG5ldyBUTWV0YUJ1dHRvbihUTWV0YUNvbXBvbmVudC5tZXRhY2xhc3MpO1xuXG4gICAgICAgIHByb3RlY3RlZCBjb25zdHJ1Y3RvcihzdXBlckNsYXNzOiBUTWV0YUNvbXBvbmVudCkge1xuICAgICAgICAgICAgICAgIHN1cGVyKHN1cGVyQ2xhc3MpO1xuICAgICAgICAgICAgICAgIC8vIGV0IHZvdXMgY2hhbmdleiBqdXN0ZSBsZSBub20gOlxuICAgICAgICAgICAgICAgICh0aGlzIGFzIGFueSkudHlwZU5hbWUgPSAnVEJ1dHRvbic7XG4gICAgICAgIH1cbiAgICAgICAgZ2V0TWV0YWNsYXNzKCk6IFRNZXRhQnV0dG9uIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gVE1ldGFCdXR0b24ubWV0YWNsYXNzO1xuICAgICAgICB9XG5cbiAgICAgICAgcmVhZG9ubHkgdHlwZU5hbWUgPSAnVEJ1dHRvbic7XG5cbiAgICAgICAgY3JlYXRlKG5hbWU6IHN0cmluZywgZm9ybTogVEZvcm0sIHBhcmVudDogVENvbXBvbmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBuZXcgVEJ1dHRvbihuYW1lLCBmb3JtLCBwYXJlbnQpO1xuICAgICAgICB9XG5cbiAgICAgICAgZGVmUHJvcHMoKTogUHJvcFNwZWM8VEJ1dHRvbj5bXSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIFtcbiAgICAgICAgICAgICAgICAgICAgICAgIHsgbmFtZTogJ2NhcHRpb24nLCBraW5kOiAnc3RyaW5nJywgYXBwbHk6IChvLCB2KSA9PiAoby5jYXB0aW9uID0gU3RyaW5nKHYpKSB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgeyBuYW1lOiAnZW5hYmxlZCcsIGtpbmQ6ICdib29sZWFuJywgYXBwbHk6IChvLCB2KSA9PiAoby5lbmFibGVkID0gQm9vbGVhbih2KSkgfVxuICAgICAgICAgICAgICAgIF07XG4gICAgICAgIH1cbn1cblxuZXhwb3J0IGNsYXNzIFRNZXRhQXBwbGljYXRpb24gZXh0ZW5kcyBUTWV0YWNsYXNzIHtcbiAgICAgICAgc3RhdGljIHJlYWRvbmx5IG1ldGFjbGFzczogVE1ldGFBcHBsaWNhdGlvbiA9IG5ldyBUTWV0YUFwcGxpY2F0aW9uKFRNZXRhY2xhc3MubWV0YWNsYXNzKTtcblxuICAgICAgICBwcm90ZWN0ZWQgY29uc3RydWN0b3Ioc3VwZXJDbGFzczogVE1ldGFjbGFzcykge1xuICAgICAgICAgICAgICAgIHN1cGVyKHN1cGVyQ2xhc3MsICdUQXBwbGljYXRpb24nKTtcbiAgICAgICAgfVxuICAgICAgICBnZXRNZXRhY2xhc3MoKTogVE1ldGFBcHBsaWNhdGlvbiB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIFRNZXRhQXBwbGljYXRpb24ubWV0YWNsYXNzO1xuICAgICAgICB9XG59XG5cbmV4cG9ydCBjbGFzcyBUQXBwbGljYXRpb24ge1xuICAgICAgICBnZXRNZXRhY2xhc3MoKTogVE1ldGFBcHBsaWNhdGlvbiB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIFRNZXRhQXBwbGljYXRpb24ubWV0YWNsYXNzO1xuICAgICAgICB9XG4gICAgICAgIHN0YXRpYyBUaGVBcHBsaWNhdGlvbjogVEFwcGxpY2F0aW9uO1xuICAgICAgICAvL3N0YXRpYyBwbHVnaW5SZWdpc3RyeSA9IG5ldyBQbHVnaW5SZWdpc3RyeSgpO1xuICAgICAgICAvL3BsdWdpbnM6IElQbHVnaW5SZWdpc3RyeTtcbiAgICAgICAgcHJpdmF0ZSBmb3JtczogVEZvcm1bXSA9IFtdO1xuICAgICAgICByZWFkb25seSB0eXBlcyA9IG5ldyBUQ29tcG9uZW50VHlwZVJlZ2lzdHJ5KCk7XG4gICAgICAgIG1haW5Gb3JtOiBURm9ybSB8IG51bGwgPSBudWxsO1xuXG4gICAgICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICAgICAgICAgIFRBcHBsaWNhdGlvbi5UaGVBcHBsaWNhdGlvbiA9IHRoaXM7XG4gICAgICAgICAgICAgICAgcmVnaXN0ZXJCdWlsdGlucyh0aGlzLnR5cGVzKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNyZWF0ZUZvcm08VCBleHRlbmRzIFRGb3JtPihjdG9yOiBuZXcgKC4uLmFyZ3M6IGFueVtdKSA9PiBULCBuYW1lOiBzdHJpbmcpOiBUIHtcbiAgICAgICAgICAgICAgICBjb25zdCBmID0gbmV3IGN0b3IobmFtZSk7XG4gICAgICAgICAgICAgICAgdGhpcy5mb3Jtcy5wdXNoKGYpO1xuICAgICAgICAgICAgICAgIGlmICghdGhpcy5tYWluRm9ybSkgdGhpcy5tYWluRm9ybSA9IGY7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGY7XG4gICAgICAgIH1cblxuICAgICAgICBydW4oKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5ydW5XaGVuRG9tUmVhZHkoKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMubWFpbkZvcm0pIHRoaXMubWFpbkZvcm0uc2hvdygpO1xuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSB0aGlzLmF1dG9TdGFydCgpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgcHJvdGVjdGVkIGF1dG9TdGFydCgpIHtcbiAgICAgICAgICAgICAgICAvLyBmYWxsYmFjazogY2hvaXNpciB1bmUgZm9ybSBlbnJlZ2lzdHJcdTAwRTllLCBvdSBjclx1MDBFOWVyIHVuZSBmb3JtIGltcGxpY2l0ZVxuICAgICAgICB9XG5cbiAgICAgICAgcnVuV2hlbkRvbVJlYWR5KGZuOiAoKSA9PiB2b2lkKSB7XG4gICAgICAgICAgICAgICAgaWYgKGRvY3VtZW50LnJlYWR5U3RhdGUgPT09ICdsb2FkaW5nJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ0RPTUNvbnRlbnRMb2FkZWQnLCBmbiwgeyBvbmNlOiB0cnVlIH0pO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBmbigpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgfVxufVxuXG4vLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0gUExVR0lOSE9TVCA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4vKlxuXG5leHBvcnQgY2xhc3MgVnVlQ29tcG9uZW50IGV4dGVuZHMgVENvbXBvbmVudCB7fVxuXG5leHBvcnQgY2xhc3MgUmVhY3RDb21wb25lbnQgZXh0ZW5kcyBUQ29tcG9uZW50IHt9XG5cbmV4cG9ydCBjbGFzcyBTdmVsdGVDb21wb25lbnQgZXh0ZW5kcyBUQ29tcG9uZW50IHt9XG5cbmV4cG9ydCBjbGFzcyBQbHVnaW5Ib3N0PFByb3BzIGV4dGVuZHMgSnNvbiA9IEpzb24+IGV4dGVuZHMgVENvbXBvbmVudCB7XG4gICAgICAgIHByaXZhdGUgcGx1Z2luOiBQbHVnaW48UHJvcHM+O1xuICAgICAgICBwcml2YXRlIHNlcnZpY2VzOiBEZWxwaGluZVNlcnZpY2VzO1xuICAgICAgICBwcml2YXRlIG1vdW50ZWQgPSBmYWxzZTtcblxuICAgICAgICBjb25zdHJ1Y3RvcihwbHVnaW46IFVJUGx1Z2luPFByb3BzPiwgc2VydmljZXM6IERlbHBoaW5lU2VydmljZXMpIHtcbiAgICAgICAgICAgICAgICBzdXBlcigndG90bycsIG51bGwsIG51bGwpO1xuICAgICAgICAgICAgICAgIHRoaXMucGx1Z2luID0gcGx1Z2luO1xuICAgICAgICAgICAgICAgIHRoaXMuc2VydmljZXMgPSBzZXJ2aWNlcztcbiAgICAgICAgfVxuXG4gICAgICAgIG1vdW50KHByb3BzOiBQcm9wcykge1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLm1vdW50ZWQpIHRocm93IG5ldyBFcnJvcignUGx1Z2luIGFscmVhZHkgbW91bnRlZCcpO1xuICAgICAgICAgICAgICAgIC8vdGhpcy5wbHVnaW4ubW91bnQodGhpcy5odG1sRWxlbWVudCwgcHJvcHMsIHRoaXMuc2VydmljZXMpO1xuICAgICAgICAgICAgICAgIHRoaXMubW91bnRlZCA9IHRydWU7XG4gICAgICAgIH1cblxuICAgICAgICB1cGRhdGUocHJvcHM6IFByb3BzKSB7XG4gICAgICAgICAgICAgICAgaWYgKCF0aGlzLm1vdW50ZWQpIHRocm93IG5ldyBFcnJvcignUGx1Z2luIG5vdCBtb3VudGVkJyk7XG4gICAgICAgICAgICAgICAgdGhpcy5wbHVnaW4udXBkYXRlKHByb3BzKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHVubW91bnQoKSB7XG4gICAgICAgICAgICAgICAgaWYgKCF0aGlzLm1vdW50ZWQpIHJldHVybjtcbiAgICAgICAgICAgICAgICB0aGlzLnBsdWdpbi51bm1vdW50KCk7XG4gICAgICAgICAgICAgICAgdGhpcy5tb3VudGVkID0gZmFsc2U7XG4gICAgICAgIH1cbn1cbiAgICAgICAgKi9cblxuZXhwb3J0IGNsYXNzIFRNZXRhUGx1Z2luSG9zdCBleHRlbmRzIFRNZXRhQ29tcG9uZW50IHtcbiAgICAgICAgc3RhdGljIG1ldGFDbGFzcyA9IG5ldyBUTWV0YVBsdWdpbkhvc3QoVE1ldGFDb21wb25lbnQubWV0YWNsYXNzKTtcbiAgICAgICAgZ2V0TWV0YUNsYXNzKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBUTWV0YVBsdWdpbkhvc3QubWV0YUNsYXNzO1xuICAgICAgICB9XG4gICAgICAgIHJlYWRvbmx5IHR5cGVOYW1lID0gJ1RQbHVnaW5Ib3N0JztcblxuICAgICAgICBjcmVhdGUobmFtZTogc3RyaW5nLCBmb3JtOiBURm9ybSwgcGFyZW50OiBUQ29tcG9uZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBUUGx1Z2luSG9zdChuYW1lLCBmb3JtLCBwYXJlbnQpO1xuICAgICAgICB9XG5cbiAgICAgICAgcHJvcHMoKTogUHJvcFNwZWM8VFBsdWdpbkhvc3Q+W10ge1xuICAgICAgICAgICAgICAgIHJldHVybiBbXTtcbiAgICAgICAgfVxufVxuXG5leHBvcnQgY2xhc3MgVFBsdWdpbkhvc3QgZXh0ZW5kcyBUQ29tcG9uZW50IHtcbiAgICAgICAgcHJpdmF0ZSBpbnN0YW5jZTogVUlQbHVnaW5JbnN0YW5jZSB8IG51bGwgPSBudWxsO1xuXG4gICAgICAgIHBsdWdpbk5hbWU6IHN0cmluZyB8IG51bGwgPSBudWxsO1xuICAgICAgICBwbHVnaW5Qcm9wczogSnNvbiA9IHt9O1xuICAgICAgICBwcml2YXRlIGZhY3Rvcnk6IFVJUGx1Z2luRmFjdG9yeSB8IG51bGwgPSBudWxsO1xuXG4gICAgICAgIGNvbnN0cnVjdG9yKG5hbWU6IHN0cmluZywgZm9ybTogVEZvcm0sIHBhcmVudDogVENvbXBvbmVudCkge1xuICAgICAgICAgICAgICAgIHN1cGVyKG5hbWUsIGZvcm0sIHBhcmVudCk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBDYWxsZWQgYnkgdGhlIG1ldGFjbGFzcyAob3IgYnkgeW91ciByZWdpc3RyeSkgcmlnaHQgYWZ0ZXIgY3JlYXRpb25cbiAgICAgICAgc2V0UGx1Z2luRmFjdG9yeShmYWN0b3J5OiBVSVBsdWdpbkZhY3RvcnkpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmZhY3RvcnkgPSBmYWN0b3J5O1xuICAgICAgICB9XG5cbiAgICAgICAgbW91bnRQbHVnaW4ocHJvcHM6IEpzb24sIHNlcnZpY2VzOiBEZWxwaGluZVNlcnZpY2VzKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgY29udGFpbmVyID0gdGhpcy5odG1sRWxlbWVudDtcbiAgICAgICAgICAgICAgICBpZiAoIWNvbnRhaW5lcikgcmV0dXJuO1xuXG4gICAgICAgICAgICAgICAgaWYgKCF0aGlzLmZhY3RvcnkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlcnZpY2VzLmxvZy53YXJuKCdUUGx1Z2luSG9zdDogbm8gcGx1Z2luIGZhY3Rvcnkgc2V0JywgeyBob3N0OiB0aGlzLm5hbWUgYXMgYW55IH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8vIERpc3Bvc2Ugb2xkIGluc3RhbmNlIGlmIGFueVxuICAgICAgICAgICAgICAgIHRoaXMudW5tb3VudCgpO1xuXG4gICAgICAgICAgICAgICAgLy8gQ3JlYXRlIHBsdWdpbiBpbnN0YW5jZSB0aGVuIG1vdW50XG4gICAgICAgICAgICAgICAgdGhpcy5pbnN0YW5jZSA9IHRoaXMuZmFjdG9yeSh7IGhvc3Q6IHRoaXMsIGZvcm06IHRoaXMuZm9ybSEgfSk7XG4gICAgICAgICAgICAgICAgdGhpcy5pbnN0YW5jZSEubW91bnQoY29udGFpbmVyLCBwcm9wcywgc2VydmljZXMpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gQ2FsbGVkIGJ5IGJ1aWxkQ29tcG9uZW50VHJlZSgpXG4gICAgICAgIHNldFBsdWdpblNwZWMoc3BlYzogeyBwbHVnaW46IHN0cmluZyB8IG51bGw7IHByb3BzOiBhbnkgfSkge1xuICAgICAgICAgICAgICAgIHRoaXMucGx1Z2luTmFtZSA9IHNwZWMucGx1Z2luO1xuICAgICAgICAgICAgICAgIHRoaXMucGx1Z2luUHJvcHMgPSBzcGVjLnByb3BzID8/IHt9O1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gQ2FsbGVkIGJ5IGJ1aWxkQ29tcG9uZW50VHJlZSgpXG4gICAgICAgIG1vdW50UGx1Z2luSWZSZWFkeShzZXJ2aWNlczogRGVscGhpbmVTZXJ2aWNlcykge1xuICAgICAgICAgICAgICAgIGNvbnN0IGNvbnRhaW5lciA9IHRoaXMuaHRtbEVsZW1lbnQ7XG4gICAgICAgICAgICAgICAgaWYgKCFjb250YWluZXIgfHwgIXRoaXMuZm9ybSB8fCAhdGhpcy5wbHVnaW5OYW1lKSByZXR1cm47XG5cbiAgICAgICAgICAgICAgICBjb25zdCBhcHAgPSBUQXBwbGljYXRpb24uVGhlQXBwbGljYXRpb247IC8vIG91IHVuIGFjY1x1MDBFOHMgXHUwMEU5cXVpdmFsZW50XG4gICAgICAgICAgICAgICAgY29uc3QgZGVmID0gUGx1Z2luUmVnaXN0cnkucGx1Z2luUmVnaXN0cnkuZ2V0KHRoaXMucGx1Z2luTmFtZSk7XG5cbiAgICAgICAgICAgICAgICBpZiAoIWRlZikge1xuICAgICAgICAgICAgICAgICAgICAgICAgc2VydmljZXMubG9nLndhcm4oJ1Vua25vd24gcGx1Z2luJywgeyBwbHVnaW46IHRoaXMucGx1Z2luTmFtZSBhcyBhbnkgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgdGhpcy51bm1vdW50KCk7XG4gICAgICAgICAgICAgICAgdGhpcy5pbnN0YW5jZSA9IGRlZi5mYWN0b3J5KHsgaG9zdDogdGhpcywgZm9ybTogdGhpcy5mb3JtIH0pO1xuICAgICAgICAgICAgICAgIHRoaXMuaW5zdGFuY2UhLm1vdW50KGNvbnRhaW5lciwgdGhpcy5wbHVnaW5Qcm9wcywgc2VydmljZXMpO1xuICAgICAgICB9XG5cbiAgICAgICAgdXBkYXRlKHByb3BzOiBhbnkpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnBsdWdpblByb3BzID0gcHJvcHM7XG4gICAgICAgICAgICAgICAgdGhpcy5pbnN0YW5jZT8udXBkYXRlKHByb3BzKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHVubW91bnQoKSB7XG4gICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuaW5zdGFuY2U/LnVubW91bnQoKTtcbiAgICAgICAgICAgICAgICB9IGZpbmFsbHkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5pbnN0YW5jZSA9IG51bGw7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICB9XG59XG5cbmV4cG9ydCB0eXBlIFVJUGx1Z2luRmFjdG9yeTxQcm9wcyBleHRlbmRzIEpzb24gPSBKc29uPiA9IChhcmdzOiB7IGhvc3Q6IFRQbHVnaW5Ib3N0OyBmb3JtOiBURm9ybSB9KSA9PiBVSVBsdWdpbkluc3RhbmNlPFByb3BzPjtcblxuZXhwb3J0IGludGVyZmFjZSBTaXplSGludHMge1xuICAgICAgICBtaW5XaWR0aD86IG51bWJlcjtcbiAgICAgICAgbWluSGVpZ2h0PzogbnVtYmVyO1xuICAgICAgICBwcmVmZXJyZWRXaWR0aD86IG51bWJlcjtcbiAgICAgICAgcHJlZmVycmVkSGVpZ2h0PzogbnVtYmVyO1xufVxuXG5leHBvcnQgdHlwZSBVSVBsdWdpbkRlZiA9IHtcbiAgICAgICAgZmFjdG9yeTogVUlQbHVnaW5GYWN0b3J5O1xuICAgICAgICAvLyBvcHRpb25uZWwgOiB1biBzY2hcdTAwRTltYSBkZSBwcm9wcywgYWlkZSBhdSBkZXNpZ25lclxuICAgICAgICAvLyBwcm9wcz86IFByb3BTY2hlbWE7XG59O1xuXG5leHBvcnQgY2xhc3MgUGx1Z2luUmVnaXN0cnkge1xuICAgICAgICBzdGF0aWMgcGx1Z2luUmVnaXN0cnkgPSBuZXcgUGx1Z2luUmVnaXN0cnkoKTtcbiAgICAgICAgcHJpdmF0ZSByZWFkb25seSBwbHVnaW5zID0gbmV3IE1hcDxzdHJpbmcsIFVJUGx1Z2luRGVmPigpO1xuXG4gICAgICAgIHJlZ2lzdGVyKG5hbWU6IHN0cmluZywgZGVmOiBVSVBsdWdpbkRlZikge1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLnBsdWdpbnMuaGFzKG5hbWUpKSB0aHJvdyBuZXcgRXJyb3IoYFBsdWdpbiBhbHJlYWR5IHJlZ2lzdGVyZWQ6ICR7bmFtZX1gKTtcbiAgICAgICAgICAgICAgICB0aGlzLnBsdWdpbnMuc2V0KG5hbWUsIGRlZik7XG4gICAgICAgIH1cblxuICAgICAgICBnZXQobmFtZTogc3RyaW5nKTogVUlQbHVnaW5EZWYgfCB1bmRlZmluZWQge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLnBsdWdpbnMuZ2V0KG5hbWUpO1xuICAgICAgICB9XG5cbiAgICAgICAgaGFzKG5hbWU6IHN0cmluZyk6IGJvb2xlYW4ge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLnBsdWdpbnMuaGFzKG5hbWUpO1xuICAgICAgICB9XG59XG4iLCAiZXhwb3J0IGNsYXNzIE1ldGFSb290IHtcbiAgICAgICAgc3RhdGljIHJlYWRvbmx5IG1ldGFjbGFzczogTWV0YVJvb3QgPSBuZXcgTWV0YVJvb3QobnVsbCk7XG5cbiAgICAgICAgcmVhZG9ubHkgc3VwZXJDbGFzczogTWV0YVJvb3QgfCBudWxsO1xuICAgICAgICByZWFkb25seSB0eXBlTmFtZTogc3RyaW5nO1xuXG4gICAgICAgIHByb3RlY3RlZCBjb25zdHJ1Y3RvcihzdXBlckNsYXNzOiBNZXRhUm9vdCB8IG51bGwsIHR5cGVOYW1lID0gJ1RNZXRhUm9vdCcpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnN1cGVyQ2xhc3MgPSBzdXBlckNsYXNzO1xuICAgICAgICAgICAgICAgIHRoaXMudHlwZU5hbWUgPSB0eXBlTmFtZTtcbiAgICAgICAgfVxuICAgICAgICBnZXRNZXRhY2xhc3MoKTogTWV0YVJvb3Qge1xuICAgICAgICAgICAgICAgIHJldHVybiBNZXRhUm9vdC5tZXRhY2xhc3M7XG4gICAgICAgIH1cbn1cblxuZXhwb3J0IGNsYXNzIE1ldGFUZXN0QSBleHRlbmRzIE1ldGFSb290IHtcbiAgICAgICAgc3RhdGljIHJlYWRvbmx5IG1ldGFjbGFzczogTWV0YVRlc3RBID0gbmV3IE1ldGFUZXN0QShNZXRhUm9vdC5tZXRhY2xhc3MpO1xuXG4gICAgICAgIHByb3RlY3RlZCBjb25zdHJ1Y3RvcihzdXBlckNsYXNzOiBNZXRhUm9vdCkge1xuICAgICAgICAgICAgICAgIHN1cGVyKHN1cGVyQ2xhc3MsICdUZXN0QScpO1xuICAgICAgICB9XG4gICAgICAgIGdldE1ldGFjbGFzcygpOiBNZXRhVGVzdEEge1xuICAgICAgICAgICAgICAgIHJldHVybiBNZXRhVGVzdEEubWV0YWNsYXNzO1xuICAgICAgICB9XG59XG5cbmV4cG9ydCBjbGFzcyBNZXRhVGVzdEIgZXh0ZW5kcyBNZXRhVGVzdEEge1xuICAgICAgICBzdGF0aWMgcmVhZG9ubHkgbWV0YWNsYXNzOiBNZXRhVGVzdEIgPSBuZXcgTWV0YVRlc3RCKE1ldGFUZXN0QS5tZXRhY2xhc3MpO1xuXG4gICAgICAgIHByb3RlY3RlZCBjb25zdHJ1Y3RvcihzdXBlckNsYXNzOiBNZXRhVGVzdEEpIHtcbiAgICAgICAgICAgICAgICBzdXBlcihzdXBlckNsYXNzKTtcbiAgICAgICAgICAgICAgICAvLyBldCB2b3VzIGNoYW5nZXoganVzdGUgbGUgbm9tIDpcbiAgICAgICAgICAgICAgICAodGhpcyBhcyBhbnkpLnR5cGVOYW1lID0gJ1Rlc3RCJztcbiAgICAgICAgfVxuICAgICAgICBnZXRNZXRhY2xhc3MoKTogTWV0YVRlc3RCIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gTWV0YVRlc3RCLm1ldGFjbGFzcztcbiAgICAgICAgfVxufVxuXG5leHBvcnQgY2xhc3MgTWV0YVRlc3RDIGV4dGVuZHMgTWV0YVRlc3RCIHtcbiAgICAgICAgc3RhdGljIHJlYWRvbmx5IG1ldGFjbGFzczogTWV0YVRlc3RDID0gbmV3IE1ldGFUZXN0QyhNZXRhVGVzdEIubWV0YWNsYXNzKTtcblxuICAgICAgICBwcm90ZWN0ZWQgY29uc3RydWN0b3Ioc3VwZXJDbGFzczogTWV0YVRlc3RCKSB7XG4gICAgICAgICAgICAgICAgc3VwZXIoc3VwZXJDbGFzcyk7XG4gICAgICAgICAgICAgICAgKHRoaXMgYXMgYW55KS50eXBlTmFtZSA9ICdUZXN0Qyc7XG4gICAgICAgIH1cblxuICAgICAgICBnZXRNZXRhY2xhc3MoKTogTWV0YVRlc3RDIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gTWV0YVRlc3RDLm1ldGFjbGFzcztcbiAgICAgICAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gdGVzdCgpIHtcbiAgICAgICAgbGV0IGM6IE1ldGFSb290IHwgbnVsbCA9IE1ldGFUZXN0Qy5tZXRhY2xhc3M7XG4gICAgICAgIHdoaWxlIChjKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coYCR7Yy5nZXRNZXRhY2xhc3MoKS50eXBlTmFtZX0gLSAke2MudHlwZU5hbWV9IC0+ICR7Yy5zdXBlckNsYXNzPy50eXBlTmFtZX1gKTtcbiAgICAgICAgICAgICAgICBjID0gYy5zdXBlckNsYXNzO1xuICAgICAgICB9XG59XG4iLCAiLy8vIDxyZWZlcmVuY2UgbGliPVwiZG9tXCIgLz5cbmNvbnNvbGUubG9nKCdJIEFNIFpBWkEnKTtcbi8vaW1wb3J0IHsgaW5zdGFsbERlbHBoaW5lUnVudGltZSB9IGZyb20gXCIuL3NyYy9kcnRcIjsgLy8gPC0tIFRTLCBwYXMgLmpzXG5pbXBvcnQgeyBURm9ybSwgVENvbG9yLCBUQXBwbGljYXRpb24sIFRDb21wb25lbnQsIFRCdXR0b24gfSBmcm9tICdAdmNsJztcbmltcG9ydCB7IHRlc3QgfSBmcm9tICcuL3Rlc3QnO1xuXG4vL2ltcG9ydCB7IENvbXBvbmVudFR5cGVSZWdpc3RyeSB9IGZyb20gJ0B2Y2wvU3RkQ3RybHMnO1xuLy9pbXBvcnQgeyBDb21wb25lbnRSZWdpc3RyeSB9IGZyb20gJ0BkcnQvQ29tcG9uZW50UmVnaXN0cnknO1xuLy9pbXBvcnQgeyBUUGx1Z2luSG9zdCB9IGZyb20gJ0BkcnQvVUlQbHVnaW4nO1xuLypcbmV4cG9ydCBmdW5jdGlvbiByZWdpc3RlclBsdWdpblR5cGVzKHJlZzogQ29tcG9uZW50VHlwZVJlZ2lzdHJ5KTogdm9pZCB7XG4gICAgICAgIC8gKlxuICAgICAgICAvLyBFeGFtcGxlOiBhbnkgdHlwZSBuYW1lIGNhbiBiZSBwcm92aWRlZCBieSBhIHBsdWdpbi5cbiAgICAgICAgcmVnLnJlZ2lzdGVyLnJlZ2lzdGVyVHlwZSgnY2hhcnRqcy1waWUnLCAobmFtZTogc3RyaW5nLCBmb3JtOiBURm9ybSwgcGFyZW50OiBUQ29tcG9uZW50KSA9PiB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBQbHVnaW5Ib3N0KG5hbWUsIGZvcm0sIHBhcmVudCk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHJlZy5yZWdpc3RlclR5cGUoJ3Z1ZS1oZWxsbycsIChuYW1lOiBzdHJpbmcsIGZvcm06IFRGb3JtLCBwYXJlbnQ6IFRDb21wb25lbnQpID0+IHtcbiAgICAgICAgICAgICAgICByZXR1cm4gbmV3IFBsdWdpbkhvc3QobmFtZSwgZm9ybSwgcGFyZW50KTtcbiAgICAgICAgfSk7XG4gICAgICAgICogL1xufVxuKi9cbmNvbnNvbGUubG9nKCdJIEFNIFpBWkEnKTtcblxuY2xhc3MgWmF6YSBleHRlbmRzIFRGb3JtIHtcbiAgICAgICAgLy8gRm9ybSBjb21wb25lbnRzIC0gVGhpcyBsaXN0IGlzIGF1dG8gZ2VuZXJhdGVkIGJ5IERlbHBoaW5lXG4gICAgICAgIC8vIC0tLS0tLS0tLS0tLS0tLVxuICAgICAgICAvL2J1dHRvbjEgOiBUQnV0dG9uID0gbmV3IFRCdXR0b24oXCJidXR0b24xXCIsIHRoaXMsIHRoaXMpO1xuICAgICAgICAvL2J1dHRvbjIgOiBUQnV0dG9uID0gbmV3IFRCdXR0b24oXCJidXR0b24yXCIsIHRoaXMsIHRoaXMpO1xuICAgICAgICAvL2J1dHRvbjMgOiBUQnV0dG9uID0gbmV3IFRCdXR0b24oXCJidXR0b24zXCIsIHRoaXMsIHRoaXMpO1xuICAgICAgICAvLyAtLS0tLS0tLS0tLS0tLS1cblxuICAgICAgICBjb25zdHJ1Y3RvcihuYW1lOiBzdHJpbmcpIHtcbiAgICAgICAgICAgICAgICBzdXBlcihuYW1lKTtcbiAgICAgICAgfVxuICAgICAgICAvL2ltcG9ydCB7IGluc3RhbGxEZWxwaGluZVJ1bnRpbWUgfSBmcm9tIFwiLi9kcnRcIjtcblxuICAgICAgICAvKlxuY29uc3QgcnVudGltZSA9IHsgICBcbiAgaGFuZGxlQ2xpY2soeyBlbGVtZW50IH06IHsgZWxlbWVudDogRWxlbWVudCB9KSB7XG4gICAgY29uc29sZS5sb2coXCJjbGlja2VkIVwiLCBlbGVtZW50KTtcbiAgICAvLyhlbGVtZW50IGFzIEhUTUxFbGVtZW50KS5zdHlsZS5iYWNrZ3JvdW5kQ29sb3IgPSBcInJlZFwiO1xuICB9LFxufTsgXG4qL1xuXG4gICAgICAgIHByb3RlY3RlZCBvbk15Q3JlYXRlKF9ldjogRXZlbnQgfCBudWxsLCBfc2VuZGVyOiBUQ29tcG9uZW50KSB7XG4gICAgICAgICAgICAgICAgY29uc3QgYnRuID0gdGhpcy5jb21wb25lbnRSZWdpc3RyeS5nZXQoJ2J1dHRvbjInKTtcbiAgICAgICAgICAgICAgICBpZiAoYnRuKSBidG4uY29sb3IgPSBUQ29sb3IucmdiKDAsIDAsIDI1NSk7XG4gICAgICAgIH1cblxuICAgICAgICBwcm90ZWN0ZWQgb25NeVNob3duKF9ldjogRXZlbnQgfCBudWxsLCBfc2VuZGVyOiBUQ29tcG9uZW50KSB7XG4gICAgICAgICAgICAgICAgY29uc3QgYnRuID0gdGhpcy5jb21wb25lbnRSZWdpc3RyeS5nZXQoJ2J1dHRvbjMnKTtcbiAgICAgICAgICAgICAgICBpZiAoYnRuKSBidG4uY29sb3IgPSBUQ29sb3IucmdiKDAsIDI1NSwgMjU1KTtcbiAgICAgICAgfVxuXG4gICAgICAgIGJ1dHRvbjFfb25jbGljayhfZXY6IEV2ZW50IHwgbnVsbCwgX3NlbmRlcjogVENvbXBvbmVudCkge1xuICAgICAgICAgICAgICAgIGNvbnN0IGJ0biA9IHRoaXMuY29tcG9uZW50UmVnaXN0cnkuZ2V0PFRCdXR0b24+KCdidXR0b24xJyk7XG4gICAgICAgICAgICAgICAgaWYgKCFidG4pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybignYnV0dG9uMSBub3QgZm91bmQgaW4gcmVnaXN0cnknKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgLy9idG4uY29sb3IgPSBUQ29sb3IucmdiKDAsIDAsIDI1NSk7XG4gICAgICAgICAgICAgICAgYnRuIS5jb2xvciA9IFRDb2xvci5yZ2IoMjU1LCAwLCAwKTtcbiAgICAgICAgICAgICAgICBidG4hLmNhcHRpb24gPSAnTUlNSSc7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ0J1dHRvbjEgY2xpY2tlZCEhISEnKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHphemFfb25jbGljayhfZXY6IEV2ZW50IHwgbnVsbCwgX3NlbmRlcjogVENvbXBvbmVudCkge1xuICAgICAgICAgICAgICAgIGNvbnN0IGJ0biA9IHRoaXMuY29tcG9uZW50UmVnaXN0cnkuZ2V0PFRCdXR0b24+KCdidXR0b254Jyk7XG4gICAgICAgICAgICAgICAgYnRuIS5jb2xvciA9IFRDb2xvci5yZ2IoMCwgMjU1LCAwKTtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnemF6YSBjbGlja2VkISEhIScpO1xuICAgICAgICAgICAgICAgIC8vYnRuIS5lbmFibGVkID0gZmFsc2U7XG4gICAgICAgIH1cblxuICAgICAgICAvL2luc3RhbGxEZWxwaGluZVJ1bnRpbWUocnVudGltZSk7XG59IC8vIGNsYXNzIHphemFcblxuY2xhc3MgTXlBcHBsaWNhdGlvbiBleHRlbmRzIFRBcHBsaWNhdGlvbiB7XG4gICAgICAgIHphemE6IFphemE7XG5cbiAgICAgICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgICAgICAgICAgc3VwZXIoKTtcbiAgICAgICAgICAgICAgICB0aGlzLnphemEgPSBuZXcgWmF6YSgnemF6YScpO1xuICAgICAgICAgICAgICAgIHRoaXMubWFpbkZvcm0gPSB0aGlzLnphemE7XG4gICAgICAgIH1cblxuICAgICAgICBydW4oKSB7XG4gICAgICAgICAgICAgICAgLy90aGlzLnphemEuY29tcG9uZW50UmVnaXN0cnkuYnVpbGRDb21wb25lbnRUcmVlKHRoaXMuemF6YSk7XG4gICAgICAgICAgICAgICAgLy90aGlzLnphemEuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snKTtcblxuICAgICAgICAgICAgICAgIC8vIGF1IGxhbmNlbWVudFxuICAgICAgICAgICAgICAgIHRoaXMucnVuV2hlbkRvbVJlYWR5KCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuemF6YS5zaG93KCk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbn0gLy8gY2xhc3MgTXlBcHBsaWNhdGlvblxuXG5jb25zdCBteUFwcGxpY2F0aW9uOiBNeUFwcGxpY2F0aW9uID0gbmV3IE15QXBwbGljYXRpb24oKTtcbnRlc3QoKTtcbm15QXBwbGljYXRpb24ucnVuKCk7XG4iXSwKICAibWFwcGluZ3MiOiAiOzs7OztBQU9PLFNBQVMsaUJBQWlCLE9BQStCO0FBQ3hELFFBQU0sU0FBUyxZQUFZLFNBQVM7QUFDcEMsUUFBTSxTQUFTLGdCQUFnQixTQUFTO0FBR2hE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
