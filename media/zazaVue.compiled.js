function registerBuiltins(types) {
  types.register(TMetaButton.metaclass);
  types.register(TMetaPluginHost.metaClass);
}
class TMetaclass {
  typeName = "TMetaclass";
  static metaclass;
  superClass = null;
  constructor(superClass, typeName = "TMetaclass") {
    this.superClass = superClass;
    this.typeName = typeName;
  }
}
class TObject {
  getMetaClass() {
    return TMetaObject.metaClass;
  }
}
class TMetaObject extends TMetaclass {
  static metaClass = new TMetaObject(TMetaclass.metaclass);
  getMetaclass() {
    return TMetaObject.metaClass;
  }
  constructor(superClass) {
    super(superClass, "TObject");
  }
}
class TMetaComponent extends TMetaclass {
  static metaclass = new TMetaComponent(TMetaclass.metaclass);
  // The symbolic name used in HTML: data-component="TButton" or "my-button"
  constructor(superClass) {
    super(superClass, "TComponent");
  }
  getMetaclass() {
    return TMetaComponent.metaclass;
  }
  // Create the runtime instance and attach it to the DOM element.
  create(name, form, parent) {
    return new TComponent(name, form, parent);
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
    for (const p2 of this.defProps()) {
      const attr = el.getAttribute(`data-${p2.name}`);
      if (attr !== null) out[p2.name] = attr;
    }
    return out;
  }
  applyProps(obj, values) {
    for (const p2 of this.defProps()) {
      if (Object.prototype.hasOwnProperty.call(values, p2.name)) {
        p2.apply(obj, values[p2.name]);
      }
    }
  }
  // default [];
}
class TComponent {
  getMetaclass() {
    return TMetaComponent.metaclass;
  }
  name;
  parent = null;
  form = null;
  children = [];
  elem = null;
  get htmlElement() {
    return this.elem;
  }
  constructor(name, form, parent) {
    this.name = name;
    this.parent = parent;
    parent?.children.push(this);
    this.form = form;
    this.name = name;
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
}
class TMetaComponentTypeRegistry extends TMetaObject {
  static metaclass = new TMetaComponentTypeRegistry(TMetaObject.metaClass);
  constructor(superClass) {
    super(superClass);
    this.typeName = "TObject";
  }
  getMetaclass() {
    return TMetaComponentTypeRegistry.metaclass;
  }
}
class TComponentTypeRegistry extends TObject {
  // We store heterogeneous metas, so we keep them as TMetaComponent<any>.
  getMetaclass() {
    return TMetaComponentTypeRegistry.metaClass;
  }
  classes = /* @__PURE__ */ new Map();
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
}
class TColor {
  s;
  constructor(s) {
    this.s = s;
  }
  /* factory */
  static rgb(r, g, b) {
    return new TColor(`rgb(${r}, ${g}, ${b})`);
  }
  /* factory */
  static rgba(r, g, b, a) {
    return new TColor(`rgba(${r}, ${g}, ${b}, ${a})`);
  }
}
class THandler {
  s;
  constructor(s) {
    this.s = s;
  }
}
class TMetaComponentRegistry extends TMetaclass {
  static metaclass = new TMetaComponentRegistry(TMetaclass.metaclass);
  constructor(superClass) {
    super(superClass, "TComponentRegistry");
  }
  getMetaclass() {
    return TMetaComponentRegistry.metaclass;
  }
}
class TComponentRegistry extends TObject {
  getMetaclass() {
    return TMetaComponentRegistry.metaclass;
  }
  instances = /* @__PURE__ */ new Map();
  logger = {
    debug(msg, data) {
    },
    info(msg, data) {
    },
    warn(msg, data) {
    },
    error(msg, data) {
    }
  };
  eventBus = {
    on(event, handler) {
      return () => void 0;
    },
    emit(event, payload) {
    }
  };
  storage = {
    get(key) {
      return null;
    },
    set(key, value) {
      return null;
    },
    remove(key) {
      return null;
    }
  };
  constructor() {
    super();
  }
  registerInstance(name, c) {
    this.instances.set(name, c);
  }
  get(name) {
    return this.instances.get(name);
  }
  services = {
    log: this.logger,
    bus: this.eventBus,
    storage: this.storage
  };
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
}
class TDocument extends TObject {
  static document = new TDocument(document);
  static body = document.body;
  htmlDoc;
  constructor(htmlDoc) {
    super();
    this.htmlDoc = htmlDoc;
  }
}
class TMetaDocument extends TMetaObject {
  static metaclass = new TMetaDocument(TMetaObject.metaclass);
  constructor(superClass) {
    super(superClass);
    this.typeName = "TestB";
  }
  getMetaclass() {
    return TMetaDocument.metaclass;
  }
}
class TMetaForm extends TMetaComponent {
  static metaclass = new TMetaForm(TMetaComponent.metaclass);
  getMetaClass() {
    return TMetaForm.metaclass;
  }
  constructor(superClass) {
    super(superClass);
    this.typeName = "TComponent";
  }
  //readonly typeName = 'TForm';
  create(name, form, parent) {
    return new TForm(name);
  }
  props() {
    return [];
  }
}
class TForm extends TComponent {
  getMetaclass() {
    return TMetaForm.metaclass;
  }
  allowsChildren() {
    return true;
  }
  static forms = /* @__PURE__ */ new Map();
  _mounted = false;
  // Each Form has its own componentRegistry
  componentRegistry = new TComponentRegistry();
  constructor(name) {
    super(name, null, null);
    this.form = this;
    TForm.forms.set(name, this);
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
    return TForm.forms.get(formName) ?? null;
  }
  _ac = null;
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
}
class TButton extends TComponent {
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
}
class TMetaButton extends TMetaComponent {
  static metaclass = new TMetaButton(TMetaComponent.metaclass);
  constructor(superClass) {
    super(superClass);
    this.typeName = "TButton";
  }
  getMetaclass() {
    return TMetaButton.metaclass;
  }
  typeName = "TButton";
  create(name, form, parent) {
    return new TButton(name, form, parent);
  }
  props() {
    return [
      { name: "caption", kind: "string", apply: (o, v) => o.caption = String(v) },
      { name: "enabled", kind: "boolean", apply: (o, v) => o.enabled = Boolean(v) },
      { name: "color", kind: "color", apply: (o, v) => o.color = v }
    ];
  }
}
class TMetaApplication extends TMetaclass {
  static metaclass = new TMetaApplication(TMetaclass.metaclass);
  constructor(superClass) {
    super(superClass, "TApplication");
  }
  getMetaclass() {
    return TMetaApplication.metaclass;
  }
}
class TApplication {
  getMetaclass() {
    return TMetaApplication.metaclass;
  }
  static TheApplication;
  //static pluginRegistry = new PluginRegistry();
  //plugins: IPluginRegistry;
  forms = [];
  types = new TComponentTypeRegistry();
  mainForm = null;
  constructor() {
    TApplication.TheApplication = this;
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
}
class TMetaPluginHost extends TMetaComponent {
  static metaClass = new TMetaPluginHost(TMetaComponent.metaclass);
  getMetaClass() {
    return TMetaPluginHost.metaClass;
  }
  typeName = "TPluginHost";
  create(name, form, parent) {
    return new TPluginHost(name, form, parent);
  }
  props() {
    return [];
  }
}
class TPluginHost extends TComponent {
  instance = null;
  pluginName = null;
  pluginProps = {};
  factory = null;
  constructor(name, form, parent) {
    super(name, form, parent);
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
    const def2 = PluginRegistry.pluginRegistry.get(this.pluginName);
    if (!def2) {
      services.log.warn("Unknown plugin", { plugin: this.pluginName });
      return;
    }
    this.unmount();
    this.instance = def2.factory({ host: this, form: this.form });
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
}
class PluginRegistry {
  static pluginRegistry = new PluginRegistry();
  plugins = /* @__PURE__ */ new Map();
  register(name, def2) {
    if (this.plugins.has(name)) throw new Error(`Plugin already registered: ${name}`);
    this.plugins.set(name, def2);
  }
  get(name) {
    return this.plugins.get(name);
  }
  has(name) {
    return this.plugins.has(name);
  }
}
// @__NO_SIDE_EFFECTS__
function makeMap(str) {
  const map = /* @__PURE__ */ Object.create(null);
  for (const key of str.split(",")) map[key] = 1;
  return (val) => val in map;
}
const EMPTY_OBJ = {};
const EMPTY_ARR = [];
const NOOP = () => {
};
const NO = () => false;
const isOn = (key) => key.charCodeAt(0) === 111 && key.charCodeAt(1) === 110 && // uppercase letter
(key.charCodeAt(2) > 122 || key.charCodeAt(2) < 97);
const isModelListener = (key) => key.startsWith("onUpdate:");
const extend = Object.assign;
const remove = (arr, el) => {
  const i = arr.indexOf(el);
  if (i > -1) {
    arr.splice(i, 1);
  }
};
const hasOwnProperty$1 = Object.prototype.hasOwnProperty;
const hasOwn = (val, key) => hasOwnProperty$1.call(val, key);
const isArray = Array.isArray;
const isMap = (val) => toTypeString(val) === "[object Map]";
const isSet = (val) => toTypeString(val) === "[object Set]";
const isDate = (val) => toTypeString(val) === "[object Date]";
const isFunction = (val) => typeof val === "function";
const isString = (val) => typeof val === "string";
const isSymbol = (val) => typeof val === "symbol";
const isObject = (val) => val !== null && typeof val === "object";
const isPromise = (val) => {
  return (isObject(val) || isFunction(val)) && isFunction(val.then) && isFunction(val.catch);
};
const objectToString = Object.prototype.toString;
const toTypeString = (value) => objectToString.call(value);
const toRawType = (value) => {
  return toTypeString(value).slice(8, -1);
};
const isPlainObject = (val) => toTypeString(val) === "[object Object]";
const isIntegerKey = (key) => isString(key) && key !== "NaN" && key[0] !== "-" && "" + parseInt(key, 10) === key;
const isReservedProp = /* @__PURE__ */ makeMap(
  // the leading comma is intentional so empty string "" is also included
  ",key,ref,ref_for,ref_key,onVnodeBeforeMount,onVnodeMounted,onVnodeBeforeUpdate,onVnodeUpdated,onVnodeBeforeUnmount,onVnodeUnmounted"
);
const cacheStringFunction = (fn) => {
  const cache = /* @__PURE__ */ Object.create(null);
  return ((str) => {
    const hit = cache[str];
    return hit || (cache[str] = fn(str));
  });
};
const camelizeRE = /-\w/g;
const camelize = cacheStringFunction(
  (str) => {
    return str.replace(camelizeRE, (c) => c.slice(1).toUpperCase());
  }
);
const hyphenateRE = /\B([A-Z])/g;
const hyphenate = cacheStringFunction(
  (str) => str.replace(hyphenateRE, "-$1").toLowerCase()
);
const capitalize = cacheStringFunction((str) => {
  return str.charAt(0).toUpperCase() + str.slice(1);
});
const toHandlerKey = cacheStringFunction(
  (str) => {
    const s = str ? `on${capitalize(str)}` : ``;
    return s;
  }
);
const hasChanged = (value, oldValue) => !Object.is(value, oldValue);
const invokeArrayFns = (fns, ...arg) => {
  for (let i = 0; i < fns.length; i++) {
    fns[i](...arg);
  }
};
const def = (obj, key, value, writable = false) => {
  Object.defineProperty(obj, key, {
    configurable: true,
    enumerable: false,
    writable,
    value
  });
};
const looseToNumber = (val) => {
  const n = parseFloat(val);
  return isNaN(n) ? val : n;
};
let _globalThis;
const getGlobalThis = () => {
  return _globalThis || (_globalThis = typeof globalThis !== "undefined" ? globalThis : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : typeof global !== "undefined" ? global : {});
};
function normalizeStyle(value) {
  if (isArray(value)) {
    const res = {};
    for (let i = 0; i < value.length; i++) {
      const item = value[i];
      const normalized = isString(item) ? parseStringStyle(item) : normalizeStyle(item);
      if (normalized) {
        for (const key in normalized) {
          res[key] = normalized[key];
        }
      }
    }
    return res;
  } else if (isString(value) || isObject(value)) {
    return value;
  }
}
const listDelimiterRE = /;(?![^(]*\))/g;
const propertyDelimiterRE = /:([^]+)/;
const styleCommentRE = /\/\*[^]*?\*\//g;
function parseStringStyle(cssText) {
  const ret = {};
  cssText.replace(styleCommentRE, "").split(listDelimiterRE).forEach((item) => {
    if (item) {
      const tmp = item.split(propertyDelimiterRE);
      tmp.length > 1 && (ret[tmp[0].trim()] = tmp[1].trim());
    }
  });
  return ret;
}
function normalizeClass(value) {
  let res = "";
  if (isString(value)) {
    res = value;
  } else if (isArray(value)) {
    for (let i = 0; i < value.length; i++) {
      const normalized = normalizeClass(value[i]);
      if (normalized) {
        res += normalized + " ";
      }
    }
  } else if (isObject(value)) {
    for (const name in value) {
      if (value[name]) {
        res += name + " ";
      }
    }
  }
  return res.trim();
}
const specialBooleanAttrs = `itemscope,allowfullscreen,formnovalidate,ismap,nomodule,novalidate,readonly`;
const isSpecialBooleanAttr = /* @__PURE__ */ makeMap(specialBooleanAttrs);
function includeBooleanAttr(value) {
  return !!value || value === "";
}
function looseCompareArrays(a, b) {
  if (a.length !== b.length) return false;
  let equal = true;
  for (let i = 0; equal && i < a.length; i++) {
    equal = looseEqual(a[i], b[i]);
  }
  return equal;
}
function looseEqual(a, b) {
  if (a === b) return true;
  let aValidType = isDate(a);
  let bValidType = isDate(b);
  if (aValidType || bValidType) {
    return aValidType && bValidType ? a.getTime() === b.getTime() : false;
  }
  aValidType = isSymbol(a);
  bValidType = isSymbol(b);
  if (aValidType || bValidType) {
    return a === b;
  }
  aValidType = isArray(a);
  bValidType = isArray(b);
  if (aValidType || bValidType) {
    return aValidType && bValidType ? looseCompareArrays(a, b) : false;
  }
  aValidType = isObject(a);
  bValidType = isObject(b);
  if (aValidType || bValidType) {
    if (!aValidType || !bValidType) {
      return false;
    }
    const aKeysCount = Object.keys(a).length;
    const bKeysCount = Object.keys(b).length;
    if (aKeysCount !== bKeysCount) {
      return false;
    }
    for (const key in a) {
      const aHasKey = a.hasOwnProperty(key);
      const bHasKey = b.hasOwnProperty(key);
      if (aHasKey && !bHasKey || !aHasKey && bHasKey || !looseEqual(a[key], b[key])) {
        return false;
      }
    }
  }
  return String(a) === String(b);
}
const isRef$1 = (val) => {
  return !!(val && val["__v_isRef"] === true);
};
const toDisplayString = (val) => {
  return isString(val) ? val : val == null ? "" : isArray(val) || isObject(val) && (val.toString === objectToString || !isFunction(val.toString)) ? isRef$1(val) ? toDisplayString(val.value) : JSON.stringify(val, replacer, 2) : String(val);
};
const replacer = (_key, val) => {
  if (isRef$1(val)) {
    return replacer(_key, val.value);
  } else if (isMap(val)) {
    return {
      [`Map(${val.size})`]: [...val.entries()].reduce(
        (entries, [key, val2], i) => {
          entries[stringifySymbol(key, i) + " =>"] = val2;
          return entries;
        },
        {}
      )
    };
  } else if (isSet(val)) {
    return {
      [`Set(${val.size})`]: [...val.values()].map((v) => stringifySymbol(v))
    };
  } else if (isSymbol(val)) {
    return stringifySymbol(val);
  } else if (isObject(val) && !isArray(val) && !isPlainObject(val)) {
    return String(val);
  }
  return val;
};
const stringifySymbol = (v, i = "") => {
  var _a;
  return (
    // Symbol.description in es2019+ so we need to cast here to pass
    // the lib: es2016 check
    isSymbol(v) ? `Symbol(${(_a = v.description) != null ? _a : i})` : v
  );
};
let activeEffectScope;
class EffectScope {
  // TODO isolatedDeclarations "__v_skip"
  constructor(detached = false) {
    this.detached = detached;
    this._active = true;
    this._on = 0;
    this.effects = [];
    this.cleanups = [];
    this._isPaused = false;
    this.__v_skip = true;
    this.parent = activeEffectScope;
    if (!detached && activeEffectScope) {
      this.index = (activeEffectScope.scopes || (activeEffectScope.scopes = [])).push(
        this
      ) - 1;
    }
  }
  get active() {
    return this._active;
  }
  pause() {
    if (this._active) {
      this._isPaused = true;
      let i, l;
      if (this.scopes) {
        for (i = 0, l = this.scopes.length; i < l; i++) {
          this.scopes[i].pause();
        }
      }
      for (i = 0, l = this.effects.length; i < l; i++) {
        this.effects[i].pause();
      }
    }
  }
  /**
   * Resumes the effect scope, including all child scopes and effects.
   */
  resume() {
    if (this._active) {
      if (this._isPaused) {
        this._isPaused = false;
        let i, l;
        if (this.scopes) {
          for (i = 0, l = this.scopes.length; i < l; i++) {
            this.scopes[i].resume();
          }
        }
        for (i = 0, l = this.effects.length; i < l; i++) {
          this.effects[i].resume();
        }
      }
    }
  }
  run(fn) {
    if (this._active) {
      const currentEffectScope = activeEffectScope;
      try {
        activeEffectScope = this;
        return fn();
      } finally {
        activeEffectScope = currentEffectScope;
      }
    }
  }
  /**
   * This should only be called on non-detached scopes
   * @internal
   */
  on() {
    if (++this._on === 1) {
      this.prevScope = activeEffectScope;
      activeEffectScope = this;
    }
  }
  /**
   * This should only be called on non-detached scopes
   * @internal
   */
  off() {
    if (this._on > 0 && --this._on === 0) {
      activeEffectScope = this.prevScope;
      this.prevScope = void 0;
    }
  }
  stop(fromParent) {
    if (this._active) {
      this._active = false;
      let i, l;
      for (i = 0, l = this.effects.length; i < l; i++) {
        this.effects[i].stop();
      }
      this.effects.length = 0;
      for (i = 0, l = this.cleanups.length; i < l; i++) {
        this.cleanups[i]();
      }
      this.cleanups.length = 0;
      if (this.scopes) {
        for (i = 0, l = this.scopes.length; i < l; i++) {
          this.scopes[i].stop(true);
        }
        this.scopes.length = 0;
      }
      if (!this.detached && this.parent && !fromParent) {
        const last = this.parent.scopes.pop();
        if (last && last !== this) {
          this.parent.scopes[this.index] = last;
          last.index = this.index;
        }
      }
      this.parent = void 0;
    }
  }
}
function getCurrentScope() {
  return activeEffectScope;
}
let activeSub;
const pausedQueueEffects = /* @__PURE__ */ new WeakSet();
class ReactiveEffect {
  constructor(fn) {
    this.fn = fn;
    this.deps = void 0;
    this.depsTail = void 0;
    this.flags = 1 | 4;
    this.next = void 0;
    this.cleanup = void 0;
    this.scheduler = void 0;
    if (activeEffectScope && activeEffectScope.active) {
      activeEffectScope.effects.push(this);
    }
  }
  pause() {
    this.flags |= 64;
  }
  resume() {
    if (this.flags & 64) {
      this.flags &= -65;
      if (pausedQueueEffects.has(this)) {
        pausedQueueEffects.delete(this);
        this.trigger();
      }
    }
  }
  /**
   * @internal
   */
  notify() {
    if (this.flags & 2 && !(this.flags & 32)) {
      return;
    }
    if (!(this.flags & 8)) {
      batch(this);
    }
  }
  run() {
    if (!(this.flags & 1)) {
      return this.fn();
    }
    this.flags |= 2;
    cleanupEffect(this);
    prepareDeps(this);
    const prevEffect = activeSub;
    const prevShouldTrack = shouldTrack;
    activeSub = this;
    shouldTrack = true;
    try {
      return this.fn();
    } finally {
      cleanupDeps(this);
      activeSub = prevEffect;
      shouldTrack = prevShouldTrack;
      this.flags &= -3;
    }
  }
  stop() {
    if (this.flags & 1) {
      for (let link = this.deps; link; link = link.nextDep) {
        removeSub(link);
      }
      this.deps = this.depsTail = void 0;
      cleanupEffect(this);
      this.onStop && this.onStop();
      this.flags &= -2;
    }
  }
  trigger() {
    if (this.flags & 64) {
      pausedQueueEffects.add(this);
    } else if (this.scheduler) {
      this.scheduler();
    } else {
      this.runIfDirty();
    }
  }
  /**
   * @internal
   */
  runIfDirty() {
    if (isDirty(this)) {
      this.run();
    }
  }
  get dirty() {
    return isDirty(this);
  }
}
let batchDepth = 0;
let batchedSub;
let batchedComputed;
function batch(sub, isComputed = false) {
  sub.flags |= 8;
  if (isComputed) {
    sub.next = batchedComputed;
    batchedComputed = sub;
    return;
  }
  sub.next = batchedSub;
  batchedSub = sub;
}
function startBatch() {
  batchDepth++;
}
function endBatch() {
  if (--batchDepth > 0) {
    return;
  }
  if (batchedComputed) {
    let e = batchedComputed;
    batchedComputed = void 0;
    while (e) {
      const next = e.next;
      e.next = void 0;
      e.flags &= -9;
      e = next;
    }
  }
  let error;
  while (batchedSub) {
    let e = batchedSub;
    batchedSub = void 0;
    while (e) {
      const next = e.next;
      e.next = void 0;
      e.flags &= -9;
      if (e.flags & 1) {
        try {
          ;
          e.trigger();
        } catch (err) {
          if (!error) error = err;
        }
      }
      e = next;
    }
  }
  if (error) throw error;
}
function prepareDeps(sub) {
  for (let link = sub.deps; link; link = link.nextDep) {
    link.version = -1;
    link.prevActiveLink = link.dep.activeLink;
    link.dep.activeLink = link;
  }
}
function cleanupDeps(sub) {
  let head;
  let tail = sub.depsTail;
  let link = tail;
  while (link) {
    const prev = link.prevDep;
    if (link.version === -1) {
      if (link === tail) tail = prev;
      removeSub(link);
      removeDep(link);
    } else {
      head = link;
    }
    link.dep.activeLink = link.prevActiveLink;
    link.prevActiveLink = void 0;
    link = prev;
  }
  sub.deps = head;
  sub.depsTail = tail;
}
function isDirty(sub) {
  for (let link = sub.deps; link; link = link.nextDep) {
    if (link.dep.version !== link.version || link.dep.computed && (refreshComputed(link.dep.computed) || link.dep.version !== link.version)) {
      return true;
    }
  }
  if (sub._dirty) {
    return true;
  }
  return false;
}
function refreshComputed(computed2) {
  if (computed2.flags & 4 && !(computed2.flags & 16)) {
    return;
  }
  computed2.flags &= -17;
  if (computed2.globalVersion === globalVersion) {
    return;
  }
  computed2.globalVersion = globalVersion;
  if (!computed2.isSSR && computed2.flags & 128 && (!computed2.deps && !computed2._dirty || !isDirty(computed2))) {
    return;
  }
  computed2.flags |= 2;
  const dep = computed2.dep;
  const prevSub = activeSub;
  const prevShouldTrack = shouldTrack;
  activeSub = computed2;
  shouldTrack = true;
  try {
    prepareDeps(computed2);
    const value = computed2.fn(computed2._value);
    if (dep.version === 0 || hasChanged(value, computed2._value)) {
      computed2.flags |= 128;
      computed2._value = value;
      dep.version++;
    }
  } catch (err) {
    dep.version++;
    throw err;
  } finally {
    activeSub = prevSub;
    shouldTrack = prevShouldTrack;
    cleanupDeps(computed2);
    computed2.flags &= -3;
  }
}
function removeSub(link, soft = false) {
  const { dep, prevSub, nextSub } = link;
  if (prevSub) {
    prevSub.nextSub = nextSub;
    link.prevSub = void 0;
  }
  if (nextSub) {
    nextSub.prevSub = prevSub;
    link.nextSub = void 0;
  }
  if (dep.subs === link) {
    dep.subs = prevSub;
    if (!prevSub && dep.computed) {
      dep.computed.flags &= -5;
      for (let l = dep.computed.deps; l; l = l.nextDep) {
        removeSub(l, true);
      }
    }
  }
  if (!soft && !--dep.sc && dep.map) {
    dep.map.delete(dep.key);
  }
}
function removeDep(link) {
  const { prevDep, nextDep } = link;
  if (prevDep) {
    prevDep.nextDep = nextDep;
    link.prevDep = void 0;
  }
  if (nextDep) {
    nextDep.prevDep = prevDep;
    link.nextDep = void 0;
  }
}
let shouldTrack = true;
const trackStack = [];
function pauseTracking() {
  trackStack.push(shouldTrack);
  shouldTrack = false;
}
function resetTracking() {
  const last = trackStack.pop();
  shouldTrack = last === void 0 ? true : last;
}
function cleanupEffect(e) {
  const { cleanup } = e;
  e.cleanup = void 0;
  if (cleanup) {
    const prevSub = activeSub;
    activeSub = void 0;
    try {
      cleanup();
    } finally {
      activeSub = prevSub;
    }
  }
}
let globalVersion = 0;
class Link {
  constructor(sub, dep) {
    this.sub = sub;
    this.dep = dep;
    this.version = dep.version;
    this.nextDep = this.prevDep = this.nextSub = this.prevSub = this.prevActiveLink = void 0;
  }
}
class Dep {
  // TODO isolatedDeclarations "__v_skip"
  constructor(computed2) {
    this.computed = computed2;
    this.version = 0;
    this.activeLink = void 0;
    this.subs = void 0;
    this.map = void 0;
    this.key = void 0;
    this.sc = 0;
    this.__v_skip = true;
  }
  track(debugInfo) {
    if (!activeSub || !shouldTrack || activeSub === this.computed) {
      return;
    }
    let link = this.activeLink;
    if (link === void 0 || link.sub !== activeSub) {
      link = this.activeLink = new Link(activeSub, this);
      if (!activeSub.deps) {
        activeSub.deps = activeSub.depsTail = link;
      } else {
        link.prevDep = activeSub.depsTail;
        activeSub.depsTail.nextDep = link;
        activeSub.depsTail = link;
      }
      addSub(link);
    } else if (link.version === -1) {
      link.version = this.version;
      if (link.nextDep) {
        const next = link.nextDep;
        next.prevDep = link.prevDep;
        if (link.prevDep) {
          link.prevDep.nextDep = next;
        }
        link.prevDep = activeSub.depsTail;
        link.nextDep = void 0;
        activeSub.depsTail.nextDep = link;
        activeSub.depsTail = link;
        if (activeSub.deps === link) {
          activeSub.deps = next;
        }
      }
    }
    return link;
  }
  trigger(debugInfo) {
    this.version++;
    globalVersion++;
    this.notify(debugInfo);
  }
  notify(debugInfo) {
    startBatch();
    try {
      if (false) ;
      for (let link = this.subs; link; link = link.prevSub) {
        if (link.sub.notify()) {
          ;
          link.sub.dep.notify();
        }
      }
    } finally {
      endBatch();
    }
  }
}
function addSub(link) {
  link.dep.sc++;
  if (link.sub.flags & 4) {
    const computed2 = link.dep.computed;
    if (computed2 && !link.dep.subs) {
      computed2.flags |= 4 | 16;
      for (let l = computed2.deps; l; l = l.nextDep) {
        addSub(l);
      }
    }
    const currentTail = link.dep.subs;
    if (currentTail !== link) {
      link.prevSub = currentTail;
      if (currentTail) currentTail.nextSub = link;
    }
    link.dep.subs = link;
  }
}
const targetMap = /* @__PURE__ */ new WeakMap();
const ITERATE_KEY = /* @__PURE__ */ Symbol(
  ""
);
const MAP_KEY_ITERATE_KEY = /* @__PURE__ */ Symbol(
  ""
);
const ARRAY_ITERATE_KEY = /* @__PURE__ */ Symbol(
  ""
);
function track(target, type, key) {
  if (shouldTrack && activeSub) {
    let depsMap = targetMap.get(target);
    if (!depsMap) {
      targetMap.set(target, depsMap = /* @__PURE__ */ new Map());
    }
    let dep = depsMap.get(key);
    if (!dep) {
      depsMap.set(key, dep = new Dep());
      dep.map = depsMap;
      dep.key = key;
    }
    {
      dep.track();
    }
  }
}
function trigger(target, type, key, newValue, oldValue, oldTarget) {
  const depsMap = targetMap.get(target);
  if (!depsMap) {
    globalVersion++;
    return;
  }
  const run = (dep) => {
    if (dep) {
      {
        dep.trigger();
      }
    }
  };
  startBatch();
  if (type === "clear") {
    depsMap.forEach(run);
  } else {
    const targetIsArray = isArray(target);
    const isArrayIndex = targetIsArray && isIntegerKey(key);
    if (targetIsArray && key === "length") {
      const newLength = Number(newValue);
      depsMap.forEach((dep, key2) => {
        if (key2 === "length" || key2 === ARRAY_ITERATE_KEY || !isSymbol(key2) && key2 >= newLength) {
          run(dep);
        }
      });
    } else {
      if (key !== void 0 || depsMap.has(void 0)) {
        run(depsMap.get(key));
      }
      if (isArrayIndex) {
        run(depsMap.get(ARRAY_ITERATE_KEY));
      }
      switch (type) {
        case "add":
          if (!targetIsArray) {
            run(depsMap.get(ITERATE_KEY));
            if (isMap(target)) {
              run(depsMap.get(MAP_KEY_ITERATE_KEY));
            }
          } else if (isArrayIndex) {
            run(depsMap.get("length"));
          }
          break;
        case "delete":
          if (!targetIsArray) {
            run(depsMap.get(ITERATE_KEY));
            if (isMap(target)) {
              run(depsMap.get(MAP_KEY_ITERATE_KEY));
            }
          }
          break;
        case "set":
          if (isMap(target)) {
            run(depsMap.get(ITERATE_KEY));
          }
          break;
      }
    }
  }
  endBatch();
}
function reactiveReadArray(array) {
  const raw = /* @__PURE__ */ toRaw(array);
  if (raw === array) return raw;
  track(raw, "iterate", ARRAY_ITERATE_KEY);
  return /* @__PURE__ */ isShallow(array) ? raw : raw.map(toReactive);
}
function shallowReadArray(arr) {
  track(arr = /* @__PURE__ */ toRaw(arr), "iterate", ARRAY_ITERATE_KEY);
  return arr;
}
function toWrapped(target, item) {
  if (/* @__PURE__ */ isReadonly(target)) {
    return /* @__PURE__ */ isReactive(target) ? toReadonly(toReactive(item)) : toReadonly(item);
  }
  return toReactive(item);
}
const arrayInstrumentations = {
  __proto__: null,
  [Symbol.iterator]() {
    return iterator(this, Symbol.iterator, (item) => toWrapped(this, item));
  },
  concat(...args) {
    return reactiveReadArray(this).concat(
      ...args.map((x) => isArray(x) ? reactiveReadArray(x) : x)
    );
  },
  entries() {
    return iterator(this, "entries", (value) => {
      value[1] = toWrapped(this, value[1]);
      return value;
    });
  },
  every(fn, thisArg) {
    return apply(this, "every", fn, thisArg, void 0, arguments);
  },
  filter(fn, thisArg) {
    return apply(
      this,
      "filter",
      fn,
      thisArg,
      (v) => v.map((item) => toWrapped(this, item)),
      arguments
    );
  },
  find(fn, thisArg) {
    return apply(
      this,
      "find",
      fn,
      thisArg,
      (item) => toWrapped(this, item),
      arguments
    );
  },
  findIndex(fn, thisArg) {
    return apply(this, "findIndex", fn, thisArg, void 0, arguments);
  },
  findLast(fn, thisArg) {
    return apply(
      this,
      "findLast",
      fn,
      thisArg,
      (item) => toWrapped(this, item),
      arguments
    );
  },
  findLastIndex(fn, thisArg) {
    return apply(this, "findLastIndex", fn, thisArg, void 0, arguments);
  },
  // flat, flatMap could benefit from ARRAY_ITERATE but are not straight-forward to implement
  forEach(fn, thisArg) {
    return apply(this, "forEach", fn, thisArg, void 0, arguments);
  },
  includes(...args) {
    return searchProxy(this, "includes", args);
  },
  indexOf(...args) {
    return searchProxy(this, "indexOf", args);
  },
  join(separator) {
    return reactiveReadArray(this).join(separator);
  },
  // keys() iterator only reads `length`, no optimization required
  lastIndexOf(...args) {
    return searchProxy(this, "lastIndexOf", args);
  },
  map(fn, thisArg) {
    return apply(this, "map", fn, thisArg, void 0, arguments);
  },
  pop() {
    return noTracking(this, "pop");
  },
  push(...args) {
    return noTracking(this, "push", args);
  },
  reduce(fn, ...args) {
    return reduce(this, "reduce", fn, args);
  },
  reduceRight(fn, ...args) {
    return reduce(this, "reduceRight", fn, args);
  },
  shift() {
    return noTracking(this, "shift");
  },
  // slice could use ARRAY_ITERATE but also seems to beg for range tracking
  some(fn, thisArg) {
    return apply(this, "some", fn, thisArg, void 0, arguments);
  },
  splice(...args) {
    return noTracking(this, "splice", args);
  },
  toReversed() {
    return reactiveReadArray(this).toReversed();
  },
  toSorted(comparer) {
    return reactiveReadArray(this).toSorted(comparer);
  },
  toSpliced(...args) {
    return reactiveReadArray(this).toSpliced(...args);
  },
  unshift(...args) {
    return noTracking(this, "unshift", args);
  },
  values() {
    return iterator(this, "values", (item) => toWrapped(this, item));
  }
};
function iterator(self2, method, wrapValue) {
  const arr = shallowReadArray(self2);
  const iter = arr[method]();
  if (arr !== self2 && !/* @__PURE__ */ isShallow(self2)) {
    iter._next = iter.next;
    iter.next = () => {
      const result = iter._next();
      if (!result.done) {
        result.value = wrapValue(result.value);
      }
      return result;
    };
  }
  return iter;
}
const arrayProto = Array.prototype;
function apply(self2, method, fn, thisArg, wrappedRetFn, args) {
  const arr = shallowReadArray(self2);
  const needsWrap = arr !== self2 && !/* @__PURE__ */ isShallow(self2);
  const methodFn = arr[method];
  if (methodFn !== arrayProto[method]) {
    const result2 = methodFn.apply(self2, args);
    return needsWrap ? toReactive(result2) : result2;
  }
  let wrappedFn = fn;
  if (arr !== self2) {
    if (needsWrap) {
      wrappedFn = function(item, index) {
        return fn.call(this, toWrapped(self2, item), index, self2);
      };
    } else if (fn.length > 2) {
      wrappedFn = function(item, index) {
        return fn.call(this, item, index, self2);
      };
    }
  }
  const result = methodFn.call(arr, wrappedFn, thisArg);
  return needsWrap && wrappedRetFn ? wrappedRetFn(result) : result;
}
function reduce(self2, method, fn, args) {
  const arr = shallowReadArray(self2);
  let wrappedFn = fn;
  if (arr !== self2) {
    if (!/* @__PURE__ */ isShallow(self2)) {
      wrappedFn = function(acc, item, index) {
        return fn.call(this, acc, toWrapped(self2, item), index, self2);
      };
    } else if (fn.length > 3) {
      wrappedFn = function(acc, item, index) {
        return fn.call(this, acc, item, index, self2);
      };
    }
  }
  return arr[method](wrappedFn, ...args);
}
function searchProxy(self2, method, args) {
  const arr = /* @__PURE__ */ toRaw(self2);
  track(arr, "iterate", ARRAY_ITERATE_KEY);
  const res = arr[method](...args);
  if ((res === -1 || res === false) && /* @__PURE__ */ isProxy(args[0])) {
    args[0] = /* @__PURE__ */ toRaw(args[0]);
    return arr[method](...args);
  }
  return res;
}
function noTracking(self2, method, args = []) {
  pauseTracking();
  startBatch();
  const res = (/* @__PURE__ */ toRaw(self2))[method].apply(self2, args);
  endBatch();
  resetTracking();
  return res;
}
const isNonTrackableKeys = /* @__PURE__ */ makeMap(`__proto__,__v_isRef,__isVue`);
const builtInSymbols = new Set(
  /* @__PURE__ */ Object.getOwnPropertyNames(Symbol).filter((key) => key !== "arguments" && key !== "caller").map((key) => Symbol[key]).filter(isSymbol)
);
function hasOwnProperty(key) {
  if (!isSymbol(key)) key = String(key);
  const obj = /* @__PURE__ */ toRaw(this);
  track(obj, "has", key);
  return obj.hasOwnProperty(key);
}
class BaseReactiveHandler {
  constructor(_isReadonly = false, _isShallow = false) {
    this._isReadonly = _isReadonly;
    this._isShallow = _isShallow;
  }
  get(target, key, receiver) {
    if (key === "__v_skip") return target["__v_skip"];
    const isReadonly2 = this._isReadonly, isShallow2 = this._isShallow;
    if (key === "__v_isReactive") {
      return !isReadonly2;
    } else if (key === "__v_isReadonly") {
      return isReadonly2;
    } else if (key === "__v_isShallow") {
      return isShallow2;
    } else if (key === "__v_raw") {
      if (receiver === (isReadonly2 ? isShallow2 ? shallowReadonlyMap : readonlyMap : isShallow2 ? shallowReactiveMap : reactiveMap).get(target) || // receiver is not the reactive proxy, but has the same prototype
      // this means the receiver is a user proxy of the reactive proxy
      Object.getPrototypeOf(target) === Object.getPrototypeOf(receiver)) {
        return target;
      }
      return;
    }
    const targetIsArray = isArray(target);
    if (!isReadonly2) {
      let fn;
      if (targetIsArray && (fn = arrayInstrumentations[key])) {
        return fn;
      }
      if (key === "hasOwnProperty") {
        return hasOwnProperty;
      }
    }
    const res = Reflect.get(
      target,
      key,
      // if this is a proxy wrapping a ref, return methods using the raw ref
      // as receiver so that we don't have to call `toRaw` on the ref in all
      // its class methods
      /* @__PURE__ */ isRef(target) ? target : receiver
    );
    if (isSymbol(key) ? builtInSymbols.has(key) : isNonTrackableKeys(key)) {
      return res;
    }
    if (!isReadonly2) {
      track(target, "get", key);
    }
    if (isShallow2) {
      return res;
    }
    if (/* @__PURE__ */ isRef(res)) {
      const value = targetIsArray && isIntegerKey(key) ? res : res.value;
      return isReadonly2 && isObject(value) ? /* @__PURE__ */ readonly(value) : value;
    }
    if (isObject(res)) {
      return isReadonly2 ? /* @__PURE__ */ readonly(res) : /* @__PURE__ */ reactive(res);
    }
    return res;
  }
}
class MutableReactiveHandler extends BaseReactiveHandler {
  constructor(isShallow2 = false) {
    super(false, isShallow2);
  }
  set(target, key, value, receiver) {
    let oldValue = target[key];
    const isArrayWithIntegerKey = isArray(target) && isIntegerKey(key);
    if (!this._isShallow) {
      const isOldValueReadonly = /* @__PURE__ */ isReadonly(oldValue);
      if (!/* @__PURE__ */ isShallow(value) && !/* @__PURE__ */ isReadonly(value)) {
        oldValue = /* @__PURE__ */ toRaw(oldValue);
        value = /* @__PURE__ */ toRaw(value);
      }
      if (!isArrayWithIntegerKey && /* @__PURE__ */ isRef(oldValue) && !/* @__PURE__ */ isRef(value)) {
        if (isOldValueReadonly) {
          return true;
        } else {
          oldValue.value = value;
          return true;
        }
      }
    }
    const hadKey = isArrayWithIntegerKey ? Number(key) < target.length : hasOwn(target, key);
    const result = Reflect.set(
      target,
      key,
      value,
      /* @__PURE__ */ isRef(target) ? target : receiver
    );
    if (target === /* @__PURE__ */ toRaw(receiver)) {
      if (!hadKey) {
        trigger(target, "add", key, value);
      } else if (hasChanged(value, oldValue)) {
        trigger(target, "set", key, value);
      }
    }
    return result;
  }
  deleteProperty(target, key) {
    const hadKey = hasOwn(target, key);
    target[key];
    const result = Reflect.deleteProperty(target, key);
    if (result && hadKey) {
      trigger(target, "delete", key, void 0);
    }
    return result;
  }
  has(target, key) {
    const result = Reflect.has(target, key);
    if (!isSymbol(key) || !builtInSymbols.has(key)) {
      track(target, "has", key);
    }
    return result;
  }
  ownKeys(target) {
    track(
      target,
      "iterate",
      isArray(target) ? "length" : ITERATE_KEY
    );
    return Reflect.ownKeys(target);
  }
}
class ReadonlyReactiveHandler extends BaseReactiveHandler {
  constructor(isShallow2 = false) {
    super(true, isShallow2);
  }
  set(target, key) {
    return true;
  }
  deleteProperty(target, key) {
    return true;
  }
}
const mutableHandlers = /* @__PURE__ */ new MutableReactiveHandler();
const readonlyHandlers = /* @__PURE__ */ new ReadonlyReactiveHandler();
const shallowReactiveHandlers = /* @__PURE__ */ new MutableReactiveHandler(true);
const shallowReadonlyHandlers = /* @__PURE__ */ new ReadonlyReactiveHandler(true);
const toShallow = (value) => value;
const getProto = (v) => Reflect.getPrototypeOf(v);
function createIterableMethod(method, isReadonly2, isShallow2) {
  return function(...args) {
    const target = this["__v_raw"];
    const rawTarget = /* @__PURE__ */ toRaw(target);
    const targetIsMap = isMap(rawTarget);
    const isPair = method === "entries" || method === Symbol.iterator && targetIsMap;
    const isKeyOnly = method === "keys" && targetIsMap;
    const innerIterator = target[method](...args);
    const wrap = isShallow2 ? toShallow : isReadonly2 ? toReadonly : toReactive;
    !isReadonly2 && track(
      rawTarget,
      "iterate",
      isKeyOnly ? MAP_KEY_ITERATE_KEY : ITERATE_KEY
    );
    return extend(
      // inheriting all iterator properties
      Object.create(innerIterator),
      {
        // iterator protocol
        next() {
          const { value, done } = innerIterator.next();
          return done ? { value, done } : {
            value: isPair ? [wrap(value[0]), wrap(value[1])] : wrap(value),
            done
          };
        }
      }
    );
  };
}
function createReadonlyMethod(type) {
  return function(...args) {
    return type === "delete" ? false : type === "clear" ? void 0 : this;
  };
}
function createInstrumentations(readonly2, shallow) {
  const instrumentations = {
    get(key) {
      const target = this["__v_raw"];
      const rawTarget = /* @__PURE__ */ toRaw(target);
      const rawKey = /* @__PURE__ */ toRaw(key);
      if (!readonly2) {
        if (hasChanged(key, rawKey)) {
          track(rawTarget, "get", key);
        }
        track(rawTarget, "get", rawKey);
      }
      const { has } = getProto(rawTarget);
      const wrap = shallow ? toShallow : readonly2 ? toReadonly : toReactive;
      if (has.call(rawTarget, key)) {
        return wrap(target.get(key));
      } else if (has.call(rawTarget, rawKey)) {
        return wrap(target.get(rawKey));
      } else if (target !== rawTarget) {
        target.get(key);
      }
    },
    get size() {
      const target = this["__v_raw"];
      !readonly2 && track(/* @__PURE__ */ toRaw(target), "iterate", ITERATE_KEY);
      return target.size;
    },
    has(key) {
      const target = this["__v_raw"];
      const rawTarget = /* @__PURE__ */ toRaw(target);
      const rawKey = /* @__PURE__ */ toRaw(key);
      if (!readonly2) {
        if (hasChanged(key, rawKey)) {
          track(rawTarget, "has", key);
        }
        track(rawTarget, "has", rawKey);
      }
      return key === rawKey ? target.has(key) : target.has(key) || target.has(rawKey);
    },
    forEach(callback, thisArg) {
      const observed = this;
      const target = observed["__v_raw"];
      const rawTarget = /* @__PURE__ */ toRaw(target);
      const wrap = shallow ? toShallow : readonly2 ? toReadonly : toReactive;
      !readonly2 && track(rawTarget, "iterate", ITERATE_KEY);
      return target.forEach((value, key) => {
        return callback.call(thisArg, wrap(value), wrap(key), observed);
      });
    }
  };
  extend(
    instrumentations,
    readonly2 ? {
      add: createReadonlyMethod("add"),
      set: createReadonlyMethod("set"),
      delete: createReadonlyMethod("delete"),
      clear: createReadonlyMethod("clear")
    } : {
      add(value) {
        if (!shallow && !/* @__PURE__ */ isShallow(value) && !/* @__PURE__ */ isReadonly(value)) {
          value = /* @__PURE__ */ toRaw(value);
        }
        const target = /* @__PURE__ */ toRaw(this);
        const proto = getProto(target);
        const hadKey = proto.has.call(target, value);
        if (!hadKey) {
          target.add(value);
          trigger(target, "add", value, value);
        }
        return this;
      },
      set(key, value) {
        if (!shallow && !/* @__PURE__ */ isShallow(value) && !/* @__PURE__ */ isReadonly(value)) {
          value = /* @__PURE__ */ toRaw(value);
        }
        const target = /* @__PURE__ */ toRaw(this);
        const { has, get } = getProto(target);
        let hadKey = has.call(target, key);
        if (!hadKey) {
          key = /* @__PURE__ */ toRaw(key);
          hadKey = has.call(target, key);
        }
        const oldValue = get.call(target, key);
        target.set(key, value);
        if (!hadKey) {
          trigger(target, "add", key, value);
        } else if (hasChanged(value, oldValue)) {
          trigger(target, "set", key, value);
        }
        return this;
      },
      delete(key) {
        const target = /* @__PURE__ */ toRaw(this);
        const { has, get } = getProto(target);
        let hadKey = has.call(target, key);
        if (!hadKey) {
          key = /* @__PURE__ */ toRaw(key);
          hadKey = has.call(target, key);
        }
        get ? get.call(target, key) : void 0;
        const result = target.delete(key);
        if (hadKey) {
          trigger(target, "delete", key, void 0);
        }
        return result;
      },
      clear() {
        const target = /* @__PURE__ */ toRaw(this);
        const hadItems = target.size !== 0;
        const result = target.clear();
        if (hadItems) {
          trigger(
            target,
            "clear",
            void 0,
            void 0
          );
        }
        return result;
      }
    }
  );
  const iteratorMethods = [
    "keys",
    "values",
    "entries",
    Symbol.iterator
  ];
  iteratorMethods.forEach((method) => {
    instrumentations[method] = createIterableMethod(method, readonly2, shallow);
  });
  return instrumentations;
}
function createInstrumentationGetter(isReadonly2, shallow) {
  const instrumentations = createInstrumentations(isReadonly2, shallow);
  return (target, key, receiver) => {
    if (key === "__v_isReactive") {
      return !isReadonly2;
    } else if (key === "__v_isReadonly") {
      return isReadonly2;
    } else if (key === "__v_raw") {
      return target;
    }
    return Reflect.get(
      hasOwn(instrumentations, key) && key in target ? instrumentations : target,
      key,
      receiver
    );
  };
}
const mutableCollectionHandlers = {
  get: /* @__PURE__ */ createInstrumentationGetter(false, false)
};
const shallowCollectionHandlers = {
  get: /* @__PURE__ */ createInstrumentationGetter(false, true)
};
const readonlyCollectionHandlers = {
  get: /* @__PURE__ */ createInstrumentationGetter(true, false)
};
const shallowReadonlyCollectionHandlers = {
  get: /* @__PURE__ */ createInstrumentationGetter(true, true)
};
const reactiveMap = /* @__PURE__ */ new WeakMap();
const shallowReactiveMap = /* @__PURE__ */ new WeakMap();
const readonlyMap = /* @__PURE__ */ new WeakMap();
const shallowReadonlyMap = /* @__PURE__ */ new WeakMap();
function targetTypeMap(rawType) {
  switch (rawType) {
    case "Object":
    case "Array":
      return 1;
    case "Map":
    case "Set":
    case "WeakMap":
    case "WeakSet":
      return 2;
    default:
      return 0;
  }
}
function getTargetType(value) {
  return value["__v_skip"] || !Object.isExtensible(value) ? 0 : targetTypeMap(toRawType(value));
}
// @__NO_SIDE_EFFECTS__
function reactive(target) {
  if (/* @__PURE__ */ isReadonly(target)) {
    return target;
  }
  return createReactiveObject(
    target,
    false,
    mutableHandlers,
    mutableCollectionHandlers,
    reactiveMap
  );
}
// @__NO_SIDE_EFFECTS__
function shallowReactive(target) {
  return createReactiveObject(
    target,
    false,
    shallowReactiveHandlers,
    shallowCollectionHandlers,
    shallowReactiveMap
  );
}
// @__NO_SIDE_EFFECTS__
function readonly(target) {
  return createReactiveObject(
    target,
    true,
    readonlyHandlers,
    readonlyCollectionHandlers,
    readonlyMap
  );
}
// @__NO_SIDE_EFFECTS__
function shallowReadonly(target) {
  return createReactiveObject(
    target,
    true,
    shallowReadonlyHandlers,
    shallowReadonlyCollectionHandlers,
    shallowReadonlyMap
  );
}
function createReactiveObject(target, isReadonly2, baseHandlers, collectionHandlers, proxyMap) {
  if (!isObject(target)) {
    return target;
  }
  if (target["__v_raw"] && !(isReadonly2 && target["__v_isReactive"])) {
    return target;
  }
  const targetType = getTargetType(target);
  if (targetType === 0) {
    return target;
  }
  const existingProxy = proxyMap.get(target);
  if (existingProxy) {
    return existingProxy;
  }
  const proxy = new Proxy(
    target,
    targetType === 2 ? collectionHandlers : baseHandlers
  );
  proxyMap.set(target, proxy);
  return proxy;
}
// @__NO_SIDE_EFFECTS__
function isReactive(value) {
  if (/* @__PURE__ */ isReadonly(value)) {
    return /* @__PURE__ */ isReactive(value["__v_raw"]);
  }
  return !!(value && value["__v_isReactive"]);
}
// @__NO_SIDE_EFFECTS__
function isReadonly(value) {
  return !!(value && value["__v_isReadonly"]);
}
// @__NO_SIDE_EFFECTS__
function isShallow(value) {
  return !!(value && value["__v_isShallow"]);
}
// @__NO_SIDE_EFFECTS__
function isProxy(value) {
  return value ? !!value["__v_raw"] : false;
}
// @__NO_SIDE_EFFECTS__
function toRaw(observed) {
  const raw = observed && observed["__v_raw"];
  return raw ? /* @__PURE__ */ toRaw(raw) : observed;
}
function markRaw(value) {
  if (!hasOwn(value, "__v_skip") && Object.isExtensible(value)) {
    def(value, "__v_skip", true);
  }
  return value;
}
const toReactive = (value) => isObject(value) ? /* @__PURE__ */ reactive(value) : value;
const toReadonly = (value) => isObject(value) ? /* @__PURE__ */ readonly(value) : value;
// @__NO_SIDE_EFFECTS__
function isRef(r) {
  return r ? r["__v_isRef"] === true : false;
}
function unref(ref2) {
  return /* @__PURE__ */ isRef(ref2) ? ref2.value : ref2;
}
const shallowUnwrapHandlers = {
  get: (target, key, receiver) => key === "__v_raw" ? target : unref(Reflect.get(target, key, receiver)),
  set: (target, key, value, receiver) => {
    const oldValue = target[key];
    if (/* @__PURE__ */ isRef(oldValue) && !/* @__PURE__ */ isRef(value)) {
      oldValue.value = value;
      return true;
    } else {
      return Reflect.set(target, key, value, receiver);
    }
  }
};
function proxyRefs(objectWithRefs) {
  return /* @__PURE__ */ isReactive(objectWithRefs) ? objectWithRefs : new Proxy(objectWithRefs, shallowUnwrapHandlers);
}
class ComputedRefImpl {
  constructor(fn, setter, isSSR) {
    this.fn = fn;
    this.setter = setter;
    this._value = void 0;
    this.dep = new Dep(this);
    this.__v_isRef = true;
    this.deps = void 0;
    this.depsTail = void 0;
    this.flags = 16;
    this.globalVersion = globalVersion - 1;
    this.next = void 0;
    this.effect = this;
    this["__v_isReadonly"] = !setter;
    this.isSSR = isSSR;
  }
  /**
   * @internal
   */
  notify() {
    this.flags |= 16;
    if (!(this.flags & 8) && // avoid infinite self recursion
    activeSub !== this) {
      batch(this, true);
      return true;
    }
  }
  get value() {
    const link = this.dep.track();
    refreshComputed(this);
    if (link) {
      link.version = this.dep.version;
    }
    return this._value;
  }
  set value(newValue) {
    if (this.setter) {
      this.setter(newValue);
    }
  }
}
// @__NO_SIDE_EFFECTS__
function computed$1(getterOrOptions, debugOptions, isSSR = false) {
  let getter;
  let setter;
  if (isFunction(getterOrOptions)) {
    getter = getterOrOptions;
  } else {
    getter = getterOrOptions.get;
    setter = getterOrOptions.set;
  }
  const cRef = new ComputedRefImpl(getter, setter, isSSR);
  return cRef;
}
const INITIAL_WATCHER_VALUE = {};
const cleanupMap = /* @__PURE__ */ new WeakMap();
let activeWatcher = void 0;
function onWatcherCleanup(cleanupFn, failSilently = false, owner = activeWatcher) {
  if (owner) {
    let cleanups = cleanupMap.get(owner);
    if (!cleanups) cleanupMap.set(owner, cleanups = []);
    cleanups.push(cleanupFn);
  }
}
function watch$1(source, cb, options = EMPTY_OBJ) {
  const { immediate, deep, once, scheduler, augmentJob, call } = options;
  const reactiveGetter = (source2) => {
    if (deep) return source2;
    if (/* @__PURE__ */ isShallow(source2) || deep === false || deep === 0)
      return traverse(source2, 1);
    return traverse(source2);
  };
  let effect2;
  let getter;
  let cleanup;
  let boundCleanup;
  let forceTrigger = false;
  let isMultiSource = false;
  if (/* @__PURE__ */ isRef(source)) {
    getter = () => source.value;
    forceTrigger = /* @__PURE__ */ isShallow(source);
  } else if (/* @__PURE__ */ isReactive(source)) {
    getter = () => reactiveGetter(source);
    forceTrigger = true;
  } else if (isArray(source)) {
    isMultiSource = true;
    forceTrigger = source.some((s) => /* @__PURE__ */ isReactive(s) || /* @__PURE__ */ isShallow(s));
    getter = () => source.map((s) => {
      if (/* @__PURE__ */ isRef(s)) {
        return s.value;
      } else if (/* @__PURE__ */ isReactive(s)) {
        return reactiveGetter(s);
      } else if (isFunction(s)) {
        return call ? call(s, 2) : s();
      } else ;
    });
  } else if (isFunction(source)) {
    if (cb) {
      getter = call ? () => call(source, 2) : source;
    } else {
      getter = () => {
        if (cleanup) {
          pauseTracking();
          try {
            cleanup();
          } finally {
            resetTracking();
          }
        }
        const currentEffect = activeWatcher;
        activeWatcher = effect2;
        try {
          return call ? call(source, 3, [boundCleanup]) : source(boundCleanup);
        } finally {
          activeWatcher = currentEffect;
        }
      };
    }
  } else {
    getter = NOOP;
  }
  if (cb && deep) {
    const baseGetter = getter;
    const depth = deep === true ? Infinity : deep;
    getter = () => traverse(baseGetter(), depth);
  }
  const scope = getCurrentScope();
  const watchHandle = () => {
    effect2.stop();
    if (scope && scope.active) {
      remove(scope.effects, effect2);
    }
  };
  if (once && cb) {
    const _cb = cb;
    cb = (...args) => {
      _cb(...args);
      watchHandle();
    };
  }
  let oldValue = isMultiSource ? new Array(source.length).fill(INITIAL_WATCHER_VALUE) : INITIAL_WATCHER_VALUE;
  const job = (immediateFirstRun) => {
    if (!(effect2.flags & 1) || !effect2.dirty && !immediateFirstRun) {
      return;
    }
    if (cb) {
      const newValue = effect2.run();
      if (deep || forceTrigger || (isMultiSource ? newValue.some((v, i) => hasChanged(v, oldValue[i])) : hasChanged(newValue, oldValue))) {
        if (cleanup) {
          cleanup();
        }
        const currentWatcher = activeWatcher;
        activeWatcher = effect2;
        try {
          const args = [
            newValue,
            // pass undefined as the old value when it's changed for the first time
            oldValue === INITIAL_WATCHER_VALUE ? void 0 : isMultiSource && oldValue[0] === INITIAL_WATCHER_VALUE ? [] : oldValue,
            boundCleanup
          ];
          oldValue = newValue;
          call ? call(cb, 3, args) : (
            // @ts-expect-error
            cb(...args)
          );
        } finally {
          activeWatcher = currentWatcher;
        }
      }
    } else {
      effect2.run();
    }
  };
  if (augmentJob) {
    augmentJob(job);
  }
  effect2 = new ReactiveEffect(getter);
  effect2.scheduler = scheduler ? () => scheduler(job, false) : job;
  boundCleanup = (fn) => onWatcherCleanup(fn, false, effect2);
  cleanup = effect2.onStop = () => {
    const cleanups = cleanupMap.get(effect2);
    if (cleanups) {
      if (call) {
        call(cleanups, 4);
      } else {
        for (const cleanup2 of cleanups) cleanup2();
      }
      cleanupMap.delete(effect2);
    }
  };
  if (cb) {
    if (immediate) {
      job(true);
    } else {
      oldValue = effect2.run();
    }
  } else if (scheduler) {
    scheduler(job.bind(null, true), true);
  } else {
    effect2.run();
  }
  watchHandle.pause = effect2.pause.bind(effect2);
  watchHandle.resume = effect2.resume.bind(effect2);
  watchHandle.stop = watchHandle;
  return watchHandle;
}
function traverse(value, depth = Infinity, seen) {
  if (depth <= 0 || !isObject(value) || value["__v_skip"]) {
    return value;
  }
  seen = seen || /* @__PURE__ */ new Map();
  if ((seen.get(value) || 0) >= depth) {
    return value;
  }
  seen.set(value, depth);
  depth--;
  if (/* @__PURE__ */ isRef(value)) {
    traverse(value.value, depth, seen);
  } else if (isArray(value)) {
    for (let i = 0; i < value.length; i++) {
      traverse(value[i], depth, seen);
    }
  } else if (isSet(value) || isMap(value)) {
    value.forEach((v) => {
      traverse(v, depth, seen);
    });
  } else if (isPlainObject(value)) {
    for (const key in value) {
      traverse(value[key], depth, seen);
    }
    for (const key of Object.getOwnPropertySymbols(value)) {
      if (Object.prototype.propertyIsEnumerable.call(value, key)) {
        traverse(value[key], depth, seen);
      }
    }
  }
  return value;
}
const stack = [];
let isWarning = false;
function warn$1(msg, ...args) {
  if (isWarning) return;
  isWarning = true;
  pauseTracking();
  const instance = stack.length ? stack[stack.length - 1].component : null;
  const appWarnHandler = instance && instance.appContext.config.warnHandler;
  const trace = getComponentTrace();
  if (appWarnHandler) {
    callWithErrorHandling(
      appWarnHandler,
      instance,
      11,
      [
        // eslint-disable-next-line no-restricted-syntax
        msg + args.map((a) => {
          var _a, _b;
          return (_b = (_a = a.toString) == null ? void 0 : _a.call(a)) != null ? _b : JSON.stringify(a);
        }).join(""),
        instance && instance.proxy,
        trace.map(
          ({ vnode }) => `at <${formatComponentName(instance, vnode.type)}>`
        ).join("\n"),
        trace
      ]
    );
  } else {
    const warnArgs = [`[Vue warn]: ${msg}`, ...args];
    if (trace.length && // avoid spamming console during tests
    true) {
      warnArgs.push(`
`, ...formatTrace(trace));
    }
    console.warn(...warnArgs);
  }
  resetTracking();
  isWarning = false;
}
function getComponentTrace() {
  let currentVNode = stack[stack.length - 1];
  if (!currentVNode) {
    return [];
  }
  const normalizedStack = [];
  while (currentVNode) {
    const last = normalizedStack[0];
    if (last && last.vnode === currentVNode) {
      last.recurseCount++;
    } else {
      normalizedStack.push({
        vnode: currentVNode,
        recurseCount: 0
      });
    }
    const parentInstance = currentVNode.component && currentVNode.component.parent;
    currentVNode = parentInstance && parentInstance.vnode;
  }
  return normalizedStack;
}
function formatTrace(trace) {
  const logs = [];
  trace.forEach((entry, i) => {
    logs.push(...i === 0 ? [] : [`
`], ...formatTraceEntry(entry));
  });
  return logs;
}
function formatTraceEntry({ vnode, recurseCount }) {
  const postfix = recurseCount > 0 ? `... (${recurseCount} recursive calls)` : ``;
  const isRoot = vnode.component ? vnode.component.parent == null : false;
  const open = ` at <${formatComponentName(
    vnode.component,
    vnode.type,
    isRoot
  )}`;
  const close = `>` + postfix;
  return vnode.props ? [open, ...formatProps(vnode.props), close] : [open + close];
}
function formatProps(props) {
  const res = [];
  const keys = Object.keys(props);
  keys.slice(0, 3).forEach((key) => {
    res.push(...formatProp(key, props[key]));
  });
  if (keys.length > 3) {
    res.push(` ...`);
  }
  return res;
}
function formatProp(key, value, raw) {
  if (isString(value)) {
    value = JSON.stringify(value);
    return raw ? value : [`${key}=${value}`];
  } else if (typeof value === "number" || typeof value === "boolean" || value == null) {
    return raw ? value : [`${key}=${value}`];
  } else if (/* @__PURE__ */ isRef(value)) {
    value = formatProp(key, /* @__PURE__ */ toRaw(value.value), true);
    return raw ? value : [`${key}=Ref<`, value, `>`];
  } else if (isFunction(value)) {
    return [`${key}=fn${value.name ? `<${value.name}>` : ``}`];
  } else {
    value = /* @__PURE__ */ toRaw(value);
    return raw ? value : [`${key}=`, value];
  }
}
function callWithErrorHandling(fn, instance, type, args) {
  try {
    return args ? fn(...args) : fn();
  } catch (err) {
    handleError(err, instance, type);
  }
}
function callWithAsyncErrorHandling(fn, instance, type, args) {
  if (isFunction(fn)) {
    const res = callWithErrorHandling(fn, instance, type, args);
    if (res && isPromise(res)) {
      res.catch((err) => {
        handleError(err, instance, type);
      });
    }
    return res;
  }
  if (isArray(fn)) {
    const values = [];
    for (let i = 0; i < fn.length; i++) {
      values.push(callWithAsyncErrorHandling(fn[i], instance, type, args));
    }
    return values;
  }
}
function handleError(err, instance, type, throwInDev = true) {
  const contextVNode = instance ? instance.vnode : null;
  const { errorHandler, throwUnhandledErrorInProduction } = instance && instance.appContext.config || EMPTY_OBJ;
  if (instance) {
    let cur = instance.parent;
    const exposedInstance = instance.proxy;
    const errorInfo = `https://vuejs.org/error-reference/#runtime-${type}`;
    while (cur) {
      const errorCapturedHooks = cur.ec;
      if (errorCapturedHooks) {
        for (let i = 0; i < errorCapturedHooks.length; i++) {
          if (errorCapturedHooks[i](err, exposedInstance, errorInfo) === false) {
            return;
          }
        }
      }
      cur = cur.parent;
    }
    if (errorHandler) {
      pauseTracking();
      callWithErrorHandling(errorHandler, null, 10, [
        err,
        exposedInstance,
        errorInfo
      ]);
      resetTracking();
      return;
    }
  }
  logError(err, type, contextVNode, throwInDev, throwUnhandledErrorInProduction);
}
function logError(err, type, contextVNode, throwInDev = true, throwInProd = false) {
  if (throwInProd) {
    throw err;
  } else {
    console.error(err);
  }
}
const queue = [];
let flushIndex = -1;
const pendingPostFlushCbs = [];
let activePostFlushCbs = null;
let postFlushIndex = 0;
const resolvedPromise = /* @__PURE__ */ Promise.resolve();
let currentFlushPromise = null;
function nextTick(fn) {
  const p2 = currentFlushPromise || resolvedPromise;
  return fn ? p2.then(this ? fn.bind(this) : fn) : p2;
}
function findInsertionIndex(id) {
  let start = flushIndex + 1;
  let end = queue.length;
  while (start < end) {
    const middle = start + end >>> 1;
    const middleJob = queue[middle];
    const middleJobId = getId(middleJob);
    if (middleJobId < id || middleJobId === id && middleJob.flags & 2) {
      start = middle + 1;
    } else {
      end = middle;
    }
  }
  return start;
}
function queueJob(job) {
  if (!(job.flags & 1)) {
    const jobId = getId(job);
    const lastJob = queue[queue.length - 1];
    if (!lastJob || // fast path when the job id is larger than the tail
    !(job.flags & 2) && jobId >= getId(lastJob)) {
      queue.push(job);
    } else {
      queue.splice(findInsertionIndex(jobId), 0, job);
    }
    job.flags |= 1;
    queueFlush();
  }
}
function queueFlush() {
  if (!currentFlushPromise) {
    currentFlushPromise = resolvedPromise.then(flushJobs);
  }
}
function queuePostFlushCb(cb) {
  if (!isArray(cb)) {
    if (activePostFlushCbs && cb.id === -1) {
      activePostFlushCbs.splice(postFlushIndex + 1, 0, cb);
    } else if (!(cb.flags & 1)) {
      pendingPostFlushCbs.push(cb);
      cb.flags |= 1;
    }
  } else {
    pendingPostFlushCbs.push(...cb);
  }
  queueFlush();
}
function flushPreFlushCbs(instance, seen, i = flushIndex + 1) {
  for (; i < queue.length; i++) {
    const cb = queue[i];
    if (cb && cb.flags & 2) {
      if (instance && cb.id !== instance.uid) {
        continue;
      }
      queue.splice(i, 1);
      i--;
      if (cb.flags & 4) {
        cb.flags &= -2;
      }
      cb();
      if (!(cb.flags & 4)) {
        cb.flags &= -2;
      }
    }
  }
}
function flushPostFlushCbs(seen) {
  if (pendingPostFlushCbs.length) {
    const deduped = [...new Set(pendingPostFlushCbs)].sort(
      (a, b) => getId(a) - getId(b)
    );
    pendingPostFlushCbs.length = 0;
    if (activePostFlushCbs) {
      activePostFlushCbs.push(...deduped);
      return;
    }
    activePostFlushCbs = deduped;
    for (postFlushIndex = 0; postFlushIndex < activePostFlushCbs.length; postFlushIndex++) {
      const cb = activePostFlushCbs[postFlushIndex];
      if (cb.flags & 4) {
        cb.flags &= -2;
      }
      if (!(cb.flags & 8)) cb();
      cb.flags &= -2;
    }
    activePostFlushCbs = null;
    postFlushIndex = 0;
  }
}
const getId = (job) => job.id == null ? job.flags & 2 ? -1 : Infinity : job.id;
function flushJobs(seen) {
  try {
    for (flushIndex = 0; flushIndex < queue.length; flushIndex++) {
      const job = queue[flushIndex];
      if (job && !(job.flags & 8)) {
        if (false) ;
        if (job.flags & 4) {
          job.flags &= ~1;
        }
        callWithErrorHandling(
          job,
          job.i,
          job.i ? 15 : 14
        );
        if (!(job.flags & 4)) {
          job.flags &= ~1;
        }
      }
    }
  } finally {
    for (; flushIndex < queue.length; flushIndex++) {
      const job = queue[flushIndex];
      if (job) {
        job.flags &= -2;
      }
    }
    flushIndex = -1;
    queue.length = 0;
    flushPostFlushCbs();
    currentFlushPromise = null;
    if (queue.length || pendingPostFlushCbs.length) {
      flushJobs();
    }
  }
}
let currentRenderingInstance = null;
let currentScopeId = null;
function setCurrentRenderingInstance(instance) {
  const prev = currentRenderingInstance;
  currentRenderingInstance = instance;
  currentScopeId = instance && instance.type.__scopeId || null;
  return prev;
}
function withCtx(fn, ctx = currentRenderingInstance, isNonScopedSlot) {
  if (!ctx) return fn;
  if (fn._n) {
    return fn;
  }
  const renderFnWithContext = (...args) => {
    if (renderFnWithContext._d) {
      setBlockTracking(-1);
    }
    const prevInstance = setCurrentRenderingInstance(ctx);
    let res;
    try {
      res = fn(...args);
    } finally {
      setCurrentRenderingInstance(prevInstance);
      if (renderFnWithContext._d) {
        setBlockTracking(1);
      }
    }
    return res;
  };
  renderFnWithContext._n = true;
  renderFnWithContext._c = true;
  renderFnWithContext._d = true;
  return renderFnWithContext;
}
function invokeDirectiveHook(vnode, prevVNode, instance, name) {
  const bindings = vnode.dirs;
  const oldBindings = prevVNode && prevVNode.dirs;
  for (let i = 0; i < bindings.length; i++) {
    const binding = bindings[i];
    if (oldBindings) {
      binding.oldValue = oldBindings[i].value;
    }
    let hook = binding.dir[name];
    if (hook) {
      pauseTracking();
      callWithAsyncErrorHandling(hook, instance, 8, [
        vnode.el,
        binding,
        vnode,
        prevVNode
      ]);
      resetTracking();
    }
  }
}
function provide(key, value) {
  if (currentInstance) {
    let provides = currentInstance.provides;
    const parentProvides = currentInstance.parent && currentInstance.parent.provides;
    if (parentProvides === provides) {
      provides = currentInstance.provides = Object.create(parentProvides);
    }
    provides[key] = value;
  }
}
function inject(key, defaultValue, treatDefaultAsFactory = false) {
  const instance = getCurrentInstance();
  if (instance || currentApp) {
    let provides = currentApp ? currentApp._context.provides : instance ? instance.parent == null || instance.ce ? instance.vnode.appContext && instance.vnode.appContext.provides : instance.parent.provides : void 0;
    if (provides && key in provides) {
      return provides[key];
    } else if (arguments.length > 1) {
      return treatDefaultAsFactory && isFunction(defaultValue) ? defaultValue.call(instance && instance.proxy) : defaultValue;
    } else ;
  }
}
const ssrContextKey = /* @__PURE__ */ Symbol.for("v-scx");
const useSSRContext = () => {
  {
    const ctx = inject(ssrContextKey);
    return ctx;
  }
};
function watch(source, cb, options) {
  return doWatch(source, cb, options);
}
function doWatch(source, cb, options = EMPTY_OBJ) {
  const { immediate, deep, flush, once } = options;
  const baseWatchOptions = extend({}, options);
  const runsImmediately = cb && immediate || !cb && flush !== "post";
  let ssrCleanup;
  if (isInSSRComponentSetup) {
    if (flush === "sync") {
      const ctx = useSSRContext();
      ssrCleanup = ctx.__watcherHandles || (ctx.__watcherHandles = []);
    } else if (!runsImmediately) {
      const watchStopHandle = () => {
      };
      watchStopHandle.stop = NOOP;
      watchStopHandle.resume = NOOP;
      watchStopHandle.pause = NOOP;
      return watchStopHandle;
    }
  }
  const instance = currentInstance;
  baseWatchOptions.call = (fn, type, args) => callWithAsyncErrorHandling(fn, instance, type, args);
  let isPre = false;
  if (flush === "post") {
    baseWatchOptions.scheduler = (job) => {
      queuePostRenderEffect(job, instance && instance.suspense);
    };
  } else if (flush !== "sync") {
    isPre = true;
    baseWatchOptions.scheduler = (job, isFirstRun) => {
      if (isFirstRun) {
        job();
      } else {
        queueJob(job);
      }
    };
  }
  baseWatchOptions.augmentJob = (job) => {
    if (cb) {
      job.flags |= 4;
    }
    if (isPre) {
      job.flags |= 2;
      if (instance) {
        job.id = instance.uid;
        job.i = instance;
      }
    }
  };
  const watchHandle = watch$1(source, cb, baseWatchOptions);
  if (isInSSRComponentSetup) {
    if (ssrCleanup) {
      ssrCleanup.push(watchHandle);
    } else if (runsImmediately) {
      watchHandle();
    }
  }
  return watchHandle;
}
function instanceWatch(source, value, options) {
  const publicThis = this.proxy;
  const getter = isString(source) ? source.includes(".") ? createPathGetter(publicThis, source) : () => publicThis[source] : source.bind(publicThis, publicThis);
  let cb;
  if (isFunction(value)) {
    cb = value;
  } else {
    cb = value.handler;
    options = value;
  }
  const reset = setCurrentInstance(this);
  const res = doWatch(getter, cb.bind(publicThis), options);
  reset();
  return res;
}
function createPathGetter(ctx, path) {
  const segments = path.split(".");
  return () => {
    let cur = ctx;
    for (let i = 0; i < segments.length && cur; i++) {
      cur = cur[segments[i]];
    }
    return cur;
  };
}
const TeleportEndKey = /* @__PURE__ */ Symbol("_vte");
const isTeleport = (type) => type.__isTeleport;
const leaveCbKey = /* @__PURE__ */ Symbol("_leaveCb");
function setTransitionHooks(vnode, hooks) {
  if (vnode.shapeFlag & 6 && vnode.component) {
    vnode.transition = hooks;
    setTransitionHooks(vnode.component.subTree, hooks);
  } else if (vnode.shapeFlag & 128) {
    vnode.ssContent.transition = hooks.clone(vnode.ssContent);
    vnode.ssFallback.transition = hooks.clone(vnode.ssFallback);
  } else {
    vnode.transition = hooks;
  }
}
// @__NO_SIDE_EFFECTS__
function defineComponent(options, extraOptions) {
  return isFunction(options) ? (
    // #8236: extend call and options.name access are considered side-effects
    // by Rollup, so we have to wrap it in a pure-annotated IIFE.
    /* @__PURE__ */ (() => extend({ name: options.name }, extraOptions, { setup: options }))()
  ) : options;
}
function markAsyncBoundary(instance) {
  instance.ids = [instance.ids[0] + instance.ids[2]++ + "-", 0, 0];
}
function isTemplateRefKey(refs, key) {
  let desc;
  return !!((desc = Object.getOwnPropertyDescriptor(refs, key)) && !desc.configurable);
}
const pendingSetRefMap = /* @__PURE__ */ new WeakMap();
function setRef(rawRef, oldRawRef, parentSuspense, vnode, isUnmount = false) {
  if (isArray(rawRef)) {
    rawRef.forEach(
      (r, i) => setRef(
        r,
        oldRawRef && (isArray(oldRawRef) ? oldRawRef[i] : oldRawRef),
        parentSuspense,
        vnode,
        isUnmount
      )
    );
    return;
  }
  if (isAsyncWrapper(vnode) && !isUnmount) {
    if (vnode.shapeFlag & 512 && vnode.type.__asyncResolved && vnode.component.subTree.component) {
      setRef(rawRef, oldRawRef, parentSuspense, vnode.component.subTree);
    }
    return;
  }
  const refValue = vnode.shapeFlag & 4 ? getComponentPublicInstance(vnode.component) : vnode.el;
  const value = isUnmount ? null : refValue;
  const { i: owner, r: ref3 } = rawRef;
  const oldRef = oldRawRef && oldRawRef.r;
  const refs = owner.refs === EMPTY_OBJ ? owner.refs = {} : owner.refs;
  const setupState = owner.setupState;
  const rawSetupState = /* @__PURE__ */ toRaw(setupState);
  const canSetSetupRef = setupState === EMPTY_OBJ ? NO : (key) => {
    if (isTemplateRefKey(refs, key)) {
      return false;
    }
    return hasOwn(rawSetupState, key);
  };
  const canSetRef = (ref22, key) => {
    if (key && isTemplateRefKey(refs, key)) {
      return false;
    }
    return true;
  };
  if (oldRef != null && oldRef !== ref3) {
    invalidatePendingSetRef(oldRawRef);
    if (isString(oldRef)) {
      refs[oldRef] = null;
      if (canSetSetupRef(oldRef)) {
        setupState[oldRef] = null;
      }
    } else if (/* @__PURE__ */ isRef(oldRef)) {
      const oldRawRefAtom = oldRawRef;
      if (canSetRef(oldRef, oldRawRefAtom.k)) {
        oldRef.value = null;
      }
      if (oldRawRefAtom.k) refs[oldRawRefAtom.k] = null;
    }
  }
  if (isFunction(ref3)) {
    callWithErrorHandling(ref3, owner, 12, [value, refs]);
  } else {
    const _isString = isString(ref3);
    const _isRef = /* @__PURE__ */ isRef(ref3);
    if (_isString || _isRef) {
      const doSet = () => {
        if (rawRef.f) {
          const existing = _isString ? canSetSetupRef(ref3) ? setupState[ref3] : refs[ref3] : canSetRef() || !rawRef.k ? ref3.value : refs[rawRef.k];
          if (isUnmount) {
            isArray(existing) && remove(existing, refValue);
          } else {
            if (!isArray(existing)) {
              if (_isString) {
                refs[ref3] = [refValue];
                if (canSetSetupRef(ref3)) {
                  setupState[ref3] = refs[ref3];
                }
              } else {
                const newVal = [refValue];
                if (canSetRef(ref3, rawRef.k)) {
                  ref3.value = newVal;
                }
                if (rawRef.k) refs[rawRef.k] = newVal;
              }
            } else if (!existing.includes(refValue)) {
              existing.push(refValue);
            }
          }
        } else if (_isString) {
          refs[ref3] = value;
          if (canSetSetupRef(ref3)) {
            setupState[ref3] = value;
          }
        } else if (_isRef) {
          if (canSetRef(ref3, rawRef.k)) {
            ref3.value = value;
          }
          if (rawRef.k) refs[rawRef.k] = value;
        } else ;
      };
      if (value) {
        const job = () => {
          doSet();
          pendingSetRefMap.delete(rawRef);
        };
        job.id = -1;
        pendingSetRefMap.set(rawRef, job);
        queuePostRenderEffect(job, parentSuspense);
      } else {
        invalidatePendingSetRef(rawRef);
        doSet();
      }
    }
  }
}
function invalidatePendingSetRef(rawRef) {
  const pendingSetRef = pendingSetRefMap.get(rawRef);
  if (pendingSetRef) {
    pendingSetRef.flags |= 8;
    pendingSetRefMap.delete(rawRef);
  }
}
getGlobalThis().requestIdleCallback || ((cb) => setTimeout(cb, 1));
getGlobalThis().cancelIdleCallback || ((id) => clearTimeout(id));
const isAsyncWrapper = (i) => !!i.type.__asyncLoader;
const isKeepAlive = (vnode) => vnode.type.__isKeepAlive;
function onActivated(hook, target) {
  registerKeepAliveHook(hook, "a", target);
}
function onDeactivated(hook, target) {
  registerKeepAliveHook(hook, "da", target);
}
function registerKeepAliveHook(hook, type, target = currentInstance) {
  const wrappedHook = hook.__wdc || (hook.__wdc = () => {
    let current = target;
    while (current) {
      if (current.isDeactivated) {
        return;
      }
      current = current.parent;
    }
    return hook();
  });
  injectHook(type, wrappedHook, target);
  if (target) {
    let current = target.parent;
    while (current && current.parent) {
      if (isKeepAlive(current.parent.vnode)) {
        injectToKeepAliveRoot(wrappedHook, type, target, current);
      }
      current = current.parent;
    }
  }
}
function injectToKeepAliveRoot(hook, type, target, keepAliveRoot) {
  const injected = injectHook(
    type,
    hook,
    keepAliveRoot,
    true
    /* prepend */
  );
  onUnmounted(() => {
    remove(keepAliveRoot[type], injected);
  }, target);
}
function injectHook(type, hook, target = currentInstance, prepend = false) {
  if (target) {
    const hooks = target[type] || (target[type] = []);
    const wrappedHook = hook.__weh || (hook.__weh = (...args) => {
      pauseTracking();
      const reset = setCurrentInstance(target);
      const res = callWithAsyncErrorHandling(hook, target, type, args);
      reset();
      resetTracking();
      return res;
    });
    if (prepend) {
      hooks.unshift(wrappedHook);
    } else {
      hooks.push(wrappedHook);
    }
    return wrappedHook;
  }
}
const createHook = (lifecycle) => (hook, target = currentInstance) => {
  if (!isInSSRComponentSetup || lifecycle === "sp") {
    injectHook(lifecycle, (...args) => hook(...args), target);
  }
};
const onBeforeMount = createHook("bm");
const onMounted = createHook("m");
const onBeforeUpdate = createHook(
  "bu"
);
const onUpdated = createHook("u");
const onBeforeUnmount = createHook(
  "bum"
);
const onUnmounted = createHook("um");
const onServerPrefetch = createHook(
  "sp"
);
const onRenderTriggered = createHook("rtg");
const onRenderTracked = createHook("rtc");
function onErrorCaptured(hook, target = currentInstance) {
  injectHook("ec", hook, target);
}
const NULL_DYNAMIC_COMPONENT = /* @__PURE__ */ Symbol.for("v-ndc");
const getPublicInstance = (i) => {
  if (!i) return null;
  if (isStatefulComponent(i)) return getComponentPublicInstance(i);
  return getPublicInstance(i.parent);
};
const publicPropertiesMap = (
  // Move PURE marker to new line to workaround compiler discarding it
  // due to type annotation
  /* @__PURE__ */ extend(/* @__PURE__ */ Object.create(null), {
    $: (i) => i,
    $el: (i) => i.vnode.el,
    $data: (i) => i.data,
    $props: (i) => i.props,
    $attrs: (i) => i.attrs,
    $slots: (i) => i.slots,
    $refs: (i) => i.refs,
    $parent: (i) => getPublicInstance(i.parent),
    $root: (i) => getPublicInstance(i.root),
    $host: (i) => i.ce,
    $emit: (i) => i.emit,
    $options: (i) => resolveMergedOptions(i),
    $forceUpdate: (i) => i.f || (i.f = () => {
      queueJob(i.update);
    }),
    $nextTick: (i) => i.n || (i.n = nextTick.bind(i.proxy)),
    $watch: (i) => instanceWatch.bind(i)
  })
);
const hasSetupBinding = (state, key) => state !== EMPTY_OBJ && !state.__isScriptSetup && hasOwn(state, key);
const PublicInstanceProxyHandlers = {
  get({ _: instance }, key) {
    if (key === "__v_skip") {
      return true;
    }
    const { ctx, setupState, data, props, accessCache, type, appContext } = instance;
    if (key[0] !== "$") {
      const n = accessCache[key];
      if (n !== void 0) {
        switch (n) {
          case 1:
            return setupState[key];
          case 2:
            return data[key];
          case 4:
            return ctx[key];
          case 3:
            return props[key];
        }
      } else if (hasSetupBinding(setupState, key)) {
        accessCache[key] = 1;
        return setupState[key];
      } else if (data !== EMPTY_OBJ && hasOwn(data, key)) {
        accessCache[key] = 2;
        return data[key];
      } else if (hasOwn(props, key)) {
        accessCache[key] = 3;
        return props[key];
      } else if (ctx !== EMPTY_OBJ && hasOwn(ctx, key)) {
        accessCache[key] = 4;
        return ctx[key];
      } else if (shouldCacheAccess) {
        accessCache[key] = 0;
      }
    }
    const publicGetter = publicPropertiesMap[key];
    let cssModule, globalProperties;
    if (publicGetter) {
      if (key === "$attrs") {
        track(instance.attrs, "get", "");
      }
      return publicGetter(instance);
    } else if (
      // css module (injected by vue-loader)
      (cssModule = type.__cssModules) && (cssModule = cssModule[key])
    ) {
      return cssModule;
    } else if (ctx !== EMPTY_OBJ && hasOwn(ctx, key)) {
      accessCache[key] = 4;
      return ctx[key];
    } else if (
      // global properties
      globalProperties = appContext.config.globalProperties, hasOwn(globalProperties, key)
    ) {
      {
        return globalProperties[key];
      }
    } else ;
  },
  set({ _: instance }, key, value) {
    const { data, setupState, ctx } = instance;
    if (hasSetupBinding(setupState, key)) {
      setupState[key] = value;
      return true;
    } else if (data !== EMPTY_OBJ && hasOwn(data, key)) {
      data[key] = value;
      return true;
    } else if (hasOwn(instance.props, key)) {
      return false;
    }
    if (key[0] === "$" && key.slice(1) in instance) {
      return false;
    } else {
      {
        ctx[key] = value;
      }
    }
    return true;
  },
  has({
    _: { data, setupState, accessCache, ctx, appContext, props, type }
  }, key) {
    let cssModules;
    return !!(accessCache[key] || data !== EMPTY_OBJ && key[0] !== "$" && hasOwn(data, key) || hasSetupBinding(setupState, key) || hasOwn(props, key) || hasOwn(ctx, key) || hasOwn(publicPropertiesMap, key) || hasOwn(appContext.config.globalProperties, key) || (cssModules = type.__cssModules) && cssModules[key]);
  },
  defineProperty(target, key, descriptor) {
    if (descriptor.get != null) {
      target._.accessCache[key] = 0;
    } else if (hasOwn(descriptor, "value")) {
      this.set(target, key, descriptor.value, null);
    }
    return Reflect.defineProperty(target, key, descriptor);
  }
};
function normalizePropsOrEmits(props) {
  return isArray(props) ? props.reduce(
    (normalized, p2) => (normalized[p2] = null, normalized),
    {}
  ) : props;
}
let shouldCacheAccess = true;
function applyOptions(instance) {
  const options = resolveMergedOptions(instance);
  const publicThis = instance.proxy;
  const ctx = instance.ctx;
  shouldCacheAccess = false;
  if (options.beforeCreate) {
    callHook(options.beforeCreate, instance, "bc");
  }
  const {
    // state
    data: dataOptions,
    computed: computedOptions,
    methods,
    watch: watchOptions,
    provide: provideOptions,
    inject: injectOptions,
    // lifecycle
    created,
    beforeMount,
    mounted,
    beforeUpdate,
    updated,
    activated,
    deactivated,
    beforeDestroy,
    beforeUnmount,
    destroyed,
    unmounted,
    render,
    renderTracked,
    renderTriggered,
    errorCaptured,
    serverPrefetch,
    // public API
    expose,
    inheritAttrs,
    // assets
    components,
    directives,
    filters
  } = options;
  const checkDuplicateProperties = null;
  if (injectOptions) {
    resolveInjections(injectOptions, ctx, checkDuplicateProperties);
  }
  if (methods) {
    for (const key in methods) {
      const methodHandler = methods[key];
      if (isFunction(methodHandler)) {
        {
          ctx[key] = methodHandler.bind(publicThis);
        }
      }
    }
  }
  if (dataOptions) {
    const data = dataOptions.call(publicThis, publicThis);
    if (!isObject(data)) ;
    else {
      instance.data = /* @__PURE__ */ reactive(data);
    }
  }
  shouldCacheAccess = true;
  if (computedOptions) {
    for (const key in computedOptions) {
      const opt = computedOptions[key];
      const get = isFunction(opt) ? opt.bind(publicThis, publicThis) : isFunction(opt.get) ? opt.get.bind(publicThis, publicThis) : NOOP;
      const set = !isFunction(opt) && isFunction(opt.set) ? opt.set.bind(publicThis) : NOOP;
      const c = computed({
        get,
        set
      });
      Object.defineProperty(ctx, key, {
        enumerable: true,
        configurable: true,
        get: () => c.value,
        set: (v) => c.value = v
      });
    }
  }
  if (watchOptions) {
    for (const key in watchOptions) {
      createWatcher(watchOptions[key], ctx, publicThis, key);
    }
  }
  if (provideOptions) {
    const provides = isFunction(provideOptions) ? provideOptions.call(publicThis) : provideOptions;
    Reflect.ownKeys(provides).forEach((key) => {
      provide(key, provides[key]);
    });
  }
  if (created) {
    callHook(created, instance, "c");
  }
  function registerLifecycleHook(register, hook) {
    if (isArray(hook)) {
      hook.forEach((_hook) => register(_hook.bind(publicThis)));
    } else if (hook) {
      register(hook.bind(publicThis));
    }
  }
  registerLifecycleHook(onBeforeMount, beforeMount);
  registerLifecycleHook(onMounted, mounted);
  registerLifecycleHook(onBeforeUpdate, beforeUpdate);
  registerLifecycleHook(onUpdated, updated);
  registerLifecycleHook(onActivated, activated);
  registerLifecycleHook(onDeactivated, deactivated);
  registerLifecycleHook(onErrorCaptured, errorCaptured);
  registerLifecycleHook(onRenderTracked, renderTracked);
  registerLifecycleHook(onRenderTriggered, renderTriggered);
  registerLifecycleHook(onBeforeUnmount, beforeUnmount);
  registerLifecycleHook(onUnmounted, unmounted);
  registerLifecycleHook(onServerPrefetch, serverPrefetch);
  if (isArray(expose)) {
    if (expose.length) {
      const exposed = instance.exposed || (instance.exposed = {});
      expose.forEach((key) => {
        Object.defineProperty(exposed, key, {
          get: () => publicThis[key],
          set: (val) => publicThis[key] = val,
          enumerable: true
        });
      });
    } else if (!instance.exposed) {
      instance.exposed = {};
    }
  }
  if (render && instance.render === NOOP) {
    instance.render = render;
  }
  if (inheritAttrs != null) {
    instance.inheritAttrs = inheritAttrs;
  }
  if (components) instance.components = components;
  if (directives) instance.directives = directives;
  if (serverPrefetch) {
    markAsyncBoundary(instance);
  }
}
function resolveInjections(injectOptions, ctx, checkDuplicateProperties = NOOP) {
  if (isArray(injectOptions)) {
    injectOptions = normalizeInject(injectOptions);
  }
  for (const key in injectOptions) {
    const opt = injectOptions[key];
    let injected;
    if (isObject(opt)) {
      if ("default" in opt) {
        injected = inject(
          opt.from || key,
          opt.default,
          true
        );
      } else {
        injected = inject(opt.from || key);
      }
    } else {
      injected = inject(opt);
    }
    if (/* @__PURE__ */ isRef(injected)) {
      Object.defineProperty(ctx, key, {
        enumerable: true,
        configurable: true,
        get: () => injected.value,
        set: (v) => injected.value = v
      });
    } else {
      ctx[key] = injected;
    }
  }
}
function callHook(hook, instance, type) {
  callWithAsyncErrorHandling(
    isArray(hook) ? hook.map((h2) => h2.bind(instance.proxy)) : hook.bind(instance.proxy),
    instance,
    type
  );
}
function createWatcher(raw, ctx, publicThis, key) {
  let getter = key.includes(".") ? createPathGetter(publicThis, key) : () => publicThis[key];
  if (isString(raw)) {
    const handler = ctx[raw];
    if (isFunction(handler)) {
      {
        watch(getter, handler);
      }
    }
  } else if (isFunction(raw)) {
    {
      watch(getter, raw.bind(publicThis));
    }
  } else if (isObject(raw)) {
    if (isArray(raw)) {
      raw.forEach((r) => createWatcher(r, ctx, publicThis, key));
    } else {
      const handler = isFunction(raw.handler) ? raw.handler.bind(publicThis) : ctx[raw.handler];
      if (isFunction(handler)) {
        watch(getter, handler, raw);
      }
    }
  } else ;
}
function resolveMergedOptions(instance) {
  const base = instance.type;
  const { mixins, extends: extendsOptions } = base;
  const {
    mixins: globalMixins,
    optionsCache: cache,
    config: { optionMergeStrategies }
  } = instance.appContext;
  const cached = cache.get(base);
  let resolved;
  if (cached) {
    resolved = cached;
  } else if (!globalMixins.length && !mixins && !extendsOptions) {
    {
      resolved = base;
    }
  } else {
    resolved = {};
    if (globalMixins.length) {
      globalMixins.forEach(
        (m) => mergeOptions(resolved, m, optionMergeStrategies, true)
      );
    }
    mergeOptions(resolved, base, optionMergeStrategies);
  }
  if (isObject(base)) {
    cache.set(base, resolved);
  }
  return resolved;
}
function mergeOptions(to, from, strats, asMixin = false) {
  const { mixins, extends: extendsOptions } = from;
  if (extendsOptions) {
    mergeOptions(to, extendsOptions, strats, true);
  }
  if (mixins) {
    mixins.forEach(
      (m) => mergeOptions(to, m, strats, true)
    );
  }
  for (const key in from) {
    if (asMixin && key === "expose") ;
    else {
      const strat = internalOptionMergeStrats[key] || strats && strats[key];
      to[key] = strat ? strat(to[key], from[key]) : from[key];
    }
  }
  return to;
}
const internalOptionMergeStrats = {
  data: mergeDataFn,
  props: mergeEmitsOrPropsOptions,
  emits: mergeEmitsOrPropsOptions,
  // objects
  methods: mergeObjectOptions,
  computed: mergeObjectOptions,
  // lifecycle
  beforeCreate: mergeAsArray,
  created: mergeAsArray,
  beforeMount: mergeAsArray,
  mounted: mergeAsArray,
  beforeUpdate: mergeAsArray,
  updated: mergeAsArray,
  beforeDestroy: mergeAsArray,
  beforeUnmount: mergeAsArray,
  destroyed: mergeAsArray,
  unmounted: mergeAsArray,
  activated: mergeAsArray,
  deactivated: mergeAsArray,
  errorCaptured: mergeAsArray,
  serverPrefetch: mergeAsArray,
  // assets
  components: mergeObjectOptions,
  directives: mergeObjectOptions,
  // watch
  watch: mergeWatchOptions,
  // provide / inject
  provide: mergeDataFn,
  inject: mergeInject
};
function mergeDataFn(to, from) {
  if (!from) {
    return to;
  }
  if (!to) {
    return from;
  }
  return function mergedDataFn() {
    return extend(
      isFunction(to) ? to.call(this, this) : to,
      isFunction(from) ? from.call(this, this) : from
    );
  };
}
function mergeInject(to, from) {
  return mergeObjectOptions(normalizeInject(to), normalizeInject(from));
}
function normalizeInject(raw) {
  if (isArray(raw)) {
    const res = {};
    for (let i = 0; i < raw.length; i++) {
      res[raw[i]] = raw[i];
    }
    return res;
  }
  return raw;
}
function mergeAsArray(to, from) {
  return to ? [...new Set([].concat(to, from))] : from;
}
function mergeObjectOptions(to, from) {
  return to ? extend(/* @__PURE__ */ Object.create(null), to, from) : from;
}
function mergeEmitsOrPropsOptions(to, from) {
  if (to) {
    if (isArray(to) && isArray(from)) {
      return [.../* @__PURE__ */ new Set([...to, ...from])];
    }
    return extend(
      /* @__PURE__ */ Object.create(null),
      normalizePropsOrEmits(to),
      normalizePropsOrEmits(from != null ? from : {})
    );
  } else {
    return from;
  }
}
function mergeWatchOptions(to, from) {
  if (!to) return from;
  if (!from) return to;
  const merged = extend(/* @__PURE__ */ Object.create(null), to);
  for (const key in from) {
    merged[key] = mergeAsArray(to[key], from[key]);
  }
  return merged;
}
function createAppContext() {
  return {
    app: null,
    config: {
      isNativeTag: NO,
      performance: false,
      globalProperties: {},
      optionMergeStrategies: {},
      errorHandler: void 0,
      warnHandler: void 0,
      compilerOptions: {}
    },
    mixins: [],
    components: {},
    directives: {},
    provides: /* @__PURE__ */ Object.create(null),
    optionsCache: /* @__PURE__ */ new WeakMap(),
    propsCache: /* @__PURE__ */ new WeakMap(),
    emitsCache: /* @__PURE__ */ new WeakMap()
  };
}
let uid$1 = 0;
function createAppAPI(render, hydrate) {
  return function createApp2(rootComponent, rootProps = null) {
    if (!isFunction(rootComponent)) {
      rootComponent = extend({}, rootComponent);
    }
    if (rootProps != null && !isObject(rootProps)) {
      rootProps = null;
    }
    const context = createAppContext();
    const installedPlugins = /* @__PURE__ */ new WeakSet();
    const pluginCleanupFns = [];
    let isMounted = false;
    const app = context.app = {
      _uid: uid$1++,
      _component: rootComponent,
      _props: rootProps,
      _container: null,
      _context: context,
      _instance: null,
      version,
      get config() {
        return context.config;
      },
      set config(v) {
      },
      use(plugin, ...options) {
        if (installedPlugins.has(plugin)) ;
        else if (plugin && isFunction(plugin.install)) {
          installedPlugins.add(plugin);
          plugin.install(app, ...options);
        } else if (isFunction(plugin)) {
          installedPlugins.add(plugin);
          plugin(app, ...options);
        } else ;
        return app;
      },
      mixin(mixin) {
        {
          if (!context.mixins.includes(mixin)) {
            context.mixins.push(mixin);
          }
        }
        return app;
      },
      component(name, component) {
        if (!component) {
          return context.components[name];
        }
        context.components[name] = component;
        return app;
      },
      directive(name, directive) {
        if (!directive) {
          return context.directives[name];
        }
        context.directives[name] = directive;
        return app;
      },
      mount(rootContainer, isHydrate, namespace) {
        if (!isMounted) {
          const vnode = app._ceVNode || createVNode(rootComponent, rootProps);
          vnode.appContext = context;
          if (namespace === true) {
            namespace = "svg";
          } else if (namespace === false) {
            namespace = void 0;
          }
          {
            render(vnode, rootContainer, namespace);
          }
          isMounted = true;
          app._container = rootContainer;
          rootContainer.__vue_app__ = app;
          return getComponentPublicInstance(vnode.component);
        }
      },
      onUnmount(cleanupFn) {
        pluginCleanupFns.push(cleanupFn);
      },
      unmount() {
        if (isMounted) {
          callWithAsyncErrorHandling(
            pluginCleanupFns,
            app._instance,
            16
          );
          render(null, app._container);
          delete app._container.__vue_app__;
        }
      },
      provide(key, value) {
        context.provides[key] = value;
        return app;
      },
      runWithContext(fn) {
        const lastApp = currentApp;
        currentApp = app;
        try {
          return fn();
        } finally {
          currentApp = lastApp;
        }
      }
    };
    return app;
  };
}
let currentApp = null;
const getModelModifiers = (props, modelName) => {
  return modelName === "modelValue" || modelName === "model-value" ? props.modelModifiers : props[`${modelName}Modifiers`] || props[`${camelize(modelName)}Modifiers`] || props[`${hyphenate(modelName)}Modifiers`];
};
function emit(instance, event, ...rawArgs) {
  if (instance.isUnmounted) return;
  const props = instance.vnode.props || EMPTY_OBJ;
  let args = rawArgs;
  const isModelListener2 = event.startsWith("update:");
  const modifiers = isModelListener2 && getModelModifiers(props, event.slice(7));
  if (modifiers) {
    if (modifiers.trim) {
      args = rawArgs.map((a) => isString(a) ? a.trim() : a);
    }
    if (modifiers.number) {
      args = rawArgs.map(looseToNumber);
    }
  }
  let handlerName;
  let handler = props[handlerName = toHandlerKey(event)] || // also try camelCase event handler (#2249)
  props[handlerName = toHandlerKey(camelize(event))];
  if (!handler && isModelListener2) {
    handler = props[handlerName = toHandlerKey(hyphenate(event))];
  }
  if (handler) {
    callWithAsyncErrorHandling(
      handler,
      instance,
      6,
      args
    );
  }
  const onceHandler = props[handlerName + `Once`];
  if (onceHandler) {
    if (!instance.emitted) {
      instance.emitted = {};
    } else if (instance.emitted[handlerName]) {
      return;
    }
    instance.emitted[handlerName] = true;
    callWithAsyncErrorHandling(
      onceHandler,
      instance,
      6,
      args
    );
  }
}
const mixinEmitsCache = /* @__PURE__ */ new WeakMap();
function normalizeEmitsOptions(comp, appContext, asMixin = false) {
  const cache = asMixin ? mixinEmitsCache : appContext.emitsCache;
  const cached = cache.get(comp);
  if (cached !== void 0) {
    return cached;
  }
  const raw = comp.emits;
  let normalized = {};
  let hasExtends = false;
  if (!isFunction(comp)) {
    const extendEmits = (raw2) => {
      const normalizedFromExtend = normalizeEmitsOptions(raw2, appContext, true);
      if (normalizedFromExtend) {
        hasExtends = true;
        extend(normalized, normalizedFromExtend);
      }
    };
    if (!asMixin && appContext.mixins.length) {
      appContext.mixins.forEach(extendEmits);
    }
    if (comp.extends) {
      extendEmits(comp.extends);
    }
    if (comp.mixins) {
      comp.mixins.forEach(extendEmits);
    }
  }
  if (!raw && !hasExtends) {
    if (isObject(comp)) {
      cache.set(comp, null);
    }
    return null;
  }
  if (isArray(raw)) {
    raw.forEach((key) => normalized[key] = null);
  } else {
    extend(normalized, raw);
  }
  if (isObject(comp)) {
    cache.set(comp, normalized);
  }
  return normalized;
}
function isEmitListener(options, key) {
  if (!options || !isOn(key)) {
    return false;
  }
  key = key.slice(2).replace(/Once$/, "");
  return hasOwn(options, key[0].toLowerCase() + key.slice(1)) || hasOwn(options, hyphenate(key)) || hasOwn(options, key);
}
function markAttrsAccessed() {
}
function renderComponentRoot(instance) {
  const {
    type: Component,
    vnode,
    proxy,
    withProxy,
    propsOptions: [propsOptions],
    slots,
    attrs,
    emit: emit2,
    render,
    renderCache,
    props,
    data,
    setupState,
    ctx,
    inheritAttrs
  } = instance;
  const prev = setCurrentRenderingInstance(instance);
  let result;
  let fallthroughAttrs;
  try {
    if (vnode.shapeFlag & 4) {
      const proxyToUse = withProxy || proxy;
      const thisProxy = false ? new Proxy(proxyToUse, {
        get(target, key, receiver) {
          warn$1(
            `Property '${String(
              key
            )}' was accessed via 'this'. Avoid using 'this' in templates.`
          );
          return Reflect.get(target, key, receiver);
        }
      }) : proxyToUse;
      result = normalizeVNode(
        render.call(
          thisProxy,
          proxyToUse,
          renderCache,
          false ? /* @__PURE__ */ shallowReadonly(props) : props,
          setupState,
          data,
          ctx
        )
      );
      fallthroughAttrs = attrs;
    } else {
      const render2 = Component;
      if (false) ;
      result = normalizeVNode(
        render2.length > 1 ? render2(
          false ? /* @__PURE__ */ shallowReadonly(props) : props,
          false ? {
            get attrs() {
              markAttrsAccessed();
              return /* @__PURE__ */ shallowReadonly(attrs);
            },
            slots,
            emit: emit2
          } : { attrs, slots, emit: emit2 }
        ) : render2(
          false ? /* @__PURE__ */ shallowReadonly(props) : props,
          null
        )
      );
      fallthroughAttrs = Component.props ? attrs : getFunctionalFallthrough(attrs);
    }
  } catch (err) {
    blockStack.length = 0;
    handleError(err, instance, 1);
    result = createVNode(Comment);
  }
  let root = result;
  if (fallthroughAttrs && inheritAttrs !== false) {
    const keys = Object.keys(fallthroughAttrs);
    const { shapeFlag } = root;
    if (keys.length) {
      if (shapeFlag & (1 | 6)) {
        if (propsOptions && keys.some(isModelListener)) {
          fallthroughAttrs = filterModelListeners(
            fallthroughAttrs,
            propsOptions
          );
        }
        root = cloneVNode(root, fallthroughAttrs, false, true);
      }
    }
  }
  if (vnode.dirs) {
    root = cloneVNode(root, null, false, true);
    root.dirs = root.dirs ? root.dirs.concat(vnode.dirs) : vnode.dirs;
  }
  if (vnode.transition) {
    setTransitionHooks(root, vnode.transition);
  }
  {
    result = root;
  }
  setCurrentRenderingInstance(prev);
  return result;
}
const getFunctionalFallthrough = (attrs) => {
  let res;
  for (const key in attrs) {
    if (key === "class" || key === "style" || isOn(key)) {
      (res || (res = {}))[key] = attrs[key];
    }
  }
  return res;
};
const filterModelListeners = (attrs, props) => {
  const res = {};
  for (const key in attrs) {
    if (!isModelListener(key) || !(key.slice(9) in props)) {
      res[key] = attrs[key];
    }
  }
  return res;
};
function shouldUpdateComponent(prevVNode, nextVNode, optimized) {
  const { props: prevProps, children: prevChildren, component } = prevVNode;
  const { props: nextProps, children: nextChildren, patchFlag } = nextVNode;
  const emits = component.emitsOptions;
  if (nextVNode.dirs || nextVNode.transition) {
    return true;
  }
  if (optimized && patchFlag >= 0) {
    if (patchFlag & 1024) {
      return true;
    }
    if (patchFlag & 16) {
      if (!prevProps) {
        return !!nextProps;
      }
      return hasPropsChanged(prevProps, nextProps, emits);
    } else if (patchFlag & 8) {
      const dynamicProps = nextVNode.dynamicProps;
      for (let i = 0; i < dynamicProps.length; i++) {
        const key = dynamicProps[i];
        if (hasPropValueChanged(nextProps, prevProps, key) && !isEmitListener(emits, key)) {
          return true;
        }
      }
    }
  } else {
    if (prevChildren || nextChildren) {
      if (!nextChildren || !nextChildren.$stable) {
        return true;
      }
    }
    if (prevProps === nextProps) {
      return false;
    }
    if (!prevProps) {
      return !!nextProps;
    }
    if (!nextProps) {
      return true;
    }
    return hasPropsChanged(prevProps, nextProps, emits);
  }
  return false;
}
function hasPropsChanged(prevProps, nextProps, emitsOptions) {
  const nextKeys = Object.keys(nextProps);
  if (nextKeys.length !== Object.keys(prevProps).length) {
    return true;
  }
  for (let i = 0; i < nextKeys.length; i++) {
    const key = nextKeys[i];
    if (hasPropValueChanged(nextProps, prevProps, key) && !isEmitListener(emitsOptions, key)) {
      return true;
    }
  }
  return false;
}
function hasPropValueChanged(nextProps, prevProps, key) {
  const nextProp = nextProps[key];
  const prevProp = prevProps[key];
  if (key === "style" && isObject(nextProp) && isObject(prevProp)) {
    return !looseEqual(nextProp, prevProp);
  }
  return nextProp !== prevProp;
}
function updateHOCHostEl({ vnode, parent }, el) {
  while (parent) {
    const root = parent.subTree;
    if (root.suspense && root.suspense.activeBranch === vnode) {
      root.el = vnode.el;
    }
    if (root === vnode) {
      (vnode = parent.vnode).el = el;
      parent = parent.parent;
    } else {
      break;
    }
  }
}
const internalObjectProto = {};
const createInternalObject = () => Object.create(internalObjectProto);
const isInternalObject = (obj) => Object.getPrototypeOf(obj) === internalObjectProto;
function initProps(instance, rawProps, isStateful, isSSR = false) {
  const props = {};
  const attrs = createInternalObject();
  instance.propsDefaults = /* @__PURE__ */ Object.create(null);
  setFullProps(instance, rawProps, props, attrs);
  for (const key in instance.propsOptions[0]) {
    if (!(key in props)) {
      props[key] = void 0;
    }
  }
  if (isStateful) {
    instance.props = isSSR ? props : /* @__PURE__ */ shallowReactive(props);
  } else {
    if (!instance.type.props) {
      instance.props = attrs;
    } else {
      instance.props = props;
    }
  }
  instance.attrs = attrs;
}
function updateProps(instance, rawProps, rawPrevProps, optimized) {
  const {
    props,
    attrs,
    vnode: { patchFlag }
  } = instance;
  const rawCurrentProps = /* @__PURE__ */ toRaw(props);
  const [options] = instance.propsOptions;
  let hasAttrsChanged = false;
  if (
    // always force full diff in dev
    // - #1942 if hmr is enabled with sfc component
    // - vite#872 non-sfc component used by sfc component
    (optimized || patchFlag > 0) && !(patchFlag & 16)
  ) {
    if (patchFlag & 8) {
      const propsToUpdate = instance.vnode.dynamicProps;
      for (let i = 0; i < propsToUpdate.length; i++) {
        let key = propsToUpdate[i];
        if (isEmitListener(instance.emitsOptions, key)) {
          continue;
        }
        const value = rawProps[key];
        if (options) {
          if (hasOwn(attrs, key)) {
            if (value !== attrs[key]) {
              attrs[key] = value;
              hasAttrsChanged = true;
            }
          } else {
            const camelizedKey = camelize(key);
            props[camelizedKey] = resolvePropValue(
              options,
              rawCurrentProps,
              camelizedKey,
              value,
              instance,
              false
            );
          }
        } else {
          if (value !== attrs[key]) {
            attrs[key] = value;
            hasAttrsChanged = true;
          }
        }
      }
    }
  } else {
    if (setFullProps(instance, rawProps, props, attrs)) {
      hasAttrsChanged = true;
    }
    let kebabKey;
    for (const key in rawCurrentProps) {
      if (!rawProps || // for camelCase
      !hasOwn(rawProps, key) && // it's possible the original props was passed in as kebab-case
      // and converted to camelCase (#955)
      ((kebabKey = hyphenate(key)) === key || !hasOwn(rawProps, kebabKey))) {
        if (options) {
          if (rawPrevProps && // for camelCase
          (rawPrevProps[key] !== void 0 || // for kebab-case
          rawPrevProps[kebabKey] !== void 0)) {
            props[key] = resolvePropValue(
              options,
              rawCurrentProps,
              key,
              void 0,
              instance,
              true
            );
          }
        } else {
          delete props[key];
        }
      }
    }
    if (attrs !== rawCurrentProps) {
      for (const key in attrs) {
        if (!rawProps || !hasOwn(rawProps, key) && true) {
          delete attrs[key];
          hasAttrsChanged = true;
        }
      }
    }
  }
  if (hasAttrsChanged) {
    trigger(instance.attrs, "set", "");
  }
}
function setFullProps(instance, rawProps, props, attrs) {
  const [options, needCastKeys] = instance.propsOptions;
  let hasAttrsChanged = false;
  let rawCastValues;
  if (rawProps) {
    for (let key in rawProps) {
      if (isReservedProp(key)) {
        continue;
      }
      const value = rawProps[key];
      let camelKey;
      if (options && hasOwn(options, camelKey = camelize(key))) {
        if (!needCastKeys || !needCastKeys.includes(camelKey)) {
          props[camelKey] = value;
        } else {
          (rawCastValues || (rawCastValues = {}))[camelKey] = value;
        }
      } else if (!isEmitListener(instance.emitsOptions, key)) {
        if (!(key in attrs) || value !== attrs[key]) {
          attrs[key] = value;
          hasAttrsChanged = true;
        }
      }
    }
  }
  if (needCastKeys) {
    const rawCurrentProps = /* @__PURE__ */ toRaw(props);
    const castValues = rawCastValues || EMPTY_OBJ;
    for (let i = 0; i < needCastKeys.length; i++) {
      const key = needCastKeys[i];
      props[key] = resolvePropValue(
        options,
        rawCurrentProps,
        key,
        castValues[key],
        instance,
        !hasOwn(castValues, key)
      );
    }
  }
  return hasAttrsChanged;
}
function resolvePropValue(options, props, key, value, instance, isAbsent) {
  const opt = options[key];
  if (opt != null) {
    const hasDefault = hasOwn(opt, "default");
    if (hasDefault && value === void 0) {
      const defaultValue = opt.default;
      if (opt.type !== Function && !opt.skipFactory && isFunction(defaultValue)) {
        const { propsDefaults } = instance;
        if (key in propsDefaults) {
          value = propsDefaults[key];
        } else {
          const reset = setCurrentInstance(instance);
          value = propsDefaults[key] = defaultValue.call(
            null,
            props
          );
          reset();
        }
      } else {
        value = defaultValue;
      }
      if (instance.ce) {
        instance.ce._setProp(key, value);
      }
    }
    if (opt[
      0
      /* shouldCast */
    ]) {
      if (isAbsent && !hasDefault) {
        value = false;
      } else if (opt[
        1
        /* shouldCastTrue */
      ] && (value === "" || value === hyphenate(key))) {
        value = true;
      }
    }
  }
  return value;
}
const mixinPropsCache = /* @__PURE__ */ new WeakMap();
function normalizePropsOptions(comp, appContext, asMixin = false) {
  const cache = asMixin ? mixinPropsCache : appContext.propsCache;
  const cached = cache.get(comp);
  if (cached) {
    return cached;
  }
  const raw = comp.props;
  const normalized = {};
  const needCastKeys = [];
  let hasExtends = false;
  if (!isFunction(comp)) {
    const extendProps = (raw2) => {
      hasExtends = true;
      const [props, keys] = normalizePropsOptions(raw2, appContext, true);
      extend(normalized, props);
      if (keys) needCastKeys.push(...keys);
    };
    if (!asMixin && appContext.mixins.length) {
      appContext.mixins.forEach(extendProps);
    }
    if (comp.extends) {
      extendProps(comp.extends);
    }
    if (comp.mixins) {
      comp.mixins.forEach(extendProps);
    }
  }
  if (!raw && !hasExtends) {
    if (isObject(comp)) {
      cache.set(comp, EMPTY_ARR);
    }
    return EMPTY_ARR;
  }
  if (isArray(raw)) {
    for (let i = 0; i < raw.length; i++) {
      const normalizedKey = camelize(raw[i]);
      if (validatePropName(normalizedKey)) {
        normalized[normalizedKey] = EMPTY_OBJ;
      }
    }
  } else if (raw) {
    for (const key in raw) {
      const normalizedKey = camelize(key);
      if (validatePropName(normalizedKey)) {
        const opt = raw[key];
        const prop = normalized[normalizedKey] = isArray(opt) || isFunction(opt) ? { type: opt } : extend({}, opt);
        const propType = prop.type;
        let shouldCast = false;
        let shouldCastTrue = true;
        if (isArray(propType)) {
          for (let index = 0; index < propType.length; ++index) {
            const type = propType[index];
            const typeName = isFunction(type) && type.name;
            if (typeName === "Boolean") {
              shouldCast = true;
              break;
            } else if (typeName === "String") {
              shouldCastTrue = false;
            }
          }
        } else {
          shouldCast = isFunction(propType) && propType.name === "Boolean";
        }
        prop[
          0
          /* shouldCast */
        ] = shouldCast;
        prop[
          1
          /* shouldCastTrue */
        ] = shouldCastTrue;
        if (shouldCast || hasOwn(prop, "default")) {
          needCastKeys.push(normalizedKey);
        }
      }
    }
  }
  const res = [normalized, needCastKeys];
  if (isObject(comp)) {
    cache.set(comp, res);
  }
  return res;
}
function validatePropName(key) {
  if (key[0] !== "$" && !isReservedProp(key)) {
    return true;
  }
  return false;
}
const isInternalKey = (key) => key === "_" || key === "_ctx" || key === "$stable";
const normalizeSlotValue = (value) => isArray(value) ? value.map(normalizeVNode) : [normalizeVNode(value)];
const normalizeSlot = (key, rawSlot, ctx) => {
  if (rawSlot._n) {
    return rawSlot;
  }
  const normalized = withCtx((...args) => {
    if (false) ;
    return normalizeSlotValue(rawSlot(...args));
  }, ctx);
  normalized._c = false;
  return normalized;
};
const normalizeObjectSlots = (rawSlots, slots, instance) => {
  const ctx = rawSlots._ctx;
  for (const key in rawSlots) {
    if (isInternalKey(key)) continue;
    const value = rawSlots[key];
    if (isFunction(value)) {
      slots[key] = normalizeSlot(key, value, ctx);
    } else if (value != null) {
      const normalized = normalizeSlotValue(value);
      slots[key] = () => normalized;
    }
  }
};
const normalizeVNodeSlots = (instance, children) => {
  const normalized = normalizeSlotValue(children);
  instance.slots.default = () => normalized;
};
const assignSlots = (slots, children, optimized) => {
  for (const key in children) {
    if (optimized || !isInternalKey(key)) {
      slots[key] = children[key];
    }
  }
};
const initSlots = (instance, children, optimized) => {
  const slots = instance.slots = createInternalObject();
  if (instance.vnode.shapeFlag & 32) {
    const type = children._;
    if (type) {
      assignSlots(slots, children, optimized);
      if (optimized) {
        def(slots, "_", type, true);
      }
    } else {
      normalizeObjectSlots(children, slots);
    }
  } else if (children) {
    normalizeVNodeSlots(instance, children);
  }
};
const updateSlots = (instance, children, optimized) => {
  const { vnode, slots } = instance;
  let needDeletionCheck = true;
  let deletionComparisonTarget = EMPTY_OBJ;
  if (vnode.shapeFlag & 32) {
    const type = children._;
    if (type) {
      if (optimized && type === 1) {
        needDeletionCheck = false;
      } else {
        assignSlots(slots, children, optimized);
      }
    } else {
      needDeletionCheck = !children.$stable;
      normalizeObjectSlots(children, slots);
    }
    deletionComparisonTarget = children;
  } else if (children) {
    normalizeVNodeSlots(instance, children);
    deletionComparisonTarget = { default: 1 };
  }
  if (needDeletionCheck) {
    for (const key in slots) {
      if (!isInternalKey(key) && deletionComparisonTarget[key] == null) {
        delete slots[key];
      }
    }
  }
};
const queuePostRenderEffect = queueEffectWithSuspense;
function createRenderer(options) {
  return baseCreateRenderer(options);
}
function baseCreateRenderer(options, createHydrationFns) {
  const target = getGlobalThis();
  target.__VUE__ = true;
  const {
    insert: hostInsert,
    remove: hostRemove,
    patchProp: hostPatchProp,
    createElement: hostCreateElement,
    createText: hostCreateText,
    createComment: hostCreateComment,
    setText: hostSetText,
    setElementText: hostSetElementText,
    parentNode: hostParentNode,
    nextSibling: hostNextSibling,
    setScopeId: hostSetScopeId = NOOP,
    insertStaticContent: hostInsertStaticContent
  } = options;
  const patch = (n1, n2, container, anchor = null, parentComponent = null, parentSuspense = null, namespace = void 0, slotScopeIds = null, optimized = !!n2.dynamicChildren) => {
    if (n1 === n2) {
      return;
    }
    if (n1 && !isSameVNodeType(n1, n2)) {
      anchor = getNextHostNode(n1);
      unmount(n1, parentComponent, parentSuspense, true);
      n1 = null;
    }
    if (n2.patchFlag === -2) {
      optimized = false;
      n2.dynamicChildren = null;
    }
    const { type, ref: ref3, shapeFlag } = n2;
    switch (type) {
      case Text:
        processText(n1, n2, container, anchor);
        break;
      case Comment:
        processCommentNode(n1, n2, container, anchor);
        break;
      case Static:
        if (n1 == null) {
          mountStaticNode(n2, container, anchor, namespace);
        }
        break;
      case Fragment:
        processFragment(
          n1,
          n2,
          container,
          anchor,
          parentComponent,
          parentSuspense,
          namespace,
          slotScopeIds,
          optimized
        );
        break;
      default:
        if (shapeFlag & 1) {
          processElement(
            n1,
            n2,
            container,
            anchor,
            parentComponent,
            parentSuspense,
            namespace,
            slotScopeIds,
            optimized
          );
        } else if (shapeFlag & 6) {
          processComponent(
            n1,
            n2,
            container,
            anchor,
            parentComponent,
            parentSuspense,
            namespace,
            slotScopeIds,
            optimized
          );
        } else if (shapeFlag & 64) {
          type.process(
            n1,
            n2,
            container,
            anchor,
            parentComponent,
            parentSuspense,
            namespace,
            slotScopeIds,
            optimized,
            internals
          );
        } else if (shapeFlag & 128) {
          type.process(
            n1,
            n2,
            container,
            anchor,
            parentComponent,
            parentSuspense,
            namespace,
            slotScopeIds,
            optimized,
            internals
          );
        } else ;
    }
    if (ref3 != null && parentComponent) {
      setRef(ref3, n1 && n1.ref, parentSuspense, n2 || n1, !n2);
    } else if (ref3 == null && n1 && n1.ref != null) {
      setRef(n1.ref, null, parentSuspense, n1, true);
    }
  };
  const processText = (n1, n2, container, anchor) => {
    if (n1 == null) {
      hostInsert(
        n2.el = hostCreateText(n2.children),
        container,
        anchor
      );
    } else {
      const el = n2.el = n1.el;
      if (n2.children !== n1.children) {
        hostSetText(el, n2.children);
      }
    }
  };
  const processCommentNode = (n1, n2, container, anchor) => {
    if (n1 == null) {
      hostInsert(
        n2.el = hostCreateComment(n2.children || ""),
        container,
        anchor
      );
    } else {
      n2.el = n1.el;
    }
  };
  const mountStaticNode = (n2, container, anchor, namespace) => {
    [n2.el, n2.anchor] = hostInsertStaticContent(
      n2.children,
      container,
      anchor,
      namespace,
      n2.el,
      n2.anchor
    );
  };
  const moveStaticNode = ({ el, anchor }, container, nextSibling) => {
    let next;
    while (el && el !== anchor) {
      next = hostNextSibling(el);
      hostInsert(el, container, nextSibling);
      el = next;
    }
    hostInsert(anchor, container, nextSibling);
  };
  const removeStaticNode = ({ el, anchor }) => {
    let next;
    while (el && el !== anchor) {
      next = hostNextSibling(el);
      hostRemove(el);
      el = next;
    }
    hostRemove(anchor);
  };
  const processElement = (n1, n2, container, anchor, parentComponent, parentSuspense, namespace, slotScopeIds, optimized) => {
    if (n2.type === "svg") {
      namespace = "svg";
    } else if (n2.type === "math") {
      namespace = "mathml";
    }
    if (n1 == null) {
      mountElement(
        n2,
        container,
        anchor,
        parentComponent,
        parentSuspense,
        namespace,
        slotScopeIds,
        optimized
      );
    } else {
      const customElement = n1.el && n1.el._isVueCE ? n1.el : null;
      try {
        if (customElement) {
          customElement._beginPatch();
        }
        patchElement(
          n1,
          n2,
          parentComponent,
          parentSuspense,
          namespace,
          slotScopeIds,
          optimized
        );
      } finally {
        if (customElement) {
          customElement._endPatch();
        }
      }
    }
  };
  const mountElement = (vnode, container, anchor, parentComponent, parentSuspense, namespace, slotScopeIds, optimized) => {
    let el;
    let vnodeHook;
    const { props, shapeFlag, transition, dirs } = vnode;
    el = vnode.el = hostCreateElement(
      vnode.type,
      namespace,
      props && props.is,
      props
    );
    if (shapeFlag & 8) {
      hostSetElementText(el, vnode.children);
    } else if (shapeFlag & 16) {
      mountChildren(
        vnode.children,
        el,
        null,
        parentComponent,
        parentSuspense,
        resolveChildrenNamespace(vnode, namespace),
        slotScopeIds,
        optimized
      );
    }
    if (dirs) {
      invokeDirectiveHook(vnode, null, parentComponent, "created");
    }
    setScopeId(el, vnode, vnode.scopeId, slotScopeIds, parentComponent);
    if (props) {
      for (const key in props) {
        if (key !== "value" && !isReservedProp(key)) {
          hostPatchProp(el, key, null, props[key], namespace, parentComponent);
        }
      }
      if ("value" in props) {
        hostPatchProp(el, "value", null, props.value, namespace);
      }
      if (vnodeHook = props.onVnodeBeforeMount) {
        invokeVNodeHook(vnodeHook, parentComponent, vnode);
      }
    }
    if (dirs) {
      invokeDirectiveHook(vnode, null, parentComponent, "beforeMount");
    }
    const needCallTransitionHooks = needTransition(parentSuspense, transition);
    if (needCallTransitionHooks) {
      transition.beforeEnter(el);
    }
    hostInsert(el, container, anchor);
    if ((vnodeHook = props && props.onVnodeMounted) || needCallTransitionHooks || dirs) {
      queuePostRenderEffect(() => {
        vnodeHook && invokeVNodeHook(vnodeHook, parentComponent, vnode);
        needCallTransitionHooks && transition.enter(el);
        dirs && invokeDirectiveHook(vnode, null, parentComponent, "mounted");
      }, parentSuspense);
    }
  };
  const setScopeId = (el, vnode, scopeId, slotScopeIds, parentComponent) => {
    if (scopeId) {
      hostSetScopeId(el, scopeId);
    }
    if (slotScopeIds) {
      for (let i = 0; i < slotScopeIds.length; i++) {
        hostSetScopeId(el, slotScopeIds[i]);
      }
    }
    if (parentComponent) {
      let subTree = parentComponent.subTree;
      if (vnode === subTree || isSuspense(subTree.type) && (subTree.ssContent === vnode || subTree.ssFallback === vnode)) {
        const parentVNode = parentComponent.vnode;
        setScopeId(
          el,
          parentVNode,
          parentVNode.scopeId,
          parentVNode.slotScopeIds,
          parentComponent.parent
        );
      }
    }
  };
  const mountChildren = (children, container, anchor, parentComponent, parentSuspense, namespace, slotScopeIds, optimized, start = 0) => {
    for (let i = start; i < children.length; i++) {
      const child = children[i] = optimized ? cloneIfMounted(children[i]) : normalizeVNode(children[i]);
      patch(
        null,
        child,
        container,
        anchor,
        parentComponent,
        parentSuspense,
        namespace,
        slotScopeIds,
        optimized
      );
    }
  };
  const patchElement = (n1, n2, parentComponent, parentSuspense, namespace, slotScopeIds, optimized) => {
    const el = n2.el = n1.el;
    let { patchFlag, dynamicChildren, dirs } = n2;
    patchFlag |= n1.patchFlag & 16;
    const oldProps = n1.props || EMPTY_OBJ;
    const newProps = n2.props || EMPTY_OBJ;
    let vnodeHook;
    parentComponent && toggleRecurse(parentComponent, false);
    if (vnodeHook = newProps.onVnodeBeforeUpdate) {
      invokeVNodeHook(vnodeHook, parentComponent, n2, n1);
    }
    if (dirs) {
      invokeDirectiveHook(n2, n1, parentComponent, "beforeUpdate");
    }
    parentComponent && toggleRecurse(parentComponent, true);
    if (oldProps.innerHTML && newProps.innerHTML == null || oldProps.textContent && newProps.textContent == null) {
      hostSetElementText(el, "");
    }
    if (dynamicChildren) {
      patchBlockChildren(
        n1.dynamicChildren,
        dynamicChildren,
        el,
        parentComponent,
        parentSuspense,
        resolveChildrenNamespace(n2, namespace),
        slotScopeIds
      );
    } else if (!optimized) {
      patchChildren(
        n1,
        n2,
        el,
        null,
        parentComponent,
        parentSuspense,
        resolveChildrenNamespace(n2, namespace),
        slotScopeIds,
        false
      );
    }
    if (patchFlag > 0) {
      if (patchFlag & 16) {
        patchProps(el, oldProps, newProps, parentComponent, namespace);
      } else {
        if (patchFlag & 2) {
          if (oldProps.class !== newProps.class) {
            hostPatchProp(el, "class", null, newProps.class, namespace);
          }
        }
        if (patchFlag & 4) {
          hostPatchProp(el, "style", oldProps.style, newProps.style, namespace);
        }
        if (patchFlag & 8) {
          const propsToUpdate = n2.dynamicProps;
          for (let i = 0; i < propsToUpdate.length; i++) {
            const key = propsToUpdate[i];
            const prev = oldProps[key];
            const next = newProps[key];
            if (next !== prev || key === "value") {
              hostPatchProp(el, key, prev, next, namespace, parentComponent);
            }
          }
        }
      }
      if (patchFlag & 1) {
        if (n1.children !== n2.children) {
          hostSetElementText(el, n2.children);
        }
      }
    } else if (!optimized && dynamicChildren == null) {
      patchProps(el, oldProps, newProps, parentComponent, namespace);
    }
    if ((vnodeHook = newProps.onVnodeUpdated) || dirs) {
      queuePostRenderEffect(() => {
        vnodeHook && invokeVNodeHook(vnodeHook, parentComponent, n2, n1);
        dirs && invokeDirectiveHook(n2, n1, parentComponent, "updated");
      }, parentSuspense);
    }
  };
  const patchBlockChildren = (oldChildren, newChildren, fallbackContainer, parentComponent, parentSuspense, namespace, slotScopeIds) => {
    for (let i = 0; i < newChildren.length; i++) {
      const oldVNode = oldChildren[i];
      const newVNode = newChildren[i];
      const container = (
        // oldVNode may be an errored async setup() component inside Suspense
        // which will not have a mounted element
        oldVNode.el && // - In the case of a Fragment, we need to provide the actual parent
        // of the Fragment itself so it can move its children.
        (oldVNode.type === Fragment || // - In the case of different nodes, there is going to be a replacement
        // which also requires the correct parent container
        !isSameVNodeType(oldVNode, newVNode) || // - In the case of a component, it could contain anything.
        oldVNode.shapeFlag & (6 | 64 | 128)) ? hostParentNode(oldVNode.el) : (
          // In other cases, the parent container is not actually used so we
          // just pass the block element here to avoid a DOM parentNode call.
          fallbackContainer
        )
      );
      patch(
        oldVNode,
        newVNode,
        container,
        null,
        parentComponent,
        parentSuspense,
        namespace,
        slotScopeIds,
        true
      );
    }
  };
  const patchProps = (el, oldProps, newProps, parentComponent, namespace) => {
    if (oldProps !== newProps) {
      if (oldProps !== EMPTY_OBJ) {
        for (const key in oldProps) {
          if (!isReservedProp(key) && !(key in newProps)) {
            hostPatchProp(
              el,
              key,
              oldProps[key],
              null,
              namespace,
              parentComponent
            );
          }
        }
      }
      for (const key in newProps) {
        if (isReservedProp(key)) continue;
        const next = newProps[key];
        const prev = oldProps[key];
        if (next !== prev && key !== "value") {
          hostPatchProp(el, key, prev, next, namespace, parentComponent);
        }
      }
      if ("value" in newProps) {
        hostPatchProp(el, "value", oldProps.value, newProps.value, namespace);
      }
    }
  };
  const processFragment = (n1, n2, container, anchor, parentComponent, parentSuspense, namespace, slotScopeIds, optimized) => {
    const fragmentStartAnchor = n2.el = n1 ? n1.el : hostCreateText("");
    const fragmentEndAnchor = n2.anchor = n1 ? n1.anchor : hostCreateText("");
    let { patchFlag, dynamicChildren, slotScopeIds: fragmentSlotScopeIds } = n2;
    if (fragmentSlotScopeIds) {
      slotScopeIds = slotScopeIds ? slotScopeIds.concat(fragmentSlotScopeIds) : fragmentSlotScopeIds;
    }
    if (n1 == null) {
      hostInsert(fragmentStartAnchor, container, anchor);
      hostInsert(fragmentEndAnchor, container, anchor);
      mountChildren(
        // #10007
        // such fragment like `<></>` will be compiled into
        // a fragment which doesn't have a children.
        // In this case fallback to an empty array
        n2.children || [],
        container,
        fragmentEndAnchor,
        parentComponent,
        parentSuspense,
        namespace,
        slotScopeIds,
        optimized
      );
    } else {
      if (patchFlag > 0 && patchFlag & 64 && dynamicChildren && // #2715 the previous fragment could've been a BAILed one as a result
      // of renderSlot() with no valid children
      n1.dynamicChildren && n1.dynamicChildren.length === dynamicChildren.length) {
        patchBlockChildren(
          n1.dynamicChildren,
          dynamicChildren,
          container,
          parentComponent,
          parentSuspense,
          namespace,
          slotScopeIds
        );
        if (
          // #2080 if the stable fragment has a key, it's a <template v-for> that may
          //  get moved around. Make sure all root level vnodes inherit el.
          // #2134 or if it's a component root, it may also get moved around
          // as the component is being moved.
          n2.key != null || parentComponent && n2 === parentComponent.subTree
        ) {
          traverseStaticChildren(
            n1,
            n2,
            true
            /* shallow */
          );
        }
      } else {
        patchChildren(
          n1,
          n2,
          container,
          fragmentEndAnchor,
          parentComponent,
          parentSuspense,
          namespace,
          slotScopeIds,
          optimized
        );
      }
    }
  };
  const processComponent = (n1, n2, container, anchor, parentComponent, parentSuspense, namespace, slotScopeIds, optimized) => {
    n2.slotScopeIds = slotScopeIds;
    if (n1 == null) {
      if (n2.shapeFlag & 512) {
        parentComponent.ctx.activate(
          n2,
          container,
          anchor,
          namespace,
          optimized
        );
      } else {
        mountComponent(
          n2,
          container,
          anchor,
          parentComponent,
          parentSuspense,
          namespace,
          optimized
        );
      }
    } else {
      updateComponent(n1, n2, optimized);
    }
  };
  const mountComponent = (initialVNode, container, anchor, parentComponent, parentSuspense, namespace, optimized) => {
    const instance = initialVNode.component = createComponentInstance(
      initialVNode,
      parentComponent,
      parentSuspense
    );
    if (isKeepAlive(initialVNode)) {
      instance.ctx.renderer = internals;
    }
    {
      setupComponent(instance, false, optimized);
    }
    if (instance.asyncDep) {
      parentSuspense && parentSuspense.registerDep(instance, setupRenderEffect, optimized);
      if (!initialVNode.el) {
        const placeholder = instance.subTree = createVNode(Comment);
        processCommentNode(null, placeholder, container, anchor);
        initialVNode.placeholder = placeholder.el;
      }
    } else {
      setupRenderEffect(
        instance,
        initialVNode,
        container,
        anchor,
        parentSuspense,
        namespace,
        optimized
      );
    }
  };
  const updateComponent = (n1, n2, optimized) => {
    const instance = n2.component = n1.component;
    if (shouldUpdateComponent(n1, n2, optimized)) {
      if (instance.asyncDep && !instance.asyncResolved) {
        updateComponentPreRender(instance, n2, optimized);
        return;
      } else {
        instance.next = n2;
        instance.update();
      }
    } else {
      n2.el = n1.el;
      instance.vnode = n2;
    }
  };
  const setupRenderEffect = (instance, initialVNode, container, anchor, parentSuspense, namespace, optimized) => {
    const componentUpdateFn = () => {
      if (!instance.isMounted) {
        let vnodeHook;
        const { el, props } = initialVNode;
        const { bm, m, parent, root, type } = instance;
        const isAsyncWrapperVNode = isAsyncWrapper(initialVNode);
        toggleRecurse(instance, false);
        if (bm) {
          invokeArrayFns(bm);
        }
        if (!isAsyncWrapperVNode && (vnodeHook = props && props.onVnodeBeforeMount)) {
          invokeVNodeHook(vnodeHook, parent, initialVNode);
        }
        toggleRecurse(instance, true);
        {
          if (root.ce && root.ce._hasShadowRoot()) {
            root.ce._injectChildStyle(type);
          }
          const subTree = instance.subTree = renderComponentRoot(instance);
          patch(
            null,
            subTree,
            container,
            anchor,
            instance,
            parentSuspense,
            namespace
          );
          initialVNode.el = subTree.el;
        }
        if (m) {
          queuePostRenderEffect(m, parentSuspense);
        }
        if (!isAsyncWrapperVNode && (vnodeHook = props && props.onVnodeMounted)) {
          const scopedInitialVNode = initialVNode;
          queuePostRenderEffect(
            () => invokeVNodeHook(vnodeHook, parent, scopedInitialVNode),
            parentSuspense
          );
        }
        if (initialVNode.shapeFlag & 256 || parent && isAsyncWrapper(parent.vnode) && parent.vnode.shapeFlag & 256) {
          instance.a && queuePostRenderEffect(instance.a, parentSuspense);
        }
        instance.isMounted = true;
        initialVNode = container = anchor = null;
      } else {
        let { next, bu, u, parent, vnode } = instance;
        {
          const nonHydratedAsyncRoot = locateNonHydratedAsyncRoot(instance);
          if (nonHydratedAsyncRoot) {
            if (next) {
              next.el = vnode.el;
              updateComponentPreRender(instance, next, optimized);
            }
            nonHydratedAsyncRoot.asyncDep.then(() => {
              queuePostRenderEffect(() => {
                if (!instance.isUnmounted) update();
              }, parentSuspense);
            });
            return;
          }
        }
        let originNext = next;
        let vnodeHook;
        toggleRecurse(instance, false);
        if (next) {
          next.el = vnode.el;
          updateComponentPreRender(instance, next, optimized);
        } else {
          next = vnode;
        }
        if (bu) {
          invokeArrayFns(bu);
        }
        if (vnodeHook = next.props && next.props.onVnodeBeforeUpdate) {
          invokeVNodeHook(vnodeHook, parent, next, vnode);
        }
        toggleRecurse(instance, true);
        const nextTree = renderComponentRoot(instance);
        const prevTree = instance.subTree;
        instance.subTree = nextTree;
        patch(
          prevTree,
          nextTree,
          // parent may have changed if it's in a teleport
          hostParentNode(prevTree.el),
          // anchor may have changed if it's in a fragment
          getNextHostNode(prevTree),
          instance,
          parentSuspense,
          namespace
        );
        next.el = nextTree.el;
        if (originNext === null) {
          updateHOCHostEl(instance, nextTree.el);
        }
        if (u) {
          queuePostRenderEffect(u, parentSuspense);
        }
        if (vnodeHook = next.props && next.props.onVnodeUpdated) {
          queuePostRenderEffect(
            () => invokeVNodeHook(vnodeHook, parent, next, vnode),
            parentSuspense
          );
        }
      }
    };
    instance.scope.on();
    const effect2 = instance.effect = new ReactiveEffect(componentUpdateFn);
    instance.scope.off();
    const update = instance.update = effect2.run.bind(effect2);
    const job = instance.job = effect2.runIfDirty.bind(effect2);
    job.i = instance;
    job.id = instance.uid;
    effect2.scheduler = () => queueJob(job);
    toggleRecurse(instance, true);
    update();
  };
  const updateComponentPreRender = (instance, nextVNode, optimized) => {
    nextVNode.component = instance;
    const prevProps = instance.vnode.props;
    instance.vnode = nextVNode;
    instance.next = null;
    updateProps(instance, nextVNode.props, prevProps, optimized);
    updateSlots(instance, nextVNode.children, optimized);
    pauseTracking();
    flushPreFlushCbs(instance);
    resetTracking();
  };
  const patchChildren = (n1, n2, container, anchor, parentComponent, parentSuspense, namespace, slotScopeIds, optimized = false) => {
    const c1 = n1 && n1.children;
    const prevShapeFlag = n1 ? n1.shapeFlag : 0;
    const c2 = n2.children;
    const { patchFlag, shapeFlag } = n2;
    if (patchFlag > 0) {
      if (patchFlag & 128) {
        patchKeyedChildren(
          c1,
          c2,
          container,
          anchor,
          parentComponent,
          parentSuspense,
          namespace,
          slotScopeIds,
          optimized
        );
        return;
      } else if (patchFlag & 256) {
        patchUnkeyedChildren(
          c1,
          c2,
          container,
          anchor,
          parentComponent,
          parentSuspense,
          namespace,
          slotScopeIds,
          optimized
        );
        return;
      }
    }
    if (shapeFlag & 8) {
      if (prevShapeFlag & 16) {
        unmountChildren(c1, parentComponent, parentSuspense);
      }
      if (c2 !== c1) {
        hostSetElementText(container, c2);
      }
    } else {
      if (prevShapeFlag & 16) {
        if (shapeFlag & 16) {
          patchKeyedChildren(
            c1,
            c2,
            container,
            anchor,
            parentComponent,
            parentSuspense,
            namespace,
            slotScopeIds,
            optimized
          );
        } else {
          unmountChildren(c1, parentComponent, parentSuspense, true);
        }
      } else {
        if (prevShapeFlag & 8) {
          hostSetElementText(container, "");
        }
        if (shapeFlag & 16) {
          mountChildren(
            c2,
            container,
            anchor,
            parentComponent,
            parentSuspense,
            namespace,
            slotScopeIds,
            optimized
          );
        }
      }
    }
  };
  const patchUnkeyedChildren = (c1, c2, container, anchor, parentComponent, parentSuspense, namespace, slotScopeIds, optimized) => {
    c1 = c1 || EMPTY_ARR;
    c2 = c2 || EMPTY_ARR;
    const oldLength = c1.length;
    const newLength = c2.length;
    const commonLength = Math.min(oldLength, newLength);
    let i;
    for (i = 0; i < commonLength; i++) {
      const nextChild = c2[i] = optimized ? cloneIfMounted(c2[i]) : normalizeVNode(c2[i]);
      patch(
        c1[i],
        nextChild,
        container,
        null,
        parentComponent,
        parentSuspense,
        namespace,
        slotScopeIds,
        optimized
      );
    }
    if (oldLength > newLength) {
      unmountChildren(
        c1,
        parentComponent,
        parentSuspense,
        true,
        false,
        commonLength
      );
    } else {
      mountChildren(
        c2,
        container,
        anchor,
        parentComponent,
        parentSuspense,
        namespace,
        slotScopeIds,
        optimized,
        commonLength
      );
    }
  };
  const patchKeyedChildren = (c1, c2, container, parentAnchor, parentComponent, parentSuspense, namespace, slotScopeIds, optimized) => {
    let i = 0;
    const l2 = c2.length;
    let e1 = c1.length - 1;
    let e2 = l2 - 1;
    while (i <= e1 && i <= e2) {
      const n1 = c1[i];
      const n2 = c2[i] = optimized ? cloneIfMounted(c2[i]) : normalizeVNode(c2[i]);
      if (isSameVNodeType(n1, n2)) {
        patch(
          n1,
          n2,
          container,
          null,
          parentComponent,
          parentSuspense,
          namespace,
          slotScopeIds,
          optimized
        );
      } else {
        break;
      }
      i++;
    }
    while (i <= e1 && i <= e2) {
      const n1 = c1[e1];
      const n2 = c2[e2] = optimized ? cloneIfMounted(c2[e2]) : normalizeVNode(c2[e2]);
      if (isSameVNodeType(n1, n2)) {
        patch(
          n1,
          n2,
          container,
          null,
          parentComponent,
          parentSuspense,
          namespace,
          slotScopeIds,
          optimized
        );
      } else {
        break;
      }
      e1--;
      e2--;
    }
    if (i > e1) {
      if (i <= e2) {
        const nextPos = e2 + 1;
        const anchor = nextPos < l2 ? c2[nextPos].el : parentAnchor;
        while (i <= e2) {
          patch(
            null,
            c2[i] = optimized ? cloneIfMounted(c2[i]) : normalizeVNode(c2[i]),
            container,
            anchor,
            parentComponent,
            parentSuspense,
            namespace,
            slotScopeIds,
            optimized
          );
          i++;
        }
      }
    } else if (i > e2) {
      while (i <= e1) {
        unmount(c1[i], parentComponent, parentSuspense, true);
        i++;
      }
    } else {
      const s1 = i;
      const s2 = i;
      const keyToNewIndexMap = /* @__PURE__ */ new Map();
      for (i = s2; i <= e2; i++) {
        const nextChild = c2[i] = optimized ? cloneIfMounted(c2[i]) : normalizeVNode(c2[i]);
        if (nextChild.key != null) {
          keyToNewIndexMap.set(nextChild.key, i);
        }
      }
      let j;
      let patched = 0;
      const toBePatched = e2 - s2 + 1;
      let moved = false;
      let maxNewIndexSoFar = 0;
      const newIndexToOldIndexMap = new Array(toBePatched);
      for (i = 0; i < toBePatched; i++) newIndexToOldIndexMap[i] = 0;
      for (i = s1; i <= e1; i++) {
        const prevChild = c1[i];
        if (patched >= toBePatched) {
          unmount(prevChild, parentComponent, parentSuspense, true);
          continue;
        }
        let newIndex;
        if (prevChild.key != null) {
          newIndex = keyToNewIndexMap.get(prevChild.key);
        } else {
          for (j = s2; j <= e2; j++) {
            if (newIndexToOldIndexMap[j - s2] === 0 && isSameVNodeType(prevChild, c2[j])) {
              newIndex = j;
              break;
            }
          }
        }
        if (newIndex === void 0) {
          unmount(prevChild, parentComponent, parentSuspense, true);
        } else {
          newIndexToOldIndexMap[newIndex - s2] = i + 1;
          if (newIndex >= maxNewIndexSoFar) {
            maxNewIndexSoFar = newIndex;
          } else {
            moved = true;
          }
          patch(
            prevChild,
            c2[newIndex],
            container,
            null,
            parentComponent,
            parentSuspense,
            namespace,
            slotScopeIds,
            optimized
          );
          patched++;
        }
      }
      const increasingNewIndexSequence = moved ? getSequence(newIndexToOldIndexMap) : EMPTY_ARR;
      j = increasingNewIndexSequence.length - 1;
      for (i = toBePatched - 1; i >= 0; i--) {
        const nextIndex = s2 + i;
        const nextChild = c2[nextIndex];
        const anchorVNode = c2[nextIndex + 1];
        const anchor = nextIndex + 1 < l2 ? (
          // #13559, #14173 fallback to el placeholder for unresolved async component
          anchorVNode.el || resolveAsyncComponentPlaceholder(anchorVNode)
        ) : parentAnchor;
        if (newIndexToOldIndexMap[i] === 0) {
          patch(
            null,
            nextChild,
            container,
            anchor,
            parentComponent,
            parentSuspense,
            namespace,
            slotScopeIds,
            optimized
          );
        } else if (moved) {
          if (j < 0 || i !== increasingNewIndexSequence[j]) {
            move(nextChild, container, anchor, 2);
          } else {
            j--;
          }
        }
      }
    }
  };
  const move = (vnode, container, anchor, moveType, parentSuspense = null) => {
    const { el, type, transition, children, shapeFlag } = vnode;
    if (shapeFlag & 6) {
      move(vnode.component.subTree, container, anchor, moveType);
      return;
    }
    if (shapeFlag & 128) {
      vnode.suspense.move(container, anchor, moveType);
      return;
    }
    if (shapeFlag & 64) {
      type.move(vnode, container, anchor, internals);
      return;
    }
    if (type === Fragment) {
      hostInsert(el, container, anchor);
      for (let i = 0; i < children.length; i++) {
        move(children[i], container, anchor, moveType);
      }
      hostInsert(vnode.anchor, container, anchor);
      return;
    }
    if (type === Static) {
      moveStaticNode(vnode, container, anchor);
      return;
    }
    const needTransition2 = moveType !== 2 && shapeFlag & 1 && transition;
    if (needTransition2) {
      if (moveType === 0) {
        transition.beforeEnter(el);
        hostInsert(el, container, anchor);
        queuePostRenderEffect(() => transition.enter(el), parentSuspense);
      } else {
        const { leave, delayLeave, afterLeave } = transition;
        const remove22 = () => {
          if (vnode.ctx.isUnmounted) {
            hostRemove(el);
          } else {
            hostInsert(el, container, anchor);
          }
        };
        const performLeave = () => {
          if (el._isLeaving) {
            el[leaveCbKey](
              true
              /* cancelled */
            );
          }
          leave(el, () => {
            remove22();
            afterLeave && afterLeave();
          });
        };
        if (delayLeave) {
          delayLeave(el, remove22, performLeave);
        } else {
          performLeave();
        }
      }
    } else {
      hostInsert(el, container, anchor);
    }
  };
  const unmount = (vnode, parentComponent, parentSuspense, doRemove = false, optimized = false) => {
    const {
      type,
      props,
      ref: ref3,
      children,
      dynamicChildren,
      shapeFlag,
      patchFlag,
      dirs,
      cacheIndex
    } = vnode;
    if (patchFlag === -2) {
      optimized = false;
    }
    if (ref3 != null) {
      pauseTracking();
      setRef(ref3, null, parentSuspense, vnode, true);
      resetTracking();
    }
    if (cacheIndex != null) {
      parentComponent.renderCache[cacheIndex] = void 0;
    }
    if (shapeFlag & 256) {
      parentComponent.ctx.deactivate(vnode);
      return;
    }
    const shouldInvokeDirs = shapeFlag & 1 && dirs;
    const shouldInvokeVnodeHook = !isAsyncWrapper(vnode);
    let vnodeHook;
    if (shouldInvokeVnodeHook && (vnodeHook = props && props.onVnodeBeforeUnmount)) {
      invokeVNodeHook(vnodeHook, parentComponent, vnode);
    }
    if (shapeFlag & 6) {
      unmountComponent(vnode.component, parentSuspense, doRemove);
    } else {
      if (shapeFlag & 128) {
        vnode.suspense.unmount(parentSuspense, doRemove);
        return;
      }
      if (shouldInvokeDirs) {
        invokeDirectiveHook(vnode, null, parentComponent, "beforeUnmount");
      }
      if (shapeFlag & 64) {
        vnode.type.remove(
          vnode,
          parentComponent,
          parentSuspense,
          internals,
          doRemove
        );
      } else if (dynamicChildren && // #5154
      // when v-once is used inside a block, setBlockTracking(-1) marks the
      // parent block with hasOnce: true
      // so that it doesn't take the fast path during unmount - otherwise
      // components nested in v-once are never unmounted.
      !dynamicChildren.hasOnce && // #1153: fast path should not be taken for non-stable (v-for) fragments
      (type !== Fragment || patchFlag > 0 && patchFlag & 64)) {
        unmountChildren(
          dynamicChildren,
          parentComponent,
          parentSuspense,
          false,
          true
        );
      } else if (type === Fragment && patchFlag & (128 | 256) || !optimized && shapeFlag & 16) {
        unmountChildren(children, parentComponent, parentSuspense);
      }
      if (doRemove) {
        remove2(vnode);
      }
    }
    if (shouldInvokeVnodeHook && (vnodeHook = props && props.onVnodeUnmounted) || shouldInvokeDirs) {
      queuePostRenderEffect(() => {
        vnodeHook && invokeVNodeHook(vnodeHook, parentComponent, vnode);
        shouldInvokeDirs && invokeDirectiveHook(vnode, null, parentComponent, "unmounted");
      }, parentSuspense);
    }
  };
  const remove2 = (vnode) => {
    const { type, el, anchor, transition } = vnode;
    if (type === Fragment) {
      {
        removeFragment(el, anchor);
      }
      return;
    }
    if (type === Static) {
      removeStaticNode(vnode);
      return;
    }
    const performRemove = () => {
      hostRemove(el);
      if (transition && !transition.persisted && transition.afterLeave) {
        transition.afterLeave();
      }
    };
    if (vnode.shapeFlag & 1 && transition && !transition.persisted) {
      const { leave, delayLeave } = transition;
      const performLeave = () => leave(el, performRemove);
      if (delayLeave) {
        delayLeave(vnode.el, performRemove, performLeave);
      } else {
        performLeave();
      }
    } else {
      performRemove();
    }
  };
  const removeFragment = (cur, end) => {
    let next;
    while (cur !== end) {
      next = hostNextSibling(cur);
      hostRemove(cur);
      cur = next;
    }
    hostRemove(end);
  };
  const unmountComponent = (instance, parentSuspense, doRemove) => {
    const { bum, scope, job, subTree, um, m, a } = instance;
    invalidateMount(m);
    invalidateMount(a);
    if (bum) {
      invokeArrayFns(bum);
    }
    scope.stop();
    if (job) {
      job.flags |= 8;
      unmount(subTree, instance, parentSuspense, doRemove);
    }
    if (um) {
      queuePostRenderEffect(um, parentSuspense);
    }
    queuePostRenderEffect(() => {
      instance.isUnmounted = true;
    }, parentSuspense);
  };
  const unmountChildren = (children, parentComponent, parentSuspense, doRemove = false, optimized = false, start = 0) => {
    for (let i = start; i < children.length; i++) {
      unmount(children[i], parentComponent, parentSuspense, doRemove, optimized);
    }
  };
  const getNextHostNode = (vnode) => {
    if (vnode.shapeFlag & 6) {
      return getNextHostNode(vnode.component.subTree);
    }
    if (vnode.shapeFlag & 128) {
      return vnode.suspense.next();
    }
    const el = hostNextSibling(vnode.anchor || vnode.el);
    const teleportEnd = el && el[TeleportEndKey];
    return teleportEnd ? hostNextSibling(teleportEnd) : el;
  };
  let isFlushing = false;
  const render = (vnode, container, namespace) => {
    let instance;
    if (vnode == null) {
      if (container._vnode) {
        unmount(container._vnode, null, null, true);
        instance = container._vnode.component;
      }
    } else {
      patch(
        container._vnode || null,
        vnode,
        container,
        null,
        null,
        null,
        namespace
      );
    }
    container._vnode = vnode;
    if (!isFlushing) {
      isFlushing = true;
      flushPreFlushCbs(instance);
      flushPostFlushCbs();
      isFlushing = false;
    }
  };
  const internals = {
    p: patch,
    um: unmount,
    m: move,
    r: remove2,
    mt: mountComponent,
    mc: mountChildren,
    pc: patchChildren,
    pbc: patchBlockChildren,
    n: getNextHostNode,
    o: options
  };
  let hydrate;
  return {
    render,
    hydrate,
    createApp: createAppAPI(render)
  };
}
function resolveChildrenNamespace({ type, props }, currentNamespace) {
  return currentNamespace === "svg" && type === "foreignObject" || currentNamespace === "mathml" && type === "annotation-xml" && props && props.encoding && props.encoding.includes("html") ? void 0 : currentNamespace;
}
function toggleRecurse({ effect: effect2, job }, allowed) {
  if (allowed) {
    effect2.flags |= 32;
    job.flags |= 4;
  } else {
    effect2.flags &= -33;
    job.flags &= -5;
  }
}
function needTransition(parentSuspense, transition) {
  return (!parentSuspense || parentSuspense && !parentSuspense.pendingBranch) && transition && !transition.persisted;
}
function traverseStaticChildren(n1, n2, shallow = false) {
  const ch1 = n1.children;
  const ch2 = n2.children;
  if (isArray(ch1) && isArray(ch2)) {
    for (let i = 0; i < ch1.length; i++) {
      const c1 = ch1[i];
      let c2 = ch2[i];
      if (c2.shapeFlag & 1 && !c2.dynamicChildren) {
        if (c2.patchFlag <= 0 || c2.patchFlag === 32) {
          c2 = ch2[i] = cloneIfMounted(ch2[i]);
          c2.el = c1.el;
        }
        if (!shallow && c2.patchFlag !== -2)
          traverseStaticChildren(c1, c2);
      }
      if (c2.type === Text) {
        if (c2.patchFlag === -1) {
          c2 = ch2[i] = cloneIfMounted(c2);
        }
        c2.el = c1.el;
      }
      if (c2.type === Comment && !c2.el) {
        c2.el = c1.el;
      }
    }
  }
}
function getSequence(arr) {
  const p2 = arr.slice();
  const result = [0];
  let i, j, u, v, c;
  const len = arr.length;
  for (i = 0; i < len; i++) {
    const arrI = arr[i];
    if (arrI !== 0) {
      j = result[result.length - 1];
      if (arr[j] < arrI) {
        p2[i] = j;
        result.push(i);
        continue;
      }
      u = 0;
      v = result.length - 1;
      while (u < v) {
        c = u + v >> 1;
        if (arr[result[c]] < arrI) {
          u = c + 1;
        } else {
          v = c;
        }
      }
      if (arrI < arr[result[u]]) {
        if (u > 0) {
          p2[i] = result[u - 1];
        }
        result[u] = i;
      }
    }
  }
  u = result.length;
  v = result[u - 1];
  while (u-- > 0) {
    result[u] = v;
    v = p2[v];
  }
  return result;
}
function locateNonHydratedAsyncRoot(instance) {
  const subComponent = instance.subTree.component;
  if (subComponent) {
    if (subComponent.asyncDep && !subComponent.asyncResolved) {
      return subComponent;
    } else {
      return locateNonHydratedAsyncRoot(subComponent);
    }
  }
}
function invalidateMount(hooks) {
  if (hooks) {
    for (let i = 0; i < hooks.length; i++)
      hooks[i].flags |= 8;
  }
}
function resolveAsyncComponentPlaceholder(anchorVnode) {
  if (anchorVnode.placeholder) {
    return anchorVnode.placeholder;
  }
  const instance = anchorVnode.component;
  if (instance) {
    return resolveAsyncComponentPlaceholder(instance.subTree);
  }
  return null;
}
const isSuspense = (type) => type.__isSuspense;
function queueEffectWithSuspense(fn, suspense) {
  if (suspense && suspense.pendingBranch) {
    if (isArray(fn)) {
      suspense.effects.push(...fn);
    } else {
      suspense.effects.push(fn);
    }
  } else {
    queuePostFlushCb(fn);
  }
}
const Fragment = /* @__PURE__ */ Symbol.for("v-fgt");
const Text = /* @__PURE__ */ Symbol.for("v-txt");
const Comment = /* @__PURE__ */ Symbol.for("v-cmt");
const Static = /* @__PURE__ */ Symbol.for("v-stc");
const blockStack = [];
let currentBlock = null;
function openBlock(disableTracking = false) {
  blockStack.push(currentBlock = disableTracking ? null : []);
}
function closeBlock() {
  blockStack.pop();
  currentBlock = blockStack[blockStack.length - 1] || null;
}
let isBlockTreeEnabled = 1;
function setBlockTracking(value, inVOnce = false) {
  isBlockTreeEnabled += value;
  if (value < 0 && currentBlock && inVOnce) {
    currentBlock.hasOnce = true;
  }
}
function setupBlock(vnode) {
  vnode.dynamicChildren = isBlockTreeEnabled > 0 ? currentBlock || EMPTY_ARR : null;
  closeBlock();
  if (isBlockTreeEnabled > 0 && currentBlock) {
    currentBlock.push(vnode);
  }
  return vnode;
}
function createElementBlock(type, props, children, patchFlag, dynamicProps, shapeFlag) {
  return setupBlock(
    createBaseVNode(
      type,
      props,
      children,
      patchFlag,
      dynamicProps,
      shapeFlag,
      true
    )
  );
}
function isVNode(value) {
  return value ? value.__v_isVNode === true : false;
}
function isSameVNodeType(n1, n2) {
  return n1.type === n2.type && n1.key === n2.key;
}
const normalizeKey = ({ key }) => key != null ? key : null;
const normalizeRef = ({
  ref: ref3,
  ref_key,
  ref_for
}) => {
  if (typeof ref3 === "number") {
    ref3 = "" + ref3;
  }
  return ref3 != null ? isString(ref3) || /* @__PURE__ */ isRef(ref3) || isFunction(ref3) ? { i: currentRenderingInstance, r: ref3, k: ref_key, f: !!ref_for } : ref3 : null;
};
function createBaseVNode(type, props = null, children = null, patchFlag = 0, dynamicProps = null, shapeFlag = type === Fragment ? 0 : 1, isBlockNode = false, needFullChildrenNormalization = false) {
  const vnode = {
    __v_isVNode: true,
    __v_skip: true,
    type,
    props,
    key: props && normalizeKey(props),
    ref: props && normalizeRef(props),
    scopeId: currentScopeId,
    slotScopeIds: null,
    children,
    component: null,
    suspense: null,
    ssContent: null,
    ssFallback: null,
    dirs: null,
    transition: null,
    el: null,
    anchor: null,
    target: null,
    targetStart: null,
    targetAnchor: null,
    staticCount: 0,
    shapeFlag,
    patchFlag,
    dynamicProps,
    dynamicChildren: null,
    appContext: null,
    ctx: currentRenderingInstance
  };
  if (needFullChildrenNormalization) {
    normalizeChildren(vnode, children);
    if (shapeFlag & 128) {
      type.normalize(vnode);
    }
  } else if (children) {
    vnode.shapeFlag |= isString(children) ? 8 : 16;
  }
  if (isBlockTreeEnabled > 0 && // avoid a block node from tracking itself
  !isBlockNode && // has current parent block
  currentBlock && // presence of a patch flag indicates this node needs patching on updates.
  // component nodes also should always be patched, because even if the
  // component doesn't need to update, it needs to persist the instance on to
  // the next vnode so that it can be properly unmounted later.
  (vnode.patchFlag > 0 || shapeFlag & 6) && // the EVENTS flag is only for hydration and if it is the only flag, the
  // vnode should not be considered dynamic due to handler caching.
  vnode.patchFlag !== 32) {
    currentBlock.push(vnode);
  }
  return vnode;
}
const createVNode = _createVNode;
function _createVNode(type, props = null, children = null, patchFlag = 0, dynamicProps = null, isBlockNode = false) {
  if (!type || type === NULL_DYNAMIC_COMPONENT) {
    type = Comment;
  }
  if (isVNode(type)) {
    const cloned = cloneVNode(
      type,
      props,
      true
      /* mergeRef: true */
    );
    if (children) {
      normalizeChildren(cloned, children);
    }
    if (isBlockTreeEnabled > 0 && !isBlockNode && currentBlock) {
      if (cloned.shapeFlag & 6) {
        currentBlock[currentBlock.indexOf(type)] = cloned;
      } else {
        currentBlock.push(cloned);
      }
    }
    cloned.patchFlag = -2;
    return cloned;
  }
  if (isClassComponent(type)) {
    type = type.__vccOpts;
  }
  if (props) {
    props = guardReactiveProps(props);
    let { class: klass, style } = props;
    if (klass && !isString(klass)) {
      props.class = normalizeClass(klass);
    }
    if (isObject(style)) {
      if (/* @__PURE__ */ isProxy(style) && !isArray(style)) {
        style = extend({}, style);
      }
      props.style = normalizeStyle(style);
    }
  }
  const shapeFlag = isString(type) ? 1 : isSuspense(type) ? 128 : isTeleport(type) ? 64 : isObject(type) ? 4 : isFunction(type) ? 2 : 0;
  return createBaseVNode(
    type,
    props,
    children,
    patchFlag,
    dynamicProps,
    shapeFlag,
    isBlockNode,
    true
  );
}
function guardReactiveProps(props) {
  if (!props) return null;
  return /* @__PURE__ */ isProxy(props) || isInternalObject(props) ? extend({}, props) : props;
}
function cloneVNode(vnode, extraProps, mergeRef = false, cloneTransition = false) {
  const { props, ref: ref3, patchFlag, children, transition } = vnode;
  const mergedProps = extraProps ? mergeProps(props || {}, extraProps) : props;
  const cloned = {
    __v_isVNode: true,
    __v_skip: true,
    type: vnode.type,
    props: mergedProps,
    key: mergedProps && normalizeKey(mergedProps),
    ref: extraProps && extraProps.ref ? (
      // #2078 in the case of <component :is="vnode" ref="extra"/>
      // if the vnode itself already has a ref, cloneVNode will need to merge
      // the refs so the single vnode can be set on multiple refs
      mergeRef && ref3 ? isArray(ref3) ? ref3.concat(normalizeRef(extraProps)) : [ref3, normalizeRef(extraProps)] : normalizeRef(extraProps)
    ) : ref3,
    scopeId: vnode.scopeId,
    slotScopeIds: vnode.slotScopeIds,
    children,
    target: vnode.target,
    targetStart: vnode.targetStart,
    targetAnchor: vnode.targetAnchor,
    staticCount: vnode.staticCount,
    shapeFlag: vnode.shapeFlag,
    // if the vnode is cloned with extra props, we can no longer assume its
    // existing patch flag to be reliable and need to add the FULL_PROPS flag.
    // note: preserve flag for fragments since they use the flag for children
    // fast paths only.
    patchFlag: extraProps && vnode.type !== Fragment ? patchFlag === -1 ? 16 : patchFlag | 16 : patchFlag,
    dynamicProps: vnode.dynamicProps,
    dynamicChildren: vnode.dynamicChildren,
    appContext: vnode.appContext,
    dirs: vnode.dirs,
    transition,
    // These should technically only be non-null on mounted VNodes. However,
    // they *should* be copied for kept-alive vnodes. So we just always copy
    // them since them being non-null during a mount doesn't affect the logic as
    // they will simply be overwritten.
    component: vnode.component,
    suspense: vnode.suspense,
    ssContent: vnode.ssContent && cloneVNode(vnode.ssContent),
    ssFallback: vnode.ssFallback && cloneVNode(vnode.ssFallback),
    placeholder: vnode.placeholder,
    el: vnode.el,
    anchor: vnode.anchor,
    ctx: vnode.ctx,
    ce: vnode.ce
  };
  if (transition && cloneTransition) {
    setTransitionHooks(
      cloned,
      transition.clone(cloned)
    );
  }
  return cloned;
}
function createTextVNode(text = " ", flag = 0) {
  return createVNode(Text, null, text, flag);
}
function normalizeVNode(child) {
  if (child == null || typeof child === "boolean") {
    return createVNode(Comment);
  } else if (isArray(child)) {
    return createVNode(
      Fragment,
      null,
      // #3666, avoid reference pollution when reusing vnode
      child.slice()
    );
  } else if (isVNode(child)) {
    return cloneIfMounted(child);
  } else {
    return createVNode(Text, null, String(child));
  }
}
function cloneIfMounted(child) {
  return child.el === null && child.patchFlag !== -1 || child.memo ? child : cloneVNode(child);
}
function normalizeChildren(vnode, children) {
  let type = 0;
  const { shapeFlag } = vnode;
  if (children == null) {
    children = null;
  } else if (isArray(children)) {
    type = 16;
  } else if (typeof children === "object") {
    if (shapeFlag & (1 | 64)) {
      const slot = children.default;
      if (slot) {
        slot._c && (slot._d = false);
        normalizeChildren(vnode, slot());
        slot._c && (slot._d = true);
      }
      return;
    } else {
      type = 32;
      const slotFlag = children._;
      if (!slotFlag && !isInternalObject(children)) {
        children._ctx = currentRenderingInstance;
      } else if (slotFlag === 3 && currentRenderingInstance) {
        if (currentRenderingInstance.slots._ === 1) {
          children._ = 1;
        } else {
          children._ = 2;
          vnode.patchFlag |= 1024;
        }
      }
    }
  } else if (isFunction(children)) {
    children = { default: children, _ctx: currentRenderingInstance };
    type = 32;
  } else {
    children = String(children);
    if (shapeFlag & 64) {
      type = 16;
      children = [createTextVNode(children)];
    } else {
      type = 8;
    }
  }
  vnode.children = children;
  vnode.shapeFlag |= type;
}
function mergeProps(...args) {
  const ret = {};
  for (let i = 0; i < args.length; i++) {
    const toMerge = args[i];
    for (const key in toMerge) {
      if (key === "class") {
        if (ret.class !== toMerge.class) {
          ret.class = normalizeClass([ret.class, toMerge.class]);
        }
      } else if (key === "style") {
        ret.style = normalizeStyle([ret.style, toMerge.style]);
      } else if (isOn(key)) {
        const existing = ret[key];
        const incoming = toMerge[key];
        if (incoming && existing !== incoming && !(isArray(existing) && existing.includes(incoming))) {
          ret[key] = existing ? [].concat(existing, incoming) : incoming;
        }
      } else if (key !== "") {
        ret[key] = toMerge[key];
      }
    }
  }
  return ret;
}
function invokeVNodeHook(hook, instance, vnode, prevVNode = null) {
  callWithAsyncErrorHandling(hook, instance, 7, [
    vnode,
    prevVNode
  ]);
}
const emptyAppContext = createAppContext();
let uid = 0;
function createComponentInstance(vnode, parent, suspense) {
  const type = vnode.type;
  const appContext = (parent ? parent.appContext : vnode.appContext) || emptyAppContext;
  const instance = {
    uid: uid++,
    vnode,
    type,
    parent,
    appContext,
    root: null,
    // to be immediately set
    next: null,
    subTree: null,
    // will be set synchronously right after creation
    effect: null,
    update: null,
    // will be set synchronously right after creation
    job: null,
    scope: new EffectScope(
      true
      /* detached */
    ),
    render: null,
    proxy: null,
    exposed: null,
    exposeProxy: null,
    withProxy: null,
    provides: parent ? parent.provides : Object.create(appContext.provides),
    ids: parent ? parent.ids : ["", 0, 0],
    accessCache: null,
    renderCache: [],
    // local resolved assets
    components: null,
    directives: null,
    // resolved props and emits options
    propsOptions: normalizePropsOptions(type, appContext),
    emitsOptions: normalizeEmitsOptions(type, appContext),
    // emit
    emit: null,
    // to be set immediately
    emitted: null,
    // props default value
    propsDefaults: EMPTY_OBJ,
    // inheritAttrs
    inheritAttrs: type.inheritAttrs,
    // state
    ctx: EMPTY_OBJ,
    data: EMPTY_OBJ,
    props: EMPTY_OBJ,
    attrs: EMPTY_OBJ,
    slots: EMPTY_OBJ,
    refs: EMPTY_OBJ,
    setupState: EMPTY_OBJ,
    setupContext: null,
    // suspense related
    suspense,
    suspenseId: suspense ? suspense.pendingId : 0,
    asyncDep: null,
    asyncResolved: false,
    // lifecycle hooks
    // not using enums here because it results in computed properties
    isMounted: false,
    isUnmounted: false,
    isDeactivated: false,
    bc: null,
    c: null,
    bm: null,
    m: null,
    bu: null,
    u: null,
    um: null,
    bum: null,
    da: null,
    a: null,
    rtg: null,
    rtc: null,
    ec: null,
    sp: null
  };
  {
    instance.ctx = { _: instance };
  }
  instance.root = parent ? parent.root : instance;
  instance.emit = emit.bind(null, instance);
  if (vnode.ce) {
    vnode.ce(instance);
  }
  return instance;
}
let currentInstance = null;
const getCurrentInstance = () => currentInstance || currentRenderingInstance;
let internalSetCurrentInstance;
let setInSSRSetupState;
{
  const g = getGlobalThis();
  const registerGlobalSetter = (key, setter) => {
    let setters;
    if (!(setters = g[key])) setters = g[key] = [];
    setters.push(setter);
    return (v) => {
      if (setters.length > 1) setters.forEach((set) => set(v));
      else setters[0](v);
    };
  };
  internalSetCurrentInstance = registerGlobalSetter(
    `__VUE_INSTANCE_SETTERS__`,
    (v) => currentInstance = v
  );
  setInSSRSetupState = registerGlobalSetter(
    `__VUE_SSR_SETTERS__`,
    (v) => isInSSRComponentSetup = v
  );
}
const setCurrentInstance = (instance) => {
  const prev = currentInstance;
  internalSetCurrentInstance(instance);
  instance.scope.on();
  return () => {
    instance.scope.off();
    internalSetCurrentInstance(prev);
  };
};
const unsetCurrentInstance = () => {
  currentInstance && currentInstance.scope.off();
  internalSetCurrentInstance(null);
};
function isStatefulComponent(instance) {
  return instance.vnode.shapeFlag & 4;
}
let isInSSRComponentSetup = false;
function setupComponent(instance, isSSR = false, optimized = false) {
  isSSR && setInSSRSetupState(isSSR);
  const { props, children } = instance.vnode;
  const isStateful = isStatefulComponent(instance);
  initProps(instance, props, isStateful, isSSR);
  initSlots(instance, children, optimized || isSSR);
  const setupResult = isStateful ? setupStatefulComponent(instance, isSSR) : void 0;
  isSSR && setInSSRSetupState(false);
  return setupResult;
}
function setupStatefulComponent(instance, isSSR) {
  const Component = instance.type;
  instance.accessCache = /* @__PURE__ */ Object.create(null);
  instance.proxy = new Proxy(instance.ctx, PublicInstanceProxyHandlers);
  const { setup } = Component;
  if (setup) {
    pauseTracking();
    const setupContext = instance.setupContext = setup.length > 1 ? createSetupContext(instance) : null;
    const reset = setCurrentInstance(instance);
    const setupResult = callWithErrorHandling(
      setup,
      instance,
      0,
      [
        instance.props,
        setupContext
      ]
    );
    const isAsyncSetup = isPromise(setupResult);
    resetTracking();
    reset();
    if ((isAsyncSetup || instance.sp) && !isAsyncWrapper(instance)) {
      markAsyncBoundary(instance);
    }
    if (isAsyncSetup) {
      setupResult.then(unsetCurrentInstance, unsetCurrentInstance);
      if (isSSR) {
        return setupResult.then((resolvedResult) => {
          handleSetupResult(instance, resolvedResult);
        }).catch((e) => {
          handleError(e, instance, 0);
        });
      } else {
        instance.asyncDep = setupResult;
      }
    } else {
      handleSetupResult(instance, setupResult);
    }
  } else {
    finishComponentSetup(instance);
  }
}
function handleSetupResult(instance, setupResult, isSSR) {
  if (isFunction(setupResult)) {
    if (instance.type.__ssrInlineRender) {
      instance.ssrRender = setupResult;
    } else {
      instance.render = setupResult;
    }
  } else if (isObject(setupResult)) {
    instance.setupState = proxyRefs(setupResult);
  } else ;
  finishComponentSetup(instance);
}
function finishComponentSetup(instance, isSSR, skipOptions) {
  const Component = instance.type;
  if (!instance.render) {
    instance.render = Component.render || NOOP;
  }
  {
    const reset = setCurrentInstance(instance);
    pauseTracking();
    try {
      applyOptions(instance);
    } finally {
      resetTracking();
      reset();
    }
  }
}
const attrsProxyHandlers = {
  get(target, key) {
    track(target, "get", "");
    return target[key];
  }
};
function createSetupContext(instance) {
  const expose = (exposed) => {
    instance.exposed = exposed || {};
  };
  {
    return {
      attrs: new Proxy(instance.attrs, attrsProxyHandlers),
      slots: instance.slots,
      emit: instance.emit,
      expose
    };
  }
}
function getComponentPublicInstance(instance) {
  if (instance.exposed) {
    return instance.exposeProxy || (instance.exposeProxy = new Proxy(proxyRefs(markRaw(instance.exposed)), {
      get(target, key) {
        if (key in target) {
          return target[key];
        } else if (key in publicPropertiesMap) {
          return publicPropertiesMap[key](instance);
        }
      },
      has(target, key) {
        return key in target || key in publicPropertiesMap;
      }
    }));
  } else {
    return instance.proxy;
  }
}
const classifyRE = /(?:^|[-_])\w/g;
const classify = (str) => str.replace(classifyRE, (c) => c.toUpperCase()).replace(/[-_]/g, "");
function getComponentName(Component, includeInferred = true) {
  return isFunction(Component) ? Component.displayName || Component.name : Component.name || includeInferred && Component.__name;
}
function formatComponentName(instance, Component, isRoot = false) {
  let name = getComponentName(Component);
  if (!name && Component.__file) {
    const match = Component.__file.match(/([^/\\]+)\.\w+$/);
    if (match) {
      name = match[1];
    }
  }
  if (!name && instance) {
    const inferFromRegistry = (registry) => {
      for (const key in registry) {
        if (registry[key] === Component) {
          return key;
        }
      }
    };
    name = inferFromRegistry(instance.components) || instance.parent && inferFromRegistry(
      instance.parent.type.components
    ) || inferFromRegistry(instance.appContext.components);
  }
  return name ? classify(name) : isRoot ? `App` : `Anonymous`;
}
function isClassComponent(value) {
  return isFunction(value) && "__vccOpts" in value;
}
const computed = (getterOrOptions, debugOptions) => {
  const c = /* @__PURE__ */ computed$1(getterOrOptions, debugOptions, isInSSRComponentSetup);
  return c;
};
const version = "3.5.28";
let policy = void 0;
const tt = typeof window !== "undefined" && window.trustedTypes;
if (tt) {
  try {
    policy = /* @__PURE__ */ tt.createPolicy("vue", {
      createHTML: (val) => val
    });
  } catch (e) {
  }
}
const unsafeToTrustedHTML = policy ? (val) => policy.createHTML(val) : (val) => val;
const svgNS = "http://www.w3.org/2000/svg";
const mathmlNS = "http://www.w3.org/1998/Math/MathML";
const doc = typeof document !== "undefined" ? document : null;
const templateContainer = doc && /* @__PURE__ */ doc.createElement("template");
const nodeOps = {
  insert: (child, parent, anchor) => {
    parent.insertBefore(child, anchor || null);
  },
  remove: (child) => {
    const parent = child.parentNode;
    if (parent) {
      parent.removeChild(child);
    }
  },
  createElement: (tag, namespace, is, props) => {
    const el = namespace === "svg" ? doc.createElementNS(svgNS, tag) : namespace === "mathml" ? doc.createElementNS(mathmlNS, tag) : is ? doc.createElement(tag, { is }) : doc.createElement(tag);
    if (tag === "select" && props && props.multiple != null) {
      el.setAttribute("multiple", props.multiple);
    }
    return el;
  },
  createText: (text) => doc.createTextNode(text),
  createComment: (text) => doc.createComment(text),
  setText: (node, text) => {
    node.nodeValue = text;
  },
  setElementText: (el, text) => {
    el.textContent = text;
  },
  parentNode: (node) => node.parentNode,
  nextSibling: (node) => node.nextSibling,
  querySelector: (selector) => doc.querySelector(selector),
  setScopeId(el, id) {
    el.setAttribute(id, "");
  },
  // __UNSAFE__
  // Reason: innerHTML.
  // Static content here can only come from compiled templates.
  // As long as the user only uses trusted templates, this is safe.
  insertStaticContent(content, parent, anchor, namespace, start, end) {
    const before = anchor ? anchor.previousSibling : parent.lastChild;
    if (start && (start === end || start.nextSibling)) {
      while (true) {
        parent.insertBefore(start.cloneNode(true), anchor);
        if (start === end || !(start = start.nextSibling)) break;
      }
    } else {
      templateContainer.innerHTML = unsafeToTrustedHTML(
        namespace === "svg" ? `<svg>${content}</svg>` : namespace === "mathml" ? `<math>${content}</math>` : content
      );
      const template = templateContainer.content;
      if (namespace === "svg" || namespace === "mathml") {
        const wrapper = template.firstChild;
        while (wrapper.firstChild) {
          template.appendChild(wrapper.firstChild);
        }
        template.removeChild(wrapper);
      }
      parent.insertBefore(template, anchor);
    }
    return [
      // first
      before ? before.nextSibling : parent.firstChild,
      // last
      anchor ? anchor.previousSibling : parent.lastChild
    ];
  }
};
const vtcKey = /* @__PURE__ */ Symbol("_vtc");
function patchClass(el, value, isSVG) {
  const transitionClasses = el[vtcKey];
  if (transitionClasses) {
    value = (value ? [value, ...transitionClasses] : [...transitionClasses]).join(" ");
  }
  if (value == null) {
    el.removeAttribute("class");
  } else if (isSVG) {
    el.setAttribute("class", value);
  } else {
    el.className = value;
  }
}
const vShowOriginalDisplay = /* @__PURE__ */ Symbol("_vod");
const vShowHidden = /* @__PURE__ */ Symbol("_vsh");
const CSS_VAR_TEXT = /* @__PURE__ */ Symbol("");
const displayRE = /(?:^|;)\s*display\s*:/;
function patchStyle(el, prev, next) {
  const style = el.style;
  const isCssString = isString(next);
  let hasControlledDisplay = false;
  if (next && !isCssString) {
    if (prev) {
      if (!isString(prev)) {
        for (const key in prev) {
          if (next[key] == null) {
            setStyle(style, key, "");
          }
        }
      } else {
        for (const prevStyle of prev.split(";")) {
          const key = prevStyle.slice(0, prevStyle.indexOf(":")).trim();
          if (next[key] == null) {
            setStyle(style, key, "");
          }
        }
      }
    }
    for (const key in next) {
      if (key === "display") {
        hasControlledDisplay = true;
      }
      setStyle(style, key, next[key]);
    }
  } else {
    if (isCssString) {
      if (prev !== next) {
        const cssVarText = style[CSS_VAR_TEXT];
        if (cssVarText) {
          next += ";" + cssVarText;
        }
        style.cssText = next;
        hasControlledDisplay = displayRE.test(next);
      }
    } else if (prev) {
      el.removeAttribute("style");
    }
  }
  if (vShowOriginalDisplay in el) {
    el[vShowOriginalDisplay] = hasControlledDisplay ? style.display : "";
    if (el[vShowHidden]) {
      style.display = "none";
    }
  }
}
const importantRE = /\s*!important$/;
function setStyle(style, name, val) {
  if (isArray(val)) {
    val.forEach((v) => setStyle(style, name, v));
  } else {
    if (val == null) val = "";
    if (name.startsWith("--")) {
      style.setProperty(name, val);
    } else {
      const prefixed = autoPrefix(style, name);
      if (importantRE.test(val)) {
        style.setProperty(
          hyphenate(prefixed),
          val.replace(importantRE, ""),
          "important"
        );
      } else {
        style[prefixed] = val;
      }
    }
  }
}
const prefixes = ["Webkit", "Moz", "ms"];
const prefixCache = {};
function autoPrefix(style, rawName) {
  const cached = prefixCache[rawName];
  if (cached) {
    return cached;
  }
  let name = camelize(rawName);
  if (name !== "filter" && name in style) {
    return prefixCache[rawName] = name;
  }
  name = capitalize(name);
  for (let i = 0; i < prefixes.length; i++) {
    const prefixed = prefixes[i] + name;
    if (prefixed in style) {
      return prefixCache[rawName] = prefixed;
    }
  }
  return rawName;
}
const xlinkNS = "http://www.w3.org/1999/xlink";
function patchAttr(el, key, value, isSVG, instance, isBoolean = isSpecialBooleanAttr(key)) {
  if (isSVG && key.startsWith("xlink:")) {
    if (value == null) {
      el.removeAttributeNS(xlinkNS, key.slice(6, key.length));
    } else {
      el.setAttributeNS(xlinkNS, key, value);
    }
  } else {
    if (value == null || isBoolean && !includeBooleanAttr(value)) {
      el.removeAttribute(key);
    } else {
      el.setAttribute(
        key,
        isBoolean ? "" : isSymbol(value) ? String(value) : value
      );
    }
  }
}
function patchDOMProp(el, key, value, parentComponent, attrName) {
  if (key === "innerHTML" || key === "textContent") {
    if (value != null) {
      el[key] = key === "innerHTML" ? unsafeToTrustedHTML(value) : value;
    }
    return;
  }
  const tag = el.tagName;
  if (key === "value" && tag !== "PROGRESS" && // custom elements may use _value internally
  !tag.includes("-")) {
    const oldValue = tag === "OPTION" ? el.getAttribute("value") || "" : el.value;
    const newValue = value == null ? (
      // #11647: value should be set as empty string for null and undefined,
      // but <input type="checkbox"> should be set as 'on'.
      el.type === "checkbox" ? "on" : ""
    ) : String(value);
    if (oldValue !== newValue || !("_value" in el)) {
      el.value = newValue;
    }
    if (value == null) {
      el.removeAttribute(key);
    }
    el._value = value;
    return;
  }
  let needRemove = false;
  if (value === "" || value == null) {
    const type = typeof el[key];
    if (type === "boolean") {
      value = includeBooleanAttr(value);
    } else if (value == null && type === "string") {
      value = "";
      needRemove = true;
    } else if (type === "number") {
      value = 0;
      needRemove = true;
    }
  }
  try {
    el[key] = value;
  } catch (e) {
  }
  needRemove && el.removeAttribute(attrName || key);
}
function addEventListener(el, event, handler, options) {
  el.addEventListener(event, handler, options);
}
function removeEventListener(el, event, handler, options) {
  el.removeEventListener(event, handler, options);
}
const veiKey = /* @__PURE__ */ Symbol("_vei");
function patchEvent(el, rawName, prevValue, nextValue, instance = null) {
  const invokers = el[veiKey] || (el[veiKey] = {});
  const existingInvoker = invokers[rawName];
  if (nextValue && existingInvoker) {
    existingInvoker.value = nextValue;
  } else {
    const [name, options] = parseName(rawName);
    if (nextValue) {
      const invoker = invokers[rawName] = createInvoker(
        nextValue,
        instance
      );
      addEventListener(el, name, invoker, options);
    } else if (existingInvoker) {
      removeEventListener(el, name, existingInvoker, options);
      invokers[rawName] = void 0;
    }
  }
}
const optionsModifierRE = /(?:Once|Passive|Capture)$/;
function parseName(name) {
  let options;
  if (optionsModifierRE.test(name)) {
    options = {};
    let m;
    while (m = name.match(optionsModifierRE)) {
      name = name.slice(0, name.length - m[0].length);
      options[m[0].toLowerCase()] = true;
    }
  }
  const event = name[2] === ":" ? name.slice(3) : hyphenate(name.slice(2));
  return [event, options];
}
let cachedNow = 0;
const p = /* @__PURE__ */ Promise.resolve();
const getNow = () => cachedNow || (p.then(() => cachedNow = 0), cachedNow = Date.now());
function createInvoker(initialValue, instance) {
  const invoker = (e) => {
    if (!e._vts) {
      e._vts = Date.now();
    } else if (e._vts <= invoker.attached) {
      return;
    }
    callWithAsyncErrorHandling(
      patchStopImmediatePropagation(e, invoker.value),
      instance,
      5,
      [e]
    );
  };
  invoker.value = initialValue;
  invoker.attached = getNow();
  return invoker;
}
function patchStopImmediatePropagation(e, value) {
  if (isArray(value)) {
    const originalStop = e.stopImmediatePropagation;
    e.stopImmediatePropagation = () => {
      originalStop.call(e);
      e._stopped = true;
    };
    return value.map(
      (fn) => (e2) => !e2._stopped && fn && fn(e2)
    );
  } else {
    return value;
  }
}
const isNativeOn = (key) => key.charCodeAt(0) === 111 && key.charCodeAt(1) === 110 && // lowercase letter
key.charCodeAt(2) > 96 && key.charCodeAt(2) < 123;
const patchProp = (el, key, prevValue, nextValue, namespace, parentComponent) => {
  const isSVG = namespace === "svg";
  if (key === "class") {
    patchClass(el, nextValue, isSVG);
  } else if (key === "style") {
    patchStyle(el, prevValue, nextValue);
  } else if (isOn(key)) {
    if (!isModelListener(key)) {
      patchEvent(el, key, prevValue, nextValue, parentComponent);
    }
  } else if (key[0] === "." ? (key = key.slice(1), true) : key[0] === "^" ? (key = key.slice(1), false) : shouldSetAsProp(el, key, nextValue, isSVG)) {
    patchDOMProp(el, key, nextValue);
    if (!el.tagName.includes("-") && (key === "value" || key === "checked" || key === "selected")) {
      patchAttr(el, key, nextValue, isSVG, parentComponent, key !== "value");
    }
  } else if (
    // #11081 force set props for possible async custom element
    el._isVueCE && (/[A-Z]/.test(key) || !isString(nextValue))
  ) {
    patchDOMProp(el, camelize(key), nextValue, parentComponent, key);
  } else {
    if (key === "true-value") {
      el._trueValue = nextValue;
    } else if (key === "false-value") {
      el._falseValue = nextValue;
    }
    patchAttr(el, key, nextValue, isSVG);
  }
};
function shouldSetAsProp(el, key, value, isSVG) {
  if (isSVG) {
    if (key === "innerHTML" || key === "textContent") {
      return true;
    }
    if (key in el && isNativeOn(key) && isFunction(value)) {
      return true;
    }
    return false;
  }
  if (key === "spellcheck" || key === "draggable" || key === "translate" || key === "autocorrect") {
    return false;
  }
  if (key === "sandbox" && el.tagName === "IFRAME") {
    return false;
  }
  if (key === "form") {
    return false;
  }
  if (key === "list" && el.tagName === "INPUT") {
    return false;
  }
  if (key === "type" && el.tagName === "TEXTAREA") {
    return false;
  }
  if (key === "width" || key === "height") {
    const tag = el.tagName;
    if (tag === "IMG" || tag === "VIDEO" || tag === "CANVAS" || tag === "SOURCE") {
      return false;
    }
  }
  if (isNativeOn(key) && isString(value)) {
    return false;
  }
  return key in el;
}
const rendererOptions = /* @__PURE__ */ extend({ patchProp }, nodeOps);
let renderer;
function ensureRenderer() {
  return renderer || (renderer = createRenderer(rendererOptions));
}
const createApp = ((...args) => {
  const app = ensureRenderer().createApp(...args);
  const { mount } = app;
  app.mount = (containerOrSelector) => {
    const container = normalizeContainer(containerOrSelector);
    if (!container) return;
    const component = app._component;
    if (!isFunction(component) && !component.render && !component.template) {
      component.template = container.innerHTML;
    }
    if (container.nodeType === 1) {
      container.textContent = "";
    }
    const proxy = mount(container, false, resolveRootNamespace(container));
    if (container instanceof Element) {
      container.removeAttribute("v-cloak");
      container.setAttribute("data-v-app", "");
    }
    return proxy;
  };
  return app;
});
function resolveRootNamespace(container) {
  if (container instanceof SVGElement) {
    return "svg";
  }
  if (typeof MathMLElement === "function" && container instanceof MathMLElement) {
    return "mathml";
  }
}
function normalizeContainer(container) {
  if (isString(container)) {
    const res = document.querySelector(container);
    return res;
  }
  return container;
}
const _hoisted_1 = { style: { "border": "1px solid #ccc", "padding": "8px" } };
const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "HelloDelphine",
  props: {
    message: {}
  },
  setup(__props) {
    return (_ctx, _cache) => {
      return openBlock(), createElementBlock("div", _hoisted_1, [
        _cache[0] || (_cache[0] = createBaseVNode("h2", null, "VueJS", -1)),
        createTextVNode(" 👋 " + toDisplayString(__props.message), 1)
      ]);
    };
  }
});
function createHelloVuePlugin() {
  let app = null;
  const state = /* @__PURE__ */ reactive({ message: "BOBO" });
  return {
    id: "hello-vue",
    mount(container, props, _services) {
      state.message = props.message;
      app = createApp(_sfc_main, state);
      app.mount(container);
    },
    update(props) {
      state.message = props.message;
    },
    unmount() {
      app?.unmount();
      app = null;
    }
  };
}
console.log("🔥 I AM ZAZAVUE – ENTRY EXECUTED");
console.log("I AM ZAZAVUE");
console.log("I AM ZAZAVUE");
debugger;
class ZazaVue extends TForm {
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
    const btn = this.componentRegistry.get("button1");
    if (btn) btn.color = TColor.rgb(0, 0, 255);
  }
  onMyShown(_ev, _sender) {
    const btn = this.componentRegistry.get("buttonx");
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
    btn.enabled = false;
    console.log("Button1 clicked!!!!");
  }
  zaza_onclick(_ev, _sender) {
    const btn = this.componentRegistry.get("buttonx");
    btn.color = TColor.rgb(0, 255, 0);
    console.log("zazaVue clicked!!!!");
  }
  //installDelphineRuntime(runtime);
}
class MyApplication extends TApplication {
  zazaVue;
  constructor() {
    super();
    this.zazaVue = new ZazaVue("zazaVue");
    this.mainForm = this.zazaVue;
    PluginRegistry.pluginRegistry.register("hello-vue", { factory: createHelloVuePlugin });
  }
  run() {
    this.runWhenDomReady(() => {
      this.zazaVue.show();
    });
  }
}
const myApplication = new MyApplication();
myApplication.run();
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiemF6YVZ1ZS5jb21waWxlZC5qcyIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL3ZjbC9yZWdpc3RlclZjbC50cyIsIi4uLy4uLy4uL3NyYy92Y2wvU3RkQ3RybHMudHMiLCIuLi9ub2RlX21vZHVsZXMvQHZ1ZS9zaGFyZWQvZGlzdC9zaGFyZWQuZXNtLWJ1bmRsZXIuanMiLCIuLi9ub2RlX21vZHVsZXMvQHZ1ZS9yZWFjdGl2aXR5L2Rpc3QvcmVhY3Rpdml0eS5lc20tYnVuZGxlci5qcyIsIi4uL25vZGVfbW9kdWxlcy9AdnVlL3J1bnRpbWUtY29yZS9kaXN0L3J1bnRpbWUtY29yZS5lc20tYnVuZGxlci5qcyIsIi4uL25vZGVfbW9kdWxlcy9AdnVlL3J1bnRpbWUtZG9tL2Rpc3QvcnVudGltZS1kb20uZXNtLWJ1bmRsZXIuanMiLCIuLi9zcmMvY29tcG9uZW50cy9IZWxsb0RlbHBoaW5lLnZ1ZSIsIi4uL3NyYy9jcmVhdGVIZWxsb1Z1ZVBsdWdpbi50cyIsIi4uL3NyYy96YXphVnVlLnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIEVuZ2xpc2ggY29tbWVudHMgYXMgcmVxdWVzdGVkLlxuXG4vL2ltcG9ydCB7IENvbXBvbmVudFR5cGVSZWdpc3RyeSB9IGZyb20gJ0BkcnQnO1xuaW1wb3J0IHsgVEJ1dHRvbiwgVE1ldGFDb21wb25lbnQsIFRGb3JtLCBUQ29tcG9uZW50LCBUQ29tcG9uZW50VHlwZVJlZ2lzdHJ5LCBUTWV0YUJ1dHRvbiwgVE1ldGFQbHVnaW5Ib3N0IH0gZnJvbSAnQHZjbCc7XG4vL2ltcG9ydCB7IFRNZXRhUGx1Z2luSG9zdCB9IGZyb20gJy4uL2RydC9VSVBsdWdpbic7IC8vIE5PVCBHT09EICEgaW1wb3J0IFZDTCFcblxuLy8gRW5nbGlzaCBjb21tZW50cyBhcyByZXF1ZXN0ZWQuXG5leHBvcnQgZnVuY3Rpb24gcmVnaXN0ZXJCdWlsdGlucyh0eXBlczogVENvbXBvbmVudFR5cGVSZWdpc3RyeSkge1xuICAgICAgICB0eXBlcy5yZWdpc3RlcihUTWV0YUJ1dHRvbi5tZXRhY2xhc3MpO1xuICAgICAgICB0eXBlcy5yZWdpc3RlcihUTWV0YVBsdWdpbkhvc3QubWV0YUNsYXNzKTtcbiAgICAgICAgLy8gdHlwZXMucmVnaXN0ZXIoVEVkaXRDbGFzcyk7XG4gICAgICAgIC8vIHR5cGVzLnJlZ2lzdGVyKFRMYWJlbENsYXNzKTtcbn1cbiIsImltcG9ydCB7IHJlZ2lzdGVyQnVpbHRpbnMgfSBmcm9tICcuL3JlZ2lzdGVyVmNsJztcblxuLypcbiAgIFRvIGNyZWF0ZSBhIG5ldyBjb21wb25lbnQgdHlwZTpcblxuICAgVG8gY3JlYXRlIGEgbmV3IGNvbXBvbmVudCBhdHRyaWJ1dFxuXG4qL1xuXG5leHBvcnQgdHlwZSBDb21wb25lbnRGYWN0b3J5ID0gKG5hbWU6IHN0cmluZywgZm9ybTogVEZvcm0sIG93bmVyOiBUQ29tcG9uZW50KSA9PiBUQ29tcG9uZW50O1xuXG5leHBvcnQgdHlwZSBKc29uID0gbnVsbCB8IGJvb2xlYW4gfCBudW1iZXIgfCBzdHJpbmcgfCBKc29uW10gfCB7IFtrZXk6IHN0cmluZ106IEpzb24gfTtcblxudHlwZSBQcm9wS2luZCA9ICdzdHJpbmcnIHwgJ251bWJlcicgfCAnYm9vbGVhbicgfCAnY29sb3InIHwgJ2hhbmRsZXInO1xuZXhwb3J0IHR5cGUgUHJvcFNwZWM8VCwgViA9IHVua25vd24+ID0ge1xuICAgICAgICBuYW1lOiBzdHJpbmc7XG4gICAgICAgIGtpbmQ6IFByb3BLaW5kO1xuICAgICAgICBhcHBseTogKG9iajogVCwgdmFsdWU6IFYpID0+IHZvaWQ7XG59O1xuXG5leHBvcnQgaW50ZXJmYWNlIElQbHVnaW5Ib3N0IHtcbiAgICAgICAgc2V0UGx1Z2luU3BlYyhzcGVjOiB7IHBsdWdpbjogc3RyaW5nIHwgbnVsbDsgcHJvcHM6IGFueSB9KTogdm9pZDtcbiAgICAgICAgbW91bnRQbHVnaW5JZlJlYWR5KHNlcnZpY2VzOiBEZWxwaGluZVNlcnZpY2VzKTogdm9pZDtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBEZWxwaGluZUxvZ2dlciB7XG4gICAgICAgIGRlYnVnKG1zZzogc3RyaW5nLCBkYXRhPzogSnNvbik6IHZvaWQ7XG4gICAgICAgIGluZm8obXNnOiBzdHJpbmcsIGRhdGE/OiBKc29uKTogdm9pZDtcbiAgICAgICAgd2Fybihtc2c6IHN0cmluZywgZGF0YT86IEpzb24pOiB2b2lkO1xuICAgICAgICBlcnJvcihtc2c6IHN0cmluZywgZGF0YT86IEpzb24pOiB2b2lkO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIERlbHBoaW5lRXZlbnRCdXMge1xuICAgICAgICAvLyBTdWJzY3JpYmUgdG8gYW4gYXBwIGV2ZW50LlxuICAgICAgICBvbihldmVudE5hbWU6IHN0cmluZywgaGFuZGxlcjogKHBheWxvYWQ6IEpzb24pID0+IHZvaWQpOiAoKSA9PiB2b2lkO1xuXG4gICAgICAgIC8vIFB1Ymxpc2ggYW4gYXBwIGV2ZW50LlxuICAgICAgICBlbWl0KGV2ZW50TmFtZTogc3RyaW5nLCBwYXlsb2FkOiBKc29uKTogdm9pZDtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBEZWxwaGluZVN0b3JhZ2Uge1xuICAgICAgICBnZXQoa2V5OiBzdHJpbmcpOiBQcm9taXNlPEpzb24gfCB1bmRlZmluZWQ+O1xuICAgICAgICBzZXQoa2V5OiBzdHJpbmcsIHZhbHVlOiBKc29uKTogUHJvbWlzZTx2b2lkPjtcbiAgICAgICAgcmVtb3ZlKGtleTogc3RyaW5nKTogUHJvbWlzZTx2b2lkPjtcbn1cbmV4cG9ydCBpbnRlcmZhY2UgRGVscGhpbmVTZXJ2aWNlcyB7XG4gICAgICAgIGxvZzoge1xuICAgICAgICAgICAgICAgIGRlYnVnKG1zZzogc3RyaW5nLCBkYXRhPzogYW55KTogdm9pZDtcbiAgICAgICAgICAgICAgICBpbmZvKG1zZzogc3RyaW5nLCBkYXRhPzogYW55KTogdm9pZDtcbiAgICAgICAgICAgICAgICB3YXJuKG1zZzogc3RyaW5nLCBkYXRhPzogYW55KTogdm9pZDtcbiAgICAgICAgICAgICAgICBlcnJvcihtc2c6IHN0cmluZywgZGF0YT86IGFueSk6IHZvaWQ7XG4gICAgICAgIH07XG5cbiAgICAgICAgYnVzOiB7XG4gICAgICAgICAgICAgICAgb24oZXZlbnQ6IHN0cmluZywgaGFuZGxlcjogKHBheWxvYWQ6IGFueSkgPT4gdm9pZCk6ICgpID0+IHZvaWQ7XG4gICAgICAgICAgICAgICAgZW1pdChldmVudDogc3RyaW5nLCBwYXlsb2FkOiBhbnkpOiB2b2lkO1xuICAgICAgICB9O1xuXG4gICAgICAgIHN0b3JhZ2U6IHtcbiAgICAgICAgICAgICAgICBnZXQoa2V5OiBzdHJpbmcpOiBQcm9taXNlPGFueT4gfCBudWxsO1xuICAgICAgICAgICAgICAgIHNldChrZXk6IHN0cmluZywgdmFsdWU6IGFueSk6IFByb21pc2U8dm9pZD4gfCBudWxsO1xuICAgICAgICAgICAgICAgIHJlbW92ZShrZXk6IHN0cmluZyk6IFByb21pc2U8dm9pZD4gfCBudWxsO1xuICAgICAgICB9O1xuXG4gICAgICAgIC8vIGZ1dHVyXG4gICAgICAgIC8vIGkxOG4/OiAuLi5cbiAgICAgICAgLy8gbmF2PzogLi4uXG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgVUlQbHVnaW5JbnN0YW5jZTxQcm9wcyBleHRlbmRzIEpzb24gPSBKc29uPiB7XG4gICAgICAgIHJlYWRvbmx5IGlkOiBzdHJpbmc7XG5cbiAgICAgICAgLy8gQ2FsbGVkIGV4YWN0bHkgb25jZSBhZnRlciBjcmVhdGlvbiAoZm9yIGEgZ2l2ZW4gaW5zdGFuY2UpLlxuICAgICAgICBtb3VudChjb250YWluZXI6IEhUTUxFbGVtZW50LCBwcm9wczogUHJvcHMsIHNlcnZpY2VzOiBEZWxwaGluZVNlcnZpY2VzKTogdm9pZDtcblxuICAgICAgICAvLyBDYWxsZWQgYW55IHRpbWUgcHJvcHMgY2hhbmdlIChtYXkgYmUgZnJlcXVlbnQpLlxuICAgICAgICB1cGRhdGUocHJvcHM6IFByb3BzKTogdm9pZDtcblxuICAgICAgICAvLyBDYWxsZWQgZXhhY3RseSBvbmNlIGJlZm9yZSBkaXNwb3NhbC5cbiAgICAgICAgdW5tb3VudCgpOiB2b2lkO1xuXG4gICAgICAgIC8vIE9wdGlvbmFsIGVyZ29ub21pY3MuXG4gICAgICAgIGdldFNpemVIaW50cz8oKTogbnVtYmVyO1xuICAgICAgICBmb2N1cz8oKTogdm9pZDtcblxuICAgICAgICAvLyBPcHRpb25hbCBwZXJzaXN0ZW5jZSBob29rIChEZWxwaGluZSBtYXkgc3RvcmUgJiByZXN0b3JlIHRoaXMpLlxuICAgICAgICBzZXJpYWxpemVTdGF0ZT8oKTogSnNvbjtcbn1cblxuZXhwb3J0IGFic3RyYWN0IGNsYXNzIFRNZXRhY2xhc3Mge1xuICAgICAgICByZWFkb25seSB0eXBlTmFtZTogc3RyaW5nID0gJ1RNZXRhY2xhc3MnO1xuICAgICAgICBzdGF0aWMgbWV0YWNsYXNzOiBUTWV0YWNsYXNzO1xuICAgICAgICByZWFkb25seSBzdXBlckNsYXNzOiBUTWV0YWNsYXNzIHwgbnVsbCA9IG51bGw7XG5cbiAgICAgICAgYWJzdHJhY3QgZ2V0TWV0YWNsYXNzKCk6IFRNZXRhY2xhc3M7XG4gICAgICAgIHByb3RlY3RlZCBjb25zdHJ1Y3RvcihzdXBlckNsYXNzOiBUTWV0YWNsYXNzIHwgbnVsbCwgdHlwZU5hbWUgPSAnVE1ldGFjbGFzcycpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnN1cGVyQ2xhc3MgPSBzdXBlckNsYXNzO1xuICAgICAgICAgICAgICAgIHRoaXMudHlwZU5hbWUgPSB0eXBlTmFtZTtcbiAgICAgICAgfVxufVxuXG5leHBvcnQgY2xhc3MgVE9iamVjdCB7XG4gICAgICAgIGdldE1ldGFDbGFzcygpOiBUTWV0YU9iamVjdCB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIFRNZXRhT2JqZWN0Lm1ldGFDbGFzcztcbiAgICAgICAgfVxufVxuXG5leHBvcnQgY2xhc3MgVE1ldGFPYmplY3QgZXh0ZW5kcyBUTWV0YWNsYXNzIHtcbiAgICAgICAgc3RhdGljIHJlYWRvbmx5IG1ldGFDbGFzczogVE1ldGFPYmplY3QgPSBuZXcgVE1ldGFPYmplY3QoVE1ldGFjbGFzcy5tZXRhY2xhc3MpO1xuXG4gICAgICAgIGdldE1ldGFjbGFzcygpOiBUTWV0YU9iamVjdCB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIFRNZXRhT2JqZWN0Lm1ldGFDbGFzcztcbiAgICAgICAgfVxuICAgICAgICBjb25zdHJ1Y3RvcihzdXBlckNsYXNzOiBUTWV0YWNsYXNzKSB7XG4gICAgICAgICAgICAgICAgc3VwZXIoc3VwZXJDbGFzcywgJ1RPYmplY3QnKTtcbiAgICAgICAgfVxufVxuXG5leHBvcnQgY2xhc3MgVE1ldGFDb21wb25lbnQgZXh0ZW5kcyBUTWV0YWNsYXNzIHtcbiAgICAgICAgc3RhdGljIHJlYWRvbmx5IG1ldGFjbGFzczogVE1ldGFDb21wb25lbnQgPSBuZXcgVE1ldGFDb21wb25lbnQoVE1ldGFjbGFzcy5tZXRhY2xhc3MpO1xuICAgICAgICAvLyBUaGUgc3ltYm9saWMgbmFtZSB1c2VkIGluIEhUTUw6IGRhdGEtY29tcG9uZW50PVwiVEJ1dHRvblwiIG9yIFwibXktYnV0dG9uXCJcbiAgICAgICAgcHJvdGVjdGVkIGNvbnN0cnVjdG9yKHN1cGVyQ2xhc3M6IFRNZXRhY2xhc3MpIHtcbiAgICAgICAgICAgICAgICBzdXBlcihzdXBlckNsYXNzLCAnVENvbXBvbmVudCcpO1xuICAgICAgICB9XG5cbiAgICAgICAgZ2V0TWV0YWNsYXNzKCk6IFRNZXRhQ29tcG9uZW50IHtcbiAgICAgICAgICAgICAgICByZXR1cm4gVE1ldGFDb21wb25lbnQubWV0YWNsYXNzO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gQ3JlYXRlIHRoZSBydW50aW1lIGluc3RhbmNlIGFuZCBhdHRhY2ggaXQgdG8gdGhlIERPTSBlbGVtZW50LlxuICAgICAgICBjcmVhdGUobmFtZTogc3RyaW5nLCBmb3JtOiBURm9ybSwgcGFyZW50OiBUQ29tcG9uZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBUQ29tcG9uZW50KG5hbWUsIGZvcm0sIHBhcmVudCk7XG4gICAgICAgIH1cblxuICAgICAgICAvL2RvbUV2ZW50cz8oKTogc3RyaW5nW107IC8vIGRlZmF1bHQgW107XG5cbiAgICAgICAgLypcbiAgICAgICAgLy8gT3B0aW9uYWw6IHBhcnNlIEhUTUwgYXR0cmlidXRlcyAtPiBwcm9wcy9zdGF0ZVxuICAgICAgICAvLyBFeGFtcGxlOiBkYXRhLWNhcHRpb249XCJPS1wiIC0+IHsgY2FwdGlvbjogXCJPS1wiIH1cbiAgICAgICAgcGFyc2VQcm9wcz8oZWxlbTogSFRNTEVsZW1lbnQpOiBKc29uO1xuXG4gICAgICAgIC8vIE9wdGlvbmFsOiBhcHBseSBwcm9wcyB0byB0aGUgY29tcG9uZW50IChjYW4gYmUgY2FsbGVkIGFmdGVyIGNyZWF0ZSlcbiAgICAgICAgYXBwbHlQcm9wcz8oYzogVCwgcHJvcHM6IEpzb24pOiB2b2lkO1xuXG4gICAgICAgIC8vIE9wdGlvbmFsOiBEZXNpZ24tdGltZSBtZXRhZGF0YSAocGFsZXR0ZSwgaW5zcGVjdG9yLCBldGMuKVxuICAgICAgICBkZXNpZ25UaW1lPzoge1xuICAgICAgICAgICAgICAgIHBhbGV0dGVHcm91cD86IHN0cmluZztcbiAgICAgICAgICAgICAgICBkaXNwbGF5TmFtZT86IHN0cmluZztcbiAgICAgICAgICAgICAgICBpY29uPzogc3RyaW5nOyAvLyBsYXRlclxuICAgICAgICAgICAgICAgIC8vIHByb3BlcnR5IHNjaGVtYSBjb3VsZCBsaXZlIGhlcmVcbiAgICAgICAgfTtcbiAgICAgICAgKi9cbiAgICAgICAgZGVmUHJvcHMoKTogUHJvcFNwZWM8YW55PltdIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gW1xuICAgICAgICAgICAgICAgICAgICAgICAgeyBuYW1lOiAnY29sb3InLCBraW5kOiAnY29sb3InLCBhcHBseTogKG8sIHYpID0+IChvLmNvbG9yID0gbmV3IFRDb2xvcihTdHJpbmcodikpKSB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgeyBuYW1lOiAnb25jbGljaycsIGtpbmQ6ICdoYW5kbGVyJywgYXBwbHk6IChvLCB2KSA9PiAoby5vbmNsaWNrID0gbmV3IFRIYW5kbGVyKFN0cmluZyh2KSkpIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICB7IG5hbWU6ICdvbmNyZWF0ZScsIGtpbmQ6ICdoYW5kbGVyJywgYXBwbHk6IChvLCB2KSA9PiAoby5vbmNyZWF0ZSA9IG5ldyBUSGFuZGxlcihTdHJpbmcodikpKSB9XG4gICAgICAgICAgICAgICAgXTtcbiAgICAgICAgfVxuICAgICAgICAvLyBQYXJzZSBIVE1MIGF0dHJpYnV0ZXMgaW50byBhIHBsYWluIG9iamVjdFxuICAgICAgICBwYXJzZVByb3BzRnJvbUVsZW1lbnQoZWw6IEVsZW1lbnQpOiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPiB7XG4gICAgICAgICAgICAgICAgY29uc3Qgb3V0OiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPiA9IHt9O1xuXG4gICAgICAgICAgICAgICAgLy8gMSkgSlNPTiBidWxrXG4gICAgICAgICAgICAgICAgY29uc3QgcmF3ID0gZWwuZ2V0QXR0cmlidXRlKCdkYXRhLXByb3BzJyk7XG4gICAgICAgICAgICAgICAgaWYgKHJhdykge1xuICAgICAgICAgICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgT2JqZWN0LmFzc2lnbihvdXQsIEpTT04ucGFyc2UocmF3KSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ0ludmFsaWQgSlNPTiBpbiBkYXRhLXByb3BzJywgcmF3LCBlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvLyAyKSBXaGl0ZWxpc3Q6IG9ubHkgZGVjbGFyZWQgcHJvcHMgb3ZlcnJpZGUgLyBjb21wbGVtZW50XG4gICAgICAgICAgICAgICAgZm9yIChjb25zdCBwIG9mIHRoaXMuZGVmUHJvcHMoKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgYXR0ciA9IGVsLmdldEF0dHJpYnV0ZShgZGF0YS0ke3AubmFtZX1gKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChhdHRyICE9PSBudWxsKSBvdXRbcC5uYW1lXSA9IGF0dHI7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgcmV0dXJuIG91dDtcbiAgICAgICAgfVxuXG4gICAgICAgIGFwcGx5UHJvcHMob2JqOiBhbnksIHZhbHVlczogUmVjb3JkPHN0cmluZywgdW5rbm93bj4pIHtcbiAgICAgICAgICAgICAgICBmb3IgKGNvbnN0IHAgb2YgdGhpcy5kZWZQcm9wcygpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKHZhbHVlcywgcC5uYW1lKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwLmFwcGx5KG9iaiwgdmFsdWVzW3AubmFtZV0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8qXG4gICAgICAgIGFwcGx5UHJvcHNGcm9tRWxlbWVudChvYmo6IGFueSwgZWw6IEVsZW1lbnQpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBwcm9wcyA9IHRoaXMucGFyc2VQcm9wc0Zyb21FbGVtZW50KGVsKTtcbiAgICAgICAgICAgICAgICB0aGlzLmFwcGx5UHJvcHMob2JqLCBwcm9wcyk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHByb3BzO1xuICAgICAgICB9XG4gICAgICAgICAgICAgICAgKi9cbiAgICAgICAgLy8gQXBwbHkgcGFyc2VkIHByb3BzIHRvIHRoZSBjb21wb25lbnQgaW5zdGFuY2VcblxuICAgICAgICBkb21FdmVudHM/KCk6IHN0cmluZ1tdOyAvLyBkZWZhdWx0IFtdO1xufVxuXG50eXBlIENvbXBvbmVudFByb3BzID0ge1xuICAgICAgICBvbmNsaWNrPzogVEhhbmRsZXI7XG4gICAgICAgIG9uY3JlYXRlPzogVEhhbmRsZXI7XG4gICAgICAgIGNvbG9yPzogVENvbG9yOyAvLyBvdSBUQ29sb3IsIGV0Yy5cbiAgICAgICAgbmFtZT86IHN0cmluZztcbiAgICAgICAgY29tcG9uZW50Pzogc3RyaW5nO1xuICAgICAgICBlbmFibGVkPzogYm9vbGVhbjtcbn07XG5cbmV4cG9ydCBjbGFzcyBUQ29tcG9uZW50IHtcbiAgICAgICAgZ2V0TWV0YWNsYXNzKCk6IFRNZXRhQ29tcG9uZW50IHtcbiAgICAgICAgICAgICAgICByZXR1cm4gVE1ldGFDb21wb25lbnQubWV0YWNsYXNzO1xuICAgICAgICB9XG5cbiAgICAgICAgcmVhZG9ubHkgbmFtZTogc3RyaW5nO1xuICAgICAgICByZWFkb25seSBwYXJlbnQ6IFRDb21wb25lbnQgfCBudWxsID0gbnVsbDtcbiAgICAgICAgZm9ybTogVEZvcm0gfCBudWxsID0gbnVsbDtcbiAgICAgICAgY2hpbGRyZW46IFRDb21wb25lbnRbXSA9IFtdO1xuXG4gICAgICAgIGVsZW06IEVsZW1lbnQgfCBudWxsID0gbnVsbDtcbiAgICAgICAgZ2V0IGh0bWxFbGVtZW50KCk6IEhUTUxFbGVtZW50IHwgbnVsbCB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuZWxlbSBhcyBIVE1MRWxlbWVudCB8IG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3RydWN0b3IobmFtZTogc3RyaW5nLCBmb3JtOiBURm9ybSB8IG51bGwsIHBhcmVudDogVENvbXBvbmVudCB8IG51bGwpIHtcbiAgICAgICAgICAgICAgICB0aGlzLm5hbWUgPSBuYW1lO1xuICAgICAgICAgICAgICAgIHRoaXMucGFyZW50ID0gcGFyZW50O1xuICAgICAgICAgICAgICAgIHBhcmVudD8uY2hpbGRyZW4ucHVzaCh0aGlzKTtcbiAgICAgICAgICAgICAgICB0aGlzLmZvcm0gPSBmb3JtO1xuICAgICAgICAgICAgICAgIHRoaXMubmFtZSA9IG5hbWU7XG4gICAgICAgIH1cblxuICAgICAgICBkZWNsYXJlIHByb3BzOiBDb21wb25lbnRQcm9wcztcblxuICAgICAgICAvKiogTWF5IGNvbnRhaW4gY2hpbGQgY29tcG9uZW50cyAqL1xuICAgICAgICBhbGxvd3NDaGlsZHJlbigpOiBib29sZWFuIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cblxuICAgICAgICBnZXQgY29sb3IoKTogVENvbG9yIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gbmV3IFRDb2xvcih0aGlzLmdldFN0eWxlUHJvcCgnY29sb3InKSk7XG4gICAgICAgIH1cbiAgICAgICAgc2V0IGNvbG9yKHY6IFRDb2xvcikge1xuICAgICAgICAgICAgICAgIHRoaXMuc2V0U3R5bGVQcm9wKCdjb2xvcicsIHYucyk7XG4gICAgICAgIH1cblxuICAgICAgICBnZXQgYmFja2dyb3VuZENvbG9yKCk6IFRDb2xvciB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBUQ29sb3IodGhpcy5nZXRTdHlsZVByb3AoJ2JhY2tncm91bmQtY29sb3InKSk7XG4gICAgICAgIH1cbiAgICAgICAgc2V0IGJhY2tncm91bmRDb2xvcih2OiBUQ29sb3IpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnNldFN0eWxlUHJvcCgnYmFja2dyb3VuZC1jb2xvcicsIHYucyk7XG4gICAgICAgIH1cblxuICAgICAgICBnZXQgd2lkdGgoKTogbnVtYmVyIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcGFyc2VJbnQodGhpcy5nZXRTdHlsZVByb3AoJ3dpZHRoJykpO1xuICAgICAgICB9XG4gICAgICAgIHNldCB3aWR0aCh2OiBudW1iZXIpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnNldFN0eWxlUHJvcCgnd2lkdGgnLCB2LnRvU3RyaW5nKCkpO1xuICAgICAgICB9XG5cbiAgICAgICAgZ2V0IGhlaWdodCgpOiBudW1iZXIge1xuICAgICAgICAgICAgICAgIHJldHVybiBwYXJzZUludCh0aGlzLmdldFN0eWxlUHJvcCgnaGVpZ2h0JykpO1xuICAgICAgICB9XG4gICAgICAgIHNldCBoZWlnaHQodjogbnVtYmVyKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5zZXRTdHlsZVByb3AoJ2hlaWdodCcsIHYudG9TdHJpbmcoKSk7XG4gICAgICAgIH1cblxuICAgICAgICBnZXQgb2Zmc2V0V2lkdGgoKTogbnVtYmVyIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5odG1sRWxlbWVudCEub2Zmc2V0V2lkdGg7XG4gICAgICAgIH1cbiAgICAgICAgZ2V0IG9mZnNldEhlaWdodCgpOiBudW1iZXIge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmh0bWxFbGVtZW50IS5vZmZzZXRIZWlnaHQ7XG4gICAgICAgIH1cblxuICAgICAgICBzZXRTdHlsZVByb3AobmFtZTogc3RyaW5nLCB2YWx1ZTogc3RyaW5nKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5odG1sRWxlbWVudCEuc3R5bGUuc2V0UHJvcGVydHkobmFtZSwgdmFsdWUpO1xuICAgICAgICB9XG5cbiAgICAgICAgZ2V0U3R5bGVQcm9wKG5hbWU6IHN0cmluZykge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmh0bWxFbGVtZW50IS5zdHlsZS5nZXRQcm9wZXJ0eVZhbHVlKG5hbWUpO1xuICAgICAgICB9XG5cbiAgICAgICAgc2V0UHJvcChuYW1lOiBzdHJpbmcsIHZhbHVlOiBzdHJpbmcpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmh0bWxFbGVtZW50IS5zZXRBdHRyaWJ1dGUobmFtZSwgdmFsdWUpO1xuICAgICAgICB9XG5cbiAgICAgICAgZ2V0UHJvcChuYW1lOiBzdHJpbmcpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcyEuaHRtbEVsZW1lbnQhLmdldEF0dHJpYnV0ZShuYW1lKTtcbiAgICAgICAgfVxufVxuXG5leHBvcnQgY2xhc3MgVE1ldGFDb21wb25lbnRUeXBlUmVnaXN0cnkgZXh0ZW5kcyBUTWV0YU9iamVjdCB7XG4gICAgICAgIHN0YXRpYyByZWFkb25seSBtZXRhY2xhc3M6IFRNZXRhQ29tcG9uZW50VHlwZVJlZ2lzdHJ5ID0gbmV3IFRNZXRhQ29tcG9uZW50VHlwZVJlZ2lzdHJ5KFRNZXRhT2JqZWN0Lm1ldGFDbGFzcyk7XG4gICAgICAgIHByb3RlY3RlZCBjb25zdHJ1Y3RvcihzdXBlckNsYXNzOiBUTWV0YU9iamVjdCkge1xuICAgICAgICAgICAgICAgIHN1cGVyKHN1cGVyQ2xhc3MpO1xuICAgICAgICAgICAgICAgIC8vIGV0IHZvdXMgY2hhbmdleiBqdXN0ZSBsZSBub20gOlxuICAgICAgICAgICAgICAgICh0aGlzIGFzIGFueSkudHlwZU5hbWUgPSAnVE9iamVjdCc7XG4gICAgICAgIH1cbiAgICAgICAgZ2V0TWV0YWNsYXNzKCk6IFRNZXRhQ29tcG9uZW50VHlwZVJlZ2lzdHJ5IHtcbiAgICAgICAgICAgICAgICByZXR1cm4gVE1ldGFDb21wb25lbnRUeXBlUmVnaXN0cnkubWV0YWNsYXNzO1xuICAgICAgICB9XG59XG5cbmV4cG9ydCBjbGFzcyBUQ29tcG9uZW50VHlwZVJlZ2lzdHJ5IGV4dGVuZHMgVE9iamVjdCB7XG4gICAgICAgIC8vIFdlIHN0b3JlIGhldGVyb2dlbmVvdXMgbWV0YXMsIHNvIHdlIGtlZXAgdGhlbSBhcyBUTWV0YUNvbXBvbmVudDxhbnk+LlxuICAgICAgICBnZXRNZXRhY2xhc3MoKTogVE1ldGFDb21wb25lbnRUeXBlUmVnaXN0cnkge1xuICAgICAgICAgICAgICAgIHJldHVybiBUTWV0YUNvbXBvbmVudFR5cGVSZWdpc3RyeS5tZXRhQ2xhc3M7XG4gICAgICAgIH1cbiAgICAgICAgcHJpdmF0ZSByZWFkb25seSBjbGFzc2VzID0gbmV3IE1hcDxzdHJpbmcsIFRNZXRhQ29tcG9uZW50PigpO1xuXG4gICAgICAgIHJlZ2lzdGVyKG1ldGE6IFRNZXRhQ29tcG9uZW50KSB7XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuY2xhc3Nlcy5oYXMobWV0YS50eXBlTmFtZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgQ29tcG9uZW50IHR5cGUgYWxyZWFkeSByZWdpc3RlcmVkOiAke21ldGEudHlwZU5hbWV9YCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHRoaXMuY2xhc3Nlcy5zZXQobWV0YS50eXBlTmFtZSwgbWV0YSk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBJZiB5b3UganVzdCBuZWVkIFwic29tZXRoaW5nIG1ldGFcIiwgcmV0dXJuIGFueS1tZXRhLlxuICAgICAgICBnZXQodHlwZU5hbWU6IHN0cmluZyk6IFRNZXRhQ29tcG9uZW50IHwgdW5kZWZpbmVkIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5jbGFzc2VzLmdldCh0eXBlTmFtZSk7XG4gICAgICAgIH1cblxuICAgICAgICBoYXModHlwZU5hbWU6IHN0cmluZyk6IGJvb2xlYW4ge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmNsYXNzZXMuaGFzKHR5cGVOYW1lKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGxpc3QoKTogc3RyaW5nW10ge1xuICAgICAgICAgICAgICAgIHJldHVybiBbLi4udGhpcy5jbGFzc2VzLmtleXMoKV0uc29ydCgpO1xuICAgICAgICB9XG59XG5cbmV4cG9ydCBjbGFzcyBUQ29sb3Ige1xuICAgICAgICBzOiBzdHJpbmc7XG5cbiAgICAgICAgY29uc3RydWN0b3Ioczogc3RyaW5nKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5zID0gcztcbiAgICAgICAgfVxuICAgICAgICAvKiBmYWN0b3J5ICovIHN0YXRpYyByZ2IocjogbnVtYmVyLCBnOiBudW1iZXIsIGI6IG51bWJlcik6IFRDb2xvciB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBUQ29sb3IoYHJnYigke3J9LCAke2d9LCAke2J9KWApO1xuICAgICAgICB9XG4gICAgICAgIC8qIGZhY3RvcnkgKi8gc3RhdGljIHJnYmEocjogbnVtYmVyLCBnOiBudW1iZXIsIGI6IG51bWJlciwgYTogbnVtYmVyKTogVENvbG9yIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gbmV3IFRDb2xvcihgcmdiYSgke3J9LCAke2d9LCAke2J9LCAke2F9KWApO1xuICAgICAgICB9XG59XG5cbmV4cG9ydCBjbGFzcyBUSGFuZGxlciB7XG4gICAgICAgIHM6IHN0cmluZztcblxuICAgICAgICBjb25zdHJ1Y3RvcihzOiBzdHJpbmcpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnMgPSBzO1xuICAgICAgICB9XG59XG5cbmV4cG9ydCBjbGFzcyBUTWV0YUNvbXBvbmVudFJlZ2lzdHJ5IGV4dGVuZHMgVE1ldGFjbGFzcyB7XG4gICAgICAgIHN0YXRpYyByZWFkb25seSBtZXRhY2xhc3M6IFRNZXRhQ29tcG9uZW50UmVnaXN0cnkgPSBuZXcgVE1ldGFDb21wb25lbnRSZWdpc3RyeShUTWV0YWNsYXNzLm1ldGFjbGFzcyk7XG5cbiAgICAgICAgcHJvdGVjdGVkIGNvbnN0cnVjdG9yKHN1cGVyQ2xhc3M6IFRNZXRhY2xhc3MpIHtcbiAgICAgICAgICAgICAgICBzdXBlcihzdXBlckNsYXNzLCAnVENvbXBvbmVudFJlZ2lzdHJ5Jyk7XG4gICAgICAgIH1cbiAgICAgICAgZ2V0TWV0YWNsYXNzKCk6IFRNZXRhQ29tcG9uZW50UmVnaXN0cnkge1xuICAgICAgICAgICAgICAgIHJldHVybiBUTWV0YUNvbXBvbmVudFJlZ2lzdHJ5Lm1ldGFjbGFzcztcbiAgICAgICAgfVxufVxuXG5leHBvcnQgY2xhc3MgVENvbXBvbmVudFJlZ2lzdHJ5IGV4dGVuZHMgVE9iamVjdCB7XG4gICAgICAgIGdldE1ldGFjbGFzcygpOiBUTWV0YUNvbXBvbmVudFJlZ2lzdHJ5IHtcbiAgICAgICAgICAgICAgICByZXR1cm4gVE1ldGFDb21wb25lbnRSZWdpc3RyeS5tZXRhY2xhc3M7XG4gICAgICAgIH1cblxuICAgICAgICBwcml2YXRlIGluc3RhbmNlcyA9IG5ldyBNYXA8c3RyaW5nLCBUQ29tcG9uZW50PigpO1xuXG4gICAgICAgIGxvZ2dlciA9IHtcbiAgICAgICAgICAgICAgICBkZWJ1Zyhtc2c6IHN0cmluZywgZGF0YT86IEpzb24pOiB2b2lkIHt9LFxuICAgICAgICAgICAgICAgIGluZm8obXNnOiBzdHJpbmcsIGRhdGE/OiBKc29uKTogdm9pZCB7fSxcbiAgICAgICAgICAgICAgICB3YXJuKG1zZzogc3RyaW5nLCBkYXRhPzogSnNvbik6IHZvaWQge30sXG4gICAgICAgICAgICAgICAgZXJyb3IobXNnOiBzdHJpbmcsIGRhdGE/OiBKc29uKTogdm9pZCB7fVxuICAgICAgICB9O1xuXG4gICAgICAgIGV2ZW50QnVzID0ge1xuICAgICAgICAgICAgICAgIG9uKGV2ZW50OiBzdHJpbmcsIGhhbmRsZXI6IChwYXlsb2FkOiBhbnkpID0+IHZvaWQpOiAoKSA9PiB2b2lkIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAoKSA9PiB2b2lkIHt9O1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgZW1pdChldmVudDogc3RyaW5nLCBwYXlsb2FkOiBhbnkpOiB2b2lkIHt9XG4gICAgICAgIH07XG5cbiAgICAgICAgc3RvcmFnZSA9IHtcbiAgICAgICAgICAgICAgICBnZXQoa2V5OiBzdHJpbmcpOiBQcm9taXNlPGFueT4gfCBudWxsIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgc2V0KGtleTogc3RyaW5nLCB2YWx1ZTogYW55KTogUHJvbWlzZTx2b2lkPiB8IG51bGwge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICByZW1vdmUoa2V5OiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHwgbnVsbCB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgIH07XG5cbiAgICAgICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgICAgICAgICAgc3VwZXIoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJlZ2lzdGVySW5zdGFuY2UobmFtZTogc3RyaW5nLCBjOiBUQ29tcG9uZW50KSB7XG4gICAgICAgICAgICAgICAgdGhpcy5pbnN0YW5jZXMuc2V0KG5hbWUsIGMpO1xuICAgICAgICB9XG4gICAgICAgIGdldDxUIGV4dGVuZHMgVENvbXBvbmVudCA9IFRDb21wb25lbnQ+KG5hbWU6IHN0cmluZyk6IFQgfCB1bmRlZmluZWQge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmluc3RhbmNlcy5nZXQobmFtZSkgYXMgVCB8IHVuZGVmaW5lZDtcbiAgICAgICAgfVxuXG4gICAgICAgIHNlcnZpY2VzOiBEZWxwaGluZVNlcnZpY2VzID0ge1xuICAgICAgICAgICAgICAgIGxvZzogdGhpcy5sb2dnZXIsXG4gICAgICAgICAgICAgICAgYnVzOiB0aGlzLmV2ZW50QnVzLFxuICAgICAgICAgICAgICAgIHN0b3JhZ2U6IHRoaXMuc3RvcmFnZVxuICAgICAgICB9O1xuXG4gICAgICAgIGNsZWFyKCkge1xuICAgICAgICAgICAgICAgIHRoaXMuaW5zdGFuY2VzLmNsZWFyKCk7XG4gICAgICAgIH1cblxuICAgICAgICByZXNvbHZlUm9vdCgpOiBIVE1MRWxlbWVudCB7XG4gICAgICAgICAgICAgICAgLy8gUHJlZmVyIGJvZHkgYXMgdGhlIGNhbm9uaWNhbCByb290LlxuICAgICAgICAgICAgICAgIGlmIChkb2N1bWVudC5ib2R5Py5kYXRhc2V0Py5jb21wb25lbnQpIHJldHVybiBkb2N1bWVudC5ib2R5O1xuXG4gICAgICAgICAgICAgICAgLy8gQmFja3dhcmQgY29tcGF0aWJpbGl0eTogb2xkIHdyYXBwZXIgZGl2LlxuICAgICAgICAgICAgICAgIGNvbnN0IGxlZ2FjeSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdkZWxwaGluZS1yb290Jyk7XG4gICAgICAgICAgICAgICAgaWYgKGxlZ2FjeSkgcmV0dXJuIGxlZ2FjeTtcblxuICAgICAgICAgICAgICAgIC8vIExhc3QgcmVzb3J0LlxuICAgICAgICAgICAgICAgIHJldHVybiBkb2N1bWVudC5ib2R5ID8/IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudDtcbiAgICAgICAgfVxuXG4gICAgICAgIHByaXZhdGUgcmVhZFByb3BzKGVsOiBFbGVtZW50LCBtZXRhOiBUTWV0YUNvbXBvbmVudCkge1xuICAgICAgICAgICAgICAgIGNvbnN0IG91dDogUmVjb3JkPHN0cmluZywgYW55PiA9IHt9O1xuICAgICAgICAgICAgICAgIGZvciAoY29uc3Qgc3BlYyBvZiBtZXRhLmRlZlByb3BzKCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHJhdyA9IGVsLmdldEF0dHJpYnV0ZShgZGF0YS0ke3NwZWMubmFtZX1gKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChyYXcgPT0gbnVsbCkgY29udGludWU7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIG91dFtzcGVjLm5hbWVdID0gdGhpcy5jb252ZXJ0KHJhdywgc3BlYy5raW5kKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIG91dDtcbiAgICAgICAgfVxuXG4gICAgICAgIHByaXZhdGUgY29udmVydChyYXc6IHN0cmluZywga2luZDogUHJvcEtpbmQpIHtcbiAgICAgICAgICAgICAgICBzd2l0Y2ggKGtpbmQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgJ3N0cmluZyc6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiByYXc7XG4gICAgICAgICAgICAgICAgICAgICAgICBjYXNlICdudW1iZXInOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gTnVtYmVyKHJhdyk7XG4gICAgICAgICAgICAgICAgICAgICAgICBjYXNlICdib29sZWFuJzpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJhdyA9PT0gJ3RydWUnIHx8IHJhdyA9PT0gJzEnIHx8IHJhdyA9PT0gJyc7XG4gICAgICAgICAgICAgICAgICAgICAgICBjYXNlICdjb2xvcic6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiByYXc7IC8vIG91IHBhcnNlIGVuIFRDb2xvciBzaSB2b3VzIGF2ZXpcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBhcHBseVByb3BzKGNoaWxkOiBUQ29tcG9uZW50LCBjbHM6IFRNZXRhQ29tcG9uZW50KSB7XG4gICAgICAgICAgICAgICAgY29uc3QgcHJvcHMgPSB0aGlzLnJlYWRQcm9wcyhjaGlsZC5lbGVtISwgY2xzKTtcbiAgICAgICAgICAgICAgICBmb3IgKGNvbnN0IHNwZWMgb2YgY2xzLmRlZlByb3BzKCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChwcm9wc1tzcGVjLm5hbWVdICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3BlYy5hcHBseShjaGlsZCwgcHJvcHNbc3BlYy5uYW1lXSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgYnVpbGRDb21wb25lbnRUcmVlKGZvcm06IFRGb3JtLCBjb21wb25lbnQ6IFRDb21wb25lbnQpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmNsZWFyKCk7XG4gICAgICAgICAgICAgICAgLy8gLS0tIEZPUk0gLS0tXG4gICAgICAgICAgICAgICAgLy8gcHJvdmlzb2lyZW1lbnQgaWYgKHJvb3QuZ2V0QXR0cmlidXRlKCdkYXRhLWNvbXBvbmVudCcpID09PSAnVEZvcm0nKSB7XG5cbiAgICAgICAgICAgICAgICB0aGlzLnJlZ2lzdGVySW5zdGFuY2UoY29tcG9uZW50Lm5hbWUsIGZvcm0pO1xuICAgICAgICAgICAgICAgIC8vfVxuICAgICAgICAgICAgICAgIGNvbnN0IHJvb3QgPSBjb21wb25lbnQuZWxlbSE7XG5cbiAgICAgICAgICAgICAgICAvLyAtLS0gQ0hJTEQgQ09NUE9ORU5UUyAtLS1cbiAgICAgICAgICAgICAgICByb290LnF1ZXJ5U2VsZWN0b3JBbGwoJzpzY29wZSA+IFtkYXRhLWNvbXBvbmVudF0nKS5mb3JFYWNoKChlbCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGVsID09PSByb290KSByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBuYW1lID0gZWwuZ2V0QXR0cmlidXRlKCdkYXRhLW5hbWUnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHR5cGUgPSBlbC5nZXRBdHRyaWJ1dGUoJ2RhdGEtY29tcG9uZW50Jyk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGNscyA9IFRBcHBsaWNhdGlvbi5UaGVBcHBsaWNhdGlvbi50eXBlcy5nZXQodHlwZSEpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFjbHMpIHJldHVybjtcblxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgY2hpbGQgPSBjbHMuY3JlYXRlKG5hbWUhLCBmb3JtLCBjb21wb25lbnQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gbmFtZTogc3RyaW5nLCBmb3JtOiBURm9ybSwgcGFyZW50OiBUQ29tcG9uZW50LCBlbGVtOiBIVE1MRWxlbWVudFxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFjaGlsZCkgcmV0dXJuO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAvL2NoaWxkLnBhcmVudCA9IGNvbXBvbmVudDtcblxuICAgICAgICAgICAgICAgICAgICAgICAgY2hpbGQuZWxlbSA9IGVsO1xuICAgICAgICAgICAgICAgICAgICAgICAgLy9jaGlsZC5mb3JtID0gZm9ybTtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vY2hpbGQubmFtZSA9IG5hbWUhO1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gT3B0aW9uYWwgcHJvcHNcbiAgICAgICAgICAgICAgICAgICAgICAgIGNoaWxkLnByb3BzID0gY2xzLnBhcnNlUHJvcHNGcm9tRWxlbWVudChlbCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmFwcGx5UHJvcHMoY2hpbGQsIGNscyk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIC8vY29uc3QgcHJvcHMgPSBjbHMuYXBwbHlQcm9wc0Zyb21FbGVtZW50KGNoaWxkLCBlbCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAvL2NoaWxkLnByb3BzID0gcHJvcHM7XG4gICAgICAgICAgICAgICAgICAgICAgICAoY2hpbGQgYXMgYW55KS5vbkF0dGFjaGVkVG9Eb20/LigpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmFwcGx5UHJvcHMoY2hpbGQsIGNscyk7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnJlZ2lzdGVySW5zdGFuY2UobmFtZSEsIGNoaWxkKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbXBvbmVudC5jaGlsZHJlbi5wdXNoKGNoaWxkKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IG1heWJlSG9zdCA9IGNoaWxkIGFzIHVua25vd24gYXMgUGFydGlhbDxJUGx1Z2luSG9zdD47XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAobWF5YmVIb3N0ICYmIHR5cGVvZiBtYXliZUhvc3Quc2V0UGx1Z2luU3BlYyA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBwbHVnaW4gPSBlbC5nZXRBdHRyaWJ1dGUoJ2RhdGEtcGx1Z2luJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHJhdyA9IGVsLmdldEF0dHJpYnV0ZSgnZGF0YS1wcm9wcycpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBwcm9wcyA9IHJhdyA/IEpTT04ucGFyc2UocmF3KSA6IHt9O1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1heWJlSG9zdC5zZXRQbHVnaW5TcGVjKHsgcGx1Z2luLCBwcm9wcyB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbWF5YmVIb3N0Lm1vdW50UGx1Z2luSWZSZWFkeSEodGhpcy5zZXJ2aWNlcyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vbWF5YmVIb3N0Lm1vdW50RnJvbVJlZ2lzdHJ5KHNlcnZpY2VzKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGNoaWxkLmFsbG93c0NoaWxkcmVuKCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5idWlsZENvbXBvbmVudFRyZWUoZm9ybSwgY2hpbGQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG59XG5cbmV4cG9ydCBjbGFzcyBURG9jdW1lbnQgZXh0ZW5kcyBUT2JqZWN0IHtcbiAgICAgICAgc3RhdGljIGRvY3VtZW50OiBURG9jdW1lbnQgPSBuZXcgVERvY3VtZW50KGRvY3VtZW50KTtcbiAgICAgICAgc3RhdGljIGJvZHkgPSBkb2N1bWVudC5ib2R5O1xuICAgICAgICBodG1sRG9jOiBEb2N1bWVudDtcbiAgICAgICAgY29uc3RydWN0b3IoaHRtbERvYzogRG9jdW1lbnQpIHtcbiAgICAgICAgICAgICAgICBzdXBlcigpO1xuICAgICAgICAgICAgICAgIHRoaXMuaHRtbERvYyA9IGh0bWxEb2M7XG4gICAgICAgIH1cbn1cblxuZXhwb3J0IGNsYXNzIFRNZXRhRG9jdW1lbnQgZXh0ZW5kcyBUTWV0YU9iamVjdCB7XG4gICAgICAgIHN0YXRpYyByZWFkb25seSBtZXRhY2xhc3M6IFRNZXRhRG9jdW1lbnQgPSBuZXcgVE1ldGFEb2N1bWVudChUTWV0YU9iamVjdC5tZXRhY2xhc3MpO1xuXG4gICAgICAgIHByb3RlY3RlZCBjb25zdHJ1Y3RvcihzdXBlckNsYXNzOiBUTWV0YU9iamVjdCkge1xuICAgICAgICAgICAgICAgIHN1cGVyKHN1cGVyQ2xhc3MpO1xuICAgICAgICAgICAgICAgIC8vIGV0IHZvdXMgY2hhbmdleiBqdXN0ZSBsZSBub20gOlxuICAgICAgICAgICAgICAgICh0aGlzIGFzIGFueSkudHlwZU5hbWUgPSAnVGVzdEInO1xuICAgICAgICB9XG4gICAgICAgIGdldE1ldGFjbGFzcygpOiBUTWV0YURvY3VtZW50IHtcbiAgICAgICAgICAgICAgICByZXR1cm4gVE1ldGFEb2N1bWVudC5tZXRhY2xhc3M7XG4gICAgICAgIH1cbn1cblxuZXhwb3J0IGNsYXNzIFRNZXRhRm9ybSBleHRlbmRzIFRNZXRhQ29tcG9uZW50IHtcbiAgICAgICAgc3RhdGljIHJlYWRvbmx5IG1ldGFjbGFzczogVE1ldGFGb3JtID0gbmV3IFRNZXRhRm9ybShUTWV0YUNvbXBvbmVudC5tZXRhY2xhc3MpO1xuICAgICAgICBnZXRNZXRhQ2xhc3MoKTogVE1ldGFGb3JtIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gVE1ldGFGb3JtLm1ldGFjbGFzcztcbiAgICAgICAgfVxuXG4gICAgICAgIHByb3RlY3RlZCBjb25zdHJ1Y3RvcihzdXBlckNsYXNzOiBUTWV0YUNvbXBvbmVudCkge1xuICAgICAgICAgICAgICAgIHN1cGVyKHN1cGVyQ2xhc3MpO1xuICAgICAgICAgICAgICAgIC8vIGV0IHZvdXMgY2hhbmdleiBqdXN0ZSBsZSBub20gOlxuICAgICAgICAgICAgICAgICh0aGlzIGFzIGFueSkudHlwZU5hbWUgPSAnVENvbXBvbmVudCc7XG4gICAgICAgIH1cblxuICAgICAgICAvL3JlYWRvbmx5IHR5cGVOYW1lID0gJ1RGb3JtJztcblxuICAgICAgICBjcmVhdGUobmFtZTogc3RyaW5nLCBmb3JtOiBURm9ybSwgcGFyZW50OiBUQ29tcG9uZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBURm9ybShuYW1lKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHByb3BzKCk6IFByb3BTcGVjPFRGb3JtPltdIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gW107XG4gICAgICAgIH1cbn1cblxuZXhwb3J0IGNsYXNzIFRGb3JtIGV4dGVuZHMgVENvbXBvbmVudCB7XG4gICAgICAgIGdldE1ldGFjbGFzcygpOiBUTWV0YUZvcm0ge1xuICAgICAgICAgICAgICAgIHJldHVybiBUTWV0YUZvcm0ubWV0YWNsYXNzO1xuICAgICAgICB9XG4gICAgICAgIGFsbG93c0NoaWxkcmVuKCk6IGJvb2xlYW4ge1xuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIHN0YXRpYyBmb3JtcyA9IG5ldyBNYXA8c3RyaW5nLCBURm9ybT4oKTtcbiAgICAgICAgcHJpdmF0ZSBfbW91bnRlZCA9IGZhbHNlO1xuICAgICAgICAvLyBFYWNoIEZvcm0gaGFzIGl0cyBvd24gY29tcG9uZW50UmVnaXN0cnlcbiAgICAgICAgY29tcG9uZW50UmVnaXN0cnk6IFRDb21wb25lbnRSZWdpc3RyeSA9IG5ldyBUQ29tcG9uZW50UmVnaXN0cnkoKTtcbiAgICAgICAgY29uc3RydWN0b3IobmFtZTogc3RyaW5nKSB7XG4gICAgICAgICAgICAgICAgc3VwZXIobmFtZSwgbnVsbCwgbnVsbCk7XG4gICAgICAgICAgICAgICAgdGhpcy5mb3JtID0gdGhpcztcbiAgICAgICAgICAgICAgICBURm9ybS5mb3Jtcy5zZXQobmFtZSwgdGhpcyk7XG4gICAgICAgIH1cblxuICAgICAgICBnZXQgYXBwbGljYXRpb24oKTogVEFwcGxpY2F0aW9uIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5mb3JtPy5hcHBsaWNhdGlvbiA/PyBUQXBwbGljYXRpb24uVGhlQXBwbGljYXRpb247XG4gICAgICAgIH1cblxuICAgICAgICAvLyBFbmdsaXNoIGNvbW1lbnRzIGFzIHJlcXVlc3RlZC5cblxuICAgICAgICBmaW5kRm9ybUZyb21FdmVudFRhcmdldCh0YXJnZXQ6IEVsZW1lbnQpOiBURm9ybSB8IG51bGwge1xuICAgICAgICAgICAgICAgIC8vIDEpIEZpbmQgdGhlIG5lYXJlc3QgZWxlbWVudCB0aGF0IGxvb2tzIGxpa2UgYSBmb3JtIGNvbnRhaW5lclxuICAgICAgICAgICAgICAgIGNvbnN0IGZvcm1FbGVtID0gdGFyZ2V0LmNsb3Nlc3QoJ1tkYXRhLWNvbXBvbmVudD1cIlRGb3JtXCJdW2RhdGEtbmFtZV0nKSBhcyBFbGVtZW50IHwgbnVsbDtcbiAgICAgICAgICAgICAgICBpZiAoIWZvcm1FbGVtKSByZXR1cm4gbnVsbDtcblxuICAgICAgICAgICAgICAgIC8vIDIpIFJlc29sdmUgdGhlIFRGb3JtIGluc3RhbmNlXG4gICAgICAgICAgICAgICAgY29uc3QgZm9ybU5hbWUgPSBmb3JtRWxlbS5nZXRBdHRyaWJ1dGUoJ2RhdGEtbmFtZScpO1xuICAgICAgICAgICAgICAgIGlmICghZm9ybU5hbWUpIHJldHVybiBudWxsO1xuXG4gICAgICAgICAgICAgICAgcmV0dXJuIFRGb3JtLmZvcm1zLmdldChmb3JtTmFtZSkgPz8gbnVsbDtcbiAgICAgICAgfVxuXG4gICAgICAgIHByaXZhdGUgX2FjOiBBYm9ydENvbnRyb2xsZXIgfCBudWxsID0gbnVsbDtcblxuICAgICAgICBpbnN0YWxsRXZlbnRSb3V0ZXIoKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fYWM/LmFib3J0KCk7XG4gICAgICAgICAgICAgICAgdGhpcy5fYWMgPSBuZXcgQWJvcnRDb250cm9sbGVyKCk7XG4gICAgICAgICAgICAgICAgY29uc3QgeyBzaWduYWwgfSA9IHRoaXMuX2FjO1xuXG4gICAgICAgICAgICAgICAgY29uc3Qgcm9vdCA9IHRoaXMuZWxlbSBhcyBFbGVtZW50IHwgbnVsbDtcbiAgICAgICAgICAgICAgICBpZiAoIXJvb3QpIHJldHVybjtcblxuICAgICAgICAgICAgICAgIC8vIHNhbWUgaGFuZGxlciBmb3IgZXZlcnlib2R5XG4gICAgICAgICAgICAgICAgY29uc3QgaGFuZGxlciA9IChldjogRXZlbnQpID0+IHRoaXMuZGlzcGF0Y2hEb21FdmVudChldik7XG5cbiAgICAgICAgICAgICAgICBmb3IgKGNvbnN0IHR5cGUgb2YgWydjbGljaycsICdpbnB1dCcsICdjaGFuZ2UnLCAna2V5ZG93biddKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByb290LmFkZEV2ZW50TGlzdGVuZXIodHlwZSwgaGFuZGxlciwgeyBjYXB0dXJlOiB0cnVlLCBzaWduYWwgfSk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgZm9yIChjb25zdCB0eXBlIGluIHRoaXMuZ2V0TWV0YWNsYXNzKCkuZG9tRXZlbnRzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByb290LmFkZEV2ZW50TGlzdGVuZXIodHlwZSwgaGFuZGxlciwgeyBjYXB0dXJlOiB0cnVlLCBzaWduYWwgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgZGlzcG9zZUV2ZW50Um91dGVyKCkge1xuICAgICAgICAgICAgICAgIHRoaXMuX2FjPy5hYm9ydCgpO1xuICAgICAgICAgICAgICAgIHRoaXMuX2FjID0gbnVsbDtcbiAgICAgICAgfVxuXG4gICAgICAgIHByaXZhdGUgaGFuZGxlRXZlbnQoZXY6IEV2ZW50LCBlbDogRWxlbWVudCwgYXR0cmlidXRlOiBzdHJpbmcpOiBib29sZWFuIHtcbiAgICAgICAgICAgICAgICBjb25zdCBoYW5kbGVyTmFtZSA9IGVsLmdldEF0dHJpYnV0ZShhdHRyaWJ1dGUpO1xuXG4gICAgICAgICAgICAgICAgLy8gSWYgd2UgZm91bmQgYSBoYW5kbGVyIG9uIHRoaXMgZWxlbWVudCwgZGlzcGF0Y2ggaXRcbiAgICAgICAgICAgICAgICBpZiAoaGFuZGxlck5hbWUgJiYgaGFuZGxlck5hbWUgIT09ICcnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBuYW1lID0gZWwuZ2V0QXR0cmlidXRlKCdkYXRhLW5hbWUnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHNlbmRlciA9IG5hbWUgPyAodGhpcy5jb21wb25lbnRSZWdpc3RyeS5nZXQobmFtZSkgPz8gbnVsbCkgOiBudWxsO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBtYXliZU1ldGhvZCA9ICh0aGlzIGFzIGFueSlbaGFuZGxlck5hbWVdO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBtYXliZU1ldGhvZCAhPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnTk9UIEEgTUVUSE9EJywgaGFuZGxlck5hbWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIElmIHNlbmRlciBpcyBtaXNzaW5nLCBmYWxsYmFjayB0byB0aGUgZm9ybSBpdHNlbGYgKHNhZmUpXG4gICAgICAgICAgICAgICAgICAgICAgICAobWF5YmVNZXRob2QgYXMgKGV2ZW50OiBFdmVudCwgc2VuZGVyOiBhbnkpID0+IGFueSkuY2FsbCh0aGlzLCBldiwgc2VuZGVyID8/IHRoaXMpO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFdlIHJlY2VpdmVkIGFuIERPTSBFdmVudC4gRGlzcGF0Y2ggaXRcbiAgICAgICAgcHJpdmF0ZSBkaXNwYXRjaERvbUV2ZW50KGV2OiBFdmVudCkge1xuICAgICAgICAgICAgICAgIGNvbnN0IHRhcmdldEVsZW0gPSBldi50YXJnZXQgYXMgRWxlbWVudCB8IG51bGw7XG4gICAgICAgICAgICAgICAgaWYgKCF0YXJnZXRFbGVtKSByZXR1cm47XG5cbiAgICAgICAgICAgICAgICBjb25zdCBldlR5cGUgPSBldi50eXBlO1xuXG4gICAgICAgICAgICAgICAgbGV0IGVsOiBFbGVtZW50IHwgbnVsbCA9IHRhcmdldEVsZW0uY2xvc2VzdCgnW2RhdGEtY29tcG9uZW50XScpO1xuICAgICAgICAgICAgICAgIHdoaWxlIChlbCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMuaGFuZGxlRXZlbnQoZXYsIGVsLCBgZGF0YS1vbiR7ZXZUeXBlfWApKSByZXR1cm47XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIC8vZWwgPSB0aGlzLm5leHRDb21wb25lbnRFbGVtZW50VXAoZWwpO1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgbmFtZSA9IGVsLmdldEF0dHJpYnV0ZSgnZGF0YS1uYW1lJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBjb21wID0gbmFtZSA/IHRoaXMuY29tcG9uZW50UmVnaXN0cnkuZ2V0KG5hbWUpIDogbnVsbDtcblxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gUHJlZmVyIHlvdXIgVkNMLWxpa2UgcGFyZW50IGNoYWluIHdoZW4gYXZhaWxhYmxlXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBuZXh0ID0gY29tcD8ucGFyZW50Py5lbGVtID8/IG51bGw7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIEZhbGxiYWNrOiBzdGFuZGFyZCBET00gcGFyZW50XG4gICAgICAgICAgICAgICAgICAgICAgICBlbCA9IG5leHQgPz8gZWwucGFyZW50RWxlbWVudD8uY2xvc2VzdCgnW2RhdGEtY29tcG9uZW50XScpID8/IG51bGw7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLy8gTm8gaGFuZGxlciBoZXJlOiB0cnkgZ29pbmcgXCJ1cFwiIHVzaW5nIHlvdXIgY29tcG9uZW50IHRyZWUgaWYgcG9zc2libGVcbiAgICAgICAgfVxuXG4gICAgICAgIHNob3coKSB7XG4gICAgICAgICAgICAgICAgLy8gTXVzdCBiZSBkb25lIGJlZm9yZSBidWlsZENvbXBvbmVudFRyZWUoKSBiZWNhdXNlIGBidWlsZENvbXBvbmVudFRyZWUoKWAgZG9lcyBub3QgZG8gYHJlc29sdmVSb290KClgIGl0c2VsZi5cbiAgICAgICAgICAgICAgICBpZiAoIXRoaXMuZWxlbSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5lbGVtID0gdGhpcy5jb21wb25lbnRSZWdpc3RyeS5yZXNvbHZlUm9vdCgpOyAvLyBvdSB0aGlzLnJlc29sdmVSb290KClcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKCF0aGlzLl9tb3VudGVkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmNvbXBvbmVudFJlZ2lzdHJ5LmJ1aWxkQ29tcG9uZW50VHJlZSh0aGlzLCB0aGlzKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMub25DcmVhdGUoKTsgLy8gTWF5YmUgY291bGQgYmUgZG9uZSBhZnRlciBpbnN0YWxsRXZlbnRSb3V0ZXIoKVxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5pbnN0YWxsRXZlbnRSb3V0ZXIoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX21vdW50ZWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB0aGlzLm9uU2hvd24oKTtcblxuICAgICAgICAgICAgICAgIC8vIFRPRE9cbiAgICAgICAgfVxuXG4gICAgICAgIHByb3RlY3RlZCBvbkNyZWF0ZSgpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBvblNob3duTmFtZSA9IHRoaXMuZWxlbSEuZ2V0QXR0cmlidXRlKCdkYXRhLW9uY3JlYXRlJyk7XG4gICAgICAgICAgICAgICAgaWYgKG9uU2hvd25OYW1lKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBxdWV1ZU1pY3JvdGFzaygoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGZuID0gKHRoaXMgYXMgYW55KVtvblNob3duTmFtZV07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgZm4gPT09ICdmdW5jdGlvbicpIGZuLmNhbGwodGhpcywgbnVsbCwgdGhpcyk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBwcm90ZWN0ZWQgb25TaG93bigpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBvblNob3duTmFtZSA9IHRoaXMuZWxlbSEuZ2V0QXR0cmlidXRlKCdkYXRhLW9uc2hvd24nKTtcbiAgICAgICAgICAgICAgICBpZiAob25TaG93bk5hbWUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHF1ZXVlTWljcm90YXNrKCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgZm4gPSAodGhpcyBhcyBhbnkpW29uU2hvd25OYW1lXTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBmbiA9PT0gJ2Z1bmN0aW9uJykgZm4uY2FsbCh0aGlzLCBudWxsLCB0aGlzKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgfVxufVxuXG50eXBlIEJ1dHRvblByb3BzID0gQ29tcG9uZW50UHJvcHMgJiB7XG4gICAgICAgIGNhcHRpb24/OiBzdHJpbmc7XG4gICAgICAgIGVuYWJsZWQ/OiBib29sZWFuO1xuICAgICAgICAvL2NvbG9yPzogVENvbG9yOyAvLyBvdSBUQ29sb3IsIGV0Yy5cbn07XG5cbmV4cG9ydCBjbGFzcyBUQnV0dG9uIGV4dGVuZHMgVENvbXBvbmVudCB7XG4gICAgICAgIGdldE1ldGFjbGFzcygpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gVE1ldGFCdXR0b24ubWV0YWNsYXNzO1xuICAgICAgICB9XG5cbiAgICAgICAgaHRtbEJ1dHRvbigpOiBIVE1MQnV0dG9uRWxlbWVudCB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuaHRtbEVsZW1lbnQhIGFzIEhUTUxCdXR0b25FbGVtZW50O1xuICAgICAgICB9XG5cbiAgICAgICAgcHJvdGVjdGVkIGdldCBicHJvcHMoKTogQnV0dG9uUHJvcHMge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLnByb3BzIGFzIEJ1dHRvblByb3BzO1xuICAgICAgICB9XG5cbiAgICAgICAgZ2V0IGNhcHRpb24oKTogc3RyaW5nIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5icHJvcHMuY2FwdGlvbiA/PyAnJztcbiAgICAgICAgfVxuICAgICAgICBzZXQgY2FwdGlvbihjYXB0aW9uOiBzdHJpbmcpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmJwcm9wcy5jYXB0aW9uID0gY2FwdGlvbjtcbiAgICAgICAgICAgICAgICB0aGlzLnN5bmNEb21Gcm9tUHJvcHMoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGdldCBlbmFibGVkKCk6IGJvb2xlYW4ge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLnByb3BzLmVuYWJsZWQgPz8gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICBzZXQgZW5hYmxlZChlbmFibGVkKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5wcm9wcy5lbmFibGVkID0gZW5hYmxlZDtcbiAgICAgICAgICAgICAgICB0aGlzLnN5bmNEb21Gcm9tUHJvcHMoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0cnVjdG9yKG5hbWU6IHN0cmluZywgZm9ybTogVEZvcm0sIHBhcmVudDogVENvbXBvbmVudCkge1xuICAgICAgICAgICAgICAgIHN1cGVyKG5hbWUsIGZvcm0sIHBhcmVudCk7XG4gICAgICAgIH1cbiAgICAgICAgc3luY0RvbUZyb21Qcm9wcygpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBlbCA9IHRoaXMuaHRtbEVsZW1lbnQ7XG4gICAgICAgICAgICAgICAgaWYgKCFlbCkgcmV0dXJuO1xuXG4gICAgICAgICAgICAgICAgZWwudGV4dENvbnRlbnQgPSB0aGlzLmNhcHRpb247XG4gICAgICAgICAgICAgICAgdGhpcy5odG1sQnV0dG9uKCkuZGlzYWJsZWQgPSAhdGhpcy5lbmFibGVkO1xuICAgICAgICB9XG59XG5cbmV4cG9ydCBjbGFzcyBUTWV0YUJ1dHRvbiBleHRlbmRzIFRNZXRhQ29tcG9uZW50IHtcbiAgICAgICAgc3RhdGljIHJlYWRvbmx5IG1ldGFjbGFzczogVE1ldGFCdXR0b24gPSBuZXcgVE1ldGFCdXR0b24oVE1ldGFDb21wb25lbnQubWV0YWNsYXNzKTtcblxuICAgICAgICBwcm90ZWN0ZWQgY29uc3RydWN0b3Ioc3VwZXJDbGFzczogVE1ldGFDb21wb25lbnQpIHtcbiAgICAgICAgICAgICAgICBzdXBlcihzdXBlckNsYXNzKTtcbiAgICAgICAgICAgICAgICAvLyBldCB2b3VzIGNoYW5nZXoganVzdGUgbGUgbm9tIDpcbiAgICAgICAgICAgICAgICAodGhpcyBhcyBhbnkpLnR5cGVOYW1lID0gJ1RCdXR0b24nO1xuICAgICAgICB9XG4gICAgICAgIGdldE1ldGFjbGFzcygpOiBUTWV0YUJ1dHRvbiB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIFRNZXRhQnV0dG9uLm1ldGFjbGFzcztcbiAgICAgICAgfVxuXG4gICAgICAgIHJlYWRvbmx5IHR5cGVOYW1lID0gJ1RCdXR0b24nO1xuXG4gICAgICAgIGNyZWF0ZShuYW1lOiBzdHJpbmcsIGZvcm06IFRGb3JtLCBwYXJlbnQ6IFRDb21wb25lbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gbmV3IFRCdXR0b24obmFtZSwgZm9ybSwgcGFyZW50KTtcbiAgICAgICAgfVxuXG4gICAgICAgIHByb3BzKCk6IFByb3BTcGVjPFRCdXR0b24+W10ge1xuICAgICAgICAgICAgICAgIHJldHVybiBbXG4gICAgICAgICAgICAgICAgICAgICAgICB7IG5hbWU6ICdjYXB0aW9uJywga2luZDogJ3N0cmluZycsIGFwcGx5OiAobywgdikgPT4gKG8uY2FwdGlvbiA9IFN0cmluZyh2KSkgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHsgbmFtZTogJ2VuYWJsZWQnLCBraW5kOiAnYm9vbGVhbicsIGFwcGx5OiAobywgdikgPT4gKG8uZW5hYmxlZCA9IEJvb2xlYW4odikpIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICB7IG5hbWU6ICdjb2xvcicsIGtpbmQ6ICdjb2xvcicsIGFwcGx5OiAobywgdikgPT4gKG8uY29sb3IgPSB2IGFzIGFueSkgfVxuICAgICAgICAgICAgICAgIF07XG4gICAgICAgIH1cbn1cblxuZXhwb3J0IGNsYXNzIFRNZXRhQXBwbGljYXRpb24gZXh0ZW5kcyBUTWV0YWNsYXNzIHtcbiAgICAgICAgc3RhdGljIHJlYWRvbmx5IG1ldGFjbGFzczogVE1ldGFBcHBsaWNhdGlvbiA9IG5ldyBUTWV0YUFwcGxpY2F0aW9uKFRNZXRhY2xhc3MubWV0YWNsYXNzKTtcblxuICAgICAgICBwcm90ZWN0ZWQgY29uc3RydWN0b3Ioc3VwZXJDbGFzczogVE1ldGFjbGFzcykge1xuICAgICAgICAgICAgICAgIHN1cGVyKHN1cGVyQ2xhc3MsICdUQXBwbGljYXRpb24nKTtcbiAgICAgICAgfVxuICAgICAgICBnZXRNZXRhY2xhc3MoKTogVE1ldGFBcHBsaWNhdGlvbiB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIFRNZXRhQXBwbGljYXRpb24ubWV0YWNsYXNzO1xuICAgICAgICB9XG59XG5cbmV4cG9ydCBjbGFzcyBUQXBwbGljYXRpb24ge1xuICAgICAgICBnZXRNZXRhY2xhc3MoKTogVE1ldGFBcHBsaWNhdGlvbiB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIFRNZXRhQXBwbGljYXRpb24ubWV0YWNsYXNzO1xuICAgICAgICB9XG4gICAgICAgIHN0YXRpYyBUaGVBcHBsaWNhdGlvbjogVEFwcGxpY2F0aW9uO1xuICAgICAgICAvL3N0YXRpYyBwbHVnaW5SZWdpc3RyeSA9IG5ldyBQbHVnaW5SZWdpc3RyeSgpO1xuICAgICAgICAvL3BsdWdpbnM6IElQbHVnaW5SZWdpc3RyeTtcbiAgICAgICAgcHJpdmF0ZSBmb3JtczogVEZvcm1bXSA9IFtdO1xuICAgICAgICByZWFkb25seSB0eXBlcyA9IG5ldyBUQ29tcG9uZW50VHlwZVJlZ2lzdHJ5KCk7XG4gICAgICAgIG1haW5Gb3JtOiBURm9ybSB8IG51bGwgPSBudWxsO1xuXG4gICAgICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICAgICAgICAgIFRBcHBsaWNhdGlvbi5UaGVBcHBsaWNhdGlvbiA9IHRoaXM7XG4gICAgICAgICAgICAgICAgcmVnaXN0ZXJCdWlsdGlucyh0aGlzLnR5cGVzKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNyZWF0ZUZvcm08VCBleHRlbmRzIFRGb3JtPihjdG9yOiBuZXcgKC4uLmFyZ3M6IGFueVtdKSA9PiBULCBuYW1lOiBzdHJpbmcpOiBUIHtcbiAgICAgICAgICAgICAgICBjb25zdCBmID0gbmV3IGN0b3IobmFtZSk7XG4gICAgICAgICAgICAgICAgdGhpcy5mb3Jtcy5wdXNoKGYpO1xuICAgICAgICAgICAgICAgIGlmICghdGhpcy5tYWluRm9ybSkgdGhpcy5tYWluRm9ybSA9IGY7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGY7XG4gICAgICAgIH1cblxuICAgICAgICBydW4oKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5ydW5XaGVuRG9tUmVhZHkoKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMubWFpbkZvcm0pIHRoaXMubWFpbkZvcm0uc2hvdygpO1xuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSB0aGlzLmF1dG9TdGFydCgpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgcHJvdGVjdGVkIGF1dG9TdGFydCgpIHtcbiAgICAgICAgICAgICAgICAvLyBmYWxsYmFjazogY2hvaXNpciB1bmUgZm9ybSBlbnJlZ2lzdHLDqWUsIG91IGNyw6llciB1bmUgZm9ybSBpbXBsaWNpdGVcbiAgICAgICAgfVxuXG4gICAgICAgIHJ1bldoZW5Eb21SZWFkeShmbjogKCkgPT4gdm9pZCkge1xuICAgICAgICAgICAgICAgIGlmIChkb2N1bWVudC5yZWFkeVN0YXRlID09PSAnbG9hZGluZycpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdET01Db250ZW50TG9hZGVkJywgZm4sIHsgb25jZTogdHJ1ZSB9KTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgZm4oKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgIH1cbn1cblxuLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09IFBMVUdJTkhPU1QgPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuLypcblxuZXhwb3J0IGNsYXNzIFZ1ZUNvbXBvbmVudCBleHRlbmRzIFRDb21wb25lbnQge31cblxuZXhwb3J0IGNsYXNzIFJlYWN0Q29tcG9uZW50IGV4dGVuZHMgVENvbXBvbmVudCB7fVxuXG5leHBvcnQgY2xhc3MgU3ZlbHRlQ29tcG9uZW50IGV4dGVuZHMgVENvbXBvbmVudCB7fVxuXG5leHBvcnQgY2xhc3MgUGx1Z2luSG9zdDxQcm9wcyBleHRlbmRzIEpzb24gPSBKc29uPiBleHRlbmRzIFRDb21wb25lbnQge1xuICAgICAgICBwcml2YXRlIHBsdWdpbjogUGx1Z2luPFByb3BzPjtcbiAgICAgICAgcHJpdmF0ZSBzZXJ2aWNlczogRGVscGhpbmVTZXJ2aWNlcztcbiAgICAgICAgcHJpdmF0ZSBtb3VudGVkID0gZmFsc2U7XG5cbiAgICAgICAgY29uc3RydWN0b3IocGx1Z2luOiBVSVBsdWdpbjxQcm9wcz4sIHNlcnZpY2VzOiBEZWxwaGluZVNlcnZpY2VzKSB7XG4gICAgICAgICAgICAgICAgc3VwZXIoJ3RvdG8nLCBudWxsLCBudWxsKTtcbiAgICAgICAgICAgICAgICB0aGlzLnBsdWdpbiA9IHBsdWdpbjtcbiAgICAgICAgICAgICAgICB0aGlzLnNlcnZpY2VzID0gc2VydmljZXM7XG4gICAgICAgIH1cblxuICAgICAgICBtb3VudChwcm9wczogUHJvcHMpIHtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5tb3VudGVkKSB0aHJvdyBuZXcgRXJyb3IoJ1BsdWdpbiBhbHJlYWR5IG1vdW50ZWQnKTtcbiAgICAgICAgICAgICAgICAvL3RoaXMucGx1Z2luLm1vdW50KHRoaXMuaHRtbEVsZW1lbnQsIHByb3BzLCB0aGlzLnNlcnZpY2VzKTtcbiAgICAgICAgICAgICAgICB0aGlzLm1vdW50ZWQgPSB0cnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgdXBkYXRlKHByb3BzOiBQcm9wcykge1xuICAgICAgICAgICAgICAgIGlmICghdGhpcy5tb3VudGVkKSB0aHJvdyBuZXcgRXJyb3IoJ1BsdWdpbiBub3QgbW91bnRlZCcpO1xuICAgICAgICAgICAgICAgIHRoaXMucGx1Z2luLnVwZGF0ZShwcm9wcyk7XG4gICAgICAgIH1cblxuICAgICAgICB1bm1vdW50KCkge1xuICAgICAgICAgICAgICAgIGlmICghdGhpcy5tb3VudGVkKSByZXR1cm47XG4gICAgICAgICAgICAgICAgdGhpcy5wbHVnaW4udW5tb3VudCgpO1xuICAgICAgICAgICAgICAgIHRoaXMubW91bnRlZCA9IGZhbHNlO1xuICAgICAgICB9XG59XG4gICAgICAgICovXG5cbmV4cG9ydCBjbGFzcyBUTWV0YVBsdWdpbkhvc3QgZXh0ZW5kcyBUTWV0YUNvbXBvbmVudCB7XG4gICAgICAgIHN0YXRpYyBtZXRhQ2xhc3MgPSBuZXcgVE1ldGFQbHVnaW5Ib3N0KFRNZXRhQ29tcG9uZW50Lm1ldGFjbGFzcyk7XG4gICAgICAgIGdldE1ldGFDbGFzcygpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gVE1ldGFQbHVnaW5Ib3N0Lm1ldGFDbGFzcztcbiAgICAgICAgfVxuICAgICAgICByZWFkb25seSB0eXBlTmFtZSA9ICdUUGx1Z2luSG9zdCc7XG5cbiAgICAgICAgY3JlYXRlKG5hbWU6IHN0cmluZywgZm9ybTogVEZvcm0sIHBhcmVudDogVENvbXBvbmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBuZXcgVFBsdWdpbkhvc3QobmFtZSwgZm9ybSwgcGFyZW50KTtcbiAgICAgICAgfVxuXG4gICAgICAgIHByb3BzKCk6IFByb3BTcGVjPFRQbHVnaW5Ib3N0PltdIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gW107XG4gICAgICAgIH1cbn1cblxuZXhwb3J0IGNsYXNzIFRQbHVnaW5Ib3N0IGV4dGVuZHMgVENvbXBvbmVudCB7XG4gICAgICAgIHByaXZhdGUgaW5zdGFuY2U6IFVJUGx1Z2luSW5zdGFuY2UgfCBudWxsID0gbnVsbDtcblxuICAgICAgICBwbHVnaW5OYW1lOiBzdHJpbmcgfCBudWxsID0gbnVsbDtcbiAgICAgICAgcGx1Z2luUHJvcHM6IEpzb24gPSB7fTtcbiAgICAgICAgcHJpdmF0ZSBmYWN0b3J5OiBVSVBsdWdpbkZhY3RvcnkgfCBudWxsID0gbnVsbDtcblxuICAgICAgICBjb25zdHJ1Y3RvcihuYW1lOiBzdHJpbmcsIGZvcm06IFRGb3JtLCBwYXJlbnQ6IFRDb21wb25lbnQpIHtcbiAgICAgICAgICAgICAgICBzdXBlcihuYW1lLCBmb3JtLCBwYXJlbnQpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gQ2FsbGVkIGJ5IHRoZSBtZXRhY2xhc3MgKG9yIGJ5IHlvdXIgcmVnaXN0cnkpIHJpZ2h0IGFmdGVyIGNyZWF0aW9uXG4gICAgICAgIHNldFBsdWdpbkZhY3RvcnkoZmFjdG9yeTogVUlQbHVnaW5GYWN0b3J5KSB7XG4gICAgICAgICAgICAgICAgdGhpcy5mYWN0b3J5ID0gZmFjdG9yeTtcbiAgICAgICAgfVxuXG4gICAgICAgIG1vdW50UGx1Z2luKHByb3BzOiBKc29uLCBzZXJ2aWNlczogRGVscGhpbmVTZXJ2aWNlcykge1xuICAgICAgICAgICAgICAgIGNvbnN0IGNvbnRhaW5lciA9IHRoaXMuaHRtbEVsZW1lbnQ7XG4gICAgICAgICAgICAgICAgaWYgKCFjb250YWluZXIpIHJldHVybjtcblxuICAgICAgICAgICAgICAgIGlmICghdGhpcy5mYWN0b3J5KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzZXJ2aWNlcy5sb2cud2FybignVFBsdWdpbkhvc3Q6IG5vIHBsdWdpbiBmYWN0b3J5IHNldCcsIHsgaG9zdDogdGhpcy5uYW1lIGFzIGFueSB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvLyBEaXNwb3NlIG9sZCBpbnN0YW5jZSBpZiBhbnlcbiAgICAgICAgICAgICAgICB0aGlzLnVubW91bnQoKTtcblxuICAgICAgICAgICAgICAgIC8vIENyZWF0ZSBwbHVnaW4gaW5zdGFuY2UgdGhlbiBtb3VudFxuICAgICAgICAgICAgICAgIHRoaXMuaW5zdGFuY2UgPSB0aGlzLmZhY3RvcnkoeyBob3N0OiB0aGlzLCBmb3JtOiB0aGlzLmZvcm0hIH0pO1xuICAgICAgICAgICAgICAgIHRoaXMuaW5zdGFuY2UhLm1vdW50KGNvbnRhaW5lciwgcHJvcHMsIHNlcnZpY2VzKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIENhbGxlZCBieSBidWlsZENvbXBvbmVudFRyZWUoKVxuICAgICAgICBzZXRQbHVnaW5TcGVjKHNwZWM6IHsgcGx1Z2luOiBzdHJpbmcgfCBudWxsOyBwcm9wczogYW55IH0pIHtcbiAgICAgICAgICAgICAgICB0aGlzLnBsdWdpbk5hbWUgPSBzcGVjLnBsdWdpbjtcbiAgICAgICAgICAgICAgICB0aGlzLnBsdWdpblByb3BzID0gc3BlYy5wcm9wcyA/PyB7fTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIENhbGxlZCBieSBidWlsZENvbXBvbmVudFRyZWUoKVxuICAgICAgICBtb3VudFBsdWdpbklmUmVhZHkoc2VydmljZXM6IERlbHBoaW5lU2VydmljZXMpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBjb250YWluZXIgPSB0aGlzLmh0bWxFbGVtZW50O1xuICAgICAgICAgICAgICAgIGlmICghY29udGFpbmVyIHx8ICF0aGlzLmZvcm0gfHwgIXRoaXMucGx1Z2luTmFtZSkgcmV0dXJuO1xuXG4gICAgICAgICAgICAgICAgY29uc3QgYXBwID0gVEFwcGxpY2F0aW9uLlRoZUFwcGxpY2F0aW9uOyAvLyBvdSB1biBhY2PDqHMgw6lxdWl2YWxlbnRcbiAgICAgICAgICAgICAgICBjb25zdCBkZWYgPSBQbHVnaW5SZWdpc3RyeS5wbHVnaW5SZWdpc3RyeS5nZXQodGhpcy5wbHVnaW5OYW1lKTtcblxuICAgICAgICAgICAgICAgIGlmICghZGVmKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzZXJ2aWNlcy5sb2cud2FybignVW5rbm93biBwbHVnaW4nLCB7IHBsdWdpbjogdGhpcy5wbHVnaW5OYW1lIGFzIGFueSB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICB0aGlzLnVubW91bnQoKTtcbiAgICAgICAgICAgICAgICB0aGlzLmluc3RhbmNlID0gZGVmLmZhY3RvcnkoeyBob3N0OiB0aGlzLCBmb3JtOiB0aGlzLmZvcm0gfSk7XG4gICAgICAgICAgICAgICAgdGhpcy5pbnN0YW5jZSEubW91bnQoY29udGFpbmVyLCB0aGlzLnBsdWdpblByb3BzLCBzZXJ2aWNlcyk7XG4gICAgICAgIH1cblxuICAgICAgICB1cGRhdGUocHJvcHM6IGFueSkge1xuICAgICAgICAgICAgICAgIHRoaXMucGx1Z2luUHJvcHMgPSBwcm9wcztcbiAgICAgICAgICAgICAgICB0aGlzLmluc3RhbmNlPy51cGRhdGUocHJvcHMpO1xuICAgICAgICB9XG5cbiAgICAgICAgdW5tb3VudCgpIHtcbiAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5pbnN0YW5jZT8udW5tb3VudCgpO1xuICAgICAgICAgICAgICAgIH0gZmluYWxseSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmluc3RhbmNlID0gbnVsbDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgIH1cbn1cblxuZXhwb3J0IHR5cGUgVUlQbHVnaW5GYWN0b3J5PFByb3BzIGV4dGVuZHMgSnNvbiA9IEpzb24+ID0gKGFyZ3M6IHsgaG9zdDogVFBsdWdpbkhvc3Q7IGZvcm06IFRGb3JtIH0pID0+IFVJUGx1Z2luSW5zdGFuY2U8UHJvcHM+O1xuXG5leHBvcnQgaW50ZXJmYWNlIFNpemVIaW50cyB7XG4gICAgICAgIG1pbldpZHRoPzogbnVtYmVyO1xuICAgICAgICBtaW5IZWlnaHQ/OiBudW1iZXI7XG4gICAgICAgIHByZWZlcnJlZFdpZHRoPzogbnVtYmVyO1xuICAgICAgICBwcmVmZXJyZWRIZWlnaHQ/OiBudW1iZXI7XG59XG5cbmV4cG9ydCB0eXBlIFVJUGx1Z2luRGVmID0ge1xuICAgICAgICBmYWN0b3J5OiBVSVBsdWdpbkZhY3Rvcnk7XG4gICAgICAgIC8vIG9wdGlvbm5lbCA6IHVuIHNjaMOpbWEgZGUgcHJvcHMsIGFpZGUgYXUgZGVzaWduZXJcbiAgICAgICAgLy8gcHJvcHM/OiBQcm9wU2NoZW1hO1xufTtcblxuZXhwb3J0IGNsYXNzIFBsdWdpblJlZ2lzdHJ5IHtcbiAgICAgICAgc3RhdGljIHBsdWdpblJlZ2lzdHJ5ID0gbmV3IFBsdWdpblJlZ2lzdHJ5KCk7XG4gICAgICAgIHByaXZhdGUgcmVhZG9ubHkgcGx1Z2lucyA9IG5ldyBNYXA8c3RyaW5nLCBVSVBsdWdpbkRlZj4oKTtcblxuICAgICAgICByZWdpc3RlcihuYW1lOiBzdHJpbmcsIGRlZjogVUlQbHVnaW5EZWYpIHtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5wbHVnaW5zLmhhcyhuYW1lKSkgdGhyb3cgbmV3IEVycm9yKGBQbHVnaW4gYWxyZWFkeSByZWdpc3RlcmVkOiAke25hbWV9YCk7XG4gICAgICAgICAgICAgICAgdGhpcy5wbHVnaW5zLnNldChuYW1lLCBkZWYpO1xuICAgICAgICB9XG5cbiAgICAgICAgZ2V0KG5hbWU6IHN0cmluZyk6IFVJUGx1Z2luRGVmIHwgdW5kZWZpbmVkIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5wbHVnaW5zLmdldChuYW1lKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGhhcyhuYW1lOiBzdHJpbmcpOiBib29sZWFuIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5wbHVnaW5zLmhhcyhuYW1lKTtcbiAgICAgICAgfVxufVxuIiwiLyoqXG4qIEB2dWUvc2hhcmVkIHYzLjUuMjhcbiogKGMpIDIwMTgtcHJlc2VudCBZdXhpIChFdmFuKSBZb3UgYW5kIFZ1ZSBjb250cmlidXRvcnNcbiogQGxpY2Vuc2UgTUlUXG4qKi9cbi8vIEBfX05PX1NJREVfRUZGRUNUU19fXG5mdW5jdGlvbiBtYWtlTWFwKHN0cikge1xuICBjb25zdCBtYXAgPSAvKiBAX19QVVJFX18gKi8gT2JqZWN0LmNyZWF0ZShudWxsKTtcbiAgZm9yIChjb25zdCBrZXkgb2Ygc3RyLnNwbGl0KFwiLFwiKSkgbWFwW2tleV0gPSAxO1xuICByZXR1cm4gKHZhbCkgPT4gdmFsIGluIG1hcDtcbn1cblxuY29uc3QgRU1QVFlfT0JKID0gISEocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09IFwicHJvZHVjdGlvblwiKSA/IE9iamVjdC5mcmVlemUoe30pIDoge307XG5jb25zdCBFTVBUWV9BUlIgPSAhIShwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gXCJwcm9kdWN0aW9uXCIpID8gT2JqZWN0LmZyZWV6ZShbXSkgOiBbXTtcbmNvbnN0IE5PT1AgPSAoKSA9PiB7XG59O1xuY29uc3QgTk8gPSAoKSA9PiBmYWxzZTtcbmNvbnN0IGlzT24gPSAoa2V5KSA9PiBrZXkuY2hhckNvZGVBdCgwKSA9PT0gMTExICYmIGtleS5jaGFyQ29kZUF0KDEpID09PSAxMTAgJiYgLy8gdXBwZXJjYXNlIGxldHRlclxuKGtleS5jaGFyQ29kZUF0KDIpID4gMTIyIHx8IGtleS5jaGFyQ29kZUF0KDIpIDwgOTcpO1xuY29uc3QgaXNNb2RlbExpc3RlbmVyID0gKGtleSkgPT4ga2V5LnN0YXJ0c1dpdGgoXCJvblVwZGF0ZTpcIik7XG5jb25zdCBleHRlbmQgPSBPYmplY3QuYXNzaWduO1xuY29uc3QgcmVtb3ZlID0gKGFyciwgZWwpID0+IHtcbiAgY29uc3QgaSA9IGFyci5pbmRleE9mKGVsKTtcbiAgaWYgKGkgPiAtMSkge1xuICAgIGFyci5zcGxpY2UoaSwgMSk7XG4gIH1cbn07XG5jb25zdCBoYXNPd25Qcm9wZXJ0eSA9IE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHk7XG5jb25zdCBoYXNPd24gPSAodmFsLCBrZXkpID0+IGhhc093blByb3BlcnR5LmNhbGwodmFsLCBrZXkpO1xuY29uc3QgaXNBcnJheSA9IEFycmF5LmlzQXJyYXk7XG5jb25zdCBpc01hcCA9ICh2YWwpID0+IHRvVHlwZVN0cmluZyh2YWwpID09PSBcIltvYmplY3QgTWFwXVwiO1xuY29uc3QgaXNTZXQgPSAodmFsKSA9PiB0b1R5cGVTdHJpbmcodmFsKSA9PT0gXCJbb2JqZWN0IFNldF1cIjtcbmNvbnN0IGlzRGF0ZSA9ICh2YWwpID0+IHRvVHlwZVN0cmluZyh2YWwpID09PSBcIltvYmplY3QgRGF0ZV1cIjtcbmNvbnN0IGlzUmVnRXhwID0gKHZhbCkgPT4gdG9UeXBlU3RyaW5nKHZhbCkgPT09IFwiW29iamVjdCBSZWdFeHBdXCI7XG5jb25zdCBpc0Z1bmN0aW9uID0gKHZhbCkgPT4gdHlwZW9mIHZhbCA9PT0gXCJmdW5jdGlvblwiO1xuY29uc3QgaXNTdHJpbmcgPSAodmFsKSA9PiB0eXBlb2YgdmFsID09PSBcInN0cmluZ1wiO1xuY29uc3QgaXNTeW1ib2wgPSAodmFsKSA9PiB0eXBlb2YgdmFsID09PSBcInN5bWJvbFwiO1xuY29uc3QgaXNPYmplY3QgPSAodmFsKSA9PiB2YWwgIT09IG51bGwgJiYgdHlwZW9mIHZhbCA9PT0gXCJvYmplY3RcIjtcbmNvbnN0IGlzUHJvbWlzZSA9ICh2YWwpID0+IHtcbiAgcmV0dXJuIChpc09iamVjdCh2YWwpIHx8IGlzRnVuY3Rpb24odmFsKSkgJiYgaXNGdW5jdGlvbih2YWwudGhlbikgJiYgaXNGdW5jdGlvbih2YWwuY2F0Y2gpO1xufTtcbmNvbnN0IG9iamVjdFRvU3RyaW5nID0gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZztcbmNvbnN0IHRvVHlwZVN0cmluZyA9ICh2YWx1ZSkgPT4gb2JqZWN0VG9TdHJpbmcuY2FsbCh2YWx1ZSk7XG5jb25zdCB0b1Jhd1R5cGUgPSAodmFsdWUpID0+IHtcbiAgcmV0dXJuIHRvVHlwZVN0cmluZyh2YWx1ZSkuc2xpY2UoOCwgLTEpO1xufTtcbmNvbnN0IGlzUGxhaW5PYmplY3QgPSAodmFsKSA9PiB0b1R5cGVTdHJpbmcodmFsKSA9PT0gXCJbb2JqZWN0IE9iamVjdF1cIjtcbmNvbnN0IGlzSW50ZWdlcktleSA9IChrZXkpID0+IGlzU3RyaW5nKGtleSkgJiYga2V5ICE9PSBcIk5hTlwiICYmIGtleVswXSAhPT0gXCItXCIgJiYgXCJcIiArIHBhcnNlSW50KGtleSwgMTApID09PSBrZXk7XG5jb25zdCBpc1Jlc2VydmVkUHJvcCA9IC8qIEBfX1BVUkVfXyAqLyBtYWtlTWFwKFxuICAvLyB0aGUgbGVhZGluZyBjb21tYSBpcyBpbnRlbnRpb25hbCBzbyBlbXB0eSBzdHJpbmcgXCJcIiBpcyBhbHNvIGluY2x1ZGVkXG4gIFwiLGtleSxyZWYscmVmX2ZvcixyZWZfa2V5LG9uVm5vZGVCZWZvcmVNb3VudCxvblZub2RlTW91bnRlZCxvblZub2RlQmVmb3JlVXBkYXRlLG9uVm5vZGVVcGRhdGVkLG9uVm5vZGVCZWZvcmVVbm1vdW50LG9uVm5vZGVVbm1vdW50ZWRcIlxuKTtcbmNvbnN0IGlzQnVpbHRJbkRpcmVjdGl2ZSA9IC8qIEBfX1BVUkVfXyAqLyBtYWtlTWFwKFxuICBcImJpbmQsY2xvYWssZWxzZS1pZixlbHNlLGZvcixodG1sLGlmLG1vZGVsLG9uLG9uY2UscHJlLHNob3csc2xvdCx0ZXh0LG1lbW9cIlxuKTtcbmNvbnN0IGNhY2hlU3RyaW5nRnVuY3Rpb24gPSAoZm4pID0+IHtcbiAgY29uc3QgY2FjaGUgPSAvKiBAX19QVVJFX18gKi8gT2JqZWN0LmNyZWF0ZShudWxsKTtcbiAgcmV0dXJuICgoc3RyKSA9PiB7XG4gICAgY29uc3QgaGl0ID0gY2FjaGVbc3RyXTtcbiAgICByZXR1cm4gaGl0IHx8IChjYWNoZVtzdHJdID0gZm4oc3RyKSk7XG4gIH0pO1xufTtcbmNvbnN0IGNhbWVsaXplUkUgPSAvLVxcdy9nO1xuY29uc3QgY2FtZWxpemUgPSBjYWNoZVN0cmluZ0Z1bmN0aW9uKFxuICAoc3RyKSA9PiB7XG4gICAgcmV0dXJuIHN0ci5yZXBsYWNlKGNhbWVsaXplUkUsIChjKSA9PiBjLnNsaWNlKDEpLnRvVXBwZXJDYXNlKCkpO1xuICB9XG4pO1xuY29uc3QgaHlwaGVuYXRlUkUgPSAvXFxCKFtBLVpdKS9nO1xuY29uc3QgaHlwaGVuYXRlID0gY2FjaGVTdHJpbmdGdW5jdGlvbihcbiAgKHN0cikgPT4gc3RyLnJlcGxhY2UoaHlwaGVuYXRlUkUsIFwiLSQxXCIpLnRvTG93ZXJDYXNlKClcbik7XG5jb25zdCBjYXBpdGFsaXplID0gY2FjaGVTdHJpbmdGdW5jdGlvbigoc3RyKSA9PiB7XG4gIHJldHVybiBzdHIuY2hhckF0KDApLnRvVXBwZXJDYXNlKCkgKyBzdHIuc2xpY2UoMSk7XG59KTtcbmNvbnN0IHRvSGFuZGxlcktleSA9IGNhY2hlU3RyaW5nRnVuY3Rpb24oXG4gIChzdHIpID0+IHtcbiAgICBjb25zdCBzID0gc3RyID8gYG9uJHtjYXBpdGFsaXplKHN0cil9YCA6IGBgO1xuICAgIHJldHVybiBzO1xuICB9XG4pO1xuY29uc3QgaGFzQ2hhbmdlZCA9ICh2YWx1ZSwgb2xkVmFsdWUpID0+ICFPYmplY3QuaXModmFsdWUsIG9sZFZhbHVlKTtcbmNvbnN0IGludm9rZUFycmF5Rm5zID0gKGZucywgLi4uYXJnKSA9PiB7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgZm5zLmxlbmd0aDsgaSsrKSB7XG4gICAgZm5zW2ldKC4uLmFyZyk7XG4gIH1cbn07XG5jb25zdCBkZWYgPSAob2JqLCBrZXksIHZhbHVlLCB3cml0YWJsZSA9IGZhbHNlKSA9PiB7XG4gIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShvYmosIGtleSwge1xuICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZSxcbiAgICBlbnVtZXJhYmxlOiBmYWxzZSxcbiAgICB3cml0YWJsZSxcbiAgICB2YWx1ZVxuICB9KTtcbn07XG5jb25zdCBsb29zZVRvTnVtYmVyID0gKHZhbCkgPT4ge1xuICBjb25zdCBuID0gcGFyc2VGbG9hdCh2YWwpO1xuICByZXR1cm4gaXNOYU4obikgPyB2YWwgOiBuO1xufTtcbmNvbnN0IHRvTnVtYmVyID0gKHZhbCkgPT4ge1xuICBjb25zdCBuID0gaXNTdHJpbmcodmFsKSA/IE51bWJlcih2YWwpIDogTmFOO1xuICByZXR1cm4gaXNOYU4obikgPyB2YWwgOiBuO1xufTtcbmxldCBfZ2xvYmFsVGhpcztcbmNvbnN0IGdldEdsb2JhbFRoaXMgPSAoKSA9PiB7XG4gIHJldHVybiBfZ2xvYmFsVGhpcyB8fCAoX2dsb2JhbFRoaXMgPSB0eXBlb2YgZ2xvYmFsVGhpcyAhPT0gXCJ1bmRlZmluZWRcIiA/IGdsb2JhbFRoaXMgOiB0eXBlb2Ygc2VsZiAhPT0gXCJ1bmRlZmluZWRcIiA/IHNlbGYgOiB0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93IDogdHlwZW9mIGdsb2JhbCAhPT0gXCJ1bmRlZmluZWRcIiA/IGdsb2JhbCA6IHt9KTtcbn07XG5jb25zdCBpZGVudFJFID0gL15bXyRhLXpBLVpcXHhBMC1cXHVGRkZGXVtfJGEtekEtWjAtOVxceEEwLVxcdUZGRkZdKiQvO1xuZnVuY3Rpb24gZ2VuUHJvcHNBY2Nlc3NFeHAobmFtZSkge1xuICByZXR1cm4gaWRlbnRSRS50ZXN0KG5hbWUpID8gYF9fcHJvcHMuJHtuYW1lfWAgOiBgX19wcm9wc1ske0pTT04uc3RyaW5naWZ5KG5hbWUpfV1gO1xufVxuZnVuY3Rpb24gZ2VuQ2FjaGVLZXkoc291cmNlLCBvcHRpb25zKSB7XG4gIHJldHVybiBzb3VyY2UgKyBKU09OLnN0cmluZ2lmeShcbiAgICBvcHRpb25zLFxuICAgIChfLCB2YWwpID0+IHR5cGVvZiB2YWwgPT09IFwiZnVuY3Rpb25cIiA/IHZhbC50b1N0cmluZygpIDogdmFsXG4gICk7XG59XG5cbmNvbnN0IFBhdGNoRmxhZ3MgPSB7XG4gIFwiVEVYVFwiOiAxLFxuICBcIjFcIjogXCJURVhUXCIsXG4gIFwiQ0xBU1NcIjogMixcbiAgXCIyXCI6IFwiQ0xBU1NcIixcbiAgXCJTVFlMRVwiOiA0LFxuICBcIjRcIjogXCJTVFlMRVwiLFxuICBcIlBST1BTXCI6IDgsXG4gIFwiOFwiOiBcIlBST1BTXCIsXG4gIFwiRlVMTF9QUk9QU1wiOiAxNixcbiAgXCIxNlwiOiBcIkZVTExfUFJPUFNcIixcbiAgXCJORUVEX0hZRFJBVElPTlwiOiAzMixcbiAgXCIzMlwiOiBcIk5FRURfSFlEUkFUSU9OXCIsXG4gIFwiU1RBQkxFX0ZSQUdNRU5UXCI6IDY0LFxuICBcIjY0XCI6IFwiU1RBQkxFX0ZSQUdNRU5UXCIsXG4gIFwiS0VZRURfRlJBR01FTlRcIjogMTI4LFxuICBcIjEyOFwiOiBcIktFWUVEX0ZSQUdNRU5UXCIsXG4gIFwiVU5LRVlFRF9GUkFHTUVOVFwiOiAyNTYsXG4gIFwiMjU2XCI6IFwiVU5LRVlFRF9GUkFHTUVOVFwiLFxuICBcIk5FRURfUEFUQ0hcIjogNTEyLFxuICBcIjUxMlwiOiBcIk5FRURfUEFUQ0hcIixcbiAgXCJEWU5BTUlDX1NMT1RTXCI6IDEwMjQsXG4gIFwiMTAyNFwiOiBcIkRZTkFNSUNfU0xPVFNcIixcbiAgXCJERVZfUk9PVF9GUkFHTUVOVFwiOiAyMDQ4LFxuICBcIjIwNDhcIjogXCJERVZfUk9PVF9GUkFHTUVOVFwiLFxuICBcIkNBQ0hFRFwiOiAtMSxcbiAgXCItMVwiOiBcIkNBQ0hFRFwiLFxuICBcIkJBSUxcIjogLTIsXG4gIFwiLTJcIjogXCJCQUlMXCJcbn07XG5jb25zdCBQYXRjaEZsYWdOYW1lcyA9IHtcbiAgWzFdOiBgVEVYVGAsXG4gIFsyXTogYENMQVNTYCxcbiAgWzRdOiBgU1RZTEVgLFxuICBbOF06IGBQUk9QU2AsXG4gIFsxNl06IGBGVUxMX1BST1BTYCxcbiAgWzMyXTogYE5FRURfSFlEUkFUSU9OYCxcbiAgWzY0XTogYFNUQUJMRV9GUkFHTUVOVGAsXG4gIFsxMjhdOiBgS0VZRURfRlJBR01FTlRgLFxuICBbMjU2XTogYFVOS0VZRURfRlJBR01FTlRgLFxuICBbNTEyXTogYE5FRURfUEFUQ0hgLFxuICBbMTAyNF06IGBEWU5BTUlDX1NMT1RTYCxcbiAgWzIwNDhdOiBgREVWX1JPT1RfRlJBR01FTlRgLFxuICBbLTFdOiBgQ0FDSEVEYCxcbiAgWy0yXTogYEJBSUxgXG59O1xuXG5jb25zdCBTaGFwZUZsYWdzID0ge1xuICBcIkVMRU1FTlRcIjogMSxcbiAgXCIxXCI6IFwiRUxFTUVOVFwiLFxuICBcIkZVTkNUSU9OQUxfQ09NUE9ORU5UXCI6IDIsXG4gIFwiMlwiOiBcIkZVTkNUSU9OQUxfQ09NUE9ORU5UXCIsXG4gIFwiU1RBVEVGVUxfQ09NUE9ORU5UXCI6IDQsXG4gIFwiNFwiOiBcIlNUQVRFRlVMX0NPTVBPTkVOVFwiLFxuICBcIlRFWFRfQ0hJTERSRU5cIjogOCxcbiAgXCI4XCI6IFwiVEVYVF9DSElMRFJFTlwiLFxuICBcIkFSUkFZX0NISUxEUkVOXCI6IDE2LFxuICBcIjE2XCI6IFwiQVJSQVlfQ0hJTERSRU5cIixcbiAgXCJTTE9UU19DSElMRFJFTlwiOiAzMixcbiAgXCIzMlwiOiBcIlNMT1RTX0NISUxEUkVOXCIsXG4gIFwiVEVMRVBPUlRcIjogNjQsXG4gIFwiNjRcIjogXCJURUxFUE9SVFwiLFxuICBcIlNVU1BFTlNFXCI6IDEyOCxcbiAgXCIxMjhcIjogXCJTVVNQRU5TRVwiLFxuICBcIkNPTVBPTkVOVF9TSE9VTERfS0VFUF9BTElWRVwiOiAyNTYsXG4gIFwiMjU2XCI6IFwiQ09NUE9ORU5UX1NIT1VMRF9LRUVQX0FMSVZFXCIsXG4gIFwiQ09NUE9ORU5UX0tFUFRfQUxJVkVcIjogNTEyLFxuICBcIjUxMlwiOiBcIkNPTVBPTkVOVF9LRVBUX0FMSVZFXCIsXG4gIFwiQ09NUE9ORU5UXCI6IDYsXG4gIFwiNlwiOiBcIkNPTVBPTkVOVFwiXG59O1xuXG5jb25zdCBTbG90RmxhZ3MgPSB7XG4gIFwiU1RBQkxFXCI6IDEsXG4gIFwiMVwiOiBcIlNUQUJMRVwiLFxuICBcIkRZTkFNSUNcIjogMixcbiAgXCIyXCI6IFwiRFlOQU1JQ1wiLFxuICBcIkZPUldBUkRFRFwiOiAzLFxuICBcIjNcIjogXCJGT1JXQVJERURcIlxufTtcbmNvbnN0IHNsb3RGbGFnc1RleHQgPSB7XG4gIFsxXTogXCJTVEFCTEVcIixcbiAgWzJdOiBcIkRZTkFNSUNcIixcbiAgWzNdOiBcIkZPUldBUkRFRFwiXG59O1xuXG5jb25zdCBHTE9CQUxTX0FMTE9XRUQgPSBcIkluZmluaXR5LHVuZGVmaW5lZCxOYU4saXNGaW5pdGUsaXNOYU4scGFyc2VGbG9hdCxwYXJzZUludCxkZWNvZGVVUkksZGVjb2RlVVJJQ29tcG9uZW50LGVuY29kZVVSSSxlbmNvZGVVUklDb21wb25lbnQsTWF0aCxOdW1iZXIsRGF0ZSxBcnJheSxPYmplY3QsQm9vbGVhbixTdHJpbmcsUmVnRXhwLE1hcCxTZXQsSlNPTixJbnRsLEJpZ0ludCxjb25zb2xlLEVycm9yLFN5bWJvbFwiO1xuY29uc3QgaXNHbG9iYWxseUFsbG93ZWQgPSAvKiBAX19QVVJFX18gKi8gbWFrZU1hcChHTE9CQUxTX0FMTE9XRUQpO1xuY29uc3QgaXNHbG9iYWxseVdoaXRlbGlzdGVkID0gaXNHbG9iYWxseUFsbG93ZWQ7XG5cbmNvbnN0IHJhbmdlID0gMjtcbmZ1bmN0aW9uIGdlbmVyYXRlQ29kZUZyYW1lKHNvdXJjZSwgc3RhcnQgPSAwLCBlbmQgPSBzb3VyY2UubGVuZ3RoKSB7XG4gIHN0YXJ0ID0gTWF0aC5tYXgoMCwgTWF0aC5taW4oc3RhcnQsIHNvdXJjZS5sZW5ndGgpKTtcbiAgZW5kID0gTWF0aC5tYXgoMCwgTWF0aC5taW4oZW5kLCBzb3VyY2UubGVuZ3RoKSk7XG4gIGlmIChzdGFydCA+IGVuZCkgcmV0dXJuIFwiXCI7XG4gIGxldCBsaW5lcyA9IHNvdXJjZS5zcGxpdCgvKFxccj9cXG4pLyk7XG4gIGNvbnN0IG5ld2xpbmVTZXF1ZW5jZXMgPSBsaW5lcy5maWx0ZXIoKF8sIGlkeCkgPT4gaWR4ICUgMiA9PT0gMSk7XG4gIGxpbmVzID0gbGluZXMuZmlsdGVyKChfLCBpZHgpID0+IGlkeCAlIDIgPT09IDApO1xuICBsZXQgY291bnQgPSAwO1xuICBjb25zdCByZXMgPSBbXTtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBsaW5lcy5sZW5ndGg7IGkrKykge1xuICAgIGNvdW50ICs9IGxpbmVzW2ldLmxlbmd0aCArIChuZXdsaW5lU2VxdWVuY2VzW2ldICYmIG5ld2xpbmVTZXF1ZW5jZXNbaV0ubGVuZ3RoIHx8IDApO1xuICAgIGlmIChjb3VudCA+PSBzdGFydCkge1xuICAgICAgZm9yIChsZXQgaiA9IGkgLSByYW5nZTsgaiA8PSBpICsgcmFuZ2UgfHwgZW5kID4gY291bnQ7IGorKykge1xuICAgICAgICBpZiAoaiA8IDAgfHwgaiA+PSBsaW5lcy5sZW5ndGgpIGNvbnRpbnVlO1xuICAgICAgICBjb25zdCBsaW5lID0gaiArIDE7XG4gICAgICAgIHJlcy5wdXNoKFxuICAgICAgICAgIGAke2xpbmV9JHtcIiBcIi5yZXBlYXQoTWF0aC5tYXgoMyAtIFN0cmluZyhsaW5lKS5sZW5ndGgsIDApKX18ICAke2xpbmVzW2pdfWBcbiAgICAgICAgKTtcbiAgICAgICAgY29uc3QgbGluZUxlbmd0aCA9IGxpbmVzW2pdLmxlbmd0aDtcbiAgICAgICAgY29uc3QgbmV3TGluZVNlcUxlbmd0aCA9IG5ld2xpbmVTZXF1ZW5jZXNbal0gJiYgbmV3bGluZVNlcXVlbmNlc1tqXS5sZW5ndGggfHwgMDtcbiAgICAgICAgaWYgKGogPT09IGkpIHtcbiAgICAgICAgICBjb25zdCBwYWQgPSBzdGFydCAtIChjb3VudCAtIChsaW5lTGVuZ3RoICsgbmV3TGluZVNlcUxlbmd0aCkpO1xuICAgICAgICAgIGNvbnN0IGxlbmd0aCA9IE1hdGgubWF4KFxuICAgICAgICAgICAgMSxcbiAgICAgICAgICAgIGVuZCA+IGNvdW50ID8gbGluZUxlbmd0aCAtIHBhZCA6IGVuZCAtIHN0YXJ0XG4gICAgICAgICAgKTtcbiAgICAgICAgICByZXMucHVzaChgICAgfCAgYCArIFwiIFwiLnJlcGVhdChwYWQpICsgXCJeXCIucmVwZWF0KGxlbmd0aCkpO1xuICAgICAgICB9IGVsc2UgaWYgKGogPiBpKSB7XG4gICAgICAgICAgaWYgKGVuZCA+IGNvdW50KSB7XG4gICAgICAgICAgICBjb25zdCBsZW5ndGggPSBNYXRoLm1heChNYXRoLm1pbihlbmQgLSBjb3VudCwgbGluZUxlbmd0aCksIDEpO1xuICAgICAgICAgICAgcmVzLnB1c2goYCAgIHwgIGAgKyBcIl5cIi5yZXBlYXQobGVuZ3RoKSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGNvdW50ICs9IGxpbmVMZW5ndGggKyBuZXdMaW5lU2VxTGVuZ3RoO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBicmVhaztcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHJlcy5qb2luKFwiXFxuXCIpO1xufVxuXG5mdW5jdGlvbiBub3JtYWxpemVTdHlsZSh2YWx1ZSkge1xuICBpZiAoaXNBcnJheSh2YWx1ZSkpIHtcbiAgICBjb25zdCByZXMgPSB7fTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHZhbHVlLmxlbmd0aDsgaSsrKSB7XG4gICAgICBjb25zdCBpdGVtID0gdmFsdWVbaV07XG4gICAgICBjb25zdCBub3JtYWxpemVkID0gaXNTdHJpbmcoaXRlbSkgPyBwYXJzZVN0cmluZ1N0eWxlKGl0ZW0pIDogbm9ybWFsaXplU3R5bGUoaXRlbSk7XG4gICAgICBpZiAobm9ybWFsaXplZCkge1xuICAgICAgICBmb3IgKGNvbnN0IGtleSBpbiBub3JtYWxpemVkKSB7XG4gICAgICAgICAgcmVzW2tleV0gPSBub3JtYWxpemVkW2tleV07XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHJlcztcbiAgfSBlbHNlIGlmIChpc1N0cmluZyh2YWx1ZSkgfHwgaXNPYmplY3QodmFsdWUpKSB7XG4gICAgcmV0dXJuIHZhbHVlO1xuICB9XG59XG5jb25zdCBsaXN0RGVsaW1pdGVyUkUgPSAvOyg/IVteKF0qXFwpKS9nO1xuY29uc3QgcHJvcGVydHlEZWxpbWl0ZXJSRSA9IC86KFteXSspLztcbmNvbnN0IHN0eWxlQ29tbWVudFJFID0gL1xcL1xcKlteXSo/XFwqXFwvL2c7XG5mdW5jdGlvbiBwYXJzZVN0cmluZ1N0eWxlKGNzc1RleHQpIHtcbiAgY29uc3QgcmV0ID0ge307XG4gIGNzc1RleHQucmVwbGFjZShzdHlsZUNvbW1lbnRSRSwgXCJcIikuc3BsaXQobGlzdERlbGltaXRlclJFKS5mb3JFYWNoKChpdGVtKSA9PiB7XG4gICAgaWYgKGl0ZW0pIHtcbiAgICAgIGNvbnN0IHRtcCA9IGl0ZW0uc3BsaXQocHJvcGVydHlEZWxpbWl0ZXJSRSk7XG4gICAgICB0bXAubGVuZ3RoID4gMSAmJiAocmV0W3RtcFswXS50cmltKCldID0gdG1wWzFdLnRyaW0oKSk7XG4gICAgfVxuICB9KTtcbiAgcmV0dXJuIHJldDtcbn1cbmZ1bmN0aW9uIHN0cmluZ2lmeVN0eWxlKHN0eWxlcykge1xuICBpZiAoIXN0eWxlcykgcmV0dXJuIFwiXCI7XG4gIGlmIChpc1N0cmluZyhzdHlsZXMpKSByZXR1cm4gc3R5bGVzO1xuICBsZXQgcmV0ID0gXCJcIjtcbiAgZm9yIChjb25zdCBrZXkgaW4gc3R5bGVzKSB7XG4gICAgY29uc3QgdmFsdWUgPSBzdHlsZXNba2V5XTtcbiAgICBpZiAoaXNTdHJpbmcodmFsdWUpIHx8IHR5cGVvZiB2YWx1ZSA9PT0gXCJudW1iZXJcIikge1xuICAgICAgY29uc3Qgbm9ybWFsaXplZEtleSA9IGtleS5zdGFydHNXaXRoKGAtLWApID8ga2V5IDogaHlwaGVuYXRlKGtleSk7XG4gICAgICByZXQgKz0gYCR7bm9ybWFsaXplZEtleX06JHt2YWx1ZX07YDtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHJldDtcbn1cbmZ1bmN0aW9uIG5vcm1hbGl6ZUNsYXNzKHZhbHVlKSB7XG4gIGxldCByZXMgPSBcIlwiO1xuICBpZiAoaXNTdHJpbmcodmFsdWUpKSB7XG4gICAgcmVzID0gdmFsdWU7XG4gIH0gZWxzZSBpZiAoaXNBcnJheSh2YWx1ZSkpIHtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHZhbHVlLmxlbmd0aDsgaSsrKSB7XG4gICAgICBjb25zdCBub3JtYWxpemVkID0gbm9ybWFsaXplQ2xhc3ModmFsdWVbaV0pO1xuICAgICAgaWYgKG5vcm1hbGl6ZWQpIHtcbiAgICAgICAgcmVzICs9IG5vcm1hbGl6ZWQgKyBcIiBcIjtcbiAgICAgIH1cbiAgICB9XG4gIH0gZWxzZSBpZiAoaXNPYmplY3QodmFsdWUpKSB7XG4gICAgZm9yIChjb25zdCBuYW1lIGluIHZhbHVlKSB7XG4gICAgICBpZiAodmFsdWVbbmFtZV0pIHtcbiAgICAgICAgcmVzICs9IG5hbWUgKyBcIiBcIjtcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgcmV0dXJuIHJlcy50cmltKCk7XG59XG5mdW5jdGlvbiBub3JtYWxpemVQcm9wcyhwcm9wcykge1xuICBpZiAoIXByb3BzKSByZXR1cm4gbnVsbDtcbiAgbGV0IHsgY2xhc3M6IGtsYXNzLCBzdHlsZSB9ID0gcHJvcHM7XG4gIGlmIChrbGFzcyAmJiAhaXNTdHJpbmcoa2xhc3MpKSB7XG4gICAgcHJvcHMuY2xhc3MgPSBub3JtYWxpemVDbGFzcyhrbGFzcyk7XG4gIH1cbiAgaWYgKHN0eWxlKSB7XG4gICAgcHJvcHMuc3R5bGUgPSBub3JtYWxpemVTdHlsZShzdHlsZSk7XG4gIH1cbiAgcmV0dXJuIHByb3BzO1xufVxuXG5jb25zdCBIVE1MX1RBR1MgPSBcImh0bWwsYm9keSxiYXNlLGhlYWQsbGluayxtZXRhLHN0eWxlLHRpdGxlLGFkZHJlc3MsYXJ0aWNsZSxhc2lkZSxmb290ZXIsaGVhZGVyLGhncm91cCxoMSxoMixoMyxoNCxoNSxoNixuYXYsc2VjdGlvbixkaXYsZGQsZGwsZHQsZmlnY2FwdGlvbixmaWd1cmUscGljdHVyZSxocixpbWcsbGksbWFpbixvbCxwLHByZSx1bCxhLGIsYWJicixiZGksYmRvLGJyLGNpdGUsY29kZSxkYXRhLGRmbixlbSxpLGtiZCxtYXJrLHEscnAscnQscnVieSxzLHNhbXAsc21hbGwsc3BhbixzdHJvbmcsc3ViLHN1cCx0aW1lLHUsdmFyLHdicixhcmVhLGF1ZGlvLG1hcCx0cmFjayx2aWRlbyxlbWJlZCxvYmplY3QscGFyYW0sc291cmNlLGNhbnZhcyxzY3JpcHQsbm9zY3JpcHQsZGVsLGlucyxjYXB0aW9uLGNvbCxjb2xncm91cCx0YWJsZSx0aGVhZCx0Ym9keSx0ZCx0aCx0cixidXR0b24sZGF0YWxpc3QsZmllbGRzZXQsZm9ybSxpbnB1dCxsYWJlbCxsZWdlbmQsbWV0ZXIsb3B0Z3JvdXAsb3B0aW9uLG91dHB1dCxwcm9ncmVzcyxzZWxlY3QsdGV4dGFyZWEsZGV0YWlscyxkaWFsb2csbWVudSxzdW1tYXJ5LHRlbXBsYXRlLGJsb2NrcXVvdGUsaWZyYW1lLHRmb290XCI7XG5jb25zdCBTVkdfVEFHUyA9IFwic3ZnLGFuaW1hdGUsYW5pbWF0ZU1vdGlvbixhbmltYXRlVHJhbnNmb3JtLGNpcmNsZSxjbGlwUGF0aCxjb2xvci1wcm9maWxlLGRlZnMsZGVzYyxkaXNjYXJkLGVsbGlwc2UsZmVCbGVuZCxmZUNvbG9yTWF0cml4LGZlQ29tcG9uZW50VHJhbnNmZXIsZmVDb21wb3NpdGUsZmVDb252b2x2ZU1hdHJpeCxmZURpZmZ1c2VMaWdodGluZyxmZURpc3BsYWNlbWVudE1hcCxmZURpc3RhbnRMaWdodCxmZURyb3BTaGFkb3csZmVGbG9vZCxmZUZ1bmNBLGZlRnVuY0IsZmVGdW5jRyxmZUZ1bmNSLGZlR2F1c3NpYW5CbHVyLGZlSW1hZ2UsZmVNZXJnZSxmZU1lcmdlTm9kZSxmZU1vcnBob2xvZ3ksZmVPZmZzZXQsZmVQb2ludExpZ2h0LGZlU3BlY3VsYXJMaWdodGluZyxmZVNwb3RMaWdodCxmZVRpbGUsZmVUdXJidWxlbmNlLGZpbHRlcixmb3JlaWduT2JqZWN0LGcsaGF0Y2gsaGF0Y2hwYXRoLGltYWdlLGxpbmUsbGluZWFyR3JhZGllbnQsbWFya2VyLG1hc2ssbWVzaCxtZXNoZ3JhZGllbnQsbWVzaHBhdGNoLG1lc2hyb3csbWV0YWRhdGEsbXBhdGgscGF0aCxwYXR0ZXJuLHBvbHlnb24scG9seWxpbmUscmFkaWFsR3JhZGllbnQscmVjdCxzZXQsc29saWRjb2xvcixzdG9wLHN3aXRjaCxzeW1ib2wsdGV4dCx0ZXh0UGF0aCx0aXRsZSx0c3Bhbix1bmtub3duLHVzZSx2aWV3XCI7XG5jb25zdCBNQVRIX1RBR1MgPSBcImFubm90YXRpb24sYW5ub3RhdGlvbi14bWwsbWFjdGlvbixtYWxpZ25ncm91cCxtYWxpZ25tYXJrLG1hdGgsbWVuY2xvc2UsbWVycm9yLG1mZW5jZWQsbWZyYWMsbWZyYWN0aW9uLG1nbHlwaCxtaSxtbGFiZWxlZHRyLG1sb25nZGl2LG1tdWx0aXNjcmlwdHMsbW4sbW8sbW92ZXIsbXBhZGRlZCxtcGhhbnRvbSxtcHJlc2NyaXB0cyxtcm9vdCxtcm93LG1zLG1zY2Fycmllcyxtc2NhcnJ5LG1zZ3JvdXAsbXNsaW5lLG1zcGFjZSxtc3FydCxtc3Jvdyxtc3RhY2ssbXN0eWxlLG1zdWIsbXN1YnN1cCxtc3VwLG10YWJsZSxtdGQsbXRleHQsbXRyLG11bmRlcixtdW5kZXJvdmVyLG5vbmUsc2VtYW50aWNzXCI7XG5jb25zdCBWT0lEX1RBR1MgPSBcImFyZWEsYmFzZSxicixjb2wsZW1iZWQsaHIsaW1nLGlucHV0LGxpbmssbWV0YSxwYXJhbSxzb3VyY2UsdHJhY2ssd2JyXCI7XG5jb25zdCBpc0hUTUxUYWcgPSAvKiBAX19QVVJFX18gKi8gbWFrZU1hcChIVE1MX1RBR1MpO1xuY29uc3QgaXNTVkdUYWcgPSAvKiBAX19QVVJFX18gKi8gbWFrZU1hcChTVkdfVEFHUyk7XG5jb25zdCBpc01hdGhNTFRhZyA9IC8qIEBfX1BVUkVfXyAqLyBtYWtlTWFwKE1BVEhfVEFHUyk7XG5jb25zdCBpc1ZvaWRUYWcgPSAvKiBAX19QVVJFX18gKi8gbWFrZU1hcChWT0lEX1RBR1MpO1xuXG5jb25zdCBzcGVjaWFsQm9vbGVhbkF0dHJzID0gYGl0ZW1zY29wZSxhbGxvd2Z1bGxzY3JlZW4sZm9ybW5vdmFsaWRhdGUsaXNtYXAsbm9tb2R1bGUsbm92YWxpZGF0ZSxyZWFkb25seWA7XG5jb25zdCBpc1NwZWNpYWxCb29sZWFuQXR0ciA9IC8qIEBfX1BVUkVfXyAqLyBtYWtlTWFwKHNwZWNpYWxCb29sZWFuQXR0cnMpO1xuY29uc3QgaXNCb29sZWFuQXR0ciA9IC8qIEBfX1BVUkVfXyAqLyBtYWtlTWFwKFxuICBzcGVjaWFsQm9vbGVhbkF0dHJzICsgYCxhc3luYyxhdXRvZm9jdXMsYXV0b3BsYXksY29udHJvbHMsZGVmYXVsdCxkZWZlcixkaXNhYmxlZCxoaWRkZW4saW5lcnQsbG9vcCxvcGVuLHJlcXVpcmVkLHJldmVyc2VkLHNjb3BlZCxzZWFtbGVzcyxjaGVja2VkLG11dGVkLG11bHRpcGxlLHNlbGVjdGVkYFxuKTtcbmZ1bmN0aW9uIGluY2x1ZGVCb29sZWFuQXR0cih2YWx1ZSkge1xuICByZXR1cm4gISF2YWx1ZSB8fCB2YWx1ZSA9PT0gXCJcIjtcbn1cbmNvbnN0IHVuc2FmZUF0dHJDaGFyUkUgPSAvWz4vPVwiJ1xcdTAwMDlcXHUwMDBhXFx1MDAwY1xcdTAwMjBdLztcbmNvbnN0IGF0dHJWYWxpZGF0aW9uQ2FjaGUgPSB7fTtcbmZ1bmN0aW9uIGlzU1NSU2FmZUF0dHJOYW1lKG5hbWUpIHtcbiAgaWYgKGF0dHJWYWxpZGF0aW9uQ2FjaGUuaGFzT3duUHJvcGVydHkobmFtZSkpIHtcbiAgICByZXR1cm4gYXR0clZhbGlkYXRpb25DYWNoZVtuYW1lXTtcbiAgfVxuICBjb25zdCBpc1Vuc2FmZSA9IHVuc2FmZUF0dHJDaGFyUkUudGVzdChuYW1lKTtcbiAgaWYgKGlzVW5zYWZlKSB7XG4gICAgY29uc29sZS5lcnJvcihgdW5zYWZlIGF0dHJpYnV0ZSBuYW1lOiAke25hbWV9YCk7XG4gIH1cbiAgcmV0dXJuIGF0dHJWYWxpZGF0aW9uQ2FjaGVbbmFtZV0gPSAhaXNVbnNhZmU7XG59XG5jb25zdCBwcm9wc1RvQXR0ck1hcCA9IHtcbiAgYWNjZXB0Q2hhcnNldDogXCJhY2NlcHQtY2hhcnNldFwiLFxuICBjbGFzc05hbWU6IFwiY2xhc3NcIixcbiAgaHRtbEZvcjogXCJmb3JcIixcbiAgaHR0cEVxdWl2OiBcImh0dHAtZXF1aXZcIlxufTtcbmNvbnN0IGlzS25vd25IdG1sQXR0ciA9IC8qIEBfX1BVUkVfXyAqLyBtYWtlTWFwKFxuICBgYWNjZXB0LGFjY2VwdC1jaGFyc2V0LGFjY2Vzc2tleSxhY3Rpb24sYWxpZ24sYWxsb3csYWx0LGFzeW5jLGF1dG9jYXBpdGFsaXplLGF1dG9jb21wbGV0ZSxhdXRvZm9jdXMsYXV0b3BsYXksYmFja2dyb3VuZCxiZ2NvbG9yLGJvcmRlcixidWZmZXJlZCxjYXB0dXJlLGNoYWxsZW5nZSxjaGFyc2V0LGNoZWNrZWQsY2l0ZSxjbGFzcyxjb2RlLGNvZGViYXNlLGNvbG9yLGNvbHMsY29sc3Bhbixjb250ZW50LGNvbnRlbnRlZGl0YWJsZSxjb250ZXh0bWVudSxjb250cm9scyxjb29yZHMsY3Jvc3NvcmlnaW4sY3NwLGRhdGEsZGF0ZXRpbWUsZGVjb2RpbmcsZGVmYXVsdCxkZWZlcixkaXIsZGlybmFtZSxkaXNhYmxlZCxkb3dubG9hZCxkcmFnZ2FibGUsZHJvcHpvbmUsZW5jdHlwZSxlbnRlcmtleWhpbnQsZm9yLGZvcm0sZm9ybWFjdGlvbixmb3JtZW5jdHlwZSxmb3JtbWV0aG9kLGZvcm1ub3ZhbGlkYXRlLGZvcm10YXJnZXQsaGVhZGVycyxoZWlnaHQsaGlkZGVuLGhpZ2gsaHJlZixocmVmbGFuZyxodHRwLWVxdWl2LGljb24saWQsaW1wb3J0YW5jZSxpbmVydCxpbnRlZ3JpdHksaXNtYXAsaXRlbXByb3Asa2V5dHlwZSxraW5kLGxhYmVsLGxhbmcsbGFuZ3VhZ2UsbG9hZGluZyxsaXN0LGxvb3AsbG93LG1hbmlmZXN0LG1heCxtYXhsZW5ndGgsbWlubGVuZ3RoLG1lZGlhLG1pbixtdWx0aXBsZSxtdXRlZCxuYW1lLG5vdmFsaWRhdGUsb3BlbixvcHRpbXVtLHBhdHRlcm4scGluZyxwbGFjZWhvbGRlcixwb3N0ZXIscHJlbG9hZCxyYWRpb2dyb3VwLHJlYWRvbmx5LHJlZmVycmVycG9saWN5LHJlbCxyZXF1aXJlZCxyZXZlcnNlZCxyb3dzLHJvd3NwYW4sc2FuZGJveCxzY29wZSxzY29wZWQsc2VsZWN0ZWQsc2hhcGUsc2l6ZSxzaXplcyxzbG90LHNwYW4sc3BlbGxjaGVjayxzcmMsc3JjZG9jLHNyY2xhbmcsc3Jjc2V0LHN0YXJ0LHN0ZXAsc3R5bGUsc3VtbWFyeSx0YWJpbmRleCx0YXJnZXQsdGl0bGUsdHJhbnNsYXRlLHR5cGUsdXNlbWFwLHZhbHVlLHdpZHRoLHdyYXBgXG4pO1xuY29uc3QgaXNLbm93blN2Z0F0dHIgPSAvKiBAX19QVVJFX18gKi8gbWFrZU1hcChcbiAgYHhtbG5zLGFjY2VudC1oZWlnaHQsYWNjdW11bGF0ZSxhZGRpdGl2ZSxhbGlnbm1lbnQtYmFzZWxpbmUsYWxwaGFiZXRpYyxhbXBsaXR1ZGUsYXJhYmljLWZvcm0sYXNjZW50LGF0dHJpYnV0ZU5hbWUsYXR0cmlidXRlVHlwZSxhemltdXRoLGJhc2VGcmVxdWVuY3ksYmFzZWxpbmUtc2hpZnQsYmFzZVByb2ZpbGUsYmJveCxiZWdpbixiaWFzLGJ5LGNhbGNNb2RlLGNhcC1oZWlnaHQsY2xhc3MsY2xpcCxjbGlwUGF0aFVuaXRzLGNsaXAtcGF0aCxjbGlwLXJ1bGUsY29sb3IsY29sb3ItaW50ZXJwb2xhdGlvbixjb2xvci1pbnRlcnBvbGF0aW9uLWZpbHRlcnMsY29sb3ItcHJvZmlsZSxjb2xvci1yZW5kZXJpbmcsY29udGVudFNjcmlwdFR5cGUsY29udGVudFN0eWxlVHlwZSxjcm9zc29yaWdpbixjdXJzb3IsY3gsY3ksZCxkZWNlbGVyYXRlLGRlc2NlbnQsZGlmZnVzZUNvbnN0YW50LGRpcmVjdGlvbixkaXNwbGF5LGRpdmlzb3IsZG9taW5hbnQtYmFzZWxpbmUsZHVyLGR4LGR5LGVkZ2VNb2RlLGVsZXZhdGlvbixlbmFibGUtYmFja2dyb3VuZCxlbmQsZXhwb25lbnQsZmlsbCxmaWxsLW9wYWNpdHksZmlsbC1ydWxlLGZpbHRlcixmaWx0ZXJSZXMsZmlsdGVyVW5pdHMsZmxvb2QtY29sb3IsZmxvb2Qtb3BhY2l0eSxmb250LWZhbWlseSxmb250LXNpemUsZm9udC1zaXplLWFkanVzdCxmb250LXN0cmV0Y2gsZm9udC1zdHlsZSxmb250LXZhcmlhbnQsZm9udC13ZWlnaHQsZm9ybWF0LGZyb20sZnIsZngsZnksZzEsZzIsZ2x5cGgtbmFtZSxnbHlwaC1vcmllbnRhdGlvbi1ob3Jpem9udGFsLGdseXBoLW9yaWVudGF0aW9uLXZlcnRpY2FsLGdseXBoUmVmLGdyYWRpZW50VHJhbnNmb3JtLGdyYWRpZW50VW5pdHMsaGFuZ2luZyxoZWlnaHQsaHJlZixocmVmbGFuZyxob3Jpei1hZHYteCxob3Jpei1vcmlnaW4teCxpZCxpZGVvZ3JhcGhpYyxpbWFnZS1yZW5kZXJpbmcsaW4saW4yLGludGVyY2VwdCxrLGsxLGsyLGszLGs0LGtlcm5lbE1hdHJpeCxrZXJuZWxVbml0TGVuZ3RoLGtlcm5pbmcsa2V5UG9pbnRzLGtleVNwbGluZXMsa2V5VGltZXMsbGFuZyxsZW5ndGhBZGp1c3QsbGV0dGVyLXNwYWNpbmcsbGlnaHRpbmctY29sb3IsbGltaXRpbmdDb25lQW5nbGUsbG9jYWwsbWFya2VyLWVuZCxtYXJrZXItbWlkLG1hcmtlci1zdGFydCxtYXJrZXJIZWlnaHQsbWFya2VyVW5pdHMsbWFya2VyV2lkdGgsbWFzayxtYXNrQ29udGVudFVuaXRzLG1hc2tVbml0cyxtYXRoZW1hdGljYWwsbWF4LG1lZGlhLG1ldGhvZCxtaW4sbW9kZSxuYW1lLG51bU9jdGF2ZXMsb2Zmc2V0LG9wYWNpdHksb3BlcmF0b3Isb3JkZXIsb3JpZW50LG9yaWVudGF0aW9uLG9yaWdpbixvdmVyZmxvdyxvdmVybGluZS1wb3NpdGlvbixvdmVybGluZS10aGlja25lc3MscGFub3NlLTEscGFpbnQtb3JkZXIscGF0aCxwYXRoTGVuZ3RoLHBhdHRlcm5Db250ZW50VW5pdHMscGF0dGVyblRyYW5zZm9ybSxwYXR0ZXJuVW5pdHMscGluZyxwb2ludGVyLWV2ZW50cyxwb2ludHMscG9pbnRzQXRYLHBvaW50c0F0WSxwb2ludHNBdFoscHJlc2VydmVBbHBoYSxwcmVzZXJ2ZUFzcGVjdFJhdGlvLHByaW1pdGl2ZVVuaXRzLHIscmFkaXVzLHJlZmVycmVyUG9saWN5LHJlZlgscmVmWSxyZWwscmVuZGVyaW5nLWludGVudCxyZXBlYXRDb3VudCxyZXBlYXREdXIscmVxdWlyZWRFeHRlbnNpb25zLHJlcXVpcmVkRmVhdHVyZXMscmVzdGFydCxyZXN1bHQscm90YXRlLHJ4LHJ5LHNjYWxlLHNlZWQsc2hhcGUtcmVuZGVyaW5nLHNsb3BlLHNwYWNpbmcsc3BlY3VsYXJDb25zdGFudCxzcGVjdWxhckV4cG9uZW50LHNwZWVkLHNwcmVhZE1ldGhvZCxzdGFydE9mZnNldCxzdGREZXZpYXRpb24sc3RlbWgsc3RlbXYsc3RpdGNoVGlsZXMsc3RvcC1jb2xvcixzdG9wLW9wYWNpdHksc3RyaWtldGhyb3VnaC1wb3NpdGlvbixzdHJpa2V0aHJvdWdoLXRoaWNrbmVzcyxzdHJpbmcsc3Ryb2tlLHN0cm9rZS1kYXNoYXJyYXksc3Ryb2tlLWRhc2hvZmZzZXQsc3Ryb2tlLWxpbmVjYXAsc3Ryb2tlLWxpbmVqb2luLHN0cm9rZS1taXRlcmxpbWl0LHN0cm9rZS1vcGFjaXR5LHN0cm9rZS13aWR0aCxzdHlsZSxzdXJmYWNlU2NhbGUsc3lzdGVtTGFuZ3VhZ2UsdGFiaW5kZXgsdGFibGVWYWx1ZXMsdGFyZ2V0LHRhcmdldFgsdGFyZ2V0WSx0ZXh0LWFuY2hvcix0ZXh0LWRlY29yYXRpb24sdGV4dC1yZW5kZXJpbmcsdGV4dExlbmd0aCx0byx0cmFuc2Zvcm0sdHJhbnNmb3JtLW9yaWdpbix0eXBlLHUxLHUyLHVuZGVybGluZS1wb3NpdGlvbix1bmRlcmxpbmUtdGhpY2tuZXNzLHVuaWNvZGUsdW5pY29kZS1iaWRpLHVuaWNvZGUtcmFuZ2UsdW5pdHMtcGVyLWVtLHYtYWxwaGFiZXRpYyx2LWhhbmdpbmcsdi1pZGVvZ3JhcGhpYyx2LW1hdGhlbWF0aWNhbCx2YWx1ZXMsdmVjdG9yLWVmZmVjdCx2ZXJzaW9uLHZlcnQtYWR2LXksdmVydC1vcmlnaW4teCx2ZXJ0LW9yaWdpbi15LHZpZXdCb3gsdmlld1RhcmdldCx2aXNpYmlsaXR5LHdpZHRoLHdpZHRocyx3b3JkLXNwYWNpbmcsd3JpdGluZy1tb2RlLHgseC1oZWlnaHQseDEseDIseENoYW5uZWxTZWxlY3Rvcix4bGluazphY3R1YXRlLHhsaW5rOmFyY3JvbGUseGxpbms6aHJlZix4bGluazpyb2xlLHhsaW5rOnNob3cseGxpbms6dGl0bGUseGxpbms6dHlwZSx4bWxuczp4bGluayx4bWw6YmFzZSx4bWw6bGFuZyx4bWw6c3BhY2UseSx5MSx5Mix5Q2hhbm5lbFNlbGVjdG9yLHosem9vbUFuZFBhbmBcbik7XG5jb25zdCBpc0tub3duTWF0aE1MQXR0ciA9IC8qIEBfX1BVUkVfXyAqLyBtYWtlTWFwKFxuICBgYWNjZW50LGFjY2VudHVuZGVyLGFjdGlvbnR5cGUsYWxpZ24sYWxpZ25tZW50c2NvcGUsYWx0aW1nLGFsdGltZy1oZWlnaHQsYWx0aW1nLXZhbGlnbixhbHRpbWctd2lkdGgsYWx0dGV4dCxiZXZlbGxlZCxjbG9zZSxjb2x1bW5zYWxpZ24sY29sdW1ubGluZXMsY29sdW1uc3BhbixkZW5vbWFsaWduLGRlcHRoLGRpcixkaXNwbGF5LGRpc3BsYXlzdHlsZSxlbmNvZGluZyxlcXVhbGNvbHVtbnMsZXF1YWxyb3dzLGZlbmNlLGZvbnRzdHlsZSxmb250d2VpZ2h0LGZvcm0sZnJhbWUsZnJhbWVzcGFjaW5nLGdyb3VwYWxpZ24saGVpZ2h0LGhyZWYsaWQsaW5kZW50YWxpZ24saW5kZW50YWxpZ25maXJzdCxpbmRlbnRhbGlnbmxhc3QsaW5kZW50c2hpZnQsaW5kZW50c2hpZnRmaXJzdCxpbmRlbnRzaGlmdGxhc3QsaW5kZXh0eXBlLGp1c3RpZnksbGFyZ2V0b3AsbGFyZ2VvcCxscXVvdGUsbHNwYWNlLG1hdGhiYWNrZ3JvdW5kLG1hdGhjb2xvcixtYXRoc2l6ZSxtYXRodmFyaWFudCxtYXhzaXplLG1pbmxhYmVsc3BhY2luZyxtb2RlLG90aGVyLG92ZXJmbG93LHBvc2l0aW9uLHJvd2FsaWduLHJvd2xpbmVzLHJvd3NwYW4scnF1b3RlLHJzcGFjZSxzY3JpcHRsZXZlbCxzY3JpcHRtaW5zaXplLHNjcmlwdHNpemVtdWx0aXBsaWVyLHNlbGVjdGlvbixzZXBhcmF0b3Isc2VwYXJhdG9ycyxzaGlmdCxzaWRlLHNyYyxzdGFja2FsaWduLHN0cmV0Y2h5LHN1YnNjcmlwdHNoaWZ0LHN1cGVyc2NyaXB0c2hpZnQsc3ltbWV0cmljLHZvZmZzZXQsd2lkdGgsd2lkdGhzLHhsaW5rOmhyZWYseGxpbms6c2hvdyx4bGluazp0eXBlLHhtbG5zYFxuKTtcbmZ1bmN0aW9uIGlzUmVuZGVyYWJsZUF0dHJWYWx1ZSh2YWx1ZSkge1xuICBpZiAodmFsdWUgPT0gbnVsbCkge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuICBjb25zdCB0eXBlID0gdHlwZW9mIHZhbHVlO1xuICByZXR1cm4gdHlwZSA9PT0gXCJzdHJpbmdcIiB8fCB0eXBlID09PSBcIm51bWJlclwiIHx8IHR5cGUgPT09IFwiYm9vbGVhblwiO1xufVxuXG5jb25zdCBlc2NhcGVSRSA9IC9bXCInJjw+XS87XG5mdW5jdGlvbiBlc2NhcGVIdG1sKHN0cmluZykge1xuICBjb25zdCBzdHIgPSBcIlwiICsgc3RyaW5nO1xuICBjb25zdCBtYXRjaCA9IGVzY2FwZVJFLmV4ZWMoc3RyKTtcbiAgaWYgKCFtYXRjaCkge1xuICAgIHJldHVybiBzdHI7XG4gIH1cbiAgbGV0IGh0bWwgPSBcIlwiO1xuICBsZXQgZXNjYXBlZDtcbiAgbGV0IGluZGV4O1xuICBsZXQgbGFzdEluZGV4ID0gMDtcbiAgZm9yIChpbmRleCA9IG1hdGNoLmluZGV4OyBpbmRleCA8IHN0ci5sZW5ndGg7IGluZGV4KyspIHtcbiAgICBzd2l0Y2ggKHN0ci5jaGFyQ29kZUF0KGluZGV4KSkge1xuICAgICAgY2FzZSAzNDpcbiAgICAgICAgZXNjYXBlZCA9IFwiJnF1b3Q7XCI7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAzODpcbiAgICAgICAgZXNjYXBlZCA9IFwiJmFtcDtcIjtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIDM5OlxuICAgICAgICBlc2NhcGVkID0gXCImIzM5O1wiO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgNjA6XG4gICAgICAgIGVzY2FwZWQgPSBcIiZsdDtcIjtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIDYyOlxuICAgICAgICBlc2NhcGVkID0gXCImZ3Q7XCI7XG4gICAgICAgIGJyZWFrO1xuICAgICAgZGVmYXVsdDpcbiAgICAgICAgY29udGludWU7XG4gICAgfVxuICAgIGlmIChsYXN0SW5kZXggIT09IGluZGV4KSB7XG4gICAgICBodG1sICs9IHN0ci5zbGljZShsYXN0SW5kZXgsIGluZGV4KTtcbiAgICB9XG4gICAgbGFzdEluZGV4ID0gaW5kZXggKyAxO1xuICAgIGh0bWwgKz0gZXNjYXBlZDtcbiAgfVxuICByZXR1cm4gbGFzdEluZGV4ICE9PSBpbmRleCA/IGh0bWwgKyBzdHIuc2xpY2UobGFzdEluZGV4LCBpbmRleCkgOiBodG1sO1xufVxuY29uc3QgY29tbWVudFN0cmlwUkUgPSAvXi0/Pnw8IS0tfC0tPnwtLSE+fDwhLSQvZztcbmZ1bmN0aW9uIGVzY2FwZUh0bWxDb21tZW50KHNyYykge1xuICByZXR1cm4gc3JjLnJlcGxhY2UoY29tbWVudFN0cmlwUkUsIFwiXCIpO1xufVxuY29uc3QgY3NzVmFyTmFtZUVzY2FwZVN5bWJvbHNSRSA9IC9bICFcIiMkJSYnKCkqKywuLzo7PD0+P0BbXFxcXFxcXV5ge3x9fl0vZztcbmZ1bmN0aW9uIGdldEVzY2FwZWRDc3NWYXJOYW1lKGtleSwgZG91YmxlRXNjYXBlKSB7XG4gIHJldHVybiBrZXkucmVwbGFjZShcbiAgICBjc3NWYXJOYW1lRXNjYXBlU3ltYm9sc1JFLFxuICAgIChzKSA9PiBkb3VibGVFc2NhcGUgPyBzID09PSAnXCInID8gJ1xcXFxcXFxcXFxcXFwiJyA6IGBcXFxcXFxcXCR7c31gIDogYFxcXFwke3N9YFxuICApO1xufVxuXG5mdW5jdGlvbiBsb29zZUNvbXBhcmVBcnJheXMoYSwgYikge1xuICBpZiAoYS5sZW5ndGggIT09IGIubGVuZ3RoKSByZXR1cm4gZmFsc2U7XG4gIGxldCBlcXVhbCA9IHRydWU7XG4gIGZvciAobGV0IGkgPSAwOyBlcXVhbCAmJiBpIDwgYS5sZW5ndGg7IGkrKykge1xuICAgIGVxdWFsID0gbG9vc2VFcXVhbChhW2ldLCBiW2ldKTtcbiAgfVxuICByZXR1cm4gZXF1YWw7XG59XG5mdW5jdGlvbiBsb29zZUVxdWFsKGEsIGIpIHtcbiAgaWYgKGEgPT09IGIpIHJldHVybiB0cnVlO1xuICBsZXQgYVZhbGlkVHlwZSA9IGlzRGF0ZShhKTtcbiAgbGV0IGJWYWxpZFR5cGUgPSBpc0RhdGUoYik7XG4gIGlmIChhVmFsaWRUeXBlIHx8IGJWYWxpZFR5cGUpIHtcbiAgICByZXR1cm4gYVZhbGlkVHlwZSAmJiBiVmFsaWRUeXBlID8gYS5nZXRUaW1lKCkgPT09IGIuZ2V0VGltZSgpIDogZmFsc2U7XG4gIH1cbiAgYVZhbGlkVHlwZSA9IGlzU3ltYm9sKGEpO1xuICBiVmFsaWRUeXBlID0gaXNTeW1ib2woYik7XG4gIGlmIChhVmFsaWRUeXBlIHx8IGJWYWxpZFR5cGUpIHtcbiAgICByZXR1cm4gYSA9PT0gYjtcbiAgfVxuICBhVmFsaWRUeXBlID0gaXNBcnJheShhKTtcbiAgYlZhbGlkVHlwZSA9IGlzQXJyYXkoYik7XG4gIGlmIChhVmFsaWRUeXBlIHx8IGJWYWxpZFR5cGUpIHtcbiAgICByZXR1cm4gYVZhbGlkVHlwZSAmJiBiVmFsaWRUeXBlID8gbG9vc2VDb21wYXJlQXJyYXlzKGEsIGIpIDogZmFsc2U7XG4gIH1cbiAgYVZhbGlkVHlwZSA9IGlzT2JqZWN0KGEpO1xuICBiVmFsaWRUeXBlID0gaXNPYmplY3QoYik7XG4gIGlmIChhVmFsaWRUeXBlIHx8IGJWYWxpZFR5cGUpIHtcbiAgICBpZiAoIWFWYWxpZFR5cGUgfHwgIWJWYWxpZFR5cGUpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgY29uc3QgYUtleXNDb3VudCA9IE9iamVjdC5rZXlzKGEpLmxlbmd0aDtcbiAgICBjb25zdCBiS2V5c0NvdW50ID0gT2JqZWN0LmtleXMoYikubGVuZ3RoO1xuICAgIGlmIChhS2V5c0NvdW50ICE9PSBiS2V5c0NvdW50KSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIGZvciAoY29uc3Qga2V5IGluIGEpIHtcbiAgICAgIGNvbnN0IGFIYXNLZXkgPSBhLmhhc093blByb3BlcnR5KGtleSk7XG4gICAgICBjb25zdCBiSGFzS2V5ID0gYi5oYXNPd25Qcm9wZXJ0eShrZXkpO1xuICAgICAgaWYgKGFIYXNLZXkgJiYgIWJIYXNLZXkgfHwgIWFIYXNLZXkgJiYgYkhhc0tleSB8fCAhbG9vc2VFcXVhbChhW2tleV0sIGJba2V5XSkpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuICAgIH1cbiAgfVxuICByZXR1cm4gU3RyaW5nKGEpID09PSBTdHJpbmcoYik7XG59XG5mdW5jdGlvbiBsb29zZUluZGV4T2YoYXJyLCB2YWwpIHtcbiAgcmV0dXJuIGFyci5maW5kSW5kZXgoKGl0ZW0pID0+IGxvb3NlRXF1YWwoaXRlbSwgdmFsKSk7XG59XG5cbmNvbnN0IGlzUmVmID0gKHZhbCkgPT4ge1xuICByZXR1cm4gISEodmFsICYmIHZhbFtcIl9fdl9pc1JlZlwiXSA9PT0gdHJ1ZSk7XG59O1xuY29uc3QgdG9EaXNwbGF5U3RyaW5nID0gKHZhbCkgPT4ge1xuICByZXR1cm4gaXNTdHJpbmcodmFsKSA/IHZhbCA6IHZhbCA9PSBudWxsID8gXCJcIiA6IGlzQXJyYXkodmFsKSB8fCBpc09iamVjdCh2YWwpICYmICh2YWwudG9TdHJpbmcgPT09IG9iamVjdFRvU3RyaW5nIHx8ICFpc0Z1bmN0aW9uKHZhbC50b1N0cmluZykpID8gaXNSZWYodmFsKSA/IHRvRGlzcGxheVN0cmluZyh2YWwudmFsdWUpIDogSlNPTi5zdHJpbmdpZnkodmFsLCByZXBsYWNlciwgMikgOiBTdHJpbmcodmFsKTtcbn07XG5jb25zdCByZXBsYWNlciA9IChfa2V5LCB2YWwpID0+IHtcbiAgaWYgKGlzUmVmKHZhbCkpIHtcbiAgICByZXR1cm4gcmVwbGFjZXIoX2tleSwgdmFsLnZhbHVlKTtcbiAgfSBlbHNlIGlmIChpc01hcCh2YWwpKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIFtgTWFwKCR7dmFsLnNpemV9KWBdOiBbLi4udmFsLmVudHJpZXMoKV0ucmVkdWNlKFxuICAgICAgICAoZW50cmllcywgW2tleSwgdmFsMl0sIGkpID0+IHtcbiAgICAgICAgICBlbnRyaWVzW3N0cmluZ2lmeVN5bWJvbChrZXksIGkpICsgXCIgPT5cIl0gPSB2YWwyO1xuICAgICAgICAgIHJldHVybiBlbnRyaWVzO1xuICAgICAgICB9LFxuICAgICAgICB7fVxuICAgICAgKVxuICAgIH07XG4gIH0gZWxzZSBpZiAoaXNTZXQodmFsKSkge1xuICAgIHJldHVybiB7XG4gICAgICBbYFNldCgke3ZhbC5zaXplfSlgXTogWy4uLnZhbC52YWx1ZXMoKV0ubWFwKCh2KSA9PiBzdHJpbmdpZnlTeW1ib2wodikpXG4gICAgfTtcbiAgfSBlbHNlIGlmIChpc1N5bWJvbCh2YWwpKSB7XG4gICAgcmV0dXJuIHN0cmluZ2lmeVN5bWJvbCh2YWwpO1xuICB9IGVsc2UgaWYgKGlzT2JqZWN0KHZhbCkgJiYgIWlzQXJyYXkodmFsKSAmJiAhaXNQbGFpbk9iamVjdCh2YWwpKSB7XG4gICAgcmV0dXJuIFN0cmluZyh2YWwpO1xuICB9XG4gIHJldHVybiB2YWw7XG59O1xuY29uc3Qgc3RyaW5naWZ5U3ltYm9sID0gKHYsIGkgPSBcIlwiKSA9PiB7XG4gIHZhciBfYTtcbiAgcmV0dXJuIChcbiAgICAvLyBTeW1ib2wuZGVzY3JpcHRpb24gaW4gZXMyMDE5KyBzbyB3ZSBuZWVkIHRvIGNhc3QgaGVyZSB0byBwYXNzXG4gICAgLy8gdGhlIGxpYjogZXMyMDE2IGNoZWNrXG4gICAgaXNTeW1ib2wodikgPyBgU3ltYm9sKCR7KF9hID0gdi5kZXNjcmlwdGlvbikgIT0gbnVsbCA/IF9hIDogaX0pYCA6IHZcbiAgKTtcbn07XG5cbmZ1bmN0aW9uIG5vcm1hbGl6ZUNzc1ZhclZhbHVlKHZhbHVlKSB7XG4gIGlmICh2YWx1ZSA9PSBudWxsKSB7XG4gICAgcmV0dXJuIFwiaW5pdGlhbFwiO1xuICB9XG4gIGlmICh0eXBlb2YgdmFsdWUgPT09IFwic3RyaW5nXCIpIHtcbiAgICByZXR1cm4gdmFsdWUgPT09IFwiXCIgPyBcIiBcIiA6IHZhbHVlO1xuICB9XG4gIGlmICh0eXBlb2YgdmFsdWUgIT09IFwibnVtYmVyXCIgfHwgIU51bWJlci5pc0Zpbml0ZSh2YWx1ZSkpIHtcbiAgICBpZiAoISEocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09IFwicHJvZHVjdGlvblwiKSkge1xuICAgICAgY29uc29sZS53YXJuKFxuICAgICAgICBcIltWdWUgd2Fybl0gSW52YWxpZCB2YWx1ZSB1c2VkIGZvciBDU1MgYmluZGluZy4gRXhwZWN0ZWQgYSBzdHJpbmcgb3IgYSBmaW5pdGUgbnVtYmVyIGJ1dCByZWNlaXZlZDpcIixcbiAgICAgICAgdmFsdWVcbiAgICAgICk7XG4gICAgfVxuICB9XG4gIHJldHVybiBTdHJpbmcodmFsdWUpO1xufVxuXG5leHBvcnQgeyBFTVBUWV9BUlIsIEVNUFRZX09CSiwgTk8sIE5PT1AsIFBhdGNoRmxhZ05hbWVzLCBQYXRjaEZsYWdzLCBTaGFwZUZsYWdzLCBTbG90RmxhZ3MsIGNhbWVsaXplLCBjYXBpdGFsaXplLCBjc3NWYXJOYW1lRXNjYXBlU3ltYm9sc1JFLCBkZWYsIGVzY2FwZUh0bWwsIGVzY2FwZUh0bWxDb21tZW50LCBleHRlbmQsIGdlbkNhY2hlS2V5LCBnZW5Qcm9wc0FjY2Vzc0V4cCwgZ2VuZXJhdGVDb2RlRnJhbWUsIGdldEVzY2FwZWRDc3NWYXJOYW1lLCBnZXRHbG9iYWxUaGlzLCBoYXNDaGFuZ2VkLCBoYXNPd24sIGh5cGhlbmF0ZSwgaW5jbHVkZUJvb2xlYW5BdHRyLCBpbnZva2VBcnJheUZucywgaXNBcnJheSwgaXNCb29sZWFuQXR0ciwgaXNCdWlsdEluRGlyZWN0aXZlLCBpc0RhdGUsIGlzRnVuY3Rpb24sIGlzR2xvYmFsbHlBbGxvd2VkLCBpc0dsb2JhbGx5V2hpdGVsaXN0ZWQsIGlzSFRNTFRhZywgaXNJbnRlZ2VyS2V5LCBpc0tub3duSHRtbEF0dHIsIGlzS25vd25NYXRoTUxBdHRyLCBpc0tub3duU3ZnQXR0ciwgaXNNYXAsIGlzTWF0aE1MVGFnLCBpc01vZGVsTGlzdGVuZXIsIGlzT2JqZWN0LCBpc09uLCBpc1BsYWluT2JqZWN0LCBpc1Byb21pc2UsIGlzUmVnRXhwLCBpc1JlbmRlcmFibGVBdHRyVmFsdWUsIGlzUmVzZXJ2ZWRQcm9wLCBpc1NTUlNhZmVBdHRyTmFtZSwgaXNTVkdUYWcsIGlzU2V0LCBpc1NwZWNpYWxCb29sZWFuQXR0ciwgaXNTdHJpbmcsIGlzU3ltYm9sLCBpc1ZvaWRUYWcsIGxvb3NlRXF1YWwsIGxvb3NlSW5kZXhPZiwgbG9vc2VUb051bWJlciwgbWFrZU1hcCwgbm9ybWFsaXplQ2xhc3MsIG5vcm1hbGl6ZUNzc1ZhclZhbHVlLCBub3JtYWxpemVQcm9wcywgbm9ybWFsaXplU3R5bGUsIG9iamVjdFRvU3RyaW5nLCBwYXJzZVN0cmluZ1N0eWxlLCBwcm9wc1RvQXR0ck1hcCwgcmVtb3ZlLCBzbG90RmxhZ3NUZXh0LCBzdHJpbmdpZnlTdHlsZSwgdG9EaXNwbGF5U3RyaW5nLCB0b0hhbmRsZXJLZXksIHRvTnVtYmVyLCB0b1Jhd1R5cGUsIHRvVHlwZVN0cmluZyB9O1xuIiwiLyoqXG4qIEB2dWUvcmVhY3Rpdml0eSB2My41LjI4XG4qIChjKSAyMDE4LXByZXNlbnQgWXV4aSAoRXZhbikgWW91IGFuZCBWdWUgY29udHJpYnV0b3JzXG4qIEBsaWNlbnNlIE1JVFxuKiovXG5pbXBvcnQgeyBleHRlbmQsIGhhc0NoYW5nZWQsIGlzQXJyYXksIGlzSW50ZWdlcktleSwgaXNTeW1ib2wsIGlzTWFwLCBoYXNPd24sIGlzT2JqZWN0LCBtYWtlTWFwLCBjYXBpdGFsaXplLCB0b1Jhd1R5cGUsIGRlZiwgaXNGdW5jdGlvbiwgRU1QVFlfT0JKLCBpc1NldCwgaXNQbGFpbk9iamVjdCwgcmVtb3ZlLCBOT09QIH0gZnJvbSAnQHZ1ZS9zaGFyZWQnO1xuXG5mdW5jdGlvbiB3YXJuKG1zZywgLi4uYXJncykge1xuICBjb25zb2xlLndhcm4oYFtWdWUgd2Fybl0gJHttc2d9YCwgLi4uYXJncyk7XG59XG5cbmxldCBhY3RpdmVFZmZlY3RTY29wZTtcbmNsYXNzIEVmZmVjdFNjb3BlIHtcbiAgLy8gVE9ETyBpc29sYXRlZERlY2xhcmF0aW9ucyBcIl9fdl9za2lwXCJcbiAgY29uc3RydWN0b3IoZGV0YWNoZWQgPSBmYWxzZSkge1xuICAgIHRoaXMuZGV0YWNoZWQgPSBkZXRhY2hlZDtcbiAgICAvKipcbiAgICAgKiBAaW50ZXJuYWxcbiAgICAgKi9cbiAgICB0aGlzLl9hY3RpdmUgPSB0cnVlO1xuICAgIC8qKlxuICAgICAqIEBpbnRlcm5hbCB0cmFjayBgb25gIGNhbGxzLCBhbGxvdyBgb25gIGNhbGwgbXVsdGlwbGUgdGltZXNcbiAgICAgKi9cbiAgICB0aGlzLl9vbiA9IDA7XG4gICAgLyoqXG4gICAgICogQGludGVybmFsXG4gICAgICovXG4gICAgdGhpcy5lZmZlY3RzID0gW107XG4gICAgLyoqXG4gICAgICogQGludGVybmFsXG4gICAgICovXG4gICAgdGhpcy5jbGVhbnVwcyA9IFtdO1xuICAgIHRoaXMuX2lzUGF1c2VkID0gZmFsc2U7XG4gICAgdGhpcy5fX3Zfc2tpcCA9IHRydWU7XG4gICAgdGhpcy5wYXJlbnQgPSBhY3RpdmVFZmZlY3RTY29wZTtcbiAgICBpZiAoIWRldGFjaGVkICYmIGFjdGl2ZUVmZmVjdFNjb3BlKSB7XG4gICAgICB0aGlzLmluZGV4ID0gKGFjdGl2ZUVmZmVjdFNjb3BlLnNjb3BlcyB8fCAoYWN0aXZlRWZmZWN0U2NvcGUuc2NvcGVzID0gW10pKS5wdXNoKFxuICAgICAgICB0aGlzXG4gICAgICApIC0gMTtcbiAgICB9XG4gIH1cbiAgZ2V0IGFjdGl2ZSgpIHtcbiAgICByZXR1cm4gdGhpcy5fYWN0aXZlO1xuICB9XG4gIHBhdXNlKCkge1xuICAgIGlmICh0aGlzLl9hY3RpdmUpIHtcbiAgICAgIHRoaXMuX2lzUGF1c2VkID0gdHJ1ZTtcbiAgICAgIGxldCBpLCBsO1xuICAgICAgaWYgKHRoaXMuc2NvcGVzKSB7XG4gICAgICAgIGZvciAoaSA9IDAsIGwgPSB0aGlzLnNjb3Blcy5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICAgICAgICB0aGlzLnNjb3Blc1tpXS5wYXVzZSgpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBmb3IgKGkgPSAwLCBsID0gdGhpcy5lZmZlY3RzLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgICAgICB0aGlzLmVmZmVjdHNbaV0ucGF1c2UoKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgLyoqXG4gICAqIFJlc3VtZXMgdGhlIGVmZmVjdCBzY29wZSwgaW5jbHVkaW5nIGFsbCBjaGlsZCBzY29wZXMgYW5kIGVmZmVjdHMuXG4gICAqL1xuICByZXN1bWUoKSB7XG4gICAgaWYgKHRoaXMuX2FjdGl2ZSkge1xuICAgICAgaWYgKHRoaXMuX2lzUGF1c2VkKSB7XG4gICAgICAgIHRoaXMuX2lzUGF1c2VkID0gZmFsc2U7XG4gICAgICAgIGxldCBpLCBsO1xuICAgICAgICBpZiAodGhpcy5zY29wZXMpIHtcbiAgICAgICAgICBmb3IgKGkgPSAwLCBsID0gdGhpcy5zY29wZXMubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgICAgICAgICB0aGlzLnNjb3Blc1tpXS5yZXN1bWUoKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZm9yIChpID0gMCwgbCA9IHRoaXMuZWZmZWN0cy5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICAgICAgICB0aGlzLmVmZmVjdHNbaV0ucmVzdW1lKCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgcnVuKGZuKSB7XG4gICAgaWYgKHRoaXMuX2FjdGl2ZSkge1xuICAgICAgY29uc3QgY3VycmVudEVmZmVjdFNjb3BlID0gYWN0aXZlRWZmZWN0U2NvcGU7XG4gICAgICB0cnkge1xuICAgICAgICBhY3RpdmVFZmZlY3RTY29wZSA9IHRoaXM7XG4gICAgICAgIHJldHVybiBmbigpO1xuICAgICAgfSBmaW5hbGx5IHtcbiAgICAgICAgYWN0aXZlRWZmZWN0U2NvcGUgPSBjdXJyZW50RWZmZWN0U2NvcGU7XG4gICAgICB9XG4gICAgfSBlbHNlIGlmICghIShwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gXCJwcm9kdWN0aW9uXCIpKSB7XG4gICAgICB3YXJuKGBjYW5ub3QgcnVuIGFuIGluYWN0aXZlIGVmZmVjdCBzY29wZS5gKTtcbiAgICB9XG4gIH1cbiAgLyoqXG4gICAqIFRoaXMgc2hvdWxkIG9ubHkgYmUgY2FsbGVkIG9uIG5vbi1kZXRhY2hlZCBzY29wZXNcbiAgICogQGludGVybmFsXG4gICAqL1xuICBvbigpIHtcbiAgICBpZiAoKyt0aGlzLl9vbiA9PT0gMSkge1xuICAgICAgdGhpcy5wcmV2U2NvcGUgPSBhY3RpdmVFZmZlY3RTY29wZTtcbiAgICAgIGFjdGl2ZUVmZmVjdFNjb3BlID0gdGhpcztcbiAgICB9XG4gIH1cbiAgLyoqXG4gICAqIFRoaXMgc2hvdWxkIG9ubHkgYmUgY2FsbGVkIG9uIG5vbi1kZXRhY2hlZCBzY29wZXNcbiAgICogQGludGVybmFsXG4gICAqL1xuICBvZmYoKSB7XG4gICAgaWYgKHRoaXMuX29uID4gMCAmJiAtLXRoaXMuX29uID09PSAwKSB7XG4gICAgICBhY3RpdmVFZmZlY3RTY29wZSA9IHRoaXMucHJldlNjb3BlO1xuICAgICAgdGhpcy5wcmV2U2NvcGUgPSB2b2lkIDA7XG4gICAgfVxuICB9XG4gIHN0b3AoZnJvbVBhcmVudCkge1xuICAgIGlmICh0aGlzLl9hY3RpdmUpIHtcbiAgICAgIHRoaXMuX2FjdGl2ZSA9IGZhbHNlO1xuICAgICAgbGV0IGksIGw7XG4gICAgICBmb3IgKGkgPSAwLCBsID0gdGhpcy5lZmZlY3RzLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgICAgICB0aGlzLmVmZmVjdHNbaV0uc3RvcCgpO1xuICAgICAgfVxuICAgICAgdGhpcy5lZmZlY3RzLmxlbmd0aCA9IDA7XG4gICAgICBmb3IgKGkgPSAwLCBsID0gdGhpcy5jbGVhbnVwcy5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICAgICAgdGhpcy5jbGVhbnVwc1tpXSgpO1xuICAgICAgfVxuICAgICAgdGhpcy5jbGVhbnVwcy5sZW5ndGggPSAwO1xuICAgICAgaWYgKHRoaXMuc2NvcGVzKSB7XG4gICAgICAgIGZvciAoaSA9IDAsIGwgPSB0aGlzLnNjb3Blcy5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICAgICAgICB0aGlzLnNjb3Blc1tpXS5zdG9wKHRydWUpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuc2NvcGVzLmxlbmd0aCA9IDA7XG4gICAgICB9XG4gICAgICBpZiAoIXRoaXMuZGV0YWNoZWQgJiYgdGhpcy5wYXJlbnQgJiYgIWZyb21QYXJlbnQpIHtcbiAgICAgICAgY29uc3QgbGFzdCA9IHRoaXMucGFyZW50LnNjb3Blcy5wb3AoKTtcbiAgICAgICAgaWYgKGxhc3QgJiYgbGFzdCAhPT0gdGhpcykge1xuICAgICAgICAgIHRoaXMucGFyZW50LnNjb3Blc1t0aGlzLmluZGV4XSA9IGxhc3Q7XG4gICAgICAgICAgbGFzdC5pbmRleCA9IHRoaXMuaW5kZXg7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHRoaXMucGFyZW50ID0gdm9pZCAwO1xuICAgIH1cbiAgfVxufVxuZnVuY3Rpb24gZWZmZWN0U2NvcGUoZGV0YWNoZWQpIHtcbiAgcmV0dXJuIG5ldyBFZmZlY3RTY29wZShkZXRhY2hlZCk7XG59XG5mdW5jdGlvbiBnZXRDdXJyZW50U2NvcGUoKSB7XG4gIHJldHVybiBhY3RpdmVFZmZlY3RTY29wZTtcbn1cbmZ1bmN0aW9uIG9uU2NvcGVEaXNwb3NlKGZuLCBmYWlsU2lsZW50bHkgPSBmYWxzZSkge1xuICBpZiAoYWN0aXZlRWZmZWN0U2NvcGUpIHtcbiAgICBhY3RpdmVFZmZlY3RTY29wZS5jbGVhbnVwcy5wdXNoKGZuKTtcbiAgfSBlbHNlIGlmICghIShwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gXCJwcm9kdWN0aW9uXCIpICYmICFmYWlsU2lsZW50bHkpIHtcbiAgICB3YXJuKFxuICAgICAgYG9uU2NvcGVEaXNwb3NlKCkgaXMgY2FsbGVkIHdoZW4gdGhlcmUgaXMgbm8gYWN0aXZlIGVmZmVjdCBzY29wZSB0byBiZSBhc3NvY2lhdGVkIHdpdGguYFxuICAgICk7XG4gIH1cbn1cblxubGV0IGFjdGl2ZVN1YjtcbmNvbnN0IEVmZmVjdEZsYWdzID0ge1xuICBcIkFDVElWRVwiOiAxLFxuICBcIjFcIjogXCJBQ1RJVkVcIixcbiAgXCJSVU5OSU5HXCI6IDIsXG4gIFwiMlwiOiBcIlJVTk5JTkdcIixcbiAgXCJUUkFDS0lOR1wiOiA0LFxuICBcIjRcIjogXCJUUkFDS0lOR1wiLFxuICBcIk5PVElGSUVEXCI6IDgsXG4gIFwiOFwiOiBcIk5PVElGSUVEXCIsXG4gIFwiRElSVFlcIjogMTYsXG4gIFwiMTZcIjogXCJESVJUWVwiLFxuICBcIkFMTE9XX1JFQ1VSU0VcIjogMzIsXG4gIFwiMzJcIjogXCJBTExPV19SRUNVUlNFXCIsXG4gIFwiUEFVU0VEXCI6IDY0LFxuICBcIjY0XCI6IFwiUEFVU0VEXCIsXG4gIFwiRVZBTFVBVEVEXCI6IDEyOCxcbiAgXCIxMjhcIjogXCJFVkFMVUFURURcIlxufTtcbmNvbnN0IHBhdXNlZFF1ZXVlRWZmZWN0cyA9IC8qIEBfX1BVUkVfXyAqLyBuZXcgV2Vha1NldCgpO1xuY2xhc3MgUmVhY3RpdmVFZmZlY3Qge1xuICBjb25zdHJ1Y3Rvcihmbikge1xuICAgIHRoaXMuZm4gPSBmbjtcbiAgICAvKipcbiAgICAgKiBAaW50ZXJuYWxcbiAgICAgKi9cbiAgICB0aGlzLmRlcHMgPSB2b2lkIDA7XG4gICAgLyoqXG4gICAgICogQGludGVybmFsXG4gICAgICovXG4gICAgdGhpcy5kZXBzVGFpbCA9IHZvaWQgMDtcbiAgICAvKipcbiAgICAgKiBAaW50ZXJuYWxcbiAgICAgKi9cbiAgICB0aGlzLmZsYWdzID0gMSB8IDQ7XG4gICAgLyoqXG4gICAgICogQGludGVybmFsXG4gICAgICovXG4gICAgdGhpcy5uZXh0ID0gdm9pZCAwO1xuICAgIC8qKlxuICAgICAqIEBpbnRlcm5hbFxuICAgICAqL1xuICAgIHRoaXMuY2xlYW51cCA9IHZvaWQgMDtcbiAgICB0aGlzLnNjaGVkdWxlciA9IHZvaWQgMDtcbiAgICBpZiAoYWN0aXZlRWZmZWN0U2NvcGUgJiYgYWN0aXZlRWZmZWN0U2NvcGUuYWN0aXZlKSB7XG4gICAgICBhY3RpdmVFZmZlY3RTY29wZS5lZmZlY3RzLnB1c2godGhpcyk7XG4gICAgfVxuICB9XG4gIHBhdXNlKCkge1xuICAgIHRoaXMuZmxhZ3MgfD0gNjQ7XG4gIH1cbiAgcmVzdW1lKCkge1xuICAgIGlmICh0aGlzLmZsYWdzICYgNjQpIHtcbiAgICAgIHRoaXMuZmxhZ3MgJj0gLTY1O1xuICAgICAgaWYgKHBhdXNlZFF1ZXVlRWZmZWN0cy5oYXModGhpcykpIHtcbiAgICAgICAgcGF1c2VkUXVldWVFZmZlY3RzLmRlbGV0ZSh0aGlzKTtcbiAgICAgICAgdGhpcy50cmlnZ2VyKCk7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIC8qKlxuICAgKiBAaW50ZXJuYWxcbiAgICovXG4gIG5vdGlmeSgpIHtcbiAgICBpZiAodGhpcy5mbGFncyAmIDIgJiYgISh0aGlzLmZsYWdzICYgMzIpKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGlmICghKHRoaXMuZmxhZ3MgJiA4KSkge1xuICAgICAgYmF0Y2godGhpcyk7XG4gICAgfVxuICB9XG4gIHJ1bigpIHtcbiAgICBpZiAoISh0aGlzLmZsYWdzICYgMSkpIHtcbiAgICAgIHJldHVybiB0aGlzLmZuKCk7XG4gICAgfVxuICAgIHRoaXMuZmxhZ3MgfD0gMjtcbiAgICBjbGVhbnVwRWZmZWN0KHRoaXMpO1xuICAgIHByZXBhcmVEZXBzKHRoaXMpO1xuICAgIGNvbnN0IHByZXZFZmZlY3QgPSBhY3RpdmVTdWI7XG4gICAgY29uc3QgcHJldlNob3VsZFRyYWNrID0gc2hvdWxkVHJhY2s7XG4gICAgYWN0aXZlU3ViID0gdGhpcztcbiAgICBzaG91bGRUcmFjayA9IHRydWU7XG4gICAgdHJ5IHtcbiAgICAgIHJldHVybiB0aGlzLmZuKCk7XG4gICAgfSBmaW5hbGx5IHtcbiAgICAgIGlmICghIShwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gXCJwcm9kdWN0aW9uXCIpICYmIGFjdGl2ZVN1YiAhPT0gdGhpcykge1xuICAgICAgICB3YXJuKFxuICAgICAgICAgIFwiQWN0aXZlIGVmZmVjdCB3YXMgbm90IHJlc3RvcmVkIGNvcnJlY3RseSAtIHRoaXMgaXMgbGlrZWx5IGEgVnVlIGludGVybmFsIGJ1Zy5cIlxuICAgICAgICApO1xuICAgICAgfVxuICAgICAgY2xlYW51cERlcHModGhpcyk7XG4gICAgICBhY3RpdmVTdWIgPSBwcmV2RWZmZWN0O1xuICAgICAgc2hvdWxkVHJhY2sgPSBwcmV2U2hvdWxkVHJhY2s7XG4gICAgICB0aGlzLmZsYWdzICY9IC0zO1xuICAgIH1cbiAgfVxuICBzdG9wKCkge1xuICAgIGlmICh0aGlzLmZsYWdzICYgMSkge1xuICAgICAgZm9yIChsZXQgbGluayA9IHRoaXMuZGVwczsgbGluazsgbGluayA9IGxpbmsubmV4dERlcCkge1xuICAgICAgICByZW1vdmVTdWIobGluayk7XG4gICAgICB9XG4gICAgICB0aGlzLmRlcHMgPSB0aGlzLmRlcHNUYWlsID0gdm9pZCAwO1xuICAgICAgY2xlYW51cEVmZmVjdCh0aGlzKTtcbiAgICAgIHRoaXMub25TdG9wICYmIHRoaXMub25TdG9wKCk7XG4gICAgICB0aGlzLmZsYWdzICY9IC0yO1xuICAgIH1cbiAgfVxuICB0cmlnZ2VyKCkge1xuICAgIGlmICh0aGlzLmZsYWdzICYgNjQpIHtcbiAgICAgIHBhdXNlZFF1ZXVlRWZmZWN0cy5hZGQodGhpcyk7XG4gICAgfSBlbHNlIGlmICh0aGlzLnNjaGVkdWxlcikge1xuICAgICAgdGhpcy5zY2hlZHVsZXIoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5ydW5JZkRpcnR5KCk7XG4gICAgfVxuICB9XG4gIC8qKlxuICAgKiBAaW50ZXJuYWxcbiAgICovXG4gIHJ1bklmRGlydHkoKSB7XG4gICAgaWYgKGlzRGlydHkodGhpcykpIHtcbiAgICAgIHRoaXMucnVuKCk7XG4gICAgfVxuICB9XG4gIGdldCBkaXJ0eSgpIHtcbiAgICByZXR1cm4gaXNEaXJ0eSh0aGlzKTtcbiAgfVxufVxubGV0IGJhdGNoRGVwdGggPSAwO1xubGV0IGJhdGNoZWRTdWI7XG5sZXQgYmF0Y2hlZENvbXB1dGVkO1xuZnVuY3Rpb24gYmF0Y2goc3ViLCBpc0NvbXB1dGVkID0gZmFsc2UpIHtcbiAgc3ViLmZsYWdzIHw9IDg7XG4gIGlmIChpc0NvbXB1dGVkKSB7XG4gICAgc3ViLm5leHQgPSBiYXRjaGVkQ29tcHV0ZWQ7XG4gICAgYmF0Y2hlZENvbXB1dGVkID0gc3ViO1xuICAgIHJldHVybjtcbiAgfVxuICBzdWIubmV4dCA9IGJhdGNoZWRTdWI7XG4gIGJhdGNoZWRTdWIgPSBzdWI7XG59XG5mdW5jdGlvbiBzdGFydEJhdGNoKCkge1xuICBiYXRjaERlcHRoKys7XG59XG5mdW5jdGlvbiBlbmRCYXRjaCgpIHtcbiAgaWYgKC0tYmF0Y2hEZXB0aCA+IDApIHtcbiAgICByZXR1cm47XG4gIH1cbiAgaWYgKGJhdGNoZWRDb21wdXRlZCkge1xuICAgIGxldCBlID0gYmF0Y2hlZENvbXB1dGVkO1xuICAgIGJhdGNoZWRDb21wdXRlZCA9IHZvaWQgMDtcbiAgICB3aGlsZSAoZSkge1xuICAgICAgY29uc3QgbmV4dCA9IGUubmV4dDtcbiAgICAgIGUubmV4dCA9IHZvaWQgMDtcbiAgICAgIGUuZmxhZ3MgJj0gLTk7XG4gICAgICBlID0gbmV4dDtcbiAgICB9XG4gIH1cbiAgbGV0IGVycm9yO1xuICB3aGlsZSAoYmF0Y2hlZFN1Yikge1xuICAgIGxldCBlID0gYmF0Y2hlZFN1YjtcbiAgICBiYXRjaGVkU3ViID0gdm9pZCAwO1xuICAgIHdoaWxlIChlKSB7XG4gICAgICBjb25zdCBuZXh0ID0gZS5uZXh0O1xuICAgICAgZS5uZXh0ID0gdm9pZCAwO1xuICAgICAgZS5mbGFncyAmPSAtOTtcbiAgICAgIGlmIChlLmZsYWdzICYgMSkge1xuICAgICAgICB0cnkge1xuICAgICAgICAgIDtcbiAgICAgICAgICBlLnRyaWdnZXIoKTtcbiAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgaWYgKCFlcnJvcikgZXJyb3IgPSBlcnI7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGUgPSBuZXh0O1xuICAgIH1cbiAgfVxuICBpZiAoZXJyb3IpIHRocm93IGVycm9yO1xufVxuZnVuY3Rpb24gcHJlcGFyZURlcHMoc3ViKSB7XG4gIGZvciAobGV0IGxpbmsgPSBzdWIuZGVwczsgbGluazsgbGluayA9IGxpbmsubmV4dERlcCkge1xuICAgIGxpbmsudmVyc2lvbiA9IC0xO1xuICAgIGxpbmsucHJldkFjdGl2ZUxpbmsgPSBsaW5rLmRlcC5hY3RpdmVMaW5rO1xuICAgIGxpbmsuZGVwLmFjdGl2ZUxpbmsgPSBsaW5rO1xuICB9XG59XG5mdW5jdGlvbiBjbGVhbnVwRGVwcyhzdWIpIHtcbiAgbGV0IGhlYWQ7XG4gIGxldCB0YWlsID0gc3ViLmRlcHNUYWlsO1xuICBsZXQgbGluayA9IHRhaWw7XG4gIHdoaWxlIChsaW5rKSB7XG4gICAgY29uc3QgcHJldiA9IGxpbmsucHJldkRlcDtcbiAgICBpZiAobGluay52ZXJzaW9uID09PSAtMSkge1xuICAgICAgaWYgKGxpbmsgPT09IHRhaWwpIHRhaWwgPSBwcmV2O1xuICAgICAgcmVtb3ZlU3ViKGxpbmspO1xuICAgICAgcmVtb3ZlRGVwKGxpbmspO1xuICAgIH0gZWxzZSB7XG4gICAgICBoZWFkID0gbGluaztcbiAgICB9XG4gICAgbGluay5kZXAuYWN0aXZlTGluayA9IGxpbmsucHJldkFjdGl2ZUxpbms7XG4gICAgbGluay5wcmV2QWN0aXZlTGluayA9IHZvaWQgMDtcbiAgICBsaW5rID0gcHJldjtcbiAgfVxuICBzdWIuZGVwcyA9IGhlYWQ7XG4gIHN1Yi5kZXBzVGFpbCA9IHRhaWw7XG59XG5mdW5jdGlvbiBpc0RpcnR5KHN1Yikge1xuICBmb3IgKGxldCBsaW5rID0gc3ViLmRlcHM7IGxpbms7IGxpbmsgPSBsaW5rLm5leHREZXApIHtcbiAgICBpZiAobGluay5kZXAudmVyc2lvbiAhPT0gbGluay52ZXJzaW9uIHx8IGxpbmsuZGVwLmNvbXB1dGVkICYmIChyZWZyZXNoQ29tcHV0ZWQobGluay5kZXAuY29tcHV0ZWQpIHx8IGxpbmsuZGVwLnZlcnNpb24gIT09IGxpbmsudmVyc2lvbikpIHtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgfVxuICBpZiAoc3ViLl9kaXJ0eSkge1xuICAgIHJldHVybiB0cnVlO1xuICB9XG4gIHJldHVybiBmYWxzZTtcbn1cbmZ1bmN0aW9uIHJlZnJlc2hDb21wdXRlZChjb21wdXRlZCkge1xuICBpZiAoY29tcHV0ZWQuZmxhZ3MgJiA0ICYmICEoY29tcHV0ZWQuZmxhZ3MgJiAxNikpIHtcbiAgICByZXR1cm47XG4gIH1cbiAgY29tcHV0ZWQuZmxhZ3MgJj0gLTE3O1xuICBpZiAoY29tcHV0ZWQuZ2xvYmFsVmVyc2lvbiA9PT0gZ2xvYmFsVmVyc2lvbikge1xuICAgIHJldHVybjtcbiAgfVxuICBjb21wdXRlZC5nbG9iYWxWZXJzaW9uID0gZ2xvYmFsVmVyc2lvbjtcbiAgaWYgKCFjb21wdXRlZC5pc1NTUiAmJiBjb21wdXRlZC5mbGFncyAmIDEyOCAmJiAoIWNvbXB1dGVkLmRlcHMgJiYgIWNvbXB1dGVkLl9kaXJ0eSB8fCAhaXNEaXJ0eShjb21wdXRlZCkpKSB7XG4gICAgcmV0dXJuO1xuICB9XG4gIGNvbXB1dGVkLmZsYWdzIHw9IDI7XG4gIGNvbnN0IGRlcCA9IGNvbXB1dGVkLmRlcDtcbiAgY29uc3QgcHJldlN1YiA9IGFjdGl2ZVN1YjtcbiAgY29uc3QgcHJldlNob3VsZFRyYWNrID0gc2hvdWxkVHJhY2s7XG4gIGFjdGl2ZVN1YiA9IGNvbXB1dGVkO1xuICBzaG91bGRUcmFjayA9IHRydWU7XG4gIHRyeSB7XG4gICAgcHJlcGFyZURlcHMoY29tcHV0ZWQpO1xuICAgIGNvbnN0IHZhbHVlID0gY29tcHV0ZWQuZm4oY29tcHV0ZWQuX3ZhbHVlKTtcbiAgICBpZiAoZGVwLnZlcnNpb24gPT09IDAgfHwgaGFzQ2hhbmdlZCh2YWx1ZSwgY29tcHV0ZWQuX3ZhbHVlKSkge1xuICAgICAgY29tcHV0ZWQuZmxhZ3MgfD0gMTI4O1xuICAgICAgY29tcHV0ZWQuX3ZhbHVlID0gdmFsdWU7XG4gICAgICBkZXAudmVyc2lvbisrO1xuICAgIH1cbiAgfSBjYXRjaCAoZXJyKSB7XG4gICAgZGVwLnZlcnNpb24rKztcbiAgICB0aHJvdyBlcnI7XG4gIH0gZmluYWxseSB7XG4gICAgYWN0aXZlU3ViID0gcHJldlN1YjtcbiAgICBzaG91bGRUcmFjayA9IHByZXZTaG91bGRUcmFjaztcbiAgICBjbGVhbnVwRGVwcyhjb21wdXRlZCk7XG4gICAgY29tcHV0ZWQuZmxhZ3MgJj0gLTM7XG4gIH1cbn1cbmZ1bmN0aW9uIHJlbW92ZVN1YihsaW5rLCBzb2Z0ID0gZmFsc2UpIHtcbiAgY29uc3QgeyBkZXAsIHByZXZTdWIsIG5leHRTdWIgfSA9IGxpbms7XG4gIGlmIChwcmV2U3ViKSB7XG4gICAgcHJldlN1Yi5uZXh0U3ViID0gbmV4dFN1YjtcbiAgICBsaW5rLnByZXZTdWIgPSB2b2lkIDA7XG4gIH1cbiAgaWYgKG5leHRTdWIpIHtcbiAgICBuZXh0U3ViLnByZXZTdWIgPSBwcmV2U3ViO1xuICAgIGxpbmsubmV4dFN1YiA9IHZvaWQgMDtcbiAgfVxuICBpZiAoISEocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09IFwicHJvZHVjdGlvblwiKSAmJiBkZXAuc3Vic0hlYWQgPT09IGxpbmspIHtcbiAgICBkZXAuc3Vic0hlYWQgPSBuZXh0U3ViO1xuICB9XG4gIGlmIChkZXAuc3VicyA9PT0gbGluaykge1xuICAgIGRlcC5zdWJzID0gcHJldlN1YjtcbiAgICBpZiAoIXByZXZTdWIgJiYgZGVwLmNvbXB1dGVkKSB7XG4gICAgICBkZXAuY29tcHV0ZWQuZmxhZ3MgJj0gLTU7XG4gICAgICBmb3IgKGxldCBsID0gZGVwLmNvbXB1dGVkLmRlcHM7IGw7IGwgPSBsLm5leHREZXApIHtcbiAgICAgICAgcmVtb3ZlU3ViKGwsIHRydWUpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuICBpZiAoIXNvZnQgJiYgIS0tZGVwLnNjICYmIGRlcC5tYXApIHtcbiAgICBkZXAubWFwLmRlbGV0ZShkZXAua2V5KTtcbiAgfVxufVxuZnVuY3Rpb24gcmVtb3ZlRGVwKGxpbmspIHtcbiAgY29uc3QgeyBwcmV2RGVwLCBuZXh0RGVwIH0gPSBsaW5rO1xuICBpZiAocHJldkRlcCkge1xuICAgIHByZXZEZXAubmV4dERlcCA9IG5leHREZXA7XG4gICAgbGluay5wcmV2RGVwID0gdm9pZCAwO1xuICB9XG4gIGlmIChuZXh0RGVwKSB7XG4gICAgbmV4dERlcC5wcmV2RGVwID0gcHJldkRlcDtcbiAgICBsaW5rLm5leHREZXAgPSB2b2lkIDA7XG4gIH1cbn1cbmZ1bmN0aW9uIGVmZmVjdChmbiwgb3B0aW9ucykge1xuICBpZiAoZm4uZWZmZWN0IGluc3RhbmNlb2YgUmVhY3RpdmVFZmZlY3QpIHtcbiAgICBmbiA9IGZuLmVmZmVjdC5mbjtcbiAgfVxuICBjb25zdCBlID0gbmV3IFJlYWN0aXZlRWZmZWN0KGZuKTtcbiAgaWYgKG9wdGlvbnMpIHtcbiAgICBleHRlbmQoZSwgb3B0aW9ucyk7XG4gIH1cbiAgdHJ5IHtcbiAgICBlLnJ1bigpO1xuICB9IGNhdGNoIChlcnIpIHtcbiAgICBlLnN0b3AoKTtcbiAgICB0aHJvdyBlcnI7XG4gIH1cbiAgY29uc3QgcnVubmVyID0gZS5ydW4uYmluZChlKTtcbiAgcnVubmVyLmVmZmVjdCA9IGU7XG4gIHJldHVybiBydW5uZXI7XG59XG5mdW5jdGlvbiBzdG9wKHJ1bm5lcikge1xuICBydW5uZXIuZWZmZWN0LnN0b3AoKTtcbn1cbmxldCBzaG91bGRUcmFjayA9IHRydWU7XG5jb25zdCB0cmFja1N0YWNrID0gW107XG5mdW5jdGlvbiBwYXVzZVRyYWNraW5nKCkge1xuICB0cmFja1N0YWNrLnB1c2goc2hvdWxkVHJhY2spO1xuICBzaG91bGRUcmFjayA9IGZhbHNlO1xufVxuZnVuY3Rpb24gZW5hYmxlVHJhY2tpbmcoKSB7XG4gIHRyYWNrU3RhY2sucHVzaChzaG91bGRUcmFjayk7XG4gIHNob3VsZFRyYWNrID0gdHJ1ZTtcbn1cbmZ1bmN0aW9uIHJlc2V0VHJhY2tpbmcoKSB7XG4gIGNvbnN0IGxhc3QgPSB0cmFja1N0YWNrLnBvcCgpO1xuICBzaG91bGRUcmFjayA9IGxhc3QgPT09IHZvaWQgMCA/IHRydWUgOiBsYXN0O1xufVxuZnVuY3Rpb24gb25FZmZlY3RDbGVhbnVwKGZuLCBmYWlsU2lsZW50bHkgPSBmYWxzZSkge1xuICBpZiAoYWN0aXZlU3ViIGluc3RhbmNlb2YgUmVhY3RpdmVFZmZlY3QpIHtcbiAgICBhY3RpdmVTdWIuY2xlYW51cCA9IGZuO1xuICB9IGVsc2UgaWYgKCEhKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSBcInByb2R1Y3Rpb25cIikgJiYgIWZhaWxTaWxlbnRseSkge1xuICAgIHdhcm4oXG4gICAgICBgb25FZmZlY3RDbGVhbnVwKCkgd2FzIGNhbGxlZCB3aGVuIHRoZXJlIHdhcyBubyBhY3RpdmUgZWZmZWN0IHRvIGFzc29jaWF0ZSB3aXRoLmBcbiAgICApO1xuICB9XG59XG5mdW5jdGlvbiBjbGVhbnVwRWZmZWN0KGUpIHtcbiAgY29uc3QgeyBjbGVhbnVwIH0gPSBlO1xuICBlLmNsZWFudXAgPSB2b2lkIDA7XG4gIGlmIChjbGVhbnVwKSB7XG4gICAgY29uc3QgcHJldlN1YiA9IGFjdGl2ZVN1YjtcbiAgICBhY3RpdmVTdWIgPSB2b2lkIDA7XG4gICAgdHJ5IHtcbiAgICAgIGNsZWFudXAoKTtcbiAgICB9IGZpbmFsbHkge1xuICAgICAgYWN0aXZlU3ViID0gcHJldlN1YjtcbiAgICB9XG4gIH1cbn1cblxubGV0IGdsb2JhbFZlcnNpb24gPSAwO1xuY2xhc3MgTGluayB7XG4gIGNvbnN0cnVjdG9yKHN1YiwgZGVwKSB7XG4gICAgdGhpcy5zdWIgPSBzdWI7XG4gICAgdGhpcy5kZXAgPSBkZXA7XG4gICAgdGhpcy52ZXJzaW9uID0gZGVwLnZlcnNpb247XG4gICAgdGhpcy5uZXh0RGVwID0gdGhpcy5wcmV2RGVwID0gdGhpcy5uZXh0U3ViID0gdGhpcy5wcmV2U3ViID0gdGhpcy5wcmV2QWN0aXZlTGluayA9IHZvaWQgMDtcbiAgfVxufVxuY2xhc3MgRGVwIHtcbiAgLy8gVE9ETyBpc29sYXRlZERlY2xhcmF0aW9ucyBcIl9fdl9za2lwXCJcbiAgY29uc3RydWN0b3IoY29tcHV0ZWQpIHtcbiAgICB0aGlzLmNvbXB1dGVkID0gY29tcHV0ZWQ7XG4gICAgdGhpcy52ZXJzaW9uID0gMDtcbiAgICAvKipcbiAgICAgKiBMaW5rIGJldHdlZW4gdGhpcyBkZXAgYW5kIHRoZSBjdXJyZW50IGFjdGl2ZSBlZmZlY3RcbiAgICAgKi9cbiAgICB0aGlzLmFjdGl2ZUxpbmsgPSB2b2lkIDA7XG4gICAgLyoqXG4gICAgICogRG91Ymx5IGxpbmtlZCBsaXN0IHJlcHJlc2VudGluZyB0aGUgc3Vic2NyaWJpbmcgZWZmZWN0cyAodGFpbClcbiAgICAgKi9cbiAgICB0aGlzLnN1YnMgPSB2b2lkIDA7XG4gICAgLyoqXG4gICAgICogRm9yIG9iamVjdCBwcm9wZXJ0eSBkZXBzIGNsZWFudXBcbiAgICAgKi9cbiAgICB0aGlzLm1hcCA9IHZvaWQgMDtcbiAgICB0aGlzLmtleSA9IHZvaWQgMDtcbiAgICAvKipcbiAgICAgKiBTdWJzY3JpYmVyIGNvdW50ZXJcbiAgICAgKi9cbiAgICB0aGlzLnNjID0gMDtcbiAgICAvKipcbiAgICAgKiBAaW50ZXJuYWxcbiAgICAgKi9cbiAgICB0aGlzLl9fdl9za2lwID0gdHJ1ZTtcbiAgICBpZiAoISEocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09IFwicHJvZHVjdGlvblwiKSkge1xuICAgICAgdGhpcy5zdWJzSGVhZCA9IHZvaWQgMDtcbiAgICB9XG4gIH1cbiAgdHJhY2soZGVidWdJbmZvKSB7XG4gICAgaWYgKCFhY3RpdmVTdWIgfHwgIXNob3VsZFRyYWNrIHx8IGFjdGl2ZVN1YiA9PT0gdGhpcy5jb21wdXRlZCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBsZXQgbGluayA9IHRoaXMuYWN0aXZlTGluaztcbiAgICBpZiAobGluayA9PT0gdm9pZCAwIHx8IGxpbmsuc3ViICE9PSBhY3RpdmVTdWIpIHtcbiAgICAgIGxpbmsgPSB0aGlzLmFjdGl2ZUxpbmsgPSBuZXcgTGluayhhY3RpdmVTdWIsIHRoaXMpO1xuICAgICAgaWYgKCFhY3RpdmVTdWIuZGVwcykge1xuICAgICAgICBhY3RpdmVTdWIuZGVwcyA9IGFjdGl2ZVN1Yi5kZXBzVGFpbCA9IGxpbms7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBsaW5rLnByZXZEZXAgPSBhY3RpdmVTdWIuZGVwc1RhaWw7XG4gICAgICAgIGFjdGl2ZVN1Yi5kZXBzVGFpbC5uZXh0RGVwID0gbGluaztcbiAgICAgICAgYWN0aXZlU3ViLmRlcHNUYWlsID0gbGluaztcbiAgICAgIH1cbiAgICAgIGFkZFN1YihsaW5rKTtcbiAgICB9IGVsc2UgaWYgKGxpbmsudmVyc2lvbiA9PT0gLTEpIHtcbiAgICAgIGxpbmsudmVyc2lvbiA9IHRoaXMudmVyc2lvbjtcbiAgICAgIGlmIChsaW5rLm5leHREZXApIHtcbiAgICAgICAgY29uc3QgbmV4dCA9IGxpbmsubmV4dERlcDtcbiAgICAgICAgbmV4dC5wcmV2RGVwID0gbGluay5wcmV2RGVwO1xuICAgICAgICBpZiAobGluay5wcmV2RGVwKSB7XG4gICAgICAgICAgbGluay5wcmV2RGVwLm5leHREZXAgPSBuZXh0O1xuICAgICAgICB9XG4gICAgICAgIGxpbmsucHJldkRlcCA9IGFjdGl2ZVN1Yi5kZXBzVGFpbDtcbiAgICAgICAgbGluay5uZXh0RGVwID0gdm9pZCAwO1xuICAgICAgICBhY3RpdmVTdWIuZGVwc1RhaWwubmV4dERlcCA9IGxpbms7XG4gICAgICAgIGFjdGl2ZVN1Yi5kZXBzVGFpbCA9IGxpbms7XG4gICAgICAgIGlmIChhY3RpdmVTdWIuZGVwcyA9PT0gbGluaykge1xuICAgICAgICAgIGFjdGl2ZVN1Yi5kZXBzID0gbmV4dDtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICBpZiAoISEocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09IFwicHJvZHVjdGlvblwiKSAmJiBhY3RpdmVTdWIub25UcmFjaykge1xuICAgICAgYWN0aXZlU3ViLm9uVHJhY2soXG4gICAgICAgIGV4dGVuZChcbiAgICAgICAgICB7XG4gICAgICAgICAgICBlZmZlY3Q6IGFjdGl2ZVN1YlxuICAgICAgICAgIH0sXG4gICAgICAgICAgZGVidWdJbmZvXG4gICAgICAgIClcbiAgICAgICk7XG4gICAgfVxuICAgIHJldHVybiBsaW5rO1xuICB9XG4gIHRyaWdnZXIoZGVidWdJbmZvKSB7XG4gICAgdGhpcy52ZXJzaW9uKys7XG4gICAgZ2xvYmFsVmVyc2lvbisrO1xuICAgIHRoaXMubm90aWZ5KGRlYnVnSW5mbyk7XG4gIH1cbiAgbm90aWZ5KGRlYnVnSW5mbykge1xuICAgIHN0YXJ0QmF0Y2goKTtcbiAgICB0cnkge1xuICAgICAgaWYgKCEhKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSBcInByb2R1Y3Rpb25cIikpIHtcbiAgICAgICAgZm9yIChsZXQgaGVhZCA9IHRoaXMuc3Vic0hlYWQ7IGhlYWQ7IGhlYWQgPSBoZWFkLm5leHRTdWIpIHtcbiAgICAgICAgICBpZiAoaGVhZC5zdWIub25UcmlnZ2VyICYmICEoaGVhZC5zdWIuZmxhZ3MgJiA4KSkge1xuICAgICAgICAgICAgaGVhZC5zdWIub25UcmlnZ2VyKFxuICAgICAgICAgICAgICBleHRlbmQoXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgZWZmZWN0OiBoZWFkLnN1YlxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgZGVidWdJbmZvXG4gICAgICAgICAgICAgIClcbiAgICAgICAgICAgICk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICBmb3IgKGxldCBsaW5rID0gdGhpcy5zdWJzOyBsaW5rOyBsaW5rID0gbGluay5wcmV2U3ViKSB7XG4gICAgICAgIGlmIChsaW5rLnN1Yi5ub3RpZnkoKSkge1xuICAgICAgICAgIDtcbiAgICAgICAgICBsaW5rLnN1Yi5kZXAubm90aWZ5KCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9IGZpbmFsbHkge1xuICAgICAgZW5kQmF0Y2goKTtcbiAgICB9XG4gIH1cbn1cbmZ1bmN0aW9uIGFkZFN1YihsaW5rKSB7XG4gIGxpbmsuZGVwLnNjKys7XG4gIGlmIChsaW5rLnN1Yi5mbGFncyAmIDQpIHtcbiAgICBjb25zdCBjb21wdXRlZCA9IGxpbmsuZGVwLmNvbXB1dGVkO1xuICAgIGlmIChjb21wdXRlZCAmJiAhbGluay5kZXAuc3Vicykge1xuICAgICAgY29tcHV0ZWQuZmxhZ3MgfD0gNCB8IDE2O1xuICAgICAgZm9yIChsZXQgbCA9IGNvbXB1dGVkLmRlcHM7IGw7IGwgPSBsLm5leHREZXApIHtcbiAgICAgICAgYWRkU3ViKGwpO1xuICAgICAgfVxuICAgIH1cbiAgICBjb25zdCBjdXJyZW50VGFpbCA9IGxpbmsuZGVwLnN1YnM7XG4gICAgaWYgKGN1cnJlbnRUYWlsICE9PSBsaW5rKSB7XG4gICAgICBsaW5rLnByZXZTdWIgPSBjdXJyZW50VGFpbDtcbiAgICAgIGlmIChjdXJyZW50VGFpbCkgY3VycmVudFRhaWwubmV4dFN1YiA9IGxpbms7XG4gICAgfVxuICAgIGlmICghIShwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gXCJwcm9kdWN0aW9uXCIpICYmIGxpbmsuZGVwLnN1YnNIZWFkID09PSB2b2lkIDApIHtcbiAgICAgIGxpbmsuZGVwLnN1YnNIZWFkID0gbGluaztcbiAgICB9XG4gICAgbGluay5kZXAuc3VicyA9IGxpbms7XG4gIH1cbn1cbmNvbnN0IHRhcmdldE1hcCA9IC8qIEBfX1BVUkVfXyAqLyBuZXcgV2Vha01hcCgpO1xuY29uc3QgSVRFUkFURV9LRVkgPSAvKiBAX19QVVJFX18gKi8gU3ltYm9sKFxuICAhIShwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gXCJwcm9kdWN0aW9uXCIpID8gXCJPYmplY3QgaXRlcmF0ZVwiIDogXCJcIlxuKTtcbmNvbnN0IE1BUF9LRVlfSVRFUkFURV9LRVkgPSAvKiBAX19QVVJFX18gKi8gU3ltYm9sKFxuICAhIShwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gXCJwcm9kdWN0aW9uXCIpID8gXCJNYXAga2V5cyBpdGVyYXRlXCIgOiBcIlwiXG4pO1xuY29uc3QgQVJSQVlfSVRFUkFURV9LRVkgPSAvKiBAX19QVVJFX18gKi8gU3ltYm9sKFxuICAhIShwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gXCJwcm9kdWN0aW9uXCIpID8gXCJBcnJheSBpdGVyYXRlXCIgOiBcIlwiXG4pO1xuZnVuY3Rpb24gdHJhY2sodGFyZ2V0LCB0eXBlLCBrZXkpIHtcbiAgaWYgKHNob3VsZFRyYWNrICYmIGFjdGl2ZVN1Yikge1xuICAgIGxldCBkZXBzTWFwID0gdGFyZ2V0TWFwLmdldCh0YXJnZXQpO1xuICAgIGlmICghZGVwc01hcCkge1xuICAgICAgdGFyZ2V0TWFwLnNldCh0YXJnZXQsIGRlcHNNYXAgPSAvKiBAX19QVVJFX18gKi8gbmV3IE1hcCgpKTtcbiAgICB9XG4gICAgbGV0IGRlcCA9IGRlcHNNYXAuZ2V0KGtleSk7XG4gICAgaWYgKCFkZXApIHtcbiAgICAgIGRlcHNNYXAuc2V0KGtleSwgZGVwID0gbmV3IERlcCgpKTtcbiAgICAgIGRlcC5tYXAgPSBkZXBzTWFwO1xuICAgICAgZGVwLmtleSA9IGtleTtcbiAgICB9XG4gICAgaWYgKCEhKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSBcInByb2R1Y3Rpb25cIikpIHtcbiAgICAgIGRlcC50cmFjayh7XG4gICAgICAgIHRhcmdldCxcbiAgICAgICAgdHlwZSxcbiAgICAgICAga2V5XG4gICAgICB9KTtcbiAgICB9IGVsc2Uge1xuICAgICAgZGVwLnRyYWNrKCk7XG4gICAgfVxuICB9XG59XG5mdW5jdGlvbiB0cmlnZ2VyKHRhcmdldCwgdHlwZSwga2V5LCBuZXdWYWx1ZSwgb2xkVmFsdWUsIG9sZFRhcmdldCkge1xuICBjb25zdCBkZXBzTWFwID0gdGFyZ2V0TWFwLmdldCh0YXJnZXQpO1xuICBpZiAoIWRlcHNNYXApIHtcbiAgICBnbG9iYWxWZXJzaW9uKys7XG4gICAgcmV0dXJuO1xuICB9XG4gIGNvbnN0IHJ1biA9IChkZXApID0+IHtcbiAgICBpZiAoZGVwKSB7XG4gICAgICBpZiAoISEocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09IFwicHJvZHVjdGlvblwiKSkge1xuICAgICAgICBkZXAudHJpZ2dlcih7XG4gICAgICAgICAgdGFyZ2V0LFxuICAgICAgICAgIHR5cGUsXG4gICAgICAgICAga2V5LFxuICAgICAgICAgIG5ld1ZhbHVlLFxuICAgICAgICAgIG9sZFZhbHVlLFxuICAgICAgICAgIG9sZFRhcmdldFxuICAgICAgICB9KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGRlcC50cmlnZ2VyKCk7XG4gICAgICB9XG4gICAgfVxuICB9O1xuICBzdGFydEJhdGNoKCk7XG4gIGlmICh0eXBlID09PSBcImNsZWFyXCIpIHtcbiAgICBkZXBzTWFwLmZvckVhY2gocnVuKTtcbiAgfSBlbHNlIHtcbiAgICBjb25zdCB0YXJnZXRJc0FycmF5ID0gaXNBcnJheSh0YXJnZXQpO1xuICAgIGNvbnN0IGlzQXJyYXlJbmRleCA9IHRhcmdldElzQXJyYXkgJiYgaXNJbnRlZ2VyS2V5KGtleSk7XG4gICAgaWYgKHRhcmdldElzQXJyYXkgJiYga2V5ID09PSBcImxlbmd0aFwiKSB7XG4gICAgICBjb25zdCBuZXdMZW5ndGggPSBOdW1iZXIobmV3VmFsdWUpO1xuICAgICAgZGVwc01hcC5mb3JFYWNoKChkZXAsIGtleTIpID0+IHtcbiAgICAgICAgaWYgKGtleTIgPT09IFwibGVuZ3RoXCIgfHwga2V5MiA9PT0gQVJSQVlfSVRFUkFURV9LRVkgfHwgIWlzU3ltYm9sKGtleTIpICYmIGtleTIgPj0gbmV3TGVuZ3RoKSB7XG4gICAgICAgICAgcnVuKGRlcCk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH0gZWxzZSB7XG4gICAgICBpZiAoa2V5ICE9PSB2b2lkIDAgfHwgZGVwc01hcC5oYXModm9pZCAwKSkge1xuICAgICAgICBydW4oZGVwc01hcC5nZXQoa2V5KSk7XG4gICAgICB9XG4gICAgICBpZiAoaXNBcnJheUluZGV4KSB7XG4gICAgICAgIHJ1bihkZXBzTWFwLmdldChBUlJBWV9JVEVSQVRFX0tFWSkpO1xuICAgICAgfVxuICAgICAgc3dpdGNoICh0eXBlKSB7XG4gICAgICAgIGNhc2UgXCJhZGRcIjpcbiAgICAgICAgICBpZiAoIXRhcmdldElzQXJyYXkpIHtcbiAgICAgICAgICAgIHJ1bihkZXBzTWFwLmdldChJVEVSQVRFX0tFWSkpO1xuICAgICAgICAgICAgaWYgKGlzTWFwKHRhcmdldCkpIHtcbiAgICAgICAgICAgICAgcnVuKGRlcHNNYXAuZ2V0KE1BUF9LRVlfSVRFUkFURV9LRVkpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9IGVsc2UgaWYgKGlzQXJyYXlJbmRleCkge1xuICAgICAgICAgICAgcnVuKGRlcHNNYXAuZ2V0KFwibGVuZ3RoXCIpKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgXCJkZWxldGVcIjpcbiAgICAgICAgICBpZiAoIXRhcmdldElzQXJyYXkpIHtcbiAgICAgICAgICAgIHJ1bihkZXBzTWFwLmdldChJVEVSQVRFX0tFWSkpO1xuICAgICAgICAgICAgaWYgKGlzTWFwKHRhcmdldCkpIHtcbiAgICAgICAgICAgICAgcnVuKGRlcHNNYXAuZ2V0KE1BUF9LRVlfSVRFUkFURV9LRVkpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgXCJzZXRcIjpcbiAgICAgICAgICBpZiAoaXNNYXAodGFyZ2V0KSkge1xuICAgICAgICAgICAgcnVuKGRlcHNNYXAuZ2V0KElURVJBVEVfS0VZKSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH1cbiAgfVxuICBlbmRCYXRjaCgpO1xufVxuZnVuY3Rpb24gZ2V0RGVwRnJvbVJlYWN0aXZlKG9iamVjdCwga2V5KSB7XG4gIGNvbnN0IGRlcE1hcCA9IHRhcmdldE1hcC5nZXQob2JqZWN0KTtcbiAgcmV0dXJuIGRlcE1hcCAmJiBkZXBNYXAuZ2V0KGtleSk7XG59XG5cbmZ1bmN0aW9uIHJlYWN0aXZlUmVhZEFycmF5KGFycmF5KSB7XG4gIGNvbnN0IHJhdyA9IHRvUmF3KGFycmF5KTtcbiAgaWYgKHJhdyA9PT0gYXJyYXkpIHJldHVybiByYXc7XG4gIHRyYWNrKHJhdywgXCJpdGVyYXRlXCIsIEFSUkFZX0lURVJBVEVfS0VZKTtcbiAgcmV0dXJuIGlzU2hhbGxvdyhhcnJheSkgPyByYXcgOiByYXcubWFwKHRvUmVhY3RpdmUpO1xufVxuZnVuY3Rpb24gc2hhbGxvd1JlYWRBcnJheShhcnIpIHtcbiAgdHJhY2soYXJyID0gdG9SYXcoYXJyKSwgXCJpdGVyYXRlXCIsIEFSUkFZX0lURVJBVEVfS0VZKTtcbiAgcmV0dXJuIGFycjtcbn1cbmZ1bmN0aW9uIHRvV3JhcHBlZCh0YXJnZXQsIGl0ZW0pIHtcbiAgaWYgKGlzUmVhZG9ubHkodGFyZ2V0KSkge1xuICAgIHJldHVybiBpc1JlYWN0aXZlKHRhcmdldCkgPyB0b1JlYWRvbmx5KHRvUmVhY3RpdmUoaXRlbSkpIDogdG9SZWFkb25seShpdGVtKTtcbiAgfVxuICByZXR1cm4gdG9SZWFjdGl2ZShpdGVtKTtcbn1cbmNvbnN0IGFycmF5SW5zdHJ1bWVudGF0aW9ucyA9IHtcbiAgX19wcm90b19fOiBudWxsLFxuICBbU3ltYm9sLml0ZXJhdG9yXSgpIHtcbiAgICByZXR1cm4gaXRlcmF0b3IodGhpcywgU3ltYm9sLml0ZXJhdG9yLCAoaXRlbSkgPT4gdG9XcmFwcGVkKHRoaXMsIGl0ZW0pKTtcbiAgfSxcbiAgY29uY2F0KC4uLmFyZ3MpIHtcbiAgICByZXR1cm4gcmVhY3RpdmVSZWFkQXJyYXkodGhpcykuY29uY2F0KFxuICAgICAgLi4uYXJncy5tYXAoKHgpID0+IGlzQXJyYXkoeCkgPyByZWFjdGl2ZVJlYWRBcnJheSh4KSA6IHgpXG4gICAgKTtcbiAgfSxcbiAgZW50cmllcygpIHtcbiAgICByZXR1cm4gaXRlcmF0b3IodGhpcywgXCJlbnRyaWVzXCIsICh2YWx1ZSkgPT4ge1xuICAgICAgdmFsdWVbMV0gPSB0b1dyYXBwZWQodGhpcywgdmFsdWVbMV0pO1xuICAgICAgcmV0dXJuIHZhbHVlO1xuICAgIH0pO1xuICB9LFxuICBldmVyeShmbiwgdGhpc0FyZykge1xuICAgIHJldHVybiBhcHBseSh0aGlzLCBcImV2ZXJ5XCIsIGZuLCB0aGlzQXJnLCB2b2lkIDAsIGFyZ3VtZW50cyk7XG4gIH0sXG4gIGZpbHRlcihmbiwgdGhpc0FyZykge1xuICAgIHJldHVybiBhcHBseShcbiAgICAgIHRoaXMsXG4gICAgICBcImZpbHRlclwiLFxuICAgICAgZm4sXG4gICAgICB0aGlzQXJnLFxuICAgICAgKHYpID0+IHYubWFwKChpdGVtKSA9PiB0b1dyYXBwZWQodGhpcywgaXRlbSkpLFxuICAgICAgYXJndW1lbnRzXG4gICAgKTtcbiAgfSxcbiAgZmluZChmbiwgdGhpc0FyZykge1xuICAgIHJldHVybiBhcHBseShcbiAgICAgIHRoaXMsXG4gICAgICBcImZpbmRcIixcbiAgICAgIGZuLFxuICAgICAgdGhpc0FyZyxcbiAgICAgIChpdGVtKSA9PiB0b1dyYXBwZWQodGhpcywgaXRlbSksXG4gICAgICBhcmd1bWVudHNcbiAgICApO1xuICB9LFxuICBmaW5kSW5kZXgoZm4sIHRoaXNBcmcpIHtcbiAgICByZXR1cm4gYXBwbHkodGhpcywgXCJmaW5kSW5kZXhcIiwgZm4sIHRoaXNBcmcsIHZvaWQgMCwgYXJndW1lbnRzKTtcbiAgfSxcbiAgZmluZExhc3QoZm4sIHRoaXNBcmcpIHtcbiAgICByZXR1cm4gYXBwbHkoXG4gICAgICB0aGlzLFxuICAgICAgXCJmaW5kTGFzdFwiLFxuICAgICAgZm4sXG4gICAgICB0aGlzQXJnLFxuICAgICAgKGl0ZW0pID0+IHRvV3JhcHBlZCh0aGlzLCBpdGVtKSxcbiAgICAgIGFyZ3VtZW50c1xuICAgICk7XG4gIH0sXG4gIGZpbmRMYXN0SW5kZXgoZm4sIHRoaXNBcmcpIHtcbiAgICByZXR1cm4gYXBwbHkodGhpcywgXCJmaW5kTGFzdEluZGV4XCIsIGZuLCB0aGlzQXJnLCB2b2lkIDAsIGFyZ3VtZW50cyk7XG4gIH0sXG4gIC8vIGZsYXQsIGZsYXRNYXAgY291bGQgYmVuZWZpdCBmcm9tIEFSUkFZX0lURVJBVEUgYnV0IGFyZSBub3Qgc3RyYWlnaHQtZm9yd2FyZCB0byBpbXBsZW1lbnRcbiAgZm9yRWFjaChmbiwgdGhpc0FyZykge1xuICAgIHJldHVybiBhcHBseSh0aGlzLCBcImZvckVhY2hcIiwgZm4sIHRoaXNBcmcsIHZvaWQgMCwgYXJndW1lbnRzKTtcbiAgfSxcbiAgaW5jbHVkZXMoLi4uYXJncykge1xuICAgIHJldHVybiBzZWFyY2hQcm94eSh0aGlzLCBcImluY2x1ZGVzXCIsIGFyZ3MpO1xuICB9LFxuICBpbmRleE9mKC4uLmFyZ3MpIHtcbiAgICByZXR1cm4gc2VhcmNoUHJveHkodGhpcywgXCJpbmRleE9mXCIsIGFyZ3MpO1xuICB9LFxuICBqb2luKHNlcGFyYXRvcikge1xuICAgIHJldHVybiByZWFjdGl2ZVJlYWRBcnJheSh0aGlzKS5qb2luKHNlcGFyYXRvcik7XG4gIH0sXG4gIC8vIGtleXMoKSBpdGVyYXRvciBvbmx5IHJlYWRzIGBsZW5ndGhgLCBubyBvcHRpbWl6YXRpb24gcmVxdWlyZWRcbiAgbGFzdEluZGV4T2YoLi4uYXJncykge1xuICAgIHJldHVybiBzZWFyY2hQcm94eSh0aGlzLCBcImxhc3RJbmRleE9mXCIsIGFyZ3MpO1xuICB9LFxuICBtYXAoZm4sIHRoaXNBcmcpIHtcbiAgICByZXR1cm4gYXBwbHkodGhpcywgXCJtYXBcIiwgZm4sIHRoaXNBcmcsIHZvaWQgMCwgYXJndW1lbnRzKTtcbiAgfSxcbiAgcG9wKCkge1xuICAgIHJldHVybiBub1RyYWNraW5nKHRoaXMsIFwicG9wXCIpO1xuICB9LFxuICBwdXNoKC4uLmFyZ3MpIHtcbiAgICByZXR1cm4gbm9UcmFja2luZyh0aGlzLCBcInB1c2hcIiwgYXJncyk7XG4gIH0sXG4gIHJlZHVjZShmbiwgLi4uYXJncykge1xuICAgIHJldHVybiByZWR1Y2UodGhpcywgXCJyZWR1Y2VcIiwgZm4sIGFyZ3MpO1xuICB9LFxuICByZWR1Y2VSaWdodChmbiwgLi4uYXJncykge1xuICAgIHJldHVybiByZWR1Y2UodGhpcywgXCJyZWR1Y2VSaWdodFwiLCBmbiwgYXJncyk7XG4gIH0sXG4gIHNoaWZ0KCkge1xuICAgIHJldHVybiBub1RyYWNraW5nKHRoaXMsIFwic2hpZnRcIik7XG4gIH0sXG4gIC8vIHNsaWNlIGNvdWxkIHVzZSBBUlJBWV9JVEVSQVRFIGJ1dCBhbHNvIHNlZW1zIHRvIGJlZyBmb3IgcmFuZ2UgdHJhY2tpbmdcbiAgc29tZShmbiwgdGhpc0FyZykge1xuICAgIHJldHVybiBhcHBseSh0aGlzLCBcInNvbWVcIiwgZm4sIHRoaXNBcmcsIHZvaWQgMCwgYXJndW1lbnRzKTtcbiAgfSxcbiAgc3BsaWNlKC4uLmFyZ3MpIHtcbiAgICByZXR1cm4gbm9UcmFja2luZyh0aGlzLCBcInNwbGljZVwiLCBhcmdzKTtcbiAgfSxcbiAgdG9SZXZlcnNlZCgpIHtcbiAgICByZXR1cm4gcmVhY3RpdmVSZWFkQXJyYXkodGhpcykudG9SZXZlcnNlZCgpO1xuICB9LFxuICB0b1NvcnRlZChjb21wYXJlcikge1xuICAgIHJldHVybiByZWFjdGl2ZVJlYWRBcnJheSh0aGlzKS50b1NvcnRlZChjb21wYXJlcik7XG4gIH0sXG4gIHRvU3BsaWNlZCguLi5hcmdzKSB7XG4gICAgcmV0dXJuIHJlYWN0aXZlUmVhZEFycmF5KHRoaXMpLnRvU3BsaWNlZCguLi5hcmdzKTtcbiAgfSxcbiAgdW5zaGlmdCguLi5hcmdzKSB7XG4gICAgcmV0dXJuIG5vVHJhY2tpbmcodGhpcywgXCJ1bnNoaWZ0XCIsIGFyZ3MpO1xuICB9LFxuICB2YWx1ZXMoKSB7XG4gICAgcmV0dXJuIGl0ZXJhdG9yKHRoaXMsIFwidmFsdWVzXCIsIChpdGVtKSA9PiB0b1dyYXBwZWQodGhpcywgaXRlbSkpO1xuICB9XG59O1xuZnVuY3Rpb24gaXRlcmF0b3Ioc2VsZiwgbWV0aG9kLCB3cmFwVmFsdWUpIHtcbiAgY29uc3QgYXJyID0gc2hhbGxvd1JlYWRBcnJheShzZWxmKTtcbiAgY29uc3QgaXRlciA9IGFyclttZXRob2RdKCk7XG4gIGlmIChhcnIgIT09IHNlbGYgJiYgIWlzU2hhbGxvdyhzZWxmKSkge1xuICAgIGl0ZXIuX25leHQgPSBpdGVyLm5leHQ7XG4gICAgaXRlci5uZXh0ID0gKCkgPT4ge1xuICAgICAgY29uc3QgcmVzdWx0ID0gaXRlci5fbmV4dCgpO1xuICAgICAgaWYgKCFyZXN1bHQuZG9uZSkge1xuICAgICAgICByZXN1bHQudmFsdWUgPSB3cmFwVmFsdWUocmVzdWx0LnZhbHVlKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfTtcbiAgfVxuICByZXR1cm4gaXRlcjtcbn1cbmNvbnN0IGFycmF5UHJvdG8gPSBBcnJheS5wcm90b3R5cGU7XG5mdW5jdGlvbiBhcHBseShzZWxmLCBtZXRob2QsIGZuLCB0aGlzQXJnLCB3cmFwcGVkUmV0Rm4sIGFyZ3MpIHtcbiAgY29uc3QgYXJyID0gc2hhbGxvd1JlYWRBcnJheShzZWxmKTtcbiAgY29uc3QgbmVlZHNXcmFwID0gYXJyICE9PSBzZWxmICYmICFpc1NoYWxsb3coc2VsZik7XG4gIGNvbnN0IG1ldGhvZEZuID0gYXJyW21ldGhvZF07XG4gIGlmIChtZXRob2RGbiAhPT0gYXJyYXlQcm90b1ttZXRob2RdKSB7XG4gICAgY29uc3QgcmVzdWx0MiA9IG1ldGhvZEZuLmFwcGx5KHNlbGYsIGFyZ3MpO1xuICAgIHJldHVybiBuZWVkc1dyYXAgPyB0b1JlYWN0aXZlKHJlc3VsdDIpIDogcmVzdWx0MjtcbiAgfVxuICBsZXQgd3JhcHBlZEZuID0gZm47XG4gIGlmIChhcnIgIT09IHNlbGYpIHtcbiAgICBpZiAobmVlZHNXcmFwKSB7XG4gICAgICB3cmFwcGVkRm4gPSBmdW5jdGlvbihpdGVtLCBpbmRleCkge1xuICAgICAgICByZXR1cm4gZm4uY2FsbCh0aGlzLCB0b1dyYXBwZWQoc2VsZiwgaXRlbSksIGluZGV4LCBzZWxmKTtcbiAgICAgIH07XG4gICAgfSBlbHNlIGlmIChmbi5sZW5ndGggPiAyKSB7XG4gICAgICB3cmFwcGVkRm4gPSBmdW5jdGlvbihpdGVtLCBpbmRleCkge1xuICAgICAgICByZXR1cm4gZm4uY2FsbCh0aGlzLCBpdGVtLCBpbmRleCwgc2VsZik7XG4gICAgICB9O1xuICAgIH1cbiAgfVxuICBjb25zdCByZXN1bHQgPSBtZXRob2RGbi5jYWxsKGFyciwgd3JhcHBlZEZuLCB0aGlzQXJnKTtcbiAgcmV0dXJuIG5lZWRzV3JhcCAmJiB3cmFwcGVkUmV0Rm4gPyB3cmFwcGVkUmV0Rm4ocmVzdWx0KSA6IHJlc3VsdDtcbn1cbmZ1bmN0aW9uIHJlZHVjZShzZWxmLCBtZXRob2QsIGZuLCBhcmdzKSB7XG4gIGNvbnN0IGFyciA9IHNoYWxsb3dSZWFkQXJyYXkoc2VsZik7XG4gIGxldCB3cmFwcGVkRm4gPSBmbjtcbiAgaWYgKGFyciAhPT0gc2VsZikge1xuICAgIGlmICghaXNTaGFsbG93KHNlbGYpKSB7XG4gICAgICB3cmFwcGVkRm4gPSBmdW5jdGlvbihhY2MsIGl0ZW0sIGluZGV4KSB7XG4gICAgICAgIHJldHVybiBmbi5jYWxsKHRoaXMsIGFjYywgdG9XcmFwcGVkKHNlbGYsIGl0ZW0pLCBpbmRleCwgc2VsZik7XG4gICAgICB9O1xuICAgIH0gZWxzZSBpZiAoZm4ubGVuZ3RoID4gMykge1xuICAgICAgd3JhcHBlZEZuID0gZnVuY3Rpb24oYWNjLCBpdGVtLCBpbmRleCkge1xuICAgICAgICByZXR1cm4gZm4uY2FsbCh0aGlzLCBhY2MsIGl0ZW0sIGluZGV4LCBzZWxmKTtcbiAgICAgIH07XG4gICAgfVxuICB9XG4gIHJldHVybiBhcnJbbWV0aG9kXSh3cmFwcGVkRm4sIC4uLmFyZ3MpO1xufVxuZnVuY3Rpb24gc2VhcmNoUHJveHkoc2VsZiwgbWV0aG9kLCBhcmdzKSB7XG4gIGNvbnN0IGFyciA9IHRvUmF3KHNlbGYpO1xuICB0cmFjayhhcnIsIFwiaXRlcmF0ZVwiLCBBUlJBWV9JVEVSQVRFX0tFWSk7XG4gIGNvbnN0IHJlcyA9IGFyclttZXRob2RdKC4uLmFyZ3MpO1xuICBpZiAoKHJlcyA9PT0gLTEgfHwgcmVzID09PSBmYWxzZSkgJiYgaXNQcm94eShhcmdzWzBdKSkge1xuICAgIGFyZ3NbMF0gPSB0b1JhdyhhcmdzWzBdKTtcbiAgICByZXR1cm4gYXJyW21ldGhvZF0oLi4uYXJncyk7XG4gIH1cbiAgcmV0dXJuIHJlcztcbn1cbmZ1bmN0aW9uIG5vVHJhY2tpbmcoc2VsZiwgbWV0aG9kLCBhcmdzID0gW10pIHtcbiAgcGF1c2VUcmFja2luZygpO1xuICBzdGFydEJhdGNoKCk7XG4gIGNvbnN0IHJlcyA9IHRvUmF3KHNlbGYpW21ldGhvZF0uYXBwbHkoc2VsZiwgYXJncyk7XG4gIGVuZEJhdGNoKCk7XG4gIHJlc2V0VHJhY2tpbmcoKTtcbiAgcmV0dXJuIHJlcztcbn1cblxuY29uc3QgaXNOb25UcmFja2FibGVLZXlzID0gLyogQF9fUFVSRV9fICovIG1ha2VNYXAoYF9fcHJvdG9fXyxfX3ZfaXNSZWYsX19pc1Z1ZWApO1xuY29uc3QgYnVpbHRJblN5bWJvbHMgPSBuZXcgU2V0KFxuICAvKiBAX19QVVJFX18gKi8gT2JqZWN0LmdldE93blByb3BlcnR5TmFtZXMoU3ltYm9sKS5maWx0ZXIoKGtleSkgPT4ga2V5ICE9PSBcImFyZ3VtZW50c1wiICYmIGtleSAhPT0gXCJjYWxsZXJcIikubWFwKChrZXkpID0+IFN5bWJvbFtrZXldKS5maWx0ZXIoaXNTeW1ib2wpXG4pO1xuZnVuY3Rpb24gaGFzT3duUHJvcGVydHkoa2V5KSB7XG4gIGlmICghaXNTeW1ib2woa2V5KSkga2V5ID0gU3RyaW5nKGtleSk7XG4gIGNvbnN0IG9iaiA9IHRvUmF3KHRoaXMpO1xuICB0cmFjayhvYmosIFwiaGFzXCIsIGtleSk7XG4gIHJldHVybiBvYmouaGFzT3duUHJvcGVydHkoa2V5KTtcbn1cbmNsYXNzIEJhc2VSZWFjdGl2ZUhhbmRsZXIge1xuICBjb25zdHJ1Y3RvcihfaXNSZWFkb25seSA9IGZhbHNlLCBfaXNTaGFsbG93ID0gZmFsc2UpIHtcbiAgICB0aGlzLl9pc1JlYWRvbmx5ID0gX2lzUmVhZG9ubHk7XG4gICAgdGhpcy5faXNTaGFsbG93ID0gX2lzU2hhbGxvdztcbiAgfVxuICBnZXQodGFyZ2V0LCBrZXksIHJlY2VpdmVyKSB7XG4gICAgaWYgKGtleSA9PT0gXCJfX3Zfc2tpcFwiKSByZXR1cm4gdGFyZ2V0W1wiX192X3NraXBcIl07XG4gICAgY29uc3QgaXNSZWFkb25seTIgPSB0aGlzLl9pc1JlYWRvbmx5LCBpc1NoYWxsb3cyID0gdGhpcy5faXNTaGFsbG93O1xuICAgIGlmIChrZXkgPT09IFwiX192X2lzUmVhY3RpdmVcIikge1xuICAgICAgcmV0dXJuICFpc1JlYWRvbmx5MjtcbiAgICB9IGVsc2UgaWYgKGtleSA9PT0gXCJfX3ZfaXNSZWFkb25seVwiKSB7XG4gICAgICByZXR1cm4gaXNSZWFkb25seTI7XG4gICAgfSBlbHNlIGlmIChrZXkgPT09IFwiX192X2lzU2hhbGxvd1wiKSB7XG4gICAgICByZXR1cm4gaXNTaGFsbG93MjtcbiAgICB9IGVsc2UgaWYgKGtleSA9PT0gXCJfX3ZfcmF3XCIpIHtcbiAgICAgIGlmIChyZWNlaXZlciA9PT0gKGlzUmVhZG9ubHkyID8gaXNTaGFsbG93MiA/IHNoYWxsb3dSZWFkb25seU1hcCA6IHJlYWRvbmx5TWFwIDogaXNTaGFsbG93MiA/IHNoYWxsb3dSZWFjdGl2ZU1hcCA6IHJlYWN0aXZlTWFwKS5nZXQodGFyZ2V0KSB8fCAvLyByZWNlaXZlciBpcyBub3QgdGhlIHJlYWN0aXZlIHByb3h5LCBidXQgaGFzIHRoZSBzYW1lIHByb3RvdHlwZVxuICAgICAgLy8gdGhpcyBtZWFucyB0aGUgcmVjZWl2ZXIgaXMgYSB1c2VyIHByb3h5IG9mIHRoZSByZWFjdGl2ZSBwcm94eVxuICAgICAgT2JqZWN0LmdldFByb3RvdHlwZU9mKHRhcmdldCkgPT09IE9iamVjdC5nZXRQcm90b3R5cGVPZihyZWNlaXZlcikpIHtcbiAgICAgICAgcmV0dXJuIHRhcmdldDtcbiAgICAgIH1cbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgY29uc3QgdGFyZ2V0SXNBcnJheSA9IGlzQXJyYXkodGFyZ2V0KTtcbiAgICBpZiAoIWlzUmVhZG9ubHkyKSB7XG4gICAgICBsZXQgZm47XG4gICAgICBpZiAodGFyZ2V0SXNBcnJheSAmJiAoZm4gPSBhcnJheUluc3RydW1lbnRhdGlvbnNba2V5XSkpIHtcbiAgICAgICAgcmV0dXJuIGZuO1xuICAgICAgfVxuICAgICAgaWYgKGtleSA9PT0gXCJoYXNPd25Qcm9wZXJ0eVwiKSB7XG4gICAgICAgIHJldHVybiBoYXNPd25Qcm9wZXJ0eTtcbiAgICAgIH1cbiAgICB9XG4gICAgY29uc3QgcmVzID0gUmVmbGVjdC5nZXQoXG4gICAgICB0YXJnZXQsXG4gICAgICBrZXksXG4gICAgICAvLyBpZiB0aGlzIGlzIGEgcHJveHkgd3JhcHBpbmcgYSByZWYsIHJldHVybiBtZXRob2RzIHVzaW5nIHRoZSByYXcgcmVmXG4gICAgICAvLyBhcyByZWNlaXZlciBzbyB0aGF0IHdlIGRvbid0IGhhdmUgdG8gY2FsbCBgdG9SYXdgIG9uIHRoZSByZWYgaW4gYWxsXG4gICAgICAvLyBpdHMgY2xhc3MgbWV0aG9kc1xuICAgICAgaXNSZWYodGFyZ2V0KSA/IHRhcmdldCA6IHJlY2VpdmVyXG4gICAgKTtcbiAgICBpZiAoaXNTeW1ib2woa2V5KSA/IGJ1aWx0SW5TeW1ib2xzLmhhcyhrZXkpIDogaXNOb25UcmFja2FibGVLZXlzKGtleSkpIHtcbiAgICAgIHJldHVybiByZXM7XG4gICAgfVxuICAgIGlmICghaXNSZWFkb25seTIpIHtcbiAgICAgIHRyYWNrKHRhcmdldCwgXCJnZXRcIiwga2V5KTtcbiAgICB9XG4gICAgaWYgKGlzU2hhbGxvdzIpIHtcbiAgICAgIHJldHVybiByZXM7XG4gICAgfVxuICAgIGlmIChpc1JlZihyZXMpKSB7XG4gICAgICBjb25zdCB2YWx1ZSA9IHRhcmdldElzQXJyYXkgJiYgaXNJbnRlZ2VyS2V5KGtleSkgPyByZXMgOiByZXMudmFsdWU7XG4gICAgICByZXR1cm4gaXNSZWFkb25seTIgJiYgaXNPYmplY3QodmFsdWUpID8gcmVhZG9ubHkodmFsdWUpIDogdmFsdWU7XG4gICAgfVxuICAgIGlmIChpc09iamVjdChyZXMpKSB7XG4gICAgICByZXR1cm4gaXNSZWFkb25seTIgPyByZWFkb25seShyZXMpIDogcmVhY3RpdmUocmVzKTtcbiAgICB9XG4gICAgcmV0dXJuIHJlcztcbiAgfVxufVxuY2xhc3MgTXV0YWJsZVJlYWN0aXZlSGFuZGxlciBleHRlbmRzIEJhc2VSZWFjdGl2ZUhhbmRsZXIge1xuICBjb25zdHJ1Y3Rvcihpc1NoYWxsb3cyID0gZmFsc2UpIHtcbiAgICBzdXBlcihmYWxzZSwgaXNTaGFsbG93Mik7XG4gIH1cbiAgc2V0KHRhcmdldCwga2V5LCB2YWx1ZSwgcmVjZWl2ZXIpIHtcbiAgICBsZXQgb2xkVmFsdWUgPSB0YXJnZXRba2V5XTtcbiAgICBjb25zdCBpc0FycmF5V2l0aEludGVnZXJLZXkgPSBpc0FycmF5KHRhcmdldCkgJiYgaXNJbnRlZ2VyS2V5KGtleSk7XG4gICAgaWYgKCF0aGlzLl9pc1NoYWxsb3cpIHtcbiAgICAgIGNvbnN0IGlzT2xkVmFsdWVSZWFkb25seSA9IGlzUmVhZG9ubHkob2xkVmFsdWUpO1xuICAgICAgaWYgKCFpc1NoYWxsb3codmFsdWUpICYmICFpc1JlYWRvbmx5KHZhbHVlKSkge1xuICAgICAgICBvbGRWYWx1ZSA9IHRvUmF3KG9sZFZhbHVlKTtcbiAgICAgICAgdmFsdWUgPSB0b1Jhdyh2YWx1ZSk7XG4gICAgICB9XG4gICAgICBpZiAoIWlzQXJyYXlXaXRoSW50ZWdlcktleSAmJiBpc1JlZihvbGRWYWx1ZSkgJiYgIWlzUmVmKHZhbHVlKSkge1xuICAgICAgICBpZiAoaXNPbGRWYWx1ZVJlYWRvbmx5KSB7XG4gICAgICAgICAgaWYgKCEhKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSBcInByb2R1Y3Rpb25cIikpIHtcbiAgICAgICAgICAgIHdhcm4oXG4gICAgICAgICAgICAgIGBTZXQgb3BlcmF0aW9uIG9uIGtleSBcIiR7U3RyaW5nKGtleSl9XCIgZmFpbGVkOiB0YXJnZXQgaXMgcmVhZG9ubHkuYCxcbiAgICAgICAgICAgICAgdGFyZ2V0W2tleV1cbiAgICAgICAgICAgICk7XG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIG9sZFZhbHVlLnZhbHVlID0gdmFsdWU7XG4gICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgY29uc3QgaGFkS2V5ID0gaXNBcnJheVdpdGhJbnRlZ2VyS2V5ID8gTnVtYmVyKGtleSkgPCB0YXJnZXQubGVuZ3RoIDogaGFzT3duKHRhcmdldCwga2V5KTtcbiAgICBjb25zdCByZXN1bHQgPSBSZWZsZWN0LnNldChcbiAgICAgIHRhcmdldCxcbiAgICAgIGtleSxcbiAgICAgIHZhbHVlLFxuICAgICAgaXNSZWYodGFyZ2V0KSA/IHRhcmdldCA6IHJlY2VpdmVyXG4gICAgKTtcbiAgICBpZiAodGFyZ2V0ID09PSB0b1JhdyhyZWNlaXZlcikpIHtcbiAgICAgIGlmICghaGFkS2V5KSB7XG4gICAgICAgIHRyaWdnZXIodGFyZ2V0LCBcImFkZFwiLCBrZXksIHZhbHVlKTtcbiAgICAgIH0gZWxzZSBpZiAoaGFzQ2hhbmdlZCh2YWx1ZSwgb2xkVmFsdWUpKSB7XG4gICAgICAgIHRyaWdnZXIodGFyZ2V0LCBcInNldFwiLCBrZXksIHZhbHVlLCBvbGRWYWx1ZSk7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiByZXN1bHQ7XG4gIH1cbiAgZGVsZXRlUHJvcGVydHkodGFyZ2V0LCBrZXkpIHtcbiAgICBjb25zdCBoYWRLZXkgPSBoYXNPd24odGFyZ2V0LCBrZXkpO1xuICAgIGNvbnN0IG9sZFZhbHVlID0gdGFyZ2V0W2tleV07XG4gICAgY29uc3QgcmVzdWx0ID0gUmVmbGVjdC5kZWxldGVQcm9wZXJ0eSh0YXJnZXQsIGtleSk7XG4gICAgaWYgKHJlc3VsdCAmJiBoYWRLZXkpIHtcbiAgICAgIHRyaWdnZXIodGFyZ2V0LCBcImRlbGV0ZVwiLCBrZXksIHZvaWQgMCwgb2xkVmFsdWUpO1xuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0O1xuICB9XG4gIGhhcyh0YXJnZXQsIGtleSkge1xuICAgIGNvbnN0IHJlc3VsdCA9IFJlZmxlY3QuaGFzKHRhcmdldCwga2V5KTtcbiAgICBpZiAoIWlzU3ltYm9sKGtleSkgfHwgIWJ1aWx0SW5TeW1ib2xzLmhhcyhrZXkpKSB7XG4gICAgICB0cmFjayh0YXJnZXQsIFwiaGFzXCIsIGtleSk7XG4gICAgfVxuICAgIHJldHVybiByZXN1bHQ7XG4gIH1cbiAgb3duS2V5cyh0YXJnZXQpIHtcbiAgICB0cmFjayhcbiAgICAgIHRhcmdldCxcbiAgICAgIFwiaXRlcmF0ZVwiLFxuICAgICAgaXNBcnJheSh0YXJnZXQpID8gXCJsZW5ndGhcIiA6IElURVJBVEVfS0VZXG4gICAgKTtcbiAgICByZXR1cm4gUmVmbGVjdC5vd25LZXlzKHRhcmdldCk7XG4gIH1cbn1cbmNsYXNzIFJlYWRvbmx5UmVhY3RpdmVIYW5kbGVyIGV4dGVuZHMgQmFzZVJlYWN0aXZlSGFuZGxlciB7XG4gIGNvbnN0cnVjdG9yKGlzU2hhbGxvdzIgPSBmYWxzZSkge1xuICAgIHN1cGVyKHRydWUsIGlzU2hhbGxvdzIpO1xuICB9XG4gIHNldCh0YXJnZXQsIGtleSkge1xuICAgIGlmICghIShwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gXCJwcm9kdWN0aW9uXCIpKSB7XG4gICAgICB3YXJuKFxuICAgICAgICBgU2V0IG9wZXJhdGlvbiBvbiBrZXkgXCIke1N0cmluZyhrZXkpfVwiIGZhaWxlZDogdGFyZ2V0IGlzIHJlYWRvbmx5LmAsXG4gICAgICAgIHRhcmdldFxuICAgICAgKTtcbiAgICB9XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cbiAgZGVsZXRlUHJvcGVydHkodGFyZ2V0LCBrZXkpIHtcbiAgICBpZiAoISEocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09IFwicHJvZHVjdGlvblwiKSkge1xuICAgICAgd2FybihcbiAgICAgICAgYERlbGV0ZSBvcGVyYXRpb24gb24ga2V5IFwiJHtTdHJpbmcoa2V5KX1cIiBmYWlsZWQ6IHRhcmdldCBpcyByZWFkb25seS5gLFxuICAgICAgICB0YXJnZXRcbiAgICAgICk7XG4gICAgfVxuICAgIHJldHVybiB0cnVlO1xuICB9XG59XG5jb25zdCBtdXRhYmxlSGFuZGxlcnMgPSAvKiBAX19QVVJFX18gKi8gbmV3IE11dGFibGVSZWFjdGl2ZUhhbmRsZXIoKTtcbmNvbnN0IHJlYWRvbmx5SGFuZGxlcnMgPSAvKiBAX19QVVJFX18gKi8gbmV3IFJlYWRvbmx5UmVhY3RpdmVIYW5kbGVyKCk7XG5jb25zdCBzaGFsbG93UmVhY3RpdmVIYW5kbGVycyA9IC8qIEBfX1BVUkVfXyAqLyBuZXcgTXV0YWJsZVJlYWN0aXZlSGFuZGxlcih0cnVlKTtcbmNvbnN0IHNoYWxsb3dSZWFkb25seUhhbmRsZXJzID0gLyogQF9fUFVSRV9fICovIG5ldyBSZWFkb25seVJlYWN0aXZlSGFuZGxlcih0cnVlKTtcblxuY29uc3QgdG9TaGFsbG93ID0gKHZhbHVlKSA9PiB2YWx1ZTtcbmNvbnN0IGdldFByb3RvID0gKHYpID0+IFJlZmxlY3QuZ2V0UHJvdG90eXBlT2Yodik7XG5mdW5jdGlvbiBjcmVhdGVJdGVyYWJsZU1ldGhvZChtZXRob2QsIGlzUmVhZG9ubHkyLCBpc1NoYWxsb3cyKSB7XG4gIHJldHVybiBmdW5jdGlvbiguLi5hcmdzKSB7XG4gICAgY29uc3QgdGFyZ2V0ID0gdGhpc1tcIl9fdl9yYXdcIl07XG4gICAgY29uc3QgcmF3VGFyZ2V0ID0gdG9SYXcodGFyZ2V0KTtcbiAgICBjb25zdCB0YXJnZXRJc01hcCA9IGlzTWFwKHJhd1RhcmdldCk7XG4gICAgY29uc3QgaXNQYWlyID0gbWV0aG9kID09PSBcImVudHJpZXNcIiB8fCBtZXRob2QgPT09IFN5bWJvbC5pdGVyYXRvciAmJiB0YXJnZXRJc01hcDtcbiAgICBjb25zdCBpc0tleU9ubHkgPSBtZXRob2QgPT09IFwia2V5c1wiICYmIHRhcmdldElzTWFwO1xuICAgIGNvbnN0IGlubmVySXRlcmF0b3IgPSB0YXJnZXRbbWV0aG9kXSguLi5hcmdzKTtcbiAgICBjb25zdCB3cmFwID0gaXNTaGFsbG93MiA/IHRvU2hhbGxvdyA6IGlzUmVhZG9ubHkyID8gdG9SZWFkb25seSA6IHRvUmVhY3RpdmU7XG4gICAgIWlzUmVhZG9ubHkyICYmIHRyYWNrKFxuICAgICAgcmF3VGFyZ2V0LFxuICAgICAgXCJpdGVyYXRlXCIsXG4gICAgICBpc0tleU9ubHkgPyBNQVBfS0VZX0lURVJBVEVfS0VZIDogSVRFUkFURV9LRVlcbiAgICApO1xuICAgIHJldHVybiBleHRlbmQoXG4gICAgICAvLyBpbmhlcml0aW5nIGFsbCBpdGVyYXRvciBwcm9wZXJ0aWVzXG4gICAgICBPYmplY3QuY3JlYXRlKGlubmVySXRlcmF0b3IpLFxuICAgICAge1xuICAgICAgICAvLyBpdGVyYXRvciBwcm90b2NvbFxuICAgICAgICBuZXh0KCkge1xuICAgICAgICAgIGNvbnN0IHsgdmFsdWUsIGRvbmUgfSA9IGlubmVySXRlcmF0b3IubmV4dCgpO1xuICAgICAgICAgIHJldHVybiBkb25lID8geyB2YWx1ZSwgZG9uZSB9IDoge1xuICAgICAgICAgICAgdmFsdWU6IGlzUGFpciA/IFt3cmFwKHZhbHVlWzBdKSwgd3JhcCh2YWx1ZVsxXSldIDogd3JhcCh2YWx1ZSksXG4gICAgICAgICAgICBkb25lXG4gICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICk7XG4gIH07XG59XG5mdW5jdGlvbiBjcmVhdGVSZWFkb25seU1ldGhvZCh0eXBlKSB7XG4gIHJldHVybiBmdW5jdGlvbiguLi5hcmdzKSB7XG4gICAgaWYgKCEhKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSBcInByb2R1Y3Rpb25cIikpIHtcbiAgICAgIGNvbnN0IGtleSA9IGFyZ3NbMF0gPyBgb24ga2V5IFwiJHthcmdzWzBdfVwiIGAgOiBgYDtcbiAgICAgIHdhcm4oXG4gICAgICAgIGAke2NhcGl0YWxpemUodHlwZSl9IG9wZXJhdGlvbiAke2tleX1mYWlsZWQ6IHRhcmdldCBpcyByZWFkb25seS5gLFxuICAgICAgICB0b1Jhdyh0aGlzKVxuICAgICAgKTtcbiAgICB9XG4gICAgcmV0dXJuIHR5cGUgPT09IFwiZGVsZXRlXCIgPyBmYWxzZSA6IHR5cGUgPT09IFwiY2xlYXJcIiA/IHZvaWQgMCA6IHRoaXM7XG4gIH07XG59XG5mdW5jdGlvbiBjcmVhdGVJbnN0cnVtZW50YXRpb25zKHJlYWRvbmx5LCBzaGFsbG93KSB7XG4gIGNvbnN0IGluc3RydW1lbnRhdGlvbnMgPSB7XG4gICAgZ2V0KGtleSkge1xuICAgICAgY29uc3QgdGFyZ2V0ID0gdGhpc1tcIl9fdl9yYXdcIl07XG4gICAgICBjb25zdCByYXdUYXJnZXQgPSB0b1Jhdyh0YXJnZXQpO1xuICAgICAgY29uc3QgcmF3S2V5ID0gdG9SYXcoa2V5KTtcbiAgICAgIGlmICghcmVhZG9ubHkpIHtcbiAgICAgICAgaWYgKGhhc0NoYW5nZWQoa2V5LCByYXdLZXkpKSB7XG4gICAgICAgICAgdHJhY2socmF3VGFyZ2V0LCBcImdldFwiLCBrZXkpO1xuICAgICAgICB9XG4gICAgICAgIHRyYWNrKHJhd1RhcmdldCwgXCJnZXRcIiwgcmF3S2V5KTtcbiAgICAgIH1cbiAgICAgIGNvbnN0IHsgaGFzIH0gPSBnZXRQcm90byhyYXdUYXJnZXQpO1xuICAgICAgY29uc3Qgd3JhcCA9IHNoYWxsb3cgPyB0b1NoYWxsb3cgOiByZWFkb25seSA/IHRvUmVhZG9ubHkgOiB0b1JlYWN0aXZlO1xuICAgICAgaWYgKGhhcy5jYWxsKHJhd1RhcmdldCwga2V5KSkge1xuICAgICAgICByZXR1cm4gd3JhcCh0YXJnZXQuZ2V0KGtleSkpO1xuICAgICAgfSBlbHNlIGlmIChoYXMuY2FsbChyYXdUYXJnZXQsIHJhd0tleSkpIHtcbiAgICAgICAgcmV0dXJuIHdyYXAodGFyZ2V0LmdldChyYXdLZXkpKTtcbiAgICAgIH0gZWxzZSBpZiAodGFyZ2V0ICE9PSByYXdUYXJnZXQpIHtcbiAgICAgICAgdGFyZ2V0LmdldChrZXkpO1xuICAgICAgfVxuICAgIH0sXG4gICAgZ2V0IHNpemUoKSB7XG4gICAgICBjb25zdCB0YXJnZXQgPSB0aGlzW1wiX192X3Jhd1wiXTtcbiAgICAgICFyZWFkb25seSAmJiB0cmFjayh0b1Jhdyh0YXJnZXQpLCBcIml0ZXJhdGVcIiwgSVRFUkFURV9LRVkpO1xuICAgICAgcmV0dXJuIHRhcmdldC5zaXplO1xuICAgIH0sXG4gICAgaGFzKGtleSkge1xuICAgICAgY29uc3QgdGFyZ2V0ID0gdGhpc1tcIl9fdl9yYXdcIl07XG4gICAgICBjb25zdCByYXdUYXJnZXQgPSB0b1Jhdyh0YXJnZXQpO1xuICAgICAgY29uc3QgcmF3S2V5ID0gdG9SYXcoa2V5KTtcbiAgICAgIGlmICghcmVhZG9ubHkpIHtcbiAgICAgICAgaWYgKGhhc0NoYW5nZWQoa2V5LCByYXdLZXkpKSB7XG4gICAgICAgICAgdHJhY2socmF3VGFyZ2V0LCBcImhhc1wiLCBrZXkpO1xuICAgICAgICB9XG4gICAgICAgIHRyYWNrKHJhd1RhcmdldCwgXCJoYXNcIiwgcmF3S2V5KTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBrZXkgPT09IHJhd0tleSA/IHRhcmdldC5oYXMoa2V5KSA6IHRhcmdldC5oYXMoa2V5KSB8fCB0YXJnZXQuaGFzKHJhd0tleSk7XG4gICAgfSxcbiAgICBmb3JFYWNoKGNhbGxiYWNrLCB0aGlzQXJnKSB7XG4gICAgICBjb25zdCBvYnNlcnZlZCA9IHRoaXM7XG4gICAgICBjb25zdCB0YXJnZXQgPSBvYnNlcnZlZFtcIl9fdl9yYXdcIl07XG4gICAgICBjb25zdCByYXdUYXJnZXQgPSB0b1Jhdyh0YXJnZXQpO1xuICAgICAgY29uc3Qgd3JhcCA9IHNoYWxsb3cgPyB0b1NoYWxsb3cgOiByZWFkb25seSA/IHRvUmVhZG9ubHkgOiB0b1JlYWN0aXZlO1xuICAgICAgIXJlYWRvbmx5ICYmIHRyYWNrKHJhd1RhcmdldCwgXCJpdGVyYXRlXCIsIElURVJBVEVfS0VZKTtcbiAgICAgIHJldHVybiB0YXJnZXQuZm9yRWFjaCgodmFsdWUsIGtleSkgPT4ge1xuICAgICAgICByZXR1cm4gY2FsbGJhY2suY2FsbCh0aGlzQXJnLCB3cmFwKHZhbHVlKSwgd3JhcChrZXkpLCBvYnNlcnZlZCk7XG4gICAgICB9KTtcbiAgICB9XG4gIH07XG4gIGV4dGVuZChcbiAgICBpbnN0cnVtZW50YXRpb25zLFxuICAgIHJlYWRvbmx5ID8ge1xuICAgICAgYWRkOiBjcmVhdGVSZWFkb25seU1ldGhvZChcImFkZFwiKSxcbiAgICAgIHNldDogY3JlYXRlUmVhZG9ubHlNZXRob2QoXCJzZXRcIiksXG4gICAgICBkZWxldGU6IGNyZWF0ZVJlYWRvbmx5TWV0aG9kKFwiZGVsZXRlXCIpLFxuICAgICAgY2xlYXI6IGNyZWF0ZVJlYWRvbmx5TWV0aG9kKFwiY2xlYXJcIilcbiAgICB9IDoge1xuICAgICAgYWRkKHZhbHVlKSB7XG4gICAgICAgIGlmICghc2hhbGxvdyAmJiAhaXNTaGFsbG93KHZhbHVlKSAmJiAhaXNSZWFkb25seSh2YWx1ZSkpIHtcbiAgICAgICAgICB2YWx1ZSA9IHRvUmF3KHZhbHVlKTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCB0YXJnZXQgPSB0b1Jhdyh0aGlzKTtcbiAgICAgICAgY29uc3QgcHJvdG8gPSBnZXRQcm90byh0YXJnZXQpO1xuICAgICAgICBjb25zdCBoYWRLZXkgPSBwcm90by5oYXMuY2FsbCh0YXJnZXQsIHZhbHVlKTtcbiAgICAgICAgaWYgKCFoYWRLZXkpIHtcbiAgICAgICAgICB0YXJnZXQuYWRkKHZhbHVlKTtcbiAgICAgICAgICB0cmlnZ2VyKHRhcmdldCwgXCJhZGRcIiwgdmFsdWUsIHZhbHVlKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgIH0sXG4gICAgICBzZXQoa2V5LCB2YWx1ZSkge1xuICAgICAgICBpZiAoIXNoYWxsb3cgJiYgIWlzU2hhbGxvdyh2YWx1ZSkgJiYgIWlzUmVhZG9ubHkodmFsdWUpKSB7XG4gICAgICAgICAgdmFsdWUgPSB0b1Jhdyh2YWx1ZSk7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgdGFyZ2V0ID0gdG9SYXcodGhpcyk7XG4gICAgICAgIGNvbnN0IHsgaGFzLCBnZXQgfSA9IGdldFByb3RvKHRhcmdldCk7XG4gICAgICAgIGxldCBoYWRLZXkgPSBoYXMuY2FsbCh0YXJnZXQsIGtleSk7XG4gICAgICAgIGlmICghaGFkS2V5KSB7XG4gICAgICAgICAga2V5ID0gdG9SYXcoa2V5KTtcbiAgICAgICAgICBoYWRLZXkgPSBoYXMuY2FsbCh0YXJnZXQsIGtleSk7XG4gICAgICAgIH0gZWxzZSBpZiAoISEocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09IFwicHJvZHVjdGlvblwiKSkge1xuICAgICAgICAgIGNoZWNrSWRlbnRpdHlLZXlzKHRhcmdldCwgaGFzLCBrZXkpO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IG9sZFZhbHVlID0gZ2V0LmNhbGwodGFyZ2V0LCBrZXkpO1xuICAgICAgICB0YXJnZXQuc2V0KGtleSwgdmFsdWUpO1xuICAgICAgICBpZiAoIWhhZEtleSkge1xuICAgICAgICAgIHRyaWdnZXIodGFyZ2V0LCBcImFkZFwiLCBrZXksIHZhbHVlKTtcbiAgICAgICAgfSBlbHNlIGlmIChoYXNDaGFuZ2VkKHZhbHVlLCBvbGRWYWx1ZSkpIHtcbiAgICAgICAgICB0cmlnZ2VyKHRhcmdldCwgXCJzZXRcIiwga2V5LCB2YWx1ZSwgb2xkVmFsdWUpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgfSxcbiAgICAgIGRlbGV0ZShrZXkpIHtcbiAgICAgICAgY29uc3QgdGFyZ2V0ID0gdG9SYXcodGhpcyk7XG4gICAgICAgIGNvbnN0IHsgaGFzLCBnZXQgfSA9IGdldFByb3RvKHRhcmdldCk7XG4gICAgICAgIGxldCBoYWRLZXkgPSBoYXMuY2FsbCh0YXJnZXQsIGtleSk7XG4gICAgICAgIGlmICghaGFkS2V5KSB7XG4gICAgICAgICAga2V5ID0gdG9SYXcoa2V5KTtcbiAgICAgICAgICBoYWRLZXkgPSBoYXMuY2FsbCh0YXJnZXQsIGtleSk7XG4gICAgICAgIH0gZWxzZSBpZiAoISEocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09IFwicHJvZHVjdGlvblwiKSkge1xuICAgICAgICAgIGNoZWNrSWRlbnRpdHlLZXlzKHRhcmdldCwgaGFzLCBrZXkpO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IG9sZFZhbHVlID0gZ2V0ID8gZ2V0LmNhbGwodGFyZ2V0LCBrZXkpIDogdm9pZCAwO1xuICAgICAgICBjb25zdCByZXN1bHQgPSB0YXJnZXQuZGVsZXRlKGtleSk7XG4gICAgICAgIGlmIChoYWRLZXkpIHtcbiAgICAgICAgICB0cmlnZ2VyKHRhcmdldCwgXCJkZWxldGVcIiwga2V5LCB2b2lkIDAsIG9sZFZhbHVlKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgfSxcbiAgICAgIGNsZWFyKCkge1xuICAgICAgICBjb25zdCB0YXJnZXQgPSB0b1Jhdyh0aGlzKTtcbiAgICAgICAgY29uc3QgaGFkSXRlbXMgPSB0YXJnZXQuc2l6ZSAhPT0gMDtcbiAgICAgICAgY29uc3Qgb2xkVGFyZ2V0ID0gISEocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09IFwicHJvZHVjdGlvblwiKSA/IGlzTWFwKHRhcmdldCkgPyBuZXcgTWFwKHRhcmdldCkgOiBuZXcgU2V0KHRhcmdldCkgOiB2b2lkIDA7XG4gICAgICAgIGNvbnN0IHJlc3VsdCA9IHRhcmdldC5jbGVhcigpO1xuICAgICAgICBpZiAoaGFkSXRlbXMpIHtcbiAgICAgICAgICB0cmlnZ2VyKFxuICAgICAgICAgICAgdGFyZ2V0LFxuICAgICAgICAgICAgXCJjbGVhclwiLFxuICAgICAgICAgICAgdm9pZCAwLFxuICAgICAgICAgICAgdm9pZCAwLFxuICAgICAgICAgICAgb2xkVGFyZ2V0XG4gICAgICAgICAgKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgfVxuICAgIH1cbiAgKTtcbiAgY29uc3QgaXRlcmF0b3JNZXRob2RzID0gW1xuICAgIFwia2V5c1wiLFxuICAgIFwidmFsdWVzXCIsXG4gICAgXCJlbnRyaWVzXCIsXG4gICAgU3ltYm9sLml0ZXJhdG9yXG4gIF07XG4gIGl0ZXJhdG9yTWV0aG9kcy5mb3JFYWNoKChtZXRob2QpID0+IHtcbiAgICBpbnN0cnVtZW50YXRpb25zW21ldGhvZF0gPSBjcmVhdGVJdGVyYWJsZU1ldGhvZChtZXRob2QsIHJlYWRvbmx5LCBzaGFsbG93KTtcbiAgfSk7XG4gIHJldHVybiBpbnN0cnVtZW50YXRpb25zO1xufVxuZnVuY3Rpb24gY3JlYXRlSW5zdHJ1bWVudGF0aW9uR2V0dGVyKGlzUmVhZG9ubHkyLCBzaGFsbG93KSB7XG4gIGNvbnN0IGluc3RydW1lbnRhdGlvbnMgPSBjcmVhdGVJbnN0cnVtZW50YXRpb25zKGlzUmVhZG9ubHkyLCBzaGFsbG93KTtcbiAgcmV0dXJuICh0YXJnZXQsIGtleSwgcmVjZWl2ZXIpID0+IHtcbiAgICBpZiAoa2V5ID09PSBcIl9fdl9pc1JlYWN0aXZlXCIpIHtcbiAgICAgIHJldHVybiAhaXNSZWFkb25seTI7XG4gICAgfSBlbHNlIGlmIChrZXkgPT09IFwiX192X2lzUmVhZG9ubHlcIikge1xuICAgICAgcmV0dXJuIGlzUmVhZG9ubHkyO1xuICAgIH0gZWxzZSBpZiAoa2V5ID09PSBcIl9fdl9yYXdcIikge1xuICAgICAgcmV0dXJuIHRhcmdldDtcbiAgICB9XG4gICAgcmV0dXJuIFJlZmxlY3QuZ2V0KFxuICAgICAgaGFzT3duKGluc3RydW1lbnRhdGlvbnMsIGtleSkgJiYga2V5IGluIHRhcmdldCA/IGluc3RydW1lbnRhdGlvbnMgOiB0YXJnZXQsXG4gICAgICBrZXksXG4gICAgICByZWNlaXZlclxuICAgICk7XG4gIH07XG59XG5jb25zdCBtdXRhYmxlQ29sbGVjdGlvbkhhbmRsZXJzID0ge1xuICBnZXQ6IC8qIEBfX1BVUkVfXyAqLyBjcmVhdGVJbnN0cnVtZW50YXRpb25HZXR0ZXIoZmFsc2UsIGZhbHNlKVxufTtcbmNvbnN0IHNoYWxsb3dDb2xsZWN0aW9uSGFuZGxlcnMgPSB7XG4gIGdldDogLyogQF9fUFVSRV9fICovIGNyZWF0ZUluc3RydW1lbnRhdGlvbkdldHRlcihmYWxzZSwgdHJ1ZSlcbn07XG5jb25zdCByZWFkb25seUNvbGxlY3Rpb25IYW5kbGVycyA9IHtcbiAgZ2V0OiAvKiBAX19QVVJFX18gKi8gY3JlYXRlSW5zdHJ1bWVudGF0aW9uR2V0dGVyKHRydWUsIGZhbHNlKVxufTtcbmNvbnN0IHNoYWxsb3dSZWFkb25seUNvbGxlY3Rpb25IYW5kbGVycyA9IHtcbiAgZ2V0OiAvKiBAX19QVVJFX18gKi8gY3JlYXRlSW5zdHJ1bWVudGF0aW9uR2V0dGVyKHRydWUsIHRydWUpXG59O1xuZnVuY3Rpb24gY2hlY2tJZGVudGl0eUtleXModGFyZ2V0LCBoYXMsIGtleSkge1xuICBjb25zdCByYXdLZXkgPSB0b1JhdyhrZXkpO1xuICBpZiAocmF3S2V5ICE9PSBrZXkgJiYgaGFzLmNhbGwodGFyZ2V0LCByYXdLZXkpKSB7XG4gICAgY29uc3QgdHlwZSA9IHRvUmF3VHlwZSh0YXJnZXQpO1xuICAgIHdhcm4oXG4gICAgICBgUmVhY3RpdmUgJHt0eXBlfSBjb250YWlucyBib3RoIHRoZSByYXcgYW5kIHJlYWN0aXZlIHZlcnNpb25zIG9mIHRoZSBzYW1lIG9iamVjdCR7dHlwZSA9PT0gYE1hcGAgPyBgIGFzIGtleXNgIDogYGB9LCB3aGljaCBjYW4gbGVhZCB0byBpbmNvbnNpc3RlbmNpZXMuIEF2b2lkIGRpZmZlcmVudGlhdGluZyBiZXR3ZWVuIHRoZSByYXcgYW5kIHJlYWN0aXZlIHZlcnNpb25zIG9mIGFuIG9iamVjdCBhbmQgb25seSB1c2UgdGhlIHJlYWN0aXZlIHZlcnNpb24gaWYgcG9zc2libGUuYFxuICAgICk7XG4gIH1cbn1cblxuY29uc3QgcmVhY3RpdmVNYXAgPSAvKiBAX19QVVJFX18gKi8gbmV3IFdlYWtNYXAoKTtcbmNvbnN0IHNoYWxsb3dSZWFjdGl2ZU1hcCA9IC8qIEBfX1BVUkVfXyAqLyBuZXcgV2Vha01hcCgpO1xuY29uc3QgcmVhZG9ubHlNYXAgPSAvKiBAX19QVVJFX18gKi8gbmV3IFdlYWtNYXAoKTtcbmNvbnN0IHNoYWxsb3dSZWFkb25seU1hcCA9IC8qIEBfX1BVUkVfXyAqLyBuZXcgV2Vha01hcCgpO1xuZnVuY3Rpb24gdGFyZ2V0VHlwZU1hcChyYXdUeXBlKSB7XG4gIHN3aXRjaCAocmF3VHlwZSkge1xuICAgIGNhc2UgXCJPYmplY3RcIjpcbiAgICBjYXNlIFwiQXJyYXlcIjpcbiAgICAgIHJldHVybiAxIC8qIENPTU1PTiAqLztcbiAgICBjYXNlIFwiTWFwXCI6XG4gICAgY2FzZSBcIlNldFwiOlxuICAgIGNhc2UgXCJXZWFrTWFwXCI6XG4gICAgY2FzZSBcIldlYWtTZXRcIjpcbiAgICAgIHJldHVybiAyIC8qIENPTExFQ1RJT04gKi87XG4gICAgZGVmYXVsdDpcbiAgICAgIHJldHVybiAwIC8qIElOVkFMSUQgKi87XG4gIH1cbn1cbmZ1bmN0aW9uIGdldFRhcmdldFR5cGUodmFsdWUpIHtcbiAgcmV0dXJuIHZhbHVlW1wiX192X3NraXBcIl0gfHwgIU9iamVjdC5pc0V4dGVuc2libGUodmFsdWUpID8gMCAvKiBJTlZBTElEICovIDogdGFyZ2V0VHlwZU1hcCh0b1Jhd1R5cGUodmFsdWUpKTtcbn1cbi8vIEBfX05PX1NJREVfRUZGRUNUU19fXG5mdW5jdGlvbiByZWFjdGl2ZSh0YXJnZXQpIHtcbiAgaWYgKC8qIEBfX1BVUkVfXyAqLyBpc1JlYWRvbmx5KHRhcmdldCkpIHtcbiAgICByZXR1cm4gdGFyZ2V0O1xuICB9XG4gIHJldHVybiBjcmVhdGVSZWFjdGl2ZU9iamVjdChcbiAgICB0YXJnZXQsXG4gICAgZmFsc2UsXG4gICAgbXV0YWJsZUhhbmRsZXJzLFxuICAgIG11dGFibGVDb2xsZWN0aW9uSGFuZGxlcnMsXG4gICAgcmVhY3RpdmVNYXBcbiAgKTtcbn1cbi8vIEBfX05PX1NJREVfRUZGRUNUU19fXG5mdW5jdGlvbiBzaGFsbG93UmVhY3RpdmUodGFyZ2V0KSB7XG4gIHJldHVybiBjcmVhdGVSZWFjdGl2ZU9iamVjdChcbiAgICB0YXJnZXQsXG4gICAgZmFsc2UsXG4gICAgc2hhbGxvd1JlYWN0aXZlSGFuZGxlcnMsXG4gICAgc2hhbGxvd0NvbGxlY3Rpb25IYW5kbGVycyxcbiAgICBzaGFsbG93UmVhY3RpdmVNYXBcbiAgKTtcbn1cbi8vIEBfX05PX1NJREVfRUZGRUNUU19fXG5mdW5jdGlvbiByZWFkb25seSh0YXJnZXQpIHtcbiAgcmV0dXJuIGNyZWF0ZVJlYWN0aXZlT2JqZWN0KFxuICAgIHRhcmdldCxcbiAgICB0cnVlLFxuICAgIHJlYWRvbmx5SGFuZGxlcnMsXG4gICAgcmVhZG9ubHlDb2xsZWN0aW9uSGFuZGxlcnMsXG4gICAgcmVhZG9ubHlNYXBcbiAgKTtcbn1cbi8vIEBfX05PX1NJREVfRUZGRUNUU19fXG5mdW5jdGlvbiBzaGFsbG93UmVhZG9ubHkodGFyZ2V0KSB7XG4gIHJldHVybiBjcmVhdGVSZWFjdGl2ZU9iamVjdChcbiAgICB0YXJnZXQsXG4gICAgdHJ1ZSxcbiAgICBzaGFsbG93UmVhZG9ubHlIYW5kbGVycyxcbiAgICBzaGFsbG93UmVhZG9ubHlDb2xsZWN0aW9uSGFuZGxlcnMsXG4gICAgc2hhbGxvd1JlYWRvbmx5TWFwXG4gICk7XG59XG5mdW5jdGlvbiBjcmVhdGVSZWFjdGl2ZU9iamVjdCh0YXJnZXQsIGlzUmVhZG9ubHkyLCBiYXNlSGFuZGxlcnMsIGNvbGxlY3Rpb25IYW5kbGVycywgcHJveHlNYXApIHtcbiAgaWYgKCFpc09iamVjdCh0YXJnZXQpKSB7XG4gICAgaWYgKCEhKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSBcInByb2R1Y3Rpb25cIikpIHtcbiAgICAgIHdhcm4oXG4gICAgICAgIGB2YWx1ZSBjYW5ub3QgYmUgbWFkZSAke2lzUmVhZG9ubHkyID8gXCJyZWFkb25seVwiIDogXCJyZWFjdGl2ZVwifTogJHtTdHJpbmcoXG4gICAgICAgICAgdGFyZ2V0XG4gICAgICAgICl9YFxuICAgICAgKTtcbiAgICB9XG4gICAgcmV0dXJuIHRhcmdldDtcbiAgfVxuICBpZiAodGFyZ2V0W1wiX192X3Jhd1wiXSAmJiAhKGlzUmVhZG9ubHkyICYmIHRhcmdldFtcIl9fdl9pc1JlYWN0aXZlXCJdKSkge1xuICAgIHJldHVybiB0YXJnZXQ7XG4gIH1cbiAgY29uc3QgdGFyZ2V0VHlwZSA9IGdldFRhcmdldFR5cGUodGFyZ2V0KTtcbiAgaWYgKHRhcmdldFR5cGUgPT09IDAgLyogSU5WQUxJRCAqLykge1xuICAgIHJldHVybiB0YXJnZXQ7XG4gIH1cbiAgY29uc3QgZXhpc3RpbmdQcm94eSA9IHByb3h5TWFwLmdldCh0YXJnZXQpO1xuICBpZiAoZXhpc3RpbmdQcm94eSkge1xuICAgIHJldHVybiBleGlzdGluZ1Byb3h5O1xuICB9XG4gIGNvbnN0IHByb3h5ID0gbmV3IFByb3h5KFxuICAgIHRhcmdldCxcbiAgICB0YXJnZXRUeXBlID09PSAyIC8qIENPTExFQ1RJT04gKi8gPyBjb2xsZWN0aW9uSGFuZGxlcnMgOiBiYXNlSGFuZGxlcnNcbiAgKTtcbiAgcHJveHlNYXAuc2V0KHRhcmdldCwgcHJveHkpO1xuICByZXR1cm4gcHJveHk7XG59XG4vLyBAX19OT19TSURFX0VGRkVDVFNfX1xuZnVuY3Rpb24gaXNSZWFjdGl2ZSh2YWx1ZSkge1xuICBpZiAoLyogQF9fUFVSRV9fICovIGlzUmVhZG9ubHkodmFsdWUpKSB7XG4gICAgcmV0dXJuIC8qIEBfX1BVUkVfXyAqLyBpc1JlYWN0aXZlKHZhbHVlW1wiX192X3Jhd1wiXSk7XG4gIH1cbiAgcmV0dXJuICEhKHZhbHVlICYmIHZhbHVlW1wiX192X2lzUmVhY3RpdmVcIl0pO1xufVxuLy8gQF9fTk9fU0lERV9FRkZFQ1RTX19cbmZ1bmN0aW9uIGlzUmVhZG9ubHkodmFsdWUpIHtcbiAgcmV0dXJuICEhKHZhbHVlICYmIHZhbHVlW1wiX192X2lzUmVhZG9ubHlcIl0pO1xufVxuLy8gQF9fTk9fU0lERV9FRkZFQ1RTX19cbmZ1bmN0aW9uIGlzU2hhbGxvdyh2YWx1ZSkge1xuICByZXR1cm4gISEodmFsdWUgJiYgdmFsdWVbXCJfX3ZfaXNTaGFsbG93XCJdKTtcbn1cbi8vIEBfX05PX1NJREVfRUZGRUNUU19fXG5mdW5jdGlvbiBpc1Byb3h5KHZhbHVlKSB7XG4gIHJldHVybiB2YWx1ZSA/ICEhdmFsdWVbXCJfX3ZfcmF3XCJdIDogZmFsc2U7XG59XG4vLyBAX19OT19TSURFX0VGRkVDVFNfX1xuZnVuY3Rpb24gdG9SYXcob2JzZXJ2ZWQpIHtcbiAgY29uc3QgcmF3ID0gb2JzZXJ2ZWQgJiYgb2JzZXJ2ZWRbXCJfX3ZfcmF3XCJdO1xuICByZXR1cm4gcmF3ID8gLyogQF9fUFVSRV9fICovIHRvUmF3KHJhdykgOiBvYnNlcnZlZDtcbn1cbmZ1bmN0aW9uIG1hcmtSYXcodmFsdWUpIHtcbiAgaWYgKCFoYXNPd24odmFsdWUsIFwiX192X3NraXBcIikgJiYgT2JqZWN0LmlzRXh0ZW5zaWJsZSh2YWx1ZSkpIHtcbiAgICBkZWYodmFsdWUsIFwiX192X3NraXBcIiwgdHJ1ZSk7XG4gIH1cbiAgcmV0dXJuIHZhbHVlO1xufVxuY29uc3QgdG9SZWFjdGl2ZSA9ICh2YWx1ZSkgPT4gaXNPYmplY3QodmFsdWUpID8gLyogQF9fUFVSRV9fICovIHJlYWN0aXZlKHZhbHVlKSA6IHZhbHVlO1xuY29uc3QgdG9SZWFkb25seSA9ICh2YWx1ZSkgPT4gaXNPYmplY3QodmFsdWUpID8gLyogQF9fUFVSRV9fICovIHJlYWRvbmx5KHZhbHVlKSA6IHZhbHVlO1xuXG4vLyBAX19OT19TSURFX0VGRkVDVFNfX1xuZnVuY3Rpb24gaXNSZWYocikge1xuICByZXR1cm4gciA/IHJbXCJfX3ZfaXNSZWZcIl0gPT09IHRydWUgOiBmYWxzZTtcbn1cbi8vIEBfX05PX1NJREVfRUZGRUNUU19fXG5mdW5jdGlvbiByZWYodmFsdWUpIHtcbiAgcmV0dXJuIGNyZWF0ZVJlZih2YWx1ZSwgZmFsc2UpO1xufVxuLy8gQF9fTk9fU0lERV9FRkZFQ1RTX19cbmZ1bmN0aW9uIHNoYWxsb3dSZWYodmFsdWUpIHtcbiAgcmV0dXJuIGNyZWF0ZVJlZih2YWx1ZSwgdHJ1ZSk7XG59XG5mdW5jdGlvbiBjcmVhdGVSZWYocmF3VmFsdWUsIHNoYWxsb3cpIHtcbiAgaWYgKC8qIEBfX1BVUkVfXyAqLyBpc1JlZihyYXdWYWx1ZSkpIHtcbiAgICByZXR1cm4gcmF3VmFsdWU7XG4gIH1cbiAgcmV0dXJuIG5ldyBSZWZJbXBsKHJhd1ZhbHVlLCBzaGFsbG93KTtcbn1cbmNsYXNzIFJlZkltcGwge1xuICBjb25zdHJ1Y3Rvcih2YWx1ZSwgaXNTaGFsbG93Mikge1xuICAgIHRoaXMuZGVwID0gbmV3IERlcCgpO1xuICAgIHRoaXNbXCJfX3ZfaXNSZWZcIl0gPSB0cnVlO1xuICAgIHRoaXNbXCJfX3ZfaXNTaGFsbG93XCJdID0gZmFsc2U7XG4gICAgdGhpcy5fcmF3VmFsdWUgPSBpc1NoYWxsb3cyID8gdmFsdWUgOiB0b1Jhdyh2YWx1ZSk7XG4gICAgdGhpcy5fdmFsdWUgPSBpc1NoYWxsb3cyID8gdmFsdWUgOiB0b1JlYWN0aXZlKHZhbHVlKTtcbiAgICB0aGlzW1wiX192X2lzU2hhbGxvd1wiXSA9IGlzU2hhbGxvdzI7XG4gIH1cbiAgZ2V0IHZhbHVlKCkge1xuICAgIGlmICghIShwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gXCJwcm9kdWN0aW9uXCIpKSB7XG4gICAgICB0aGlzLmRlcC50cmFjayh7XG4gICAgICAgIHRhcmdldDogdGhpcyxcbiAgICAgICAgdHlwZTogXCJnZXRcIixcbiAgICAgICAga2V5OiBcInZhbHVlXCJcbiAgICAgIH0pO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLmRlcC50cmFjaygpO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5fdmFsdWU7XG4gIH1cbiAgc2V0IHZhbHVlKG5ld1ZhbHVlKSB7XG4gICAgY29uc3Qgb2xkVmFsdWUgPSB0aGlzLl9yYXdWYWx1ZTtcbiAgICBjb25zdCB1c2VEaXJlY3RWYWx1ZSA9IHRoaXNbXCJfX3ZfaXNTaGFsbG93XCJdIHx8IGlzU2hhbGxvdyhuZXdWYWx1ZSkgfHwgaXNSZWFkb25seShuZXdWYWx1ZSk7XG4gICAgbmV3VmFsdWUgPSB1c2VEaXJlY3RWYWx1ZSA/IG5ld1ZhbHVlIDogdG9SYXcobmV3VmFsdWUpO1xuICAgIGlmIChoYXNDaGFuZ2VkKG5ld1ZhbHVlLCBvbGRWYWx1ZSkpIHtcbiAgICAgIHRoaXMuX3Jhd1ZhbHVlID0gbmV3VmFsdWU7XG4gICAgICB0aGlzLl92YWx1ZSA9IHVzZURpcmVjdFZhbHVlID8gbmV3VmFsdWUgOiB0b1JlYWN0aXZlKG5ld1ZhbHVlKTtcbiAgICAgIGlmICghIShwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gXCJwcm9kdWN0aW9uXCIpKSB7XG4gICAgICAgIHRoaXMuZGVwLnRyaWdnZXIoe1xuICAgICAgICAgIHRhcmdldDogdGhpcyxcbiAgICAgICAgICB0eXBlOiBcInNldFwiLFxuICAgICAgICAgIGtleTogXCJ2YWx1ZVwiLFxuICAgICAgICAgIG5ld1ZhbHVlLFxuICAgICAgICAgIG9sZFZhbHVlXG4gICAgICAgIH0pO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5kZXAudHJpZ2dlcigpO1xuICAgICAgfVxuICAgIH1cbiAgfVxufVxuZnVuY3Rpb24gdHJpZ2dlclJlZihyZWYyKSB7XG4gIGlmIChyZWYyLmRlcCkge1xuICAgIGlmICghIShwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gXCJwcm9kdWN0aW9uXCIpKSB7XG4gICAgICByZWYyLmRlcC50cmlnZ2VyKHtcbiAgICAgICAgdGFyZ2V0OiByZWYyLFxuICAgICAgICB0eXBlOiBcInNldFwiLFxuICAgICAgICBrZXk6IFwidmFsdWVcIixcbiAgICAgICAgbmV3VmFsdWU6IHJlZjIuX3ZhbHVlXG4gICAgICB9KTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmVmMi5kZXAudHJpZ2dlcigpO1xuICAgIH1cbiAgfVxufVxuZnVuY3Rpb24gdW5yZWYocmVmMikge1xuICByZXR1cm4gLyogQF9fUFVSRV9fICovIGlzUmVmKHJlZjIpID8gcmVmMi52YWx1ZSA6IHJlZjI7XG59XG5mdW5jdGlvbiB0b1ZhbHVlKHNvdXJjZSkge1xuICByZXR1cm4gaXNGdW5jdGlvbihzb3VyY2UpID8gc291cmNlKCkgOiB1bnJlZihzb3VyY2UpO1xufVxuY29uc3Qgc2hhbGxvd1Vud3JhcEhhbmRsZXJzID0ge1xuICBnZXQ6ICh0YXJnZXQsIGtleSwgcmVjZWl2ZXIpID0+IGtleSA9PT0gXCJfX3ZfcmF3XCIgPyB0YXJnZXQgOiB1bnJlZihSZWZsZWN0LmdldCh0YXJnZXQsIGtleSwgcmVjZWl2ZXIpKSxcbiAgc2V0OiAodGFyZ2V0LCBrZXksIHZhbHVlLCByZWNlaXZlcikgPT4ge1xuICAgIGNvbnN0IG9sZFZhbHVlID0gdGFyZ2V0W2tleV07XG4gICAgaWYgKC8qIEBfX1BVUkVfXyAqLyBpc1JlZihvbGRWYWx1ZSkgJiYgIS8qIEBfX1BVUkVfXyAqLyBpc1JlZih2YWx1ZSkpIHtcbiAgICAgIG9sZFZhbHVlLnZhbHVlID0gdmFsdWU7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIFJlZmxlY3Quc2V0KHRhcmdldCwga2V5LCB2YWx1ZSwgcmVjZWl2ZXIpO1xuICAgIH1cbiAgfVxufTtcbmZ1bmN0aW9uIHByb3h5UmVmcyhvYmplY3RXaXRoUmVmcykge1xuICByZXR1cm4gaXNSZWFjdGl2ZShvYmplY3RXaXRoUmVmcykgPyBvYmplY3RXaXRoUmVmcyA6IG5ldyBQcm94eShvYmplY3RXaXRoUmVmcywgc2hhbGxvd1Vud3JhcEhhbmRsZXJzKTtcbn1cbmNsYXNzIEN1c3RvbVJlZkltcGwge1xuICBjb25zdHJ1Y3RvcihmYWN0b3J5KSB7XG4gICAgdGhpc1tcIl9fdl9pc1JlZlwiXSA9IHRydWU7XG4gICAgdGhpcy5fdmFsdWUgPSB2b2lkIDA7XG4gICAgY29uc3QgZGVwID0gdGhpcy5kZXAgPSBuZXcgRGVwKCk7XG4gICAgY29uc3QgeyBnZXQsIHNldCB9ID0gZmFjdG9yeShkZXAudHJhY2suYmluZChkZXApLCBkZXAudHJpZ2dlci5iaW5kKGRlcCkpO1xuICAgIHRoaXMuX2dldCA9IGdldDtcbiAgICB0aGlzLl9zZXQgPSBzZXQ7XG4gIH1cbiAgZ2V0IHZhbHVlKCkge1xuICAgIHJldHVybiB0aGlzLl92YWx1ZSA9IHRoaXMuX2dldCgpO1xuICB9XG4gIHNldCB2YWx1ZShuZXdWYWwpIHtcbiAgICB0aGlzLl9zZXQobmV3VmFsKTtcbiAgfVxufVxuZnVuY3Rpb24gY3VzdG9tUmVmKGZhY3RvcnkpIHtcbiAgcmV0dXJuIG5ldyBDdXN0b21SZWZJbXBsKGZhY3RvcnkpO1xufVxuLy8gQF9fTk9fU0lERV9FRkZFQ1RTX19cbmZ1bmN0aW9uIHRvUmVmcyhvYmplY3QpIHtcbiAgaWYgKCEhKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSBcInByb2R1Y3Rpb25cIikgJiYgIWlzUHJveHkob2JqZWN0KSkge1xuICAgIHdhcm4oYHRvUmVmcygpIGV4cGVjdHMgYSByZWFjdGl2ZSBvYmplY3QgYnV0IHJlY2VpdmVkIGEgcGxhaW4gb25lLmApO1xuICB9XG4gIGNvbnN0IHJldCA9IGlzQXJyYXkob2JqZWN0KSA/IG5ldyBBcnJheShvYmplY3QubGVuZ3RoKSA6IHt9O1xuICBmb3IgKGNvbnN0IGtleSBpbiBvYmplY3QpIHtcbiAgICByZXRba2V5XSA9IHByb3BlcnR5VG9SZWYob2JqZWN0LCBrZXkpO1xuICB9XG4gIHJldHVybiByZXQ7XG59XG5jbGFzcyBPYmplY3RSZWZJbXBsIHtcbiAgY29uc3RydWN0b3IoX29iamVjdCwgX2tleSwgX2RlZmF1bHRWYWx1ZSkge1xuICAgIHRoaXMuX29iamVjdCA9IF9vYmplY3Q7XG4gICAgdGhpcy5fa2V5ID0gX2tleTtcbiAgICB0aGlzLl9kZWZhdWx0VmFsdWUgPSBfZGVmYXVsdFZhbHVlO1xuICAgIHRoaXNbXCJfX3ZfaXNSZWZcIl0gPSB0cnVlO1xuICAgIHRoaXMuX3ZhbHVlID0gdm9pZCAwO1xuICAgIHRoaXMuX3JhdyA9IHRvUmF3KF9vYmplY3QpO1xuICAgIGxldCBzaGFsbG93ID0gdHJ1ZTtcbiAgICBsZXQgb2JqID0gX29iamVjdDtcbiAgICBpZiAoIWlzQXJyYXkoX29iamVjdCkgfHwgIWlzSW50ZWdlcktleShTdHJpbmcoX2tleSkpKSB7XG4gICAgICBkbyB7XG4gICAgICAgIHNoYWxsb3cgPSAhaXNQcm94eShvYmopIHx8IGlzU2hhbGxvdyhvYmopO1xuICAgICAgfSB3aGlsZSAoc2hhbGxvdyAmJiAob2JqID0gb2JqW1wiX192X3Jhd1wiXSkpO1xuICAgIH1cbiAgICB0aGlzLl9zaGFsbG93ID0gc2hhbGxvdztcbiAgfVxuICBnZXQgdmFsdWUoKSB7XG4gICAgbGV0IHZhbCA9IHRoaXMuX29iamVjdFt0aGlzLl9rZXldO1xuICAgIGlmICh0aGlzLl9zaGFsbG93KSB7XG4gICAgICB2YWwgPSB1bnJlZih2YWwpO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5fdmFsdWUgPSB2YWwgPT09IHZvaWQgMCA/IHRoaXMuX2RlZmF1bHRWYWx1ZSA6IHZhbDtcbiAgfVxuICBzZXQgdmFsdWUobmV3VmFsKSB7XG4gICAgaWYgKHRoaXMuX3NoYWxsb3cgJiYgLyogQF9fUFVSRV9fICovIGlzUmVmKHRoaXMuX3Jhd1t0aGlzLl9rZXldKSkge1xuICAgICAgY29uc3QgbmVzdGVkUmVmID0gdGhpcy5fb2JqZWN0W3RoaXMuX2tleV07XG4gICAgICBpZiAoLyogQF9fUFVSRV9fICovIGlzUmVmKG5lc3RlZFJlZikpIHtcbiAgICAgICAgbmVzdGVkUmVmLnZhbHVlID0gbmV3VmFsO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgfVxuICAgIHRoaXMuX29iamVjdFt0aGlzLl9rZXldID0gbmV3VmFsO1xuICB9XG4gIGdldCBkZXAoKSB7XG4gICAgcmV0dXJuIGdldERlcEZyb21SZWFjdGl2ZSh0aGlzLl9yYXcsIHRoaXMuX2tleSk7XG4gIH1cbn1cbmNsYXNzIEdldHRlclJlZkltcGwge1xuICBjb25zdHJ1Y3RvcihfZ2V0dGVyKSB7XG4gICAgdGhpcy5fZ2V0dGVyID0gX2dldHRlcjtcbiAgICB0aGlzW1wiX192X2lzUmVmXCJdID0gdHJ1ZTtcbiAgICB0aGlzW1wiX192X2lzUmVhZG9ubHlcIl0gPSB0cnVlO1xuICAgIHRoaXMuX3ZhbHVlID0gdm9pZCAwO1xuICB9XG4gIGdldCB2YWx1ZSgpIHtcbiAgICByZXR1cm4gdGhpcy5fdmFsdWUgPSB0aGlzLl9nZXR0ZXIoKTtcbiAgfVxufVxuLy8gQF9fTk9fU0lERV9FRkZFQ1RTX19cbmZ1bmN0aW9uIHRvUmVmKHNvdXJjZSwga2V5LCBkZWZhdWx0VmFsdWUpIHtcbiAgaWYgKC8qIEBfX1BVUkVfXyAqLyBpc1JlZihzb3VyY2UpKSB7XG4gICAgcmV0dXJuIHNvdXJjZTtcbiAgfSBlbHNlIGlmIChpc0Z1bmN0aW9uKHNvdXJjZSkpIHtcbiAgICByZXR1cm4gbmV3IEdldHRlclJlZkltcGwoc291cmNlKTtcbiAgfSBlbHNlIGlmIChpc09iamVjdChzb3VyY2UpICYmIGFyZ3VtZW50cy5sZW5ndGggPiAxKSB7XG4gICAgcmV0dXJuIHByb3BlcnR5VG9SZWYoc291cmNlLCBrZXksIGRlZmF1bHRWYWx1ZSk7XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIC8qIEBfX1BVUkVfXyAqLyByZWYoc291cmNlKTtcbiAgfVxufVxuZnVuY3Rpb24gcHJvcGVydHlUb1JlZihzb3VyY2UsIGtleSwgZGVmYXVsdFZhbHVlKSB7XG4gIHJldHVybiBuZXcgT2JqZWN0UmVmSW1wbChzb3VyY2UsIGtleSwgZGVmYXVsdFZhbHVlKTtcbn1cblxuY2xhc3MgQ29tcHV0ZWRSZWZJbXBsIHtcbiAgY29uc3RydWN0b3IoZm4sIHNldHRlciwgaXNTU1IpIHtcbiAgICB0aGlzLmZuID0gZm47XG4gICAgdGhpcy5zZXR0ZXIgPSBzZXR0ZXI7XG4gICAgLyoqXG4gICAgICogQGludGVybmFsXG4gICAgICovXG4gICAgdGhpcy5fdmFsdWUgPSB2b2lkIDA7XG4gICAgLyoqXG4gICAgICogQGludGVybmFsXG4gICAgICovXG4gICAgdGhpcy5kZXAgPSBuZXcgRGVwKHRoaXMpO1xuICAgIC8qKlxuICAgICAqIEBpbnRlcm5hbFxuICAgICAqL1xuICAgIHRoaXMuX192X2lzUmVmID0gdHJ1ZTtcbiAgICAvLyBUT0RPIGlzb2xhdGVkRGVjbGFyYXRpb25zIFwiX192X2lzUmVhZG9ubHlcIlxuICAgIC8vIEEgY29tcHV0ZWQgaXMgYWxzbyBhIHN1YnNjcmliZXIgdGhhdCB0cmFja3Mgb3RoZXIgZGVwc1xuICAgIC8qKlxuICAgICAqIEBpbnRlcm5hbFxuICAgICAqL1xuICAgIHRoaXMuZGVwcyA9IHZvaWQgMDtcbiAgICAvKipcbiAgICAgKiBAaW50ZXJuYWxcbiAgICAgKi9cbiAgICB0aGlzLmRlcHNUYWlsID0gdm9pZCAwO1xuICAgIC8qKlxuICAgICAqIEBpbnRlcm5hbFxuICAgICAqL1xuICAgIHRoaXMuZmxhZ3MgPSAxNjtcbiAgICAvKipcbiAgICAgKiBAaW50ZXJuYWxcbiAgICAgKi9cbiAgICB0aGlzLmdsb2JhbFZlcnNpb24gPSBnbG9iYWxWZXJzaW9uIC0gMTtcbiAgICAvKipcbiAgICAgKiBAaW50ZXJuYWxcbiAgICAgKi9cbiAgICB0aGlzLm5leHQgPSB2b2lkIDA7XG4gICAgLy8gZm9yIGJhY2t3YXJkcyBjb21wYXRcbiAgICB0aGlzLmVmZmVjdCA9IHRoaXM7XG4gICAgdGhpc1tcIl9fdl9pc1JlYWRvbmx5XCJdID0gIXNldHRlcjtcbiAgICB0aGlzLmlzU1NSID0gaXNTU1I7XG4gIH1cbiAgLyoqXG4gICAqIEBpbnRlcm5hbFxuICAgKi9cbiAgbm90aWZ5KCkge1xuICAgIHRoaXMuZmxhZ3MgfD0gMTY7XG4gICAgaWYgKCEodGhpcy5mbGFncyAmIDgpICYmIC8vIGF2b2lkIGluZmluaXRlIHNlbGYgcmVjdXJzaW9uXG4gICAgYWN0aXZlU3ViICE9PSB0aGlzKSB7XG4gICAgICBiYXRjaCh0aGlzLCB0cnVlKTtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH0gZWxzZSBpZiAoISEocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09IFwicHJvZHVjdGlvblwiKSkgO1xuICB9XG4gIGdldCB2YWx1ZSgpIHtcbiAgICBjb25zdCBsaW5rID0gISEocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09IFwicHJvZHVjdGlvblwiKSA/IHRoaXMuZGVwLnRyYWNrKHtcbiAgICAgIHRhcmdldDogdGhpcyxcbiAgICAgIHR5cGU6IFwiZ2V0XCIsXG4gICAgICBrZXk6IFwidmFsdWVcIlxuICAgIH0pIDogdGhpcy5kZXAudHJhY2soKTtcbiAgICByZWZyZXNoQ29tcHV0ZWQodGhpcyk7XG4gICAgaWYgKGxpbmspIHtcbiAgICAgIGxpbmsudmVyc2lvbiA9IHRoaXMuZGVwLnZlcnNpb247XG4gICAgfVxuICAgIHJldHVybiB0aGlzLl92YWx1ZTtcbiAgfVxuICBzZXQgdmFsdWUobmV3VmFsdWUpIHtcbiAgICBpZiAodGhpcy5zZXR0ZXIpIHtcbiAgICAgIHRoaXMuc2V0dGVyKG5ld1ZhbHVlKTtcbiAgICB9IGVsc2UgaWYgKCEhKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSBcInByb2R1Y3Rpb25cIikpIHtcbiAgICAgIHdhcm4oXCJXcml0ZSBvcGVyYXRpb24gZmFpbGVkOiBjb21wdXRlZCB2YWx1ZSBpcyByZWFkb25seVwiKTtcbiAgICB9XG4gIH1cbn1cbi8vIEBfX05PX1NJREVfRUZGRUNUU19fXG5mdW5jdGlvbiBjb21wdXRlZChnZXR0ZXJPck9wdGlvbnMsIGRlYnVnT3B0aW9ucywgaXNTU1IgPSBmYWxzZSkge1xuICBsZXQgZ2V0dGVyO1xuICBsZXQgc2V0dGVyO1xuICBpZiAoaXNGdW5jdGlvbihnZXR0ZXJPck9wdGlvbnMpKSB7XG4gICAgZ2V0dGVyID0gZ2V0dGVyT3JPcHRpb25zO1xuICB9IGVsc2Uge1xuICAgIGdldHRlciA9IGdldHRlck9yT3B0aW9ucy5nZXQ7XG4gICAgc2V0dGVyID0gZ2V0dGVyT3JPcHRpb25zLnNldDtcbiAgfVxuICBjb25zdCBjUmVmID0gbmV3IENvbXB1dGVkUmVmSW1wbChnZXR0ZXIsIHNldHRlciwgaXNTU1IpO1xuICBpZiAoISEocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09IFwicHJvZHVjdGlvblwiKSAmJiBkZWJ1Z09wdGlvbnMgJiYgIWlzU1NSKSB7XG4gICAgY1JlZi5vblRyYWNrID0gZGVidWdPcHRpb25zLm9uVHJhY2s7XG4gICAgY1JlZi5vblRyaWdnZXIgPSBkZWJ1Z09wdGlvbnMub25UcmlnZ2VyO1xuICB9XG4gIHJldHVybiBjUmVmO1xufVxuXG5jb25zdCBUcmFja09wVHlwZXMgPSB7XG4gIFwiR0VUXCI6IFwiZ2V0XCIsXG4gIFwiSEFTXCI6IFwiaGFzXCIsXG4gIFwiSVRFUkFURVwiOiBcIml0ZXJhdGVcIlxufTtcbmNvbnN0IFRyaWdnZXJPcFR5cGVzID0ge1xuICBcIlNFVFwiOiBcInNldFwiLFxuICBcIkFERFwiOiBcImFkZFwiLFxuICBcIkRFTEVURVwiOiBcImRlbGV0ZVwiLFxuICBcIkNMRUFSXCI6IFwiY2xlYXJcIlxufTtcbmNvbnN0IFJlYWN0aXZlRmxhZ3MgPSB7XG4gIFwiU0tJUFwiOiBcIl9fdl9za2lwXCIsXG4gIFwiSVNfUkVBQ1RJVkVcIjogXCJfX3ZfaXNSZWFjdGl2ZVwiLFxuICBcIklTX1JFQURPTkxZXCI6IFwiX192X2lzUmVhZG9ubHlcIixcbiAgXCJJU19TSEFMTE9XXCI6IFwiX192X2lzU2hhbGxvd1wiLFxuICBcIlJBV1wiOiBcIl9fdl9yYXdcIixcbiAgXCJJU19SRUZcIjogXCJfX3ZfaXNSZWZcIlxufTtcblxuY29uc3QgV2F0Y2hFcnJvckNvZGVzID0ge1xuICBcIldBVENIX0dFVFRFUlwiOiAyLFxuICBcIjJcIjogXCJXQVRDSF9HRVRURVJcIixcbiAgXCJXQVRDSF9DQUxMQkFDS1wiOiAzLFxuICBcIjNcIjogXCJXQVRDSF9DQUxMQkFDS1wiLFxuICBcIldBVENIX0NMRUFOVVBcIjogNCxcbiAgXCI0XCI6IFwiV0FUQ0hfQ0xFQU5VUFwiXG59O1xuY29uc3QgSU5JVElBTF9XQVRDSEVSX1ZBTFVFID0ge307XG5jb25zdCBjbGVhbnVwTWFwID0gLyogQF9fUFVSRV9fICovIG5ldyBXZWFrTWFwKCk7XG5sZXQgYWN0aXZlV2F0Y2hlciA9IHZvaWQgMDtcbmZ1bmN0aW9uIGdldEN1cnJlbnRXYXRjaGVyKCkge1xuICByZXR1cm4gYWN0aXZlV2F0Y2hlcjtcbn1cbmZ1bmN0aW9uIG9uV2F0Y2hlckNsZWFudXAoY2xlYW51cEZuLCBmYWlsU2lsZW50bHkgPSBmYWxzZSwgb3duZXIgPSBhY3RpdmVXYXRjaGVyKSB7XG4gIGlmIChvd25lcikge1xuICAgIGxldCBjbGVhbnVwcyA9IGNsZWFudXBNYXAuZ2V0KG93bmVyKTtcbiAgICBpZiAoIWNsZWFudXBzKSBjbGVhbnVwTWFwLnNldChvd25lciwgY2xlYW51cHMgPSBbXSk7XG4gICAgY2xlYW51cHMucHVzaChjbGVhbnVwRm4pO1xuICB9IGVsc2UgaWYgKCEhKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSBcInByb2R1Y3Rpb25cIikgJiYgIWZhaWxTaWxlbnRseSkge1xuICAgIHdhcm4oXG4gICAgICBgb25XYXRjaGVyQ2xlYW51cCgpIHdhcyBjYWxsZWQgd2hlbiB0aGVyZSB3YXMgbm8gYWN0aXZlIHdhdGNoZXIgdG8gYXNzb2NpYXRlIHdpdGguYFxuICAgICk7XG4gIH1cbn1cbmZ1bmN0aW9uIHdhdGNoKHNvdXJjZSwgY2IsIG9wdGlvbnMgPSBFTVBUWV9PQkopIHtcbiAgY29uc3QgeyBpbW1lZGlhdGUsIGRlZXAsIG9uY2UsIHNjaGVkdWxlciwgYXVnbWVudEpvYiwgY2FsbCB9ID0gb3B0aW9ucztcbiAgY29uc3Qgd2FybkludmFsaWRTb3VyY2UgPSAocykgPT4ge1xuICAgIChvcHRpb25zLm9uV2FybiB8fCB3YXJuKShcbiAgICAgIGBJbnZhbGlkIHdhdGNoIHNvdXJjZTogYCxcbiAgICAgIHMsXG4gICAgICBgQSB3YXRjaCBzb3VyY2UgY2FuIG9ubHkgYmUgYSBnZXR0ZXIvZWZmZWN0IGZ1bmN0aW9uLCBhIHJlZiwgYSByZWFjdGl2ZSBvYmplY3QsIG9yIGFuIGFycmF5IG9mIHRoZXNlIHR5cGVzLmBcbiAgICApO1xuICB9O1xuICBjb25zdCByZWFjdGl2ZUdldHRlciA9IChzb3VyY2UyKSA9PiB7XG4gICAgaWYgKGRlZXApIHJldHVybiBzb3VyY2UyO1xuICAgIGlmIChpc1NoYWxsb3coc291cmNlMikgfHwgZGVlcCA9PT0gZmFsc2UgfHwgZGVlcCA9PT0gMClcbiAgICAgIHJldHVybiB0cmF2ZXJzZShzb3VyY2UyLCAxKTtcbiAgICByZXR1cm4gdHJhdmVyc2Uoc291cmNlMik7XG4gIH07XG4gIGxldCBlZmZlY3Q7XG4gIGxldCBnZXR0ZXI7XG4gIGxldCBjbGVhbnVwO1xuICBsZXQgYm91bmRDbGVhbnVwO1xuICBsZXQgZm9yY2VUcmlnZ2VyID0gZmFsc2U7XG4gIGxldCBpc011bHRpU291cmNlID0gZmFsc2U7XG4gIGlmIChpc1JlZihzb3VyY2UpKSB7XG4gICAgZ2V0dGVyID0gKCkgPT4gc291cmNlLnZhbHVlO1xuICAgIGZvcmNlVHJpZ2dlciA9IGlzU2hhbGxvdyhzb3VyY2UpO1xuICB9IGVsc2UgaWYgKGlzUmVhY3RpdmUoc291cmNlKSkge1xuICAgIGdldHRlciA9ICgpID0+IHJlYWN0aXZlR2V0dGVyKHNvdXJjZSk7XG4gICAgZm9yY2VUcmlnZ2VyID0gdHJ1ZTtcbiAgfSBlbHNlIGlmIChpc0FycmF5KHNvdXJjZSkpIHtcbiAgICBpc011bHRpU291cmNlID0gdHJ1ZTtcbiAgICBmb3JjZVRyaWdnZXIgPSBzb3VyY2Uuc29tZSgocykgPT4gaXNSZWFjdGl2ZShzKSB8fCBpc1NoYWxsb3cocykpO1xuICAgIGdldHRlciA9ICgpID0+IHNvdXJjZS5tYXAoKHMpID0+IHtcbiAgICAgIGlmIChpc1JlZihzKSkge1xuICAgICAgICByZXR1cm4gcy52YWx1ZTtcbiAgICAgIH0gZWxzZSBpZiAoaXNSZWFjdGl2ZShzKSkge1xuICAgICAgICByZXR1cm4gcmVhY3RpdmVHZXR0ZXIocyk7XG4gICAgICB9IGVsc2UgaWYgKGlzRnVuY3Rpb24ocykpIHtcbiAgICAgICAgcmV0dXJuIGNhbGwgPyBjYWxsKHMsIDIpIDogcygpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgISEocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09IFwicHJvZHVjdGlvblwiKSAmJiB3YXJuSW52YWxpZFNvdXJjZShzKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfSBlbHNlIGlmIChpc0Z1bmN0aW9uKHNvdXJjZSkpIHtcbiAgICBpZiAoY2IpIHtcbiAgICAgIGdldHRlciA9IGNhbGwgPyAoKSA9PiBjYWxsKHNvdXJjZSwgMikgOiBzb3VyY2U7XG4gICAgfSBlbHNlIHtcbiAgICAgIGdldHRlciA9ICgpID0+IHtcbiAgICAgICAgaWYgKGNsZWFudXApIHtcbiAgICAgICAgICBwYXVzZVRyYWNraW5nKCk7XG4gICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNsZWFudXAoKTtcbiAgICAgICAgICB9IGZpbmFsbHkge1xuICAgICAgICAgICAgcmVzZXRUcmFja2luZygpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBjb25zdCBjdXJyZW50RWZmZWN0ID0gYWN0aXZlV2F0Y2hlcjtcbiAgICAgICAgYWN0aXZlV2F0Y2hlciA9IGVmZmVjdDtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICByZXR1cm4gY2FsbCA/IGNhbGwoc291cmNlLCAzLCBbYm91bmRDbGVhbnVwXSkgOiBzb3VyY2UoYm91bmRDbGVhbnVwKTtcbiAgICAgICAgfSBmaW5hbGx5IHtcbiAgICAgICAgICBhY3RpdmVXYXRjaGVyID0gY3VycmVudEVmZmVjdDtcbiAgICAgICAgfVxuICAgICAgfTtcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgZ2V0dGVyID0gTk9PUDtcbiAgICAhIShwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gXCJwcm9kdWN0aW9uXCIpICYmIHdhcm5JbnZhbGlkU291cmNlKHNvdXJjZSk7XG4gIH1cbiAgaWYgKGNiICYmIGRlZXApIHtcbiAgICBjb25zdCBiYXNlR2V0dGVyID0gZ2V0dGVyO1xuICAgIGNvbnN0IGRlcHRoID0gZGVlcCA9PT0gdHJ1ZSA/IEluZmluaXR5IDogZGVlcDtcbiAgICBnZXR0ZXIgPSAoKSA9PiB0cmF2ZXJzZShiYXNlR2V0dGVyKCksIGRlcHRoKTtcbiAgfVxuICBjb25zdCBzY29wZSA9IGdldEN1cnJlbnRTY29wZSgpO1xuICBjb25zdCB3YXRjaEhhbmRsZSA9ICgpID0+IHtcbiAgICBlZmZlY3Quc3RvcCgpO1xuICAgIGlmIChzY29wZSAmJiBzY29wZS5hY3RpdmUpIHtcbiAgICAgIHJlbW92ZShzY29wZS5lZmZlY3RzLCBlZmZlY3QpO1xuICAgIH1cbiAgfTtcbiAgaWYgKG9uY2UgJiYgY2IpIHtcbiAgICBjb25zdCBfY2IgPSBjYjtcbiAgICBjYiA9ICguLi5hcmdzKSA9PiB7XG4gICAgICBfY2IoLi4uYXJncyk7XG4gICAgICB3YXRjaEhhbmRsZSgpO1xuICAgIH07XG4gIH1cbiAgbGV0IG9sZFZhbHVlID0gaXNNdWx0aVNvdXJjZSA/IG5ldyBBcnJheShzb3VyY2UubGVuZ3RoKS5maWxsKElOSVRJQUxfV0FUQ0hFUl9WQUxVRSkgOiBJTklUSUFMX1dBVENIRVJfVkFMVUU7XG4gIGNvbnN0IGpvYiA9IChpbW1lZGlhdGVGaXJzdFJ1bikgPT4ge1xuICAgIGlmICghKGVmZmVjdC5mbGFncyAmIDEpIHx8ICFlZmZlY3QuZGlydHkgJiYgIWltbWVkaWF0ZUZpcnN0UnVuKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGlmIChjYikge1xuICAgICAgY29uc3QgbmV3VmFsdWUgPSBlZmZlY3QucnVuKCk7XG4gICAgICBpZiAoZGVlcCB8fCBmb3JjZVRyaWdnZXIgfHwgKGlzTXVsdGlTb3VyY2UgPyBuZXdWYWx1ZS5zb21lKCh2LCBpKSA9PiBoYXNDaGFuZ2VkKHYsIG9sZFZhbHVlW2ldKSkgOiBoYXNDaGFuZ2VkKG5ld1ZhbHVlLCBvbGRWYWx1ZSkpKSB7XG4gICAgICAgIGlmIChjbGVhbnVwKSB7XG4gICAgICAgICAgY2xlYW51cCgpO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGN1cnJlbnRXYXRjaGVyID0gYWN0aXZlV2F0Y2hlcjtcbiAgICAgICAgYWN0aXZlV2F0Y2hlciA9IGVmZmVjdDtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICBjb25zdCBhcmdzID0gW1xuICAgICAgICAgICAgbmV3VmFsdWUsXG4gICAgICAgICAgICAvLyBwYXNzIHVuZGVmaW5lZCBhcyB0aGUgb2xkIHZhbHVlIHdoZW4gaXQncyBjaGFuZ2VkIGZvciB0aGUgZmlyc3QgdGltZVxuICAgICAgICAgICAgb2xkVmFsdWUgPT09IElOSVRJQUxfV0FUQ0hFUl9WQUxVRSA/IHZvaWQgMCA6IGlzTXVsdGlTb3VyY2UgJiYgb2xkVmFsdWVbMF0gPT09IElOSVRJQUxfV0FUQ0hFUl9WQUxVRSA/IFtdIDogb2xkVmFsdWUsXG4gICAgICAgICAgICBib3VuZENsZWFudXBcbiAgICAgICAgICBdO1xuICAgICAgICAgIG9sZFZhbHVlID0gbmV3VmFsdWU7XG4gICAgICAgICAgY2FsbCA/IGNhbGwoY2IsIDMsIGFyZ3MpIDogKFxuICAgICAgICAgICAgLy8gQHRzLWV4cGVjdC1lcnJvclxuICAgICAgICAgICAgY2IoLi4uYXJncylcbiAgICAgICAgICApO1xuICAgICAgICB9IGZpbmFsbHkge1xuICAgICAgICAgIGFjdGl2ZVdhdGNoZXIgPSBjdXJyZW50V2F0Y2hlcjtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBlZmZlY3QucnVuKCk7XG4gICAgfVxuICB9O1xuICBpZiAoYXVnbWVudEpvYikge1xuICAgIGF1Z21lbnRKb2Ioam9iKTtcbiAgfVxuICBlZmZlY3QgPSBuZXcgUmVhY3RpdmVFZmZlY3QoZ2V0dGVyKTtcbiAgZWZmZWN0LnNjaGVkdWxlciA9IHNjaGVkdWxlciA/ICgpID0+IHNjaGVkdWxlcihqb2IsIGZhbHNlKSA6IGpvYjtcbiAgYm91bmRDbGVhbnVwID0gKGZuKSA9PiBvbldhdGNoZXJDbGVhbnVwKGZuLCBmYWxzZSwgZWZmZWN0KTtcbiAgY2xlYW51cCA9IGVmZmVjdC5vblN0b3AgPSAoKSA9PiB7XG4gICAgY29uc3QgY2xlYW51cHMgPSBjbGVhbnVwTWFwLmdldChlZmZlY3QpO1xuICAgIGlmIChjbGVhbnVwcykge1xuICAgICAgaWYgKGNhbGwpIHtcbiAgICAgICAgY2FsbChjbGVhbnVwcywgNCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBmb3IgKGNvbnN0IGNsZWFudXAyIG9mIGNsZWFudXBzKSBjbGVhbnVwMigpO1xuICAgICAgfVxuICAgICAgY2xlYW51cE1hcC5kZWxldGUoZWZmZWN0KTtcbiAgICB9XG4gIH07XG4gIGlmICghIShwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gXCJwcm9kdWN0aW9uXCIpKSB7XG4gICAgZWZmZWN0Lm9uVHJhY2sgPSBvcHRpb25zLm9uVHJhY2s7XG4gICAgZWZmZWN0Lm9uVHJpZ2dlciA9IG9wdGlvbnMub25UcmlnZ2VyO1xuICB9XG4gIGlmIChjYikge1xuICAgIGlmIChpbW1lZGlhdGUpIHtcbiAgICAgIGpvYih0cnVlKTtcbiAgICB9IGVsc2Uge1xuICAgICAgb2xkVmFsdWUgPSBlZmZlY3QucnVuKCk7XG4gICAgfVxuICB9IGVsc2UgaWYgKHNjaGVkdWxlcikge1xuICAgIHNjaGVkdWxlcihqb2IuYmluZChudWxsLCB0cnVlKSwgdHJ1ZSk7XG4gIH0gZWxzZSB7XG4gICAgZWZmZWN0LnJ1bigpO1xuICB9XG4gIHdhdGNoSGFuZGxlLnBhdXNlID0gZWZmZWN0LnBhdXNlLmJpbmQoZWZmZWN0KTtcbiAgd2F0Y2hIYW5kbGUucmVzdW1lID0gZWZmZWN0LnJlc3VtZS5iaW5kKGVmZmVjdCk7XG4gIHdhdGNoSGFuZGxlLnN0b3AgPSB3YXRjaEhhbmRsZTtcbiAgcmV0dXJuIHdhdGNoSGFuZGxlO1xufVxuZnVuY3Rpb24gdHJhdmVyc2UodmFsdWUsIGRlcHRoID0gSW5maW5pdHksIHNlZW4pIHtcbiAgaWYgKGRlcHRoIDw9IDAgfHwgIWlzT2JqZWN0KHZhbHVlKSB8fCB2YWx1ZVtcIl9fdl9za2lwXCJdKSB7XG4gICAgcmV0dXJuIHZhbHVlO1xuICB9XG4gIHNlZW4gPSBzZWVuIHx8IC8qIEBfX1BVUkVfXyAqLyBuZXcgTWFwKCk7XG4gIGlmICgoc2Vlbi5nZXQodmFsdWUpIHx8IDApID49IGRlcHRoKSB7XG4gICAgcmV0dXJuIHZhbHVlO1xuICB9XG4gIHNlZW4uc2V0KHZhbHVlLCBkZXB0aCk7XG4gIGRlcHRoLS07XG4gIGlmIChpc1JlZih2YWx1ZSkpIHtcbiAgICB0cmF2ZXJzZSh2YWx1ZS52YWx1ZSwgZGVwdGgsIHNlZW4pO1xuICB9IGVsc2UgaWYgKGlzQXJyYXkodmFsdWUpKSB7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCB2YWx1ZS5sZW5ndGg7IGkrKykge1xuICAgICAgdHJhdmVyc2UodmFsdWVbaV0sIGRlcHRoLCBzZWVuKTtcbiAgICB9XG4gIH0gZWxzZSBpZiAoaXNTZXQodmFsdWUpIHx8IGlzTWFwKHZhbHVlKSkge1xuICAgIHZhbHVlLmZvckVhY2goKHYpID0+IHtcbiAgICAgIHRyYXZlcnNlKHYsIGRlcHRoLCBzZWVuKTtcbiAgICB9KTtcbiAgfSBlbHNlIGlmIChpc1BsYWluT2JqZWN0KHZhbHVlKSkge1xuICAgIGZvciAoY29uc3Qga2V5IGluIHZhbHVlKSB7XG4gICAgICB0cmF2ZXJzZSh2YWx1ZVtrZXldLCBkZXB0aCwgc2Vlbik7XG4gICAgfVxuICAgIGZvciAoY29uc3Qga2V5IG9mIE9iamVjdC5nZXRPd25Qcm9wZXJ0eVN5bWJvbHModmFsdWUpKSB7XG4gICAgICBpZiAoT2JqZWN0LnByb3RvdHlwZS5wcm9wZXJ0eUlzRW51bWVyYWJsZS5jYWxsKHZhbHVlLCBrZXkpKSB7XG4gICAgICAgIHRyYXZlcnNlKHZhbHVlW2tleV0sIGRlcHRoLCBzZWVuKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgcmV0dXJuIHZhbHVlO1xufVxuXG5leHBvcnQgeyBBUlJBWV9JVEVSQVRFX0tFWSwgRWZmZWN0RmxhZ3MsIEVmZmVjdFNjb3BlLCBJVEVSQVRFX0tFWSwgTUFQX0tFWV9JVEVSQVRFX0tFWSwgUmVhY3RpdmVFZmZlY3QsIFJlYWN0aXZlRmxhZ3MsIFRyYWNrT3BUeXBlcywgVHJpZ2dlck9wVHlwZXMsIFdhdGNoRXJyb3JDb2RlcywgY29tcHV0ZWQsIGN1c3RvbVJlZiwgZWZmZWN0LCBlZmZlY3RTY29wZSwgZW5hYmxlVHJhY2tpbmcsIGdldEN1cnJlbnRTY29wZSwgZ2V0Q3VycmVudFdhdGNoZXIsIGlzUHJveHksIGlzUmVhY3RpdmUsIGlzUmVhZG9ubHksIGlzUmVmLCBpc1NoYWxsb3csIG1hcmtSYXcsIG9uRWZmZWN0Q2xlYW51cCwgb25TY29wZURpc3Bvc2UsIG9uV2F0Y2hlckNsZWFudXAsIHBhdXNlVHJhY2tpbmcsIHByb3h5UmVmcywgcmVhY3RpdmUsIHJlYWN0aXZlUmVhZEFycmF5LCByZWFkb25seSwgcmVmLCByZXNldFRyYWNraW5nLCBzaGFsbG93UmVhY3RpdmUsIHNoYWxsb3dSZWFkQXJyYXksIHNoYWxsb3dSZWFkb25seSwgc2hhbGxvd1JlZiwgc3RvcCwgdG9SYXcsIHRvUmVhY3RpdmUsIHRvUmVhZG9ubHksIHRvUmVmLCB0b1JlZnMsIHRvVmFsdWUsIHRyYWNrLCB0cmF2ZXJzZSwgdHJpZ2dlciwgdHJpZ2dlclJlZiwgdW5yZWYsIHdhdGNoIH07XG4iLCIvKipcbiogQHZ1ZS9ydW50aW1lLWNvcmUgdjMuNS4yOFxuKiAoYykgMjAxOC1wcmVzZW50IFl1eGkgKEV2YW4pIFlvdSBhbmQgVnVlIGNvbnRyaWJ1dG9yc1xuKiBAbGljZW5zZSBNSVRcbioqL1xuaW1wb3J0IHsgcGF1c2VUcmFja2luZywgcmVzZXRUcmFja2luZywgaXNSZWYsIHRvUmF3LCB0cmF2ZXJzZSwgd2F0Y2ggYXMgd2F0Y2gkMSwgc2hhbGxvd1JlZiwgcmVhZG9ubHksIGlzUmVhY3RpdmUsIHJlZiwgaXNTaGFsbG93LCBpc1JlYWRvbmx5LCBzaGFsbG93UmVhZEFycmF5LCB0b1JlYWRvbmx5LCB0b1JlYWN0aXZlLCBzaGFsbG93UmVhZG9ubHksIHRyYWNrLCByZWFjdGl2ZSwgY3VzdG9tUmVmLCBzaGFsbG93UmVhY3RpdmUsIHRyaWdnZXIsIFJlYWN0aXZlRWZmZWN0LCBpc1Byb3h5LCBwcm94eVJlZnMsIG1hcmtSYXcsIEVmZmVjdFNjb3BlLCBjb21wdXRlZCBhcyBjb21wdXRlZCQxIH0gZnJvbSAnQHZ1ZS9yZWFjdGl2aXR5JztcbmV4cG9ydCB7IEVmZmVjdFNjb3BlLCBSZWFjdGl2ZUVmZmVjdCwgVHJhY2tPcFR5cGVzLCBUcmlnZ2VyT3BUeXBlcywgY3VzdG9tUmVmLCBlZmZlY3QsIGVmZmVjdFNjb3BlLCBnZXRDdXJyZW50U2NvcGUsIGdldEN1cnJlbnRXYXRjaGVyLCBpc1Byb3h5LCBpc1JlYWN0aXZlLCBpc1JlYWRvbmx5LCBpc1JlZiwgaXNTaGFsbG93LCBtYXJrUmF3LCBvblNjb3BlRGlzcG9zZSwgb25XYXRjaGVyQ2xlYW51cCwgcHJveHlSZWZzLCByZWFjdGl2ZSwgcmVhZG9ubHksIHJlZiwgc2hhbGxvd1JlYWN0aXZlLCBzaGFsbG93UmVhZG9ubHksIHNoYWxsb3dSZWYsIHN0b3AsIHRvUmF3LCB0b1JlZiwgdG9SZWZzLCB0b1ZhbHVlLCB0cmlnZ2VyUmVmLCB1bnJlZiB9IGZyb20gJ0B2dWUvcmVhY3Rpdml0eSc7XG5pbXBvcnQgeyBpc1N0cmluZywgaXNGdW5jdGlvbiwgRU1QVFlfT0JKLCBpc1Byb21pc2UsIGlzQXJyYXksIE5PT1AsIGdldEdsb2JhbFRoaXMsIGV4dGVuZCwgaXNCdWlsdEluRGlyZWN0aXZlLCBOTywgaGFzT3duLCByZW1vdmUsIGRlZiwgaXNPbiwgaXNSZXNlcnZlZFByb3AsIG5vcm1hbGl6ZUNsYXNzLCBzdHJpbmdpZnlTdHlsZSwgbm9ybWFsaXplU3R5bGUsIGlzS25vd25TdmdBdHRyLCBpc0Jvb2xlYW5BdHRyLCBpc0tub3duSHRtbEF0dHIsIGluY2x1ZGVCb29sZWFuQXR0ciwgaXNSZW5kZXJhYmxlQXR0clZhbHVlLCBub3JtYWxpemVDc3NWYXJWYWx1ZSwgZ2V0RXNjYXBlZENzc1Zhck5hbWUsIGlzT2JqZWN0LCBpc1JlZ0V4cCwgaW52b2tlQXJyYXlGbnMsIHRvSGFuZGxlcktleSwgY2FtZWxpemUsIGNhcGl0YWxpemUsIGlzU3ltYm9sLCBpc0dsb2JhbGx5QWxsb3dlZCwgaHlwaGVuYXRlLCBoYXNDaGFuZ2VkLCBsb29zZVRvTnVtYmVyLCBpc01vZGVsTGlzdGVuZXIsIGxvb3NlRXF1YWwsIEVNUFRZX0FSUiwgdG9SYXdUeXBlLCBtYWtlTWFwLCB0b051bWJlciB9IGZyb20gJ0B2dWUvc2hhcmVkJztcbmV4cG9ydCB7IGNhbWVsaXplLCBjYXBpdGFsaXplLCBub3JtYWxpemVDbGFzcywgbm9ybWFsaXplUHJvcHMsIG5vcm1hbGl6ZVN0eWxlLCB0b0Rpc3BsYXlTdHJpbmcsIHRvSGFuZGxlcktleSB9IGZyb20gJ0B2dWUvc2hhcmVkJztcblxuY29uc3Qgc3RhY2sgPSBbXTtcbmZ1bmN0aW9uIHB1c2hXYXJuaW5nQ29udGV4dCh2bm9kZSkge1xuICBzdGFjay5wdXNoKHZub2RlKTtcbn1cbmZ1bmN0aW9uIHBvcFdhcm5pbmdDb250ZXh0KCkge1xuICBzdGFjay5wb3AoKTtcbn1cbmxldCBpc1dhcm5pbmcgPSBmYWxzZTtcbmZ1bmN0aW9uIHdhcm4kMShtc2csIC4uLmFyZ3MpIHtcbiAgaWYgKGlzV2FybmluZykgcmV0dXJuO1xuICBpc1dhcm5pbmcgPSB0cnVlO1xuICBwYXVzZVRyYWNraW5nKCk7XG4gIGNvbnN0IGluc3RhbmNlID0gc3RhY2subGVuZ3RoID8gc3RhY2tbc3RhY2subGVuZ3RoIC0gMV0uY29tcG9uZW50IDogbnVsbDtcbiAgY29uc3QgYXBwV2FybkhhbmRsZXIgPSBpbnN0YW5jZSAmJiBpbnN0YW5jZS5hcHBDb250ZXh0LmNvbmZpZy53YXJuSGFuZGxlcjtcbiAgY29uc3QgdHJhY2UgPSBnZXRDb21wb25lbnRUcmFjZSgpO1xuICBpZiAoYXBwV2FybkhhbmRsZXIpIHtcbiAgICBjYWxsV2l0aEVycm9ySGFuZGxpbmcoXG4gICAgICBhcHBXYXJuSGFuZGxlcixcbiAgICAgIGluc3RhbmNlLFxuICAgICAgMTEsXG4gICAgICBbXG4gICAgICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby1yZXN0cmljdGVkLXN5bnRheFxuICAgICAgICBtc2cgKyBhcmdzLm1hcCgoYSkgPT4ge1xuICAgICAgICAgIHZhciBfYSwgX2I7XG4gICAgICAgICAgcmV0dXJuIChfYiA9IChfYSA9IGEudG9TdHJpbmcpID09IG51bGwgPyB2b2lkIDAgOiBfYS5jYWxsKGEpKSAhPSBudWxsID8gX2IgOiBKU09OLnN0cmluZ2lmeShhKTtcbiAgICAgICAgfSkuam9pbihcIlwiKSxcbiAgICAgICAgaW5zdGFuY2UgJiYgaW5zdGFuY2UucHJveHksXG4gICAgICAgIHRyYWNlLm1hcChcbiAgICAgICAgICAoeyB2bm9kZSB9KSA9PiBgYXQgPCR7Zm9ybWF0Q29tcG9uZW50TmFtZShpbnN0YW5jZSwgdm5vZGUudHlwZSl9PmBcbiAgICAgICAgKS5qb2luKFwiXFxuXCIpLFxuICAgICAgICB0cmFjZVxuICAgICAgXVxuICAgICk7XG4gIH0gZWxzZSB7XG4gICAgY29uc3Qgd2FybkFyZ3MgPSBbYFtWdWUgd2Fybl06ICR7bXNnfWAsIC4uLmFyZ3NdO1xuICAgIGlmICh0cmFjZS5sZW5ndGggJiYgLy8gYXZvaWQgc3BhbW1pbmcgY29uc29sZSBkdXJpbmcgdGVzdHNcbiAgICB0cnVlKSB7XG4gICAgICB3YXJuQXJncy5wdXNoKGBcbmAsIC4uLmZvcm1hdFRyYWNlKHRyYWNlKSk7XG4gICAgfVxuICAgIGNvbnNvbGUud2FybiguLi53YXJuQXJncyk7XG4gIH1cbiAgcmVzZXRUcmFja2luZygpO1xuICBpc1dhcm5pbmcgPSBmYWxzZTtcbn1cbmZ1bmN0aW9uIGdldENvbXBvbmVudFRyYWNlKCkge1xuICBsZXQgY3VycmVudFZOb2RlID0gc3RhY2tbc3RhY2subGVuZ3RoIC0gMV07XG4gIGlmICghY3VycmVudFZOb2RlKSB7XG4gICAgcmV0dXJuIFtdO1xuICB9XG4gIGNvbnN0IG5vcm1hbGl6ZWRTdGFjayA9IFtdO1xuICB3aGlsZSAoY3VycmVudFZOb2RlKSB7XG4gICAgY29uc3QgbGFzdCA9IG5vcm1hbGl6ZWRTdGFja1swXTtcbiAgICBpZiAobGFzdCAmJiBsYXN0LnZub2RlID09PSBjdXJyZW50Vk5vZGUpIHtcbiAgICAgIGxhc3QucmVjdXJzZUNvdW50Kys7XG4gICAgfSBlbHNlIHtcbiAgICAgIG5vcm1hbGl6ZWRTdGFjay5wdXNoKHtcbiAgICAgICAgdm5vZGU6IGN1cnJlbnRWTm9kZSxcbiAgICAgICAgcmVjdXJzZUNvdW50OiAwXG4gICAgICB9KTtcbiAgICB9XG4gICAgY29uc3QgcGFyZW50SW5zdGFuY2UgPSBjdXJyZW50Vk5vZGUuY29tcG9uZW50ICYmIGN1cnJlbnRWTm9kZS5jb21wb25lbnQucGFyZW50O1xuICAgIGN1cnJlbnRWTm9kZSA9IHBhcmVudEluc3RhbmNlICYmIHBhcmVudEluc3RhbmNlLnZub2RlO1xuICB9XG4gIHJldHVybiBub3JtYWxpemVkU3RhY2s7XG59XG5mdW5jdGlvbiBmb3JtYXRUcmFjZSh0cmFjZSkge1xuICBjb25zdCBsb2dzID0gW107XG4gIHRyYWNlLmZvckVhY2goKGVudHJ5LCBpKSA9PiB7XG4gICAgbG9ncy5wdXNoKC4uLmkgPT09IDAgPyBbXSA6IFtgXG5gXSwgLi4uZm9ybWF0VHJhY2VFbnRyeShlbnRyeSkpO1xuICB9KTtcbiAgcmV0dXJuIGxvZ3M7XG59XG5mdW5jdGlvbiBmb3JtYXRUcmFjZUVudHJ5KHsgdm5vZGUsIHJlY3Vyc2VDb3VudCB9KSB7XG4gIGNvbnN0IHBvc3RmaXggPSByZWN1cnNlQ291bnQgPiAwID8gYC4uLiAoJHtyZWN1cnNlQ291bnR9IHJlY3Vyc2l2ZSBjYWxscylgIDogYGA7XG4gIGNvbnN0IGlzUm9vdCA9IHZub2RlLmNvbXBvbmVudCA/IHZub2RlLmNvbXBvbmVudC5wYXJlbnQgPT0gbnVsbCA6IGZhbHNlO1xuICBjb25zdCBvcGVuID0gYCBhdCA8JHtmb3JtYXRDb21wb25lbnROYW1lKFxuICAgIHZub2RlLmNvbXBvbmVudCxcbiAgICB2bm9kZS50eXBlLFxuICAgIGlzUm9vdFxuICApfWA7XG4gIGNvbnN0IGNsb3NlID0gYD5gICsgcG9zdGZpeDtcbiAgcmV0dXJuIHZub2RlLnByb3BzID8gW29wZW4sIC4uLmZvcm1hdFByb3BzKHZub2RlLnByb3BzKSwgY2xvc2VdIDogW29wZW4gKyBjbG9zZV07XG59XG5mdW5jdGlvbiBmb3JtYXRQcm9wcyhwcm9wcykge1xuICBjb25zdCByZXMgPSBbXTtcbiAgY29uc3Qga2V5cyA9IE9iamVjdC5rZXlzKHByb3BzKTtcbiAga2V5cy5zbGljZSgwLCAzKS5mb3JFYWNoKChrZXkpID0+IHtcbiAgICByZXMucHVzaCguLi5mb3JtYXRQcm9wKGtleSwgcHJvcHNba2V5XSkpO1xuICB9KTtcbiAgaWYgKGtleXMubGVuZ3RoID4gMykge1xuICAgIHJlcy5wdXNoKGAgLi4uYCk7XG4gIH1cbiAgcmV0dXJuIHJlcztcbn1cbmZ1bmN0aW9uIGZvcm1hdFByb3Aoa2V5LCB2YWx1ZSwgcmF3KSB7XG4gIGlmIChpc1N0cmluZyh2YWx1ZSkpIHtcbiAgICB2YWx1ZSA9IEpTT04uc3RyaW5naWZ5KHZhbHVlKTtcbiAgICByZXR1cm4gcmF3ID8gdmFsdWUgOiBbYCR7a2V5fT0ke3ZhbHVlfWBdO1xuICB9IGVsc2UgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gXCJudW1iZXJcIiB8fCB0eXBlb2YgdmFsdWUgPT09IFwiYm9vbGVhblwiIHx8IHZhbHVlID09IG51bGwpIHtcbiAgICByZXR1cm4gcmF3ID8gdmFsdWUgOiBbYCR7a2V5fT0ke3ZhbHVlfWBdO1xuICB9IGVsc2UgaWYgKGlzUmVmKHZhbHVlKSkge1xuICAgIHZhbHVlID0gZm9ybWF0UHJvcChrZXksIHRvUmF3KHZhbHVlLnZhbHVlKSwgdHJ1ZSk7XG4gICAgcmV0dXJuIHJhdyA/IHZhbHVlIDogW2Ake2tleX09UmVmPGAsIHZhbHVlLCBgPmBdO1xuICB9IGVsc2UgaWYgKGlzRnVuY3Rpb24odmFsdWUpKSB7XG4gICAgcmV0dXJuIFtgJHtrZXl9PWZuJHt2YWx1ZS5uYW1lID8gYDwke3ZhbHVlLm5hbWV9PmAgOiBgYH1gXTtcbiAgfSBlbHNlIHtcbiAgICB2YWx1ZSA9IHRvUmF3KHZhbHVlKTtcbiAgICByZXR1cm4gcmF3ID8gdmFsdWUgOiBbYCR7a2V5fT1gLCB2YWx1ZV07XG4gIH1cbn1cbmZ1bmN0aW9uIGFzc2VydE51bWJlcih2YWwsIHR5cGUpIHtcbiAgaWYgKCEhIShwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gXCJwcm9kdWN0aW9uXCIpKSByZXR1cm47XG4gIGlmICh2YWwgPT09IHZvaWQgMCkge1xuICAgIHJldHVybjtcbiAgfSBlbHNlIGlmICh0eXBlb2YgdmFsICE9PSBcIm51bWJlclwiKSB7XG4gICAgd2FybiQxKGAke3R5cGV9IGlzIG5vdCBhIHZhbGlkIG51bWJlciAtIGdvdCAke0pTT04uc3RyaW5naWZ5KHZhbCl9LmApO1xuICB9IGVsc2UgaWYgKGlzTmFOKHZhbCkpIHtcbiAgICB3YXJuJDEoYCR7dHlwZX0gaXMgTmFOIC0gdGhlIGR1cmF0aW9uIGV4cHJlc3Npb24gbWlnaHQgYmUgaW5jb3JyZWN0LmApO1xuICB9XG59XG5cbmNvbnN0IEVycm9yQ29kZXMgPSB7XG4gIFwiU0VUVVBfRlVOQ1RJT05cIjogMCxcbiAgXCIwXCI6IFwiU0VUVVBfRlVOQ1RJT05cIixcbiAgXCJSRU5ERVJfRlVOQ1RJT05cIjogMSxcbiAgXCIxXCI6IFwiUkVOREVSX0ZVTkNUSU9OXCIsXG4gIFwiTkFUSVZFX0VWRU5UX0hBTkRMRVJcIjogNSxcbiAgXCI1XCI6IFwiTkFUSVZFX0VWRU5UX0hBTkRMRVJcIixcbiAgXCJDT01QT05FTlRfRVZFTlRfSEFORExFUlwiOiA2LFxuICBcIjZcIjogXCJDT01QT05FTlRfRVZFTlRfSEFORExFUlwiLFxuICBcIlZOT0RFX0hPT0tcIjogNyxcbiAgXCI3XCI6IFwiVk5PREVfSE9PS1wiLFxuICBcIkRJUkVDVElWRV9IT09LXCI6IDgsXG4gIFwiOFwiOiBcIkRJUkVDVElWRV9IT09LXCIsXG4gIFwiVFJBTlNJVElPTl9IT09LXCI6IDksXG4gIFwiOVwiOiBcIlRSQU5TSVRJT05fSE9PS1wiLFxuICBcIkFQUF9FUlJPUl9IQU5ETEVSXCI6IDEwLFxuICBcIjEwXCI6IFwiQVBQX0VSUk9SX0hBTkRMRVJcIixcbiAgXCJBUFBfV0FSTl9IQU5ETEVSXCI6IDExLFxuICBcIjExXCI6IFwiQVBQX1dBUk5fSEFORExFUlwiLFxuICBcIkZVTkNUSU9OX1JFRlwiOiAxMixcbiAgXCIxMlwiOiBcIkZVTkNUSU9OX1JFRlwiLFxuICBcIkFTWU5DX0NPTVBPTkVOVF9MT0FERVJcIjogMTMsXG4gIFwiMTNcIjogXCJBU1lOQ19DT01QT05FTlRfTE9BREVSXCIsXG4gIFwiU0NIRURVTEVSXCI6IDE0LFxuICBcIjE0XCI6IFwiU0NIRURVTEVSXCIsXG4gIFwiQ09NUE9ORU5UX1VQREFURVwiOiAxNSxcbiAgXCIxNVwiOiBcIkNPTVBPTkVOVF9VUERBVEVcIixcbiAgXCJBUFBfVU5NT1VOVF9DTEVBTlVQXCI6IDE2LFxuICBcIjE2XCI6IFwiQVBQX1VOTU9VTlRfQ0xFQU5VUFwiXG59O1xuY29uc3QgRXJyb3JUeXBlU3RyaW5ncyQxID0ge1xuICBbXCJzcFwiXTogXCJzZXJ2ZXJQcmVmZXRjaCBob29rXCIsXG4gIFtcImJjXCJdOiBcImJlZm9yZUNyZWF0ZSBob29rXCIsXG4gIFtcImNcIl06IFwiY3JlYXRlZCBob29rXCIsXG4gIFtcImJtXCJdOiBcImJlZm9yZU1vdW50IGhvb2tcIixcbiAgW1wibVwiXTogXCJtb3VudGVkIGhvb2tcIixcbiAgW1wiYnVcIl06IFwiYmVmb3JlVXBkYXRlIGhvb2tcIixcbiAgW1widVwiXTogXCJ1cGRhdGVkXCIsXG4gIFtcImJ1bVwiXTogXCJiZWZvcmVVbm1vdW50IGhvb2tcIixcbiAgW1widW1cIl06IFwidW5tb3VudGVkIGhvb2tcIixcbiAgW1wiYVwiXTogXCJhY3RpdmF0ZWQgaG9va1wiLFxuICBbXCJkYVwiXTogXCJkZWFjdGl2YXRlZCBob29rXCIsXG4gIFtcImVjXCJdOiBcImVycm9yQ2FwdHVyZWQgaG9va1wiLFxuICBbXCJydGNcIl06IFwicmVuZGVyVHJhY2tlZCBob29rXCIsXG4gIFtcInJ0Z1wiXTogXCJyZW5kZXJUcmlnZ2VyZWQgaG9va1wiLFxuICBbMF06IFwic2V0dXAgZnVuY3Rpb25cIixcbiAgWzFdOiBcInJlbmRlciBmdW5jdGlvblwiLFxuICBbMl06IFwid2F0Y2hlciBnZXR0ZXJcIixcbiAgWzNdOiBcIndhdGNoZXIgY2FsbGJhY2tcIixcbiAgWzRdOiBcIndhdGNoZXIgY2xlYW51cCBmdW5jdGlvblwiLFxuICBbNV06IFwibmF0aXZlIGV2ZW50IGhhbmRsZXJcIixcbiAgWzZdOiBcImNvbXBvbmVudCBldmVudCBoYW5kbGVyXCIsXG4gIFs3XTogXCJ2bm9kZSBob29rXCIsXG4gIFs4XTogXCJkaXJlY3RpdmUgaG9va1wiLFxuICBbOV06IFwidHJhbnNpdGlvbiBob29rXCIsXG4gIFsxMF06IFwiYXBwIGVycm9ySGFuZGxlclwiLFxuICBbMTFdOiBcImFwcCB3YXJuSGFuZGxlclwiLFxuICBbMTJdOiBcInJlZiBmdW5jdGlvblwiLFxuICBbMTNdOiBcImFzeW5jIGNvbXBvbmVudCBsb2FkZXJcIixcbiAgWzE0XTogXCJzY2hlZHVsZXIgZmx1c2hcIixcbiAgWzE1XTogXCJjb21wb25lbnQgdXBkYXRlXCIsXG4gIFsxNl06IFwiYXBwIHVubW91bnQgY2xlYW51cCBmdW5jdGlvblwiXG59O1xuZnVuY3Rpb24gY2FsbFdpdGhFcnJvckhhbmRsaW5nKGZuLCBpbnN0YW5jZSwgdHlwZSwgYXJncykge1xuICB0cnkge1xuICAgIHJldHVybiBhcmdzID8gZm4oLi4uYXJncykgOiBmbigpO1xuICB9IGNhdGNoIChlcnIpIHtcbiAgICBoYW5kbGVFcnJvcihlcnIsIGluc3RhbmNlLCB0eXBlKTtcbiAgfVxufVxuZnVuY3Rpb24gY2FsbFdpdGhBc3luY0Vycm9ySGFuZGxpbmcoZm4sIGluc3RhbmNlLCB0eXBlLCBhcmdzKSB7XG4gIGlmIChpc0Z1bmN0aW9uKGZuKSkge1xuICAgIGNvbnN0IHJlcyA9IGNhbGxXaXRoRXJyb3JIYW5kbGluZyhmbiwgaW5zdGFuY2UsIHR5cGUsIGFyZ3MpO1xuICAgIGlmIChyZXMgJiYgaXNQcm9taXNlKHJlcykpIHtcbiAgICAgIHJlcy5jYXRjaCgoZXJyKSA9PiB7XG4gICAgICAgIGhhbmRsZUVycm9yKGVyciwgaW5zdGFuY2UsIHR5cGUpO1xuICAgICAgfSk7XG4gICAgfVxuICAgIHJldHVybiByZXM7XG4gIH1cbiAgaWYgKGlzQXJyYXkoZm4pKSB7XG4gICAgY29uc3QgdmFsdWVzID0gW107XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBmbi5sZW5ndGg7IGkrKykge1xuICAgICAgdmFsdWVzLnB1c2goY2FsbFdpdGhBc3luY0Vycm9ySGFuZGxpbmcoZm5baV0sIGluc3RhbmNlLCB0eXBlLCBhcmdzKSk7XG4gICAgfVxuICAgIHJldHVybiB2YWx1ZXM7XG4gIH0gZWxzZSBpZiAoISEocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09IFwicHJvZHVjdGlvblwiKSkge1xuICAgIHdhcm4kMShcbiAgICAgIGBJbnZhbGlkIHZhbHVlIHR5cGUgcGFzc2VkIHRvIGNhbGxXaXRoQXN5bmNFcnJvckhhbmRsaW5nKCk6ICR7dHlwZW9mIGZufWBcbiAgICApO1xuICB9XG59XG5mdW5jdGlvbiBoYW5kbGVFcnJvcihlcnIsIGluc3RhbmNlLCB0eXBlLCB0aHJvd0luRGV2ID0gdHJ1ZSkge1xuICBjb25zdCBjb250ZXh0Vk5vZGUgPSBpbnN0YW5jZSA/IGluc3RhbmNlLnZub2RlIDogbnVsbDtcbiAgY29uc3QgeyBlcnJvckhhbmRsZXIsIHRocm93VW5oYW5kbGVkRXJyb3JJblByb2R1Y3Rpb24gfSA9IGluc3RhbmNlICYmIGluc3RhbmNlLmFwcENvbnRleHQuY29uZmlnIHx8IEVNUFRZX09CSjtcbiAgaWYgKGluc3RhbmNlKSB7XG4gICAgbGV0IGN1ciA9IGluc3RhbmNlLnBhcmVudDtcbiAgICBjb25zdCBleHBvc2VkSW5zdGFuY2UgPSBpbnN0YW5jZS5wcm94eTtcbiAgICBjb25zdCBlcnJvckluZm8gPSAhIShwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gXCJwcm9kdWN0aW9uXCIpID8gRXJyb3JUeXBlU3RyaW5ncyQxW3R5cGVdIDogYGh0dHBzOi8vdnVlanMub3JnL2Vycm9yLXJlZmVyZW5jZS8jcnVudGltZS0ke3R5cGV9YDtcbiAgICB3aGlsZSAoY3VyKSB7XG4gICAgICBjb25zdCBlcnJvckNhcHR1cmVkSG9va3MgPSBjdXIuZWM7XG4gICAgICBpZiAoZXJyb3JDYXB0dXJlZEhvb2tzKSB7XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZXJyb3JDYXB0dXJlZEhvb2tzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgaWYgKGVycm9yQ2FwdHVyZWRIb29rc1tpXShlcnIsIGV4cG9zZWRJbnN0YW5jZSwgZXJyb3JJbmZvKSA9PT0gZmFsc2UpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGN1ciA9IGN1ci5wYXJlbnQ7XG4gICAgfVxuICAgIGlmIChlcnJvckhhbmRsZXIpIHtcbiAgICAgIHBhdXNlVHJhY2tpbmcoKTtcbiAgICAgIGNhbGxXaXRoRXJyb3JIYW5kbGluZyhlcnJvckhhbmRsZXIsIG51bGwsIDEwLCBbXG4gICAgICAgIGVycixcbiAgICAgICAgZXhwb3NlZEluc3RhbmNlLFxuICAgICAgICBlcnJvckluZm9cbiAgICAgIF0pO1xuICAgICAgcmVzZXRUcmFja2luZygpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgfVxuICBsb2dFcnJvcihlcnIsIHR5cGUsIGNvbnRleHRWTm9kZSwgdGhyb3dJbkRldiwgdGhyb3dVbmhhbmRsZWRFcnJvckluUHJvZHVjdGlvbik7XG59XG5mdW5jdGlvbiBsb2dFcnJvcihlcnIsIHR5cGUsIGNvbnRleHRWTm9kZSwgdGhyb3dJbkRldiA9IHRydWUsIHRocm93SW5Qcm9kID0gZmFsc2UpIHtcbiAgaWYgKCEhKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSBcInByb2R1Y3Rpb25cIikpIHtcbiAgICBjb25zdCBpbmZvID0gRXJyb3JUeXBlU3RyaW5ncyQxW3R5cGVdO1xuICAgIGlmIChjb250ZXh0Vk5vZGUpIHtcbiAgICAgIHB1c2hXYXJuaW5nQ29udGV4dChjb250ZXh0Vk5vZGUpO1xuICAgIH1cbiAgICB3YXJuJDEoYFVuaGFuZGxlZCBlcnJvciR7aW5mbyA/IGAgZHVyaW5nIGV4ZWN1dGlvbiBvZiAke2luZm99YCA6IGBgfWApO1xuICAgIGlmIChjb250ZXh0Vk5vZGUpIHtcbiAgICAgIHBvcFdhcm5pbmdDb250ZXh0KCk7XG4gICAgfVxuICAgIGlmICh0aHJvd0luRGV2KSB7XG4gICAgICB0aHJvdyBlcnI7XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoZXJyKTtcbiAgICB9XG4gIH0gZWxzZSBpZiAodGhyb3dJblByb2QpIHtcbiAgICB0aHJvdyBlcnI7XG4gIH0gZWxzZSB7XG4gICAgY29uc29sZS5lcnJvcihlcnIpO1xuICB9XG59XG5cbmNvbnN0IHF1ZXVlID0gW107XG5sZXQgZmx1c2hJbmRleCA9IC0xO1xuY29uc3QgcGVuZGluZ1Bvc3RGbHVzaENicyA9IFtdO1xubGV0IGFjdGl2ZVBvc3RGbHVzaENicyA9IG51bGw7XG5sZXQgcG9zdEZsdXNoSW5kZXggPSAwO1xuY29uc3QgcmVzb2x2ZWRQcm9taXNlID0gLyogQF9fUFVSRV9fICovIFByb21pc2UucmVzb2x2ZSgpO1xubGV0IGN1cnJlbnRGbHVzaFByb21pc2UgPSBudWxsO1xuY29uc3QgUkVDVVJTSU9OX0xJTUlUID0gMTAwO1xuZnVuY3Rpb24gbmV4dFRpY2soZm4pIHtcbiAgY29uc3QgcCA9IGN1cnJlbnRGbHVzaFByb21pc2UgfHwgcmVzb2x2ZWRQcm9taXNlO1xuICByZXR1cm4gZm4gPyBwLnRoZW4odGhpcyA/IGZuLmJpbmQodGhpcykgOiBmbikgOiBwO1xufVxuZnVuY3Rpb24gZmluZEluc2VydGlvbkluZGV4KGlkKSB7XG4gIGxldCBzdGFydCA9IGZsdXNoSW5kZXggKyAxO1xuICBsZXQgZW5kID0gcXVldWUubGVuZ3RoO1xuICB3aGlsZSAoc3RhcnQgPCBlbmQpIHtcbiAgICBjb25zdCBtaWRkbGUgPSBzdGFydCArIGVuZCA+Pj4gMTtcbiAgICBjb25zdCBtaWRkbGVKb2IgPSBxdWV1ZVttaWRkbGVdO1xuICAgIGNvbnN0IG1pZGRsZUpvYklkID0gZ2V0SWQobWlkZGxlSm9iKTtcbiAgICBpZiAobWlkZGxlSm9iSWQgPCBpZCB8fCBtaWRkbGVKb2JJZCA9PT0gaWQgJiYgbWlkZGxlSm9iLmZsYWdzICYgMikge1xuICAgICAgc3RhcnQgPSBtaWRkbGUgKyAxO1xuICAgIH0gZWxzZSB7XG4gICAgICBlbmQgPSBtaWRkbGU7XG4gICAgfVxuICB9XG4gIHJldHVybiBzdGFydDtcbn1cbmZ1bmN0aW9uIHF1ZXVlSm9iKGpvYikge1xuICBpZiAoIShqb2IuZmxhZ3MgJiAxKSkge1xuICAgIGNvbnN0IGpvYklkID0gZ2V0SWQoam9iKTtcbiAgICBjb25zdCBsYXN0Sm9iID0gcXVldWVbcXVldWUubGVuZ3RoIC0gMV07XG4gICAgaWYgKCFsYXN0Sm9iIHx8IC8vIGZhc3QgcGF0aCB3aGVuIHRoZSBqb2IgaWQgaXMgbGFyZ2VyIHRoYW4gdGhlIHRhaWxcbiAgICAhKGpvYi5mbGFncyAmIDIpICYmIGpvYklkID49IGdldElkKGxhc3RKb2IpKSB7XG4gICAgICBxdWV1ZS5wdXNoKGpvYik7XG4gICAgfSBlbHNlIHtcbiAgICAgIHF1ZXVlLnNwbGljZShmaW5kSW5zZXJ0aW9uSW5kZXgoam9iSWQpLCAwLCBqb2IpO1xuICAgIH1cbiAgICBqb2IuZmxhZ3MgfD0gMTtcbiAgICBxdWV1ZUZsdXNoKCk7XG4gIH1cbn1cbmZ1bmN0aW9uIHF1ZXVlRmx1c2goKSB7XG4gIGlmICghY3VycmVudEZsdXNoUHJvbWlzZSkge1xuICAgIGN1cnJlbnRGbHVzaFByb21pc2UgPSByZXNvbHZlZFByb21pc2UudGhlbihmbHVzaEpvYnMpO1xuICB9XG59XG5mdW5jdGlvbiBxdWV1ZVBvc3RGbHVzaENiKGNiKSB7XG4gIGlmICghaXNBcnJheShjYikpIHtcbiAgICBpZiAoYWN0aXZlUG9zdEZsdXNoQ2JzICYmIGNiLmlkID09PSAtMSkge1xuICAgICAgYWN0aXZlUG9zdEZsdXNoQ2JzLnNwbGljZShwb3N0Rmx1c2hJbmRleCArIDEsIDAsIGNiKTtcbiAgICB9IGVsc2UgaWYgKCEoY2IuZmxhZ3MgJiAxKSkge1xuICAgICAgcGVuZGluZ1Bvc3RGbHVzaENicy5wdXNoKGNiKTtcbiAgICAgIGNiLmZsYWdzIHw9IDE7XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIHBlbmRpbmdQb3N0Rmx1c2hDYnMucHVzaCguLi5jYik7XG4gIH1cbiAgcXVldWVGbHVzaCgpO1xufVxuZnVuY3Rpb24gZmx1c2hQcmVGbHVzaENicyhpbnN0YW5jZSwgc2VlbiwgaSA9IGZsdXNoSW5kZXggKyAxKSB7XG4gIGlmICghIShwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gXCJwcm9kdWN0aW9uXCIpKSB7XG4gICAgc2VlbiA9IHNlZW4gfHwgLyogQF9fUFVSRV9fICovIG5ldyBNYXAoKTtcbiAgfVxuICBmb3IgKDsgaSA8IHF1ZXVlLmxlbmd0aDsgaSsrKSB7XG4gICAgY29uc3QgY2IgPSBxdWV1ZVtpXTtcbiAgICBpZiAoY2IgJiYgY2IuZmxhZ3MgJiAyKSB7XG4gICAgICBpZiAoaW5zdGFuY2UgJiYgY2IuaWQgIT09IGluc3RhbmNlLnVpZCkge1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cbiAgICAgIGlmICghIShwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gXCJwcm9kdWN0aW9uXCIpICYmIGNoZWNrUmVjdXJzaXZlVXBkYXRlcyhzZWVuLCBjYikpIHtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG4gICAgICBxdWV1ZS5zcGxpY2UoaSwgMSk7XG4gICAgICBpLS07XG4gICAgICBpZiAoY2IuZmxhZ3MgJiA0KSB7XG4gICAgICAgIGNiLmZsYWdzICY9IC0yO1xuICAgICAgfVxuICAgICAgY2IoKTtcbiAgICAgIGlmICghKGNiLmZsYWdzICYgNCkpIHtcbiAgICAgICAgY2IuZmxhZ3MgJj0gLTI7XG4gICAgICB9XG4gICAgfVxuICB9XG59XG5mdW5jdGlvbiBmbHVzaFBvc3RGbHVzaENicyhzZWVuKSB7XG4gIGlmIChwZW5kaW5nUG9zdEZsdXNoQ2JzLmxlbmd0aCkge1xuICAgIGNvbnN0IGRlZHVwZWQgPSBbLi4ubmV3IFNldChwZW5kaW5nUG9zdEZsdXNoQ2JzKV0uc29ydChcbiAgICAgIChhLCBiKSA9PiBnZXRJZChhKSAtIGdldElkKGIpXG4gICAgKTtcbiAgICBwZW5kaW5nUG9zdEZsdXNoQ2JzLmxlbmd0aCA9IDA7XG4gICAgaWYgKGFjdGl2ZVBvc3RGbHVzaENicykge1xuICAgICAgYWN0aXZlUG9zdEZsdXNoQ2JzLnB1c2goLi4uZGVkdXBlZCk7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGFjdGl2ZVBvc3RGbHVzaENicyA9IGRlZHVwZWQ7XG4gICAgaWYgKCEhKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSBcInByb2R1Y3Rpb25cIikpIHtcbiAgICAgIHNlZW4gPSBzZWVuIHx8IC8qIEBfX1BVUkVfXyAqLyBuZXcgTWFwKCk7XG4gICAgfVxuICAgIGZvciAocG9zdEZsdXNoSW5kZXggPSAwOyBwb3N0Rmx1c2hJbmRleCA8IGFjdGl2ZVBvc3RGbHVzaENicy5sZW5ndGg7IHBvc3RGbHVzaEluZGV4KyspIHtcbiAgICAgIGNvbnN0IGNiID0gYWN0aXZlUG9zdEZsdXNoQ2JzW3Bvc3RGbHVzaEluZGV4XTtcbiAgICAgIGlmICghIShwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gXCJwcm9kdWN0aW9uXCIpICYmIGNoZWNrUmVjdXJzaXZlVXBkYXRlcyhzZWVuLCBjYikpIHtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG4gICAgICBpZiAoY2IuZmxhZ3MgJiA0KSB7XG4gICAgICAgIGNiLmZsYWdzICY9IC0yO1xuICAgICAgfVxuICAgICAgaWYgKCEoY2IuZmxhZ3MgJiA4KSkgY2IoKTtcbiAgICAgIGNiLmZsYWdzICY9IC0yO1xuICAgIH1cbiAgICBhY3RpdmVQb3N0Rmx1c2hDYnMgPSBudWxsO1xuICAgIHBvc3RGbHVzaEluZGV4ID0gMDtcbiAgfVxufVxuY29uc3QgZ2V0SWQgPSAoam9iKSA9PiBqb2IuaWQgPT0gbnVsbCA/IGpvYi5mbGFncyAmIDIgPyAtMSA6IEluZmluaXR5IDogam9iLmlkO1xuZnVuY3Rpb24gZmx1c2hKb2JzKHNlZW4pIHtcbiAgaWYgKCEhKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSBcInByb2R1Y3Rpb25cIikpIHtcbiAgICBzZWVuID0gc2VlbiB8fCAvKiBAX19QVVJFX18gKi8gbmV3IE1hcCgpO1xuICB9XG4gIGNvbnN0IGNoZWNrID0gISEocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09IFwicHJvZHVjdGlvblwiKSA/IChqb2IpID0+IGNoZWNrUmVjdXJzaXZlVXBkYXRlcyhzZWVuLCBqb2IpIDogTk9PUDtcbiAgdHJ5IHtcbiAgICBmb3IgKGZsdXNoSW5kZXggPSAwOyBmbHVzaEluZGV4IDwgcXVldWUubGVuZ3RoOyBmbHVzaEluZGV4KyspIHtcbiAgICAgIGNvbnN0IGpvYiA9IHF1ZXVlW2ZsdXNoSW5kZXhdO1xuICAgICAgaWYgKGpvYiAmJiAhKGpvYi5mbGFncyAmIDgpKSB7XG4gICAgICAgIGlmICghIShwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gXCJwcm9kdWN0aW9uXCIpICYmIGNoZWNrKGpvYikpIHtcbiAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoam9iLmZsYWdzICYgNCkge1xuICAgICAgICAgIGpvYi5mbGFncyAmPSB+MTtcbiAgICAgICAgfVxuICAgICAgICBjYWxsV2l0aEVycm9ySGFuZGxpbmcoXG4gICAgICAgICAgam9iLFxuICAgICAgICAgIGpvYi5pLFxuICAgICAgICAgIGpvYi5pID8gMTUgOiAxNFxuICAgICAgICApO1xuICAgICAgICBpZiAoIShqb2IuZmxhZ3MgJiA0KSkge1xuICAgICAgICAgIGpvYi5mbGFncyAmPSB+MTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfSBmaW5hbGx5IHtcbiAgICBmb3IgKDsgZmx1c2hJbmRleCA8IHF1ZXVlLmxlbmd0aDsgZmx1c2hJbmRleCsrKSB7XG4gICAgICBjb25zdCBqb2IgPSBxdWV1ZVtmbHVzaEluZGV4XTtcbiAgICAgIGlmIChqb2IpIHtcbiAgICAgICAgam9iLmZsYWdzICY9IC0yO1xuICAgICAgfVxuICAgIH1cbiAgICBmbHVzaEluZGV4ID0gLTE7XG4gICAgcXVldWUubGVuZ3RoID0gMDtcbiAgICBmbHVzaFBvc3RGbHVzaENicyhzZWVuKTtcbiAgICBjdXJyZW50Rmx1c2hQcm9taXNlID0gbnVsbDtcbiAgICBpZiAocXVldWUubGVuZ3RoIHx8IHBlbmRpbmdQb3N0Rmx1c2hDYnMubGVuZ3RoKSB7XG4gICAgICBmbHVzaEpvYnMoc2Vlbik7XG4gICAgfVxuICB9XG59XG5mdW5jdGlvbiBjaGVja1JlY3Vyc2l2ZVVwZGF0ZXMoc2VlbiwgZm4pIHtcbiAgY29uc3QgY291bnQgPSBzZWVuLmdldChmbikgfHwgMDtcbiAgaWYgKGNvdW50ID4gUkVDVVJTSU9OX0xJTUlUKSB7XG4gICAgY29uc3QgaW5zdGFuY2UgPSBmbi5pO1xuICAgIGNvbnN0IGNvbXBvbmVudE5hbWUgPSBpbnN0YW5jZSAmJiBnZXRDb21wb25lbnROYW1lKGluc3RhbmNlLnR5cGUpO1xuICAgIGhhbmRsZUVycm9yKFxuICAgICAgYE1heGltdW0gcmVjdXJzaXZlIHVwZGF0ZXMgZXhjZWVkZWQke2NvbXBvbmVudE5hbWUgPyBgIGluIGNvbXBvbmVudCA8JHtjb21wb25lbnROYW1lfT5gIDogYGB9LiBUaGlzIG1lYW5zIHlvdSBoYXZlIGEgcmVhY3RpdmUgZWZmZWN0IHRoYXQgaXMgbXV0YXRpbmcgaXRzIG93biBkZXBlbmRlbmNpZXMgYW5kIHRodXMgcmVjdXJzaXZlbHkgdHJpZ2dlcmluZyBpdHNlbGYuIFBvc3NpYmxlIHNvdXJjZXMgaW5jbHVkZSBjb21wb25lbnQgdGVtcGxhdGUsIHJlbmRlciBmdW5jdGlvbiwgdXBkYXRlZCBob29rIG9yIHdhdGNoZXIgc291cmNlIGZ1bmN0aW9uLmAsXG4gICAgICBudWxsLFxuICAgICAgMTBcbiAgICApO1xuICAgIHJldHVybiB0cnVlO1xuICB9XG4gIHNlZW4uc2V0KGZuLCBjb3VudCArIDEpO1xuICByZXR1cm4gZmFsc2U7XG59XG5cbmxldCBpc0htclVwZGF0aW5nID0gZmFsc2U7XG5jb25zdCBobXJEaXJ0eUNvbXBvbmVudHMgPSAvKiBAX19QVVJFX18gKi8gbmV3IE1hcCgpO1xuaWYgKCEhKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSBcInByb2R1Y3Rpb25cIikpIHtcbiAgZ2V0R2xvYmFsVGhpcygpLl9fVlVFX0hNUl9SVU5USU1FX18gPSB7XG4gICAgY3JlYXRlUmVjb3JkOiB0cnlXcmFwKGNyZWF0ZVJlY29yZCksXG4gICAgcmVyZW5kZXI6IHRyeVdyYXAocmVyZW5kZXIpLFxuICAgIHJlbG9hZDogdHJ5V3JhcChyZWxvYWQpXG4gIH07XG59XG5jb25zdCBtYXAgPSAvKiBAX19QVVJFX18gKi8gbmV3IE1hcCgpO1xuZnVuY3Rpb24gcmVnaXN0ZXJITVIoaW5zdGFuY2UpIHtcbiAgY29uc3QgaWQgPSBpbnN0YW5jZS50eXBlLl9faG1ySWQ7XG4gIGxldCByZWNvcmQgPSBtYXAuZ2V0KGlkKTtcbiAgaWYgKCFyZWNvcmQpIHtcbiAgICBjcmVhdGVSZWNvcmQoaWQsIGluc3RhbmNlLnR5cGUpO1xuICAgIHJlY29yZCA9IG1hcC5nZXQoaWQpO1xuICB9XG4gIHJlY29yZC5pbnN0YW5jZXMuYWRkKGluc3RhbmNlKTtcbn1cbmZ1bmN0aW9uIHVucmVnaXN0ZXJITVIoaW5zdGFuY2UpIHtcbiAgbWFwLmdldChpbnN0YW5jZS50eXBlLl9faG1ySWQpLmluc3RhbmNlcy5kZWxldGUoaW5zdGFuY2UpO1xufVxuZnVuY3Rpb24gY3JlYXRlUmVjb3JkKGlkLCBpbml0aWFsRGVmKSB7XG4gIGlmIChtYXAuaGFzKGlkKSkge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuICBtYXAuc2V0KGlkLCB7XG4gICAgaW5pdGlhbERlZjogbm9ybWFsaXplQ2xhc3NDb21wb25lbnQoaW5pdGlhbERlZiksXG4gICAgaW5zdGFuY2VzOiAvKiBAX19QVVJFX18gKi8gbmV3IFNldCgpXG4gIH0pO1xuICByZXR1cm4gdHJ1ZTtcbn1cbmZ1bmN0aW9uIG5vcm1hbGl6ZUNsYXNzQ29tcG9uZW50KGNvbXBvbmVudCkge1xuICByZXR1cm4gaXNDbGFzc0NvbXBvbmVudChjb21wb25lbnQpID8gY29tcG9uZW50Ll9fdmNjT3B0cyA6IGNvbXBvbmVudDtcbn1cbmZ1bmN0aW9uIHJlcmVuZGVyKGlkLCBuZXdSZW5kZXIpIHtcbiAgY29uc3QgcmVjb3JkID0gbWFwLmdldChpZCk7XG4gIGlmICghcmVjb3JkKSB7XG4gICAgcmV0dXJuO1xuICB9XG4gIHJlY29yZC5pbml0aWFsRGVmLnJlbmRlciA9IG5ld1JlbmRlcjtcbiAgWy4uLnJlY29yZC5pbnN0YW5jZXNdLmZvckVhY2goKGluc3RhbmNlKSA9PiB7XG4gICAgaWYgKG5ld1JlbmRlcikge1xuICAgICAgaW5zdGFuY2UucmVuZGVyID0gbmV3UmVuZGVyO1xuICAgICAgbm9ybWFsaXplQ2xhc3NDb21wb25lbnQoaW5zdGFuY2UudHlwZSkucmVuZGVyID0gbmV3UmVuZGVyO1xuICAgIH1cbiAgICBpbnN0YW5jZS5yZW5kZXJDYWNoZSA9IFtdO1xuICAgIGlzSG1yVXBkYXRpbmcgPSB0cnVlO1xuICAgIGlmICghKGluc3RhbmNlLmpvYi5mbGFncyAmIDgpKSB7XG4gICAgICBpbnN0YW5jZS51cGRhdGUoKTtcbiAgICB9XG4gICAgaXNIbXJVcGRhdGluZyA9IGZhbHNlO1xuICB9KTtcbn1cbmZ1bmN0aW9uIHJlbG9hZChpZCwgbmV3Q29tcCkge1xuICBjb25zdCByZWNvcmQgPSBtYXAuZ2V0KGlkKTtcbiAgaWYgKCFyZWNvcmQpIHJldHVybjtcbiAgbmV3Q29tcCA9IG5vcm1hbGl6ZUNsYXNzQ29tcG9uZW50KG5ld0NvbXApO1xuICB1cGRhdGVDb21wb25lbnREZWYocmVjb3JkLmluaXRpYWxEZWYsIG5ld0NvbXApO1xuICBjb25zdCBpbnN0YW5jZXMgPSBbLi4ucmVjb3JkLmluc3RhbmNlc107XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgaW5zdGFuY2VzLmxlbmd0aDsgaSsrKSB7XG4gICAgY29uc3QgaW5zdGFuY2UgPSBpbnN0YW5jZXNbaV07XG4gICAgY29uc3Qgb2xkQ29tcCA9IG5vcm1hbGl6ZUNsYXNzQ29tcG9uZW50KGluc3RhbmNlLnR5cGUpO1xuICAgIGxldCBkaXJ0eUluc3RhbmNlcyA9IGhtckRpcnR5Q29tcG9uZW50cy5nZXQob2xkQ29tcCk7XG4gICAgaWYgKCFkaXJ0eUluc3RhbmNlcykge1xuICAgICAgaWYgKG9sZENvbXAgIT09IHJlY29yZC5pbml0aWFsRGVmKSB7XG4gICAgICAgIHVwZGF0ZUNvbXBvbmVudERlZihvbGRDb21wLCBuZXdDb21wKTtcbiAgICAgIH1cbiAgICAgIGhtckRpcnR5Q29tcG9uZW50cy5zZXQob2xkQ29tcCwgZGlydHlJbnN0YW5jZXMgPSAvKiBAX19QVVJFX18gKi8gbmV3IFNldCgpKTtcbiAgICB9XG4gICAgZGlydHlJbnN0YW5jZXMuYWRkKGluc3RhbmNlKTtcbiAgICBpbnN0YW5jZS5hcHBDb250ZXh0LnByb3BzQ2FjaGUuZGVsZXRlKGluc3RhbmNlLnR5cGUpO1xuICAgIGluc3RhbmNlLmFwcENvbnRleHQuZW1pdHNDYWNoZS5kZWxldGUoaW5zdGFuY2UudHlwZSk7XG4gICAgaW5zdGFuY2UuYXBwQ29udGV4dC5vcHRpb25zQ2FjaGUuZGVsZXRlKGluc3RhbmNlLnR5cGUpO1xuICAgIGlmIChpbnN0YW5jZS5jZVJlbG9hZCkge1xuICAgICAgZGlydHlJbnN0YW5jZXMuYWRkKGluc3RhbmNlKTtcbiAgICAgIGluc3RhbmNlLmNlUmVsb2FkKG5ld0NvbXAuc3R5bGVzKTtcbiAgICAgIGRpcnR5SW5zdGFuY2VzLmRlbGV0ZShpbnN0YW5jZSk7XG4gICAgfSBlbHNlIGlmIChpbnN0YW5jZS5wYXJlbnQpIHtcbiAgICAgIHF1ZXVlSm9iKCgpID0+IHtcbiAgICAgICAgaWYgKCEoaW5zdGFuY2Uuam9iLmZsYWdzICYgOCkpIHtcbiAgICAgICAgICBpc0htclVwZGF0aW5nID0gdHJ1ZTtcbiAgICAgICAgICBpbnN0YW5jZS5wYXJlbnQudXBkYXRlKCk7XG4gICAgICAgICAgaXNIbXJVcGRhdGluZyA9IGZhbHNlO1xuICAgICAgICAgIGRpcnR5SW5zdGFuY2VzLmRlbGV0ZShpbnN0YW5jZSk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH0gZWxzZSBpZiAoaW5zdGFuY2UuYXBwQ29udGV4dC5yZWxvYWQpIHtcbiAgICAgIGluc3RhbmNlLmFwcENvbnRleHQucmVsb2FkKCk7XG4gICAgfSBlbHNlIGlmICh0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICB3aW5kb3cubG9jYXRpb24ucmVsb2FkKCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnNvbGUud2FybihcbiAgICAgICAgXCJbSE1SXSBSb290IG9yIG1hbnVhbGx5IG1vdW50ZWQgaW5zdGFuY2UgbW9kaWZpZWQuIEZ1bGwgcmVsb2FkIHJlcXVpcmVkLlwiXG4gICAgICApO1xuICAgIH1cbiAgICBpZiAoaW5zdGFuY2Uucm9vdC5jZSAmJiBpbnN0YW5jZSAhPT0gaW5zdGFuY2Uucm9vdCkge1xuICAgICAgaW5zdGFuY2Uucm9vdC5jZS5fcmVtb3ZlQ2hpbGRTdHlsZShvbGRDb21wKTtcbiAgICB9XG4gIH1cbiAgcXVldWVQb3N0Rmx1c2hDYigoKSA9PiB7XG4gICAgaG1yRGlydHlDb21wb25lbnRzLmNsZWFyKCk7XG4gIH0pO1xufVxuZnVuY3Rpb24gdXBkYXRlQ29tcG9uZW50RGVmKG9sZENvbXAsIG5ld0NvbXApIHtcbiAgZXh0ZW5kKG9sZENvbXAsIG5ld0NvbXApO1xuICBmb3IgKGNvbnN0IGtleSBpbiBvbGRDb21wKSB7XG4gICAgaWYgKGtleSAhPT0gXCJfX2ZpbGVcIiAmJiAhKGtleSBpbiBuZXdDb21wKSkge1xuICAgICAgZGVsZXRlIG9sZENvbXBba2V5XTtcbiAgICB9XG4gIH1cbn1cbmZ1bmN0aW9uIHRyeVdyYXAoZm4pIHtcbiAgcmV0dXJuIChpZCwgYXJnKSA9PiB7XG4gICAgdHJ5IHtcbiAgICAgIHJldHVybiBmbihpZCwgYXJnKTtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICBjb25zb2xlLmVycm9yKGUpO1xuICAgICAgY29uc29sZS53YXJuKFxuICAgICAgICBgW0hNUl0gU29tZXRoaW5nIHdlbnQgd3JvbmcgZHVyaW5nIFZ1ZSBjb21wb25lbnQgaG90LXJlbG9hZC4gRnVsbCByZWxvYWQgcmVxdWlyZWQuYFxuICAgICAgKTtcbiAgICB9XG4gIH07XG59XG5cbmxldCBkZXZ0b29scyQxO1xubGV0IGJ1ZmZlciA9IFtdO1xubGV0IGRldnRvb2xzTm90SW5zdGFsbGVkID0gZmFsc2U7XG5mdW5jdGlvbiBlbWl0JDEoZXZlbnQsIC4uLmFyZ3MpIHtcbiAgaWYgKGRldnRvb2xzJDEpIHtcbiAgICBkZXZ0b29scyQxLmVtaXQoZXZlbnQsIC4uLmFyZ3MpO1xuICB9IGVsc2UgaWYgKCFkZXZ0b29sc05vdEluc3RhbGxlZCkge1xuICAgIGJ1ZmZlci5wdXNoKHsgZXZlbnQsIGFyZ3MgfSk7XG4gIH1cbn1cbmZ1bmN0aW9uIHNldERldnRvb2xzSG9vayQxKGhvb2ssIHRhcmdldCkge1xuICB2YXIgX2EsIF9iO1xuICBkZXZ0b29scyQxID0gaG9vaztcbiAgaWYgKGRldnRvb2xzJDEpIHtcbiAgICBkZXZ0b29scyQxLmVuYWJsZWQgPSB0cnVlO1xuICAgIGJ1ZmZlci5mb3JFYWNoKCh7IGV2ZW50LCBhcmdzIH0pID0+IGRldnRvb2xzJDEuZW1pdChldmVudCwgLi4uYXJncykpO1xuICAgIGJ1ZmZlciA9IFtdO1xuICB9IGVsc2UgaWYgKFxuICAgIC8vIGhhbmRsZSBsYXRlIGRldnRvb2xzIGluamVjdGlvbiAtIG9ubHkgZG8gdGhpcyBpZiB3ZSBhcmUgaW4gYW4gYWN0dWFsXG4gICAgLy8gYnJvd3NlciBlbnZpcm9ubWVudCB0byBhdm9pZCB0aGUgdGltZXIgaGFuZGxlIHN0YWxsaW5nIHRlc3QgcnVubmVyIGV4aXRcbiAgICAvLyAoIzQ4MTUpXG4gICAgdHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiAmJiAvLyBzb21lIGVudnMgbW9jayB3aW5kb3cgYnV0IG5vdCBmdWxseVxuICAgIHdpbmRvdy5IVE1MRWxlbWVudCAmJiAvLyBhbHNvIGV4Y2x1ZGUganNkb21cbiAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tcmVzdHJpY3RlZC1zeW50YXhcbiAgICAhKChfYiA9IChfYSA9IHdpbmRvdy5uYXZpZ2F0b3IpID09IG51bGwgPyB2b2lkIDAgOiBfYS51c2VyQWdlbnQpID09IG51bGwgPyB2b2lkIDAgOiBfYi5pbmNsdWRlcyhcImpzZG9tXCIpKVxuICApIHtcbiAgICBjb25zdCByZXBsYXkgPSB0YXJnZXQuX19WVUVfREVWVE9PTFNfSE9PS19SRVBMQVlfXyA9IHRhcmdldC5fX1ZVRV9ERVZUT09MU19IT09LX1JFUExBWV9fIHx8IFtdO1xuICAgIHJlcGxheS5wdXNoKChuZXdIb29rKSA9PiB7XG4gICAgICBzZXREZXZ0b29sc0hvb2skMShuZXdIb29rLCB0YXJnZXQpO1xuICAgIH0pO1xuICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgaWYgKCFkZXZ0b29scyQxKSB7XG4gICAgICAgIHRhcmdldC5fX1ZVRV9ERVZUT09MU19IT09LX1JFUExBWV9fID0gbnVsbDtcbiAgICAgICAgZGV2dG9vbHNOb3RJbnN0YWxsZWQgPSB0cnVlO1xuICAgICAgICBidWZmZXIgPSBbXTtcbiAgICAgIH1cbiAgICB9LCAzZTMpO1xuICB9IGVsc2Uge1xuICAgIGRldnRvb2xzTm90SW5zdGFsbGVkID0gdHJ1ZTtcbiAgICBidWZmZXIgPSBbXTtcbiAgfVxufVxuZnVuY3Rpb24gZGV2dG9vbHNJbml0QXBwKGFwcCwgdmVyc2lvbikge1xuICBlbWl0JDEoXCJhcHA6aW5pdFwiIC8qIEFQUF9JTklUICovLCBhcHAsIHZlcnNpb24sIHtcbiAgICBGcmFnbWVudCxcbiAgICBUZXh0LFxuICAgIENvbW1lbnQsXG4gICAgU3RhdGljXG4gIH0pO1xufVxuZnVuY3Rpb24gZGV2dG9vbHNVbm1vdW50QXBwKGFwcCkge1xuICBlbWl0JDEoXCJhcHA6dW5tb3VudFwiIC8qIEFQUF9VTk1PVU5UICovLCBhcHApO1xufVxuY29uc3QgZGV2dG9vbHNDb21wb25lbnRBZGRlZCA9IC8qIEBfX1BVUkVfXyAqLyBjcmVhdGVEZXZ0b29sc0NvbXBvbmVudEhvb2soXCJjb21wb25lbnQ6YWRkZWRcIiAvKiBDT01QT05FTlRfQURERUQgKi8pO1xuY29uc3QgZGV2dG9vbHNDb21wb25lbnRVcGRhdGVkID0gLyogQF9fUFVSRV9fICovIGNyZWF0ZURldnRvb2xzQ29tcG9uZW50SG9vayhcImNvbXBvbmVudDp1cGRhdGVkXCIgLyogQ09NUE9ORU5UX1VQREFURUQgKi8pO1xuY29uc3QgX2RldnRvb2xzQ29tcG9uZW50UmVtb3ZlZCA9IC8qIEBfX1BVUkVfXyAqLyBjcmVhdGVEZXZ0b29sc0NvbXBvbmVudEhvb2soXG4gIFwiY29tcG9uZW50OnJlbW92ZWRcIiAvKiBDT01QT05FTlRfUkVNT1ZFRCAqL1xuKTtcbmNvbnN0IGRldnRvb2xzQ29tcG9uZW50UmVtb3ZlZCA9IChjb21wb25lbnQpID0+IHtcbiAgaWYgKGRldnRvb2xzJDEgJiYgdHlwZW9mIGRldnRvb2xzJDEuY2xlYW51cEJ1ZmZlciA9PT0gXCJmdW5jdGlvblwiICYmIC8vIHJlbW92ZSB0aGUgY29tcG9uZW50IGlmIGl0IHdhc24ndCBidWZmZXJlZFxuICAhZGV2dG9vbHMkMS5jbGVhbnVwQnVmZmVyKGNvbXBvbmVudCkpIHtcbiAgICBfZGV2dG9vbHNDb21wb25lbnRSZW1vdmVkKGNvbXBvbmVudCk7XG4gIH1cbn07XG4vLyBAX19OT19TSURFX0VGRkVDVFNfX1xuZnVuY3Rpb24gY3JlYXRlRGV2dG9vbHNDb21wb25lbnRIb29rKGhvb2spIHtcbiAgcmV0dXJuIChjb21wb25lbnQpID0+IHtcbiAgICBlbWl0JDEoXG4gICAgICBob29rLFxuICAgICAgY29tcG9uZW50LmFwcENvbnRleHQuYXBwLFxuICAgICAgY29tcG9uZW50LnVpZCxcbiAgICAgIGNvbXBvbmVudC5wYXJlbnQgPyBjb21wb25lbnQucGFyZW50LnVpZCA6IHZvaWQgMCxcbiAgICAgIGNvbXBvbmVudFxuICAgICk7XG4gIH07XG59XG5jb25zdCBkZXZ0b29sc1BlcmZTdGFydCA9IC8qIEBfX1BVUkVfXyAqLyBjcmVhdGVEZXZ0b29sc1BlcmZvcm1hbmNlSG9vayhcInBlcmY6c3RhcnRcIiAvKiBQRVJGT1JNQU5DRV9TVEFSVCAqLyk7XG5jb25zdCBkZXZ0b29sc1BlcmZFbmQgPSAvKiBAX19QVVJFX18gKi8gY3JlYXRlRGV2dG9vbHNQZXJmb3JtYW5jZUhvb2soXCJwZXJmOmVuZFwiIC8qIFBFUkZPUk1BTkNFX0VORCAqLyk7XG5mdW5jdGlvbiBjcmVhdGVEZXZ0b29sc1BlcmZvcm1hbmNlSG9vayhob29rKSB7XG4gIHJldHVybiAoY29tcG9uZW50LCB0eXBlLCB0aW1lKSA9PiB7XG4gICAgZW1pdCQxKGhvb2ssIGNvbXBvbmVudC5hcHBDb250ZXh0LmFwcCwgY29tcG9uZW50LnVpZCwgY29tcG9uZW50LCB0eXBlLCB0aW1lKTtcbiAgfTtcbn1cbmZ1bmN0aW9uIGRldnRvb2xzQ29tcG9uZW50RW1pdChjb21wb25lbnQsIGV2ZW50LCBwYXJhbXMpIHtcbiAgZW1pdCQxKFxuICAgIFwiY29tcG9uZW50OmVtaXRcIiAvKiBDT01QT05FTlRfRU1JVCAqLyxcbiAgICBjb21wb25lbnQuYXBwQ29udGV4dC5hcHAsXG4gICAgY29tcG9uZW50LFxuICAgIGV2ZW50LFxuICAgIHBhcmFtc1xuICApO1xufVxuXG5sZXQgY3VycmVudFJlbmRlcmluZ0luc3RhbmNlID0gbnVsbDtcbmxldCBjdXJyZW50U2NvcGVJZCA9IG51bGw7XG5mdW5jdGlvbiBzZXRDdXJyZW50UmVuZGVyaW5nSW5zdGFuY2UoaW5zdGFuY2UpIHtcbiAgY29uc3QgcHJldiA9IGN1cnJlbnRSZW5kZXJpbmdJbnN0YW5jZTtcbiAgY3VycmVudFJlbmRlcmluZ0luc3RhbmNlID0gaW5zdGFuY2U7XG4gIGN1cnJlbnRTY29wZUlkID0gaW5zdGFuY2UgJiYgaW5zdGFuY2UudHlwZS5fX3Njb3BlSWQgfHwgbnVsbDtcbiAgcmV0dXJuIHByZXY7XG59XG5mdW5jdGlvbiBwdXNoU2NvcGVJZChpZCkge1xuICBjdXJyZW50U2NvcGVJZCA9IGlkO1xufVxuZnVuY3Rpb24gcG9wU2NvcGVJZCgpIHtcbiAgY3VycmVudFNjb3BlSWQgPSBudWxsO1xufVxuY29uc3Qgd2l0aFNjb3BlSWQgPSAoX2lkKSA9PiB3aXRoQ3R4O1xuZnVuY3Rpb24gd2l0aEN0eChmbiwgY3R4ID0gY3VycmVudFJlbmRlcmluZ0luc3RhbmNlLCBpc05vblNjb3BlZFNsb3QpIHtcbiAgaWYgKCFjdHgpIHJldHVybiBmbjtcbiAgaWYgKGZuLl9uKSB7XG4gICAgcmV0dXJuIGZuO1xuICB9XG4gIGNvbnN0IHJlbmRlckZuV2l0aENvbnRleHQgPSAoLi4uYXJncykgPT4ge1xuICAgIGlmIChyZW5kZXJGbldpdGhDb250ZXh0Ll9kKSB7XG4gICAgICBzZXRCbG9ja1RyYWNraW5nKC0xKTtcbiAgICB9XG4gICAgY29uc3QgcHJldkluc3RhbmNlID0gc2V0Q3VycmVudFJlbmRlcmluZ0luc3RhbmNlKGN0eCk7XG4gICAgbGV0IHJlcztcbiAgICB0cnkge1xuICAgICAgcmVzID0gZm4oLi4uYXJncyk7XG4gICAgfSBmaW5hbGx5IHtcbiAgICAgIHNldEN1cnJlbnRSZW5kZXJpbmdJbnN0YW5jZShwcmV2SW5zdGFuY2UpO1xuICAgICAgaWYgKHJlbmRlckZuV2l0aENvbnRleHQuX2QpIHtcbiAgICAgICAgc2V0QmxvY2tUcmFja2luZygxKTtcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKCEhKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSBcInByb2R1Y3Rpb25cIikgfHwgX19WVUVfUFJPRF9ERVZUT09MU19fKSB7XG4gICAgICBkZXZ0b29sc0NvbXBvbmVudFVwZGF0ZWQoY3R4KTtcbiAgICB9XG4gICAgcmV0dXJuIHJlcztcbiAgfTtcbiAgcmVuZGVyRm5XaXRoQ29udGV4dC5fbiA9IHRydWU7XG4gIHJlbmRlckZuV2l0aENvbnRleHQuX2MgPSB0cnVlO1xuICByZW5kZXJGbldpdGhDb250ZXh0Ll9kID0gdHJ1ZTtcbiAgcmV0dXJuIHJlbmRlckZuV2l0aENvbnRleHQ7XG59XG5cbmZ1bmN0aW9uIHZhbGlkYXRlRGlyZWN0aXZlTmFtZShuYW1lKSB7XG4gIGlmIChpc0J1aWx0SW5EaXJlY3RpdmUobmFtZSkpIHtcbiAgICB3YXJuJDEoXCJEbyBub3QgdXNlIGJ1aWx0LWluIGRpcmVjdGl2ZSBpZHMgYXMgY3VzdG9tIGRpcmVjdGl2ZSBpZDogXCIgKyBuYW1lKTtcbiAgfVxufVxuZnVuY3Rpb24gd2l0aERpcmVjdGl2ZXModm5vZGUsIGRpcmVjdGl2ZXMpIHtcbiAgaWYgKGN1cnJlbnRSZW5kZXJpbmdJbnN0YW5jZSA9PT0gbnVsbCkge1xuICAgICEhKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSBcInByb2R1Y3Rpb25cIikgJiYgd2FybiQxKGB3aXRoRGlyZWN0aXZlcyBjYW4gb25seSBiZSB1c2VkIGluc2lkZSByZW5kZXIgZnVuY3Rpb25zLmApO1xuICAgIHJldHVybiB2bm9kZTtcbiAgfVxuICBjb25zdCBpbnN0YW5jZSA9IGdldENvbXBvbmVudFB1YmxpY0luc3RhbmNlKGN1cnJlbnRSZW5kZXJpbmdJbnN0YW5jZSk7XG4gIGNvbnN0IGJpbmRpbmdzID0gdm5vZGUuZGlycyB8fCAodm5vZGUuZGlycyA9IFtdKTtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBkaXJlY3RpdmVzLmxlbmd0aDsgaSsrKSB7XG4gICAgbGV0IFtkaXIsIHZhbHVlLCBhcmcsIG1vZGlmaWVycyA9IEVNUFRZX09CSl0gPSBkaXJlY3RpdmVzW2ldO1xuICAgIGlmIChkaXIpIHtcbiAgICAgIGlmIChpc0Z1bmN0aW9uKGRpcikpIHtcbiAgICAgICAgZGlyID0ge1xuICAgICAgICAgIG1vdW50ZWQ6IGRpcixcbiAgICAgICAgICB1cGRhdGVkOiBkaXJcbiAgICAgICAgfTtcbiAgICAgIH1cbiAgICAgIGlmIChkaXIuZGVlcCkge1xuICAgICAgICB0cmF2ZXJzZSh2YWx1ZSk7XG4gICAgICB9XG4gICAgICBiaW5kaW5ncy5wdXNoKHtcbiAgICAgICAgZGlyLFxuICAgICAgICBpbnN0YW5jZSxcbiAgICAgICAgdmFsdWUsXG4gICAgICAgIG9sZFZhbHVlOiB2b2lkIDAsXG4gICAgICAgIGFyZyxcbiAgICAgICAgbW9kaWZpZXJzXG4gICAgICB9KTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHZub2RlO1xufVxuZnVuY3Rpb24gaW52b2tlRGlyZWN0aXZlSG9vayh2bm9kZSwgcHJldlZOb2RlLCBpbnN0YW5jZSwgbmFtZSkge1xuICBjb25zdCBiaW5kaW5ncyA9IHZub2RlLmRpcnM7XG4gIGNvbnN0IG9sZEJpbmRpbmdzID0gcHJldlZOb2RlICYmIHByZXZWTm9kZS5kaXJzO1xuICBmb3IgKGxldCBpID0gMDsgaSA8IGJpbmRpbmdzLmxlbmd0aDsgaSsrKSB7XG4gICAgY29uc3QgYmluZGluZyA9IGJpbmRpbmdzW2ldO1xuICAgIGlmIChvbGRCaW5kaW5ncykge1xuICAgICAgYmluZGluZy5vbGRWYWx1ZSA9IG9sZEJpbmRpbmdzW2ldLnZhbHVlO1xuICAgIH1cbiAgICBsZXQgaG9vayA9IGJpbmRpbmcuZGlyW25hbWVdO1xuICAgIGlmIChob29rKSB7XG4gICAgICBwYXVzZVRyYWNraW5nKCk7XG4gICAgICBjYWxsV2l0aEFzeW5jRXJyb3JIYW5kbGluZyhob29rLCBpbnN0YW5jZSwgOCwgW1xuICAgICAgICB2bm9kZS5lbCxcbiAgICAgICAgYmluZGluZyxcbiAgICAgICAgdm5vZGUsXG4gICAgICAgIHByZXZWTm9kZVxuICAgICAgXSk7XG4gICAgICByZXNldFRyYWNraW5nKCk7XG4gICAgfVxuICB9XG59XG5cbmZ1bmN0aW9uIHByb3ZpZGUoa2V5LCB2YWx1ZSkge1xuICBpZiAoISEocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09IFwicHJvZHVjdGlvblwiKSkge1xuICAgIGlmICghY3VycmVudEluc3RhbmNlIHx8IGN1cnJlbnRJbnN0YW5jZS5pc01vdW50ZWQpIHtcbiAgICAgIHdhcm4kMShgcHJvdmlkZSgpIGNhbiBvbmx5IGJlIHVzZWQgaW5zaWRlIHNldHVwKCkuYCk7XG4gICAgfVxuICB9XG4gIGlmIChjdXJyZW50SW5zdGFuY2UpIHtcbiAgICBsZXQgcHJvdmlkZXMgPSBjdXJyZW50SW5zdGFuY2UucHJvdmlkZXM7XG4gICAgY29uc3QgcGFyZW50UHJvdmlkZXMgPSBjdXJyZW50SW5zdGFuY2UucGFyZW50ICYmIGN1cnJlbnRJbnN0YW5jZS5wYXJlbnQucHJvdmlkZXM7XG4gICAgaWYgKHBhcmVudFByb3ZpZGVzID09PSBwcm92aWRlcykge1xuICAgICAgcHJvdmlkZXMgPSBjdXJyZW50SW5zdGFuY2UucHJvdmlkZXMgPSBPYmplY3QuY3JlYXRlKHBhcmVudFByb3ZpZGVzKTtcbiAgICB9XG4gICAgcHJvdmlkZXNba2V5XSA9IHZhbHVlO1xuICB9XG59XG5mdW5jdGlvbiBpbmplY3Qoa2V5LCBkZWZhdWx0VmFsdWUsIHRyZWF0RGVmYXVsdEFzRmFjdG9yeSA9IGZhbHNlKSB7XG4gIGNvbnN0IGluc3RhbmNlID0gZ2V0Q3VycmVudEluc3RhbmNlKCk7XG4gIGlmIChpbnN0YW5jZSB8fCBjdXJyZW50QXBwKSB7XG4gICAgbGV0IHByb3ZpZGVzID0gY3VycmVudEFwcCA/IGN1cnJlbnRBcHAuX2NvbnRleHQucHJvdmlkZXMgOiBpbnN0YW5jZSA/IGluc3RhbmNlLnBhcmVudCA9PSBudWxsIHx8IGluc3RhbmNlLmNlID8gaW5zdGFuY2Uudm5vZGUuYXBwQ29udGV4dCAmJiBpbnN0YW5jZS52bm9kZS5hcHBDb250ZXh0LnByb3ZpZGVzIDogaW5zdGFuY2UucGFyZW50LnByb3ZpZGVzIDogdm9pZCAwO1xuICAgIGlmIChwcm92aWRlcyAmJiBrZXkgaW4gcHJvdmlkZXMpIHtcbiAgICAgIHJldHVybiBwcm92aWRlc1trZXldO1xuICAgIH0gZWxzZSBpZiAoYXJndW1lbnRzLmxlbmd0aCA+IDEpIHtcbiAgICAgIHJldHVybiB0cmVhdERlZmF1bHRBc0ZhY3RvcnkgJiYgaXNGdW5jdGlvbihkZWZhdWx0VmFsdWUpID8gZGVmYXVsdFZhbHVlLmNhbGwoaW5zdGFuY2UgJiYgaW5zdGFuY2UucHJveHkpIDogZGVmYXVsdFZhbHVlO1xuICAgIH0gZWxzZSBpZiAoISEocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09IFwicHJvZHVjdGlvblwiKSkge1xuICAgICAgd2FybiQxKGBpbmplY3Rpb24gXCIke1N0cmluZyhrZXkpfVwiIG5vdCBmb3VuZC5gKTtcbiAgICB9XG4gIH0gZWxzZSBpZiAoISEocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09IFwicHJvZHVjdGlvblwiKSkge1xuICAgIHdhcm4kMShgaW5qZWN0KCkgY2FuIG9ubHkgYmUgdXNlZCBpbnNpZGUgc2V0dXAoKSBvciBmdW5jdGlvbmFsIGNvbXBvbmVudHMuYCk7XG4gIH1cbn1cbmZ1bmN0aW9uIGhhc0luamVjdGlvbkNvbnRleHQoKSB7XG4gIHJldHVybiAhIShnZXRDdXJyZW50SW5zdGFuY2UoKSB8fCBjdXJyZW50QXBwKTtcbn1cblxuY29uc3Qgc3NyQ29udGV4dEtleSA9IC8qIEBfX1BVUkVfXyAqLyBTeW1ib2wuZm9yKFwidi1zY3hcIik7XG5jb25zdCB1c2VTU1JDb250ZXh0ID0gKCkgPT4ge1xuICB7XG4gICAgY29uc3QgY3R4ID0gaW5qZWN0KHNzckNvbnRleHRLZXkpO1xuICAgIGlmICghY3R4KSB7XG4gICAgICAhIShwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gXCJwcm9kdWN0aW9uXCIpICYmIHdhcm4kMShcbiAgICAgICAgYFNlcnZlciByZW5kZXJpbmcgY29udGV4dCBub3QgcHJvdmlkZWQuIE1ha2Ugc3VyZSB0byBvbmx5IGNhbGwgdXNlU1NSQ29udGV4dCgpIGNvbmRpdGlvbmFsbHkgaW4gdGhlIHNlcnZlciBidWlsZC5gXG4gICAgICApO1xuICAgIH1cbiAgICByZXR1cm4gY3R4O1xuICB9XG59O1xuXG5mdW5jdGlvbiB3YXRjaEVmZmVjdChlZmZlY3QsIG9wdGlvbnMpIHtcbiAgcmV0dXJuIGRvV2F0Y2goZWZmZWN0LCBudWxsLCBvcHRpb25zKTtcbn1cbmZ1bmN0aW9uIHdhdGNoUG9zdEVmZmVjdChlZmZlY3QsIG9wdGlvbnMpIHtcbiAgcmV0dXJuIGRvV2F0Y2goXG4gICAgZWZmZWN0LFxuICAgIG51bGwsXG4gICAgISEocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09IFwicHJvZHVjdGlvblwiKSA/IGV4dGVuZCh7fSwgb3B0aW9ucywgeyBmbHVzaDogXCJwb3N0XCIgfSkgOiB7IGZsdXNoOiBcInBvc3RcIiB9XG4gICk7XG59XG5mdW5jdGlvbiB3YXRjaFN5bmNFZmZlY3QoZWZmZWN0LCBvcHRpb25zKSB7XG4gIHJldHVybiBkb1dhdGNoKFxuICAgIGVmZmVjdCxcbiAgICBudWxsLFxuICAgICEhKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSBcInByb2R1Y3Rpb25cIikgPyBleHRlbmQoe30sIG9wdGlvbnMsIHsgZmx1c2g6IFwic3luY1wiIH0pIDogeyBmbHVzaDogXCJzeW5jXCIgfVxuICApO1xufVxuZnVuY3Rpb24gd2F0Y2goc291cmNlLCBjYiwgb3B0aW9ucykge1xuICBpZiAoISEocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09IFwicHJvZHVjdGlvblwiKSAmJiAhaXNGdW5jdGlvbihjYikpIHtcbiAgICB3YXJuJDEoXG4gICAgICBgXFxgd2F0Y2goZm4sIG9wdGlvbnM/KVxcYCBzaWduYXR1cmUgaGFzIGJlZW4gbW92ZWQgdG8gYSBzZXBhcmF0ZSBBUEkuIFVzZSBcXGB3YXRjaEVmZmVjdChmbiwgb3B0aW9ucz8pXFxgIGluc3RlYWQuIFxcYHdhdGNoXFxgIG5vdyBvbmx5IHN1cHBvcnRzIFxcYHdhdGNoKHNvdXJjZSwgY2IsIG9wdGlvbnM/KSBzaWduYXR1cmUuYFxuICAgICk7XG4gIH1cbiAgcmV0dXJuIGRvV2F0Y2goc291cmNlLCBjYiwgb3B0aW9ucyk7XG59XG5mdW5jdGlvbiBkb1dhdGNoKHNvdXJjZSwgY2IsIG9wdGlvbnMgPSBFTVBUWV9PQkopIHtcbiAgY29uc3QgeyBpbW1lZGlhdGUsIGRlZXAsIGZsdXNoLCBvbmNlIH0gPSBvcHRpb25zO1xuICBpZiAoISEocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09IFwicHJvZHVjdGlvblwiKSAmJiAhY2IpIHtcbiAgICBpZiAoaW1tZWRpYXRlICE9PSB2b2lkIDApIHtcbiAgICAgIHdhcm4kMShcbiAgICAgICAgYHdhdGNoKCkgXCJpbW1lZGlhdGVcIiBvcHRpb24gaXMgb25seSByZXNwZWN0ZWQgd2hlbiB1c2luZyB0aGUgd2F0Y2goc291cmNlLCBjYWxsYmFjaywgb3B0aW9ucz8pIHNpZ25hdHVyZS5gXG4gICAgICApO1xuICAgIH1cbiAgICBpZiAoZGVlcCAhPT0gdm9pZCAwKSB7XG4gICAgICB3YXJuJDEoXG4gICAgICAgIGB3YXRjaCgpIFwiZGVlcFwiIG9wdGlvbiBpcyBvbmx5IHJlc3BlY3RlZCB3aGVuIHVzaW5nIHRoZSB3YXRjaChzb3VyY2UsIGNhbGxiYWNrLCBvcHRpb25zPykgc2lnbmF0dXJlLmBcbiAgICAgICk7XG4gICAgfVxuICAgIGlmIChvbmNlICE9PSB2b2lkIDApIHtcbiAgICAgIHdhcm4kMShcbiAgICAgICAgYHdhdGNoKCkgXCJvbmNlXCIgb3B0aW9uIGlzIG9ubHkgcmVzcGVjdGVkIHdoZW4gdXNpbmcgdGhlIHdhdGNoKHNvdXJjZSwgY2FsbGJhY2ssIG9wdGlvbnM/KSBzaWduYXR1cmUuYFxuICAgICAgKTtcbiAgICB9XG4gIH1cbiAgY29uc3QgYmFzZVdhdGNoT3B0aW9ucyA9IGV4dGVuZCh7fSwgb3B0aW9ucyk7XG4gIGlmICghIShwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gXCJwcm9kdWN0aW9uXCIpKSBiYXNlV2F0Y2hPcHRpb25zLm9uV2FybiA9IHdhcm4kMTtcbiAgY29uc3QgcnVuc0ltbWVkaWF0ZWx5ID0gY2IgJiYgaW1tZWRpYXRlIHx8ICFjYiAmJiBmbHVzaCAhPT0gXCJwb3N0XCI7XG4gIGxldCBzc3JDbGVhbnVwO1xuICBpZiAoaXNJblNTUkNvbXBvbmVudFNldHVwKSB7XG4gICAgaWYgKGZsdXNoID09PSBcInN5bmNcIikge1xuICAgICAgY29uc3QgY3R4ID0gdXNlU1NSQ29udGV4dCgpO1xuICAgICAgc3NyQ2xlYW51cCA9IGN0eC5fX3dhdGNoZXJIYW5kbGVzIHx8IChjdHguX193YXRjaGVySGFuZGxlcyA9IFtdKTtcbiAgICB9IGVsc2UgaWYgKCFydW5zSW1tZWRpYXRlbHkpIHtcbiAgICAgIGNvbnN0IHdhdGNoU3RvcEhhbmRsZSA9ICgpID0+IHtcbiAgICAgIH07XG4gICAgICB3YXRjaFN0b3BIYW5kbGUuc3RvcCA9IE5PT1A7XG4gICAgICB3YXRjaFN0b3BIYW5kbGUucmVzdW1lID0gTk9PUDtcbiAgICAgIHdhdGNoU3RvcEhhbmRsZS5wYXVzZSA9IE5PT1A7XG4gICAgICByZXR1cm4gd2F0Y2hTdG9wSGFuZGxlO1xuICAgIH1cbiAgfVxuICBjb25zdCBpbnN0YW5jZSA9IGN1cnJlbnRJbnN0YW5jZTtcbiAgYmFzZVdhdGNoT3B0aW9ucy5jYWxsID0gKGZuLCB0eXBlLCBhcmdzKSA9PiBjYWxsV2l0aEFzeW5jRXJyb3JIYW5kbGluZyhmbiwgaW5zdGFuY2UsIHR5cGUsIGFyZ3MpO1xuICBsZXQgaXNQcmUgPSBmYWxzZTtcbiAgaWYgKGZsdXNoID09PSBcInBvc3RcIikge1xuICAgIGJhc2VXYXRjaE9wdGlvbnMuc2NoZWR1bGVyID0gKGpvYikgPT4ge1xuICAgICAgcXVldWVQb3N0UmVuZGVyRWZmZWN0KGpvYiwgaW5zdGFuY2UgJiYgaW5zdGFuY2Uuc3VzcGVuc2UpO1xuICAgIH07XG4gIH0gZWxzZSBpZiAoZmx1c2ggIT09IFwic3luY1wiKSB7XG4gICAgaXNQcmUgPSB0cnVlO1xuICAgIGJhc2VXYXRjaE9wdGlvbnMuc2NoZWR1bGVyID0gKGpvYiwgaXNGaXJzdFJ1bikgPT4ge1xuICAgICAgaWYgKGlzRmlyc3RSdW4pIHtcbiAgICAgICAgam9iKCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBxdWV1ZUpvYihqb2IpO1xuICAgICAgfVxuICAgIH07XG4gIH1cbiAgYmFzZVdhdGNoT3B0aW9ucy5hdWdtZW50Sm9iID0gKGpvYikgPT4ge1xuICAgIGlmIChjYikge1xuICAgICAgam9iLmZsYWdzIHw9IDQ7XG4gICAgfVxuICAgIGlmIChpc1ByZSkge1xuICAgICAgam9iLmZsYWdzIHw9IDI7XG4gICAgICBpZiAoaW5zdGFuY2UpIHtcbiAgICAgICAgam9iLmlkID0gaW5zdGFuY2UudWlkO1xuICAgICAgICBqb2IuaSA9IGluc3RhbmNlO1xuICAgICAgfVxuICAgIH1cbiAgfTtcbiAgY29uc3Qgd2F0Y2hIYW5kbGUgPSB3YXRjaCQxKHNvdXJjZSwgY2IsIGJhc2VXYXRjaE9wdGlvbnMpO1xuICBpZiAoaXNJblNTUkNvbXBvbmVudFNldHVwKSB7XG4gICAgaWYgKHNzckNsZWFudXApIHtcbiAgICAgIHNzckNsZWFudXAucHVzaCh3YXRjaEhhbmRsZSk7XG4gICAgfSBlbHNlIGlmIChydW5zSW1tZWRpYXRlbHkpIHtcbiAgICAgIHdhdGNoSGFuZGxlKCk7XG4gICAgfVxuICB9XG4gIHJldHVybiB3YXRjaEhhbmRsZTtcbn1cbmZ1bmN0aW9uIGluc3RhbmNlV2F0Y2goc291cmNlLCB2YWx1ZSwgb3B0aW9ucykge1xuICBjb25zdCBwdWJsaWNUaGlzID0gdGhpcy5wcm94eTtcbiAgY29uc3QgZ2V0dGVyID0gaXNTdHJpbmcoc291cmNlKSA/IHNvdXJjZS5pbmNsdWRlcyhcIi5cIikgPyBjcmVhdGVQYXRoR2V0dGVyKHB1YmxpY1RoaXMsIHNvdXJjZSkgOiAoKSA9PiBwdWJsaWNUaGlzW3NvdXJjZV0gOiBzb3VyY2UuYmluZChwdWJsaWNUaGlzLCBwdWJsaWNUaGlzKTtcbiAgbGV0IGNiO1xuICBpZiAoaXNGdW5jdGlvbih2YWx1ZSkpIHtcbiAgICBjYiA9IHZhbHVlO1xuICB9IGVsc2Uge1xuICAgIGNiID0gdmFsdWUuaGFuZGxlcjtcbiAgICBvcHRpb25zID0gdmFsdWU7XG4gIH1cbiAgY29uc3QgcmVzZXQgPSBzZXRDdXJyZW50SW5zdGFuY2UodGhpcyk7XG4gIGNvbnN0IHJlcyA9IGRvV2F0Y2goZ2V0dGVyLCBjYi5iaW5kKHB1YmxpY1RoaXMpLCBvcHRpb25zKTtcbiAgcmVzZXQoKTtcbiAgcmV0dXJuIHJlcztcbn1cbmZ1bmN0aW9uIGNyZWF0ZVBhdGhHZXR0ZXIoY3R4LCBwYXRoKSB7XG4gIGNvbnN0IHNlZ21lbnRzID0gcGF0aC5zcGxpdChcIi5cIik7XG4gIHJldHVybiAoKSA9PiB7XG4gICAgbGV0IGN1ciA9IGN0eDtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHNlZ21lbnRzLmxlbmd0aCAmJiBjdXI7IGkrKykge1xuICAgICAgY3VyID0gY3VyW3NlZ21lbnRzW2ldXTtcbiAgICB9XG4gICAgcmV0dXJuIGN1cjtcbiAgfTtcbn1cblxuY29uc3QgVGVsZXBvcnRFbmRLZXkgPSAvKiBAX19QVVJFX18gKi8gU3ltYm9sKFwiX3Z0ZVwiKTtcbmNvbnN0IGlzVGVsZXBvcnQgPSAodHlwZSkgPT4gdHlwZS5fX2lzVGVsZXBvcnQ7XG5jb25zdCBpc1RlbGVwb3J0RGlzYWJsZWQgPSAocHJvcHMpID0+IHByb3BzICYmIChwcm9wcy5kaXNhYmxlZCB8fCBwcm9wcy5kaXNhYmxlZCA9PT0gXCJcIik7XG5jb25zdCBpc1RlbGVwb3J0RGVmZXJyZWQgPSAocHJvcHMpID0+IHByb3BzICYmIChwcm9wcy5kZWZlciB8fCBwcm9wcy5kZWZlciA9PT0gXCJcIik7XG5jb25zdCBpc1RhcmdldFNWRyA9ICh0YXJnZXQpID0+IHR5cGVvZiBTVkdFbGVtZW50ICE9PSBcInVuZGVmaW5lZFwiICYmIHRhcmdldCBpbnN0YW5jZW9mIFNWR0VsZW1lbnQ7XG5jb25zdCBpc1RhcmdldE1hdGhNTCA9ICh0YXJnZXQpID0+IHR5cGVvZiBNYXRoTUxFbGVtZW50ID09PSBcImZ1bmN0aW9uXCIgJiYgdGFyZ2V0IGluc3RhbmNlb2YgTWF0aE1MRWxlbWVudDtcbmNvbnN0IHJlc29sdmVUYXJnZXQgPSAocHJvcHMsIHNlbGVjdCkgPT4ge1xuICBjb25zdCB0YXJnZXRTZWxlY3RvciA9IHByb3BzICYmIHByb3BzLnRvO1xuICBpZiAoaXNTdHJpbmcodGFyZ2V0U2VsZWN0b3IpKSB7XG4gICAgaWYgKCFzZWxlY3QpIHtcbiAgICAgICEhKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSBcInByb2R1Y3Rpb25cIikgJiYgd2FybiQxKFxuICAgICAgICBgQ3VycmVudCByZW5kZXJlciBkb2VzIG5vdCBzdXBwb3J0IHN0cmluZyB0YXJnZXQgZm9yIFRlbGVwb3J0cy4gKG1pc3NpbmcgcXVlcnlTZWxlY3RvciByZW5kZXJlciBvcHRpb24pYFxuICAgICAgKTtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH0gZWxzZSB7XG4gICAgICBjb25zdCB0YXJnZXQgPSBzZWxlY3QodGFyZ2V0U2VsZWN0b3IpO1xuICAgICAgaWYgKCEhKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSBcInByb2R1Y3Rpb25cIikgJiYgIXRhcmdldCAmJiAhaXNUZWxlcG9ydERpc2FibGVkKHByb3BzKSkge1xuICAgICAgICB3YXJuJDEoXG4gICAgICAgICAgYEZhaWxlZCB0byBsb2NhdGUgVGVsZXBvcnQgdGFyZ2V0IHdpdGggc2VsZWN0b3IgXCIke3RhcmdldFNlbGVjdG9yfVwiLiBOb3RlIHRoZSB0YXJnZXQgZWxlbWVudCBtdXN0IGV4aXN0IGJlZm9yZSB0aGUgY29tcG9uZW50IGlzIG1vdW50ZWQgLSBpLmUuIHRoZSB0YXJnZXQgY2Fubm90IGJlIHJlbmRlcmVkIGJ5IHRoZSBjb21wb25lbnQgaXRzZWxmLCBhbmQgaWRlYWxseSBzaG91bGQgYmUgb3V0c2lkZSBvZiB0aGUgZW50aXJlIFZ1ZSBjb21wb25lbnQgdHJlZS5gXG4gICAgICAgICk7XG4gICAgICB9XG4gICAgICByZXR1cm4gdGFyZ2V0O1xuICAgIH1cbiAgfSBlbHNlIHtcbiAgICBpZiAoISEocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09IFwicHJvZHVjdGlvblwiKSAmJiAhdGFyZ2V0U2VsZWN0b3IgJiYgIWlzVGVsZXBvcnREaXNhYmxlZChwcm9wcykpIHtcbiAgICAgIHdhcm4kMShgSW52YWxpZCBUZWxlcG9ydCB0YXJnZXQ6ICR7dGFyZ2V0U2VsZWN0b3J9YCk7XG4gICAgfVxuICAgIHJldHVybiB0YXJnZXRTZWxlY3RvcjtcbiAgfVxufTtcbmNvbnN0IFRlbGVwb3J0SW1wbCA9IHtcbiAgbmFtZTogXCJUZWxlcG9ydFwiLFxuICBfX2lzVGVsZXBvcnQ6IHRydWUsXG4gIHByb2Nlc3MobjEsIG4yLCBjb250YWluZXIsIGFuY2hvciwgcGFyZW50Q29tcG9uZW50LCBwYXJlbnRTdXNwZW5zZSwgbmFtZXNwYWNlLCBzbG90U2NvcGVJZHMsIG9wdGltaXplZCwgaW50ZXJuYWxzKSB7XG4gICAgY29uc3Qge1xuICAgICAgbWM6IG1vdW50Q2hpbGRyZW4sXG4gICAgICBwYzogcGF0Y2hDaGlsZHJlbixcbiAgICAgIHBiYzogcGF0Y2hCbG9ja0NoaWxkcmVuLFxuICAgICAgbzogeyBpbnNlcnQsIHF1ZXJ5U2VsZWN0b3IsIGNyZWF0ZVRleHQsIGNyZWF0ZUNvbW1lbnQgfVxuICAgIH0gPSBpbnRlcm5hbHM7XG4gICAgY29uc3QgZGlzYWJsZWQgPSBpc1RlbGVwb3J0RGlzYWJsZWQobjIucHJvcHMpO1xuICAgIGxldCB7IHNoYXBlRmxhZywgY2hpbGRyZW4sIGR5bmFtaWNDaGlsZHJlbiB9ID0gbjI7XG4gICAgaWYgKCEhKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSBcInByb2R1Y3Rpb25cIikgJiYgaXNIbXJVcGRhdGluZykge1xuICAgICAgb3B0aW1pemVkID0gZmFsc2U7XG4gICAgICBkeW5hbWljQ2hpbGRyZW4gPSBudWxsO1xuICAgIH1cbiAgICBpZiAobjEgPT0gbnVsbCkge1xuICAgICAgY29uc3QgcGxhY2Vob2xkZXIgPSBuMi5lbCA9ICEhKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSBcInByb2R1Y3Rpb25cIikgPyBjcmVhdGVDb21tZW50KFwidGVsZXBvcnQgc3RhcnRcIikgOiBjcmVhdGVUZXh0KFwiXCIpO1xuICAgICAgY29uc3QgbWFpbkFuY2hvciA9IG4yLmFuY2hvciA9ICEhKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSBcInByb2R1Y3Rpb25cIikgPyBjcmVhdGVDb21tZW50KFwidGVsZXBvcnQgZW5kXCIpIDogY3JlYXRlVGV4dChcIlwiKTtcbiAgICAgIGluc2VydChwbGFjZWhvbGRlciwgY29udGFpbmVyLCBhbmNob3IpO1xuICAgICAgaW5zZXJ0KG1haW5BbmNob3IsIGNvbnRhaW5lciwgYW5jaG9yKTtcbiAgICAgIGNvbnN0IG1vdW50ID0gKGNvbnRhaW5lcjIsIGFuY2hvcjIpID0+IHtcbiAgICAgICAgaWYgKHNoYXBlRmxhZyAmIDE2KSB7XG4gICAgICAgICAgbW91bnRDaGlsZHJlbihcbiAgICAgICAgICAgIGNoaWxkcmVuLFxuICAgICAgICAgICAgY29udGFpbmVyMixcbiAgICAgICAgICAgIGFuY2hvcjIsXG4gICAgICAgICAgICBwYXJlbnRDb21wb25lbnQsXG4gICAgICAgICAgICBwYXJlbnRTdXNwZW5zZSxcbiAgICAgICAgICAgIG5hbWVzcGFjZSxcbiAgICAgICAgICAgIHNsb3RTY29wZUlkcyxcbiAgICAgICAgICAgIG9wdGltaXplZFxuICAgICAgICAgICk7XG4gICAgICAgIH1cbiAgICAgIH07XG4gICAgICBjb25zdCBtb3VudFRvVGFyZ2V0ID0gKCkgPT4ge1xuICAgICAgICBjb25zdCB0YXJnZXQgPSBuMi50YXJnZXQgPSByZXNvbHZlVGFyZ2V0KG4yLnByb3BzLCBxdWVyeVNlbGVjdG9yKTtcbiAgICAgICAgY29uc3QgdGFyZ2V0QW5jaG9yID0gcHJlcGFyZUFuY2hvcih0YXJnZXQsIG4yLCBjcmVhdGVUZXh0LCBpbnNlcnQpO1xuICAgICAgICBpZiAodGFyZ2V0KSB7XG4gICAgICAgICAgaWYgKG5hbWVzcGFjZSAhPT0gXCJzdmdcIiAmJiBpc1RhcmdldFNWRyh0YXJnZXQpKSB7XG4gICAgICAgICAgICBuYW1lc3BhY2UgPSBcInN2Z1wiO1xuICAgICAgICAgIH0gZWxzZSBpZiAobmFtZXNwYWNlICE9PSBcIm1hdGhtbFwiICYmIGlzVGFyZ2V0TWF0aE1MKHRhcmdldCkpIHtcbiAgICAgICAgICAgIG5hbWVzcGFjZSA9IFwibWF0aG1sXCI7XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmIChwYXJlbnRDb21wb25lbnQgJiYgcGFyZW50Q29tcG9uZW50LmlzQ0UpIHtcbiAgICAgICAgICAgIChwYXJlbnRDb21wb25lbnQuY2UuX3RlbGVwb3J0VGFyZ2V0cyB8fCAocGFyZW50Q29tcG9uZW50LmNlLl90ZWxlcG9ydFRhcmdldHMgPSAvKiBAX19QVVJFX18gKi8gbmV3IFNldCgpKSkuYWRkKHRhcmdldCk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmICghZGlzYWJsZWQpIHtcbiAgICAgICAgICAgIG1vdW50KHRhcmdldCwgdGFyZ2V0QW5jaG9yKTtcbiAgICAgICAgICAgIHVwZGF0ZUNzc1ZhcnMobjIsIGZhbHNlKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSBpZiAoISEocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09IFwicHJvZHVjdGlvblwiKSAmJiAhZGlzYWJsZWQpIHtcbiAgICAgICAgICB3YXJuJDEoXG4gICAgICAgICAgICBcIkludmFsaWQgVGVsZXBvcnQgdGFyZ2V0IG9uIG1vdW50OlwiLFxuICAgICAgICAgICAgdGFyZ2V0LFxuICAgICAgICAgICAgYCgke3R5cGVvZiB0YXJnZXR9KWBcbiAgICAgICAgICApO1xuICAgICAgICB9XG4gICAgICB9O1xuICAgICAgaWYgKGRpc2FibGVkKSB7XG4gICAgICAgIG1vdW50KGNvbnRhaW5lciwgbWFpbkFuY2hvcik7XG4gICAgICAgIHVwZGF0ZUNzc1ZhcnMobjIsIHRydWUpO1xuICAgICAgfVxuICAgICAgaWYgKGlzVGVsZXBvcnREZWZlcnJlZChuMi5wcm9wcykpIHtcbiAgICAgICAgbjIuZWwuX19pc01vdW50ZWQgPSBmYWxzZTtcbiAgICAgICAgcXVldWVQb3N0UmVuZGVyRWZmZWN0KCgpID0+IHtcbiAgICAgICAgICBtb3VudFRvVGFyZ2V0KCk7XG4gICAgICAgICAgZGVsZXRlIG4yLmVsLl9faXNNb3VudGVkO1xuICAgICAgICB9LCBwYXJlbnRTdXNwZW5zZSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBtb3VudFRvVGFyZ2V0KCk7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIGlmIChpc1RlbGVwb3J0RGVmZXJyZWQobjIucHJvcHMpICYmIG4xLmVsLl9faXNNb3VudGVkID09PSBmYWxzZSkge1xuICAgICAgICBxdWV1ZVBvc3RSZW5kZXJFZmZlY3QoKCkgPT4ge1xuICAgICAgICAgIFRlbGVwb3J0SW1wbC5wcm9jZXNzKFxuICAgICAgICAgICAgbjEsXG4gICAgICAgICAgICBuMixcbiAgICAgICAgICAgIGNvbnRhaW5lcixcbiAgICAgICAgICAgIGFuY2hvcixcbiAgICAgICAgICAgIHBhcmVudENvbXBvbmVudCxcbiAgICAgICAgICAgIHBhcmVudFN1c3BlbnNlLFxuICAgICAgICAgICAgbmFtZXNwYWNlLFxuICAgICAgICAgICAgc2xvdFNjb3BlSWRzLFxuICAgICAgICAgICAgb3B0aW1pemVkLFxuICAgICAgICAgICAgaW50ZXJuYWxzXG4gICAgICAgICAgKTtcbiAgICAgICAgfSwgcGFyZW50U3VzcGVuc2UpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBuMi5lbCA9IG4xLmVsO1xuICAgICAgbjIudGFyZ2V0U3RhcnQgPSBuMS50YXJnZXRTdGFydDtcbiAgICAgIGNvbnN0IG1haW5BbmNob3IgPSBuMi5hbmNob3IgPSBuMS5hbmNob3I7XG4gICAgICBjb25zdCB0YXJnZXQgPSBuMi50YXJnZXQgPSBuMS50YXJnZXQ7XG4gICAgICBjb25zdCB0YXJnZXRBbmNob3IgPSBuMi50YXJnZXRBbmNob3IgPSBuMS50YXJnZXRBbmNob3I7XG4gICAgICBjb25zdCB3YXNEaXNhYmxlZCA9IGlzVGVsZXBvcnREaXNhYmxlZChuMS5wcm9wcyk7XG4gICAgICBjb25zdCBjdXJyZW50Q29udGFpbmVyID0gd2FzRGlzYWJsZWQgPyBjb250YWluZXIgOiB0YXJnZXQ7XG4gICAgICBjb25zdCBjdXJyZW50QW5jaG9yID0gd2FzRGlzYWJsZWQgPyBtYWluQW5jaG9yIDogdGFyZ2V0QW5jaG9yO1xuICAgICAgaWYgKG5hbWVzcGFjZSA9PT0gXCJzdmdcIiB8fCBpc1RhcmdldFNWRyh0YXJnZXQpKSB7XG4gICAgICAgIG5hbWVzcGFjZSA9IFwic3ZnXCI7XG4gICAgICB9IGVsc2UgaWYgKG5hbWVzcGFjZSA9PT0gXCJtYXRobWxcIiB8fCBpc1RhcmdldE1hdGhNTCh0YXJnZXQpKSB7XG4gICAgICAgIG5hbWVzcGFjZSA9IFwibWF0aG1sXCI7XG4gICAgICB9XG4gICAgICBpZiAoZHluYW1pY0NoaWxkcmVuKSB7XG4gICAgICAgIHBhdGNoQmxvY2tDaGlsZHJlbihcbiAgICAgICAgICBuMS5keW5hbWljQ2hpbGRyZW4sXG4gICAgICAgICAgZHluYW1pY0NoaWxkcmVuLFxuICAgICAgICAgIGN1cnJlbnRDb250YWluZXIsXG4gICAgICAgICAgcGFyZW50Q29tcG9uZW50LFxuICAgICAgICAgIHBhcmVudFN1c3BlbnNlLFxuICAgICAgICAgIG5hbWVzcGFjZSxcbiAgICAgICAgICBzbG90U2NvcGVJZHNcbiAgICAgICAgKTtcbiAgICAgICAgdHJhdmVyc2VTdGF0aWNDaGlsZHJlbihuMSwgbjIsICEhIShwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gXCJwcm9kdWN0aW9uXCIpKTtcbiAgICAgIH0gZWxzZSBpZiAoIW9wdGltaXplZCkge1xuICAgICAgICBwYXRjaENoaWxkcmVuKFxuICAgICAgICAgIG4xLFxuICAgICAgICAgIG4yLFxuICAgICAgICAgIGN1cnJlbnRDb250YWluZXIsXG4gICAgICAgICAgY3VycmVudEFuY2hvcixcbiAgICAgICAgICBwYXJlbnRDb21wb25lbnQsXG4gICAgICAgICAgcGFyZW50U3VzcGVuc2UsXG4gICAgICAgICAgbmFtZXNwYWNlLFxuICAgICAgICAgIHNsb3RTY29wZUlkcyxcbiAgICAgICAgICBmYWxzZVxuICAgICAgICApO1xuICAgICAgfVxuICAgICAgaWYgKGRpc2FibGVkKSB7XG4gICAgICAgIGlmICghd2FzRGlzYWJsZWQpIHtcbiAgICAgICAgICBtb3ZlVGVsZXBvcnQoXG4gICAgICAgICAgICBuMixcbiAgICAgICAgICAgIGNvbnRhaW5lcixcbiAgICAgICAgICAgIG1haW5BbmNob3IsXG4gICAgICAgICAgICBpbnRlcm5hbHMsXG4gICAgICAgICAgICAxXG4gICAgICAgICAgKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBpZiAobjIucHJvcHMgJiYgbjEucHJvcHMgJiYgbjIucHJvcHMudG8gIT09IG4xLnByb3BzLnRvKSB7XG4gICAgICAgICAgICBuMi5wcm9wcy50byA9IG4xLnByb3BzLnRvO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaWYgKChuMi5wcm9wcyAmJiBuMi5wcm9wcy50bykgIT09IChuMS5wcm9wcyAmJiBuMS5wcm9wcy50bykpIHtcbiAgICAgICAgICBjb25zdCBuZXh0VGFyZ2V0ID0gbjIudGFyZ2V0ID0gcmVzb2x2ZVRhcmdldChcbiAgICAgICAgICAgIG4yLnByb3BzLFxuICAgICAgICAgICAgcXVlcnlTZWxlY3RvclxuICAgICAgICAgICk7XG4gICAgICAgICAgaWYgKG5leHRUYXJnZXQpIHtcbiAgICAgICAgICAgIG1vdmVUZWxlcG9ydChcbiAgICAgICAgICAgICAgbjIsXG4gICAgICAgICAgICAgIG5leHRUYXJnZXQsXG4gICAgICAgICAgICAgIG51bGwsXG4gICAgICAgICAgICAgIGludGVybmFscyxcbiAgICAgICAgICAgICAgMFxuICAgICAgICAgICAgKTtcbiAgICAgICAgICB9IGVsc2UgaWYgKCEhKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSBcInByb2R1Y3Rpb25cIikpIHtcbiAgICAgICAgICAgIHdhcm4kMShcbiAgICAgICAgICAgICAgXCJJbnZhbGlkIFRlbGVwb3J0IHRhcmdldCBvbiB1cGRhdGU6XCIsXG4gICAgICAgICAgICAgIHRhcmdldCxcbiAgICAgICAgICAgICAgYCgke3R5cGVvZiB0YXJnZXR9KWBcbiAgICAgICAgICAgICk7XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2UgaWYgKHdhc0Rpc2FibGVkKSB7XG4gICAgICAgICAgbW92ZVRlbGVwb3J0KFxuICAgICAgICAgICAgbjIsXG4gICAgICAgICAgICB0YXJnZXQsXG4gICAgICAgICAgICB0YXJnZXRBbmNob3IsXG4gICAgICAgICAgICBpbnRlcm5hbHMsXG4gICAgICAgICAgICAxXG4gICAgICAgICAgKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgdXBkYXRlQ3NzVmFycyhuMiwgZGlzYWJsZWQpO1xuICAgIH1cbiAgfSxcbiAgcmVtb3ZlKHZub2RlLCBwYXJlbnRDb21wb25lbnQsIHBhcmVudFN1c3BlbnNlLCB7IHVtOiB1bm1vdW50LCBvOiB7IHJlbW92ZTogaG9zdFJlbW92ZSB9IH0sIGRvUmVtb3ZlKSB7XG4gICAgY29uc3Qge1xuICAgICAgc2hhcGVGbGFnLFxuICAgICAgY2hpbGRyZW4sXG4gICAgICBhbmNob3IsXG4gICAgICB0YXJnZXRTdGFydCxcbiAgICAgIHRhcmdldEFuY2hvcixcbiAgICAgIHRhcmdldCxcbiAgICAgIHByb3BzXG4gICAgfSA9IHZub2RlO1xuICAgIGlmICh0YXJnZXQpIHtcbiAgICAgIGhvc3RSZW1vdmUodGFyZ2V0U3RhcnQpO1xuICAgICAgaG9zdFJlbW92ZSh0YXJnZXRBbmNob3IpO1xuICAgIH1cbiAgICBkb1JlbW92ZSAmJiBob3N0UmVtb3ZlKGFuY2hvcik7XG4gICAgaWYgKHNoYXBlRmxhZyAmIDE2KSB7XG4gICAgICBjb25zdCBzaG91bGRSZW1vdmUgPSBkb1JlbW92ZSB8fCAhaXNUZWxlcG9ydERpc2FibGVkKHByb3BzKTtcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgY2hpbGRyZW4ubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgY29uc3QgY2hpbGQgPSBjaGlsZHJlbltpXTtcbiAgICAgICAgdW5tb3VudChcbiAgICAgICAgICBjaGlsZCxcbiAgICAgICAgICBwYXJlbnRDb21wb25lbnQsXG4gICAgICAgICAgcGFyZW50U3VzcGVuc2UsXG4gICAgICAgICAgc2hvdWxkUmVtb3ZlLFxuICAgICAgICAgICEhY2hpbGQuZHluYW1pY0NoaWxkcmVuXG4gICAgICAgICk7XG4gICAgICB9XG4gICAgfVxuICB9LFxuICBtb3ZlOiBtb3ZlVGVsZXBvcnQsXG4gIGh5ZHJhdGU6IGh5ZHJhdGVUZWxlcG9ydFxufTtcbmZ1bmN0aW9uIG1vdmVUZWxlcG9ydCh2bm9kZSwgY29udGFpbmVyLCBwYXJlbnRBbmNob3IsIHsgbzogeyBpbnNlcnQgfSwgbTogbW92ZSB9LCBtb3ZlVHlwZSA9IDIpIHtcbiAgaWYgKG1vdmVUeXBlID09PSAwKSB7XG4gICAgaW5zZXJ0KHZub2RlLnRhcmdldEFuY2hvciwgY29udGFpbmVyLCBwYXJlbnRBbmNob3IpO1xuICB9XG4gIGNvbnN0IHsgZWwsIGFuY2hvciwgc2hhcGVGbGFnLCBjaGlsZHJlbiwgcHJvcHMgfSA9IHZub2RlO1xuICBjb25zdCBpc1Jlb3JkZXIgPSBtb3ZlVHlwZSA9PT0gMjtcbiAgaWYgKGlzUmVvcmRlcikge1xuICAgIGluc2VydChlbCwgY29udGFpbmVyLCBwYXJlbnRBbmNob3IpO1xuICB9XG4gIGlmICghaXNSZW9yZGVyIHx8IGlzVGVsZXBvcnREaXNhYmxlZChwcm9wcykpIHtcbiAgICBpZiAoc2hhcGVGbGFnICYgMTYpIHtcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgY2hpbGRyZW4ubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgbW92ZShcbiAgICAgICAgICBjaGlsZHJlbltpXSxcbiAgICAgICAgICBjb250YWluZXIsXG4gICAgICAgICAgcGFyZW50QW5jaG9yLFxuICAgICAgICAgIDJcbiAgICAgICAgKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgaWYgKGlzUmVvcmRlcikge1xuICAgIGluc2VydChhbmNob3IsIGNvbnRhaW5lciwgcGFyZW50QW5jaG9yKTtcbiAgfVxufVxuZnVuY3Rpb24gaHlkcmF0ZVRlbGVwb3J0KG5vZGUsIHZub2RlLCBwYXJlbnRDb21wb25lbnQsIHBhcmVudFN1c3BlbnNlLCBzbG90U2NvcGVJZHMsIG9wdGltaXplZCwge1xuICBvOiB7IG5leHRTaWJsaW5nLCBwYXJlbnROb2RlLCBxdWVyeVNlbGVjdG9yLCBpbnNlcnQsIGNyZWF0ZVRleHQgfVxufSwgaHlkcmF0ZUNoaWxkcmVuKSB7XG4gIGZ1bmN0aW9uIGh5ZHJhdGVBbmNob3IodGFyZ2V0MiwgdGFyZ2V0Tm9kZSkge1xuICAgIGxldCB0YXJnZXRBbmNob3IgPSB0YXJnZXROb2RlO1xuICAgIHdoaWxlICh0YXJnZXRBbmNob3IpIHtcbiAgICAgIGlmICh0YXJnZXRBbmNob3IgJiYgdGFyZ2V0QW5jaG9yLm5vZGVUeXBlID09PSA4KSB7XG4gICAgICAgIGlmICh0YXJnZXRBbmNob3IuZGF0YSA9PT0gXCJ0ZWxlcG9ydCBzdGFydCBhbmNob3JcIikge1xuICAgICAgICAgIHZub2RlLnRhcmdldFN0YXJ0ID0gdGFyZ2V0QW5jaG9yO1xuICAgICAgICB9IGVsc2UgaWYgKHRhcmdldEFuY2hvci5kYXRhID09PSBcInRlbGVwb3J0IGFuY2hvclwiKSB7XG4gICAgICAgICAgdm5vZGUudGFyZ2V0QW5jaG9yID0gdGFyZ2V0QW5jaG9yO1xuICAgICAgICAgIHRhcmdldDIuX2xwYSA9IHZub2RlLnRhcmdldEFuY2hvciAmJiBuZXh0U2libGluZyh2bm9kZS50YXJnZXRBbmNob3IpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICB0YXJnZXRBbmNob3IgPSBuZXh0U2libGluZyh0YXJnZXRBbmNob3IpO1xuICAgIH1cbiAgfVxuICBmdW5jdGlvbiBoeWRyYXRlRGlzYWJsZWRUZWxlcG9ydChub2RlMiwgdm5vZGUyKSB7XG4gICAgdm5vZGUyLmFuY2hvciA9IGh5ZHJhdGVDaGlsZHJlbihcbiAgICAgIG5leHRTaWJsaW5nKG5vZGUyKSxcbiAgICAgIHZub2RlMixcbiAgICAgIHBhcmVudE5vZGUobm9kZTIpLFxuICAgICAgcGFyZW50Q29tcG9uZW50LFxuICAgICAgcGFyZW50U3VzcGVuc2UsXG4gICAgICBzbG90U2NvcGVJZHMsXG4gICAgICBvcHRpbWl6ZWRcbiAgICApO1xuICB9XG4gIGNvbnN0IHRhcmdldCA9IHZub2RlLnRhcmdldCA9IHJlc29sdmVUYXJnZXQoXG4gICAgdm5vZGUucHJvcHMsXG4gICAgcXVlcnlTZWxlY3RvclxuICApO1xuICBjb25zdCBkaXNhYmxlZCA9IGlzVGVsZXBvcnREaXNhYmxlZCh2bm9kZS5wcm9wcyk7XG4gIGlmICh0YXJnZXQpIHtcbiAgICBjb25zdCB0YXJnZXROb2RlID0gdGFyZ2V0Ll9scGEgfHwgdGFyZ2V0LmZpcnN0Q2hpbGQ7XG4gICAgaWYgKHZub2RlLnNoYXBlRmxhZyAmIDE2KSB7XG4gICAgICBpZiAoZGlzYWJsZWQpIHtcbiAgICAgICAgaHlkcmF0ZURpc2FibGVkVGVsZXBvcnQobm9kZSwgdm5vZGUpO1xuICAgICAgICBoeWRyYXRlQW5jaG9yKHRhcmdldCwgdGFyZ2V0Tm9kZSk7XG4gICAgICAgIGlmICghdm5vZGUudGFyZ2V0QW5jaG9yKSB7XG4gICAgICAgICAgcHJlcGFyZUFuY2hvcihcbiAgICAgICAgICAgIHRhcmdldCxcbiAgICAgICAgICAgIHZub2RlLFxuICAgICAgICAgICAgY3JlYXRlVGV4dCxcbiAgICAgICAgICAgIGluc2VydCxcbiAgICAgICAgICAgIC8vIGlmIHRhcmdldCBpcyB0aGUgc2FtZSBhcyB0aGUgbWFpbiB2aWV3LCBpbnNlcnQgYW5jaG9ycyBiZWZvcmUgY3VycmVudCBub2RlXG4gICAgICAgICAgICAvLyB0byBhdm9pZCBoeWRyYXRpbmcgbWlzbWF0Y2hcbiAgICAgICAgICAgIHBhcmVudE5vZGUobm9kZSkgPT09IHRhcmdldCA/IG5vZGUgOiBudWxsXG4gICAgICAgICAgKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdm5vZGUuYW5jaG9yID0gbmV4dFNpYmxpbmcobm9kZSk7XG4gICAgICAgIGh5ZHJhdGVBbmNob3IodGFyZ2V0LCB0YXJnZXROb2RlKTtcbiAgICAgICAgaWYgKCF2bm9kZS50YXJnZXRBbmNob3IpIHtcbiAgICAgICAgICBwcmVwYXJlQW5jaG9yKHRhcmdldCwgdm5vZGUsIGNyZWF0ZVRleHQsIGluc2VydCk7XG4gICAgICAgIH1cbiAgICAgICAgaHlkcmF0ZUNoaWxkcmVuKFxuICAgICAgICAgIHRhcmdldE5vZGUgJiYgbmV4dFNpYmxpbmcodGFyZ2V0Tm9kZSksXG4gICAgICAgICAgdm5vZGUsXG4gICAgICAgICAgdGFyZ2V0LFxuICAgICAgICAgIHBhcmVudENvbXBvbmVudCxcbiAgICAgICAgICBwYXJlbnRTdXNwZW5zZSxcbiAgICAgICAgICBzbG90U2NvcGVJZHMsXG4gICAgICAgICAgb3B0aW1pemVkXG4gICAgICAgICk7XG4gICAgICB9XG4gICAgfVxuICAgIHVwZGF0ZUNzc1ZhcnModm5vZGUsIGRpc2FibGVkKTtcbiAgfSBlbHNlIGlmIChkaXNhYmxlZCkge1xuICAgIGlmICh2bm9kZS5zaGFwZUZsYWcgJiAxNikge1xuICAgICAgaHlkcmF0ZURpc2FibGVkVGVsZXBvcnQobm9kZSwgdm5vZGUpO1xuICAgICAgdm5vZGUudGFyZ2V0U3RhcnQgPSBub2RlO1xuICAgICAgdm5vZGUudGFyZ2V0QW5jaG9yID0gbmV4dFNpYmxpbmcobm9kZSk7XG4gICAgfVxuICB9XG4gIHJldHVybiB2bm9kZS5hbmNob3IgJiYgbmV4dFNpYmxpbmcodm5vZGUuYW5jaG9yKTtcbn1cbmNvbnN0IFRlbGVwb3J0ID0gVGVsZXBvcnRJbXBsO1xuZnVuY3Rpb24gdXBkYXRlQ3NzVmFycyh2bm9kZSwgaXNEaXNhYmxlZCkge1xuICBjb25zdCBjdHggPSB2bm9kZS5jdHg7XG4gIGlmIChjdHggJiYgY3R4LnV0KSB7XG4gICAgbGV0IG5vZGUsIGFuY2hvcjtcbiAgICBpZiAoaXNEaXNhYmxlZCkge1xuICAgICAgbm9kZSA9IHZub2RlLmVsO1xuICAgICAgYW5jaG9yID0gdm5vZGUuYW5jaG9yO1xuICAgIH0gZWxzZSB7XG4gICAgICBub2RlID0gdm5vZGUudGFyZ2V0U3RhcnQ7XG4gICAgICBhbmNob3IgPSB2bm9kZS50YXJnZXRBbmNob3I7XG4gICAgfVxuICAgIHdoaWxlIChub2RlICYmIG5vZGUgIT09IGFuY2hvcikge1xuICAgICAgaWYgKG5vZGUubm9kZVR5cGUgPT09IDEpIG5vZGUuc2V0QXR0cmlidXRlKFwiZGF0YS12LW93bmVyXCIsIGN0eC51aWQpO1xuICAgICAgbm9kZSA9IG5vZGUubmV4dFNpYmxpbmc7XG4gICAgfVxuICAgIGN0eC51dCgpO1xuICB9XG59XG5mdW5jdGlvbiBwcmVwYXJlQW5jaG9yKHRhcmdldCwgdm5vZGUsIGNyZWF0ZVRleHQsIGluc2VydCwgYW5jaG9yID0gbnVsbCkge1xuICBjb25zdCB0YXJnZXRTdGFydCA9IHZub2RlLnRhcmdldFN0YXJ0ID0gY3JlYXRlVGV4dChcIlwiKTtcbiAgY29uc3QgdGFyZ2V0QW5jaG9yID0gdm5vZGUudGFyZ2V0QW5jaG9yID0gY3JlYXRlVGV4dChcIlwiKTtcbiAgdGFyZ2V0U3RhcnRbVGVsZXBvcnRFbmRLZXldID0gdGFyZ2V0QW5jaG9yO1xuICBpZiAodGFyZ2V0KSB7XG4gICAgaW5zZXJ0KHRhcmdldFN0YXJ0LCB0YXJnZXQsIGFuY2hvcik7XG4gICAgaW5zZXJ0KHRhcmdldEFuY2hvciwgdGFyZ2V0LCBhbmNob3IpO1xuICB9XG4gIHJldHVybiB0YXJnZXRBbmNob3I7XG59XG5cbmNvbnN0IGxlYXZlQ2JLZXkgPSAvKiBAX19QVVJFX18gKi8gU3ltYm9sKFwiX2xlYXZlQ2JcIik7XG5jb25zdCBlbnRlckNiS2V5ID0gLyogQF9fUFVSRV9fICovIFN5bWJvbChcIl9lbnRlckNiXCIpO1xuZnVuY3Rpb24gdXNlVHJhbnNpdGlvblN0YXRlKCkge1xuICBjb25zdCBzdGF0ZSA9IHtcbiAgICBpc01vdW50ZWQ6IGZhbHNlLFxuICAgIGlzTGVhdmluZzogZmFsc2UsXG4gICAgaXNVbm1vdW50aW5nOiBmYWxzZSxcbiAgICBsZWF2aW5nVk5vZGVzOiAvKiBAX19QVVJFX18gKi8gbmV3IE1hcCgpXG4gIH07XG4gIG9uTW91bnRlZCgoKSA9PiB7XG4gICAgc3RhdGUuaXNNb3VudGVkID0gdHJ1ZTtcbiAgfSk7XG4gIG9uQmVmb3JlVW5tb3VudCgoKSA9PiB7XG4gICAgc3RhdGUuaXNVbm1vdW50aW5nID0gdHJ1ZTtcbiAgfSk7XG4gIHJldHVybiBzdGF0ZTtcbn1cbmNvbnN0IFRyYW5zaXRpb25Ib29rVmFsaWRhdG9yID0gW0Z1bmN0aW9uLCBBcnJheV07XG5jb25zdCBCYXNlVHJhbnNpdGlvblByb3BzVmFsaWRhdG9ycyA9IHtcbiAgbW9kZTogU3RyaW5nLFxuICBhcHBlYXI6IEJvb2xlYW4sXG4gIHBlcnNpc3RlZDogQm9vbGVhbixcbiAgLy8gZW50ZXJcbiAgb25CZWZvcmVFbnRlcjogVHJhbnNpdGlvbkhvb2tWYWxpZGF0b3IsXG4gIG9uRW50ZXI6IFRyYW5zaXRpb25Ib29rVmFsaWRhdG9yLFxuICBvbkFmdGVyRW50ZXI6IFRyYW5zaXRpb25Ib29rVmFsaWRhdG9yLFxuICBvbkVudGVyQ2FuY2VsbGVkOiBUcmFuc2l0aW9uSG9va1ZhbGlkYXRvcixcbiAgLy8gbGVhdmVcbiAgb25CZWZvcmVMZWF2ZTogVHJhbnNpdGlvbkhvb2tWYWxpZGF0b3IsXG4gIG9uTGVhdmU6IFRyYW5zaXRpb25Ib29rVmFsaWRhdG9yLFxuICBvbkFmdGVyTGVhdmU6IFRyYW5zaXRpb25Ib29rVmFsaWRhdG9yLFxuICBvbkxlYXZlQ2FuY2VsbGVkOiBUcmFuc2l0aW9uSG9va1ZhbGlkYXRvcixcbiAgLy8gYXBwZWFyXG4gIG9uQmVmb3JlQXBwZWFyOiBUcmFuc2l0aW9uSG9va1ZhbGlkYXRvcixcbiAgb25BcHBlYXI6IFRyYW5zaXRpb25Ib29rVmFsaWRhdG9yLFxuICBvbkFmdGVyQXBwZWFyOiBUcmFuc2l0aW9uSG9va1ZhbGlkYXRvcixcbiAgb25BcHBlYXJDYW5jZWxsZWQ6IFRyYW5zaXRpb25Ib29rVmFsaWRhdG9yXG59O1xuY29uc3QgcmVjdXJzaXZlR2V0U3VidHJlZSA9IChpbnN0YW5jZSkgPT4ge1xuICBjb25zdCBzdWJUcmVlID0gaW5zdGFuY2Uuc3ViVHJlZTtcbiAgcmV0dXJuIHN1YlRyZWUuY29tcG9uZW50ID8gcmVjdXJzaXZlR2V0U3VidHJlZShzdWJUcmVlLmNvbXBvbmVudCkgOiBzdWJUcmVlO1xufTtcbmNvbnN0IEJhc2VUcmFuc2l0aW9uSW1wbCA9IHtcbiAgbmFtZTogYEJhc2VUcmFuc2l0aW9uYCxcbiAgcHJvcHM6IEJhc2VUcmFuc2l0aW9uUHJvcHNWYWxpZGF0b3JzLFxuICBzZXR1cChwcm9wcywgeyBzbG90cyB9KSB7XG4gICAgY29uc3QgaW5zdGFuY2UgPSBnZXRDdXJyZW50SW5zdGFuY2UoKTtcbiAgICBjb25zdCBzdGF0ZSA9IHVzZVRyYW5zaXRpb25TdGF0ZSgpO1xuICAgIHJldHVybiAoKSA9PiB7XG4gICAgICBjb25zdCBjaGlsZHJlbiA9IHNsb3RzLmRlZmF1bHQgJiYgZ2V0VHJhbnNpdGlvblJhd0NoaWxkcmVuKHNsb3RzLmRlZmF1bHQoKSwgdHJ1ZSk7XG4gICAgICBpZiAoIWNoaWxkcmVuIHx8ICFjaGlsZHJlbi5sZW5ndGgpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgY29uc3QgY2hpbGQgPSBmaW5kTm9uQ29tbWVudENoaWxkKGNoaWxkcmVuKTtcbiAgICAgIGNvbnN0IHJhd1Byb3BzID0gdG9SYXcocHJvcHMpO1xuICAgICAgY29uc3QgeyBtb2RlIH0gPSByYXdQcm9wcztcbiAgICAgIGlmICghIShwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gXCJwcm9kdWN0aW9uXCIpICYmIG1vZGUgJiYgbW9kZSAhPT0gXCJpbi1vdXRcIiAmJiBtb2RlICE9PSBcIm91dC1pblwiICYmIG1vZGUgIT09IFwiZGVmYXVsdFwiKSB7XG4gICAgICAgIHdhcm4kMShgaW52YWxpZCA8dHJhbnNpdGlvbj4gbW9kZTogJHttb2RlfWApO1xuICAgICAgfVxuICAgICAgaWYgKHN0YXRlLmlzTGVhdmluZykge1xuICAgICAgICByZXR1cm4gZW1wdHlQbGFjZWhvbGRlcihjaGlsZCk7XG4gICAgICB9XG4gICAgICBjb25zdCBpbm5lckNoaWxkID0gZ2V0SW5uZXJDaGlsZCQxKGNoaWxkKTtcbiAgICAgIGlmICghaW5uZXJDaGlsZCkge1xuICAgICAgICByZXR1cm4gZW1wdHlQbGFjZWhvbGRlcihjaGlsZCk7XG4gICAgICB9XG4gICAgICBsZXQgZW50ZXJIb29rcyA9IHJlc29sdmVUcmFuc2l0aW9uSG9va3MoXG4gICAgICAgIGlubmVyQ2hpbGQsXG4gICAgICAgIHJhd1Byb3BzLFxuICAgICAgICBzdGF0ZSxcbiAgICAgICAgaW5zdGFuY2UsXG4gICAgICAgIC8vICMxMTA2MSwgZW5zdXJlIGVudGVySG9va3MgaXMgZnJlc2ggYWZ0ZXIgY2xvbmVcbiAgICAgICAgKGhvb2tzKSA9PiBlbnRlckhvb2tzID0gaG9va3NcbiAgICAgICk7XG4gICAgICBpZiAoaW5uZXJDaGlsZC50eXBlICE9PSBDb21tZW50KSB7XG4gICAgICAgIHNldFRyYW5zaXRpb25Ib29rcyhpbm5lckNoaWxkLCBlbnRlckhvb2tzKTtcbiAgICAgIH1cbiAgICAgIGxldCBvbGRJbm5lckNoaWxkID0gaW5zdGFuY2Uuc3ViVHJlZSAmJiBnZXRJbm5lckNoaWxkJDEoaW5zdGFuY2Uuc3ViVHJlZSk7XG4gICAgICBpZiAob2xkSW5uZXJDaGlsZCAmJiBvbGRJbm5lckNoaWxkLnR5cGUgIT09IENvbW1lbnQgJiYgIWlzU2FtZVZOb2RlVHlwZShvbGRJbm5lckNoaWxkLCBpbm5lckNoaWxkKSAmJiByZWN1cnNpdmVHZXRTdWJ0cmVlKGluc3RhbmNlKS50eXBlICE9PSBDb21tZW50KSB7XG4gICAgICAgIGxldCBsZWF2aW5nSG9va3MgPSByZXNvbHZlVHJhbnNpdGlvbkhvb2tzKFxuICAgICAgICAgIG9sZElubmVyQ2hpbGQsXG4gICAgICAgICAgcmF3UHJvcHMsXG4gICAgICAgICAgc3RhdGUsXG4gICAgICAgICAgaW5zdGFuY2VcbiAgICAgICAgKTtcbiAgICAgICAgc2V0VHJhbnNpdGlvbkhvb2tzKG9sZElubmVyQ2hpbGQsIGxlYXZpbmdIb29rcyk7XG4gICAgICAgIGlmIChtb2RlID09PSBcIm91dC1pblwiICYmIGlubmVyQ2hpbGQudHlwZSAhPT0gQ29tbWVudCkge1xuICAgICAgICAgIHN0YXRlLmlzTGVhdmluZyA9IHRydWU7XG4gICAgICAgICAgbGVhdmluZ0hvb2tzLmFmdGVyTGVhdmUgPSAoKSA9PiB7XG4gICAgICAgICAgICBzdGF0ZS5pc0xlYXZpbmcgPSBmYWxzZTtcbiAgICAgICAgICAgIGlmICghKGluc3RhbmNlLmpvYi5mbGFncyAmIDgpKSB7XG4gICAgICAgICAgICAgIGluc3RhbmNlLnVwZGF0ZSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZGVsZXRlIGxlYXZpbmdIb29rcy5hZnRlckxlYXZlO1xuICAgICAgICAgICAgb2xkSW5uZXJDaGlsZCA9IHZvaWQgMDtcbiAgICAgICAgICB9O1xuICAgICAgICAgIHJldHVybiBlbXB0eVBsYWNlaG9sZGVyKGNoaWxkKTtcbiAgICAgICAgfSBlbHNlIGlmIChtb2RlID09PSBcImluLW91dFwiICYmIGlubmVyQ2hpbGQudHlwZSAhPT0gQ29tbWVudCkge1xuICAgICAgICAgIGxlYXZpbmdIb29rcy5kZWxheUxlYXZlID0gKGVsLCBlYXJseVJlbW92ZSwgZGVsYXllZExlYXZlKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBsZWF2aW5nVk5vZGVzQ2FjaGUgPSBnZXRMZWF2aW5nTm9kZXNGb3JUeXBlKFxuICAgICAgICAgICAgICBzdGF0ZSxcbiAgICAgICAgICAgICAgb2xkSW5uZXJDaGlsZFxuICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIGxlYXZpbmdWTm9kZXNDYWNoZVtTdHJpbmcob2xkSW5uZXJDaGlsZC5rZXkpXSA9IG9sZElubmVyQ2hpbGQ7XG4gICAgICAgICAgICBlbFtsZWF2ZUNiS2V5XSA9ICgpID0+IHtcbiAgICAgICAgICAgICAgZWFybHlSZW1vdmUoKTtcbiAgICAgICAgICAgICAgZWxbbGVhdmVDYktleV0gPSB2b2lkIDA7XG4gICAgICAgICAgICAgIGRlbGV0ZSBlbnRlckhvb2tzLmRlbGF5ZWRMZWF2ZTtcbiAgICAgICAgICAgICAgb2xkSW5uZXJDaGlsZCA9IHZvaWQgMDtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBlbnRlckhvb2tzLmRlbGF5ZWRMZWF2ZSA9ICgpID0+IHtcbiAgICAgICAgICAgICAgZGVsYXllZExlYXZlKCk7XG4gICAgICAgICAgICAgIGRlbGV0ZSBlbnRlckhvb2tzLmRlbGF5ZWRMZWF2ZTtcbiAgICAgICAgICAgICAgb2xkSW5uZXJDaGlsZCA9IHZvaWQgMDtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgfTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBvbGRJbm5lckNoaWxkID0gdm9pZCAwO1xuICAgICAgICB9XG4gICAgICB9IGVsc2UgaWYgKG9sZElubmVyQ2hpbGQpIHtcbiAgICAgICAgb2xkSW5uZXJDaGlsZCA9IHZvaWQgMDtcbiAgICAgIH1cbiAgICAgIHJldHVybiBjaGlsZDtcbiAgICB9O1xuICB9XG59O1xuZnVuY3Rpb24gZmluZE5vbkNvbW1lbnRDaGlsZChjaGlsZHJlbikge1xuICBsZXQgY2hpbGQgPSBjaGlsZHJlblswXTtcbiAgaWYgKGNoaWxkcmVuLmxlbmd0aCA+IDEpIHtcbiAgICBsZXQgaGFzRm91bmQgPSBmYWxzZTtcbiAgICBmb3IgKGNvbnN0IGMgb2YgY2hpbGRyZW4pIHtcbiAgICAgIGlmIChjLnR5cGUgIT09IENvbW1lbnQpIHtcbiAgICAgICAgaWYgKCEhKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSBcInByb2R1Y3Rpb25cIikgJiYgaGFzRm91bmQpIHtcbiAgICAgICAgICB3YXJuJDEoXG4gICAgICAgICAgICBcIjx0cmFuc2l0aW9uPiBjYW4gb25seSBiZSB1c2VkIG9uIGEgc2luZ2xlIGVsZW1lbnQgb3IgY29tcG9uZW50LiBVc2UgPHRyYW5zaXRpb24tZ3JvdXA+IGZvciBsaXN0cy5cIlxuICAgICAgICAgICk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgY2hpbGQgPSBjO1xuICAgICAgICBoYXNGb3VuZCA9IHRydWU7XG4gICAgICAgIGlmICghISEocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09IFwicHJvZHVjdGlvblwiKSkgYnJlYWs7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIHJldHVybiBjaGlsZDtcbn1cbmNvbnN0IEJhc2VUcmFuc2l0aW9uID0gQmFzZVRyYW5zaXRpb25JbXBsO1xuZnVuY3Rpb24gZ2V0TGVhdmluZ05vZGVzRm9yVHlwZShzdGF0ZSwgdm5vZGUpIHtcbiAgY29uc3QgeyBsZWF2aW5nVk5vZGVzIH0gPSBzdGF0ZTtcbiAgbGV0IGxlYXZpbmdWTm9kZXNDYWNoZSA9IGxlYXZpbmdWTm9kZXMuZ2V0KHZub2RlLnR5cGUpO1xuICBpZiAoIWxlYXZpbmdWTm9kZXNDYWNoZSkge1xuICAgIGxlYXZpbmdWTm9kZXNDYWNoZSA9IC8qIEBfX1BVUkVfXyAqLyBPYmplY3QuY3JlYXRlKG51bGwpO1xuICAgIGxlYXZpbmdWTm9kZXMuc2V0KHZub2RlLnR5cGUsIGxlYXZpbmdWTm9kZXNDYWNoZSk7XG4gIH1cbiAgcmV0dXJuIGxlYXZpbmdWTm9kZXNDYWNoZTtcbn1cbmZ1bmN0aW9uIHJlc29sdmVUcmFuc2l0aW9uSG9va3Modm5vZGUsIHByb3BzLCBzdGF0ZSwgaW5zdGFuY2UsIHBvc3RDbG9uZSkge1xuICBjb25zdCB7XG4gICAgYXBwZWFyLFxuICAgIG1vZGUsXG4gICAgcGVyc2lzdGVkID0gZmFsc2UsXG4gICAgb25CZWZvcmVFbnRlcixcbiAgICBvbkVudGVyLFxuICAgIG9uQWZ0ZXJFbnRlcixcbiAgICBvbkVudGVyQ2FuY2VsbGVkLFxuICAgIG9uQmVmb3JlTGVhdmUsXG4gICAgb25MZWF2ZSxcbiAgICBvbkFmdGVyTGVhdmUsXG4gICAgb25MZWF2ZUNhbmNlbGxlZCxcbiAgICBvbkJlZm9yZUFwcGVhcixcbiAgICBvbkFwcGVhcixcbiAgICBvbkFmdGVyQXBwZWFyLFxuICAgIG9uQXBwZWFyQ2FuY2VsbGVkXG4gIH0gPSBwcm9wcztcbiAgY29uc3Qga2V5ID0gU3RyaW5nKHZub2RlLmtleSk7XG4gIGNvbnN0IGxlYXZpbmdWTm9kZXNDYWNoZSA9IGdldExlYXZpbmdOb2Rlc0ZvclR5cGUoc3RhdGUsIHZub2RlKTtcbiAgY29uc3QgY2FsbEhvb2sgPSAoaG9vaywgYXJncykgPT4ge1xuICAgIGhvb2sgJiYgY2FsbFdpdGhBc3luY0Vycm9ySGFuZGxpbmcoXG4gICAgICBob29rLFxuICAgICAgaW5zdGFuY2UsXG4gICAgICA5LFxuICAgICAgYXJnc1xuICAgICk7XG4gIH07XG4gIGNvbnN0IGNhbGxBc3luY0hvb2sgPSAoaG9vaywgYXJncykgPT4ge1xuICAgIGNvbnN0IGRvbmUgPSBhcmdzWzFdO1xuICAgIGNhbGxIb29rKGhvb2ssIGFyZ3MpO1xuICAgIGlmIChpc0FycmF5KGhvb2spKSB7XG4gICAgICBpZiAoaG9vay5ldmVyeSgoaG9vazIpID0+IGhvb2syLmxlbmd0aCA8PSAxKSkgZG9uZSgpO1xuICAgIH0gZWxzZSBpZiAoaG9vay5sZW5ndGggPD0gMSkge1xuICAgICAgZG9uZSgpO1xuICAgIH1cbiAgfTtcbiAgY29uc3QgaG9va3MgPSB7XG4gICAgbW9kZSxcbiAgICBwZXJzaXN0ZWQsXG4gICAgYmVmb3JlRW50ZXIoZWwpIHtcbiAgICAgIGxldCBob29rID0gb25CZWZvcmVFbnRlcjtcbiAgICAgIGlmICghc3RhdGUuaXNNb3VudGVkKSB7XG4gICAgICAgIGlmIChhcHBlYXIpIHtcbiAgICAgICAgICBob29rID0gb25CZWZvcmVBcHBlYXIgfHwgb25CZWZvcmVFbnRlcjtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGlmIChlbFtsZWF2ZUNiS2V5XSkge1xuICAgICAgICBlbFtsZWF2ZUNiS2V5XShcbiAgICAgICAgICB0cnVlXG4gICAgICAgICAgLyogY2FuY2VsbGVkICovXG4gICAgICAgICk7XG4gICAgICB9XG4gICAgICBjb25zdCBsZWF2aW5nVk5vZGUgPSBsZWF2aW5nVk5vZGVzQ2FjaGVba2V5XTtcbiAgICAgIGlmIChsZWF2aW5nVk5vZGUgJiYgaXNTYW1lVk5vZGVUeXBlKHZub2RlLCBsZWF2aW5nVk5vZGUpICYmIGxlYXZpbmdWTm9kZS5lbFtsZWF2ZUNiS2V5XSkge1xuICAgICAgICBsZWF2aW5nVk5vZGUuZWxbbGVhdmVDYktleV0oKTtcbiAgICAgIH1cbiAgICAgIGNhbGxIb29rKGhvb2ssIFtlbF0pO1xuICAgIH0sXG4gICAgZW50ZXIoZWwpIHtcbiAgICAgIGxldCBob29rID0gb25FbnRlcjtcbiAgICAgIGxldCBhZnRlckhvb2sgPSBvbkFmdGVyRW50ZXI7XG4gICAgICBsZXQgY2FuY2VsSG9vayA9IG9uRW50ZXJDYW5jZWxsZWQ7XG4gICAgICBpZiAoIXN0YXRlLmlzTW91bnRlZCkge1xuICAgICAgICBpZiAoYXBwZWFyKSB7XG4gICAgICAgICAgaG9vayA9IG9uQXBwZWFyIHx8IG9uRW50ZXI7XG4gICAgICAgICAgYWZ0ZXJIb29rID0gb25BZnRlckFwcGVhciB8fCBvbkFmdGVyRW50ZXI7XG4gICAgICAgICAgY2FuY2VsSG9vayA9IG9uQXBwZWFyQ2FuY2VsbGVkIHx8IG9uRW50ZXJDYW5jZWxsZWQ7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBsZXQgY2FsbGVkID0gZmFsc2U7XG4gICAgICBlbFtlbnRlckNiS2V5XSA9IChjYW5jZWxsZWQpID0+IHtcbiAgICAgICAgaWYgKGNhbGxlZCkgcmV0dXJuO1xuICAgICAgICBjYWxsZWQgPSB0cnVlO1xuICAgICAgICBpZiAoY2FuY2VsbGVkKSB7XG4gICAgICAgICAgY2FsbEhvb2soY2FuY2VsSG9vaywgW2VsXSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgY2FsbEhvb2soYWZ0ZXJIb29rLCBbZWxdKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoaG9va3MuZGVsYXllZExlYXZlKSB7XG4gICAgICAgICAgaG9va3MuZGVsYXllZExlYXZlKCk7XG4gICAgICAgIH1cbiAgICAgICAgZWxbZW50ZXJDYktleV0gPSB2b2lkIDA7XG4gICAgICB9O1xuICAgICAgY29uc3QgZG9uZSA9IGVsW2VudGVyQ2JLZXldLmJpbmQobnVsbCwgZmFsc2UpO1xuICAgICAgaWYgKGhvb2spIHtcbiAgICAgICAgY2FsbEFzeW5jSG9vayhob29rLCBbZWwsIGRvbmVdKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGRvbmUoKTtcbiAgICAgIH1cbiAgICB9LFxuICAgIGxlYXZlKGVsLCByZW1vdmUpIHtcbiAgICAgIGNvbnN0IGtleTIgPSBTdHJpbmcodm5vZGUua2V5KTtcbiAgICAgIGlmIChlbFtlbnRlckNiS2V5XSkge1xuICAgICAgICBlbFtlbnRlckNiS2V5XShcbiAgICAgICAgICB0cnVlXG4gICAgICAgICAgLyogY2FuY2VsbGVkICovXG4gICAgICAgICk7XG4gICAgICB9XG4gICAgICBpZiAoc3RhdGUuaXNVbm1vdW50aW5nKSB7XG4gICAgICAgIHJldHVybiByZW1vdmUoKTtcbiAgICAgIH1cbiAgICAgIGNhbGxIb29rKG9uQmVmb3JlTGVhdmUsIFtlbF0pO1xuICAgICAgbGV0IGNhbGxlZCA9IGZhbHNlO1xuICAgICAgZWxbbGVhdmVDYktleV0gPSAoY2FuY2VsbGVkKSA9PiB7XG4gICAgICAgIGlmIChjYWxsZWQpIHJldHVybjtcbiAgICAgICAgY2FsbGVkID0gdHJ1ZTtcbiAgICAgICAgcmVtb3ZlKCk7XG4gICAgICAgIGlmIChjYW5jZWxsZWQpIHtcbiAgICAgICAgICBjYWxsSG9vayhvbkxlYXZlQ2FuY2VsbGVkLCBbZWxdKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBjYWxsSG9vayhvbkFmdGVyTGVhdmUsIFtlbF0pO1xuICAgICAgICB9XG4gICAgICAgIGVsW2xlYXZlQ2JLZXldID0gdm9pZCAwO1xuICAgICAgICBpZiAobGVhdmluZ1ZOb2Rlc0NhY2hlW2tleTJdID09PSB2bm9kZSkge1xuICAgICAgICAgIGRlbGV0ZSBsZWF2aW5nVk5vZGVzQ2FjaGVba2V5Ml07XG4gICAgICAgIH1cbiAgICAgIH07XG4gICAgICBjb25zdCBkb25lID0gZWxbbGVhdmVDYktleV0uYmluZChudWxsLCBmYWxzZSk7XG4gICAgICBsZWF2aW5nVk5vZGVzQ2FjaGVba2V5Ml0gPSB2bm9kZTtcbiAgICAgIGlmIChvbkxlYXZlKSB7XG4gICAgICAgIGNhbGxBc3luY0hvb2sob25MZWF2ZSwgW2VsLCBkb25lXSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBkb25lKCk7XG4gICAgICB9XG4gICAgfSxcbiAgICBjbG9uZSh2bm9kZTIpIHtcbiAgICAgIGNvbnN0IGhvb2tzMiA9IHJlc29sdmVUcmFuc2l0aW9uSG9va3MoXG4gICAgICAgIHZub2RlMixcbiAgICAgICAgcHJvcHMsXG4gICAgICAgIHN0YXRlLFxuICAgICAgICBpbnN0YW5jZSxcbiAgICAgICAgcG9zdENsb25lXG4gICAgICApO1xuICAgICAgaWYgKHBvc3RDbG9uZSkgcG9zdENsb25lKGhvb2tzMik7XG4gICAgICByZXR1cm4gaG9va3MyO1xuICAgIH1cbiAgfTtcbiAgcmV0dXJuIGhvb2tzO1xufVxuZnVuY3Rpb24gZW1wdHlQbGFjZWhvbGRlcih2bm9kZSkge1xuICBpZiAoaXNLZWVwQWxpdmUodm5vZGUpKSB7XG4gICAgdm5vZGUgPSBjbG9uZVZOb2RlKHZub2RlKTtcbiAgICB2bm9kZS5jaGlsZHJlbiA9IG51bGw7XG4gICAgcmV0dXJuIHZub2RlO1xuICB9XG59XG5mdW5jdGlvbiBnZXRJbm5lckNoaWxkJDEodm5vZGUpIHtcbiAgaWYgKCFpc0tlZXBBbGl2ZSh2bm9kZSkpIHtcbiAgICBpZiAoaXNUZWxlcG9ydCh2bm9kZS50eXBlKSAmJiB2bm9kZS5jaGlsZHJlbikge1xuICAgICAgcmV0dXJuIGZpbmROb25Db21tZW50Q2hpbGQodm5vZGUuY2hpbGRyZW4pO1xuICAgIH1cbiAgICByZXR1cm4gdm5vZGU7XG4gIH1cbiAgaWYgKHZub2RlLmNvbXBvbmVudCkge1xuICAgIHJldHVybiB2bm9kZS5jb21wb25lbnQuc3ViVHJlZTtcbiAgfVxuICBjb25zdCB7IHNoYXBlRmxhZywgY2hpbGRyZW4gfSA9IHZub2RlO1xuICBpZiAoY2hpbGRyZW4pIHtcbiAgICBpZiAoc2hhcGVGbGFnICYgMTYpIHtcbiAgICAgIHJldHVybiBjaGlsZHJlblswXTtcbiAgICB9XG4gICAgaWYgKHNoYXBlRmxhZyAmIDMyICYmIGlzRnVuY3Rpb24oY2hpbGRyZW4uZGVmYXVsdCkpIHtcbiAgICAgIHJldHVybiBjaGlsZHJlbi5kZWZhdWx0KCk7XG4gICAgfVxuICB9XG59XG5mdW5jdGlvbiBzZXRUcmFuc2l0aW9uSG9va3Modm5vZGUsIGhvb2tzKSB7XG4gIGlmICh2bm9kZS5zaGFwZUZsYWcgJiA2ICYmIHZub2RlLmNvbXBvbmVudCkge1xuICAgIHZub2RlLnRyYW5zaXRpb24gPSBob29rcztcbiAgICBzZXRUcmFuc2l0aW9uSG9va3Modm5vZGUuY29tcG9uZW50LnN1YlRyZWUsIGhvb2tzKTtcbiAgfSBlbHNlIGlmICh2bm9kZS5zaGFwZUZsYWcgJiAxMjgpIHtcbiAgICB2bm9kZS5zc0NvbnRlbnQudHJhbnNpdGlvbiA9IGhvb2tzLmNsb25lKHZub2RlLnNzQ29udGVudCk7XG4gICAgdm5vZGUuc3NGYWxsYmFjay50cmFuc2l0aW9uID0gaG9va3MuY2xvbmUodm5vZGUuc3NGYWxsYmFjayk7XG4gIH0gZWxzZSB7XG4gICAgdm5vZGUudHJhbnNpdGlvbiA9IGhvb2tzO1xuICB9XG59XG5mdW5jdGlvbiBnZXRUcmFuc2l0aW9uUmF3Q2hpbGRyZW4oY2hpbGRyZW4sIGtlZXBDb21tZW50ID0gZmFsc2UsIHBhcmVudEtleSkge1xuICBsZXQgcmV0ID0gW107XG4gIGxldCBrZXllZEZyYWdtZW50Q291bnQgPSAwO1xuICBmb3IgKGxldCBpID0gMDsgaSA8IGNoaWxkcmVuLmxlbmd0aDsgaSsrKSB7XG4gICAgbGV0IGNoaWxkID0gY2hpbGRyZW5baV07XG4gICAgY29uc3Qga2V5ID0gcGFyZW50S2V5ID09IG51bGwgPyBjaGlsZC5rZXkgOiBTdHJpbmcocGFyZW50S2V5KSArIFN0cmluZyhjaGlsZC5rZXkgIT0gbnVsbCA/IGNoaWxkLmtleSA6IGkpO1xuICAgIGlmIChjaGlsZC50eXBlID09PSBGcmFnbWVudCkge1xuICAgICAgaWYgKGNoaWxkLnBhdGNoRmxhZyAmIDEyOCkga2V5ZWRGcmFnbWVudENvdW50Kys7XG4gICAgICByZXQgPSByZXQuY29uY2F0KFxuICAgICAgICBnZXRUcmFuc2l0aW9uUmF3Q2hpbGRyZW4oY2hpbGQuY2hpbGRyZW4sIGtlZXBDb21tZW50LCBrZXkpXG4gICAgICApO1xuICAgIH0gZWxzZSBpZiAoa2VlcENvbW1lbnQgfHwgY2hpbGQudHlwZSAhPT0gQ29tbWVudCkge1xuICAgICAgcmV0LnB1c2goa2V5ICE9IG51bGwgPyBjbG9uZVZOb2RlKGNoaWxkLCB7IGtleSB9KSA6IGNoaWxkKTtcbiAgICB9XG4gIH1cbiAgaWYgKGtleWVkRnJhZ21lbnRDb3VudCA+IDEpIHtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHJldC5sZW5ndGg7IGkrKykge1xuICAgICAgcmV0W2ldLnBhdGNoRmxhZyA9IC0yO1xuICAgIH1cbiAgfVxuICByZXR1cm4gcmV0O1xufVxuXG4vLyBAX19OT19TSURFX0VGRkVDVFNfX1xuZnVuY3Rpb24gZGVmaW5lQ29tcG9uZW50KG9wdGlvbnMsIGV4dHJhT3B0aW9ucykge1xuICByZXR1cm4gaXNGdW5jdGlvbihvcHRpb25zKSA/IChcbiAgICAvLyAjODIzNjogZXh0ZW5kIGNhbGwgYW5kIG9wdGlvbnMubmFtZSBhY2Nlc3MgYXJlIGNvbnNpZGVyZWQgc2lkZS1lZmZlY3RzXG4gICAgLy8gYnkgUm9sbHVwLCBzbyB3ZSBoYXZlIHRvIHdyYXAgaXQgaW4gYSBwdXJlLWFubm90YXRlZCBJSUZFLlxuICAgIC8qIEBfX1BVUkVfXyAqLyAoKCkgPT4gZXh0ZW5kKHsgbmFtZTogb3B0aW9ucy5uYW1lIH0sIGV4dHJhT3B0aW9ucywgeyBzZXR1cDogb3B0aW9ucyB9KSkoKVxuICApIDogb3B0aW9ucztcbn1cblxuZnVuY3Rpb24gdXNlSWQoKSB7XG4gIGNvbnN0IGkgPSBnZXRDdXJyZW50SW5zdGFuY2UoKTtcbiAgaWYgKGkpIHtcbiAgICByZXR1cm4gKGkuYXBwQ29udGV4dC5jb25maWcuaWRQcmVmaXggfHwgXCJ2XCIpICsgXCItXCIgKyBpLmlkc1swXSArIGkuaWRzWzFdKys7XG4gIH0gZWxzZSBpZiAoISEocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09IFwicHJvZHVjdGlvblwiKSkge1xuICAgIHdhcm4kMShcbiAgICAgIGB1c2VJZCgpIGlzIGNhbGxlZCB3aGVuIHRoZXJlIGlzIG5vIGFjdGl2ZSBjb21wb25lbnQgaW5zdGFuY2UgdG8gYmUgYXNzb2NpYXRlZCB3aXRoLmBcbiAgICApO1xuICB9XG4gIHJldHVybiBcIlwiO1xufVxuZnVuY3Rpb24gbWFya0FzeW5jQm91bmRhcnkoaW5zdGFuY2UpIHtcbiAgaW5zdGFuY2UuaWRzID0gW2luc3RhbmNlLmlkc1swXSArIGluc3RhbmNlLmlkc1syXSsrICsgXCItXCIsIDAsIDBdO1xufVxuXG5jb25zdCBrbm93blRlbXBsYXRlUmVmcyA9IC8qIEBfX1BVUkVfXyAqLyBuZXcgV2Vha1NldCgpO1xuZnVuY3Rpb24gdXNlVGVtcGxhdGVSZWYoa2V5KSB7XG4gIGNvbnN0IGkgPSBnZXRDdXJyZW50SW5zdGFuY2UoKTtcbiAgY29uc3QgciA9IHNoYWxsb3dSZWYobnVsbCk7XG4gIGlmIChpKSB7XG4gICAgY29uc3QgcmVmcyA9IGkucmVmcyA9PT0gRU1QVFlfT0JKID8gaS5yZWZzID0ge30gOiBpLnJlZnM7XG4gICAgaWYgKCEhKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSBcInByb2R1Y3Rpb25cIikgJiYgaXNUZW1wbGF0ZVJlZktleShyZWZzLCBrZXkpKSB7XG4gICAgICB3YXJuJDEoYHVzZVRlbXBsYXRlUmVmKCcke2tleX0nKSBhbHJlYWR5IGV4aXN0cy5gKTtcbiAgICB9IGVsc2Uge1xuICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHJlZnMsIGtleSwge1xuICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgICBnZXQ6ICgpID0+IHIudmFsdWUsXG4gICAgICAgIHNldDogKHZhbCkgPT4gci52YWx1ZSA9IHZhbFxuICAgICAgfSk7XG4gICAgfVxuICB9IGVsc2UgaWYgKCEhKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSBcInByb2R1Y3Rpb25cIikpIHtcbiAgICB3YXJuJDEoXG4gICAgICBgdXNlVGVtcGxhdGVSZWYoKSBpcyBjYWxsZWQgd2hlbiB0aGVyZSBpcyBubyBhY3RpdmUgY29tcG9uZW50IGluc3RhbmNlIHRvIGJlIGFzc29jaWF0ZWQgd2l0aC5gXG4gICAgKTtcbiAgfVxuICBjb25zdCByZXQgPSAhIShwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gXCJwcm9kdWN0aW9uXCIpID8gcmVhZG9ubHkocikgOiByO1xuICBpZiAoISEocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09IFwicHJvZHVjdGlvblwiKSkge1xuICAgIGtub3duVGVtcGxhdGVSZWZzLmFkZChyZXQpO1xuICB9XG4gIHJldHVybiByZXQ7XG59XG5mdW5jdGlvbiBpc1RlbXBsYXRlUmVmS2V5KHJlZnMsIGtleSkge1xuICBsZXQgZGVzYztcbiAgcmV0dXJuICEhKChkZXNjID0gT2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvcihyZWZzLCBrZXkpKSAmJiAhZGVzYy5jb25maWd1cmFibGUpO1xufVxuXG5jb25zdCBwZW5kaW5nU2V0UmVmTWFwID0gLyogQF9fUFVSRV9fICovIG5ldyBXZWFrTWFwKCk7XG5mdW5jdGlvbiBzZXRSZWYocmF3UmVmLCBvbGRSYXdSZWYsIHBhcmVudFN1c3BlbnNlLCB2bm9kZSwgaXNVbm1vdW50ID0gZmFsc2UpIHtcbiAgaWYgKGlzQXJyYXkocmF3UmVmKSkge1xuICAgIHJhd1JlZi5mb3JFYWNoKFxuICAgICAgKHIsIGkpID0+IHNldFJlZihcbiAgICAgICAgcixcbiAgICAgICAgb2xkUmF3UmVmICYmIChpc0FycmF5KG9sZFJhd1JlZikgPyBvbGRSYXdSZWZbaV0gOiBvbGRSYXdSZWYpLFxuICAgICAgICBwYXJlbnRTdXNwZW5zZSxcbiAgICAgICAgdm5vZGUsXG4gICAgICAgIGlzVW5tb3VudFxuICAgICAgKVxuICAgICk7XG4gICAgcmV0dXJuO1xuICB9XG4gIGlmIChpc0FzeW5jV3JhcHBlcih2bm9kZSkgJiYgIWlzVW5tb3VudCkge1xuICAgIGlmICh2bm9kZS5zaGFwZUZsYWcgJiA1MTIgJiYgdm5vZGUudHlwZS5fX2FzeW5jUmVzb2x2ZWQgJiYgdm5vZGUuY29tcG9uZW50LnN1YlRyZWUuY29tcG9uZW50KSB7XG4gICAgICBzZXRSZWYocmF3UmVmLCBvbGRSYXdSZWYsIHBhcmVudFN1c3BlbnNlLCB2bm9kZS5jb21wb25lbnQuc3ViVHJlZSk7XG4gICAgfVxuICAgIHJldHVybjtcbiAgfVxuICBjb25zdCByZWZWYWx1ZSA9IHZub2RlLnNoYXBlRmxhZyAmIDQgPyBnZXRDb21wb25lbnRQdWJsaWNJbnN0YW5jZSh2bm9kZS5jb21wb25lbnQpIDogdm5vZGUuZWw7XG4gIGNvbnN0IHZhbHVlID0gaXNVbm1vdW50ID8gbnVsbCA6IHJlZlZhbHVlO1xuICBjb25zdCB7IGk6IG93bmVyLCByOiByZWYgfSA9IHJhd1JlZjtcbiAgaWYgKCEhKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSBcInByb2R1Y3Rpb25cIikgJiYgIW93bmVyKSB7XG4gICAgd2FybiQxKFxuICAgICAgYE1pc3NpbmcgcmVmIG93bmVyIGNvbnRleHQuIHJlZiBjYW5ub3QgYmUgdXNlZCBvbiBob2lzdGVkIHZub2Rlcy4gQSB2bm9kZSB3aXRoIHJlZiBtdXN0IGJlIGNyZWF0ZWQgaW5zaWRlIHRoZSByZW5kZXIgZnVuY3Rpb24uYFxuICAgICk7XG4gICAgcmV0dXJuO1xuICB9XG4gIGNvbnN0IG9sZFJlZiA9IG9sZFJhd1JlZiAmJiBvbGRSYXdSZWYucjtcbiAgY29uc3QgcmVmcyA9IG93bmVyLnJlZnMgPT09IEVNUFRZX09CSiA/IG93bmVyLnJlZnMgPSB7fSA6IG93bmVyLnJlZnM7XG4gIGNvbnN0IHNldHVwU3RhdGUgPSBvd25lci5zZXR1cFN0YXRlO1xuICBjb25zdCByYXdTZXR1cFN0YXRlID0gdG9SYXcoc2V0dXBTdGF0ZSk7XG4gIGNvbnN0IGNhblNldFNldHVwUmVmID0gc2V0dXBTdGF0ZSA9PT0gRU1QVFlfT0JKID8gTk8gOiAoa2V5KSA9PiB7XG4gICAgaWYgKCEhKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSBcInByb2R1Y3Rpb25cIikpIHtcbiAgICAgIGlmIChoYXNPd24ocmF3U2V0dXBTdGF0ZSwga2V5KSAmJiAhaXNSZWYocmF3U2V0dXBTdGF0ZVtrZXldKSkge1xuICAgICAgICB3YXJuJDEoXG4gICAgICAgICAgYFRlbXBsYXRlIHJlZiBcIiR7a2V5fVwiIHVzZWQgb24gYSBub24tcmVmIHZhbHVlLiBJdCB3aWxsIG5vdCB3b3JrIGluIHRoZSBwcm9kdWN0aW9uIGJ1aWxkLmBcbiAgICAgICAgKTtcbiAgICAgIH1cbiAgICAgIGlmIChrbm93blRlbXBsYXRlUmVmcy5oYXMocmF3U2V0dXBTdGF0ZVtrZXldKSkge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG4gICAgfVxuICAgIGlmIChpc1RlbXBsYXRlUmVmS2V5KHJlZnMsIGtleSkpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgcmV0dXJuIGhhc093bihyYXdTZXR1cFN0YXRlLCBrZXkpO1xuICB9O1xuICBjb25zdCBjYW5TZXRSZWYgPSAocmVmMiwga2V5KSA9PiB7XG4gICAgaWYgKCEhKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSBcInByb2R1Y3Rpb25cIikgJiYga25vd25UZW1wbGF0ZVJlZnMuaGFzKHJlZjIpKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIGlmIChrZXkgJiYgaXNUZW1wbGF0ZVJlZktleShyZWZzLCBrZXkpKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIHJldHVybiB0cnVlO1xuICB9O1xuICBpZiAob2xkUmVmICE9IG51bGwgJiYgb2xkUmVmICE9PSByZWYpIHtcbiAgICBpbnZhbGlkYXRlUGVuZGluZ1NldFJlZihvbGRSYXdSZWYpO1xuICAgIGlmIChpc1N0cmluZyhvbGRSZWYpKSB7XG4gICAgICByZWZzW29sZFJlZl0gPSBudWxsO1xuICAgICAgaWYgKGNhblNldFNldHVwUmVmKG9sZFJlZikpIHtcbiAgICAgICAgc2V0dXBTdGF0ZVtvbGRSZWZdID0gbnVsbDtcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKGlzUmVmKG9sZFJlZikpIHtcbiAgICAgIGNvbnN0IG9sZFJhd1JlZkF0b20gPSBvbGRSYXdSZWY7XG4gICAgICBpZiAoY2FuU2V0UmVmKG9sZFJlZiwgb2xkUmF3UmVmQXRvbS5rKSkge1xuICAgICAgICBvbGRSZWYudmFsdWUgPSBudWxsO1xuICAgICAgfVxuICAgICAgaWYgKG9sZFJhd1JlZkF0b20uaykgcmVmc1tvbGRSYXdSZWZBdG9tLmtdID0gbnVsbDtcbiAgICB9XG4gIH1cbiAgaWYgKGlzRnVuY3Rpb24ocmVmKSkge1xuICAgIGNhbGxXaXRoRXJyb3JIYW5kbGluZyhyZWYsIG93bmVyLCAxMiwgW3ZhbHVlLCByZWZzXSk7XG4gIH0gZWxzZSB7XG4gICAgY29uc3QgX2lzU3RyaW5nID0gaXNTdHJpbmcocmVmKTtcbiAgICBjb25zdCBfaXNSZWYgPSBpc1JlZihyZWYpO1xuICAgIGlmIChfaXNTdHJpbmcgfHwgX2lzUmVmKSB7XG4gICAgICBjb25zdCBkb1NldCA9ICgpID0+IHtcbiAgICAgICAgaWYgKHJhd1JlZi5mKSB7XG4gICAgICAgICAgY29uc3QgZXhpc3RpbmcgPSBfaXNTdHJpbmcgPyBjYW5TZXRTZXR1cFJlZihyZWYpID8gc2V0dXBTdGF0ZVtyZWZdIDogcmVmc1tyZWZdIDogY2FuU2V0UmVmKHJlZikgfHwgIXJhd1JlZi5rID8gcmVmLnZhbHVlIDogcmVmc1tyYXdSZWYua107XG4gICAgICAgICAgaWYgKGlzVW5tb3VudCkge1xuICAgICAgICAgICAgaXNBcnJheShleGlzdGluZykgJiYgcmVtb3ZlKGV4aXN0aW5nLCByZWZWYWx1ZSk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGlmICghaXNBcnJheShleGlzdGluZykpIHtcbiAgICAgICAgICAgICAgaWYgKF9pc1N0cmluZykge1xuICAgICAgICAgICAgICAgIHJlZnNbcmVmXSA9IFtyZWZWYWx1ZV07XG4gICAgICAgICAgICAgICAgaWYgKGNhblNldFNldHVwUmVmKHJlZikpIHtcbiAgICAgICAgICAgICAgICAgIHNldHVwU3RhdGVbcmVmXSA9IHJlZnNbcmVmXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgY29uc3QgbmV3VmFsID0gW3JlZlZhbHVlXTtcbiAgICAgICAgICAgICAgICBpZiAoY2FuU2V0UmVmKHJlZiwgcmF3UmVmLmspKSB7XG4gICAgICAgICAgICAgICAgICByZWYudmFsdWUgPSBuZXdWYWw7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChyYXdSZWYuaykgcmVmc1tyYXdSZWYua10gPSBuZXdWYWw7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSBpZiAoIWV4aXN0aW5nLmluY2x1ZGVzKHJlZlZhbHVlKSkge1xuICAgICAgICAgICAgICBleGlzdGluZy5wdXNoKHJlZlZhbHVlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSBpZiAoX2lzU3RyaW5nKSB7XG4gICAgICAgICAgcmVmc1tyZWZdID0gdmFsdWU7XG4gICAgICAgICAgaWYgKGNhblNldFNldHVwUmVmKHJlZikpIHtcbiAgICAgICAgICAgIHNldHVwU3RhdGVbcmVmXSA9IHZhbHVlO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIGlmIChfaXNSZWYpIHtcbiAgICAgICAgICBpZiAoY2FuU2V0UmVmKHJlZiwgcmF3UmVmLmspKSB7XG4gICAgICAgICAgICByZWYudmFsdWUgPSB2YWx1ZTtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKHJhd1JlZi5rKSByZWZzW3Jhd1JlZi5rXSA9IHZhbHVlO1xuICAgICAgICB9IGVsc2UgaWYgKCEhKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSBcInByb2R1Y3Rpb25cIikpIHtcbiAgICAgICAgICB3YXJuJDEoXCJJbnZhbGlkIHRlbXBsYXRlIHJlZiB0eXBlOlwiLCByZWYsIGAoJHt0eXBlb2YgcmVmfSlgKTtcbiAgICAgICAgfVxuICAgICAgfTtcbiAgICAgIGlmICh2YWx1ZSkge1xuICAgICAgICBjb25zdCBqb2IgPSAoKSA9PiB7XG4gICAgICAgICAgZG9TZXQoKTtcbiAgICAgICAgICBwZW5kaW5nU2V0UmVmTWFwLmRlbGV0ZShyYXdSZWYpO1xuICAgICAgICB9O1xuICAgICAgICBqb2IuaWQgPSAtMTtcbiAgICAgICAgcGVuZGluZ1NldFJlZk1hcC5zZXQocmF3UmVmLCBqb2IpO1xuICAgICAgICBxdWV1ZVBvc3RSZW5kZXJFZmZlY3Qoam9iLCBwYXJlbnRTdXNwZW5zZSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpbnZhbGlkYXRlUGVuZGluZ1NldFJlZihyYXdSZWYpO1xuICAgICAgICBkb1NldCgpO1xuICAgICAgfVxuICAgIH0gZWxzZSBpZiAoISEocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09IFwicHJvZHVjdGlvblwiKSkge1xuICAgICAgd2FybiQxKFwiSW52YWxpZCB0ZW1wbGF0ZSByZWYgdHlwZTpcIiwgcmVmLCBgKCR7dHlwZW9mIHJlZn0pYCk7XG4gICAgfVxuICB9XG59XG5mdW5jdGlvbiBpbnZhbGlkYXRlUGVuZGluZ1NldFJlZihyYXdSZWYpIHtcbiAgY29uc3QgcGVuZGluZ1NldFJlZiA9IHBlbmRpbmdTZXRSZWZNYXAuZ2V0KHJhd1JlZik7XG4gIGlmIChwZW5kaW5nU2V0UmVmKSB7XG4gICAgcGVuZGluZ1NldFJlZi5mbGFncyB8PSA4O1xuICAgIHBlbmRpbmdTZXRSZWZNYXAuZGVsZXRlKHJhd1JlZik7XG4gIH1cbn1cblxubGV0IGhhc0xvZ2dlZE1pc21hdGNoRXJyb3IgPSBmYWxzZTtcbmNvbnN0IGxvZ01pc21hdGNoRXJyb3IgPSAoKSA9PiB7XG4gIGlmIChoYXNMb2dnZWRNaXNtYXRjaEVycm9yKSB7XG4gICAgcmV0dXJuO1xuICB9XG4gIGNvbnNvbGUuZXJyb3IoXCJIeWRyYXRpb24gY29tcGxldGVkIGJ1dCBjb250YWlucyBtaXNtYXRjaGVzLlwiKTtcbiAgaGFzTG9nZ2VkTWlzbWF0Y2hFcnJvciA9IHRydWU7XG59O1xuY29uc3QgaXNTVkdDb250YWluZXIgPSAoY29udGFpbmVyKSA9PiBjb250YWluZXIubmFtZXNwYWNlVVJJLmluY2x1ZGVzKFwic3ZnXCIpICYmIGNvbnRhaW5lci50YWdOYW1lICE9PSBcImZvcmVpZ25PYmplY3RcIjtcbmNvbnN0IGlzTWF0aE1MQ29udGFpbmVyID0gKGNvbnRhaW5lcikgPT4gY29udGFpbmVyLm5hbWVzcGFjZVVSSS5pbmNsdWRlcyhcIk1hdGhNTFwiKTtcbmNvbnN0IGdldENvbnRhaW5lclR5cGUgPSAoY29udGFpbmVyKSA9PiB7XG4gIGlmIChjb250YWluZXIubm9kZVR5cGUgIT09IDEpIHJldHVybiB2b2lkIDA7XG4gIGlmIChpc1NWR0NvbnRhaW5lcihjb250YWluZXIpKSByZXR1cm4gXCJzdmdcIjtcbiAgaWYgKGlzTWF0aE1MQ29udGFpbmVyKGNvbnRhaW5lcikpIHJldHVybiBcIm1hdGhtbFwiO1xuICByZXR1cm4gdm9pZCAwO1xufTtcbmNvbnN0IGlzQ29tbWVudCA9IChub2RlKSA9PiBub2RlLm5vZGVUeXBlID09PSA4O1xuZnVuY3Rpb24gY3JlYXRlSHlkcmF0aW9uRnVuY3Rpb25zKHJlbmRlcmVySW50ZXJuYWxzKSB7XG4gIGNvbnN0IHtcbiAgICBtdDogbW91bnRDb21wb25lbnQsXG4gICAgcDogcGF0Y2gsXG4gICAgbzoge1xuICAgICAgcGF0Y2hQcm9wLFxuICAgICAgY3JlYXRlVGV4dCxcbiAgICAgIG5leHRTaWJsaW5nLFxuICAgICAgcGFyZW50Tm9kZSxcbiAgICAgIHJlbW92ZSxcbiAgICAgIGluc2VydCxcbiAgICAgIGNyZWF0ZUNvbW1lbnRcbiAgICB9XG4gIH0gPSByZW5kZXJlckludGVybmFscztcbiAgY29uc3QgaHlkcmF0ZSA9ICh2bm9kZSwgY29udGFpbmVyKSA9PiB7XG4gICAgaWYgKCFjb250YWluZXIuaGFzQ2hpbGROb2RlcygpKSB7XG4gICAgICAoISEocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09IFwicHJvZHVjdGlvblwiKSB8fCBfX1ZVRV9QUk9EX0hZRFJBVElPTl9NSVNNQVRDSF9ERVRBSUxTX18pICYmIHdhcm4kMShcbiAgICAgICAgYEF0dGVtcHRpbmcgdG8gaHlkcmF0ZSBleGlzdGluZyBtYXJrdXAgYnV0IGNvbnRhaW5lciBpcyBlbXB0eS4gUGVyZm9ybWluZyBmdWxsIG1vdW50IGluc3RlYWQuYFxuICAgICAgKTtcbiAgICAgIHBhdGNoKG51bGwsIHZub2RlLCBjb250YWluZXIpO1xuICAgICAgZmx1c2hQb3N0Rmx1c2hDYnMoKTtcbiAgICAgIGNvbnRhaW5lci5fdm5vZGUgPSB2bm9kZTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgaHlkcmF0ZU5vZGUoY29udGFpbmVyLmZpcnN0Q2hpbGQsIHZub2RlLCBudWxsLCBudWxsLCBudWxsKTtcbiAgICBmbHVzaFBvc3RGbHVzaENicygpO1xuICAgIGNvbnRhaW5lci5fdm5vZGUgPSB2bm9kZTtcbiAgfTtcbiAgY29uc3QgaHlkcmF0ZU5vZGUgPSAobm9kZSwgdm5vZGUsIHBhcmVudENvbXBvbmVudCwgcGFyZW50U3VzcGVuc2UsIHNsb3RTY29wZUlkcywgb3B0aW1pemVkID0gZmFsc2UpID0+IHtcbiAgICBvcHRpbWl6ZWQgPSBvcHRpbWl6ZWQgfHwgISF2bm9kZS5keW5hbWljQ2hpbGRyZW47XG4gICAgY29uc3QgaXNGcmFnbWVudFN0YXJ0ID0gaXNDb21tZW50KG5vZGUpICYmIG5vZGUuZGF0YSA9PT0gXCJbXCI7XG4gICAgY29uc3Qgb25NaXNtYXRjaCA9ICgpID0+IGhhbmRsZU1pc21hdGNoKFxuICAgICAgbm9kZSxcbiAgICAgIHZub2RlLFxuICAgICAgcGFyZW50Q29tcG9uZW50LFxuICAgICAgcGFyZW50U3VzcGVuc2UsXG4gICAgICBzbG90U2NvcGVJZHMsXG4gICAgICBpc0ZyYWdtZW50U3RhcnRcbiAgICApO1xuICAgIGNvbnN0IHsgdHlwZSwgcmVmLCBzaGFwZUZsYWcsIHBhdGNoRmxhZyB9ID0gdm5vZGU7XG4gICAgbGV0IGRvbVR5cGUgPSBub2RlLm5vZGVUeXBlO1xuICAgIHZub2RlLmVsID0gbm9kZTtcbiAgICBpZiAoISEocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09IFwicHJvZHVjdGlvblwiKSB8fCBfX1ZVRV9QUk9EX0RFVlRPT0xTX18pIHtcbiAgICAgIGRlZihub2RlLCBcIl9fdm5vZGVcIiwgdm5vZGUsIHRydWUpO1xuICAgICAgZGVmKG5vZGUsIFwiX192dWVQYXJlbnRDb21wb25lbnRcIiwgcGFyZW50Q29tcG9uZW50LCB0cnVlKTtcbiAgICB9XG4gICAgaWYgKHBhdGNoRmxhZyA9PT0gLTIpIHtcbiAgICAgIG9wdGltaXplZCA9IGZhbHNlO1xuICAgICAgdm5vZGUuZHluYW1pY0NoaWxkcmVuID0gbnVsbDtcbiAgICB9XG4gICAgbGV0IG5leHROb2RlID0gbnVsbDtcbiAgICBzd2l0Y2ggKHR5cGUpIHtcbiAgICAgIGNhc2UgVGV4dDpcbiAgICAgICAgaWYgKGRvbVR5cGUgIT09IDMpIHtcbiAgICAgICAgICBpZiAodm5vZGUuY2hpbGRyZW4gPT09IFwiXCIpIHtcbiAgICAgICAgICAgIGluc2VydCh2bm9kZS5lbCA9IGNyZWF0ZVRleHQoXCJcIiksIHBhcmVudE5vZGUobm9kZSksIG5vZGUpO1xuICAgICAgICAgICAgbmV4dE5vZGUgPSBub2RlO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBuZXh0Tm9kZSA9IG9uTWlzbWF0Y2goKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgaWYgKG5vZGUuZGF0YSAhPT0gdm5vZGUuY2hpbGRyZW4pIHtcbiAgICAgICAgICAgICghIShwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gXCJwcm9kdWN0aW9uXCIpIHx8IF9fVlVFX1BST0RfSFlEUkFUSU9OX01JU01BVENIX0RFVEFJTFNfXykgJiYgd2FybiQxKFxuICAgICAgICAgICAgICBgSHlkcmF0aW9uIHRleHQgbWlzbWF0Y2ggaW5gLFxuICAgICAgICAgICAgICBub2RlLnBhcmVudE5vZGUsXG4gICAgICAgICAgICAgIGBcbiAgLSByZW5kZXJlZCBvbiBzZXJ2ZXI6ICR7SlNPTi5zdHJpbmdpZnkoXG4gICAgICAgICAgICAgICAgbm9kZS5kYXRhXG4gICAgICAgICAgICAgICl9XG4gIC0gZXhwZWN0ZWQgb24gY2xpZW50OiAke0pTT04uc3RyaW5naWZ5KHZub2RlLmNoaWxkcmVuKX1gXG4gICAgICAgICAgICApO1xuICAgICAgICAgICAgbG9nTWlzbWF0Y2hFcnJvcigpO1xuICAgICAgICAgICAgbm9kZS5kYXRhID0gdm5vZGUuY2hpbGRyZW47XG4gICAgICAgICAgfVxuICAgICAgICAgIG5leHROb2RlID0gbmV4dFNpYmxpbmcobm9kZSk7XG4gICAgICAgIH1cbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIENvbW1lbnQ6XG4gICAgICAgIGlmIChpc1RlbXBsYXRlTm9kZShub2RlKSkge1xuICAgICAgICAgIG5leHROb2RlID0gbmV4dFNpYmxpbmcobm9kZSk7XG4gICAgICAgICAgcmVwbGFjZU5vZGUoXG4gICAgICAgICAgICB2bm9kZS5lbCA9IG5vZGUuY29udGVudC5maXJzdENoaWxkLFxuICAgICAgICAgICAgbm9kZSxcbiAgICAgICAgICAgIHBhcmVudENvbXBvbmVudFxuICAgICAgICAgICk7XG4gICAgICAgIH0gZWxzZSBpZiAoZG9tVHlwZSAhPT0gOCB8fCBpc0ZyYWdtZW50U3RhcnQpIHtcbiAgICAgICAgICBuZXh0Tm9kZSA9IG9uTWlzbWF0Y2goKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBuZXh0Tm9kZSA9IG5leHRTaWJsaW5nKG5vZGUpO1xuICAgICAgICB9XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBTdGF0aWM6XG4gICAgICAgIGlmIChpc0ZyYWdtZW50U3RhcnQpIHtcbiAgICAgICAgICBub2RlID0gbmV4dFNpYmxpbmcobm9kZSk7XG4gICAgICAgICAgZG9tVHlwZSA9IG5vZGUubm9kZVR5cGU7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGRvbVR5cGUgPT09IDEgfHwgZG9tVHlwZSA9PT0gMykge1xuICAgICAgICAgIG5leHROb2RlID0gbm9kZTtcbiAgICAgICAgICBjb25zdCBuZWVkVG9BZG9wdENvbnRlbnQgPSAhdm5vZGUuY2hpbGRyZW4ubGVuZ3RoO1xuICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdm5vZGUuc3RhdGljQ291bnQ7IGkrKykge1xuICAgICAgICAgICAgaWYgKG5lZWRUb0Fkb3B0Q29udGVudClcbiAgICAgICAgICAgICAgdm5vZGUuY2hpbGRyZW4gKz0gbmV4dE5vZGUubm9kZVR5cGUgPT09IDEgPyBuZXh0Tm9kZS5vdXRlckhUTUwgOiBuZXh0Tm9kZS5kYXRhO1xuICAgICAgICAgICAgaWYgKGkgPT09IHZub2RlLnN0YXRpY0NvdW50IC0gMSkge1xuICAgICAgICAgICAgICB2bm9kZS5hbmNob3IgPSBuZXh0Tm9kZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIG5leHROb2RlID0gbmV4dFNpYmxpbmcobmV4dE5vZGUpO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gaXNGcmFnbWVudFN0YXJ0ID8gbmV4dFNpYmxpbmcobmV4dE5vZGUpIDogbmV4dE5vZGU7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgb25NaXNtYXRjaCgpO1xuICAgICAgICB9XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBGcmFnbWVudDpcbiAgICAgICAgaWYgKCFpc0ZyYWdtZW50U3RhcnQpIHtcbiAgICAgICAgICBuZXh0Tm9kZSA9IG9uTWlzbWF0Y2goKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBuZXh0Tm9kZSA9IGh5ZHJhdGVGcmFnbWVudChcbiAgICAgICAgICAgIG5vZGUsXG4gICAgICAgICAgICB2bm9kZSxcbiAgICAgICAgICAgIHBhcmVudENvbXBvbmVudCxcbiAgICAgICAgICAgIHBhcmVudFN1c3BlbnNlLFxuICAgICAgICAgICAgc2xvdFNjb3BlSWRzLFxuICAgICAgICAgICAgb3B0aW1pemVkXG4gICAgICAgICAgKTtcbiAgICAgICAgfVxuICAgICAgICBicmVhaztcbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIGlmIChzaGFwZUZsYWcgJiAxKSB7XG4gICAgICAgICAgaWYgKChkb21UeXBlICE9PSAxIHx8IHZub2RlLnR5cGUudG9Mb3dlckNhc2UoKSAhPT0gbm9kZS50YWdOYW1lLnRvTG93ZXJDYXNlKCkpICYmICFpc1RlbXBsYXRlTm9kZShub2RlKSkge1xuICAgICAgICAgICAgbmV4dE5vZGUgPSBvbk1pc21hdGNoKCk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIG5leHROb2RlID0gaHlkcmF0ZUVsZW1lbnQoXG4gICAgICAgICAgICAgIG5vZGUsXG4gICAgICAgICAgICAgIHZub2RlLFxuICAgICAgICAgICAgICBwYXJlbnRDb21wb25lbnQsXG4gICAgICAgICAgICAgIHBhcmVudFN1c3BlbnNlLFxuICAgICAgICAgICAgICBzbG90U2NvcGVJZHMsXG4gICAgICAgICAgICAgIG9wdGltaXplZFxuICAgICAgICAgICAgKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSBpZiAoc2hhcGVGbGFnICYgNikge1xuICAgICAgICAgIHZub2RlLnNsb3RTY29wZUlkcyA9IHNsb3RTY29wZUlkcztcbiAgICAgICAgICBjb25zdCBjb250YWluZXIgPSBwYXJlbnROb2RlKG5vZGUpO1xuICAgICAgICAgIGlmIChpc0ZyYWdtZW50U3RhcnQpIHtcbiAgICAgICAgICAgIG5leHROb2RlID0gbG9jYXRlQ2xvc2luZ0FuY2hvcihub2RlKTtcbiAgICAgICAgICB9IGVsc2UgaWYgKGlzQ29tbWVudChub2RlKSAmJiBub2RlLmRhdGEgPT09IFwidGVsZXBvcnQgc3RhcnRcIikge1xuICAgICAgICAgICAgbmV4dE5vZGUgPSBsb2NhdGVDbG9zaW5nQW5jaG9yKG5vZGUsIG5vZGUuZGF0YSwgXCJ0ZWxlcG9ydCBlbmRcIik7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIG5leHROb2RlID0gbmV4dFNpYmxpbmcobm9kZSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIG1vdW50Q29tcG9uZW50KFxuICAgICAgICAgICAgdm5vZGUsXG4gICAgICAgICAgICBjb250YWluZXIsXG4gICAgICAgICAgICBudWxsLFxuICAgICAgICAgICAgcGFyZW50Q29tcG9uZW50LFxuICAgICAgICAgICAgcGFyZW50U3VzcGVuc2UsXG4gICAgICAgICAgICBnZXRDb250YWluZXJUeXBlKGNvbnRhaW5lciksXG4gICAgICAgICAgICBvcHRpbWl6ZWRcbiAgICAgICAgICApO1xuICAgICAgICAgIGlmIChpc0FzeW5jV3JhcHBlcih2bm9kZSkgJiYgIXZub2RlLnR5cGUuX19hc3luY1Jlc29sdmVkKSB7XG4gICAgICAgICAgICBsZXQgc3ViVHJlZTtcbiAgICAgICAgICAgIGlmIChpc0ZyYWdtZW50U3RhcnQpIHtcbiAgICAgICAgICAgICAgc3ViVHJlZSA9IGNyZWF0ZVZOb2RlKEZyYWdtZW50KTtcbiAgICAgICAgICAgICAgc3ViVHJlZS5hbmNob3IgPSBuZXh0Tm9kZSA/IG5leHROb2RlLnByZXZpb3VzU2libGluZyA6IGNvbnRhaW5lci5sYXN0Q2hpbGQ7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBzdWJUcmVlID0gbm9kZS5ub2RlVHlwZSA9PT0gMyA/IGNyZWF0ZVRleHRWTm9kZShcIlwiKSA6IGNyZWF0ZVZOb2RlKFwiZGl2XCIpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgc3ViVHJlZS5lbCA9IG5vZGU7XG4gICAgICAgICAgICB2bm9kZS5jb21wb25lbnQuc3ViVHJlZSA9IHN1YlRyZWU7XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2UgaWYgKHNoYXBlRmxhZyAmIDY0KSB7XG4gICAgICAgICAgaWYgKGRvbVR5cGUgIT09IDgpIHtcbiAgICAgICAgICAgIG5leHROb2RlID0gb25NaXNtYXRjaCgpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBuZXh0Tm9kZSA9IHZub2RlLnR5cGUuaHlkcmF0ZShcbiAgICAgICAgICAgICAgbm9kZSxcbiAgICAgICAgICAgICAgdm5vZGUsXG4gICAgICAgICAgICAgIHBhcmVudENvbXBvbmVudCxcbiAgICAgICAgICAgICAgcGFyZW50U3VzcGVuc2UsXG4gICAgICAgICAgICAgIHNsb3RTY29wZUlkcyxcbiAgICAgICAgICAgICAgb3B0aW1pemVkLFxuICAgICAgICAgICAgICByZW5kZXJlckludGVybmFscyxcbiAgICAgICAgICAgICAgaHlkcmF0ZUNoaWxkcmVuXG4gICAgICAgICAgICApO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIGlmIChzaGFwZUZsYWcgJiAxMjgpIHtcbiAgICAgICAgICBuZXh0Tm9kZSA9IHZub2RlLnR5cGUuaHlkcmF0ZShcbiAgICAgICAgICAgIG5vZGUsXG4gICAgICAgICAgICB2bm9kZSxcbiAgICAgICAgICAgIHBhcmVudENvbXBvbmVudCxcbiAgICAgICAgICAgIHBhcmVudFN1c3BlbnNlLFxuICAgICAgICAgICAgZ2V0Q29udGFpbmVyVHlwZShwYXJlbnROb2RlKG5vZGUpKSxcbiAgICAgICAgICAgIHNsb3RTY29wZUlkcyxcbiAgICAgICAgICAgIG9wdGltaXplZCxcbiAgICAgICAgICAgIHJlbmRlcmVySW50ZXJuYWxzLFxuICAgICAgICAgICAgaHlkcmF0ZU5vZGVcbiAgICAgICAgICApO1xuICAgICAgICB9IGVsc2UgaWYgKCEhKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSBcInByb2R1Y3Rpb25cIikgfHwgX19WVUVfUFJPRF9IWURSQVRJT05fTUlTTUFUQ0hfREVUQUlMU19fKSB7XG4gICAgICAgICAgd2FybiQxKFwiSW52YWxpZCBIb3N0Vk5vZGUgdHlwZTpcIiwgdHlwZSwgYCgke3R5cGVvZiB0eXBlfSlgKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBpZiAocmVmICE9IG51bGwpIHtcbiAgICAgIHNldFJlZihyZWYsIG51bGwsIHBhcmVudFN1c3BlbnNlLCB2bm9kZSk7XG4gICAgfVxuICAgIHJldHVybiBuZXh0Tm9kZTtcbiAgfTtcbiAgY29uc3QgaHlkcmF0ZUVsZW1lbnQgPSAoZWwsIHZub2RlLCBwYXJlbnRDb21wb25lbnQsIHBhcmVudFN1c3BlbnNlLCBzbG90U2NvcGVJZHMsIG9wdGltaXplZCkgPT4ge1xuICAgIG9wdGltaXplZCA9IG9wdGltaXplZCB8fCAhIXZub2RlLmR5bmFtaWNDaGlsZHJlbjtcbiAgICBjb25zdCB7IHR5cGUsIHByb3BzLCBwYXRjaEZsYWcsIHNoYXBlRmxhZywgZGlycywgdHJhbnNpdGlvbiB9ID0gdm5vZGU7XG4gICAgY29uc3QgZm9yY2VQYXRjaCA9IHR5cGUgPT09IFwiaW5wdXRcIiB8fCB0eXBlID09PSBcIm9wdGlvblwiO1xuICAgIGlmICghIShwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gXCJwcm9kdWN0aW9uXCIpIHx8IGZvcmNlUGF0Y2ggfHwgcGF0Y2hGbGFnICE9PSAtMSkge1xuICAgICAgaWYgKGRpcnMpIHtcbiAgICAgICAgaW52b2tlRGlyZWN0aXZlSG9vayh2bm9kZSwgbnVsbCwgcGFyZW50Q29tcG9uZW50LCBcImNyZWF0ZWRcIik7XG4gICAgICB9XG4gICAgICBsZXQgbmVlZENhbGxUcmFuc2l0aW9uSG9va3MgPSBmYWxzZTtcbiAgICAgIGlmIChpc1RlbXBsYXRlTm9kZShlbCkpIHtcbiAgICAgICAgbmVlZENhbGxUcmFuc2l0aW9uSG9va3MgPSBuZWVkVHJhbnNpdGlvbihcbiAgICAgICAgICBudWxsLFxuICAgICAgICAgIC8vIG5vIG5lZWQgY2hlY2sgcGFyZW50U3VzcGVuc2UgaW4gaHlkcmF0aW9uXG4gICAgICAgICAgdHJhbnNpdGlvblxuICAgICAgICApICYmIHBhcmVudENvbXBvbmVudCAmJiBwYXJlbnRDb21wb25lbnQudm5vZGUucHJvcHMgJiYgcGFyZW50Q29tcG9uZW50LnZub2RlLnByb3BzLmFwcGVhcjtcbiAgICAgICAgY29uc3QgY29udGVudCA9IGVsLmNvbnRlbnQuZmlyc3RDaGlsZDtcbiAgICAgICAgaWYgKG5lZWRDYWxsVHJhbnNpdGlvbkhvb2tzKSB7XG4gICAgICAgICAgY29uc3QgY2xzID0gY29udGVudC5nZXRBdHRyaWJ1dGUoXCJjbGFzc1wiKTtcbiAgICAgICAgICBpZiAoY2xzKSBjb250ZW50LiRjbHMgPSBjbHM7XG4gICAgICAgICAgdHJhbnNpdGlvbi5iZWZvcmVFbnRlcihjb250ZW50KTtcbiAgICAgICAgfVxuICAgICAgICByZXBsYWNlTm9kZShjb250ZW50LCBlbCwgcGFyZW50Q29tcG9uZW50KTtcbiAgICAgICAgdm5vZGUuZWwgPSBlbCA9IGNvbnRlbnQ7XG4gICAgICB9XG4gICAgICBpZiAoc2hhcGVGbGFnICYgMTYgJiYgLy8gc2tpcCBpZiBlbGVtZW50IGhhcyBpbm5lckhUTUwgLyB0ZXh0Q29udGVudFxuICAgICAgIShwcm9wcyAmJiAocHJvcHMuaW5uZXJIVE1MIHx8IHByb3BzLnRleHRDb250ZW50KSkpIHtcbiAgICAgICAgbGV0IG5leHQgPSBoeWRyYXRlQ2hpbGRyZW4oXG4gICAgICAgICAgZWwuZmlyc3RDaGlsZCxcbiAgICAgICAgICB2bm9kZSxcbiAgICAgICAgICBlbCxcbiAgICAgICAgICBwYXJlbnRDb21wb25lbnQsXG4gICAgICAgICAgcGFyZW50U3VzcGVuc2UsXG4gICAgICAgICAgc2xvdFNjb3BlSWRzLFxuICAgICAgICAgIG9wdGltaXplZFxuICAgICAgICApO1xuICAgICAgICBsZXQgaGFzV2FybmVkID0gZmFsc2U7XG4gICAgICAgIHdoaWxlIChuZXh0KSB7XG4gICAgICAgICAgaWYgKCFpc01pc21hdGNoQWxsb3dlZChlbCwgMSAvKiBDSElMRFJFTiAqLykpIHtcbiAgICAgICAgICAgIGlmICgoISEocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09IFwicHJvZHVjdGlvblwiKSB8fCBfX1ZVRV9QUk9EX0hZRFJBVElPTl9NSVNNQVRDSF9ERVRBSUxTX18pICYmICFoYXNXYXJuZWQpIHtcbiAgICAgICAgICAgICAgd2FybiQxKFxuICAgICAgICAgICAgICAgIGBIeWRyYXRpb24gY2hpbGRyZW4gbWlzbWF0Y2ggb25gLFxuICAgICAgICAgICAgICAgIGVsLFxuICAgICAgICAgICAgICAgIGBcblNlcnZlciByZW5kZXJlZCBlbGVtZW50IGNvbnRhaW5zIG1vcmUgY2hpbGQgbm9kZXMgdGhhbiBjbGllbnQgdmRvbS5gXG4gICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgIGhhc1dhcm5lZCA9IHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBsb2dNaXNtYXRjaEVycm9yKCk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGNvbnN0IGN1ciA9IG5leHQ7XG4gICAgICAgICAgbmV4dCA9IG5leHQubmV4dFNpYmxpbmc7XG4gICAgICAgICAgcmVtb3ZlKGN1cik7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSBpZiAoc2hhcGVGbGFnICYgOCkge1xuICAgICAgICBsZXQgY2xpZW50VGV4dCA9IHZub2RlLmNoaWxkcmVuO1xuICAgICAgICBpZiAoY2xpZW50VGV4dFswXSA9PT0gXCJcXG5cIiAmJiAoZWwudGFnTmFtZSA9PT0gXCJQUkVcIiB8fCBlbC50YWdOYW1lID09PSBcIlRFWFRBUkVBXCIpKSB7XG4gICAgICAgICAgY2xpZW50VGV4dCA9IGNsaWVudFRleHQuc2xpY2UoMSk7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgeyB0ZXh0Q29udGVudCB9ID0gZWw7XG4gICAgICAgIGlmICh0ZXh0Q29udGVudCAhPT0gY2xpZW50VGV4dCAmJiAvLyBpbm5lckhUTUwgbm9ybWFsaXplIFxcclxcbiBvciBcXHIgaW50byBhIHNpbmdsZSBcXG4gaW4gdGhlIERPTVxuICAgICAgICB0ZXh0Q29udGVudCAhPT0gY2xpZW50VGV4dC5yZXBsYWNlKC9cXHJcXG58XFxyL2csIFwiXFxuXCIpKSB7XG4gICAgICAgICAgaWYgKCFpc01pc21hdGNoQWxsb3dlZChlbCwgMCAvKiBURVhUICovKSkge1xuICAgICAgICAgICAgKCEhKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSBcInByb2R1Y3Rpb25cIikgfHwgX19WVUVfUFJPRF9IWURSQVRJT05fTUlTTUFUQ0hfREVUQUlMU19fKSAmJiB3YXJuJDEoXG4gICAgICAgICAgICAgIGBIeWRyYXRpb24gdGV4dCBjb250ZW50IG1pc21hdGNoIG9uYCxcbiAgICAgICAgICAgICAgZWwsXG4gICAgICAgICAgICAgIGBcbiAgLSByZW5kZXJlZCBvbiBzZXJ2ZXI6ICR7dGV4dENvbnRlbnR9XG4gIC0gZXhwZWN0ZWQgb24gY2xpZW50OiAke2NsaWVudFRleHR9YFxuICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIGxvZ01pc21hdGNoRXJyb3IoKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgZWwudGV4dENvbnRlbnQgPSB2bm9kZS5jaGlsZHJlbjtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgaWYgKHByb3BzKSB7XG4gICAgICAgIGlmICghIShwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gXCJwcm9kdWN0aW9uXCIpIHx8IF9fVlVFX1BST0RfSFlEUkFUSU9OX01JU01BVENIX0RFVEFJTFNfXyB8fCBmb3JjZVBhdGNoIHx8ICFvcHRpbWl6ZWQgfHwgcGF0Y2hGbGFnICYgKDE2IHwgMzIpKSB7XG4gICAgICAgICAgY29uc3QgaXNDdXN0b21FbGVtZW50ID0gZWwudGFnTmFtZS5pbmNsdWRlcyhcIi1cIik7XG4gICAgICAgICAgZm9yIChjb25zdCBrZXkgaW4gcHJvcHMpIHtcbiAgICAgICAgICAgIGlmICgoISEocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09IFwicHJvZHVjdGlvblwiKSB8fCBfX1ZVRV9QUk9EX0hZRFJBVElPTl9NSVNNQVRDSF9ERVRBSUxTX18pICYmIC8vICMxMTE4OSBza2lwIGlmIHRoaXMgbm9kZSBoYXMgZGlyZWN0aXZlcyB0aGF0IGhhdmUgY3JlYXRlZCBob29rc1xuICAgICAgICAgICAgLy8gYXMgaXQgY291bGQgaGF2ZSBtdXRhdGVkIHRoZSBET00gaW4gYW55IHBvc3NpYmxlIHdheVxuICAgICAgICAgICAgIShkaXJzICYmIGRpcnMuc29tZSgoZCkgPT4gZC5kaXIuY3JlYXRlZCkpICYmIHByb3BIYXNNaXNtYXRjaChlbCwga2V5LCBwcm9wc1trZXldLCB2bm9kZSwgcGFyZW50Q29tcG9uZW50KSkge1xuICAgICAgICAgICAgICBsb2dNaXNtYXRjaEVycm9yKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoZm9yY2VQYXRjaCAmJiAoa2V5LmVuZHNXaXRoKFwidmFsdWVcIikgfHwga2V5ID09PSBcImluZGV0ZXJtaW5hdGVcIikgfHwgaXNPbihrZXkpICYmICFpc1Jlc2VydmVkUHJvcChrZXkpIHx8IC8vIGZvcmNlIGh5ZHJhdGUgdi1iaW5kIHdpdGggLnByb3AgbW9kaWZpZXJzXG4gICAgICAgICAgICBrZXlbMF0gPT09IFwiLlwiIHx8IGlzQ3VzdG9tRWxlbWVudCAmJiAhaXNSZXNlcnZlZFByb3Aoa2V5KSkge1xuICAgICAgICAgICAgICBwYXRjaFByb3AoZWwsIGtleSwgbnVsbCwgcHJvcHNba2V5XSwgdm9pZCAwLCBwYXJlbnRDb21wb25lbnQpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIGlmIChwcm9wcy5vbkNsaWNrKSB7XG4gICAgICAgICAgcGF0Y2hQcm9wKFxuICAgICAgICAgICAgZWwsXG4gICAgICAgICAgICBcIm9uQ2xpY2tcIixcbiAgICAgICAgICAgIG51bGwsXG4gICAgICAgICAgICBwcm9wcy5vbkNsaWNrLFxuICAgICAgICAgICAgdm9pZCAwLFxuICAgICAgICAgICAgcGFyZW50Q29tcG9uZW50XG4gICAgICAgICAgKTtcbiAgICAgICAgfSBlbHNlIGlmIChwYXRjaEZsYWcgJiA0ICYmIGlzUmVhY3RpdmUocHJvcHMuc3R5bGUpKSB7XG4gICAgICAgICAgZm9yIChjb25zdCBrZXkgaW4gcHJvcHMuc3R5bGUpIHByb3BzLnN0eWxlW2tleV07XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGxldCB2bm9kZUhvb2tzO1xuICAgICAgaWYgKHZub2RlSG9va3MgPSBwcm9wcyAmJiBwcm9wcy5vblZub2RlQmVmb3JlTW91bnQpIHtcbiAgICAgICAgaW52b2tlVk5vZGVIb29rKHZub2RlSG9va3MsIHBhcmVudENvbXBvbmVudCwgdm5vZGUpO1xuICAgICAgfVxuICAgICAgaWYgKGRpcnMpIHtcbiAgICAgICAgaW52b2tlRGlyZWN0aXZlSG9vayh2bm9kZSwgbnVsbCwgcGFyZW50Q29tcG9uZW50LCBcImJlZm9yZU1vdW50XCIpO1xuICAgICAgfVxuICAgICAgaWYgKCh2bm9kZUhvb2tzID0gcHJvcHMgJiYgcHJvcHMub25Wbm9kZU1vdW50ZWQpIHx8IGRpcnMgfHwgbmVlZENhbGxUcmFuc2l0aW9uSG9va3MpIHtcbiAgICAgICAgcXVldWVFZmZlY3RXaXRoU3VzcGVuc2UoKCkgPT4ge1xuICAgICAgICAgIHZub2RlSG9va3MgJiYgaW52b2tlVk5vZGVIb29rKHZub2RlSG9va3MsIHBhcmVudENvbXBvbmVudCwgdm5vZGUpO1xuICAgICAgICAgIG5lZWRDYWxsVHJhbnNpdGlvbkhvb2tzICYmIHRyYW5zaXRpb24uZW50ZXIoZWwpO1xuICAgICAgICAgIGRpcnMgJiYgaW52b2tlRGlyZWN0aXZlSG9vayh2bm9kZSwgbnVsbCwgcGFyZW50Q29tcG9uZW50LCBcIm1vdW50ZWRcIik7XG4gICAgICAgIH0sIHBhcmVudFN1c3BlbnNlKTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGVsLm5leHRTaWJsaW5nO1xuICB9O1xuICBjb25zdCBoeWRyYXRlQ2hpbGRyZW4gPSAobm9kZSwgcGFyZW50Vk5vZGUsIGNvbnRhaW5lciwgcGFyZW50Q29tcG9uZW50LCBwYXJlbnRTdXNwZW5zZSwgc2xvdFNjb3BlSWRzLCBvcHRpbWl6ZWQpID0+IHtcbiAgICBvcHRpbWl6ZWQgPSBvcHRpbWl6ZWQgfHwgISFwYXJlbnRWTm9kZS5keW5hbWljQ2hpbGRyZW47XG4gICAgY29uc3QgY2hpbGRyZW4gPSBwYXJlbnRWTm9kZS5jaGlsZHJlbjtcbiAgICBjb25zdCBsID0gY2hpbGRyZW4ubGVuZ3RoO1xuICAgIGxldCBoYXNXYXJuZWQgPSBmYWxzZTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGw7IGkrKykge1xuICAgICAgY29uc3Qgdm5vZGUgPSBvcHRpbWl6ZWQgPyBjaGlsZHJlbltpXSA6IGNoaWxkcmVuW2ldID0gbm9ybWFsaXplVk5vZGUoY2hpbGRyZW5baV0pO1xuICAgICAgY29uc3QgaXNUZXh0ID0gdm5vZGUudHlwZSA9PT0gVGV4dDtcbiAgICAgIGlmIChub2RlKSB7XG4gICAgICAgIGlmIChpc1RleHQgJiYgIW9wdGltaXplZCkge1xuICAgICAgICAgIGlmIChpICsgMSA8IGwgJiYgbm9ybWFsaXplVk5vZGUoY2hpbGRyZW5baSArIDFdKS50eXBlID09PSBUZXh0KSB7XG4gICAgICAgICAgICBpbnNlcnQoXG4gICAgICAgICAgICAgIGNyZWF0ZVRleHQoXG4gICAgICAgICAgICAgICAgbm9kZS5kYXRhLnNsaWNlKHZub2RlLmNoaWxkcmVuLmxlbmd0aClcbiAgICAgICAgICAgICAgKSxcbiAgICAgICAgICAgICAgY29udGFpbmVyLFxuICAgICAgICAgICAgICBuZXh0U2libGluZyhub2RlKVxuICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIG5vZGUuZGF0YSA9IHZub2RlLmNoaWxkcmVuO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBub2RlID0gaHlkcmF0ZU5vZGUoXG4gICAgICAgICAgbm9kZSxcbiAgICAgICAgICB2bm9kZSxcbiAgICAgICAgICBwYXJlbnRDb21wb25lbnQsXG4gICAgICAgICAgcGFyZW50U3VzcGVuc2UsXG4gICAgICAgICAgc2xvdFNjb3BlSWRzLFxuICAgICAgICAgIG9wdGltaXplZFxuICAgICAgICApO1xuICAgICAgfSBlbHNlIGlmIChpc1RleHQgJiYgIXZub2RlLmNoaWxkcmVuKSB7XG4gICAgICAgIGluc2VydCh2bm9kZS5lbCA9IGNyZWF0ZVRleHQoXCJcIiksIGNvbnRhaW5lcik7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpZiAoIWlzTWlzbWF0Y2hBbGxvd2VkKGNvbnRhaW5lciwgMSAvKiBDSElMRFJFTiAqLykpIHtcbiAgICAgICAgICBpZiAoKCEhKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSBcInByb2R1Y3Rpb25cIikgfHwgX19WVUVfUFJPRF9IWURSQVRJT05fTUlTTUFUQ0hfREVUQUlMU19fKSAmJiAhaGFzV2FybmVkKSB7XG4gICAgICAgICAgICB3YXJuJDEoXG4gICAgICAgICAgICAgIGBIeWRyYXRpb24gY2hpbGRyZW4gbWlzbWF0Y2ggb25gLFxuICAgICAgICAgICAgICBjb250YWluZXIsXG4gICAgICAgICAgICAgIGBcblNlcnZlciByZW5kZXJlZCBlbGVtZW50IGNvbnRhaW5zIGZld2VyIGNoaWxkIG5vZGVzIHRoYW4gY2xpZW50IHZkb20uYFxuICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIGhhc1dhcm5lZCA9IHRydWU7XG4gICAgICAgICAgfVxuICAgICAgICAgIGxvZ01pc21hdGNoRXJyb3IoKTtcbiAgICAgICAgfVxuICAgICAgICBwYXRjaChcbiAgICAgICAgICBudWxsLFxuICAgICAgICAgIHZub2RlLFxuICAgICAgICAgIGNvbnRhaW5lcixcbiAgICAgICAgICBudWxsLFxuICAgICAgICAgIHBhcmVudENvbXBvbmVudCxcbiAgICAgICAgICBwYXJlbnRTdXNwZW5zZSxcbiAgICAgICAgICBnZXRDb250YWluZXJUeXBlKGNvbnRhaW5lciksXG4gICAgICAgICAgc2xvdFNjb3BlSWRzXG4gICAgICAgICk7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBub2RlO1xuICB9O1xuICBjb25zdCBoeWRyYXRlRnJhZ21lbnQgPSAobm9kZSwgdm5vZGUsIHBhcmVudENvbXBvbmVudCwgcGFyZW50U3VzcGVuc2UsIHNsb3RTY29wZUlkcywgb3B0aW1pemVkKSA9PiB7XG4gICAgY29uc3QgeyBzbG90U2NvcGVJZHM6IGZyYWdtZW50U2xvdFNjb3BlSWRzIH0gPSB2bm9kZTtcbiAgICBpZiAoZnJhZ21lbnRTbG90U2NvcGVJZHMpIHtcbiAgICAgIHNsb3RTY29wZUlkcyA9IHNsb3RTY29wZUlkcyA/IHNsb3RTY29wZUlkcy5jb25jYXQoZnJhZ21lbnRTbG90U2NvcGVJZHMpIDogZnJhZ21lbnRTbG90U2NvcGVJZHM7XG4gICAgfVxuICAgIGNvbnN0IGNvbnRhaW5lciA9IHBhcmVudE5vZGUobm9kZSk7XG4gICAgY29uc3QgbmV4dCA9IGh5ZHJhdGVDaGlsZHJlbihcbiAgICAgIG5leHRTaWJsaW5nKG5vZGUpLFxuICAgICAgdm5vZGUsXG4gICAgICBjb250YWluZXIsXG4gICAgICBwYXJlbnRDb21wb25lbnQsXG4gICAgICBwYXJlbnRTdXNwZW5zZSxcbiAgICAgIHNsb3RTY29wZUlkcyxcbiAgICAgIG9wdGltaXplZFxuICAgICk7XG4gICAgaWYgKG5leHQgJiYgaXNDb21tZW50KG5leHQpICYmIG5leHQuZGF0YSA9PT0gXCJdXCIpIHtcbiAgICAgIHJldHVybiBuZXh0U2libGluZyh2bm9kZS5hbmNob3IgPSBuZXh0KTtcbiAgICB9IGVsc2Uge1xuICAgICAgbG9nTWlzbWF0Y2hFcnJvcigpO1xuICAgICAgaW5zZXJ0KHZub2RlLmFuY2hvciA9IGNyZWF0ZUNvbW1lbnQoYF1gKSwgY29udGFpbmVyLCBuZXh0KTtcbiAgICAgIHJldHVybiBuZXh0O1xuICAgIH1cbiAgfTtcbiAgY29uc3QgaGFuZGxlTWlzbWF0Y2ggPSAobm9kZSwgdm5vZGUsIHBhcmVudENvbXBvbmVudCwgcGFyZW50U3VzcGVuc2UsIHNsb3RTY29wZUlkcywgaXNGcmFnbWVudCkgPT4ge1xuICAgIGlmICghaXNNaXNtYXRjaEFsbG93ZWQobm9kZS5wYXJlbnRFbGVtZW50LCAxIC8qIENISUxEUkVOICovKSkge1xuICAgICAgKCEhKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSBcInByb2R1Y3Rpb25cIikgfHwgX19WVUVfUFJPRF9IWURSQVRJT05fTUlTTUFUQ0hfREVUQUlMU19fKSAmJiB3YXJuJDEoXG4gICAgICAgIGBIeWRyYXRpb24gbm9kZSBtaXNtYXRjaDpcbi0gcmVuZGVyZWQgb24gc2VydmVyOmAsXG4gICAgICAgIG5vZGUsXG4gICAgICAgIG5vZGUubm9kZVR5cGUgPT09IDMgPyBgKHRleHQpYCA6IGlzQ29tbWVudChub2RlKSAmJiBub2RlLmRhdGEgPT09IFwiW1wiID8gYChzdGFydCBvZiBmcmFnbWVudClgIDogYGAsXG4gICAgICAgIGBcbi0gZXhwZWN0ZWQgb24gY2xpZW50OmAsXG4gICAgICAgIHZub2RlLnR5cGVcbiAgICAgICk7XG4gICAgICBsb2dNaXNtYXRjaEVycm9yKCk7XG4gICAgfVxuICAgIHZub2RlLmVsID0gbnVsbDtcbiAgICBpZiAoaXNGcmFnbWVudCkge1xuICAgICAgY29uc3QgZW5kID0gbG9jYXRlQ2xvc2luZ0FuY2hvcihub2RlKTtcbiAgICAgIHdoaWxlICh0cnVlKSB7XG4gICAgICAgIGNvbnN0IG5leHQyID0gbmV4dFNpYmxpbmcobm9kZSk7XG4gICAgICAgIGlmIChuZXh0MiAmJiBuZXh0MiAhPT0gZW5kKSB7XG4gICAgICAgICAgcmVtb3ZlKG5leHQyKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICBjb25zdCBuZXh0ID0gbmV4dFNpYmxpbmcobm9kZSk7XG4gICAgY29uc3QgY29udGFpbmVyID0gcGFyZW50Tm9kZShub2RlKTtcbiAgICByZW1vdmUobm9kZSk7XG4gICAgcGF0Y2goXG4gICAgICBudWxsLFxuICAgICAgdm5vZGUsXG4gICAgICBjb250YWluZXIsXG4gICAgICBuZXh0LFxuICAgICAgcGFyZW50Q29tcG9uZW50LFxuICAgICAgcGFyZW50U3VzcGVuc2UsXG4gICAgICBnZXRDb250YWluZXJUeXBlKGNvbnRhaW5lciksXG4gICAgICBzbG90U2NvcGVJZHNcbiAgICApO1xuICAgIGlmIChwYXJlbnRDb21wb25lbnQpIHtcbiAgICAgIHBhcmVudENvbXBvbmVudC52bm9kZS5lbCA9IHZub2RlLmVsO1xuICAgICAgdXBkYXRlSE9DSG9zdEVsKHBhcmVudENvbXBvbmVudCwgdm5vZGUuZWwpO1xuICAgIH1cbiAgICByZXR1cm4gbmV4dDtcbiAgfTtcbiAgY29uc3QgbG9jYXRlQ2xvc2luZ0FuY2hvciA9IChub2RlLCBvcGVuID0gXCJbXCIsIGNsb3NlID0gXCJdXCIpID0+IHtcbiAgICBsZXQgbWF0Y2ggPSAwO1xuICAgIHdoaWxlIChub2RlKSB7XG4gICAgICBub2RlID0gbmV4dFNpYmxpbmcobm9kZSk7XG4gICAgICBpZiAobm9kZSAmJiBpc0NvbW1lbnQobm9kZSkpIHtcbiAgICAgICAgaWYgKG5vZGUuZGF0YSA9PT0gb3BlbikgbWF0Y2grKztcbiAgICAgICAgaWYgKG5vZGUuZGF0YSA9PT0gY2xvc2UpIHtcbiAgICAgICAgICBpZiAobWF0Y2ggPT09IDApIHtcbiAgICAgICAgICAgIHJldHVybiBuZXh0U2libGluZyhub2RlKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgbWF0Y2gtLTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIG5vZGU7XG4gIH07XG4gIGNvbnN0IHJlcGxhY2VOb2RlID0gKG5ld05vZGUsIG9sZE5vZGUsIHBhcmVudENvbXBvbmVudCkgPT4ge1xuICAgIGNvbnN0IHBhcmVudE5vZGUyID0gb2xkTm9kZS5wYXJlbnROb2RlO1xuICAgIGlmIChwYXJlbnROb2RlMikge1xuICAgICAgcGFyZW50Tm9kZTIucmVwbGFjZUNoaWxkKG5ld05vZGUsIG9sZE5vZGUpO1xuICAgIH1cbiAgICBsZXQgcGFyZW50ID0gcGFyZW50Q29tcG9uZW50O1xuICAgIHdoaWxlIChwYXJlbnQpIHtcbiAgICAgIGlmIChwYXJlbnQudm5vZGUuZWwgPT09IG9sZE5vZGUpIHtcbiAgICAgICAgcGFyZW50LnZub2RlLmVsID0gcGFyZW50LnN1YlRyZWUuZWwgPSBuZXdOb2RlO1xuICAgICAgfVxuICAgICAgcGFyZW50ID0gcGFyZW50LnBhcmVudDtcbiAgICB9XG4gIH07XG4gIGNvbnN0IGlzVGVtcGxhdGVOb2RlID0gKG5vZGUpID0+IHtcbiAgICByZXR1cm4gbm9kZS5ub2RlVHlwZSA9PT0gMSAmJiBub2RlLnRhZ05hbWUgPT09IFwiVEVNUExBVEVcIjtcbiAgfTtcbiAgcmV0dXJuIFtoeWRyYXRlLCBoeWRyYXRlTm9kZV07XG59XG5mdW5jdGlvbiBwcm9wSGFzTWlzbWF0Y2goZWwsIGtleSwgY2xpZW50VmFsdWUsIHZub2RlLCBpbnN0YW5jZSkge1xuICBsZXQgbWlzbWF0Y2hUeXBlO1xuICBsZXQgbWlzbWF0Y2hLZXk7XG4gIGxldCBhY3R1YWw7XG4gIGxldCBleHBlY3RlZDtcbiAgaWYgKGtleSA9PT0gXCJjbGFzc1wiKSB7XG4gICAgaWYgKGVsLiRjbHMpIHtcbiAgICAgIGFjdHVhbCA9IGVsLiRjbHM7XG4gICAgICBkZWxldGUgZWwuJGNscztcbiAgICB9IGVsc2Uge1xuICAgICAgYWN0dWFsID0gZWwuZ2V0QXR0cmlidXRlKFwiY2xhc3NcIik7XG4gICAgfVxuICAgIGV4cGVjdGVkID0gbm9ybWFsaXplQ2xhc3MoY2xpZW50VmFsdWUpO1xuICAgIGlmICghaXNTZXRFcXVhbCh0b0NsYXNzU2V0KGFjdHVhbCB8fCBcIlwiKSwgdG9DbGFzc1NldChleHBlY3RlZCkpKSB7XG4gICAgICBtaXNtYXRjaFR5cGUgPSAyIC8qIENMQVNTICovO1xuICAgICAgbWlzbWF0Y2hLZXkgPSBgY2xhc3NgO1xuICAgIH1cbiAgfSBlbHNlIGlmIChrZXkgPT09IFwic3R5bGVcIikge1xuICAgIGFjdHVhbCA9IGVsLmdldEF0dHJpYnV0ZShcInN0eWxlXCIpIHx8IFwiXCI7XG4gICAgZXhwZWN0ZWQgPSBpc1N0cmluZyhjbGllbnRWYWx1ZSkgPyBjbGllbnRWYWx1ZSA6IHN0cmluZ2lmeVN0eWxlKG5vcm1hbGl6ZVN0eWxlKGNsaWVudFZhbHVlKSk7XG4gICAgY29uc3QgYWN0dWFsTWFwID0gdG9TdHlsZU1hcChhY3R1YWwpO1xuICAgIGNvbnN0IGV4cGVjdGVkTWFwID0gdG9TdHlsZU1hcChleHBlY3RlZCk7XG4gICAgaWYgKHZub2RlLmRpcnMpIHtcbiAgICAgIGZvciAoY29uc3QgeyBkaXIsIHZhbHVlIH0gb2Ygdm5vZGUuZGlycykge1xuICAgICAgICBpZiAoZGlyLm5hbWUgPT09IFwic2hvd1wiICYmICF2YWx1ZSkge1xuICAgICAgICAgIGV4cGVjdGVkTWFwLnNldChcImRpc3BsYXlcIiwgXCJub25lXCIpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIGlmIChpbnN0YW5jZSkge1xuICAgICAgcmVzb2x2ZUNzc1ZhcnMoaW5zdGFuY2UsIHZub2RlLCBleHBlY3RlZE1hcCk7XG4gICAgfVxuICAgIGlmICghaXNNYXBFcXVhbChhY3R1YWxNYXAsIGV4cGVjdGVkTWFwKSkge1xuICAgICAgbWlzbWF0Y2hUeXBlID0gMyAvKiBTVFlMRSAqLztcbiAgICAgIG1pc21hdGNoS2V5ID0gXCJzdHlsZVwiO1xuICAgIH1cbiAgfSBlbHNlIGlmIChlbCBpbnN0YW5jZW9mIFNWR0VsZW1lbnQgJiYgaXNLbm93blN2Z0F0dHIoa2V5KSB8fCBlbCBpbnN0YW5jZW9mIEhUTUxFbGVtZW50ICYmIChpc0Jvb2xlYW5BdHRyKGtleSkgfHwgaXNLbm93bkh0bWxBdHRyKGtleSkpKSB7XG4gICAgaWYgKGlzQm9vbGVhbkF0dHIoa2V5KSkge1xuICAgICAgYWN0dWFsID0gZWwuaGFzQXR0cmlidXRlKGtleSk7XG4gICAgICBleHBlY3RlZCA9IGluY2x1ZGVCb29sZWFuQXR0cihjbGllbnRWYWx1ZSk7XG4gICAgfSBlbHNlIGlmIChjbGllbnRWYWx1ZSA9PSBudWxsKSB7XG4gICAgICBhY3R1YWwgPSBlbC5oYXNBdHRyaWJ1dGUoa2V5KTtcbiAgICAgIGV4cGVjdGVkID0gZmFsc2U7XG4gICAgfSBlbHNlIHtcbiAgICAgIGlmIChlbC5oYXNBdHRyaWJ1dGUoa2V5KSkge1xuICAgICAgICBhY3R1YWwgPSBlbC5nZXRBdHRyaWJ1dGUoa2V5KTtcbiAgICAgIH0gZWxzZSBpZiAoa2V5ID09PSBcInZhbHVlXCIgJiYgZWwudGFnTmFtZSA9PT0gXCJURVhUQVJFQVwiKSB7XG4gICAgICAgIGFjdHVhbCA9IGVsLnZhbHVlO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgYWN0dWFsID0gZmFsc2U7XG4gICAgICB9XG4gICAgICBleHBlY3RlZCA9IGlzUmVuZGVyYWJsZUF0dHJWYWx1ZShjbGllbnRWYWx1ZSkgPyBTdHJpbmcoY2xpZW50VmFsdWUpIDogZmFsc2U7XG4gICAgfVxuICAgIGlmIChhY3R1YWwgIT09IGV4cGVjdGVkKSB7XG4gICAgICBtaXNtYXRjaFR5cGUgPSA0IC8qIEFUVFJJQlVURSAqLztcbiAgICAgIG1pc21hdGNoS2V5ID0ga2V5O1xuICAgIH1cbiAgfVxuICBpZiAobWlzbWF0Y2hUeXBlICE9IG51bGwgJiYgIWlzTWlzbWF0Y2hBbGxvd2VkKGVsLCBtaXNtYXRjaFR5cGUpKSB7XG4gICAgY29uc3QgZm9ybWF0ID0gKHYpID0+IHYgPT09IGZhbHNlID8gYChub3QgcmVuZGVyZWQpYCA6IGAke21pc21hdGNoS2V5fT1cIiR7dn1cImA7XG4gICAgY29uc3QgcHJlU2VnbWVudCA9IGBIeWRyYXRpb24gJHtNaXNtYXRjaFR5cGVTdHJpbmdbbWlzbWF0Y2hUeXBlXX0gbWlzbWF0Y2ggb25gO1xuICAgIGNvbnN0IHBvc3RTZWdtZW50ID0gYFxuICAtIHJlbmRlcmVkIG9uIHNlcnZlcjogJHtmb3JtYXQoYWN0dWFsKX1cbiAgLSBleHBlY3RlZCBvbiBjbGllbnQ6ICR7Zm9ybWF0KGV4cGVjdGVkKX1cbiAgTm90ZTogdGhpcyBtaXNtYXRjaCBpcyBjaGVjay1vbmx5LiBUaGUgRE9NIHdpbGwgbm90IGJlIHJlY3RpZmllZCBpbiBwcm9kdWN0aW9uIGR1ZSB0byBwZXJmb3JtYW5jZSBvdmVyaGVhZC5cbiAgWW91IHNob3VsZCBmaXggdGhlIHNvdXJjZSBvZiB0aGUgbWlzbWF0Y2guYDtcbiAgICB7XG4gICAgICB3YXJuJDEocHJlU2VnbWVudCwgZWwsIHBvc3RTZWdtZW50KTtcbiAgICB9XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cbiAgcmV0dXJuIGZhbHNlO1xufVxuZnVuY3Rpb24gdG9DbGFzc1NldChzdHIpIHtcbiAgcmV0dXJuIG5ldyBTZXQoc3RyLnRyaW0oKS5zcGxpdCgvXFxzKy8pKTtcbn1cbmZ1bmN0aW9uIGlzU2V0RXF1YWwoYSwgYikge1xuICBpZiAoYS5zaXplICE9PSBiLnNpemUpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbiAgZm9yIChjb25zdCBzIG9mIGEpIHtcbiAgICBpZiAoIWIuaGFzKHMpKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICB9XG4gIHJldHVybiB0cnVlO1xufVxuZnVuY3Rpb24gdG9TdHlsZU1hcChzdHIpIHtcbiAgY29uc3Qgc3R5bGVNYXAgPSAvKiBAX19QVVJFX18gKi8gbmV3IE1hcCgpO1xuICBmb3IgKGNvbnN0IGl0ZW0gb2Ygc3RyLnNwbGl0KFwiO1wiKSkge1xuICAgIGxldCBba2V5LCB2YWx1ZV0gPSBpdGVtLnNwbGl0KFwiOlwiKTtcbiAgICBrZXkgPSBrZXkudHJpbSgpO1xuICAgIHZhbHVlID0gdmFsdWUgJiYgdmFsdWUudHJpbSgpO1xuICAgIGlmIChrZXkgJiYgdmFsdWUpIHtcbiAgICAgIHN0eWxlTWFwLnNldChrZXksIHZhbHVlKTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHN0eWxlTWFwO1xufVxuZnVuY3Rpb24gaXNNYXBFcXVhbChhLCBiKSB7XG4gIGlmIChhLnNpemUgIT09IGIuc2l6ZSkge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuICBmb3IgKGNvbnN0IFtrZXksIHZhbHVlXSBvZiBhKSB7XG4gICAgaWYgKHZhbHVlICE9PSBiLmdldChrZXkpKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICB9XG4gIHJldHVybiB0cnVlO1xufVxuZnVuY3Rpb24gcmVzb2x2ZUNzc1ZhcnMoaW5zdGFuY2UsIHZub2RlLCBleHBlY3RlZE1hcCkge1xuICBjb25zdCByb290ID0gaW5zdGFuY2Uuc3ViVHJlZTtcbiAgaWYgKGluc3RhbmNlLmdldENzc1ZhcnMgJiYgKHZub2RlID09PSByb290IHx8IHJvb3QgJiYgcm9vdC50eXBlID09PSBGcmFnbWVudCAmJiByb290LmNoaWxkcmVuLmluY2x1ZGVzKHZub2RlKSkpIHtcbiAgICBjb25zdCBjc3NWYXJzID0gaW5zdGFuY2UuZ2V0Q3NzVmFycygpO1xuICAgIGZvciAoY29uc3Qga2V5IGluIGNzc1ZhcnMpIHtcbiAgICAgIGNvbnN0IHZhbHVlID0gbm9ybWFsaXplQ3NzVmFyVmFsdWUoY3NzVmFyc1trZXldKTtcbiAgICAgIGV4cGVjdGVkTWFwLnNldChgLS0ke2dldEVzY2FwZWRDc3NWYXJOYW1lKGtleSwgZmFsc2UpfWAsIHZhbHVlKTtcbiAgICB9XG4gIH1cbiAgaWYgKHZub2RlID09PSByb290ICYmIGluc3RhbmNlLnBhcmVudCkge1xuICAgIHJlc29sdmVDc3NWYXJzKGluc3RhbmNlLnBhcmVudCwgaW5zdGFuY2Uudm5vZGUsIGV4cGVjdGVkTWFwKTtcbiAgfVxufVxuY29uc3QgYWxsb3dNaXNtYXRjaEF0dHIgPSBcImRhdGEtYWxsb3ctbWlzbWF0Y2hcIjtcbmNvbnN0IE1pc21hdGNoVHlwZVN0cmluZyA9IHtcbiAgWzAgLyogVEVYVCAqL106IFwidGV4dFwiLFxuICBbMSAvKiBDSElMRFJFTiAqL106IFwiY2hpbGRyZW5cIixcbiAgWzIgLyogQ0xBU1MgKi9dOiBcImNsYXNzXCIsXG4gIFszIC8qIFNUWUxFICovXTogXCJzdHlsZVwiLFxuICBbNCAvKiBBVFRSSUJVVEUgKi9dOiBcImF0dHJpYnV0ZVwiXG59O1xuZnVuY3Rpb24gaXNNaXNtYXRjaEFsbG93ZWQoZWwsIGFsbG93ZWRUeXBlKSB7XG4gIGlmIChhbGxvd2VkVHlwZSA9PT0gMCAvKiBURVhUICovIHx8IGFsbG93ZWRUeXBlID09PSAxIC8qIENISUxEUkVOICovKSB7XG4gICAgd2hpbGUgKGVsICYmICFlbC5oYXNBdHRyaWJ1dGUoYWxsb3dNaXNtYXRjaEF0dHIpKSB7XG4gICAgICBlbCA9IGVsLnBhcmVudEVsZW1lbnQ7XG4gICAgfVxuICB9XG4gIGNvbnN0IGFsbG93ZWRBdHRyID0gZWwgJiYgZWwuZ2V0QXR0cmlidXRlKGFsbG93TWlzbWF0Y2hBdHRyKTtcbiAgaWYgKGFsbG93ZWRBdHRyID09IG51bGwpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH0gZWxzZSBpZiAoYWxsb3dlZEF0dHIgPT09IFwiXCIpIHtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfSBlbHNlIHtcbiAgICBjb25zdCBsaXN0ID0gYWxsb3dlZEF0dHIuc3BsaXQoXCIsXCIpO1xuICAgIGlmIChhbGxvd2VkVHlwZSA9PT0gMCAvKiBURVhUICovICYmIGxpc3QuaW5jbHVkZXMoXCJjaGlsZHJlblwiKSkge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICAgIHJldHVybiBsaXN0LmluY2x1ZGVzKE1pc21hdGNoVHlwZVN0cmluZ1thbGxvd2VkVHlwZV0pO1xuICB9XG59XG5cbmNvbnN0IHJlcXVlc3RJZGxlQ2FsbGJhY2sgPSBnZXRHbG9iYWxUaGlzKCkucmVxdWVzdElkbGVDYWxsYmFjayB8fCAoKGNiKSA9PiBzZXRUaW1lb3V0KGNiLCAxKSk7XG5jb25zdCBjYW5jZWxJZGxlQ2FsbGJhY2sgPSBnZXRHbG9iYWxUaGlzKCkuY2FuY2VsSWRsZUNhbGxiYWNrIHx8ICgoaWQpID0+IGNsZWFyVGltZW91dChpZCkpO1xuY29uc3QgaHlkcmF0ZU9uSWRsZSA9ICh0aW1lb3V0ID0gMWU0KSA9PiAoaHlkcmF0ZSkgPT4ge1xuICBjb25zdCBpZCA9IHJlcXVlc3RJZGxlQ2FsbGJhY2soaHlkcmF0ZSwgeyB0aW1lb3V0IH0pO1xuICByZXR1cm4gKCkgPT4gY2FuY2VsSWRsZUNhbGxiYWNrKGlkKTtcbn07XG5mdW5jdGlvbiBlbGVtZW50SXNWaXNpYmxlSW5WaWV3cG9ydChlbCkge1xuICBjb25zdCB7IHRvcCwgbGVmdCwgYm90dG9tLCByaWdodCB9ID0gZWwuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG4gIGNvbnN0IHsgaW5uZXJIZWlnaHQsIGlubmVyV2lkdGggfSA9IHdpbmRvdztcbiAgcmV0dXJuICh0b3AgPiAwICYmIHRvcCA8IGlubmVySGVpZ2h0IHx8IGJvdHRvbSA+IDAgJiYgYm90dG9tIDwgaW5uZXJIZWlnaHQpICYmIChsZWZ0ID4gMCAmJiBsZWZ0IDwgaW5uZXJXaWR0aCB8fCByaWdodCA+IDAgJiYgcmlnaHQgPCBpbm5lcldpZHRoKTtcbn1cbmNvbnN0IGh5ZHJhdGVPblZpc2libGUgPSAob3B0cykgPT4gKGh5ZHJhdGUsIGZvckVhY2gpID0+IHtcbiAgY29uc3Qgb2IgPSBuZXcgSW50ZXJzZWN0aW9uT2JzZXJ2ZXIoKGVudHJpZXMpID0+IHtcbiAgICBmb3IgKGNvbnN0IGUgb2YgZW50cmllcykge1xuICAgICAgaWYgKCFlLmlzSW50ZXJzZWN0aW5nKSBjb250aW51ZTtcbiAgICAgIG9iLmRpc2Nvbm5lY3QoKTtcbiAgICAgIGh5ZHJhdGUoKTtcbiAgICAgIGJyZWFrO1xuICAgIH1cbiAgfSwgb3B0cyk7XG4gIGZvckVhY2goKGVsKSA9PiB7XG4gICAgaWYgKCEoZWwgaW5zdGFuY2VvZiBFbGVtZW50KSkgcmV0dXJuO1xuICAgIGlmIChlbGVtZW50SXNWaXNpYmxlSW5WaWV3cG9ydChlbCkpIHtcbiAgICAgIGh5ZHJhdGUoKTtcbiAgICAgIG9iLmRpc2Nvbm5lY3QoKTtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgb2Iub2JzZXJ2ZShlbCk7XG4gIH0pO1xuICByZXR1cm4gKCkgPT4gb2IuZGlzY29ubmVjdCgpO1xufTtcbmNvbnN0IGh5ZHJhdGVPbk1lZGlhUXVlcnkgPSAocXVlcnkpID0+IChoeWRyYXRlKSA9PiB7XG4gIGlmIChxdWVyeSkge1xuICAgIGNvbnN0IG1xbCA9IG1hdGNoTWVkaWEocXVlcnkpO1xuICAgIGlmIChtcWwubWF0Y2hlcykge1xuICAgICAgaHlkcmF0ZSgpO1xuICAgIH0gZWxzZSB7XG4gICAgICBtcWwuYWRkRXZlbnRMaXN0ZW5lcihcImNoYW5nZVwiLCBoeWRyYXRlLCB7IG9uY2U6IHRydWUgfSk7XG4gICAgICByZXR1cm4gKCkgPT4gbXFsLnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJjaGFuZ2VcIiwgaHlkcmF0ZSk7XG4gICAgfVxuICB9XG59O1xuY29uc3QgaHlkcmF0ZU9uSW50ZXJhY3Rpb24gPSAoaW50ZXJhY3Rpb25zID0gW10pID0+IChoeWRyYXRlLCBmb3JFYWNoKSA9PiB7XG4gIGlmIChpc1N0cmluZyhpbnRlcmFjdGlvbnMpKSBpbnRlcmFjdGlvbnMgPSBbaW50ZXJhY3Rpb25zXTtcbiAgbGV0IGhhc0h5ZHJhdGVkID0gZmFsc2U7XG4gIGNvbnN0IGRvSHlkcmF0ZSA9IChlKSA9PiB7XG4gICAgaWYgKCFoYXNIeWRyYXRlZCkge1xuICAgICAgaGFzSHlkcmF0ZWQgPSB0cnVlO1xuICAgICAgdGVhcmRvd24oKTtcbiAgICAgIGh5ZHJhdGUoKTtcbiAgICAgIGUudGFyZ2V0LmRpc3BhdGNoRXZlbnQobmV3IGUuY29uc3RydWN0b3IoZS50eXBlLCBlKSk7XG4gICAgfVxuICB9O1xuICBjb25zdCB0ZWFyZG93biA9ICgpID0+IHtcbiAgICBmb3JFYWNoKChlbCkgPT4ge1xuICAgICAgZm9yIChjb25zdCBpIG9mIGludGVyYWN0aW9ucykge1xuICAgICAgICBlbC5yZW1vdmVFdmVudExpc3RlbmVyKGksIGRvSHlkcmF0ZSk7XG4gICAgICB9XG4gICAgfSk7XG4gIH07XG4gIGZvckVhY2goKGVsKSA9PiB7XG4gICAgZm9yIChjb25zdCBpIG9mIGludGVyYWN0aW9ucykge1xuICAgICAgZWwuYWRkRXZlbnRMaXN0ZW5lcihpLCBkb0h5ZHJhdGUsIHsgb25jZTogdHJ1ZSB9KTtcbiAgICB9XG4gIH0pO1xuICByZXR1cm4gdGVhcmRvd247XG59O1xuZnVuY3Rpb24gZm9yRWFjaEVsZW1lbnQobm9kZSwgY2IpIHtcbiAgaWYgKGlzQ29tbWVudChub2RlKSAmJiBub2RlLmRhdGEgPT09IFwiW1wiKSB7XG4gICAgbGV0IGRlcHRoID0gMTtcbiAgICBsZXQgbmV4dCA9IG5vZGUubmV4dFNpYmxpbmc7XG4gICAgd2hpbGUgKG5leHQpIHtcbiAgICAgIGlmIChuZXh0Lm5vZGVUeXBlID09PSAxKSB7XG4gICAgICAgIGNvbnN0IHJlc3VsdCA9IGNiKG5leHQpO1xuICAgICAgICBpZiAocmVzdWx0ID09PSBmYWxzZSkge1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICB9IGVsc2UgaWYgKGlzQ29tbWVudChuZXh0KSkge1xuICAgICAgICBpZiAobmV4dC5kYXRhID09PSBcIl1cIikge1xuICAgICAgICAgIGlmICgtLWRlcHRoID09PSAwKSBicmVhaztcbiAgICAgICAgfSBlbHNlIGlmIChuZXh0LmRhdGEgPT09IFwiW1wiKSB7XG4gICAgICAgICAgZGVwdGgrKztcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgbmV4dCA9IG5leHQubmV4dFNpYmxpbmc7XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIGNiKG5vZGUpO1xuICB9XG59XG5cbmNvbnN0IGlzQXN5bmNXcmFwcGVyID0gKGkpID0+ICEhaS50eXBlLl9fYXN5bmNMb2FkZXI7XG4vLyBAX19OT19TSURFX0VGRkVDVFNfX1xuZnVuY3Rpb24gZGVmaW5lQXN5bmNDb21wb25lbnQoc291cmNlKSB7XG4gIGlmIChpc0Z1bmN0aW9uKHNvdXJjZSkpIHtcbiAgICBzb3VyY2UgPSB7IGxvYWRlcjogc291cmNlIH07XG4gIH1cbiAgY29uc3Qge1xuICAgIGxvYWRlcixcbiAgICBsb2FkaW5nQ29tcG9uZW50LFxuICAgIGVycm9yQ29tcG9uZW50LFxuICAgIGRlbGF5ID0gMjAwLFxuICAgIGh5ZHJhdGU6IGh5ZHJhdGVTdHJhdGVneSxcbiAgICB0aW1lb3V0LFxuICAgIC8vIHVuZGVmaW5lZCA9IG5ldmVyIHRpbWVzIG91dFxuICAgIHN1c3BlbnNpYmxlID0gdHJ1ZSxcbiAgICBvbkVycm9yOiB1c2VyT25FcnJvclxuICB9ID0gc291cmNlO1xuICBsZXQgcGVuZGluZ1JlcXVlc3QgPSBudWxsO1xuICBsZXQgcmVzb2x2ZWRDb21wO1xuICBsZXQgcmV0cmllcyA9IDA7XG4gIGNvbnN0IHJldHJ5ID0gKCkgPT4ge1xuICAgIHJldHJpZXMrKztcbiAgICBwZW5kaW5nUmVxdWVzdCA9IG51bGw7XG4gICAgcmV0dXJuIGxvYWQoKTtcbiAgfTtcbiAgY29uc3QgbG9hZCA9ICgpID0+IHtcbiAgICBsZXQgdGhpc1JlcXVlc3Q7XG4gICAgcmV0dXJuIHBlbmRpbmdSZXF1ZXN0IHx8ICh0aGlzUmVxdWVzdCA9IHBlbmRpbmdSZXF1ZXN0ID0gbG9hZGVyKCkuY2F0Y2goKGVycikgPT4ge1xuICAgICAgZXJyID0gZXJyIGluc3RhbmNlb2YgRXJyb3IgPyBlcnIgOiBuZXcgRXJyb3IoU3RyaW5nKGVycikpO1xuICAgICAgaWYgKHVzZXJPbkVycm9yKSB7XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgY29uc3QgdXNlclJldHJ5ID0gKCkgPT4gcmVzb2x2ZShyZXRyeSgpKTtcbiAgICAgICAgICBjb25zdCB1c2VyRmFpbCA9ICgpID0+IHJlamVjdChlcnIpO1xuICAgICAgICAgIHVzZXJPbkVycm9yKGVyciwgdXNlclJldHJ5LCB1c2VyRmFpbCwgcmV0cmllcyArIDEpO1xuICAgICAgICB9KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRocm93IGVycjtcbiAgICAgIH1cbiAgICB9KS50aGVuKChjb21wKSA9PiB7XG4gICAgICBpZiAodGhpc1JlcXVlc3QgIT09IHBlbmRpbmdSZXF1ZXN0ICYmIHBlbmRpbmdSZXF1ZXN0KSB7XG4gICAgICAgIHJldHVybiBwZW5kaW5nUmVxdWVzdDtcbiAgICAgIH1cbiAgICAgIGlmICghIShwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gXCJwcm9kdWN0aW9uXCIpICYmICFjb21wKSB7XG4gICAgICAgIHdhcm4kMShcbiAgICAgICAgICBgQXN5bmMgY29tcG9uZW50IGxvYWRlciByZXNvbHZlZCB0byB1bmRlZmluZWQuIElmIHlvdSBhcmUgdXNpbmcgcmV0cnkoKSwgbWFrZSBzdXJlIHRvIHJldHVybiBpdHMgcmV0dXJuIHZhbHVlLmBcbiAgICAgICAgKTtcbiAgICAgIH1cbiAgICAgIGlmIChjb21wICYmIChjb21wLl9fZXNNb2R1bGUgfHwgY29tcFtTeW1ib2wudG9TdHJpbmdUYWddID09PSBcIk1vZHVsZVwiKSkge1xuICAgICAgICBjb21wID0gY29tcC5kZWZhdWx0O1xuICAgICAgfVxuICAgICAgaWYgKCEhKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSBcInByb2R1Y3Rpb25cIikgJiYgY29tcCAmJiAhaXNPYmplY3QoY29tcCkgJiYgIWlzRnVuY3Rpb24oY29tcCkpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBJbnZhbGlkIGFzeW5jIGNvbXBvbmVudCBsb2FkIHJlc3VsdDogJHtjb21wfWApO1xuICAgICAgfVxuICAgICAgcmVzb2x2ZWRDb21wID0gY29tcDtcbiAgICAgIHJldHVybiBjb21wO1xuICAgIH0pKTtcbiAgfTtcbiAgcmV0dXJuIGRlZmluZUNvbXBvbmVudCh7XG4gICAgbmFtZTogXCJBc3luY0NvbXBvbmVudFdyYXBwZXJcIixcbiAgICBfX2FzeW5jTG9hZGVyOiBsb2FkLFxuICAgIF9fYXN5bmNIeWRyYXRlKGVsLCBpbnN0YW5jZSwgaHlkcmF0ZSkge1xuICAgICAgbGV0IHBhdGNoZWQgPSBmYWxzZTtcbiAgICAgIChpbnN0YW5jZS5idSB8fCAoaW5zdGFuY2UuYnUgPSBbXSkpLnB1c2goKCkgPT4gcGF0Y2hlZCA9IHRydWUpO1xuICAgICAgY29uc3QgcGVyZm9ybUh5ZHJhdGUgPSAoKSA9PiB7XG4gICAgICAgIGlmIChwYXRjaGVkKSB7XG4gICAgICAgICAgaWYgKCEhKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSBcInByb2R1Y3Rpb25cIikpIHtcbiAgICAgICAgICAgIHdhcm4kMShcbiAgICAgICAgICAgICAgYFNraXBwaW5nIGxhenkgaHlkcmF0aW9uIGZvciBjb21wb25lbnQgJyR7Z2V0Q29tcG9uZW50TmFtZShyZXNvbHZlZENvbXApIHx8IHJlc29sdmVkQ29tcC5fX2ZpbGV9JzogaXQgd2FzIHVwZGF0ZWQgYmVmb3JlIGxhenkgaHlkcmF0aW9uIHBlcmZvcm1lZC5gXG4gICAgICAgICAgICApO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgaHlkcmF0ZSgpO1xuICAgICAgfTtcbiAgICAgIGNvbnN0IGRvSHlkcmF0ZSA9IGh5ZHJhdGVTdHJhdGVneSA/ICgpID0+IHtcbiAgICAgICAgY29uc3QgdGVhcmRvd24gPSBoeWRyYXRlU3RyYXRlZ3koXG4gICAgICAgICAgcGVyZm9ybUh5ZHJhdGUsXG4gICAgICAgICAgKGNiKSA9PiBmb3JFYWNoRWxlbWVudChlbCwgY2IpXG4gICAgICAgICk7XG4gICAgICAgIGlmICh0ZWFyZG93bikge1xuICAgICAgICAgIChpbnN0YW5jZS5idW0gfHwgKGluc3RhbmNlLmJ1bSA9IFtdKSkucHVzaCh0ZWFyZG93bik7XG4gICAgICAgIH1cbiAgICAgIH0gOiBwZXJmb3JtSHlkcmF0ZTtcbiAgICAgIGlmIChyZXNvbHZlZENvbXApIHtcbiAgICAgICAgZG9IeWRyYXRlKCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBsb2FkKCkudGhlbigoKSA9PiAhaW5zdGFuY2UuaXNVbm1vdW50ZWQgJiYgZG9IeWRyYXRlKCkpO1xuICAgICAgfVxuICAgIH0sXG4gICAgZ2V0IF9fYXN5bmNSZXNvbHZlZCgpIHtcbiAgICAgIHJldHVybiByZXNvbHZlZENvbXA7XG4gICAgfSxcbiAgICBzZXR1cCgpIHtcbiAgICAgIGNvbnN0IGluc3RhbmNlID0gY3VycmVudEluc3RhbmNlO1xuICAgICAgbWFya0FzeW5jQm91bmRhcnkoaW5zdGFuY2UpO1xuICAgICAgaWYgKHJlc29sdmVkQ29tcCkge1xuICAgICAgICByZXR1cm4gKCkgPT4gY3JlYXRlSW5uZXJDb21wKHJlc29sdmVkQ29tcCwgaW5zdGFuY2UpO1xuICAgICAgfVxuICAgICAgY29uc3Qgb25FcnJvciA9IChlcnIpID0+IHtcbiAgICAgICAgcGVuZGluZ1JlcXVlc3QgPSBudWxsO1xuICAgICAgICBoYW5kbGVFcnJvcihcbiAgICAgICAgICBlcnIsXG4gICAgICAgICAgaW5zdGFuY2UsXG4gICAgICAgICAgMTMsXG4gICAgICAgICAgIWVycm9yQ29tcG9uZW50XG4gICAgICAgICk7XG4gICAgICB9O1xuICAgICAgaWYgKHN1c3BlbnNpYmxlICYmIGluc3RhbmNlLnN1c3BlbnNlIHx8IGlzSW5TU1JDb21wb25lbnRTZXR1cCkge1xuICAgICAgICByZXR1cm4gbG9hZCgpLnRoZW4oKGNvbXApID0+IHtcbiAgICAgICAgICByZXR1cm4gKCkgPT4gY3JlYXRlSW5uZXJDb21wKGNvbXAsIGluc3RhbmNlKTtcbiAgICAgICAgfSkuY2F0Y2goKGVycikgPT4ge1xuICAgICAgICAgIG9uRXJyb3IoZXJyKTtcbiAgICAgICAgICByZXR1cm4gKCkgPT4gZXJyb3JDb21wb25lbnQgPyBjcmVhdGVWTm9kZShlcnJvckNvbXBvbmVudCwge1xuICAgICAgICAgICAgZXJyb3I6IGVyclxuICAgICAgICAgIH0pIDogbnVsbDtcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgICBjb25zdCBsb2FkZWQgPSByZWYoZmFsc2UpO1xuICAgICAgY29uc3QgZXJyb3IgPSByZWYoKTtcbiAgICAgIGNvbnN0IGRlbGF5ZWQgPSByZWYoISFkZWxheSk7XG4gICAgICBpZiAoZGVsYXkpIHtcbiAgICAgICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgZGVsYXllZC52YWx1ZSA9IGZhbHNlO1xuICAgICAgICB9LCBkZWxheSk7XG4gICAgICB9XG4gICAgICBpZiAodGltZW91dCAhPSBudWxsKSB7XG4gICAgICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICAgIGlmICghbG9hZGVkLnZhbHVlICYmICFlcnJvci52YWx1ZSkge1xuICAgICAgICAgICAgY29uc3QgZXJyID0gbmV3IEVycm9yKFxuICAgICAgICAgICAgICBgQXN5bmMgY29tcG9uZW50IHRpbWVkIG91dCBhZnRlciAke3RpbWVvdXR9bXMuYFxuICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIG9uRXJyb3IoZXJyKTtcbiAgICAgICAgICAgIGVycm9yLnZhbHVlID0gZXJyO1xuICAgICAgICAgIH1cbiAgICAgICAgfSwgdGltZW91dCk7XG4gICAgICB9XG4gICAgICBsb2FkKCkudGhlbigoKSA9PiB7XG4gICAgICAgIGxvYWRlZC52YWx1ZSA9IHRydWU7XG4gICAgICAgIGlmIChpbnN0YW5jZS5wYXJlbnQgJiYgaXNLZWVwQWxpdmUoaW5zdGFuY2UucGFyZW50LnZub2RlKSkge1xuICAgICAgICAgIGluc3RhbmNlLnBhcmVudC51cGRhdGUoKTtcbiAgICAgICAgfVxuICAgICAgfSkuY2F0Y2goKGVycikgPT4ge1xuICAgICAgICBvbkVycm9yKGVycik7XG4gICAgICAgIGVycm9yLnZhbHVlID0gZXJyO1xuICAgICAgfSk7XG4gICAgICByZXR1cm4gKCkgPT4ge1xuICAgICAgICBpZiAobG9hZGVkLnZhbHVlICYmIHJlc29sdmVkQ29tcCkge1xuICAgICAgICAgIHJldHVybiBjcmVhdGVJbm5lckNvbXAocmVzb2x2ZWRDb21wLCBpbnN0YW5jZSk7XG4gICAgICAgIH0gZWxzZSBpZiAoZXJyb3IudmFsdWUgJiYgZXJyb3JDb21wb25lbnQpIHtcbiAgICAgICAgICByZXR1cm4gY3JlYXRlVk5vZGUoZXJyb3JDb21wb25lbnQsIHtcbiAgICAgICAgICAgIGVycm9yOiBlcnJvci52YWx1ZVxuICAgICAgICAgIH0pO1xuICAgICAgICB9IGVsc2UgaWYgKGxvYWRpbmdDb21wb25lbnQgJiYgIWRlbGF5ZWQudmFsdWUpIHtcbiAgICAgICAgICByZXR1cm4gY3JlYXRlSW5uZXJDb21wKFxuICAgICAgICAgICAgbG9hZGluZ0NvbXBvbmVudCxcbiAgICAgICAgICAgIGluc3RhbmNlXG4gICAgICAgICAgKTtcbiAgICAgICAgfVxuICAgICAgfTtcbiAgICB9XG4gIH0pO1xufVxuZnVuY3Rpb24gY3JlYXRlSW5uZXJDb21wKGNvbXAsIHBhcmVudCkge1xuICBjb25zdCB7IHJlZjogcmVmMiwgcHJvcHMsIGNoaWxkcmVuLCBjZSB9ID0gcGFyZW50LnZub2RlO1xuICBjb25zdCB2bm9kZSA9IGNyZWF0ZVZOb2RlKGNvbXAsIHByb3BzLCBjaGlsZHJlbik7XG4gIHZub2RlLnJlZiA9IHJlZjI7XG4gIHZub2RlLmNlID0gY2U7XG4gIGRlbGV0ZSBwYXJlbnQudm5vZGUuY2U7XG4gIHJldHVybiB2bm9kZTtcbn1cblxuY29uc3QgaXNLZWVwQWxpdmUgPSAodm5vZGUpID0+IHZub2RlLnR5cGUuX19pc0tlZXBBbGl2ZTtcbmNvbnN0IEtlZXBBbGl2ZUltcGwgPSB7XG4gIG5hbWU6IGBLZWVwQWxpdmVgLFxuICAvLyBNYXJrZXIgZm9yIHNwZWNpYWwgaGFuZGxpbmcgaW5zaWRlIHRoZSByZW5kZXJlci4gV2UgYXJlIG5vdCB1c2luZyBhID09PVxuICAvLyBjaGVjayBkaXJlY3RseSBvbiBLZWVwQWxpdmUgaW4gdGhlIHJlbmRlcmVyLCBiZWNhdXNlIGltcG9ydGluZyBpdCBkaXJlY3RseVxuICAvLyB3b3VsZCBwcmV2ZW50IGl0IGZyb20gYmVpbmcgdHJlZS1zaGFrZW4uXG4gIF9faXNLZWVwQWxpdmU6IHRydWUsXG4gIHByb3BzOiB7XG4gICAgaW5jbHVkZTogW1N0cmluZywgUmVnRXhwLCBBcnJheV0sXG4gICAgZXhjbHVkZTogW1N0cmluZywgUmVnRXhwLCBBcnJheV0sXG4gICAgbWF4OiBbU3RyaW5nLCBOdW1iZXJdXG4gIH0sXG4gIHNldHVwKHByb3BzLCB7IHNsb3RzIH0pIHtcbiAgICBjb25zdCBpbnN0YW5jZSA9IGdldEN1cnJlbnRJbnN0YW5jZSgpO1xuICAgIGNvbnN0IHNoYXJlZENvbnRleHQgPSBpbnN0YW5jZS5jdHg7XG4gICAgaWYgKCFzaGFyZWRDb250ZXh0LnJlbmRlcmVyKSB7XG4gICAgICByZXR1cm4gKCkgPT4ge1xuICAgICAgICBjb25zdCBjaGlsZHJlbiA9IHNsb3RzLmRlZmF1bHQgJiYgc2xvdHMuZGVmYXVsdCgpO1xuICAgICAgICByZXR1cm4gY2hpbGRyZW4gJiYgY2hpbGRyZW4ubGVuZ3RoID09PSAxID8gY2hpbGRyZW5bMF0gOiBjaGlsZHJlbjtcbiAgICAgIH07XG4gICAgfVxuICAgIGNvbnN0IGNhY2hlID0gLyogQF9fUFVSRV9fICovIG5ldyBNYXAoKTtcbiAgICBjb25zdCBrZXlzID0gLyogQF9fUFVSRV9fICovIG5ldyBTZXQoKTtcbiAgICBsZXQgY3VycmVudCA9IG51bGw7XG4gICAgaWYgKCEhKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSBcInByb2R1Y3Rpb25cIikgfHwgX19WVUVfUFJPRF9ERVZUT09MU19fKSB7XG4gICAgICBpbnN0YW5jZS5fX3ZfY2FjaGUgPSBjYWNoZTtcbiAgICB9XG4gICAgY29uc3QgcGFyZW50U3VzcGVuc2UgPSBpbnN0YW5jZS5zdXNwZW5zZTtcbiAgICBjb25zdCB7XG4gICAgICByZW5kZXJlcjoge1xuICAgICAgICBwOiBwYXRjaCxcbiAgICAgICAgbTogbW92ZSxcbiAgICAgICAgdW06IF91bm1vdW50LFxuICAgICAgICBvOiB7IGNyZWF0ZUVsZW1lbnQgfVxuICAgICAgfVxuICAgIH0gPSBzaGFyZWRDb250ZXh0O1xuICAgIGNvbnN0IHN0b3JhZ2VDb250YWluZXIgPSBjcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICAgIHNoYXJlZENvbnRleHQuYWN0aXZhdGUgPSAodm5vZGUsIGNvbnRhaW5lciwgYW5jaG9yLCBuYW1lc3BhY2UsIG9wdGltaXplZCkgPT4ge1xuICAgICAgY29uc3QgaW5zdGFuY2UyID0gdm5vZGUuY29tcG9uZW50O1xuICAgICAgbW92ZSh2bm9kZSwgY29udGFpbmVyLCBhbmNob3IsIDAsIHBhcmVudFN1c3BlbnNlKTtcbiAgICAgIHBhdGNoKFxuICAgICAgICBpbnN0YW5jZTIudm5vZGUsXG4gICAgICAgIHZub2RlLFxuICAgICAgICBjb250YWluZXIsXG4gICAgICAgIGFuY2hvcixcbiAgICAgICAgaW5zdGFuY2UyLFxuICAgICAgICBwYXJlbnRTdXNwZW5zZSxcbiAgICAgICAgbmFtZXNwYWNlLFxuICAgICAgICB2bm9kZS5zbG90U2NvcGVJZHMsXG4gICAgICAgIG9wdGltaXplZFxuICAgICAgKTtcbiAgICAgIHF1ZXVlUG9zdFJlbmRlckVmZmVjdCgoKSA9PiB7XG4gICAgICAgIGluc3RhbmNlMi5pc0RlYWN0aXZhdGVkID0gZmFsc2U7XG4gICAgICAgIGlmIChpbnN0YW5jZTIuYSkge1xuICAgICAgICAgIGludm9rZUFycmF5Rm5zKGluc3RhbmNlMi5hKTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCB2bm9kZUhvb2sgPSB2bm9kZS5wcm9wcyAmJiB2bm9kZS5wcm9wcy5vblZub2RlTW91bnRlZDtcbiAgICAgICAgaWYgKHZub2RlSG9vaykge1xuICAgICAgICAgIGludm9rZVZOb2RlSG9vayh2bm9kZUhvb2ssIGluc3RhbmNlMi5wYXJlbnQsIHZub2RlKTtcbiAgICAgICAgfVxuICAgICAgfSwgcGFyZW50U3VzcGVuc2UpO1xuICAgICAgaWYgKCEhKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSBcInByb2R1Y3Rpb25cIikgfHwgX19WVUVfUFJPRF9ERVZUT09MU19fKSB7XG4gICAgICAgIGRldnRvb2xzQ29tcG9uZW50QWRkZWQoaW5zdGFuY2UyKTtcbiAgICAgIH1cbiAgICB9O1xuICAgIHNoYXJlZENvbnRleHQuZGVhY3RpdmF0ZSA9ICh2bm9kZSkgPT4ge1xuICAgICAgY29uc3QgaW5zdGFuY2UyID0gdm5vZGUuY29tcG9uZW50O1xuICAgICAgaW52YWxpZGF0ZU1vdW50KGluc3RhbmNlMi5tKTtcbiAgICAgIGludmFsaWRhdGVNb3VudChpbnN0YW5jZTIuYSk7XG4gICAgICBtb3ZlKHZub2RlLCBzdG9yYWdlQ29udGFpbmVyLCBudWxsLCAxLCBwYXJlbnRTdXNwZW5zZSk7XG4gICAgICBxdWV1ZVBvc3RSZW5kZXJFZmZlY3QoKCkgPT4ge1xuICAgICAgICBpZiAoaW5zdGFuY2UyLmRhKSB7XG4gICAgICAgICAgaW52b2tlQXJyYXlGbnMoaW5zdGFuY2UyLmRhKTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCB2bm9kZUhvb2sgPSB2bm9kZS5wcm9wcyAmJiB2bm9kZS5wcm9wcy5vblZub2RlVW5tb3VudGVkO1xuICAgICAgICBpZiAodm5vZGVIb29rKSB7XG4gICAgICAgICAgaW52b2tlVk5vZGVIb29rKHZub2RlSG9vaywgaW5zdGFuY2UyLnBhcmVudCwgdm5vZGUpO1xuICAgICAgICB9XG4gICAgICAgIGluc3RhbmNlMi5pc0RlYWN0aXZhdGVkID0gdHJ1ZTtcbiAgICAgIH0sIHBhcmVudFN1c3BlbnNlKTtcbiAgICAgIGlmICghIShwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gXCJwcm9kdWN0aW9uXCIpIHx8IF9fVlVFX1BST0RfREVWVE9PTFNfXykge1xuICAgICAgICBkZXZ0b29sc0NvbXBvbmVudEFkZGVkKGluc3RhbmNlMik7XG4gICAgICB9XG4gICAgICBpZiAoISEocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09IFwicHJvZHVjdGlvblwiKSAmJiB0cnVlKSB7XG4gICAgICAgIGluc3RhbmNlMi5fX2tlZXBBbGl2ZVN0b3JhZ2VDb250YWluZXIgPSBzdG9yYWdlQ29udGFpbmVyO1xuICAgICAgfVxuICAgIH07XG4gICAgZnVuY3Rpb24gdW5tb3VudCh2bm9kZSkge1xuICAgICAgcmVzZXRTaGFwZUZsYWcodm5vZGUpO1xuICAgICAgX3VubW91bnQodm5vZGUsIGluc3RhbmNlLCBwYXJlbnRTdXNwZW5zZSwgdHJ1ZSk7XG4gICAgfVxuICAgIGZ1bmN0aW9uIHBydW5lQ2FjaGUoZmlsdGVyKSB7XG4gICAgICBjYWNoZS5mb3JFYWNoKCh2bm9kZSwga2V5KSA9PiB7XG4gICAgICAgIGNvbnN0IG5hbWUgPSBnZXRDb21wb25lbnROYW1lKFxuICAgICAgICAgIGlzQXN5bmNXcmFwcGVyKHZub2RlKSA/IHZub2RlLnR5cGUuX19hc3luY1Jlc29sdmVkIHx8IHt9IDogdm5vZGUudHlwZVxuICAgICAgICApO1xuICAgICAgICBpZiAobmFtZSAmJiAhZmlsdGVyKG5hbWUpKSB7XG4gICAgICAgICAgcHJ1bmVDYWNoZUVudHJ5KGtleSk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH1cbiAgICBmdW5jdGlvbiBwcnVuZUNhY2hlRW50cnkoa2V5KSB7XG4gICAgICBjb25zdCBjYWNoZWQgPSBjYWNoZS5nZXQoa2V5KTtcbiAgICAgIGlmIChjYWNoZWQgJiYgKCFjdXJyZW50IHx8ICFpc1NhbWVWTm9kZVR5cGUoY2FjaGVkLCBjdXJyZW50KSkpIHtcbiAgICAgICAgdW5tb3VudChjYWNoZWQpO1xuICAgICAgfSBlbHNlIGlmIChjdXJyZW50KSB7XG4gICAgICAgIHJlc2V0U2hhcGVGbGFnKGN1cnJlbnQpO1xuICAgICAgfVxuICAgICAgY2FjaGUuZGVsZXRlKGtleSk7XG4gICAgICBrZXlzLmRlbGV0ZShrZXkpO1xuICAgIH1cbiAgICB3YXRjaChcbiAgICAgICgpID0+IFtwcm9wcy5pbmNsdWRlLCBwcm9wcy5leGNsdWRlXSxcbiAgICAgIChbaW5jbHVkZSwgZXhjbHVkZV0pID0+IHtcbiAgICAgICAgaW5jbHVkZSAmJiBwcnVuZUNhY2hlKChuYW1lKSA9PiBtYXRjaGVzKGluY2x1ZGUsIG5hbWUpKTtcbiAgICAgICAgZXhjbHVkZSAmJiBwcnVuZUNhY2hlKChuYW1lKSA9PiAhbWF0Y2hlcyhleGNsdWRlLCBuYW1lKSk7XG4gICAgICB9LFxuICAgICAgLy8gcHJ1bmUgcG9zdC1yZW5kZXIgYWZ0ZXIgYGN1cnJlbnRgIGhhcyBiZWVuIHVwZGF0ZWRcbiAgICAgIHsgZmx1c2g6IFwicG9zdFwiLCBkZWVwOiB0cnVlIH1cbiAgICApO1xuICAgIGxldCBwZW5kaW5nQ2FjaGVLZXkgPSBudWxsO1xuICAgIGNvbnN0IGNhY2hlU3VidHJlZSA9ICgpID0+IHtcbiAgICAgIGlmIChwZW5kaW5nQ2FjaGVLZXkgIT0gbnVsbCkge1xuICAgICAgICBpZiAoaXNTdXNwZW5zZShpbnN0YW5jZS5zdWJUcmVlLnR5cGUpKSB7XG4gICAgICAgICAgcXVldWVQb3N0UmVuZGVyRWZmZWN0KCgpID0+IHtcbiAgICAgICAgICAgIGNhY2hlLnNldChwZW5kaW5nQ2FjaGVLZXksIGdldElubmVyQ2hpbGQoaW5zdGFuY2Uuc3ViVHJlZSkpO1xuICAgICAgICAgIH0sIGluc3RhbmNlLnN1YlRyZWUuc3VzcGVuc2UpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGNhY2hlLnNldChwZW5kaW5nQ2FjaGVLZXksIGdldElubmVyQ2hpbGQoaW5zdGFuY2Uuc3ViVHJlZSkpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfTtcbiAgICBvbk1vdW50ZWQoY2FjaGVTdWJ0cmVlKTtcbiAgICBvblVwZGF0ZWQoY2FjaGVTdWJ0cmVlKTtcbiAgICBvbkJlZm9yZVVubW91bnQoKCkgPT4ge1xuICAgICAgY2FjaGUuZm9yRWFjaCgoY2FjaGVkKSA9PiB7XG4gICAgICAgIGNvbnN0IHsgc3ViVHJlZSwgc3VzcGVuc2UgfSA9IGluc3RhbmNlO1xuICAgICAgICBjb25zdCB2bm9kZSA9IGdldElubmVyQ2hpbGQoc3ViVHJlZSk7XG4gICAgICAgIGlmIChjYWNoZWQudHlwZSA9PT0gdm5vZGUudHlwZSAmJiBjYWNoZWQua2V5ID09PSB2bm9kZS5rZXkpIHtcbiAgICAgICAgICByZXNldFNoYXBlRmxhZyh2bm9kZSk7XG4gICAgICAgICAgY29uc3QgZGEgPSB2bm9kZS5jb21wb25lbnQuZGE7XG4gICAgICAgICAgZGEgJiYgcXVldWVQb3N0UmVuZGVyRWZmZWN0KGRhLCBzdXNwZW5zZSk7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHVubW91bnQoY2FjaGVkKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICAgIHJldHVybiAoKSA9PiB7XG4gICAgICBwZW5kaW5nQ2FjaGVLZXkgPSBudWxsO1xuICAgICAgaWYgKCFzbG90cy5kZWZhdWx0KSB7XG4gICAgICAgIHJldHVybiBjdXJyZW50ID0gbnVsbDtcbiAgICAgIH1cbiAgICAgIGNvbnN0IGNoaWxkcmVuID0gc2xvdHMuZGVmYXVsdCgpO1xuICAgICAgY29uc3QgcmF3Vk5vZGUgPSBjaGlsZHJlblswXTtcbiAgICAgIGlmIChjaGlsZHJlbi5sZW5ndGggPiAxKSB7XG4gICAgICAgIGlmICghIShwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gXCJwcm9kdWN0aW9uXCIpKSB7XG4gICAgICAgICAgd2FybiQxKGBLZWVwQWxpdmUgc2hvdWxkIGNvbnRhaW4gZXhhY3RseSBvbmUgY29tcG9uZW50IGNoaWxkLmApO1xuICAgICAgICB9XG4gICAgICAgIGN1cnJlbnQgPSBudWxsO1xuICAgICAgICByZXR1cm4gY2hpbGRyZW47XG4gICAgICB9IGVsc2UgaWYgKCFpc1ZOb2RlKHJhd1ZOb2RlKSB8fCAhKHJhd1ZOb2RlLnNoYXBlRmxhZyAmIDQpICYmICEocmF3Vk5vZGUuc2hhcGVGbGFnICYgMTI4KSkge1xuICAgICAgICBjdXJyZW50ID0gbnVsbDtcbiAgICAgICAgcmV0dXJuIHJhd1ZOb2RlO1xuICAgICAgfVxuICAgICAgbGV0IHZub2RlID0gZ2V0SW5uZXJDaGlsZChyYXdWTm9kZSk7XG4gICAgICBpZiAodm5vZGUudHlwZSA9PT0gQ29tbWVudCkge1xuICAgICAgICBjdXJyZW50ID0gbnVsbDtcbiAgICAgICAgcmV0dXJuIHZub2RlO1xuICAgICAgfVxuICAgICAgY29uc3QgY29tcCA9IHZub2RlLnR5cGU7XG4gICAgICBjb25zdCBuYW1lID0gZ2V0Q29tcG9uZW50TmFtZShcbiAgICAgICAgaXNBc3luY1dyYXBwZXIodm5vZGUpID8gdm5vZGUudHlwZS5fX2FzeW5jUmVzb2x2ZWQgfHwge30gOiBjb21wXG4gICAgICApO1xuICAgICAgY29uc3QgeyBpbmNsdWRlLCBleGNsdWRlLCBtYXggfSA9IHByb3BzO1xuICAgICAgaWYgKGluY2x1ZGUgJiYgKCFuYW1lIHx8ICFtYXRjaGVzKGluY2x1ZGUsIG5hbWUpKSB8fCBleGNsdWRlICYmIG5hbWUgJiYgbWF0Y2hlcyhleGNsdWRlLCBuYW1lKSkge1xuICAgICAgICB2bm9kZS5zaGFwZUZsYWcgJj0gLTI1NztcbiAgICAgICAgY3VycmVudCA9IHZub2RlO1xuICAgICAgICByZXR1cm4gcmF3Vk5vZGU7XG4gICAgICB9XG4gICAgICBjb25zdCBrZXkgPSB2bm9kZS5rZXkgPT0gbnVsbCA/IGNvbXAgOiB2bm9kZS5rZXk7XG4gICAgICBjb25zdCBjYWNoZWRWTm9kZSA9IGNhY2hlLmdldChrZXkpO1xuICAgICAgaWYgKHZub2RlLmVsKSB7XG4gICAgICAgIHZub2RlID0gY2xvbmVWTm9kZSh2bm9kZSk7XG4gICAgICAgIGlmIChyYXdWTm9kZS5zaGFwZUZsYWcgJiAxMjgpIHtcbiAgICAgICAgICByYXdWTm9kZS5zc0NvbnRlbnQgPSB2bm9kZTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgcGVuZGluZ0NhY2hlS2V5ID0ga2V5O1xuICAgICAgaWYgKGNhY2hlZFZOb2RlKSB7XG4gICAgICAgIHZub2RlLmVsID0gY2FjaGVkVk5vZGUuZWw7XG4gICAgICAgIHZub2RlLmNvbXBvbmVudCA9IGNhY2hlZFZOb2RlLmNvbXBvbmVudDtcbiAgICAgICAgaWYgKHZub2RlLnRyYW5zaXRpb24pIHtcbiAgICAgICAgICBzZXRUcmFuc2l0aW9uSG9va3Modm5vZGUsIHZub2RlLnRyYW5zaXRpb24pO1xuICAgICAgICB9XG4gICAgICAgIHZub2RlLnNoYXBlRmxhZyB8PSA1MTI7XG4gICAgICAgIGtleXMuZGVsZXRlKGtleSk7XG4gICAgICAgIGtleXMuYWRkKGtleSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBrZXlzLmFkZChrZXkpO1xuICAgICAgICBpZiAobWF4ICYmIGtleXMuc2l6ZSA+IHBhcnNlSW50KG1heCwgMTApKSB7XG4gICAgICAgICAgcHJ1bmVDYWNoZUVudHJ5KGtleXMudmFsdWVzKCkubmV4dCgpLnZhbHVlKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgdm5vZGUuc2hhcGVGbGFnIHw9IDI1NjtcbiAgICAgIGN1cnJlbnQgPSB2bm9kZTtcbiAgICAgIHJldHVybiBpc1N1c3BlbnNlKHJhd1ZOb2RlLnR5cGUpID8gcmF3Vk5vZGUgOiB2bm9kZTtcbiAgICB9O1xuICB9XG59O1xuY29uc3QgS2VlcEFsaXZlID0gS2VlcEFsaXZlSW1wbDtcbmZ1bmN0aW9uIG1hdGNoZXMocGF0dGVybiwgbmFtZSkge1xuICBpZiAoaXNBcnJheShwYXR0ZXJuKSkge1xuICAgIHJldHVybiBwYXR0ZXJuLnNvbWUoKHApID0+IG1hdGNoZXMocCwgbmFtZSkpO1xuICB9IGVsc2UgaWYgKGlzU3RyaW5nKHBhdHRlcm4pKSB7XG4gICAgcmV0dXJuIHBhdHRlcm4uc3BsaXQoXCIsXCIpLmluY2x1ZGVzKG5hbWUpO1xuICB9IGVsc2UgaWYgKGlzUmVnRXhwKHBhdHRlcm4pKSB7XG4gICAgcGF0dGVybi5sYXN0SW5kZXggPSAwO1xuICAgIHJldHVybiBwYXR0ZXJuLnRlc3QobmFtZSk7XG4gIH1cbiAgcmV0dXJuIGZhbHNlO1xufVxuZnVuY3Rpb24gb25BY3RpdmF0ZWQoaG9vaywgdGFyZ2V0KSB7XG4gIHJlZ2lzdGVyS2VlcEFsaXZlSG9vayhob29rLCBcImFcIiwgdGFyZ2V0KTtcbn1cbmZ1bmN0aW9uIG9uRGVhY3RpdmF0ZWQoaG9vaywgdGFyZ2V0KSB7XG4gIHJlZ2lzdGVyS2VlcEFsaXZlSG9vayhob29rLCBcImRhXCIsIHRhcmdldCk7XG59XG5mdW5jdGlvbiByZWdpc3RlcktlZXBBbGl2ZUhvb2soaG9vaywgdHlwZSwgdGFyZ2V0ID0gY3VycmVudEluc3RhbmNlKSB7XG4gIGNvbnN0IHdyYXBwZWRIb29rID0gaG9vay5fX3dkYyB8fCAoaG9vay5fX3dkYyA9ICgpID0+IHtcbiAgICBsZXQgY3VycmVudCA9IHRhcmdldDtcbiAgICB3aGlsZSAoY3VycmVudCkge1xuICAgICAgaWYgKGN1cnJlbnQuaXNEZWFjdGl2YXRlZCkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBjdXJyZW50ID0gY3VycmVudC5wYXJlbnQ7XG4gICAgfVxuICAgIHJldHVybiBob29rKCk7XG4gIH0pO1xuICBpbmplY3RIb29rKHR5cGUsIHdyYXBwZWRIb29rLCB0YXJnZXQpO1xuICBpZiAodGFyZ2V0KSB7XG4gICAgbGV0IGN1cnJlbnQgPSB0YXJnZXQucGFyZW50O1xuICAgIHdoaWxlIChjdXJyZW50ICYmIGN1cnJlbnQucGFyZW50KSB7XG4gICAgICBpZiAoaXNLZWVwQWxpdmUoY3VycmVudC5wYXJlbnQudm5vZGUpKSB7XG4gICAgICAgIGluamVjdFRvS2VlcEFsaXZlUm9vdCh3cmFwcGVkSG9vaywgdHlwZSwgdGFyZ2V0LCBjdXJyZW50KTtcbiAgICAgIH1cbiAgICAgIGN1cnJlbnQgPSBjdXJyZW50LnBhcmVudDtcbiAgICB9XG4gIH1cbn1cbmZ1bmN0aW9uIGluamVjdFRvS2VlcEFsaXZlUm9vdChob29rLCB0eXBlLCB0YXJnZXQsIGtlZXBBbGl2ZVJvb3QpIHtcbiAgY29uc3QgaW5qZWN0ZWQgPSBpbmplY3RIb29rKFxuICAgIHR5cGUsXG4gICAgaG9vayxcbiAgICBrZWVwQWxpdmVSb290LFxuICAgIHRydWVcbiAgICAvKiBwcmVwZW5kICovXG4gICk7XG4gIG9uVW5tb3VudGVkKCgpID0+IHtcbiAgICByZW1vdmUoa2VlcEFsaXZlUm9vdFt0eXBlXSwgaW5qZWN0ZWQpO1xuICB9LCB0YXJnZXQpO1xufVxuZnVuY3Rpb24gcmVzZXRTaGFwZUZsYWcodm5vZGUpIHtcbiAgdm5vZGUuc2hhcGVGbGFnICY9IC0yNTc7XG4gIHZub2RlLnNoYXBlRmxhZyAmPSAtNTEzO1xufVxuZnVuY3Rpb24gZ2V0SW5uZXJDaGlsZCh2bm9kZSkge1xuICByZXR1cm4gdm5vZGUuc2hhcGVGbGFnICYgMTI4ID8gdm5vZGUuc3NDb250ZW50IDogdm5vZGU7XG59XG5cbmZ1bmN0aW9uIGluamVjdEhvb2sodHlwZSwgaG9vaywgdGFyZ2V0ID0gY3VycmVudEluc3RhbmNlLCBwcmVwZW5kID0gZmFsc2UpIHtcbiAgaWYgKHRhcmdldCkge1xuICAgIGNvbnN0IGhvb2tzID0gdGFyZ2V0W3R5cGVdIHx8ICh0YXJnZXRbdHlwZV0gPSBbXSk7XG4gICAgY29uc3Qgd3JhcHBlZEhvb2sgPSBob29rLl9fd2VoIHx8IChob29rLl9fd2VoID0gKC4uLmFyZ3MpID0+IHtcbiAgICAgIHBhdXNlVHJhY2tpbmcoKTtcbiAgICAgIGNvbnN0IHJlc2V0ID0gc2V0Q3VycmVudEluc3RhbmNlKHRhcmdldCk7XG4gICAgICBjb25zdCByZXMgPSBjYWxsV2l0aEFzeW5jRXJyb3JIYW5kbGluZyhob29rLCB0YXJnZXQsIHR5cGUsIGFyZ3MpO1xuICAgICAgcmVzZXQoKTtcbiAgICAgIHJlc2V0VHJhY2tpbmcoKTtcbiAgICAgIHJldHVybiByZXM7XG4gICAgfSk7XG4gICAgaWYgKHByZXBlbmQpIHtcbiAgICAgIGhvb2tzLnVuc2hpZnQod3JhcHBlZEhvb2spO1xuICAgIH0gZWxzZSB7XG4gICAgICBob29rcy5wdXNoKHdyYXBwZWRIb29rKTtcbiAgICB9XG4gICAgcmV0dXJuIHdyYXBwZWRIb29rO1xuICB9IGVsc2UgaWYgKCEhKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSBcInByb2R1Y3Rpb25cIikpIHtcbiAgICBjb25zdCBhcGlOYW1lID0gdG9IYW5kbGVyS2V5KEVycm9yVHlwZVN0cmluZ3MkMVt0eXBlXS5yZXBsYWNlKC8gaG9vayQvLCBcIlwiKSk7XG4gICAgd2FybiQxKFxuICAgICAgYCR7YXBpTmFtZX0gaXMgY2FsbGVkIHdoZW4gdGhlcmUgaXMgbm8gYWN0aXZlIGNvbXBvbmVudCBpbnN0YW5jZSB0byBiZSBhc3NvY2lhdGVkIHdpdGguIExpZmVjeWNsZSBpbmplY3Rpb24gQVBJcyBjYW4gb25seSBiZSB1c2VkIGR1cmluZyBleGVjdXRpb24gb2Ygc2V0dXAoKS5gICsgKGAgSWYgeW91IGFyZSB1c2luZyBhc3luYyBzZXR1cCgpLCBtYWtlIHN1cmUgdG8gcmVnaXN0ZXIgbGlmZWN5Y2xlIGhvb2tzIGJlZm9yZSB0aGUgZmlyc3QgYXdhaXQgc3RhdGVtZW50LmAgKVxuICAgICk7XG4gIH1cbn1cbmNvbnN0IGNyZWF0ZUhvb2sgPSAobGlmZWN5Y2xlKSA9PiAoaG9vaywgdGFyZ2V0ID0gY3VycmVudEluc3RhbmNlKSA9PiB7XG4gIGlmICghaXNJblNTUkNvbXBvbmVudFNldHVwIHx8IGxpZmVjeWNsZSA9PT0gXCJzcFwiKSB7XG4gICAgaW5qZWN0SG9vayhsaWZlY3ljbGUsICguLi5hcmdzKSA9PiBob29rKC4uLmFyZ3MpLCB0YXJnZXQpO1xuICB9XG59O1xuY29uc3Qgb25CZWZvcmVNb3VudCA9IGNyZWF0ZUhvb2soXCJibVwiKTtcbmNvbnN0IG9uTW91bnRlZCA9IGNyZWF0ZUhvb2soXCJtXCIpO1xuY29uc3Qgb25CZWZvcmVVcGRhdGUgPSBjcmVhdGVIb29rKFxuICBcImJ1XCJcbik7XG5jb25zdCBvblVwZGF0ZWQgPSBjcmVhdGVIb29rKFwidVwiKTtcbmNvbnN0IG9uQmVmb3JlVW5tb3VudCA9IGNyZWF0ZUhvb2soXG4gIFwiYnVtXCJcbik7XG5jb25zdCBvblVubW91bnRlZCA9IGNyZWF0ZUhvb2soXCJ1bVwiKTtcbmNvbnN0IG9uU2VydmVyUHJlZmV0Y2ggPSBjcmVhdGVIb29rKFxuICBcInNwXCJcbik7XG5jb25zdCBvblJlbmRlclRyaWdnZXJlZCA9IGNyZWF0ZUhvb2soXCJydGdcIik7XG5jb25zdCBvblJlbmRlclRyYWNrZWQgPSBjcmVhdGVIb29rKFwicnRjXCIpO1xuZnVuY3Rpb24gb25FcnJvckNhcHR1cmVkKGhvb2ssIHRhcmdldCA9IGN1cnJlbnRJbnN0YW5jZSkge1xuICBpbmplY3RIb29rKFwiZWNcIiwgaG9vaywgdGFyZ2V0KTtcbn1cblxuY29uc3QgQ09NUE9ORU5UUyA9IFwiY29tcG9uZW50c1wiO1xuY29uc3QgRElSRUNUSVZFUyA9IFwiZGlyZWN0aXZlc1wiO1xuZnVuY3Rpb24gcmVzb2x2ZUNvbXBvbmVudChuYW1lLCBtYXliZVNlbGZSZWZlcmVuY2UpIHtcbiAgcmV0dXJuIHJlc29sdmVBc3NldChDT01QT05FTlRTLCBuYW1lLCB0cnVlLCBtYXliZVNlbGZSZWZlcmVuY2UpIHx8IG5hbWU7XG59XG5jb25zdCBOVUxMX0RZTkFNSUNfQ09NUE9ORU5UID0gLyogQF9fUFVSRV9fICovIFN5bWJvbC5mb3IoXCJ2LW5kY1wiKTtcbmZ1bmN0aW9uIHJlc29sdmVEeW5hbWljQ29tcG9uZW50KGNvbXBvbmVudCkge1xuICBpZiAoaXNTdHJpbmcoY29tcG9uZW50KSkge1xuICAgIHJldHVybiByZXNvbHZlQXNzZXQoQ09NUE9ORU5UUywgY29tcG9uZW50LCBmYWxzZSkgfHwgY29tcG9uZW50O1xuICB9IGVsc2Uge1xuICAgIHJldHVybiBjb21wb25lbnQgfHwgTlVMTF9EWU5BTUlDX0NPTVBPTkVOVDtcbiAgfVxufVxuZnVuY3Rpb24gcmVzb2x2ZURpcmVjdGl2ZShuYW1lKSB7XG4gIHJldHVybiByZXNvbHZlQXNzZXQoRElSRUNUSVZFUywgbmFtZSk7XG59XG5mdW5jdGlvbiByZXNvbHZlQXNzZXQodHlwZSwgbmFtZSwgd2Fybk1pc3NpbmcgPSB0cnVlLCBtYXliZVNlbGZSZWZlcmVuY2UgPSBmYWxzZSkge1xuICBjb25zdCBpbnN0YW5jZSA9IGN1cnJlbnRSZW5kZXJpbmdJbnN0YW5jZSB8fCBjdXJyZW50SW5zdGFuY2U7XG4gIGlmIChpbnN0YW5jZSkge1xuICAgIGNvbnN0IENvbXBvbmVudCA9IGluc3RhbmNlLnR5cGU7XG4gICAgaWYgKHR5cGUgPT09IENPTVBPTkVOVFMpIHtcbiAgICAgIGNvbnN0IHNlbGZOYW1lID0gZ2V0Q29tcG9uZW50TmFtZShcbiAgICAgICAgQ29tcG9uZW50LFxuICAgICAgICBmYWxzZVxuICAgICAgKTtcbiAgICAgIGlmIChzZWxmTmFtZSAmJiAoc2VsZk5hbWUgPT09IG5hbWUgfHwgc2VsZk5hbWUgPT09IGNhbWVsaXplKG5hbWUpIHx8IHNlbGZOYW1lID09PSBjYXBpdGFsaXplKGNhbWVsaXplKG5hbWUpKSkpIHtcbiAgICAgICAgcmV0dXJuIENvbXBvbmVudDtcbiAgICAgIH1cbiAgICB9XG4gICAgY29uc3QgcmVzID0gKFxuICAgICAgLy8gbG9jYWwgcmVnaXN0cmF0aW9uXG4gICAgICAvLyBjaGVjayBpbnN0YW5jZVt0eXBlXSBmaXJzdCB3aGljaCBpcyByZXNvbHZlZCBmb3Igb3B0aW9ucyBBUElcbiAgICAgIHJlc29sdmUoaW5zdGFuY2VbdHlwZV0gfHwgQ29tcG9uZW50W3R5cGVdLCBuYW1lKSB8fCAvLyBnbG9iYWwgcmVnaXN0cmF0aW9uXG4gICAgICByZXNvbHZlKGluc3RhbmNlLmFwcENvbnRleHRbdHlwZV0sIG5hbWUpXG4gICAgKTtcbiAgICBpZiAoIXJlcyAmJiBtYXliZVNlbGZSZWZlcmVuY2UpIHtcbiAgICAgIHJldHVybiBDb21wb25lbnQ7XG4gICAgfVxuICAgIGlmICghIShwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gXCJwcm9kdWN0aW9uXCIpICYmIHdhcm5NaXNzaW5nICYmICFyZXMpIHtcbiAgICAgIGNvbnN0IGV4dHJhID0gdHlwZSA9PT0gQ09NUE9ORU5UUyA/IGBcbklmIHRoaXMgaXMgYSBuYXRpdmUgY3VzdG9tIGVsZW1lbnQsIG1ha2Ugc3VyZSB0byBleGNsdWRlIGl0IGZyb20gY29tcG9uZW50IHJlc29sdXRpb24gdmlhIGNvbXBpbGVyT3B0aW9ucy5pc0N1c3RvbUVsZW1lbnQuYCA6IGBgO1xuICAgICAgd2FybiQxKGBGYWlsZWQgdG8gcmVzb2x2ZSAke3R5cGUuc2xpY2UoMCwgLTEpfTogJHtuYW1lfSR7ZXh0cmF9YCk7XG4gICAgfVxuICAgIHJldHVybiByZXM7XG4gIH0gZWxzZSBpZiAoISEocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09IFwicHJvZHVjdGlvblwiKSkge1xuICAgIHdhcm4kMShcbiAgICAgIGByZXNvbHZlJHtjYXBpdGFsaXplKHR5cGUuc2xpY2UoMCwgLTEpKX0gY2FuIG9ubHkgYmUgdXNlZCBpbiByZW5kZXIoKSBvciBzZXR1cCgpLmBcbiAgICApO1xuICB9XG59XG5mdW5jdGlvbiByZXNvbHZlKHJlZ2lzdHJ5LCBuYW1lKSB7XG4gIHJldHVybiByZWdpc3RyeSAmJiAocmVnaXN0cnlbbmFtZV0gfHwgcmVnaXN0cnlbY2FtZWxpemUobmFtZSldIHx8IHJlZ2lzdHJ5W2NhcGl0YWxpemUoY2FtZWxpemUobmFtZSkpXSk7XG59XG5cbmZ1bmN0aW9uIHJlbmRlckxpc3Qoc291cmNlLCByZW5kZXJJdGVtLCBjYWNoZSwgaW5kZXgpIHtcbiAgbGV0IHJldDtcbiAgY29uc3QgY2FjaGVkID0gY2FjaGUgJiYgY2FjaGVbaW5kZXhdO1xuICBjb25zdCBzb3VyY2VJc0FycmF5ID0gaXNBcnJheShzb3VyY2UpO1xuICBpZiAoc291cmNlSXNBcnJheSB8fCBpc1N0cmluZyhzb3VyY2UpKSB7XG4gICAgY29uc3Qgc291cmNlSXNSZWFjdGl2ZUFycmF5ID0gc291cmNlSXNBcnJheSAmJiBpc1JlYWN0aXZlKHNvdXJjZSk7XG4gICAgbGV0IG5lZWRzV3JhcCA9IGZhbHNlO1xuICAgIGxldCBpc1JlYWRvbmx5U291cmNlID0gZmFsc2U7XG4gICAgaWYgKHNvdXJjZUlzUmVhY3RpdmVBcnJheSkge1xuICAgICAgbmVlZHNXcmFwID0gIWlzU2hhbGxvdyhzb3VyY2UpO1xuICAgICAgaXNSZWFkb25seVNvdXJjZSA9IGlzUmVhZG9ubHkoc291cmNlKTtcbiAgICAgIHNvdXJjZSA9IHNoYWxsb3dSZWFkQXJyYXkoc291cmNlKTtcbiAgICB9XG4gICAgcmV0ID0gbmV3IEFycmF5KHNvdXJjZS5sZW5ndGgpO1xuICAgIGZvciAobGV0IGkgPSAwLCBsID0gc291cmNlLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgICAgcmV0W2ldID0gcmVuZGVySXRlbShcbiAgICAgICAgbmVlZHNXcmFwID8gaXNSZWFkb25seVNvdXJjZSA/IHRvUmVhZG9ubHkodG9SZWFjdGl2ZShzb3VyY2VbaV0pKSA6IHRvUmVhY3RpdmUoc291cmNlW2ldKSA6IHNvdXJjZVtpXSxcbiAgICAgICAgaSxcbiAgICAgICAgdm9pZCAwLFxuICAgICAgICBjYWNoZWQgJiYgY2FjaGVkW2ldXG4gICAgICApO1xuICAgIH1cbiAgfSBlbHNlIGlmICh0eXBlb2Ygc291cmNlID09PSBcIm51bWJlclwiKSB7XG4gICAgaWYgKCEhKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSBcInByb2R1Y3Rpb25cIikgJiYgIU51bWJlci5pc0ludGVnZXIoc291cmNlKSkge1xuICAgICAgd2FybiQxKGBUaGUgdi1mb3IgcmFuZ2UgZXhwZWN0IGFuIGludGVnZXIgdmFsdWUgYnV0IGdvdCAke3NvdXJjZX0uYCk7XG4gICAgfVxuICAgIHJldCA9IG5ldyBBcnJheShzb3VyY2UpO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgc291cmNlOyBpKyspIHtcbiAgICAgIHJldFtpXSA9IHJlbmRlckl0ZW0oaSArIDEsIGksIHZvaWQgMCwgY2FjaGVkICYmIGNhY2hlZFtpXSk7XG4gICAgfVxuICB9IGVsc2UgaWYgKGlzT2JqZWN0KHNvdXJjZSkpIHtcbiAgICBpZiAoc291cmNlW1N5bWJvbC5pdGVyYXRvcl0pIHtcbiAgICAgIHJldCA9IEFycmF5LmZyb20oXG4gICAgICAgIHNvdXJjZSxcbiAgICAgICAgKGl0ZW0sIGkpID0+IHJlbmRlckl0ZW0oaXRlbSwgaSwgdm9pZCAwLCBjYWNoZWQgJiYgY2FjaGVkW2ldKVxuICAgICAgKTtcbiAgICB9IGVsc2Uge1xuICAgICAgY29uc3Qga2V5cyA9IE9iamVjdC5rZXlzKHNvdXJjZSk7XG4gICAgICByZXQgPSBuZXcgQXJyYXkoa2V5cy5sZW5ndGgpO1xuICAgICAgZm9yIChsZXQgaSA9IDAsIGwgPSBrZXlzLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgICAgICBjb25zdCBrZXkgPSBrZXlzW2ldO1xuICAgICAgICByZXRbaV0gPSByZW5kZXJJdGVtKHNvdXJjZVtrZXldLCBrZXksIGksIGNhY2hlZCAmJiBjYWNoZWRbaV0pO1xuICAgICAgfVxuICAgIH1cbiAgfSBlbHNlIHtcbiAgICByZXQgPSBbXTtcbiAgfVxuICBpZiAoY2FjaGUpIHtcbiAgICBjYWNoZVtpbmRleF0gPSByZXQ7XG4gIH1cbiAgcmV0dXJuIHJldDtcbn1cblxuZnVuY3Rpb24gY3JlYXRlU2xvdHMoc2xvdHMsIGR5bmFtaWNTbG90cykge1xuICBmb3IgKGxldCBpID0gMDsgaSA8IGR5bmFtaWNTbG90cy5sZW5ndGg7IGkrKykge1xuICAgIGNvbnN0IHNsb3QgPSBkeW5hbWljU2xvdHNbaV07XG4gICAgaWYgKGlzQXJyYXkoc2xvdCkpIHtcbiAgICAgIGZvciAobGV0IGogPSAwOyBqIDwgc2xvdC5sZW5ndGg7IGorKykge1xuICAgICAgICBzbG90c1tzbG90W2pdLm5hbWVdID0gc2xvdFtqXS5mbjtcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKHNsb3QpIHtcbiAgICAgIHNsb3RzW3Nsb3QubmFtZV0gPSBzbG90LmtleSA/ICguLi5hcmdzKSA9PiB7XG4gICAgICAgIGNvbnN0IHJlcyA9IHNsb3QuZm4oLi4uYXJncyk7XG4gICAgICAgIGlmIChyZXMpIHJlcy5rZXkgPSBzbG90LmtleTtcbiAgICAgICAgcmV0dXJuIHJlcztcbiAgICAgIH0gOiBzbG90LmZuO1xuICAgIH1cbiAgfVxuICByZXR1cm4gc2xvdHM7XG59XG5cbmZ1bmN0aW9uIHJlbmRlclNsb3Qoc2xvdHMsIG5hbWUsIHByb3BzID0ge30sIGZhbGxiYWNrLCBub1Nsb3R0ZWQpIHtcbiAgaWYgKGN1cnJlbnRSZW5kZXJpbmdJbnN0YW5jZS5jZSB8fCBjdXJyZW50UmVuZGVyaW5nSW5zdGFuY2UucGFyZW50ICYmIGlzQXN5bmNXcmFwcGVyKGN1cnJlbnRSZW5kZXJpbmdJbnN0YW5jZS5wYXJlbnQpICYmIGN1cnJlbnRSZW5kZXJpbmdJbnN0YW5jZS5wYXJlbnQuY2UpIHtcbiAgICBjb25zdCBoYXNQcm9wcyA9IE9iamVjdC5rZXlzKHByb3BzKS5sZW5ndGggPiAwO1xuICAgIGlmIChuYW1lICE9PSBcImRlZmF1bHRcIikgcHJvcHMubmFtZSA9IG5hbWU7XG4gICAgcmV0dXJuIG9wZW5CbG9jaygpLCBjcmVhdGVCbG9jayhcbiAgICAgIEZyYWdtZW50LFxuICAgICAgbnVsbCxcbiAgICAgIFtjcmVhdGVWTm9kZShcInNsb3RcIiwgcHJvcHMsIGZhbGxiYWNrICYmIGZhbGxiYWNrKCkpXSxcbiAgICAgIGhhc1Byb3BzID8gLTIgOiA2NFxuICAgICk7XG4gIH1cbiAgbGV0IHNsb3QgPSBzbG90c1tuYW1lXTtcbiAgaWYgKCEhKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSBcInByb2R1Y3Rpb25cIikgJiYgc2xvdCAmJiBzbG90Lmxlbmd0aCA+IDEpIHtcbiAgICB3YXJuJDEoXG4gICAgICBgU1NSLW9wdGltaXplZCBzbG90IGZ1bmN0aW9uIGRldGVjdGVkIGluIGEgbm9uLVNTUi1vcHRpbWl6ZWQgcmVuZGVyIGZ1bmN0aW9uLiBZb3UgbmVlZCB0byBtYXJrIHRoaXMgY29tcG9uZW50IHdpdGggJGR5bmFtaWMtc2xvdHMgaW4gdGhlIHBhcmVudCB0ZW1wbGF0ZS5gXG4gICAgKTtcbiAgICBzbG90ID0gKCkgPT4gW107XG4gIH1cbiAgaWYgKHNsb3QgJiYgc2xvdC5fYykge1xuICAgIHNsb3QuX2QgPSBmYWxzZTtcbiAgfVxuICBvcGVuQmxvY2soKTtcbiAgY29uc3QgdmFsaWRTbG90Q29udGVudCA9IHNsb3QgJiYgZW5zdXJlVmFsaWRWTm9kZShzbG90KHByb3BzKSk7XG4gIGNvbnN0IHNsb3RLZXkgPSBwcm9wcy5rZXkgfHwgLy8gc2xvdCBjb250ZW50IGFycmF5IG9mIGEgZHluYW1pYyBjb25kaXRpb25hbCBzbG90IG1heSBoYXZlIGEgYnJhbmNoXG4gIC8vIGtleSBhdHRhY2hlZCBpbiB0aGUgYGNyZWF0ZVNsb3RzYCBoZWxwZXIsIHJlc3BlY3QgdGhhdFxuICB2YWxpZFNsb3RDb250ZW50ICYmIHZhbGlkU2xvdENvbnRlbnQua2V5O1xuICBjb25zdCByZW5kZXJlZCA9IGNyZWF0ZUJsb2NrKFxuICAgIEZyYWdtZW50LFxuICAgIHtcbiAgICAgIGtleTogKHNsb3RLZXkgJiYgIWlzU3ltYm9sKHNsb3RLZXkpID8gc2xvdEtleSA6IGBfJHtuYW1lfWApICsgLy8gIzcyNTYgZm9yY2UgZGlmZmVyZW50aWF0ZSBmYWxsYmFjayBjb250ZW50IGZyb20gYWN0dWFsIGNvbnRlbnRcbiAgICAgICghdmFsaWRTbG90Q29udGVudCAmJiBmYWxsYmFjayA/IFwiX2ZiXCIgOiBcIlwiKVxuICAgIH0sXG4gICAgdmFsaWRTbG90Q29udGVudCB8fCAoZmFsbGJhY2sgPyBmYWxsYmFjaygpIDogW10pLFxuICAgIHZhbGlkU2xvdENvbnRlbnQgJiYgc2xvdHMuXyA9PT0gMSA/IDY0IDogLTJcbiAgKTtcbiAgaWYgKCFub1Nsb3R0ZWQgJiYgcmVuZGVyZWQuc2NvcGVJZCkge1xuICAgIHJlbmRlcmVkLnNsb3RTY29wZUlkcyA9IFtyZW5kZXJlZC5zY29wZUlkICsgXCItc1wiXTtcbiAgfVxuICBpZiAoc2xvdCAmJiBzbG90Ll9jKSB7XG4gICAgc2xvdC5fZCA9IHRydWU7XG4gIH1cbiAgcmV0dXJuIHJlbmRlcmVkO1xufVxuZnVuY3Rpb24gZW5zdXJlVmFsaWRWTm9kZSh2bm9kZXMpIHtcbiAgcmV0dXJuIHZub2Rlcy5zb21lKChjaGlsZCkgPT4ge1xuICAgIGlmICghaXNWTm9kZShjaGlsZCkpIHJldHVybiB0cnVlO1xuICAgIGlmIChjaGlsZC50eXBlID09PSBDb21tZW50KSByZXR1cm4gZmFsc2U7XG4gICAgaWYgKGNoaWxkLnR5cGUgPT09IEZyYWdtZW50ICYmICFlbnN1cmVWYWxpZFZOb2RlKGNoaWxkLmNoaWxkcmVuKSlcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfSkgPyB2bm9kZXMgOiBudWxsO1xufVxuXG5mdW5jdGlvbiB0b0hhbmRsZXJzKG9iaiwgcHJlc2VydmVDYXNlSWZOZWNlc3NhcnkpIHtcbiAgY29uc3QgcmV0ID0ge307XG4gIGlmICghIShwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gXCJwcm9kdWN0aW9uXCIpICYmICFpc09iamVjdChvYmopKSB7XG4gICAgd2FybiQxKGB2LW9uIHdpdGggbm8gYXJndW1lbnQgZXhwZWN0cyBhbiBvYmplY3QgdmFsdWUuYCk7XG4gICAgcmV0dXJuIHJldDtcbiAgfVxuICBmb3IgKGNvbnN0IGtleSBpbiBvYmopIHtcbiAgICByZXRbcHJlc2VydmVDYXNlSWZOZWNlc3NhcnkgJiYgL1tBLVpdLy50ZXN0KGtleSkgPyBgb246JHtrZXl9YCA6IHRvSGFuZGxlcktleShrZXkpXSA9IG9ialtrZXldO1xuICB9XG4gIHJldHVybiByZXQ7XG59XG5cbmNvbnN0IGdldFB1YmxpY0luc3RhbmNlID0gKGkpID0+IHtcbiAgaWYgKCFpKSByZXR1cm4gbnVsbDtcbiAgaWYgKGlzU3RhdGVmdWxDb21wb25lbnQoaSkpIHJldHVybiBnZXRDb21wb25lbnRQdWJsaWNJbnN0YW5jZShpKTtcbiAgcmV0dXJuIGdldFB1YmxpY0luc3RhbmNlKGkucGFyZW50KTtcbn07XG5jb25zdCBwdWJsaWNQcm9wZXJ0aWVzTWFwID0gKFxuICAvLyBNb3ZlIFBVUkUgbWFya2VyIHRvIG5ldyBsaW5lIHRvIHdvcmthcm91bmQgY29tcGlsZXIgZGlzY2FyZGluZyBpdFxuICAvLyBkdWUgdG8gdHlwZSBhbm5vdGF0aW9uXG4gIC8qIEBfX1BVUkVfXyAqLyBleHRlbmQoLyogQF9fUFVSRV9fICovIE9iamVjdC5jcmVhdGUobnVsbCksIHtcbiAgICAkOiAoaSkgPT4gaSxcbiAgICAkZWw6IChpKSA9PiBpLnZub2RlLmVsLFxuICAgICRkYXRhOiAoaSkgPT4gaS5kYXRhLFxuICAgICRwcm9wczogKGkpID0+ICEhKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSBcInByb2R1Y3Rpb25cIikgPyBzaGFsbG93UmVhZG9ubHkoaS5wcm9wcykgOiBpLnByb3BzLFxuICAgICRhdHRyczogKGkpID0+ICEhKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSBcInByb2R1Y3Rpb25cIikgPyBzaGFsbG93UmVhZG9ubHkoaS5hdHRycykgOiBpLmF0dHJzLFxuICAgICRzbG90czogKGkpID0+ICEhKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSBcInByb2R1Y3Rpb25cIikgPyBzaGFsbG93UmVhZG9ubHkoaS5zbG90cykgOiBpLnNsb3RzLFxuICAgICRyZWZzOiAoaSkgPT4gISEocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09IFwicHJvZHVjdGlvblwiKSA/IHNoYWxsb3dSZWFkb25seShpLnJlZnMpIDogaS5yZWZzLFxuICAgICRwYXJlbnQ6IChpKSA9PiBnZXRQdWJsaWNJbnN0YW5jZShpLnBhcmVudCksXG4gICAgJHJvb3Q6IChpKSA9PiBnZXRQdWJsaWNJbnN0YW5jZShpLnJvb3QpLFxuICAgICRob3N0OiAoaSkgPT4gaS5jZSxcbiAgICAkZW1pdDogKGkpID0+IGkuZW1pdCxcbiAgICAkb3B0aW9uczogKGkpID0+IF9fVlVFX09QVElPTlNfQVBJX18gPyByZXNvbHZlTWVyZ2VkT3B0aW9ucyhpKSA6IGkudHlwZSxcbiAgICAkZm9yY2VVcGRhdGU6IChpKSA9PiBpLmYgfHwgKGkuZiA9ICgpID0+IHtcbiAgICAgIHF1ZXVlSm9iKGkudXBkYXRlKTtcbiAgICB9KSxcbiAgICAkbmV4dFRpY2s6IChpKSA9PiBpLm4gfHwgKGkubiA9IG5leHRUaWNrLmJpbmQoaS5wcm94eSkpLFxuICAgICR3YXRjaDogKGkpID0+IF9fVlVFX09QVElPTlNfQVBJX18gPyBpbnN0YW5jZVdhdGNoLmJpbmQoaSkgOiBOT09QXG4gIH0pXG4pO1xuY29uc3QgaXNSZXNlcnZlZFByZWZpeCA9IChrZXkpID0+IGtleSA9PT0gXCJfXCIgfHwga2V5ID09PSBcIiRcIjtcbmNvbnN0IGhhc1NldHVwQmluZGluZyA9IChzdGF0ZSwga2V5KSA9PiBzdGF0ZSAhPT0gRU1QVFlfT0JKICYmICFzdGF0ZS5fX2lzU2NyaXB0U2V0dXAgJiYgaGFzT3duKHN0YXRlLCBrZXkpO1xuY29uc3QgUHVibGljSW5zdGFuY2VQcm94eUhhbmRsZXJzID0ge1xuICBnZXQoeyBfOiBpbnN0YW5jZSB9LCBrZXkpIHtcbiAgICBpZiAoa2V5ID09PSBcIl9fdl9za2lwXCIpIHtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICBjb25zdCB7IGN0eCwgc2V0dXBTdGF0ZSwgZGF0YSwgcHJvcHMsIGFjY2Vzc0NhY2hlLCB0eXBlLCBhcHBDb250ZXh0IH0gPSBpbnN0YW5jZTtcbiAgICBpZiAoISEocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09IFwicHJvZHVjdGlvblwiKSAmJiBrZXkgPT09IFwiX19pc1Z1ZVwiKSB7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gICAgaWYgKGtleVswXSAhPT0gXCIkXCIpIHtcbiAgICAgIGNvbnN0IG4gPSBhY2Nlc3NDYWNoZVtrZXldO1xuICAgICAgaWYgKG4gIT09IHZvaWQgMCkge1xuICAgICAgICBzd2l0Y2ggKG4pIHtcbiAgICAgICAgICBjYXNlIDEgLyogU0VUVVAgKi86XG4gICAgICAgICAgICByZXR1cm4gc2V0dXBTdGF0ZVtrZXldO1xuICAgICAgICAgIGNhc2UgMiAvKiBEQVRBICovOlxuICAgICAgICAgICAgcmV0dXJuIGRhdGFba2V5XTtcbiAgICAgICAgICBjYXNlIDQgLyogQ09OVEVYVCAqLzpcbiAgICAgICAgICAgIHJldHVybiBjdHhba2V5XTtcbiAgICAgICAgICBjYXNlIDMgLyogUFJPUFMgKi86XG4gICAgICAgICAgICByZXR1cm4gcHJvcHNba2V5XTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIGlmIChoYXNTZXR1cEJpbmRpbmcoc2V0dXBTdGF0ZSwga2V5KSkge1xuICAgICAgICBhY2Nlc3NDYWNoZVtrZXldID0gMSAvKiBTRVRVUCAqLztcbiAgICAgICAgcmV0dXJuIHNldHVwU3RhdGVba2V5XTtcbiAgICAgIH0gZWxzZSBpZiAoX19WVUVfT1BUSU9OU19BUElfXyAmJiBkYXRhICE9PSBFTVBUWV9PQkogJiYgaGFzT3duKGRhdGEsIGtleSkpIHtcbiAgICAgICAgYWNjZXNzQ2FjaGVba2V5XSA9IDIgLyogREFUQSAqLztcbiAgICAgICAgcmV0dXJuIGRhdGFba2V5XTtcbiAgICAgIH0gZWxzZSBpZiAoaGFzT3duKHByb3BzLCBrZXkpKSB7XG4gICAgICAgIGFjY2Vzc0NhY2hlW2tleV0gPSAzIC8qIFBST1BTICovO1xuICAgICAgICByZXR1cm4gcHJvcHNba2V5XTtcbiAgICAgIH0gZWxzZSBpZiAoY3R4ICE9PSBFTVBUWV9PQkogJiYgaGFzT3duKGN0eCwga2V5KSkge1xuICAgICAgICBhY2Nlc3NDYWNoZVtrZXldID0gNCAvKiBDT05URVhUICovO1xuICAgICAgICByZXR1cm4gY3R4W2tleV07XG4gICAgICB9IGVsc2UgaWYgKCFfX1ZVRV9PUFRJT05TX0FQSV9fIHx8IHNob3VsZENhY2hlQWNjZXNzKSB7XG4gICAgICAgIGFjY2Vzc0NhY2hlW2tleV0gPSAwIC8qIE9USEVSICovO1xuICAgICAgfVxuICAgIH1cbiAgICBjb25zdCBwdWJsaWNHZXR0ZXIgPSBwdWJsaWNQcm9wZXJ0aWVzTWFwW2tleV07XG4gICAgbGV0IGNzc01vZHVsZSwgZ2xvYmFsUHJvcGVydGllcztcbiAgICBpZiAocHVibGljR2V0dGVyKSB7XG4gICAgICBpZiAoa2V5ID09PSBcIiRhdHRyc1wiKSB7XG4gICAgICAgIHRyYWNrKGluc3RhbmNlLmF0dHJzLCBcImdldFwiLCBcIlwiKTtcbiAgICAgICAgISEocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09IFwicHJvZHVjdGlvblwiKSAmJiBtYXJrQXR0cnNBY2Nlc3NlZCgpO1xuICAgICAgfSBlbHNlIGlmICghIShwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gXCJwcm9kdWN0aW9uXCIpICYmIGtleSA9PT0gXCIkc2xvdHNcIikge1xuICAgICAgICB0cmFjayhpbnN0YW5jZSwgXCJnZXRcIiwga2V5KTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBwdWJsaWNHZXR0ZXIoaW5zdGFuY2UpO1xuICAgIH0gZWxzZSBpZiAoXG4gICAgICAvLyBjc3MgbW9kdWxlIChpbmplY3RlZCBieSB2dWUtbG9hZGVyKVxuICAgICAgKGNzc01vZHVsZSA9IHR5cGUuX19jc3NNb2R1bGVzKSAmJiAoY3NzTW9kdWxlID0gY3NzTW9kdWxlW2tleV0pXG4gICAgKSB7XG4gICAgICByZXR1cm4gY3NzTW9kdWxlO1xuICAgIH0gZWxzZSBpZiAoY3R4ICE9PSBFTVBUWV9PQkogJiYgaGFzT3duKGN0eCwga2V5KSkge1xuICAgICAgYWNjZXNzQ2FjaGVba2V5XSA9IDQgLyogQ09OVEVYVCAqLztcbiAgICAgIHJldHVybiBjdHhba2V5XTtcbiAgICB9IGVsc2UgaWYgKFxuICAgICAgLy8gZ2xvYmFsIHByb3BlcnRpZXNcbiAgICAgIGdsb2JhbFByb3BlcnRpZXMgPSBhcHBDb250ZXh0LmNvbmZpZy5nbG9iYWxQcm9wZXJ0aWVzLCBoYXNPd24oZ2xvYmFsUHJvcGVydGllcywga2V5KVxuICAgICkge1xuICAgICAge1xuICAgICAgICByZXR1cm4gZ2xvYmFsUHJvcGVydGllc1trZXldO1xuICAgICAgfVxuICAgIH0gZWxzZSBpZiAoISEocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09IFwicHJvZHVjdGlvblwiKSAmJiBjdXJyZW50UmVuZGVyaW5nSW5zdGFuY2UgJiYgKCFpc1N0cmluZyhrZXkpIHx8IC8vICMxMDkxIGF2b2lkIGludGVybmFsIGlzUmVmL2lzVk5vZGUgY2hlY2tzIG9uIGNvbXBvbmVudCBpbnN0YW5jZSBsZWFkaW5nXG4gICAgLy8gdG8gaW5maW5pdGUgd2FybmluZyBsb29wXG4gICAga2V5LmluZGV4T2YoXCJfX3ZcIikgIT09IDApKSB7XG4gICAgICBpZiAoZGF0YSAhPT0gRU1QVFlfT0JKICYmIGlzUmVzZXJ2ZWRQcmVmaXgoa2V5WzBdKSAmJiBoYXNPd24oZGF0YSwga2V5KSkge1xuICAgICAgICB3YXJuJDEoXG4gICAgICAgICAgYFByb3BlcnR5ICR7SlNPTi5zdHJpbmdpZnkoXG4gICAgICAgICAgICBrZXlcbiAgICAgICAgICApfSBtdXN0IGJlIGFjY2Vzc2VkIHZpYSAkZGF0YSBiZWNhdXNlIGl0IHN0YXJ0cyB3aXRoIGEgcmVzZXJ2ZWQgY2hhcmFjdGVyIChcIiRcIiBvciBcIl9cIikgYW5kIGlzIG5vdCBwcm94aWVkIG9uIHRoZSByZW5kZXIgY29udGV4dC5gXG4gICAgICAgICk7XG4gICAgICB9IGVsc2UgaWYgKGluc3RhbmNlID09PSBjdXJyZW50UmVuZGVyaW5nSW5zdGFuY2UpIHtcbiAgICAgICAgd2FybiQxKFxuICAgICAgICAgIGBQcm9wZXJ0eSAke0pTT04uc3RyaW5naWZ5KGtleSl9IHdhcyBhY2Nlc3NlZCBkdXJpbmcgcmVuZGVyIGJ1dCBpcyBub3QgZGVmaW5lZCBvbiBpbnN0YW5jZS5gXG4gICAgICAgICk7XG4gICAgICB9XG4gICAgfVxuICB9LFxuICBzZXQoeyBfOiBpbnN0YW5jZSB9LCBrZXksIHZhbHVlKSB7XG4gICAgY29uc3QgeyBkYXRhLCBzZXR1cFN0YXRlLCBjdHggfSA9IGluc3RhbmNlO1xuICAgIGlmIChoYXNTZXR1cEJpbmRpbmcoc2V0dXBTdGF0ZSwga2V5KSkge1xuICAgICAgc2V0dXBTdGF0ZVtrZXldID0gdmFsdWU7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9IGVsc2UgaWYgKCEhKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSBcInByb2R1Y3Rpb25cIikgJiYgc2V0dXBTdGF0ZS5fX2lzU2NyaXB0U2V0dXAgJiYgaGFzT3duKHNldHVwU3RhdGUsIGtleSkpIHtcbiAgICAgIHdhcm4kMShgQ2Fubm90IG11dGF0ZSA8c2NyaXB0IHNldHVwPiBiaW5kaW5nIFwiJHtrZXl9XCIgZnJvbSBPcHRpb25zIEFQSS5gKTtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9IGVsc2UgaWYgKF9fVlVFX09QVElPTlNfQVBJX18gJiYgZGF0YSAhPT0gRU1QVFlfT0JKICYmIGhhc093bihkYXRhLCBrZXkpKSB7XG4gICAgICBkYXRhW2tleV0gPSB2YWx1ZTtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH0gZWxzZSBpZiAoaGFzT3duKGluc3RhbmNlLnByb3BzLCBrZXkpKSB7XG4gICAgICAhIShwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gXCJwcm9kdWN0aW9uXCIpICYmIHdhcm4kMShgQXR0ZW1wdGluZyB0byBtdXRhdGUgcHJvcCBcIiR7a2V5fVwiLiBQcm9wcyBhcmUgcmVhZG9ubHkuYCk7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIGlmIChrZXlbMF0gPT09IFwiJFwiICYmIGtleS5zbGljZSgxKSBpbiBpbnN0YW5jZSkge1xuICAgICAgISEocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09IFwicHJvZHVjdGlvblwiKSAmJiB3YXJuJDEoXG4gICAgICAgIGBBdHRlbXB0aW5nIHRvIG11dGF0ZSBwdWJsaWMgcHJvcGVydHkgXCIke2tleX1cIi4gUHJvcGVydGllcyBzdGFydGluZyB3aXRoICQgYXJlIHJlc2VydmVkIGFuZCByZWFkb25seS5gXG4gICAgICApO1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH0gZWxzZSB7XG4gICAgICBpZiAoISEocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09IFwicHJvZHVjdGlvblwiKSAmJiBrZXkgaW4gaW5zdGFuY2UuYXBwQ29udGV4dC5jb25maWcuZ2xvYmFsUHJvcGVydGllcykge1xuICAgICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoY3R4LCBrZXksIHtcbiAgICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZSxcbiAgICAgICAgICB2YWx1ZVxuICAgICAgICB9KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGN0eFtrZXldID0gdmFsdWU7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiB0cnVlO1xuICB9LFxuICBoYXMoe1xuICAgIF86IHsgZGF0YSwgc2V0dXBTdGF0ZSwgYWNjZXNzQ2FjaGUsIGN0eCwgYXBwQ29udGV4dCwgcHJvcHMsIHR5cGUgfVxuICB9LCBrZXkpIHtcbiAgICBsZXQgY3NzTW9kdWxlcztcbiAgICByZXR1cm4gISEoYWNjZXNzQ2FjaGVba2V5XSB8fCBfX1ZVRV9PUFRJT05TX0FQSV9fICYmIGRhdGEgIT09IEVNUFRZX09CSiAmJiBrZXlbMF0gIT09IFwiJFwiICYmIGhhc093bihkYXRhLCBrZXkpIHx8IGhhc1NldHVwQmluZGluZyhzZXR1cFN0YXRlLCBrZXkpIHx8IGhhc093bihwcm9wcywga2V5KSB8fCBoYXNPd24oY3R4LCBrZXkpIHx8IGhhc093bihwdWJsaWNQcm9wZXJ0aWVzTWFwLCBrZXkpIHx8IGhhc093bihhcHBDb250ZXh0LmNvbmZpZy5nbG9iYWxQcm9wZXJ0aWVzLCBrZXkpIHx8IChjc3NNb2R1bGVzID0gdHlwZS5fX2Nzc01vZHVsZXMpICYmIGNzc01vZHVsZXNba2V5XSk7XG4gIH0sXG4gIGRlZmluZVByb3BlcnR5KHRhcmdldCwga2V5LCBkZXNjcmlwdG9yKSB7XG4gICAgaWYgKGRlc2NyaXB0b3IuZ2V0ICE9IG51bGwpIHtcbiAgICAgIHRhcmdldC5fLmFjY2Vzc0NhY2hlW2tleV0gPSAwO1xuICAgIH0gZWxzZSBpZiAoaGFzT3duKGRlc2NyaXB0b3IsIFwidmFsdWVcIikpIHtcbiAgICAgIHRoaXMuc2V0KHRhcmdldCwga2V5LCBkZXNjcmlwdG9yLnZhbHVlLCBudWxsKTtcbiAgICB9XG4gICAgcmV0dXJuIFJlZmxlY3QuZGVmaW5lUHJvcGVydHkodGFyZ2V0LCBrZXksIGRlc2NyaXB0b3IpO1xuICB9XG59O1xuaWYgKCEhKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSBcInByb2R1Y3Rpb25cIikgJiYgdHJ1ZSkge1xuICBQdWJsaWNJbnN0YW5jZVByb3h5SGFuZGxlcnMub3duS2V5cyA9ICh0YXJnZXQpID0+IHtcbiAgICB3YXJuJDEoXG4gICAgICBgQXZvaWQgYXBwIGxvZ2ljIHRoYXQgcmVsaWVzIG9uIGVudW1lcmF0aW5nIGtleXMgb24gYSBjb21wb25lbnQgaW5zdGFuY2UuIFRoZSBrZXlzIHdpbGwgYmUgZW1wdHkgaW4gcHJvZHVjdGlvbiBtb2RlIHRvIGF2b2lkIHBlcmZvcm1hbmNlIG92ZXJoZWFkLmBcbiAgICApO1xuICAgIHJldHVybiBSZWZsZWN0Lm93bktleXModGFyZ2V0KTtcbiAgfTtcbn1cbmNvbnN0IFJ1bnRpbWVDb21waWxlZFB1YmxpY0luc3RhbmNlUHJveHlIYW5kbGVycyA9IC8qIEBfX1BVUkVfXyAqLyBleHRlbmQoe30sIFB1YmxpY0luc3RhbmNlUHJveHlIYW5kbGVycywge1xuICBnZXQodGFyZ2V0LCBrZXkpIHtcbiAgICBpZiAoa2V5ID09PSBTeW1ib2wudW5zY29wYWJsZXMpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgcmV0dXJuIFB1YmxpY0luc3RhbmNlUHJveHlIYW5kbGVycy5nZXQodGFyZ2V0LCBrZXksIHRhcmdldCk7XG4gIH0sXG4gIGhhcyhfLCBrZXkpIHtcbiAgICBjb25zdCBoYXMgPSBrZXlbMF0gIT09IFwiX1wiICYmICFpc0dsb2JhbGx5QWxsb3dlZChrZXkpO1xuICAgIGlmICghIShwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gXCJwcm9kdWN0aW9uXCIpICYmICFoYXMgJiYgUHVibGljSW5zdGFuY2VQcm94eUhhbmRsZXJzLmhhcyhfLCBrZXkpKSB7XG4gICAgICB3YXJuJDEoXG4gICAgICAgIGBQcm9wZXJ0eSAke0pTT04uc3RyaW5naWZ5KFxuICAgICAgICAgIGtleVxuICAgICAgICApfSBzaG91bGQgbm90IHN0YXJ0IHdpdGggXyB3aGljaCBpcyBhIHJlc2VydmVkIHByZWZpeCBmb3IgVnVlIGludGVybmFscy5gXG4gICAgICApO1xuICAgIH1cbiAgICByZXR1cm4gaGFzO1xuICB9XG59KTtcbmZ1bmN0aW9uIGNyZWF0ZURldlJlbmRlckNvbnRleHQoaW5zdGFuY2UpIHtcbiAgY29uc3QgdGFyZ2V0ID0ge307XG4gIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0YXJnZXQsIGBfYCwge1xuICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZSxcbiAgICBlbnVtZXJhYmxlOiBmYWxzZSxcbiAgICBnZXQ6ICgpID0+IGluc3RhbmNlXG4gIH0pO1xuICBPYmplY3Qua2V5cyhwdWJsaWNQcm9wZXJ0aWVzTWFwKS5mb3JFYWNoKChrZXkpID0+IHtcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkodGFyZ2V0LCBrZXksIHtcbiAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZSxcbiAgICAgIGVudW1lcmFibGU6IGZhbHNlLFxuICAgICAgZ2V0OiAoKSA9PiBwdWJsaWNQcm9wZXJ0aWVzTWFwW2tleV0oaW5zdGFuY2UpLFxuICAgICAgLy8gaW50ZXJjZXB0ZWQgYnkgdGhlIHByb3h5IHNvIG5vIG5lZWQgZm9yIGltcGxlbWVudGF0aW9uLFxuICAgICAgLy8gYnV0IG5lZWRlZCB0byBwcmV2ZW50IHNldCBlcnJvcnNcbiAgICAgIHNldDogTk9PUFxuICAgIH0pO1xuICB9KTtcbiAgcmV0dXJuIHRhcmdldDtcbn1cbmZ1bmN0aW9uIGV4cG9zZVByb3BzT25SZW5kZXJDb250ZXh0KGluc3RhbmNlKSB7XG4gIGNvbnN0IHtcbiAgICBjdHgsXG4gICAgcHJvcHNPcHRpb25zOiBbcHJvcHNPcHRpb25zXVxuICB9ID0gaW5zdGFuY2U7XG4gIGlmIChwcm9wc09wdGlvbnMpIHtcbiAgICBPYmplY3Qua2V5cyhwcm9wc09wdGlvbnMpLmZvckVhY2goKGtleSkgPT4ge1xuICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KGN0eCwga2V5LCB7XG4gICAgICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZSxcbiAgICAgICAgZ2V0OiAoKSA9PiBpbnN0YW5jZS5wcm9wc1trZXldLFxuICAgICAgICBzZXQ6IE5PT1BcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG59XG5mdW5jdGlvbiBleHBvc2VTZXR1cFN0YXRlT25SZW5kZXJDb250ZXh0KGluc3RhbmNlKSB7XG4gIGNvbnN0IHsgY3R4LCBzZXR1cFN0YXRlIH0gPSBpbnN0YW5jZTtcbiAgT2JqZWN0LmtleXModG9SYXcoc2V0dXBTdGF0ZSkpLmZvckVhY2goKGtleSkgPT4ge1xuICAgIGlmICghc2V0dXBTdGF0ZS5fX2lzU2NyaXB0U2V0dXApIHtcbiAgICAgIGlmIChpc1Jlc2VydmVkUHJlZml4KGtleVswXSkpIHtcbiAgICAgICAgd2FybiQxKFxuICAgICAgICAgIGBzZXR1cCgpIHJldHVybiBwcm9wZXJ0eSAke0pTT04uc3RyaW5naWZ5KFxuICAgICAgICAgICAga2V5XG4gICAgICAgICAgKX0gc2hvdWxkIG5vdCBzdGFydCB3aXRoIFwiJFwiIG9yIFwiX1wiIHdoaWNoIGFyZSByZXNlcnZlZCBwcmVmaXhlcyBmb3IgVnVlIGludGVybmFscy5gXG4gICAgICAgICk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShjdHgsIGtleSwge1xuICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWUsXG4gICAgICAgIGdldDogKCkgPT4gc2V0dXBTdGF0ZVtrZXldLFxuICAgICAgICBzZXQ6IE5PT1BcbiAgICAgIH0pO1xuICAgIH1cbiAgfSk7XG59XG5cbmNvbnN0IHdhcm5SdW50aW1lVXNhZ2UgPSAobWV0aG9kKSA9PiB3YXJuJDEoXG4gIGAke21ldGhvZH0oKSBpcyBhIGNvbXBpbGVyLWhpbnQgaGVscGVyIHRoYXQgaXMgb25seSB1c2FibGUgaW5zaWRlIDxzY3JpcHQgc2V0dXA+IG9mIGEgc2luZ2xlIGZpbGUgY29tcG9uZW50LiBJdHMgYXJndW1lbnRzIHNob3VsZCBiZSBjb21waWxlZCBhd2F5IGFuZCBwYXNzaW5nIGl0IGF0IHJ1bnRpbWUgaGFzIG5vIGVmZmVjdC5gXG4pO1xuZnVuY3Rpb24gZGVmaW5lUHJvcHMoKSB7XG4gIGlmICghIShwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gXCJwcm9kdWN0aW9uXCIpKSB7XG4gICAgd2FyblJ1bnRpbWVVc2FnZShgZGVmaW5lUHJvcHNgKTtcbiAgfVxuICByZXR1cm4gbnVsbDtcbn1cbmZ1bmN0aW9uIGRlZmluZUVtaXRzKCkge1xuICBpZiAoISEocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09IFwicHJvZHVjdGlvblwiKSkge1xuICAgIHdhcm5SdW50aW1lVXNhZ2UoYGRlZmluZUVtaXRzYCk7XG4gIH1cbiAgcmV0dXJuIG51bGw7XG59XG5mdW5jdGlvbiBkZWZpbmVFeHBvc2UoZXhwb3NlZCkge1xuICBpZiAoISEocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09IFwicHJvZHVjdGlvblwiKSkge1xuICAgIHdhcm5SdW50aW1lVXNhZ2UoYGRlZmluZUV4cG9zZWApO1xuICB9XG59XG5mdW5jdGlvbiBkZWZpbmVPcHRpb25zKG9wdGlvbnMpIHtcbiAgaWYgKCEhKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSBcInByb2R1Y3Rpb25cIikpIHtcbiAgICB3YXJuUnVudGltZVVzYWdlKGBkZWZpbmVPcHRpb25zYCk7XG4gIH1cbn1cbmZ1bmN0aW9uIGRlZmluZVNsb3RzKCkge1xuICBpZiAoISEocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09IFwicHJvZHVjdGlvblwiKSkge1xuICAgIHdhcm5SdW50aW1lVXNhZ2UoYGRlZmluZVNsb3RzYCk7XG4gIH1cbiAgcmV0dXJuIG51bGw7XG59XG5mdW5jdGlvbiBkZWZpbmVNb2RlbCgpIHtcbiAgaWYgKCEhKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSBcInByb2R1Y3Rpb25cIikpIHtcbiAgICB3YXJuUnVudGltZVVzYWdlKFwiZGVmaW5lTW9kZWxcIik7XG4gIH1cbn1cbmZ1bmN0aW9uIHdpdGhEZWZhdWx0cyhwcm9wcywgZGVmYXVsdHMpIHtcbiAgaWYgKCEhKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSBcInByb2R1Y3Rpb25cIikpIHtcbiAgICB3YXJuUnVudGltZVVzYWdlKGB3aXRoRGVmYXVsdHNgKTtcbiAgfVxuICByZXR1cm4gbnVsbDtcbn1cbmZ1bmN0aW9uIHVzZVNsb3RzKCkge1xuICByZXR1cm4gZ2V0Q29udGV4dChcInVzZVNsb3RzXCIpLnNsb3RzO1xufVxuZnVuY3Rpb24gdXNlQXR0cnMoKSB7XG4gIHJldHVybiBnZXRDb250ZXh0KFwidXNlQXR0cnNcIikuYXR0cnM7XG59XG5mdW5jdGlvbiBnZXRDb250ZXh0KGNhbGxlZEZ1bmN0aW9uTmFtZSkge1xuICBjb25zdCBpID0gZ2V0Q3VycmVudEluc3RhbmNlKCk7XG4gIGlmICghIShwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gXCJwcm9kdWN0aW9uXCIpICYmICFpKSB7XG4gICAgd2FybiQxKGAke2NhbGxlZEZ1bmN0aW9uTmFtZX0oKSBjYWxsZWQgd2l0aG91dCBhY3RpdmUgaW5zdGFuY2UuYCk7XG4gIH1cbiAgcmV0dXJuIGkuc2V0dXBDb250ZXh0IHx8IChpLnNldHVwQ29udGV4dCA9IGNyZWF0ZVNldHVwQ29udGV4dChpKSk7XG59XG5mdW5jdGlvbiBub3JtYWxpemVQcm9wc09yRW1pdHMocHJvcHMpIHtcbiAgcmV0dXJuIGlzQXJyYXkocHJvcHMpID8gcHJvcHMucmVkdWNlKFxuICAgIChub3JtYWxpemVkLCBwKSA9PiAobm9ybWFsaXplZFtwXSA9IG51bGwsIG5vcm1hbGl6ZWQpLFxuICAgIHt9XG4gICkgOiBwcm9wcztcbn1cbmZ1bmN0aW9uIG1lcmdlRGVmYXVsdHMocmF3LCBkZWZhdWx0cykge1xuICBjb25zdCBwcm9wcyA9IG5vcm1hbGl6ZVByb3BzT3JFbWl0cyhyYXcpO1xuICBmb3IgKGNvbnN0IGtleSBpbiBkZWZhdWx0cykge1xuICAgIGlmIChrZXkuc3RhcnRzV2l0aChcIl9fc2tpcFwiKSkgY29udGludWU7XG4gICAgbGV0IG9wdCA9IHByb3BzW2tleV07XG4gICAgaWYgKG9wdCkge1xuICAgICAgaWYgKGlzQXJyYXkob3B0KSB8fCBpc0Z1bmN0aW9uKG9wdCkpIHtcbiAgICAgICAgb3B0ID0gcHJvcHNba2V5XSA9IHsgdHlwZTogb3B0LCBkZWZhdWx0OiBkZWZhdWx0c1trZXldIH07XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBvcHQuZGVmYXVsdCA9IGRlZmF1bHRzW2tleV07XG4gICAgICB9XG4gICAgfSBlbHNlIGlmIChvcHQgPT09IG51bGwpIHtcbiAgICAgIG9wdCA9IHByb3BzW2tleV0gPSB7IGRlZmF1bHQ6IGRlZmF1bHRzW2tleV0gfTtcbiAgICB9IGVsc2UgaWYgKCEhKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSBcInByb2R1Y3Rpb25cIikpIHtcbiAgICAgIHdhcm4kMShgcHJvcHMgZGVmYXVsdCBrZXkgXCIke2tleX1cIiBoYXMgbm8gY29ycmVzcG9uZGluZyBkZWNsYXJhdGlvbi5gKTtcbiAgICB9XG4gICAgaWYgKG9wdCAmJiBkZWZhdWx0c1tgX19za2lwXyR7a2V5fWBdKSB7XG4gICAgICBvcHQuc2tpcEZhY3RvcnkgPSB0cnVlO1xuICAgIH1cbiAgfVxuICByZXR1cm4gcHJvcHM7XG59XG5mdW5jdGlvbiBtZXJnZU1vZGVscyhhLCBiKSB7XG4gIGlmICghYSB8fCAhYikgcmV0dXJuIGEgfHwgYjtcbiAgaWYgKGlzQXJyYXkoYSkgJiYgaXNBcnJheShiKSkgcmV0dXJuIGEuY29uY2F0KGIpO1xuICByZXR1cm4gZXh0ZW5kKHt9LCBub3JtYWxpemVQcm9wc09yRW1pdHMoYSksIG5vcm1hbGl6ZVByb3BzT3JFbWl0cyhiKSk7XG59XG5mdW5jdGlvbiBjcmVhdGVQcm9wc1Jlc3RQcm94eShwcm9wcywgZXhjbHVkZWRLZXlzKSB7XG4gIGNvbnN0IHJldCA9IHt9O1xuICBmb3IgKGNvbnN0IGtleSBpbiBwcm9wcykge1xuICAgIGlmICghZXhjbHVkZWRLZXlzLmluY2x1ZGVzKGtleSkpIHtcbiAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShyZXQsIGtleSwge1xuICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgICBnZXQ6ICgpID0+IHByb3BzW2tleV1cbiAgICAgIH0pO1xuICAgIH1cbiAgfVxuICByZXR1cm4gcmV0O1xufVxuZnVuY3Rpb24gd2l0aEFzeW5jQ29udGV4dChnZXRBd2FpdGFibGUpIHtcbiAgY29uc3QgY3R4ID0gZ2V0Q3VycmVudEluc3RhbmNlKCk7XG4gIGlmICghIShwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gXCJwcm9kdWN0aW9uXCIpICYmICFjdHgpIHtcbiAgICB3YXJuJDEoXG4gICAgICBgd2l0aEFzeW5jQ29udGV4dCBjYWxsZWQgd2l0aG91dCBhY3RpdmUgY3VycmVudCBpbnN0YW5jZS4gVGhpcyBpcyBsaWtlbHkgYSBidWcuYFxuICAgICk7XG4gIH1cbiAgbGV0IGF3YWl0YWJsZSA9IGdldEF3YWl0YWJsZSgpO1xuICB1bnNldEN1cnJlbnRJbnN0YW5jZSgpO1xuICBpZiAoaXNQcm9taXNlKGF3YWl0YWJsZSkpIHtcbiAgICBhd2FpdGFibGUgPSBhd2FpdGFibGUuY2F0Y2goKGUpID0+IHtcbiAgICAgIHNldEN1cnJlbnRJbnN0YW5jZShjdHgpO1xuICAgICAgdGhyb3cgZTtcbiAgICB9KTtcbiAgfVxuICByZXR1cm4gW2F3YWl0YWJsZSwgKCkgPT4gc2V0Q3VycmVudEluc3RhbmNlKGN0eCldO1xufVxuXG5mdW5jdGlvbiBjcmVhdGVEdXBsaWNhdGVDaGVja2VyKCkge1xuICBjb25zdCBjYWNoZSA9IC8qIEBfX1BVUkVfXyAqLyBPYmplY3QuY3JlYXRlKG51bGwpO1xuICByZXR1cm4gKHR5cGUsIGtleSkgPT4ge1xuICAgIGlmIChjYWNoZVtrZXldKSB7XG4gICAgICB3YXJuJDEoYCR7dHlwZX0gcHJvcGVydHkgXCIke2tleX1cIiBpcyBhbHJlYWR5IGRlZmluZWQgaW4gJHtjYWNoZVtrZXldfS5gKTtcbiAgICB9IGVsc2Uge1xuICAgICAgY2FjaGVba2V5XSA9IHR5cGU7XG4gICAgfVxuICB9O1xufVxubGV0IHNob3VsZENhY2hlQWNjZXNzID0gdHJ1ZTtcbmZ1bmN0aW9uIGFwcGx5T3B0aW9ucyhpbnN0YW5jZSkge1xuICBjb25zdCBvcHRpb25zID0gcmVzb2x2ZU1lcmdlZE9wdGlvbnMoaW5zdGFuY2UpO1xuICBjb25zdCBwdWJsaWNUaGlzID0gaW5zdGFuY2UucHJveHk7XG4gIGNvbnN0IGN0eCA9IGluc3RhbmNlLmN0eDtcbiAgc2hvdWxkQ2FjaGVBY2Nlc3MgPSBmYWxzZTtcbiAgaWYgKG9wdGlvbnMuYmVmb3JlQ3JlYXRlKSB7XG4gICAgY2FsbEhvb2sob3B0aW9ucy5iZWZvcmVDcmVhdGUsIGluc3RhbmNlLCBcImJjXCIpO1xuICB9XG4gIGNvbnN0IHtcbiAgICAvLyBzdGF0ZVxuICAgIGRhdGE6IGRhdGFPcHRpb25zLFxuICAgIGNvbXB1dGVkOiBjb21wdXRlZE9wdGlvbnMsXG4gICAgbWV0aG9kcyxcbiAgICB3YXRjaDogd2F0Y2hPcHRpb25zLFxuICAgIHByb3ZpZGU6IHByb3ZpZGVPcHRpb25zLFxuICAgIGluamVjdDogaW5qZWN0T3B0aW9ucyxcbiAgICAvLyBsaWZlY3ljbGVcbiAgICBjcmVhdGVkLFxuICAgIGJlZm9yZU1vdW50LFxuICAgIG1vdW50ZWQsXG4gICAgYmVmb3JlVXBkYXRlLFxuICAgIHVwZGF0ZWQsXG4gICAgYWN0aXZhdGVkLFxuICAgIGRlYWN0aXZhdGVkLFxuICAgIGJlZm9yZURlc3Ryb3ksXG4gICAgYmVmb3JlVW5tb3VudCxcbiAgICBkZXN0cm95ZWQsXG4gICAgdW5tb3VudGVkLFxuICAgIHJlbmRlcixcbiAgICByZW5kZXJUcmFja2VkLFxuICAgIHJlbmRlclRyaWdnZXJlZCxcbiAgICBlcnJvckNhcHR1cmVkLFxuICAgIHNlcnZlclByZWZldGNoLFxuICAgIC8vIHB1YmxpYyBBUElcbiAgICBleHBvc2UsXG4gICAgaW5oZXJpdEF0dHJzLFxuICAgIC8vIGFzc2V0c1xuICAgIGNvbXBvbmVudHMsXG4gICAgZGlyZWN0aXZlcyxcbiAgICBmaWx0ZXJzXG4gIH0gPSBvcHRpb25zO1xuICBjb25zdCBjaGVja0R1cGxpY2F0ZVByb3BlcnRpZXMgPSAhIShwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gXCJwcm9kdWN0aW9uXCIpID8gY3JlYXRlRHVwbGljYXRlQ2hlY2tlcigpIDogbnVsbDtcbiAgaWYgKCEhKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSBcInByb2R1Y3Rpb25cIikpIHtcbiAgICBjb25zdCBbcHJvcHNPcHRpb25zXSA9IGluc3RhbmNlLnByb3BzT3B0aW9ucztcbiAgICBpZiAocHJvcHNPcHRpb25zKSB7XG4gICAgICBmb3IgKGNvbnN0IGtleSBpbiBwcm9wc09wdGlvbnMpIHtcbiAgICAgICAgY2hlY2tEdXBsaWNhdGVQcm9wZXJ0aWVzKFwiUHJvcHNcIiAvKiBQUk9QUyAqLywga2V5KTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgaWYgKGluamVjdE9wdGlvbnMpIHtcbiAgICByZXNvbHZlSW5qZWN0aW9ucyhpbmplY3RPcHRpb25zLCBjdHgsIGNoZWNrRHVwbGljYXRlUHJvcGVydGllcyk7XG4gIH1cbiAgaWYgKG1ldGhvZHMpIHtcbiAgICBmb3IgKGNvbnN0IGtleSBpbiBtZXRob2RzKSB7XG4gICAgICBjb25zdCBtZXRob2RIYW5kbGVyID0gbWV0aG9kc1trZXldO1xuICAgICAgaWYgKGlzRnVuY3Rpb24obWV0aG9kSGFuZGxlcikpIHtcbiAgICAgICAgaWYgKCEhKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSBcInByb2R1Y3Rpb25cIikpIHtcbiAgICAgICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoY3R4LCBrZXksIHtcbiAgICAgICAgICAgIHZhbHVlOiBtZXRob2RIYW5kbGVyLmJpbmQocHVibGljVGhpcyksXG4gICAgICAgICAgICBjb25maWd1cmFibGU6IHRydWUsXG4gICAgICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgICAgICAgd3JpdGFibGU6IHRydWVcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBjdHhba2V5XSA9IG1ldGhvZEhhbmRsZXIuYmluZChwdWJsaWNUaGlzKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoISEocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09IFwicHJvZHVjdGlvblwiKSkge1xuICAgICAgICAgIGNoZWNrRHVwbGljYXRlUHJvcGVydGllcyhcIk1ldGhvZHNcIiAvKiBNRVRIT0RTICovLCBrZXkpO1xuICAgICAgICB9XG4gICAgICB9IGVsc2UgaWYgKCEhKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSBcInByb2R1Y3Rpb25cIikpIHtcbiAgICAgICAgd2FybiQxKFxuICAgICAgICAgIGBNZXRob2QgXCIke2tleX1cIiBoYXMgdHlwZSBcIiR7dHlwZW9mIG1ldGhvZEhhbmRsZXJ9XCIgaW4gdGhlIGNvbXBvbmVudCBkZWZpbml0aW9uLiBEaWQgeW91IHJlZmVyZW5jZSB0aGUgZnVuY3Rpb24gY29ycmVjdGx5P2BcbiAgICAgICAgKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgaWYgKGRhdGFPcHRpb25zKSB7XG4gICAgaWYgKCEhKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSBcInByb2R1Y3Rpb25cIikgJiYgIWlzRnVuY3Rpb24oZGF0YU9wdGlvbnMpKSB7XG4gICAgICB3YXJuJDEoXG4gICAgICAgIGBUaGUgZGF0YSBvcHRpb24gbXVzdCBiZSBhIGZ1bmN0aW9uLiBQbGFpbiBvYmplY3QgdXNhZ2UgaXMgbm8gbG9uZ2VyIHN1cHBvcnRlZC5gXG4gICAgICApO1xuICAgIH1cbiAgICBjb25zdCBkYXRhID0gZGF0YU9wdGlvbnMuY2FsbChwdWJsaWNUaGlzLCBwdWJsaWNUaGlzKTtcbiAgICBpZiAoISEocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09IFwicHJvZHVjdGlvblwiKSAmJiBpc1Byb21pc2UoZGF0YSkpIHtcbiAgICAgIHdhcm4kMShcbiAgICAgICAgYGRhdGEoKSByZXR1cm5lZCBhIFByb21pc2UgLSBub3RlIGRhdGEoKSBjYW5ub3QgYmUgYXN5bmM7IElmIHlvdSBpbnRlbmQgdG8gcGVyZm9ybSBkYXRhIGZldGNoaW5nIGJlZm9yZSBjb21wb25lbnQgcmVuZGVycywgdXNlIGFzeW5jIHNldHVwKCkgKyA8U3VzcGVuc2U+LmBcbiAgICAgICk7XG4gICAgfVxuICAgIGlmICghaXNPYmplY3QoZGF0YSkpIHtcbiAgICAgICEhKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSBcInByb2R1Y3Rpb25cIikgJiYgd2FybiQxKGBkYXRhKCkgc2hvdWxkIHJldHVybiBhbiBvYmplY3QuYCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGluc3RhbmNlLmRhdGEgPSByZWFjdGl2ZShkYXRhKTtcbiAgICAgIGlmICghIShwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gXCJwcm9kdWN0aW9uXCIpKSB7XG4gICAgICAgIGZvciAoY29uc3Qga2V5IGluIGRhdGEpIHtcbiAgICAgICAgICBjaGVja0R1cGxpY2F0ZVByb3BlcnRpZXMoXCJEYXRhXCIgLyogREFUQSAqLywga2V5KTtcbiAgICAgICAgICBpZiAoIWlzUmVzZXJ2ZWRQcmVmaXgoa2V5WzBdKSkge1xuICAgICAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KGN0eCwga2V5LCB7XG4gICAgICAgICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZSxcbiAgICAgICAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICAgICAgICAgICAgZ2V0OiAoKSA9PiBkYXRhW2tleV0sXG4gICAgICAgICAgICAgIHNldDogTk9PUFxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG4gIHNob3VsZENhY2hlQWNjZXNzID0gdHJ1ZTtcbiAgaWYgKGNvbXB1dGVkT3B0aW9ucykge1xuICAgIGZvciAoY29uc3Qga2V5IGluIGNvbXB1dGVkT3B0aW9ucykge1xuICAgICAgY29uc3Qgb3B0ID0gY29tcHV0ZWRPcHRpb25zW2tleV07XG4gICAgICBjb25zdCBnZXQgPSBpc0Z1bmN0aW9uKG9wdCkgPyBvcHQuYmluZChwdWJsaWNUaGlzLCBwdWJsaWNUaGlzKSA6IGlzRnVuY3Rpb24ob3B0LmdldCkgPyBvcHQuZ2V0LmJpbmQocHVibGljVGhpcywgcHVibGljVGhpcykgOiBOT09QO1xuICAgICAgaWYgKCEhKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSBcInByb2R1Y3Rpb25cIikgJiYgZ2V0ID09PSBOT09QKSB7XG4gICAgICAgIHdhcm4kMShgQ29tcHV0ZWQgcHJvcGVydHkgXCIke2tleX1cIiBoYXMgbm8gZ2V0dGVyLmApO1xuICAgICAgfVxuICAgICAgY29uc3Qgc2V0ID0gIWlzRnVuY3Rpb24ob3B0KSAmJiBpc0Z1bmN0aW9uKG9wdC5zZXQpID8gb3B0LnNldC5iaW5kKHB1YmxpY1RoaXMpIDogISEocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09IFwicHJvZHVjdGlvblwiKSA/ICgpID0+IHtcbiAgICAgICAgd2FybiQxKFxuICAgICAgICAgIGBXcml0ZSBvcGVyYXRpb24gZmFpbGVkOiBjb21wdXRlZCBwcm9wZXJ0eSBcIiR7a2V5fVwiIGlzIHJlYWRvbmx5LmBcbiAgICAgICAgKTtcbiAgICAgIH0gOiBOT09QO1xuICAgICAgY29uc3QgYyA9IGNvbXB1dGVkKHtcbiAgICAgICAgZ2V0LFxuICAgICAgICBzZXRcbiAgICAgIH0pO1xuICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KGN0eCwga2V5LCB7XG4gICAgICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZSxcbiAgICAgICAgZ2V0OiAoKSA9PiBjLnZhbHVlLFxuICAgICAgICBzZXQ6ICh2KSA9PiBjLnZhbHVlID0gdlxuICAgICAgfSk7XG4gICAgICBpZiAoISEocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09IFwicHJvZHVjdGlvblwiKSkge1xuICAgICAgICBjaGVja0R1cGxpY2F0ZVByb3BlcnRpZXMoXCJDb21wdXRlZFwiIC8qIENPTVBVVEVEICovLCBrZXkpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuICBpZiAod2F0Y2hPcHRpb25zKSB7XG4gICAgZm9yIChjb25zdCBrZXkgaW4gd2F0Y2hPcHRpb25zKSB7XG4gICAgICBjcmVhdGVXYXRjaGVyKHdhdGNoT3B0aW9uc1trZXldLCBjdHgsIHB1YmxpY1RoaXMsIGtleSk7XG4gICAgfVxuICB9XG4gIGlmIChwcm92aWRlT3B0aW9ucykge1xuICAgIGNvbnN0IHByb3ZpZGVzID0gaXNGdW5jdGlvbihwcm92aWRlT3B0aW9ucykgPyBwcm92aWRlT3B0aW9ucy5jYWxsKHB1YmxpY1RoaXMpIDogcHJvdmlkZU9wdGlvbnM7XG4gICAgUmVmbGVjdC5vd25LZXlzKHByb3ZpZGVzKS5mb3JFYWNoKChrZXkpID0+IHtcbiAgICAgIHByb3ZpZGUoa2V5LCBwcm92aWRlc1trZXldKTtcbiAgICB9KTtcbiAgfVxuICBpZiAoY3JlYXRlZCkge1xuICAgIGNhbGxIb29rKGNyZWF0ZWQsIGluc3RhbmNlLCBcImNcIik7XG4gIH1cbiAgZnVuY3Rpb24gcmVnaXN0ZXJMaWZlY3ljbGVIb29rKHJlZ2lzdGVyLCBob29rKSB7XG4gICAgaWYgKGlzQXJyYXkoaG9vaykpIHtcbiAgICAgIGhvb2suZm9yRWFjaCgoX2hvb2spID0+IHJlZ2lzdGVyKF9ob29rLmJpbmQocHVibGljVGhpcykpKTtcbiAgICB9IGVsc2UgaWYgKGhvb2spIHtcbiAgICAgIHJlZ2lzdGVyKGhvb2suYmluZChwdWJsaWNUaGlzKSk7XG4gICAgfVxuICB9XG4gIHJlZ2lzdGVyTGlmZWN5Y2xlSG9vayhvbkJlZm9yZU1vdW50LCBiZWZvcmVNb3VudCk7XG4gIHJlZ2lzdGVyTGlmZWN5Y2xlSG9vayhvbk1vdW50ZWQsIG1vdW50ZWQpO1xuICByZWdpc3RlckxpZmVjeWNsZUhvb2sob25CZWZvcmVVcGRhdGUsIGJlZm9yZVVwZGF0ZSk7XG4gIHJlZ2lzdGVyTGlmZWN5Y2xlSG9vayhvblVwZGF0ZWQsIHVwZGF0ZWQpO1xuICByZWdpc3RlckxpZmVjeWNsZUhvb2sob25BY3RpdmF0ZWQsIGFjdGl2YXRlZCk7XG4gIHJlZ2lzdGVyTGlmZWN5Y2xlSG9vayhvbkRlYWN0aXZhdGVkLCBkZWFjdGl2YXRlZCk7XG4gIHJlZ2lzdGVyTGlmZWN5Y2xlSG9vayhvbkVycm9yQ2FwdHVyZWQsIGVycm9yQ2FwdHVyZWQpO1xuICByZWdpc3RlckxpZmVjeWNsZUhvb2sob25SZW5kZXJUcmFja2VkLCByZW5kZXJUcmFja2VkKTtcbiAgcmVnaXN0ZXJMaWZlY3ljbGVIb29rKG9uUmVuZGVyVHJpZ2dlcmVkLCByZW5kZXJUcmlnZ2VyZWQpO1xuICByZWdpc3RlckxpZmVjeWNsZUhvb2sob25CZWZvcmVVbm1vdW50LCBiZWZvcmVVbm1vdW50KTtcbiAgcmVnaXN0ZXJMaWZlY3ljbGVIb29rKG9uVW5tb3VudGVkLCB1bm1vdW50ZWQpO1xuICByZWdpc3RlckxpZmVjeWNsZUhvb2sob25TZXJ2ZXJQcmVmZXRjaCwgc2VydmVyUHJlZmV0Y2gpO1xuICBpZiAoaXNBcnJheShleHBvc2UpKSB7XG4gICAgaWYgKGV4cG9zZS5sZW5ndGgpIHtcbiAgICAgIGNvbnN0IGV4cG9zZWQgPSBpbnN0YW5jZS5leHBvc2VkIHx8IChpbnN0YW5jZS5leHBvc2VkID0ge30pO1xuICAgICAgZXhwb3NlLmZvckVhY2goKGtleSkgPT4ge1xuICAgICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3NlZCwga2V5LCB7XG4gICAgICAgICAgZ2V0OiAoKSA9PiBwdWJsaWNUaGlzW2tleV0sXG4gICAgICAgICAgc2V0OiAodmFsKSA9PiBwdWJsaWNUaGlzW2tleV0gPSB2YWwsXG4gICAgICAgICAgZW51bWVyYWJsZTogdHJ1ZVxuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0gZWxzZSBpZiAoIWluc3RhbmNlLmV4cG9zZWQpIHtcbiAgICAgIGluc3RhbmNlLmV4cG9zZWQgPSB7fTtcbiAgICB9XG4gIH1cbiAgaWYgKHJlbmRlciAmJiBpbnN0YW5jZS5yZW5kZXIgPT09IE5PT1ApIHtcbiAgICBpbnN0YW5jZS5yZW5kZXIgPSByZW5kZXI7XG4gIH1cbiAgaWYgKGluaGVyaXRBdHRycyAhPSBudWxsKSB7XG4gICAgaW5zdGFuY2UuaW5oZXJpdEF0dHJzID0gaW5oZXJpdEF0dHJzO1xuICB9XG4gIGlmIChjb21wb25lbnRzKSBpbnN0YW5jZS5jb21wb25lbnRzID0gY29tcG9uZW50cztcbiAgaWYgKGRpcmVjdGl2ZXMpIGluc3RhbmNlLmRpcmVjdGl2ZXMgPSBkaXJlY3RpdmVzO1xuICBpZiAoc2VydmVyUHJlZmV0Y2gpIHtcbiAgICBtYXJrQXN5bmNCb3VuZGFyeShpbnN0YW5jZSk7XG4gIH1cbn1cbmZ1bmN0aW9uIHJlc29sdmVJbmplY3Rpb25zKGluamVjdE9wdGlvbnMsIGN0eCwgY2hlY2tEdXBsaWNhdGVQcm9wZXJ0aWVzID0gTk9PUCkge1xuICBpZiAoaXNBcnJheShpbmplY3RPcHRpb25zKSkge1xuICAgIGluamVjdE9wdGlvbnMgPSBub3JtYWxpemVJbmplY3QoaW5qZWN0T3B0aW9ucyk7XG4gIH1cbiAgZm9yIChjb25zdCBrZXkgaW4gaW5qZWN0T3B0aW9ucykge1xuICAgIGNvbnN0IG9wdCA9IGluamVjdE9wdGlvbnNba2V5XTtcbiAgICBsZXQgaW5qZWN0ZWQ7XG4gICAgaWYgKGlzT2JqZWN0KG9wdCkpIHtcbiAgICAgIGlmIChcImRlZmF1bHRcIiBpbiBvcHQpIHtcbiAgICAgICAgaW5qZWN0ZWQgPSBpbmplY3QoXG4gICAgICAgICAgb3B0LmZyb20gfHwga2V5LFxuICAgICAgICAgIG9wdC5kZWZhdWx0LFxuICAgICAgICAgIHRydWVcbiAgICAgICAgKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGluamVjdGVkID0gaW5qZWN0KG9wdC5mcm9tIHx8IGtleSk7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIGluamVjdGVkID0gaW5qZWN0KG9wdCk7XG4gICAgfVxuICAgIGlmIChpc1JlZihpbmplY3RlZCkpIHtcbiAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShjdHgsIGtleSwge1xuICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWUsXG4gICAgICAgIGdldDogKCkgPT4gaW5qZWN0ZWQudmFsdWUsXG4gICAgICAgIHNldDogKHYpID0+IGluamVjdGVkLnZhbHVlID0gdlxuICAgICAgfSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGN0eFtrZXldID0gaW5qZWN0ZWQ7XG4gICAgfVxuICAgIGlmICghIShwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gXCJwcm9kdWN0aW9uXCIpKSB7XG4gICAgICBjaGVja0R1cGxpY2F0ZVByb3BlcnRpZXMoXCJJbmplY3RcIiAvKiBJTkpFQ1QgKi8sIGtleSk7XG4gICAgfVxuICB9XG59XG5mdW5jdGlvbiBjYWxsSG9vayhob29rLCBpbnN0YW5jZSwgdHlwZSkge1xuICBjYWxsV2l0aEFzeW5jRXJyb3JIYW5kbGluZyhcbiAgICBpc0FycmF5KGhvb2spID8gaG9vay5tYXAoKGgpID0+IGguYmluZChpbnN0YW5jZS5wcm94eSkpIDogaG9vay5iaW5kKGluc3RhbmNlLnByb3h5KSxcbiAgICBpbnN0YW5jZSxcbiAgICB0eXBlXG4gICk7XG59XG5mdW5jdGlvbiBjcmVhdGVXYXRjaGVyKHJhdywgY3R4LCBwdWJsaWNUaGlzLCBrZXkpIHtcbiAgbGV0IGdldHRlciA9IGtleS5pbmNsdWRlcyhcIi5cIikgPyBjcmVhdGVQYXRoR2V0dGVyKHB1YmxpY1RoaXMsIGtleSkgOiAoKSA9PiBwdWJsaWNUaGlzW2tleV07XG4gIGlmIChpc1N0cmluZyhyYXcpKSB7XG4gICAgY29uc3QgaGFuZGxlciA9IGN0eFtyYXddO1xuICAgIGlmIChpc0Z1bmN0aW9uKGhhbmRsZXIpKSB7XG4gICAgICB7XG4gICAgICAgIHdhdGNoKGdldHRlciwgaGFuZGxlcik7XG4gICAgICB9XG4gICAgfSBlbHNlIGlmICghIShwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gXCJwcm9kdWN0aW9uXCIpKSB7XG4gICAgICB3YXJuJDEoYEludmFsaWQgd2F0Y2ggaGFuZGxlciBzcGVjaWZpZWQgYnkga2V5IFwiJHtyYXd9XCJgLCBoYW5kbGVyKTtcbiAgICB9XG4gIH0gZWxzZSBpZiAoaXNGdW5jdGlvbihyYXcpKSB7XG4gICAge1xuICAgICAgd2F0Y2goZ2V0dGVyLCByYXcuYmluZChwdWJsaWNUaGlzKSk7XG4gICAgfVxuICB9IGVsc2UgaWYgKGlzT2JqZWN0KHJhdykpIHtcbiAgICBpZiAoaXNBcnJheShyYXcpKSB7XG4gICAgICByYXcuZm9yRWFjaCgocikgPT4gY3JlYXRlV2F0Y2hlcihyLCBjdHgsIHB1YmxpY1RoaXMsIGtleSkpO1xuICAgIH0gZWxzZSB7XG4gICAgICBjb25zdCBoYW5kbGVyID0gaXNGdW5jdGlvbihyYXcuaGFuZGxlcikgPyByYXcuaGFuZGxlci5iaW5kKHB1YmxpY1RoaXMpIDogY3R4W3Jhdy5oYW5kbGVyXTtcbiAgICAgIGlmIChpc0Z1bmN0aW9uKGhhbmRsZXIpKSB7XG4gICAgICAgIHdhdGNoKGdldHRlciwgaGFuZGxlciwgcmF3KTtcbiAgICAgIH0gZWxzZSBpZiAoISEocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09IFwicHJvZHVjdGlvblwiKSkge1xuICAgICAgICB3YXJuJDEoYEludmFsaWQgd2F0Y2ggaGFuZGxlciBzcGVjaWZpZWQgYnkga2V5IFwiJHtyYXcuaGFuZGxlcn1cImAsIGhhbmRsZXIpO1xuICAgICAgfVxuICAgIH1cbiAgfSBlbHNlIGlmICghIShwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gXCJwcm9kdWN0aW9uXCIpKSB7XG4gICAgd2FybiQxKGBJbnZhbGlkIHdhdGNoIG9wdGlvbjogXCIke2tleX1cImAsIHJhdyk7XG4gIH1cbn1cbmZ1bmN0aW9uIHJlc29sdmVNZXJnZWRPcHRpb25zKGluc3RhbmNlKSB7XG4gIGNvbnN0IGJhc2UgPSBpbnN0YW5jZS50eXBlO1xuICBjb25zdCB7IG1peGlucywgZXh0ZW5kczogZXh0ZW5kc09wdGlvbnMgfSA9IGJhc2U7XG4gIGNvbnN0IHtcbiAgICBtaXhpbnM6IGdsb2JhbE1peGlucyxcbiAgICBvcHRpb25zQ2FjaGU6IGNhY2hlLFxuICAgIGNvbmZpZzogeyBvcHRpb25NZXJnZVN0cmF0ZWdpZXMgfVxuICB9ID0gaW5zdGFuY2UuYXBwQ29udGV4dDtcbiAgY29uc3QgY2FjaGVkID0gY2FjaGUuZ2V0KGJhc2UpO1xuICBsZXQgcmVzb2x2ZWQ7XG4gIGlmIChjYWNoZWQpIHtcbiAgICByZXNvbHZlZCA9IGNhY2hlZDtcbiAgfSBlbHNlIGlmICghZ2xvYmFsTWl4aW5zLmxlbmd0aCAmJiAhbWl4aW5zICYmICFleHRlbmRzT3B0aW9ucykge1xuICAgIHtcbiAgICAgIHJlc29sdmVkID0gYmFzZTtcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgcmVzb2x2ZWQgPSB7fTtcbiAgICBpZiAoZ2xvYmFsTWl4aW5zLmxlbmd0aCkge1xuICAgICAgZ2xvYmFsTWl4aW5zLmZvckVhY2goXG4gICAgICAgIChtKSA9PiBtZXJnZU9wdGlvbnMocmVzb2x2ZWQsIG0sIG9wdGlvbk1lcmdlU3RyYXRlZ2llcywgdHJ1ZSlcbiAgICAgICk7XG4gICAgfVxuICAgIG1lcmdlT3B0aW9ucyhyZXNvbHZlZCwgYmFzZSwgb3B0aW9uTWVyZ2VTdHJhdGVnaWVzKTtcbiAgfVxuICBpZiAoaXNPYmplY3QoYmFzZSkpIHtcbiAgICBjYWNoZS5zZXQoYmFzZSwgcmVzb2x2ZWQpO1xuICB9XG4gIHJldHVybiByZXNvbHZlZDtcbn1cbmZ1bmN0aW9uIG1lcmdlT3B0aW9ucyh0bywgZnJvbSwgc3RyYXRzLCBhc01peGluID0gZmFsc2UpIHtcbiAgY29uc3QgeyBtaXhpbnMsIGV4dGVuZHM6IGV4dGVuZHNPcHRpb25zIH0gPSBmcm9tO1xuICBpZiAoZXh0ZW5kc09wdGlvbnMpIHtcbiAgICBtZXJnZU9wdGlvbnModG8sIGV4dGVuZHNPcHRpb25zLCBzdHJhdHMsIHRydWUpO1xuICB9XG4gIGlmIChtaXhpbnMpIHtcbiAgICBtaXhpbnMuZm9yRWFjaChcbiAgICAgIChtKSA9PiBtZXJnZU9wdGlvbnModG8sIG0sIHN0cmF0cywgdHJ1ZSlcbiAgICApO1xuICB9XG4gIGZvciAoY29uc3Qga2V5IGluIGZyb20pIHtcbiAgICBpZiAoYXNNaXhpbiAmJiBrZXkgPT09IFwiZXhwb3NlXCIpIHtcbiAgICAgICEhKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSBcInByb2R1Y3Rpb25cIikgJiYgd2FybiQxKFxuICAgICAgICBgXCJleHBvc2VcIiBvcHRpb24gaXMgaWdub3JlZCB3aGVuIGRlY2xhcmVkIGluIG1peGlucyBvciBleHRlbmRzLiBJdCBzaG91bGQgb25seSBiZSBkZWNsYXJlZCBpbiB0aGUgYmFzZSBjb21wb25lbnQgaXRzZWxmLmBcbiAgICAgICk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnN0IHN0cmF0ID0gaW50ZXJuYWxPcHRpb25NZXJnZVN0cmF0c1trZXldIHx8IHN0cmF0cyAmJiBzdHJhdHNba2V5XTtcbiAgICAgIHRvW2tleV0gPSBzdHJhdCA/IHN0cmF0KHRvW2tleV0sIGZyb21ba2V5XSkgOiBmcm9tW2tleV07XG4gICAgfVxuICB9XG4gIHJldHVybiB0bztcbn1cbmNvbnN0IGludGVybmFsT3B0aW9uTWVyZ2VTdHJhdHMgPSB7XG4gIGRhdGE6IG1lcmdlRGF0YUZuLFxuICBwcm9wczogbWVyZ2VFbWl0c09yUHJvcHNPcHRpb25zLFxuICBlbWl0czogbWVyZ2VFbWl0c09yUHJvcHNPcHRpb25zLFxuICAvLyBvYmplY3RzXG4gIG1ldGhvZHM6IG1lcmdlT2JqZWN0T3B0aW9ucyxcbiAgY29tcHV0ZWQ6IG1lcmdlT2JqZWN0T3B0aW9ucyxcbiAgLy8gbGlmZWN5Y2xlXG4gIGJlZm9yZUNyZWF0ZTogbWVyZ2VBc0FycmF5LFxuICBjcmVhdGVkOiBtZXJnZUFzQXJyYXksXG4gIGJlZm9yZU1vdW50OiBtZXJnZUFzQXJyYXksXG4gIG1vdW50ZWQ6IG1lcmdlQXNBcnJheSxcbiAgYmVmb3JlVXBkYXRlOiBtZXJnZUFzQXJyYXksXG4gIHVwZGF0ZWQ6IG1lcmdlQXNBcnJheSxcbiAgYmVmb3JlRGVzdHJveTogbWVyZ2VBc0FycmF5LFxuICBiZWZvcmVVbm1vdW50OiBtZXJnZUFzQXJyYXksXG4gIGRlc3Ryb3llZDogbWVyZ2VBc0FycmF5LFxuICB1bm1vdW50ZWQ6IG1lcmdlQXNBcnJheSxcbiAgYWN0aXZhdGVkOiBtZXJnZUFzQXJyYXksXG4gIGRlYWN0aXZhdGVkOiBtZXJnZUFzQXJyYXksXG4gIGVycm9yQ2FwdHVyZWQ6IG1lcmdlQXNBcnJheSxcbiAgc2VydmVyUHJlZmV0Y2g6IG1lcmdlQXNBcnJheSxcbiAgLy8gYXNzZXRzXG4gIGNvbXBvbmVudHM6IG1lcmdlT2JqZWN0T3B0aW9ucyxcbiAgZGlyZWN0aXZlczogbWVyZ2VPYmplY3RPcHRpb25zLFxuICAvLyB3YXRjaFxuICB3YXRjaDogbWVyZ2VXYXRjaE9wdGlvbnMsXG4gIC8vIHByb3ZpZGUgLyBpbmplY3RcbiAgcHJvdmlkZTogbWVyZ2VEYXRhRm4sXG4gIGluamVjdDogbWVyZ2VJbmplY3Rcbn07XG5mdW5jdGlvbiBtZXJnZURhdGFGbih0bywgZnJvbSkge1xuICBpZiAoIWZyb20pIHtcbiAgICByZXR1cm4gdG87XG4gIH1cbiAgaWYgKCF0bykge1xuICAgIHJldHVybiBmcm9tO1xuICB9XG4gIHJldHVybiBmdW5jdGlvbiBtZXJnZWREYXRhRm4oKSB7XG4gICAgcmV0dXJuIChleHRlbmQpKFxuICAgICAgaXNGdW5jdGlvbih0bykgPyB0by5jYWxsKHRoaXMsIHRoaXMpIDogdG8sXG4gICAgICBpc0Z1bmN0aW9uKGZyb20pID8gZnJvbS5jYWxsKHRoaXMsIHRoaXMpIDogZnJvbVxuICAgICk7XG4gIH07XG59XG5mdW5jdGlvbiBtZXJnZUluamVjdCh0bywgZnJvbSkge1xuICByZXR1cm4gbWVyZ2VPYmplY3RPcHRpb25zKG5vcm1hbGl6ZUluamVjdCh0byksIG5vcm1hbGl6ZUluamVjdChmcm9tKSk7XG59XG5mdW5jdGlvbiBub3JtYWxpemVJbmplY3QocmF3KSB7XG4gIGlmIChpc0FycmF5KHJhdykpIHtcbiAgICBjb25zdCByZXMgPSB7fTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHJhdy5sZW5ndGg7IGkrKykge1xuICAgICAgcmVzW3Jhd1tpXV0gPSByYXdbaV07XG4gICAgfVxuICAgIHJldHVybiByZXM7XG4gIH1cbiAgcmV0dXJuIHJhdztcbn1cbmZ1bmN0aW9uIG1lcmdlQXNBcnJheSh0bywgZnJvbSkge1xuICByZXR1cm4gdG8gPyBbLi4ubmV3IFNldChbXS5jb25jYXQodG8sIGZyb20pKV0gOiBmcm9tO1xufVxuZnVuY3Rpb24gbWVyZ2VPYmplY3RPcHRpb25zKHRvLCBmcm9tKSB7XG4gIHJldHVybiB0byA/IGV4dGVuZCgvKiBAX19QVVJFX18gKi8gT2JqZWN0LmNyZWF0ZShudWxsKSwgdG8sIGZyb20pIDogZnJvbTtcbn1cbmZ1bmN0aW9uIG1lcmdlRW1pdHNPclByb3BzT3B0aW9ucyh0bywgZnJvbSkge1xuICBpZiAodG8pIHtcbiAgICBpZiAoaXNBcnJheSh0bykgJiYgaXNBcnJheShmcm9tKSkge1xuICAgICAgcmV0dXJuIFsuLi4vKiBAX19QVVJFX18gKi8gbmV3IFNldChbLi4udG8sIC4uLmZyb21dKV07XG4gICAgfVxuICAgIHJldHVybiBleHRlbmQoXG4gICAgICAvKiBAX19QVVJFX18gKi8gT2JqZWN0LmNyZWF0ZShudWxsKSxcbiAgICAgIG5vcm1hbGl6ZVByb3BzT3JFbWl0cyh0byksXG4gICAgICBub3JtYWxpemVQcm9wc09yRW1pdHMoZnJvbSAhPSBudWxsID8gZnJvbSA6IHt9KVxuICAgICk7XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIGZyb207XG4gIH1cbn1cbmZ1bmN0aW9uIG1lcmdlV2F0Y2hPcHRpb25zKHRvLCBmcm9tKSB7XG4gIGlmICghdG8pIHJldHVybiBmcm9tO1xuICBpZiAoIWZyb20pIHJldHVybiB0bztcbiAgY29uc3QgbWVyZ2VkID0gZXh0ZW5kKC8qIEBfX1BVUkVfXyAqLyBPYmplY3QuY3JlYXRlKG51bGwpLCB0byk7XG4gIGZvciAoY29uc3Qga2V5IGluIGZyb20pIHtcbiAgICBtZXJnZWRba2V5XSA9IG1lcmdlQXNBcnJheSh0b1trZXldLCBmcm9tW2tleV0pO1xuICB9XG4gIHJldHVybiBtZXJnZWQ7XG59XG5cbmZ1bmN0aW9uIGNyZWF0ZUFwcENvbnRleHQoKSB7XG4gIHJldHVybiB7XG4gICAgYXBwOiBudWxsLFxuICAgIGNvbmZpZzoge1xuICAgICAgaXNOYXRpdmVUYWc6IE5PLFxuICAgICAgcGVyZm9ybWFuY2U6IGZhbHNlLFxuICAgICAgZ2xvYmFsUHJvcGVydGllczoge30sXG4gICAgICBvcHRpb25NZXJnZVN0cmF0ZWdpZXM6IHt9LFxuICAgICAgZXJyb3JIYW5kbGVyOiB2b2lkIDAsXG4gICAgICB3YXJuSGFuZGxlcjogdm9pZCAwLFxuICAgICAgY29tcGlsZXJPcHRpb25zOiB7fVxuICAgIH0sXG4gICAgbWl4aW5zOiBbXSxcbiAgICBjb21wb25lbnRzOiB7fSxcbiAgICBkaXJlY3RpdmVzOiB7fSxcbiAgICBwcm92aWRlczogLyogQF9fUFVSRV9fICovIE9iamVjdC5jcmVhdGUobnVsbCksXG4gICAgb3B0aW9uc0NhY2hlOiAvKiBAX19QVVJFX18gKi8gbmV3IFdlYWtNYXAoKSxcbiAgICBwcm9wc0NhY2hlOiAvKiBAX19QVVJFX18gKi8gbmV3IFdlYWtNYXAoKSxcbiAgICBlbWl0c0NhY2hlOiAvKiBAX19QVVJFX18gKi8gbmV3IFdlYWtNYXAoKVxuICB9O1xufVxubGV0IHVpZCQxID0gMDtcbmZ1bmN0aW9uIGNyZWF0ZUFwcEFQSShyZW5kZXIsIGh5ZHJhdGUpIHtcbiAgcmV0dXJuIGZ1bmN0aW9uIGNyZWF0ZUFwcChyb290Q29tcG9uZW50LCByb290UHJvcHMgPSBudWxsKSB7XG4gICAgaWYgKCFpc0Z1bmN0aW9uKHJvb3RDb21wb25lbnQpKSB7XG4gICAgICByb290Q29tcG9uZW50ID0gZXh0ZW5kKHt9LCByb290Q29tcG9uZW50KTtcbiAgICB9XG4gICAgaWYgKHJvb3RQcm9wcyAhPSBudWxsICYmICFpc09iamVjdChyb290UHJvcHMpKSB7XG4gICAgICAhIShwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gXCJwcm9kdWN0aW9uXCIpICYmIHdhcm4kMShgcm9vdCBwcm9wcyBwYXNzZWQgdG8gYXBwLm1vdW50KCkgbXVzdCBiZSBhbiBvYmplY3QuYCk7XG4gICAgICByb290UHJvcHMgPSBudWxsO1xuICAgIH1cbiAgICBjb25zdCBjb250ZXh0ID0gY3JlYXRlQXBwQ29udGV4dCgpO1xuICAgIGNvbnN0IGluc3RhbGxlZFBsdWdpbnMgPSAvKiBAX19QVVJFX18gKi8gbmV3IFdlYWtTZXQoKTtcbiAgICBjb25zdCBwbHVnaW5DbGVhbnVwRm5zID0gW107XG4gICAgbGV0IGlzTW91bnRlZCA9IGZhbHNlO1xuICAgIGNvbnN0IGFwcCA9IGNvbnRleHQuYXBwID0ge1xuICAgICAgX3VpZDogdWlkJDErKyxcbiAgICAgIF9jb21wb25lbnQ6IHJvb3RDb21wb25lbnQsXG4gICAgICBfcHJvcHM6IHJvb3RQcm9wcyxcbiAgICAgIF9jb250YWluZXI6IG51bGwsXG4gICAgICBfY29udGV4dDogY29udGV4dCxcbiAgICAgIF9pbnN0YW5jZTogbnVsbCxcbiAgICAgIHZlcnNpb24sXG4gICAgICBnZXQgY29uZmlnKCkge1xuICAgICAgICByZXR1cm4gY29udGV4dC5jb25maWc7XG4gICAgICB9LFxuICAgICAgc2V0IGNvbmZpZyh2KSB7XG4gICAgICAgIGlmICghIShwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gXCJwcm9kdWN0aW9uXCIpKSB7XG4gICAgICAgICAgd2FybiQxKFxuICAgICAgICAgICAgYGFwcC5jb25maWcgY2Fubm90IGJlIHJlcGxhY2VkLiBNb2RpZnkgaW5kaXZpZHVhbCBvcHRpb25zIGluc3RlYWQuYFxuICAgICAgICAgICk7XG4gICAgICAgIH1cbiAgICAgIH0sXG4gICAgICB1c2UocGx1Z2luLCAuLi5vcHRpb25zKSB7XG4gICAgICAgIGlmIChpbnN0YWxsZWRQbHVnaW5zLmhhcyhwbHVnaW4pKSB7XG4gICAgICAgICAgISEocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09IFwicHJvZHVjdGlvblwiKSAmJiB3YXJuJDEoYFBsdWdpbiBoYXMgYWxyZWFkeSBiZWVuIGFwcGxpZWQgdG8gdGFyZ2V0IGFwcC5gKTtcbiAgICAgICAgfSBlbHNlIGlmIChwbHVnaW4gJiYgaXNGdW5jdGlvbihwbHVnaW4uaW5zdGFsbCkpIHtcbiAgICAgICAgICBpbnN0YWxsZWRQbHVnaW5zLmFkZChwbHVnaW4pO1xuICAgICAgICAgIHBsdWdpbi5pbnN0YWxsKGFwcCwgLi4ub3B0aW9ucyk7XG4gICAgICAgIH0gZWxzZSBpZiAoaXNGdW5jdGlvbihwbHVnaW4pKSB7XG4gICAgICAgICAgaW5zdGFsbGVkUGx1Z2lucy5hZGQocGx1Z2luKTtcbiAgICAgICAgICBwbHVnaW4oYXBwLCAuLi5vcHRpb25zKTtcbiAgICAgICAgfSBlbHNlIGlmICghIShwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gXCJwcm9kdWN0aW9uXCIpKSB7XG4gICAgICAgICAgd2FybiQxKFxuICAgICAgICAgICAgYEEgcGx1Z2luIG11c3QgZWl0aGVyIGJlIGEgZnVuY3Rpb24gb3IgYW4gb2JqZWN0IHdpdGggYW4gXCJpbnN0YWxsXCIgZnVuY3Rpb24uYFxuICAgICAgICAgICk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGFwcDtcbiAgICAgIH0sXG4gICAgICBtaXhpbihtaXhpbikge1xuICAgICAgICBpZiAoX19WVUVfT1BUSU9OU19BUElfXykge1xuICAgICAgICAgIGlmICghY29udGV4dC5taXhpbnMuaW5jbHVkZXMobWl4aW4pKSB7XG4gICAgICAgICAgICBjb250ZXh0Lm1peGlucy5wdXNoKG1peGluKTtcbiAgICAgICAgICB9IGVsc2UgaWYgKCEhKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSBcInByb2R1Y3Rpb25cIikpIHtcbiAgICAgICAgICAgIHdhcm4kMShcbiAgICAgICAgICAgICAgXCJNaXhpbiBoYXMgYWxyZWFkeSBiZWVuIGFwcGxpZWQgdG8gdGFyZ2V0IGFwcFwiICsgKG1peGluLm5hbWUgPyBgOiAke21peGluLm5hbWV9YCA6IFwiXCIpXG4gICAgICAgICAgICApO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIGlmICghIShwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gXCJwcm9kdWN0aW9uXCIpKSB7XG4gICAgICAgICAgd2FybiQxKFwiTWl4aW5zIGFyZSBvbmx5IGF2YWlsYWJsZSBpbiBidWlsZHMgc3VwcG9ydGluZyBPcHRpb25zIEFQSVwiKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gYXBwO1xuICAgICAgfSxcbiAgICAgIGNvbXBvbmVudChuYW1lLCBjb21wb25lbnQpIHtcbiAgICAgICAgaWYgKCEhKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSBcInByb2R1Y3Rpb25cIikpIHtcbiAgICAgICAgICB2YWxpZGF0ZUNvbXBvbmVudE5hbWUobmFtZSwgY29udGV4dC5jb25maWcpO1xuICAgICAgICB9XG4gICAgICAgIGlmICghY29tcG9uZW50KSB7XG4gICAgICAgICAgcmV0dXJuIGNvbnRleHQuY29tcG9uZW50c1tuYW1lXTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoISEocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09IFwicHJvZHVjdGlvblwiKSAmJiBjb250ZXh0LmNvbXBvbmVudHNbbmFtZV0pIHtcbiAgICAgICAgICB3YXJuJDEoYENvbXBvbmVudCBcIiR7bmFtZX1cIiBoYXMgYWxyZWFkeSBiZWVuIHJlZ2lzdGVyZWQgaW4gdGFyZ2V0IGFwcC5gKTtcbiAgICAgICAgfVxuICAgICAgICBjb250ZXh0LmNvbXBvbmVudHNbbmFtZV0gPSBjb21wb25lbnQ7XG4gICAgICAgIHJldHVybiBhcHA7XG4gICAgICB9LFxuICAgICAgZGlyZWN0aXZlKG5hbWUsIGRpcmVjdGl2ZSkge1xuICAgICAgICBpZiAoISEocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09IFwicHJvZHVjdGlvblwiKSkge1xuICAgICAgICAgIHZhbGlkYXRlRGlyZWN0aXZlTmFtZShuYW1lKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoIWRpcmVjdGl2ZSkge1xuICAgICAgICAgIHJldHVybiBjb250ZXh0LmRpcmVjdGl2ZXNbbmFtZV07XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCEhKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSBcInByb2R1Y3Rpb25cIikgJiYgY29udGV4dC5kaXJlY3RpdmVzW25hbWVdKSB7XG4gICAgICAgICAgd2FybiQxKGBEaXJlY3RpdmUgXCIke25hbWV9XCIgaGFzIGFscmVhZHkgYmVlbiByZWdpc3RlcmVkIGluIHRhcmdldCBhcHAuYCk7XG4gICAgICAgIH1cbiAgICAgICAgY29udGV4dC5kaXJlY3RpdmVzW25hbWVdID0gZGlyZWN0aXZlO1xuICAgICAgICByZXR1cm4gYXBwO1xuICAgICAgfSxcbiAgICAgIG1vdW50KHJvb3RDb250YWluZXIsIGlzSHlkcmF0ZSwgbmFtZXNwYWNlKSB7XG4gICAgICAgIGlmICghaXNNb3VudGVkKSB7XG4gICAgICAgICAgaWYgKCEhKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSBcInByb2R1Y3Rpb25cIikgJiYgcm9vdENvbnRhaW5lci5fX3Z1ZV9hcHBfXykge1xuICAgICAgICAgICAgd2FybiQxKFxuICAgICAgICAgICAgICBgVGhlcmUgaXMgYWxyZWFkeSBhbiBhcHAgaW5zdGFuY2UgbW91bnRlZCBvbiB0aGUgaG9zdCBjb250YWluZXIuXG4gSWYgeW91IHdhbnQgdG8gbW91bnQgYW5vdGhlciBhcHAgb24gdGhlIHNhbWUgaG9zdCBjb250YWluZXIsIHlvdSBuZWVkIHRvIHVubW91bnQgdGhlIHByZXZpb3VzIGFwcCBieSBjYWxsaW5nIFxcYGFwcC51bm1vdW50KClcXGAgZmlyc3QuYFxuICAgICAgICAgICAgKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgY29uc3Qgdm5vZGUgPSBhcHAuX2NlVk5vZGUgfHwgY3JlYXRlVk5vZGUocm9vdENvbXBvbmVudCwgcm9vdFByb3BzKTtcbiAgICAgICAgICB2bm9kZS5hcHBDb250ZXh0ID0gY29udGV4dDtcbiAgICAgICAgICBpZiAobmFtZXNwYWNlID09PSB0cnVlKSB7XG4gICAgICAgICAgICBuYW1lc3BhY2UgPSBcInN2Z1wiO1xuICAgICAgICAgIH0gZWxzZSBpZiAobmFtZXNwYWNlID09PSBmYWxzZSkge1xuICAgICAgICAgICAgbmFtZXNwYWNlID0gdm9pZCAwO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAoISEocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09IFwicHJvZHVjdGlvblwiKSkge1xuICAgICAgICAgICAgY29udGV4dC5yZWxvYWQgPSAoKSA9PiB7XG4gICAgICAgICAgICAgIGNvbnN0IGNsb25lZCA9IGNsb25lVk5vZGUodm5vZGUpO1xuICAgICAgICAgICAgICBjbG9uZWQuZWwgPSBudWxsO1xuICAgICAgICAgICAgICByZW5kZXIoY2xvbmVkLCByb290Q29udGFpbmVyLCBuYW1lc3BhY2UpO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKGlzSHlkcmF0ZSAmJiBoeWRyYXRlKSB7XG4gICAgICAgICAgICBoeWRyYXRlKHZub2RlLCByb290Q29udGFpbmVyKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmVuZGVyKHZub2RlLCByb290Q29udGFpbmVyLCBuYW1lc3BhY2UpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpc01vdW50ZWQgPSB0cnVlO1xuICAgICAgICAgIGFwcC5fY29udGFpbmVyID0gcm9vdENvbnRhaW5lcjtcbiAgICAgICAgICByb290Q29udGFpbmVyLl9fdnVlX2FwcF9fID0gYXBwO1xuICAgICAgICAgIGlmICghIShwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gXCJwcm9kdWN0aW9uXCIpIHx8IF9fVlVFX1BST0RfREVWVE9PTFNfXykge1xuICAgICAgICAgICAgYXBwLl9pbnN0YW5jZSA9IHZub2RlLmNvbXBvbmVudDtcbiAgICAgICAgICAgIGRldnRvb2xzSW5pdEFwcChhcHAsIHZlcnNpb24pO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gZ2V0Q29tcG9uZW50UHVibGljSW5zdGFuY2Uodm5vZGUuY29tcG9uZW50KTtcbiAgICAgICAgfSBlbHNlIGlmICghIShwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gXCJwcm9kdWN0aW9uXCIpKSB7XG4gICAgICAgICAgd2FybiQxKFxuICAgICAgICAgICAgYEFwcCBoYXMgYWxyZWFkeSBiZWVuIG1vdW50ZWQuXG5JZiB5b3Ugd2FudCB0byByZW1vdW50IHRoZSBzYW1lIGFwcCwgbW92ZSB5b3VyIGFwcCBjcmVhdGlvbiBsb2dpYyBpbnRvIGEgZmFjdG9yeSBmdW5jdGlvbiBhbmQgY3JlYXRlIGZyZXNoIGFwcCBpbnN0YW5jZXMgZm9yIGVhY2ggbW91bnQgLSBlLmcuIFxcYGNvbnN0IGNyZWF0ZU15QXBwID0gKCkgPT4gY3JlYXRlQXBwKEFwcClcXGBgXG4gICAgICAgICAgKTtcbiAgICAgICAgfVxuICAgICAgfSxcbiAgICAgIG9uVW5tb3VudChjbGVhbnVwRm4pIHtcbiAgICAgICAgaWYgKCEhKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSBcInByb2R1Y3Rpb25cIikgJiYgdHlwZW9mIGNsZWFudXBGbiAhPT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgICAgd2FybiQxKFxuICAgICAgICAgICAgYEV4cGVjdGVkIGZ1bmN0aW9uIGFzIGZpcnN0IGFyZ3VtZW50IHRvIGFwcC5vblVubW91bnQoKSwgYnV0IGdvdCAke3R5cGVvZiBjbGVhbnVwRm59YFxuICAgICAgICAgICk7XG4gICAgICAgIH1cbiAgICAgICAgcGx1Z2luQ2xlYW51cEZucy5wdXNoKGNsZWFudXBGbik7XG4gICAgICB9LFxuICAgICAgdW5tb3VudCgpIHtcbiAgICAgICAgaWYgKGlzTW91bnRlZCkge1xuICAgICAgICAgIGNhbGxXaXRoQXN5bmNFcnJvckhhbmRsaW5nKFxuICAgICAgICAgICAgcGx1Z2luQ2xlYW51cEZucyxcbiAgICAgICAgICAgIGFwcC5faW5zdGFuY2UsXG4gICAgICAgICAgICAxNlxuICAgICAgICAgICk7XG4gICAgICAgICAgcmVuZGVyKG51bGwsIGFwcC5fY29udGFpbmVyKTtcbiAgICAgICAgICBpZiAoISEocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09IFwicHJvZHVjdGlvblwiKSB8fCBfX1ZVRV9QUk9EX0RFVlRPT0xTX18pIHtcbiAgICAgICAgICAgIGFwcC5faW5zdGFuY2UgPSBudWxsO1xuICAgICAgICAgICAgZGV2dG9vbHNVbm1vdW50QXBwKGFwcCk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGRlbGV0ZSBhcHAuX2NvbnRhaW5lci5fX3Z1ZV9hcHBfXztcbiAgICAgICAgfSBlbHNlIGlmICghIShwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gXCJwcm9kdWN0aW9uXCIpKSB7XG4gICAgICAgICAgd2FybiQxKGBDYW5ub3QgdW5tb3VudCBhbiBhcHAgdGhhdCBpcyBub3QgbW91bnRlZC5gKTtcbiAgICAgICAgfVxuICAgICAgfSxcbiAgICAgIHByb3ZpZGUoa2V5LCB2YWx1ZSkge1xuICAgICAgICBpZiAoISEocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09IFwicHJvZHVjdGlvblwiKSAmJiBrZXkgaW4gY29udGV4dC5wcm92aWRlcykge1xuICAgICAgICAgIGlmIChoYXNPd24oY29udGV4dC5wcm92aWRlcywga2V5KSkge1xuICAgICAgICAgICAgd2FybiQxKFxuICAgICAgICAgICAgICBgQXBwIGFscmVhZHkgcHJvdmlkZXMgcHJvcGVydHkgd2l0aCBrZXkgXCIke1N0cmluZyhrZXkpfVwiLiBJdCB3aWxsIGJlIG92ZXJ3cml0dGVuIHdpdGggdGhlIG5ldyB2YWx1ZS5gXG4gICAgICAgICAgICApO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB3YXJuJDEoXG4gICAgICAgICAgICAgIGBBcHAgYWxyZWFkeSBwcm92aWRlcyBwcm9wZXJ0eSB3aXRoIGtleSBcIiR7U3RyaW5nKGtleSl9XCIgaW5oZXJpdGVkIGZyb20gaXRzIHBhcmVudCBlbGVtZW50LiBJdCB3aWxsIGJlIG92ZXJ3cml0dGVuIHdpdGggdGhlIG5ldyB2YWx1ZS5gXG4gICAgICAgICAgICApO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBjb250ZXh0LnByb3ZpZGVzW2tleV0gPSB2YWx1ZTtcbiAgICAgICAgcmV0dXJuIGFwcDtcbiAgICAgIH0sXG4gICAgICBydW5XaXRoQ29udGV4dChmbikge1xuICAgICAgICBjb25zdCBsYXN0QXBwID0gY3VycmVudEFwcDtcbiAgICAgICAgY3VycmVudEFwcCA9IGFwcDtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICByZXR1cm4gZm4oKTtcbiAgICAgICAgfSBmaW5hbGx5IHtcbiAgICAgICAgICBjdXJyZW50QXBwID0gbGFzdEFwcDtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH07XG4gICAgcmV0dXJuIGFwcDtcbiAgfTtcbn1cbmxldCBjdXJyZW50QXBwID0gbnVsbDtcblxuZnVuY3Rpb24gdXNlTW9kZWwocHJvcHMsIG5hbWUsIG9wdGlvbnMgPSBFTVBUWV9PQkopIHtcbiAgY29uc3QgaSA9IGdldEN1cnJlbnRJbnN0YW5jZSgpO1xuICBpZiAoISEocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09IFwicHJvZHVjdGlvblwiKSAmJiAhaSkge1xuICAgIHdhcm4kMShgdXNlTW9kZWwoKSBjYWxsZWQgd2l0aG91dCBhY3RpdmUgaW5zdGFuY2UuYCk7XG4gICAgcmV0dXJuIHJlZigpO1xuICB9XG4gIGNvbnN0IGNhbWVsaXplZE5hbWUgPSBjYW1lbGl6ZShuYW1lKTtcbiAgaWYgKCEhKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSBcInByb2R1Y3Rpb25cIikgJiYgIWkucHJvcHNPcHRpb25zWzBdW2NhbWVsaXplZE5hbWVdKSB7XG4gICAgd2FybiQxKGB1c2VNb2RlbCgpIGNhbGxlZCB3aXRoIHByb3AgXCIke25hbWV9XCIgd2hpY2ggaXMgbm90IGRlY2xhcmVkLmApO1xuICAgIHJldHVybiByZWYoKTtcbiAgfVxuICBjb25zdCBoeXBoZW5hdGVkTmFtZSA9IGh5cGhlbmF0ZShuYW1lKTtcbiAgY29uc3QgbW9kaWZpZXJzID0gZ2V0TW9kZWxNb2RpZmllcnMocHJvcHMsIGNhbWVsaXplZE5hbWUpO1xuICBjb25zdCByZXMgPSBjdXN0b21SZWYoKHRyYWNrLCB0cmlnZ2VyKSA9PiB7XG4gICAgbGV0IGxvY2FsVmFsdWU7XG4gICAgbGV0IHByZXZTZXRWYWx1ZSA9IEVNUFRZX09CSjtcbiAgICBsZXQgcHJldkVtaXR0ZWRWYWx1ZTtcbiAgICB3YXRjaFN5bmNFZmZlY3QoKCkgPT4ge1xuICAgICAgY29uc3QgcHJvcFZhbHVlID0gcHJvcHNbY2FtZWxpemVkTmFtZV07XG4gICAgICBpZiAoaGFzQ2hhbmdlZChsb2NhbFZhbHVlLCBwcm9wVmFsdWUpKSB7XG4gICAgICAgIGxvY2FsVmFsdWUgPSBwcm9wVmFsdWU7XG4gICAgICAgIHRyaWdnZXIoKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICByZXR1cm4ge1xuICAgICAgZ2V0KCkge1xuICAgICAgICB0cmFjaygpO1xuICAgICAgICByZXR1cm4gb3B0aW9ucy5nZXQgPyBvcHRpb25zLmdldChsb2NhbFZhbHVlKSA6IGxvY2FsVmFsdWU7XG4gICAgICB9LFxuICAgICAgc2V0KHZhbHVlKSB7XG4gICAgICAgIGNvbnN0IGVtaXR0ZWRWYWx1ZSA9IG9wdGlvbnMuc2V0ID8gb3B0aW9ucy5zZXQodmFsdWUpIDogdmFsdWU7XG4gICAgICAgIGlmICghaGFzQ2hhbmdlZChlbWl0dGVkVmFsdWUsIGxvY2FsVmFsdWUpICYmICEocHJldlNldFZhbHVlICE9PSBFTVBUWV9PQkogJiYgaGFzQ2hhbmdlZCh2YWx1ZSwgcHJldlNldFZhbHVlKSkpIHtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgcmF3UHJvcHMgPSBpLnZub2RlLnByb3BzO1xuICAgICAgICBpZiAoIShyYXdQcm9wcyAmJiAvLyBjaGVjayBpZiBwYXJlbnQgaGFzIHBhc3NlZCB2LW1vZGVsXG4gICAgICAgIChuYW1lIGluIHJhd1Byb3BzIHx8IGNhbWVsaXplZE5hbWUgaW4gcmF3UHJvcHMgfHwgaHlwaGVuYXRlZE5hbWUgaW4gcmF3UHJvcHMpICYmIChgb25VcGRhdGU6JHtuYW1lfWAgaW4gcmF3UHJvcHMgfHwgYG9uVXBkYXRlOiR7Y2FtZWxpemVkTmFtZX1gIGluIHJhd1Byb3BzIHx8IGBvblVwZGF0ZToke2h5cGhlbmF0ZWROYW1lfWAgaW4gcmF3UHJvcHMpKSkge1xuICAgICAgICAgIGxvY2FsVmFsdWUgPSB2YWx1ZTtcbiAgICAgICAgICB0cmlnZ2VyKCk7XG4gICAgICAgIH1cbiAgICAgICAgaS5lbWl0KGB1cGRhdGU6JHtuYW1lfWAsIGVtaXR0ZWRWYWx1ZSk7XG4gICAgICAgIGlmIChoYXNDaGFuZ2VkKHZhbHVlLCBlbWl0dGVkVmFsdWUpICYmIGhhc0NoYW5nZWQodmFsdWUsIHByZXZTZXRWYWx1ZSkgJiYgIWhhc0NoYW5nZWQoZW1pdHRlZFZhbHVlLCBwcmV2RW1pdHRlZFZhbHVlKSkge1xuICAgICAgICAgIHRyaWdnZXIoKTtcbiAgICAgICAgfVxuICAgICAgICBwcmV2U2V0VmFsdWUgPSB2YWx1ZTtcbiAgICAgICAgcHJldkVtaXR0ZWRWYWx1ZSA9IGVtaXR0ZWRWYWx1ZTtcbiAgICAgIH1cbiAgICB9O1xuICB9KTtcbiAgcmVzW1N5bWJvbC5pdGVyYXRvcl0gPSAoKSA9PiB7XG4gICAgbGV0IGkyID0gMDtcbiAgICByZXR1cm4ge1xuICAgICAgbmV4dCgpIHtcbiAgICAgICAgaWYgKGkyIDwgMikge1xuICAgICAgICAgIHJldHVybiB7IHZhbHVlOiBpMisrID8gbW9kaWZpZXJzIHx8IEVNUFRZX09CSiA6IHJlcywgZG9uZTogZmFsc2UgfTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXR1cm4geyBkb25lOiB0cnVlIH07XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9O1xuICB9O1xuICByZXR1cm4gcmVzO1xufVxuY29uc3QgZ2V0TW9kZWxNb2RpZmllcnMgPSAocHJvcHMsIG1vZGVsTmFtZSkgPT4ge1xuICByZXR1cm4gbW9kZWxOYW1lID09PSBcIm1vZGVsVmFsdWVcIiB8fCBtb2RlbE5hbWUgPT09IFwibW9kZWwtdmFsdWVcIiA/IHByb3BzLm1vZGVsTW9kaWZpZXJzIDogcHJvcHNbYCR7bW9kZWxOYW1lfU1vZGlmaWVyc2BdIHx8IHByb3BzW2Ake2NhbWVsaXplKG1vZGVsTmFtZSl9TW9kaWZpZXJzYF0gfHwgcHJvcHNbYCR7aHlwaGVuYXRlKG1vZGVsTmFtZSl9TW9kaWZpZXJzYF07XG59O1xuXG5mdW5jdGlvbiBlbWl0KGluc3RhbmNlLCBldmVudCwgLi4ucmF3QXJncykge1xuICBpZiAoaW5zdGFuY2UuaXNVbm1vdW50ZWQpIHJldHVybjtcbiAgY29uc3QgcHJvcHMgPSBpbnN0YW5jZS52bm9kZS5wcm9wcyB8fCBFTVBUWV9PQko7XG4gIGlmICghIShwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gXCJwcm9kdWN0aW9uXCIpKSB7XG4gICAgY29uc3Qge1xuICAgICAgZW1pdHNPcHRpb25zLFxuICAgICAgcHJvcHNPcHRpb25zOiBbcHJvcHNPcHRpb25zXVxuICAgIH0gPSBpbnN0YW5jZTtcbiAgICBpZiAoZW1pdHNPcHRpb25zKSB7XG4gICAgICBpZiAoIShldmVudCBpbiBlbWl0c09wdGlvbnMpICYmIHRydWUpIHtcbiAgICAgICAgaWYgKCFwcm9wc09wdGlvbnMgfHwgISh0b0hhbmRsZXJLZXkoY2FtZWxpemUoZXZlbnQpKSBpbiBwcm9wc09wdGlvbnMpKSB7XG4gICAgICAgICAgd2FybiQxKFxuICAgICAgICAgICAgYENvbXBvbmVudCBlbWl0dGVkIGV2ZW50IFwiJHtldmVudH1cIiBidXQgaXQgaXMgbmVpdGhlciBkZWNsYXJlZCBpbiB0aGUgZW1pdHMgb3B0aW9uIG5vciBhcyBhbiBcIiR7dG9IYW5kbGVyS2V5KGNhbWVsaXplKGV2ZW50KSl9XCIgcHJvcC5gXG4gICAgICAgICAgKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29uc3QgdmFsaWRhdG9yID0gZW1pdHNPcHRpb25zW2V2ZW50XTtcbiAgICAgICAgaWYgKGlzRnVuY3Rpb24odmFsaWRhdG9yKSkge1xuICAgICAgICAgIGNvbnN0IGlzVmFsaWQgPSB2YWxpZGF0b3IoLi4ucmF3QXJncyk7XG4gICAgICAgICAgaWYgKCFpc1ZhbGlkKSB7XG4gICAgICAgICAgICB3YXJuJDEoXG4gICAgICAgICAgICAgIGBJbnZhbGlkIGV2ZW50IGFyZ3VtZW50czogZXZlbnQgdmFsaWRhdGlvbiBmYWlsZWQgZm9yIGV2ZW50IFwiJHtldmVudH1cIi5gXG4gICAgICAgICAgICApO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuICBsZXQgYXJncyA9IHJhd0FyZ3M7XG4gIGNvbnN0IGlzTW9kZWxMaXN0ZW5lciA9IGV2ZW50LnN0YXJ0c1dpdGgoXCJ1cGRhdGU6XCIpO1xuICBjb25zdCBtb2RpZmllcnMgPSBpc01vZGVsTGlzdGVuZXIgJiYgZ2V0TW9kZWxNb2RpZmllcnMocHJvcHMsIGV2ZW50LnNsaWNlKDcpKTtcbiAgaWYgKG1vZGlmaWVycykge1xuICAgIGlmIChtb2RpZmllcnMudHJpbSkge1xuICAgICAgYXJncyA9IHJhd0FyZ3MubWFwKChhKSA9PiBpc1N0cmluZyhhKSA/IGEudHJpbSgpIDogYSk7XG4gICAgfVxuICAgIGlmIChtb2RpZmllcnMubnVtYmVyKSB7XG4gICAgICBhcmdzID0gcmF3QXJncy5tYXAobG9vc2VUb051bWJlcik7XG4gICAgfVxuICB9XG4gIGlmICghIShwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gXCJwcm9kdWN0aW9uXCIpIHx8IF9fVlVFX1BST0RfREVWVE9PTFNfXykge1xuICAgIGRldnRvb2xzQ29tcG9uZW50RW1pdChpbnN0YW5jZSwgZXZlbnQsIGFyZ3MpO1xuICB9XG4gIGlmICghIShwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gXCJwcm9kdWN0aW9uXCIpKSB7XG4gICAgY29uc3QgbG93ZXJDYXNlRXZlbnQgPSBldmVudC50b0xvd2VyQ2FzZSgpO1xuICAgIGlmIChsb3dlckNhc2VFdmVudCAhPT0gZXZlbnQgJiYgcHJvcHNbdG9IYW5kbGVyS2V5KGxvd2VyQ2FzZUV2ZW50KV0pIHtcbiAgICAgIHdhcm4kMShcbiAgICAgICAgYEV2ZW50IFwiJHtsb3dlckNhc2VFdmVudH1cIiBpcyBlbWl0dGVkIGluIGNvbXBvbmVudCAke2Zvcm1hdENvbXBvbmVudE5hbWUoXG4gICAgICAgICAgaW5zdGFuY2UsXG4gICAgICAgICAgaW5zdGFuY2UudHlwZVxuICAgICAgICApfSBidXQgdGhlIGhhbmRsZXIgaXMgcmVnaXN0ZXJlZCBmb3IgXCIke2V2ZW50fVwiLiBOb3RlIHRoYXQgSFRNTCBhdHRyaWJ1dGVzIGFyZSBjYXNlLWluc2Vuc2l0aXZlIGFuZCB5b3UgY2Fubm90IHVzZSB2LW9uIHRvIGxpc3RlbiB0byBjYW1lbENhc2UgZXZlbnRzIHdoZW4gdXNpbmcgaW4tRE9NIHRlbXBsYXRlcy4gWW91IHNob3VsZCBwcm9iYWJseSB1c2UgXCIke2h5cGhlbmF0ZShcbiAgICAgICAgICBldmVudFxuICAgICAgICApfVwiIGluc3RlYWQgb2YgXCIke2V2ZW50fVwiLmBcbiAgICAgICk7XG4gICAgfVxuICB9XG4gIGxldCBoYW5kbGVyTmFtZTtcbiAgbGV0IGhhbmRsZXIgPSBwcm9wc1toYW5kbGVyTmFtZSA9IHRvSGFuZGxlcktleShldmVudCldIHx8IC8vIGFsc28gdHJ5IGNhbWVsQ2FzZSBldmVudCBoYW5kbGVyICgjMjI0OSlcbiAgcHJvcHNbaGFuZGxlck5hbWUgPSB0b0hhbmRsZXJLZXkoY2FtZWxpemUoZXZlbnQpKV07XG4gIGlmICghaGFuZGxlciAmJiBpc01vZGVsTGlzdGVuZXIpIHtcbiAgICBoYW5kbGVyID0gcHJvcHNbaGFuZGxlck5hbWUgPSB0b0hhbmRsZXJLZXkoaHlwaGVuYXRlKGV2ZW50KSldO1xuICB9XG4gIGlmIChoYW5kbGVyKSB7XG4gICAgY2FsbFdpdGhBc3luY0Vycm9ySGFuZGxpbmcoXG4gICAgICBoYW5kbGVyLFxuICAgICAgaW5zdGFuY2UsXG4gICAgICA2LFxuICAgICAgYXJnc1xuICAgICk7XG4gIH1cbiAgY29uc3Qgb25jZUhhbmRsZXIgPSBwcm9wc1toYW5kbGVyTmFtZSArIGBPbmNlYF07XG4gIGlmIChvbmNlSGFuZGxlcikge1xuICAgIGlmICghaW5zdGFuY2UuZW1pdHRlZCkge1xuICAgICAgaW5zdGFuY2UuZW1pdHRlZCA9IHt9O1xuICAgIH0gZWxzZSBpZiAoaW5zdGFuY2UuZW1pdHRlZFtoYW5kbGVyTmFtZV0pIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgaW5zdGFuY2UuZW1pdHRlZFtoYW5kbGVyTmFtZV0gPSB0cnVlO1xuICAgIGNhbGxXaXRoQXN5bmNFcnJvckhhbmRsaW5nKFxuICAgICAgb25jZUhhbmRsZXIsXG4gICAgICBpbnN0YW5jZSxcbiAgICAgIDYsXG4gICAgICBhcmdzXG4gICAgKTtcbiAgfVxufVxuY29uc3QgbWl4aW5FbWl0c0NhY2hlID0gLyogQF9fUFVSRV9fICovIG5ldyBXZWFrTWFwKCk7XG5mdW5jdGlvbiBub3JtYWxpemVFbWl0c09wdGlvbnMoY29tcCwgYXBwQ29udGV4dCwgYXNNaXhpbiA9IGZhbHNlKSB7XG4gIGNvbnN0IGNhY2hlID0gX19WVUVfT1BUSU9OU19BUElfXyAmJiBhc01peGluID8gbWl4aW5FbWl0c0NhY2hlIDogYXBwQ29udGV4dC5lbWl0c0NhY2hlO1xuICBjb25zdCBjYWNoZWQgPSBjYWNoZS5nZXQoY29tcCk7XG4gIGlmIChjYWNoZWQgIT09IHZvaWQgMCkge1xuICAgIHJldHVybiBjYWNoZWQ7XG4gIH1cbiAgY29uc3QgcmF3ID0gY29tcC5lbWl0cztcbiAgbGV0IG5vcm1hbGl6ZWQgPSB7fTtcbiAgbGV0IGhhc0V4dGVuZHMgPSBmYWxzZTtcbiAgaWYgKF9fVlVFX09QVElPTlNfQVBJX18gJiYgIWlzRnVuY3Rpb24oY29tcCkpIHtcbiAgICBjb25zdCBleHRlbmRFbWl0cyA9IChyYXcyKSA9PiB7XG4gICAgICBjb25zdCBub3JtYWxpemVkRnJvbUV4dGVuZCA9IG5vcm1hbGl6ZUVtaXRzT3B0aW9ucyhyYXcyLCBhcHBDb250ZXh0LCB0cnVlKTtcbiAgICAgIGlmIChub3JtYWxpemVkRnJvbUV4dGVuZCkge1xuICAgICAgICBoYXNFeHRlbmRzID0gdHJ1ZTtcbiAgICAgICAgZXh0ZW5kKG5vcm1hbGl6ZWQsIG5vcm1hbGl6ZWRGcm9tRXh0ZW5kKTtcbiAgICAgIH1cbiAgICB9O1xuICAgIGlmICghYXNNaXhpbiAmJiBhcHBDb250ZXh0Lm1peGlucy5sZW5ndGgpIHtcbiAgICAgIGFwcENvbnRleHQubWl4aW5zLmZvckVhY2goZXh0ZW5kRW1pdHMpO1xuICAgIH1cbiAgICBpZiAoY29tcC5leHRlbmRzKSB7XG4gICAgICBleHRlbmRFbWl0cyhjb21wLmV4dGVuZHMpO1xuICAgIH1cbiAgICBpZiAoY29tcC5taXhpbnMpIHtcbiAgICAgIGNvbXAubWl4aW5zLmZvckVhY2goZXh0ZW5kRW1pdHMpO1xuICAgIH1cbiAgfVxuICBpZiAoIXJhdyAmJiAhaGFzRXh0ZW5kcykge1xuICAgIGlmIChpc09iamVjdChjb21wKSkge1xuICAgICAgY2FjaGUuc2V0KGNvbXAsIG51bGwpO1xuICAgIH1cbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuICBpZiAoaXNBcnJheShyYXcpKSB7XG4gICAgcmF3LmZvckVhY2goKGtleSkgPT4gbm9ybWFsaXplZFtrZXldID0gbnVsbCk7XG4gIH0gZWxzZSB7XG4gICAgZXh0ZW5kKG5vcm1hbGl6ZWQsIHJhdyk7XG4gIH1cbiAgaWYgKGlzT2JqZWN0KGNvbXApKSB7XG4gICAgY2FjaGUuc2V0KGNvbXAsIG5vcm1hbGl6ZWQpO1xuICB9XG4gIHJldHVybiBub3JtYWxpemVkO1xufVxuZnVuY3Rpb24gaXNFbWl0TGlzdGVuZXIob3B0aW9ucywga2V5KSB7XG4gIGlmICghb3B0aW9ucyB8fCAhaXNPbihrZXkpKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG4gIGtleSA9IGtleS5zbGljZSgyKS5yZXBsYWNlKC9PbmNlJC8sIFwiXCIpO1xuICByZXR1cm4gaGFzT3duKG9wdGlvbnMsIGtleVswXS50b0xvd2VyQ2FzZSgpICsga2V5LnNsaWNlKDEpKSB8fCBoYXNPd24ob3B0aW9ucywgaHlwaGVuYXRlKGtleSkpIHx8IGhhc093bihvcHRpb25zLCBrZXkpO1xufVxuXG5sZXQgYWNjZXNzZWRBdHRycyA9IGZhbHNlO1xuZnVuY3Rpb24gbWFya0F0dHJzQWNjZXNzZWQoKSB7XG4gIGFjY2Vzc2VkQXR0cnMgPSB0cnVlO1xufVxuZnVuY3Rpb24gcmVuZGVyQ29tcG9uZW50Um9vdChpbnN0YW5jZSkge1xuICBjb25zdCB7XG4gICAgdHlwZTogQ29tcG9uZW50LFxuICAgIHZub2RlLFxuICAgIHByb3h5LFxuICAgIHdpdGhQcm94eSxcbiAgICBwcm9wc09wdGlvbnM6IFtwcm9wc09wdGlvbnNdLFxuICAgIHNsb3RzLFxuICAgIGF0dHJzLFxuICAgIGVtaXQsXG4gICAgcmVuZGVyLFxuICAgIHJlbmRlckNhY2hlLFxuICAgIHByb3BzLFxuICAgIGRhdGEsXG4gICAgc2V0dXBTdGF0ZSxcbiAgICBjdHgsXG4gICAgaW5oZXJpdEF0dHJzXG4gIH0gPSBpbnN0YW5jZTtcbiAgY29uc3QgcHJldiA9IHNldEN1cnJlbnRSZW5kZXJpbmdJbnN0YW5jZShpbnN0YW5jZSk7XG4gIGxldCByZXN1bHQ7XG4gIGxldCBmYWxsdGhyb3VnaEF0dHJzO1xuICBpZiAoISEocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09IFwicHJvZHVjdGlvblwiKSkge1xuICAgIGFjY2Vzc2VkQXR0cnMgPSBmYWxzZTtcbiAgfVxuICB0cnkge1xuICAgIGlmICh2bm9kZS5zaGFwZUZsYWcgJiA0KSB7XG4gICAgICBjb25zdCBwcm94eVRvVXNlID0gd2l0aFByb3h5IHx8IHByb3h5O1xuICAgICAgY29uc3QgdGhpc1Byb3h5ID0gISEocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09IFwicHJvZHVjdGlvblwiKSAmJiBzZXR1cFN0YXRlLl9faXNTY3JpcHRTZXR1cCA/IG5ldyBQcm94eShwcm94eVRvVXNlLCB7XG4gICAgICAgIGdldCh0YXJnZXQsIGtleSwgcmVjZWl2ZXIpIHtcbiAgICAgICAgICB3YXJuJDEoXG4gICAgICAgICAgICBgUHJvcGVydHkgJyR7U3RyaW5nKFxuICAgICAgICAgICAgICBrZXlcbiAgICAgICAgICAgICl9JyB3YXMgYWNjZXNzZWQgdmlhICd0aGlzJy4gQXZvaWQgdXNpbmcgJ3RoaXMnIGluIHRlbXBsYXRlcy5gXG4gICAgICAgICAgKTtcbiAgICAgICAgICByZXR1cm4gUmVmbGVjdC5nZXQodGFyZ2V0LCBrZXksIHJlY2VpdmVyKTtcbiAgICAgICAgfVxuICAgICAgfSkgOiBwcm94eVRvVXNlO1xuICAgICAgcmVzdWx0ID0gbm9ybWFsaXplVk5vZGUoXG4gICAgICAgIHJlbmRlci5jYWxsKFxuICAgICAgICAgIHRoaXNQcm94eSxcbiAgICAgICAgICBwcm94eVRvVXNlLFxuICAgICAgICAgIHJlbmRlckNhY2hlLFxuICAgICAgICAgICEhKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSBcInByb2R1Y3Rpb25cIikgPyBzaGFsbG93UmVhZG9ubHkocHJvcHMpIDogcHJvcHMsXG4gICAgICAgICAgc2V0dXBTdGF0ZSxcbiAgICAgICAgICBkYXRhLFxuICAgICAgICAgIGN0eFxuICAgICAgICApXG4gICAgICApO1xuICAgICAgZmFsbHRocm91Z2hBdHRycyA9IGF0dHJzO1xuICAgIH0gZWxzZSB7XG4gICAgICBjb25zdCByZW5kZXIyID0gQ29tcG9uZW50O1xuICAgICAgaWYgKCEhKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSBcInByb2R1Y3Rpb25cIikgJiYgYXR0cnMgPT09IHByb3BzKSB7XG4gICAgICAgIG1hcmtBdHRyc0FjY2Vzc2VkKCk7XG4gICAgICB9XG4gICAgICByZXN1bHQgPSBub3JtYWxpemVWTm9kZShcbiAgICAgICAgcmVuZGVyMi5sZW5ndGggPiAxID8gcmVuZGVyMihcbiAgICAgICAgICAhIShwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gXCJwcm9kdWN0aW9uXCIpID8gc2hhbGxvd1JlYWRvbmx5KHByb3BzKSA6IHByb3BzLFxuICAgICAgICAgICEhKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSBcInByb2R1Y3Rpb25cIikgPyB7XG4gICAgICAgICAgICBnZXQgYXR0cnMoKSB7XG4gICAgICAgICAgICAgIG1hcmtBdHRyc0FjY2Vzc2VkKCk7XG4gICAgICAgICAgICAgIHJldHVybiBzaGFsbG93UmVhZG9ubHkoYXR0cnMpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHNsb3RzLFxuICAgICAgICAgICAgZW1pdFxuICAgICAgICAgIH0gOiB7IGF0dHJzLCBzbG90cywgZW1pdCB9XG4gICAgICAgICkgOiByZW5kZXIyKFxuICAgICAgICAgICEhKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSBcInByb2R1Y3Rpb25cIikgPyBzaGFsbG93UmVhZG9ubHkocHJvcHMpIDogcHJvcHMsXG4gICAgICAgICAgbnVsbFxuICAgICAgICApXG4gICAgICApO1xuICAgICAgZmFsbHRocm91Z2hBdHRycyA9IENvbXBvbmVudC5wcm9wcyA/IGF0dHJzIDogZ2V0RnVuY3Rpb25hbEZhbGx0aHJvdWdoKGF0dHJzKTtcbiAgICB9XG4gIH0gY2F0Y2ggKGVycikge1xuICAgIGJsb2NrU3RhY2subGVuZ3RoID0gMDtcbiAgICBoYW5kbGVFcnJvcihlcnIsIGluc3RhbmNlLCAxKTtcbiAgICByZXN1bHQgPSBjcmVhdGVWTm9kZShDb21tZW50KTtcbiAgfVxuICBsZXQgcm9vdCA9IHJlc3VsdDtcbiAgbGV0IHNldFJvb3QgPSB2b2lkIDA7XG4gIGlmICghIShwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gXCJwcm9kdWN0aW9uXCIpICYmIHJlc3VsdC5wYXRjaEZsYWcgPiAwICYmIHJlc3VsdC5wYXRjaEZsYWcgJiAyMDQ4KSB7XG4gICAgW3Jvb3QsIHNldFJvb3RdID0gZ2V0Q2hpbGRSb290KHJlc3VsdCk7XG4gIH1cbiAgaWYgKGZhbGx0aHJvdWdoQXR0cnMgJiYgaW5oZXJpdEF0dHJzICE9PSBmYWxzZSkge1xuICAgIGNvbnN0IGtleXMgPSBPYmplY3Qua2V5cyhmYWxsdGhyb3VnaEF0dHJzKTtcbiAgICBjb25zdCB7IHNoYXBlRmxhZyB9ID0gcm9vdDtcbiAgICBpZiAoa2V5cy5sZW5ndGgpIHtcbiAgICAgIGlmIChzaGFwZUZsYWcgJiAoMSB8IDYpKSB7XG4gICAgICAgIGlmIChwcm9wc09wdGlvbnMgJiYga2V5cy5zb21lKGlzTW9kZWxMaXN0ZW5lcikpIHtcbiAgICAgICAgICBmYWxsdGhyb3VnaEF0dHJzID0gZmlsdGVyTW9kZWxMaXN0ZW5lcnMoXG4gICAgICAgICAgICBmYWxsdGhyb3VnaEF0dHJzLFxuICAgICAgICAgICAgcHJvcHNPcHRpb25zXG4gICAgICAgICAgKTtcbiAgICAgICAgfVxuICAgICAgICByb290ID0gY2xvbmVWTm9kZShyb290LCBmYWxsdGhyb3VnaEF0dHJzLCBmYWxzZSwgdHJ1ZSk7XG4gICAgICB9IGVsc2UgaWYgKCEhKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSBcInByb2R1Y3Rpb25cIikgJiYgIWFjY2Vzc2VkQXR0cnMgJiYgcm9vdC50eXBlICE9PSBDb21tZW50KSB7XG4gICAgICAgIGNvbnN0IGFsbEF0dHJzID0gT2JqZWN0LmtleXMoYXR0cnMpO1xuICAgICAgICBjb25zdCBldmVudEF0dHJzID0gW107XG4gICAgICAgIGNvbnN0IGV4dHJhQXR0cnMgPSBbXTtcbiAgICAgICAgZm9yIChsZXQgaSA9IDAsIGwgPSBhbGxBdHRycy5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICAgICAgICBjb25zdCBrZXkgPSBhbGxBdHRyc1tpXTtcbiAgICAgICAgICBpZiAoaXNPbihrZXkpKSB7XG4gICAgICAgICAgICBpZiAoIWlzTW9kZWxMaXN0ZW5lcihrZXkpKSB7XG4gICAgICAgICAgICAgIGV2ZW50QXR0cnMucHVzaChrZXlbMl0udG9Mb3dlckNhc2UoKSArIGtleS5zbGljZSgzKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGV4dHJhQXR0cnMucHVzaChrZXkpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAoZXh0cmFBdHRycy5sZW5ndGgpIHtcbiAgICAgICAgICB3YXJuJDEoXG4gICAgICAgICAgICBgRXh0cmFuZW91cyBub24tcHJvcHMgYXR0cmlidXRlcyAoJHtleHRyYUF0dHJzLmpvaW4oXCIsIFwiKX0pIHdlcmUgcGFzc2VkIHRvIGNvbXBvbmVudCBidXQgY291bGQgbm90IGJlIGF1dG9tYXRpY2FsbHkgaW5oZXJpdGVkIGJlY2F1c2UgY29tcG9uZW50IHJlbmRlcnMgZnJhZ21lbnQgb3IgdGV4dCBvciB0ZWxlcG9ydCByb290IG5vZGVzLmBcbiAgICAgICAgICApO1xuICAgICAgICB9XG4gICAgICAgIGlmIChldmVudEF0dHJzLmxlbmd0aCkge1xuICAgICAgICAgIHdhcm4kMShcbiAgICAgICAgICAgIGBFeHRyYW5lb3VzIG5vbi1lbWl0cyBldmVudCBsaXN0ZW5lcnMgKCR7ZXZlbnRBdHRycy5qb2luKFwiLCBcIil9KSB3ZXJlIHBhc3NlZCB0byBjb21wb25lbnQgYnV0IGNvdWxkIG5vdCBiZSBhdXRvbWF0aWNhbGx5IGluaGVyaXRlZCBiZWNhdXNlIGNvbXBvbmVudCByZW5kZXJzIGZyYWdtZW50IG9yIHRleHQgcm9vdCBub2Rlcy4gSWYgdGhlIGxpc3RlbmVyIGlzIGludGVuZGVkIHRvIGJlIGEgY29tcG9uZW50IGN1c3RvbSBldmVudCBsaXN0ZW5lciBvbmx5LCBkZWNsYXJlIGl0IHVzaW5nIHRoZSBcImVtaXRzXCIgb3B0aW9uLmBcbiAgICAgICAgICApO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG4gIGlmICh2bm9kZS5kaXJzKSB7XG4gICAgaWYgKCEhKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSBcInByb2R1Y3Rpb25cIikgJiYgIWlzRWxlbWVudFJvb3Qocm9vdCkpIHtcbiAgICAgIHdhcm4kMShcbiAgICAgICAgYFJ1bnRpbWUgZGlyZWN0aXZlIHVzZWQgb24gY29tcG9uZW50IHdpdGggbm9uLWVsZW1lbnQgcm9vdCBub2RlLiBUaGUgZGlyZWN0aXZlcyB3aWxsIG5vdCBmdW5jdGlvbiBhcyBpbnRlbmRlZC5gXG4gICAgICApO1xuICAgIH1cbiAgICByb290ID0gY2xvbmVWTm9kZShyb290LCBudWxsLCBmYWxzZSwgdHJ1ZSk7XG4gICAgcm9vdC5kaXJzID0gcm9vdC5kaXJzID8gcm9vdC5kaXJzLmNvbmNhdCh2bm9kZS5kaXJzKSA6IHZub2RlLmRpcnM7XG4gIH1cbiAgaWYgKHZub2RlLnRyYW5zaXRpb24pIHtcbiAgICBpZiAoISEocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09IFwicHJvZHVjdGlvblwiKSAmJiAhaXNFbGVtZW50Um9vdChyb290KSkge1xuICAgICAgd2FybiQxKFxuICAgICAgICBgQ29tcG9uZW50IGluc2lkZSA8VHJhbnNpdGlvbj4gcmVuZGVycyBub24tZWxlbWVudCByb290IG5vZGUgdGhhdCBjYW5ub3QgYmUgYW5pbWF0ZWQuYFxuICAgICAgKTtcbiAgICB9XG4gICAgc2V0VHJhbnNpdGlvbkhvb2tzKHJvb3QsIHZub2RlLnRyYW5zaXRpb24pO1xuICB9XG4gIGlmICghIShwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gXCJwcm9kdWN0aW9uXCIpICYmIHNldFJvb3QpIHtcbiAgICBzZXRSb290KHJvb3QpO1xuICB9IGVsc2Uge1xuICAgIHJlc3VsdCA9IHJvb3Q7XG4gIH1cbiAgc2V0Q3VycmVudFJlbmRlcmluZ0luc3RhbmNlKHByZXYpO1xuICByZXR1cm4gcmVzdWx0O1xufVxuY29uc3QgZ2V0Q2hpbGRSb290ID0gKHZub2RlKSA9PiB7XG4gIGNvbnN0IHJhd0NoaWxkcmVuID0gdm5vZGUuY2hpbGRyZW47XG4gIGNvbnN0IGR5bmFtaWNDaGlsZHJlbiA9IHZub2RlLmR5bmFtaWNDaGlsZHJlbjtcbiAgY29uc3QgY2hpbGRSb290ID0gZmlsdGVyU2luZ2xlUm9vdChyYXdDaGlsZHJlbiwgZmFsc2UpO1xuICBpZiAoIWNoaWxkUm9vdCkge1xuICAgIHJldHVybiBbdm5vZGUsIHZvaWQgMF07XG4gIH0gZWxzZSBpZiAoISEocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09IFwicHJvZHVjdGlvblwiKSAmJiBjaGlsZFJvb3QucGF0Y2hGbGFnID4gMCAmJiBjaGlsZFJvb3QucGF0Y2hGbGFnICYgMjA0OCkge1xuICAgIHJldHVybiBnZXRDaGlsZFJvb3QoY2hpbGRSb290KTtcbiAgfVxuICBjb25zdCBpbmRleCA9IHJhd0NoaWxkcmVuLmluZGV4T2YoY2hpbGRSb290KTtcbiAgY29uc3QgZHluYW1pY0luZGV4ID0gZHluYW1pY0NoaWxkcmVuID8gZHluYW1pY0NoaWxkcmVuLmluZGV4T2YoY2hpbGRSb290KSA6IC0xO1xuICBjb25zdCBzZXRSb290ID0gKHVwZGF0ZWRSb290KSA9PiB7XG4gICAgcmF3Q2hpbGRyZW5baW5kZXhdID0gdXBkYXRlZFJvb3Q7XG4gICAgaWYgKGR5bmFtaWNDaGlsZHJlbikge1xuICAgICAgaWYgKGR5bmFtaWNJbmRleCA+IC0xKSB7XG4gICAgICAgIGR5bmFtaWNDaGlsZHJlbltkeW5hbWljSW5kZXhdID0gdXBkYXRlZFJvb3Q7XG4gICAgICB9IGVsc2UgaWYgKHVwZGF0ZWRSb290LnBhdGNoRmxhZyA+IDApIHtcbiAgICAgICAgdm5vZGUuZHluYW1pY0NoaWxkcmVuID0gWy4uLmR5bmFtaWNDaGlsZHJlbiwgdXBkYXRlZFJvb3RdO1xuICAgICAgfVxuICAgIH1cbiAgfTtcbiAgcmV0dXJuIFtub3JtYWxpemVWTm9kZShjaGlsZFJvb3QpLCBzZXRSb290XTtcbn07XG5mdW5jdGlvbiBmaWx0ZXJTaW5nbGVSb290KGNoaWxkcmVuLCByZWN1cnNlID0gdHJ1ZSkge1xuICBsZXQgc2luZ2xlUm9vdDtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBjaGlsZHJlbi5sZW5ndGg7IGkrKykge1xuICAgIGNvbnN0IGNoaWxkID0gY2hpbGRyZW5baV07XG4gICAgaWYgKGlzVk5vZGUoY2hpbGQpKSB7XG4gICAgICBpZiAoY2hpbGQudHlwZSAhPT0gQ29tbWVudCB8fCBjaGlsZC5jaGlsZHJlbiA9PT0gXCJ2LWlmXCIpIHtcbiAgICAgICAgaWYgKHNpbmdsZVJvb3QpIHtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgc2luZ2xlUm9vdCA9IGNoaWxkO1xuICAgICAgICAgIGlmICghIShwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gXCJwcm9kdWN0aW9uXCIpICYmIHJlY3Vyc2UgJiYgc2luZ2xlUm9vdC5wYXRjaEZsYWcgPiAwICYmIHNpbmdsZVJvb3QucGF0Y2hGbGFnICYgMjA0OCkge1xuICAgICAgICAgICAgcmV0dXJuIGZpbHRlclNpbmdsZVJvb3Qoc2luZ2xlUm9vdC5jaGlsZHJlbik7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHNpbmdsZVJvb3Q7XG59XG5jb25zdCBnZXRGdW5jdGlvbmFsRmFsbHRocm91Z2ggPSAoYXR0cnMpID0+IHtcbiAgbGV0IHJlcztcbiAgZm9yIChjb25zdCBrZXkgaW4gYXR0cnMpIHtcbiAgICBpZiAoa2V5ID09PSBcImNsYXNzXCIgfHwga2V5ID09PSBcInN0eWxlXCIgfHwgaXNPbihrZXkpKSB7XG4gICAgICAocmVzIHx8IChyZXMgPSB7fSkpW2tleV0gPSBhdHRyc1trZXldO1xuICAgIH1cbiAgfVxuICByZXR1cm4gcmVzO1xufTtcbmNvbnN0IGZpbHRlck1vZGVsTGlzdGVuZXJzID0gKGF0dHJzLCBwcm9wcykgPT4ge1xuICBjb25zdCByZXMgPSB7fTtcbiAgZm9yIChjb25zdCBrZXkgaW4gYXR0cnMpIHtcbiAgICBpZiAoIWlzTW9kZWxMaXN0ZW5lcihrZXkpIHx8ICEoa2V5LnNsaWNlKDkpIGluIHByb3BzKSkge1xuICAgICAgcmVzW2tleV0gPSBhdHRyc1trZXldO1xuICAgIH1cbiAgfVxuICByZXR1cm4gcmVzO1xufTtcbmNvbnN0IGlzRWxlbWVudFJvb3QgPSAodm5vZGUpID0+IHtcbiAgcmV0dXJuIHZub2RlLnNoYXBlRmxhZyAmICg2IHwgMSkgfHwgdm5vZGUudHlwZSA9PT0gQ29tbWVudDtcbn07XG5mdW5jdGlvbiBzaG91bGRVcGRhdGVDb21wb25lbnQocHJldlZOb2RlLCBuZXh0Vk5vZGUsIG9wdGltaXplZCkge1xuICBjb25zdCB7IHByb3BzOiBwcmV2UHJvcHMsIGNoaWxkcmVuOiBwcmV2Q2hpbGRyZW4sIGNvbXBvbmVudCB9ID0gcHJldlZOb2RlO1xuICBjb25zdCB7IHByb3BzOiBuZXh0UHJvcHMsIGNoaWxkcmVuOiBuZXh0Q2hpbGRyZW4sIHBhdGNoRmxhZyB9ID0gbmV4dFZOb2RlO1xuICBjb25zdCBlbWl0cyA9IGNvbXBvbmVudC5lbWl0c09wdGlvbnM7XG4gIGlmICghIShwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gXCJwcm9kdWN0aW9uXCIpICYmIChwcmV2Q2hpbGRyZW4gfHwgbmV4dENoaWxkcmVuKSAmJiBpc0htclVwZGF0aW5nKSB7XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cbiAgaWYgKG5leHRWTm9kZS5kaXJzIHx8IG5leHRWTm9kZS50cmFuc2l0aW9uKSB7XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cbiAgaWYgKG9wdGltaXplZCAmJiBwYXRjaEZsYWcgPj0gMCkge1xuICAgIGlmIChwYXRjaEZsYWcgJiAxMDI0KSB7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gICAgaWYgKHBhdGNoRmxhZyAmIDE2KSB7XG4gICAgICBpZiAoIXByZXZQcm9wcykge1xuICAgICAgICByZXR1cm4gISFuZXh0UHJvcHM7XG4gICAgICB9XG4gICAgICByZXR1cm4gaGFzUHJvcHNDaGFuZ2VkKHByZXZQcm9wcywgbmV4dFByb3BzLCBlbWl0cyk7XG4gICAgfSBlbHNlIGlmIChwYXRjaEZsYWcgJiA4KSB7XG4gICAgICBjb25zdCBkeW5hbWljUHJvcHMgPSBuZXh0Vk5vZGUuZHluYW1pY1Byb3BzO1xuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBkeW5hbWljUHJvcHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgY29uc3Qga2V5ID0gZHluYW1pY1Byb3BzW2ldO1xuICAgICAgICBpZiAoaGFzUHJvcFZhbHVlQ2hhbmdlZChuZXh0UHJvcHMsIHByZXZQcm9wcywga2V5KSAmJiAhaXNFbWl0TGlzdGVuZXIoZW1pdHMsIGtleSkpIHtcbiAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfSBlbHNlIHtcbiAgICBpZiAocHJldkNoaWxkcmVuIHx8IG5leHRDaGlsZHJlbikge1xuICAgICAgaWYgKCFuZXh0Q2hpbGRyZW4gfHwgIW5leHRDaGlsZHJlbi4kc3RhYmxlKSB7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfVxuICAgIH1cbiAgICBpZiAocHJldlByb3BzID09PSBuZXh0UHJvcHMpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgaWYgKCFwcmV2UHJvcHMpIHtcbiAgICAgIHJldHVybiAhIW5leHRQcm9wcztcbiAgICB9XG4gICAgaWYgKCFuZXh0UHJvcHMpIHtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICByZXR1cm4gaGFzUHJvcHNDaGFuZ2VkKHByZXZQcm9wcywgbmV4dFByb3BzLCBlbWl0cyk7XG4gIH1cbiAgcmV0dXJuIGZhbHNlO1xufVxuZnVuY3Rpb24gaGFzUHJvcHNDaGFuZ2VkKHByZXZQcm9wcywgbmV4dFByb3BzLCBlbWl0c09wdGlvbnMpIHtcbiAgY29uc3QgbmV4dEtleXMgPSBPYmplY3Qua2V5cyhuZXh0UHJvcHMpO1xuICBpZiAobmV4dEtleXMubGVuZ3RoICE9PSBPYmplY3Qua2V5cyhwcmV2UHJvcHMpLmxlbmd0aCkge1xuICAgIHJldHVybiB0cnVlO1xuICB9XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgbmV4dEtleXMubGVuZ3RoOyBpKyspIHtcbiAgICBjb25zdCBrZXkgPSBuZXh0S2V5c1tpXTtcbiAgICBpZiAoaGFzUHJvcFZhbHVlQ2hhbmdlZChuZXh0UHJvcHMsIHByZXZQcm9wcywga2V5KSAmJiAhaXNFbWl0TGlzdGVuZXIoZW1pdHNPcHRpb25zLCBrZXkpKSB7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIGZhbHNlO1xufVxuZnVuY3Rpb24gaGFzUHJvcFZhbHVlQ2hhbmdlZChuZXh0UHJvcHMsIHByZXZQcm9wcywga2V5KSB7XG4gIGNvbnN0IG5leHRQcm9wID0gbmV4dFByb3BzW2tleV07XG4gIGNvbnN0IHByZXZQcm9wID0gcHJldlByb3BzW2tleV07XG4gIGlmIChrZXkgPT09IFwic3R5bGVcIiAmJiBpc09iamVjdChuZXh0UHJvcCkgJiYgaXNPYmplY3QocHJldlByb3ApKSB7XG4gICAgcmV0dXJuICFsb29zZUVxdWFsKG5leHRQcm9wLCBwcmV2UHJvcCk7XG4gIH1cbiAgcmV0dXJuIG5leHRQcm9wICE9PSBwcmV2UHJvcDtcbn1cbmZ1bmN0aW9uIHVwZGF0ZUhPQ0hvc3RFbCh7IHZub2RlLCBwYXJlbnQgfSwgZWwpIHtcbiAgd2hpbGUgKHBhcmVudCkge1xuICAgIGNvbnN0IHJvb3QgPSBwYXJlbnQuc3ViVHJlZTtcbiAgICBpZiAocm9vdC5zdXNwZW5zZSAmJiByb290LnN1c3BlbnNlLmFjdGl2ZUJyYW5jaCA9PT0gdm5vZGUpIHtcbiAgICAgIHJvb3QuZWwgPSB2bm9kZS5lbDtcbiAgICB9XG4gICAgaWYgKHJvb3QgPT09IHZub2RlKSB7XG4gICAgICAodm5vZGUgPSBwYXJlbnQudm5vZGUpLmVsID0gZWw7XG4gICAgICBwYXJlbnQgPSBwYXJlbnQucGFyZW50O1xuICAgIH0gZWxzZSB7XG4gICAgICBicmVhaztcbiAgICB9XG4gIH1cbn1cblxuY29uc3QgaW50ZXJuYWxPYmplY3RQcm90byA9IHt9O1xuY29uc3QgY3JlYXRlSW50ZXJuYWxPYmplY3QgPSAoKSA9PiBPYmplY3QuY3JlYXRlKGludGVybmFsT2JqZWN0UHJvdG8pO1xuY29uc3QgaXNJbnRlcm5hbE9iamVjdCA9IChvYmopID0+IE9iamVjdC5nZXRQcm90b3R5cGVPZihvYmopID09PSBpbnRlcm5hbE9iamVjdFByb3RvO1xuXG5mdW5jdGlvbiBpbml0UHJvcHMoaW5zdGFuY2UsIHJhd1Byb3BzLCBpc1N0YXRlZnVsLCBpc1NTUiA9IGZhbHNlKSB7XG4gIGNvbnN0IHByb3BzID0ge307XG4gIGNvbnN0IGF0dHJzID0gY3JlYXRlSW50ZXJuYWxPYmplY3QoKTtcbiAgaW5zdGFuY2UucHJvcHNEZWZhdWx0cyA9IC8qIEBfX1BVUkVfXyAqLyBPYmplY3QuY3JlYXRlKG51bGwpO1xuICBzZXRGdWxsUHJvcHMoaW5zdGFuY2UsIHJhd1Byb3BzLCBwcm9wcywgYXR0cnMpO1xuICBmb3IgKGNvbnN0IGtleSBpbiBpbnN0YW5jZS5wcm9wc09wdGlvbnNbMF0pIHtcbiAgICBpZiAoIShrZXkgaW4gcHJvcHMpKSB7XG4gICAgICBwcm9wc1trZXldID0gdm9pZCAwO1xuICAgIH1cbiAgfVxuICBpZiAoISEocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09IFwicHJvZHVjdGlvblwiKSkge1xuICAgIHZhbGlkYXRlUHJvcHMocmF3UHJvcHMgfHwge30sIHByb3BzLCBpbnN0YW5jZSk7XG4gIH1cbiAgaWYgKGlzU3RhdGVmdWwpIHtcbiAgICBpbnN0YW5jZS5wcm9wcyA9IGlzU1NSID8gcHJvcHMgOiBzaGFsbG93UmVhY3RpdmUocHJvcHMpO1xuICB9IGVsc2Uge1xuICAgIGlmICghaW5zdGFuY2UudHlwZS5wcm9wcykge1xuICAgICAgaW5zdGFuY2UucHJvcHMgPSBhdHRycztcbiAgICB9IGVsc2Uge1xuICAgICAgaW5zdGFuY2UucHJvcHMgPSBwcm9wcztcbiAgICB9XG4gIH1cbiAgaW5zdGFuY2UuYXR0cnMgPSBhdHRycztcbn1cbmZ1bmN0aW9uIGlzSW5IbXJDb250ZXh0KGluc3RhbmNlKSB7XG4gIHdoaWxlIChpbnN0YW5jZSkge1xuICAgIGlmIChpbnN0YW5jZS50eXBlLl9faG1ySWQpIHJldHVybiB0cnVlO1xuICAgIGluc3RhbmNlID0gaW5zdGFuY2UucGFyZW50O1xuICB9XG59XG5mdW5jdGlvbiB1cGRhdGVQcm9wcyhpbnN0YW5jZSwgcmF3UHJvcHMsIHJhd1ByZXZQcm9wcywgb3B0aW1pemVkKSB7XG4gIGNvbnN0IHtcbiAgICBwcm9wcyxcbiAgICBhdHRycyxcbiAgICB2bm9kZTogeyBwYXRjaEZsYWcgfVxuICB9ID0gaW5zdGFuY2U7XG4gIGNvbnN0IHJhd0N1cnJlbnRQcm9wcyA9IHRvUmF3KHByb3BzKTtcbiAgY29uc3QgW29wdGlvbnNdID0gaW5zdGFuY2UucHJvcHNPcHRpb25zO1xuICBsZXQgaGFzQXR0cnNDaGFuZ2VkID0gZmFsc2U7XG4gIGlmIChcbiAgICAvLyBhbHdheXMgZm9yY2UgZnVsbCBkaWZmIGluIGRldlxuICAgIC8vIC0gIzE5NDIgaWYgaG1yIGlzIGVuYWJsZWQgd2l0aCBzZmMgY29tcG9uZW50XG4gICAgLy8gLSB2aXRlIzg3MiBub24tc2ZjIGNvbXBvbmVudCB1c2VkIGJ5IHNmYyBjb21wb25lbnRcbiAgICAhKCEhKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSBcInByb2R1Y3Rpb25cIikgJiYgaXNJbkhtckNvbnRleHQoaW5zdGFuY2UpKSAmJiAob3B0aW1pemVkIHx8IHBhdGNoRmxhZyA+IDApICYmICEocGF0Y2hGbGFnICYgMTYpXG4gICkge1xuICAgIGlmIChwYXRjaEZsYWcgJiA4KSB7XG4gICAgICBjb25zdCBwcm9wc1RvVXBkYXRlID0gaW5zdGFuY2Uudm5vZGUuZHluYW1pY1Byb3BzO1xuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBwcm9wc1RvVXBkYXRlLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGxldCBrZXkgPSBwcm9wc1RvVXBkYXRlW2ldO1xuICAgICAgICBpZiAoaXNFbWl0TGlzdGVuZXIoaW5zdGFuY2UuZW1pdHNPcHRpb25zLCBrZXkpKSB7XG4gICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgdmFsdWUgPSByYXdQcm9wc1trZXldO1xuICAgICAgICBpZiAob3B0aW9ucykge1xuICAgICAgICAgIGlmIChoYXNPd24oYXR0cnMsIGtleSkpIHtcbiAgICAgICAgICAgIGlmICh2YWx1ZSAhPT0gYXR0cnNba2V5XSkge1xuICAgICAgICAgICAgICBhdHRyc1trZXldID0gdmFsdWU7XG4gICAgICAgICAgICAgIGhhc0F0dHJzQ2hhbmdlZCA9IHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNvbnN0IGNhbWVsaXplZEtleSA9IGNhbWVsaXplKGtleSk7XG4gICAgICAgICAgICBwcm9wc1tjYW1lbGl6ZWRLZXldID0gcmVzb2x2ZVByb3BWYWx1ZShcbiAgICAgICAgICAgICAgb3B0aW9ucyxcbiAgICAgICAgICAgICAgcmF3Q3VycmVudFByb3BzLFxuICAgICAgICAgICAgICBjYW1lbGl6ZWRLZXksXG4gICAgICAgICAgICAgIHZhbHVlLFxuICAgICAgICAgICAgICBpbnN0YW5jZSxcbiAgICAgICAgICAgICAgZmFsc2VcbiAgICAgICAgICAgICk7XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGlmICh2YWx1ZSAhPT0gYXR0cnNba2V5XSkge1xuICAgICAgICAgICAgYXR0cnNba2V5XSA9IHZhbHVlO1xuICAgICAgICAgICAgaGFzQXR0cnNDaGFuZ2VkID0gdHJ1ZTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgaWYgKHNldEZ1bGxQcm9wcyhpbnN0YW5jZSwgcmF3UHJvcHMsIHByb3BzLCBhdHRycykpIHtcbiAgICAgIGhhc0F0dHJzQ2hhbmdlZCA9IHRydWU7XG4gICAgfVxuICAgIGxldCBrZWJhYktleTtcbiAgICBmb3IgKGNvbnN0IGtleSBpbiByYXdDdXJyZW50UHJvcHMpIHtcbiAgICAgIGlmICghcmF3UHJvcHMgfHwgLy8gZm9yIGNhbWVsQ2FzZVxuICAgICAgIWhhc093bihyYXdQcm9wcywga2V5KSAmJiAvLyBpdCdzIHBvc3NpYmxlIHRoZSBvcmlnaW5hbCBwcm9wcyB3YXMgcGFzc2VkIGluIGFzIGtlYmFiLWNhc2VcbiAgICAgIC8vIGFuZCBjb252ZXJ0ZWQgdG8gY2FtZWxDYXNlICgjOTU1KVxuICAgICAgKChrZWJhYktleSA9IGh5cGhlbmF0ZShrZXkpKSA9PT0ga2V5IHx8ICFoYXNPd24ocmF3UHJvcHMsIGtlYmFiS2V5KSkpIHtcbiAgICAgICAgaWYgKG9wdGlvbnMpIHtcbiAgICAgICAgICBpZiAocmF3UHJldlByb3BzICYmIC8vIGZvciBjYW1lbENhc2VcbiAgICAgICAgICAocmF3UHJldlByb3BzW2tleV0gIT09IHZvaWQgMCB8fCAvLyBmb3Iga2ViYWItY2FzZVxuICAgICAgICAgIHJhd1ByZXZQcm9wc1trZWJhYktleV0gIT09IHZvaWQgMCkpIHtcbiAgICAgICAgICAgIHByb3BzW2tleV0gPSByZXNvbHZlUHJvcFZhbHVlKFxuICAgICAgICAgICAgICBvcHRpb25zLFxuICAgICAgICAgICAgICByYXdDdXJyZW50UHJvcHMsXG4gICAgICAgICAgICAgIGtleSxcbiAgICAgICAgICAgICAgdm9pZCAwLFxuICAgICAgICAgICAgICBpbnN0YW5jZSxcbiAgICAgICAgICAgICAgdHJ1ZVxuICAgICAgICAgICAgKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgZGVsZXRlIHByb3BzW2tleV07XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKGF0dHJzICE9PSByYXdDdXJyZW50UHJvcHMpIHtcbiAgICAgIGZvciAoY29uc3Qga2V5IGluIGF0dHJzKSB7XG4gICAgICAgIGlmICghcmF3UHJvcHMgfHwgIWhhc093bihyYXdQcm9wcywga2V5KSAmJiB0cnVlKSB7XG4gICAgICAgICAgZGVsZXRlIGF0dHJzW2tleV07XG4gICAgICAgICAgaGFzQXR0cnNDaGFuZ2VkID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuICBpZiAoaGFzQXR0cnNDaGFuZ2VkKSB7XG4gICAgdHJpZ2dlcihpbnN0YW5jZS5hdHRycywgXCJzZXRcIiwgXCJcIik7XG4gIH1cbiAgaWYgKCEhKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSBcInByb2R1Y3Rpb25cIikpIHtcbiAgICB2YWxpZGF0ZVByb3BzKHJhd1Byb3BzIHx8IHt9LCBwcm9wcywgaW5zdGFuY2UpO1xuICB9XG59XG5mdW5jdGlvbiBzZXRGdWxsUHJvcHMoaW5zdGFuY2UsIHJhd1Byb3BzLCBwcm9wcywgYXR0cnMpIHtcbiAgY29uc3QgW29wdGlvbnMsIG5lZWRDYXN0S2V5c10gPSBpbnN0YW5jZS5wcm9wc09wdGlvbnM7XG4gIGxldCBoYXNBdHRyc0NoYW5nZWQgPSBmYWxzZTtcbiAgbGV0IHJhd0Nhc3RWYWx1ZXM7XG4gIGlmIChyYXdQcm9wcykge1xuICAgIGZvciAobGV0IGtleSBpbiByYXdQcm9wcykge1xuICAgICAgaWYgKGlzUmVzZXJ2ZWRQcm9wKGtleSkpIHtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG4gICAgICBjb25zdCB2YWx1ZSA9IHJhd1Byb3BzW2tleV07XG4gICAgICBsZXQgY2FtZWxLZXk7XG4gICAgICBpZiAob3B0aW9ucyAmJiBoYXNPd24ob3B0aW9ucywgY2FtZWxLZXkgPSBjYW1lbGl6ZShrZXkpKSkge1xuICAgICAgICBpZiAoIW5lZWRDYXN0S2V5cyB8fCAhbmVlZENhc3RLZXlzLmluY2x1ZGVzKGNhbWVsS2V5KSkge1xuICAgICAgICAgIHByb3BzW2NhbWVsS2V5XSA9IHZhbHVlO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIChyYXdDYXN0VmFsdWVzIHx8IChyYXdDYXN0VmFsdWVzID0ge30pKVtjYW1lbEtleV0gPSB2YWx1ZTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIGlmICghaXNFbWl0TGlzdGVuZXIoaW5zdGFuY2UuZW1pdHNPcHRpb25zLCBrZXkpKSB7XG4gICAgICAgIGlmICghKGtleSBpbiBhdHRycykgfHwgdmFsdWUgIT09IGF0dHJzW2tleV0pIHtcbiAgICAgICAgICBhdHRyc1trZXldID0gdmFsdWU7XG4gICAgICAgICAgaGFzQXR0cnNDaGFuZ2VkID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuICBpZiAobmVlZENhc3RLZXlzKSB7XG4gICAgY29uc3QgcmF3Q3VycmVudFByb3BzID0gdG9SYXcocHJvcHMpO1xuICAgIGNvbnN0IGNhc3RWYWx1ZXMgPSByYXdDYXN0VmFsdWVzIHx8IEVNUFRZX09CSjtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IG5lZWRDYXN0S2V5cy5sZW5ndGg7IGkrKykge1xuICAgICAgY29uc3Qga2V5ID0gbmVlZENhc3RLZXlzW2ldO1xuICAgICAgcHJvcHNba2V5XSA9IHJlc29sdmVQcm9wVmFsdWUoXG4gICAgICAgIG9wdGlvbnMsXG4gICAgICAgIHJhd0N1cnJlbnRQcm9wcyxcbiAgICAgICAga2V5LFxuICAgICAgICBjYXN0VmFsdWVzW2tleV0sXG4gICAgICAgIGluc3RhbmNlLFxuICAgICAgICAhaGFzT3duKGNhc3RWYWx1ZXMsIGtleSlcbiAgICAgICk7XG4gICAgfVxuICB9XG4gIHJldHVybiBoYXNBdHRyc0NoYW5nZWQ7XG59XG5mdW5jdGlvbiByZXNvbHZlUHJvcFZhbHVlKG9wdGlvbnMsIHByb3BzLCBrZXksIHZhbHVlLCBpbnN0YW5jZSwgaXNBYnNlbnQpIHtcbiAgY29uc3Qgb3B0ID0gb3B0aW9uc1trZXldO1xuICBpZiAob3B0ICE9IG51bGwpIHtcbiAgICBjb25zdCBoYXNEZWZhdWx0ID0gaGFzT3duKG9wdCwgXCJkZWZhdWx0XCIpO1xuICAgIGlmIChoYXNEZWZhdWx0ICYmIHZhbHVlID09PSB2b2lkIDApIHtcbiAgICAgIGNvbnN0IGRlZmF1bHRWYWx1ZSA9IG9wdC5kZWZhdWx0O1xuICAgICAgaWYgKG9wdC50eXBlICE9PSBGdW5jdGlvbiAmJiAhb3B0LnNraXBGYWN0b3J5ICYmIGlzRnVuY3Rpb24oZGVmYXVsdFZhbHVlKSkge1xuICAgICAgICBjb25zdCB7IHByb3BzRGVmYXVsdHMgfSA9IGluc3RhbmNlO1xuICAgICAgICBpZiAoa2V5IGluIHByb3BzRGVmYXVsdHMpIHtcbiAgICAgICAgICB2YWx1ZSA9IHByb3BzRGVmYXVsdHNba2V5XTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBjb25zdCByZXNldCA9IHNldEN1cnJlbnRJbnN0YW5jZShpbnN0YW5jZSk7XG4gICAgICAgICAgdmFsdWUgPSBwcm9wc0RlZmF1bHRzW2tleV0gPSBkZWZhdWx0VmFsdWUuY2FsbChcbiAgICAgICAgICAgIG51bGwsXG4gICAgICAgICAgICBwcm9wc1xuICAgICAgICAgICk7XG4gICAgICAgICAgcmVzZXQoKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdmFsdWUgPSBkZWZhdWx0VmFsdWU7XG4gICAgICB9XG4gICAgICBpZiAoaW5zdGFuY2UuY2UpIHtcbiAgICAgICAgaW5zdGFuY2UuY2UuX3NldFByb3Aoa2V5LCB2YWx1ZSk7XG4gICAgICB9XG4gICAgfVxuICAgIGlmIChvcHRbMCAvKiBzaG91bGRDYXN0ICovXSkge1xuICAgICAgaWYgKGlzQWJzZW50ICYmICFoYXNEZWZhdWx0KSB7XG4gICAgICAgIHZhbHVlID0gZmFsc2U7XG4gICAgICB9IGVsc2UgaWYgKG9wdFsxIC8qIHNob3VsZENhc3RUcnVlICovXSAmJiAodmFsdWUgPT09IFwiXCIgfHwgdmFsdWUgPT09IGh5cGhlbmF0ZShrZXkpKSkge1xuICAgICAgICB2YWx1ZSA9IHRydWU7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIHJldHVybiB2YWx1ZTtcbn1cbmNvbnN0IG1peGluUHJvcHNDYWNoZSA9IC8qIEBfX1BVUkVfXyAqLyBuZXcgV2Vha01hcCgpO1xuZnVuY3Rpb24gbm9ybWFsaXplUHJvcHNPcHRpb25zKGNvbXAsIGFwcENvbnRleHQsIGFzTWl4aW4gPSBmYWxzZSkge1xuICBjb25zdCBjYWNoZSA9IF9fVlVFX09QVElPTlNfQVBJX18gJiYgYXNNaXhpbiA/IG1peGluUHJvcHNDYWNoZSA6IGFwcENvbnRleHQucHJvcHNDYWNoZTtcbiAgY29uc3QgY2FjaGVkID0gY2FjaGUuZ2V0KGNvbXApO1xuICBpZiAoY2FjaGVkKSB7XG4gICAgcmV0dXJuIGNhY2hlZDtcbiAgfVxuICBjb25zdCByYXcgPSBjb21wLnByb3BzO1xuICBjb25zdCBub3JtYWxpemVkID0ge307XG4gIGNvbnN0IG5lZWRDYXN0S2V5cyA9IFtdO1xuICBsZXQgaGFzRXh0ZW5kcyA9IGZhbHNlO1xuICBpZiAoX19WVUVfT1BUSU9OU19BUElfXyAmJiAhaXNGdW5jdGlvbihjb21wKSkge1xuICAgIGNvbnN0IGV4dGVuZFByb3BzID0gKHJhdzIpID0+IHtcbiAgICAgIGhhc0V4dGVuZHMgPSB0cnVlO1xuICAgICAgY29uc3QgW3Byb3BzLCBrZXlzXSA9IG5vcm1hbGl6ZVByb3BzT3B0aW9ucyhyYXcyLCBhcHBDb250ZXh0LCB0cnVlKTtcbiAgICAgIGV4dGVuZChub3JtYWxpemVkLCBwcm9wcyk7XG4gICAgICBpZiAoa2V5cykgbmVlZENhc3RLZXlzLnB1c2goLi4ua2V5cyk7XG4gICAgfTtcbiAgICBpZiAoIWFzTWl4aW4gJiYgYXBwQ29udGV4dC5taXhpbnMubGVuZ3RoKSB7XG4gICAgICBhcHBDb250ZXh0Lm1peGlucy5mb3JFYWNoKGV4dGVuZFByb3BzKTtcbiAgICB9XG4gICAgaWYgKGNvbXAuZXh0ZW5kcykge1xuICAgICAgZXh0ZW5kUHJvcHMoY29tcC5leHRlbmRzKTtcbiAgICB9XG4gICAgaWYgKGNvbXAubWl4aW5zKSB7XG4gICAgICBjb21wLm1peGlucy5mb3JFYWNoKGV4dGVuZFByb3BzKTtcbiAgICB9XG4gIH1cbiAgaWYgKCFyYXcgJiYgIWhhc0V4dGVuZHMpIHtcbiAgICBpZiAoaXNPYmplY3QoY29tcCkpIHtcbiAgICAgIGNhY2hlLnNldChjb21wLCBFTVBUWV9BUlIpO1xuICAgIH1cbiAgICByZXR1cm4gRU1QVFlfQVJSO1xuICB9XG4gIGlmIChpc0FycmF5KHJhdykpIHtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHJhdy5sZW5ndGg7IGkrKykge1xuICAgICAgaWYgKCEhKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSBcInByb2R1Y3Rpb25cIikgJiYgIWlzU3RyaW5nKHJhd1tpXSkpIHtcbiAgICAgICAgd2FybiQxKGBwcm9wcyBtdXN0IGJlIHN0cmluZ3Mgd2hlbiB1c2luZyBhcnJheSBzeW50YXguYCwgcmF3W2ldKTtcbiAgICAgIH1cbiAgICAgIGNvbnN0IG5vcm1hbGl6ZWRLZXkgPSBjYW1lbGl6ZShyYXdbaV0pO1xuICAgICAgaWYgKHZhbGlkYXRlUHJvcE5hbWUobm9ybWFsaXplZEtleSkpIHtcbiAgICAgICAgbm9ybWFsaXplZFtub3JtYWxpemVkS2V5XSA9IEVNUFRZX09CSjtcbiAgICAgIH1cbiAgICB9XG4gIH0gZWxzZSBpZiAocmF3KSB7XG4gICAgaWYgKCEhKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSBcInByb2R1Y3Rpb25cIikgJiYgIWlzT2JqZWN0KHJhdykpIHtcbiAgICAgIHdhcm4kMShgaW52YWxpZCBwcm9wcyBvcHRpb25zYCwgcmF3KTtcbiAgICB9XG4gICAgZm9yIChjb25zdCBrZXkgaW4gcmF3KSB7XG4gICAgICBjb25zdCBub3JtYWxpemVkS2V5ID0gY2FtZWxpemUoa2V5KTtcbiAgICAgIGlmICh2YWxpZGF0ZVByb3BOYW1lKG5vcm1hbGl6ZWRLZXkpKSB7XG4gICAgICAgIGNvbnN0IG9wdCA9IHJhd1trZXldO1xuICAgICAgICBjb25zdCBwcm9wID0gbm9ybWFsaXplZFtub3JtYWxpemVkS2V5XSA9IGlzQXJyYXkob3B0KSB8fCBpc0Z1bmN0aW9uKG9wdCkgPyB7IHR5cGU6IG9wdCB9IDogZXh0ZW5kKHt9LCBvcHQpO1xuICAgICAgICBjb25zdCBwcm9wVHlwZSA9IHByb3AudHlwZTtcbiAgICAgICAgbGV0IHNob3VsZENhc3QgPSBmYWxzZTtcbiAgICAgICAgbGV0IHNob3VsZENhc3RUcnVlID0gdHJ1ZTtcbiAgICAgICAgaWYgKGlzQXJyYXkocHJvcFR5cGUpKSB7XG4gICAgICAgICAgZm9yIChsZXQgaW5kZXggPSAwOyBpbmRleCA8IHByb3BUeXBlLmxlbmd0aDsgKytpbmRleCkge1xuICAgICAgICAgICAgY29uc3QgdHlwZSA9IHByb3BUeXBlW2luZGV4XTtcbiAgICAgICAgICAgIGNvbnN0IHR5cGVOYW1lID0gaXNGdW5jdGlvbih0eXBlKSAmJiB0eXBlLm5hbWU7XG4gICAgICAgICAgICBpZiAodHlwZU5hbWUgPT09IFwiQm9vbGVhblwiKSB7XG4gICAgICAgICAgICAgIHNob3VsZENhc3QgPSB0cnVlO1xuICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH0gZWxzZSBpZiAodHlwZU5hbWUgPT09IFwiU3RyaW5nXCIpIHtcbiAgICAgICAgICAgICAgc2hvdWxkQ2FzdFRydWUgPSBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgc2hvdWxkQ2FzdCA9IGlzRnVuY3Rpb24ocHJvcFR5cGUpICYmIHByb3BUeXBlLm5hbWUgPT09IFwiQm9vbGVhblwiO1xuICAgICAgICB9XG4gICAgICAgIHByb3BbMCAvKiBzaG91bGRDYXN0ICovXSA9IHNob3VsZENhc3Q7XG4gICAgICAgIHByb3BbMSAvKiBzaG91bGRDYXN0VHJ1ZSAqL10gPSBzaG91bGRDYXN0VHJ1ZTtcbiAgICAgICAgaWYgKHNob3VsZENhc3QgfHwgaGFzT3duKHByb3AsIFwiZGVmYXVsdFwiKSkge1xuICAgICAgICAgIG5lZWRDYXN0S2V5cy5wdXNoKG5vcm1hbGl6ZWRLZXkpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG4gIGNvbnN0IHJlcyA9IFtub3JtYWxpemVkLCBuZWVkQ2FzdEtleXNdO1xuICBpZiAoaXNPYmplY3QoY29tcCkpIHtcbiAgICBjYWNoZS5zZXQoY29tcCwgcmVzKTtcbiAgfVxuICByZXR1cm4gcmVzO1xufVxuZnVuY3Rpb24gdmFsaWRhdGVQcm9wTmFtZShrZXkpIHtcbiAgaWYgKGtleVswXSAhPT0gXCIkXCIgJiYgIWlzUmVzZXJ2ZWRQcm9wKGtleSkpIHtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfSBlbHNlIGlmICghIShwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gXCJwcm9kdWN0aW9uXCIpKSB7XG4gICAgd2FybiQxKGBJbnZhbGlkIHByb3AgbmFtZTogXCIke2tleX1cIiBpcyBhIHJlc2VydmVkIHByb3BlcnR5LmApO1xuICB9XG4gIHJldHVybiBmYWxzZTtcbn1cbmZ1bmN0aW9uIGdldFR5cGUoY3Rvcikge1xuICBpZiAoY3RvciA9PT0gbnVsbCkge1xuICAgIHJldHVybiBcIm51bGxcIjtcbiAgfVxuICBpZiAodHlwZW9mIGN0b3IgPT09IFwiZnVuY3Rpb25cIikge1xuICAgIHJldHVybiBjdG9yLm5hbWUgfHwgXCJcIjtcbiAgfSBlbHNlIGlmICh0eXBlb2YgY3RvciA9PT0gXCJvYmplY3RcIikge1xuICAgIGNvbnN0IG5hbWUgPSBjdG9yLmNvbnN0cnVjdG9yICYmIGN0b3IuY29uc3RydWN0b3IubmFtZTtcbiAgICByZXR1cm4gbmFtZSB8fCBcIlwiO1xuICB9XG4gIHJldHVybiBcIlwiO1xufVxuZnVuY3Rpb24gdmFsaWRhdGVQcm9wcyhyYXdQcm9wcywgcHJvcHMsIGluc3RhbmNlKSB7XG4gIGNvbnN0IHJlc29sdmVkVmFsdWVzID0gdG9SYXcocHJvcHMpO1xuICBjb25zdCBvcHRpb25zID0gaW5zdGFuY2UucHJvcHNPcHRpb25zWzBdO1xuICBjb25zdCBjYW1lbGl6ZVByb3BzS2V5ID0gT2JqZWN0LmtleXMocmF3UHJvcHMpLm1hcCgoa2V5KSA9PiBjYW1lbGl6ZShrZXkpKTtcbiAgZm9yIChjb25zdCBrZXkgaW4gb3B0aW9ucykge1xuICAgIGxldCBvcHQgPSBvcHRpb25zW2tleV07XG4gICAgaWYgKG9wdCA9PSBudWxsKSBjb250aW51ZTtcbiAgICB2YWxpZGF0ZVByb3AoXG4gICAgICBrZXksXG4gICAgICByZXNvbHZlZFZhbHVlc1trZXldLFxuICAgICAgb3B0LFxuICAgICAgISEocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09IFwicHJvZHVjdGlvblwiKSA/IHNoYWxsb3dSZWFkb25seShyZXNvbHZlZFZhbHVlcykgOiByZXNvbHZlZFZhbHVlcyxcbiAgICAgICFjYW1lbGl6ZVByb3BzS2V5LmluY2x1ZGVzKGtleSlcbiAgICApO1xuICB9XG59XG5mdW5jdGlvbiB2YWxpZGF0ZVByb3AobmFtZSwgdmFsdWUsIHByb3AsIHByb3BzLCBpc0Fic2VudCkge1xuICBjb25zdCB7IHR5cGUsIHJlcXVpcmVkLCB2YWxpZGF0b3IsIHNraXBDaGVjayB9ID0gcHJvcDtcbiAgaWYgKHJlcXVpcmVkICYmIGlzQWJzZW50KSB7XG4gICAgd2FybiQxKCdNaXNzaW5nIHJlcXVpcmVkIHByb3A6IFwiJyArIG5hbWUgKyAnXCInKTtcbiAgICByZXR1cm47XG4gIH1cbiAgaWYgKHZhbHVlID09IG51bGwgJiYgIXJlcXVpcmVkKSB7XG4gICAgcmV0dXJuO1xuICB9XG4gIGlmICh0eXBlICE9IG51bGwgJiYgdHlwZSAhPT0gdHJ1ZSAmJiAhc2tpcENoZWNrKSB7XG4gICAgbGV0IGlzVmFsaWQgPSBmYWxzZTtcbiAgICBjb25zdCB0eXBlcyA9IGlzQXJyYXkodHlwZSkgPyB0eXBlIDogW3R5cGVdO1xuICAgIGNvbnN0IGV4cGVjdGVkVHlwZXMgPSBbXTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHR5cGVzLmxlbmd0aCAmJiAhaXNWYWxpZDsgaSsrKSB7XG4gICAgICBjb25zdCB7IHZhbGlkLCBleHBlY3RlZFR5cGUgfSA9IGFzc2VydFR5cGUodmFsdWUsIHR5cGVzW2ldKTtcbiAgICAgIGV4cGVjdGVkVHlwZXMucHVzaChleHBlY3RlZFR5cGUgfHwgXCJcIik7XG4gICAgICBpc1ZhbGlkID0gdmFsaWQ7XG4gICAgfVxuICAgIGlmICghaXNWYWxpZCkge1xuICAgICAgd2FybiQxKGdldEludmFsaWRUeXBlTWVzc2FnZShuYW1lLCB2YWx1ZSwgZXhwZWN0ZWRUeXBlcykpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgfVxuICBpZiAodmFsaWRhdG9yICYmICF2YWxpZGF0b3IodmFsdWUsIHByb3BzKSkge1xuICAgIHdhcm4kMSgnSW52YWxpZCBwcm9wOiBjdXN0b20gdmFsaWRhdG9yIGNoZWNrIGZhaWxlZCBmb3IgcHJvcCBcIicgKyBuYW1lICsgJ1wiLicpO1xuICB9XG59XG5jb25zdCBpc1NpbXBsZVR5cGUgPSAvKiBAX19QVVJFX18gKi8gbWFrZU1hcChcbiAgXCJTdHJpbmcsTnVtYmVyLEJvb2xlYW4sRnVuY3Rpb24sU3ltYm9sLEJpZ0ludFwiXG4pO1xuZnVuY3Rpb24gYXNzZXJ0VHlwZSh2YWx1ZSwgdHlwZSkge1xuICBsZXQgdmFsaWQ7XG4gIGNvbnN0IGV4cGVjdGVkVHlwZSA9IGdldFR5cGUodHlwZSk7XG4gIGlmIChleHBlY3RlZFR5cGUgPT09IFwibnVsbFwiKSB7XG4gICAgdmFsaWQgPSB2YWx1ZSA9PT0gbnVsbDtcbiAgfSBlbHNlIGlmIChpc1NpbXBsZVR5cGUoZXhwZWN0ZWRUeXBlKSkge1xuICAgIGNvbnN0IHQgPSB0eXBlb2YgdmFsdWU7XG4gICAgdmFsaWQgPSB0ID09PSBleHBlY3RlZFR5cGUudG9Mb3dlckNhc2UoKTtcbiAgICBpZiAoIXZhbGlkICYmIHQgPT09IFwib2JqZWN0XCIpIHtcbiAgICAgIHZhbGlkID0gdmFsdWUgaW5zdGFuY2VvZiB0eXBlO1xuICAgIH1cbiAgfSBlbHNlIGlmIChleHBlY3RlZFR5cGUgPT09IFwiT2JqZWN0XCIpIHtcbiAgICB2YWxpZCA9IGlzT2JqZWN0KHZhbHVlKTtcbiAgfSBlbHNlIGlmIChleHBlY3RlZFR5cGUgPT09IFwiQXJyYXlcIikge1xuICAgIHZhbGlkID0gaXNBcnJheSh2YWx1ZSk7XG4gIH0gZWxzZSB7XG4gICAgdmFsaWQgPSB2YWx1ZSBpbnN0YW5jZW9mIHR5cGU7XG4gIH1cbiAgcmV0dXJuIHtcbiAgICB2YWxpZCxcbiAgICBleHBlY3RlZFR5cGVcbiAgfTtcbn1cbmZ1bmN0aW9uIGdldEludmFsaWRUeXBlTWVzc2FnZShuYW1lLCB2YWx1ZSwgZXhwZWN0ZWRUeXBlcykge1xuICBpZiAoZXhwZWN0ZWRUeXBlcy5sZW5ndGggPT09IDApIHtcbiAgICByZXR1cm4gYFByb3AgdHlwZSBbXSBmb3IgcHJvcCBcIiR7bmFtZX1cIiB3b24ndCBtYXRjaCBhbnl0aGluZy4gRGlkIHlvdSBtZWFuIHRvIHVzZSB0eXBlIEFycmF5IGluc3RlYWQ/YDtcbiAgfVxuICBsZXQgbWVzc2FnZSA9IGBJbnZhbGlkIHByb3A6IHR5cGUgY2hlY2sgZmFpbGVkIGZvciBwcm9wIFwiJHtuYW1lfVwiLiBFeHBlY3RlZCAke2V4cGVjdGVkVHlwZXMubWFwKGNhcGl0YWxpemUpLmpvaW4oXCIgfCBcIil9YDtcbiAgY29uc3QgZXhwZWN0ZWRUeXBlID0gZXhwZWN0ZWRUeXBlc1swXTtcbiAgY29uc3QgcmVjZWl2ZWRUeXBlID0gdG9SYXdUeXBlKHZhbHVlKTtcbiAgY29uc3QgZXhwZWN0ZWRWYWx1ZSA9IHN0eWxlVmFsdWUodmFsdWUsIGV4cGVjdGVkVHlwZSk7XG4gIGNvbnN0IHJlY2VpdmVkVmFsdWUgPSBzdHlsZVZhbHVlKHZhbHVlLCByZWNlaXZlZFR5cGUpO1xuICBpZiAoZXhwZWN0ZWRUeXBlcy5sZW5ndGggPT09IDEgJiYgaXNFeHBsaWNhYmxlKGV4cGVjdGVkVHlwZSkgJiYgIWlzQm9vbGVhbihleHBlY3RlZFR5cGUsIHJlY2VpdmVkVHlwZSkpIHtcbiAgICBtZXNzYWdlICs9IGAgd2l0aCB2YWx1ZSAke2V4cGVjdGVkVmFsdWV9YDtcbiAgfVxuICBtZXNzYWdlICs9IGAsIGdvdCAke3JlY2VpdmVkVHlwZX0gYDtcbiAgaWYgKGlzRXhwbGljYWJsZShyZWNlaXZlZFR5cGUpKSB7XG4gICAgbWVzc2FnZSArPSBgd2l0aCB2YWx1ZSAke3JlY2VpdmVkVmFsdWV9LmA7XG4gIH1cbiAgcmV0dXJuIG1lc3NhZ2U7XG59XG5mdW5jdGlvbiBzdHlsZVZhbHVlKHZhbHVlLCB0eXBlKSB7XG4gIGlmICh0eXBlID09PSBcIlN0cmluZ1wiKSB7XG4gICAgcmV0dXJuIGBcIiR7dmFsdWV9XCJgO1xuICB9IGVsc2UgaWYgKHR5cGUgPT09IFwiTnVtYmVyXCIpIHtcbiAgICByZXR1cm4gYCR7TnVtYmVyKHZhbHVlKX1gO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiBgJHt2YWx1ZX1gO1xuICB9XG59XG5mdW5jdGlvbiBpc0V4cGxpY2FibGUodHlwZSkge1xuICBjb25zdCBleHBsaWNpdFR5cGVzID0gW1wic3RyaW5nXCIsIFwibnVtYmVyXCIsIFwiYm9vbGVhblwiXTtcbiAgcmV0dXJuIGV4cGxpY2l0VHlwZXMuc29tZSgoZWxlbSkgPT4gdHlwZS50b0xvd2VyQ2FzZSgpID09PSBlbGVtKTtcbn1cbmZ1bmN0aW9uIGlzQm9vbGVhbiguLi5hcmdzKSB7XG4gIHJldHVybiBhcmdzLnNvbWUoKGVsZW0pID0+IGVsZW0udG9Mb3dlckNhc2UoKSA9PT0gXCJib29sZWFuXCIpO1xufVxuXG5jb25zdCBpc0ludGVybmFsS2V5ID0gKGtleSkgPT4ga2V5ID09PSBcIl9cIiB8fCBrZXkgPT09IFwiX2N0eFwiIHx8IGtleSA9PT0gXCIkc3RhYmxlXCI7XG5jb25zdCBub3JtYWxpemVTbG90VmFsdWUgPSAodmFsdWUpID0+IGlzQXJyYXkodmFsdWUpID8gdmFsdWUubWFwKG5vcm1hbGl6ZVZOb2RlKSA6IFtub3JtYWxpemVWTm9kZSh2YWx1ZSldO1xuY29uc3Qgbm9ybWFsaXplU2xvdCA9IChrZXksIHJhd1Nsb3QsIGN0eCkgPT4ge1xuICBpZiAocmF3U2xvdC5fbikge1xuICAgIHJldHVybiByYXdTbG90O1xuICB9XG4gIGNvbnN0IG5vcm1hbGl6ZWQgPSB3aXRoQ3R4KCguLi5hcmdzKSA9PiB7XG4gICAgaWYgKCEhKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSBcInByb2R1Y3Rpb25cIikgJiYgY3VycmVudEluc3RhbmNlICYmICEoY3R4ID09PSBudWxsICYmIGN1cnJlbnRSZW5kZXJpbmdJbnN0YW5jZSkgJiYgIShjdHggJiYgY3R4LnJvb3QgIT09IGN1cnJlbnRJbnN0YW5jZS5yb290KSkge1xuICAgICAgd2FybiQxKFxuICAgICAgICBgU2xvdCBcIiR7a2V5fVwiIGludm9rZWQgb3V0c2lkZSBvZiB0aGUgcmVuZGVyIGZ1bmN0aW9uOiB0aGlzIHdpbGwgbm90IHRyYWNrIGRlcGVuZGVuY2llcyB1c2VkIGluIHRoZSBzbG90LiBJbnZva2UgdGhlIHNsb3QgZnVuY3Rpb24gaW5zaWRlIHRoZSByZW5kZXIgZnVuY3Rpb24gaW5zdGVhZC5gXG4gICAgICApO1xuICAgIH1cbiAgICByZXR1cm4gbm9ybWFsaXplU2xvdFZhbHVlKHJhd1Nsb3QoLi4uYXJncykpO1xuICB9LCBjdHgpO1xuICBub3JtYWxpemVkLl9jID0gZmFsc2U7XG4gIHJldHVybiBub3JtYWxpemVkO1xufTtcbmNvbnN0IG5vcm1hbGl6ZU9iamVjdFNsb3RzID0gKHJhd1Nsb3RzLCBzbG90cywgaW5zdGFuY2UpID0+IHtcbiAgY29uc3QgY3R4ID0gcmF3U2xvdHMuX2N0eDtcbiAgZm9yIChjb25zdCBrZXkgaW4gcmF3U2xvdHMpIHtcbiAgICBpZiAoaXNJbnRlcm5hbEtleShrZXkpKSBjb250aW51ZTtcbiAgICBjb25zdCB2YWx1ZSA9IHJhd1Nsb3RzW2tleV07XG4gICAgaWYgKGlzRnVuY3Rpb24odmFsdWUpKSB7XG4gICAgICBzbG90c1trZXldID0gbm9ybWFsaXplU2xvdChrZXksIHZhbHVlLCBjdHgpO1xuICAgIH0gZWxzZSBpZiAodmFsdWUgIT0gbnVsbCkge1xuICAgICAgaWYgKCEhKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSBcInByb2R1Y3Rpb25cIikgJiYgdHJ1ZSkge1xuICAgICAgICB3YXJuJDEoXG4gICAgICAgICAgYE5vbi1mdW5jdGlvbiB2YWx1ZSBlbmNvdW50ZXJlZCBmb3Igc2xvdCBcIiR7a2V5fVwiLiBQcmVmZXIgZnVuY3Rpb24gc2xvdHMgZm9yIGJldHRlciBwZXJmb3JtYW5jZS5gXG4gICAgICAgICk7XG4gICAgICB9XG4gICAgICBjb25zdCBub3JtYWxpemVkID0gbm9ybWFsaXplU2xvdFZhbHVlKHZhbHVlKTtcbiAgICAgIHNsb3RzW2tleV0gPSAoKSA9PiBub3JtYWxpemVkO1xuICAgIH1cbiAgfVxufTtcbmNvbnN0IG5vcm1hbGl6ZVZOb2RlU2xvdHMgPSAoaW5zdGFuY2UsIGNoaWxkcmVuKSA9PiB7XG4gIGlmICghIShwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gXCJwcm9kdWN0aW9uXCIpICYmICFpc0tlZXBBbGl2ZShpbnN0YW5jZS52bm9kZSkgJiYgdHJ1ZSkge1xuICAgIHdhcm4kMShcbiAgICAgIGBOb24tZnVuY3Rpb24gdmFsdWUgZW5jb3VudGVyZWQgZm9yIGRlZmF1bHQgc2xvdC4gUHJlZmVyIGZ1bmN0aW9uIHNsb3RzIGZvciBiZXR0ZXIgcGVyZm9ybWFuY2UuYFxuICAgICk7XG4gIH1cbiAgY29uc3Qgbm9ybWFsaXplZCA9IG5vcm1hbGl6ZVNsb3RWYWx1ZShjaGlsZHJlbik7XG4gIGluc3RhbmNlLnNsb3RzLmRlZmF1bHQgPSAoKSA9PiBub3JtYWxpemVkO1xufTtcbmNvbnN0IGFzc2lnblNsb3RzID0gKHNsb3RzLCBjaGlsZHJlbiwgb3B0aW1pemVkKSA9PiB7XG4gIGZvciAoY29uc3Qga2V5IGluIGNoaWxkcmVuKSB7XG4gICAgaWYgKG9wdGltaXplZCB8fCAhaXNJbnRlcm5hbEtleShrZXkpKSB7XG4gICAgICBzbG90c1trZXldID0gY2hpbGRyZW5ba2V5XTtcbiAgICB9XG4gIH1cbn07XG5jb25zdCBpbml0U2xvdHMgPSAoaW5zdGFuY2UsIGNoaWxkcmVuLCBvcHRpbWl6ZWQpID0+IHtcbiAgY29uc3Qgc2xvdHMgPSBpbnN0YW5jZS5zbG90cyA9IGNyZWF0ZUludGVybmFsT2JqZWN0KCk7XG4gIGlmIChpbnN0YW5jZS52bm9kZS5zaGFwZUZsYWcgJiAzMikge1xuICAgIGNvbnN0IHR5cGUgPSBjaGlsZHJlbi5fO1xuICAgIGlmICh0eXBlKSB7XG4gICAgICBhc3NpZ25TbG90cyhzbG90cywgY2hpbGRyZW4sIG9wdGltaXplZCk7XG4gICAgICBpZiAob3B0aW1pemVkKSB7XG4gICAgICAgIGRlZihzbG90cywgXCJfXCIsIHR5cGUsIHRydWUpO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBub3JtYWxpemVPYmplY3RTbG90cyhjaGlsZHJlbiwgc2xvdHMpO1xuICAgIH1cbiAgfSBlbHNlIGlmIChjaGlsZHJlbikge1xuICAgIG5vcm1hbGl6ZVZOb2RlU2xvdHMoaW5zdGFuY2UsIGNoaWxkcmVuKTtcbiAgfVxufTtcbmNvbnN0IHVwZGF0ZVNsb3RzID0gKGluc3RhbmNlLCBjaGlsZHJlbiwgb3B0aW1pemVkKSA9PiB7XG4gIGNvbnN0IHsgdm5vZGUsIHNsb3RzIH0gPSBpbnN0YW5jZTtcbiAgbGV0IG5lZWREZWxldGlvbkNoZWNrID0gdHJ1ZTtcbiAgbGV0IGRlbGV0aW9uQ29tcGFyaXNvblRhcmdldCA9IEVNUFRZX09CSjtcbiAgaWYgKHZub2RlLnNoYXBlRmxhZyAmIDMyKSB7XG4gICAgY29uc3QgdHlwZSA9IGNoaWxkcmVuLl87XG4gICAgaWYgKHR5cGUpIHtcbiAgICAgIGlmICghIShwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gXCJwcm9kdWN0aW9uXCIpICYmIGlzSG1yVXBkYXRpbmcpIHtcbiAgICAgICAgYXNzaWduU2xvdHMoc2xvdHMsIGNoaWxkcmVuLCBvcHRpbWl6ZWQpO1xuICAgICAgICB0cmlnZ2VyKGluc3RhbmNlLCBcInNldFwiLCBcIiRzbG90c1wiKTtcbiAgICAgIH0gZWxzZSBpZiAob3B0aW1pemVkICYmIHR5cGUgPT09IDEpIHtcbiAgICAgICAgbmVlZERlbGV0aW9uQ2hlY2sgPSBmYWxzZTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGFzc2lnblNsb3RzKHNsb3RzLCBjaGlsZHJlbiwgb3B0aW1pemVkKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgbmVlZERlbGV0aW9uQ2hlY2sgPSAhY2hpbGRyZW4uJHN0YWJsZTtcbiAgICAgIG5vcm1hbGl6ZU9iamVjdFNsb3RzKGNoaWxkcmVuLCBzbG90cyk7XG4gICAgfVxuICAgIGRlbGV0aW9uQ29tcGFyaXNvblRhcmdldCA9IGNoaWxkcmVuO1xuICB9IGVsc2UgaWYgKGNoaWxkcmVuKSB7XG4gICAgbm9ybWFsaXplVk5vZGVTbG90cyhpbnN0YW5jZSwgY2hpbGRyZW4pO1xuICAgIGRlbGV0aW9uQ29tcGFyaXNvblRhcmdldCA9IHsgZGVmYXVsdDogMSB9O1xuICB9XG4gIGlmIChuZWVkRGVsZXRpb25DaGVjaykge1xuICAgIGZvciAoY29uc3Qga2V5IGluIHNsb3RzKSB7XG4gICAgICBpZiAoIWlzSW50ZXJuYWxLZXkoa2V5KSAmJiBkZWxldGlvbkNvbXBhcmlzb25UYXJnZXRba2V5XSA9PSBudWxsKSB7XG4gICAgICAgIGRlbGV0ZSBzbG90c1trZXldO1xuICAgICAgfVxuICAgIH1cbiAgfVxufTtcblxubGV0IHN1cHBvcnRlZDtcbmxldCBwZXJmO1xuZnVuY3Rpb24gc3RhcnRNZWFzdXJlKGluc3RhbmNlLCB0eXBlKSB7XG4gIGlmIChpbnN0YW5jZS5hcHBDb250ZXh0LmNvbmZpZy5wZXJmb3JtYW5jZSAmJiBpc1N1cHBvcnRlZCgpKSB7XG4gICAgcGVyZi5tYXJrKGB2dWUtJHt0eXBlfS0ke2luc3RhbmNlLnVpZH1gKTtcbiAgfVxuICBpZiAoISEocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09IFwicHJvZHVjdGlvblwiKSB8fCBfX1ZVRV9QUk9EX0RFVlRPT0xTX18pIHtcbiAgICBkZXZ0b29sc1BlcmZTdGFydChpbnN0YW5jZSwgdHlwZSwgaXNTdXBwb3J0ZWQoKSA/IHBlcmYubm93KCkgOiBEYXRlLm5vdygpKTtcbiAgfVxufVxuZnVuY3Rpb24gZW5kTWVhc3VyZShpbnN0YW5jZSwgdHlwZSkge1xuICBpZiAoaW5zdGFuY2UuYXBwQ29udGV4dC5jb25maWcucGVyZm9ybWFuY2UgJiYgaXNTdXBwb3J0ZWQoKSkge1xuICAgIGNvbnN0IHN0YXJ0VGFnID0gYHZ1ZS0ke3R5cGV9LSR7aW5zdGFuY2UudWlkfWA7XG4gICAgY29uc3QgZW5kVGFnID0gc3RhcnRUYWcgKyBgOmVuZGA7XG4gICAgY29uc3QgbWVhc3VyZU5hbWUgPSBgPCR7Zm9ybWF0Q29tcG9uZW50TmFtZShpbnN0YW5jZSwgaW5zdGFuY2UudHlwZSl9PiAke3R5cGV9YDtcbiAgICBwZXJmLm1hcmsoZW5kVGFnKTtcbiAgICBwZXJmLm1lYXN1cmUobWVhc3VyZU5hbWUsIHN0YXJ0VGFnLCBlbmRUYWcpO1xuICAgIHBlcmYuY2xlYXJNZWFzdXJlcyhtZWFzdXJlTmFtZSk7XG4gICAgcGVyZi5jbGVhck1hcmtzKHN0YXJ0VGFnKTtcbiAgICBwZXJmLmNsZWFyTWFya3MoZW5kVGFnKTtcbiAgfVxuICBpZiAoISEocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09IFwicHJvZHVjdGlvblwiKSB8fCBfX1ZVRV9QUk9EX0RFVlRPT0xTX18pIHtcbiAgICBkZXZ0b29sc1BlcmZFbmQoaW5zdGFuY2UsIHR5cGUsIGlzU3VwcG9ydGVkKCkgPyBwZXJmLm5vdygpIDogRGF0ZS5ub3coKSk7XG4gIH1cbn1cbmZ1bmN0aW9uIGlzU3VwcG9ydGVkKCkge1xuICBpZiAoc3VwcG9ydGVkICE9PSB2b2lkIDApIHtcbiAgICByZXR1cm4gc3VwcG9ydGVkO1xuICB9XG4gIGlmICh0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiICYmIHdpbmRvdy5wZXJmb3JtYW5jZSkge1xuICAgIHN1cHBvcnRlZCA9IHRydWU7XG4gICAgcGVyZiA9IHdpbmRvdy5wZXJmb3JtYW5jZTtcbiAgfSBlbHNlIHtcbiAgICBzdXBwb3J0ZWQgPSBmYWxzZTtcbiAgfVxuICByZXR1cm4gc3VwcG9ydGVkO1xufVxuXG5mdW5jdGlvbiBpbml0RmVhdHVyZUZsYWdzKCkge1xuICBjb25zdCBuZWVkV2FybiA9IFtdO1xuICBpZiAodHlwZW9mIF9fVlVFX09QVElPTlNfQVBJX18gIT09IFwiYm9vbGVhblwiKSB7XG4gICAgISEocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09IFwicHJvZHVjdGlvblwiKSAmJiBuZWVkV2Fybi5wdXNoKGBfX1ZVRV9PUFRJT05TX0FQSV9fYCk7XG4gICAgZ2V0R2xvYmFsVGhpcygpLl9fVlVFX09QVElPTlNfQVBJX18gPSB0cnVlO1xuICB9XG4gIGlmICh0eXBlb2YgX19WVUVfUFJPRF9ERVZUT09MU19fICE9PSBcImJvb2xlYW5cIikge1xuICAgICEhKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSBcInByb2R1Y3Rpb25cIikgJiYgbmVlZFdhcm4ucHVzaChgX19WVUVfUFJPRF9ERVZUT09MU19fYCk7XG4gICAgZ2V0R2xvYmFsVGhpcygpLl9fVlVFX1BST0RfREVWVE9PTFNfXyA9IGZhbHNlO1xuICB9XG4gIGlmICh0eXBlb2YgX19WVUVfUFJPRF9IWURSQVRJT05fTUlTTUFUQ0hfREVUQUlMU19fICE9PSBcImJvb2xlYW5cIikge1xuICAgICEhKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSBcInByb2R1Y3Rpb25cIikgJiYgbmVlZFdhcm4ucHVzaChgX19WVUVfUFJPRF9IWURSQVRJT05fTUlTTUFUQ0hfREVUQUlMU19fYCk7XG4gICAgZ2V0R2xvYmFsVGhpcygpLl9fVlVFX1BST0RfSFlEUkFUSU9OX01JU01BVENIX0RFVEFJTFNfXyA9IGZhbHNlO1xuICB9XG4gIGlmICghIShwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gXCJwcm9kdWN0aW9uXCIpICYmIG5lZWRXYXJuLmxlbmd0aCkge1xuICAgIGNvbnN0IG11bHRpID0gbmVlZFdhcm4ubGVuZ3RoID4gMTtcbiAgICBjb25zb2xlLndhcm4oXG4gICAgICBgRmVhdHVyZSBmbGFnJHttdWx0aSA/IGBzYCA6IGBgfSAke25lZWRXYXJuLmpvaW4oXCIsIFwiKX0gJHttdWx0aSA/IGBhcmVgIDogYGlzYH0gbm90IGV4cGxpY2l0bHkgZGVmaW5lZC4gWW91IGFyZSBydW5uaW5nIHRoZSBlc20tYnVuZGxlciBidWlsZCBvZiBWdWUsIHdoaWNoIGV4cGVjdHMgdGhlc2UgY29tcGlsZS10aW1lIGZlYXR1cmUgZmxhZ3MgdG8gYmUgZ2xvYmFsbHkgaW5qZWN0ZWQgdmlhIHRoZSBidW5kbGVyIGNvbmZpZyBpbiBvcmRlciB0byBnZXQgYmV0dGVyIHRyZWUtc2hha2luZyBpbiB0aGUgcHJvZHVjdGlvbiBidW5kbGUuXG5cbkZvciBtb3JlIGRldGFpbHMsIHNlZSBodHRwczovL2xpbmsudnVlanMub3JnL2ZlYXR1cmUtZmxhZ3MuYFxuICAgICk7XG4gIH1cbn1cblxuY29uc3QgcXVldWVQb3N0UmVuZGVyRWZmZWN0ID0gcXVldWVFZmZlY3RXaXRoU3VzcGVuc2UgO1xuZnVuY3Rpb24gY3JlYXRlUmVuZGVyZXIob3B0aW9ucykge1xuICByZXR1cm4gYmFzZUNyZWF0ZVJlbmRlcmVyKG9wdGlvbnMpO1xufVxuZnVuY3Rpb24gY3JlYXRlSHlkcmF0aW9uUmVuZGVyZXIob3B0aW9ucykge1xuICByZXR1cm4gYmFzZUNyZWF0ZVJlbmRlcmVyKG9wdGlvbnMsIGNyZWF0ZUh5ZHJhdGlvbkZ1bmN0aW9ucyk7XG59XG5mdW5jdGlvbiBiYXNlQ3JlYXRlUmVuZGVyZXIob3B0aW9ucywgY3JlYXRlSHlkcmF0aW9uRm5zKSB7XG4gIHtcbiAgICBpbml0RmVhdHVyZUZsYWdzKCk7XG4gIH1cbiAgY29uc3QgdGFyZ2V0ID0gZ2V0R2xvYmFsVGhpcygpO1xuICB0YXJnZXQuX19WVUVfXyA9IHRydWU7XG4gIGlmICghIShwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gXCJwcm9kdWN0aW9uXCIpIHx8IF9fVlVFX1BST0RfREVWVE9PTFNfXykge1xuICAgIHNldERldnRvb2xzSG9vayQxKHRhcmdldC5fX1ZVRV9ERVZUT09MU19HTE9CQUxfSE9PS19fLCB0YXJnZXQpO1xuICB9XG4gIGNvbnN0IHtcbiAgICBpbnNlcnQ6IGhvc3RJbnNlcnQsXG4gICAgcmVtb3ZlOiBob3N0UmVtb3ZlLFxuICAgIHBhdGNoUHJvcDogaG9zdFBhdGNoUHJvcCxcbiAgICBjcmVhdGVFbGVtZW50OiBob3N0Q3JlYXRlRWxlbWVudCxcbiAgICBjcmVhdGVUZXh0OiBob3N0Q3JlYXRlVGV4dCxcbiAgICBjcmVhdGVDb21tZW50OiBob3N0Q3JlYXRlQ29tbWVudCxcbiAgICBzZXRUZXh0OiBob3N0U2V0VGV4dCxcbiAgICBzZXRFbGVtZW50VGV4dDogaG9zdFNldEVsZW1lbnRUZXh0LFxuICAgIHBhcmVudE5vZGU6IGhvc3RQYXJlbnROb2RlLFxuICAgIG5leHRTaWJsaW5nOiBob3N0TmV4dFNpYmxpbmcsXG4gICAgc2V0U2NvcGVJZDogaG9zdFNldFNjb3BlSWQgPSBOT09QLFxuICAgIGluc2VydFN0YXRpY0NvbnRlbnQ6IGhvc3RJbnNlcnRTdGF0aWNDb250ZW50XG4gIH0gPSBvcHRpb25zO1xuICBjb25zdCBwYXRjaCA9IChuMSwgbjIsIGNvbnRhaW5lciwgYW5jaG9yID0gbnVsbCwgcGFyZW50Q29tcG9uZW50ID0gbnVsbCwgcGFyZW50U3VzcGVuc2UgPSBudWxsLCBuYW1lc3BhY2UgPSB2b2lkIDAsIHNsb3RTY29wZUlkcyA9IG51bGwsIG9wdGltaXplZCA9ICEhKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSBcInByb2R1Y3Rpb25cIikgJiYgaXNIbXJVcGRhdGluZyA/IGZhbHNlIDogISFuMi5keW5hbWljQ2hpbGRyZW4pID0+IHtcbiAgICBpZiAobjEgPT09IG4yKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGlmIChuMSAmJiAhaXNTYW1lVk5vZGVUeXBlKG4xLCBuMikpIHtcbiAgICAgIGFuY2hvciA9IGdldE5leHRIb3N0Tm9kZShuMSk7XG4gICAgICB1bm1vdW50KG4xLCBwYXJlbnRDb21wb25lbnQsIHBhcmVudFN1c3BlbnNlLCB0cnVlKTtcbiAgICAgIG4xID0gbnVsbDtcbiAgICB9XG4gICAgaWYgKG4yLnBhdGNoRmxhZyA9PT0gLTIpIHtcbiAgICAgIG9wdGltaXplZCA9IGZhbHNlO1xuICAgICAgbjIuZHluYW1pY0NoaWxkcmVuID0gbnVsbDtcbiAgICB9XG4gICAgY29uc3QgeyB0eXBlLCByZWYsIHNoYXBlRmxhZyB9ID0gbjI7XG4gICAgc3dpdGNoICh0eXBlKSB7XG4gICAgICBjYXNlIFRleHQ6XG4gICAgICAgIHByb2Nlc3NUZXh0KG4xLCBuMiwgY29udGFpbmVyLCBhbmNob3IpO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgQ29tbWVudDpcbiAgICAgICAgcHJvY2Vzc0NvbW1lbnROb2RlKG4xLCBuMiwgY29udGFpbmVyLCBhbmNob3IpO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgU3RhdGljOlxuICAgICAgICBpZiAobjEgPT0gbnVsbCkge1xuICAgICAgICAgIG1vdW50U3RhdGljTm9kZShuMiwgY29udGFpbmVyLCBhbmNob3IsIG5hbWVzcGFjZSk7XG4gICAgICAgIH0gZWxzZSBpZiAoISEocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09IFwicHJvZHVjdGlvblwiKSkge1xuICAgICAgICAgIHBhdGNoU3RhdGljTm9kZShuMSwgbjIsIGNvbnRhaW5lciwgbmFtZXNwYWNlKTtcbiAgICAgICAgfVxuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgRnJhZ21lbnQ6XG4gICAgICAgIHByb2Nlc3NGcmFnbWVudChcbiAgICAgICAgICBuMSxcbiAgICAgICAgICBuMixcbiAgICAgICAgICBjb250YWluZXIsXG4gICAgICAgICAgYW5jaG9yLFxuICAgICAgICAgIHBhcmVudENvbXBvbmVudCxcbiAgICAgICAgICBwYXJlbnRTdXNwZW5zZSxcbiAgICAgICAgICBuYW1lc3BhY2UsXG4gICAgICAgICAgc2xvdFNjb3BlSWRzLFxuICAgICAgICAgIG9wdGltaXplZFxuICAgICAgICApO1xuICAgICAgICBicmVhaztcbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIGlmIChzaGFwZUZsYWcgJiAxKSB7XG4gICAgICAgICAgcHJvY2Vzc0VsZW1lbnQoXG4gICAgICAgICAgICBuMSxcbiAgICAgICAgICAgIG4yLFxuICAgICAgICAgICAgY29udGFpbmVyLFxuICAgICAgICAgICAgYW5jaG9yLFxuICAgICAgICAgICAgcGFyZW50Q29tcG9uZW50LFxuICAgICAgICAgICAgcGFyZW50U3VzcGVuc2UsXG4gICAgICAgICAgICBuYW1lc3BhY2UsXG4gICAgICAgICAgICBzbG90U2NvcGVJZHMsXG4gICAgICAgICAgICBvcHRpbWl6ZWRcbiAgICAgICAgICApO1xuICAgICAgICB9IGVsc2UgaWYgKHNoYXBlRmxhZyAmIDYpIHtcbiAgICAgICAgICBwcm9jZXNzQ29tcG9uZW50KFxuICAgICAgICAgICAgbjEsXG4gICAgICAgICAgICBuMixcbiAgICAgICAgICAgIGNvbnRhaW5lcixcbiAgICAgICAgICAgIGFuY2hvcixcbiAgICAgICAgICAgIHBhcmVudENvbXBvbmVudCxcbiAgICAgICAgICAgIHBhcmVudFN1c3BlbnNlLFxuICAgICAgICAgICAgbmFtZXNwYWNlLFxuICAgICAgICAgICAgc2xvdFNjb3BlSWRzLFxuICAgICAgICAgICAgb3B0aW1pemVkXG4gICAgICAgICAgKTtcbiAgICAgICAgfSBlbHNlIGlmIChzaGFwZUZsYWcgJiA2NCkge1xuICAgICAgICAgIHR5cGUucHJvY2VzcyhcbiAgICAgICAgICAgIG4xLFxuICAgICAgICAgICAgbjIsXG4gICAgICAgICAgICBjb250YWluZXIsXG4gICAgICAgICAgICBhbmNob3IsXG4gICAgICAgICAgICBwYXJlbnRDb21wb25lbnQsXG4gICAgICAgICAgICBwYXJlbnRTdXNwZW5zZSxcbiAgICAgICAgICAgIG5hbWVzcGFjZSxcbiAgICAgICAgICAgIHNsb3RTY29wZUlkcyxcbiAgICAgICAgICAgIG9wdGltaXplZCxcbiAgICAgICAgICAgIGludGVybmFsc1xuICAgICAgICAgICk7XG4gICAgICAgIH0gZWxzZSBpZiAoc2hhcGVGbGFnICYgMTI4KSB7XG4gICAgICAgICAgdHlwZS5wcm9jZXNzKFxuICAgICAgICAgICAgbjEsXG4gICAgICAgICAgICBuMixcbiAgICAgICAgICAgIGNvbnRhaW5lcixcbiAgICAgICAgICAgIGFuY2hvcixcbiAgICAgICAgICAgIHBhcmVudENvbXBvbmVudCxcbiAgICAgICAgICAgIHBhcmVudFN1c3BlbnNlLFxuICAgICAgICAgICAgbmFtZXNwYWNlLFxuICAgICAgICAgICAgc2xvdFNjb3BlSWRzLFxuICAgICAgICAgICAgb3B0aW1pemVkLFxuICAgICAgICAgICAgaW50ZXJuYWxzXG4gICAgICAgICAgKTtcbiAgICAgICAgfSBlbHNlIGlmICghIShwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gXCJwcm9kdWN0aW9uXCIpKSB7XG4gICAgICAgICAgd2FybiQxKFwiSW52YWxpZCBWTm9kZSB0eXBlOlwiLCB0eXBlLCBgKCR7dHlwZW9mIHR5cGV9KWApO1xuICAgICAgICB9XG4gICAgfVxuICAgIGlmIChyZWYgIT0gbnVsbCAmJiBwYXJlbnRDb21wb25lbnQpIHtcbiAgICAgIHNldFJlZihyZWYsIG4xICYmIG4xLnJlZiwgcGFyZW50U3VzcGVuc2UsIG4yIHx8IG4xLCAhbjIpO1xuICAgIH0gZWxzZSBpZiAocmVmID09IG51bGwgJiYgbjEgJiYgbjEucmVmICE9IG51bGwpIHtcbiAgICAgIHNldFJlZihuMS5yZWYsIG51bGwsIHBhcmVudFN1c3BlbnNlLCBuMSwgdHJ1ZSk7XG4gICAgfVxuICB9O1xuICBjb25zdCBwcm9jZXNzVGV4dCA9IChuMSwgbjIsIGNvbnRhaW5lciwgYW5jaG9yKSA9PiB7XG4gICAgaWYgKG4xID09IG51bGwpIHtcbiAgICAgIGhvc3RJbnNlcnQoXG4gICAgICAgIG4yLmVsID0gaG9zdENyZWF0ZVRleHQobjIuY2hpbGRyZW4pLFxuICAgICAgICBjb250YWluZXIsXG4gICAgICAgIGFuY2hvclxuICAgICAgKTtcbiAgICB9IGVsc2Uge1xuICAgICAgY29uc3QgZWwgPSBuMi5lbCA9IG4xLmVsO1xuICAgICAgaWYgKG4yLmNoaWxkcmVuICE9PSBuMS5jaGlsZHJlbikge1xuICAgICAgICBob3N0U2V0VGV4dChlbCwgbjIuY2hpbGRyZW4pO1xuICAgICAgfVxuICAgIH1cbiAgfTtcbiAgY29uc3QgcHJvY2Vzc0NvbW1lbnROb2RlID0gKG4xLCBuMiwgY29udGFpbmVyLCBhbmNob3IpID0+IHtcbiAgICBpZiAobjEgPT0gbnVsbCkge1xuICAgICAgaG9zdEluc2VydChcbiAgICAgICAgbjIuZWwgPSBob3N0Q3JlYXRlQ29tbWVudChuMi5jaGlsZHJlbiB8fCBcIlwiKSxcbiAgICAgICAgY29udGFpbmVyLFxuICAgICAgICBhbmNob3JcbiAgICAgICk7XG4gICAgfSBlbHNlIHtcbiAgICAgIG4yLmVsID0gbjEuZWw7XG4gICAgfVxuICB9O1xuICBjb25zdCBtb3VudFN0YXRpY05vZGUgPSAobjIsIGNvbnRhaW5lciwgYW5jaG9yLCBuYW1lc3BhY2UpID0+IHtcbiAgICBbbjIuZWwsIG4yLmFuY2hvcl0gPSBob3N0SW5zZXJ0U3RhdGljQ29udGVudChcbiAgICAgIG4yLmNoaWxkcmVuLFxuICAgICAgY29udGFpbmVyLFxuICAgICAgYW5jaG9yLFxuICAgICAgbmFtZXNwYWNlLFxuICAgICAgbjIuZWwsXG4gICAgICBuMi5hbmNob3JcbiAgICApO1xuICB9O1xuICBjb25zdCBwYXRjaFN0YXRpY05vZGUgPSAobjEsIG4yLCBjb250YWluZXIsIG5hbWVzcGFjZSkgPT4ge1xuICAgIGlmIChuMi5jaGlsZHJlbiAhPT0gbjEuY2hpbGRyZW4pIHtcbiAgICAgIGNvbnN0IGFuY2hvciA9IGhvc3ROZXh0U2libGluZyhuMS5hbmNob3IpO1xuICAgICAgcmVtb3ZlU3RhdGljTm9kZShuMSk7XG4gICAgICBbbjIuZWwsIG4yLmFuY2hvcl0gPSBob3N0SW5zZXJ0U3RhdGljQ29udGVudChcbiAgICAgICAgbjIuY2hpbGRyZW4sXG4gICAgICAgIGNvbnRhaW5lcixcbiAgICAgICAgYW5jaG9yLFxuICAgICAgICBuYW1lc3BhY2VcbiAgICAgICk7XG4gICAgfSBlbHNlIHtcbiAgICAgIG4yLmVsID0gbjEuZWw7XG4gICAgICBuMi5hbmNob3IgPSBuMS5hbmNob3I7XG4gICAgfVxuICB9O1xuICBjb25zdCBtb3ZlU3RhdGljTm9kZSA9ICh7IGVsLCBhbmNob3IgfSwgY29udGFpbmVyLCBuZXh0U2libGluZykgPT4ge1xuICAgIGxldCBuZXh0O1xuICAgIHdoaWxlIChlbCAmJiBlbCAhPT0gYW5jaG9yKSB7XG4gICAgICBuZXh0ID0gaG9zdE5leHRTaWJsaW5nKGVsKTtcbiAgICAgIGhvc3RJbnNlcnQoZWwsIGNvbnRhaW5lciwgbmV4dFNpYmxpbmcpO1xuICAgICAgZWwgPSBuZXh0O1xuICAgIH1cbiAgICBob3N0SW5zZXJ0KGFuY2hvciwgY29udGFpbmVyLCBuZXh0U2libGluZyk7XG4gIH07XG4gIGNvbnN0IHJlbW92ZVN0YXRpY05vZGUgPSAoeyBlbCwgYW5jaG9yIH0pID0+IHtcbiAgICBsZXQgbmV4dDtcbiAgICB3aGlsZSAoZWwgJiYgZWwgIT09IGFuY2hvcikge1xuICAgICAgbmV4dCA9IGhvc3ROZXh0U2libGluZyhlbCk7XG4gICAgICBob3N0UmVtb3ZlKGVsKTtcbiAgICAgIGVsID0gbmV4dDtcbiAgICB9XG4gICAgaG9zdFJlbW92ZShhbmNob3IpO1xuICB9O1xuICBjb25zdCBwcm9jZXNzRWxlbWVudCA9IChuMSwgbjIsIGNvbnRhaW5lciwgYW5jaG9yLCBwYXJlbnRDb21wb25lbnQsIHBhcmVudFN1c3BlbnNlLCBuYW1lc3BhY2UsIHNsb3RTY29wZUlkcywgb3B0aW1pemVkKSA9PiB7XG4gICAgaWYgKG4yLnR5cGUgPT09IFwic3ZnXCIpIHtcbiAgICAgIG5hbWVzcGFjZSA9IFwic3ZnXCI7XG4gICAgfSBlbHNlIGlmIChuMi50eXBlID09PSBcIm1hdGhcIikge1xuICAgICAgbmFtZXNwYWNlID0gXCJtYXRobWxcIjtcbiAgICB9XG4gICAgaWYgKG4xID09IG51bGwpIHtcbiAgICAgIG1vdW50RWxlbWVudChcbiAgICAgICAgbjIsXG4gICAgICAgIGNvbnRhaW5lcixcbiAgICAgICAgYW5jaG9yLFxuICAgICAgICBwYXJlbnRDb21wb25lbnQsXG4gICAgICAgIHBhcmVudFN1c3BlbnNlLFxuICAgICAgICBuYW1lc3BhY2UsXG4gICAgICAgIHNsb3RTY29wZUlkcyxcbiAgICAgICAgb3B0aW1pemVkXG4gICAgICApO1xuICAgIH0gZWxzZSB7XG4gICAgICBjb25zdCBjdXN0b21FbGVtZW50ID0gbjEuZWwgJiYgbjEuZWwuX2lzVnVlQ0UgPyBuMS5lbCA6IG51bGw7XG4gICAgICB0cnkge1xuICAgICAgICBpZiAoY3VzdG9tRWxlbWVudCkge1xuICAgICAgICAgIGN1c3RvbUVsZW1lbnQuX2JlZ2luUGF0Y2goKTtcbiAgICAgICAgfVxuICAgICAgICBwYXRjaEVsZW1lbnQoXG4gICAgICAgICAgbjEsXG4gICAgICAgICAgbjIsXG4gICAgICAgICAgcGFyZW50Q29tcG9uZW50LFxuICAgICAgICAgIHBhcmVudFN1c3BlbnNlLFxuICAgICAgICAgIG5hbWVzcGFjZSxcbiAgICAgICAgICBzbG90U2NvcGVJZHMsXG4gICAgICAgICAgb3B0aW1pemVkXG4gICAgICAgICk7XG4gICAgICB9IGZpbmFsbHkge1xuICAgICAgICBpZiAoY3VzdG9tRWxlbWVudCkge1xuICAgICAgICAgIGN1c3RvbUVsZW1lbnQuX2VuZFBhdGNoKCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH07XG4gIGNvbnN0IG1vdW50RWxlbWVudCA9ICh2bm9kZSwgY29udGFpbmVyLCBhbmNob3IsIHBhcmVudENvbXBvbmVudCwgcGFyZW50U3VzcGVuc2UsIG5hbWVzcGFjZSwgc2xvdFNjb3BlSWRzLCBvcHRpbWl6ZWQpID0+IHtcbiAgICBsZXQgZWw7XG4gICAgbGV0IHZub2RlSG9vaztcbiAgICBjb25zdCB7IHByb3BzLCBzaGFwZUZsYWcsIHRyYW5zaXRpb24sIGRpcnMgfSA9IHZub2RlO1xuICAgIGVsID0gdm5vZGUuZWwgPSBob3N0Q3JlYXRlRWxlbWVudChcbiAgICAgIHZub2RlLnR5cGUsXG4gICAgICBuYW1lc3BhY2UsXG4gICAgICBwcm9wcyAmJiBwcm9wcy5pcyxcbiAgICAgIHByb3BzXG4gICAgKTtcbiAgICBpZiAoc2hhcGVGbGFnICYgOCkge1xuICAgICAgaG9zdFNldEVsZW1lbnRUZXh0KGVsLCB2bm9kZS5jaGlsZHJlbik7XG4gICAgfSBlbHNlIGlmIChzaGFwZUZsYWcgJiAxNikge1xuICAgICAgbW91bnRDaGlsZHJlbihcbiAgICAgICAgdm5vZGUuY2hpbGRyZW4sXG4gICAgICAgIGVsLFxuICAgICAgICBudWxsLFxuICAgICAgICBwYXJlbnRDb21wb25lbnQsXG4gICAgICAgIHBhcmVudFN1c3BlbnNlLFxuICAgICAgICByZXNvbHZlQ2hpbGRyZW5OYW1lc3BhY2Uodm5vZGUsIG5hbWVzcGFjZSksXG4gICAgICAgIHNsb3RTY29wZUlkcyxcbiAgICAgICAgb3B0aW1pemVkXG4gICAgICApO1xuICAgIH1cbiAgICBpZiAoZGlycykge1xuICAgICAgaW52b2tlRGlyZWN0aXZlSG9vayh2bm9kZSwgbnVsbCwgcGFyZW50Q29tcG9uZW50LCBcImNyZWF0ZWRcIik7XG4gICAgfVxuICAgIHNldFNjb3BlSWQoZWwsIHZub2RlLCB2bm9kZS5zY29wZUlkLCBzbG90U2NvcGVJZHMsIHBhcmVudENvbXBvbmVudCk7XG4gICAgaWYgKHByb3BzKSB7XG4gICAgICBmb3IgKGNvbnN0IGtleSBpbiBwcm9wcykge1xuICAgICAgICBpZiAoa2V5ICE9PSBcInZhbHVlXCIgJiYgIWlzUmVzZXJ2ZWRQcm9wKGtleSkpIHtcbiAgICAgICAgICBob3N0UGF0Y2hQcm9wKGVsLCBrZXksIG51bGwsIHByb3BzW2tleV0sIG5hbWVzcGFjZSwgcGFyZW50Q29tcG9uZW50KTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgaWYgKFwidmFsdWVcIiBpbiBwcm9wcykge1xuICAgICAgICBob3N0UGF0Y2hQcm9wKGVsLCBcInZhbHVlXCIsIG51bGwsIHByb3BzLnZhbHVlLCBuYW1lc3BhY2UpO1xuICAgICAgfVxuICAgICAgaWYgKHZub2RlSG9vayA9IHByb3BzLm9uVm5vZGVCZWZvcmVNb3VudCkge1xuICAgICAgICBpbnZva2VWTm9kZUhvb2sodm5vZGVIb29rLCBwYXJlbnRDb21wb25lbnQsIHZub2RlKTtcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKCEhKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSBcInByb2R1Y3Rpb25cIikgfHwgX19WVUVfUFJPRF9ERVZUT09MU19fKSB7XG4gICAgICBkZWYoZWwsIFwiX192bm9kZVwiLCB2bm9kZSwgdHJ1ZSk7XG4gICAgICBkZWYoZWwsIFwiX192dWVQYXJlbnRDb21wb25lbnRcIiwgcGFyZW50Q29tcG9uZW50LCB0cnVlKTtcbiAgICB9XG4gICAgaWYgKGRpcnMpIHtcbiAgICAgIGludm9rZURpcmVjdGl2ZUhvb2sodm5vZGUsIG51bGwsIHBhcmVudENvbXBvbmVudCwgXCJiZWZvcmVNb3VudFwiKTtcbiAgICB9XG4gICAgY29uc3QgbmVlZENhbGxUcmFuc2l0aW9uSG9va3MgPSBuZWVkVHJhbnNpdGlvbihwYXJlbnRTdXNwZW5zZSwgdHJhbnNpdGlvbik7XG4gICAgaWYgKG5lZWRDYWxsVHJhbnNpdGlvbkhvb2tzKSB7XG4gICAgICB0cmFuc2l0aW9uLmJlZm9yZUVudGVyKGVsKTtcbiAgICB9XG4gICAgaG9zdEluc2VydChlbCwgY29udGFpbmVyLCBhbmNob3IpO1xuICAgIGlmICgodm5vZGVIb29rID0gcHJvcHMgJiYgcHJvcHMub25Wbm9kZU1vdW50ZWQpIHx8IG5lZWRDYWxsVHJhbnNpdGlvbkhvb2tzIHx8IGRpcnMpIHtcbiAgICAgIHF1ZXVlUG9zdFJlbmRlckVmZmVjdCgoKSA9PiB7XG4gICAgICAgIHZub2RlSG9vayAmJiBpbnZva2VWTm9kZUhvb2sodm5vZGVIb29rLCBwYXJlbnRDb21wb25lbnQsIHZub2RlKTtcbiAgICAgICAgbmVlZENhbGxUcmFuc2l0aW9uSG9va3MgJiYgdHJhbnNpdGlvbi5lbnRlcihlbCk7XG4gICAgICAgIGRpcnMgJiYgaW52b2tlRGlyZWN0aXZlSG9vayh2bm9kZSwgbnVsbCwgcGFyZW50Q29tcG9uZW50LCBcIm1vdW50ZWRcIik7XG4gICAgICB9LCBwYXJlbnRTdXNwZW5zZSk7XG4gICAgfVxuICB9O1xuICBjb25zdCBzZXRTY29wZUlkID0gKGVsLCB2bm9kZSwgc2NvcGVJZCwgc2xvdFNjb3BlSWRzLCBwYXJlbnRDb21wb25lbnQpID0+IHtcbiAgICBpZiAoc2NvcGVJZCkge1xuICAgICAgaG9zdFNldFNjb3BlSWQoZWwsIHNjb3BlSWQpO1xuICAgIH1cbiAgICBpZiAoc2xvdFNjb3BlSWRzKSB7XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHNsb3RTY29wZUlkcy5sZW5ndGg7IGkrKykge1xuICAgICAgICBob3N0U2V0U2NvcGVJZChlbCwgc2xvdFNjb3BlSWRzW2ldKTtcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKHBhcmVudENvbXBvbmVudCkge1xuICAgICAgbGV0IHN1YlRyZWUgPSBwYXJlbnRDb21wb25lbnQuc3ViVHJlZTtcbiAgICAgIGlmICghIShwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gXCJwcm9kdWN0aW9uXCIpICYmIHN1YlRyZWUucGF0Y2hGbGFnID4gMCAmJiBzdWJUcmVlLnBhdGNoRmxhZyAmIDIwNDgpIHtcbiAgICAgICAgc3ViVHJlZSA9IGZpbHRlclNpbmdsZVJvb3Qoc3ViVHJlZS5jaGlsZHJlbikgfHwgc3ViVHJlZTtcbiAgICAgIH1cbiAgICAgIGlmICh2bm9kZSA9PT0gc3ViVHJlZSB8fCBpc1N1c3BlbnNlKHN1YlRyZWUudHlwZSkgJiYgKHN1YlRyZWUuc3NDb250ZW50ID09PSB2bm9kZSB8fCBzdWJUcmVlLnNzRmFsbGJhY2sgPT09IHZub2RlKSkge1xuICAgICAgICBjb25zdCBwYXJlbnRWTm9kZSA9IHBhcmVudENvbXBvbmVudC52bm9kZTtcbiAgICAgICAgc2V0U2NvcGVJZChcbiAgICAgICAgICBlbCxcbiAgICAgICAgICBwYXJlbnRWTm9kZSxcbiAgICAgICAgICBwYXJlbnRWTm9kZS5zY29wZUlkLFxuICAgICAgICAgIHBhcmVudFZOb2RlLnNsb3RTY29wZUlkcyxcbiAgICAgICAgICBwYXJlbnRDb21wb25lbnQucGFyZW50XG4gICAgICAgICk7XG4gICAgICB9XG4gICAgfVxuICB9O1xuICBjb25zdCBtb3VudENoaWxkcmVuID0gKGNoaWxkcmVuLCBjb250YWluZXIsIGFuY2hvciwgcGFyZW50Q29tcG9uZW50LCBwYXJlbnRTdXNwZW5zZSwgbmFtZXNwYWNlLCBzbG90U2NvcGVJZHMsIG9wdGltaXplZCwgc3RhcnQgPSAwKSA9PiB7XG4gICAgZm9yIChsZXQgaSA9IHN0YXJ0OyBpIDwgY2hpbGRyZW4ubGVuZ3RoOyBpKyspIHtcbiAgICAgIGNvbnN0IGNoaWxkID0gY2hpbGRyZW5baV0gPSBvcHRpbWl6ZWQgPyBjbG9uZUlmTW91bnRlZChjaGlsZHJlbltpXSkgOiBub3JtYWxpemVWTm9kZShjaGlsZHJlbltpXSk7XG4gICAgICBwYXRjaChcbiAgICAgICAgbnVsbCxcbiAgICAgICAgY2hpbGQsXG4gICAgICAgIGNvbnRhaW5lcixcbiAgICAgICAgYW5jaG9yLFxuICAgICAgICBwYXJlbnRDb21wb25lbnQsXG4gICAgICAgIHBhcmVudFN1c3BlbnNlLFxuICAgICAgICBuYW1lc3BhY2UsXG4gICAgICAgIHNsb3RTY29wZUlkcyxcbiAgICAgICAgb3B0aW1pemVkXG4gICAgICApO1xuICAgIH1cbiAgfTtcbiAgY29uc3QgcGF0Y2hFbGVtZW50ID0gKG4xLCBuMiwgcGFyZW50Q29tcG9uZW50LCBwYXJlbnRTdXNwZW5zZSwgbmFtZXNwYWNlLCBzbG90U2NvcGVJZHMsIG9wdGltaXplZCkgPT4ge1xuICAgIGNvbnN0IGVsID0gbjIuZWwgPSBuMS5lbDtcbiAgICBpZiAoISEocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09IFwicHJvZHVjdGlvblwiKSB8fCBfX1ZVRV9QUk9EX0RFVlRPT0xTX18pIHtcbiAgICAgIGVsLl9fdm5vZGUgPSBuMjtcbiAgICB9XG4gICAgbGV0IHsgcGF0Y2hGbGFnLCBkeW5hbWljQ2hpbGRyZW4sIGRpcnMgfSA9IG4yO1xuICAgIHBhdGNoRmxhZyB8PSBuMS5wYXRjaEZsYWcgJiAxNjtcbiAgICBjb25zdCBvbGRQcm9wcyA9IG4xLnByb3BzIHx8IEVNUFRZX09CSjtcbiAgICBjb25zdCBuZXdQcm9wcyA9IG4yLnByb3BzIHx8IEVNUFRZX09CSjtcbiAgICBsZXQgdm5vZGVIb29rO1xuICAgIHBhcmVudENvbXBvbmVudCAmJiB0b2dnbGVSZWN1cnNlKHBhcmVudENvbXBvbmVudCwgZmFsc2UpO1xuICAgIGlmICh2bm9kZUhvb2sgPSBuZXdQcm9wcy5vblZub2RlQmVmb3JlVXBkYXRlKSB7XG4gICAgICBpbnZva2VWTm9kZUhvb2sodm5vZGVIb29rLCBwYXJlbnRDb21wb25lbnQsIG4yLCBuMSk7XG4gICAgfVxuICAgIGlmIChkaXJzKSB7XG4gICAgICBpbnZva2VEaXJlY3RpdmVIb29rKG4yLCBuMSwgcGFyZW50Q29tcG9uZW50LCBcImJlZm9yZVVwZGF0ZVwiKTtcbiAgICB9XG4gICAgcGFyZW50Q29tcG9uZW50ICYmIHRvZ2dsZVJlY3Vyc2UocGFyZW50Q29tcG9uZW50LCB0cnVlKTtcbiAgICBpZiAoISEocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09IFwicHJvZHVjdGlvblwiKSAmJiBpc0htclVwZGF0aW5nKSB7XG4gICAgICBwYXRjaEZsYWcgPSAwO1xuICAgICAgb3B0aW1pemVkID0gZmFsc2U7XG4gICAgICBkeW5hbWljQ2hpbGRyZW4gPSBudWxsO1xuICAgIH1cbiAgICBpZiAob2xkUHJvcHMuaW5uZXJIVE1MICYmIG5ld1Byb3BzLmlubmVySFRNTCA9PSBudWxsIHx8IG9sZFByb3BzLnRleHRDb250ZW50ICYmIG5ld1Byb3BzLnRleHRDb250ZW50ID09IG51bGwpIHtcbiAgICAgIGhvc3RTZXRFbGVtZW50VGV4dChlbCwgXCJcIik7XG4gICAgfVxuICAgIGlmIChkeW5hbWljQ2hpbGRyZW4pIHtcbiAgICAgIHBhdGNoQmxvY2tDaGlsZHJlbihcbiAgICAgICAgbjEuZHluYW1pY0NoaWxkcmVuLFxuICAgICAgICBkeW5hbWljQ2hpbGRyZW4sXG4gICAgICAgIGVsLFxuICAgICAgICBwYXJlbnRDb21wb25lbnQsXG4gICAgICAgIHBhcmVudFN1c3BlbnNlLFxuICAgICAgICByZXNvbHZlQ2hpbGRyZW5OYW1lc3BhY2UobjIsIG5hbWVzcGFjZSksXG4gICAgICAgIHNsb3RTY29wZUlkc1xuICAgICAgKTtcbiAgICAgIGlmICghIShwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gXCJwcm9kdWN0aW9uXCIpKSB7XG4gICAgICAgIHRyYXZlcnNlU3RhdGljQ2hpbGRyZW4objEsIG4yKTtcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKCFvcHRpbWl6ZWQpIHtcbiAgICAgIHBhdGNoQ2hpbGRyZW4oXG4gICAgICAgIG4xLFxuICAgICAgICBuMixcbiAgICAgICAgZWwsXG4gICAgICAgIG51bGwsXG4gICAgICAgIHBhcmVudENvbXBvbmVudCxcbiAgICAgICAgcGFyZW50U3VzcGVuc2UsXG4gICAgICAgIHJlc29sdmVDaGlsZHJlbk5hbWVzcGFjZShuMiwgbmFtZXNwYWNlKSxcbiAgICAgICAgc2xvdFNjb3BlSWRzLFxuICAgICAgICBmYWxzZVxuICAgICAgKTtcbiAgICB9XG4gICAgaWYgKHBhdGNoRmxhZyA+IDApIHtcbiAgICAgIGlmIChwYXRjaEZsYWcgJiAxNikge1xuICAgICAgICBwYXRjaFByb3BzKGVsLCBvbGRQcm9wcywgbmV3UHJvcHMsIHBhcmVudENvbXBvbmVudCwgbmFtZXNwYWNlKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGlmIChwYXRjaEZsYWcgJiAyKSB7XG4gICAgICAgICAgaWYgKG9sZFByb3BzLmNsYXNzICE9PSBuZXdQcm9wcy5jbGFzcykge1xuICAgICAgICAgICAgaG9zdFBhdGNoUHJvcChlbCwgXCJjbGFzc1wiLCBudWxsLCBuZXdQcm9wcy5jbGFzcywgbmFtZXNwYWNlKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHBhdGNoRmxhZyAmIDQpIHtcbiAgICAgICAgICBob3N0UGF0Y2hQcm9wKGVsLCBcInN0eWxlXCIsIG9sZFByb3BzLnN0eWxlLCBuZXdQcm9wcy5zdHlsZSwgbmFtZXNwYWNlKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAocGF0Y2hGbGFnICYgOCkge1xuICAgICAgICAgIGNvbnN0IHByb3BzVG9VcGRhdGUgPSBuMi5keW5hbWljUHJvcHM7XG4gICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBwcm9wc1RvVXBkYXRlLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBjb25zdCBrZXkgPSBwcm9wc1RvVXBkYXRlW2ldO1xuICAgICAgICAgICAgY29uc3QgcHJldiA9IG9sZFByb3BzW2tleV07XG4gICAgICAgICAgICBjb25zdCBuZXh0ID0gbmV3UHJvcHNba2V5XTtcbiAgICAgICAgICAgIGlmIChuZXh0ICE9PSBwcmV2IHx8IGtleSA9PT0gXCJ2YWx1ZVwiKSB7XG4gICAgICAgICAgICAgIGhvc3RQYXRjaFByb3AoZWwsIGtleSwgcHJldiwgbmV4dCwgbmFtZXNwYWNlLCBwYXJlbnRDb21wb25lbnQpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgaWYgKHBhdGNoRmxhZyAmIDEpIHtcbiAgICAgICAgaWYgKG4xLmNoaWxkcmVuICE9PSBuMi5jaGlsZHJlbikge1xuICAgICAgICAgIGhvc3RTZXRFbGVtZW50VGV4dChlbCwgbjIuY2hpbGRyZW4pO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSBlbHNlIGlmICghb3B0aW1pemVkICYmIGR5bmFtaWNDaGlsZHJlbiA9PSBudWxsKSB7XG4gICAgICBwYXRjaFByb3BzKGVsLCBvbGRQcm9wcywgbmV3UHJvcHMsIHBhcmVudENvbXBvbmVudCwgbmFtZXNwYWNlKTtcbiAgICB9XG4gICAgaWYgKCh2bm9kZUhvb2sgPSBuZXdQcm9wcy5vblZub2RlVXBkYXRlZCkgfHwgZGlycykge1xuICAgICAgcXVldWVQb3N0UmVuZGVyRWZmZWN0KCgpID0+IHtcbiAgICAgICAgdm5vZGVIb29rICYmIGludm9rZVZOb2RlSG9vayh2bm9kZUhvb2ssIHBhcmVudENvbXBvbmVudCwgbjIsIG4xKTtcbiAgICAgICAgZGlycyAmJiBpbnZva2VEaXJlY3RpdmVIb29rKG4yLCBuMSwgcGFyZW50Q29tcG9uZW50LCBcInVwZGF0ZWRcIik7XG4gICAgICB9LCBwYXJlbnRTdXNwZW5zZSk7XG4gICAgfVxuICB9O1xuICBjb25zdCBwYXRjaEJsb2NrQ2hpbGRyZW4gPSAob2xkQ2hpbGRyZW4sIG5ld0NoaWxkcmVuLCBmYWxsYmFja0NvbnRhaW5lciwgcGFyZW50Q29tcG9uZW50LCBwYXJlbnRTdXNwZW5zZSwgbmFtZXNwYWNlLCBzbG90U2NvcGVJZHMpID0+IHtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IG5ld0NoaWxkcmVuLmxlbmd0aDsgaSsrKSB7XG4gICAgICBjb25zdCBvbGRWTm9kZSA9IG9sZENoaWxkcmVuW2ldO1xuICAgICAgY29uc3QgbmV3Vk5vZGUgPSBuZXdDaGlsZHJlbltpXTtcbiAgICAgIGNvbnN0IGNvbnRhaW5lciA9IChcbiAgICAgICAgLy8gb2xkVk5vZGUgbWF5IGJlIGFuIGVycm9yZWQgYXN5bmMgc2V0dXAoKSBjb21wb25lbnQgaW5zaWRlIFN1c3BlbnNlXG4gICAgICAgIC8vIHdoaWNoIHdpbGwgbm90IGhhdmUgYSBtb3VudGVkIGVsZW1lbnRcbiAgICAgICAgb2xkVk5vZGUuZWwgJiYgLy8gLSBJbiB0aGUgY2FzZSBvZiBhIEZyYWdtZW50LCB3ZSBuZWVkIHRvIHByb3ZpZGUgdGhlIGFjdHVhbCBwYXJlbnRcbiAgICAgICAgLy8gb2YgdGhlIEZyYWdtZW50IGl0c2VsZiBzbyBpdCBjYW4gbW92ZSBpdHMgY2hpbGRyZW4uXG4gICAgICAgIChvbGRWTm9kZS50eXBlID09PSBGcmFnbWVudCB8fCAvLyAtIEluIHRoZSBjYXNlIG9mIGRpZmZlcmVudCBub2RlcywgdGhlcmUgaXMgZ29pbmcgdG8gYmUgYSByZXBsYWNlbWVudFxuICAgICAgICAvLyB3aGljaCBhbHNvIHJlcXVpcmVzIHRoZSBjb3JyZWN0IHBhcmVudCBjb250YWluZXJcbiAgICAgICAgIWlzU2FtZVZOb2RlVHlwZShvbGRWTm9kZSwgbmV3Vk5vZGUpIHx8IC8vIC0gSW4gdGhlIGNhc2Ugb2YgYSBjb21wb25lbnQsIGl0IGNvdWxkIGNvbnRhaW4gYW55dGhpbmcuXG4gICAgICAgIG9sZFZOb2RlLnNoYXBlRmxhZyAmICg2IHwgNjQgfCAxMjgpKSA/IGhvc3RQYXJlbnROb2RlKG9sZFZOb2RlLmVsKSA6IChcbiAgICAgICAgICAvLyBJbiBvdGhlciBjYXNlcywgdGhlIHBhcmVudCBjb250YWluZXIgaXMgbm90IGFjdHVhbGx5IHVzZWQgc28gd2VcbiAgICAgICAgICAvLyBqdXN0IHBhc3MgdGhlIGJsb2NrIGVsZW1lbnQgaGVyZSB0byBhdm9pZCBhIERPTSBwYXJlbnROb2RlIGNhbGwuXG4gICAgICAgICAgZmFsbGJhY2tDb250YWluZXJcbiAgICAgICAgKVxuICAgICAgKTtcbiAgICAgIHBhdGNoKFxuICAgICAgICBvbGRWTm9kZSxcbiAgICAgICAgbmV3Vk5vZGUsXG4gICAgICAgIGNvbnRhaW5lcixcbiAgICAgICAgbnVsbCxcbiAgICAgICAgcGFyZW50Q29tcG9uZW50LFxuICAgICAgICBwYXJlbnRTdXNwZW5zZSxcbiAgICAgICAgbmFtZXNwYWNlLFxuICAgICAgICBzbG90U2NvcGVJZHMsXG4gICAgICAgIHRydWVcbiAgICAgICk7XG4gICAgfVxuICB9O1xuICBjb25zdCBwYXRjaFByb3BzID0gKGVsLCBvbGRQcm9wcywgbmV3UHJvcHMsIHBhcmVudENvbXBvbmVudCwgbmFtZXNwYWNlKSA9PiB7XG4gICAgaWYgKG9sZFByb3BzICE9PSBuZXdQcm9wcykge1xuICAgICAgaWYgKG9sZFByb3BzICE9PSBFTVBUWV9PQkopIHtcbiAgICAgICAgZm9yIChjb25zdCBrZXkgaW4gb2xkUHJvcHMpIHtcbiAgICAgICAgICBpZiAoIWlzUmVzZXJ2ZWRQcm9wKGtleSkgJiYgIShrZXkgaW4gbmV3UHJvcHMpKSB7XG4gICAgICAgICAgICBob3N0UGF0Y2hQcm9wKFxuICAgICAgICAgICAgICBlbCxcbiAgICAgICAgICAgICAga2V5LFxuICAgICAgICAgICAgICBvbGRQcm9wc1trZXldLFxuICAgICAgICAgICAgICBudWxsLFxuICAgICAgICAgICAgICBuYW1lc3BhY2UsXG4gICAgICAgICAgICAgIHBhcmVudENvbXBvbmVudFxuICAgICAgICAgICAgKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGZvciAoY29uc3Qga2V5IGluIG5ld1Byb3BzKSB7XG4gICAgICAgIGlmIChpc1Jlc2VydmVkUHJvcChrZXkpKSBjb250aW51ZTtcbiAgICAgICAgY29uc3QgbmV4dCA9IG5ld1Byb3BzW2tleV07XG4gICAgICAgIGNvbnN0IHByZXYgPSBvbGRQcm9wc1trZXldO1xuICAgICAgICBpZiAobmV4dCAhPT0gcHJldiAmJiBrZXkgIT09IFwidmFsdWVcIikge1xuICAgICAgICAgIGhvc3RQYXRjaFByb3AoZWwsIGtleSwgcHJldiwgbmV4dCwgbmFtZXNwYWNlLCBwYXJlbnRDb21wb25lbnQpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBpZiAoXCJ2YWx1ZVwiIGluIG5ld1Byb3BzKSB7XG4gICAgICAgIGhvc3RQYXRjaFByb3AoZWwsIFwidmFsdWVcIiwgb2xkUHJvcHMudmFsdWUsIG5ld1Byb3BzLnZhbHVlLCBuYW1lc3BhY2UpO1xuICAgICAgfVxuICAgIH1cbiAgfTtcbiAgY29uc3QgcHJvY2Vzc0ZyYWdtZW50ID0gKG4xLCBuMiwgY29udGFpbmVyLCBhbmNob3IsIHBhcmVudENvbXBvbmVudCwgcGFyZW50U3VzcGVuc2UsIG5hbWVzcGFjZSwgc2xvdFNjb3BlSWRzLCBvcHRpbWl6ZWQpID0+IHtcbiAgICBjb25zdCBmcmFnbWVudFN0YXJ0QW5jaG9yID0gbjIuZWwgPSBuMSA/IG4xLmVsIDogaG9zdENyZWF0ZVRleHQoXCJcIik7XG4gICAgY29uc3QgZnJhZ21lbnRFbmRBbmNob3IgPSBuMi5hbmNob3IgPSBuMSA/IG4xLmFuY2hvciA6IGhvc3RDcmVhdGVUZXh0KFwiXCIpO1xuICAgIGxldCB7IHBhdGNoRmxhZywgZHluYW1pY0NoaWxkcmVuLCBzbG90U2NvcGVJZHM6IGZyYWdtZW50U2xvdFNjb3BlSWRzIH0gPSBuMjtcbiAgICBpZiAoISEocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09IFwicHJvZHVjdGlvblwiKSAmJiAvLyAjNTUyMyBkZXYgcm9vdCBmcmFnbWVudCBtYXkgaW5oZXJpdCBkaXJlY3RpdmVzXG4gICAgKGlzSG1yVXBkYXRpbmcgfHwgcGF0Y2hGbGFnICYgMjA0OCkpIHtcbiAgICAgIHBhdGNoRmxhZyA9IDA7XG4gICAgICBvcHRpbWl6ZWQgPSBmYWxzZTtcbiAgICAgIGR5bmFtaWNDaGlsZHJlbiA9IG51bGw7XG4gICAgfVxuICAgIGlmIChmcmFnbWVudFNsb3RTY29wZUlkcykge1xuICAgICAgc2xvdFNjb3BlSWRzID0gc2xvdFNjb3BlSWRzID8gc2xvdFNjb3BlSWRzLmNvbmNhdChmcmFnbWVudFNsb3RTY29wZUlkcykgOiBmcmFnbWVudFNsb3RTY29wZUlkcztcbiAgICB9XG4gICAgaWYgKG4xID09IG51bGwpIHtcbiAgICAgIGhvc3RJbnNlcnQoZnJhZ21lbnRTdGFydEFuY2hvciwgY29udGFpbmVyLCBhbmNob3IpO1xuICAgICAgaG9zdEluc2VydChmcmFnbWVudEVuZEFuY2hvciwgY29udGFpbmVyLCBhbmNob3IpO1xuICAgICAgbW91bnRDaGlsZHJlbihcbiAgICAgICAgLy8gIzEwMDA3XG4gICAgICAgIC8vIHN1Y2ggZnJhZ21lbnQgbGlrZSBgPD48Lz5gIHdpbGwgYmUgY29tcGlsZWQgaW50b1xuICAgICAgICAvLyBhIGZyYWdtZW50IHdoaWNoIGRvZXNuJ3QgaGF2ZSBhIGNoaWxkcmVuLlxuICAgICAgICAvLyBJbiB0aGlzIGNhc2UgZmFsbGJhY2sgdG8gYW4gZW1wdHkgYXJyYXlcbiAgICAgICAgbjIuY2hpbGRyZW4gfHwgW10sXG4gICAgICAgIGNvbnRhaW5lcixcbiAgICAgICAgZnJhZ21lbnRFbmRBbmNob3IsXG4gICAgICAgIHBhcmVudENvbXBvbmVudCxcbiAgICAgICAgcGFyZW50U3VzcGVuc2UsXG4gICAgICAgIG5hbWVzcGFjZSxcbiAgICAgICAgc2xvdFNjb3BlSWRzLFxuICAgICAgICBvcHRpbWl6ZWRcbiAgICAgICk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGlmIChwYXRjaEZsYWcgPiAwICYmIHBhdGNoRmxhZyAmIDY0ICYmIGR5bmFtaWNDaGlsZHJlbiAmJiAvLyAjMjcxNSB0aGUgcHJldmlvdXMgZnJhZ21lbnQgY291bGQndmUgYmVlbiBhIEJBSUxlZCBvbmUgYXMgYSByZXN1bHRcbiAgICAgIC8vIG9mIHJlbmRlclNsb3QoKSB3aXRoIG5vIHZhbGlkIGNoaWxkcmVuXG4gICAgICBuMS5keW5hbWljQ2hpbGRyZW4gJiYgbjEuZHluYW1pY0NoaWxkcmVuLmxlbmd0aCA9PT0gZHluYW1pY0NoaWxkcmVuLmxlbmd0aCkge1xuICAgICAgICBwYXRjaEJsb2NrQ2hpbGRyZW4oXG4gICAgICAgICAgbjEuZHluYW1pY0NoaWxkcmVuLFxuICAgICAgICAgIGR5bmFtaWNDaGlsZHJlbixcbiAgICAgICAgICBjb250YWluZXIsXG4gICAgICAgICAgcGFyZW50Q29tcG9uZW50LFxuICAgICAgICAgIHBhcmVudFN1c3BlbnNlLFxuICAgICAgICAgIG5hbWVzcGFjZSxcbiAgICAgICAgICBzbG90U2NvcGVJZHNcbiAgICAgICAgKTtcbiAgICAgICAgaWYgKCEhKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSBcInByb2R1Y3Rpb25cIikpIHtcbiAgICAgICAgICB0cmF2ZXJzZVN0YXRpY0NoaWxkcmVuKG4xLCBuMik7XG4gICAgICAgIH0gZWxzZSBpZiAoXG4gICAgICAgICAgLy8gIzIwODAgaWYgdGhlIHN0YWJsZSBmcmFnbWVudCBoYXMgYSBrZXksIGl0J3MgYSA8dGVtcGxhdGUgdi1mb3I+IHRoYXQgbWF5XG4gICAgICAgICAgLy8gIGdldCBtb3ZlZCBhcm91bmQuIE1ha2Ugc3VyZSBhbGwgcm9vdCBsZXZlbCB2bm9kZXMgaW5oZXJpdCBlbC5cbiAgICAgICAgICAvLyAjMjEzNCBvciBpZiBpdCdzIGEgY29tcG9uZW50IHJvb3QsIGl0IG1heSBhbHNvIGdldCBtb3ZlZCBhcm91bmRcbiAgICAgICAgICAvLyBhcyB0aGUgY29tcG9uZW50IGlzIGJlaW5nIG1vdmVkLlxuICAgICAgICAgIG4yLmtleSAhPSBudWxsIHx8IHBhcmVudENvbXBvbmVudCAmJiBuMiA9PT0gcGFyZW50Q29tcG9uZW50LnN1YlRyZWVcbiAgICAgICAgKSB7XG4gICAgICAgICAgdHJhdmVyc2VTdGF0aWNDaGlsZHJlbihcbiAgICAgICAgICAgIG4xLFxuICAgICAgICAgICAgbjIsXG4gICAgICAgICAgICB0cnVlXG4gICAgICAgICAgICAvKiBzaGFsbG93ICovXG4gICAgICAgICAgKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcGF0Y2hDaGlsZHJlbihcbiAgICAgICAgICBuMSxcbiAgICAgICAgICBuMixcbiAgICAgICAgICBjb250YWluZXIsXG4gICAgICAgICAgZnJhZ21lbnRFbmRBbmNob3IsXG4gICAgICAgICAgcGFyZW50Q29tcG9uZW50LFxuICAgICAgICAgIHBhcmVudFN1c3BlbnNlLFxuICAgICAgICAgIG5hbWVzcGFjZSxcbiAgICAgICAgICBzbG90U2NvcGVJZHMsXG4gICAgICAgICAgb3B0aW1pemVkXG4gICAgICAgICk7XG4gICAgICB9XG4gICAgfVxuICB9O1xuICBjb25zdCBwcm9jZXNzQ29tcG9uZW50ID0gKG4xLCBuMiwgY29udGFpbmVyLCBhbmNob3IsIHBhcmVudENvbXBvbmVudCwgcGFyZW50U3VzcGVuc2UsIG5hbWVzcGFjZSwgc2xvdFNjb3BlSWRzLCBvcHRpbWl6ZWQpID0+IHtcbiAgICBuMi5zbG90U2NvcGVJZHMgPSBzbG90U2NvcGVJZHM7XG4gICAgaWYgKG4xID09IG51bGwpIHtcbiAgICAgIGlmIChuMi5zaGFwZUZsYWcgJiA1MTIpIHtcbiAgICAgICAgcGFyZW50Q29tcG9uZW50LmN0eC5hY3RpdmF0ZShcbiAgICAgICAgICBuMixcbiAgICAgICAgICBjb250YWluZXIsXG4gICAgICAgICAgYW5jaG9yLFxuICAgICAgICAgIG5hbWVzcGFjZSxcbiAgICAgICAgICBvcHRpbWl6ZWRcbiAgICAgICAgKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIG1vdW50Q29tcG9uZW50KFxuICAgICAgICAgIG4yLFxuICAgICAgICAgIGNvbnRhaW5lcixcbiAgICAgICAgICBhbmNob3IsXG4gICAgICAgICAgcGFyZW50Q29tcG9uZW50LFxuICAgICAgICAgIHBhcmVudFN1c3BlbnNlLFxuICAgICAgICAgIG5hbWVzcGFjZSxcbiAgICAgICAgICBvcHRpbWl6ZWRcbiAgICAgICAgKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgdXBkYXRlQ29tcG9uZW50KG4xLCBuMiwgb3B0aW1pemVkKTtcbiAgICB9XG4gIH07XG4gIGNvbnN0IG1vdW50Q29tcG9uZW50ID0gKGluaXRpYWxWTm9kZSwgY29udGFpbmVyLCBhbmNob3IsIHBhcmVudENvbXBvbmVudCwgcGFyZW50U3VzcGVuc2UsIG5hbWVzcGFjZSwgb3B0aW1pemVkKSA9PiB7XG4gICAgY29uc3QgaW5zdGFuY2UgPSAoaW5pdGlhbFZOb2RlLmNvbXBvbmVudCA9IGNyZWF0ZUNvbXBvbmVudEluc3RhbmNlKFxuICAgICAgaW5pdGlhbFZOb2RlLFxuICAgICAgcGFyZW50Q29tcG9uZW50LFxuICAgICAgcGFyZW50U3VzcGVuc2VcbiAgICApKTtcbiAgICBpZiAoISEocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09IFwicHJvZHVjdGlvblwiKSAmJiBpbnN0YW5jZS50eXBlLl9faG1ySWQpIHtcbiAgICAgIHJlZ2lzdGVySE1SKGluc3RhbmNlKTtcbiAgICB9XG4gICAgaWYgKCEhKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSBcInByb2R1Y3Rpb25cIikpIHtcbiAgICAgIHB1c2hXYXJuaW5nQ29udGV4dChpbml0aWFsVk5vZGUpO1xuICAgICAgc3RhcnRNZWFzdXJlKGluc3RhbmNlLCBgbW91bnRgKTtcbiAgICB9XG4gICAgaWYgKGlzS2VlcEFsaXZlKGluaXRpYWxWTm9kZSkpIHtcbiAgICAgIGluc3RhbmNlLmN0eC5yZW5kZXJlciA9IGludGVybmFscztcbiAgICB9XG4gICAge1xuICAgICAgaWYgKCEhKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSBcInByb2R1Y3Rpb25cIikpIHtcbiAgICAgICAgc3RhcnRNZWFzdXJlKGluc3RhbmNlLCBgaW5pdGApO1xuICAgICAgfVxuICAgICAgc2V0dXBDb21wb25lbnQoaW5zdGFuY2UsIGZhbHNlLCBvcHRpbWl6ZWQpO1xuICAgICAgaWYgKCEhKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSBcInByb2R1Y3Rpb25cIikpIHtcbiAgICAgICAgZW5kTWVhc3VyZShpbnN0YW5jZSwgYGluaXRgKTtcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKCEhKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSBcInByb2R1Y3Rpb25cIikgJiYgaXNIbXJVcGRhdGluZykgaW5pdGlhbFZOb2RlLmVsID0gbnVsbDtcbiAgICBpZiAoaW5zdGFuY2UuYXN5bmNEZXApIHtcbiAgICAgIHBhcmVudFN1c3BlbnNlICYmIHBhcmVudFN1c3BlbnNlLnJlZ2lzdGVyRGVwKGluc3RhbmNlLCBzZXR1cFJlbmRlckVmZmVjdCwgb3B0aW1pemVkKTtcbiAgICAgIGlmICghaW5pdGlhbFZOb2RlLmVsKSB7XG4gICAgICAgIGNvbnN0IHBsYWNlaG9sZGVyID0gaW5zdGFuY2Uuc3ViVHJlZSA9IGNyZWF0ZVZOb2RlKENvbW1lbnQpO1xuICAgICAgICBwcm9jZXNzQ29tbWVudE5vZGUobnVsbCwgcGxhY2Vob2xkZXIsIGNvbnRhaW5lciwgYW5jaG9yKTtcbiAgICAgICAgaW5pdGlhbFZOb2RlLnBsYWNlaG9sZGVyID0gcGxhY2Vob2xkZXIuZWw7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHNldHVwUmVuZGVyRWZmZWN0KFxuICAgICAgICBpbnN0YW5jZSxcbiAgICAgICAgaW5pdGlhbFZOb2RlLFxuICAgICAgICBjb250YWluZXIsXG4gICAgICAgIGFuY2hvcixcbiAgICAgICAgcGFyZW50U3VzcGVuc2UsXG4gICAgICAgIG5hbWVzcGFjZSxcbiAgICAgICAgb3B0aW1pemVkXG4gICAgICApO1xuICAgIH1cbiAgICBpZiAoISEocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09IFwicHJvZHVjdGlvblwiKSkge1xuICAgICAgcG9wV2FybmluZ0NvbnRleHQoKTtcbiAgICAgIGVuZE1lYXN1cmUoaW5zdGFuY2UsIGBtb3VudGApO1xuICAgIH1cbiAgfTtcbiAgY29uc3QgdXBkYXRlQ29tcG9uZW50ID0gKG4xLCBuMiwgb3B0aW1pemVkKSA9PiB7XG4gICAgY29uc3QgaW5zdGFuY2UgPSBuMi5jb21wb25lbnQgPSBuMS5jb21wb25lbnQ7XG4gICAgaWYgKHNob3VsZFVwZGF0ZUNvbXBvbmVudChuMSwgbjIsIG9wdGltaXplZCkpIHtcbiAgICAgIGlmIChpbnN0YW5jZS5hc3luY0RlcCAmJiAhaW5zdGFuY2UuYXN5bmNSZXNvbHZlZCkge1xuICAgICAgICBpZiAoISEocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09IFwicHJvZHVjdGlvblwiKSkge1xuICAgICAgICAgIHB1c2hXYXJuaW5nQ29udGV4dChuMik7XG4gICAgICAgIH1cbiAgICAgICAgdXBkYXRlQ29tcG9uZW50UHJlUmVuZGVyKGluc3RhbmNlLCBuMiwgb3B0aW1pemVkKTtcbiAgICAgICAgaWYgKCEhKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSBcInByb2R1Y3Rpb25cIikpIHtcbiAgICAgICAgICBwb3BXYXJuaW5nQ29udGV4dCgpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybjtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGluc3RhbmNlLm5leHQgPSBuMjtcbiAgICAgICAgaW5zdGFuY2UudXBkYXRlKCk7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIG4yLmVsID0gbjEuZWw7XG4gICAgICBpbnN0YW5jZS52bm9kZSA9IG4yO1xuICAgIH1cbiAgfTtcbiAgY29uc3Qgc2V0dXBSZW5kZXJFZmZlY3QgPSAoaW5zdGFuY2UsIGluaXRpYWxWTm9kZSwgY29udGFpbmVyLCBhbmNob3IsIHBhcmVudFN1c3BlbnNlLCBuYW1lc3BhY2UsIG9wdGltaXplZCkgPT4ge1xuICAgIGNvbnN0IGNvbXBvbmVudFVwZGF0ZUZuID0gKCkgPT4ge1xuICAgICAgaWYgKCFpbnN0YW5jZS5pc01vdW50ZWQpIHtcbiAgICAgICAgbGV0IHZub2RlSG9vaztcbiAgICAgICAgY29uc3QgeyBlbCwgcHJvcHMgfSA9IGluaXRpYWxWTm9kZTtcbiAgICAgICAgY29uc3QgeyBibSwgbSwgcGFyZW50LCByb290LCB0eXBlIH0gPSBpbnN0YW5jZTtcbiAgICAgICAgY29uc3QgaXNBc3luY1dyYXBwZXJWTm9kZSA9IGlzQXN5bmNXcmFwcGVyKGluaXRpYWxWTm9kZSk7XG4gICAgICAgIHRvZ2dsZVJlY3Vyc2UoaW5zdGFuY2UsIGZhbHNlKTtcbiAgICAgICAgaWYgKGJtKSB7XG4gICAgICAgICAgaW52b2tlQXJyYXlGbnMoYm0pO1xuICAgICAgICB9XG4gICAgICAgIGlmICghaXNBc3luY1dyYXBwZXJWTm9kZSAmJiAodm5vZGVIb29rID0gcHJvcHMgJiYgcHJvcHMub25Wbm9kZUJlZm9yZU1vdW50KSkge1xuICAgICAgICAgIGludm9rZVZOb2RlSG9vayh2bm9kZUhvb2ssIHBhcmVudCwgaW5pdGlhbFZOb2RlKTtcbiAgICAgICAgfVxuICAgICAgICB0b2dnbGVSZWN1cnNlKGluc3RhbmNlLCB0cnVlKTtcbiAgICAgICAgaWYgKGVsICYmIGh5ZHJhdGVOb2RlKSB7XG4gICAgICAgICAgY29uc3QgaHlkcmF0ZVN1YlRyZWUgPSAoKSA9PiB7XG4gICAgICAgICAgICBpZiAoISEocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09IFwicHJvZHVjdGlvblwiKSkge1xuICAgICAgICAgICAgICBzdGFydE1lYXN1cmUoaW5zdGFuY2UsIGByZW5kZXJgKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGluc3RhbmNlLnN1YlRyZWUgPSByZW5kZXJDb21wb25lbnRSb290KGluc3RhbmNlKTtcbiAgICAgICAgICAgIGlmICghIShwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gXCJwcm9kdWN0aW9uXCIpKSB7XG4gICAgICAgICAgICAgIGVuZE1lYXN1cmUoaW5zdGFuY2UsIGByZW5kZXJgKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICghIShwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gXCJwcm9kdWN0aW9uXCIpKSB7XG4gICAgICAgICAgICAgIHN0YXJ0TWVhc3VyZShpbnN0YW5jZSwgYGh5ZHJhdGVgKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGh5ZHJhdGVOb2RlKFxuICAgICAgICAgICAgICBlbCxcbiAgICAgICAgICAgICAgaW5zdGFuY2Uuc3ViVHJlZSxcbiAgICAgICAgICAgICAgaW5zdGFuY2UsXG4gICAgICAgICAgICAgIHBhcmVudFN1c3BlbnNlLFxuICAgICAgICAgICAgICBudWxsXG4gICAgICAgICAgICApO1xuICAgICAgICAgICAgaWYgKCEhKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSBcInByb2R1Y3Rpb25cIikpIHtcbiAgICAgICAgICAgICAgZW5kTWVhc3VyZShpbnN0YW5jZSwgYGh5ZHJhdGVgKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9O1xuICAgICAgICAgIGlmIChpc0FzeW5jV3JhcHBlclZOb2RlICYmIHR5cGUuX19hc3luY0h5ZHJhdGUpIHtcbiAgICAgICAgICAgIHR5cGUuX19hc3luY0h5ZHJhdGUoXG4gICAgICAgICAgICAgIGVsLFxuICAgICAgICAgICAgICBpbnN0YW5jZSxcbiAgICAgICAgICAgICAgaHlkcmF0ZVN1YlRyZWVcbiAgICAgICAgICAgICk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGh5ZHJhdGVTdWJUcmVlKCk7XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGlmIChyb290LmNlICYmIHJvb3QuY2UuX2hhc1NoYWRvd1Jvb3QoKSkge1xuICAgICAgICAgICAgcm9vdC5jZS5faW5qZWN0Q2hpbGRTdHlsZSh0eXBlKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKCEhKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSBcInByb2R1Y3Rpb25cIikpIHtcbiAgICAgICAgICAgIHN0YXJ0TWVhc3VyZShpbnN0YW5jZSwgYHJlbmRlcmApO1xuICAgICAgICAgIH1cbiAgICAgICAgICBjb25zdCBzdWJUcmVlID0gaW5zdGFuY2Uuc3ViVHJlZSA9IHJlbmRlckNvbXBvbmVudFJvb3QoaW5zdGFuY2UpO1xuICAgICAgICAgIGlmICghIShwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gXCJwcm9kdWN0aW9uXCIpKSB7XG4gICAgICAgICAgICBlbmRNZWFzdXJlKGluc3RhbmNlLCBgcmVuZGVyYCk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmICghIShwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gXCJwcm9kdWN0aW9uXCIpKSB7XG4gICAgICAgICAgICBzdGFydE1lYXN1cmUoaW5zdGFuY2UsIGBwYXRjaGApO1xuICAgICAgICAgIH1cbiAgICAgICAgICBwYXRjaChcbiAgICAgICAgICAgIG51bGwsXG4gICAgICAgICAgICBzdWJUcmVlLFxuICAgICAgICAgICAgY29udGFpbmVyLFxuICAgICAgICAgICAgYW5jaG9yLFxuICAgICAgICAgICAgaW5zdGFuY2UsXG4gICAgICAgICAgICBwYXJlbnRTdXNwZW5zZSxcbiAgICAgICAgICAgIG5hbWVzcGFjZVxuICAgICAgICAgICk7XG4gICAgICAgICAgaWYgKCEhKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSBcInByb2R1Y3Rpb25cIikpIHtcbiAgICAgICAgICAgIGVuZE1lYXN1cmUoaW5zdGFuY2UsIGBwYXRjaGApO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpbml0aWFsVk5vZGUuZWwgPSBzdWJUcmVlLmVsO1xuICAgICAgICB9XG4gICAgICAgIGlmIChtKSB7XG4gICAgICAgICAgcXVldWVQb3N0UmVuZGVyRWZmZWN0KG0sIHBhcmVudFN1c3BlbnNlKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoIWlzQXN5bmNXcmFwcGVyVk5vZGUgJiYgKHZub2RlSG9vayA9IHByb3BzICYmIHByb3BzLm9uVm5vZGVNb3VudGVkKSkge1xuICAgICAgICAgIGNvbnN0IHNjb3BlZEluaXRpYWxWTm9kZSA9IGluaXRpYWxWTm9kZTtcbiAgICAgICAgICBxdWV1ZVBvc3RSZW5kZXJFZmZlY3QoXG4gICAgICAgICAgICAoKSA9PiBpbnZva2VWTm9kZUhvb2sodm5vZGVIb29rLCBwYXJlbnQsIHNjb3BlZEluaXRpYWxWTm9kZSksXG4gICAgICAgICAgICBwYXJlbnRTdXNwZW5zZVxuICAgICAgICAgICk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGluaXRpYWxWTm9kZS5zaGFwZUZsYWcgJiAyNTYgfHwgcGFyZW50ICYmIGlzQXN5bmNXcmFwcGVyKHBhcmVudC52bm9kZSkgJiYgcGFyZW50LnZub2RlLnNoYXBlRmxhZyAmIDI1Nikge1xuICAgICAgICAgIGluc3RhbmNlLmEgJiYgcXVldWVQb3N0UmVuZGVyRWZmZWN0KGluc3RhbmNlLmEsIHBhcmVudFN1c3BlbnNlKTtcbiAgICAgICAgfVxuICAgICAgICBpbnN0YW5jZS5pc01vdW50ZWQgPSB0cnVlO1xuICAgICAgICBpZiAoISEocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09IFwicHJvZHVjdGlvblwiKSB8fCBfX1ZVRV9QUk9EX0RFVlRPT0xTX18pIHtcbiAgICAgICAgICBkZXZ0b29sc0NvbXBvbmVudEFkZGVkKGluc3RhbmNlKTtcbiAgICAgICAgfVxuICAgICAgICBpbml0aWFsVk5vZGUgPSBjb250YWluZXIgPSBhbmNob3IgPSBudWxsO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbGV0IHsgbmV4dCwgYnUsIHUsIHBhcmVudCwgdm5vZGUgfSA9IGluc3RhbmNlO1xuICAgICAgICB7XG4gICAgICAgICAgY29uc3Qgbm9uSHlkcmF0ZWRBc3luY1Jvb3QgPSBsb2NhdGVOb25IeWRyYXRlZEFzeW5jUm9vdChpbnN0YW5jZSk7XG4gICAgICAgICAgaWYgKG5vbkh5ZHJhdGVkQXN5bmNSb290KSB7XG4gICAgICAgICAgICBpZiAobmV4dCkge1xuICAgICAgICAgICAgICBuZXh0LmVsID0gdm5vZGUuZWw7XG4gICAgICAgICAgICAgIHVwZGF0ZUNvbXBvbmVudFByZVJlbmRlcihpbnN0YW5jZSwgbmV4dCwgb3B0aW1pemVkKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIG5vbkh5ZHJhdGVkQXN5bmNSb290LmFzeW5jRGVwLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgICBxdWV1ZVBvc3RSZW5kZXJFZmZlY3QoKCkgPT4ge1xuICAgICAgICAgICAgICAgIGlmICghaW5zdGFuY2UuaXNVbm1vdW50ZWQpIHVwZGF0ZSgpO1xuICAgICAgICAgICAgICB9LCBwYXJlbnRTdXNwZW5zZSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgbGV0IG9yaWdpbk5leHQgPSBuZXh0O1xuICAgICAgICBsZXQgdm5vZGVIb29rO1xuICAgICAgICBpZiAoISEocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09IFwicHJvZHVjdGlvblwiKSkge1xuICAgICAgICAgIHB1c2hXYXJuaW5nQ29udGV4dChuZXh0IHx8IGluc3RhbmNlLnZub2RlKTtcbiAgICAgICAgfVxuICAgICAgICB0b2dnbGVSZWN1cnNlKGluc3RhbmNlLCBmYWxzZSk7XG4gICAgICAgIGlmIChuZXh0KSB7XG4gICAgICAgICAgbmV4dC5lbCA9IHZub2RlLmVsO1xuICAgICAgICAgIHVwZGF0ZUNvbXBvbmVudFByZVJlbmRlcihpbnN0YW5jZSwgbmV4dCwgb3B0aW1pemVkKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBuZXh0ID0gdm5vZGU7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGJ1KSB7XG4gICAgICAgICAgaW52b2tlQXJyYXlGbnMoYnUpO1xuICAgICAgICB9XG4gICAgICAgIGlmICh2bm9kZUhvb2sgPSBuZXh0LnByb3BzICYmIG5leHQucHJvcHMub25Wbm9kZUJlZm9yZVVwZGF0ZSkge1xuICAgICAgICAgIGludm9rZVZOb2RlSG9vayh2bm9kZUhvb2ssIHBhcmVudCwgbmV4dCwgdm5vZGUpO1xuICAgICAgICB9XG4gICAgICAgIHRvZ2dsZVJlY3Vyc2UoaW5zdGFuY2UsIHRydWUpO1xuICAgICAgICBpZiAoISEocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09IFwicHJvZHVjdGlvblwiKSkge1xuICAgICAgICAgIHN0YXJ0TWVhc3VyZShpbnN0YW5jZSwgYHJlbmRlcmApO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IG5leHRUcmVlID0gcmVuZGVyQ29tcG9uZW50Um9vdChpbnN0YW5jZSk7XG4gICAgICAgIGlmICghIShwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gXCJwcm9kdWN0aW9uXCIpKSB7XG4gICAgICAgICAgZW5kTWVhc3VyZShpbnN0YW5jZSwgYHJlbmRlcmApO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHByZXZUcmVlID0gaW5zdGFuY2Uuc3ViVHJlZTtcbiAgICAgICAgaW5zdGFuY2Uuc3ViVHJlZSA9IG5leHRUcmVlO1xuICAgICAgICBpZiAoISEocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09IFwicHJvZHVjdGlvblwiKSkge1xuICAgICAgICAgIHN0YXJ0TWVhc3VyZShpbnN0YW5jZSwgYHBhdGNoYCk7XG4gICAgICAgIH1cbiAgICAgICAgcGF0Y2goXG4gICAgICAgICAgcHJldlRyZWUsXG4gICAgICAgICAgbmV4dFRyZWUsXG4gICAgICAgICAgLy8gcGFyZW50IG1heSBoYXZlIGNoYW5nZWQgaWYgaXQncyBpbiBhIHRlbGVwb3J0XG4gICAgICAgICAgaG9zdFBhcmVudE5vZGUocHJldlRyZWUuZWwpLFxuICAgICAgICAgIC8vIGFuY2hvciBtYXkgaGF2ZSBjaGFuZ2VkIGlmIGl0J3MgaW4gYSBmcmFnbWVudFxuICAgICAgICAgIGdldE5leHRIb3N0Tm9kZShwcmV2VHJlZSksXG4gICAgICAgICAgaW5zdGFuY2UsXG4gICAgICAgICAgcGFyZW50U3VzcGVuc2UsXG4gICAgICAgICAgbmFtZXNwYWNlXG4gICAgICAgICk7XG4gICAgICAgIGlmICghIShwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gXCJwcm9kdWN0aW9uXCIpKSB7XG4gICAgICAgICAgZW5kTWVhc3VyZShpbnN0YW5jZSwgYHBhdGNoYCk7XG4gICAgICAgIH1cbiAgICAgICAgbmV4dC5lbCA9IG5leHRUcmVlLmVsO1xuICAgICAgICBpZiAob3JpZ2luTmV4dCA9PT0gbnVsbCkge1xuICAgICAgICAgIHVwZGF0ZUhPQ0hvc3RFbChpbnN0YW5jZSwgbmV4dFRyZWUuZWwpO1xuICAgICAgICB9XG4gICAgICAgIGlmICh1KSB7XG4gICAgICAgICAgcXVldWVQb3N0UmVuZGVyRWZmZWN0KHUsIHBhcmVudFN1c3BlbnNlKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAodm5vZGVIb29rID0gbmV4dC5wcm9wcyAmJiBuZXh0LnByb3BzLm9uVm5vZGVVcGRhdGVkKSB7XG4gICAgICAgICAgcXVldWVQb3N0UmVuZGVyRWZmZWN0KFxuICAgICAgICAgICAgKCkgPT4gaW52b2tlVk5vZGVIb29rKHZub2RlSG9vaywgcGFyZW50LCBuZXh0LCB2bm9kZSksXG4gICAgICAgICAgICBwYXJlbnRTdXNwZW5zZVxuICAgICAgICAgICk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCEhKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSBcInByb2R1Y3Rpb25cIikgfHwgX19WVUVfUFJPRF9ERVZUT09MU19fKSB7XG4gICAgICAgICAgZGV2dG9vbHNDb21wb25lbnRVcGRhdGVkKGluc3RhbmNlKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoISEocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09IFwicHJvZHVjdGlvblwiKSkge1xuICAgICAgICAgIHBvcFdhcm5pbmdDb250ZXh0KCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9O1xuICAgIGluc3RhbmNlLnNjb3BlLm9uKCk7XG4gICAgY29uc3QgZWZmZWN0ID0gaW5zdGFuY2UuZWZmZWN0ID0gbmV3IFJlYWN0aXZlRWZmZWN0KGNvbXBvbmVudFVwZGF0ZUZuKTtcbiAgICBpbnN0YW5jZS5zY29wZS5vZmYoKTtcbiAgICBjb25zdCB1cGRhdGUgPSBpbnN0YW5jZS51cGRhdGUgPSBlZmZlY3QucnVuLmJpbmQoZWZmZWN0KTtcbiAgICBjb25zdCBqb2IgPSBpbnN0YW5jZS5qb2IgPSBlZmZlY3QucnVuSWZEaXJ0eS5iaW5kKGVmZmVjdCk7XG4gICAgam9iLmkgPSBpbnN0YW5jZTtcbiAgICBqb2IuaWQgPSBpbnN0YW5jZS51aWQ7XG4gICAgZWZmZWN0LnNjaGVkdWxlciA9ICgpID0+IHF1ZXVlSm9iKGpvYik7XG4gICAgdG9nZ2xlUmVjdXJzZShpbnN0YW5jZSwgdHJ1ZSk7XG4gICAgaWYgKCEhKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSBcInByb2R1Y3Rpb25cIikpIHtcbiAgICAgIGVmZmVjdC5vblRyYWNrID0gaW5zdGFuY2UucnRjID8gKGUpID0+IGludm9rZUFycmF5Rm5zKGluc3RhbmNlLnJ0YywgZSkgOiB2b2lkIDA7XG4gICAgICBlZmZlY3Qub25UcmlnZ2VyID0gaW5zdGFuY2UucnRnID8gKGUpID0+IGludm9rZUFycmF5Rm5zKGluc3RhbmNlLnJ0ZywgZSkgOiB2b2lkIDA7XG4gICAgfVxuICAgIHVwZGF0ZSgpO1xuICB9O1xuICBjb25zdCB1cGRhdGVDb21wb25lbnRQcmVSZW5kZXIgPSAoaW5zdGFuY2UsIG5leHRWTm9kZSwgb3B0aW1pemVkKSA9PiB7XG4gICAgbmV4dFZOb2RlLmNvbXBvbmVudCA9IGluc3RhbmNlO1xuICAgIGNvbnN0IHByZXZQcm9wcyA9IGluc3RhbmNlLnZub2RlLnByb3BzO1xuICAgIGluc3RhbmNlLnZub2RlID0gbmV4dFZOb2RlO1xuICAgIGluc3RhbmNlLm5leHQgPSBudWxsO1xuICAgIHVwZGF0ZVByb3BzKGluc3RhbmNlLCBuZXh0Vk5vZGUucHJvcHMsIHByZXZQcm9wcywgb3B0aW1pemVkKTtcbiAgICB1cGRhdGVTbG90cyhpbnN0YW5jZSwgbmV4dFZOb2RlLmNoaWxkcmVuLCBvcHRpbWl6ZWQpO1xuICAgIHBhdXNlVHJhY2tpbmcoKTtcbiAgICBmbHVzaFByZUZsdXNoQ2JzKGluc3RhbmNlKTtcbiAgICByZXNldFRyYWNraW5nKCk7XG4gIH07XG4gIGNvbnN0IHBhdGNoQ2hpbGRyZW4gPSAobjEsIG4yLCBjb250YWluZXIsIGFuY2hvciwgcGFyZW50Q29tcG9uZW50LCBwYXJlbnRTdXNwZW5zZSwgbmFtZXNwYWNlLCBzbG90U2NvcGVJZHMsIG9wdGltaXplZCA9IGZhbHNlKSA9PiB7XG4gICAgY29uc3QgYzEgPSBuMSAmJiBuMS5jaGlsZHJlbjtcbiAgICBjb25zdCBwcmV2U2hhcGVGbGFnID0gbjEgPyBuMS5zaGFwZUZsYWcgOiAwO1xuICAgIGNvbnN0IGMyID0gbjIuY2hpbGRyZW47XG4gICAgY29uc3QgeyBwYXRjaEZsYWcsIHNoYXBlRmxhZyB9ID0gbjI7XG4gICAgaWYgKHBhdGNoRmxhZyA+IDApIHtcbiAgICAgIGlmIChwYXRjaEZsYWcgJiAxMjgpIHtcbiAgICAgICAgcGF0Y2hLZXllZENoaWxkcmVuKFxuICAgICAgICAgIGMxLFxuICAgICAgICAgIGMyLFxuICAgICAgICAgIGNvbnRhaW5lcixcbiAgICAgICAgICBhbmNob3IsXG4gICAgICAgICAgcGFyZW50Q29tcG9uZW50LFxuICAgICAgICAgIHBhcmVudFN1c3BlbnNlLFxuICAgICAgICAgIG5hbWVzcGFjZSxcbiAgICAgICAgICBzbG90U2NvcGVJZHMsXG4gICAgICAgICAgb3B0aW1pemVkXG4gICAgICAgICk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH0gZWxzZSBpZiAocGF0Y2hGbGFnICYgMjU2KSB7XG4gICAgICAgIHBhdGNoVW5rZXllZENoaWxkcmVuKFxuICAgICAgICAgIGMxLFxuICAgICAgICAgIGMyLFxuICAgICAgICAgIGNvbnRhaW5lcixcbiAgICAgICAgICBhbmNob3IsXG4gICAgICAgICAgcGFyZW50Q29tcG9uZW50LFxuICAgICAgICAgIHBhcmVudFN1c3BlbnNlLFxuICAgICAgICAgIG5hbWVzcGFjZSxcbiAgICAgICAgICBzbG90U2NvcGVJZHMsXG4gICAgICAgICAgb3B0aW1pemVkXG4gICAgICAgICk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKHNoYXBlRmxhZyAmIDgpIHtcbiAgICAgIGlmIChwcmV2U2hhcGVGbGFnICYgMTYpIHtcbiAgICAgICAgdW5tb3VudENoaWxkcmVuKGMxLCBwYXJlbnRDb21wb25lbnQsIHBhcmVudFN1c3BlbnNlKTtcbiAgICAgIH1cbiAgICAgIGlmIChjMiAhPT0gYzEpIHtcbiAgICAgICAgaG9zdFNldEVsZW1lbnRUZXh0KGNvbnRhaW5lciwgYzIpO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBpZiAocHJldlNoYXBlRmxhZyAmIDE2KSB7XG4gICAgICAgIGlmIChzaGFwZUZsYWcgJiAxNikge1xuICAgICAgICAgIHBhdGNoS2V5ZWRDaGlsZHJlbihcbiAgICAgICAgICAgIGMxLFxuICAgICAgICAgICAgYzIsXG4gICAgICAgICAgICBjb250YWluZXIsXG4gICAgICAgICAgICBhbmNob3IsXG4gICAgICAgICAgICBwYXJlbnRDb21wb25lbnQsXG4gICAgICAgICAgICBwYXJlbnRTdXNwZW5zZSxcbiAgICAgICAgICAgIG5hbWVzcGFjZSxcbiAgICAgICAgICAgIHNsb3RTY29wZUlkcyxcbiAgICAgICAgICAgIG9wdGltaXplZFxuICAgICAgICAgICk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdW5tb3VudENoaWxkcmVuKGMxLCBwYXJlbnRDb21wb25lbnQsIHBhcmVudFN1c3BlbnNlLCB0cnVlKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaWYgKHByZXZTaGFwZUZsYWcgJiA4KSB7XG4gICAgICAgICAgaG9zdFNldEVsZW1lbnRUZXh0KGNvbnRhaW5lciwgXCJcIik7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHNoYXBlRmxhZyAmIDE2KSB7XG4gICAgICAgICAgbW91bnRDaGlsZHJlbihcbiAgICAgICAgICAgIGMyLFxuICAgICAgICAgICAgY29udGFpbmVyLFxuICAgICAgICAgICAgYW5jaG9yLFxuICAgICAgICAgICAgcGFyZW50Q29tcG9uZW50LFxuICAgICAgICAgICAgcGFyZW50U3VzcGVuc2UsXG4gICAgICAgICAgICBuYW1lc3BhY2UsXG4gICAgICAgICAgICBzbG90U2NvcGVJZHMsXG4gICAgICAgICAgICBvcHRpbWl6ZWRcbiAgICAgICAgICApO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9O1xuICBjb25zdCBwYXRjaFVua2V5ZWRDaGlsZHJlbiA9IChjMSwgYzIsIGNvbnRhaW5lciwgYW5jaG9yLCBwYXJlbnRDb21wb25lbnQsIHBhcmVudFN1c3BlbnNlLCBuYW1lc3BhY2UsIHNsb3RTY29wZUlkcywgb3B0aW1pemVkKSA9PiB7XG4gICAgYzEgPSBjMSB8fCBFTVBUWV9BUlI7XG4gICAgYzIgPSBjMiB8fCBFTVBUWV9BUlI7XG4gICAgY29uc3Qgb2xkTGVuZ3RoID0gYzEubGVuZ3RoO1xuICAgIGNvbnN0IG5ld0xlbmd0aCA9IGMyLmxlbmd0aDtcbiAgICBjb25zdCBjb21tb25MZW5ndGggPSBNYXRoLm1pbihvbGRMZW5ndGgsIG5ld0xlbmd0aCk7XG4gICAgbGV0IGk7XG4gICAgZm9yIChpID0gMDsgaSA8IGNvbW1vbkxlbmd0aDsgaSsrKSB7XG4gICAgICBjb25zdCBuZXh0Q2hpbGQgPSBjMltpXSA9IG9wdGltaXplZCA/IGNsb25lSWZNb3VudGVkKGMyW2ldKSA6IG5vcm1hbGl6ZVZOb2RlKGMyW2ldKTtcbiAgICAgIHBhdGNoKFxuICAgICAgICBjMVtpXSxcbiAgICAgICAgbmV4dENoaWxkLFxuICAgICAgICBjb250YWluZXIsXG4gICAgICAgIG51bGwsXG4gICAgICAgIHBhcmVudENvbXBvbmVudCxcbiAgICAgICAgcGFyZW50U3VzcGVuc2UsXG4gICAgICAgIG5hbWVzcGFjZSxcbiAgICAgICAgc2xvdFNjb3BlSWRzLFxuICAgICAgICBvcHRpbWl6ZWRcbiAgICAgICk7XG4gICAgfVxuICAgIGlmIChvbGRMZW5ndGggPiBuZXdMZW5ndGgpIHtcbiAgICAgIHVubW91bnRDaGlsZHJlbihcbiAgICAgICAgYzEsXG4gICAgICAgIHBhcmVudENvbXBvbmVudCxcbiAgICAgICAgcGFyZW50U3VzcGVuc2UsXG4gICAgICAgIHRydWUsXG4gICAgICAgIGZhbHNlLFxuICAgICAgICBjb21tb25MZW5ndGhcbiAgICAgICk7XG4gICAgfSBlbHNlIHtcbiAgICAgIG1vdW50Q2hpbGRyZW4oXG4gICAgICAgIGMyLFxuICAgICAgICBjb250YWluZXIsXG4gICAgICAgIGFuY2hvcixcbiAgICAgICAgcGFyZW50Q29tcG9uZW50LFxuICAgICAgICBwYXJlbnRTdXNwZW5zZSxcbiAgICAgICAgbmFtZXNwYWNlLFxuICAgICAgICBzbG90U2NvcGVJZHMsXG4gICAgICAgIG9wdGltaXplZCxcbiAgICAgICAgY29tbW9uTGVuZ3RoXG4gICAgICApO1xuICAgIH1cbiAgfTtcbiAgY29uc3QgcGF0Y2hLZXllZENoaWxkcmVuID0gKGMxLCBjMiwgY29udGFpbmVyLCBwYXJlbnRBbmNob3IsIHBhcmVudENvbXBvbmVudCwgcGFyZW50U3VzcGVuc2UsIG5hbWVzcGFjZSwgc2xvdFNjb3BlSWRzLCBvcHRpbWl6ZWQpID0+IHtcbiAgICBsZXQgaSA9IDA7XG4gICAgY29uc3QgbDIgPSBjMi5sZW5ndGg7XG4gICAgbGV0IGUxID0gYzEubGVuZ3RoIC0gMTtcbiAgICBsZXQgZTIgPSBsMiAtIDE7XG4gICAgd2hpbGUgKGkgPD0gZTEgJiYgaSA8PSBlMikge1xuICAgICAgY29uc3QgbjEgPSBjMVtpXTtcbiAgICAgIGNvbnN0IG4yID0gYzJbaV0gPSBvcHRpbWl6ZWQgPyBjbG9uZUlmTW91bnRlZChjMltpXSkgOiBub3JtYWxpemVWTm9kZShjMltpXSk7XG4gICAgICBpZiAoaXNTYW1lVk5vZGVUeXBlKG4xLCBuMikpIHtcbiAgICAgICAgcGF0Y2goXG4gICAgICAgICAgbjEsXG4gICAgICAgICAgbjIsXG4gICAgICAgICAgY29udGFpbmVyLFxuICAgICAgICAgIG51bGwsXG4gICAgICAgICAgcGFyZW50Q29tcG9uZW50LFxuICAgICAgICAgIHBhcmVudFN1c3BlbnNlLFxuICAgICAgICAgIG5hbWVzcGFjZSxcbiAgICAgICAgICBzbG90U2NvcGVJZHMsXG4gICAgICAgICAgb3B0aW1pemVkXG4gICAgICAgICk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICAgIGkrKztcbiAgICB9XG4gICAgd2hpbGUgKGkgPD0gZTEgJiYgaSA8PSBlMikge1xuICAgICAgY29uc3QgbjEgPSBjMVtlMV07XG4gICAgICBjb25zdCBuMiA9IGMyW2UyXSA9IG9wdGltaXplZCA/IGNsb25lSWZNb3VudGVkKGMyW2UyXSkgOiBub3JtYWxpemVWTm9kZShjMltlMl0pO1xuICAgICAgaWYgKGlzU2FtZVZOb2RlVHlwZShuMSwgbjIpKSB7XG4gICAgICAgIHBhdGNoKFxuICAgICAgICAgIG4xLFxuICAgICAgICAgIG4yLFxuICAgICAgICAgIGNvbnRhaW5lcixcbiAgICAgICAgICBudWxsLFxuICAgICAgICAgIHBhcmVudENvbXBvbmVudCxcbiAgICAgICAgICBwYXJlbnRTdXNwZW5zZSxcbiAgICAgICAgICBuYW1lc3BhY2UsXG4gICAgICAgICAgc2xvdFNjb3BlSWRzLFxuICAgICAgICAgIG9wdGltaXplZFxuICAgICAgICApO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgICBlMS0tO1xuICAgICAgZTItLTtcbiAgICB9XG4gICAgaWYgKGkgPiBlMSkge1xuICAgICAgaWYgKGkgPD0gZTIpIHtcbiAgICAgICAgY29uc3QgbmV4dFBvcyA9IGUyICsgMTtcbiAgICAgICAgY29uc3QgYW5jaG9yID0gbmV4dFBvcyA8IGwyID8gYzJbbmV4dFBvc10uZWwgOiBwYXJlbnRBbmNob3I7XG4gICAgICAgIHdoaWxlIChpIDw9IGUyKSB7XG4gICAgICAgICAgcGF0Y2goXG4gICAgICAgICAgICBudWxsLFxuICAgICAgICAgICAgYzJbaV0gPSBvcHRpbWl6ZWQgPyBjbG9uZUlmTW91bnRlZChjMltpXSkgOiBub3JtYWxpemVWTm9kZShjMltpXSksXG4gICAgICAgICAgICBjb250YWluZXIsXG4gICAgICAgICAgICBhbmNob3IsXG4gICAgICAgICAgICBwYXJlbnRDb21wb25lbnQsXG4gICAgICAgICAgICBwYXJlbnRTdXNwZW5zZSxcbiAgICAgICAgICAgIG5hbWVzcGFjZSxcbiAgICAgICAgICAgIHNsb3RTY29wZUlkcyxcbiAgICAgICAgICAgIG9wdGltaXplZFxuICAgICAgICAgICk7XG4gICAgICAgICAgaSsrO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSBlbHNlIGlmIChpID4gZTIpIHtcbiAgICAgIHdoaWxlIChpIDw9IGUxKSB7XG4gICAgICAgIHVubW91bnQoYzFbaV0sIHBhcmVudENvbXBvbmVudCwgcGFyZW50U3VzcGVuc2UsIHRydWUpO1xuICAgICAgICBpKys7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnN0IHMxID0gaTtcbiAgICAgIGNvbnN0IHMyID0gaTtcbiAgICAgIGNvbnN0IGtleVRvTmV3SW5kZXhNYXAgPSAvKiBAX19QVVJFX18gKi8gbmV3IE1hcCgpO1xuICAgICAgZm9yIChpID0gczI7IGkgPD0gZTI7IGkrKykge1xuICAgICAgICBjb25zdCBuZXh0Q2hpbGQgPSBjMltpXSA9IG9wdGltaXplZCA/IGNsb25lSWZNb3VudGVkKGMyW2ldKSA6IG5vcm1hbGl6ZVZOb2RlKGMyW2ldKTtcbiAgICAgICAgaWYgKG5leHRDaGlsZC5rZXkgIT0gbnVsbCkge1xuICAgICAgICAgIGlmICghIShwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gXCJwcm9kdWN0aW9uXCIpICYmIGtleVRvTmV3SW5kZXhNYXAuaGFzKG5leHRDaGlsZC5rZXkpKSB7XG4gICAgICAgICAgICB3YXJuJDEoXG4gICAgICAgICAgICAgIGBEdXBsaWNhdGUga2V5cyBmb3VuZCBkdXJpbmcgdXBkYXRlOmAsXG4gICAgICAgICAgICAgIEpTT04uc3RyaW5naWZ5KG5leHRDaGlsZC5rZXkpLFxuICAgICAgICAgICAgICBgTWFrZSBzdXJlIGtleXMgYXJlIHVuaXF1ZS5gXG4gICAgICAgICAgICApO1xuICAgICAgICAgIH1cbiAgICAgICAgICBrZXlUb05ld0luZGV4TWFwLnNldChuZXh0Q2hpbGQua2V5LCBpKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgbGV0IGo7XG4gICAgICBsZXQgcGF0Y2hlZCA9IDA7XG4gICAgICBjb25zdCB0b0JlUGF0Y2hlZCA9IGUyIC0gczIgKyAxO1xuICAgICAgbGV0IG1vdmVkID0gZmFsc2U7XG4gICAgICBsZXQgbWF4TmV3SW5kZXhTb0ZhciA9IDA7XG4gICAgICBjb25zdCBuZXdJbmRleFRvT2xkSW5kZXhNYXAgPSBuZXcgQXJyYXkodG9CZVBhdGNoZWQpO1xuICAgICAgZm9yIChpID0gMDsgaSA8IHRvQmVQYXRjaGVkOyBpKyspIG5ld0luZGV4VG9PbGRJbmRleE1hcFtpXSA9IDA7XG4gICAgICBmb3IgKGkgPSBzMTsgaSA8PSBlMTsgaSsrKSB7XG4gICAgICAgIGNvbnN0IHByZXZDaGlsZCA9IGMxW2ldO1xuICAgICAgICBpZiAocGF0Y2hlZCA+PSB0b0JlUGF0Y2hlZCkge1xuICAgICAgICAgIHVubW91bnQocHJldkNoaWxkLCBwYXJlbnRDb21wb25lbnQsIHBhcmVudFN1c3BlbnNlLCB0cnVlKTtcbiAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfVxuICAgICAgICBsZXQgbmV3SW5kZXg7XG4gICAgICAgIGlmIChwcmV2Q2hpbGQua2V5ICE9IG51bGwpIHtcbiAgICAgICAgICBuZXdJbmRleCA9IGtleVRvTmV3SW5kZXhNYXAuZ2V0KHByZXZDaGlsZC5rZXkpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGZvciAoaiA9IHMyOyBqIDw9IGUyOyBqKyspIHtcbiAgICAgICAgICAgIGlmIChuZXdJbmRleFRvT2xkSW5kZXhNYXBbaiAtIHMyXSA9PT0gMCAmJiBpc1NhbWVWTm9kZVR5cGUocHJldkNoaWxkLCBjMltqXSkpIHtcbiAgICAgICAgICAgICAgbmV3SW5kZXggPSBqO1xuICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKG5ld0luZGV4ID09PSB2b2lkIDApIHtcbiAgICAgICAgICB1bm1vdW50KHByZXZDaGlsZCwgcGFyZW50Q29tcG9uZW50LCBwYXJlbnRTdXNwZW5zZSwgdHJ1ZSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgbmV3SW5kZXhUb09sZEluZGV4TWFwW25ld0luZGV4IC0gczJdID0gaSArIDE7XG4gICAgICAgICAgaWYgKG5ld0luZGV4ID49IG1heE5ld0luZGV4U29GYXIpIHtcbiAgICAgICAgICAgIG1heE5ld0luZGV4U29GYXIgPSBuZXdJbmRleDtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgbW92ZWQgPSB0cnVlO1xuICAgICAgICAgIH1cbiAgICAgICAgICBwYXRjaChcbiAgICAgICAgICAgIHByZXZDaGlsZCxcbiAgICAgICAgICAgIGMyW25ld0luZGV4XSxcbiAgICAgICAgICAgIGNvbnRhaW5lcixcbiAgICAgICAgICAgIG51bGwsXG4gICAgICAgICAgICBwYXJlbnRDb21wb25lbnQsXG4gICAgICAgICAgICBwYXJlbnRTdXNwZW5zZSxcbiAgICAgICAgICAgIG5hbWVzcGFjZSxcbiAgICAgICAgICAgIHNsb3RTY29wZUlkcyxcbiAgICAgICAgICAgIG9wdGltaXplZFxuICAgICAgICAgICk7XG4gICAgICAgICAgcGF0Y2hlZCsrO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBjb25zdCBpbmNyZWFzaW5nTmV3SW5kZXhTZXF1ZW5jZSA9IG1vdmVkID8gZ2V0U2VxdWVuY2UobmV3SW5kZXhUb09sZEluZGV4TWFwKSA6IEVNUFRZX0FSUjtcbiAgICAgIGogPSBpbmNyZWFzaW5nTmV3SW5kZXhTZXF1ZW5jZS5sZW5ndGggLSAxO1xuICAgICAgZm9yIChpID0gdG9CZVBhdGNoZWQgLSAxOyBpID49IDA7IGktLSkge1xuICAgICAgICBjb25zdCBuZXh0SW5kZXggPSBzMiArIGk7XG4gICAgICAgIGNvbnN0IG5leHRDaGlsZCA9IGMyW25leHRJbmRleF07XG4gICAgICAgIGNvbnN0IGFuY2hvclZOb2RlID0gYzJbbmV4dEluZGV4ICsgMV07XG4gICAgICAgIGNvbnN0IGFuY2hvciA9IG5leHRJbmRleCArIDEgPCBsMiA/IChcbiAgICAgICAgICAvLyAjMTM1NTksICMxNDE3MyBmYWxsYmFjayB0byBlbCBwbGFjZWhvbGRlciBmb3IgdW5yZXNvbHZlZCBhc3luYyBjb21wb25lbnRcbiAgICAgICAgICBhbmNob3JWTm9kZS5lbCB8fCByZXNvbHZlQXN5bmNDb21wb25lbnRQbGFjZWhvbGRlcihhbmNob3JWTm9kZSlcbiAgICAgICAgKSA6IHBhcmVudEFuY2hvcjtcbiAgICAgICAgaWYgKG5ld0luZGV4VG9PbGRJbmRleE1hcFtpXSA9PT0gMCkge1xuICAgICAgICAgIHBhdGNoKFxuICAgICAgICAgICAgbnVsbCxcbiAgICAgICAgICAgIG5leHRDaGlsZCxcbiAgICAgICAgICAgIGNvbnRhaW5lcixcbiAgICAgICAgICAgIGFuY2hvcixcbiAgICAgICAgICAgIHBhcmVudENvbXBvbmVudCxcbiAgICAgICAgICAgIHBhcmVudFN1c3BlbnNlLFxuICAgICAgICAgICAgbmFtZXNwYWNlLFxuICAgICAgICAgICAgc2xvdFNjb3BlSWRzLFxuICAgICAgICAgICAgb3B0aW1pemVkXG4gICAgICAgICAgKTtcbiAgICAgICAgfSBlbHNlIGlmIChtb3ZlZCkge1xuICAgICAgICAgIGlmIChqIDwgMCB8fCBpICE9PSBpbmNyZWFzaW5nTmV3SW5kZXhTZXF1ZW5jZVtqXSkge1xuICAgICAgICAgICAgbW92ZShuZXh0Q2hpbGQsIGNvbnRhaW5lciwgYW5jaG9yLCAyKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgai0tO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfTtcbiAgY29uc3QgbW92ZSA9ICh2bm9kZSwgY29udGFpbmVyLCBhbmNob3IsIG1vdmVUeXBlLCBwYXJlbnRTdXNwZW5zZSA9IG51bGwpID0+IHtcbiAgICBjb25zdCB7IGVsLCB0eXBlLCB0cmFuc2l0aW9uLCBjaGlsZHJlbiwgc2hhcGVGbGFnIH0gPSB2bm9kZTtcbiAgICBpZiAoc2hhcGVGbGFnICYgNikge1xuICAgICAgbW92ZSh2bm9kZS5jb21wb25lbnQuc3ViVHJlZSwgY29udGFpbmVyLCBhbmNob3IsIG1vdmVUeXBlKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgaWYgKHNoYXBlRmxhZyAmIDEyOCkge1xuICAgICAgdm5vZGUuc3VzcGVuc2UubW92ZShjb250YWluZXIsIGFuY2hvciwgbW92ZVR5cGUpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBpZiAoc2hhcGVGbGFnICYgNjQpIHtcbiAgICAgIHR5cGUubW92ZSh2bm9kZSwgY29udGFpbmVyLCBhbmNob3IsIGludGVybmFscyk7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGlmICh0eXBlID09PSBGcmFnbWVudCkge1xuICAgICAgaG9zdEluc2VydChlbCwgY29udGFpbmVyLCBhbmNob3IpO1xuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBjaGlsZHJlbi5sZW5ndGg7IGkrKykge1xuICAgICAgICBtb3ZlKGNoaWxkcmVuW2ldLCBjb250YWluZXIsIGFuY2hvciwgbW92ZVR5cGUpO1xuICAgICAgfVxuICAgICAgaG9zdEluc2VydCh2bm9kZS5hbmNob3IsIGNvbnRhaW5lciwgYW5jaG9yKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgaWYgKHR5cGUgPT09IFN0YXRpYykge1xuICAgICAgbW92ZVN0YXRpY05vZGUodm5vZGUsIGNvbnRhaW5lciwgYW5jaG9yKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgY29uc3QgbmVlZFRyYW5zaXRpb24yID0gbW92ZVR5cGUgIT09IDIgJiYgc2hhcGVGbGFnICYgMSAmJiB0cmFuc2l0aW9uO1xuICAgIGlmIChuZWVkVHJhbnNpdGlvbjIpIHtcbiAgICAgIGlmIChtb3ZlVHlwZSA9PT0gMCkge1xuICAgICAgICB0cmFuc2l0aW9uLmJlZm9yZUVudGVyKGVsKTtcbiAgICAgICAgaG9zdEluc2VydChlbCwgY29udGFpbmVyLCBhbmNob3IpO1xuICAgICAgICBxdWV1ZVBvc3RSZW5kZXJFZmZlY3QoKCkgPT4gdHJhbnNpdGlvbi5lbnRlcihlbCksIHBhcmVudFN1c3BlbnNlKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnN0IHsgbGVhdmUsIGRlbGF5TGVhdmUsIGFmdGVyTGVhdmUgfSA9IHRyYW5zaXRpb247XG4gICAgICAgIGNvbnN0IHJlbW92ZTIgPSAoKSA9PiB7XG4gICAgICAgICAgaWYgKHZub2RlLmN0eC5pc1VubW91bnRlZCkge1xuICAgICAgICAgICAgaG9zdFJlbW92ZShlbCk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGhvc3RJbnNlcnQoZWwsIGNvbnRhaW5lciwgYW5jaG9yKTtcbiAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICAgIGNvbnN0IHBlcmZvcm1MZWF2ZSA9ICgpID0+IHtcbiAgICAgICAgICBpZiAoZWwuX2lzTGVhdmluZykge1xuICAgICAgICAgICAgZWxbbGVhdmVDYktleV0oXG4gICAgICAgICAgICAgIHRydWVcbiAgICAgICAgICAgICAgLyogY2FuY2VsbGVkICovXG4gICAgICAgICAgICApO1xuICAgICAgICAgIH1cbiAgICAgICAgICBsZWF2ZShlbCwgKCkgPT4ge1xuICAgICAgICAgICAgcmVtb3ZlMigpO1xuICAgICAgICAgICAgYWZ0ZXJMZWF2ZSAmJiBhZnRlckxlYXZlKCk7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH07XG4gICAgICAgIGlmIChkZWxheUxlYXZlKSB7XG4gICAgICAgICAgZGVsYXlMZWF2ZShlbCwgcmVtb3ZlMiwgcGVyZm9ybUxlYXZlKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBwZXJmb3JtTGVhdmUoKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBob3N0SW5zZXJ0KGVsLCBjb250YWluZXIsIGFuY2hvcik7XG4gICAgfVxuICB9O1xuICBjb25zdCB1bm1vdW50ID0gKHZub2RlLCBwYXJlbnRDb21wb25lbnQsIHBhcmVudFN1c3BlbnNlLCBkb1JlbW92ZSA9IGZhbHNlLCBvcHRpbWl6ZWQgPSBmYWxzZSkgPT4ge1xuICAgIGNvbnN0IHtcbiAgICAgIHR5cGUsXG4gICAgICBwcm9wcyxcbiAgICAgIHJlZixcbiAgICAgIGNoaWxkcmVuLFxuICAgICAgZHluYW1pY0NoaWxkcmVuLFxuICAgICAgc2hhcGVGbGFnLFxuICAgICAgcGF0Y2hGbGFnLFxuICAgICAgZGlycyxcbiAgICAgIGNhY2hlSW5kZXhcbiAgICB9ID0gdm5vZGU7XG4gICAgaWYgKHBhdGNoRmxhZyA9PT0gLTIpIHtcbiAgICAgIG9wdGltaXplZCA9IGZhbHNlO1xuICAgIH1cbiAgICBpZiAocmVmICE9IG51bGwpIHtcbiAgICAgIHBhdXNlVHJhY2tpbmcoKTtcbiAgICAgIHNldFJlZihyZWYsIG51bGwsIHBhcmVudFN1c3BlbnNlLCB2bm9kZSwgdHJ1ZSk7XG4gICAgICByZXNldFRyYWNraW5nKCk7XG4gICAgfVxuICAgIGlmIChjYWNoZUluZGV4ICE9IG51bGwpIHtcbiAgICAgIHBhcmVudENvbXBvbmVudC5yZW5kZXJDYWNoZVtjYWNoZUluZGV4XSA9IHZvaWQgMDtcbiAgICB9XG4gICAgaWYgKHNoYXBlRmxhZyAmIDI1Nikge1xuICAgICAgcGFyZW50Q29tcG9uZW50LmN0eC5kZWFjdGl2YXRlKHZub2RlKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgY29uc3Qgc2hvdWxkSW52b2tlRGlycyA9IHNoYXBlRmxhZyAmIDEgJiYgZGlycztcbiAgICBjb25zdCBzaG91bGRJbnZva2VWbm9kZUhvb2sgPSAhaXNBc3luY1dyYXBwZXIodm5vZGUpO1xuICAgIGxldCB2bm9kZUhvb2s7XG4gICAgaWYgKHNob3VsZEludm9rZVZub2RlSG9vayAmJiAodm5vZGVIb29rID0gcHJvcHMgJiYgcHJvcHMub25Wbm9kZUJlZm9yZVVubW91bnQpKSB7XG4gICAgICBpbnZva2VWTm9kZUhvb2sodm5vZGVIb29rLCBwYXJlbnRDb21wb25lbnQsIHZub2RlKTtcbiAgICB9XG4gICAgaWYgKHNoYXBlRmxhZyAmIDYpIHtcbiAgICAgIHVubW91bnRDb21wb25lbnQodm5vZGUuY29tcG9uZW50LCBwYXJlbnRTdXNwZW5zZSwgZG9SZW1vdmUpO1xuICAgIH0gZWxzZSB7XG4gICAgICBpZiAoc2hhcGVGbGFnICYgMTI4KSB7XG4gICAgICAgIHZub2RlLnN1c3BlbnNlLnVubW91bnQocGFyZW50U3VzcGVuc2UsIGRvUmVtb3ZlKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgaWYgKHNob3VsZEludm9rZURpcnMpIHtcbiAgICAgICAgaW52b2tlRGlyZWN0aXZlSG9vayh2bm9kZSwgbnVsbCwgcGFyZW50Q29tcG9uZW50LCBcImJlZm9yZVVubW91bnRcIik7XG4gICAgICB9XG4gICAgICBpZiAoc2hhcGVGbGFnICYgNjQpIHtcbiAgICAgICAgdm5vZGUudHlwZS5yZW1vdmUoXG4gICAgICAgICAgdm5vZGUsXG4gICAgICAgICAgcGFyZW50Q29tcG9uZW50LFxuICAgICAgICAgIHBhcmVudFN1c3BlbnNlLFxuICAgICAgICAgIGludGVybmFscyxcbiAgICAgICAgICBkb1JlbW92ZVxuICAgICAgICApO1xuICAgICAgfSBlbHNlIGlmIChkeW5hbWljQ2hpbGRyZW4gJiYgLy8gIzUxNTRcbiAgICAgIC8vIHdoZW4gdi1vbmNlIGlzIHVzZWQgaW5zaWRlIGEgYmxvY2ssIHNldEJsb2NrVHJhY2tpbmcoLTEpIG1hcmtzIHRoZVxuICAgICAgLy8gcGFyZW50IGJsb2NrIHdpdGggaGFzT25jZTogdHJ1ZVxuICAgICAgLy8gc28gdGhhdCBpdCBkb2Vzbid0IHRha2UgdGhlIGZhc3QgcGF0aCBkdXJpbmcgdW5tb3VudCAtIG90aGVyd2lzZVxuICAgICAgLy8gY29tcG9uZW50cyBuZXN0ZWQgaW4gdi1vbmNlIGFyZSBuZXZlciB1bm1vdW50ZWQuXG4gICAgICAhZHluYW1pY0NoaWxkcmVuLmhhc09uY2UgJiYgLy8gIzExNTM6IGZhc3QgcGF0aCBzaG91bGQgbm90IGJlIHRha2VuIGZvciBub24tc3RhYmxlICh2LWZvcikgZnJhZ21lbnRzXG4gICAgICAodHlwZSAhPT0gRnJhZ21lbnQgfHwgcGF0Y2hGbGFnID4gMCAmJiBwYXRjaEZsYWcgJiA2NCkpIHtcbiAgICAgICAgdW5tb3VudENoaWxkcmVuKFxuICAgICAgICAgIGR5bmFtaWNDaGlsZHJlbixcbiAgICAgICAgICBwYXJlbnRDb21wb25lbnQsXG4gICAgICAgICAgcGFyZW50U3VzcGVuc2UsXG4gICAgICAgICAgZmFsc2UsXG4gICAgICAgICAgdHJ1ZVxuICAgICAgICApO1xuICAgICAgfSBlbHNlIGlmICh0eXBlID09PSBGcmFnbWVudCAmJiBwYXRjaEZsYWcgJiAoMTI4IHwgMjU2KSB8fCAhb3B0aW1pemVkICYmIHNoYXBlRmxhZyAmIDE2KSB7XG4gICAgICAgIHVubW91bnRDaGlsZHJlbihjaGlsZHJlbiwgcGFyZW50Q29tcG9uZW50LCBwYXJlbnRTdXNwZW5zZSk7XG4gICAgICB9XG4gICAgICBpZiAoZG9SZW1vdmUpIHtcbiAgICAgICAgcmVtb3ZlKHZub2RlKTtcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKHNob3VsZEludm9rZVZub2RlSG9vayAmJiAodm5vZGVIb29rID0gcHJvcHMgJiYgcHJvcHMub25Wbm9kZVVubW91bnRlZCkgfHwgc2hvdWxkSW52b2tlRGlycykge1xuICAgICAgcXVldWVQb3N0UmVuZGVyRWZmZWN0KCgpID0+IHtcbiAgICAgICAgdm5vZGVIb29rICYmIGludm9rZVZOb2RlSG9vayh2bm9kZUhvb2ssIHBhcmVudENvbXBvbmVudCwgdm5vZGUpO1xuICAgICAgICBzaG91bGRJbnZva2VEaXJzICYmIGludm9rZURpcmVjdGl2ZUhvb2sodm5vZGUsIG51bGwsIHBhcmVudENvbXBvbmVudCwgXCJ1bm1vdW50ZWRcIik7XG4gICAgICB9LCBwYXJlbnRTdXNwZW5zZSk7XG4gICAgfVxuICB9O1xuICBjb25zdCByZW1vdmUgPSAodm5vZGUpID0+IHtcbiAgICBjb25zdCB7IHR5cGUsIGVsLCBhbmNob3IsIHRyYW5zaXRpb24gfSA9IHZub2RlO1xuICAgIGlmICh0eXBlID09PSBGcmFnbWVudCkge1xuICAgICAgaWYgKCEhKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSBcInByb2R1Y3Rpb25cIikgJiYgdm5vZGUucGF0Y2hGbGFnID4gMCAmJiB2bm9kZS5wYXRjaEZsYWcgJiAyMDQ4ICYmIHRyYW5zaXRpb24gJiYgIXRyYW5zaXRpb24ucGVyc2lzdGVkKSB7XG4gICAgICAgIHZub2RlLmNoaWxkcmVuLmZvckVhY2goKGNoaWxkKSA9PiB7XG4gICAgICAgICAgaWYgKGNoaWxkLnR5cGUgPT09IENvbW1lbnQpIHtcbiAgICAgICAgICAgIGhvc3RSZW1vdmUoY2hpbGQuZWwpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZW1vdmUoY2hpbGQpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZW1vdmVGcmFnbWVudChlbCwgYW5jaG9yKTtcbiAgICAgIH1cbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgaWYgKHR5cGUgPT09IFN0YXRpYykge1xuICAgICAgcmVtb3ZlU3RhdGljTm9kZSh2bm9kZSk7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGNvbnN0IHBlcmZvcm1SZW1vdmUgPSAoKSA9PiB7XG4gICAgICBob3N0UmVtb3ZlKGVsKTtcbiAgICAgIGlmICh0cmFuc2l0aW9uICYmICF0cmFuc2l0aW9uLnBlcnNpc3RlZCAmJiB0cmFuc2l0aW9uLmFmdGVyTGVhdmUpIHtcbiAgICAgICAgdHJhbnNpdGlvbi5hZnRlckxlYXZlKCk7XG4gICAgICB9XG4gICAgfTtcbiAgICBpZiAodm5vZGUuc2hhcGVGbGFnICYgMSAmJiB0cmFuc2l0aW9uICYmICF0cmFuc2l0aW9uLnBlcnNpc3RlZCkge1xuICAgICAgY29uc3QgeyBsZWF2ZSwgZGVsYXlMZWF2ZSB9ID0gdHJhbnNpdGlvbjtcbiAgICAgIGNvbnN0IHBlcmZvcm1MZWF2ZSA9ICgpID0+IGxlYXZlKGVsLCBwZXJmb3JtUmVtb3ZlKTtcbiAgICAgIGlmIChkZWxheUxlYXZlKSB7XG4gICAgICAgIGRlbGF5TGVhdmUodm5vZGUuZWwsIHBlcmZvcm1SZW1vdmUsIHBlcmZvcm1MZWF2ZSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBwZXJmb3JtTGVhdmUoKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgcGVyZm9ybVJlbW92ZSgpO1xuICAgIH1cbiAgfTtcbiAgY29uc3QgcmVtb3ZlRnJhZ21lbnQgPSAoY3VyLCBlbmQpID0+IHtcbiAgICBsZXQgbmV4dDtcbiAgICB3aGlsZSAoY3VyICE9PSBlbmQpIHtcbiAgICAgIG5leHQgPSBob3N0TmV4dFNpYmxpbmcoY3VyKTtcbiAgICAgIGhvc3RSZW1vdmUoY3VyKTtcbiAgICAgIGN1ciA9IG5leHQ7XG4gICAgfVxuICAgIGhvc3RSZW1vdmUoZW5kKTtcbiAgfTtcbiAgY29uc3QgdW5tb3VudENvbXBvbmVudCA9IChpbnN0YW5jZSwgcGFyZW50U3VzcGVuc2UsIGRvUmVtb3ZlKSA9PiB7XG4gICAgaWYgKCEhKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSBcInByb2R1Y3Rpb25cIikgJiYgaW5zdGFuY2UudHlwZS5fX2htcklkKSB7XG4gICAgICB1bnJlZ2lzdGVySE1SKGluc3RhbmNlKTtcbiAgICB9XG4gICAgY29uc3QgeyBidW0sIHNjb3BlLCBqb2IsIHN1YlRyZWUsIHVtLCBtLCBhIH0gPSBpbnN0YW5jZTtcbiAgICBpbnZhbGlkYXRlTW91bnQobSk7XG4gICAgaW52YWxpZGF0ZU1vdW50KGEpO1xuICAgIGlmIChidW0pIHtcbiAgICAgIGludm9rZUFycmF5Rm5zKGJ1bSk7XG4gICAgfVxuICAgIHNjb3BlLnN0b3AoKTtcbiAgICBpZiAoam9iKSB7XG4gICAgICBqb2IuZmxhZ3MgfD0gODtcbiAgICAgIHVubW91bnQoc3ViVHJlZSwgaW5zdGFuY2UsIHBhcmVudFN1c3BlbnNlLCBkb1JlbW92ZSk7XG4gICAgfVxuICAgIGlmICh1bSkge1xuICAgICAgcXVldWVQb3N0UmVuZGVyRWZmZWN0KHVtLCBwYXJlbnRTdXNwZW5zZSk7XG4gICAgfVxuICAgIHF1ZXVlUG9zdFJlbmRlckVmZmVjdCgoKSA9PiB7XG4gICAgICBpbnN0YW5jZS5pc1VubW91bnRlZCA9IHRydWU7XG4gICAgfSwgcGFyZW50U3VzcGVuc2UpO1xuICAgIGlmICghIShwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gXCJwcm9kdWN0aW9uXCIpIHx8IF9fVlVFX1BST0RfREVWVE9PTFNfXykge1xuICAgICAgZGV2dG9vbHNDb21wb25lbnRSZW1vdmVkKGluc3RhbmNlKTtcbiAgICB9XG4gIH07XG4gIGNvbnN0IHVubW91bnRDaGlsZHJlbiA9IChjaGlsZHJlbiwgcGFyZW50Q29tcG9uZW50LCBwYXJlbnRTdXNwZW5zZSwgZG9SZW1vdmUgPSBmYWxzZSwgb3B0aW1pemVkID0gZmFsc2UsIHN0YXJ0ID0gMCkgPT4ge1xuICAgIGZvciAobGV0IGkgPSBzdGFydDsgaSA8IGNoaWxkcmVuLmxlbmd0aDsgaSsrKSB7XG4gICAgICB1bm1vdW50KGNoaWxkcmVuW2ldLCBwYXJlbnRDb21wb25lbnQsIHBhcmVudFN1c3BlbnNlLCBkb1JlbW92ZSwgb3B0aW1pemVkKTtcbiAgICB9XG4gIH07XG4gIGNvbnN0IGdldE5leHRIb3N0Tm9kZSA9ICh2bm9kZSkgPT4ge1xuICAgIGlmICh2bm9kZS5zaGFwZUZsYWcgJiA2KSB7XG4gICAgICByZXR1cm4gZ2V0TmV4dEhvc3ROb2RlKHZub2RlLmNvbXBvbmVudC5zdWJUcmVlKTtcbiAgICB9XG4gICAgaWYgKHZub2RlLnNoYXBlRmxhZyAmIDEyOCkge1xuICAgICAgcmV0dXJuIHZub2RlLnN1c3BlbnNlLm5leHQoKTtcbiAgICB9XG4gICAgY29uc3QgZWwgPSBob3N0TmV4dFNpYmxpbmcodm5vZGUuYW5jaG9yIHx8IHZub2RlLmVsKTtcbiAgICBjb25zdCB0ZWxlcG9ydEVuZCA9IGVsICYmIGVsW1RlbGVwb3J0RW5kS2V5XTtcbiAgICByZXR1cm4gdGVsZXBvcnRFbmQgPyBob3N0TmV4dFNpYmxpbmcodGVsZXBvcnRFbmQpIDogZWw7XG4gIH07XG4gIGxldCBpc0ZsdXNoaW5nID0gZmFsc2U7XG4gIGNvbnN0IHJlbmRlciA9ICh2bm9kZSwgY29udGFpbmVyLCBuYW1lc3BhY2UpID0+IHtcbiAgICBsZXQgaW5zdGFuY2U7XG4gICAgaWYgKHZub2RlID09IG51bGwpIHtcbiAgICAgIGlmIChjb250YWluZXIuX3Zub2RlKSB7XG4gICAgICAgIHVubW91bnQoY29udGFpbmVyLl92bm9kZSwgbnVsbCwgbnVsbCwgdHJ1ZSk7XG4gICAgICAgIGluc3RhbmNlID0gY29udGFpbmVyLl92bm9kZS5jb21wb25lbnQ7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHBhdGNoKFxuICAgICAgICBjb250YWluZXIuX3Zub2RlIHx8IG51bGwsXG4gICAgICAgIHZub2RlLFxuICAgICAgICBjb250YWluZXIsXG4gICAgICAgIG51bGwsXG4gICAgICAgIG51bGwsXG4gICAgICAgIG51bGwsXG4gICAgICAgIG5hbWVzcGFjZVxuICAgICAgKTtcbiAgICB9XG4gICAgY29udGFpbmVyLl92bm9kZSA9IHZub2RlO1xuICAgIGlmICghaXNGbHVzaGluZykge1xuICAgICAgaXNGbHVzaGluZyA9IHRydWU7XG4gICAgICBmbHVzaFByZUZsdXNoQ2JzKGluc3RhbmNlKTtcbiAgICAgIGZsdXNoUG9zdEZsdXNoQ2JzKCk7XG4gICAgICBpc0ZsdXNoaW5nID0gZmFsc2U7XG4gICAgfVxuICB9O1xuICBjb25zdCBpbnRlcm5hbHMgPSB7XG4gICAgcDogcGF0Y2gsXG4gICAgdW06IHVubW91bnQsXG4gICAgbTogbW92ZSxcbiAgICByOiByZW1vdmUsXG4gICAgbXQ6IG1vdW50Q29tcG9uZW50LFxuICAgIG1jOiBtb3VudENoaWxkcmVuLFxuICAgIHBjOiBwYXRjaENoaWxkcmVuLFxuICAgIHBiYzogcGF0Y2hCbG9ja0NoaWxkcmVuLFxuICAgIG46IGdldE5leHRIb3N0Tm9kZSxcbiAgICBvOiBvcHRpb25zXG4gIH07XG4gIGxldCBoeWRyYXRlO1xuICBsZXQgaHlkcmF0ZU5vZGU7XG4gIGlmIChjcmVhdGVIeWRyYXRpb25GbnMpIHtcbiAgICBbaHlkcmF0ZSwgaHlkcmF0ZU5vZGVdID0gY3JlYXRlSHlkcmF0aW9uRm5zKFxuICAgICAgaW50ZXJuYWxzXG4gICAgKTtcbiAgfVxuICByZXR1cm4ge1xuICAgIHJlbmRlcixcbiAgICBoeWRyYXRlLFxuICAgIGNyZWF0ZUFwcDogY3JlYXRlQXBwQVBJKHJlbmRlciwgaHlkcmF0ZSlcbiAgfTtcbn1cbmZ1bmN0aW9uIHJlc29sdmVDaGlsZHJlbk5hbWVzcGFjZSh7IHR5cGUsIHByb3BzIH0sIGN1cnJlbnROYW1lc3BhY2UpIHtcbiAgcmV0dXJuIGN1cnJlbnROYW1lc3BhY2UgPT09IFwic3ZnXCIgJiYgdHlwZSA9PT0gXCJmb3JlaWduT2JqZWN0XCIgfHwgY3VycmVudE5hbWVzcGFjZSA9PT0gXCJtYXRobWxcIiAmJiB0eXBlID09PSBcImFubm90YXRpb24teG1sXCIgJiYgcHJvcHMgJiYgcHJvcHMuZW5jb2RpbmcgJiYgcHJvcHMuZW5jb2RpbmcuaW5jbHVkZXMoXCJodG1sXCIpID8gdm9pZCAwIDogY3VycmVudE5hbWVzcGFjZTtcbn1cbmZ1bmN0aW9uIHRvZ2dsZVJlY3Vyc2UoeyBlZmZlY3QsIGpvYiB9LCBhbGxvd2VkKSB7XG4gIGlmIChhbGxvd2VkKSB7XG4gICAgZWZmZWN0LmZsYWdzIHw9IDMyO1xuICAgIGpvYi5mbGFncyB8PSA0O1xuICB9IGVsc2Uge1xuICAgIGVmZmVjdC5mbGFncyAmPSAtMzM7XG4gICAgam9iLmZsYWdzICY9IC01O1xuICB9XG59XG5mdW5jdGlvbiBuZWVkVHJhbnNpdGlvbihwYXJlbnRTdXNwZW5zZSwgdHJhbnNpdGlvbikge1xuICByZXR1cm4gKCFwYXJlbnRTdXNwZW5zZSB8fCBwYXJlbnRTdXNwZW5zZSAmJiAhcGFyZW50U3VzcGVuc2UucGVuZGluZ0JyYW5jaCkgJiYgdHJhbnNpdGlvbiAmJiAhdHJhbnNpdGlvbi5wZXJzaXN0ZWQ7XG59XG5mdW5jdGlvbiB0cmF2ZXJzZVN0YXRpY0NoaWxkcmVuKG4xLCBuMiwgc2hhbGxvdyA9IGZhbHNlKSB7XG4gIGNvbnN0IGNoMSA9IG4xLmNoaWxkcmVuO1xuICBjb25zdCBjaDIgPSBuMi5jaGlsZHJlbjtcbiAgaWYgKGlzQXJyYXkoY2gxKSAmJiBpc0FycmF5KGNoMikpIHtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGNoMS5sZW5ndGg7IGkrKykge1xuICAgICAgY29uc3QgYzEgPSBjaDFbaV07XG4gICAgICBsZXQgYzIgPSBjaDJbaV07XG4gICAgICBpZiAoYzIuc2hhcGVGbGFnICYgMSAmJiAhYzIuZHluYW1pY0NoaWxkcmVuKSB7XG4gICAgICAgIGlmIChjMi5wYXRjaEZsYWcgPD0gMCB8fCBjMi5wYXRjaEZsYWcgPT09IDMyKSB7XG4gICAgICAgICAgYzIgPSBjaDJbaV0gPSBjbG9uZUlmTW91bnRlZChjaDJbaV0pO1xuICAgICAgICAgIGMyLmVsID0gYzEuZWw7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCFzaGFsbG93ICYmIGMyLnBhdGNoRmxhZyAhPT0gLTIpXG4gICAgICAgICAgdHJhdmVyc2VTdGF0aWNDaGlsZHJlbihjMSwgYzIpO1xuICAgICAgfVxuICAgICAgaWYgKGMyLnR5cGUgPT09IFRleHQpIHtcbiAgICAgICAgaWYgKGMyLnBhdGNoRmxhZyA9PT0gLTEpIHtcbiAgICAgICAgICBjMiA9IGNoMltpXSA9IGNsb25lSWZNb3VudGVkKGMyKTtcbiAgICAgICAgfVxuICAgICAgICBjMi5lbCA9IGMxLmVsO1xuICAgICAgfVxuICAgICAgaWYgKGMyLnR5cGUgPT09IENvbW1lbnQgJiYgIWMyLmVsKSB7XG4gICAgICAgIGMyLmVsID0gYzEuZWw7XG4gICAgICB9XG4gICAgICBpZiAoISEocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09IFwicHJvZHVjdGlvblwiKSkge1xuICAgICAgICBjMi5lbCAmJiAoYzIuZWwuX192bm9kZSA9IGMyKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cbmZ1bmN0aW9uIGdldFNlcXVlbmNlKGFycikge1xuICBjb25zdCBwID0gYXJyLnNsaWNlKCk7XG4gIGNvbnN0IHJlc3VsdCA9IFswXTtcbiAgbGV0IGksIGosIHUsIHYsIGM7XG4gIGNvbnN0IGxlbiA9IGFyci5sZW5ndGg7XG4gIGZvciAoaSA9IDA7IGkgPCBsZW47IGkrKykge1xuICAgIGNvbnN0IGFyckkgPSBhcnJbaV07XG4gICAgaWYgKGFyckkgIT09IDApIHtcbiAgICAgIGogPSByZXN1bHRbcmVzdWx0Lmxlbmd0aCAtIDFdO1xuICAgICAgaWYgKGFycltqXSA8IGFyckkpIHtcbiAgICAgICAgcFtpXSA9IGo7XG4gICAgICAgIHJlc3VsdC5wdXNoKGkpO1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cbiAgICAgIHUgPSAwO1xuICAgICAgdiA9IHJlc3VsdC5sZW5ndGggLSAxO1xuICAgICAgd2hpbGUgKHUgPCB2KSB7XG4gICAgICAgIGMgPSB1ICsgdiA+PiAxO1xuICAgICAgICBpZiAoYXJyW3Jlc3VsdFtjXV0gPCBhcnJJKSB7XG4gICAgICAgICAgdSA9IGMgKyAxO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHYgPSBjO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBpZiAoYXJySSA8IGFycltyZXN1bHRbdV1dKSB7XG4gICAgICAgIGlmICh1ID4gMCkge1xuICAgICAgICAgIHBbaV0gPSByZXN1bHRbdSAtIDFdO1xuICAgICAgICB9XG4gICAgICAgIHJlc3VsdFt1XSA9IGk7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIHUgPSByZXN1bHQubGVuZ3RoO1xuICB2ID0gcmVzdWx0W3UgLSAxXTtcbiAgd2hpbGUgKHUtLSA+IDApIHtcbiAgICByZXN1bHRbdV0gPSB2O1xuICAgIHYgPSBwW3ZdO1xuICB9XG4gIHJldHVybiByZXN1bHQ7XG59XG5mdW5jdGlvbiBsb2NhdGVOb25IeWRyYXRlZEFzeW5jUm9vdChpbnN0YW5jZSkge1xuICBjb25zdCBzdWJDb21wb25lbnQgPSBpbnN0YW5jZS5zdWJUcmVlLmNvbXBvbmVudDtcbiAgaWYgKHN1YkNvbXBvbmVudCkge1xuICAgIGlmIChzdWJDb21wb25lbnQuYXN5bmNEZXAgJiYgIXN1YkNvbXBvbmVudC5hc3luY1Jlc29sdmVkKSB7XG4gICAgICByZXR1cm4gc3ViQ29tcG9uZW50O1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gbG9jYXRlTm9uSHlkcmF0ZWRBc3luY1Jvb3Qoc3ViQ29tcG9uZW50KTtcbiAgICB9XG4gIH1cbn1cbmZ1bmN0aW9uIGludmFsaWRhdGVNb3VudChob29rcykge1xuICBpZiAoaG9va3MpIHtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGhvb2tzLmxlbmd0aDsgaSsrKVxuICAgICAgaG9va3NbaV0uZmxhZ3MgfD0gODtcbiAgfVxufVxuZnVuY3Rpb24gcmVzb2x2ZUFzeW5jQ29tcG9uZW50UGxhY2Vob2xkZXIoYW5jaG9yVm5vZGUpIHtcbiAgaWYgKGFuY2hvclZub2RlLnBsYWNlaG9sZGVyKSB7XG4gICAgcmV0dXJuIGFuY2hvclZub2RlLnBsYWNlaG9sZGVyO1xuICB9XG4gIGNvbnN0IGluc3RhbmNlID0gYW5jaG9yVm5vZGUuY29tcG9uZW50O1xuICBpZiAoaW5zdGFuY2UpIHtcbiAgICByZXR1cm4gcmVzb2x2ZUFzeW5jQ29tcG9uZW50UGxhY2Vob2xkZXIoaW5zdGFuY2Uuc3ViVHJlZSk7XG4gIH1cbiAgcmV0dXJuIG51bGw7XG59XG5cbmNvbnN0IGlzU3VzcGVuc2UgPSAodHlwZSkgPT4gdHlwZS5fX2lzU3VzcGVuc2U7XG5sZXQgc3VzcGVuc2VJZCA9IDA7XG5jb25zdCBTdXNwZW5zZUltcGwgPSB7XG4gIG5hbWU6IFwiU3VzcGVuc2VcIixcbiAgLy8gSW4gb3JkZXIgdG8gbWFrZSBTdXNwZW5zZSB0cmVlLXNoYWthYmxlLCB3ZSBuZWVkIHRvIGF2b2lkIGltcG9ydGluZyBpdFxuICAvLyBkaXJlY3RseSBpbiB0aGUgcmVuZGVyZXIuIFRoZSByZW5kZXJlciBjaGVja3MgZm9yIHRoZSBfX2lzU3VzcGVuc2UgZmxhZ1xuICAvLyBvbiBhIHZub2RlJ3MgdHlwZSBhbmQgY2FsbHMgdGhlIGBwcm9jZXNzYCBtZXRob2QsIHBhc3NpbmcgaW4gcmVuZGVyZXJcbiAgLy8gaW50ZXJuYWxzLlxuICBfX2lzU3VzcGVuc2U6IHRydWUsXG4gIHByb2Nlc3MobjEsIG4yLCBjb250YWluZXIsIGFuY2hvciwgcGFyZW50Q29tcG9uZW50LCBwYXJlbnRTdXNwZW5zZSwgbmFtZXNwYWNlLCBzbG90U2NvcGVJZHMsIG9wdGltaXplZCwgcmVuZGVyZXJJbnRlcm5hbHMpIHtcbiAgICBpZiAobjEgPT0gbnVsbCkge1xuICAgICAgbW91bnRTdXNwZW5zZShcbiAgICAgICAgbjIsXG4gICAgICAgIGNvbnRhaW5lcixcbiAgICAgICAgYW5jaG9yLFxuICAgICAgICBwYXJlbnRDb21wb25lbnQsXG4gICAgICAgIHBhcmVudFN1c3BlbnNlLFxuICAgICAgICBuYW1lc3BhY2UsXG4gICAgICAgIHNsb3RTY29wZUlkcyxcbiAgICAgICAgb3B0aW1pemVkLFxuICAgICAgICByZW5kZXJlckludGVybmFsc1xuICAgICAgKTtcbiAgICB9IGVsc2Uge1xuICAgICAgaWYgKHBhcmVudFN1c3BlbnNlICYmIHBhcmVudFN1c3BlbnNlLmRlcHMgPiAwICYmICFuMS5zdXNwZW5zZS5pc0luRmFsbGJhY2spIHtcbiAgICAgICAgbjIuc3VzcGVuc2UgPSBuMS5zdXNwZW5zZTtcbiAgICAgICAgbjIuc3VzcGVuc2Uudm5vZGUgPSBuMjtcbiAgICAgICAgbjIuZWwgPSBuMS5lbDtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgcGF0Y2hTdXNwZW5zZShcbiAgICAgICAgbjEsXG4gICAgICAgIG4yLFxuICAgICAgICBjb250YWluZXIsXG4gICAgICAgIGFuY2hvcixcbiAgICAgICAgcGFyZW50Q29tcG9uZW50LFxuICAgICAgICBuYW1lc3BhY2UsXG4gICAgICAgIHNsb3RTY29wZUlkcyxcbiAgICAgICAgb3B0aW1pemVkLFxuICAgICAgICByZW5kZXJlckludGVybmFsc1xuICAgICAgKTtcbiAgICB9XG4gIH0sXG4gIGh5ZHJhdGU6IGh5ZHJhdGVTdXNwZW5zZSxcbiAgbm9ybWFsaXplOiBub3JtYWxpemVTdXNwZW5zZUNoaWxkcmVuXG59O1xuY29uc3QgU3VzcGVuc2UgPSBTdXNwZW5zZUltcGwgO1xuZnVuY3Rpb24gdHJpZ2dlckV2ZW50KHZub2RlLCBuYW1lKSB7XG4gIGNvbnN0IGV2ZW50TGlzdGVuZXIgPSB2bm9kZS5wcm9wcyAmJiB2bm9kZS5wcm9wc1tuYW1lXTtcbiAgaWYgKGlzRnVuY3Rpb24oZXZlbnRMaXN0ZW5lcikpIHtcbiAgICBldmVudExpc3RlbmVyKCk7XG4gIH1cbn1cbmZ1bmN0aW9uIG1vdW50U3VzcGVuc2Uodm5vZGUsIGNvbnRhaW5lciwgYW5jaG9yLCBwYXJlbnRDb21wb25lbnQsIHBhcmVudFN1c3BlbnNlLCBuYW1lc3BhY2UsIHNsb3RTY29wZUlkcywgb3B0aW1pemVkLCByZW5kZXJlckludGVybmFscykge1xuICBjb25zdCB7XG4gICAgcDogcGF0Y2gsXG4gICAgbzogeyBjcmVhdGVFbGVtZW50IH1cbiAgfSA9IHJlbmRlcmVySW50ZXJuYWxzO1xuICBjb25zdCBoaWRkZW5Db250YWluZXIgPSBjcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICBjb25zdCBzdXNwZW5zZSA9IHZub2RlLnN1c3BlbnNlID0gY3JlYXRlU3VzcGVuc2VCb3VuZGFyeShcbiAgICB2bm9kZSxcbiAgICBwYXJlbnRTdXNwZW5zZSxcbiAgICBwYXJlbnRDb21wb25lbnQsXG4gICAgY29udGFpbmVyLFxuICAgIGhpZGRlbkNvbnRhaW5lcixcbiAgICBhbmNob3IsXG4gICAgbmFtZXNwYWNlLFxuICAgIHNsb3RTY29wZUlkcyxcbiAgICBvcHRpbWl6ZWQsXG4gICAgcmVuZGVyZXJJbnRlcm5hbHNcbiAgKTtcbiAgcGF0Y2goXG4gICAgbnVsbCxcbiAgICBzdXNwZW5zZS5wZW5kaW5nQnJhbmNoID0gdm5vZGUuc3NDb250ZW50LFxuICAgIGhpZGRlbkNvbnRhaW5lcixcbiAgICBudWxsLFxuICAgIHBhcmVudENvbXBvbmVudCxcbiAgICBzdXNwZW5zZSxcbiAgICBuYW1lc3BhY2UsXG4gICAgc2xvdFNjb3BlSWRzXG4gICk7XG4gIGlmIChzdXNwZW5zZS5kZXBzID4gMCkge1xuICAgIHRyaWdnZXJFdmVudCh2bm9kZSwgXCJvblBlbmRpbmdcIik7XG4gICAgdHJpZ2dlckV2ZW50KHZub2RlLCBcIm9uRmFsbGJhY2tcIik7XG4gICAgcGF0Y2goXG4gICAgICBudWxsLFxuICAgICAgdm5vZGUuc3NGYWxsYmFjayxcbiAgICAgIGNvbnRhaW5lcixcbiAgICAgIGFuY2hvcixcbiAgICAgIHBhcmVudENvbXBvbmVudCxcbiAgICAgIG51bGwsXG4gICAgICAvLyBmYWxsYmFjayB0cmVlIHdpbGwgbm90IGhhdmUgc3VzcGVuc2UgY29udGV4dFxuICAgICAgbmFtZXNwYWNlLFxuICAgICAgc2xvdFNjb3BlSWRzXG4gICAgKTtcbiAgICBzZXRBY3RpdmVCcmFuY2goc3VzcGVuc2UsIHZub2RlLnNzRmFsbGJhY2spO1xuICB9IGVsc2Uge1xuICAgIHN1c3BlbnNlLnJlc29sdmUoZmFsc2UsIHRydWUpO1xuICB9XG59XG5mdW5jdGlvbiBwYXRjaFN1c3BlbnNlKG4xLCBuMiwgY29udGFpbmVyLCBhbmNob3IsIHBhcmVudENvbXBvbmVudCwgbmFtZXNwYWNlLCBzbG90U2NvcGVJZHMsIG9wdGltaXplZCwgeyBwOiBwYXRjaCwgdW06IHVubW91bnQsIG86IHsgY3JlYXRlRWxlbWVudCB9IH0pIHtcbiAgY29uc3Qgc3VzcGVuc2UgPSBuMi5zdXNwZW5zZSA9IG4xLnN1c3BlbnNlO1xuICBzdXNwZW5zZS52bm9kZSA9IG4yO1xuICBuMi5lbCA9IG4xLmVsO1xuICBjb25zdCBuZXdCcmFuY2ggPSBuMi5zc0NvbnRlbnQ7XG4gIGNvbnN0IG5ld0ZhbGxiYWNrID0gbjIuc3NGYWxsYmFjaztcbiAgY29uc3QgeyBhY3RpdmVCcmFuY2gsIHBlbmRpbmdCcmFuY2gsIGlzSW5GYWxsYmFjaywgaXNIeWRyYXRpbmcgfSA9IHN1c3BlbnNlO1xuICBpZiAocGVuZGluZ0JyYW5jaCkge1xuICAgIHN1c3BlbnNlLnBlbmRpbmdCcmFuY2ggPSBuZXdCcmFuY2g7XG4gICAgaWYgKGlzU2FtZVZOb2RlVHlwZShwZW5kaW5nQnJhbmNoLCBuZXdCcmFuY2gpKSB7XG4gICAgICBwYXRjaChcbiAgICAgICAgcGVuZGluZ0JyYW5jaCxcbiAgICAgICAgbmV3QnJhbmNoLFxuICAgICAgICBzdXNwZW5zZS5oaWRkZW5Db250YWluZXIsXG4gICAgICAgIG51bGwsXG4gICAgICAgIHBhcmVudENvbXBvbmVudCxcbiAgICAgICAgc3VzcGVuc2UsXG4gICAgICAgIG5hbWVzcGFjZSxcbiAgICAgICAgc2xvdFNjb3BlSWRzLFxuICAgICAgICBvcHRpbWl6ZWRcbiAgICAgICk7XG4gICAgICBpZiAoc3VzcGVuc2UuZGVwcyA8PSAwKSB7XG4gICAgICAgIHN1c3BlbnNlLnJlc29sdmUoKTtcbiAgICAgIH0gZWxzZSBpZiAoaXNJbkZhbGxiYWNrKSB7XG4gICAgICAgIGlmICghaXNIeWRyYXRpbmcpIHtcbiAgICAgICAgICBwYXRjaChcbiAgICAgICAgICAgIGFjdGl2ZUJyYW5jaCxcbiAgICAgICAgICAgIG5ld0ZhbGxiYWNrLFxuICAgICAgICAgICAgY29udGFpbmVyLFxuICAgICAgICAgICAgYW5jaG9yLFxuICAgICAgICAgICAgcGFyZW50Q29tcG9uZW50LFxuICAgICAgICAgICAgbnVsbCxcbiAgICAgICAgICAgIC8vIGZhbGxiYWNrIHRyZWUgd2lsbCBub3QgaGF2ZSBzdXNwZW5zZSBjb250ZXh0XG4gICAgICAgICAgICBuYW1lc3BhY2UsXG4gICAgICAgICAgICBzbG90U2NvcGVJZHMsXG4gICAgICAgICAgICBvcHRpbWl6ZWRcbiAgICAgICAgICApO1xuICAgICAgICAgIHNldEFjdGl2ZUJyYW5jaChzdXNwZW5zZSwgbmV3RmFsbGJhY2spO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHN1c3BlbnNlLnBlbmRpbmdJZCA9IHN1c3BlbnNlSWQrKztcbiAgICAgIGlmIChpc0h5ZHJhdGluZykge1xuICAgICAgICBzdXNwZW5zZS5pc0h5ZHJhdGluZyA9IGZhbHNlO1xuICAgICAgICBzdXNwZW5zZS5hY3RpdmVCcmFuY2ggPSBwZW5kaW5nQnJhbmNoO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdW5tb3VudChwZW5kaW5nQnJhbmNoLCBwYXJlbnRDb21wb25lbnQsIHN1c3BlbnNlKTtcbiAgICAgIH1cbiAgICAgIHN1c3BlbnNlLmRlcHMgPSAwO1xuICAgICAgc3VzcGVuc2UuZWZmZWN0cy5sZW5ndGggPSAwO1xuICAgICAgc3VzcGVuc2UuaGlkZGVuQ29udGFpbmVyID0gY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgICAgIGlmIChpc0luRmFsbGJhY2spIHtcbiAgICAgICAgcGF0Y2goXG4gICAgICAgICAgbnVsbCxcbiAgICAgICAgICBuZXdCcmFuY2gsXG4gICAgICAgICAgc3VzcGVuc2UuaGlkZGVuQ29udGFpbmVyLFxuICAgICAgICAgIG51bGwsXG4gICAgICAgICAgcGFyZW50Q29tcG9uZW50LFxuICAgICAgICAgIHN1c3BlbnNlLFxuICAgICAgICAgIG5hbWVzcGFjZSxcbiAgICAgICAgICBzbG90U2NvcGVJZHMsXG4gICAgICAgICAgb3B0aW1pemVkXG4gICAgICAgICk7XG4gICAgICAgIGlmIChzdXNwZW5zZS5kZXBzIDw9IDApIHtcbiAgICAgICAgICBzdXNwZW5zZS5yZXNvbHZlKCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcGF0Y2goXG4gICAgICAgICAgICBhY3RpdmVCcmFuY2gsXG4gICAgICAgICAgICBuZXdGYWxsYmFjayxcbiAgICAgICAgICAgIGNvbnRhaW5lcixcbiAgICAgICAgICAgIGFuY2hvcixcbiAgICAgICAgICAgIHBhcmVudENvbXBvbmVudCxcbiAgICAgICAgICAgIG51bGwsXG4gICAgICAgICAgICAvLyBmYWxsYmFjayB0cmVlIHdpbGwgbm90IGhhdmUgc3VzcGVuc2UgY29udGV4dFxuICAgICAgICAgICAgbmFtZXNwYWNlLFxuICAgICAgICAgICAgc2xvdFNjb3BlSWRzLFxuICAgICAgICAgICAgb3B0aW1pemVkXG4gICAgICAgICAgKTtcbiAgICAgICAgICBzZXRBY3RpdmVCcmFuY2goc3VzcGVuc2UsIG5ld0ZhbGxiYWNrKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIGlmIChhY3RpdmVCcmFuY2ggJiYgaXNTYW1lVk5vZGVUeXBlKGFjdGl2ZUJyYW5jaCwgbmV3QnJhbmNoKSkge1xuICAgICAgICBwYXRjaChcbiAgICAgICAgICBhY3RpdmVCcmFuY2gsXG4gICAgICAgICAgbmV3QnJhbmNoLFxuICAgICAgICAgIGNvbnRhaW5lcixcbiAgICAgICAgICBhbmNob3IsXG4gICAgICAgICAgcGFyZW50Q29tcG9uZW50LFxuICAgICAgICAgIHN1c3BlbnNlLFxuICAgICAgICAgIG5hbWVzcGFjZSxcbiAgICAgICAgICBzbG90U2NvcGVJZHMsXG4gICAgICAgICAgb3B0aW1pemVkXG4gICAgICAgICk7XG4gICAgICAgIHN1c3BlbnNlLnJlc29sdmUodHJ1ZSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBwYXRjaChcbiAgICAgICAgICBudWxsLFxuICAgICAgICAgIG5ld0JyYW5jaCxcbiAgICAgICAgICBzdXNwZW5zZS5oaWRkZW5Db250YWluZXIsXG4gICAgICAgICAgbnVsbCxcbiAgICAgICAgICBwYXJlbnRDb21wb25lbnQsXG4gICAgICAgICAgc3VzcGVuc2UsXG4gICAgICAgICAgbmFtZXNwYWNlLFxuICAgICAgICAgIHNsb3RTY29wZUlkcyxcbiAgICAgICAgICBvcHRpbWl6ZWRcbiAgICAgICAgKTtcbiAgICAgICAgaWYgKHN1c3BlbnNlLmRlcHMgPD0gMCkge1xuICAgICAgICAgIHN1c3BlbnNlLnJlc29sdmUoKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfSBlbHNlIHtcbiAgICBpZiAoYWN0aXZlQnJhbmNoICYmIGlzU2FtZVZOb2RlVHlwZShhY3RpdmVCcmFuY2gsIG5ld0JyYW5jaCkpIHtcbiAgICAgIHBhdGNoKFxuICAgICAgICBhY3RpdmVCcmFuY2gsXG4gICAgICAgIG5ld0JyYW5jaCxcbiAgICAgICAgY29udGFpbmVyLFxuICAgICAgICBhbmNob3IsXG4gICAgICAgIHBhcmVudENvbXBvbmVudCxcbiAgICAgICAgc3VzcGVuc2UsXG4gICAgICAgIG5hbWVzcGFjZSxcbiAgICAgICAgc2xvdFNjb3BlSWRzLFxuICAgICAgICBvcHRpbWl6ZWRcbiAgICAgICk7XG4gICAgICBzZXRBY3RpdmVCcmFuY2goc3VzcGVuc2UsIG5ld0JyYW5jaCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRyaWdnZXJFdmVudChuMiwgXCJvblBlbmRpbmdcIik7XG4gICAgICBzdXNwZW5zZS5wZW5kaW5nQnJhbmNoID0gbmV3QnJhbmNoO1xuICAgICAgaWYgKG5ld0JyYW5jaC5zaGFwZUZsYWcgJiA1MTIpIHtcbiAgICAgICAgc3VzcGVuc2UucGVuZGluZ0lkID0gbmV3QnJhbmNoLmNvbXBvbmVudC5zdXNwZW5zZUlkO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgc3VzcGVuc2UucGVuZGluZ0lkID0gc3VzcGVuc2VJZCsrO1xuICAgICAgfVxuICAgICAgcGF0Y2goXG4gICAgICAgIG51bGwsXG4gICAgICAgIG5ld0JyYW5jaCxcbiAgICAgICAgc3VzcGVuc2UuaGlkZGVuQ29udGFpbmVyLFxuICAgICAgICBudWxsLFxuICAgICAgICBwYXJlbnRDb21wb25lbnQsXG4gICAgICAgIHN1c3BlbnNlLFxuICAgICAgICBuYW1lc3BhY2UsXG4gICAgICAgIHNsb3RTY29wZUlkcyxcbiAgICAgICAgb3B0aW1pemVkXG4gICAgICApO1xuICAgICAgaWYgKHN1c3BlbnNlLmRlcHMgPD0gMCkge1xuICAgICAgICBzdXNwZW5zZS5yZXNvbHZlKCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjb25zdCB7IHRpbWVvdXQsIHBlbmRpbmdJZCB9ID0gc3VzcGVuc2U7XG4gICAgICAgIGlmICh0aW1lb3V0ID4gMCkge1xuICAgICAgICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICAgICAgaWYgKHN1c3BlbnNlLnBlbmRpbmdJZCA9PT0gcGVuZGluZ0lkKSB7XG4gICAgICAgICAgICAgIHN1c3BlbnNlLmZhbGxiYWNrKG5ld0ZhbGxiYWNrKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9LCB0aW1lb3V0KTtcbiAgICAgICAgfSBlbHNlIGlmICh0aW1lb3V0ID09PSAwKSB7XG4gICAgICAgICAgc3VzcGVuc2UuZmFsbGJhY2sobmV3RmFsbGJhY2spO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG59XG5sZXQgaGFzV2FybmVkID0gZmFsc2U7XG5mdW5jdGlvbiBjcmVhdGVTdXNwZW5zZUJvdW5kYXJ5KHZub2RlLCBwYXJlbnRTdXNwZW5zZSwgcGFyZW50Q29tcG9uZW50LCBjb250YWluZXIsIGhpZGRlbkNvbnRhaW5lciwgYW5jaG9yLCBuYW1lc3BhY2UsIHNsb3RTY29wZUlkcywgb3B0aW1pemVkLCByZW5kZXJlckludGVybmFscywgaXNIeWRyYXRpbmcgPSBmYWxzZSkge1xuICBpZiAoISEocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09IFwicHJvZHVjdGlvblwiKSAmJiB0cnVlICYmICFoYXNXYXJuZWQpIHtcbiAgICBoYXNXYXJuZWQgPSB0cnVlO1xuICAgIGNvbnNvbGVbY29uc29sZS5pbmZvID8gXCJpbmZvXCIgOiBcImxvZ1wiXShcbiAgICAgIGA8U3VzcGVuc2U+IGlzIGFuIGV4cGVyaW1lbnRhbCBmZWF0dXJlIGFuZCBpdHMgQVBJIHdpbGwgbGlrZWx5IGNoYW5nZS5gXG4gICAgKTtcbiAgfVxuICBjb25zdCB7XG4gICAgcDogcGF0Y2gsXG4gICAgbTogbW92ZSxcbiAgICB1bTogdW5tb3VudCxcbiAgICBuOiBuZXh0LFxuICAgIG86IHsgcGFyZW50Tm9kZSwgcmVtb3ZlIH1cbiAgfSA9IHJlbmRlcmVySW50ZXJuYWxzO1xuICBsZXQgcGFyZW50U3VzcGVuc2VJZDtcbiAgY29uc3QgaXNTdXNwZW5zaWJsZSA9IGlzVk5vZGVTdXNwZW5zaWJsZSh2bm9kZSk7XG4gIGlmIChpc1N1c3BlbnNpYmxlKSB7XG4gICAgaWYgKHBhcmVudFN1c3BlbnNlICYmIHBhcmVudFN1c3BlbnNlLnBlbmRpbmdCcmFuY2gpIHtcbiAgICAgIHBhcmVudFN1c3BlbnNlSWQgPSBwYXJlbnRTdXNwZW5zZS5wZW5kaW5nSWQ7XG4gICAgICBwYXJlbnRTdXNwZW5zZS5kZXBzKys7XG4gICAgfVxuICB9XG4gIGNvbnN0IHRpbWVvdXQgPSB2bm9kZS5wcm9wcyA/IHRvTnVtYmVyKHZub2RlLnByb3BzLnRpbWVvdXQpIDogdm9pZCAwO1xuICBpZiAoISEocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09IFwicHJvZHVjdGlvblwiKSkge1xuICAgIGFzc2VydE51bWJlcih0aW1lb3V0LCBgU3VzcGVuc2UgdGltZW91dGApO1xuICB9XG4gIGNvbnN0IGluaXRpYWxBbmNob3IgPSBhbmNob3I7XG4gIGNvbnN0IHN1c3BlbnNlID0ge1xuICAgIHZub2RlLFxuICAgIHBhcmVudDogcGFyZW50U3VzcGVuc2UsXG4gICAgcGFyZW50Q29tcG9uZW50LFxuICAgIG5hbWVzcGFjZSxcbiAgICBjb250YWluZXIsXG4gICAgaGlkZGVuQ29udGFpbmVyLFxuICAgIGRlcHM6IDAsXG4gICAgcGVuZGluZ0lkOiBzdXNwZW5zZUlkKyssXG4gICAgdGltZW91dDogdHlwZW9mIHRpbWVvdXQgPT09IFwibnVtYmVyXCIgPyB0aW1lb3V0IDogLTEsXG4gICAgYWN0aXZlQnJhbmNoOiBudWxsLFxuICAgIHBlbmRpbmdCcmFuY2g6IG51bGwsXG4gICAgaXNJbkZhbGxiYWNrOiAhaXNIeWRyYXRpbmcsXG4gICAgaXNIeWRyYXRpbmcsXG4gICAgaXNVbm1vdW50ZWQ6IGZhbHNlLFxuICAgIGVmZmVjdHM6IFtdLFxuICAgIHJlc29sdmUocmVzdW1lID0gZmFsc2UsIHN5bmMgPSBmYWxzZSkge1xuICAgICAgaWYgKCEhKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSBcInByb2R1Y3Rpb25cIikpIHtcbiAgICAgICAgaWYgKCFyZXN1bWUgJiYgIXN1c3BlbnNlLnBlbmRpbmdCcmFuY2gpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgICAgICBgc3VzcGVuc2UucmVzb2x2ZSgpIGlzIGNhbGxlZCB3aXRob3V0IGEgcGVuZGluZyBicmFuY2guYFxuICAgICAgICAgICk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHN1c3BlbnNlLmlzVW5tb3VudGVkKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICAgICAgYHN1c3BlbnNlLnJlc29sdmUoKSBpcyBjYWxsZWQgb24gYW4gYWxyZWFkeSB1bm1vdW50ZWQgc3VzcGVuc2UgYm91bmRhcnkuYFxuICAgICAgICAgICk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGNvbnN0IHtcbiAgICAgICAgdm5vZGU6IHZub2RlMixcbiAgICAgICAgYWN0aXZlQnJhbmNoLFxuICAgICAgICBwZW5kaW5nQnJhbmNoLFxuICAgICAgICBwZW5kaW5nSWQsXG4gICAgICAgIGVmZmVjdHMsXG4gICAgICAgIHBhcmVudENvbXBvbmVudDogcGFyZW50Q29tcG9uZW50MixcbiAgICAgICAgY29udGFpbmVyOiBjb250YWluZXIyLFxuICAgICAgICBpc0luRmFsbGJhY2tcbiAgICAgIH0gPSBzdXNwZW5zZTtcbiAgICAgIGxldCBkZWxheUVudGVyID0gZmFsc2U7XG4gICAgICBpZiAoc3VzcGVuc2UuaXNIeWRyYXRpbmcpIHtcbiAgICAgICAgc3VzcGVuc2UuaXNIeWRyYXRpbmcgPSBmYWxzZTtcbiAgICAgIH0gZWxzZSBpZiAoIXJlc3VtZSkge1xuICAgICAgICBkZWxheUVudGVyID0gYWN0aXZlQnJhbmNoICYmIHBlbmRpbmdCcmFuY2gudHJhbnNpdGlvbiAmJiBwZW5kaW5nQnJhbmNoLnRyYW5zaXRpb24ubW9kZSA9PT0gXCJvdXQtaW5cIjtcbiAgICAgICAgaWYgKGRlbGF5RW50ZXIpIHtcbiAgICAgICAgICBhY3RpdmVCcmFuY2gudHJhbnNpdGlvbi5hZnRlckxlYXZlID0gKCkgPT4ge1xuICAgICAgICAgICAgaWYgKHBlbmRpbmdJZCA9PT0gc3VzcGVuc2UucGVuZGluZ0lkKSB7XG4gICAgICAgICAgICAgIG1vdmUoXG4gICAgICAgICAgICAgICAgcGVuZGluZ0JyYW5jaCxcbiAgICAgICAgICAgICAgICBjb250YWluZXIyLFxuICAgICAgICAgICAgICAgIGFuY2hvciA9PT0gaW5pdGlhbEFuY2hvciA/IG5leHQoYWN0aXZlQnJhbmNoKSA6IGFuY2hvcixcbiAgICAgICAgICAgICAgICAwXG4gICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgIHF1ZXVlUG9zdEZsdXNoQ2IoZWZmZWN0cyk7XG4gICAgICAgICAgICAgIGlmIChpc0luRmFsbGJhY2sgJiYgdm5vZGUyLnNzRmFsbGJhY2spIHtcbiAgICAgICAgICAgICAgICB2bm9kZTIuc3NGYWxsYmFjay5lbCA9IG51bGw7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgICAgIGlmIChhY3RpdmVCcmFuY2gpIHtcbiAgICAgICAgICBpZiAocGFyZW50Tm9kZShhY3RpdmVCcmFuY2guZWwpID09PSBjb250YWluZXIyKSB7XG4gICAgICAgICAgICBhbmNob3IgPSBuZXh0KGFjdGl2ZUJyYW5jaCk7XG4gICAgICAgICAgfVxuICAgICAgICAgIHVubW91bnQoYWN0aXZlQnJhbmNoLCBwYXJlbnRDb21wb25lbnQyLCBzdXNwZW5zZSwgdHJ1ZSk7XG4gICAgICAgICAgaWYgKCFkZWxheUVudGVyICYmIGlzSW5GYWxsYmFjayAmJiB2bm9kZTIuc3NGYWxsYmFjaykge1xuICAgICAgICAgICAgcXVldWVQb3N0UmVuZGVyRWZmZWN0KCgpID0+IHZub2RlMi5zc0ZhbGxiYWNrLmVsID0gbnVsbCwgc3VzcGVuc2UpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAoIWRlbGF5RW50ZXIpIHtcbiAgICAgICAgICBtb3ZlKHBlbmRpbmdCcmFuY2gsIGNvbnRhaW5lcjIsIGFuY2hvciwgMCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHNldEFjdGl2ZUJyYW5jaChzdXNwZW5zZSwgcGVuZGluZ0JyYW5jaCk7XG4gICAgICBzdXNwZW5zZS5wZW5kaW5nQnJhbmNoID0gbnVsbDtcbiAgICAgIHN1c3BlbnNlLmlzSW5GYWxsYmFjayA9IGZhbHNlO1xuICAgICAgbGV0IHBhcmVudCA9IHN1c3BlbnNlLnBhcmVudDtcbiAgICAgIGxldCBoYXNVbnJlc29sdmVkQW5jZXN0b3IgPSBmYWxzZTtcbiAgICAgIHdoaWxlIChwYXJlbnQpIHtcbiAgICAgICAgaWYgKHBhcmVudC5wZW5kaW5nQnJhbmNoKSB7XG4gICAgICAgICAgcGFyZW50LmVmZmVjdHMucHVzaCguLi5lZmZlY3RzKTtcbiAgICAgICAgICBoYXNVbnJlc29sdmVkQW5jZXN0b3IgPSB0cnVlO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIHBhcmVudCA9IHBhcmVudC5wYXJlbnQ7XG4gICAgICB9XG4gICAgICBpZiAoIWhhc1VucmVzb2x2ZWRBbmNlc3RvciAmJiAhZGVsYXlFbnRlcikge1xuICAgICAgICBxdWV1ZVBvc3RGbHVzaENiKGVmZmVjdHMpO1xuICAgICAgfVxuICAgICAgc3VzcGVuc2UuZWZmZWN0cyA9IFtdO1xuICAgICAgaWYgKGlzU3VzcGVuc2libGUpIHtcbiAgICAgICAgaWYgKHBhcmVudFN1c3BlbnNlICYmIHBhcmVudFN1c3BlbnNlLnBlbmRpbmdCcmFuY2ggJiYgcGFyZW50U3VzcGVuc2VJZCA9PT0gcGFyZW50U3VzcGVuc2UucGVuZGluZ0lkKSB7XG4gICAgICAgICAgcGFyZW50U3VzcGVuc2UuZGVwcy0tO1xuICAgICAgICAgIGlmIChwYXJlbnRTdXNwZW5zZS5kZXBzID09PSAwICYmICFzeW5jKSB7XG4gICAgICAgICAgICBwYXJlbnRTdXNwZW5zZS5yZXNvbHZlKCk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICB0cmlnZ2VyRXZlbnQodm5vZGUyLCBcIm9uUmVzb2x2ZVwiKTtcbiAgICB9LFxuICAgIGZhbGxiYWNrKGZhbGxiYWNrVk5vZGUpIHtcbiAgICAgIGlmICghc3VzcGVuc2UucGVuZGluZ0JyYW5jaCkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBjb25zdCB7IHZub2RlOiB2bm9kZTIsIGFjdGl2ZUJyYW5jaCwgcGFyZW50Q29tcG9uZW50OiBwYXJlbnRDb21wb25lbnQyLCBjb250YWluZXI6IGNvbnRhaW5lcjIsIG5hbWVzcGFjZTogbmFtZXNwYWNlMiB9ID0gc3VzcGVuc2U7XG4gICAgICB0cmlnZ2VyRXZlbnQodm5vZGUyLCBcIm9uRmFsbGJhY2tcIik7XG4gICAgICBjb25zdCBhbmNob3IyID0gbmV4dChhY3RpdmVCcmFuY2gpO1xuICAgICAgY29uc3QgbW91bnRGYWxsYmFjayA9ICgpID0+IHtcbiAgICAgICAgaWYgKCFzdXNwZW5zZS5pc0luRmFsbGJhY2spIHtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgcGF0Y2goXG4gICAgICAgICAgbnVsbCxcbiAgICAgICAgICBmYWxsYmFja1ZOb2RlLFxuICAgICAgICAgIGNvbnRhaW5lcjIsXG4gICAgICAgICAgYW5jaG9yMixcbiAgICAgICAgICBwYXJlbnRDb21wb25lbnQyLFxuICAgICAgICAgIG51bGwsXG4gICAgICAgICAgLy8gZmFsbGJhY2sgdHJlZSB3aWxsIG5vdCBoYXZlIHN1c3BlbnNlIGNvbnRleHRcbiAgICAgICAgICBuYW1lc3BhY2UyLFxuICAgICAgICAgIHNsb3RTY29wZUlkcyxcbiAgICAgICAgICBvcHRpbWl6ZWRcbiAgICAgICAgKTtcbiAgICAgICAgc2V0QWN0aXZlQnJhbmNoKHN1c3BlbnNlLCBmYWxsYmFja1ZOb2RlKTtcbiAgICAgIH07XG4gICAgICBjb25zdCBkZWxheUVudGVyID0gZmFsbGJhY2tWTm9kZS50cmFuc2l0aW9uICYmIGZhbGxiYWNrVk5vZGUudHJhbnNpdGlvbi5tb2RlID09PSBcIm91dC1pblwiO1xuICAgICAgaWYgKGRlbGF5RW50ZXIpIHtcbiAgICAgICAgYWN0aXZlQnJhbmNoLnRyYW5zaXRpb24uYWZ0ZXJMZWF2ZSA9IG1vdW50RmFsbGJhY2s7XG4gICAgICB9XG4gICAgICBzdXNwZW5zZS5pc0luRmFsbGJhY2sgPSB0cnVlO1xuICAgICAgdW5tb3VudChcbiAgICAgICAgYWN0aXZlQnJhbmNoLFxuICAgICAgICBwYXJlbnRDb21wb25lbnQyLFxuICAgICAgICBudWxsLFxuICAgICAgICAvLyBubyBzdXNwZW5zZSBzbyB1bm1vdW50IGhvb2tzIGZpcmUgbm93XG4gICAgICAgIHRydWVcbiAgICAgICAgLy8gc2hvdWxkUmVtb3ZlXG4gICAgICApO1xuICAgICAgaWYgKCFkZWxheUVudGVyKSB7XG4gICAgICAgIG1vdW50RmFsbGJhY2soKTtcbiAgICAgIH1cbiAgICB9LFxuICAgIG1vdmUoY29udGFpbmVyMiwgYW5jaG9yMiwgdHlwZSkge1xuICAgICAgc3VzcGVuc2UuYWN0aXZlQnJhbmNoICYmIG1vdmUoc3VzcGVuc2UuYWN0aXZlQnJhbmNoLCBjb250YWluZXIyLCBhbmNob3IyLCB0eXBlKTtcbiAgICAgIHN1c3BlbnNlLmNvbnRhaW5lciA9IGNvbnRhaW5lcjI7XG4gICAgfSxcbiAgICBuZXh0KCkge1xuICAgICAgcmV0dXJuIHN1c3BlbnNlLmFjdGl2ZUJyYW5jaCAmJiBuZXh0KHN1c3BlbnNlLmFjdGl2ZUJyYW5jaCk7XG4gICAgfSxcbiAgICByZWdpc3RlckRlcChpbnN0YW5jZSwgc2V0dXBSZW5kZXJFZmZlY3QsIG9wdGltaXplZDIpIHtcbiAgICAgIGNvbnN0IGlzSW5QZW5kaW5nU3VzcGVuc2UgPSAhIXN1c3BlbnNlLnBlbmRpbmdCcmFuY2g7XG4gICAgICBpZiAoaXNJblBlbmRpbmdTdXNwZW5zZSkge1xuICAgICAgICBzdXNwZW5zZS5kZXBzKys7XG4gICAgICB9XG4gICAgICBjb25zdCBoeWRyYXRlZEVsID0gaW5zdGFuY2Uudm5vZGUuZWw7XG4gICAgICBpbnN0YW5jZS5hc3luY0RlcC5jYXRjaCgoZXJyKSA9PiB7XG4gICAgICAgIGhhbmRsZUVycm9yKGVyciwgaW5zdGFuY2UsIDApO1xuICAgICAgfSkudGhlbigoYXN5bmNTZXR1cFJlc3VsdCkgPT4ge1xuICAgICAgICBpZiAoaW5zdGFuY2UuaXNVbm1vdW50ZWQgfHwgc3VzcGVuc2UuaXNVbm1vdW50ZWQgfHwgc3VzcGVuc2UucGVuZGluZ0lkICE9PSBpbnN0YW5jZS5zdXNwZW5zZUlkKSB7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGluc3RhbmNlLmFzeW5jUmVzb2x2ZWQgPSB0cnVlO1xuICAgICAgICBjb25zdCB7IHZub2RlOiB2bm9kZTIgfSA9IGluc3RhbmNlO1xuICAgICAgICBpZiAoISEocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09IFwicHJvZHVjdGlvblwiKSkge1xuICAgICAgICAgIHB1c2hXYXJuaW5nQ29udGV4dCh2bm9kZTIpO1xuICAgICAgICB9XG4gICAgICAgIGhhbmRsZVNldHVwUmVzdWx0KGluc3RhbmNlLCBhc3luY1NldHVwUmVzdWx0LCBmYWxzZSk7XG4gICAgICAgIGlmIChoeWRyYXRlZEVsKSB7XG4gICAgICAgICAgdm5vZGUyLmVsID0gaHlkcmF0ZWRFbDtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBwbGFjZWhvbGRlciA9ICFoeWRyYXRlZEVsICYmIGluc3RhbmNlLnN1YlRyZWUuZWw7XG4gICAgICAgIHNldHVwUmVuZGVyRWZmZWN0KFxuICAgICAgICAgIGluc3RhbmNlLFxuICAgICAgICAgIHZub2RlMixcbiAgICAgICAgICAvLyBjb21wb25lbnQgbWF5IGhhdmUgYmVlbiBtb3ZlZCBiZWZvcmUgcmVzb2x2ZS5cbiAgICAgICAgICAvLyBpZiB0aGlzIGlzIG5vdCBhIGh5ZHJhdGlvbiwgaW5zdGFuY2Uuc3ViVHJlZSB3aWxsIGJlIHRoZSBjb21tZW50XG4gICAgICAgICAgLy8gcGxhY2Vob2xkZXIuXG4gICAgICAgICAgcGFyZW50Tm9kZShoeWRyYXRlZEVsIHx8IGluc3RhbmNlLnN1YlRyZWUuZWwpLFxuICAgICAgICAgIC8vIGFuY2hvciB3aWxsIG5vdCBiZSB1c2VkIGlmIHRoaXMgaXMgaHlkcmF0aW9uLCBzbyBvbmx5IG5lZWQgdG9cbiAgICAgICAgICAvLyBjb25zaWRlciB0aGUgY29tbWVudCBwbGFjZWhvbGRlciBjYXNlLlxuICAgICAgICAgIGh5ZHJhdGVkRWwgPyBudWxsIDogbmV4dChpbnN0YW5jZS5zdWJUcmVlKSxcbiAgICAgICAgICBzdXNwZW5zZSxcbiAgICAgICAgICBuYW1lc3BhY2UsXG4gICAgICAgICAgb3B0aW1pemVkMlxuICAgICAgICApO1xuICAgICAgICBpZiAocGxhY2Vob2xkZXIpIHtcbiAgICAgICAgICB2bm9kZTIucGxhY2Vob2xkZXIgPSBudWxsO1xuICAgICAgICAgIHJlbW92ZShwbGFjZWhvbGRlcik7XG4gICAgICAgIH1cbiAgICAgICAgdXBkYXRlSE9DSG9zdEVsKGluc3RhbmNlLCB2bm9kZTIuZWwpO1xuICAgICAgICBpZiAoISEocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09IFwicHJvZHVjdGlvblwiKSkge1xuICAgICAgICAgIHBvcFdhcm5pbmdDb250ZXh0KCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGlzSW5QZW5kaW5nU3VzcGVuc2UgJiYgLS1zdXNwZW5zZS5kZXBzID09PSAwKSB7XG4gICAgICAgICAgc3VzcGVuc2UucmVzb2x2ZSgpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9LFxuICAgIHVubW91bnQocGFyZW50U3VzcGVuc2UyLCBkb1JlbW92ZSkge1xuICAgICAgc3VzcGVuc2UuaXNVbm1vdW50ZWQgPSB0cnVlO1xuICAgICAgaWYgKHN1c3BlbnNlLmFjdGl2ZUJyYW5jaCkge1xuICAgICAgICB1bm1vdW50KFxuICAgICAgICAgIHN1c3BlbnNlLmFjdGl2ZUJyYW5jaCxcbiAgICAgICAgICBwYXJlbnRDb21wb25lbnQsXG4gICAgICAgICAgcGFyZW50U3VzcGVuc2UyLFxuICAgICAgICAgIGRvUmVtb3ZlXG4gICAgICAgICk7XG4gICAgICB9XG4gICAgICBpZiAoc3VzcGVuc2UucGVuZGluZ0JyYW5jaCkge1xuICAgICAgICB1bm1vdW50KFxuICAgICAgICAgIHN1c3BlbnNlLnBlbmRpbmdCcmFuY2gsXG4gICAgICAgICAgcGFyZW50Q29tcG9uZW50LFxuICAgICAgICAgIHBhcmVudFN1c3BlbnNlMixcbiAgICAgICAgICBkb1JlbW92ZVxuICAgICAgICApO1xuICAgICAgfVxuICAgIH1cbiAgfTtcbiAgcmV0dXJuIHN1c3BlbnNlO1xufVxuZnVuY3Rpb24gaHlkcmF0ZVN1c3BlbnNlKG5vZGUsIHZub2RlLCBwYXJlbnRDb21wb25lbnQsIHBhcmVudFN1c3BlbnNlLCBuYW1lc3BhY2UsIHNsb3RTY29wZUlkcywgb3B0aW1pemVkLCByZW5kZXJlckludGVybmFscywgaHlkcmF0ZU5vZGUpIHtcbiAgY29uc3Qgc3VzcGVuc2UgPSB2bm9kZS5zdXNwZW5zZSA9IGNyZWF0ZVN1c3BlbnNlQm91bmRhcnkoXG4gICAgdm5vZGUsXG4gICAgcGFyZW50U3VzcGVuc2UsXG4gICAgcGFyZW50Q29tcG9uZW50LFxuICAgIG5vZGUucGFyZW50Tm9kZSxcbiAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tcmVzdHJpY3RlZC1nbG9iYWxzXG4gICAgZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKSxcbiAgICBudWxsLFxuICAgIG5hbWVzcGFjZSxcbiAgICBzbG90U2NvcGVJZHMsXG4gICAgb3B0aW1pemVkLFxuICAgIHJlbmRlcmVySW50ZXJuYWxzLFxuICAgIHRydWVcbiAgKTtcbiAgY29uc3QgcmVzdWx0ID0gaHlkcmF0ZU5vZGUoXG4gICAgbm9kZSxcbiAgICBzdXNwZW5zZS5wZW5kaW5nQnJhbmNoID0gdm5vZGUuc3NDb250ZW50LFxuICAgIHBhcmVudENvbXBvbmVudCxcbiAgICBzdXNwZW5zZSxcbiAgICBzbG90U2NvcGVJZHMsXG4gICAgb3B0aW1pemVkXG4gICk7XG4gIGlmIChzdXNwZW5zZS5kZXBzID09PSAwKSB7XG4gICAgc3VzcGVuc2UucmVzb2x2ZShmYWxzZSwgdHJ1ZSk7XG4gIH1cbiAgcmV0dXJuIHJlc3VsdDtcbn1cbmZ1bmN0aW9uIG5vcm1hbGl6ZVN1c3BlbnNlQ2hpbGRyZW4odm5vZGUpIHtcbiAgY29uc3QgeyBzaGFwZUZsYWcsIGNoaWxkcmVuIH0gPSB2bm9kZTtcbiAgY29uc3QgaXNTbG90Q2hpbGRyZW4gPSBzaGFwZUZsYWcgJiAzMjtcbiAgdm5vZGUuc3NDb250ZW50ID0gbm9ybWFsaXplU3VzcGVuc2VTbG90KFxuICAgIGlzU2xvdENoaWxkcmVuID8gY2hpbGRyZW4uZGVmYXVsdCA6IGNoaWxkcmVuXG4gICk7XG4gIHZub2RlLnNzRmFsbGJhY2sgPSBpc1Nsb3RDaGlsZHJlbiA/IG5vcm1hbGl6ZVN1c3BlbnNlU2xvdChjaGlsZHJlbi5mYWxsYmFjaykgOiBjcmVhdGVWTm9kZShDb21tZW50KTtcbn1cbmZ1bmN0aW9uIG5vcm1hbGl6ZVN1c3BlbnNlU2xvdChzKSB7XG4gIGxldCBibG9jaztcbiAgaWYgKGlzRnVuY3Rpb24ocykpIHtcbiAgICBjb25zdCB0cmFja0Jsb2NrID0gaXNCbG9ja1RyZWVFbmFibGVkICYmIHMuX2M7XG4gICAgaWYgKHRyYWNrQmxvY2spIHtcbiAgICAgIHMuX2QgPSBmYWxzZTtcbiAgICAgIG9wZW5CbG9jaygpO1xuICAgIH1cbiAgICBzID0gcygpO1xuICAgIGlmICh0cmFja0Jsb2NrKSB7XG4gICAgICBzLl9kID0gdHJ1ZTtcbiAgICAgIGJsb2NrID0gY3VycmVudEJsb2NrO1xuICAgICAgY2xvc2VCbG9jaygpO1xuICAgIH1cbiAgfVxuICBpZiAoaXNBcnJheShzKSkge1xuICAgIGNvbnN0IHNpbmdsZUNoaWxkID0gZmlsdGVyU2luZ2xlUm9vdChzKTtcbiAgICBpZiAoISEocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09IFwicHJvZHVjdGlvblwiKSAmJiAhc2luZ2xlQ2hpbGQgJiYgcy5maWx0ZXIoKGNoaWxkKSA9PiBjaGlsZCAhPT0gTlVMTF9EWU5BTUlDX0NPTVBPTkVOVCkubGVuZ3RoID4gMCkge1xuICAgICAgd2FybiQxKGA8U3VzcGVuc2U+IHNsb3RzIGV4cGVjdCBhIHNpbmdsZSByb290IG5vZGUuYCk7XG4gICAgfVxuICAgIHMgPSBzaW5nbGVDaGlsZDtcbiAgfVxuICBzID0gbm9ybWFsaXplVk5vZGUocyk7XG4gIGlmIChibG9jayAmJiAhcy5keW5hbWljQ2hpbGRyZW4pIHtcbiAgICBzLmR5bmFtaWNDaGlsZHJlbiA9IGJsb2NrLmZpbHRlcigoYykgPT4gYyAhPT0gcyk7XG4gIH1cbiAgcmV0dXJuIHM7XG59XG5mdW5jdGlvbiBxdWV1ZUVmZmVjdFdpdGhTdXNwZW5zZShmbiwgc3VzcGVuc2UpIHtcbiAgaWYgKHN1c3BlbnNlICYmIHN1c3BlbnNlLnBlbmRpbmdCcmFuY2gpIHtcbiAgICBpZiAoaXNBcnJheShmbikpIHtcbiAgICAgIHN1c3BlbnNlLmVmZmVjdHMucHVzaCguLi5mbik7XG4gICAgfSBlbHNlIHtcbiAgICAgIHN1c3BlbnNlLmVmZmVjdHMucHVzaChmbik7XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIHF1ZXVlUG9zdEZsdXNoQ2IoZm4pO1xuICB9XG59XG5mdW5jdGlvbiBzZXRBY3RpdmVCcmFuY2goc3VzcGVuc2UsIGJyYW5jaCkge1xuICBzdXNwZW5zZS5hY3RpdmVCcmFuY2ggPSBicmFuY2g7XG4gIGNvbnN0IHsgdm5vZGUsIHBhcmVudENvbXBvbmVudCB9ID0gc3VzcGVuc2U7XG4gIGxldCBlbCA9IGJyYW5jaC5lbDtcbiAgd2hpbGUgKCFlbCAmJiBicmFuY2guY29tcG9uZW50KSB7XG4gICAgYnJhbmNoID0gYnJhbmNoLmNvbXBvbmVudC5zdWJUcmVlO1xuICAgIGVsID0gYnJhbmNoLmVsO1xuICB9XG4gIHZub2RlLmVsID0gZWw7XG4gIGlmIChwYXJlbnRDb21wb25lbnQgJiYgcGFyZW50Q29tcG9uZW50LnN1YlRyZWUgPT09IHZub2RlKSB7XG4gICAgcGFyZW50Q29tcG9uZW50LnZub2RlLmVsID0gZWw7XG4gICAgdXBkYXRlSE9DSG9zdEVsKHBhcmVudENvbXBvbmVudCwgZWwpO1xuICB9XG59XG5mdW5jdGlvbiBpc1ZOb2RlU3VzcGVuc2libGUodm5vZGUpIHtcbiAgY29uc3Qgc3VzcGVuc2libGUgPSB2bm9kZS5wcm9wcyAmJiB2bm9kZS5wcm9wcy5zdXNwZW5zaWJsZTtcbiAgcmV0dXJuIHN1c3BlbnNpYmxlICE9IG51bGwgJiYgc3VzcGVuc2libGUgIT09IGZhbHNlO1xufVxuXG5jb25zdCBGcmFnbWVudCA9IC8qIEBfX1BVUkVfXyAqLyBTeW1ib2wuZm9yKFwidi1mZ3RcIik7XG5jb25zdCBUZXh0ID0gLyogQF9fUFVSRV9fICovIFN5bWJvbC5mb3IoXCJ2LXR4dFwiKTtcbmNvbnN0IENvbW1lbnQgPSAvKiBAX19QVVJFX18gKi8gU3ltYm9sLmZvcihcInYtY210XCIpO1xuY29uc3QgU3RhdGljID0gLyogQF9fUFVSRV9fICovIFN5bWJvbC5mb3IoXCJ2LXN0Y1wiKTtcbmNvbnN0IGJsb2NrU3RhY2sgPSBbXTtcbmxldCBjdXJyZW50QmxvY2sgPSBudWxsO1xuZnVuY3Rpb24gb3BlbkJsb2NrKGRpc2FibGVUcmFja2luZyA9IGZhbHNlKSB7XG4gIGJsb2NrU3RhY2sucHVzaChjdXJyZW50QmxvY2sgPSBkaXNhYmxlVHJhY2tpbmcgPyBudWxsIDogW10pO1xufVxuZnVuY3Rpb24gY2xvc2VCbG9jaygpIHtcbiAgYmxvY2tTdGFjay5wb3AoKTtcbiAgY3VycmVudEJsb2NrID0gYmxvY2tTdGFja1tibG9ja1N0YWNrLmxlbmd0aCAtIDFdIHx8IG51bGw7XG59XG5sZXQgaXNCbG9ja1RyZWVFbmFibGVkID0gMTtcbmZ1bmN0aW9uIHNldEJsb2NrVHJhY2tpbmcodmFsdWUsIGluVk9uY2UgPSBmYWxzZSkge1xuICBpc0Jsb2NrVHJlZUVuYWJsZWQgKz0gdmFsdWU7XG4gIGlmICh2YWx1ZSA8IDAgJiYgY3VycmVudEJsb2NrICYmIGluVk9uY2UpIHtcbiAgICBjdXJyZW50QmxvY2suaGFzT25jZSA9IHRydWU7XG4gIH1cbn1cbmZ1bmN0aW9uIHNldHVwQmxvY2sodm5vZGUpIHtcbiAgdm5vZGUuZHluYW1pY0NoaWxkcmVuID0gaXNCbG9ja1RyZWVFbmFibGVkID4gMCA/IGN1cnJlbnRCbG9jayB8fCBFTVBUWV9BUlIgOiBudWxsO1xuICBjbG9zZUJsb2NrKCk7XG4gIGlmIChpc0Jsb2NrVHJlZUVuYWJsZWQgPiAwICYmIGN1cnJlbnRCbG9jaykge1xuICAgIGN1cnJlbnRCbG9jay5wdXNoKHZub2RlKTtcbiAgfVxuICByZXR1cm4gdm5vZGU7XG59XG5mdW5jdGlvbiBjcmVhdGVFbGVtZW50QmxvY2sodHlwZSwgcHJvcHMsIGNoaWxkcmVuLCBwYXRjaEZsYWcsIGR5bmFtaWNQcm9wcywgc2hhcGVGbGFnKSB7XG4gIHJldHVybiBzZXR1cEJsb2NrKFxuICAgIGNyZWF0ZUJhc2VWTm9kZShcbiAgICAgIHR5cGUsXG4gICAgICBwcm9wcyxcbiAgICAgIGNoaWxkcmVuLFxuICAgICAgcGF0Y2hGbGFnLFxuICAgICAgZHluYW1pY1Byb3BzLFxuICAgICAgc2hhcGVGbGFnLFxuICAgICAgdHJ1ZVxuICAgIClcbiAgKTtcbn1cbmZ1bmN0aW9uIGNyZWF0ZUJsb2NrKHR5cGUsIHByb3BzLCBjaGlsZHJlbiwgcGF0Y2hGbGFnLCBkeW5hbWljUHJvcHMpIHtcbiAgcmV0dXJuIHNldHVwQmxvY2soXG4gICAgY3JlYXRlVk5vZGUoXG4gICAgICB0eXBlLFxuICAgICAgcHJvcHMsXG4gICAgICBjaGlsZHJlbixcbiAgICAgIHBhdGNoRmxhZyxcbiAgICAgIGR5bmFtaWNQcm9wcyxcbiAgICAgIHRydWVcbiAgICApXG4gICk7XG59XG5mdW5jdGlvbiBpc1ZOb2RlKHZhbHVlKSB7XG4gIHJldHVybiB2YWx1ZSA/IHZhbHVlLl9fdl9pc1ZOb2RlID09PSB0cnVlIDogZmFsc2U7XG59XG5mdW5jdGlvbiBpc1NhbWVWTm9kZVR5cGUobjEsIG4yKSB7XG4gIGlmICghIShwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gXCJwcm9kdWN0aW9uXCIpICYmIG4yLnNoYXBlRmxhZyAmIDYgJiYgbjEuY29tcG9uZW50KSB7XG4gICAgY29uc3QgZGlydHlJbnN0YW5jZXMgPSBobXJEaXJ0eUNvbXBvbmVudHMuZ2V0KG4yLnR5cGUpO1xuICAgIGlmIChkaXJ0eUluc3RhbmNlcyAmJiBkaXJ0eUluc3RhbmNlcy5oYXMobjEuY29tcG9uZW50KSkge1xuICAgICAgbjEuc2hhcGVGbGFnICY9IC0yNTc7XG4gICAgICBuMi5zaGFwZUZsYWcgJj0gLTUxMztcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIG4xLnR5cGUgPT09IG4yLnR5cGUgJiYgbjEua2V5ID09PSBuMi5rZXk7XG59XG5sZXQgdm5vZGVBcmdzVHJhbnNmb3JtZXI7XG5mdW5jdGlvbiB0cmFuc2Zvcm1WTm9kZUFyZ3ModHJhbnNmb3JtZXIpIHtcbiAgdm5vZGVBcmdzVHJhbnNmb3JtZXIgPSB0cmFuc2Zvcm1lcjtcbn1cbmNvbnN0IGNyZWF0ZVZOb2RlV2l0aEFyZ3NUcmFuc2Zvcm0gPSAoLi4uYXJncykgPT4ge1xuICByZXR1cm4gX2NyZWF0ZVZOb2RlKFxuICAgIC4uLnZub2RlQXJnc1RyYW5zZm9ybWVyID8gdm5vZGVBcmdzVHJhbnNmb3JtZXIoYXJncywgY3VycmVudFJlbmRlcmluZ0luc3RhbmNlKSA6IGFyZ3NcbiAgKTtcbn07XG5jb25zdCBub3JtYWxpemVLZXkgPSAoeyBrZXkgfSkgPT4ga2V5ICE9IG51bGwgPyBrZXkgOiBudWxsO1xuY29uc3Qgbm9ybWFsaXplUmVmID0gKHtcbiAgcmVmLFxuICByZWZfa2V5LFxuICByZWZfZm9yXG59KSA9PiB7XG4gIGlmICh0eXBlb2YgcmVmID09PSBcIm51bWJlclwiKSB7XG4gICAgcmVmID0gXCJcIiArIHJlZjtcbiAgfVxuICByZXR1cm4gcmVmICE9IG51bGwgPyBpc1N0cmluZyhyZWYpIHx8IGlzUmVmKHJlZikgfHwgaXNGdW5jdGlvbihyZWYpID8geyBpOiBjdXJyZW50UmVuZGVyaW5nSW5zdGFuY2UsIHI6IHJlZiwgazogcmVmX2tleSwgZjogISFyZWZfZm9yIH0gOiByZWYgOiBudWxsO1xufTtcbmZ1bmN0aW9uIGNyZWF0ZUJhc2VWTm9kZSh0eXBlLCBwcm9wcyA9IG51bGwsIGNoaWxkcmVuID0gbnVsbCwgcGF0Y2hGbGFnID0gMCwgZHluYW1pY1Byb3BzID0gbnVsbCwgc2hhcGVGbGFnID0gdHlwZSA9PT0gRnJhZ21lbnQgPyAwIDogMSwgaXNCbG9ja05vZGUgPSBmYWxzZSwgbmVlZEZ1bGxDaGlsZHJlbk5vcm1hbGl6YXRpb24gPSBmYWxzZSkge1xuICBjb25zdCB2bm9kZSA9IHtcbiAgICBfX3ZfaXNWTm9kZTogdHJ1ZSxcbiAgICBfX3Zfc2tpcDogdHJ1ZSxcbiAgICB0eXBlLFxuICAgIHByb3BzLFxuICAgIGtleTogcHJvcHMgJiYgbm9ybWFsaXplS2V5KHByb3BzKSxcbiAgICByZWY6IHByb3BzICYmIG5vcm1hbGl6ZVJlZihwcm9wcyksXG4gICAgc2NvcGVJZDogY3VycmVudFNjb3BlSWQsXG4gICAgc2xvdFNjb3BlSWRzOiBudWxsLFxuICAgIGNoaWxkcmVuLFxuICAgIGNvbXBvbmVudDogbnVsbCxcbiAgICBzdXNwZW5zZTogbnVsbCxcbiAgICBzc0NvbnRlbnQ6IG51bGwsXG4gICAgc3NGYWxsYmFjazogbnVsbCxcbiAgICBkaXJzOiBudWxsLFxuICAgIHRyYW5zaXRpb246IG51bGwsXG4gICAgZWw6IG51bGwsXG4gICAgYW5jaG9yOiBudWxsLFxuICAgIHRhcmdldDogbnVsbCxcbiAgICB0YXJnZXRTdGFydDogbnVsbCxcbiAgICB0YXJnZXRBbmNob3I6IG51bGwsXG4gICAgc3RhdGljQ291bnQ6IDAsXG4gICAgc2hhcGVGbGFnLFxuICAgIHBhdGNoRmxhZyxcbiAgICBkeW5hbWljUHJvcHMsXG4gICAgZHluYW1pY0NoaWxkcmVuOiBudWxsLFxuICAgIGFwcENvbnRleHQ6IG51bGwsXG4gICAgY3R4OiBjdXJyZW50UmVuZGVyaW5nSW5zdGFuY2VcbiAgfTtcbiAgaWYgKG5lZWRGdWxsQ2hpbGRyZW5Ob3JtYWxpemF0aW9uKSB7XG4gICAgbm9ybWFsaXplQ2hpbGRyZW4odm5vZGUsIGNoaWxkcmVuKTtcbiAgICBpZiAoc2hhcGVGbGFnICYgMTI4KSB7XG4gICAgICB0eXBlLm5vcm1hbGl6ZSh2bm9kZSk7XG4gICAgfVxuICB9IGVsc2UgaWYgKGNoaWxkcmVuKSB7XG4gICAgdm5vZGUuc2hhcGVGbGFnIHw9IGlzU3RyaW5nKGNoaWxkcmVuKSA/IDggOiAxNjtcbiAgfVxuICBpZiAoISEocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09IFwicHJvZHVjdGlvblwiKSAmJiB2bm9kZS5rZXkgIT09IHZub2RlLmtleSkge1xuICAgIHdhcm4kMShgVk5vZGUgY3JlYXRlZCB3aXRoIGludmFsaWQga2V5IChOYU4pLiBWTm9kZSB0eXBlOmAsIHZub2RlLnR5cGUpO1xuICB9XG4gIGlmIChpc0Jsb2NrVHJlZUVuYWJsZWQgPiAwICYmIC8vIGF2b2lkIGEgYmxvY2sgbm9kZSBmcm9tIHRyYWNraW5nIGl0c2VsZlxuICAhaXNCbG9ja05vZGUgJiYgLy8gaGFzIGN1cnJlbnQgcGFyZW50IGJsb2NrXG4gIGN1cnJlbnRCbG9jayAmJiAvLyBwcmVzZW5jZSBvZiBhIHBhdGNoIGZsYWcgaW5kaWNhdGVzIHRoaXMgbm9kZSBuZWVkcyBwYXRjaGluZyBvbiB1cGRhdGVzLlxuICAvLyBjb21wb25lbnQgbm9kZXMgYWxzbyBzaG91bGQgYWx3YXlzIGJlIHBhdGNoZWQsIGJlY2F1c2UgZXZlbiBpZiB0aGVcbiAgLy8gY29tcG9uZW50IGRvZXNuJ3QgbmVlZCB0byB1cGRhdGUsIGl0IG5lZWRzIHRvIHBlcnNpc3QgdGhlIGluc3RhbmNlIG9uIHRvXG4gIC8vIHRoZSBuZXh0IHZub2RlIHNvIHRoYXQgaXQgY2FuIGJlIHByb3Blcmx5IHVubW91bnRlZCBsYXRlci5cbiAgKHZub2RlLnBhdGNoRmxhZyA+IDAgfHwgc2hhcGVGbGFnICYgNikgJiYgLy8gdGhlIEVWRU5UUyBmbGFnIGlzIG9ubHkgZm9yIGh5ZHJhdGlvbiBhbmQgaWYgaXQgaXMgdGhlIG9ubHkgZmxhZywgdGhlXG4gIC8vIHZub2RlIHNob3VsZCBub3QgYmUgY29uc2lkZXJlZCBkeW5hbWljIGR1ZSB0byBoYW5kbGVyIGNhY2hpbmcuXG4gIHZub2RlLnBhdGNoRmxhZyAhPT0gMzIpIHtcbiAgICBjdXJyZW50QmxvY2sucHVzaCh2bm9kZSk7XG4gIH1cbiAgcmV0dXJuIHZub2RlO1xufVxuY29uc3QgY3JlYXRlVk5vZGUgPSAhIShwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gXCJwcm9kdWN0aW9uXCIpID8gY3JlYXRlVk5vZGVXaXRoQXJnc1RyYW5zZm9ybSA6IF9jcmVhdGVWTm9kZTtcbmZ1bmN0aW9uIF9jcmVhdGVWTm9kZSh0eXBlLCBwcm9wcyA9IG51bGwsIGNoaWxkcmVuID0gbnVsbCwgcGF0Y2hGbGFnID0gMCwgZHluYW1pY1Byb3BzID0gbnVsbCwgaXNCbG9ja05vZGUgPSBmYWxzZSkge1xuICBpZiAoIXR5cGUgfHwgdHlwZSA9PT0gTlVMTF9EWU5BTUlDX0NPTVBPTkVOVCkge1xuICAgIGlmICghIShwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gXCJwcm9kdWN0aW9uXCIpICYmICF0eXBlKSB7XG4gICAgICB3YXJuJDEoYEludmFsaWQgdm5vZGUgdHlwZSB3aGVuIGNyZWF0aW5nIHZub2RlOiAke3R5cGV9LmApO1xuICAgIH1cbiAgICB0eXBlID0gQ29tbWVudDtcbiAgfVxuICBpZiAoaXNWTm9kZSh0eXBlKSkge1xuICAgIGNvbnN0IGNsb25lZCA9IGNsb25lVk5vZGUoXG4gICAgICB0eXBlLFxuICAgICAgcHJvcHMsXG4gICAgICB0cnVlXG4gICAgICAvKiBtZXJnZVJlZjogdHJ1ZSAqL1xuICAgICk7XG4gICAgaWYgKGNoaWxkcmVuKSB7XG4gICAgICBub3JtYWxpemVDaGlsZHJlbihjbG9uZWQsIGNoaWxkcmVuKTtcbiAgICB9XG4gICAgaWYgKGlzQmxvY2tUcmVlRW5hYmxlZCA+IDAgJiYgIWlzQmxvY2tOb2RlICYmIGN1cnJlbnRCbG9jaykge1xuICAgICAgaWYgKGNsb25lZC5zaGFwZUZsYWcgJiA2KSB7XG4gICAgICAgIGN1cnJlbnRCbG9ja1tjdXJyZW50QmxvY2suaW5kZXhPZih0eXBlKV0gPSBjbG9uZWQ7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjdXJyZW50QmxvY2sucHVzaChjbG9uZWQpO1xuICAgICAgfVxuICAgIH1cbiAgICBjbG9uZWQucGF0Y2hGbGFnID0gLTI7XG4gICAgcmV0dXJuIGNsb25lZDtcbiAgfVxuICBpZiAoaXNDbGFzc0NvbXBvbmVudCh0eXBlKSkge1xuICAgIHR5cGUgPSB0eXBlLl9fdmNjT3B0cztcbiAgfVxuICBpZiAocHJvcHMpIHtcbiAgICBwcm9wcyA9IGd1YXJkUmVhY3RpdmVQcm9wcyhwcm9wcyk7XG4gICAgbGV0IHsgY2xhc3M6IGtsYXNzLCBzdHlsZSB9ID0gcHJvcHM7XG4gICAgaWYgKGtsYXNzICYmICFpc1N0cmluZyhrbGFzcykpIHtcbiAgICAgIHByb3BzLmNsYXNzID0gbm9ybWFsaXplQ2xhc3Moa2xhc3MpO1xuICAgIH1cbiAgICBpZiAoaXNPYmplY3Qoc3R5bGUpKSB7XG4gICAgICBpZiAoaXNQcm94eShzdHlsZSkgJiYgIWlzQXJyYXkoc3R5bGUpKSB7XG4gICAgICAgIHN0eWxlID0gZXh0ZW5kKHt9LCBzdHlsZSk7XG4gICAgICB9XG4gICAgICBwcm9wcy5zdHlsZSA9IG5vcm1hbGl6ZVN0eWxlKHN0eWxlKTtcbiAgICB9XG4gIH1cbiAgY29uc3Qgc2hhcGVGbGFnID0gaXNTdHJpbmcodHlwZSkgPyAxIDogaXNTdXNwZW5zZSh0eXBlKSA/IDEyOCA6IGlzVGVsZXBvcnQodHlwZSkgPyA2NCA6IGlzT2JqZWN0KHR5cGUpID8gNCA6IGlzRnVuY3Rpb24odHlwZSkgPyAyIDogMDtcbiAgaWYgKCEhKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSBcInByb2R1Y3Rpb25cIikgJiYgc2hhcGVGbGFnICYgNCAmJiBpc1Byb3h5KHR5cGUpKSB7XG4gICAgdHlwZSA9IHRvUmF3KHR5cGUpO1xuICAgIHdhcm4kMShcbiAgICAgIGBWdWUgcmVjZWl2ZWQgYSBDb21wb25lbnQgdGhhdCB3YXMgbWFkZSBhIHJlYWN0aXZlIG9iamVjdC4gVGhpcyBjYW4gbGVhZCB0byB1bm5lY2Vzc2FyeSBwZXJmb3JtYW5jZSBvdmVyaGVhZCBhbmQgc2hvdWxkIGJlIGF2b2lkZWQgYnkgbWFya2luZyB0aGUgY29tcG9uZW50IHdpdGggXFxgbWFya1Jhd1xcYCBvciB1c2luZyBcXGBzaGFsbG93UmVmXFxgIGluc3RlYWQgb2YgXFxgcmVmXFxgLmAsXG4gICAgICBgXG5Db21wb25lbnQgdGhhdCB3YXMgbWFkZSByZWFjdGl2ZTogYCxcbiAgICAgIHR5cGVcbiAgICApO1xuICB9XG4gIHJldHVybiBjcmVhdGVCYXNlVk5vZGUoXG4gICAgdHlwZSxcbiAgICBwcm9wcyxcbiAgICBjaGlsZHJlbixcbiAgICBwYXRjaEZsYWcsXG4gICAgZHluYW1pY1Byb3BzLFxuICAgIHNoYXBlRmxhZyxcbiAgICBpc0Jsb2NrTm9kZSxcbiAgICB0cnVlXG4gICk7XG59XG5mdW5jdGlvbiBndWFyZFJlYWN0aXZlUHJvcHMocHJvcHMpIHtcbiAgaWYgKCFwcm9wcykgcmV0dXJuIG51bGw7XG4gIHJldHVybiBpc1Byb3h5KHByb3BzKSB8fCBpc0ludGVybmFsT2JqZWN0KHByb3BzKSA/IGV4dGVuZCh7fSwgcHJvcHMpIDogcHJvcHM7XG59XG5mdW5jdGlvbiBjbG9uZVZOb2RlKHZub2RlLCBleHRyYVByb3BzLCBtZXJnZVJlZiA9IGZhbHNlLCBjbG9uZVRyYW5zaXRpb24gPSBmYWxzZSkge1xuICBjb25zdCB7IHByb3BzLCByZWYsIHBhdGNoRmxhZywgY2hpbGRyZW4sIHRyYW5zaXRpb24gfSA9IHZub2RlO1xuICBjb25zdCBtZXJnZWRQcm9wcyA9IGV4dHJhUHJvcHMgPyBtZXJnZVByb3BzKHByb3BzIHx8IHt9LCBleHRyYVByb3BzKSA6IHByb3BzO1xuICBjb25zdCBjbG9uZWQgPSB7XG4gICAgX192X2lzVk5vZGU6IHRydWUsXG4gICAgX192X3NraXA6IHRydWUsXG4gICAgdHlwZTogdm5vZGUudHlwZSxcbiAgICBwcm9wczogbWVyZ2VkUHJvcHMsXG4gICAga2V5OiBtZXJnZWRQcm9wcyAmJiBub3JtYWxpemVLZXkobWVyZ2VkUHJvcHMpLFxuICAgIHJlZjogZXh0cmFQcm9wcyAmJiBleHRyYVByb3BzLnJlZiA/IChcbiAgICAgIC8vICMyMDc4IGluIHRoZSBjYXNlIG9mIDxjb21wb25lbnQgOmlzPVwidm5vZGVcIiByZWY9XCJleHRyYVwiLz5cbiAgICAgIC8vIGlmIHRoZSB2bm9kZSBpdHNlbGYgYWxyZWFkeSBoYXMgYSByZWYsIGNsb25lVk5vZGUgd2lsbCBuZWVkIHRvIG1lcmdlXG4gICAgICAvLyB0aGUgcmVmcyBzbyB0aGUgc2luZ2xlIHZub2RlIGNhbiBiZSBzZXQgb24gbXVsdGlwbGUgcmVmc1xuICAgICAgbWVyZ2VSZWYgJiYgcmVmID8gaXNBcnJheShyZWYpID8gcmVmLmNvbmNhdChub3JtYWxpemVSZWYoZXh0cmFQcm9wcykpIDogW3JlZiwgbm9ybWFsaXplUmVmKGV4dHJhUHJvcHMpXSA6IG5vcm1hbGl6ZVJlZihleHRyYVByb3BzKVxuICAgICkgOiByZWYsXG4gICAgc2NvcGVJZDogdm5vZGUuc2NvcGVJZCxcbiAgICBzbG90U2NvcGVJZHM6IHZub2RlLnNsb3RTY29wZUlkcyxcbiAgICBjaGlsZHJlbjogISEocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09IFwicHJvZHVjdGlvblwiKSAmJiBwYXRjaEZsYWcgPT09IC0xICYmIGlzQXJyYXkoY2hpbGRyZW4pID8gY2hpbGRyZW4ubWFwKGRlZXBDbG9uZVZOb2RlKSA6IGNoaWxkcmVuLFxuICAgIHRhcmdldDogdm5vZGUudGFyZ2V0LFxuICAgIHRhcmdldFN0YXJ0OiB2bm9kZS50YXJnZXRTdGFydCxcbiAgICB0YXJnZXRBbmNob3I6IHZub2RlLnRhcmdldEFuY2hvcixcbiAgICBzdGF0aWNDb3VudDogdm5vZGUuc3RhdGljQ291bnQsXG4gICAgc2hhcGVGbGFnOiB2bm9kZS5zaGFwZUZsYWcsXG4gICAgLy8gaWYgdGhlIHZub2RlIGlzIGNsb25lZCB3aXRoIGV4dHJhIHByb3BzLCB3ZSBjYW4gbm8gbG9uZ2VyIGFzc3VtZSBpdHNcbiAgICAvLyBleGlzdGluZyBwYXRjaCBmbGFnIHRvIGJlIHJlbGlhYmxlIGFuZCBuZWVkIHRvIGFkZCB0aGUgRlVMTF9QUk9QUyBmbGFnLlxuICAgIC8vIG5vdGU6IHByZXNlcnZlIGZsYWcgZm9yIGZyYWdtZW50cyBzaW5jZSB0aGV5IHVzZSB0aGUgZmxhZyBmb3IgY2hpbGRyZW5cbiAgICAvLyBmYXN0IHBhdGhzIG9ubHkuXG4gICAgcGF0Y2hGbGFnOiBleHRyYVByb3BzICYmIHZub2RlLnR5cGUgIT09IEZyYWdtZW50ID8gcGF0Y2hGbGFnID09PSAtMSA/IDE2IDogcGF0Y2hGbGFnIHwgMTYgOiBwYXRjaEZsYWcsXG4gICAgZHluYW1pY1Byb3BzOiB2bm9kZS5keW5hbWljUHJvcHMsXG4gICAgZHluYW1pY0NoaWxkcmVuOiB2bm9kZS5keW5hbWljQ2hpbGRyZW4sXG4gICAgYXBwQ29udGV4dDogdm5vZGUuYXBwQ29udGV4dCxcbiAgICBkaXJzOiB2bm9kZS5kaXJzLFxuICAgIHRyYW5zaXRpb24sXG4gICAgLy8gVGhlc2Ugc2hvdWxkIHRlY2huaWNhbGx5IG9ubHkgYmUgbm9uLW51bGwgb24gbW91bnRlZCBWTm9kZXMuIEhvd2V2ZXIsXG4gICAgLy8gdGhleSAqc2hvdWxkKiBiZSBjb3BpZWQgZm9yIGtlcHQtYWxpdmUgdm5vZGVzLiBTbyB3ZSBqdXN0IGFsd2F5cyBjb3B5XG4gICAgLy8gdGhlbSBzaW5jZSB0aGVtIGJlaW5nIG5vbi1udWxsIGR1cmluZyBhIG1vdW50IGRvZXNuJ3QgYWZmZWN0IHRoZSBsb2dpYyBhc1xuICAgIC8vIHRoZXkgd2lsbCBzaW1wbHkgYmUgb3ZlcndyaXR0ZW4uXG4gICAgY29tcG9uZW50OiB2bm9kZS5jb21wb25lbnQsXG4gICAgc3VzcGVuc2U6IHZub2RlLnN1c3BlbnNlLFxuICAgIHNzQ29udGVudDogdm5vZGUuc3NDb250ZW50ICYmIGNsb25lVk5vZGUodm5vZGUuc3NDb250ZW50KSxcbiAgICBzc0ZhbGxiYWNrOiB2bm9kZS5zc0ZhbGxiYWNrICYmIGNsb25lVk5vZGUodm5vZGUuc3NGYWxsYmFjayksXG4gICAgcGxhY2Vob2xkZXI6IHZub2RlLnBsYWNlaG9sZGVyLFxuICAgIGVsOiB2bm9kZS5lbCxcbiAgICBhbmNob3I6IHZub2RlLmFuY2hvcixcbiAgICBjdHg6IHZub2RlLmN0eCxcbiAgICBjZTogdm5vZGUuY2VcbiAgfTtcbiAgaWYgKHRyYW5zaXRpb24gJiYgY2xvbmVUcmFuc2l0aW9uKSB7XG4gICAgc2V0VHJhbnNpdGlvbkhvb2tzKFxuICAgICAgY2xvbmVkLFxuICAgICAgdHJhbnNpdGlvbi5jbG9uZShjbG9uZWQpXG4gICAgKTtcbiAgfVxuICByZXR1cm4gY2xvbmVkO1xufVxuZnVuY3Rpb24gZGVlcENsb25lVk5vZGUodm5vZGUpIHtcbiAgY29uc3QgY2xvbmVkID0gY2xvbmVWTm9kZSh2bm9kZSk7XG4gIGlmIChpc0FycmF5KHZub2RlLmNoaWxkcmVuKSkge1xuICAgIGNsb25lZC5jaGlsZHJlbiA9IHZub2RlLmNoaWxkcmVuLm1hcChkZWVwQ2xvbmVWTm9kZSk7XG4gIH1cbiAgcmV0dXJuIGNsb25lZDtcbn1cbmZ1bmN0aW9uIGNyZWF0ZVRleHRWTm9kZSh0ZXh0ID0gXCIgXCIsIGZsYWcgPSAwKSB7XG4gIHJldHVybiBjcmVhdGVWTm9kZShUZXh0LCBudWxsLCB0ZXh0LCBmbGFnKTtcbn1cbmZ1bmN0aW9uIGNyZWF0ZVN0YXRpY1ZOb2RlKGNvbnRlbnQsIG51bWJlck9mTm9kZXMpIHtcbiAgY29uc3Qgdm5vZGUgPSBjcmVhdGVWTm9kZShTdGF0aWMsIG51bGwsIGNvbnRlbnQpO1xuICB2bm9kZS5zdGF0aWNDb3VudCA9IG51bWJlck9mTm9kZXM7XG4gIHJldHVybiB2bm9kZTtcbn1cbmZ1bmN0aW9uIGNyZWF0ZUNvbW1lbnRWTm9kZSh0ZXh0ID0gXCJcIiwgYXNCbG9jayA9IGZhbHNlKSB7XG4gIHJldHVybiBhc0Jsb2NrID8gKG9wZW5CbG9jaygpLCBjcmVhdGVCbG9jayhDb21tZW50LCBudWxsLCB0ZXh0KSkgOiBjcmVhdGVWTm9kZShDb21tZW50LCBudWxsLCB0ZXh0KTtcbn1cbmZ1bmN0aW9uIG5vcm1hbGl6ZVZOb2RlKGNoaWxkKSB7XG4gIGlmIChjaGlsZCA9PSBudWxsIHx8IHR5cGVvZiBjaGlsZCA9PT0gXCJib29sZWFuXCIpIHtcbiAgICByZXR1cm4gY3JlYXRlVk5vZGUoQ29tbWVudCk7XG4gIH0gZWxzZSBpZiAoaXNBcnJheShjaGlsZCkpIHtcbiAgICByZXR1cm4gY3JlYXRlVk5vZGUoXG4gICAgICBGcmFnbWVudCxcbiAgICAgIG51bGwsXG4gICAgICAvLyAjMzY2NiwgYXZvaWQgcmVmZXJlbmNlIHBvbGx1dGlvbiB3aGVuIHJldXNpbmcgdm5vZGVcbiAgICAgIGNoaWxkLnNsaWNlKClcbiAgICApO1xuICB9IGVsc2UgaWYgKGlzVk5vZGUoY2hpbGQpKSB7XG4gICAgcmV0dXJuIGNsb25lSWZNb3VudGVkKGNoaWxkKTtcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gY3JlYXRlVk5vZGUoVGV4dCwgbnVsbCwgU3RyaW5nKGNoaWxkKSk7XG4gIH1cbn1cbmZ1bmN0aW9uIGNsb25lSWZNb3VudGVkKGNoaWxkKSB7XG4gIHJldHVybiBjaGlsZC5lbCA9PT0gbnVsbCAmJiBjaGlsZC5wYXRjaEZsYWcgIT09IC0xIHx8IGNoaWxkLm1lbW8gPyBjaGlsZCA6IGNsb25lVk5vZGUoY2hpbGQpO1xufVxuZnVuY3Rpb24gbm9ybWFsaXplQ2hpbGRyZW4odm5vZGUsIGNoaWxkcmVuKSB7XG4gIGxldCB0eXBlID0gMDtcbiAgY29uc3QgeyBzaGFwZUZsYWcgfSA9IHZub2RlO1xuICBpZiAoY2hpbGRyZW4gPT0gbnVsbCkge1xuICAgIGNoaWxkcmVuID0gbnVsbDtcbiAgfSBlbHNlIGlmIChpc0FycmF5KGNoaWxkcmVuKSkge1xuICAgIHR5cGUgPSAxNjtcbiAgfSBlbHNlIGlmICh0eXBlb2YgY2hpbGRyZW4gPT09IFwib2JqZWN0XCIpIHtcbiAgICBpZiAoc2hhcGVGbGFnICYgKDEgfCA2NCkpIHtcbiAgICAgIGNvbnN0IHNsb3QgPSBjaGlsZHJlbi5kZWZhdWx0O1xuICAgICAgaWYgKHNsb3QpIHtcbiAgICAgICAgc2xvdC5fYyAmJiAoc2xvdC5fZCA9IGZhbHNlKTtcbiAgICAgICAgbm9ybWFsaXplQ2hpbGRyZW4odm5vZGUsIHNsb3QoKSk7XG4gICAgICAgIHNsb3QuX2MgJiYgKHNsb3QuX2QgPSB0cnVlKTtcbiAgICAgIH1cbiAgICAgIHJldHVybjtcbiAgICB9IGVsc2Uge1xuICAgICAgdHlwZSA9IDMyO1xuICAgICAgY29uc3Qgc2xvdEZsYWcgPSBjaGlsZHJlbi5fO1xuICAgICAgaWYgKCFzbG90RmxhZyAmJiAhaXNJbnRlcm5hbE9iamVjdChjaGlsZHJlbikpIHtcbiAgICAgICAgY2hpbGRyZW4uX2N0eCA9IGN1cnJlbnRSZW5kZXJpbmdJbnN0YW5jZTtcbiAgICAgIH0gZWxzZSBpZiAoc2xvdEZsYWcgPT09IDMgJiYgY3VycmVudFJlbmRlcmluZ0luc3RhbmNlKSB7XG4gICAgICAgIGlmIChjdXJyZW50UmVuZGVyaW5nSW5zdGFuY2Uuc2xvdHMuXyA9PT0gMSkge1xuICAgICAgICAgIGNoaWxkcmVuLl8gPSAxO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGNoaWxkcmVuLl8gPSAyO1xuICAgICAgICAgIHZub2RlLnBhdGNoRmxhZyB8PSAxMDI0O1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9IGVsc2UgaWYgKGlzRnVuY3Rpb24oY2hpbGRyZW4pKSB7XG4gICAgY2hpbGRyZW4gPSB7IGRlZmF1bHQ6IGNoaWxkcmVuLCBfY3R4OiBjdXJyZW50UmVuZGVyaW5nSW5zdGFuY2UgfTtcbiAgICB0eXBlID0gMzI7XG4gIH0gZWxzZSB7XG4gICAgY2hpbGRyZW4gPSBTdHJpbmcoY2hpbGRyZW4pO1xuICAgIGlmIChzaGFwZUZsYWcgJiA2NCkge1xuICAgICAgdHlwZSA9IDE2O1xuICAgICAgY2hpbGRyZW4gPSBbY3JlYXRlVGV4dFZOb2RlKGNoaWxkcmVuKV07XG4gICAgfSBlbHNlIHtcbiAgICAgIHR5cGUgPSA4O1xuICAgIH1cbiAgfVxuICB2bm9kZS5jaGlsZHJlbiA9IGNoaWxkcmVuO1xuICB2bm9kZS5zaGFwZUZsYWcgfD0gdHlwZTtcbn1cbmZ1bmN0aW9uIG1lcmdlUHJvcHMoLi4uYXJncykge1xuICBjb25zdCByZXQgPSB7fTtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBhcmdzLmxlbmd0aDsgaSsrKSB7XG4gICAgY29uc3QgdG9NZXJnZSA9IGFyZ3NbaV07XG4gICAgZm9yIChjb25zdCBrZXkgaW4gdG9NZXJnZSkge1xuICAgICAgaWYgKGtleSA9PT0gXCJjbGFzc1wiKSB7XG4gICAgICAgIGlmIChyZXQuY2xhc3MgIT09IHRvTWVyZ2UuY2xhc3MpIHtcbiAgICAgICAgICByZXQuY2xhc3MgPSBub3JtYWxpemVDbGFzcyhbcmV0LmNsYXNzLCB0b01lcmdlLmNsYXNzXSk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSBpZiAoa2V5ID09PSBcInN0eWxlXCIpIHtcbiAgICAgICAgcmV0LnN0eWxlID0gbm9ybWFsaXplU3R5bGUoW3JldC5zdHlsZSwgdG9NZXJnZS5zdHlsZV0pO1xuICAgICAgfSBlbHNlIGlmIChpc09uKGtleSkpIHtcbiAgICAgICAgY29uc3QgZXhpc3RpbmcgPSByZXRba2V5XTtcbiAgICAgICAgY29uc3QgaW5jb21pbmcgPSB0b01lcmdlW2tleV07XG4gICAgICAgIGlmIChpbmNvbWluZyAmJiBleGlzdGluZyAhPT0gaW5jb21pbmcgJiYgIShpc0FycmF5KGV4aXN0aW5nKSAmJiBleGlzdGluZy5pbmNsdWRlcyhpbmNvbWluZykpKSB7XG4gICAgICAgICAgcmV0W2tleV0gPSBleGlzdGluZyA/IFtdLmNvbmNhdChleGlzdGluZywgaW5jb21pbmcpIDogaW5jb21pbmc7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSBpZiAoa2V5ICE9PSBcIlwiKSB7XG4gICAgICAgIHJldFtrZXldID0gdG9NZXJnZVtrZXldO1xuICAgICAgfVxuICAgIH1cbiAgfVxuICByZXR1cm4gcmV0O1xufVxuZnVuY3Rpb24gaW52b2tlVk5vZGVIb29rKGhvb2ssIGluc3RhbmNlLCB2bm9kZSwgcHJldlZOb2RlID0gbnVsbCkge1xuICBjYWxsV2l0aEFzeW5jRXJyb3JIYW5kbGluZyhob29rLCBpbnN0YW5jZSwgNywgW1xuICAgIHZub2RlLFxuICAgIHByZXZWTm9kZVxuICBdKTtcbn1cblxuY29uc3QgZW1wdHlBcHBDb250ZXh0ID0gY3JlYXRlQXBwQ29udGV4dCgpO1xubGV0IHVpZCA9IDA7XG5mdW5jdGlvbiBjcmVhdGVDb21wb25lbnRJbnN0YW5jZSh2bm9kZSwgcGFyZW50LCBzdXNwZW5zZSkge1xuICBjb25zdCB0eXBlID0gdm5vZGUudHlwZTtcbiAgY29uc3QgYXBwQ29udGV4dCA9IChwYXJlbnQgPyBwYXJlbnQuYXBwQ29udGV4dCA6IHZub2RlLmFwcENvbnRleHQpIHx8IGVtcHR5QXBwQ29udGV4dDtcbiAgY29uc3QgaW5zdGFuY2UgPSB7XG4gICAgdWlkOiB1aWQrKyxcbiAgICB2bm9kZSxcbiAgICB0eXBlLFxuICAgIHBhcmVudCxcbiAgICBhcHBDb250ZXh0LFxuICAgIHJvb3Q6IG51bGwsXG4gICAgLy8gdG8gYmUgaW1tZWRpYXRlbHkgc2V0XG4gICAgbmV4dDogbnVsbCxcbiAgICBzdWJUcmVlOiBudWxsLFxuICAgIC8vIHdpbGwgYmUgc2V0IHN5bmNocm9ub3VzbHkgcmlnaHQgYWZ0ZXIgY3JlYXRpb25cbiAgICBlZmZlY3Q6IG51bGwsXG4gICAgdXBkYXRlOiBudWxsLFxuICAgIC8vIHdpbGwgYmUgc2V0IHN5bmNocm9ub3VzbHkgcmlnaHQgYWZ0ZXIgY3JlYXRpb25cbiAgICBqb2I6IG51bGwsXG4gICAgc2NvcGU6IG5ldyBFZmZlY3RTY29wZShcbiAgICAgIHRydWVcbiAgICAgIC8qIGRldGFjaGVkICovXG4gICAgKSxcbiAgICByZW5kZXI6IG51bGwsXG4gICAgcHJveHk6IG51bGwsXG4gICAgZXhwb3NlZDogbnVsbCxcbiAgICBleHBvc2VQcm94eTogbnVsbCxcbiAgICB3aXRoUHJveHk6IG51bGwsXG4gICAgcHJvdmlkZXM6IHBhcmVudCA/IHBhcmVudC5wcm92aWRlcyA6IE9iamVjdC5jcmVhdGUoYXBwQ29udGV4dC5wcm92aWRlcyksXG4gICAgaWRzOiBwYXJlbnQgPyBwYXJlbnQuaWRzIDogW1wiXCIsIDAsIDBdLFxuICAgIGFjY2Vzc0NhY2hlOiBudWxsLFxuICAgIHJlbmRlckNhY2hlOiBbXSxcbiAgICAvLyBsb2NhbCByZXNvbHZlZCBhc3NldHNcbiAgICBjb21wb25lbnRzOiBudWxsLFxuICAgIGRpcmVjdGl2ZXM6IG51bGwsXG4gICAgLy8gcmVzb2x2ZWQgcHJvcHMgYW5kIGVtaXRzIG9wdGlvbnNcbiAgICBwcm9wc09wdGlvbnM6IG5vcm1hbGl6ZVByb3BzT3B0aW9ucyh0eXBlLCBhcHBDb250ZXh0KSxcbiAgICBlbWl0c09wdGlvbnM6IG5vcm1hbGl6ZUVtaXRzT3B0aW9ucyh0eXBlLCBhcHBDb250ZXh0KSxcbiAgICAvLyBlbWl0XG4gICAgZW1pdDogbnVsbCxcbiAgICAvLyB0byBiZSBzZXQgaW1tZWRpYXRlbHlcbiAgICBlbWl0dGVkOiBudWxsLFxuICAgIC8vIHByb3BzIGRlZmF1bHQgdmFsdWVcbiAgICBwcm9wc0RlZmF1bHRzOiBFTVBUWV9PQkosXG4gICAgLy8gaW5oZXJpdEF0dHJzXG4gICAgaW5oZXJpdEF0dHJzOiB0eXBlLmluaGVyaXRBdHRycyxcbiAgICAvLyBzdGF0ZVxuICAgIGN0eDogRU1QVFlfT0JKLFxuICAgIGRhdGE6IEVNUFRZX09CSixcbiAgICBwcm9wczogRU1QVFlfT0JKLFxuICAgIGF0dHJzOiBFTVBUWV9PQkosXG4gICAgc2xvdHM6IEVNUFRZX09CSixcbiAgICByZWZzOiBFTVBUWV9PQkosXG4gICAgc2V0dXBTdGF0ZTogRU1QVFlfT0JKLFxuICAgIHNldHVwQ29udGV4dDogbnVsbCxcbiAgICAvLyBzdXNwZW5zZSByZWxhdGVkXG4gICAgc3VzcGVuc2UsXG4gICAgc3VzcGVuc2VJZDogc3VzcGVuc2UgPyBzdXNwZW5zZS5wZW5kaW5nSWQgOiAwLFxuICAgIGFzeW5jRGVwOiBudWxsLFxuICAgIGFzeW5jUmVzb2x2ZWQ6IGZhbHNlLFxuICAgIC8vIGxpZmVjeWNsZSBob29rc1xuICAgIC8vIG5vdCB1c2luZyBlbnVtcyBoZXJlIGJlY2F1c2UgaXQgcmVzdWx0cyBpbiBjb21wdXRlZCBwcm9wZXJ0aWVzXG4gICAgaXNNb3VudGVkOiBmYWxzZSxcbiAgICBpc1VubW91bnRlZDogZmFsc2UsXG4gICAgaXNEZWFjdGl2YXRlZDogZmFsc2UsXG4gICAgYmM6IG51bGwsXG4gICAgYzogbnVsbCxcbiAgICBibTogbnVsbCxcbiAgICBtOiBudWxsLFxuICAgIGJ1OiBudWxsLFxuICAgIHU6IG51bGwsXG4gICAgdW06IG51bGwsXG4gICAgYnVtOiBudWxsLFxuICAgIGRhOiBudWxsLFxuICAgIGE6IG51bGwsXG4gICAgcnRnOiBudWxsLFxuICAgIHJ0YzogbnVsbCxcbiAgICBlYzogbnVsbCxcbiAgICBzcDogbnVsbFxuICB9O1xuICBpZiAoISEocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09IFwicHJvZHVjdGlvblwiKSkge1xuICAgIGluc3RhbmNlLmN0eCA9IGNyZWF0ZURldlJlbmRlckNvbnRleHQoaW5zdGFuY2UpO1xuICB9IGVsc2Uge1xuICAgIGluc3RhbmNlLmN0eCA9IHsgXzogaW5zdGFuY2UgfTtcbiAgfVxuICBpbnN0YW5jZS5yb290ID0gcGFyZW50ID8gcGFyZW50LnJvb3QgOiBpbnN0YW5jZTtcbiAgaW5zdGFuY2UuZW1pdCA9IGVtaXQuYmluZChudWxsLCBpbnN0YW5jZSk7XG4gIGlmICh2bm9kZS5jZSkge1xuICAgIHZub2RlLmNlKGluc3RhbmNlKTtcbiAgfVxuICByZXR1cm4gaW5zdGFuY2U7XG59XG5sZXQgY3VycmVudEluc3RhbmNlID0gbnVsbDtcbmNvbnN0IGdldEN1cnJlbnRJbnN0YW5jZSA9ICgpID0+IGN1cnJlbnRJbnN0YW5jZSB8fCBjdXJyZW50UmVuZGVyaW5nSW5zdGFuY2U7XG5sZXQgaW50ZXJuYWxTZXRDdXJyZW50SW5zdGFuY2U7XG5sZXQgc2V0SW5TU1JTZXR1cFN0YXRlO1xue1xuICBjb25zdCBnID0gZ2V0R2xvYmFsVGhpcygpO1xuICBjb25zdCByZWdpc3Rlckdsb2JhbFNldHRlciA9IChrZXksIHNldHRlcikgPT4ge1xuICAgIGxldCBzZXR0ZXJzO1xuICAgIGlmICghKHNldHRlcnMgPSBnW2tleV0pKSBzZXR0ZXJzID0gZ1trZXldID0gW107XG4gICAgc2V0dGVycy5wdXNoKHNldHRlcik7XG4gICAgcmV0dXJuICh2KSA9PiB7XG4gICAgICBpZiAoc2V0dGVycy5sZW5ndGggPiAxKSBzZXR0ZXJzLmZvckVhY2goKHNldCkgPT4gc2V0KHYpKTtcbiAgICAgIGVsc2Ugc2V0dGVyc1swXSh2KTtcbiAgICB9O1xuICB9O1xuICBpbnRlcm5hbFNldEN1cnJlbnRJbnN0YW5jZSA9IHJlZ2lzdGVyR2xvYmFsU2V0dGVyKFxuICAgIGBfX1ZVRV9JTlNUQU5DRV9TRVRURVJTX19gLFxuICAgICh2KSA9PiBjdXJyZW50SW5zdGFuY2UgPSB2XG4gICk7XG4gIHNldEluU1NSU2V0dXBTdGF0ZSA9IHJlZ2lzdGVyR2xvYmFsU2V0dGVyKFxuICAgIGBfX1ZVRV9TU1JfU0VUVEVSU19fYCxcbiAgICAodikgPT4gaXNJblNTUkNvbXBvbmVudFNldHVwID0gdlxuICApO1xufVxuY29uc3Qgc2V0Q3VycmVudEluc3RhbmNlID0gKGluc3RhbmNlKSA9PiB7XG4gIGNvbnN0IHByZXYgPSBjdXJyZW50SW5zdGFuY2U7XG4gIGludGVybmFsU2V0Q3VycmVudEluc3RhbmNlKGluc3RhbmNlKTtcbiAgaW5zdGFuY2Uuc2NvcGUub24oKTtcbiAgcmV0dXJuICgpID0+IHtcbiAgICBpbnN0YW5jZS5zY29wZS5vZmYoKTtcbiAgICBpbnRlcm5hbFNldEN1cnJlbnRJbnN0YW5jZShwcmV2KTtcbiAgfTtcbn07XG5jb25zdCB1bnNldEN1cnJlbnRJbnN0YW5jZSA9ICgpID0+IHtcbiAgY3VycmVudEluc3RhbmNlICYmIGN1cnJlbnRJbnN0YW5jZS5zY29wZS5vZmYoKTtcbiAgaW50ZXJuYWxTZXRDdXJyZW50SW5zdGFuY2UobnVsbCk7XG59O1xuY29uc3QgaXNCdWlsdEluVGFnID0gLyogQF9fUFVSRV9fICovIG1ha2VNYXAoXCJzbG90LGNvbXBvbmVudFwiKTtcbmZ1bmN0aW9uIHZhbGlkYXRlQ29tcG9uZW50TmFtZShuYW1lLCB7IGlzTmF0aXZlVGFnIH0pIHtcbiAgaWYgKGlzQnVpbHRJblRhZyhuYW1lKSB8fCBpc05hdGl2ZVRhZyhuYW1lKSkge1xuICAgIHdhcm4kMShcbiAgICAgIFwiRG8gbm90IHVzZSBidWlsdC1pbiBvciByZXNlcnZlZCBIVE1MIGVsZW1lbnRzIGFzIGNvbXBvbmVudCBpZDogXCIgKyBuYW1lXG4gICAgKTtcbiAgfVxufVxuZnVuY3Rpb24gaXNTdGF0ZWZ1bENvbXBvbmVudChpbnN0YW5jZSkge1xuICByZXR1cm4gaW5zdGFuY2Uudm5vZGUuc2hhcGVGbGFnICYgNDtcbn1cbmxldCBpc0luU1NSQ29tcG9uZW50U2V0dXAgPSBmYWxzZTtcbmZ1bmN0aW9uIHNldHVwQ29tcG9uZW50KGluc3RhbmNlLCBpc1NTUiA9IGZhbHNlLCBvcHRpbWl6ZWQgPSBmYWxzZSkge1xuICBpc1NTUiAmJiBzZXRJblNTUlNldHVwU3RhdGUoaXNTU1IpO1xuICBjb25zdCB7IHByb3BzLCBjaGlsZHJlbiB9ID0gaW5zdGFuY2Uudm5vZGU7XG4gIGNvbnN0IGlzU3RhdGVmdWwgPSBpc1N0YXRlZnVsQ29tcG9uZW50KGluc3RhbmNlKTtcbiAgaW5pdFByb3BzKGluc3RhbmNlLCBwcm9wcywgaXNTdGF0ZWZ1bCwgaXNTU1IpO1xuICBpbml0U2xvdHMoaW5zdGFuY2UsIGNoaWxkcmVuLCBvcHRpbWl6ZWQgfHwgaXNTU1IpO1xuICBjb25zdCBzZXR1cFJlc3VsdCA9IGlzU3RhdGVmdWwgPyBzZXR1cFN0YXRlZnVsQ29tcG9uZW50KGluc3RhbmNlLCBpc1NTUikgOiB2b2lkIDA7XG4gIGlzU1NSICYmIHNldEluU1NSU2V0dXBTdGF0ZShmYWxzZSk7XG4gIHJldHVybiBzZXR1cFJlc3VsdDtcbn1cbmZ1bmN0aW9uIHNldHVwU3RhdGVmdWxDb21wb25lbnQoaW5zdGFuY2UsIGlzU1NSKSB7XG4gIGNvbnN0IENvbXBvbmVudCA9IGluc3RhbmNlLnR5cGU7XG4gIGlmICghIShwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gXCJwcm9kdWN0aW9uXCIpKSB7XG4gICAgaWYgKENvbXBvbmVudC5uYW1lKSB7XG4gICAgICB2YWxpZGF0ZUNvbXBvbmVudE5hbWUoQ29tcG9uZW50Lm5hbWUsIGluc3RhbmNlLmFwcENvbnRleHQuY29uZmlnKTtcbiAgICB9XG4gICAgaWYgKENvbXBvbmVudC5jb21wb25lbnRzKSB7XG4gICAgICBjb25zdCBuYW1lcyA9IE9iamVjdC5rZXlzKENvbXBvbmVudC5jb21wb25lbnRzKTtcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbmFtZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgdmFsaWRhdGVDb21wb25lbnROYW1lKG5hbWVzW2ldLCBpbnN0YW5jZS5hcHBDb250ZXh0LmNvbmZpZyk7XG4gICAgICB9XG4gICAgfVxuICAgIGlmIChDb21wb25lbnQuZGlyZWN0aXZlcykge1xuICAgICAgY29uc3QgbmFtZXMgPSBPYmplY3Qua2V5cyhDb21wb25lbnQuZGlyZWN0aXZlcyk7XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IG5hbWVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHZhbGlkYXRlRGlyZWN0aXZlTmFtZShuYW1lc1tpXSk7XG4gICAgICB9XG4gICAgfVxuICAgIGlmIChDb21wb25lbnQuY29tcGlsZXJPcHRpb25zICYmIGlzUnVudGltZU9ubHkoKSkge1xuICAgICAgd2FybiQxKFxuICAgICAgICBgXCJjb21waWxlck9wdGlvbnNcIiBpcyBvbmx5IHN1cHBvcnRlZCB3aGVuIHVzaW5nIGEgYnVpbGQgb2YgVnVlIHRoYXQgaW5jbHVkZXMgdGhlIHJ1bnRpbWUgY29tcGlsZXIuIFNpbmNlIHlvdSBhcmUgdXNpbmcgYSBydW50aW1lLW9ubHkgYnVpbGQsIHRoZSBvcHRpb25zIHNob3VsZCBiZSBwYXNzZWQgdmlhIHlvdXIgYnVpbGQgdG9vbCBjb25maWcgaW5zdGVhZC5gXG4gICAgICApO1xuICAgIH1cbiAgfVxuICBpbnN0YW5jZS5hY2Nlc3NDYWNoZSA9IC8qIEBfX1BVUkVfXyAqLyBPYmplY3QuY3JlYXRlKG51bGwpO1xuICBpbnN0YW5jZS5wcm94eSA9IG5ldyBQcm94eShpbnN0YW5jZS5jdHgsIFB1YmxpY0luc3RhbmNlUHJveHlIYW5kbGVycyk7XG4gIGlmICghIShwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gXCJwcm9kdWN0aW9uXCIpKSB7XG4gICAgZXhwb3NlUHJvcHNPblJlbmRlckNvbnRleHQoaW5zdGFuY2UpO1xuICB9XG4gIGNvbnN0IHsgc2V0dXAgfSA9IENvbXBvbmVudDtcbiAgaWYgKHNldHVwKSB7XG4gICAgcGF1c2VUcmFja2luZygpO1xuICAgIGNvbnN0IHNldHVwQ29udGV4dCA9IGluc3RhbmNlLnNldHVwQ29udGV4dCA9IHNldHVwLmxlbmd0aCA+IDEgPyBjcmVhdGVTZXR1cENvbnRleHQoaW5zdGFuY2UpIDogbnVsbDtcbiAgICBjb25zdCByZXNldCA9IHNldEN1cnJlbnRJbnN0YW5jZShpbnN0YW5jZSk7XG4gICAgY29uc3Qgc2V0dXBSZXN1bHQgPSBjYWxsV2l0aEVycm9ySGFuZGxpbmcoXG4gICAgICBzZXR1cCxcbiAgICAgIGluc3RhbmNlLFxuICAgICAgMCxcbiAgICAgIFtcbiAgICAgICAgISEocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09IFwicHJvZHVjdGlvblwiKSA/IHNoYWxsb3dSZWFkb25seShpbnN0YW5jZS5wcm9wcykgOiBpbnN0YW5jZS5wcm9wcyxcbiAgICAgICAgc2V0dXBDb250ZXh0XG4gICAgICBdXG4gICAgKTtcbiAgICBjb25zdCBpc0FzeW5jU2V0dXAgPSBpc1Byb21pc2Uoc2V0dXBSZXN1bHQpO1xuICAgIHJlc2V0VHJhY2tpbmcoKTtcbiAgICByZXNldCgpO1xuICAgIGlmICgoaXNBc3luY1NldHVwIHx8IGluc3RhbmNlLnNwKSAmJiAhaXNBc3luY1dyYXBwZXIoaW5zdGFuY2UpKSB7XG4gICAgICBtYXJrQXN5bmNCb3VuZGFyeShpbnN0YW5jZSk7XG4gICAgfVxuICAgIGlmIChpc0FzeW5jU2V0dXApIHtcbiAgICAgIHNldHVwUmVzdWx0LnRoZW4odW5zZXRDdXJyZW50SW5zdGFuY2UsIHVuc2V0Q3VycmVudEluc3RhbmNlKTtcbiAgICAgIGlmIChpc1NTUikge1xuICAgICAgICByZXR1cm4gc2V0dXBSZXN1bHQudGhlbigocmVzb2x2ZWRSZXN1bHQpID0+IHtcbiAgICAgICAgICBoYW5kbGVTZXR1cFJlc3VsdChpbnN0YW5jZSwgcmVzb2x2ZWRSZXN1bHQsIGlzU1NSKTtcbiAgICAgICAgfSkuY2F0Y2goKGUpID0+IHtcbiAgICAgICAgICBoYW5kbGVFcnJvcihlLCBpbnN0YW5jZSwgMCk7XG4gICAgICAgIH0pO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaW5zdGFuY2UuYXN5bmNEZXAgPSBzZXR1cFJlc3VsdDtcbiAgICAgICAgaWYgKCEhKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSBcInByb2R1Y3Rpb25cIikgJiYgIWluc3RhbmNlLnN1c3BlbnNlKSB7XG4gICAgICAgICAgY29uc3QgbmFtZSA9IGZvcm1hdENvbXBvbmVudE5hbWUoaW5zdGFuY2UsIENvbXBvbmVudCk7XG4gICAgICAgICAgd2FybiQxKFxuICAgICAgICAgICAgYENvbXBvbmVudCA8JHtuYW1lfT46IHNldHVwIGZ1bmN0aW9uIHJldHVybmVkIGEgcHJvbWlzZSwgYnV0IG5vIDxTdXNwZW5zZT4gYm91bmRhcnkgd2FzIGZvdW5kIGluIHRoZSBwYXJlbnQgY29tcG9uZW50IHRyZWUuIEEgY29tcG9uZW50IHdpdGggYXN5bmMgc2V0dXAoKSBtdXN0IGJlIG5lc3RlZCBpbiBhIDxTdXNwZW5zZT4gaW4gb3JkZXIgdG8gYmUgcmVuZGVyZWQuYFxuICAgICAgICAgICk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgaGFuZGxlU2V0dXBSZXN1bHQoaW5zdGFuY2UsIHNldHVwUmVzdWx0LCBpc1NTUik7XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIGZpbmlzaENvbXBvbmVudFNldHVwKGluc3RhbmNlLCBpc1NTUik7XG4gIH1cbn1cbmZ1bmN0aW9uIGhhbmRsZVNldHVwUmVzdWx0KGluc3RhbmNlLCBzZXR1cFJlc3VsdCwgaXNTU1IpIHtcbiAgaWYgKGlzRnVuY3Rpb24oc2V0dXBSZXN1bHQpKSB7XG4gICAgaWYgKGluc3RhbmNlLnR5cGUuX19zc3JJbmxpbmVSZW5kZXIpIHtcbiAgICAgIGluc3RhbmNlLnNzclJlbmRlciA9IHNldHVwUmVzdWx0O1xuICAgIH0gZWxzZSB7XG4gICAgICBpbnN0YW5jZS5yZW5kZXIgPSBzZXR1cFJlc3VsdDtcbiAgICB9XG4gIH0gZWxzZSBpZiAoaXNPYmplY3Qoc2V0dXBSZXN1bHQpKSB7XG4gICAgaWYgKCEhKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSBcInByb2R1Y3Rpb25cIikgJiYgaXNWTm9kZShzZXR1cFJlc3VsdCkpIHtcbiAgICAgIHdhcm4kMShcbiAgICAgICAgYHNldHVwKCkgc2hvdWxkIG5vdCByZXR1cm4gVk5vZGVzIGRpcmVjdGx5IC0gcmV0dXJuIGEgcmVuZGVyIGZ1bmN0aW9uIGluc3RlYWQuYFxuICAgICAgKTtcbiAgICB9XG4gICAgaWYgKCEhKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSBcInByb2R1Y3Rpb25cIikgfHwgX19WVUVfUFJPRF9ERVZUT09MU19fKSB7XG4gICAgICBpbnN0YW5jZS5kZXZ0b29sc1Jhd1NldHVwU3RhdGUgPSBzZXR1cFJlc3VsdDtcbiAgICB9XG4gICAgaW5zdGFuY2Uuc2V0dXBTdGF0ZSA9IHByb3h5UmVmcyhzZXR1cFJlc3VsdCk7XG4gICAgaWYgKCEhKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSBcInByb2R1Y3Rpb25cIikpIHtcbiAgICAgIGV4cG9zZVNldHVwU3RhdGVPblJlbmRlckNvbnRleHQoaW5zdGFuY2UpO1xuICAgIH1cbiAgfSBlbHNlIGlmICghIShwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gXCJwcm9kdWN0aW9uXCIpICYmIHNldHVwUmVzdWx0ICE9PSB2b2lkIDApIHtcbiAgICB3YXJuJDEoXG4gICAgICBgc2V0dXAoKSBzaG91bGQgcmV0dXJuIGFuIG9iamVjdC4gUmVjZWl2ZWQ6ICR7c2V0dXBSZXN1bHQgPT09IG51bGwgPyBcIm51bGxcIiA6IHR5cGVvZiBzZXR1cFJlc3VsdH1gXG4gICAgKTtcbiAgfVxuICBmaW5pc2hDb21wb25lbnRTZXR1cChpbnN0YW5jZSwgaXNTU1IpO1xufVxubGV0IGNvbXBpbGU7XG5sZXQgaW5zdGFsbFdpdGhQcm94eTtcbmZ1bmN0aW9uIHJlZ2lzdGVyUnVudGltZUNvbXBpbGVyKF9jb21waWxlKSB7XG4gIGNvbXBpbGUgPSBfY29tcGlsZTtcbiAgaW5zdGFsbFdpdGhQcm94eSA9IChpKSA9PiB7XG4gICAgaWYgKGkucmVuZGVyLl9yYykge1xuICAgICAgaS53aXRoUHJveHkgPSBuZXcgUHJveHkoaS5jdHgsIFJ1bnRpbWVDb21waWxlZFB1YmxpY0luc3RhbmNlUHJveHlIYW5kbGVycyk7XG4gICAgfVxuICB9O1xufVxuY29uc3QgaXNSdW50aW1lT25seSA9ICgpID0+ICFjb21waWxlO1xuZnVuY3Rpb24gZmluaXNoQ29tcG9uZW50U2V0dXAoaW5zdGFuY2UsIGlzU1NSLCBza2lwT3B0aW9ucykge1xuICBjb25zdCBDb21wb25lbnQgPSBpbnN0YW5jZS50eXBlO1xuICBpZiAoIWluc3RhbmNlLnJlbmRlcikge1xuICAgIGlmICghaXNTU1IgJiYgY29tcGlsZSAmJiAhQ29tcG9uZW50LnJlbmRlcikge1xuICAgICAgY29uc3QgdGVtcGxhdGUgPSBDb21wb25lbnQudGVtcGxhdGUgfHwgX19WVUVfT1BUSU9OU19BUElfXyAmJiByZXNvbHZlTWVyZ2VkT3B0aW9ucyhpbnN0YW5jZSkudGVtcGxhdGU7XG4gICAgICBpZiAodGVtcGxhdGUpIHtcbiAgICAgICAgaWYgKCEhKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSBcInByb2R1Y3Rpb25cIikpIHtcbiAgICAgICAgICBzdGFydE1lYXN1cmUoaW5zdGFuY2UsIGBjb21waWxlYCk7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgeyBpc0N1c3RvbUVsZW1lbnQsIGNvbXBpbGVyT3B0aW9ucyB9ID0gaW5zdGFuY2UuYXBwQ29udGV4dC5jb25maWc7XG4gICAgICAgIGNvbnN0IHsgZGVsaW1pdGVycywgY29tcGlsZXJPcHRpb25zOiBjb21wb25lbnRDb21waWxlck9wdGlvbnMgfSA9IENvbXBvbmVudDtcbiAgICAgICAgY29uc3QgZmluYWxDb21waWxlck9wdGlvbnMgPSBleHRlbmQoXG4gICAgICAgICAgZXh0ZW5kKFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICBpc0N1c3RvbUVsZW1lbnQsXG4gICAgICAgICAgICAgIGRlbGltaXRlcnNcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBjb21waWxlck9wdGlvbnNcbiAgICAgICAgICApLFxuICAgICAgICAgIGNvbXBvbmVudENvbXBpbGVyT3B0aW9uc1xuICAgICAgICApO1xuICAgICAgICBDb21wb25lbnQucmVuZGVyID0gY29tcGlsZSh0ZW1wbGF0ZSwgZmluYWxDb21waWxlck9wdGlvbnMpO1xuICAgICAgICBpZiAoISEocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09IFwicHJvZHVjdGlvblwiKSkge1xuICAgICAgICAgIGVuZE1lYXN1cmUoaW5zdGFuY2UsIGBjb21waWxlYCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgaW5zdGFuY2UucmVuZGVyID0gQ29tcG9uZW50LnJlbmRlciB8fCBOT09QO1xuICAgIGlmIChpbnN0YWxsV2l0aFByb3h5KSB7XG4gICAgICBpbnN0YWxsV2l0aFByb3h5KGluc3RhbmNlKTtcbiAgICB9XG4gIH1cbiAgaWYgKF9fVlVFX09QVElPTlNfQVBJX18gJiYgdHJ1ZSkge1xuICAgIGNvbnN0IHJlc2V0ID0gc2V0Q3VycmVudEluc3RhbmNlKGluc3RhbmNlKTtcbiAgICBwYXVzZVRyYWNraW5nKCk7XG4gICAgdHJ5IHtcbiAgICAgIGFwcGx5T3B0aW9ucyhpbnN0YW5jZSk7XG4gICAgfSBmaW5hbGx5IHtcbiAgICAgIHJlc2V0VHJhY2tpbmcoKTtcbiAgICAgIHJlc2V0KCk7XG4gICAgfVxuICB9XG4gIGlmICghIShwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gXCJwcm9kdWN0aW9uXCIpICYmICFDb21wb25lbnQucmVuZGVyICYmIGluc3RhbmNlLnJlbmRlciA9PT0gTk9PUCAmJiAhaXNTU1IpIHtcbiAgICBpZiAoIWNvbXBpbGUgJiYgQ29tcG9uZW50LnRlbXBsYXRlKSB7XG4gICAgICB3YXJuJDEoXG4gICAgICAgIGBDb21wb25lbnQgcHJvdmlkZWQgdGVtcGxhdGUgb3B0aW9uIGJ1dCBydW50aW1lIGNvbXBpbGF0aW9uIGlzIG5vdCBzdXBwb3J0ZWQgaW4gdGhpcyBidWlsZCBvZiBWdWUuYCArIChgIENvbmZpZ3VyZSB5b3VyIGJ1bmRsZXIgdG8gYWxpYXMgXCJ2dWVcIiB0byBcInZ1ZS9kaXN0L3Z1ZS5lc20tYnVuZGxlci5qc1wiLmAgKVxuICAgICAgKTtcbiAgICB9IGVsc2Uge1xuICAgICAgd2FybiQxKGBDb21wb25lbnQgaXMgbWlzc2luZyB0ZW1wbGF0ZSBvciByZW5kZXIgZnVuY3Rpb246IGAsIENvbXBvbmVudCk7XG4gICAgfVxuICB9XG59XG5jb25zdCBhdHRyc1Byb3h5SGFuZGxlcnMgPSAhIShwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gXCJwcm9kdWN0aW9uXCIpID8ge1xuICBnZXQodGFyZ2V0LCBrZXkpIHtcbiAgICBtYXJrQXR0cnNBY2Nlc3NlZCgpO1xuICAgIHRyYWNrKHRhcmdldCwgXCJnZXRcIiwgXCJcIik7XG4gICAgcmV0dXJuIHRhcmdldFtrZXldO1xuICB9LFxuICBzZXQoKSB7XG4gICAgd2FybiQxKGBzZXR1cENvbnRleHQuYXR0cnMgaXMgcmVhZG9ubHkuYCk7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9LFxuICBkZWxldGVQcm9wZXJ0eSgpIHtcbiAgICB3YXJuJDEoYHNldHVwQ29udGV4dC5hdHRycyBpcyByZWFkb25seS5gKTtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbn0gOiB7XG4gIGdldCh0YXJnZXQsIGtleSkge1xuICAgIHRyYWNrKHRhcmdldCwgXCJnZXRcIiwgXCJcIik7XG4gICAgcmV0dXJuIHRhcmdldFtrZXldO1xuICB9XG59O1xuZnVuY3Rpb24gZ2V0U2xvdHNQcm94eShpbnN0YW5jZSkge1xuICByZXR1cm4gbmV3IFByb3h5KGluc3RhbmNlLnNsb3RzLCB7XG4gICAgZ2V0KHRhcmdldCwga2V5KSB7XG4gICAgICB0cmFjayhpbnN0YW5jZSwgXCJnZXRcIiwgXCIkc2xvdHNcIik7XG4gICAgICByZXR1cm4gdGFyZ2V0W2tleV07XG4gICAgfVxuICB9KTtcbn1cbmZ1bmN0aW9uIGNyZWF0ZVNldHVwQ29udGV4dChpbnN0YW5jZSkge1xuICBjb25zdCBleHBvc2UgPSAoZXhwb3NlZCkgPT4ge1xuICAgIGlmICghIShwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gXCJwcm9kdWN0aW9uXCIpKSB7XG4gICAgICBpZiAoaW5zdGFuY2UuZXhwb3NlZCkge1xuICAgICAgICB3YXJuJDEoYGV4cG9zZSgpIHNob3VsZCBiZSBjYWxsZWQgb25seSBvbmNlIHBlciBzZXR1cCgpLmApO1xuICAgICAgfVxuICAgICAgaWYgKGV4cG9zZWQgIT0gbnVsbCkge1xuICAgICAgICBsZXQgZXhwb3NlZFR5cGUgPSB0eXBlb2YgZXhwb3NlZDtcbiAgICAgICAgaWYgKGV4cG9zZWRUeXBlID09PSBcIm9iamVjdFwiKSB7XG4gICAgICAgICAgaWYgKGlzQXJyYXkoZXhwb3NlZCkpIHtcbiAgICAgICAgICAgIGV4cG9zZWRUeXBlID0gXCJhcnJheVwiO1xuICAgICAgICAgIH0gZWxzZSBpZiAoaXNSZWYoZXhwb3NlZCkpIHtcbiAgICAgICAgICAgIGV4cG9zZWRUeXBlID0gXCJyZWZcIjtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGV4cG9zZWRUeXBlICE9PSBcIm9iamVjdFwiKSB7XG4gICAgICAgICAgd2FybiQxKFxuICAgICAgICAgICAgYGV4cG9zZSgpIHNob3VsZCBiZSBwYXNzZWQgYSBwbGFpbiBvYmplY3QsIHJlY2VpdmVkICR7ZXhwb3NlZFR5cGV9LmBcbiAgICAgICAgICApO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIGluc3RhbmNlLmV4cG9zZWQgPSBleHBvc2VkIHx8IHt9O1xuICB9O1xuICBpZiAoISEocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09IFwicHJvZHVjdGlvblwiKSkge1xuICAgIGxldCBhdHRyc1Byb3h5O1xuICAgIGxldCBzbG90c1Byb3h5O1xuICAgIHJldHVybiBPYmplY3QuZnJlZXplKHtcbiAgICAgIGdldCBhdHRycygpIHtcbiAgICAgICAgcmV0dXJuIGF0dHJzUHJveHkgfHwgKGF0dHJzUHJveHkgPSBuZXcgUHJveHkoaW5zdGFuY2UuYXR0cnMsIGF0dHJzUHJveHlIYW5kbGVycykpO1xuICAgICAgfSxcbiAgICAgIGdldCBzbG90cygpIHtcbiAgICAgICAgcmV0dXJuIHNsb3RzUHJveHkgfHwgKHNsb3RzUHJveHkgPSBnZXRTbG90c1Byb3h5KGluc3RhbmNlKSk7XG4gICAgICB9LFxuICAgICAgZ2V0IGVtaXQoKSB7XG4gICAgICAgIHJldHVybiAoZXZlbnQsIC4uLmFyZ3MpID0+IGluc3RhbmNlLmVtaXQoZXZlbnQsIC4uLmFyZ3MpO1xuICAgICAgfSxcbiAgICAgIGV4cG9zZVxuICAgIH0pO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiB7XG4gICAgICBhdHRyczogbmV3IFByb3h5KGluc3RhbmNlLmF0dHJzLCBhdHRyc1Byb3h5SGFuZGxlcnMpLFxuICAgICAgc2xvdHM6IGluc3RhbmNlLnNsb3RzLFxuICAgICAgZW1pdDogaW5zdGFuY2UuZW1pdCxcbiAgICAgIGV4cG9zZVxuICAgIH07XG4gIH1cbn1cbmZ1bmN0aW9uIGdldENvbXBvbmVudFB1YmxpY0luc3RhbmNlKGluc3RhbmNlKSB7XG4gIGlmIChpbnN0YW5jZS5leHBvc2VkKSB7XG4gICAgcmV0dXJuIGluc3RhbmNlLmV4cG9zZVByb3h5IHx8IChpbnN0YW5jZS5leHBvc2VQcm94eSA9IG5ldyBQcm94eShwcm94eVJlZnMobWFya1JhdyhpbnN0YW5jZS5leHBvc2VkKSksIHtcbiAgICAgIGdldCh0YXJnZXQsIGtleSkge1xuICAgICAgICBpZiAoa2V5IGluIHRhcmdldCkge1xuICAgICAgICAgIHJldHVybiB0YXJnZXRba2V5XTtcbiAgICAgICAgfSBlbHNlIGlmIChrZXkgaW4gcHVibGljUHJvcGVydGllc01hcCkge1xuICAgICAgICAgIHJldHVybiBwdWJsaWNQcm9wZXJ0aWVzTWFwW2tleV0oaW5zdGFuY2UpO1xuICAgICAgICB9XG4gICAgICB9LFxuICAgICAgaGFzKHRhcmdldCwga2V5KSB7XG4gICAgICAgIHJldHVybiBrZXkgaW4gdGFyZ2V0IHx8IGtleSBpbiBwdWJsaWNQcm9wZXJ0aWVzTWFwO1xuICAgICAgfVxuICAgIH0pKTtcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gaW5zdGFuY2UucHJveHk7XG4gIH1cbn1cbmNvbnN0IGNsYXNzaWZ5UkUgPSAvKD86XnxbLV9dKVxcdy9nO1xuY29uc3QgY2xhc3NpZnkgPSAoc3RyKSA9PiBzdHIucmVwbGFjZShjbGFzc2lmeVJFLCAoYykgPT4gYy50b1VwcGVyQ2FzZSgpKS5yZXBsYWNlKC9bLV9dL2csIFwiXCIpO1xuZnVuY3Rpb24gZ2V0Q29tcG9uZW50TmFtZShDb21wb25lbnQsIGluY2x1ZGVJbmZlcnJlZCA9IHRydWUpIHtcbiAgcmV0dXJuIGlzRnVuY3Rpb24oQ29tcG9uZW50KSA/IENvbXBvbmVudC5kaXNwbGF5TmFtZSB8fCBDb21wb25lbnQubmFtZSA6IENvbXBvbmVudC5uYW1lIHx8IGluY2x1ZGVJbmZlcnJlZCAmJiBDb21wb25lbnQuX19uYW1lO1xufVxuZnVuY3Rpb24gZm9ybWF0Q29tcG9uZW50TmFtZShpbnN0YW5jZSwgQ29tcG9uZW50LCBpc1Jvb3QgPSBmYWxzZSkge1xuICBsZXQgbmFtZSA9IGdldENvbXBvbmVudE5hbWUoQ29tcG9uZW50KTtcbiAgaWYgKCFuYW1lICYmIENvbXBvbmVudC5fX2ZpbGUpIHtcbiAgICBjb25zdCBtYXRjaCA9IENvbXBvbmVudC5fX2ZpbGUubWF0Y2goLyhbXi9cXFxcXSspXFwuXFx3KyQvKTtcbiAgICBpZiAobWF0Y2gpIHtcbiAgICAgIG5hbWUgPSBtYXRjaFsxXTtcbiAgICB9XG4gIH1cbiAgaWYgKCFuYW1lICYmIGluc3RhbmNlKSB7XG4gICAgY29uc3QgaW5mZXJGcm9tUmVnaXN0cnkgPSAocmVnaXN0cnkpID0+IHtcbiAgICAgIGZvciAoY29uc3Qga2V5IGluIHJlZ2lzdHJ5KSB7XG4gICAgICAgIGlmIChyZWdpc3RyeVtrZXldID09PSBDb21wb25lbnQpIHtcbiAgICAgICAgICByZXR1cm4ga2V5O1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfTtcbiAgICBuYW1lID0gaW5mZXJGcm9tUmVnaXN0cnkoaW5zdGFuY2UuY29tcG9uZW50cykgfHwgaW5zdGFuY2UucGFyZW50ICYmIGluZmVyRnJvbVJlZ2lzdHJ5KFxuICAgICAgaW5zdGFuY2UucGFyZW50LnR5cGUuY29tcG9uZW50c1xuICAgICkgfHwgaW5mZXJGcm9tUmVnaXN0cnkoaW5zdGFuY2UuYXBwQ29udGV4dC5jb21wb25lbnRzKTtcbiAgfVxuICByZXR1cm4gbmFtZSA/IGNsYXNzaWZ5KG5hbWUpIDogaXNSb290ID8gYEFwcGAgOiBgQW5vbnltb3VzYDtcbn1cbmZ1bmN0aW9uIGlzQ2xhc3NDb21wb25lbnQodmFsdWUpIHtcbiAgcmV0dXJuIGlzRnVuY3Rpb24odmFsdWUpICYmIFwiX192Y2NPcHRzXCIgaW4gdmFsdWU7XG59XG5cbmNvbnN0IGNvbXB1dGVkID0gKGdldHRlck9yT3B0aW9ucywgZGVidWdPcHRpb25zKSA9PiB7XG4gIGNvbnN0IGMgPSBjb21wdXRlZCQxKGdldHRlck9yT3B0aW9ucywgZGVidWdPcHRpb25zLCBpc0luU1NSQ29tcG9uZW50U2V0dXApO1xuICBpZiAoISEocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09IFwicHJvZHVjdGlvblwiKSkge1xuICAgIGNvbnN0IGkgPSBnZXRDdXJyZW50SW5zdGFuY2UoKTtcbiAgICBpZiAoaSAmJiBpLmFwcENvbnRleHQuY29uZmlnLndhcm5SZWN1cnNpdmVDb21wdXRlZCkge1xuICAgICAgYy5fd2FyblJlY3Vyc2l2ZSA9IHRydWU7XG4gICAgfVxuICB9XG4gIHJldHVybiBjO1xufTtcblxuZnVuY3Rpb24gaCh0eXBlLCBwcm9wc09yQ2hpbGRyZW4sIGNoaWxkcmVuKSB7XG4gIHRyeSB7XG4gICAgc2V0QmxvY2tUcmFja2luZygtMSk7XG4gICAgY29uc3QgbCA9IGFyZ3VtZW50cy5sZW5ndGg7XG4gICAgaWYgKGwgPT09IDIpIHtcbiAgICAgIGlmIChpc09iamVjdChwcm9wc09yQ2hpbGRyZW4pICYmICFpc0FycmF5KHByb3BzT3JDaGlsZHJlbikpIHtcbiAgICAgICAgaWYgKGlzVk5vZGUocHJvcHNPckNoaWxkcmVuKSkge1xuICAgICAgICAgIHJldHVybiBjcmVhdGVWTm9kZSh0eXBlLCBudWxsLCBbcHJvcHNPckNoaWxkcmVuXSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGNyZWF0ZVZOb2RlKHR5cGUsIHByb3BzT3JDaGlsZHJlbik7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gY3JlYXRlVk5vZGUodHlwZSwgbnVsbCwgcHJvcHNPckNoaWxkcmVuKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgaWYgKGwgPiAzKSB7XG4gICAgICAgIGNoaWxkcmVuID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAyKTtcbiAgICAgIH0gZWxzZSBpZiAobCA9PT0gMyAmJiBpc1ZOb2RlKGNoaWxkcmVuKSkge1xuICAgICAgICBjaGlsZHJlbiA9IFtjaGlsZHJlbl07XG4gICAgICB9XG4gICAgICByZXR1cm4gY3JlYXRlVk5vZGUodHlwZSwgcHJvcHNPckNoaWxkcmVuLCBjaGlsZHJlbik7XG4gICAgfVxuICB9IGZpbmFsbHkge1xuICAgIHNldEJsb2NrVHJhY2tpbmcoMSk7XG4gIH1cbn1cblxuZnVuY3Rpb24gaW5pdEN1c3RvbUZvcm1hdHRlcigpIHtcbiAgaWYgKCEhIShwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gXCJwcm9kdWN0aW9uXCIpIHx8IHR5cGVvZiB3aW5kb3cgPT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICByZXR1cm47XG4gIH1cbiAgY29uc3QgdnVlU3R5bGUgPSB7IHN0eWxlOiBcImNvbG9yOiMzYmE3NzZcIiB9O1xuICBjb25zdCBudW1iZXJTdHlsZSA9IHsgc3R5bGU6IFwiY29sb3I6IzE2NzdmZlwiIH07XG4gIGNvbnN0IHN0cmluZ1N0eWxlID0geyBzdHlsZTogXCJjb2xvcjojZjUyMjJkXCIgfTtcbiAgY29uc3Qga2V5d29yZFN0eWxlID0geyBzdHlsZTogXCJjb2xvcjojZWIyZjk2XCIgfTtcbiAgY29uc3QgZm9ybWF0dGVyID0ge1xuICAgIF9fdnVlX2N1c3RvbV9mb3JtYXR0ZXI6IHRydWUsXG4gICAgaGVhZGVyKG9iaikge1xuICAgICAgaWYgKCFpc09iamVjdChvYmopKSB7XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgICAgfVxuICAgICAgaWYgKG9iai5fX2lzVnVlKSB7XG4gICAgICAgIHJldHVybiBbXCJkaXZcIiwgdnVlU3R5bGUsIGBWdWVJbnN0YW5jZWBdO1xuICAgICAgfSBlbHNlIGlmIChpc1JlZihvYmopKSB7XG4gICAgICAgIHBhdXNlVHJhY2tpbmcoKTtcbiAgICAgICAgY29uc3QgdmFsdWUgPSBvYmoudmFsdWU7XG4gICAgICAgIHJlc2V0VHJhY2tpbmcoKTtcbiAgICAgICAgcmV0dXJuIFtcbiAgICAgICAgICBcImRpdlwiLFxuICAgICAgICAgIHt9LFxuICAgICAgICAgIFtcInNwYW5cIiwgdnVlU3R5bGUsIGdlblJlZkZsYWcob2JqKV0sXG4gICAgICAgICAgXCI8XCIsXG4gICAgICAgICAgZm9ybWF0VmFsdWUodmFsdWUpLFxuICAgICAgICAgIGA+YFxuICAgICAgICBdO1xuICAgICAgfSBlbHNlIGlmIChpc1JlYWN0aXZlKG9iaikpIHtcbiAgICAgICAgcmV0dXJuIFtcbiAgICAgICAgICBcImRpdlwiLFxuICAgICAgICAgIHt9LFxuICAgICAgICAgIFtcInNwYW5cIiwgdnVlU3R5bGUsIGlzU2hhbGxvdyhvYmopID8gXCJTaGFsbG93UmVhY3RpdmVcIiA6IFwiUmVhY3RpdmVcIl0sXG4gICAgICAgICAgXCI8XCIsXG4gICAgICAgICAgZm9ybWF0VmFsdWUob2JqKSxcbiAgICAgICAgICBgPiR7aXNSZWFkb25seShvYmopID8gYCAocmVhZG9ubHkpYCA6IGBgfWBcbiAgICAgICAgXTtcbiAgICAgIH0gZWxzZSBpZiAoaXNSZWFkb25seShvYmopKSB7XG4gICAgICAgIHJldHVybiBbXG4gICAgICAgICAgXCJkaXZcIixcbiAgICAgICAgICB7fSxcbiAgICAgICAgICBbXCJzcGFuXCIsIHZ1ZVN0eWxlLCBpc1NoYWxsb3cob2JqKSA/IFwiU2hhbGxvd1JlYWRvbmx5XCIgOiBcIlJlYWRvbmx5XCJdLFxuICAgICAgICAgIFwiPFwiLFxuICAgICAgICAgIGZvcm1hdFZhbHVlKG9iaiksXG4gICAgICAgICAgXCI+XCJcbiAgICAgICAgXTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBudWxsO1xuICAgIH0sXG4gICAgaGFzQm9keShvYmopIHtcbiAgICAgIHJldHVybiBvYmogJiYgb2JqLl9faXNWdWU7XG4gICAgfSxcbiAgICBib2R5KG9iaikge1xuICAgICAgaWYgKG9iaiAmJiBvYmouX19pc1Z1ZSkge1xuICAgICAgICByZXR1cm4gW1xuICAgICAgICAgIFwiZGl2XCIsXG4gICAgICAgICAge30sXG4gICAgICAgICAgLi4uZm9ybWF0SW5zdGFuY2Uob2JqLiQpXG4gICAgICAgIF07XG4gICAgICB9XG4gICAgfVxuICB9O1xuICBmdW5jdGlvbiBmb3JtYXRJbnN0YW5jZShpbnN0YW5jZSkge1xuICAgIGNvbnN0IGJsb2NrcyA9IFtdO1xuICAgIGlmIChpbnN0YW5jZS50eXBlLnByb3BzICYmIGluc3RhbmNlLnByb3BzKSB7XG4gICAgICBibG9ja3MucHVzaChjcmVhdGVJbnN0YW5jZUJsb2NrKFwicHJvcHNcIiwgdG9SYXcoaW5zdGFuY2UucHJvcHMpKSk7XG4gICAgfVxuICAgIGlmIChpbnN0YW5jZS5zZXR1cFN0YXRlICE9PSBFTVBUWV9PQkopIHtcbiAgICAgIGJsb2Nrcy5wdXNoKGNyZWF0ZUluc3RhbmNlQmxvY2soXCJzZXR1cFwiLCBpbnN0YW5jZS5zZXR1cFN0YXRlKSk7XG4gICAgfVxuICAgIGlmIChpbnN0YW5jZS5kYXRhICE9PSBFTVBUWV9PQkopIHtcbiAgICAgIGJsb2Nrcy5wdXNoKGNyZWF0ZUluc3RhbmNlQmxvY2soXCJkYXRhXCIsIHRvUmF3KGluc3RhbmNlLmRhdGEpKSk7XG4gICAgfVxuICAgIGNvbnN0IGNvbXB1dGVkID0gZXh0cmFjdEtleXMoaW5zdGFuY2UsIFwiY29tcHV0ZWRcIik7XG4gICAgaWYgKGNvbXB1dGVkKSB7XG4gICAgICBibG9ja3MucHVzaChjcmVhdGVJbnN0YW5jZUJsb2NrKFwiY29tcHV0ZWRcIiwgY29tcHV0ZWQpKTtcbiAgICB9XG4gICAgY29uc3QgaW5qZWN0ZWQgPSBleHRyYWN0S2V5cyhpbnN0YW5jZSwgXCJpbmplY3RcIik7XG4gICAgaWYgKGluamVjdGVkKSB7XG4gICAgICBibG9ja3MucHVzaChjcmVhdGVJbnN0YW5jZUJsb2NrKFwiaW5qZWN0ZWRcIiwgaW5qZWN0ZWQpKTtcbiAgICB9XG4gICAgYmxvY2tzLnB1c2goW1xuICAgICAgXCJkaXZcIixcbiAgICAgIHt9LFxuICAgICAgW1xuICAgICAgICBcInNwYW5cIixcbiAgICAgICAge1xuICAgICAgICAgIHN0eWxlOiBrZXl3b3JkU3R5bGUuc3R5bGUgKyBcIjtvcGFjaXR5OjAuNjZcIlxuICAgICAgICB9LFxuICAgICAgICBcIiQgKGludGVybmFsKTogXCJcbiAgICAgIF0sXG4gICAgICBbXCJvYmplY3RcIiwgeyBvYmplY3Q6IGluc3RhbmNlIH1dXG4gICAgXSk7XG4gICAgcmV0dXJuIGJsb2NrcztcbiAgfVxuICBmdW5jdGlvbiBjcmVhdGVJbnN0YW5jZUJsb2NrKHR5cGUsIHRhcmdldCkge1xuICAgIHRhcmdldCA9IGV4dGVuZCh7fSwgdGFyZ2V0KTtcbiAgICBpZiAoIU9iamVjdC5rZXlzKHRhcmdldCkubGVuZ3RoKSB7XG4gICAgICByZXR1cm4gW1wic3BhblwiLCB7fV07XG4gICAgfVxuICAgIHJldHVybiBbXG4gICAgICBcImRpdlwiLFxuICAgICAgeyBzdHlsZTogXCJsaW5lLWhlaWdodDoxLjI1ZW07bWFyZ2luLWJvdHRvbTowLjZlbVwiIH0sXG4gICAgICBbXG4gICAgICAgIFwiZGl2XCIsXG4gICAgICAgIHtcbiAgICAgICAgICBzdHlsZTogXCJjb2xvcjojNDc2NTgyXCJcbiAgICAgICAgfSxcbiAgICAgICAgdHlwZVxuICAgICAgXSxcbiAgICAgIFtcbiAgICAgICAgXCJkaXZcIixcbiAgICAgICAge1xuICAgICAgICAgIHN0eWxlOiBcInBhZGRpbmctbGVmdDoxLjI1ZW1cIlxuICAgICAgICB9LFxuICAgICAgICAuLi5PYmplY3Qua2V5cyh0YXJnZXQpLm1hcCgoa2V5KSA9PiB7XG4gICAgICAgICAgcmV0dXJuIFtcbiAgICAgICAgICAgIFwiZGl2XCIsXG4gICAgICAgICAgICB7fSxcbiAgICAgICAgICAgIFtcInNwYW5cIiwga2V5d29yZFN0eWxlLCBrZXkgKyBcIjogXCJdLFxuICAgICAgICAgICAgZm9ybWF0VmFsdWUodGFyZ2V0W2tleV0sIGZhbHNlKVxuICAgICAgICAgIF07XG4gICAgICAgIH0pXG4gICAgICBdXG4gICAgXTtcbiAgfVxuICBmdW5jdGlvbiBmb3JtYXRWYWx1ZSh2LCBhc1JhdyA9IHRydWUpIHtcbiAgICBpZiAodHlwZW9mIHYgPT09IFwibnVtYmVyXCIpIHtcbiAgICAgIHJldHVybiBbXCJzcGFuXCIsIG51bWJlclN0eWxlLCB2XTtcbiAgICB9IGVsc2UgaWYgKHR5cGVvZiB2ID09PSBcInN0cmluZ1wiKSB7XG4gICAgICByZXR1cm4gW1wic3BhblwiLCBzdHJpbmdTdHlsZSwgSlNPTi5zdHJpbmdpZnkodildO1xuICAgIH0gZWxzZSBpZiAodHlwZW9mIHYgPT09IFwiYm9vbGVhblwiKSB7XG4gICAgICByZXR1cm4gW1wic3BhblwiLCBrZXl3b3JkU3R5bGUsIHZdO1xuICAgIH0gZWxzZSBpZiAoaXNPYmplY3QodikpIHtcbiAgICAgIHJldHVybiBbXCJvYmplY3RcIiwgeyBvYmplY3Q6IGFzUmF3ID8gdG9SYXcodikgOiB2IH1dO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gW1wic3BhblwiLCBzdHJpbmdTdHlsZSwgU3RyaW5nKHYpXTtcbiAgICB9XG4gIH1cbiAgZnVuY3Rpb24gZXh0cmFjdEtleXMoaW5zdGFuY2UsIHR5cGUpIHtcbiAgICBjb25zdCBDb21wID0gaW5zdGFuY2UudHlwZTtcbiAgICBpZiAoaXNGdW5jdGlvbihDb21wKSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBjb25zdCBleHRyYWN0ZWQgPSB7fTtcbiAgICBmb3IgKGNvbnN0IGtleSBpbiBpbnN0YW5jZS5jdHgpIHtcbiAgICAgIGlmIChpc0tleU9mVHlwZShDb21wLCBrZXksIHR5cGUpKSB7XG4gICAgICAgIGV4dHJhY3RlZFtrZXldID0gaW5zdGFuY2UuY3R4W2tleV07XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBleHRyYWN0ZWQ7XG4gIH1cbiAgZnVuY3Rpb24gaXNLZXlPZlR5cGUoQ29tcCwga2V5LCB0eXBlKSB7XG4gICAgY29uc3Qgb3B0cyA9IENvbXBbdHlwZV07XG4gICAgaWYgKGlzQXJyYXkob3B0cykgJiYgb3B0cy5pbmNsdWRlcyhrZXkpIHx8IGlzT2JqZWN0KG9wdHMpICYmIGtleSBpbiBvcHRzKSB7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gICAgaWYgKENvbXAuZXh0ZW5kcyAmJiBpc0tleU9mVHlwZShDb21wLmV4dGVuZHMsIGtleSwgdHlwZSkpIHtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICBpZiAoQ29tcC5taXhpbnMgJiYgQ29tcC5taXhpbnMuc29tZSgobSkgPT4gaXNLZXlPZlR5cGUobSwga2V5LCB0eXBlKSkpIHtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgfVxuICBmdW5jdGlvbiBnZW5SZWZGbGFnKHYpIHtcbiAgICBpZiAoaXNTaGFsbG93KHYpKSB7XG4gICAgICByZXR1cm4gYFNoYWxsb3dSZWZgO1xuICAgIH1cbiAgICBpZiAodi5lZmZlY3QpIHtcbiAgICAgIHJldHVybiBgQ29tcHV0ZWRSZWZgO1xuICAgIH1cbiAgICByZXR1cm4gYFJlZmA7XG4gIH1cbiAgaWYgKHdpbmRvdy5kZXZ0b29sc0Zvcm1hdHRlcnMpIHtcbiAgICB3aW5kb3cuZGV2dG9vbHNGb3JtYXR0ZXJzLnB1c2goZm9ybWF0dGVyKTtcbiAgfSBlbHNlIHtcbiAgICB3aW5kb3cuZGV2dG9vbHNGb3JtYXR0ZXJzID0gW2Zvcm1hdHRlcl07XG4gIH1cbn1cblxuZnVuY3Rpb24gd2l0aE1lbW8obWVtbywgcmVuZGVyLCBjYWNoZSwgaW5kZXgpIHtcbiAgY29uc3QgY2FjaGVkID0gY2FjaGVbaW5kZXhdO1xuICBpZiAoY2FjaGVkICYmIGlzTWVtb1NhbWUoY2FjaGVkLCBtZW1vKSkge1xuICAgIHJldHVybiBjYWNoZWQ7XG4gIH1cbiAgY29uc3QgcmV0ID0gcmVuZGVyKCk7XG4gIHJldC5tZW1vID0gbWVtby5zbGljZSgpO1xuICByZXQuY2FjaGVJbmRleCA9IGluZGV4O1xuICByZXR1cm4gY2FjaGVbaW5kZXhdID0gcmV0O1xufVxuZnVuY3Rpb24gaXNNZW1vU2FtZShjYWNoZWQsIG1lbW8pIHtcbiAgY29uc3QgcHJldiA9IGNhY2hlZC5tZW1vO1xuICBpZiAocHJldi5sZW5ndGggIT0gbWVtby5sZW5ndGgpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBwcmV2Lmxlbmd0aDsgaSsrKSB7XG4gICAgaWYgKGhhc0NoYW5nZWQocHJldltpXSwgbWVtb1tpXSkpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gIH1cbiAgaWYgKGlzQmxvY2tUcmVlRW5hYmxlZCA+IDAgJiYgY3VycmVudEJsb2NrKSB7XG4gICAgY3VycmVudEJsb2NrLnB1c2goY2FjaGVkKTtcbiAgfVxuICByZXR1cm4gdHJ1ZTtcbn1cblxuY29uc3QgdmVyc2lvbiA9IFwiMy41LjI4XCI7XG5jb25zdCB3YXJuID0gISEocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09IFwicHJvZHVjdGlvblwiKSA/IHdhcm4kMSA6IE5PT1A7XG5jb25zdCBFcnJvclR5cGVTdHJpbmdzID0gRXJyb3JUeXBlU3RyaW5ncyQxIDtcbmNvbnN0IGRldnRvb2xzID0gISEocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09IFwicHJvZHVjdGlvblwiKSB8fCB0cnVlID8gZGV2dG9vbHMkMSA6IHZvaWQgMDtcbmNvbnN0IHNldERldnRvb2xzSG9vayA9ICEhKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSBcInByb2R1Y3Rpb25cIikgfHwgdHJ1ZSA/IHNldERldnRvb2xzSG9vayQxIDogTk9PUDtcbmNvbnN0IF9zc3JVdGlscyA9IHtcbiAgY3JlYXRlQ29tcG9uZW50SW5zdGFuY2UsXG4gIHNldHVwQ29tcG9uZW50LFxuICByZW5kZXJDb21wb25lbnRSb290LFxuICBzZXRDdXJyZW50UmVuZGVyaW5nSW5zdGFuY2UsXG4gIGlzVk5vZGU6IGlzVk5vZGUsXG4gIG5vcm1hbGl6ZVZOb2RlLFxuICBnZXRDb21wb25lbnRQdWJsaWNJbnN0YW5jZSxcbiAgZW5zdXJlVmFsaWRWTm9kZSxcbiAgcHVzaFdhcm5pbmdDb250ZXh0LFxuICBwb3BXYXJuaW5nQ29udGV4dFxufTtcbmNvbnN0IHNzclV0aWxzID0gX3NzclV0aWxzIDtcbmNvbnN0IHJlc29sdmVGaWx0ZXIgPSBudWxsO1xuY29uc3QgY29tcGF0VXRpbHMgPSBudWxsO1xuY29uc3QgRGVwcmVjYXRpb25UeXBlcyA9IG51bGw7XG5cbmV4cG9ydCB7IEJhc2VUcmFuc2l0aW9uLCBCYXNlVHJhbnNpdGlvblByb3BzVmFsaWRhdG9ycywgQ29tbWVudCwgRGVwcmVjYXRpb25UeXBlcywgRXJyb3JDb2RlcywgRXJyb3JUeXBlU3RyaW5ncywgRnJhZ21lbnQsIEtlZXBBbGl2ZSwgU3RhdGljLCBTdXNwZW5zZSwgVGVsZXBvcnQsIFRleHQsIGFzc2VydE51bWJlciwgY2FsbFdpdGhBc3luY0Vycm9ySGFuZGxpbmcsIGNhbGxXaXRoRXJyb3JIYW5kbGluZywgY2xvbmVWTm9kZSwgY29tcGF0VXRpbHMsIGNvbXB1dGVkLCBjcmVhdGVCbG9jaywgY3JlYXRlQ29tbWVudFZOb2RlLCBjcmVhdGVFbGVtZW50QmxvY2ssIGNyZWF0ZUJhc2VWTm9kZSBhcyBjcmVhdGVFbGVtZW50Vk5vZGUsIGNyZWF0ZUh5ZHJhdGlvblJlbmRlcmVyLCBjcmVhdGVQcm9wc1Jlc3RQcm94eSwgY3JlYXRlUmVuZGVyZXIsIGNyZWF0ZVNsb3RzLCBjcmVhdGVTdGF0aWNWTm9kZSwgY3JlYXRlVGV4dFZOb2RlLCBjcmVhdGVWTm9kZSwgZGVmaW5lQXN5bmNDb21wb25lbnQsIGRlZmluZUNvbXBvbmVudCwgZGVmaW5lRW1pdHMsIGRlZmluZUV4cG9zZSwgZGVmaW5lTW9kZWwsIGRlZmluZU9wdGlvbnMsIGRlZmluZVByb3BzLCBkZWZpbmVTbG90cywgZGV2dG9vbHMsIGdldEN1cnJlbnRJbnN0YW5jZSwgZ2V0VHJhbnNpdGlvblJhd0NoaWxkcmVuLCBndWFyZFJlYWN0aXZlUHJvcHMsIGgsIGhhbmRsZUVycm9yLCBoYXNJbmplY3Rpb25Db250ZXh0LCBoeWRyYXRlT25JZGxlLCBoeWRyYXRlT25JbnRlcmFjdGlvbiwgaHlkcmF0ZU9uTWVkaWFRdWVyeSwgaHlkcmF0ZU9uVmlzaWJsZSwgaW5pdEN1c3RvbUZvcm1hdHRlciwgaW5qZWN0LCBpc01lbW9TYW1lLCBpc1J1bnRpbWVPbmx5LCBpc1ZOb2RlLCBtZXJnZURlZmF1bHRzLCBtZXJnZU1vZGVscywgbWVyZ2VQcm9wcywgbmV4dFRpY2ssIG9uQWN0aXZhdGVkLCBvbkJlZm9yZU1vdW50LCBvbkJlZm9yZVVubW91bnQsIG9uQmVmb3JlVXBkYXRlLCBvbkRlYWN0aXZhdGVkLCBvbkVycm9yQ2FwdHVyZWQsIG9uTW91bnRlZCwgb25SZW5kZXJUcmFja2VkLCBvblJlbmRlclRyaWdnZXJlZCwgb25TZXJ2ZXJQcmVmZXRjaCwgb25Vbm1vdW50ZWQsIG9uVXBkYXRlZCwgb3BlbkJsb2NrLCBwb3BTY29wZUlkLCBwcm92aWRlLCBwdXNoU2NvcGVJZCwgcXVldWVQb3N0Rmx1c2hDYiwgcmVnaXN0ZXJSdW50aW1lQ29tcGlsZXIsIHJlbmRlckxpc3QsIHJlbmRlclNsb3QsIHJlc29sdmVDb21wb25lbnQsIHJlc29sdmVEaXJlY3RpdmUsIHJlc29sdmVEeW5hbWljQ29tcG9uZW50LCByZXNvbHZlRmlsdGVyLCByZXNvbHZlVHJhbnNpdGlvbkhvb2tzLCBzZXRCbG9ja1RyYWNraW5nLCBzZXREZXZ0b29sc0hvb2ssIHNldFRyYW5zaXRpb25Ib29rcywgc3NyQ29udGV4dEtleSwgc3NyVXRpbHMsIHRvSGFuZGxlcnMsIHRyYW5zZm9ybVZOb2RlQXJncywgdXNlQXR0cnMsIHVzZUlkLCB1c2VNb2RlbCwgdXNlU1NSQ29udGV4dCwgdXNlU2xvdHMsIHVzZVRlbXBsYXRlUmVmLCB1c2VUcmFuc2l0aW9uU3RhdGUsIHZlcnNpb24sIHdhcm4sIHdhdGNoLCB3YXRjaEVmZmVjdCwgd2F0Y2hQb3N0RWZmZWN0LCB3YXRjaFN5bmNFZmZlY3QsIHdpdGhBc3luY0NvbnRleHQsIHdpdGhDdHgsIHdpdGhEZWZhdWx0cywgd2l0aERpcmVjdGl2ZXMsIHdpdGhNZW1vLCB3aXRoU2NvcGVJZCB9O1xuIiwiLyoqXG4qIEB2dWUvcnVudGltZS1kb20gdjMuNS4yOFxuKiAoYykgMjAxOC1wcmVzZW50IFl1eGkgKEV2YW4pIFlvdSBhbmQgVnVlIGNvbnRyaWJ1dG9yc1xuKiBAbGljZW5zZSBNSVRcbioqL1xuaW1wb3J0IHsgd2FybiwgQmFzZVRyYW5zaXRpb25Qcm9wc1ZhbGlkYXRvcnMsIGgsIEJhc2VUcmFuc2l0aW9uLCBhc3NlcnROdW1iZXIsIGdldEN1cnJlbnRJbnN0YW5jZSwgb25CZWZvcmVVcGRhdGUsIHF1ZXVlUG9zdEZsdXNoQ2IsIG9uTW91bnRlZCwgd2F0Y2gsIG9uVW5tb3VudGVkLCBGcmFnbWVudCwgU3RhdGljLCBjYW1lbGl6ZSwgY2FsbFdpdGhBc3luY0Vycm9ySGFuZGxpbmcsIG5leHRUaWNrLCB1bnJlZiwgY3JlYXRlVk5vZGUsIGRlZmluZUNvbXBvbmVudCwgdXNlVHJhbnNpdGlvblN0YXRlLCBvblVwZGF0ZWQsIHRvUmF3LCBnZXRUcmFuc2l0aW9uUmF3Q2hpbGRyZW4sIHNldFRyYW5zaXRpb25Ib29rcywgcmVzb2x2ZVRyYW5zaXRpb25Ib29rcywgVGV4dCwgY3JlYXRlUmVuZGVyZXIsIGlzUnVudGltZU9ubHksIGNyZWF0ZUh5ZHJhdGlvblJlbmRlcmVyIH0gZnJvbSAnQHZ1ZS9ydW50aW1lLWNvcmUnO1xuZXhwb3J0ICogZnJvbSAnQHZ1ZS9ydW50aW1lLWNvcmUnO1xuaW1wb3J0IHsgZXh0ZW5kLCBpc09iamVjdCwgdG9OdW1iZXIsIGlzQXJyYXksIE5PT1AsIG5vcm1hbGl6ZUNzc1ZhclZhbHVlLCBpc1N0cmluZywgaHlwaGVuYXRlLCBjYXBpdGFsaXplLCBpbmNsdWRlQm9vbGVhbkF0dHIsIGlzU3ltYm9sLCBpc1NwZWNpYWxCb29sZWFuQXR0ciwgaXNGdW5jdGlvbiwgaXNPbiwgaXNNb2RlbExpc3RlbmVyLCBjYW1lbGl6ZSBhcyBjYW1lbGl6ZSQxLCBoYXNPd24sIGlzUGxhaW5PYmplY3QsIEVNUFRZX09CSiwgbG9vc2VJbmRleE9mLCBpc1NldCwgbG9vc2VFcXVhbCwgbG9vc2VUb051bWJlciwgaW52b2tlQXJyYXlGbnMsIGlzSFRNTFRhZywgaXNTVkdUYWcsIGlzTWF0aE1MVGFnIH0gZnJvbSAnQHZ1ZS9zaGFyZWQnO1xuXG5sZXQgcG9saWN5ID0gdm9pZCAwO1xuY29uc3QgdHQgPSB0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiICYmIHdpbmRvdy50cnVzdGVkVHlwZXM7XG5pZiAodHQpIHtcbiAgdHJ5IHtcbiAgICBwb2xpY3kgPSAvKiBAX19QVVJFX18gKi8gdHQuY3JlYXRlUG9saWN5KFwidnVlXCIsIHtcbiAgICAgIGNyZWF0ZUhUTUw6ICh2YWwpID0+IHZhbFxuICAgIH0pO1xuICB9IGNhdGNoIChlKSB7XG4gICAgISEocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09IFwicHJvZHVjdGlvblwiKSAmJiB3YXJuKGBFcnJvciBjcmVhdGluZyB0cnVzdGVkIHR5cGVzIHBvbGljeTogJHtlfWApO1xuICB9XG59XG5jb25zdCB1bnNhZmVUb1RydXN0ZWRIVE1MID0gcG9saWN5ID8gKHZhbCkgPT4gcG9saWN5LmNyZWF0ZUhUTUwodmFsKSA6ICh2YWwpID0+IHZhbDtcbmNvbnN0IHN2Z05TID0gXCJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Z1wiO1xuY29uc3QgbWF0aG1sTlMgPSBcImh0dHA6Ly93d3cudzMub3JnLzE5OTgvTWF0aC9NYXRoTUxcIjtcbmNvbnN0IGRvYyA9IHR5cGVvZiBkb2N1bWVudCAhPT0gXCJ1bmRlZmluZWRcIiA/IGRvY3VtZW50IDogbnVsbDtcbmNvbnN0IHRlbXBsYXRlQ29udGFpbmVyID0gZG9jICYmIC8qIEBfX1BVUkVfXyAqLyBkb2MuY3JlYXRlRWxlbWVudChcInRlbXBsYXRlXCIpO1xuY29uc3Qgbm9kZU9wcyA9IHtcbiAgaW5zZXJ0OiAoY2hpbGQsIHBhcmVudCwgYW5jaG9yKSA9PiB7XG4gICAgcGFyZW50Lmluc2VydEJlZm9yZShjaGlsZCwgYW5jaG9yIHx8IG51bGwpO1xuICB9LFxuICByZW1vdmU6IChjaGlsZCkgPT4ge1xuICAgIGNvbnN0IHBhcmVudCA9IGNoaWxkLnBhcmVudE5vZGU7XG4gICAgaWYgKHBhcmVudCkge1xuICAgICAgcGFyZW50LnJlbW92ZUNoaWxkKGNoaWxkKTtcbiAgICB9XG4gIH0sXG4gIGNyZWF0ZUVsZW1lbnQ6ICh0YWcsIG5hbWVzcGFjZSwgaXMsIHByb3BzKSA9PiB7XG4gICAgY29uc3QgZWwgPSBuYW1lc3BhY2UgPT09IFwic3ZnXCIgPyBkb2MuY3JlYXRlRWxlbWVudE5TKHN2Z05TLCB0YWcpIDogbmFtZXNwYWNlID09PSBcIm1hdGhtbFwiID8gZG9jLmNyZWF0ZUVsZW1lbnROUyhtYXRobWxOUywgdGFnKSA6IGlzID8gZG9jLmNyZWF0ZUVsZW1lbnQodGFnLCB7IGlzIH0pIDogZG9jLmNyZWF0ZUVsZW1lbnQodGFnKTtcbiAgICBpZiAodGFnID09PSBcInNlbGVjdFwiICYmIHByb3BzICYmIHByb3BzLm11bHRpcGxlICE9IG51bGwpIHtcbiAgICAgIGVsLnNldEF0dHJpYnV0ZShcIm11bHRpcGxlXCIsIHByb3BzLm11bHRpcGxlKTtcbiAgICB9XG4gICAgcmV0dXJuIGVsO1xuICB9LFxuICBjcmVhdGVUZXh0OiAodGV4dCkgPT4gZG9jLmNyZWF0ZVRleHROb2RlKHRleHQpLFxuICBjcmVhdGVDb21tZW50OiAodGV4dCkgPT4gZG9jLmNyZWF0ZUNvbW1lbnQodGV4dCksXG4gIHNldFRleHQ6IChub2RlLCB0ZXh0KSA9PiB7XG4gICAgbm9kZS5ub2RlVmFsdWUgPSB0ZXh0O1xuICB9LFxuICBzZXRFbGVtZW50VGV4dDogKGVsLCB0ZXh0KSA9PiB7XG4gICAgZWwudGV4dENvbnRlbnQgPSB0ZXh0O1xuICB9LFxuICBwYXJlbnROb2RlOiAobm9kZSkgPT4gbm9kZS5wYXJlbnROb2RlLFxuICBuZXh0U2libGluZzogKG5vZGUpID0+IG5vZGUubmV4dFNpYmxpbmcsXG4gIHF1ZXJ5U2VsZWN0b3I6IChzZWxlY3RvcikgPT4gZG9jLnF1ZXJ5U2VsZWN0b3Ioc2VsZWN0b3IpLFxuICBzZXRTY29wZUlkKGVsLCBpZCkge1xuICAgIGVsLnNldEF0dHJpYnV0ZShpZCwgXCJcIik7XG4gIH0sXG4gIC8vIF9fVU5TQUZFX19cbiAgLy8gUmVhc29uOiBpbm5lckhUTUwuXG4gIC8vIFN0YXRpYyBjb250ZW50IGhlcmUgY2FuIG9ubHkgY29tZSBmcm9tIGNvbXBpbGVkIHRlbXBsYXRlcy5cbiAgLy8gQXMgbG9uZyBhcyB0aGUgdXNlciBvbmx5IHVzZXMgdHJ1c3RlZCB0ZW1wbGF0ZXMsIHRoaXMgaXMgc2FmZS5cbiAgaW5zZXJ0U3RhdGljQ29udGVudChjb250ZW50LCBwYXJlbnQsIGFuY2hvciwgbmFtZXNwYWNlLCBzdGFydCwgZW5kKSB7XG4gICAgY29uc3QgYmVmb3JlID0gYW5jaG9yID8gYW5jaG9yLnByZXZpb3VzU2libGluZyA6IHBhcmVudC5sYXN0Q2hpbGQ7XG4gICAgaWYgKHN0YXJ0ICYmIChzdGFydCA9PT0gZW5kIHx8IHN0YXJ0Lm5leHRTaWJsaW5nKSkge1xuICAgICAgd2hpbGUgKHRydWUpIHtcbiAgICAgICAgcGFyZW50Lmluc2VydEJlZm9yZShzdGFydC5jbG9uZU5vZGUodHJ1ZSksIGFuY2hvcik7XG4gICAgICAgIGlmIChzdGFydCA9PT0gZW5kIHx8ICEoc3RhcnQgPSBzdGFydC5uZXh0U2libGluZykpIGJyZWFrO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICB0ZW1wbGF0ZUNvbnRhaW5lci5pbm5lckhUTUwgPSB1bnNhZmVUb1RydXN0ZWRIVE1MKFxuICAgICAgICBuYW1lc3BhY2UgPT09IFwic3ZnXCIgPyBgPHN2Zz4ke2NvbnRlbnR9PC9zdmc+YCA6IG5hbWVzcGFjZSA9PT0gXCJtYXRobWxcIiA/IGA8bWF0aD4ke2NvbnRlbnR9PC9tYXRoPmAgOiBjb250ZW50XG4gICAgICApO1xuICAgICAgY29uc3QgdGVtcGxhdGUgPSB0ZW1wbGF0ZUNvbnRhaW5lci5jb250ZW50O1xuICAgICAgaWYgKG5hbWVzcGFjZSA9PT0gXCJzdmdcIiB8fCBuYW1lc3BhY2UgPT09IFwibWF0aG1sXCIpIHtcbiAgICAgICAgY29uc3Qgd3JhcHBlciA9IHRlbXBsYXRlLmZpcnN0Q2hpbGQ7XG4gICAgICAgIHdoaWxlICh3cmFwcGVyLmZpcnN0Q2hpbGQpIHtcbiAgICAgICAgICB0ZW1wbGF0ZS5hcHBlbmRDaGlsZCh3cmFwcGVyLmZpcnN0Q2hpbGQpO1xuICAgICAgICB9XG4gICAgICAgIHRlbXBsYXRlLnJlbW92ZUNoaWxkKHdyYXBwZXIpO1xuICAgICAgfVxuICAgICAgcGFyZW50Lmluc2VydEJlZm9yZSh0ZW1wbGF0ZSwgYW5jaG9yKTtcbiAgICB9XG4gICAgcmV0dXJuIFtcbiAgICAgIC8vIGZpcnN0XG4gICAgICBiZWZvcmUgPyBiZWZvcmUubmV4dFNpYmxpbmcgOiBwYXJlbnQuZmlyc3RDaGlsZCxcbiAgICAgIC8vIGxhc3RcbiAgICAgIGFuY2hvciA/IGFuY2hvci5wcmV2aW91c1NpYmxpbmcgOiBwYXJlbnQubGFzdENoaWxkXG4gICAgXTtcbiAgfVxufTtcblxuY29uc3QgVFJBTlNJVElPTiA9IFwidHJhbnNpdGlvblwiO1xuY29uc3QgQU5JTUFUSU9OID0gXCJhbmltYXRpb25cIjtcbmNvbnN0IHZ0Y0tleSA9IC8qIEBfX1BVUkVfXyAqLyBTeW1ib2woXCJfdnRjXCIpO1xuY29uc3QgRE9NVHJhbnNpdGlvblByb3BzVmFsaWRhdG9ycyA9IHtcbiAgbmFtZTogU3RyaW5nLFxuICB0eXBlOiBTdHJpbmcsXG4gIGNzczoge1xuICAgIHR5cGU6IEJvb2xlYW4sXG4gICAgZGVmYXVsdDogdHJ1ZVxuICB9LFxuICBkdXJhdGlvbjogW1N0cmluZywgTnVtYmVyLCBPYmplY3RdLFxuICBlbnRlckZyb21DbGFzczogU3RyaW5nLFxuICBlbnRlckFjdGl2ZUNsYXNzOiBTdHJpbmcsXG4gIGVudGVyVG9DbGFzczogU3RyaW5nLFxuICBhcHBlYXJGcm9tQ2xhc3M6IFN0cmluZyxcbiAgYXBwZWFyQWN0aXZlQ2xhc3M6IFN0cmluZyxcbiAgYXBwZWFyVG9DbGFzczogU3RyaW5nLFxuICBsZWF2ZUZyb21DbGFzczogU3RyaW5nLFxuICBsZWF2ZUFjdGl2ZUNsYXNzOiBTdHJpbmcsXG4gIGxlYXZlVG9DbGFzczogU3RyaW5nXG59O1xuY29uc3QgVHJhbnNpdGlvblByb3BzVmFsaWRhdG9ycyA9IC8qIEBfX1BVUkVfXyAqLyBleHRlbmQoXG4gIHt9LFxuICBCYXNlVHJhbnNpdGlvblByb3BzVmFsaWRhdG9ycyxcbiAgRE9NVHJhbnNpdGlvblByb3BzVmFsaWRhdG9yc1xuKTtcbmNvbnN0IGRlY29yYXRlJDEgPSAodCkgPT4ge1xuICB0LmRpc3BsYXlOYW1lID0gXCJUcmFuc2l0aW9uXCI7XG4gIHQucHJvcHMgPSBUcmFuc2l0aW9uUHJvcHNWYWxpZGF0b3JzO1xuICByZXR1cm4gdDtcbn07XG5jb25zdCBUcmFuc2l0aW9uID0gLyogQF9fUFVSRV9fICovIGRlY29yYXRlJDEoXG4gIChwcm9wcywgeyBzbG90cyB9KSA9PiBoKEJhc2VUcmFuc2l0aW9uLCByZXNvbHZlVHJhbnNpdGlvblByb3BzKHByb3BzKSwgc2xvdHMpXG4pO1xuY29uc3QgY2FsbEhvb2sgPSAoaG9vaywgYXJncyA9IFtdKSA9PiB7XG4gIGlmIChpc0FycmF5KGhvb2spKSB7XG4gICAgaG9vay5mb3JFYWNoKChoMikgPT4gaDIoLi4uYXJncykpO1xuICB9IGVsc2UgaWYgKGhvb2spIHtcbiAgICBob29rKC4uLmFyZ3MpO1xuICB9XG59O1xuY29uc3QgaGFzRXhwbGljaXRDYWxsYmFjayA9IChob29rKSA9PiB7XG4gIHJldHVybiBob29rID8gaXNBcnJheShob29rKSA/IGhvb2suc29tZSgoaDIpID0+IGgyLmxlbmd0aCA+IDEpIDogaG9vay5sZW5ndGggPiAxIDogZmFsc2U7XG59O1xuZnVuY3Rpb24gcmVzb2x2ZVRyYW5zaXRpb25Qcm9wcyhyYXdQcm9wcykge1xuICBjb25zdCBiYXNlUHJvcHMgPSB7fTtcbiAgZm9yIChjb25zdCBrZXkgaW4gcmF3UHJvcHMpIHtcbiAgICBpZiAoIShrZXkgaW4gRE9NVHJhbnNpdGlvblByb3BzVmFsaWRhdG9ycykpIHtcbiAgICAgIGJhc2VQcm9wc1trZXldID0gcmF3UHJvcHNba2V5XTtcbiAgICB9XG4gIH1cbiAgaWYgKHJhd1Byb3BzLmNzcyA9PT0gZmFsc2UpIHtcbiAgICByZXR1cm4gYmFzZVByb3BzO1xuICB9XG4gIGNvbnN0IHtcbiAgICBuYW1lID0gXCJ2XCIsXG4gICAgdHlwZSxcbiAgICBkdXJhdGlvbixcbiAgICBlbnRlckZyb21DbGFzcyA9IGAke25hbWV9LWVudGVyLWZyb21gLFxuICAgIGVudGVyQWN0aXZlQ2xhc3MgPSBgJHtuYW1lfS1lbnRlci1hY3RpdmVgLFxuICAgIGVudGVyVG9DbGFzcyA9IGAke25hbWV9LWVudGVyLXRvYCxcbiAgICBhcHBlYXJGcm9tQ2xhc3MgPSBlbnRlckZyb21DbGFzcyxcbiAgICBhcHBlYXJBY3RpdmVDbGFzcyA9IGVudGVyQWN0aXZlQ2xhc3MsXG4gICAgYXBwZWFyVG9DbGFzcyA9IGVudGVyVG9DbGFzcyxcbiAgICBsZWF2ZUZyb21DbGFzcyA9IGAke25hbWV9LWxlYXZlLWZyb21gLFxuICAgIGxlYXZlQWN0aXZlQ2xhc3MgPSBgJHtuYW1lfS1sZWF2ZS1hY3RpdmVgLFxuICAgIGxlYXZlVG9DbGFzcyA9IGAke25hbWV9LWxlYXZlLXRvYFxuICB9ID0gcmF3UHJvcHM7XG4gIGNvbnN0IGR1cmF0aW9ucyA9IG5vcm1hbGl6ZUR1cmF0aW9uKGR1cmF0aW9uKTtcbiAgY29uc3QgZW50ZXJEdXJhdGlvbiA9IGR1cmF0aW9ucyAmJiBkdXJhdGlvbnNbMF07XG4gIGNvbnN0IGxlYXZlRHVyYXRpb24gPSBkdXJhdGlvbnMgJiYgZHVyYXRpb25zWzFdO1xuICBjb25zdCB7XG4gICAgb25CZWZvcmVFbnRlcixcbiAgICBvbkVudGVyLFxuICAgIG9uRW50ZXJDYW5jZWxsZWQsXG4gICAgb25MZWF2ZSxcbiAgICBvbkxlYXZlQ2FuY2VsbGVkLFxuICAgIG9uQmVmb3JlQXBwZWFyID0gb25CZWZvcmVFbnRlcixcbiAgICBvbkFwcGVhciA9IG9uRW50ZXIsXG4gICAgb25BcHBlYXJDYW5jZWxsZWQgPSBvbkVudGVyQ2FuY2VsbGVkXG4gIH0gPSBiYXNlUHJvcHM7XG4gIGNvbnN0IGZpbmlzaEVudGVyID0gKGVsLCBpc0FwcGVhciwgZG9uZSwgaXNDYW5jZWxsZWQpID0+IHtcbiAgICBlbC5fZW50ZXJDYW5jZWxsZWQgPSBpc0NhbmNlbGxlZDtcbiAgICByZW1vdmVUcmFuc2l0aW9uQ2xhc3MoZWwsIGlzQXBwZWFyID8gYXBwZWFyVG9DbGFzcyA6IGVudGVyVG9DbGFzcyk7XG4gICAgcmVtb3ZlVHJhbnNpdGlvbkNsYXNzKGVsLCBpc0FwcGVhciA/IGFwcGVhckFjdGl2ZUNsYXNzIDogZW50ZXJBY3RpdmVDbGFzcyk7XG4gICAgZG9uZSAmJiBkb25lKCk7XG4gIH07XG4gIGNvbnN0IGZpbmlzaExlYXZlID0gKGVsLCBkb25lKSA9PiB7XG4gICAgZWwuX2lzTGVhdmluZyA9IGZhbHNlO1xuICAgIHJlbW92ZVRyYW5zaXRpb25DbGFzcyhlbCwgbGVhdmVGcm9tQ2xhc3MpO1xuICAgIHJlbW92ZVRyYW5zaXRpb25DbGFzcyhlbCwgbGVhdmVUb0NsYXNzKTtcbiAgICByZW1vdmVUcmFuc2l0aW9uQ2xhc3MoZWwsIGxlYXZlQWN0aXZlQ2xhc3MpO1xuICAgIGRvbmUgJiYgZG9uZSgpO1xuICB9O1xuICBjb25zdCBtYWtlRW50ZXJIb29rID0gKGlzQXBwZWFyKSA9PiB7XG4gICAgcmV0dXJuIChlbCwgZG9uZSkgPT4ge1xuICAgICAgY29uc3QgaG9vayA9IGlzQXBwZWFyID8gb25BcHBlYXIgOiBvbkVudGVyO1xuICAgICAgY29uc3QgcmVzb2x2ZSA9ICgpID0+IGZpbmlzaEVudGVyKGVsLCBpc0FwcGVhciwgZG9uZSk7XG4gICAgICBjYWxsSG9vayhob29rLCBbZWwsIHJlc29sdmVdKTtcbiAgICAgIG5leHRGcmFtZSgoKSA9PiB7XG4gICAgICAgIHJlbW92ZVRyYW5zaXRpb25DbGFzcyhlbCwgaXNBcHBlYXIgPyBhcHBlYXJGcm9tQ2xhc3MgOiBlbnRlckZyb21DbGFzcyk7XG4gICAgICAgIGFkZFRyYW5zaXRpb25DbGFzcyhlbCwgaXNBcHBlYXIgPyBhcHBlYXJUb0NsYXNzIDogZW50ZXJUb0NsYXNzKTtcbiAgICAgICAgaWYgKCFoYXNFeHBsaWNpdENhbGxiYWNrKGhvb2spKSB7XG4gICAgICAgICAgd2hlblRyYW5zaXRpb25FbmRzKGVsLCB0eXBlLCBlbnRlckR1cmF0aW9uLCByZXNvbHZlKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfTtcbiAgfTtcbiAgcmV0dXJuIGV4dGVuZChiYXNlUHJvcHMsIHtcbiAgICBvbkJlZm9yZUVudGVyKGVsKSB7XG4gICAgICBjYWxsSG9vayhvbkJlZm9yZUVudGVyLCBbZWxdKTtcbiAgICAgIGFkZFRyYW5zaXRpb25DbGFzcyhlbCwgZW50ZXJGcm9tQ2xhc3MpO1xuICAgICAgYWRkVHJhbnNpdGlvbkNsYXNzKGVsLCBlbnRlckFjdGl2ZUNsYXNzKTtcbiAgICB9LFxuICAgIG9uQmVmb3JlQXBwZWFyKGVsKSB7XG4gICAgICBjYWxsSG9vayhvbkJlZm9yZUFwcGVhciwgW2VsXSk7XG4gICAgICBhZGRUcmFuc2l0aW9uQ2xhc3MoZWwsIGFwcGVhckZyb21DbGFzcyk7XG4gICAgICBhZGRUcmFuc2l0aW9uQ2xhc3MoZWwsIGFwcGVhckFjdGl2ZUNsYXNzKTtcbiAgICB9LFxuICAgIG9uRW50ZXI6IG1ha2VFbnRlckhvb2soZmFsc2UpLFxuICAgIG9uQXBwZWFyOiBtYWtlRW50ZXJIb29rKHRydWUpLFxuICAgIG9uTGVhdmUoZWwsIGRvbmUpIHtcbiAgICAgIGVsLl9pc0xlYXZpbmcgPSB0cnVlO1xuICAgICAgY29uc3QgcmVzb2x2ZSA9ICgpID0+IGZpbmlzaExlYXZlKGVsLCBkb25lKTtcbiAgICAgIGFkZFRyYW5zaXRpb25DbGFzcyhlbCwgbGVhdmVGcm9tQ2xhc3MpO1xuICAgICAgaWYgKCFlbC5fZW50ZXJDYW5jZWxsZWQpIHtcbiAgICAgICAgZm9yY2VSZWZsb3coZWwpO1xuICAgICAgICBhZGRUcmFuc2l0aW9uQ2xhc3MoZWwsIGxlYXZlQWN0aXZlQ2xhc3MpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgYWRkVHJhbnNpdGlvbkNsYXNzKGVsLCBsZWF2ZUFjdGl2ZUNsYXNzKTtcbiAgICAgICAgZm9yY2VSZWZsb3coZWwpO1xuICAgICAgfVxuICAgICAgbmV4dEZyYW1lKCgpID0+IHtcbiAgICAgICAgaWYgKCFlbC5faXNMZWF2aW5nKSB7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHJlbW92ZVRyYW5zaXRpb25DbGFzcyhlbCwgbGVhdmVGcm9tQ2xhc3MpO1xuICAgICAgICBhZGRUcmFuc2l0aW9uQ2xhc3MoZWwsIGxlYXZlVG9DbGFzcyk7XG4gICAgICAgIGlmICghaGFzRXhwbGljaXRDYWxsYmFjayhvbkxlYXZlKSkge1xuICAgICAgICAgIHdoZW5UcmFuc2l0aW9uRW5kcyhlbCwgdHlwZSwgbGVhdmVEdXJhdGlvbiwgcmVzb2x2ZSk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgICAgY2FsbEhvb2sob25MZWF2ZSwgW2VsLCByZXNvbHZlXSk7XG4gICAgfSxcbiAgICBvbkVudGVyQ2FuY2VsbGVkKGVsKSB7XG4gICAgICBmaW5pc2hFbnRlcihlbCwgZmFsc2UsIHZvaWQgMCwgdHJ1ZSk7XG4gICAgICBjYWxsSG9vayhvbkVudGVyQ2FuY2VsbGVkLCBbZWxdKTtcbiAgICB9LFxuICAgIG9uQXBwZWFyQ2FuY2VsbGVkKGVsKSB7XG4gICAgICBmaW5pc2hFbnRlcihlbCwgdHJ1ZSwgdm9pZCAwLCB0cnVlKTtcbiAgICAgIGNhbGxIb29rKG9uQXBwZWFyQ2FuY2VsbGVkLCBbZWxdKTtcbiAgICB9LFxuICAgIG9uTGVhdmVDYW5jZWxsZWQoZWwpIHtcbiAgICAgIGZpbmlzaExlYXZlKGVsKTtcbiAgICAgIGNhbGxIb29rKG9uTGVhdmVDYW5jZWxsZWQsIFtlbF0pO1xuICAgIH1cbiAgfSk7XG59XG5mdW5jdGlvbiBub3JtYWxpemVEdXJhdGlvbihkdXJhdGlvbikge1xuICBpZiAoZHVyYXRpb24gPT0gbnVsbCkge1xuICAgIHJldHVybiBudWxsO1xuICB9IGVsc2UgaWYgKGlzT2JqZWN0KGR1cmF0aW9uKSkge1xuICAgIHJldHVybiBbTnVtYmVyT2YoZHVyYXRpb24uZW50ZXIpLCBOdW1iZXJPZihkdXJhdGlvbi5sZWF2ZSldO1xuICB9IGVsc2Uge1xuICAgIGNvbnN0IG4gPSBOdW1iZXJPZihkdXJhdGlvbik7XG4gICAgcmV0dXJuIFtuLCBuXTtcbiAgfVxufVxuZnVuY3Rpb24gTnVtYmVyT2YodmFsKSB7XG4gIGNvbnN0IHJlcyA9IHRvTnVtYmVyKHZhbCk7XG4gIGlmICghIShwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gXCJwcm9kdWN0aW9uXCIpKSB7XG4gICAgYXNzZXJ0TnVtYmVyKHJlcywgXCI8dHJhbnNpdGlvbj4gZXhwbGljaXQgZHVyYXRpb25cIik7XG4gIH1cbiAgcmV0dXJuIHJlcztcbn1cbmZ1bmN0aW9uIGFkZFRyYW5zaXRpb25DbGFzcyhlbCwgY2xzKSB7XG4gIGNscy5zcGxpdCgvXFxzKy8pLmZvckVhY2goKGMpID0+IGMgJiYgZWwuY2xhc3NMaXN0LmFkZChjKSk7XG4gIChlbFt2dGNLZXldIHx8IChlbFt2dGNLZXldID0gLyogQF9fUFVSRV9fICovIG5ldyBTZXQoKSkpLmFkZChjbHMpO1xufVxuZnVuY3Rpb24gcmVtb3ZlVHJhbnNpdGlvbkNsYXNzKGVsLCBjbHMpIHtcbiAgY2xzLnNwbGl0KC9cXHMrLykuZm9yRWFjaCgoYykgPT4gYyAmJiBlbC5jbGFzc0xpc3QucmVtb3ZlKGMpKTtcbiAgY29uc3QgX3Z0YyA9IGVsW3Z0Y0tleV07XG4gIGlmIChfdnRjKSB7XG4gICAgX3Z0Yy5kZWxldGUoY2xzKTtcbiAgICBpZiAoIV92dGMuc2l6ZSkge1xuICAgICAgZWxbdnRjS2V5XSA9IHZvaWQgMDtcbiAgICB9XG4gIH1cbn1cbmZ1bmN0aW9uIG5leHRGcmFtZShjYikge1xuICByZXF1ZXN0QW5pbWF0aW9uRnJhbWUoKCkgPT4ge1xuICAgIHJlcXVlc3RBbmltYXRpb25GcmFtZShjYik7XG4gIH0pO1xufVxubGV0IGVuZElkID0gMDtcbmZ1bmN0aW9uIHdoZW5UcmFuc2l0aW9uRW5kcyhlbCwgZXhwZWN0ZWRUeXBlLCBleHBsaWNpdFRpbWVvdXQsIHJlc29sdmUpIHtcbiAgY29uc3QgaWQgPSBlbC5fZW5kSWQgPSArK2VuZElkO1xuICBjb25zdCByZXNvbHZlSWZOb3RTdGFsZSA9ICgpID0+IHtcbiAgICBpZiAoaWQgPT09IGVsLl9lbmRJZCkge1xuICAgICAgcmVzb2x2ZSgpO1xuICAgIH1cbiAgfTtcbiAgaWYgKGV4cGxpY2l0VGltZW91dCAhPSBudWxsKSB7XG4gICAgcmV0dXJuIHNldFRpbWVvdXQocmVzb2x2ZUlmTm90U3RhbGUsIGV4cGxpY2l0VGltZW91dCk7XG4gIH1cbiAgY29uc3QgeyB0eXBlLCB0aW1lb3V0LCBwcm9wQ291bnQgfSA9IGdldFRyYW5zaXRpb25JbmZvKGVsLCBleHBlY3RlZFR5cGUpO1xuICBpZiAoIXR5cGUpIHtcbiAgICByZXR1cm4gcmVzb2x2ZSgpO1xuICB9XG4gIGNvbnN0IGVuZEV2ZW50ID0gdHlwZSArIFwiZW5kXCI7XG4gIGxldCBlbmRlZCA9IDA7XG4gIGNvbnN0IGVuZCA9ICgpID0+IHtcbiAgICBlbC5yZW1vdmVFdmVudExpc3RlbmVyKGVuZEV2ZW50LCBvbkVuZCk7XG4gICAgcmVzb2x2ZUlmTm90U3RhbGUoKTtcbiAgfTtcbiAgY29uc3Qgb25FbmQgPSAoZSkgPT4ge1xuICAgIGlmIChlLnRhcmdldCA9PT0gZWwgJiYgKytlbmRlZCA+PSBwcm9wQ291bnQpIHtcbiAgICAgIGVuZCgpO1xuICAgIH1cbiAgfTtcbiAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgaWYgKGVuZGVkIDwgcHJvcENvdW50KSB7XG4gICAgICBlbmQoKTtcbiAgICB9XG4gIH0sIHRpbWVvdXQgKyAxKTtcbiAgZWwuYWRkRXZlbnRMaXN0ZW5lcihlbmRFdmVudCwgb25FbmQpO1xufVxuZnVuY3Rpb24gZ2V0VHJhbnNpdGlvbkluZm8oZWwsIGV4cGVjdGVkVHlwZSkge1xuICBjb25zdCBzdHlsZXMgPSB3aW5kb3cuZ2V0Q29tcHV0ZWRTdHlsZShlbCk7XG4gIGNvbnN0IGdldFN0eWxlUHJvcGVydGllcyA9IChrZXkpID0+IChzdHlsZXNba2V5XSB8fCBcIlwiKS5zcGxpdChcIiwgXCIpO1xuICBjb25zdCB0cmFuc2l0aW9uRGVsYXlzID0gZ2V0U3R5bGVQcm9wZXJ0aWVzKGAke1RSQU5TSVRJT059RGVsYXlgKTtcbiAgY29uc3QgdHJhbnNpdGlvbkR1cmF0aW9ucyA9IGdldFN0eWxlUHJvcGVydGllcyhgJHtUUkFOU0lUSU9OfUR1cmF0aW9uYCk7XG4gIGNvbnN0IHRyYW5zaXRpb25UaW1lb3V0ID0gZ2V0VGltZW91dCh0cmFuc2l0aW9uRGVsYXlzLCB0cmFuc2l0aW9uRHVyYXRpb25zKTtcbiAgY29uc3QgYW5pbWF0aW9uRGVsYXlzID0gZ2V0U3R5bGVQcm9wZXJ0aWVzKGAke0FOSU1BVElPTn1EZWxheWApO1xuICBjb25zdCBhbmltYXRpb25EdXJhdGlvbnMgPSBnZXRTdHlsZVByb3BlcnRpZXMoYCR7QU5JTUFUSU9OfUR1cmF0aW9uYCk7XG4gIGNvbnN0IGFuaW1hdGlvblRpbWVvdXQgPSBnZXRUaW1lb3V0KGFuaW1hdGlvbkRlbGF5cywgYW5pbWF0aW9uRHVyYXRpb25zKTtcbiAgbGV0IHR5cGUgPSBudWxsO1xuICBsZXQgdGltZW91dCA9IDA7XG4gIGxldCBwcm9wQ291bnQgPSAwO1xuICBpZiAoZXhwZWN0ZWRUeXBlID09PSBUUkFOU0lUSU9OKSB7XG4gICAgaWYgKHRyYW5zaXRpb25UaW1lb3V0ID4gMCkge1xuICAgICAgdHlwZSA9IFRSQU5TSVRJT047XG4gICAgICB0aW1lb3V0ID0gdHJhbnNpdGlvblRpbWVvdXQ7XG4gICAgICBwcm9wQ291bnQgPSB0cmFuc2l0aW9uRHVyYXRpb25zLmxlbmd0aDtcbiAgICB9XG4gIH0gZWxzZSBpZiAoZXhwZWN0ZWRUeXBlID09PSBBTklNQVRJT04pIHtcbiAgICBpZiAoYW5pbWF0aW9uVGltZW91dCA+IDApIHtcbiAgICAgIHR5cGUgPSBBTklNQVRJT047XG4gICAgICB0aW1lb3V0ID0gYW5pbWF0aW9uVGltZW91dDtcbiAgICAgIHByb3BDb3VudCA9IGFuaW1hdGlvbkR1cmF0aW9ucy5sZW5ndGg7XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIHRpbWVvdXQgPSBNYXRoLm1heCh0cmFuc2l0aW9uVGltZW91dCwgYW5pbWF0aW9uVGltZW91dCk7XG4gICAgdHlwZSA9IHRpbWVvdXQgPiAwID8gdHJhbnNpdGlvblRpbWVvdXQgPiBhbmltYXRpb25UaW1lb3V0ID8gVFJBTlNJVElPTiA6IEFOSU1BVElPTiA6IG51bGw7XG4gICAgcHJvcENvdW50ID0gdHlwZSA/IHR5cGUgPT09IFRSQU5TSVRJT04gPyB0cmFuc2l0aW9uRHVyYXRpb25zLmxlbmd0aCA6IGFuaW1hdGlvbkR1cmF0aW9ucy5sZW5ndGggOiAwO1xuICB9XG4gIGNvbnN0IGhhc1RyYW5zZm9ybSA9IHR5cGUgPT09IFRSQU5TSVRJT04gJiYgL1xcYig/OnRyYW5zZm9ybXxhbGwpKD86LHwkKS8udGVzdChcbiAgICBnZXRTdHlsZVByb3BlcnRpZXMoYCR7VFJBTlNJVElPTn1Qcm9wZXJ0eWApLnRvU3RyaW5nKClcbiAgKTtcbiAgcmV0dXJuIHtcbiAgICB0eXBlLFxuICAgIHRpbWVvdXQsXG4gICAgcHJvcENvdW50LFxuICAgIGhhc1RyYW5zZm9ybVxuICB9O1xufVxuZnVuY3Rpb24gZ2V0VGltZW91dChkZWxheXMsIGR1cmF0aW9ucykge1xuICB3aGlsZSAoZGVsYXlzLmxlbmd0aCA8IGR1cmF0aW9ucy5sZW5ndGgpIHtcbiAgICBkZWxheXMgPSBkZWxheXMuY29uY2F0KGRlbGF5cyk7XG4gIH1cbiAgcmV0dXJuIE1hdGgubWF4KC4uLmR1cmF0aW9ucy5tYXAoKGQsIGkpID0+IHRvTXMoZCkgKyB0b01zKGRlbGF5c1tpXSkpKTtcbn1cbmZ1bmN0aW9uIHRvTXMocykge1xuICBpZiAocyA9PT0gXCJhdXRvXCIpIHJldHVybiAwO1xuICByZXR1cm4gTnVtYmVyKHMuc2xpY2UoMCwgLTEpLnJlcGxhY2UoXCIsXCIsIFwiLlwiKSkgKiAxZTM7XG59XG5mdW5jdGlvbiBmb3JjZVJlZmxvdyhlbCkge1xuICBjb25zdCB0YXJnZXREb2N1bWVudCA9IGVsID8gZWwub3duZXJEb2N1bWVudCA6IGRvY3VtZW50O1xuICByZXR1cm4gdGFyZ2V0RG9jdW1lbnQuYm9keS5vZmZzZXRIZWlnaHQ7XG59XG5cbmZ1bmN0aW9uIHBhdGNoQ2xhc3MoZWwsIHZhbHVlLCBpc1NWRykge1xuICBjb25zdCB0cmFuc2l0aW9uQ2xhc3NlcyA9IGVsW3Z0Y0tleV07XG4gIGlmICh0cmFuc2l0aW9uQ2xhc3Nlcykge1xuICAgIHZhbHVlID0gKHZhbHVlID8gW3ZhbHVlLCAuLi50cmFuc2l0aW9uQ2xhc3Nlc10gOiBbLi4udHJhbnNpdGlvbkNsYXNzZXNdKS5qb2luKFwiIFwiKTtcbiAgfVxuICBpZiAodmFsdWUgPT0gbnVsbCkge1xuICAgIGVsLnJlbW92ZUF0dHJpYnV0ZShcImNsYXNzXCIpO1xuICB9IGVsc2UgaWYgKGlzU1ZHKSB7XG4gICAgZWwuc2V0QXR0cmlidXRlKFwiY2xhc3NcIiwgdmFsdWUpO1xuICB9IGVsc2Uge1xuICAgIGVsLmNsYXNzTmFtZSA9IHZhbHVlO1xuICB9XG59XG5cbmNvbnN0IHZTaG93T3JpZ2luYWxEaXNwbGF5ID0gLyogQF9fUFVSRV9fICovIFN5bWJvbChcIl92b2RcIik7XG5jb25zdCB2U2hvd0hpZGRlbiA9IC8qIEBfX1BVUkVfXyAqLyBTeW1ib2woXCJfdnNoXCIpO1xuY29uc3QgdlNob3cgPSB7XG4gIC8vIHVzZWQgZm9yIHByb3AgbWlzbWF0Y2ggY2hlY2sgZHVyaW5nIGh5ZHJhdGlvblxuICBuYW1lOiBcInNob3dcIixcbiAgYmVmb3JlTW91bnQoZWwsIHsgdmFsdWUgfSwgeyB0cmFuc2l0aW9uIH0pIHtcbiAgICBlbFt2U2hvd09yaWdpbmFsRGlzcGxheV0gPSBlbC5zdHlsZS5kaXNwbGF5ID09PSBcIm5vbmVcIiA/IFwiXCIgOiBlbC5zdHlsZS5kaXNwbGF5O1xuICAgIGlmICh0cmFuc2l0aW9uICYmIHZhbHVlKSB7XG4gICAgICB0cmFuc2l0aW9uLmJlZm9yZUVudGVyKGVsKTtcbiAgICB9IGVsc2Uge1xuICAgICAgc2V0RGlzcGxheShlbCwgdmFsdWUpO1xuICAgIH1cbiAgfSxcbiAgbW91bnRlZChlbCwgeyB2YWx1ZSB9LCB7IHRyYW5zaXRpb24gfSkge1xuICAgIGlmICh0cmFuc2l0aW9uICYmIHZhbHVlKSB7XG4gICAgICB0cmFuc2l0aW9uLmVudGVyKGVsKTtcbiAgICB9XG4gIH0sXG4gIHVwZGF0ZWQoZWwsIHsgdmFsdWUsIG9sZFZhbHVlIH0sIHsgdHJhbnNpdGlvbiB9KSB7XG4gICAgaWYgKCF2YWx1ZSA9PT0gIW9sZFZhbHVlKSByZXR1cm47XG4gICAgaWYgKHRyYW5zaXRpb24pIHtcbiAgICAgIGlmICh2YWx1ZSkge1xuICAgICAgICB0cmFuc2l0aW9uLmJlZm9yZUVudGVyKGVsKTtcbiAgICAgICAgc2V0RGlzcGxheShlbCwgdHJ1ZSk7XG4gICAgICAgIHRyYW5zaXRpb24uZW50ZXIoZWwpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdHJhbnNpdGlvbi5sZWF2ZShlbCwgKCkgPT4ge1xuICAgICAgICAgIHNldERpc3BsYXkoZWwsIGZhbHNlKTtcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHNldERpc3BsYXkoZWwsIHZhbHVlKTtcbiAgICB9XG4gIH0sXG4gIGJlZm9yZVVubW91bnQoZWwsIHsgdmFsdWUgfSkge1xuICAgIHNldERpc3BsYXkoZWwsIHZhbHVlKTtcbiAgfVxufTtcbmZ1bmN0aW9uIHNldERpc3BsYXkoZWwsIHZhbHVlKSB7XG4gIGVsLnN0eWxlLmRpc3BsYXkgPSB2YWx1ZSA/IGVsW3ZTaG93T3JpZ2luYWxEaXNwbGF5XSA6IFwibm9uZVwiO1xuICBlbFt2U2hvd0hpZGRlbl0gPSAhdmFsdWU7XG59XG5mdW5jdGlvbiBpbml0VlNob3dGb3JTU1IoKSB7XG4gIHZTaG93LmdldFNTUlByb3BzID0gKHsgdmFsdWUgfSkgPT4ge1xuICAgIGlmICghdmFsdWUpIHtcbiAgICAgIHJldHVybiB7IHN0eWxlOiB7IGRpc3BsYXk6IFwibm9uZVwiIH0gfTtcbiAgICB9XG4gIH07XG59XG5cbmNvbnN0IENTU19WQVJfVEVYVCA9IC8qIEBfX1BVUkVfXyAqLyBTeW1ib2woISEocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09IFwicHJvZHVjdGlvblwiKSA/IFwiQ1NTX1ZBUl9URVhUXCIgOiBcIlwiKTtcbmZ1bmN0aW9uIHVzZUNzc1ZhcnMoZ2V0dGVyKSB7XG4gIGNvbnN0IGluc3RhbmNlID0gZ2V0Q3VycmVudEluc3RhbmNlKCk7XG4gIGlmICghaW5zdGFuY2UpIHtcbiAgICAhIShwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gXCJwcm9kdWN0aW9uXCIpICYmIHdhcm4oYHVzZUNzc1ZhcnMgaXMgY2FsbGVkIHdpdGhvdXQgY3VycmVudCBhY3RpdmUgY29tcG9uZW50IGluc3RhbmNlLmApO1xuICAgIHJldHVybjtcbiAgfVxuICBjb25zdCB1cGRhdGVUZWxlcG9ydHMgPSBpbnN0YW5jZS51dCA9ICh2YXJzID0gZ2V0dGVyKGluc3RhbmNlLnByb3h5KSkgPT4ge1xuICAgIEFycmF5LmZyb20oXG4gICAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKGBbZGF0YS12LW93bmVyPVwiJHtpbnN0YW5jZS51aWR9XCJdYClcbiAgICApLmZvckVhY2goKG5vZGUpID0+IHNldFZhcnNPbk5vZGUobm9kZSwgdmFycykpO1xuICB9O1xuICBpZiAoISEocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09IFwicHJvZHVjdGlvblwiKSkge1xuICAgIGluc3RhbmNlLmdldENzc1ZhcnMgPSAoKSA9PiBnZXR0ZXIoaW5zdGFuY2UucHJveHkpO1xuICB9XG4gIGNvbnN0IHNldFZhcnMgPSAoKSA9PiB7XG4gICAgY29uc3QgdmFycyA9IGdldHRlcihpbnN0YW5jZS5wcm94eSk7XG4gICAgaWYgKGluc3RhbmNlLmNlKSB7XG4gICAgICBzZXRWYXJzT25Ob2RlKGluc3RhbmNlLmNlLCB2YXJzKTtcbiAgICB9IGVsc2Uge1xuICAgICAgc2V0VmFyc09uVk5vZGUoaW5zdGFuY2Uuc3ViVHJlZSwgdmFycyk7XG4gICAgfVxuICAgIHVwZGF0ZVRlbGVwb3J0cyh2YXJzKTtcbiAgfTtcbiAgb25CZWZvcmVVcGRhdGUoKCkgPT4ge1xuICAgIHF1ZXVlUG9zdEZsdXNoQ2Ioc2V0VmFycyk7XG4gIH0pO1xuICBvbk1vdW50ZWQoKCkgPT4ge1xuICAgIHdhdGNoKHNldFZhcnMsIE5PT1AsIHsgZmx1c2g6IFwicG9zdFwiIH0pO1xuICAgIGNvbnN0IG9iID0gbmV3IE11dGF0aW9uT2JzZXJ2ZXIoc2V0VmFycyk7XG4gICAgb2Iub2JzZXJ2ZShpbnN0YW5jZS5zdWJUcmVlLmVsLnBhcmVudE5vZGUsIHsgY2hpbGRMaXN0OiB0cnVlIH0pO1xuICAgIG9uVW5tb3VudGVkKCgpID0+IG9iLmRpc2Nvbm5lY3QoKSk7XG4gIH0pO1xufVxuZnVuY3Rpb24gc2V0VmFyc09uVk5vZGUodm5vZGUsIHZhcnMpIHtcbiAgaWYgKHZub2RlLnNoYXBlRmxhZyAmIDEyOCkge1xuICAgIGNvbnN0IHN1c3BlbnNlID0gdm5vZGUuc3VzcGVuc2U7XG4gICAgdm5vZGUgPSBzdXNwZW5zZS5hY3RpdmVCcmFuY2g7XG4gICAgaWYgKHN1c3BlbnNlLnBlbmRpbmdCcmFuY2ggJiYgIXN1c3BlbnNlLmlzSHlkcmF0aW5nKSB7XG4gICAgICBzdXNwZW5zZS5lZmZlY3RzLnB1c2goKCkgPT4ge1xuICAgICAgICBzZXRWYXJzT25WTm9kZShzdXNwZW5zZS5hY3RpdmVCcmFuY2gsIHZhcnMpO1xuICAgICAgfSk7XG4gICAgfVxuICB9XG4gIHdoaWxlICh2bm9kZS5jb21wb25lbnQpIHtcbiAgICB2bm9kZSA9IHZub2RlLmNvbXBvbmVudC5zdWJUcmVlO1xuICB9XG4gIGlmICh2bm9kZS5zaGFwZUZsYWcgJiAxICYmIHZub2RlLmVsKSB7XG4gICAgc2V0VmFyc09uTm9kZSh2bm9kZS5lbCwgdmFycyk7XG4gIH0gZWxzZSBpZiAodm5vZGUudHlwZSA9PT0gRnJhZ21lbnQpIHtcbiAgICB2bm9kZS5jaGlsZHJlbi5mb3JFYWNoKChjKSA9PiBzZXRWYXJzT25WTm9kZShjLCB2YXJzKSk7XG4gIH0gZWxzZSBpZiAodm5vZGUudHlwZSA9PT0gU3RhdGljKSB7XG4gICAgbGV0IHsgZWwsIGFuY2hvciB9ID0gdm5vZGU7XG4gICAgd2hpbGUgKGVsKSB7XG4gICAgICBzZXRWYXJzT25Ob2RlKGVsLCB2YXJzKTtcbiAgICAgIGlmIChlbCA9PT0gYW5jaG9yKSBicmVhaztcbiAgICAgIGVsID0gZWwubmV4dFNpYmxpbmc7XG4gICAgfVxuICB9XG59XG5mdW5jdGlvbiBzZXRWYXJzT25Ob2RlKGVsLCB2YXJzKSB7XG4gIGlmIChlbC5ub2RlVHlwZSA9PT0gMSkge1xuICAgIGNvbnN0IHN0eWxlID0gZWwuc3R5bGU7XG4gICAgbGV0IGNzc1RleHQgPSBcIlwiO1xuICAgIGZvciAoY29uc3Qga2V5IGluIHZhcnMpIHtcbiAgICAgIGNvbnN0IHZhbHVlID0gbm9ybWFsaXplQ3NzVmFyVmFsdWUodmFyc1trZXldKTtcbiAgICAgIHN0eWxlLnNldFByb3BlcnR5KGAtLSR7a2V5fWAsIHZhbHVlKTtcbiAgICAgIGNzc1RleHQgKz0gYC0tJHtrZXl9OiAke3ZhbHVlfTtgO1xuICAgIH1cbiAgICBzdHlsZVtDU1NfVkFSX1RFWFRdID0gY3NzVGV4dDtcbiAgfVxufVxuXG5jb25zdCBkaXNwbGF5UkUgPSAvKD86Xnw7KVxccypkaXNwbGF5XFxzKjovO1xuZnVuY3Rpb24gcGF0Y2hTdHlsZShlbCwgcHJldiwgbmV4dCkge1xuICBjb25zdCBzdHlsZSA9IGVsLnN0eWxlO1xuICBjb25zdCBpc0Nzc1N0cmluZyA9IGlzU3RyaW5nKG5leHQpO1xuICBsZXQgaGFzQ29udHJvbGxlZERpc3BsYXkgPSBmYWxzZTtcbiAgaWYgKG5leHQgJiYgIWlzQ3NzU3RyaW5nKSB7XG4gICAgaWYgKHByZXYpIHtcbiAgICAgIGlmICghaXNTdHJpbmcocHJldikpIHtcbiAgICAgICAgZm9yIChjb25zdCBrZXkgaW4gcHJldikge1xuICAgICAgICAgIGlmIChuZXh0W2tleV0gPT0gbnVsbCkge1xuICAgICAgICAgICAgc2V0U3R5bGUoc3R5bGUsIGtleSwgXCJcIik7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBmb3IgKGNvbnN0IHByZXZTdHlsZSBvZiBwcmV2LnNwbGl0KFwiO1wiKSkge1xuICAgICAgICAgIGNvbnN0IGtleSA9IHByZXZTdHlsZS5zbGljZSgwLCBwcmV2U3R5bGUuaW5kZXhPZihcIjpcIikpLnRyaW0oKTtcbiAgICAgICAgICBpZiAobmV4dFtrZXldID09IG51bGwpIHtcbiAgICAgICAgICAgIHNldFN0eWxlKHN0eWxlLCBrZXksIFwiXCIpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICBmb3IgKGNvbnN0IGtleSBpbiBuZXh0KSB7XG4gICAgICBpZiAoa2V5ID09PSBcImRpc3BsYXlcIikge1xuICAgICAgICBoYXNDb250cm9sbGVkRGlzcGxheSA9IHRydWU7XG4gICAgICB9XG4gICAgICBzZXRTdHlsZShzdHlsZSwga2V5LCBuZXh0W2tleV0pO1xuICAgIH1cbiAgfSBlbHNlIHtcbiAgICBpZiAoaXNDc3NTdHJpbmcpIHtcbiAgICAgIGlmIChwcmV2ICE9PSBuZXh0KSB7XG4gICAgICAgIGNvbnN0IGNzc1ZhclRleHQgPSBzdHlsZVtDU1NfVkFSX1RFWFRdO1xuICAgICAgICBpZiAoY3NzVmFyVGV4dCkge1xuICAgICAgICAgIG5leHQgKz0gXCI7XCIgKyBjc3NWYXJUZXh0O1xuICAgICAgICB9XG4gICAgICAgIHN0eWxlLmNzc1RleHQgPSBuZXh0O1xuICAgICAgICBoYXNDb250cm9sbGVkRGlzcGxheSA9IGRpc3BsYXlSRS50ZXN0KG5leHQpO1xuICAgICAgfVxuICAgIH0gZWxzZSBpZiAocHJldikge1xuICAgICAgZWwucmVtb3ZlQXR0cmlidXRlKFwic3R5bGVcIik7XG4gICAgfVxuICB9XG4gIGlmICh2U2hvd09yaWdpbmFsRGlzcGxheSBpbiBlbCkge1xuICAgIGVsW3ZTaG93T3JpZ2luYWxEaXNwbGF5XSA9IGhhc0NvbnRyb2xsZWREaXNwbGF5ID8gc3R5bGUuZGlzcGxheSA6IFwiXCI7XG4gICAgaWYgKGVsW3ZTaG93SGlkZGVuXSkge1xuICAgICAgc3R5bGUuZGlzcGxheSA9IFwibm9uZVwiO1xuICAgIH1cbiAgfVxufVxuY29uc3Qgc2VtaWNvbG9uUkUgPSAvW15cXFxcXTtcXHMqJC87XG5jb25zdCBpbXBvcnRhbnRSRSA9IC9cXHMqIWltcG9ydGFudCQvO1xuZnVuY3Rpb24gc2V0U3R5bGUoc3R5bGUsIG5hbWUsIHZhbCkge1xuICBpZiAoaXNBcnJheSh2YWwpKSB7XG4gICAgdmFsLmZvckVhY2goKHYpID0+IHNldFN0eWxlKHN0eWxlLCBuYW1lLCB2KSk7XG4gIH0gZWxzZSB7XG4gICAgaWYgKHZhbCA9PSBudWxsKSB2YWwgPSBcIlwiO1xuICAgIGlmICghIShwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gXCJwcm9kdWN0aW9uXCIpKSB7XG4gICAgICBpZiAoc2VtaWNvbG9uUkUudGVzdCh2YWwpKSB7XG4gICAgICAgIHdhcm4oXG4gICAgICAgICAgYFVuZXhwZWN0ZWQgc2VtaWNvbG9uIGF0IHRoZSBlbmQgb2YgJyR7bmFtZX0nIHN0eWxlIHZhbHVlOiAnJHt2YWx9J2BcbiAgICAgICAgKTtcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKG5hbWUuc3RhcnRzV2l0aChcIi0tXCIpKSB7XG4gICAgICBzdHlsZS5zZXRQcm9wZXJ0eShuYW1lLCB2YWwpO1xuICAgIH0gZWxzZSB7XG4gICAgICBjb25zdCBwcmVmaXhlZCA9IGF1dG9QcmVmaXgoc3R5bGUsIG5hbWUpO1xuICAgICAgaWYgKGltcG9ydGFudFJFLnRlc3QodmFsKSkge1xuICAgICAgICBzdHlsZS5zZXRQcm9wZXJ0eShcbiAgICAgICAgICBoeXBoZW5hdGUocHJlZml4ZWQpLFxuICAgICAgICAgIHZhbC5yZXBsYWNlKGltcG9ydGFudFJFLCBcIlwiKSxcbiAgICAgICAgICBcImltcG9ydGFudFwiXG4gICAgICAgICk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBzdHlsZVtwcmVmaXhlZF0gPSB2YWw7XG4gICAgICB9XG4gICAgfVxuICB9XG59XG5jb25zdCBwcmVmaXhlcyA9IFtcIldlYmtpdFwiLCBcIk1velwiLCBcIm1zXCJdO1xuY29uc3QgcHJlZml4Q2FjaGUgPSB7fTtcbmZ1bmN0aW9uIGF1dG9QcmVmaXgoc3R5bGUsIHJhd05hbWUpIHtcbiAgY29uc3QgY2FjaGVkID0gcHJlZml4Q2FjaGVbcmF3TmFtZV07XG4gIGlmIChjYWNoZWQpIHtcbiAgICByZXR1cm4gY2FjaGVkO1xuICB9XG4gIGxldCBuYW1lID0gY2FtZWxpemUocmF3TmFtZSk7XG4gIGlmIChuYW1lICE9PSBcImZpbHRlclwiICYmIG5hbWUgaW4gc3R5bGUpIHtcbiAgICByZXR1cm4gcHJlZml4Q2FjaGVbcmF3TmFtZV0gPSBuYW1lO1xuICB9XG4gIG5hbWUgPSBjYXBpdGFsaXplKG5hbWUpO1xuICBmb3IgKGxldCBpID0gMDsgaSA8IHByZWZpeGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgY29uc3QgcHJlZml4ZWQgPSBwcmVmaXhlc1tpXSArIG5hbWU7XG4gICAgaWYgKHByZWZpeGVkIGluIHN0eWxlKSB7XG4gICAgICByZXR1cm4gcHJlZml4Q2FjaGVbcmF3TmFtZV0gPSBwcmVmaXhlZDtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHJhd05hbWU7XG59XG5cbmNvbnN0IHhsaW5rTlMgPSBcImh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmtcIjtcbmZ1bmN0aW9uIHBhdGNoQXR0cihlbCwga2V5LCB2YWx1ZSwgaXNTVkcsIGluc3RhbmNlLCBpc0Jvb2xlYW4gPSBpc1NwZWNpYWxCb29sZWFuQXR0cihrZXkpKSB7XG4gIGlmIChpc1NWRyAmJiBrZXkuc3RhcnRzV2l0aChcInhsaW5rOlwiKSkge1xuICAgIGlmICh2YWx1ZSA9PSBudWxsKSB7XG4gICAgICBlbC5yZW1vdmVBdHRyaWJ1dGVOUyh4bGlua05TLCBrZXkuc2xpY2UoNiwga2V5Lmxlbmd0aCkpO1xuICAgIH0gZWxzZSB7XG4gICAgICBlbC5zZXRBdHRyaWJ1dGVOUyh4bGlua05TLCBrZXksIHZhbHVlKTtcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgaWYgKHZhbHVlID09IG51bGwgfHwgaXNCb29sZWFuICYmICFpbmNsdWRlQm9vbGVhbkF0dHIodmFsdWUpKSB7XG4gICAgICBlbC5yZW1vdmVBdHRyaWJ1dGUoa2V5KTtcbiAgICB9IGVsc2Uge1xuICAgICAgZWwuc2V0QXR0cmlidXRlKFxuICAgICAgICBrZXksXG4gICAgICAgIGlzQm9vbGVhbiA/IFwiXCIgOiBpc1N5bWJvbCh2YWx1ZSkgPyBTdHJpbmcodmFsdWUpIDogdmFsdWVcbiAgICAgICk7XG4gICAgfVxuICB9XG59XG5cbmZ1bmN0aW9uIHBhdGNoRE9NUHJvcChlbCwga2V5LCB2YWx1ZSwgcGFyZW50Q29tcG9uZW50LCBhdHRyTmFtZSkge1xuICBpZiAoa2V5ID09PSBcImlubmVySFRNTFwiIHx8IGtleSA9PT0gXCJ0ZXh0Q29udGVudFwiKSB7XG4gICAgaWYgKHZhbHVlICE9IG51bGwpIHtcbiAgICAgIGVsW2tleV0gPSBrZXkgPT09IFwiaW5uZXJIVE1MXCIgPyB1bnNhZmVUb1RydXN0ZWRIVE1MKHZhbHVlKSA6IHZhbHVlO1xuICAgIH1cbiAgICByZXR1cm47XG4gIH1cbiAgY29uc3QgdGFnID0gZWwudGFnTmFtZTtcbiAgaWYgKGtleSA9PT0gXCJ2YWx1ZVwiICYmIHRhZyAhPT0gXCJQUk9HUkVTU1wiICYmIC8vIGN1c3RvbSBlbGVtZW50cyBtYXkgdXNlIF92YWx1ZSBpbnRlcm5hbGx5XG4gICF0YWcuaW5jbHVkZXMoXCItXCIpKSB7XG4gICAgY29uc3Qgb2xkVmFsdWUgPSB0YWcgPT09IFwiT1BUSU9OXCIgPyBlbC5nZXRBdHRyaWJ1dGUoXCJ2YWx1ZVwiKSB8fCBcIlwiIDogZWwudmFsdWU7XG4gICAgY29uc3QgbmV3VmFsdWUgPSB2YWx1ZSA9PSBudWxsID8gKFxuICAgICAgLy8gIzExNjQ3OiB2YWx1ZSBzaG91bGQgYmUgc2V0IGFzIGVtcHR5IHN0cmluZyBmb3IgbnVsbCBhbmQgdW5kZWZpbmVkLFxuICAgICAgLy8gYnV0IDxpbnB1dCB0eXBlPVwiY2hlY2tib3hcIj4gc2hvdWxkIGJlIHNldCBhcyAnb24nLlxuICAgICAgZWwudHlwZSA9PT0gXCJjaGVja2JveFwiID8gXCJvblwiIDogXCJcIlxuICAgICkgOiBTdHJpbmcodmFsdWUpO1xuICAgIGlmIChvbGRWYWx1ZSAhPT0gbmV3VmFsdWUgfHwgIShcIl92YWx1ZVwiIGluIGVsKSkge1xuICAgICAgZWwudmFsdWUgPSBuZXdWYWx1ZTtcbiAgICB9XG4gICAgaWYgKHZhbHVlID09IG51bGwpIHtcbiAgICAgIGVsLnJlbW92ZUF0dHJpYnV0ZShrZXkpO1xuICAgIH1cbiAgICBlbC5fdmFsdWUgPSB2YWx1ZTtcbiAgICByZXR1cm47XG4gIH1cbiAgbGV0IG5lZWRSZW1vdmUgPSBmYWxzZTtcbiAgaWYgKHZhbHVlID09PSBcIlwiIHx8IHZhbHVlID09IG51bGwpIHtcbiAgICBjb25zdCB0eXBlID0gdHlwZW9mIGVsW2tleV07XG4gICAgaWYgKHR5cGUgPT09IFwiYm9vbGVhblwiKSB7XG4gICAgICB2YWx1ZSA9IGluY2x1ZGVCb29sZWFuQXR0cih2YWx1ZSk7XG4gICAgfSBlbHNlIGlmICh2YWx1ZSA9PSBudWxsICYmIHR5cGUgPT09IFwic3RyaW5nXCIpIHtcbiAgICAgIHZhbHVlID0gXCJcIjtcbiAgICAgIG5lZWRSZW1vdmUgPSB0cnVlO1xuICAgIH0gZWxzZSBpZiAodHlwZSA9PT0gXCJudW1iZXJcIikge1xuICAgICAgdmFsdWUgPSAwO1xuICAgICAgbmVlZFJlbW92ZSA9IHRydWU7XG4gICAgfVxuICB9XG4gIHRyeSB7XG4gICAgZWxba2V5XSA9IHZhbHVlO1xuICB9IGNhdGNoIChlKSB7XG4gICAgaWYgKCEhKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSBcInByb2R1Y3Rpb25cIikgJiYgIW5lZWRSZW1vdmUpIHtcbiAgICAgIHdhcm4oXG4gICAgICAgIGBGYWlsZWQgc2V0dGluZyBwcm9wIFwiJHtrZXl9XCIgb24gPCR7dGFnLnRvTG93ZXJDYXNlKCl9PjogdmFsdWUgJHt2YWx1ZX0gaXMgaW52YWxpZC5gLFxuICAgICAgICBlXG4gICAgICApO1xuICAgIH1cbiAgfVxuICBuZWVkUmVtb3ZlICYmIGVsLnJlbW92ZUF0dHJpYnV0ZShhdHRyTmFtZSB8fCBrZXkpO1xufVxuXG5mdW5jdGlvbiBhZGRFdmVudExpc3RlbmVyKGVsLCBldmVudCwgaGFuZGxlciwgb3B0aW9ucykge1xuICBlbC5hZGRFdmVudExpc3RlbmVyKGV2ZW50LCBoYW5kbGVyLCBvcHRpb25zKTtcbn1cbmZ1bmN0aW9uIHJlbW92ZUV2ZW50TGlzdGVuZXIoZWwsIGV2ZW50LCBoYW5kbGVyLCBvcHRpb25zKSB7XG4gIGVsLnJlbW92ZUV2ZW50TGlzdGVuZXIoZXZlbnQsIGhhbmRsZXIsIG9wdGlvbnMpO1xufVxuY29uc3QgdmVpS2V5ID0gLyogQF9fUFVSRV9fICovIFN5bWJvbChcIl92ZWlcIik7XG5mdW5jdGlvbiBwYXRjaEV2ZW50KGVsLCByYXdOYW1lLCBwcmV2VmFsdWUsIG5leHRWYWx1ZSwgaW5zdGFuY2UgPSBudWxsKSB7XG4gIGNvbnN0IGludm9rZXJzID0gZWxbdmVpS2V5XSB8fCAoZWxbdmVpS2V5XSA9IHt9KTtcbiAgY29uc3QgZXhpc3RpbmdJbnZva2VyID0gaW52b2tlcnNbcmF3TmFtZV07XG4gIGlmIChuZXh0VmFsdWUgJiYgZXhpc3RpbmdJbnZva2VyKSB7XG4gICAgZXhpc3RpbmdJbnZva2VyLnZhbHVlID0gISEocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09IFwicHJvZHVjdGlvblwiKSA/IHNhbml0aXplRXZlbnRWYWx1ZShuZXh0VmFsdWUsIHJhd05hbWUpIDogbmV4dFZhbHVlO1xuICB9IGVsc2Uge1xuICAgIGNvbnN0IFtuYW1lLCBvcHRpb25zXSA9IHBhcnNlTmFtZShyYXdOYW1lKTtcbiAgICBpZiAobmV4dFZhbHVlKSB7XG4gICAgICBjb25zdCBpbnZva2VyID0gaW52b2tlcnNbcmF3TmFtZV0gPSBjcmVhdGVJbnZva2VyKFxuICAgICAgICAhIShwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gXCJwcm9kdWN0aW9uXCIpID8gc2FuaXRpemVFdmVudFZhbHVlKG5leHRWYWx1ZSwgcmF3TmFtZSkgOiBuZXh0VmFsdWUsXG4gICAgICAgIGluc3RhbmNlXG4gICAgICApO1xuICAgICAgYWRkRXZlbnRMaXN0ZW5lcihlbCwgbmFtZSwgaW52b2tlciwgb3B0aW9ucyk7XG4gICAgfSBlbHNlIGlmIChleGlzdGluZ0ludm9rZXIpIHtcbiAgICAgIHJlbW92ZUV2ZW50TGlzdGVuZXIoZWwsIG5hbWUsIGV4aXN0aW5nSW52b2tlciwgb3B0aW9ucyk7XG4gICAgICBpbnZva2Vyc1tyYXdOYW1lXSA9IHZvaWQgMDtcbiAgICB9XG4gIH1cbn1cbmNvbnN0IG9wdGlvbnNNb2RpZmllclJFID0gLyg/Ok9uY2V8UGFzc2l2ZXxDYXB0dXJlKSQvO1xuZnVuY3Rpb24gcGFyc2VOYW1lKG5hbWUpIHtcbiAgbGV0IG9wdGlvbnM7XG4gIGlmIChvcHRpb25zTW9kaWZpZXJSRS50ZXN0KG5hbWUpKSB7XG4gICAgb3B0aW9ucyA9IHt9O1xuICAgIGxldCBtO1xuICAgIHdoaWxlIChtID0gbmFtZS5tYXRjaChvcHRpb25zTW9kaWZpZXJSRSkpIHtcbiAgICAgIG5hbWUgPSBuYW1lLnNsaWNlKDAsIG5hbWUubGVuZ3RoIC0gbVswXS5sZW5ndGgpO1xuICAgICAgb3B0aW9uc1ttWzBdLnRvTG93ZXJDYXNlKCldID0gdHJ1ZTtcbiAgICB9XG4gIH1cbiAgY29uc3QgZXZlbnQgPSBuYW1lWzJdID09PSBcIjpcIiA/IG5hbWUuc2xpY2UoMykgOiBoeXBoZW5hdGUobmFtZS5zbGljZSgyKSk7XG4gIHJldHVybiBbZXZlbnQsIG9wdGlvbnNdO1xufVxubGV0IGNhY2hlZE5vdyA9IDA7XG5jb25zdCBwID0gLyogQF9fUFVSRV9fICovIFByb21pc2UucmVzb2x2ZSgpO1xuY29uc3QgZ2V0Tm93ID0gKCkgPT4gY2FjaGVkTm93IHx8IChwLnRoZW4oKCkgPT4gY2FjaGVkTm93ID0gMCksIGNhY2hlZE5vdyA9IERhdGUubm93KCkpO1xuZnVuY3Rpb24gY3JlYXRlSW52b2tlcihpbml0aWFsVmFsdWUsIGluc3RhbmNlKSB7XG4gIGNvbnN0IGludm9rZXIgPSAoZSkgPT4ge1xuICAgIGlmICghZS5fdnRzKSB7XG4gICAgICBlLl92dHMgPSBEYXRlLm5vdygpO1xuICAgIH0gZWxzZSBpZiAoZS5fdnRzIDw9IGludm9rZXIuYXR0YWNoZWQpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgY2FsbFdpdGhBc3luY0Vycm9ySGFuZGxpbmcoXG4gICAgICBwYXRjaFN0b3BJbW1lZGlhdGVQcm9wYWdhdGlvbihlLCBpbnZva2VyLnZhbHVlKSxcbiAgICAgIGluc3RhbmNlLFxuICAgICAgNSxcbiAgICAgIFtlXVxuICAgICk7XG4gIH07XG4gIGludm9rZXIudmFsdWUgPSBpbml0aWFsVmFsdWU7XG4gIGludm9rZXIuYXR0YWNoZWQgPSBnZXROb3coKTtcbiAgcmV0dXJuIGludm9rZXI7XG59XG5mdW5jdGlvbiBzYW5pdGl6ZUV2ZW50VmFsdWUodmFsdWUsIHByb3BOYW1lKSB7XG4gIGlmIChpc0Z1bmN0aW9uKHZhbHVlKSB8fCBpc0FycmF5KHZhbHVlKSkge1xuICAgIHJldHVybiB2YWx1ZTtcbiAgfVxuICB3YXJuKFxuICAgIGBXcm9uZyB0eXBlIHBhc3NlZCBhcyBldmVudCBoYW5kbGVyIHRvICR7cHJvcE5hbWV9IC0gZGlkIHlvdSBmb3JnZXQgQCBvciA6IGluIGZyb250IG9mIHlvdXIgcHJvcD9cbkV4cGVjdGVkIGZ1bmN0aW9uIG9yIGFycmF5IG9mIGZ1bmN0aW9ucywgcmVjZWl2ZWQgdHlwZSAke3R5cGVvZiB2YWx1ZX0uYFxuICApO1xuICByZXR1cm4gTk9PUDtcbn1cbmZ1bmN0aW9uIHBhdGNoU3RvcEltbWVkaWF0ZVByb3BhZ2F0aW9uKGUsIHZhbHVlKSB7XG4gIGlmIChpc0FycmF5KHZhbHVlKSkge1xuICAgIGNvbnN0IG9yaWdpbmFsU3RvcCA9IGUuc3RvcEltbWVkaWF0ZVByb3BhZ2F0aW9uO1xuICAgIGUuc3RvcEltbWVkaWF0ZVByb3BhZ2F0aW9uID0gKCkgPT4ge1xuICAgICAgb3JpZ2luYWxTdG9wLmNhbGwoZSk7XG4gICAgICBlLl9zdG9wcGVkID0gdHJ1ZTtcbiAgICB9O1xuICAgIHJldHVybiB2YWx1ZS5tYXAoXG4gICAgICAoZm4pID0+IChlMikgPT4gIWUyLl9zdG9wcGVkICYmIGZuICYmIGZuKGUyKVxuICAgICk7XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIHZhbHVlO1xuICB9XG59XG5cbmNvbnN0IGlzTmF0aXZlT24gPSAoa2V5KSA9PiBrZXkuY2hhckNvZGVBdCgwKSA9PT0gMTExICYmIGtleS5jaGFyQ29kZUF0KDEpID09PSAxMTAgJiYgLy8gbG93ZXJjYXNlIGxldHRlclxua2V5LmNoYXJDb2RlQXQoMikgPiA5NiAmJiBrZXkuY2hhckNvZGVBdCgyKSA8IDEyMztcbmNvbnN0IHBhdGNoUHJvcCA9IChlbCwga2V5LCBwcmV2VmFsdWUsIG5leHRWYWx1ZSwgbmFtZXNwYWNlLCBwYXJlbnRDb21wb25lbnQpID0+IHtcbiAgY29uc3QgaXNTVkcgPSBuYW1lc3BhY2UgPT09IFwic3ZnXCI7XG4gIGlmIChrZXkgPT09IFwiY2xhc3NcIikge1xuICAgIHBhdGNoQ2xhc3MoZWwsIG5leHRWYWx1ZSwgaXNTVkcpO1xuICB9IGVsc2UgaWYgKGtleSA9PT0gXCJzdHlsZVwiKSB7XG4gICAgcGF0Y2hTdHlsZShlbCwgcHJldlZhbHVlLCBuZXh0VmFsdWUpO1xuICB9IGVsc2UgaWYgKGlzT24oa2V5KSkge1xuICAgIGlmICghaXNNb2RlbExpc3RlbmVyKGtleSkpIHtcbiAgICAgIHBhdGNoRXZlbnQoZWwsIGtleSwgcHJldlZhbHVlLCBuZXh0VmFsdWUsIHBhcmVudENvbXBvbmVudCk7XG4gICAgfVxuICB9IGVsc2UgaWYgKGtleVswXSA9PT0gXCIuXCIgPyAoa2V5ID0ga2V5LnNsaWNlKDEpLCB0cnVlKSA6IGtleVswXSA9PT0gXCJeXCIgPyAoa2V5ID0ga2V5LnNsaWNlKDEpLCBmYWxzZSkgOiBzaG91bGRTZXRBc1Byb3AoZWwsIGtleSwgbmV4dFZhbHVlLCBpc1NWRykpIHtcbiAgICBwYXRjaERPTVByb3AoZWwsIGtleSwgbmV4dFZhbHVlKTtcbiAgICBpZiAoIWVsLnRhZ05hbWUuaW5jbHVkZXMoXCItXCIpICYmIChrZXkgPT09IFwidmFsdWVcIiB8fCBrZXkgPT09IFwiY2hlY2tlZFwiIHx8IGtleSA9PT0gXCJzZWxlY3RlZFwiKSkge1xuICAgICAgcGF0Y2hBdHRyKGVsLCBrZXksIG5leHRWYWx1ZSwgaXNTVkcsIHBhcmVudENvbXBvbmVudCwga2V5ICE9PSBcInZhbHVlXCIpO1xuICAgIH1cbiAgfSBlbHNlIGlmIChcbiAgICAvLyAjMTEwODEgZm9yY2Ugc2V0IHByb3BzIGZvciBwb3NzaWJsZSBhc3luYyBjdXN0b20gZWxlbWVudFxuICAgIGVsLl9pc1Z1ZUNFICYmICgvW0EtWl0vLnRlc3Qoa2V5KSB8fCAhaXNTdHJpbmcobmV4dFZhbHVlKSlcbiAgKSB7XG4gICAgcGF0Y2hET01Qcm9wKGVsLCBjYW1lbGl6ZSQxKGtleSksIG5leHRWYWx1ZSwgcGFyZW50Q29tcG9uZW50LCBrZXkpO1xuICB9IGVsc2Uge1xuICAgIGlmIChrZXkgPT09IFwidHJ1ZS12YWx1ZVwiKSB7XG4gICAgICBlbC5fdHJ1ZVZhbHVlID0gbmV4dFZhbHVlO1xuICAgIH0gZWxzZSBpZiAoa2V5ID09PSBcImZhbHNlLXZhbHVlXCIpIHtcbiAgICAgIGVsLl9mYWxzZVZhbHVlID0gbmV4dFZhbHVlO1xuICAgIH1cbiAgICBwYXRjaEF0dHIoZWwsIGtleSwgbmV4dFZhbHVlLCBpc1NWRyk7XG4gIH1cbn07XG5mdW5jdGlvbiBzaG91bGRTZXRBc1Byb3AoZWwsIGtleSwgdmFsdWUsIGlzU1ZHKSB7XG4gIGlmIChpc1NWRykge1xuICAgIGlmIChrZXkgPT09IFwiaW5uZXJIVE1MXCIgfHwga2V5ID09PSBcInRleHRDb250ZW50XCIpIHtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICBpZiAoa2V5IGluIGVsICYmIGlzTmF0aXZlT24oa2V5KSAmJiBpc0Z1bmN0aW9uKHZhbHVlKSkge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuICBpZiAoa2V5ID09PSBcInNwZWxsY2hlY2tcIiB8fCBrZXkgPT09IFwiZHJhZ2dhYmxlXCIgfHwga2V5ID09PSBcInRyYW5zbGF0ZVwiIHx8IGtleSA9PT0gXCJhdXRvY29ycmVjdFwiKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG4gIGlmIChrZXkgPT09IFwic2FuZGJveFwiICYmIGVsLnRhZ05hbWUgPT09IFwiSUZSQU1FXCIpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbiAgaWYgKGtleSA9PT0gXCJmb3JtXCIpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbiAgaWYgKGtleSA9PT0gXCJsaXN0XCIgJiYgZWwudGFnTmFtZSA9PT0gXCJJTlBVVFwiKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG4gIGlmIChrZXkgPT09IFwidHlwZVwiICYmIGVsLnRhZ05hbWUgPT09IFwiVEVYVEFSRUFcIikge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuICBpZiAoa2V5ID09PSBcIndpZHRoXCIgfHwga2V5ID09PSBcImhlaWdodFwiKSB7XG4gICAgY29uc3QgdGFnID0gZWwudGFnTmFtZTtcbiAgICBpZiAodGFnID09PSBcIklNR1wiIHx8IHRhZyA9PT0gXCJWSURFT1wiIHx8IHRhZyA9PT0gXCJDQU5WQVNcIiB8fCB0YWcgPT09IFwiU09VUkNFXCIpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gIH1cbiAgaWYgKGlzTmF0aXZlT24oa2V5KSAmJiBpc1N0cmluZyh2YWx1ZSkpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbiAgcmV0dXJuIGtleSBpbiBlbDtcbn1cblxuY29uc3QgUkVNT1ZBTCA9IHt9O1xuLy8gQF9fTk9fU0lERV9FRkZFQ1RTX19cbmZ1bmN0aW9uIGRlZmluZUN1c3RvbUVsZW1lbnQob3B0aW9ucywgZXh0cmFPcHRpb25zLCBfY3JlYXRlQXBwKSB7XG4gIGxldCBDb21wID0gZGVmaW5lQ29tcG9uZW50KG9wdGlvbnMsIGV4dHJhT3B0aW9ucyk7XG4gIGlmIChpc1BsYWluT2JqZWN0KENvbXApKSBDb21wID0gZXh0ZW5kKHt9LCBDb21wLCBleHRyYU9wdGlvbnMpO1xuICBjbGFzcyBWdWVDdXN0b21FbGVtZW50IGV4dGVuZHMgVnVlRWxlbWVudCB7XG4gICAgY29uc3RydWN0b3IoaW5pdGlhbFByb3BzKSB7XG4gICAgICBzdXBlcihDb21wLCBpbml0aWFsUHJvcHMsIF9jcmVhdGVBcHApO1xuICAgIH1cbiAgfVxuICBWdWVDdXN0b21FbGVtZW50LmRlZiA9IENvbXA7XG4gIHJldHVybiBWdWVDdXN0b21FbGVtZW50O1xufVxuY29uc3QgZGVmaW5lU1NSQ3VzdG9tRWxlbWVudCA9ICgvKiBAX19OT19TSURFX0VGRkVDVFNfXyAqLyAob3B0aW9ucywgZXh0cmFPcHRpb25zKSA9PiB7XG4gIHJldHVybiAvKiBAX19QVVJFX18gKi8gZGVmaW5lQ3VzdG9tRWxlbWVudChvcHRpb25zLCBleHRyYU9wdGlvbnMsIGNyZWF0ZVNTUkFwcCk7XG59KTtcbmNvbnN0IEJhc2VDbGFzcyA9IHR5cGVvZiBIVE1MRWxlbWVudCAhPT0gXCJ1bmRlZmluZWRcIiA/IEhUTUxFbGVtZW50IDogY2xhc3Mge1xufTtcbmNsYXNzIFZ1ZUVsZW1lbnQgZXh0ZW5kcyBCYXNlQ2xhc3Mge1xuICBjb25zdHJ1Y3RvcihfZGVmLCBfcHJvcHMgPSB7fSwgX2NyZWF0ZUFwcCA9IGNyZWF0ZUFwcCkge1xuICAgIHN1cGVyKCk7XG4gICAgdGhpcy5fZGVmID0gX2RlZjtcbiAgICB0aGlzLl9wcm9wcyA9IF9wcm9wcztcbiAgICB0aGlzLl9jcmVhdGVBcHAgPSBfY3JlYXRlQXBwO1xuICAgIHRoaXMuX2lzVnVlQ0UgPSB0cnVlO1xuICAgIC8qKlxuICAgICAqIEBpbnRlcm5hbFxuICAgICAqL1xuICAgIHRoaXMuX2luc3RhbmNlID0gbnVsbDtcbiAgICAvKipcbiAgICAgKiBAaW50ZXJuYWxcbiAgICAgKi9cbiAgICB0aGlzLl9hcHAgPSBudWxsO1xuICAgIC8qKlxuICAgICAqIEBpbnRlcm5hbFxuICAgICAqL1xuICAgIHRoaXMuX25vbmNlID0gdGhpcy5fZGVmLm5vbmNlO1xuICAgIHRoaXMuX2Nvbm5lY3RlZCA9IGZhbHNlO1xuICAgIHRoaXMuX3Jlc29sdmVkID0gZmFsc2U7XG4gICAgdGhpcy5fcGF0Y2hpbmcgPSBmYWxzZTtcbiAgICB0aGlzLl9kaXJ0eSA9IGZhbHNlO1xuICAgIHRoaXMuX251bWJlclByb3BzID0gbnVsbDtcbiAgICB0aGlzLl9zdHlsZUNoaWxkcmVuID0gLyogQF9fUFVSRV9fICovIG5ldyBXZWFrU2V0KCk7XG4gICAgdGhpcy5fb2IgPSBudWxsO1xuICAgIGlmICh0aGlzLnNoYWRvd1Jvb3QgJiYgX2NyZWF0ZUFwcCAhPT0gY3JlYXRlQXBwKSB7XG4gICAgICB0aGlzLl9yb290ID0gdGhpcy5zaGFkb3dSb290O1xuICAgIH0gZWxzZSB7XG4gICAgICBpZiAoISEocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09IFwicHJvZHVjdGlvblwiKSAmJiB0aGlzLnNoYWRvd1Jvb3QpIHtcbiAgICAgICAgd2FybihcbiAgICAgICAgICBgQ3VzdG9tIGVsZW1lbnQgaGFzIHByZS1yZW5kZXJlZCBkZWNsYXJhdGl2ZSBzaGFkb3cgcm9vdCBidXQgaXMgbm90IGRlZmluZWQgYXMgaHlkcmF0YWJsZS4gVXNlIFxcYGRlZmluZVNTUkN1c3RvbUVsZW1lbnRcXGAuYFxuICAgICAgICApO1xuICAgICAgfVxuICAgICAgaWYgKF9kZWYuc2hhZG93Um9vdCAhPT0gZmFsc2UpIHtcbiAgICAgICAgdGhpcy5hdHRhY2hTaGFkb3coXG4gICAgICAgICAgZXh0ZW5kKHt9LCBfZGVmLnNoYWRvd1Jvb3RPcHRpb25zLCB7XG4gICAgICAgICAgICBtb2RlOiBcIm9wZW5cIlxuICAgICAgICAgIH0pXG4gICAgICAgICk7XG4gICAgICAgIHRoaXMuX3Jvb3QgPSB0aGlzLnNoYWRvd1Jvb3Q7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLl9yb290ID0gdGhpcztcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgY29ubmVjdGVkQ2FsbGJhY2soKSB7XG4gICAgaWYgKCF0aGlzLmlzQ29ubmVjdGVkKSByZXR1cm47XG4gICAgaWYgKCF0aGlzLnNoYWRvd1Jvb3QgJiYgIXRoaXMuX3Jlc29sdmVkKSB7XG4gICAgICB0aGlzLl9wYXJzZVNsb3RzKCk7XG4gICAgfVxuICAgIHRoaXMuX2Nvbm5lY3RlZCA9IHRydWU7XG4gICAgbGV0IHBhcmVudCA9IHRoaXM7XG4gICAgd2hpbGUgKHBhcmVudCA9IHBhcmVudCAmJiAocGFyZW50LnBhcmVudE5vZGUgfHwgcGFyZW50Lmhvc3QpKSB7XG4gICAgICBpZiAocGFyZW50IGluc3RhbmNlb2YgVnVlRWxlbWVudCkge1xuICAgICAgICB0aGlzLl9wYXJlbnQgPSBwYXJlbnQ7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH1cbiAgICBpZiAoIXRoaXMuX2luc3RhbmNlKSB7XG4gICAgICBpZiAodGhpcy5fcmVzb2x2ZWQpIHtcbiAgICAgICAgdGhpcy5fbW91bnQodGhpcy5fZGVmKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGlmIChwYXJlbnQgJiYgcGFyZW50Ll9wZW5kaW5nUmVzb2x2ZSkge1xuICAgICAgICAgIHRoaXMuX3BlbmRpbmdSZXNvbHZlID0gcGFyZW50Ll9wZW5kaW5nUmVzb2x2ZS50aGVuKCgpID0+IHtcbiAgICAgICAgICAgIHRoaXMuX3BlbmRpbmdSZXNvbHZlID0gdm9pZCAwO1xuICAgICAgICAgICAgdGhpcy5fcmVzb2x2ZURlZigpO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHRoaXMuX3Jlc29sdmVEZWYoKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuICBfc2V0UGFyZW50KHBhcmVudCA9IHRoaXMuX3BhcmVudCkge1xuICAgIGlmIChwYXJlbnQpIHtcbiAgICAgIHRoaXMuX2luc3RhbmNlLnBhcmVudCA9IHBhcmVudC5faW5zdGFuY2U7XG4gICAgICB0aGlzLl9pbmhlcml0UGFyZW50Q29udGV4dChwYXJlbnQpO1xuICAgIH1cbiAgfVxuICBfaW5oZXJpdFBhcmVudENvbnRleHQocGFyZW50ID0gdGhpcy5fcGFyZW50KSB7XG4gICAgaWYgKHBhcmVudCAmJiB0aGlzLl9hcHApIHtcbiAgICAgIE9iamVjdC5zZXRQcm90b3R5cGVPZihcbiAgICAgICAgdGhpcy5fYXBwLl9jb250ZXh0LnByb3ZpZGVzLFxuICAgICAgICBwYXJlbnQuX2luc3RhbmNlLnByb3ZpZGVzXG4gICAgICApO1xuICAgIH1cbiAgfVxuICBkaXNjb25uZWN0ZWRDYWxsYmFjaygpIHtcbiAgICB0aGlzLl9jb25uZWN0ZWQgPSBmYWxzZTtcbiAgICBuZXh0VGljaygoKSA9PiB7XG4gICAgICBpZiAoIXRoaXMuX2Nvbm5lY3RlZCkge1xuICAgICAgICBpZiAodGhpcy5fb2IpIHtcbiAgICAgICAgICB0aGlzLl9vYi5kaXNjb25uZWN0KCk7XG4gICAgICAgICAgdGhpcy5fb2IgPSBudWxsO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuX2FwcCAmJiB0aGlzLl9hcHAudW5tb3VudCgpO1xuICAgICAgICBpZiAodGhpcy5faW5zdGFuY2UpIHRoaXMuX2luc3RhbmNlLmNlID0gdm9pZCAwO1xuICAgICAgICB0aGlzLl9hcHAgPSB0aGlzLl9pbnN0YW5jZSA9IG51bGw7XG4gICAgICAgIGlmICh0aGlzLl90ZWxlcG9ydFRhcmdldHMpIHtcbiAgICAgICAgICB0aGlzLl90ZWxlcG9ydFRhcmdldHMuY2xlYXIoKTtcbiAgICAgICAgICB0aGlzLl90ZWxlcG9ydFRhcmdldHMgPSB2b2lkIDA7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuICBfcHJvY2Vzc011dGF0aW9ucyhtdXRhdGlvbnMpIHtcbiAgICBmb3IgKGNvbnN0IG0gb2YgbXV0YXRpb25zKSB7XG4gICAgICB0aGlzLl9zZXRBdHRyKG0uYXR0cmlidXRlTmFtZSk7XG4gICAgfVxuICB9XG4gIC8qKlxuICAgKiByZXNvbHZlIGlubmVyIGNvbXBvbmVudCBkZWZpbml0aW9uIChoYW5kbGUgcG9zc2libGUgYXN5bmMgY29tcG9uZW50KVxuICAgKi9cbiAgX3Jlc29sdmVEZWYoKSB7XG4gICAgaWYgKHRoaXMuX3BlbmRpbmdSZXNvbHZlKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5hdHRyaWJ1dGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICB0aGlzLl9zZXRBdHRyKHRoaXMuYXR0cmlidXRlc1tpXS5uYW1lKTtcbiAgICB9XG4gICAgdGhpcy5fb2IgPSBuZXcgTXV0YXRpb25PYnNlcnZlcih0aGlzLl9wcm9jZXNzTXV0YXRpb25zLmJpbmQodGhpcykpO1xuICAgIHRoaXMuX29iLm9ic2VydmUodGhpcywgeyBhdHRyaWJ1dGVzOiB0cnVlIH0pO1xuICAgIGNvbnN0IHJlc29sdmUgPSAoZGVmLCBpc0FzeW5jID0gZmFsc2UpID0+IHtcbiAgICAgIHRoaXMuX3Jlc29sdmVkID0gdHJ1ZTtcbiAgICAgIHRoaXMuX3BlbmRpbmdSZXNvbHZlID0gdm9pZCAwO1xuICAgICAgY29uc3QgeyBwcm9wcywgc3R5bGVzIH0gPSBkZWY7XG4gICAgICBsZXQgbnVtYmVyUHJvcHM7XG4gICAgICBpZiAocHJvcHMgJiYgIWlzQXJyYXkocHJvcHMpKSB7XG4gICAgICAgIGZvciAoY29uc3Qga2V5IGluIHByb3BzKSB7XG4gICAgICAgICAgY29uc3Qgb3B0ID0gcHJvcHNba2V5XTtcbiAgICAgICAgICBpZiAob3B0ID09PSBOdW1iZXIgfHwgb3B0ICYmIG9wdC50eXBlID09PSBOdW1iZXIpIHtcbiAgICAgICAgICAgIGlmIChrZXkgaW4gdGhpcy5fcHJvcHMpIHtcbiAgICAgICAgICAgICAgdGhpcy5fcHJvcHNba2V5XSA9IHRvTnVtYmVyKHRoaXMuX3Byb3BzW2tleV0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgKG51bWJlclByb3BzIHx8IChudW1iZXJQcm9wcyA9IC8qIEBfX1BVUkVfXyAqLyBPYmplY3QuY3JlYXRlKG51bGwpKSlbY2FtZWxpemUkMShrZXkpXSA9IHRydWU7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICB0aGlzLl9udW1iZXJQcm9wcyA9IG51bWJlclByb3BzO1xuICAgICAgdGhpcy5fcmVzb2x2ZVByb3BzKGRlZik7XG4gICAgICBpZiAodGhpcy5zaGFkb3dSb290KSB7XG4gICAgICAgIHRoaXMuX2FwcGx5U3R5bGVzKHN0eWxlcyk7XG4gICAgICB9IGVsc2UgaWYgKCEhKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSBcInByb2R1Y3Rpb25cIikgJiYgc3R5bGVzKSB7XG4gICAgICAgIHdhcm4oXG4gICAgICAgICAgXCJDdXN0b20gZWxlbWVudCBzdHlsZSBpbmplY3Rpb24gaXMgbm90IHN1cHBvcnRlZCB3aGVuIHVzaW5nIHNoYWRvd1Jvb3Q6IGZhbHNlXCJcbiAgICAgICAgKTtcbiAgICAgIH1cbiAgICAgIHRoaXMuX21vdW50KGRlZik7XG4gICAgfTtcbiAgICBjb25zdCBhc3luY0RlZiA9IHRoaXMuX2RlZi5fX2FzeW5jTG9hZGVyO1xuICAgIGlmIChhc3luY0RlZikge1xuICAgICAgdGhpcy5fcGVuZGluZ1Jlc29sdmUgPSBhc3luY0RlZigpLnRoZW4oKGRlZikgPT4ge1xuICAgICAgICBkZWYuY29uZmlndXJlQXBwID0gdGhpcy5fZGVmLmNvbmZpZ3VyZUFwcDtcbiAgICAgICAgcmVzb2x2ZSh0aGlzLl9kZWYgPSBkZWYsIHRydWUpO1xuICAgICAgfSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJlc29sdmUodGhpcy5fZGVmKTtcbiAgICB9XG4gIH1cbiAgX21vdW50KGRlZikge1xuICAgIGlmICgoISEocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09IFwicHJvZHVjdGlvblwiKSB8fCBfX1ZVRV9QUk9EX0RFVlRPT0xTX18pICYmICFkZWYubmFtZSkge1xuICAgICAgZGVmLm5hbWUgPSBcIlZ1ZUVsZW1lbnRcIjtcbiAgICB9XG4gICAgdGhpcy5fYXBwID0gdGhpcy5fY3JlYXRlQXBwKGRlZik7XG4gICAgdGhpcy5faW5oZXJpdFBhcmVudENvbnRleHQoKTtcbiAgICBpZiAoZGVmLmNvbmZpZ3VyZUFwcCkge1xuICAgICAgZGVmLmNvbmZpZ3VyZUFwcCh0aGlzLl9hcHApO1xuICAgIH1cbiAgICB0aGlzLl9hcHAuX2NlVk5vZGUgPSB0aGlzLl9jcmVhdGVWTm9kZSgpO1xuICAgIHRoaXMuX2FwcC5tb3VudCh0aGlzLl9yb290KTtcbiAgICBjb25zdCBleHBvc2VkID0gdGhpcy5faW5zdGFuY2UgJiYgdGhpcy5faW5zdGFuY2UuZXhwb3NlZDtcbiAgICBpZiAoIWV4cG9zZWQpIHJldHVybjtcbiAgICBmb3IgKGNvbnN0IGtleSBpbiBleHBvc2VkKSB7XG4gICAgICBpZiAoIWhhc093bih0aGlzLCBrZXkpKSB7XG4gICAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0aGlzLCBrZXksIHtcbiAgICAgICAgICAvLyB1bndyYXAgcmVmIHRvIGJlIGNvbnNpc3RlbnQgd2l0aCBwdWJsaWMgaW5zdGFuY2UgYmVoYXZpb3JcbiAgICAgICAgICBnZXQ6ICgpID0+IHVucmVmKGV4cG9zZWRba2V5XSlcbiAgICAgICAgfSk7XG4gICAgICB9IGVsc2UgaWYgKCEhKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSBcInByb2R1Y3Rpb25cIikpIHtcbiAgICAgICAgd2FybihgRXhwb3NlZCBwcm9wZXJ0eSBcIiR7a2V5fVwiIGFscmVhZHkgZXhpc3RzIG9uIGN1c3RvbSBlbGVtZW50LmApO1xuICAgICAgfVxuICAgIH1cbiAgfVxuICBfcmVzb2x2ZVByb3BzKGRlZikge1xuICAgIGNvbnN0IHsgcHJvcHMgfSA9IGRlZjtcbiAgICBjb25zdCBkZWNsYXJlZFByb3BLZXlzID0gaXNBcnJheShwcm9wcykgPyBwcm9wcyA6IE9iamVjdC5rZXlzKHByb3BzIHx8IHt9KTtcbiAgICBmb3IgKGNvbnN0IGtleSBvZiBPYmplY3Qua2V5cyh0aGlzKSkge1xuICAgICAgaWYgKGtleVswXSAhPT0gXCJfXCIgJiYgZGVjbGFyZWRQcm9wS2V5cy5pbmNsdWRlcyhrZXkpKSB7XG4gICAgICAgIHRoaXMuX3NldFByb3Aoa2V5LCB0aGlzW2tleV0pO1xuICAgICAgfVxuICAgIH1cbiAgICBmb3IgKGNvbnN0IGtleSBvZiBkZWNsYXJlZFByb3BLZXlzLm1hcChjYW1lbGl6ZSQxKSkge1xuICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRoaXMsIGtleSwge1xuICAgICAgICBnZXQoKSB7XG4gICAgICAgICAgcmV0dXJuIHRoaXMuX2dldFByb3Aoa2V5KTtcbiAgICAgICAgfSxcbiAgICAgICAgc2V0KHZhbCkge1xuICAgICAgICAgIHRoaXMuX3NldFByb3Aoa2V5LCB2YWwsIHRydWUsICF0aGlzLl9wYXRjaGluZyk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH1cbiAgfVxuICBfc2V0QXR0cihrZXkpIHtcbiAgICBpZiAoa2V5LnN0YXJ0c1dpdGgoXCJkYXRhLXYtXCIpKSByZXR1cm47XG4gICAgY29uc3QgaGFzID0gdGhpcy5oYXNBdHRyaWJ1dGUoa2V5KTtcbiAgICBsZXQgdmFsdWUgPSBoYXMgPyB0aGlzLmdldEF0dHJpYnV0ZShrZXkpIDogUkVNT1ZBTDtcbiAgICBjb25zdCBjYW1lbEtleSA9IGNhbWVsaXplJDEoa2V5KTtcbiAgICBpZiAoaGFzICYmIHRoaXMuX251bWJlclByb3BzICYmIHRoaXMuX251bWJlclByb3BzW2NhbWVsS2V5XSkge1xuICAgICAgdmFsdWUgPSB0b051bWJlcih2YWx1ZSk7XG4gICAgfVxuICAgIHRoaXMuX3NldFByb3AoY2FtZWxLZXksIHZhbHVlLCBmYWxzZSwgdHJ1ZSk7XG4gIH1cbiAgLyoqXG4gICAqIEBpbnRlcm5hbFxuICAgKi9cbiAgX2dldFByb3Aoa2V5KSB7XG4gICAgcmV0dXJuIHRoaXMuX3Byb3BzW2tleV07XG4gIH1cbiAgLyoqXG4gICAqIEBpbnRlcm5hbFxuICAgKi9cbiAgX3NldFByb3Aoa2V5LCB2YWwsIHNob3VsZFJlZmxlY3QgPSB0cnVlLCBzaG91bGRVcGRhdGUgPSBmYWxzZSkge1xuICAgIGlmICh2YWwgIT09IHRoaXMuX3Byb3BzW2tleV0pIHtcbiAgICAgIHRoaXMuX2RpcnR5ID0gdHJ1ZTtcbiAgICAgIGlmICh2YWwgPT09IFJFTU9WQUwpIHtcbiAgICAgICAgZGVsZXRlIHRoaXMuX3Byb3BzW2tleV07XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLl9wcm9wc1trZXldID0gdmFsO1xuICAgICAgICBpZiAoa2V5ID09PSBcImtleVwiICYmIHRoaXMuX2FwcCkge1xuICAgICAgICAgIHRoaXMuX2FwcC5fY2VWTm9kZS5rZXkgPSB2YWw7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGlmIChzaG91bGRVcGRhdGUgJiYgdGhpcy5faW5zdGFuY2UpIHtcbiAgICAgICAgdGhpcy5fdXBkYXRlKCk7XG4gICAgICB9XG4gICAgICBpZiAoc2hvdWxkUmVmbGVjdCkge1xuICAgICAgICBjb25zdCBvYiA9IHRoaXMuX29iO1xuICAgICAgICBpZiAob2IpIHtcbiAgICAgICAgICB0aGlzLl9wcm9jZXNzTXV0YXRpb25zKG9iLnRha2VSZWNvcmRzKCkpO1xuICAgICAgICAgIG9iLmRpc2Nvbm5lY3QoKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAodmFsID09PSB0cnVlKSB7XG4gICAgICAgICAgdGhpcy5zZXRBdHRyaWJ1dGUoaHlwaGVuYXRlKGtleSksIFwiXCIpO1xuICAgICAgICB9IGVsc2UgaWYgKHR5cGVvZiB2YWwgPT09IFwic3RyaW5nXCIgfHwgdHlwZW9mIHZhbCA9PT0gXCJudW1iZXJcIikge1xuICAgICAgICAgIHRoaXMuc2V0QXR0cmlidXRlKGh5cGhlbmF0ZShrZXkpLCB2YWwgKyBcIlwiKTtcbiAgICAgICAgfSBlbHNlIGlmICghdmFsKSB7XG4gICAgICAgICAgdGhpcy5yZW1vdmVBdHRyaWJ1dGUoaHlwaGVuYXRlKGtleSkpO1xuICAgICAgICB9XG4gICAgICAgIG9iICYmIG9iLm9ic2VydmUodGhpcywgeyBhdHRyaWJ1dGVzOiB0cnVlIH0pO1xuICAgICAgfVxuICAgIH1cbiAgfVxuICBfdXBkYXRlKCkge1xuICAgIGNvbnN0IHZub2RlID0gdGhpcy5fY3JlYXRlVk5vZGUoKTtcbiAgICBpZiAodGhpcy5fYXBwKSB2bm9kZS5hcHBDb250ZXh0ID0gdGhpcy5fYXBwLl9jb250ZXh0O1xuICAgIHJlbmRlcih2bm9kZSwgdGhpcy5fcm9vdCk7XG4gIH1cbiAgX2NyZWF0ZVZOb2RlKCkge1xuICAgIGNvbnN0IGJhc2VQcm9wcyA9IHt9O1xuICAgIGlmICghdGhpcy5zaGFkb3dSb290KSB7XG4gICAgICBiYXNlUHJvcHMub25Wbm9kZU1vdW50ZWQgPSBiYXNlUHJvcHMub25Wbm9kZVVwZGF0ZWQgPSB0aGlzLl9yZW5kZXJTbG90cy5iaW5kKHRoaXMpO1xuICAgIH1cbiAgICBjb25zdCB2bm9kZSA9IGNyZWF0ZVZOb2RlKHRoaXMuX2RlZiwgZXh0ZW5kKGJhc2VQcm9wcywgdGhpcy5fcHJvcHMpKTtcbiAgICBpZiAoIXRoaXMuX2luc3RhbmNlKSB7XG4gICAgICB2bm9kZS5jZSA9IChpbnN0YW5jZSkgPT4ge1xuICAgICAgICB0aGlzLl9pbnN0YW5jZSA9IGluc3RhbmNlO1xuICAgICAgICBpbnN0YW5jZS5jZSA9IHRoaXM7XG4gICAgICAgIGluc3RhbmNlLmlzQ0UgPSB0cnVlO1xuICAgICAgICBpZiAoISEocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09IFwicHJvZHVjdGlvblwiKSkge1xuICAgICAgICAgIGluc3RhbmNlLmNlUmVsb2FkID0gKG5ld1N0eWxlcykgPT4ge1xuICAgICAgICAgICAgaWYgKHRoaXMuX3N0eWxlcykge1xuICAgICAgICAgICAgICB0aGlzLl9zdHlsZXMuZm9yRWFjaCgocykgPT4gdGhpcy5fcm9vdC5yZW1vdmVDaGlsZChzKSk7XG4gICAgICAgICAgICAgIHRoaXMuX3N0eWxlcy5sZW5ndGggPSAwO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5fYXBwbHlTdHlsZXMobmV3U3R5bGVzKTtcbiAgICAgICAgICAgIHRoaXMuX2luc3RhbmNlID0gbnVsbDtcbiAgICAgICAgICAgIHRoaXMuX3VwZGF0ZSgpO1xuICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgZGlzcGF0Y2ggPSAoZXZlbnQsIGFyZ3MpID0+IHtcbiAgICAgICAgICB0aGlzLmRpc3BhdGNoRXZlbnQoXG4gICAgICAgICAgICBuZXcgQ3VzdG9tRXZlbnQoXG4gICAgICAgICAgICAgIGV2ZW50LFxuICAgICAgICAgICAgICBpc1BsYWluT2JqZWN0KGFyZ3NbMF0pID8gZXh0ZW5kKHsgZGV0YWlsOiBhcmdzIH0sIGFyZ3NbMF0pIDogeyBkZXRhaWw6IGFyZ3MgfVxuICAgICAgICAgICAgKVxuICAgICAgICAgICk7XG4gICAgICAgIH07XG4gICAgICAgIGluc3RhbmNlLmVtaXQgPSAoZXZlbnQsIC4uLmFyZ3MpID0+IHtcbiAgICAgICAgICBkaXNwYXRjaChldmVudCwgYXJncyk7XG4gICAgICAgICAgaWYgKGh5cGhlbmF0ZShldmVudCkgIT09IGV2ZW50KSB7XG4gICAgICAgICAgICBkaXNwYXRjaChoeXBoZW5hdGUoZXZlbnQpLCBhcmdzKTtcbiAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICAgIHRoaXMuX3NldFBhcmVudCgpO1xuICAgICAgfTtcbiAgICB9XG4gICAgcmV0dXJuIHZub2RlO1xuICB9XG4gIF9hcHBseVN0eWxlcyhzdHlsZXMsIG93bmVyKSB7XG4gICAgaWYgKCFzdHlsZXMpIHJldHVybjtcbiAgICBpZiAob3duZXIpIHtcbiAgICAgIGlmIChvd25lciA9PT0gdGhpcy5fZGVmIHx8IHRoaXMuX3N0eWxlQ2hpbGRyZW4uaGFzKG93bmVyKSkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICB0aGlzLl9zdHlsZUNoaWxkcmVuLmFkZChvd25lcik7XG4gICAgfVxuICAgIGNvbnN0IG5vbmNlID0gdGhpcy5fbm9uY2U7XG4gICAgZm9yIChsZXQgaSA9IHN0eWxlcy5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xuICAgICAgY29uc3QgcyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzdHlsZVwiKTtcbiAgICAgIGlmIChub25jZSkgcy5zZXRBdHRyaWJ1dGUoXCJub25jZVwiLCBub25jZSk7XG4gICAgICBzLnRleHRDb250ZW50ID0gc3R5bGVzW2ldO1xuICAgICAgdGhpcy5zaGFkb3dSb290LnByZXBlbmQocyk7XG4gICAgICBpZiAoISEocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09IFwicHJvZHVjdGlvblwiKSkge1xuICAgICAgICBpZiAob3duZXIpIHtcbiAgICAgICAgICBpZiAob3duZXIuX19obXJJZCkge1xuICAgICAgICAgICAgaWYgKCF0aGlzLl9jaGlsZFN0eWxlcykgdGhpcy5fY2hpbGRTdHlsZXMgPSAvKiBAX19QVVJFX18gKi8gbmV3IE1hcCgpO1xuICAgICAgICAgICAgbGV0IGVudHJ5ID0gdGhpcy5fY2hpbGRTdHlsZXMuZ2V0KG93bmVyLl9faG1ySWQpO1xuICAgICAgICAgICAgaWYgKCFlbnRyeSkge1xuICAgICAgICAgICAgICB0aGlzLl9jaGlsZFN0eWxlcy5zZXQob3duZXIuX19obXJJZCwgZW50cnkgPSBbXSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbnRyeS5wdXNoKHMpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAodGhpcy5fc3R5bGVzIHx8ICh0aGlzLl9zdHlsZXMgPSBbXSkpLnB1c2gocyk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgLyoqXG4gICAqIE9ubHkgY2FsbGVkIHdoZW4gc2hhZG93Um9vdCBpcyBmYWxzZVxuICAgKi9cbiAgX3BhcnNlU2xvdHMoKSB7XG4gICAgY29uc3Qgc2xvdHMgPSB0aGlzLl9zbG90cyA9IHt9O1xuICAgIGxldCBuO1xuICAgIHdoaWxlIChuID0gdGhpcy5maXJzdENoaWxkKSB7XG4gICAgICBjb25zdCBzbG90TmFtZSA9IG4ubm9kZVR5cGUgPT09IDEgJiYgbi5nZXRBdHRyaWJ1dGUoXCJzbG90XCIpIHx8IFwiZGVmYXVsdFwiO1xuICAgICAgKHNsb3RzW3Nsb3ROYW1lXSB8fCAoc2xvdHNbc2xvdE5hbWVdID0gW10pKS5wdXNoKG4pO1xuICAgICAgdGhpcy5yZW1vdmVDaGlsZChuKTtcbiAgICB9XG4gIH1cbiAgLyoqXG4gICAqIE9ubHkgY2FsbGVkIHdoZW4gc2hhZG93Um9vdCBpcyBmYWxzZVxuICAgKi9cbiAgX3JlbmRlclNsb3RzKCkge1xuICAgIGNvbnN0IG91dGxldHMgPSB0aGlzLl9nZXRTbG90cygpO1xuICAgIGNvbnN0IHNjb3BlSWQgPSB0aGlzLl9pbnN0YW5jZS50eXBlLl9fc2NvcGVJZDtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IG91dGxldHMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGNvbnN0IG8gPSBvdXRsZXRzW2ldO1xuICAgICAgY29uc3Qgc2xvdE5hbWUgPSBvLmdldEF0dHJpYnV0ZShcIm5hbWVcIikgfHwgXCJkZWZhdWx0XCI7XG4gICAgICBjb25zdCBjb250ZW50ID0gdGhpcy5fc2xvdHNbc2xvdE5hbWVdO1xuICAgICAgY29uc3QgcGFyZW50ID0gby5wYXJlbnROb2RlO1xuICAgICAgaWYgKGNvbnRlbnQpIHtcbiAgICAgICAgZm9yIChjb25zdCBuIG9mIGNvbnRlbnQpIHtcbiAgICAgICAgICBpZiAoc2NvcGVJZCAmJiBuLm5vZGVUeXBlID09PSAxKSB7XG4gICAgICAgICAgICBjb25zdCBpZCA9IHNjb3BlSWQgKyBcIi1zXCI7XG4gICAgICAgICAgICBjb25zdCB3YWxrZXIgPSBkb2N1bWVudC5jcmVhdGVUcmVlV2Fsa2VyKG4sIDEpO1xuICAgICAgICAgICAgbi5zZXRBdHRyaWJ1dGUoaWQsIFwiXCIpO1xuICAgICAgICAgICAgbGV0IGNoaWxkO1xuICAgICAgICAgICAgd2hpbGUgKGNoaWxkID0gd2Fsa2VyLm5leHROb2RlKCkpIHtcbiAgICAgICAgICAgICAgY2hpbGQuc2V0QXR0cmlidXRlKGlkLCBcIlwiKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgcGFyZW50Lmluc2VydEJlZm9yZShuLCBvKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgd2hpbGUgKG8uZmlyc3RDaGlsZCkgcGFyZW50Lmluc2VydEJlZm9yZShvLmZpcnN0Q2hpbGQsIG8pO1xuICAgICAgfVxuICAgICAgcGFyZW50LnJlbW92ZUNoaWxkKG8pO1xuICAgIH1cbiAgfVxuICAvKipcbiAgICogQGludGVybmFsXG4gICAqL1xuICBfZ2V0U2xvdHMoKSB7XG4gICAgY29uc3Qgcm9vdHMgPSBbdGhpc107XG4gICAgaWYgKHRoaXMuX3RlbGVwb3J0VGFyZ2V0cykge1xuICAgICAgcm9vdHMucHVzaCguLi50aGlzLl90ZWxlcG9ydFRhcmdldHMpO1xuICAgIH1cbiAgICBjb25zdCBzbG90cyA9IC8qIEBfX1BVUkVfXyAqLyBuZXcgU2V0KCk7XG4gICAgZm9yIChjb25zdCByb290IG9mIHJvb3RzKSB7XG4gICAgICBjb25zdCBmb3VuZCA9IHJvb3QucXVlcnlTZWxlY3RvckFsbChcInNsb3RcIik7XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGZvdW5kLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHNsb3RzLmFkZChmb3VuZFtpXSk7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBBcnJheS5mcm9tKHNsb3RzKTtcbiAgfVxuICAvKipcbiAgICogQGludGVybmFsXG4gICAqL1xuICBfaW5qZWN0Q2hpbGRTdHlsZShjb21wKSB7XG4gICAgdGhpcy5fYXBwbHlTdHlsZXMoY29tcC5zdHlsZXMsIGNvbXApO1xuICB9XG4gIC8qKlxuICAgKiBAaW50ZXJuYWxcbiAgICovXG4gIF9iZWdpblBhdGNoKCkge1xuICAgIHRoaXMuX3BhdGNoaW5nID0gdHJ1ZTtcbiAgICB0aGlzLl9kaXJ0eSA9IGZhbHNlO1xuICB9XG4gIC8qKlxuICAgKiBAaW50ZXJuYWxcbiAgICovXG4gIF9lbmRQYXRjaCgpIHtcbiAgICB0aGlzLl9wYXRjaGluZyA9IGZhbHNlO1xuICAgIGlmICh0aGlzLl9kaXJ0eSAmJiB0aGlzLl9pbnN0YW5jZSkge1xuICAgICAgdGhpcy5fdXBkYXRlKCk7XG4gICAgfVxuICB9XG4gIC8qKlxuICAgKiBAaW50ZXJuYWxcbiAgICovXG4gIF9oYXNTaGFkb3dSb290KCkge1xuICAgIHJldHVybiB0aGlzLl9kZWYuc2hhZG93Um9vdCAhPT0gZmFsc2U7XG4gIH1cbiAgLyoqXG4gICAqIEBpbnRlcm5hbFxuICAgKi9cbiAgX3JlbW92ZUNoaWxkU3R5bGUoY29tcCkge1xuICAgIGlmICghIShwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gXCJwcm9kdWN0aW9uXCIpKSB7XG4gICAgICB0aGlzLl9zdHlsZUNoaWxkcmVuLmRlbGV0ZShjb21wKTtcbiAgICAgIGlmICh0aGlzLl9jaGlsZFN0eWxlcyAmJiBjb21wLl9faG1ySWQpIHtcbiAgICAgICAgY29uc3Qgb2xkU3R5bGVzID0gdGhpcy5fY2hpbGRTdHlsZXMuZ2V0KGNvbXAuX19obXJJZCk7XG4gICAgICAgIGlmIChvbGRTdHlsZXMpIHtcbiAgICAgICAgICBvbGRTdHlsZXMuZm9yRWFjaCgocykgPT4gdGhpcy5fcm9vdC5yZW1vdmVDaGlsZChzKSk7XG4gICAgICAgICAgb2xkU3R5bGVzLmxlbmd0aCA9IDA7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cbmZ1bmN0aW9uIHVzZUhvc3QoY2FsbGVyKSB7XG4gIGNvbnN0IGluc3RhbmNlID0gZ2V0Q3VycmVudEluc3RhbmNlKCk7XG4gIGNvbnN0IGVsID0gaW5zdGFuY2UgJiYgaW5zdGFuY2UuY2U7XG4gIGlmIChlbCkge1xuICAgIHJldHVybiBlbDtcbiAgfSBlbHNlIGlmICghIShwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gXCJwcm9kdWN0aW9uXCIpKSB7XG4gICAgaWYgKCFpbnN0YW5jZSkge1xuICAgICAgd2FybihcbiAgICAgICAgYCR7Y2FsbGVyIHx8IFwidXNlSG9zdFwifSBjYWxsZWQgd2l0aG91dCBhbiBhY3RpdmUgY29tcG9uZW50IGluc3RhbmNlLmBcbiAgICAgICk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHdhcm4oXG4gICAgICAgIGAke2NhbGxlciB8fCBcInVzZUhvc3RcIn0gY2FuIG9ubHkgYmUgdXNlZCBpbiBjb21wb25lbnRzIGRlZmluZWQgdmlhIGRlZmluZUN1c3RvbUVsZW1lbnQuYFxuICAgICAgKTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIG51bGw7XG59XG5mdW5jdGlvbiB1c2VTaGFkb3dSb290KCkge1xuICBjb25zdCBlbCA9ICEhKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSBcInByb2R1Y3Rpb25cIikgPyB1c2VIb3N0KFwidXNlU2hhZG93Um9vdFwiKSA6IHVzZUhvc3QoKTtcbiAgcmV0dXJuIGVsICYmIGVsLnNoYWRvd1Jvb3Q7XG59XG5cbmZ1bmN0aW9uIHVzZUNzc01vZHVsZShuYW1lID0gXCIkc3R5bGVcIikge1xuICB7XG4gICAgY29uc3QgaW5zdGFuY2UgPSBnZXRDdXJyZW50SW5zdGFuY2UoKTtcbiAgICBpZiAoIWluc3RhbmNlKSB7XG4gICAgICAhIShwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gXCJwcm9kdWN0aW9uXCIpICYmIHdhcm4oYHVzZUNzc01vZHVsZSBtdXN0IGJlIGNhbGxlZCBpbnNpZGUgc2V0dXAoKWApO1xuICAgICAgcmV0dXJuIEVNUFRZX09CSjtcbiAgICB9XG4gICAgY29uc3QgbW9kdWxlcyA9IGluc3RhbmNlLnR5cGUuX19jc3NNb2R1bGVzO1xuICAgIGlmICghbW9kdWxlcykge1xuICAgICAgISEocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09IFwicHJvZHVjdGlvblwiKSAmJiB3YXJuKGBDdXJyZW50IGluc3RhbmNlIGRvZXMgbm90IGhhdmUgQ1NTIG1vZHVsZXMgaW5qZWN0ZWQuYCk7XG4gICAgICByZXR1cm4gRU1QVFlfT0JKO1xuICAgIH1cbiAgICBjb25zdCBtb2QgPSBtb2R1bGVzW25hbWVdO1xuICAgIGlmICghbW9kKSB7XG4gICAgICAhIShwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gXCJwcm9kdWN0aW9uXCIpICYmIHdhcm4oYEN1cnJlbnQgaW5zdGFuY2UgZG9lcyBub3QgaGF2ZSBDU1MgbW9kdWxlIG5hbWVkIFwiJHtuYW1lfVwiLmApO1xuICAgICAgcmV0dXJuIEVNUFRZX09CSjtcbiAgICB9XG4gICAgcmV0dXJuIG1vZDtcbiAgfVxufVxuXG5jb25zdCBwb3NpdGlvbk1hcCA9IC8qIEBfX1BVUkVfXyAqLyBuZXcgV2Vha01hcCgpO1xuY29uc3QgbmV3UG9zaXRpb25NYXAgPSAvKiBAX19QVVJFX18gKi8gbmV3IFdlYWtNYXAoKTtcbmNvbnN0IG1vdmVDYktleSA9IC8qIEBfX1BVUkVfXyAqLyBTeW1ib2woXCJfbW92ZUNiXCIpO1xuY29uc3QgZW50ZXJDYktleSA9IC8qIEBfX1BVUkVfXyAqLyBTeW1ib2woXCJfZW50ZXJDYlwiKTtcbmNvbnN0IGRlY29yYXRlID0gKHQpID0+IHtcbiAgZGVsZXRlIHQucHJvcHMubW9kZTtcbiAgcmV0dXJuIHQ7XG59O1xuY29uc3QgVHJhbnNpdGlvbkdyb3VwSW1wbCA9IC8qIEBfX1BVUkVfXyAqLyBkZWNvcmF0ZSh7XG4gIG5hbWU6IFwiVHJhbnNpdGlvbkdyb3VwXCIsXG4gIHByb3BzOiAvKiBAX19QVVJFX18gKi8gZXh0ZW5kKHt9LCBUcmFuc2l0aW9uUHJvcHNWYWxpZGF0b3JzLCB7XG4gICAgdGFnOiBTdHJpbmcsXG4gICAgbW92ZUNsYXNzOiBTdHJpbmdcbiAgfSksXG4gIHNldHVwKHByb3BzLCB7IHNsb3RzIH0pIHtcbiAgICBjb25zdCBpbnN0YW5jZSA9IGdldEN1cnJlbnRJbnN0YW5jZSgpO1xuICAgIGNvbnN0IHN0YXRlID0gdXNlVHJhbnNpdGlvblN0YXRlKCk7XG4gICAgbGV0IHByZXZDaGlsZHJlbjtcbiAgICBsZXQgY2hpbGRyZW47XG4gICAgb25VcGRhdGVkKCgpID0+IHtcbiAgICAgIGlmICghcHJldkNoaWxkcmVuLmxlbmd0aCkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBjb25zdCBtb3ZlQ2xhc3MgPSBwcm9wcy5tb3ZlQ2xhc3MgfHwgYCR7cHJvcHMubmFtZSB8fCBcInZcIn0tbW92ZWA7XG4gICAgICBpZiAoIWhhc0NTU1RyYW5zZm9ybShcbiAgICAgICAgcHJldkNoaWxkcmVuWzBdLmVsLFxuICAgICAgICBpbnN0YW5jZS52bm9kZS5lbCxcbiAgICAgICAgbW92ZUNsYXNzXG4gICAgICApKSB7XG4gICAgICAgIHByZXZDaGlsZHJlbiA9IFtdO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBwcmV2Q2hpbGRyZW4uZm9yRWFjaChjYWxsUGVuZGluZ0Nicyk7XG4gICAgICBwcmV2Q2hpbGRyZW4uZm9yRWFjaChyZWNvcmRQb3NpdGlvbik7XG4gICAgICBjb25zdCBtb3ZlZENoaWxkcmVuID0gcHJldkNoaWxkcmVuLmZpbHRlcihhcHBseVRyYW5zbGF0aW9uKTtcbiAgICAgIGZvcmNlUmVmbG93KGluc3RhbmNlLnZub2RlLmVsKTtcbiAgICAgIG1vdmVkQ2hpbGRyZW4uZm9yRWFjaCgoYykgPT4ge1xuICAgICAgICBjb25zdCBlbCA9IGMuZWw7XG4gICAgICAgIGNvbnN0IHN0eWxlID0gZWwuc3R5bGU7XG4gICAgICAgIGFkZFRyYW5zaXRpb25DbGFzcyhlbCwgbW92ZUNsYXNzKTtcbiAgICAgICAgc3R5bGUudHJhbnNmb3JtID0gc3R5bGUud2Via2l0VHJhbnNmb3JtID0gc3R5bGUudHJhbnNpdGlvbkR1cmF0aW9uID0gXCJcIjtcbiAgICAgICAgY29uc3QgY2IgPSBlbFttb3ZlQ2JLZXldID0gKGUpID0+IHtcbiAgICAgICAgICBpZiAoZSAmJiBlLnRhcmdldCAhPT0gZWwpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKCFlIHx8IGUucHJvcGVydHlOYW1lLmVuZHNXaXRoKFwidHJhbnNmb3JtXCIpKSB7XG4gICAgICAgICAgICBlbC5yZW1vdmVFdmVudExpc3RlbmVyKFwidHJhbnNpdGlvbmVuZFwiLCBjYik7XG4gICAgICAgICAgICBlbFttb3ZlQ2JLZXldID0gbnVsbDtcbiAgICAgICAgICAgIHJlbW92ZVRyYW5zaXRpb25DbGFzcyhlbCwgbW92ZUNsYXNzKTtcbiAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICAgIGVsLmFkZEV2ZW50TGlzdGVuZXIoXCJ0cmFuc2l0aW9uZW5kXCIsIGNiKTtcbiAgICAgIH0pO1xuICAgICAgcHJldkNoaWxkcmVuID0gW107XG4gICAgfSk7XG4gICAgcmV0dXJuICgpID0+IHtcbiAgICAgIGNvbnN0IHJhd1Byb3BzID0gdG9SYXcocHJvcHMpO1xuICAgICAgY29uc3QgY3NzVHJhbnNpdGlvblByb3BzID0gcmVzb2x2ZVRyYW5zaXRpb25Qcm9wcyhyYXdQcm9wcyk7XG4gICAgICBsZXQgdGFnID0gcmF3UHJvcHMudGFnIHx8IEZyYWdtZW50O1xuICAgICAgcHJldkNoaWxkcmVuID0gW107XG4gICAgICBpZiAoY2hpbGRyZW4pIHtcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBjaGlsZHJlbi5sZW5ndGg7IGkrKykge1xuICAgICAgICAgIGNvbnN0IGNoaWxkID0gY2hpbGRyZW5baV07XG4gICAgICAgICAgaWYgKGNoaWxkLmVsICYmIGNoaWxkLmVsIGluc3RhbmNlb2YgRWxlbWVudCkge1xuICAgICAgICAgICAgcHJldkNoaWxkcmVuLnB1c2goY2hpbGQpO1xuICAgICAgICAgICAgc2V0VHJhbnNpdGlvbkhvb2tzKFxuICAgICAgICAgICAgICBjaGlsZCxcbiAgICAgICAgICAgICAgcmVzb2x2ZVRyYW5zaXRpb25Ib29rcyhcbiAgICAgICAgICAgICAgICBjaGlsZCxcbiAgICAgICAgICAgICAgICBjc3NUcmFuc2l0aW9uUHJvcHMsXG4gICAgICAgICAgICAgICAgc3RhdGUsXG4gICAgICAgICAgICAgICAgaW5zdGFuY2VcbiAgICAgICAgICAgICAgKVxuICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIHBvc2l0aW9uTWFwLnNldChjaGlsZCwgZ2V0UG9zaXRpb24oY2hpbGQuZWwpKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGNoaWxkcmVuID0gc2xvdHMuZGVmYXVsdCA/IGdldFRyYW5zaXRpb25SYXdDaGlsZHJlbihzbG90cy5kZWZhdWx0KCkpIDogW107XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGNoaWxkcmVuLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGNvbnN0IGNoaWxkID0gY2hpbGRyZW5baV07XG4gICAgICAgIGlmIChjaGlsZC5rZXkgIT0gbnVsbCkge1xuICAgICAgICAgIHNldFRyYW5zaXRpb25Ib29rcyhcbiAgICAgICAgICAgIGNoaWxkLFxuICAgICAgICAgICAgcmVzb2x2ZVRyYW5zaXRpb25Ib29rcyhjaGlsZCwgY3NzVHJhbnNpdGlvblByb3BzLCBzdGF0ZSwgaW5zdGFuY2UpXG4gICAgICAgICAgKTtcbiAgICAgICAgfSBlbHNlIGlmICghIShwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gXCJwcm9kdWN0aW9uXCIpICYmIGNoaWxkLnR5cGUgIT09IFRleHQpIHtcbiAgICAgICAgICB3YXJuKGA8VHJhbnNpdGlvbkdyb3VwPiBjaGlsZHJlbiBtdXN0IGJlIGtleWVkLmApO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICByZXR1cm4gY3JlYXRlVk5vZGUodGFnLCBudWxsLCBjaGlsZHJlbik7XG4gICAgfTtcbiAgfVxufSk7XG5jb25zdCBUcmFuc2l0aW9uR3JvdXAgPSBUcmFuc2l0aW9uR3JvdXBJbXBsO1xuZnVuY3Rpb24gY2FsbFBlbmRpbmdDYnMoYykge1xuICBjb25zdCBlbCA9IGMuZWw7XG4gIGlmIChlbFttb3ZlQ2JLZXldKSB7XG4gICAgZWxbbW92ZUNiS2V5XSgpO1xuICB9XG4gIGlmIChlbFtlbnRlckNiS2V5XSkge1xuICAgIGVsW2VudGVyQ2JLZXldKCk7XG4gIH1cbn1cbmZ1bmN0aW9uIHJlY29yZFBvc2l0aW9uKGMpIHtcbiAgbmV3UG9zaXRpb25NYXAuc2V0KGMsIGdldFBvc2l0aW9uKGMuZWwpKTtcbn1cbmZ1bmN0aW9uIGFwcGx5VHJhbnNsYXRpb24oYykge1xuICBjb25zdCBvbGRQb3MgPSBwb3NpdGlvbk1hcC5nZXQoYyk7XG4gIGNvbnN0IG5ld1BvcyA9IG5ld1Bvc2l0aW9uTWFwLmdldChjKTtcbiAgY29uc3QgZHggPSBvbGRQb3MubGVmdCAtIG5ld1Bvcy5sZWZ0O1xuICBjb25zdCBkeSA9IG9sZFBvcy50b3AgLSBuZXdQb3MudG9wO1xuICBpZiAoZHggfHwgZHkpIHtcbiAgICBjb25zdCBlbCA9IGMuZWw7XG4gICAgY29uc3QgcyA9IGVsLnN0eWxlO1xuICAgIGNvbnN0IHJlY3QgPSBlbC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcbiAgICBsZXQgc2NhbGVYID0gMTtcbiAgICBsZXQgc2NhbGVZID0gMTtcbiAgICBpZiAoZWwub2Zmc2V0V2lkdGgpIHNjYWxlWCA9IHJlY3Qud2lkdGggLyBlbC5vZmZzZXRXaWR0aDtcbiAgICBpZiAoZWwub2Zmc2V0SGVpZ2h0KSBzY2FsZVkgPSByZWN0LmhlaWdodCAvIGVsLm9mZnNldEhlaWdodDtcbiAgICBpZiAoIU51bWJlci5pc0Zpbml0ZShzY2FsZVgpIHx8IHNjYWxlWCA9PT0gMCkgc2NhbGVYID0gMTtcbiAgICBpZiAoIU51bWJlci5pc0Zpbml0ZShzY2FsZVkpIHx8IHNjYWxlWSA9PT0gMCkgc2NhbGVZID0gMTtcbiAgICBpZiAoTWF0aC5hYnMoc2NhbGVYIC0gMSkgPCAwLjAxKSBzY2FsZVggPSAxO1xuICAgIGlmIChNYXRoLmFicyhzY2FsZVkgLSAxKSA8IDAuMDEpIHNjYWxlWSA9IDE7XG4gICAgcy50cmFuc2Zvcm0gPSBzLndlYmtpdFRyYW5zZm9ybSA9IGB0cmFuc2xhdGUoJHtkeCAvIHNjYWxlWH1weCwke2R5IC8gc2NhbGVZfXB4KWA7XG4gICAgcy50cmFuc2l0aW9uRHVyYXRpb24gPSBcIjBzXCI7XG4gICAgcmV0dXJuIGM7XG4gIH1cbn1cbmZ1bmN0aW9uIGdldFBvc2l0aW9uKGVsKSB7XG4gIGNvbnN0IHJlY3QgPSBlbC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcbiAgcmV0dXJuIHtcbiAgICBsZWZ0OiByZWN0LmxlZnQsXG4gICAgdG9wOiByZWN0LnRvcFxuICB9O1xufVxuZnVuY3Rpb24gaGFzQ1NTVHJhbnNmb3JtKGVsLCByb290LCBtb3ZlQ2xhc3MpIHtcbiAgY29uc3QgY2xvbmUgPSBlbC5jbG9uZU5vZGUoKTtcbiAgY29uc3QgX3Z0YyA9IGVsW3Z0Y0tleV07XG4gIGlmIChfdnRjKSB7XG4gICAgX3Z0Yy5mb3JFYWNoKChjbHMpID0+IHtcbiAgICAgIGNscy5zcGxpdCgvXFxzKy8pLmZvckVhY2goKGMpID0+IGMgJiYgY2xvbmUuY2xhc3NMaXN0LnJlbW92ZShjKSk7XG4gICAgfSk7XG4gIH1cbiAgbW92ZUNsYXNzLnNwbGl0KC9cXHMrLykuZm9yRWFjaCgoYykgPT4gYyAmJiBjbG9uZS5jbGFzc0xpc3QuYWRkKGMpKTtcbiAgY2xvbmUuc3R5bGUuZGlzcGxheSA9IFwibm9uZVwiO1xuICBjb25zdCBjb250YWluZXIgPSByb290Lm5vZGVUeXBlID09PSAxID8gcm9vdCA6IHJvb3QucGFyZW50Tm9kZTtcbiAgY29udGFpbmVyLmFwcGVuZENoaWxkKGNsb25lKTtcbiAgY29uc3QgeyBoYXNUcmFuc2Zvcm0gfSA9IGdldFRyYW5zaXRpb25JbmZvKGNsb25lKTtcbiAgY29udGFpbmVyLnJlbW92ZUNoaWxkKGNsb25lKTtcbiAgcmV0dXJuIGhhc1RyYW5zZm9ybTtcbn1cblxuY29uc3QgZ2V0TW9kZWxBc3NpZ25lciA9ICh2bm9kZSkgPT4ge1xuICBjb25zdCBmbiA9IHZub2RlLnByb3BzW1wib25VcGRhdGU6bW9kZWxWYWx1ZVwiXSB8fCBmYWxzZTtcbiAgcmV0dXJuIGlzQXJyYXkoZm4pID8gKHZhbHVlKSA9PiBpbnZva2VBcnJheUZucyhmbiwgdmFsdWUpIDogZm47XG59O1xuZnVuY3Rpb24gb25Db21wb3NpdGlvblN0YXJ0KGUpIHtcbiAgZS50YXJnZXQuY29tcG9zaW5nID0gdHJ1ZTtcbn1cbmZ1bmN0aW9uIG9uQ29tcG9zaXRpb25FbmQoZSkge1xuICBjb25zdCB0YXJnZXQgPSBlLnRhcmdldDtcbiAgaWYgKHRhcmdldC5jb21wb3NpbmcpIHtcbiAgICB0YXJnZXQuY29tcG9zaW5nID0gZmFsc2U7XG4gICAgdGFyZ2V0LmRpc3BhdGNoRXZlbnQobmV3IEV2ZW50KFwiaW5wdXRcIikpO1xuICB9XG59XG5jb25zdCBhc3NpZ25LZXkgPSAvKiBAX19QVVJFX18gKi8gU3ltYm9sKFwiX2Fzc2lnblwiKTtcbmZ1bmN0aW9uIGNhc3RWYWx1ZSh2YWx1ZSwgdHJpbSwgbnVtYmVyKSB7XG4gIGlmICh0cmltKSB2YWx1ZSA9IHZhbHVlLnRyaW0oKTtcbiAgaWYgKG51bWJlcikgdmFsdWUgPSBsb29zZVRvTnVtYmVyKHZhbHVlKTtcbiAgcmV0dXJuIHZhbHVlO1xufVxuY29uc3Qgdk1vZGVsVGV4dCA9IHtcbiAgY3JlYXRlZChlbCwgeyBtb2RpZmllcnM6IHsgbGF6eSwgdHJpbSwgbnVtYmVyIH0gfSwgdm5vZGUpIHtcbiAgICBlbFthc3NpZ25LZXldID0gZ2V0TW9kZWxBc3NpZ25lcih2bm9kZSk7XG4gICAgY29uc3QgY2FzdFRvTnVtYmVyID0gbnVtYmVyIHx8IHZub2RlLnByb3BzICYmIHZub2RlLnByb3BzLnR5cGUgPT09IFwibnVtYmVyXCI7XG4gICAgYWRkRXZlbnRMaXN0ZW5lcihlbCwgbGF6eSA/IFwiY2hhbmdlXCIgOiBcImlucHV0XCIsIChlKSA9PiB7XG4gICAgICBpZiAoZS50YXJnZXQuY29tcG9zaW5nKSByZXR1cm47XG4gICAgICBlbFthc3NpZ25LZXldKGNhc3RWYWx1ZShlbC52YWx1ZSwgdHJpbSwgY2FzdFRvTnVtYmVyKSk7XG4gICAgfSk7XG4gICAgaWYgKHRyaW0gfHwgY2FzdFRvTnVtYmVyKSB7XG4gICAgICBhZGRFdmVudExpc3RlbmVyKGVsLCBcImNoYW5nZVwiLCAoKSA9PiB7XG4gICAgICAgIGVsLnZhbHVlID0gY2FzdFZhbHVlKGVsLnZhbHVlLCB0cmltLCBjYXN0VG9OdW1iZXIpO1xuICAgICAgfSk7XG4gICAgfVxuICAgIGlmICghbGF6eSkge1xuICAgICAgYWRkRXZlbnRMaXN0ZW5lcihlbCwgXCJjb21wb3NpdGlvbnN0YXJ0XCIsIG9uQ29tcG9zaXRpb25TdGFydCk7XG4gICAgICBhZGRFdmVudExpc3RlbmVyKGVsLCBcImNvbXBvc2l0aW9uZW5kXCIsIG9uQ29tcG9zaXRpb25FbmQpO1xuICAgICAgYWRkRXZlbnRMaXN0ZW5lcihlbCwgXCJjaGFuZ2VcIiwgb25Db21wb3NpdGlvbkVuZCk7XG4gICAgfVxuICB9LFxuICAvLyBzZXQgdmFsdWUgb24gbW91bnRlZCBzbyBpdCdzIGFmdGVyIG1pbi9tYXggZm9yIHR5cGU9XCJyYW5nZVwiXG4gIG1vdW50ZWQoZWwsIHsgdmFsdWUgfSkge1xuICAgIGVsLnZhbHVlID0gdmFsdWUgPT0gbnVsbCA/IFwiXCIgOiB2YWx1ZTtcbiAgfSxcbiAgYmVmb3JlVXBkYXRlKGVsLCB7IHZhbHVlLCBvbGRWYWx1ZSwgbW9kaWZpZXJzOiB7IGxhenksIHRyaW0sIG51bWJlciB9IH0sIHZub2RlKSB7XG4gICAgZWxbYXNzaWduS2V5XSA9IGdldE1vZGVsQXNzaWduZXIodm5vZGUpO1xuICAgIGlmIChlbC5jb21wb3NpbmcpIHJldHVybjtcbiAgICBjb25zdCBlbFZhbHVlID0gKG51bWJlciB8fCBlbC50eXBlID09PSBcIm51bWJlclwiKSAmJiAhL14wXFxkLy50ZXN0KGVsLnZhbHVlKSA/IGxvb3NlVG9OdW1iZXIoZWwudmFsdWUpIDogZWwudmFsdWU7XG4gICAgY29uc3QgbmV3VmFsdWUgPSB2YWx1ZSA9PSBudWxsID8gXCJcIiA6IHZhbHVlO1xuICAgIGlmIChlbFZhbHVlID09PSBuZXdWYWx1ZSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBpZiAoZG9jdW1lbnQuYWN0aXZlRWxlbWVudCA9PT0gZWwgJiYgZWwudHlwZSAhPT0gXCJyYW5nZVwiKSB7XG4gICAgICBpZiAobGF6eSAmJiB2YWx1ZSA9PT0gb2xkVmFsdWUpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgaWYgKHRyaW0gJiYgZWwudmFsdWUudHJpbSgpID09PSBuZXdWYWx1ZSkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgfVxuICAgIGVsLnZhbHVlID0gbmV3VmFsdWU7XG4gIH1cbn07XG5jb25zdCB2TW9kZWxDaGVja2JveCA9IHtcbiAgLy8gIzQwOTYgYXJyYXkgY2hlY2tib3hlcyBuZWVkIHRvIGJlIGRlZXAgdHJhdmVyc2VkXG4gIGRlZXA6IHRydWUsXG4gIGNyZWF0ZWQoZWwsIF8sIHZub2RlKSB7XG4gICAgZWxbYXNzaWduS2V5XSA9IGdldE1vZGVsQXNzaWduZXIodm5vZGUpO1xuICAgIGFkZEV2ZW50TGlzdGVuZXIoZWwsIFwiY2hhbmdlXCIsICgpID0+IHtcbiAgICAgIGNvbnN0IG1vZGVsVmFsdWUgPSBlbC5fbW9kZWxWYWx1ZTtcbiAgICAgIGNvbnN0IGVsZW1lbnRWYWx1ZSA9IGdldFZhbHVlKGVsKTtcbiAgICAgIGNvbnN0IGNoZWNrZWQgPSBlbC5jaGVja2VkO1xuICAgICAgY29uc3QgYXNzaWduID0gZWxbYXNzaWduS2V5XTtcbiAgICAgIGlmIChpc0FycmF5KG1vZGVsVmFsdWUpKSB7XG4gICAgICAgIGNvbnN0IGluZGV4ID0gbG9vc2VJbmRleE9mKG1vZGVsVmFsdWUsIGVsZW1lbnRWYWx1ZSk7XG4gICAgICAgIGNvbnN0IGZvdW5kID0gaW5kZXggIT09IC0xO1xuICAgICAgICBpZiAoY2hlY2tlZCAmJiAhZm91bmQpIHtcbiAgICAgICAgICBhc3NpZ24obW9kZWxWYWx1ZS5jb25jYXQoZWxlbWVudFZhbHVlKSk7XG4gICAgICAgIH0gZWxzZSBpZiAoIWNoZWNrZWQgJiYgZm91bmQpIHtcbiAgICAgICAgICBjb25zdCBmaWx0ZXJlZCA9IFsuLi5tb2RlbFZhbHVlXTtcbiAgICAgICAgICBmaWx0ZXJlZC5zcGxpY2UoaW5kZXgsIDEpO1xuICAgICAgICAgIGFzc2lnbihmaWx0ZXJlZCk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSBpZiAoaXNTZXQobW9kZWxWYWx1ZSkpIHtcbiAgICAgICAgY29uc3QgY2xvbmVkID0gbmV3IFNldChtb2RlbFZhbHVlKTtcbiAgICAgICAgaWYgKGNoZWNrZWQpIHtcbiAgICAgICAgICBjbG9uZWQuYWRkKGVsZW1lbnRWYWx1ZSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgY2xvbmVkLmRlbGV0ZShlbGVtZW50VmFsdWUpO1xuICAgICAgICB9XG4gICAgICAgIGFzc2lnbihjbG9uZWQpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgYXNzaWduKGdldENoZWNrYm94VmFsdWUoZWwsIGNoZWNrZWQpKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfSxcbiAgLy8gc2V0IGluaXRpYWwgY2hlY2tlZCBvbiBtb3VudCB0byB3YWl0IGZvciB0cnVlLXZhbHVlL2ZhbHNlLXZhbHVlXG4gIG1vdW50ZWQ6IHNldENoZWNrZWQsXG4gIGJlZm9yZVVwZGF0ZShlbCwgYmluZGluZywgdm5vZGUpIHtcbiAgICBlbFthc3NpZ25LZXldID0gZ2V0TW9kZWxBc3NpZ25lcih2bm9kZSk7XG4gICAgc2V0Q2hlY2tlZChlbCwgYmluZGluZywgdm5vZGUpO1xuICB9XG59O1xuZnVuY3Rpb24gc2V0Q2hlY2tlZChlbCwgeyB2YWx1ZSwgb2xkVmFsdWUgfSwgdm5vZGUpIHtcbiAgZWwuX21vZGVsVmFsdWUgPSB2YWx1ZTtcbiAgbGV0IGNoZWNrZWQ7XG4gIGlmIChpc0FycmF5KHZhbHVlKSkge1xuICAgIGNoZWNrZWQgPSBsb29zZUluZGV4T2YodmFsdWUsIHZub2RlLnByb3BzLnZhbHVlKSA+IC0xO1xuICB9IGVsc2UgaWYgKGlzU2V0KHZhbHVlKSkge1xuICAgIGNoZWNrZWQgPSB2YWx1ZS5oYXModm5vZGUucHJvcHMudmFsdWUpO1xuICB9IGVsc2Uge1xuICAgIGlmICh2YWx1ZSA9PT0gb2xkVmFsdWUpIHJldHVybjtcbiAgICBjaGVja2VkID0gbG9vc2VFcXVhbCh2YWx1ZSwgZ2V0Q2hlY2tib3hWYWx1ZShlbCwgdHJ1ZSkpO1xuICB9XG4gIGlmIChlbC5jaGVja2VkICE9PSBjaGVja2VkKSB7XG4gICAgZWwuY2hlY2tlZCA9IGNoZWNrZWQ7XG4gIH1cbn1cbmNvbnN0IHZNb2RlbFJhZGlvID0ge1xuICBjcmVhdGVkKGVsLCB7IHZhbHVlIH0sIHZub2RlKSB7XG4gICAgZWwuY2hlY2tlZCA9IGxvb3NlRXF1YWwodmFsdWUsIHZub2RlLnByb3BzLnZhbHVlKTtcbiAgICBlbFthc3NpZ25LZXldID0gZ2V0TW9kZWxBc3NpZ25lcih2bm9kZSk7XG4gICAgYWRkRXZlbnRMaXN0ZW5lcihlbCwgXCJjaGFuZ2VcIiwgKCkgPT4ge1xuICAgICAgZWxbYXNzaWduS2V5XShnZXRWYWx1ZShlbCkpO1xuICAgIH0pO1xuICB9LFxuICBiZWZvcmVVcGRhdGUoZWwsIHsgdmFsdWUsIG9sZFZhbHVlIH0sIHZub2RlKSB7XG4gICAgZWxbYXNzaWduS2V5XSA9IGdldE1vZGVsQXNzaWduZXIodm5vZGUpO1xuICAgIGlmICh2YWx1ZSAhPT0gb2xkVmFsdWUpIHtcbiAgICAgIGVsLmNoZWNrZWQgPSBsb29zZUVxdWFsKHZhbHVlLCB2bm9kZS5wcm9wcy52YWx1ZSk7XG4gICAgfVxuICB9XG59O1xuY29uc3Qgdk1vZGVsU2VsZWN0ID0ge1xuICAvLyA8c2VsZWN0IG11bHRpcGxlPiB2YWx1ZSBuZWVkIHRvIGJlIGRlZXAgdHJhdmVyc2VkXG4gIGRlZXA6IHRydWUsXG4gIGNyZWF0ZWQoZWwsIHsgdmFsdWUsIG1vZGlmaWVyczogeyBudW1iZXIgfSB9LCB2bm9kZSkge1xuICAgIGNvbnN0IGlzU2V0TW9kZWwgPSBpc1NldCh2YWx1ZSk7XG4gICAgYWRkRXZlbnRMaXN0ZW5lcihlbCwgXCJjaGFuZ2VcIiwgKCkgPT4ge1xuICAgICAgY29uc3Qgc2VsZWN0ZWRWYWwgPSBBcnJheS5wcm90b3R5cGUuZmlsdGVyLmNhbGwoZWwub3B0aW9ucywgKG8pID0+IG8uc2VsZWN0ZWQpLm1hcChcbiAgICAgICAgKG8pID0+IG51bWJlciA/IGxvb3NlVG9OdW1iZXIoZ2V0VmFsdWUobykpIDogZ2V0VmFsdWUobylcbiAgICAgICk7XG4gICAgICBlbFthc3NpZ25LZXldKFxuICAgICAgICBlbC5tdWx0aXBsZSA/IGlzU2V0TW9kZWwgPyBuZXcgU2V0KHNlbGVjdGVkVmFsKSA6IHNlbGVjdGVkVmFsIDogc2VsZWN0ZWRWYWxbMF1cbiAgICAgICk7XG4gICAgICBlbC5fYXNzaWduaW5nID0gdHJ1ZTtcbiAgICAgIG5leHRUaWNrKCgpID0+IHtcbiAgICAgICAgZWwuX2Fzc2lnbmluZyA9IGZhbHNlO1xuICAgICAgfSk7XG4gICAgfSk7XG4gICAgZWxbYXNzaWduS2V5XSA9IGdldE1vZGVsQXNzaWduZXIodm5vZGUpO1xuICB9LFxuICAvLyBzZXQgdmFsdWUgaW4gbW91bnRlZCAmIHVwZGF0ZWQgYmVjYXVzZSA8c2VsZWN0PiByZWxpZXMgb24gaXRzIGNoaWxkcmVuXG4gIC8vIDxvcHRpb24+cy5cbiAgbW91bnRlZChlbCwgeyB2YWx1ZSB9KSB7XG4gICAgc2V0U2VsZWN0ZWQoZWwsIHZhbHVlKTtcbiAgfSxcbiAgYmVmb3JlVXBkYXRlKGVsLCBfYmluZGluZywgdm5vZGUpIHtcbiAgICBlbFthc3NpZ25LZXldID0gZ2V0TW9kZWxBc3NpZ25lcih2bm9kZSk7XG4gIH0sXG4gIHVwZGF0ZWQoZWwsIHsgdmFsdWUgfSkge1xuICAgIGlmICghZWwuX2Fzc2lnbmluZykge1xuICAgICAgc2V0U2VsZWN0ZWQoZWwsIHZhbHVlKTtcbiAgICB9XG4gIH1cbn07XG5mdW5jdGlvbiBzZXRTZWxlY3RlZChlbCwgdmFsdWUpIHtcbiAgY29uc3QgaXNNdWx0aXBsZSA9IGVsLm11bHRpcGxlO1xuICBjb25zdCBpc0FycmF5VmFsdWUgPSBpc0FycmF5KHZhbHVlKTtcbiAgaWYgKGlzTXVsdGlwbGUgJiYgIWlzQXJyYXlWYWx1ZSAmJiAhaXNTZXQodmFsdWUpKSB7XG4gICAgISEocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09IFwicHJvZHVjdGlvblwiKSAmJiB3YXJuKFxuICAgICAgYDxzZWxlY3QgbXVsdGlwbGUgdi1tb2RlbD4gZXhwZWN0cyBhbiBBcnJheSBvciBTZXQgdmFsdWUgZm9yIGl0cyBiaW5kaW5nLCBidXQgZ290ICR7T2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHZhbHVlKS5zbGljZSg4LCAtMSl9LmBcbiAgICApO1xuICAgIHJldHVybjtcbiAgfVxuICBmb3IgKGxldCBpID0gMCwgbCA9IGVsLm9wdGlvbnMubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgY29uc3Qgb3B0aW9uID0gZWwub3B0aW9uc1tpXTtcbiAgICBjb25zdCBvcHRpb25WYWx1ZSA9IGdldFZhbHVlKG9wdGlvbik7XG4gICAgaWYgKGlzTXVsdGlwbGUpIHtcbiAgICAgIGlmIChpc0FycmF5VmFsdWUpIHtcbiAgICAgICAgY29uc3Qgb3B0aW9uVHlwZSA9IHR5cGVvZiBvcHRpb25WYWx1ZTtcbiAgICAgICAgaWYgKG9wdGlvblR5cGUgPT09IFwic3RyaW5nXCIgfHwgb3B0aW9uVHlwZSA9PT0gXCJudW1iZXJcIikge1xuICAgICAgICAgIG9wdGlvbi5zZWxlY3RlZCA9IHZhbHVlLnNvbWUoKHYpID0+IFN0cmluZyh2KSA9PT0gU3RyaW5nKG9wdGlvblZhbHVlKSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgb3B0aW9uLnNlbGVjdGVkID0gbG9vc2VJbmRleE9mKHZhbHVlLCBvcHRpb25WYWx1ZSkgPiAtMTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgb3B0aW9uLnNlbGVjdGVkID0gdmFsdWUuaGFzKG9wdGlvblZhbHVlKTtcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKGxvb3NlRXF1YWwoZ2V0VmFsdWUob3B0aW9uKSwgdmFsdWUpKSB7XG4gICAgICBpZiAoZWwuc2VsZWN0ZWRJbmRleCAhPT0gaSkgZWwuc2VsZWN0ZWRJbmRleCA9IGk7XG4gICAgICByZXR1cm47XG4gICAgfVxuICB9XG4gIGlmICghaXNNdWx0aXBsZSAmJiBlbC5zZWxlY3RlZEluZGV4ICE9PSAtMSkge1xuICAgIGVsLnNlbGVjdGVkSW5kZXggPSAtMTtcbiAgfVxufVxuZnVuY3Rpb24gZ2V0VmFsdWUoZWwpIHtcbiAgcmV0dXJuIFwiX3ZhbHVlXCIgaW4gZWwgPyBlbC5fdmFsdWUgOiBlbC52YWx1ZTtcbn1cbmZ1bmN0aW9uIGdldENoZWNrYm94VmFsdWUoZWwsIGNoZWNrZWQpIHtcbiAgY29uc3Qga2V5ID0gY2hlY2tlZCA/IFwiX3RydWVWYWx1ZVwiIDogXCJfZmFsc2VWYWx1ZVwiO1xuICByZXR1cm4ga2V5IGluIGVsID8gZWxba2V5XSA6IGNoZWNrZWQ7XG59XG5jb25zdCB2TW9kZWxEeW5hbWljID0ge1xuICBjcmVhdGVkKGVsLCBiaW5kaW5nLCB2bm9kZSkge1xuICAgIGNhbGxNb2RlbEhvb2soZWwsIGJpbmRpbmcsIHZub2RlLCBudWxsLCBcImNyZWF0ZWRcIik7XG4gIH0sXG4gIG1vdW50ZWQoZWwsIGJpbmRpbmcsIHZub2RlKSB7XG4gICAgY2FsbE1vZGVsSG9vayhlbCwgYmluZGluZywgdm5vZGUsIG51bGwsIFwibW91bnRlZFwiKTtcbiAgfSxcbiAgYmVmb3JlVXBkYXRlKGVsLCBiaW5kaW5nLCB2bm9kZSwgcHJldlZOb2RlKSB7XG4gICAgY2FsbE1vZGVsSG9vayhlbCwgYmluZGluZywgdm5vZGUsIHByZXZWTm9kZSwgXCJiZWZvcmVVcGRhdGVcIik7XG4gIH0sXG4gIHVwZGF0ZWQoZWwsIGJpbmRpbmcsIHZub2RlLCBwcmV2Vk5vZGUpIHtcbiAgICBjYWxsTW9kZWxIb29rKGVsLCBiaW5kaW5nLCB2bm9kZSwgcHJldlZOb2RlLCBcInVwZGF0ZWRcIik7XG4gIH1cbn07XG5mdW5jdGlvbiByZXNvbHZlRHluYW1pY01vZGVsKHRhZ05hbWUsIHR5cGUpIHtcbiAgc3dpdGNoICh0YWdOYW1lKSB7XG4gICAgY2FzZSBcIlNFTEVDVFwiOlxuICAgICAgcmV0dXJuIHZNb2RlbFNlbGVjdDtcbiAgICBjYXNlIFwiVEVYVEFSRUFcIjpcbiAgICAgIHJldHVybiB2TW9kZWxUZXh0O1xuICAgIGRlZmF1bHQ6XG4gICAgICBzd2l0Y2ggKHR5cGUpIHtcbiAgICAgICAgY2FzZSBcImNoZWNrYm94XCI6XG4gICAgICAgICAgcmV0dXJuIHZNb2RlbENoZWNrYm94O1xuICAgICAgICBjYXNlIFwicmFkaW9cIjpcbiAgICAgICAgICByZXR1cm4gdk1vZGVsUmFkaW87XG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgcmV0dXJuIHZNb2RlbFRleHQ7XG4gICAgICB9XG4gIH1cbn1cbmZ1bmN0aW9uIGNhbGxNb2RlbEhvb2soZWwsIGJpbmRpbmcsIHZub2RlLCBwcmV2Vk5vZGUsIGhvb2spIHtcbiAgY29uc3QgbW9kZWxUb1VzZSA9IHJlc29sdmVEeW5hbWljTW9kZWwoXG4gICAgZWwudGFnTmFtZSxcbiAgICB2bm9kZS5wcm9wcyAmJiB2bm9kZS5wcm9wcy50eXBlXG4gICk7XG4gIGNvbnN0IGZuID0gbW9kZWxUb1VzZVtob29rXTtcbiAgZm4gJiYgZm4oZWwsIGJpbmRpbmcsIHZub2RlLCBwcmV2Vk5vZGUpO1xufVxuZnVuY3Rpb24gaW5pdFZNb2RlbEZvclNTUigpIHtcbiAgdk1vZGVsVGV4dC5nZXRTU1JQcm9wcyA9ICh7IHZhbHVlIH0pID0+ICh7IHZhbHVlIH0pO1xuICB2TW9kZWxSYWRpby5nZXRTU1JQcm9wcyA9ICh7IHZhbHVlIH0sIHZub2RlKSA9PiB7XG4gICAgaWYgKHZub2RlLnByb3BzICYmIGxvb3NlRXF1YWwodm5vZGUucHJvcHMudmFsdWUsIHZhbHVlKSkge1xuICAgICAgcmV0dXJuIHsgY2hlY2tlZDogdHJ1ZSB9O1xuICAgIH1cbiAgfTtcbiAgdk1vZGVsQ2hlY2tib3guZ2V0U1NSUHJvcHMgPSAoeyB2YWx1ZSB9LCB2bm9kZSkgPT4ge1xuICAgIGlmIChpc0FycmF5KHZhbHVlKSkge1xuICAgICAgaWYgKHZub2RlLnByb3BzICYmIGxvb3NlSW5kZXhPZih2YWx1ZSwgdm5vZGUucHJvcHMudmFsdWUpID4gLTEpIHtcbiAgICAgICAgcmV0dXJuIHsgY2hlY2tlZDogdHJ1ZSB9O1xuICAgICAgfVxuICAgIH0gZWxzZSBpZiAoaXNTZXQodmFsdWUpKSB7XG4gICAgICBpZiAodm5vZGUucHJvcHMgJiYgdmFsdWUuaGFzKHZub2RlLnByb3BzLnZhbHVlKSkge1xuICAgICAgICByZXR1cm4geyBjaGVja2VkOiB0cnVlIH07XG4gICAgICB9XG4gICAgfSBlbHNlIGlmICh2YWx1ZSkge1xuICAgICAgcmV0dXJuIHsgY2hlY2tlZDogdHJ1ZSB9O1xuICAgIH1cbiAgfTtcbiAgdk1vZGVsRHluYW1pYy5nZXRTU1JQcm9wcyA9IChiaW5kaW5nLCB2bm9kZSkgPT4ge1xuICAgIGlmICh0eXBlb2Ygdm5vZGUudHlwZSAhPT0gXCJzdHJpbmdcIikge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBjb25zdCBtb2RlbFRvVXNlID0gcmVzb2x2ZUR5bmFtaWNNb2RlbChcbiAgICAgIC8vIHJlc29sdmVEeW5hbWljTW9kZWwgZXhwZWN0cyBhbiB1cHBlcmNhc2UgdGFnIG5hbWUsIGJ1dCB2bm9kZS50eXBlIGlzIGxvd2VyY2FzZVxuICAgICAgdm5vZGUudHlwZS50b1VwcGVyQ2FzZSgpLFxuICAgICAgdm5vZGUucHJvcHMgJiYgdm5vZGUucHJvcHMudHlwZVxuICAgICk7XG4gICAgaWYgKG1vZGVsVG9Vc2UuZ2V0U1NSUHJvcHMpIHtcbiAgICAgIHJldHVybiBtb2RlbFRvVXNlLmdldFNTUlByb3BzKGJpbmRpbmcsIHZub2RlKTtcbiAgICB9XG4gIH07XG59XG5cbmNvbnN0IHN5c3RlbU1vZGlmaWVycyA9IFtcImN0cmxcIiwgXCJzaGlmdFwiLCBcImFsdFwiLCBcIm1ldGFcIl07XG5jb25zdCBtb2RpZmllckd1YXJkcyA9IHtcbiAgc3RvcDogKGUpID0+IGUuc3RvcFByb3BhZ2F0aW9uKCksXG4gIHByZXZlbnQ6IChlKSA9PiBlLnByZXZlbnREZWZhdWx0KCksXG4gIHNlbGY6IChlKSA9PiBlLnRhcmdldCAhPT0gZS5jdXJyZW50VGFyZ2V0LFxuICBjdHJsOiAoZSkgPT4gIWUuY3RybEtleSxcbiAgc2hpZnQ6IChlKSA9PiAhZS5zaGlmdEtleSxcbiAgYWx0OiAoZSkgPT4gIWUuYWx0S2V5LFxuICBtZXRhOiAoZSkgPT4gIWUubWV0YUtleSxcbiAgbGVmdDogKGUpID0+IFwiYnV0dG9uXCIgaW4gZSAmJiBlLmJ1dHRvbiAhPT0gMCxcbiAgbWlkZGxlOiAoZSkgPT4gXCJidXR0b25cIiBpbiBlICYmIGUuYnV0dG9uICE9PSAxLFxuICByaWdodDogKGUpID0+IFwiYnV0dG9uXCIgaW4gZSAmJiBlLmJ1dHRvbiAhPT0gMixcbiAgZXhhY3Q6IChlLCBtb2RpZmllcnMpID0+IHN5c3RlbU1vZGlmaWVycy5zb21lKChtKSA9PiBlW2Ake219S2V5YF0gJiYgIW1vZGlmaWVycy5pbmNsdWRlcyhtKSlcbn07XG5jb25zdCB3aXRoTW9kaWZpZXJzID0gKGZuLCBtb2RpZmllcnMpID0+IHtcbiAgaWYgKCFmbikgcmV0dXJuIGZuO1xuICBjb25zdCBjYWNoZSA9IGZuLl93aXRoTW9kcyB8fCAoZm4uX3dpdGhNb2RzID0ge30pO1xuICBjb25zdCBjYWNoZUtleSA9IG1vZGlmaWVycy5qb2luKFwiLlwiKTtcbiAgcmV0dXJuIGNhY2hlW2NhY2hlS2V5XSB8fCAoY2FjaGVbY2FjaGVLZXldID0gKChldmVudCwgLi4uYXJncykgPT4ge1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbW9kaWZpZXJzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBjb25zdCBndWFyZCA9IG1vZGlmaWVyR3VhcmRzW21vZGlmaWVyc1tpXV07XG4gICAgICBpZiAoZ3VhcmQgJiYgZ3VhcmQoZXZlbnQsIG1vZGlmaWVycykpIHJldHVybjtcbiAgICB9XG4gICAgcmV0dXJuIGZuKGV2ZW50LCAuLi5hcmdzKTtcbiAgfSkpO1xufTtcbmNvbnN0IGtleU5hbWVzID0ge1xuICBlc2M6IFwiZXNjYXBlXCIsXG4gIHNwYWNlOiBcIiBcIixcbiAgdXA6IFwiYXJyb3ctdXBcIixcbiAgbGVmdDogXCJhcnJvdy1sZWZ0XCIsXG4gIHJpZ2h0OiBcImFycm93LXJpZ2h0XCIsXG4gIGRvd246IFwiYXJyb3ctZG93blwiLFxuICBkZWxldGU6IFwiYmFja3NwYWNlXCJcbn07XG5jb25zdCB3aXRoS2V5cyA9IChmbiwgbW9kaWZpZXJzKSA9PiB7XG4gIGNvbnN0IGNhY2hlID0gZm4uX3dpdGhLZXlzIHx8IChmbi5fd2l0aEtleXMgPSB7fSk7XG4gIGNvbnN0IGNhY2hlS2V5ID0gbW9kaWZpZXJzLmpvaW4oXCIuXCIpO1xuICByZXR1cm4gY2FjaGVbY2FjaGVLZXldIHx8IChjYWNoZVtjYWNoZUtleV0gPSAoKGV2ZW50KSA9PiB7XG4gICAgaWYgKCEoXCJrZXlcIiBpbiBldmVudCkpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgY29uc3QgZXZlbnRLZXkgPSBoeXBoZW5hdGUoZXZlbnQua2V5KTtcbiAgICBpZiAobW9kaWZpZXJzLnNvbWUoXG4gICAgICAoaykgPT4gayA9PT0gZXZlbnRLZXkgfHwga2V5TmFtZXNba10gPT09IGV2ZW50S2V5XG4gICAgKSkge1xuICAgICAgcmV0dXJuIGZuKGV2ZW50KTtcbiAgICB9XG4gIH0pKTtcbn07XG5cbmNvbnN0IHJlbmRlcmVyT3B0aW9ucyA9IC8qIEBfX1BVUkVfXyAqLyBleHRlbmQoeyBwYXRjaFByb3AgfSwgbm9kZU9wcyk7XG5sZXQgcmVuZGVyZXI7XG5sZXQgZW5hYmxlZEh5ZHJhdGlvbiA9IGZhbHNlO1xuZnVuY3Rpb24gZW5zdXJlUmVuZGVyZXIoKSB7XG4gIHJldHVybiByZW5kZXJlciB8fCAocmVuZGVyZXIgPSBjcmVhdGVSZW5kZXJlcihyZW5kZXJlck9wdGlvbnMpKTtcbn1cbmZ1bmN0aW9uIGVuc3VyZUh5ZHJhdGlvblJlbmRlcmVyKCkge1xuICByZW5kZXJlciA9IGVuYWJsZWRIeWRyYXRpb24gPyByZW5kZXJlciA6IGNyZWF0ZUh5ZHJhdGlvblJlbmRlcmVyKHJlbmRlcmVyT3B0aW9ucyk7XG4gIGVuYWJsZWRIeWRyYXRpb24gPSB0cnVlO1xuICByZXR1cm4gcmVuZGVyZXI7XG59XG5jb25zdCByZW5kZXIgPSAoKC4uLmFyZ3MpID0+IHtcbiAgZW5zdXJlUmVuZGVyZXIoKS5yZW5kZXIoLi4uYXJncyk7XG59KTtcbmNvbnN0IGh5ZHJhdGUgPSAoKC4uLmFyZ3MpID0+IHtcbiAgZW5zdXJlSHlkcmF0aW9uUmVuZGVyZXIoKS5oeWRyYXRlKC4uLmFyZ3MpO1xufSk7XG5jb25zdCBjcmVhdGVBcHAgPSAoKC4uLmFyZ3MpID0+IHtcbiAgY29uc3QgYXBwID0gZW5zdXJlUmVuZGVyZXIoKS5jcmVhdGVBcHAoLi4uYXJncyk7XG4gIGlmICghIShwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gXCJwcm9kdWN0aW9uXCIpKSB7XG4gICAgaW5qZWN0TmF0aXZlVGFnQ2hlY2soYXBwKTtcbiAgICBpbmplY3RDb21waWxlck9wdGlvbnNDaGVjayhhcHApO1xuICB9XG4gIGNvbnN0IHsgbW91bnQgfSA9IGFwcDtcbiAgYXBwLm1vdW50ID0gKGNvbnRhaW5lck9yU2VsZWN0b3IpID0+IHtcbiAgICBjb25zdCBjb250YWluZXIgPSBub3JtYWxpemVDb250YWluZXIoY29udGFpbmVyT3JTZWxlY3Rvcik7XG4gICAgaWYgKCFjb250YWluZXIpIHJldHVybjtcbiAgICBjb25zdCBjb21wb25lbnQgPSBhcHAuX2NvbXBvbmVudDtcbiAgICBpZiAoIWlzRnVuY3Rpb24oY29tcG9uZW50KSAmJiAhY29tcG9uZW50LnJlbmRlciAmJiAhY29tcG9uZW50LnRlbXBsYXRlKSB7XG4gICAgICBjb21wb25lbnQudGVtcGxhdGUgPSBjb250YWluZXIuaW5uZXJIVE1MO1xuICAgIH1cbiAgICBpZiAoY29udGFpbmVyLm5vZGVUeXBlID09PSAxKSB7XG4gICAgICBjb250YWluZXIudGV4dENvbnRlbnQgPSBcIlwiO1xuICAgIH1cbiAgICBjb25zdCBwcm94eSA9IG1vdW50KGNvbnRhaW5lciwgZmFsc2UsIHJlc29sdmVSb290TmFtZXNwYWNlKGNvbnRhaW5lcikpO1xuICAgIGlmIChjb250YWluZXIgaW5zdGFuY2VvZiBFbGVtZW50KSB7XG4gICAgICBjb250YWluZXIucmVtb3ZlQXR0cmlidXRlKFwidi1jbG9ha1wiKTtcbiAgICAgIGNvbnRhaW5lci5zZXRBdHRyaWJ1dGUoXCJkYXRhLXYtYXBwXCIsIFwiXCIpO1xuICAgIH1cbiAgICByZXR1cm4gcHJveHk7XG4gIH07XG4gIHJldHVybiBhcHA7XG59KTtcbmNvbnN0IGNyZWF0ZVNTUkFwcCA9ICgoLi4uYXJncykgPT4ge1xuICBjb25zdCBhcHAgPSBlbnN1cmVIeWRyYXRpb25SZW5kZXJlcigpLmNyZWF0ZUFwcCguLi5hcmdzKTtcbiAgaWYgKCEhKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSBcInByb2R1Y3Rpb25cIikpIHtcbiAgICBpbmplY3ROYXRpdmVUYWdDaGVjayhhcHApO1xuICAgIGluamVjdENvbXBpbGVyT3B0aW9uc0NoZWNrKGFwcCk7XG4gIH1cbiAgY29uc3QgeyBtb3VudCB9ID0gYXBwO1xuICBhcHAubW91bnQgPSAoY29udGFpbmVyT3JTZWxlY3RvcikgPT4ge1xuICAgIGNvbnN0IGNvbnRhaW5lciA9IG5vcm1hbGl6ZUNvbnRhaW5lcihjb250YWluZXJPclNlbGVjdG9yKTtcbiAgICBpZiAoY29udGFpbmVyKSB7XG4gICAgICByZXR1cm4gbW91bnQoY29udGFpbmVyLCB0cnVlLCByZXNvbHZlUm9vdE5hbWVzcGFjZShjb250YWluZXIpKTtcbiAgICB9XG4gIH07XG4gIHJldHVybiBhcHA7XG59KTtcbmZ1bmN0aW9uIHJlc29sdmVSb290TmFtZXNwYWNlKGNvbnRhaW5lcikge1xuICBpZiAoY29udGFpbmVyIGluc3RhbmNlb2YgU1ZHRWxlbWVudCkge1xuICAgIHJldHVybiBcInN2Z1wiO1xuICB9XG4gIGlmICh0eXBlb2YgTWF0aE1MRWxlbWVudCA9PT0gXCJmdW5jdGlvblwiICYmIGNvbnRhaW5lciBpbnN0YW5jZW9mIE1hdGhNTEVsZW1lbnQpIHtcbiAgICByZXR1cm4gXCJtYXRobWxcIjtcbiAgfVxufVxuZnVuY3Rpb24gaW5qZWN0TmF0aXZlVGFnQ2hlY2soYXBwKSB7XG4gIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShhcHAuY29uZmlnLCBcImlzTmF0aXZlVGFnXCIsIHtcbiAgICB2YWx1ZTogKHRhZykgPT4gaXNIVE1MVGFnKHRhZykgfHwgaXNTVkdUYWcodGFnKSB8fCBpc01hdGhNTFRhZyh0YWcpLFxuICAgIHdyaXRhYmxlOiBmYWxzZVxuICB9KTtcbn1cbmZ1bmN0aW9uIGluamVjdENvbXBpbGVyT3B0aW9uc0NoZWNrKGFwcCkge1xuICBpZiAoaXNSdW50aW1lT25seSgpKSB7XG4gICAgY29uc3QgaXNDdXN0b21FbGVtZW50ID0gYXBwLmNvbmZpZy5pc0N1c3RvbUVsZW1lbnQ7XG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KGFwcC5jb25maWcsIFwiaXNDdXN0b21FbGVtZW50XCIsIHtcbiAgICAgIGdldCgpIHtcbiAgICAgICAgcmV0dXJuIGlzQ3VzdG9tRWxlbWVudDtcbiAgICAgIH0sXG4gICAgICBzZXQoKSB7XG4gICAgICAgIHdhcm4oXG4gICAgICAgICAgYFRoZSBcXGBpc0N1c3RvbUVsZW1lbnRcXGAgY29uZmlnIG9wdGlvbiBpcyBkZXByZWNhdGVkLiBVc2UgXFxgY29tcGlsZXJPcHRpb25zLmlzQ3VzdG9tRWxlbWVudFxcYCBpbnN0ZWFkLmBcbiAgICAgICAgKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICBjb25zdCBjb21waWxlck9wdGlvbnMgPSBhcHAuY29uZmlnLmNvbXBpbGVyT3B0aW9ucztcbiAgICBjb25zdCBtc2cgPSBgVGhlIFxcYGNvbXBpbGVyT3B0aW9uc1xcYCBjb25maWcgb3B0aW9uIGlzIG9ubHkgcmVzcGVjdGVkIHdoZW4gdXNpbmcgYSBidWlsZCBvZiBWdWUuanMgdGhhdCBpbmNsdWRlcyB0aGUgcnVudGltZSBjb21waWxlciAoYWthIFwiZnVsbCBidWlsZFwiKS4gU2luY2UgeW91IGFyZSB1c2luZyB0aGUgcnVudGltZS1vbmx5IGJ1aWxkLCBcXGBjb21waWxlck9wdGlvbnNcXGAgbXVzdCBiZSBwYXNzZWQgdG8gXFxgQHZ1ZS9jb21waWxlci1kb21cXGAgaW4gdGhlIGJ1aWxkIHNldHVwIGluc3RlYWQuXG4tIEZvciB2dWUtbG9hZGVyOiBwYXNzIGl0IHZpYSB2dWUtbG9hZGVyJ3MgXFxgY29tcGlsZXJPcHRpb25zXFxgIGxvYWRlciBvcHRpb24uXG4tIEZvciB2dWUtY2xpOiBzZWUgaHR0cHM6Ly9jbGkudnVlanMub3JnL2d1aWRlL3dlYnBhY2suaHRtbCNtb2RpZnlpbmctb3B0aW9ucy1vZi1hLWxvYWRlclxuLSBGb3Igdml0ZTogcGFzcyBpdCB2aWEgQHZpdGVqcy9wbHVnaW4tdnVlIG9wdGlvbnMuIFNlZSBodHRwczovL2dpdGh1Yi5jb20vdml0ZWpzL3ZpdGUtcGx1Z2luLXZ1ZS90cmVlL21haW4vcGFja2FnZXMvcGx1Z2luLXZ1ZSNleGFtcGxlLWZvci1wYXNzaW5nLW9wdGlvbnMtdG8tdnVlY29tcGlsZXItc2ZjYDtcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoYXBwLmNvbmZpZywgXCJjb21waWxlck9wdGlvbnNcIiwge1xuICAgICAgZ2V0KCkge1xuICAgICAgICB3YXJuKG1zZyk7XG4gICAgICAgIHJldHVybiBjb21waWxlck9wdGlvbnM7XG4gICAgICB9LFxuICAgICAgc2V0KCkge1xuICAgICAgICB3YXJuKG1zZyk7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cbn1cbmZ1bmN0aW9uIG5vcm1hbGl6ZUNvbnRhaW5lcihjb250YWluZXIpIHtcbiAgaWYgKGlzU3RyaW5nKGNvbnRhaW5lcikpIHtcbiAgICBjb25zdCByZXMgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGNvbnRhaW5lcik7XG4gICAgaWYgKCEhKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSBcInByb2R1Y3Rpb25cIikgJiYgIXJlcykge1xuICAgICAgd2FybihcbiAgICAgICAgYEZhaWxlZCB0byBtb3VudCBhcHA6IG1vdW50IHRhcmdldCBzZWxlY3RvciBcIiR7Y29udGFpbmVyfVwiIHJldHVybmVkIG51bGwuYFxuICAgICAgKTtcbiAgICB9XG4gICAgcmV0dXJuIHJlcztcbiAgfVxuICBpZiAoISEocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09IFwicHJvZHVjdGlvblwiKSAmJiB3aW5kb3cuU2hhZG93Um9vdCAmJiBjb250YWluZXIgaW5zdGFuY2VvZiB3aW5kb3cuU2hhZG93Um9vdCAmJiBjb250YWluZXIubW9kZSA9PT0gXCJjbG9zZWRcIikge1xuICAgIHdhcm4oXG4gICAgICBgbW91bnRpbmcgb24gYSBTaGFkb3dSb290IHdpdGggXFxge21vZGU6IFwiY2xvc2VkXCJ9XFxgIG1heSBsZWFkIHRvIHVucHJlZGljdGFibGUgYnVnc2BcbiAgICApO1xuICB9XG4gIHJldHVybiBjb250YWluZXI7XG59XG5sZXQgc3NyRGlyZWN0aXZlSW5pdGlhbGl6ZWQgPSBmYWxzZTtcbmNvbnN0IGluaXREaXJlY3RpdmVzRm9yU1NSID0gKCkgPT4ge1xuICBpZiAoIXNzckRpcmVjdGl2ZUluaXRpYWxpemVkKSB7XG4gICAgc3NyRGlyZWN0aXZlSW5pdGlhbGl6ZWQgPSB0cnVlO1xuICAgIGluaXRWTW9kZWxGb3JTU1IoKTtcbiAgICBpbml0VlNob3dGb3JTU1IoKTtcbiAgfVxufSA7XG5cbmV4cG9ydCB7IFRyYW5zaXRpb24sIFRyYW5zaXRpb25Hcm91cCwgVnVlRWxlbWVudCwgY3JlYXRlQXBwLCBjcmVhdGVTU1JBcHAsIGRlZmluZUN1c3RvbUVsZW1lbnQsIGRlZmluZVNTUkN1c3RvbUVsZW1lbnQsIGh5ZHJhdGUsIGluaXREaXJlY3RpdmVzRm9yU1NSLCBub2RlT3BzLCBwYXRjaFByb3AsIHJlbmRlciwgdXNlQ3NzTW9kdWxlLCB1c2VDc3NWYXJzLCB1c2VIb3N0LCB1c2VTaGFkb3dSb290LCB2TW9kZWxDaGVja2JveCwgdk1vZGVsRHluYW1pYywgdk1vZGVsUmFkaW8sIHZNb2RlbFNlbGVjdCwgdk1vZGVsVGV4dCwgdlNob3csIHdpdGhLZXlzLCB3aXRoTW9kaWZpZXJzIH07XG4iLCI8c2NyaXB0IHNldHVwIGxhbmc9XCJ0c1wiPlxuZGVmaW5lUHJvcHM8e1xuICBtZXNzYWdlOiBzdHJpbmdcbn0+KClcbjwvc2NyaXB0PlxuXG48dGVtcGxhdGU+XG4gIDxkaXYgc3R5bGU9XCJib3JkZXI6IDFweCBzb2xpZCAjY2NjOyBwYWRkaW5nOiA4cHhcIj5cbiAgICA8aDI+VnVlSlM8L2gyPlxuICAgIPCfkYsge3sgbWVzc2FnZSB9fVxuICA8L2Rpdj5cbjwvdGVtcGxhdGU+XG4iLCJpbXBvcnQgeyBjcmVhdGVBcHAsIHJlYWN0aXZlIH0gZnJvbSAndnVlJ1xuaW1wb3J0IEhlbGxvRGVscGhpbmUgZnJvbSAnLi9jb21wb25lbnRzL0hlbGxvRGVscGhpbmUudnVlJ1xuaW1wb3J0IHR5cGUgeyBEZWxwaGluZVNlcnZpY2VzLCBVSVBsdWdpbkluc3RhbmNlIH0gZnJvbSAnQHZjbCdcblxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZUhlbGxvVnVlUGx1Z2luKCk6IFVJUGx1Z2luSW5zdGFuY2U8eyBtZXNzYWdlOiBzdHJpbmcgfT4ge1xuICBsZXQgYXBwOiBSZXR1cm5UeXBlPHR5cGVvZiBjcmVhdGVBcHA+IHwgbnVsbCA9IG51bGxcbiAgY29uc3Qgc3RhdGUgPSByZWFjdGl2ZTx7IG1lc3NhZ2U6IHN0cmluZyB9Pih7IG1lc3NhZ2U6ICdCT0JPJyB9KVxuXG4gIHJldHVybiB7XG4gICAgaWQ6ICdoZWxsby12dWUnLFxuXG4gICAgbW91bnQoY29udGFpbmVyLCBwcm9wcywgX3NlcnZpY2VzOiBEZWxwaGluZVNlcnZpY2VzKSB7XG4gICAgICBzdGF0ZS5tZXNzYWdlID0gcHJvcHMubWVzc2FnZVxuICAgICAgYXBwID0gY3JlYXRlQXBwKEhlbGxvRGVscGhpbmUsIHN0YXRlKVxuICAgICAgYXBwLm1vdW50KGNvbnRhaW5lcilcbiAgICB9LFxuXG4gICAgdXBkYXRlKHByb3BzKSB7XG4gICAgICBzdGF0ZS5tZXNzYWdlID0gcHJvcHMubWVzc2FnZVxuICAgIH0sXG5cbiAgICB1bm1vdW50KCkge1xuICAgICAgYXBwPy51bm1vdW50KClcbiAgICAgIGFwcCA9IG51bGxcbiAgICB9LFxuICB9XG59XG4iLCIvLy8gPHJlZmVyZW5jZSBsaWI9XCJkb21cIiAvPlxuLy9pbXBvcnQgeyBpbnN0YWxsRGVscGhpbmVSdW50aW1lIH0gZnJvbSBcIi4vc3JjL2RydFwiOyAvLyA8LS0gVFMsIHBhcyAuanNcbmNvbnNvbGUubG9nKCfwn5SlIEkgQU0gWkFaQVZVRSDigJMgRU5UUlkgRVhFQ1VURUQnKVxuXG5jb25zb2xlLmxvZygnSSBBTSBaQVpBVlVFJylcblxuaW1wb3J0IHsgVEZvcm0sIFRDb2xvciwgVEFwcGxpY2F0aW9uLCBUQ29tcG9uZW50LCBUQnV0dG9uLCBQbHVnaW5SZWdpc3RyeSB9IGZyb20gJ0B2Y2wnXG4vL2ltcG9ydCB7IFRQbHVnaW5Ib3N0IH0gZnJvbSAnQGRydC9VSVBsdWdpbidcbmltcG9ydCB7IGNyZWF0ZUhlbGxvVnVlUGx1Z2luIH0gZnJvbSAnLi9jcmVhdGVIZWxsb1Z1ZVBsdWdpbidcblxuY29uc29sZS5sb2coJ0kgQU0gWkFaQVZVRScpXG4vLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tZGVidWdnZXJcbi8vIG94bGludC1kaXNhYmxlLW5leHQtbGluZSBuby1kZWJ1Z2dlclxuZGVidWdnZXJcblxuLy9pbXBvcnQgdHlwZSB7IERlbHBoaW5lU2VydmljZXMgfSBmcm9tICdAZHJ0L1VJUGx1Z2luJyAvLyBhZGFwdGV6IGxlIGNoZW1pbiBleGFjdCBjaGV6IHZvdXNcbi8vaW1wb3J0IHsgQ29tcG9uZW50UmVnaXN0cnkgfSBmcm9tICdAZHJ0L0NvbXBvbmVudFJlZ2lzdHJ5Jztcbi8vaW1wb3J0IHsgVFBsdWdpbkhvc3QgfSBmcm9tICdAZHJ0L1VJUGx1Z2luJztcblxuLy9leHBvcnQgZnVuY3Rpb24gcmVnaXN0ZXJQbHVnaW5UeXBlcyhyZWc6IENvbXBvbmVudFR5cGVSZWdpc3RyeSk6IHZvaWQge1xuLypcbiAgICAgICAgLy8gRXhhbXBsZTogYW55IHR5cGUgbmFtZSBjYW4gYmUgcHJvdmlkZWQgYnkgYSBwbHVnaW4uXG4gICAgICAgIHJlZy5yZWdpc3Rlci5yZWdpc3RlclR5cGUoJ2NoYXJ0anMtcGllJywgKG5hbWU6IHN0cmluZywgZm9ybTogVEZvcm0sIHBhcmVudDogVENvbXBvbmVudCkgPT4ge1xuICAgICAgICAgICAgICAgIHJldHVybiBuZXcgUGx1Z2luSG9zdChuYW1lLCBmb3JtLCBwYXJlbnQpO1xuICAgICAgICB9KTtcblxuICAgICAgICByZWcucmVnaXN0ZXJUeXBlKCd2dWUtaGVsbG8nLCAobmFtZTogc3RyaW5nLCBmb3JtOiBURm9ybSwgcGFyZW50OiBUQ29tcG9uZW50KSA9PiB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBQbHVnaW5Ib3N0KG5hbWUsIGZvcm0sIHBhcmVudCk7XG4gICAgICAgIH0pO1xuICAgICAgICAqL1xuLy99XG5cbmNsYXNzIFphemFWdWUgZXh0ZW5kcyBURm9ybSB7XG4gIC8vIEZvcm0gY29tcG9uZW50cyAtIFRoaXMgbGlzdCBpcyBhdXRvIGdlbmVyYXRlZCBieSBEZWxwaGluZVxuICAvLyAtLS0tLS0tLS0tLS0tLS1cbiAgLy9idXR0b24xIDogVEJ1dHRvbiA9IG5ldyBUQnV0dG9uKFwiYnV0dG9uMVwiLCB0aGlzLCB0aGlzKTtcbiAgLy9idXR0b24yIDogVEJ1dHRvbiA9IG5ldyBUQnV0dG9uKFwiYnV0dG9uMlwiLCB0aGlzLCB0aGlzKTtcbiAgLy9idXR0b24zIDogVEJ1dHRvbiA9IG5ldyBUQnV0dG9uKFwiYnV0dG9uM1wiLCB0aGlzLCB0aGlzKTtcbiAgLy8gLS0tLS0tLS0tLS0tLS0tXG5cbiAgY29uc3RydWN0b3IobmFtZTogc3RyaW5nKSB7XG4gICAgc3VwZXIobmFtZSlcbiAgfVxuICAvL2ltcG9ydCB7IGluc3RhbGxEZWxwaGluZVJ1bnRpbWUgfSBmcm9tIFwiLi9kcnRcIjtcblxuICAvKlxuY29uc3QgcnVudGltZSA9IHtcbiAgaGFuZGxlQ2xpY2soeyBlbGVtZW50IH06IHsgZWxlbWVudDogRWxlbWVudCB9KSB7XG4gICAgY29uc29sZS5sb2coXCJjbGlja2VkIVwiLCBlbGVtZW50KTtcbiAgICAvLyhlbGVtZW50IGFzIEhUTUxFbGVtZW50KS5zdHlsZS5iYWNrZ3JvdW5kQ29sb3IgPSBcInJlZFwiO1xuICB9LFxufTtcbiovXG5cbiAgcHJvdGVjdGVkIG9uTXlDcmVhdGUoX2V2OiBFdmVudCB8IG51bGwsIF9zZW5kZXI6IFRDb21wb25lbnQpIHtcbiAgICBjb25zdCBidG4gPSB0aGlzLmNvbXBvbmVudFJlZ2lzdHJ5LmdldCgnYnV0dG9uMScpXG4gICAgaWYgKGJ0bikgYnRuLmNvbG9yID0gVENvbG9yLnJnYigwLCAwLCAyNTUpXG4gIH1cblxuICBwcm90ZWN0ZWQgb25NeVNob3duKF9ldjogRXZlbnQgfCBudWxsLCBfc2VuZGVyOiBUQ29tcG9uZW50KSB7XG4gICAgY29uc3QgYnRuID0gdGhpcy5jb21wb25lbnRSZWdpc3RyeS5nZXQoJ2J1dHRvbngnKVxuICAgIGlmIChidG4pIGJ0bi5jb2xvciA9IFRDb2xvci5yZ2IoMCwgMjU1LCAyNTUpXG4gIH1cblxuICBidXR0b24xX29uY2xpY2soX2V2OiBFdmVudCB8IG51bGwsIF9zZW5kZXI6IFRDb21wb25lbnQpIHtcbiAgICBjb25zdCBidG4gPSB0aGlzLmNvbXBvbmVudFJlZ2lzdHJ5LmdldDxUQnV0dG9uPignYnV0dG9uMScpXG4gICAgaWYgKCFidG4pIHtcbiAgICAgIGNvbnNvbGUud2FybignYnV0dG9uMSBub3QgZm91bmQgaW4gcmVnaXN0cnknKVxuICAgICAgcmV0dXJuXG4gICAgfVxuICAgIC8vYnRuLmNvbG9yID0gVENvbG9yLnJnYigwLCAwLCAyNTUpO1xuICAgIGJ0biEuY29sb3IgPSBUQ29sb3IucmdiKDI1NSwgMCwgMClcbiAgICBidG4hLmNhcHRpb24gPSAnTUlNSSdcbiAgICBidG4hLmVuYWJsZWQgPSBmYWxzZVxuICAgIGNvbnNvbGUubG9nKCdCdXR0b24xIGNsaWNrZWQhISEhJylcbiAgfVxuXG4gIHphemFfb25jbGljayhfZXY6IEV2ZW50IHwgbnVsbCwgX3NlbmRlcjogVENvbXBvbmVudCkge1xuICAgIGNvbnN0IGJ0biA9IHRoaXMuY29tcG9uZW50UmVnaXN0cnkuZ2V0PFRCdXR0b24+KCdidXR0b254JylcbiAgICBidG4hLmNvbG9yID0gVENvbG9yLnJnYigwLCAyNTUsIDApXG4gICAgY29uc29sZS5sb2coJ3phemFWdWUgY2xpY2tlZCEhISEnKVxuICAgIC8vYnRuIS5lbmFibGVkID0gZmFsc2U7XG4gIH1cblxuICAvL2luc3RhbGxEZWxwaGluZVJ1bnRpbWUocnVudGltZSk7XG59IC8vIGNsYXNzIHphemFcblxuY2xhc3MgTXlBcHBsaWNhdGlvbiBleHRlbmRzIFRBcHBsaWNhdGlvbiB7XG4gIHphemFWdWU6IFphemFWdWVcblxuICBjb25zdHJ1Y3RvcigpIHtcbiAgICBzdXBlcigpXG4gICAgdGhpcy56YXphVnVlID0gbmV3IFphemFWdWUoJ3phemFWdWUnKVxuICAgIHRoaXMubWFpbkZvcm0gPSB0aGlzLnphemFWdWVcbiAgICBQbHVnaW5SZWdpc3RyeS5wbHVnaW5SZWdpc3RyeS5yZWdpc3RlcignaGVsbG8tdnVlJywgeyBmYWN0b3J5OiBjcmVhdGVIZWxsb1Z1ZVBsdWdpbiB9KVxuICB9XG5cbiAgcnVuKCkge1xuICAgIC8vdGhpcy56YXphLmNvbXBvbmVudFJlZ2lzdHJ5LmJ1aWxkQ29tcG9uZW50VHJlZSh0aGlzLnphemEpO1xuICAgIC8vdGhpcy56YXphLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJyk7XG5cbiAgICAvLyBhdSBsYW5jZW1lbnRcbiAgICB0aGlzLnJ1bldoZW5Eb21SZWFkeSgoKSA9PiB7XG4gICAgICB0aGlzLnphemFWdWUuc2hvdygpXG4gICAgfSlcbiAgfVxufSAvLyBjbGFzcyBNeUFwcGxpY2F0aW9uXG5cbmNvbnN0IG15QXBwbGljYXRpb246IE15QXBwbGljYXRpb24gPSBuZXcgTXlBcHBsaWNhdGlvbigpXG5teUFwcGxpY2F0aW9uLnJ1bigpXG4iXSwibmFtZXMiOlsicCIsImRlZiIsImhhc093blByb3BlcnR5IiwiaXNSZWYiLCJjb21wdXRlZCIsInNlbGYiLCJyZWFkb25seSIsIndhdGNoIiwiZWZmZWN0IiwicmVmIiwicmVmMiIsImgiLCJjcmVhdGVBcHAiLCJpc01vZGVsTGlzdGVuZXIiLCJlbWl0IiwicmVtb3ZlMiIsInJlbW92ZSIsImNhbWVsaXplJDEiLCJfb3BlbkJsb2NrIiwiX2NyZWF0ZUVsZW1lbnRCbG9jayIsIl9jcmVhdGVFbGVtZW50Vk5vZGUiLCJfY3JlYXRlVGV4dFZOb2RlIiwiSGVsbG9EZWxwaGluZSJdLCJtYXBwaW5ncyI6IkFBT08sU0FBUyxpQkFBaUIsT0FBK0I7QUFDeEQsUUFBTSxTQUFTLFlBQVksU0FBUztBQUNwQyxRQUFNLFNBQVMsZ0JBQWdCLFNBQVM7QUFHaEQ7QUM2RU8sTUFBZSxXQUFXO0FBQUEsRUFDaEIsV0FBbUI7QUFBQSxFQUM1QixPQUFPO0FBQUEsRUFDRSxhQUFnQztBQUFBLEVBRy9CLFlBQVksWUFBK0IsV0FBVyxjQUFjO0FBQ3RFLFNBQUssYUFBYTtBQUNsQixTQUFLLFdBQVc7QUFBQSxFQUN4QjtBQUNSO0FBRU8sTUFBTSxRQUFRO0FBQUEsRUFDYixlQUE0QjtBQUNwQixXQUFPLFlBQVk7QUFBQSxFQUMzQjtBQUNSO0FBRU8sTUFBTSxvQkFBb0IsV0FBVztBQUFBLEVBQ3BDLE9BQWdCLFlBQXlCLElBQUksWUFBWSxXQUFXLFNBQVM7QUFBQSxFQUU3RSxlQUE0QjtBQUNwQixXQUFPLFlBQVk7QUFBQSxFQUMzQjtBQUFBLEVBQ0EsWUFBWSxZQUF3QjtBQUM1QixVQUFNLFlBQVksU0FBUztBQUFBLEVBQ25DO0FBQ1I7QUFFTyxNQUFNLHVCQUF1QixXQUFXO0FBQUEsRUFDdkMsT0FBZ0IsWUFBNEIsSUFBSSxlQUFlLFdBQVcsU0FBUztBQUFBO0FBQUEsRUFFekUsWUFBWSxZQUF3QjtBQUN0QyxVQUFNLFlBQVksWUFBWTtBQUFBLEVBQ3RDO0FBQUEsRUFFQSxlQUErQjtBQUN2QixXQUFPLGVBQWU7QUFBQSxFQUM5QjtBQUFBO0FBQUEsRUFHQSxPQUFPLE1BQWMsTUFBYSxRQUFvQjtBQUM5QyxXQUFPLElBQUksV0FBVyxNQUFNLE1BQU0sTUFBTTtBQUFBLEVBQ2hEO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7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
