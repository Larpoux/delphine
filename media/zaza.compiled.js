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
      { name: "onclick", kind: "handler", apply: (o, v) => o.onclick = new THandler(String(v)) },
      { name: "oncreate", kind: "handler", apply: (o, v) => o.oncreate = new THandler(String(v)) }
    ];
  }
  // Parse HTML attributes into a plain object
  parsePropsFromElement(el) {
    const out = {};
    const raw = el.getAttribute("data-props");
    if (raw) {
      try {
        Object.assign(out, JSON.parse(raw));
      } catch (e) {
        console.error("Invalid JSON in data-props", raw, e);
      }
    }
    for (const p of this.defProps()) {
      const attr = el.getAttribute(`data-${p.name}`);
      if (attr !== null) out[p.name] = attr;
    }
    return out;
  }
  applyProps(obj, values) {
    for (const p of this.defProps()) {
      if (Object.prototype.hasOwnProperty.call(values, p.name)) {
        p.apply(obj, values[p.name]);
      }
    }
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
  readProps(el, meta) {
    const out = {};
    for (const spec of meta.defProps()) {
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
    for (const spec of cls.defProps()) {
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
      child.props = cls.parsePropsFromElement(el);
      this.applyProps(child, cls);
      child.onAttachedToDom?.();
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
    this.syncDomFromProps();
  }
  get enabled() {
    return this.props.enabled ?? true;
  }
  set enabled(enabled) {
    this.props.enabled = enabled;
    this.syncDomFromProps();
  }
  constructor(name, form, parent) {
    super(name, form, parent);
  }
  syncDomFromProps() {
    const el = this.htmlElement;
    if (!el) return;
    el.textContent = this.caption;
    this.htmlButton().disabled = !this.enabled;
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
  props() {
    return [
      { name: "caption", kind: "string", apply: (o, v) => o.caption = String(v) },
      { name: "enabled", kind: "boolean", apply: (o, v) => o.enabled = Boolean(v) },
      { name: "color", kind: "color", apply: (o, v) => o.color = v }
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vc3JjL3ZjbC9yZWdpc3RlclZjbC50cyIsICIuLi9zcmMvdmNsL1N0ZEN0cmxzLnRzIiwgIi4uL2V4YW1wbGVzL3phemEvdGVzdC50cyIsICIuLi9leGFtcGxlcy96YXphL3phemEudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbIi8vIEVuZ2xpc2ggY29tbWVudHMgYXMgcmVxdWVzdGVkLlxuXG4vL2ltcG9ydCB7IENvbXBvbmVudFR5cGVSZWdpc3RyeSB9IGZyb20gJ0BkcnQnO1xuaW1wb3J0IHsgVEJ1dHRvbiwgVE1ldGFDb21wb25lbnQsIFRGb3JtLCBUQ29tcG9uZW50LCBUQ29tcG9uZW50VHlwZVJlZ2lzdHJ5LCBUTWV0YUJ1dHRvbiwgVE1ldGFQbHVnaW5Ib3N0IH0gZnJvbSAnQHZjbCc7XG4vL2ltcG9ydCB7IFRNZXRhUGx1Z2luSG9zdCB9IGZyb20gJy4uL2RydC9VSVBsdWdpbic7IC8vIE5PVCBHT09EICEgaW1wb3J0IFZDTCFcblxuLy8gRW5nbGlzaCBjb21tZW50cyBhcyByZXF1ZXN0ZWQuXG5leHBvcnQgZnVuY3Rpb24gcmVnaXN0ZXJCdWlsdGlucyh0eXBlczogVENvbXBvbmVudFR5cGVSZWdpc3RyeSkge1xuICAgICAgICB0eXBlcy5yZWdpc3RlcihUTWV0YUJ1dHRvbi5tZXRhY2xhc3MpO1xuICAgICAgICB0eXBlcy5yZWdpc3RlcihUTWV0YVBsdWdpbkhvc3QubWV0YUNsYXNzKTtcbiAgICAgICAgLy8gdHlwZXMucmVnaXN0ZXIoVEVkaXRDbGFzcyk7XG4gICAgICAgIC8vIHR5cGVzLnJlZ2lzdGVyKFRMYWJlbENsYXNzKTtcbn1cbiIsICJpbXBvcnQgeyByZWdpc3RlckJ1aWx0aW5zIH0gZnJvbSAnLi9yZWdpc3RlclZjbCc7XG5cbi8qXG4gICBUbyBjcmVhdGUgYSBuZXcgY29tcG9uZW50IHR5cGU6XG5cbiAgIFRvIGNyZWF0ZSBhIG5ldyBjb21wb25lbnQgYXR0cmlidXRcblxuKi9cblxuZXhwb3J0IHR5cGUgQ29tcG9uZW50RmFjdG9yeSA9IChuYW1lOiBzdHJpbmcsIGZvcm06IFRGb3JtLCBvd25lcjogVENvbXBvbmVudCkgPT4gVENvbXBvbmVudDtcblxuZXhwb3J0IHR5cGUgSnNvbiA9IG51bGwgfCBib29sZWFuIHwgbnVtYmVyIHwgc3RyaW5nIHwgSnNvbltdIHwgeyBba2V5OiBzdHJpbmddOiBKc29uIH07XG5cbnR5cGUgUHJvcEtpbmQgPSAnc3RyaW5nJyB8ICdudW1iZXInIHwgJ2Jvb2xlYW4nIHwgJ2NvbG9yJyB8ICdoYW5kbGVyJztcbmV4cG9ydCB0eXBlIFByb3BTcGVjPFQsIFYgPSB1bmtub3duPiA9IHtcbiAgICAgICAgbmFtZTogc3RyaW5nO1xuICAgICAgICBraW5kOiBQcm9wS2luZDtcbiAgICAgICAgYXBwbHk6IChvYmo6IFQsIHZhbHVlOiBWKSA9PiB2b2lkO1xufTtcblxuZXhwb3J0IGludGVyZmFjZSBJUGx1Z2luSG9zdCB7XG4gICAgICAgIHNldFBsdWdpblNwZWMoc3BlYzogeyBwbHVnaW46IHN0cmluZyB8IG51bGw7IHByb3BzOiBhbnkgfSk6IHZvaWQ7XG4gICAgICAgIG1vdW50UGx1Z2luSWZSZWFkeShzZXJ2aWNlczogRGVscGhpbmVTZXJ2aWNlcyk6IHZvaWQ7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgRGVscGhpbmVMb2dnZXIge1xuICAgICAgICBkZWJ1Zyhtc2c6IHN0cmluZywgZGF0YT86IEpzb24pOiB2b2lkO1xuICAgICAgICBpbmZvKG1zZzogc3RyaW5nLCBkYXRhPzogSnNvbik6IHZvaWQ7XG4gICAgICAgIHdhcm4obXNnOiBzdHJpbmcsIGRhdGE/OiBKc29uKTogdm9pZDtcbiAgICAgICAgZXJyb3IobXNnOiBzdHJpbmcsIGRhdGE/OiBKc29uKTogdm9pZDtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBEZWxwaGluZUV2ZW50QnVzIHtcbiAgICAgICAgLy8gU3Vic2NyaWJlIHRvIGFuIGFwcCBldmVudC5cbiAgICAgICAgb24oZXZlbnROYW1lOiBzdHJpbmcsIGhhbmRsZXI6IChwYXlsb2FkOiBKc29uKSA9PiB2b2lkKTogKCkgPT4gdm9pZDtcblxuICAgICAgICAvLyBQdWJsaXNoIGFuIGFwcCBldmVudC5cbiAgICAgICAgZW1pdChldmVudE5hbWU6IHN0cmluZywgcGF5bG9hZDogSnNvbik6IHZvaWQ7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgRGVscGhpbmVTdG9yYWdlIHtcbiAgICAgICAgZ2V0KGtleTogc3RyaW5nKTogUHJvbWlzZTxKc29uIHwgdW5kZWZpbmVkPjtcbiAgICAgICAgc2V0KGtleTogc3RyaW5nLCB2YWx1ZTogSnNvbik6IFByb21pc2U8dm9pZD47XG4gICAgICAgIHJlbW92ZShrZXk6IHN0cmluZyk6IFByb21pc2U8dm9pZD47XG59XG5leHBvcnQgaW50ZXJmYWNlIERlbHBoaW5lU2VydmljZXMge1xuICAgICAgICBsb2c6IHtcbiAgICAgICAgICAgICAgICBkZWJ1Zyhtc2c6IHN0cmluZywgZGF0YT86IGFueSk6IHZvaWQ7XG4gICAgICAgICAgICAgICAgaW5mbyhtc2c6IHN0cmluZywgZGF0YT86IGFueSk6IHZvaWQ7XG4gICAgICAgICAgICAgICAgd2Fybihtc2c6IHN0cmluZywgZGF0YT86IGFueSk6IHZvaWQ7XG4gICAgICAgICAgICAgICAgZXJyb3IobXNnOiBzdHJpbmcsIGRhdGE/OiBhbnkpOiB2b2lkO1xuICAgICAgICB9O1xuXG4gICAgICAgIGJ1czoge1xuICAgICAgICAgICAgICAgIG9uKGV2ZW50OiBzdHJpbmcsIGhhbmRsZXI6IChwYXlsb2FkOiBhbnkpID0+IHZvaWQpOiAoKSA9PiB2b2lkO1xuICAgICAgICAgICAgICAgIGVtaXQoZXZlbnQ6IHN0cmluZywgcGF5bG9hZDogYW55KTogdm9pZDtcbiAgICAgICAgfTtcblxuICAgICAgICBzdG9yYWdlOiB7XG4gICAgICAgICAgICAgICAgZ2V0KGtleTogc3RyaW5nKTogUHJvbWlzZTxhbnk+IHwgbnVsbDtcbiAgICAgICAgICAgICAgICBzZXQoa2V5OiBzdHJpbmcsIHZhbHVlOiBhbnkpOiBQcm9taXNlPHZvaWQ+IHwgbnVsbDtcbiAgICAgICAgICAgICAgICByZW1vdmUoa2V5OiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHwgbnVsbDtcbiAgICAgICAgfTtcblxuICAgICAgICAvLyBmdXR1clxuICAgICAgICAvLyBpMThuPzogLi4uXG4gICAgICAgIC8vIG5hdj86IC4uLlxufVxuXG5leHBvcnQgaW50ZXJmYWNlIFVJUGx1Z2luSW5zdGFuY2U8UHJvcHMgZXh0ZW5kcyBKc29uID0gSnNvbj4ge1xuICAgICAgICByZWFkb25seSBpZDogc3RyaW5nO1xuXG4gICAgICAgIC8vIENhbGxlZCBleGFjdGx5IG9uY2UgYWZ0ZXIgY3JlYXRpb24gKGZvciBhIGdpdmVuIGluc3RhbmNlKS5cbiAgICAgICAgbW91bnQoY29udGFpbmVyOiBIVE1MRWxlbWVudCwgcHJvcHM6IFByb3BzLCBzZXJ2aWNlczogRGVscGhpbmVTZXJ2aWNlcyk6IHZvaWQ7XG5cbiAgICAgICAgLy8gQ2FsbGVkIGFueSB0aW1lIHByb3BzIGNoYW5nZSAobWF5IGJlIGZyZXF1ZW50KS5cbiAgICAgICAgdXBkYXRlKHByb3BzOiBQcm9wcyk6IHZvaWQ7XG5cbiAgICAgICAgLy8gQ2FsbGVkIGV4YWN0bHkgb25jZSBiZWZvcmUgZGlzcG9zYWwuXG4gICAgICAgIHVubW91bnQoKTogdm9pZDtcblxuICAgICAgICAvLyBPcHRpb25hbCBlcmdvbm9taWNzLlxuICAgICAgICBnZXRTaXplSGludHM/KCk6IG51bWJlcjtcbiAgICAgICAgZm9jdXM/KCk6IHZvaWQ7XG5cbiAgICAgICAgLy8gT3B0aW9uYWwgcGVyc2lzdGVuY2UgaG9vayAoRGVscGhpbmUgbWF5IHN0b3JlICYgcmVzdG9yZSB0aGlzKS5cbiAgICAgICAgc2VyaWFsaXplU3RhdGU/KCk6IEpzb247XG59XG5cbmV4cG9ydCBhYnN0cmFjdCBjbGFzcyBUTWV0YWNsYXNzIHtcbiAgICAgICAgcmVhZG9ubHkgdHlwZU5hbWU6IHN0cmluZyA9ICdUTWV0YWNsYXNzJztcbiAgICAgICAgc3RhdGljIG1ldGFjbGFzczogVE1ldGFjbGFzcztcbiAgICAgICAgcmVhZG9ubHkgc3VwZXJDbGFzczogVE1ldGFjbGFzcyB8IG51bGwgPSBudWxsO1xuXG4gICAgICAgIGFic3RyYWN0IGdldE1ldGFjbGFzcygpOiBUTWV0YWNsYXNzO1xuICAgICAgICBwcm90ZWN0ZWQgY29uc3RydWN0b3Ioc3VwZXJDbGFzczogVE1ldGFjbGFzcyB8IG51bGwsIHR5cGVOYW1lID0gJ1RNZXRhY2xhc3MnKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5zdXBlckNsYXNzID0gc3VwZXJDbGFzcztcbiAgICAgICAgICAgICAgICB0aGlzLnR5cGVOYW1lID0gdHlwZU5hbWU7XG4gICAgICAgIH1cbn1cblxuZXhwb3J0IGNsYXNzIFRPYmplY3Qge1xuICAgICAgICBnZXRNZXRhQ2xhc3MoKTogVE1ldGFPYmplY3Qge1xuICAgICAgICAgICAgICAgIHJldHVybiBUTWV0YU9iamVjdC5tZXRhQ2xhc3M7XG4gICAgICAgIH1cbn1cblxuZXhwb3J0IGNsYXNzIFRNZXRhT2JqZWN0IGV4dGVuZHMgVE1ldGFjbGFzcyB7XG4gICAgICAgIHN0YXRpYyByZWFkb25seSBtZXRhQ2xhc3M6IFRNZXRhT2JqZWN0ID0gbmV3IFRNZXRhT2JqZWN0KFRNZXRhY2xhc3MubWV0YWNsYXNzKTtcblxuICAgICAgICBnZXRNZXRhY2xhc3MoKTogVE1ldGFPYmplY3Qge1xuICAgICAgICAgICAgICAgIHJldHVybiBUTWV0YU9iamVjdC5tZXRhQ2xhc3M7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3RydWN0b3Ioc3VwZXJDbGFzczogVE1ldGFjbGFzcykge1xuICAgICAgICAgICAgICAgIHN1cGVyKHN1cGVyQ2xhc3MsICdUT2JqZWN0Jyk7XG4gICAgICAgIH1cbn1cblxuZXhwb3J0IGNsYXNzIFRNZXRhQ29tcG9uZW50IGV4dGVuZHMgVE1ldGFjbGFzcyB7XG4gICAgICAgIHN0YXRpYyByZWFkb25seSBtZXRhY2xhc3M6IFRNZXRhQ29tcG9uZW50ID0gbmV3IFRNZXRhQ29tcG9uZW50KFRNZXRhY2xhc3MubWV0YWNsYXNzKTtcbiAgICAgICAgLy8gVGhlIHN5bWJvbGljIG5hbWUgdXNlZCBpbiBIVE1MOiBkYXRhLWNvbXBvbmVudD1cIlRCdXR0b25cIiBvciBcIm15LWJ1dHRvblwiXG4gICAgICAgIHByb3RlY3RlZCBjb25zdHJ1Y3RvcihzdXBlckNsYXNzOiBUTWV0YWNsYXNzKSB7XG4gICAgICAgICAgICAgICAgc3VwZXIoc3VwZXJDbGFzcywgJ1RDb21wb25lbnQnKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGdldE1ldGFjbGFzcygpOiBUTWV0YUNvbXBvbmVudCB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIFRNZXRhQ29tcG9uZW50Lm1ldGFjbGFzcztcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIENyZWF0ZSB0aGUgcnVudGltZSBpbnN0YW5jZSBhbmQgYXR0YWNoIGl0IHRvIHRoZSBET00gZWxlbWVudC5cbiAgICAgICAgY3JlYXRlKG5hbWU6IHN0cmluZywgZm9ybTogVEZvcm0sIHBhcmVudDogVENvbXBvbmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBuZXcgVENvbXBvbmVudChuYW1lLCBmb3JtLCBwYXJlbnQpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy9kb21FdmVudHM/KCk6IHN0cmluZ1tdOyAvLyBkZWZhdWx0IFtdO1xuXG4gICAgICAgIC8qXG4gICAgICAgIC8vIE9wdGlvbmFsOiBwYXJzZSBIVE1MIGF0dHJpYnV0ZXMgLT4gcHJvcHMvc3RhdGVcbiAgICAgICAgLy8gRXhhbXBsZTogZGF0YS1jYXB0aW9uPVwiT0tcIiAtPiB7IGNhcHRpb246IFwiT0tcIiB9XG4gICAgICAgIHBhcnNlUHJvcHM/KGVsZW06IEhUTUxFbGVtZW50KTogSnNvbjtcblxuICAgICAgICAvLyBPcHRpb25hbDogYXBwbHkgcHJvcHMgdG8gdGhlIGNvbXBvbmVudCAoY2FuIGJlIGNhbGxlZCBhZnRlciBjcmVhdGUpXG4gICAgICAgIGFwcGx5UHJvcHM/KGM6IFQsIHByb3BzOiBKc29uKTogdm9pZDtcblxuICAgICAgICAvLyBPcHRpb25hbDogRGVzaWduLXRpbWUgbWV0YWRhdGEgKHBhbGV0dGUsIGluc3BlY3RvciwgZXRjLilcbiAgICAgICAgZGVzaWduVGltZT86IHtcbiAgICAgICAgICAgICAgICBwYWxldHRlR3JvdXA/OiBzdHJpbmc7XG4gICAgICAgICAgICAgICAgZGlzcGxheU5hbWU/OiBzdHJpbmc7XG4gICAgICAgICAgICAgICAgaWNvbj86IHN0cmluZzsgLy8gbGF0ZXJcbiAgICAgICAgICAgICAgICAvLyBwcm9wZXJ0eSBzY2hlbWEgY291bGQgbGl2ZSBoZXJlXG4gICAgICAgIH07XG4gICAgICAgICovXG4gICAgICAgIGRlZlByb3BzKCk6IFByb3BTcGVjPGFueT5bXSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIFtcbiAgICAgICAgICAgICAgICAgICAgICAgIHsgbmFtZTogJ2NvbG9yJywga2luZDogJ2NvbG9yJywgYXBwbHk6IChvLCB2KSA9PiAoby5jb2xvciA9IG5ldyBUQ29sb3IoU3RyaW5nKHYpKSkgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHsgbmFtZTogJ29uY2xpY2snLCBraW5kOiAnaGFuZGxlcicsIGFwcGx5OiAobywgdikgPT4gKG8ub25jbGljayA9IG5ldyBUSGFuZGxlcihTdHJpbmcodikpKSB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgeyBuYW1lOiAnb25jcmVhdGUnLCBraW5kOiAnaGFuZGxlcicsIGFwcGx5OiAobywgdikgPT4gKG8ub25jcmVhdGUgPSBuZXcgVEhhbmRsZXIoU3RyaW5nKHYpKSkgfVxuICAgICAgICAgICAgICAgIF07XG4gICAgICAgIH1cbiAgICAgICAgLy8gUGFyc2UgSFRNTCBhdHRyaWJ1dGVzIGludG8gYSBwbGFpbiBvYmplY3RcbiAgICAgICAgcGFyc2VQcm9wc0Zyb21FbGVtZW50KGVsOiBFbGVtZW50KTogUmVjb3JkPHN0cmluZywgdW5rbm93bj4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IG91dDogUmVjb3JkPHN0cmluZywgdW5rbm93bj4gPSB7fTtcblxuICAgICAgICAgICAgICAgIC8vIDEpIEpTT04gYnVsa1xuICAgICAgICAgICAgICAgIGNvbnN0IHJhdyA9IGVsLmdldEF0dHJpYnV0ZSgnZGF0YS1wcm9wcycpO1xuICAgICAgICAgICAgICAgIGlmIChyYXcpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIE9iamVjdC5hc3NpZ24ob3V0LCBKU09OLnBhcnNlKHJhdykpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKCdJbnZhbGlkIEpTT04gaW4gZGF0YS1wcm9wcycsIHJhdywgZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLy8gMikgV2hpdGVsaXN0OiBvbmx5IGRlY2xhcmVkIHByb3BzIG92ZXJyaWRlIC8gY29tcGxlbWVudFxuICAgICAgICAgICAgICAgIGZvciAoY29uc3QgcCBvZiB0aGlzLmRlZlByb3BzKCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGF0dHIgPSBlbC5nZXRBdHRyaWJ1dGUoYGRhdGEtJHtwLm5hbWV9YCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoYXR0ciAhPT0gbnVsbCkgb3V0W3AubmFtZV0gPSBhdHRyO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHJldHVybiBvdXQ7XG4gICAgICAgIH1cblxuICAgICAgICBhcHBseVByb3BzKG9iajogYW55LCB2YWx1ZXM6IFJlY29yZDxzdHJpbmcsIHVua25vd24+KSB7XG4gICAgICAgICAgICAgICAgZm9yIChjb25zdCBwIG9mIHRoaXMuZGVmUHJvcHMoKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbCh2YWx1ZXMsIHAubmFtZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcC5hcHBseShvYmosIHZhbHVlc1twLm5hbWVdKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvKlxuICAgICAgICBhcHBseVByb3BzRnJvbUVsZW1lbnQob2JqOiBhbnksIGVsOiBFbGVtZW50KSB7XG4gICAgICAgICAgICAgICAgY29uc3QgcHJvcHMgPSB0aGlzLnBhcnNlUHJvcHNGcm9tRWxlbWVudChlbCk7XG4gICAgICAgICAgICAgICAgdGhpcy5hcHBseVByb3BzKG9iaiwgcHJvcHMpO1xuICAgICAgICAgICAgICAgIHJldHVybiBwcm9wcztcbiAgICAgICAgfVxuICAgICAgICAgICAgICAgICovXG4gICAgICAgIC8vIEFwcGx5IHBhcnNlZCBwcm9wcyB0byB0aGUgY29tcG9uZW50IGluc3RhbmNlXG5cbiAgICAgICAgZG9tRXZlbnRzPygpOiBzdHJpbmdbXTsgLy8gZGVmYXVsdCBbXTtcbn1cblxudHlwZSBDb21wb25lbnRQcm9wcyA9IHtcbiAgICAgICAgb25jbGljaz86IFRIYW5kbGVyO1xuICAgICAgICBvbmNyZWF0ZT86IFRIYW5kbGVyO1xuICAgICAgICBjb2xvcj86IFRDb2xvcjsgLy8gb3UgVENvbG9yLCBldGMuXG4gICAgICAgIG5hbWU/OiBzdHJpbmc7XG4gICAgICAgIGNvbXBvbmVudD86IHN0cmluZztcbiAgICAgICAgZW5hYmxlZD86IGJvb2xlYW47XG59O1xuXG5leHBvcnQgY2xhc3MgVENvbXBvbmVudCB7XG4gICAgICAgIGdldE1ldGFjbGFzcygpOiBUTWV0YUNvbXBvbmVudCB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIFRNZXRhQ29tcG9uZW50Lm1ldGFjbGFzcztcbiAgICAgICAgfVxuXG4gICAgICAgIHJlYWRvbmx5IG5hbWU6IHN0cmluZztcbiAgICAgICAgcmVhZG9ubHkgcGFyZW50OiBUQ29tcG9uZW50IHwgbnVsbCA9IG51bGw7XG4gICAgICAgIGZvcm06IFRGb3JtIHwgbnVsbCA9IG51bGw7XG4gICAgICAgIGNoaWxkcmVuOiBUQ29tcG9uZW50W10gPSBbXTtcblxuICAgICAgICBlbGVtOiBFbGVtZW50IHwgbnVsbCA9IG51bGw7XG4gICAgICAgIGdldCBodG1sRWxlbWVudCgpOiBIVE1MRWxlbWVudCB8IG51bGwge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmVsZW0gYXMgSFRNTEVsZW1lbnQgfCBudWxsO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0cnVjdG9yKG5hbWU6IHN0cmluZywgZm9ybTogVEZvcm0gfCBudWxsLCBwYXJlbnQ6IFRDb21wb25lbnQgfCBudWxsKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5uYW1lID0gbmFtZTtcbiAgICAgICAgICAgICAgICB0aGlzLnBhcmVudCA9IHBhcmVudDtcbiAgICAgICAgICAgICAgICBwYXJlbnQ/LmNoaWxkcmVuLnB1c2godGhpcyk7XG4gICAgICAgICAgICAgICAgdGhpcy5mb3JtID0gZm9ybTtcbiAgICAgICAgICAgICAgICB0aGlzLm5hbWUgPSBuYW1lO1xuICAgICAgICB9XG5cbiAgICAgICAgZGVjbGFyZSBwcm9wczogQ29tcG9uZW50UHJvcHM7XG5cbiAgICAgICAgLyoqIE1heSBjb250YWluIGNoaWxkIGNvbXBvbmVudHMgKi9cbiAgICAgICAgYWxsb3dzQ2hpbGRyZW4oKTogYm9vbGVhbiB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG5cbiAgICAgICAgZ2V0IGNvbG9yKCk6IFRDb2xvciB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBUQ29sb3IodGhpcy5nZXRTdHlsZVByb3AoJ2NvbG9yJykpO1xuICAgICAgICB9XG4gICAgICAgIHNldCBjb2xvcih2OiBUQ29sb3IpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnNldFN0eWxlUHJvcCgnY29sb3InLCB2LnMpO1xuICAgICAgICB9XG5cbiAgICAgICAgZ2V0IGJhY2tncm91bmRDb2xvcigpOiBUQ29sb3Ige1xuICAgICAgICAgICAgICAgIHJldHVybiBuZXcgVENvbG9yKHRoaXMuZ2V0U3R5bGVQcm9wKCdiYWNrZ3JvdW5kLWNvbG9yJykpO1xuICAgICAgICB9XG4gICAgICAgIHNldCBiYWNrZ3JvdW5kQ29sb3IodjogVENvbG9yKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5zZXRTdHlsZVByb3AoJ2JhY2tncm91bmQtY29sb3InLCB2LnMpO1xuICAgICAgICB9XG5cbiAgICAgICAgZ2V0IHdpZHRoKCk6IG51bWJlciB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHBhcnNlSW50KHRoaXMuZ2V0U3R5bGVQcm9wKCd3aWR0aCcpKTtcbiAgICAgICAgfVxuICAgICAgICBzZXQgd2lkdGgodjogbnVtYmVyKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5zZXRTdHlsZVByb3AoJ3dpZHRoJywgdi50b1N0cmluZygpKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGdldCBoZWlnaHQoKTogbnVtYmVyIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcGFyc2VJbnQodGhpcy5nZXRTdHlsZVByb3AoJ2hlaWdodCcpKTtcbiAgICAgICAgfVxuICAgICAgICBzZXQgaGVpZ2h0KHY6IG51bWJlcikge1xuICAgICAgICAgICAgICAgIHRoaXMuc2V0U3R5bGVQcm9wKCdoZWlnaHQnLCB2LnRvU3RyaW5nKCkpO1xuICAgICAgICB9XG5cbiAgICAgICAgZ2V0IG9mZnNldFdpZHRoKCk6IG51bWJlciB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuaHRtbEVsZW1lbnQhLm9mZnNldFdpZHRoO1xuICAgICAgICB9XG4gICAgICAgIGdldCBvZmZzZXRIZWlnaHQoKTogbnVtYmVyIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5odG1sRWxlbWVudCEub2Zmc2V0SGVpZ2h0O1xuICAgICAgICB9XG5cbiAgICAgICAgc2V0U3R5bGVQcm9wKG5hbWU6IHN0cmluZywgdmFsdWU6IHN0cmluZykge1xuICAgICAgICAgICAgICAgIHRoaXMuaHRtbEVsZW1lbnQhLnN0eWxlLnNldFByb3BlcnR5KG5hbWUsIHZhbHVlKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGdldFN0eWxlUHJvcChuYW1lOiBzdHJpbmcpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5odG1sRWxlbWVudCEuc3R5bGUuZ2V0UHJvcGVydHlWYWx1ZShuYW1lKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHNldFByb3AobmFtZTogc3RyaW5nLCB2YWx1ZTogc3RyaW5nKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5odG1sRWxlbWVudCEuc2V0QXR0cmlidXRlKG5hbWUsIHZhbHVlKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGdldFByb3AobmFtZTogc3RyaW5nKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMhLmh0bWxFbGVtZW50IS5nZXRBdHRyaWJ1dGUobmFtZSk7XG4gICAgICAgIH1cbn1cblxuZXhwb3J0IGNsYXNzIFRNZXRhQ29tcG9uZW50VHlwZVJlZ2lzdHJ5IGV4dGVuZHMgVE1ldGFPYmplY3Qge1xuICAgICAgICBzdGF0aWMgcmVhZG9ubHkgbWV0YWNsYXNzOiBUTWV0YUNvbXBvbmVudFR5cGVSZWdpc3RyeSA9IG5ldyBUTWV0YUNvbXBvbmVudFR5cGVSZWdpc3RyeShUTWV0YU9iamVjdC5tZXRhQ2xhc3MpO1xuICAgICAgICBwcm90ZWN0ZWQgY29uc3RydWN0b3Ioc3VwZXJDbGFzczogVE1ldGFPYmplY3QpIHtcbiAgICAgICAgICAgICAgICBzdXBlcihzdXBlckNsYXNzKTtcbiAgICAgICAgICAgICAgICAvLyBldCB2b3VzIGNoYW5nZXoganVzdGUgbGUgbm9tIDpcbiAgICAgICAgICAgICAgICAodGhpcyBhcyBhbnkpLnR5cGVOYW1lID0gJ1RPYmplY3QnO1xuICAgICAgICB9XG4gICAgICAgIGdldE1ldGFjbGFzcygpOiBUTWV0YUNvbXBvbmVudFR5cGVSZWdpc3RyeSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIFRNZXRhQ29tcG9uZW50VHlwZVJlZ2lzdHJ5Lm1ldGFjbGFzcztcbiAgICAgICAgfVxufVxuXG5leHBvcnQgY2xhc3MgVENvbXBvbmVudFR5cGVSZWdpc3RyeSBleHRlbmRzIFRPYmplY3Qge1xuICAgICAgICAvLyBXZSBzdG9yZSBoZXRlcm9nZW5lb3VzIG1ldGFzLCBzbyB3ZSBrZWVwIHRoZW0gYXMgVE1ldGFDb21wb25lbnQ8YW55Pi5cbiAgICAgICAgZ2V0TWV0YWNsYXNzKCk6IFRNZXRhQ29tcG9uZW50VHlwZVJlZ2lzdHJ5IHtcbiAgICAgICAgICAgICAgICByZXR1cm4gVE1ldGFDb21wb25lbnRUeXBlUmVnaXN0cnkubWV0YUNsYXNzO1xuICAgICAgICB9XG4gICAgICAgIHByaXZhdGUgcmVhZG9ubHkgY2xhc3NlcyA9IG5ldyBNYXA8c3RyaW5nLCBUTWV0YUNvbXBvbmVudD4oKTtcblxuICAgICAgICByZWdpc3RlcihtZXRhOiBUTWV0YUNvbXBvbmVudCkge1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLmNsYXNzZXMuaGFzKG1ldGEudHlwZU5hbWUpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYENvbXBvbmVudCB0eXBlIGFscmVhZHkgcmVnaXN0ZXJlZDogJHttZXRhLnR5cGVOYW1lfWApO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB0aGlzLmNsYXNzZXMuc2V0KG1ldGEudHlwZU5hbWUsIG1ldGEpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gSWYgeW91IGp1c3QgbmVlZCBcInNvbWV0aGluZyBtZXRhXCIsIHJldHVybiBhbnktbWV0YS5cbiAgICAgICAgZ2V0KHR5cGVOYW1lOiBzdHJpbmcpOiBUTWV0YUNvbXBvbmVudCB8IHVuZGVmaW5lZCB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuY2xhc3Nlcy5nZXQodHlwZU5hbWUpO1xuICAgICAgICB9XG5cbiAgICAgICAgaGFzKHR5cGVOYW1lOiBzdHJpbmcpOiBib29sZWFuIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5jbGFzc2VzLmhhcyh0eXBlTmFtZSk7XG4gICAgICAgIH1cblxuICAgICAgICBsaXN0KCk6IHN0cmluZ1tdIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gWy4uLnRoaXMuY2xhc3Nlcy5rZXlzKCldLnNvcnQoKTtcbiAgICAgICAgfVxufVxuXG5leHBvcnQgY2xhc3MgVENvbG9yIHtcbiAgICAgICAgczogc3RyaW5nO1xuXG4gICAgICAgIGNvbnN0cnVjdG9yKHM6IHN0cmluZykge1xuICAgICAgICAgICAgICAgIHRoaXMucyA9IHM7XG4gICAgICAgIH1cbiAgICAgICAgLyogZmFjdG9yeSAqLyBzdGF0aWMgcmdiKHI6IG51bWJlciwgZzogbnVtYmVyLCBiOiBudW1iZXIpOiBUQ29sb3Ige1xuICAgICAgICAgICAgICAgIHJldHVybiBuZXcgVENvbG9yKGByZ2IoJHtyfSwgJHtnfSwgJHtifSlgKTtcbiAgICAgICAgfVxuICAgICAgICAvKiBmYWN0b3J5ICovIHN0YXRpYyByZ2JhKHI6IG51bWJlciwgZzogbnVtYmVyLCBiOiBudW1iZXIsIGE6IG51bWJlcik6IFRDb2xvciB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBUQ29sb3IoYHJnYmEoJHtyfSwgJHtnfSwgJHtifSwgJHthfSlgKTtcbiAgICAgICAgfVxufVxuXG5leHBvcnQgY2xhc3MgVEhhbmRsZXIge1xuICAgICAgICBzOiBzdHJpbmc7XG5cbiAgICAgICAgY29uc3RydWN0b3Ioczogc3RyaW5nKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5zID0gcztcbiAgICAgICAgfVxufVxuXG5leHBvcnQgY2xhc3MgVE1ldGFDb21wb25lbnRSZWdpc3RyeSBleHRlbmRzIFRNZXRhY2xhc3Mge1xuICAgICAgICBzdGF0aWMgcmVhZG9ubHkgbWV0YWNsYXNzOiBUTWV0YUNvbXBvbmVudFJlZ2lzdHJ5ID0gbmV3IFRNZXRhQ29tcG9uZW50UmVnaXN0cnkoVE1ldGFjbGFzcy5tZXRhY2xhc3MpO1xuXG4gICAgICAgIHByb3RlY3RlZCBjb25zdHJ1Y3RvcihzdXBlckNsYXNzOiBUTWV0YWNsYXNzKSB7XG4gICAgICAgICAgICAgICAgc3VwZXIoc3VwZXJDbGFzcywgJ1RDb21wb25lbnRSZWdpc3RyeScpO1xuICAgICAgICB9XG4gICAgICAgIGdldE1ldGFjbGFzcygpOiBUTWV0YUNvbXBvbmVudFJlZ2lzdHJ5IHtcbiAgICAgICAgICAgICAgICByZXR1cm4gVE1ldGFDb21wb25lbnRSZWdpc3RyeS5tZXRhY2xhc3M7XG4gICAgICAgIH1cbn1cblxuZXhwb3J0IGNsYXNzIFRDb21wb25lbnRSZWdpc3RyeSBleHRlbmRzIFRPYmplY3Qge1xuICAgICAgICBnZXRNZXRhY2xhc3MoKTogVE1ldGFDb21wb25lbnRSZWdpc3RyeSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIFRNZXRhQ29tcG9uZW50UmVnaXN0cnkubWV0YWNsYXNzO1xuICAgICAgICB9XG5cbiAgICAgICAgcHJpdmF0ZSBpbnN0YW5jZXMgPSBuZXcgTWFwPHN0cmluZywgVENvbXBvbmVudD4oKTtcblxuICAgICAgICBsb2dnZXIgPSB7XG4gICAgICAgICAgICAgICAgZGVidWcobXNnOiBzdHJpbmcsIGRhdGE/OiBKc29uKTogdm9pZCB7fSxcbiAgICAgICAgICAgICAgICBpbmZvKG1zZzogc3RyaW5nLCBkYXRhPzogSnNvbik6IHZvaWQge30sXG4gICAgICAgICAgICAgICAgd2Fybihtc2c6IHN0cmluZywgZGF0YT86IEpzb24pOiB2b2lkIHt9LFxuICAgICAgICAgICAgICAgIGVycm9yKG1zZzogc3RyaW5nLCBkYXRhPzogSnNvbik6IHZvaWQge31cbiAgICAgICAgfTtcblxuICAgICAgICBldmVudEJ1cyA9IHtcbiAgICAgICAgICAgICAgICBvbihldmVudDogc3RyaW5nLCBoYW5kbGVyOiAocGF5bG9hZDogYW55KSA9PiB2b2lkKTogKCkgPT4gdm9pZCB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gKCkgPT4gdm9pZCB7fTtcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIGVtaXQoZXZlbnQ6IHN0cmluZywgcGF5bG9hZDogYW55KTogdm9pZCB7fVxuICAgICAgICB9O1xuXG4gICAgICAgIHN0b3JhZ2UgPSB7XG4gICAgICAgICAgICAgICAgZ2V0KGtleTogc3RyaW5nKTogUHJvbWlzZTxhbnk+IHwgbnVsbCB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIHNldChrZXk6IHN0cmluZywgdmFsdWU6IGFueSk6IFByb21pc2U8dm9pZD4gfCBudWxsIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgcmVtb3ZlKGtleTogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB8IG51bGwge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICB9O1xuXG4gICAgICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICAgICAgICAgIHN1cGVyKCk7XG4gICAgICAgIH1cblxuICAgICAgICByZWdpc3Rlckluc3RhbmNlKG5hbWU6IHN0cmluZywgYzogVENvbXBvbmVudCkge1xuICAgICAgICAgICAgICAgIHRoaXMuaW5zdGFuY2VzLnNldChuYW1lLCBjKTtcbiAgICAgICAgfVxuICAgICAgICBnZXQ8VCBleHRlbmRzIFRDb21wb25lbnQgPSBUQ29tcG9uZW50PihuYW1lOiBzdHJpbmcpOiBUIHwgdW5kZWZpbmVkIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5pbnN0YW5jZXMuZ2V0KG5hbWUpIGFzIFQgfCB1bmRlZmluZWQ7XG4gICAgICAgIH1cblxuICAgICAgICBzZXJ2aWNlczogRGVscGhpbmVTZXJ2aWNlcyA9IHtcbiAgICAgICAgICAgICAgICBsb2c6IHRoaXMubG9nZ2VyLFxuICAgICAgICAgICAgICAgIGJ1czogdGhpcy5ldmVudEJ1cyxcbiAgICAgICAgICAgICAgICBzdG9yYWdlOiB0aGlzLnN0b3JhZ2VcbiAgICAgICAgfTtcblxuICAgICAgICBjbGVhcigpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmluc3RhbmNlcy5jbGVhcigpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmVzb2x2ZVJvb3QoKTogSFRNTEVsZW1lbnQge1xuICAgICAgICAgICAgICAgIC8vIFByZWZlciBib2R5IGFzIHRoZSBjYW5vbmljYWwgcm9vdC5cbiAgICAgICAgICAgICAgICBpZiAoZG9jdW1lbnQuYm9keT8uZGF0YXNldD8uY29tcG9uZW50KSByZXR1cm4gZG9jdW1lbnQuYm9keTtcblxuICAgICAgICAgICAgICAgIC8vIEJhY2t3YXJkIGNvbXBhdGliaWxpdHk6IG9sZCB3cmFwcGVyIGRpdi5cbiAgICAgICAgICAgICAgICBjb25zdCBsZWdhY3kgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnZGVscGhpbmUtcm9vdCcpO1xuICAgICAgICAgICAgICAgIGlmIChsZWdhY3kpIHJldHVybiBsZWdhY3k7XG5cbiAgICAgICAgICAgICAgICAvLyBMYXN0IHJlc29ydC5cbiAgICAgICAgICAgICAgICByZXR1cm4gZG9jdW1lbnQuYm9keSA/PyBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQ7XG4gICAgICAgIH1cblxuICAgICAgICBwcml2YXRlIHJlYWRQcm9wcyhlbDogRWxlbWVudCwgbWV0YTogVE1ldGFDb21wb25lbnQpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBvdXQ6IFJlY29yZDxzdHJpbmcsIGFueT4gPSB7fTtcbiAgICAgICAgICAgICAgICBmb3IgKGNvbnN0IHNwZWMgb2YgbWV0YS5kZWZQcm9wcygpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCByYXcgPSBlbC5nZXRBdHRyaWJ1dGUoYGRhdGEtJHtzcGVjLm5hbWV9YCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAocmF3ID09IG51bGwpIGNvbnRpbnVlO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBvdXRbc3BlYy5uYW1lXSA9IHRoaXMuY29udmVydChyYXcsIHNwZWMua2luZCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiBvdXQ7XG4gICAgICAgIH1cblxuICAgICAgICBwcml2YXRlIGNvbnZlcnQocmF3OiBzdHJpbmcsIGtpbmQ6IFByb3BLaW5kKSB7XG4gICAgICAgICAgICAgICAgc3dpdGNoIChraW5kKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjYXNlICdzdHJpbmcnOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmF3O1xuICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSAnbnVtYmVyJzpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIE51bWJlcihyYXcpO1xuICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSAnYm9vbGVhbic6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiByYXcgPT09ICd0cnVlJyB8fCByYXcgPT09ICcxJyB8fCByYXcgPT09ICcnO1xuICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSAnY29sb3InOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmF3OyAvLyBvdSBwYXJzZSBlbiBUQ29sb3Igc2kgdm91cyBhdmV6XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgYXBwbHlQcm9wcyhjaGlsZDogVENvbXBvbmVudCwgY2xzOiBUTWV0YUNvbXBvbmVudCkge1xuICAgICAgICAgICAgICAgIGNvbnN0IHByb3BzID0gdGhpcy5yZWFkUHJvcHMoY2hpbGQuZWxlbSEsIGNscyk7XG4gICAgICAgICAgICAgICAgZm9yIChjb25zdCBzcGVjIG9mIGNscy5kZWZQcm9wcygpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAocHJvcHNbc3BlYy5uYW1lXSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNwZWMuYXBwbHkoY2hpbGQsIHByb3BzW3NwZWMubmFtZV0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGJ1aWxkQ29tcG9uZW50VHJlZShmb3JtOiBURm9ybSwgY29tcG9uZW50OiBUQ29tcG9uZW50KSB7XG4gICAgICAgICAgICAgICAgdGhpcy5jbGVhcigpO1xuICAgICAgICAgICAgICAgIC8vIC0tLSBGT1JNIC0tLVxuICAgICAgICAgICAgICAgIC8vIHByb3Zpc29pcmVtZW50IGlmIChyb290LmdldEF0dHJpYnV0ZSgnZGF0YS1jb21wb25lbnQnKSA9PT0gJ1RGb3JtJykge1xuXG4gICAgICAgICAgICAgICAgdGhpcy5yZWdpc3Rlckluc3RhbmNlKGNvbXBvbmVudC5uYW1lLCBmb3JtKTtcbiAgICAgICAgICAgICAgICAvL31cbiAgICAgICAgICAgICAgICBjb25zdCByb290ID0gY29tcG9uZW50LmVsZW0hO1xuXG4gICAgICAgICAgICAgICAgLy8gLS0tIENISUxEIENPTVBPTkVOVFMgLS0tXG4gICAgICAgICAgICAgICAgcm9vdC5xdWVyeVNlbGVjdG9yQWxsKCc6c2NvcGUgPiBbZGF0YS1jb21wb25lbnRdJykuZm9yRWFjaCgoZWwpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChlbCA9PT0gcm9vdCkgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgbmFtZSA9IGVsLmdldEF0dHJpYnV0ZSgnZGF0YS1uYW1lJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCB0eXBlID0gZWwuZ2V0QXR0cmlidXRlKCdkYXRhLWNvbXBvbmVudCcpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBjbHMgPSBUQXBwbGljYXRpb24uVGhlQXBwbGljYXRpb24udHlwZXMuZ2V0KHR5cGUhKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghY2xzKSByZXR1cm47XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGNoaWxkID0gY2xzLmNyZWF0ZShuYW1lISwgZm9ybSwgY29tcG9uZW50KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIG5hbWU6IHN0cmluZywgZm9ybTogVEZvcm0sIHBhcmVudDogVENvbXBvbmVudCwgZWxlbTogSFRNTEVsZW1lbnRcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghY2hpbGQpIHJldHVybjtcblxuICAgICAgICAgICAgICAgICAgICAgICAgLy9jaGlsZC5wYXJlbnQgPSBjb21wb25lbnQ7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGNoaWxkLmVsZW0gPSBlbDtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vY2hpbGQuZm9ybSA9IGZvcm07XG4gICAgICAgICAgICAgICAgICAgICAgICAvL2NoaWxkLm5hbWUgPSBuYW1lITtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIE9wdGlvbmFsIHByb3BzXG4gICAgICAgICAgICAgICAgICAgICAgICBjaGlsZC5wcm9wcyA9IGNscy5wYXJzZVByb3BzRnJvbUVsZW1lbnQoZWwpO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5hcHBseVByb3BzKGNoaWxkLCBjbHMpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAvL2NvbnN0IHByb3BzID0gY2xzLmFwcGx5UHJvcHNGcm9tRWxlbWVudChjaGlsZCwgZWwpO1xuICAgICAgICAgICAgICAgICAgICAgICAgLy9jaGlsZC5wcm9wcyA9IHByb3BzO1xuICAgICAgICAgICAgICAgICAgICAgICAgKGNoaWxkIGFzIGFueSkub25BdHRhY2hlZFRvRG9tPy4oKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5hcHBseVByb3BzKGNoaWxkLCBjbHMpO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5yZWdpc3Rlckluc3RhbmNlKG5hbWUhLCBjaGlsZCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb21wb25lbnQuY2hpbGRyZW4ucHVzaChjaGlsZCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBtYXliZUhvc3QgPSBjaGlsZCBhcyB1bmtub3duIGFzIFBhcnRpYWw8SVBsdWdpbkhvc3Q+O1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG1heWJlSG9zdCAmJiB0eXBlb2YgbWF5YmVIb3N0LnNldFBsdWdpblNwZWMgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgcGx1Z2luID0gZWwuZ2V0QXR0cmlidXRlKCdkYXRhLXBsdWdpbicpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCByYXcgPSBlbC5nZXRBdHRyaWJ1dGUoJ2RhdGEtcHJvcHMnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgcHJvcHMgPSByYXcgPyBKU09OLnBhcnNlKHJhdykgOiB7fTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtYXliZUhvc3Quc2V0UGx1Z2luU3BlYyh7IHBsdWdpbiwgcHJvcHMgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1heWJlSG9zdC5tb3VudFBsdWdpbklmUmVhZHkhKHRoaXMuc2VydmljZXMpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvL21heWJlSG9zdC5tb3VudEZyb21SZWdpc3RyeShzZXJ2aWNlcyk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChjaGlsZC5hbGxvd3NDaGlsZHJlbigpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuYnVpbGRDb21wb25lbnRUcmVlKGZvcm0sIGNoaWxkKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgfVxufVxuXG5leHBvcnQgY2xhc3MgVERvY3VtZW50IGV4dGVuZHMgVE9iamVjdCB7XG4gICAgICAgIHN0YXRpYyBkb2N1bWVudDogVERvY3VtZW50ID0gbmV3IFREb2N1bWVudChkb2N1bWVudCk7XG4gICAgICAgIHN0YXRpYyBib2R5ID0gZG9jdW1lbnQuYm9keTtcbiAgICAgICAgaHRtbERvYzogRG9jdW1lbnQ7XG4gICAgICAgIGNvbnN0cnVjdG9yKGh0bWxEb2M6IERvY3VtZW50KSB7XG4gICAgICAgICAgICAgICAgc3VwZXIoKTtcbiAgICAgICAgICAgICAgICB0aGlzLmh0bWxEb2MgPSBodG1sRG9jO1xuICAgICAgICB9XG59XG5cbmV4cG9ydCBjbGFzcyBUTWV0YURvY3VtZW50IGV4dGVuZHMgVE1ldGFPYmplY3Qge1xuICAgICAgICBzdGF0aWMgcmVhZG9ubHkgbWV0YWNsYXNzOiBUTWV0YURvY3VtZW50ID0gbmV3IFRNZXRhRG9jdW1lbnQoVE1ldGFPYmplY3QubWV0YWNsYXNzKTtcblxuICAgICAgICBwcm90ZWN0ZWQgY29uc3RydWN0b3Ioc3VwZXJDbGFzczogVE1ldGFPYmplY3QpIHtcbiAgICAgICAgICAgICAgICBzdXBlcihzdXBlckNsYXNzKTtcbiAgICAgICAgICAgICAgICAvLyBldCB2b3VzIGNoYW5nZXoganVzdGUgbGUgbm9tIDpcbiAgICAgICAgICAgICAgICAodGhpcyBhcyBhbnkpLnR5cGVOYW1lID0gJ1Rlc3RCJztcbiAgICAgICAgfVxuICAgICAgICBnZXRNZXRhY2xhc3MoKTogVE1ldGFEb2N1bWVudCB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIFRNZXRhRG9jdW1lbnQubWV0YWNsYXNzO1xuICAgICAgICB9XG59XG5cbmV4cG9ydCBjbGFzcyBUTWV0YUZvcm0gZXh0ZW5kcyBUTWV0YUNvbXBvbmVudCB7XG4gICAgICAgIHN0YXRpYyByZWFkb25seSBtZXRhY2xhc3M6IFRNZXRhRm9ybSA9IG5ldyBUTWV0YUZvcm0oVE1ldGFDb21wb25lbnQubWV0YWNsYXNzKTtcbiAgICAgICAgZ2V0TWV0YUNsYXNzKCk6IFRNZXRhRm9ybSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIFRNZXRhRm9ybS5tZXRhY2xhc3M7XG4gICAgICAgIH1cblxuICAgICAgICBwcm90ZWN0ZWQgY29uc3RydWN0b3Ioc3VwZXJDbGFzczogVE1ldGFDb21wb25lbnQpIHtcbiAgICAgICAgICAgICAgICBzdXBlcihzdXBlckNsYXNzKTtcbiAgICAgICAgICAgICAgICAvLyBldCB2b3VzIGNoYW5nZXoganVzdGUgbGUgbm9tIDpcbiAgICAgICAgICAgICAgICAodGhpcyBhcyBhbnkpLnR5cGVOYW1lID0gJ1RDb21wb25lbnQnO1xuICAgICAgICB9XG5cbiAgICAgICAgLy9yZWFkb25seSB0eXBlTmFtZSA9ICdURm9ybSc7XG5cbiAgICAgICAgY3JlYXRlKG5hbWU6IHN0cmluZywgZm9ybTogVEZvcm0sIHBhcmVudDogVENvbXBvbmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBuZXcgVEZvcm0obmFtZSk7XG4gICAgICAgIH1cblxuICAgICAgICBwcm9wcygpOiBQcm9wU3BlYzxURm9ybT5bXSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIFtdO1xuICAgICAgICB9XG59XG5cbmV4cG9ydCBjbGFzcyBURm9ybSBleHRlbmRzIFRDb21wb25lbnQge1xuICAgICAgICBnZXRNZXRhY2xhc3MoKTogVE1ldGFGb3JtIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gVE1ldGFGb3JtLm1ldGFjbGFzcztcbiAgICAgICAgfVxuICAgICAgICBhbGxvd3NDaGlsZHJlbigpOiBib29sZWFuIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICBzdGF0aWMgZm9ybXMgPSBuZXcgTWFwPHN0cmluZywgVEZvcm0+KCk7XG4gICAgICAgIHByaXZhdGUgX21vdW50ZWQgPSBmYWxzZTtcbiAgICAgICAgLy8gRWFjaCBGb3JtIGhhcyBpdHMgb3duIGNvbXBvbmVudFJlZ2lzdHJ5XG4gICAgICAgIGNvbXBvbmVudFJlZ2lzdHJ5OiBUQ29tcG9uZW50UmVnaXN0cnkgPSBuZXcgVENvbXBvbmVudFJlZ2lzdHJ5KCk7XG4gICAgICAgIGNvbnN0cnVjdG9yKG5hbWU6IHN0cmluZykge1xuICAgICAgICAgICAgICAgIHN1cGVyKG5hbWUsIG51bGwsIG51bGwpO1xuICAgICAgICAgICAgICAgIHRoaXMuZm9ybSA9IHRoaXM7XG4gICAgICAgICAgICAgICAgVEZvcm0uZm9ybXMuc2V0KG5hbWUsIHRoaXMpO1xuICAgICAgICB9XG5cbiAgICAgICAgZ2V0IGFwcGxpY2F0aW9uKCk6IFRBcHBsaWNhdGlvbiB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuZm9ybT8uYXBwbGljYXRpb24gPz8gVEFwcGxpY2F0aW9uLlRoZUFwcGxpY2F0aW9uO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gRW5nbGlzaCBjb21tZW50cyBhcyByZXF1ZXN0ZWQuXG5cbiAgICAgICAgZmluZEZvcm1Gcm9tRXZlbnRUYXJnZXQodGFyZ2V0OiBFbGVtZW50KTogVEZvcm0gfCBudWxsIHtcbiAgICAgICAgICAgICAgICAvLyAxKSBGaW5kIHRoZSBuZWFyZXN0IGVsZW1lbnQgdGhhdCBsb29rcyBsaWtlIGEgZm9ybSBjb250YWluZXJcbiAgICAgICAgICAgICAgICBjb25zdCBmb3JtRWxlbSA9IHRhcmdldC5jbG9zZXN0KCdbZGF0YS1jb21wb25lbnQ9XCJURm9ybVwiXVtkYXRhLW5hbWVdJykgYXMgRWxlbWVudCB8IG51bGw7XG4gICAgICAgICAgICAgICAgaWYgKCFmb3JtRWxlbSkgcmV0dXJuIG51bGw7XG5cbiAgICAgICAgICAgICAgICAvLyAyKSBSZXNvbHZlIHRoZSBURm9ybSBpbnN0YW5jZVxuICAgICAgICAgICAgICAgIGNvbnN0IGZvcm1OYW1lID0gZm9ybUVsZW0uZ2V0QXR0cmlidXRlKCdkYXRhLW5hbWUnKTtcbiAgICAgICAgICAgICAgICBpZiAoIWZvcm1OYW1lKSByZXR1cm4gbnVsbDtcblxuICAgICAgICAgICAgICAgIHJldHVybiBURm9ybS5mb3Jtcy5nZXQoZm9ybU5hbWUpID8/IG51bGw7XG4gICAgICAgIH1cblxuICAgICAgICBwcml2YXRlIF9hYzogQWJvcnRDb250cm9sbGVyIHwgbnVsbCA9IG51bGw7XG5cbiAgICAgICAgaW5zdGFsbEV2ZW50Um91dGVyKCkge1xuICAgICAgICAgICAgICAgIHRoaXMuX2FjPy5hYm9ydCgpO1xuICAgICAgICAgICAgICAgIHRoaXMuX2FjID0gbmV3IEFib3J0Q29udHJvbGxlcigpO1xuICAgICAgICAgICAgICAgIGNvbnN0IHsgc2lnbmFsIH0gPSB0aGlzLl9hYztcblxuICAgICAgICAgICAgICAgIGNvbnN0IHJvb3QgPSB0aGlzLmVsZW0gYXMgRWxlbWVudCB8IG51bGw7XG4gICAgICAgICAgICAgICAgaWYgKCFyb290KSByZXR1cm47XG5cbiAgICAgICAgICAgICAgICAvLyBzYW1lIGhhbmRsZXIgZm9yIGV2ZXJ5Ym9keVxuICAgICAgICAgICAgICAgIGNvbnN0IGhhbmRsZXIgPSAoZXY6IEV2ZW50KSA9PiB0aGlzLmRpc3BhdGNoRG9tRXZlbnQoZXYpO1xuXG4gICAgICAgICAgICAgICAgZm9yIChjb25zdCB0eXBlIG9mIFsnY2xpY2snLCAnaW5wdXQnLCAnY2hhbmdlJywgJ2tleWRvd24nXSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcm9vdC5hZGRFdmVudExpc3RlbmVyKHR5cGUsIGhhbmRsZXIsIHsgY2FwdHVyZTogdHJ1ZSwgc2lnbmFsIH0pO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGZvciAoY29uc3QgdHlwZSBpbiB0aGlzLmdldE1ldGFjbGFzcygpLmRvbUV2ZW50cykge1xuICAgICAgICAgICAgICAgICAgICAgICAgcm9vdC5hZGRFdmVudExpc3RlbmVyKHR5cGUsIGhhbmRsZXIsIHsgY2FwdHVyZTogdHJ1ZSwgc2lnbmFsIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGRpc3Bvc2VFdmVudFJvdXRlcigpIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9hYz8uYWJvcnQoKTtcbiAgICAgICAgICAgICAgICB0aGlzLl9hYyA9IG51bGw7XG4gICAgICAgIH1cblxuICAgICAgICBwcml2YXRlIGhhbmRsZUV2ZW50KGV2OiBFdmVudCwgZWw6IEVsZW1lbnQsIGF0dHJpYnV0ZTogc3RyaW5nKTogYm9vbGVhbiB7XG4gICAgICAgICAgICAgICAgY29uc3QgaGFuZGxlck5hbWUgPSBlbC5nZXRBdHRyaWJ1dGUoYXR0cmlidXRlKTtcblxuICAgICAgICAgICAgICAgIC8vIElmIHdlIGZvdW5kIGEgaGFuZGxlciBvbiB0aGlzIGVsZW1lbnQsIGRpc3BhdGNoIGl0XG4gICAgICAgICAgICAgICAgaWYgKGhhbmRsZXJOYW1lICYmIGhhbmRsZXJOYW1lICE9PSAnJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgbmFtZSA9IGVsLmdldEF0dHJpYnV0ZSgnZGF0YS1uYW1lJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBzZW5kZXIgPSBuYW1lID8gKHRoaXMuY29tcG9uZW50UmVnaXN0cnkuZ2V0KG5hbWUpID8/IG51bGwpIDogbnVsbDtcblxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgbWF5YmVNZXRob2QgPSAodGhpcyBhcyBhbnkpW2hhbmRsZXJOYW1lXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgbWF5YmVNZXRob2QgIT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ05PVCBBIE1FVEhPRCcsIGhhbmRsZXJOYW1lKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBJZiBzZW5kZXIgaXMgbWlzc2luZywgZmFsbGJhY2sgdG8gdGhlIGZvcm0gaXRzZWxmIChzYWZlKVxuICAgICAgICAgICAgICAgICAgICAgICAgKG1heWJlTWV0aG9kIGFzIChldmVudDogRXZlbnQsIHNlbmRlcjogYW55KSA9PiBhbnkpLmNhbGwodGhpcywgZXYsIHNlbmRlciA/PyB0aGlzKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBXZSByZWNlaXZlZCBhbiBET00gRXZlbnQuIERpc3BhdGNoIGl0XG4gICAgICAgIHByaXZhdGUgZGlzcGF0Y2hEb21FdmVudChldjogRXZlbnQpIHtcbiAgICAgICAgICAgICAgICBjb25zdCB0YXJnZXRFbGVtID0gZXYudGFyZ2V0IGFzIEVsZW1lbnQgfCBudWxsO1xuICAgICAgICAgICAgICAgIGlmICghdGFyZ2V0RWxlbSkgcmV0dXJuO1xuXG4gICAgICAgICAgICAgICAgY29uc3QgZXZUeXBlID0gZXYudHlwZTtcblxuICAgICAgICAgICAgICAgIGxldCBlbDogRWxlbWVudCB8IG51bGwgPSB0YXJnZXRFbGVtLmNsb3Nlc3QoJ1tkYXRhLWNvbXBvbmVudF0nKTtcbiAgICAgICAgICAgICAgICB3aGlsZSAoZWwpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLmhhbmRsZUV2ZW50KGV2LCBlbCwgYGRhdGEtb24ke2V2VHlwZX1gKSkgcmV0dXJuO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAvL2VsID0gdGhpcy5uZXh0Q29tcG9uZW50RWxlbWVudFVwKGVsKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IG5hbWUgPSBlbC5nZXRBdHRyaWJ1dGUoJ2RhdGEtbmFtZScpO1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgY29tcCA9IG5hbWUgPyB0aGlzLmNvbXBvbmVudFJlZ2lzdHJ5LmdldChuYW1lKSA6IG51bGw7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIFByZWZlciB5b3VyIFZDTC1saWtlIHBhcmVudCBjaGFpbiB3aGVuIGF2YWlsYWJsZVxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgbmV4dCA9IGNvbXA/LnBhcmVudD8uZWxlbSA/PyBudWxsO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBGYWxsYmFjazogc3RhbmRhcmQgRE9NIHBhcmVudFxuICAgICAgICAgICAgICAgICAgICAgICAgZWwgPSBuZXh0ID8/IGVsLnBhcmVudEVsZW1lbnQ/LmNsb3Nlc3QoJ1tkYXRhLWNvbXBvbmVudF0nKSA/PyBudWxsO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8vIE5vIGhhbmRsZXIgaGVyZTogdHJ5IGdvaW5nIFwidXBcIiB1c2luZyB5b3VyIGNvbXBvbmVudCB0cmVlIGlmIHBvc3NpYmxlXG4gICAgICAgIH1cblxuICAgICAgICBzaG93KCkge1xuICAgICAgICAgICAgICAgIC8vIE11c3QgYmUgZG9uZSBiZWZvcmUgYnVpbGRDb21wb25lbnRUcmVlKCkgYmVjYXVzZSBgYnVpbGRDb21wb25lbnRUcmVlKClgIGRvZXMgbm90IGRvIGByZXNvbHZlUm9vdCgpYCBpdHNlbGYuXG4gICAgICAgICAgICAgICAgaWYgKCF0aGlzLmVsZW0pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZWxlbSA9IHRoaXMuY29tcG9uZW50UmVnaXN0cnkucmVzb2x2ZVJvb3QoKTsgLy8gb3UgdGhpcy5yZXNvbHZlUm9vdCgpXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmICghdGhpcy5fbW91bnRlZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5jb21wb25lbnRSZWdpc3RyeS5idWlsZENvbXBvbmVudFRyZWUodGhpcywgdGhpcyk7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLm9uQ3JlYXRlKCk7IC8vIE1heWJlIGNvdWxkIGJlIGRvbmUgYWZ0ZXIgaW5zdGFsbEV2ZW50Um91dGVyKClcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuaW5zdGFsbEV2ZW50Um91dGVyKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl9tb3VudGVkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdGhpcy5vblNob3duKCk7XG5cbiAgICAgICAgICAgICAgICAvLyBUT0RPXG4gICAgICAgIH1cblxuICAgICAgICBwcm90ZWN0ZWQgb25DcmVhdGUoKSB7XG4gICAgICAgICAgICAgICAgY29uc3Qgb25TaG93bk5hbWUgPSB0aGlzLmVsZW0hLmdldEF0dHJpYnV0ZSgnZGF0YS1vbmNyZWF0ZScpO1xuICAgICAgICAgICAgICAgIGlmIChvblNob3duTmFtZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcXVldWVNaWNyb3Rhc2soKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBmbiA9ICh0aGlzIGFzIGFueSlbb25TaG93bk5hbWVdO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAodHlwZW9mIGZuID09PSAnZnVuY3Rpb24nKSBmbi5jYWxsKHRoaXMsIG51bGwsIHRoaXMpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcHJvdGVjdGVkIG9uU2hvd24oKSB7XG4gICAgICAgICAgICAgICAgY29uc3Qgb25TaG93bk5hbWUgPSB0aGlzLmVsZW0hLmdldEF0dHJpYnV0ZSgnZGF0YS1vbnNob3duJyk7XG4gICAgICAgICAgICAgICAgaWYgKG9uU2hvd25OYW1lKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBxdWV1ZU1pY3JvdGFzaygoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGZuID0gKHRoaXMgYXMgYW55KVtvblNob3duTmFtZV07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgZm4gPT09ICdmdW5jdGlvbicpIGZuLmNhbGwodGhpcywgbnVsbCwgdGhpcyk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgIH1cbn1cblxudHlwZSBCdXR0b25Qcm9wcyA9IENvbXBvbmVudFByb3BzICYge1xuICAgICAgICBjYXB0aW9uPzogc3RyaW5nO1xuICAgICAgICBlbmFibGVkPzogYm9vbGVhbjtcbiAgICAgICAgLy9jb2xvcj86IFRDb2xvcjsgLy8gb3UgVENvbG9yLCBldGMuXG59O1xuXG5leHBvcnQgY2xhc3MgVEJ1dHRvbiBleHRlbmRzIFRDb21wb25lbnQge1xuICAgICAgICBnZXRNZXRhY2xhc3MoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIFRNZXRhQnV0dG9uLm1ldGFjbGFzcztcbiAgICAgICAgfVxuXG4gICAgICAgIGh0bWxCdXR0b24oKTogSFRNTEJ1dHRvbkVsZW1lbnQge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmh0bWxFbGVtZW50ISBhcyBIVE1MQnV0dG9uRWxlbWVudDtcbiAgICAgICAgfVxuXG4gICAgICAgIHByb3RlY3RlZCBnZXQgYnByb3BzKCk6IEJ1dHRvblByb3BzIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5wcm9wcyBhcyBCdXR0b25Qcm9wcztcbiAgICAgICAgfVxuXG4gICAgICAgIGdldCBjYXB0aW9uKCk6IHN0cmluZyB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuYnByb3BzLmNhcHRpb24gPz8gJyc7XG4gICAgICAgIH1cbiAgICAgICAgc2V0IGNhcHRpb24oY2FwdGlvbjogc3RyaW5nKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5icHJvcHMuY2FwdGlvbiA9IGNhcHRpb247XG4gICAgICAgICAgICAgICAgdGhpcy5zeW5jRG9tRnJvbVByb3BzKCk7XG4gICAgICAgIH1cblxuICAgICAgICBnZXQgZW5hYmxlZCgpOiBib29sZWFuIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5wcm9wcy5lbmFibGVkID8/IHRydWU7XG4gICAgICAgIH1cbiAgICAgICAgc2V0IGVuYWJsZWQoZW5hYmxlZCkge1xuICAgICAgICAgICAgICAgIHRoaXMucHJvcHMuZW5hYmxlZCA9IGVuYWJsZWQ7XG4gICAgICAgICAgICAgICAgdGhpcy5zeW5jRG9tRnJvbVByb3BzKCk7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdHJ1Y3RvcihuYW1lOiBzdHJpbmcsIGZvcm06IFRGb3JtLCBwYXJlbnQ6IFRDb21wb25lbnQpIHtcbiAgICAgICAgICAgICAgICBzdXBlcihuYW1lLCBmb3JtLCBwYXJlbnQpO1xuICAgICAgICB9XG4gICAgICAgIHN5bmNEb21Gcm9tUHJvcHMoKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgZWwgPSB0aGlzLmh0bWxFbGVtZW50O1xuICAgICAgICAgICAgICAgIGlmICghZWwpIHJldHVybjtcblxuICAgICAgICAgICAgICAgIGVsLnRleHRDb250ZW50ID0gdGhpcy5jYXB0aW9uO1xuICAgICAgICAgICAgICAgIHRoaXMuaHRtbEJ1dHRvbigpLmRpc2FibGVkID0gIXRoaXMuZW5hYmxlZDtcbiAgICAgICAgfVxufVxuXG5leHBvcnQgY2xhc3MgVE1ldGFCdXR0b24gZXh0ZW5kcyBUTWV0YUNvbXBvbmVudCB7XG4gICAgICAgIHN0YXRpYyByZWFkb25seSBtZXRhY2xhc3M6IFRNZXRhQnV0dG9uID0gbmV3IFRNZXRhQnV0dG9uKFRNZXRhQ29tcG9uZW50Lm1ldGFjbGFzcyk7XG5cbiAgICAgICAgcHJvdGVjdGVkIGNvbnN0cnVjdG9yKHN1cGVyQ2xhc3M6IFRNZXRhQ29tcG9uZW50KSB7XG4gICAgICAgICAgICAgICAgc3VwZXIoc3VwZXJDbGFzcyk7XG4gICAgICAgICAgICAgICAgLy8gZXQgdm91cyBjaGFuZ2V6IGp1c3RlIGxlIG5vbSA6XG4gICAgICAgICAgICAgICAgKHRoaXMgYXMgYW55KS50eXBlTmFtZSA9ICdUQnV0dG9uJztcbiAgICAgICAgfVxuICAgICAgICBnZXRNZXRhY2xhc3MoKTogVE1ldGFCdXR0b24ge1xuICAgICAgICAgICAgICAgIHJldHVybiBUTWV0YUJ1dHRvbi5tZXRhY2xhc3M7XG4gICAgICAgIH1cblxuICAgICAgICByZWFkb25seSB0eXBlTmFtZSA9ICdUQnV0dG9uJztcblxuICAgICAgICBjcmVhdGUobmFtZTogc3RyaW5nLCBmb3JtOiBURm9ybSwgcGFyZW50OiBUQ29tcG9uZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBUQnV0dG9uKG5hbWUsIGZvcm0sIHBhcmVudCk7XG4gICAgICAgIH1cblxuICAgICAgICBwcm9wcygpOiBQcm9wU3BlYzxUQnV0dG9uPltdIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gW1xuICAgICAgICAgICAgICAgICAgICAgICAgeyBuYW1lOiAnY2FwdGlvbicsIGtpbmQ6ICdzdHJpbmcnLCBhcHBseTogKG8sIHYpID0+IChvLmNhcHRpb24gPSBTdHJpbmcodikpIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICB7IG5hbWU6ICdlbmFibGVkJywga2luZDogJ2Jvb2xlYW4nLCBhcHBseTogKG8sIHYpID0+IChvLmVuYWJsZWQgPSBCb29sZWFuKHYpKSB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgeyBuYW1lOiAnY29sb3InLCBraW5kOiAnY29sb3InLCBhcHBseTogKG8sIHYpID0+IChvLmNvbG9yID0gdiBhcyBhbnkpIH1cbiAgICAgICAgICAgICAgICBdO1xuICAgICAgICB9XG59XG5cbmV4cG9ydCBjbGFzcyBUTWV0YUFwcGxpY2F0aW9uIGV4dGVuZHMgVE1ldGFjbGFzcyB7XG4gICAgICAgIHN0YXRpYyByZWFkb25seSBtZXRhY2xhc3M6IFRNZXRhQXBwbGljYXRpb24gPSBuZXcgVE1ldGFBcHBsaWNhdGlvbihUTWV0YWNsYXNzLm1ldGFjbGFzcyk7XG5cbiAgICAgICAgcHJvdGVjdGVkIGNvbnN0cnVjdG9yKHN1cGVyQ2xhc3M6IFRNZXRhY2xhc3MpIHtcbiAgICAgICAgICAgICAgICBzdXBlcihzdXBlckNsYXNzLCAnVEFwcGxpY2F0aW9uJyk7XG4gICAgICAgIH1cbiAgICAgICAgZ2V0TWV0YWNsYXNzKCk6IFRNZXRhQXBwbGljYXRpb24ge1xuICAgICAgICAgICAgICAgIHJldHVybiBUTWV0YUFwcGxpY2F0aW9uLm1ldGFjbGFzcztcbiAgICAgICAgfVxufVxuXG5leHBvcnQgY2xhc3MgVEFwcGxpY2F0aW9uIHtcbiAgICAgICAgZ2V0TWV0YWNsYXNzKCk6IFRNZXRhQXBwbGljYXRpb24ge1xuICAgICAgICAgICAgICAgIHJldHVybiBUTWV0YUFwcGxpY2F0aW9uLm1ldGFjbGFzcztcbiAgICAgICAgfVxuICAgICAgICBzdGF0aWMgVGhlQXBwbGljYXRpb246IFRBcHBsaWNhdGlvbjtcbiAgICAgICAgLy9zdGF0aWMgcGx1Z2luUmVnaXN0cnkgPSBuZXcgUGx1Z2luUmVnaXN0cnkoKTtcbiAgICAgICAgLy9wbHVnaW5zOiBJUGx1Z2luUmVnaXN0cnk7XG4gICAgICAgIHByaXZhdGUgZm9ybXM6IFRGb3JtW10gPSBbXTtcbiAgICAgICAgcmVhZG9ubHkgdHlwZXMgPSBuZXcgVENvbXBvbmVudFR5cGVSZWdpc3RyeSgpO1xuICAgICAgICBtYWluRm9ybTogVEZvcm0gfCBudWxsID0gbnVsbDtcblxuICAgICAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgICAgICAgICBUQXBwbGljYXRpb24uVGhlQXBwbGljYXRpb24gPSB0aGlzO1xuICAgICAgICAgICAgICAgIHJlZ2lzdGVyQnVpbHRpbnModGhpcy50eXBlcyk7XG4gICAgICAgIH1cblxuICAgICAgICBjcmVhdGVGb3JtPFQgZXh0ZW5kcyBURm9ybT4oY3RvcjogbmV3ICguLi5hcmdzOiBhbnlbXSkgPT4gVCwgbmFtZTogc3RyaW5nKTogVCB7XG4gICAgICAgICAgICAgICAgY29uc3QgZiA9IG5ldyBjdG9yKG5hbWUpO1xuICAgICAgICAgICAgICAgIHRoaXMuZm9ybXMucHVzaChmKTtcbiAgICAgICAgICAgICAgICBpZiAoIXRoaXMubWFpbkZvcm0pIHRoaXMubWFpbkZvcm0gPSBmO1xuICAgICAgICAgICAgICAgIHJldHVybiBmO1xuICAgICAgICB9XG5cbiAgICAgICAgcnVuKCkge1xuICAgICAgICAgICAgICAgIHRoaXMucnVuV2hlbkRvbVJlYWR5KCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLm1haW5Gb3JtKSB0aGlzLm1haW5Gb3JtLnNob3coKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsc2UgdGhpcy5hdXRvU3RhcnQoKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIHByb3RlY3RlZCBhdXRvU3RhcnQoKSB7XG4gICAgICAgICAgICAgICAgLy8gZmFsbGJhY2s6IGNob2lzaXIgdW5lIGZvcm0gZW5yZWdpc3RyXHUwMEU5ZSwgb3UgY3JcdTAwRTllciB1bmUgZm9ybSBpbXBsaWNpdGVcbiAgICAgICAgfVxuXG4gICAgICAgIHJ1bldoZW5Eb21SZWFkeShmbjogKCkgPT4gdm9pZCkge1xuICAgICAgICAgICAgICAgIGlmIChkb2N1bWVudC5yZWFkeVN0YXRlID09PSAnbG9hZGluZycpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdET01Db250ZW50TG9hZGVkJywgZm4sIHsgb25jZTogdHJ1ZSB9KTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgZm4oKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgIH1cbn1cblxuLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09IFBMVUdJTkhPU1QgPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuLypcblxuZXhwb3J0IGNsYXNzIFZ1ZUNvbXBvbmVudCBleHRlbmRzIFRDb21wb25lbnQge31cblxuZXhwb3J0IGNsYXNzIFJlYWN0Q29tcG9uZW50IGV4dGVuZHMgVENvbXBvbmVudCB7fVxuXG5leHBvcnQgY2xhc3MgU3ZlbHRlQ29tcG9uZW50IGV4dGVuZHMgVENvbXBvbmVudCB7fVxuXG5leHBvcnQgY2xhc3MgUGx1Z2luSG9zdDxQcm9wcyBleHRlbmRzIEpzb24gPSBKc29uPiBleHRlbmRzIFRDb21wb25lbnQge1xuICAgICAgICBwcml2YXRlIHBsdWdpbjogUGx1Z2luPFByb3BzPjtcbiAgICAgICAgcHJpdmF0ZSBzZXJ2aWNlczogRGVscGhpbmVTZXJ2aWNlcztcbiAgICAgICAgcHJpdmF0ZSBtb3VudGVkID0gZmFsc2U7XG5cbiAgICAgICAgY29uc3RydWN0b3IocGx1Z2luOiBVSVBsdWdpbjxQcm9wcz4sIHNlcnZpY2VzOiBEZWxwaGluZVNlcnZpY2VzKSB7XG4gICAgICAgICAgICAgICAgc3VwZXIoJ3RvdG8nLCBudWxsLCBudWxsKTtcbiAgICAgICAgICAgICAgICB0aGlzLnBsdWdpbiA9IHBsdWdpbjtcbiAgICAgICAgICAgICAgICB0aGlzLnNlcnZpY2VzID0gc2VydmljZXM7XG4gICAgICAgIH1cblxuICAgICAgICBtb3VudChwcm9wczogUHJvcHMpIHtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5tb3VudGVkKSB0aHJvdyBuZXcgRXJyb3IoJ1BsdWdpbiBhbHJlYWR5IG1vdW50ZWQnKTtcbiAgICAgICAgICAgICAgICAvL3RoaXMucGx1Z2luLm1vdW50KHRoaXMuaHRtbEVsZW1lbnQsIHByb3BzLCB0aGlzLnNlcnZpY2VzKTtcbiAgICAgICAgICAgICAgICB0aGlzLm1vdW50ZWQgPSB0cnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgdXBkYXRlKHByb3BzOiBQcm9wcykge1xuICAgICAgICAgICAgICAgIGlmICghdGhpcy5tb3VudGVkKSB0aHJvdyBuZXcgRXJyb3IoJ1BsdWdpbiBub3QgbW91bnRlZCcpO1xuICAgICAgICAgICAgICAgIHRoaXMucGx1Z2luLnVwZGF0ZShwcm9wcyk7XG4gICAgICAgIH1cblxuICAgICAgICB1bm1vdW50KCkge1xuICAgICAgICAgICAgICAgIGlmICghdGhpcy5tb3VudGVkKSByZXR1cm47XG4gICAgICAgICAgICAgICAgdGhpcy5wbHVnaW4udW5tb3VudCgpO1xuICAgICAgICAgICAgICAgIHRoaXMubW91bnRlZCA9IGZhbHNlO1xuICAgICAgICB9XG59XG4gICAgICAgICovXG5cbmV4cG9ydCBjbGFzcyBUTWV0YVBsdWdpbkhvc3QgZXh0ZW5kcyBUTWV0YUNvbXBvbmVudCB7XG4gICAgICAgIHN0YXRpYyBtZXRhQ2xhc3MgPSBuZXcgVE1ldGFQbHVnaW5Ib3N0KFRNZXRhQ29tcG9uZW50Lm1ldGFjbGFzcyk7XG4gICAgICAgIGdldE1ldGFDbGFzcygpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gVE1ldGFQbHVnaW5Ib3N0Lm1ldGFDbGFzcztcbiAgICAgICAgfVxuICAgICAgICByZWFkb25seSB0eXBlTmFtZSA9ICdUUGx1Z2luSG9zdCc7XG5cbiAgICAgICAgY3JlYXRlKG5hbWU6IHN0cmluZywgZm9ybTogVEZvcm0sIHBhcmVudDogVENvbXBvbmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBuZXcgVFBsdWdpbkhvc3QobmFtZSwgZm9ybSwgcGFyZW50KTtcbiAgICAgICAgfVxuXG4gICAgICAgIHByb3BzKCk6IFByb3BTcGVjPFRQbHVnaW5Ib3N0PltdIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gW107XG4gICAgICAgIH1cbn1cblxuZXhwb3J0IGNsYXNzIFRQbHVnaW5Ib3N0IGV4dGVuZHMgVENvbXBvbmVudCB7XG4gICAgICAgIHByaXZhdGUgaW5zdGFuY2U6IFVJUGx1Z2luSW5zdGFuY2UgfCBudWxsID0gbnVsbDtcblxuICAgICAgICBwbHVnaW5OYW1lOiBzdHJpbmcgfCBudWxsID0gbnVsbDtcbiAgICAgICAgcGx1Z2luUHJvcHM6IEpzb24gPSB7fTtcbiAgICAgICAgcHJpdmF0ZSBmYWN0b3J5OiBVSVBsdWdpbkZhY3RvcnkgfCBudWxsID0gbnVsbDtcblxuICAgICAgICBjb25zdHJ1Y3RvcihuYW1lOiBzdHJpbmcsIGZvcm06IFRGb3JtLCBwYXJlbnQ6IFRDb21wb25lbnQpIHtcbiAgICAgICAgICAgICAgICBzdXBlcihuYW1lLCBmb3JtLCBwYXJlbnQpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gQ2FsbGVkIGJ5IHRoZSBtZXRhY2xhc3MgKG9yIGJ5IHlvdXIgcmVnaXN0cnkpIHJpZ2h0IGFmdGVyIGNyZWF0aW9uXG4gICAgICAgIHNldFBsdWdpbkZhY3RvcnkoZmFjdG9yeTogVUlQbHVnaW5GYWN0b3J5KSB7XG4gICAgICAgICAgICAgICAgdGhpcy5mYWN0b3J5ID0gZmFjdG9yeTtcbiAgICAgICAgfVxuXG4gICAgICAgIG1vdW50UGx1Z2luKHByb3BzOiBKc29uLCBzZXJ2aWNlczogRGVscGhpbmVTZXJ2aWNlcykge1xuICAgICAgICAgICAgICAgIGNvbnN0IGNvbnRhaW5lciA9IHRoaXMuaHRtbEVsZW1lbnQ7XG4gICAgICAgICAgICAgICAgaWYgKCFjb250YWluZXIpIHJldHVybjtcblxuICAgICAgICAgICAgICAgIGlmICghdGhpcy5mYWN0b3J5KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzZXJ2aWNlcy5sb2cud2FybignVFBsdWdpbkhvc3Q6IG5vIHBsdWdpbiBmYWN0b3J5IHNldCcsIHsgaG9zdDogdGhpcy5uYW1lIGFzIGFueSB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvLyBEaXNwb3NlIG9sZCBpbnN0YW5jZSBpZiBhbnlcbiAgICAgICAgICAgICAgICB0aGlzLnVubW91bnQoKTtcblxuICAgICAgICAgICAgICAgIC8vIENyZWF0ZSBwbHVnaW4gaW5zdGFuY2UgdGhlbiBtb3VudFxuICAgICAgICAgICAgICAgIHRoaXMuaW5zdGFuY2UgPSB0aGlzLmZhY3RvcnkoeyBob3N0OiB0aGlzLCBmb3JtOiB0aGlzLmZvcm0hIH0pO1xuICAgICAgICAgICAgICAgIHRoaXMuaW5zdGFuY2UhLm1vdW50KGNvbnRhaW5lciwgcHJvcHMsIHNlcnZpY2VzKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIENhbGxlZCBieSBidWlsZENvbXBvbmVudFRyZWUoKVxuICAgICAgICBzZXRQbHVnaW5TcGVjKHNwZWM6IHsgcGx1Z2luOiBzdHJpbmcgfCBudWxsOyBwcm9wczogYW55IH0pIHtcbiAgICAgICAgICAgICAgICB0aGlzLnBsdWdpbk5hbWUgPSBzcGVjLnBsdWdpbjtcbiAgICAgICAgICAgICAgICB0aGlzLnBsdWdpblByb3BzID0gc3BlYy5wcm9wcyA/PyB7fTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIENhbGxlZCBieSBidWlsZENvbXBvbmVudFRyZWUoKVxuICAgICAgICBtb3VudFBsdWdpbklmUmVhZHkoc2VydmljZXM6IERlbHBoaW5lU2VydmljZXMpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBjb250YWluZXIgPSB0aGlzLmh0bWxFbGVtZW50O1xuICAgICAgICAgICAgICAgIGlmICghY29udGFpbmVyIHx8ICF0aGlzLmZvcm0gfHwgIXRoaXMucGx1Z2luTmFtZSkgcmV0dXJuO1xuXG4gICAgICAgICAgICAgICAgY29uc3QgYXBwID0gVEFwcGxpY2F0aW9uLlRoZUFwcGxpY2F0aW9uOyAvLyBvdSB1biBhY2NcdTAwRThzIFx1MDBFOXF1aXZhbGVudFxuICAgICAgICAgICAgICAgIGNvbnN0IGRlZiA9IFBsdWdpblJlZ2lzdHJ5LnBsdWdpblJlZ2lzdHJ5LmdldCh0aGlzLnBsdWdpbk5hbWUpO1xuXG4gICAgICAgICAgICAgICAgaWYgKCFkZWYpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlcnZpY2VzLmxvZy53YXJuKCdVbmtub3duIHBsdWdpbicsIHsgcGx1Z2luOiB0aGlzLnBsdWdpbk5hbWUgYXMgYW55IH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHRoaXMudW5tb3VudCgpO1xuICAgICAgICAgICAgICAgIHRoaXMuaW5zdGFuY2UgPSBkZWYuZmFjdG9yeSh7IGhvc3Q6IHRoaXMsIGZvcm06IHRoaXMuZm9ybSB9KTtcbiAgICAgICAgICAgICAgICB0aGlzLmluc3RhbmNlIS5tb3VudChjb250YWluZXIsIHRoaXMucGx1Z2luUHJvcHMsIHNlcnZpY2VzKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHVwZGF0ZShwcm9wczogYW55KSB7XG4gICAgICAgICAgICAgICAgdGhpcy5wbHVnaW5Qcm9wcyA9IHByb3BzO1xuICAgICAgICAgICAgICAgIHRoaXMuaW5zdGFuY2U/LnVwZGF0ZShwcm9wcyk7XG4gICAgICAgIH1cblxuICAgICAgICB1bm1vdW50KCkge1xuICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmluc3RhbmNlPy51bm1vdW50KCk7XG4gICAgICAgICAgICAgICAgfSBmaW5hbGx5IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuaW5zdGFuY2UgPSBudWxsO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgfVxufVxuXG5leHBvcnQgdHlwZSBVSVBsdWdpbkZhY3Rvcnk8UHJvcHMgZXh0ZW5kcyBKc29uID0gSnNvbj4gPSAoYXJnczogeyBob3N0OiBUUGx1Z2luSG9zdDsgZm9ybTogVEZvcm0gfSkgPT4gVUlQbHVnaW5JbnN0YW5jZTxQcm9wcz47XG5cbmV4cG9ydCBpbnRlcmZhY2UgU2l6ZUhpbnRzIHtcbiAgICAgICAgbWluV2lkdGg/OiBudW1iZXI7XG4gICAgICAgIG1pbkhlaWdodD86IG51bWJlcjtcbiAgICAgICAgcHJlZmVycmVkV2lkdGg/OiBudW1iZXI7XG4gICAgICAgIHByZWZlcnJlZEhlaWdodD86IG51bWJlcjtcbn1cblxuZXhwb3J0IHR5cGUgVUlQbHVnaW5EZWYgPSB7XG4gICAgICAgIGZhY3Rvcnk6IFVJUGx1Z2luRmFjdG9yeTtcbiAgICAgICAgLy8gb3B0aW9ubmVsIDogdW4gc2NoXHUwMEU5bWEgZGUgcHJvcHMsIGFpZGUgYXUgZGVzaWduZXJcbiAgICAgICAgLy8gcHJvcHM/OiBQcm9wU2NoZW1hO1xufTtcblxuZXhwb3J0IGNsYXNzIFBsdWdpblJlZ2lzdHJ5IHtcbiAgICAgICAgc3RhdGljIHBsdWdpblJlZ2lzdHJ5ID0gbmV3IFBsdWdpblJlZ2lzdHJ5KCk7XG4gICAgICAgIHByaXZhdGUgcmVhZG9ubHkgcGx1Z2lucyA9IG5ldyBNYXA8c3RyaW5nLCBVSVBsdWdpbkRlZj4oKTtcblxuICAgICAgICByZWdpc3RlcihuYW1lOiBzdHJpbmcsIGRlZjogVUlQbHVnaW5EZWYpIHtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5wbHVnaW5zLmhhcyhuYW1lKSkgdGhyb3cgbmV3IEVycm9yKGBQbHVnaW4gYWxyZWFkeSByZWdpc3RlcmVkOiAke25hbWV9YCk7XG4gICAgICAgICAgICAgICAgdGhpcy5wbHVnaW5zLnNldChuYW1lLCBkZWYpO1xuICAgICAgICB9XG5cbiAgICAgICAgZ2V0KG5hbWU6IHN0cmluZyk6IFVJUGx1Z2luRGVmIHwgdW5kZWZpbmVkIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5wbHVnaW5zLmdldChuYW1lKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGhhcyhuYW1lOiBzdHJpbmcpOiBib29sZWFuIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5wbHVnaW5zLmhhcyhuYW1lKTtcbiAgICAgICAgfVxufVxuIiwgImV4cG9ydCBjbGFzcyBNZXRhUm9vdCB7XG4gICAgICAgIHN0YXRpYyByZWFkb25seSBtZXRhY2xhc3M6IE1ldGFSb290ID0gbmV3IE1ldGFSb290KG51bGwpO1xuXG4gICAgICAgIHJlYWRvbmx5IHN1cGVyQ2xhc3M6IE1ldGFSb290IHwgbnVsbDtcbiAgICAgICAgcmVhZG9ubHkgdHlwZU5hbWU6IHN0cmluZztcblxuICAgICAgICBwcm90ZWN0ZWQgY29uc3RydWN0b3Ioc3VwZXJDbGFzczogTWV0YVJvb3QgfCBudWxsLCB0eXBlTmFtZSA9ICdUTWV0YVJvb3QnKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5zdXBlckNsYXNzID0gc3VwZXJDbGFzcztcbiAgICAgICAgICAgICAgICB0aGlzLnR5cGVOYW1lID0gdHlwZU5hbWU7XG4gICAgICAgIH1cbiAgICAgICAgZ2V0TWV0YWNsYXNzKCk6IE1ldGFSb290IHtcbiAgICAgICAgICAgICAgICByZXR1cm4gTWV0YVJvb3QubWV0YWNsYXNzO1xuICAgICAgICB9XG59XG5cbmV4cG9ydCBjbGFzcyBNZXRhVGVzdEEgZXh0ZW5kcyBNZXRhUm9vdCB7XG4gICAgICAgIHN0YXRpYyByZWFkb25seSBtZXRhY2xhc3M6IE1ldGFUZXN0QSA9IG5ldyBNZXRhVGVzdEEoTWV0YVJvb3QubWV0YWNsYXNzKTtcblxuICAgICAgICBwcm90ZWN0ZWQgY29uc3RydWN0b3Ioc3VwZXJDbGFzczogTWV0YVJvb3QpIHtcbiAgICAgICAgICAgICAgICBzdXBlcihzdXBlckNsYXNzLCAnVGVzdEEnKTtcbiAgICAgICAgfVxuICAgICAgICBnZXRNZXRhY2xhc3MoKTogTWV0YVRlc3RBIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gTWV0YVRlc3RBLm1ldGFjbGFzcztcbiAgICAgICAgfVxufVxuXG5leHBvcnQgY2xhc3MgTWV0YVRlc3RCIGV4dGVuZHMgTWV0YVRlc3RBIHtcbiAgICAgICAgc3RhdGljIHJlYWRvbmx5IG1ldGFjbGFzczogTWV0YVRlc3RCID0gbmV3IE1ldGFUZXN0QihNZXRhVGVzdEEubWV0YWNsYXNzKTtcblxuICAgICAgICBwcm90ZWN0ZWQgY29uc3RydWN0b3Ioc3VwZXJDbGFzczogTWV0YVRlc3RBKSB7XG4gICAgICAgICAgICAgICAgc3VwZXIoc3VwZXJDbGFzcyk7XG4gICAgICAgICAgICAgICAgLy8gZXQgdm91cyBjaGFuZ2V6IGp1c3RlIGxlIG5vbSA6XG4gICAgICAgICAgICAgICAgKHRoaXMgYXMgYW55KS50eXBlTmFtZSA9ICdUZXN0Qic7XG4gICAgICAgIH1cbiAgICAgICAgZ2V0TWV0YWNsYXNzKCk6IE1ldGFUZXN0QiB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIE1ldGFUZXN0Qi5tZXRhY2xhc3M7XG4gICAgICAgIH1cbn1cblxuZXhwb3J0IGNsYXNzIE1ldGFUZXN0QyBleHRlbmRzIE1ldGFUZXN0QiB7XG4gICAgICAgIHN0YXRpYyByZWFkb25seSBtZXRhY2xhc3M6IE1ldGFUZXN0QyA9IG5ldyBNZXRhVGVzdEMoTWV0YVRlc3RCLm1ldGFjbGFzcyk7XG5cbiAgICAgICAgcHJvdGVjdGVkIGNvbnN0cnVjdG9yKHN1cGVyQ2xhc3M6IE1ldGFUZXN0Qikge1xuICAgICAgICAgICAgICAgIHN1cGVyKHN1cGVyQ2xhc3MpO1xuICAgICAgICAgICAgICAgICh0aGlzIGFzIGFueSkudHlwZU5hbWUgPSAnVGVzdEMnO1xuICAgICAgICB9XG5cbiAgICAgICAgZ2V0TWV0YWNsYXNzKCk6IE1ldGFUZXN0QyB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIE1ldGFUZXN0Qy5tZXRhY2xhc3M7XG4gICAgICAgIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHRlc3QoKSB7XG4gICAgICAgIGxldCBjOiBNZXRhUm9vdCB8IG51bGwgPSBNZXRhVGVzdEMubWV0YWNsYXNzO1xuICAgICAgICB3aGlsZSAoYykge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGAke2MuZ2V0TWV0YWNsYXNzKCkudHlwZU5hbWV9IC0gJHtjLnR5cGVOYW1lfSAtPiAke2Muc3VwZXJDbGFzcz8udHlwZU5hbWV9YCk7XG4gICAgICAgICAgICAgICAgYyA9IGMuc3VwZXJDbGFzcztcbiAgICAgICAgfVxufVxuIiwgIi8vLyA8cmVmZXJlbmNlIGxpYj1cImRvbVwiIC8+XG5jb25zb2xlLmxvZygnSSBBTSBaQVpBJyk7XG4vL2ltcG9ydCB7IGluc3RhbGxEZWxwaGluZVJ1bnRpbWUgfSBmcm9tIFwiLi9zcmMvZHJ0XCI7IC8vIDwtLSBUUywgcGFzIC5qc1xuaW1wb3J0IHsgVEZvcm0sIFRDb2xvciwgVEFwcGxpY2F0aW9uLCBUQ29tcG9uZW50LCBUQnV0dG9uIH0gZnJvbSAnQHZjbCc7XG5pbXBvcnQgeyB0ZXN0IH0gZnJvbSAnLi90ZXN0JztcblxuLy9pbXBvcnQgeyBDb21wb25lbnRUeXBlUmVnaXN0cnkgfSBmcm9tICdAdmNsL1N0ZEN0cmxzJztcbi8vaW1wb3J0IHsgQ29tcG9uZW50UmVnaXN0cnkgfSBmcm9tICdAZHJ0L0NvbXBvbmVudFJlZ2lzdHJ5Jztcbi8vaW1wb3J0IHsgVFBsdWdpbkhvc3QgfSBmcm9tICdAZHJ0L1VJUGx1Z2luJztcbi8qXG5leHBvcnQgZnVuY3Rpb24gcmVnaXN0ZXJQbHVnaW5UeXBlcyhyZWc6IENvbXBvbmVudFR5cGVSZWdpc3RyeSk6IHZvaWQge1xuICAgICAgICAvICpcbiAgICAgICAgLy8gRXhhbXBsZTogYW55IHR5cGUgbmFtZSBjYW4gYmUgcHJvdmlkZWQgYnkgYSBwbHVnaW4uXG4gICAgICAgIHJlZy5yZWdpc3Rlci5yZWdpc3RlclR5cGUoJ2NoYXJ0anMtcGllJywgKG5hbWU6IHN0cmluZywgZm9ybTogVEZvcm0sIHBhcmVudDogVENvbXBvbmVudCkgPT4ge1xuICAgICAgICAgICAgICAgIHJldHVybiBuZXcgUGx1Z2luSG9zdChuYW1lLCBmb3JtLCBwYXJlbnQpO1xuICAgICAgICB9KTtcblxuICAgICAgICByZWcucmVnaXN0ZXJUeXBlKCd2dWUtaGVsbG8nLCAobmFtZTogc3RyaW5nLCBmb3JtOiBURm9ybSwgcGFyZW50OiBUQ29tcG9uZW50KSA9PiB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBQbHVnaW5Ib3N0KG5hbWUsIGZvcm0sIHBhcmVudCk7XG4gICAgICAgIH0pO1xuICAgICAgICAqIC9cbn1cbiovXG5jb25zb2xlLmxvZygnSSBBTSBaQVpBJyk7XG5cbmNsYXNzIFphemEgZXh0ZW5kcyBURm9ybSB7XG4gICAgICAgIC8vIEZvcm0gY29tcG9uZW50cyAtIFRoaXMgbGlzdCBpcyBhdXRvIGdlbmVyYXRlZCBieSBEZWxwaGluZVxuICAgICAgICAvLyAtLS0tLS0tLS0tLS0tLS1cbiAgICAgICAgLy9idXR0b24xIDogVEJ1dHRvbiA9IG5ldyBUQnV0dG9uKFwiYnV0dG9uMVwiLCB0aGlzLCB0aGlzKTtcbiAgICAgICAgLy9idXR0b24yIDogVEJ1dHRvbiA9IG5ldyBUQnV0dG9uKFwiYnV0dG9uMlwiLCB0aGlzLCB0aGlzKTtcbiAgICAgICAgLy9idXR0b24zIDogVEJ1dHRvbiA9IG5ldyBUQnV0dG9uKFwiYnV0dG9uM1wiLCB0aGlzLCB0aGlzKTtcbiAgICAgICAgLy8gLS0tLS0tLS0tLS0tLS0tXG5cbiAgICAgICAgY29uc3RydWN0b3IobmFtZTogc3RyaW5nKSB7XG4gICAgICAgICAgICAgICAgc3VwZXIobmFtZSk7XG4gICAgICAgIH1cbiAgICAgICAgLy9pbXBvcnQgeyBpbnN0YWxsRGVscGhpbmVSdW50aW1lIH0gZnJvbSBcIi4vZHJ0XCI7XG5cbiAgICAgICAgLypcbmNvbnN0IHJ1bnRpbWUgPSB7ICAgXG4gIGhhbmRsZUNsaWNrKHsgZWxlbWVudCB9OiB7IGVsZW1lbnQ6IEVsZW1lbnQgfSkge1xuICAgIGNvbnNvbGUubG9nKFwiY2xpY2tlZCFcIiwgZWxlbWVudCk7XG4gICAgLy8oZWxlbWVudCBhcyBIVE1MRWxlbWVudCkuc3R5bGUuYmFja2dyb3VuZENvbG9yID0gXCJyZWRcIjtcbiAgfSxcbn07IFxuKi9cblxuICAgICAgICBwcm90ZWN0ZWQgb25NeUNyZWF0ZShfZXY6IEV2ZW50IHwgbnVsbCwgX3NlbmRlcjogVENvbXBvbmVudCkge1xuICAgICAgICAgICAgICAgIGNvbnN0IGJ0biA9IHRoaXMuY29tcG9uZW50UmVnaXN0cnkuZ2V0KCdidXR0b24yJyk7XG4gICAgICAgICAgICAgICAgaWYgKGJ0bikgYnRuLmNvbG9yID0gVENvbG9yLnJnYigwLCAwLCAyNTUpO1xuICAgICAgICB9XG5cbiAgICAgICAgcHJvdGVjdGVkIG9uTXlTaG93bihfZXY6IEV2ZW50IHwgbnVsbCwgX3NlbmRlcjogVENvbXBvbmVudCkge1xuICAgICAgICAgICAgICAgIGNvbnN0IGJ0biA9IHRoaXMuY29tcG9uZW50UmVnaXN0cnkuZ2V0KCdidXR0b24zJyk7XG4gICAgICAgICAgICAgICAgaWYgKGJ0bikgYnRuLmNvbG9yID0gVENvbG9yLnJnYigwLCAyNTUsIDI1NSk7XG4gICAgICAgIH1cblxuICAgICAgICBidXR0b24xX29uY2xpY2soX2V2OiBFdmVudCB8IG51bGwsIF9zZW5kZXI6IFRDb21wb25lbnQpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBidG4gPSB0aGlzLmNvbXBvbmVudFJlZ2lzdHJ5LmdldDxUQnV0dG9uPignYnV0dG9uMScpO1xuICAgICAgICAgICAgICAgIGlmICghYnRuKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oJ2J1dHRvbjEgbm90IGZvdW5kIGluIHJlZ2lzdHJ5Jyk7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIC8vYnRuLmNvbG9yID0gVENvbG9yLnJnYigwLCAwLCAyNTUpO1xuICAgICAgICAgICAgICAgIGJ0biEuY29sb3IgPSBUQ29sb3IucmdiKDI1NSwgMCwgMCk7XG4gICAgICAgICAgICAgICAgYnRuIS5jYXB0aW9uID0gJ01JTUknO1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdCdXR0b24xIGNsaWNrZWQhISEhJyk7XG4gICAgICAgIH1cblxuICAgICAgICB6YXphX29uY2xpY2soX2V2OiBFdmVudCB8IG51bGwsIF9zZW5kZXI6IFRDb21wb25lbnQpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBidG4gPSB0aGlzLmNvbXBvbmVudFJlZ2lzdHJ5LmdldDxUQnV0dG9uPignYnV0dG9ueCcpO1xuICAgICAgICAgICAgICAgIGJ0biEuY29sb3IgPSBUQ29sb3IucmdiKDAsIDI1NSwgMCk7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ3phemEgY2xpY2tlZCEhISEnKTtcbiAgICAgICAgICAgICAgICAvL2J0biEuZW5hYmxlZCA9IGZhbHNlO1xuICAgICAgICB9XG5cbiAgICAgICAgLy9pbnN0YWxsRGVscGhpbmVSdW50aW1lKHJ1bnRpbWUpO1xufSAvLyBjbGFzcyB6YXphXG5cbmNsYXNzIE15QXBwbGljYXRpb24gZXh0ZW5kcyBUQXBwbGljYXRpb24ge1xuICAgICAgICB6YXphOiBaYXphO1xuXG4gICAgICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICAgICAgICAgIHN1cGVyKCk7XG4gICAgICAgICAgICAgICAgdGhpcy56YXphID0gbmV3IFphemEoJ3phemEnKTtcbiAgICAgICAgICAgICAgICB0aGlzLm1haW5Gb3JtID0gdGhpcy56YXphO1xuICAgICAgICB9XG5cbiAgICAgICAgcnVuKCkge1xuICAgICAgICAgICAgICAgIC8vdGhpcy56YXphLmNvbXBvbmVudFJlZ2lzdHJ5LmJ1aWxkQ29tcG9uZW50VHJlZSh0aGlzLnphemEpO1xuICAgICAgICAgICAgICAgIC8vdGhpcy56YXphLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJyk7XG5cbiAgICAgICAgICAgICAgICAvLyBhdSBsYW5jZW1lbnRcbiAgICAgICAgICAgICAgICB0aGlzLnJ1bldoZW5Eb21SZWFkeSgoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnphemEuc2hvdygpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG59IC8vIGNsYXNzIE15QXBwbGljYXRpb25cblxuY29uc3QgbXlBcHBsaWNhdGlvbjogTXlBcHBsaWNhdGlvbiA9IG5ldyBNeUFwcGxpY2F0aW9uKCk7XG50ZXN0KCk7XG5teUFwcGxpY2F0aW9uLnJ1bigpO1xuIl0sCiAgIm1hcHBpbmdzIjogIjs7Ozs7QUFPTyxTQUFTLGlCQUFpQixPQUErQjtBQUN4RCxRQUFNLFNBQVMsWUFBWSxTQUFTO0FBQ3BDLFFBQU0sU0FBUyxnQkFBZ0IsU0FBUztBQUdoRDs7O0FDNkVPLElBQWUsYUFBZixNQUEwQjtBQUFBLEVBTWYsWUFBWSxZQUErQixXQUFXLGNBQWM7QUFMOUUsd0JBQVMsWUFBbUI7QUFFNUIsd0JBQVMsY0FBZ0M7QUFJakMsU0FBSyxhQUFhO0FBQ2xCLFNBQUssV0FBVztBQUFBLEVBQ3hCO0FBQ1I7QUFSUSxjQUZjLFlBRVA7QUFVUixJQUFNLFVBQU4sTUFBYztBQUFBLEVBQ2IsZUFBNEI7QUFDcEIsV0FBTyxZQUFZO0FBQUEsRUFDM0I7QUFDUjtBQUVPLElBQU0sZUFBTixNQUFNLHFCQUFvQixXQUFXO0FBQUEsRUFHcEMsZUFBNEI7QUFDcEIsV0FBTyxhQUFZO0FBQUEsRUFDM0I7QUFBQSxFQUNBLFlBQVksWUFBd0I7QUFDNUIsVUFBTSxZQUFZLFNBQVM7QUFBQSxFQUNuQztBQUNSO0FBUlEsY0FESyxjQUNXLGFBQXlCLElBQUksYUFBWSxXQUFXLFNBQVM7QUFEOUUsSUFBTSxjQUFOO0FBV0EsSUFBTSxrQkFBTixNQUFNLHdCQUF1QixXQUFXO0FBQUE7QUFBQSxFQUc3QixZQUFZLFlBQXdCO0FBQ3RDLFVBQU0sWUFBWSxZQUFZO0FBQUEsRUFDdEM7QUFBQSxFQUVBLGVBQStCO0FBQ3ZCLFdBQU8sZ0JBQWU7QUFBQSxFQUM5QjtBQUFBO0FBQUEsRUFHQSxPQUFPLE1BQWMsTUFBYSxRQUFvQjtBQUM5QyxXQUFPLElBQUlBLFlBQVcsTUFBTSxNQUFN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
