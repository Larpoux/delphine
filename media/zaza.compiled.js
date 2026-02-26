var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);

// src/vcl/registerVcl.ts
function registerBuiltins(types) {
  types.register(TMetaButton.metaclass);
  types.register(TMetaPluginHost.metaclass);
  types.register(TMetaForm.metaclass);
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
  fire(form, handlerName, ev, sender) {
    const maybeMethod = form[this.s];
    if (typeof maybeMethod !== "function") {
      console.log("NOT A METHOD", handlerName);
      return false;
    }
    maybeMethod.call(form, ev, sender ?? this);
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
        // ou parse en TColor si vous avez
        case "handler":
          return new THandler(raw);
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
  processElem(el, form, parent) {
    const name = el.getAttribute("data-name");
    const type = el.getAttribute("data-component");
    const cls = TApplication.TheApplication.types.get(type);
    if (!cls) return;
    let child = parent;
    if (cls != TMetaForm.metaclass) {
      child = cls.create(name, form, parent);
    }
    this.registerInstance(name, child);
    if (!child) return;
    child.elem = el;
    const allDefPropsCollected = this.collectDefProps(cls);
    child.props = this.parsePropsFromElement(el, allDefPropsCollected);
    child.syncDomFromProps();
    child.onAttachedToDom?.();
    parent.children.push(child);
    const maybeHost = child;
    if (maybeHost && typeof maybeHost.setPluginSpec === "function") {
      const plugin = el.getAttribute("data-plugin");
      const raw = el.getAttribute("data-props");
      const props = raw ? JSON.parse(raw) : {};
      maybeHost.setPluginSpec({ plugin, props });
      maybeHost.mountPluginIfReady(this.services);
    }
    if (child.allowsChildren()) {
    }
  }
  // This function is called juste once, when the form is created
  buildComponentTree(form, root) {
    this.clear();
    const rootElem = root.elem;
    this.processElem(rootElem, form, root);
    rootElem.querySelectorAll(":scope > [data-component]").forEach((el) => {
      this.processElem(el, form, root);
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
    this.typeName = "TDocument";
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
    this.typeName = "TForm";
  }
  //readonly typeName = 'TForm';
  create(name, form, parent) {
    return new TForm2(name);
  }
  //props(): PropSpec<TForm>[] {
  //return [];
  //}
  defProps() {
    return [
      //{ name: 'caption', kind: 'string', apply: (o, v) => (o.caption = String(v)) },
      //{ name: 'enabled', kind: 'boolean', apply: (o, v) => (o.enabled = Boolean(v)) }
    ];
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
  // We received an DOM Event. Dispatch it
  dispatchDomEvent(ev) {
    const targetElem = ev.target;
    if (!targetElem) return;
    const propName = `on${ev.type}`;
    let el = targetElem.closest("[data-component]");
    if (!el) return;
    const name = el.getAttribute("data-name");
    let comp = name ? this.componentRegistry.get(name) : null;
    while (comp) {
      const handler = comp?.props[propName];
      if (handler && handler.s && handler.s != "") {
        handler.fire(this, propName, ev, comp);
        return;
      }
      comp = comp.parent;
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
  getMetaclass() {
    return _TMetaPluginHost.metaclass;
  }
  create(name, form, parent) {
    return new TPluginHost(name, form, parent);
  }
  props() {
    return [];
  }
};
__publicField(_TMetaPluginHost, "metaclass", new _TMetaPluginHost(TMetaComponent2.metaclass));
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vc3JjL3ZjbC9yZWdpc3RlclZjbC50cyIsICIuLi9zcmMvdmNsL1N0ZEN0cmxzLnRzIiwgIi4uL2V4YW1wbGVzL3phemEvdGVzdC50cyIsICIuLi9leGFtcGxlcy96YXphL3phemEudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbIi8vIEVuZ2xpc2ggY29tbWVudHMgYXMgcmVxdWVzdGVkLlxuXG4vL2ltcG9ydCB7IENvbXBvbmVudFR5cGVSZWdpc3RyeSB9IGZyb20gJ0BkcnQnO1xuaW1wb3J0IHsgVEJ1dHRvbiwgVE1ldGFDb21wb25lbnQsIFRGb3JtLCBUQ29tcG9uZW50LCBUQ29tcG9uZW50VHlwZVJlZ2lzdHJ5LCBUTWV0YUJ1dHRvbiwgVE1ldGFQbHVnaW5Ib3N0LCBUTWV0YUZvcm0gfSBmcm9tICdAdmNsJztcbi8vaW1wb3J0IHsgVE1ldGFQbHVnaW5Ib3N0IH0gZnJvbSAnLi4vZHJ0L1VJUGx1Z2luJzsgLy8gTk9UIEdPT0QgISBpbXBvcnQgVkNMIVxuXG4vLyBFbmdsaXNoIGNvbW1lbnRzIGFzIHJlcXVlc3RlZC5cbmV4cG9ydCBmdW5jdGlvbiByZWdpc3RlckJ1aWx0aW5zKHR5cGVzOiBUQ29tcG9uZW50VHlwZVJlZ2lzdHJ5KSB7XG4gICAgICAgIHR5cGVzLnJlZ2lzdGVyKFRNZXRhQnV0dG9uLm1ldGFjbGFzcyk7XG4gICAgICAgIHR5cGVzLnJlZ2lzdGVyKFRNZXRhUGx1Z2luSG9zdC5tZXRhY2xhc3MpO1xuICAgICAgICB0eXBlcy5yZWdpc3RlcihUTWV0YUZvcm0ubWV0YWNsYXNzKTtcbiAgICAgICAgLy8gdHlwZXMucmVnaXN0ZXIoVEVkaXRDbGFzcyk7XG4gICAgICAgIC8vIHR5cGVzLnJlZ2lzdGVyKFRMYWJlbENsYXNzKTtcbn1cbiIsICJpbXBvcnQgeyByZWdpc3RlckJ1aWx0aW5zIH0gZnJvbSAnLi9yZWdpc3RlclZjbCc7XG5cbi8qXG4gICBUbyBjcmVhdGUgYSBuZXcgY29tcG9uZW50IHR5cGU6XG5cbiAgIFRvIGNyZWF0ZSBhIG5ldyBjb21wb25lbnQgYXR0cmlidXRcblxuKi9cblxuZXhwb3J0IHR5cGUgQ29tcG9uZW50RmFjdG9yeSA9IChuYW1lOiBzdHJpbmcsIGZvcm06IFRGb3JtLCBvd25lcjogVENvbXBvbmVudCkgPT4gVENvbXBvbmVudDtcblxuZXhwb3J0IHR5cGUgSnNvbiA9IG51bGwgfCBib29sZWFuIHwgbnVtYmVyIHwgc3RyaW5nIHwgSnNvbltdIHwgeyBba2V5OiBzdHJpbmddOiBKc29uIH07XG5cbnR5cGUgUHJvcEtpbmQgPSAnc3RyaW5nJyB8ICdudW1iZXInIHwgJ2Jvb2xlYW4nIHwgJ2NvbG9yJyB8ICdoYW5kbGVyJztcbmV4cG9ydCB0eXBlIFByb3BTcGVjPFQsIFYgPSB1bmtub3duPiA9IHtcbiAgICAgICAgbmFtZTogc3RyaW5nO1xuICAgICAgICBraW5kOiBQcm9wS2luZDtcbiAgICAgICAgYXBwbHk6IChvYmo6IFQsIHZhbHVlOiBWKSA9PiB2b2lkO1xufTtcblxuZXhwb3J0IGludGVyZmFjZSBJUGx1Z2luSG9zdCB7XG4gICAgICAgIHNldFBsdWdpblNwZWMoc3BlYzogeyBwbHVnaW46IHN0cmluZyB8IG51bGw7IHByb3BzOiBhbnkgfSk6IHZvaWQ7XG4gICAgICAgIG1vdW50UGx1Z2luSWZSZWFkeShzZXJ2aWNlczogRGVscGhpbmVTZXJ2aWNlcyk6IHZvaWQ7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgRGVscGhpbmVMb2dnZXIge1xuICAgICAgICBkZWJ1Zyhtc2c6IHN0cmluZywgZGF0YT86IEpzb24pOiB2b2lkO1xuICAgICAgICBpbmZvKG1zZzogc3RyaW5nLCBkYXRhPzogSnNvbik6IHZvaWQ7XG4gICAgICAgIHdhcm4obXNnOiBzdHJpbmcsIGRhdGE/OiBKc29uKTogdm9pZDtcbiAgICAgICAgZXJyb3IobXNnOiBzdHJpbmcsIGRhdGE/OiBKc29uKTogdm9pZDtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBEZWxwaGluZUV2ZW50QnVzIHtcbiAgICAgICAgLy8gU3Vic2NyaWJlIHRvIGFuIGFwcCBldmVudC5cbiAgICAgICAgb24oZXZlbnROYW1lOiBzdHJpbmcsIGhhbmRsZXI6IChwYXlsb2FkOiBKc29uKSA9PiB2b2lkKTogKCkgPT4gdm9pZDtcblxuICAgICAgICAvLyBQdWJsaXNoIGFuIGFwcCBldmVudC5cbiAgICAgICAgZW1pdChldmVudE5hbWU6IHN0cmluZywgcGF5bG9hZDogSnNvbik6IHZvaWQ7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgRGVscGhpbmVTdG9yYWdlIHtcbiAgICAgICAgZ2V0KGtleTogc3RyaW5nKTogUHJvbWlzZTxKc29uIHwgdW5kZWZpbmVkPjtcbiAgICAgICAgc2V0KGtleTogc3RyaW5nLCB2YWx1ZTogSnNvbik6IFByb21pc2U8dm9pZD47XG4gICAgICAgIHJlbW92ZShrZXk6IHN0cmluZyk6IFByb21pc2U8dm9pZD47XG59XG5leHBvcnQgaW50ZXJmYWNlIERlbHBoaW5lU2VydmljZXMge1xuICAgICAgICBsb2c6IHtcbiAgICAgICAgICAgICAgICBkZWJ1Zyhtc2c6IHN0cmluZywgZGF0YT86IGFueSk6IHZvaWQ7XG4gICAgICAgICAgICAgICAgaW5mbyhtc2c6IHN0cmluZywgZGF0YT86IGFueSk6IHZvaWQ7XG4gICAgICAgICAgICAgICAgd2Fybihtc2c6IHN0cmluZywgZGF0YT86IGFueSk6IHZvaWQ7XG4gICAgICAgICAgICAgICAgZXJyb3IobXNnOiBzdHJpbmcsIGRhdGE/OiBhbnkpOiB2b2lkO1xuICAgICAgICB9O1xuXG4gICAgICAgIGJ1czoge1xuICAgICAgICAgICAgICAgIG9uKGV2ZW50OiBzdHJpbmcsIGhhbmRsZXI6IChwYXlsb2FkOiBhbnkpID0+IHZvaWQpOiAoKSA9PiB2b2lkO1xuICAgICAgICAgICAgICAgIGVtaXQoZXZlbnQ6IHN0cmluZywgcGF5bG9hZDogYW55KTogdm9pZDtcbiAgICAgICAgfTtcblxuICAgICAgICBzdG9yYWdlOiB7XG4gICAgICAgICAgICAgICAgZ2V0KGtleTogc3RyaW5nKTogUHJvbWlzZTxhbnk+IHwgbnVsbDtcbiAgICAgICAgICAgICAgICBzZXQoa2V5OiBzdHJpbmcsIHZhbHVlOiBhbnkpOiBQcm9taXNlPHZvaWQ+IHwgbnVsbDtcbiAgICAgICAgICAgICAgICByZW1vdmUoa2V5OiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHwgbnVsbDtcbiAgICAgICAgfTtcblxuICAgICAgICAvLyBmdXR1clxuICAgICAgICAvLyBpMThuPzogLi4uXG4gICAgICAgIC8vIG5hdj86IC4uLlxufVxuXG5leHBvcnQgaW50ZXJmYWNlIFVJUGx1Z2luSW5zdGFuY2U8UHJvcHMgZXh0ZW5kcyBKc29uID0gSnNvbj4ge1xuICAgICAgICByZWFkb25seSBpZDogc3RyaW5nO1xuXG4gICAgICAgIC8vIENhbGxlZCBleGFjdGx5IG9uY2UgYWZ0ZXIgY3JlYXRpb24gKGZvciBhIGdpdmVuIGluc3RhbmNlKS5cbiAgICAgICAgbW91bnQoY29udGFpbmVyOiBIVE1MRWxlbWVudCwgcHJvcHM6IFByb3BzLCBzZXJ2aWNlczogRGVscGhpbmVTZXJ2aWNlcyk6IHZvaWQ7XG5cbiAgICAgICAgLy8gQ2FsbGVkIGFueSB0aW1lIHByb3BzIGNoYW5nZSAobWF5IGJlIGZyZXF1ZW50KS5cbiAgICAgICAgdXBkYXRlKHByb3BzOiBQcm9wcyk6IHZvaWQ7XG5cbiAgICAgICAgLy8gQ2FsbGVkIGV4YWN0bHkgb25jZSBiZWZvcmUgZGlzcG9zYWwuXG4gICAgICAgIHVubW91bnQoKTogdm9pZDtcblxuICAgICAgICAvLyBPcHRpb25hbCBlcmdvbm9taWNzLlxuICAgICAgICBnZXRTaXplSGludHM/KCk6IG51bWJlcjtcbiAgICAgICAgZm9jdXM/KCk6IHZvaWQ7XG5cbiAgICAgICAgLy8gT3B0aW9uYWwgcGVyc2lzdGVuY2UgaG9vayAoRGVscGhpbmUgbWF5IHN0b3JlICYgcmVzdG9yZSB0aGlzKS5cbiAgICAgICAgc2VyaWFsaXplU3RhdGU/KCk6IEpzb247XG59XG5cbmV4cG9ydCBhYnN0cmFjdCBjbGFzcyBUTWV0YWNsYXNzIHtcbiAgICAgICAgcmVhZG9ubHkgdHlwZU5hbWU6IHN0cmluZyA9ICdUTWV0YWNsYXNzJztcbiAgICAgICAgc3RhdGljIG1ldGFjbGFzczogVE1ldGFjbGFzcztcbiAgICAgICAgcmVhZG9ubHkgc3VwZXJDbGFzczogVE1ldGFjbGFzcyB8IG51bGwgPSBudWxsO1xuXG4gICAgICAgIGFic3RyYWN0IGdldE1ldGFjbGFzcygpOiBUTWV0YWNsYXNzO1xuICAgICAgICBwcm90ZWN0ZWQgY29uc3RydWN0b3Ioc3VwZXJDbGFzczogVE1ldGFjbGFzcyB8IG51bGwsIHR5cGVOYW1lID0gJ1RNZXRhY2xhc3MnKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5zdXBlckNsYXNzID0gc3VwZXJDbGFzcztcbiAgICAgICAgICAgICAgICB0aGlzLnR5cGVOYW1lID0gdHlwZU5hbWU7XG4gICAgICAgIH1cbn1cblxuZXhwb3J0IGNsYXNzIFRPYmplY3Qge1xuICAgICAgICBnZXRNZXRhQ2xhc3MoKTogVE1ldGFPYmplY3Qge1xuICAgICAgICAgICAgICAgIHJldHVybiBUTWV0YU9iamVjdC5tZXRhQ2xhc3M7XG4gICAgICAgIH1cbn1cblxuZXhwb3J0IGNsYXNzIFRNZXRhT2JqZWN0IGV4dGVuZHMgVE1ldGFjbGFzcyB7XG4gICAgICAgIHN0YXRpYyByZWFkb25seSBtZXRhQ2xhc3M6IFRNZXRhT2JqZWN0ID0gbmV3IFRNZXRhT2JqZWN0KFRNZXRhY2xhc3MubWV0YWNsYXNzKTtcblxuICAgICAgICBnZXRNZXRhY2xhc3MoKTogVE1ldGFPYmplY3Qge1xuICAgICAgICAgICAgICAgIHJldHVybiBUTWV0YU9iamVjdC5tZXRhQ2xhc3M7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3RydWN0b3Ioc3VwZXJDbGFzczogVE1ldGFjbGFzcykge1xuICAgICAgICAgICAgICAgIHN1cGVyKHN1cGVyQ2xhc3MsICdUT2JqZWN0Jyk7XG4gICAgICAgIH1cbn1cblxuZXhwb3J0IGNsYXNzIFRNZXRhQ29tcG9uZW50IGV4dGVuZHMgVE1ldGFjbGFzcyB7XG4gICAgICAgIHN0YXRpYyByZWFkb25seSBtZXRhY2xhc3M6IFRNZXRhQ29tcG9uZW50ID0gbmV3IFRNZXRhQ29tcG9uZW50KFRNZXRhY2xhc3MubWV0YWNsYXNzKTtcbiAgICAgICAgLy8gVGhlIHN5bWJvbGljIG5hbWUgdXNlZCBpbiBIVE1MOiBkYXRhLWNvbXBvbmVudD1cIlRCdXR0b25cIiBvciBcIm15LWJ1dHRvblwiXG4gICAgICAgIHByb3RlY3RlZCBjb25zdHJ1Y3RvcihzdXBlckNsYXNzOiBUTWV0YWNsYXNzKSB7XG4gICAgICAgICAgICAgICAgc3VwZXIoc3VwZXJDbGFzcywgJ1RDb21wb25lbnQnKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGdldE1ldGFjbGFzcygpOiBUTWV0YUNvbXBvbmVudCB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIFRNZXRhQ29tcG9uZW50Lm1ldGFjbGFzcztcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIENyZWF0ZSB0aGUgcnVudGltZSBpbnN0YW5jZSBhbmQgYXR0YWNoIGl0IHRvIHRoZSBET00gZWxlbWVudC5cbiAgICAgICAgY3JlYXRlKG5hbWU6IHN0cmluZywgZm9ybTogVEZvcm0sIHBhcmVudDogVENvbXBvbmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBuZXcgVENvbXBvbmVudChuYW1lLCBmb3JtLCBwYXJlbnQpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy9hbGxEZWZQcm9wc0NvbGxlY3RlZDogUHJvcFNwZWM8YW55PltdID0gW107XG4gICAgICAgIC8vZG9tRXZlbnRzPygpOiBzdHJpbmdbXTsgLy8gZGVmYXVsdCBbXTtcblxuICAgICAgICAvKlxuICAgICAgICAvLyBPcHRpb25hbDogcGFyc2UgSFRNTCBhdHRyaWJ1dGVzIC0+IHByb3BzL3N0YXRlXG4gICAgICAgIC8vIEV4YW1wbGU6IGRhdGEtY2FwdGlvbj1cIk9LXCIgLT4geyBjYXB0aW9uOiBcIk9LXCIgfVxuICAgICAgICBwYXJzZVByb3BzPyhlbGVtOiBIVE1MRWxlbWVudCk6IEpzb247XG5cbiAgICAgICAgLy8gT3B0aW9uYWw6IGFwcGx5IHByb3BzIHRvIHRoZSBjb21wb25lbnQgKGNhbiBiZSBjYWxsZWQgYWZ0ZXIgY3JlYXRlKVxuICAgICAgICBhcHBseVByb3BzPyhjOiBULCBwcm9wczogSnNvbik6IHZvaWQ7XG5cbiAgICAgICAgLy8gT3B0aW9uYWw6IERlc2lnbi10aW1lIG1ldGFkYXRhIChwYWxldHRlLCBpbnNwZWN0b3IsIGV0Yy4pXG4gICAgICAgIGRlc2lnblRpbWU/OiB7XG4gICAgICAgICAgICAgICAgcGFsZXR0ZUdyb3VwPzogc3RyaW5nO1xuICAgICAgICAgICAgICAgIGRpc3BsYXlOYW1lPzogc3RyaW5nO1xuICAgICAgICAgICAgICAgIGljb24/OiBzdHJpbmc7IC8vIGxhdGVyXG4gICAgICAgICAgICAgICAgLy8gcHJvcGVydHkgc2NoZW1hIGNvdWxkIGxpdmUgaGVyZVxuICAgICAgICB9O1xuICAgICAgICAqL1xuICAgICAgICBkZWZQcm9wcygpOiBQcm9wU3BlYzxhbnk+W10ge1xuICAgICAgICAgICAgICAgIHJldHVybiBbXG4gICAgICAgICAgICAgICAgICAgICAgICB7IG5hbWU6ICdjb2xvcicsIGtpbmQ6ICdjb2xvcicsIGFwcGx5OiAobywgdikgPT4gKG8uY29sb3IgPSBuZXcgVENvbG9yKFN0cmluZyh2KSkpIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICB7IG5hbWU6ICdvbmNsaWNrJywga2luZDogJ2hhbmRsZXInLCBhcHBseTogKG8sIHYpID0+IChvLm9uY2xpY2sgPSBuZXcgVEhhbmRsZXIoU3RyaW5nKHYpKSkgfVxuICAgICAgICAgICAgICAgICAgICAgICAgLy97IG5hbWU6ICdvbmNyZWF0ZScsIGtpbmQ6ICdoYW5kbGVyJywgYXBwbHk6IChvLCB2KSA9PiAoby5vbmNyZWF0ZSA9IG5ldyBUSGFuZGxlcihTdHJpbmcodikpKSB9XG4gICAgICAgICAgICAgICAgXTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8qXG4gICAgICAgIGFwcGx5UHJvcHMob2JqOiBhbnksIHZhbHVlczogUmVjb3JkPHN0cmluZywgdW5rbm93bj4pIHtcbiAgICAgICAgICAgICAgICBmb3IgKGNvbnN0IHAgb2YgdGhpcy5kZWZQcm9wcygpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKHZhbHVlcywgcC5uYW1lKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwLmFwcGx5KG9iaiwgdmFsdWVzW3AubmFtZV0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICAgICAgICAgICovXG5cbiAgICAgICAgLy8gRW5nbGlzaCBjb21tZW50cyBhcyByZXF1ZXN0ZWQuXG5cbiAgICAgICAgLypcbiAgICAgICAgYXBwbHlQcm9wc0Zyb21FbGVtZW50KG9iajogYW55LCBlbDogRWxlbWVudCkge1xuICAgICAgICAgICAgICAgIGNvbnN0IHByb3BzID0gdGhpcy5wYXJzZVByb3BzRnJvbUVsZW1lbnQoZWwpO1xuICAgICAgICAgICAgICAgIHRoaXMuYXBwbHlQcm9wcyhvYmosIHByb3BzKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gcHJvcHM7XG4gICAgICAgIH1cbiAgICAgICAgICAgICAgICAqL1xuICAgICAgICAvLyBBcHBseSBwYXJzZWQgcHJvcHMgdG8gdGhlIGNvbXBvbmVudCBpbnN0YW5jZVxuXG4gICAgICAgIGRvbUV2ZW50cz8oKTogc3RyaW5nW107IC8vIGRlZmF1bHQgW107XG59XG5cbnR5cGUgQ29tcG9uZW50UHJvcHMgPSB7XG4gICAgICAgIG9uY2xpY2s/OiBUSGFuZGxlcjtcbiAgICAgICAgb25jcmVhdGU/OiBUSGFuZGxlcjtcbiAgICAgICAgY29sb3I/OiBUQ29sb3I7IC8vIG91IFRDb2xvciwgZXRjLlxuICAgICAgICBuYW1lPzogc3RyaW5nO1xuICAgICAgICBjb21wb25lbnQ/OiBzdHJpbmc7XG59O1xuXG4vL3R5cGUgUmF3UHJvcCA9IFJlY29yZDxzdHJpbmcsIHN0cmluZz47XG5cbmV4cG9ydCBjbGFzcyBUQ29tcG9uZW50IHtcbiAgICAgICAgZ2V0TWV0YWNsYXNzKCk6IFRNZXRhQ29tcG9uZW50IHtcbiAgICAgICAgICAgICAgICByZXR1cm4gVE1ldGFDb21wb25lbnQubWV0YWNsYXNzO1xuICAgICAgICB9XG5cbiAgICAgICAgcmVhZG9ubHkgbmFtZTogc3RyaW5nO1xuICAgICAgICByZWFkb25seSBwYXJlbnQ6IFRDb21wb25lbnQgfCBudWxsID0gbnVsbDtcbiAgICAgICAgZm9ybTogVEZvcm0gfCBudWxsID0gbnVsbDtcbiAgICAgICAgY2hpbGRyZW46IFRDb21wb25lbnRbXSA9IFtdO1xuXG4gICAgICAgIGVsZW06IEVsZW1lbnQgfCBudWxsID0gbnVsbDtcbiAgICAgICAgZ2V0IGh0bWxFbGVtZW50KCk6IEhUTUxFbGVtZW50IHwgbnVsbCB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuZWxlbSBhcyBIVE1MRWxlbWVudCB8IG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3RydWN0b3IobmFtZTogc3RyaW5nLCBmb3JtOiBURm9ybSB8IG51bGwsIHBhcmVudDogVENvbXBvbmVudCB8IG51bGwpIHtcbiAgICAgICAgICAgICAgICB0aGlzLm5hbWUgPSBuYW1lO1xuICAgICAgICAgICAgICAgIHRoaXMucGFyZW50ID0gcGFyZW50O1xuICAgICAgICAgICAgICAgIHBhcmVudD8uY2hpbGRyZW4ucHVzaCh0aGlzKTtcbiAgICAgICAgICAgICAgICB0aGlzLmZvcm0gPSBmb3JtO1xuICAgICAgICAgICAgICAgIHRoaXMubmFtZSA9IG5hbWU7XG4gICAgICAgIH1cblxuICAgICAgICBkZWNsYXJlIHByb3BzOiBDb21wb25lbnRQcm9wcztcbiAgICAgICAgLy9yYXdQcm9wczogUmF3UHJvcFtdID0gW107XG5cbiAgICAgICAgLyoqIE1heSBjb250YWluIGNoaWxkIGNvbXBvbmVudHMgKi9cbiAgICAgICAgYWxsb3dzQ2hpbGRyZW4oKTogYm9vbGVhbiB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG5cbiAgICAgICAgZ2V0IGNvbG9yKCk6IFRDb2xvciB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMucHJvcHMuY29sb3IgPz8gbmV3IFRDb2xvcignZGVmYXVsdCcpO1xuICAgICAgICB9XG5cbiAgICAgICAgc2V0IGNvbG9yKGNvbG9yKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5wcm9wcy5jb2xvciA9IGNvbG9yO1xuICAgICAgICAgICAgICAgIGNvbnN0IGVsID0gdGhpcy5odG1sRWxlbWVudDtcbiAgICAgICAgICAgICAgICBpZiAoIWVsKSByZXR1cm47XG5cbiAgICAgICAgICAgICAgICB0aGlzLnNldFN0eWxlUHJvcCgnY29sb3InLCB0aGlzLmNvbG9yLnMpO1xuICAgICAgICB9XG5cbiAgICAgICAgZ2V0IG9uY2xpY2soKTogVEhhbmRsZXIge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLnByb3BzLm9uY2xpY2sgPz8gbmV3IFRIYW5kbGVyKCcnKTtcbiAgICAgICAgfVxuICAgICAgICBzZXQgb25jbGljayhoYW5kbGVyKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5wcm9wcy5vbmNsaWNrID0gaGFuZGxlcjtcbiAgICAgICAgfVxuXG4gICAgICAgIHN5bmNEb21Gcm9tUHJvcHMoKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgZWwgPSB0aGlzLmh0bWxFbGVtZW50O1xuICAgICAgICAgICAgICAgIGlmICghZWwpIHJldHVybjtcblxuICAgICAgICAgICAgICAgIHRoaXMuc2V0U3R5bGVQcm9wKCdjb2xvcicsIHRoaXMuY29sb3Iucyk7XG4gICAgICAgIH1cblxuICAgICAgICBnZXQgYmFja2dyb3VuZENvbG9yKCk6IFRDb2xvciB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBUQ29sb3IodGhpcy5nZXRTdHlsZVByb3AoJ2JhY2tncm91bmQtY29sb3InKSk7XG4gICAgICAgIH1cbiAgICAgICAgc2V0IGJhY2tncm91bmRDb2xvcih2OiBUQ29sb3IpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnNldFN0eWxlUHJvcCgnYmFja2dyb3VuZC1jb2xvcicsIHYucyk7XG4gICAgICAgIH1cblxuICAgICAgICBnZXQgd2lkdGgoKTogbnVtYmVyIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcGFyc2VJbnQodGhpcy5nZXRTdHlsZVByb3AoJ3dpZHRoJykpO1xuICAgICAgICB9XG4gICAgICAgIHNldCB3aWR0aCh2OiBudW1iZXIpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnNldFN0eWxlUHJvcCgnd2lkdGgnLCB2LnRvU3RyaW5nKCkpO1xuICAgICAgICB9XG5cbiAgICAgICAgZ2V0IGhlaWdodCgpOiBudW1iZXIge1xuICAgICAgICAgICAgICAgIHJldHVybiBwYXJzZUludCh0aGlzLmdldFN0eWxlUHJvcCgnaGVpZ2h0JykpO1xuICAgICAgICB9XG4gICAgICAgIHNldCBoZWlnaHQodjogbnVtYmVyKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5zZXRTdHlsZVByb3AoJ2hlaWdodCcsIHYudG9TdHJpbmcoKSk7XG4gICAgICAgIH1cblxuICAgICAgICBnZXQgb2Zmc2V0V2lkdGgoKTogbnVtYmVyIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5odG1sRWxlbWVudCEub2Zmc2V0V2lkdGg7XG4gICAgICAgIH1cbiAgICAgICAgZ2V0IG9mZnNldEhlaWdodCgpOiBudW1iZXIge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmh0bWxFbGVtZW50IS5vZmZzZXRIZWlnaHQ7XG4gICAgICAgIH1cblxuICAgICAgICBzZXRTdHlsZVByb3AobmFtZTogc3RyaW5nLCB2YWx1ZTogc3RyaW5nKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5odG1sRWxlbWVudCEuc3R5bGUuc2V0UHJvcGVydHkobmFtZSwgdmFsdWUpO1xuICAgICAgICB9XG5cbiAgICAgICAgZ2V0U3R5bGVQcm9wKG5hbWU6IHN0cmluZykge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmh0bWxFbGVtZW50IS5zdHlsZS5nZXRQcm9wZXJ0eVZhbHVlKG5hbWUpO1xuICAgICAgICB9XG5cbiAgICAgICAgc2V0UHJvcChuYW1lOiBzdHJpbmcsIHZhbHVlOiBzdHJpbmcpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmh0bWxFbGVtZW50IS5zZXRBdHRyaWJ1dGUobmFtZSwgdmFsdWUpO1xuICAgICAgICB9XG5cbiAgICAgICAgZ2V0UHJvcChuYW1lOiBzdHJpbmcpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcyEuaHRtbEVsZW1lbnQhLmdldEF0dHJpYnV0ZShuYW1lKTtcbiAgICAgICAgfVxufVxuXG5leHBvcnQgY2xhc3MgVE1ldGFDb21wb25lbnRUeXBlUmVnaXN0cnkgZXh0ZW5kcyBUTWV0YU9iamVjdCB7XG4gICAgICAgIHN0YXRpYyByZWFkb25seSBtZXRhY2xhc3M6IFRNZXRhQ29tcG9uZW50VHlwZVJlZ2lzdHJ5ID0gbmV3IFRNZXRhQ29tcG9uZW50VHlwZVJlZ2lzdHJ5KFRNZXRhT2JqZWN0Lm1ldGFDbGFzcyk7XG4gICAgICAgIHByb3RlY3RlZCBjb25zdHJ1Y3RvcihzdXBlckNsYXNzOiBUTWV0YU9iamVjdCkge1xuICAgICAgICAgICAgICAgIHN1cGVyKHN1cGVyQ2xhc3MpO1xuICAgICAgICAgICAgICAgIC8vIGV0IHZvdXMgY2hhbmdleiBqdXN0ZSBsZSBub20gOlxuICAgICAgICAgICAgICAgICh0aGlzIGFzIGFueSkudHlwZU5hbWUgPSAnVE9iamVjdCc7XG4gICAgICAgIH1cbiAgICAgICAgZ2V0TWV0YWNsYXNzKCk6IFRNZXRhQ29tcG9uZW50VHlwZVJlZ2lzdHJ5IHtcbiAgICAgICAgICAgICAgICByZXR1cm4gVE1ldGFDb21wb25lbnRUeXBlUmVnaXN0cnkubWV0YWNsYXNzO1xuICAgICAgICB9XG59XG5cbmV4cG9ydCBjbGFzcyBUQ29tcG9uZW50VHlwZVJlZ2lzdHJ5IGV4dGVuZHMgVE9iamVjdCB7XG4gICAgICAgIC8vIFdlIHN0b3JlIGhldGVyb2dlbmVvdXMgbWV0YXMsIHNvIHdlIGtlZXAgdGhlbSBhcyBUTWV0YUNvbXBvbmVudDxhbnk+LlxuICAgICAgICBnZXRNZXRhY2xhc3MoKTogVE1ldGFDb21wb25lbnRUeXBlUmVnaXN0cnkge1xuICAgICAgICAgICAgICAgIHJldHVybiBUTWV0YUNvbXBvbmVudFR5cGVSZWdpc3RyeS5tZXRhQ2xhc3M7XG4gICAgICAgIH1cbiAgICAgICAgcHJpdmF0ZSByZWFkb25seSBjbGFzc2VzID0gbmV3IE1hcDxzdHJpbmcsIFRNZXRhQ29tcG9uZW50PigpO1xuXG4gICAgICAgIHJlZ2lzdGVyKG1ldGE6IFRNZXRhQ29tcG9uZW50KSB7XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuY2xhc3Nlcy5oYXMobWV0YS50eXBlTmFtZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgQ29tcG9uZW50IHR5cGUgYWxyZWFkeSByZWdpc3RlcmVkOiAke21ldGEudHlwZU5hbWV9YCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHRoaXMuY2xhc3Nlcy5zZXQobWV0YS50eXBlTmFtZSwgbWV0YSk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBJZiB5b3UganVzdCBuZWVkIFwic29tZXRoaW5nIG1ldGFcIiwgcmV0dXJuIGFueS1tZXRhLlxuICAgICAgICBnZXQodHlwZU5hbWU6IHN0cmluZyk6IFRNZXRhQ29tcG9uZW50IHwgdW5kZWZpbmVkIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5jbGFzc2VzLmdldCh0eXBlTmFtZSk7XG4gICAgICAgIH1cblxuICAgICAgICBoYXModHlwZU5hbWU6IHN0cmluZyk6IGJvb2xlYW4ge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmNsYXNzZXMuaGFzKHR5cGVOYW1lKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGxpc3QoKTogc3RyaW5nW10ge1xuICAgICAgICAgICAgICAgIHJldHVybiBbLi4udGhpcy5jbGFzc2VzLmtleXMoKV0uc29ydCgpO1xuICAgICAgICB9XG59XG5cbmV4cG9ydCBjbGFzcyBUQ29sb3Ige1xuICAgICAgICBzOiBzdHJpbmc7XG5cbiAgICAgICAgY29uc3RydWN0b3Ioczogc3RyaW5nKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5zID0gcztcbiAgICAgICAgfVxuICAgICAgICAvKiBmYWN0b3J5ICovIHN0YXRpYyByZ2IocjogbnVtYmVyLCBnOiBudW1iZXIsIGI6IG51bWJlcik6IFRDb2xvciB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBUQ29sb3IoYHJnYigke3J9LCAke2d9LCAke2J9KWApO1xuICAgICAgICB9XG4gICAgICAgIC8qIGZhY3RvcnkgKi8gc3RhdGljIHJnYmEocjogbnVtYmVyLCBnOiBudW1iZXIsIGI6IG51bWJlciwgYTogbnVtYmVyKTogVENvbG9yIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gbmV3IFRDb2xvcihgcmdiYSgke3J9LCAke2d9LCAke2J9LCAke2F9KWApO1xuICAgICAgICB9XG59XG5cbmV4cG9ydCBjbGFzcyBUSGFuZGxlciB7XG4gICAgICAgIHM6IHN0cmluZztcblxuICAgICAgICBjb25zdHJ1Y3RvcihzOiBzdHJpbmcpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnMgPSBzO1xuICAgICAgICB9XG4gICAgICAgIGZpcmUoZm9ybTogVEZvcm0sIGhhbmRsZXJOYW1lOiBzdHJpbmcsIGV2OiBFdmVudCwgc2VuZGVyOiBhbnkpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBtYXliZU1ldGhvZCA9IChmb3JtIGFzIGFueSlbdGhpcy5zXTtcbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIG1heWJlTWV0aG9kICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnTk9UIEEgTUVUSE9EJywgaGFuZGxlck5hbWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8vIElmIHNlbmRlciBpcyBtaXNzaW5nLCBmYWxsYmFjayB0byB0aGUgZm9ybSBpdHNlbGYgKHNhZmUpXG4gICAgICAgICAgICAgICAgKG1heWJlTWV0aG9kIGFzIChldmVudDogRXZlbnQsIHNlbmRlcjogYW55KSA9PiBhbnkpLmNhbGwoZm9ybSwgZXYsIHNlbmRlciA/PyB0aGlzKTtcbiAgICAgICAgfVxufVxuXG5leHBvcnQgY2xhc3MgVE1ldGFDb21wb25lbnRSZWdpc3RyeSBleHRlbmRzIFRNZXRhY2xhc3Mge1xuICAgICAgICBzdGF0aWMgcmVhZG9ubHkgbWV0YWNsYXNzOiBUTWV0YUNvbXBvbmVudFJlZ2lzdHJ5ID0gbmV3IFRNZXRhQ29tcG9uZW50UmVnaXN0cnkoVE1ldGFjbGFzcy5tZXRhY2xhc3MpO1xuXG4gICAgICAgIHByb3RlY3RlZCBjb25zdHJ1Y3RvcihzdXBlckNsYXNzOiBUTWV0YWNsYXNzKSB7XG4gICAgICAgICAgICAgICAgc3VwZXIoc3VwZXJDbGFzcywgJ1RDb21wb25lbnRSZWdpc3RyeScpO1xuICAgICAgICB9XG4gICAgICAgIGdldE1ldGFjbGFzcygpOiBUTWV0YUNvbXBvbmVudFJlZ2lzdHJ5IHtcbiAgICAgICAgICAgICAgICByZXR1cm4gVE1ldGFDb21wb25lbnRSZWdpc3RyeS5tZXRhY2xhc3M7XG4gICAgICAgIH1cbn1cblxuZXhwb3J0IGNsYXNzIFRDb21wb25lbnRSZWdpc3RyeSBleHRlbmRzIFRPYmplY3Qge1xuICAgICAgICBnZXRNZXRhY2xhc3MoKTogVE1ldGFDb21wb25lbnRSZWdpc3RyeSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIFRNZXRhQ29tcG9uZW50UmVnaXN0cnkubWV0YWNsYXNzO1xuICAgICAgICB9XG5cbiAgICAgICAgcHJpdmF0ZSBpbnN0YW5jZXMgPSBuZXcgTWFwPHN0cmluZywgVENvbXBvbmVudD4oKTtcblxuICAgICAgICBsb2dnZXIgPSB7XG4gICAgICAgICAgICAgICAgZGVidWcobXNnOiBzdHJpbmcsIGRhdGE/OiBKc29uKTogdm9pZCB7fSxcbiAgICAgICAgICAgICAgICBpbmZvKG1zZzogc3RyaW5nLCBkYXRhPzogSnNvbik6IHZvaWQge30sXG4gICAgICAgICAgICAgICAgd2Fybihtc2c6IHN0cmluZywgZGF0YT86IEpzb24pOiB2b2lkIHt9LFxuICAgICAgICAgICAgICAgIGVycm9yKG1zZzogc3RyaW5nLCBkYXRhPzogSnNvbik6IHZvaWQge31cbiAgICAgICAgfTtcblxuICAgICAgICBldmVudEJ1cyA9IHtcbiAgICAgICAgICAgICAgICBvbihldmVudDogc3RyaW5nLCBoYW5kbGVyOiAocGF5bG9hZDogYW55KSA9PiB2b2lkKTogKCkgPT4gdm9pZCB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gKCkgPT4gdm9pZCB7fTtcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIGVtaXQoZXZlbnQ6IHN0cmluZywgcGF5bG9hZDogYW55KTogdm9pZCB7fVxuICAgICAgICB9O1xuXG4gICAgICAgIHN0b3JhZ2UgPSB7XG4gICAgICAgICAgICAgICAgZ2V0KGtleTogc3RyaW5nKTogUHJvbWlzZTxhbnk+IHwgbnVsbCB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIHNldChrZXk6IHN0cmluZywgdmFsdWU6IGFueSk6IFByb21pc2U8dm9pZD4gfCBudWxsIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgcmVtb3ZlKGtleTogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB8IG51bGwge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICB9O1xuXG4gICAgICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICAgICAgICAgIHN1cGVyKCk7XG4gICAgICAgIH1cblxuICAgICAgICByZWdpc3Rlckluc3RhbmNlKG5hbWU6IHN0cmluZywgYzogVENvbXBvbmVudCkge1xuICAgICAgICAgICAgICAgIHRoaXMuaW5zdGFuY2VzLnNldChuYW1lLCBjKTtcbiAgICAgICAgfVxuICAgICAgICBnZXQ8VCBleHRlbmRzIFRDb21wb25lbnQgPSBUQ29tcG9uZW50PihuYW1lOiBzdHJpbmcpOiBUIHwgdW5kZWZpbmVkIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5pbnN0YW5jZXMuZ2V0KG5hbWUpIGFzIFQgfCB1bmRlZmluZWQ7XG4gICAgICAgIH1cblxuICAgICAgICBzZXJ2aWNlczogRGVscGhpbmVTZXJ2aWNlcyA9IHtcbiAgICAgICAgICAgICAgICBsb2c6IHRoaXMubG9nZ2VyLFxuICAgICAgICAgICAgICAgIGJ1czogdGhpcy5ldmVudEJ1cyxcbiAgICAgICAgICAgICAgICBzdG9yYWdlOiB0aGlzLnN0b3JhZ2VcbiAgICAgICAgfTtcblxuICAgICAgICBjbGVhcigpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmluc3RhbmNlcy5jbGVhcigpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmVzb2x2ZVJvb3QoKTogSFRNTEVsZW1lbnQge1xuICAgICAgICAgICAgICAgIC8vIFByZWZlciBib2R5IGFzIHRoZSBjYW5vbmljYWwgcm9vdC5cbiAgICAgICAgICAgICAgICBpZiAoZG9jdW1lbnQuYm9keT8uZGF0YXNldD8uY29tcG9uZW50KSByZXR1cm4gZG9jdW1lbnQuYm9keTtcblxuICAgICAgICAgICAgICAgIC8vIEJhY2t3YXJkIGNvbXBhdGliaWxpdHk6IG9sZCB3cmFwcGVyIGRpdi5cbiAgICAgICAgICAgICAgICBjb25zdCBsZWdhY3kgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnZGVscGhpbmUtcm9vdCcpO1xuICAgICAgICAgICAgICAgIGlmIChsZWdhY3kpIHJldHVybiBsZWdhY3k7XG5cbiAgICAgICAgICAgICAgICAvLyBMYXN0IHJlc29ydC5cbiAgICAgICAgICAgICAgICByZXR1cm4gZG9jdW1lbnQuYm9keSA/PyBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQ7XG4gICAgICAgIH1cblxuICAgICAgICBwcml2YXRlIGNvbnZlcnQocmF3OiBzdHJpbmcsIGtpbmQ6IFByb3BLaW5kKSB7XG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiByYXcgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzd2l0Y2ggKGtpbmQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSAnc3RyaW5nJzpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmF3O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYXNlICdudW1iZXInOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBOdW1iZXIocmF3KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSAnYm9vbGVhbic6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJhdyA9PT0gJ3RydWUnIHx8IHJhdyA9PT0gJzEnIHx8IHJhdyA9PT0gJyc7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgJ2NvbG9yJzpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gbmV3IFRDb2xvcihyYXcpOyAvLyBvdSBwYXJzZSBlbiBUQ29sb3Igc2kgdm91cyBhdmV6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgJ2hhbmRsZXInOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBuZXcgVEhhbmRsZXIocmF3KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvLyBQYXJzZSBIVE1MIGF0dHJpYnV0ZXMgaW50byBhIHBsYWluIG9iamVjdFxuICAgICAgICAvLyBUaGlzIGZ1bmN0aW9uIGlzIGNhbGxlZCBqdXN0ZSBvbmNlLCBpbiBidWlsZENvbXBvbmVudFRyZWUoKSwgYWZ0ZXIgdGhlIEZvcm0gaXMgY3JlYXRlZC5cbiAgICAgICAgcGFyc2VQcm9wc0Zyb21FbGVtZW50KGVsOiBFbGVtZW50LCBkZWZQcm9wczogUHJvcFNwZWM8YW55PltdKTogUmVjb3JkPHN0cmluZywgdW5rbm93bj4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IG91dDogUmVjb3JkPHN0cmluZywgdW5rbm93bj4gPSB7fTtcblxuICAgICAgICAgICAgICAgIC8vIDEpIEpTT04gYnVsa1xuICAgICAgICAgICAgICAgIGNvbnN0IHJhdyA9IGVsLmdldEF0dHJpYnV0ZSgnZGF0YS1wcm9wcycpO1xuICAgICAgICAgICAgICAgIGlmIChyYXcpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHIgPSByYXcgPyBKU09OLnBhcnNlKHJhdykgOiB7fTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy9mb3IgKGNvbnN0IHAgb2YgcHJvcHMoKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3IgKGNvbnN0IHNwZWMgb2YgZGVmUHJvcHMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCB2ID0gcltzcGVjLm5hbWVdO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICh2ICE9IHVuZGVmaW5lZCAmJiB2ICE9IG51bGwpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHZhbHVlID0gdGhpcy5jb252ZXJ0KHYsIHNwZWMua2luZCk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG91dFtzcGVjLm5hbWVdID0gdmFsdWU7IC8vIFRoaXMgaXMgZG9uZSBieSBzcGVjLmFwcGx5KClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vc3BlYy5hcHBseShvdXQsIHYpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvL31cbiAgICAgICAgICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcignSW52YWxpZCBKU09OIGluIGRhdGEtcHJvcHMnLCByYXcsIGUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8vIDIpIFdoaXRlbGlzdDogb25seSBkZWNsYXJlZCBwcm9wcyBvdmVycmlkZSAvIGNvbXBsZW1lbnRcbiAgICAgICAgICAgICAgICAvL2NvbnN0IGRlZlByb3BzID0gdGhpcy5jb2xsZWN0RGVmUHJvcHMoKTtcbiAgICAgICAgICAgICAgICBmb3IgKGNvbnN0IHAgb2YgZGVmUHJvcHMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGF0dHIgPSBlbC5nZXRBdHRyaWJ1dGUoYGRhdGEtJHtwLm5hbWV9YCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoYXR0ciAhPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCB4ID0gdGhpcy5jb252ZXJ0KGF0dHIsIHAua2luZCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG91dFtwLm5hbWVdID0geDtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICByZXR1cm4gb3V0O1xuICAgICAgICB9XG5cbiAgICAgICAgY29sbGVjdERlZlByb3BzKGNvbXA6IFRNZXRhQ29tcG9uZW50KTogUHJvcFNwZWM8YW55PltdIHtcbiAgICAgICAgICAgICAgICBjb25zdCBvdXQ6IFByb3BTcGVjPGFueT5bXSA9IFtdO1xuICAgICAgICAgICAgICAgIGNvbnN0IHNlZW4gPSBuZXcgU2V0PHN0cmluZz4oKTtcblxuICAgICAgICAgICAgICAgIC8vIFdhbGsgdXAgbWV0YWNsYXNzIGluaGVyaXRhbmNlOiB0aGlzIC0+IHN1cGVyIC0+IHN1cGVyLi4uXG4gICAgICAgICAgICAgICAgbGV0IG1jOiBUTWV0YUNvbXBvbmVudCB8IG51bGwgPSBjb21wO1xuXG4gICAgICAgICAgICAgICAgd2hpbGUgKG1jKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodHlwZW9mIG1jLmRlZlByb3BzID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvciAoY29uc3Qgc3BlYyBvZiBtYy5kZWZQcm9wcygpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gQ2hpbGQgb3ZlcnJpZGVzIHBhcmVudCBpZiBzYW1lIG5hbWUuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFzZWVuLmhhcyhzcGVjLm5hbWUpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvdXQucHVzaChzcGVjKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNlZW4uYWRkKHNwZWMubmFtZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBtYyA9IChtYy5zdXBlckNsYXNzIGFzIFRNZXRhQ29tcG9uZW50KSA/PyBudWxsO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHJldHVybiBvdXQ7XG4gICAgICAgIH1cblxuICAgICAgICBwcml2YXRlIHByb2Nlc3NFbGVtKGVsOiBFbGVtZW50LCBmb3JtOiBURm9ybSwgcGFyZW50OiBUQ29tcG9uZW50KSB7XG4gICAgICAgICAgICAgICAgY29uc3QgbmFtZSA9IGVsLmdldEF0dHJpYnV0ZSgnZGF0YS1uYW1lJyk7XG4gICAgICAgICAgICAgICAgY29uc3QgdHlwZSA9IGVsLmdldEF0dHJpYnV0ZSgnZGF0YS1jb21wb25lbnQnKTtcblxuICAgICAgICAgICAgICAgIGNvbnN0IGNscyA9IFRBcHBsaWNhdGlvbi5UaGVBcHBsaWNhdGlvbi50eXBlcy5nZXQodHlwZSEpO1xuXG4gICAgICAgICAgICAgICAgaWYgKCFjbHMpIHJldHVybjtcblxuICAgICAgICAgICAgICAgIGxldCBjaGlsZCA9IHBhcmVudDtcbiAgICAgICAgICAgICAgICBpZiAoY2xzICE9IFRNZXRhRm9ybS5tZXRhY2xhc3MpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIFRoZSBURm9ybSBpcyBhbHJlYWR5IGNyZWF0ZWQgYnkgdGhlIHVzZXIuXG4gICAgICAgICAgICAgICAgICAgICAgICBjaGlsZCA9IGNscy5jcmVhdGUobmFtZSEsIGZvcm0sIHBhcmVudCk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgdGhpcy5yZWdpc3Rlckluc3RhbmNlKG5hbWUhLCBjaGlsZCk7XG4gICAgICAgICAgICAgICAgLy8gbmFtZTogc3RyaW5nLCBmb3JtOiBURm9ybSwgcGFyZW50OiBUQ29tcG9uZW50LCBlbGVtOiBIVE1MRWxlbWVudFxuICAgICAgICAgICAgICAgIGlmICghY2hpbGQpIHJldHVybjtcblxuICAgICAgICAgICAgICAgIC8vY2hpbGQucGFyZW50ID0gY29tcG9uZW50O1xuXG4gICAgICAgICAgICAgICAgY2hpbGQuZWxlbSA9IGVsO1xuICAgICAgICAgICAgICAgIC8vY2hpbGQuZm9ybSA9IGZvcm07XG4gICAgICAgICAgICAgICAgLy9jaGlsZC5uYW1lID0gbmFtZSE7XG4gICAgICAgICAgICAgICAgLy8gT3B0aW9uYWwgcHJvcHNcblxuICAgICAgICAgICAgICAgIC8vIFdlIGNvbGxlY3RcbiAgICAgICAgICAgICAgICBjb25zdCBhbGxEZWZQcm9wc0NvbGxlY3RlZCA9IHRoaXMuY29sbGVjdERlZlByb3BzKGNscyk7IC8vIFRoaXMgaXMgZG9uZSBkdXJpbmcgcnVudGltZSwgYnV0IGNvdWxkIGJlIGRvbmUgYXQgY29tcGlsZXRpbWVcbiAgICAgICAgICAgICAgICBjaGlsZC5wcm9wcyA9IHRoaXMucGFyc2VQcm9wc0Zyb21FbGVtZW50KGVsLCBhbGxEZWZQcm9wc0NvbGxlY3RlZCk7XG4gICAgICAgICAgICAgICAgY2hpbGQuc3luY0RvbUZyb21Qcm9wcygpO1xuICAgICAgICAgICAgICAgIC8vY29uc3QgcmF3UHJvcHMgPSBjaGlsZC5yYXdQcm9wcztcbiAgICAgICAgICAgICAgICAvL2NoaWxkLnByb3BzID0gbmV3IE9iamVjdCgpO1xuICAgICAgICAgICAgICAgIC8vZm9yIChjb25zdCBwcm9wcyBpbiBjaGlsZC5wcm9wcykge1xuXG4gICAgICAgICAgICAgICAgLy9jb25zdCBwcm9wcyA9IGNscy5hcHBseVByb3BzRnJvbUVsZW1lbnQoY2hpbGQsIGVsKTtcbiAgICAgICAgICAgICAgICAvL2NoaWxkLnByb3BzID0gcHJvcHM7XG4gICAgICAgICAgICAgICAgKGNoaWxkIGFzIGFueSkub25BdHRhY2hlZFRvRG9tPy4oKTtcblxuICAgICAgICAgICAgICAgIC8vdGhpcy5hcHBseVByb3BzKGNoaWxkLCBjbHMpO1xuXG4gICAgICAgICAgICAgICAgcGFyZW50LmNoaWxkcmVuLnB1c2goY2hpbGQpO1xuICAgICAgICAgICAgICAgIGNvbnN0IG1heWJlSG9zdCA9IGNoaWxkIGFzIHVua25vd24gYXMgUGFydGlhbDxJUGx1Z2luSG9zdD47XG4gICAgICAgICAgICAgICAgaWYgKG1heWJlSG9zdCAmJiB0eXBlb2YgbWF5YmVIb3N0LnNldFBsdWdpblNwZWMgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHBsdWdpbiA9IGVsLmdldEF0dHJpYnV0ZSgnZGF0YS1wbHVnaW4nKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHJhdyA9IGVsLmdldEF0dHJpYnV0ZSgnZGF0YS1wcm9wcycpO1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgcHJvcHMgPSByYXcgPyBKU09OLnBhcnNlKHJhdykgOiB7fTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgbWF5YmVIb3N0LnNldFBsdWdpblNwZWMoeyBwbHVnaW4sIHByb3BzIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgbWF5YmVIb3N0Lm1vdW50UGx1Z2luSWZSZWFkeSEodGhpcy5zZXJ2aWNlcyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAvL21heWJlSG9zdC5tb3VudEZyb21SZWdpc3RyeShzZXJ2aWNlcyk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLy8gQWN0dWFsbHkgdGhpcyBkb2VzIG5vdCB3b3JrIGZvciBURm9ybSA6IGluZmluaXRlIHJlY3Vyc2lvblxuICAgICAgICAgICAgICAgIGlmIChjaGlsZC5hbGxvd3NDaGlsZHJlbigpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvL3RoaXMuYnVpbGRDb21wb25lbnRUcmVlKGZvcm0sIGNoaWxkKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgLy9pZiAoZWwgPT09IHJvb3QpIHJldHVybjsgLy8gTm8gbmVlZCB0byBnbyBoaWdoZXIgaW4gdGhlIGhpZXJhY2h5XG4gICAgICAgIH1cblxuICAgICAgICAvLyBUaGlzIGZ1bmN0aW9uIGlzIGNhbGxlZCBqdXN0ZSBvbmNlLCB3aGVuIHRoZSBmb3JtIGlzIGNyZWF0ZWRcbiAgICAgICAgYnVpbGRDb21wb25lbnRUcmVlKGZvcm06IFRGb3JtLCByb290OiBUQ29tcG9uZW50KSB7XG4gICAgICAgICAgICAgICAgdGhpcy5jbGVhcigpO1xuICAgICAgICAgICAgICAgIC8vIC0tLSBGT1JNIC0tLVxuICAgICAgICAgICAgICAgIC8vIHByb3Zpc29pcmVtZW50IGlmIChyb290LmdldEF0dHJpYnV0ZSgnZGF0YS1jb21wb25lbnQnKSA9PT0gJ1RGb3JtJykge1xuICAgICAgICAgICAgICAgIC8vY29uc3QgZWwgPSByb290LmVsZW0hO1xuXG4gICAgICAgICAgICAgICAgLy90aGlzLnJlZ2lzdGVySW5zdGFuY2Uocm9vdC5uYW1lLCBmb3JtKTtcbiAgICAgICAgICAgICAgICAvL31cbiAgICAgICAgICAgICAgICBjb25zdCByb290RWxlbSA9IHJvb3QuZWxlbSE7XG4gICAgICAgICAgICAgICAgdGhpcy5wcm9jZXNzRWxlbShyb290RWxlbSwgZm9ybSwgcm9vdCk7XG5cbiAgICAgICAgICAgICAgICAvLyAtLS0gQ0hJTEQgQ09NUE9ORU5UUyAtLS1cbiAgICAgICAgICAgICAgICByb290RWxlbS5xdWVyeVNlbGVjdG9yQWxsKCc6c2NvcGUgPiBbZGF0YS1jb21wb25lbnRdJykuZm9yRWFjaCgoZWwpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucHJvY2Vzc0VsZW0oZWwsIGZvcm0sIHJvb3QpO1xuICAgICAgICAgICAgICAgICAgICAgICAgLy9pZiAoZWwgPT09IHJvb3QpIHJldHVybjtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8qXG5cbiAgICAgICAgYnVpbGRDb21wb25lbnRUcmVlKGZvcm06IFRGb3JtLCBjb21wb25lbnQ6IFRDb21wb25lbnQpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBlbCA9IGNvbXBvbmVudC5lbGVtITtcblxuICAgICAgICAgICAgICAgIC8vIC0tLS0gQ0hJTEQgQ09NUE9ORU5UUyAtLS0tXG4gICAgICAgICAgICAgICAgZWwucXVlcnlTZWxlY3RvckFsbCgnOnNjb3BlID4gW2RhdGEtY29tcG9uZW50XScpLmZvckVhY2goKGNoaWxkRWwpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IG5hbWUgPSBjaGlsZEVsLmdldEF0dHJpYnV0ZSgnZGF0YS1uYW1lJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBjaGlsZFR5cGUgPSBjaGlsZEVsLmdldEF0dHJpYnV0ZSgnZGF0YS1jb21wb25lbnQnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghbmFtZSB8fCAhY2hpbGRUeXBlKSByZXR1cm47XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGNoaWxkQ2xhc3MgPSBUQXBwbGljYXRpb24uVGhlQXBwbGljYXRpb24udHlwZXMuZ2V0KGNoaWxkVHlwZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIWNoaWxkQ2xhc3MpIHJldHVybjtcblxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgY2hpbGQgPSBjaGlsZENsYXNzLmNyZWF0ZShuYW1lLCBmb3JtLCBjb21wb25lbnQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgY2hpbGQuZWxlbSA9IGNoaWxkRWw7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIFx1MjcwNSBQYXJlbnQvY2hpbGRyZW4gbGluayAoeW91IGFscmVhZHkgZG8gaXQgZWxzZXdoZXJlIHRvbzsga2VlcCBvbmUgcGxhY2UpXG4gICAgICAgICAgICAgICAgICAgICAgICBjb21wb25lbnQuY2hpbGRyZW4ucHVzaChjaGlsZCk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIFx1MjcwNSBSZWdpc3RlciBjaGlsZCBpbnN0YW5jZVxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5yZWdpc3Rlckluc3RhbmNlKG5hbWUsIGNoaWxkKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gLS0tLSBBcHBseSBwcm9wcyBvbiBjaGlsZCBub3cgKHNvIHN5bmNEb20gd29ya3MgYmVmb3JlIGRlZXBlciBidWlsZCkgLS0tLVxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgYWxsRGVmUHJvcHNDb2xsZWN0ZWQgPSB0aGlzLmNvbGxlY3REZWZQcm9wcyhjaGlsZENsYXNzKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNoaWxkLnByb3BzID0gdGhpcy5wYXJzZVByb3BzRnJvbUVsZW1lbnQoY2hpbGRFbCwgYWxsRGVmUHJvcHNDb2xsZWN0ZWQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgY2hpbGQuc3luY0RvbUZyb21Qcm9wcygpO1xuICAgICAgICAgICAgICAgICAgICAgICAgKGNoaWxkIGFzIGFueSkub25BdHRhY2hlZFRvRG9tPy4oKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gLS0tLSBQbHVnaW4gaG9zdCBvbiBjaGlsZCAtLS0tXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBtYXliZUhvc3QyID0gY2hpbGQgYXMgdW5rbm93biBhcyBQYXJ0aWFsPElQbHVnaW5Ib3N0PjtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChtYXliZUhvc3QyICYmIHR5cGVvZiBtYXliZUhvc3QyLnNldFBsdWdpblNwZWMgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgcGx1Z2luID0gY2hpbGRFbC5nZXRBdHRyaWJ1dGUoJ2RhdGEtcGx1Z2luJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHJhdyA9IGNoaWxkRWwuZ2V0QXR0cmlidXRlKCdkYXRhLXByb3BzJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHByb3BzID0gcmF3ID8gSlNPTi5wYXJzZShyYXcpIDoge307XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1heWJlSG9zdDIuc2V0UGx1Z2luU3BlYyh7IHBsdWdpbiwgcHJvcHMgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1heWJlSG9zdDIubW91bnRQbHVnaW5JZlJlYWR5ISh0aGlzLnNlcnZpY2VzKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGNoaWxkLmFsbG93c0NoaWxkcmVuKCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5idWlsZENvbXBvbmVudFRyZWUoZm9ybSwgY2hpbGQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgLy8gV2UgbXVzdCBwcm9jZXNzIHRoZSByb290IGl0c2VsZiwgbGlrZSBhbGwgdGhlIGNoaWxkcmVuXG5cbiAgICAgICAgICAgICAgICAvLyBcdTI3MDUgUmVnaXN0ZXIgY3VycmVudCBpbnN0YW5jZSAocm9vdCBvZiB0aGlzIGNhbGwpXG4gICAgICAgICAgICAgICAgdGhpcy5yZWdpc3Rlckluc3RhbmNlKGNvbXBvbmVudC5uYW1lLCBjb21wb25lbnQpOyAvLyhvciBwZXJoYXBzIGNvbXBvbmVudC5uYW1lLCBmb3JtKVxuICAgICAgICAgICAgICAgIC8vaWYgKCFlbCkgcmV0dXJuO1xuXG4gICAgICAgICAgICAgICAgLy8gLS0tLSBBUFBMWSBQUk9QUyBPTiBDVVJSRU5UIENPTVBPTkVOVCAtLS0tXG4gICAgICAgICAgICAgICAgY29uc3QgdHlwZSA9IGVsLmdldEF0dHJpYnV0ZSgnZGF0YS1jb21wb25lbnQnKTtcbiAgICAgICAgICAgICAgICBpZiAodHlwZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgY2xzID0gVEFwcGxpY2F0aW9uLlRoZUFwcGxpY2F0aW9uLnR5cGVzLmdldCh0eXBlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChjbHMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgYWxsRGVmUHJvcHNDb2xsZWN0ZWQgPSB0aGlzLmNvbGxlY3REZWZQcm9wcyhjbHMpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb21wb25lbnQucHJvcHMgPSB0aGlzLnBhcnNlUHJvcHNGcm9tRWxlbWVudChlbCwgYWxsRGVmUHJvcHNDb2xsZWN0ZWQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb21wb25lbnQuc3luY0RvbUZyb21Qcm9wcygpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIChjb21wb25lbnQgYXMgYW55KS5vbkF0dGFjaGVkVG9Eb20/LigpO1xuXG4gICAgICAgICAgICAgICAgLy8gLS0tLSBQTFVHSU4gSE9TVCAoaWYgY3VycmVudCBpcyBhIGhvc3QpIC0tLS1cbiAgICAgICAgICAgICAgICBjb25zdCBtYXliZUhvc3QgPSBjb21wb25lbnQgYXMgdW5rbm93biBhcyBQYXJ0aWFsPElQbHVnaW5Ib3N0PjtcbiAgICAgICAgICAgICAgICBpZiAobWF5YmVIb3N0ICYmIHR5cGVvZiBtYXliZUhvc3Quc2V0UGx1Z2luU3BlYyA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgcGx1Z2luID0gZWwuZ2V0QXR0cmlidXRlKCdkYXRhLXBsdWdpbicpO1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgcmF3ID0gZWwuZ2V0QXR0cmlidXRlKCdkYXRhLXByb3BzJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBwcm9wcyA9IHJhdyA/IEpTT04ucGFyc2UocmF3KSA6IHt9O1xuICAgICAgICAgICAgICAgICAgICAgICAgbWF5YmVIb3N0LnNldFBsdWdpblNwZWMoeyBwbHVnaW4sIHByb3BzIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgbWF5YmVIb3N0Lm1vdW50UGx1Z2luSWZSZWFkeSEodGhpcy5zZXJ2aWNlcyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgICAgICAgICAgKi9cbn1cblxuZXhwb3J0IGNsYXNzIFREb2N1bWVudCBleHRlbmRzIFRPYmplY3Qge1xuICAgICAgICBzdGF0aWMgZG9jdW1lbnQ6IFREb2N1bWVudCA9IG5ldyBURG9jdW1lbnQoZG9jdW1lbnQpO1xuICAgICAgICBzdGF0aWMgYm9keSA9IGRvY3VtZW50LmJvZHk7XG4gICAgICAgIGh0bWxEb2M6IERvY3VtZW50O1xuICAgICAgICBjb25zdHJ1Y3RvcihodG1sRG9jOiBEb2N1bWVudCkge1xuICAgICAgICAgICAgICAgIHN1cGVyKCk7XG4gICAgICAgICAgICAgICAgdGhpcy5odG1sRG9jID0gaHRtbERvYztcbiAgICAgICAgfVxufVxuXG5leHBvcnQgY2xhc3MgVE1ldGFEb2N1bWVudCBleHRlbmRzIFRNZXRhT2JqZWN0IHtcbiAgICAgICAgc3RhdGljIHJlYWRvbmx5IG1ldGFjbGFzczogVE1ldGFEb2N1bWVudCA9IG5ldyBUTWV0YURvY3VtZW50KFRNZXRhT2JqZWN0Lm1ldGFjbGFzcyk7XG5cbiAgICAgICAgcHJvdGVjdGVkIGNvbnN0cnVjdG9yKHN1cGVyQ2xhc3M6IFRNZXRhT2JqZWN0KSB7XG4gICAgICAgICAgICAgICAgc3VwZXIoc3VwZXJDbGFzcyk7XG4gICAgICAgICAgICAgICAgLy8gZXQgdm91cyBjaGFuZ2V6IGp1c3RlIGxlIG5vbSA6XG4gICAgICAgICAgICAgICAgKHRoaXMgYXMgYW55KS50eXBlTmFtZSA9ICdURG9jdW1lbnQnO1xuICAgICAgICB9XG4gICAgICAgIGdldE1ldGFjbGFzcygpOiBUTWV0YURvY3VtZW50IHtcbiAgICAgICAgICAgICAgICByZXR1cm4gVE1ldGFEb2N1bWVudC5tZXRhY2xhc3M7XG4gICAgICAgIH1cbn1cblxuZXhwb3J0IGNsYXNzIFRNZXRhRm9ybSBleHRlbmRzIFRNZXRhQ29tcG9uZW50IHtcbiAgICAgICAgc3RhdGljIHJlYWRvbmx5IG1ldGFjbGFzczogVE1ldGFGb3JtID0gbmV3IFRNZXRhRm9ybShUTWV0YUNvbXBvbmVudC5tZXRhY2xhc3MpO1xuICAgICAgICBnZXRNZXRhQ2xhc3MoKTogVE1ldGFGb3JtIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gVE1ldGFGb3JtLm1ldGFjbGFzcztcbiAgICAgICAgfVxuXG4gICAgICAgIHByb3RlY3RlZCBjb25zdHJ1Y3RvcihzdXBlckNsYXNzOiBUTWV0YUNvbXBvbmVudCkge1xuICAgICAgICAgICAgICAgIHN1cGVyKHN1cGVyQ2xhc3MpO1xuICAgICAgICAgICAgICAgIC8vIGV0IHZvdXMgY2hhbmdleiBqdXN0ZSBsZSBub20gOlxuICAgICAgICAgICAgICAgICh0aGlzIGFzIGFueSkudHlwZU5hbWUgPSAnVEZvcm0nO1xuICAgICAgICB9XG5cbiAgICAgICAgLy9yZWFkb25seSB0eXBlTmFtZSA9ICdURm9ybSc7XG5cbiAgICAgICAgY3JlYXRlKG5hbWU6IHN0cmluZywgZm9ybTogVEZvcm0sIHBhcmVudDogVENvbXBvbmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBuZXcgVEZvcm0obmFtZSk7XG4gICAgICAgIH1cblxuICAgICAgICAvL3Byb3BzKCk6IFByb3BTcGVjPFRGb3JtPltdIHtcbiAgICAgICAgLy9yZXR1cm4gW107XG4gICAgICAgIC8vfVxuXG4gICAgICAgIGRlZlByb3BzKCk6IFByb3BTcGVjPFRGb3JtPltdIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gW1xuICAgICAgICAgICAgICAgICAgICAgICAgLy97IG5hbWU6ICdjYXB0aW9uJywga2luZDogJ3N0cmluZycsIGFwcGx5OiAobywgdikgPT4gKG8uY2FwdGlvbiA9IFN0cmluZyh2KSkgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgIC8veyBuYW1lOiAnZW5hYmxlZCcsIGtpbmQ6ICdib29sZWFuJywgYXBwbHk6IChvLCB2KSA9PiAoby5lbmFibGVkID0gQm9vbGVhbih2KSkgfVxuICAgICAgICAgICAgICAgIF07XG4gICAgICAgIH1cbn1cblxuLy90eXBlIEZvcm1Qcm9wcyA9IENvbXBvbmVudFByb3BzICYge1xuLy9jYXB0aW9uPzogc3RyaW5nO1xuLy9lbmFibGVkPzogYm9vbGVhbjtcbi8vY29sb3I/OiBUQ29sb3I7IC8vIG91IFRDb2xvciwgZXRjLlxuLy99O1xuZXhwb3J0IGNsYXNzIFRGb3JtIGV4dGVuZHMgVENvbXBvbmVudCB7XG4gICAgICAgIGdldE1ldGFjbGFzcygpOiBUTWV0YUZvcm0ge1xuICAgICAgICAgICAgICAgIHJldHVybiBUTWV0YUZvcm0ubWV0YWNsYXNzO1xuICAgICAgICB9XG4gICAgICAgIGFsbG93c0NoaWxkcmVuKCk6IGJvb2xlYW4ge1xuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIHN0YXRpYyBmb3JtcyA9IG5ldyBNYXA8c3RyaW5nLCBURm9ybT4oKTtcbiAgICAgICAgcHJpdmF0ZSBfbW91bnRlZCA9IGZhbHNlO1xuICAgICAgICAvLyBFYWNoIEZvcm0gaGFzIGl0cyBvd24gY29tcG9uZW50UmVnaXN0cnlcbiAgICAgICAgY29tcG9uZW50UmVnaXN0cnk6IFRDb21wb25lbnRSZWdpc3RyeSA9IG5ldyBUQ29tcG9uZW50UmVnaXN0cnkoKTtcbiAgICAgICAgY29uc3RydWN0b3IobmFtZTogc3RyaW5nKSB7XG4gICAgICAgICAgICAgICAgc3VwZXIobmFtZSwgbnVsbCwgbnVsbCk7XG4gICAgICAgICAgICAgICAgdGhpcy5mb3JtID0gdGhpcztcbiAgICAgICAgICAgICAgICBURm9ybS5mb3Jtcy5zZXQobmFtZSwgdGhpcyk7XG4gICAgICAgIH1cblxuICAgICAgICBnZXQgYXBwbGljYXRpb24oKTogVEFwcGxpY2F0aW9uIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5mb3JtPy5hcHBsaWNhdGlvbiA/PyBUQXBwbGljYXRpb24uVGhlQXBwbGljYXRpb247XG4gICAgICAgIH1cblxuICAgICAgICAvLyBFbmdsaXNoIGNvbW1lbnRzIGFzIHJlcXVlc3RlZC5cblxuICAgICAgICBmaW5kRm9ybUZyb21FdmVudFRhcmdldCh0YXJnZXQ6IEVsZW1lbnQpOiBURm9ybSB8IG51bGwge1xuICAgICAgICAgICAgICAgIC8vIDEpIEZpbmQgdGhlIG5lYXJlc3QgZWxlbWVudCB0aGF0IGxvb2tzIGxpa2UgYSBmb3JtIGNvbnRhaW5lclxuICAgICAgICAgICAgICAgIGNvbnN0IGZvcm1FbGVtID0gdGFyZ2V0LmNsb3Nlc3QoJ1tkYXRhLWNvbXBvbmVudD1cIlRGb3JtXCJdW2RhdGEtbmFtZV0nKSBhcyBFbGVtZW50IHwgbnVsbDtcbiAgICAgICAgICAgICAgICBpZiAoIWZvcm1FbGVtKSByZXR1cm4gbnVsbDtcblxuICAgICAgICAgICAgICAgIC8vIDIpIFJlc29sdmUgdGhlIFRGb3JtIGluc3RhbmNlXG4gICAgICAgICAgICAgICAgY29uc3QgZm9ybU5hbWUgPSBmb3JtRWxlbS5nZXRBdHRyaWJ1dGUoJ2RhdGEtbmFtZScpO1xuICAgICAgICAgICAgICAgIGlmICghZm9ybU5hbWUpIHJldHVybiBudWxsO1xuXG4gICAgICAgICAgICAgICAgcmV0dXJuIFRGb3JtLmZvcm1zLmdldChmb3JtTmFtZSkgPz8gbnVsbDtcbiAgICAgICAgfVxuXG4gICAgICAgIHByaXZhdGUgX2FjOiBBYm9ydENvbnRyb2xsZXIgfCBudWxsID0gbnVsbDtcblxuICAgICAgICBpbnN0YWxsRXZlbnRSb3V0ZXIoKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fYWM/LmFib3J0KCk7XG4gICAgICAgICAgICAgICAgdGhpcy5fYWMgPSBuZXcgQWJvcnRDb250cm9sbGVyKCk7XG4gICAgICAgICAgICAgICAgY29uc3QgeyBzaWduYWwgfSA9IHRoaXMuX2FjO1xuXG4gICAgICAgICAgICAgICAgY29uc3Qgcm9vdCA9IHRoaXMuZWxlbSBhcyBFbGVtZW50IHwgbnVsbDtcbiAgICAgICAgICAgICAgICBpZiAoIXJvb3QpIHJldHVybjtcblxuICAgICAgICAgICAgICAgIC8vIHNhbWUgaGFuZGxlciBmb3IgZXZlcnlib2R5XG4gICAgICAgICAgICAgICAgY29uc3QgaGFuZGxlciA9IChldjogRXZlbnQpID0+IHRoaXMuZGlzcGF0Y2hEb21FdmVudChldik7XG5cbiAgICAgICAgICAgICAgICBmb3IgKGNvbnN0IHR5cGUgb2YgWydjbGljaycsICdpbnB1dCcsICdjaGFuZ2UnLCAna2V5ZG93biddKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByb290LmFkZEV2ZW50TGlzdGVuZXIodHlwZSwgaGFuZGxlciwgeyBjYXB0dXJlOiB0cnVlLCBzaWduYWwgfSk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgZm9yIChjb25zdCB0eXBlIGluIHRoaXMuZ2V0TWV0YWNsYXNzKCkuZG9tRXZlbnRzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByb290LmFkZEV2ZW50TGlzdGVuZXIodHlwZSwgaGFuZGxlciwgeyBjYXB0dXJlOiB0cnVlLCBzaWduYWwgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgZGlzcG9zZUV2ZW50Um91dGVyKCkge1xuICAgICAgICAgICAgICAgIHRoaXMuX2FjPy5hYm9ydCgpO1xuICAgICAgICAgICAgICAgIHRoaXMuX2FjID0gbnVsbDtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFdlIHJlY2VpdmVkIGFuIERPTSBFdmVudC4gRGlzcGF0Y2ggaXRcbiAgICAgICAgcHJpdmF0ZSBkaXNwYXRjaERvbUV2ZW50KGV2OiBFdmVudCkge1xuICAgICAgICAgICAgICAgIGNvbnN0IHRhcmdldEVsZW0gPSBldi50YXJnZXQgYXMgRWxlbWVudCB8IG51bGw7XG4gICAgICAgICAgICAgICAgaWYgKCF0YXJnZXRFbGVtKSByZXR1cm47XG5cbiAgICAgICAgICAgICAgICBjb25zdCBwcm9wTmFtZSA9IGBvbiR7ZXYudHlwZX1gO1xuXG4gICAgICAgICAgICAgICAgbGV0IGVsOiBFbGVtZW50IHwgbnVsbCA9IHRhcmdldEVsZW0uY2xvc2VzdCgnW2RhdGEtY29tcG9uZW50XScpO1xuICAgICAgICAgICAgICAgIGlmICghZWwpIHJldHVybjtcbiAgICAgICAgICAgICAgICBjb25zdCBuYW1lID0gZWwuZ2V0QXR0cmlidXRlKCdkYXRhLW5hbWUnKTtcbiAgICAgICAgICAgICAgICBsZXQgY29tcCA9IG5hbWUgPyB0aGlzLmNvbXBvbmVudFJlZ2lzdHJ5LmdldChuYW1lKSA6IG51bGw7XG4gICAgICAgICAgICAgICAgd2hpbGUgKGNvbXApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGhhbmRsZXIgPSBjb21wPy5wcm9wc1twcm9wTmFtZSBhcyBrZXlvZiB0eXBlb2YgY29tcC5wcm9wc10gYXMgVEhhbmRsZXIgfCBudWxsO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGhhbmRsZXIgJiYgaGFuZGxlci5zICYmIGhhbmRsZXIucyAhPSAnJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBoYW5kbGVyLmZpcmUodGhpcywgcHJvcE5hbWUsIGV2LCBjb21wKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgLy9lbCA9IG5leHQgPz8gZWwucGFyZW50RWxlbWVudD8uY2xvc2VzdCgnW2RhdGEtY29tcG9uZW50XScpID8/IG51bGw7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb21wID0gY29tcC5wYXJlbnQ7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLy8gTm8gaGFuZGxlciBoZXJlOiB0cnkgZ29pbmcgXCJ1cFwiIHVzaW5nIHlvdXIgY29tcG9uZW50IHRyZWUgaWYgcG9zc2libGVcbiAgICAgICAgfVxuXG4gICAgICAgIHNob3coKSB7XG4gICAgICAgICAgICAgICAgLy8gTXVzdCBiZSBkb25lIGJlZm9yZSBidWlsZENvbXBvbmVudFRyZWUoKSBiZWNhdXNlIGBidWlsZENvbXBvbmVudFRyZWUoKWAgZG9lcyBub3QgZG8gYHJlc29sdmVSb290KClgIGl0c2VsZi5cbiAgICAgICAgICAgICAgICBpZiAoIXRoaXMuZWxlbSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5lbGVtID0gdGhpcy5jb21wb25lbnRSZWdpc3RyeS5yZXNvbHZlUm9vdCgpOyAvLyBvdSB0aGlzLnJlc29sdmVSb290KClcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKCF0aGlzLl9tb3VudGVkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmNvbXBvbmVudFJlZ2lzdHJ5LmJ1aWxkQ29tcG9uZW50VHJlZSh0aGlzLCB0aGlzKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMub25DcmVhdGUoKTsgLy8gTWF5YmUgY291bGQgYmUgZG9uZSBhZnRlciBpbnN0YWxsRXZlbnRSb3V0ZXIoKVxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5pbnN0YWxsRXZlbnRSb3V0ZXIoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX21vdW50ZWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB0aGlzLm9uU2hvd24oKTtcblxuICAgICAgICAgICAgICAgIC8vIFRPRE9cbiAgICAgICAgfVxuXG4gICAgICAgIHByb3RlY3RlZCBvbkNyZWF0ZSgpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBvblNob3duTmFtZSA9IHRoaXMuZWxlbSEuZ2V0QXR0cmlidXRlKCdkYXRhLW9uY3JlYXRlJyk7XG4gICAgICAgICAgICAgICAgaWYgKG9uU2hvd25OYW1lKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBxdWV1ZU1pY3JvdGFzaygoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGZuID0gKHRoaXMgYXMgYW55KVtvblNob3duTmFtZV07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgZm4gPT09ICdmdW5jdGlvbicpIGZuLmNhbGwodGhpcywgbnVsbCwgdGhpcyk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBwcm90ZWN0ZWQgb25TaG93bigpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBvblNob3duTmFtZSA9IHRoaXMuZWxlbSEuZ2V0QXR0cmlidXRlKCdkYXRhLW9uc2hvd24nKTtcbiAgICAgICAgICAgICAgICBpZiAob25TaG93bk5hbWUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHF1ZXVlTWljcm90YXNrKCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgZm4gPSAodGhpcyBhcyBhbnkpW29uU2hvd25OYW1lXTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBmbiA9PT0gJ2Z1bmN0aW9uJykgZm4uY2FsbCh0aGlzLCBudWxsLCB0aGlzKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgfVxufVxuXG50eXBlIEJ1dHRvblByb3BzID0gQ29tcG9uZW50UHJvcHMgJiB7XG4gICAgICAgIGNhcHRpb24/OiBzdHJpbmc7XG4gICAgICAgIGVuYWJsZWQ/OiBib29sZWFuO1xuICAgICAgICAvL2NvbG9yPzogVENvbG9yOyAvLyBvdSBUQ29sb3IsIGV0Yy5cbn07XG5cbmV4cG9ydCBjbGFzcyBUQnV0dG9uIGV4dGVuZHMgVENvbXBvbmVudCB7XG4gICAgICAgIGdldE1ldGFjbGFzcygpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gVE1ldGFCdXR0b24ubWV0YWNsYXNzO1xuICAgICAgICB9XG5cbiAgICAgICAgaHRtbEJ1dHRvbigpOiBIVE1MQnV0dG9uRWxlbWVudCB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuaHRtbEVsZW1lbnQhIGFzIEhUTUxCdXR0b25FbGVtZW50O1xuICAgICAgICB9XG5cbiAgICAgICAgcHJvdGVjdGVkIGdldCBicHJvcHMoKTogQnV0dG9uUHJvcHMge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLnByb3BzIGFzIEJ1dHRvblByb3BzO1xuICAgICAgICB9XG5cbiAgICAgICAgZ2V0IGNhcHRpb24oKTogc3RyaW5nIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5icHJvcHMuY2FwdGlvbiA/PyAnJztcbiAgICAgICAgfVxuICAgICAgICBzZXQgY2FwdGlvbihjYXB0aW9uOiBzdHJpbmcpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmJwcm9wcy5jYXB0aW9uID0gY2FwdGlvbjtcbiAgICAgICAgICAgICAgICBjb25zdCBlbCA9IHRoaXMuaHRtbEVsZW1lbnQ7XG4gICAgICAgICAgICAgICAgaWYgKCFlbCkgcmV0dXJuO1xuICAgICAgICAgICAgICAgIGVsLnRleHRDb250ZW50ID0gdGhpcy5jYXB0aW9uO1xuICAgICAgICB9XG5cbiAgICAgICAgZ2V0IGVuYWJsZWQoKTogYm9vbGVhbiB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuYnByb3BzLmVuYWJsZWQgPz8gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICBzZXQgZW5hYmxlZChlbmFibGVkKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5icHJvcHMuZW5hYmxlZCA9IGVuYWJsZWQ7XG4gICAgICAgICAgICAgICAgdGhpcy5odG1sQnV0dG9uKCkuZGlzYWJsZWQgPSAhZW5hYmxlZDtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0cnVjdG9yKG5hbWU6IHN0cmluZywgZm9ybTogVEZvcm0sIHBhcmVudDogVENvbXBvbmVudCkge1xuICAgICAgICAgICAgICAgIHN1cGVyKG5hbWUsIGZvcm0sIHBhcmVudCk7XG4gICAgICAgIH1cbiAgICAgICAgc3luY0RvbUZyb21Qcm9wcygpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBlbCA9IHRoaXMuaHRtbEVsZW1lbnQ7XG4gICAgICAgICAgICAgICAgaWYgKCFlbCkgcmV0dXJuO1xuXG4gICAgICAgICAgICAgICAgZWwudGV4dENvbnRlbnQgPSB0aGlzLmNhcHRpb247XG4gICAgICAgICAgICAgICAgdGhpcy5odG1sQnV0dG9uKCkuZGlzYWJsZWQgPSAhdGhpcy5lbmFibGVkO1xuICAgICAgICAgICAgICAgIHN1cGVyLnN5bmNEb21Gcm9tUHJvcHMoKTtcbiAgICAgICAgfVxufVxuXG5leHBvcnQgY2xhc3MgVE1ldGFCdXR0b24gZXh0ZW5kcyBUTWV0YUNvbXBvbmVudCB7XG4gICAgICAgIHN0YXRpYyByZWFkb25seSBtZXRhY2xhc3M6IFRNZXRhQnV0dG9uID0gbmV3IFRNZXRhQnV0dG9uKFRNZXRhQ29tcG9uZW50Lm1ldGFjbGFzcyk7XG5cbiAgICAgICAgcHJvdGVjdGVkIGNvbnN0cnVjdG9yKHN1cGVyQ2xhc3M6IFRNZXRhQ29tcG9uZW50KSB7XG4gICAgICAgICAgICAgICAgc3VwZXIoc3VwZXJDbGFzcyk7XG4gICAgICAgICAgICAgICAgLy8gZXQgdm91cyBjaGFuZ2V6IGp1c3RlIGxlIG5vbSA6XG4gICAgICAgICAgICAgICAgKHRoaXMgYXMgYW55KS50eXBlTmFtZSA9ICdUQnV0dG9uJztcbiAgICAgICAgfVxuICAgICAgICBnZXRNZXRhY2xhc3MoKTogVE1ldGFCdXR0b24ge1xuICAgICAgICAgICAgICAgIHJldHVybiBUTWV0YUJ1dHRvbi5tZXRhY2xhc3M7XG4gICAgICAgIH1cblxuICAgICAgICByZWFkb25seSB0eXBlTmFtZSA9ICdUQnV0dG9uJztcblxuICAgICAgICBjcmVhdGUobmFtZTogc3RyaW5nLCBmb3JtOiBURm9ybSwgcGFyZW50OiBUQ29tcG9uZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBUQnV0dG9uKG5hbWUsIGZvcm0sIHBhcmVudCk7XG4gICAgICAgIH1cblxuICAgICAgICBkZWZQcm9wcygpOiBQcm9wU3BlYzxUQnV0dG9uPltdIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gW1xuICAgICAgICAgICAgICAgICAgICAgICAgeyBuYW1lOiAnY2FwdGlvbicsIGtpbmQ6ICdzdHJpbmcnLCBhcHBseTogKG8sIHYpID0+IChvLmNhcHRpb24gPSBTdHJpbmcodikpIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICB7IG5hbWU6ICdlbmFibGVkJywga2luZDogJ2Jvb2xlYW4nLCBhcHBseTogKG8sIHYpID0+IChvLmVuYWJsZWQgPSBCb29sZWFuKHYpKSB9XG4gICAgICAgICAgICAgICAgXTtcbiAgICAgICAgfVxufVxuXG5leHBvcnQgY2xhc3MgVE1ldGFBcHBsaWNhdGlvbiBleHRlbmRzIFRNZXRhY2xhc3Mge1xuICAgICAgICBzdGF0aWMgcmVhZG9ubHkgbWV0YWNsYXNzOiBUTWV0YUFwcGxpY2F0aW9uID0gbmV3IFRNZXRhQXBwbGljYXRpb24oVE1ldGFjbGFzcy5tZXRhY2xhc3MpO1xuXG4gICAgICAgIHByb3RlY3RlZCBjb25zdHJ1Y3RvcihzdXBlckNsYXNzOiBUTWV0YWNsYXNzKSB7XG4gICAgICAgICAgICAgICAgc3VwZXIoc3VwZXJDbGFzcywgJ1RBcHBsaWNhdGlvbicpO1xuICAgICAgICB9XG4gICAgICAgIGdldE1ldGFjbGFzcygpOiBUTWV0YUFwcGxpY2F0aW9uIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gVE1ldGFBcHBsaWNhdGlvbi5tZXRhY2xhc3M7XG4gICAgICAgIH1cbn1cblxuZXhwb3J0IGNsYXNzIFRBcHBsaWNhdGlvbiB7XG4gICAgICAgIGdldE1ldGFjbGFzcygpOiBUTWV0YUFwcGxpY2F0aW9uIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gVE1ldGFBcHBsaWNhdGlvbi5tZXRhY2xhc3M7XG4gICAgICAgIH1cbiAgICAgICAgc3RhdGljIFRoZUFwcGxpY2F0aW9uOiBUQXBwbGljYXRpb247XG4gICAgICAgIC8vc3RhdGljIHBsdWdpblJlZ2lzdHJ5ID0gbmV3IFBsdWdpblJlZ2lzdHJ5KCk7XG4gICAgICAgIC8vcGx1Z2luczogSVBsdWdpblJlZ2lzdHJ5O1xuICAgICAgICBwcml2YXRlIGZvcm1zOiBURm9ybVtdID0gW107XG4gICAgICAgIHJlYWRvbmx5IHR5cGVzID0gbmV3IFRDb21wb25lbnRUeXBlUmVnaXN0cnkoKTtcbiAgICAgICAgbWFpbkZvcm06IFRGb3JtIHwgbnVsbCA9IG51bGw7XG5cbiAgICAgICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgICAgICAgICAgVEFwcGxpY2F0aW9uLlRoZUFwcGxpY2F0aW9uID0gdGhpcztcbiAgICAgICAgICAgICAgICByZWdpc3RlckJ1aWx0aW5zKHRoaXMudHlwZXMpO1xuICAgICAgICB9XG5cbiAgICAgICAgY3JlYXRlRm9ybTxUIGV4dGVuZHMgVEZvcm0+KGN0b3I6IG5ldyAoLi4uYXJnczogYW55W10pID0+IFQsIG5hbWU6IHN0cmluZyk6IFQge1xuICAgICAgICAgICAgICAgIGNvbnN0IGYgPSBuZXcgY3RvcihuYW1lKTtcbiAgICAgICAgICAgICAgICB0aGlzLmZvcm1zLnB1c2goZik7XG4gICAgICAgICAgICAgICAgaWYgKCF0aGlzLm1haW5Gb3JtKSB0aGlzLm1haW5Gb3JtID0gZjtcbiAgICAgICAgICAgICAgICByZXR1cm4gZjtcbiAgICAgICAgfVxuXG4gICAgICAgIHJ1bigpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnJ1bldoZW5Eb21SZWFkeSgoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5tYWluRm9ybSkgdGhpcy5tYWluRm9ybS5zaG93KCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlIHRoaXMuYXV0b1N0YXJ0KCk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cblxuICAgICAgICBwcm90ZWN0ZWQgYXV0b1N0YXJ0KCkge1xuICAgICAgICAgICAgICAgIC8vIGZhbGxiYWNrOiBjaG9pc2lyIHVuZSBmb3JtIGVucmVnaXN0clx1MDBFOWUsIG91IGNyXHUwMEU5ZXIgdW5lIGZvcm0gaW1wbGljaXRlXG4gICAgICAgIH1cblxuICAgICAgICBydW5XaGVuRG9tUmVhZHkoZm46ICgpID0+IHZvaWQpIHtcbiAgICAgICAgICAgICAgICBpZiAoZG9jdW1lbnQucmVhZHlTdGF0ZSA9PT0gJ2xvYWRpbmcnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignRE9NQ29udGVudExvYWRlZCcsIGZuLCB7IG9uY2U6IHRydWUgfSk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGZuKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICB9XG59XG5cbi8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PSBQTFVHSU5IT1NUID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbi8qXG5cbmV4cG9ydCBjbGFzcyBWdWVDb21wb25lbnQgZXh0ZW5kcyBUQ29tcG9uZW50IHt9XG5cbmV4cG9ydCBjbGFzcyBSZWFjdENvbXBvbmVudCBleHRlbmRzIFRDb21wb25lbnQge31cblxuZXhwb3J0IGNsYXNzIFN2ZWx0ZUNvbXBvbmVudCBleHRlbmRzIFRDb21wb25lbnQge31cblxuZXhwb3J0IGNsYXNzIFBsdWdpbkhvc3Q8UHJvcHMgZXh0ZW5kcyBKc29uID0gSnNvbj4gZXh0ZW5kcyBUQ29tcG9uZW50IHtcbiAgICAgICAgcHJpdmF0ZSBwbHVnaW46IFBsdWdpbjxQcm9wcz47XG4gICAgICAgIHByaXZhdGUgc2VydmljZXM6IERlbHBoaW5lU2VydmljZXM7XG4gICAgICAgIHByaXZhdGUgbW91bnRlZCA9IGZhbHNlO1xuXG4gICAgICAgIGNvbnN0cnVjdG9yKHBsdWdpbjogVUlQbHVnaW48UHJvcHM+LCBzZXJ2aWNlczogRGVscGhpbmVTZXJ2aWNlcykge1xuICAgICAgICAgICAgICAgIHN1cGVyKCd0b3RvJywgbnVsbCwgbnVsbCk7XG4gICAgICAgICAgICAgICAgdGhpcy5wbHVnaW4gPSBwbHVnaW47XG4gICAgICAgICAgICAgICAgdGhpcy5zZXJ2aWNlcyA9IHNlcnZpY2VzO1xuICAgICAgICB9XG5cbiAgICAgICAgbW91bnQocHJvcHM6IFByb3BzKSB7XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMubW91bnRlZCkgdGhyb3cgbmV3IEVycm9yKCdQbHVnaW4gYWxyZWFkeSBtb3VudGVkJyk7XG4gICAgICAgICAgICAgICAgLy90aGlzLnBsdWdpbi5tb3VudCh0aGlzLmh0bWxFbGVtZW50LCBwcm9wcywgdGhpcy5zZXJ2aWNlcyk7XG4gICAgICAgICAgICAgICAgdGhpcy5tb3VudGVkID0gdHJ1ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIHVwZGF0ZShwcm9wczogUHJvcHMpIHtcbiAgICAgICAgICAgICAgICBpZiAoIXRoaXMubW91bnRlZCkgdGhyb3cgbmV3IEVycm9yKCdQbHVnaW4gbm90IG1vdW50ZWQnKTtcbiAgICAgICAgICAgICAgICB0aGlzLnBsdWdpbi51cGRhdGUocHJvcHMpO1xuICAgICAgICB9XG5cbiAgICAgICAgdW5tb3VudCgpIHtcbiAgICAgICAgICAgICAgICBpZiAoIXRoaXMubW91bnRlZCkgcmV0dXJuO1xuICAgICAgICAgICAgICAgIHRoaXMucGx1Z2luLnVubW91bnQoKTtcbiAgICAgICAgICAgICAgICB0aGlzLm1vdW50ZWQgPSBmYWxzZTtcbiAgICAgICAgfVxufVxuICAgICAgICAqL1xuXG5leHBvcnQgY2xhc3MgVE1ldGFQbHVnaW5Ib3N0IGV4dGVuZHMgVE1ldGFDb21wb25lbnQge1xuICAgICAgICBzdGF0aWMgbWV0YWNsYXNzID0gbmV3IFRNZXRhUGx1Z2luSG9zdChUTWV0YUNvbXBvbmVudC5tZXRhY2xhc3MpO1xuICAgICAgICBnZXRNZXRhY2xhc3MoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIFRNZXRhUGx1Z2luSG9zdC5tZXRhY2xhc3M7XG4gICAgICAgIH1cbiAgICAgICAgcmVhZG9ubHkgdHlwZU5hbWUgPSAnVFBsdWdpbkhvc3QnO1xuXG4gICAgICAgIGNyZWF0ZShuYW1lOiBzdHJpbmcsIGZvcm06IFRGb3JtLCBwYXJlbnQ6IFRDb21wb25lbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gbmV3IFRQbHVnaW5Ib3N0KG5hbWUsIGZvcm0sIHBhcmVudCk7XG4gICAgICAgIH1cblxuICAgICAgICBwcm9wcygpOiBQcm9wU3BlYzxUUGx1Z2luSG9zdD5bXSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIFtdO1xuICAgICAgICB9XG59XG5cbmV4cG9ydCBjbGFzcyBUUGx1Z2luSG9zdCBleHRlbmRzIFRDb21wb25lbnQge1xuICAgICAgICBwcml2YXRlIGluc3RhbmNlOiBVSVBsdWdpbkluc3RhbmNlIHwgbnVsbCA9IG51bGw7XG5cbiAgICAgICAgcGx1Z2luTmFtZTogc3RyaW5nIHwgbnVsbCA9IG51bGw7XG4gICAgICAgIHBsdWdpblByb3BzOiBKc29uID0ge307XG4gICAgICAgIHByaXZhdGUgZmFjdG9yeTogVUlQbHVnaW5GYWN0b3J5IHwgbnVsbCA9IG51bGw7XG5cbiAgICAgICAgY29uc3RydWN0b3IobmFtZTogc3RyaW5nLCBmb3JtOiBURm9ybSwgcGFyZW50OiBUQ29tcG9uZW50KSB7XG4gICAgICAgICAgICAgICAgc3VwZXIobmFtZSwgZm9ybSwgcGFyZW50KTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIENhbGxlZCBieSB0aGUgbWV0YWNsYXNzIChvciBieSB5b3VyIHJlZ2lzdHJ5KSByaWdodCBhZnRlciBjcmVhdGlvblxuICAgICAgICBzZXRQbHVnaW5GYWN0b3J5KGZhY3Rvcnk6IFVJUGx1Z2luRmFjdG9yeSkge1xuICAgICAgICAgICAgICAgIHRoaXMuZmFjdG9yeSA9IGZhY3Rvcnk7XG4gICAgICAgIH1cblxuICAgICAgICBtb3VudFBsdWdpbihwcm9wczogSnNvbiwgc2VydmljZXM6IERlbHBoaW5lU2VydmljZXMpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBjb250YWluZXIgPSB0aGlzLmh0bWxFbGVtZW50O1xuICAgICAgICAgICAgICAgIGlmICghY29udGFpbmVyKSByZXR1cm47XG5cbiAgICAgICAgICAgICAgICBpZiAoIXRoaXMuZmFjdG9yeSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgc2VydmljZXMubG9nLndhcm4oJ1RQbHVnaW5Ib3N0OiBubyBwbHVnaW4gZmFjdG9yeSBzZXQnLCB7IGhvc3Q6IHRoaXMubmFtZSBhcyBhbnkgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLy8gRGlzcG9zZSBvbGQgaW5zdGFuY2UgaWYgYW55XG4gICAgICAgICAgICAgICAgdGhpcy51bm1vdW50KCk7XG5cbiAgICAgICAgICAgICAgICAvLyBDcmVhdGUgcGx1Z2luIGluc3RhbmNlIHRoZW4gbW91bnRcbiAgICAgICAgICAgICAgICB0aGlzLmluc3RhbmNlID0gdGhpcy5mYWN0b3J5KHsgaG9zdDogdGhpcywgZm9ybTogdGhpcy5mb3JtISB9KTtcbiAgICAgICAgICAgICAgICB0aGlzLmluc3RhbmNlIS5tb3VudChjb250YWluZXIsIHByb3BzLCBzZXJ2aWNlcyk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBDYWxsZWQgYnkgYnVpbGRDb21wb25lbnRUcmVlKClcbiAgICAgICAgc2V0UGx1Z2luU3BlYyhzcGVjOiB7IHBsdWdpbjogc3RyaW5nIHwgbnVsbDsgcHJvcHM6IGFueSB9KSB7XG4gICAgICAgICAgICAgICAgdGhpcy5wbHVnaW5OYW1lID0gc3BlYy5wbHVnaW47XG4gICAgICAgICAgICAgICAgdGhpcy5wbHVnaW5Qcm9wcyA9IHNwZWMucHJvcHMgPz8ge307XG4gICAgICAgIH1cblxuICAgICAgICAvLyBDYWxsZWQgYnkgYnVpbGRDb21wb25lbnRUcmVlKClcbiAgICAgICAgbW91bnRQbHVnaW5JZlJlYWR5KHNlcnZpY2VzOiBEZWxwaGluZVNlcnZpY2VzKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgY29udGFpbmVyID0gdGhpcy5odG1sRWxlbWVudDtcbiAgICAgICAgICAgICAgICBpZiAoIWNvbnRhaW5lciB8fCAhdGhpcy5mb3JtIHx8ICF0aGlzLnBsdWdpbk5hbWUpIHJldHVybjtcblxuICAgICAgICAgICAgICAgIGNvbnN0IGFwcCA9IFRBcHBsaWNhdGlvbi5UaGVBcHBsaWNhdGlvbjsgLy8gb3UgdW4gYWNjXHUwMEU4cyBcdTAwRTlxdWl2YWxlbnRcbiAgICAgICAgICAgICAgICBjb25zdCBkZWYgPSBQbHVnaW5SZWdpc3RyeS5wbHVnaW5SZWdpc3RyeS5nZXQodGhpcy5wbHVnaW5OYW1lKTtcblxuICAgICAgICAgICAgICAgIGlmICghZGVmKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzZXJ2aWNlcy5sb2cud2FybignVW5rbm93biBwbHVnaW4nLCB7IHBsdWdpbjogdGhpcy5wbHVnaW5OYW1lIGFzIGFueSB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICB0aGlzLnVubW91bnQoKTtcbiAgICAgICAgICAgICAgICB0aGlzLmluc3RhbmNlID0gZGVmLmZhY3RvcnkoeyBob3N0OiB0aGlzLCBmb3JtOiB0aGlzLmZvcm0gfSk7XG4gICAgICAgICAgICAgICAgdGhpcy5pbnN0YW5jZSEubW91bnQoY29udGFpbmVyLCB0aGlzLnBsdWdpblByb3BzLCBzZXJ2aWNlcyk7XG4gICAgICAgIH1cblxuICAgICAgICB1cGRhdGUocHJvcHM6IGFueSkge1xuICAgICAgICAgICAgICAgIHRoaXMucGx1Z2luUHJvcHMgPSBwcm9wcztcbiAgICAgICAgICAgICAgICB0aGlzLmluc3RhbmNlPy51cGRhdGUocHJvcHMpO1xuICAgICAgICB9XG5cbiAgICAgICAgdW5tb3VudCgpIHtcbiAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5pbnN0YW5jZT8udW5tb3VudCgpO1xuICAgICAgICAgICAgICAgIH0gZmluYWxseSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmluc3RhbmNlID0gbnVsbDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgIH1cbn1cblxuZXhwb3J0IHR5cGUgVUlQbHVnaW5GYWN0b3J5PFByb3BzIGV4dGVuZHMgSnNvbiA9IEpzb24+ID0gKGFyZ3M6IHsgaG9zdDogVFBsdWdpbkhvc3Q7IGZvcm06IFRGb3JtIH0pID0+IFVJUGx1Z2luSW5zdGFuY2U8UHJvcHM+O1xuXG5leHBvcnQgaW50ZXJmYWNlIFNpemVIaW50cyB7XG4gICAgICAgIG1pbldpZHRoPzogbnVtYmVyO1xuICAgICAgICBtaW5IZWlnaHQ/OiBudW1iZXI7XG4gICAgICAgIHByZWZlcnJlZFdpZHRoPzogbnVtYmVyO1xuICAgICAgICBwcmVmZXJyZWRIZWlnaHQ/OiBudW1iZXI7XG59XG5cbmV4cG9ydCB0eXBlIFVJUGx1Z2luRGVmID0ge1xuICAgICAgICBmYWN0b3J5OiBVSVBsdWdpbkZhY3Rvcnk7XG4gICAgICAgIC8vIG9wdGlvbm5lbCA6IHVuIHNjaFx1MDBFOW1hIGRlIHByb3BzLCBhaWRlIGF1IGRlc2lnbmVyXG4gICAgICAgIC8vIHByb3BzPzogUHJvcFNjaGVtYTtcbn07XG5cbmV4cG9ydCBjbGFzcyBQbHVnaW5SZWdpc3RyeSB7XG4gICAgICAgIHN0YXRpYyBwbHVnaW5SZWdpc3RyeSA9IG5ldyBQbHVnaW5SZWdpc3RyeSgpO1xuICAgICAgICBwcml2YXRlIHJlYWRvbmx5IHBsdWdpbnMgPSBuZXcgTWFwPHN0cmluZywgVUlQbHVnaW5EZWY+KCk7XG5cbiAgICAgICAgcmVnaXN0ZXIobmFtZTogc3RyaW5nLCBkZWY6IFVJUGx1Z2luRGVmKSB7XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMucGx1Z2lucy5oYXMobmFtZSkpIHRocm93IG5ldyBFcnJvcihgUGx1Z2luIGFscmVhZHkgcmVnaXN0ZXJlZDogJHtuYW1lfWApO1xuICAgICAgICAgICAgICAgIHRoaXMucGx1Z2lucy5zZXQobmFtZSwgZGVmKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGdldChuYW1lOiBzdHJpbmcpOiBVSVBsdWdpbkRlZiB8IHVuZGVmaW5lZCB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMucGx1Z2lucy5nZXQobmFtZSk7XG4gICAgICAgIH1cblxuICAgICAgICBoYXMobmFtZTogc3RyaW5nKTogYm9vbGVhbiB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMucGx1Z2lucy5oYXMobmFtZSk7XG4gICAgICAgIH1cbn1cbiIsICJleHBvcnQgY2xhc3MgTWV0YVJvb3Qge1xuICAgICAgICBzdGF0aWMgcmVhZG9ubHkgbWV0YWNsYXNzOiBNZXRhUm9vdCA9IG5ldyBNZXRhUm9vdChudWxsKTtcblxuICAgICAgICByZWFkb25seSBzdXBlckNsYXNzOiBNZXRhUm9vdCB8IG51bGw7XG4gICAgICAgIHJlYWRvbmx5IHR5cGVOYW1lOiBzdHJpbmc7XG5cbiAgICAgICAgcHJvdGVjdGVkIGNvbnN0cnVjdG9yKHN1cGVyQ2xhc3M6IE1ldGFSb290IHwgbnVsbCwgdHlwZU5hbWUgPSAnVE1ldGFSb290Jykge1xuICAgICAgICAgICAgICAgIHRoaXMuc3VwZXJDbGFzcyA9IHN1cGVyQ2xhc3M7XG4gICAgICAgICAgICAgICAgdGhpcy50eXBlTmFtZSA9IHR5cGVOYW1lO1xuICAgICAgICB9XG4gICAgICAgIGdldE1ldGFjbGFzcygpOiBNZXRhUm9vdCB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIE1ldGFSb290Lm1ldGFjbGFzcztcbiAgICAgICAgfVxufVxuXG5leHBvcnQgY2xhc3MgTWV0YVRlc3RBIGV4dGVuZHMgTWV0YVJvb3Qge1xuICAgICAgICBzdGF0aWMgcmVhZG9ubHkgbWV0YWNsYXNzOiBNZXRhVGVzdEEgPSBuZXcgTWV0YVRlc3RBKE1ldGFSb290Lm1ldGFjbGFzcyk7XG5cbiAgICAgICAgcHJvdGVjdGVkIGNvbnN0cnVjdG9yKHN1cGVyQ2xhc3M6IE1ldGFSb290KSB7XG4gICAgICAgICAgICAgICAgc3VwZXIoc3VwZXJDbGFzcywgJ1Rlc3RBJyk7XG4gICAgICAgIH1cbiAgICAgICAgZ2V0TWV0YWNsYXNzKCk6IE1ldGFUZXN0QSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIE1ldGFUZXN0QS5tZXRhY2xhc3M7XG4gICAgICAgIH1cbn1cblxuZXhwb3J0IGNsYXNzIE1ldGFUZXN0QiBleHRlbmRzIE1ldGFUZXN0QSB7XG4gICAgICAgIHN0YXRpYyByZWFkb25seSBtZXRhY2xhc3M6IE1ldGFUZXN0QiA9IG5ldyBNZXRhVGVzdEIoTWV0YVRlc3RBLm1ldGFjbGFzcyk7XG5cbiAgICAgICAgcHJvdGVjdGVkIGNvbnN0cnVjdG9yKHN1cGVyQ2xhc3M6IE1ldGFUZXN0QSkge1xuICAgICAgICAgICAgICAgIHN1cGVyKHN1cGVyQ2xhc3MpO1xuICAgICAgICAgICAgICAgIC8vIGV0IHZvdXMgY2hhbmdleiBqdXN0ZSBsZSBub20gOlxuICAgICAgICAgICAgICAgICh0aGlzIGFzIGFueSkudHlwZU5hbWUgPSAnVGVzdEInO1xuICAgICAgICB9XG4gICAgICAgIGdldE1ldGFjbGFzcygpOiBNZXRhVGVzdEIge1xuICAgICAgICAgICAgICAgIHJldHVybiBNZXRhVGVzdEIubWV0YWNsYXNzO1xuICAgICAgICB9XG59XG5cbmV4cG9ydCBjbGFzcyBNZXRhVGVzdEMgZXh0ZW5kcyBNZXRhVGVzdEIge1xuICAgICAgICBzdGF0aWMgcmVhZG9ubHkgbWV0YWNsYXNzOiBNZXRhVGVzdEMgPSBuZXcgTWV0YVRlc3RDKE1ldGFUZXN0Qi5tZXRhY2xhc3MpO1xuXG4gICAgICAgIHByb3RlY3RlZCBjb25zdHJ1Y3RvcihzdXBlckNsYXNzOiBNZXRhVGVzdEIpIHtcbiAgICAgICAgICAgICAgICBzdXBlcihzdXBlckNsYXNzKTtcbiAgICAgICAgICAgICAgICAodGhpcyBhcyBhbnkpLnR5cGVOYW1lID0gJ1Rlc3RDJztcbiAgICAgICAgfVxuXG4gICAgICAgIGdldE1ldGFjbGFzcygpOiBNZXRhVGVzdEMge1xuICAgICAgICAgICAgICAgIHJldHVybiBNZXRhVGVzdEMubWV0YWNsYXNzO1xuICAgICAgICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiB0ZXN0KCkge1xuICAgICAgICBsZXQgYzogTWV0YVJvb3QgfCBudWxsID0gTWV0YVRlc3RDLm1ldGFjbGFzcztcbiAgICAgICAgd2hpbGUgKGMpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhgJHtjLmdldE1ldGFjbGFzcygpLnR5cGVOYW1lfSAtICR7Yy50eXBlTmFtZX0gLT4gJHtjLnN1cGVyQ2xhc3M/LnR5cGVOYW1lfWApO1xuICAgICAgICAgICAgICAgIGMgPSBjLnN1cGVyQ2xhc3M7XG4gICAgICAgIH1cbn1cbiIsICIvLy8gPHJlZmVyZW5jZSBsaWI9XCJkb21cIiAvPlxuY29uc29sZS5sb2coJ0kgQU0gWkFaQScpO1xuLy9pbXBvcnQgeyBpbnN0YWxsRGVscGhpbmVSdW50aW1lIH0gZnJvbSBcIi4vc3JjL2RydFwiOyAvLyA8LS0gVFMsIHBhcyAuanNcbmltcG9ydCB7IFRGb3JtLCBUQ29sb3IsIFRBcHBsaWNhdGlvbiwgVENvbXBvbmVudCwgVEJ1dHRvbiB9IGZyb20gJ0B2Y2wnO1xuaW1wb3J0IHsgdGVzdCB9IGZyb20gJy4vdGVzdCc7XG5cbi8vaW1wb3J0IHsgQ29tcG9uZW50VHlwZVJlZ2lzdHJ5IH0gZnJvbSAnQHZjbC9TdGRDdHJscyc7XG4vL2ltcG9ydCB7IENvbXBvbmVudFJlZ2lzdHJ5IH0gZnJvbSAnQGRydC9Db21wb25lbnRSZWdpc3RyeSc7XG4vL2ltcG9ydCB7IFRQbHVnaW5Ib3N0IH0gZnJvbSAnQGRydC9VSVBsdWdpbic7XG4vKlxuZXhwb3J0IGZ1bmN0aW9uIHJlZ2lzdGVyUGx1Z2luVHlwZXMocmVnOiBDb21wb25lbnRUeXBlUmVnaXN0cnkpOiB2b2lkIHtcbiAgICAgICAgLyAqXG4gICAgICAgIC8vIEV4YW1wbGU6IGFueSB0eXBlIG5hbWUgY2FuIGJlIHByb3ZpZGVkIGJ5IGEgcGx1Z2luLlxuICAgICAgICByZWcucmVnaXN0ZXIucmVnaXN0ZXJUeXBlKCdjaGFydGpzLXBpZScsIChuYW1lOiBzdHJpbmcsIGZvcm06IFRGb3JtLCBwYXJlbnQ6IFRDb21wb25lbnQpID0+IHtcbiAgICAgICAgICAgICAgICByZXR1cm4gbmV3IFBsdWdpbkhvc3QobmFtZSwgZm9ybSwgcGFyZW50KTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgcmVnLnJlZ2lzdGVyVHlwZSgndnVlLWhlbGxvJywgKG5hbWU6IHN0cmluZywgZm9ybTogVEZvcm0sIHBhcmVudDogVENvbXBvbmVudCkgPT4ge1xuICAgICAgICAgICAgICAgIHJldHVybiBuZXcgUGx1Z2luSG9zdChuYW1lLCBmb3JtLCBwYXJlbnQpO1xuICAgICAgICB9KTtcbiAgICAgICAgKiAvXG59XG4qL1xuY29uc29sZS5sb2coJ0kgQU0gWkFaQScpO1xuXG5jbGFzcyBaYXphIGV4dGVuZHMgVEZvcm0ge1xuICAgICAgICAvLyBGb3JtIGNvbXBvbmVudHMgLSBUaGlzIGxpc3QgaXMgYXV0byBnZW5lcmF0ZWQgYnkgRGVscGhpbmVcbiAgICAgICAgLy8gLS0tLS0tLS0tLS0tLS0tXG4gICAgICAgIC8vYnV0dG9uMSA6IFRCdXR0b24gPSBuZXcgVEJ1dHRvbihcImJ1dHRvbjFcIiwgdGhpcywgdGhpcyk7XG4gICAgICAgIC8vYnV0dG9uMiA6IFRCdXR0b24gPSBuZXcgVEJ1dHRvbihcImJ1dHRvbjJcIiwgdGhpcywgdGhpcyk7XG4gICAgICAgIC8vYnV0dG9uMyA6IFRCdXR0b24gPSBuZXcgVEJ1dHRvbihcImJ1dHRvbjNcIiwgdGhpcywgdGhpcyk7XG4gICAgICAgIC8vIC0tLS0tLS0tLS0tLS0tLVxuXG4gICAgICAgIGNvbnN0cnVjdG9yKG5hbWU6IHN0cmluZykge1xuICAgICAgICAgICAgICAgIHN1cGVyKG5hbWUpO1xuICAgICAgICB9XG4gICAgICAgIC8vaW1wb3J0IHsgaW5zdGFsbERlbHBoaW5lUnVudGltZSB9IGZyb20gXCIuL2RydFwiO1xuXG4gICAgICAgIC8qXG5jb25zdCBydW50aW1lID0geyAgIFxuICBoYW5kbGVDbGljayh7IGVsZW1lbnQgfTogeyBlbGVtZW50OiBFbGVtZW50IH0pIHtcbiAgICBjb25zb2xlLmxvZyhcImNsaWNrZWQhXCIsIGVsZW1lbnQpO1xuICAgIC8vKGVsZW1lbnQgYXMgSFRNTEVsZW1lbnQpLnN0eWxlLmJhY2tncm91bmRDb2xvciA9IFwicmVkXCI7XG4gIH0sXG59OyBcbiovXG5cbiAgICAgICAgcHJvdGVjdGVkIG9uTXlDcmVhdGUoX2V2OiBFdmVudCB8IG51bGwsIF9zZW5kZXI6IFRDb21wb25lbnQpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBidG4gPSB0aGlzLmNvbXBvbmVudFJlZ2lzdHJ5LmdldCgnYnV0dG9uMicpO1xuICAgICAgICAgICAgICAgIGlmIChidG4pIGJ0bi5jb2xvciA9IFRDb2xvci5yZ2IoMCwgMCwgMjU1KTtcbiAgICAgICAgfVxuXG4gICAgICAgIHByb3RlY3RlZCBvbk15U2hvd24oX2V2OiBFdmVudCB8IG51bGwsIF9zZW5kZXI6IFRDb21wb25lbnQpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBidG4gPSB0aGlzLmNvbXBvbmVudFJlZ2lzdHJ5LmdldCgnYnV0dG9uMycpO1xuICAgICAgICAgICAgICAgIGlmIChidG4pIGJ0bi5jb2xvciA9IFRDb2xvci5yZ2IoMCwgMjU1LCAyNTUpO1xuICAgICAgICB9XG5cbiAgICAgICAgYnV0dG9uMV9vbmNsaWNrKF9ldjogRXZlbnQgfCBudWxsLCBfc2VuZGVyOiBUQ29tcG9uZW50KSB7XG4gICAgICAgICAgICAgICAgY29uc3QgYnRuID0gdGhpcy5jb21wb25lbnRSZWdpc3RyeS5nZXQ8VEJ1dHRvbj4oJ2J1dHRvbjEnKTtcbiAgICAgICAgICAgICAgICBpZiAoIWJ0bikge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS53YXJuKCdidXR0b24xIG5vdCBmb3VuZCBpbiByZWdpc3RyeScpO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAvL2J0bi5jb2xvciA9IFRDb2xvci5yZ2IoMCwgMCwgMjU1KTtcbiAgICAgICAgICAgICAgICBidG4hLmNvbG9yID0gVENvbG9yLnJnYigyNTUsIDAsIDApO1xuICAgICAgICAgICAgICAgIGJ0biEuY2FwdGlvbiA9ICdNSU1JJztcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnQnV0dG9uMSBjbGlja2VkISEhIScpO1xuICAgICAgICB9XG5cbiAgICAgICAgemF6YV9vbmNsaWNrKF9ldjogRXZlbnQgfCBudWxsLCBfc2VuZGVyOiBUQ29tcG9uZW50KSB7XG4gICAgICAgICAgICAgICAgY29uc3QgYnRuID0gdGhpcy5jb21wb25lbnRSZWdpc3RyeS5nZXQ8VEJ1dHRvbj4oJ2J1dHRvbngnKTtcbiAgICAgICAgICAgICAgICBidG4hLmNvbG9yID0gVENvbG9yLnJnYigwLCAyNTUsIDApO1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCd6YXphIGNsaWNrZWQhISEhJyk7XG4gICAgICAgICAgICAgICAgLy9idG4hLmVuYWJsZWQgPSBmYWxzZTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vaW5zdGFsbERlbHBoaW5lUnVudGltZShydW50aW1lKTtcbn0gLy8gY2xhc3MgemF6YVxuXG5jbGFzcyBNeUFwcGxpY2F0aW9uIGV4dGVuZHMgVEFwcGxpY2F0aW9uIHtcbiAgICAgICAgemF6YTogWmF6YTtcblxuICAgICAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgICAgICAgICBzdXBlcigpO1xuICAgICAgICAgICAgICAgIHRoaXMuemF6YSA9IG5ldyBaYXphKCd6YXphJyk7XG4gICAgICAgICAgICAgICAgdGhpcy5tYWluRm9ybSA9IHRoaXMuemF6YTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJ1bigpIHtcbiAgICAgICAgICAgICAgICAvL3RoaXMuemF6YS5jb21wb25lbnRSZWdpc3RyeS5idWlsZENvbXBvbmVudFRyZWUodGhpcy56YXphKTtcbiAgICAgICAgICAgICAgICAvL3RoaXMuemF6YS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycpO1xuXG4gICAgICAgICAgICAgICAgLy8gYXUgbGFuY2VtZW50XG4gICAgICAgICAgICAgICAgdGhpcy5ydW5XaGVuRG9tUmVhZHkoKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy56YXphLnNob3coKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgfVxufSAvLyBjbGFzcyBNeUFwcGxpY2F0aW9uXG5cbmNvbnN0IG15QXBwbGljYXRpb246IE15QXBwbGljYXRpb24gPSBuZXcgTXlBcHBsaWNhdGlvbigpO1xudGVzdCgpO1xubXlBcHBsaWNhdGlvbi5ydW4oKTtcbiJdLAogICJtYXBwaW5ncyI6ICI7Ozs7O0FBT08sU0FBUyxpQkFBaUIsT0FBK0I7QUFDeEQsUUFBTSxTQUFTLFlBQVksU0FBUztBQUNwQyxRQUFNLFNBQVMsZ0JBQWdCLFNBQVM7QUFDeEMsUUFBTSxTQUFTLFVBQVUsU0FBUztBQUcxQzs7O0FDNEVPLElBQWUsYUFBZixNQUEwQjtBQUFBLEVBTWYsWUFBWSxZQUErQixXQUFXLGNBQWM7QUFMOUUsd0JBQVMsWUFBbUI7QUFFNUIsd0JBQVMsY0FBZ0M7QUFJakMsU0FBSyxh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LFFBQVEsT0FBTyxFQUFFLFlBQVksUUFBUSxFQUFFO0FBQ3ZGLFFBQUksRUFBRTtBQUFBLEVBQ2Q7QUFDUjs7O0FDekRBLFFBQVEsSUFBSSxXQUFXO0FBc0J2QixRQUFRLElBQUksV0FBVztBQUV2QixJQUFNLE9BQU4sY0FBbUJLLE9BQU07QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQVFqQixZQUFZLE1BQWM7QUFDbEIsVUFBTSxJQUFJO0FBQUEsRUFDbEI7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQVlVLFdBQVcsS0FBbUIsU0FBcUI7QUFDckQsVUFBTSxNQUFNLEtBQUssa0JBQWtCLElBQUksU0FBUztBQUNoRCxRQUFJLElBQUssS0FBSSxRQUFRLE9BQU8sSUFBSSxHQUFHLEdBQUcsR0FBRztBQUFBLEVBQ2pEO0FBQUEsRUFFVSxVQUFVLEtBQW1CLFNBQXFCO0FBQ3BELFVBQU0sTUFBTSxLQUFLLGtCQUFrQixJQUFJLFNBQVM7QUFDaEQsUUFBSSxJQUFLLEtBQUksUUFBUSxPQUFPLElBQUksR0FBRyxLQUFLLEdBQUc7QUFBQSxFQUNuRDtBQUFBLEVBRUEsZ0JBQWdCLEtBQW1CLFNBQXFCO0FBQ2hELFVBQU0sTUFBTSxLQUFLLGtCQUFrQixJQUFhLFNBQVM7QUFDekQsUUFBSSxDQUFDLEtBQUs7QUFDRixjQUFRLEtBQUssK0JBQStCO0FBQzVDO0FBQUEsSUFDUjtBQUVBLFFBQUssUUFBUSxPQUFPLElBQUksS0FBSyxHQUFHLENBQUM7QUFDakMsUUFBSyxVQUFVO0FBQ2YsWUFBUSxJQUFJLHFCQUFxQjtBQUFBLEVBQ3pDO0FBQUEsRUFFQSxhQUFhLEtBQW1CLFNBQXFCO0FBQzdDLFVBQU0sTUFBTSxLQUFLLGtCQUFrQixJQUFhLFNBQVM7QUFDekQsUUFBSyxRQUFRLE9BQU8sSUFBSSxHQUFHLEtBQUssQ0FBQztBQUNqQyxZQUFRLElBQUksa0JBQWtCO0FBQUEsRUFFdEM7QUFBQTtBQUdSO0FBRUEsSUFBTSxnQkFBTixjQUE0QixhQUFhO0FBQUEsRUFHakMsY0FBYztBQUNOLFVBQU07QUFIZDtBQUlRLFNBQUssT0FBTyxJQUFJLEtBQUssTUFBTTtBQUMzQixTQUFLLFdBQVcsS0FBSztBQUFBLEVBQzdCO0FBQUEsRUFFQSxNQUFNO0FBS0UsU0FBSyxnQkFBZ0IsTUFBTTtBQUNuQixXQUFLLEtBQUssS0FBSztBQUFBLElBQ3ZCLENBQUM7QUFBQSxFQUNUO0FBQ1I7QUFFQSxJQUFNLGdCQUErQixJQUFJLGNBQWM7QUFDdkQsS0FBSztBQUNMLGNBQWMsSUFBSTsiLAogICJuYW1lcyI6IFsiVENvbXBvbmVudCIsICJUTWV0YUNvbXBvbmVudCIsICJUQ29tcG9uZW50VHlwZVJlZ2lzdHJ5IiwgIlRGb3JtIiwgIlRCdXR0b24iLCAiVEZvcm0iXQp9Cg==
