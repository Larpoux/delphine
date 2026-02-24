function registerBuiltins(types) {
  types.register(TMetaButton.metaClass);
  types.register(TMetaPluginHost.metaClass);
}
class TMetaclass {
  typeName = "Metaclass";
  static metaclass;
  constructor() {
  }
}
class TMetaComponent extends TMetaclass {
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
    return new TComponent(this.getMetaClass(), name, form, parent);
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
}
class ComponentTypeRegistry {
  // We store heterogeneous metas, so we keep them as TMetaComponent<any>.
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
class ComponentRegistry {
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
}
class TComponent {
  metaClass;
  name;
  parent = null;
  form = null;
  children = [];
  elem = null;
  get htmlElement() {
    return this.elem;
  }
  constructor(metaClass, name, form, parent) {
    this.metaClass = metaClass;
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
class TDocument {
  static document = new TDocument(document);
  static body = document.body;
  htmlDoc;
  constructor(htmlDoc) {
    this.htmlDoc = htmlDoc;
  }
}
class TMetaForm extends TMetaComponent {
  //metaclass: TMetaComponent<TForm>;
  static metaclass = new TMetaForm();
  getMetaClass() {
    return TMetaForm.metaclass;
  }
  typeName = "TForm";
  create(name, form, parent) {
    return new TForm(name);
  }
  props() {
    return [];
  }
}
class TForm extends TComponent {
  allowsChildren() {
    return true;
  }
  static forms = /* @__PURE__ */ new Map();
  _mounted = false;
  // Each Form has its own componentRegistry
  componentRegistry = new ComponentRegistry();
  constructor(name) {
    super(TMetaForm.metaclass, name, null, null);
    this.form = this;
    TForm.forms.set(name, this);
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
}
class TButton extends TComponent {
  _caption = "";
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
  _enabled = true;
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
  constructor(name, form, parent) {
    super(TMetaButton.metaClass, name, form, parent);
  }
}
class TMetaButton extends TMetaComponent {
  constructor() {
    super();
  }
  static metaClass = new TMetaButton();
  getMetaClass() {
    return TMetaButton.metaClass;
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
class TApplication {
  static TheApplication;
  //static pluginRegistry = new PluginRegistry();
  //plugins: IPluginRegistry;
  forms = [];
  types = new ComponentTypeRegistry();
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
  static metaClass = new TMetaPluginHost();
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
    super(TMetaPluginHost.metaClass, name, form, parent);
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
    btn.setCaption("MIMI");
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiemF6YVZ1ZS5jb21waWxlZC5qcyIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL3ZjbC9yZWdpc3RlclZjbC50cyIsIi4uLy4uLy4uL3NyYy92Y2wvU3RkQ3RybHMudHMiLCIuLi9ub2RlX21vZHVsZXMvQHZ1ZS9zaGFyZWQvZGlzdC9zaGFyZWQuZXNtLWJ1bmRsZXIuanMiLCIuLi9ub2RlX21vZHVsZXMvQHZ1ZS9yZWFjdGl2aXR5L2Rpc3QvcmVhY3Rpdml0eS5lc20tYnVuZGxlci5qcyIsIi4uL25vZGVfbW9kdWxlcy9AdnVlL3J1bnRpbWUtY29yZS9kaXN0L3J1bnRpbWUtY29yZS5lc20tYnVuZGxlci5qcyIsIi4uL25vZGVfbW9kdWxlcy9AdnVlL3J1bnRpbWUtZG9tL2Rpc3QvcnVudGltZS1kb20uZXNtLWJ1bmRsZXIuanMiLCIuLi9zcmMvY29tcG9uZW50cy9IZWxsb0RlbHBoaW5lLnZ1ZSIsIi4uL3NyYy9jcmVhdGVIZWxsb1Z1ZVBsdWdpbi50cyIsIi4uL3NyYy96YXphVnVlLnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIEVuZ2xpc2ggY29tbWVudHMgYXMgcmVxdWVzdGVkLlxuXG4vL2ltcG9ydCB7IENvbXBvbmVudFR5cGVSZWdpc3RyeSB9IGZyb20gJ0BkcnQnO1xuaW1wb3J0IHsgVEJ1dHRvbiwgVE1ldGFDb21wb25lbnQsIFRGb3JtLCBUQ29tcG9uZW50LCBDb21wb25lbnRUeXBlUmVnaXN0cnksIFRNZXRhQnV0dG9uLCBUTWV0YVBsdWdpbkhvc3QgfSBmcm9tICdAdmNsJztcbi8vaW1wb3J0IHsgVE1ldGFQbHVnaW5Ib3N0IH0gZnJvbSAnLi4vZHJ0L1VJUGx1Z2luJzsgLy8gTk9UIEdPT0QgISBpbXBvcnQgVkNMIVxuXG4vLyBFbmdsaXNoIGNvbW1lbnRzIGFzIHJlcXVlc3RlZC5cbmV4cG9ydCBmdW5jdGlvbiByZWdpc3RlckJ1aWx0aW5zKHR5cGVzOiBDb21wb25lbnRUeXBlUmVnaXN0cnkpIHtcbiAgICAgICAgdHlwZXMucmVnaXN0ZXIoVE1ldGFCdXR0b24ubWV0YUNsYXNzKTtcbiAgICAgICAgdHlwZXMucmVnaXN0ZXIoVE1ldGFQbHVnaW5Ib3N0Lm1ldGFDbGFzcyk7XG4gICAgICAgIC8vIHR5cGVzLnJlZ2lzdGVyKFRFZGl0Q2xhc3MpO1xuICAgICAgICAvLyB0eXBlcy5yZWdpc3RlcihUTGFiZWxDbGFzcyk7XG59XG4iLCIvL2ltcG9ydCB7IENvbXBvbmVudFR5cGVSZWdpc3RyeSB9IGZyb20gJy4uL2RydC9VSVBsdWdpbic7IC8vIFBBUyBcImltcG9ydCB0eXBlXCJcbi8vIC8vaW1wb3J0IHR5cGUgeyBKc29uLCBEZWxwaGluZVNlcnZpY2VzLCBDb21wb25lbnRUeXBlUmVnaXN0cnkgfSBmcm9tICcuLi9kcnQvVUlQbHVnaW4nO1xuLy9pbXBvcnQgeyByZWdpc3RlclZjbFR5cGVzIH0gZnJvbSAnLi9yZWdpc3RlclZjbCc7XG4vL2ltcG9ydCB7IEJ1dHRvbiB9IGZyb20gJ2dyYXBlc2pzJztcbmltcG9ydCB7IHJlZ2lzdGVyQnVpbHRpbnMgfSBmcm9tICcuL3JlZ2lzdGVyVmNsJztcblxuZXhwb3J0IHR5cGUgQ29tcG9uZW50RmFjdG9yeSA9IChuYW1lOiBzdHJpbmcsIGZvcm06IFRGb3JtLCBvd25lcjogVENvbXBvbmVudCkgPT4gVENvbXBvbmVudDtcblxuLy9pbXBvcnQgdHlwZSB7IEpzb24gfSBmcm9tICcuL0pzb24nO1xuZXhwb3J0IHR5cGUgSnNvbiA9IG51bGwgfCBib29sZWFuIHwgbnVtYmVyIHwgc3RyaW5nIHwgSnNvbltdIHwgeyBba2V5OiBzdHJpbmddOiBKc29uIH07XG5cbnR5cGUgUHJvcEtpbmQgPSAnc3RyaW5nJyB8ICdudW1iZXInIHwgJ2Jvb2xlYW4nIHwgJ2NvbG9yJztcbmV4cG9ydCB0eXBlIFByb3BTcGVjPFQsIFYgPSB1bmtub3duPiA9IHtcbiAgICAgICAgbmFtZTogc3RyaW5nO1xuICAgICAgICBraW5kOiBQcm9wS2luZDtcbiAgICAgICAgYXBwbHk6IChvYmo6IFQsIHZhbHVlOiBWKSA9PiB2b2lkO1xufTtcblxuZXhwb3J0IGludGVyZmFjZSBJUGx1Z2luSG9zdCB7XG4gICAgICAgIHNldFBsdWdpblNwZWMoc3BlYzogeyBwbHVnaW46IHN0cmluZyB8IG51bGw7IHByb3BzOiBhbnkgfSk6IHZvaWQ7XG4gICAgICAgIG1vdW50UGx1Z2luSWZSZWFkeShzZXJ2aWNlczogRGVscGhpbmVTZXJ2aWNlcyk6IHZvaWQ7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgRGVscGhpbmVMb2dnZXIge1xuICAgICAgICBkZWJ1Zyhtc2c6IHN0cmluZywgZGF0YT86IEpzb24pOiB2b2lkO1xuICAgICAgICBpbmZvKG1zZzogc3RyaW5nLCBkYXRhPzogSnNvbik6IHZvaWQ7XG4gICAgICAgIHdhcm4obXNnOiBzdHJpbmcsIGRhdGE/OiBKc29uKTogdm9pZDtcbiAgICAgICAgZXJyb3IobXNnOiBzdHJpbmcsIGRhdGE/OiBKc29uKTogdm9pZDtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBEZWxwaGluZUV2ZW50QnVzIHtcbiAgICAgICAgLy8gU3Vic2NyaWJlIHRvIGFuIGFwcCBldmVudC5cbiAgICAgICAgb24oZXZlbnROYW1lOiBzdHJpbmcsIGhhbmRsZXI6IChwYXlsb2FkOiBKc29uKSA9PiB2b2lkKTogKCkgPT4gdm9pZDtcblxuICAgICAgICAvLyBQdWJsaXNoIGFuIGFwcCBldmVudC5cbiAgICAgICAgZW1pdChldmVudE5hbWU6IHN0cmluZywgcGF5bG9hZDogSnNvbik6IHZvaWQ7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgRGVscGhpbmVTdG9yYWdlIHtcbiAgICAgICAgZ2V0KGtleTogc3RyaW5nKTogUHJvbWlzZTxKc29uIHwgdW5kZWZpbmVkPjtcbiAgICAgICAgc2V0KGtleTogc3RyaW5nLCB2YWx1ZTogSnNvbik6IFByb21pc2U8dm9pZD47XG4gICAgICAgIHJlbW92ZShrZXk6IHN0cmluZyk6IFByb21pc2U8dm9pZD47XG59XG5leHBvcnQgaW50ZXJmYWNlIERlbHBoaW5lU2VydmljZXMge1xuICAgICAgICBsb2c6IHtcbiAgICAgICAgICAgICAgICBkZWJ1Zyhtc2c6IHN0cmluZywgZGF0YT86IGFueSk6IHZvaWQ7XG4gICAgICAgICAgICAgICAgaW5mbyhtc2c6IHN0cmluZywgZGF0YT86IGFueSk6IHZvaWQ7XG4gICAgICAgICAgICAgICAgd2Fybihtc2c6IHN0cmluZywgZGF0YT86IGFueSk6IHZvaWQ7XG4gICAgICAgICAgICAgICAgZXJyb3IobXNnOiBzdHJpbmcsIGRhdGE/OiBhbnkpOiB2b2lkO1xuICAgICAgICB9O1xuXG4gICAgICAgIGJ1czoge1xuICAgICAgICAgICAgICAgIG9uKGV2ZW50OiBzdHJpbmcsIGhhbmRsZXI6IChwYXlsb2FkOiBhbnkpID0+IHZvaWQpOiAoKSA9PiB2b2lkO1xuICAgICAgICAgICAgICAgIGVtaXQoZXZlbnQ6IHN0cmluZywgcGF5bG9hZDogYW55KTogdm9pZDtcbiAgICAgICAgfTtcblxuICAgICAgICBzdG9yYWdlOiB7XG4gICAgICAgICAgICAgICAgZ2V0KGtleTogc3RyaW5nKTogUHJvbWlzZTxhbnk+IHwgbnVsbDtcbiAgICAgICAgICAgICAgICBzZXQoa2V5OiBzdHJpbmcsIHZhbHVlOiBhbnkpOiBQcm9taXNlPHZvaWQ+IHwgbnVsbDtcbiAgICAgICAgICAgICAgICByZW1vdmUoa2V5OiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHwgbnVsbDtcbiAgICAgICAgfTtcblxuICAgICAgICAvLyBmdXR1clxuICAgICAgICAvLyBpMThuPzogLi4uXG4gICAgICAgIC8vIG5hdj86IC4uLlxufVxuXG5leHBvcnQgaW50ZXJmYWNlIFVJUGx1Z2luSW5zdGFuY2U8UHJvcHMgZXh0ZW5kcyBKc29uID0gSnNvbj4ge1xuICAgICAgICByZWFkb25seSBpZDogc3RyaW5nO1xuXG4gICAgICAgIC8vIENhbGxlZCBleGFjdGx5IG9uY2UgYWZ0ZXIgY3JlYXRpb24gKGZvciBhIGdpdmVuIGluc3RhbmNlKS5cbiAgICAgICAgbW91bnQoY29udGFpbmVyOiBIVE1MRWxlbWVudCwgcHJvcHM6IFByb3BzLCBzZXJ2aWNlczogRGVscGhpbmVTZXJ2aWNlcyk6IHZvaWQ7XG5cbiAgICAgICAgLy8gQ2FsbGVkIGFueSB0aW1lIHByb3BzIGNoYW5nZSAobWF5IGJlIGZyZXF1ZW50KS5cbiAgICAgICAgdXBkYXRlKHByb3BzOiBQcm9wcyk6IHZvaWQ7XG5cbiAgICAgICAgLy8gQ2FsbGVkIGV4YWN0bHkgb25jZSBiZWZvcmUgZGlzcG9zYWwuXG4gICAgICAgIHVubW91bnQoKTogdm9pZDtcblxuICAgICAgICAvLyBPcHRpb25hbCBlcmdvbm9taWNzLlxuICAgICAgICBnZXRTaXplSGludHM/KCk6IG51bWJlcjtcbiAgICAgICAgZm9jdXM/KCk6IHZvaWQ7XG5cbiAgICAgICAgLy8gT3B0aW9uYWwgcGVyc2lzdGVuY2UgaG9vayAoRGVscGhpbmUgbWF5IHN0b3JlICYgcmVzdG9yZSB0aGlzKS5cbiAgICAgICAgc2VyaWFsaXplU3RhdGU/KCk6IEpzb247XG59XG5leHBvcnQgYWJzdHJhY3QgY2xhc3MgVE1ldGFjbGFzczxUIGV4dGVuZHMgVE1ldGFjbGFzczxhbnk+ID0gYW55PiB7XG4gICAgICAgIHJlYWRvbmx5IHR5cGVOYW1lOiBzdHJpbmcgPSAnTWV0YWNsYXNzJztcbiAgICAgICAgc3RhdGljIG1ldGFjbGFzczogVE1ldGFjbGFzcztcblxuICAgICAgICBhYnN0cmFjdCBnZXRNZXRhQ2xhc3MoKTogVE1ldGFjbGFzcztcbiAgICAgICAgY29uc3RydWN0b3IoKSB7fVxuICAgICAgICBhYnN0cmFjdCBjcmVhdGUobmFtZTogc3RyaW5nLCBmb3JtOiBURm9ybSwgcGFyZW50OiBUT2JqZWN0PGFueT4pOiBUO1xufVxuXG5leHBvcnQgY2xhc3MgVE9iamVjdDxUU2VsZiBleHRlbmRzIFRPYmplY3Q8YW55PiA9IGFueT4ge31cblxuZXhwb3J0IGFic3RyYWN0IGNsYXNzIFRNZXRhT2JqZWN0IGV4dGVuZHMgVE1ldGFjbGFzcyB7XG4gICAgICAgIC8vc3RhdGljIG1ldGFDbGFzczogVE1ldGFPYmplY3QgPSBuZXcgVE1ldGFPYmplY3QoKTtcbiAgICAgICAgcmVhZG9ubHkgdHlwZU5hbWU6IHN0cmluZyA9ICdPYmplY3QnO1xuXG4gICAgICAgIGFic3RyYWN0IGdldE1ldGFDbGFzcygpOiBUTWV0YU9iamVjdDtcbiAgICAgICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgICAgICAgICAgc3VwZXIoKTtcbiAgICAgICAgfVxuICAgICAgICBhYnN0cmFjdCBjcmVhdGUoKTogVE9iamVjdDtcblxuICAgICAgICAvL2Fic3RyYWN0IGdldE1ldGFDbGFzcygpOiBUTWV0YUNvbXBvbmVudDxUPjtcbn1cblxuLy8gRW5nbGlzaCBjb21tZW50cyBhcyByZXF1ZXN0ZWQuXG5leHBvcnQgYWJzdHJhY3QgY2xhc3MgVE1ldGFDb21wb25lbnQ8VCBleHRlbmRzIFRDb21wb25lbnQ+IGV4dGVuZHMgVE1ldGFjbGFzcyB7XG4gICAgICAgIC8vIFRoZSBzeW1ib2xpYyBuYW1lIHVzZWQgaW4gSFRNTDogZGF0YS1jb21wb25lbnQ9XCJUQnV0dG9uXCIgb3IgXCJteS1idXR0b25cIlxuICAgICAgICBhYnN0cmFjdCByZWFkb25seSB0eXBlTmFtZTogc3RyaW5nO1xuICAgICAgICAvL3N0YXRpYyBtZXRhQ2xhc3M6IFRNZXRhQ29tcG9uZW50PFQ+ID0gbmV3IFRNZXRhQ29tcG9uZW50PFQ+KCk7XG4gICAgICAgIC8vYWJzdHJhY3QgcmVhZG9ubHkgbWV0YWNsYXNzOiBUTWV0YUNvbXBvbmVudDxUPjtcbiAgICAgICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgICAgICAgICAgc3VwZXIoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGFic3RyYWN0IGdldE1ldGFDbGFzcygpOiBUTWV0YUNvbXBvbmVudDxUPjtcbiAgICAgICAgLy9hYnN0cmFjdCBnZXRNZXRhQ2xhc3MoKTogVE1ldGFDb21wb25lbnQ8VD47XG4gICAgICAgIC8vYWJzdHJhY3QgZ2V0TWV0YUNsYXNzKCk6IFRNZXRhQ29tcG9uZW50PFQ+OyAvL3tcbiAgICAgICAgLy9yZXR1cm4gVE1ldGFDb21wb25lbnQubWV0YWNsYXNzO1xuICAgICAgICAvL31cblxuICAgICAgICAvLyBDcmVhdGUgdGhlIHJ1bnRpbWUgaW5zdGFuY2UgYW5kIGF0dGFjaCBpdCB0byB0aGUgRE9NIGVsZW1lbnQuXG4gICAgICAgIGNyZWF0ZShuYW1lOiBzdHJpbmcsIGZvcm06IFRGb3JtLCBwYXJlbnQ6IFRDb21wb25lbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gbmV3IFRDb21wb25lbnQodGhpcy5nZXRNZXRhQ2xhc3MoKSwgbmFtZSwgZm9ybSwgcGFyZW50KTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8qKiBQcm9wZXJ0eSBzY2hlbWEgZm9yIHRoaXMgY29tcG9uZW50IHR5cGUgKi9cbiAgICAgICAgcHJvcHMoKTogUHJvcFNwZWM8VD5bXSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIFtdO1xuICAgICAgICB9XG5cbiAgICAgICAgZG9tRXZlbnRzPygpOiBzdHJpbmdbXTsgLy8gZGVmYXVsdCBbXTtcblxuICAgICAgICAvKlxuICAgICAgICAvLyBPcHRpb25hbDogcGFyc2UgSFRNTCBhdHRyaWJ1dGVzIC0+IHByb3BzL3N0YXRlXG4gICAgICAgIC8vIEV4YW1wbGU6IGRhdGEtY2FwdGlvbj1cIk9LXCIgLT4geyBjYXB0aW9uOiBcIk9LXCIgfVxuICAgICAgICBwYXJzZVByb3BzPyhlbGVtOiBIVE1MRWxlbWVudCk6IEpzb247XG5cbiAgICAgICAgLy8gT3B0aW9uYWw6IGFwcGx5IHByb3BzIHRvIHRoZSBjb21wb25lbnQgKGNhbiBiZSBjYWxsZWQgYWZ0ZXIgY3JlYXRlKVxuICAgICAgICBhcHBseVByb3BzPyhjOiBULCBwcm9wczogSnNvbik6IHZvaWQ7XG5cbiAgICAgICAgLy8gT3B0aW9uYWw6IERlc2lnbi10aW1lIG1ldGFkYXRhIChwYWxldHRlLCBpbnNwZWN0b3IsIGV0Yy4pXG4gICAgICAgIGRlc2lnblRpbWU/OiB7XG4gICAgICAgICAgICAgICAgcGFsZXR0ZUdyb3VwPzogc3RyaW5nO1xuICAgICAgICAgICAgICAgIGRpc3BsYXlOYW1lPzogc3RyaW5nO1xuICAgICAgICAgICAgICAgIGljb24/OiBzdHJpbmc7IC8vIGxhdGVyXG4gICAgICAgICAgICAgICAgLy8gcHJvcGVydHkgc2NoZW1hIGNvdWxkIGxpdmUgaGVyZVxuICAgICAgICB9O1xuICAgICAgICAqL1xufVxuXG4vL2ltcG9ydCB0eXBlIHsgVENvbXBvbmVudENsYXNzIH0gZnJvbSAnLi9UQ29tcG9uZW50Q2xhc3MnO1xuLy9pbXBvcnQgdHlwZSB7IFRDb21wb25lbnQgfSBmcm9tICdAdmNsJztcblxuZXhwb3J0IGNsYXNzIENvbXBvbmVudFR5cGVSZWdpc3RyeSB7XG4gICAgICAgIC8vIFdlIHN0b3JlIGhldGVyb2dlbmVvdXMgbWV0YXMsIHNvIHdlIGtlZXAgdGhlbSBhcyBUTWV0YUNvbXBvbmVudDxhbnk+LlxuICAgICAgICBwcml2YXRlIHJlYWRvbmx5IGNsYXNzZXMgPSBuZXcgTWFwPHN0cmluZywgVE1ldGFDb21wb25lbnQ8VENvbXBvbmVudD4+KCk7XG5cbiAgICAgICAgcmVnaXN0ZXIobWV0YTogVE1ldGFDb21wb25lbnQ8YW55Pikge1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLmNsYXNzZXMuaGFzKG1ldGEudHlwZU5hbWUpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYENvbXBvbmVudCB0eXBlIGFscmVhZHkgcmVnaXN0ZXJlZDogJHttZXRhLnR5cGVOYW1lfWApO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB0aGlzLmNsYXNzZXMuc2V0KG1ldGEudHlwZU5hbWUsIG1ldGEpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gSWYgeW91IGp1c3QgbmVlZCBcInNvbWV0aGluZyBtZXRhXCIsIHJldHVybiBhbnktbWV0YS5cbiAgICAgICAgZ2V0KHR5cGVOYW1lOiBzdHJpbmcpOiBUTWV0YUNvbXBvbmVudDxUQ29tcG9uZW50PiB8IHVuZGVmaW5lZCB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuY2xhc3Nlcy5nZXQodHlwZU5hbWUpO1xuICAgICAgICB9XG5cbiAgICAgICAgaGFzKHR5cGVOYW1lOiBzdHJpbmcpOiBib29sZWFuIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5jbGFzc2VzLmhhcyh0eXBlTmFtZSk7XG4gICAgICAgIH1cblxuICAgICAgICBsaXN0KCk6IHN0cmluZ1tdIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gWy4uLnRoaXMuY2xhc3Nlcy5rZXlzKCldLnNvcnQoKTtcbiAgICAgICAgfVxufVxuXG4vKlxuXG4vL2V4cG9ydCB0eXBlIENvbXBvbmVudEZhY3RvcnkgPSAobmFtZTogc3RyaW5nLCBmb3JtOiBURm9ybSwgcGFyZW50OiBUQ29tcG9uZW50KSA9PiBUQ29tcG9uZW50O1xuXG5leHBvcnQgY2xhc3MgQ29tcG9uZW50VHlwZVJlZ2lzdHJ5IHtcbiAgICAgICAgcHJpdmF0ZSBmYWN0b3JpZXMgPSBuZXcgTWFwPHN0cmluZywgQ29tcG9uZW50RmFjdG9yeT4oKTtcblxuICAgICAgICBnZXQobmFtZTogc3RyaW5nKTogQ29tcG9uZW50RmFjdG9yeSB8IG51bGwgfCB1bmRlZmluZWQge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmZhY3Rvcmllcy5nZXQobmFtZSk7XG4gICAgICAgIH1cblxuICAgICAgICByZWdpc3RlclR5cGUodHlwZU5hbWU6IHN0cmluZywgZmFjdG9yeTogQ29tcG9uZW50RmFjdG9yeSkge1xuICAgICAgICAgICAgICAgIHRoaXMuZmFjdG9yaWVzLnNldCh0eXBlTmFtZSwgZmFjdG9yeSk7XG4gICAgICAgIH1cblxuICAgICAgICBjcmVhdGUobmFtZTogc3RyaW5nLCBmb3JtOiBURm9ybSwgcGFyZW50OiBUQ29tcG9uZW50KTogVENvbXBvbmVudCB8IG51bGwge1xuICAgICAgICAgICAgICAgIGNvbnN0IGYgPSB0aGlzLmZhY3Rvcmllcy5nZXQobmFtZSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGYgPyBmKG5hbWUsIGZvcm0sIHBhcmVudCkgOiBudWxsO1xuICAgICAgICB9XG59XG5cbiovXG5cbmV4cG9ydCBjbGFzcyBUQ29sb3Ige1xuICAgICAgICBzOiBzdHJpbmc7XG5cbiAgICAgICAgY29uc3RydWN0b3Ioczogc3RyaW5nKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5zID0gcztcbiAgICAgICAgfVxuICAgICAgICAvKiBmYWN0b3J5ICovIHN0YXRpYyByZ2IocjogbnVtYmVyLCBnOiBudW1iZXIsIGI6IG51bWJlcik6IFRDb2xvciB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBUQ29sb3IoYHJnYigke3J9LCAke2d9LCAke2J9KWApO1xuICAgICAgICB9XG4gICAgICAgIC8qIGZhY3RvcnkgKi8gc3RhdGljIHJnYmEocjogbnVtYmVyLCBnOiBudW1iZXIsIGI6IG51bWJlciwgYTogbnVtYmVyKTogVENvbG9yIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gbmV3IFRDb2xvcihgcmdiYSgke3J9LCAke2d9LCAke2J9LCAke2F9KWApO1xuICAgICAgICB9XG59XG5cbmV4cG9ydCBjbGFzcyBDb21wb25lbnRSZWdpc3RyeSB7XG4gICAgICAgIHByaXZhdGUgaW5zdGFuY2VzID0gbmV3IE1hcDxzdHJpbmcsIFRDb21wb25lbnQ+KCk7XG5cbiAgICAgICAgbG9nZ2VyID0ge1xuICAgICAgICAgICAgICAgIGRlYnVnKG1zZzogc3RyaW5nLCBkYXRhPzogSnNvbik6IHZvaWQge30sXG4gICAgICAgICAgICAgICAgaW5mbyhtc2c6IHN0cmluZywgZGF0YT86IEpzb24pOiB2b2lkIHt9LFxuICAgICAgICAgICAgICAgIHdhcm4obXNnOiBzdHJpbmcsIGRhdGE/OiBKc29uKTogdm9pZCB7fSxcbiAgICAgICAgICAgICAgICBlcnJvcihtc2c6IHN0cmluZywgZGF0YT86IEpzb24pOiB2b2lkIHt9XG4gICAgICAgIH07XG5cbiAgICAgICAgZXZlbnRCdXMgPSB7XG4gICAgICAgICAgICAgICAgb24oZXZlbnQ6IHN0cmluZywgaGFuZGxlcjogKHBheWxvYWQ6IGFueSkgPT4gdm9pZCk6ICgpID0+IHZvaWQge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuICgpID0+IHZvaWQge307XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBlbWl0KGV2ZW50OiBzdHJpbmcsIHBheWxvYWQ6IGFueSk6IHZvaWQge31cbiAgICAgICAgfTtcblxuICAgICAgICBzdG9yYWdlID0ge1xuICAgICAgICAgICAgICAgIGdldChrZXk6IHN0cmluZyk6IFByb21pc2U8YW55PiB8IG51bGwge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBzZXQoa2V5OiBzdHJpbmcsIHZhbHVlOiBhbnkpOiBQcm9taXNlPHZvaWQ+IHwgbnVsbCB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIHJlbW92ZShrZXk6IHN0cmluZyk6IFByb21pc2U8dm9pZD4gfCBudWxsIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgfTtcblxuICAgICAgICBjb25zdHJ1Y3RvcigpIHt9XG5cbiAgICAgICAgcmVnaXN0ZXJJbnN0YW5jZShuYW1lOiBzdHJpbmcsIGM6IFRDb21wb25lbnQpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmluc3RhbmNlcy5zZXQobmFtZSwgYyk7XG4gICAgICAgIH1cbiAgICAgICAgZ2V0PFQgZXh0ZW5kcyBUQ29tcG9uZW50ID0gVENvbXBvbmVudD4obmFtZTogc3RyaW5nKTogVCB8IHVuZGVmaW5lZCB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuaW5zdGFuY2VzLmdldChuYW1lKSBhcyBUIHwgdW5kZWZpbmVkO1xuICAgICAgICB9XG5cbiAgICAgICAgc2VydmljZXM6IERlbHBoaW5lU2VydmljZXMgPSB7XG4gICAgICAgICAgICAgICAgbG9nOiB0aGlzLmxvZ2dlcixcbiAgICAgICAgICAgICAgICBidXM6IHRoaXMuZXZlbnRCdXMsXG4gICAgICAgICAgICAgICAgc3RvcmFnZTogdGhpcy5zdG9yYWdlXG4gICAgICAgIH07XG5cbiAgICAgICAgY2xlYXIoKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5pbnN0YW5jZXMuY2xlYXIoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJlc29sdmVSb290KCk6IEhUTUxFbGVtZW50IHtcbiAgICAgICAgICAgICAgICAvLyBQcmVmZXIgYm9keSBhcyB0aGUgY2Fub25pY2FsIHJvb3QuXG4gICAgICAgICAgICAgICAgaWYgKGRvY3VtZW50LmJvZHk/LmRhdGFzZXQ/LmNvbXBvbmVudCkgcmV0dXJuIGRvY3VtZW50LmJvZHk7XG5cbiAgICAgICAgICAgICAgICAvLyBCYWNrd2FyZCBjb21wYXRpYmlsaXR5OiBvbGQgd3JhcHBlciBkaXYuXG4gICAgICAgICAgICAgICAgY29uc3QgbGVnYWN5ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2RlbHBoaW5lLXJvb3QnKTtcbiAgICAgICAgICAgICAgICBpZiAobGVnYWN5KSByZXR1cm4gbGVnYWN5O1xuXG4gICAgICAgICAgICAgICAgLy8gTGFzdCByZXNvcnQuXG4gICAgICAgICAgICAgICAgcmV0dXJuIGRvY3VtZW50LmJvZHkgPz8gZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50O1xuICAgICAgICB9XG5cbiAgICAgICAgcHJpdmF0ZSByZWFkUHJvcHMoZWw6IEVsZW1lbnQsIG1ldGE6IFRNZXRhQ29tcG9uZW50PFRDb21wb25lbnQ+KSB7XG4gICAgICAgICAgICAgICAgY29uc3Qgb3V0OiBSZWNvcmQ8c3RyaW5nLCBhbnk+ID0ge307XG4gICAgICAgICAgICAgICAgZm9yIChjb25zdCBzcGVjIG9mIG1ldGEucHJvcHMoKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgcmF3ID0gZWwuZ2V0QXR0cmlidXRlKGBkYXRhLSR7c3BlYy5uYW1lfWApO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHJhdyA9PSBudWxsKSBjb250aW51ZTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgb3V0W3NwZWMubmFtZV0gPSB0aGlzLmNvbnZlcnQocmF3LCBzcGVjLmtpbmQpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gb3V0O1xuICAgICAgICB9XG5cbiAgICAgICAgcHJpdmF0ZSBjb252ZXJ0KHJhdzogc3RyaW5nLCBraW5kOiBQcm9wS2luZCkge1xuICAgICAgICAgICAgICAgIHN3aXRjaCAoa2luZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSAnc3RyaW5nJzpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJhdztcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgJ251bWJlcic6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBOdW1iZXIocmF3KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgJ2Jvb2xlYW4nOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmF3ID09PSAndHJ1ZScgfHwgcmF3ID09PSAnMScgfHwgcmF3ID09PSAnJztcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgJ2NvbG9yJzpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJhdzsgLy8gb3UgcGFyc2UgZW4gVENvbG9yIHNpIHZvdXMgYXZlelxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGFwcGx5UHJvcHMoY2hpbGQ6IFRDb21wb25lbnQsIGNsczogVE1ldGFDb21wb25lbnQ8VENvbXBvbmVudD4pIHtcbiAgICAgICAgICAgICAgICBjb25zdCBwcm9wcyA9IHRoaXMucmVhZFByb3BzKGNoaWxkLmVsZW0hLCBjbHMpO1xuICAgICAgICAgICAgICAgIGZvciAoY29uc3Qgc3BlYyBvZiBjbHMucHJvcHMoKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHByb3BzW3NwZWMubmFtZV0gIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzcGVjLmFwcGx5KGNoaWxkLCBwcm9wc1tzcGVjLm5hbWVdKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBidWlsZENvbXBvbmVudFRyZWUoZm9ybTogVEZvcm0sIGNvbXBvbmVudDogVENvbXBvbmVudCkge1xuICAgICAgICAgICAgICAgIHRoaXMuY2xlYXIoKTtcbiAgICAgICAgICAgICAgICAvLyByZXNvbHZlUm9vdCBlc3QgbWFpbnRlbmFudCBhcHBlbMOpIHBhciBURm9ybTo6c2hvdygpLiBJbnV0aWxlIGRlIGxlIGZhaXJlIGljaVxuICAgICAgICAgICAgICAgIC8vY29uc3Qgcm9vdCA9IFREb2N1bWVudC5ib2R5O1xuICAgICAgICAgICAgICAgIC8vY29uc3Qgcm9vdCA9IChkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnZGVscGhpbmUtcm9vdCcpID8/IGRvY3VtZW50LmJvZHkpIGFzIEhUTUxFbGVtZW50O1xuICAgICAgICAgICAgICAgIC8vY29uc3Qgcm9vdCA9IChkb2N1bWVudC5ib2R5Py5tYXRjaGVzKCdbZGF0YS1jb21wb25lbnRdJykgPyBkb2N1bWVudC5ib2R5IDogbnVsbCkgPz8gKGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdkZWxwaGluZS1yb290JykgYXMgSFRNTEVsZW1lbnQgfCBudWxsKSA/PyBkb2N1bWVudC5ib2R5O1xuICAgICAgICAgICAgICAgIC8vY29uc3Qgcm9vdCA9IHRoaXMucmVzb2x2ZVJvb3QoKTtcblxuICAgICAgICAgICAgICAgIC8vIC0tLSBGT1JNIC0tLVxuICAgICAgICAgICAgICAgIC8vIHByb3Zpc29pcmVtZW50IGlmIChyb290LmdldEF0dHJpYnV0ZSgnZGF0YS1jb21wb25lbnQnKSA9PT0gJ1RGb3JtJykge1xuXG4gICAgICAgICAgICAgICAgdGhpcy5yZWdpc3Rlckluc3RhbmNlKGNvbXBvbmVudC5uYW1lLCBmb3JtKTtcbiAgICAgICAgICAgICAgICAvL31cbiAgICAgICAgICAgICAgICBjb25zdCByb290ID0gY29tcG9uZW50LmVsZW0hO1xuXG4gICAgICAgICAgICAgICAgLy8gLS0tIENISUxEIENPTVBPTkVOVFMgLS0tXG4gICAgICAgICAgICAgICAgcm9vdC5xdWVyeVNlbGVjdG9yQWxsKCc6c2NvcGUgPiBbZGF0YS1jb21wb25lbnRdJykuZm9yRWFjaCgoZWwpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChlbCA9PT0gcm9vdCkgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgbmFtZSA9IGVsLmdldEF0dHJpYnV0ZSgnZGF0YS1uYW1lJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCB0eXBlID0gZWwuZ2V0QXR0cmlidXRlKCdkYXRhLWNvbXBvbmVudCcpO1xuICAgICAgICAgICAgICAgICAgICAgICAgLy9jb25zdCB0aXRpID0gZWwuZ2V0QXR0cmlidXRlKCdkYXRhLW9uY2xpY2snKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgLy9jb25zb2xlLmxvZyhgdGl0aSA9ICR7dGl0aX1gKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgLy9sZXQgY29tcDogVENvbXBvbmVudCB8IG51bGwgPSBudWxsO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBUaGUgZm9sbG93aW5nIHN3aXRjaCBpcyBqdXN0IGZvciBub3cuIEluIHRoZSBmdXR1cmUgaXQgd2lsbCBub3QgYmUgbmVjZXNzYXJ5XG4gICAgICAgICAgICAgICAgICAgICAgICAvKlxuICAgICAgICAgICAgICAgICAgICAgICAgc3dpdGNoICh0eXBlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgJ215LWJ1dHRvbic6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29tcCA9IG5ldyBUQnV0dG9uKG5hbWUhLCBmb3JtLCBmb3JtKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYXNlICdkZWxwaGluZS1wbHVnaW4nOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vY29tcCA9IG5ldyBQbHVnaW5Ib3N0KG5hbWUsIGZvcm0sIGZvcm0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICB9Ki9cbiAgICAgICAgICAgICAgICAgICAgICAgIC8vY29uc3QgYXBwbGljYXRpb246IFRBcHBsaWNhdGlvbiA9IG5ldyBUQXBwbGljYXRpb24oKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vY29uc3QgZmFjdG9yeSA9IFRBcHBsaWNhdGlvbi5UaGVBcHBsaWNhdGlvbi50eXBlcy5nZXQodHlwZSEpO1xuICAgICAgICAgICAgICAgICAgICAgICAgLypcbiAgICAgICAgICAgICAgICAgICAgICAgIGxldCBjb21wOiBUQ29tcG9uZW50IHwgbnVsbCA9IG51bGw7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoZmFjdG9yeSkgY29tcCA9IGZhY3RvcnkobmFtZSEsIGZvcm0sIGZvcm0pO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoY29tcCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb21wLmVsZW0gPSBlbDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5yZWdpc3RlcihuYW1lISwgY29tcCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICovXG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGNscyA9IFRBcHBsaWNhdGlvbi5UaGVBcHBsaWNhdGlvbi50eXBlcy5nZXQodHlwZSEpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFjbHMpIHJldHVybjtcblxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgY2hpbGQgPSBjbHMuY3JlYXRlKG5hbWUhLCBmb3JtLCBjb21wb25lbnQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gbmFtZTogc3RyaW5nLCBmb3JtOiBURm9ybSwgcGFyZW50OiBUQ29tcG9uZW50LCBlbGVtOiBIVE1MRWxlbWVudFxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFjaGlsZCkgcmV0dXJuO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAvL2NoaWxkLnBhcmVudCA9IGNvbXBvbmVudDtcblxuICAgICAgICAgICAgICAgICAgICAgICAgY2hpbGQuZWxlbSA9IGVsO1xuICAgICAgICAgICAgICAgICAgICAgICAgLy9jaGlsZC5mb3JtID0gZm9ybTtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vY2hpbGQubmFtZSA9IG5hbWUhO1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gT3B0aW9uYWwgcHJvcHNcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuYXBwbHlQcm9wcyhjaGlsZCwgY2xzKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucmVnaXN0ZXJJbnN0YW5jZShuYW1lISwgY2hpbGQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgY29tcG9uZW50LmNoaWxkcmVuLnB1c2goY2hpbGQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgbWF5YmVIb3N0ID0gY2hpbGQgYXMgdW5rbm93biBhcyBQYXJ0aWFsPElQbHVnaW5Ib3N0PjtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChtYXliZUhvc3QgJiYgdHlwZW9mIG1heWJlSG9zdC5zZXRQbHVnaW5TcGVjID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHBsdWdpbiA9IGVsLmdldEF0dHJpYnV0ZSgnZGF0YS1wbHVnaW4nKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgcmF3ID0gZWwuZ2V0QXR0cmlidXRlKCdkYXRhLXByb3BzJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHByb3BzID0gcmF3ID8gSlNPTi5wYXJzZShyYXcpIDoge307XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbWF5YmVIb3N0LnNldFBsdWdpblNwZWMoeyBwbHVnaW4sIHByb3BzIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtYXliZUhvc3QubW91bnRQbHVnaW5JZlJlYWR5ISh0aGlzLnNlcnZpY2VzKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy9tYXliZUhvc3QubW91bnRGcm9tUmVnaXN0cnkoc2VydmljZXMpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoY2hpbGQuYWxsb3dzQ2hpbGRyZW4oKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmJ1aWxkQ29tcG9uZW50VHJlZShmb3JtLCBjaGlsZCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbn1cblxuZXhwb3J0IGNsYXNzIFRDb21wb25lbnQge1xuICAgICAgICByZWFkb25seSBtZXRhQ2xhc3M6IFRNZXRhQ29tcG9uZW50PGFueT47XG4gICAgICAgIHJlYWRvbmx5IG5hbWU6IHN0cmluZztcbiAgICAgICAgcmVhZG9ubHkgcGFyZW50OiBUQ29tcG9uZW50IHwgbnVsbCA9IG51bGw7XG4gICAgICAgIGZvcm06IFRGb3JtIHwgbnVsbCA9IG51bGw7XG4gICAgICAgIGNoaWxkcmVuOiBUQ29tcG9uZW50W10gPSBbXTtcblxuICAgICAgICBlbGVtOiBFbGVtZW50IHwgbnVsbCA9IG51bGw7XG4gICAgICAgIGdldCBodG1sRWxlbWVudCgpOiBIVE1MRWxlbWVudCB8IG51bGwge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmVsZW0gYXMgSFRNTEVsZW1lbnQgfCBudWxsO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0cnVjdG9yKG1ldGFDbGFzczogVE1ldGFDb21wb25lbnQ8YW55PiwgbmFtZTogc3RyaW5nLCBmb3JtOiBURm9ybSB8IG51bGwsIHBhcmVudDogVENvbXBvbmVudCB8IG51bGwpIHtcbiAgICAgICAgICAgICAgICB0aGlzLm1ldGFDbGFzcyA9IG1ldGFDbGFzcztcbiAgICAgICAgICAgICAgICB0aGlzLm5hbWUgPSBuYW1lO1xuICAgICAgICAgICAgICAgIHRoaXMucGFyZW50ID0gcGFyZW50O1xuICAgICAgICAgICAgICAgIHBhcmVudD8uY2hpbGRyZW4ucHVzaCh0aGlzKTtcbiAgICAgICAgICAgICAgICB0aGlzLmZvcm0gPSBmb3JtO1xuICAgICAgICAgICAgICAgIHRoaXMubmFtZSA9IG5hbWU7XG4gICAgICAgICAgICAgICAgLy90aGlzLm1ldGFDbGFzcyA9IG1ldGFDbGFzcztcbiAgICAgICAgfVxuXG4gICAgICAgIC8qKiBNYXkgY29udGFpbiBjaGlsZCBjb21wb25lbnRzICovXG4gICAgICAgIGFsbG93c0NoaWxkcmVuKCk6IGJvb2xlYW4ge1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGdldCBjb2xvcigpOiBUQ29sb3Ige1xuICAgICAgICAgICAgICAgIHJldHVybiBuZXcgVENvbG9yKHRoaXMuZ2V0U3R5bGVQcm9wKCdjb2xvcicpKTtcbiAgICAgICAgfVxuICAgICAgICBzZXQgY29sb3IodjogVENvbG9yKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5zZXRTdHlsZVByb3AoJ2NvbG9yJywgdi5zKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGdldCBiYWNrZ3JvdW5kQ29sb3IoKTogVENvbG9yIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gbmV3IFRDb2xvcih0aGlzLmdldFN0eWxlUHJvcCgnYmFja2dyb3VuZC1jb2xvcicpKTtcbiAgICAgICAgfVxuICAgICAgICBzZXQgYmFja2dyb3VuZENvbG9yKHY6IFRDb2xvcikge1xuICAgICAgICAgICAgICAgIHRoaXMuc2V0U3R5bGVQcm9wKCdiYWNrZ3JvdW5kLWNvbG9yJywgdi5zKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGdldCB3aWR0aCgpOiBudW1iZXIge1xuICAgICAgICAgICAgICAgIHJldHVybiBwYXJzZUludCh0aGlzLmdldFN0eWxlUHJvcCgnd2lkdGgnKSk7XG4gICAgICAgIH1cbiAgICAgICAgc2V0IHdpZHRoKHY6IG51bWJlcikge1xuICAgICAgICAgICAgICAgIHRoaXMuc2V0U3R5bGVQcm9wKCd3aWR0aCcsIHYudG9TdHJpbmcoKSk7XG4gICAgICAgIH1cblxuICAgICAgICBnZXQgaGVpZ2h0KCk6IG51bWJlciB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHBhcnNlSW50KHRoaXMuZ2V0U3R5bGVQcm9wKCdoZWlnaHQnKSk7XG4gICAgICAgIH1cbiAgICAgICAgc2V0IGhlaWdodCh2OiBudW1iZXIpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnNldFN0eWxlUHJvcCgnaGVpZ2h0Jywgdi50b1N0cmluZygpKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGdldCBvZmZzZXRXaWR0aCgpOiBudW1iZXIge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmh0bWxFbGVtZW50IS5vZmZzZXRXaWR0aDtcbiAgICAgICAgfVxuICAgICAgICBnZXQgb2Zmc2V0SGVpZ2h0KCk6IG51bWJlciB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuaHRtbEVsZW1lbnQhLm9mZnNldEhlaWdodDtcbiAgICAgICAgfVxuXG4gICAgICAgIHNldFN0eWxlUHJvcChuYW1lOiBzdHJpbmcsIHZhbHVlOiBzdHJpbmcpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmh0bWxFbGVtZW50IS5zdHlsZS5zZXRQcm9wZXJ0eShuYW1lLCB2YWx1ZSk7XG4gICAgICAgIH1cblxuICAgICAgICBnZXRTdHlsZVByb3AobmFtZTogc3RyaW5nKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuaHRtbEVsZW1lbnQhLnN0eWxlLmdldFByb3BlcnR5VmFsdWUobmFtZSk7XG4gICAgICAgIH1cblxuICAgICAgICBzZXRQcm9wKG5hbWU6IHN0cmluZywgdmFsdWU6IHN0cmluZykge1xuICAgICAgICAgICAgICAgIHRoaXMuaHRtbEVsZW1lbnQhLnNldEF0dHJpYnV0ZShuYW1lLCB2YWx1ZSk7XG4gICAgICAgIH1cblxuICAgICAgICBnZXRQcm9wKG5hbWU6IHN0cmluZykge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzIS5odG1sRWxlbWVudCEuZ2V0QXR0cmlidXRlKG5hbWUpO1xuICAgICAgICB9XG59XG5cbmV4cG9ydCBjbGFzcyBURG9jdW1lbnQge1xuICAgICAgICBzdGF0aWMgZG9jdW1lbnQ6IFREb2N1bWVudCA9IG5ldyBURG9jdW1lbnQoZG9jdW1lbnQpO1xuICAgICAgICBzdGF0aWMgYm9keSA9IGRvY3VtZW50LmJvZHk7XG4gICAgICAgIGh0bWxEb2M6IERvY3VtZW50O1xuICAgICAgICBjb25zdHJ1Y3RvcihodG1sRG9jOiBEb2N1bWVudCkge1xuICAgICAgICAgICAgICAgIHRoaXMuaHRtbERvYyA9IGh0bWxEb2M7XG4gICAgICAgIH1cbn1cblxuZXhwb3J0IGNsYXNzIFRNZXRhRm9ybSBleHRlbmRzIFRNZXRhQ29tcG9uZW50PFRGb3JtPiB7XG4gICAgICAgIC8vbWV0YWNsYXNzOiBUTWV0YUNvbXBvbmVudDxURm9ybT47XG4gICAgICAgIHN0YXRpYyBtZXRhY2xhc3M6IFRNZXRhRm9ybSA9IG5ldyBUTWV0YUZvcm0oKTtcbiAgICAgICAgZ2V0TWV0YUNsYXNzKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBUTWV0YUZvcm0ubWV0YWNsYXNzO1xuICAgICAgICB9XG4gICAgICAgIHJlYWRvbmx5IHR5cGVOYW1lID0gJ1RGb3JtJztcblxuICAgICAgICBjcmVhdGUobmFtZTogc3RyaW5nLCBmb3JtOiBURm9ybSwgcGFyZW50OiBUQ29tcG9uZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBURm9ybShuYW1lKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHByb3BzKCk6IFByb3BTcGVjPFRGb3JtPltdIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gW107XG4gICAgICAgIH1cbn1cblxuZXhwb3J0IGNsYXNzIFRGb3JtIGV4dGVuZHMgVENvbXBvbmVudCB7XG4gICAgICAgIGFsbG93c0NoaWxkcmVuKCk6IGJvb2xlYW4ge1xuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIHN0YXRpYyBmb3JtcyA9IG5ldyBNYXA8c3RyaW5nLCBURm9ybT4oKTtcbiAgICAgICAgcHJpdmF0ZSBfbW91bnRlZCA9IGZhbHNlO1xuICAgICAgICAvLyBFYWNoIEZvcm0gaGFzIGl0cyBvd24gY29tcG9uZW50UmVnaXN0cnlcbiAgICAgICAgY29tcG9uZW50UmVnaXN0cnk6IENvbXBvbmVudFJlZ2lzdHJ5ID0gbmV3IENvbXBvbmVudFJlZ2lzdHJ5KCk7XG4gICAgICAgIGNvbnN0cnVjdG9yKG5hbWU6IHN0cmluZykge1xuICAgICAgICAgICAgICAgIHN1cGVyKFRNZXRhRm9ybS5tZXRhY2xhc3MsIG5hbWUsIG51bGwsIG51bGwpO1xuICAgICAgICAgICAgICAgIHRoaXMuZm9ybSA9IHRoaXM7XG4gICAgICAgICAgICAgICAgVEZvcm0uZm9ybXMuc2V0KG5hbWUsIHRoaXMpO1xuICAgICAgICAgICAgICAgIC8vdGhpcy5wYXJlbnQgPSB0aGlzO1xuICAgICAgICB9XG5cbiAgICAgICAgZ2V0IGFwcGxpY2F0aW9uKCk6IFRBcHBsaWNhdGlvbiB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuZm9ybT8uYXBwbGljYXRpb24gPz8gVEFwcGxpY2F0aW9uLlRoZUFwcGxpY2F0aW9uO1xuICAgICAgICB9XG5cbiAgICAgICAgLyogICAgICAgIGZpbmRGb3JtRnJvbUV2ZW50VGFyZ2V0KGN1cnJlbnRUYXJnZXRFbGVtOiBFbGVtZW50KTogVEZvcm0gfCBudWxsIHtcbiAgICAgICAgICAgICAgICBjb25zdCBmb3JtTmFtZSA9IGN1cnJlbnRUYXJnZXRFbGVtLmdldEF0dHJpYnV0ZSgnZGF0YS1uYW1lJyk7XG4gICAgICAgICAgICAgICAgY29uc3QgZm9ybTogVEZvcm0gPSBURm9ybS5mb3Jtcy5nZXQoZm9ybU5hbWUhKSE7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZvcm07XG4gICAgICAgIH1cbiAgICAgICAgICAgICAgICAqL1xuXG4gICAgICAgIC8vIEVuZ2xpc2ggY29tbWVudHMgYXMgcmVxdWVzdGVkLlxuXG4gICAgICAgIGZpbmRGb3JtRnJvbUV2ZW50VGFyZ2V0KHRhcmdldDogRWxlbWVudCk6IFRGb3JtIHwgbnVsbCB7XG4gICAgICAgICAgICAgICAgLy8gMSkgRmluZCB0aGUgbmVhcmVzdCBlbGVtZW50IHRoYXQgbG9va3MgbGlrZSBhIGZvcm0gY29udGFpbmVyXG4gICAgICAgICAgICAgICAgY29uc3QgZm9ybUVsZW0gPSB0YXJnZXQuY2xvc2VzdCgnW2RhdGEtY29tcG9uZW50PVwiVEZvcm1cIl1bZGF0YS1uYW1lXScpIGFzIEVsZW1lbnQgfCBudWxsO1xuICAgICAgICAgICAgICAgIGlmICghZm9ybUVsZW0pIHJldHVybiBudWxsO1xuXG4gICAgICAgICAgICAgICAgLy8gMikgUmVzb2x2ZSB0aGUgVEZvcm0gaW5zdGFuY2VcbiAgICAgICAgICAgICAgICBjb25zdCBmb3JtTmFtZSA9IGZvcm1FbGVtLmdldEF0dHJpYnV0ZSgnZGF0YS1uYW1lJyk7XG4gICAgICAgICAgICAgICAgaWYgKCFmb3JtTmFtZSkgcmV0dXJuIG51bGw7XG5cbiAgICAgICAgICAgICAgICByZXR1cm4gVEZvcm0uZm9ybXMuZ2V0KGZvcm1OYW1lKSA/PyBudWxsO1xuICAgICAgICB9XG5cbiAgICAgICAgcHJpdmF0ZSBfYWM6IEFib3J0Q29udHJvbGxlciB8IG51bGwgPSBudWxsO1xuXG4gICAgICAgIGluc3RhbGxFdmVudFJvdXRlcigpIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9hYz8uYWJvcnQoKTtcbiAgICAgICAgICAgICAgICB0aGlzLl9hYyA9IG5ldyBBYm9ydENvbnRyb2xsZXIoKTtcbiAgICAgICAgICAgICAgICBjb25zdCB7IHNpZ25hbCB9ID0gdGhpcy5fYWM7XG5cbiAgICAgICAgICAgICAgICBjb25zdCByb290ID0gdGhpcy5lbGVtIGFzIEVsZW1lbnQgfCBudWxsO1xuICAgICAgICAgICAgICAgIGlmICghcm9vdCkgcmV0dXJuO1xuXG4gICAgICAgICAgICAgICAgLy8gc2FtZSBoYW5kbGVyIGZvciBldmVyeWJvZHlcbiAgICAgICAgICAgICAgICBjb25zdCBoYW5kbGVyID0gKGV2OiBFdmVudCkgPT4gdGhpcy5kaXNwYXRjaERvbUV2ZW50KGV2KTtcblxuICAgICAgICAgICAgICAgIGZvciAoY29uc3QgdHlwZSBvZiBbJ2NsaWNrJywgJ2lucHV0JywgJ2NoYW5nZScsICdrZXlkb3duJ10pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJvb3QuYWRkRXZlbnRMaXN0ZW5lcih0eXBlLCBoYW5kbGVyLCB7IGNhcHR1cmU6IHRydWUsIHNpZ25hbCB9KTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBmb3IgKGNvbnN0IHR5cGUgaW4gdGhpcy5tZXRhQ2xhc3MuZG9tRXZlbnRzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByb290LmFkZEV2ZW50TGlzdGVuZXIodHlwZSwgaGFuZGxlciwgeyBjYXB0dXJlOiB0cnVlLCBzaWduYWwgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgZGlzcG9zZUV2ZW50Um91dGVyKCkge1xuICAgICAgICAgICAgICAgIHRoaXMuX2FjPy5hYm9ydCgpO1xuICAgICAgICAgICAgICAgIHRoaXMuX2FjID0gbnVsbDtcbiAgICAgICAgfVxuXG4gICAgICAgIHByaXZhdGUgaGFuZGxlRXZlbnQoZXY6IEV2ZW50LCBlbDogRWxlbWVudCwgYXR0cmlidXRlOiBzdHJpbmcpOiBib29sZWFuIHtcbiAgICAgICAgICAgICAgICBjb25zdCBoYW5kbGVyTmFtZSA9IGVsLmdldEF0dHJpYnV0ZShhdHRyaWJ1dGUpO1xuXG4gICAgICAgICAgICAgICAgLy8gSWYgd2UgZm91bmQgYSBoYW5kbGVyIG9uIHRoaXMgZWxlbWVudCwgZGlzcGF0Y2ggaXRcbiAgICAgICAgICAgICAgICBpZiAoaGFuZGxlck5hbWUgJiYgaGFuZGxlck5hbWUgIT09ICcnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBuYW1lID0gZWwuZ2V0QXR0cmlidXRlKCdkYXRhLW5hbWUnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHNlbmRlciA9IG5hbWUgPyAodGhpcy5jb21wb25lbnRSZWdpc3RyeS5nZXQobmFtZSkgPz8gbnVsbCkgOiBudWxsO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBtYXliZU1ldGhvZCA9ICh0aGlzIGFzIGFueSlbaGFuZGxlck5hbWVdO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBtYXliZU1ldGhvZCAhPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnTk9UIEEgTUVUSE9EJywgaGFuZGxlck5hbWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIElmIHNlbmRlciBpcyBtaXNzaW5nLCBmYWxsYmFjayB0byB0aGUgZm9ybSBpdHNlbGYgKHNhZmUpXG4gICAgICAgICAgICAgICAgICAgICAgICAobWF5YmVNZXRob2QgYXMgKGV2ZW50OiBFdmVudCwgc2VuZGVyOiBhbnkpID0+IGFueSkuY2FsbCh0aGlzLCBldiwgc2VuZGVyID8/IHRoaXMpO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFdlIHJlY2VpdmVkIGFuIERPTSBFdmVudC4gRGlzcGF0Y2ggaXRcbiAgICAgICAgcHJpdmF0ZSBkaXNwYXRjaERvbUV2ZW50KGV2OiBFdmVudCkge1xuICAgICAgICAgICAgICAgIGNvbnN0IHRhcmdldEVsZW0gPSBldi50YXJnZXQgYXMgRWxlbWVudCB8IG51bGw7XG4gICAgICAgICAgICAgICAgaWYgKCF0YXJnZXRFbGVtKSByZXR1cm47XG5cbiAgICAgICAgICAgICAgICBjb25zdCBldlR5cGUgPSBldi50eXBlO1xuXG4gICAgICAgICAgICAgICAgbGV0IGVsOiBFbGVtZW50IHwgbnVsbCA9IHRhcmdldEVsZW0uY2xvc2VzdCgnW2RhdGEtY29tcG9uZW50XScpO1xuICAgICAgICAgICAgICAgIHdoaWxlIChlbCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMuaGFuZGxlRXZlbnQoZXYsIGVsLCBgZGF0YS1vbiR7ZXZUeXBlfWApKSByZXR1cm47XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIC8vZWwgPSB0aGlzLm5leHRDb21wb25lbnRFbGVtZW50VXAoZWwpO1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgbmFtZSA9IGVsLmdldEF0dHJpYnV0ZSgnZGF0YS1uYW1lJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBjb21wID0gbmFtZSA/IHRoaXMuY29tcG9uZW50UmVnaXN0cnkuZ2V0KG5hbWUpIDogbnVsbDtcblxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gUHJlZmVyIHlvdXIgVkNMLWxpa2UgcGFyZW50IGNoYWluIHdoZW4gYXZhaWxhYmxlXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBuZXh0ID0gY29tcD8ucGFyZW50Py5lbGVtID8/IG51bGw7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIEZhbGxiYWNrOiBzdGFuZGFyZCBET00gcGFyZW50XG4gICAgICAgICAgICAgICAgICAgICAgICBlbCA9IG5leHQgPz8gZWwucGFyZW50RWxlbWVudD8uY2xvc2VzdCgnW2RhdGEtY29tcG9uZW50XScpID8/IG51bGw7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLy8gTm8gaGFuZGxlciBoZXJlOiB0cnkgZ29pbmcgXCJ1cFwiIHVzaW5nIHlvdXIgY29tcG9uZW50IHRyZWUgaWYgcG9zc2libGVcbiAgICAgICAgfVxuXG4gICAgICAgIHNob3coKSB7XG4gICAgICAgICAgICAgICAgLy8gTXVzdCBiZSBkb25lIGJlZm9yZSBidWlsZENvbXBvbmVudFRyZWUoKSBiZWNhdXNlIGBidWlsZENvbXBvbmVudFRyZWUoKWAgZG9lcyBub3QgZG8gYHJlc29sdmVSb290KClgIGl0c2VsZi5cbiAgICAgICAgICAgICAgICBpZiAoIXRoaXMuZWxlbSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5lbGVtID0gdGhpcy5jb21wb25lbnRSZWdpc3RyeS5yZXNvbHZlUm9vdCgpOyAvLyBvdSB0aGlzLnJlc29sdmVSb290KClcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKCF0aGlzLl9tb3VudGVkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmNvbXBvbmVudFJlZ2lzdHJ5LmJ1aWxkQ29tcG9uZW50VHJlZSh0aGlzLCB0aGlzKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMub25DcmVhdGUoKTsgLy8gTWF5YmUgY291bGQgYmUgZG9uZSBhZnRlciBpbnN0YWxsRXZlbnRSb3V0ZXIoKVxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5pbnN0YWxsRXZlbnRSb3V0ZXIoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vbW91bnRQbHVnaW5JZlJlYWR5KCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAvL3RoaXMuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vdGhpcy5hZGRFdmVudExpc3RlbmVyKCdpbnB1dCcpO1xuICAgICAgICAgICAgICAgICAgICAgICAgLy90aGlzLmFkZEV2ZW50TGlzdGVuZXIoJ2NoYW5nZScpO1xuICAgICAgICAgICAgICAgICAgICAgICAgLy90aGlzLmFkZEV2ZW50TGlzdGVuZXIoJ2tleWRvd24nKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX21vdW50ZWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB0aGlzLm9uU2hvd24oKTtcblxuICAgICAgICAgICAgICAgIC8vIFRPRE9cbiAgICAgICAgfVxuXG4gICAgICAgIC8qXG4gICAgICAgIGFkZEV2ZW50TGlzdGVuZXJ4eHgodHlwZTogc3RyaW5nKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ2FkZEV2ZW50TGlzdGVuZXIgRU5URVInLCB7IGhhc0JvZHk6ICEhZG9jdW1lbnQuYm9keSwgaGFzRWxlbTogISF0aGlzLmVsZW0gfSk7XG4gICAgICAgICAgICAgICAgY29uc3QgZyA9IHdpbmRvdyBhcyBhbnk7XG5cbiAgICAgICAgICAgICAgICAvLyBBYm9ydCBvbGQgbGlzdGVuZXJzIChpZiBhbnkpXG4gICAgICAgICAgICAgICAgaWYgKGcuX19kZWxwaGluZV9hYm9ydF9jb250cm9sbGVyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBnLl9fZGVscGhpbmVfYWJvcnRfY29udHJvbGxlci5hYm9ydCgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBjb25zdCBhYyA9IG5ldyBBYm9ydENvbnRyb2xsZXIoKTtcbiAgICAgICAgICAgICAgICBnLl9fZGVscGhpbmVfYWJvcnRfY29udHJvbGxlciA9IGFjO1xuICAgICAgICAgICAgICAgIGNvbnN0IHsgc2lnbmFsIH0gPSBhYztcblxuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdJbnN0YWxsaW5nIGdsb2JhbCBkZWJ1ZyBsaXN0ZW5lcnMgKHJlc2V0K3JlaW5zdGFsbCknKTtcblxuICAgICAgICAgICAgICAgIGNvbnN0IHJvb3QgPSB0aGlzLmVsZW07XG4gICAgICAgICAgICAgICAgaWYgKCFyb290KSByZXR1cm47XG5cbiAgICAgICAgICAgICAgICAvLyBWb3RyZSBoYW5kbGVyIHN1ciBsZSByb290XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuZWxlbSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gRW5nbGlzaCBjb21tZW50cyBhcyByZXF1ZXN0ZWQuXG5cbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIEVuZ2xpc2ggY29tbWVudHMgYXMgcmVxdWVzdGVkLlxuXG4gICAgICAgICAgICAgICAgICAgICAgICByb290LmFkZEV2ZW50TGlzdGVuZXIoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIChldjogRXZlbnQpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCB0YXJnZXRFbGVtID0gZXYudGFyZ2V0IGFzIEVsZW1lbnQgfCBudWxsO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICghdGFyZ2V0RWxlbSkgcmV0dXJuO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgZm9ybSA9IHRoaXMuZmluZEZvcm1Gcm9tRXZlbnRUYXJnZXQodGFyZ2V0RWxlbSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFmb3JtKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnTm8gZm9ybSByZXNvbHZlZDsgZXZlbnQgaWdub3JlZCcpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGV2VHlwZSA9IGV2LnR5cGU7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBTdGFydCBmcm9tIHRoZSBjbGlja2VkIGNvbXBvbmVudCAob3IgYW55IGNvbXBvbmVudCB3cmFwcGVyKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxldCB0MTogRWxlbWVudCB8IG51bGwgPSB0YXJnZXRFbGVtLmNsb3Nlc3QoJ1tkYXRhLWNvbXBvbmVudF0nKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB3aGlsZSAodDEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGhhbmRsZXJOYW1lID0gdDEuZ2V0QXR0cmlidXRlKGBkYXRhLW9uJHtldlR5cGV9YCk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIElmIHdlIGZvdW5kIGEgaGFuZGxlciBvbiB0aGlzIGVsZW1lbnQsIGRpc3BhdGNoIGl0XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoaGFuZGxlck5hbWUgJiYgaGFuZGxlck5hbWUgIT09ICcnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IG5hbWUgPSB0MS5nZXRBdHRyaWJ1dGUoJ2RhdGEtbmFtZScpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBzZW5kZXIgPSBuYW1lID8gKGZvcm0uY29tcG9uZW50UmVnaXN0cnkuZ2V0KG5hbWUpID8/IG51bGwpIDogbnVsbDtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBtYXliZU1ldGhvZCA9IChmb3JtIGFzIGFueSlbaGFuZGxlck5hbWVdO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAodHlwZW9mIG1heWJlTWV0aG9kICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ05PVCBBIE1FVEhPRCcsIGhhbmRsZXJOYW1lKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBJZiBzZW5kZXIgaXMgbWlzc2luZywgZmFsbGJhY2sgdG8gdGhlIGZvcm0gaXRzZWxmIChzYWZlKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAobWF5YmVNZXRob2QgYXMgKHRoaXM6IFRGb3JtLCBzZW5kZXI6IGFueSkgPT4gYW55KS5jYWxsKGZvcm0sIHNlbmRlciA/PyBmb3JtKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBObyBoYW5kbGVyIGhlcmU6IHRyeSBnb2luZyBcInVwXCIgdXNpbmcgeW91ciBjb21wb25lbnQgdHJlZSBpZiBwb3NzaWJsZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgbmFtZSA9IHQxLmdldEF0dHJpYnV0ZSgnZGF0YS1uYW1lJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBjb21wID0gbmFtZSA/IGZvcm0uY29tcG9uZW50UmVnaXN0cnkuZ2V0KG5hbWUpIDogbnVsbDtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gUHJlZmVyIHlvdXIgVkNMLWxpa2UgcGFyZW50IGNoYWluIHdoZW4gYXZhaWxhYmxlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBuZXh0ID0gY29tcD8ucGFyZW50Py5lbGVtID8/IG51bGw7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEZhbGxiYWNrOiBzdGFuZGFyZCBET00gcGFyZW50XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0MSA9IG5leHQgPz8gdDEucGFyZW50RWxlbWVudD8uY2xvc2VzdCgnW2RhdGEtY29tcG9uZW50XScpID8/IG51bGw7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ0V2ZW50IG5vdCBoYW5kbGVkJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRydWVcbiAgICAgICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgICAgICAgICAgKi9cblxuICAgICAgICBwcm90ZWN0ZWQgb25DcmVhdGUoKSB7XG4gICAgICAgICAgICAgICAgLy9jb25zdCBidG4gPSB0aGlzLmNvbXBvbmVudFJlZ2lzdHJ5LmdldCgnYnV0dG9uMicpO1xuICAgICAgICAgICAgICAgIGNvbnN0IG9uU2hvd25OYW1lID0gdGhpcy5lbGVtIS5nZXRBdHRyaWJ1dGUoJ2RhdGEtb25jcmVhdGUnKTtcbiAgICAgICAgICAgICAgICBpZiAob25TaG93bk5hbWUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHF1ZXVlTWljcm90YXNrKCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgZm4gPSAodGhpcyBhcyBhbnkpW29uU2hvd25OYW1lXTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBmbiA9PT0gJ2Z1bmN0aW9uJykgZm4uY2FsbCh0aGlzLCBudWxsLCB0aGlzKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAvL2lmIChidG4pIGJ0bi5jb2xvciA9IFRDb2xvci5yZ2IoMCwgMCwgMjU1KTtcbiAgICAgICAgfVxuXG4gICAgICAgIHByb3RlY3RlZCBvblNob3duKCkge1xuICAgICAgICAgICAgICAgIC8vY29uc3QgYnRuID0gdGhpcy5jb21wb25lbnRSZWdpc3RyeS5nZXQoJ2J1dHRvbjMnKTtcbiAgICAgICAgICAgICAgICAvL2lmIChidG4pIGJ0bi5jb2xvciA9IFRDb2xvci5yZ2IoMCwgMjU1LCAyNTUpO1xuICAgICAgICAgICAgICAgIGNvbnN0IG9uU2hvd25OYW1lID0gdGhpcy5lbGVtIS5nZXRBdHRyaWJ1dGUoJ2RhdGEtb25zaG93bicpO1xuICAgICAgICAgICAgICAgIGlmIChvblNob3duTmFtZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcXVldWVNaWNyb3Rhc2soKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBmbiA9ICh0aGlzIGFzIGFueSlbb25TaG93bk5hbWVdO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAodHlwZW9mIGZuID09PSAnZnVuY3Rpb24nKSBmbi5jYWxsKHRoaXMsIG51bGwsIHRoaXMpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICB9XG59XG5cbmV4cG9ydCBjbGFzcyBUQnV0dG9uIGV4dGVuZHMgVENvbXBvbmVudCB7XG4gICAgICAgIHByaXZhdGUgX2NhcHRpb246IHN0cmluZyA9ICcnO1xuXG4gICAgICAgIGh0bWxCdXR0b24oKTogSFRNTEJ1dHRvbkVsZW1lbnQge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmh0bWxFbGVtZW50ISBhcyBIVE1MQnV0dG9uRWxlbWVudDtcbiAgICAgICAgfVxuXG4gICAgICAgIGdldCBjYXB0aW9uKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLl9jYXB0aW9uO1xuICAgICAgICB9XG4gICAgICAgIHNldCBjYXB0aW9uKGNhcHRpb24pIHtcbiAgICAgICAgICAgICAgICB0aGlzLnNldENhcHRpb24oY2FwdGlvbik7XG4gICAgICAgIH1cbiAgICAgICAgc2V0Q2FwdGlvbihzOiBzdHJpbmcpIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9jYXB0aW9uID0gcztcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5odG1sRWxlbWVudCkgdGhpcy5odG1sRWxlbWVudC50ZXh0Q29udGVudCA9IHM7XG4gICAgICAgIH1cblxuICAgICAgICBwcml2YXRlIF9lbmFibGVkOiBib29sZWFuID0gdHJ1ZTtcbiAgICAgICAgZ2V0IGVuYWJsZWQoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2VuYWJsZWQ7XG4gICAgICAgIH1cbiAgICAgICAgc2V0IGVuYWJsZWQoZW5hYmxlZCkge1xuICAgICAgICAgICAgICAgIHRoaXMuc2V0RW5hYmxlZChlbmFibGVkKTtcbiAgICAgICAgfVxuICAgICAgICBzZXRFbmFibGVkKGVuYWJsZWQ6IGJvb2xlYW4pIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9lbmFibGVkID0gZW5hYmxlZDtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5odG1sRWxlbWVudCkgdGhpcy5odG1sQnV0dG9uKCkuZGlzYWJsZWQgPSAhZW5hYmxlZDtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0cnVjdG9yKG5hbWU6IHN0cmluZywgZm9ybTogVEZvcm0sIHBhcmVudDogVENvbXBvbmVudCkge1xuICAgICAgICAgICAgICAgIHN1cGVyKFRNZXRhQnV0dG9uLm1ldGFDbGFzcywgbmFtZSwgZm9ybSwgcGFyZW50KTtcbiAgICAgICAgICAgICAgICAvL3N1cGVyKG5hbWUsIGZvcm0sIHBhcmVudCk7XG4gICAgICAgICAgICAgICAgLy90aGlzLm5hbWUgPSBuYW1lO1xuICAgICAgICAgICAgICAgIC8vdGhpcy5mb3JtID0gZm9ybTtcbiAgICAgICAgICAgICAgICAvL3RoaXMucGFyZW50ID0gcGFyZW50O1xuICAgICAgICB9XG59XG5cbmV4cG9ydCBjbGFzcyBUTWV0YUJ1dHRvbiBleHRlbmRzIFRNZXRhQ29tcG9uZW50PFRCdXR0b24+IHtcbiAgICAgICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgICAgICAgICAgc3VwZXIoKTtcbiAgICAgICAgfVxuICAgICAgICBzdGF0aWMgbWV0YUNsYXNzOiBUTWV0YUJ1dHRvbiA9IG5ldyBUTWV0YUJ1dHRvbigpO1xuICAgICAgICBnZXRNZXRhQ2xhc3MoKTogVE1ldGFCdXR0b24ge1xuICAgICAgICAgICAgICAgIHJldHVybiBUTWV0YUJ1dHRvbi5tZXRhQ2xhc3M7XG4gICAgICAgIH1cbiAgICAgICAgcmVhZG9ubHkgdHlwZU5hbWUgPSAnVEJ1dHRvbic7XG5cbiAgICAgICAgY3JlYXRlKG5hbWU6IHN0cmluZywgZm9ybTogVEZvcm0sIHBhcmVudDogVENvbXBvbmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBuZXcgVEJ1dHRvbihuYW1lLCBmb3JtLCBwYXJlbnQpO1xuICAgICAgICB9XG5cbiAgICAgICAgcHJvcHMoKTogUHJvcFNwZWM8VEJ1dHRvbj5bXSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIFtcbiAgICAgICAgICAgICAgICAgICAgICAgIHsgbmFtZTogJ2NhcHRpb24nLCBraW5kOiAnc3RyaW5nJywgYXBwbHk6IChvLCB2KSA9PiAoby5jYXB0aW9uID0gU3RyaW5nKHYpKSB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgeyBuYW1lOiAnZW5hYmxlZCcsIGtpbmQ6ICdib29sZWFuJywgYXBwbHk6IChvLCB2KSA9PiAoby5lbmFibGVkID0gQm9vbGVhbih2KSkgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHsgbmFtZTogJ2NvbG9yJywga2luZDogJ2NvbG9yJywgYXBwbHk6IChvLCB2KSA9PiAoby5jb2xvciA9IHYgYXMgYW55KSB9XG4gICAgICAgICAgICAgICAgXTtcbiAgICAgICAgfVxufVxuXG5leHBvcnQgY2xhc3MgVEFwcGxpY2F0aW9uIHtcbiAgICAgICAgc3RhdGljIFRoZUFwcGxpY2F0aW9uOiBUQXBwbGljYXRpb247XG4gICAgICAgIC8vc3RhdGljIHBsdWdpblJlZ2lzdHJ5ID0gbmV3IFBsdWdpblJlZ2lzdHJ5KCk7XG4gICAgICAgIC8vcGx1Z2luczogSVBsdWdpblJlZ2lzdHJ5O1xuICAgICAgICBwcml2YXRlIGZvcm1zOiBURm9ybVtdID0gW107XG4gICAgICAgIHJlYWRvbmx5IHR5cGVzID0gbmV3IENvbXBvbmVudFR5cGVSZWdpc3RyeSgpO1xuICAgICAgICBtYWluRm9ybTogVEZvcm0gfCBudWxsID0gbnVsbDtcblxuICAgICAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgICAgICAgICBUQXBwbGljYXRpb24uVGhlQXBwbGljYXRpb24gPSB0aGlzO1xuICAgICAgICAgICAgICAgIHJlZ2lzdGVyQnVpbHRpbnModGhpcy50eXBlcyk7XG4gICAgICAgIH1cblxuICAgICAgICBjcmVhdGVGb3JtPFQgZXh0ZW5kcyBURm9ybT4oY3RvcjogbmV3ICguLi5hcmdzOiBhbnlbXSkgPT4gVCwgbmFtZTogc3RyaW5nKTogVCB7XG4gICAgICAgICAgICAgICAgY29uc3QgZiA9IG5ldyBjdG9yKG5hbWUpO1xuICAgICAgICAgICAgICAgIHRoaXMuZm9ybXMucHVzaChmKTtcbiAgICAgICAgICAgICAgICBpZiAoIXRoaXMubWFpbkZvcm0pIHRoaXMubWFpbkZvcm0gPSBmO1xuICAgICAgICAgICAgICAgIHJldHVybiBmO1xuICAgICAgICB9XG5cbiAgICAgICAgcnVuKCkge1xuICAgICAgICAgICAgICAgIHRoaXMucnVuV2hlbkRvbVJlYWR5KCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLm1haW5Gb3JtKSB0aGlzLm1haW5Gb3JtLnNob3coKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsc2UgdGhpcy5hdXRvU3RhcnQoKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIHByb3RlY3RlZCBhdXRvU3RhcnQoKSB7XG4gICAgICAgICAgICAgICAgLy8gZmFsbGJhY2s6IGNob2lzaXIgdW5lIGZvcm0gZW5yZWdpc3Ryw6llLCBvdSBjcsOpZXIgdW5lIGZvcm0gaW1wbGljaXRlXG4gICAgICAgIH1cblxuICAgICAgICBydW5XaGVuRG9tUmVhZHkoZm46ICgpID0+IHZvaWQpIHtcbiAgICAgICAgICAgICAgICBpZiAoZG9jdW1lbnQucmVhZHlTdGF0ZSA9PT0gJ2xvYWRpbmcnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignRE9NQ29udGVudExvYWRlZCcsIGZuLCB7IG9uY2U6IHRydWUgfSk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGZuKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICB9XG59XG5cbi8qXG5cbmV4cG9ydCBjbGFzcyBWdWVDb21wb25lbnQgZXh0ZW5kcyBUQ29tcG9uZW50IHt9XG5cbmV4cG9ydCBjbGFzcyBSZWFjdENvbXBvbmVudCBleHRlbmRzIFRDb21wb25lbnQge31cblxuZXhwb3J0IGNsYXNzIFN2ZWx0ZUNvbXBvbmVudCBleHRlbmRzIFRDb21wb25lbnQge31cblxuZXhwb3J0IGNsYXNzIFBsdWdpbkhvc3Q8UHJvcHMgZXh0ZW5kcyBKc29uID0gSnNvbj4gZXh0ZW5kcyBUQ29tcG9uZW50IHtcbiAgICAgICAgcHJpdmF0ZSBwbHVnaW46IFBsdWdpbjxQcm9wcz47XG4gICAgICAgIHByaXZhdGUgc2VydmljZXM6IERlbHBoaW5lU2VydmljZXM7XG4gICAgICAgIHByaXZhdGUgbW91bnRlZCA9IGZhbHNlO1xuXG4gICAgICAgIGNvbnN0cnVjdG9yKHBsdWdpbjogVUlQbHVnaW48UHJvcHM+LCBzZXJ2aWNlczogRGVscGhpbmVTZXJ2aWNlcykge1xuICAgICAgICAgICAgICAgIHN1cGVyKCd0b3RvJywgbnVsbCwgbnVsbCk7XG4gICAgICAgICAgICAgICAgdGhpcy5wbHVnaW4gPSBwbHVnaW47XG4gICAgICAgICAgICAgICAgdGhpcy5zZXJ2aWNlcyA9IHNlcnZpY2VzO1xuICAgICAgICB9XG5cbiAgICAgICAgbW91bnQocHJvcHM6IFByb3BzKSB7XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMubW91bnRlZCkgdGhyb3cgbmV3IEVycm9yKCdQbHVnaW4gYWxyZWFkeSBtb3VudGVkJyk7XG4gICAgICAgICAgICAgICAgLy90aGlzLnBsdWdpbi5tb3VudCh0aGlzLmh0bWxFbGVtZW50LCBwcm9wcywgdGhpcy5zZXJ2aWNlcyk7XG4gICAgICAgICAgICAgICAgdGhpcy5tb3VudGVkID0gdHJ1ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIHVwZGF0ZShwcm9wczogUHJvcHMpIHtcbiAgICAgICAgICAgICAgICBpZiAoIXRoaXMubW91bnRlZCkgdGhyb3cgbmV3IEVycm9yKCdQbHVnaW4gbm90IG1vdW50ZWQnKTtcbiAgICAgICAgICAgICAgICB0aGlzLnBsdWdpbi51cGRhdGUocHJvcHMpO1xuICAgICAgICB9XG5cbiAgICAgICAgdW5tb3VudCgpIHtcbiAgICAgICAgICAgICAgICBpZiAoIXRoaXMubW91bnRlZCkgcmV0dXJuO1xuICAgICAgICAgICAgICAgIHRoaXMucGx1Z2luLnVubW91bnQoKTtcbiAgICAgICAgICAgICAgICB0aGlzLm1vdW50ZWQgPSBmYWxzZTtcbiAgICAgICAgfVxufVxuICAgICAgICAqL1xuXG5leHBvcnQgY2xhc3MgVE1ldGFQbHVnaW5Ib3N0IGV4dGVuZHMgVE1ldGFDb21wb25lbnQ8VFBsdWdpbkhvc3Q+IHtcbiAgICAgICAgc3RhdGljIG1ldGFDbGFzcyA9IG5ldyBUTWV0YVBsdWdpbkhvc3QoKTtcbiAgICAgICAgZ2V0TWV0YUNsYXNzKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBUTWV0YVBsdWdpbkhvc3QubWV0YUNsYXNzO1xuICAgICAgICB9XG4gICAgICAgIHJlYWRvbmx5IHR5cGVOYW1lID0gJ1RQbHVnaW5Ib3N0JztcblxuICAgICAgICBjcmVhdGUobmFtZTogc3RyaW5nLCBmb3JtOiBURm9ybSwgcGFyZW50OiBUQ29tcG9uZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBUUGx1Z2luSG9zdChuYW1lLCBmb3JtLCBwYXJlbnQpO1xuICAgICAgICB9XG5cbiAgICAgICAgcHJvcHMoKTogUHJvcFNwZWM8VFBsdWdpbkhvc3Q+W10ge1xuICAgICAgICAgICAgICAgIHJldHVybiBbXTtcbiAgICAgICAgfVxufVxuXG5leHBvcnQgY2xhc3MgVFBsdWdpbkhvc3QgZXh0ZW5kcyBUQ29tcG9uZW50IHtcbiAgICAgICAgcHJpdmF0ZSBpbnN0YW5jZTogVUlQbHVnaW5JbnN0YW5jZSB8IG51bGwgPSBudWxsO1xuXG4gICAgICAgIHBsdWdpbk5hbWU6IHN0cmluZyB8IG51bGwgPSBudWxsO1xuICAgICAgICBwbHVnaW5Qcm9wczogSnNvbiA9IHt9O1xuICAgICAgICBwcml2YXRlIGZhY3Rvcnk6IFVJUGx1Z2luRmFjdG9yeSB8IG51bGwgPSBudWxsO1xuXG4gICAgICAgIGNvbnN0cnVjdG9yKG5hbWU6IHN0cmluZywgZm9ybTogVEZvcm0sIHBhcmVudDogVENvbXBvbmVudCkge1xuICAgICAgICAgICAgICAgIHN1cGVyKFRNZXRhUGx1Z2luSG9zdC5tZXRhQ2xhc3MsIG5hbWUsIGZvcm0sIHBhcmVudCk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBDYWxsZWQgYnkgdGhlIG1ldGFjbGFzcyAob3IgYnkgeW91ciByZWdpc3RyeSkgcmlnaHQgYWZ0ZXIgY3JlYXRpb25cbiAgICAgICAgc2V0UGx1Z2luRmFjdG9yeShmYWN0b3J5OiBVSVBsdWdpbkZhY3RvcnkpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmZhY3RvcnkgPSBmYWN0b3J5O1xuICAgICAgICB9XG5cbiAgICAgICAgbW91bnRQbHVnaW4ocHJvcHM6IEpzb24sIHNlcnZpY2VzOiBEZWxwaGluZVNlcnZpY2VzKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgY29udGFpbmVyID0gdGhpcy5odG1sRWxlbWVudDtcbiAgICAgICAgICAgICAgICBpZiAoIWNvbnRhaW5lcikgcmV0dXJuO1xuXG4gICAgICAgICAgICAgICAgaWYgKCF0aGlzLmZhY3RvcnkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlcnZpY2VzLmxvZy53YXJuKCdUUGx1Z2luSG9zdDogbm8gcGx1Z2luIGZhY3Rvcnkgc2V0JywgeyBob3N0OiB0aGlzLm5hbWUgYXMgYW55IH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8vIERpc3Bvc2Ugb2xkIGluc3RhbmNlIGlmIGFueVxuICAgICAgICAgICAgICAgIHRoaXMudW5tb3VudCgpO1xuXG4gICAgICAgICAgICAgICAgLy8gQ3JlYXRlIHBsdWdpbiBpbnN0YW5jZSB0aGVuIG1vdW50XG4gICAgICAgICAgICAgICAgdGhpcy5pbnN0YW5jZSA9IHRoaXMuZmFjdG9yeSh7IGhvc3Q6IHRoaXMsIGZvcm06IHRoaXMuZm9ybSEgfSk7XG4gICAgICAgICAgICAgICAgdGhpcy5pbnN0YW5jZSEubW91bnQoY29udGFpbmVyLCBwcm9wcywgc2VydmljZXMpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gQ2FsbGVkIGJ5IGJ1aWxkQ29tcG9uZW50VHJlZSgpXG4gICAgICAgIHNldFBsdWdpblNwZWMoc3BlYzogeyBwbHVnaW46IHN0cmluZyB8IG51bGw7IHByb3BzOiBhbnkgfSkge1xuICAgICAgICAgICAgICAgIHRoaXMucGx1Z2luTmFtZSA9IHNwZWMucGx1Z2luO1xuICAgICAgICAgICAgICAgIHRoaXMucGx1Z2luUHJvcHMgPSBzcGVjLnByb3BzID8/IHt9O1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gQ2FsbGVkIGJ5IGJ1aWxkQ29tcG9uZW50VHJlZSgpXG4gICAgICAgIG1vdW50UGx1Z2luSWZSZWFkeShzZXJ2aWNlczogRGVscGhpbmVTZXJ2aWNlcykge1xuICAgICAgICAgICAgICAgIGNvbnN0IGNvbnRhaW5lciA9IHRoaXMuaHRtbEVsZW1lbnQ7XG4gICAgICAgICAgICAgICAgaWYgKCFjb250YWluZXIgfHwgIXRoaXMuZm9ybSB8fCAhdGhpcy5wbHVnaW5OYW1lKSByZXR1cm47XG5cbiAgICAgICAgICAgICAgICBjb25zdCBhcHAgPSBUQXBwbGljYXRpb24uVGhlQXBwbGljYXRpb247IC8vIG91IHVuIGFjY8OocyDDqXF1aXZhbGVudFxuICAgICAgICAgICAgICAgIGNvbnN0IGRlZiA9IFBsdWdpblJlZ2lzdHJ5LnBsdWdpblJlZ2lzdHJ5LmdldCh0aGlzLnBsdWdpbk5hbWUpO1xuXG4gICAgICAgICAgICAgICAgaWYgKCFkZWYpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlcnZpY2VzLmxvZy53YXJuKCdVbmtub3duIHBsdWdpbicsIHsgcGx1Z2luOiB0aGlzLnBsdWdpbk5hbWUgYXMgYW55IH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHRoaXMudW5tb3VudCgpO1xuICAgICAgICAgICAgICAgIHRoaXMuaW5zdGFuY2UgPSBkZWYuZmFjdG9yeSh7IGhvc3Q6IHRoaXMsIGZvcm06IHRoaXMuZm9ybSB9KTtcbiAgICAgICAgICAgICAgICB0aGlzLmluc3RhbmNlIS5tb3VudChjb250YWluZXIsIHRoaXMucGx1Z2luUHJvcHMsIHNlcnZpY2VzKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHVwZGF0ZShwcm9wczogYW55KSB7XG4gICAgICAgICAgICAgICAgdGhpcy5wbHVnaW5Qcm9wcyA9IHByb3BzO1xuICAgICAgICAgICAgICAgIHRoaXMuaW5zdGFuY2U/LnVwZGF0ZShwcm9wcyk7XG4gICAgICAgIH1cblxuICAgICAgICB1bm1vdW50KCkge1xuICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmluc3RhbmNlPy51bm1vdW50KCk7XG4gICAgICAgICAgICAgICAgfSBmaW5hbGx5IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuaW5zdGFuY2UgPSBudWxsO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgfVxufVxuXG5leHBvcnQgdHlwZSBVSVBsdWdpbkZhY3Rvcnk8UHJvcHMgZXh0ZW5kcyBKc29uID0gSnNvbj4gPSAoYXJnczogeyBob3N0OiBUUGx1Z2luSG9zdDsgZm9ybTogVEZvcm0gfSkgPT4gVUlQbHVnaW5JbnN0YW5jZTxQcm9wcz47XG5cbmV4cG9ydCBpbnRlcmZhY2UgU2l6ZUhpbnRzIHtcbiAgICAgICAgbWluV2lkdGg/OiBudW1iZXI7XG4gICAgICAgIG1pbkhlaWdodD86IG51bWJlcjtcbiAgICAgICAgcHJlZmVycmVkV2lkdGg/OiBudW1iZXI7XG4gICAgICAgIHByZWZlcnJlZEhlaWdodD86IG51bWJlcjtcbn1cblxuZXhwb3J0IHR5cGUgVUlQbHVnaW5EZWYgPSB7XG4gICAgICAgIGZhY3Rvcnk6IFVJUGx1Z2luRmFjdG9yeTtcbiAgICAgICAgLy8gb3B0aW9ubmVsIDogdW4gc2Now6ltYSBkZSBwcm9wcywgYWlkZSBhdSBkZXNpZ25lclxuICAgICAgICAvLyBwcm9wcz86IFByb3BTY2hlbWE7XG59O1xuXG5leHBvcnQgY2xhc3MgUGx1Z2luUmVnaXN0cnkge1xuICAgICAgICBzdGF0aWMgcGx1Z2luUmVnaXN0cnkgPSBuZXcgUGx1Z2luUmVnaXN0cnkoKTtcbiAgICAgICAgcHJpdmF0ZSByZWFkb25seSBwbHVnaW5zID0gbmV3IE1hcDxzdHJpbmcsIFVJUGx1Z2luRGVmPigpO1xuXG4gICAgICAgIHJlZ2lzdGVyKG5hbWU6IHN0cmluZywgZGVmOiBVSVBsdWdpbkRlZikge1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLnBsdWdpbnMuaGFzKG5hbWUpKSB0aHJvdyBuZXcgRXJyb3IoYFBsdWdpbiBhbHJlYWR5IHJlZ2lzdGVyZWQ6ICR7bmFtZX1gKTtcbiAgICAgICAgICAgICAgICB0aGlzLnBsdWdpbnMuc2V0KG5hbWUsIGRlZik7XG4gICAgICAgIH1cblxuICAgICAgICBnZXQobmFtZTogc3RyaW5nKTogVUlQbHVnaW5EZWYgfCB1bmRlZmluZWQge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLnBsdWdpbnMuZ2V0KG5hbWUpO1xuICAgICAgICB9XG5cbiAgICAgICAgaGFzKG5hbWU6IHN0cmluZyk6IGJvb2xlYW4ge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLnBsdWdpbnMuaGFzKG5hbWUpO1xuICAgICAgICB9XG59XG4iLCIvKipcbiogQHZ1ZS9zaGFyZWQgdjMuNS4yOFxuKiAoYykgMjAxOC1wcmVzZW50IFl1eGkgKEV2YW4pIFlvdSBhbmQgVnVlIGNvbnRyaWJ1dG9yc1xuKiBAbGljZW5zZSBNSVRcbioqL1xuLy8gQF9fTk9fU0lERV9FRkZFQ1RTX19cbmZ1bmN0aW9uIG1ha2VNYXAoc3RyKSB7XG4gIGNvbnN0IG1hcCA9IC8qIEBfX1BVUkVfXyAqLyBPYmplY3QuY3JlYXRlKG51bGwpO1xuICBmb3IgKGNvbnN0IGtleSBvZiBzdHIuc3BsaXQoXCIsXCIpKSBtYXBba2V5XSA9IDE7XG4gIHJldHVybiAodmFsKSA9PiB2YWwgaW4gbWFwO1xufVxuXG5jb25zdCBFTVBUWV9PQkogPSAhIShwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gXCJwcm9kdWN0aW9uXCIpID8gT2JqZWN0LmZyZWV6ZSh7fSkgOiB7fTtcbmNvbnN0IEVNUFRZX0FSUiA9ICEhKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSBcInByb2R1Y3Rpb25cIikgPyBPYmplY3QuZnJlZXplKFtdKSA6IFtdO1xuY29uc3QgTk9PUCA9ICgpID0+IHtcbn07XG5jb25zdCBOTyA9ICgpID0+IGZhbHNlO1xuY29uc3QgaXNPbiA9IChrZXkpID0+IGtleS5jaGFyQ29kZUF0KDApID09PSAxMTEgJiYga2V5LmNoYXJDb2RlQXQoMSkgPT09IDExMCAmJiAvLyB1cHBlcmNhc2UgbGV0dGVyXG4oa2V5LmNoYXJDb2RlQXQoMikgPiAxMjIgfHwga2V5LmNoYXJDb2RlQXQoMikgPCA5Nyk7XG5jb25zdCBpc01vZGVsTGlzdGVuZXIgPSAoa2V5KSA9PiBrZXkuc3RhcnRzV2l0aChcIm9uVXBkYXRlOlwiKTtcbmNvbnN0IGV4dGVuZCA9IE9iamVjdC5hc3NpZ247XG5jb25zdCByZW1vdmUgPSAoYXJyLCBlbCkgPT4ge1xuICBjb25zdCBpID0gYXJyLmluZGV4T2YoZWwpO1xuICBpZiAoaSA+IC0xKSB7XG4gICAgYXJyLnNwbGljZShpLCAxKTtcbiAgfVxufTtcbmNvbnN0IGhhc093blByb3BlcnR5ID0gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eTtcbmNvbnN0IGhhc093biA9ICh2YWwsIGtleSkgPT4gaGFzT3duUHJvcGVydHkuY2FsbCh2YWwsIGtleSk7XG5jb25zdCBpc0FycmF5ID0gQXJyYXkuaXNBcnJheTtcbmNvbnN0IGlzTWFwID0gKHZhbCkgPT4gdG9UeXBlU3RyaW5nKHZhbCkgPT09IFwiW29iamVjdCBNYXBdXCI7XG5jb25zdCBpc1NldCA9ICh2YWwpID0+IHRvVHlwZVN0cmluZyh2YWwpID09PSBcIltvYmplY3QgU2V0XVwiO1xuY29uc3QgaXNEYXRlID0gKHZhbCkgPT4gdG9UeXBlU3RyaW5nKHZhbCkgPT09IFwiW29iamVjdCBEYXRlXVwiO1xuY29uc3QgaXNSZWdFeHAgPSAodmFsKSA9PiB0b1R5cGVTdHJpbmcodmFsKSA9PT0gXCJbb2JqZWN0IFJlZ0V4cF1cIjtcbmNvbnN0IGlzRnVuY3Rpb24gPSAodmFsKSA9PiB0eXBlb2YgdmFsID09PSBcImZ1bmN0aW9uXCI7XG5jb25zdCBpc1N0cmluZyA9ICh2YWwpID0+IHR5cGVvZiB2YWwgPT09IFwic3RyaW5nXCI7XG5jb25zdCBpc1N5bWJvbCA9ICh2YWwpID0+IHR5cGVvZiB2YWwgPT09IFwic3ltYm9sXCI7XG5jb25zdCBpc09iamVjdCA9ICh2YWwpID0+IHZhbCAhPT0gbnVsbCAmJiB0eXBlb2YgdmFsID09PSBcIm9iamVjdFwiO1xuY29uc3QgaXNQcm9taXNlID0gKHZhbCkgPT4ge1xuICByZXR1cm4gKGlzT2JqZWN0KHZhbCkgfHwgaXNGdW5jdGlvbih2YWwpKSAmJiBpc0Z1bmN0aW9uKHZhbC50aGVuKSAmJiBpc0Z1bmN0aW9uKHZhbC5jYXRjaCk7XG59O1xuY29uc3Qgb2JqZWN0VG9TdHJpbmcgPSBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nO1xuY29uc3QgdG9UeXBlU3RyaW5nID0gKHZhbHVlKSA9PiBvYmplY3RUb1N0cmluZy5jYWxsKHZhbHVlKTtcbmNvbnN0IHRvUmF3VHlwZSA9ICh2YWx1ZSkgPT4ge1xuICByZXR1cm4gdG9UeXBlU3RyaW5nKHZhbHVlKS5zbGljZSg4LCAtMSk7XG59O1xuY29uc3QgaXNQbGFpbk9iamVjdCA9ICh2YWwpID0+IHRvVHlwZVN0cmluZyh2YWwpID09PSBcIltvYmplY3QgT2JqZWN0XVwiO1xuY29uc3QgaXNJbnRlZ2VyS2V5ID0gKGtleSkgPT4gaXNTdHJpbmcoa2V5KSAmJiBrZXkgIT09IFwiTmFOXCIgJiYga2V5WzBdICE9PSBcIi1cIiAmJiBcIlwiICsgcGFyc2VJbnQoa2V5LCAxMCkgPT09IGtleTtcbmNvbnN0IGlzUmVzZXJ2ZWRQcm9wID0gLyogQF9fUFVSRV9fICovIG1ha2VNYXAoXG4gIC8vIHRoZSBsZWFkaW5nIGNvbW1hIGlzIGludGVudGlvbmFsIHNvIGVtcHR5IHN0cmluZyBcIlwiIGlzIGFsc28gaW5jbHVkZWRcbiAgXCIsa2V5LHJlZixyZWZfZm9yLHJlZl9rZXksb25Wbm9kZUJlZm9yZU1vdW50LG9uVm5vZGVNb3VudGVkLG9uVm5vZGVCZWZvcmVVcGRhdGUsb25Wbm9kZVVwZGF0ZWQsb25Wbm9kZUJlZm9yZVVubW91bnQsb25Wbm9kZVVubW91bnRlZFwiXG4pO1xuY29uc3QgaXNCdWlsdEluRGlyZWN0aXZlID0gLyogQF9fUFVSRV9fICovIG1ha2VNYXAoXG4gIFwiYmluZCxjbG9hayxlbHNlLWlmLGVsc2UsZm9yLGh0bWwsaWYsbW9kZWwsb24sb25jZSxwcmUsc2hvdyxzbG90LHRleHQsbWVtb1wiXG4pO1xuY29uc3QgY2FjaGVTdHJpbmdGdW5jdGlvbiA9IChmbikgPT4ge1xuICBjb25zdCBjYWNoZSA9IC8qIEBfX1BVUkVfXyAqLyBPYmplY3QuY3JlYXRlKG51bGwpO1xuICByZXR1cm4gKChzdHIpID0+IHtcbiAgICBjb25zdCBoaXQgPSBjYWNoZVtzdHJdO1xuICAgIHJldHVybiBoaXQgfHwgKGNhY2hlW3N0cl0gPSBmbihzdHIpKTtcbiAgfSk7XG59O1xuY29uc3QgY2FtZWxpemVSRSA9IC8tXFx3L2c7XG5jb25zdCBjYW1lbGl6ZSA9IGNhY2hlU3RyaW5nRnVuY3Rpb24oXG4gIChzdHIpID0+IHtcbiAgICByZXR1cm4gc3RyLnJlcGxhY2UoY2FtZWxpemVSRSwgKGMpID0+IGMuc2xpY2UoMSkudG9VcHBlckNhc2UoKSk7XG4gIH1cbik7XG5jb25zdCBoeXBoZW5hdGVSRSA9IC9cXEIoW0EtWl0pL2c7XG5jb25zdCBoeXBoZW5hdGUgPSBjYWNoZVN0cmluZ0Z1bmN0aW9uKFxuICAoc3RyKSA9PiBzdHIucmVwbGFjZShoeXBoZW5hdGVSRSwgXCItJDFcIikudG9Mb3dlckNhc2UoKVxuKTtcbmNvbnN0IGNhcGl0YWxpemUgPSBjYWNoZVN0cmluZ0Z1bmN0aW9uKChzdHIpID0+IHtcbiAgcmV0dXJuIHN0ci5jaGFyQXQoMCkudG9VcHBlckNhc2UoKSArIHN0ci5zbGljZSgxKTtcbn0pO1xuY29uc3QgdG9IYW5kbGVyS2V5ID0gY2FjaGVTdHJpbmdGdW5jdGlvbihcbiAgKHN0cikgPT4ge1xuICAgIGNvbnN0IHMgPSBzdHIgPyBgb24ke2NhcGl0YWxpemUoc3RyKX1gIDogYGA7XG4gICAgcmV0dXJuIHM7XG4gIH1cbik7XG5jb25zdCBoYXNDaGFuZ2VkID0gKHZhbHVlLCBvbGRWYWx1ZSkgPT4gIU9iamVjdC5pcyh2YWx1ZSwgb2xkVmFsdWUpO1xuY29uc3QgaW52b2tlQXJyYXlGbnMgPSAoZm5zLCAuLi5hcmcpID0+IHtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBmbnMubGVuZ3RoOyBpKyspIHtcbiAgICBmbnNbaV0oLi4uYXJnKTtcbiAgfVxufTtcbmNvbnN0IGRlZiA9IChvYmosIGtleSwgdmFsdWUsIHdyaXRhYmxlID0gZmFsc2UpID0+IHtcbiAgT2JqZWN0LmRlZmluZVByb3BlcnR5KG9iaiwga2V5LCB7XG4gICAgY29uZmlndXJhYmxlOiB0cnVlLFxuICAgIGVudW1lcmFibGU6IGZhbHNlLFxuICAgIHdyaXRhYmxlLFxuICAgIHZhbHVlXG4gIH0pO1xufTtcbmNvbnN0IGxvb3NlVG9OdW1iZXIgPSAodmFsKSA9PiB7XG4gIGNvbnN0IG4gPSBwYXJzZUZsb2F0KHZhbCk7XG4gIHJldHVybiBpc05hTihuKSA/IHZhbCA6IG47XG59O1xuY29uc3QgdG9OdW1iZXIgPSAodmFsKSA9PiB7XG4gIGNvbnN0IG4gPSBpc1N0cmluZyh2YWwpID8gTnVtYmVyKHZhbCkgOiBOYU47XG4gIHJldHVybiBpc05hTihuKSA/IHZhbCA6IG47XG59O1xubGV0IF9nbG9iYWxUaGlzO1xuY29uc3QgZ2V0R2xvYmFsVGhpcyA9ICgpID0+IHtcbiAgcmV0dXJuIF9nbG9iYWxUaGlzIHx8IChfZ2xvYmFsVGhpcyA9IHR5cGVvZiBnbG9iYWxUaGlzICE9PSBcInVuZGVmaW5lZFwiID8gZ2xvYmFsVGhpcyA6IHR5cGVvZiBzZWxmICE9PSBcInVuZGVmaW5lZFwiID8gc2VsZiA6IHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cgOiB0eXBlb2YgZ2xvYmFsICE9PSBcInVuZGVmaW5lZFwiID8gZ2xvYmFsIDoge30pO1xufTtcbmNvbnN0IGlkZW50UkUgPSAvXltfJGEtekEtWlxceEEwLVxcdUZGRkZdW18kYS16QS1aMC05XFx4QTAtXFx1RkZGRl0qJC87XG5mdW5jdGlvbiBnZW5Qcm9wc0FjY2Vzc0V4cChuYW1lKSB7XG4gIHJldHVybiBpZGVudFJFLnRlc3QobmFtZSkgPyBgX19wcm9wcy4ke25hbWV9YCA6IGBfX3Byb3BzWyR7SlNPTi5zdHJpbmdpZnkobmFtZSl9XWA7XG59XG5mdW5jdGlvbiBnZW5DYWNoZUtleShzb3VyY2UsIG9wdGlvbnMpIHtcbiAgcmV0dXJuIHNvdXJjZSArIEpTT04uc3RyaW5naWZ5KFxuICAgIG9wdGlvbnMsXG4gICAgKF8sIHZhbCkgPT4gdHlwZW9mIHZhbCA9PT0gXCJmdW5jdGlvblwiID8gdmFsLnRvU3RyaW5nKCkgOiB2YWxcbiAgKTtcbn1cblxuY29uc3QgUGF0Y2hGbGFncyA9IHtcbiAgXCJURVhUXCI6IDEsXG4gIFwiMVwiOiBcIlRFWFRcIixcbiAgXCJDTEFTU1wiOiAyLFxuICBcIjJcIjogXCJDTEFTU1wiLFxuICBcIlNUWUxFXCI6IDQsXG4gIFwiNFwiOiBcIlNUWUxFXCIsXG4gIFwiUFJPUFNcIjogOCxcbiAgXCI4XCI6IFwiUFJPUFNcIixcbiAgXCJGVUxMX1BST1BTXCI6IDE2LFxuICBcIjE2XCI6IFwiRlVMTF9QUk9QU1wiLFxuICBcIk5FRURfSFlEUkFUSU9OXCI6IDMyLFxuICBcIjMyXCI6IFwiTkVFRF9IWURSQVRJT05cIixcbiAgXCJTVEFCTEVfRlJBR01FTlRcIjogNjQsXG4gIFwiNjRcIjogXCJTVEFCTEVfRlJBR01FTlRcIixcbiAgXCJLRVlFRF9GUkFHTUVOVFwiOiAxMjgsXG4gIFwiMTI4XCI6IFwiS0VZRURfRlJBR01FTlRcIixcbiAgXCJVTktFWUVEX0ZSQUdNRU5UXCI6IDI1NixcbiAgXCIyNTZcIjogXCJVTktFWUVEX0ZSQUdNRU5UXCIsXG4gIFwiTkVFRF9QQVRDSFwiOiA1MTIsXG4gIFwiNTEyXCI6IFwiTkVFRF9QQVRDSFwiLFxuICBcIkRZTkFNSUNfU0xPVFNcIjogMTAyNCxcbiAgXCIxMDI0XCI6IFwiRFlOQU1JQ19TTE9UU1wiLFxuICBcIkRFVl9ST09UX0ZSQUdNRU5UXCI6IDIwNDgsXG4gIFwiMjA0OFwiOiBcIkRFVl9ST09UX0ZSQUdNRU5UXCIsXG4gIFwiQ0FDSEVEXCI6IC0xLFxuICBcIi0xXCI6IFwiQ0FDSEVEXCIsXG4gIFwiQkFJTFwiOiAtMixcbiAgXCItMlwiOiBcIkJBSUxcIlxufTtcbmNvbnN0IFBhdGNoRmxhZ05hbWVzID0ge1xuICBbMV06IGBURVhUYCxcbiAgWzJdOiBgQ0xBU1NgLFxuICBbNF06IGBTVFlMRWAsXG4gIFs4XTogYFBST1BTYCxcbiAgWzE2XTogYEZVTExfUFJPUFNgLFxuICBbMzJdOiBgTkVFRF9IWURSQVRJT05gLFxuICBbNjRdOiBgU1RBQkxFX0ZSQUdNRU5UYCxcbiAgWzEyOF06IGBLRVlFRF9GUkFHTUVOVGAsXG4gIFsyNTZdOiBgVU5LRVlFRF9GUkFHTUVOVGAsXG4gIFs1MTJdOiBgTkVFRF9QQVRDSGAsXG4gIFsxMDI0XTogYERZTkFNSUNfU0xPVFNgLFxuICBbMjA0OF06IGBERVZfUk9PVF9GUkFHTUVOVGAsXG4gIFstMV06IGBDQUNIRURgLFxuICBbLTJdOiBgQkFJTGBcbn07XG5cbmNvbnN0IFNoYXBlRmxhZ3MgPSB7XG4gIFwiRUxFTUVOVFwiOiAxLFxuICBcIjFcIjogXCJFTEVNRU5UXCIsXG4gIFwiRlVOQ1RJT05BTF9DT01QT05FTlRcIjogMixcbiAgXCIyXCI6IFwiRlVOQ1RJT05BTF9DT01QT05FTlRcIixcbiAgXCJTVEFURUZVTF9DT01QT05FTlRcIjogNCxcbiAgXCI0XCI6IFwiU1RBVEVGVUxfQ09NUE9ORU5UXCIsXG4gIFwiVEVYVF9DSElMRFJFTlwiOiA4LFxuICBcIjhcIjogXCJURVhUX0NISUxEUkVOXCIsXG4gIFwiQVJSQVlfQ0hJTERSRU5cIjogMTYsXG4gIFwiMTZcIjogXCJBUlJBWV9DSElMRFJFTlwiLFxuICBcIlNMT1RTX0NISUxEUkVOXCI6IDMyLFxuICBcIjMyXCI6IFwiU0xPVFNfQ0hJTERSRU5cIixcbiAgXCJURUxFUE9SVFwiOiA2NCxcbiAgXCI2NFwiOiBcIlRFTEVQT1JUXCIsXG4gIFwiU1VTUEVOU0VcIjogMTI4LFxuICBcIjEyOFwiOiBcIlNVU1BFTlNFXCIsXG4gIFwiQ09NUE9ORU5UX1NIT1VMRF9LRUVQX0FMSVZFXCI6IDI1NixcbiAgXCIyNTZcIjogXCJDT01QT05FTlRfU0hPVUxEX0tFRVBfQUxJVkVcIixcbiAgXCJDT01QT05FTlRfS0VQVF9BTElWRVwiOiA1MTIsXG4gIFwiNTEyXCI6IFwiQ09NUE9ORU5UX0tFUFRfQUxJVkVcIixcbiAgXCJDT01QT05FTlRcIjogNixcbiAgXCI2XCI6IFwiQ09NUE9ORU5UXCJcbn07XG5cbmNvbnN0IFNsb3RGbGFncyA9IHtcbiAgXCJTVEFCTEVcIjogMSxcbiAgXCIxXCI6IFwiU1RBQkxFXCIsXG4gIFwiRFlOQU1JQ1wiOiAyLFxuICBcIjJcIjogXCJEWU5BTUlDXCIsXG4gIFwiRk9SV0FSREVEXCI6IDMsXG4gIFwiM1wiOiBcIkZPUldBUkRFRFwiXG59O1xuY29uc3Qgc2xvdEZsYWdzVGV4dCA9IHtcbiAgWzFdOiBcIlNUQUJMRVwiLFxuICBbMl06IFwiRFlOQU1JQ1wiLFxuICBbM106IFwiRk9SV0FSREVEXCJcbn07XG5cbmNvbnN0IEdMT0JBTFNfQUxMT1dFRCA9IFwiSW5maW5pdHksdW5kZWZpbmVkLE5hTixpc0Zpbml0ZSxpc05hTixwYXJzZUZsb2F0LHBhcnNlSW50LGRlY29kZVVSSSxkZWNvZGVVUklDb21wb25lbnQsZW5jb2RlVVJJLGVuY29kZVVSSUNvbXBvbmVudCxNYXRoLE51bWJlcixEYXRlLEFycmF5LE9iamVjdCxCb29sZWFuLFN0cmluZyxSZWdFeHAsTWFwLFNldCxKU09OLEludGwsQmlnSW50LGNvbnNvbGUsRXJyb3IsU3ltYm9sXCI7XG5jb25zdCBpc0dsb2JhbGx5QWxsb3dlZCA9IC8qIEBfX1BVUkVfXyAqLyBtYWtlTWFwKEdMT0JBTFNfQUxMT1dFRCk7XG5jb25zdCBpc0dsb2JhbGx5V2hpdGVsaXN0ZWQgPSBpc0dsb2JhbGx5QWxsb3dlZDtcblxuY29uc3QgcmFuZ2UgPSAyO1xuZnVuY3Rpb24gZ2VuZXJhdGVDb2RlRnJhbWUoc291cmNlLCBzdGFydCA9IDAsIGVuZCA9IHNvdXJjZS5sZW5ndGgpIHtcbiAgc3RhcnQgPSBNYXRoLm1heCgwLCBNYXRoLm1pbihzdGFydCwgc291cmNlLmxlbmd0aCkpO1xuICBlbmQgPSBNYXRoLm1heCgwLCBNYXRoLm1pbihlbmQsIHNvdXJjZS5sZW5ndGgpKTtcbiAgaWYgKHN0YXJ0ID4gZW5kKSByZXR1cm4gXCJcIjtcbiAgbGV0IGxpbmVzID0gc291cmNlLnNwbGl0KC8oXFxyP1xcbikvKTtcbiAgY29uc3QgbmV3bGluZVNlcXVlbmNlcyA9IGxpbmVzLmZpbHRlcigoXywgaWR4KSA9PiBpZHggJSAyID09PSAxKTtcbiAgbGluZXMgPSBsaW5lcy5maWx0ZXIoKF8sIGlkeCkgPT4gaWR4ICUgMiA9PT0gMCk7XG4gIGxldCBjb3VudCA9IDA7XG4gIGNvbnN0IHJlcyA9IFtdO1xuICBmb3IgKGxldCBpID0gMDsgaSA8IGxpbmVzLmxlbmd0aDsgaSsrKSB7XG4gICAgY291bnQgKz0gbGluZXNbaV0ubGVuZ3RoICsgKG5ld2xpbmVTZXF1ZW5jZXNbaV0gJiYgbmV3bGluZVNlcXVlbmNlc1tpXS5sZW5ndGggfHwgMCk7XG4gICAgaWYgKGNvdW50ID49IHN0YXJ0KSB7XG4gICAgICBmb3IgKGxldCBqID0gaSAtIHJhbmdlOyBqIDw9IGkgKyByYW5nZSB8fCBlbmQgPiBjb3VudDsgaisrKSB7XG4gICAgICAgIGlmIChqIDwgMCB8fCBqID49IGxpbmVzLmxlbmd0aCkgY29udGludWU7XG4gICAgICAgIGNvbnN0IGxpbmUgPSBqICsgMTtcbiAgICAgICAgcmVzLnB1c2goXG4gICAgICAgICAgYCR7bGluZX0ke1wiIFwiLnJlcGVhdChNYXRoLm1heCgzIC0gU3RyaW5nKGxpbmUpLmxlbmd0aCwgMCkpfXwgICR7bGluZXNbal19YFxuICAgICAgICApO1xuICAgICAgICBjb25zdCBsaW5lTGVuZ3RoID0gbGluZXNbal0ubGVuZ3RoO1xuICAgICAgICBjb25zdCBuZXdMaW5lU2VxTGVuZ3RoID0gbmV3bGluZVNlcXVlbmNlc1tqXSAmJiBuZXdsaW5lU2VxdWVuY2VzW2pdLmxlbmd0aCB8fCAwO1xuICAgICAgICBpZiAoaiA9PT0gaSkge1xuICAgICAgICAgIGNvbnN0IHBhZCA9IHN0YXJ0IC0gKGNvdW50IC0gKGxpbmVMZW5ndGggKyBuZXdMaW5lU2VxTGVuZ3RoKSk7XG4gICAgICAgICAgY29uc3QgbGVuZ3RoID0gTWF0aC5tYXgoXG4gICAgICAgICAgICAxLFxuICAgICAgICAgICAgZW5kID4gY291bnQgPyBsaW5lTGVuZ3RoIC0gcGFkIDogZW5kIC0gc3RhcnRcbiAgICAgICAgICApO1xuICAgICAgICAgIHJlcy5wdXNoKGAgICB8ICBgICsgXCIgXCIucmVwZWF0KHBhZCkgKyBcIl5cIi5yZXBlYXQobGVuZ3RoKSk7XG4gICAgICAgIH0gZWxzZSBpZiAoaiA+IGkpIHtcbiAgICAgICAgICBpZiAoZW5kID4gY291bnQpIHtcbiAgICAgICAgICAgIGNvbnN0IGxlbmd0aCA9IE1hdGgubWF4KE1hdGgubWluKGVuZCAtIGNvdW50LCBsaW5lTGVuZ3RoKSwgMSk7XG4gICAgICAgICAgICByZXMucHVzaChgICAgfCAgYCArIFwiXlwiLnJlcGVhdChsZW5ndGgpKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgY291bnQgKz0gbGluZUxlbmd0aCArIG5ld0xpbmVTZXFMZW5ndGg7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGJyZWFrO1xuICAgIH1cbiAgfVxuICByZXR1cm4gcmVzLmpvaW4oXCJcXG5cIik7XG59XG5cbmZ1bmN0aW9uIG5vcm1hbGl6ZVN0eWxlKHZhbHVlKSB7XG4gIGlmIChpc0FycmF5KHZhbHVlKSkge1xuICAgIGNvbnN0IHJlcyA9IHt9O1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdmFsdWUubGVuZ3RoOyBpKyspIHtcbiAgICAgIGNvbnN0IGl0ZW0gPSB2YWx1ZVtpXTtcbiAgICAgIGNvbnN0IG5vcm1hbGl6ZWQgPSBpc1N0cmluZyhpdGVtKSA/IHBhcnNlU3RyaW5nU3R5bGUoaXRlbSkgOiBub3JtYWxpemVTdHlsZShpdGVtKTtcbiAgICAgIGlmIChub3JtYWxpemVkKSB7XG4gICAgICAgIGZvciAoY29uc3Qga2V5IGluIG5vcm1hbGl6ZWQpIHtcbiAgICAgICAgICByZXNba2V5XSA9IG5vcm1hbGl6ZWRba2V5XTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gcmVzO1xuICB9IGVsc2UgaWYgKGlzU3RyaW5nKHZhbHVlKSB8fCBpc09iamVjdCh2YWx1ZSkpIHtcbiAgICByZXR1cm4gdmFsdWU7XG4gIH1cbn1cbmNvbnN0IGxpc3REZWxpbWl0ZXJSRSA9IC87KD8hW14oXSpcXCkpL2c7XG5jb25zdCBwcm9wZXJ0eURlbGltaXRlclJFID0gLzooW15dKykvO1xuY29uc3Qgc3R5bGVDb21tZW50UkUgPSAvXFwvXFwqW15dKj9cXCpcXC8vZztcbmZ1bmN0aW9uIHBhcnNlU3RyaW5nU3R5bGUoY3NzVGV4dCkge1xuICBjb25zdCByZXQgPSB7fTtcbiAgY3NzVGV4dC5yZXBsYWNlKHN0eWxlQ29tbWVudFJFLCBcIlwiKS5zcGxpdChsaXN0RGVsaW1pdGVyUkUpLmZvckVhY2goKGl0ZW0pID0+IHtcbiAgICBpZiAoaXRlbSkge1xuICAgICAgY29uc3QgdG1wID0gaXRlbS5zcGxpdChwcm9wZXJ0eURlbGltaXRlclJFKTtcbiAgICAgIHRtcC5sZW5ndGggPiAxICYmIChyZXRbdG1wWzBdLnRyaW0oKV0gPSB0bXBbMV0udHJpbSgpKTtcbiAgICB9XG4gIH0pO1xuICByZXR1cm4gcmV0O1xufVxuZnVuY3Rpb24gc3RyaW5naWZ5U3R5bGUoc3R5bGVzKSB7XG4gIGlmICghc3R5bGVzKSByZXR1cm4gXCJcIjtcbiAgaWYgKGlzU3RyaW5nKHN0eWxlcykpIHJldHVybiBzdHlsZXM7XG4gIGxldCByZXQgPSBcIlwiO1xuICBmb3IgKGNvbnN0IGtleSBpbiBzdHlsZXMpIHtcbiAgICBjb25zdCB2YWx1ZSA9IHN0eWxlc1trZXldO1xuICAgIGlmIChpc1N0cmluZyh2YWx1ZSkgfHwgdHlwZW9mIHZhbHVlID09PSBcIm51bWJlclwiKSB7XG4gICAgICBjb25zdCBub3JtYWxpemVkS2V5ID0ga2V5LnN0YXJ0c1dpdGgoYC0tYCkgPyBrZXkgOiBoeXBoZW5hdGUoa2V5KTtcbiAgICAgIHJldCArPSBgJHtub3JtYWxpemVkS2V5fToke3ZhbHVlfTtgO1xuICAgIH1cbiAgfVxuICByZXR1cm4gcmV0O1xufVxuZnVuY3Rpb24gbm9ybWFsaXplQ2xhc3ModmFsdWUpIHtcbiAgbGV0IHJlcyA9IFwiXCI7XG4gIGlmIChpc1N0cmluZyh2YWx1ZSkpIHtcbiAgICByZXMgPSB2YWx1ZTtcbiAgfSBlbHNlIGlmIChpc0FycmF5KHZhbHVlKSkge1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdmFsdWUubGVuZ3RoOyBpKyspIHtcbiAgICAgIGNvbnN0IG5vcm1hbGl6ZWQgPSBub3JtYWxpemVDbGFzcyh2YWx1ZVtpXSk7XG4gICAgICBpZiAobm9ybWFsaXplZCkge1xuICAgICAgICByZXMgKz0gbm9ybWFsaXplZCArIFwiIFwiO1xuICAgICAgfVxuICAgIH1cbiAgfSBlbHNlIGlmIChpc09iamVjdCh2YWx1ZSkpIHtcbiAgICBmb3IgKGNvbnN0IG5hbWUgaW4gdmFsdWUpIHtcbiAgICAgIGlmICh2YWx1ZVtuYW1lXSkge1xuICAgICAgICByZXMgKz0gbmFtZSArIFwiIFwiO1xuICAgICAgfVxuICAgIH1cbiAgfVxuICByZXR1cm4gcmVzLnRyaW0oKTtcbn1cbmZ1bmN0aW9uIG5vcm1hbGl6ZVByb3BzKHByb3BzKSB7XG4gIGlmICghcHJvcHMpIHJldHVybiBudWxsO1xuICBsZXQgeyBjbGFzczoga2xhc3MsIHN0eWxlIH0gPSBwcm9wcztcbiAgaWYgKGtsYXNzICYmICFpc1N0cmluZyhrbGFzcykpIHtcbiAgICBwcm9wcy5jbGFzcyA9IG5vcm1hbGl6ZUNsYXNzKGtsYXNzKTtcbiAgfVxuICBpZiAoc3R5bGUpIHtcbiAgICBwcm9wcy5zdHlsZSA9IG5vcm1hbGl6ZVN0eWxlKHN0eWxlKTtcbiAgfVxuICByZXR1cm4gcHJvcHM7XG59XG5cbmNvbnN0IEhUTUxfVEFHUyA9IFwiaHRtbCxib2R5LGJhc2UsaGVhZCxsaW5rLG1ldGEsc3R5bGUsdGl0bGUsYWRkcmVzcyxhcnRpY2xlLGFzaWRlLGZvb3RlcixoZWFkZXIsaGdyb3VwLGgxLGgyLGgzLGg0LGg1LGg2LG5hdixzZWN0aW9uLGRpdixkZCxkbCxkdCxmaWdjYXB0aW9uLGZpZ3VyZSxwaWN0dXJlLGhyLGltZyxsaSxtYWluLG9sLHAscHJlLHVsLGEsYixhYmJyLGJkaSxiZG8sYnIsY2l0ZSxjb2RlLGRhdGEsZGZuLGVtLGksa2JkLG1hcmsscSxycCxydCxydWJ5LHMsc2FtcCxzbWFsbCxzcGFuLHN0cm9uZyxzdWIsc3VwLHRpbWUsdSx2YXIsd2JyLGFyZWEsYXVkaW8sbWFwLHRyYWNrLHZpZGVvLGVtYmVkLG9iamVjdCxwYXJhbSxzb3VyY2UsY2FudmFzLHNjcmlwdCxub3NjcmlwdCxkZWwsaW5zLGNhcHRpb24sY29sLGNvbGdyb3VwLHRhYmxlLHRoZWFkLHRib2R5LHRkLHRoLHRyLGJ1dHRvbixkYXRhbGlzdCxmaWVsZHNldCxmb3JtLGlucHV0LGxhYmVsLGxlZ2VuZCxtZXRlcixvcHRncm91cCxvcHRpb24sb3V0cHV0LHByb2dyZXNzLHNlbGVjdCx0ZXh0YXJlYSxkZXRhaWxzLGRpYWxvZyxtZW51LHN1bW1hcnksdGVtcGxhdGUsYmxvY2txdW90ZSxpZnJhbWUsdGZvb3RcIjtcbmNvbnN0IFNWR19UQUdTID0gXCJzdmcsYW5pbWF0ZSxhbmltYXRlTW90aW9uLGFuaW1hdGVUcmFuc2Zvcm0sY2lyY2xlLGNsaXBQYXRoLGNvbG9yLXByb2ZpbGUsZGVmcyxkZXNjLGRpc2NhcmQsZWxsaXBzZSxmZUJsZW5kLGZlQ29sb3JNYXRyaXgsZmVDb21wb25lbnRUcmFuc2ZlcixmZUNvbXBvc2l0ZSxmZUNvbnZvbHZlTWF0cml4LGZlRGlmZnVzZUxpZ2h0aW5nLGZlRGlzcGxhY2VtZW50TWFwLGZlRGlzdGFudExpZ2h0LGZlRHJvcFNoYWRvdyxmZUZsb29kLGZlRnVuY0EsZmVGdW5jQixmZUZ1bmNHLGZlRnVuY1IsZmVHYXVzc2lhbkJsdXIsZmVJbWFnZSxmZU1lcmdlLGZlTWVyZ2VOb2RlLGZlTW9ycGhvbG9neSxmZU9mZnNldCxmZVBvaW50TGlnaHQsZmVTcGVjdWxhckxpZ2h0aW5nLGZlU3BvdExpZ2h0LGZlVGlsZSxmZVR1cmJ1bGVuY2UsZmlsdGVyLGZvcmVpZ25PYmplY3QsZyxoYXRjaCxoYXRjaHBhdGgsaW1hZ2UsbGluZSxsaW5lYXJHcmFkaWVudCxtYXJrZXIsbWFzayxtZXNoLG1lc2hncmFkaWVudCxtZXNocGF0Y2gsbWVzaHJvdyxtZXRhZGF0YSxtcGF0aCxwYXRoLHBhdHRlcm4scG9seWdvbixwb2x5bGluZSxyYWRpYWxHcmFkaWVudCxyZWN0LHNldCxzb2xpZGNvbG9yLHN0b3Asc3dpdGNoLHN5bWJvbCx0ZXh0LHRleHRQYXRoLHRpdGxlLHRzcGFuLHVua25vd24sdXNlLHZpZXdcIjtcbmNvbnN0IE1BVEhfVEFHUyA9IFwiYW5ub3RhdGlvbixhbm5vdGF0aW9uLXhtbCxtYWN0aW9uLG1hbGlnbmdyb3VwLG1hbGlnbm1hcmssbWF0aCxtZW5jbG9zZSxtZXJyb3IsbWZlbmNlZCxtZnJhYyxtZnJhY3Rpb24sbWdseXBoLG1pLG1sYWJlbGVkdHIsbWxvbmdkaXYsbW11bHRpc2NyaXB0cyxtbixtbyxtb3ZlcixtcGFkZGVkLG1waGFudG9tLG1wcmVzY3JpcHRzLG1yb290LG1yb3csbXMsbXNjYXJyaWVzLG1zY2FycnksbXNncm91cCxtc2xpbmUsbXNwYWNlLG1zcXJ0LG1zcm93LG1zdGFjayxtc3R5bGUsbXN1Yixtc3Vic3VwLG1zdXAsbXRhYmxlLG10ZCxtdGV4dCxtdHIsbXVuZGVyLG11bmRlcm92ZXIsbm9uZSxzZW1hbnRpY3NcIjtcbmNvbnN0IFZPSURfVEFHUyA9IFwiYXJlYSxiYXNlLGJyLGNvbCxlbWJlZCxocixpbWcsaW5wdXQsbGluayxtZXRhLHBhcmFtLHNvdXJjZSx0cmFjayx3YnJcIjtcbmNvbnN0IGlzSFRNTFRhZyA9IC8qIEBfX1BVUkVfXyAqLyBtYWtlTWFwKEhUTUxfVEFHUyk7XG5jb25zdCBpc1NWR1RhZyA9IC8qIEBfX1BVUkVfXyAqLyBtYWtlTWFwKFNWR19UQUdTKTtcbmNvbnN0IGlzTWF0aE1MVGFnID0gLyogQF9fUFVSRV9fICovIG1ha2VNYXAoTUFUSF9UQUdTKTtcbmNvbnN0IGlzVm9pZFRhZyA9IC8qIEBfX1BVUkVfXyAqLyBtYWtlTWFwKFZPSURfVEFHUyk7XG5cbmNvbnN0IHNwZWNpYWxCb29sZWFuQXR0cnMgPSBgaXRlbXNjb3BlLGFsbG93ZnVsbHNjcmVlbixmb3Jtbm92YWxpZGF0ZSxpc21hcCxub21vZHVsZSxub3ZhbGlkYXRlLHJlYWRvbmx5YDtcbmNvbnN0IGlzU3BlY2lhbEJvb2xlYW5BdHRyID0gLyogQF9fUFVSRV9fICovIG1ha2VNYXAoc3BlY2lhbEJvb2xlYW5BdHRycyk7XG5jb25zdCBpc0Jvb2xlYW5BdHRyID0gLyogQF9fUFVSRV9fICovIG1ha2VNYXAoXG4gIHNwZWNpYWxCb29sZWFuQXR0cnMgKyBgLGFzeW5jLGF1dG9mb2N1cyxhdXRvcGxheSxjb250cm9scyxkZWZhdWx0LGRlZmVyLGRpc2FibGVkLGhpZGRlbixpbmVydCxsb29wLG9wZW4scmVxdWlyZWQscmV2ZXJzZWQsc2NvcGVkLHNlYW1sZXNzLGNoZWNrZWQsbXV0ZWQsbXVsdGlwbGUsc2VsZWN0ZWRgXG4pO1xuZnVuY3Rpb24gaW5jbHVkZUJvb2xlYW5BdHRyKHZhbHVlKSB7XG4gIHJldHVybiAhIXZhbHVlIHx8IHZhbHVlID09PSBcIlwiO1xufVxuY29uc3QgdW5zYWZlQXR0ckNoYXJSRSA9IC9bPi89XCInXFx1MDAwOVxcdTAwMGFcXHUwMDBjXFx1MDAyMF0vO1xuY29uc3QgYXR0clZhbGlkYXRpb25DYWNoZSA9IHt9O1xuZnVuY3Rpb24gaXNTU1JTYWZlQXR0ck5hbWUobmFtZSkge1xuICBpZiAoYXR0clZhbGlkYXRpb25DYWNoZS5oYXNPd25Qcm9wZXJ0eShuYW1lKSkge1xuICAgIHJldHVybiBhdHRyVmFsaWRhdGlvbkNhY2hlW25hbWVdO1xuICB9XG4gIGNvbnN0IGlzVW5zYWZlID0gdW5zYWZlQXR0ckNoYXJSRS50ZXN0KG5hbWUpO1xuICBpZiAoaXNVbnNhZmUpIHtcbiAgICBjb25zb2xlLmVycm9yKGB1bnNhZmUgYXR0cmlidXRlIG5hbWU6ICR7bmFtZX1gKTtcbiAgfVxuICByZXR1cm4gYXR0clZhbGlkYXRpb25DYWNoZVtuYW1lXSA9ICFpc1Vuc2FmZTtcbn1cbmNvbnN0IHByb3BzVG9BdHRyTWFwID0ge1xuICBhY2NlcHRDaGFyc2V0OiBcImFjY2VwdC1jaGFyc2V0XCIsXG4gIGNsYXNzTmFtZTogXCJjbGFzc1wiLFxuICBodG1sRm9yOiBcImZvclwiLFxuICBodHRwRXF1aXY6IFwiaHR0cC1lcXVpdlwiXG59O1xuY29uc3QgaXNLbm93bkh0bWxBdHRyID0gLyogQF9fUFVSRV9fICovIG1ha2VNYXAoXG4gIGBhY2NlcHQsYWNjZXB0LWNoYXJzZXQsYWNjZXNza2V5LGFjdGlvbixhbGlnbixhbGxvdyxhbHQsYXN5bmMsYXV0b2NhcGl0YWxpemUsYXV0b2NvbXBsZXRlLGF1dG9mb2N1cyxhdXRvcGxheSxiYWNrZ3JvdW5kLGJnY29sb3IsYm9yZGVyLGJ1ZmZlcmVkLGNhcHR1cmUsY2hhbGxlbmdlLGNoYXJzZXQsY2hlY2tlZCxjaXRlLGNsYXNzLGNvZGUsY29kZWJhc2UsY29sb3IsY29scyxjb2xzcGFuLGNvbnRlbnQsY29udGVudGVkaXRhYmxlLGNvbnRleHRtZW51LGNvbnRyb2xzLGNvb3Jkcyxjcm9zc29yaWdpbixjc3AsZGF0YSxkYXRldGltZSxkZWNvZGluZyxkZWZhdWx0LGRlZmVyLGRpcixkaXJuYW1lLGRpc2FibGVkLGRvd25sb2FkLGRyYWdnYWJsZSxkcm9wem9uZSxlbmN0eXBlLGVudGVya2V5aGludCxmb3IsZm9ybSxmb3JtYWN0aW9uLGZvcm1lbmN0eXBlLGZvcm1tZXRob2QsZm9ybW5vdmFsaWRhdGUsZm9ybXRhcmdldCxoZWFkZXJzLGhlaWdodCxoaWRkZW4saGlnaCxocmVmLGhyZWZsYW5nLGh0dHAtZXF1aXYsaWNvbixpZCxpbXBvcnRhbmNlLGluZXJ0LGludGVncml0eSxpc21hcCxpdGVtcHJvcCxrZXl0eXBlLGtpbmQsbGFiZWwsbGFuZyxsYW5ndWFnZSxsb2FkaW5nLGxpc3QsbG9vcCxsb3csbWFuaWZlc3QsbWF4LG1heGxlbmd0aCxtaW5sZW5ndGgsbWVkaWEsbWluLG11bHRpcGxlLG11dGVkLG5hbWUsbm92YWxpZGF0ZSxvcGVuLG9wdGltdW0scGF0dGVybixwaW5nLHBsYWNlaG9sZGVyLHBvc3RlcixwcmVsb2FkLHJhZGlvZ3JvdXAscmVhZG9ubHkscmVmZXJyZXJwb2xpY3kscmVsLHJlcXVpcmVkLHJldmVyc2VkLHJvd3Mscm93c3BhbixzYW5kYm94LHNjb3BlLHNjb3BlZCxzZWxlY3RlZCxzaGFwZSxzaXplLHNpemVzLHNsb3Qsc3BhbixzcGVsbGNoZWNrLHNyYyxzcmNkb2Msc3JjbGFuZyxzcmNzZXQsc3RhcnQsc3RlcCxzdHlsZSxzdW1tYXJ5LHRhYmluZGV4LHRhcmdldCx0aXRsZSx0cmFuc2xhdGUsdHlwZSx1c2VtYXAsdmFsdWUsd2lkdGgsd3JhcGBcbik7XG5jb25zdCBpc0tub3duU3ZnQXR0ciA9IC8qIEBfX1BVUkVfXyAqLyBtYWtlTWFwKFxuICBgeG1sbnMsYWNjZW50LWhlaWdodCxhY2N1bXVsYXRlLGFkZGl0aXZlLGFsaWdubWVudC1iYXNlbGluZSxhbHBoYWJldGljLGFtcGxpdHVkZSxhcmFiaWMtZm9ybSxhc2NlbnQsYXR0cmlidXRlTmFtZSxhdHRyaWJ1dGVUeXBlLGF6aW11dGgsYmFzZUZyZXF1ZW5jeSxiYXNlbGluZS1zaGlmdCxiYXNlUHJvZmlsZSxiYm94LGJlZ2luLGJpYXMsYnksY2FsY01vZGUsY2FwLWhlaWdodCxjbGFzcyxjbGlwLGNsaXBQYXRoVW5pdHMsY2xpcC1wYXRoLGNsaXAtcnVsZSxjb2xvcixjb2xvci1pbnRlcnBvbGF0aW9uLGNvbG9yLWludGVycG9sYXRpb24tZmlsdGVycyxjb2xvci1wcm9maWxlLGNvbG9yLXJlbmRlcmluZyxjb250ZW50U2NyaXB0VHlwZSxjb250ZW50U3R5bGVUeXBlLGNyb3Nzb3JpZ2luLGN1cnNvcixjeCxjeSxkLGRlY2VsZXJhdGUsZGVzY2VudCxkaWZmdXNlQ29uc3RhbnQsZGlyZWN0aW9uLGRpc3BsYXksZGl2aXNvcixkb21pbmFudC1iYXNlbGluZSxkdXIsZHgsZHksZWRnZU1vZGUsZWxldmF0aW9uLGVuYWJsZS1iYWNrZ3JvdW5kLGVuZCxleHBvbmVudCxmaWxsLGZpbGwtb3BhY2l0eSxmaWxsLXJ1bGUsZmlsdGVyLGZpbHRlclJlcyxmaWx0ZXJVbml0cyxmbG9vZC1jb2xvcixmbG9vZC1vcGFjaXR5LGZvbnQtZmFtaWx5LGZvbnQtc2l6ZSxmb250LXNpemUtYWRqdXN0LGZvbnQtc3RyZXRjaCxmb250LXN0eWxlLGZvbnQtdmFyaWFudCxmb250LXdlaWdodCxmb3JtYXQsZnJvbSxmcixmeCxmeSxnMSxnMixnbHlwaC1uYW1lLGdseXBoLW9yaWVudGF0aW9uLWhvcml6b250YWwsZ2x5cGgtb3JpZW50YXRpb24tdmVydGljYWwsZ2x5cGhSZWYsZ3JhZGllbnRUcmFuc2Zvcm0sZ3JhZGllbnRVbml0cyxoYW5naW5nLGhlaWdodCxocmVmLGhyZWZsYW5nLGhvcml6LWFkdi14LGhvcml6LW9yaWdpbi14LGlkLGlkZW9ncmFwaGljLGltYWdlLXJlbmRlcmluZyxpbixpbjIsaW50ZXJjZXB0LGssazEsazIsazMsazQsa2VybmVsTWF0cml4LGtlcm5lbFVuaXRMZW5ndGgsa2VybmluZyxrZXlQb2ludHMsa2V5U3BsaW5lcyxrZXlUaW1lcyxsYW5nLGxlbmd0aEFkanVzdCxsZXR0ZXItc3BhY2luZyxsaWdodGluZy1jb2xvcixsaW1pdGluZ0NvbmVBbmdsZSxsb2NhbCxtYXJrZXItZW5kLG1hcmtlci1taWQsbWFya2VyLXN0YXJ0LG1hcmtlckhlaWdodCxtYXJrZXJVbml0cyxtYXJrZXJXaWR0aCxtYXNrLG1hc2tDb250ZW50VW5pdHMsbWFza1VuaXRzLG1hdGhlbWF0aWNhbCxtYXgsbWVkaWEsbWV0aG9kLG1pbixtb2RlLG5hbWUsbnVtT2N0YXZlcyxvZmZzZXQsb3BhY2l0eSxvcGVyYXRvcixvcmRlcixvcmllbnQsb3JpZW50YXRpb24sb3JpZ2luLG92ZXJmbG93LG92ZXJsaW5lLXBvc2l0aW9uLG92ZXJsaW5lLXRoaWNrbmVzcyxwYW5vc2UtMSxwYWludC1vcmRlcixwYXRoLHBhdGhMZW5ndGgscGF0dGVybkNvbnRlbnRVbml0cyxwYXR0ZXJuVHJhbnNmb3JtLHBhdHRlcm5Vbml0cyxwaW5nLHBvaW50ZXItZXZlbnRzLHBvaW50cyxwb2ludHNBdFgscG9pbnRzQXRZLHBvaW50c0F0WixwcmVzZXJ2ZUFscGhhLHByZXNlcnZlQXNwZWN0UmF0aW8scHJpbWl0aXZlVW5pdHMscixyYWRpdXMscmVmZXJyZXJQb2xpY3kscmVmWCxyZWZZLHJlbCxyZW5kZXJpbmctaW50ZW50LHJlcGVhdENvdW50LHJlcGVhdER1cixyZXF1aXJlZEV4dGVuc2lvbnMscmVxdWlyZWRGZWF0dXJlcyxyZXN0YXJ0LHJlc3VsdCxyb3RhdGUscngscnksc2NhbGUsc2VlZCxzaGFwZS1yZW5kZXJpbmcsc2xvcGUsc3BhY2luZyxzcGVjdWxhckNvbnN0YW50LHNwZWN1bGFyRXhwb25lbnQsc3BlZWQsc3ByZWFkTWV0aG9kLHN0YXJ0T2Zmc2V0LHN0ZERldmlhdGlvbixzdGVtaCxzdGVtdixzdGl0Y2hUaWxlcyxzdG9wLWNvbG9yLHN0b3Atb3BhY2l0eSxzdHJpa2V0aHJvdWdoLXBvc2l0aW9uLHN0cmlrZXRocm91Z2gtdGhpY2tuZXNzLHN0cmluZyxzdHJva2Usc3Ryb2tlLWRhc2hhcnJheSxzdHJva2UtZGFzaG9mZnNldCxzdHJva2UtbGluZWNhcCxzdHJva2UtbGluZWpvaW4sc3Ryb2tlLW1pdGVybGltaXQsc3Ryb2tlLW9wYWNpdHksc3Ryb2tlLXdpZHRoLHN0eWxlLHN1cmZhY2VTY2FsZSxzeXN0ZW1MYW5ndWFnZSx0YWJpbmRleCx0YWJsZVZhbHVlcyx0YXJnZXQsdGFyZ2V0WCx0YXJnZXRZLHRleHQtYW5jaG9yLHRleHQtZGVjb3JhdGlvbix0ZXh0LXJlbmRlcmluZyx0ZXh0TGVuZ3RoLHRvLHRyYW5zZm9ybSx0cmFuc2Zvcm0tb3JpZ2luLHR5cGUsdTEsdTIsdW5kZXJsaW5lLXBvc2l0aW9uLHVuZGVybGluZS10aGlja25lc3MsdW5pY29kZSx1bmljb2RlLWJpZGksdW5pY29kZS1yYW5nZSx1bml0cy1wZXItZW0sdi1hbHBoYWJldGljLHYtaGFuZ2luZyx2LWlkZW9ncmFwaGljLHYtbWF0aGVtYXRpY2FsLHZhbHVlcyx2ZWN0b3ItZWZmZWN0LHZlcnNpb24sdmVydC1hZHYteSx2ZXJ0LW9yaWdpbi14LHZlcnQtb3JpZ2luLXksdmlld0JveCx2aWV3VGFyZ2V0LHZpc2liaWxpdHksd2lkdGgsd2lkdGhzLHdvcmQtc3BhY2luZyx3cml0aW5nLW1vZGUseCx4LWhlaWdodCx4MSx4Mix4Q2hhbm5lbFNlbGVjdG9yLHhsaW5rOmFjdHVhdGUseGxpbms6YXJjcm9sZSx4bGluazpocmVmLHhsaW5rOnJvbGUseGxpbms6c2hvdyx4bGluazp0aXRsZSx4bGluazp0eXBlLHhtbG5zOnhsaW5rLHhtbDpiYXNlLHhtbDpsYW5nLHhtbDpzcGFjZSx5LHkxLHkyLHlDaGFubmVsU2VsZWN0b3Iseix6b29tQW5kUGFuYFxuKTtcbmNvbnN0IGlzS25vd25NYXRoTUxBdHRyID0gLyogQF9fUFVSRV9fICovIG1ha2VNYXAoXG4gIGBhY2NlbnQsYWNjZW50dW5kZXIsYWN0aW9udHlwZSxhbGlnbixhbGlnbm1lbnRzY29wZSxhbHRpbWcsYWx0aW1nLWhlaWdodCxhbHRpbWctdmFsaWduLGFsdGltZy13aWR0aCxhbHR0ZXh0LGJldmVsbGVkLGNsb3NlLGNvbHVtbnNhbGlnbixjb2x1bW5saW5lcyxjb2x1bW5zcGFuLGRlbm9tYWxpZ24sZGVwdGgsZGlyLGRpc3BsYXksZGlzcGxheXN0eWxlLGVuY29kaW5nLGVxdWFsY29sdW1ucyxlcXVhbHJvd3MsZmVuY2UsZm9udHN0eWxlLGZvbnR3ZWlnaHQsZm9ybSxmcmFtZSxmcmFtZXNwYWNpbmcsZ3JvdXBhbGlnbixoZWlnaHQsaHJlZixpZCxpbmRlbnRhbGlnbixpbmRlbnRhbGlnbmZpcnN0LGluZGVudGFsaWdubGFzdCxpbmRlbnRzaGlmdCxpbmRlbnRzaGlmdGZpcnN0LGluZGVudHNoaWZ0bGFzdCxpbmRleHR5cGUsanVzdGlmeSxsYXJnZXRvcCxsYXJnZW9wLGxxdW90ZSxsc3BhY2UsbWF0aGJhY2tncm91bmQsbWF0aGNvbG9yLG1hdGhzaXplLG1hdGh2YXJpYW50LG1heHNpemUsbWlubGFiZWxzcGFjaW5nLG1vZGUsb3RoZXIsb3ZlcmZsb3cscG9zaXRpb24scm93YWxpZ24scm93bGluZXMscm93c3BhbixycXVvdGUscnNwYWNlLHNjcmlwdGxldmVsLHNjcmlwdG1pbnNpemUsc2NyaXB0c2l6ZW11bHRpcGxpZXIsc2VsZWN0aW9uLHNlcGFyYXRvcixzZXBhcmF0b3JzLHNoaWZ0LHNpZGUsc3JjLHN0YWNrYWxpZ24sc3RyZXRjaHksc3Vic2NyaXB0c2hpZnQsc3VwZXJzY3JpcHRzaGlmdCxzeW1tZXRyaWMsdm9mZnNldCx3aWR0aCx3aWR0aHMseGxpbms6aHJlZix4bGluazpzaG93LHhsaW5rOnR5cGUseG1sbnNgXG4pO1xuZnVuY3Rpb24gaXNSZW5kZXJhYmxlQXR0clZhbHVlKHZhbHVlKSB7XG4gIGlmICh2YWx1ZSA9PSBudWxsKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG4gIGNvbnN0IHR5cGUgPSB0eXBlb2YgdmFsdWU7XG4gIHJldHVybiB0eXBlID09PSBcInN0cmluZ1wiIHx8IHR5cGUgPT09IFwibnVtYmVyXCIgfHwgdHlwZSA9PT0gXCJib29sZWFuXCI7XG59XG5cbmNvbnN0IGVzY2FwZVJFID0gL1tcIicmPD5dLztcbmZ1bmN0aW9uIGVzY2FwZUh0bWwoc3RyaW5nKSB7XG4gIGNvbnN0IHN0ciA9IFwiXCIgKyBzdHJpbmc7XG4gIGNvbnN0IG1hdGNoID0gZXNjYXBlUkUuZXhlYyhzdHIpO1xuICBpZiAoIW1hdGNoKSB7XG4gICAgcmV0dXJuIHN0cjtcbiAgfVxuICBsZXQgaHRtbCA9IFwiXCI7XG4gIGxldCBlc2NhcGVkO1xuICBsZXQgaW5kZXg7XG4gIGxldCBsYXN0SW5kZXggPSAwO1xuICBmb3IgKGluZGV4ID0gbWF0Y2guaW5kZXg7IGluZGV4IDwgc3RyLmxlbmd0aDsgaW5kZXgrKykge1xuICAgIHN3aXRjaCAoc3RyLmNoYXJDb2RlQXQoaW5kZXgpKSB7XG4gICAgICBjYXNlIDM0OlxuICAgICAgICBlc2NhcGVkID0gXCImcXVvdDtcIjtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIDM4OlxuICAgICAgICBlc2NhcGVkID0gXCImYW1wO1wiO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgMzk6XG4gICAgICAgIGVzY2FwZWQgPSBcIiYjMzk7XCI7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSA2MDpcbiAgICAgICAgZXNjYXBlZCA9IFwiJmx0O1wiO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgNjI6XG4gICAgICAgIGVzY2FwZWQgPSBcIiZndDtcIjtcbiAgICAgICAgYnJlYWs7XG4gICAgICBkZWZhdWx0OlxuICAgICAgICBjb250aW51ZTtcbiAgICB9XG4gICAgaWYgKGxhc3RJbmRleCAhPT0gaW5kZXgpIHtcbiAgICAgIGh0bWwgKz0gc3RyLnNsaWNlKGxhc3RJbmRleCwgaW5kZXgpO1xuICAgIH1cbiAgICBsYXN0SW5kZXggPSBpbmRleCArIDE7XG4gICAgaHRtbCArPSBlc2NhcGVkO1xuICB9XG4gIHJldHVybiBsYXN0SW5kZXggIT09IGluZGV4ID8gaHRtbCArIHN0ci5zbGljZShsYXN0SW5kZXgsIGluZGV4KSA6IGh0bWw7XG59XG5jb25zdCBjb21tZW50U3RyaXBSRSA9IC9eLT8+fDwhLS18LS0+fC0tIT58PCEtJC9nO1xuZnVuY3Rpb24gZXNjYXBlSHRtbENvbW1lbnQoc3JjKSB7XG4gIHJldHVybiBzcmMucmVwbGFjZShjb21tZW50U3RyaXBSRSwgXCJcIik7XG59XG5jb25zdCBjc3NWYXJOYW1lRXNjYXBlU3ltYm9sc1JFID0gL1sgIVwiIyQlJicoKSorLC4vOjs8PT4/QFtcXFxcXFxdXmB7fH1+XS9nO1xuZnVuY3Rpb24gZ2V0RXNjYXBlZENzc1Zhck5hbWUoa2V5LCBkb3VibGVFc2NhcGUpIHtcbiAgcmV0dXJuIGtleS5yZXBsYWNlKFxuICAgIGNzc1Zhck5hbWVFc2NhcGVTeW1ib2xzUkUsXG4gICAgKHMpID0+IGRvdWJsZUVzY2FwZSA/IHMgPT09ICdcIicgPyAnXFxcXFxcXFxcXFxcXCInIDogYFxcXFxcXFxcJHtzfWAgOiBgXFxcXCR7c31gXG4gICk7XG59XG5cbmZ1bmN0aW9uIGxvb3NlQ29tcGFyZUFycmF5cyhhLCBiKSB7XG4gIGlmIChhLmxlbmd0aCAhPT0gYi5sZW5ndGgpIHJldHVybiBmYWxzZTtcbiAgbGV0IGVxdWFsID0gdHJ1ZTtcbiAgZm9yIChsZXQgaSA9IDA7IGVxdWFsICYmIGkgPCBhLmxlbmd0aDsgaSsrKSB7XG4gICAgZXF1YWwgPSBsb29zZUVxdWFsKGFbaV0sIGJbaV0pO1xuICB9XG4gIHJldHVybiBlcXVhbDtcbn1cbmZ1bmN0aW9uIGxvb3NlRXF1YWwoYSwgYikge1xuICBpZiAoYSA9PT0gYikgcmV0dXJuIHRydWU7XG4gIGxldCBhVmFsaWRUeXBlID0gaXNEYXRlKGEpO1xuICBsZXQgYlZhbGlkVHlwZSA9IGlzRGF0ZShiKTtcbiAgaWYgKGFWYWxpZFR5cGUgfHwgYlZhbGlkVHlwZSkge1xuICAgIHJldHVybiBhVmFsaWRUeXBlICYmIGJWYWxpZFR5cGUgPyBhLmdldFRpbWUoKSA9PT0gYi5nZXRUaW1lKCkgOiBmYWxzZTtcbiAgfVxuICBhVmFsaWRUeXBlID0gaXNTeW1ib2woYSk7XG4gIGJWYWxpZFR5cGUgPSBpc1N5bWJvbChiKTtcbiAgaWYgKGFWYWxpZFR5cGUgfHwgYlZhbGlkVHlwZSkge1xuICAgIHJldHVybiBhID09PSBiO1xuICB9XG4gIGFWYWxpZFR5cGUgPSBpc0FycmF5KGEpO1xuICBiVmFsaWRUeXBlID0gaXNBcnJheShiKTtcbiAgaWYgKGFWYWxpZFR5cGUgfHwgYlZhbGlkVHlwZSkge1xuICAgIHJldHVybiBhVmFsaWRUeXBlICYmIGJWYWxpZFR5cGUgPyBsb29zZUNvbXBhcmVBcnJheXMoYSwgYikgOiBmYWxzZTtcbiAgfVxuICBhVmFsaWRUeXBlID0gaXNPYmplY3QoYSk7XG4gIGJWYWxpZFR5cGUgPSBpc09iamVjdChiKTtcbiAgaWYgKGFWYWxpZFR5cGUgfHwgYlZhbGlkVHlwZSkge1xuICAgIGlmICghYVZhbGlkVHlwZSB8fCAhYlZhbGlkVHlwZSkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICBjb25zdCBhS2V5c0NvdW50ID0gT2JqZWN0LmtleXMoYSkubGVuZ3RoO1xuICAgIGNvbnN0IGJLZXlzQ291bnQgPSBPYmplY3Qua2V5cyhiKS5sZW5ndGg7XG4gICAgaWYgKGFLZXlzQ291bnQgIT09IGJLZXlzQ291bnQpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgZm9yIChjb25zdCBrZXkgaW4gYSkge1xuICAgICAgY29uc3QgYUhhc0tleSA9IGEuaGFzT3duUHJvcGVydHkoa2V5KTtcbiAgICAgIGNvbnN0IGJIYXNLZXkgPSBiLmhhc093blByb3BlcnR5KGtleSk7XG4gICAgICBpZiAoYUhhc0tleSAmJiAhYkhhc0tleSB8fCAhYUhhc0tleSAmJiBiSGFzS2V5IHx8ICFsb29zZUVxdWFsKGFba2V5XSwgYltrZXldKSkge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIHJldHVybiBTdHJpbmcoYSkgPT09IFN0cmluZyhiKTtcbn1cbmZ1bmN0aW9uIGxvb3NlSW5kZXhPZihhcnIsIHZhbCkge1xuICByZXR1cm4gYXJyLmZpbmRJbmRleCgoaXRlbSkgPT4gbG9vc2VFcXVhbChpdGVtLCB2YWwpKTtcbn1cblxuY29uc3QgaXNSZWYgPSAodmFsKSA9PiB7XG4gIHJldHVybiAhISh2YWwgJiYgdmFsW1wiX192X2lzUmVmXCJdID09PSB0cnVlKTtcbn07XG5jb25zdCB0b0Rpc3BsYXlTdHJpbmcgPSAodmFsKSA9PiB7XG4gIHJldHVybiBpc1N0cmluZyh2YWwpID8gdmFsIDogdmFsID09IG51bGwgPyBcIlwiIDogaXNBcnJheSh2YWwpIHx8IGlzT2JqZWN0KHZhbCkgJiYgKHZhbC50b1N0cmluZyA9PT0gb2JqZWN0VG9TdHJpbmcgfHwgIWlzRnVuY3Rpb24odmFsLnRvU3RyaW5nKSkgPyBpc1JlZih2YWwpID8gdG9EaXNwbGF5U3RyaW5nKHZhbC52YWx1ZSkgOiBKU09OLnN0cmluZ2lmeSh2YWwsIHJlcGxhY2VyLCAyKSA6IFN0cmluZyh2YWwpO1xufTtcbmNvbnN0IHJlcGxhY2VyID0gKF9rZXksIHZhbCkgPT4ge1xuICBpZiAoaXNSZWYodmFsKSkge1xuICAgIHJldHVybiByZXBsYWNlcihfa2V5LCB2YWwudmFsdWUpO1xuICB9IGVsc2UgaWYgKGlzTWFwKHZhbCkpIHtcbiAgICByZXR1cm4ge1xuICAgICAgW2BNYXAoJHt2YWwuc2l6ZX0pYF06IFsuLi52YWwuZW50cmllcygpXS5yZWR1Y2UoXG4gICAgICAgIChlbnRyaWVzLCBba2V5LCB2YWwyXSwgaSkgPT4ge1xuICAgICAgICAgIGVudHJpZXNbc3RyaW5naWZ5U3ltYm9sKGtleSwgaSkgKyBcIiA9PlwiXSA9IHZhbDI7XG4gICAgICAgICAgcmV0dXJuIGVudHJpZXM7XG4gICAgICAgIH0sXG4gICAgICAgIHt9XG4gICAgICApXG4gICAgfTtcbiAgfSBlbHNlIGlmIChpc1NldCh2YWwpKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIFtgU2V0KCR7dmFsLnNpemV9KWBdOiBbLi4udmFsLnZhbHVlcygpXS5tYXAoKHYpID0+IHN0cmluZ2lmeVN5bWJvbCh2KSlcbiAgICB9O1xuICB9IGVsc2UgaWYgKGlzU3ltYm9sKHZhbCkpIHtcbiAgICByZXR1cm4gc3RyaW5naWZ5U3ltYm9sKHZhbCk7XG4gIH0gZWxzZSBpZiAoaXNPYmplY3QodmFsKSAmJiAhaXNBcnJheSh2YWwpICYmICFpc1BsYWluT2JqZWN0KHZhbCkpIHtcbiAgICByZXR1cm4gU3RyaW5nKHZhbCk7XG4gIH1cbiAgcmV0dXJuIHZhbDtcbn07XG5jb25zdCBzdHJpbmdpZnlTeW1ib2wgPSAodiwgaSA9IFwiXCIpID0+IHtcbiAgdmFyIF9hO1xuICByZXR1cm4gKFxuICAgIC8vIFN5bWJvbC5kZXNjcmlwdGlvbiBpbiBlczIwMTkrIHNvIHdlIG5lZWQgdG8gY2FzdCBoZXJlIHRvIHBhc3NcbiAgICAvLyB0aGUgbGliOiBlczIwMTYgY2hlY2tcbiAgICBpc1N5bWJvbCh2KSA/IGBTeW1ib2woJHsoX2EgPSB2LmRlc2NyaXB0aW9uKSAhPSBudWxsID8gX2EgOiBpfSlgIDogdlxuICApO1xufTtcblxuZnVuY3Rpb24gbm9ybWFsaXplQ3NzVmFyVmFsdWUodmFsdWUpIHtcbiAgaWYgKHZhbHVlID09IG51bGwpIHtcbiAgICByZXR1cm4gXCJpbml0aWFsXCI7XG4gIH1cbiAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gXCJzdHJpbmdcIikge1xuICAgIHJldHVybiB2YWx1ZSA9PT0gXCJcIiA/IFwiIFwiIDogdmFsdWU7XG4gIH1cbiAgaWYgKHR5cGVvZiB2YWx1ZSAhPT0gXCJudW1iZXJcIiB8fCAhTnVtYmVyLmlzRmluaXRlKHZhbHVlKSkge1xuICAgIGlmICghIShwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gXCJwcm9kdWN0aW9uXCIpKSB7XG4gICAgICBjb25zb2xlLndhcm4oXG4gICAgICAgIFwiW1Z1ZSB3YXJuXSBJbnZhbGlkIHZhbHVlIHVzZWQgZm9yIENTUyBiaW5kaW5nLiBFeHBlY3RlZCBhIHN0cmluZyBvciBhIGZpbml0ZSBudW1iZXIgYnV0IHJlY2VpdmVkOlwiLFxuICAgICAgICB2YWx1ZVxuICAgICAgKTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIFN0cmluZyh2YWx1ZSk7XG59XG5cbmV4cG9ydCB7IEVNUFRZX0FSUiwgRU1QVFlfT0JKLCBOTywgTk9PUCwgUGF0Y2hGbGFnTmFtZXMsIFBhdGNoRmxhZ3MsIFNoYXBlRmxhZ3MsIFNsb3RGbGFncywgY2FtZWxpemUsIGNhcGl0YWxpemUsIGNzc1Zhck5hbWVFc2NhcGVTeW1ib2xzUkUsIGRlZiwgZXNjYXBlSHRtbCwgZXNjYXBlSHRtbENvbW1lbnQsIGV4dGVuZCwgZ2VuQ2FjaGVLZXksIGdlblByb3BzQWNjZXNzRXhwLCBnZW5lcmF0ZUNvZGVGcmFtZSwgZ2V0RXNjYXBlZENzc1Zhck5hbWUsIGdldEdsb2JhbFRoaXMsIGhhc0NoYW5nZWQsIGhhc093biwgaHlwaGVuYXRlLCBpbmNsdWRlQm9vbGVhbkF0dHIsIGludm9rZUFycmF5Rm5zLCBpc0FycmF5LCBpc0Jvb2xlYW5BdHRyLCBpc0J1aWx0SW5EaXJlY3RpdmUsIGlzRGF0ZSwgaXNGdW5jdGlvbiwgaXNHbG9iYWxseUFsbG93ZWQsIGlzR2xvYmFsbHlXaGl0ZWxpc3RlZCwgaXNIVE1MVGFnLCBpc0ludGVnZXJLZXksIGlzS25vd25IdG1sQXR0ciwgaXNLbm93bk1hdGhNTEF0dHIsIGlzS25vd25TdmdBdHRyLCBpc01hcCwgaXNNYXRoTUxUYWcsIGlzTW9kZWxMaXN0ZW5lciwgaXNPYmplY3QsIGlzT24sIGlzUGxhaW5PYmplY3QsIGlzUHJvbWlzZSwgaXNSZWdFeHAsIGlzUmVuZGVyYWJsZUF0dHJWYWx1ZSwgaXNSZXNlcnZlZFByb3AsIGlzU1NSU2FmZUF0dHJOYW1lLCBpc1NWR1RhZywgaXNTZXQsIGlzU3BlY2lhbEJvb2xlYW5BdHRyLCBpc1N0cmluZywgaXNTeW1ib2wsIGlzVm9pZFRhZywgbG9vc2VFcXVhbCwgbG9vc2VJbmRleE9mLCBsb29zZVRvTnVtYmVyLCBtYWtlTWFwLCBub3JtYWxpemVDbGFzcywgbm9ybWFsaXplQ3NzVmFyVmFsdWUsIG5vcm1hbGl6ZVByb3BzLCBub3JtYWxpemVTdHlsZSwgb2JqZWN0VG9TdHJpbmcsIHBhcnNlU3RyaW5nU3R5bGUsIHByb3BzVG9BdHRyTWFwLCByZW1vdmUsIHNsb3RGbGFnc1RleHQsIHN0cmluZ2lmeVN0eWxlLCB0b0Rpc3BsYXlTdHJpbmcsIHRvSGFuZGxlcktleSwgdG9OdW1iZXIsIHRvUmF3VHlwZSwgdG9UeXBlU3RyaW5nIH07XG4iLCIvKipcbiogQHZ1ZS9yZWFjdGl2aXR5IHYzLjUuMjhcbiogKGMpIDIwMTgtcHJlc2VudCBZdXhpIChFdmFuKSBZb3UgYW5kIFZ1ZSBjb250cmlidXRvcnNcbiogQGxpY2Vuc2UgTUlUXG4qKi9cbmltcG9ydCB7IGV4dGVuZCwgaGFzQ2hhbmdlZCwgaXNBcnJheSwgaXNJbnRlZ2VyS2V5LCBpc1N5bWJvbCwgaXNNYXAsIGhhc093biwgaXNPYmplY3QsIG1ha2VNYXAsIGNhcGl0YWxpemUsIHRvUmF3VHlwZSwgZGVmLCBpc0Z1bmN0aW9uLCBFTVBUWV9PQkosIGlzU2V0LCBpc1BsYWluT2JqZWN0LCByZW1vdmUsIE5PT1AgfSBmcm9tICdAdnVlL3NoYXJlZCc7XG5cbmZ1bmN0aW9uIHdhcm4obXNnLCAuLi5hcmdzKSB7XG4gIGNvbnNvbGUud2FybihgW1Z1ZSB3YXJuXSAke21zZ31gLCAuLi5hcmdzKTtcbn1cblxubGV0IGFjdGl2ZUVmZmVjdFNjb3BlO1xuY2xhc3MgRWZmZWN0U2NvcGUge1xuICAvLyBUT0RPIGlzb2xhdGVkRGVjbGFyYXRpb25zIFwiX192X3NraXBcIlxuICBjb25zdHJ1Y3RvcihkZXRhY2hlZCA9IGZhbHNlKSB7XG4gICAgdGhpcy5kZXRhY2hlZCA9IGRldGFjaGVkO1xuICAgIC8qKlxuICAgICAqIEBpbnRlcm5hbFxuICAgICAqL1xuICAgIHRoaXMuX2FjdGl2ZSA9IHRydWU7XG4gICAgLyoqXG4gICAgICogQGludGVybmFsIHRyYWNrIGBvbmAgY2FsbHMsIGFsbG93IGBvbmAgY2FsbCBtdWx0aXBsZSB0aW1lc1xuICAgICAqL1xuICAgIHRoaXMuX29uID0gMDtcbiAgICAvKipcbiAgICAgKiBAaW50ZXJuYWxcbiAgICAgKi9cbiAgICB0aGlzLmVmZmVjdHMgPSBbXTtcbiAgICAvKipcbiAgICAgKiBAaW50ZXJuYWxcbiAgICAgKi9cbiAgICB0aGlzLmNsZWFudXBzID0gW107XG4gICAgdGhpcy5faXNQYXVzZWQgPSBmYWxzZTtcbiAgICB0aGlzLl9fdl9za2lwID0gdHJ1ZTtcbiAgICB0aGlzLnBhcmVudCA9IGFjdGl2ZUVmZmVjdFNjb3BlO1xuICAgIGlmICghZGV0YWNoZWQgJiYgYWN0aXZlRWZmZWN0U2NvcGUpIHtcbiAgICAgIHRoaXMuaW5kZXggPSAoYWN0aXZlRWZmZWN0U2NvcGUuc2NvcGVzIHx8IChhY3RpdmVFZmZlY3RTY29wZS5zY29wZXMgPSBbXSkpLnB1c2goXG4gICAgICAgIHRoaXNcbiAgICAgICkgLSAxO1xuICAgIH1cbiAgfVxuICBnZXQgYWN0aXZlKCkge1xuICAgIHJldHVybiB0aGlzLl9hY3RpdmU7XG4gIH1cbiAgcGF1c2UoKSB7XG4gICAgaWYgKHRoaXMuX2FjdGl2ZSkge1xuICAgICAgdGhpcy5faXNQYXVzZWQgPSB0cnVlO1xuICAgICAgbGV0IGksIGw7XG4gICAgICBpZiAodGhpcy5zY29wZXMpIHtcbiAgICAgICAgZm9yIChpID0gMCwgbCA9IHRoaXMuc2NvcGVzLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgICAgICAgIHRoaXMuc2NvcGVzW2ldLnBhdXNlKCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGZvciAoaSA9IDAsIGwgPSB0aGlzLmVmZmVjdHMubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgICAgIHRoaXMuZWZmZWN0c1tpXS5wYXVzZSgpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuICAvKipcbiAgICogUmVzdW1lcyB0aGUgZWZmZWN0IHNjb3BlLCBpbmNsdWRpbmcgYWxsIGNoaWxkIHNjb3BlcyBhbmQgZWZmZWN0cy5cbiAgICovXG4gIHJlc3VtZSgpIHtcbiAgICBpZiAodGhpcy5fYWN0aXZlKSB7XG4gICAgICBpZiAodGhpcy5faXNQYXVzZWQpIHtcbiAgICAgICAgdGhpcy5faXNQYXVzZWQgPSBmYWxzZTtcbiAgICAgICAgbGV0IGksIGw7XG4gICAgICAgIGlmICh0aGlzLnNjb3Blcykge1xuICAgICAgICAgIGZvciAoaSA9IDAsIGwgPSB0aGlzLnNjb3Blcy5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICAgICAgICAgIHRoaXMuc2NvcGVzW2ldLnJlc3VtZSgpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBmb3IgKGkgPSAwLCBsID0gdGhpcy5lZmZlY3RzLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgICAgICAgIHRoaXMuZWZmZWN0c1tpXS5yZXN1bWUoKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuICBydW4oZm4pIHtcbiAgICBpZiAodGhpcy5fYWN0aXZlKSB7XG4gICAgICBjb25zdCBjdXJyZW50RWZmZWN0U2NvcGUgPSBhY3RpdmVFZmZlY3RTY29wZTtcbiAgICAgIHRyeSB7XG4gICAgICAgIGFjdGl2ZUVmZmVjdFNjb3BlID0gdGhpcztcbiAgICAgICAgcmV0dXJuIGZuKCk7XG4gICAgICB9IGZpbmFsbHkge1xuICAgICAgICBhY3RpdmVFZmZlY3RTY29wZSA9IGN1cnJlbnRFZmZlY3RTY29wZTtcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKCEhKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSBcInByb2R1Y3Rpb25cIikpIHtcbiAgICAgIHdhcm4oYGNhbm5vdCBydW4gYW4gaW5hY3RpdmUgZWZmZWN0IHNjb3BlLmApO1xuICAgIH1cbiAgfVxuICAvKipcbiAgICogVGhpcyBzaG91bGQgb25seSBiZSBjYWxsZWQgb24gbm9uLWRldGFjaGVkIHNjb3Blc1xuICAgKiBAaW50ZXJuYWxcbiAgICovXG4gIG9uKCkge1xuICAgIGlmICgrK3RoaXMuX29uID09PSAxKSB7XG4gICAgICB0aGlzLnByZXZTY29wZSA9IGFjdGl2ZUVmZmVjdFNjb3BlO1xuICAgICAgYWN0aXZlRWZmZWN0U2NvcGUgPSB0aGlzO1xuICAgIH1cbiAgfVxuICAvKipcbiAgICogVGhpcyBzaG91bGQgb25seSBiZSBjYWxsZWQgb24gbm9uLWRldGFjaGVkIHNjb3Blc1xuICAgKiBAaW50ZXJuYWxcbiAgICovXG4gIG9mZigpIHtcbiAgICBpZiAodGhpcy5fb24gPiAwICYmIC0tdGhpcy5fb24gPT09IDApIHtcbiAgICAgIGFjdGl2ZUVmZmVjdFNjb3BlID0gdGhpcy5wcmV2U2NvcGU7XG4gICAgICB0aGlzLnByZXZTY29wZSA9IHZvaWQgMDtcbiAgICB9XG4gIH1cbiAgc3RvcChmcm9tUGFyZW50KSB7XG4gICAgaWYgKHRoaXMuX2FjdGl2ZSkge1xuICAgICAgdGhpcy5fYWN0aXZlID0gZmFsc2U7XG4gICAgICBsZXQgaSwgbDtcbiAgICAgIGZvciAoaSA9IDAsIGwgPSB0aGlzLmVmZmVjdHMubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgICAgIHRoaXMuZWZmZWN0c1tpXS5zdG9wKCk7XG4gICAgICB9XG4gICAgICB0aGlzLmVmZmVjdHMubGVuZ3RoID0gMDtcbiAgICAgIGZvciAoaSA9IDAsIGwgPSB0aGlzLmNsZWFudXBzLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgICAgICB0aGlzLmNsZWFudXBzW2ldKCk7XG4gICAgICB9XG4gICAgICB0aGlzLmNsZWFudXBzLmxlbmd0aCA9IDA7XG4gICAgICBpZiAodGhpcy5zY29wZXMpIHtcbiAgICAgICAgZm9yIChpID0gMCwgbCA9IHRoaXMuc2NvcGVzLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgICAgICAgIHRoaXMuc2NvcGVzW2ldLnN0b3AodHJ1ZSk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5zY29wZXMubGVuZ3RoID0gMDtcbiAgICAgIH1cbiAgICAgIGlmICghdGhpcy5kZXRhY2hlZCAmJiB0aGlzLnBhcmVudCAmJiAhZnJvbVBhcmVudCkge1xuICAgICAgICBjb25zdCBsYXN0ID0gdGhpcy5wYXJlbnQuc2NvcGVzLnBvcCgpO1xuICAgICAgICBpZiAobGFzdCAmJiBsYXN0ICE9PSB0aGlzKSB7XG4gICAgICAgICAgdGhpcy5wYXJlbnQuc2NvcGVzW3RoaXMuaW5kZXhdID0gbGFzdDtcbiAgICAgICAgICBsYXN0LmluZGV4ID0gdGhpcy5pbmRleDtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgdGhpcy5wYXJlbnQgPSB2b2lkIDA7XG4gICAgfVxuICB9XG59XG5mdW5jdGlvbiBlZmZlY3RTY29wZShkZXRhY2hlZCkge1xuICByZXR1cm4gbmV3IEVmZmVjdFNjb3BlKGRldGFjaGVkKTtcbn1cbmZ1bmN0aW9uIGdldEN1cnJlbnRTY29wZSgpIHtcbiAgcmV0dXJuIGFjdGl2ZUVmZmVjdFNjb3BlO1xufVxuZnVuY3Rpb24gb25TY29wZURpc3Bvc2UoZm4sIGZhaWxTaWxlbnRseSA9IGZhbHNlKSB7XG4gIGlmIChhY3RpdmVFZmZlY3RTY29wZSkge1xuICAgIGFjdGl2ZUVmZmVjdFNjb3BlLmNsZWFudXBzLnB1c2goZm4pO1xuICB9IGVsc2UgaWYgKCEhKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSBcInByb2R1Y3Rpb25cIikgJiYgIWZhaWxTaWxlbnRseSkge1xuICAgIHdhcm4oXG4gICAgICBgb25TY29wZURpc3Bvc2UoKSBpcyBjYWxsZWQgd2hlbiB0aGVyZSBpcyBubyBhY3RpdmUgZWZmZWN0IHNjb3BlIHRvIGJlIGFzc29jaWF0ZWQgd2l0aC5gXG4gICAgKTtcbiAgfVxufVxuXG5sZXQgYWN0aXZlU3ViO1xuY29uc3QgRWZmZWN0RmxhZ3MgPSB7XG4gIFwiQUNUSVZFXCI6IDEsXG4gIFwiMVwiOiBcIkFDVElWRVwiLFxuICBcIlJVTk5JTkdcIjogMixcbiAgXCIyXCI6IFwiUlVOTklOR1wiLFxuICBcIlRSQUNLSU5HXCI6IDQsXG4gIFwiNFwiOiBcIlRSQUNLSU5HXCIsXG4gIFwiTk9USUZJRURcIjogOCxcbiAgXCI4XCI6IFwiTk9USUZJRURcIixcbiAgXCJESVJUWVwiOiAxNixcbiAgXCIxNlwiOiBcIkRJUlRZXCIsXG4gIFwiQUxMT1dfUkVDVVJTRVwiOiAzMixcbiAgXCIzMlwiOiBcIkFMTE9XX1JFQ1VSU0VcIixcbiAgXCJQQVVTRURcIjogNjQsXG4gIFwiNjRcIjogXCJQQVVTRURcIixcbiAgXCJFVkFMVUFURURcIjogMTI4LFxuICBcIjEyOFwiOiBcIkVWQUxVQVRFRFwiXG59O1xuY29uc3QgcGF1c2VkUXVldWVFZmZlY3RzID0gLyogQF9fUFVSRV9fICovIG5ldyBXZWFrU2V0KCk7XG5jbGFzcyBSZWFjdGl2ZUVmZmVjdCB7XG4gIGNvbnN0cnVjdG9yKGZuKSB7XG4gICAgdGhpcy5mbiA9IGZuO1xuICAgIC8qKlxuICAgICAqIEBpbnRlcm5hbFxuICAgICAqL1xuICAgIHRoaXMuZGVwcyA9IHZvaWQgMDtcbiAgICAvKipcbiAgICAgKiBAaW50ZXJuYWxcbiAgICAgKi9cbiAgICB0aGlzLmRlcHNUYWlsID0gdm9pZCAwO1xuICAgIC8qKlxuICAgICAqIEBpbnRlcm5hbFxuICAgICAqL1xuICAgIHRoaXMuZmxhZ3MgPSAxIHwgNDtcbiAgICAvKipcbiAgICAgKiBAaW50ZXJuYWxcbiAgICAgKi9cbiAgICB0aGlzLm5leHQgPSB2b2lkIDA7XG4gICAgLyoqXG4gICAgICogQGludGVybmFsXG4gICAgICovXG4gICAgdGhpcy5jbGVhbnVwID0gdm9pZCAwO1xuICAgIHRoaXMuc2NoZWR1bGVyID0gdm9pZCAwO1xuICAgIGlmIChhY3RpdmVFZmZlY3RTY29wZSAmJiBhY3RpdmVFZmZlY3RTY29wZS5hY3RpdmUpIHtcbiAgICAgIGFjdGl2ZUVmZmVjdFNjb3BlLmVmZmVjdHMucHVzaCh0aGlzKTtcbiAgICB9XG4gIH1cbiAgcGF1c2UoKSB7XG4gICAgdGhpcy5mbGFncyB8PSA2NDtcbiAgfVxuICByZXN1bWUoKSB7XG4gICAgaWYgKHRoaXMuZmxhZ3MgJiA2NCkge1xuICAgICAgdGhpcy5mbGFncyAmPSAtNjU7XG4gICAgICBpZiAocGF1c2VkUXVldWVFZmZlY3RzLmhhcyh0aGlzKSkge1xuICAgICAgICBwYXVzZWRRdWV1ZUVmZmVjdHMuZGVsZXRlKHRoaXMpO1xuICAgICAgICB0aGlzLnRyaWdnZXIoKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgLyoqXG4gICAqIEBpbnRlcm5hbFxuICAgKi9cbiAgbm90aWZ5KCkge1xuICAgIGlmICh0aGlzLmZsYWdzICYgMiAmJiAhKHRoaXMuZmxhZ3MgJiAzMikpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgaWYgKCEodGhpcy5mbGFncyAmIDgpKSB7XG4gICAgICBiYXRjaCh0aGlzKTtcbiAgICB9XG4gIH1cbiAgcnVuKCkge1xuICAgIGlmICghKHRoaXMuZmxhZ3MgJiAxKSkge1xuICAgICAgcmV0dXJuIHRoaXMuZm4oKTtcbiAgICB9XG4gICAgdGhpcy5mbGFncyB8PSAyO1xuICAgIGNsZWFudXBFZmZlY3QodGhpcyk7XG4gICAgcHJlcGFyZURlcHModGhpcyk7XG4gICAgY29uc3QgcHJldkVmZmVjdCA9IGFjdGl2ZVN1YjtcbiAgICBjb25zdCBwcmV2U2hvdWxkVHJhY2sgPSBzaG91bGRUcmFjaztcbiAgICBhY3RpdmVTdWIgPSB0aGlzO1xuICAgIHNob3VsZFRyYWNrID0gdHJ1ZTtcbiAgICB0cnkge1xuICAgICAgcmV0dXJuIHRoaXMuZm4oKTtcbiAgICB9IGZpbmFsbHkge1xuICAgICAgaWYgKCEhKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSBcInByb2R1Y3Rpb25cIikgJiYgYWN0aXZlU3ViICE9PSB0aGlzKSB7XG4gICAgICAgIHdhcm4oXG4gICAgICAgICAgXCJBY3RpdmUgZWZmZWN0IHdhcyBub3QgcmVzdG9yZWQgY29ycmVjdGx5IC0gdGhpcyBpcyBsaWtlbHkgYSBWdWUgaW50ZXJuYWwgYnVnLlwiXG4gICAgICAgICk7XG4gICAgICB9XG4gICAgICBjbGVhbnVwRGVwcyh0aGlzKTtcbiAgICAgIGFjdGl2ZVN1YiA9IHByZXZFZmZlY3Q7XG4gICAgICBzaG91bGRUcmFjayA9IHByZXZTaG91bGRUcmFjaztcbiAgICAgIHRoaXMuZmxhZ3MgJj0gLTM7XG4gICAgfVxuICB9XG4gIHN0b3AoKSB7XG4gICAgaWYgKHRoaXMuZmxhZ3MgJiAxKSB7XG4gICAgICBmb3IgKGxldCBsaW5rID0gdGhpcy5kZXBzOyBsaW5rOyBsaW5rID0gbGluay5uZXh0RGVwKSB7XG4gICAgICAgIHJlbW92ZVN1YihsaW5rKTtcbiAgICAgIH1cbiAgICAgIHRoaXMuZGVwcyA9IHRoaXMuZGVwc1RhaWwgPSB2b2lkIDA7XG4gICAgICBjbGVhbnVwRWZmZWN0KHRoaXMpO1xuICAgICAgdGhpcy5vblN0b3AgJiYgdGhpcy5vblN0b3AoKTtcbiAgICAgIHRoaXMuZmxhZ3MgJj0gLTI7XG4gICAgfVxuICB9XG4gIHRyaWdnZXIoKSB7XG4gICAgaWYgKHRoaXMuZmxhZ3MgJiA2NCkge1xuICAgICAgcGF1c2VkUXVldWVFZmZlY3RzLmFkZCh0aGlzKTtcbiAgICB9IGVsc2UgaWYgKHRoaXMuc2NoZWR1bGVyKSB7XG4gICAgICB0aGlzLnNjaGVkdWxlcigpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLnJ1bklmRGlydHkoKTtcbiAgICB9XG4gIH1cbiAgLyoqXG4gICAqIEBpbnRlcm5hbFxuICAgKi9cbiAgcnVuSWZEaXJ0eSgpIHtcbiAgICBpZiAoaXNEaXJ0eSh0aGlzKSkge1xuICAgICAgdGhpcy5ydW4oKTtcbiAgICB9XG4gIH1cbiAgZ2V0IGRpcnR5KCkge1xuICAgIHJldHVybiBpc0RpcnR5KHRoaXMpO1xuICB9XG59XG5sZXQgYmF0Y2hEZXB0aCA9IDA7XG5sZXQgYmF0Y2hlZFN1YjtcbmxldCBiYXRjaGVkQ29tcHV0ZWQ7XG5mdW5jdGlvbiBiYXRjaChzdWIsIGlzQ29tcHV0ZWQgPSBmYWxzZSkge1xuICBzdWIuZmxhZ3MgfD0gODtcbiAgaWYgKGlzQ29tcHV0ZWQpIHtcbiAgICBzdWIubmV4dCA9IGJhdGNoZWRDb21wdXRlZDtcbiAgICBiYXRjaGVkQ29tcHV0ZWQgPSBzdWI7XG4gICAgcmV0dXJuO1xuICB9XG4gIHN1Yi5uZXh0ID0gYmF0Y2hlZFN1YjtcbiAgYmF0Y2hlZFN1YiA9IHN1Yjtcbn1cbmZ1bmN0aW9uIHN0YXJ0QmF0Y2goKSB7XG4gIGJhdGNoRGVwdGgrKztcbn1cbmZ1bmN0aW9uIGVuZEJhdGNoKCkge1xuICBpZiAoLS1iYXRjaERlcHRoID4gMCkge1xuICAgIHJldHVybjtcbiAgfVxuICBpZiAoYmF0Y2hlZENvbXB1dGVkKSB7XG4gICAgbGV0IGUgPSBiYXRjaGVkQ29tcHV0ZWQ7XG4gICAgYmF0Y2hlZENvbXB1dGVkID0gdm9pZCAwO1xuICAgIHdoaWxlIChlKSB7XG4gICAgICBjb25zdCBuZXh0ID0gZS5uZXh0O1xuICAgICAgZS5uZXh0ID0gdm9pZCAwO1xuICAgICAgZS5mbGFncyAmPSAtOTtcbiAgICAgIGUgPSBuZXh0O1xuICAgIH1cbiAgfVxuICBsZXQgZXJyb3I7XG4gIHdoaWxlIChiYXRjaGVkU3ViKSB7XG4gICAgbGV0IGUgPSBiYXRjaGVkU3ViO1xuICAgIGJhdGNoZWRTdWIgPSB2b2lkIDA7XG4gICAgd2hpbGUgKGUpIHtcbiAgICAgIGNvbnN0IG5leHQgPSBlLm5leHQ7XG4gICAgICBlLm5leHQgPSB2b2lkIDA7XG4gICAgICBlLmZsYWdzICY9IC05O1xuICAgICAgaWYgKGUuZmxhZ3MgJiAxKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgO1xuICAgICAgICAgIGUudHJpZ2dlcigpO1xuICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICBpZiAoIWVycm9yKSBlcnJvciA9IGVycjtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgZSA9IG5leHQ7XG4gICAgfVxuICB9XG4gIGlmIChlcnJvcikgdGhyb3cgZXJyb3I7XG59XG5mdW5jdGlvbiBwcmVwYXJlRGVwcyhzdWIpIHtcbiAgZm9yIChsZXQgbGluayA9IHN1Yi5kZXBzOyBsaW5rOyBsaW5rID0gbGluay5uZXh0RGVwKSB7XG4gICAgbGluay52ZXJzaW9uID0gLTE7XG4gICAgbGluay5wcmV2QWN0aXZlTGluayA9IGxpbmsuZGVwLmFjdGl2ZUxpbms7XG4gICAgbGluay5kZXAuYWN0aXZlTGluayA9IGxpbms7XG4gIH1cbn1cbmZ1bmN0aW9uIGNsZWFudXBEZXBzKHN1Yikge1xuICBsZXQgaGVhZDtcbiAgbGV0IHRhaWwgPSBzdWIuZGVwc1RhaWw7XG4gIGxldCBsaW5rID0gdGFpbDtcbiAgd2hpbGUgKGxpbmspIHtcbiAgICBjb25zdCBwcmV2ID0gbGluay5wcmV2RGVwO1xuICAgIGlmIChsaW5rLnZlcnNpb24gPT09IC0xKSB7XG4gICAgICBpZiAobGluayA9PT0gdGFpbCkgdGFpbCA9IHByZXY7XG4gICAgICByZW1vdmVTdWIobGluayk7XG4gICAgICByZW1vdmVEZXAobGluayk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGhlYWQgPSBsaW5rO1xuICAgIH1cbiAgICBsaW5rLmRlcC5hY3RpdmVMaW5rID0gbGluay5wcmV2QWN0aXZlTGluaztcbiAgICBsaW5rLnByZXZBY3RpdmVMaW5rID0gdm9pZCAwO1xuICAgIGxpbmsgPSBwcmV2O1xuICB9XG4gIHN1Yi5kZXBzID0gaGVhZDtcbiAgc3ViLmRlcHNUYWlsID0gdGFpbDtcbn1cbmZ1bmN0aW9uIGlzRGlydHkoc3ViKSB7XG4gIGZvciAobGV0IGxpbmsgPSBzdWIuZGVwczsgbGluazsgbGluayA9IGxpbmsubmV4dERlcCkge1xuICAgIGlmIChsaW5rLmRlcC52ZXJzaW9uICE9PSBsaW5rLnZlcnNpb24gfHwgbGluay5kZXAuY29tcHV0ZWQgJiYgKHJlZnJlc2hDb21wdXRlZChsaW5rLmRlcC5jb21wdXRlZCkgfHwgbGluay5kZXAudmVyc2lvbiAhPT0gbGluay52ZXJzaW9uKSkge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICB9XG4gIGlmIChzdWIuX2RpcnR5KSB7XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cbiAgcmV0dXJuIGZhbHNlO1xufVxuZnVuY3Rpb24gcmVmcmVzaENvbXB1dGVkKGNvbXB1dGVkKSB7XG4gIGlmIChjb21wdXRlZC5mbGFncyAmIDQgJiYgIShjb21wdXRlZC5mbGFncyAmIDE2KSkge1xuICAgIHJldHVybjtcbiAgfVxuICBjb21wdXRlZC5mbGFncyAmPSAtMTc7XG4gIGlmIChjb21wdXRlZC5nbG9iYWxWZXJzaW9uID09PSBnbG9iYWxWZXJzaW9uKSB7XG4gICAgcmV0dXJuO1xuICB9XG4gIGNvbXB1dGVkLmdsb2JhbFZlcnNpb24gPSBnbG9iYWxWZXJzaW9uO1xuICBpZiAoIWNvbXB1dGVkLmlzU1NSICYmIGNvbXB1dGVkLmZsYWdzICYgMTI4ICYmICghY29tcHV0ZWQuZGVwcyAmJiAhY29tcHV0ZWQuX2RpcnR5IHx8ICFpc0RpcnR5KGNvbXB1dGVkKSkpIHtcbiAgICByZXR1cm47XG4gIH1cbiAgY29tcHV0ZWQuZmxhZ3MgfD0gMjtcbiAgY29uc3QgZGVwID0gY29tcHV0ZWQuZGVwO1xuICBjb25zdCBwcmV2U3ViID0gYWN0aXZlU3ViO1xuICBjb25zdCBwcmV2U2hvdWxkVHJhY2sgPSBzaG91bGRUcmFjaztcbiAgYWN0aXZlU3ViID0gY29tcHV0ZWQ7XG4gIHNob3VsZFRyYWNrID0gdHJ1ZTtcbiAgdHJ5IHtcbiAgICBwcmVwYXJlRGVwcyhjb21wdXRlZCk7XG4gICAgY29uc3QgdmFsdWUgPSBjb21wdXRlZC5mbihjb21wdXRlZC5fdmFsdWUpO1xuICAgIGlmIChkZXAudmVyc2lvbiA9PT0gMCB8fCBoYXNDaGFuZ2VkKHZhbHVlLCBjb21wdXRlZC5fdmFsdWUpKSB7XG4gICAgICBjb21wdXRlZC5mbGFncyB8PSAxMjg7XG4gICAgICBjb21wdXRlZC5fdmFsdWUgPSB2YWx1ZTtcbiAgICAgIGRlcC52ZXJzaW9uKys7XG4gICAgfVxuICB9IGNhdGNoIChlcnIpIHtcbiAgICBkZXAudmVyc2lvbisrO1xuICAgIHRocm93IGVycjtcbiAgfSBmaW5hbGx5IHtcbiAgICBhY3RpdmVTdWIgPSBwcmV2U3ViO1xuICAgIHNob3VsZFRyYWNrID0gcHJldlNob3VsZFRyYWNrO1xuICAgIGNsZWFudXBEZXBzKGNvbXB1dGVkKTtcbiAgICBjb21wdXRlZC5mbGFncyAmPSAtMztcbiAgfVxufVxuZnVuY3Rpb24gcmVtb3ZlU3ViKGxpbmssIHNvZnQgPSBmYWxzZSkge1xuICBjb25zdCB7IGRlcCwgcHJldlN1YiwgbmV4dFN1YiB9ID0gbGluaztcbiAgaWYgKHByZXZTdWIpIHtcbiAgICBwcmV2U3ViLm5leHRTdWIgPSBuZXh0U3ViO1xuICAgIGxpbmsucHJldlN1YiA9IHZvaWQgMDtcbiAgfVxuICBpZiAobmV4dFN1Yikge1xuICAgIG5leHRTdWIucHJldlN1YiA9IHByZXZTdWI7XG4gICAgbGluay5uZXh0U3ViID0gdm9pZCAwO1xuICB9XG4gIGlmICghIShwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gXCJwcm9kdWN0aW9uXCIpICYmIGRlcC5zdWJzSGVhZCA9PT0gbGluaykge1xuICAgIGRlcC5zdWJzSGVhZCA9IG5leHRTdWI7XG4gIH1cbiAgaWYgKGRlcC5zdWJzID09PSBsaW5rKSB7XG4gICAgZGVwLnN1YnMgPSBwcmV2U3ViO1xuICAgIGlmICghcHJldlN1YiAmJiBkZXAuY29tcHV0ZWQpIHtcbiAgICAgIGRlcC5jb21wdXRlZC5mbGFncyAmPSAtNTtcbiAgICAgIGZvciAobGV0IGwgPSBkZXAuY29tcHV0ZWQuZGVwczsgbDsgbCA9IGwubmV4dERlcCkge1xuICAgICAgICByZW1vdmVTdWIobCwgdHJ1ZSk7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIGlmICghc29mdCAmJiAhLS1kZXAuc2MgJiYgZGVwLm1hcCkge1xuICAgIGRlcC5tYXAuZGVsZXRlKGRlcC5rZXkpO1xuICB9XG59XG5mdW5jdGlvbiByZW1vdmVEZXAobGluaykge1xuICBjb25zdCB7IHByZXZEZXAsIG5leHREZXAgfSA9IGxpbms7XG4gIGlmIChwcmV2RGVwKSB7XG4gICAgcHJldkRlcC5uZXh0RGVwID0gbmV4dERlcDtcbiAgICBsaW5rLnByZXZEZXAgPSB2b2lkIDA7XG4gIH1cbiAgaWYgKG5leHREZXApIHtcbiAgICBuZXh0RGVwLnByZXZEZXAgPSBwcmV2RGVwO1xuICAgIGxpbmsubmV4dERlcCA9IHZvaWQgMDtcbiAgfVxufVxuZnVuY3Rpb24gZWZmZWN0KGZuLCBvcHRpb25zKSB7XG4gIGlmIChmbi5lZmZlY3QgaW5zdGFuY2VvZiBSZWFjdGl2ZUVmZmVjdCkge1xuICAgIGZuID0gZm4uZWZmZWN0LmZuO1xuICB9XG4gIGNvbnN0IGUgPSBuZXcgUmVhY3RpdmVFZmZlY3QoZm4pO1xuICBpZiAob3B0aW9ucykge1xuICAgIGV4dGVuZChlLCBvcHRpb25zKTtcbiAgfVxuICB0cnkge1xuICAgIGUucnVuKCk7XG4gIH0gY2F0Y2ggKGVycikge1xuICAgIGUuc3RvcCgpO1xuICAgIHRocm93IGVycjtcbiAgfVxuICBjb25zdCBydW5uZXIgPSBlLnJ1bi5iaW5kKGUpO1xuICBydW5uZXIuZWZmZWN0ID0gZTtcbiAgcmV0dXJuIHJ1bm5lcjtcbn1cbmZ1bmN0aW9uIHN0b3AocnVubmVyKSB7XG4gIHJ1bm5lci5lZmZlY3Quc3RvcCgpO1xufVxubGV0IHNob3VsZFRyYWNrID0gdHJ1ZTtcbmNvbnN0IHRyYWNrU3RhY2sgPSBbXTtcbmZ1bmN0aW9uIHBhdXNlVHJhY2tpbmcoKSB7XG4gIHRyYWNrU3RhY2sucHVzaChzaG91bGRUcmFjayk7XG4gIHNob3VsZFRyYWNrID0gZmFsc2U7XG59XG5mdW5jdGlvbiBlbmFibGVUcmFja2luZygpIHtcbiAgdHJhY2tTdGFjay5wdXNoKHNob3VsZFRyYWNrKTtcbiAgc2hvdWxkVHJhY2sgPSB0cnVlO1xufVxuZnVuY3Rpb24gcmVzZXRUcmFja2luZygpIHtcbiAgY29uc3QgbGFzdCA9IHRyYWNrU3RhY2sucG9wKCk7XG4gIHNob3VsZFRyYWNrID0gbGFzdCA9PT0gdm9pZCAwID8gdHJ1ZSA6IGxhc3Q7XG59XG5mdW5jdGlvbiBvbkVmZmVjdENsZWFudXAoZm4sIGZhaWxTaWxlbnRseSA9IGZhbHNlKSB7XG4gIGlmIChhY3RpdmVTdWIgaW5zdGFuY2VvZiBSZWFjdGl2ZUVmZmVjdCkge1xuICAgIGFjdGl2ZVN1Yi5jbGVhbnVwID0gZm47XG4gIH0gZWxzZSBpZiAoISEocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09IFwicHJvZHVjdGlvblwiKSAmJiAhZmFpbFNpbGVudGx5KSB7XG4gICAgd2FybihcbiAgICAgIGBvbkVmZmVjdENsZWFudXAoKSB3YXMgY2FsbGVkIHdoZW4gdGhlcmUgd2FzIG5vIGFjdGl2ZSBlZmZlY3QgdG8gYXNzb2NpYXRlIHdpdGguYFxuICAgICk7XG4gIH1cbn1cbmZ1bmN0aW9uIGNsZWFudXBFZmZlY3QoZSkge1xuICBjb25zdCB7IGNsZWFudXAgfSA9IGU7XG4gIGUuY2xlYW51cCA9IHZvaWQgMDtcbiAgaWYgKGNsZWFudXApIHtcbiAgICBjb25zdCBwcmV2U3ViID0gYWN0aXZlU3ViO1xuICAgIGFjdGl2ZVN1YiA9IHZvaWQgMDtcbiAgICB0cnkge1xuICAgICAgY2xlYW51cCgpO1xuICAgIH0gZmluYWxseSB7XG4gICAgICBhY3RpdmVTdWIgPSBwcmV2U3ViO1xuICAgIH1cbiAgfVxufVxuXG5sZXQgZ2xvYmFsVmVyc2lvbiA9IDA7XG5jbGFzcyBMaW5rIHtcbiAgY29uc3RydWN0b3Ioc3ViLCBkZXApIHtcbiAgICB0aGlzLnN1YiA9IHN1YjtcbiAgICB0aGlzLmRlcCA9IGRlcDtcbiAgICB0aGlzLnZlcnNpb24gPSBkZXAudmVyc2lvbjtcbiAgICB0aGlzLm5leHREZXAgPSB0aGlzLnByZXZEZXAgPSB0aGlzLm5leHRTdWIgPSB0aGlzLnByZXZTdWIgPSB0aGlzLnByZXZBY3RpdmVMaW5rID0gdm9pZCAwO1xuICB9XG59XG5jbGFzcyBEZXAge1xuICAvLyBUT0RPIGlzb2xhdGVkRGVjbGFyYXRpb25zIFwiX192X3NraXBcIlxuICBjb25zdHJ1Y3Rvcihjb21wdXRlZCkge1xuICAgIHRoaXMuY29tcHV0ZWQgPSBjb21wdXRlZDtcbiAgICB0aGlzLnZlcnNpb24gPSAwO1xuICAgIC8qKlxuICAgICAqIExpbmsgYmV0d2VlbiB0aGlzIGRlcCBhbmQgdGhlIGN1cnJlbnQgYWN0aXZlIGVmZmVjdFxuICAgICAqL1xuICAgIHRoaXMuYWN0aXZlTGluayA9IHZvaWQgMDtcbiAgICAvKipcbiAgICAgKiBEb3VibHkgbGlua2VkIGxpc3QgcmVwcmVzZW50aW5nIHRoZSBzdWJzY3JpYmluZyBlZmZlY3RzICh0YWlsKVxuICAgICAqL1xuICAgIHRoaXMuc3VicyA9IHZvaWQgMDtcbiAgICAvKipcbiAgICAgKiBGb3Igb2JqZWN0IHByb3BlcnR5IGRlcHMgY2xlYW51cFxuICAgICAqL1xuICAgIHRoaXMubWFwID0gdm9pZCAwO1xuICAgIHRoaXMua2V5ID0gdm9pZCAwO1xuICAgIC8qKlxuICAgICAqIFN1YnNjcmliZXIgY291bnRlclxuICAgICAqL1xuICAgIHRoaXMuc2MgPSAwO1xuICAgIC8qKlxuICAgICAqIEBpbnRlcm5hbFxuICAgICAqL1xuICAgIHRoaXMuX192X3NraXAgPSB0cnVlO1xuICAgIGlmICghIShwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gXCJwcm9kdWN0aW9uXCIpKSB7XG4gICAgICB0aGlzLnN1YnNIZWFkID0gdm9pZCAwO1xuICAgIH1cbiAgfVxuICB0cmFjayhkZWJ1Z0luZm8pIHtcbiAgICBpZiAoIWFjdGl2ZVN1YiB8fCAhc2hvdWxkVHJhY2sgfHwgYWN0aXZlU3ViID09PSB0aGlzLmNvbXB1dGVkKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGxldCBsaW5rID0gdGhpcy5hY3RpdmVMaW5rO1xuICAgIGlmIChsaW5rID09PSB2b2lkIDAgfHwgbGluay5zdWIgIT09IGFjdGl2ZVN1Yikge1xuICAgICAgbGluayA9IHRoaXMuYWN0aXZlTGluayA9IG5ldyBMaW5rKGFjdGl2ZVN1YiwgdGhpcyk7XG4gICAgICBpZiAoIWFjdGl2ZVN1Yi5kZXBzKSB7XG4gICAgICAgIGFjdGl2ZVN1Yi5kZXBzID0gYWN0aXZlU3ViLmRlcHNUYWlsID0gbGluaztcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGxpbmsucHJldkRlcCA9IGFjdGl2ZVN1Yi5kZXBzVGFpbDtcbiAgICAgICAgYWN0aXZlU3ViLmRlcHNUYWlsLm5leHREZXAgPSBsaW5rO1xuICAgICAgICBhY3RpdmVTdWIuZGVwc1RhaWwgPSBsaW5rO1xuICAgICAgfVxuICAgICAgYWRkU3ViKGxpbmspO1xuICAgIH0gZWxzZSBpZiAobGluay52ZXJzaW9uID09PSAtMSkge1xuICAgICAgbGluay52ZXJzaW9uID0gdGhpcy52ZXJzaW9uO1xuICAgICAgaWYgKGxpbmsubmV4dERlcCkge1xuICAgICAgICBjb25zdCBuZXh0ID0gbGluay5uZXh0RGVwO1xuICAgICAgICBuZXh0LnByZXZEZXAgPSBsaW5rLnByZXZEZXA7XG4gICAgICAgIGlmIChsaW5rLnByZXZEZXApIHtcbiAgICAgICAgICBsaW5rLnByZXZEZXAubmV4dERlcCA9IG5leHQ7XG4gICAgICAgIH1cbiAgICAgICAgbGluay5wcmV2RGVwID0gYWN0aXZlU3ViLmRlcHNUYWlsO1xuICAgICAgICBsaW5rLm5leHREZXAgPSB2b2lkIDA7XG4gICAgICAgIGFjdGl2ZVN1Yi5kZXBzVGFpbC5uZXh0RGVwID0gbGluaztcbiAgICAgICAgYWN0aXZlU3ViLmRlcHNUYWlsID0gbGluaztcbiAgICAgICAgaWYgKGFjdGl2ZVN1Yi5kZXBzID09PSBsaW5rKSB7XG4gICAgICAgICAgYWN0aXZlU3ViLmRlcHMgPSBuZXh0O1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIGlmICghIShwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gXCJwcm9kdWN0aW9uXCIpICYmIGFjdGl2ZVN1Yi5vblRyYWNrKSB7XG4gICAgICBhY3RpdmVTdWIub25UcmFjayhcbiAgICAgICAgZXh0ZW5kKFxuICAgICAgICAgIHtcbiAgICAgICAgICAgIGVmZmVjdDogYWN0aXZlU3ViXG4gICAgICAgICAgfSxcbiAgICAgICAgICBkZWJ1Z0luZm9cbiAgICAgICAgKVxuICAgICAgKTtcbiAgICB9XG4gICAgcmV0dXJuIGxpbms7XG4gIH1cbiAgdHJpZ2dlcihkZWJ1Z0luZm8pIHtcbiAgICB0aGlzLnZlcnNpb24rKztcbiAgICBnbG9iYWxWZXJzaW9uKys7XG4gICAgdGhpcy5ub3RpZnkoZGVidWdJbmZvKTtcbiAgfVxuICBub3RpZnkoZGVidWdJbmZvKSB7XG4gICAgc3RhcnRCYXRjaCgpO1xuICAgIHRyeSB7XG4gICAgICBpZiAoISEocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09IFwicHJvZHVjdGlvblwiKSkge1xuICAgICAgICBmb3IgKGxldCBoZWFkID0gdGhpcy5zdWJzSGVhZDsgaGVhZDsgaGVhZCA9IGhlYWQubmV4dFN1Yikge1xuICAgICAgICAgIGlmIChoZWFkLnN1Yi5vblRyaWdnZXIgJiYgIShoZWFkLnN1Yi5mbGFncyAmIDgpKSB7XG4gICAgICAgICAgICBoZWFkLnN1Yi5vblRyaWdnZXIoXG4gICAgICAgICAgICAgIGV4dGVuZChcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICBlZmZlY3Q6IGhlYWQuc3ViXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBkZWJ1Z0luZm9cbiAgICAgICAgICAgICAgKVxuICAgICAgICAgICAgKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGZvciAobGV0IGxpbmsgPSB0aGlzLnN1YnM7IGxpbms7IGxpbmsgPSBsaW5rLnByZXZTdWIpIHtcbiAgICAgICAgaWYgKGxpbmsuc3ViLm5vdGlmeSgpKSB7XG4gICAgICAgICAgO1xuICAgICAgICAgIGxpbmsuc3ViLmRlcC5ub3RpZnkoKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0gZmluYWxseSB7XG4gICAgICBlbmRCYXRjaCgpO1xuICAgIH1cbiAgfVxufVxuZnVuY3Rpb24gYWRkU3ViKGxpbmspIHtcbiAgbGluay5kZXAuc2MrKztcbiAgaWYgKGxpbmsuc3ViLmZsYWdzICYgNCkge1xuICAgIGNvbnN0IGNvbXB1dGVkID0gbGluay5kZXAuY29tcHV0ZWQ7XG4gICAgaWYgKGNvbXB1dGVkICYmICFsaW5rLmRlcC5zdWJzKSB7XG4gICAgICBjb21wdXRlZC5mbGFncyB8PSA0IHwgMTY7XG4gICAgICBmb3IgKGxldCBsID0gY29tcHV0ZWQuZGVwczsgbDsgbCA9IGwubmV4dERlcCkge1xuICAgICAgICBhZGRTdWIobCk7XG4gICAgICB9XG4gICAgfVxuICAgIGNvbnN0IGN1cnJlbnRUYWlsID0gbGluay5kZXAuc3VicztcbiAgICBpZiAoY3VycmVudFRhaWwgIT09IGxpbmspIHtcbiAgICAgIGxpbmsucHJldlN1YiA9IGN1cnJlbnRUYWlsO1xuICAgICAgaWYgKGN1cnJlbnRUYWlsKSBjdXJyZW50VGFpbC5uZXh0U3ViID0gbGluaztcbiAgICB9XG4gICAgaWYgKCEhKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSBcInByb2R1Y3Rpb25cIikgJiYgbGluay5kZXAuc3Vic0hlYWQgPT09IHZvaWQgMCkge1xuICAgICAgbGluay5kZXAuc3Vic0hlYWQgPSBsaW5rO1xuICAgIH1cbiAgICBsaW5rLmRlcC5zdWJzID0gbGluaztcbiAgfVxufVxuY29uc3QgdGFyZ2V0TWFwID0gLyogQF9fUFVSRV9fICovIG5ldyBXZWFrTWFwKCk7XG5jb25zdCBJVEVSQVRFX0tFWSA9IC8qIEBfX1BVUkVfXyAqLyBTeW1ib2woXG4gICEhKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSBcInByb2R1Y3Rpb25cIikgPyBcIk9iamVjdCBpdGVyYXRlXCIgOiBcIlwiXG4pO1xuY29uc3QgTUFQX0tFWV9JVEVSQVRFX0tFWSA9IC8qIEBfX1BVUkVfXyAqLyBTeW1ib2woXG4gICEhKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSBcInByb2R1Y3Rpb25cIikgPyBcIk1hcCBrZXlzIGl0ZXJhdGVcIiA6IFwiXCJcbik7XG5jb25zdCBBUlJBWV9JVEVSQVRFX0tFWSA9IC8qIEBfX1BVUkVfXyAqLyBTeW1ib2woXG4gICEhKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSBcInByb2R1Y3Rpb25cIikgPyBcIkFycmF5IGl0ZXJhdGVcIiA6IFwiXCJcbik7XG5mdW5jdGlvbiB0cmFjayh0YXJnZXQsIHR5cGUsIGtleSkge1xuICBpZiAoc2hvdWxkVHJhY2sgJiYgYWN0aXZlU3ViKSB7XG4gICAgbGV0IGRlcHNNYXAgPSB0YXJnZXRNYXAuZ2V0KHRhcmdldCk7XG4gICAgaWYgKCFkZXBzTWFwKSB7XG4gICAgICB0YXJnZXRNYXAuc2V0KHRhcmdldCwgZGVwc01hcCA9IC8qIEBfX1BVUkVfXyAqLyBuZXcgTWFwKCkpO1xuICAgIH1cbiAgICBsZXQgZGVwID0gZGVwc01hcC5nZXQoa2V5KTtcbiAgICBpZiAoIWRlcCkge1xuICAgICAgZGVwc01hcC5zZXQoa2V5LCBkZXAgPSBuZXcgRGVwKCkpO1xuICAgICAgZGVwLm1hcCA9IGRlcHNNYXA7XG4gICAgICBkZXAua2V5ID0ga2V5O1xuICAgIH1cbiAgICBpZiAoISEocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09IFwicHJvZHVjdGlvblwiKSkge1xuICAgICAgZGVwLnRyYWNrKHtcbiAgICAgICAgdGFyZ2V0LFxuICAgICAgICB0eXBlLFxuICAgICAgICBrZXlcbiAgICAgIH0pO1xuICAgIH0gZWxzZSB7XG4gICAgICBkZXAudHJhY2soKTtcbiAgICB9XG4gIH1cbn1cbmZ1bmN0aW9uIHRyaWdnZXIodGFyZ2V0LCB0eXBlLCBrZXksIG5ld1ZhbHVlLCBvbGRWYWx1ZSwgb2xkVGFyZ2V0KSB7XG4gIGNvbnN0IGRlcHNNYXAgPSB0YXJnZXRNYXAuZ2V0KHRhcmdldCk7XG4gIGlmICghZGVwc01hcCkge1xuICAgIGdsb2JhbFZlcnNpb24rKztcbiAgICByZXR1cm47XG4gIH1cbiAgY29uc3QgcnVuID0gKGRlcCkgPT4ge1xuICAgIGlmIChkZXApIHtcbiAgICAgIGlmICghIShwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gXCJwcm9kdWN0aW9uXCIpKSB7XG4gICAgICAgIGRlcC50cmlnZ2VyKHtcbiAgICAgICAgICB0YXJnZXQsXG4gICAgICAgICAgdHlwZSxcbiAgICAgICAgICBrZXksXG4gICAgICAgICAgbmV3VmFsdWUsXG4gICAgICAgICAgb2xkVmFsdWUsXG4gICAgICAgICAgb2xkVGFyZ2V0XG4gICAgICAgIH0pO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgZGVwLnRyaWdnZXIoKTtcbiAgICAgIH1cbiAgICB9XG4gIH07XG4gIHN0YXJ0QmF0Y2goKTtcbiAgaWYgKHR5cGUgPT09IFwiY2xlYXJcIikge1xuICAgIGRlcHNNYXAuZm9yRWFjaChydW4pO1xuICB9IGVsc2Uge1xuICAgIGNvbnN0IHRhcmdldElzQXJyYXkgPSBpc0FycmF5KHRhcmdldCk7XG4gICAgY29uc3QgaXNBcnJheUluZGV4ID0gdGFyZ2V0SXNBcnJheSAmJiBpc0ludGVnZXJLZXkoa2V5KTtcbiAgICBpZiAodGFyZ2V0SXNBcnJheSAmJiBrZXkgPT09IFwibGVuZ3RoXCIpIHtcbiAgICAgIGNvbnN0IG5ld0xlbmd0aCA9IE51bWJlcihuZXdWYWx1ZSk7XG4gICAgICBkZXBzTWFwLmZvckVhY2goKGRlcCwga2V5MikgPT4ge1xuICAgICAgICBpZiAoa2V5MiA9PT0gXCJsZW5ndGhcIiB8fCBrZXkyID09PSBBUlJBWV9JVEVSQVRFX0tFWSB8fCAhaXNTeW1ib2woa2V5MikgJiYga2V5MiA+PSBuZXdMZW5ndGgpIHtcbiAgICAgICAgICBydW4oZGVwKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGlmIChrZXkgIT09IHZvaWQgMCB8fCBkZXBzTWFwLmhhcyh2b2lkIDApKSB7XG4gICAgICAgIHJ1bihkZXBzTWFwLmdldChrZXkpKTtcbiAgICAgIH1cbiAgICAgIGlmIChpc0FycmF5SW5kZXgpIHtcbiAgICAgICAgcnVuKGRlcHNNYXAuZ2V0KEFSUkFZX0lURVJBVEVfS0VZKSk7XG4gICAgICB9XG4gICAgICBzd2l0Y2ggKHR5cGUpIHtcbiAgICAgICAgY2FzZSBcImFkZFwiOlxuICAgICAgICAgIGlmICghdGFyZ2V0SXNBcnJheSkge1xuICAgICAgICAgICAgcnVuKGRlcHNNYXAuZ2V0KElURVJBVEVfS0VZKSk7XG4gICAgICAgICAgICBpZiAoaXNNYXAodGFyZ2V0KSkge1xuICAgICAgICAgICAgICBydW4oZGVwc01hcC5nZXQoTUFQX0tFWV9JVEVSQVRFX0tFWSkpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0gZWxzZSBpZiAoaXNBcnJheUluZGV4KSB7XG4gICAgICAgICAgICBydW4oZGVwc01hcC5nZXQoXCJsZW5ndGhcIikpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBcImRlbGV0ZVwiOlxuICAgICAgICAgIGlmICghdGFyZ2V0SXNBcnJheSkge1xuICAgICAgICAgICAgcnVuKGRlcHNNYXAuZ2V0KElURVJBVEVfS0VZKSk7XG4gICAgICAgICAgICBpZiAoaXNNYXAodGFyZ2V0KSkge1xuICAgICAgICAgICAgICBydW4oZGVwc01hcC5nZXQoTUFQX0tFWV9JVEVSQVRFX0tFWSkpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBcInNldFwiOlxuICAgICAgICAgIGlmIChpc01hcCh0YXJnZXQpKSB7XG4gICAgICAgICAgICBydW4oZGVwc01hcC5nZXQoSVRFUkFURV9LRVkpKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIGVuZEJhdGNoKCk7XG59XG5mdW5jdGlvbiBnZXREZXBGcm9tUmVhY3RpdmUob2JqZWN0LCBrZXkpIHtcbiAgY29uc3QgZGVwTWFwID0gdGFyZ2V0TWFwLmdldChvYmplY3QpO1xuICByZXR1cm4gZGVwTWFwICYmIGRlcE1hcC5nZXQoa2V5KTtcbn1cblxuZnVuY3Rpb24gcmVhY3RpdmVSZWFkQXJyYXkoYXJyYXkpIHtcbiAgY29uc3QgcmF3ID0gdG9SYXcoYXJyYXkpO1xuICBpZiAocmF3ID09PSBhcnJheSkgcmV0dXJuIHJhdztcbiAgdHJhY2socmF3LCBcIml0ZXJhdGVcIiwgQVJSQVlfSVRFUkFURV9LRVkpO1xuICByZXR1cm4gaXNTaGFsbG93KGFycmF5KSA/IHJhdyA6IHJhdy5tYXAodG9SZWFjdGl2ZSk7XG59XG5mdW5jdGlvbiBzaGFsbG93UmVhZEFycmF5KGFycikge1xuICB0cmFjayhhcnIgPSB0b1JhdyhhcnIpLCBcIml0ZXJhdGVcIiwgQVJSQVlfSVRFUkFURV9LRVkpO1xuICByZXR1cm4gYXJyO1xufVxuZnVuY3Rpb24gdG9XcmFwcGVkKHRhcmdldCwgaXRlbSkge1xuICBpZiAoaXNSZWFkb25seSh0YXJnZXQpKSB7XG4gICAgcmV0dXJuIGlzUmVhY3RpdmUodGFyZ2V0KSA/IHRvUmVhZG9ubHkodG9SZWFjdGl2ZShpdGVtKSkgOiB0b1JlYWRvbmx5KGl0ZW0pO1xuICB9XG4gIHJldHVybiB0b1JlYWN0aXZlKGl0ZW0pO1xufVxuY29uc3QgYXJyYXlJbnN0cnVtZW50YXRpb25zID0ge1xuICBfX3Byb3RvX186IG51bGwsXG4gIFtTeW1ib2wuaXRlcmF0b3JdKCkge1xuICAgIHJldHVybiBpdGVyYXRvcih0aGlzLCBTeW1ib2wuaXRlcmF0b3IsIChpdGVtKSA9PiB0b1dyYXBwZWQodGhpcywgaXRlbSkpO1xuICB9LFxuICBjb25jYXQoLi4uYXJncykge1xuICAgIHJldHVybiByZWFjdGl2ZVJlYWRBcnJheSh0aGlzKS5jb25jYXQoXG4gICAgICAuLi5hcmdzLm1hcCgoeCkgPT4gaXNBcnJheSh4KSA/IHJlYWN0aXZlUmVhZEFycmF5KHgpIDogeClcbiAgICApO1xuICB9LFxuICBlbnRyaWVzKCkge1xuICAgIHJldHVybiBpdGVyYXRvcih0aGlzLCBcImVudHJpZXNcIiwgKHZhbHVlKSA9PiB7XG4gICAgICB2YWx1ZVsxXSA9IHRvV3JhcHBlZCh0aGlzLCB2YWx1ZVsxXSk7XG4gICAgICByZXR1cm4gdmFsdWU7XG4gICAgfSk7XG4gIH0sXG4gIGV2ZXJ5KGZuLCB0aGlzQXJnKSB7XG4gICAgcmV0dXJuIGFwcGx5KHRoaXMsIFwiZXZlcnlcIiwgZm4sIHRoaXNBcmcsIHZvaWQgMCwgYXJndW1lbnRzKTtcbiAgfSxcbiAgZmlsdGVyKGZuLCB0aGlzQXJnKSB7XG4gICAgcmV0dXJuIGFwcGx5KFxuICAgICAgdGhpcyxcbiAgICAgIFwiZmlsdGVyXCIsXG4gICAgICBmbixcbiAgICAgIHRoaXNBcmcsXG4gICAgICAodikgPT4gdi5tYXAoKGl0ZW0pID0+IHRvV3JhcHBlZCh0aGlzLCBpdGVtKSksXG4gICAgICBhcmd1bWVudHNcbiAgICApO1xuICB9LFxuICBmaW5kKGZuLCB0aGlzQXJnKSB7XG4gICAgcmV0dXJuIGFwcGx5KFxuICAgICAgdGhpcyxcbiAgICAgIFwiZmluZFwiLFxuICAgICAgZm4sXG4gICAgICB0aGlzQXJnLFxuICAgICAgKGl0ZW0pID0+IHRvV3JhcHBlZCh0aGlzLCBpdGVtKSxcbiAgICAgIGFyZ3VtZW50c1xuICAgICk7XG4gIH0sXG4gIGZpbmRJbmRleChmbiwgdGhpc0FyZykge1xuICAgIHJldHVybiBhcHBseSh0aGlzLCBcImZpbmRJbmRleFwiLCBmbiwgdGhpc0FyZywgdm9pZCAwLCBhcmd1bWVudHMpO1xuICB9LFxuICBmaW5kTGFzdChmbiwgdGhpc0FyZykge1xuICAgIHJldHVybiBhcHBseShcbiAgICAgIHRoaXMsXG4gICAgICBcImZpbmRMYXN0XCIsXG4gICAgICBmbixcbiAgICAgIHRoaXNBcmcsXG4gICAgICAoaXRlbSkgPT4gdG9XcmFwcGVkKHRoaXMsIGl0ZW0pLFxuICAgICAgYXJndW1lbnRzXG4gICAgKTtcbiAgfSxcbiAgZmluZExhc3RJbmRleChmbiwgdGhpc0FyZykge1xuICAgIHJldHVybiBhcHBseSh0aGlzLCBcImZpbmRMYXN0SW5kZXhcIiwgZm4sIHRoaXNBcmcsIHZvaWQgMCwgYXJndW1lbnRzKTtcbiAgfSxcbiAgLy8gZmxhdCwgZmxhdE1hcCBjb3VsZCBiZW5lZml0IGZyb20gQVJSQVlfSVRFUkFURSBidXQgYXJlIG5vdCBzdHJhaWdodC1mb3J3YXJkIHRvIGltcGxlbWVudFxuICBmb3JFYWNoKGZuLCB0aGlzQXJnKSB7XG4gICAgcmV0dXJuIGFwcGx5KHRoaXMsIFwiZm9yRWFjaFwiLCBmbiwgdGhpc0FyZywgdm9pZCAwLCBhcmd1bWVudHMpO1xuICB9LFxuICBpbmNsdWRlcyguLi5hcmdzKSB7XG4gICAgcmV0dXJuIHNlYXJjaFByb3h5KHRoaXMsIFwiaW5jbHVkZXNcIiwgYXJncyk7XG4gIH0sXG4gIGluZGV4T2YoLi4uYXJncykge1xuICAgIHJldHVybiBzZWFyY2hQcm94eSh0aGlzLCBcImluZGV4T2ZcIiwgYXJncyk7XG4gIH0sXG4gIGpvaW4oc2VwYXJhdG9yKSB7XG4gICAgcmV0dXJuIHJlYWN0aXZlUmVhZEFycmF5KHRoaXMpLmpvaW4oc2VwYXJhdG9yKTtcbiAgfSxcbiAgLy8ga2V5cygpIGl0ZXJhdG9yIG9ubHkgcmVhZHMgYGxlbmd0aGAsIG5vIG9wdGltaXphdGlvbiByZXF1aXJlZFxuICBsYXN0SW5kZXhPZiguLi5hcmdzKSB7XG4gICAgcmV0dXJuIHNlYXJjaFByb3h5KHRoaXMsIFwibGFzdEluZGV4T2ZcIiwgYXJncyk7XG4gIH0sXG4gIG1hcChmbiwgdGhpc0FyZykge1xuICAgIHJldHVybiBhcHBseSh0aGlzLCBcIm1hcFwiLCBmbiwgdGhpc0FyZywgdm9pZCAwLCBhcmd1bWVudHMpO1xuICB9LFxuICBwb3AoKSB7XG4gICAgcmV0dXJuIG5vVHJhY2tpbmcodGhpcywgXCJwb3BcIik7XG4gIH0sXG4gIHB1c2goLi4uYXJncykge1xuICAgIHJldHVybiBub1RyYWNraW5nKHRoaXMsIFwicHVzaFwiLCBhcmdzKTtcbiAgfSxcbiAgcmVkdWNlKGZuLCAuLi5hcmdzKSB7XG4gICAgcmV0dXJuIHJlZHVjZSh0aGlzLCBcInJlZHVjZVwiLCBmbiwgYXJncyk7XG4gIH0sXG4gIHJlZHVjZVJpZ2h0KGZuLCAuLi5hcmdzKSB7XG4gICAgcmV0dXJuIHJlZHVjZSh0aGlzLCBcInJlZHVjZVJpZ2h0XCIsIGZuLCBhcmdzKTtcbiAgfSxcbiAgc2hpZnQoKSB7XG4gICAgcmV0dXJuIG5vVHJhY2tpbmcodGhpcywgXCJzaGlmdFwiKTtcbiAgfSxcbiAgLy8gc2xpY2UgY291bGQgdXNlIEFSUkFZX0lURVJBVEUgYnV0IGFsc28gc2VlbXMgdG8gYmVnIGZvciByYW5nZSB0cmFja2luZ1xuICBzb21lKGZuLCB0aGlzQXJnKSB7XG4gICAgcmV0dXJuIGFwcGx5KHRoaXMsIFwic29tZVwiLCBmbiwgdGhpc0FyZywgdm9pZCAwLCBhcmd1bWVudHMpO1xuICB9LFxuICBzcGxpY2UoLi4uYXJncykge1xuICAgIHJldHVybiBub1RyYWNraW5nKHRoaXMsIFwic3BsaWNlXCIsIGFyZ3MpO1xuICB9LFxuICB0b1JldmVyc2VkKCkge1xuICAgIHJldHVybiByZWFjdGl2ZVJlYWRBcnJheSh0aGlzKS50b1JldmVyc2VkKCk7XG4gIH0sXG4gIHRvU29ydGVkKGNvbXBhcmVyKSB7XG4gICAgcmV0dXJuIHJlYWN0aXZlUmVhZEFycmF5KHRoaXMpLnRvU29ydGVkKGNvbXBhcmVyKTtcbiAgfSxcbiAgdG9TcGxpY2VkKC4uLmFyZ3MpIHtcbiAgICByZXR1cm4gcmVhY3RpdmVSZWFkQXJyYXkodGhpcykudG9TcGxpY2VkKC4uLmFyZ3MpO1xuICB9LFxuICB1bnNoaWZ0KC4uLmFyZ3MpIHtcbiAgICByZXR1cm4gbm9UcmFja2luZyh0aGlzLCBcInVuc2hpZnRcIiwgYXJncyk7XG4gIH0sXG4gIHZhbHVlcygpIHtcbiAgICByZXR1cm4gaXRlcmF0b3IodGhpcywgXCJ2YWx1ZXNcIiwgKGl0ZW0pID0+IHRvV3JhcHBlZCh0aGlzLCBpdGVtKSk7XG4gIH1cbn07XG5mdW5jdGlvbiBpdGVyYXRvcihzZWxmLCBtZXRob2QsIHdyYXBWYWx1ZSkge1xuICBjb25zdCBhcnIgPSBzaGFsbG93UmVhZEFycmF5KHNlbGYpO1xuICBjb25zdCBpdGVyID0gYXJyW21ldGhvZF0oKTtcbiAgaWYgKGFyciAhPT0gc2VsZiAmJiAhaXNTaGFsbG93KHNlbGYpKSB7XG4gICAgaXRlci5fbmV4dCA9IGl0ZXIubmV4dDtcbiAgICBpdGVyLm5leHQgPSAoKSA9PiB7XG4gICAgICBjb25zdCByZXN1bHQgPSBpdGVyLl9uZXh0KCk7XG4gICAgICBpZiAoIXJlc3VsdC5kb25lKSB7XG4gICAgICAgIHJlc3VsdC52YWx1ZSA9IHdyYXBWYWx1ZShyZXN1bHQudmFsdWUpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9O1xuICB9XG4gIHJldHVybiBpdGVyO1xufVxuY29uc3QgYXJyYXlQcm90byA9IEFycmF5LnByb3RvdHlwZTtcbmZ1bmN0aW9uIGFwcGx5KHNlbGYsIG1ldGhvZCwgZm4sIHRoaXNBcmcsIHdyYXBwZWRSZXRGbiwgYXJncykge1xuICBjb25zdCBhcnIgPSBzaGFsbG93UmVhZEFycmF5KHNlbGYpO1xuICBjb25zdCBuZWVkc1dyYXAgPSBhcnIgIT09IHNlbGYgJiYgIWlzU2hhbGxvdyhzZWxmKTtcbiAgY29uc3QgbWV0aG9kRm4gPSBhcnJbbWV0aG9kXTtcbiAgaWYgKG1ldGhvZEZuICE9PSBhcnJheVByb3RvW21ldGhvZF0pIHtcbiAgICBjb25zdCByZXN1bHQyID0gbWV0aG9kRm4uYXBwbHkoc2VsZiwgYXJncyk7XG4gICAgcmV0dXJuIG5lZWRzV3JhcCA/IHRvUmVhY3RpdmUocmVzdWx0MikgOiByZXN1bHQyO1xuICB9XG4gIGxldCB3cmFwcGVkRm4gPSBmbjtcbiAgaWYgKGFyciAhPT0gc2VsZikge1xuICAgIGlmIChuZWVkc1dyYXApIHtcbiAgICAgIHdyYXBwZWRGbiA9IGZ1bmN0aW9uKGl0ZW0sIGluZGV4KSB7XG4gICAgICAgIHJldHVybiBmbi5jYWxsKHRoaXMsIHRvV3JhcHBlZChzZWxmLCBpdGVtKSwgaW5kZXgsIHNlbGYpO1xuICAgICAgfTtcbiAgICB9IGVsc2UgaWYgKGZuLmxlbmd0aCA+IDIpIHtcbiAgICAgIHdyYXBwZWRGbiA9IGZ1bmN0aW9uKGl0ZW0sIGluZGV4KSB7XG4gICAgICAgIHJldHVybiBmbi5jYWxsKHRoaXMsIGl0ZW0sIGluZGV4LCBzZWxmKTtcbiAgICAgIH07XG4gICAgfVxuICB9XG4gIGNvbnN0IHJlc3VsdCA9IG1ldGhvZEZuLmNhbGwoYXJyLCB3cmFwcGVkRm4sIHRoaXNBcmcpO1xuICByZXR1cm4gbmVlZHNXcmFwICYmIHdyYXBwZWRSZXRGbiA/IHdyYXBwZWRSZXRGbihyZXN1bHQpIDogcmVzdWx0O1xufVxuZnVuY3Rpb24gcmVkdWNlKHNlbGYsIG1ldGhvZCwgZm4sIGFyZ3MpIHtcbiAgY29uc3QgYXJyID0gc2hhbGxvd1JlYWRBcnJheShzZWxmKTtcbiAgbGV0IHdyYXBwZWRGbiA9IGZuO1xuICBpZiAoYXJyICE9PSBzZWxmKSB7XG4gICAgaWYgKCFpc1NoYWxsb3coc2VsZikpIHtcbiAgICAgIHdyYXBwZWRGbiA9IGZ1bmN0aW9uKGFjYywgaXRlbSwgaW5kZXgpIHtcbiAgICAgICAgcmV0dXJuIGZuLmNhbGwodGhpcywgYWNjLCB0b1dyYXBwZWQoc2VsZiwgaXRlbSksIGluZGV4LCBzZWxmKTtcbiAgICAgIH07XG4gICAgfSBlbHNlIGlmIChmbi5sZW5ndGggPiAzKSB7XG4gICAgICB3cmFwcGVkRm4gPSBmdW5jdGlvbihhY2MsIGl0ZW0sIGluZGV4KSB7XG4gICAgICAgIHJldHVybiBmbi5jYWxsKHRoaXMsIGFjYywgaXRlbSwgaW5kZXgsIHNlbGYpO1xuICAgICAgfTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIGFyclttZXRob2RdKHdyYXBwZWRGbiwgLi4uYXJncyk7XG59XG5mdW5jdGlvbiBzZWFyY2hQcm94eShzZWxmLCBtZXRob2QsIGFyZ3MpIHtcbiAgY29uc3QgYXJyID0gdG9SYXcoc2VsZik7XG4gIHRyYWNrKGFyciwgXCJpdGVyYXRlXCIsIEFSUkFZX0lURVJBVEVfS0VZKTtcbiAgY29uc3QgcmVzID0gYXJyW21ldGhvZF0oLi4uYXJncyk7XG4gIGlmICgocmVzID09PSAtMSB8fCByZXMgPT09IGZhbHNlKSAmJiBpc1Byb3h5KGFyZ3NbMF0pKSB7XG4gICAgYXJnc1swXSA9IHRvUmF3KGFyZ3NbMF0pO1xuICAgIHJldHVybiBhcnJbbWV0aG9kXSguLi5hcmdzKTtcbiAgfVxuICByZXR1cm4gcmVzO1xufVxuZnVuY3Rpb24gbm9UcmFja2luZyhzZWxmLCBtZXRob2QsIGFyZ3MgPSBbXSkge1xuICBwYXVzZVRyYWNraW5nKCk7XG4gIHN0YXJ0QmF0Y2goKTtcbiAgY29uc3QgcmVzID0gdG9SYXcoc2VsZilbbWV0aG9kXS5hcHBseShzZWxmLCBhcmdzKTtcbiAgZW5kQmF0Y2goKTtcbiAgcmVzZXRUcmFja2luZygpO1xuICByZXR1cm4gcmVzO1xufVxuXG5jb25zdCBpc05vblRyYWNrYWJsZUtleXMgPSAvKiBAX19QVVJFX18gKi8gbWFrZU1hcChgX19wcm90b19fLF9fdl9pc1JlZixfX2lzVnVlYCk7XG5jb25zdCBidWlsdEluU3ltYm9scyA9IG5ldyBTZXQoXG4gIC8qIEBfX1BVUkVfXyAqLyBPYmplY3QuZ2V0T3duUHJvcGVydHlOYW1lcyhTeW1ib2wpLmZpbHRlcigoa2V5KSA9PiBrZXkgIT09IFwiYXJndW1lbnRzXCIgJiYga2V5ICE9PSBcImNhbGxlclwiKS5tYXAoKGtleSkgPT4gU3ltYm9sW2tleV0pLmZpbHRlcihpc1N5bWJvbClcbik7XG5mdW5jdGlvbiBoYXNPd25Qcm9wZXJ0eShrZXkpIHtcbiAgaWYgKCFpc1N5bWJvbChrZXkpKSBrZXkgPSBTdHJpbmcoa2V5KTtcbiAgY29uc3Qgb2JqID0gdG9SYXcodGhpcyk7XG4gIHRyYWNrKG9iaiwgXCJoYXNcIiwga2V5KTtcbiAgcmV0dXJuIG9iai5oYXNPd25Qcm9wZXJ0eShrZXkpO1xufVxuY2xhc3MgQmFzZVJlYWN0aXZlSGFuZGxlciB7XG4gIGNvbnN0cnVjdG9yKF9pc1JlYWRvbmx5ID0gZmFsc2UsIF9pc1NoYWxsb3cgPSBmYWxzZSkge1xuICAgIHRoaXMuX2lzUmVhZG9ubHkgPSBfaXNSZWFkb25seTtcbiAgICB0aGlzLl9pc1NoYWxsb3cgPSBfaXNTaGFsbG93O1xuICB9XG4gIGdldCh0YXJnZXQsIGtleSwgcmVjZWl2ZXIpIHtcbiAgICBpZiAoa2V5ID09PSBcIl9fdl9za2lwXCIpIHJldHVybiB0YXJnZXRbXCJfX3Zfc2tpcFwiXTtcbiAgICBjb25zdCBpc1JlYWRvbmx5MiA9IHRoaXMuX2lzUmVhZG9ubHksIGlzU2hhbGxvdzIgPSB0aGlzLl9pc1NoYWxsb3c7XG4gICAgaWYgKGtleSA9PT0gXCJfX3ZfaXNSZWFjdGl2ZVwiKSB7XG4gICAgICByZXR1cm4gIWlzUmVhZG9ubHkyO1xuICAgIH0gZWxzZSBpZiAoa2V5ID09PSBcIl9fdl9pc1JlYWRvbmx5XCIpIHtcbiAgICAgIHJldHVybiBpc1JlYWRvbmx5MjtcbiAgICB9IGVsc2UgaWYgKGtleSA9PT0gXCJfX3ZfaXNTaGFsbG93XCIpIHtcbiAgICAgIHJldHVybiBpc1NoYWxsb3cyO1xuICAgIH0gZWxzZSBpZiAoa2V5ID09PSBcIl9fdl9yYXdcIikge1xuICAgICAgaWYgKHJlY2VpdmVyID09PSAoaXNSZWFkb25seTIgPyBpc1NoYWxsb3cyID8gc2hhbGxvd1JlYWRvbmx5TWFwIDogcmVhZG9ubHlNYXAgOiBpc1NoYWxsb3cyID8gc2hhbGxvd1JlYWN0aXZlTWFwIDogcmVhY3RpdmVNYXApLmdldCh0YXJnZXQpIHx8IC8vIHJlY2VpdmVyIGlzIG5vdCB0aGUgcmVhY3RpdmUgcHJveHksIGJ1dCBoYXMgdGhlIHNhbWUgcHJvdG90eXBlXG4gICAgICAvLyB0aGlzIG1lYW5zIHRoZSByZWNlaXZlciBpcyBhIHVzZXIgcHJveHkgb2YgdGhlIHJlYWN0aXZlIHByb3h5XG4gICAgICBPYmplY3QuZ2V0UHJvdG90eXBlT2YodGFyZ2V0KSA9PT0gT2JqZWN0LmdldFByb3RvdHlwZU9mKHJlY2VpdmVyKSkge1xuICAgICAgICByZXR1cm4gdGFyZ2V0O1xuICAgICAgfVxuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBjb25zdCB0YXJnZXRJc0FycmF5ID0gaXNBcnJheSh0YXJnZXQpO1xuICAgIGlmICghaXNSZWFkb25seTIpIHtcbiAgICAgIGxldCBmbjtcbiAgICAgIGlmICh0YXJnZXRJc0FycmF5ICYmIChmbiA9IGFycmF5SW5zdHJ1bWVudGF0aW9uc1trZXldKSkge1xuICAgICAgICByZXR1cm4gZm47XG4gICAgICB9XG4gICAgICBpZiAoa2V5ID09PSBcImhhc093blByb3BlcnR5XCIpIHtcbiAgICAgICAgcmV0dXJuIGhhc093blByb3BlcnR5O1xuICAgICAgfVxuICAgIH1cbiAgICBjb25zdCByZXMgPSBSZWZsZWN0LmdldChcbiAgICAgIHRhcmdldCxcbiAgICAgIGtleSxcbiAgICAgIC8vIGlmIHRoaXMgaXMgYSBwcm94eSB3cmFwcGluZyBhIHJlZiwgcmV0dXJuIG1ldGhvZHMgdXNpbmcgdGhlIHJhdyByZWZcbiAgICAgIC8vIGFzIHJlY2VpdmVyIHNvIHRoYXQgd2UgZG9uJ3QgaGF2ZSB0byBjYWxsIGB0b1Jhd2Agb24gdGhlIHJlZiBpbiBhbGxcbiAgICAgIC8vIGl0cyBjbGFzcyBtZXRob2RzXG4gICAgICBpc1JlZih0YXJnZXQpID8gdGFyZ2V0IDogcmVjZWl2ZXJcbiAgICApO1xuICAgIGlmIChpc1N5bWJvbChrZXkpID8gYnVpbHRJblN5bWJvbHMuaGFzKGtleSkgOiBpc05vblRyYWNrYWJsZUtleXMoa2V5KSkge1xuICAgICAgcmV0dXJuIHJlcztcbiAgICB9XG4gICAgaWYgKCFpc1JlYWRvbmx5Mikge1xuICAgICAgdHJhY2sodGFyZ2V0LCBcImdldFwiLCBrZXkpO1xuICAgIH1cbiAgICBpZiAoaXNTaGFsbG93Mikge1xuICAgICAgcmV0dXJuIHJlcztcbiAgICB9XG4gICAgaWYgKGlzUmVmKHJlcykpIHtcbiAgICAgIGNvbnN0IHZhbHVlID0gdGFyZ2V0SXNBcnJheSAmJiBpc0ludGVnZXJLZXkoa2V5KSA/IHJlcyA6IHJlcy52YWx1ZTtcbiAgICAgIHJldHVybiBpc1JlYWRvbmx5MiAmJiBpc09iamVjdCh2YWx1ZSkgPyByZWFkb25seSh2YWx1ZSkgOiB2YWx1ZTtcbiAgICB9XG4gICAgaWYgKGlzT2JqZWN0KHJlcykpIHtcbiAgICAgIHJldHVybiBpc1JlYWRvbmx5MiA/IHJlYWRvbmx5KHJlcykgOiByZWFjdGl2ZShyZXMpO1xuICAgIH1cbiAgICByZXR1cm4gcmVzO1xuICB9XG59XG5jbGFzcyBNdXRhYmxlUmVhY3RpdmVIYW5kbGVyIGV4dGVuZHMgQmFzZVJlYWN0aXZlSGFuZGxlciB7XG4gIGNvbnN0cnVjdG9yKGlzU2hhbGxvdzIgPSBmYWxzZSkge1xuICAgIHN1cGVyKGZhbHNlLCBpc1NoYWxsb3cyKTtcbiAgfVxuICBzZXQodGFyZ2V0LCBrZXksIHZhbHVlLCByZWNlaXZlcikge1xuICAgIGxldCBvbGRWYWx1ZSA9IHRhcmdldFtrZXldO1xuICAgIGNvbnN0IGlzQXJyYXlXaXRoSW50ZWdlcktleSA9IGlzQXJyYXkodGFyZ2V0KSAmJiBpc0ludGVnZXJLZXkoa2V5KTtcbiAgICBpZiAoIXRoaXMuX2lzU2hhbGxvdykge1xuICAgICAgY29uc3QgaXNPbGRWYWx1ZVJlYWRvbmx5ID0gaXNSZWFkb25seShvbGRWYWx1ZSk7XG4gICAgICBpZiAoIWlzU2hhbGxvdyh2YWx1ZSkgJiYgIWlzUmVhZG9ubHkodmFsdWUpKSB7XG4gICAgICAgIG9sZFZhbHVlID0gdG9SYXcob2xkVmFsdWUpO1xuICAgICAgICB2YWx1ZSA9IHRvUmF3KHZhbHVlKTtcbiAgICAgIH1cbiAgICAgIGlmICghaXNBcnJheVdpdGhJbnRlZ2VyS2V5ICYmIGlzUmVmKG9sZFZhbHVlKSAmJiAhaXNSZWYodmFsdWUpKSB7XG4gICAgICAgIGlmIChpc09sZFZhbHVlUmVhZG9ubHkpIHtcbiAgICAgICAgICBpZiAoISEocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09IFwicHJvZHVjdGlvblwiKSkge1xuICAgICAgICAgICAgd2FybihcbiAgICAgICAgICAgICAgYFNldCBvcGVyYXRpb24gb24ga2V5IFwiJHtTdHJpbmcoa2V5KX1cIiBmYWlsZWQ6IHRhcmdldCBpcyByZWFkb25seS5gLFxuICAgICAgICAgICAgICB0YXJnZXRba2V5XVxuICAgICAgICAgICAgKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgb2xkVmFsdWUudmFsdWUgPSB2YWx1ZTtcbiAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICBjb25zdCBoYWRLZXkgPSBpc0FycmF5V2l0aEludGVnZXJLZXkgPyBOdW1iZXIoa2V5KSA8IHRhcmdldC5sZW5ndGggOiBoYXNPd24odGFyZ2V0LCBrZXkpO1xuICAgIGNvbnN0IHJlc3VsdCA9IFJlZmxlY3Quc2V0KFxuICAgICAgdGFyZ2V0LFxuICAgICAga2V5LFxuICAgICAgdmFsdWUsXG4gICAgICBpc1JlZih0YXJnZXQpID8gdGFyZ2V0IDogcmVjZWl2ZXJcbiAgICApO1xuICAgIGlmICh0YXJnZXQgPT09IHRvUmF3KHJlY2VpdmVyKSkge1xuICAgICAgaWYgKCFoYWRLZXkpIHtcbiAgICAgICAgdHJpZ2dlcih0YXJnZXQsIFwiYWRkXCIsIGtleSwgdmFsdWUpO1xuICAgICAgfSBlbHNlIGlmIChoYXNDaGFuZ2VkKHZhbHVlLCBvbGRWYWx1ZSkpIHtcbiAgICAgICAgdHJpZ2dlcih0YXJnZXQsIFwic2V0XCIsIGtleSwgdmFsdWUsIG9sZFZhbHVlKTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfVxuICBkZWxldGVQcm9wZXJ0eSh0YXJnZXQsIGtleSkge1xuICAgIGNvbnN0IGhhZEtleSA9IGhhc093bih0YXJnZXQsIGtleSk7XG4gICAgY29uc3Qgb2xkVmFsdWUgPSB0YXJnZXRba2V5XTtcbiAgICBjb25zdCByZXN1bHQgPSBSZWZsZWN0LmRlbGV0ZVByb3BlcnR5KHRhcmdldCwga2V5KTtcbiAgICBpZiAocmVzdWx0ICYmIGhhZEtleSkge1xuICAgICAgdHJpZ2dlcih0YXJnZXQsIFwiZGVsZXRlXCIsIGtleSwgdm9pZCAwLCBvbGRWYWx1ZSk7XG4gICAgfVxuICAgIHJldHVybiByZXN1bHQ7XG4gIH1cbiAgaGFzKHRhcmdldCwga2V5KSB7XG4gICAgY29uc3QgcmVzdWx0ID0gUmVmbGVjdC5oYXModGFyZ2V0LCBrZXkpO1xuICAgIGlmICghaXNTeW1ib2woa2V5KSB8fCAhYnVpbHRJblN5bWJvbHMuaGFzKGtleSkpIHtcbiAgICAgIHRyYWNrKHRhcmdldCwgXCJoYXNcIiwga2V5KTtcbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfVxuICBvd25LZXlzKHRhcmdldCkge1xuICAgIHRyYWNrKFxuICAgICAgdGFyZ2V0LFxuICAgICAgXCJpdGVyYXRlXCIsXG4gICAgICBpc0FycmF5KHRhcmdldCkgPyBcImxlbmd0aFwiIDogSVRFUkFURV9LRVlcbiAgICApO1xuICAgIHJldHVybiBSZWZsZWN0Lm93bktleXModGFyZ2V0KTtcbiAgfVxufVxuY2xhc3MgUmVhZG9ubHlSZWFjdGl2ZUhhbmRsZXIgZXh0ZW5kcyBCYXNlUmVhY3RpdmVIYW5kbGVyIHtcbiAgY29uc3RydWN0b3IoaXNTaGFsbG93MiA9IGZhbHNlKSB7XG4gICAgc3VwZXIodHJ1ZSwgaXNTaGFsbG93Mik7XG4gIH1cbiAgc2V0KHRhcmdldCwga2V5KSB7XG4gICAgaWYgKCEhKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSBcInByb2R1Y3Rpb25cIikpIHtcbiAgICAgIHdhcm4oXG4gICAgICAgIGBTZXQgb3BlcmF0aW9uIG9uIGtleSBcIiR7U3RyaW5nKGtleSl9XCIgZmFpbGVkOiB0YXJnZXQgaXMgcmVhZG9ubHkuYCxcbiAgICAgICAgdGFyZ2V0XG4gICAgICApO1xuICAgIH1cbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuICBkZWxldGVQcm9wZXJ0eSh0YXJnZXQsIGtleSkge1xuICAgIGlmICghIShwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gXCJwcm9kdWN0aW9uXCIpKSB7XG4gICAgICB3YXJuKFxuICAgICAgICBgRGVsZXRlIG9wZXJhdGlvbiBvbiBrZXkgXCIke1N0cmluZyhrZXkpfVwiIGZhaWxlZDogdGFyZ2V0IGlzIHJlYWRvbmx5LmAsXG4gICAgICAgIHRhcmdldFxuICAgICAgKTtcbiAgICB9XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cbn1cbmNvbnN0IG11dGFibGVIYW5kbGVycyA9IC8qIEBfX1BVUkVfXyAqLyBuZXcgTXV0YWJsZVJlYWN0aXZlSGFuZGxlcigpO1xuY29uc3QgcmVhZG9ubHlIYW5kbGVycyA9IC8qIEBfX1BVUkVfXyAqLyBuZXcgUmVhZG9ubHlSZWFjdGl2ZUhhbmRsZXIoKTtcbmNvbnN0IHNoYWxsb3dSZWFjdGl2ZUhhbmRsZXJzID0gLyogQF9fUFVSRV9fICovIG5ldyBNdXRhYmxlUmVhY3RpdmVIYW5kbGVyKHRydWUpO1xuY29uc3Qgc2hhbGxvd1JlYWRvbmx5SGFuZGxlcnMgPSAvKiBAX19QVVJFX18gKi8gbmV3IFJlYWRvbmx5UmVhY3RpdmVIYW5kbGVyKHRydWUpO1xuXG5jb25zdCB0b1NoYWxsb3cgPSAodmFsdWUpID0+IHZhbHVlO1xuY29uc3QgZ2V0UHJvdG8gPSAodikgPT4gUmVmbGVjdC5nZXRQcm90b3R5cGVPZih2KTtcbmZ1bmN0aW9uIGNyZWF0ZUl0ZXJhYmxlTWV0aG9kKG1ldGhvZCwgaXNSZWFkb25seTIsIGlzU2hhbGxvdzIpIHtcbiAgcmV0dXJuIGZ1bmN0aW9uKC4uLmFyZ3MpIHtcbiAgICBjb25zdCB0YXJnZXQgPSB0aGlzW1wiX192X3Jhd1wiXTtcbiAgICBjb25zdCByYXdUYXJnZXQgPSB0b1Jhdyh0YXJnZXQpO1xuICAgIGNvbnN0IHRhcmdldElzTWFwID0gaXNNYXAocmF3VGFyZ2V0KTtcbiAgICBjb25zdCBpc1BhaXIgPSBtZXRob2QgPT09IFwiZW50cmllc1wiIHx8IG1ldGhvZCA9PT0gU3ltYm9sLml0ZXJhdG9yICYmIHRhcmdldElzTWFwO1xuICAgIGNvbnN0IGlzS2V5T25seSA9IG1ldGhvZCA9PT0gXCJrZXlzXCIgJiYgdGFyZ2V0SXNNYXA7XG4gICAgY29uc3QgaW5uZXJJdGVyYXRvciA9IHRhcmdldFttZXRob2RdKC4uLmFyZ3MpO1xuICAgIGNvbnN0IHdyYXAgPSBpc1NoYWxsb3cyID8gdG9TaGFsbG93IDogaXNSZWFkb25seTIgPyB0b1JlYWRvbmx5IDogdG9SZWFjdGl2ZTtcbiAgICAhaXNSZWFkb25seTIgJiYgdHJhY2soXG4gICAgICByYXdUYXJnZXQsXG4gICAgICBcIml0ZXJhdGVcIixcbiAgICAgIGlzS2V5T25seSA/IE1BUF9LRVlfSVRFUkFURV9LRVkgOiBJVEVSQVRFX0tFWVxuICAgICk7XG4gICAgcmV0dXJuIGV4dGVuZChcbiAgICAgIC8vIGluaGVyaXRpbmcgYWxsIGl0ZXJhdG9yIHByb3BlcnRpZXNcbiAgICAgIE9iamVjdC5jcmVhdGUoaW5uZXJJdGVyYXRvciksXG4gICAgICB7XG4gICAgICAgIC8vIGl0ZXJhdG9yIHByb3RvY29sXG4gICAgICAgIG5leHQoKSB7XG4gICAgICAgICAgY29uc3QgeyB2YWx1ZSwgZG9uZSB9ID0gaW5uZXJJdGVyYXRvci5uZXh0KCk7XG4gICAgICAgICAgcmV0dXJuIGRvbmUgPyB7IHZhbHVlLCBkb25lIH0gOiB7XG4gICAgICAgICAgICB2YWx1ZTogaXNQYWlyID8gW3dyYXAodmFsdWVbMF0pLCB3cmFwKHZhbHVlWzFdKV0gOiB3cmFwKHZhbHVlKSxcbiAgICAgICAgICAgIGRvbmVcbiAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgICB9XG4gICAgKTtcbiAgfTtcbn1cbmZ1bmN0aW9uIGNyZWF0ZVJlYWRvbmx5TWV0aG9kKHR5cGUpIHtcbiAgcmV0dXJuIGZ1bmN0aW9uKC4uLmFyZ3MpIHtcbiAgICBpZiAoISEocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09IFwicHJvZHVjdGlvblwiKSkge1xuICAgICAgY29uc3Qga2V5ID0gYXJnc1swXSA/IGBvbiBrZXkgXCIke2FyZ3NbMF19XCIgYCA6IGBgO1xuICAgICAgd2FybihcbiAgICAgICAgYCR7Y2FwaXRhbGl6ZSh0eXBlKX0gb3BlcmF0aW9uICR7a2V5fWZhaWxlZDogdGFyZ2V0IGlzIHJlYWRvbmx5LmAsXG4gICAgICAgIHRvUmF3KHRoaXMpXG4gICAgICApO1xuICAgIH1cbiAgICByZXR1cm4gdHlwZSA9PT0gXCJkZWxldGVcIiA/IGZhbHNlIDogdHlwZSA9PT0gXCJjbGVhclwiID8gdm9pZCAwIDogdGhpcztcbiAgfTtcbn1cbmZ1bmN0aW9uIGNyZWF0ZUluc3RydW1lbnRhdGlvbnMocmVhZG9ubHksIHNoYWxsb3cpIHtcbiAgY29uc3QgaW5zdHJ1bWVudGF0aW9ucyA9IHtcbiAgICBnZXQoa2V5KSB7XG4gICAgICBjb25zdCB0YXJnZXQgPSB0aGlzW1wiX192X3Jhd1wiXTtcbiAgICAgIGNvbnN0IHJhd1RhcmdldCA9IHRvUmF3KHRhcmdldCk7XG4gICAgICBjb25zdCByYXdLZXkgPSB0b1JhdyhrZXkpO1xuICAgICAgaWYgKCFyZWFkb25seSkge1xuICAgICAgICBpZiAoaGFzQ2hhbmdlZChrZXksIHJhd0tleSkpIHtcbiAgICAgICAgICB0cmFjayhyYXdUYXJnZXQsIFwiZ2V0XCIsIGtleSk7XG4gICAgICAgIH1cbiAgICAgICAgdHJhY2socmF3VGFyZ2V0LCBcImdldFwiLCByYXdLZXkpO1xuICAgICAgfVxuICAgICAgY29uc3QgeyBoYXMgfSA9IGdldFByb3RvKHJhd1RhcmdldCk7XG4gICAgICBjb25zdCB3cmFwID0gc2hhbGxvdyA/IHRvU2hhbGxvdyA6IHJlYWRvbmx5ID8gdG9SZWFkb25seSA6IHRvUmVhY3RpdmU7XG4gICAgICBpZiAoaGFzLmNhbGwocmF3VGFyZ2V0LCBrZXkpKSB7XG4gICAgICAgIHJldHVybiB3cmFwKHRhcmdldC5nZXQoa2V5KSk7XG4gICAgICB9IGVsc2UgaWYgKGhhcy5jYWxsKHJhd1RhcmdldCwgcmF3S2V5KSkge1xuICAgICAgICByZXR1cm4gd3JhcCh0YXJnZXQuZ2V0KHJhd0tleSkpO1xuICAgICAgfSBlbHNlIGlmICh0YXJnZXQgIT09IHJhd1RhcmdldCkge1xuICAgICAgICB0YXJnZXQuZ2V0KGtleSk7XG4gICAgICB9XG4gICAgfSxcbiAgICBnZXQgc2l6ZSgpIHtcbiAgICAgIGNvbnN0IHRhcmdldCA9IHRoaXNbXCJfX3ZfcmF3XCJdO1xuICAgICAgIXJlYWRvbmx5ICYmIHRyYWNrKHRvUmF3KHRhcmdldCksIFwiaXRlcmF0ZVwiLCBJVEVSQVRFX0tFWSk7XG4gICAgICByZXR1cm4gdGFyZ2V0LnNpemU7XG4gICAgfSxcbiAgICBoYXMoa2V5KSB7XG4gICAgICBjb25zdCB0YXJnZXQgPSB0aGlzW1wiX192X3Jhd1wiXTtcbiAgICAgIGNvbnN0IHJhd1RhcmdldCA9IHRvUmF3KHRhcmdldCk7XG4gICAgICBjb25zdCByYXdLZXkgPSB0b1JhdyhrZXkpO1xuICAgICAgaWYgKCFyZWFkb25seSkge1xuICAgICAgICBpZiAoaGFzQ2hhbmdlZChrZXksIHJhd0tleSkpIHtcbiAgICAgICAgICB0cmFjayhyYXdUYXJnZXQsIFwiaGFzXCIsIGtleSk7XG4gICAgICAgIH1cbiAgICAgICAgdHJhY2socmF3VGFyZ2V0LCBcImhhc1wiLCByYXdLZXkpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGtleSA9PT0gcmF3S2V5ID8gdGFyZ2V0LmhhcyhrZXkpIDogdGFyZ2V0LmhhcyhrZXkpIHx8IHRhcmdldC5oYXMocmF3S2V5KTtcbiAgICB9LFxuICAgIGZvckVhY2goY2FsbGJhY2ssIHRoaXNBcmcpIHtcbiAgICAgIGNvbnN0IG9ic2VydmVkID0gdGhpcztcbiAgICAgIGNvbnN0IHRhcmdldCA9IG9ic2VydmVkW1wiX192X3Jhd1wiXTtcbiAgICAgIGNvbnN0IHJhd1RhcmdldCA9IHRvUmF3KHRhcmdldCk7XG4gICAgICBjb25zdCB3cmFwID0gc2hhbGxvdyA/IHRvU2hhbGxvdyA6IHJlYWRvbmx5ID8gdG9SZWFkb25seSA6IHRvUmVhY3RpdmU7XG4gICAgICAhcmVhZG9ubHkgJiYgdHJhY2socmF3VGFyZ2V0LCBcIml0ZXJhdGVcIiwgSVRFUkFURV9LRVkpO1xuICAgICAgcmV0dXJuIHRhcmdldC5mb3JFYWNoKCh2YWx1ZSwga2V5KSA9PiB7XG4gICAgICAgIHJldHVybiBjYWxsYmFjay5jYWxsKHRoaXNBcmcsIHdyYXAodmFsdWUpLCB3cmFwKGtleSksIG9ic2VydmVkKTtcbiAgICAgIH0pO1xuICAgIH1cbiAgfTtcbiAgZXh0ZW5kKFxuICAgIGluc3RydW1lbnRhdGlvbnMsXG4gICAgcmVhZG9ubHkgPyB7XG4gICAgICBhZGQ6IGNyZWF0ZVJlYWRvbmx5TWV0aG9kKFwiYWRkXCIpLFxuICAgICAgc2V0OiBjcmVhdGVSZWFkb25seU1ldGhvZChcInNldFwiKSxcbiAgICAgIGRlbGV0ZTogY3JlYXRlUmVhZG9ubHlNZXRob2QoXCJkZWxldGVcIiksXG4gICAgICBjbGVhcjogY3JlYXRlUmVhZG9ubHlNZXRob2QoXCJjbGVhclwiKVxuICAgIH0gOiB7XG4gICAgICBhZGQodmFsdWUpIHtcbiAgICAgICAgaWYgKCFzaGFsbG93ICYmICFpc1NoYWxsb3codmFsdWUpICYmICFpc1JlYWRvbmx5KHZhbHVlKSkge1xuICAgICAgICAgIHZhbHVlID0gdG9SYXcodmFsdWUpO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHRhcmdldCA9IHRvUmF3KHRoaXMpO1xuICAgICAgICBjb25zdCBwcm90byA9IGdldFByb3RvKHRhcmdldCk7XG4gICAgICAgIGNvbnN0IGhhZEtleSA9IHByb3RvLmhhcy5jYWxsKHRhcmdldCwgdmFsdWUpO1xuICAgICAgICBpZiAoIWhhZEtleSkge1xuICAgICAgICAgIHRhcmdldC5hZGQodmFsdWUpO1xuICAgICAgICAgIHRyaWdnZXIodGFyZ2V0LCBcImFkZFwiLCB2YWx1ZSwgdmFsdWUpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgfSxcbiAgICAgIHNldChrZXksIHZhbHVlKSB7XG4gICAgICAgIGlmICghc2hhbGxvdyAmJiAhaXNTaGFsbG93KHZhbHVlKSAmJiAhaXNSZWFkb25seSh2YWx1ZSkpIHtcbiAgICAgICAgICB2YWx1ZSA9IHRvUmF3KHZhbHVlKTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCB0YXJnZXQgPSB0b1Jhdyh0aGlzKTtcbiAgICAgICAgY29uc3QgeyBoYXMsIGdldCB9ID0gZ2V0UHJvdG8odGFyZ2V0KTtcbiAgICAgICAgbGV0IGhhZEtleSA9IGhhcy5jYWxsKHRhcmdldCwga2V5KTtcbiAgICAgICAgaWYgKCFoYWRLZXkpIHtcbiAgICAgICAgICBrZXkgPSB0b1JhdyhrZXkpO1xuICAgICAgICAgIGhhZEtleSA9IGhhcy5jYWxsKHRhcmdldCwga2V5KTtcbiAgICAgICAgfSBlbHNlIGlmICghIShwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gXCJwcm9kdWN0aW9uXCIpKSB7XG4gICAgICAgICAgY2hlY2tJZGVudGl0eUtleXModGFyZ2V0LCBoYXMsIGtleSk7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3Qgb2xkVmFsdWUgPSBnZXQuY2FsbCh0YXJnZXQsIGtleSk7XG4gICAgICAgIHRhcmdldC5zZXQoa2V5LCB2YWx1ZSk7XG4gICAgICAgIGlmICghaGFkS2V5KSB7XG4gICAgICAgICAgdHJpZ2dlcih0YXJnZXQsIFwiYWRkXCIsIGtleSwgdmFsdWUpO1xuICAgICAgICB9IGVsc2UgaWYgKGhhc0NoYW5nZWQodmFsdWUsIG9sZFZhbHVlKSkge1xuICAgICAgICAgIHRyaWdnZXIodGFyZ2V0LCBcInNldFwiLCBrZXksIHZhbHVlLCBvbGRWYWx1ZSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICB9LFxuICAgICAgZGVsZXRlKGtleSkge1xuICAgICAgICBjb25zdCB0YXJnZXQgPSB0b1Jhdyh0aGlzKTtcbiAgICAgICAgY29uc3QgeyBoYXMsIGdldCB9ID0gZ2V0UHJvdG8odGFyZ2V0KTtcbiAgICAgICAgbGV0IGhhZEtleSA9IGhhcy5jYWxsKHRhcmdldCwga2V5KTtcbiAgICAgICAgaWYgKCFoYWRLZXkpIHtcbiAgICAgICAgICBrZXkgPSB0b1JhdyhrZXkpO1xuICAgICAgICAgIGhhZEtleSA9IGhhcy5jYWxsKHRhcmdldCwga2V5KTtcbiAgICAgICAgfSBlbHNlIGlmICghIShwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gXCJwcm9kdWN0aW9uXCIpKSB7XG4gICAgICAgICAgY2hlY2tJZGVudGl0eUtleXModGFyZ2V0LCBoYXMsIGtleSk7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3Qgb2xkVmFsdWUgPSBnZXQgPyBnZXQuY2FsbCh0YXJnZXQsIGtleSkgOiB2b2lkIDA7XG4gICAgICAgIGNvbnN0IHJlc3VsdCA9IHRhcmdldC5kZWxldGUoa2V5KTtcbiAgICAgICAgaWYgKGhhZEtleSkge1xuICAgICAgICAgIHRyaWdnZXIodGFyZ2V0LCBcImRlbGV0ZVwiLCBrZXksIHZvaWQgMCwgb2xkVmFsdWUpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICB9LFxuICAgICAgY2xlYXIoKSB7XG4gICAgICAgIGNvbnN0IHRhcmdldCA9IHRvUmF3KHRoaXMpO1xuICAgICAgICBjb25zdCBoYWRJdGVtcyA9IHRhcmdldC5zaXplICE9PSAwO1xuICAgICAgICBjb25zdCBvbGRUYXJnZXQgPSAhIShwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gXCJwcm9kdWN0aW9uXCIpID8gaXNNYXAodGFyZ2V0KSA/IG5ldyBNYXAodGFyZ2V0KSA6IG5ldyBTZXQodGFyZ2V0KSA6IHZvaWQgMDtcbiAgICAgICAgY29uc3QgcmVzdWx0ID0gdGFyZ2V0LmNsZWFyKCk7XG4gICAgICAgIGlmIChoYWRJdGVtcykge1xuICAgICAgICAgIHRyaWdnZXIoXG4gICAgICAgICAgICB0YXJnZXQsXG4gICAgICAgICAgICBcImNsZWFyXCIsXG4gICAgICAgICAgICB2b2lkIDAsXG4gICAgICAgICAgICB2b2lkIDAsXG4gICAgICAgICAgICBvbGRUYXJnZXRcbiAgICAgICAgICApO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICB9XG4gICAgfVxuICApO1xuICBjb25zdCBpdGVyYXRvck1ldGhvZHMgPSBbXG4gICAgXCJrZXlzXCIsXG4gICAgXCJ2YWx1ZXNcIixcbiAgICBcImVudHJpZXNcIixcbiAgICBTeW1ib2wuaXRlcmF0b3JcbiAgXTtcbiAgaXRlcmF0b3JNZXRob2RzLmZvckVhY2goKG1ldGhvZCkgPT4ge1xuICAgIGluc3RydW1lbnRhdGlvbnNbbWV0aG9kXSA9IGNyZWF0ZUl0ZXJhYmxlTWV0aG9kKG1ldGhvZCwgcmVhZG9ubHksIHNoYWxsb3cpO1xuICB9KTtcbiAgcmV0dXJuIGluc3RydW1lbnRhdGlvbnM7XG59XG5mdW5jdGlvbiBjcmVhdGVJbnN0cnVtZW50YXRpb25HZXR0ZXIoaXNSZWFkb25seTIsIHNoYWxsb3cpIHtcbiAgY29uc3QgaW5zdHJ1bWVudGF0aW9ucyA9IGNyZWF0ZUluc3RydW1lbnRhdGlvbnMoaXNSZWFkb25seTIsIHNoYWxsb3cpO1xuICByZXR1cm4gKHRhcmdldCwga2V5LCByZWNlaXZlcikgPT4ge1xuICAgIGlmIChrZXkgPT09IFwiX192X2lzUmVhY3RpdmVcIikge1xuICAgICAgcmV0dXJuICFpc1JlYWRvbmx5MjtcbiAgICB9IGVsc2UgaWYgKGtleSA9PT0gXCJfX3ZfaXNSZWFkb25seVwiKSB7XG4gICAgICByZXR1cm4gaXNSZWFkb25seTI7XG4gICAgfSBlbHNlIGlmIChrZXkgPT09IFwiX192X3Jhd1wiKSB7XG4gICAgICByZXR1cm4gdGFyZ2V0O1xuICAgIH1cbiAgICByZXR1cm4gUmVmbGVjdC5nZXQoXG4gICAgICBoYXNPd24oaW5zdHJ1bWVudGF0aW9ucywga2V5KSAmJiBrZXkgaW4gdGFyZ2V0ID8gaW5zdHJ1bWVudGF0aW9ucyA6IHRhcmdldCxcbiAgICAgIGtleSxcbiAgICAgIHJlY2VpdmVyXG4gICAgKTtcbiAgfTtcbn1cbmNvbnN0IG11dGFibGVDb2xsZWN0aW9uSGFuZGxlcnMgPSB7XG4gIGdldDogLyogQF9fUFVSRV9fICovIGNyZWF0ZUluc3RydW1lbnRhdGlvbkdldHRlcihmYWxzZSwgZmFsc2UpXG59O1xuY29uc3Qgc2hhbGxvd0NvbGxlY3Rpb25IYW5kbGVycyA9IHtcbiAgZ2V0OiAvKiBAX19QVVJFX18gKi8gY3JlYXRlSW5zdHJ1bWVudGF0aW9uR2V0dGVyKGZhbHNlLCB0cnVlKVxufTtcbmNvbnN0IHJlYWRvbmx5Q29sbGVjdGlvbkhhbmRsZXJzID0ge1xuICBnZXQ6IC8qIEBfX1BVUkVfXyAqLyBjcmVhdGVJbnN0cnVtZW50YXRpb25HZXR0ZXIodHJ1ZSwgZmFsc2UpXG59O1xuY29uc3Qgc2hhbGxvd1JlYWRvbmx5Q29sbGVjdGlvbkhhbmRsZXJzID0ge1xuICBnZXQ6IC8qIEBfX1BVUkVfXyAqLyBjcmVhdGVJbnN0cnVtZW50YXRpb25HZXR0ZXIodHJ1ZSwgdHJ1ZSlcbn07XG5mdW5jdGlvbiBjaGVja0lkZW50aXR5S2V5cyh0YXJnZXQsIGhhcywga2V5KSB7XG4gIGNvbnN0IHJhd0tleSA9IHRvUmF3KGtleSk7XG4gIGlmIChyYXdLZXkgIT09IGtleSAmJiBoYXMuY2FsbCh0YXJnZXQsIHJhd0tleSkpIHtcbiAgICBjb25zdCB0eXBlID0gdG9SYXdUeXBlKHRhcmdldCk7XG4gICAgd2FybihcbiAgICAgIGBSZWFjdGl2ZSAke3R5cGV9IGNvbnRhaW5zIGJvdGggdGhlIHJhdyBhbmQgcmVhY3RpdmUgdmVyc2lvbnMgb2YgdGhlIHNhbWUgb2JqZWN0JHt0eXBlID09PSBgTWFwYCA/IGAgYXMga2V5c2AgOiBgYH0sIHdoaWNoIGNhbiBsZWFkIHRvIGluY29uc2lzdGVuY2llcy4gQXZvaWQgZGlmZmVyZW50aWF0aW5nIGJldHdlZW4gdGhlIHJhdyBhbmQgcmVhY3RpdmUgdmVyc2lvbnMgb2YgYW4gb2JqZWN0IGFuZCBvbmx5IHVzZSB0aGUgcmVhY3RpdmUgdmVyc2lvbiBpZiBwb3NzaWJsZS5gXG4gICAgKTtcbiAgfVxufVxuXG5jb25zdCByZWFjdGl2ZU1hcCA9IC8qIEBfX1BVUkVfXyAqLyBuZXcgV2Vha01hcCgpO1xuY29uc3Qgc2hhbGxvd1JlYWN0aXZlTWFwID0gLyogQF9fUFVSRV9fICovIG5ldyBXZWFrTWFwKCk7XG5jb25zdCByZWFkb25seU1hcCA9IC8qIEBfX1BVUkVfXyAqLyBuZXcgV2Vha01hcCgpO1xuY29uc3Qgc2hhbGxvd1JlYWRvbmx5TWFwID0gLyogQF9fUFVSRV9fICovIG5ldyBXZWFrTWFwKCk7XG5mdW5jdGlvbiB0YXJnZXRUeXBlTWFwKHJhd1R5cGUpIHtcbiAgc3dpdGNoIChyYXdUeXBlKSB7XG4gICAgY2FzZSBcIk9iamVjdFwiOlxuICAgIGNhc2UgXCJBcnJheVwiOlxuICAgICAgcmV0dXJuIDEgLyogQ09NTU9OICovO1xuICAgIGNhc2UgXCJNYXBcIjpcbiAgICBjYXNlIFwiU2V0XCI6XG4gICAgY2FzZSBcIldlYWtNYXBcIjpcbiAgICBjYXNlIFwiV2Vha1NldFwiOlxuICAgICAgcmV0dXJuIDIgLyogQ09MTEVDVElPTiAqLztcbiAgICBkZWZhdWx0OlxuICAgICAgcmV0dXJuIDAgLyogSU5WQUxJRCAqLztcbiAgfVxufVxuZnVuY3Rpb24gZ2V0VGFyZ2V0VHlwZSh2YWx1ZSkge1xuICByZXR1cm4gdmFsdWVbXCJfX3Zfc2tpcFwiXSB8fCAhT2JqZWN0LmlzRXh0ZW5zaWJsZSh2YWx1ZSkgPyAwIC8qIElOVkFMSUQgKi8gOiB0YXJnZXRUeXBlTWFwKHRvUmF3VHlwZSh2YWx1ZSkpO1xufVxuLy8gQF9fTk9fU0lERV9FRkZFQ1RTX19cbmZ1bmN0aW9uIHJlYWN0aXZlKHRhcmdldCkge1xuICBpZiAoLyogQF9fUFVSRV9fICovIGlzUmVhZG9ubHkodGFyZ2V0KSkge1xuICAgIHJldHVybiB0YXJnZXQ7XG4gIH1cbiAgcmV0dXJuIGNyZWF0ZVJlYWN0aXZlT2JqZWN0KFxuICAgIHRhcmdldCxcbiAgICBmYWxzZSxcbiAgICBtdXRhYmxlSGFuZGxlcnMsXG4gICAgbXV0YWJsZUNvbGxlY3Rpb25IYW5kbGVycyxcbiAgICByZWFjdGl2ZU1hcFxuICApO1xufVxuLy8gQF9fTk9fU0lERV9FRkZFQ1RTX19cbmZ1bmN0aW9uIHNoYWxsb3dSZWFjdGl2ZSh0YXJnZXQpIHtcbiAgcmV0dXJuIGNyZWF0ZVJlYWN0aXZlT2JqZWN0KFxuICAgIHRhcmdldCxcbiAgICBmYWxzZSxcbiAgICBzaGFsbG93UmVhY3RpdmVIYW5kbGVycyxcbiAgICBzaGFsbG93Q29sbGVjdGlvbkhhbmRsZXJzLFxuICAgIHNoYWxsb3dSZWFjdGl2ZU1hcFxuICApO1xufVxuLy8gQF9fTk9fU0lERV9FRkZFQ1RTX19cbmZ1bmN0aW9uIHJlYWRvbmx5KHRhcmdldCkge1xuICByZXR1cm4gY3JlYXRlUmVhY3RpdmVPYmplY3QoXG4gICAgdGFyZ2V0LFxuICAgIHRydWUsXG4gICAgcmVhZG9ubHlIYW5kbGVycyxcbiAgICByZWFkb25seUNvbGxlY3Rpb25IYW5kbGVycyxcbiAgICByZWFkb25seU1hcFxuICApO1xufVxuLy8gQF9fTk9fU0lERV9FRkZFQ1RTX19cbmZ1bmN0aW9uIHNoYWxsb3dSZWFkb25seSh0YXJnZXQpIHtcbiAgcmV0dXJuIGNyZWF0ZVJlYWN0aXZlT2JqZWN0KFxuICAgIHRhcmdldCxcbiAgICB0cnVlLFxuICAgIHNoYWxsb3dSZWFkb25seUhhbmRsZXJzLFxuICAgIHNoYWxsb3dSZWFkb25seUNvbGxlY3Rpb25IYW5kbGVycyxcbiAgICBzaGFsbG93UmVhZG9ubHlNYXBcbiAgKTtcbn1cbmZ1bmN0aW9uIGNyZWF0ZVJlYWN0aXZlT2JqZWN0KHRhcmdldCwgaXNSZWFkb25seTIsIGJhc2VIYW5kbGVycywgY29sbGVjdGlvbkhhbmRsZXJzLCBwcm94eU1hcCkge1xuICBpZiAoIWlzT2JqZWN0KHRhcmdldCkpIHtcbiAgICBpZiAoISEocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09IFwicHJvZHVjdGlvblwiKSkge1xuICAgICAgd2FybihcbiAgICAgICAgYHZhbHVlIGNhbm5vdCBiZSBtYWRlICR7aXNSZWFkb25seTIgPyBcInJlYWRvbmx5XCIgOiBcInJlYWN0aXZlXCJ9OiAke1N0cmluZyhcbiAgICAgICAgICB0YXJnZXRcbiAgICAgICAgKX1gXG4gICAgICApO1xuICAgIH1cbiAgICByZXR1cm4gdGFyZ2V0O1xuICB9XG4gIGlmICh0YXJnZXRbXCJfX3ZfcmF3XCJdICYmICEoaXNSZWFkb25seTIgJiYgdGFyZ2V0W1wiX192X2lzUmVhY3RpdmVcIl0pKSB7XG4gICAgcmV0dXJuIHRhcmdldDtcbiAgfVxuICBjb25zdCB0YXJnZXRUeXBlID0gZ2V0VGFyZ2V0VHlwZSh0YXJnZXQpO1xuICBpZiAodGFyZ2V0VHlwZSA9PT0gMCAvKiBJTlZBTElEICovKSB7XG4gICAgcmV0dXJuIHRhcmdldDtcbiAgfVxuICBjb25zdCBleGlzdGluZ1Byb3h5ID0gcHJveHlNYXAuZ2V0KHRhcmdldCk7XG4gIGlmIChleGlzdGluZ1Byb3h5KSB7XG4gICAgcmV0dXJuIGV4aXN0aW5nUHJveHk7XG4gIH1cbiAgY29uc3QgcHJveHkgPSBuZXcgUHJveHkoXG4gICAgdGFyZ2V0LFxuICAgIHRhcmdldFR5cGUgPT09IDIgLyogQ09MTEVDVElPTiAqLyA/IGNvbGxlY3Rpb25IYW5kbGVycyA6IGJhc2VIYW5kbGVyc1xuICApO1xuICBwcm94eU1hcC5zZXQodGFyZ2V0LCBwcm94eSk7XG4gIHJldHVybiBwcm94eTtcbn1cbi8vIEBfX05PX1NJREVfRUZGRUNUU19fXG5mdW5jdGlvbiBpc1JlYWN0aXZlKHZhbHVlKSB7XG4gIGlmICgvKiBAX19QVVJFX18gKi8gaXNSZWFkb25seSh2YWx1ZSkpIHtcbiAgICByZXR1cm4gLyogQF9fUFVSRV9fICovIGlzUmVhY3RpdmUodmFsdWVbXCJfX3ZfcmF3XCJdKTtcbiAgfVxuICByZXR1cm4gISEodmFsdWUgJiYgdmFsdWVbXCJfX3ZfaXNSZWFjdGl2ZVwiXSk7XG59XG4vLyBAX19OT19TSURFX0VGRkVDVFNfX1xuZnVuY3Rpb24gaXNSZWFkb25seSh2YWx1ZSkge1xuICByZXR1cm4gISEodmFsdWUgJiYgdmFsdWVbXCJfX3ZfaXNSZWFkb25seVwiXSk7XG59XG4vLyBAX19OT19TSURFX0VGRkVDVFNfX1xuZnVuY3Rpb24gaXNTaGFsbG93KHZhbHVlKSB7XG4gIHJldHVybiAhISh2YWx1ZSAmJiB2YWx1ZVtcIl9fdl9pc1NoYWxsb3dcIl0pO1xufVxuLy8gQF9fTk9fU0lERV9FRkZFQ1RTX19cbmZ1bmN0aW9uIGlzUHJveHkodmFsdWUpIHtcbiAgcmV0dXJuIHZhbHVlID8gISF2YWx1ZVtcIl9fdl9yYXdcIl0gOiBmYWxzZTtcbn1cbi8vIEBfX05PX1NJREVfRUZGRUNUU19fXG5mdW5jdGlvbiB0b1JhdyhvYnNlcnZlZCkge1xuICBjb25zdCByYXcgPSBvYnNlcnZlZCAmJiBvYnNlcnZlZFtcIl9fdl9yYXdcIl07XG4gIHJldHVybiByYXcgPyAvKiBAX19QVVJFX18gKi8gdG9SYXcocmF3KSA6IG9ic2VydmVkO1xufVxuZnVuY3Rpb24gbWFya1Jhdyh2YWx1ZSkge1xuICBpZiAoIWhhc093bih2YWx1ZSwgXCJfX3Zfc2tpcFwiKSAmJiBPYmplY3QuaXNFeHRlbnNpYmxlKHZhbHVlKSkge1xuICAgIGRlZih2YWx1ZSwgXCJfX3Zfc2tpcFwiLCB0cnVlKTtcbiAgfVxuICByZXR1cm4gdmFsdWU7XG59XG5jb25zdCB0b1JlYWN0aXZlID0gKHZhbHVlKSA9PiBpc09iamVjdCh2YWx1ZSkgPyAvKiBAX19QVVJFX18gKi8gcmVhY3RpdmUodmFsdWUpIDogdmFsdWU7XG5jb25zdCB0b1JlYWRvbmx5ID0gKHZhbHVlKSA9PiBpc09iamVjdCh2YWx1ZSkgPyAvKiBAX19QVVJFX18gKi8gcmVhZG9ubHkodmFsdWUpIDogdmFsdWU7XG5cbi8vIEBfX05PX1NJREVfRUZGRUNUU19fXG5mdW5jdGlvbiBpc1JlZihyKSB7XG4gIHJldHVybiByID8gcltcIl9fdl9pc1JlZlwiXSA9PT0gdHJ1ZSA6IGZhbHNlO1xufVxuLy8gQF9fTk9fU0lERV9FRkZFQ1RTX19cbmZ1bmN0aW9uIHJlZih2YWx1ZSkge1xuICByZXR1cm4gY3JlYXRlUmVmKHZhbHVlLCBmYWxzZSk7XG59XG4vLyBAX19OT19TSURFX0VGRkVDVFNfX1xuZnVuY3Rpb24gc2hhbGxvd1JlZih2YWx1ZSkge1xuICByZXR1cm4gY3JlYXRlUmVmKHZhbHVlLCB0cnVlKTtcbn1cbmZ1bmN0aW9uIGNyZWF0ZVJlZihyYXdWYWx1ZSwgc2hhbGxvdykge1xuICBpZiAoLyogQF9fUFVSRV9fICovIGlzUmVmKHJhd1ZhbHVlKSkge1xuICAgIHJldHVybiByYXdWYWx1ZTtcbiAgfVxuICByZXR1cm4gbmV3IFJlZkltcGwocmF3VmFsdWUsIHNoYWxsb3cpO1xufVxuY2xhc3MgUmVmSW1wbCB7XG4gIGNvbnN0cnVjdG9yKHZhbHVlLCBpc1NoYWxsb3cyKSB7XG4gICAgdGhpcy5kZXAgPSBuZXcgRGVwKCk7XG4gICAgdGhpc1tcIl9fdl9pc1JlZlwiXSA9IHRydWU7XG4gICAgdGhpc1tcIl9fdl9pc1NoYWxsb3dcIl0gPSBmYWxzZTtcbiAgICB0aGlzLl9yYXdWYWx1ZSA9IGlzU2hhbGxvdzIgPyB2YWx1ZSA6IHRvUmF3KHZhbHVlKTtcbiAgICB0aGlzLl92YWx1ZSA9IGlzU2hhbGxvdzIgPyB2YWx1ZSA6IHRvUmVhY3RpdmUodmFsdWUpO1xuICAgIHRoaXNbXCJfX3ZfaXNTaGFsbG93XCJdID0gaXNTaGFsbG93MjtcbiAgfVxuICBnZXQgdmFsdWUoKSB7XG4gICAgaWYgKCEhKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSBcInByb2R1Y3Rpb25cIikpIHtcbiAgICAgIHRoaXMuZGVwLnRyYWNrKHtcbiAgICAgICAgdGFyZ2V0OiB0aGlzLFxuICAgICAgICB0eXBlOiBcImdldFwiLFxuICAgICAgICBrZXk6IFwidmFsdWVcIlxuICAgICAgfSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuZGVwLnRyYWNrKCk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzLl92YWx1ZTtcbiAgfVxuICBzZXQgdmFsdWUobmV3VmFsdWUpIHtcbiAgICBjb25zdCBvbGRWYWx1ZSA9IHRoaXMuX3Jhd1ZhbHVlO1xuICAgIGNvbnN0IHVzZURpcmVjdFZhbHVlID0gdGhpc1tcIl9fdl9pc1NoYWxsb3dcIl0gfHwgaXNTaGFsbG93KG5ld1ZhbHVlKSB8fCBpc1JlYWRvbmx5KG5ld1ZhbHVlKTtcbiAgICBuZXdWYWx1ZSA9IHVzZURpcmVjdFZhbHVlID8gbmV3VmFsdWUgOiB0b1JhdyhuZXdWYWx1ZSk7XG4gICAgaWYgKGhhc0NoYW5nZWQobmV3VmFsdWUsIG9sZFZhbHVlKSkge1xuICAgICAgdGhpcy5fcmF3VmFsdWUgPSBuZXdWYWx1ZTtcbiAgICAgIHRoaXMuX3ZhbHVlID0gdXNlRGlyZWN0VmFsdWUgPyBuZXdWYWx1ZSA6IHRvUmVhY3RpdmUobmV3VmFsdWUpO1xuICAgICAgaWYgKCEhKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSBcInByb2R1Y3Rpb25cIikpIHtcbiAgICAgICAgdGhpcy5kZXAudHJpZ2dlcih7XG4gICAgICAgICAgdGFyZ2V0OiB0aGlzLFxuICAgICAgICAgIHR5cGU6IFwic2V0XCIsXG4gICAgICAgICAga2V5OiBcInZhbHVlXCIsXG4gICAgICAgICAgbmV3VmFsdWUsXG4gICAgICAgICAgb2xkVmFsdWVcbiAgICAgICAgfSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLmRlcC50cmlnZ2VyKCk7XG4gICAgICB9XG4gICAgfVxuICB9XG59XG5mdW5jdGlvbiB0cmlnZ2VyUmVmKHJlZjIpIHtcbiAgaWYgKHJlZjIuZGVwKSB7XG4gICAgaWYgKCEhKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSBcInByb2R1Y3Rpb25cIikpIHtcbiAgICAgIHJlZjIuZGVwLnRyaWdnZXIoe1xuICAgICAgICB0YXJnZXQ6IHJlZjIsXG4gICAgICAgIHR5cGU6IFwic2V0XCIsXG4gICAgICAgIGtleTogXCJ2YWx1ZVwiLFxuICAgICAgICBuZXdWYWx1ZTogcmVmMi5fdmFsdWVcbiAgICAgIH0pO1xuICAgIH0gZWxzZSB7XG4gICAgICByZWYyLmRlcC50cmlnZ2VyKCk7XG4gICAgfVxuICB9XG59XG5mdW5jdGlvbiB1bnJlZihyZWYyKSB7XG4gIHJldHVybiAvKiBAX19QVVJFX18gKi8gaXNSZWYocmVmMikgPyByZWYyLnZhbHVlIDogcmVmMjtcbn1cbmZ1bmN0aW9uIHRvVmFsdWUoc291cmNlKSB7XG4gIHJldHVybiBpc0Z1bmN0aW9uKHNvdXJjZSkgPyBzb3VyY2UoKSA6IHVucmVmKHNvdXJjZSk7XG59XG5jb25zdCBzaGFsbG93VW53cmFwSGFuZGxlcnMgPSB7XG4gIGdldDogKHRhcmdldCwga2V5LCByZWNlaXZlcikgPT4ga2V5ID09PSBcIl9fdl9yYXdcIiA/IHRhcmdldCA6IHVucmVmKFJlZmxlY3QuZ2V0KHRhcmdldCwga2V5LCByZWNlaXZlcikpLFxuICBzZXQ6ICh0YXJnZXQsIGtleSwgdmFsdWUsIHJlY2VpdmVyKSA9PiB7XG4gICAgY29uc3Qgb2xkVmFsdWUgPSB0YXJnZXRba2V5XTtcbiAgICBpZiAoLyogQF9fUFVSRV9fICovIGlzUmVmKG9sZFZhbHVlKSAmJiAhLyogQF9fUFVSRV9fICovIGlzUmVmKHZhbHVlKSkge1xuICAgICAgb2xkVmFsdWUudmFsdWUgPSB2YWx1ZTtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gUmVmbGVjdC5zZXQodGFyZ2V0LCBrZXksIHZhbHVlLCByZWNlaXZlcik7XG4gICAgfVxuICB9XG59O1xuZnVuY3Rpb24gcHJveHlSZWZzKG9iamVjdFdpdGhSZWZzKSB7XG4gIHJldHVybiBpc1JlYWN0aXZlKG9iamVjdFdpdGhSZWZzKSA/IG9iamVjdFdpdGhSZWZzIDogbmV3IFByb3h5KG9iamVjdFdpdGhSZWZzLCBzaGFsbG93VW53cmFwSGFuZGxlcnMpO1xufVxuY2xhc3MgQ3VzdG9tUmVmSW1wbCB7XG4gIGNvbnN0cnVjdG9yKGZhY3RvcnkpIHtcbiAgICB0aGlzW1wiX192X2lzUmVmXCJdID0gdHJ1ZTtcbiAgICB0aGlzLl92YWx1ZSA9IHZvaWQgMDtcbiAgICBjb25zdCBkZXAgPSB0aGlzLmRlcCA9IG5ldyBEZXAoKTtcbiAgICBjb25zdCB7IGdldCwgc2V0IH0gPSBmYWN0b3J5KGRlcC50cmFjay5iaW5kKGRlcCksIGRlcC50cmlnZ2VyLmJpbmQoZGVwKSk7XG4gICAgdGhpcy5fZ2V0ID0gZ2V0O1xuICAgIHRoaXMuX3NldCA9IHNldDtcbiAgfVxuICBnZXQgdmFsdWUoKSB7XG4gICAgcmV0dXJuIHRoaXMuX3ZhbHVlID0gdGhpcy5fZ2V0KCk7XG4gIH1cbiAgc2V0IHZhbHVlKG5ld1ZhbCkge1xuICAgIHRoaXMuX3NldChuZXdWYWwpO1xuICB9XG59XG5mdW5jdGlvbiBjdXN0b21SZWYoZmFjdG9yeSkge1xuICByZXR1cm4gbmV3IEN1c3RvbVJlZkltcGwoZmFjdG9yeSk7XG59XG4vLyBAX19OT19TSURFX0VGRkVDVFNfX1xuZnVuY3Rpb24gdG9SZWZzKG9iamVjdCkge1xuICBpZiAoISEocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09IFwicHJvZHVjdGlvblwiKSAmJiAhaXNQcm94eShvYmplY3QpKSB7XG4gICAgd2FybihgdG9SZWZzKCkgZXhwZWN0cyBhIHJlYWN0aXZlIG9iamVjdCBidXQgcmVjZWl2ZWQgYSBwbGFpbiBvbmUuYCk7XG4gIH1cbiAgY29uc3QgcmV0ID0gaXNBcnJheShvYmplY3QpID8gbmV3IEFycmF5KG9iamVjdC5sZW5ndGgpIDoge307XG4gIGZvciAoY29uc3Qga2V5IGluIG9iamVjdCkge1xuICAgIHJldFtrZXldID0gcHJvcGVydHlUb1JlZihvYmplY3QsIGtleSk7XG4gIH1cbiAgcmV0dXJuIHJldDtcbn1cbmNsYXNzIE9iamVjdFJlZkltcGwge1xuICBjb25zdHJ1Y3Rvcihfb2JqZWN0LCBfa2V5LCBfZGVmYXVsdFZhbHVlKSB7XG4gICAgdGhpcy5fb2JqZWN0ID0gX29iamVjdDtcbiAgICB0aGlzLl9rZXkgPSBfa2V5O1xuICAgIHRoaXMuX2RlZmF1bHRWYWx1ZSA9IF9kZWZhdWx0VmFsdWU7XG4gICAgdGhpc1tcIl9fdl9pc1JlZlwiXSA9IHRydWU7XG4gICAgdGhpcy5fdmFsdWUgPSB2b2lkIDA7XG4gICAgdGhpcy5fcmF3ID0gdG9SYXcoX29iamVjdCk7XG4gICAgbGV0IHNoYWxsb3cgPSB0cnVlO1xuICAgIGxldCBvYmogPSBfb2JqZWN0O1xuICAgIGlmICghaXNBcnJheShfb2JqZWN0KSB8fCAhaXNJbnRlZ2VyS2V5KFN0cmluZyhfa2V5KSkpIHtcbiAgICAgIGRvIHtcbiAgICAgICAgc2hhbGxvdyA9ICFpc1Byb3h5KG9iaikgfHwgaXNTaGFsbG93KG9iaik7XG4gICAgICB9IHdoaWxlIChzaGFsbG93ICYmIChvYmogPSBvYmpbXCJfX3ZfcmF3XCJdKSk7XG4gICAgfVxuICAgIHRoaXMuX3NoYWxsb3cgPSBzaGFsbG93O1xuICB9XG4gIGdldCB2YWx1ZSgpIHtcbiAgICBsZXQgdmFsID0gdGhpcy5fb2JqZWN0W3RoaXMuX2tleV07XG4gICAgaWYgKHRoaXMuX3NoYWxsb3cpIHtcbiAgICAgIHZhbCA9IHVucmVmKHZhbCk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzLl92YWx1ZSA9IHZhbCA9PT0gdm9pZCAwID8gdGhpcy5fZGVmYXVsdFZhbHVlIDogdmFsO1xuICB9XG4gIHNldCB2YWx1ZShuZXdWYWwpIHtcbiAgICBpZiAodGhpcy5fc2hhbGxvdyAmJiAvKiBAX19QVVJFX18gKi8gaXNSZWYodGhpcy5fcmF3W3RoaXMuX2tleV0pKSB7XG4gICAgICBjb25zdCBuZXN0ZWRSZWYgPSB0aGlzLl9vYmplY3RbdGhpcy5fa2V5XTtcbiAgICAgIGlmICgvKiBAX19QVVJFX18gKi8gaXNSZWYobmVzdGVkUmVmKSkge1xuICAgICAgICBuZXN0ZWRSZWYudmFsdWUgPSBuZXdWYWw7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICB9XG4gICAgdGhpcy5fb2JqZWN0W3RoaXMuX2tleV0gPSBuZXdWYWw7XG4gIH1cbiAgZ2V0IGRlcCgpIHtcbiAgICByZXR1cm4gZ2V0RGVwRnJvbVJlYWN0aXZlKHRoaXMuX3JhdywgdGhpcy5fa2V5KTtcbiAgfVxufVxuY2xhc3MgR2V0dGVyUmVmSW1wbCB7XG4gIGNvbnN0cnVjdG9yKF9nZXR0ZXIpIHtcbiAgICB0aGlzLl9nZXR0ZXIgPSBfZ2V0dGVyO1xuICAgIHRoaXNbXCJfX3ZfaXNSZWZcIl0gPSB0cnVlO1xuICAgIHRoaXNbXCJfX3ZfaXNSZWFkb25seVwiXSA9IHRydWU7XG4gICAgdGhpcy5fdmFsdWUgPSB2b2lkIDA7XG4gIH1cbiAgZ2V0IHZhbHVlKCkge1xuICAgIHJldHVybiB0aGlzLl92YWx1ZSA9IHRoaXMuX2dldHRlcigpO1xuICB9XG59XG4vLyBAX19OT19TSURFX0VGRkVDVFNfX1xuZnVuY3Rpb24gdG9SZWYoc291cmNlLCBrZXksIGRlZmF1bHRWYWx1ZSkge1xuICBpZiAoLyogQF9fUFVSRV9fICovIGlzUmVmKHNvdXJjZSkpIHtcbiAgICByZXR1cm4gc291cmNlO1xuICB9IGVsc2UgaWYgKGlzRnVuY3Rpb24oc291cmNlKSkge1xuICAgIHJldHVybiBuZXcgR2V0dGVyUmVmSW1wbChzb3VyY2UpO1xuICB9IGVsc2UgaWYgKGlzT2JqZWN0KHNvdXJjZSkgJiYgYXJndW1lbnRzLmxlbmd0aCA+IDEpIHtcbiAgICByZXR1cm4gcHJvcGVydHlUb1JlZihzb3VyY2UsIGtleSwgZGVmYXVsdFZhbHVlKTtcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gLyogQF9fUFVSRV9fICovIHJlZihzb3VyY2UpO1xuICB9XG59XG5mdW5jdGlvbiBwcm9wZXJ0eVRvUmVmKHNvdXJjZSwga2V5LCBkZWZhdWx0VmFsdWUpIHtcbiAgcmV0dXJuIG5ldyBPYmplY3RSZWZJbXBsKHNvdXJjZSwga2V5LCBkZWZhdWx0VmFsdWUpO1xufVxuXG5jbGFzcyBDb21wdXRlZFJlZkltcGwge1xuICBjb25zdHJ1Y3Rvcihmbiwgc2V0dGVyLCBpc1NTUikge1xuICAgIHRoaXMuZm4gPSBmbjtcbiAgICB0aGlzLnNldHRlciA9IHNldHRlcjtcbiAgICAvKipcbiAgICAgKiBAaW50ZXJuYWxcbiAgICAgKi9cbiAgICB0aGlzLl92YWx1ZSA9IHZvaWQgMDtcbiAgICAvKipcbiAgICAgKiBAaW50ZXJuYWxcbiAgICAgKi9cbiAgICB0aGlzLmRlcCA9IG5ldyBEZXAodGhpcyk7XG4gICAgLyoqXG4gICAgICogQGludGVybmFsXG4gICAgICovXG4gICAgdGhpcy5fX3ZfaXNSZWYgPSB0cnVlO1xuICAgIC8vIFRPRE8gaXNvbGF0ZWREZWNsYXJhdGlvbnMgXCJfX3ZfaXNSZWFkb25seVwiXG4gICAgLy8gQSBjb21wdXRlZCBpcyBhbHNvIGEgc3Vic2NyaWJlciB0aGF0IHRyYWNrcyBvdGhlciBkZXBzXG4gICAgLyoqXG4gICAgICogQGludGVybmFsXG4gICAgICovXG4gICAgdGhpcy5kZXBzID0gdm9pZCAwO1xuICAgIC8qKlxuICAgICAqIEBpbnRlcm5hbFxuICAgICAqL1xuICAgIHRoaXMuZGVwc1RhaWwgPSB2b2lkIDA7XG4gICAgLyoqXG4gICAgICogQGludGVybmFsXG4gICAgICovXG4gICAgdGhpcy5mbGFncyA9IDE2O1xuICAgIC8qKlxuICAgICAqIEBpbnRlcm5hbFxuICAgICAqL1xuICAgIHRoaXMuZ2xvYmFsVmVyc2lvbiA9IGdsb2JhbFZlcnNpb24gLSAxO1xuICAgIC8qKlxuICAgICAqIEBpbnRlcm5hbFxuICAgICAqL1xuICAgIHRoaXMubmV4dCA9IHZvaWQgMDtcbiAgICAvLyBmb3IgYmFja3dhcmRzIGNvbXBhdFxuICAgIHRoaXMuZWZmZWN0ID0gdGhpcztcbiAgICB0aGlzW1wiX192X2lzUmVhZG9ubHlcIl0gPSAhc2V0dGVyO1xuICAgIHRoaXMuaXNTU1IgPSBpc1NTUjtcbiAgfVxuICAvKipcbiAgICogQGludGVybmFsXG4gICAqL1xuICBub3RpZnkoKSB7XG4gICAgdGhpcy5mbGFncyB8PSAxNjtcbiAgICBpZiAoISh0aGlzLmZsYWdzICYgOCkgJiYgLy8gYXZvaWQgaW5maW5pdGUgc2VsZiByZWN1cnNpb25cbiAgICBhY3RpdmVTdWIgIT09IHRoaXMpIHtcbiAgICAgIGJhdGNoKHRoaXMsIHRydWUpO1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfSBlbHNlIGlmICghIShwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gXCJwcm9kdWN0aW9uXCIpKSA7XG4gIH1cbiAgZ2V0IHZhbHVlKCkge1xuICAgIGNvbnN0IGxpbmsgPSAhIShwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gXCJwcm9kdWN0aW9uXCIpID8gdGhpcy5kZXAudHJhY2soe1xuICAgICAgdGFyZ2V0OiB0aGlzLFxuICAgICAgdHlwZTogXCJnZXRcIixcbiAgICAgIGtleTogXCJ2YWx1ZVwiXG4gICAgfSkgOiB0aGlzLmRlcC50cmFjaygpO1xuICAgIHJlZnJlc2hDb21wdXRlZCh0aGlzKTtcbiAgICBpZiAobGluaykge1xuICAgICAgbGluay52ZXJzaW9uID0gdGhpcy5kZXAudmVyc2lvbjtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuX3ZhbHVlO1xuICB9XG4gIHNldCB2YWx1ZShuZXdWYWx1ZSkge1xuICAgIGlmICh0aGlzLnNldHRlcikge1xuICAgICAgdGhpcy5zZXR0ZXIobmV3VmFsdWUpO1xuICAgIH0gZWxzZSBpZiAoISEocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09IFwicHJvZHVjdGlvblwiKSkge1xuICAgICAgd2FybihcIldyaXRlIG9wZXJhdGlvbiBmYWlsZWQ6IGNvbXB1dGVkIHZhbHVlIGlzIHJlYWRvbmx5XCIpO1xuICAgIH1cbiAgfVxufVxuLy8gQF9fTk9fU0lERV9FRkZFQ1RTX19cbmZ1bmN0aW9uIGNvbXB1dGVkKGdldHRlck9yT3B0aW9ucywgZGVidWdPcHRpb25zLCBpc1NTUiA9IGZhbHNlKSB7XG4gIGxldCBnZXR0ZXI7XG4gIGxldCBzZXR0ZXI7XG4gIGlmIChpc0Z1bmN0aW9uKGdldHRlck9yT3B0aW9ucykpIHtcbiAgICBnZXR0ZXIgPSBnZXR0ZXJPck9wdGlvbnM7XG4gIH0gZWxzZSB7XG4gICAgZ2V0dGVyID0gZ2V0dGVyT3JPcHRpb25zLmdldDtcbiAgICBzZXR0ZXIgPSBnZXR0ZXJPck9wdGlvbnMuc2V0O1xuICB9XG4gIGNvbnN0IGNSZWYgPSBuZXcgQ29tcHV0ZWRSZWZJbXBsKGdldHRlciwgc2V0dGVyLCBpc1NTUik7XG4gIGlmICghIShwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gXCJwcm9kdWN0aW9uXCIpICYmIGRlYnVnT3B0aW9ucyAmJiAhaXNTU1IpIHtcbiAgICBjUmVmLm9uVHJhY2sgPSBkZWJ1Z09wdGlvbnMub25UcmFjaztcbiAgICBjUmVmLm9uVHJpZ2dlciA9IGRlYnVnT3B0aW9ucy5vblRyaWdnZXI7XG4gIH1cbiAgcmV0dXJuIGNSZWY7XG59XG5cbmNvbnN0IFRyYWNrT3BUeXBlcyA9IHtcbiAgXCJHRVRcIjogXCJnZXRcIixcbiAgXCJIQVNcIjogXCJoYXNcIixcbiAgXCJJVEVSQVRFXCI6IFwiaXRlcmF0ZVwiXG59O1xuY29uc3QgVHJpZ2dlck9wVHlwZXMgPSB7XG4gIFwiU0VUXCI6IFwic2V0XCIsXG4gIFwiQUREXCI6IFwiYWRkXCIsXG4gIFwiREVMRVRFXCI6IFwiZGVsZXRlXCIsXG4gIFwiQ0xFQVJcIjogXCJjbGVhclwiXG59O1xuY29uc3QgUmVhY3RpdmVGbGFncyA9IHtcbiAgXCJTS0lQXCI6IFwiX192X3NraXBcIixcbiAgXCJJU19SRUFDVElWRVwiOiBcIl9fdl9pc1JlYWN0aXZlXCIsXG4gIFwiSVNfUkVBRE9OTFlcIjogXCJfX3ZfaXNSZWFkb25seVwiLFxuICBcIklTX1NIQUxMT1dcIjogXCJfX3ZfaXNTaGFsbG93XCIsXG4gIFwiUkFXXCI6IFwiX192X3Jhd1wiLFxuICBcIklTX1JFRlwiOiBcIl9fdl9pc1JlZlwiXG59O1xuXG5jb25zdCBXYXRjaEVycm9yQ29kZXMgPSB7XG4gIFwiV0FUQ0hfR0VUVEVSXCI6IDIsXG4gIFwiMlwiOiBcIldBVENIX0dFVFRFUlwiLFxuICBcIldBVENIX0NBTExCQUNLXCI6IDMsXG4gIFwiM1wiOiBcIldBVENIX0NBTExCQUNLXCIsXG4gIFwiV0FUQ0hfQ0xFQU5VUFwiOiA0LFxuICBcIjRcIjogXCJXQVRDSF9DTEVBTlVQXCJcbn07XG5jb25zdCBJTklUSUFMX1dBVENIRVJfVkFMVUUgPSB7fTtcbmNvbnN0IGNsZWFudXBNYXAgPSAvKiBAX19QVVJFX18gKi8gbmV3IFdlYWtNYXAoKTtcbmxldCBhY3RpdmVXYXRjaGVyID0gdm9pZCAwO1xuZnVuY3Rpb24gZ2V0Q3VycmVudFdhdGNoZXIoKSB7XG4gIHJldHVybiBhY3RpdmVXYXRjaGVyO1xufVxuZnVuY3Rpb24gb25XYXRjaGVyQ2xlYW51cChjbGVhbnVwRm4sIGZhaWxTaWxlbnRseSA9IGZhbHNlLCBvd25lciA9IGFjdGl2ZVdhdGNoZXIpIHtcbiAgaWYgKG93bmVyKSB7XG4gICAgbGV0IGNsZWFudXBzID0gY2xlYW51cE1hcC5nZXQob3duZXIpO1xuICAgIGlmICghY2xlYW51cHMpIGNsZWFudXBNYXAuc2V0KG93bmVyLCBjbGVhbnVwcyA9IFtdKTtcbiAgICBjbGVhbnVwcy5wdXNoKGNsZWFudXBGbik7XG4gIH0gZWxzZSBpZiAoISEocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09IFwicHJvZHVjdGlvblwiKSAmJiAhZmFpbFNpbGVudGx5KSB7XG4gICAgd2FybihcbiAgICAgIGBvbldhdGNoZXJDbGVhbnVwKCkgd2FzIGNhbGxlZCB3aGVuIHRoZXJlIHdhcyBubyBhY3RpdmUgd2F0Y2hlciB0byBhc3NvY2lhdGUgd2l0aC5gXG4gICAgKTtcbiAgfVxufVxuZnVuY3Rpb24gd2F0Y2goc291cmNlLCBjYiwgb3B0aW9ucyA9IEVNUFRZX09CSikge1xuICBjb25zdCB7IGltbWVkaWF0ZSwgZGVlcCwgb25jZSwgc2NoZWR1bGVyLCBhdWdtZW50Sm9iLCBjYWxsIH0gPSBvcHRpb25zO1xuICBjb25zdCB3YXJuSW52YWxpZFNvdXJjZSA9IChzKSA9PiB7XG4gICAgKG9wdGlvbnMub25XYXJuIHx8IHdhcm4pKFxuICAgICAgYEludmFsaWQgd2F0Y2ggc291cmNlOiBgLFxuICAgICAgcyxcbiAgICAgIGBBIHdhdGNoIHNvdXJjZSBjYW4gb25seSBiZSBhIGdldHRlci9lZmZlY3QgZnVuY3Rpb24sIGEgcmVmLCBhIHJlYWN0aXZlIG9iamVjdCwgb3IgYW4gYXJyYXkgb2YgdGhlc2UgdHlwZXMuYFxuICAgICk7XG4gIH07XG4gIGNvbnN0IHJlYWN0aXZlR2V0dGVyID0gKHNvdXJjZTIpID0+IHtcbiAgICBpZiAoZGVlcCkgcmV0dXJuIHNvdXJjZTI7XG4gICAgaWYgKGlzU2hhbGxvdyhzb3VyY2UyKSB8fCBkZWVwID09PSBmYWxzZSB8fCBkZWVwID09PSAwKVxuICAgICAgcmV0dXJuIHRyYXZlcnNlKHNvdXJjZTIsIDEpO1xuICAgIHJldHVybiB0cmF2ZXJzZShzb3VyY2UyKTtcbiAgfTtcbiAgbGV0IGVmZmVjdDtcbiAgbGV0IGdldHRlcjtcbiAgbGV0IGNsZWFudXA7XG4gIGxldCBib3VuZENsZWFudXA7XG4gIGxldCBmb3JjZVRyaWdnZXIgPSBmYWxzZTtcbiAgbGV0IGlzTXVsdGlTb3VyY2UgPSBmYWxzZTtcbiAgaWYgKGlzUmVmKHNvdXJjZSkpIHtcbiAgICBnZXR0ZXIgPSAoKSA9PiBzb3VyY2UudmFsdWU7XG4gICAgZm9yY2VUcmlnZ2VyID0gaXNTaGFsbG93KHNvdXJjZSk7XG4gIH0gZWxzZSBpZiAoaXNSZWFjdGl2ZShzb3VyY2UpKSB7XG4gICAgZ2V0dGVyID0gKCkgPT4gcmVhY3RpdmVHZXR0ZXIoc291cmNlKTtcbiAgICBmb3JjZVRyaWdnZXIgPSB0cnVlO1xuICB9IGVsc2UgaWYgKGlzQXJyYXkoc291cmNlKSkge1xuICAgIGlzTXVsdGlTb3VyY2UgPSB0cnVlO1xuICAgIGZvcmNlVHJpZ2dlciA9IHNvdXJjZS5zb21lKChzKSA9PiBpc1JlYWN0aXZlKHMpIHx8IGlzU2hhbGxvdyhzKSk7XG4gICAgZ2V0dGVyID0gKCkgPT4gc291cmNlLm1hcCgocykgPT4ge1xuICAgICAgaWYgKGlzUmVmKHMpKSB7XG4gICAgICAgIHJldHVybiBzLnZhbHVlO1xuICAgICAgfSBlbHNlIGlmIChpc1JlYWN0aXZlKHMpKSB7XG4gICAgICAgIHJldHVybiByZWFjdGl2ZUdldHRlcihzKTtcbiAgICAgIH0gZWxzZSBpZiAoaXNGdW5jdGlvbihzKSkge1xuICAgICAgICByZXR1cm4gY2FsbCA/IGNhbGwocywgMikgOiBzKCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAhIShwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gXCJwcm9kdWN0aW9uXCIpICYmIHdhcm5JbnZhbGlkU291cmNlKHMpO1xuICAgICAgfVxuICAgIH0pO1xuICB9IGVsc2UgaWYgKGlzRnVuY3Rpb24oc291cmNlKSkge1xuICAgIGlmIChjYikge1xuICAgICAgZ2V0dGVyID0gY2FsbCA/ICgpID0+IGNhbGwoc291cmNlLCAyKSA6IHNvdXJjZTtcbiAgICB9IGVsc2Uge1xuICAgICAgZ2V0dGVyID0gKCkgPT4ge1xuICAgICAgICBpZiAoY2xlYW51cCkge1xuICAgICAgICAgIHBhdXNlVHJhY2tpbmcoKTtcbiAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgY2xlYW51cCgpO1xuICAgICAgICAgIH0gZmluYWxseSB7XG4gICAgICAgICAgICByZXNldFRyYWNraW5nKCk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGN1cnJlbnRFZmZlY3QgPSBhY3RpdmVXYXRjaGVyO1xuICAgICAgICBhY3RpdmVXYXRjaGVyID0gZWZmZWN0O1xuICAgICAgICB0cnkge1xuICAgICAgICAgIHJldHVybiBjYWxsID8gY2FsbChzb3VyY2UsIDMsIFtib3VuZENsZWFudXBdKSA6IHNvdXJjZShib3VuZENsZWFudXApO1xuICAgICAgICB9IGZpbmFsbHkge1xuICAgICAgICAgIGFjdGl2ZVdhdGNoZXIgPSBjdXJyZW50RWZmZWN0O1xuICAgICAgICB9XG4gICAgICB9O1xuICAgIH1cbiAgfSBlbHNlIHtcbiAgICBnZXR0ZXIgPSBOT09QO1xuICAgICEhKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSBcInByb2R1Y3Rpb25cIikgJiYgd2FybkludmFsaWRTb3VyY2Uoc291cmNlKTtcbiAgfVxuICBpZiAoY2IgJiYgZGVlcCkge1xuICAgIGNvbnN0IGJhc2VHZXR0ZXIgPSBnZXR0ZXI7XG4gICAgY29uc3QgZGVwdGggPSBkZWVwID09PSB0cnVlID8gSW5maW5pdHkgOiBkZWVwO1xuICAgIGdldHRlciA9ICgpID0+IHRyYXZlcnNlKGJhc2VHZXR0ZXIoKSwgZGVwdGgpO1xuICB9XG4gIGNvbnN0IHNjb3BlID0gZ2V0Q3VycmVudFNjb3BlKCk7XG4gIGNvbnN0IHdhdGNoSGFuZGxlID0gKCkgPT4ge1xuICAgIGVmZmVjdC5zdG9wKCk7XG4gICAgaWYgKHNjb3BlICYmIHNjb3BlLmFjdGl2ZSkge1xuICAgICAgcmVtb3ZlKHNjb3BlLmVmZmVjdHMsIGVmZmVjdCk7XG4gICAgfVxuICB9O1xuICBpZiAob25jZSAmJiBjYikge1xuICAgIGNvbnN0IF9jYiA9IGNiO1xuICAgIGNiID0gKC4uLmFyZ3MpID0+IHtcbiAgICAgIF9jYiguLi5hcmdzKTtcbiAgICAgIHdhdGNoSGFuZGxlKCk7XG4gICAgfTtcbiAgfVxuICBsZXQgb2xkVmFsdWUgPSBpc011bHRpU291cmNlID8gbmV3IEFycmF5KHNvdXJjZS5sZW5ndGgpLmZpbGwoSU5JVElBTF9XQVRDSEVSX1ZBTFVFKSA6IElOSVRJQUxfV0FUQ0hFUl9WQUxVRTtcbiAgY29uc3Qgam9iID0gKGltbWVkaWF0ZUZpcnN0UnVuKSA9PiB7XG4gICAgaWYgKCEoZWZmZWN0LmZsYWdzICYgMSkgfHwgIWVmZmVjdC5kaXJ0eSAmJiAhaW1tZWRpYXRlRmlyc3RSdW4pIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgaWYgKGNiKSB7XG4gICAgICBjb25zdCBuZXdWYWx1ZSA9IGVmZmVjdC5ydW4oKTtcbiAgICAgIGlmIChkZWVwIHx8IGZvcmNlVHJpZ2dlciB8fCAoaXNNdWx0aVNvdXJjZSA/IG5ld1ZhbHVlLnNvbWUoKHYsIGkpID0+IGhhc0NoYW5nZWQodiwgb2xkVmFsdWVbaV0pKSA6IGhhc0NoYW5nZWQobmV3VmFsdWUsIG9sZFZhbHVlKSkpIHtcbiAgICAgICAgaWYgKGNsZWFudXApIHtcbiAgICAgICAgICBjbGVhbnVwKCk7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgY3VycmVudFdhdGNoZXIgPSBhY3RpdmVXYXRjaGVyO1xuICAgICAgICBhY3RpdmVXYXRjaGVyID0gZWZmZWN0O1xuICAgICAgICB0cnkge1xuICAgICAgICAgIGNvbnN0IGFyZ3MgPSBbXG4gICAgICAgICAgICBuZXdWYWx1ZSxcbiAgICAgICAgICAgIC8vIHBhc3MgdW5kZWZpbmVkIGFzIHRoZSBvbGQgdmFsdWUgd2hlbiBpdCdzIGNoYW5nZWQgZm9yIHRoZSBmaXJzdCB0aW1lXG4gICAgICAgICAgICBvbGRWYWx1ZSA9PT0gSU5JVElBTF9XQVRDSEVSX1ZBTFVFID8gdm9pZCAwIDogaXNNdWx0aVNvdXJjZSAmJiBvbGRWYWx1ZVswXSA9PT0gSU5JVElBTF9XQVRDSEVSX1ZBTFVFID8gW10gOiBvbGRWYWx1ZSxcbiAgICAgICAgICAgIGJvdW5kQ2xlYW51cFxuICAgICAgICAgIF07XG4gICAgICAgICAgb2xkVmFsdWUgPSBuZXdWYWx1ZTtcbiAgICAgICAgICBjYWxsID8gY2FsbChjYiwgMywgYXJncykgOiAoXG4gICAgICAgICAgICAvLyBAdHMtZXhwZWN0LWVycm9yXG4gICAgICAgICAgICBjYiguLi5hcmdzKVxuICAgICAgICAgICk7XG4gICAgICAgIH0gZmluYWxseSB7XG4gICAgICAgICAgYWN0aXZlV2F0Y2hlciA9IGN1cnJlbnRXYXRjaGVyO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIGVmZmVjdC5ydW4oKTtcbiAgICB9XG4gIH07XG4gIGlmIChhdWdtZW50Sm9iKSB7XG4gICAgYXVnbWVudEpvYihqb2IpO1xuICB9XG4gIGVmZmVjdCA9IG5ldyBSZWFjdGl2ZUVmZmVjdChnZXR0ZXIpO1xuICBlZmZlY3Quc2NoZWR1bGVyID0gc2NoZWR1bGVyID8gKCkgPT4gc2NoZWR1bGVyKGpvYiwgZmFsc2UpIDogam9iO1xuICBib3VuZENsZWFudXAgPSAoZm4pID0+IG9uV2F0Y2hlckNsZWFudXAoZm4sIGZhbHNlLCBlZmZlY3QpO1xuICBjbGVhbnVwID0gZWZmZWN0Lm9uU3RvcCA9ICgpID0+IHtcbiAgICBjb25zdCBjbGVhbnVwcyA9IGNsZWFudXBNYXAuZ2V0KGVmZmVjdCk7XG4gICAgaWYgKGNsZWFudXBzKSB7XG4gICAgICBpZiAoY2FsbCkge1xuICAgICAgICBjYWxsKGNsZWFudXBzLCA0KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGZvciAoY29uc3QgY2xlYW51cDIgb2YgY2xlYW51cHMpIGNsZWFudXAyKCk7XG4gICAgICB9XG4gICAgICBjbGVhbnVwTWFwLmRlbGV0ZShlZmZlY3QpO1xuICAgIH1cbiAgfTtcbiAgaWYgKCEhKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSBcInByb2R1Y3Rpb25cIikpIHtcbiAgICBlZmZlY3Qub25UcmFjayA9IG9wdGlvbnMub25UcmFjaztcbiAgICBlZmZlY3Qub25UcmlnZ2VyID0gb3B0aW9ucy5vblRyaWdnZXI7XG4gIH1cbiAgaWYgKGNiKSB7XG4gICAgaWYgKGltbWVkaWF0ZSkge1xuICAgICAgam9iKHRydWUpO1xuICAgIH0gZWxzZSB7XG4gICAgICBvbGRWYWx1ZSA9IGVmZmVjdC5ydW4oKTtcbiAgICB9XG4gIH0gZWxzZSBpZiAoc2NoZWR1bGVyKSB7XG4gICAgc2NoZWR1bGVyKGpvYi5iaW5kKG51bGwsIHRydWUpLCB0cnVlKTtcbiAgfSBlbHNlIHtcbiAgICBlZmZlY3QucnVuKCk7XG4gIH1cbiAgd2F0Y2hIYW5kbGUucGF1c2UgPSBlZmZlY3QucGF1c2UuYmluZChlZmZlY3QpO1xuICB3YXRjaEhhbmRsZS5yZXN1bWUgPSBlZmZlY3QucmVzdW1lLmJpbmQoZWZmZWN0KTtcbiAgd2F0Y2hIYW5kbGUuc3RvcCA9IHdhdGNoSGFuZGxlO1xuICByZXR1cm4gd2F0Y2hIYW5kbGU7XG59XG5mdW5jdGlvbiB0cmF2ZXJzZSh2YWx1ZSwgZGVwdGggPSBJbmZpbml0eSwgc2Vlbikge1xuICBpZiAoZGVwdGggPD0gMCB8fCAhaXNPYmplY3QodmFsdWUpIHx8IHZhbHVlW1wiX192X3NraXBcIl0pIHtcbiAgICByZXR1cm4gdmFsdWU7XG4gIH1cbiAgc2VlbiA9IHNlZW4gfHwgLyogQF9fUFVSRV9fICovIG5ldyBNYXAoKTtcbiAgaWYgKChzZWVuLmdldCh2YWx1ZSkgfHwgMCkgPj0gZGVwdGgpIHtcbiAgICByZXR1cm4gdmFsdWU7XG4gIH1cbiAgc2Vlbi5zZXQodmFsdWUsIGRlcHRoKTtcbiAgZGVwdGgtLTtcbiAgaWYgKGlzUmVmKHZhbHVlKSkge1xuICAgIHRyYXZlcnNlKHZhbHVlLnZhbHVlLCBkZXB0aCwgc2Vlbik7XG4gIH0gZWxzZSBpZiAoaXNBcnJheSh2YWx1ZSkpIHtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHZhbHVlLmxlbmd0aDsgaSsrKSB7XG4gICAgICB0cmF2ZXJzZSh2YWx1ZVtpXSwgZGVwdGgsIHNlZW4pO1xuICAgIH1cbiAgfSBlbHNlIGlmIChpc1NldCh2YWx1ZSkgfHwgaXNNYXAodmFsdWUpKSB7XG4gICAgdmFsdWUuZm9yRWFjaCgodikgPT4ge1xuICAgICAgdHJhdmVyc2UodiwgZGVwdGgsIHNlZW4pO1xuICAgIH0pO1xuICB9IGVsc2UgaWYgKGlzUGxhaW5PYmplY3QodmFsdWUpKSB7XG4gICAgZm9yIChjb25zdCBrZXkgaW4gdmFsdWUpIHtcbiAgICAgIHRyYXZlcnNlKHZhbHVlW2tleV0sIGRlcHRoLCBzZWVuKTtcbiAgICB9XG4gICAgZm9yIChjb25zdCBrZXkgb2YgT2JqZWN0LmdldE93blByb3BlcnR5U3ltYm9scyh2YWx1ZSkpIHtcbiAgICAgIGlmIChPYmplY3QucHJvdG90eXBlLnByb3BlcnR5SXNFbnVtZXJhYmxlLmNhbGwodmFsdWUsIGtleSkpIHtcbiAgICAgICAgdHJhdmVyc2UodmFsdWVba2V5XSwgZGVwdGgsIHNlZW4pO1xuICAgICAgfVxuICAgIH1cbiAgfVxuICByZXR1cm4gdmFsdWU7XG59XG5cbmV4cG9ydCB7IEFSUkFZX0lURVJBVEVfS0VZLCBFZmZlY3RGbGFncywgRWZmZWN0U2NvcGUsIElURVJBVEVfS0VZLCBNQVBfS0VZX0lURVJBVEVfS0VZLCBSZWFjdGl2ZUVmZmVjdCwgUmVhY3RpdmVGbGFncywgVHJhY2tPcFR5cGVzLCBUcmlnZ2VyT3BUeXBlcywgV2F0Y2hFcnJvckNvZGVzLCBjb21wdXRlZCwgY3VzdG9tUmVmLCBlZmZlY3QsIGVmZmVjdFNjb3BlLCBlbmFibGVUcmFja2luZywgZ2V0Q3VycmVudFNjb3BlLCBnZXRDdXJyZW50V2F0Y2hlciwgaXNQcm94eSwgaXNSZWFjdGl2ZSwgaXNSZWFkb25seSwgaXNSZWYsIGlzU2hhbGxvdywgbWFya1Jhdywgb25FZmZlY3RDbGVhbnVwLCBvblNjb3BlRGlzcG9zZSwgb25XYXRjaGVyQ2xlYW51cCwgcGF1c2VUcmFja2luZywgcHJveHlSZWZzLCByZWFjdGl2ZSwgcmVhY3RpdmVSZWFkQXJyYXksIHJlYWRvbmx5LCByZWYsIHJlc2V0VHJhY2tpbmcsIHNoYWxsb3dSZWFjdGl2ZSwgc2hhbGxvd1JlYWRBcnJheSwgc2hhbGxvd1JlYWRvbmx5LCBzaGFsbG93UmVmLCBzdG9wLCB0b1JhdywgdG9SZWFjdGl2ZSwgdG9SZWFkb25seSwgdG9SZWYsIHRvUmVmcywgdG9WYWx1ZSwgdHJhY2ssIHRyYXZlcnNlLCB0cmlnZ2VyLCB0cmlnZ2VyUmVmLCB1bnJlZiwgd2F0Y2ggfTtcbiIsIi8qKlxuKiBAdnVlL3J1bnRpbWUtY29yZSB2My41LjI4XG4qIChjKSAyMDE4LXByZXNlbnQgWXV4aSAoRXZhbikgWW91IGFuZCBWdWUgY29udHJpYnV0b3JzXG4qIEBsaWNlbnNlIE1JVFxuKiovXG5pbXBvcnQgeyBwYXVzZVRyYWNraW5nLCByZXNldFRyYWNraW5nLCBpc1JlZiwgdG9SYXcsIHRyYXZlcnNlLCB3YXRjaCBhcyB3YXRjaCQxLCBzaGFsbG93UmVmLCByZWFkb25seSwgaXNSZWFjdGl2ZSwgcmVmLCBpc1NoYWxsb3csIGlzUmVhZG9ubHksIHNoYWxsb3dSZWFkQXJyYXksIHRvUmVhZG9ubHksIHRvUmVhY3RpdmUsIHNoYWxsb3dSZWFkb25seSwgdHJhY2ssIHJlYWN0aXZlLCBjdXN0b21SZWYsIHNoYWxsb3dSZWFjdGl2ZSwgdHJpZ2dlciwgUmVhY3RpdmVFZmZlY3QsIGlzUHJveHksIHByb3h5UmVmcywgbWFya1JhdywgRWZmZWN0U2NvcGUsIGNvbXB1dGVkIGFzIGNvbXB1dGVkJDEgfSBmcm9tICdAdnVlL3JlYWN0aXZpdHknO1xuZXhwb3J0IHsgRWZmZWN0U2NvcGUsIFJlYWN0aXZlRWZmZWN0LCBUcmFja09wVHlwZXMsIFRyaWdnZXJPcFR5cGVzLCBjdXN0b21SZWYsIGVmZmVjdCwgZWZmZWN0U2NvcGUsIGdldEN1cnJlbnRTY29wZSwgZ2V0Q3VycmVudFdhdGNoZXIsIGlzUHJveHksIGlzUmVhY3RpdmUsIGlzUmVhZG9ubHksIGlzUmVmLCBpc1NoYWxsb3csIG1hcmtSYXcsIG9uU2NvcGVEaXNwb3NlLCBvbldhdGNoZXJDbGVhbnVwLCBwcm94eVJlZnMsIHJlYWN0aXZlLCByZWFkb25seSwgcmVmLCBzaGFsbG93UmVhY3RpdmUsIHNoYWxsb3dSZWFkb25seSwgc2hhbGxvd1JlZiwgc3RvcCwgdG9SYXcsIHRvUmVmLCB0b1JlZnMsIHRvVmFsdWUsIHRyaWdnZXJSZWYsIHVucmVmIH0gZnJvbSAnQHZ1ZS9yZWFjdGl2aXR5JztcbmltcG9ydCB7IGlzU3RyaW5nLCBpc0Z1bmN0aW9uLCBFTVBUWV9PQkosIGlzUHJvbWlzZSwgaXNBcnJheSwgTk9PUCwgZ2V0R2xvYmFsVGhpcywgZXh0ZW5kLCBpc0J1aWx0SW5EaXJlY3RpdmUsIE5PLCBoYXNPd24sIHJlbW92ZSwgZGVmLCBpc09uLCBpc1Jlc2VydmVkUHJvcCwgbm9ybWFsaXplQ2xhc3MsIHN0cmluZ2lmeVN0eWxlLCBub3JtYWxpemVTdHlsZSwgaXNLbm93blN2Z0F0dHIsIGlzQm9vbGVhbkF0dHIsIGlzS25vd25IdG1sQXR0ciwgaW5jbHVkZUJvb2xlYW5BdHRyLCBpc1JlbmRlcmFibGVBdHRyVmFsdWUsIG5vcm1hbGl6ZUNzc1ZhclZhbHVlLCBnZXRFc2NhcGVkQ3NzVmFyTmFtZSwgaXNPYmplY3QsIGlzUmVnRXhwLCBpbnZva2VBcnJheUZucywgdG9IYW5kbGVyS2V5LCBjYW1lbGl6ZSwgY2FwaXRhbGl6ZSwgaXNTeW1ib2wsIGlzR2xvYmFsbHlBbGxvd2VkLCBoeXBoZW5hdGUsIGhhc0NoYW5nZWQsIGxvb3NlVG9OdW1iZXIsIGlzTW9kZWxMaXN0ZW5lciwgbG9vc2VFcXVhbCwgRU1QVFlfQVJSLCB0b1Jhd1R5cGUsIG1ha2VNYXAsIHRvTnVtYmVyIH0gZnJvbSAnQHZ1ZS9zaGFyZWQnO1xuZXhwb3J0IHsgY2FtZWxpemUsIGNhcGl0YWxpemUsIG5vcm1hbGl6ZUNsYXNzLCBub3JtYWxpemVQcm9wcywgbm9ybWFsaXplU3R5bGUsIHRvRGlzcGxheVN0cmluZywgdG9IYW5kbGVyS2V5IH0gZnJvbSAnQHZ1ZS9zaGFyZWQnO1xuXG5jb25zdCBzdGFjayA9IFtdO1xuZnVuY3Rpb24gcHVzaFdhcm5pbmdDb250ZXh0KHZub2RlKSB7XG4gIHN0YWNrLnB1c2godm5vZGUpO1xufVxuZnVuY3Rpb24gcG9wV2FybmluZ0NvbnRleHQoKSB7XG4gIHN0YWNrLnBvcCgpO1xufVxubGV0IGlzV2FybmluZyA9IGZhbHNlO1xuZnVuY3Rpb24gd2FybiQxKG1zZywgLi4uYXJncykge1xuICBpZiAoaXNXYXJuaW5nKSByZXR1cm47XG4gIGlzV2FybmluZyA9IHRydWU7XG4gIHBhdXNlVHJhY2tpbmcoKTtcbiAgY29uc3QgaW5zdGFuY2UgPSBzdGFjay5sZW5ndGggPyBzdGFja1tzdGFjay5sZW5ndGggLSAxXS5jb21wb25lbnQgOiBudWxsO1xuICBjb25zdCBhcHBXYXJuSGFuZGxlciA9IGluc3RhbmNlICYmIGluc3RhbmNlLmFwcENvbnRleHQuY29uZmlnLndhcm5IYW5kbGVyO1xuICBjb25zdCB0cmFjZSA9IGdldENvbXBvbmVudFRyYWNlKCk7XG4gIGlmIChhcHBXYXJuSGFuZGxlcikge1xuICAgIGNhbGxXaXRoRXJyb3JIYW5kbGluZyhcbiAgICAgIGFwcFdhcm5IYW5kbGVyLFxuICAgICAgaW5zdGFuY2UsXG4gICAgICAxMSxcbiAgICAgIFtcbiAgICAgICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLXJlc3RyaWN0ZWQtc3ludGF4XG4gICAgICAgIG1zZyArIGFyZ3MubWFwKChhKSA9PiB7XG4gICAgICAgICAgdmFyIF9hLCBfYjtcbiAgICAgICAgICByZXR1cm4gKF9iID0gKF9hID0gYS50b1N0cmluZykgPT0gbnVsbCA/IHZvaWQgMCA6IF9hLmNhbGwoYSkpICE9IG51bGwgPyBfYiA6IEpTT04uc3RyaW5naWZ5KGEpO1xuICAgICAgICB9KS5qb2luKFwiXCIpLFxuICAgICAgICBpbnN0YW5jZSAmJiBpbnN0YW5jZS5wcm94eSxcbiAgICAgICAgdHJhY2UubWFwKFxuICAgICAgICAgICh7IHZub2RlIH0pID0+IGBhdCA8JHtmb3JtYXRDb21wb25lbnROYW1lKGluc3RhbmNlLCB2bm9kZS50eXBlKX0+YFxuICAgICAgICApLmpvaW4oXCJcXG5cIiksXG4gICAgICAgIHRyYWNlXG4gICAgICBdXG4gICAgKTtcbiAgfSBlbHNlIHtcbiAgICBjb25zdCB3YXJuQXJncyA9IFtgW1Z1ZSB3YXJuXTogJHttc2d9YCwgLi4uYXJnc107XG4gICAgaWYgKHRyYWNlLmxlbmd0aCAmJiAvLyBhdm9pZCBzcGFtbWluZyBjb25zb2xlIGR1cmluZyB0ZXN0c1xuICAgIHRydWUpIHtcbiAgICAgIHdhcm5BcmdzLnB1c2goYFxuYCwgLi4uZm9ybWF0VHJhY2UodHJhY2UpKTtcbiAgICB9XG4gICAgY29uc29sZS53YXJuKC4uLndhcm5BcmdzKTtcbiAgfVxuICByZXNldFRyYWNraW5nKCk7XG4gIGlzV2FybmluZyA9IGZhbHNlO1xufVxuZnVuY3Rpb24gZ2V0Q29tcG9uZW50VHJhY2UoKSB7XG4gIGxldCBjdXJyZW50Vk5vZGUgPSBzdGFja1tzdGFjay5sZW5ndGggLSAxXTtcbiAgaWYgKCFjdXJyZW50Vk5vZGUpIHtcbiAgICByZXR1cm4gW107XG4gIH1cbiAgY29uc3Qgbm9ybWFsaXplZFN0YWNrID0gW107XG4gIHdoaWxlIChjdXJyZW50Vk5vZGUpIHtcbiAgICBjb25zdCBsYXN0ID0gbm9ybWFsaXplZFN0YWNrWzBdO1xuICAgIGlmIChsYXN0ICYmIGxhc3Qudm5vZGUgPT09IGN1cnJlbnRWTm9kZSkge1xuICAgICAgbGFzdC5yZWN1cnNlQ291bnQrKztcbiAgICB9IGVsc2Uge1xuICAgICAgbm9ybWFsaXplZFN0YWNrLnB1c2goe1xuICAgICAgICB2bm9kZTogY3VycmVudFZOb2RlLFxuICAgICAgICByZWN1cnNlQ291bnQ6IDBcbiAgICAgIH0pO1xuICAgIH1cbiAgICBjb25zdCBwYXJlbnRJbnN0YW5jZSA9IGN1cnJlbnRWTm9kZS5jb21wb25lbnQgJiYgY3VycmVudFZOb2RlLmNvbXBvbmVudC5wYXJlbnQ7XG4gICAgY3VycmVudFZOb2RlID0gcGFyZW50SW5zdGFuY2UgJiYgcGFyZW50SW5zdGFuY2Uudm5vZGU7XG4gIH1cbiAgcmV0dXJuIG5vcm1hbGl6ZWRTdGFjaztcbn1cbmZ1bmN0aW9uIGZvcm1hdFRyYWNlKHRyYWNlKSB7XG4gIGNvbnN0IGxvZ3MgPSBbXTtcbiAgdHJhY2UuZm9yRWFjaCgoZW50cnksIGkpID0+IHtcbiAgICBsb2dzLnB1c2goLi4uaSA9PT0gMCA/IFtdIDogW2BcbmBdLCAuLi5mb3JtYXRUcmFjZUVudHJ5KGVudHJ5KSk7XG4gIH0pO1xuICByZXR1cm4gbG9ncztcbn1cbmZ1bmN0aW9uIGZvcm1hdFRyYWNlRW50cnkoeyB2bm9kZSwgcmVjdXJzZUNvdW50IH0pIHtcbiAgY29uc3QgcG9zdGZpeCA9IHJlY3Vyc2VDb3VudCA+IDAgPyBgLi4uICgke3JlY3Vyc2VDb3VudH0gcmVjdXJzaXZlIGNhbGxzKWAgOiBgYDtcbiAgY29uc3QgaXNSb290ID0gdm5vZGUuY29tcG9uZW50ID8gdm5vZGUuY29tcG9uZW50LnBhcmVudCA9PSBudWxsIDogZmFsc2U7XG4gIGNvbnN0IG9wZW4gPSBgIGF0IDwke2Zvcm1hdENvbXBvbmVudE5hbWUoXG4gICAgdm5vZGUuY29tcG9uZW50LFxuICAgIHZub2RlLnR5cGUsXG4gICAgaXNSb290XG4gICl9YDtcbiAgY29uc3QgY2xvc2UgPSBgPmAgKyBwb3N0Zml4O1xuICByZXR1cm4gdm5vZGUucHJvcHMgPyBbb3BlbiwgLi4uZm9ybWF0UHJvcHModm5vZGUucHJvcHMpLCBjbG9zZV0gOiBbb3BlbiArIGNsb3NlXTtcbn1cbmZ1bmN0aW9uIGZvcm1hdFByb3BzKHByb3BzKSB7XG4gIGNvbnN0IHJlcyA9IFtdO1xuICBjb25zdCBrZXlzID0gT2JqZWN0LmtleXMocHJvcHMpO1xuICBrZXlzLnNsaWNlKDAsIDMpLmZvckVhY2goKGtleSkgPT4ge1xuICAgIHJlcy5wdXNoKC4uLmZvcm1hdFByb3Aoa2V5LCBwcm9wc1trZXldKSk7XG4gIH0pO1xuICBpZiAoa2V5cy5sZW5ndGggPiAzKSB7XG4gICAgcmVzLnB1c2goYCAuLi5gKTtcbiAgfVxuICByZXR1cm4gcmVzO1xufVxuZnVuY3Rpb24gZm9ybWF0UHJvcChrZXksIHZhbHVlLCByYXcpIHtcbiAgaWYgKGlzU3RyaW5nKHZhbHVlKSkge1xuICAgIHZhbHVlID0gSlNPTi5zdHJpbmdpZnkodmFsdWUpO1xuICAgIHJldHVybiByYXcgPyB2YWx1ZSA6IFtgJHtrZXl9PSR7dmFsdWV9YF07XG4gIH0gZWxzZSBpZiAodHlwZW9mIHZhbHVlID09PSBcIm51bWJlclwiIHx8IHR5cGVvZiB2YWx1ZSA9PT0gXCJib29sZWFuXCIgfHwgdmFsdWUgPT0gbnVsbCkge1xuICAgIHJldHVybiByYXcgPyB2YWx1ZSA6IFtgJHtrZXl9PSR7dmFsdWV9YF07XG4gIH0gZWxzZSBpZiAoaXNSZWYodmFsdWUpKSB7XG4gICAgdmFsdWUgPSBmb3JtYXRQcm9wKGtleSwgdG9SYXcodmFsdWUudmFsdWUpLCB0cnVlKTtcbiAgICByZXR1cm4gcmF3ID8gdmFsdWUgOiBbYCR7a2V5fT1SZWY8YCwgdmFsdWUsIGA+YF07XG4gIH0gZWxzZSBpZiAoaXNGdW5jdGlvbih2YWx1ZSkpIHtcbiAgICByZXR1cm4gW2Ake2tleX09Zm4ke3ZhbHVlLm5hbWUgPyBgPCR7dmFsdWUubmFtZX0+YCA6IGBgfWBdO1xuICB9IGVsc2Uge1xuICAgIHZhbHVlID0gdG9SYXcodmFsdWUpO1xuICAgIHJldHVybiByYXcgPyB2YWx1ZSA6IFtgJHtrZXl9PWAsIHZhbHVlXTtcbiAgfVxufVxuZnVuY3Rpb24gYXNzZXJ0TnVtYmVyKHZhbCwgdHlwZSkge1xuICBpZiAoISEhKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSBcInByb2R1Y3Rpb25cIikpIHJldHVybjtcbiAgaWYgKHZhbCA9PT0gdm9pZCAwKSB7XG4gICAgcmV0dXJuO1xuICB9IGVsc2UgaWYgKHR5cGVvZiB2YWwgIT09IFwibnVtYmVyXCIpIHtcbiAgICB3YXJuJDEoYCR7dHlwZX0gaXMgbm90IGEgdmFsaWQgbnVtYmVyIC0gZ290ICR7SlNPTi5zdHJpbmdpZnkodmFsKX0uYCk7XG4gIH0gZWxzZSBpZiAoaXNOYU4odmFsKSkge1xuICAgIHdhcm4kMShgJHt0eXBlfSBpcyBOYU4gLSB0aGUgZHVyYXRpb24gZXhwcmVzc2lvbiBtaWdodCBiZSBpbmNvcnJlY3QuYCk7XG4gIH1cbn1cblxuY29uc3QgRXJyb3JDb2RlcyA9IHtcbiAgXCJTRVRVUF9GVU5DVElPTlwiOiAwLFxuICBcIjBcIjogXCJTRVRVUF9GVU5DVElPTlwiLFxuICBcIlJFTkRFUl9GVU5DVElPTlwiOiAxLFxuICBcIjFcIjogXCJSRU5ERVJfRlVOQ1RJT05cIixcbiAgXCJOQVRJVkVfRVZFTlRfSEFORExFUlwiOiA1LFxuICBcIjVcIjogXCJOQVRJVkVfRVZFTlRfSEFORExFUlwiLFxuICBcIkNPTVBPTkVOVF9FVkVOVF9IQU5ETEVSXCI6IDYsXG4gIFwiNlwiOiBcIkNPTVBPTkVOVF9FVkVOVF9IQU5ETEVSXCIsXG4gIFwiVk5PREVfSE9PS1wiOiA3LFxuICBcIjdcIjogXCJWTk9ERV9IT09LXCIsXG4gIFwiRElSRUNUSVZFX0hPT0tcIjogOCxcbiAgXCI4XCI6IFwiRElSRUNUSVZFX0hPT0tcIixcbiAgXCJUUkFOU0lUSU9OX0hPT0tcIjogOSxcbiAgXCI5XCI6IFwiVFJBTlNJVElPTl9IT09LXCIsXG4gIFwiQVBQX0VSUk9SX0hBTkRMRVJcIjogMTAsXG4gIFwiMTBcIjogXCJBUFBfRVJST1JfSEFORExFUlwiLFxuICBcIkFQUF9XQVJOX0hBTkRMRVJcIjogMTEsXG4gIFwiMTFcIjogXCJBUFBfV0FSTl9IQU5ETEVSXCIsXG4gIFwiRlVOQ1RJT05fUkVGXCI6IDEyLFxuICBcIjEyXCI6IFwiRlVOQ1RJT05fUkVGXCIsXG4gIFwiQVNZTkNfQ09NUE9ORU5UX0xPQURFUlwiOiAxMyxcbiAgXCIxM1wiOiBcIkFTWU5DX0NPTVBPTkVOVF9MT0FERVJcIixcbiAgXCJTQ0hFRFVMRVJcIjogMTQsXG4gIFwiMTRcIjogXCJTQ0hFRFVMRVJcIixcbiAgXCJDT01QT05FTlRfVVBEQVRFXCI6IDE1LFxuICBcIjE1XCI6IFwiQ09NUE9ORU5UX1VQREFURVwiLFxuICBcIkFQUF9VTk1PVU5UX0NMRUFOVVBcIjogMTYsXG4gIFwiMTZcIjogXCJBUFBfVU5NT1VOVF9DTEVBTlVQXCJcbn07XG5jb25zdCBFcnJvclR5cGVTdHJpbmdzJDEgPSB7XG4gIFtcInNwXCJdOiBcInNlcnZlclByZWZldGNoIGhvb2tcIixcbiAgW1wiYmNcIl06IFwiYmVmb3JlQ3JlYXRlIGhvb2tcIixcbiAgW1wiY1wiXTogXCJjcmVhdGVkIGhvb2tcIixcbiAgW1wiYm1cIl06IFwiYmVmb3JlTW91bnQgaG9va1wiLFxuICBbXCJtXCJdOiBcIm1vdW50ZWQgaG9va1wiLFxuICBbXCJidVwiXTogXCJiZWZvcmVVcGRhdGUgaG9va1wiLFxuICBbXCJ1XCJdOiBcInVwZGF0ZWRcIixcbiAgW1wiYnVtXCJdOiBcImJlZm9yZVVubW91bnQgaG9va1wiLFxuICBbXCJ1bVwiXTogXCJ1bm1vdW50ZWQgaG9va1wiLFxuICBbXCJhXCJdOiBcImFjdGl2YXRlZCBob29rXCIsXG4gIFtcImRhXCJdOiBcImRlYWN0aXZhdGVkIGhvb2tcIixcbiAgW1wiZWNcIl06IFwiZXJyb3JDYXB0dXJlZCBob29rXCIsXG4gIFtcInJ0Y1wiXTogXCJyZW5kZXJUcmFja2VkIGhvb2tcIixcbiAgW1wicnRnXCJdOiBcInJlbmRlclRyaWdnZXJlZCBob29rXCIsXG4gIFswXTogXCJzZXR1cCBmdW5jdGlvblwiLFxuICBbMV06IFwicmVuZGVyIGZ1bmN0aW9uXCIsXG4gIFsyXTogXCJ3YXRjaGVyIGdldHRlclwiLFxuICBbM106IFwid2F0Y2hlciBjYWxsYmFja1wiLFxuICBbNF06IFwid2F0Y2hlciBjbGVhbnVwIGZ1bmN0aW9uXCIsXG4gIFs1XTogXCJuYXRpdmUgZXZlbnQgaGFuZGxlclwiLFxuICBbNl06IFwiY29tcG9uZW50IGV2ZW50IGhhbmRsZXJcIixcbiAgWzddOiBcInZub2RlIGhvb2tcIixcbiAgWzhdOiBcImRpcmVjdGl2ZSBob29rXCIsXG4gIFs5XTogXCJ0cmFuc2l0aW9uIGhvb2tcIixcbiAgWzEwXTogXCJhcHAgZXJyb3JIYW5kbGVyXCIsXG4gIFsxMV06IFwiYXBwIHdhcm5IYW5kbGVyXCIsXG4gIFsxMl06IFwicmVmIGZ1bmN0aW9uXCIsXG4gIFsxM106IFwiYXN5bmMgY29tcG9uZW50IGxvYWRlclwiLFxuICBbMTRdOiBcInNjaGVkdWxlciBmbHVzaFwiLFxuICBbMTVdOiBcImNvbXBvbmVudCB1cGRhdGVcIixcbiAgWzE2XTogXCJhcHAgdW5tb3VudCBjbGVhbnVwIGZ1bmN0aW9uXCJcbn07XG5mdW5jdGlvbiBjYWxsV2l0aEVycm9ySGFuZGxpbmcoZm4sIGluc3RhbmNlLCB0eXBlLCBhcmdzKSB7XG4gIHRyeSB7XG4gICAgcmV0dXJuIGFyZ3MgPyBmbiguLi5hcmdzKSA6IGZuKCk7XG4gIH0gY2F0Y2ggKGVycikge1xuICAgIGhhbmRsZUVycm9yKGVyciwgaW5zdGFuY2UsIHR5cGUpO1xuICB9XG59XG5mdW5jdGlvbiBjYWxsV2l0aEFzeW5jRXJyb3JIYW5kbGluZyhmbiwgaW5zdGFuY2UsIHR5cGUsIGFyZ3MpIHtcbiAgaWYgKGlzRnVuY3Rpb24oZm4pKSB7XG4gICAgY29uc3QgcmVzID0gY2FsbFdpdGhFcnJvckhhbmRsaW5nKGZuLCBpbnN0YW5jZSwgdHlwZSwgYXJncyk7XG4gICAgaWYgKHJlcyAmJiBpc1Byb21pc2UocmVzKSkge1xuICAgICAgcmVzLmNhdGNoKChlcnIpID0+IHtcbiAgICAgICAgaGFuZGxlRXJyb3IoZXJyLCBpbnN0YW5jZSwgdHlwZSk7XG4gICAgICB9KTtcbiAgICB9XG4gICAgcmV0dXJuIHJlcztcbiAgfVxuICBpZiAoaXNBcnJheShmbikpIHtcbiAgICBjb25zdCB2YWx1ZXMgPSBbXTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGZuLmxlbmd0aDsgaSsrKSB7XG4gICAgICB2YWx1ZXMucHVzaChjYWxsV2l0aEFzeW5jRXJyb3JIYW5kbGluZyhmbltpXSwgaW5zdGFuY2UsIHR5cGUsIGFyZ3MpKTtcbiAgICB9XG4gICAgcmV0dXJuIHZhbHVlcztcbiAgfSBlbHNlIGlmICghIShwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gXCJwcm9kdWN0aW9uXCIpKSB7XG4gICAgd2FybiQxKFxuICAgICAgYEludmFsaWQgdmFsdWUgdHlwZSBwYXNzZWQgdG8gY2FsbFdpdGhBc3luY0Vycm9ySGFuZGxpbmcoKTogJHt0eXBlb2YgZm59YFxuICAgICk7XG4gIH1cbn1cbmZ1bmN0aW9uIGhhbmRsZUVycm9yKGVyciwgaW5zdGFuY2UsIHR5cGUsIHRocm93SW5EZXYgPSB0cnVlKSB7XG4gIGNvbnN0IGNvbnRleHRWTm9kZSA9IGluc3RhbmNlID8gaW5zdGFuY2Uudm5vZGUgOiBudWxsO1xuICBjb25zdCB7IGVycm9ySGFuZGxlciwgdGhyb3dVbmhhbmRsZWRFcnJvckluUHJvZHVjdGlvbiB9ID0gaW5zdGFuY2UgJiYgaW5zdGFuY2UuYXBwQ29udGV4dC5jb25maWcgfHwgRU1QVFlfT0JKO1xuICBpZiAoaW5zdGFuY2UpIHtcbiAgICBsZXQgY3VyID0gaW5zdGFuY2UucGFyZW50O1xuICAgIGNvbnN0IGV4cG9zZWRJbnN0YW5jZSA9IGluc3RhbmNlLnByb3h5O1xuICAgIGNvbnN0IGVycm9ySW5mbyA9ICEhKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSBcInByb2R1Y3Rpb25cIikgPyBFcnJvclR5cGVTdHJpbmdzJDFbdHlwZV0gOiBgaHR0cHM6Ly92dWVqcy5vcmcvZXJyb3ItcmVmZXJlbmNlLyNydW50aW1lLSR7dHlwZX1gO1xuICAgIHdoaWxlIChjdXIpIHtcbiAgICAgIGNvbnN0IGVycm9yQ2FwdHVyZWRIb29rcyA9IGN1ci5lYztcbiAgICAgIGlmIChlcnJvckNhcHR1cmVkSG9va3MpIHtcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBlcnJvckNhcHR1cmVkSG9va3MubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICBpZiAoZXJyb3JDYXB0dXJlZEhvb2tzW2ldKGVyciwgZXhwb3NlZEluc3RhbmNlLCBlcnJvckluZm8pID09PSBmYWxzZSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgY3VyID0gY3VyLnBhcmVudDtcbiAgICB9XG4gICAgaWYgKGVycm9ySGFuZGxlcikge1xuICAgICAgcGF1c2VUcmFja2luZygpO1xuICAgICAgY2FsbFdpdGhFcnJvckhhbmRsaW5nKGVycm9ySGFuZGxlciwgbnVsbCwgMTAsIFtcbiAgICAgICAgZXJyLFxuICAgICAgICBleHBvc2VkSW5zdGFuY2UsXG4gICAgICAgIGVycm9ySW5mb1xuICAgICAgXSk7XG4gICAgICByZXNldFRyYWNraW5nKCk7XG4gICAgICByZXR1cm47XG4gICAgfVxuICB9XG4gIGxvZ0Vycm9yKGVyciwgdHlwZSwgY29udGV4dFZOb2RlLCB0aHJvd0luRGV2LCB0aHJvd1VuaGFuZGxlZEVycm9ySW5Qcm9kdWN0aW9uKTtcbn1cbmZ1bmN0aW9uIGxvZ0Vycm9yKGVyciwgdHlwZSwgY29udGV4dFZOb2RlLCB0aHJvd0luRGV2ID0gdHJ1ZSwgdGhyb3dJblByb2QgPSBmYWxzZSkge1xuICBpZiAoISEocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09IFwicHJvZHVjdGlvblwiKSkge1xuICAgIGNvbnN0IGluZm8gPSBFcnJvclR5cGVTdHJpbmdzJDFbdHlwZV07XG4gICAgaWYgKGNvbnRleHRWTm9kZSkge1xuICAgICAgcHVzaFdhcm5pbmdDb250ZXh0KGNvbnRleHRWTm9kZSk7XG4gICAgfVxuICAgIHdhcm4kMShgVW5oYW5kbGVkIGVycm9yJHtpbmZvID8gYCBkdXJpbmcgZXhlY3V0aW9uIG9mICR7aW5mb31gIDogYGB9YCk7XG4gICAgaWYgKGNvbnRleHRWTm9kZSkge1xuICAgICAgcG9wV2FybmluZ0NvbnRleHQoKTtcbiAgICB9XG4gICAgaWYgKHRocm93SW5EZXYpIHtcbiAgICAgIHRocm93IGVycjtcbiAgICB9IGVsc2Uge1xuICAgICAgY29uc29sZS5lcnJvcihlcnIpO1xuICAgIH1cbiAgfSBlbHNlIGlmICh0aHJvd0luUHJvZCkge1xuICAgIHRocm93IGVycjtcbiAgfSBlbHNlIHtcbiAgICBjb25zb2xlLmVycm9yKGVycik7XG4gIH1cbn1cblxuY29uc3QgcXVldWUgPSBbXTtcbmxldCBmbHVzaEluZGV4ID0gLTE7XG5jb25zdCBwZW5kaW5nUG9zdEZsdXNoQ2JzID0gW107XG5sZXQgYWN0aXZlUG9zdEZsdXNoQ2JzID0gbnVsbDtcbmxldCBwb3N0Rmx1c2hJbmRleCA9IDA7XG5jb25zdCByZXNvbHZlZFByb21pc2UgPSAvKiBAX19QVVJFX18gKi8gUHJvbWlzZS5yZXNvbHZlKCk7XG5sZXQgY3VycmVudEZsdXNoUHJvbWlzZSA9IG51bGw7XG5jb25zdCBSRUNVUlNJT05fTElNSVQgPSAxMDA7XG5mdW5jdGlvbiBuZXh0VGljayhmbikge1xuICBjb25zdCBwID0gY3VycmVudEZsdXNoUHJvbWlzZSB8fCByZXNvbHZlZFByb21pc2U7XG4gIHJldHVybiBmbiA/IHAudGhlbih0aGlzID8gZm4uYmluZCh0aGlzKSA6IGZuKSA6IHA7XG59XG5mdW5jdGlvbiBmaW5kSW5zZXJ0aW9uSW5kZXgoaWQpIHtcbiAgbGV0IHN0YXJ0ID0gZmx1c2hJbmRleCArIDE7XG4gIGxldCBlbmQgPSBxdWV1ZS5sZW5ndGg7XG4gIHdoaWxlIChzdGFydCA8IGVuZCkge1xuICAgIGNvbnN0IG1pZGRsZSA9IHN0YXJ0ICsgZW5kID4+PiAxO1xuICAgIGNvbnN0IG1pZGRsZUpvYiA9IHF1ZXVlW21pZGRsZV07XG4gICAgY29uc3QgbWlkZGxlSm9iSWQgPSBnZXRJZChtaWRkbGVKb2IpO1xuICAgIGlmIChtaWRkbGVKb2JJZCA8IGlkIHx8IG1pZGRsZUpvYklkID09PSBpZCAmJiBtaWRkbGVKb2IuZmxhZ3MgJiAyKSB7XG4gICAgICBzdGFydCA9IG1pZGRsZSArIDE7XG4gICAgfSBlbHNlIHtcbiAgICAgIGVuZCA9IG1pZGRsZTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHN0YXJ0O1xufVxuZnVuY3Rpb24gcXVldWVKb2Ioam9iKSB7XG4gIGlmICghKGpvYi5mbGFncyAmIDEpKSB7XG4gICAgY29uc3Qgam9iSWQgPSBnZXRJZChqb2IpO1xuICAgIGNvbnN0IGxhc3RKb2IgPSBxdWV1ZVtxdWV1ZS5sZW5ndGggLSAxXTtcbiAgICBpZiAoIWxhc3RKb2IgfHwgLy8gZmFzdCBwYXRoIHdoZW4gdGhlIGpvYiBpZCBpcyBsYXJnZXIgdGhhbiB0aGUgdGFpbFxuICAgICEoam9iLmZsYWdzICYgMikgJiYgam9iSWQgPj0gZ2V0SWQobGFzdEpvYikpIHtcbiAgICAgIHF1ZXVlLnB1c2goam9iKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcXVldWUuc3BsaWNlKGZpbmRJbnNlcnRpb25JbmRleChqb2JJZCksIDAsIGpvYik7XG4gICAgfVxuICAgIGpvYi5mbGFncyB8PSAxO1xuICAgIHF1ZXVlRmx1c2goKTtcbiAgfVxufVxuZnVuY3Rpb24gcXVldWVGbHVzaCgpIHtcbiAgaWYgKCFjdXJyZW50Rmx1c2hQcm9taXNlKSB7XG4gICAgY3VycmVudEZsdXNoUHJvbWlzZSA9IHJlc29sdmVkUHJvbWlzZS50aGVuKGZsdXNoSm9icyk7XG4gIH1cbn1cbmZ1bmN0aW9uIHF1ZXVlUG9zdEZsdXNoQ2IoY2IpIHtcbiAgaWYgKCFpc0FycmF5KGNiKSkge1xuICAgIGlmIChhY3RpdmVQb3N0Rmx1c2hDYnMgJiYgY2IuaWQgPT09IC0xKSB7XG4gICAgICBhY3RpdmVQb3N0Rmx1c2hDYnMuc3BsaWNlKHBvc3RGbHVzaEluZGV4ICsgMSwgMCwgY2IpO1xuICAgIH0gZWxzZSBpZiAoIShjYi5mbGFncyAmIDEpKSB7XG4gICAgICBwZW5kaW5nUG9zdEZsdXNoQ2JzLnB1c2goY2IpO1xuICAgICAgY2IuZmxhZ3MgfD0gMTtcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgcGVuZGluZ1Bvc3RGbHVzaENicy5wdXNoKC4uLmNiKTtcbiAgfVxuICBxdWV1ZUZsdXNoKCk7XG59XG5mdW5jdGlvbiBmbHVzaFByZUZsdXNoQ2JzKGluc3RhbmNlLCBzZWVuLCBpID0gZmx1c2hJbmRleCArIDEpIHtcbiAgaWYgKCEhKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSBcInByb2R1Y3Rpb25cIikpIHtcbiAgICBzZWVuID0gc2VlbiB8fCAvKiBAX19QVVJFX18gKi8gbmV3IE1hcCgpO1xuICB9XG4gIGZvciAoOyBpIDwgcXVldWUubGVuZ3RoOyBpKyspIHtcbiAgICBjb25zdCBjYiA9IHF1ZXVlW2ldO1xuICAgIGlmIChjYiAmJiBjYi5mbGFncyAmIDIpIHtcbiAgICAgIGlmIChpbnN0YW5jZSAmJiBjYi5pZCAhPT0gaW5zdGFuY2UudWlkKSB7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuICAgICAgaWYgKCEhKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSBcInByb2R1Y3Rpb25cIikgJiYgY2hlY2tSZWN1cnNpdmVVcGRhdGVzKHNlZW4sIGNiKSkge1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cbiAgICAgIHF1ZXVlLnNwbGljZShpLCAxKTtcbiAgICAgIGktLTtcbiAgICAgIGlmIChjYi5mbGFncyAmIDQpIHtcbiAgICAgICAgY2IuZmxhZ3MgJj0gLTI7XG4gICAgICB9XG4gICAgICBjYigpO1xuICAgICAgaWYgKCEoY2IuZmxhZ3MgJiA0KSkge1xuICAgICAgICBjYi5mbGFncyAmPSAtMjtcbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cbmZ1bmN0aW9uIGZsdXNoUG9zdEZsdXNoQ2JzKHNlZW4pIHtcbiAgaWYgKHBlbmRpbmdQb3N0Rmx1c2hDYnMubGVuZ3RoKSB7XG4gICAgY29uc3QgZGVkdXBlZCA9IFsuLi5uZXcgU2V0KHBlbmRpbmdQb3N0Rmx1c2hDYnMpXS5zb3J0KFxuICAgICAgKGEsIGIpID0+IGdldElkKGEpIC0gZ2V0SWQoYilcbiAgICApO1xuICAgIHBlbmRpbmdQb3N0Rmx1c2hDYnMubGVuZ3RoID0gMDtcbiAgICBpZiAoYWN0aXZlUG9zdEZsdXNoQ2JzKSB7XG4gICAgICBhY3RpdmVQb3N0Rmx1c2hDYnMucHVzaCguLi5kZWR1cGVkKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgYWN0aXZlUG9zdEZsdXNoQ2JzID0gZGVkdXBlZDtcbiAgICBpZiAoISEocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09IFwicHJvZHVjdGlvblwiKSkge1xuICAgICAgc2VlbiA9IHNlZW4gfHwgLyogQF9fUFVSRV9fICovIG5ldyBNYXAoKTtcbiAgICB9XG4gICAgZm9yIChwb3N0Rmx1c2hJbmRleCA9IDA7IHBvc3RGbHVzaEluZGV4IDwgYWN0aXZlUG9zdEZsdXNoQ2JzLmxlbmd0aDsgcG9zdEZsdXNoSW5kZXgrKykge1xuICAgICAgY29uc3QgY2IgPSBhY3RpdmVQb3N0Rmx1c2hDYnNbcG9zdEZsdXNoSW5kZXhdO1xuICAgICAgaWYgKCEhKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSBcInByb2R1Y3Rpb25cIikgJiYgY2hlY2tSZWN1cnNpdmVVcGRhdGVzKHNlZW4sIGNiKSkge1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cbiAgICAgIGlmIChjYi5mbGFncyAmIDQpIHtcbiAgICAgICAgY2IuZmxhZ3MgJj0gLTI7XG4gICAgICB9XG4gICAgICBpZiAoIShjYi5mbGFncyAmIDgpKSBjYigpO1xuICAgICAgY2IuZmxhZ3MgJj0gLTI7XG4gICAgfVxuICAgIGFjdGl2ZVBvc3RGbHVzaENicyA9IG51bGw7XG4gICAgcG9zdEZsdXNoSW5kZXggPSAwO1xuICB9XG59XG5jb25zdCBnZXRJZCA9IChqb2IpID0+IGpvYi5pZCA9PSBudWxsID8gam9iLmZsYWdzICYgMiA/IC0xIDogSW5maW5pdHkgOiBqb2IuaWQ7XG5mdW5jdGlvbiBmbHVzaEpvYnMoc2Vlbikge1xuICBpZiAoISEocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09IFwicHJvZHVjdGlvblwiKSkge1xuICAgIHNlZW4gPSBzZWVuIHx8IC8qIEBfX1BVUkVfXyAqLyBuZXcgTWFwKCk7XG4gIH1cbiAgY29uc3QgY2hlY2sgPSAhIShwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gXCJwcm9kdWN0aW9uXCIpID8gKGpvYikgPT4gY2hlY2tSZWN1cnNpdmVVcGRhdGVzKHNlZW4sIGpvYikgOiBOT09QO1xuICB0cnkge1xuICAgIGZvciAoZmx1c2hJbmRleCA9IDA7IGZsdXNoSW5kZXggPCBxdWV1ZS5sZW5ndGg7IGZsdXNoSW5kZXgrKykge1xuICAgICAgY29uc3Qgam9iID0gcXVldWVbZmx1c2hJbmRleF07XG4gICAgICBpZiAoam9iICYmICEoam9iLmZsYWdzICYgOCkpIHtcbiAgICAgICAgaWYgKCEhKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSBcInByb2R1Y3Rpb25cIikgJiYgY2hlY2soam9iKSkge1xuICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG4gICAgICAgIGlmIChqb2IuZmxhZ3MgJiA0KSB7XG4gICAgICAgICAgam9iLmZsYWdzICY9IH4xO1xuICAgICAgICB9XG4gICAgICAgIGNhbGxXaXRoRXJyb3JIYW5kbGluZyhcbiAgICAgICAgICBqb2IsXG4gICAgICAgICAgam9iLmksXG4gICAgICAgICAgam9iLmkgPyAxNSA6IDE0XG4gICAgICAgICk7XG4gICAgICAgIGlmICghKGpvYi5mbGFncyAmIDQpKSB7XG4gICAgICAgICAgam9iLmZsYWdzICY9IH4xO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9IGZpbmFsbHkge1xuICAgIGZvciAoOyBmbHVzaEluZGV4IDwgcXVldWUubGVuZ3RoOyBmbHVzaEluZGV4KyspIHtcbiAgICAgIGNvbnN0IGpvYiA9IHF1ZXVlW2ZsdXNoSW5kZXhdO1xuICAgICAgaWYgKGpvYikge1xuICAgICAgICBqb2IuZmxhZ3MgJj0gLTI7XG4gICAgICB9XG4gICAgfVxuICAgIGZsdXNoSW5kZXggPSAtMTtcbiAgICBxdWV1ZS5sZW5ndGggPSAwO1xuICAgIGZsdXNoUG9zdEZsdXNoQ2JzKHNlZW4pO1xuICAgIGN1cnJlbnRGbHVzaFByb21pc2UgPSBudWxsO1xuICAgIGlmIChxdWV1ZS5sZW5ndGggfHwgcGVuZGluZ1Bvc3RGbHVzaENicy5sZW5ndGgpIHtcbiAgICAgIGZsdXNoSm9icyhzZWVuKTtcbiAgICB9XG4gIH1cbn1cbmZ1bmN0aW9uIGNoZWNrUmVjdXJzaXZlVXBkYXRlcyhzZWVuLCBmbikge1xuICBjb25zdCBjb3VudCA9IHNlZW4uZ2V0KGZuKSB8fCAwO1xuICBpZiAoY291bnQgPiBSRUNVUlNJT05fTElNSVQpIHtcbiAgICBjb25zdCBpbnN0YW5jZSA9IGZuLmk7XG4gICAgY29uc3QgY29tcG9uZW50TmFtZSA9IGluc3RhbmNlICYmIGdldENvbXBvbmVudE5hbWUoaW5zdGFuY2UudHlwZSk7XG4gICAgaGFuZGxlRXJyb3IoXG4gICAgICBgTWF4aW11bSByZWN1cnNpdmUgdXBkYXRlcyBleGNlZWRlZCR7Y29tcG9uZW50TmFtZSA/IGAgaW4gY29tcG9uZW50IDwke2NvbXBvbmVudE5hbWV9PmAgOiBgYH0uIFRoaXMgbWVhbnMgeW91IGhhdmUgYSByZWFjdGl2ZSBlZmZlY3QgdGhhdCBpcyBtdXRhdGluZyBpdHMgb3duIGRlcGVuZGVuY2llcyBhbmQgdGh1cyByZWN1cnNpdmVseSB0cmlnZ2VyaW5nIGl0c2VsZi4gUG9zc2libGUgc291cmNlcyBpbmNsdWRlIGNvbXBvbmVudCB0ZW1wbGF0ZSwgcmVuZGVyIGZ1bmN0aW9uLCB1cGRhdGVkIGhvb2sgb3Igd2F0Y2hlciBzb3VyY2UgZnVuY3Rpb24uYCxcbiAgICAgIG51bGwsXG4gICAgICAxMFxuICAgICk7XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cbiAgc2Vlbi5zZXQoZm4sIGNvdW50ICsgMSk7XG4gIHJldHVybiBmYWxzZTtcbn1cblxubGV0IGlzSG1yVXBkYXRpbmcgPSBmYWxzZTtcbmNvbnN0IGhtckRpcnR5Q29tcG9uZW50cyA9IC8qIEBfX1BVUkVfXyAqLyBuZXcgTWFwKCk7XG5pZiAoISEocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09IFwicHJvZHVjdGlvblwiKSkge1xuICBnZXRHbG9iYWxUaGlzKCkuX19WVUVfSE1SX1JVTlRJTUVfXyA9IHtcbiAgICBjcmVhdGVSZWNvcmQ6IHRyeVdyYXAoY3JlYXRlUmVjb3JkKSxcbiAgICByZXJlbmRlcjogdHJ5V3JhcChyZXJlbmRlciksXG4gICAgcmVsb2FkOiB0cnlXcmFwKHJlbG9hZClcbiAgfTtcbn1cbmNvbnN0IG1hcCA9IC8qIEBfX1BVUkVfXyAqLyBuZXcgTWFwKCk7XG5mdW5jdGlvbiByZWdpc3RlckhNUihpbnN0YW5jZSkge1xuICBjb25zdCBpZCA9IGluc3RhbmNlLnR5cGUuX19obXJJZDtcbiAgbGV0IHJlY29yZCA9IG1hcC5nZXQoaWQpO1xuICBpZiAoIXJlY29yZCkge1xuICAgIGNyZWF0ZVJlY29yZChpZCwgaW5zdGFuY2UudHlwZSk7XG4gICAgcmVjb3JkID0gbWFwLmdldChpZCk7XG4gIH1cbiAgcmVjb3JkLmluc3RhbmNlcy5hZGQoaW5zdGFuY2UpO1xufVxuZnVuY3Rpb24gdW5yZWdpc3RlckhNUihpbnN0YW5jZSkge1xuICBtYXAuZ2V0KGluc3RhbmNlLnR5cGUuX19obXJJZCkuaW5zdGFuY2VzLmRlbGV0ZShpbnN0YW5jZSk7XG59XG5mdW5jdGlvbiBjcmVhdGVSZWNvcmQoaWQsIGluaXRpYWxEZWYpIHtcbiAgaWYgKG1hcC5oYXMoaWQpKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG4gIG1hcC5zZXQoaWQsIHtcbiAgICBpbml0aWFsRGVmOiBub3JtYWxpemVDbGFzc0NvbXBvbmVudChpbml0aWFsRGVmKSxcbiAgICBpbnN0YW5jZXM6IC8qIEBfX1BVUkVfXyAqLyBuZXcgU2V0KClcbiAgfSk7XG4gIHJldHVybiB0cnVlO1xufVxuZnVuY3Rpb24gbm9ybWFsaXplQ2xhc3NDb21wb25lbnQoY29tcG9uZW50KSB7XG4gIHJldHVybiBpc0NsYXNzQ29tcG9uZW50KGNvbXBvbmVudCkgPyBjb21wb25lbnQuX192Y2NPcHRzIDogY29tcG9uZW50O1xufVxuZnVuY3Rpb24gcmVyZW5kZXIoaWQsIG5ld1JlbmRlcikge1xuICBjb25zdCByZWNvcmQgPSBtYXAuZ2V0KGlkKTtcbiAgaWYgKCFyZWNvcmQpIHtcbiAgICByZXR1cm47XG4gIH1cbiAgcmVjb3JkLmluaXRpYWxEZWYucmVuZGVyID0gbmV3UmVuZGVyO1xuICBbLi4ucmVjb3JkLmluc3RhbmNlc10uZm9yRWFjaCgoaW5zdGFuY2UpID0+IHtcbiAgICBpZiAobmV3UmVuZGVyKSB7XG4gICAgICBpbnN0YW5jZS5yZW5kZXIgPSBuZXdSZW5kZXI7XG4gICAgICBub3JtYWxpemVDbGFzc0NvbXBvbmVudChpbnN0YW5jZS50eXBlKS5yZW5kZXIgPSBuZXdSZW5kZXI7XG4gICAgfVxuICAgIGluc3RhbmNlLnJlbmRlckNhY2hlID0gW107XG4gICAgaXNIbXJVcGRhdGluZyA9IHRydWU7XG4gICAgaWYgKCEoaW5zdGFuY2Uuam9iLmZsYWdzICYgOCkpIHtcbiAgICAgIGluc3RhbmNlLnVwZGF0ZSgpO1xuICAgIH1cbiAgICBpc0htclVwZGF0aW5nID0gZmFsc2U7XG4gIH0pO1xufVxuZnVuY3Rpb24gcmVsb2FkKGlkLCBuZXdDb21wKSB7XG4gIGNvbnN0IHJlY29yZCA9IG1hcC5nZXQoaWQpO1xuICBpZiAoIXJlY29yZCkgcmV0dXJuO1xuICBuZXdDb21wID0gbm9ybWFsaXplQ2xhc3NDb21wb25lbnQobmV3Q29tcCk7XG4gIHVwZGF0ZUNvbXBvbmVudERlZihyZWNvcmQuaW5pdGlhbERlZiwgbmV3Q29tcCk7XG4gIGNvbnN0IGluc3RhbmNlcyA9IFsuLi5yZWNvcmQuaW5zdGFuY2VzXTtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBpbnN0YW5jZXMubGVuZ3RoOyBpKyspIHtcbiAgICBjb25zdCBpbnN0YW5jZSA9IGluc3RhbmNlc1tpXTtcbiAgICBjb25zdCBvbGRDb21wID0gbm9ybWFsaXplQ2xhc3NDb21wb25lbnQoaW5zdGFuY2UudHlwZSk7XG4gICAgbGV0IGRpcnR5SW5zdGFuY2VzID0gaG1yRGlydHlDb21wb25lbnRzLmdldChvbGRDb21wKTtcbiAgICBpZiAoIWRpcnR5SW5zdGFuY2VzKSB7XG4gICAgICBpZiAob2xkQ29tcCAhPT0gcmVjb3JkLmluaXRpYWxEZWYpIHtcbiAgICAgICAgdXBkYXRlQ29tcG9uZW50RGVmKG9sZENvbXAsIG5ld0NvbXApO1xuICAgICAgfVxuICAgICAgaG1yRGlydHlDb21wb25lbnRzLnNldChvbGRDb21wLCBkaXJ0eUluc3RhbmNlcyA9IC8qIEBfX1BVUkVfXyAqLyBuZXcgU2V0KCkpO1xuICAgIH1cbiAgICBkaXJ0eUluc3RhbmNlcy5hZGQoaW5zdGFuY2UpO1xuICAgIGluc3RhbmNlLmFwcENvbnRleHQucHJvcHNDYWNoZS5kZWxldGUoaW5zdGFuY2UudHlwZSk7XG4gICAgaW5zdGFuY2UuYXBwQ29udGV4dC5lbWl0c0NhY2hlLmRlbGV0ZShpbnN0YW5jZS50eXBlKTtcbiAgICBpbnN0YW5jZS5hcHBDb250ZXh0Lm9wdGlvbnNDYWNoZS5kZWxldGUoaW5zdGFuY2UudHlwZSk7XG4gICAgaWYgKGluc3RhbmNlLmNlUmVsb2FkKSB7XG4gICAgICBkaXJ0eUluc3RhbmNlcy5hZGQoaW5zdGFuY2UpO1xuICAgICAgaW5zdGFuY2UuY2VSZWxvYWQobmV3Q29tcC5zdHlsZXMpO1xuICAgICAgZGlydHlJbnN0YW5jZXMuZGVsZXRlKGluc3RhbmNlKTtcbiAgICB9IGVsc2UgaWYgKGluc3RhbmNlLnBhcmVudCkge1xuICAgICAgcXVldWVKb2IoKCkgPT4ge1xuICAgICAgICBpZiAoIShpbnN0YW5jZS5qb2IuZmxhZ3MgJiA4KSkge1xuICAgICAgICAgIGlzSG1yVXBkYXRpbmcgPSB0cnVlO1xuICAgICAgICAgIGluc3RhbmNlLnBhcmVudC51cGRhdGUoKTtcbiAgICAgICAgICBpc0htclVwZGF0aW5nID0gZmFsc2U7XG4gICAgICAgICAgZGlydHlJbnN0YW5jZXMuZGVsZXRlKGluc3RhbmNlKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfSBlbHNlIGlmIChpbnN0YW5jZS5hcHBDb250ZXh0LnJlbG9hZCkge1xuICAgICAgaW5zdGFuY2UuYXBwQ29udGV4dC5yZWxvYWQoKTtcbiAgICB9IGVsc2UgaWYgKHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgIHdpbmRvdy5sb2NhdGlvbi5yZWxvYWQoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgY29uc29sZS53YXJuKFxuICAgICAgICBcIltITVJdIFJvb3Qgb3IgbWFudWFsbHkgbW91bnRlZCBpbnN0YW5jZSBtb2RpZmllZC4gRnVsbCByZWxvYWQgcmVxdWlyZWQuXCJcbiAgICAgICk7XG4gICAgfVxuICAgIGlmIChpbnN0YW5jZS5yb290LmNlICYmIGluc3RhbmNlICE9PSBpbnN0YW5jZS5yb290KSB7XG4gICAgICBpbnN0YW5jZS5yb290LmNlLl9yZW1vdmVDaGlsZFN0eWxlKG9sZENvbXApO1xuICAgIH1cbiAgfVxuICBxdWV1ZVBvc3RGbHVzaENiKCgpID0+IHtcbiAgICBobXJEaXJ0eUNvbXBvbmVudHMuY2xlYXIoKTtcbiAgfSk7XG59XG5mdW5jdGlvbiB1cGRhdGVDb21wb25lbnREZWYob2xkQ29tcCwgbmV3Q29tcCkge1xuICBleHRlbmQob2xkQ29tcCwgbmV3Q29tcCk7XG4gIGZvciAoY29uc3Qga2V5IGluIG9sZENvbXApIHtcbiAgICBpZiAoa2V5ICE9PSBcIl9fZmlsZVwiICYmICEoa2V5IGluIG5ld0NvbXApKSB7XG4gICAgICBkZWxldGUgb2xkQ29tcFtrZXldO1xuICAgIH1cbiAgfVxufVxuZnVuY3Rpb24gdHJ5V3JhcChmbikge1xuICByZXR1cm4gKGlkLCBhcmcpID0+IHtcbiAgICB0cnkge1xuICAgICAgcmV0dXJuIGZuKGlkLCBhcmcpO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoZSk7XG4gICAgICBjb25zb2xlLndhcm4oXG4gICAgICAgIGBbSE1SXSBTb21ldGhpbmcgd2VudCB3cm9uZyBkdXJpbmcgVnVlIGNvbXBvbmVudCBob3QtcmVsb2FkLiBGdWxsIHJlbG9hZCByZXF1aXJlZC5gXG4gICAgICApO1xuICAgIH1cbiAgfTtcbn1cblxubGV0IGRldnRvb2xzJDE7XG5sZXQgYnVmZmVyID0gW107XG5sZXQgZGV2dG9vbHNOb3RJbnN0YWxsZWQgPSBmYWxzZTtcbmZ1bmN0aW9uIGVtaXQkMShldmVudCwgLi4uYXJncykge1xuICBpZiAoZGV2dG9vbHMkMSkge1xuICAgIGRldnRvb2xzJDEuZW1pdChldmVudCwgLi4uYXJncyk7XG4gIH0gZWxzZSBpZiAoIWRldnRvb2xzTm90SW5zdGFsbGVkKSB7XG4gICAgYnVmZmVyLnB1c2goeyBldmVudCwgYXJncyB9KTtcbiAgfVxufVxuZnVuY3Rpb24gc2V0RGV2dG9vbHNIb29rJDEoaG9vaywgdGFyZ2V0KSB7XG4gIHZhciBfYSwgX2I7XG4gIGRldnRvb2xzJDEgPSBob29rO1xuICBpZiAoZGV2dG9vbHMkMSkge1xuICAgIGRldnRvb2xzJDEuZW5hYmxlZCA9IHRydWU7XG4gICAgYnVmZmVyLmZvckVhY2goKHsgZXZlbnQsIGFyZ3MgfSkgPT4gZGV2dG9vbHMkMS5lbWl0KGV2ZW50LCAuLi5hcmdzKSk7XG4gICAgYnVmZmVyID0gW107XG4gIH0gZWxzZSBpZiAoXG4gICAgLy8gaGFuZGxlIGxhdGUgZGV2dG9vbHMgaW5qZWN0aW9uIC0gb25seSBkbyB0aGlzIGlmIHdlIGFyZSBpbiBhbiBhY3R1YWxcbiAgICAvLyBicm93c2VyIGVudmlyb25tZW50IHRvIGF2b2lkIHRoZSB0aW1lciBoYW5kbGUgc3RhbGxpbmcgdGVzdCBydW5uZXIgZXhpdFxuICAgIC8vICgjNDgxNSlcbiAgICB0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiICYmIC8vIHNvbWUgZW52cyBtb2NrIHdpbmRvdyBidXQgbm90IGZ1bGx5XG4gICAgd2luZG93LkhUTUxFbGVtZW50ICYmIC8vIGFsc28gZXhjbHVkZSBqc2RvbVxuICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby1yZXN0cmljdGVkLXN5bnRheFxuICAgICEoKF9iID0gKF9hID0gd2luZG93Lm5hdmlnYXRvcikgPT0gbnVsbCA/IHZvaWQgMCA6IF9hLnVzZXJBZ2VudCkgPT0gbnVsbCA/IHZvaWQgMCA6IF9iLmluY2x1ZGVzKFwianNkb21cIikpXG4gICkge1xuICAgIGNvbnN0IHJlcGxheSA9IHRhcmdldC5fX1ZVRV9ERVZUT09MU19IT09LX1JFUExBWV9fID0gdGFyZ2V0Ll9fVlVFX0RFVlRPT0xTX0hPT0tfUkVQTEFZX18gfHwgW107XG4gICAgcmVwbGF5LnB1c2goKG5ld0hvb2spID0+IHtcbiAgICAgIHNldERldnRvb2xzSG9vayQxKG5ld0hvb2ssIHRhcmdldCk7XG4gICAgfSk7XG4gICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICBpZiAoIWRldnRvb2xzJDEpIHtcbiAgICAgICAgdGFyZ2V0Ll9fVlVFX0RFVlRPT0xTX0hPT0tfUkVQTEFZX18gPSBudWxsO1xuICAgICAgICBkZXZ0b29sc05vdEluc3RhbGxlZCA9IHRydWU7XG4gICAgICAgIGJ1ZmZlciA9IFtdO1xuICAgICAgfVxuICAgIH0sIDNlMyk7XG4gIH0gZWxzZSB7XG4gICAgZGV2dG9vbHNOb3RJbnN0YWxsZWQgPSB0cnVlO1xuICAgIGJ1ZmZlciA9IFtdO1xuICB9XG59XG5mdW5jdGlvbiBkZXZ0b29sc0luaXRBcHAoYXBwLCB2ZXJzaW9uKSB7XG4gIGVtaXQkMShcImFwcDppbml0XCIgLyogQVBQX0lOSVQgKi8sIGFwcCwgdmVyc2lvbiwge1xuICAgIEZyYWdtZW50LFxuICAgIFRleHQsXG4gICAgQ29tbWVudCxcbiAgICBTdGF0aWNcbiAgfSk7XG59XG5mdW5jdGlvbiBkZXZ0b29sc1VubW91bnRBcHAoYXBwKSB7XG4gIGVtaXQkMShcImFwcDp1bm1vdW50XCIgLyogQVBQX1VOTU9VTlQgKi8sIGFwcCk7XG59XG5jb25zdCBkZXZ0b29sc0NvbXBvbmVudEFkZGVkID0gLyogQF9fUFVSRV9fICovIGNyZWF0ZURldnRvb2xzQ29tcG9uZW50SG9vayhcImNvbXBvbmVudDphZGRlZFwiIC8qIENPTVBPTkVOVF9BRERFRCAqLyk7XG5jb25zdCBkZXZ0b29sc0NvbXBvbmVudFVwZGF0ZWQgPSAvKiBAX19QVVJFX18gKi8gY3JlYXRlRGV2dG9vbHNDb21wb25lbnRIb29rKFwiY29tcG9uZW50OnVwZGF0ZWRcIiAvKiBDT01QT05FTlRfVVBEQVRFRCAqLyk7XG5jb25zdCBfZGV2dG9vbHNDb21wb25lbnRSZW1vdmVkID0gLyogQF9fUFVSRV9fICovIGNyZWF0ZURldnRvb2xzQ29tcG9uZW50SG9vayhcbiAgXCJjb21wb25lbnQ6cmVtb3ZlZFwiIC8qIENPTVBPTkVOVF9SRU1PVkVEICovXG4pO1xuY29uc3QgZGV2dG9vbHNDb21wb25lbnRSZW1vdmVkID0gKGNvbXBvbmVudCkgPT4ge1xuICBpZiAoZGV2dG9vbHMkMSAmJiB0eXBlb2YgZGV2dG9vbHMkMS5jbGVhbnVwQnVmZmVyID09PSBcImZ1bmN0aW9uXCIgJiYgLy8gcmVtb3ZlIHRoZSBjb21wb25lbnQgaWYgaXQgd2Fzbid0IGJ1ZmZlcmVkXG4gICFkZXZ0b29scyQxLmNsZWFudXBCdWZmZXIoY29tcG9uZW50KSkge1xuICAgIF9kZXZ0b29sc0NvbXBvbmVudFJlbW92ZWQoY29tcG9uZW50KTtcbiAgfVxufTtcbi8vIEBfX05PX1NJREVfRUZGRUNUU19fXG5mdW5jdGlvbiBjcmVhdGVEZXZ0b29sc0NvbXBvbmVudEhvb2soaG9vaykge1xuICByZXR1cm4gKGNvbXBvbmVudCkgPT4ge1xuICAgIGVtaXQkMShcbiAgICAgIGhvb2ssXG4gICAgICBjb21wb25lbnQuYXBwQ29udGV4dC5hcHAsXG4gICAgICBjb21wb25lbnQudWlkLFxuICAgICAgY29tcG9uZW50LnBhcmVudCA/IGNvbXBvbmVudC5wYXJlbnQudWlkIDogdm9pZCAwLFxuICAgICAgY29tcG9uZW50XG4gICAgKTtcbiAgfTtcbn1cbmNvbnN0IGRldnRvb2xzUGVyZlN0YXJ0ID0gLyogQF9fUFVSRV9fICovIGNyZWF0ZURldnRvb2xzUGVyZm9ybWFuY2VIb29rKFwicGVyZjpzdGFydFwiIC8qIFBFUkZPUk1BTkNFX1NUQVJUICovKTtcbmNvbnN0IGRldnRvb2xzUGVyZkVuZCA9IC8qIEBfX1BVUkVfXyAqLyBjcmVhdGVEZXZ0b29sc1BlcmZvcm1hbmNlSG9vayhcInBlcmY6ZW5kXCIgLyogUEVSRk9STUFOQ0VfRU5EICovKTtcbmZ1bmN0aW9uIGNyZWF0ZURldnRvb2xzUGVyZm9ybWFuY2VIb29rKGhvb2spIHtcbiAgcmV0dXJuIChjb21wb25lbnQsIHR5cGUsIHRpbWUpID0+IHtcbiAgICBlbWl0JDEoaG9vaywgY29tcG9uZW50LmFwcENvbnRleHQuYXBwLCBjb21wb25lbnQudWlkLCBjb21wb25lbnQsIHR5cGUsIHRpbWUpO1xuICB9O1xufVxuZnVuY3Rpb24gZGV2dG9vbHNDb21wb25lbnRFbWl0KGNvbXBvbmVudCwgZXZlbnQsIHBhcmFtcykge1xuICBlbWl0JDEoXG4gICAgXCJjb21wb25lbnQ6ZW1pdFwiIC8qIENPTVBPTkVOVF9FTUlUICovLFxuICAgIGNvbXBvbmVudC5hcHBDb250ZXh0LmFwcCxcbiAgICBjb21wb25lbnQsXG4gICAgZXZlbnQsXG4gICAgcGFyYW1zXG4gICk7XG59XG5cbmxldCBjdXJyZW50UmVuZGVyaW5nSW5zdGFuY2UgPSBudWxsO1xubGV0IGN1cnJlbnRTY29wZUlkID0gbnVsbDtcbmZ1bmN0aW9uIHNldEN1cnJlbnRSZW5kZXJpbmdJbnN0YW5jZShpbnN0YW5jZSkge1xuICBjb25zdCBwcmV2ID0gY3VycmVudFJlbmRlcmluZ0luc3RhbmNlO1xuICBjdXJyZW50UmVuZGVyaW5nSW5zdGFuY2UgPSBpbnN0YW5jZTtcbiAgY3VycmVudFNjb3BlSWQgPSBpbnN0YW5jZSAmJiBpbnN0YW5jZS50eXBlLl9fc2NvcGVJZCB8fCBudWxsO1xuICByZXR1cm4gcHJldjtcbn1cbmZ1bmN0aW9uIHB1c2hTY29wZUlkKGlkKSB7XG4gIGN1cnJlbnRTY29wZUlkID0gaWQ7XG59XG5mdW5jdGlvbiBwb3BTY29wZUlkKCkge1xuICBjdXJyZW50U2NvcGVJZCA9IG51bGw7XG59XG5jb25zdCB3aXRoU2NvcGVJZCA9IChfaWQpID0+IHdpdGhDdHg7XG5mdW5jdGlvbiB3aXRoQ3R4KGZuLCBjdHggPSBjdXJyZW50UmVuZGVyaW5nSW5zdGFuY2UsIGlzTm9uU2NvcGVkU2xvdCkge1xuICBpZiAoIWN0eCkgcmV0dXJuIGZuO1xuICBpZiAoZm4uX24pIHtcbiAgICByZXR1cm4gZm47XG4gIH1cbiAgY29uc3QgcmVuZGVyRm5XaXRoQ29udGV4dCA9ICguLi5hcmdzKSA9PiB7XG4gICAgaWYgKHJlbmRlckZuV2l0aENvbnRleHQuX2QpIHtcbiAgICAgIHNldEJsb2NrVHJhY2tpbmcoLTEpO1xuICAgIH1cbiAgICBjb25zdCBwcmV2SW5zdGFuY2UgPSBzZXRDdXJyZW50UmVuZGVyaW5nSW5zdGFuY2UoY3R4KTtcbiAgICBsZXQgcmVzO1xuICAgIHRyeSB7XG4gICAgICByZXMgPSBmbiguLi5hcmdzKTtcbiAgICB9IGZpbmFsbHkge1xuICAgICAgc2V0Q3VycmVudFJlbmRlcmluZ0luc3RhbmNlKHByZXZJbnN0YW5jZSk7XG4gICAgICBpZiAocmVuZGVyRm5XaXRoQ29udGV4dC5fZCkge1xuICAgICAgICBzZXRCbG9ja1RyYWNraW5nKDEpO1xuICAgICAgfVxuICAgIH1cbiAgICBpZiAoISEocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09IFwicHJvZHVjdGlvblwiKSB8fCBfX1ZVRV9QUk9EX0RFVlRPT0xTX18pIHtcbiAgICAgIGRldnRvb2xzQ29tcG9uZW50VXBkYXRlZChjdHgpO1xuICAgIH1cbiAgICByZXR1cm4gcmVzO1xuICB9O1xuICByZW5kZXJGbldpdGhDb250ZXh0Ll9uID0gdHJ1ZTtcbiAgcmVuZGVyRm5XaXRoQ29udGV4dC5fYyA9IHRydWU7XG4gIHJlbmRlckZuV2l0aENvbnRleHQuX2QgPSB0cnVlO1xuICByZXR1cm4gcmVuZGVyRm5XaXRoQ29udGV4dDtcbn1cblxuZnVuY3Rpb24gdmFsaWRhdGVEaXJlY3RpdmVOYW1lKG5hbWUpIHtcbiAgaWYgKGlzQnVpbHRJbkRpcmVjdGl2ZShuYW1lKSkge1xuICAgIHdhcm4kMShcIkRvIG5vdCB1c2UgYnVpbHQtaW4gZGlyZWN0aXZlIGlkcyBhcyBjdXN0b20gZGlyZWN0aXZlIGlkOiBcIiArIG5hbWUpO1xuICB9XG59XG5mdW5jdGlvbiB3aXRoRGlyZWN0aXZlcyh2bm9kZSwgZGlyZWN0aXZlcykge1xuICBpZiAoY3VycmVudFJlbmRlcmluZ0luc3RhbmNlID09PSBudWxsKSB7XG4gICAgISEocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09IFwicHJvZHVjdGlvblwiKSAmJiB3YXJuJDEoYHdpdGhEaXJlY3RpdmVzIGNhbiBvbmx5IGJlIHVzZWQgaW5zaWRlIHJlbmRlciBmdW5jdGlvbnMuYCk7XG4gICAgcmV0dXJuIHZub2RlO1xuICB9XG4gIGNvbnN0IGluc3RhbmNlID0gZ2V0Q29tcG9uZW50UHVibGljSW5zdGFuY2UoY3VycmVudFJlbmRlcmluZ0luc3RhbmNlKTtcbiAgY29uc3QgYmluZGluZ3MgPSB2bm9kZS5kaXJzIHx8ICh2bm9kZS5kaXJzID0gW10pO1xuICBmb3IgKGxldCBpID0gMDsgaSA8IGRpcmVjdGl2ZXMubGVuZ3RoOyBpKyspIHtcbiAgICBsZXQgW2RpciwgdmFsdWUsIGFyZywgbW9kaWZpZXJzID0gRU1QVFlfT0JKXSA9IGRpcmVjdGl2ZXNbaV07XG4gICAgaWYgKGRpcikge1xuICAgICAgaWYgKGlzRnVuY3Rpb24oZGlyKSkge1xuICAgICAgICBkaXIgPSB7XG4gICAgICAgICAgbW91bnRlZDogZGlyLFxuICAgICAgICAgIHVwZGF0ZWQ6IGRpclxuICAgICAgICB9O1xuICAgICAgfVxuICAgICAgaWYgKGRpci5kZWVwKSB7XG4gICAgICAgIHRyYXZlcnNlKHZhbHVlKTtcbiAgICAgIH1cbiAgICAgIGJpbmRpbmdzLnB1c2goe1xuICAgICAgICBkaXIsXG4gICAgICAgIGluc3RhbmNlLFxuICAgICAgICB2YWx1ZSxcbiAgICAgICAgb2xkVmFsdWU6IHZvaWQgMCxcbiAgICAgICAgYXJnLFxuICAgICAgICBtb2RpZmllcnNcbiAgICAgIH0pO1xuICAgIH1cbiAgfVxuICByZXR1cm4gdm5vZGU7XG59XG5mdW5jdGlvbiBpbnZva2VEaXJlY3RpdmVIb29rKHZub2RlLCBwcmV2Vk5vZGUsIGluc3RhbmNlLCBuYW1lKSB7XG4gIGNvbnN0IGJpbmRpbmdzID0gdm5vZGUuZGlycztcbiAgY29uc3Qgb2xkQmluZGluZ3MgPSBwcmV2Vk5vZGUgJiYgcHJldlZOb2RlLmRpcnM7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgYmluZGluZ3MubGVuZ3RoOyBpKyspIHtcbiAgICBjb25zdCBiaW5kaW5nID0gYmluZGluZ3NbaV07XG4gICAgaWYgKG9sZEJpbmRpbmdzKSB7XG4gICAgICBiaW5kaW5nLm9sZFZhbHVlID0gb2xkQmluZGluZ3NbaV0udmFsdWU7XG4gICAgfVxuICAgIGxldCBob29rID0gYmluZGluZy5kaXJbbmFtZV07XG4gICAgaWYgKGhvb2spIHtcbiAgICAgIHBhdXNlVHJhY2tpbmcoKTtcbiAgICAgIGNhbGxXaXRoQXN5bmNFcnJvckhhbmRsaW5nKGhvb2ssIGluc3RhbmNlLCA4LCBbXG4gICAgICAgIHZub2RlLmVsLFxuICAgICAgICBiaW5kaW5nLFxuICAgICAgICB2bm9kZSxcbiAgICAgICAgcHJldlZOb2RlXG4gICAgICBdKTtcbiAgICAgIHJlc2V0VHJhY2tpbmcoKTtcbiAgICB9XG4gIH1cbn1cblxuZnVuY3Rpb24gcHJvdmlkZShrZXksIHZhbHVlKSB7XG4gIGlmICghIShwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gXCJwcm9kdWN0aW9uXCIpKSB7XG4gICAgaWYgKCFjdXJyZW50SW5zdGFuY2UgfHwgY3VycmVudEluc3RhbmNlLmlzTW91bnRlZCkge1xuICAgICAgd2FybiQxKGBwcm92aWRlKCkgY2FuIG9ubHkgYmUgdXNlZCBpbnNpZGUgc2V0dXAoKS5gKTtcbiAgICB9XG4gIH1cbiAgaWYgKGN1cnJlbnRJbnN0YW5jZSkge1xuICAgIGxldCBwcm92aWRlcyA9IGN1cnJlbnRJbnN0YW5jZS5wcm92aWRlcztcbiAgICBjb25zdCBwYXJlbnRQcm92aWRlcyA9IGN1cnJlbnRJbnN0YW5jZS5wYXJlbnQgJiYgY3VycmVudEluc3RhbmNlLnBhcmVudC5wcm92aWRlcztcbiAgICBpZiAocGFyZW50UHJvdmlkZXMgPT09IHByb3ZpZGVzKSB7XG4gICAgICBwcm92aWRlcyA9IGN1cnJlbnRJbnN0YW5jZS5wcm92aWRlcyA9IE9iamVjdC5jcmVhdGUocGFyZW50UHJvdmlkZXMpO1xuICAgIH1cbiAgICBwcm92aWRlc1trZXldID0gdmFsdWU7XG4gIH1cbn1cbmZ1bmN0aW9uIGluamVjdChrZXksIGRlZmF1bHRWYWx1ZSwgdHJlYXREZWZhdWx0QXNGYWN0b3J5ID0gZmFsc2UpIHtcbiAgY29uc3QgaW5zdGFuY2UgPSBnZXRDdXJyZW50SW5zdGFuY2UoKTtcbiAgaWYgKGluc3RhbmNlIHx8IGN1cnJlbnRBcHApIHtcbiAgICBsZXQgcHJvdmlkZXMgPSBjdXJyZW50QXBwID8gY3VycmVudEFwcC5fY29udGV4dC5wcm92aWRlcyA6IGluc3RhbmNlID8gaW5zdGFuY2UucGFyZW50ID09IG51bGwgfHwgaW5zdGFuY2UuY2UgPyBpbnN0YW5jZS52bm9kZS5hcHBDb250ZXh0ICYmIGluc3RhbmNlLnZub2RlLmFwcENvbnRleHQucHJvdmlkZXMgOiBpbnN0YW5jZS5wYXJlbnQucHJvdmlkZXMgOiB2b2lkIDA7XG4gICAgaWYgKHByb3ZpZGVzICYmIGtleSBpbiBwcm92aWRlcykge1xuICAgICAgcmV0dXJuIHByb3ZpZGVzW2tleV07XG4gICAgfSBlbHNlIGlmIChhcmd1bWVudHMubGVuZ3RoID4gMSkge1xuICAgICAgcmV0dXJuIHRyZWF0RGVmYXVsdEFzRmFjdG9yeSAmJiBpc0Z1bmN0aW9uKGRlZmF1bHRWYWx1ZSkgPyBkZWZhdWx0VmFsdWUuY2FsbChpbnN0YW5jZSAmJiBpbnN0YW5jZS5wcm94eSkgOiBkZWZhdWx0VmFsdWU7XG4gICAgfSBlbHNlIGlmICghIShwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gXCJwcm9kdWN0aW9uXCIpKSB7XG4gICAgICB3YXJuJDEoYGluamVjdGlvbiBcIiR7U3RyaW5nKGtleSl9XCIgbm90IGZvdW5kLmApO1xuICAgIH1cbiAgfSBlbHNlIGlmICghIShwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gXCJwcm9kdWN0aW9uXCIpKSB7XG4gICAgd2FybiQxKGBpbmplY3QoKSBjYW4gb25seSBiZSB1c2VkIGluc2lkZSBzZXR1cCgpIG9yIGZ1bmN0aW9uYWwgY29tcG9uZW50cy5gKTtcbiAgfVxufVxuZnVuY3Rpb24gaGFzSW5qZWN0aW9uQ29udGV4dCgpIHtcbiAgcmV0dXJuICEhKGdldEN1cnJlbnRJbnN0YW5jZSgpIHx8IGN1cnJlbnRBcHApO1xufVxuXG5jb25zdCBzc3JDb250ZXh0S2V5ID0gLyogQF9fUFVSRV9fICovIFN5bWJvbC5mb3IoXCJ2LXNjeFwiKTtcbmNvbnN0IHVzZVNTUkNvbnRleHQgPSAoKSA9PiB7XG4gIHtcbiAgICBjb25zdCBjdHggPSBpbmplY3Qoc3NyQ29udGV4dEtleSk7XG4gICAgaWYgKCFjdHgpIHtcbiAgICAgICEhKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSBcInByb2R1Y3Rpb25cIikgJiYgd2FybiQxKFxuICAgICAgICBgU2VydmVyIHJlbmRlcmluZyBjb250ZXh0IG5vdCBwcm92aWRlZC4gTWFrZSBzdXJlIHRvIG9ubHkgY2FsbCB1c2VTU1JDb250ZXh0KCkgY29uZGl0aW9uYWxseSBpbiB0aGUgc2VydmVyIGJ1aWxkLmBcbiAgICAgICk7XG4gICAgfVxuICAgIHJldHVybiBjdHg7XG4gIH1cbn07XG5cbmZ1bmN0aW9uIHdhdGNoRWZmZWN0KGVmZmVjdCwgb3B0aW9ucykge1xuICByZXR1cm4gZG9XYXRjaChlZmZlY3QsIG51bGwsIG9wdGlvbnMpO1xufVxuZnVuY3Rpb24gd2F0Y2hQb3N0RWZmZWN0KGVmZmVjdCwgb3B0aW9ucykge1xuICByZXR1cm4gZG9XYXRjaChcbiAgICBlZmZlY3QsXG4gICAgbnVsbCxcbiAgICAhIShwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gXCJwcm9kdWN0aW9uXCIpID8gZXh0ZW5kKHt9LCBvcHRpb25zLCB7IGZsdXNoOiBcInBvc3RcIiB9KSA6IHsgZmx1c2g6IFwicG9zdFwiIH1cbiAgKTtcbn1cbmZ1bmN0aW9uIHdhdGNoU3luY0VmZmVjdChlZmZlY3QsIG9wdGlvbnMpIHtcbiAgcmV0dXJuIGRvV2F0Y2goXG4gICAgZWZmZWN0LFxuICAgIG51bGwsXG4gICAgISEocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09IFwicHJvZHVjdGlvblwiKSA/IGV4dGVuZCh7fSwgb3B0aW9ucywgeyBmbHVzaDogXCJzeW5jXCIgfSkgOiB7IGZsdXNoOiBcInN5bmNcIiB9XG4gICk7XG59XG5mdW5jdGlvbiB3YXRjaChzb3VyY2UsIGNiLCBvcHRpb25zKSB7XG4gIGlmICghIShwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gXCJwcm9kdWN0aW9uXCIpICYmICFpc0Z1bmN0aW9uKGNiKSkge1xuICAgIHdhcm4kMShcbiAgICAgIGBcXGB3YXRjaChmbiwgb3B0aW9ucz8pXFxgIHNpZ25hdHVyZSBoYXMgYmVlbiBtb3ZlZCB0byBhIHNlcGFyYXRlIEFQSS4gVXNlIFxcYHdhdGNoRWZmZWN0KGZuLCBvcHRpb25zPylcXGAgaW5zdGVhZC4gXFxgd2F0Y2hcXGAgbm93IG9ubHkgc3VwcG9ydHMgXFxgd2F0Y2goc291cmNlLCBjYiwgb3B0aW9ucz8pIHNpZ25hdHVyZS5gXG4gICAgKTtcbiAgfVxuICByZXR1cm4gZG9XYXRjaChzb3VyY2UsIGNiLCBvcHRpb25zKTtcbn1cbmZ1bmN0aW9uIGRvV2F0Y2goc291cmNlLCBjYiwgb3B0aW9ucyA9IEVNUFRZX09CSikge1xuICBjb25zdCB7IGltbWVkaWF0ZSwgZGVlcCwgZmx1c2gsIG9uY2UgfSA9IG9wdGlvbnM7XG4gIGlmICghIShwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gXCJwcm9kdWN0aW9uXCIpICYmICFjYikge1xuICAgIGlmIChpbW1lZGlhdGUgIT09IHZvaWQgMCkge1xuICAgICAgd2FybiQxKFxuICAgICAgICBgd2F0Y2goKSBcImltbWVkaWF0ZVwiIG9wdGlvbiBpcyBvbmx5IHJlc3BlY3RlZCB3aGVuIHVzaW5nIHRoZSB3YXRjaChzb3VyY2UsIGNhbGxiYWNrLCBvcHRpb25zPykgc2lnbmF0dXJlLmBcbiAgICAgICk7XG4gICAgfVxuICAgIGlmIChkZWVwICE9PSB2b2lkIDApIHtcbiAgICAgIHdhcm4kMShcbiAgICAgICAgYHdhdGNoKCkgXCJkZWVwXCIgb3B0aW9uIGlzIG9ubHkgcmVzcGVjdGVkIHdoZW4gdXNpbmcgdGhlIHdhdGNoKHNvdXJjZSwgY2FsbGJhY2ssIG9wdGlvbnM/KSBzaWduYXR1cmUuYFxuICAgICAgKTtcbiAgICB9XG4gICAgaWYgKG9uY2UgIT09IHZvaWQgMCkge1xuICAgICAgd2FybiQxKFxuICAgICAgICBgd2F0Y2goKSBcIm9uY2VcIiBvcHRpb24gaXMgb25seSByZXNwZWN0ZWQgd2hlbiB1c2luZyB0aGUgd2F0Y2goc291cmNlLCBjYWxsYmFjaywgb3B0aW9ucz8pIHNpZ25hdHVyZS5gXG4gICAgICApO1xuICAgIH1cbiAgfVxuICBjb25zdCBiYXNlV2F0Y2hPcHRpb25zID0gZXh0ZW5kKHt9LCBvcHRpb25zKTtcbiAgaWYgKCEhKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSBcInByb2R1Y3Rpb25cIikpIGJhc2VXYXRjaE9wdGlvbnMub25XYXJuID0gd2FybiQxO1xuICBjb25zdCBydW5zSW1tZWRpYXRlbHkgPSBjYiAmJiBpbW1lZGlhdGUgfHwgIWNiICYmIGZsdXNoICE9PSBcInBvc3RcIjtcbiAgbGV0IHNzckNsZWFudXA7XG4gIGlmIChpc0luU1NSQ29tcG9uZW50U2V0dXApIHtcbiAgICBpZiAoZmx1c2ggPT09IFwic3luY1wiKSB7XG4gICAgICBjb25zdCBjdHggPSB1c2VTU1JDb250ZXh0KCk7XG4gICAgICBzc3JDbGVhbnVwID0gY3R4Ll9fd2F0Y2hlckhhbmRsZXMgfHwgKGN0eC5fX3dhdGNoZXJIYW5kbGVzID0gW10pO1xuICAgIH0gZWxzZSBpZiAoIXJ1bnNJbW1lZGlhdGVseSkge1xuICAgICAgY29uc3Qgd2F0Y2hTdG9wSGFuZGxlID0gKCkgPT4ge1xuICAgICAgfTtcbiAgICAgIHdhdGNoU3RvcEhhbmRsZS5zdG9wID0gTk9PUDtcbiAgICAgIHdhdGNoU3RvcEhhbmRsZS5yZXN1bWUgPSBOT09QO1xuICAgICAgd2F0Y2hTdG9wSGFuZGxlLnBhdXNlID0gTk9PUDtcbiAgICAgIHJldHVybiB3YXRjaFN0b3BIYW5kbGU7XG4gICAgfVxuICB9XG4gIGNvbnN0IGluc3RhbmNlID0gY3VycmVudEluc3RhbmNlO1xuICBiYXNlV2F0Y2hPcHRpb25zLmNhbGwgPSAoZm4sIHR5cGUsIGFyZ3MpID0+IGNhbGxXaXRoQXN5bmNFcnJvckhhbmRsaW5nKGZuLCBpbnN0YW5jZSwgdHlwZSwgYXJncyk7XG4gIGxldCBpc1ByZSA9IGZhbHNlO1xuICBpZiAoZmx1c2ggPT09IFwicG9zdFwiKSB7XG4gICAgYmFzZVdhdGNoT3B0aW9ucy5zY2hlZHVsZXIgPSAoam9iKSA9PiB7XG4gICAgICBxdWV1ZVBvc3RSZW5kZXJFZmZlY3Qoam9iLCBpbnN0YW5jZSAmJiBpbnN0YW5jZS5zdXNwZW5zZSk7XG4gICAgfTtcbiAgfSBlbHNlIGlmIChmbHVzaCAhPT0gXCJzeW5jXCIpIHtcbiAgICBpc1ByZSA9IHRydWU7XG4gICAgYmFzZVdhdGNoT3B0aW9ucy5zY2hlZHVsZXIgPSAoam9iLCBpc0ZpcnN0UnVuKSA9PiB7XG4gICAgICBpZiAoaXNGaXJzdFJ1bikge1xuICAgICAgICBqb2IoKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHF1ZXVlSm9iKGpvYik7XG4gICAgICB9XG4gICAgfTtcbiAgfVxuICBiYXNlV2F0Y2hPcHRpb25zLmF1Z21lbnRKb2IgPSAoam9iKSA9PiB7XG4gICAgaWYgKGNiKSB7XG4gICAgICBqb2IuZmxhZ3MgfD0gNDtcbiAgICB9XG4gICAgaWYgKGlzUHJlKSB7XG4gICAgICBqb2IuZmxhZ3MgfD0gMjtcbiAgICAgIGlmIChpbnN0YW5jZSkge1xuICAgICAgICBqb2IuaWQgPSBpbnN0YW5jZS51aWQ7XG4gICAgICAgIGpvYi5pID0gaW5zdGFuY2U7XG4gICAgICB9XG4gICAgfVxuICB9O1xuICBjb25zdCB3YXRjaEhhbmRsZSA9IHdhdGNoJDEoc291cmNlLCBjYiwgYmFzZVdhdGNoT3B0aW9ucyk7XG4gIGlmIChpc0luU1NSQ29tcG9uZW50U2V0dXApIHtcbiAgICBpZiAoc3NyQ2xlYW51cCkge1xuICAgICAgc3NyQ2xlYW51cC5wdXNoKHdhdGNoSGFuZGxlKTtcbiAgICB9IGVsc2UgaWYgKHJ1bnNJbW1lZGlhdGVseSkge1xuICAgICAgd2F0Y2hIYW5kbGUoKTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHdhdGNoSGFuZGxlO1xufVxuZnVuY3Rpb24gaW5zdGFuY2VXYXRjaChzb3VyY2UsIHZhbHVlLCBvcHRpb25zKSB7XG4gIGNvbnN0IHB1YmxpY1RoaXMgPSB0aGlzLnByb3h5O1xuICBjb25zdCBnZXR0ZXIgPSBpc1N0cmluZyhzb3VyY2UpID8gc291cmNlLmluY2x1ZGVzKFwiLlwiKSA/IGNyZWF0ZVBhdGhHZXR0ZXIocHVibGljVGhpcywgc291cmNlKSA6ICgpID0+IHB1YmxpY1RoaXNbc291cmNlXSA6IHNvdXJjZS5iaW5kKHB1YmxpY1RoaXMsIHB1YmxpY1RoaXMpO1xuICBsZXQgY2I7XG4gIGlmIChpc0Z1bmN0aW9uKHZhbHVlKSkge1xuICAgIGNiID0gdmFsdWU7XG4gIH0gZWxzZSB7XG4gICAgY2IgPSB2YWx1ZS5oYW5kbGVyO1xuICAgIG9wdGlvbnMgPSB2YWx1ZTtcbiAgfVxuICBjb25zdCByZXNldCA9IHNldEN1cnJlbnRJbnN0YW5jZSh0aGlzKTtcbiAgY29uc3QgcmVzID0gZG9XYXRjaChnZXR0ZXIsIGNiLmJpbmQocHVibGljVGhpcyksIG9wdGlvbnMpO1xuICByZXNldCgpO1xuICByZXR1cm4gcmVzO1xufVxuZnVuY3Rpb24gY3JlYXRlUGF0aEdldHRlcihjdHgsIHBhdGgpIHtcbiAgY29uc3Qgc2VnbWVudHMgPSBwYXRoLnNwbGl0KFwiLlwiKTtcbiAgcmV0dXJuICgpID0+IHtcbiAgICBsZXQgY3VyID0gY3R4O1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgc2VnbWVudHMubGVuZ3RoICYmIGN1cjsgaSsrKSB7XG4gICAgICBjdXIgPSBjdXJbc2VnbWVudHNbaV1dO1xuICAgIH1cbiAgICByZXR1cm4gY3VyO1xuICB9O1xufVxuXG5jb25zdCBUZWxlcG9ydEVuZEtleSA9IC8qIEBfX1BVUkVfXyAqLyBTeW1ib2woXCJfdnRlXCIpO1xuY29uc3QgaXNUZWxlcG9ydCA9ICh0eXBlKSA9PiB0eXBlLl9faXNUZWxlcG9ydDtcbmNvbnN0IGlzVGVsZXBvcnREaXNhYmxlZCA9IChwcm9wcykgPT4gcHJvcHMgJiYgKHByb3BzLmRpc2FibGVkIHx8IHByb3BzLmRpc2FibGVkID09PSBcIlwiKTtcbmNvbnN0IGlzVGVsZXBvcnREZWZlcnJlZCA9IChwcm9wcykgPT4gcHJvcHMgJiYgKHByb3BzLmRlZmVyIHx8IHByb3BzLmRlZmVyID09PSBcIlwiKTtcbmNvbnN0IGlzVGFyZ2V0U1ZHID0gKHRhcmdldCkgPT4gdHlwZW9mIFNWR0VsZW1lbnQgIT09IFwidW5kZWZpbmVkXCIgJiYgdGFyZ2V0IGluc3RhbmNlb2YgU1ZHRWxlbWVudDtcbmNvbnN0IGlzVGFyZ2V0TWF0aE1MID0gKHRhcmdldCkgPT4gdHlwZW9mIE1hdGhNTEVsZW1lbnQgPT09IFwiZnVuY3Rpb25cIiAmJiB0YXJnZXQgaW5zdGFuY2VvZiBNYXRoTUxFbGVtZW50O1xuY29uc3QgcmVzb2x2ZVRhcmdldCA9IChwcm9wcywgc2VsZWN0KSA9PiB7XG4gIGNvbnN0IHRhcmdldFNlbGVjdG9yID0gcHJvcHMgJiYgcHJvcHMudG87XG4gIGlmIChpc1N0cmluZyh0YXJnZXRTZWxlY3RvcikpIHtcbiAgICBpZiAoIXNlbGVjdCkge1xuICAgICAgISEocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09IFwicHJvZHVjdGlvblwiKSAmJiB3YXJuJDEoXG4gICAgICAgIGBDdXJyZW50IHJlbmRlcmVyIGRvZXMgbm90IHN1cHBvcnQgc3RyaW5nIHRhcmdldCBmb3IgVGVsZXBvcnRzLiAobWlzc2luZyBxdWVyeVNlbGVjdG9yIHJlbmRlcmVyIG9wdGlvbilgXG4gICAgICApO1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnN0IHRhcmdldCA9IHNlbGVjdCh0YXJnZXRTZWxlY3Rvcik7XG4gICAgICBpZiAoISEocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09IFwicHJvZHVjdGlvblwiKSAmJiAhdGFyZ2V0ICYmICFpc1RlbGVwb3J0RGlzYWJsZWQocHJvcHMpKSB7XG4gICAgICAgIHdhcm4kMShcbiAgICAgICAgICBgRmFpbGVkIHRvIGxvY2F0ZSBUZWxlcG9ydCB0YXJnZXQgd2l0aCBzZWxlY3RvciBcIiR7dGFyZ2V0U2VsZWN0b3J9XCIuIE5vdGUgdGhlIHRhcmdldCBlbGVtZW50IG11c3QgZXhpc3QgYmVmb3JlIHRoZSBjb21wb25lbnQgaXMgbW91bnRlZCAtIGkuZS4gdGhlIHRhcmdldCBjYW5ub3QgYmUgcmVuZGVyZWQgYnkgdGhlIGNvbXBvbmVudCBpdHNlbGYsIGFuZCBpZGVhbGx5IHNob3VsZCBiZSBvdXRzaWRlIG9mIHRoZSBlbnRpcmUgVnVlIGNvbXBvbmVudCB0cmVlLmBcbiAgICAgICAgKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiB0YXJnZXQ7XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIGlmICghIShwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gXCJwcm9kdWN0aW9uXCIpICYmICF0YXJnZXRTZWxlY3RvciAmJiAhaXNUZWxlcG9ydERpc2FibGVkKHByb3BzKSkge1xuICAgICAgd2FybiQxKGBJbnZhbGlkIFRlbGVwb3J0IHRhcmdldDogJHt0YXJnZXRTZWxlY3Rvcn1gKTtcbiAgICB9XG4gICAgcmV0dXJuIHRhcmdldFNlbGVjdG9yO1xuICB9XG59O1xuY29uc3QgVGVsZXBvcnRJbXBsID0ge1xuICBuYW1lOiBcIlRlbGVwb3J0XCIsXG4gIF9faXNUZWxlcG9ydDogdHJ1ZSxcbiAgcHJvY2VzcyhuMSwgbjIsIGNvbnRhaW5lciwgYW5jaG9yLCBwYXJlbnRDb21wb25lbnQsIHBhcmVudFN1c3BlbnNlLCBuYW1lc3BhY2UsIHNsb3RTY29wZUlkcywgb3B0aW1pemVkLCBpbnRlcm5hbHMpIHtcbiAgICBjb25zdCB7XG4gICAgICBtYzogbW91bnRDaGlsZHJlbixcbiAgICAgIHBjOiBwYXRjaENoaWxkcmVuLFxuICAgICAgcGJjOiBwYXRjaEJsb2NrQ2hpbGRyZW4sXG4gICAgICBvOiB7IGluc2VydCwgcXVlcnlTZWxlY3RvciwgY3JlYXRlVGV4dCwgY3JlYXRlQ29tbWVudCB9XG4gICAgfSA9IGludGVybmFscztcbiAgICBjb25zdCBkaXNhYmxlZCA9IGlzVGVsZXBvcnREaXNhYmxlZChuMi5wcm9wcyk7XG4gICAgbGV0IHsgc2hhcGVGbGFnLCBjaGlsZHJlbiwgZHluYW1pY0NoaWxkcmVuIH0gPSBuMjtcbiAgICBpZiAoISEocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09IFwicHJvZHVjdGlvblwiKSAmJiBpc0htclVwZGF0aW5nKSB7XG4gICAgICBvcHRpbWl6ZWQgPSBmYWxzZTtcbiAgICAgIGR5bmFtaWNDaGlsZHJlbiA9IG51bGw7XG4gICAgfVxuICAgIGlmIChuMSA9PSBudWxsKSB7XG4gICAgICBjb25zdCBwbGFjZWhvbGRlciA9IG4yLmVsID0gISEocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09IFwicHJvZHVjdGlvblwiKSA/IGNyZWF0ZUNvbW1lbnQoXCJ0ZWxlcG9ydCBzdGFydFwiKSA6IGNyZWF0ZVRleHQoXCJcIik7XG4gICAgICBjb25zdCBtYWluQW5jaG9yID0gbjIuYW5jaG9yID0gISEocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09IFwicHJvZHVjdGlvblwiKSA/IGNyZWF0ZUNvbW1lbnQoXCJ0ZWxlcG9ydCBlbmRcIikgOiBjcmVhdGVUZXh0KFwiXCIpO1xuICAgICAgaW5zZXJ0KHBsYWNlaG9sZGVyLCBjb250YWluZXIsIGFuY2hvcik7XG4gICAgICBpbnNlcnQobWFpbkFuY2hvciwgY29udGFpbmVyLCBhbmNob3IpO1xuICAgICAgY29uc3QgbW91bnQgPSAoY29udGFpbmVyMiwgYW5jaG9yMikgPT4ge1xuICAgICAgICBpZiAoc2hhcGVGbGFnICYgMTYpIHtcbiAgICAgICAgICBtb3VudENoaWxkcmVuKFxuICAgICAgICAgICAgY2hpbGRyZW4sXG4gICAgICAgICAgICBjb250YWluZXIyLFxuICAgICAgICAgICAgYW5jaG9yMixcbiAgICAgICAgICAgIHBhcmVudENvbXBvbmVudCxcbiAgICAgICAgICAgIHBhcmVudFN1c3BlbnNlLFxuICAgICAgICAgICAgbmFtZXNwYWNlLFxuICAgICAgICAgICAgc2xvdFNjb3BlSWRzLFxuICAgICAgICAgICAgb3B0aW1pemVkXG4gICAgICAgICAgKTtcbiAgICAgICAgfVxuICAgICAgfTtcbiAgICAgIGNvbnN0IG1vdW50VG9UYXJnZXQgPSAoKSA9PiB7XG4gICAgICAgIGNvbnN0IHRhcmdldCA9IG4yLnRhcmdldCA9IHJlc29sdmVUYXJnZXQobjIucHJvcHMsIHF1ZXJ5U2VsZWN0b3IpO1xuICAgICAgICBjb25zdCB0YXJnZXRBbmNob3IgPSBwcmVwYXJlQW5jaG9yKHRhcmdldCwgbjIsIGNyZWF0ZVRleHQsIGluc2VydCk7XG4gICAgICAgIGlmICh0YXJnZXQpIHtcbiAgICAgICAgICBpZiAobmFtZXNwYWNlICE9PSBcInN2Z1wiICYmIGlzVGFyZ2V0U1ZHKHRhcmdldCkpIHtcbiAgICAgICAgICAgIG5hbWVzcGFjZSA9IFwic3ZnXCI7XG4gICAgICAgICAgfSBlbHNlIGlmIChuYW1lc3BhY2UgIT09IFwibWF0aG1sXCIgJiYgaXNUYXJnZXRNYXRoTUwodGFyZ2V0KSkge1xuICAgICAgICAgICAgbmFtZXNwYWNlID0gXCJtYXRobWxcIjtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKHBhcmVudENvbXBvbmVudCAmJiBwYXJlbnRDb21wb25lbnQuaXNDRSkge1xuICAgICAgICAgICAgKHBhcmVudENvbXBvbmVudC5jZS5fdGVsZXBvcnRUYXJnZXRzIHx8IChwYXJlbnRDb21wb25lbnQuY2UuX3RlbGVwb3J0VGFyZ2V0cyA9IC8qIEBfX1BVUkVfXyAqLyBuZXcgU2V0KCkpKS5hZGQodGFyZ2V0KTtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKCFkaXNhYmxlZCkge1xuICAgICAgICAgICAgbW91bnQodGFyZ2V0LCB0YXJnZXRBbmNob3IpO1xuICAgICAgICAgICAgdXBkYXRlQ3NzVmFycyhuMiwgZmFsc2UpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIGlmICghIShwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gXCJwcm9kdWN0aW9uXCIpICYmICFkaXNhYmxlZCkge1xuICAgICAgICAgIHdhcm4kMShcbiAgICAgICAgICAgIFwiSW52YWxpZCBUZWxlcG9ydCB0YXJnZXQgb24gbW91bnQ6XCIsXG4gICAgICAgICAgICB0YXJnZXQsXG4gICAgICAgICAgICBgKCR7dHlwZW9mIHRhcmdldH0pYFxuICAgICAgICAgICk7XG4gICAgICAgIH1cbiAgICAgIH07XG4gICAgICBpZiAoZGlzYWJsZWQpIHtcbiAgICAgICAgbW91bnQoY29udGFpbmVyLCBtYWluQW5jaG9yKTtcbiAgICAgICAgdXBkYXRlQ3NzVmFycyhuMiwgdHJ1ZSk7XG4gICAgICB9XG4gICAgICBpZiAoaXNUZWxlcG9ydERlZmVycmVkKG4yLnByb3BzKSkge1xuICAgICAgICBuMi5lbC5fX2lzTW91bnRlZCA9IGZhbHNlO1xuICAgICAgICBxdWV1ZVBvc3RSZW5kZXJFZmZlY3QoKCkgPT4ge1xuICAgICAgICAgIG1vdW50VG9UYXJnZXQoKTtcbiAgICAgICAgICBkZWxldGUgbjIuZWwuX19pc01vdW50ZWQ7XG4gICAgICAgIH0sIHBhcmVudFN1c3BlbnNlKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIG1vdW50VG9UYXJnZXQoKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgaWYgKGlzVGVsZXBvcnREZWZlcnJlZChuMi5wcm9wcykgJiYgbjEuZWwuX19pc01vdW50ZWQgPT09IGZhbHNlKSB7XG4gICAgICAgIHF1ZXVlUG9zdFJlbmRlckVmZmVjdCgoKSA9PiB7XG4gICAgICAgICAgVGVsZXBvcnRJbXBsLnByb2Nlc3MoXG4gICAgICAgICAgICBuMSxcbiAgICAgICAgICAgIG4yLFxuICAgICAgICAgICAgY29udGFpbmVyLFxuICAgICAgICAgICAgYW5jaG9yLFxuICAgICAgICAgICAgcGFyZW50Q29tcG9uZW50LFxuICAgICAgICAgICAgcGFyZW50U3VzcGVuc2UsXG4gICAgICAgICAgICBuYW1lc3BhY2UsXG4gICAgICAgICAgICBzbG90U2NvcGVJZHMsXG4gICAgICAgICAgICBvcHRpbWl6ZWQsXG4gICAgICAgICAgICBpbnRlcm5hbHNcbiAgICAgICAgICApO1xuICAgICAgICB9LCBwYXJlbnRTdXNwZW5zZSk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIG4yLmVsID0gbjEuZWw7XG4gICAgICBuMi50YXJnZXRTdGFydCA9IG4xLnRhcmdldFN0YXJ0O1xuICAgICAgY29uc3QgbWFpbkFuY2hvciA9IG4yLmFuY2hvciA9IG4xLmFuY2hvcjtcbiAgICAgIGNvbnN0IHRhcmdldCA9IG4yLnRhcmdldCA9IG4xLnRhcmdldDtcbiAgICAgIGNvbnN0IHRhcmdldEFuY2hvciA9IG4yLnRhcmdldEFuY2hvciA9IG4xLnRhcmdldEFuY2hvcjtcbiAgICAgIGNvbnN0IHdhc0Rpc2FibGVkID0gaXNUZWxlcG9ydERpc2FibGVkKG4xLnByb3BzKTtcbiAgICAgIGNvbnN0IGN1cnJlbnRDb250YWluZXIgPSB3YXNEaXNhYmxlZCA/IGNvbnRhaW5lciA6IHRhcmdldDtcbiAgICAgIGNvbnN0IGN1cnJlbnRBbmNob3IgPSB3YXNEaXNhYmxlZCA/IG1haW5BbmNob3IgOiB0YXJnZXRBbmNob3I7XG4gICAgICBpZiAobmFtZXNwYWNlID09PSBcInN2Z1wiIHx8IGlzVGFyZ2V0U1ZHKHRhcmdldCkpIHtcbiAgICAgICAgbmFtZXNwYWNlID0gXCJzdmdcIjtcbiAgICAgIH0gZWxzZSBpZiAobmFtZXNwYWNlID09PSBcIm1hdGhtbFwiIHx8IGlzVGFyZ2V0TWF0aE1MKHRhcmdldCkpIHtcbiAgICAgICAgbmFtZXNwYWNlID0gXCJtYXRobWxcIjtcbiAgICAgIH1cbiAgICAgIGlmIChkeW5hbWljQ2hpbGRyZW4pIHtcbiAgICAgICAgcGF0Y2hCbG9ja0NoaWxkcmVuKFxuICAgICAgICAgIG4xLmR5bmFtaWNDaGlsZHJlbixcbiAgICAgICAgICBkeW5hbWljQ2hpbGRyZW4sXG4gICAgICAgICAgY3VycmVudENvbnRhaW5lcixcbiAgICAgICAgICBwYXJlbnRDb21wb25lbnQsXG4gICAgICAgICAgcGFyZW50U3VzcGVuc2UsXG4gICAgICAgICAgbmFtZXNwYWNlLFxuICAgICAgICAgIHNsb3RTY29wZUlkc1xuICAgICAgICApO1xuICAgICAgICB0cmF2ZXJzZVN0YXRpY0NoaWxkcmVuKG4xLCBuMiwgISEhKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSBcInByb2R1Y3Rpb25cIikpO1xuICAgICAgfSBlbHNlIGlmICghb3B0aW1pemVkKSB7XG4gICAgICAgIHBhdGNoQ2hpbGRyZW4oXG4gICAgICAgICAgbjEsXG4gICAgICAgICAgbjIsXG4gICAgICAgICAgY3VycmVudENvbnRhaW5lcixcbiAgICAgICAgICBjdXJyZW50QW5jaG9yLFxuICAgICAgICAgIHBhcmVudENvbXBvbmVudCxcbiAgICAgICAgICBwYXJlbnRTdXNwZW5zZSxcbiAgICAgICAgICBuYW1lc3BhY2UsXG4gICAgICAgICAgc2xvdFNjb3BlSWRzLFxuICAgICAgICAgIGZhbHNlXG4gICAgICAgICk7XG4gICAgICB9XG4gICAgICBpZiAoZGlzYWJsZWQpIHtcbiAgICAgICAgaWYgKCF3YXNEaXNhYmxlZCkge1xuICAgICAgICAgIG1vdmVUZWxlcG9ydChcbiAgICAgICAgICAgIG4yLFxuICAgICAgICAgICAgY29udGFpbmVyLFxuICAgICAgICAgICAgbWFpbkFuY2hvcixcbiAgICAgICAgICAgIGludGVybmFscyxcbiAgICAgICAgICAgIDFcbiAgICAgICAgICApO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGlmIChuMi5wcm9wcyAmJiBuMS5wcm9wcyAmJiBuMi5wcm9wcy50byAhPT0gbjEucHJvcHMudG8pIHtcbiAgICAgICAgICAgIG4yLnByb3BzLnRvID0gbjEucHJvcHMudG87XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpZiAoKG4yLnByb3BzICYmIG4yLnByb3BzLnRvKSAhPT0gKG4xLnByb3BzICYmIG4xLnByb3BzLnRvKSkge1xuICAgICAgICAgIGNvbnN0IG5leHRUYXJnZXQgPSBuMi50YXJnZXQgPSByZXNvbHZlVGFyZ2V0KFxuICAgICAgICAgICAgbjIucHJvcHMsXG4gICAgICAgICAgICBxdWVyeVNlbGVjdG9yXG4gICAgICAgICAgKTtcbiAgICAgICAgICBpZiAobmV4dFRhcmdldCkge1xuICAgICAgICAgICAgbW92ZVRlbGVwb3J0KFxuICAgICAgICAgICAgICBuMixcbiAgICAgICAgICAgICAgbmV4dFRhcmdldCxcbiAgICAgICAgICAgICAgbnVsbCxcbiAgICAgICAgICAgICAgaW50ZXJuYWxzLFxuICAgICAgICAgICAgICAwXG4gICAgICAgICAgICApO1xuICAgICAgICAgIH0gZWxzZSBpZiAoISEocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09IFwicHJvZHVjdGlvblwiKSkge1xuICAgICAgICAgICAgd2FybiQxKFxuICAgICAgICAgICAgICBcIkludmFsaWQgVGVsZXBvcnQgdGFyZ2V0IG9uIHVwZGF0ZTpcIixcbiAgICAgICAgICAgICAgdGFyZ2V0LFxuICAgICAgICAgICAgICBgKCR7dHlwZW9mIHRhcmdldH0pYFxuICAgICAgICAgICAgKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSBpZiAod2FzRGlzYWJsZWQpIHtcbiAgICAgICAgICBtb3ZlVGVsZXBvcnQoXG4gICAgICAgICAgICBuMixcbiAgICAgICAgICAgIHRhcmdldCxcbiAgICAgICAgICAgIHRhcmdldEFuY2hvcixcbiAgICAgICAgICAgIGludGVybmFscyxcbiAgICAgICAgICAgIDFcbiAgICAgICAgICApO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICB1cGRhdGVDc3NWYXJzKG4yLCBkaXNhYmxlZCk7XG4gICAgfVxuICB9LFxuICByZW1vdmUodm5vZGUsIHBhcmVudENvbXBvbmVudCwgcGFyZW50U3VzcGVuc2UsIHsgdW06IHVubW91bnQsIG86IHsgcmVtb3ZlOiBob3N0UmVtb3ZlIH0gfSwgZG9SZW1vdmUpIHtcbiAgICBjb25zdCB7XG4gICAgICBzaGFwZUZsYWcsXG4gICAgICBjaGlsZHJlbixcbiAgICAgIGFuY2hvcixcbiAgICAgIHRhcmdldFN0YXJ0LFxuICAgICAgdGFyZ2V0QW5jaG9yLFxuICAgICAgdGFyZ2V0LFxuICAgICAgcHJvcHNcbiAgICB9ID0gdm5vZGU7XG4gICAgaWYgKHRhcmdldCkge1xuICAgICAgaG9zdFJlbW92ZSh0YXJnZXRTdGFydCk7XG4gICAgICBob3N0UmVtb3ZlKHRhcmdldEFuY2hvcik7XG4gICAgfVxuICAgIGRvUmVtb3ZlICYmIGhvc3RSZW1vdmUoYW5jaG9yKTtcbiAgICBpZiAoc2hhcGVGbGFnICYgMTYpIHtcbiAgICAgIGNvbnN0IHNob3VsZFJlbW92ZSA9IGRvUmVtb3ZlIHx8ICFpc1RlbGVwb3J0RGlzYWJsZWQocHJvcHMpO1xuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBjaGlsZHJlbi5sZW5ndGg7IGkrKykge1xuICAgICAgICBjb25zdCBjaGlsZCA9IGNoaWxkcmVuW2ldO1xuICAgICAgICB1bm1vdW50KFxuICAgICAgICAgIGNoaWxkLFxuICAgICAgICAgIHBhcmVudENvbXBvbmVudCxcbiAgICAgICAgICBwYXJlbnRTdXNwZW5zZSxcbiAgICAgICAgICBzaG91bGRSZW1vdmUsXG4gICAgICAgICAgISFjaGlsZC5keW5hbWljQ2hpbGRyZW5cbiAgICAgICAgKTtcbiAgICAgIH1cbiAgICB9XG4gIH0sXG4gIG1vdmU6IG1vdmVUZWxlcG9ydCxcbiAgaHlkcmF0ZTogaHlkcmF0ZVRlbGVwb3J0XG59O1xuZnVuY3Rpb24gbW92ZVRlbGVwb3J0KHZub2RlLCBjb250YWluZXIsIHBhcmVudEFuY2hvciwgeyBvOiB7IGluc2VydCB9LCBtOiBtb3ZlIH0sIG1vdmVUeXBlID0gMikge1xuICBpZiAobW92ZVR5cGUgPT09IDApIHtcbiAgICBpbnNlcnQodm5vZGUudGFyZ2V0QW5jaG9yLCBjb250YWluZXIsIHBhcmVudEFuY2hvcik7XG4gIH1cbiAgY29uc3QgeyBlbCwgYW5jaG9yLCBzaGFwZUZsYWcsIGNoaWxkcmVuLCBwcm9wcyB9ID0gdm5vZGU7XG4gIGNvbnN0IGlzUmVvcmRlciA9IG1vdmVUeXBlID09PSAyO1xuICBpZiAoaXNSZW9yZGVyKSB7XG4gICAgaW5zZXJ0KGVsLCBjb250YWluZXIsIHBhcmVudEFuY2hvcik7XG4gIH1cbiAgaWYgKCFpc1Jlb3JkZXIgfHwgaXNUZWxlcG9ydERpc2FibGVkKHByb3BzKSkge1xuICAgIGlmIChzaGFwZUZsYWcgJiAxNikge1xuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBjaGlsZHJlbi5sZW5ndGg7IGkrKykge1xuICAgICAgICBtb3ZlKFxuICAgICAgICAgIGNoaWxkcmVuW2ldLFxuICAgICAgICAgIGNvbnRhaW5lcixcbiAgICAgICAgICBwYXJlbnRBbmNob3IsXG4gICAgICAgICAgMlxuICAgICAgICApO1xuICAgICAgfVxuICAgIH1cbiAgfVxuICBpZiAoaXNSZW9yZGVyKSB7XG4gICAgaW5zZXJ0KGFuY2hvciwgY29udGFpbmVyLCBwYXJlbnRBbmNob3IpO1xuICB9XG59XG5mdW5jdGlvbiBoeWRyYXRlVGVsZXBvcnQobm9kZSwgdm5vZGUsIHBhcmVudENvbXBvbmVudCwgcGFyZW50U3VzcGVuc2UsIHNsb3RTY29wZUlkcywgb3B0aW1pemVkLCB7XG4gIG86IHsgbmV4dFNpYmxpbmcsIHBhcmVudE5vZGUsIHF1ZXJ5U2VsZWN0b3IsIGluc2VydCwgY3JlYXRlVGV4dCB9XG59LCBoeWRyYXRlQ2hpbGRyZW4pIHtcbiAgZnVuY3Rpb24gaHlkcmF0ZUFuY2hvcih0YXJnZXQyLCB0YXJnZXROb2RlKSB7XG4gICAgbGV0IHRhcmdldEFuY2hvciA9IHRhcmdldE5vZGU7XG4gICAgd2hpbGUgKHRhcmdldEFuY2hvcikge1xuICAgICAgaWYgKHRhcmdldEFuY2hvciAmJiB0YXJnZXRBbmNob3Iubm9kZVR5cGUgPT09IDgpIHtcbiAgICAgICAgaWYgKHRhcmdldEFuY2hvci5kYXRhID09PSBcInRlbGVwb3J0IHN0YXJ0IGFuY2hvclwiKSB7XG4gICAgICAgICAgdm5vZGUudGFyZ2V0U3RhcnQgPSB0YXJnZXRBbmNob3I7XG4gICAgICAgIH0gZWxzZSBpZiAodGFyZ2V0QW5jaG9yLmRhdGEgPT09IFwidGVsZXBvcnQgYW5jaG9yXCIpIHtcbiAgICAgICAgICB2bm9kZS50YXJnZXRBbmNob3IgPSB0YXJnZXRBbmNob3I7XG4gICAgICAgICAgdGFyZ2V0Mi5fbHBhID0gdm5vZGUudGFyZ2V0QW5jaG9yICYmIG5leHRTaWJsaW5nKHZub2RlLnRhcmdldEFuY2hvcik7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHRhcmdldEFuY2hvciA9IG5leHRTaWJsaW5nKHRhcmdldEFuY2hvcik7XG4gICAgfVxuICB9XG4gIGZ1bmN0aW9uIGh5ZHJhdGVEaXNhYmxlZFRlbGVwb3J0KG5vZGUyLCB2bm9kZTIpIHtcbiAgICB2bm9kZTIuYW5jaG9yID0gaHlkcmF0ZUNoaWxkcmVuKFxuICAgICAgbmV4dFNpYmxpbmcobm9kZTIpLFxuICAgICAgdm5vZGUyLFxuICAgICAgcGFyZW50Tm9kZShub2RlMiksXG4gICAgICBwYXJlbnRDb21wb25lbnQsXG4gICAgICBwYXJlbnRTdXNwZW5zZSxcbiAgICAgIHNsb3RTY29wZUlkcyxcbiAgICAgIG9wdGltaXplZFxuICAgICk7XG4gIH1cbiAgY29uc3QgdGFyZ2V0ID0gdm5vZGUudGFyZ2V0ID0gcmVzb2x2ZVRhcmdldChcbiAgICB2bm9kZS5wcm9wcyxcbiAgICBxdWVyeVNlbGVjdG9yXG4gICk7XG4gIGNvbnN0IGRpc2FibGVkID0gaXNUZWxlcG9ydERpc2FibGVkKHZub2RlLnByb3BzKTtcbiAgaWYgKHRhcmdldCkge1xuICAgIGNvbnN0IHRhcmdldE5vZGUgPSB0YXJnZXQuX2xwYSB8fCB0YXJnZXQuZmlyc3RDaGlsZDtcbiAgICBpZiAodm5vZGUuc2hhcGVGbGFnICYgMTYpIHtcbiAgICAgIGlmIChkaXNhYmxlZCkge1xuICAgICAgICBoeWRyYXRlRGlzYWJsZWRUZWxlcG9ydChub2RlLCB2bm9kZSk7XG4gICAgICAgIGh5ZHJhdGVBbmNob3IodGFyZ2V0LCB0YXJnZXROb2RlKTtcbiAgICAgICAgaWYgKCF2bm9kZS50YXJnZXRBbmNob3IpIHtcbiAgICAgICAgICBwcmVwYXJlQW5jaG9yKFxuICAgICAgICAgICAgdGFyZ2V0LFxuICAgICAgICAgICAgdm5vZGUsXG4gICAgICAgICAgICBjcmVhdGVUZXh0LFxuICAgICAgICAgICAgaW5zZXJ0LFxuICAgICAgICAgICAgLy8gaWYgdGFyZ2V0IGlzIHRoZSBzYW1lIGFzIHRoZSBtYWluIHZpZXcsIGluc2VydCBhbmNob3JzIGJlZm9yZSBjdXJyZW50IG5vZGVcbiAgICAgICAgICAgIC8vIHRvIGF2b2lkIGh5ZHJhdGluZyBtaXNtYXRjaFxuICAgICAgICAgICAgcGFyZW50Tm9kZShub2RlKSA9PT0gdGFyZ2V0ID8gbm9kZSA6IG51bGxcbiAgICAgICAgICApO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB2bm9kZS5hbmNob3IgPSBuZXh0U2libGluZyhub2RlKTtcbiAgICAgICAgaHlkcmF0ZUFuY2hvcih0YXJnZXQsIHRhcmdldE5vZGUpO1xuICAgICAgICBpZiAoIXZub2RlLnRhcmdldEFuY2hvcikge1xuICAgICAgICAgIHByZXBhcmVBbmNob3IodGFyZ2V0LCB2bm9kZSwgY3JlYXRlVGV4dCwgaW5zZXJ0KTtcbiAgICAgICAgfVxuICAgICAgICBoeWRyYXRlQ2hpbGRyZW4oXG4gICAgICAgICAgdGFyZ2V0Tm9kZSAmJiBuZXh0U2libGluZyh0YXJnZXROb2RlKSxcbiAgICAgICAgICB2bm9kZSxcbiAgICAgICAgICB0YXJnZXQsXG4gICAgICAgICAgcGFyZW50Q29tcG9uZW50LFxuICAgICAgICAgIHBhcmVudFN1c3BlbnNlLFxuICAgICAgICAgIHNsb3RTY29wZUlkcyxcbiAgICAgICAgICBvcHRpbWl6ZWRcbiAgICAgICAgKTtcbiAgICAgIH1cbiAgICB9XG4gICAgdXBkYXRlQ3NzVmFycyh2bm9kZSwgZGlzYWJsZWQpO1xuICB9IGVsc2UgaWYgKGRpc2FibGVkKSB7XG4gICAgaWYgKHZub2RlLnNoYXBlRmxhZyAmIDE2KSB7XG4gICAgICBoeWRyYXRlRGlzYWJsZWRUZWxlcG9ydChub2RlLCB2bm9kZSk7XG4gICAgICB2bm9kZS50YXJnZXRTdGFydCA9IG5vZGU7XG4gICAgICB2bm9kZS50YXJnZXRBbmNob3IgPSBuZXh0U2libGluZyhub2RlKTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHZub2RlLmFuY2hvciAmJiBuZXh0U2libGluZyh2bm9kZS5hbmNob3IpO1xufVxuY29uc3QgVGVsZXBvcnQgPSBUZWxlcG9ydEltcGw7XG5mdW5jdGlvbiB1cGRhdGVDc3NWYXJzKHZub2RlLCBpc0Rpc2FibGVkKSB7XG4gIGNvbnN0IGN0eCA9IHZub2RlLmN0eDtcbiAgaWYgKGN0eCAmJiBjdHgudXQpIHtcbiAgICBsZXQgbm9kZSwgYW5jaG9yO1xuICAgIGlmIChpc0Rpc2FibGVkKSB7XG4gICAgICBub2RlID0gdm5vZGUuZWw7XG4gICAgICBhbmNob3IgPSB2bm9kZS5hbmNob3I7XG4gICAgfSBlbHNlIHtcbiAgICAgIG5vZGUgPSB2bm9kZS50YXJnZXRTdGFydDtcbiAgICAgIGFuY2hvciA9IHZub2RlLnRhcmdldEFuY2hvcjtcbiAgICB9XG4gICAgd2hpbGUgKG5vZGUgJiYgbm9kZSAhPT0gYW5jaG9yKSB7XG4gICAgICBpZiAobm9kZS5ub2RlVHlwZSA9PT0gMSkgbm9kZS5zZXRBdHRyaWJ1dGUoXCJkYXRhLXYtb3duZXJcIiwgY3R4LnVpZCk7XG4gICAgICBub2RlID0gbm9kZS5uZXh0U2libGluZztcbiAgICB9XG4gICAgY3R4LnV0KCk7XG4gIH1cbn1cbmZ1bmN0aW9uIHByZXBhcmVBbmNob3IodGFyZ2V0LCB2bm9kZSwgY3JlYXRlVGV4dCwgaW5zZXJ0LCBhbmNob3IgPSBudWxsKSB7XG4gIGNvbnN0IHRhcmdldFN0YXJ0ID0gdm5vZGUudGFyZ2V0U3RhcnQgPSBjcmVhdGVUZXh0KFwiXCIpO1xuICBjb25zdCB0YXJnZXRBbmNob3IgPSB2bm9kZS50YXJnZXRBbmNob3IgPSBjcmVhdGVUZXh0KFwiXCIpO1xuICB0YXJnZXRTdGFydFtUZWxlcG9ydEVuZEtleV0gPSB0YXJnZXRBbmNob3I7XG4gIGlmICh0YXJnZXQpIHtcbiAgICBpbnNlcnQodGFyZ2V0U3RhcnQsIHRhcmdldCwgYW5jaG9yKTtcbiAgICBpbnNlcnQodGFyZ2V0QW5jaG9yLCB0YXJnZXQsIGFuY2hvcik7XG4gIH1cbiAgcmV0dXJuIHRhcmdldEFuY2hvcjtcbn1cblxuY29uc3QgbGVhdmVDYktleSA9IC8qIEBfX1BVUkVfXyAqLyBTeW1ib2woXCJfbGVhdmVDYlwiKTtcbmNvbnN0IGVudGVyQ2JLZXkgPSAvKiBAX19QVVJFX18gKi8gU3ltYm9sKFwiX2VudGVyQ2JcIik7XG5mdW5jdGlvbiB1c2VUcmFuc2l0aW9uU3RhdGUoKSB7XG4gIGNvbnN0IHN0YXRlID0ge1xuICAgIGlzTW91bnRlZDogZmFsc2UsXG4gICAgaXNMZWF2aW5nOiBmYWxzZSxcbiAgICBpc1VubW91bnRpbmc6IGZhbHNlLFxuICAgIGxlYXZpbmdWTm9kZXM6IC8qIEBfX1BVUkVfXyAqLyBuZXcgTWFwKClcbiAgfTtcbiAgb25Nb3VudGVkKCgpID0+IHtcbiAgICBzdGF0ZS5pc01vdW50ZWQgPSB0cnVlO1xuICB9KTtcbiAgb25CZWZvcmVVbm1vdW50KCgpID0+IHtcbiAgICBzdGF0ZS5pc1VubW91bnRpbmcgPSB0cnVlO1xuICB9KTtcbiAgcmV0dXJuIHN0YXRlO1xufVxuY29uc3QgVHJhbnNpdGlvbkhvb2tWYWxpZGF0b3IgPSBbRnVuY3Rpb24sIEFycmF5XTtcbmNvbnN0IEJhc2VUcmFuc2l0aW9uUHJvcHNWYWxpZGF0b3JzID0ge1xuICBtb2RlOiBTdHJpbmcsXG4gIGFwcGVhcjogQm9vbGVhbixcbiAgcGVyc2lzdGVkOiBCb29sZWFuLFxuICAvLyBlbnRlclxuICBvbkJlZm9yZUVudGVyOiBUcmFuc2l0aW9uSG9va1ZhbGlkYXRvcixcbiAgb25FbnRlcjogVHJhbnNpdGlvbkhvb2tWYWxpZGF0b3IsXG4gIG9uQWZ0ZXJFbnRlcjogVHJhbnNpdGlvbkhvb2tWYWxpZGF0b3IsXG4gIG9uRW50ZXJDYW5jZWxsZWQ6IFRyYW5zaXRpb25Ib29rVmFsaWRhdG9yLFxuICAvLyBsZWF2ZVxuICBvbkJlZm9yZUxlYXZlOiBUcmFuc2l0aW9uSG9va1ZhbGlkYXRvcixcbiAgb25MZWF2ZTogVHJhbnNpdGlvbkhvb2tWYWxpZGF0b3IsXG4gIG9uQWZ0ZXJMZWF2ZTogVHJhbnNpdGlvbkhvb2tWYWxpZGF0b3IsXG4gIG9uTGVhdmVDYW5jZWxsZWQ6IFRyYW5zaXRpb25Ib29rVmFsaWRhdG9yLFxuICAvLyBhcHBlYXJcbiAgb25CZWZvcmVBcHBlYXI6IFRyYW5zaXRpb25Ib29rVmFsaWRhdG9yLFxuICBvbkFwcGVhcjogVHJhbnNpdGlvbkhvb2tWYWxpZGF0b3IsXG4gIG9uQWZ0ZXJBcHBlYXI6IFRyYW5zaXRpb25Ib29rVmFsaWRhdG9yLFxuICBvbkFwcGVhckNhbmNlbGxlZDogVHJhbnNpdGlvbkhvb2tWYWxpZGF0b3Jcbn07XG5jb25zdCByZWN1cnNpdmVHZXRTdWJ0cmVlID0gKGluc3RhbmNlKSA9PiB7XG4gIGNvbnN0IHN1YlRyZWUgPSBpbnN0YW5jZS5zdWJUcmVlO1xuICByZXR1cm4gc3ViVHJlZS5jb21wb25lbnQgPyByZWN1cnNpdmVHZXRTdWJ0cmVlKHN1YlRyZWUuY29tcG9uZW50KSA6IHN1YlRyZWU7XG59O1xuY29uc3QgQmFzZVRyYW5zaXRpb25JbXBsID0ge1xuICBuYW1lOiBgQmFzZVRyYW5zaXRpb25gLFxuICBwcm9wczogQmFzZVRyYW5zaXRpb25Qcm9wc1ZhbGlkYXRvcnMsXG4gIHNldHVwKHByb3BzLCB7IHNsb3RzIH0pIHtcbiAgICBjb25zdCBpbnN0YW5jZSA9IGdldEN1cnJlbnRJbnN0YW5jZSgpO1xuICAgIGNvbnN0IHN0YXRlID0gdXNlVHJhbnNpdGlvblN0YXRlKCk7XG4gICAgcmV0dXJuICgpID0+IHtcbiAgICAgIGNvbnN0IGNoaWxkcmVuID0gc2xvdHMuZGVmYXVsdCAmJiBnZXRUcmFuc2l0aW9uUmF3Q2hpbGRyZW4oc2xvdHMuZGVmYXVsdCgpLCB0cnVlKTtcbiAgICAgIGlmICghY2hpbGRyZW4gfHwgIWNoaWxkcmVuLmxlbmd0aCkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBjb25zdCBjaGlsZCA9IGZpbmROb25Db21tZW50Q2hpbGQoY2hpbGRyZW4pO1xuICAgICAgY29uc3QgcmF3UHJvcHMgPSB0b1Jhdyhwcm9wcyk7XG4gICAgICBjb25zdCB7IG1vZGUgfSA9IHJhd1Byb3BzO1xuICAgICAgaWYgKCEhKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSBcInByb2R1Y3Rpb25cIikgJiYgbW9kZSAmJiBtb2RlICE9PSBcImluLW91dFwiICYmIG1vZGUgIT09IFwib3V0LWluXCIgJiYgbW9kZSAhPT0gXCJkZWZhdWx0XCIpIHtcbiAgICAgICAgd2FybiQxKGBpbnZhbGlkIDx0cmFuc2l0aW9uPiBtb2RlOiAke21vZGV9YCk7XG4gICAgICB9XG4gICAgICBpZiAoc3RhdGUuaXNMZWF2aW5nKSB7XG4gICAgICAgIHJldHVybiBlbXB0eVBsYWNlaG9sZGVyKGNoaWxkKTtcbiAgICAgIH1cbiAgICAgIGNvbnN0IGlubmVyQ2hpbGQgPSBnZXRJbm5lckNoaWxkJDEoY2hpbGQpO1xuICAgICAgaWYgKCFpbm5lckNoaWxkKSB7XG4gICAgICAgIHJldHVybiBlbXB0eVBsYWNlaG9sZGVyKGNoaWxkKTtcbiAgICAgIH1cbiAgICAgIGxldCBlbnRlckhvb2tzID0gcmVzb2x2ZVRyYW5zaXRpb25Ib29rcyhcbiAgICAgICAgaW5uZXJDaGlsZCxcbiAgICAgICAgcmF3UHJvcHMsXG4gICAgICAgIHN0YXRlLFxuICAgICAgICBpbnN0YW5jZSxcbiAgICAgICAgLy8gIzExMDYxLCBlbnN1cmUgZW50ZXJIb29rcyBpcyBmcmVzaCBhZnRlciBjbG9uZVxuICAgICAgICAoaG9va3MpID0+IGVudGVySG9va3MgPSBob29rc1xuICAgICAgKTtcbiAgICAgIGlmIChpbm5lckNoaWxkLnR5cGUgIT09IENvbW1lbnQpIHtcbiAgICAgICAgc2V0VHJhbnNpdGlvbkhvb2tzKGlubmVyQ2hpbGQsIGVudGVySG9va3MpO1xuICAgICAgfVxuICAgICAgbGV0IG9sZElubmVyQ2hpbGQgPSBpbnN0YW5jZS5zdWJUcmVlICYmIGdldElubmVyQ2hpbGQkMShpbnN0YW5jZS5zdWJUcmVlKTtcbiAgICAgIGlmIChvbGRJbm5lckNoaWxkICYmIG9sZElubmVyQ2hpbGQudHlwZSAhPT0gQ29tbWVudCAmJiAhaXNTYW1lVk5vZGVUeXBlKG9sZElubmVyQ2hpbGQsIGlubmVyQ2hpbGQpICYmIHJlY3Vyc2l2ZUdldFN1YnRyZWUoaW5zdGFuY2UpLnR5cGUgIT09IENvbW1lbnQpIHtcbiAgICAgICAgbGV0IGxlYXZpbmdIb29rcyA9IHJlc29sdmVUcmFuc2l0aW9uSG9va3MoXG4gICAgICAgICAgb2xkSW5uZXJDaGlsZCxcbiAgICAgICAgICByYXdQcm9wcyxcbiAgICAgICAgICBzdGF0ZSxcbiAgICAgICAgICBpbnN0YW5jZVxuICAgICAgICApO1xuICAgICAgICBzZXRUcmFuc2l0aW9uSG9va3Mob2xkSW5uZXJDaGlsZCwgbGVhdmluZ0hvb2tzKTtcbiAgICAgICAgaWYgKG1vZGUgPT09IFwib3V0LWluXCIgJiYgaW5uZXJDaGlsZC50eXBlICE9PSBDb21tZW50KSB7XG4gICAgICAgICAgc3RhdGUuaXNMZWF2aW5nID0gdHJ1ZTtcbiAgICAgICAgICBsZWF2aW5nSG9va3MuYWZ0ZXJMZWF2ZSA9ICgpID0+IHtcbiAgICAgICAgICAgIHN0YXRlLmlzTGVhdmluZyA9IGZhbHNlO1xuICAgICAgICAgICAgaWYgKCEoaW5zdGFuY2Uuam9iLmZsYWdzICYgOCkpIHtcbiAgICAgICAgICAgICAgaW5zdGFuY2UudXBkYXRlKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBkZWxldGUgbGVhdmluZ0hvb2tzLmFmdGVyTGVhdmU7XG4gICAgICAgICAgICBvbGRJbm5lckNoaWxkID0gdm9pZCAwO1xuICAgICAgICAgIH07XG4gICAgICAgICAgcmV0dXJuIGVtcHR5UGxhY2Vob2xkZXIoY2hpbGQpO1xuICAgICAgICB9IGVsc2UgaWYgKG1vZGUgPT09IFwiaW4tb3V0XCIgJiYgaW5uZXJDaGlsZC50eXBlICE9PSBDb21tZW50KSB7XG4gICAgICAgICAgbGVhdmluZ0hvb2tzLmRlbGF5TGVhdmUgPSAoZWwsIGVhcmx5UmVtb3ZlLCBkZWxheWVkTGVhdmUpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGxlYXZpbmdWTm9kZXNDYWNoZSA9IGdldExlYXZpbmdOb2Rlc0ZvclR5cGUoXG4gICAgICAgICAgICAgIHN0YXRlLFxuICAgICAgICAgICAgICBvbGRJbm5lckNoaWxkXG4gICAgICAgICAgICApO1xuICAgICAgICAgICAgbGVhdmluZ1ZOb2Rlc0NhY2hlW1N0cmluZyhvbGRJbm5lckNoaWxkLmtleSldID0gb2xkSW5uZXJDaGlsZDtcbiAgICAgICAgICAgIGVsW2xlYXZlQ2JLZXldID0gKCkgPT4ge1xuICAgICAgICAgICAgICBlYXJseVJlbW92ZSgpO1xuICAgICAgICAgICAgICBlbFtsZWF2ZUNiS2V5XSA9IHZvaWQgMDtcbiAgICAgICAgICAgICAgZGVsZXRlIGVudGVySG9va3MuZGVsYXllZExlYXZlO1xuICAgICAgICAgICAgICBvbGRJbm5lckNoaWxkID0gdm9pZCAwO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIGVudGVySG9va3MuZGVsYXllZExlYXZlID0gKCkgPT4ge1xuICAgICAgICAgICAgICBkZWxheWVkTGVhdmUoKTtcbiAgICAgICAgICAgICAgZGVsZXRlIGVudGVySG9va3MuZGVsYXllZExlYXZlO1xuICAgICAgICAgICAgICBvbGRJbm5lckNoaWxkID0gdm9pZCAwO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICB9O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIG9sZElubmVyQ2hpbGQgPSB2b2lkIDA7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSBpZiAob2xkSW5uZXJDaGlsZCkge1xuICAgICAgICBvbGRJbm5lckNoaWxkID0gdm9pZCAwO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGNoaWxkO1xuICAgIH07XG4gIH1cbn07XG5mdW5jdGlvbiBmaW5kTm9uQ29tbWVudENoaWxkKGNoaWxkcmVuKSB7XG4gIGxldCBjaGlsZCA9IGNoaWxkcmVuWzBdO1xuICBpZiAoY2hpbGRyZW4ubGVuZ3RoID4gMSkge1xuICAgIGxldCBoYXNGb3VuZCA9IGZhbHNlO1xuICAgIGZvciAoY29uc3QgYyBvZiBjaGlsZHJlbikge1xuICAgICAgaWYgKGMudHlwZSAhPT0gQ29tbWVudCkge1xuICAgICAgICBpZiAoISEocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09IFwicHJvZHVjdGlvblwiKSAmJiBoYXNGb3VuZCkge1xuICAgICAgICAgIHdhcm4kMShcbiAgICAgICAgICAgIFwiPHRyYW5zaXRpb24+IGNhbiBvbmx5IGJlIHVzZWQgb24gYSBzaW5nbGUgZWxlbWVudCBvciBjb21wb25lbnQuIFVzZSA8dHJhbnNpdGlvbi1ncm91cD4gZm9yIGxpc3RzLlwiXG4gICAgICAgICAgKTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICBjaGlsZCA9IGM7XG4gICAgICAgIGhhc0ZvdW5kID0gdHJ1ZTtcbiAgICAgICAgaWYgKCEhIShwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gXCJwcm9kdWN0aW9uXCIpKSBicmVhaztcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgcmV0dXJuIGNoaWxkO1xufVxuY29uc3QgQmFzZVRyYW5zaXRpb24gPSBCYXNlVHJhbnNpdGlvbkltcGw7XG5mdW5jdGlvbiBnZXRMZWF2aW5nTm9kZXNGb3JUeXBlKHN0YXRlLCB2bm9kZSkge1xuICBjb25zdCB7IGxlYXZpbmdWTm9kZXMgfSA9IHN0YXRlO1xuICBsZXQgbGVhdmluZ1ZOb2Rlc0NhY2hlID0gbGVhdmluZ1ZOb2Rlcy5nZXQodm5vZGUudHlwZSk7XG4gIGlmICghbGVhdmluZ1ZOb2Rlc0NhY2hlKSB7XG4gICAgbGVhdmluZ1ZOb2Rlc0NhY2hlID0gLyogQF9fUFVSRV9fICovIE9iamVjdC5jcmVhdGUobnVsbCk7XG4gICAgbGVhdmluZ1ZOb2Rlcy5zZXQodm5vZGUudHlwZSwgbGVhdmluZ1ZOb2Rlc0NhY2hlKTtcbiAgfVxuICByZXR1cm4gbGVhdmluZ1ZOb2Rlc0NhY2hlO1xufVxuZnVuY3Rpb24gcmVzb2x2ZVRyYW5zaXRpb25Ib29rcyh2bm9kZSwgcHJvcHMsIHN0YXRlLCBpbnN0YW5jZSwgcG9zdENsb25lKSB7XG4gIGNvbnN0IHtcbiAgICBhcHBlYXIsXG4gICAgbW9kZSxcbiAgICBwZXJzaXN0ZWQgPSBmYWxzZSxcbiAgICBvbkJlZm9yZUVudGVyLFxuICAgIG9uRW50ZXIsXG4gICAgb25BZnRlckVudGVyLFxuICAgIG9uRW50ZXJDYW5jZWxsZWQsXG4gICAgb25CZWZvcmVMZWF2ZSxcbiAgICBvbkxlYXZlLFxuICAgIG9uQWZ0ZXJMZWF2ZSxcbiAgICBvbkxlYXZlQ2FuY2VsbGVkLFxuICAgIG9uQmVmb3JlQXBwZWFyLFxuICAgIG9uQXBwZWFyLFxuICAgIG9uQWZ0ZXJBcHBlYXIsXG4gICAgb25BcHBlYXJDYW5jZWxsZWRcbiAgfSA9IHByb3BzO1xuICBjb25zdCBrZXkgPSBTdHJpbmcodm5vZGUua2V5KTtcbiAgY29uc3QgbGVhdmluZ1ZOb2Rlc0NhY2hlID0gZ2V0TGVhdmluZ05vZGVzRm9yVHlwZShzdGF0ZSwgdm5vZGUpO1xuICBjb25zdCBjYWxsSG9vayA9IChob29rLCBhcmdzKSA9PiB7XG4gICAgaG9vayAmJiBjYWxsV2l0aEFzeW5jRXJyb3JIYW5kbGluZyhcbiAgICAgIGhvb2ssXG4gICAgICBpbnN0YW5jZSxcbiAgICAgIDksXG4gICAgICBhcmdzXG4gICAgKTtcbiAgfTtcbiAgY29uc3QgY2FsbEFzeW5jSG9vayA9IChob29rLCBhcmdzKSA9PiB7XG4gICAgY29uc3QgZG9uZSA9IGFyZ3NbMV07XG4gICAgY2FsbEhvb2soaG9vaywgYXJncyk7XG4gICAgaWYgKGlzQXJyYXkoaG9vaykpIHtcbiAgICAgIGlmIChob29rLmV2ZXJ5KChob29rMikgPT4gaG9vazIubGVuZ3RoIDw9IDEpKSBkb25lKCk7XG4gICAgfSBlbHNlIGlmIChob29rLmxlbmd0aCA8PSAxKSB7XG4gICAgICBkb25lKCk7XG4gICAgfVxuICB9O1xuICBjb25zdCBob29rcyA9IHtcbiAgICBtb2RlLFxuICAgIHBlcnNpc3RlZCxcbiAgICBiZWZvcmVFbnRlcihlbCkge1xuICAgICAgbGV0IGhvb2sgPSBvbkJlZm9yZUVudGVyO1xuICAgICAgaWYgKCFzdGF0ZS5pc01vdW50ZWQpIHtcbiAgICAgICAgaWYgKGFwcGVhcikge1xuICAgICAgICAgIGhvb2sgPSBvbkJlZm9yZUFwcGVhciB8fCBvbkJlZm9yZUVudGVyO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgaWYgKGVsW2xlYXZlQ2JLZXldKSB7XG4gICAgICAgIGVsW2xlYXZlQ2JLZXldKFxuICAgICAgICAgIHRydWVcbiAgICAgICAgICAvKiBjYW5jZWxsZWQgKi9cbiAgICAgICAgKTtcbiAgICAgIH1cbiAgICAgIGNvbnN0IGxlYXZpbmdWTm9kZSA9IGxlYXZpbmdWTm9kZXNDYWNoZVtrZXldO1xuICAgICAgaWYgKGxlYXZpbmdWTm9kZSAmJiBpc1NhbWVWTm9kZVR5cGUodm5vZGUsIGxlYXZpbmdWTm9kZSkgJiYgbGVhdmluZ1ZOb2RlLmVsW2xlYXZlQ2JLZXldKSB7XG4gICAgICAgIGxlYXZpbmdWTm9kZS5lbFtsZWF2ZUNiS2V5XSgpO1xuICAgICAgfVxuICAgICAgY2FsbEhvb2soaG9vaywgW2VsXSk7XG4gICAgfSxcbiAgICBlbnRlcihlbCkge1xuICAgICAgbGV0IGhvb2sgPSBvbkVudGVyO1xuICAgICAgbGV0IGFmdGVySG9vayA9IG9uQWZ0ZXJFbnRlcjtcbiAgICAgIGxldCBjYW5jZWxIb29rID0gb25FbnRlckNhbmNlbGxlZDtcbiAgICAgIGlmICghc3RhdGUuaXNNb3VudGVkKSB7XG4gICAgICAgIGlmIChhcHBlYXIpIHtcbiAgICAgICAgICBob29rID0gb25BcHBlYXIgfHwgb25FbnRlcjtcbiAgICAgICAgICBhZnRlckhvb2sgPSBvbkFmdGVyQXBwZWFyIHx8IG9uQWZ0ZXJFbnRlcjtcbiAgICAgICAgICBjYW5jZWxIb29rID0gb25BcHBlYXJDYW5jZWxsZWQgfHwgb25FbnRlckNhbmNlbGxlZDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGxldCBjYWxsZWQgPSBmYWxzZTtcbiAgICAgIGVsW2VudGVyQ2JLZXldID0gKGNhbmNlbGxlZCkgPT4ge1xuICAgICAgICBpZiAoY2FsbGVkKSByZXR1cm47XG4gICAgICAgIGNhbGxlZCA9IHRydWU7XG4gICAgICAgIGlmIChjYW5jZWxsZWQpIHtcbiAgICAgICAgICBjYWxsSG9vayhjYW5jZWxIb29rLCBbZWxdKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBjYWxsSG9vayhhZnRlckhvb2ssIFtlbF0pO1xuICAgICAgICB9XG4gICAgICAgIGlmIChob29rcy5kZWxheWVkTGVhdmUpIHtcbiAgICAgICAgICBob29rcy5kZWxheWVkTGVhdmUoKTtcbiAgICAgICAgfVxuICAgICAgICBlbFtlbnRlckNiS2V5XSA9IHZvaWQgMDtcbiAgICAgIH07XG4gICAgICBjb25zdCBkb25lID0gZWxbZW50ZXJDYktleV0uYmluZChudWxsLCBmYWxzZSk7XG4gICAgICBpZiAoaG9vaykge1xuICAgICAgICBjYWxsQXN5bmNIb29rKGhvb2ssIFtlbCwgZG9uZV0pO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgZG9uZSgpO1xuICAgICAgfVxuICAgIH0sXG4gICAgbGVhdmUoZWwsIHJlbW92ZSkge1xuICAgICAgY29uc3Qga2V5MiA9IFN0cmluZyh2bm9kZS5rZXkpO1xuICAgICAgaWYgKGVsW2VudGVyQ2JLZXldKSB7XG4gICAgICAgIGVsW2VudGVyQ2JLZXldKFxuICAgICAgICAgIHRydWVcbiAgICAgICAgICAvKiBjYW5jZWxsZWQgKi9cbiAgICAgICAgKTtcbiAgICAgIH1cbiAgICAgIGlmIChzdGF0ZS5pc1VubW91bnRpbmcpIHtcbiAgICAgICAgcmV0dXJuIHJlbW92ZSgpO1xuICAgICAgfVxuICAgICAgY2FsbEhvb2sob25CZWZvcmVMZWF2ZSwgW2VsXSk7XG4gICAgICBsZXQgY2FsbGVkID0gZmFsc2U7XG4gICAgICBlbFtsZWF2ZUNiS2V5XSA9IChjYW5jZWxsZWQpID0+IHtcbiAgICAgICAgaWYgKGNhbGxlZCkgcmV0dXJuO1xuICAgICAgICBjYWxsZWQgPSB0cnVlO1xuICAgICAgICByZW1vdmUoKTtcbiAgICAgICAgaWYgKGNhbmNlbGxlZCkge1xuICAgICAgICAgIGNhbGxIb29rKG9uTGVhdmVDYW5jZWxsZWQsIFtlbF0pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGNhbGxIb29rKG9uQWZ0ZXJMZWF2ZSwgW2VsXSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxbbGVhdmVDYktleV0gPSB2b2lkIDA7XG4gICAgICAgIGlmIChsZWF2aW5nVk5vZGVzQ2FjaGVba2V5Ml0gPT09IHZub2RlKSB7XG4gICAgICAgICAgZGVsZXRlIGxlYXZpbmdWTm9kZXNDYWNoZVtrZXkyXTtcbiAgICAgICAgfVxuICAgICAgfTtcbiAgICAgIGNvbnN0IGRvbmUgPSBlbFtsZWF2ZUNiS2V5XS5iaW5kKG51bGwsIGZhbHNlKTtcbiAgICAgIGxlYXZpbmdWTm9kZXNDYWNoZVtrZXkyXSA9IHZub2RlO1xuICAgICAgaWYgKG9uTGVhdmUpIHtcbiAgICAgICAgY2FsbEFzeW5jSG9vayhvbkxlYXZlLCBbZWwsIGRvbmVdKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGRvbmUoKTtcbiAgICAgIH1cbiAgICB9LFxuICAgIGNsb25lKHZub2RlMikge1xuICAgICAgY29uc3QgaG9va3MyID0gcmVzb2x2ZVRyYW5zaXRpb25Ib29rcyhcbiAgICAgICAgdm5vZGUyLFxuICAgICAgICBwcm9wcyxcbiAgICAgICAgc3RhdGUsXG4gICAgICAgIGluc3RhbmNlLFxuICAgICAgICBwb3N0Q2xvbmVcbiAgICAgICk7XG4gICAgICBpZiAocG9zdENsb25lKSBwb3N0Q2xvbmUoaG9va3MyKTtcbiAgICAgIHJldHVybiBob29rczI7XG4gICAgfVxuICB9O1xuICByZXR1cm4gaG9va3M7XG59XG5mdW5jdGlvbiBlbXB0eVBsYWNlaG9sZGVyKHZub2RlKSB7XG4gIGlmIChpc0tlZXBBbGl2ZSh2bm9kZSkpIHtcbiAgICB2bm9kZSA9IGNsb25lVk5vZGUodm5vZGUpO1xuICAgIHZub2RlLmNoaWxkcmVuID0gbnVsbDtcbiAgICByZXR1cm4gdm5vZGU7XG4gIH1cbn1cbmZ1bmN0aW9uIGdldElubmVyQ2hpbGQkMSh2bm9kZSkge1xuICBpZiAoIWlzS2VlcEFsaXZlKHZub2RlKSkge1xuICAgIGlmIChpc1RlbGVwb3J0KHZub2RlLnR5cGUpICYmIHZub2RlLmNoaWxkcmVuKSB7XG4gICAgICByZXR1cm4gZmluZE5vbkNvbW1lbnRDaGlsZCh2bm9kZS5jaGlsZHJlbik7XG4gICAgfVxuICAgIHJldHVybiB2bm9kZTtcbiAgfVxuICBpZiAodm5vZGUuY29tcG9uZW50KSB7XG4gICAgcmV0dXJuIHZub2RlLmNvbXBvbmVudC5zdWJUcmVlO1xuICB9XG4gIGNvbnN0IHsgc2hhcGVGbGFnLCBjaGlsZHJlbiB9ID0gdm5vZGU7XG4gIGlmIChjaGlsZHJlbikge1xuICAgIGlmIChzaGFwZUZsYWcgJiAxNikge1xuICAgICAgcmV0dXJuIGNoaWxkcmVuWzBdO1xuICAgIH1cbiAgICBpZiAoc2hhcGVGbGFnICYgMzIgJiYgaXNGdW5jdGlvbihjaGlsZHJlbi5kZWZhdWx0KSkge1xuICAgICAgcmV0dXJuIGNoaWxkcmVuLmRlZmF1bHQoKTtcbiAgICB9XG4gIH1cbn1cbmZ1bmN0aW9uIHNldFRyYW5zaXRpb25Ib29rcyh2bm9kZSwgaG9va3MpIHtcbiAgaWYgKHZub2RlLnNoYXBlRmxhZyAmIDYgJiYgdm5vZGUuY29tcG9uZW50KSB7XG4gICAgdm5vZGUudHJhbnNpdGlvbiA9IGhvb2tzO1xuICAgIHNldFRyYW5zaXRpb25Ib29rcyh2bm9kZS5jb21wb25lbnQuc3ViVHJlZSwgaG9va3MpO1xuICB9IGVsc2UgaWYgKHZub2RlLnNoYXBlRmxhZyAmIDEyOCkge1xuICAgIHZub2RlLnNzQ29udGVudC50cmFuc2l0aW9uID0gaG9va3MuY2xvbmUodm5vZGUuc3NDb250ZW50KTtcbiAgICB2bm9kZS5zc0ZhbGxiYWNrLnRyYW5zaXRpb24gPSBob29rcy5jbG9uZSh2bm9kZS5zc0ZhbGxiYWNrKTtcbiAgfSBlbHNlIHtcbiAgICB2bm9kZS50cmFuc2l0aW9uID0gaG9va3M7XG4gIH1cbn1cbmZ1bmN0aW9uIGdldFRyYW5zaXRpb25SYXdDaGlsZHJlbihjaGlsZHJlbiwga2VlcENvbW1lbnQgPSBmYWxzZSwgcGFyZW50S2V5KSB7XG4gIGxldCByZXQgPSBbXTtcbiAgbGV0IGtleWVkRnJhZ21lbnRDb3VudCA9IDA7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgY2hpbGRyZW4ubGVuZ3RoOyBpKyspIHtcbiAgICBsZXQgY2hpbGQgPSBjaGlsZHJlbltpXTtcbiAgICBjb25zdCBrZXkgPSBwYXJlbnRLZXkgPT0gbnVsbCA/IGNoaWxkLmtleSA6IFN0cmluZyhwYXJlbnRLZXkpICsgU3RyaW5nKGNoaWxkLmtleSAhPSBudWxsID8gY2hpbGQua2V5IDogaSk7XG4gICAgaWYgKGNoaWxkLnR5cGUgPT09IEZyYWdtZW50KSB7XG4gICAgICBpZiAoY2hpbGQucGF0Y2hGbGFnICYgMTI4KSBrZXllZEZyYWdtZW50Q291bnQrKztcbiAgICAgIHJldCA9IHJldC5jb25jYXQoXG4gICAgICAgIGdldFRyYW5zaXRpb25SYXdDaGlsZHJlbihjaGlsZC5jaGlsZHJlbiwga2VlcENvbW1lbnQsIGtleSlcbiAgICAgICk7XG4gICAgfSBlbHNlIGlmIChrZWVwQ29tbWVudCB8fCBjaGlsZC50eXBlICE9PSBDb21tZW50KSB7XG4gICAgICByZXQucHVzaChrZXkgIT0gbnVsbCA/IGNsb25lVk5vZGUoY2hpbGQsIHsga2V5IH0pIDogY2hpbGQpO1xuICAgIH1cbiAgfVxuICBpZiAoa2V5ZWRGcmFnbWVudENvdW50ID4gMSkge1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcmV0Lmxlbmd0aDsgaSsrKSB7XG4gICAgICByZXRbaV0ucGF0Y2hGbGFnID0gLTI7XG4gICAgfVxuICB9XG4gIHJldHVybiByZXQ7XG59XG5cbi8vIEBfX05PX1NJREVfRUZGRUNUU19fXG5mdW5jdGlvbiBkZWZpbmVDb21wb25lbnQob3B0aW9ucywgZXh0cmFPcHRpb25zKSB7XG4gIHJldHVybiBpc0Z1bmN0aW9uKG9wdGlvbnMpID8gKFxuICAgIC8vICM4MjM2OiBleHRlbmQgY2FsbCBhbmQgb3B0aW9ucy5uYW1lIGFjY2VzcyBhcmUgY29uc2lkZXJlZCBzaWRlLWVmZmVjdHNcbiAgICAvLyBieSBSb2xsdXAsIHNvIHdlIGhhdmUgdG8gd3JhcCBpdCBpbiBhIHB1cmUtYW5ub3RhdGVkIElJRkUuXG4gICAgLyogQF9fUFVSRV9fICovICgoKSA9PiBleHRlbmQoeyBuYW1lOiBvcHRpb25zLm5hbWUgfSwgZXh0cmFPcHRpb25zLCB7IHNldHVwOiBvcHRpb25zIH0pKSgpXG4gICkgOiBvcHRpb25zO1xufVxuXG5mdW5jdGlvbiB1c2VJZCgpIHtcbiAgY29uc3QgaSA9IGdldEN1cnJlbnRJbnN0YW5jZSgpO1xuICBpZiAoaSkge1xuICAgIHJldHVybiAoaS5hcHBDb250ZXh0LmNvbmZpZy5pZFByZWZpeCB8fCBcInZcIikgKyBcIi1cIiArIGkuaWRzWzBdICsgaS5pZHNbMV0rKztcbiAgfSBlbHNlIGlmICghIShwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gXCJwcm9kdWN0aW9uXCIpKSB7XG4gICAgd2FybiQxKFxuICAgICAgYHVzZUlkKCkgaXMgY2FsbGVkIHdoZW4gdGhlcmUgaXMgbm8gYWN0aXZlIGNvbXBvbmVudCBpbnN0YW5jZSB0byBiZSBhc3NvY2lhdGVkIHdpdGguYFxuICAgICk7XG4gIH1cbiAgcmV0dXJuIFwiXCI7XG59XG5mdW5jdGlvbiBtYXJrQXN5bmNCb3VuZGFyeShpbnN0YW5jZSkge1xuICBpbnN0YW5jZS5pZHMgPSBbaW5zdGFuY2UuaWRzWzBdICsgaW5zdGFuY2UuaWRzWzJdKysgKyBcIi1cIiwgMCwgMF07XG59XG5cbmNvbnN0IGtub3duVGVtcGxhdGVSZWZzID0gLyogQF9fUFVSRV9fICovIG5ldyBXZWFrU2V0KCk7XG5mdW5jdGlvbiB1c2VUZW1wbGF0ZVJlZihrZXkpIHtcbiAgY29uc3QgaSA9IGdldEN1cnJlbnRJbnN0YW5jZSgpO1xuICBjb25zdCByID0gc2hhbGxvd1JlZihudWxsKTtcbiAgaWYgKGkpIHtcbiAgICBjb25zdCByZWZzID0gaS5yZWZzID09PSBFTVBUWV9PQkogPyBpLnJlZnMgPSB7fSA6IGkucmVmcztcbiAgICBpZiAoISEocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09IFwicHJvZHVjdGlvblwiKSAmJiBpc1RlbXBsYXRlUmVmS2V5KHJlZnMsIGtleSkpIHtcbiAgICAgIHdhcm4kMShgdXNlVGVtcGxhdGVSZWYoJyR7a2V5fScpIGFscmVhZHkgZXhpc3RzLmApO1xuICAgIH0gZWxzZSB7XG4gICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkocmVmcywga2V5LCB7XG4gICAgICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgICAgIGdldDogKCkgPT4gci52YWx1ZSxcbiAgICAgICAgc2V0OiAodmFsKSA9PiByLnZhbHVlID0gdmFsXG4gICAgICB9KTtcbiAgICB9XG4gIH0gZWxzZSBpZiAoISEocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09IFwicHJvZHVjdGlvblwiKSkge1xuICAgIHdhcm4kMShcbiAgICAgIGB1c2VUZW1wbGF0ZVJlZigpIGlzIGNhbGxlZCB3aGVuIHRoZXJlIGlzIG5vIGFjdGl2ZSBjb21wb25lbnQgaW5zdGFuY2UgdG8gYmUgYXNzb2NpYXRlZCB3aXRoLmBcbiAgICApO1xuICB9XG4gIGNvbnN0IHJldCA9ICEhKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSBcInByb2R1Y3Rpb25cIikgPyByZWFkb25seShyKSA6IHI7XG4gIGlmICghIShwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gXCJwcm9kdWN0aW9uXCIpKSB7XG4gICAga25vd25UZW1wbGF0ZVJlZnMuYWRkKHJldCk7XG4gIH1cbiAgcmV0dXJuIHJldDtcbn1cbmZ1bmN0aW9uIGlzVGVtcGxhdGVSZWZLZXkocmVmcywga2V5KSB7XG4gIGxldCBkZXNjO1xuICByZXR1cm4gISEoKGRlc2MgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKHJlZnMsIGtleSkpICYmICFkZXNjLmNvbmZpZ3VyYWJsZSk7XG59XG5cbmNvbnN0IHBlbmRpbmdTZXRSZWZNYXAgPSAvKiBAX19QVVJFX18gKi8gbmV3IFdlYWtNYXAoKTtcbmZ1bmN0aW9uIHNldFJlZihyYXdSZWYsIG9sZFJhd1JlZiwgcGFyZW50U3VzcGVuc2UsIHZub2RlLCBpc1VubW91bnQgPSBmYWxzZSkge1xuICBpZiAoaXNBcnJheShyYXdSZWYpKSB7XG4gICAgcmF3UmVmLmZvckVhY2goXG4gICAgICAociwgaSkgPT4gc2V0UmVmKFxuICAgICAgICByLFxuICAgICAgICBvbGRSYXdSZWYgJiYgKGlzQXJyYXkob2xkUmF3UmVmKSA/IG9sZFJhd1JlZltpXSA6IG9sZFJhd1JlZiksXG4gICAgICAgIHBhcmVudFN1c3BlbnNlLFxuICAgICAgICB2bm9kZSxcbiAgICAgICAgaXNVbm1vdW50XG4gICAgICApXG4gICAgKTtcbiAgICByZXR1cm47XG4gIH1cbiAgaWYgKGlzQXN5bmNXcmFwcGVyKHZub2RlKSAmJiAhaXNVbm1vdW50KSB7XG4gICAgaWYgKHZub2RlLnNoYXBlRmxhZyAmIDUxMiAmJiB2bm9kZS50eXBlLl9fYXN5bmNSZXNvbHZlZCAmJiB2bm9kZS5jb21wb25lbnQuc3ViVHJlZS5jb21wb25lbnQpIHtcbiAgICAgIHNldFJlZihyYXdSZWYsIG9sZFJhd1JlZiwgcGFyZW50U3VzcGVuc2UsIHZub2RlLmNvbXBvbmVudC5zdWJUcmVlKTtcbiAgICB9XG4gICAgcmV0dXJuO1xuICB9XG4gIGNvbnN0IHJlZlZhbHVlID0gdm5vZGUuc2hhcGVGbGFnICYgNCA/IGdldENvbXBvbmVudFB1YmxpY0luc3RhbmNlKHZub2RlLmNvbXBvbmVudCkgOiB2bm9kZS5lbDtcbiAgY29uc3QgdmFsdWUgPSBpc1VubW91bnQgPyBudWxsIDogcmVmVmFsdWU7XG4gIGNvbnN0IHsgaTogb3duZXIsIHI6IHJlZiB9ID0gcmF3UmVmO1xuICBpZiAoISEocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09IFwicHJvZHVjdGlvblwiKSAmJiAhb3duZXIpIHtcbiAgICB3YXJuJDEoXG4gICAgICBgTWlzc2luZyByZWYgb3duZXIgY29udGV4dC4gcmVmIGNhbm5vdCBiZSB1c2VkIG9uIGhvaXN0ZWQgdm5vZGVzLiBBIHZub2RlIHdpdGggcmVmIG11c3QgYmUgY3JlYXRlZCBpbnNpZGUgdGhlIHJlbmRlciBmdW5jdGlvbi5gXG4gICAgKTtcbiAgICByZXR1cm47XG4gIH1cbiAgY29uc3Qgb2xkUmVmID0gb2xkUmF3UmVmICYmIG9sZFJhd1JlZi5yO1xuICBjb25zdCByZWZzID0gb3duZXIucmVmcyA9PT0gRU1QVFlfT0JKID8gb3duZXIucmVmcyA9IHt9IDogb3duZXIucmVmcztcbiAgY29uc3Qgc2V0dXBTdGF0ZSA9IG93bmVyLnNldHVwU3RhdGU7XG4gIGNvbnN0IHJhd1NldHVwU3RhdGUgPSB0b1JhdyhzZXR1cFN0YXRlKTtcbiAgY29uc3QgY2FuU2V0U2V0dXBSZWYgPSBzZXR1cFN0YXRlID09PSBFTVBUWV9PQkogPyBOTyA6IChrZXkpID0+IHtcbiAgICBpZiAoISEocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09IFwicHJvZHVjdGlvblwiKSkge1xuICAgICAgaWYgKGhhc093bihyYXdTZXR1cFN0YXRlLCBrZXkpICYmICFpc1JlZihyYXdTZXR1cFN0YXRlW2tleV0pKSB7XG4gICAgICAgIHdhcm4kMShcbiAgICAgICAgICBgVGVtcGxhdGUgcmVmIFwiJHtrZXl9XCIgdXNlZCBvbiBhIG5vbi1yZWYgdmFsdWUuIEl0IHdpbGwgbm90IHdvcmsgaW4gdGhlIHByb2R1Y3Rpb24gYnVpbGQuYFxuICAgICAgICApO1xuICAgICAgfVxuICAgICAgaWYgKGtub3duVGVtcGxhdGVSZWZzLmhhcyhyYXdTZXR1cFN0YXRlW2tleV0pKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKGlzVGVtcGxhdGVSZWZLZXkocmVmcywga2V5KSkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICByZXR1cm4gaGFzT3duKHJhd1NldHVwU3RhdGUsIGtleSk7XG4gIH07XG4gIGNvbnN0IGNhblNldFJlZiA9IChyZWYyLCBrZXkpID0+IHtcbiAgICBpZiAoISEocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09IFwicHJvZHVjdGlvblwiKSAmJiBrbm93blRlbXBsYXRlUmVmcy5oYXMocmVmMikpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgaWYgKGtleSAmJiBpc1RlbXBsYXRlUmVmS2V5KHJlZnMsIGtleSkpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgcmV0dXJuIHRydWU7XG4gIH07XG4gIGlmIChvbGRSZWYgIT0gbnVsbCAmJiBvbGRSZWYgIT09IHJlZikge1xuICAgIGludmFsaWRhdGVQZW5kaW5nU2V0UmVmKG9sZFJhd1JlZik7XG4gICAgaWYgKGlzU3RyaW5nKG9sZFJlZikpIHtcbiAgICAgIHJlZnNbb2xkUmVmXSA9IG51bGw7XG4gICAgICBpZiAoY2FuU2V0U2V0dXBSZWYob2xkUmVmKSkge1xuICAgICAgICBzZXR1cFN0YXRlW29sZFJlZl0gPSBudWxsO1xuICAgICAgfVxuICAgIH0gZWxzZSBpZiAoaXNSZWYob2xkUmVmKSkge1xuICAgICAgY29uc3Qgb2xkUmF3UmVmQXRvbSA9IG9sZFJhd1JlZjtcbiAgICAgIGlmIChjYW5TZXRSZWYob2xkUmVmLCBvbGRSYXdSZWZBdG9tLmspKSB7XG4gICAgICAgIG9sZFJlZi52YWx1ZSA9IG51bGw7XG4gICAgICB9XG4gICAgICBpZiAob2xkUmF3UmVmQXRvbS5rKSByZWZzW29sZFJhd1JlZkF0b20ua10gPSBudWxsO1xuICAgIH1cbiAgfVxuICBpZiAoaXNGdW5jdGlvbihyZWYpKSB7XG4gICAgY2FsbFdpdGhFcnJvckhhbmRsaW5nKHJlZiwgb3duZXIsIDEyLCBbdmFsdWUsIHJlZnNdKTtcbiAgfSBlbHNlIHtcbiAgICBjb25zdCBfaXNTdHJpbmcgPSBpc1N0cmluZyhyZWYpO1xuICAgIGNvbnN0IF9pc1JlZiA9IGlzUmVmKHJlZik7XG4gICAgaWYgKF9pc1N0cmluZyB8fCBfaXNSZWYpIHtcbiAgICAgIGNvbnN0IGRvU2V0ID0gKCkgPT4ge1xuICAgICAgICBpZiAocmF3UmVmLmYpIHtcbiAgICAgICAgICBjb25zdCBleGlzdGluZyA9IF9pc1N0cmluZyA/IGNhblNldFNldHVwUmVmKHJlZikgPyBzZXR1cFN0YXRlW3JlZl0gOiByZWZzW3JlZl0gOiBjYW5TZXRSZWYocmVmKSB8fCAhcmF3UmVmLmsgPyByZWYudmFsdWUgOiByZWZzW3Jhd1JlZi5rXTtcbiAgICAgICAgICBpZiAoaXNVbm1vdW50KSB7XG4gICAgICAgICAgICBpc0FycmF5KGV4aXN0aW5nKSAmJiByZW1vdmUoZXhpc3RpbmcsIHJlZlZhbHVlKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgaWYgKCFpc0FycmF5KGV4aXN0aW5nKSkge1xuICAgICAgICAgICAgICBpZiAoX2lzU3RyaW5nKSB7XG4gICAgICAgICAgICAgICAgcmVmc1tyZWZdID0gW3JlZlZhbHVlXTtcbiAgICAgICAgICAgICAgICBpZiAoY2FuU2V0U2V0dXBSZWYocmVmKSkge1xuICAgICAgICAgICAgICAgICAgc2V0dXBTdGF0ZVtyZWZdID0gcmVmc1tyZWZdO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBjb25zdCBuZXdWYWwgPSBbcmVmVmFsdWVdO1xuICAgICAgICAgICAgICAgIGlmIChjYW5TZXRSZWYocmVmLCByYXdSZWYuaykpIHtcbiAgICAgICAgICAgICAgICAgIHJlZi52YWx1ZSA9IG5ld1ZhbDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKHJhd1JlZi5rKSByZWZzW3Jhd1JlZi5rXSA9IG5ld1ZhbDtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIGlmICghZXhpc3RpbmcuaW5jbHVkZXMocmVmVmFsdWUpKSB7XG4gICAgICAgICAgICAgIGV4aXN0aW5nLnB1c2gocmVmVmFsdWUpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIGlmIChfaXNTdHJpbmcpIHtcbiAgICAgICAgICByZWZzW3JlZl0gPSB2YWx1ZTtcbiAgICAgICAgICBpZiAoY2FuU2V0U2V0dXBSZWYocmVmKSkge1xuICAgICAgICAgICAgc2V0dXBTdGF0ZVtyZWZdID0gdmFsdWU7XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2UgaWYgKF9pc1JlZikge1xuICAgICAgICAgIGlmIChjYW5TZXRSZWYocmVmLCByYXdSZWYuaykpIHtcbiAgICAgICAgICAgIHJlZi52YWx1ZSA9IHZhbHVlO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAocmF3UmVmLmspIHJlZnNbcmF3UmVmLmtdID0gdmFsdWU7XG4gICAgICAgIH0gZWxzZSBpZiAoISEocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09IFwicHJvZHVjdGlvblwiKSkge1xuICAgICAgICAgIHdhcm4kMShcIkludmFsaWQgdGVtcGxhdGUgcmVmIHR5cGU6XCIsIHJlZiwgYCgke3R5cGVvZiByZWZ9KWApO1xuICAgICAgICB9XG4gICAgICB9O1xuICAgICAgaWYgKHZhbHVlKSB7XG4gICAgICAgIGNvbnN0IGpvYiA9ICgpID0+IHtcbiAgICAgICAgICBkb1NldCgpO1xuICAgICAgICAgIHBlbmRpbmdTZXRSZWZNYXAuZGVsZXRlKHJhd1JlZik7XG4gICAgICAgIH07XG4gICAgICAgIGpvYi5pZCA9IC0xO1xuICAgICAgICBwZW5kaW5nU2V0UmVmTWFwLnNldChyYXdSZWYsIGpvYik7XG4gICAgICAgIHF1ZXVlUG9zdFJlbmRlckVmZmVjdChqb2IsIHBhcmVudFN1c3BlbnNlKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGludmFsaWRhdGVQZW5kaW5nU2V0UmVmKHJhd1JlZik7XG4gICAgICAgIGRvU2V0KCk7XG4gICAgICB9XG4gICAgfSBlbHNlIGlmICghIShwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gXCJwcm9kdWN0aW9uXCIpKSB7XG4gICAgICB3YXJuJDEoXCJJbnZhbGlkIHRlbXBsYXRlIHJlZiB0eXBlOlwiLCByZWYsIGAoJHt0eXBlb2YgcmVmfSlgKTtcbiAgICB9XG4gIH1cbn1cbmZ1bmN0aW9uIGludmFsaWRhdGVQZW5kaW5nU2V0UmVmKHJhd1JlZikge1xuICBjb25zdCBwZW5kaW5nU2V0UmVmID0gcGVuZGluZ1NldFJlZk1hcC5nZXQocmF3UmVmKTtcbiAgaWYgKHBlbmRpbmdTZXRSZWYpIHtcbiAgICBwZW5kaW5nU2V0UmVmLmZsYWdzIHw9IDg7XG4gICAgcGVuZGluZ1NldFJlZk1hcC5kZWxldGUocmF3UmVmKTtcbiAgfVxufVxuXG5sZXQgaGFzTG9nZ2VkTWlzbWF0Y2hFcnJvciA9IGZhbHNlO1xuY29uc3QgbG9nTWlzbWF0Y2hFcnJvciA9ICgpID0+IHtcbiAgaWYgKGhhc0xvZ2dlZE1pc21hdGNoRXJyb3IpIHtcbiAgICByZXR1cm47XG4gIH1cbiAgY29uc29sZS5lcnJvcihcIkh5ZHJhdGlvbiBjb21wbGV0ZWQgYnV0IGNvbnRhaW5zIG1pc21hdGNoZXMuXCIpO1xuICBoYXNMb2dnZWRNaXNtYXRjaEVycm9yID0gdHJ1ZTtcbn07XG5jb25zdCBpc1NWR0NvbnRhaW5lciA9IChjb250YWluZXIpID0+IGNvbnRhaW5lci5uYW1lc3BhY2VVUkkuaW5jbHVkZXMoXCJzdmdcIikgJiYgY29udGFpbmVyLnRhZ05hbWUgIT09IFwiZm9yZWlnbk9iamVjdFwiO1xuY29uc3QgaXNNYXRoTUxDb250YWluZXIgPSAoY29udGFpbmVyKSA9PiBjb250YWluZXIubmFtZXNwYWNlVVJJLmluY2x1ZGVzKFwiTWF0aE1MXCIpO1xuY29uc3QgZ2V0Q29udGFpbmVyVHlwZSA9IChjb250YWluZXIpID0+IHtcbiAgaWYgKGNvbnRhaW5lci5ub2RlVHlwZSAhPT0gMSkgcmV0dXJuIHZvaWQgMDtcbiAgaWYgKGlzU1ZHQ29udGFpbmVyKGNvbnRhaW5lcikpIHJldHVybiBcInN2Z1wiO1xuICBpZiAoaXNNYXRoTUxDb250YWluZXIoY29udGFpbmVyKSkgcmV0dXJuIFwibWF0aG1sXCI7XG4gIHJldHVybiB2b2lkIDA7XG59O1xuY29uc3QgaXNDb21tZW50ID0gKG5vZGUpID0+IG5vZGUubm9kZVR5cGUgPT09IDg7XG5mdW5jdGlvbiBjcmVhdGVIeWRyYXRpb25GdW5jdGlvbnMocmVuZGVyZXJJbnRlcm5hbHMpIHtcbiAgY29uc3Qge1xuICAgIG10OiBtb3VudENvbXBvbmVudCxcbiAgICBwOiBwYXRjaCxcbiAgICBvOiB7XG4gICAgICBwYXRjaFByb3AsXG4gICAgICBjcmVhdGVUZXh0LFxuICAgICAgbmV4dFNpYmxpbmcsXG4gICAgICBwYXJlbnROb2RlLFxuICAgICAgcmVtb3ZlLFxuICAgICAgaW5zZXJ0LFxuICAgICAgY3JlYXRlQ29tbWVudFxuICAgIH1cbiAgfSA9IHJlbmRlcmVySW50ZXJuYWxzO1xuICBjb25zdCBoeWRyYXRlID0gKHZub2RlLCBjb250YWluZXIpID0+IHtcbiAgICBpZiAoIWNvbnRhaW5lci5oYXNDaGlsZE5vZGVzKCkpIHtcbiAgICAgICghIShwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gXCJwcm9kdWN0aW9uXCIpIHx8IF9fVlVFX1BST0RfSFlEUkFUSU9OX01JU01BVENIX0RFVEFJTFNfXykgJiYgd2FybiQxKFxuICAgICAgICBgQXR0ZW1wdGluZyB0byBoeWRyYXRlIGV4aXN0aW5nIG1hcmt1cCBidXQgY29udGFpbmVyIGlzIGVtcHR5LiBQZXJmb3JtaW5nIGZ1bGwgbW91bnQgaW5zdGVhZC5gXG4gICAgICApO1xuICAgICAgcGF0Y2gobnVsbCwgdm5vZGUsIGNvbnRhaW5lcik7XG4gICAgICBmbHVzaFBvc3RGbHVzaENicygpO1xuICAgICAgY29udGFpbmVyLl92bm9kZSA9IHZub2RlO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBoeWRyYXRlTm9kZShjb250YWluZXIuZmlyc3RDaGlsZCwgdm5vZGUsIG51bGwsIG51bGwsIG51bGwpO1xuICAgIGZsdXNoUG9zdEZsdXNoQ2JzKCk7XG4gICAgY29udGFpbmVyLl92bm9kZSA9IHZub2RlO1xuICB9O1xuICBjb25zdCBoeWRyYXRlTm9kZSA9IChub2RlLCB2bm9kZSwgcGFyZW50Q29tcG9uZW50LCBwYXJlbnRTdXNwZW5zZSwgc2xvdFNjb3BlSWRzLCBvcHRpbWl6ZWQgPSBmYWxzZSkgPT4ge1xuICAgIG9wdGltaXplZCA9IG9wdGltaXplZCB8fCAhIXZub2RlLmR5bmFtaWNDaGlsZHJlbjtcbiAgICBjb25zdCBpc0ZyYWdtZW50U3RhcnQgPSBpc0NvbW1lbnQobm9kZSkgJiYgbm9kZS5kYXRhID09PSBcIltcIjtcbiAgICBjb25zdCBvbk1pc21hdGNoID0gKCkgPT4gaGFuZGxlTWlzbWF0Y2goXG4gICAgICBub2RlLFxuICAgICAgdm5vZGUsXG4gICAgICBwYXJlbnRDb21wb25lbnQsXG4gICAgICBwYXJlbnRTdXNwZW5zZSxcbiAgICAgIHNsb3RTY29wZUlkcyxcbiAgICAgIGlzRnJhZ21lbnRTdGFydFxuICAgICk7XG4gICAgY29uc3QgeyB0eXBlLCByZWYsIHNoYXBlRmxhZywgcGF0Y2hGbGFnIH0gPSB2bm9kZTtcbiAgICBsZXQgZG9tVHlwZSA9IG5vZGUubm9kZVR5cGU7XG4gICAgdm5vZGUuZWwgPSBub2RlO1xuICAgIGlmICghIShwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gXCJwcm9kdWN0aW9uXCIpIHx8IF9fVlVFX1BST0RfREVWVE9PTFNfXykge1xuICAgICAgZGVmKG5vZGUsIFwiX192bm9kZVwiLCB2bm9kZSwgdHJ1ZSk7XG4gICAgICBkZWYobm9kZSwgXCJfX3Z1ZVBhcmVudENvbXBvbmVudFwiLCBwYXJlbnRDb21wb25lbnQsIHRydWUpO1xuICAgIH1cbiAgICBpZiAocGF0Y2hGbGFnID09PSAtMikge1xuICAgICAgb3B0aW1pemVkID0gZmFsc2U7XG4gICAgICB2bm9kZS5keW5hbWljQ2hpbGRyZW4gPSBudWxsO1xuICAgIH1cbiAgICBsZXQgbmV4dE5vZGUgPSBudWxsO1xuICAgIHN3aXRjaCAodHlwZSkge1xuICAgICAgY2FzZSBUZXh0OlxuICAgICAgICBpZiAoZG9tVHlwZSAhPT0gMykge1xuICAgICAgICAgIGlmICh2bm9kZS5jaGlsZHJlbiA9PT0gXCJcIikge1xuICAgICAgICAgICAgaW5zZXJ0KHZub2RlLmVsID0gY3JlYXRlVGV4dChcIlwiKSwgcGFyZW50Tm9kZShub2RlKSwgbm9kZSk7XG4gICAgICAgICAgICBuZXh0Tm9kZSA9IG5vZGU7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIG5leHROb2RlID0gb25NaXNtYXRjaCgpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBpZiAobm9kZS5kYXRhICE9PSB2bm9kZS5jaGlsZHJlbikge1xuICAgICAgICAgICAgKCEhKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSBcInByb2R1Y3Rpb25cIikgfHwgX19WVUVfUFJPRF9IWURSQVRJT05fTUlTTUFUQ0hfREVUQUlMU19fKSAmJiB3YXJuJDEoXG4gICAgICAgICAgICAgIGBIeWRyYXRpb24gdGV4dCBtaXNtYXRjaCBpbmAsXG4gICAgICAgICAgICAgIG5vZGUucGFyZW50Tm9kZSxcbiAgICAgICAgICAgICAgYFxuICAtIHJlbmRlcmVkIG9uIHNlcnZlcjogJHtKU09OLnN0cmluZ2lmeShcbiAgICAgICAgICAgICAgICBub2RlLmRhdGFcbiAgICAgICAgICAgICAgKX1cbiAgLSBleHBlY3RlZCBvbiBjbGllbnQ6ICR7SlNPTi5zdHJpbmdpZnkodm5vZGUuY2hpbGRyZW4pfWBcbiAgICAgICAgICAgICk7XG4gICAgICAgICAgICBsb2dNaXNtYXRjaEVycm9yKCk7XG4gICAgICAgICAgICBub2RlLmRhdGEgPSB2bm9kZS5jaGlsZHJlbjtcbiAgICAgICAgICB9XG4gICAgICAgICAgbmV4dE5vZGUgPSBuZXh0U2libGluZyhub2RlKTtcbiAgICAgICAgfVxuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgQ29tbWVudDpcbiAgICAgICAgaWYgKGlzVGVtcGxhdGVOb2RlKG5vZGUpKSB7XG4gICAgICAgICAgbmV4dE5vZGUgPSBuZXh0U2libGluZyhub2RlKTtcbiAgICAgICAgICByZXBsYWNlTm9kZShcbiAgICAgICAgICAgIHZub2RlLmVsID0gbm9kZS5jb250ZW50LmZpcnN0Q2hpbGQsXG4gICAgICAgICAgICBub2RlLFxuICAgICAgICAgICAgcGFyZW50Q29tcG9uZW50XG4gICAgICAgICAgKTtcbiAgICAgICAgfSBlbHNlIGlmIChkb21UeXBlICE9PSA4IHx8IGlzRnJhZ21lbnRTdGFydCkge1xuICAgICAgICAgIG5leHROb2RlID0gb25NaXNtYXRjaCgpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIG5leHROb2RlID0gbmV4dFNpYmxpbmcobm9kZSk7XG4gICAgICAgIH1cbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIFN0YXRpYzpcbiAgICAgICAgaWYgKGlzRnJhZ21lbnRTdGFydCkge1xuICAgICAgICAgIG5vZGUgPSBuZXh0U2libGluZyhub2RlKTtcbiAgICAgICAgICBkb21UeXBlID0gbm9kZS5ub2RlVHlwZTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoZG9tVHlwZSA9PT0gMSB8fCBkb21UeXBlID09PSAzKSB7XG4gICAgICAgICAgbmV4dE5vZGUgPSBub2RlO1xuICAgICAgICAgIGNvbnN0IG5lZWRUb0Fkb3B0Q29udGVudCA9ICF2bm9kZS5jaGlsZHJlbi5sZW5ndGg7XG4gICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB2bm9kZS5zdGF0aWNDb3VudDsgaSsrKSB7XG4gICAgICAgICAgICBpZiAobmVlZFRvQWRvcHRDb250ZW50KVxuICAgICAgICAgICAgICB2bm9kZS5jaGlsZHJlbiArPSBuZXh0Tm9kZS5ub2RlVHlwZSA9PT0gMSA/IG5leHROb2RlLm91dGVySFRNTCA6IG5leHROb2RlLmRhdGE7XG4gICAgICAgICAgICBpZiAoaSA9PT0gdm5vZGUuc3RhdGljQ291bnQgLSAxKSB7XG4gICAgICAgICAgICAgIHZub2RlLmFuY2hvciA9IG5leHROb2RlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgbmV4dE5vZGUgPSBuZXh0U2libGluZyhuZXh0Tm9kZSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiBpc0ZyYWdtZW50U3RhcnQgPyBuZXh0U2libGluZyhuZXh0Tm9kZSkgOiBuZXh0Tm9kZTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBvbk1pc21hdGNoKCk7XG4gICAgICAgIH1cbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIEZyYWdtZW50OlxuICAgICAgICBpZiAoIWlzRnJhZ21lbnRTdGFydCkge1xuICAgICAgICAgIG5leHROb2RlID0gb25NaXNtYXRjaCgpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIG5leHROb2RlID0gaHlkcmF0ZUZyYWdtZW50KFxuICAgICAgICAgICAgbm9kZSxcbiAgICAgICAgICAgIHZub2RlLFxuICAgICAgICAgICAgcGFyZW50Q29tcG9uZW50LFxuICAgICAgICAgICAgcGFyZW50U3VzcGVuc2UsXG4gICAgICAgICAgICBzbG90U2NvcGVJZHMsXG4gICAgICAgICAgICBvcHRpbWl6ZWRcbiAgICAgICAgICApO1xuICAgICAgICB9XG4gICAgICAgIGJyZWFrO1xuICAgICAgZGVmYXVsdDpcbiAgICAgICAgaWYgKHNoYXBlRmxhZyAmIDEpIHtcbiAgICAgICAgICBpZiAoKGRvbVR5cGUgIT09IDEgfHwgdm5vZGUudHlwZS50b0xvd2VyQ2FzZSgpICE9PSBub2RlLnRhZ05hbWUudG9Mb3dlckNhc2UoKSkgJiYgIWlzVGVtcGxhdGVOb2RlKG5vZGUpKSB7XG4gICAgICAgICAgICBuZXh0Tm9kZSA9IG9uTWlzbWF0Y2goKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgbmV4dE5vZGUgPSBoeWRyYXRlRWxlbWVudChcbiAgICAgICAgICAgICAgbm9kZSxcbiAgICAgICAgICAgICAgdm5vZGUsXG4gICAgICAgICAgICAgIHBhcmVudENvbXBvbmVudCxcbiAgICAgICAgICAgICAgcGFyZW50U3VzcGVuc2UsXG4gICAgICAgICAgICAgIHNsb3RTY29wZUlkcyxcbiAgICAgICAgICAgICAgb3B0aW1pemVkXG4gICAgICAgICAgICApO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIGlmIChzaGFwZUZsYWcgJiA2KSB7XG4gICAgICAgICAgdm5vZGUuc2xvdFNjb3BlSWRzID0gc2xvdFNjb3BlSWRzO1xuICAgICAgICAgIGNvbnN0IGNvbnRhaW5lciA9IHBhcmVudE5vZGUobm9kZSk7XG4gICAgICAgICAgaWYgKGlzRnJhZ21lbnRTdGFydCkge1xuICAgICAgICAgICAgbmV4dE5vZGUgPSBsb2NhdGVDbG9zaW5nQW5jaG9yKG5vZGUpO1xuICAgICAgICAgIH0gZWxzZSBpZiAoaXNDb21tZW50KG5vZGUpICYmIG5vZGUuZGF0YSA9PT0gXCJ0ZWxlcG9ydCBzdGFydFwiKSB7XG4gICAgICAgICAgICBuZXh0Tm9kZSA9IGxvY2F0ZUNsb3NpbmdBbmNob3Iobm9kZSwgbm9kZS5kYXRhLCBcInRlbGVwb3J0IGVuZFwiKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgbmV4dE5vZGUgPSBuZXh0U2libGluZyhub2RlKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgbW91bnRDb21wb25lbnQoXG4gICAgICAgICAgICB2bm9kZSxcbiAgICAgICAgICAgIGNvbnRhaW5lcixcbiAgICAgICAgICAgIG51bGwsXG4gICAgICAgICAgICBwYXJlbnRDb21wb25lbnQsXG4gICAgICAgICAgICBwYXJlbnRTdXNwZW5zZSxcbiAgICAgICAgICAgIGdldENvbnRhaW5lclR5cGUoY29udGFpbmVyKSxcbiAgICAgICAgICAgIG9wdGltaXplZFxuICAgICAgICAgICk7XG4gICAgICAgICAgaWYgKGlzQXN5bmNXcmFwcGVyKHZub2RlKSAmJiAhdm5vZGUudHlwZS5fX2FzeW5jUmVzb2x2ZWQpIHtcbiAgICAgICAgICAgIGxldCBzdWJUcmVlO1xuICAgICAgICAgICAgaWYgKGlzRnJhZ21lbnRTdGFydCkge1xuICAgICAgICAgICAgICBzdWJUcmVlID0gY3JlYXRlVk5vZGUoRnJhZ21lbnQpO1xuICAgICAgICAgICAgICBzdWJUcmVlLmFuY2hvciA9IG5leHROb2RlID8gbmV4dE5vZGUucHJldmlvdXNTaWJsaW5nIDogY29udGFpbmVyLmxhc3RDaGlsZDtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIHN1YlRyZWUgPSBub2RlLm5vZGVUeXBlID09PSAzID8gY3JlYXRlVGV4dFZOb2RlKFwiXCIpIDogY3JlYXRlVk5vZGUoXCJkaXZcIik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBzdWJUcmVlLmVsID0gbm9kZTtcbiAgICAgICAgICAgIHZub2RlLmNvbXBvbmVudC5zdWJUcmVlID0gc3ViVHJlZTtcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSBpZiAoc2hhcGVGbGFnICYgNjQpIHtcbiAgICAgICAgICBpZiAoZG9tVHlwZSAhPT0gOCkge1xuICAgICAgICAgICAgbmV4dE5vZGUgPSBvbk1pc21hdGNoKCk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIG5leHROb2RlID0gdm5vZGUudHlwZS5oeWRyYXRlKFxuICAgICAgICAgICAgICBub2RlLFxuICAgICAgICAgICAgICB2bm9kZSxcbiAgICAgICAgICAgICAgcGFyZW50Q29tcG9uZW50LFxuICAgICAgICAgICAgICBwYXJlbnRTdXNwZW5zZSxcbiAgICAgICAgICAgICAgc2xvdFNjb3BlSWRzLFxuICAgICAgICAgICAgICBvcHRpbWl6ZWQsXG4gICAgICAgICAgICAgIHJlbmRlcmVySW50ZXJuYWxzLFxuICAgICAgICAgICAgICBoeWRyYXRlQ2hpbGRyZW5cbiAgICAgICAgICAgICk7XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2UgaWYgKHNoYXBlRmxhZyAmIDEyOCkge1xuICAgICAgICAgIG5leHROb2RlID0gdm5vZGUudHlwZS5oeWRyYXRlKFxuICAgICAgICAgICAgbm9kZSxcbiAgICAgICAgICAgIHZub2RlLFxuICAgICAgICAgICAgcGFyZW50Q29tcG9uZW50LFxuICAgICAgICAgICAgcGFyZW50U3VzcGVuc2UsXG4gICAgICAgICAgICBnZXRDb250YWluZXJUeXBlKHBhcmVudE5vZGUobm9kZSkpLFxuICAgICAgICAgICAgc2xvdFNjb3BlSWRzLFxuICAgICAgICAgICAgb3B0aW1pemVkLFxuICAgICAgICAgICAgcmVuZGVyZXJJbnRlcm5hbHMsXG4gICAgICAgICAgICBoeWRyYXRlTm9kZVxuICAgICAgICAgICk7XG4gICAgICAgIH0gZWxzZSBpZiAoISEocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09IFwicHJvZHVjdGlvblwiKSB8fCBfX1ZVRV9QUk9EX0hZRFJBVElPTl9NSVNNQVRDSF9ERVRBSUxTX18pIHtcbiAgICAgICAgICB3YXJuJDEoXCJJbnZhbGlkIEhvc3RWTm9kZSB0eXBlOlwiLCB0eXBlLCBgKCR7dHlwZW9mIHR5cGV9KWApO1xuICAgICAgICB9XG4gICAgfVxuICAgIGlmIChyZWYgIT0gbnVsbCkge1xuICAgICAgc2V0UmVmKHJlZiwgbnVsbCwgcGFyZW50U3VzcGVuc2UsIHZub2RlKTtcbiAgICB9XG4gICAgcmV0dXJuIG5leHROb2RlO1xuICB9O1xuICBjb25zdCBoeWRyYXRlRWxlbWVudCA9IChlbCwgdm5vZGUsIHBhcmVudENvbXBvbmVudCwgcGFyZW50U3VzcGVuc2UsIHNsb3RTY29wZUlkcywgb3B0aW1pemVkKSA9PiB7XG4gICAgb3B0aW1pemVkID0gb3B0aW1pemVkIHx8ICEhdm5vZGUuZHluYW1pY0NoaWxkcmVuO1xuICAgIGNvbnN0IHsgdHlwZSwgcHJvcHMsIHBhdGNoRmxhZywgc2hhcGVGbGFnLCBkaXJzLCB0cmFuc2l0aW9uIH0gPSB2bm9kZTtcbiAgICBjb25zdCBmb3JjZVBhdGNoID0gdHlwZSA9PT0gXCJpbnB1dFwiIHx8IHR5cGUgPT09IFwib3B0aW9uXCI7XG4gICAgaWYgKCEhKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSBcInByb2R1Y3Rpb25cIikgfHwgZm9yY2VQYXRjaCB8fCBwYXRjaEZsYWcgIT09IC0xKSB7XG4gICAgICBpZiAoZGlycykge1xuICAgICAgICBpbnZva2VEaXJlY3RpdmVIb29rKHZub2RlLCBudWxsLCBwYXJlbnRDb21wb25lbnQsIFwiY3JlYXRlZFwiKTtcbiAgICAgIH1cbiAgICAgIGxldCBuZWVkQ2FsbFRyYW5zaXRpb25Ib29rcyA9IGZhbHNlO1xuICAgICAgaWYgKGlzVGVtcGxhdGVOb2RlKGVsKSkge1xuICAgICAgICBuZWVkQ2FsbFRyYW5zaXRpb25Ib29rcyA9IG5lZWRUcmFuc2l0aW9uKFxuICAgICAgICAgIG51bGwsXG4gICAgICAgICAgLy8gbm8gbmVlZCBjaGVjayBwYXJlbnRTdXNwZW5zZSBpbiBoeWRyYXRpb25cbiAgICAgICAgICB0cmFuc2l0aW9uXG4gICAgICAgICkgJiYgcGFyZW50Q29tcG9uZW50ICYmIHBhcmVudENvbXBvbmVudC52bm9kZS5wcm9wcyAmJiBwYXJlbnRDb21wb25lbnQudm5vZGUucHJvcHMuYXBwZWFyO1xuICAgICAgICBjb25zdCBjb250ZW50ID0gZWwuY29udGVudC5maXJzdENoaWxkO1xuICAgICAgICBpZiAobmVlZENhbGxUcmFuc2l0aW9uSG9va3MpIHtcbiAgICAgICAgICBjb25zdCBjbHMgPSBjb250ZW50LmdldEF0dHJpYnV0ZShcImNsYXNzXCIpO1xuICAgICAgICAgIGlmIChjbHMpIGNvbnRlbnQuJGNscyA9IGNscztcbiAgICAgICAgICB0cmFuc2l0aW9uLmJlZm9yZUVudGVyKGNvbnRlbnQpO1xuICAgICAgICB9XG4gICAgICAgIHJlcGxhY2VOb2RlKGNvbnRlbnQsIGVsLCBwYXJlbnRDb21wb25lbnQpO1xuICAgICAgICB2bm9kZS5lbCA9IGVsID0gY29udGVudDtcbiAgICAgIH1cbiAgICAgIGlmIChzaGFwZUZsYWcgJiAxNiAmJiAvLyBza2lwIGlmIGVsZW1lbnQgaGFzIGlubmVySFRNTCAvIHRleHRDb250ZW50XG4gICAgICAhKHByb3BzICYmIChwcm9wcy5pbm5lckhUTUwgfHwgcHJvcHMudGV4dENvbnRlbnQpKSkge1xuICAgICAgICBsZXQgbmV4dCA9IGh5ZHJhdGVDaGlsZHJlbihcbiAgICAgICAgICBlbC5maXJzdENoaWxkLFxuICAgICAgICAgIHZub2RlLFxuICAgICAgICAgIGVsLFxuICAgICAgICAgIHBhcmVudENvbXBvbmVudCxcbiAgICAgICAgICBwYXJlbnRTdXNwZW5zZSxcbiAgICAgICAgICBzbG90U2NvcGVJZHMsXG4gICAgICAgICAgb3B0aW1pemVkXG4gICAgICAgICk7XG4gICAgICAgIGxldCBoYXNXYXJuZWQgPSBmYWxzZTtcbiAgICAgICAgd2hpbGUgKG5leHQpIHtcbiAgICAgICAgICBpZiAoIWlzTWlzbWF0Y2hBbGxvd2VkKGVsLCAxIC8qIENISUxEUkVOICovKSkge1xuICAgICAgICAgICAgaWYgKCghIShwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gXCJwcm9kdWN0aW9uXCIpIHx8IF9fVlVFX1BST0RfSFlEUkFUSU9OX01JU01BVENIX0RFVEFJTFNfXykgJiYgIWhhc1dhcm5lZCkge1xuICAgICAgICAgICAgICB3YXJuJDEoXG4gICAgICAgICAgICAgICAgYEh5ZHJhdGlvbiBjaGlsZHJlbiBtaXNtYXRjaCBvbmAsXG4gICAgICAgICAgICAgICAgZWwsXG4gICAgICAgICAgICAgICAgYFxuU2VydmVyIHJlbmRlcmVkIGVsZW1lbnQgY29udGFpbnMgbW9yZSBjaGlsZCBub2RlcyB0aGFuIGNsaWVudCB2ZG9tLmBcbiAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgaGFzV2FybmVkID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGxvZ01pc21hdGNoRXJyb3IoKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgY29uc3QgY3VyID0gbmV4dDtcbiAgICAgICAgICBuZXh0ID0gbmV4dC5uZXh0U2libGluZztcbiAgICAgICAgICByZW1vdmUoY3VyKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIGlmIChzaGFwZUZsYWcgJiA4KSB7XG4gICAgICAgIGxldCBjbGllbnRUZXh0ID0gdm5vZGUuY2hpbGRyZW47XG4gICAgICAgIGlmIChjbGllbnRUZXh0WzBdID09PSBcIlxcblwiICYmIChlbC50YWdOYW1lID09PSBcIlBSRVwiIHx8IGVsLnRhZ05hbWUgPT09IFwiVEVYVEFSRUFcIikpIHtcbiAgICAgICAgICBjbGllbnRUZXh0ID0gY2xpZW50VGV4dC5zbGljZSgxKTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCB7IHRleHRDb250ZW50IH0gPSBlbDtcbiAgICAgICAgaWYgKHRleHRDb250ZW50ICE9PSBjbGllbnRUZXh0ICYmIC8vIGlubmVySFRNTCBub3JtYWxpemUgXFxyXFxuIG9yIFxcciBpbnRvIGEgc2luZ2xlIFxcbiBpbiB0aGUgRE9NXG4gICAgICAgIHRleHRDb250ZW50ICE9PSBjbGllbnRUZXh0LnJlcGxhY2UoL1xcclxcbnxcXHIvZywgXCJcXG5cIikpIHtcbiAgICAgICAgICBpZiAoIWlzTWlzbWF0Y2hBbGxvd2VkKGVsLCAwIC8qIFRFWFQgKi8pKSB7XG4gICAgICAgICAgICAoISEocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09IFwicHJvZHVjdGlvblwiKSB8fCBfX1ZVRV9QUk9EX0hZRFJBVElPTl9NSVNNQVRDSF9ERVRBSUxTX18pICYmIHdhcm4kMShcbiAgICAgICAgICAgICAgYEh5ZHJhdGlvbiB0ZXh0IGNvbnRlbnQgbWlzbWF0Y2ggb25gLFxuICAgICAgICAgICAgICBlbCxcbiAgICAgICAgICAgICAgYFxuICAtIHJlbmRlcmVkIG9uIHNlcnZlcjogJHt0ZXh0Q29udGVudH1cbiAgLSBleHBlY3RlZCBvbiBjbGllbnQ6ICR7Y2xpZW50VGV4dH1gXG4gICAgICAgICAgICApO1xuICAgICAgICAgICAgbG9nTWlzbWF0Y2hFcnJvcigpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBlbC50ZXh0Q29udGVudCA9IHZub2RlLmNoaWxkcmVuO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBpZiAocHJvcHMpIHtcbiAgICAgICAgaWYgKCEhKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSBcInByb2R1Y3Rpb25cIikgfHwgX19WVUVfUFJPRF9IWURSQVRJT05fTUlTTUFUQ0hfREVUQUlMU19fIHx8IGZvcmNlUGF0Y2ggfHwgIW9wdGltaXplZCB8fCBwYXRjaEZsYWcgJiAoMTYgfCAzMikpIHtcbiAgICAgICAgICBjb25zdCBpc0N1c3RvbUVsZW1lbnQgPSBlbC50YWdOYW1lLmluY2x1ZGVzKFwiLVwiKTtcbiAgICAgICAgICBmb3IgKGNvbnN0IGtleSBpbiBwcm9wcykge1xuICAgICAgICAgICAgaWYgKCghIShwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gXCJwcm9kdWN0aW9uXCIpIHx8IF9fVlVFX1BST0RfSFlEUkFUSU9OX01JU01BVENIX0RFVEFJTFNfXykgJiYgLy8gIzExMTg5IHNraXAgaWYgdGhpcyBub2RlIGhhcyBkaXJlY3RpdmVzIHRoYXQgaGF2ZSBjcmVhdGVkIGhvb2tzXG4gICAgICAgICAgICAvLyBhcyBpdCBjb3VsZCBoYXZlIG11dGF0ZWQgdGhlIERPTSBpbiBhbnkgcG9zc2libGUgd2F5XG4gICAgICAgICAgICAhKGRpcnMgJiYgZGlycy5zb21lKChkKSA9PiBkLmRpci5jcmVhdGVkKSkgJiYgcHJvcEhhc01pc21hdGNoKGVsLCBrZXksIHByb3BzW2tleV0sIHZub2RlLCBwYXJlbnRDb21wb25lbnQpKSB7XG4gICAgICAgICAgICAgIGxvZ01pc21hdGNoRXJyb3IoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChmb3JjZVBhdGNoICYmIChrZXkuZW5kc1dpdGgoXCJ2YWx1ZVwiKSB8fCBrZXkgPT09IFwiaW5kZXRlcm1pbmF0ZVwiKSB8fCBpc09uKGtleSkgJiYgIWlzUmVzZXJ2ZWRQcm9wKGtleSkgfHwgLy8gZm9yY2UgaHlkcmF0ZSB2LWJpbmQgd2l0aCAucHJvcCBtb2RpZmllcnNcbiAgICAgICAgICAgIGtleVswXSA9PT0gXCIuXCIgfHwgaXNDdXN0b21FbGVtZW50ICYmICFpc1Jlc2VydmVkUHJvcChrZXkpKSB7XG4gICAgICAgICAgICAgIHBhdGNoUHJvcChlbCwga2V5LCBudWxsLCBwcm9wc1trZXldLCB2b2lkIDAsIHBhcmVudENvbXBvbmVudCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2UgaWYgKHByb3BzLm9uQ2xpY2spIHtcbiAgICAgICAgICBwYXRjaFByb3AoXG4gICAgICAgICAgICBlbCxcbiAgICAgICAgICAgIFwib25DbGlja1wiLFxuICAgICAgICAgICAgbnVsbCxcbiAgICAgICAgICAgIHByb3BzLm9uQ2xpY2ssXG4gICAgICAgICAgICB2b2lkIDAsXG4gICAgICAgICAgICBwYXJlbnRDb21wb25lbnRcbiAgICAgICAgICApO1xuICAgICAgICB9IGVsc2UgaWYgKHBhdGNoRmxhZyAmIDQgJiYgaXNSZWFjdGl2ZShwcm9wcy5zdHlsZSkpIHtcbiAgICAgICAgICBmb3IgKGNvbnN0IGtleSBpbiBwcm9wcy5zdHlsZSkgcHJvcHMuc3R5bGVba2V5XTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgbGV0IHZub2RlSG9va3M7XG4gICAgICBpZiAodm5vZGVIb29rcyA9IHByb3BzICYmIHByb3BzLm9uVm5vZGVCZWZvcmVNb3VudCkge1xuICAgICAgICBpbnZva2VWTm9kZUhvb2sodm5vZGVIb29rcywgcGFyZW50Q29tcG9uZW50LCB2bm9kZSk7XG4gICAgICB9XG4gICAgICBpZiAoZGlycykge1xuICAgICAgICBpbnZva2VEaXJlY3RpdmVIb29rKHZub2RlLCBudWxsLCBwYXJlbnRDb21wb25lbnQsIFwiYmVmb3JlTW91bnRcIik7XG4gICAgICB9XG4gICAgICBpZiAoKHZub2RlSG9va3MgPSBwcm9wcyAmJiBwcm9wcy5vblZub2RlTW91bnRlZCkgfHwgZGlycyB8fCBuZWVkQ2FsbFRyYW5zaXRpb25Ib29rcykge1xuICAgICAgICBxdWV1ZUVmZmVjdFdpdGhTdXNwZW5zZSgoKSA9PiB7XG4gICAgICAgICAgdm5vZGVIb29rcyAmJiBpbnZva2VWTm9kZUhvb2sodm5vZGVIb29rcywgcGFyZW50Q29tcG9uZW50LCB2bm9kZSk7XG4gICAgICAgICAgbmVlZENhbGxUcmFuc2l0aW9uSG9va3MgJiYgdHJhbnNpdGlvbi5lbnRlcihlbCk7XG4gICAgICAgICAgZGlycyAmJiBpbnZva2VEaXJlY3RpdmVIb29rKHZub2RlLCBudWxsLCBwYXJlbnRDb21wb25lbnQsIFwibW91bnRlZFwiKTtcbiAgICAgICAgfSwgcGFyZW50U3VzcGVuc2UpO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gZWwubmV4dFNpYmxpbmc7XG4gIH07XG4gIGNvbnN0IGh5ZHJhdGVDaGlsZHJlbiA9IChub2RlLCBwYXJlbnRWTm9kZSwgY29udGFpbmVyLCBwYXJlbnRDb21wb25lbnQsIHBhcmVudFN1c3BlbnNlLCBzbG90U2NvcGVJZHMsIG9wdGltaXplZCkgPT4ge1xuICAgIG9wdGltaXplZCA9IG9wdGltaXplZCB8fCAhIXBhcmVudFZOb2RlLmR5bmFtaWNDaGlsZHJlbjtcbiAgICBjb25zdCBjaGlsZHJlbiA9IHBhcmVudFZOb2RlLmNoaWxkcmVuO1xuICAgIGNvbnN0IGwgPSBjaGlsZHJlbi5sZW5ndGg7XG4gICAgbGV0IGhhc1dhcm5lZCA9IGZhbHNlO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbDsgaSsrKSB7XG4gICAgICBjb25zdCB2bm9kZSA9IG9wdGltaXplZCA/IGNoaWxkcmVuW2ldIDogY2hpbGRyZW5baV0gPSBub3JtYWxpemVWTm9kZShjaGlsZHJlbltpXSk7XG4gICAgICBjb25zdCBpc1RleHQgPSB2bm9kZS50eXBlID09PSBUZXh0O1xuICAgICAgaWYgKG5vZGUpIHtcbiAgICAgICAgaWYgKGlzVGV4dCAmJiAhb3B0aW1pemVkKSB7XG4gICAgICAgICAgaWYgKGkgKyAxIDwgbCAmJiBub3JtYWxpemVWTm9kZShjaGlsZHJlbltpICsgMV0pLnR5cGUgPT09IFRleHQpIHtcbiAgICAgICAgICAgIGluc2VydChcbiAgICAgICAgICAgICAgY3JlYXRlVGV4dChcbiAgICAgICAgICAgICAgICBub2RlLmRhdGEuc2xpY2Uodm5vZGUuY2hpbGRyZW4ubGVuZ3RoKVxuICAgICAgICAgICAgICApLFxuICAgICAgICAgICAgICBjb250YWluZXIsXG4gICAgICAgICAgICAgIG5leHRTaWJsaW5nKG5vZGUpXG4gICAgICAgICAgICApO1xuICAgICAgICAgICAgbm9kZS5kYXRhID0gdm5vZGUuY2hpbGRyZW47XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIG5vZGUgPSBoeWRyYXRlTm9kZShcbiAgICAgICAgICBub2RlLFxuICAgICAgICAgIHZub2RlLFxuICAgICAgICAgIHBhcmVudENvbXBvbmVudCxcbiAgICAgICAgICBwYXJlbnRTdXNwZW5zZSxcbiAgICAgICAgICBzbG90U2NvcGVJZHMsXG4gICAgICAgICAgb3B0aW1pemVkXG4gICAgICAgICk7XG4gICAgICB9IGVsc2UgaWYgKGlzVGV4dCAmJiAhdm5vZGUuY2hpbGRyZW4pIHtcbiAgICAgICAgaW5zZXJ0KHZub2RlLmVsID0gY3JlYXRlVGV4dChcIlwiKSwgY29udGFpbmVyKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGlmICghaXNNaXNtYXRjaEFsbG93ZWQoY29udGFpbmVyLCAxIC8qIENISUxEUkVOICovKSkge1xuICAgICAgICAgIGlmICgoISEocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09IFwicHJvZHVjdGlvblwiKSB8fCBfX1ZVRV9QUk9EX0hZRFJBVElPTl9NSVNNQVRDSF9ERVRBSUxTX18pICYmICFoYXNXYXJuZWQpIHtcbiAgICAgICAgICAgIHdhcm4kMShcbiAgICAgICAgICAgICAgYEh5ZHJhdGlvbiBjaGlsZHJlbiBtaXNtYXRjaCBvbmAsXG4gICAgICAgICAgICAgIGNvbnRhaW5lcixcbiAgICAgICAgICAgICAgYFxuU2VydmVyIHJlbmRlcmVkIGVsZW1lbnQgY29udGFpbnMgZmV3ZXIgY2hpbGQgbm9kZXMgdGhhbiBjbGllbnQgdmRvbS5gXG4gICAgICAgICAgICApO1xuICAgICAgICAgICAgaGFzV2FybmVkID0gdHJ1ZTtcbiAgICAgICAgICB9XG4gICAgICAgICAgbG9nTWlzbWF0Y2hFcnJvcigpO1xuICAgICAgICB9XG4gICAgICAgIHBhdGNoKFxuICAgICAgICAgIG51bGwsXG4gICAgICAgICAgdm5vZGUsXG4gICAgICAgICAgY29udGFpbmVyLFxuICAgICAgICAgIG51bGwsXG4gICAgICAgICAgcGFyZW50Q29tcG9uZW50LFxuICAgICAgICAgIHBhcmVudFN1c3BlbnNlLFxuICAgICAgICAgIGdldENvbnRhaW5lclR5cGUoY29udGFpbmVyKSxcbiAgICAgICAgICBzbG90U2NvcGVJZHNcbiAgICAgICAgKTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIG5vZGU7XG4gIH07XG4gIGNvbnN0IGh5ZHJhdGVGcmFnbWVudCA9IChub2RlLCB2bm9kZSwgcGFyZW50Q29tcG9uZW50LCBwYXJlbnRTdXNwZW5zZSwgc2xvdFNjb3BlSWRzLCBvcHRpbWl6ZWQpID0+IHtcbiAgICBjb25zdCB7IHNsb3RTY29wZUlkczogZnJhZ21lbnRTbG90U2NvcGVJZHMgfSA9IHZub2RlO1xuICAgIGlmIChmcmFnbWVudFNsb3RTY29wZUlkcykge1xuICAgICAgc2xvdFNjb3BlSWRzID0gc2xvdFNjb3BlSWRzID8gc2xvdFNjb3BlSWRzLmNvbmNhdChmcmFnbWVudFNsb3RTY29wZUlkcykgOiBmcmFnbWVudFNsb3RTY29wZUlkcztcbiAgICB9XG4gICAgY29uc3QgY29udGFpbmVyID0gcGFyZW50Tm9kZShub2RlKTtcbiAgICBjb25zdCBuZXh0ID0gaHlkcmF0ZUNoaWxkcmVuKFxuICAgICAgbmV4dFNpYmxpbmcobm9kZSksXG4gICAgICB2bm9kZSxcbiAgICAgIGNvbnRhaW5lcixcbiAgICAgIHBhcmVudENvbXBvbmVudCxcbiAgICAgIHBhcmVudFN1c3BlbnNlLFxuICAgICAgc2xvdFNjb3BlSWRzLFxuICAgICAgb3B0aW1pemVkXG4gICAgKTtcbiAgICBpZiAobmV4dCAmJiBpc0NvbW1lbnQobmV4dCkgJiYgbmV4dC5kYXRhID09PSBcIl1cIikge1xuICAgICAgcmV0dXJuIG5leHRTaWJsaW5nKHZub2RlLmFuY2hvciA9IG5leHQpO1xuICAgIH0gZWxzZSB7XG4gICAgICBsb2dNaXNtYXRjaEVycm9yKCk7XG4gICAgICBpbnNlcnQodm5vZGUuYW5jaG9yID0gY3JlYXRlQ29tbWVudChgXWApLCBjb250YWluZXIsIG5leHQpO1xuICAgICAgcmV0dXJuIG5leHQ7XG4gICAgfVxuICB9O1xuICBjb25zdCBoYW5kbGVNaXNtYXRjaCA9IChub2RlLCB2bm9kZSwgcGFyZW50Q29tcG9uZW50LCBwYXJlbnRTdXNwZW5zZSwgc2xvdFNjb3BlSWRzLCBpc0ZyYWdtZW50KSA9PiB7XG4gICAgaWYgKCFpc01pc21hdGNoQWxsb3dlZChub2RlLnBhcmVudEVsZW1lbnQsIDEgLyogQ0hJTERSRU4gKi8pKSB7XG4gICAgICAoISEocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09IFwicHJvZHVjdGlvblwiKSB8fCBfX1ZVRV9QUk9EX0hZRFJBVElPTl9NSVNNQVRDSF9ERVRBSUxTX18pICYmIHdhcm4kMShcbiAgICAgICAgYEh5ZHJhdGlvbiBub2RlIG1pc21hdGNoOlxuLSByZW5kZXJlZCBvbiBzZXJ2ZXI6YCxcbiAgICAgICAgbm9kZSxcbiAgICAgICAgbm9kZS5ub2RlVHlwZSA9PT0gMyA/IGAodGV4dClgIDogaXNDb21tZW50KG5vZGUpICYmIG5vZGUuZGF0YSA9PT0gXCJbXCIgPyBgKHN0YXJ0IG9mIGZyYWdtZW50KWAgOiBgYCxcbiAgICAgICAgYFxuLSBleHBlY3RlZCBvbiBjbGllbnQ6YCxcbiAgICAgICAgdm5vZGUudHlwZVxuICAgICAgKTtcbiAgICAgIGxvZ01pc21hdGNoRXJyb3IoKTtcbiAgICB9XG4gICAgdm5vZGUuZWwgPSBudWxsO1xuICAgIGlmIChpc0ZyYWdtZW50KSB7XG4gICAgICBjb25zdCBlbmQgPSBsb2NhdGVDbG9zaW5nQW5jaG9yKG5vZGUpO1xuICAgICAgd2hpbGUgKHRydWUpIHtcbiAgICAgICAgY29uc3QgbmV4dDIgPSBuZXh0U2libGluZyhub2RlKTtcbiAgICAgICAgaWYgKG5leHQyICYmIG5leHQyICE9PSBlbmQpIHtcbiAgICAgICAgICByZW1vdmUobmV4dDIpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIGNvbnN0IG5leHQgPSBuZXh0U2libGluZyhub2RlKTtcbiAgICBjb25zdCBjb250YWluZXIgPSBwYXJlbnROb2RlKG5vZGUpO1xuICAgIHJlbW92ZShub2RlKTtcbiAgICBwYXRjaChcbiAgICAgIG51bGwsXG4gICAgICB2bm9kZSxcbiAgICAgIGNvbnRhaW5lcixcbiAgICAgIG5leHQsXG4gICAgICBwYXJlbnRDb21wb25lbnQsXG4gICAgICBwYXJlbnRTdXNwZW5zZSxcbiAgICAgIGdldENvbnRhaW5lclR5cGUoY29udGFpbmVyKSxcbiAgICAgIHNsb3RTY29wZUlkc1xuICAgICk7XG4gICAgaWYgKHBhcmVudENvbXBvbmVudCkge1xuICAgICAgcGFyZW50Q29tcG9uZW50LnZub2RlLmVsID0gdm5vZGUuZWw7XG4gICAgICB1cGRhdGVIT0NIb3N0RWwocGFyZW50Q29tcG9uZW50LCB2bm9kZS5lbCk7XG4gICAgfVxuICAgIHJldHVybiBuZXh0O1xuICB9O1xuICBjb25zdCBsb2NhdGVDbG9zaW5nQW5jaG9yID0gKG5vZGUsIG9wZW4gPSBcIltcIiwgY2xvc2UgPSBcIl1cIikgPT4ge1xuICAgIGxldCBtYXRjaCA9IDA7XG4gICAgd2hpbGUgKG5vZGUpIHtcbiAgICAgIG5vZGUgPSBuZXh0U2libGluZyhub2RlKTtcbiAgICAgIGlmIChub2RlICYmIGlzQ29tbWVudChub2RlKSkge1xuICAgICAgICBpZiAobm9kZS5kYXRhID09PSBvcGVuKSBtYXRjaCsrO1xuICAgICAgICBpZiAobm9kZS5kYXRhID09PSBjbG9zZSkge1xuICAgICAgICAgIGlmIChtYXRjaCA9PT0gMCkge1xuICAgICAgICAgICAgcmV0dXJuIG5leHRTaWJsaW5nKG5vZGUpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBtYXRjaC0tO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gbm9kZTtcbiAgfTtcbiAgY29uc3QgcmVwbGFjZU5vZGUgPSAobmV3Tm9kZSwgb2xkTm9kZSwgcGFyZW50Q29tcG9uZW50KSA9PiB7XG4gICAgY29uc3QgcGFyZW50Tm9kZTIgPSBvbGROb2RlLnBhcmVudE5vZGU7XG4gICAgaWYgKHBhcmVudE5vZGUyKSB7XG4gICAgICBwYXJlbnROb2RlMi5yZXBsYWNlQ2hpbGQobmV3Tm9kZSwgb2xkTm9kZSk7XG4gICAgfVxuICAgIGxldCBwYXJlbnQgPSBwYXJlbnRDb21wb25lbnQ7XG4gICAgd2hpbGUgKHBhcmVudCkge1xuICAgICAgaWYgKHBhcmVudC52bm9kZS5lbCA9PT0gb2xkTm9kZSkge1xuICAgICAgICBwYXJlbnQudm5vZGUuZWwgPSBwYXJlbnQuc3ViVHJlZS5lbCA9IG5ld05vZGU7XG4gICAgICB9XG4gICAgICBwYXJlbnQgPSBwYXJlbnQucGFyZW50O1xuICAgIH1cbiAgfTtcbiAgY29uc3QgaXNUZW1wbGF0ZU5vZGUgPSAobm9kZSkgPT4ge1xuICAgIHJldHVybiBub2RlLm5vZGVUeXBlID09PSAxICYmIG5vZGUudGFnTmFtZSA9PT0gXCJURU1QTEFURVwiO1xuICB9O1xuICByZXR1cm4gW2h5ZHJhdGUsIGh5ZHJhdGVOb2RlXTtcbn1cbmZ1bmN0aW9uIHByb3BIYXNNaXNtYXRjaChlbCwga2V5LCBjbGllbnRWYWx1ZSwgdm5vZGUsIGluc3RhbmNlKSB7XG4gIGxldCBtaXNtYXRjaFR5cGU7XG4gIGxldCBtaXNtYXRjaEtleTtcbiAgbGV0IGFjdHVhbDtcbiAgbGV0IGV4cGVjdGVkO1xuICBpZiAoa2V5ID09PSBcImNsYXNzXCIpIHtcbiAgICBpZiAoZWwuJGNscykge1xuICAgICAgYWN0dWFsID0gZWwuJGNscztcbiAgICAgIGRlbGV0ZSBlbC4kY2xzO1xuICAgIH0gZWxzZSB7XG4gICAgICBhY3R1YWwgPSBlbC5nZXRBdHRyaWJ1dGUoXCJjbGFzc1wiKTtcbiAgICB9XG4gICAgZXhwZWN0ZWQgPSBub3JtYWxpemVDbGFzcyhjbGllbnRWYWx1ZSk7XG4gICAgaWYgKCFpc1NldEVxdWFsKHRvQ2xhc3NTZXQoYWN0dWFsIHx8IFwiXCIpLCB0b0NsYXNzU2V0KGV4cGVjdGVkKSkpIHtcbiAgICAgIG1pc21hdGNoVHlwZSA9IDIgLyogQ0xBU1MgKi87XG4gICAgICBtaXNtYXRjaEtleSA9IGBjbGFzc2A7XG4gICAgfVxuICB9IGVsc2UgaWYgKGtleSA9PT0gXCJzdHlsZVwiKSB7XG4gICAgYWN0dWFsID0gZWwuZ2V0QXR0cmlidXRlKFwic3R5bGVcIikgfHwgXCJcIjtcbiAgICBleHBlY3RlZCA9IGlzU3RyaW5nKGNsaWVudFZhbHVlKSA/IGNsaWVudFZhbHVlIDogc3RyaW5naWZ5U3R5bGUobm9ybWFsaXplU3R5bGUoY2xpZW50VmFsdWUpKTtcbiAgICBjb25zdCBhY3R1YWxNYXAgPSB0b1N0eWxlTWFwKGFjdHVhbCk7XG4gICAgY29uc3QgZXhwZWN0ZWRNYXAgPSB0b1N0eWxlTWFwKGV4cGVjdGVkKTtcbiAgICBpZiAodm5vZGUuZGlycykge1xuICAgICAgZm9yIChjb25zdCB7IGRpciwgdmFsdWUgfSBvZiB2bm9kZS5kaXJzKSB7XG4gICAgICAgIGlmIChkaXIubmFtZSA9PT0gXCJzaG93XCIgJiYgIXZhbHVlKSB7XG4gICAgICAgICAgZXhwZWN0ZWRNYXAuc2V0KFwiZGlzcGxheVwiLCBcIm5vbmVcIik7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKGluc3RhbmNlKSB7XG4gICAgICByZXNvbHZlQ3NzVmFycyhpbnN0YW5jZSwgdm5vZGUsIGV4cGVjdGVkTWFwKTtcbiAgICB9XG4gICAgaWYgKCFpc01hcEVxdWFsKGFjdHVhbE1hcCwgZXhwZWN0ZWRNYXApKSB7XG4gICAgICBtaXNtYXRjaFR5cGUgPSAzIC8qIFNUWUxFICovO1xuICAgICAgbWlzbWF0Y2hLZXkgPSBcInN0eWxlXCI7XG4gICAgfVxuICB9IGVsc2UgaWYgKGVsIGluc3RhbmNlb2YgU1ZHRWxlbWVudCAmJiBpc0tub3duU3ZnQXR0cihrZXkpIHx8IGVsIGluc3RhbmNlb2YgSFRNTEVsZW1lbnQgJiYgKGlzQm9vbGVhbkF0dHIoa2V5KSB8fCBpc0tub3duSHRtbEF0dHIoa2V5KSkpIHtcbiAgICBpZiAoaXNCb29sZWFuQXR0cihrZXkpKSB7XG4gICAgICBhY3R1YWwgPSBlbC5oYXNBdHRyaWJ1dGUoa2V5KTtcbiAgICAgIGV4cGVjdGVkID0gaW5jbHVkZUJvb2xlYW5BdHRyKGNsaWVudFZhbHVlKTtcbiAgICB9IGVsc2UgaWYgKGNsaWVudFZhbHVlID09IG51bGwpIHtcbiAgICAgIGFjdHVhbCA9IGVsLmhhc0F0dHJpYnV0ZShrZXkpO1xuICAgICAgZXhwZWN0ZWQgPSBmYWxzZTtcbiAgICB9IGVsc2Uge1xuICAgICAgaWYgKGVsLmhhc0F0dHJpYnV0ZShrZXkpKSB7XG4gICAgICAgIGFjdHVhbCA9IGVsLmdldEF0dHJpYnV0ZShrZXkpO1xuICAgICAgfSBlbHNlIGlmIChrZXkgPT09IFwidmFsdWVcIiAmJiBlbC50YWdOYW1lID09PSBcIlRFWFRBUkVBXCIpIHtcbiAgICAgICAgYWN0dWFsID0gZWwudmFsdWU7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBhY3R1YWwgPSBmYWxzZTtcbiAgICAgIH1cbiAgICAgIGV4cGVjdGVkID0gaXNSZW5kZXJhYmxlQXR0clZhbHVlKGNsaWVudFZhbHVlKSA/IFN0cmluZyhjbGllbnRWYWx1ZSkgOiBmYWxzZTtcbiAgICB9XG4gICAgaWYgKGFjdHVhbCAhPT0gZXhwZWN0ZWQpIHtcbiAgICAgIG1pc21hdGNoVHlwZSA9IDQgLyogQVRUUklCVVRFICovO1xuICAgICAgbWlzbWF0Y2hLZXkgPSBrZXk7XG4gICAgfVxuICB9XG4gIGlmIChtaXNtYXRjaFR5cGUgIT0gbnVsbCAmJiAhaXNNaXNtYXRjaEFsbG93ZWQoZWwsIG1pc21hdGNoVHlwZSkpIHtcbiAgICBjb25zdCBmb3JtYXQgPSAodikgPT4gdiA9PT0gZmFsc2UgPyBgKG5vdCByZW5kZXJlZClgIDogYCR7bWlzbWF0Y2hLZXl9PVwiJHt2fVwiYDtcbiAgICBjb25zdCBwcmVTZWdtZW50ID0gYEh5ZHJhdGlvbiAke01pc21hdGNoVHlwZVN0cmluZ1ttaXNtYXRjaFR5cGVdfSBtaXNtYXRjaCBvbmA7XG4gICAgY29uc3QgcG9zdFNlZ21lbnQgPSBgXG4gIC0gcmVuZGVyZWQgb24gc2VydmVyOiAke2Zvcm1hdChhY3R1YWwpfVxuICAtIGV4cGVjdGVkIG9uIGNsaWVudDogJHtmb3JtYXQoZXhwZWN0ZWQpfVxuICBOb3RlOiB0aGlzIG1pc21hdGNoIGlzIGNoZWNrLW9ubHkuIFRoZSBET00gd2lsbCBub3QgYmUgcmVjdGlmaWVkIGluIHByb2R1Y3Rpb24gZHVlIHRvIHBlcmZvcm1hbmNlIG92ZXJoZWFkLlxuICBZb3Ugc2hvdWxkIGZpeCB0aGUgc291cmNlIG9mIHRoZSBtaXNtYXRjaC5gO1xuICAgIHtcbiAgICAgIHdhcm4kMShwcmVTZWdtZW50LCBlbCwgcG9zdFNlZ21lbnQpO1xuICAgIH1cbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuICByZXR1cm4gZmFsc2U7XG59XG5mdW5jdGlvbiB0b0NsYXNzU2V0KHN0cikge1xuICByZXR1cm4gbmV3IFNldChzdHIudHJpbSgpLnNwbGl0KC9cXHMrLykpO1xufVxuZnVuY3Rpb24gaXNTZXRFcXVhbChhLCBiKSB7XG4gIGlmIChhLnNpemUgIT09IGIuc2l6ZSkge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuICBmb3IgKGNvbnN0IHMgb2YgYSkge1xuICAgIGlmICghYi5oYXMocykpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHRydWU7XG59XG5mdW5jdGlvbiB0b1N0eWxlTWFwKHN0cikge1xuICBjb25zdCBzdHlsZU1hcCA9IC8qIEBfX1BVUkVfXyAqLyBuZXcgTWFwKCk7XG4gIGZvciAoY29uc3QgaXRlbSBvZiBzdHIuc3BsaXQoXCI7XCIpKSB7XG4gICAgbGV0IFtrZXksIHZhbHVlXSA9IGl0ZW0uc3BsaXQoXCI6XCIpO1xuICAgIGtleSA9IGtleS50cmltKCk7XG4gICAgdmFsdWUgPSB2YWx1ZSAmJiB2YWx1ZS50cmltKCk7XG4gICAgaWYgKGtleSAmJiB2YWx1ZSkge1xuICAgICAgc3R5bGVNYXAuc2V0KGtleSwgdmFsdWUpO1xuICAgIH1cbiAgfVxuICByZXR1cm4gc3R5bGVNYXA7XG59XG5mdW5jdGlvbiBpc01hcEVxdWFsKGEsIGIpIHtcbiAgaWYgKGEuc2l6ZSAhPT0gYi5zaXplKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG4gIGZvciAoY29uc3QgW2tleSwgdmFsdWVdIG9mIGEpIHtcbiAgICBpZiAodmFsdWUgIT09IGIuZ2V0KGtleSkpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHRydWU7XG59XG5mdW5jdGlvbiByZXNvbHZlQ3NzVmFycyhpbnN0YW5jZSwgdm5vZGUsIGV4cGVjdGVkTWFwKSB7XG4gIGNvbnN0IHJvb3QgPSBpbnN0YW5jZS5zdWJUcmVlO1xuICBpZiAoaW5zdGFuY2UuZ2V0Q3NzVmFycyAmJiAodm5vZGUgPT09IHJvb3QgfHwgcm9vdCAmJiByb290LnR5cGUgPT09IEZyYWdtZW50ICYmIHJvb3QuY2hpbGRyZW4uaW5jbHVkZXModm5vZGUpKSkge1xuICAgIGNvbnN0IGNzc1ZhcnMgPSBpbnN0YW5jZS5nZXRDc3NWYXJzKCk7XG4gICAgZm9yIChjb25zdCBrZXkgaW4gY3NzVmFycykge1xuICAgICAgY29uc3QgdmFsdWUgPSBub3JtYWxpemVDc3NWYXJWYWx1ZShjc3NWYXJzW2tleV0pO1xuICAgICAgZXhwZWN0ZWRNYXAuc2V0KGAtLSR7Z2V0RXNjYXBlZENzc1Zhck5hbWUoa2V5LCBmYWxzZSl9YCwgdmFsdWUpO1xuICAgIH1cbiAgfVxuICBpZiAodm5vZGUgPT09IHJvb3QgJiYgaW5zdGFuY2UucGFyZW50KSB7XG4gICAgcmVzb2x2ZUNzc1ZhcnMoaW5zdGFuY2UucGFyZW50LCBpbnN0YW5jZS52bm9kZSwgZXhwZWN0ZWRNYXApO1xuICB9XG59XG5jb25zdCBhbGxvd01pc21hdGNoQXR0ciA9IFwiZGF0YS1hbGxvdy1taXNtYXRjaFwiO1xuY29uc3QgTWlzbWF0Y2hUeXBlU3RyaW5nID0ge1xuICBbMCAvKiBURVhUICovXTogXCJ0ZXh0XCIsXG4gIFsxIC8qIENISUxEUkVOICovXTogXCJjaGlsZHJlblwiLFxuICBbMiAvKiBDTEFTUyAqL106IFwiY2xhc3NcIixcbiAgWzMgLyogU1RZTEUgKi9dOiBcInN0eWxlXCIsXG4gIFs0IC8qIEFUVFJJQlVURSAqL106IFwiYXR0cmlidXRlXCJcbn07XG5mdW5jdGlvbiBpc01pc21hdGNoQWxsb3dlZChlbCwgYWxsb3dlZFR5cGUpIHtcbiAgaWYgKGFsbG93ZWRUeXBlID09PSAwIC8qIFRFWFQgKi8gfHwgYWxsb3dlZFR5cGUgPT09IDEgLyogQ0hJTERSRU4gKi8pIHtcbiAgICB3aGlsZSAoZWwgJiYgIWVsLmhhc0F0dHJpYnV0ZShhbGxvd01pc21hdGNoQXR0cikpIHtcbiAgICAgIGVsID0gZWwucGFyZW50RWxlbWVudDtcbiAgICB9XG4gIH1cbiAgY29uc3QgYWxsb3dlZEF0dHIgPSBlbCAmJiBlbC5nZXRBdHRyaWJ1dGUoYWxsb3dNaXNtYXRjaEF0dHIpO1xuICBpZiAoYWxsb3dlZEF0dHIgPT0gbnVsbCkge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfSBlbHNlIGlmIChhbGxvd2VkQXR0ciA9PT0gXCJcIikge1xuICAgIHJldHVybiB0cnVlO1xuICB9IGVsc2Uge1xuICAgIGNvbnN0IGxpc3QgPSBhbGxvd2VkQXR0ci5zcGxpdChcIixcIik7XG4gICAgaWYgKGFsbG93ZWRUeXBlID09PSAwIC8qIFRFWFQgKi8gJiYgbGlzdC5pbmNsdWRlcyhcImNoaWxkcmVuXCIpKSB7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gICAgcmV0dXJuIGxpc3QuaW5jbHVkZXMoTWlzbWF0Y2hUeXBlU3RyaW5nW2FsbG93ZWRUeXBlXSk7XG4gIH1cbn1cblxuY29uc3QgcmVxdWVzdElkbGVDYWxsYmFjayA9IGdldEdsb2JhbFRoaXMoKS5yZXF1ZXN0SWRsZUNhbGxiYWNrIHx8ICgoY2IpID0+IHNldFRpbWVvdXQoY2IsIDEpKTtcbmNvbnN0IGNhbmNlbElkbGVDYWxsYmFjayA9IGdldEdsb2JhbFRoaXMoKS5jYW5jZWxJZGxlQ2FsbGJhY2sgfHwgKChpZCkgPT4gY2xlYXJUaW1lb3V0KGlkKSk7XG5jb25zdCBoeWRyYXRlT25JZGxlID0gKHRpbWVvdXQgPSAxZTQpID0+IChoeWRyYXRlKSA9PiB7XG4gIGNvbnN0IGlkID0gcmVxdWVzdElkbGVDYWxsYmFjayhoeWRyYXRlLCB7IHRpbWVvdXQgfSk7XG4gIHJldHVybiAoKSA9PiBjYW5jZWxJZGxlQ2FsbGJhY2soaWQpO1xufTtcbmZ1bmN0aW9uIGVsZW1lbnRJc1Zpc2libGVJblZpZXdwb3J0KGVsKSB7XG4gIGNvbnN0IHsgdG9wLCBsZWZ0LCBib3R0b20sIHJpZ2h0IH0gPSBlbC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcbiAgY29uc3QgeyBpbm5lckhlaWdodCwgaW5uZXJXaWR0aCB9ID0gd2luZG93O1xuICByZXR1cm4gKHRvcCA+IDAgJiYgdG9wIDwgaW5uZXJIZWlnaHQgfHwgYm90dG9tID4gMCAmJiBib3R0b20gPCBpbm5lckhlaWdodCkgJiYgKGxlZnQgPiAwICYmIGxlZnQgPCBpbm5lcldpZHRoIHx8IHJpZ2h0ID4gMCAmJiByaWdodCA8IGlubmVyV2lkdGgpO1xufVxuY29uc3QgaHlkcmF0ZU9uVmlzaWJsZSA9IChvcHRzKSA9PiAoaHlkcmF0ZSwgZm9yRWFjaCkgPT4ge1xuICBjb25zdCBvYiA9IG5ldyBJbnRlcnNlY3Rpb25PYnNlcnZlcigoZW50cmllcykgPT4ge1xuICAgIGZvciAoY29uc3QgZSBvZiBlbnRyaWVzKSB7XG4gICAgICBpZiAoIWUuaXNJbnRlcnNlY3RpbmcpIGNvbnRpbnVlO1xuICAgICAgb2IuZGlzY29ubmVjdCgpO1xuICAgICAgaHlkcmF0ZSgpO1xuICAgICAgYnJlYWs7XG4gICAgfVxuICB9LCBvcHRzKTtcbiAgZm9yRWFjaCgoZWwpID0+IHtcbiAgICBpZiAoIShlbCBpbnN0YW5jZW9mIEVsZW1lbnQpKSByZXR1cm47XG4gICAgaWYgKGVsZW1lbnRJc1Zpc2libGVJblZpZXdwb3J0KGVsKSkge1xuICAgICAgaHlkcmF0ZSgpO1xuICAgICAgb2IuZGlzY29ubmVjdCgpO1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICBvYi5vYnNlcnZlKGVsKTtcbiAgfSk7XG4gIHJldHVybiAoKSA9PiBvYi5kaXNjb25uZWN0KCk7XG59O1xuY29uc3QgaHlkcmF0ZU9uTWVkaWFRdWVyeSA9IChxdWVyeSkgPT4gKGh5ZHJhdGUpID0+IHtcbiAgaWYgKHF1ZXJ5KSB7XG4gICAgY29uc3QgbXFsID0gbWF0Y2hNZWRpYShxdWVyeSk7XG4gICAgaWYgKG1xbC5tYXRjaGVzKSB7XG4gICAgICBoeWRyYXRlKCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIG1xbC5hZGRFdmVudExpc3RlbmVyKFwiY2hhbmdlXCIsIGh5ZHJhdGUsIHsgb25jZTogdHJ1ZSB9KTtcbiAgICAgIHJldHVybiAoKSA9PiBtcWwucmVtb3ZlRXZlbnRMaXN0ZW5lcihcImNoYW5nZVwiLCBoeWRyYXRlKTtcbiAgICB9XG4gIH1cbn07XG5jb25zdCBoeWRyYXRlT25JbnRlcmFjdGlvbiA9IChpbnRlcmFjdGlvbnMgPSBbXSkgPT4gKGh5ZHJhdGUsIGZvckVhY2gpID0+IHtcbiAgaWYgKGlzU3RyaW5nKGludGVyYWN0aW9ucykpIGludGVyYWN0aW9ucyA9IFtpbnRlcmFjdGlvbnNdO1xuICBsZXQgaGFzSHlkcmF0ZWQgPSBmYWxzZTtcbiAgY29uc3QgZG9IeWRyYXRlID0gKGUpID0+IHtcbiAgICBpZiAoIWhhc0h5ZHJhdGVkKSB7XG4gICAgICBoYXNIeWRyYXRlZCA9IHRydWU7XG4gICAgICB0ZWFyZG93bigpO1xuICAgICAgaHlkcmF0ZSgpO1xuICAgICAgZS50YXJnZXQuZGlzcGF0Y2hFdmVudChuZXcgZS5jb25zdHJ1Y3RvcihlLnR5cGUsIGUpKTtcbiAgICB9XG4gIH07XG4gIGNvbnN0IHRlYXJkb3duID0gKCkgPT4ge1xuICAgIGZvckVhY2goKGVsKSA9PiB7XG4gICAgICBmb3IgKGNvbnN0IGkgb2YgaW50ZXJhY3Rpb25zKSB7XG4gICAgICAgIGVsLnJlbW92ZUV2ZW50TGlzdGVuZXIoaSwgZG9IeWRyYXRlKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfTtcbiAgZm9yRWFjaCgoZWwpID0+IHtcbiAgICBmb3IgKGNvbnN0IGkgb2YgaW50ZXJhY3Rpb25zKSB7XG4gICAgICBlbC5hZGRFdmVudExpc3RlbmVyKGksIGRvSHlkcmF0ZSwgeyBvbmNlOiB0cnVlIH0pO1xuICAgIH1cbiAgfSk7XG4gIHJldHVybiB0ZWFyZG93bjtcbn07XG5mdW5jdGlvbiBmb3JFYWNoRWxlbWVudChub2RlLCBjYikge1xuICBpZiAoaXNDb21tZW50KG5vZGUpICYmIG5vZGUuZGF0YSA9PT0gXCJbXCIpIHtcbiAgICBsZXQgZGVwdGggPSAxO1xuICAgIGxldCBuZXh0ID0gbm9kZS5uZXh0U2libGluZztcbiAgICB3aGlsZSAobmV4dCkge1xuICAgICAgaWYgKG5leHQubm9kZVR5cGUgPT09IDEpIHtcbiAgICAgICAgY29uc3QgcmVzdWx0ID0gY2IobmV4dCk7XG4gICAgICAgIGlmIChyZXN1bHQgPT09IGZhbHNlKSB7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSBpZiAoaXNDb21tZW50KG5leHQpKSB7XG4gICAgICAgIGlmIChuZXh0LmRhdGEgPT09IFwiXVwiKSB7XG4gICAgICAgICAgaWYgKC0tZGVwdGggPT09IDApIGJyZWFrO1xuICAgICAgICB9IGVsc2UgaWYgKG5leHQuZGF0YSA9PT0gXCJbXCIpIHtcbiAgICAgICAgICBkZXB0aCsrO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBuZXh0ID0gbmV4dC5uZXh0U2libGluZztcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgY2Iobm9kZSk7XG4gIH1cbn1cblxuY29uc3QgaXNBc3luY1dyYXBwZXIgPSAoaSkgPT4gISFpLnR5cGUuX19hc3luY0xvYWRlcjtcbi8vIEBfX05PX1NJREVfRUZGRUNUU19fXG5mdW5jdGlvbiBkZWZpbmVBc3luY0NvbXBvbmVudChzb3VyY2UpIHtcbiAgaWYgKGlzRnVuY3Rpb24oc291cmNlKSkge1xuICAgIHNvdXJjZSA9IHsgbG9hZGVyOiBzb3VyY2UgfTtcbiAgfVxuICBjb25zdCB7XG4gICAgbG9hZGVyLFxuICAgIGxvYWRpbmdDb21wb25lbnQsXG4gICAgZXJyb3JDb21wb25lbnQsXG4gICAgZGVsYXkgPSAyMDAsXG4gICAgaHlkcmF0ZTogaHlkcmF0ZVN0cmF0ZWd5LFxuICAgIHRpbWVvdXQsXG4gICAgLy8gdW5kZWZpbmVkID0gbmV2ZXIgdGltZXMgb3V0XG4gICAgc3VzcGVuc2libGUgPSB0cnVlLFxuICAgIG9uRXJyb3I6IHVzZXJPbkVycm9yXG4gIH0gPSBzb3VyY2U7XG4gIGxldCBwZW5kaW5nUmVxdWVzdCA9IG51bGw7XG4gIGxldCByZXNvbHZlZENvbXA7XG4gIGxldCByZXRyaWVzID0gMDtcbiAgY29uc3QgcmV0cnkgPSAoKSA9PiB7XG4gICAgcmV0cmllcysrO1xuICAgIHBlbmRpbmdSZXF1ZXN0ID0gbnVsbDtcbiAgICByZXR1cm4gbG9hZCgpO1xuICB9O1xuICBjb25zdCBsb2FkID0gKCkgPT4ge1xuICAgIGxldCB0aGlzUmVxdWVzdDtcbiAgICByZXR1cm4gcGVuZGluZ1JlcXVlc3QgfHwgKHRoaXNSZXF1ZXN0ID0gcGVuZGluZ1JlcXVlc3QgPSBsb2FkZXIoKS5jYXRjaCgoZXJyKSA9PiB7XG4gICAgICBlcnIgPSBlcnIgaW5zdGFuY2VvZiBFcnJvciA/IGVyciA6IG5ldyBFcnJvcihTdHJpbmcoZXJyKSk7XG4gICAgICBpZiAodXNlck9uRXJyb3IpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICBjb25zdCB1c2VyUmV0cnkgPSAoKSA9PiByZXNvbHZlKHJldHJ5KCkpO1xuICAgICAgICAgIGNvbnN0IHVzZXJGYWlsID0gKCkgPT4gcmVqZWN0KGVycik7XG4gICAgICAgICAgdXNlck9uRXJyb3IoZXJyLCB1c2VyUmV0cnksIHVzZXJGYWlsLCByZXRyaWVzICsgMSk7XG4gICAgICAgIH0pO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhyb3cgZXJyO1xuICAgICAgfVxuICAgIH0pLnRoZW4oKGNvbXApID0+IHtcbiAgICAgIGlmICh0aGlzUmVxdWVzdCAhPT0gcGVuZGluZ1JlcXVlc3QgJiYgcGVuZGluZ1JlcXVlc3QpIHtcbiAgICAgICAgcmV0dXJuIHBlbmRpbmdSZXF1ZXN0O1xuICAgICAgfVxuICAgICAgaWYgKCEhKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSBcInByb2R1Y3Rpb25cIikgJiYgIWNvbXApIHtcbiAgICAgICAgd2FybiQxKFxuICAgICAgICAgIGBBc3luYyBjb21wb25lbnQgbG9hZGVyIHJlc29sdmVkIHRvIHVuZGVmaW5lZC4gSWYgeW91IGFyZSB1c2luZyByZXRyeSgpLCBtYWtlIHN1cmUgdG8gcmV0dXJuIGl0cyByZXR1cm4gdmFsdWUuYFxuICAgICAgICApO1xuICAgICAgfVxuICAgICAgaWYgKGNvbXAgJiYgKGNvbXAuX19lc01vZHVsZSB8fCBjb21wW1N5bWJvbC50b1N0cmluZ1RhZ10gPT09IFwiTW9kdWxlXCIpKSB7XG4gICAgICAgIGNvbXAgPSBjb21wLmRlZmF1bHQ7XG4gICAgICB9XG4gICAgICBpZiAoISEocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09IFwicHJvZHVjdGlvblwiKSAmJiBjb21wICYmICFpc09iamVjdChjb21wKSAmJiAhaXNGdW5jdGlvbihjb21wKSkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYEludmFsaWQgYXN5bmMgY29tcG9uZW50IGxvYWQgcmVzdWx0OiAke2NvbXB9YCk7XG4gICAgICB9XG4gICAgICByZXNvbHZlZENvbXAgPSBjb21wO1xuICAgICAgcmV0dXJuIGNvbXA7XG4gICAgfSkpO1xuICB9O1xuICByZXR1cm4gZGVmaW5lQ29tcG9uZW50KHtcbiAgICBuYW1lOiBcIkFzeW5jQ29tcG9uZW50V3JhcHBlclwiLFxuICAgIF9fYXN5bmNMb2FkZXI6IGxvYWQsXG4gICAgX19hc3luY0h5ZHJhdGUoZWwsIGluc3RhbmNlLCBoeWRyYXRlKSB7XG4gICAgICBsZXQgcGF0Y2hlZCA9IGZhbHNlO1xuICAgICAgKGluc3RhbmNlLmJ1IHx8IChpbnN0YW5jZS5idSA9IFtdKSkucHVzaCgoKSA9PiBwYXRjaGVkID0gdHJ1ZSk7XG4gICAgICBjb25zdCBwZXJmb3JtSHlkcmF0ZSA9ICgpID0+IHtcbiAgICAgICAgaWYgKHBhdGNoZWQpIHtcbiAgICAgICAgICBpZiAoISEocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09IFwicHJvZHVjdGlvblwiKSkge1xuICAgICAgICAgICAgd2FybiQxKFxuICAgICAgICAgICAgICBgU2tpcHBpbmcgbGF6eSBoeWRyYXRpb24gZm9yIGNvbXBvbmVudCAnJHtnZXRDb21wb25lbnROYW1lKHJlc29sdmVkQ29tcCkgfHwgcmVzb2x2ZWRDb21wLl9fZmlsZX0nOiBpdCB3YXMgdXBkYXRlZCBiZWZvcmUgbGF6eSBoeWRyYXRpb24gcGVyZm9ybWVkLmBcbiAgICAgICAgICAgICk7XG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBoeWRyYXRlKCk7XG4gICAgICB9O1xuICAgICAgY29uc3QgZG9IeWRyYXRlID0gaHlkcmF0ZVN0cmF0ZWd5ID8gKCkgPT4ge1xuICAgICAgICBjb25zdCB0ZWFyZG93biA9IGh5ZHJhdGVTdHJhdGVneShcbiAgICAgICAgICBwZXJmb3JtSHlkcmF0ZSxcbiAgICAgICAgICAoY2IpID0+IGZvckVhY2hFbGVtZW50KGVsLCBjYilcbiAgICAgICAgKTtcbiAgICAgICAgaWYgKHRlYXJkb3duKSB7XG4gICAgICAgICAgKGluc3RhbmNlLmJ1bSB8fCAoaW5zdGFuY2UuYnVtID0gW10pKS5wdXNoKHRlYXJkb3duKTtcbiAgICAgICAgfVxuICAgICAgfSA6IHBlcmZvcm1IeWRyYXRlO1xuICAgICAgaWYgKHJlc29sdmVkQ29tcCkge1xuICAgICAgICBkb0h5ZHJhdGUoKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGxvYWQoKS50aGVuKCgpID0+ICFpbnN0YW5jZS5pc1VubW91bnRlZCAmJiBkb0h5ZHJhdGUoKSk7XG4gICAgICB9XG4gICAgfSxcbiAgICBnZXQgX19hc3luY1Jlc29sdmVkKCkge1xuICAgICAgcmV0dXJuIHJlc29sdmVkQ29tcDtcbiAgICB9LFxuICAgIHNldHVwKCkge1xuICAgICAgY29uc3QgaW5zdGFuY2UgPSBjdXJyZW50SW5zdGFuY2U7XG4gICAgICBtYXJrQXN5bmNCb3VuZGFyeShpbnN0YW5jZSk7XG4gICAgICBpZiAocmVzb2x2ZWRDb21wKSB7XG4gICAgICAgIHJldHVybiAoKSA9PiBjcmVhdGVJbm5lckNvbXAocmVzb2x2ZWRDb21wLCBpbnN0YW5jZSk7XG4gICAgICB9XG4gICAgICBjb25zdCBvbkVycm9yID0gKGVycikgPT4ge1xuICAgICAgICBwZW5kaW5nUmVxdWVzdCA9IG51bGw7XG4gICAgICAgIGhhbmRsZUVycm9yKFxuICAgICAgICAgIGVycixcbiAgICAgICAgICBpbnN0YW5jZSxcbiAgICAgICAgICAxMyxcbiAgICAgICAgICAhZXJyb3JDb21wb25lbnRcbiAgICAgICAgKTtcbiAgICAgIH07XG4gICAgICBpZiAoc3VzcGVuc2libGUgJiYgaW5zdGFuY2Uuc3VzcGVuc2UgfHwgaXNJblNTUkNvbXBvbmVudFNldHVwKSB7XG4gICAgICAgIHJldHVybiBsb2FkKCkudGhlbigoY29tcCkgPT4ge1xuICAgICAgICAgIHJldHVybiAoKSA9PiBjcmVhdGVJbm5lckNvbXAoY29tcCwgaW5zdGFuY2UpO1xuICAgICAgICB9KS5jYXRjaCgoZXJyKSA9PiB7XG4gICAgICAgICAgb25FcnJvcihlcnIpO1xuICAgICAgICAgIHJldHVybiAoKSA9PiBlcnJvckNvbXBvbmVudCA/IGNyZWF0ZVZOb2RlKGVycm9yQ29tcG9uZW50LCB7XG4gICAgICAgICAgICBlcnJvcjogZXJyXG4gICAgICAgICAgfSkgOiBudWxsO1xuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICAgIGNvbnN0IGxvYWRlZCA9IHJlZihmYWxzZSk7XG4gICAgICBjb25zdCBlcnJvciA9IHJlZigpO1xuICAgICAgY29uc3QgZGVsYXllZCA9IHJlZighIWRlbGF5KTtcbiAgICAgIGlmIChkZWxheSkge1xuICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgICBkZWxheWVkLnZhbHVlID0gZmFsc2U7XG4gICAgICAgIH0sIGRlbGF5KTtcbiAgICAgIH1cbiAgICAgIGlmICh0aW1lb3V0ICE9IG51bGwpIHtcbiAgICAgICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgaWYgKCFsb2FkZWQudmFsdWUgJiYgIWVycm9yLnZhbHVlKSB7XG4gICAgICAgICAgICBjb25zdCBlcnIgPSBuZXcgRXJyb3IoXG4gICAgICAgICAgICAgIGBBc3luYyBjb21wb25lbnQgdGltZWQgb3V0IGFmdGVyICR7dGltZW91dH1tcy5gXG4gICAgICAgICAgICApO1xuICAgICAgICAgICAgb25FcnJvcihlcnIpO1xuICAgICAgICAgICAgZXJyb3IudmFsdWUgPSBlcnI7XG4gICAgICAgICAgfVxuICAgICAgICB9LCB0aW1lb3V0KTtcbiAgICAgIH1cbiAgICAgIGxvYWQoKS50aGVuKCgpID0+IHtcbiAgICAgICAgbG9hZGVkLnZhbHVlID0gdHJ1ZTtcbiAgICAgICAgaWYgKGluc3RhbmNlLnBhcmVudCAmJiBpc0tlZXBBbGl2ZShpbnN0YW5jZS5wYXJlbnQudm5vZGUpKSB7XG4gICAgICAgICAgaW5zdGFuY2UucGFyZW50LnVwZGF0ZSgpO1xuICAgICAgICB9XG4gICAgICB9KS5jYXRjaCgoZXJyKSA9PiB7XG4gICAgICAgIG9uRXJyb3IoZXJyKTtcbiAgICAgICAgZXJyb3IudmFsdWUgPSBlcnI7XG4gICAgICB9KTtcbiAgICAgIHJldHVybiAoKSA9PiB7XG4gICAgICAgIGlmIChsb2FkZWQudmFsdWUgJiYgcmVzb2x2ZWRDb21wKSB7XG4gICAgICAgICAgcmV0dXJuIGNyZWF0ZUlubmVyQ29tcChyZXNvbHZlZENvbXAsIGluc3RhbmNlKTtcbiAgICAgICAgfSBlbHNlIGlmIChlcnJvci52YWx1ZSAmJiBlcnJvckNvbXBvbmVudCkge1xuICAgICAgICAgIHJldHVybiBjcmVhdGVWTm9kZShlcnJvckNvbXBvbmVudCwge1xuICAgICAgICAgICAgZXJyb3I6IGVycm9yLnZhbHVlXG4gICAgICAgICAgfSk7XG4gICAgICAgIH0gZWxzZSBpZiAobG9hZGluZ0NvbXBvbmVudCAmJiAhZGVsYXllZC52YWx1ZSkge1xuICAgICAgICAgIHJldHVybiBjcmVhdGVJbm5lckNvbXAoXG4gICAgICAgICAgICBsb2FkaW5nQ29tcG9uZW50LFxuICAgICAgICAgICAgaW5zdGFuY2VcbiAgICAgICAgICApO1xuICAgICAgICB9XG4gICAgICB9O1xuICAgIH1cbiAgfSk7XG59XG5mdW5jdGlvbiBjcmVhdGVJbm5lckNvbXAoY29tcCwgcGFyZW50KSB7XG4gIGNvbnN0IHsgcmVmOiByZWYyLCBwcm9wcywgY2hpbGRyZW4sIGNlIH0gPSBwYXJlbnQudm5vZGU7XG4gIGNvbnN0IHZub2RlID0gY3JlYXRlVk5vZGUoY29tcCwgcHJvcHMsIGNoaWxkcmVuKTtcbiAgdm5vZGUucmVmID0gcmVmMjtcbiAgdm5vZGUuY2UgPSBjZTtcbiAgZGVsZXRlIHBhcmVudC52bm9kZS5jZTtcbiAgcmV0dXJuIHZub2RlO1xufVxuXG5jb25zdCBpc0tlZXBBbGl2ZSA9ICh2bm9kZSkgPT4gdm5vZGUudHlwZS5fX2lzS2VlcEFsaXZlO1xuY29uc3QgS2VlcEFsaXZlSW1wbCA9IHtcbiAgbmFtZTogYEtlZXBBbGl2ZWAsXG4gIC8vIE1hcmtlciBmb3Igc3BlY2lhbCBoYW5kbGluZyBpbnNpZGUgdGhlIHJlbmRlcmVyLiBXZSBhcmUgbm90IHVzaW5nIGEgPT09XG4gIC8vIGNoZWNrIGRpcmVjdGx5IG9uIEtlZXBBbGl2ZSBpbiB0aGUgcmVuZGVyZXIsIGJlY2F1c2UgaW1wb3J0aW5nIGl0IGRpcmVjdGx5XG4gIC8vIHdvdWxkIHByZXZlbnQgaXQgZnJvbSBiZWluZyB0cmVlLXNoYWtlbi5cbiAgX19pc0tlZXBBbGl2ZTogdHJ1ZSxcbiAgcHJvcHM6IHtcbiAgICBpbmNsdWRlOiBbU3RyaW5nLCBSZWdFeHAsIEFycmF5XSxcbiAgICBleGNsdWRlOiBbU3RyaW5nLCBSZWdFeHAsIEFycmF5XSxcbiAgICBtYXg6IFtTdHJpbmcsIE51bWJlcl1cbiAgfSxcbiAgc2V0dXAocHJvcHMsIHsgc2xvdHMgfSkge1xuICAgIGNvbnN0IGluc3RhbmNlID0gZ2V0Q3VycmVudEluc3RhbmNlKCk7XG4gICAgY29uc3Qgc2hhcmVkQ29udGV4dCA9IGluc3RhbmNlLmN0eDtcbiAgICBpZiAoIXNoYXJlZENvbnRleHQucmVuZGVyZXIpIHtcbiAgICAgIHJldHVybiAoKSA9PiB7XG4gICAgICAgIGNvbnN0IGNoaWxkcmVuID0gc2xvdHMuZGVmYXVsdCAmJiBzbG90cy5kZWZhdWx0KCk7XG4gICAgICAgIHJldHVybiBjaGlsZHJlbiAmJiBjaGlsZHJlbi5sZW5ndGggPT09IDEgPyBjaGlsZHJlblswXSA6IGNoaWxkcmVuO1xuICAgICAgfTtcbiAgICB9XG4gICAgY29uc3QgY2FjaGUgPSAvKiBAX19QVVJFX18gKi8gbmV3IE1hcCgpO1xuICAgIGNvbnN0IGtleXMgPSAvKiBAX19QVVJFX18gKi8gbmV3IFNldCgpO1xuICAgIGxldCBjdXJyZW50ID0gbnVsbDtcbiAgICBpZiAoISEocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09IFwicHJvZHVjdGlvblwiKSB8fCBfX1ZVRV9QUk9EX0RFVlRPT0xTX18pIHtcbiAgICAgIGluc3RhbmNlLl9fdl9jYWNoZSA9IGNhY2hlO1xuICAgIH1cbiAgICBjb25zdCBwYXJlbnRTdXNwZW5zZSA9IGluc3RhbmNlLnN1c3BlbnNlO1xuICAgIGNvbnN0IHtcbiAgICAgIHJlbmRlcmVyOiB7XG4gICAgICAgIHA6IHBhdGNoLFxuICAgICAgICBtOiBtb3ZlLFxuICAgICAgICB1bTogX3VubW91bnQsXG4gICAgICAgIG86IHsgY3JlYXRlRWxlbWVudCB9XG4gICAgICB9XG4gICAgfSA9IHNoYXJlZENvbnRleHQ7XG4gICAgY29uc3Qgc3RvcmFnZUNvbnRhaW5lciA9IGNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gICAgc2hhcmVkQ29udGV4dC5hY3RpdmF0ZSA9ICh2bm9kZSwgY29udGFpbmVyLCBhbmNob3IsIG5hbWVzcGFjZSwgb3B0aW1pemVkKSA9PiB7XG4gICAgICBjb25zdCBpbnN0YW5jZTIgPSB2bm9kZS5jb21wb25lbnQ7XG4gICAgICBtb3ZlKHZub2RlLCBjb250YWluZXIsIGFuY2hvciwgMCwgcGFyZW50U3VzcGVuc2UpO1xuICAgICAgcGF0Y2goXG4gICAgICAgIGluc3RhbmNlMi52bm9kZSxcbiAgICAgICAgdm5vZGUsXG4gICAgICAgIGNvbnRhaW5lcixcbiAgICAgICAgYW5jaG9yLFxuICAgICAgICBpbnN0YW5jZTIsXG4gICAgICAgIHBhcmVudFN1c3BlbnNlLFxuICAgICAgICBuYW1lc3BhY2UsXG4gICAgICAgIHZub2RlLnNsb3RTY29wZUlkcyxcbiAgICAgICAgb3B0aW1pemVkXG4gICAgICApO1xuICAgICAgcXVldWVQb3N0UmVuZGVyRWZmZWN0KCgpID0+IHtcbiAgICAgICAgaW5zdGFuY2UyLmlzRGVhY3RpdmF0ZWQgPSBmYWxzZTtcbiAgICAgICAgaWYgKGluc3RhbmNlMi5hKSB7XG4gICAgICAgICAgaW52b2tlQXJyYXlGbnMoaW5zdGFuY2UyLmEpO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHZub2RlSG9vayA9IHZub2RlLnByb3BzICYmIHZub2RlLnByb3BzLm9uVm5vZGVNb3VudGVkO1xuICAgICAgICBpZiAodm5vZGVIb29rKSB7XG4gICAgICAgICAgaW52b2tlVk5vZGVIb29rKHZub2RlSG9vaywgaW5zdGFuY2UyLnBhcmVudCwgdm5vZGUpO1xuICAgICAgICB9XG4gICAgICB9LCBwYXJlbnRTdXNwZW5zZSk7XG4gICAgICBpZiAoISEocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09IFwicHJvZHVjdGlvblwiKSB8fCBfX1ZVRV9QUk9EX0RFVlRPT0xTX18pIHtcbiAgICAgICAgZGV2dG9vbHNDb21wb25lbnRBZGRlZChpbnN0YW5jZTIpO1xuICAgICAgfVxuICAgIH07XG4gICAgc2hhcmVkQ29udGV4dC5kZWFjdGl2YXRlID0gKHZub2RlKSA9PiB7XG4gICAgICBjb25zdCBpbnN0YW5jZTIgPSB2bm9kZS5jb21wb25lbnQ7XG4gICAgICBpbnZhbGlkYXRlTW91bnQoaW5zdGFuY2UyLm0pO1xuICAgICAgaW52YWxpZGF0ZU1vdW50KGluc3RhbmNlMi5hKTtcbiAgICAgIG1vdmUodm5vZGUsIHN0b3JhZ2VDb250YWluZXIsIG51bGwsIDEsIHBhcmVudFN1c3BlbnNlKTtcbiAgICAgIHF1ZXVlUG9zdFJlbmRlckVmZmVjdCgoKSA9PiB7XG4gICAgICAgIGlmIChpbnN0YW5jZTIuZGEpIHtcbiAgICAgICAgICBpbnZva2VBcnJheUZucyhpbnN0YW5jZTIuZGEpO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHZub2RlSG9vayA9IHZub2RlLnByb3BzICYmIHZub2RlLnByb3BzLm9uVm5vZGVVbm1vdW50ZWQ7XG4gICAgICAgIGlmICh2bm9kZUhvb2spIHtcbiAgICAgICAgICBpbnZva2VWTm9kZUhvb2sodm5vZGVIb29rLCBpbnN0YW5jZTIucGFyZW50LCB2bm9kZSk7XG4gICAgICAgIH1cbiAgICAgICAgaW5zdGFuY2UyLmlzRGVhY3RpdmF0ZWQgPSB0cnVlO1xuICAgICAgfSwgcGFyZW50U3VzcGVuc2UpO1xuICAgICAgaWYgKCEhKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSBcInByb2R1Y3Rpb25cIikgfHwgX19WVUVfUFJPRF9ERVZUT09MU19fKSB7XG4gICAgICAgIGRldnRvb2xzQ29tcG9uZW50QWRkZWQoaW5zdGFuY2UyKTtcbiAgICAgIH1cbiAgICAgIGlmICghIShwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gXCJwcm9kdWN0aW9uXCIpICYmIHRydWUpIHtcbiAgICAgICAgaW5zdGFuY2UyLl9fa2VlcEFsaXZlU3RvcmFnZUNvbnRhaW5lciA9IHN0b3JhZ2VDb250YWluZXI7XG4gICAgICB9XG4gICAgfTtcbiAgICBmdW5jdGlvbiB1bm1vdW50KHZub2RlKSB7XG4gICAgICByZXNldFNoYXBlRmxhZyh2bm9kZSk7XG4gICAgICBfdW5tb3VudCh2bm9kZSwgaW5zdGFuY2UsIHBhcmVudFN1c3BlbnNlLCB0cnVlKTtcbiAgICB9XG4gICAgZnVuY3Rpb24gcHJ1bmVDYWNoZShmaWx0ZXIpIHtcbiAgICAgIGNhY2hlLmZvckVhY2goKHZub2RlLCBrZXkpID0+IHtcbiAgICAgICAgY29uc3QgbmFtZSA9IGdldENvbXBvbmVudE5hbWUoXG4gICAgICAgICAgaXNBc3luY1dyYXBwZXIodm5vZGUpID8gdm5vZGUudHlwZS5fX2FzeW5jUmVzb2x2ZWQgfHwge30gOiB2bm9kZS50eXBlXG4gICAgICAgICk7XG4gICAgICAgIGlmIChuYW1lICYmICFmaWx0ZXIobmFtZSkpIHtcbiAgICAgICAgICBwcnVuZUNhY2hlRW50cnkoa2V5KTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfVxuICAgIGZ1bmN0aW9uIHBydW5lQ2FjaGVFbnRyeShrZXkpIHtcbiAgICAgIGNvbnN0IGNhY2hlZCA9IGNhY2hlLmdldChrZXkpO1xuICAgICAgaWYgKGNhY2hlZCAmJiAoIWN1cnJlbnQgfHwgIWlzU2FtZVZOb2RlVHlwZShjYWNoZWQsIGN1cnJlbnQpKSkge1xuICAgICAgICB1bm1vdW50KGNhY2hlZCk7XG4gICAgICB9IGVsc2UgaWYgKGN1cnJlbnQpIHtcbiAgICAgICAgcmVzZXRTaGFwZUZsYWcoY3VycmVudCk7XG4gICAgICB9XG4gICAgICBjYWNoZS5kZWxldGUoa2V5KTtcbiAgICAgIGtleXMuZGVsZXRlKGtleSk7XG4gICAgfVxuICAgIHdhdGNoKFxuICAgICAgKCkgPT4gW3Byb3BzLmluY2x1ZGUsIHByb3BzLmV4Y2x1ZGVdLFxuICAgICAgKFtpbmNsdWRlLCBleGNsdWRlXSkgPT4ge1xuICAgICAgICBpbmNsdWRlICYmIHBydW5lQ2FjaGUoKG5hbWUpID0+IG1hdGNoZXMoaW5jbHVkZSwgbmFtZSkpO1xuICAgICAgICBleGNsdWRlICYmIHBydW5lQ2FjaGUoKG5hbWUpID0+ICFtYXRjaGVzKGV4Y2x1ZGUsIG5hbWUpKTtcbiAgICAgIH0sXG4gICAgICAvLyBwcnVuZSBwb3N0LXJlbmRlciBhZnRlciBgY3VycmVudGAgaGFzIGJlZW4gdXBkYXRlZFxuICAgICAgeyBmbHVzaDogXCJwb3N0XCIsIGRlZXA6IHRydWUgfVxuICAgICk7XG4gICAgbGV0IHBlbmRpbmdDYWNoZUtleSA9IG51bGw7XG4gICAgY29uc3QgY2FjaGVTdWJ0cmVlID0gKCkgPT4ge1xuICAgICAgaWYgKHBlbmRpbmdDYWNoZUtleSAhPSBudWxsKSB7XG4gICAgICAgIGlmIChpc1N1c3BlbnNlKGluc3RhbmNlLnN1YlRyZWUudHlwZSkpIHtcbiAgICAgICAgICBxdWV1ZVBvc3RSZW5kZXJFZmZlY3QoKCkgPT4ge1xuICAgICAgICAgICAgY2FjaGUuc2V0KHBlbmRpbmdDYWNoZUtleSwgZ2V0SW5uZXJDaGlsZChpbnN0YW5jZS5zdWJUcmVlKSk7XG4gICAgICAgICAgfSwgaW5zdGFuY2Uuc3ViVHJlZS5zdXNwZW5zZSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgY2FjaGUuc2V0KHBlbmRpbmdDYWNoZUtleSwgZ2V0SW5uZXJDaGlsZChpbnN0YW5jZS5zdWJUcmVlKSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9O1xuICAgIG9uTW91bnRlZChjYWNoZVN1YnRyZWUpO1xuICAgIG9uVXBkYXRlZChjYWNoZVN1YnRyZWUpO1xuICAgIG9uQmVmb3JlVW5tb3VudCgoKSA9PiB7XG4gICAgICBjYWNoZS5mb3JFYWNoKChjYWNoZWQpID0+IHtcbiAgICAgICAgY29uc3QgeyBzdWJUcmVlLCBzdXNwZW5zZSB9ID0gaW5zdGFuY2U7XG4gICAgICAgIGNvbnN0IHZub2RlID0gZ2V0SW5uZXJDaGlsZChzdWJUcmVlKTtcbiAgICAgICAgaWYgKGNhY2hlZC50eXBlID09PSB2bm9kZS50eXBlICYmIGNhY2hlZC5rZXkgPT09IHZub2RlLmtleSkge1xuICAgICAgICAgIHJlc2V0U2hhcGVGbGFnKHZub2RlKTtcbiAgICAgICAgICBjb25zdCBkYSA9IHZub2RlLmNvbXBvbmVudC5kYTtcbiAgICAgICAgICBkYSAmJiBxdWV1ZVBvc3RSZW5kZXJFZmZlY3QoZGEsIHN1c3BlbnNlKTtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgdW5tb3VudChjYWNoZWQpO1xuICAgICAgfSk7XG4gICAgfSk7XG4gICAgcmV0dXJuICgpID0+IHtcbiAgICAgIHBlbmRpbmdDYWNoZUtleSA9IG51bGw7XG4gICAgICBpZiAoIXNsb3RzLmRlZmF1bHQpIHtcbiAgICAgICAgcmV0dXJuIGN1cnJlbnQgPSBudWxsO1xuICAgICAgfVxuICAgICAgY29uc3QgY2hpbGRyZW4gPSBzbG90cy5kZWZhdWx0KCk7XG4gICAgICBjb25zdCByYXdWTm9kZSA9IGNoaWxkcmVuWzBdO1xuICAgICAgaWYgKGNoaWxkcmVuLmxlbmd0aCA+IDEpIHtcbiAgICAgICAgaWYgKCEhKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSBcInByb2R1Y3Rpb25cIikpIHtcbiAgICAgICAgICB3YXJuJDEoYEtlZXBBbGl2ZSBzaG91bGQgY29udGFpbiBleGFjdGx5IG9uZSBjb21wb25lbnQgY2hpbGQuYCk7XG4gICAgICAgIH1cbiAgICAgICAgY3VycmVudCA9IG51bGw7XG4gICAgICAgIHJldHVybiBjaGlsZHJlbjtcbiAgICAgIH0gZWxzZSBpZiAoIWlzVk5vZGUocmF3Vk5vZGUpIHx8ICEocmF3Vk5vZGUuc2hhcGVGbGFnICYgNCkgJiYgIShyYXdWTm9kZS5zaGFwZUZsYWcgJiAxMjgpKSB7XG4gICAgICAgIGN1cnJlbnQgPSBudWxsO1xuICAgICAgICByZXR1cm4gcmF3Vk5vZGU7XG4gICAgICB9XG4gICAgICBsZXQgdm5vZGUgPSBnZXRJbm5lckNoaWxkKHJhd1ZOb2RlKTtcbiAgICAgIGlmICh2bm9kZS50eXBlID09PSBDb21tZW50KSB7XG4gICAgICAgIGN1cnJlbnQgPSBudWxsO1xuICAgICAgICByZXR1cm4gdm5vZGU7XG4gICAgICB9XG4gICAgICBjb25zdCBjb21wID0gdm5vZGUudHlwZTtcbiAgICAgIGNvbnN0IG5hbWUgPSBnZXRDb21wb25lbnROYW1lKFxuICAgICAgICBpc0FzeW5jV3JhcHBlcih2bm9kZSkgPyB2bm9kZS50eXBlLl9fYXN5bmNSZXNvbHZlZCB8fCB7fSA6IGNvbXBcbiAgICAgICk7XG4gICAgICBjb25zdCB7IGluY2x1ZGUsIGV4Y2x1ZGUsIG1heCB9ID0gcHJvcHM7XG4gICAgICBpZiAoaW5jbHVkZSAmJiAoIW5hbWUgfHwgIW1hdGNoZXMoaW5jbHVkZSwgbmFtZSkpIHx8IGV4Y2x1ZGUgJiYgbmFtZSAmJiBtYXRjaGVzKGV4Y2x1ZGUsIG5hbWUpKSB7XG4gICAgICAgIHZub2RlLnNoYXBlRmxhZyAmPSAtMjU3O1xuICAgICAgICBjdXJyZW50ID0gdm5vZGU7XG4gICAgICAgIHJldHVybiByYXdWTm9kZTtcbiAgICAgIH1cbiAgICAgIGNvbnN0IGtleSA9IHZub2RlLmtleSA9PSBudWxsID8gY29tcCA6IHZub2RlLmtleTtcbiAgICAgIGNvbnN0IGNhY2hlZFZOb2RlID0gY2FjaGUuZ2V0KGtleSk7XG4gICAgICBpZiAodm5vZGUuZWwpIHtcbiAgICAgICAgdm5vZGUgPSBjbG9uZVZOb2RlKHZub2RlKTtcbiAgICAgICAgaWYgKHJhd1ZOb2RlLnNoYXBlRmxhZyAmIDEyOCkge1xuICAgICAgICAgIHJhd1ZOb2RlLnNzQ29udGVudCA9IHZub2RlO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBwZW5kaW5nQ2FjaGVLZXkgPSBrZXk7XG4gICAgICBpZiAoY2FjaGVkVk5vZGUpIHtcbiAgICAgICAgdm5vZGUuZWwgPSBjYWNoZWRWTm9kZS5lbDtcbiAgICAgICAgdm5vZGUuY29tcG9uZW50ID0gY2FjaGVkVk5vZGUuY29tcG9uZW50O1xuICAgICAgICBpZiAodm5vZGUudHJhbnNpdGlvbikge1xuICAgICAgICAgIHNldFRyYW5zaXRpb25Ib29rcyh2bm9kZSwgdm5vZGUudHJhbnNpdGlvbik7XG4gICAgICAgIH1cbiAgICAgICAgdm5vZGUuc2hhcGVGbGFnIHw9IDUxMjtcbiAgICAgICAga2V5cy5kZWxldGUoa2V5KTtcbiAgICAgICAga2V5cy5hZGQoa2V5KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGtleXMuYWRkKGtleSk7XG4gICAgICAgIGlmIChtYXggJiYga2V5cy5zaXplID4gcGFyc2VJbnQobWF4LCAxMCkpIHtcbiAgICAgICAgICBwcnVuZUNhY2hlRW50cnkoa2V5cy52YWx1ZXMoKS5uZXh0KCkudmFsdWUpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICB2bm9kZS5zaGFwZUZsYWcgfD0gMjU2O1xuICAgICAgY3VycmVudCA9IHZub2RlO1xuICAgICAgcmV0dXJuIGlzU3VzcGVuc2UocmF3Vk5vZGUudHlwZSkgPyByYXdWTm9kZSA6IHZub2RlO1xuICAgIH07XG4gIH1cbn07XG5jb25zdCBLZWVwQWxpdmUgPSBLZWVwQWxpdmVJbXBsO1xuZnVuY3Rpb24gbWF0Y2hlcyhwYXR0ZXJuLCBuYW1lKSB7XG4gIGlmIChpc0FycmF5KHBhdHRlcm4pKSB7XG4gICAgcmV0dXJuIHBhdHRlcm4uc29tZSgocCkgPT4gbWF0Y2hlcyhwLCBuYW1lKSk7XG4gIH0gZWxzZSBpZiAoaXNTdHJpbmcocGF0dGVybikpIHtcbiAgICByZXR1cm4gcGF0dGVybi5zcGxpdChcIixcIikuaW5jbHVkZXMobmFtZSk7XG4gIH0gZWxzZSBpZiAoaXNSZWdFeHAocGF0dGVybikpIHtcbiAgICBwYXR0ZXJuLmxhc3RJbmRleCA9IDA7XG4gICAgcmV0dXJuIHBhdHRlcm4udGVzdChuYW1lKTtcbiAgfVxuICByZXR1cm4gZmFsc2U7XG59XG5mdW5jdGlvbiBvbkFjdGl2YXRlZChob29rLCB0YXJnZXQpIHtcbiAgcmVnaXN0ZXJLZWVwQWxpdmVIb29rKGhvb2ssIFwiYVwiLCB0YXJnZXQpO1xufVxuZnVuY3Rpb24gb25EZWFjdGl2YXRlZChob29rLCB0YXJnZXQpIHtcbiAgcmVnaXN0ZXJLZWVwQWxpdmVIb29rKGhvb2ssIFwiZGFcIiwgdGFyZ2V0KTtcbn1cbmZ1bmN0aW9uIHJlZ2lzdGVyS2VlcEFsaXZlSG9vayhob29rLCB0eXBlLCB0YXJnZXQgPSBjdXJyZW50SW5zdGFuY2UpIHtcbiAgY29uc3Qgd3JhcHBlZEhvb2sgPSBob29rLl9fd2RjIHx8IChob29rLl9fd2RjID0gKCkgPT4ge1xuICAgIGxldCBjdXJyZW50ID0gdGFyZ2V0O1xuICAgIHdoaWxlIChjdXJyZW50KSB7XG4gICAgICBpZiAoY3VycmVudC5pc0RlYWN0aXZhdGVkKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIGN1cnJlbnQgPSBjdXJyZW50LnBhcmVudDtcbiAgICB9XG4gICAgcmV0dXJuIGhvb2soKTtcbiAgfSk7XG4gIGluamVjdEhvb2sodHlwZSwgd3JhcHBlZEhvb2ssIHRhcmdldCk7XG4gIGlmICh0YXJnZXQpIHtcbiAgICBsZXQgY3VycmVudCA9IHRhcmdldC5wYXJlbnQ7XG4gICAgd2hpbGUgKGN1cnJlbnQgJiYgY3VycmVudC5wYXJlbnQpIHtcbiAgICAgIGlmIChpc0tlZXBBbGl2ZShjdXJyZW50LnBhcmVudC52bm9kZSkpIHtcbiAgICAgICAgaW5qZWN0VG9LZWVwQWxpdmVSb290KHdyYXBwZWRIb29rLCB0eXBlLCB0YXJnZXQsIGN1cnJlbnQpO1xuICAgICAgfVxuICAgICAgY3VycmVudCA9IGN1cnJlbnQucGFyZW50O1xuICAgIH1cbiAgfVxufVxuZnVuY3Rpb24gaW5qZWN0VG9LZWVwQWxpdmVSb290KGhvb2ssIHR5cGUsIHRhcmdldCwga2VlcEFsaXZlUm9vdCkge1xuICBjb25zdCBpbmplY3RlZCA9IGluamVjdEhvb2soXG4gICAgdHlwZSxcbiAgICBob29rLFxuICAgIGtlZXBBbGl2ZVJvb3QsXG4gICAgdHJ1ZVxuICAgIC8qIHByZXBlbmQgKi9cbiAgKTtcbiAgb25Vbm1vdW50ZWQoKCkgPT4ge1xuICAgIHJlbW92ZShrZWVwQWxpdmVSb290W3R5cGVdLCBpbmplY3RlZCk7XG4gIH0sIHRhcmdldCk7XG59XG5mdW5jdGlvbiByZXNldFNoYXBlRmxhZyh2bm9kZSkge1xuICB2bm9kZS5zaGFwZUZsYWcgJj0gLTI1NztcbiAgdm5vZGUuc2hhcGVGbGFnICY9IC01MTM7XG59XG5mdW5jdGlvbiBnZXRJbm5lckNoaWxkKHZub2RlKSB7XG4gIHJldHVybiB2bm9kZS5zaGFwZUZsYWcgJiAxMjggPyB2bm9kZS5zc0NvbnRlbnQgOiB2bm9kZTtcbn1cblxuZnVuY3Rpb24gaW5qZWN0SG9vayh0eXBlLCBob29rLCB0YXJnZXQgPSBjdXJyZW50SW5zdGFuY2UsIHByZXBlbmQgPSBmYWxzZSkge1xuICBpZiAodGFyZ2V0KSB7XG4gICAgY29uc3QgaG9va3MgPSB0YXJnZXRbdHlwZV0gfHwgKHRhcmdldFt0eXBlXSA9IFtdKTtcbiAgICBjb25zdCB3cmFwcGVkSG9vayA9IGhvb2suX193ZWggfHwgKGhvb2suX193ZWggPSAoLi4uYXJncykgPT4ge1xuICAgICAgcGF1c2VUcmFja2luZygpO1xuICAgICAgY29uc3QgcmVzZXQgPSBzZXRDdXJyZW50SW5zdGFuY2UodGFyZ2V0KTtcbiAgICAgIGNvbnN0IHJlcyA9IGNhbGxXaXRoQXN5bmNFcnJvckhhbmRsaW5nKGhvb2ssIHRhcmdldCwgdHlwZSwgYXJncyk7XG4gICAgICByZXNldCgpO1xuICAgICAgcmVzZXRUcmFja2luZygpO1xuICAgICAgcmV0dXJuIHJlcztcbiAgICB9KTtcbiAgICBpZiAocHJlcGVuZCkge1xuICAgICAgaG9va3MudW5zaGlmdCh3cmFwcGVkSG9vayk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGhvb2tzLnB1c2god3JhcHBlZEhvb2spO1xuICAgIH1cbiAgICByZXR1cm4gd3JhcHBlZEhvb2s7XG4gIH0gZWxzZSBpZiAoISEocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09IFwicHJvZHVjdGlvblwiKSkge1xuICAgIGNvbnN0IGFwaU5hbWUgPSB0b0hhbmRsZXJLZXkoRXJyb3JUeXBlU3RyaW5ncyQxW3R5cGVdLnJlcGxhY2UoLyBob29rJC8sIFwiXCIpKTtcbiAgICB3YXJuJDEoXG4gICAgICBgJHthcGlOYW1lfSBpcyBjYWxsZWQgd2hlbiB0aGVyZSBpcyBubyBhY3RpdmUgY29tcG9uZW50IGluc3RhbmNlIHRvIGJlIGFzc29jaWF0ZWQgd2l0aC4gTGlmZWN5Y2xlIGluamVjdGlvbiBBUElzIGNhbiBvbmx5IGJlIHVzZWQgZHVyaW5nIGV4ZWN1dGlvbiBvZiBzZXR1cCgpLmAgKyAoYCBJZiB5b3UgYXJlIHVzaW5nIGFzeW5jIHNldHVwKCksIG1ha2Ugc3VyZSB0byByZWdpc3RlciBsaWZlY3ljbGUgaG9va3MgYmVmb3JlIHRoZSBmaXJzdCBhd2FpdCBzdGF0ZW1lbnQuYCApXG4gICAgKTtcbiAgfVxufVxuY29uc3QgY3JlYXRlSG9vayA9IChsaWZlY3ljbGUpID0+IChob29rLCB0YXJnZXQgPSBjdXJyZW50SW5zdGFuY2UpID0+IHtcbiAgaWYgKCFpc0luU1NSQ29tcG9uZW50U2V0dXAgfHwgbGlmZWN5Y2xlID09PSBcInNwXCIpIHtcbiAgICBpbmplY3RIb29rKGxpZmVjeWNsZSwgKC4uLmFyZ3MpID0+IGhvb2soLi4uYXJncyksIHRhcmdldCk7XG4gIH1cbn07XG5jb25zdCBvbkJlZm9yZU1vdW50ID0gY3JlYXRlSG9vayhcImJtXCIpO1xuY29uc3Qgb25Nb3VudGVkID0gY3JlYXRlSG9vayhcIm1cIik7XG5jb25zdCBvbkJlZm9yZVVwZGF0ZSA9IGNyZWF0ZUhvb2soXG4gIFwiYnVcIlxuKTtcbmNvbnN0IG9uVXBkYXRlZCA9IGNyZWF0ZUhvb2soXCJ1XCIpO1xuY29uc3Qgb25CZWZvcmVVbm1vdW50ID0gY3JlYXRlSG9vayhcbiAgXCJidW1cIlxuKTtcbmNvbnN0IG9uVW5tb3VudGVkID0gY3JlYXRlSG9vayhcInVtXCIpO1xuY29uc3Qgb25TZXJ2ZXJQcmVmZXRjaCA9IGNyZWF0ZUhvb2soXG4gIFwic3BcIlxuKTtcbmNvbnN0IG9uUmVuZGVyVHJpZ2dlcmVkID0gY3JlYXRlSG9vayhcInJ0Z1wiKTtcbmNvbnN0IG9uUmVuZGVyVHJhY2tlZCA9IGNyZWF0ZUhvb2soXCJydGNcIik7XG5mdW5jdGlvbiBvbkVycm9yQ2FwdHVyZWQoaG9vaywgdGFyZ2V0ID0gY3VycmVudEluc3RhbmNlKSB7XG4gIGluamVjdEhvb2soXCJlY1wiLCBob29rLCB0YXJnZXQpO1xufVxuXG5jb25zdCBDT01QT05FTlRTID0gXCJjb21wb25lbnRzXCI7XG5jb25zdCBESVJFQ1RJVkVTID0gXCJkaXJlY3RpdmVzXCI7XG5mdW5jdGlvbiByZXNvbHZlQ29tcG9uZW50KG5hbWUsIG1heWJlU2VsZlJlZmVyZW5jZSkge1xuICByZXR1cm4gcmVzb2x2ZUFzc2V0KENPTVBPTkVOVFMsIG5hbWUsIHRydWUsIG1heWJlU2VsZlJlZmVyZW5jZSkgfHwgbmFtZTtcbn1cbmNvbnN0IE5VTExfRFlOQU1JQ19DT01QT05FTlQgPSAvKiBAX19QVVJFX18gKi8gU3ltYm9sLmZvcihcInYtbmRjXCIpO1xuZnVuY3Rpb24gcmVzb2x2ZUR5bmFtaWNDb21wb25lbnQoY29tcG9uZW50KSB7XG4gIGlmIChpc1N0cmluZyhjb21wb25lbnQpKSB7XG4gICAgcmV0dXJuIHJlc29sdmVBc3NldChDT01QT05FTlRTLCBjb21wb25lbnQsIGZhbHNlKSB8fCBjb21wb25lbnQ7XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIGNvbXBvbmVudCB8fCBOVUxMX0RZTkFNSUNfQ09NUE9ORU5UO1xuICB9XG59XG5mdW5jdGlvbiByZXNvbHZlRGlyZWN0aXZlKG5hbWUpIHtcbiAgcmV0dXJuIHJlc29sdmVBc3NldChESVJFQ1RJVkVTLCBuYW1lKTtcbn1cbmZ1bmN0aW9uIHJlc29sdmVBc3NldCh0eXBlLCBuYW1lLCB3YXJuTWlzc2luZyA9IHRydWUsIG1heWJlU2VsZlJlZmVyZW5jZSA9IGZhbHNlKSB7XG4gIGNvbnN0IGluc3RhbmNlID0gY3VycmVudFJlbmRlcmluZ0luc3RhbmNlIHx8IGN1cnJlbnRJbnN0YW5jZTtcbiAgaWYgKGluc3RhbmNlKSB7XG4gICAgY29uc3QgQ29tcG9uZW50ID0gaW5zdGFuY2UudHlwZTtcbiAgICBpZiAodHlwZSA9PT0gQ09NUE9ORU5UUykge1xuICAgICAgY29uc3Qgc2VsZk5hbWUgPSBnZXRDb21wb25lbnROYW1lKFxuICAgICAgICBDb21wb25lbnQsXG4gICAgICAgIGZhbHNlXG4gICAgICApO1xuICAgICAgaWYgKHNlbGZOYW1lICYmIChzZWxmTmFtZSA9PT0gbmFtZSB8fCBzZWxmTmFtZSA9PT0gY2FtZWxpemUobmFtZSkgfHwgc2VsZk5hbWUgPT09IGNhcGl0YWxpemUoY2FtZWxpemUobmFtZSkpKSkge1xuICAgICAgICByZXR1cm4gQ29tcG9uZW50O1xuICAgICAgfVxuICAgIH1cbiAgICBjb25zdCByZXMgPSAoXG4gICAgICAvLyBsb2NhbCByZWdpc3RyYXRpb25cbiAgICAgIC8vIGNoZWNrIGluc3RhbmNlW3R5cGVdIGZpcnN0IHdoaWNoIGlzIHJlc29sdmVkIGZvciBvcHRpb25zIEFQSVxuICAgICAgcmVzb2x2ZShpbnN0YW5jZVt0eXBlXSB8fCBDb21wb25lbnRbdHlwZV0sIG5hbWUpIHx8IC8vIGdsb2JhbCByZWdpc3RyYXRpb25cbiAgICAgIHJlc29sdmUoaW5zdGFuY2UuYXBwQ29udGV4dFt0eXBlXSwgbmFtZSlcbiAgICApO1xuICAgIGlmICghcmVzICYmIG1heWJlU2VsZlJlZmVyZW5jZSkge1xuICAgICAgcmV0dXJuIENvbXBvbmVudDtcbiAgICB9XG4gICAgaWYgKCEhKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSBcInByb2R1Y3Rpb25cIikgJiYgd2Fybk1pc3NpbmcgJiYgIXJlcykge1xuICAgICAgY29uc3QgZXh0cmEgPSB0eXBlID09PSBDT01QT05FTlRTID8gYFxuSWYgdGhpcyBpcyBhIG5hdGl2ZSBjdXN0b20gZWxlbWVudCwgbWFrZSBzdXJlIHRvIGV4Y2x1ZGUgaXQgZnJvbSBjb21wb25lbnQgcmVzb2x1dGlvbiB2aWEgY29tcGlsZXJPcHRpb25zLmlzQ3VzdG9tRWxlbWVudC5gIDogYGA7XG4gICAgICB3YXJuJDEoYEZhaWxlZCB0byByZXNvbHZlICR7dHlwZS5zbGljZSgwLCAtMSl9OiAke25hbWV9JHtleHRyYX1gKTtcbiAgICB9XG4gICAgcmV0dXJuIHJlcztcbiAgfSBlbHNlIGlmICghIShwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gXCJwcm9kdWN0aW9uXCIpKSB7XG4gICAgd2FybiQxKFxuICAgICAgYHJlc29sdmUke2NhcGl0YWxpemUodHlwZS5zbGljZSgwLCAtMSkpfSBjYW4gb25seSBiZSB1c2VkIGluIHJlbmRlcigpIG9yIHNldHVwKCkuYFxuICAgICk7XG4gIH1cbn1cbmZ1bmN0aW9uIHJlc29sdmUocmVnaXN0cnksIG5hbWUpIHtcbiAgcmV0dXJuIHJlZ2lzdHJ5ICYmIChyZWdpc3RyeVtuYW1lXSB8fCByZWdpc3RyeVtjYW1lbGl6ZShuYW1lKV0gfHwgcmVnaXN0cnlbY2FwaXRhbGl6ZShjYW1lbGl6ZShuYW1lKSldKTtcbn1cblxuZnVuY3Rpb24gcmVuZGVyTGlzdChzb3VyY2UsIHJlbmRlckl0ZW0sIGNhY2hlLCBpbmRleCkge1xuICBsZXQgcmV0O1xuICBjb25zdCBjYWNoZWQgPSBjYWNoZSAmJiBjYWNoZVtpbmRleF07XG4gIGNvbnN0IHNvdXJjZUlzQXJyYXkgPSBpc0FycmF5KHNvdXJjZSk7XG4gIGlmIChzb3VyY2VJc0FycmF5IHx8IGlzU3RyaW5nKHNvdXJjZSkpIHtcbiAgICBjb25zdCBzb3VyY2VJc1JlYWN0aXZlQXJyYXkgPSBzb3VyY2VJc0FycmF5ICYmIGlzUmVhY3RpdmUoc291cmNlKTtcbiAgICBsZXQgbmVlZHNXcmFwID0gZmFsc2U7XG4gICAgbGV0IGlzUmVhZG9ubHlTb3VyY2UgPSBmYWxzZTtcbiAgICBpZiAoc291cmNlSXNSZWFjdGl2ZUFycmF5KSB7XG4gICAgICBuZWVkc1dyYXAgPSAhaXNTaGFsbG93KHNvdXJjZSk7XG4gICAgICBpc1JlYWRvbmx5U291cmNlID0gaXNSZWFkb25seShzb3VyY2UpO1xuICAgICAgc291cmNlID0gc2hhbGxvd1JlYWRBcnJheShzb3VyY2UpO1xuICAgIH1cbiAgICByZXQgPSBuZXcgQXJyYXkoc291cmNlLmxlbmd0aCk7XG4gICAgZm9yIChsZXQgaSA9IDAsIGwgPSBzb3VyY2UubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgICByZXRbaV0gPSByZW5kZXJJdGVtKFxuICAgICAgICBuZWVkc1dyYXAgPyBpc1JlYWRvbmx5U291cmNlID8gdG9SZWFkb25seSh0b1JlYWN0aXZlKHNvdXJjZVtpXSkpIDogdG9SZWFjdGl2ZShzb3VyY2VbaV0pIDogc291cmNlW2ldLFxuICAgICAgICBpLFxuICAgICAgICB2b2lkIDAsXG4gICAgICAgIGNhY2hlZCAmJiBjYWNoZWRbaV1cbiAgICAgICk7XG4gICAgfVxuICB9IGVsc2UgaWYgKHR5cGVvZiBzb3VyY2UgPT09IFwibnVtYmVyXCIpIHtcbiAgICBpZiAoISEocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09IFwicHJvZHVjdGlvblwiKSAmJiAhTnVtYmVyLmlzSW50ZWdlcihzb3VyY2UpKSB7XG4gICAgICB3YXJuJDEoYFRoZSB2LWZvciByYW5nZSBleHBlY3QgYW4gaW50ZWdlciB2YWx1ZSBidXQgZ290ICR7c291cmNlfS5gKTtcbiAgICB9XG4gICAgcmV0ID0gbmV3IEFycmF5KHNvdXJjZSk7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBzb3VyY2U7IGkrKykge1xuICAgICAgcmV0W2ldID0gcmVuZGVySXRlbShpICsgMSwgaSwgdm9pZCAwLCBjYWNoZWQgJiYgY2FjaGVkW2ldKTtcbiAgICB9XG4gIH0gZWxzZSBpZiAoaXNPYmplY3Qoc291cmNlKSkge1xuICAgIGlmIChzb3VyY2VbU3ltYm9sLml0ZXJhdG9yXSkge1xuICAgICAgcmV0ID0gQXJyYXkuZnJvbShcbiAgICAgICAgc291cmNlLFxuICAgICAgICAoaXRlbSwgaSkgPT4gcmVuZGVySXRlbShpdGVtLCBpLCB2b2lkIDAsIGNhY2hlZCAmJiBjYWNoZWRbaV0pXG4gICAgICApO1xuICAgIH0gZWxzZSB7XG4gICAgICBjb25zdCBrZXlzID0gT2JqZWN0LmtleXMoc291cmNlKTtcbiAgICAgIHJldCA9IG5ldyBBcnJheShrZXlzLmxlbmd0aCk7XG4gICAgICBmb3IgKGxldCBpID0gMCwgbCA9IGtleXMubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgICAgIGNvbnN0IGtleSA9IGtleXNbaV07XG4gICAgICAgIHJldFtpXSA9IHJlbmRlckl0ZW0oc291cmNlW2tleV0sIGtleSwgaSwgY2FjaGVkICYmIGNhY2hlZFtpXSk7XG4gICAgICB9XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIHJldCA9IFtdO1xuICB9XG4gIGlmIChjYWNoZSkge1xuICAgIGNhY2hlW2luZGV4XSA9IHJldDtcbiAgfVxuICByZXR1cm4gcmV0O1xufVxuXG5mdW5jdGlvbiBjcmVhdGVTbG90cyhzbG90cywgZHluYW1pY1Nsb3RzKSB7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgZHluYW1pY1Nsb3RzLmxlbmd0aDsgaSsrKSB7XG4gICAgY29uc3Qgc2xvdCA9IGR5bmFtaWNTbG90c1tpXTtcbiAgICBpZiAoaXNBcnJheShzbG90KSkge1xuICAgICAgZm9yIChsZXQgaiA9IDA7IGogPCBzbG90Lmxlbmd0aDsgaisrKSB7XG4gICAgICAgIHNsb3RzW3Nsb3Rbal0ubmFtZV0gPSBzbG90W2pdLmZuO1xuICAgICAgfVxuICAgIH0gZWxzZSBpZiAoc2xvdCkge1xuICAgICAgc2xvdHNbc2xvdC5uYW1lXSA9IHNsb3Qua2V5ID8gKC4uLmFyZ3MpID0+IHtcbiAgICAgICAgY29uc3QgcmVzID0gc2xvdC5mbiguLi5hcmdzKTtcbiAgICAgICAgaWYgKHJlcykgcmVzLmtleSA9IHNsb3Qua2V5O1xuICAgICAgICByZXR1cm4gcmVzO1xuICAgICAgfSA6IHNsb3QuZm47XG4gICAgfVxuICB9XG4gIHJldHVybiBzbG90cztcbn1cblxuZnVuY3Rpb24gcmVuZGVyU2xvdChzbG90cywgbmFtZSwgcHJvcHMgPSB7fSwgZmFsbGJhY2ssIG5vU2xvdHRlZCkge1xuICBpZiAoY3VycmVudFJlbmRlcmluZ0luc3RhbmNlLmNlIHx8IGN1cnJlbnRSZW5kZXJpbmdJbnN0YW5jZS5wYXJlbnQgJiYgaXNBc3luY1dyYXBwZXIoY3VycmVudFJlbmRlcmluZ0luc3RhbmNlLnBhcmVudCkgJiYgY3VycmVudFJlbmRlcmluZ0luc3RhbmNlLnBhcmVudC5jZSkge1xuICAgIGNvbnN0IGhhc1Byb3BzID0gT2JqZWN0LmtleXMocHJvcHMpLmxlbmd0aCA+IDA7XG4gICAgaWYgKG5hbWUgIT09IFwiZGVmYXVsdFwiKSBwcm9wcy5uYW1lID0gbmFtZTtcbiAgICByZXR1cm4gb3BlbkJsb2NrKCksIGNyZWF0ZUJsb2NrKFxuICAgICAgRnJhZ21lbnQsXG4gICAgICBudWxsLFxuICAgICAgW2NyZWF0ZVZOb2RlKFwic2xvdFwiLCBwcm9wcywgZmFsbGJhY2sgJiYgZmFsbGJhY2soKSldLFxuICAgICAgaGFzUHJvcHMgPyAtMiA6IDY0XG4gICAgKTtcbiAgfVxuICBsZXQgc2xvdCA9IHNsb3RzW25hbWVdO1xuICBpZiAoISEocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09IFwicHJvZHVjdGlvblwiKSAmJiBzbG90ICYmIHNsb3QubGVuZ3RoID4gMSkge1xuICAgIHdhcm4kMShcbiAgICAgIGBTU1Itb3B0aW1pemVkIHNsb3QgZnVuY3Rpb24gZGV0ZWN0ZWQgaW4gYSBub24tU1NSLW9wdGltaXplZCByZW5kZXIgZnVuY3Rpb24uIFlvdSBuZWVkIHRvIG1hcmsgdGhpcyBjb21wb25lbnQgd2l0aCAkZHluYW1pYy1zbG90cyBpbiB0aGUgcGFyZW50IHRlbXBsYXRlLmBcbiAgICApO1xuICAgIHNsb3QgPSAoKSA9PiBbXTtcbiAgfVxuICBpZiAoc2xvdCAmJiBzbG90Ll9jKSB7XG4gICAgc2xvdC5fZCA9IGZhbHNlO1xuICB9XG4gIG9wZW5CbG9jaygpO1xuICBjb25zdCB2YWxpZFNsb3RDb250ZW50ID0gc2xvdCAmJiBlbnN1cmVWYWxpZFZOb2RlKHNsb3QocHJvcHMpKTtcbiAgY29uc3Qgc2xvdEtleSA9IHByb3BzLmtleSB8fCAvLyBzbG90IGNvbnRlbnQgYXJyYXkgb2YgYSBkeW5hbWljIGNvbmRpdGlvbmFsIHNsb3QgbWF5IGhhdmUgYSBicmFuY2hcbiAgLy8ga2V5IGF0dGFjaGVkIGluIHRoZSBgY3JlYXRlU2xvdHNgIGhlbHBlciwgcmVzcGVjdCB0aGF0XG4gIHZhbGlkU2xvdENvbnRlbnQgJiYgdmFsaWRTbG90Q29udGVudC5rZXk7XG4gIGNvbnN0IHJlbmRlcmVkID0gY3JlYXRlQmxvY2soXG4gICAgRnJhZ21lbnQsXG4gICAge1xuICAgICAga2V5OiAoc2xvdEtleSAmJiAhaXNTeW1ib2woc2xvdEtleSkgPyBzbG90S2V5IDogYF8ke25hbWV9YCkgKyAvLyAjNzI1NiBmb3JjZSBkaWZmZXJlbnRpYXRlIGZhbGxiYWNrIGNvbnRlbnQgZnJvbSBhY3R1YWwgY29udGVudFxuICAgICAgKCF2YWxpZFNsb3RDb250ZW50ICYmIGZhbGxiYWNrID8gXCJfZmJcIiA6IFwiXCIpXG4gICAgfSxcbiAgICB2YWxpZFNsb3RDb250ZW50IHx8IChmYWxsYmFjayA/IGZhbGxiYWNrKCkgOiBbXSksXG4gICAgdmFsaWRTbG90Q29udGVudCAmJiBzbG90cy5fID09PSAxID8gNjQgOiAtMlxuICApO1xuICBpZiAoIW5vU2xvdHRlZCAmJiByZW5kZXJlZC5zY29wZUlkKSB7XG4gICAgcmVuZGVyZWQuc2xvdFNjb3BlSWRzID0gW3JlbmRlcmVkLnNjb3BlSWQgKyBcIi1zXCJdO1xuICB9XG4gIGlmIChzbG90ICYmIHNsb3QuX2MpIHtcbiAgICBzbG90Ll9kID0gdHJ1ZTtcbiAgfVxuICByZXR1cm4gcmVuZGVyZWQ7XG59XG5mdW5jdGlvbiBlbnN1cmVWYWxpZFZOb2RlKHZub2Rlcykge1xuICByZXR1cm4gdm5vZGVzLnNvbWUoKGNoaWxkKSA9PiB7XG4gICAgaWYgKCFpc1ZOb2RlKGNoaWxkKSkgcmV0dXJuIHRydWU7XG4gICAgaWYgKGNoaWxkLnR5cGUgPT09IENvbW1lbnQpIHJldHVybiBmYWxzZTtcbiAgICBpZiAoY2hpbGQudHlwZSA9PT0gRnJhZ21lbnQgJiYgIWVuc3VyZVZhbGlkVk5vZGUoY2hpbGQuY2hpbGRyZW4pKVxuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIHJldHVybiB0cnVlO1xuICB9KSA/IHZub2RlcyA6IG51bGw7XG59XG5cbmZ1bmN0aW9uIHRvSGFuZGxlcnMob2JqLCBwcmVzZXJ2ZUNhc2VJZk5lY2Vzc2FyeSkge1xuICBjb25zdCByZXQgPSB7fTtcbiAgaWYgKCEhKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSBcInByb2R1Y3Rpb25cIikgJiYgIWlzT2JqZWN0KG9iaikpIHtcbiAgICB3YXJuJDEoYHYtb24gd2l0aCBubyBhcmd1bWVudCBleHBlY3RzIGFuIG9iamVjdCB2YWx1ZS5gKTtcbiAgICByZXR1cm4gcmV0O1xuICB9XG4gIGZvciAoY29uc3Qga2V5IGluIG9iaikge1xuICAgIHJldFtwcmVzZXJ2ZUNhc2VJZk5lY2Vzc2FyeSAmJiAvW0EtWl0vLnRlc3Qoa2V5KSA/IGBvbjoke2tleX1gIDogdG9IYW5kbGVyS2V5KGtleSldID0gb2JqW2tleV07XG4gIH1cbiAgcmV0dXJuIHJldDtcbn1cblxuY29uc3QgZ2V0UHVibGljSW5zdGFuY2UgPSAoaSkgPT4ge1xuICBpZiAoIWkpIHJldHVybiBudWxsO1xuICBpZiAoaXNTdGF0ZWZ1bENvbXBvbmVudChpKSkgcmV0dXJuIGdldENvbXBvbmVudFB1YmxpY0luc3RhbmNlKGkpO1xuICByZXR1cm4gZ2V0UHVibGljSW5zdGFuY2UoaS5wYXJlbnQpO1xufTtcbmNvbnN0IHB1YmxpY1Byb3BlcnRpZXNNYXAgPSAoXG4gIC8vIE1vdmUgUFVSRSBtYXJrZXIgdG8gbmV3IGxpbmUgdG8gd29ya2Fyb3VuZCBjb21waWxlciBkaXNjYXJkaW5nIGl0XG4gIC8vIGR1ZSB0byB0eXBlIGFubm90YXRpb25cbiAgLyogQF9fUFVSRV9fICovIGV4dGVuZCgvKiBAX19QVVJFX18gKi8gT2JqZWN0LmNyZWF0ZShudWxsKSwge1xuICAgICQ6IChpKSA9PiBpLFxuICAgICRlbDogKGkpID0+IGkudm5vZGUuZWwsXG4gICAgJGRhdGE6IChpKSA9PiBpLmRhdGEsXG4gICAgJHByb3BzOiAoaSkgPT4gISEocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09IFwicHJvZHVjdGlvblwiKSA/IHNoYWxsb3dSZWFkb25seShpLnByb3BzKSA6IGkucHJvcHMsXG4gICAgJGF0dHJzOiAoaSkgPT4gISEocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09IFwicHJvZHVjdGlvblwiKSA/IHNoYWxsb3dSZWFkb25seShpLmF0dHJzKSA6IGkuYXR0cnMsXG4gICAgJHNsb3RzOiAoaSkgPT4gISEocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09IFwicHJvZHVjdGlvblwiKSA/IHNoYWxsb3dSZWFkb25seShpLnNsb3RzKSA6IGkuc2xvdHMsXG4gICAgJHJlZnM6IChpKSA9PiAhIShwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gXCJwcm9kdWN0aW9uXCIpID8gc2hhbGxvd1JlYWRvbmx5KGkucmVmcykgOiBpLnJlZnMsXG4gICAgJHBhcmVudDogKGkpID0+IGdldFB1YmxpY0luc3RhbmNlKGkucGFyZW50KSxcbiAgICAkcm9vdDogKGkpID0+IGdldFB1YmxpY0luc3RhbmNlKGkucm9vdCksXG4gICAgJGhvc3Q6IChpKSA9PiBpLmNlLFxuICAgICRlbWl0OiAoaSkgPT4gaS5lbWl0LFxuICAgICRvcHRpb25zOiAoaSkgPT4gX19WVUVfT1BUSU9OU19BUElfXyA/IHJlc29sdmVNZXJnZWRPcHRpb25zKGkpIDogaS50eXBlLFxuICAgICRmb3JjZVVwZGF0ZTogKGkpID0+IGkuZiB8fCAoaS5mID0gKCkgPT4ge1xuICAgICAgcXVldWVKb2IoaS51cGRhdGUpO1xuICAgIH0pLFxuICAgICRuZXh0VGljazogKGkpID0+IGkubiB8fCAoaS5uID0gbmV4dFRpY2suYmluZChpLnByb3h5KSksXG4gICAgJHdhdGNoOiAoaSkgPT4gX19WVUVfT1BUSU9OU19BUElfXyA/IGluc3RhbmNlV2F0Y2guYmluZChpKSA6IE5PT1BcbiAgfSlcbik7XG5jb25zdCBpc1Jlc2VydmVkUHJlZml4ID0gKGtleSkgPT4ga2V5ID09PSBcIl9cIiB8fCBrZXkgPT09IFwiJFwiO1xuY29uc3QgaGFzU2V0dXBCaW5kaW5nID0gKHN0YXRlLCBrZXkpID0+IHN0YXRlICE9PSBFTVBUWV9PQkogJiYgIXN0YXRlLl9faXNTY3JpcHRTZXR1cCAmJiBoYXNPd24oc3RhdGUsIGtleSk7XG5jb25zdCBQdWJsaWNJbnN0YW5jZVByb3h5SGFuZGxlcnMgPSB7XG4gIGdldCh7IF86IGluc3RhbmNlIH0sIGtleSkge1xuICAgIGlmIChrZXkgPT09IFwiX192X3NraXBcIikge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICAgIGNvbnN0IHsgY3R4LCBzZXR1cFN0YXRlLCBkYXRhLCBwcm9wcywgYWNjZXNzQ2FjaGUsIHR5cGUsIGFwcENvbnRleHQgfSA9IGluc3RhbmNlO1xuICAgIGlmICghIShwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gXCJwcm9kdWN0aW9uXCIpICYmIGtleSA9PT0gXCJfX2lzVnVlXCIpIHtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICBpZiAoa2V5WzBdICE9PSBcIiRcIikge1xuICAgICAgY29uc3QgbiA9IGFjY2Vzc0NhY2hlW2tleV07XG4gICAgICBpZiAobiAhPT0gdm9pZCAwKSB7XG4gICAgICAgIHN3aXRjaCAobikge1xuICAgICAgICAgIGNhc2UgMSAvKiBTRVRVUCAqLzpcbiAgICAgICAgICAgIHJldHVybiBzZXR1cFN0YXRlW2tleV07XG4gICAgICAgICAgY2FzZSAyIC8qIERBVEEgKi86XG4gICAgICAgICAgICByZXR1cm4gZGF0YVtrZXldO1xuICAgICAgICAgIGNhc2UgNCAvKiBDT05URVhUICovOlxuICAgICAgICAgICAgcmV0dXJuIGN0eFtrZXldO1xuICAgICAgICAgIGNhc2UgMyAvKiBQUk9QUyAqLzpcbiAgICAgICAgICAgIHJldHVybiBwcm9wc1trZXldO1xuICAgICAgICB9XG4gICAgICB9IGVsc2UgaWYgKGhhc1NldHVwQmluZGluZyhzZXR1cFN0YXRlLCBrZXkpKSB7XG4gICAgICAgIGFjY2Vzc0NhY2hlW2tleV0gPSAxIC8qIFNFVFVQICovO1xuICAgICAgICByZXR1cm4gc2V0dXBTdGF0ZVtrZXldO1xuICAgICAgfSBlbHNlIGlmIChfX1ZVRV9PUFRJT05TX0FQSV9fICYmIGRhdGEgIT09IEVNUFRZX09CSiAmJiBoYXNPd24oZGF0YSwga2V5KSkge1xuICAgICAgICBhY2Nlc3NDYWNoZVtrZXldID0gMiAvKiBEQVRBICovO1xuICAgICAgICByZXR1cm4gZGF0YVtrZXldO1xuICAgICAgfSBlbHNlIGlmIChoYXNPd24ocHJvcHMsIGtleSkpIHtcbiAgICAgICAgYWNjZXNzQ2FjaGVba2V5XSA9IDMgLyogUFJPUFMgKi87XG4gICAgICAgIHJldHVybiBwcm9wc1trZXldO1xuICAgICAgfSBlbHNlIGlmIChjdHggIT09IEVNUFRZX09CSiAmJiBoYXNPd24oY3R4LCBrZXkpKSB7XG4gICAgICAgIGFjY2Vzc0NhY2hlW2tleV0gPSA0IC8qIENPTlRFWFQgKi87XG4gICAgICAgIHJldHVybiBjdHhba2V5XTtcbiAgICAgIH0gZWxzZSBpZiAoIV9fVlVFX09QVElPTlNfQVBJX18gfHwgc2hvdWxkQ2FjaGVBY2Nlc3MpIHtcbiAgICAgICAgYWNjZXNzQ2FjaGVba2V5XSA9IDAgLyogT1RIRVIgKi87XG4gICAgICB9XG4gICAgfVxuICAgIGNvbnN0IHB1YmxpY0dldHRlciA9IHB1YmxpY1Byb3BlcnRpZXNNYXBba2V5XTtcbiAgICBsZXQgY3NzTW9kdWxlLCBnbG9iYWxQcm9wZXJ0aWVzO1xuICAgIGlmIChwdWJsaWNHZXR0ZXIpIHtcbiAgICAgIGlmIChrZXkgPT09IFwiJGF0dHJzXCIpIHtcbiAgICAgICAgdHJhY2soaW5zdGFuY2UuYXR0cnMsIFwiZ2V0XCIsIFwiXCIpO1xuICAgICAgICAhIShwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gXCJwcm9kdWN0aW9uXCIpICYmIG1hcmtBdHRyc0FjY2Vzc2VkKCk7XG4gICAgICB9IGVsc2UgaWYgKCEhKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSBcInByb2R1Y3Rpb25cIikgJiYga2V5ID09PSBcIiRzbG90c1wiKSB7XG4gICAgICAgIHRyYWNrKGluc3RhbmNlLCBcImdldFwiLCBrZXkpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHB1YmxpY0dldHRlcihpbnN0YW5jZSk7XG4gICAgfSBlbHNlIGlmIChcbiAgICAgIC8vIGNzcyBtb2R1bGUgKGluamVjdGVkIGJ5IHZ1ZS1sb2FkZXIpXG4gICAgICAoY3NzTW9kdWxlID0gdHlwZS5fX2Nzc01vZHVsZXMpICYmIChjc3NNb2R1bGUgPSBjc3NNb2R1bGVba2V5XSlcbiAgICApIHtcbiAgICAgIHJldHVybiBjc3NNb2R1bGU7XG4gICAgfSBlbHNlIGlmIChjdHggIT09IEVNUFRZX09CSiAmJiBoYXNPd24oY3R4LCBrZXkpKSB7XG4gICAgICBhY2Nlc3NDYWNoZVtrZXldID0gNCAvKiBDT05URVhUICovO1xuICAgICAgcmV0dXJuIGN0eFtrZXldO1xuICAgIH0gZWxzZSBpZiAoXG4gICAgICAvLyBnbG9iYWwgcHJvcGVydGllc1xuICAgICAgZ2xvYmFsUHJvcGVydGllcyA9IGFwcENvbnRleHQuY29uZmlnLmdsb2JhbFByb3BlcnRpZXMsIGhhc093bihnbG9iYWxQcm9wZXJ0aWVzLCBrZXkpXG4gICAgKSB7XG4gICAgICB7XG4gICAgICAgIHJldHVybiBnbG9iYWxQcm9wZXJ0aWVzW2tleV07XG4gICAgICB9XG4gICAgfSBlbHNlIGlmICghIShwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gXCJwcm9kdWN0aW9uXCIpICYmIGN1cnJlbnRSZW5kZXJpbmdJbnN0YW5jZSAmJiAoIWlzU3RyaW5nKGtleSkgfHwgLy8gIzEwOTEgYXZvaWQgaW50ZXJuYWwgaXNSZWYvaXNWTm9kZSBjaGVja3Mgb24gY29tcG9uZW50IGluc3RhbmNlIGxlYWRpbmdcbiAgICAvLyB0byBpbmZpbml0ZSB3YXJuaW5nIGxvb3BcbiAgICBrZXkuaW5kZXhPZihcIl9fdlwiKSAhPT0gMCkpIHtcbiAgICAgIGlmIChkYXRhICE9PSBFTVBUWV9PQkogJiYgaXNSZXNlcnZlZFByZWZpeChrZXlbMF0pICYmIGhhc093bihkYXRhLCBrZXkpKSB7XG4gICAgICAgIHdhcm4kMShcbiAgICAgICAgICBgUHJvcGVydHkgJHtKU09OLnN0cmluZ2lmeShcbiAgICAgICAgICAgIGtleVxuICAgICAgICAgICl9IG11c3QgYmUgYWNjZXNzZWQgdmlhICRkYXRhIGJlY2F1c2UgaXQgc3RhcnRzIHdpdGggYSByZXNlcnZlZCBjaGFyYWN0ZXIgKFwiJFwiIG9yIFwiX1wiKSBhbmQgaXMgbm90IHByb3hpZWQgb24gdGhlIHJlbmRlciBjb250ZXh0LmBcbiAgICAgICAgKTtcbiAgICAgIH0gZWxzZSBpZiAoaW5zdGFuY2UgPT09IGN1cnJlbnRSZW5kZXJpbmdJbnN0YW5jZSkge1xuICAgICAgICB3YXJuJDEoXG4gICAgICAgICAgYFByb3BlcnR5ICR7SlNPTi5zdHJpbmdpZnkoa2V5KX0gd2FzIGFjY2Vzc2VkIGR1cmluZyByZW5kZXIgYnV0IGlzIG5vdCBkZWZpbmVkIG9uIGluc3RhbmNlLmBcbiAgICAgICAgKTtcbiAgICAgIH1cbiAgICB9XG4gIH0sXG4gIHNldCh7IF86IGluc3RhbmNlIH0sIGtleSwgdmFsdWUpIHtcbiAgICBjb25zdCB7IGRhdGEsIHNldHVwU3RhdGUsIGN0eCB9ID0gaW5zdGFuY2U7XG4gICAgaWYgKGhhc1NldHVwQmluZGluZyhzZXR1cFN0YXRlLCBrZXkpKSB7XG4gICAgICBzZXR1cFN0YXRlW2tleV0gPSB2YWx1ZTtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH0gZWxzZSBpZiAoISEocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09IFwicHJvZHVjdGlvblwiKSAmJiBzZXR1cFN0YXRlLl9faXNTY3JpcHRTZXR1cCAmJiBoYXNPd24oc2V0dXBTdGF0ZSwga2V5KSkge1xuICAgICAgd2FybiQxKGBDYW5ub3QgbXV0YXRlIDxzY3JpcHQgc2V0dXA+IGJpbmRpbmcgXCIke2tleX1cIiBmcm9tIE9wdGlvbnMgQVBJLmApO1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH0gZWxzZSBpZiAoX19WVUVfT1BUSU9OU19BUElfXyAmJiBkYXRhICE9PSBFTVBUWV9PQkogJiYgaGFzT3duKGRhdGEsIGtleSkpIHtcbiAgICAgIGRhdGFba2V5XSA9IHZhbHVlO1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfSBlbHNlIGlmIChoYXNPd24oaW5zdGFuY2UucHJvcHMsIGtleSkpIHtcbiAgICAgICEhKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSBcInByb2R1Y3Rpb25cIikgJiYgd2FybiQxKGBBdHRlbXB0aW5nIHRvIG11dGF0ZSBwcm9wIFwiJHtrZXl9XCIuIFByb3BzIGFyZSByZWFkb25seS5gKTtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgaWYgKGtleVswXSA9PT0gXCIkXCIgJiYga2V5LnNsaWNlKDEpIGluIGluc3RhbmNlKSB7XG4gICAgICAhIShwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gXCJwcm9kdWN0aW9uXCIpICYmIHdhcm4kMShcbiAgICAgICAgYEF0dGVtcHRpbmcgdG8gbXV0YXRlIHB1YmxpYyBwcm9wZXJ0eSBcIiR7a2V5fVwiLiBQcm9wZXJ0aWVzIHN0YXJ0aW5nIHdpdGggJCBhcmUgcmVzZXJ2ZWQgYW5kIHJlYWRvbmx5LmBcbiAgICAgICk7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfSBlbHNlIHtcbiAgICAgIGlmICghIShwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gXCJwcm9kdWN0aW9uXCIpICYmIGtleSBpbiBpbnN0YW5jZS5hcHBDb250ZXh0LmNvbmZpZy5nbG9iYWxQcm9wZXJ0aWVzKSB7XG4gICAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShjdHgsIGtleSwge1xuICAgICAgICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlLFxuICAgICAgICAgIHZhbHVlXG4gICAgICAgIH0pO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY3R4W2tleV0gPSB2YWx1ZTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHRydWU7XG4gIH0sXG4gIGhhcyh7XG4gICAgXzogeyBkYXRhLCBzZXR1cFN0YXRlLCBhY2Nlc3NDYWNoZSwgY3R4LCBhcHBDb250ZXh0LCBwcm9wcywgdHlwZSB9XG4gIH0sIGtleSkge1xuICAgIGxldCBjc3NNb2R1bGVzO1xuICAgIHJldHVybiAhIShhY2Nlc3NDYWNoZVtrZXldIHx8IF9fVlVFX09QVElPTlNfQVBJX18gJiYgZGF0YSAhPT0gRU1QVFlfT0JKICYmIGtleVswXSAhPT0gXCIkXCIgJiYgaGFzT3duKGRhdGEsIGtleSkgfHwgaGFzU2V0dXBCaW5kaW5nKHNldHVwU3RhdGUsIGtleSkgfHwgaGFzT3duKHByb3BzLCBrZXkpIHx8IGhhc093bihjdHgsIGtleSkgfHwgaGFzT3duKHB1YmxpY1Byb3BlcnRpZXNNYXAsIGtleSkgfHwgaGFzT3duKGFwcENvbnRleHQuY29uZmlnLmdsb2JhbFByb3BlcnRpZXMsIGtleSkgfHwgKGNzc01vZHVsZXMgPSB0eXBlLl9fY3NzTW9kdWxlcykgJiYgY3NzTW9kdWxlc1trZXldKTtcbiAgfSxcbiAgZGVmaW5lUHJvcGVydHkodGFyZ2V0LCBrZXksIGRlc2NyaXB0b3IpIHtcbiAgICBpZiAoZGVzY3JpcHRvci5nZXQgIT0gbnVsbCkge1xuICAgICAgdGFyZ2V0Ll8uYWNjZXNzQ2FjaGVba2V5XSA9IDA7XG4gICAgfSBlbHNlIGlmIChoYXNPd24oZGVzY3JpcHRvciwgXCJ2YWx1ZVwiKSkge1xuICAgICAgdGhpcy5zZXQodGFyZ2V0LCBrZXksIGRlc2NyaXB0b3IudmFsdWUsIG51bGwpO1xuICAgIH1cbiAgICByZXR1cm4gUmVmbGVjdC5kZWZpbmVQcm9wZXJ0eSh0YXJnZXQsIGtleSwgZGVzY3JpcHRvcik7XG4gIH1cbn07XG5pZiAoISEocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09IFwicHJvZHVjdGlvblwiKSAmJiB0cnVlKSB7XG4gIFB1YmxpY0luc3RhbmNlUHJveHlIYW5kbGVycy5vd25LZXlzID0gKHRhcmdldCkgPT4ge1xuICAgIHdhcm4kMShcbiAgICAgIGBBdm9pZCBhcHAgbG9naWMgdGhhdCByZWxpZXMgb24gZW51bWVyYXRpbmcga2V5cyBvbiBhIGNvbXBvbmVudCBpbnN0YW5jZS4gVGhlIGtleXMgd2lsbCBiZSBlbXB0eSBpbiBwcm9kdWN0aW9uIG1vZGUgdG8gYXZvaWQgcGVyZm9ybWFuY2Ugb3ZlcmhlYWQuYFxuICAgICk7XG4gICAgcmV0dXJuIFJlZmxlY3Qub3duS2V5cyh0YXJnZXQpO1xuICB9O1xufVxuY29uc3QgUnVudGltZUNvbXBpbGVkUHVibGljSW5zdGFuY2VQcm94eUhhbmRsZXJzID0gLyogQF9fUFVSRV9fICovIGV4dGVuZCh7fSwgUHVibGljSW5zdGFuY2VQcm94eUhhbmRsZXJzLCB7XG4gIGdldCh0YXJnZXQsIGtleSkge1xuICAgIGlmIChrZXkgPT09IFN5bWJvbC51bnNjb3BhYmxlcykge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICByZXR1cm4gUHVibGljSW5zdGFuY2VQcm94eUhhbmRsZXJzLmdldCh0YXJnZXQsIGtleSwgdGFyZ2V0KTtcbiAgfSxcbiAgaGFzKF8sIGtleSkge1xuICAgIGNvbnN0IGhhcyA9IGtleVswXSAhPT0gXCJfXCIgJiYgIWlzR2xvYmFsbHlBbGxvd2VkKGtleSk7XG4gICAgaWYgKCEhKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSBcInByb2R1Y3Rpb25cIikgJiYgIWhhcyAmJiBQdWJsaWNJbnN0YW5jZVByb3h5SGFuZGxlcnMuaGFzKF8sIGtleSkpIHtcbiAgICAgIHdhcm4kMShcbiAgICAgICAgYFByb3BlcnR5ICR7SlNPTi5zdHJpbmdpZnkoXG4gICAgICAgICAga2V5XG4gICAgICAgICl9IHNob3VsZCBub3Qgc3RhcnQgd2l0aCBfIHdoaWNoIGlzIGEgcmVzZXJ2ZWQgcHJlZml4IGZvciBWdWUgaW50ZXJuYWxzLmBcbiAgICAgICk7XG4gICAgfVxuICAgIHJldHVybiBoYXM7XG4gIH1cbn0pO1xuZnVuY3Rpb24gY3JlYXRlRGV2UmVuZGVyQ29udGV4dChpbnN0YW5jZSkge1xuICBjb25zdCB0YXJnZXQgPSB7fTtcbiAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRhcmdldCwgYF9gLCB7XG4gICAgY29uZmlndXJhYmxlOiB0cnVlLFxuICAgIGVudW1lcmFibGU6IGZhbHNlLFxuICAgIGdldDogKCkgPT4gaW5zdGFuY2VcbiAgfSk7XG4gIE9iamVjdC5rZXlzKHB1YmxpY1Byb3BlcnRpZXNNYXApLmZvckVhY2goKGtleSkgPT4ge1xuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0YXJnZXQsIGtleSwge1xuICAgICAgY29uZmlndXJhYmxlOiB0cnVlLFxuICAgICAgZW51bWVyYWJsZTogZmFsc2UsXG4gICAgICBnZXQ6ICgpID0+IHB1YmxpY1Byb3BlcnRpZXNNYXBba2V5XShpbnN0YW5jZSksXG4gICAgICAvLyBpbnRlcmNlcHRlZCBieSB0aGUgcHJveHkgc28gbm8gbmVlZCBmb3IgaW1wbGVtZW50YXRpb24sXG4gICAgICAvLyBidXQgbmVlZGVkIHRvIHByZXZlbnQgc2V0IGVycm9yc1xuICAgICAgc2V0OiBOT09QXG4gICAgfSk7XG4gIH0pO1xuICByZXR1cm4gdGFyZ2V0O1xufVxuZnVuY3Rpb24gZXhwb3NlUHJvcHNPblJlbmRlckNvbnRleHQoaW5zdGFuY2UpIHtcbiAgY29uc3Qge1xuICAgIGN0eCxcbiAgICBwcm9wc09wdGlvbnM6IFtwcm9wc09wdGlvbnNdXG4gIH0gPSBpbnN0YW5jZTtcbiAgaWYgKHByb3BzT3B0aW9ucykge1xuICAgIE9iamVjdC5rZXlzKHByb3BzT3B0aW9ucykuZm9yRWFjaCgoa2V5KSA9PiB7XG4gICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoY3R4LCBrZXksIHtcbiAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlLFxuICAgICAgICBnZXQ6ICgpID0+IGluc3RhbmNlLnByb3BzW2tleV0sXG4gICAgICAgIHNldDogTk9PUFxuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cbn1cbmZ1bmN0aW9uIGV4cG9zZVNldHVwU3RhdGVPblJlbmRlckNvbnRleHQoaW5zdGFuY2UpIHtcbiAgY29uc3QgeyBjdHgsIHNldHVwU3RhdGUgfSA9IGluc3RhbmNlO1xuICBPYmplY3Qua2V5cyh0b1JhdyhzZXR1cFN0YXRlKSkuZm9yRWFjaCgoa2V5KSA9PiB7XG4gICAgaWYgKCFzZXR1cFN0YXRlLl9faXNTY3JpcHRTZXR1cCkge1xuICAgICAgaWYgKGlzUmVzZXJ2ZWRQcmVmaXgoa2V5WzBdKSkge1xuICAgICAgICB3YXJuJDEoXG4gICAgICAgICAgYHNldHVwKCkgcmV0dXJuIHByb3BlcnR5ICR7SlNPTi5zdHJpbmdpZnkoXG4gICAgICAgICAgICBrZXlcbiAgICAgICAgICApfSBzaG91bGQgbm90IHN0YXJ0IHdpdGggXCIkXCIgb3IgXCJfXCIgd2hpY2ggYXJlIHJlc2VydmVkIHByZWZpeGVzIGZvciBWdWUgaW50ZXJuYWxzLmBcbiAgICAgICAgKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KGN0eCwga2V5LCB7XG4gICAgICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZSxcbiAgICAgICAgZ2V0OiAoKSA9PiBzZXR1cFN0YXRlW2tleV0sXG4gICAgICAgIHNldDogTk9PUFxuICAgICAgfSk7XG4gICAgfVxuICB9KTtcbn1cblxuY29uc3Qgd2FyblJ1bnRpbWVVc2FnZSA9IChtZXRob2QpID0+IHdhcm4kMShcbiAgYCR7bWV0aG9kfSgpIGlzIGEgY29tcGlsZXItaGludCBoZWxwZXIgdGhhdCBpcyBvbmx5IHVzYWJsZSBpbnNpZGUgPHNjcmlwdCBzZXR1cD4gb2YgYSBzaW5nbGUgZmlsZSBjb21wb25lbnQuIEl0cyBhcmd1bWVudHMgc2hvdWxkIGJlIGNvbXBpbGVkIGF3YXkgYW5kIHBhc3NpbmcgaXQgYXQgcnVudGltZSBoYXMgbm8gZWZmZWN0LmBcbik7XG5mdW5jdGlvbiBkZWZpbmVQcm9wcygpIHtcbiAgaWYgKCEhKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSBcInByb2R1Y3Rpb25cIikpIHtcbiAgICB3YXJuUnVudGltZVVzYWdlKGBkZWZpbmVQcm9wc2ApO1xuICB9XG4gIHJldHVybiBudWxsO1xufVxuZnVuY3Rpb24gZGVmaW5lRW1pdHMoKSB7XG4gIGlmICghIShwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gXCJwcm9kdWN0aW9uXCIpKSB7XG4gICAgd2FyblJ1bnRpbWVVc2FnZShgZGVmaW5lRW1pdHNgKTtcbiAgfVxuICByZXR1cm4gbnVsbDtcbn1cbmZ1bmN0aW9uIGRlZmluZUV4cG9zZShleHBvc2VkKSB7XG4gIGlmICghIShwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gXCJwcm9kdWN0aW9uXCIpKSB7XG4gICAgd2FyblJ1bnRpbWVVc2FnZShgZGVmaW5lRXhwb3NlYCk7XG4gIH1cbn1cbmZ1bmN0aW9uIGRlZmluZU9wdGlvbnMob3B0aW9ucykge1xuICBpZiAoISEocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09IFwicHJvZHVjdGlvblwiKSkge1xuICAgIHdhcm5SdW50aW1lVXNhZ2UoYGRlZmluZU9wdGlvbnNgKTtcbiAgfVxufVxuZnVuY3Rpb24gZGVmaW5lU2xvdHMoKSB7XG4gIGlmICghIShwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gXCJwcm9kdWN0aW9uXCIpKSB7XG4gICAgd2FyblJ1bnRpbWVVc2FnZShgZGVmaW5lU2xvdHNgKTtcbiAgfVxuICByZXR1cm4gbnVsbDtcbn1cbmZ1bmN0aW9uIGRlZmluZU1vZGVsKCkge1xuICBpZiAoISEocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09IFwicHJvZHVjdGlvblwiKSkge1xuICAgIHdhcm5SdW50aW1lVXNhZ2UoXCJkZWZpbmVNb2RlbFwiKTtcbiAgfVxufVxuZnVuY3Rpb24gd2l0aERlZmF1bHRzKHByb3BzLCBkZWZhdWx0cykge1xuICBpZiAoISEocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09IFwicHJvZHVjdGlvblwiKSkge1xuICAgIHdhcm5SdW50aW1lVXNhZ2UoYHdpdGhEZWZhdWx0c2ApO1xuICB9XG4gIHJldHVybiBudWxsO1xufVxuZnVuY3Rpb24gdXNlU2xvdHMoKSB7XG4gIHJldHVybiBnZXRDb250ZXh0KFwidXNlU2xvdHNcIikuc2xvdHM7XG59XG5mdW5jdGlvbiB1c2VBdHRycygpIHtcbiAgcmV0dXJuIGdldENvbnRleHQoXCJ1c2VBdHRyc1wiKS5hdHRycztcbn1cbmZ1bmN0aW9uIGdldENvbnRleHQoY2FsbGVkRnVuY3Rpb25OYW1lKSB7XG4gIGNvbnN0IGkgPSBnZXRDdXJyZW50SW5zdGFuY2UoKTtcbiAgaWYgKCEhKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSBcInByb2R1Y3Rpb25cIikgJiYgIWkpIHtcbiAgICB3YXJuJDEoYCR7Y2FsbGVkRnVuY3Rpb25OYW1lfSgpIGNhbGxlZCB3aXRob3V0IGFjdGl2ZSBpbnN0YW5jZS5gKTtcbiAgfVxuICByZXR1cm4gaS5zZXR1cENvbnRleHQgfHwgKGkuc2V0dXBDb250ZXh0ID0gY3JlYXRlU2V0dXBDb250ZXh0KGkpKTtcbn1cbmZ1bmN0aW9uIG5vcm1hbGl6ZVByb3BzT3JFbWl0cyhwcm9wcykge1xuICByZXR1cm4gaXNBcnJheShwcm9wcykgPyBwcm9wcy5yZWR1Y2UoXG4gICAgKG5vcm1hbGl6ZWQsIHApID0+IChub3JtYWxpemVkW3BdID0gbnVsbCwgbm9ybWFsaXplZCksXG4gICAge31cbiAgKSA6IHByb3BzO1xufVxuZnVuY3Rpb24gbWVyZ2VEZWZhdWx0cyhyYXcsIGRlZmF1bHRzKSB7XG4gIGNvbnN0IHByb3BzID0gbm9ybWFsaXplUHJvcHNPckVtaXRzKHJhdyk7XG4gIGZvciAoY29uc3Qga2V5IGluIGRlZmF1bHRzKSB7XG4gICAgaWYgKGtleS5zdGFydHNXaXRoKFwiX19za2lwXCIpKSBjb250aW51ZTtcbiAgICBsZXQgb3B0ID0gcHJvcHNba2V5XTtcbiAgICBpZiAob3B0KSB7XG4gICAgICBpZiAoaXNBcnJheShvcHQpIHx8IGlzRnVuY3Rpb24ob3B0KSkge1xuICAgICAgICBvcHQgPSBwcm9wc1trZXldID0geyB0eXBlOiBvcHQsIGRlZmF1bHQ6IGRlZmF1bHRzW2tleV0gfTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIG9wdC5kZWZhdWx0ID0gZGVmYXVsdHNba2V5XTtcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKG9wdCA9PT0gbnVsbCkge1xuICAgICAgb3B0ID0gcHJvcHNba2V5XSA9IHsgZGVmYXVsdDogZGVmYXVsdHNba2V5XSB9O1xuICAgIH0gZWxzZSBpZiAoISEocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09IFwicHJvZHVjdGlvblwiKSkge1xuICAgICAgd2FybiQxKGBwcm9wcyBkZWZhdWx0IGtleSBcIiR7a2V5fVwiIGhhcyBubyBjb3JyZXNwb25kaW5nIGRlY2xhcmF0aW9uLmApO1xuICAgIH1cbiAgICBpZiAob3B0ICYmIGRlZmF1bHRzW2BfX3NraXBfJHtrZXl9YF0pIHtcbiAgICAgIG9wdC5za2lwRmFjdG9yeSA9IHRydWU7XG4gICAgfVxuICB9XG4gIHJldHVybiBwcm9wcztcbn1cbmZ1bmN0aW9uIG1lcmdlTW9kZWxzKGEsIGIpIHtcbiAgaWYgKCFhIHx8ICFiKSByZXR1cm4gYSB8fCBiO1xuICBpZiAoaXNBcnJheShhKSAmJiBpc0FycmF5KGIpKSByZXR1cm4gYS5jb25jYXQoYik7XG4gIHJldHVybiBleHRlbmQoe30sIG5vcm1hbGl6ZVByb3BzT3JFbWl0cyhhKSwgbm9ybWFsaXplUHJvcHNPckVtaXRzKGIpKTtcbn1cbmZ1bmN0aW9uIGNyZWF0ZVByb3BzUmVzdFByb3h5KHByb3BzLCBleGNsdWRlZEtleXMpIHtcbiAgY29uc3QgcmV0ID0ge307XG4gIGZvciAoY29uc3Qga2V5IGluIHByb3BzKSB7XG4gICAgaWYgKCFleGNsdWRlZEtleXMuaW5jbHVkZXMoa2V5KSkge1xuICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHJldCwga2V5LCB7XG4gICAgICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgICAgIGdldDogKCkgPT4gcHJvcHNba2V5XVxuICAgICAgfSk7XG4gICAgfVxuICB9XG4gIHJldHVybiByZXQ7XG59XG5mdW5jdGlvbiB3aXRoQXN5bmNDb250ZXh0KGdldEF3YWl0YWJsZSkge1xuICBjb25zdCBjdHggPSBnZXRDdXJyZW50SW5zdGFuY2UoKTtcbiAgaWYgKCEhKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSBcInByb2R1Y3Rpb25cIikgJiYgIWN0eCkge1xuICAgIHdhcm4kMShcbiAgICAgIGB3aXRoQXN5bmNDb250ZXh0IGNhbGxlZCB3aXRob3V0IGFjdGl2ZSBjdXJyZW50IGluc3RhbmNlLiBUaGlzIGlzIGxpa2VseSBhIGJ1Zy5gXG4gICAgKTtcbiAgfVxuICBsZXQgYXdhaXRhYmxlID0gZ2V0QXdhaXRhYmxlKCk7XG4gIHVuc2V0Q3VycmVudEluc3RhbmNlKCk7XG4gIGlmIChpc1Byb21pc2UoYXdhaXRhYmxlKSkge1xuICAgIGF3YWl0YWJsZSA9IGF3YWl0YWJsZS5jYXRjaCgoZSkgPT4ge1xuICAgICAgc2V0Q3VycmVudEluc3RhbmNlKGN0eCk7XG4gICAgICB0aHJvdyBlO1xuICAgIH0pO1xuICB9XG4gIHJldHVybiBbYXdhaXRhYmxlLCAoKSA9PiBzZXRDdXJyZW50SW5zdGFuY2UoY3R4KV07XG59XG5cbmZ1bmN0aW9uIGNyZWF0ZUR1cGxpY2F0ZUNoZWNrZXIoKSB7XG4gIGNvbnN0IGNhY2hlID0gLyogQF9fUFVSRV9fICovIE9iamVjdC5jcmVhdGUobnVsbCk7XG4gIHJldHVybiAodHlwZSwga2V5KSA9PiB7XG4gICAgaWYgKGNhY2hlW2tleV0pIHtcbiAgICAgIHdhcm4kMShgJHt0eXBlfSBwcm9wZXJ0eSBcIiR7a2V5fVwiIGlzIGFscmVhZHkgZGVmaW5lZCBpbiAke2NhY2hlW2tleV19LmApO1xuICAgIH0gZWxzZSB7XG4gICAgICBjYWNoZVtrZXldID0gdHlwZTtcbiAgICB9XG4gIH07XG59XG5sZXQgc2hvdWxkQ2FjaGVBY2Nlc3MgPSB0cnVlO1xuZnVuY3Rpb24gYXBwbHlPcHRpb25zKGluc3RhbmNlKSB7XG4gIGNvbnN0IG9wdGlvbnMgPSByZXNvbHZlTWVyZ2VkT3B0aW9ucyhpbnN0YW5jZSk7XG4gIGNvbnN0IHB1YmxpY1RoaXMgPSBpbnN0YW5jZS5wcm94eTtcbiAgY29uc3QgY3R4ID0gaW5zdGFuY2UuY3R4O1xuICBzaG91bGRDYWNoZUFjY2VzcyA9IGZhbHNlO1xuICBpZiAob3B0aW9ucy5iZWZvcmVDcmVhdGUpIHtcbiAgICBjYWxsSG9vayhvcHRpb25zLmJlZm9yZUNyZWF0ZSwgaW5zdGFuY2UsIFwiYmNcIik7XG4gIH1cbiAgY29uc3Qge1xuICAgIC8vIHN0YXRlXG4gICAgZGF0YTogZGF0YU9wdGlvbnMsXG4gICAgY29tcHV0ZWQ6IGNvbXB1dGVkT3B0aW9ucyxcbiAgICBtZXRob2RzLFxuICAgIHdhdGNoOiB3YXRjaE9wdGlvbnMsXG4gICAgcHJvdmlkZTogcHJvdmlkZU9wdGlvbnMsXG4gICAgaW5qZWN0OiBpbmplY3RPcHRpb25zLFxuICAgIC8vIGxpZmVjeWNsZVxuICAgIGNyZWF0ZWQsXG4gICAgYmVmb3JlTW91bnQsXG4gICAgbW91bnRlZCxcbiAgICBiZWZvcmVVcGRhdGUsXG4gICAgdXBkYXRlZCxcbiAgICBhY3RpdmF0ZWQsXG4gICAgZGVhY3RpdmF0ZWQsXG4gICAgYmVmb3JlRGVzdHJveSxcbiAgICBiZWZvcmVVbm1vdW50LFxuICAgIGRlc3Ryb3llZCxcbiAgICB1bm1vdW50ZWQsXG4gICAgcmVuZGVyLFxuICAgIHJlbmRlclRyYWNrZWQsXG4gICAgcmVuZGVyVHJpZ2dlcmVkLFxuICAgIGVycm9yQ2FwdHVyZWQsXG4gICAgc2VydmVyUHJlZmV0Y2gsXG4gICAgLy8gcHVibGljIEFQSVxuICAgIGV4cG9zZSxcbiAgICBpbmhlcml0QXR0cnMsXG4gICAgLy8gYXNzZXRzXG4gICAgY29tcG9uZW50cyxcbiAgICBkaXJlY3RpdmVzLFxuICAgIGZpbHRlcnNcbiAgfSA9IG9wdGlvbnM7XG4gIGNvbnN0IGNoZWNrRHVwbGljYXRlUHJvcGVydGllcyA9ICEhKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSBcInByb2R1Y3Rpb25cIikgPyBjcmVhdGVEdXBsaWNhdGVDaGVja2VyKCkgOiBudWxsO1xuICBpZiAoISEocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09IFwicHJvZHVjdGlvblwiKSkge1xuICAgIGNvbnN0IFtwcm9wc09wdGlvbnNdID0gaW5zdGFuY2UucHJvcHNPcHRpb25zO1xuICAgIGlmIChwcm9wc09wdGlvbnMpIHtcbiAgICAgIGZvciAoY29uc3Qga2V5IGluIHByb3BzT3B0aW9ucykge1xuICAgICAgICBjaGVja0R1cGxpY2F0ZVByb3BlcnRpZXMoXCJQcm9wc1wiIC8qIFBST1BTICovLCBrZXkpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuICBpZiAoaW5qZWN0T3B0aW9ucykge1xuICAgIHJlc29sdmVJbmplY3Rpb25zKGluamVjdE9wdGlvbnMsIGN0eCwgY2hlY2tEdXBsaWNhdGVQcm9wZXJ0aWVzKTtcbiAgfVxuICBpZiAobWV0aG9kcykge1xuICAgIGZvciAoY29uc3Qga2V5IGluIG1ldGhvZHMpIHtcbiAgICAgIGNvbnN0IG1ldGhvZEhhbmRsZXIgPSBtZXRob2RzW2tleV07XG4gICAgICBpZiAoaXNGdW5jdGlvbihtZXRob2RIYW5kbGVyKSkge1xuICAgICAgICBpZiAoISEocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09IFwicHJvZHVjdGlvblwiKSkge1xuICAgICAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShjdHgsIGtleSwge1xuICAgICAgICAgICAgdmFsdWU6IG1ldGhvZEhhbmRsZXIuYmluZChwdWJsaWNUaGlzKSxcbiAgICAgICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZSxcbiAgICAgICAgICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgICAgICAgICB3cml0YWJsZTogdHJ1ZVxuICAgICAgICAgIH0pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGN0eFtrZXldID0gbWV0aG9kSGFuZGxlci5iaW5kKHB1YmxpY1RoaXMpO1xuICAgICAgICB9XG4gICAgICAgIGlmICghIShwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gXCJwcm9kdWN0aW9uXCIpKSB7XG4gICAgICAgICAgY2hlY2tEdXBsaWNhdGVQcm9wZXJ0aWVzKFwiTWV0aG9kc1wiIC8qIE1FVEhPRFMgKi8sIGtleSk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSBpZiAoISEocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09IFwicHJvZHVjdGlvblwiKSkge1xuICAgICAgICB3YXJuJDEoXG4gICAgICAgICAgYE1ldGhvZCBcIiR7a2V5fVwiIGhhcyB0eXBlIFwiJHt0eXBlb2YgbWV0aG9kSGFuZGxlcn1cIiBpbiB0aGUgY29tcG9uZW50IGRlZmluaXRpb24uIERpZCB5b3UgcmVmZXJlbmNlIHRoZSBmdW5jdGlvbiBjb3JyZWN0bHk/YFxuICAgICAgICApO1xuICAgICAgfVxuICAgIH1cbiAgfVxuICBpZiAoZGF0YU9wdGlvbnMpIHtcbiAgICBpZiAoISEocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09IFwicHJvZHVjdGlvblwiKSAmJiAhaXNGdW5jdGlvbihkYXRhT3B0aW9ucykpIHtcbiAgICAgIHdhcm4kMShcbiAgICAgICAgYFRoZSBkYXRhIG9wdGlvbiBtdXN0IGJlIGEgZnVuY3Rpb24uIFBsYWluIG9iamVjdCB1c2FnZSBpcyBubyBsb25nZXIgc3VwcG9ydGVkLmBcbiAgICAgICk7XG4gICAgfVxuICAgIGNvbnN0IGRhdGEgPSBkYXRhT3B0aW9ucy5jYWxsKHB1YmxpY1RoaXMsIHB1YmxpY1RoaXMpO1xuICAgIGlmICghIShwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gXCJwcm9kdWN0aW9uXCIpICYmIGlzUHJvbWlzZShkYXRhKSkge1xuICAgICAgd2FybiQxKFxuICAgICAgICBgZGF0YSgpIHJldHVybmVkIGEgUHJvbWlzZSAtIG5vdGUgZGF0YSgpIGNhbm5vdCBiZSBhc3luYzsgSWYgeW91IGludGVuZCB0byBwZXJmb3JtIGRhdGEgZmV0Y2hpbmcgYmVmb3JlIGNvbXBvbmVudCByZW5kZXJzLCB1c2UgYXN5bmMgc2V0dXAoKSArIDxTdXNwZW5zZT4uYFxuICAgICAgKTtcbiAgICB9XG4gICAgaWYgKCFpc09iamVjdChkYXRhKSkge1xuICAgICAgISEocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09IFwicHJvZHVjdGlvblwiKSAmJiB3YXJuJDEoYGRhdGEoKSBzaG91bGQgcmV0dXJuIGFuIG9iamVjdC5gKTtcbiAgICB9IGVsc2Uge1xuICAgICAgaW5zdGFuY2UuZGF0YSA9IHJlYWN0aXZlKGRhdGEpO1xuICAgICAgaWYgKCEhKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSBcInByb2R1Y3Rpb25cIikpIHtcbiAgICAgICAgZm9yIChjb25zdCBrZXkgaW4gZGF0YSkge1xuICAgICAgICAgIGNoZWNrRHVwbGljYXRlUHJvcGVydGllcyhcIkRhdGFcIiAvKiBEQVRBICovLCBrZXkpO1xuICAgICAgICAgIGlmICghaXNSZXNlcnZlZFByZWZpeChrZXlbMF0pKSB7XG4gICAgICAgICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoY3R4LCBrZXksIHtcbiAgICAgICAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlLFxuICAgICAgICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgICAgICAgICBnZXQ6ICgpID0+IGRhdGFba2V5XSxcbiAgICAgICAgICAgICAgc2V0OiBOT09QXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgc2hvdWxkQ2FjaGVBY2Nlc3MgPSB0cnVlO1xuICBpZiAoY29tcHV0ZWRPcHRpb25zKSB7XG4gICAgZm9yIChjb25zdCBrZXkgaW4gY29tcHV0ZWRPcHRpb25zKSB7XG4gICAgICBjb25zdCBvcHQgPSBjb21wdXRlZE9wdGlvbnNba2V5XTtcbiAgICAgIGNvbnN0IGdldCA9IGlzRnVuY3Rpb24ob3B0KSA/IG9wdC5iaW5kKHB1YmxpY1RoaXMsIHB1YmxpY1RoaXMpIDogaXNGdW5jdGlvbihvcHQuZ2V0KSA/IG9wdC5nZXQuYmluZChwdWJsaWNUaGlzLCBwdWJsaWNUaGlzKSA6IE5PT1A7XG4gICAgICBpZiAoISEocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09IFwicHJvZHVjdGlvblwiKSAmJiBnZXQgPT09IE5PT1ApIHtcbiAgICAgICAgd2FybiQxKGBDb21wdXRlZCBwcm9wZXJ0eSBcIiR7a2V5fVwiIGhhcyBubyBnZXR0ZXIuYCk7XG4gICAgICB9XG4gICAgICBjb25zdCBzZXQgPSAhaXNGdW5jdGlvbihvcHQpICYmIGlzRnVuY3Rpb24ob3B0LnNldCkgPyBvcHQuc2V0LmJpbmQocHVibGljVGhpcykgOiAhIShwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gXCJwcm9kdWN0aW9uXCIpID8gKCkgPT4ge1xuICAgICAgICB3YXJuJDEoXG4gICAgICAgICAgYFdyaXRlIG9wZXJhdGlvbiBmYWlsZWQ6IGNvbXB1dGVkIHByb3BlcnR5IFwiJHtrZXl9XCIgaXMgcmVhZG9ubHkuYFxuICAgICAgICApO1xuICAgICAgfSA6IE5PT1A7XG4gICAgICBjb25zdCBjID0gY29tcHV0ZWQoe1xuICAgICAgICBnZXQsXG4gICAgICAgIHNldFxuICAgICAgfSk7XG4gICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoY3R4LCBrZXksIHtcbiAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlLFxuICAgICAgICBnZXQ6ICgpID0+IGMudmFsdWUsXG4gICAgICAgIHNldDogKHYpID0+IGMudmFsdWUgPSB2XG4gICAgICB9KTtcbiAgICAgIGlmICghIShwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gXCJwcm9kdWN0aW9uXCIpKSB7XG4gICAgICAgIGNoZWNrRHVwbGljYXRlUHJvcGVydGllcyhcIkNvbXB1dGVkXCIgLyogQ09NUFVURUQgKi8sIGtleSk7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIGlmICh3YXRjaE9wdGlvbnMpIHtcbiAgICBmb3IgKGNvbnN0IGtleSBpbiB3YXRjaE9wdGlvbnMpIHtcbiAgICAgIGNyZWF0ZVdhdGNoZXIod2F0Y2hPcHRpb25zW2tleV0sIGN0eCwgcHVibGljVGhpcywga2V5KTtcbiAgICB9XG4gIH1cbiAgaWYgKHByb3ZpZGVPcHRpb25zKSB7XG4gICAgY29uc3QgcHJvdmlkZXMgPSBpc0Z1bmN0aW9uKHByb3ZpZGVPcHRpb25zKSA/IHByb3ZpZGVPcHRpb25zLmNhbGwocHVibGljVGhpcykgOiBwcm92aWRlT3B0aW9ucztcbiAgICBSZWZsZWN0Lm93bktleXMocHJvdmlkZXMpLmZvckVhY2goKGtleSkgPT4ge1xuICAgICAgcHJvdmlkZShrZXksIHByb3ZpZGVzW2tleV0pO1xuICAgIH0pO1xuICB9XG4gIGlmIChjcmVhdGVkKSB7XG4gICAgY2FsbEhvb2soY3JlYXRlZCwgaW5zdGFuY2UsIFwiY1wiKTtcbiAgfVxuICBmdW5jdGlvbiByZWdpc3RlckxpZmVjeWNsZUhvb2socmVnaXN0ZXIsIGhvb2spIHtcbiAgICBpZiAoaXNBcnJheShob29rKSkge1xuICAgICAgaG9vay5mb3JFYWNoKChfaG9vaykgPT4gcmVnaXN0ZXIoX2hvb2suYmluZChwdWJsaWNUaGlzKSkpO1xuICAgIH0gZWxzZSBpZiAoaG9vaykge1xuICAgICAgcmVnaXN0ZXIoaG9vay5iaW5kKHB1YmxpY1RoaXMpKTtcbiAgICB9XG4gIH1cbiAgcmVnaXN0ZXJMaWZlY3ljbGVIb29rKG9uQmVmb3JlTW91bnQsIGJlZm9yZU1vdW50KTtcbiAgcmVnaXN0ZXJMaWZlY3ljbGVIb29rKG9uTW91bnRlZCwgbW91bnRlZCk7XG4gIHJlZ2lzdGVyTGlmZWN5Y2xlSG9vayhvbkJlZm9yZVVwZGF0ZSwgYmVmb3JlVXBkYXRlKTtcbiAgcmVnaXN0ZXJMaWZlY3ljbGVIb29rKG9uVXBkYXRlZCwgdXBkYXRlZCk7XG4gIHJlZ2lzdGVyTGlmZWN5Y2xlSG9vayhvbkFjdGl2YXRlZCwgYWN0aXZhdGVkKTtcbiAgcmVnaXN0ZXJMaWZlY3ljbGVIb29rKG9uRGVhY3RpdmF0ZWQsIGRlYWN0aXZhdGVkKTtcbiAgcmVnaXN0ZXJMaWZlY3ljbGVIb29rKG9uRXJyb3JDYXB0dXJlZCwgZXJyb3JDYXB0dXJlZCk7XG4gIHJlZ2lzdGVyTGlmZWN5Y2xlSG9vayhvblJlbmRlclRyYWNrZWQsIHJlbmRlclRyYWNrZWQpO1xuICByZWdpc3RlckxpZmVjeWNsZUhvb2sob25SZW5kZXJUcmlnZ2VyZWQsIHJlbmRlclRyaWdnZXJlZCk7XG4gIHJlZ2lzdGVyTGlmZWN5Y2xlSG9vayhvbkJlZm9yZVVubW91bnQsIGJlZm9yZVVubW91bnQpO1xuICByZWdpc3RlckxpZmVjeWNsZUhvb2sob25Vbm1vdW50ZWQsIHVubW91bnRlZCk7XG4gIHJlZ2lzdGVyTGlmZWN5Y2xlSG9vayhvblNlcnZlclByZWZldGNoLCBzZXJ2ZXJQcmVmZXRjaCk7XG4gIGlmIChpc0FycmF5KGV4cG9zZSkpIHtcbiAgICBpZiAoZXhwb3NlLmxlbmd0aCkge1xuICAgICAgY29uc3QgZXhwb3NlZCA9IGluc3RhbmNlLmV4cG9zZWQgfHwgKGluc3RhbmNlLmV4cG9zZWQgPSB7fSk7XG4gICAgICBleHBvc2UuZm9yRWFjaCgoa2V5KSA9PiB7XG4gICAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvc2VkLCBrZXksIHtcbiAgICAgICAgICBnZXQ6ICgpID0+IHB1YmxpY1RoaXNba2V5XSxcbiAgICAgICAgICBzZXQ6ICh2YWwpID0+IHB1YmxpY1RoaXNba2V5XSA9IHZhbCxcbiAgICAgICAgICBlbnVtZXJhYmxlOiB0cnVlXG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfSBlbHNlIGlmICghaW5zdGFuY2UuZXhwb3NlZCkge1xuICAgICAgaW5zdGFuY2UuZXhwb3NlZCA9IHt9O1xuICAgIH1cbiAgfVxuICBpZiAocmVuZGVyICYmIGluc3RhbmNlLnJlbmRlciA9PT0gTk9PUCkge1xuICAgIGluc3RhbmNlLnJlbmRlciA9IHJlbmRlcjtcbiAgfVxuICBpZiAoaW5oZXJpdEF0dHJzICE9IG51bGwpIHtcbiAgICBpbnN0YW5jZS5pbmhlcml0QXR0cnMgPSBpbmhlcml0QXR0cnM7XG4gIH1cbiAgaWYgKGNvbXBvbmVudHMpIGluc3RhbmNlLmNvbXBvbmVudHMgPSBjb21wb25lbnRzO1xuICBpZiAoZGlyZWN0aXZlcykgaW5zdGFuY2UuZGlyZWN0aXZlcyA9IGRpcmVjdGl2ZXM7XG4gIGlmIChzZXJ2ZXJQcmVmZXRjaCkge1xuICAgIG1hcmtBc3luY0JvdW5kYXJ5KGluc3RhbmNlKTtcbiAgfVxufVxuZnVuY3Rpb24gcmVzb2x2ZUluamVjdGlvbnMoaW5qZWN0T3B0aW9ucywgY3R4LCBjaGVja0R1cGxpY2F0ZVByb3BlcnRpZXMgPSBOT09QKSB7XG4gIGlmIChpc0FycmF5KGluamVjdE9wdGlvbnMpKSB7XG4gICAgaW5qZWN0T3B0aW9ucyA9IG5vcm1hbGl6ZUluamVjdChpbmplY3RPcHRpb25zKTtcbiAgfVxuICBmb3IgKGNvbnN0IGtleSBpbiBpbmplY3RPcHRpb25zKSB7XG4gICAgY29uc3Qgb3B0ID0gaW5qZWN0T3B0aW9uc1trZXldO1xuICAgIGxldCBpbmplY3RlZDtcbiAgICBpZiAoaXNPYmplY3Qob3B0KSkge1xuICAgICAgaWYgKFwiZGVmYXVsdFwiIGluIG9wdCkge1xuICAgICAgICBpbmplY3RlZCA9IGluamVjdChcbiAgICAgICAgICBvcHQuZnJvbSB8fCBrZXksXG4gICAgICAgICAgb3B0LmRlZmF1bHQsXG4gICAgICAgICAgdHJ1ZVxuICAgICAgICApO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaW5qZWN0ZWQgPSBpbmplY3Qob3B0LmZyb20gfHwga2V5KTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgaW5qZWN0ZWQgPSBpbmplY3Qob3B0KTtcbiAgICB9XG4gICAgaWYgKGlzUmVmKGluamVjdGVkKSkge1xuICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KGN0eCwga2V5LCB7XG4gICAgICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZSxcbiAgICAgICAgZ2V0OiAoKSA9PiBpbmplY3RlZC52YWx1ZSxcbiAgICAgICAgc2V0OiAodikgPT4gaW5qZWN0ZWQudmFsdWUgPSB2XG4gICAgICB9KTtcbiAgICB9IGVsc2Uge1xuICAgICAgY3R4W2tleV0gPSBpbmplY3RlZDtcbiAgICB9XG4gICAgaWYgKCEhKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSBcInByb2R1Y3Rpb25cIikpIHtcbiAgICAgIGNoZWNrRHVwbGljYXRlUHJvcGVydGllcyhcIkluamVjdFwiIC8qIElOSkVDVCAqLywga2V5KTtcbiAgICB9XG4gIH1cbn1cbmZ1bmN0aW9uIGNhbGxIb29rKGhvb2ssIGluc3RhbmNlLCB0eXBlKSB7XG4gIGNhbGxXaXRoQXN5bmNFcnJvckhhbmRsaW5nKFxuICAgIGlzQXJyYXkoaG9vaykgPyBob29rLm1hcCgoaCkgPT4gaC5iaW5kKGluc3RhbmNlLnByb3h5KSkgOiBob29rLmJpbmQoaW5zdGFuY2UucHJveHkpLFxuICAgIGluc3RhbmNlLFxuICAgIHR5cGVcbiAgKTtcbn1cbmZ1bmN0aW9uIGNyZWF0ZVdhdGNoZXIocmF3LCBjdHgsIHB1YmxpY1RoaXMsIGtleSkge1xuICBsZXQgZ2V0dGVyID0ga2V5LmluY2x1ZGVzKFwiLlwiKSA/IGNyZWF0ZVBhdGhHZXR0ZXIocHVibGljVGhpcywga2V5KSA6ICgpID0+IHB1YmxpY1RoaXNba2V5XTtcbiAgaWYgKGlzU3RyaW5nKHJhdykpIHtcbiAgICBjb25zdCBoYW5kbGVyID0gY3R4W3Jhd107XG4gICAgaWYgKGlzRnVuY3Rpb24oaGFuZGxlcikpIHtcbiAgICAgIHtcbiAgICAgICAgd2F0Y2goZ2V0dGVyLCBoYW5kbGVyKTtcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKCEhKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSBcInByb2R1Y3Rpb25cIikpIHtcbiAgICAgIHdhcm4kMShgSW52YWxpZCB3YXRjaCBoYW5kbGVyIHNwZWNpZmllZCBieSBrZXkgXCIke3Jhd31cImAsIGhhbmRsZXIpO1xuICAgIH1cbiAgfSBlbHNlIGlmIChpc0Z1bmN0aW9uKHJhdykpIHtcbiAgICB7XG4gICAgICB3YXRjaChnZXR0ZXIsIHJhdy5iaW5kKHB1YmxpY1RoaXMpKTtcbiAgICB9XG4gIH0gZWxzZSBpZiAoaXNPYmplY3QocmF3KSkge1xuICAgIGlmIChpc0FycmF5KHJhdykpIHtcbiAgICAgIHJhdy5mb3JFYWNoKChyKSA9PiBjcmVhdGVXYXRjaGVyKHIsIGN0eCwgcHVibGljVGhpcywga2V5KSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnN0IGhhbmRsZXIgPSBpc0Z1bmN0aW9uKHJhdy5oYW5kbGVyKSA/IHJhdy5oYW5kbGVyLmJpbmQocHVibGljVGhpcykgOiBjdHhbcmF3LmhhbmRsZXJdO1xuICAgICAgaWYgKGlzRnVuY3Rpb24oaGFuZGxlcikpIHtcbiAgICAgICAgd2F0Y2goZ2V0dGVyLCBoYW5kbGVyLCByYXcpO1xuICAgICAgfSBlbHNlIGlmICghIShwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gXCJwcm9kdWN0aW9uXCIpKSB7XG4gICAgICAgIHdhcm4kMShgSW52YWxpZCB3YXRjaCBoYW5kbGVyIHNwZWNpZmllZCBieSBrZXkgXCIke3Jhdy5oYW5kbGVyfVwiYCwgaGFuZGxlcik7XG4gICAgICB9XG4gICAgfVxuICB9IGVsc2UgaWYgKCEhKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSBcInByb2R1Y3Rpb25cIikpIHtcbiAgICB3YXJuJDEoYEludmFsaWQgd2F0Y2ggb3B0aW9uOiBcIiR7a2V5fVwiYCwgcmF3KTtcbiAgfVxufVxuZnVuY3Rpb24gcmVzb2x2ZU1lcmdlZE9wdGlvbnMoaW5zdGFuY2UpIHtcbiAgY29uc3QgYmFzZSA9IGluc3RhbmNlLnR5cGU7XG4gIGNvbnN0IHsgbWl4aW5zLCBleHRlbmRzOiBleHRlbmRzT3B0aW9ucyB9ID0gYmFzZTtcbiAgY29uc3Qge1xuICAgIG1peGluczogZ2xvYmFsTWl4aW5zLFxuICAgIG9wdGlvbnNDYWNoZTogY2FjaGUsXG4gICAgY29uZmlnOiB7IG9wdGlvbk1lcmdlU3RyYXRlZ2llcyB9XG4gIH0gPSBpbnN0YW5jZS5hcHBDb250ZXh0O1xuICBjb25zdCBjYWNoZWQgPSBjYWNoZS5nZXQoYmFzZSk7XG4gIGxldCByZXNvbHZlZDtcbiAgaWYgKGNhY2hlZCkge1xuICAgIHJlc29sdmVkID0gY2FjaGVkO1xuICB9IGVsc2UgaWYgKCFnbG9iYWxNaXhpbnMubGVuZ3RoICYmICFtaXhpbnMgJiYgIWV4dGVuZHNPcHRpb25zKSB7XG4gICAge1xuICAgICAgcmVzb2x2ZWQgPSBiYXNlO1xuICAgIH1cbiAgfSBlbHNlIHtcbiAgICByZXNvbHZlZCA9IHt9O1xuICAgIGlmIChnbG9iYWxNaXhpbnMubGVuZ3RoKSB7XG4gICAgICBnbG9iYWxNaXhpbnMuZm9yRWFjaChcbiAgICAgICAgKG0pID0+IG1lcmdlT3B0aW9ucyhyZXNvbHZlZCwgbSwgb3B0aW9uTWVyZ2VTdHJhdGVnaWVzLCB0cnVlKVxuICAgICAgKTtcbiAgICB9XG4gICAgbWVyZ2VPcHRpb25zKHJlc29sdmVkLCBiYXNlLCBvcHRpb25NZXJnZVN0cmF0ZWdpZXMpO1xuICB9XG4gIGlmIChpc09iamVjdChiYXNlKSkge1xuICAgIGNhY2hlLnNldChiYXNlLCByZXNvbHZlZCk7XG4gIH1cbiAgcmV0dXJuIHJlc29sdmVkO1xufVxuZnVuY3Rpb24gbWVyZ2VPcHRpb25zKHRvLCBmcm9tLCBzdHJhdHMsIGFzTWl4aW4gPSBmYWxzZSkge1xuICBjb25zdCB7IG1peGlucywgZXh0ZW5kczogZXh0ZW5kc09wdGlvbnMgfSA9IGZyb207XG4gIGlmIChleHRlbmRzT3B0aW9ucykge1xuICAgIG1lcmdlT3B0aW9ucyh0bywgZXh0ZW5kc09wdGlvbnMsIHN0cmF0cywgdHJ1ZSk7XG4gIH1cbiAgaWYgKG1peGlucykge1xuICAgIG1peGlucy5mb3JFYWNoKFxuICAgICAgKG0pID0+IG1lcmdlT3B0aW9ucyh0bywgbSwgc3RyYXRzLCB0cnVlKVxuICAgICk7XG4gIH1cbiAgZm9yIChjb25zdCBrZXkgaW4gZnJvbSkge1xuICAgIGlmIChhc01peGluICYmIGtleSA9PT0gXCJleHBvc2VcIikge1xuICAgICAgISEocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09IFwicHJvZHVjdGlvblwiKSAmJiB3YXJuJDEoXG4gICAgICAgIGBcImV4cG9zZVwiIG9wdGlvbiBpcyBpZ25vcmVkIHdoZW4gZGVjbGFyZWQgaW4gbWl4aW5zIG9yIGV4dGVuZHMuIEl0IHNob3VsZCBvbmx5IGJlIGRlY2xhcmVkIGluIHRoZSBiYXNlIGNvbXBvbmVudCBpdHNlbGYuYFxuICAgICAgKTtcbiAgICB9IGVsc2Uge1xuICAgICAgY29uc3Qgc3RyYXQgPSBpbnRlcm5hbE9wdGlvbk1lcmdlU3RyYXRzW2tleV0gfHwgc3RyYXRzICYmIHN0cmF0c1trZXldO1xuICAgICAgdG9ba2V5XSA9IHN0cmF0ID8gc3RyYXQodG9ba2V5XSwgZnJvbVtrZXldKSA6IGZyb21ba2V5XTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHRvO1xufVxuY29uc3QgaW50ZXJuYWxPcHRpb25NZXJnZVN0cmF0cyA9IHtcbiAgZGF0YTogbWVyZ2VEYXRhRm4sXG4gIHByb3BzOiBtZXJnZUVtaXRzT3JQcm9wc09wdGlvbnMsXG4gIGVtaXRzOiBtZXJnZUVtaXRzT3JQcm9wc09wdGlvbnMsXG4gIC8vIG9iamVjdHNcbiAgbWV0aG9kczogbWVyZ2VPYmplY3RPcHRpb25zLFxuICBjb21wdXRlZDogbWVyZ2VPYmplY3RPcHRpb25zLFxuICAvLyBsaWZlY3ljbGVcbiAgYmVmb3JlQ3JlYXRlOiBtZXJnZUFzQXJyYXksXG4gIGNyZWF0ZWQ6IG1lcmdlQXNBcnJheSxcbiAgYmVmb3JlTW91bnQ6IG1lcmdlQXNBcnJheSxcbiAgbW91bnRlZDogbWVyZ2VBc0FycmF5LFxuICBiZWZvcmVVcGRhdGU6IG1lcmdlQXNBcnJheSxcbiAgdXBkYXRlZDogbWVyZ2VBc0FycmF5LFxuICBiZWZvcmVEZXN0cm95OiBtZXJnZUFzQXJyYXksXG4gIGJlZm9yZVVubW91bnQ6IG1lcmdlQXNBcnJheSxcbiAgZGVzdHJveWVkOiBtZXJnZUFzQXJyYXksXG4gIHVubW91bnRlZDogbWVyZ2VBc0FycmF5LFxuICBhY3RpdmF0ZWQ6IG1lcmdlQXNBcnJheSxcbiAgZGVhY3RpdmF0ZWQ6IG1lcmdlQXNBcnJheSxcbiAgZXJyb3JDYXB0dXJlZDogbWVyZ2VBc0FycmF5LFxuICBzZXJ2ZXJQcmVmZXRjaDogbWVyZ2VBc0FycmF5LFxuICAvLyBhc3NldHNcbiAgY29tcG9uZW50czogbWVyZ2VPYmplY3RPcHRpb25zLFxuICBkaXJlY3RpdmVzOiBtZXJnZU9iamVjdE9wdGlvbnMsXG4gIC8vIHdhdGNoXG4gIHdhdGNoOiBtZXJnZVdhdGNoT3B0aW9ucyxcbiAgLy8gcHJvdmlkZSAvIGluamVjdFxuICBwcm92aWRlOiBtZXJnZURhdGFGbixcbiAgaW5qZWN0OiBtZXJnZUluamVjdFxufTtcbmZ1bmN0aW9uIG1lcmdlRGF0YUZuKHRvLCBmcm9tKSB7XG4gIGlmICghZnJvbSkge1xuICAgIHJldHVybiB0bztcbiAgfVxuICBpZiAoIXRvKSB7XG4gICAgcmV0dXJuIGZyb207XG4gIH1cbiAgcmV0dXJuIGZ1bmN0aW9uIG1lcmdlZERhdGFGbigpIHtcbiAgICByZXR1cm4gKGV4dGVuZCkoXG4gICAgICBpc0Z1bmN0aW9uKHRvKSA/IHRvLmNhbGwodGhpcywgdGhpcykgOiB0byxcbiAgICAgIGlzRnVuY3Rpb24oZnJvbSkgPyBmcm9tLmNhbGwodGhpcywgdGhpcykgOiBmcm9tXG4gICAgKTtcbiAgfTtcbn1cbmZ1bmN0aW9uIG1lcmdlSW5qZWN0KHRvLCBmcm9tKSB7XG4gIHJldHVybiBtZXJnZU9iamVjdE9wdGlvbnMobm9ybWFsaXplSW5qZWN0KHRvKSwgbm9ybWFsaXplSW5qZWN0KGZyb20pKTtcbn1cbmZ1bmN0aW9uIG5vcm1hbGl6ZUluamVjdChyYXcpIHtcbiAgaWYgKGlzQXJyYXkocmF3KSkge1xuICAgIGNvbnN0IHJlcyA9IHt9O1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcmF3Lmxlbmd0aDsgaSsrKSB7XG4gICAgICByZXNbcmF3W2ldXSA9IHJhd1tpXTtcbiAgICB9XG4gICAgcmV0dXJuIHJlcztcbiAgfVxuICByZXR1cm4gcmF3O1xufVxuZnVuY3Rpb24gbWVyZ2VBc0FycmF5KHRvLCBmcm9tKSB7XG4gIHJldHVybiB0byA/IFsuLi5uZXcgU2V0KFtdLmNvbmNhdCh0bywgZnJvbSkpXSA6IGZyb207XG59XG5mdW5jdGlvbiBtZXJnZU9iamVjdE9wdGlvbnModG8sIGZyb20pIHtcbiAgcmV0dXJuIHRvID8gZXh0ZW5kKC8qIEBfX1BVUkVfXyAqLyBPYmplY3QuY3JlYXRlKG51bGwpLCB0bywgZnJvbSkgOiBmcm9tO1xufVxuZnVuY3Rpb24gbWVyZ2VFbWl0c09yUHJvcHNPcHRpb25zKHRvLCBmcm9tKSB7XG4gIGlmICh0bykge1xuICAgIGlmIChpc0FycmF5KHRvKSAmJiBpc0FycmF5KGZyb20pKSB7XG4gICAgICByZXR1cm4gWy4uLi8qIEBfX1BVUkVfXyAqLyBuZXcgU2V0KFsuLi50bywgLi4uZnJvbV0pXTtcbiAgICB9XG4gICAgcmV0dXJuIGV4dGVuZChcbiAgICAgIC8qIEBfX1BVUkVfXyAqLyBPYmplY3QuY3JlYXRlKG51bGwpLFxuICAgICAgbm9ybWFsaXplUHJvcHNPckVtaXRzKHRvKSxcbiAgICAgIG5vcm1hbGl6ZVByb3BzT3JFbWl0cyhmcm9tICE9IG51bGwgPyBmcm9tIDoge30pXG4gICAgKTtcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gZnJvbTtcbiAgfVxufVxuZnVuY3Rpb24gbWVyZ2VXYXRjaE9wdGlvbnModG8sIGZyb20pIHtcbiAgaWYgKCF0bykgcmV0dXJuIGZyb207XG4gIGlmICghZnJvbSkgcmV0dXJuIHRvO1xuICBjb25zdCBtZXJnZWQgPSBleHRlbmQoLyogQF9fUFVSRV9fICovIE9iamVjdC5jcmVhdGUobnVsbCksIHRvKTtcbiAgZm9yIChjb25zdCBrZXkgaW4gZnJvbSkge1xuICAgIG1lcmdlZFtrZXldID0gbWVyZ2VBc0FycmF5KHRvW2tleV0sIGZyb21ba2V5XSk7XG4gIH1cbiAgcmV0dXJuIG1lcmdlZDtcbn1cblxuZnVuY3Rpb24gY3JlYXRlQXBwQ29udGV4dCgpIHtcbiAgcmV0dXJuIHtcbiAgICBhcHA6IG51bGwsXG4gICAgY29uZmlnOiB7XG4gICAgICBpc05hdGl2ZVRhZzogTk8sXG4gICAgICBwZXJmb3JtYW5jZTogZmFsc2UsXG4gICAgICBnbG9iYWxQcm9wZXJ0aWVzOiB7fSxcbiAgICAgIG9wdGlvbk1lcmdlU3RyYXRlZ2llczoge30sXG4gICAgICBlcnJvckhhbmRsZXI6IHZvaWQgMCxcbiAgICAgIHdhcm5IYW5kbGVyOiB2b2lkIDAsXG4gICAgICBjb21waWxlck9wdGlvbnM6IHt9XG4gICAgfSxcbiAgICBtaXhpbnM6IFtdLFxuICAgIGNvbXBvbmVudHM6IHt9LFxuICAgIGRpcmVjdGl2ZXM6IHt9LFxuICAgIHByb3ZpZGVzOiAvKiBAX19QVVJFX18gKi8gT2JqZWN0LmNyZWF0ZShudWxsKSxcbiAgICBvcHRpb25zQ2FjaGU6IC8qIEBfX1BVUkVfXyAqLyBuZXcgV2Vha01hcCgpLFxuICAgIHByb3BzQ2FjaGU6IC8qIEBfX1BVUkVfXyAqLyBuZXcgV2Vha01hcCgpLFxuICAgIGVtaXRzQ2FjaGU6IC8qIEBfX1BVUkVfXyAqLyBuZXcgV2Vha01hcCgpXG4gIH07XG59XG5sZXQgdWlkJDEgPSAwO1xuZnVuY3Rpb24gY3JlYXRlQXBwQVBJKHJlbmRlciwgaHlkcmF0ZSkge1xuICByZXR1cm4gZnVuY3Rpb24gY3JlYXRlQXBwKHJvb3RDb21wb25lbnQsIHJvb3RQcm9wcyA9IG51bGwpIHtcbiAgICBpZiAoIWlzRnVuY3Rpb24ocm9vdENvbXBvbmVudCkpIHtcbiAgICAgIHJvb3RDb21wb25lbnQgPSBleHRlbmQoe30sIHJvb3RDb21wb25lbnQpO1xuICAgIH1cbiAgICBpZiAocm9vdFByb3BzICE9IG51bGwgJiYgIWlzT2JqZWN0KHJvb3RQcm9wcykpIHtcbiAgICAgICEhKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSBcInByb2R1Y3Rpb25cIikgJiYgd2FybiQxKGByb290IHByb3BzIHBhc3NlZCB0byBhcHAubW91bnQoKSBtdXN0IGJlIGFuIG9iamVjdC5gKTtcbiAgICAgIHJvb3RQcm9wcyA9IG51bGw7XG4gICAgfVxuICAgIGNvbnN0IGNvbnRleHQgPSBjcmVhdGVBcHBDb250ZXh0KCk7XG4gICAgY29uc3QgaW5zdGFsbGVkUGx1Z2lucyA9IC8qIEBfX1BVUkVfXyAqLyBuZXcgV2Vha1NldCgpO1xuICAgIGNvbnN0IHBsdWdpbkNsZWFudXBGbnMgPSBbXTtcbiAgICBsZXQgaXNNb3VudGVkID0gZmFsc2U7XG4gICAgY29uc3QgYXBwID0gY29udGV4dC5hcHAgPSB7XG4gICAgICBfdWlkOiB1aWQkMSsrLFxuICAgICAgX2NvbXBvbmVudDogcm9vdENvbXBvbmVudCxcbiAgICAgIF9wcm9wczogcm9vdFByb3BzLFxuICAgICAgX2NvbnRhaW5lcjogbnVsbCxcbiAgICAgIF9jb250ZXh0OiBjb250ZXh0LFxuICAgICAgX2luc3RhbmNlOiBudWxsLFxuICAgICAgdmVyc2lvbixcbiAgICAgIGdldCBjb25maWcoKSB7XG4gICAgICAgIHJldHVybiBjb250ZXh0LmNvbmZpZztcbiAgICAgIH0sXG4gICAgICBzZXQgY29uZmlnKHYpIHtcbiAgICAgICAgaWYgKCEhKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSBcInByb2R1Y3Rpb25cIikpIHtcbiAgICAgICAgICB3YXJuJDEoXG4gICAgICAgICAgICBgYXBwLmNvbmZpZyBjYW5ub3QgYmUgcmVwbGFjZWQuIE1vZGlmeSBpbmRpdmlkdWFsIG9wdGlvbnMgaW5zdGVhZC5gXG4gICAgICAgICAgKTtcbiAgICAgICAgfVxuICAgICAgfSxcbiAgICAgIHVzZShwbHVnaW4sIC4uLm9wdGlvbnMpIHtcbiAgICAgICAgaWYgKGluc3RhbGxlZFBsdWdpbnMuaGFzKHBsdWdpbikpIHtcbiAgICAgICAgICAhIShwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gXCJwcm9kdWN0aW9uXCIpICYmIHdhcm4kMShgUGx1Z2luIGhhcyBhbHJlYWR5IGJlZW4gYXBwbGllZCB0byB0YXJnZXQgYXBwLmApO1xuICAgICAgICB9IGVsc2UgaWYgKHBsdWdpbiAmJiBpc0Z1bmN0aW9uKHBsdWdpbi5pbnN0YWxsKSkge1xuICAgICAgICAgIGluc3RhbGxlZFBsdWdpbnMuYWRkKHBsdWdpbik7XG4gICAgICAgICAgcGx1Z2luLmluc3RhbGwoYXBwLCAuLi5vcHRpb25zKTtcbiAgICAgICAgfSBlbHNlIGlmIChpc0Z1bmN0aW9uKHBsdWdpbikpIHtcbiAgICAgICAgICBpbnN0YWxsZWRQbHVnaW5zLmFkZChwbHVnaW4pO1xuICAgICAgICAgIHBsdWdpbihhcHAsIC4uLm9wdGlvbnMpO1xuICAgICAgICB9IGVsc2UgaWYgKCEhKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSBcInByb2R1Y3Rpb25cIikpIHtcbiAgICAgICAgICB3YXJuJDEoXG4gICAgICAgICAgICBgQSBwbHVnaW4gbXVzdCBlaXRoZXIgYmUgYSBmdW5jdGlvbiBvciBhbiBvYmplY3Qgd2l0aCBhbiBcImluc3RhbGxcIiBmdW5jdGlvbi5gXG4gICAgICAgICAgKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gYXBwO1xuICAgICAgfSxcbiAgICAgIG1peGluKG1peGluKSB7XG4gICAgICAgIGlmIChfX1ZVRV9PUFRJT05TX0FQSV9fKSB7XG4gICAgICAgICAgaWYgKCFjb250ZXh0Lm1peGlucy5pbmNsdWRlcyhtaXhpbikpIHtcbiAgICAgICAgICAgIGNvbnRleHQubWl4aW5zLnB1c2gobWl4aW4pO1xuICAgICAgICAgIH0gZWxzZSBpZiAoISEocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09IFwicHJvZHVjdGlvblwiKSkge1xuICAgICAgICAgICAgd2FybiQxKFxuICAgICAgICAgICAgICBcIk1peGluIGhhcyBhbHJlYWR5IGJlZW4gYXBwbGllZCB0byB0YXJnZXQgYXBwXCIgKyAobWl4aW4ubmFtZSA/IGA6ICR7bWl4aW4ubmFtZX1gIDogXCJcIilcbiAgICAgICAgICAgICk7XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2UgaWYgKCEhKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSBcInByb2R1Y3Rpb25cIikpIHtcbiAgICAgICAgICB3YXJuJDEoXCJNaXhpbnMgYXJlIG9ubHkgYXZhaWxhYmxlIGluIGJ1aWxkcyBzdXBwb3J0aW5nIE9wdGlvbnMgQVBJXCIpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBhcHA7XG4gICAgICB9LFxuICAgICAgY29tcG9uZW50KG5hbWUsIGNvbXBvbmVudCkge1xuICAgICAgICBpZiAoISEocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09IFwicHJvZHVjdGlvblwiKSkge1xuICAgICAgICAgIHZhbGlkYXRlQ29tcG9uZW50TmFtZShuYW1lLCBjb250ZXh0LmNvbmZpZyk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCFjb21wb25lbnQpIHtcbiAgICAgICAgICByZXR1cm4gY29udGV4dC5jb21wb25lbnRzW25hbWVdO1xuICAgICAgICB9XG4gICAgICAgIGlmICghIShwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gXCJwcm9kdWN0aW9uXCIpICYmIGNvbnRleHQuY29tcG9uZW50c1tuYW1lXSkge1xuICAgICAgICAgIHdhcm4kMShgQ29tcG9uZW50IFwiJHtuYW1lfVwiIGhhcyBhbHJlYWR5IGJlZW4gcmVnaXN0ZXJlZCBpbiB0YXJnZXQgYXBwLmApO1xuICAgICAgICB9XG4gICAgICAgIGNvbnRleHQuY29tcG9uZW50c1tuYW1lXSA9IGNvbXBvbmVudDtcbiAgICAgICAgcmV0dXJuIGFwcDtcbiAgICAgIH0sXG4gICAgICBkaXJlY3RpdmUobmFtZSwgZGlyZWN0aXZlKSB7XG4gICAgICAgIGlmICghIShwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gXCJwcm9kdWN0aW9uXCIpKSB7XG4gICAgICAgICAgdmFsaWRhdGVEaXJlY3RpdmVOYW1lKG5hbWUpO1xuICAgICAgICB9XG4gICAgICAgIGlmICghZGlyZWN0aXZlKSB7XG4gICAgICAgICAgcmV0dXJuIGNvbnRleHQuZGlyZWN0aXZlc1tuYW1lXTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoISEocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09IFwicHJvZHVjdGlvblwiKSAmJiBjb250ZXh0LmRpcmVjdGl2ZXNbbmFtZV0pIHtcbiAgICAgICAgICB3YXJuJDEoYERpcmVjdGl2ZSBcIiR7bmFtZX1cIiBoYXMgYWxyZWFkeSBiZWVuIHJlZ2lzdGVyZWQgaW4gdGFyZ2V0IGFwcC5gKTtcbiAgICAgICAgfVxuICAgICAgICBjb250ZXh0LmRpcmVjdGl2ZXNbbmFtZV0gPSBkaXJlY3RpdmU7XG4gICAgICAgIHJldHVybiBhcHA7XG4gICAgICB9LFxuICAgICAgbW91bnQocm9vdENvbnRhaW5lciwgaXNIeWRyYXRlLCBuYW1lc3BhY2UpIHtcbiAgICAgICAgaWYgKCFpc01vdW50ZWQpIHtcbiAgICAgICAgICBpZiAoISEocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09IFwicHJvZHVjdGlvblwiKSAmJiByb290Q29udGFpbmVyLl9fdnVlX2FwcF9fKSB7XG4gICAgICAgICAgICB3YXJuJDEoXG4gICAgICAgICAgICAgIGBUaGVyZSBpcyBhbHJlYWR5IGFuIGFwcCBpbnN0YW5jZSBtb3VudGVkIG9uIHRoZSBob3N0IGNvbnRhaW5lci5cbiBJZiB5b3Ugd2FudCB0byBtb3VudCBhbm90aGVyIGFwcCBvbiB0aGUgc2FtZSBob3N0IGNvbnRhaW5lciwgeW91IG5lZWQgdG8gdW5tb3VudCB0aGUgcHJldmlvdXMgYXBwIGJ5IGNhbGxpbmcgXFxgYXBwLnVubW91bnQoKVxcYCBmaXJzdC5gXG4gICAgICAgICAgICApO1xuICAgICAgICAgIH1cbiAgICAgICAgICBjb25zdCB2bm9kZSA9IGFwcC5fY2VWTm9kZSB8fCBjcmVhdGVWTm9kZShyb290Q29tcG9uZW50LCByb290UHJvcHMpO1xuICAgICAgICAgIHZub2RlLmFwcENvbnRleHQgPSBjb250ZXh0O1xuICAgICAgICAgIGlmIChuYW1lc3BhY2UgPT09IHRydWUpIHtcbiAgICAgICAgICAgIG5hbWVzcGFjZSA9IFwic3ZnXCI7XG4gICAgICAgICAgfSBlbHNlIGlmIChuYW1lc3BhY2UgPT09IGZhbHNlKSB7XG4gICAgICAgICAgICBuYW1lc3BhY2UgPSB2b2lkIDA7XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmICghIShwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gXCJwcm9kdWN0aW9uXCIpKSB7XG4gICAgICAgICAgICBjb250ZXh0LnJlbG9hZCA9ICgpID0+IHtcbiAgICAgICAgICAgICAgY29uc3QgY2xvbmVkID0gY2xvbmVWTm9kZSh2bm9kZSk7XG4gICAgICAgICAgICAgIGNsb25lZC5lbCA9IG51bGw7XG4gICAgICAgICAgICAgIHJlbmRlcihjbG9uZWQsIHJvb3RDb250YWluZXIsIG5hbWVzcGFjZSk7XG4gICAgICAgICAgICB9O1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAoaXNIeWRyYXRlICYmIGh5ZHJhdGUpIHtcbiAgICAgICAgICAgIGh5ZHJhdGUodm5vZGUsIHJvb3RDb250YWluZXIpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZW5kZXIodm5vZGUsIHJvb3RDb250YWluZXIsIG5hbWVzcGFjZSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGlzTW91bnRlZCA9IHRydWU7XG4gICAgICAgICAgYXBwLl9jb250YWluZXIgPSByb290Q29udGFpbmVyO1xuICAgICAgICAgIHJvb3RDb250YWluZXIuX192dWVfYXBwX18gPSBhcHA7XG4gICAgICAgICAgaWYgKCEhKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSBcInByb2R1Y3Rpb25cIikgfHwgX19WVUVfUFJPRF9ERVZUT09MU19fKSB7XG4gICAgICAgICAgICBhcHAuX2luc3RhbmNlID0gdm5vZGUuY29tcG9uZW50O1xuICAgICAgICAgICAgZGV2dG9vbHNJbml0QXBwKGFwcCwgdmVyc2lvbik7XG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiBnZXRDb21wb25lbnRQdWJsaWNJbnN0YW5jZSh2bm9kZS5jb21wb25lbnQpO1xuICAgICAgICB9IGVsc2UgaWYgKCEhKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSBcInByb2R1Y3Rpb25cIikpIHtcbiAgICAgICAgICB3YXJuJDEoXG4gICAgICAgICAgICBgQXBwIGhhcyBhbHJlYWR5IGJlZW4gbW91bnRlZC5cbklmIHlvdSB3YW50IHRvIHJlbW91bnQgdGhlIHNhbWUgYXBwLCBtb3ZlIHlvdXIgYXBwIGNyZWF0aW9uIGxvZ2ljIGludG8gYSBmYWN0b3J5IGZ1bmN0aW9uIGFuZCBjcmVhdGUgZnJlc2ggYXBwIGluc3RhbmNlcyBmb3IgZWFjaCBtb3VudCAtIGUuZy4gXFxgY29uc3QgY3JlYXRlTXlBcHAgPSAoKSA9PiBjcmVhdGVBcHAoQXBwKVxcYGBcbiAgICAgICAgICApO1xuICAgICAgICB9XG4gICAgICB9LFxuICAgICAgb25Vbm1vdW50KGNsZWFudXBGbikge1xuICAgICAgICBpZiAoISEocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09IFwicHJvZHVjdGlvblwiKSAmJiB0eXBlb2YgY2xlYW51cEZuICE9PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgICB3YXJuJDEoXG4gICAgICAgICAgICBgRXhwZWN0ZWQgZnVuY3Rpb24gYXMgZmlyc3QgYXJndW1lbnQgdG8gYXBwLm9uVW5tb3VudCgpLCBidXQgZ290ICR7dHlwZW9mIGNsZWFudXBGbn1gXG4gICAgICAgICAgKTtcbiAgICAgICAgfVxuICAgICAgICBwbHVnaW5DbGVhbnVwRm5zLnB1c2goY2xlYW51cEZuKTtcbiAgICAgIH0sXG4gICAgICB1bm1vdW50KCkge1xuICAgICAgICBpZiAoaXNNb3VudGVkKSB7XG4gICAgICAgICAgY2FsbFdpdGhBc3luY0Vycm9ySGFuZGxpbmcoXG4gICAgICAgICAgICBwbHVnaW5DbGVhbnVwRm5zLFxuICAgICAgICAgICAgYXBwLl9pbnN0YW5jZSxcbiAgICAgICAgICAgIDE2XG4gICAgICAgICAgKTtcbiAgICAgICAgICByZW5kZXIobnVsbCwgYXBwLl9jb250YWluZXIpO1xuICAgICAgICAgIGlmICghIShwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gXCJwcm9kdWN0aW9uXCIpIHx8IF9fVlVFX1BST0RfREVWVE9PTFNfXykge1xuICAgICAgICAgICAgYXBwLl9pbnN0YW5jZSA9IG51bGw7XG4gICAgICAgICAgICBkZXZ0b29sc1VubW91bnRBcHAoYXBwKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgZGVsZXRlIGFwcC5fY29udGFpbmVyLl9fdnVlX2FwcF9fO1xuICAgICAgICB9IGVsc2UgaWYgKCEhKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSBcInByb2R1Y3Rpb25cIikpIHtcbiAgICAgICAgICB3YXJuJDEoYENhbm5vdCB1bm1vdW50IGFuIGFwcCB0aGF0IGlzIG5vdCBtb3VudGVkLmApO1xuICAgICAgICB9XG4gICAgICB9LFxuICAgICAgcHJvdmlkZShrZXksIHZhbHVlKSB7XG4gICAgICAgIGlmICghIShwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gXCJwcm9kdWN0aW9uXCIpICYmIGtleSBpbiBjb250ZXh0LnByb3ZpZGVzKSB7XG4gICAgICAgICAgaWYgKGhhc093bihjb250ZXh0LnByb3ZpZGVzLCBrZXkpKSB7XG4gICAgICAgICAgICB3YXJuJDEoXG4gICAgICAgICAgICAgIGBBcHAgYWxyZWFkeSBwcm92aWRlcyBwcm9wZXJ0eSB3aXRoIGtleSBcIiR7U3RyaW5nKGtleSl9XCIuIEl0IHdpbGwgYmUgb3ZlcndyaXR0ZW4gd2l0aCB0aGUgbmV3IHZhbHVlLmBcbiAgICAgICAgICAgICk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHdhcm4kMShcbiAgICAgICAgICAgICAgYEFwcCBhbHJlYWR5IHByb3ZpZGVzIHByb3BlcnR5IHdpdGgga2V5IFwiJHtTdHJpbmcoa2V5KX1cIiBpbmhlcml0ZWQgZnJvbSBpdHMgcGFyZW50IGVsZW1lbnQuIEl0IHdpbGwgYmUgb3ZlcndyaXR0ZW4gd2l0aCB0aGUgbmV3IHZhbHVlLmBcbiAgICAgICAgICAgICk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGNvbnRleHQucHJvdmlkZXNba2V5XSA9IHZhbHVlO1xuICAgICAgICByZXR1cm4gYXBwO1xuICAgICAgfSxcbiAgICAgIHJ1bldpdGhDb250ZXh0KGZuKSB7XG4gICAgICAgIGNvbnN0IGxhc3RBcHAgPSBjdXJyZW50QXBwO1xuICAgICAgICBjdXJyZW50QXBwID0gYXBwO1xuICAgICAgICB0cnkge1xuICAgICAgICAgIHJldHVybiBmbigpO1xuICAgICAgICB9IGZpbmFsbHkge1xuICAgICAgICAgIGN1cnJlbnRBcHAgPSBsYXN0QXBwO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfTtcbiAgICByZXR1cm4gYXBwO1xuICB9O1xufVxubGV0IGN1cnJlbnRBcHAgPSBudWxsO1xuXG5mdW5jdGlvbiB1c2VNb2RlbChwcm9wcywgbmFtZSwgb3B0aW9ucyA9IEVNUFRZX09CSikge1xuICBjb25zdCBpID0gZ2V0Q3VycmVudEluc3RhbmNlKCk7XG4gIGlmICghIShwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gXCJwcm9kdWN0aW9uXCIpICYmICFpKSB7XG4gICAgd2FybiQxKGB1c2VNb2RlbCgpIGNhbGxlZCB3aXRob3V0IGFjdGl2ZSBpbnN0YW5jZS5gKTtcbiAgICByZXR1cm4gcmVmKCk7XG4gIH1cbiAgY29uc3QgY2FtZWxpemVkTmFtZSA9IGNhbWVsaXplKG5hbWUpO1xuICBpZiAoISEocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09IFwicHJvZHVjdGlvblwiKSAmJiAhaS5wcm9wc09wdGlvbnNbMF1bY2FtZWxpemVkTmFtZV0pIHtcbiAgICB3YXJuJDEoYHVzZU1vZGVsKCkgY2FsbGVkIHdpdGggcHJvcCBcIiR7bmFtZX1cIiB3aGljaCBpcyBub3QgZGVjbGFyZWQuYCk7XG4gICAgcmV0dXJuIHJlZigpO1xuICB9XG4gIGNvbnN0IGh5cGhlbmF0ZWROYW1lID0gaHlwaGVuYXRlKG5hbWUpO1xuICBjb25zdCBtb2RpZmllcnMgPSBnZXRNb2RlbE1vZGlmaWVycyhwcm9wcywgY2FtZWxpemVkTmFtZSk7XG4gIGNvbnN0IHJlcyA9IGN1c3RvbVJlZigodHJhY2ssIHRyaWdnZXIpID0+IHtcbiAgICBsZXQgbG9jYWxWYWx1ZTtcbiAgICBsZXQgcHJldlNldFZhbHVlID0gRU1QVFlfT0JKO1xuICAgIGxldCBwcmV2RW1pdHRlZFZhbHVlO1xuICAgIHdhdGNoU3luY0VmZmVjdCgoKSA9PiB7XG4gICAgICBjb25zdCBwcm9wVmFsdWUgPSBwcm9wc1tjYW1lbGl6ZWROYW1lXTtcbiAgICAgIGlmIChoYXNDaGFuZ2VkKGxvY2FsVmFsdWUsIHByb3BWYWx1ZSkpIHtcbiAgICAgICAgbG9jYWxWYWx1ZSA9IHByb3BWYWx1ZTtcbiAgICAgICAgdHJpZ2dlcigpO1xuICAgICAgfVxuICAgIH0pO1xuICAgIHJldHVybiB7XG4gICAgICBnZXQoKSB7XG4gICAgICAgIHRyYWNrKCk7XG4gICAgICAgIHJldHVybiBvcHRpb25zLmdldCA/IG9wdGlvbnMuZ2V0KGxvY2FsVmFsdWUpIDogbG9jYWxWYWx1ZTtcbiAgICAgIH0sXG4gICAgICBzZXQodmFsdWUpIHtcbiAgICAgICAgY29uc3QgZW1pdHRlZFZhbHVlID0gb3B0aW9ucy5zZXQgPyBvcHRpb25zLnNldCh2YWx1ZSkgOiB2YWx1ZTtcbiAgICAgICAgaWYgKCFoYXNDaGFuZ2VkKGVtaXR0ZWRWYWx1ZSwgbG9jYWxWYWx1ZSkgJiYgIShwcmV2U2V0VmFsdWUgIT09IEVNUFRZX09CSiAmJiBoYXNDaGFuZ2VkKHZhbHVlLCBwcmV2U2V0VmFsdWUpKSkge1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCByYXdQcm9wcyA9IGkudm5vZGUucHJvcHM7XG4gICAgICAgIGlmICghKHJhd1Byb3BzICYmIC8vIGNoZWNrIGlmIHBhcmVudCBoYXMgcGFzc2VkIHYtbW9kZWxcbiAgICAgICAgKG5hbWUgaW4gcmF3UHJvcHMgfHwgY2FtZWxpemVkTmFtZSBpbiByYXdQcm9wcyB8fCBoeXBoZW5hdGVkTmFtZSBpbiByYXdQcm9wcykgJiYgKGBvblVwZGF0ZToke25hbWV9YCBpbiByYXdQcm9wcyB8fCBgb25VcGRhdGU6JHtjYW1lbGl6ZWROYW1lfWAgaW4gcmF3UHJvcHMgfHwgYG9uVXBkYXRlOiR7aHlwaGVuYXRlZE5hbWV9YCBpbiByYXdQcm9wcykpKSB7XG4gICAgICAgICAgbG9jYWxWYWx1ZSA9IHZhbHVlO1xuICAgICAgICAgIHRyaWdnZXIoKTtcbiAgICAgICAgfVxuICAgICAgICBpLmVtaXQoYHVwZGF0ZToke25hbWV9YCwgZW1pdHRlZFZhbHVlKTtcbiAgICAgICAgaWYgKGhhc0NoYW5nZWQodmFsdWUsIGVtaXR0ZWRWYWx1ZSkgJiYgaGFzQ2hhbmdlZCh2YWx1ZSwgcHJldlNldFZhbHVlKSAmJiAhaGFzQ2hhbmdlZChlbWl0dGVkVmFsdWUsIHByZXZFbWl0dGVkVmFsdWUpKSB7XG4gICAgICAgICAgdHJpZ2dlcigpO1xuICAgICAgICB9XG4gICAgICAgIHByZXZTZXRWYWx1ZSA9IHZhbHVlO1xuICAgICAgICBwcmV2RW1pdHRlZFZhbHVlID0gZW1pdHRlZFZhbHVlO1xuICAgICAgfVxuICAgIH07XG4gIH0pO1xuICByZXNbU3ltYm9sLml0ZXJhdG9yXSA9ICgpID0+IHtcbiAgICBsZXQgaTIgPSAwO1xuICAgIHJldHVybiB7XG4gICAgICBuZXh0KCkge1xuICAgICAgICBpZiAoaTIgPCAyKSB7XG4gICAgICAgICAgcmV0dXJuIHsgdmFsdWU6IGkyKysgPyBtb2RpZmllcnMgfHwgRU1QVFlfT0JKIDogcmVzLCBkb25lOiBmYWxzZSB9O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJldHVybiB7IGRvbmU6IHRydWUgfTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH07XG4gIH07XG4gIHJldHVybiByZXM7XG59XG5jb25zdCBnZXRNb2RlbE1vZGlmaWVycyA9IChwcm9wcywgbW9kZWxOYW1lKSA9PiB7XG4gIHJldHVybiBtb2RlbE5hbWUgPT09IFwibW9kZWxWYWx1ZVwiIHx8IG1vZGVsTmFtZSA9PT0gXCJtb2RlbC12YWx1ZVwiID8gcHJvcHMubW9kZWxNb2RpZmllcnMgOiBwcm9wc1tgJHttb2RlbE5hbWV9TW9kaWZpZXJzYF0gfHwgcHJvcHNbYCR7Y2FtZWxpemUobW9kZWxOYW1lKX1Nb2RpZmllcnNgXSB8fCBwcm9wc1tgJHtoeXBoZW5hdGUobW9kZWxOYW1lKX1Nb2RpZmllcnNgXTtcbn07XG5cbmZ1bmN0aW9uIGVtaXQoaW5zdGFuY2UsIGV2ZW50LCAuLi5yYXdBcmdzKSB7XG4gIGlmIChpbnN0YW5jZS5pc1VubW91bnRlZCkgcmV0dXJuO1xuICBjb25zdCBwcm9wcyA9IGluc3RhbmNlLnZub2RlLnByb3BzIHx8IEVNUFRZX09CSjtcbiAgaWYgKCEhKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSBcInByb2R1Y3Rpb25cIikpIHtcbiAgICBjb25zdCB7XG4gICAgICBlbWl0c09wdGlvbnMsXG4gICAgICBwcm9wc09wdGlvbnM6IFtwcm9wc09wdGlvbnNdXG4gICAgfSA9IGluc3RhbmNlO1xuICAgIGlmIChlbWl0c09wdGlvbnMpIHtcbiAgICAgIGlmICghKGV2ZW50IGluIGVtaXRzT3B0aW9ucykgJiYgdHJ1ZSkge1xuICAgICAgICBpZiAoIXByb3BzT3B0aW9ucyB8fCAhKHRvSGFuZGxlcktleShjYW1lbGl6ZShldmVudCkpIGluIHByb3BzT3B0aW9ucykpIHtcbiAgICAgICAgICB3YXJuJDEoXG4gICAgICAgICAgICBgQ29tcG9uZW50IGVtaXR0ZWQgZXZlbnQgXCIke2V2ZW50fVwiIGJ1dCBpdCBpcyBuZWl0aGVyIGRlY2xhcmVkIGluIHRoZSBlbWl0cyBvcHRpb24gbm9yIGFzIGFuIFwiJHt0b0hhbmRsZXJLZXkoY2FtZWxpemUoZXZlbnQpKX1cIiBwcm9wLmBcbiAgICAgICAgICApO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjb25zdCB2YWxpZGF0b3IgPSBlbWl0c09wdGlvbnNbZXZlbnRdO1xuICAgICAgICBpZiAoaXNGdW5jdGlvbih2YWxpZGF0b3IpKSB7XG4gICAgICAgICAgY29uc3QgaXNWYWxpZCA9IHZhbGlkYXRvciguLi5yYXdBcmdzKTtcbiAgICAgICAgICBpZiAoIWlzVmFsaWQpIHtcbiAgICAgICAgICAgIHdhcm4kMShcbiAgICAgICAgICAgICAgYEludmFsaWQgZXZlbnQgYXJndW1lbnRzOiBldmVudCB2YWxpZGF0aW9uIGZhaWxlZCBmb3IgZXZlbnQgXCIke2V2ZW50fVwiLmBcbiAgICAgICAgICAgICk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG4gIGxldCBhcmdzID0gcmF3QXJncztcbiAgY29uc3QgaXNNb2RlbExpc3RlbmVyID0gZXZlbnQuc3RhcnRzV2l0aChcInVwZGF0ZTpcIik7XG4gIGNvbnN0IG1vZGlmaWVycyA9IGlzTW9kZWxMaXN0ZW5lciAmJiBnZXRNb2RlbE1vZGlmaWVycyhwcm9wcywgZXZlbnQuc2xpY2UoNykpO1xuICBpZiAobW9kaWZpZXJzKSB7XG4gICAgaWYgKG1vZGlmaWVycy50cmltKSB7XG4gICAgICBhcmdzID0gcmF3QXJncy5tYXAoKGEpID0+IGlzU3RyaW5nKGEpID8gYS50cmltKCkgOiBhKTtcbiAgICB9XG4gICAgaWYgKG1vZGlmaWVycy5udW1iZXIpIHtcbiAgICAgIGFyZ3MgPSByYXdBcmdzLm1hcChsb29zZVRvTnVtYmVyKTtcbiAgICB9XG4gIH1cbiAgaWYgKCEhKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSBcInByb2R1Y3Rpb25cIikgfHwgX19WVUVfUFJPRF9ERVZUT09MU19fKSB7XG4gICAgZGV2dG9vbHNDb21wb25lbnRFbWl0KGluc3RhbmNlLCBldmVudCwgYXJncyk7XG4gIH1cbiAgaWYgKCEhKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSBcInByb2R1Y3Rpb25cIikpIHtcbiAgICBjb25zdCBsb3dlckNhc2VFdmVudCA9IGV2ZW50LnRvTG93ZXJDYXNlKCk7XG4gICAgaWYgKGxvd2VyQ2FzZUV2ZW50ICE9PSBldmVudCAmJiBwcm9wc1t0b0hhbmRsZXJLZXkobG93ZXJDYXNlRXZlbnQpXSkge1xuICAgICAgd2FybiQxKFxuICAgICAgICBgRXZlbnQgXCIke2xvd2VyQ2FzZUV2ZW50fVwiIGlzIGVtaXR0ZWQgaW4gY29tcG9uZW50ICR7Zm9ybWF0Q29tcG9uZW50TmFtZShcbiAgICAgICAgICBpbnN0YW5jZSxcbiAgICAgICAgICBpbnN0YW5jZS50eXBlXG4gICAgICAgICl9IGJ1dCB0aGUgaGFuZGxlciBpcyByZWdpc3RlcmVkIGZvciBcIiR7ZXZlbnR9XCIuIE5vdGUgdGhhdCBIVE1MIGF0dHJpYnV0ZXMgYXJlIGNhc2UtaW5zZW5zaXRpdmUgYW5kIHlvdSBjYW5ub3QgdXNlIHYtb24gdG8gbGlzdGVuIHRvIGNhbWVsQ2FzZSBldmVudHMgd2hlbiB1c2luZyBpbi1ET00gdGVtcGxhdGVzLiBZb3Ugc2hvdWxkIHByb2JhYmx5IHVzZSBcIiR7aHlwaGVuYXRlKFxuICAgICAgICAgIGV2ZW50XG4gICAgICAgICl9XCIgaW5zdGVhZCBvZiBcIiR7ZXZlbnR9XCIuYFxuICAgICAgKTtcbiAgICB9XG4gIH1cbiAgbGV0IGhhbmRsZXJOYW1lO1xuICBsZXQgaGFuZGxlciA9IHByb3BzW2hhbmRsZXJOYW1lID0gdG9IYW5kbGVyS2V5KGV2ZW50KV0gfHwgLy8gYWxzbyB0cnkgY2FtZWxDYXNlIGV2ZW50IGhhbmRsZXIgKCMyMjQ5KVxuICBwcm9wc1toYW5kbGVyTmFtZSA9IHRvSGFuZGxlcktleShjYW1lbGl6ZShldmVudCkpXTtcbiAgaWYgKCFoYW5kbGVyICYmIGlzTW9kZWxMaXN0ZW5lcikge1xuICAgIGhhbmRsZXIgPSBwcm9wc1toYW5kbGVyTmFtZSA9IHRvSGFuZGxlcktleShoeXBoZW5hdGUoZXZlbnQpKV07XG4gIH1cbiAgaWYgKGhhbmRsZXIpIHtcbiAgICBjYWxsV2l0aEFzeW5jRXJyb3JIYW5kbGluZyhcbiAgICAgIGhhbmRsZXIsXG4gICAgICBpbnN0YW5jZSxcbiAgICAgIDYsXG4gICAgICBhcmdzXG4gICAgKTtcbiAgfVxuICBjb25zdCBvbmNlSGFuZGxlciA9IHByb3BzW2hhbmRsZXJOYW1lICsgYE9uY2VgXTtcbiAgaWYgKG9uY2VIYW5kbGVyKSB7XG4gICAgaWYgKCFpbnN0YW5jZS5lbWl0dGVkKSB7XG4gICAgICBpbnN0YW5jZS5lbWl0dGVkID0ge307XG4gICAgfSBlbHNlIGlmIChpbnN0YW5jZS5lbWl0dGVkW2hhbmRsZXJOYW1lXSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBpbnN0YW5jZS5lbWl0dGVkW2hhbmRsZXJOYW1lXSA9IHRydWU7XG4gICAgY2FsbFdpdGhBc3luY0Vycm9ySGFuZGxpbmcoXG4gICAgICBvbmNlSGFuZGxlcixcbiAgICAgIGluc3RhbmNlLFxuICAgICAgNixcbiAgICAgIGFyZ3NcbiAgICApO1xuICB9XG59XG5jb25zdCBtaXhpbkVtaXRzQ2FjaGUgPSAvKiBAX19QVVJFX18gKi8gbmV3IFdlYWtNYXAoKTtcbmZ1bmN0aW9uIG5vcm1hbGl6ZUVtaXRzT3B0aW9ucyhjb21wLCBhcHBDb250ZXh0LCBhc01peGluID0gZmFsc2UpIHtcbiAgY29uc3QgY2FjaGUgPSBfX1ZVRV9PUFRJT05TX0FQSV9fICYmIGFzTWl4aW4gPyBtaXhpbkVtaXRzQ2FjaGUgOiBhcHBDb250ZXh0LmVtaXRzQ2FjaGU7XG4gIGNvbnN0IGNhY2hlZCA9IGNhY2hlLmdldChjb21wKTtcbiAgaWYgKGNhY2hlZCAhPT0gdm9pZCAwKSB7XG4gICAgcmV0dXJuIGNhY2hlZDtcbiAgfVxuICBjb25zdCByYXcgPSBjb21wLmVtaXRzO1xuICBsZXQgbm9ybWFsaXplZCA9IHt9O1xuICBsZXQgaGFzRXh0ZW5kcyA9IGZhbHNlO1xuICBpZiAoX19WVUVfT1BUSU9OU19BUElfXyAmJiAhaXNGdW5jdGlvbihjb21wKSkge1xuICAgIGNvbnN0IGV4dGVuZEVtaXRzID0gKHJhdzIpID0+IHtcbiAgICAgIGNvbnN0IG5vcm1hbGl6ZWRGcm9tRXh0ZW5kID0gbm9ybWFsaXplRW1pdHNPcHRpb25zKHJhdzIsIGFwcENvbnRleHQsIHRydWUpO1xuICAgICAgaWYgKG5vcm1hbGl6ZWRGcm9tRXh0ZW5kKSB7XG4gICAgICAgIGhhc0V4dGVuZHMgPSB0cnVlO1xuICAgICAgICBleHRlbmQobm9ybWFsaXplZCwgbm9ybWFsaXplZEZyb21FeHRlbmQpO1xuICAgICAgfVxuICAgIH07XG4gICAgaWYgKCFhc01peGluICYmIGFwcENvbnRleHQubWl4aW5zLmxlbmd0aCkge1xuICAgICAgYXBwQ29udGV4dC5taXhpbnMuZm9yRWFjaChleHRlbmRFbWl0cyk7XG4gICAgfVxuICAgIGlmIChjb21wLmV4dGVuZHMpIHtcbiAgICAgIGV4dGVuZEVtaXRzKGNvbXAuZXh0ZW5kcyk7XG4gICAgfVxuICAgIGlmIChjb21wLm1peGlucykge1xuICAgICAgY29tcC5taXhpbnMuZm9yRWFjaChleHRlbmRFbWl0cyk7XG4gICAgfVxuICB9XG4gIGlmICghcmF3ICYmICFoYXNFeHRlbmRzKSB7XG4gICAgaWYgKGlzT2JqZWN0KGNvbXApKSB7XG4gICAgICBjYWNoZS5zZXQoY29tcCwgbnVsbCk7XG4gICAgfVxuICAgIHJldHVybiBudWxsO1xuICB9XG4gIGlmIChpc0FycmF5KHJhdykpIHtcbiAgICByYXcuZm9yRWFjaCgoa2V5KSA9PiBub3JtYWxpemVkW2tleV0gPSBudWxsKTtcbiAgfSBlbHNlIHtcbiAgICBleHRlbmQobm9ybWFsaXplZCwgcmF3KTtcbiAgfVxuICBpZiAoaXNPYmplY3QoY29tcCkpIHtcbiAgICBjYWNoZS5zZXQoY29tcCwgbm9ybWFsaXplZCk7XG4gIH1cbiAgcmV0dXJuIG5vcm1hbGl6ZWQ7XG59XG5mdW5jdGlvbiBpc0VtaXRMaXN0ZW5lcihvcHRpb25zLCBrZXkpIHtcbiAgaWYgKCFvcHRpb25zIHx8ICFpc09uKGtleSkpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbiAga2V5ID0ga2V5LnNsaWNlKDIpLnJlcGxhY2UoL09uY2UkLywgXCJcIik7XG4gIHJldHVybiBoYXNPd24ob3B0aW9ucywga2V5WzBdLnRvTG93ZXJDYXNlKCkgKyBrZXkuc2xpY2UoMSkpIHx8IGhhc093bihvcHRpb25zLCBoeXBoZW5hdGUoa2V5KSkgfHwgaGFzT3duKG9wdGlvbnMsIGtleSk7XG59XG5cbmxldCBhY2Nlc3NlZEF0dHJzID0gZmFsc2U7XG5mdW5jdGlvbiBtYXJrQXR0cnNBY2Nlc3NlZCgpIHtcbiAgYWNjZXNzZWRBdHRycyA9IHRydWU7XG59XG5mdW5jdGlvbiByZW5kZXJDb21wb25lbnRSb290KGluc3RhbmNlKSB7XG4gIGNvbnN0IHtcbiAgICB0eXBlOiBDb21wb25lbnQsXG4gICAgdm5vZGUsXG4gICAgcHJveHksXG4gICAgd2l0aFByb3h5LFxuICAgIHByb3BzT3B0aW9uczogW3Byb3BzT3B0aW9uc10sXG4gICAgc2xvdHMsXG4gICAgYXR0cnMsXG4gICAgZW1pdCxcbiAgICByZW5kZXIsXG4gICAgcmVuZGVyQ2FjaGUsXG4gICAgcHJvcHMsXG4gICAgZGF0YSxcbiAgICBzZXR1cFN0YXRlLFxuICAgIGN0eCxcbiAgICBpbmhlcml0QXR0cnNcbiAgfSA9IGluc3RhbmNlO1xuICBjb25zdCBwcmV2ID0gc2V0Q3VycmVudFJlbmRlcmluZ0luc3RhbmNlKGluc3RhbmNlKTtcbiAgbGV0IHJlc3VsdDtcbiAgbGV0IGZhbGx0aHJvdWdoQXR0cnM7XG4gIGlmICghIShwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gXCJwcm9kdWN0aW9uXCIpKSB7XG4gICAgYWNjZXNzZWRBdHRycyA9IGZhbHNlO1xuICB9XG4gIHRyeSB7XG4gICAgaWYgKHZub2RlLnNoYXBlRmxhZyAmIDQpIHtcbiAgICAgIGNvbnN0IHByb3h5VG9Vc2UgPSB3aXRoUHJveHkgfHwgcHJveHk7XG4gICAgICBjb25zdCB0aGlzUHJveHkgPSAhIShwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gXCJwcm9kdWN0aW9uXCIpICYmIHNldHVwU3RhdGUuX19pc1NjcmlwdFNldHVwID8gbmV3IFByb3h5KHByb3h5VG9Vc2UsIHtcbiAgICAgICAgZ2V0KHRhcmdldCwga2V5LCByZWNlaXZlcikge1xuICAgICAgICAgIHdhcm4kMShcbiAgICAgICAgICAgIGBQcm9wZXJ0eSAnJHtTdHJpbmcoXG4gICAgICAgICAgICAgIGtleVxuICAgICAgICAgICAgKX0nIHdhcyBhY2Nlc3NlZCB2aWEgJ3RoaXMnLiBBdm9pZCB1c2luZyAndGhpcycgaW4gdGVtcGxhdGVzLmBcbiAgICAgICAgICApO1xuICAgICAgICAgIHJldHVybiBSZWZsZWN0LmdldCh0YXJnZXQsIGtleSwgcmVjZWl2ZXIpO1xuICAgICAgICB9XG4gICAgICB9KSA6IHByb3h5VG9Vc2U7XG4gICAgICByZXN1bHQgPSBub3JtYWxpemVWTm9kZShcbiAgICAgICAgcmVuZGVyLmNhbGwoXG4gICAgICAgICAgdGhpc1Byb3h5LFxuICAgICAgICAgIHByb3h5VG9Vc2UsXG4gICAgICAgICAgcmVuZGVyQ2FjaGUsXG4gICAgICAgICAgISEocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09IFwicHJvZHVjdGlvblwiKSA/IHNoYWxsb3dSZWFkb25seShwcm9wcykgOiBwcm9wcyxcbiAgICAgICAgICBzZXR1cFN0YXRlLFxuICAgICAgICAgIGRhdGEsXG4gICAgICAgICAgY3R4XG4gICAgICAgIClcbiAgICAgICk7XG4gICAgICBmYWxsdGhyb3VnaEF0dHJzID0gYXR0cnM7XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnN0IHJlbmRlcjIgPSBDb21wb25lbnQ7XG4gICAgICBpZiAoISEocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09IFwicHJvZHVjdGlvblwiKSAmJiBhdHRycyA9PT0gcHJvcHMpIHtcbiAgICAgICAgbWFya0F0dHJzQWNjZXNzZWQoKTtcbiAgICAgIH1cbiAgICAgIHJlc3VsdCA9IG5vcm1hbGl6ZVZOb2RlKFxuICAgICAgICByZW5kZXIyLmxlbmd0aCA+IDEgPyByZW5kZXIyKFxuICAgICAgICAgICEhKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSBcInByb2R1Y3Rpb25cIikgPyBzaGFsbG93UmVhZG9ubHkocHJvcHMpIDogcHJvcHMsXG4gICAgICAgICAgISEocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09IFwicHJvZHVjdGlvblwiKSA/IHtcbiAgICAgICAgICAgIGdldCBhdHRycygpIHtcbiAgICAgICAgICAgICAgbWFya0F0dHJzQWNjZXNzZWQoKTtcbiAgICAgICAgICAgICAgcmV0dXJuIHNoYWxsb3dSZWFkb25seShhdHRycyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgc2xvdHMsXG4gICAgICAgICAgICBlbWl0XG4gICAgICAgICAgfSA6IHsgYXR0cnMsIHNsb3RzLCBlbWl0IH1cbiAgICAgICAgKSA6IHJlbmRlcjIoXG4gICAgICAgICAgISEocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09IFwicHJvZHVjdGlvblwiKSA/IHNoYWxsb3dSZWFkb25seShwcm9wcykgOiBwcm9wcyxcbiAgICAgICAgICBudWxsXG4gICAgICAgIClcbiAgICAgICk7XG4gICAgICBmYWxsdGhyb3VnaEF0dHJzID0gQ29tcG9uZW50LnByb3BzID8gYXR0cnMgOiBnZXRGdW5jdGlvbmFsRmFsbHRocm91Z2goYXR0cnMpO1xuICAgIH1cbiAgfSBjYXRjaCAoZXJyKSB7XG4gICAgYmxvY2tTdGFjay5sZW5ndGggPSAwO1xuICAgIGhhbmRsZUVycm9yKGVyciwgaW5zdGFuY2UsIDEpO1xuICAgIHJlc3VsdCA9IGNyZWF0ZVZOb2RlKENvbW1lbnQpO1xuICB9XG4gIGxldCByb290ID0gcmVzdWx0O1xuICBsZXQgc2V0Um9vdCA9IHZvaWQgMDtcbiAgaWYgKCEhKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSBcInByb2R1Y3Rpb25cIikgJiYgcmVzdWx0LnBhdGNoRmxhZyA+IDAgJiYgcmVzdWx0LnBhdGNoRmxhZyAmIDIwNDgpIHtcbiAgICBbcm9vdCwgc2V0Um9vdF0gPSBnZXRDaGlsZFJvb3QocmVzdWx0KTtcbiAgfVxuICBpZiAoZmFsbHRocm91Z2hBdHRycyAmJiBpbmhlcml0QXR0cnMgIT09IGZhbHNlKSB7XG4gICAgY29uc3Qga2V5cyA9IE9iamVjdC5rZXlzKGZhbGx0aHJvdWdoQXR0cnMpO1xuICAgIGNvbnN0IHsgc2hhcGVGbGFnIH0gPSByb290O1xuICAgIGlmIChrZXlzLmxlbmd0aCkge1xuICAgICAgaWYgKHNoYXBlRmxhZyAmICgxIHwgNikpIHtcbiAgICAgICAgaWYgKHByb3BzT3B0aW9ucyAmJiBrZXlzLnNvbWUoaXNNb2RlbExpc3RlbmVyKSkge1xuICAgICAgICAgIGZhbGx0aHJvdWdoQXR0cnMgPSBmaWx0ZXJNb2RlbExpc3RlbmVycyhcbiAgICAgICAgICAgIGZhbGx0aHJvdWdoQXR0cnMsXG4gICAgICAgICAgICBwcm9wc09wdGlvbnNcbiAgICAgICAgICApO1xuICAgICAgICB9XG4gICAgICAgIHJvb3QgPSBjbG9uZVZOb2RlKHJvb3QsIGZhbGx0aHJvdWdoQXR0cnMsIGZhbHNlLCB0cnVlKTtcbiAgICAgIH0gZWxzZSBpZiAoISEocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09IFwicHJvZHVjdGlvblwiKSAmJiAhYWNjZXNzZWRBdHRycyAmJiByb290LnR5cGUgIT09IENvbW1lbnQpIHtcbiAgICAgICAgY29uc3QgYWxsQXR0cnMgPSBPYmplY3Qua2V5cyhhdHRycyk7XG4gICAgICAgIGNvbnN0IGV2ZW50QXR0cnMgPSBbXTtcbiAgICAgICAgY29uc3QgZXh0cmFBdHRycyA9IFtdO1xuICAgICAgICBmb3IgKGxldCBpID0gMCwgbCA9IGFsbEF0dHJzLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgICAgICAgIGNvbnN0IGtleSA9IGFsbEF0dHJzW2ldO1xuICAgICAgICAgIGlmIChpc09uKGtleSkpIHtcbiAgICAgICAgICAgIGlmICghaXNNb2RlbExpc3RlbmVyKGtleSkpIHtcbiAgICAgICAgICAgICAgZXZlbnRBdHRycy5wdXNoKGtleVsyXS50b0xvd2VyQ2FzZSgpICsga2V5LnNsaWNlKDMpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZXh0cmFBdHRycy5wdXNoKGtleSk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmIChleHRyYUF0dHJzLmxlbmd0aCkge1xuICAgICAgICAgIHdhcm4kMShcbiAgICAgICAgICAgIGBFeHRyYW5lb3VzIG5vbi1wcm9wcyBhdHRyaWJ1dGVzICgke2V4dHJhQXR0cnMuam9pbihcIiwgXCIpfSkgd2VyZSBwYXNzZWQgdG8gY29tcG9uZW50IGJ1dCBjb3VsZCBub3QgYmUgYXV0b21hdGljYWxseSBpbmhlcml0ZWQgYmVjYXVzZSBjb21wb25lbnQgcmVuZGVycyBmcmFnbWVudCBvciB0ZXh0IG9yIHRlbGVwb3J0IHJvb3Qgbm9kZXMuYFxuICAgICAgICAgICk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGV2ZW50QXR0cnMubGVuZ3RoKSB7XG4gICAgICAgICAgd2FybiQxKFxuICAgICAgICAgICAgYEV4dHJhbmVvdXMgbm9uLWVtaXRzIGV2ZW50IGxpc3RlbmVycyAoJHtldmVudEF0dHJzLmpvaW4oXCIsIFwiKX0pIHdlcmUgcGFzc2VkIHRvIGNvbXBvbmVudCBidXQgY291bGQgbm90IGJlIGF1dG9tYXRpY2FsbHkgaW5oZXJpdGVkIGJlY2F1c2UgY29tcG9uZW50IHJlbmRlcnMgZnJhZ21lbnQgb3IgdGV4dCByb290IG5vZGVzLiBJZiB0aGUgbGlzdGVuZXIgaXMgaW50ZW5kZWQgdG8gYmUgYSBjb21wb25lbnQgY3VzdG9tIGV2ZW50IGxpc3RlbmVyIG9ubHksIGRlY2xhcmUgaXQgdXNpbmcgdGhlIFwiZW1pdHNcIiBvcHRpb24uYFxuICAgICAgICAgICk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgaWYgKHZub2RlLmRpcnMpIHtcbiAgICBpZiAoISEocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09IFwicHJvZHVjdGlvblwiKSAmJiAhaXNFbGVtZW50Um9vdChyb290KSkge1xuICAgICAgd2FybiQxKFxuICAgICAgICBgUnVudGltZSBkaXJlY3RpdmUgdXNlZCBvbiBjb21wb25lbnQgd2l0aCBub24tZWxlbWVudCByb290IG5vZGUuIFRoZSBkaXJlY3RpdmVzIHdpbGwgbm90IGZ1bmN0aW9uIGFzIGludGVuZGVkLmBcbiAgICAgICk7XG4gICAgfVxuICAgIHJvb3QgPSBjbG9uZVZOb2RlKHJvb3QsIG51bGwsIGZhbHNlLCB0cnVlKTtcbiAgICByb290LmRpcnMgPSByb290LmRpcnMgPyByb290LmRpcnMuY29uY2F0KHZub2RlLmRpcnMpIDogdm5vZGUuZGlycztcbiAgfVxuICBpZiAodm5vZGUudHJhbnNpdGlvbikge1xuICAgIGlmICghIShwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gXCJwcm9kdWN0aW9uXCIpICYmICFpc0VsZW1lbnRSb290KHJvb3QpKSB7XG4gICAgICB3YXJuJDEoXG4gICAgICAgIGBDb21wb25lbnQgaW5zaWRlIDxUcmFuc2l0aW9uPiByZW5kZXJzIG5vbi1lbGVtZW50IHJvb3Qgbm9kZSB0aGF0IGNhbm5vdCBiZSBhbmltYXRlZC5gXG4gICAgICApO1xuICAgIH1cbiAgICBzZXRUcmFuc2l0aW9uSG9va3Mocm9vdCwgdm5vZGUudHJhbnNpdGlvbik7XG4gIH1cbiAgaWYgKCEhKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSBcInByb2R1Y3Rpb25cIikgJiYgc2V0Um9vdCkge1xuICAgIHNldFJvb3Qocm9vdCk7XG4gIH0gZWxzZSB7XG4gICAgcmVzdWx0ID0gcm9vdDtcbiAgfVxuICBzZXRDdXJyZW50UmVuZGVyaW5nSW5zdGFuY2UocHJldik7XG4gIHJldHVybiByZXN1bHQ7XG59XG5jb25zdCBnZXRDaGlsZFJvb3QgPSAodm5vZGUpID0+IHtcbiAgY29uc3QgcmF3Q2hpbGRyZW4gPSB2bm9kZS5jaGlsZHJlbjtcbiAgY29uc3QgZHluYW1pY0NoaWxkcmVuID0gdm5vZGUuZHluYW1pY0NoaWxkcmVuO1xuICBjb25zdCBjaGlsZFJvb3QgPSBmaWx0ZXJTaW5nbGVSb290KHJhd0NoaWxkcmVuLCBmYWxzZSk7XG4gIGlmICghY2hpbGRSb290KSB7XG4gICAgcmV0dXJuIFt2bm9kZSwgdm9pZCAwXTtcbiAgfSBlbHNlIGlmICghIShwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gXCJwcm9kdWN0aW9uXCIpICYmIGNoaWxkUm9vdC5wYXRjaEZsYWcgPiAwICYmIGNoaWxkUm9vdC5wYXRjaEZsYWcgJiAyMDQ4KSB7XG4gICAgcmV0dXJuIGdldENoaWxkUm9vdChjaGlsZFJvb3QpO1xuICB9XG4gIGNvbnN0IGluZGV4ID0gcmF3Q2hpbGRyZW4uaW5kZXhPZihjaGlsZFJvb3QpO1xuICBjb25zdCBkeW5hbWljSW5kZXggPSBkeW5hbWljQ2hpbGRyZW4gPyBkeW5hbWljQ2hpbGRyZW4uaW5kZXhPZihjaGlsZFJvb3QpIDogLTE7XG4gIGNvbnN0IHNldFJvb3QgPSAodXBkYXRlZFJvb3QpID0+IHtcbiAgICByYXdDaGlsZHJlbltpbmRleF0gPSB1cGRhdGVkUm9vdDtcbiAgICBpZiAoZHluYW1pY0NoaWxkcmVuKSB7XG4gICAgICBpZiAoZHluYW1pY0luZGV4ID4gLTEpIHtcbiAgICAgICAgZHluYW1pY0NoaWxkcmVuW2R5bmFtaWNJbmRleF0gPSB1cGRhdGVkUm9vdDtcbiAgICAgIH0gZWxzZSBpZiAodXBkYXRlZFJvb3QucGF0Y2hGbGFnID4gMCkge1xuICAgICAgICB2bm9kZS5keW5hbWljQ2hpbGRyZW4gPSBbLi4uZHluYW1pY0NoaWxkcmVuLCB1cGRhdGVkUm9vdF07XG4gICAgICB9XG4gICAgfVxuICB9O1xuICByZXR1cm4gW25vcm1hbGl6ZVZOb2RlKGNoaWxkUm9vdCksIHNldFJvb3RdO1xufTtcbmZ1bmN0aW9uIGZpbHRlclNpbmdsZVJvb3QoY2hpbGRyZW4sIHJlY3Vyc2UgPSB0cnVlKSB7XG4gIGxldCBzaW5nbGVSb290O1xuICBmb3IgKGxldCBpID0gMDsgaSA8IGNoaWxkcmVuLmxlbmd0aDsgaSsrKSB7XG4gICAgY29uc3QgY2hpbGQgPSBjaGlsZHJlbltpXTtcbiAgICBpZiAoaXNWTm9kZShjaGlsZCkpIHtcbiAgICAgIGlmIChjaGlsZC50eXBlICE9PSBDb21tZW50IHx8IGNoaWxkLmNoaWxkcmVuID09PSBcInYtaWZcIikge1xuICAgICAgICBpZiAoc2luZ2xlUm9vdCkge1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBzaW5nbGVSb290ID0gY2hpbGQ7XG4gICAgICAgICAgaWYgKCEhKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSBcInByb2R1Y3Rpb25cIikgJiYgcmVjdXJzZSAmJiBzaW5nbGVSb290LnBhdGNoRmxhZyA+IDAgJiYgc2luZ2xlUm9vdC5wYXRjaEZsYWcgJiAyMDQ4KSB7XG4gICAgICAgICAgICByZXR1cm4gZmlsdGVyU2luZ2xlUm9vdChzaW5nbGVSb290LmNoaWxkcmVuKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgfVxuICByZXR1cm4gc2luZ2xlUm9vdDtcbn1cbmNvbnN0IGdldEZ1bmN0aW9uYWxGYWxsdGhyb3VnaCA9IChhdHRycykgPT4ge1xuICBsZXQgcmVzO1xuICBmb3IgKGNvbnN0IGtleSBpbiBhdHRycykge1xuICAgIGlmIChrZXkgPT09IFwiY2xhc3NcIiB8fCBrZXkgPT09IFwic3R5bGVcIiB8fCBpc09uKGtleSkpIHtcbiAgICAgIChyZXMgfHwgKHJlcyA9IHt9KSlba2V5XSA9IGF0dHJzW2tleV07XG4gICAgfVxuICB9XG4gIHJldHVybiByZXM7XG59O1xuY29uc3QgZmlsdGVyTW9kZWxMaXN0ZW5lcnMgPSAoYXR0cnMsIHByb3BzKSA9PiB7XG4gIGNvbnN0IHJlcyA9IHt9O1xuICBmb3IgKGNvbnN0IGtleSBpbiBhdHRycykge1xuICAgIGlmICghaXNNb2RlbExpc3RlbmVyKGtleSkgfHwgIShrZXkuc2xpY2UoOSkgaW4gcHJvcHMpKSB7XG4gICAgICByZXNba2V5XSA9IGF0dHJzW2tleV07XG4gICAgfVxuICB9XG4gIHJldHVybiByZXM7XG59O1xuY29uc3QgaXNFbGVtZW50Um9vdCA9ICh2bm9kZSkgPT4ge1xuICByZXR1cm4gdm5vZGUuc2hhcGVGbGFnICYgKDYgfCAxKSB8fCB2bm9kZS50eXBlID09PSBDb21tZW50O1xufTtcbmZ1bmN0aW9uIHNob3VsZFVwZGF0ZUNvbXBvbmVudChwcmV2Vk5vZGUsIG5leHRWTm9kZSwgb3B0aW1pemVkKSB7XG4gIGNvbnN0IHsgcHJvcHM6IHByZXZQcm9wcywgY2hpbGRyZW46IHByZXZDaGlsZHJlbiwgY29tcG9uZW50IH0gPSBwcmV2Vk5vZGU7XG4gIGNvbnN0IHsgcHJvcHM6IG5leHRQcm9wcywgY2hpbGRyZW46IG5leHRDaGlsZHJlbiwgcGF0Y2hGbGFnIH0gPSBuZXh0Vk5vZGU7XG4gIGNvbnN0IGVtaXRzID0gY29tcG9uZW50LmVtaXRzT3B0aW9ucztcbiAgaWYgKCEhKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSBcInByb2R1Y3Rpb25cIikgJiYgKHByZXZDaGlsZHJlbiB8fCBuZXh0Q2hpbGRyZW4pICYmIGlzSG1yVXBkYXRpbmcpIHtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuICBpZiAobmV4dFZOb2RlLmRpcnMgfHwgbmV4dFZOb2RlLnRyYW5zaXRpb24pIHtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuICBpZiAob3B0aW1pemVkICYmIHBhdGNoRmxhZyA+PSAwKSB7XG4gICAgaWYgKHBhdGNoRmxhZyAmIDEwMjQpIHtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICBpZiAocGF0Y2hGbGFnICYgMTYpIHtcbiAgICAgIGlmICghcHJldlByb3BzKSB7XG4gICAgICAgIHJldHVybiAhIW5leHRQcm9wcztcbiAgICAgIH1cbiAgICAgIHJldHVybiBoYXNQcm9wc0NoYW5nZWQocHJldlByb3BzLCBuZXh0UHJvcHMsIGVtaXRzKTtcbiAgICB9IGVsc2UgaWYgKHBhdGNoRmxhZyAmIDgpIHtcbiAgICAgIGNvbnN0IGR5bmFtaWNQcm9wcyA9IG5leHRWTm9kZS5keW5hbWljUHJvcHM7XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGR5bmFtaWNQcm9wcy5sZW5ndGg7IGkrKykge1xuICAgICAgICBjb25zdCBrZXkgPSBkeW5hbWljUHJvcHNbaV07XG4gICAgICAgIGlmIChoYXNQcm9wVmFsdWVDaGFuZ2VkKG5leHRQcm9wcywgcHJldlByb3BzLCBrZXkpICYmICFpc0VtaXRMaXN0ZW5lcihlbWl0cywga2V5KSkge1xuICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIGlmIChwcmV2Q2hpbGRyZW4gfHwgbmV4dENoaWxkcmVuKSB7XG4gICAgICBpZiAoIW5leHRDaGlsZHJlbiB8fCAhbmV4dENoaWxkcmVuLiRzdGFibGUpIHtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9XG4gICAgfVxuICAgIGlmIChwcmV2UHJvcHMgPT09IG5leHRQcm9wcykge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICBpZiAoIXByZXZQcm9wcykge1xuICAgICAgcmV0dXJuICEhbmV4dFByb3BzO1xuICAgIH1cbiAgICBpZiAoIW5leHRQcm9wcykge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICAgIHJldHVybiBoYXNQcm9wc0NoYW5nZWQocHJldlByb3BzLCBuZXh0UHJvcHMsIGVtaXRzKTtcbiAgfVxuICByZXR1cm4gZmFsc2U7XG59XG5mdW5jdGlvbiBoYXNQcm9wc0NoYW5nZWQocHJldlByb3BzLCBuZXh0UHJvcHMsIGVtaXRzT3B0aW9ucykge1xuICBjb25zdCBuZXh0S2V5cyA9IE9iamVjdC5rZXlzKG5leHRQcm9wcyk7XG4gIGlmIChuZXh0S2V5cy5sZW5ndGggIT09IE9iamVjdC5rZXlzKHByZXZQcm9wcykubGVuZ3RoKSB7XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBuZXh0S2V5cy5sZW5ndGg7IGkrKykge1xuICAgIGNvbnN0IGtleSA9IG5leHRLZXlzW2ldO1xuICAgIGlmIChoYXNQcm9wVmFsdWVDaGFuZ2VkKG5leHRQcm9wcywgcHJldlByb3BzLCBrZXkpICYmICFpc0VtaXRMaXN0ZW5lcihlbWl0c09wdGlvbnMsIGtleSkpIHtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgfVxuICByZXR1cm4gZmFsc2U7XG59XG5mdW5jdGlvbiBoYXNQcm9wVmFsdWVDaGFuZ2VkKG5leHRQcm9wcywgcHJldlByb3BzLCBrZXkpIHtcbiAgY29uc3QgbmV4dFByb3AgPSBuZXh0UHJvcHNba2V5XTtcbiAgY29uc3QgcHJldlByb3AgPSBwcmV2UHJvcHNba2V5XTtcbiAgaWYgKGtleSA9PT0gXCJzdHlsZVwiICYmIGlzT2JqZWN0KG5leHRQcm9wKSAmJiBpc09iamVjdChwcmV2UHJvcCkpIHtcbiAgICByZXR1cm4gIWxvb3NlRXF1YWwobmV4dFByb3AsIHByZXZQcm9wKTtcbiAgfVxuICByZXR1cm4gbmV4dFByb3AgIT09IHByZXZQcm9wO1xufVxuZnVuY3Rpb24gdXBkYXRlSE9DSG9zdEVsKHsgdm5vZGUsIHBhcmVudCB9LCBlbCkge1xuICB3aGlsZSAocGFyZW50KSB7XG4gICAgY29uc3Qgcm9vdCA9IHBhcmVudC5zdWJUcmVlO1xuICAgIGlmIChyb290LnN1c3BlbnNlICYmIHJvb3Quc3VzcGVuc2UuYWN0aXZlQnJhbmNoID09PSB2bm9kZSkge1xuICAgICAgcm9vdC5lbCA9IHZub2RlLmVsO1xuICAgIH1cbiAgICBpZiAocm9vdCA9PT0gdm5vZGUpIHtcbiAgICAgICh2bm9kZSA9IHBhcmVudC52bm9kZSkuZWwgPSBlbDtcbiAgICAgIHBhcmVudCA9IHBhcmVudC5wYXJlbnQ7XG4gICAgfSBlbHNlIHtcbiAgICAgIGJyZWFrO1xuICAgIH1cbiAgfVxufVxuXG5jb25zdCBpbnRlcm5hbE9iamVjdFByb3RvID0ge307XG5jb25zdCBjcmVhdGVJbnRlcm5hbE9iamVjdCA9ICgpID0+IE9iamVjdC5jcmVhdGUoaW50ZXJuYWxPYmplY3RQcm90byk7XG5jb25zdCBpc0ludGVybmFsT2JqZWN0ID0gKG9iaikgPT4gT2JqZWN0LmdldFByb3RvdHlwZU9mKG9iaikgPT09IGludGVybmFsT2JqZWN0UHJvdG87XG5cbmZ1bmN0aW9uIGluaXRQcm9wcyhpbnN0YW5jZSwgcmF3UHJvcHMsIGlzU3RhdGVmdWwsIGlzU1NSID0gZmFsc2UpIHtcbiAgY29uc3QgcHJvcHMgPSB7fTtcbiAgY29uc3QgYXR0cnMgPSBjcmVhdGVJbnRlcm5hbE9iamVjdCgpO1xuICBpbnN0YW5jZS5wcm9wc0RlZmF1bHRzID0gLyogQF9fUFVSRV9fICovIE9iamVjdC5jcmVhdGUobnVsbCk7XG4gIHNldEZ1bGxQcm9wcyhpbnN0YW5jZSwgcmF3UHJvcHMsIHByb3BzLCBhdHRycyk7XG4gIGZvciAoY29uc3Qga2V5IGluIGluc3RhbmNlLnByb3BzT3B0aW9uc1swXSkge1xuICAgIGlmICghKGtleSBpbiBwcm9wcykpIHtcbiAgICAgIHByb3BzW2tleV0gPSB2b2lkIDA7XG4gICAgfVxuICB9XG4gIGlmICghIShwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gXCJwcm9kdWN0aW9uXCIpKSB7XG4gICAgdmFsaWRhdGVQcm9wcyhyYXdQcm9wcyB8fCB7fSwgcHJvcHMsIGluc3RhbmNlKTtcbiAgfVxuICBpZiAoaXNTdGF0ZWZ1bCkge1xuICAgIGluc3RhbmNlLnByb3BzID0gaXNTU1IgPyBwcm9wcyA6IHNoYWxsb3dSZWFjdGl2ZShwcm9wcyk7XG4gIH0gZWxzZSB7XG4gICAgaWYgKCFpbnN0YW5jZS50eXBlLnByb3BzKSB7XG4gICAgICBpbnN0YW5jZS5wcm9wcyA9IGF0dHJzO1xuICAgIH0gZWxzZSB7XG4gICAgICBpbnN0YW5jZS5wcm9wcyA9IHByb3BzO1xuICAgIH1cbiAgfVxuICBpbnN0YW5jZS5hdHRycyA9IGF0dHJzO1xufVxuZnVuY3Rpb24gaXNJbkhtckNvbnRleHQoaW5zdGFuY2UpIHtcbiAgd2hpbGUgKGluc3RhbmNlKSB7XG4gICAgaWYgKGluc3RhbmNlLnR5cGUuX19obXJJZCkgcmV0dXJuIHRydWU7XG4gICAgaW5zdGFuY2UgPSBpbnN0YW5jZS5wYXJlbnQ7XG4gIH1cbn1cbmZ1bmN0aW9uIHVwZGF0ZVByb3BzKGluc3RhbmNlLCByYXdQcm9wcywgcmF3UHJldlByb3BzLCBvcHRpbWl6ZWQpIHtcbiAgY29uc3Qge1xuICAgIHByb3BzLFxuICAgIGF0dHJzLFxuICAgIHZub2RlOiB7IHBhdGNoRmxhZyB9XG4gIH0gPSBpbnN0YW5jZTtcbiAgY29uc3QgcmF3Q3VycmVudFByb3BzID0gdG9SYXcocHJvcHMpO1xuICBjb25zdCBbb3B0aW9uc10gPSBpbnN0YW5jZS5wcm9wc09wdGlvbnM7XG4gIGxldCBoYXNBdHRyc0NoYW5nZWQgPSBmYWxzZTtcbiAgaWYgKFxuICAgIC8vIGFsd2F5cyBmb3JjZSBmdWxsIGRpZmYgaW4gZGV2XG4gICAgLy8gLSAjMTk0MiBpZiBobXIgaXMgZW5hYmxlZCB3aXRoIHNmYyBjb21wb25lbnRcbiAgICAvLyAtIHZpdGUjODcyIG5vbi1zZmMgY29tcG9uZW50IHVzZWQgYnkgc2ZjIGNvbXBvbmVudFxuICAgICEoISEocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09IFwicHJvZHVjdGlvblwiKSAmJiBpc0luSG1yQ29udGV4dChpbnN0YW5jZSkpICYmIChvcHRpbWl6ZWQgfHwgcGF0Y2hGbGFnID4gMCkgJiYgIShwYXRjaEZsYWcgJiAxNilcbiAgKSB7XG4gICAgaWYgKHBhdGNoRmxhZyAmIDgpIHtcbiAgICAgIGNvbnN0IHByb3BzVG9VcGRhdGUgPSBpbnN0YW5jZS52bm9kZS5keW5hbWljUHJvcHM7XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHByb3BzVG9VcGRhdGUubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgbGV0IGtleSA9IHByb3BzVG9VcGRhdGVbaV07XG4gICAgICAgIGlmIChpc0VtaXRMaXN0ZW5lcihpbnN0YW5jZS5lbWl0c09wdGlvbnMsIGtleSkpIHtcbiAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCB2YWx1ZSA9IHJhd1Byb3BzW2tleV07XG4gICAgICAgIGlmIChvcHRpb25zKSB7XG4gICAgICAgICAgaWYgKGhhc093bihhdHRycywga2V5KSkge1xuICAgICAgICAgICAgaWYgKHZhbHVlICE9PSBhdHRyc1trZXldKSB7XG4gICAgICAgICAgICAgIGF0dHJzW2tleV0gPSB2YWx1ZTtcbiAgICAgICAgICAgICAgaGFzQXR0cnNDaGFuZ2VkID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY29uc3QgY2FtZWxpemVkS2V5ID0gY2FtZWxpemUoa2V5KTtcbiAgICAgICAgICAgIHByb3BzW2NhbWVsaXplZEtleV0gPSByZXNvbHZlUHJvcFZhbHVlKFxuICAgICAgICAgICAgICBvcHRpb25zLFxuICAgICAgICAgICAgICByYXdDdXJyZW50UHJvcHMsXG4gICAgICAgICAgICAgIGNhbWVsaXplZEtleSxcbiAgICAgICAgICAgICAgdmFsdWUsXG4gICAgICAgICAgICAgIGluc3RhbmNlLFxuICAgICAgICAgICAgICBmYWxzZVxuICAgICAgICAgICAgKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgaWYgKHZhbHVlICE9PSBhdHRyc1trZXldKSB7XG4gICAgICAgICAgICBhdHRyc1trZXldID0gdmFsdWU7XG4gICAgICAgICAgICBoYXNBdHRyc0NoYW5nZWQgPSB0cnVlO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfSBlbHNlIHtcbiAgICBpZiAoc2V0RnVsbFByb3BzKGluc3RhbmNlLCByYXdQcm9wcywgcHJvcHMsIGF0dHJzKSkge1xuICAgICAgaGFzQXR0cnNDaGFuZ2VkID0gdHJ1ZTtcbiAgICB9XG4gICAgbGV0IGtlYmFiS2V5O1xuICAgIGZvciAoY29uc3Qga2V5IGluIHJhd0N1cnJlbnRQcm9wcykge1xuICAgICAgaWYgKCFyYXdQcm9wcyB8fCAvLyBmb3IgY2FtZWxDYXNlXG4gICAgICAhaGFzT3duKHJhd1Byb3BzLCBrZXkpICYmIC8vIGl0J3MgcG9zc2libGUgdGhlIG9yaWdpbmFsIHByb3BzIHdhcyBwYXNzZWQgaW4gYXMga2ViYWItY2FzZVxuICAgICAgLy8gYW5kIGNvbnZlcnRlZCB0byBjYW1lbENhc2UgKCM5NTUpXG4gICAgICAoKGtlYmFiS2V5ID0gaHlwaGVuYXRlKGtleSkpID09PSBrZXkgfHwgIWhhc093bihyYXdQcm9wcywga2ViYWJLZXkpKSkge1xuICAgICAgICBpZiAob3B0aW9ucykge1xuICAgICAgICAgIGlmIChyYXdQcmV2UHJvcHMgJiYgLy8gZm9yIGNhbWVsQ2FzZVxuICAgICAgICAgIChyYXdQcmV2UHJvcHNba2V5XSAhPT0gdm9pZCAwIHx8IC8vIGZvciBrZWJhYi1jYXNlXG4gICAgICAgICAgcmF3UHJldlByb3BzW2tlYmFiS2V5XSAhPT0gdm9pZCAwKSkge1xuICAgICAgICAgICAgcHJvcHNba2V5XSA9IHJlc29sdmVQcm9wVmFsdWUoXG4gICAgICAgICAgICAgIG9wdGlvbnMsXG4gICAgICAgICAgICAgIHJhd0N1cnJlbnRQcm9wcyxcbiAgICAgICAgICAgICAga2V5LFxuICAgICAgICAgICAgICB2b2lkIDAsXG4gICAgICAgICAgICAgIGluc3RhbmNlLFxuICAgICAgICAgICAgICB0cnVlXG4gICAgICAgICAgICApO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBkZWxldGUgcHJvcHNba2V5XTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICBpZiAoYXR0cnMgIT09IHJhd0N1cnJlbnRQcm9wcykge1xuICAgICAgZm9yIChjb25zdCBrZXkgaW4gYXR0cnMpIHtcbiAgICAgICAgaWYgKCFyYXdQcm9wcyB8fCAhaGFzT3duKHJhd1Byb3BzLCBrZXkpICYmIHRydWUpIHtcbiAgICAgICAgICBkZWxldGUgYXR0cnNba2V5XTtcbiAgICAgICAgICBoYXNBdHRyc0NoYW5nZWQgPSB0cnVlO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG4gIGlmIChoYXNBdHRyc0NoYW5nZWQpIHtcbiAgICB0cmlnZ2VyKGluc3RhbmNlLmF0dHJzLCBcInNldFwiLCBcIlwiKTtcbiAgfVxuICBpZiAoISEocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09IFwicHJvZHVjdGlvblwiKSkge1xuICAgIHZhbGlkYXRlUHJvcHMocmF3UHJvcHMgfHwge30sIHByb3BzLCBpbnN0YW5jZSk7XG4gIH1cbn1cbmZ1bmN0aW9uIHNldEZ1bGxQcm9wcyhpbnN0YW5jZSwgcmF3UHJvcHMsIHByb3BzLCBhdHRycykge1xuICBjb25zdCBbb3B0aW9ucywgbmVlZENhc3RLZXlzXSA9IGluc3RhbmNlLnByb3BzT3B0aW9ucztcbiAgbGV0IGhhc0F0dHJzQ2hhbmdlZCA9IGZhbHNlO1xuICBsZXQgcmF3Q2FzdFZhbHVlcztcbiAgaWYgKHJhd1Byb3BzKSB7XG4gICAgZm9yIChsZXQga2V5IGluIHJhd1Byb3BzKSB7XG4gICAgICBpZiAoaXNSZXNlcnZlZFByb3Aoa2V5KSkge1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cbiAgICAgIGNvbnN0IHZhbHVlID0gcmF3UHJvcHNba2V5XTtcbiAgICAgIGxldCBjYW1lbEtleTtcbiAgICAgIGlmIChvcHRpb25zICYmIGhhc093bihvcHRpb25zLCBjYW1lbEtleSA9IGNhbWVsaXplKGtleSkpKSB7XG4gICAgICAgIGlmICghbmVlZENhc3RLZXlzIHx8ICFuZWVkQ2FzdEtleXMuaW5jbHVkZXMoY2FtZWxLZXkpKSB7XG4gICAgICAgICAgcHJvcHNbY2FtZWxLZXldID0gdmFsdWU7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgKHJhd0Nhc3RWYWx1ZXMgfHwgKHJhd0Nhc3RWYWx1ZXMgPSB7fSkpW2NhbWVsS2V5XSA9IHZhbHVlO1xuICAgICAgICB9XG4gICAgICB9IGVsc2UgaWYgKCFpc0VtaXRMaXN0ZW5lcihpbnN0YW5jZS5lbWl0c09wdGlvbnMsIGtleSkpIHtcbiAgICAgICAgaWYgKCEoa2V5IGluIGF0dHJzKSB8fCB2YWx1ZSAhPT0gYXR0cnNba2V5XSkge1xuICAgICAgICAgIGF0dHJzW2tleV0gPSB2YWx1ZTtcbiAgICAgICAgICBoYXNBdHRyc0NoYW5nZWQgPSB0cnVlO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG4gIGlmIChuZWVkQ2FzdEtleXMpIHtcbiAgICBjb25zdCByYXdDdXJyZW50UHJvcHMgPSB0b1Jhdyhwcm9wcyk7XG4gICAgY29uc3QgY2FzdFZhbHVlcyA9IHJhd0Nhc3RWYWx1ZXMgfHwgRU1QVFlfT0JKO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbmVlZENhc3RLZXlzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBjb25zdCBrZXkgPSBuZWVkQ2FzdEtleXNbaV07XG4gICAgICBwcm9wc1trZXldID0gcmVzb2x2ZVByb3BWYWx1ZShcbiAgICAgICAgb3B0aW9ucyxcbiAgICAgICAgcmF3Q3VycmVudFByb3BzLFxuICAgICAgICBrZXksXG4gICAgICAgIGNhc3RWYWx1ZXNba2V5XSxcbiAgICAgICAgaW5zdGFuY2UsXG4gICAgICAgICFoYXNPd24oY2FzdFZhbHVlcywga2V5KVxuICAgICAgKTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIGhhc0F0dHJzQ2hhbmdlZDtcbn1cbmZ1bmN0aW9uIHJlc29sdmVQcm9wVmFsdWUob3B0aW9ucywgcHJvcHMsIGtleSwgdmFsdWUsIGluc3RhbmNlLCBpc0Fic2VudCkge1xuICBjb25zdCBvcHQgPSBvcHRpb25zW2tleV07XG4gIGlmIChvcHQgIT0gbnVsbCkge1xuICAgIGNvbnN0IGhhc0RlZmF1bHQgPSBoYXNPd24ob3B0LCBcImRlZmF1bHRcIik7XG4gICAgaWYgKGhhc0RlZmF1bHQgJiYgdmFsdWUgPT09IHZvaWQgMCkge1xuICAgICAgY29uc3QgZGVmYXVsdFZhbHVlID0gb3B0LmRlZmF1bHQ7XG4gICAgICBpZiAob3B0LnR5cGUgIT09IEZ1bmN0aW9uICYmICFvcHQuc2tpcEZhY3RvcnkgJiYgaXNGdW5jdGlvbihkZWZhdWx0VmFsdWUpKSB7XG4gICAgICAgIGNvbnN0IHsgcHJvcHNEZWZhdWx0cyB9ID0gaW5zdGFuY2U7XG4gICAgICAgIGlmIChrZXkgaW4gcHJvcHNEZWZhdWx0cykge1xuICAgICAgICAgIHZhbHVlID0gcHJvcHNEZWZhdWx0c1trZXldO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGNvbnN0IHJlc2V0ID0gc2V0Q3VycmVudEluc3RhbmNlKGluc3RhbmNlKTtcbiAgICAgICAgICB2YWx1ZSA9IHByb3BzRGVmYXVsdHNba2V5XSA9IGRlZmF1bHRWYWx1ZS5jYWxsKFxuICAgICAgICAgICAgbnVsbCxcbiAgICAgICAgICAgIHByb3BzXG4gICAgICAgICAgKTtcbiAgICAgICAgICByZXNldCgpO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB2YWx1ZSA9IGRlZmF1bHRWYWx1ZTtcbiAgICAgIH1cbiAgICAgIGlmIChpbnN0YW5jZS5jZSkge1xuICAgICAgICBpbnN0YW5jZS5jZS5fc2V0UHJvcChrZXksIHZhbHVlKTtcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKG9wdFswIC8qIHNob3VsZENhc3QgKi9dKSB7XG4gICAgICBpZiAoaXNBYnNlbnQgJiYgIWhhc0RlZmF1bHQpIHtcbiAgICAgICAgdmFsdWUgPSBmYWxzZTtcbiAgICAgIH0gZWxzZSBpZiAob3B0WzEgLyogc2hvdWxkQ2FzdFRydWUgKi9dICYmICh2YWx1ZSA9PT0gXCJcIiB8fCB2YWx1ZSA9PT0gaHlwaGVuYXRlKGtleSkpKSB7XG4gICAgICAgIHZhbHVlID0gdHJ1ZTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgcmV0dXJuIHZhbHVlO1xufVxuY29uc3QgbWl4aW5Qcm9wc0NhY2hlID0gLyogQF9fUFVSRV9fICovIG5ldyBXZWFrTWFwKCk7XG5mdW5jdGlvbiBub3JtYWxpemVQcm9wc09wdGlvbnMoY29tcCwgYXBwQ29udGV4dCwgYXNNaXhpbiA9IGZhbHNlKSB7XG4gIGNvbnN0IGNhY2hlID0gX19WVUVfT1BUSU9OU19BUElfXyAmJiBhc01peGluID8gbWl4aW5Qcm9wc0NhY2hlIDogYXBwQ29udGV4dC5wcm9wc0NhY2hlO1xuICBjb25zdCBjYWNoZWQgPSBjYWNoZS5nZXQoY29tcCk7XG4gIGlmIChjYWNoZWQpIHtcbiAgICByZXR1cm4gY2FjaGVkO1xuICB9XG4gIGNvbnN0IHJhdyA9IGNvbXAucHJvcHM7XG4gIGNvbnN0IG5vcm1hbGl6ZWQgPSB7fTtcbiAgY29uc3QgbmVlZENhc3RLZXlzID0gW107XG4gIGxldCBoYXNFeHRlbmRzID0gZmFsc2U7XG4gIGlmIChfX1ZVRV9PUFRJT05TX0FQSV9fICYmICFpc0Z1bmN0aW9uKGNvbXApKSB7XG4gICAgY29uc3QgZXh0ZW5kUHJvcHMgPSAocmF3MikgPT4ge1xuICAgICAgaGFzRXh0ZW5kcyA9IHRydWU7XG4gICAgICBjb25zdCBbcHJvcHMsIGtleXNdID0gbm9ybWFsaXplUHJvcHNPcHRpb25zKHJhdzIsIGFwcENvbnRleHQsIHRydWUpO1xuICAgICAgZXh0ZW5kKG5vcm1hbGl6ZWQsIHByb3BzKTtcbiAgICAgIGlmIChrZXlzKSBuZWVkQ2FzdEtleXMucHVzaCguLi5rZXlzKTtcbiAgICB9O1xuICAgIGlmICghYXNNaXhpbiAmJiBhcHBDb250ZXh0Lm1peGlucy5sZW5ndGgpIHtcbiAgICAgIGFwcENvbnRleHQubWl4aW5zLmZvckVhY2goZXh0ZW5kUHJvcHMpO1xuICAgIH1cbiAgICBpZiAoY29tcC5leHRlbmRzKSB7XG4gICAgICBleHRlbmRQcm9wcyhjb21wLmV4dGVuZHMpO1xuICAgIH1cbiAgICBpZiAoY29tcC5taXhpbnMpIHtcbiAgICAgIGNvbXAubWl4aW5zLmZvckVhY2goZXh0ZW5kUHJvcHMpO1xuICAgIH1cbiAgfVxuICBpZiAoIXJhdyAmJiAhaGFzRXh0ZW5kcykge1xuICAgIGlmIChpc09iamVjdChjb21wKSkge1xuICAgICAgY2FjaGUuc2V0KGNvbXAsIEVNUFRZX0FSUik7XG4gICAgfVxuICAgIHJldHVybiBFTVBUWV9BUlI7XG4gIH1cbiAgaWYgKGlzQXJyYXkocmF3KSkge1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcmF3Lmxlbmd0aDsgaSsrKSB7XG4gICAgICBpZiAoISEocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09IFwicHJvZHVjdGlvblwiKSAmJiAhaXNTdHJpbmcocmF3W2ldKSkge1xuICAgICAgICB3YXJuJDEoYHByb3BzIG11c3QgYmUgc3RyaW5ncyB3aGVuIHVzaW5nIGFycmF5IHN5bnRheC5gLCByYXdbaV0pO1xuICAgICAgfVxuICAgICAgY29uc3Qgbm9ybWFsaXplZEtleSA9IGNhbWVsaXplKHJhd1tpXSk7XG4gICAgICBpZiAodmFsaWRhdGVQcm9wTmFtZShub3JtYWxpemVkS2V5KSkge1xuICAgICAgICBub3JtYWxpemVkW25vcm1hbGl6ZWRLZXldID0gRU1QVFlfT0JKO1xuICAgICAgfVxuICAgIH1cbiAgfSBlbHNlIGlmIChyYXcpIHtcbiAgICBpZiAoISEocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09IFwicHJvZHVjdGlvblwiKSAmJiAhaXNPYmplY3QocmF3KSkge1xuICAgICAgd2FybiQxKGBpbnZhbGlkIHByb3BzIG9wdGlvbnNgLCByYXcpO1xuICAgIH1cbiAgICBmb3IgKGNvbnN0IGtleSBpbiByYXcpIHtcbiAgICAgIGNvbnN0IG5vcm1hbGl6ZWRLZXkgPSBjYW1lbGl6ZShrZXkpO1xuICAgICAgaWYgKHZhbGlkYXRlUHJvcE5hbWUobm9ybWFsaXplZEtleSkpIHtcbiAgICAgICAgY29uc3Qgb3B0ID0gcmF3W2tleV07XG4gICAgICAgIGNvbnN0IHByb3AgPSBub3JtYWxpemVkW25vcm1hbGl6ZWRLZXldID0gaXNBcnJheShvcHQpIHx8IGlzRnVuY3Rpb24ob3B0KSA/IHsgdHlwZTogb3B0IH0gOiBleHRlbmQoe30sIG9wdCk7XG4gICAgICAgIGNvbnN0IHByb3BUeXBlID0gcHJvcC50eXBlO1xuICAgICAgICBsZXQgc2hvdWxkQ2FzdCA9IGZhbHNlO1xuICAgICAgICBsZXQgc2hvdWxkQ2FzdFRydWUgPSB0cnVlO1xuICAgICAgICBpZiAoaXNBcnJheShwcm9wVHlwZSkpIHtcbiAgICAgICAgICBmb3IgKGxldCBpbmRleCA9IDA7IGluZGV4IDwgcHJvcFR5cGUubGVuZ3RoOyArK2luZGV4KSB7XG4gICAgICAgICAgICBjb25zdCB0eXBlID0gcHJvcFR5cGVbaW5kZXhdO1xuICAgICAgICAgICAgY29uc3QgdHlwZU5hbWUgPSBpc0Z1bmN0aW9uKHR5cGUpICYmIHR5cGUubmFtZTtcbiAgICAgICAgICAgIGlmICh0eXBlTmFtZSA9PT0gXCJCb29sZWFuXCIpIHtcbiAgICAgICAgICAgICAgc2hvdWxkQ2FzdCA9IHRydWU7XG4gICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfSBlbHNlIGlmICh0eXBlTmFtZSA9PT0gXCJTdHJpbmdcIikge1xuICAgICAgICAgICAgICBzaG91bGRDYXN0VHJ1ZSA9IGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBzaG91bGRDYXN0ID0gaXNGdW5jdGlvbihwcm9wVHlwZSkgJiYgcHJvcFR5cGUubmFtZSA9PT0gXCJCb29sZWFuXCI7XG4gICAgICAgIH1cbiAgICAgICAgcHJvcFswIC8qIHNob3VsZENhc3QgKi9dID0gc2hvdWxkQ2FzdDtcbiAgICAgICAgcHJvcFsxIC8qIHNob3VsZENhc3RUcnVlICovXSA9IHNob3VsZENhc3RUcnVlO1xuICAgICAgICBpZiAoc2hvdWxkQ2FzdCB8fCBoYXNPd24ocHJvcCwgXCJkZWZhdWx0XCIpKSB7XG4gICAgICAgICAgbmVlZENhc3RLZXlzLnB1c2gobm9ybWFsaXplZEtleSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgY29uc3QgcmVzID0gW25vcm1hbGl6ZWQsIG5lZWRDYXN0S2V5c107XG4gIGlmIChpc09iamVjdChjb21wKSkge1xuICAgIGNhY2hlLnNldChjb21wLCByZXMpO1xuICB9XG4gIHJldHVybiByZXM7XG59XG5mdW5jdGlvbiB2YWxpZGF0ZVByb3BOYW1lKGtleSkge1xuICBpZiAoa2V5WzBdICE9PSBcIiRcIiAmJiAhaXNSZXNlcnZlZFByb3Aoa2V5KSkge1xuICAgIHJldHVybiB0cnVlO1xuICB9IGVsc2UgaWYgKCEhKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSBcInByb2R1Y3Rpb25cIikpIHtcbiAgICB3YXJuJDEoYEludmFsaWQgcHJvcCBuYW1lOiBcIiR7a2V5fVwiIGlzIGEgcmVzZXJ2ZWQgcHJvcGVydHkuYCk7XG4gIH1cbiAgcmV0dXJuIGZhbHNlO1xufVxuZnVuY3Rpb24gZ2V0VHlwZShjdG9yKSB7XG4gIGlmIChjdG9yID09PSBudWxsKSB7XG4gICAgcmV0dXJuIFwibnVsbFwiO1xuICB9XG4gIGlmICh0eXBlb2YgY3RvciA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgcmV0dXJuIGN0b3IubmFtZSB8fCBcIlwiO1xuICB9IGVsc2UgaWYgKHR5cGVvZiBjdG9yID09PSBcIm9iamVjdFwiKSB7XG4gICAgY29uc3QgbmFtZSA9IGN0b3IuY29uc3RydWN0b3IgJiYgY3Rvci5jb25zdHJ1Y3Rvci5uYW1lO1xuICAgIHJldHVybiBuYW1lIHx8IFwiXCI7XG4gIH1cbiAgcmV0dXJuIFwiXCI7XG59XG5mdW5jdGlvbiB2YWxpZGF0ZVByb3BzKHJhd1Byb3BzLCBwcm9wcywgaW5zdGFuY2UpIHtcbiAgY29uc3QgcmVzb2x2ZWRWYWx1ZXMgPSB0b1Jhdyhwcm9wcyk7XG4gIGNvbnN0IG9wdGlvbnMgPSBpbnN0YW5jZS5wcm9wc09wdGlvbnNbMF07XG4gIGNvbnN0IGNhbWVsaXplUHJvcHNLZXkgPSBPYmplY3Qua2V5cyhyYXdQcm9wcykubWFwKChrZXkpID0+IGNhbWVsaXplKGtleSkpO1xuICBmb3IgKGNvbnN0IGtleSBpbiBvcHRpb25zKSB7XG4gICAgbGV0IG9wdCA9IG9wdGlvbnNba2V5XTtcbiAgICBpZiAob3B0ID09IG51bGwpIGNvbnRpbnVlO1xuICAgIHZhbGlkYXRlUHJvcChcbiAgICAgIGtleSxcbiAgICAgIHJlc29sdmVkVmFsdWVzW2tleV0sXG4gICAgICBvcHQsXG4gICAgICAhIShwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gXCJwcm9kdWN0aW9uXCIpID8gc2hhbGxvd1JlYWRvbmx5KHJlc29sdmVkVmFsdWVzKSA6IHJlc29sdmVkVmFsdWVzLFxuICAgICAgIWNhbWVsaXplUHJvcHNLZXkuaW5jbHVkZXMoa2V5KVxuICAgICk7XG4gIH1cbn1cbmZ1bmN0aW9uIHZhbGlkYXRlUHJvcChuYW1lLCB2YWx1ZSwgcHJvcCwgcHJvcHMsIGlzQWJzZW50KSB7XG4gIGNvbnN0IHsgdHlwZSwgcmVxdWlyZWQsIHZhbGlkYXRvciwgc2tpcENoZWNrIH0gPSBwcm9wO1xuICBpZiAocmVxdWlyZWQgJiYgaXNBYnNlbnQpIHtcbiAgICB3YXJuJDEoJ01pc3NpbmcgcmVxdWlyZWQgcHJvcDogXCInICsgbmFtZSArICdcIicpO1xuICAgIHJldHVybjtcbiAgfVxuICBpZiAodmFsdWUgPT0gbnVsbCAmJiAhcmVxdWlyZWQpIHtcbiAgICByZXR1cm47XG4gIH1cbiAgaWYgKHR5cGUgIT0gbnVsbCAmJiB0eXBlICE9PSB0cnVlICYmICFza2lwQ2hlY2spIHtcbiAgICBsZXQgaXNWYWxpZCA9IGZhbHNlO1xuICAgIGNvbnN0IHR5cGVzID0gaXNBcnJheSh0eXBlKSA/IHR5cGUgOiBbdHlwZV07XG4gICAgY29uc3QgZXhwZWN0ZWRUeXBlcyA9IFtdO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdHlwZXMubGVuZ3RoICYmICFpc1ZhbGlkOyBpKyspIHtcbiAgICAgIGNvbnN0IHsgdmFsaWQsIGV4cGVjdGVkVHlwZSB9ID0gYXNzZXJ0VHlwZSh2YWx1ZSwgdHlwZXNbaV0pO1xuICAgICAgZXhwZWN0ZWRUeXBlcy5wdXNoKGV4cGVjdGVkVHlwZSB8fCBcIlwiKTtcbiAgICAgIGlzVmFsaWQgPSB2YWxpZDtcbiAgICB9XG4gICAgaWYgKCFpc1ZhbGlkKSB7XG4gICAgICB3YXJuJDEoZ2V0SW52YWxpZFR5cGVNZXNzYWdlKG5hbWUsIHZhbHVlLCBleHBlY3RlZFR5cGVzKSk7XG4gICAgICByZXR1cm47XG4gICAgfVxuICB9XG4gIGlmICh2YWxpZGF0b3IgJiYgIXZhbGlkYXRvcih2YWx1ZSwgcHJvcHMpKSB7XG4gICAgd2FybiQxKCdJbnZhbGlkIHByb3A6IGN1c3RvbSB2YWxpZGF0b3IgY2hlY2sgZmFpbGVkIGZvciBwcm9wIFwiJyArIG5hbWUgKyAnXCIuJyk7XG4gIH1cbn1cbmNvbnN0IGlzU2ltcGxlVHlwZSA9IC8qIEBfX1BVUkVfXyAqLyBtYWtlTWFwKFxuICBcIlN0cmluZyxOdW1iZXIsQm9vbGVhbixGdW5jdGlvbixTeW1ib2wsQmlnSW50XCJcbik7XG5mdW5jdGlvbiBhc3NlcnRUeXBlKHZhbHVlLCB0eXBlKSB7XG4gIGxldCB2YWxpZDtcbiAgY29uc3QgZXhwZWN0ZWRUeXBlID0gZ2V0VHlwZSh0eXBlKTtcbiAgaWYgKGV4cGVjdGVkVHlwZSA9PT0gXCJudWxsXCIpIHtcbiAgICB2YWxpZCA9IHZhbHVlID09PSBudWxsO1xuICB9IGVsc2UgaWYgKGlzU2ltcGxlVHlwZShleHBlY3RlZFR5cGUpKSB7XG4gICAgY29uc3QgdCA9IHR5cGVvZiB2YWx1ZTtcbiAgICB2YWxpZCA9IHQgPT09IGV4cGVjdGVkVHlwZS50b0xvd2VyQ2FzZSgpO1xuICAgIGlmICghdmFsaWQgJiYgdCA9PT0gXCJvYmplY3RcIikge1xuICAgICAgdmFsaWQgPSB2YWx1ZSBpbnN0YW5jZW9mIHR5cGU7XG4gICAgfVxuICB9IGVsc2UgaWYgKGV4cGVjdGVkVHlwZSA9PT0gXCJPYmplY3RcIikge1xuICAgIHZhbGlkID0gaXNPYmplY3QodmFsdWUpO1xuICB9IGVsc2UgaWYgKGV4cGVjdGVkVHlwZSA9PT0gXCJBcnJheVwiKSB7XG4gICAgdmFsaWQgPSBpc0FycmF5KHZhbHVlKTtcbiAgfSBlbHNlIHtcbiAgICB2YWxpZCA9IHZhbHVlIGluc3RhbmNlb2YgdHlwZTtcbiAgfVxuICByZXR1cm4ge1xuICAgIHZhbGlkLFxuICAgIGV4cGVjdGVkVHlwZVxuICB9O1xufVxuZnVuY3Rpb24gZ2V0SW52YWxpZFR5cGVNZXNzYWdlKG5hbWUsIHZhbHVlLCBleHBlY3RlZFR5cGVzKSB7XG4gIGlmIChleHBlY3RlZFR5cGVzLmxlbmd0aCA9PT0gMCkge1xuICAgIHJldHVybiBgUHJvcCB0eXBlIFtdIGZvciBwcm9wIFwiJHtuYW1lfVwiIHdvbid0IG1hdGNoIGFueXRoaW5nLiBEaWQgeW91IG1lYW4gdG8gdXNlIHR5cGUgQXJyYXkgaW5zdGVhZD9gO1xuICB9XG4gIGxldCBtZXNzYWdlID0gYEludmFsaWQgcHJvcDogdHlwZSBjaGVjayBmYWlsZWQgZm9yIHByb3AgXCIke25hbWV9XCIuIEV4cGVjdGVkICR7ZXhwZWN0ZWRUeXBlcy5tYXAoY2FwaXRhbGl6ZSkuam9pbihcIiB8IFwiKX1gO1xuICBjb25zdCBleHBlY3RlZFR5cGUgPSBleHBlY3RlZFR5cGVzWzBdO1xuICBjb25zdCByZWNlaXZlZFR5cGUgPSB0b1Jhd1R5cGUodmFsdWUpO1xuICBjb25zdCBleHBlY3RlZFZhbHVlID0gc3R5bGVWYWx1ZSh2YWx1ZSwgZXhwZWN0ZWRUeXBlKTtcbiAgY29uc3QgcmVjZWl2ZWRWYWx1ZSA9IHN0eWxlVmFsdWUodmFsdWUsIHJlY2VpdmVkVHlwZSk7XG4gIGlmIChleHBlY3RlZFR5cGVzLmxlbmd0aCA9PT0gMSAmJiBpc0V4cGxpY2FibGUoZXhwZWN0ZWRUeXBlKSAmJiAhaXNCb29sZWFuKGV4cGVjdGVkVHlwZSwgcmVjZWl2ZWRUeXBlKSkge1xuICAgIG1lc3NhZ2UgKz0gYCB3aXRoIHZhbHVlICR7ZXhwZWN0ZWRWYWx1ZX1gO1xuICB9XG4gIG1lc3NhZ2UgKz0gYCwgZ290ICR7cmVjZWl2ZWRUeXBlfSBgO1xuICBpZiAoaXNFeHBsaWNhYmxlKHJlY2VpdmVkVHlwZSkpIHtcbiAgICBtZXNzYWdlICs9IGB3aXRoIHZhbHVlICR7cmVjZWl2ZWRWYWx1ZX0uYDtcbiAgfVxuICByZXR1cm4gbWVzc2FnZTtcbn1cbmZ1bmN0aW9uIHN0eWxlVmFsdWUodmFsdWUsIHR5cGUpIHtcbiAgaWYgKHR5cGUgPT09IFwiU3RyaW5nXCIpIHtcbiAgICByZXR1cm4gYFwiJHt2YWx1ZX1cImA7XG4gIH0gZWxzZSBpZiAodHlwZSA9PT0gXCJOdW1iZXJcIikge1xuICAgIHJldHVybiBgJHtOdW1iZXIodmFsdWUpfWA7XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIGAke3ZhbHVlfWA7XG4gIH1cbn1cbmZ1bmN0aW9uIGlzRXhwbGljYWJsZSh0eXBlKSB7XG4gIGNvbnN0IGV4cGxpY2l0VHlwZXMgPSBbXCJzdHJpbmdcIiwgXCJudW1iZXJcIiwgXCJib29sZWFuXCJdO1xuICByZXR1cm4gZXhwbGljaXRUeXBlcy5zb21lKChlbGVtKSA9PiB0eXBlLnRvTG93ZXJDYXNlKCkgPT09IGVsZW0pO1xufVxuZnVuY3Rpb24gaXNCb29sZWFuKC4uLmFyZ3MpIHtcbiAgcmV0dXJuIGFyZ3Muc29tZSgoZWxlbSkgPT4gZWxlbS50b0xvd2VyQ2FzZSgpID09PSBcImJvb2xlYW5cIik7XG59XG5cbmNvbnN0IGlzSW50ZXJuYWxLZXkgPSAoa2V5KSA9PiBrZXkgPT09IFwiX1wiIHx8IGtleSA9PT0gXCJfY3R4XCIgfHwga2V5ID09PSBcIiRzdGFibGVcIjtcbmNvbnN0IG5vcm1hbGl6ZVNsb3RWYWx1ZSA9ICh2YWx1ZSkgPT4gaXNBcnJheSh2YWx1ZSkgPyB2YWx1ZS5tYXAobm9ybWFsaXplVk5vZGUpIDogW25vcm1hbGl6ZVZOb2RlKHZhbHVlKV07XG5jb25zdCBub3JtYWxpemVTbG90ID0gKGtleSwgcmF3U2xvdCwgY3R4KSA9PiB7XG4gIGlmIChyYXdTbG90Ll9uKSB7XG4gICAgcmV0dXJuIHJhd1Nsb3Q7XG4gIH1cbiAgY29uc3Qgbm9ybWFsaXplZCA9IHdpdGhDdHgoKC4uLmFyZ3MpID0+IHtcbiAgICBpZiAoISEocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09IFwicHJvZHVjdGlvblwiKSAmJiBjdXJyZW50SW5zdGFuY2UgJiYgIShjdHggPT09IG51bGwgJiYgY3VycmVudFJlbmRlcmluZ0luc3RhbmNlKSAmJiAhKGN0eCAmJiBjdHgucm9vdCAhPT0gY3VycmVudEluc3RhbmNlLnJvb3QpKSB7XG4gICAgICB3YXJuJDEoXG4gICAgICAgIGBTbG90IFwiJHtrZXl9XCIgaW52b2tlZCBvdXRzaWRlIG9mIHRoZSByZW5kZXIgZnVuY3Rpb246IHRoaXMgd2lsbCBub3QgdHJhY2sgZGVwZW5kZW5jaWVzIHVzZWQgaW4gdGhlIHNsb3QuIEludm9rZSB0aGUgc2xvdCBmdW5jdGlvbiBpbnNpZGUgdGhlIHJlbmRlciBmdW5jdGlvbiBpbnN0ZWFkLmBcbiAgICAgICk7XG4gICAgfVxuICAgIHJldHVybiBub3JtYWxpemVTbG90VmFsdWUocmF3U2xvdCguLi5hcmdzKSk7XG4gIH0sIGN0eCk7XG4gIG5vcm1hbGl6ZWQuX2MgPSBmYWxzZTtcbiAgcmV0dXJuIG5vcm1hbGl6ZWQ7XG59O1xuY29uc3Qgbm9ybWFsaXplT2JqZWN0U2xvdHMgPSAocmF3U2xvdHMsIHNsb3RzLCBpbnN0YW5jZSkgPT4ge1xuICBjb25zdCBjdHggPSByYXdTbG90cy5fY3R4O1xuICBmb3IgKGNvbnN0IGtleSBpbiByYXdTbG90cykge1xuICAgIGlmIChpc0ludGVybmFsS2V5KGtleSkpIGNvbnRpbnVlO1xuICAgIGNvbnN0IHZhbHVlID0gcmF3U2xvdHNba2V5XTtcbiAgICBpZiAoaXNGdW5jdGlvbih2YWx1ZSkpIHtcbiAgICAgIHNsb3RzW2tleV0gPSBub3JtYWxpemVTbG90KGtleSwgdmFsdWUsIGN0eCk7XG4gICAgfSBlbHNlIGlmICh2YWx1ZSAhPSBudWxsKSB7XG4gICAgICBpZiAoISEocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09IFwicHJvZHVjdGlvblwiKSAmJiB0cnVlKSB7XG4gICAgICAgIHdhcm4kMShcbiAgICAgICAgICBgTm9uLWZ1bmN0aW9uIHZhbHVlIGVuY291bnRlcmVkIGZvciBzbG90IFwiJHtrZXl9XCIuIFByZWZlciBmdW5jdGlvbiBzbG90cyBmb3IgYmV0dGVyIHBlcmZvcm1hbmNlLmBcbiAgICAgICAgKTtcbiAgICAgIH1cbiAgICAgIGNvbnN0IG5vcm1hbGl6ZWQgPSBub3JtYWxpemVTbG90VmFsdWUodmFsdWUpO1xuICAgICAgc2xvdHNba2V5XSA9ICgpID0+IG5vcm1hbGl6ZWQ7XG4gICAgfVxuICB9XG59O1xuY29uc3Qgbm9ybWFsaXplVk5vZGVTbG90cyA9IChpbnN0YW5jZSwgY2hpbGRyZW4pID0+IHtcbiAgaWYgKCEhKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSBcInByb2R1Y3Rpb25cIikgJiYgIWlzS2VlcEFsaXZlKGluc3RhbmNlLnZub2RlKSAmJiB0cnVlKSB7XG4gICAgd2FybiQxKFxuICAgICAgYE5vbi1mdW5jdGlvbiB2YWx1ZSBlbmNvdW50ZXJlZCBmb3IgZGVmYXVsdCBzbG90LiBQcmVmZXIgZnVuY3Rpb24gc2xvdHMgZm9yIGJldHRlciBwZXJmb3JtYW5jZS5gXG4gICAgKTtcbiAgfVxuICBjb25zdCBub3JtYWxpemVkID0gbm9ybWFsaXplU2xvdFZhbHVlKGNoaWxkcmVuKTtcbiAgaW5zdGFuY2Uuc2xvdHMuZGVmYXVsdCA9ICgpID0+IG5vcm1hbGl6ZWQ7XG59O1xuY29uc3QgYXNzaWduU2xvdHMgPSAoc2xvdHMsIGNoaWxkcmVuLCBvcHRpbWl6ZWQpID0+IHtcbiAgZm9yIChjb25zdCBrZXkgaW4gY2hpbGRyZW4pIHtcbiAgICBpZiAob3B0aW1pemVkIHx8ICFpc0ludGVybmFsS2V5KGtleSkpIHtcbiAgICAgIHNsb3RzW2tleV0gPSBjaGlsZHJlbltrZXldO1xuICAgIH1cbiAgfVxufTtcbmNvbnN0IGluaXRTbG90cyA9IChpbnN0YW5jZSwgY2hpbGRyZW4sIG9wdGltaXplZCkgPT4ge1xuICBjb25zdCBzbG90cyA9IGluc3RhbmNlLnNsb3RzID0gY3JlYXRlSW50ZXJuYWxPYmplY3QoKTtcbiAgaWYgKGluc3RhbmNlLnZub2RlLnNoYXBlRmxhZyAmIDMyKSB7XG4gICAgY29uc3QgdHlwZSA9IGNoaWxkcmVuLl87XG4gICAgaWYgKHR5cGUpIHtcbiAgICAgIGFzc2lnblNsb3RzKHNsb3RzLCBjaGlsZHJlbiwgb3B0aW1pemVkKTtcbiAgICAgIGlmIChvcHRpbWl6ZWQpIHtcbiAgICAgICAgZGVmKHNsb3RzLCBcIl9cIiwgdHlwZSwgdHJ1ZSk7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIG5vcm1hbGl6ZU9iamVjdFNsb3RzKGNoaWxkcmVuLCBzbG90cyk7XG4gICAgfVxuICB9IGVsc2UgaWYgKGNoaWxkcmVuKSB7XG4gICAgbm9ybWFsaXplVk5vZGVTbG90cyhpbnN0YW5jZSwgY2hpbGRyZW4pO1xuICB9XG59O1xuY29uc3QgdXBkYXRlU2xvdHMgPSAoaW5zdGFuY2UsIGNoaWxkcmVuLCBvcHRpbWl6ZWQpID0+IHtcbiAgY29uc3QgeyB2bm9kZSwgc2xvdHMgfSA9IGluc3RhbmNlO1xuICBsZXQgbmVlZERlbGV0aW9uQ2hlY2sgPSB0cnVlO1xuICBsZXQgZGVsZXRpb25Db21wYXJpc29uVGFyZ2V0ID0gRU1QVFlfT0JKO1xuICBpZiAodm5vZGUuc2hhcGVGbGFnICYgMzIpIHtcbiAgICBjb25zdCB0eXBlID0gY2hpbGRyZW4uXztcbiAgICBpZiAodHlwZSkge1xuICAgICAgaWYgKCEhKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSBcInByb2R1Y3Rpb25cIikgJiYgaXNIbXJVcGRhdGluZykge1xuICAgICAgICBhc3NpZ25TbG90cyhzbG90cywgY2hpbGRyZW4sIG9wdGltaXplZCk7XG4gICAgICAgIHRyaWdnZXIoaW5zdGFuY2UsIFwic2V0XCIsIFwiJHNsb3RzXCIpO1xuICAgICAgfSBlbHNlIGlmIChvcHRpbWl6ZWQgJiYgdHlwZSA9PT0gMSkge1xuICAgICAgICBuZWVkRGVsZXRpb25DaGVjayA9IGZhbHNlO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgYXNzaWduU2xvdHMoc2xvdHMsIGNoaWxkcmVuLCBvcHRpbWl6ZWQpO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBuZWVkRGVsZXRpb25DaGVjayA9ICFjaGlsZHJlbi4kc3RhYmxlO1xuICAgICAgbm9ybWFsaXplT2JqZWN0U2xvdHMoY2hpbGRyZW4sIHNsb3RzKTtcbiAgICB9XG4gICAgZGVsZXRpb25Db21wYXJpc29uVGFyZ2V0ID0gY2hpbGRyZW47XG4gIH0gZWxzZSBpZiAoY2hpbGRyZW4pIHtcbiAgICBub3JtYWxpemVWTm9kZVNsb3RzKGluc3RhbmNlLCBjaGlsZHJlbik7XG4gICAgZGVsZXRpb25Db21wYXJpc29uVGFyZ2V0ID0geyBkZWZhdWx0OiAxIH07XG4gIH1cbiAgaWYgKG5lZWREZWxldGlvbkNoZWNrKSB7XG4gICAgZm9yIChjb25zdCBrZXkgaW4gc2xvdHMpIHtcbiAgICAgIGlmICghaXNJbnRlcm5hbEtleShrZXkpICYmIGRlbGV0aW9uQ29tcGFyaXNvblRhcmdldFtrZXldID09IG51bGwpIHtcbiAgICAgICAgZGVsZXRlIHNsb3RzW2tleV07XG4gICAgICB9XG4gICAgfVxuICB9XG59O1xuXG5sZXQgc3VwcG9ydGVkO1xubGV0IHBlcmY7XG5mdW5jdGlvbiBzdGFydE1lYXN1cmUoaW5zdGFuY2UsIHR5cGUpIHtcbiAgaWYgKGluc3RhbmNlLmFwcENvbnRleHQuY29uZmlnLnBlcmZvcm1hbmNlICYmIGlzU3VwcG9ydGVkKCkpIHtcbiAgICBwZXJmLm1hcmsoYHZ1ZS0ke3R5cGV9LSR7aW5zdGFuY2UudWlkfWApO1xuICB9XG4gIGlmICghIShwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gXCJwcm9kdWN0aW9uXCIpIHx8IF9fVlVFX1BST0RfREVWVE9PTFNfXykge1xuICAgIGRldnRvb2xzUGVyZlN0YXJ0KGluc3RhbmNlLCB0eXBlLCBpc1N1cHBvcnRlZCgpID8gcGVyZi5ub3coKSA6IERhdGUubm93KCkpO1xuICB9XG59XG5mdW5jdGlvbiBlbmRNZWFzdXJlKGluc3RhbmNlLCB0eXBlKSB7XG4gIGlmIChpbnN0YW5jZS5hcHBDb250ZXh0LmNvbmZpZy5wZXJmb3JtYW5jZSAmJiBpc1N1cHBvcnRlZCgpKSB7XG4gICAgY29uc3Qgc3RhcnRUYWcgPSBgdnVlLSR7dHlwZX0tJHtpbnN0YW5jZS51aWR9YDtcbiAgICBjb25zdCBlbmRUYWcgPSBzdGFydFRhZyArIGA6ZW5kYDtcbiAgICBjb25zdCBtZWFzdXJlTmFtZSA9IGA8JHtmb3JtYXRDb21wb25lbnROYW1lKGluc3RhbmNlLCBpbnN0YW5jZS50eXBlKX0+ICR7dHlwZX1gO1xuICAgIHBlcmYubWFyayhlbmRUYWcpO1xuICAgIHBlcmYubWVhc3VyZShtZWFzdXJlTmFtZSwgc3RhcnRUYWcsIGVuZFRhZyk7XG4gICAgcGVyZi5jbGVhck1lYXN1cmVzKG1lYXN1cmVOYW1lKTtcbiAgICBwZXJmLmNsZWFyTWFya3Moc3RhcnRUYWcpO1xuICAgIHBlcmYuY2xlYXJNYXJrcyhlbmRUYWcpO1xuICB9XG4gIGlmICghIShwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gXCJwcm9kdWN0aW9uXCIpIHx8IF9fVlVFX1BST0RfREVWVE9PTFNfXykge1xuICAgIGRldnRvb2xzUGVyZkVuZChpbnN0YW5jZSwgdHlwZSwgaXNTdXBwb3J0ZWQoKSA/IHBlcmYubm93KCkgOiBEYXRlLm5vdygpKTtcbiAgfVxufVxuZnVuY3Rpb24gaXNTdXBwb3J0ZWQoKSB7XG4gIGlmIChzdXBwb3J0ZWQgIT09IHZvaWQgMCkge1xuICAgIHJldHVybiBzdXBwb3J0ZWQ7XG4gIH1cbiAgaWYgKHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgJiYgd2luZG93LnBlcmZvcm1hbmNlKSB7XG4gICAgc3VwcG9ydGVkID0gdHJ1ZTtcbiAgICBwZXJmID0gd2luZG93LnBlcmZvcm1hbmNlO1xuICB9IGVsc2Uge1xuICAgIHN1cHBvcnRlZCA9IGZhbHNlO1xuICB9XG4gIHJldHVybiBzdXBwb3J0ZWQ7XG59XG5cbmZ1bmN0aW9uIGluaXRGZWF0dXJlRmxhZ3MoKSB7XG4gIGNvbnN0IG5lZWRXYXJuID0gW107XG4gIGlmICh0eXBlb2YgX19WVUVfT1BUSU9OU19BUElfXyAhPT0gXCJib29sZWFuXCIpIHtcbiAgICAhIShwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gXCJwcm9kdWN0aW9uXCIpICYmIG5lZWRXYXJuLnB1c2goYF9fVlVFX09QVElPTlNfQVBJX19gKTtcbiAgICBnZXRHbG9iYWxUaGlzKCkuX19WVUVfT1BUSU9OU19BUElfXyA9IHRydWU7XG4gIH1cbiAgaWYgKHR5cGVvZiBfX1ZVRV9QUk9EX0RFVlRPT0xTX18gIT09IFwiYm9vbGVhblwiKSB7XG4gICAgISEocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09IFwicHJvZHVjdGlvblwiKSAmJiBuZWVkV2Fybi5wdXNoKGBfX1ZVRV9QUk9EX0RFVlRPT0xTX19gKTtcbiAgICBnZXRHbG9iYWxUaGlzKCkuX19WVUVfUFJPRF9ERVZUT09MU19fID0gZmFsc2U7XG4gIH1cbiAgaWYgKHR5cGVvZiBfX1ZVRV9QUk9EX0hZRFJBVElPTl9NSVNNQVRDSF9ERVRBSUxTX18gIT09IFwiYm9vbGVhblwiKSB7XG4gICAgISEocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09IFwicHJvZHVjdGlvblwiKSAmJiBuZWVkV2Fybi5wdXNoKGBfX1ZVRV9QUk9EX0hZRFJBVElPTl9NSVNNQVRDSF9ERVRBSUxTX19gKTtcbiAgICBnZXRHbG9iYWxUaGlzKCkuX19WVUVfUFJPRF9IWURSQVRJT05fTUlTTUFUQ0hfREVUQUlMU19fID0gZmFsc2U7XG4gIH1cbiAgaWYgKCEhKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSBcInByb2R1Y3Rpb25cIikgJiYgbmVlZFdhcm4ubGVuZ3RoKSB7XG4gICAgY29uc3QgbXVsdGkgPSBuZWVkV2Fybi5sZW5ndGggPiAxO1xuICAgIGNvbnNvbGUud2FybihcbiAgICAgIGBGZWF0dXJlIGZsYWcke211bHRpID8gYHNgIDogYGB9ICR7bmVlZFdhcm4uam9pbihcIiwgXCIpfSAke211bHRpID8gYGFyZWAgOiBgaXNgfSBub3QgZXhwbGljaXRseSBkZWZpbmVkLiBZb3UgYXJlIHJ1bm5pbmcgdGhlIGVzbS1idW5kbGVyIGJ1aWxkIG9mIFZ1ZSwgd2hpY2ggZXhwZWN0cyB0aGVzZSBjb21waWxlLXRpbWUgZmVhdHVyZSBmbGFncyB0byBiZSBnbG9iYWxseSBpbmplY3RlZCB2aWEgdGhlIGJ1bmRsZXIgY29uZmlnIGluIG9yZGVyIHRvIGdldCBiZXR0ZXIgdHJlZS1zaGFraW5nIGluIHRoZSBwcm9kdWN0aW9uIGJ1bmRsZS5cblxuRm9yIG1vcmUgZGV0YWlscywgc2VlIGh0dHBzOi8vbGluay52dWVqcy5vcmcvZmVhdHVyZS1mbGFncy5gXG4gICAgKTtcbiAgfVxufVxuXG5jb25zdCBxdWV1ZVBvc3RSZW5kZXJFZmZlY3QgPSBxdWV1ZUVmZmVjdFdpdGhTdXNwZW5zZSA7XG5mdW5jdGlvbiBjcmVhdGVSZW5kZXJlcihvcHRpb25zKSB7XG4gIHJldHVybiBiYXNlQ3JlYXRlUmVuZGVyZXIob3B0aW9ucyk7XG59XG5mdW5jdGlvbiBjcmVhdGVIeWRyYXRpb25SZW5kZXJlcihvcHRpb25zKSB7XG4gIHJldHVybiBiYXNlQ3JlYXRlUmVuZGVyZXIob3B0aW9ucywgY3JlYXRlSHlkcmF0aW9uRnVuY3Rpb25zKTtcbn1cbmZ1bmN0aW9uIGJhc2VDcmVhdGVSZW5kZXJlcihvcHRpb25zLCBjcmVhdGVIeWRyYXRpb25GbnMpIHtcbiAge1xuICAgIGluaXRGZWF0dXJlRmxhZ3MoKTtcbiAgfVxuICBjb25zdCB0YXJnZXQgPSBnZXRHbG9iYWxUaGlzKCk7XG4gIHRhcmdldC5fX1ZVRV9fID0gdHJ1ZTtcbiAgaWYgKCEhKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSBcInByb2R1Y3Rpb25cIikgfHwgX19WVUVfUFJPRF9ERVZUT09MU19fKSB7XG4gICAgc2V0RGV2dG9vbHNIb29rJDEodGFyZ2V0Ll9fVlVFX0RFVlRPT0xTX0dMT0JBTF9IT09LX18sIHRhcmdldCk7XG4gIH1cbiAgY29uc3Qge1xuICAgIGluc2VydDogaG9zdEluc2VydCxcbiAgICByZW1vdmU6IGhvc3RSZW1vdmUsXG4gICAgcGF0Y2hQcm9wOiBob3N0UGF0Y2hQcm9wLFxuICAgIGNyZWF0ZUVsZW1lbnQ6IGhvc3RDcmVhdGVFbGVtZW50LFxuICAgIGNyZWF0ZVRleHQ6IGhvc3RDcmVhdGVUZXh0LFxuICAgIGNyZWF0ZUNvbW1lbnQ6IGhvc3RDcmVhdGVDb21tZW50LFxuICAgIHNldFRleHQ6IGhvc3RTZXRUZXh0LFxuICAgIHNldEVsZW1lbnRUZXh0OiBob3N0U2V0RWxlbWVudFRleHQsXG4gICAgcGFyZW50Tm9kZTogaG9zdFBhcmVudE5vZGUsXG4gICAgbmV4dFNpYmxpbmc6IGhvc3ROZXh0U2libGluZyxcbiAgICBzZXRTY29wZUlkOiBob3N0U2V0U2NvcGVJZCA9IE5PT1AsXG4gICAgaW5zZXJ0U3RhdGljQ29udGVudDogaG9zdEluc2VydFN0YXRpY0NvbnRlbnRcbiAgfSA9IG9wdGlvbnM7XG4gIGNvbnN0IHBhdGNoID0gKG4xLCBuMiwgY29udGFpbmVyLCBhbmNob3IgPSBudWxsLCBwYXJlbnRDb21wb25lbnQgPSBudWxsLCBwYXJlbnRTdXNwZW5zZSA9IG51bGwsIG5hbWVzcGFjZSA9IHZvaWQgMCwgc2xvdFNjb3BlSWRzID0gbnVsbCwgb3B0aW1pemVkID0gISEocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09IFwicHJvZHVjdGlvblwiKSAmJiBpc0htclVwZGF0aW5nID8gZmFsc2UgOiAhIW4yLmR5bmFtaWNDaGlsZHJlbikgPT4ge1xuICAgIGlmIChuMSA9PT0gbjIpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgaWYgKG4xICYmICFpc1NhbWVWTm9kZVR5cGUobjEsIG4yKSkge1xuICAgICAgYW5jaG9yID0gZ2V0TmV4dEhvc3ROb2RlKG4xKTtcbiAgICAgIHVubW91bnQobjEsIHBhcmVudENvbXBvbmVudCwgcGFyZW50U3VzcGVuc2UsIHRydWUpO1xuICAgICAgbjEgPSBudWxsO1xuICAgIH1cbiAgICBpZiAobjIucGF0Y2hGbGFnID09PSAtMikge1xuICAgICAgb3B0aW1pemVkID0gZmFsc2U7XG4gICAgICBuMi5keW5hbWljQ2hpbGRyZW4gPSBudWxsO1xuICAgIH1cbiAgICBjb25zdCB7IHR5cGUsIHJlZiwgc2hhcGVGbGFnIH0gPSBuMjtcbiAgICBzd2l0Y2ggKHR5cGUpIHtcbiAgICAgIGNhc2UgVGV4dDpcbiAgICAgICAgcHJvY2Vzc1RleHQobjEsIG4yLCBjb250YWluZXIsIGFuY2hvcik7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBDb21tZW50OlxuICAgICAgICBwcm9jZXNzQ29tbWVudE5vZGUobjEsIG4yLCBjb250YWluZXIsIGFuY2hvcik7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBTdGF0aWM6XG4gICAgICAgIGlmIChuMSA9PSBudWxsKSB7XG4gICAgICAgICAgbW91bnRTdGF0aWNOb2RlKG4yLCBjb250YWluZXIsIGFuY2hvciwgbmFtZXNwYWNlKTtcbiAgICAgICAgfSBlbHNlIGlmICghIShwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gXCJwcm9kdWN0aW9uXCIpKSB7XG4gICAgICAgICAgcGF0Y2hTdGF0aWNOb2RlKG4xLCBuMiwgY29udGFpbmVyLCBuYW1lc3BhY2UpO1xuICAgICAgICB9XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBGcmFnbWVudDpcbiAgICAgICAgcHJvY2Vzc0ZyYWdtZW50KFxuICAgICAgICAgIG4xLFxuICAgICAgICAgIG4yLFxuICAgICAgICAgIGNvbnRhaW5lcixcbiAgICAgICAgICBhbmNob3IsXG4gICAgICAgICAgcGFyZW50Q29tcG9uZW50LFxuICAgICAgICAgIHBhcmVudFN1c3BlbnNlLFxuICAgICAgICAgIG5hbWVzcGFjZSxcbiAgICAgICAgICBzbG90U2NvcGVJZHMsXG4gICAgICAgICAgb3B0aW1pemVkXG4gICAgICAgICk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgZGVmYXVsdDpcbiAgICAgICAgaWYgKHNoYXBlRmxhZyAmIDEpIHtcbiAgICAgICAgICBwcm9jZXNzRWxlbWVudChcbiAgICAgICAgICAgIG4xLFxuICAgICAgICAgICAgbjIsXG4gICAgICAgICAgICBjb250YWluZXIsXG4gICAgICAgICAgICBhbmNob3IsXG4gICAgICAgICAgICBwYXJlbnRDb21wb25lbnQsXG4gICAgICAgICAgICBwYXJlbnRTdXNwZW5zZSxcbiAgICAgICAgICAgIG5hbWVzcGFjZSxcbiAgICAgICAgICAgIHNsb3RTY29wZUlkcyxcbiAgICAgICAgICAgIG9wdGltaXplZFxuICAgICAgICAgICk7XG4gICAgICAgIH0gZWxzZSBpZiAoc2hhcGVGbGFnICYgNikge1xuICAgICAgICAgIHByb2Nlc3NDb21wb25lbnQoXG4gICAgICAgICAgICBuMSxcbiAgICAgICAgICAgIG4yLFxuICAgICAgICAgICAgY29udGFpbmVyLFxuICAgICAgICAgICAgYW5jaG9yLFxuICAgICAgICAgICAgcGFyZW50Q29tcG9uZW50LFxuICAgICAgICAgICAgcGFyZW50U3VzcGVuc2UsXG4gICAgICAgICAgICBuYW1lc3BhY2UsXG4gICAgICAgICAgICBzbG90U2NvcGVJZHMsXG4gICAgICAgICAgICBvcHRpbWl6ZWRcbiAgICAgICAgICApO1xuICAgICAgICB9IGVsc2UgaWYgKHNoYXBlRmxhZyAmIDY0KSB7XG4gICAgICAgICAgdHlwZS5wcm9jZXNzKFxuICAgICAgICAgICAgbjEsXG4gICAgICAgICAgICBuMixcbiAgICAgICAgICAgIGNvbnRhaW5lcixcbiAgICAgICAgICAgIGFuY2hvcixcbiAgICAgICAgICAgIHBhcmVudENvbXBvbmVudCxcbiAgICAgICAgICAgIHBhcmVudFN1c3BlbnNlLFxuICAgICAgICAgICAgbmFtZXNwYWNlLFxuICAgICAgICAgICAgc2xvdFNjb3BlSWRzLFxuICAgICAgICAgICAgb3B0aW1pemVkLFxuICAgICAgICAgICAgaW50ZXJuYWxzXG4gICAgICAgICAgKTtcbiAgICAgICAgfSBlbHNlIGlmIChzaGFwZUZsYWcgJiAxMjgpIHtcbiAgICAgICAgICB0eXBlLnByb2Nlc3MoXG4gICAgICAgICAgICBuMSxcbiAgICAgICAgICAgIG4yLFxuICAgICAgICAgICAgY29udGFpbmVyLFxuICAgICAgICAgICAgYW5jaG9yLFxuICAgICAgICAgICAgcGFyZW50Q29tcG9uZW50LFxuICAgICAgICAgICAgcGFyZW50U3VzcGVuc2UsXG4gICAgICAgICAgICBuYW1lc3BhY2UsXG4gICAgICAgICAgICBzbG90U2NvcGVJZHMsXG4gICAgICAgICAgICBvcHRpbWl6ZWQsXG4gICAgICAgICAgICBpbnRlcm5hbHNcbiAgICAgICAgICApO1xuICAgICAgICB9IGVsc2UgaWYgKCEhKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSBcInByb2R1Y3Rpb25cIikpIHtcbiAgICAgICAgICB3YXJuJDEoXCJJbnZhbGlkIFZOb2RlIHR5cGU6XCIsIHR5cGUsIGAoJHt0eXBlb2YgdHlwZX0pYCk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgaWYgKHJlZiAhPSBudWxsICYmIHBhcmVudENvbXBvbmVudCkge1xuICAgICAgc2V0UmVmKHJlZiwgbjEgJiYgbjEucmVmLCBwYXJlbnRTdXNwZW5zZSwgbjIgfHwgbjEsICFuMik7XG4gICAgfSBlbHNlIGlmIChyZWYgPT0gbnVsbCAmJiBuMSAmJiBuMS5yZWYgIT0gbnVsbCkge1xuICAgICAgc2V0UmVmKG4xLnJlZiwgbnVsbCwgcGFyZW50U3VzcGVuc2UsIG4xLCB0cnVlKTtcbiAgICB9XG4gIH07XG4gIGNvbnN0IHByb2Nlc3NUZXh0ID0gKG4xLCBuMiwgY29udGFpbmVyLCBhbmNob3IpID0+IHtcbiAgICBpZiAobjEgPT0gbnVsbCkge1xuICAgICAgaG9zdEluc2VydChcbiAgICAgICAgbjIuZWwgPSBob3N0Q3JlYXRlVGV4dChuMi5jaGlsZHJlbiksXG4gICAgICAgIGNvbnRhaW5lcixcbiAgICAgICAgYW5jaG9yXG4gICAgICApO1xuICAgIH0gZWxzZSB7XG4gICAgICBjb25zdCBlbCA9IG4yLmVsID0gbjEuZWw7XG4gICAgICBpZiAobjIuY2hpbGRyZW4gIT09IG4xLmNoaWxkcmVuKSB7XG4gICAgICAgIGhvc3RTZXRUZXh0KGVsLCBuMi5jaGlsZHJlbik7XG4gICAgICB9XG4gICAgfVxuICB9O1xuICBjb25zdCBwcm9jZXNzQ29tbWVudE5vZGUgPSAobjEsIG4yLCBjb250YWluZXIsIGFuY2hvcikgPT4ge1xuICAgIGlmIChuMSA9PSBudWxsKSB7XG4gICAgICBob3N0SW5zZXJ0KFxuICAgICAgICBuMi5lbCA9IGhvc3RDcmVhdGVDb21tZW50KG4yLmNoaWxkcmVuIHx8IFwiXCIpLFxuICAgICAgICBjb250YWluZXIsXG4gICAgICAgIGFuY2hvclxuICAgICAgKTtcbiAgICB9IGVsc2Uge1xuICAgICAgbjIuZWwgPSBuMS5lbDtcbiAgICB9XG4gIH07XG4gIGNvbnN0IG1vdW50U3RhdGljTm9kZSA9IChuMiwgY29udGFpbmVyLCBhbmNob3IsIG5hbWVzcGFjZSkgPT4ge1xuICAgIFtuMi5lbCwgbjIuYW5jaG9yXSA9IGhvc3RJbnNlcnRTdGF0aWNDb250ZW50KFxuICAgICAgbjIuY2hpbGRyZW4sXG4gICAgICBjb250YWluZXIsXG4gICAgICBhbmNob3IsXG4gICAgICBuYW1lc3BhY2UsXG4gICAgICBuMi5lbCxcbiAgICAgIG4yLmFuY2hvclxuICAgICk7XG4gIH07XG4gIGNvbnN0IHBhdGNoU3RhdGljTm9kZSA9IChuMSwgbjIsIGNvbnRhaW5lciwgbmFtZXNwYWNlKSA9PiB7XG4gICAgaWYgKG4yLmNoaWxkcmVuICE9PSBuMS5jaGlsZHJlbikge1xuICAgICAgY29uc3QgYW5jaG9yID0gaG9zdE5leHRTaWJsaW5nKG4xLmFuY2hvcik7XG4gICAgICByZW1vdmVTdGF0aWNOb2RlKG4xKTtcbiAgICAgIFtuMi5lbCwgbjIuYW5jaG9yXSA9IGhvc3RJbnNlcnRTdGF0aWNDb250ZW50KFxuICAgICAgICBuMi5jaGlsZHJlbixcbiAgICAgICAgY29udGFpbmVyLFxuICAgICAgICBhbmNob3IsXG4gICAgICAgIG5hbWVzcGFjZVxuICAgICAgKTtcbiAgICB9IGVsc2Uge1xuICAgICAgbjIuZWwgPSBuMS5lbDtcbiAgICAgIG4yLmFuY2hvciA9IG4xLmFuY2hvcjtcbiAgICB9XG4gIH07XG4gIGNvbnN0IG1vdmVTdGF0aWNOb2RlID0gKHsgZWwsIGFuY2hvciB9LCBjb250YWluZXIsIG5leHRTaWJsaW5nKSA9PiB7XG4gICAgbGV0IG5leHQ7XG4gICAgd2hpbGUgKGVsICYmIGVsICE9PSBhbmNob3IpIHtcbiAgICAgIG5leHQgPSBob3N0TmV4dFNpYmxpbmcoZWwpO1xuICAgICAgaG9zdEluc2VydChlbCwgY29udGFpbmVyLCBuZXh0U2libGluZyk7XG4gICAgICBlbCA9IG5leHQ7XG4gICAgfVxuICAgIGhvc3RJbnNlcnQoYW5jaG9yLCBjb250YWluZXIsIG5leHRTaWJsaW5nKTtcbiAgfTtcbiAgY29uc3QgcmVtb3ZlU3RhdGljTm9kZSA9ICh7IGVsLCBhbmNob3IgfSkgPT4ge1xuICAgIGxldCBuZXh0O1xuICAgIHdoaWxlIChlbCAmJiBlbCAhPT0gYW5jaG9yKSB7XG4gICAgICBuZXh0ID0gaG9zdE5leHRTaWJsaW5nKGVsKTtcbiAgICAgIGhvc3RSZW1vdmUoZWwpO1xuICAgICAgZWwgPSBuZXh0O1xuICAgIH1cbiAgICBob3N0UmVtb3ZlKGFuY2hvcik7XG4gIH07XG4gIGNvbnN0IHByb2Nlc3NFbGVtZW50ID0gKG4xLCBuMiwgY29udGFpbmVyLCBhbmNob3IsIHBhcmVudENvbXBvbmVudCwgcGFyZW50U3VzcGVuc2UsIG5hbWVzcGFjZSwgc2xvdFNjb3BlSWRzLCBvcHRpbWl6ZWQpID0+IHtcbiAgICBpZiAobjIudHlwZSA9PT0gXCJzdmdcIikge1xuICAgICAgbmFtZXNwYWNlID0gXCJzdmdcIjtcbiAgICB9IGVsc2UgaWYgKG4yLnR5cGUgPT09IFwibWF0aFwiKSB7XG4gICAgICBuYW1lc3BhY2UgPSBcIm1hdGhtbFwiO1xuICAgIH1cbiAgICBpZiAobjEgPT0gbnVsbCkge1xuICAgICAgbW91bnRFbGVtZW50KFxuICAgICAgICBuMixcbiAgICAgICAgY29udGFpbmVyLFxuICAgICAgICBhbmNob3IsXG4gICAgICAgIHBhcmVudENvbXBvbmVudCxcbiAgICAgICAgcGFyZW50U3VzcGVuc2UsXG4gICAgICAgIG5hbWVzcGFjZSxcbiAgICAgICAgc2xvdFNjb3BlSWRzLFxuICAgICAgICBvcHRpbWl6ZWRcbiAgICAgICk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnN0IGN1c3RvbUVsZW1lbnQgPSBuMS5lbCAmJiBuMS5lbC5faXNWdWVDRSA/IG4xLmVsIDogbnVsbDtcbiAgICAgIHRyeSB7XG4gICAgICAgIGlmIChjdXN0b21FbGVtZW50KSB7XG4gICAgICAgICAgY3VzdG9tRWxlbWVudC5fYmVnaW5QYXRjaCgpO1xuICAgICAgICB9XG4gICAgICAgIHBhdGNoRWxlbWVudChcbiAgICAgICAgICBuMSxcbiAgICAgICAgICBuMixcbiAgICAgICAgICBwYXJlbnRDb21wb25lbnQsXG4gICAgICAgICAgcGFyZW50U3VzcGVuc2UsXG4gICAgICAgICAgbmFtZXNwYWNlLFxuICAgICAgICAgIHNsb3RTY29wZUlkcyxcbiAgICAgICAgICBvcHRpbWl6ZWRcbiAgICAgICAgKTtcbiAgICAgIH0gZmluYWxseSB7XG4gICAgICAgIGlmIChjdXN0b21FbGVtZW50KSB7XG4gICAgICAgICAgY3VzdG9tRWxlbWVudC5fZW5kUGF0Y2goKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfTtcbiAgY29uc3QgbW91bnRFbGVtZW50ID0gKHZub2RlLCBjb250YWluZXIsIGFuY2hvciwgcGFyZW50Q29tcG9uZW50LCBwYXJlbnRTdXNwZW5zZSwgbmFtZXNwYWNlLCBzbG90U2NvcGVJZHMsIG9wdGltaXplZCkgPT4ge1xuICAgIGxldCBlbDtcbiAgICBsZXQgdm5vZGVIb29rO1xuICAgIGNvbnN0IHsgcHJvcHMsIHNoYXBlRmxhZywgdHJhbnNpdGlvbiwgZGlycyB9ID0gdm5vZGU7XG4gICAgZWwgPSB2bm9kZS5lbCA9IGhvc3RDcmVhdGVFbGVtZW50KFxuICAgICAgdm5vZGUudHlwZSxcbiAgICAgIG5hbWVzcGFjZSxcbiAgICAgIHByb3BzICYmIHByb3BzLmlzLFxuICAgICAgcHJvcHNcbiAgICApO1xuICAgIGlmIChzaGFwZUZsYWcgJiA4KSB7XG4gICAgICBob3N0U2V0RWxlbWVudFRleHQoZWwsIHZub2RlLmNoaWxkcmVuKTtcbiAgICB9IGVsc2UgaWYgKHNoYXBlRmxhZyAmIDE2KSB7XG4gICAgICBtb3VudENoaWxkcmVuKFxuICAgICAgICB2bm9kZS5jaGlsZHJlbixcbiAgICAgICAgZWwsXG4gICAgICAgIG51bGwsXG4gICAgICAgIHBhcmVudENvbXBvbmVudCxcbiAgICAgICAgcGFyZW50U3VzcGVuc2UsXG4gICAgICAgIHJlc29sdmVDaGlsZHJlbk5hbWVzcGFjZSh2bm9kZSwgbmFtZXNwYWNlKSxcbiAgICAgICAgc2xvdFNjb3BlSWRzLFxuICAgICAgICBvcHRpbWl6ZWRcbiAgICAgICk7XG4gICAgfVxuICAgIGlmIChkaXJzKSB7XG4gICAgICBpbnZva2VEaXJlY3RpdmVIb29rKHZub2RlLCBudWxsLCBwYXJlbnRDb21wb25lbnQsIFwiY3JlYXRlZFwiKTtcbiAgICB9XG4gICAgc2V0U2NvcGVJZChlbCwgdm5vZGUsIHZub2RlLnNjb3BlSWQsIHNsb3RTY29wZUlkcywgcGFyZW50Q29tcG9uZW50KTtcbiAgICBpZiAocHJvcHMpIHtcbiAgICAgIGZvciAoY29uc3Qga2V5IGluIHByb3BzKSB7XG4gICAgICAgIGlmIChrZXkgIT09IFwidmFsdWVcIiAmJiAhaXNSZXNlcnZlZFByb3Aoa2V5KSkge1xuICAgICAgICAgIGhvc3RQYXRjaFByb3AoZWwsIGtleSwgbnVsbCwgcHJvcHNba2V5XSwgbmFtZXNwYWNlLCBwYXJlbnRDb21wb25lbnQpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBpZiAoXCJ2YWx1ZVwiIGluIHByb3BzKSB7XG4gICAgICAgIGhvc3RQYXRjaFByb3AoZWwsIFwidmFsdWVcIiwgbnVsbCwgcHJvcHMudmFsdWUsIG5hbWVzcGFjZSk7XG4gICAgICB9XG4gICAgICBpZiAodm5vZGVIb29rID0gcHJvcHMub25Wbm9kZUJlZm9yZU1vdW50KSB7XG4gICAgICAgIGludm9rZVZOb2RlSG9vayh2bm9kZUhvb2ssIHBhcmVudENvbXBvbmVudCwgdm5vZGUpO1xuICAgICAgfVxuICAgIH1cbiAgICBpZiAoISEocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09IFwicHJvZHVjdGlvblwiKSB8fCBfX1ZVRV9QUk9EX0RFVlRPT0xTX18pIHtcbiAgICAgIGRlZihlbCwgXCJfX3Zub2RlXCIsIHZub2RlLCB0cnVlKTtcbiAgICAgIGRlZihlbCwgXCJfX3Z1ZVBhcmVudENvbXBvbmVudFwiLCBwYXJlbnRDb21wb25lbnQsIHRydWUpO1xuICAgIH1cbiAgICBpZiAoZGlycykge1xuICAgICAgaW52b2tlRGlyZWN0aXZlSG9vayh2bm9kZSwgbnVsbCwgcGFyZW50Q29tcG9uZW50LCBcImJlZm9yZU1vdW50XCIpO1xuICAgIH1cbiAgICBjb25zdCBuZWVkQ2FsbFRyYW5zaXRpb25Ib29rcyA9IG5lZWRUcmFuc2l0aW9uKHBhcmVudFN1c3BlbnNlLCB0cmFuc2l0aW9uKTtcbiAgICBpZiAobmVlZENhbGxUcmFuc2l0aW9uSG9va3MpIHtcbiAgICAgIHRyYW5zaXRpb24uYmVmb3JlRW50ZXIoZWwpO1xuICAgIH1cbiAgICBob3N0SW5zZXJ0KGVsLCBjb250YWluZXIsIGFuY2hvcik7XG4gICAgaWYgKCh2bm9kZUhvb2sgPSBwcm9wcyAmJiBwcm9wcy5vblZub2RlTW91bnRlZCkgfHwgbmVlZENhbGxUcmFuc2l0aW9uSG9va3MgfHwgZGlycykge1xuICAgICAgcXVldWVQb3N0UmVuZGVyRWZmZWN0KCgpID0+IHtcbiAgICAgICAgdm5vZGVIb29rICYmIGludm9rZVZOb2RlSG9vayh2bm9kZUhvb2ssIHBhcmVudENvbXBvbmVudCwgdm5vZGUpO1xuICAgICAgICBuZWVkQ2FsbFRyYW5zaXRpb25Ib29rcyAmJiB0cmFuc2l0aW9uLmVudGVyKGVsKTtcbiAgICAgICAgZGlycyAmJiBpbnZva2VEaXJlY3RpdmVIb29rKHZub2RlLCBudWxsLCBwYXJlbnRDb21wb25lbnQsIFwibW91bnRlZFwiKTtcbiAgICAgIH0sIHBhcmVudFN1c3BlbnNlKTtcbiAgICB9XG4gIH07XG4gIGNvbnN0IHNldFNjb3BlSWQgPSAoZWwsIHZub2RlLCBzY29wZUlkLCBzbG90U2NvcGVJZHMsIHBhcmVudENvbXBvbmVudCkgPT4ge1xuICAgIGlmIChzY29wZUlkKSB7XG4gICAgICBob3N0U2V0U2NvcGVJZChlbCwgc2NvcGVJZCk7XG4gICAgfVxuICAgIGlmIChzbG90U2NvcGVJZHMpIHtcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgc2xvdFNjb3BlSWRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGhvc3RTZXRTY29wZUlkKGVsLCBzbG90U2NvcGVJZHNbaV0pO1xuICAgICAgfVxuICAgIH1cbiAgICBpZiAocGFyZW50Q29tcG9uZW50KSB7XG4gICAgICBsZXQgc3ViVHJlZSA9IHBhcmVudENvbXBvbmVudC5zdWJUcmVlO1xuICAgICAgaWYgKCEhKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSBcInByb2R1Y3Rpb25cIikgJiYgc3ViVHJlZS5wYXRjaEZsYWcgPiAwICYmIHN1YlRyZWUucGF0Y2hGbGFnICYgMjA0OCkge1xuICAgICAgICBzdWJUcmVlID0gZmlsdGVyU2luZ2xlUm9vdChzdWJUcmVlLmNoaWxkcmVuKSB8fCBzdWJUcmVlO1xuICAgICAgfVxuICAgICAgaWYgKHZub2RlID09PSBzdWJUcmVlIHx8IGlzU3VzcGVuc2Uoc3ViVHJlZS50eXBlKSAmJiAoc3ViVHJlZS5zc0NvbnRlbnQgPT09IHZub2RlIHx8IHN1YlRyZWUuc3NGYWxsYmFjayA9PT0gdm5vZGUpKSB7XG4gICAgICAgIGNvbnN0IHBhcmVudFZOb2RlID0gcGFyZW50Q29tcG9uZW50LnZub2RlO1xuICAgICAgICBzZXRTY29wZUlkKFxuICAgICAgICAgIGVsLFxuICAgICAgICAgIHBhcmVudFZOb2RlLFxuICAgICAgICAgIHBhcmVudFZOb2RlLnNjb3BlSWQsXG4gICAgICAgICAgcGFyZW50Vk5vZGUuc2xvdFNjb3BlSWRzLFxuICAgICAgICAgIHBhcmVudENvbXBvbmVudC5wYXJlbnRcbiAgICAgICAgKTtcbiAgICAgIH1cbiAgICB9XG4gIH07XG4gIGNvbnN0IG1vdW50Q2hpbGRyZW4gPSAoY2hpbGRyZW4sIGNvbnRhaW5lciwgYW5jaG9yLCBwYXJlbnRDb21wb25lbnQsIHBhcmVudFN1c3BlbnNlLCBuYW1lc3BhY2UsIHNsb3RTY29wZUlkcywgb3B0aW1pemVkLCBzdGFydCA9IDApID0+IHtcbiAgICBmb3IgKGxldCBpID0gc3RhcnQ7IGkgPCBjaGlsZHJlbi5sZW5ndGg7IGkrKykge1xuICAgICAgY29uc3QgY2hpbGQgPSBjaGlsZHJlbltpXSA9IG9wdGltaXplZCA/IGNsb25lSWZNb3VudGVkKGNoaWxkcmVuW2ldKSA6IG5vcm1hbGl6ZVZOb2RlKGNoaWxkcmVuW2ldKTtcbiAgICAgIHBhdGNoKFxuICAgICAgICBudWxsLFxuICAgICAgICBjaGlsZCxcbiAgICAgICAgY29udGFpbmVyLFxuICAgICAgICBhbmNob3IsXG4gICAgICAgIHBhcmVudENvbXBvbmVudCxcbiAgICAgICAgcGFyZW50U3VzcGVuc2UsXG4gICAgICAgIG5hbWVzcGFjZSxcbiAgICAgICAgc2xvdFNjb3BlSWRzLFxuICAgICAgICBvcHRpbWl6ZWRcbiAgICAgICk7XG4gICAgfVxuICB9O1xuICBjb25zdCBwYXRjaEVsZW1lbnQgPSAobjEsIG4yLCBwYXJlbnRDb21wb25lbnQsIHBhcmVudFN1c3BlbnNlLCBuYW1lc3BhY2UsIHNsb3RTY29wZUlkcywgb3B0aW1pemVkKSA9PiB7XG4gICAgY29uc3QgZWwgPSBuMi5lbCA9IG4xLmVsO1xuICAgIGlmICghIShwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gXCJwcm9kdWN0aW9uXCIpIHx8IF9fVlVFX1BST0RfREVWVE9PTFNfXykge1xuICAgICAgZWwuX192bm9kZSA9IG4yO1xuICAgIH1cbiAgICBsZXQgeyBwYXRjaEZsYWcsIGR5bmFtaWNDaGlsZHJlbiwgZGlycyB9ID0gbjI7XG4gICAgcGF0Y2hGbGFnIHw9IG4xLnBhdGNoRmxhZyAmIDE2O1xuICAgIGNvbnN0IG9sZFByb3BzID0gbjEucHJvcHMgfHwgRU1QVFlfT0JKO1xuICAgIGNvbnN0IG5ld1Byb3BzID0gbjIucHJvcHMgfHwgRU1QVFlfT0JKO1xuICAgIGxldCB2bm9kZUhvb2s7XG4gICAgcGFyZW50Q29tcG9uZW50ICYmIHRvZ2dsZVJlY3Vyc2UocGFyZW50Q29tcG9uZW50LCBmYWxzZSk7XG4gICAgaWYgKHZub2RlSG9vayA9IG5ld1Byb3BzLm9uVm5vZGVCZWZvcmVVcGRhdGUpIHtcbiAgICAgIGludm9rZVZOb2RlSG9vayh2bm9kZUhvb2ssIHBhcmVudENvbXBvbmVudCwgbjIsIG4xKTtcbiAgICB9XG4gICAgaWYgKGRpcnMpIHtcbiAgICAgIGludm9rZURpcmVjdGl2ZUhvb2sobjIsIG4xLCBwYXJlbnRDb21wb25lbnQsIFwiYmVmb3JlVXBkYXRlXCIpO1xuICAgIH1cbiAgICBwYXJlbnRDb21wb25lbnQgJiYgdG9nZ2xlUmVjdXJzZShwYXJlbnRDb21wb25lbnQsIHRydWUpO1xuICAgIGlmICghIShwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gXCJwcm9kdWN0aW9uXCIpICYmIGlzSG1yVXBkYXRpbmcpIHtcbiAgICAgIHBhdGNoRmxhZyA9IDA7XG4gICAgICBvcHRpbWl6ZWQgPSBmYWxzZTtcbiAgICAgIGR5bmFtaWNDaGlsZHJlbiA9IG51bGw7XG4gICAgfVxuICAgIGlmIChvbGRQcm9wcy5pbm5lckhUTUwgJiYgbmV3UHJvcHMuaW5uZXJIVE1MID09IG51bGwgfHwgb2xkUHJvcHMudGV4dENvbnRlbnQgJiYgbmV3UHJvcHMudGV4dENvbnRlbnQgPT0gbnVsbCkge1xuICAgICAgaG9zdFNldEVsZW1lbnRUZXh0KGVsLCBcIlwiKTtcbiAgICB9XG4gICAgaWYgKGR5bmFtaWNDaGlsZHJlbikge1xuICAgICAgcGF0Y2hCbG9ja0NoaWxkcmVuKFxuICAgICAgICBuMS5keW5hbWljQ2hpbGRyZW4sXG4gICAgICAgIGR5bmFtaWNDaGlsZHJlbixcbiAgICAgICAgZWwsXG4gICAgICAgIHBhcmVudENvbXBvbmVudCxcbiAgICAgICAgcGFyZW50U3VzcGVuc2UsXG4gICAgICAgIHJlc29sdmVDaGlsZHJlbk5hbWVzcGFjZShuMiwgbmFtZXNwYWNlKSxcbiAgICAgICAgc2xvdFNjb3BlSWRzXG4gICAgICApO1xuICAgICAgaWYgKCEhKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSBcInByb2R1Y3Rpb25cIikpIHtcbiAgICAgICAgdHJhdmVyc2VTdGF0aWNDaGlsZHJlbihuMSwgbjIpO1xuICAgICAgfVxuICAgIH0gZWxzZSBpZiAoIW9wdGltaXplZCkge1xuICAgICAgcGF0Y2hDaGlsZHJlbihcbiAgICAgICAgbjEsXG4gICAgICAgIG4yLFxuICAgICAgICBlbCxcbiAgICAgICAgbnVsbCxcbiAgICAgICAgcGFyZW50Q29tcG9uZW50LFxuICAgICAgICBwYXJlbnRTdXNwZW5zZSxcbiAgICAgICAgcmVzb2x2ZUNoaWxkcmVuTmFtZXNwYWNlKG4yLCBuYW1lc3BhY2UpLFxuICAgICAgICBzbG90U2NvcGVJZHMsXG4gICAgICAgIGZhbHNlXG4gICAgICApO1xuICAgIH1cbiAgICBpZiAocGF0Y2hGbGFnID4gMCkge1xuICAgICAgaWYgKHBhdGNoRmxhZyAmIDE2KSB7XG4gICAgICAgIHBhdGNoUHJvcHMoZWwsIG9sZFByb3BzLCBuZXdQcm9wcywgcGFyZW50Q29tcG9uZW50LCBuYW1lc3BhY2UpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaWYgKHBhdGNoRmxhZyAmIDIpIHtcbiAgICAgICAgICBpZiAob2xkUHJvcHMuY2xhc3MgIT09IG5ld1Byb3BzLmNsYXNzKSB7XG4gICAgICAgICAgICBob3N0UGF0Y2hQcm9wKGVsLCBcImNsYXNzXCIsIG51bGwsIG5ld1Byb3BzLmNsYXNzLCBuYW1lc3BhY2UpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAocGF0Y2hGbGFnICYgNCkge1xuICAgICAgICAgIGhvc3RQYXRjaFByb3AoZWwsIFwic3R5bGVcIiwgb2xkUHJvcHMuc3R5bGUsIG5ld1Byb3BzLnN0eWxlLCBuYW1lc3BhY2UpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChwYXRjaEZsYWcgJiA4KSB7XG4gICAgICAgICAgY29uc3QgcHJvcHNUb1VwZGF0ZSA9IG4yLmR5bmFtaWNQcm9wcztcbiAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHByb3BzVG9VcGRhdGUubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGNvbnN0IGtleSA9IHByb3BzVG9VcGRhdGVbaV07XG4gICAgICAgICAgICBjb25zdCBwcmV2ID0gb2xkUHJvcHNba2V5XTtcbiAgICAgICAgICAgIGNvbnN0IG5leHQgPSBuZXdQcm9wc1trZXldO1xuICAgICAgICAgICAgaWYgKG5leHQgIT09IHByZXYgfHwga2V5ID09PSBcInZhbHVlXCIpIHtcbiAgICAgICAgICAgICAgaG9zdFBhdGNoUHJvcChlbCwga2V5LCBwcmV2LCBuZXh0LCBuYW1lc3BhY2UsIHBhcmVudENvbXBvbmVudCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICBpZiAocGF0Y2hGbGFnICYgMSkge1xuICAgICAgICBpZiAobjEuY2hpbGRyZW4gIT09IG4yLmNoaWxkcmVuKSB7XG4gICAgICAgICAgaG9zdFNldEVsZW1lbnRUZXh0KGVsLCBuMi5jaGlsZHJlbik7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKCFvcHRpbWl6ZWQgJiYgZHluYW1pY0NoaWxkcmVuID09IG51bGwpIHtcbiAgICAgIHBhdGNoUHJvcHMoZWwsIG9sZFByb3BzLCBuZXdQcm9wcywgcGFyZW50Q29tcG9uZW50LCBuYW1lc3BhY2UpO1xuICAgIH1cbiAgICBpZiAoKHZub2RlSG9vayA9IG5ld1Byb3BzLm9uVm5vZGVVcGRhdGVkKSB8fCBkaXJzKSB7XG4gICAgICBxdWV1ZVBvc3RSZW5kZXJFZmZlY3QoKCkgPT4ge1xuICAgICAgICB2bm9kZUhvb2sgJiYgaW52b2tlVk5vZGVIb29rKHZub2RlSG9vaywgcGFyZW50Q29tcG9uZW50LCBuMiwgbjEpO1xuICAgICAgICBkaXJzICYmIGludm9rZURpcmVjdGl2ZUhvb2sobjIsIG4xLCBwYXJlbnRDb21wb25lbnQsIFwidXBkYXRlZFwiKTtcbiAgICAgIH0sIHBhcmVudFN1c3BlbnNlKTtcbiAgICB9XG4gIH07XG4gIGNvbnN0IHBhdGNoQmxvY2tDaGlsZHJlbiA9IChvbGRDaGlsZHJlbiwgbmV3Q2hpbGRyZW4sIGZhbGxiYWNrQ29udGFpbmVyLCBwYXJlbnRDb21wb25lbnQsIHBhcmVudFN1c3BlbnNlLCBuYW1lc3BhY2UsIHNsb3RTY29wZUlkcykgPT4ge1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbmV3Q2hpbGRyZW4ubGVuZ3RoOyBpKyspIHtcbiAgICAgIGNvbnN0IG9sZFZOb2RlID0gb2xkQ2hpbGRyZW5baV07XG4gICAgICBjb25zdCBuZXdWTm9kZSA9IG5ld0NoaWxkcmVuW2ldO1xuICAgICAgY29uc3QgY29udGFpbmVyID0gKFxuICAgICAgICAvLyBvbGRWTm9kZSBtYXkgYmUgYW4gZXJyb3JlZCBhc3luYyBzZXR1cCgpIGNvbXBvbmVudCBpbnNpZGUgU3VzcGVuc2VcbiAgICAgICAgLy8gd2hpY2ggd2lsbCBub3QgaGF2ZSBhIG1vdW50ZWQgZWxlbWVudFxuICAgICAgICBvbGRWTm9kZS5lbCAmJiAvLyAtIEluIHRoZSBjYXNlIG9mIGEgRnJhZ21lbnQsIHdlIG5lZWQgdG8gcHJvdmlkZSB0aGUgYWN0dWFsIHBhcmVudFxuICAgICAgICAvLyBvZiB0aGUgRnJhZ21lbnQgaXRzZWxmIHNvIGl0IGNhbiBtb3ZlIGl0cyBjaGlsZHJlbi5cbiAgICAgICAgKG9sZFZOb2RlLnR5cGUgPT09IEZyYWdtZW50IHx8IC8vIC0gSW4gdGhlIGNhc2Ugb2YgZGlmZmVyZW50IG5vZGVzLCB0aGVyZSBpcyBnb2luZyB0byBiZSBhIHJlcGxhY2VtZW50XG4gICAgICAgIC8vIHdoaWNoIGFsc28gcmVxdWlyZXMgdGhlIGNvcnJlY3QgcGFyZW50IGNvbnRhaW5lclxuICAgICAgICAhaXNTYW1lVk5vZGVUeXBlKG9sZFZOb2RlLCBuZXdWTm9kZSkgfHwgLy8gLSBJbiB0aGUgY2FzZSBvZiBhIGNvbXBvbmVudCwgaXQgY291bGQgY29udGFpbiBhbnl0aGluZy5cbiAgICAgICAgb2xkVk5vZGUuc2hhcGVGbGFnICYgKDYgfCA2NCB8IDEyOCkpID8gaG9zdFBhcmVudE5vZGUob2xkVk5vZGUuZWwpIDogKFxuICAgICAgICAgIC8vIEluIG90aGVyIGNhc2VzLCB0aGUgcGFyZW50IGNvbnRhaW5lciBpcyBub3QgYWN0dWFsbHkgdXNlZCBzbyB3ZVxuICAgICAgICAgIC8vIGp1c3QgcGFzcyB0aGUgYmxvY2sgZWxlbWVudCBoZXJlIHRvIGF2b2lkIGEgRE9NIHBhcmVudE5vZGUgY2FsbC5cbiAgICAgICAgICBmYWxsYmFja0NvbnRhaW5lclxuICAgICAgICApXG4gICAgICApO1xuICAgICAgcGF0Y2goXG4gICAgICAgIG9sZFZOb2RlLFxuICAgICAgICBuZXdWTm9kZSxcbiAgICAgICAgY29udGFpbmVyLFxuICAgICAgICBudWxsLFxuICAgICAgICBwYXJlbnRDb21wb25lbnQsXG4gICAgICAgIHBhcmVudFN1c3BlbnNlLFxuICAgICAgICBuYW1lc3BhY2UsXG4gICAgICAgIHNsb3RTY29wZUlkcyxcbiAgICAgICAgdHJ1ZVxuICAgICAgKTtcbiAgICB9XG4gIH07XG4gIGNvbnN0IHBhdGNoUHJvcHMgPSAoZWwsIG9sZFByb3BzLCBuZXdQcm9wcywgcGFyZW50Q29tcG9uZW50LCBuYW1lc3BhY2UpID0+IHtcbiAgICBpZiAob2xkUHJvcHMgIT09IG5ld1Byb3BzKSB7XG4gICAgICBpZiAob2xkUHJvcHMgIT09IEVNUFRZX09CSikge1xuICAgICAgICBmb3IgKGNvbnN0IGtleSBpbiBvbGRQcm9wcykge1xuICAgICAgICAgIGlmICghaXNSZXNlcnZlZFByb3Aoa2V5KSAmJiAhKGtleSBpbiBuZXdQcm9wcykpIHtcbiAgICAgICAgICAgIGhvc3RQYXRjaFByb3AoXG4gICAgICAgICAgICAgIGVsLFxuICAgICAgICAgICAgICBrZXksXG4gICAgICAgICAgICAgIG9sZFByb3BzW2tleV0sXG4gICAgICAgICAgICAgIG51bGwsXG4gICAgICAgICAgICAgIG5hbWVzcGFjZSxcbiAgICAgICAgICAgICAgcGFyZW50Q29tcG9uZW50XG4gICAgICAgICAgICApO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgZm9yIChjb25zdCBrZXkgaW4gbmV3UHJvcHMpIHtcbiAgICAgICAgaWYgKGlzUmVzZXJ2ZWRQcm9wKGtleSkpIGNvbnRpbnVlO1xuICAgICAgICBjb25zdCBuZXh0ID0gbmV3UHJvcHNba2V5XTtcbiAgICAgICAgY29uc3QgcHJldiA9IG9sZFByb3BzW2tleV07XG4gICAgICAgIGlmIChuZXh0ICE9PSBwcmV2ICYmIGtleSAhPT0gXCJ2YWx1ZVwiKSB7XG4gICAgICAgICAgaG9zdFBhdGNoUHJvcChlbCwga2V5LCBwcmV2LCBuZXh0LCBuYW1lc3BhY2UsIHBhcmVudENvbXBvbmVudCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGlmIChcInZhbHVlXCIgaW4gbmV3UHJvcHMpIHtcbiAgICAgICAgaG9zdFBhdGNoUHJvcChlbCwgXCJ2YWx1ZVwiLCBvbGRQcm9wcy52YWx1ZSwgbmV3UHJvcHMudmFsdWUsIG5hbWVzcGFjZSk7XG4gICAgICB9XG4gICAgfVxuICB9O1xuICBjb25zdCBwcm9jZXNzRnJhZ21lbnQgPSAobjEsIG4yLCBjb250YWluZXIsIGFuY2hvciwgcGFyZW50Q29tcG9uZW50LCBwYXJlbnRTdXNwZW5zZSwgbmFtZXNwYWNlLCBzbG90U2NvcGVJZHMsIG9wdGltaXplZCkgPT4ge1xuICAgIGNvbnN0IGZyYWdtZW50U3RhcnRBbmNob3IgPSBuMi5lbCA9IG4xID8gbjEuZWwgOiBob3N0Q3JlYXRlVGV4dChcIlwiKTtcbiAgICBjb25zdCBmcmFnbWVudEVuZEFuY2hvciA9IG4yLmFuY2hvciA9IG4xID8gbjEuYW5jaG9yIDogaG9zdENyZWF0ZVRleHQoXCJcIik7XG4gICAgbGV0IHsgcGF0Y2hGbGFnLCBkeW5hbWljQ2hpbGRyZW4sIHNsb3RTY29wZUlkczogZnJhZ21lbnRTbG90U2NvcGVJZHMgfSA9IG4yO1xuICAgIGlmICghIShwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gXCJwcm9kdWN0aW9uXCIpICYmIC8vICM1NTIzIGRldiByb290IGZyYWdtZW50IG1heSBpbmhlcml0IGRpcmVjdGl2ZXNcbiAgICAoaXNIbXJVcGRhdGluZyB8fCBwYXRjaEZsYWcgJiAyMDQ4KSkge1xuICAgICAgcGF0Y2hGbGFnID0gMDtcbiAgICAgIG9wdGltaXplZCA9IGZhbHNlO1xuICAgICAgZHluYW1pY0NoaWxkcmVuID0gbnVsbDtcbiAgICB9XG4gICAgaWYgKGZyYWdtZW50U2xvdFNjb3BlSWRzKSB7XG4gICAgICBzbG90U2NvcGVJZHMgPSBzbG90U2NvcGVJZHMgPyBzbG90U2NvcGVJZHMuY29uY2F0KGZyYWdtZW50U2xvdFNjb3BlSWRzKSA6IGZyYWdtZW50U2xvdFNjb3BlSWRzO1xuICAgIH1cbiAgICBpZiAobjEgPT0gbnVsbCkge1xuICAgICAgaG9zdEluc2VydChmcmFnbWVudFN0YXJ0QW5jaG9yLCBjb250YWluZXIsIGFuY2hvcik7XG4gICAgICBob3N0SW5zZXJ0KGZyYWdtZW50RW5kQW5jaG9yLCBjb250YWluZXIsIGFuY2hvcik7XG4gICAgICBtb3VudENoaWxkcmVuKFxuICAgICAgICAvLyAjMTAwMDdcbiAgICAgICAgLy8gc3VjaCBmcmFnbWVudCBsaWtlIGA8PjwvPmAgd2lsbCBiZSBjb21waWxlZCBpbnRvXG4gICAgICAgIC8vIGEgZnJhZ21lbnQgd2hpY2ggZG9lc24ndCBoYXZlIGEgY2hpbGRyZW4uXG4gICAgICAgIC8vIEluIHRoaXMgY2FzZSBmYWxsYmFjayB0byBhbiBlbXB0eSBhcnJheVxuICAgICAgICBuMi5jaGlsZHJlbiB8fCBbXSxcbiAgICAgICAgY29udGFpbmVyLFxuICAgICAgICBmcmFnbWVudEVuZEFuY2hvcixcbiAgICAgICAgcGFyZW50Q29tcG9uZW50LFxuICAgICAgICBwYXJlbnRTdXNwZW5zZSxcbiAgICAgICAgbmFtZXNwYWNlLFxuICAgICAgICBzbG90U2NvcGVJZHMsXG4gICAgICAgIG9wdGltaXplZFxuICAgICAgKTtcbiAgICB9IGVsc2Uge1xuICAgICAgaWYgKHBhdGNoRmxhZyA+IDAgJiYgcGF0Y2hGbGFnICYgNjQgJiYgZHluYW1pY0NoaWxkcmVuICYmIC8vICMyNzE1IHRoZSBwcmV2aW91cyBmcmFnbWVudCBjb3VsZCd2ZSBiZWVuIGEgQkFJTGVkIG9uZSBhcyBhIHJlc3VsdFxuICAgICAgLy8gb2YgcmVuZGVyU2xvdCgpIHdpdGggbm8gdmFsaWQgY2hpbGRyZW5cbiAgICAgIG4xLmR5bmFtaWNDaGlsZHJlbiAmJiBuMS5keW5hbWljQ2hpbGRyZW4ubGVuZ3RoID09PSBkeW5hbWljQ2hpbGRyZW4ubGVuZ3RoKSB7XG4gICAgICAgIHBhdGNoQmxvY2tDaGlsZHJlbihcbiAgICAgICAgICBuMS5keW5hbWljQ2hpbGRyZW4sXG4gICAgICAgICAgZHluYW1pY0NoaWxkcmVuLFxuICAgICAgICAgIGNvbnRhaW5lcixcbiAgICAgICAgICBwYXJlbnRDb21wb25lbnQsXG4gICAgICAgICAgcGFyZW50U3VzcGVuc2UsXG4gICAgICAgICAgbmFtZXNwYWNlLFxuICAgICAgICAgIHNsb3RTY29wZUlkc1xuICAgICAgICApO1xuICAgICAgICBpZiAoISEocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09IFwicHJvZHVjdGlvblwiKSkge1xuICAgICAgICAgIHRyYXZlcnNlU3RhdGljQ2hpbGRyZW4objEsIG4yKTtcbiAgICAgICAgfSBlbHNlIGlmIChcbiAgICAgICAgICAvLyAjMjA4MCBpZiB0aGUgc3RhYmxlIGZyYWdtZW50IGhhcyBhIGtleSwgaXQncyBhIDx0ZW1wbGF0ZSB2LWZvcj4gdGhhdCBtYXlcbiAgICAgICAgICAvLyAgZ2V0IG1vdmVkIGFyb3VuZC4gTWFrZSBzdXJlIGFsbCByb290IGxldmVsIHZub2RlcyBpbmhlcml0IGVsLlxuICAgICAgICAgIC8vICMyMTM0IG9yIGlmIGl0J3MgYSBjb21wb25lbnQgcm9vdCwgaXQgbWF5IGFsc28gZ2V0IG1vdmVkIGFyb3VuZFxuICAgICAgICAgIC8vIGFzIHRoZSBjb21wb25lbnQgaXMgYmVpbmcgbW92ZWQuXG4gICAgICAgICAgbjIua2V5ICE9IG51bGwgfHwgcGFyZW50Q29tcG9uZW50ICYmIG4yID09PSBwYXJlbnRDb21wb25lbnQuc3ViVHJlZVxuICAgICAgICApIHtcbiAgICAgICAgICB0cmF2ZXJzZVN0YXRpY0NoaWxkcmVuKFxuICAgICAgICAgICAgbjEsXG4gICAgICAgICAgICBuMixcbiAgICAgICAgICAgIHRydWVcbiAgICAgICAgICAgIC8qIHNoYWxsb3cgKi9cbiAgICAgICAgICApO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBwYXRjaENoaWxkcmVuKFxuICAgICAgICAgIG4xLFxuICAgICAgICAgIG4yLFxuICAgICAgICAgIGNvbnRhaW5lcixcbiAgICAgICAgICBmcmFnbWVudEVuZEFuY2hvcixcbiAgICAgICAgICBwYXJlbnRDb21wb25lbnQsXG4gICAgICAgICAgcGFyZW50U3VzcGVuc2UsXG4gICAgICAgICAgbmFtZXNwYWNlLFxuICAgICAgICAgIHNsb3RTY29wZUlkcyxcbiAgICAgICAgICBvcHRpbWl6ZWRcbiAgICAgICAgKTtcbiAgICAgIH1cbiAgICB9XG4gIH07XG4gIGNvbnN0IHByb2Nlc3NDb21wb25lbnQgPSAobjEsIG4yLCBjb250YWluZXIsIGFuY2hvciwgcGFyZW50Q29tcG9uZW50LCBwYXJlbnRTdXNwZW5zZSwgbmFtZXNwYWNlLCBzbG90U2NvcGVJZHMsIG9wdGltaXplZCkgPT4ge1xuICAgIG4yLnNsb3RTY29wZUlkcyA9IHNsb3RTY29wZUlkcztcbiAgICBpZiAobjEgPT0gbnVsbCkge1xuICAgICAgaWYgKG4yLnNoYXBlRmxhZyAmIDUxMikge1xuICAgICAgICBwYXJlbnRDb21wb25lbnQuY3R4LmFjdGl2YXRlKFxuICAgICAgICAgIG4yLFxuICAgICAgICAgIGNvbnRhaW5lcixcbiAgICAgICAgICBhbmNob3IsXG4gICAgICAgICAgbmFtZXNwYWNlLFxuICAgICAgICAgIG9wdGltaXplZFxuICAgICAgICApO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbW91bnRDb21wb25lbnQoXG4gICAgICAgICAgbjIsXG4gICAgICAgICAgY29udGFpbmVyLFxuICAgICAgICAgIGFuY2hvcixcbiAgICAgICAgICBwYXJlbnRDb21wb25lbnQsXG4gICAgICAgICAgcGFyZW50U3VzcGVuc2UsXG4gICAgICAgICAgbmFtZXNwYWNlLFxuICAgICAgICAgIG9wdGltaXplZFxuICAgICAgICApO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICB1cGRhdGVDb21wb25lbnQobjEsIG4yLCBvcHRpbWl6ZWQpO1xuICAgIH1cbiAgfTtcbiAgY29uc3QgbW91bnRDb21wb25lbnQgPSAoaW5pdGlhbFZOb2RlLCBjb250YWluZXIsIGFuY2hvciwgcGFyZW50Q29tcG9uZW50LCBwYXJlbnRTdXNwZW5zZSwgbmFtZXNwYWNlLCBvcHRpbWl6ZWQpID0+IHtcbiAgICBjb25zdCBpbnN0YW5jZSA9IChpbml0aWFsVk5vZGUuY29tcG9uZW50ID0gY3JlYXRlQ29tcG9uZW50SW5zdGFuY2UoXG4gICAgICBpbml0aWFsVk5vZGUsXG4gICAgICBwYXJlbnRDb21wb25lbnQsXG4gICAgICBwYXJlbnRTdXNwZW5zZVxuICAgICkpO1xuICAgIGlmICghIShwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gXCJwcm9kdWN0aW9uXCIpICYmIGluc3RhbmNlLnR5cGUuX19obXJJZCkge1xuICAgICAgcmVnaXN0ZXJITVIoaW5zdGFuY2UpO1xuICAgIH1cbiAgICBpZiAoISEocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09IFwicHJvZHVjdGlvblwiKSkge1xuICAgICAgcHVzaFdhcm5pbmdDb250ZXh0KGluaXRpYWxWTm9kZSk7XG4gICAgICBzdGFydE1lYXN1cmUoaW5zdGFuY2UsIGBtb3VudGApO1xuICAgIH1cbiAgICBpZiAoaXNLZWVwQWxpdmUoaW5pdGlhbFZOb2RlKSkge1xuICAgICAgaW5zdGFuY2UuY3R4LnJlbmRlcmVyID0gaW50ZXJuYWxzO1xuICAgIH1cbiAgICB7XG4gICAgICBpZiAoISEocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09IFwicHJvZHVjdGlvblwiKSkge1xuICAgICAgICBzdGFydE1lYXN1cmUoaW5zdGFuY2UsIGBpbml0YCk7XG4gICAgICB9XG4gICAgICBzZXR1cENvbXBvbmVudChpbnN0YW5jZSwgZmFsc2UsIG9wdGltaXplZCk7XG4gICAgICBpZiAoISEocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09IFwicHJvZHVjdGlvblwiKSkge1xuICAgICAgICBlbmRNZWFzdXJlKGluc3RhbmNlLCBgaW5pdGApO1xuICAgICAgfVxuICAgIH1cbiAgICBpZiAoISEocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09IFwicHJvZHVjdGlvblwiKSAmJiBpc0htclVwZGF0aW5nKSBpbml0aWFsVk5vZGUuZWwgPSBudWxsO1xuICAgIGlmIChpbnN0YW5jZS5hc3luY0RlcCkge1xuICAgICAgcGFyZW50U3VzcGVuc2UgJiYgcGFyZW50U3VzcGVuc2UucmVnaXN0ZXJEZXAoaW5zdGFuY2UsIHNldHVwUmVuZGVyRWZmZWN0LCBvcHRpbWl6ZWQpO1xuICAgICAgaWYgKCFpbml0aWFsVk5vZGUuZWwpIHtcbiAgICAgICAgY29uc3QgcGxhY2Vob2xkZXIgPSBpbnN0YW5jZS5zdWJUcmVlID0gY3JlYXRlVk5vZGUoQ29tbWVudCk7XG4gICAgICAgIHByb2Nlc3NDb21tZW50Tm9kZShudWxsLCBwbGFjZWhvbGRlciwgY29udGFpbmVyLCBhbmNob3IpO1xuICAgICAgICBpbml0aWFsVk5vZGUucGxhY2Vob2xkZXIgPSBwbGFjZWhvbGRlci5lbDtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgc2V0dXBSZW5kZXJFZmZlY3QoXG4gICAgICAgIGluc3RhbmNlLFxuICAgICAgICBpbml0aWFsVk5vZGUsXG4gICAgICAgIGNvbnRhaW5lcixcbiAgICAgICAgYW5jaG9yLFxuICAgICAgICBwYXJlbnRTdXNwZW5zZSxcbiAgICAgICAgbmFtZXNwYWNlLFxuICAgICAgICBvcHRpbWl6ZWRcbiAgICAgICk7XG4gICAgfVxuICAgIGlmICghIShwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gXCJwcm9kdWN0aW9uXCIpKSB7XG4gICAgICBwb3BXYXJuaW5nQ29udGV4dCgpO1xuICAgICAgZW5kTWVhc3VyZShpbnN0YW5jZSwgYG1vdW50YCk7XG4gICAgfVxuICB9O1xuICBjb25zdCB1cGRhdGVDb21wb25lbnQgPSAobjEsIG4yLCBvcHRpbWl6ZWQpID0+IHtcbiAgICBjb25zdCBpbnN0YW5jZSA9IG4yLmNvbXBvbmVudCA9IG4xLmNvbXBvbmVudDtcbiAgICBpZiAoc2hvdWxkVXBkYXRlQ29tcG9uZW50KG4xLCBuMiwgb3B0aW1pemVkKSkge1xuICAgICAgaWYgKGluc3RhbmNlLmFzeW5jRGVwICYmICFpbnN0YW5jZS5hc3luY1Jlc29sdmVkKSB7XG4gICAgICAgIGlmICghIShwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gXCJwcm9kdWN0aW9uXCIpKSB7XG4gICAgICAgICAgcHVzaFdhcm5pbmdDb250ZXh0KG4yKTtcbiAgICAgICAgfVxuICAgICAgICB1cGRhdGVDb21wb25lbnRQcmVSZW5kZXIoaW5zdGFuY2UsIG4yLCBvcHRpbWl6ZWQpO1xuICAgICAgICBpZiAoISEocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09IFwicHJvZHVjdGlvblwiKSkge1xuICAgICAgICAgIHBvcFdhcm5pbmdDb250ZXh0KCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaW5zdGFuY2UubmV4dCA9IG4yO1xuICAgICAgICBpbnN0YW5jZS51cGRhdGUoKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgbjIuZWwgPSBuMS5lbDtcbiAgICAgIGluc3RhbmNlLnZub2RlID0gbjI7XG4gICAgfVxuICB9O1xuICBjb25zdCBzZXR1cFJlbmRlckVmZmVjdCA9IChpbnN0YW5jZSwgaW5pdGlhbFZOb2RlLCBjb250YWluZXIsIGFuY2hvciwgcGFyZW50U3VzcGVuc2UsIG5hbWVzcGFjZSwgb3B0aW1pemVkKSA9PiB7XG4gICAgY29uc3QgY29tcG9uZW50VXBkYXRlRm4gPSAoKSA9PiB7XG4gICAgICBpZiAoIWluc3RhbmNlLmlzTW91bnRlZCkge1xuICAgICAgICBsZXQgdm5vZGVIb29rO1xuICAgICAgICBjb25zdCB7IGVsLCBwcm9wcyB9ID0gaW5pdGlhbFZOb2RlO1xuICAgICAgICBjb25zdCB7IGJtLCBtLCBwYXJlbnQsIHJvb3QsIHR5cGUgfSA9IGluc3RhbmNlO1xuICAgICAgICBjb25zdCBpc0FzeW5jV3JhcHBlclZOb2RlID0gaXNBc3luY1dyYXBwZXIoaW5pdGlhbFZOb2RlKTtcbiAgICAgICAgdG9nZ2xlUmVjdXJzZShpbnN0YW5jZSwgZmFsc2UpO1xuICAgICAgICBpZiAoYm0pIHtcbiAgICAgICAgICBpbnZva2VBcnJheUZucyhibSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCFpc0FzeW5jV3JhcHBlclZOb2RlICYmICh2bm9kZUhvb2sgPSBwcm9wcyAmJiBwcm9wcy5vblZub2RlQmVmb3JlTW91bnQpKSB7XG4gICAgICAgICAgaW52b2tlVk5vZGVIb29rKHZub2RlSG9vaywgcGFyZW50LCBpbml0aWFsVk5vZGUpO1xuICAgICAgICB9XG4gICAgICAgIHRvZ2dsZVJlY3Vyc2UoaW5zdGFuY2UsIHRydWUpO1xuICAgICAgICBpZiAoZWwgJiYgaHlkcmF0ZU5vZGUpIHtcbiAgICAgICAgICBjb25zdCBoeWRyYXRlU3ViVHJlZSA9ICgpID0+IHtcbiAgICAgICAgICAgIGlmICghIShwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gXCJwcm9kdWN0aW9uXCIpKSB7XG4gICAgICAgICAgICAgIHN0YXJ0TWVhc3VyZShpbnN0YW5jZSwgYHJlbmRlcmApO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaW5zdGFuY2Uuc3ViVHJlZSA9IHJlbmRlckNvbXBvbmVudFJvb3QoaW5zdGFuY2UpO1xuICAgICAgICAgICAgaWYgKCEhKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSBcInByb2R1Y3Rpb25cIikpIHtcbiAgICAgICAgICAgICAgZW5kTWVhc3VyZShpbnN0YW5jZSwgYHJlbmRlcmApO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKCEhKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSBcInByb2R1Y3Rpb25cIikpIHtcbiAgICAgICAgICAgICAgc3RhcnRNZWFzdXJlKGluc3RhbmNlLCBgaHlkcmF0ZWApO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaHlkcmF0ZU5vZGUoXG4gICAgICAgICAgICAgIGVsLFxuICAgICAgICAgICAgICBpbnN0YW5jZS5zdWJUcmVlLFxuICAgICAgICAgICAgICBpbnN0YW5jZSxcbiAgICAgICAgICAgICAgcGFyZW50U3VzcGVuc2UsXG4gICAgICAgICAgICAgIG51bGxcbiAgICAgICAgICAgICk7XG4gICAgICAgICAgICBpZiAoISEocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09IFwicHJvZHVjdGlvblwiKSkge1xuICAgICAgICAgICAgICBlbmRNZWFzdXJlKGluc3RhbmNlLCBgaHlkcmF0ZWApO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH07XG4gICAgICAgICAgaWYgKGlzQXN5bmNXcmFwcGVyVk5vZGUgJiYgdHlwZS5fX2FzeW5jSHlkcmF0ZSkge1xuICAgICAgICAgICAgdHlwZS5fX2FzeW5jSHlkcmF0ZShcbiAgICAgICAgICAgICAgZWwsXG4gICAgICAgICAgICAgIGluc3RhbmNlLFxuICAgICAgICAgICAgICBoeWRyYXRlU3ViVHJlZVxuICAgICAgICAgICAgKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgaHlkcmF0ZVN1YlRyZWUoKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgaWYgKHJvb3QuY2UgJiYgcm9vdC5jZS5faGFzU2hhZG93Um9vdCgpKSB7XG4gICAgICAgICAgICByb290LmNlLl9pbmplY3RDaGlsZFN0eWxlKHR5cGUpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAoISEocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09IFwicHJvZHVjdGlvblwiKSkge1xuICAgICAgICAgICAgc3RhcnRNZWFzdXJlKGluc3RhbmNlLCBgcmVuZGVyYCk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGNvbnN0IHN1YlRyZWUgPSBpbnN0YW5jZS5zdWJUcmVlID0gcmVuZGVyQ29tcG9uZW50Um9vdChpbnN0YW5jZSk7XG4gICAgICAgICAgaWYgKCEhKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSBcInByb2R1Y3Rpb25cIikpIHtcbiAgICAgICAgICAgIGVuZE1lYXN1cmUoaW5zdGFuY2UsIGByZW5kZXJgKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKCEhKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSBcInByb2R1Y3Rpb25cIikpIHtcbiAgICAgICAgICAgIHN0YXJ0TWVhc3VyZShpbnN0YW5jZSwgYHBhdGNoYCk7XG4gICAgICAgICAgfVxuICAgICAgICAgIHBhdGNoKFxuICAgICAgICAgICAgbnVsbCxcbiAgICAgICAgICAgIHN1YlRyZWUsXG4gICAgICAgICAgICBjb250YWluZXIsXG4gICAgICAgICAgICBhbmNob3IsXG4gICAgICAgICAgICBpbnN0YW5jZSxcbiAgICAgICAgICAgIHBhcmVudFN1c3BlbnNlLFxuICAgICAgICAgICAgbmFtZXNwYWNlXG4gICAgICAgICAgKTtcbiAgICAgICAgICBpZiAoISEocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09IFwicHJvZHVjdGlvblwiKSkge1xuICAgICAgICAgICAgZW5kTWVhc3VyZShpbnN0YW5jZSwgYHBhdGNoYCk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGluaXRpYWxWTm9kZS5lbCA9IHN1YlRyZWUuZWw7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKG0pIHtcbiAgICAgICAgICBxdWV1ZVBvc3RSZW5kZXJFZmZlY3QobSwgcGFyZW50U3VzcGVuc2UpO1xuICAgICAgICB9XG4gICAgICAgIGlmICghaXNBc3luY1dyYXBwZXJWTm9kZSAmJiAodm5vZGVIb29rID0gcHJvcHMgJiYgcHJvcHMub25Wbm9kZU1vdW50ZWQpKSB7XG4gICAgICAgICAgY29uc3Qgc2NvcGVkSW5pdGlhbFZOb2RlID0gaW5pdGlhbFZOb2RlO1xuICAgICAgICAgIHF1ZXVlUG9zdFJlbmRlckVmZmVjdChcbiAgICAgICAgICAgICgpID0+IGludm9rZVZOb2RlSG9vayh2bm9kZUhvb2ssIHBhcmVudCwgc2NvcGVkSW5pdGlhbFZOb2RlKSxcbiAgICAgICAgICAgIHBhcmVudFN1c3BlbnNlXG4gICAgICAgICAgKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoaW5pdGlhbFZOb2RlLnNoYXBlRmxhZyAmIDI1NiB8fCBwYXJlbnQgJiYgaXNBc3luY1dyYXBwZXIocGFyZW50LnZub2RlKSAmJiBwYXJlbnQudm5vZGUuc2hhcGVGbGFnICYgMjU2KSB7XG4gICAgICAgICAgaW5zdGFuY2UuYSAmJiBxdWV1ZVBvc3RSZW5kZXJFZmZlY3QoaW5zdGFuY2UuYSwgcGFyZW50U3VzcGVuc2UpO1xuICAgICAgICB9XG4gICAgICAgIGluc3RhbmNlLmlzTW91bnRlZCA9IHRydWU7XG4gICAgICAgIGlmICghIShwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gXCJwcm9kdWN0aW9uXCIpIHx8IF9fVlVFX1BST0RfREVWVE9PTFNfXykge1xuICAgICAgICAgIGRldnRvb2xzQ29tcG9uZW50QWRkZWQoaW5zdGFuY2UpO1xuICAgICAgICB9XG4gICAgICAgIGluaXRpYWxWTm9kZSA9IGNvbnRhaW5lciA9IGFuY2hvciA9IG51bGw7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBsZXQgeyBuZXh0LCBidSwgdSwgcGFyZW50LCB2bm9kZSB9ID0gaW5zdGFuY2U7XG4gICAgICAgIHtcbiAgICAgICAgICBjb25zdCBub25IeWRyYXRlZEFzeW5jUm9vdCA9IGxvY2F0ZU5vbkh5ZHJhdGVkQXN5bmNSb290KGluc3RhbmNlKTtcbiAgICAgICAgICBpZiAobm9uSHlkcmF0ZWRBc3luY1Jvb3QpIHtcbiAgICAgICAgICAgIGlmIChuZXh0KSB7XG4gICAgICAgICAgICAgIG5leHQuZWwgPSB2bm9kZS5lbDtcbiAgICAgICAgICAgICAgdXBkYXRlQ29tcG9uZW50UHJlUmVuZGVyKGluc3RhbmNlLCBuZXh0LCBvcHRpbWl6ZWQpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgbm9uSHlkcmF0ZWRBc3luY1Jvb3QuYXN5bmNEZXAudGhlbigoKSA9PiB7XG4gICAgICAgICAgICAgIHF1ZXVlUG9zdFJlbmRlckVmZmVjdCgoKSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKCFpbnN0YW5jZS5pc1VubW91bnRlZCkgdXBkYXRlKCk7XG4gICAgICAgICAgICAgIH0sIHBhcmVudFN1c3BlbnNlKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBsZXQgb3JpZ2luTmV4dCA9IG5leHQ7XG4gICAgICAgIGxldCB2bm9kZUhvb2s7XG4gICAgICAgIGlmICghIShwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gXCJwcm9kdWN0aW9uXCIpKSB7XG4gICAgICAgICAgcHVzaFdhcm5pbmdDb250ZXh0KG5leHQgfHwgaW5zdGFuY2Uudm5vZGUpO1xuICAgICAgICB9XG4gICAgICAgIHRvZ2dsZVJlY3Vyc2UoaW5zdGFuY2UsIGZhbHNlKTtcbiAgICAgICAgaWYgKG5leHQpIHtcbiAgICAgICAgICBuZXh0LmVsID0gdm5vZGUuZWw7XG4gICAgICAgICAgdXBkYXRlQ29tcG9uZW50UHJlUmVuZGVyKGluc3RhbmNlLCBuZXh0LCBvcHRpbWl6ZWQpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIG5leHQgPSB2bm9kZTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoYnUpIHtcbiAgICAgICAgICBpbnZva2VBcnJheUZucyhidSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHZub2RlSG9vayA9IG5leHQucHJvcHMgJiYgbmV4dC5wcm9wcy5vblZub2RlQmVmb3JlVXBkYXRlKSB7XG4gICAgICAgICAgaW52b2tlVk5vZGVIb29rKHZub2RlSG9vaywgcGFyZW50LCBuZXh0LCB2bm9kZSk7XG4gICAgICAgIH1cbiAgICAgICAgdG9nZ2xlUmVjdXJzZShpbnN0YW5jZSwgdHJ1ZSk7XG4gICAgICAgIGlmICghIShwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gXCJwcm9kdWN0aW9uXCIpKSB7XG4gICAgICAgICAgc3RhcnRNZWFzdXJlKGluc3RhbmNlLCBgcmVuZGVyYCk7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgbmV4dFRyZWUgPSByZW5kZXJDb21wb25lbnRSb290KGluc3RhbmNlKTtcbiAgICAgICAgaWYgKCEhKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSBcInByb2R1Y3Rpb25cIikpIHtcbiAgICAgICAgICBlbmRNZWFzdXJlKGluc3RhbmNlLCBgcmVuZGVyYCk7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgcHJldlRyZWUgPSBpbnN0YW5jZS5zdWJUcmVlO1xuICAgICAgICBpbnN0YW5jZS5zdWJUcmVlID0gbmV4dFRyZWU7XG4gICAgICAgIGlmICghIShwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gXCJwcm9kdWN0aW9uXCIpKSB7XG4gICAgICAgICAgc3RhcnRNZWFzdXJlKGluc3RhbmNlLCBgcGF0Y2hgKTtcbiAgICAgICAgfVxuICAgICAgICBwYXRjaChcbiAgICAgICAgICBwcmV2VHJlZSxcbiAgICAgICAgICBuZXh0VHJlZSxcbiAgICAgICAgICAvLyBwYXJlbnQgbWF5IGhhdmUgY2hhbmdlZCBpZiBpdCdzIGluIGEgdGVsZXBvcnRcbiAgICAgICAgICBob3N0UGFyZW50Tm9kZShwcmV2VHJlZS5lbCksXG4gICAgICAgICAgLy8gYW5jaG9yIG1heSBoYXZlIGNoYW5nZWQgaWYgaXQncyBpbiBhIGZyYWdtZW50XG4gICAgICAgICAgZ2V0TmV4dEhvc3ROb2RlKHByZXZUcmVlKSxcbiAgICAgICAgICBpbnN0YW5jZSxcbiAgICAgICAgICBwYXJlbnRTdXNwZW5zZSxcbiAgICAgICAgICBuYW1lc3BhY2VcbiAgICAgICAgKTtcbiAgICAgICAgaWYgKCEhKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSBcInByb2R1Y3Rpb25cIikpIHtcbiAgICAgICAgICBlbmRNZWFzdXJlKGluc3RhbmNlLCBgcGF0Y2hgKTtcbiAgICAgICAgfVxuICAgICAgICBuZXh0LmVsID0gbmV4dFRyZWUuZWw7XG4gICAgICAgIGlmIChvcmlnaW5OZXh0ID09PSBudWxsKSB7XG4gICAgICAgICAgdXBkYXRlSE9DSG9zdEVsKGluc3RhbmNlLCBuZXh0VHJlZS5lbCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHUpIHtcbiAgICAgICAgICBxdWV1ZVBvc3RSZW5kZXJFZmZlY3QodSwgcGFyZW50U3VzcGVuc2UpO1xuICAgICAgICB9XG4gICAgICAgIGlmICh2bm9kZUhvb2sgPSBuZXh0LnByb3BzICYmIG5leHQucHJvcHMub25Wbm9kZVVwZGF0ZWQpIHtcbiAgICAgICAgICBxdWV1ZVBvc3RSZW5kZXJFZmZlY3QoXG4gICAgICAgICAgICAoKSA9PiBpbnZva2VWTm9kZUhvb2sodm5vZGVIb29rLCBwYXJlbnQsIG5leHQsIHZub2RlKSxcbiAgICAgICAgICAgIHBhcmVudFN1c3BlbnNlXG4gICAgICAgICAgKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoISEocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09IFwicHJvZHVjdGlvblwiKSB8fCBfX1ZVRV9QUk9EX0RFVlRPT0xTX18pIHtcbiAgICAgICAgICBkZXZ0b29sc0NvbXBvbmVudFVwZGF0ZWQoaW5zdGFuY2UpO1xuICAgICAgICB9XG4gICAgICAgIGlmICghIShwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gXCJwcm9kdWN0aW9uXCIpKSB7XG4gICAgICAgICAgcG9wV2FybmluZ0NvbnRleHQoKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH07XG4gICAgaW5zdGFuY2Uuc2NvcGUub24oKTtcbiAgICBjb25zdCBlZmZlY3QgPSBpbnN0YW5jZS5lZmZlY3QgPSBuZXcgUmVhY3RpdmVFZmZlY3QoY29tcG9uZW50VXBkYXRlRm4pO1xuICAgIGluc3RhbmNlLnNjb3BlLm9mZigpO1xuICAgIGNvbnN0IHVwZGF0ZSA9IGluc3RhbmNlLnVwZGF0ZSA9IGVmZmVjdC5ydW4uYmluZChlZmZlY3QpO1xuICAgIGNvbnN0IGpvYiA9IGluc3RhbmNlLmpvYiA9IGVmZmVjdC5ydW5JZkRpcnR5LmJpbmQoZWZmZWN0KTtcbiAgICBqb2IuaSA9IGluc3RhbmNlO1xuICAgIGpvYi5pZCA9IGluc3RhbmNlLnVpZDtcbiAgICBlZmZlY3Quc2NoZWR1bGVyID0gKCkgPT4gcXVldWVKb2Ioam9iKTtcbiAgICB0b2dnbGVSZWN1cnNlKGluc3RhbmNlLCB0cnVlKTtcbiAgICBpZiAoISEocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09IFwicHJvZHVjdGlvblwiKSkge1xuICAgICAgZWZmZWN0Lm9uVHJhY2sgPSBpbnN0YW5jZS5ydGMgPyAoZSkgPT4gaW52b2tlQXJyYXlGbnMoaW5zdGFuY2UucnRjLCBlKSA6IHZvaWQgMDtcbiAgICAgIGVmZmVjdC5vblRyaWdnZXIgPSBpbnN0YW5jZS5ydGcgPyAoZSkgPT4gaW52b2tlQXJyYXlGbnMoaW5zdGFuY2UucnRnLCBlKSA6IHZvaWQgMDtcbiAgICB9XG4gICAgdXBkYXRlKCk7XG4gIH07XG4gIGNvbnN0IHVwZGF0ZUNvbXBvbmVudFByZVJlbmRlciA9IChpbnN0YW5jZSwgbmV4dFZOb2RlLCBvcHRpbWl6ZWQpID0+IHtcbiAgICBuZXh0Vk5vZGUuY29tcG9uZW50ID0gaW5zdGFuY2U7XG4gICAgY29uc3QgcHJldlByb3BzID0gaW5zdGFuY2Uudm5vZGUucHJvcHM7XG4gICAgaW5zdGFuY2Uudm5vZGUgPSBuZXh0Vk5vZGU7XG4gICAgaW5zdGFuY2UubmV4dCA9IG51bGw7XG4gICAgdXBkYXRlUHJvcHMoaW5zdGFuY2UsIG5leHRWTm9kZS5wcm9wcywgcHJldlByb3BzLCBvcHRpbWl6ZWQpO1xuICAgIHVwZGF0ZVNsb3RzKGluc3RhbmNlLCBuZXh0Vk5vZGUuY2hpbGRyZW4sIG9wdGltaXplZCk7XG4gICAgcGF1c2VUcmFja2luZygpO1xuICAgIGZsdXNoUHJlRmx1c2hDYnMoaW5zdGFuY2UpO1xuICAgIHJlc2V0VHJhY2tpbmcoKTtcbiAgfTtcbiAgY29uc3QgcGF0Y2hDaGlsZHJlbiA9IChuMSwgbjIsIGNvbnRhaW5lciwgYW5jaG9yLCBwYXJlbnRDb21wb25lbnQsIHBhcmVudFN1c3BlbnNlLCBuYW1lc3BhY2UsIHNsb3RTY29wZUlkcywgb3B0aW1pemVkID0gZmFsc2UpID0+IHtcbiAgICBjb25zdCBjMSA9IG4xICYmIG4xLmNoaWxkcmVuO1xuICAgIGNvbnN0IHByZXZTaGFwZUZsYWcgPSBuMSA/IG4xLnNoYXBlRmxhZyA6IDA7XG4gICAgY29uc3QgYzIgPSBuMi5jaGlsZHJlbjtcbiAgICBjb25zdCB7IHBhdGNoRmxhZywgc2hhcGVGbGFnIH0gPSBuMjtcbiAgICBpZiAocGF0Y2hGbGFnID4gMCkge1xuICAgICAgaWYgKHBhdGNoRmxhZyAmIDEyOCkge1xuICAgICAgICBwYXRjaEtleWVkQ2hpbGRyZW4oXG4gICAgICAgICAgYzEsXG4gICAgICAgICAgYzIsXG4gICAgICAgICAgY29udGFpbmVyLFxuICAgICAgICAgIGFuY2hvcixcbiAgICAgICAgICBwYXJlbnRDb21wb25lbnQsXG4gICAgICAgICAgcGFyZW50U3VzcGVuc2UsXG4gICAgICAgICAgbmFtZXNwYWNlLFxuICAgICAgICAgIHNsb3RTY29wZUlkcyxcbiAgICAgICAgICBvcHRpbWl6ZWRcbiAgICAgICAgKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfSBlbHNlIGlmIChwYXRjaEZsYWcgJiAyNTYpIHtcbiAgICAgICAgcGF0Y2hVbmtleWVkQ2hpbGRyZW4oXG4gICAgICAgICAgYzEsXG4gICAgICAgICAgYzIsXG4gICAgICAgICAgY29udGFpbmVyLFxuICAgICAgICAgIGFuY2hvcixcbiAgICAgICAgICBwYXJlbnRDb21wb25lbnQsXG4gICAgICAgICAgcGFyZW50U3VzcGVuc2UsXG4gICAgICAgICAgbmFtZXNwYWNlLFxuICAgICAgICAgIHNsb3RTY29wZUlkcyxcbiAgICAgICAgICBvcHRpbWl6ZWRcbiAgICAgICAgKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgIH1cbiAgICBpZiAoc2hhcGVGbGFnICYgOCkge1xuICAgICAgaWYgKHByZXZTaGFwZUZsYWcgJiAxNikge1xuICAgICAgICB1bm1vdW50Q2hpbGRyZW4oYzEsIHBhcmVudENvbXBvbmVudCwgcGFyZW50U3VzcGVuc2UpO1xuICAgICAgfVxuICAgICAgaWYgKGMyICE9PSBjMSkge1xuICAgICAgICBob3N0U2V0RWxlbWVudFRleHQoY29udGFpbmVyLCBjMik7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIGlmIChwcmV2U2hhcGVGbGFnICYgMTYpIHtcbiAgICAgICAgaWYgKHNoYXBlRmxhZyAmIDE2KSB7XG4gICAgICAgICAgcGF0Y2hLZXllZENoaWxkcmVuKFxuICAgICAgICAgICAgYzEsXG4gICAgICAgICAgICBjMixcbiAgICAgICAgICAgIGNvbnRhaW5lcixcbiAgICAgICAgICAgIGFuY2hvcixcbiAgICAgICAgICAgIHBhcmVudENvbXBvbmVudCxcbiAgICAgICAgICAgIHBhcmVudFN1c3BlbnNlLFxuICAgICAgICAgICAgbmFtZXNwYWNlLFxuICAgICAgICAgICAgc2xvdFNjb3BlSWRzLFxuICAgICAgICAgICAgb3B0aW1pemVkXG4gICAgICAgICAgKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB1bm1vdW50Q2hpbGRyZW4oYzEsIHBhcmVudENvbXBvbmVudCwgcGFyZW50U3VzcGVuc2UsIHRydWUpO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpZiAocHJldlNoYXBlRmxhZyAmIDgpIHtcbiAgICAgICAgICBob3N0U2V0RWxlbWVudFRleHQoY29udGFpbmVyLCBcIlwiKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoc2hhcGVGbGFnICYgMTYpIHtcbiAgICAgICAgICBtb3VudENoaWxkcmVuKFxuICAgICAgICAgICAgYzIsXG4gICAgICAgICAgICBjb250YWluZXIsXG4gICAgICAgICAgICBhbmNob3IsXG4gICAgICAgICAgICBwYXJlbnRDb21wb25lbnQsXG4gICAgICAgICAgICBwYXJlbnRTdXNwZW5zZSxcbiAgICAgICAgICAgIG5hbWVzcGFjZSxcbiAgICAgICAgICAgIHNsb3RTY29wZUlkcyxcbiAgICAgICAgICAgIG9wdGltaXplZFxuICAgICAgICAgICk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH07XG4gIGNvbnN0IHBhdGNoVW5rZXllZENoaWxkcmVuID0gKGMxLCBjMiwgY29udGFpbmVyLCBhbmNob3IsIHBhcmVudENvbXBvbmVudCwgcGFyZW50U3VzcGVuc2UsIG5hbWVzcGFjZSwgc2xvdFNjb3BlSWRzLCBvcHRpbWl6ZWQpID0+IHtcbiAgICBjMSA9IGMxIHx8IEVNUFRZX0FSUjtcbiAgICBjMiA9IGMyIHx8IEVNUFRZX0FSUjtcbiAgICBjb25zdCBvbGRMZW5ndGggPSBjMS5sZW5ndGg7XG4gICAgY29uc3QgbmV3TGVuZ3RoID0gYzIubGVuZ3RoO1xuICAgIGNvbnN0IGNvbW1vbkxlbmd0aCA9IE1hdGgubWluKG9sZExlbmd0aCwgbmV3TGVuZ3RoKTtcbiAgICBsZXQgaTtcbiAgICBmb3IgKGkgPSAwOyBpIDwgY29tbW9uTGVuZ3RoOyBpKyspIHtcbiAgICAgIGNvbnN0IG5leHRDaGlsZCA9IGMyW2ldID0gb3B0aW1pemVkID8gY2xvbmVJZk1vdW50ZWQoYzJbaV0pIDogbm9ybWFsaXplVk5vZGUoYzJbaV0pO1xuICAgICAgcGF0Y2goXG4gICAgICAgIGMxW2ldLFxuICAgICAgICBuZXh0Q2hpbGQsXG4gICAgICAgIGNvbnRhaW5lcixcbiAgICAgICAgbnVsbCxcbiAgICAgICAgcGFyZW50Q29tcG9uZW50LFxuICAgICAgICBwYXJlbnRTdXNwZW5zZSxcbiAgICAgICAgbmFtZXNwYWNlLFxuICAgICAgICBzbG90U2NvcGVJZHMsXG4gICAgICAgIG9wdGltaXplZFxuICAgICAgKTtcbiAgICB9XG4gICAgaWYgKG9sZExlbmd0aCA+IG5ld0xlbmd0aCkge1xuICAgICAgdW5tb3VudENoaWxkcmVuKFxuICAgICAgICBjMSxcbiAgICAgICAgcGFyZW50Q29tcG9uZW50LFxuICAgICAgICBwYXJlbnRTdXNwZW5zZSxcbiAgICAgICAgdHJ1ZSxcbiAgICAgICAgZmFsc2UsXG4gICAgICAgIGNvbW1vbkxlbmd0aFxuICAgICAgKTtcbiAgICB9IGVsc2Uge1xuICAgICAgbW91bnRDaGlsZHJlbihcbiAgICAgICAgYzIsXG4gICAgICAgIGNvbnRhaW5lcixcbiAgICAgICAgYW5jaG9yLFxuICAgICAgICBwYXJlbnRDb21wb25lbnQsXG4gICAgICAgIHBhcmVudFN1c3BlbnNlLFxuICAgICAgICBuYW1lc3BhY2UsXG4gICAgICAgIHNsb3RTY29wZUlkcyxcbiAgICAgICAgb3B0aW1pemVkLFxuICAgICAgICBjb21tb25MZW5ndGhcbiAgICAgICk7XG4gICAgfVxuICB9O1xuICBjb25zdCBwYXRjaEtleWVkQ2hpbGRyZW4gPSAoYzEsIGMyLCBjb250YWluZXIsIHBhcmVudEFuY2hvciwgcGFyZW50Q29tcG9uZW50LCBwYXJlbnRTdXNwZW5zZSwgbmFtZXNwYWNlLCBzbG90U2NvcGVJZHMsIG9wdGltaXplZCkgPT4ge1xuICAgIGxldCBpID0gMDtcbiAgICBjb25zdCBsMiA9IGMyLmxlbmd0aDtcbiAgICBsZXQgZTEgPSBjMS5sZW5ndGggLSAxO1xuICAgIGxldCBlMiA9IGwyIC0gMTtcbiAgICB3aGlsZSAoaSA8PSBlMSAmJiBpIDw9IGUyKSB7XG4gICAgICBjb25zdCBuMSA9IGMxW2ldO1xuICAgICAgY29uc3QgbjIgPSBjMltpXSA9IG9wdGltaXplZCA/IGNsb25lSWZNb3VudGVkKGMyW2ldKSA6IG5vcm1hbGl6ZVZOb2RlKGMyW2ldKTtcbiAgICAgIGlmIChpc1NhbWVWTm9kZVR5cGUobjEsIG4yKSkge1xuICAgICAgICBwYXRjaChcbiAgICAgICAgICBuMSxcbiAgICAgICAgICBuMixcbiAgICAgICAgICBjb250YWluZXIsXG4gICAgICAgICAgbnVsbCxcbiAgICAgICAgICBwYXJlbnRDb21wb25lbnQsXG4gICAgICAgICAgcGFyZW50U3VzcGVuc2UsXG4gICAgICAgICAgbmFtZXNwYWNlLFxuICAgICAgICAgIHNsb3RTY29wZUlkcyxcbiAgICAgICAgICBvcHRpbWl6ZWRcbiAgICAgICAgKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgICAgaSsrO1xuICAgIH1cbiAgICB3aGlsZSAoaSA8PSBlMSAmJiBpIDw9IGUyKSB7XG4gICAgICBjb25zdCBuMSA9IGMxW2UxXTtcbiAgICAgIGNvbnN0IG4yID0gYzJbZTJdID0gb3B0aW1pemVkID8gY2xvbmVJZk1vdW50ZWQoYzJbZTJdKSA6IG5vcm1hbGl6ZVZOb2RlKGMyW2UyXSk7XG4gICAgICBpZiAoaXNTYW1lVk5vZGVUeXBlKG4xLCBuMikpIHtcbiAgICAgICAgcGF0Y2goXG4gICAgICAgICAgbjEsXG4gICAgICAgICAgbjIsXG4gICAgICAgICAgY29udGFpbmVyLFxuICAgICAgICAgIG51bGwsXG4gICAgICAgICAgcGFyZW50Q29tcG9uZW50LFxuICAgICAgICAgIHBhcmVudFN1c3BlbnNlLFxuICAgICAgICAgIG5hbWVzcGFjZSxcbiAgICAgICAgICBzbG90U2NvcGVJZHMsXG4gICAgICAgICAgb3B0aW1pemVkXG4gICAgICAgICk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICAgIGUxLS07XG4gICAgICBlMi0tO1xuICAgIH1cbiAgICBpZiAoaSA+IGUxKSB7XG4gICAgICBpZiAoaSA8PSBlMikge1xuICAgICAgICBjb25zdCBuZXh0UG9zID0gZTIgKyAxO1xuICAgICAgICBjb25zdCBhbmNob3IgPSBuZXh0UG9zIDwgbDIgPyBjMltuZXh0UG9zXS5lbCA6IHBhcmVudEFuY2hvcjtcbiAgICAgICAgd2hpbGUgKGkgPD0gZTIpIHtcbiAgICAgICAgICBwYXRjaChcbiAgICAgICAgICAgIG51bGwsXG4gICAgICAgICAgICBjMltpXSA9IG9wdGltaXplZCA/IGNsb25lSWZNb3VudGVkKGMyW2ldKSA6IG5vcm1hbGl6ZVZOb2RlKGMyW2ldKSxcbiAgICAgICAgICAgIGNvbnRhaW5lcixcbiAgICAgICAgICAgIGFuY2hvcixcbiAgICAgICAgICAgIHBhcmVudENvbXBvbmVudCxcbiAgICAgICAgICAgIHBhcmVudFN1c3BlbnNlLFxuICAgICAgICAgICAgbmFtZXNwYWNlLFxuICAgICAgICAgICAgc2xvdFNjb3BlSWRzLFxuICAgICAgICAgICAgb3B0aW1pemVkXG4gICAgICAgICAgKTtcbiAgICAgICAgICBpKys7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKGkgPiBlMikge1xuICAgICAgd2hpbGUgKGkgPD0gZTEpIHtcbiAgICAgICAgdW5tb3VudChjMVtpXSwgcGFyZW50Q29tcG9uZW50LCBwYXJlbnRTdXNwZW5zZSwgdHJ1ZSk7XG4gICAgICAgIGkrKztcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgY29uc3QgczEgPSBpO1xuICAgICAgY29uc3QgczIgPSBpO1xuICAgICAgY29uc3Qga2V5VG9OZXdJbmRleE1hcCA9IC8qIEBfX1BVUkVfXyAqLyBuZXcgTWFwKCk7XG4gICAgICBmb3IgKGkgPSBzMjsgaSA8PSBlMjsgaSsrKSB7XG4gICAgICAgIGNvbnN0IG5leHRDaGlsZCA9IGMyW2ldID0gb3B0aW1pemVkID8gY2xvbmVJZk1vdW50ZWQoYzJbaV0pIDogbm9ybWFsaXplVk5vZGUoYzJbaV0pO1xuICAgICAgICBpZiAobmV4dENoaWxkLmtleSAhPSBudWxsKSB7XG4gICAgICAgICAgaWYgKCEhKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSBcInByb2R1Y3Rpb25cIikgJiYga2V5VG9OZXdJbmRleE1hcC5oYXMobmV4dENoaWxkLmtleSkpIHtcbiAgICAgICAgICAgIHdhcm4kMShcbiAgICAgICAgICAgICAgYER1cGxpY2F0ZSBrZXlzIGZvdW5kIGR1cmluZyB1cGRhdGU6YCxcbiAgICAgICAgICAgICAgSlNPTi5zdHJpbmdpZnkobmV4dENoaWxkLmtleSksXG4gICAgICAgICAgICAgIGBNYWtlIHN1cmUga2V5cyBhcmUgdW5pcXVlLmBcbiAgICAgICAgICAgICk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGtleVRvTmV3SW5kZXhNYXAuc2V0KG5leHRDaGlsZC5rZXksIGkpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBsZXQgajtcbiAgICAgIGxldCBwYXRjaGVkID0gMDtcbiAgICAgIGNvbnN0IHRvQmVQYXRjaGVkID0gZTIgLSBzMiArIDE7XG4gICAgICBsZXQgbW92ZWQgPSBmYWxzZTtcbiAgICAgIGxldCBtYXhOZXdJbmRleFNvRmFyID0gMDtcbiAgICAgIGNvbnN0IG5ld0luZGV4VG9PbGRJbmRleE1hcCA9IG5ldyBBcnJheSh0b0JlUGF0Y2hlZCk7XG4gICAgICBmb3IgKGkgPSAwOyBpIDwgdG9CZVBhdGNoZWQ7IGkrKykgbmV3SW5kZXhUb09sZEluZGV4TWFwW2ldID0gMDtcbiAgICAgIGZvciAoaSA9IHMxOyBpIDw9IGUxOyBpKyspIHtcbiAgICAgICAgY29uc3QgcHJldkNoaWxkID0gYzFbaV07XG4gICAgICAgIGlmIChwYXRjaGVkID49IHRvQmVQYXRjaGVkKSB7XG4gICAgICAgICAgdW5tb3VudChwcmV2Q2hpbGQsIHBhcmVudENvbXBvbmVudCwgcGFyZW50U3VzcGVuc2UsIHRydWUpO1xuICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG4gICAgICAgIGxldCBuZXdJbmRleDtcbiAgICAgICAgaWYgKHByZXZDaGlsZC5rZXkgIT0gbnVsbCkge1xuICAgICAgICAgIG5ld0luZGV4ID0ga2V5VG9OZXdJbmRleE1hcC5nZXQocHJldkNoaWxkLmtleSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgZm9yIChqID0gczI7IGogPD0gZTI7IGorKykge1xuICAgICAgICAgICAgaWYgKG5ld0luZGV4VG9PbGRJbmRleE1hcFtqIC0gczJdID09PSAwICYmIGlzU2FtZVZOb2RlVHlwZShwcmV2Q2hpbGQsIGMyW2pdKSkge1xuICAgICAgICAgICAgICBuZXdJbmRleCA9IGo7XG4gICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAobmV3SW5kZXggPT09IHZvaWQgMCkge1xuICAgICAgICAgIHVubW91bnQocHJldkNoaWxkLCBwYXJlbnRDb21wb25lbnQsIHBhcmVudFN1c3BlbnNlLCB0cnVlKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBuZXdJbmRleFRvT2xkSW5kZXhNYXBbbmV3SW5kZXggLSBzMl0gPSBpICsgMTtcbiAgICAgICAgICBpZiAobmV3SW5kZXggPj0gbWF4TmV3SW5kZXhTb0Zhcikge1xuICAgICAgICAgICAgbWF4TmV3SW5kZXhTb0ZhciA9IG5ld0luZGV4O1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBtb3ZlZCA9IHRydWU7XG4gICAgICAgICAgfVxuICAgICAgICAgIHBhdGNoKFxuICAgICAgICAgICAgcHJldkNoaWxkLFxuICAgICAgICAgICAgYzJbbmV3SW5kZXhdLFxuICAgICAgICAgICAgY29udGFpbmVyLFxuICAgICAgICAgICAgbnVsbCxcbiAgICAgICAgICAgIHBhcmVudENvbXBvbmVudCxcbiAgICAgICAgICAgIHBhcmVudFN1c3BlbnNlLFxuICAgICAgICAgICAgbmFtZXNwYWNlLFxuICAgICAgICAgICAgc2xvdFNjb3BlSWRzLFxuICAgICAgICAgICAgb3B0aW1pemVkXG4gICAgICAgICAgKTtcbiAgICAgICAgICBwYXRjaGVkKys7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGNvbnN0IGluY3JlYXNpbmdOZXdJbmRleFNlcXVlbmNlID0gbW92ZWQgPyBnZXRTZXF1ZW5jZShuZXdJbmRleFRvT2xkSW5kZXhNYXApIDogRU1QVFlfQVJSO1xuICAgICAgaiA9IGluY3JlYXNpbmdOZXdJbmRleFNlcXVlbmNlLmxlbmd0aCAtIDE7XG4gICAgICBmb3IgKGkgPSB0b0JlUGF0Y2hlZCAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAgICAgIGNvbnN0IG5leHRJbmRleCA9IHMyICsgaTtcbiAgICAgICAgY29uc3QgbmV4dENoaWxkID0gYzJbbmV4dEluZGV4XTtcbiAgICAgICAgY29uc3QgYW5jaG9yVk5vZGUgPSBjMltuZXh0SW5kZXggKyAxXTtcbiAgICAgICAgY29uc3QgYW5jaG9yID0gbmV4dEluZGV4ICsgMSA8IGwyID8gKFxuICAgICAgICAgIC8vICMxMzU1OSwgIzE0MTczIGZhbGxiYWNrIHRvIGVsIHBsYWNlaG9sZGVyIGZvciB1bnJlc29sdmVkIGFzeW5jIGNvbXBvbmVudFxuICAgICAgICAgIGFuY2hvclZOb2RlLmVsIHx8IHJlc29sdmVBc3luY0NvbXBvbmVudFBsYWNlaG9sZGVyKGFuY2hvclZOb2RlKVxuICAgICAgICApIDogcGFyZW50QW5jaG9yO1xuICAgICAgICBpZiAobmV3SW5kZXhUb09sZEluZGV4TWFwW2ldID09PSAwKSB7XG4gICAgICAgICAgcGF0Y2goXG4gICAgICAgICAgICBudWxsLFxuICAgICAgICAgICAgbmV4dENoaWxkLFxuICAgICAgICAgICAgY29udGFpbmVyLFxuICAgICAgICAgICAgYW5jaG9yLFxuICAgICAgICAgICAgcGFyZW50Q29tcG9uZW50LFxuICAgICAgICAgICAgcGFyZW50U3VzcGVuc2UsXG4gICAgICAgICAgICBuYW1lc3BhY2UsXG4gICAgICAgICAgICBzbG90U2NvcGVJZHMsXG4gICAgICAgICAgICBvcHRpbWl6ZWRcbiAgICAgICAgICApO1xuICAgICAgICB9IGVsc2UgaWYgKG1vdmVkKSB7XG4gICAgICAgICAgaWYgKGogPCAwIHx8IGkgIT09IGluY3JlYXNpbmdOZXdJbmRleFNlcXVlbmNlW2pdKSB7XG4gICAgICAgICAgICBtb3ZlKG5leHRDaGlsZCwgY29udGFpbmVyLCBhbmNob3IsIDIpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBqLS07XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9O1xuICBjb25zdCBtb3ZlID0gKHZub2RlLCBjb250YWluZXIsIGFuY2hvciwgbW92ZVR5cGUsIHBhcmVudFN1c3BlbnNlID0gbnVsbCkgPT4ge1xuICAgIGNvbnN0IHsgZWwsIHR5cGUsIHRyYW5zaXRpb24sIGNoaWxkcmVuLCBzaGFwZUZsYWcgfSA9IHZub2RlO1xuICAgIGlmIChzaGFwZUZsYWcgJiA2KSB7XG4gICAgICBtb3ZlKHZub2RlLmNvbXBvbmVudC5zdWJUcmVlLCBjb250YWluZXIsIGFuY2hvciwgbW92ZVR5cGUpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBpZiAoc2hhcGVGbGFnICYgMTI4KSB7XG4gICAgICB2bm9kZS5zdXNwZW5zZS5tb3ZlKGNvbnRhaW5lciwgYW5jaG9yLCBtb3ZlVHlwZSk7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGlmIChzaGFwZUZsYWcgJiA2NCkge1xuICAgICAgdHlwZS5tb3ZlKHZub2RlLCBjb250YWluZXIsIGFuY2hvciwgaW50ZXJuYWxzKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgaWYgKHR5cGUgPT09IEZyYWdtZW50KSB7XG4gICAgICBob3N0SW5zZXJ0KGVsLCBjb250YWluZXIsIGFuY2hvcik7XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGNoaWxkcmVuLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIG1vdmUoY2hpbGRyZW5baV0sIGNvbnRhaW5lciwgYW5jaG9yLCBtb3ZlVHlwZSk7XG4gICAgICB9XG4gICAgICBob3N0SW5zZXJ0KHZub2RlLmFuY2hvciwgY29udGFpbmVyLCBhbmNob3IpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBpZiAodHlwZSA9PT0gU3RhdGljKSB7XG4gICAgICBtb3ZlU3RhdGljTm9kZSh2bm9kZSwgY29udGFpbmVyLCBhbmNob3IpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBjb25zdCBuZWVkVHJhbnNpdGlvbjIgPSBtb3ZlVHlwZSAhPT0gMiAmJiBzaGFwZUZsYWcgJiAxICYmIHRyYW5zaXRpb247XG4gICAgaWYgKG5lZWRUcmFuc2l0aW9uMikge1xuICAgICAgaWYgKG1vdmVUeXBlID09PSAwKSB7XG4gICAgICAgIHRyYW5zaXRpb24uYmVmb3JlRW50ZXIoZWwpO1xuICAgICAgICBob3N0SW5zZXJ0KGVsLCBjb250YWluZXIsIGFuY2hvcik7XG4gICAgICAgIHF1ZXVlUG9zdFJlbmRlckVmZmVjdCgoKSA9PiB0cmFuc2l0aW9uLmVudGVyKGVsKSwgcGFyZW50U3VzcGVuc2UpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29uc3QgeyBsZWF2ZSwgZGVsYXlMZWF2ZSwgYWZ0ZXJMZWF2ZSB9ID0gdHJhbnNpdGlvbjtcbiAgICAgICAgY29uc3QgcmVtb3ZlMiA9ICgpID0+IHtcbiAgICAgICAgICBpZiAodm5vZGUuY3R4LmlzVW5tb3VudGVkKSB7XG4gICAgICAgICAgICBob3N0UmVtb3ZlKGVsKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgaG9zdEluc2VydChlbCwgY29udGFpbmVyLCBhbmNob3IpO1xuICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgICAgY29uc3QgcGVyZm9ybUxlYXZlID0gKCkgPT4ge1xuICAgICAgICAgIGlmIChlbC5faXNMZWF2aW5nKSB7XG4gICAgICAgICAgICBlbFtsZWF2ZUNiS2V5XShcbiAgICAgICAgICAgICAgdHJ1ZVxuICAgICAgICAgICAgICAvKiBjYW5jZWxsZWQgKi9cbiAgICAgICAgICAgICk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGxlYXZlKGVsLCAoKSA9PiB7XG4gICAgICAgICAgICByZW1vdmUyKCk7XG4gICAgICAgICAgICBhZnRlckxlYXZlICYmIGFmdGVyTGVhdmUoKTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfTtcbiAgICAgICAgaWYgKGRlbGF5TGVhdmUpIHtcbiAgICAgICAgICBkZWxheUxlYXZlKGVsLCByZW1vdmUyLCBwZXJmb3JtTGVhdmUpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHBlcmZvcm1MZWF2ZSgpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIGhvc3RJbnNlcnQoZWwsIGNvbnRhaW5lciwgYW5jaG9yKTtcbiAgICB9XG4gIH07XG4gIGNvbnN0IHVubW91bnQgPSAodm5vZGUsIHBhcmVudENvbXBvbmVudCwgcGFyZW50U3VzcGVuc2UsIGRvUmVtb3ZlID0gZmFsc2UsIG9wdGltaXplZCA9IGZhbHNlKSA9PiB7XG4gICAgY29uc3Qge1xuICAgICAgdHlwZSxcbiAgICAgIHByb3BzLFxuICAgICAgcmVmLFxuICAgICAgY2hpbGRyZW4sXG4gICAgICBkeW5hbWljQ2hpbGRyZW4sXG4gICAgICBzaGFwZUZsYWcsXG4gICAgICBwYXRjaEZsYWcsXG4gICAgICBkaXJzLFxuICAgICAgY2FjaGVJbmRleFxuICAgIH0gPSB2bm9kZTtcbiAgICBpZiAocGF0Y2hGbGFnID09PSAtMikge1xuICAgICAgb3B0aW1pemVkID0gZmFsc2U7XG4gICAgfVxuICAgIGlmIChyZWYgIT0gbnVsbCkge1xuICAgICAgcGF1c2VUcmFja2luZygpO1xuICAgICAgc2V0UmVmKHJlZiwgbnVsbCwgcGFyZW50U3VzcGVuc2UsIHZub2RlLCB0cnVlKTtcbiAgICAgIHJlc2V0VHJhY2tpbmcoKTtcbiAgICB9XG4gICAgaWYgKGNhY2hlSW5kZXggIT0gbnVsbCkge1xuICAgICAgcGFyZW50Q29tcG9uZW50LnJlbmRlckNhY2hlW2NhY2hlSW5kZXhdID0gdm9pZCAwO1xuICAgIH1cbiAgICBpZiAoc2hhcGVGbGFnICYgMjU2KSB7XG4gICAgICBwYXJlbnRDb21wb25lbnQuY3R4LmRlYWN0aXZhdGUodm5vZGUpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBjb25zdCBzaG91bGRJbnZva2VEaXJzID0gc2hhcGVGbGFnICYgMSAmJiBkaXJzO1xuICAgIGNvbnN0IHNob3VsZEludm9rZVZub2RlSG9vayA9ICFpc0FzeW5jV3JhcHBlcih2bm9kZSk7XG4gICAgbGV0IHZub2RlSG9vaztcbiAgICBpZiAoc2hvdWxkSW52b2tlVm5vZGVIb29rICYmICh2bm9kZUhvb2sgPSBwcm9wcyAmJiBwcm9wcy5vblZub2RlQmVmb3JlVW5tb3VudCkpIHtcbiAgICAgIGludm9rZVZOb2RlSG9vayh2bm9kZUhvb2ssIHBhcmVudENvbXBvbmVudCwgdm5vZGUpO1xuICAgIH1cbiAgICBpZiAoc2hhcGVGbGFnICYgNikge1xuICAgICAgdW5tb3VudENvbXBvbmVudCh2bm9kZS5jb21wb25lbnQsIHBhcmVudFN1c3BlbnNlLCBkb1JlbW92ZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGlmIChzaGFwZUZsYWcgJiAxMjgpIHtcbiAgICAgICAgdm5vZGUuc3VzcGVuc2UudW5tb3VudChwYXJlbnRTdXNwZW5zZSwgZG9SZW1vdmUpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBpZiAoc2hvdWxkSW52b2tlRGlycykge1xuICAgICAgICBpbnZva2VEaXJlY3RpdmVIb29rKHZub2RlLCBudWxsLCBwYXJlbnRDb21wb25lbnQsIFwiYmVmb3JlVW5tb3VudFwiKTtcbiAgICAgIH1cbiAgICAgIGlmIChzaGFwZUZsYWcgJiA2NCkge1xuICAgICAgICB2bm9kZS50eXBlLnJlbW92ZShcbiAgICAgICAgICB2bm9kZSxcbiAgICAgICAgICBwYXJlbnRDb21wb25lbnQsXG4gICAgICAgICAgcGFyZW50U3VzcGVuc2UsXG4gICAgICAgICAgaW50ZXJuYWxzLFxuICAgICAgICAgIGRvUmVtb3ZlXG4gICAgICAgICk7XG4gICAgICB9IGVsc2UgaWYgKGR5bmFtaWNDaGlsZHJlbiAmJiAvLyAjNTE1NFxuICAgICAgLy8gd2hlbiB2LW9uY2UgaXMgdXNlZCBpbnNpZGUgYSBibG9jaywgc2V0QmxvY2tUcmFja2luZygtMSkgbWFya3MgdGhlXG4gICAgICAvLyBwYXJlbnQgYmxvY2sgd2l0aCBoYXNPbmNlOiB0cnVlXG4gICAgICAvLyBzbyB0aGF0IGl0IGRvZXNuJ3QgdGFrZSB0aGUgZmFzdCBwYXRoIGR1cmluZyB1bm1vdW50IC0gb3RoZXJ3aXNlXG4gICAgICAvLyBjb21wb25lbnRzIG5lc3RlZCBpbiB2LW9uY2UgYXJlIG5ldmVyIHVubW91bnRlZC5cbiAgICAgICFkeW5hbWljQ2hpbGRyZW4uaGFzT25jZSAmJiAvLyAjMTE1MzogZmFzdCBwYXRoIHNob3VsZCBub3QgYmUgdGFrZW4gZm9yIG5vbi1zdGFibGUgKHYtZm9yKSBmcmFnbWVudHNcbiAgICAgICh0eXBlICE9PSBGcmFnbWVudCB8fCBwYXRjaEZsYWcgPiAwICYmIHBhdGNoRmxhZyAmIDY0KSkge1xuICAgICAgICB1bm1vdW50Q2hpbGRyZW4oXG4gICAgICAgICAgZHluYW1pY0NoaWxkcmVuLFxuICAgICAgICAgIHBhcmVudENvbXBvbmVudCxcbiAgICAgICAgICBwYXJlbnRTdXNwZW5zZSxcbiAgICAgICAgICBmYWxzZSxcbiAgICAgICAgICB0cnVlXG4gICAgICAgICk7XG4gICAgICB9IGVsc2UgaWYgKHR5cGUgPT09IEZyYWdtZW50ICYmIHBhdGNoRmxhZyAmICgxMjggfCAyNTYpIHx8ICFvcHRpbWl6ZWQgJiYgc2hhcGVGbGFnICYgMTYpIHtcbiAgICAgICAgdW5tb3VudENoaWxkcmVuKGNoaWxkcmVuLCBwYXJlbnRDb21wb25lbnQsIHBhcmVudFN1c3BlbnNlKTtcbiAgICAgIH1cbiAgICAgIGlmIChkb1JlbW92ZSkge1xuICAgICAgICByZW1vdmUodm5vZGUpO1xuICAgICAgfVxuICAgIH1cbiAgICBpZiAoc2hvdWxkSW52b2tlVm5vZGVIb29rICYmICh2bm9kZUhvb2sgPSBwcm9wcyAmJiBwcm9wcy5vblZub2RlVW5tb3VudGVkKSB8fCBzaG91bGRJbnZva2VEaXJzKSB7XG4gICAgICBxdWV1ZVBvc3RSZW5kZXJFZmZlY3QoKCkgPT4ge1xuICAgICAgICB2bm9kZUhvb2sgJiYgaW52b2tlVk5vZGVIb29rKHZub2RlSG9vaywgcGFyZW50Q29tcG9uZW50LCB2bm9kZSk7XG4gICAgICAgIHNob3VsZEludm9rZURpcnMgJiYgaW52b2tlRGlyZWN0aXZlSG9vayh2bm9kZSwgbnVsbCwgcGFyZW50Q29tcG9uZW50LCBcInVubW91bnRlZFwiKTtcbiAgICAgIH0sIHBhcmVudFN1c3BlbnNlKTtcbiAgICB9XG4gIH07XG4gIGNvbnN0IHJlbW92ZSA9ICh2bm9kZSkgPT4ge1xuICAgIGNvbnN0IHsgdHlwZSwgZWwsIGFuY2hvciwgdHJhbnNpdGlvbiB9ID0gdm5vZGU7XG4gICAgaWYgKHR5cGUgPT09IEZyYWdtZW50KSB7XG4gICAgICBpZiAoISEocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09IFwicHJvZHVjdGlvblwiKSAmJiB2bm9kZS5wYXRjaEZsYWcgPiAwICYmIHZub2RlLnBhdGNoRmxhZyAmIDIwNDggJiYgdHJhbnNpdGlvbiAmJiAhdHJhbnNpdGlvbi5wZXJzaXN0ZWQpIHtcbiAgICAgICAgdm5vZGUuY2hpbGRyZW4uZm9yRWFjaCgoY2hpbGQpID0+IHtcbiAgICAgICAgICBpZiAoY2hpbGQudHlwZSA9PT0gQ29tbWVudCkge1xuICAgICAgICAgICAgaG9zdFJlbW92ZShjaGlsZC5lbCk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJlbW92ZShjaGlsZCk7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJlbW92ZUZyYWdtZW50KGVsLCBhbmNob3IpO1xuICAgICAgfVxuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBpZiAodHlwZSA9PT0gU3RhdGljKSB7XG4gICAgICByZW1vdmVTdGF0aWNOb2RlKHZub2RlKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgY29uc3QgcGVyZm9ybVJlbW92ZSA9ICgpID0+IHtcbiAgICAgIGhvc3RSZW1vdmUoZWwpO1xuICAgICAgaWYgKHRyYW5zaXRpb24gJiYgIXRyYW5zaXRpb24ucGVyc2lzdGVkICYmIHRyYW5zaXRpb24uYWZ0ZXJMZWF2ZSkge1xuICAgICAgICB0cmFuc2l0aW9uLmFmdGVyTGVhdmUoKTtcbiAgICAgIH1cbiAgICB9O1xuICAgIGlmICh2bm9kZS5zaGFwZUZsYWcgJiAxICYmIHRyYW5zaXRpb24gJiYgIXRyYW5zaXRpb24ucGVyc2lzdGVkKSB7XG4gICAgICBjb25zdCB7IGxlYXZlLCBkZWxheUxlYXZlIH0gPSB0cmFuc2l0aW9uO1xuICAgICAgY29uc3QgcGVyZm9ybUxlYXZlID0gKCkgPT4gbGVhdmUoZWwsIHBlcmZvcm1SZW1vdmUpO1xuICAgICAgaWYgKGRlbGF5TGVhdmUpIHtcbiAgICAgICAgZGVsYXlMZWF2ZSh2bm9kZS5lbCwgcGVyZm9ybVJlbW92ZSwgcGVyZm9ybUxlYXZlKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHBlcmZvcm1MZWF2ZSgpO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBwZXJmb3JtUmVtb3ZlKCk7XG4gICAgfVxuICB9O1xuICBjb25zdCByZW1vdmVGcmFnbWVudCA9IChjdXIsIGVuZCkgPT4ge1xuICAgIGxldCBuZXh0O1xuICAgIHdoaWxlIChjdXIgIT09IGVuZCkge1xuICAgICAgbmV4dCA9IGhvc3ROZXh0U2libGluZyhjdXIpO1xuICAgICAgaG9zdFJlbW92ZShjdXIpO1xuICAgICAgY3VyID0gbmV4dDtcbiAgICB9XG4gICAgaG9zdFJlbW92ZShlbmQpO1xuICB9O1xuICBjb25zdCB1bm1vdW50Q29tcG9uZW50ID0gKGluc3RhbmNlLCBwYXJlbnRTdXNwZW5zZSwgZG9SZW1vdmUpID0+IHtcbiAgICBpZiAoISEocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09IFwicHJvZHVjdGlvblwiKSAmJiBpbnN0YW5jZS50eXBlLl9faG1ySWQpIHtcbiAgICAgIHVucmVnaXN0ZXJITVIoaW5zdGFuY2UpO1xuICAgIH1cbiAgICBjb25zdCB7IGJ1bSwgc2NvcGUsIGpvYiwgc3ViVHJlZSwgdW0sIG0sIGEgfSA9IGluc3RhbmNlO1xuICAgIGludmFsaWRhdGVNb3VudChtKTtcbiAgICBpbnZhbGlkYXRlTW91bnQoYSk7XG4gICAgaWYgKGJ1bSkge1xuICAgICAgaW52b2tlQXJyYXlGbnMoYnVtKTtcbiAgICB9XG4gICAgc2NvcGUuc3RvcCgpO1xuICAgIGlmIChqb2IpIHtcbiAgICAgIGpvYi5mbGFncyB8PSA4O1xuICAgICAgdW5tb3VudChzdWJUcmVlLCBpbnN0YW5jZSwgcGFyZW50U3VzcGVuc2UsIGRvUmVtb3ZlKTtcbiAgICB9XG4gICAgaWYgKHVtKSB7XG4gICAgICBxdWV1ZVBvc3RSZW5kZXJFZmZlY3QodW0sIHBhcmVudFN1c3BlbnNlKTtcbiAgICB9XG4gICAgcXVldWVQb3N0UmVuZGVyRWZmZWN0KCgpID0+IHtcbiAgICAgIGluc3RhbmNlLmlzVW5tb3VudGVkID0gdHJ1ZTtcbiAgICB9LCBwYXJlbnRTdXNwZW5zZSk7XG4gICAgaWYgKCEhKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSBcInByb2R1Y3Rpb25cIikgfHwgX19WVUVfUFJPRF9ERVZUT09MU19fKSB7XG4gICAgICBkZXZ0b29sc0NvbXBvbmVudFJlbW92ZWQoaW5zdGFuY2UpO1xuICAgIH1cbiAgfTtcbiAgY29uc3QgdW5tb3VudENoaWxkcmVuID0gKGNoaWxkcmVuLCBwYXJlbnRDb21wb25lbnQsIHBhcmVudFN1c3BlbnNlLCBkb1JlbW92ZSA9IGZhbHNlLCBvcHRpbWl6ZWQgPSBmYWxzZSwgc3RhcnQgPSAwKSA9PiB7XG4gICAgZm9yIChsZXQgaSA9IHN0YXJ0OyBpIDwgY2hpbGRyZW4ubGVuZ3RoOyBpKyspIHtcbiAgICAgIHVubW91bnQoY2hpbGRyZW5baV0sIHBhcmVudENvbXBvbmVudCwgcGFyZW50U3VzcGVuc2UsIGRvUmVtb3ZlLCBvcHRpbWl6ZWQpO1xuICAgIH1cbiAgfTtcbiAgY29uc3QgZ2V0TmV4dEhvc3ROb2RlID0gKHZub2RlKSA9PiB7XG4gICAgaWYgKHZub2RlLnNoYXBlRmxhZyAmIDYpIHtcbiAgICAgIHJldHVybiBnZXROZXh0SG9zdE5vZGUodm5vZGUuY29tcG9uZW50LnN1YlRyZWUpO1xuICAgIH1cbiAgICBpZiAodm5vZGUuc2hhcGVGbGFnICYgMTI4KSB7XG4gICAgICByZXR1cm4gdm5vZGUuc3VzcGVuc2UubmV4dCgpO1xuICAgIH1cbiAgICBjb25zdCBlbCA9IGhvc3ROZXh0U2libGluZyh2bm9kZS5hbmNob3IgfHwgdm5vZGUuZWwpO1xuICAgIGNvbnN0IHRlbGVwb3J0RW5kID0gZWwgJiYgZWxbVGVsZXBvcnRFbmRLZXldO1xuICAgIHJldHVybiB0ZWxlcG9ydEVuZCA/IGhvc3ROZXh0U2libGluZyh0ZWxlcG9ydEVuZCkgOiBlbDtcbiAgfTtcbiAgbGV0IGlzRmx1c2hpbmcgPSBmYWxzZTtcbiAgY29uc3QgcmVuZGVyID0gKHZub2RlLCBjb250YWluZXIsIG5hbWVzcGFjZSkgPT4ge1xuICAgIGxldCBpbnN0YW5jZTtcbiAgICBpZiAodm5vZGUgPT0gbnVsbCkge1xuICAgICAgaWYgKGNvbnRhaW5lci5fdm5vZGUpIHtcbiAgICAgICAgdW5tb3VudChjb250YWluZXIuX3Zub2RlLCBudWxsLCBudWxsLCB0cnVlKTtcbiAgICAgICAgaW5zdGFuY2UgPSBjb250YWluZXIuX3Zub2RlLmNvbXBvbmVudDtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgcGF0Y2goXG4gICAgICAgIGNvbnRhaW5lci5fdm5vZGUgfHwgbnVsbCxcbiAgICAgICAgdm5vZGUsXG4gICAgICAgIGNvbnRhaW5lcixcbiAgICAgICAgbnVsbCxcbiAgICAgICAgbnVsbCxcbiAgICAgICAgbnVsbCxcbiAgICAgICAgbmFtZXNwYWNlXG4gICAgICApO1xuICAgIH1cbiAgICBjb250YWluZXIuX3Zub2RlID0gdm5vZGU7XG4gICAgaWYgKCFpc0ZsdXNoaW5nKSB7XG4gICAgICBpc0ZsdXNoaW5nID0gdHJ1ZTtcbiAgICAgIGZsdXNoUHJlRmx1c2hDYnMoaW5zdGFuY2UpO1xuICAgICAgZmx1c2hQb3N0Rmx1c2hDYnMoKTtcbiAgICAgIGlzRmx1c2hpbmcgPSBmYWxzZTtcbiAgICB9XG4gIH07XG4gIGNvbnN0IGludGVybmFscyA9IHtcbiAgICBwOiBwYXRjaCxcbiAgICB1bTogdW5tb3VudCxcbiAgICBtOiBtb3ZlLFxuICAgIHI6IHJlbW92ZSxcbiAgICBtdDogbW91bnRDb21wb25lbnQsXG4gICAgbWM6IG1vdW50Q2hpbGRyZW4sXG4gICAgcGM6IHBhdGNoQ2hpbGRyZW4sXG4gICAgcGJjOiBwYXRjaEJsb2NrQ2hpbGRyZW4sXG4gICAgbjogZ2V0TmV4dEhvc3ROb2RlLFxuICAgIG86IG9wdGlvbnNcbiAgfTtcbiAgbGV0IGh5ZHJhdGU7XG4gIGxldCBoeWRyYXRlTm9kZTtcbiAgaWYgKGNyZWF0ZUh5ZHJhdGlvbkZucykge1xuICAgIFtoeWRyYXRlLCBoeWRyYXRlTm9kZV0gPSBjcmVhdGVIeWRyYXRpb25GbnMoXG4gICAgICBpbnRlcm5hbHNcbiAgICApO1xuICB9XG4gIHJldHVybiB7XG4gICAgcmVuZGVyLFxuICAgIGh5ZHJhdGUsXG4gICAgY3JlYXRlQXBwOiBjcmVhdGVBcHBBUEkocmVuZGVyLCBoeWRyYXRlKVxuICB9O1xufVxuZnVuY3Rpb24gcmVzb2x2ZUNoaWxkcmVuTmFtZXNwYWNlKHsgdHlwZSwgcHJvcHMgfSwgY3VycmVudE5hbWVzcGFjZSkge1xuICByZXR1cm4gY3VycmVudE5hbWVzcGFjZSA9PT0gXCJzdmdcIiAmJiB0eXBlID09PSBcImZvcmVpZ25PYmplY3RcIiB8fCBjdXJyZW50TmFtZXNwYWNlID09PSBcIm1hdGhtbFwiICYmIHR5cGUgPT09IFwiYW5ub3RhdGlvbi14bWxcIiAmJiBwcm9wcyAmJiBwcm9wcy5lbmNvZGluZyAmJiBwcm9wcy5lbmNvZGluZy5pbmNsdWRlcyhcImh0bWxcIikgPyB2b2lkIDAgOiBjdXJyZW50TmFtZXNwYWNlO1xufVxuZnVuY3Rpb24gdG9nZ2xlUmVjdXJzZSh7IGVmZmVjdCwgam9iIH0sIGFsbG93ZWQpIHtcbiAgaWYgKGFsbG93ZWQpIHtcbiAgICBlZmZlY3QuZmxhZ3MgfD0gMzI7XG4gICAgam9iLmZsYWdzIHw9IDQ7XG4gIH0gZWxzZSB7XG4gICAgZWZmZWN0LmZsYWdzICY9IC0zMztcbiAgICBqb2IuZmxhZ3MgJj0gLTU7XG4gIH1cbn1cbmZ1bmN0aW9uIG5lZWRUcmFuc2l0aW9uKHBhcmVudFN1c3BlbnNlLCB0cmFuc2l0aW9uKSB7XG4gIHJldHVybiAoIXBhcmVudFN1c3BlbnNlIHx8IHBhcmVudFN1c3BlbnNlICYmICFwYXJlbnRTdXNwZW5zZS5wZW5kaW5nQnJhbmNoKSAmJiB0cmFuc2l0aW9uICYmICF0cmFuc2l0aW9uLnBlcnNpc3RlZDtcbn1cbmZ1bmN0aW9uIHRyYXZlcnNlU3RhdGljQ2hpbGRyZW4objEsIG4yLCBzaGFsbG93ID0gZmFsc2UpIHtcbiAgY29uc3QgY2gxID0gbjEuY2hpbGRyZW47XG4gIGNvbnN0IGNoMiA9IG4yLmNoaWxkcmVuO1xuICBpZiAoaXNBcnJheShjaDEpICYmIGlzQXJyYXkoY2gyKSkge1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgY2gxLmxlbmd0aDsgaSsrKSB7XG4gICAgICBjb25zdCBjMSA9IGNoMVtpXTtcbiAgICAgIGxldCBjMiA9IGNoMltpXTtcbiAgICAgIGlmIChjMi5zaGFwZUZsYWcgJiAxICYmICFjMi5keW5hbWljQ2hpbGRyZW4pIHtcbiAgICAgICAgaWYgKGMyLnBhdGNoRmxhZyA8PSAwIHx8IGMyLnBhdGNoRmxhZyA9PT0gMzIpIHtcbiAgICAgICAgICBjMiA9IGNoMltpXSA9IGNsb25lSWZNb3VudGVkKGNoMltpXSk7XG4gICAgICAgICAgYzIuZWwgPSBjMS5lbDtcbiAgICAgICAgfVxuICAgICAgICBpZiAoIXNoYWxsb3cgJiYgYzIucGF0Y2hGbGFnICE9PSAtMilcbiAgICAgICAgICB0cmF2ZXJzZVN0YXRpY0NoaWxkcmVuKGMxLCBjMik7XG4gICAgICB9XG4gICAgICBpZiAoYzIudHlwZSA9PT0gVGV4dCkge1xuICAgICAgICBpZiAoYzIucGF0Y2hGbGFnID09PSAtMSkge1xuICAgICAgICAgIGMyID0gY2gyW2ldID0gY2xvbmVJZk1vdW50ZWQoYzIpO1xuICAgICAgICB9XG4gICAgICAgIGMyLmVsID0gYzEuZWw7XG4gICAgICB9XG4gICAgICBpZiAoYzIudHlwZSA9PT0gQ29tbWVudCAmJiAhYzIuZWwpIHtcbiAgICAgICAgYzIuZWwgPSBjMS5lbDtcbiAgICAgIH1cbiAgICAgIGlmICghIShwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gXCJwcm9kdWN0aW9uXCIpKSB7XG4gICAgICAgIGMyLmVsICYmIChjMi5lbC5fX3Zub2RlID0gYzIpO1xuICAgICAgfVxuICAgIH1cbiAgfVxufVxuZnVuY3Rpb24gZ2V0U2VxdWVuY2UoYXJyKSB7XG4gIGNvbnN0IHAgPSBhcnIuc2xpY2UoKTtcbiAgY29uc3QgcmVzdWx0ID0gWzBdO1xuICBsZXQgaSwgaiwgdSwgdiwgYztcbiAgY29uc3QgbGVuID0gYXJyLmxlbmd0aDtcbiAgZm9yIChpID0gMDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgY29uc3QgYXJySSA9IGFycltpXTtcbiAgICBpZiAoYXJySSAhPT0gMCkge1xuICAgICAgaiA9IHJlc3VsdFtyZXN1bHQubGVuZ3RoIC0gMV07XG4gICAgICBpZiAoYXJyW2pdIDwgYXJySSkge1xuICAgICAgICBwW2ldID0gajtcbiAgICAgICAgcmVzdWx0LnB1c2goaSk7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuICAgICAgdSA9IDA7XG4gICAgICB2ID0gcmVzdWx0Lmxlbmd0aCAtIDE7XG4gICAgICB3aGlsZSAodSA8IHYpIHtcbiAgICAgICAgYyA9IHUgKyB2ID4+IDE7XG4gICAgICAgIGlmIChhcnJbcmVzdWx0W2NdXSA8IGFyckkpIHtcbiAgICAgICAgICB1ID0gYyArIDE7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdiA9IGM7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGlmIChhcnJJIDwgYXJyW3Jlc3VsdFt1XV0pIHtcbiAgICAgICAgaWYgKHUgPiAwKSB7XG4gICAgICAgICAgcFtpXSA9IHJlc3VsdFt1IC0gMV07XG4gICAgICAgIH1cbiAgICAgICAgcmVzdWx0W3VdID0gaTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgdSA9IHJlc3VsdC5sZW5ndGg7XG4gIHYgPSByZXN1bHRbdSAtIDFdO1xuICB3aGlsZSAodS0tID4gMCkge1xuICAgIHJlc3VsdFt1XSA9IHY7XG4gICAgdiA9IHBbdl07XG4gIH1cbiAgcmV0dXJuIHJlc3VsdDtcbn1cbmZ1bmN0aW9uIGxvY2F0ZU5vbkh5ZHJhdGVkQXN5bmNSb290KGluc3RhbmNlKSB7XG4gIGNvbnN0IHN1YkNvbXBvbmVudCA9IGluc3RhbmNlLnN1YlRyZWUuY29tcG9uZW50O1xuICBpZiAoc3ViQ29tcG9uZW50KSB7XG4gICAgaWYgKHN1YkNvbXBvbmVudC5hc3luY0RlcCAmJiAhc3ViQ29tcG9uZW50LmFzeW5jUmVzb2x2ZWQpIHtcbiAgICAgIHJldHVybiBzdWJDb21wb25lbnQ7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBsb2NhdGVOb25IeWRyYXRlZEFzeW5jUm9vdChzdWJDb21wb25lbnQpO1xuICAgIH1cbiAgfVxufVxuZnVuY3Rpb24gaW52YWxpZGF0ZU1vdW50KGhvb2tzKSB7XG4gIGlmIChob29rcykge1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgaG9va3MubGVuZ3RoOyBpKyspXG4gICAgICBob29rc1tpXS5mbGFncyB8PSA4O1xuICB9XG59XG5mdW5jdGlvbiByZXNvbHZlQXN5bmNDb21wb25lbnRQbGFjZWhvbGRlcihhbmNob3JWbm9kZSkge1xuICBpZiAoYW5jaG9yVm5vZGUucGxhY2Vob2xkZXIpIHtcbiAgICByZXR1cm4gYW5jaG9yVm5vZGUucGxhY2Vob2xkZXI7XG4gIH1cbiAgY29uc3QgaW5zdGFuY2UgPSBhbmNob3JWbm9kZS5jb21wb25lbnQ7XG4gIGlmIChpbnN0YW5jZSkge1xuICAgIHJldHVybiByZXNvbHZlQXN5bmNDb21wb25lbnRQbGFjZWhvbGRlcihpbnN0YW5jZS5zdWJUcmVlKTtcbiAgfVxuICByZXR1cm4gbnVsbDtcbn1cblxuY29uc3QgaXNTdXNwZW5zZSA9ICh0eXBlKSA9PiB0eXBlLl9faXNTdXNwZW5zZTtcbmxldCBzdXNwZW5zZUlkID0gMDtcbmNvbnN0IFN1c3BlbnNlSW1wbCA9IHtcbiAgbmFtZTogXCJTdXNwZW5zZVwiLFxuICAvLyBJbiBvcmRlciB0byBtYWtlIFN1c3BlbnNlIHRyZWUtc2hha2FibGUsIHdlIG5lZWQgdG8gYXZvaWQgaW1wb3J0aW5nIGl0XG4gIC8vIGRpcmVjdGx5IGluIHRoZSByZW5kZXJlci4gVGhlIHJlbmRlcmVyIGNoZWNrcyBmb3IgdGhlIF9faXNTdXNwZW5zZSBmbGFnXG4gIC8vIG9uIGEgdm5vZGUncyB0eXBlIGFuZCBjYWxscyB0aGUgYHByb2Nlc3NgIG1ldGhvZCwgcGFzc2luZyBpbiByZW5kZXJlclxuICAvLyBpbnRlcm5hbHMuXG4gIF9faXNTdXNwZW5zZTogdHJ1ZSxcbiAgcHJvY2VzcyhuMSwgbjIsIGNvbnRhaW5lciwgYW5jaG9yLCBwYXJlbnRDb21wb25lbnQsIHBhcmVudFN1c3BlbnNlLCBuYW1lc3BhY2UsIHNsb3RTY29wZUlkcywgb3B0aW1pemVkLCByZW5kZXJlckludGVybmFscykge1xuICAgIGlmIChuMSA9PSBudWxsKSB7XG4gICAgICBtb3VudFN1c3BlbnNlKFxuICAgICAgICBuMixcbiAgICAgICAgY29udGFpbmVyLFxuICAgICAgICBhbmNob3IsXG4gICAgICAgIHBhcmVudENvbXBvbmVudCxcbiAgICAgICAgcGFyZW50U3VzcGVuc2UsXG4gICAgICAgIG5hbWVzcGFjZSxcbiAgICAgICAgc2xvdFNjb3BlSWRzLFxuICAgICAgICBvcHRpbWl6ZWQsXG4gICAgICAgIHJlbmRlcmVySW50ZXJuYWxzXG4gICAgICApO1xuICAgIH0gZWxzZSB7XG4gICAgICBpZiAocGFyZW50U3VzcGVuc2UgJiYgcGFyZW50U3VzcGVuc2UuZGVwcyA+IDAgJiYgIW4xLnN1c3BlbnNlLmlzSW5GYWxsYmFjaykge1xuICAgICAgICBuMi5zdXNwZW5zZSA9IG4xLnN1c3BlbnNlO1xuICAgICAgICBuMi5zdXNwZW5zZS52bm9kZSA9IG4yO1xuICAgICAgICBuMi5lbCA9IG4xLmVsO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBwYXRjaFN1c3BlbnNlKFxuICAgICAgICBuMSxcbiAgICAgICAgbjIsXG4gICAgICAgIGNvbnRhaW5lcixcbiAgICAgICAgYW5jaG9yLFxuICAgICAgICBwYXJlbnRDb21wb25lbnQsXG4gICAgICAgIG5hbWVzcGFjZSxcbiAgICAgICAgc2xvdFNjb3BlSWRzLFxuICAgICAgICBvcHRpbWl6ZWQsXG4gICAgICAgIHJlbmRlcmVySW50ZXJuYWxzXG4gICAgICApO1xuICAgIH1cbiAgfSxcbiAgaHlkcmF0ZTogaHlkcmF0ZVN1c3BlbnNlLFxuICBub3JtYWxpemU6IG5vcm1hbGl6ZVN1c3BlbnNlQ2hpbGRyZW5cbn07XG5jb25zdCBTdXNwZW5zZSA9IFN1c3BlbnNlSW1wbCA7XG5mdW5jdGlvbiB0cmlnZ2VyRXZlbnQodm5vZGUsIG5hbWUpIHtcbiAgY29uc3QgZXZlbnRMaXN0ZW5lciA9IHZub2RlLnByb3BzICYmIHZub2RlLnByb3BzW25hbWVdO1xuICBpZiAoaXNGdW5jdGlvbihldmVudExpc3RlbmVyKSkge1xuICAgIGV2ZW50TGlzdGVuZXIoKTtcbiAgfVxufVxuZnVuY3Rpb24gbW91bnRTdXNwZW5zZSh2bm9kZSwgY29udGFpbmVyLCBhbmNob3IsIHBhcmVudENvbXBvbmVudCwgcGFyZW50U3VzcGVuc2UsIG5hbWVzcGFjZSwgc2xvdFNjb3BlSWRzLCBvcHRpbWl6ZWQsIHJlbmRlcmVySW50ZXJuYWxzKSB7XG4gIGNvbnN0IHtcbiAgICBwOiBwYXRjaCxcbiAgICBvOiB7IGNyZWF0ZUVsZW1lbnQgfVxuICB9ID0gcmVuZGVyZXJJbnRlcm5hbHM7XG4gIGNvbnN0IGhpZGRlbkNvbnRhaW5lciA9IGNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gIGNvbnN0IHN1c3BlbnNlID0gdm5vZGUuc3VzcGVuc2UgPSBjcmVhdGVTdXNwZW5zZUJvdW5kYXJ5KFxuICAgIHZub2RlLFxuICAgIHBhcmVudFN1c3BlbnNlLFxuICAgIHBhcmVudENvbXBvbmVudCxcbiAgICBjb250YWluZXIsXG4gICAgaGlkZGVuQ29udGFpbmVyLFxuICAgIGFuY2hvcixcbiAgICBuYW1lc3BhY2UsXG4gICAgc2xvdFNjb3BlSWRzLFxuICAgIG9wdGltaXplZCxcbiAgICByZW5kZXJlckludGVybmFsc1xuICApO1xuICBwYXRjaChcbiAgICBudWxsLFxuICAgIHN1c3BlbnNlLnBlbmRpbmdCcmFuY2ggPSB2bm9kZS5zc0NvbnRlbnQsXG4gICAgaGlkZGVuQ29udGFpbmVyLFxuICAgIG51bGwsXG4gICAgcGFyZW50Q29tcG9uZW50LFxuICAgIHN1c3BlbnNlLFxuICAgIG5hbWVzcGFjZSxcbiAgICBzbG90U2NvcGVJZHNcbiAgKTtcbiAgaWYgKHN1c3BlbnNlLmRlcHMgPiAwKSB7XG4gICAgdHJpZ2dlckV2ZW50KHZub2RlLCBcIm9uUGVuZGluZ1wiKTtcbiAgICB0cmlnZ2VyRXZlbnQodm5vZGUsIFwib25GYWxsYmFja1wiKTtcbiAgICBwYXRjaChcbiAgICAgIG51bGwsXG4gICAgICB2bm9kZS5zc0ZhbGxiYWNrLFxuICAgICAgY29udGFpbmVyLFxuICAgICAgYW5jaG9yLFxuICAgICAgcGFyZW50Q29tcG9uZW50LFxuICAgICAgbnVsbCxcbiAgICAgIC8vIGZhbGxiYWNrIHRyZWUgd2lsbCBub3QgaGF2ZSBzdXNwZW5zZSBjb250ZXh0XG4gICAgICBuYW1lc3BhY2UsXG4gICAgICBzbG90U2NvcGVJZHNcbiAgICApO1xuICAgIHNldEFjdGl2ZUJyYW5jaChzdXNwZW5zZSwgdm5vZGUuc3NGYWxsYmFjayk7XG4gIH0gZWxzZSB7XG4gICAgc3VzcGVuc2UucmVzb2x2ZShmYWxzZSwgdHJ1ZSk7XG4gIH1cbn1cbmZ1bmN0aW9uIHBhdGNoU3VzcGVuc2UobjEsIG4yLCBjb250YWluZXIsIGFuY2hvciwgcGFyZW50Q29tcG9uZW50LCBuYW1lc3BhY2UsIHNsb3RTY29wZUlkcywgb3B0aW1pemVkLCB7IHA6IHBhdGNoLCB1bTogdW5tb3VudCwgbzogeyBjcmVhdGVFbGVtZW50IH0gfSkge1xuICBjb25zdCBzdXNwZW5zZSA9IG4yLnN1c3BlbnNlID0gbjEuc3VzcGVuc2U7XG4gIHN1c3BlbnNlLnZub2RlID0gbjI7XG4gIG4yLmVsID0gbjEuZWw7XG4gIGNvbnN0IG5ld0JyYW5jaCA9IG4yLnNzQ29udGVudDtcbiAgY29uc3QgbmV3RmFsbGJhY2sgPSBuMi5zc0ZhbGxiYWNrO1xuICBjb25zdCB7IGFjdGl2ZUJyYW5jaCwgcGVuZGluZ0JyYW5jaCwgaXNJbkZhbGxiYWNrLCBpc0h5ZHJhdGluZyB9ID0gc3VzcGVuc2U7XG4gIGlmIChwZW5kaW5nQnJhbmNoKSB7XG4gICAgc3VzcGVuc2UucGVuZGluZ0JyYW5jaCA9IG5ld0JyYW5jaDtcbiAgICBpZiAoaXNTYW1lVk5vZGVUeXBlKHBlbmRpbmdCcmFuY2gsIG5ld0JyYW5jaCkpIHtcbiAgICAgIHBhdGNoKFxuICAgICAgICBwZW5kaW5nQnJhbmNoLFxuICAgICAgICBuZXdCcmFuY2gsXG4gICAgICAgIHN1c3BlbnNlLmhpZGRlbkNvbnRhaW5lcixcbiAgICAgICAgbnVsbCxcbiAgICAgICAgcGFyZW50Q29tcG9uZW50LFxuICAgICAgICBzdXNwZW5zZSxcbiAgICAgICAgbmFtZXNwYWNlLFxuICAgICAgICBzbG90U2NvcGVJZHMsXG4gICAgICAgIG9wdGltaXplZFxuICAgICAgKTtcbiAgICAgIGlmIChzdXNwZW5zZS5kZXBzIDw9IDApIHtcbiAgICAgICAgc3VzcGVuc2UucmVzb2x2ZSgpO1xuICAgICAgfSBlbHNlIGlmIChpc0luRmFsbGJhY2spIHtcbiAgICAgICAgaWYgKCFpc0h5ZHJhdGluZykge1xuICAgICAgICAgIHBhdGNoKFxuICAgICAgICAgICAgYWN0aXZlQnJhbmNoLFxuICAgICAgICAgICAgbmV3RmFsbGJhY2ssXG4gICAgICAgICAgICBjb250YWluZXIsXG4gICAgICAgICAgICBhbmNob3IsXG4gICAgICAgICAgICBwYXJlbnRDb21wb25lbnQsXG4gICAgICAgICAgICBudWxsLFxuICAgICAgICAgICAgLy8gZmFsbGJhY2sgdHJlZSB3aWxsIG5vdCBoYXZlIHN1c3BlbnNlIGNvbnRleHRcbiAgICAgICAgICAgIG5hbWVzcGFjZSxcbiAgICAgICAgICAgIHNsb3RTY29wZUlkcyxcbiAgICAgICAgICAgIG9wdGltaXplZFxuICAgICAgICAgICk7XG4gICAgICAgICAgc2V0QWN0aXZlQnJhbmNoKHN1c3BlbnNlLCBuZXdGYWxsYmFjayk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgc3VzcGVuc2UucGVuZGluZ0lkID0gc3VzcGVuc2VJZCsrO1xuICAgICAgaWYgKGlzSHlkcmF0aW5nKSB7XG4gICAgICAgIHN1c3BlbnNlLmlzSHlkcmF0aW5nID0gZmFsc2U7XG4gICAgICAgIHN1c3BlbnNlLmFjdGl2ZUJyYW5jaCA9IHBlbmRpbmdCcmFuY2g7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB1bm1vdW50KHBlbmRpbmdCcmFuY2gsIHBhcmVudENvbXBvbmVudCwgc3VzcGVuc2UpO1xuICAgICAgfVxuICAgICAgc3VzcGVuc2UuZGVwcyA9IDA7XG4gICAgICBzdXNwZW5zZS5lZmZlY3RzLmxlbmd0aCA9IDA7XG4gICAgICBzdXNwZW5zZS5oaWRkZW5Db250YWluZXIgPSBjcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICAgICAgaWYgKGlzSW5GYWxsYmFjaykge1xuICAgICAgICBwYXRjaChcbiAgICAgICAgICBudWxsLFxuICAgICAgICAgIG5ld0JyYW5jaCxcbiAgICAgICAgICBzdXNwZW5zZS5oaWRkZW5Db250YWluZXIsXG4gICAgICAgICAgbnVsbCxcbiAgICAgICAgICBwYXJlbnRDb21wb25lbnQsXG4gICAgICAgICAgc3VzcGVuc2UsXG4gICAgICAgICAgbmFtZXNwYWNlLFxuICAgICAgICAgIHNsb3RTY29wZUlkcyxcbiAgICAgICAgICBvcHRpbWl6ZWRcbiAgICAgICAgKTtcbiAgICAgICAgaWYgKHN1c3BlbnNlLmRlcHMgPD0gMCkge1xuICAgICAgICAgIHN1c3BlbnNlLnJlc29sdmUoKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBwYXRjaChcbiAgICAgICAgICAgIGFjdGl2ZUJyYW5jaCxcbiAgICAgICAgICAgIG5ld0ZhbGxiYWNrLFxuICAgICAgICAgICAgY29udGFpbmVyLFxuICAgICAgICAgICAgYW5jaG9yLFxuICAgICAgICAgICAgcGFyZW50Q29tcG9uZW50LFxuICAgICAgICAgICAgbnVsbCxcbiAgICAgICAgICAgIC8vIGZhbGxiYWNrIHRyZWUgd2lsbCBub3QgaGF2ZSBzdXNwZW5zZSBjb250ZXh0XG4gICAgICAgICAgICBuYW1lc3BhY2UsXG4gICAgICAgICAgICBzbG90U2NvcGVJZHMsXG4gICAgICAgICAgICBvcHRpbWl6ZWRcbiAgICAgICAgICApO1xuICAgICAgICAgIHNldEFjdGl2ZUJyYW5jaChzdXNwZW5zZSwgbmV3RmFsbGJhY2spO1xuICAgICAgICB9XG4gICAgICB9IGVsc2UgaWYgKGFjdGl2ZUJyYW5jaCAmJiBpc1NhbWVWTm9kZVR5cGUoYWN0aXZlQnJhbmNoLCBuZXdCcmFuY2gpKSB7XG4gICAgICAgIHBhdGNoKFxuICAgICAgICAgIGFjdGl2ZUJyYW5jaCxcbiAgICAgICAgICBuZXdCcmFuY2gsXG4gICAgICAgICAgY29udGFpbmVyLFxuICAgICAgICAgIGFuY2hvcixcbiAgICAgICAgICBwYXJlbnRDb21wb25lbnQsXG4gICAgICAgICAgc3VzcGVuc2UsXG4gICAgICAgICAgbmFtZXNwYWNlLFxuICAgICAgICAgIHNsb3RTY29wZUlkcyxcbiAgICAgICAgICBvcHRpbWl6ZWRcbiAgICAgICAgKTtcbiAgICAgICAgc3VzcGVuc2UucmVzb2x2ZSh0cnVlKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHBhdGNoKFxuICAgICAgICAgIG51bGwsXG4gICAgICAgICAgbmV3QnJhbmNoLFxuICAgICAgICAgIHN1c3BlbnNlLmhpZGRlbkNvbnRhaW5lcixcbiAgICAgICAgICBudWxsLFxuICAgICAgICAgIHBhcmVudENvbXBvbmVudCxcbiAgICAgICAgICBzdXNwZW5zZSxcbiAgICAgICAgICBuYW1lc3BhY2UsXG4gICAgICAgICAgc2xvdFNjb3BlSWRzLFxuICAgICAgICAgIG9wdGltaXplZFxuICAgICAgICApO1xuICAgICAgICBpZiAoc3VzcGVuc2UuZGVwcyA8PSAwKSB7XG4gICAgICAgICAgc3VzcGVuc2UucmVzb2x2ZSgpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIGlmIChhY3RpdmVCcmFuY2ggJiYgaXNTYW1lVk5vZGVUeXBlKGFjdGl2ZUJyYW5jaCwgbmV3QnJhbmNoKSkge1xuICAgICAgcGF0Y2goXG4gICAgICAgIGFjdGl2ZUJyYW5jaCxcbiAgICAgICAgbmV3QnJhbmNoLFxuICAgICAgICBjb250YWluZXIsXG4gICAgICAgIGFuY2hvcixcbiAgICAgICAgcGFyZW50Q29tcG9uZW50LFxuICAgICAgICBzdXNwZW5zZSxcbiAgICAgICAgbmFtZXNwYWNlLFxuICAgICAgICBzbG90U2NvcGVJZHMsXG4gICAgICAgIG9wdGltaXplZFxuICAgICAgKTtcbiAgICAgIHNldEFjdGl2ZUJyYW5jaChzdXNwZW5zZSwgbmV3QnJhbmNoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdHJpZ2dlckV2ZW50KG4yLCBcIm9uUGVuZGluZ1wiKTtcbiAgICAgIHN1c3BlbnNlLnBlbmRpbmdCcmFuY2ggPSBuZXdCcmFuY2g7XG4gICAgICBpZiAobmV3QnJhbmNoLnNoYXBlRmxhZyAmIDUxMikge1xuICAgICAgICBzdXNwZW5zZS5wZW5kaW5nSWQgPSBuZXdCcmFuY2guY29tcG9uZW50LnN1c3BlbnNlSWQ7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBzdXNwZW5zZS5wZW5kaW5nSWQgPSBzdXNwZW5zZUlkKys7XG4gICAgICB9XG4gICAgICBwYXRjaChcbiAgICAgICAgbnVsbCxcbiAgICAgICAgbmV3QnJhbmNoLFxuICAgICAgICBzdXNwZW5zZS5oaWRkZW5Db250YWluZXIsXG4gICAgICAgIG51bGwsXG4gICAgICAgIHBhcmVudENvbXBvbmVudCxcbiAgICAgICAgc3VzcGVuc2UsXG4gICAgICAgIG5hbWVzcGFjZSxcbiAgICAgICAgc2xvdFNjb3BlSWRzLFxuICAgICAgICBvcHRpbWl6ZWRcbiAgICAgICk7XG4gICAgICBpZiAoc3VzcGVuc2UuZGVwcyA8PSAwKSB7XG4gICAgICAgIHN1c3BlbnNlLnJlc29sdmUoKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnN0IHsgdGltZW91dCwgcGVuZGluZ0lkIH0gPSBzdXNwZW5zZTtcbiAgICAgICAgaWYgKHRpbWVvdXQgPiAwKSB7XG4gICAgICAgICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgICBpZiAoc3VzcGVuc2UucGVuZGluZ0lkID09PSBwZW5kaW5nSWQpIHtcbiAgICAgICAgICAgICAgc3VzcGVuc2UuZmFsbGJhY2sobmV3RmFsbGJhY2spO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0sIHRpbWVvdXQpO1xuICAgICAgICB9IGVsc2UgaWYgKHRpbWVvdXQgPT09IDApIHtcbiAgICAgICAgICBzdXNwZW5zZS5mYWxsYmFjayhuZXdGYWxsYmFjayk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cbmxldCBoYXNXYXJuZWQgPSBmYWxzZTtcbmZ1bmN0aW9uIGNyZWF0ZVN1c3BlbnNlQm91bmRhcnkodm5vZGUsIHBhcmVudFN1c3BlbnNlLCBwYXJlbnRDb21wb25lbnQsIGNvbnRhaW5lciwgaGlkZGVuQ29udGFpbmVyLCBhbmNob3IsIG5hbWVzcGFjZSwgc2xvdFNjb3BlSWRzLCBvcHRpbWl6ZWQsIHJlbmRlcmVySW50ZXJuYWxzLCBpc0h5ZHJhdGluZyA9IGZhbHNlKSB7XG4gIGlmICghIShwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gXCJwcm9kdWN0aW9uXCIpICYmIHRydWUgJiYgIWhhc1dhcm5lZCkge1xuICAgIGhhc1dhcm5lZCA9IHRydWU7XG4gICAgY29uc29sZVtjb25zb2xlLmluZm8gPyBcImluZm9cIiA6IFwibG9nXCJdKFxuICAgICAgYDxTdXNwZW5zZT4gaXMgYW4gZXhwZXJpbWVudGFsIGZlYXR1cmUgYW5kIGl0cyBBUEkgd2lsbCBsaWtlbHkgY2hhbmdlLmBcbiAgICApO1xuICB9XG4gIGNvbnN0IHtcbiAgICBwOiBwYXRjaCxcbiAgICBtOiBtb3ZlLFxuICAgIHVtOiB1bm1vdW50LFxuICAgIG46IG5leHQsXG4gICAgbzogeyBwYXJlbnROb2RlLCByZW1vdmUgfVxuICB9ID0gcmVuZGVyZXJJbnRlcm5hbHM7XG4gIGxldCBwYXJlbnRTdXNwZW5zZUlkO1xuICBjb25zdCBpc1N1c3BlbnNpYmxlID0gaXNWTm9kZVN1c3BlbnNpYmxlKHZub2RlKTtcbiAgaWYgKGlzU3VzcGVuc2libGUpIHtcbiAgICBpZiAocGFyZW50U3VzcGVuc2UgJiYgcGFyZW50U3VzcGVuc2UucGVuZGluZ0JyYW5jaCkge1xuICAgICAgcGFyZW50U3VzcGVuc2VJZCA9IHBhcmVudFN1c3BlbnNlLnBlbmRpbmdJZDtcbiAgICAgIHBhcmVudFN1c3BlbnNlLmRlcHMrKztcbiAgICB9XG4gIH1cbiAgY29uc3QgdGltZW91dCA9IHZub2RlLnByb3BzID8gdG9OdW1iZXIodm5vZGUucHJvcHMudGltZW91dCkgOiB2b2lkIDA7XG4gIGlmICghIShwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gXCJwcm9kdWN0aW9uXCIpKSB7XG4gICAgYXNzZXJ0TnVtYmVyKHRpbWVvdXQsIGBTdXNwZW5zZSB0aW1lb3V0YCk7XG4gIH1cbiAgY29uc3QgaW5pdGlhbEFuY2hvciA9IGFuY2hvcjtcbiAgY29uc3Qgc3VzcGVuc2UgPSB7XG4gICAgdm5vZGUsXG4gICAgcGFyZW50OiBwYXJlbnRTdXNwZW5zZSxcbiAgICBwYXJlbnRDb21wb25lbnQsXG4gICAgbmFtZXNwYWNlLFxuICAgIGNvbnRhaW5lcixcbiAgICBoaWRkZW5Db250YWluZXIsXG4gICAgZGVwczogMCxcbiAgICBwZW5kaW5nSWQ6IHN1c3BlbnNlSWQrKyxcbiAgICB0aW1lb3V0OiB0eXBlb2YgdGltZW91dCA9PT0gXCJudW1iZXJcIiA/IHRpbWVvdXQgOiAtMSxcbiAgICBhY3RpdmVCcmFuY2g6IG51bGwsXG4gICAgcGVuZGluZ0JyYW5jaDogbnVsbCxcbiAgICBpc0luRmFsbGJhY2s6ICFpc0h5ZHJhdGluZyxcbiAgICBpc0h5ZHJhdGluZyxcbiAgICBpc1VubW91bnRlZDogZmFsc2UsXG4gICAgZWZmZWN0czogW10sXG4gICAgcmVzb2x2ZShyZXN1bWUgPSBmYWxzZSwgc3luYyA9IGZhbHNlKSB7XG4gICAgICBpZiAoISEocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09IFwicHJvZHVjdGlvblwiKSkge1xuICAgICAgICBpZiAoIXJlc3VtZSAmJiAhc3VzcGVuc2UucGVuZGluZ0JyYW5jaCkge1xuICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgICAgIGBzdXNwZW5zZS5yZXNvbHZlKCkgaXMgY2FsbGVkIHdpdGhvdXQgYSBwZW5kaW5nIGJyYW5jaC5gXG4gICAgICAgICAgKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoc3VzcGVuc2UuaXNVbm1vdW50ZWQpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgICAgICBgc3VzcGVuc2UucmVzb2x2ZSgpIGlzIGNhbGxlZCBvbiBhbiBhbHJlYWR5IHVubW91bnRlZCBzdXNwZW5zZSBib3VuZGFyeS5gXG4gICAgICAgICAgKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgY29uc3Qge1xuICAgICAgICB2bm9kZTogdm5vZGUyLFxuICAgICAgICBhY3RpdmVCcmFuY2gsXG4gICAgICAgIHBlbmRpbmdCcmFuY2gsXG4gICAgICAgIHBlbmRpbmdJZCxcbiAgICAgICAgZWZmZWN0cyxcbiAgICAgICAgcGFyZW50Q29tcG9uZW50OiBwYXJlbnRDb21wb25lbnQyLFxuICAgICAgICBjb250YWluZXI6IGNvbnRhaW5lcjIsXG4gICAgICAgIGlzSW5GYWxsYmFja1xuICAgICAgfSA9IHN1c3BlbnNlO1xuICAgICAgbGV0IGRlbGF5RW50ZXIgPSBmYWxzZTtcbiAgICAgIGlmIChzdXNwZW5zZS5pc0h5ZHJhdGluZykge1xuICAgICAgICBzdXNwZW5zZS5pc0h5ZHJhdGluZyA9IGZhbHNlO1xuICAgICAgfSBlbHNlIGlmICghcmVzdW1lKSB7XG4gICAgICAgIGRlbGF5RW50ZXIgPSBhY3RpdmVCcmFuY2ggJiYgcGVuZGluZ0JyYW5jaC50cmFuc2l0aW9uICYmIHBlbmRpbmdCcmFuY2gudHJhbnNpdGlvbi5tb2RlID09PSBcIm91dC1pblwiO1xuICAgICAgICBpZiAoZGVsYXlFbnRlcikge1xuICAgICAgICAgIGFjdGl2ZUJyYW5jaC50cmFuc2l0aW9uLmFmdGVyTGVhdmUgPSAoKSA9PiB7XG4gICAgICAgICAgICBpZiAocGVuZGluZ0lkID09PSBzdXNwZW5zZS5wZW5kaW5nSWQpIHtcbiAgICAgICAgICAgICAgbW92ZShcbiAgICAgICAgICAgICAgICBwZW5kaW5nQnJhbmNoLFxuICAgICAgICAgICAgICAgIGNvbnRhaW5lcjIsXG4gICAgICAgICAgICAgICAgYW5jaG9yID09PSBpbml0aWFsQW5jaG9yID8gbmV4dChhY3RpdmVCcmFuY2gpIDogYW5jaG9yLFxuICAgICAgICAgICAgICAgIDBcbiAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgcXVldWVQb3N0Rmx1c2hDYihlZmZlY3RzKTtcbiAgICAgICAgICAgICAgaWYgKGlzSW5GYWxsYmFjayAmJiB2bm9kZTIuc3NGYWxsYmFjaykge1xuICAgICAgICAgICAgICAgIHZub2RlMi5zc0ZhbGxiYWNrLmVsID0gbnVsbDtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGFjdGl2ZUJyYW5jaCkge1xuICAgICAgICAgIGlmIChwYXJlbnROb2RlKGFjdGl2ZUJyYW5jaC5lbCkgPT09IGNvbnRhaW5lcjIpIHtcbiAgICAgICAgICAgIGFuY2hvciA9IG5leHQoYWN0aXZlQnJhbmNoKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgdW5tb3VudChhY3RpdmVCcmFuY2gsIHBhcmVudENvbXBvbmVudDIsIHN1c3BlbnNlLCB0cnVlKTtcbiAgICAgICAgICBpZiAoIWRlbGF5RW50ZXIgJiYgaXNJbkZhbGxiYWNrICYmIHZub2RlMi5zc0ZhbGxiYWNrKSB7XG4gICAgICAgICAgICBxdWV1ZVBvc3RSZW5kZXJFZmZlY3QoKCkgPT4gdm5vZGUyLnNzRmFsbGJhY2suZWwgPSBudWxsLCBzdXNwZW5zZSk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmICghZGVsYXlFbnRlcikge1xuICAgICAgICAgIG1vdmUocGVuZGluZ0JyYW5jaCwgY29udGFpbmVyMiwgYW5jaG9yLCAwKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgc2V0QWN0aXZlQnJhbmNoKHN1c3BlbnNlLCBwZW5kaW5nQnJhbmNoKTtcbiAgICAgIHN1c3BlbnNlLnBlbmRpbmdCcmFuY2ggPSBudWxsO1xuICAgICAgc3VzcGVuc2UuaXNJbkZhbGxiYWNrID0gZmFsc2U7XG4gICAgICBsZXQgcGFyZW50ID0gc3VzcGVuc2UucGFyZW50O1xuICAgICAgbGV0IGhhc1VucmVzb2x2ZWRBbmNlc3RvciA9IGZhbHNlO1xuICAgICAgd2hpbGUgKHBhcmVudCkge1xuICAgICAgICBpZiAocGFyZW50LnBlbmRpbmdCcmFuY2gpIHtcbiAgICAgICAgICBwYXJlbnQuZWZmZWN0cy5wdXNoKC4uLmVmZmVjdHMpO1xuICAgICAgICAgIGhhc1VucmVzb2x2ZWRBbmNlc3RvciA9IHRydWU7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgcGFyZW50ID0gcGFyZW50LnBhcmVudDtcbiAgICAgIH1cbiAgICAgIGlmICghaGFzVW5yZXNvbHZlZEFuY2VzdG9yICYmICFkZWxheUVudGVyKSB7XG4gICAgICAgIHF1ZXVlUG9zdEZsdXNoQ2IoZWZmZWN0cyk7XG4gICAgICB9XG4gICAgICBzdXNwZW5zZS5lZmZlY3RzID0gW107XG4gICAgICBpZiAoaXNTdXNwZW5zaWJsZSkge1xuICAgICAgICBpZiAocGFyZW50U3VzcGVuc2UgJiYgcGFyZW50U3VzcGVuc2UucGVuZGluZ0JyYW5jaCAmJiBwYXJlbnRTdXNwZW5zZUlkID09PSBwYXJlbnRTdXNwZW5zZS5wZW5kaW5nSWQpIHtcbiAgICAgICAgICBwYXJlbnRTdXNwZW5zZS5kZXBzLS07XG4gICAgICAgICAgaWYgKHBhcmVudFN1c3BlbnNlLmRlcHMgPT09IDAgJiYgIXN5bmMpIHtcbiAgICAgICAgICAgIHBhcmVudFN1c3BlbnNlLnJlc29sdmUoKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHRyaWdnZXJFdmVudCh2bm9kZTIsIFwib25SZXNvbHZlXCIpO1xuICAgIH0sXG4gICAgZmFsbGJhY2soZmFsbGJhY2tWTm9kZSkge1xuICAgICAgaWYgKCFzdXNwZW5zZS5wZW5kaW5nQnJhbmNoKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIGNvbnN0IHsgdm5vZGU6IHZub2RlMiwgYWN0aXZlQnJhbmNoLCBwYXJlbnRDb21wb25lbnQ6IHBhcmVudENvbXBvbmVudDIsIGNvbnRhaW5lcjogY29udGFpbmVyMiwgbmFtZXNwYWNlOiBuYW1lc3BhY2UyIH0gPSBzdXNwZW5zZTtcbiAgICAgIHRyaWdnZXJFdmVudCh2bm9kZTIsIFwib25GYWxsYmFja1wiKTtcbiAgICAgIGNvbnN0IGFuY2hvcjIgPSBuZXh0KGFjdGl2ZUJyYW5jaCk7XG4gICAgICBjb25zdCBtb3VudEZhbGxiYWNrID0gKCkgPT4ge1xuICAgICAgICBpZiAoIXN1c3BlbnNlLmlzSW5GYWxsYmFjaykge1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBwYXRjaChcbiAgICAgICAgICBudWxsLFxuICAgICAgICAgIGZhbGxiYWNrVk5vZGUsXG4gICAgICAgICAgY29udGFpbmVyMixcbiAgICAgICAgICBhbmNob3IyLFxuICAgICAgICAgIHBhcmVudENvbXBvbmVudDIsXG4gICAgICAgICAgbnVsbCxcbiAgICAgICAgICAvLyBmYWxsYmFjayB0cmVlIHdpbGwgbm90IGhhdmUgc3VzcGVuc2UgY29udGV4dFxuICAgICAgICAgIG5hbWVzcGFjZTIsXG4gICAgICAgICAgc2xvdFNjb3BlSWRzLFxuICAgICAgICAgIG9wdGltaXplZFxuICAgICAgICApO1xuICAgICAgICBzZXRBY3RpdmVCcmFuY2goc3VzcGVuc2UsIGZhbGxiYWNrVk5vZGUpO1xuICAgICAgfTtcbiAgICAgIGNvbnN0IGRlbGF5RW50ZXIgPSBmYWxsYmFja1ZOb2RlLnRyYW5zaXRpb24gJiYgZmFsbGJhY2tWTm9kZS50cmFuc2l0aW9uLm1vZGUgPT09IFwib3V0LWluXCI7XG4gICAgICBpZiAoZGVsYXlFbnRlcikge1xuICAgICAgICBhY3RpdmVCcmFuY2gudHJhbnNpdGlvbi5hZnRlckxlYXZlID0gbW91bnRGYWxsYmFjaztcbiAgICAgIH1cbiAgICAgIHN1c3BlbnNlLmlzSW5GYWxsYmFjayA9IHRydWU7XG4gICAgICB1bm1vdW50KFxuICAgICAgICBhY3RpdmVCcmFuY2gsXG4gICAgICAgIHBhcmVudENvbXBvbmVudDIsXG4gICAgICAgIG51bGwsXG4gICAgICAgIC8vIG5vIHN1c3BlbnNlIHNvIHVubW91bnQgaG9va3MgZmlyZSBub3dcbiAgICAgICAgdHJ1ZVxuICAgICAgICAvLyBzaG91bGRSZW1vdmVcbiAgICAgICk7XG4gICAgICBpZiAoIWRlbGF5RW50ZXIpIHtcbiAgICAgICAgbW91bnRGYWxsYmFjaygpO1xuICAgICAgfVxuICAgIH0sXG4gICAgbW92ZShjb250YWluZXIyLCBhbmNob3IyLCB0eXBlKSB7XG4gICAgICBzdXNwZW5zZS5hY3RpdmVCcmFuY2ggJiYgbW92ZShzdXNwZW5zZS5hY3RpdmVCcmFuY2gsIGNvbnRhaW5lcjIsIGFuY2hvcjIsIHR5cGUpO1xuICAgICAgc3VzcGVuc2UuY29udGFpbmVyID0gY29udGFpbmVyMjtcbiAgICB9LFxuICAgIG5leHQoKSB7XG4gICAgICByZXR1cm4gc3VzcGVuc2UuYWN0aXZlQnJhbmNoICYmIG5leHQoc3VzcGVuc2UuYWN0aXZlQnJhbmNoKTtcbiAgICB9LFxuICAgIHJlZ2lzdGVyRGVwKGluc3RhbmNlLCBzZXR1cFJlbmRlckVmZmVjdCwgb3B0aW1pemVkMikge1xuICAgICAgY29uc3QgaXNJblBlbmRpbmdTdXNwZW5zZSA9ICEhc3VzcGVuc2UucGVuZGluZ0JyYW5jaDtcbiAgICAgIGlmIChpc0luUGVuZGluZ1N1c3BlbnNlKSB7XG4gICAgICAgIHN1c3BlbnNlLmRlcHMrKztcbiAgICAgIH1cbiAgICAgIGNvbnN0IGh5ZHJhdGVkRWwgPSBpbnN0YW5jZS52bm9kZS5lbDtcbiAgICAgIGluc3RhbmNlLmFzeW5jRGVwLmNhdGNoKChlcnIpID0+IHtcbiAgICAgICAgaGFuZGxlRXJyb3IoZXJyLCBpbnN0YW5jZSwgMCk7XG4gICAgICB9KS50aGVuKChhc3luY1NldHVwUmVzdWx0KSA9PiB7XG4gICAgICAgIGlmIChpbnN0YW5jZS5pc1VubW91bnRlZCB8fCBzdXNwZW5zZS5pc1VubW91bnRlZCB8fCBzdXNwZW5zZS5wZW5kaW5nSWQgIT09IGluc3RhbmNlLnN1c3BlbnNlSWQpIHtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgaW5zdGFuY2UuYXN5bmNSZXNvbHZlZCA9IHRydWU7XG4gICAgICAgIGNvbnN0IHsgdm5vZGU6IHZub2RlMiB9ID0gaW5zdGFuY2U7XG4gICAgICAgIGlmICghIShwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gXCJwcm9kdWN0aW9uXCIpKSB7XG4gICAgICAgICAgcHVzaFdhcm5pbmdDb250ZXh0KHZub2RlMik7XG4gICAgICAgIH1cbiAgICAgICAgaGFuZGxlU2V0dXBSZXN1bHQoaW5zdGFuY2UsIGFzeW5jU2V0dXBSZXN1bHQsIGZhbHNlKTtcbiAgICAgICAgaWYgKGh5ZHJhdGVkRWwpIHtcbiAgICAgICAgICB2bm9kZTIuZWwgPSBoeWRyYXRlZEVsO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHBsYWNlaG9sZGVyID0gIWh5ZHJhdGVkRWwgJiYgaW5zdGFuY2Uuc3ViVHJlZS5lbDtcbiAgICAgICAgc2V0dXBSZW5kZXJFZmZlY3QoXG4gICAgICAgICAgaW5zdGFuY2UsXG4gICAgICAgICAgdm5vZGUyLFxuICAgICAgICAgIC8vIGNvbXBvbmVudCBtYXkgaGF2ZSBiZWVuIG1vdmVkIGJlZm9yZSByZXNvbHZlLlxuICAgICAgICAgIC8vIGlmIHRoaXMgaXMgbm90IGEgaHlkcmF0aW9uLCBpbnN0YW5jZS5zdWJUcmVlIHdpbGwgYmUgdGhlIGNvbW1lbnRcbiAgICAgICAgICAvLyBwbGFjZWhvbGRlci5cbiAgICAgICAgICBwYXJlbnROb2RlKGh5ZHJhdGVkRWwgfHwgaW5zdGFuY2Uuc3ViVHJlZS5lbCksXG4gICAgICAgICAgLy8gYW5jaG9yIHdpbGwgbm90IGJlIHVzZWQgaWYgdGhpcyBpcyBoeWRyYXRpb24sIHNvIG9ubHkgbmVlZCB0b1xuICAgICAgICAgIC8vIGNvbnNpZGVyIHRoZSBjb21tZW50IHBsYWNlaG9sZGVyIGNhc2UuXG4gICAgICAgICAgaHlkcmF0ZWRFbCA/IG51bGwgOiBuZXh0KGluc3RhbmNlLnN1YlRyZWUpLFxuICAgICAgICAgIHN1c3BlbnNlLFxuICAgICAgICAgIG5hbWVzcGFjZSxcbiAgICAgICAgICBvcHRpbWl6ZWQyXG4gICAgICAgICk7XG4gICAgICAgIGlmIChwbGFjZWhvbGRlcikge1xuICAgICAgICAgIHZub2RlMi5wbGFjZWhvbGRlciA9IG51bGw7XG4gICAgICAgICAgcmVtb3ZlKHBsYWNlaG9sZGVyKTtcbiAgICAgICAgfVxuICAgICAgICB1cGRhdGVIT0NIb3N0RWwoaW5zdGFuY2UsIHZub2RlMi5lbCk7XG4gICAgICAgIGlmICghIShwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gXCJwcm9kdWN0aW9uXCIpKSB7XG4gICAgICAgICAgcG9wV2FybmluZ0NvbnRleHQoKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoaXNJblBlbmRpbmdTdXNwZW5zZSAmJiAtLXN1c3BlbnNlLmRlcHMgPT09IDApIHtcbiAgICAgICAgICBzdXNwZW5zZS5yZXNvbHZlKCk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH0sXG4gICAgdW5tb3VudChwYXJlbnRTdXNwZW5zZTIsIGRvUmVtb3ZlKSB7XG4gICAgICBzdXNwZW5zZS5pc1VubW91bnRlZCA9IHRydWU7XG4gICAgICBpZiAoc3VzcGVuc2UuYWN0aXZlQnJhbmNoKSB7XG4gICAgICAgIHVubW91bnQoXG4gICAgICAgICAgc3VzcGVuc2UuYWN0aXZlQnJhbmNoLFxuICAgICAgICAgIHBhcmVudENvbXBvbmVudCxcbiAgICAgICAgICBwYXJlbnRTdXNwZW5zZTIsXG4gICAgICAgICAgZG9SZW1vdmVcbiAgICAgICAgKTtcbiAgICAgIH1cbiAgICAgIGlmIChzdXNwZW5zZS5wZW5kaW5nQnJhbmNoKSB7XG4gICAgICAgIHVubW91bnQoXG4gICAgICAgICAgc3VzcGVuc2UucGVuZGluZ0JyYW5jaCxcbiAgICAgICAgICBwYXJlbnRDb21wb25lbnQsXG4gICAgICAgICAgcGFyZW50U3VzcGVuc2UyLFxuICAgICAgICAgIGRvUmVtb3ZlXG4gICAgICAgICk7XG4gICAgICB9XG4gICAgfVxuICB9O1xuICByZXR1cm4gc3VzcGVuc2U7XG59XG5mdW5jdGlvbiBoeWRyYXRlU3VzcGVuc2Uobm9kZSwgdm5vZGUsIHBhcmVudENvbXBvbmVudCwgcGFyZW50U3VzcGVuc2UsIG5hbWVzcGFjZSwgc2xvdFNjb3BlSWRzLCBvcHRpbWl6ZWQsIHJlbmRlcmVySW50ZXJuYWxzLCBoeWRyYXRlTm9kZSkge1xuICBjb25zdCBzdXNwZW5zZSA9IHZub2RlLnN1c3BlbnNlID0gY3JlYXRlU3VzcGVuc2VCb3VuZGFyeShcbiAgICB2bm9kZSxcbiAgICBwYXJlbnRTdXNwZW5zZSxcbiAgICBwYXJlbnRDb21wb25lbnQsXG4gICAgbm9kZS5wYXJlbnROb2RlLFxuICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby1yZXN0cmljdGVkLWdsb2JhbHNcbiAgICBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpLFxuICAgIG51bGwsXG4gICAgbmFtZXNwYWNlLFxuICAgIHNsb3RTY29wZUlkcyxcbiAgICBvcHRpbWl6ZWQsXG4gICAgcmVuZGVyZXJJbnRlcm5hbHMsXG4gICAgdHJ1ZVxuICApO1xuICBjb25zdCByZXN1bHQgPSBoeWRyYXRlTm9kZShcbiAgICBub2RlLFxuICAgIHN1c3BlbnNlLnBlbmRpbmdCcmFuY2ggPSB2bm9kZS5zc0NvbnRlbnQsXG4gICAgcGFyZW50Q29tcG9uZW50LFxuICAgIHN1c3BlbnNlLFxuICAgIHNsb3RTY29wZUlkcyxcbiAgICBvcHRpbWl6ZWRcbiAgKTtcbiAgaWYgKHN1c3BlbnNlLmRlcHMgPT09IDApIHtcbiAgICBzdXNwZW5zZS5yZXNvbHZlKGZhbHNlLCB0cnVlKTtcbiAgfVxuICByZXR1cm4gcmVzdWx0O1xufVxuZnVuY3Rpb24gbm9ybWFsaXplU3VzcGVuc2VDaGlsZHJlbih2bm9kZSkge1xuICBjb25zdCB7IHNoYXBlRmxhZywgY2hpbGRyZW4gfSA9IHZub2RlO1xuICBjb25zdCBpc1Nsb3RDaGlsZHJlbiA9IHNoYXBlRmxhZyAmIDMyO1xuICB2bm9kZS5zc0NvbnRlbnQgPSBub3JtYWxpemVTdXNwZW5zZVNsb3QoXG4gICAgaXNTbG90Q2hpbGRyZW4gPyBjaGlsZHJlbi5kZWZhdWx0IDogY2hpbGRyZW5cbiAgKTtcbiAgdm5vZGUuc3NGYWxsYmFjayA9IGlzU2xvdENoaWxkcmVuID8gbm9ybWFsaXplU3VzcGVuc2VTbG90KGNoaWxkcmVuLmZhbGxiYWNrKSA6IGNyZWF0ZVZOb2RlKENvbW1lbnQpO1xufVxuZnVuY3Rpb24gbm9ybWFsaXplU3VzcGVuc2VTbG90KHMpIHtcbiAgbGV0IGJsb2NrO1xuICBpZiAoaXNGdW5jdGlvbihzKSkge1xuICAgIGNvbnN0IHRyYWNrQmxvY2sgPSBpc0Jsb2NrVHJlZUVuYWJsZWQgJiYgcy5fYztcbiAgICBpZiAodHJhY2tCbG9jaykge1xuICAgICAgcy5fZCA9IGZhbHNlO1xuICAgICAgb3BlbkJsb2NrKCk7XG4gICAgfVxuICAgIHMgPSBzKCk7XG4gICAgaWYgKHRyYWNrQmxvY2spIHtcbiAgICAgIHMuX2QgPSB0cnVlO1xuICAgICAgYmxvY2sgPSBjdXJyZW50QmxvY2s7XG4gICAgICBjbG9zZUJsb2NrKCk7XG4gICAgfVxuICB9XG4gIGlmIChpc0FycmF5KHMpKSB7XG4gICAgY29uc3Qgc2luZ2xlQ2hpbGQgPSBmaWx0ZXJTaW5nbGVSb290KHMpO1xuICAgIGlmICghIShwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gXCJwcm9kdWN0aW9uXCIpICYmICFzaW5nbGVDaGlsZCAmJiBzLmZpbHRlcigoY2hpbGQpID0+IGNoaWxkICE9PSBOVUxMX0RZTkFNSUNfQ09NUE9ORU5UKS5sZW5ndGggPiAwKSB7XG4gICAgICB3YXJuJDEoYDxTdXNwZW5zZT4gc2xvdHMgZXhwZWN0IGEgc2luZ2xlIHJvb3Qgbm9kZS5gKTtcbiAgICB9XG4gICAgcyA9IHNpbmdsZUNoaWxkO1xuICB9XG4gIHMgPSBub3JtYWxpemVWTm9kZShzKTtcbiAgaWYgKGJsb2NrICYmICFzLmR5bmFtaWNDaGlsZHJlbikge1xuICAgIHMuZHluYW1pY0NoaWxkcmVuID0gYmxvY2suZmlsdGVyKChjKSA9PiBjICE9PSBzKTtcbiAgfVxuICByZXR1cm4gcztcbn1cbmZ1bmN0aW9uIHF1ZXVlRWZmZWN0V2l0aFN1c3BlbnNlKGZuLCBzdXNwZW5zZSkge1xuICBpZiAoc3VzcGVuc2UgJiYgc3VzcGVuc2UucGVuZGluZ0JyYW5jaCkge1xuICAgIGlmIChpc0FycmF5KGZuKSkge1xuICAgICAgc3VzcGVuc2UuZWZmZWN0cy5wdXNoKC4uLmZuKTtcbiAgICB9IGVsc2Uge1xuICAgICAgc3VzcGVuc2UuZWZmZWN0cy5wdXNoKGZuKTtcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgcXVldWVQb3N0Rmx1c2hDYihmbik7XG4gIH1cbn1cbmZ1bmN0aW9uIHNldEFjdGl2ZUJyYW5jaChzdXNwZW5zZSwgYnJhbmNoKSB7XG4gIHN1c3BlbnNlLmFjdGl2ZUJyYW5jaCA9IGJyYW5jaDtcbiAgY29uc3QgeyB2bm9kZSwgcGFyZW50Q29tcG9uZW50IH0gPSBzdXNwZW5zZTtcbiAgbGV0IGVsID0gYnJhbmNoLmVsO1xuICB3aGlsZSAoIWVsICYmIGJyYW5jaC5jb21wb25lbnQpIHtcbiAgICBicmFuY2ggPSBicmFuY2guY29tcG9uZW50LnN1YlRyZWU7XG4gICAgZWwgPSBicmFuY2guZWw7XG4gIH1cbiAgdm5vZGUuZWwgPSBlbDtcbiAgaWYgKHBhcmVudENvbXBvbmVudCAmJiBwYXJlbnRDb21wb25lbnQuc3ViVHJlZSA9PT0gdm5vZGUpIHtcbiAgICBwYXJlbnRDb21wb25lbnQudm5vZGUuZWwgPSBlbDtcbiAgICB1cGRhdGVIT0NIb3N0RWwocGFyZW50Q29tcG9uZW50LCBlbCk7XG4gIH1cbn1cbmZ1bmN0aW9uIGlzVk5vZGVTdXNwZW5zaWJsZSh2bm9kZSkge1xuICBjb25zdCBzdXNwZW5zaWJsZSA9IHZub2RlLnByb3BzICYmIHZub2RlLnByb3BzLnN1c3BlbnNpYmxlO1xuICByZXR1cm4gc3VzcGVuc2libGUgIT0gbnVsbCAmJiBzdXNwZW5zaWJsZSAhPT0gZmFsc2U7XG59XG5cbmNvbnN0IEZyYWdtZW50ID0gLyogQF9fUFVSRV9fICovIFN5bWJvbC5mb3IoXCJ2LWZndFwiKTtcbmNvbnN0IFRleHQgPSAvKiBAX19QVVJFX18gKi8gU3ltYm9sLmZvcihcInYtdHh0XCIpO1xuY29uc3QgQ29tbWVudCA9IC8qIEBfX1BVUkVfXyAqLyBTeW1ib2wuZm9yKFwidi1jbXRcIik7XG5jb25zdCBTdGF0aWMgPSAvKiBAX19QVVJFX18gKi8gU3ltYm9sLmZvcihcInYtc3RjXCIpO1xuY29uc3QgYmxvY2tTdGFjayA9IFtdO1xubGV0IGN1cnJlbnRCbG9jayA9IG51bGw7XG5mdW5jdGlvbiBvcGVuQmxvY2soZGlzYWJsZVRyYWNraW5nID0gZmFsc2UpIHtcbiAgYmxvY2tTdGFjay5wdXNoKGN1cnJlbnRCbG9jayA9IGRpc2FibGVUcmFja2luZyA/IG51bGwgOiBbXSk7XG59XG5mdW5jdGlvbiBjbG9zZUJsb2NrKCkge1xuICBibG9ja1N0YWNrLnBvcCgpO1xuICBjdXJyZW50QmxvY2sgPSBibG9ja1N0YWNrW2Jsb2NrU3RhY2subGVuZ3RoIC0gMV0gfHwgbnVsbDtcbn1cbmxldCBpc0Jsb2NrVHJlZUVuYWJsZWQgPSAxO1xuZnVuY3Rpb24gc2V0QmxvY2tUcmFja2luZyh2YWx1ZSwgaW5WT25jZSA9IGZhbHNlKSB7XG4gIGlzQmxvY2tUcmVlRW5hYmxlZCArPSB2YWx1ZTtcbiAgaWYgKHZhbHVlIDwgMCAmJiBjdXJyZW50QmxvY2sgJiYgaW5WT25jZSkge1xuICAgIGN1cnJlbnRCbG9jay5oYXNPbmNlID0gdHJ1ZTtcbiAgfVxufVxuZnVuY3Rpb24gc2V0dXBCbG9jayh2bm9kZSkge1xuICB2bm9kZS5keW5hbWljQ2hpbGRyZW4gPSBpc0Jsb2NrVHJlZUVuYWJsZWQgPiAwID8gY3VycmVudEJsb2NrIHx8IEVNUFRZX0FSUiA6IG51bGw7XG4gIGNsb3NlQmxvY2soKTtcbiAgaWYgKGlzQmxvY2tUcmVlRW5hYmxlZCA+IDAgJiYgY3VycmVudEJsb2NrKSB7XG4gICAgY3VycmVudEJsb2NrLnB1c2godm5vZGUpO1xuICB9XG4gIHJldHVybiB2bm9kZTtcbn1cbmZ1bmN0aW9uIGNyZWF0ZUVsZW1lbnRCbG9jayh0eXBlLCBwcm9wcywgY2hpbGRyZW4sIHBhdGNoRmxhZywgZHluYW1pY1Byb3BzLCBzaGFwZUZsYWcpIHtcbiAgcmV0dXJuIHNldHVwQmxvY2soXG4gICAgY3JlYXRlQmFzZVZOb2RlKFxuICAgICAgdHlwZSxcbiAgICAgIHByb3BzLFxuICAgICAgY2hpbGRyZW4sXG4gICAgICBwYXRjaEZsYWcsXG4gICAgICBkeW5hbWljUHJvcHMsXG4gICAgICBzaGFwZUZsYWcsXG4gICAgICB0cnVlXG4gICAgKVxuICApO1xufVxuZnVuY3Rpb24gY3JlYXRlQmxvY2sodHlwZSwgcHJvcHMsIGNoaWxkcmVuLCBwYXRjaEZsYWcsIGR5bmFtaWNQcm9wcykge1xuICByZXR1cm4gc2V0dXBCbG9jayhcbiAgICBjcmVhdGVWTm9kZShcbiAgICAgIHR5cGUsXG4gICAgICBwcm9wcyxcbiAgICAgIGNoaWxkcmVuLFxuICAgICAgcGF0Y2hGbGFnLFxuICAgICAgZHluYW1pY1Byb3BzLFxuICAgICAgdHJ1ZVxuICAgIClcbiAgKTtcbn1cbmZ1bmN0aW9uIGlzVk5vZGUodmFsdWUpIHtcbiAgcmV0dXJuIHZhbHVlID8gdmFsdWUuX192X2lzVk5vZGUgPT09IHRydWUgOiBmYWxzZTtcbn1cbmZ1bmN0aW9uIGlzU2FtZVZOb2RlVHlwZShuMSwgbjIpIHtcbiAgaWYgKCEhKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSBcInByb2R1Y3Rpb25cIikgJiYgbjIuc2hhcGVGbGFnICYgNiAmJiBuMS5jb21wb25lbnQpIHtcbiAgICBjb25zdCBkaXJ0eUluc3RhbmNlcyA9IGhtckRpcnR5Q29tcG9uZW50cy5nZXQobjIudHlwZSk7XG4gICAgaWYgKGRpcnR5SW5zdGFuY2VzICYmIGRpcnR5SW5zdGFuY2VzLmhhcyhuMS5jb21wb25lbnQpKSB7XG4gICAgICBuMS5zaGFwZUZsYWcgJj0gLTI1NztcbiAgICAgIG4yLnNoYXBlRmxhZyAmPSAtNTEzO1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgfVxuICByZXR1cm4gbjEudHlwZSA9PT0gbjIudHlwZSAmJiBuMS5rZXkgPT09IG4yLmtleTtcbn1cbmxldCB2bm9kZUFyZ3NUcmFuc2Zvcm1lcjtcbmZ1bmN0aW9uIHRyYW5zZm9ybVZOb2RlQXJncyh0cmFuc2Zvcm1lcikge1xuICB2bm9kZUFyZ3NUcmFuc2Zvcm1lciA9IHRyYW5zZm9ybWVyO1xufVxuY29uc3QgY3JlYXRlVk5vZGVXaXRoQXJnc1RyYW5zZm9ybSA9ICguLi5hcmdzKSA9PiB7XG4gIHJldHVybiBfY3JlYXRlVk5vZGUoXG4gICAgLi4udm5vZGVBcmdzVHJhbnNmb3JtZXIgPyB2bm9kZUFyZ3NUcmFuc2Zvcm1lcihhcmdzLCBjdXJyZW50UmVuZGVyaW5nSW5zdGFuY2UpIDogYXJnc1xuICApO1xufTtcbmNvbnN0IG5vcm1hbGl6ZUtleSA9ICh7IGtleSB9KSA9PiBrZXkgIT0gbnVsbCA/IGtleSA6IG51bGw7XG5jb25zdCBub3JtYWxpemVSZWYgPSAoe1xuICByZWYsXG4gIHJlZl9rZXksXG4gIHJlZl9mb3Jcbn0pID0+IHtcbiAgaWYgKHR5cGVvZiByZWYgPT09IFwibnVtYmVyXCIpIHtcbiAgICByZWYgPSBcIlwiICsgcmVmO1xuICB9XG4gIHJldHVybiByZWYgIT0gbnVsbCA/IGlzU3RyaW5nKHJlZikgfHwgaXNSZWYocmVmKSB8fCBpc0Z1bmN0aW9uKHJlZikgPyB7IGk6IGN1cnJlbnRSZW5kZXJpbmdJbnN0YW5jZSwgcjogcmVmLCBrOiByZWZfa2V5LCBmOiAhIXJlZl9mb3IgfSA6IHJlZiA6IG51bGw7XG59O1xuZnVuY3Rpb24gY3JlYXRlQmFzZVZOb2RlKHR5cGUsIHByb3BzID0gbnVsbCwgY2hpbGRyZW4gPSBudWxsLCBwYXRjaEZsYWcgPSAwLCBkeW5hbWljUHJvcHMgPSBudWxsLCBzaGFwZUZsYWcgPSB0eXBlID09PSBGcmFnbWVudCA/IDAgOiAxLCBpc0Jsb2NrTm9kZSA9IGZhbHNlLCBuZWVkRnVsbENoaWxkcmVuTm9ybWFsaXphdGlvbiA9IGZhbHNlKSB7XG4gIGNvbnN0IHZub2RlID0ge1xuICAgIF9fdl9pc1ZOb2RlOiB0cnVlLFxuICAgIF9fdl9za2lwOiB0cnVlLFxuICAgIHR5cGUsXG4gICAgcHJvcHMsXG4gICAga2V5OiBwcm9wcyAmJiBub3JtYWxpemVLZXkocHJvcHMpLFxuICAgIHJlZjogcHJvcHMgJiYgbm9ybWFsaXplUmVmKHByb3BzKSxcbiAgICBzY29wZUlkOiBjdXJyZW50U2NvcGVJZCxcbiAgICBzbG90U2NvcGVJZHM6IG51bGwsXG4gICAgY2hpbGRyZW4sXG4gICAgY29tcG9uZW50OiBudWxsLFxuICAgIHN1c3BlbnNlOiBudWxsLFxuICAgIHNzQ29udGVudDogbnVsbCxcbiAgICBzc0ZhbGxiYWNrOiBudWxsLFxuICAgIGRpcnM6IG51bGwsXG4gICAgdHJhbnNpdGlvbjogbnVsbCxcbiAgICBlbDogbnVsbCxcbiAgICBhbmNob3I6IG51bGwsXG4gICAgdGFyZ2V0OiBudWxsLFxuICAgIHRhcmdldFN0YXJ0OiBudWxsLFxuICAgIHRhcmdldEFuY2hvcjogbnVsbCxcbiAgICBzdGF0aWNDb3VudDogMCxcbiAgICBzaGFwZUZsYWcsXG4gICAgcGF0Y2hGbGFnLFxuICAgIGR5bmFtaWNQcm9wcyxcbiAgICBkeW5hbWljQ2hpbGRyZW46IG51bGwsXG4gICAgYXBwQ29udGV4dDogbnVsbCxcbiAgICBjdHg6IGN1cnJlbnRSZW5kZXJpbmdJbnN0YW5jZVxuICB9O1xuICBpZiAobmVlZEZ1bGxDaGlsZHJlbk5vcm1hbGl6YXRpb24pIHtcbiAgICBub3JtYWxpemVDaGlsZHJlbih2bm9kZSwgY2hpbGRyZW4pO1xuICAgIGlmIChzaGFwZUZsYWcgJiAxMjgpIHtcbiAgICAgIHR5cGUubm9ybWFsaXplKHZub2RlKTtcbiAgICB9XG4gIH0gZWxzZSBpZiAoY2hpbGRyZW4pIHtcbiAgICB2bm9kZS5zaGFwZUZsYWcgfD0gaXNTdHJpbmcoY2hpbGRyZW4pID8gOCA6IDE2O1xuICB9XG4gIGlmICghIShwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gXCJwcm9kdWN0aW9uXCIpICYmIHZub2RlLmtleSAhPT0gdm5vZGUua2V5KSB7XG4gICAgd2FybiQxKGBWTm9kZSBjcmVhdGVkIHdpdGggaW52YWxpZCBrZXkgKE5hTikuIFZOb2RlIHR5cGU6YCwgdm5vZGUudHlwZSk7XG4gIH1cbiAgaWYgKGlzQmxvY2tUcmVlRW5hYmxlZCA+IDAgJiYgLy8gYXZvaWQgYSBibG9jayBub2RlIGZyb20gdHJhY2tpbmcgaXRzZWxmXG4gICFpc0Jsb2NrTm9kZSAmJiAvLyBoYXMgY3VycmVudCBwYXJlbnQgYmxvY2tcbiAgY3VycmVudEJsb2NrICYmIC8vIHByZXNlbmNlIG9mIGEgcGF0Y2ggZmxhZyBpbmRpY2F0ZXMgdGhpcyBub2RlIG5lZWRzIHBhdGNoaW5nIG9uIHVwZGF0ZXMuXG4gIC8vIGNvbXBvbmVudCBub2RlcyBhbHNvIHNob3VsZCBhbHdheXMgYmUgcGF0Y2hlZCwgYmVjYXVzZSBldmVuIGlmIHRoZVxuICAvLyBjb21wb25lbnQgZG9lc24ndCBuZWVkIHRvIHVwZGF0ZSwgaXQgbmVlZHMgdG8gcGVyc2lzdCB0aGUgaW5zdGFuY2Ugb24gdG9cbiAgLy8gdGhlIG5leHQgdm5vZGUgc28gdGhhdCBpdCBjYW4gYmUgcHJvcGVybHkgdW5tb3VudGVkIGxhdGVyLlxuICAodm5vZGUucGF0Y2hGbGFnID4gMCB8fCBzaGFwZUZsYWcgJiA2KSAmJiAvLyB0aGUgRVZFTlRTIGZsYWcgaXMgb25seSBmb3IgaHlkcmF0aW9uIGFuZCBpZiBpdCBpcyB0aGUgb25seSBmbGFnLCB0aGVcbiAgLy8gdm5vZGUgc2hvdWxkIG5vdCBiZSBjb25zaWRlcmVkIGR5bmFtaWMgZHVlIHRvIGhhbmRsZXIgY2FjaGluZy5cbiAgdm5vZGUucGF0Y2hGbGFnICE9PSAzMikge1xuICAgIGN1cnJlbnRCbG9jay5wdXNoKHZub2RlKTtcbiAgfVxuICByZXR1cm4gdm5vZGU7XG59XG5jb25zdCBjcmVhdGVWTm9kZSA9ICEhKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSBcInByb2R1Y3Rpb25cIikgPyBjcmVhdGVWTm9kZVdpdGhBcmdzVHJhbnNmb3JtIDogX2NyZWF0ZVZOb2RlO1xuZnVuY3Rpb24gX2NyZWF0ZVZOb2RlKHR5cGUsIHByb3BzID0gbnVsbCwgY2hpbGRyZW4gPSBudWxsLCBwYXRjaEZsYWcgPSAwLCBkeW5hbWljUHJvcHMgPSBudWxsLCBpc0Jsb2NrTm9kZSA9IGZhbHNlKSB7XG4gIGlmICghdHlwZSB8fCB0eXBlID09PSBOVUxMX0RZTkFNSUNfQ09NUE9ORU5UKSB7XG4gICAgaWYgKCEhKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSBcInByb2R1Y3Rpb25cIikgJiYgIXR5cGUpIHtcbiAgICAgIHdhcm4kMShgSW52YWxpZCB2bm9kZSB0eXBlIHdoZW4gY3JlYXRpbmcgdm5vZGU6ICR7dHlwZX0uYCk7XG4gICAgfVxuICAgIHR5cGUgPSBDb21tZW50O1xuICB9XG4gIGlmIChpc1ZOb2RlKHR5cGUpKSB7XG4gICAgY29uc3QgY2xvbmVkID0gY2xvbmVWTm9kZShcbiAgICAgIHR5cGUsXG4gICAgICBwcm9wcyxcbiAgICAgIHRydWVcbiAgICAgIC8qIG1lcmdlUmVmOiB0cnVlICovXG4gICAgKTtcbiAgICBpZiAoY2hpbGRyZW4pIHtcbiAgICAgIG5vcm1hbGl6ZUNoaWxkcmVuKGNsb25lZCwgY2hpbGRyZW4pO1xuICAgIH1cbiAgICBpZiAoaXNCbG9ja1RyZWVFbmFibGVkID4gMCAmJiAhaXNCbG9ja05vZGUgJiYgY3VycmVudEJsb2NrKSB7XG4gICAgICBpZiAoY2xvbmVkLnNoYXBlRmxhZyAmIDYpIHtcbiAgICAgICAgY3VycmVudEJsb2NrW2N1cnJlbnRCbG9jay5pbmRleE9mKHR5cGUpXSA9IGNsb25lZDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGN1cnJlbnRCbG9jay5wdXNoKGNsb25lZCk7XG4gICAgICB9XG4gICAgfVxuICAgIGNsb25lZC5wYXRjaEZsYWcgPSAtMjtcbiAgICByZXR1cm4gY2xvbmVkO1xuICB9XG4gIGlmIChpc0NsYXNzQ29tcG9uZW50KHR5cGUpKSB7XG4gICAgdHlwZSA9IHR5cGUuX192Y2NPcHRzO1xuICB9XG4gIGlmIChwcm9wcykge1xuICAgIHByb3BzID0gZ3VhcmRSZWFjdGl2ZVByb3BzKHByb3BzKTtcbiAgICBsZXQgeyBjbGFzczoga2xhc3MsIHN0eWxlIH0gPSBwcm9wcztcbiAgICBpZiAoa2xhc3MgJiYgIWlzU3RyaW5nKGtsYXNzKSkge1xuICAgICAgcHJvcHMuY2xhc3MgPSBub3JtYWxpemVDbGFzcyhrbGFzcyk7XG4gICAgfVxuICAgIGlmIChpc09iamVjdChzdHlsZSkpIHtcbiAgICAgIGlmIChpc1Byb3h5KHN0eWxlKSAmJiAhaXNBcnJheShzdHlsZSkpIHtcbiAgICAgICAgc3R5bGUgPSBleHRlbmQoe30sIHN0eWxlKTtcbiAgICAgIH1cbiAgICAgIHByb3BzLnN0eWxlID0gbm9ybWFsaXplU3R5bGUoc3R5bGUpO1xuICAgIH1cbiAgfVxuICBjb25zdCBzaGFwZUZsYWcgPSBpc1N0cmluZyh0eXBlKSA/IDEgOiBpc1N1c3BlbnNlKHR5cGUpID8gMTI4IDogaXNUZWxlcG9ydCh0eXBlKSA/IDY0IDogaXNPYmplY3QodHlwZSkgPyA0IDogaXNGdW5jdGlvbih0eXBlKSA/IDIgOiAwO1xuICBpZiAoISEocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09IFwicHJvZHVjdGlvblwiKSAmJiBzaGFwZUZsYWcgJiA0ICYmIGlzUHJveHkodHlwZSkpIHtcbiAgICB0eXBlID0gdG9SYXcodHlwZSk7XG4gICAgd2FybiQxKFxuICAgICAgYFZ1ZSByZWNlaXZlZCBhIENvbXBvbmVudCB0aGF0IHdhcyBtYWRlIGEgcmVhY3RpdmUgb2JqZWN0LiBUaGlzIGNhbiBsZWFkIHRvIHVubmVjZXNzYXJ5IHBlcmZvcm1hbmNlIG92ZXJoZWFkIGFuZCBzaG91bGQgYmUgYXZvaWRlZCBieSBtYXJraW5nIHRoZSBjb21wb25lbnQgd2l0aCBcXGBtYXJrUmF3XFxgIG9yIHVzaW5nIFxcYHNoYWxsb3dSZWZcXGAgaW5zdGVhZCBvZiBcXGByZWZcXGAuYCxcbiAgICAgIGBcbkNvbXBvbmVudCB0aGF0IHdhcyBtYWRlIHJlYWN0aXZlOiBgLFxuICAgICAgdHlwZVxuICAgICk7XG4gIH1cbiAgcmV0dXJuIGNyZWF0ZUJhc2VWTm9kZShcbiAgICB0eXBlLFxuICAgIHByb3BzLFxuICAgIGNoaWxkcmVuLFxuICAgIHBhdGNoRmxhZyxcbiAgICBkeW5hbWljUHJvcHMsXG4gICAgc2hhcGVGbGFnLFxuICAgIGlzQmxvY2tOb2RlLFxuICAgIHRydWVcbiAgKTtcbn1cbmZ1bmN0aW9uIGd1YXJkUmVhY3RpdmVQcm9wcyhwcm9wcykge1xuICBpZiAoIXByb3BzKSByZXR1cm4gbnVsbDtcbiAgcmV0dXJuIGlzUHJveHkocHJvcHMpIHx8IGlzSW50ZXJuYWxPYmplY3QocHJvcHMpID8gZXh0ZW5kKHt9LCBwcm9wcykgOiBwcm9wcztcbn1cbmZ1bmN0aW9uIGNsb25lVk5vZGUodm5vZGUsIGV4dHJhUHJvcHMsIG1lcmdlUmVmID0gZmFsc2UsIGNsb25lVHJhbnNpdGlvbiA9IGZhbHNlKSB7XG4gIGNvbnN0IHsgcHJvcHMsIHJlZiwgcGF0Y2hGbGFnLCBjaGlsZHJlbiwgdHJhbnNpdGlvbiB9ID0gdm5vZGU7XG4gIGNvbnN0IG1lcmdlZFByb3BzID0gZXh0cmFQcm9wcyA/IG1lcmdlUHJvcHMocHJvcHMgfHwge30sIGV4dHJhUHJvcHMpIDogcHJvcHM7XG4gIGNvbnN0IGNsb25lZCA9IHtcbiAgICBfX3ZfaXNWTm9kZTogdHJ1ZSxcbiAgICBfX3Zfc2tpcDogdHJ1ZSxcbiAgICB0eXBlOiB2bm9kZS50eXBlLFxuICAgIHByb3BzOiBtZXJnZWRQcm9wcyxcbiAgICBrZXk6IG1lcmdlZFByb3BzICYmIG5vcm1hbGl6ZUtleShtZXJnZWRQcm9wcyksXG4gICAgcmVmOiBleHRyYVByb3BzICYmIGV4dHJhUHJvcHMucmVmID8gKFxuICAgICAgLy8gIzIwNzggaW4gdGhlIGNhc2Ugb2YgPGNvbXBvbmVudCA6aXM9XCJ2bm9kZVwiIHJlZj1cImV4dHJhXCIvPlxuICAgICAgLy8gaWYgdGhlIHZub2RlIGl0c2VsZiBhbHJlYWR5IGhhcyBhIHJlZiwgY2xvbmVWTm9kZSB3aWxsIG5lZWQgdG8gbWVyZ2VcbiAgICAgIC8vIHRoZSByZWZzIHNvIHRoZSBzaW5nbGUgdm5vZGUgY2FuIGJlIHNldCBvbiBtdWx0aXBsZSByZWZzXG4gICAgICBtZXJnZVJlZiAmJiByZWYgPyBpc0FycmF5KHJlZikgPyByZWYuY29uY2F0KG5vcm1hbGl6ZVJlZihleHRyYVByb3BzKSkgOiBbcmVmLCBub3JtYWxpemVSZWYoZXh0cmFQcm9wcyldIDogbm9ybWFsaXplUmVmKGV4dHJhUHJvcHMpXG4gICAgKSA6IHJlZixcbiAgICBzY29wZUlkOiB2bm9kZS5zY29wZUlkLFxuICAgIHNsb3RTY29wZUlkczogdm5vZGUuc2xvdFNjb3BlSWRzLFxuICAgIGNoaWxkcmVuOiAhIShwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gXCJwcm9kdWN0aW9uXCIpICYmIHBhdGNoRmxhZyA9PT0gLTEgJiYgaXNBcnJheShjaGlsZHJlbikgPyBjaGlsZHJlbi5tYXAoZGVlcENsb25lVk5vZGUpIDogY2hpbGRyZW4sXG4gICAgdGFyZ2V0OiB2bm9kZS50YXJnZXQsXG4gICAgdGFyZ2V0U3RhcnQ6IHZub2RlLnRhcmdldFN0YXJ0LFxuICAgIHRhcmdldEFuY2hvcjogdm5vZGUudGFyZ2V0QW5jaG9yLFxuICAgIHN0YXRpY0NvdW50OiB2bm9kZS5zdGF0aWNDb3VudCxcbiAgICBzaGFwZUZsYWc6IHZub2RlLnNoYXBlRmxhZyxcbiAgICAvLyBpZiB0aGUgdm5vZGUgaXMgY2xvbmVkIHdpdGggZXh0cmEgcHJvcHMsIHdlIGNhbiBubyBsb25nZXIgYXNzdW1lIGl0c1xuICAgIC8vIGV4aXN0aW5nIHBhdGNoIGZsYWcgdG8gYmUgcmVsaWFibGUgYW5kIG5lZWQgdG8gYWRkIHRoZSBGVUxMX1BST1BTIGZsYWcuXG4gICAgLy8gbm90ZTogcHJlc2VydmUgZmxhZyBmb3IgZnJhZ21lbnRzIHNpbmNlIHRoZXkgdXNlIHRoZSBmbGFnIGZvciBjaGlsZHJlblxuICAgIC8vIGZhc3QgcGF0aHMgb25seS5cbiAgICBwYXRjaEZsYWc6IGV4dHJhUHJvcHMgJiYgdm5vZGUudHlwZSAhPT0gRnJhZ21lbnQgPyBwYXRjaEZsYWcgPT09IC0xID8gMTYgOiBwYXRjaEZsYWcgfCAxNiA6IHBhdGNoRmxhZyxcbiAgICBkeW5hbWljUHJvcHM6IHZub2RlLmR5bmFtaWNQcm9wcyxcbiAgICBkeW5hbWljQ2hpbGRyZW46IHZub2RlLmR5bmFtaWNDaGlsZHJlbixcbiAgICBhcHBDb250ZXh0OiB2bm9kZS5hcHBDb250ZXh0LFxuICAgIGRpcnM6IHZub2RlLmRpcnMsXG4gICAgdHJhbnNpdGlvbixcbiAgICAvLyBUaGVzZSBzaG91bGQgdGVjaG5pY2FsbHkgb25seSBiZSBub24tbnVsbCBvbiBtb3VudGVkIFZOb2Rlcy4gSG93ZXZlcixcbiAgICAvLyB0aGV5ICpzaG91bGQqIGJlIGNvcGllZCBmb3Iga2VwdC1hbGl2ZSB2bm9kZXMuIFNvIHdlIGp1c3QgYWx3YXlzIGNvcHlcbiAgICAvLyB0aGVtIHNpbmNlIHRoZW0gYmVpbmcgbm9uLW51bGwgZHVyaW5nIGEgbW91bnQgZG9lc24ndCBhZmZlY3QgdGhlIGxvZ2ljIGFzXG4gICAgLy8gdGhleSB3aWxsIHNpbXBseSBiZSBvdmVyd3JpdHRlbi5cbiAgICBjb21wb25lbnQ6IHZub2RlLmNvbXBvbmVudCxcbiAgICBzdXNwZW5zZTogdm5vZGUuc3VzcGVuc2UsXG4gICAgc3NDb250ZW50OiB2bm9kZS5zc0NvbnRlbnQgJiYgY2xvbmVWTm9kZSh2bm9kZS5zc0NvbnRlbnQpLFxuICAgIHNzRmFsbGJhY2s6IHZub2RlLnNzRmFsbGJhY2sgJiYgY2xvbmVWTm9kZSh2bm9kZS5zc0ZhbGxiYWNrKSxcbiAgICBwbGFjZWhvbGRlcjogdm5vZGUucGxhY2Vob2xkZXIsXG4gICAgZWw6IHZub2RlLmVsLFxuICAgIGFuY2hvcjogdm5vZGUuYW5jaG9yLFxuICAgIGN0eDogdm5vZGUuY3R4LFxuICAgIGNlOiB2bm9kZS5jZVxuICB9O1xuICBpZiAodHJhbnNpdGlvbiAmJiBjbG9uZVRyYW5zaXRpb24pIHtcbiAgICBzZXRUcmFuc2l0aW9uSG9va3MoXG4gICAgICBjbG9uZWQsXG4gICAgICB0cmFuc2l0aW9uLmNsb25lKGNsb25lZClcbiAgICApO1xuICB9XG4gIHJldHVybiBjbG9uZWQ7XG59XG5mdW5jdGlvbiBkZWVwQ2xvbmVWTm9kZSh2bm9kZSkge1xuICBjb25zdCBjbG9uZWQgPSBjbG9uZVZOb2RlKHZub2RlKTtcbiAgaWYgKGlzQXJyYXkodm5vZGUuY2hpbGRyZW4pKSB7XG4gICAgY2xvbmVkLmNoaWxkcmVuID0gdm5vZGUuY2hpbGRyZW4ubWFwKGRlZXBDbG9uZVZOb2RlKTtcbiAgfVxuICByZXR1cm4gY2xvbmVkO1xufVxuZnVuY3Rpb24gY3JlYXRlVGV4dFZOb2RlKHRleHQgPSBcIiBcIiwgZmxhZyA9IDApIHtcbiAgcmV0dXJuIGNyZWF0ZVZOb2RlKFRleHQsIG51bGwsIHRleHQsIGZsYWcpO1xufVxuZnVuY3Rpb24gY3JlYXRlU3RhdGljVk5vZGUoY29udGVudCwgbnVtYmVyT2ZOb2Rlcykge1xuICBjb25zdCB2bm9kZSA9IGNyZWF0ZVZOb2RlKFN0YXRpYywgbnVsbCwgY29udGVudCk7XG4gIHZub2RlLnN0YXRpY0NvdW50ID0gbnVtYmVyT2ZOb2RlcztcbiAgcmV0dXJuIHZub2RlO1xufVxuZnVuY3Rpb24gY3JlYXRlQ29tbWVudFZOb2RlKHRleHQgPSBcIlwiLCBhc0Jsb2NrID0gZmFsc2UpIHtcbiAgcmV0dXJuIGFzQmxvY2sgPyAob3BlbkJsb2NrKCksIGNyZWF0ZUJsb2NrKENvbW1lbnQsIG51bGwsIHRleHQpKSA6IGNyZWF0ZVZOb2RlKENvbW1lbnQsIG51bGwsIHRleHQpO1xufVxuZnVuY3Rpb24gbm9ybWFsaXplVk5vZGUoY2hpbGQpIHtcbiAgaWYgKGNoaWxkID09IG51bGwgfHwgdHlwZW9mIGNoaWxkID09PSBcImJvb2xlYW5cIikge1xuICAgIHJldHVybiBjcmVhdGVWTm9kZShDb21tZW50KTtcbiAgfSBlbHNlIGlmIChpc0FycmF5KGNoaWxkKSkge1xuICAgIHJldHVybiBjcmVhdGVWTm9kZShcbiAgICAgIEZyYWdtZW50LFxuICAgICAgbnVsbCxcbiAgICAgIC8vICMzNjY2LCBhdm9pZCByZWZlcmVuY2UgcG9sbHV0aW9uIHdoZW4gcmV1c2luZyB2bm9kZVxuICAgICAgY2hpbGQuc2xpY2UoKVxuICAgICk7XG4gIH0gZWxzZSBpZiAoaXNWTm9kZShjaGlsZCkpIHtcbiAgICByZXR1cm4gY2xvbmVJZk1vdW50ZWQoY2hpbGQpO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiBjcmVhdGVWTm9kZShUZXh0LCBudWxsLCBTdHJpbmcoY2hpbGQpKTtcbiAgfVxufVxuZnVuY3Rpb24gY2xvbmVJZk1vdW50ZWQoY2hpbGQpIHtcbiAgcmV0dXJuIGNoaWxkLmVsID09PSBudWxsICYmIGNoaWxkLnBhdGNoRmxhZyAhPT0gLTEgfHwgY2hpbGQubWVtbyA/IGNoaWxkIDogY2xvbmVWTm9kZShjaGlsZCk7XG59XG5mdW5jdGlvbiBub3JtYWxpemVDaGlsZHJlbih2bm9kZSwgY2hpbGRyZW4pIHtcbiAgbGV0IHR5cGUgPSAwO1xuICBjb25zdCB7IHNoYXBlRmxhZyB9ID0gdm5vZGU7XG4gIGlmIChjaGlsZHJlbiA9PSBudWxsKSB7XG4gICAgY2hpbGRyZW4gPSBudWxsO1xuICB9IGVsc2UgaWYgKGlzQXJyYXkoY2hpbGRyZW4pKSB7XG4gICAgdHlwZSA9IDE2O1xuICB9IGVsc2UgaWYgKHR5cGVvZiBjaGlsZHJlbiA9PT0gXCJvYmplY3RcIikge1xuICAgIGlmIChzaGFwZUZsYWcgJiAoMSB8IDY0KSkge1xuICAgICAgY29uc3Qgc2xvdCA9IGNoaWxkcmVuLmRlZmF1bHQ7XG4gICAgICBpZiAoc2xvdCkge1xuICAgICAgICBzbG90Ll9jICYmIChzbG90Ll9kID0gZmFsc2UpO1xuICAgICAgICBub3JtYWxpemVDaGlsZHJlbih2bm9kZSwgc2xvdCgpKTtcbiAgICAgICAgc2xvdC5fYyAmJiAoc2xvdC5fZCA9IHRydWUpO1xuICAgICAgfVxuICAgICAgcmV0dXJuO1xuICAgIH0gZWxzZSB7XG4gICAgICB0eXBlID0gMzI7XG4gICAgICBjb25zdCBzbG90RmxhZyA9IGNoaWxkcmVuLl87XG4gICAgICBpZiAoIXNsb3RGbGFnICYmICFpc0ludGVybmFsT2JqZWN0KGNoaWxkcmVuKSkge1xuICAgICAgICBjaGlsZHJlbi5fY3R4ID0gY3VycmVudFJlbmRlcmluZ0luc3RhbmNlO1xuICAgICAgfSBlbHNlIGlmIChzbG90RmxhZyA9PT0gMyAmJiBjdXJyZW50UmVuZGVyaW5nSW5zdGFuY2UpIHtcbiAgICAgICAgaWYgKGN1cnJlbnRSZW5kZXJpbmdJbnN0YW5jZS5zbG90cy5fID09PSAxKSB7XG4gICAgICAgICAgY2hpbGRyZW4uXyA9IDE7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgY2hpbGRyZW4uXyA9IDI7XG4gICAgICAgICAgdm5vZGUucGF0Y2hGbGFnIHw9IDEwMjQ7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH0gZWxzZSBpZiAoaXNGdW5jdGlvbihjaGlsZHJlbikpIHtcbiAgICBjaGlsZHJlbiA9IHsgZGVmYXVsdDogY2hpbGRyZW4sIF9jdHg6IGN1cnJlbnRSZW5kZXJpbmdJbnN0YW5jZSB9O1xuICAgIHR5cGUgPSAzMjtcbiAgfSBlbHNlIHtcbiAgICBjaGlsZHJlbiA9IFN0cmluZyhjaGlsZHJlbik7XG4gICAgaWYgKHNoYXBlRmxhZyAmIDY0KSB7XG4gICAgICB0eXBlID0gMTY7XG4gICAgICBjaGlsZHJlbiA9IFtjcmVhdGVUZXh0Vk5vZGUoY2hpbGRyZW4pXTtcbiAgICB9IGVsc2Uge1xuICAgICAgdHlwZSA9IDg7XG4gICAgfVxuICB9XG4gIHZub2RlLmNoaWxkcmVuID0gY2hpbGRyZW47XG4gIHZub2RlLnNoYXBlRmxhZyB8PSB0eXBlO1xufVxuZnVuY3Rpb24gbWVyZ2VQcm9wcyguLi5hcmdzKSB7XG4gIGNvbnN0IHJldCA9IHt9O1xuICBmb3IgKGxldCBpID0gMDsgaSA8IGFyZ3MubGVuZ3RoOyBpKyspIHtcbiAgICBjb25zdCB0b01lcmdlID0gYXJnc1tpXTtcbiAgICBmb3IgKGNvbnN0IGtleSBpbiB0b01lcmdlKSB7XG4gICAgICBpZiAoa2V5ID09PSBcImNsYXNzXCIpIHtcbiAgICAgICAgaWYgKHJldC5jbGFzcyAhPT0gdG9NZXJnZS5jbGFzcykge1xuICAgICAgICAgIHJldC5jbGFzcyA9IG5vcm1hbGl6ZUNsYXNzKFtyZXQuY2xhc3MsIHRvTWVyZ2UuY2xhc3NdKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIGlmIChrZXkgPT09IFwic3R5bGVcIikge1xuICAgICAgICByZXQuc3R5bGUgPSBub3JtYWxpemVTdHlsZShbcmV0LnN0eWxlLCB0b01lcmdlLnN0eWxlXSk7XG4gICAgICB9IGVsc2UgaWYgKGlzT24oa2V5KSkge1xuICAgICAgICBjb25zdCBleGlzdGluZyA9IHJldFtrZXldO1xuICAgICAgICBjb25zdCBpbmNvbWluZyA9IHRvTWVyZ2Vba2V5XTtcbiAgICAgICAgaWYgKGluY29taW5nICYmIGV4aXN0aW5nICE9PSBpbmNvbWluZyAmJiAhKGlzQXJyYXkoZXhpc3RpbmcpICYmIGV4aXN0aW5nLmluY2x1ZGVzKGluY29taW5nKSkpIHtcbiAgICAgICAgICByZXRba2V5XSA9IGV4aXN0aW5nID8gW10uY29uY2F0KGV4aXN0aW5nLCBpbmNvbWluZykgOiBpbmNvbWluZztcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIGlmIChrZXkgIT09IFwiXCIpIHtcbiAgICAgICAgcmV0W2tleV0gPSB0b01lcmdlW2tleV07XG4gICAgICB9XG4gICAgfVxuICB9XG4gIHJldHVybiByZXQ7XG59XG5mdW5jdGlvbiBpbnZva2VWTm9kZUhvb2soaG9vaywgaW5zdGFuY2UsIHZub2RlLCBwcmV2Vk5vZGUgPSBudWxsKSB7XG4gIGNhbGxXaXRoQXN5bmNFcnJvckhhbmRsaW5nKGhvb2ssIGluc3RhbmNlLCA3LCBbXG4gICAgdm5vZGUsXG4gICAgcHJldlZOb2RlXG4gIF0pO1xufVxuXG5jb25zdCBlbXB0eUFwcENvbnRleHQgPSBjcmVhdGVBcHBDb250ZXh0KCk7XG5sZXQgdWlkID0gMDtcbmZ1bmN0aW9uIGNyZWF0ZUNvbXBvbmVudEluc3RhbmNlKHZub2RlLCBwYXJlbnQsIHN1c3BlbnNlKSB7XG4gIGNvbnN0IHR5cGUgPSB2bm9kZS50eXBlO1xuICBjb25zdCBhcHBDb250ZXh0ID0gKHBhcmVudCA/IHBhcmVudC5hcHBDb250ZXh0IDogdm5vZGUuYXBwQ29udGV4dCkgfHwgZW1wdHlBcHBDb250ZXh0O1xuICBjb25zdCBpbnN0YW5jZSA9IHtcbiAgICB1aWQ6IHVpZCsrLFxuICAgIHZub2RlLFxuICAgIHR5cGUsXG4gICAgcGFyZW50LFxuICAgIGFwcENvbnRleHQsXG4gICAgcm9vdDogbnVsbCxcbiAgICAvLyB0byBiZSBpbW1lZGlhdGVseSBzZXRcbiAgICBuZXh0OiBudWxsLFxuICAgIHN1YlRyZWU6IG51bGwsXG4gICAgLy8gd2lsbCBiZSBzZXQgc3luY2hyb25vdXNseSByaWdodCBhZnRlciBjcmVhdGlvblxuICAgIGVmZmVjdDogbnVsbCxcbiAgICB1cGRhdGU6IG51bGwsXG4gICAgLy8gd2lsbCBiZSBzZXQgc3luY2hyb25vdXNseSByaWdodCBhZnRlciBjcmVhdGlvblxuICAgIGpvYjogbnVsbCxcbiAgICBzY29wZTogbmV3IEVmZmVjdFNjb3BlKFxuICAgICAgdHJ1ZVxuICAgICAgLyogZGV0YWNoZWQgKi9cbiAgICApLFxuICAgIHJlbmRlcjogbnVsbCxcbiAgICBwcm94eTogbnVsbCxcbiAgICBleHBvc2VkOiBudWxsLFxuICAgIGV4cG9zZVByb3h5OiBudWxsLFxuICAgIHdpdGhQcm94eTogbnVsbCxcbiAgICBwcm92aWRlczogcGFyZW50ID8gcGFyZW50LnByb3ZpZGVzIDogT2JqZWN0LmNyZWF0ZShhcHBDb250ZXh0LnByb3ZpZGVzKSxcbiAgICBpZHM6IHBhcmVudCA/IHBhcmVudC5pZHMgOiBbXCJcIiwgMCwgMF0sXG4gICAgYWNjZXNzQ2FjaGU6IG51bGwsXG4gICAgcmVuZGVyQ2FjaGU6IFtdLFxuICAgIC8vIGxvY2FsIHJlc29sdmVkIGFzc2V0c1xuICAgIGNvbXBvbmVudHM6IG51bGwsXG4gICAgZGlyZWN0aXZlczogbnVsbCxcbiAgICAvLyByZXNvbHZlZCBwcm9wcyBhbmQgZW1pdHMgb3B0aW9uc1xuICAgIHByb3BzT3B0aW9uczogbm9ybWFsaXplUHJvcHNPcHRpb25zKHR5cGUsIGFwcENvbnRleHQpLFxuICAgIGVtaXRzT3B0aW9uczogbm9ybWFsaXplRW1pdHNPcHRpb25zKHR5cGUsIGFwcENvbnRleHQpLFxuICAgIC8vIGVtaXRcbiAgICBlbWl0OiBudWxsLFxuICAgIC8vIHRvIGJlIHNldCBpbW1lZGlhdGVseVxuICAgIGVtaXR0ZWQ6IG51bGwsXG4gICAgLy8gcHJvcHMgZGVmYXVsdCB2YWx1ZVxuICAgIHByb3BzRGVmYXVsdHM6IEVNUFRZX09CSixcbiAgICAvLyBpbmhlcml0QXR0cnNcbiAgICBpbmhlcml0QXR0cnM6IHR5cGUuaW5oZXJpdEF0dHJzLFxuICAgIC8vIHN0YXRlXG4gICAgY3R4OiBFTVBUWV9PQkosXG4gICAgZGF0YTogRU1QVFlfT0JKLFxuICAgIHByb3BzOiBFTVBUWV9PQkosXG4gICAgYXR0cnM6IEVNUFRZX09CSixcbiAgICBzbG90czogRU1QVFlfT0JKLFxuICAgIHJlZnM6IEVNUFRZX09CSixcbiAgICBzZXR1cFN0YXRlOiBFTVBUWV9PQkosXG4gICAgc2V0dXBDb250ZXh0OiBudWxsLFxuICAgIC8vIHN1c3BlbnNlIHJlbGF0ZWRcbiAgICBzdXNwZW5zZSxcbiAgICBzdXNwZW5zZUlkOiBzdXNwZW5zZSA/IHN1c3BlbnNlLnBlbmRpbmdJZCA6IDAsXG4gICAgYXN5bmNEZXA6IG51bGwsXG4gICAgYXN5bmNSZXNvbHZlZDogZmFsc2UsXG4gICAgLy8gbGlmZWN5Y2xlIGhvb2tzXG4gICAgLy8gbm90IHVzaW5nIGVudW1zIGhlcmUgYmVjYXVzZSBpdCByZXN1bHRzIGluIGNvbXB1dGVkIHByb3BlcnRpZXNcbiAgICBpc01vdW50ZWQ6IGZhbHNlLFxuICAgIGlzVW5tb3VudGVkOiBmYWxzZSxcbiAgICBpc0RlYWN0aXZhdGVkOiBmYWxzZSxcbiAgICBiYzogbnVsbCxcbiAgICBjOiBudWxsLFxuICAgIGJtOiBudWxsLFxuICAgIG06IG51bGwsXG4gICAgYnU6IG51bGwsXG4gICAgdTogbnVsbCxcbiAgICB1bTogbnVsbCxcbiAgICBidW06IG51bGwsXG4gICAgZGE6IG51bGwsXG4gICAgYTogbnVsbCxcbiAgICBydGc6IG51bGwsXG4gICAgcnRjOiBudWxsLFxuICAgIGVjOiBudWxsLFxuICAgIHNwOiBudWxsXG4gIH07XG4gIGlmICghIShwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gXCJwcm9kdWN0aW9uXCIpKSB7XG4gICAgaW5zdGFuY2UuY3R4ID0gY3JlYXRlRGV2UmVuZGVyQ29udGV4dChpbnN0YW5jZSk7XG4gIH0gZWxzZSB7XG4gICAgaW5zdGFuY2UuY3R4ID0geyBfOiBpbnN0YW5jZSB9O1xuICB9XG4gIGluc3RhbmNlLnJvb3QgPSBwYXJlbnQgPyBwYXJlbnQucm9vdCA6IGluc3RhbmNlO1xuICBpbnN0YW5jZS5lbWl0ID0gZW1pdC5iaW5kKG51bGwsIGluc3RhbmNlKTtcbiAgaWYgKHZub2RlLmNlKSB7XG4gICAgdm5vZGUuY2UoaW5zdGFuY2UpO1xuICB9XG4gIHJldHVybiBpbnN0YW5jZTtcbn1cbmxldCBjdXJyZW50SW5zdGFuY2UgPSBudWxsO1xuY29uc3QgZ2V0Q3VycmVudEluc3RhbmNlID0gKCkgPT4gY3VycmVudEluc3RhbmNlIHx8IGN1cnJlbnRSZW5kZXJpbmdJbnN0YW5jZTtcbmxldCBpbnRlcm5hbFNldEN1cnJlbnRJbnN0YW5jZTtcbmxldCBzZXRJblNTUlNldHVwU3RhdGU7XG57XG4gIGNvbnN0IGcgPSBnZXRHbG9iYWxUaGlzKCk7XG4gIGNvbnN0IHJlZ2lzdGVyR2xvYmFsU2V0dGVyID0gKGtleSwgc2V0dGVyKSA9PiB7XG4gICAgbGV0IHNldHRlcnM7XG4gICAgaWYgKCEoc2V0dGVycyA9IGdba2V5XSkpIHNldHRlcnMgPSBnW2tleV0gPSBbXTtcbiAgICBzZXR0ZXJzLnB1c2goc2V0dGVyKTtcbiAgICByZXR1cm4gKHYpID0+IHtcbiAgICAgIGlmIChzZXR0ZXJzLmxlbmd0aCA+IDEpIHNldHRlcnMuZm9yRWFjaCgoc2V0KSA9PiBzZXQodikpO1xuICAgICAgZWxzZSBzZXR0ZXJzWzBdKHYpO1xuICAgIH07XG4gIH07XG4gIGludGVybmFsU2V0Q3VycmVudEluc3RhbmNlID0gcmVnaXN0ZXJHbG9iYWxTZXR0ZXIoXG4gICAgYF9fVlVFX0lOU1RBTkNFX1NFVFRFUlNfX2AsXG4gICAgKHYpID0+IGN1cnJlbnRJbnN0YW5jZSA9IHZcbiAgKTtcbiAgc2V0SW5TU1JTZXR1cFN0YXRlID0gcmVnaXN0ZXJHbG9iYWxTZXR0ZXIoXG4gICAgYF9fVlVFX1NTUl9TRVRURVJTX19gLFxuICAgICh2KSA9PiBpc0luU1NSQ29tcG9uZW50U2V0dXAgPSB2XG4gICk7XG59XG5jb25zdCBzZXRDdXJyZW50SW5zdGFuY2UgPSAoaW5zdGFuY2UpID0+IHtcbiAgY29uc3QgcHJldiA9IGN1cnJlbnRJbnN0YW5jZTtcbiAgaW50ZXJuYWxTZXRDdXJyZW50SW5zdGFuY2UoaW5zdGFuY2UpO1xuICBpbnN0YW5jZS5zY29wZS5vbigpO1xuICByZXR1cm4gKCkgPT4ge1xuICAgIGluc3RhbmNlLnNjb3BlLm9mZigpO1xuICAgIGludGVybmFsU2V0Q3VycmVudEluc3RhbmNlKHByZXYpO1xuICB9O1xufTtcbmNvbnN0IHVuc2V0Q3VycmVudEluc3RhbmNlID0gKCkgPT4ge1xuICBjdXJyZW50SW5zdGFuY2UgJiYgY3VycmVudEluc3RhbmNlLnNjb3BlLm9mZigpO1xuICBpbnRlcm5hbFNldEN1cnJlbnRJbnN0YW5jZShudWxsKTtcbn07XG5jb25zdCBpc0J1aWx0SW5UYWcgPSAvKiBAX19QVVJFX18gKi8gbWFrZU1hcChcInNsb3QsY29tcG9uZW50XCIpO1xuZnVuY3Rpb24gdmFsaWRhdGVDb21wb25lbnROYW1lKG5hbWUsIHsgaXNOYXRpdmVUYWcgfSkge1xuICBpZiAoaXNCdWlsdEluVGFnKG5hbWUpIHx8IGlzTmF0aXZlVGFnKG5hbWUpKSB7XG4gICAgd2FybiQxKFxuICAgICAgXCJEbyBub3QgdXNlIGJ1aWx0LWluIG9yIHJlc2VydmVkIEhUTUwgZWxlbWVudHMgYXMgY29tcG9uZW50IGlkOiBcIiArIG5hbWVcbiAgICApO1xuICB9XG59XG5mdW5jdGlvbiBpc1N0YXRlZnVsQ29tcG9uZW50KGluc3RhbmNlKSB7XG4gIHJldHVybiBpbnN0YW5jZS52bm9kZS5zaGFwZUZsYWcgJiA0O1xufVxubGV0IGlzSW5TU1JDb21wb25lbnRTZXR1cCA9IGZhbHNlO1xuZnVuY3Rpb24gc2V0dXBDb21wb25lbnQoaW5zdGFuY2UsIGlzU1NSID0gZmFsc2UsIG9wdGltaXplZCA9IGZhbHNlKSB7XG4gIGlzU1NSICYmIHNldEluU1NSU2V0dXBTdGF0ZShpc1NTUik7XG4gIGNvbnN0IHsgcHJvcHMsIGNoaWxkcmVuIH0gPSBpbnN0YW5jZS52bm9kZTtcbiAgY29uc3QgaXNTdGF0ZWZ1bCA9IGlzU3RhdGVmdWxDb21wb25lbnQoaW5zdGFuY2UpO1xuICBpbml0UHJvcHMoaW5zdGFuY2UsIHByb3BzLCBpc1N0YXRlZnVsLCBpc1NTUik7XG4gIGluaXRTbG90cyhpbnN0YW5jZSwgY2hpbGRyZW4sIG9wdGltaXplZCB8fCBpc1NTUik7XG4gIGNvbnN0IHNldHVwUmVzdWx0ID0gaXNTdGF0ZWZ1bCA/IHNldHVwU3RhdGVmdWxDb21wb25lbnQoaW5zdGFuY2UsIGlzU1NSKSA6IHZvaWQgMDtcbiAgaXNTU1IgJiYgc2V0SW5TU1JTZXR1cFN0YXRlKGZhbHNlKTtcbiAgcmV0dXJuIHNldHVwUmVzdWx0O1xufVxuZnVuY3Rpb24gc2V0dXBTdGF0ZWZ1bENvbXBvbmVudChpbnN0YW5jZSwgaXNTU1IpIHtcbiAgY29uc3QgQ29tcG9uZW50ID0gaW5zdGFuY2UudHlwZTtcbiAgaWYgKCEhKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSBcInByb2R1Y3Rpb25cIikpIHtcbiAgICBpZiAoQ29tcG9uZW50Lm5hbWUpIHtcbiAgICAgIHZhbGlkYXRlQ29tcG9uZW50TmFtZShDb21wb25lbnQubmFtZSwgaW5zdGFuY2UuYXBwQ29udGV4dC5jb25maWcpO1xuICAgIH1cbiAgICBpZiAoQ29tcG9uZW50LmNvbXBvbmVudHMpIHtcbiAgICAgIGNvbnN0IG5hbWVzID0gT2JqZWN0LmtleXMoQ29tcG9uZW50LmNvbXBvbmVudHMpO1xuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBuYW1lcy5sZW5ndGg7IGkrKykge1xuICAgICAgICB2YWxpZGF0ZUNvbXBvbmVudE5hbWUobmFtZXNbaV0sIGluc3RhbmNlLmFwcENvbnRleHQuY29uZmlnKTtcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKENvbXBvbmVudC5kaXJlY3RpdmVzKSB7XG4gICAgICBjb25zdCBuYW1lcyA9IE9iamVjdC5rZXlzKENvbXBvbmVudC5kaXJlY3RpdmVzKTtcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbmFtZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgdmFsaWRhdGVEaXJlY3RpdmVOYW1lKG5hbWVzW2ldKTtcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKENvbXBvbmVudC5jb21waWxlck9wdGlvbnMgJiYgaXNSdW50aW1lT25seSgpKSB7XG4gICAgICB3YXJuJDEoXG4gICAgICAgIGBcImNvbXBpbGVyT3B0aW9uc1wiIGlzIG9ubHkgc3VwcG9ydGVkIHdoZW4gdXNpbmcgYSBidWlsZCBvZiBWdWUgdGhhdCBpbmNsdWRlcyB0aGUgcnVudGltZSBjb21waWxlci4gU2luY2UgeW91IGFyZSB1c2luZyBhIHJ1bnRpbWUtb25seSBidWlsZCwgdGhlIG9wdGlvbnMgc2hvdWxkIGJlIHBhc3NlZCB2aWEgeW91ciBidWlsZCB0b29sIGNvbmZpZyBpbnN0ZWFkLmBcbiAgICAgICk7XG4gICAgfVxuICB9XG4gIGluc3RhbmNlLmFjY2Vzc0NhY2hlID0gLyogQF9fUFVSRV9fICovIE9iamVjdC5jcmVhdGUobnVsbCk7XG4gIGluc3RhbmNlLnByb3h5ID0gbmV3IFByb3h5KGluc3RhbmNlLmN0eCwgUHVibGljSW5zdGFuY2VQcm94eUhhbmRsZXJzKTtcbiAgaWYgKCEhKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSBcInByb2R1Y3Rpb25cIikpIHtcbiAgICBleHBvc2VQcm9wc09uUmVuZGVyQ29udGV4dChpbnN0YW5jZSk7XG4gIH1cbiAgY29uc3QgeyBzZXR1cCB9ID0gQ29tcG9uZW50O1xuICBpZiAoc2V0dXApIHtcbiAgICBwYXVzZVRyYWNraW5nKCk7XG4gICAgY29uc3Qgc2V0dXBDb250ZXh0ID0gaW5zdGFuY2Uuc2V0dXBDb250ZXh0ID0gc2V0dXAubGVuZ3RoID4gMSA/IGNyZWF0ZVNldHVwQ29udGV4dChpbnN0YW5jZSkgOiBudWxsO1xuICAgIGNvbnN0IHJlc2V0ID0gc2V0Q3VycmVudEluc3RhbmNlKGluc3RhbmNlKTtcbiAgICBjb25zdCBzZXR1cFJlc3VsdCA9IGNhbGxXaXRoRXJyb3JIYW5kbGluZyhcbiAgICAgIHNldHVwLFxuICAgICAgaW5zdGFuY2UsXG4gICAgICAwLFxuICAgICAgW1xuICAgICAgICAhIShwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gXCJwcm9kdWN0aW9uXCIpID8gc2hhbGxvd1JlYWRvbmx5KGluc3RhbmNlLnByb3BzKSA6IGluc3RhbmNlLnByb3BzLFxuICAgICAgICBzZXR1cENvbnRleHRcbiAgICAgIF1cbiAgICApO1xuICAgIGNvbnN0IGlzQXN5bmNTZXR1cCA9IGlzUHJvbWlzZShzZXR1cFJlc3VsdCk7XG4gICAgcmVzZXRUcmFja2luZygpO1xuICAgIHJlc2V0KCk7XG4gICAgaWYgKChpc0FzeW5jU2V0dXAgfHwgaW5zdGFuY2Uuc3ApICYmICFpc0FzeW5jV3JhcHBlcihpbnN0YW5jZSkpIHtcbiAgICAgIG1hcmtBc3luY0JvdW5kYXJ5KGluc3RhbmNlKTtcbiAgICB9XG4gICAgaWYgKGlzQXN5bmNTZXR1cCkge1xuICAgICAgc2V0dXBSZXN1bHQudGhlbih1bnNldEN1cnJlbnRJbnN0YW5jZSwgdW5zZXRDdXJyZW50SW5zdGFuY2UpO1xuICAgICAgaWYgKGlzU1NSKSB7XG4gICAgICAgIHJldHVybiBzZXR1cFJlc3VsdC50aGVuKChyZXNvbHZlZFJlc3VsdCkgPT4ge1xuICAgICAgICAgIGhhbmRsZVNldHVwUmVzdWx0KGluc3RhbmNlLCByZXNvbHZlZFJlc3VsdCwgaXNTU1IpO1xuICAgICAgICB9KS5jYXRjaCgoZSkgPT4ge1xuICAgICAgICAgIGhhbmRsZUVycm9yKGUsIGluc3RhbmNlLCAwKTtcbiAgICAgICAgfSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpbnN0YW5jZS5hc3luY0RlcCA9IHNldHVwUmVzdWx0O1xuICAgICAgICBpZiAoISEocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09IFwicHJvZHVjdGlvblwiKSAmJiAhaW5zdGFuY2Uuc3VzcGVuc2UpIHtcbiAgICAgICAgICBjb25zdCBuYW1lID0gZm9ybWF0Q29tcG9uZW50TmFtZShpbnN0YW5jZSwgQ29tcG9uZW50KTtcbiAgICAgICAgICB3YXJuJDEoXG4gICAgICAgICAgICBgQ29tcG9uZW50IDwke25hbWV9Pjogc2V0dXAgZnVuY3Rpb24gcmV0dXJuZWQgYSBwcm9taXNlLCBidXQgbm8gPFN1c3BlbnNlPiBib3VuZGFyeSB3YXMgZm91bmQgaW4gdGhlIHBhcmVudCBjb21wb25lbnQgdHJlZS4gQSBjb21wb25lbnQgd2l0aCBhc3luYyBzZXR1cCgpIG11c3QgYmUgbmVzdGVkIGluIGEgPFN1c3BlbnNlPiBpbiBvcmRlciB0byBiZSByZW5kZXJlZC5gXG4gICAgICAgICAgKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBoYW5kbGVTZXR1cFJlc3VsdChpbnN0YW5jZSwgc2V0dXBSZXN1bHQsIGlzU1NSKTtcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgZmluaXNoQ29tcG9uZW50U2V0dXAoaW5zdGFuY2UsIGlzU1NSKTtcbiAgfVxufVxuZnVuY3Rpb24gaGFuZGxlU2V0dXBSZXN1bHQoaW5zdGFuY2UsIHNldHVwUmVzdWx0LCBpc1NTUikge1xuICBpZiAoaXNGdW5jdGlvbihzZXR1cFJlc3VsdCkpIHtcbiAgICBpZiAoaW5zdGFuY2UudHlwZS5fX3NzcklubGluZVJlbmRlcikge1xuICAgICAgaW5zdGFuY2Uuc3NyUmVuZGVyID0gc2V0dXBSZXN1bHQ7XG4gICAgfSBlbHNlIHtcbiAgICAgIGluc3RhbmNlLnJlbmRlciA9IHNldHVwUmVzdWx0O1xuICAgIH1cbiAgfSBlbHNlIGlmIChpc09iamVjdChzZXR1cFJlc3VsdCkpIHtcbiAgICBpZiAoISEocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09IFwicHJvZHVjdGlvblwiKSAmJiBpc1ZOb2RlKHNldHVwUmVzdWx0KSkge1xuICAgICAgd2FybiQxKFxuICAgICAgICBgc2V0dXAoKSBzaG91bGQgbm90IHJldHVybiBWTm9kZXMgZGlyZWN0bHkgLSByZXR1cm4gYSByZW5kZXIgZnVuY3Rpb24gaW5zdGVhZC5gXG4gICAgICApO1xuICAgIH1cbiAgICBpZiAoISEocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09IFwicHJvZHVjdGlvblwiKSB8fCBfX1ZVRV9QUk9EX0RFVlRPT0xTX18pIHtcbiAgICAgIGluc3RhbmNlLmRldnRvb2xzUmF3U2V0dXBTdGF0ZSA9IHNldHVwUmVzdWx0O1xuICAgIH1cbiAgICBpbnN0YW5jZS5zZXR1cFN0YXRlID0gcHJveHlSZWZzKHNldHVwUmVzdWx0KTtcbiAgICBpZiAoISEocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09IFwicHJvZHVjdGlvblwiKSkge1xuICAgICAgZXhwb3NlU2V0dXBTdGF0ZU9uUmVuZGVyQ29udGV4dChpbnN0YW5jZSk7XG4gICAgfVxuICB9IGVsc2UgaWYgKCEhKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSBcInByb2R1Y3Rpb25cIikgJiYgc2V0dXBSZXN1bHQgIT09IHZvaWQgMCkge1xuICAgIHdhcm4kMShcbiAgICAgIGBzZXR1cCgpIHNob3VsZCByZXR1cm4gYW4gb2JqZWN0LiBSZWNlaXZlZDogJHtzZXR1cFJlc3VsdCA9PT0gbnVsbCA/IFwibnVsbFwiIDogdHlwZW9mIHNldHVwUmVzdWx0fWBcbiAgICApO1xuICB9XG4gIGZpbmlzaENvbXBvbmVudFNldHVwKGluc3RhbmNlLCBpc1NTUik7XG59XG5sZXQgY29tcGlsZTtcbmxldCBpbnN0YWxsV2l0aFByb3h5O1xuZnVuY3Rpb24gcmVnaXN0ZXJSdW50aW1lQ29tcGlsZXIoX2NvbXBpbGUpIHtcbiAgY29tcGlsZSA9IF9jb21waWxlO1xuICBpbnN0YWxsV2l0aFByb3h5ID0gKGkpID0+IHtcbiAgICBpZiAoaS5yZW5kZXIuX3JjKSB7XG4gICAgICBpLndpdGhQcm94eSA9IG5ldyBQcm94eShpLmN0eCwgUnVudGltZUNvbXBpbGVkUHVibGljSW5zdGFuY2VQcm94eUhhbmRsZXJzKTtcbiAgICB9XG4gIH07XG59XG5jb25zdCBpc1J1bnRpbWVPbmx5ID0gKCkgPT4gIWNvbXBpbGU7XG5mdW5jdGlvbiBmaW5pc2hDb21wb25lbnRTZXR1cChpbnN0YW5jZSwgaXNTU1IsIHNraXBPcHRpb25zKSB7XG4gIGNvbnN0IENvbXBvbmVudCA9IGluc3RhbmNlLnR5cGU7XG4gIGlmICghaW5zdGFuY2UucmVuZGVyKSB7XG4gICAgaWYgKCFpc1NTUiAmJiBjb21waWxlICYmICFDb21wb25lbnQucmVuZGVyKSB7XG4gICAgICBjb25zdCB0ZW1wbGF0ZSA9IENvbXBvbmVudC50ZW1wbGF0ZSB8fCBfX1ZVRV9PUFRJT05TX0FQSV9fICYmIHJlc29sdmVNZXJnZWRPcHRpb25zKGluc3RhbmNlKS50ZW1wbGF0ZTtcbiAgICAgIGlmICh0ZW1wbGF0ZSkge1xuICAgICAgICBpZiAoISEocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09IFwicHJvZHVjdGlvblwiKSkge1xuICAgICAgICAgIHN0YXJ0TWVhc3VyZShpbnN0YW5jZSwgYGNvbXBpbGVgKTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCB7IGlzQ3VzdG9tRWxlbWVudCwgY29tcGlsZXJPcHRpb25zIH0gPSBpbnN0YW5jZS5hcHBDb250ZXh0LmNvbmZpZztcbiAgICAgICAgY29uc3QgeyBkZWxpbWl0ZXJzLCBjb21waWxlck9wdGlvbnM6IGNvbXBvbmVudENvbXBpbGVyT3B0aW9ucyB9ID0gQ29tcG9uZW50O1xuICAgICAgICBjb25zdCBmaW5hbENvbXBpbGVyT3B0aW9ucyA9IGV4dGVuZChcbiAgICAgICAgICBleHRlbmQoXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIGlzQ3VzdG9tRWxlbWVudCxcbiAgICAgICAgICAgICAgZGVsaW1pdGVyc1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGNvbXBpbGVyT3B0aW9uc1xuICAgICAgICAgICksXG4gICAgICAgICAgY29tcG9uZW50Q29tcGlsZXJPcHRpb25zXG4gICAgICAgICk7XG4gICAgICAgIENvbXBvbmVudC5yZW5kZXIgPSBjb21waWxlKHRlbXBsYXRlLCBmaW5hbENvbXBpbGVyT3B0aW9ucyk7XG4gICAgICAgIGlmICghIShwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gXCJwcm9kdWN0aW9uXCIpKSB7XG4gICAgICAgICAgZW5kTWVhc3VyZShpbnN0YW5jZSwgYGNvbXBpbGVgKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICBpbnN0YW5jZS5yZW5kZXIgPSBDb21wb25lbnQucmVuZGVyIHx8IE5PT1A7XG4gICAgaWYgKGluc3RhbGxXaXRoUHJveHkpIHtcbiAgICAgIGluc3RhbGxXaXRoUHJveHkoaW5zdGFuY2UpO1xuICAgIH1cbiAgfVxuICBpZiAoX19WVUVfT1BUSU9OU19BUElfXyAmJiB0cnVlKSB7XG4gICAgY29uc3QgcmVzZXQgPSBzZXRDdXJyZW50SW5zdGFuY2UoaW5zdGFuY2UpO1xuICAgIHBhdXNlVHJhY2tpbmcoKTtcbiAgICB0cnkge1xuICAgICAgYXBwbHlPcHRpb25zKGluc3RhbmNlKTtcbiAgICB9IGZpbmFsbHkge1xuICAgICAgcmVzZXRUcmFja2luZygpO1xuICAgICAgcmVzZXQoKTtcbiAgICB9XG4gIH1cbiAgaWYgKCEhKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSBcInByb2R1Y3Rpb25cIikgJiYgIUNvbXBvbmVudC5yZW5kZXIgJiYgaW5zdGFuY2UucmVuZGVyID09PSBOT09QICYmICFpc1NTUikge1xuICAgIGlmICghY29tcGlsZSAmJiBDb21wb25lbnQudGVtcGxhdGUpIHtcbiAgICAgIHdhcm4kMShcbiAgICAgICAgYENvbXBvbmVudCBwcm92aWRlZCB0ZW1wbGF0ZSBvcHRpb24gYnV0IHJ1bnRpbWUgY29tcGlsYXRpb24gaXMgbm90IHN1cHBvcnRlZCBpbiB0aGlzIGJ1aWxkIG9mIFZ1ZS5gICsgKGAgQ29uZmlndXJlIHlvdXIgYnVuZGxlciB0byBhbGlhcyBcInZ1ZVwiIHRvIFwidnVlL2Rpc3QvdnVlLmVzbS1idW5kbGVyLmpzXCIuYCApXG4gICAgICApO1xuICAgIH0gZWxzZSB7XG4gICAgICB3YXJuJDEoYENvbXBvbmVudCBpcyBtaXNzaW5nIHRlbXBsYXRlIG9yIHJlbmRlciBmdW5jdGlvbjogYCwgQ29tcG9uZW50KTtcbiAgICB9XG4gIH1cbn1cbmNvbnN0IGF0dHJzUHJveHlIYW5kbGVycyA9ICEhKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSBcInByb2R1Y3Rpb25cIikgPyB7XG4gIGdldCh0YXJnZXQsIGtleSkge1xuICAgIG1hcmtBdHRyc0FjY2Vzc2VkKCk7XG4gICAgdHJhY2sodGFyZ2V0LCBcImdldFwiLCBcIlwiKTtcbiAgICByZXR1cm4gdGFyZ2V0W2tleV07XG4gIH0sXG4gIHNldCgpIHtcbiAgICB3YXJuJDEoYHNldHVwQ29udGV4dC5hdHRycyBpcyByZWFkb25seS5gKTtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH0sXG4gIGRlbGV0ZVByb3BlcnR5KCkge1xuICAgIHdhcm4kMShgc2V0dXBDb250ZXh0LmF0dHJzIGlzIHJlYWRvbmx5LmApO1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxufSA6IHtcbiAgZ2V0KHRhcmdldCwga2V5KSB7XG4gICAgdHJhY2sodGFyZ2V0LCBcImdldFwiLCBcIlwiKTtcbiAgICByZXR1cm4gdGFyZ2V0W2tleV07XG4gIH1cbn07XG5mdW5jdGlvbiBnZXRTbG90c1Byb3h5KGluc3RhbmNlKSB7XG4gIHJldHVybiBuZXcgUHJveHkoaW5zdGFuY2Uuc2xvdHMsIHtcbiAgICBnZXQodGFyZ2V0LCBrZXkpIHtcbiAgICAgIHRyYWNrKGluc3RhbmNlLCBcImdldFwiLCBcIiRzbG90c1wiKTtcbiAgICAgIHJldHVybiB0YXJnZXRba2V5XTtcbiAgICB9XG4gIH0pO1xufVxuZnVuY3Rpb24gY3JlYXRlU2V0dXBDb250ZXh0KGluc3RhbmNlKSB7XG4gIGNvbnN0IGV4cG9zZSA9IChleHBvc2VkKSA9PiB7XG4gICAgaWYgKCEhKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSBcInByb2R1Y3Rpb25cIikpIHtcbiAgICAgIGlmIChpbnN0YW5jZS5leHBvc2VkKSB7XG4gICAgICAgIHdhcm4kMShgZXhwb3NlKCkgc2hvdWxkIGJlIGNhbGxlZCBvbmx5IG9uY2UgcGVyIHNldHVwKCkuYCk7XG4gICAgICB9XG4gICAgICBpZiAoZXhwb3NlZCAhPSBudWxsKSB7XG4gICAgICAgIGxldCBleHBvc2VkVHlwZSA9IHR5cGVvZiBleHBvc2VkO1xuICAgICAgICBpZiAoZXhwb3NlZFR5cGUgPT09IFwib2JqZWN0XCIpIHtcbiAgICAgICAgICBpZiAoaXNBcnJheShleHBvc2VkKSkge1xuICAgICAgICAgICAgZXhwb3NlZFR5cGUgPSBcImFycmF5XCI7XG4gICAgICAgICAgfSBlbHNlIGlmIChpc1JlZihleHBvc2VkKSkge1xuICAgICAgICAgICAgZXhwb3NlZFR5cGUgPSBcInJlZlwiO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAoZXhwb3NlZFR5cGUgIT09IFwib2JqZWN0XCIpIHtcbiAgICAgICAgICB3YXJuJDEoXG4gICAgICAgICAgICBgZXhwb3NlKCkgc2hvdWxkIGJlIHBhc3NlZCBhIHBsYWluIG9iamVjdCwgcmVjZWl2ZWQgJHtleHBvc2VkVHlwZX0uYFxuICAgICAgICAgICk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgaW5zdGFuY2UuZXhwb3NlZCA9IGV4cG9zZWQgfHwge307XG4gIH07XG4gIGlmICghIShwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gXCJwcm9kdWN0aW9uXCIpKSB7XG4gICAgbGV0IGF0dHJzUHJveHk7XG4gICAgbGV0IHNsb3RzUHJveHk7XG4gICAgcmV0dXJuIE9iamVjdC5mcmVlemUoe1xuICAgICAgZ2V0IGF0dHJzKCkge1xuICAgICAgICByZXR1cm4gYXR0cnNQcm94eSB8fCAoYXR0cnNQcm94eSA9IG5ldyBQcm94eShpbnN0YW5jZS5hdHRycywgYXR0cnNQcm94eUhhbmRsZXJzKSk7XG4gICAgICB9LFxuICAgICAgZ2V0IHNsb3RzKCkge1xuICAgICAgICByZXR1cm4gc2xvdHNQcm94eSB8fCAoc2xvdHNQcm94eSA9IGdldFNsb3RzUHJveHkoaW5zdGFuY2UpKTtcbiAgICAgIH0sXG4gICAgICBnZXQgZW1pdCgpIHtcbiAgICAgICAgcmV0dXJuIChldmVudCwgLi4uYXJncykgPT4gaW5zdGFuY2UuZW1pdChldmVudCwgLi4uYXJncyk7XG4gICAgICB9LFxuICAgICAgZXhwb3NlXG4gICAgfSk7XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGF0dHJzOiBuZXcgUHJveHkoaW5zdGFuY2UuYXR0cnMsIGF0dHJzUHJveHlIYW5kbGVycyksXG4gICAgICBzbG90czogaW5zdGFuY2Uuc2xvdHMsXG4gICAgICBlbWl0OiBpbnN0YW5jZS5lbWl0LFxuICAgICAgZXhwb3NlXG4gICAgfTtcbiAgfVxufVxuZnVuY3Rpb24gZ2V0Q29tcG9uZW50UHVibGljSW5zdGFuY2UoaW5zdGFuY2UpIHtcbiAgaWYgKGluc3RhbmNlLmV4cG9zZWQpIHtcbiAgICByZXR1cm4gaW5zdGFuY2UuZXhwb3NlUHJveHkgfHwgKGluc3RhbmNlLmV4cG9zZVByb3h5ID0gbmV3IFByb3h5KHByb3h5UmVmcyhtYXJrUmF3KGluc3RhbmNlLmV4cG9zZWQpKSwge1xuICAgICAgZ2V0KHRhcmdldCwga2V5KSB7XG4gICAgICAgIGlmIChrZXkgaW4gdGFyZ2V0KSB7XG4gICAgICAgICAgcmV0dXJuIHRhcmdldFtrZXldO1xuICAgICAgICB9IGVsc2UgaWYgKGtleSBpbiBwdWJsaWNQcm9wZXJ0aWVzTWFwKSB7XG4gICAgICAgICAgcmV0dXJuIHB1YmxpY1Byb3BlcnRpZXNNYXBba2V5XShpbnN0YW5jZSk7XG4gICAgICAgIH1cbiAgICAgIH0sXG4gICAgICBoYXModGFyZ2V0LCBrZXkpIHtcbiAgICAgICAgcmV0dXJuIGtleSBpbiB0YXJnZXQgfHwga2V5IGluIHB1YmxpY1Byb3BlcnRpZXNNYXA7XG4gICAgICB9XG4gICAgfSkpO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiBpbnN0YW5jZS5wcm94eTtcbiAgfVxufVxuY29uc3QgY2xhc3NpZnlSRSA9IC8oPzpefFstX10pXFx3L2c7XG5jb25zdCBjbGFzc2lmeSA9IChzdHIpID0+IHN0ci5yZXBsYWNlKGNsYXNzaWZ5UkUsIChjKSA9PiBjLnRvVXBwZXJDYXNlKCkpLnJlcGxhY2UoL1stX10vZywgXCJcIik7XG5mdW5jdGlvbiBnZXRDb21wb25lbnROYW1lKENvbXBvbmVudCwgaW5jbHVkZUluZmVycmVkID0gdHJ1ZSkge1xuICByZXR1cm4gaXNGdW5jdGlvbihDb21wb25lbnQpID8gQ29tcG9uZW50LmRpc3BsYXlOYW1lIHx8IENvbXBvbmVudC5uYW1lIDogQ29tcG9uZW50Lm5hbWUgfHwgaW5jbHVkZUluZmVycmVkICYmIENvbXBvbmVudC5fX25hbWU7XG59XG5mdW5jdGlvbiBmb3JtYXRDb21wb25lbnROYW1lKGluc3RhbmNlLCBDb21wb25lbnQsIGlzUm9vdCA9IGZhbHNlKSB7XG4gIGxldCBuYW1lID0gZ2V0Q29tcG9uZW50TmFtZShDb21wb25lbnQpO1xuICBpZiAoIW5hbWUgJiYgQ29tcG9uZW50Ll9fZmlsZSkge1xuICAgIGNvbnN0IG1hdGNoID0gQ29tcG9uZW50Ll9fZmlsZS5tYXRjaCgvKFteL1xcXFxdKylcXC5cXHcrJC8pO1xuICAgIGlmIChtYXRjaCkge1xuICAgICAgbmFtZSA9IG1hdGNoWzFdO1xuICAgIH1cbiAgfVxuICBpZiAoIW5hbWUgJiYgaW5zdGFuY2UpIHtcbiAgICBjb25zdCBpbmZlckZyb21SZWdpc3RyeSA9IChyZWdpc3RyeSkgPT4ge1xuICAgICAgZm9yIChjb25zdCBrZXkgaW4gcmVnaXN0cnkpIHtcbiAgICAgICAgaWYgKHJlZ2lzdHJ5W2tleV0gPT09IENvbXBvbmVudCkge1xuICAgICAgICAgIHJldHVybiBrZXk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9O1xuICAgIG5hbWUgPSBpbmZlckZyb21SZWdpc3RyeShpbnN0YW5jZS5jb21wb25lbnRzKSB8fCBpbnN0YW5jZS5wYXJlbnQgJiYgaW5mZXJGcm9tUmVnaXN0cnkoXG4gICAgICBpbnN0YW5jZS5wYXJlbnQudHlwZS5jb21wb25lbnRzXG4gICAgKSB8fCBpbmZlckZyb21SZWdpc3RyeShpbnN0YW5jZS5hcHBDb250ZXh0LmNvbXBvbmVudHMpO1xuICB9XG4gIHJldHVybiBuYW1lID8gY2xhc3NpZnkobmFtZSkgOiBpc1Jvb3QgPyBgQXBwYCA6IGBBbm9ueW1vdXNgO1xufVxuZnVuY3Rpb24gaXNDbGFzc0NvbXBvbmVudCh2YWx1ZSkge1xuICByZXR1cm4gaXNGdW5jdGlvbih2YWx1ZSkgJiYgXCJfX3ZjY09wdHNcIiBpbiB2YWx1ZTtcbn1cblxuY29uc3QgY29tcHV0ZWQgPSAoZ2V0dGVyT3JPcHRpb25zLCBkZWJ1Z09wdGlvbnMpID0+IHtcbiAgY29uc3QgYyA9IGNvbXB1dGVkJDEoZ2V0dGVyT3JPcHRpb25zLCBkZWJ1Z09wdGlvbnMsIGlzSW5TU1JDb21wb25lbnRTZXR1cCk7XG4gIGlmICghIShwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gXCJwcm9kdWN0aW9uXCIpKSB7XG4gICAgY29uc3QgaSA9IGdldEN1cnJlbnRJbnN0YW5jZSgpO1xuICAgIGlmIChpICYmIGkuYXBwQ29udGV4dC5jb25maWcud2FyblJlY3Vyc2l2ZUNvbXB1dGVkKSB7XG4gICAgICBjLl93YXJuUmVjdXJzaXZlID0gdHJ1ZTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIGM7XG59O1xuXG5mdW5jdGlvbiBoKHR5cGUsIHByb3BzT3JDaGlsZHJlbiwgY2hpbGRyZW4pIHtcbiAgdHJ5IHtcbiAgICBzZXRCbG9ja1RyYWNraW5nKC0xKTtcbiAgICBjb25zdCBsID0gYXJndW1lbnRzLmxlbmd0aDtcbiAgICBpZiAobCA9PT0gMikge1xuICAgICAgaWYgKGlzT2JqZWN0KHByb3BzT3JDaGlsZHJlbikgJiYgIWlzQXJyYXkocHJvcHNPckNoaWxkcmVuKSkge1xuICAgICAgICBpZiAoaXNWTm9kZShwcm9wc09yQ2hpbGRyZW4pKSB7XG4gICAgICAgICAgcmV0dXJuIGNyZWF0ZVZOb2RlKHR5cGUsIG51bGwsIFtwcm9wc09yQ2hpbGRyZW5dKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gY3JlYXRlVk5vZGUodHlwZSwgcHJvcHNPckNoaWxkcmVuKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBjcmVhdGVWTm9kZSh0eXBlLCBudWxsLCBwcm9wc09yQ2hpbGRyZW4pO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBpZiAobCA+IDMpIHtcbiAgICAgICAgY2hpbGRyZW4gPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMsIDIpO1xuICAgICAgfSBlbHNlIGlmIChsID09PSAzICYmIGlzVk5vZGUoY2hpbGRyZW4pKSB7XG4gICAgICAgIGNoaWxkcmVuID0gW2NoaWxkcmVuXTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBjcmVhdGVWTm9kZSh0eXBlLCBwcm9wc09yQ2hpbGRyZW4sIGNoaWxkcmVuKTtcbiAgICB9XG4gIH0gZmluYWxseSB7XG4gICAgc2V0QmxvY2tUcmFja2luZygxKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBpbml0Q3VzdG9tRm9ybWF0dGVyKCkge1xuICBpZiAoISEhKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSBcInByb2R1Y3Rpb25cIikgfHwgdHlwZW9mIHdpbmRvdyA9PT0gXCJ1bmRlZmluZWRcIikge1xuICAgIHJldHVybjtcbiAgfVxuICBjb25zdCB2dWVTdHlsZSA9IHsgc3R5bGU6IFwiY29sb3I6IzNiYTc3NlwiIH07XG4gIGNvbnN0IG51bWJlclN0eWxlID0geyBzdHlsZTogXCJjb2xvcjojMTY3N2ZmXCIgfTtcbiAgY29uc3Qgc3RyaW5nU3R5bGUgPSB7IHN0eWxlOiBcImNvbG9yOiNmNTIyMmRcIiB9O1xuICBjb25zdCBrZXl3b3JkU3R5bGUgPSB7IHN0eWxlOiBcImNvbG9yOiNlYjJmOTZcIiB9O1xuICBjb25zdCBmb3JtYXR0ZXIgPSB7XG4gICAgX192dWVfY3VzdG9tX2Zvcm1hdHRlcjogdHJ1ZSxcbiAgICBoZWFkZXIob2JqKSB7XG4gICAgICBpZiAoIWlzT2JqZWN0KG9iaikpIHtcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICB9XG4gICAgICBpZiAob2JqLl9faXNWdWUpIHtcbiAgICAgICAgcmV0dXJuIFtcImRpdlwiLCB2dWVTdHlsZSwgYFZ1ZUluc3RhbmNlYF07XG4gICAgICB9IGVsc2UgaWYgKGlzUmVmKG9iaikpIHtcbiAgICAgICAgcGF1c2VUcmFja2luZygpO1xuICAgICAgICBjb25zdCB2YWx1ZSA9IG9iai52YWx1ZTtcbiAgICAgICAgcmVzZXRUcmFja2luZygpO1xuICAgICAgICByZXR1cm4gW1xuICAgICAgICAgIFwiZGl2XCIsXG4gICAgICAgICAge30sXG4gICAgICAgICAgW1wic3BhblwiLCB2dWVTdHlsZSwgZ2VuUmVmRmxhZyhvYmopXSxcbiAgICAgICAgICBcIjxcIixcbiAgICAgICAgICBmb3JtYXRWYWx1ZSh2YWx1ZSksXG4gICAgICAgICAgYD5gXG4gICAgICAgIF07XG4gICAgICB9IGVsc2UgaWYgKGlzUmVhY3RpdmUob2JqKSkge1xuICAgICAgICByZXR1cm4gW1xuICAgICAgICAgIFwiZGl2XCIsXG4gICAgICAgICAge30sXG4gICAgICAgICAgW1wic3BhblwiLCB2dWVTdHlsZSwgaXNTaGFsbG93KG9iaikgPyBcIlNoYWxsb3dSZWFjdGl2ZVwiIDogXCJSZWFjdGl2ZVwiXSxcbiAgICAgICAgICBcIjxcIixcbiAgICAgICAgICBmb3JtYXRWYWx1ZShvYmopLFxuICAgICAgICAgIGA+JHtpc1JlYWRvbmx5KG9iaikgPyBgIChyZWFkb25seSlgIDogYGB9YFxuICAgICAgICBdO1xuICAgICAgfSBlbHNlIGlmIChpc1JlYWRvbmx5KG9iaikpIHtcbiAgICAgICAgcmV0dXJuIFtcbiAgICAgICAgICBcImRpdlwiLFxuICAgICAgICAgIHt9LFxuICAgICAgICAgIFtcInNwYW5cIiwgdnVlU3R5bGUsIGlzU2hhbGxvdyhvYmopID8gXCJTaGFsbG93UmVhZG9ubHlcIiA6IFwiUmVhZG9ubHlcIl0sXG4gICAgICAgICAgXCI8XCIsXG4gICAgICAgICAgZm9ybWF0VmFsdWUob2JqKSxcbiAgICAgICAgICBcIj5cIlxuICAgICAgICBdO1xuICAgICAgfVxuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfSxcbiAgICBoYXNCb2R5KG9iaikge1xuICAgICAgcmV0dXJuIG9iaiAmJiBvYmouX19pc1Z1ZTtcbiAgICB9LFxuICAgIGJvZHkob2JqKSB7XG4gICAgICBpZiAob2JqICYmIG9iai5fX2lzVnVlKSB7XG4gICAgICAgIHJldHVybiBbXG4gICAgICAgICAgXCJkaXZcIixcbiAgICAgICAgICB7fSxcbiAgICAgICAgICAuLi5mb3JtYXRJbnN0YW5jZShvYmouJClcbiAgICAgICAgXTtcbiAgICAgIH1cbiAgICB9XG4gIH07XG4gIGZ1bmN0aW9uIGZvcm1hdEluc3RhbmNlKGluc3RhbmNlKSB7XG4gICAgY29uc3QgYmxvY2tzID0gW107XG4gICAgaWYgKGluc3RhbmNlLnR5cGUucHJvcHMgJiYgaW5zdGFuY2UucHJvcHMpIHtcbiAgICAgIGJsb2Nrcy5wdXNoKGNyZWF0ZUluc3RhbmNlQmxvY2soXCJwcm9wc1wiLCB0b1JhdyhpbnN0YW5jZS5wcm9wcykpKTtcbiAgICB9XG4gICAgaWYgKGluc3RhbmNlLnNldHVwU3RhdGUgIT09IEVNUFRZX09CSikge1xuICAgICAgYmxvY2tzLnB1c2goY3JlYXRlSW5zdGFuY2VCbG9jayhcInNldHVwXCIsIGluc3RhbmNlLnNldHVwU3RhdGUpKTtcbiAgICB9XG4gICAgaWYgKGluc3RhbmNlLmRhdGEgIT09IEVNUFRZX09CSikge1xuICAgICAgYmxvY2tzLnB1c2goY3JlYXRlSW5zdGFuY2VCbG9jayhcImRhdGFcIiwgdG9SYXcoaW5zdGFuY2UuZGF0YSkpKTtcbiAgICB9XG4gICAgY29uc3QgY29tcHV0ZWQgPSBleHRyYWN0S2V5cyhpbnN0YW5jZSwgXCJjb21wdXRlZFwiKTtcbiAgICBpZiAoY29tcHV0ZWQpIHtcbiAgICAgIGJsb2Nrcy5wdXNoKGNyZWF0ZUluc3RhbmNlQmxvY2soXCJjb21wdXRlZFwiLCBjb21wdXRlZCkpO1xuICAgIH1cbiAgICBjb25zdCBpbmplY3RlZCA9IGV4dHJhY3RLZXlzKGluc3RhbmNlLCBcImluamVjdFwiKTtcbiAgICBpZiAoaW5qZWN0ZWQpIHtcbiAgICAgIGJsb2Nrcy5wdXNoKGNyZWF0ZUluc3RhbmNlQmxvY2soXCJpbmplY3RlZFwiLCBpbmplY3RlZCkpO1xuICAgIH1cbiAgICBibG9ja3MucHVzaChbXG4gICAgICBcImRpdlwiLFxuICAgICAge30sXG4gICAgICBbXG4gICAgICAgIFwic3BhblwiLFxuICAgICAgICB7XG4gICAgICAgICAgc3R5bGU6IGtleXdvcmRTdHlsZS5zdHlsZSArIFwiO29wYWNpdHk6MC42NlwiXG4gICAgICAgIH0sXG4gICAgICAgIFwiJCAoaW50ZXJuYWwpOiBcIlxuICAgICAgXSxcbiAgICAgIFtcIm9iamVjdFwiLCB7IG9iamVjdDogaW5zdGFuY2UgfV1cbiAgICBdKTtcbiAgICByZXR1cm4gYmxvY2tzO1xuICB9XG4gIGZ1bmN0aW9uIGNyZWF0ZUluc3RhbmNlQmxvY2sodHlwZSwgdGFyZ2V0KSB7XG4gICAgdGFyZ2V0ID0gZXh0ZW5kKHt9LCB0YXJnZXQpO1xuICAgIGlmICghT2JqZWN0LmtleXModGFyZ2V0KS5sZW5ndGgpIHtcbiAgICAgIHJldHVybiBbXCJzcGFuXCIsIHt9XTtcbiAgICB9XG4gICAgcmV0dXJuIFtcbiAgICAgIFwiZGl2XCIsXG4gICAgICB7IHN0eWxlOiBcImxpbmUtaGVpZ2h0OjEuMjVlbTttYXJnaW4tYm90dG9tOjAuNmVtXCIgfSxcbiAgICAgIFtcbiAgICAgICAgXCJkaXZcIixcbiAgICAgICAge1xuICAgICAgICAgIHN0eWxlOiBcImNvbG9yOiM0NzY1ODJcIlxuICAgICAgICB9LFxuICAgICAgICB0eXBlXG4gICAgICBdLFxuICAgICAgW1xuICAgICAgICBcImRpdlwiLFxuICAgICAgICB7XG4gICAgICAgICAgc3R5bGU6IFwicGFkZGluZy1sZWZ0OjEuMjVlbVwiXG4gICAgICAgIH0sXG4gICAgICAgIC4uLk9iamVjdC5rZXlzKHRhcmdldCkubWFwKChrZXkpID0+IHtcbiAgICAgICAgICByZXR1cm4gW1xuICAgICAgICAgICAgXCJkaXZcIixcbiAgICAgICAgICAgIHt9LFxuICAgICAgICAgICAgW1wic3BhblwiLCBrZXl3b3JkU3R5bGUsIGtleSArIFwiOiBcIl0sXG4gICAgICAgICAgICBmb3JtYXRWYWx1ZSh0YXJnZXRba2V5XSwgZmFsc2UpXG4gICAgICAgICAgXTtcbiAgICAgICAgfSlcbiAgICAgIF1cbiAgICBdO1xuICB9XG4gIGZ1bmN0aW9uIGZvcm1hdFZhbHVlKHYsIGFzUmF3ID0gdHJ1ZSkge1xuICAgIGlmICh0eXBlb2YgdiA9PT0gXCJudW1iZXJcIikge1xuICAgICAgcmV0dXJuIFtcInNwYW5cIiwgbnVtYmVyU3R5bGUsIHZdO1xuICAgIH0gZWxzZSBpZiAodHlwZW9mIHYgPT09IFwic3RyaW5nXCIpIHtcbiAgICAgIHJldHVybiBbXCJzcGFuXCIsIHN0cmluZ1N0eWxlLCBKU09OLnN0cmluZ2lmeSh2KV07XG4gICAgfSBlbHNlIGlmICh0eXBlb2YgdiA9PT0gXCJib29sZWFuXCIpIHtcbiAgICAgIHJldHVybiBbXCJzcGFuXCIsIGtleXdvcmRTdHlsZSwgdl07XG4gICAgfSBlbHNlIGlmIChpc09iamVjdCh2KSkge1xuICAgICAgcmV0dXJuIFtcIm9iamVjdFwiLCB7IG9iamVjdDogYXNSYXcgPyB0b1Jhdyh2KSA6IHYgfV07XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBbXCJzcGFuXCIsIHN0cmluZ1N0eWxlLCBTdHJpbmcodildO1xuICAgIH1cbiAgfVxuICBmdW5jdGlvbiBleHRyYWN0S2V5cyhpbnN0YW5jZSwgdHlwZSkge1xuICAgIGNvbnN0IENvbXAgPSBpbnN0YW5jZS50eXBlO1xuICAgIGlmIChpc0Z1bmN0aW9uKENvbXApKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGNvbnN0IGV4dHJhY3RlZCA9IHt9O1xuICAgIGZvciAoY29uc3Qga2V5IGluIGluc3RhbmNlLmN0eCkge1xuICAgICAgaWYgKGlzS2V5T2ZUeXBlKENvbXAsIGtleSwgdHlwZSkpIHtcbiAgICAgICAgZXh0cmFjdGVkW2tleV0gPSBpbnN0YW5jZS5jdHhba2V5XTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGV4dHJhY3RlZDtcbiAgfVxuICBmdW5jdGlvbiBpc0tleU9mVHlwZShDb21wLCBrZXksIHR5cGUpIHtcbiAgICBjb25zdCBvcHRzID0gQ29tcFt0eXBlXTtcbiAgICBpZiAoaXNBcnJheShvcHRzKSAmJiBvcHRzLmluY2x1ZGVzKGtleSkgfHwgaXNPYmplY3Qob3B0cykgJiYga2V5IGluIG9wdHMpIHtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICBpZiAoQ29tcC5leHRlbmRzICYmIGlzS2V5T2ZUeXBlKENvbXAuZXh0ZW5kcywga2V5LCB0eXBlKSkge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICAgIGlmIChDb21wLm1peGlucyAmJiBDb21wLm1peGlucy5zb21lKChtKSA9PiBpc0tleU9mVHlwZShtLCBrZXksIHR5cGUpKSkge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICB9XG4gIGZ1bmN0aW9uIGdlblJlZkZsYWcodikge1xuICAgIGlmIChpc1NoYWxsb3codikpIHtcbiAgICAgIHJldHVybiBgU2hhbGxvd1JlZmA7XG4gICAgfVxuICAgIGlmICh2LmVmZmVjdCkge1xuICAgICAgcmV0dXJuIGBDb21wdXRlZFJlZmA7XG4gICAgfVxuICAgIHJldHVybiBgUmVmYDtcbiAgfVxuICBpZiAod2luZG93LmRldnRvb2xzRm9ybWF0dGVycykge1xuICAgIHdpbmRvdy5kZXZ0b29sc0Zvcm1hdHRlcnMucHVzaChmb3JtYXR0ZXIpO1xuICB9IGVsc2Uge1xuICAgIHdpbmRvdy5kZXZ0b29sc0Zvcm1hdHRlcnMgPSBbZm9ybWF0dGVyXTtcbiAgfVxufVxuXG5mdW5jdGlvbiB3aXRoTWVtbyhtZW1vLCByZW5kZXIsIGNhY2hlLCBpbmRleCkge1xuICBjb25zdCBjYWNoZWQgPSBjYWNoZVtpbmRleF07XG4gIGlmIChjYWNoZWQgJiYgaXNNZW1vU2FtZShjYWNoZWQsIG1lbW8pKSB7XG4gICAgcmV0dXJuIGNhY2hlZDtcbiAgfVxuICBjb25zdCByZXQgPSByZW5kZXIoKTtcbiAgcmV0Lm1lbW8gPSBtZW1vLnNsaWNlKCk7XG4gIHJldC5jYWNoZUluZGV4ID0gaW5kZXg7XG4gIHJldHVybiBjYWNoZVtpbmRleF0gPSByZXQ7XG59XG5mdW5jdGlvbiBpc01lbW9TYW1lKGNhY2hlZCwgbWVtbykge1xuICBjb25zdCBwcmV2ID0gY2FjaGVkLm1lbW87XG4gIGlmIChwcmV2Lmxlbmd0aCAhPSBtZW1vLmxlbmd0aCkge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuICBmb3IgKGxldCBpID0gMDsgaSA8IHByZXYubGVuZ3RoOyBpKyspIHtcbiAgICBpZiAoaGFzQ2hhbmdlZChwcmV2W2ldLCBtZW1vW2ldKSkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgfVxuICBpZiAoaXNCbG9ja1RyZWVFbmFibGVkID4gMCAmJiBjdXJyZW50QmxvY2spIHtcbiAgICBjdXJyZW50QmxvY2sucHVzaChjYWNoZWQpO1xuICB9XG4gIHJldHVybiB0cnVlO1xufVxuXG5jb25zdCB2ZXJzaW9uID0gXCIzLjUuMjhcIjtcbmNvbnN0IHdhcm4gPSAhIShwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gXCJwcm9kdWN0aW9uXCIpID8gd2FybiQxIDogTk9PUDtcbmNvbnN0IEVycm9yVHlwZVN0cmluZ3MgPSBFcnJvclR5cGVTdHJpbmdzJDEgO1xuY29uc3QgZGV2dG9vbHMgPSAhIShwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gXCJwcm9kdWN0aW9uXCIpIHx8IHRydWUgPyBkZXZ0b29scyQxIDogdm9pZCAwO1xuY29uc3Qgc2V0RGV2dG9vbHNIb29rID0gISEocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09IFwicHJvZHVjdGlvblwiKSB8fCB0cnVlID8gc2V0RGV2dG9vbHNIb29rJDEgOiBOT09QO1xuY29uc3QgX3NzclV0aWxzID0ge1xuICBjcmVhdGVDb21wb25lbnRJbnN0YW5jZSxcbiAgc2V0dXBDb21wb25lbnQsXG4gIHJlbmRlckNvbXBvbmVudFJvb3QsXG4gIHNldEN1cnJlbnRSZW5kZXJpbmdJbnN0YW5jZSxcbiAgaXNWTm9kZTogaXNWTm9kZSxcbiAgbm9ybWFsaXplVk5vZGUsXG4gIGdldENvbXBvbmVudFB1YmxpY0luc3RhbmNlLFxuICBlbnN1cmVWYWxpZFZOb2RlLFxuICBwdXNoV2FybmluZ0NvbnRleHQsXG4gIHBvcFdhcm5pbmdDb250ZXh0XG59O1xuY29uc3Qgc3NyVXRpbHMgPSBfc3NyVXRpbHMgO1xuY29uc3QgcmVzb2x2ZUZpbHRlciA9IG51bGw7XG5jb25zdCBjb21wYXRVdGlscyA9IG51bGw7XG5jb25zdCBEZXByZWNhdGlvblR5cGVzID0gbnVsbDtcblxuZXhwb3J0IHsgQmFzZVRyYW5zaXRpb24sIEJhc2VUcmFuc2l0aW9uUHJvcHNWYWxpZGF0b3JzLCBDb21tZW50LCBEZXByZWNhdGlvblR5cGVzLCBFcnJvckNvZGVzLCBFcnJvclR5cGVTdHJpbmdzLCBGcmFnbWVudCwgS2VlcEFsaXZlLCBTdGF0aWMsIFN1c3BlbnNlLCBUZWxlcG9ydCwgVGV4dCwgYXNzZXJ0TnVtYmVyLCBjYWxsV2l0aEFzeW5jRXJyb3JIYW5kbGluZywgY2FsbFdpdGhFcnJvckhhbmRsaW5nLCBjbG9uZVZOb2RlLCBjb21wYXRVdGlscywgY29tcHV0ZWQsIGNyZWF0ZUJsb2NrLCBjcmVhdGVDb21tZW50Vk5vZGUsIGNyZWF0ZUVsZW1lbnRCbG9jaywgY3JlYXRlQmFzZVZOb2RlIGFzIGNyZWF0ZUVsZW1lbnRWTm9kZSwgY3JlYXRlSHlkcmF0aW9uUmVuZGVyZXIsIGNyZWF0ZVByb3BzUmVzdFByb3h5LCBjcmVhdGVSZW5kZXJlciwgY3JlYXRlU2xvdHMsIGNyZWF0ZVN0YXRpY1ZOb2RlLCBjcmVhdGVUZXh0Vk5vZGUsIGNyZWF0ZVZOb2RlLCBkZWZpbmVBc3luY0NvbXBvbmVudCwgZGVmaW5lQ29tcG9uZW50LCBkZWZpbmVFbWl0cywgZGVmaW5lRXhwb3NlLCBkZWZpbmVNb2RlbCwgZGVmaW5lT3B0aW9ucywgZGVmaW5lUHJvcHMsIGRlZmluZVNsb3RzLCBkZXZ0b29scywgZ2V0Q3VycmVudEluc3RhbmNlLCBnZXRUcmFuc2l0aW9uUmF3Q2hpbGRyZW4sIGd1YXJkUmVhY3RpdmVQcm9wcywgaCwgaGFuZGxlRXJyb3IsIGhhc0luamVjdGlvbkNvbnRleHQsIGh5ZHJhdGVPbklkbGUsIGh5ZHJhdGVPbkludGVyYWN0aW9uLCBoeWRyYXRlT25NZWRpYVF1ZXJ5LCBoeWRyYXRlT25WaXNpYmxlLCBpbml0Q3VzdG9tRm9ybWF0dGVyLCBpbmplY3QsIGlzTWVtb1NhbWUsIGlzUnVudGltZU9ubHksIGlzVk5vZGUsIG1lcmdlRGVmYXVsdHMsIG1lcmdlTW9kZWxzLCBtZXJnZVByb3BzLCBuZXh0VGljaywgb25BY3RpdmF0ZWQsIG9uQmVmb3JlTW91bnQsIG9uQmVmb3JlVW5tb3VudCwgb25CZWZvcmVVcGRhdGUsIG9uRGVhY3RpdmF0ZWQsIG9uRXJyb3JDYXB0dXJlZCwgb25Nb3VudGVkLCBvblJlbmRlclRyYWNrZWQsIG9uUmVuZGVyVHJpZ2dlcmVkLCBvblNlcnZlclByZWZldGNoLCBvblVubW91bnRlZCwgb25VcGRhdGVkLCBvcGVuQmxvY2ssIHBvcFNjb3BlSWQsIHByb3ZpZGUsIHB1c2hTY29wZUlkLCBxdWV1ZVBvc3RGbHVzaENiLCByZWdpc3RlclJ1bnRpbWVDb21waWxlciwgcmVuZGVyTGlzdCwgcmVuZGVyU2xvdCwgcmVzb2x2ZUNvbXBvbmVudCwgcmVzb2x2ZURpcmVjdGl2ZSwgcmVzb2x2ZUR5bmFtaWNDb21wb25lbnQsIHJlc29sdmVGaWx0ZXIsIHJlc29sdmVUcmFuc2l0aW9uSG9va3MsIHNldEJsb2NrVHJhY2tpbmcsIHNldERldnRvb2xzSG9vaywgc2V0VHJhbnNpdGlvbkhvb2tzLCBzc3JDb250ZXh0S2V5LCBzc3JVdGlscywgdG9IYW5kbGVycywgdHJhbnNmb3JtVk5vZGVBcmdzLCB1c2VBdHRycywgdXNlSWQsIHVzZU1vZGVsLCB1c2VTU1JDb250ZXh0LCB1c2VTbG90cywgdXNlVGVtcGxhdGVSZWYsIHVzZVRyYW5zaXRpb25TdGF0ZSwgdmVyc2lvbiwgd2Fybiwgd2F0Y2gsIHdhdGNoRWZmZWN0LCB3YXRjaFBvc3RFZmZlY3QsIHdhdGNoU3luY0VmZmVjdCwgd2l0aEFzeW5jQ29udGV4dCwgd2l0aEN0eCwgd2l0aERlZmF1bHRzLCB3aXRoRGlyZWN0aXZlcywgd2l0aE1lbW8sIHdpdGhTY29wZUlkIH07XG4iLCIvKipcbiogQHZ1ZS9ydW50aW1lLWRvbSB2My41LjI4XG4qIChjKSAyMDE4LXByZXNlbnQgWXV4aSAoRXZhbikgWW91IGFuZCBWdWUgY29udHJpYnV0b3JzXG4qIEBsaWNlbnNlIE1JVFxuKiovXG5pbXBvcnQgeyB3YXJuLCBCYXNlVHJhbnNpdGlvblByb3BzVmFsaWRhdG9ycywgaCwgQmFzZVRyYW5zaXRpb24sIGFzc2VydE51bWJlciwgZ2V0Q3VycmVudEluc3RhbmNlLCBvbkJlZm9yZVVwZGF0ZSwgcXVldWVQb3N0Rmx1c2hDYiwgb25Nb3VudGVkLCB3YXRjaCwgb25Vbm1vdW50ZWQsIEZyYWdtZW50LCBTdGF0aWMsIGNhbWVsaXplLCBjYWxsV2l0aEFzeW5jRXJyb3JIYW5kbGluZywgbmV4dFRpY2ssIHVucmVmLCBjcmVhdGVWTm9kZSwgZGVmaW5lQ29tcG9uZW50LCB1c2VUcmFuc2l0aW9uU3RhdGUsIG9uVXBkYXRlZCwgdG9SYXcsIGdldFRyYW5zaXRpb25SYXdDaGlsZHJlbiwgc2V0VHJhbnNpdGlvbkhvb2tzLCByZXNvbHZlVHJhbnNpdGlvbkhvb2tzLCBUZXh0LCBjcmVhdGVSZW5kZXJlciwgaXNSdW50aW1lT25seSwgY3JlYXRlSHlkcmF0aW9uUmVuZGVyZXIgfSBmcm9tICdAdnVlL3J1bnRpbWUtY29yZSc7XG5leHBvcnQgKiBmcm9tICdAdnVlL3J1bnRpbWUtY29yZSc7XG5pbXBvcnQgeyBleHRlbmQsIGlzT2JqZWN0LCB0b051bWJlciwgaXNBcnJheSwgTk9PUCwgbm9ybWFsaXplQ3NzVmFyVmFsdWUsIGlzU3RyaW5nLCBoeXBoZW5hdGUsIGNhcGl0YWxpemUsIGluY2x1ZGVCb29sZWFuQXR0ciwgaXNTeW1ib2wsIGlzU3BlY2lhbEJvb2xlYW5BdHRyLCBpc0Z1bmN0aW9uLCBpc09uLCBpc01vZGVsTGlzdGVuZXIsIGNhbWVsaXplIGFzIGNhbWVsaXplJDEsIGhhc093biwgaXNQbGFpbk9iamVjdCwgRU1QVFlfT0JKLCBsb29zZUluZGV4T2YsIGlzU2V0LCBsb29zZUVxdWFsLCBsb29zZVRvTnVtYmVyLCBpbnZva2VBcnJheUZucywgaXNIVE1MVGFnLCBpc1NWR1RhZywgaXNNYXRoTUxUYWcgfSBmcm9tICdAdnVlL3NoYXJlZCc7XG5cbmxldCBwb2xpY3kgPSB2b2lkIDA7XG5jb25zdCB0dCA9IHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgJiYgd2luZG93LnRydXN0ZWRUeXBlcztcbmlmICh0dCkge1xuICB0cnkge1xuICAgIHBvbGljeSA9IC8qIEBfX1BVUkVfXyAqLyB0dC5jcmVhdGVQb2xpY3koXCJ2dWVcIiwge1xuICAgICAgY3JlYXRlSFRNTDogKHZhbCkgPT4gdmFsXG4gICAgfSk7XG4gIH0gY2F0Y2ggKGUpIHtcbiAgICAhIShwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gXCJwcm9kdWN0aW9uXCIpICYmIHdhcm4oYEVycm9yIGNyZWF0aW5nIHRydXN0ZWQgdHlwZXMgcG9saWN5OiAke2V9YCk7XG4gIH1cbn1cbmNvbnN0IHVuc2FmZVRvVHJ1c3RlZEhUTUwgPSBwb2xpY3kgPyAodmFsKSA9PiBwb2xpY3kuY3JlYXRlSFRNTCh2YWwpIDogKHZhbCkgPT4gdmFsO1xuY29uc3Qgc3ZnTlMgPSBcImh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnXCI7XG5jb25zdCBtYXRobWxOUyA9IFwiaHR0cDovL3d3dy53My5vcmcvMTk5OC9NYXRoL01hdGhNTFwiO1xuY29uc3QgZG9jID0gdHlwZW9mIGRvY3VtZW50ICE9PSBcInVuZGVmaW5lZFwiID8gZG9jdW1lbnQgOiBudWxsO1xuY29uc3QgdGVtcGxhdGVDb250YWluZXIgPSBkb2MgJiYgLyogQF9fUFVSRV9fICovIGRvYy5jcmVhdGVFbGVtZW50KFwidGVtcGxhdGVcIik7XG5jb25zdCBub2RlT3BzID0ge1xuICBpbnNlcnQ6IChjaGlsZCwgcGFyZW50LCBhbmNob3IpID0+IHtcbiAgICBwYXJlbnQuaW5zZXJ0QmVmb3JlKGNoaWxkLCBhbmNob3IgfHwgbnVsbCk7XG4gIH0sXG4gIHJlbW92ZTogKGNoaWxkKSA9PiB7XG4gICAgY29uc3QgcGFyZW50ID0gY2hpbGQucGFyZW50Tm9kZTtcbiAgICBpZiAocGFyZW50KSB7XG4gICAgICBwYXJlbnQucmVtb3ZlQ2hpbGQoY2hpbGQpO1xuICAgIH1cbiAgfSxcbiAgY3JlYXRlRWxlbWVudDogKHRhZywgbmFtZXNwYWNlLCBpcywgcHJvcHMpID0+IHtcbiAgICBjb25zdCBlbCA9IG5hbWVzcGFjZSA9PT0gXCJzdmdcIiA/IGRvYy5jcmVhdGVFbGVtZW50TlMoc3ZnTlMsIHRhZykgOiBuYW1lc3BhY2UgPT09IFwibWF0aG1sXCIgPyBkb2MuY3JlYXRlRWxlbWVudE5TKG1hdGhtbE5TLCB0YWcpIDogaXMgPyBkb2MuY3JlYXRlRWxlbWVudCh0YWcsIHsgaXMgfSkgOiBkb2MuY3JlYXRlRWxlbWVudCh0YWcpO1xuICAgIGlmICh0YWcgPT09IFwic2VsZWN0XCIgJiYgcHJvcHMgJiYgcHJvcHMubXVsdGlwbGUgIT0gbnVsbCkge1xuICAgICAgZWwuc2V0QXR0cmlidXRlKFwibXVsdGlwbGVcIiwgcHJvcHMubXVsdGlwbGUpO1xuICAgIH1cbiAgICByZXR1cm4gZWw7XG4gIH0sXG4gIGNyZWF0ZVRleHQ6ICh0ZXh0KSA9PiBkb2MuY3JlYXRlVGV4dE5vZGUodGV4dCksXG4gIGNyZWF0ZUNvbW1lbnQ6ICh0ZXh0KSA9PiBkb2MuY3JlYXRlQ29tbWVudCh0ZXh0KSxcbiAgc2V0VGV4dDogKG5vZGUsIHRleHQpID0+IHtcbiAgICBub2RlLm5vZGVWYWx1ZSA9IHRleHQ7XG4gIH0sXG4gIHNldEVsZW1lbnRUZXh0OiAoZWwsIHRleHQpID0+IHtcbiAgICBlbC50ZXh0Q29udGVudCA9IHRleHQ7XG4gIH0sXG4gIHBhcmVudE5vZGU6IChub2RlKSA9PiBub2RlLnBhcmVudE5vZGUsXG4gIG5leHRTaWJsaW5nOiAobm9kZSkgPT4gbm9kZS5uZXh0U2libGluZyxcbiAgcXVlcnlTZWxlY3RvcjogKHNlbGVjdG9yKSA9PiBkb2MucXVlcnlTZWxlY3RvcihzZWxlY3RvciksXG4gIHNldFNjb3BlSWQoZWwsIGlkKSB7XG4gICAgZWwuc2V0QXR0cmlidXRlKGlkLCBcIlwiKTtcbiAgfSxcbiAgLy8gX19VTlNBRkVfX1xuICAvLyBSZWFzb246IGlubmVySFRNTC5cbiAgLy8gU3RhdGljIGNvbnRlbnQgaGVyZSBjYW4gb25seSBjb21lIGZyb20gY29tcGlsZWQgdGVtcGxhdGVzLlxuICAvLyBBcyBsb25nIGFzIHRoZSB1c2VyIG9ubHkgdXNlcyB0cnVzdGVkIHRlbXBsYXRlcywgdGhpcyBpcyBzYWZlLlxuICBpbnNlcnRTdGF0aWNDb250ZW50KGNvbnRlbnQsIHBhcmVudCwgYW5jaG9yLCBuYW1lc3BhY2UsIHN0YXJ0LCBlbmQpIHtcbiAgICBjb25zdCBiZWZvcmUgPSBhbmNob3IgPyBhbmNob3IucHJldmlvdXNTaWJsaW5nIDogcGFyZW50Lmxhc3RDaGlsZDtcbiAgICBpZiAoc3RhcnQgJiYgKHN0YXJ0ID09PSBlbmQgfHwgc3RhcnQubmV4dFNpYmxpbmcpKSB7XG4gICAgICB3aGlsZSAodHJ1ZSkge1xuICAgICAgICBwYXJlbnQuaW5zZXJ0QmVmb3JlKHN0YXJ0LmNsb25lTm9kZSh0cnVlKSwgYW5jaG9yKTtcbiAgICAgICAgaWYgKHN0YXJ0ID09PSBlbmQgfHwgIShzdGFydCA9IHN0YXJ0Lm5leHRTaWJsaW5nKSkgYnJlYWs7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHRlbXBsYXRlQ29udGFpbmVyLmlubmVySFRNTCA9IHVuc2FmZVRvVHJ1c3RlZEhUTUwoXG4gICAgICAgIG5hbWVzcGFjZSA9PT0gXCJzdmdcIiA/IGA8c3ZnPiR7Y29udGVudH08L3N2Zz5gIDogbmFtZXNwYWNlID09PSBcIm1hdGhtbFwiID8gYDxtYXRoPiR7Y29udGVudH08L21hdGg+YCA6IGNvbnRlbnRcbiAgICAgICk7XG4gICAgICBjb25zdCB0ZW1wbGF0ZSA9IHRlbXBsYXRlQ29udGFpbmVyLmNvbnRlbnQ7XG4gICAgICBpZiAobmFtZXNwYWNlID09PSBcInN2Z1wiIHx8IG5hbWVzcGFjZSA9PT0gXCJtYXRobWxcIikge1xuICAgICAgICBjb25zdCB3cmFwcGVyID0gdGVtcGxhdGUuZmlyc3RDaGlsZDtcbiAgICAgICAgd2hpbGUgKHdyYXBwZXIuZmlyc3RDaGlsZCkge1xuICAgICAgICAgIHRlbXBsYXRlLmFwcGVuZENoaWxkKHdyYXBwZXIuZmlyc3RDaGlsZCk7XG4gICAgICAgIH1cbiAgICAgICAgdGVtcGxhdGUucmVtb3ZlQ2hpbGQod3JhcHBlcik7XG4gICAgICB9XG4gICAgICBwYXJlbnQuaW5zZXJ0QmVmb3JlKHRlbXBsYXRlLCBhbmNob3IpO1xuICAgIH1cbiAgICByZXR1cm4gW1xuICAgICAgLy8gZmlyc3RcbiAgICAgIGJlZm9yZSA/IGJlZm9yZS5uZXh0U2libGluZyA6IHBhcmVudC5maXJzdENoaWxkLFxuICAgICAgLy8gbGFzdFxuICAgICAgYW5jaG9yID8gYW5jaG9yLnByZXZpb3VzU2libGluZyA6IHBhcmVudC5sYXN0Q2hpbGRcbiAgICBdO1xuICB9XG59O1xuXG5jb25zdCBUUkFOU0lUSU9OID0gXCJ0cmFuc2l0aW9uXCI7XG5jb25zdCBBTklNQVRJT04gPSBcImFuaW1hdGlvblwiO1xuY29uc3QgdnRjS2V5ID0gLyogQF9fUFVSRV9fICovIFN5bWJvbChcIl92dGNcIik7XG5jb25zdCBET01UcmFuc2l0aW9uUHJvcHNWYWxpZGF0b3JzID0ge1xuICBuYW1lOiBTdHJpbmcsXG4gIHR5cGU6IFN0cmluZyxcbiAgY3NzOiB7XG4gICAgdHlwZTogQm9vbGVhbixcbiAgICBkZWZhdWx0OiB0cnVlXG4gIH0sXG4gIGR1cmF0aW9uOiBbU3RyaW5nLCBOdW1iZXIsIE9iamVjdF0sXG4gIGVudGVyRnJvbUNsYXNzOiBTdHJpbmcsXG4gIGVudGVyQWN0aXZlQ2xhc3M6IFN0cmluZyxcbiAgZW50ZXJUb0NsYXNzOiBTdHJpbmcsXG4gIGFwcGVhckZyb21DbGFzczogU3RyaW5nLFxuICBhcHBlYXJBY3RpdmVDbGFzczogU3RyaW5nLFxuICBhcHBlYXJUb0NsYXNzOiBTdHJpbmcsXG4gIGxlYXZlRnJvbUNsYXNzOiBTdHJpbmcsXG4gIGxlYXZlQWN0aXZlQ2xhc3M6IFN0cmluZyxcbiAgbGVhdmVUb0NsYXNzOiBTdHJpbmdcbn07XG5jb25zdCBUcmFuc2l0aW9uUHJvcHNWYWxpZGF0b3JzID0gLyogQF9fUFVSRV9fICovIGV4dGVuZChcbiAge30sXG4gIEJhc2VUcmFuc2l0aW9uUHJvcHNWYWxpZGF0b3JzLFxuICBET01UcmFuc2l0aW9uUHJvcHNWYWxpZGF0b3JzXG4pO1xuY29uc3QgZGVjb3JhdGUkMSA9ICh0KSA9PiB7XG4gIHQuZGlzcGxheU5hbWUgPSBcIlRyYW5zaXRpb25cIjtcbiAgdC5wcm9wcyA9IFRyYW5zaXRpb25Qcm9wc1ZhbGlkYXRvcnM7XG4gIHJldHVybiB0O1xufTtcbmNvbnN0IFRyYW5zaXRpb24gPSAvKiBAX19QVVJFX18gKi8gZGVjb3JhdGUkMShcbiAgKHByb3BzLCB7IHNsb3RzIH0pID0+IGgoQmFzZVRyYW5zaXRpb24sIHJlc29sdmVUcmFuc2l0aW9uUHJvcHMocHJvcHMpLCBzbG90cylcbik7XG5jb25zdCBjYWxsSG9vayA9IChob29rLCBhcmdzID0gW10pID0+IHtcbiAgaWYgKGlzQXJyYXkoaG9vaykpIHtcbiAgICBob29rLmZvckVhY2goKGgyKSA9PiBoMiguLi5hcmdzKSk7XG4gIH0gZWxzZSBpZiAoaG9vaykge1xuICAgIGhvb2soLi4uYXJncyk7XG4gIH1cbn07XG5jb25zdCBoYXNFeHBsaWNpdENhbGxiYWNrID0gKGhvb2spID0+IHtcbiAgcmV0dXJuIGhvb2sgPyBpc0FycmF5KGhvb2spID8gaG9vay5zb21lKChoMikgPT4gaDIubGVuZ3RoID4gMSkgOiBob29rLmxlbmd0aCA+IDEgOiBmYWxzZTtcbn07XG5mdW5jdGlvbiByZXNvbHZlVHJhbnNpdGlvblByb3BzKHJhd1Byb3BzKSB7XG4gIGNvbnN0IGJhc2VQcm9wcyA9IHt9O1xuICBmb3IgKGNvbnN0IGtleSBpbiByYXdQcm9wcykge1xuICAgIGlmICghKGtleSBpbiBET01UcmFuc2l0aW9uUHJvcHNWYWxpZGF0b3JzKSkge1xuICAgICAgYmFzZVByb3BzW2tleV0gPSByYXdQcm9wc1trZXldO1xuICAgIH1cbiAgfVxuICBpZiAocmF3UHJvcHMuY3NzID09PSBmYWxzZSkge1xuICAgIHJldHVybiBiYXNlUHJvcHM7XG4gIH1cbiAgY29uc3Qge1xuICAgIG5hbWUgPSBcInZcIixcbiAgICB0eXBlLFxuICAgIGR1cmF0aW9uLFxuICAgIGVudGVyRnJvbUNsYXNzID0gYCR7bmFtZX0tZW50ZXItZnJvbWAsXG4gICAgZW50ZXJBY3RpdmVDbGFzcyA9IGAke25hbWV9LWVudGVyLWFjdGl2ZWAsXG4gICAgZW50ZXJUb0NsYXNzID0gYCR7bmFtZX0tZW50ZXItdG9gLFxuICAgIGFwcGVhckZyb21DbGFzcyA9IGVudGVyRnJvbUNsYXNzLFxuICAgIGFwcGVhckFjdGl2ZUNsYXNzID0gZW50ZXJBY3RpdmVDbGFzcyxcbiAgICBhcHBlYXJUb0NsYXNzID0gZW50ZXJUb0NsYXNzLFxuICAgIGxlYXZlRnJvbUNsYXNzID0gYCR7bmFtZX0tbGVhdmUtZnJvbWAsXG4gICAgbGVhdmVBY3RpdmVDbGFzcyA9IGAke25hbWV9LWxlYXZlLWFjdGl2ZWAsXG4gICAgbGVhdmVUb0NsYXNzID0gYCR7bmFtZX0tbGVhdmUtdG9gXG4gIH0gPSByYXdQcm9wcztcbiAgY29uc3QgZHVyYXRpb25zID0gbm9ybWFsaXplRHVyYXRpb24oZHVyYXRpb24pO1xuICBjb25zdCBlbnRlckR1cmF0aW9uID0gZHVyYXRpb25zICYmIGR1cmF0aW9uc1swXTtcbiAgY29uc3QgbGVhdmVEdXJhdGlvbiA9IGR1cmF0aW9ucyAmJiBkdXJhdGlvbnNbMV07XG4gIGNvbnN0IHtcbiAgICBvbkJlZm9yZUVudGVyLFxuICAgIG9uRW50ZXIsXG4gICAgb25FbnRlckNhbmNlbGxlZCxcbiAgICBvbkxlYXZlLFxuICAgIG9uTGVhdmVDYW5jZWxsZWQsXG4gICAgb25CZWZvcmVBcHBlYXIgPSBvbkJlZm9yZUVudGVyLFxuICAgIG9uQXBwZWFyID0gb25FbnRlcixcbiAgICBvbkFwcGVhckNhbmNlbGxlZCA9IG9uRW50ZXJDYW5jZWxsZWRcbiAgfSA9IGJhc2VQcm9wcztcbiAgY29uc3QgZmluaXNoRW50ZXIgPSAoZWwsIGlzQXBwZWFyLCBkb25lLCBpc0NhbmNlbGxlZCkgPT4ge1xuICAgIGVsLl9lbnRlckNhbmNlbGxlZCA9IGlzQ2FuY2VsbGVkO1xuICAgIHJlbW92ZVRyYW5zaXRpb25DbGFzcyhlbCwgaXNBcHBlYXIgPyBhcHBlYXJUb0NsYXNzIDogZW50ZXJUb0NsYXNzKTtcbiAgICByZW1vdmVUcmFuc2l0aW9uQ2xhc3MoZWwsIGlzQXBwZWFyID8gYXBwZWFyQWN0aXZlQ2xhc3MgOiBlbnRlckFjdGl2ZUNsYXNzKTtcbiAgICBkb25lICYmIGRvbmUoKTtcbiAgfTtcbiAgY29uc3QgZmluaXNoTGVhdmUgPSAoZWwsIGRvbmUpID0+IHtcbiAgICBlbC5faXNMZWF2aW5nID0gZmFsc2U7XG4gICAgcmVtb3ZlVHJhbnNpdGlvbkNsYXNzKGVsLCBsZWF2ZUZyb21DbGFzcyk7XG4gICAgcmVtb3ZlVHJhbnNpdGlvbkNsYXNzKGVsLCBsZWF2ZVRvQ2xhc3MpO1xuICAgIHJlbW92ZVRyYW5zaXRpb25DbGFzcyhlbCwgbGVhdmVBY3RpdmVDbGFzcyk7XG4gICAgZG9uZSAmJiBkb25lKCk7XG4gIH07XG4gIGNvbnN0IG1ha2VFbnRlckhvb2sgPSAoaXNBcHBlYXIpID0+IHtcbiAgICByZXR1cm4gKGVsLCBkb25lKSA9PiB7XG4gICAgICBjb25zdCBob29rID0gaXNBcHBlYXIgPyBvbkFwcGVhciA6IG9uRW50ZXI7XG4gICAgICBjb25zdCByZXNvbHZlID0gKCkgPT4gZmluaXNoRW50ZXIoZWwsIGlzQXBwZWFyLCBkb25lKTtcbiAgICAgIGNhbGxIb29rKGhvb2ssIFtlbCwgcmVzb2x2ZV0pO1xuICAgICAgbmV4dEZyYW1lKCgpID0+IHtcbiAgICAgICAgcmVtb3ZlVHJhbnNpdGlvbkNsYXNzKGVsLCBpc0FwcGVhciA/IGFwcGVhckZyb21DbGFzcyA6IGVudGVyRnJvbUNsYXNzKTtcbiAgICAgICAgYWRkVHJhbnNpdGlvbkNsYXNzKGVsLCBpc0FwcGVhciA/IGFwcGVhclRvQ2xhc3MgOiBlbnRlclRvQ2xhc3MpO1xuICAgICAgICBpZiAoIWhhc0V4cGxpY2l0Q2FsbGJhY2soaG9vaykpIHtcbiAgICAgICAgICB3aGVuVHJhbnNpdGlvbkVuZHMoZWwsIHR5cGUsIGVudGVyRHVyYXRpb24sIHJlc29sdmUpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9O1xuICB9O1xuICByZXR1cm4gZXh0ZW5kKGJhc2VQcm9wcywge1xuICAgIG9uQmVmb3JlRW50ZXIoZWwpIHtcbiAgICAgIGNhbGxIb29rKG9uQmVmb3JlRW50ZXIsIFtlbF0pO1xuICAgICAgYWRkVHJhbnNpdGlvbkNsYXNzKGVsLCBlbnRlckZyb21DbGFzcyk7XG4gICAgICBhZGRUcmFuc2l0aW9uQ2xhc3MoZWwsIGVudGVyQWN0aXZlQ2xhc3MpO1xuICAgIH0sXG4gICAgb25CZWZvcmVBcHBlYXIoZWwpIHtcbiAgICAgIGNhbGxIb29rKG9uQmVmb3JlQXBwZWFyLCBbZWxdKTtcbiAgICAgIGFkZFRyYW5zaXRpb25DbGFzcyhlbCwgYXBwZWFyRnJvbUNsYXNzKTtcbiAgICAgIGFkZFRyYW5zaXRpb25DbGFzcyhlbCwgYXBwZWFyQWN0aXZlQ2xhc3MpO1xuICAgIH0sXG4gICAgb25FbnRlcjogbWFrZUVudGVySG9vayhmYWxzZSksXG4gICAgb25BcHBlYXI6IG1ha2VFbnRlckhvb2sodHJ1ZSksXG4gICAgb25MZWF2ZShlbCwgZG9uZSkge1xuICAgICAgZWwuX2lzTGVhdmluZyA9IHRydWU7XG4gICAgICBjb25zdCByZXNvbHZlID0gKCkgPT4gZmluaXNoTGVhdmUoZWwsIGRvbmUpO1xuICAgICAgYWRkVHJhbnNpdGlvbkNsYXNzKGVsLCBsZWF2ZUZyb21DbGFzcyk7XG4gICAgICBpZiAoIWVsLl9lbnRlckNhbmNlbGxlZCkge1xuICAgICAgICBmb3JjZVJlZmxvdyhlbCk7XG4gICAgICAgIGFkZFRyYW5zaXRpb25DbGFzcyhlbCwgbGVhdmVBY3RpdmVDbGFzcyk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBhZGRUcmFuc2l0aW9uQ2xhc3MoZWwsIGxlYXZlQWN0aXZlQ2xhc3MpO1xuICAgICAgICBmb3JjZVJlZmxvdyhlbCk7XG4gICAgICB9XG4gICAgICBuZXh0RnJhbWUoKCkgPT4ge1xuICAgICAgICBpZiAoIWVsLl9pc0xlYXZpbmcpIHtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgcmVtb3ZlVHJhbnNpdGlvbkNsYXNzKGVsLCBsZWF2ZUZyb21DbGFzcyk7XG4gICAgICAgIGFkZFRyYW5zaXRpb25DbGFzcyhlbCwgbGVhdmVUb0NsYXNzKTtcbiAgICAgICAgaWYgKCFoYXNFeHBsaWNpdENhbGxiYWNrKG9uTGVhdmUpKSB7XG4gICAgICAgICAgd2hlblRyYW5zaXRpb25FbmRzKGVsLCB0eXBlLCBsZWF2ZUR1cmF0aW9uLCByZXNvbHZlKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgICBjYWxsSG9vayhvbkxlYXZlLCBbZWwsIHJlc29sdmVdKTtcbiAgICB9LFxuICAgIG9uRW50ZXJDYW5jZWxsZWQoZWwpIHtcbiAgICAgIGZpbmlzaEVudGVyKGVsLCBmYWxzZSwgdm9pZCAwLCB0cnVlKTtcbiAgICAgIGNhbGxIb29rKG9uRW50ZXJDYW5jZWxsZWQsIFtlbF0pO1xuICAgIH0sXG4gICAgb25BcHBlYXJDYW5jZWxsZWQoZWwpIHtcbiAgICAgIGZpbmlzaEVudGVyKGVsLCB0cnVlLCB2b2lkIDAsIHRydWUpO1xuICAgICAgY2FsbEhvb2sob25BcHBlYXJDYW5jZWxsZWQsIFtlbF0pO1xuICAgIH0sXG4gICAgb25MZWF2ZUNhbmNlbGxlZChlbCkge1xuICAgICAgZmluaXNoTGVhdmUoZWwpO1xuICAgICAgY2FsbEhvb2sob25MZWF2ZUNhbmNlbGxlZCwgW2VsXSk7XG4gICAgfVxuICB9KTtcbn1cbmZ1bmN0aW9uIG5vcm1hbGl6ZUR1cmF0aW9uKGR1cmF0aW9uKSB7XG4gIGlmIChkdXJhdGlvbiA9PSBudWxsKSB7XG4gICAgcmV0dXJuIG51bGw7XG4gIH0gZWxzZSBpZiAoaXNPYmplY3QoZHVyYXRpb24pKSB7XG4gICAgcmV0dXJuIFtOdW1iZXJPZihkdXJhdGlvbi5lbnRlciksIE51bWJlck9mKGR1cmF0aW9uLmxlYXZlKV07XG4gIH0gZWxzZSB7XG4gICAgY29uc3QgbiA9IE51bWJlck9mKGR1cmF0aW9uKTtcbiAgICByZXR1cm4gW24sIG5dO1xuICB9XG59XG5mdW5jdGlvbiBOdW1iZXJPZih2YWwpIHtcbiAgY29uc3QgcmVzID0gdG9OdW1iZXIodmFsKTtcbiAgaWYgKCEhKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSBcInByb2R1Y3Rpb25cIikpIHtcbiAgICBhc3NlcnROdW1iZXIocmVzLCBcIjx0cmFuc2l0aW9uPiBleHBsaWNpdCBkdXJhdGlvblwiKTtcbiAgfVxuICByZXR1cm4gcmVzO1xufVxuZnVuY3Rpb24gYWRkVHJhbnNpdGlvbkNsYXNzKGVsLCBjbHMpIHtcbiAgY2xzLnNwbGl0KC9cXHMrLykuZm9yRWFjaCgoYykgPT4gYyAmJiBlbC5jbGFzc0xpc3QuYWRkKGMpKTtcbiAgKGVsW3Z0Y0tleV0gfHwgKGVsW3Z0Y0tleV0gPSAvKiBAX19QVVJFX18gKi8gbmV3IFNldCgpKSkuYWRkKGNscyk7XG59XG5mdW5jdGlvbiByZW1vdmVUcmFuc2l0aW9uQ2xhc3MoZWwsIGNscykge1xuICBjbHMuc3BsaXQoL1xccysvKS5mb3JFYWNoKChjKSA9PiBjICYmIGVsLmNsYXNzTGlzdC5yZW1vdmUoYykpO1xuICBjb25zdCBfdnRjID0gZWxbdnRjS2V5XTtcbiAgaWYgKF92dGMpIHtcbiAgICBfdnRjLmRlbGV0ZShjbHMpO1xuICAgIGlmICghX3Z0Yy5zaXplKSB7XG4gICAgICBlbFt2dGNLZXldID0gdm9pZCAwO1xuICAgIH1cbiAgfVxufVxuZnVuY3Rpb24gbmV4dEZyYW1lKGNiKSB7XG4gIHJlcXVlc3RBbmltYXRpb25GcmFtZSgoKSA9PiB7XG4gICAgcmVxdWVzdEFuaW1hdGlvbkZyYW1lKGNiKTtcbiAgfSk7XG59XG5sZXQgZW5kSWQgPSAwO1xuZnVuY3Rpb24gd2hlblRyYW5zaXRpb25FbmRzKGVsLCBleHBlY3RlZFR5cGUsIGV4cGxpY2l0VGltZW91dCwgcmVzb2x2ZSkge1xuICBjb25zdCBpZCA9IGVsLl9lbmRJZCA9ICsrZW5kSWQ7XG4gIGNvbnN0IHJlc29sdmVJZk5vdFN0YWxlID0gKCkgPT4ge1xuICAgIGlmIChpZCA9PT0gZWwuX2VuZElkKSB7XG4gICAgICByZXNvbHZlKCk7XG4gICAgfVxuICB9O1xuICBpZiAoZXhwbGljaXRUaW1lb3V0ICE9IG51bGwpIHtcbiAgICByZXR1cm4gc2V0VGltZW91dChyZXNvbHZlSWZOb3RTdGFsZSwgZXhwbGljaXRUaW1lb3V0KTtcbiAgfVxuICBjb25zdCB7IHR5cGUsIHRpbWVvdXQsIHByb3BDb3VudCB9ID0gZ2V0VHJhbnNpdGlvbkluZm8oZWwsIGV4cGVjdGVkVHlwZSk7XG4gIGlmICghdHlwZSkge1xuICAgIHJldHVybiByZXNvbHZlKCk7XG4gIH1cbiAgY29uc3QgZW5kRXZlbnQgPSB0eXBlICsgXCJlbmRcIjtcbiAgbGV0IGVuZGVkID0gMDtcbiAgY29uc3QgZW5kID0gKCkgPT4ge1xuICAgIGVsLnJlbW92ZUV2ZW50TGlzdGVuZXIoZW5kRXZlbnQsIG9uRW5kKTtcbiAgICByZXNvbHZlSWZOb3RTdGFsZSgpO1xuICB9O1xuICBjb25zdCBvbkVuZCA9IChlKSA9PiB7XG4gICAgaWYgKGUudGFyZ2V0ID09PSBlbCAmJiArK2VuZGVkID49IHByb3BDb3VudCkge1xuICAgICAgZW5kKCk7XG4gICAgfVxuICB9O1xuICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICBpZiAoZW5kZWQgPCBwcm9wQ291bnQpIHtcbiAgICAgIGVuZCgpO1xuICAgIH1cbiAgfSwgdGltZW91dCArIDEpO1xuICBlbC5hZGRFdmVudExpc3RlbmVyKGVuZEV2ZW50LCBvbkVuZCk7XG59XG5mdW5jdGlvbiBnZXRUcmFuc2l0aW9uSW5mbyhlbCwgZXhwZWN0ZWRUeXBlKSB7XG4gIGNvbnN0IHN0eWxlcyA9IHdpbmRvdy5nZXRDb21wdXRlZFN0eWxlKGVsKTtcbiAgY29uc3QgZ2V0U3R5bGVQcm9wZXJ0aWVzID0gKGtleSkgPT4gKHN0eWxlc1trZXldIHx8IFwiXCIpLnNwbGl0KFwiLCBcIik7XG4gIGNvbnN0IHRyYW5zaXRpb25EZWxheXMgPSBnZXRTdHlsZVByb3BlcnRpZXMoYCR7VFJBTlNJVElPTn1EZWxheWApO1xuICBjb25zdCB0cmFuc2l0aW9uRHVyYXRpb25zID0gZ2V0U3R5bGVQcm9wZXJ0aWVzKGAke1RSQU5TSVRJT059RHVyYXRpb25gKTtcbiAgY29uc3QgdHJhbnNpdGlvblRpbWVvdXQgPSBnZXRUaW1lb3V0KHRyYW5zaXRpb25EZWxheXMsIHRyYW5zaXRpb25EdXJhdGlvbnMpO1xuICBjb25zdCBhbmltYXRpb25EZWxheXMgPSBnZXRTdHlsZVByb3BlcnRpZXMoYCR7QU5JTUFUSU9OfURlbGF5YCk7XG4gIGNvbnN0IGFuaW1hdGlvbkR1cmF0aW9ucyA9IGdldFN0eWxlUHJvcGVydGllcyhgJHtBTklNQVRJT059RHVyYXRpb25gKTtcbiAgY29uc3QgYW5pbWF0aW9uVGltZW91dCA9IGdldFRpbWVvdXQoYW5pbWF0aW9uRGVsYXlzLCBhbmltYXRpb25EdXJhdGlvbnMpO1xuICBsZXQgdHlwZSA9IG51bGw7XG4gIGxldCB0aW1lb3V0ID0gMDtcbiAgbGV0IHByb3BDb3VudCA9IDA7XG4gIGlmIChleHBlY3RlZFR5cGUgPT09IFRSQU5TSVRJT04pIHtcbiAgICBpZiAodHJhbnNpdGlvblRpbWVvdXQgPiAwKSB7XG4gICAgICB0eXBlID0gVFJBTlNJVElPTjtcbiAgICAgIHRpbWVvdXQgPSB0cmFuc2l0aW9uVGltZW91dDtcbiAgICAgIHByb3BDb3VudCA9IHRyYW5zaXRpb25EdXJhdGlvbnMubGVuZ3RoO1xuICAgIH1cbiAgfSBlbHNlIGlmIChleHBlY3RlZFR5cGUgPT09IEFOSU1BVElPTikge1xuICAgIGlmIChhbmltYXRpb25UaW1lb3V0ID4gMCkge1xuICAgICAgdHlwZSA9IEFOSU1BVElPTjtcbiAgICAgIHRpbWVvdXQgPSBhbmltYXRpb25UaW1lb3V0O1xuICAgICAgcHJvcENvdW50ID0gYW5pbWF0aW9uRHVyYXRpb25zLmxlbmd0aDtcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgdGltZW91dCA9IE1hdGgubWF4KHRyYW5zaXRpb25UaW1lb3V0LCBhbmltYXRpb25UaW1lb3V0KTtcbiAgICB0eXBlID0gdGltZW91dCA+IDAgPyB0cmFuc2l0aW9uVGltZW91dCA+IGFuaW1hdGlvblRpbWVvdXQgPyBUUkFOU0lUSU9OIDogQU5JTUFUSU9OIDogbnVsbDtcbiAgICBwcm9wQ291bnQgPSB0eXBlID8gdHlwZSA9PT0gVFJBTlNJVElPTiA/IHRyYW5zaXRpb25EdXJhdGlvbnMubGVuZ3RoIDogYW5pbWF0aW9uRHVyYXRpb25zLmxlbmd0aCA6IDA7XG4gIH1cbiAgY29uc3QgaGFzVHJhbnNmb3JtID0gdHlwZSA9PT0gVFJBTlNJVElPTiAmJiAvXFxiKD86dHJhbnNmb3JtfGFsbCkoPzosfCQpLy50ZXN0KFxuICAgIGdldFN0eWxlUHJvcGVydGllcyhgJHtUUkFOU0lUSU9OfVByb3BlcnR5YCkudG9TdHJpbmcoKVxuICApO1xuICByZXR1cm4ge1xuICAgIHR5cGUsXG4gICAgdGltZW91dCxcbiAgICBwcm9wQ291bnQsXG4gICAgaGFzVHJhbnNmb3JtXG4gIH07XG59XG5mdW5jdGlvbiBnZXRUaW1lb3V0KGRlbGF5cywgZHVyYXRpb25zKSB7XG4gIHdoaWxlIChkZWxheXMubGVuZ3RoIDwgZHVyYXRpb25zLmxlbmd0aCkge1xuICAgIGRlbGF5cyA9IGRlbGF5cy5jb25jYXQoZGVsYXlzKTtcbiAgfVxuICByZXR1cm4gTWF0aC5tYXgoLi4uZHVyYXRpb25zLm1hcCgoZCwgaSkgPT4gdG9NcyhkKSArIHRvTXMoZGVsYXlzW2ldKSkpO1xufVxuZnVuY3Rpb24gdG9NcyhzKSB7XG4gIGlmIChzID09PSBcImF1dG9cIikgcmV0dXJuIDA7XG4gIHJldHVybiBOdW1iZXIocy5zbGljZSgwLCAtMSkucmVwbGFjZShcIixcIiwgXCIuXCIpKSAqIDFlMztcbn1cbmZ1bmN0aW9uIGZvcmNlUmVmbG93KGVsKSB7XG4gIGNvbnN0IHRhcmdldERvY3VtZW50ID0gZWwgPyBlbC5vd25lckRvY3VtZW50IDogZG9jdW1lbnQ7XG4gIHJldHVybiB0YXJnZXREb2N1bWVudC5ib2R5Lm9mZnNldEhlaWdodDtcbn1cblxuZnVuY3Rpb24gcGF0Y2hDbGFzcyhlbCwgdmFsdWUsIGlzU1ZHKSB7XG4gIGNvbnN0IHRyYW5zaXRpb25DbGFzc2VzID0gZWxbdnRjS2V5XTtcbiAgaWYgKHRyYW5zaXRpb25DbGFzc2VzKSB7XG4gICAgdmFsdWUgPSAodmFsdWUgPyBbdmFsdWUsIC4uLnRyYW5zaXRpb25DbGFzc2VzXSA6IFsuLi50cmFuc2l0aW9uQ2xhc3Nlc10pLmpvaW4oXCIgXCIpO1xuICB9XG4gIGlmICh2YWx1ZSA9PSBudWxsKSB7XG4gICAgZWwucmVtb3ZlQXR0cmlidXRlKFwiY2xhc3NcIik7XG4gIH0gZWxzZSBpZiAoaXNTVkcpIHtcbiAgICBlbC5zZXRBdHRyaWJ1dGUoXCJjbGFzc1wiLCB2YWx1ZSk7XG4gIH0gZWxzZSB7XG4gICAgZWwuY2xhc3NOYW1lID0gdmFsdWU7XG4gIH1cbn1cblxuY29uc3QgdlNob3dPcmlnaW5hbERpc3BsYXkgPSAvKiBAX19QVVJFX18gKi8gU3ltYm9sKFwiX3ZvZFwiKTtcbmNvbnN0IHZTaG93SGlkZGVuID0gLyogQF9fUFVSRV9fICovIFN5bWJvbChcIl92c2hcIik7XG5jb25zdCB2U2hvdyA9IHtcbiAgLy8gdXNlZCBmb3IgcHJvcCBtaXNtYXRjaCBjaGVjayBkdXJpbmcgaHlkcmF0aW9uXG4gIG5hbWU6IFwic2hvd1wiLFxuICBiZWZvcmVNb3VudChlbCwgeyB2YWx1ZSB9LCB7IHRyYW5zaXRpb24gfSkge1xuICAgIGVsW3ZTaG93T3JpZ2luYWxEaXNwbGF5XSA9IGVsLnN0eWxlLmRpc3BsYXkgPT09IFwibm9uZVwiID8gXCJcIiA6IGVsLnN0eWxlLmRpc3BsYXk7XG4gICAgaWYgKHRyYW5zaXRpb24gJiYgdmFsdWUpIHtcbiAgICAgIHRyYW5zaXRpb24uYmVmb3JlRW50ZXIoZWwpO1xuICAgIH0gZWxzZSB7XG4gICAgICBzZXREaXNwbGF5KGVsLCB2YWx1ZSk7XG4gICAgfVxuICB9LFxuICBtb3VudGVkKGVsLCB7IHZhbHVlIH0sIHsgdHJhbnNpdGlvbiB9KSB7XG4gICAgaWYgKHRyYW5zaXRpb24gJiYgdmFsdWUpIHtcbiAgICAgIHRyYW5zaXRpb24uZW50ZXIoZWwpO1xuICAgIH1cbiAgfSxcbiAgdXBkYXRlZChlbCwgeyB2YWx1ZSwgb2xkVmFsdWUgfSwgeyB0cmFuc2l0aW9uIH0pIHtcbiAgICBpZiAoIXZhbHVlID09PSAhb2xkVmFsdWUpIHJldHVybjtcbiAgICBpZiAodHJhbnNpdGlvbikge1xuICAgICAgaWYgKHZhbHVlKSB7XG4gICAgICAgIHRyYW5zaXRpb24uYmVmb3JlRW50ZXIoZWwpO1xuICAgICAgICBzZXREaXNwbGF5KGVsLCB0cnVlKTtcbiAgICAgICAgdHJhbnNpdGlvbi5lbnRlcihlbCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0cmFuc2l0aW9uLmxlYXZlKGVsLCAoKSA9PiB7XG4gICAgICAgICAgc2V0RGlzcGxheShlbCwgZmFsc2UpO1xuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgc2V0RGlzcGxheShlbCwgdmFsdWUpO1xuICAgIH1cbiAgfSxcbiAgYmVmb3JlVW5tb3VudChlbCwgeyB2YWx1ZSB9KSB7XG4gICAgc2V0RGlzcGxheShlbCwgdmFsdWUpO1xuICB9XG59O1xuZnVuY3Rpb24gc2V0RGlzcGxheShlbCwgdmFsdWUpIHtcbiAgZWwuc3R5bGUuZGlzcGxheSA9IHZhbHVlID8gZWxbdlNob3dPcmlnaW5hbERpc3BsYXldIDogXCJub25lXCI7XG4gIGVsW3ZTaG93SGlkZGVuXSA9ICF2YWx1ZTtcbn1cbmZ1bmN0aW9uIGluaXRWU2hvd0ZvclNTUigpIHtcbiAgdlNob3cuZ2V0U1NSUHJvcHMgPSAoeyB2YWx1ZSB9KSA9PiB7XG4gICAgaWYgKCF2YWx1ZSkge1xuICAgICAgcmV0dXJuIHsgc3R5bGU6IHsgZGlzcGxheTogXCJub25lXCIgfSB9O1xuICAgIH1cbiAgfTtcbn1cblxuY29uc3QgQ1NTX1ZBUl9URVhUID0gLyogQF9fUFVSRV9fICovIFN5bWJvbCghIShwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gXCJwcm9kdWN0aW9uXCIpID8gXCJDU1NfVkFSX1RFWFRcIiA6IFwiXCIpO1xuZnVuY3Rpb24gdXNlQ3NzVmFycyhnZXR0ZXIpIHtcbiAgY29uc3QgaW5zdGFuY2UgPSBnZXRDdXJyZW50SW5zdGFuY2UoKTtcbiAgaWYgKCFpbnN0YW5jZSkge1xuICAgICEhKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSBcInByb2R1Y3Rpb25cIikgJiYgd2FybihgdXNlQ3NzVmFycyBpcyBjYWxsZWQgd2l0aG91dCBjdXJyZW50IGFjdGl2ZSBjb21wb25lbnQgaW5zdGFuY2UuYCk7XG4gICAgcmV0dXJuO1xuICB9XG4gIGNvbnN0IHVwZGF0ZVRlbGVwb3J0cyA9IGluc3RhbmNlLnV0ID0gKHZhcnMgPSBnZXR0ZXIoaW5zdGFuY2UucHJveHkpKSA9PiB7XG4gICAgQXJyYXkuZnJvbShcbiAgICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoYFtkYXRhLXYtb3duZXI9XCIke2luc3RhbmNlLnVpZH1cIl1gKVxuICAgICkuZm9yRWFjaCgobm9kZSkgPT4gc2V0VmFyc09uTm9kZShub2RlLCB2YXJzKSk7XG4gIH07XG4gIGlmICghIShwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gXCJwcm9kdWN0aW9uXCIpKSB7XG4gICAgaW5zdGFuY2UuZ2V0Q3NzVmFycyA9ICgpID0+IGdldHRlcihpbnN0YW5jZS5wcm94eSk7XG4gIH1cbiAgY29uc3Qgc2V0VmFycyA9ICgpID0+IHtcbiAgICBjb25zdCB2YXJzID0gZ2V0dGVyKGluc3RhbmNlLnByb3h5KTtcbiAgICBpZiAoaW5zdGFuY2UuY2UpIHtcbiAgICAgIHNldFZhcnNPbk5vZGUoaW5zdGFuY2UuY2UsIHZhcnMpO1xuICAgIH0gZWxzZSB7XG4gICAgICBzZXRWYXJzT25WTm9kZShpbnN0YW5jZS5zdWJUcmVlLCB2YXJzKTtcbiAgICB9XG4gICAgdXBkYXRlVGVsZXBvcnRzKHZhcnMpO1xuICB9O1xuICBvbkJlZm9yZVVwZGF0ZSgoKSA9PiB7XG4gICAgcXVldWVQb3N0Rmx1c2hDYihzZXRWYXJzKTtcbiAgfSk7XG4gIG9uTW91bnRlZCgoKSA9PiB7XG4gICAgd2F0Y2goc2V0VmFycywgTk9PUCwgeyBmbHVzaDogXCJwb3N0XCIgfSk7XG4gICAgY29uc3Qgb2IgPSBuZXcgTXV0YXRpb25PYnNlcnZlcihzZXRWYXJzKTtcbiAgICBvYi5vYnNlcnZlKGluc3RhbmNlLnN1YlRyZWUuZWwucGFyZW50Tm9kZSwgeyBjaGlsZExpc3Q6IHRydWUgfSk7XG4gICAgb25Vbm1vdW50ZWQoKCkgPT4gb2IuZGlzY29ubmVjdCgpKTtcbiAgfSk7XG59XG5mdW5jdGlvbiBzZXRWYXJzT25WTm9kZSh2bm9kZSwgdmFycykge1xuICBpZiAodm5vZGUuc2hhcGVGbGFnICYgMTI4KSB7XG4gICAgY29uc3Qgc3VzcGVuc2UgPSB2bm9kZS5zdXNwZW5zZTtcbiAgICB2bm9kZSA9IHN1c3BlbnNlLmFjdGl2ZUJyYW5jaDtcbiAgICBpZiAoc3VzcGVuc2UucGVuZGluZ0JyYW5jaCAmJiAhc3VzcGVuc2UuaXNIeWRyYXRpbmcpIHtcbiAgICAgIHN1c3BlbnNlLmVmZmVjdHMucHVzaCgoKSA9PiB7XG4gICAgICAgIHNldFZhcnNPblZOb2RlKHN1c3BlbnNlLmFjdGl2ZUJyYW5jaCwgdmFycyk7XG4gICAgICB9KTtcbiAgICB9XG4gIH1cbiAgd2hpbGUgKHZub2RlLmNvbXBvbmVudCkge1xuICAgIHZub2RlID0gdm5vZGUuY29tcG9uZW50LnN1YlRyZWU7XG4gIH1cbiAgaWYgKHZub2RlLnNoYXBlRmxhZyAmIDEgJiYgdm5vZGUuZWwpIHtcbiAgICBzZXRWYXJzT25Ob2RlKHZub2RlLmVsLCB2YXJzKTtcbiAgfSBlbHNlIGlmICh2bm9kZS50eXBlID09PSBGcmFnbWVudCkge1xuICAgIHZub2RlLmNoaWxkcmVuLmZvckVhY2goKGMpID0+IHNldFZhcnNPblZOb2RlKGMsIHZhcnMpKTtcbiAgfSBlbHNlIGlmICh2bm9kZS50eXBlID09PSBTdGF0aWMpIHtcbiAgICBsZXQgeyBlbCwgYW5jaG9yIH0gPSB2bm9kZTtcbiAgICB3aGlsZSAoZWwpIHtcbiAgICAgIHNldFZhcnNPbk5vZGUoZWwsIHZhcnMpO1xuICAgICAgaWYgKGVsID09PSBhbmNob3IpIGJyZWFrO1xuICAgICAgZWwgPSBlbC5uZXh0U2libGluZztcbiAgICB9XG4gIH1cbn1cbmZ1bmN0aW9uIHNldFZhcnNPbk5vZGUoZWwsIHZhcnMpIHtcbiAgaWYgKGVsLm5vZGVUeXBlID09PSAxKSB7XG4gICAgY29uc3Qgc3R5bGUgPSBlbC5zdHlsZTtcbiAgICBsZXQgY3NzVGV4dCA9IFwiXCI7XG4gICAgZm9yIChjb25zdCBrZXkgaW4gdmFycykge1xuICAgICAgY29uc3QgdmFsdWUgPSBub3JtYWxpemVDc3NWYXJWYWx1ZSh2YXJzW2tleV0pO1xuICAgICAgc3R5bGUuc2V0UHJvcGVydHkoYC0tJHtrZXl9YCwgdmFsdWUpO1xuICAgICAgY3NzVGV4dCArPSBgLS0ke2tleX06ICR7dmFsdWV9O2A7XG4gICAgfVxuICAgIHN0eWxlW0NTU19WQVJfVEVYVF0gPSBjc3NUZXh0O1xuICB9XG59XG5cbmNvbnN0IGRpc3BsYXlSRSA9IC8oPzpefDspXFxzKmRpc3BsYXlcXHMqOi87XG5mdW5jdGlvbiBwYXRjaFN0eWxlKGVsLCBwcmV2LCBuZXh0KSB7XG4gIGNvbnN0IHN0eWxlID0gZWwuc3R5bGU7XG4gIGNvbnN0IGlzQ3NzU3RyaW5nID0gaXNTdHJpbmcobmV4dCk7XG4gIGxldCBoYXNDb250cm9sbGVkRGlzcGxheSA9IGZhbHNlO1xuICBpZiAobmV4dCAmJiAhaXNDc3NTdHJpbmcpIHtcbiAgICBpZiAocHJldikge1xuICAgICAgaWYgKCFpc1N0cmluZyhwcmV2KSkge1xuICAgICAgICBmb3IgKGNvbnN0IGtleSBpbiBwcmV2KSB7XG4gICAgICAgICAgaWYgKG5leHRba2V5XSA9PSBudWxsKSB7XG4gICAgICAgICAgICBzZXRTdHlsZShzdHlsZSwga2V5LCBcIlwiKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGZvciAoY29uc3QgcHJldlN0eWxlIG9mIHByZXYuc3BsaXQoXCI7XCIpKSB7XG4gICAgICAgICAgY29uc3Qga2V5ID0gcHJldlN0eWxlLnNsaWNlKDAsIHByZXZTdHlsZS5pbmRleE9mKFwiOlwiKSkudHJpbSgpO1xuICAgICAgICAgIGlmIChuZXh0W2tleV0gPT0gbnVsbCkge1xuICAgICAgICAgICAgc2V0U3R5bGUoc3R5bGUsIGtleSwgXCJcIik7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIGZvciAoY29uc3Qga2V5IGluIG5leHQpIHtcbiAgICAgIGlmIChrZXkgPT09IFwiZGlzcGxheVwiKSB7XG4gICAgICAgIGhhc0NvbnRyb2xsZWREaXNwbGF5ID0gdHJ1ZTtcbiAgICAgIH1cbiAgICAgIHNldFN0eWxlKHN0eWxlLCBrZXksIG5leHRba2V5XSk7XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIGlmIChpc0Nzc1N0cmluZykge1xuICAgICAgaWYgKHByZXYgIT09IG5leHQpIHtcbiAgICAgICAgY29uc3QgY3NzVmFyVGV4dCA9IHN0eWxlW0NTU19WQVJfVEVYVF07XG4gICAgICAgIGlmIChjc3NWYXJUZXh0KSB7XG4gICAgICAgICAgbmV4dCArPSBcIjtcIiArIGNzc1ZhclRleHQ7XG4gICAgICAgIH1cbiAgICAgICAgc3R5bGUuY3NzVGV4dCA9IG5leHQ7XG4gICAgICAgIGhhc0NvbnRyb2xsZWREaXNwbGF5ID0gZGlzcGxheVJFLnRlc3QobmV4dCk7XG4gICAgICB9XG4gICAgfSBlbHNlIGlmIChwcmV2KSB7XG4gICAgICBlbC5yZW1vdmVBdHRyaWJ1dGUoXCJzdHlsZVwiKTtcbiAgICB9XG4gIH1cbiAgaWYgKHZTaG93T3JpZ2luYWxEaXNwbGF5IGluIGVsKSB7XG4gICAgZWxbdlNob3dPcmlnaW5hbERpc3BsYXldID0gaGFzQ29udHJvbGxlZERpc3BsYXkgPyBzdHlsZS5kaXNwbGF5IDogXCJcIjtcbiAgICBpZiAoZWxbdlNob3dIaWRkZW5dKSB7XG4gICAgICBzdHlsZS5kaXNwbGF5ID0gXCJub25lXCI7XG4gICAgfVxuICB9XG59XG5jb25zdCBzZW1pY29sb25SRSA9IC9bXlxcXFxdO1xccyokLztcbmNvbnN0IGltcG9ydGFudFJFID0gL1xccyohaW1wb3J0YW50JC87XG5mdW5jdGlvbiBzZXRTdHlsZShzdHlsZSwgbmFtZSwgdmFsKSB7XG4gIGlmIChpc0FycmF5KHZhbCkpIHtcbiAgICB2YWwuZm9yRWFjaCgodikgPT4gc2V0U3R5bGUoc3R5bGUsIG5hbWUsIHYpKTtcbiAgfSBlbHNlIHtcbiAgICBpZiAodmFsID09IG51bGwpIHZhbCA9IFwiXCI7XG4gICAgaWYgKCEhKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSBcInByb2R1Y3Rpb25cIikpIHtcbiAgICAgIGlmIChzZW1pY29sb25SRS50ZXN0KHZhbCkpIHtcbiAgICAgICAgd2FybihcbiAgICAgICAgICBgVW5leHBlY3RlZCBzZW1pY29sb24gYXQgdGhlIGVuZCBvZiAnJHtuYW1lfScgc3R5bGUgdmFsdWU6ICcke3ZhbH0nYFxuICAgICAgICApO1xuICAgICAgfVxuICAgIH1cbiAgICBpZiAobmFtZS5zdGFydHNXaXRoKFwiLS1cIikpIHtcbiAgICAgIHN0eWxlLnNldFByb3BlcnR5KG5hbWUsIHZhbCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnN0IHByZWZpeGVkID0gYXV0b1ByZWZpeChzdHlsZSwgbmFtZSk7XG4gICAgICBpZiAoaW1wb3J0YW50UkUudGVzdCh2YWwpKSB7XG4gICAgICAgIHN0eWxlLnNldFByb3BlcnR5KFxuICAgICAgICAgIGh5cGhlbmF0ZShwcmVmaXhlZCksXG4gICAgICAgICAgdmFsLnJlcGxhY2UoaW1wb3J0YW50UkUsIFwiXCIpLFxuICAgICAgICAgIFwiaW1wb3J0YW50XCJcbiAgICAgICAgKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHN0eWxlW3ByZWZpeGVkXSA9IHZhbDtcbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cbmNvbnN0IHByZWZpeGVzID0gW1wiV2Via2l0XCIsIFwiTW96XCIsIFwibXNcIl07XG5jb25zdCBwcmVmaXhDYWNoZSA9IHt9O1xuZnVuY3Rpb24gYXV0b1ByZWZpeChzdHlsZSwgcmF3TmFtZSkge1xuICBjb25zdCBjYWNoZWQgPSBwcmVmaXhDYWNoZVtyYXdOYW1lXTtcbiAgaWYgKGNhY2hlZCkge1xuICAgIHJldHVybiBjYWNoZWQ7XG4gIH1cbiAgbGV0IG5hbWUgPSBjYW1lbGl6ZShyYXdOYW1lKTtcbiAgaWYgKG5hbWUgIT09IFwiZmlsdGVyXCIgJiYgbmFtZSBpbiBzdHlsZSkge1xuICAgIHJldHVybiBwcmVmaXhDYWNoZVtyYXdOYW1lXSA9IG5hbWU7XG4gIH1cbiAgbmFtZSA9IGNhcGl0YWxpemUobmFtZSk7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgcHJlZml4ZXMubGVuZ3RoOyBpKyspIHtcbiAgICBjb25zdCBwcmVmaXhlZCA9IHByZWZpeGVzW2ldICsgbmFtZTtcbiAgICBpZiAocHJlZml4ZWQgaW4gc3R5bGUpIHtcbiAgICAgIHJldHVybiBwcmVmaXhDYWNoZVtyYXdOYW1lXSA9IHByZWZpeGVkO1xuICAgIH1cbiAgfVxuICByZXR1cm4gcmF3TmFtZTtcbn1cblxuY29uc3QgeGxpbmtOUyA9IFwiaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGlua1wiO1xuZnVuY3Rpb24gcGF0Y2hBdHRyKGVsLCBrZXksIHZhbHVlLCBpc1NWRywgaW5zdGFuY2UsIGlzQm9vbGVhbiA9IGlzU3BlY2lhbEJvb2xlYW5BdHRyKGtleSkpIHtcbiAgaWYgKGlzU1ZHICYmIGtleS5zdGFydHNXaXRoKFwieGxpbms6XCIpKSB7XG4gICAgaWYgKHZhbHVlID09IG51bGwpIHtcbiAgICAgIGVsLnJlbW92ZUF0dHJpYnV0ZU5TKHhsaW5rTlMsIGtleS5zbGljZSg2LCBrZXkubGVuZ3RoKSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGVsLnNldEF0dHJpYnV0ZU5TKHhsaW5rTlMsIGtleSwgdmFsdWUpO1xuICAgIH1cbiAgfSBlbHNlIHtcbiAgICBpZiAodmFsdWUgPT0gbnVsbCB8fCBpc0Jvb2xlYW4gJiYgIWluY2x1ZGVCb29sZWFuQXR0cih2YWx1ZSkpIHtcbiAgICAgIGVsLnJlbW92ZUF0dHJpYnV0ZShrZXkpO1xuICAgIH0gZWxzZSB7XG4gICAgICBlbC5zZXRBdHRyaWJ1dGUoXG4gICAgICAgIGtleSxcbiAgICAgICAgaXNCb29sZWFuID8gXCJcIiA6IGlzU3ltYm9sKHZhbHVlKSA/IFN0cmluZyh2YWx1ZSkgOiB2YWx1ZVxuICAgICAgKTtcbiAgICB9XG4gIH1cbn1cblxuZnVuY3Rpb24gcGF0Y2hET01Qcm9wKGVsLCBrZXksIHZhbHVlLCBwYXJlbnRDb21wb25lbnQsIGF0dHJOYW1lKSB7XG4gIGlmIChrZXkgPT09IFwiaW5uZXJIVE1MXCIgfHwga2V5ID09PSBcInRleHRDb250ZW50XCIpIHtcbiAgICBpZiAodmFsdWUgIT0gbnVsbCkge1xuICAgICAgZWxba2V5XSA9IGtleSA9PT0gXCJpbm5lckhUTUxcIiA/IHVuc2FmZVRvVHJ1c3RlZEhUTUwodmFsdWUpIDogdmFsdWU7XG4gICAgfVxuICAgIHJldHVybjtcbiAgfVxuICBjb25zdCB0YWcgPSBlbC50YWdOYW1lO1xuICBpZiAoa2V5ID09PSBcInZhbHVlXCIgJiYgdGFnICE9PSBcIlBST0dSRVNTXCIgJiYgLy8gY3VzdG9tIGVsZW1lbnRzIG1heSB1c2UgX3ZhbHVlIGludGVybmFsbHlcbiAgIXRhZy5pbmNsdWRlcyhcIi1cIikpIHtcbiAgICBjb25zdCBvbGRWYWx1ZSA9IHRhZyA9PT0gXCJPUFRJT05cIiA/IGVsLmdldEF0dHJpYnV0ZShcInZhbHVlXCIpIHx8IFwiXCIgOiBlbC52YWx1ZTtcbiAgICBjb25zdCBuZXdWYWx1ZSA9IHZhbHVlID09IG51bGwgPyAoXG4gICAgICAvLyAjMTE2NDc6IHZhbHVlIHNob3VsZCBiZSBzZXQgYXMgZW1wdHkgc3RyaW5nIGZvciBudWxsIGFuZCB1bmRlZmluZWQsXG4gICAgICAvLyBidXQgPGlucHV0IHR5cGU9XCJjaGVja2JveFwiPiBzaG91bGQgYmUgc2V0IGFzICdvbicuXG4gICAgICBlbC50eXBlID09PSBcImNoZWNrYm94XCIgPyBcIm9uXCIgOiBcIlwiXG4gICAgKSA6IFN0cmluZyh2YWx1ZSk7XG4gICAgaWYgKG9sZFZhbHVlICE9PSBuZXdWYWx1ZSB8fCAhKFwiX3ZhbHVlXCIgaW4gZWwpKSB7XG4gICAgICBlbC52YWx1ZSA9IG5ld1ZhbHVlO1xuICAgIH1cbiAgICBpZiAodmFsdWUgPT0gbnVsbCkge1xuICAgICAgZWwucmVtb3ZlQXR0cmlidXRlKGtleSk7XG4gICAgfVxuICAgIGVsLl92YWx1ZSA9IHZhbHVlO1xuICAgIHJldHVybjtcbiAgfVxuICBsZXQgbmVlZFJlbW92ZSA9IGZhbHNlO1xuICBpZiAodmFsdWUgPT09IFwiXCIgfHwgdmFsdWUgPT0gbnVsbCkge1xuICAgIGNvbnN0IHR5cGUgPSB0eXBlb2YgZWxba2V5XTtcbiAgICBpZiAodHlwZSA9PT0gXCJib29sZWFuXCIpIHtcbiAgICAgIHZhbHVlID0gaW5jbHVkZUJvb2xlYW5BdHRyKHZhbHVlKTtcbiAgICB9IGVsc2UgaWYgKHZhbHVlID09IG51bGwgJiYgdHlwZSA9PT0gXCJzdHJpbmdcIikge1xuICAgICAgdmFsdWUgPSBcIlwiO1xuICAgICAgbmVlZFJlbW92ZSA9IHRydWU7XG4gICAgfSBlbHNlIGlmICh0eXBlID09PSBcIm51bWJlclwiKSB7XG4gICAgICB2YWx1ZSA9IDA7XG4gICAgICBuZWVkUmVtb3ZlID0gdHJ1ZTtcbiAgICB9XG4gIH1cbiAgdHJ5IHtcbiAgICBlbFtrZXldID0gdmFsdWU7XG4gIH0gY2F0Y2ggKGUpIHtcbiAgICBpZiAoISEocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09IFwicHJvZHVjdGlvblwiKSAmJiAhbmVlZFJlbW92ZSkge1xuICAgICAgd2FybihcbiAgICAgICAgYEZhaWxlZCBzZXR0aW5nIHByb3AgXCIke2tleX1cIiBvbiA8JHt0YWcudG9Mb3dlckNhc2UoKX0+OiB2YWx1ZSAke3ZhbHVlfSBpcyBpbnZhbGlkLmAsXG4gICAgICAgIGVcbiAgICAgICk7XG4gICAgfVxuICB9XG4gIG5lZWRSZW1vdmUgJiYgZWwucmVtb3ZlQXR0cmlidXRlKGF0dHJOYW1lIHx8IGtleSk7XG59XG5cbmZ1bmN0aW9uIGFkZEV2ZW50TGlzdGVuZXIoZWwsIGV2ZW50LCBoYW5kbGVyLCBvcHRpb25zKSB7XG4gIGVsLmFkZEV2ZW50TGlzdGVuZXIoZXZlbnQsIGhhbmRsZXIsIG9wdGlvbnMpO1xufVxuZnVuY3Rpb24gcmVtb3ZlRXZlbnRMaXN0ZW5lcihlbCwgZXZlbnQsIGhhbmRsZXIsIG9wdGlvbnMpIHtcbiAgZWwucmVtb3ZlRXZlbnRMaXN0ZW5lcihldmVudCwgaGFuZGxlciwgb3B0aW9ucyk7XG59XG5jb25zdCB2ZWlLZXkgPSAvKiBAX19QVVJFX18gKi8gU3ltYm9sKFwiX3ZlaVwiKTtcbmZ1bmN0aW9uIHBhdGNoRXZlbnQoZWwsIHJhd05hbWUsIHByZXZWYWx1ZSwgbmV4dFZhbHVlLCBpbnN0YW5jZSA9IG51bGwpIHtcbiAgY29uc3QgaW52b2tlcnMgPSBlbFt2ZWlLZXldIHx8IChlbFt2ZWlLZXldID0ge30pO1xuICBjb25zdCBleGlzdGluZ0ludm9rZXIgPSBpbnZva2Vyc1tyYXdOYW1lXTtcbiAgaWYgKG5leHRWYWx1ZSAmJiBleGlzdGluZ0ludm9rZXIpIHtcbiAgICBleGlzdGluZ0ludm9rZXIudmFsdWUgPSAhIShwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gXCJwcm9kdWN0aW9uXCIpID8gc2FuaXRpemVFdmVudFZhbHVlKG5leHRWYWx1ZSwgcmF3TmFtZSkgOiBuZXh0VmFsdWU7XG4gIH0gZWxzZSB7XG4gICAgY29uc3QgW25hbWUsIG9wdGlvbnNdID0gcGFyc2VOYW1lKHJhd05hbWUpO1xuICAgIGlmIChuZXh0VmFsdWUpIHtcbiAgICAgIGNvbnN0IGludm9rZXIgPSBpbnZva2Vyc1tyYXdOYW1lXSA9IGNyZWF0ZUludm9rZXIoXG4gICAgICAgICEhKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSBcInByb2R1Y3Rpb25cIikgPyBzYW5pdGl6ZUV2ZW50VmFsdWUobmV4dFZhbHVlLCByYXdOYW1lKSA6IG5leHRWYWx1ZSxcbiAgICAgICAgaW5zdGFuY2VcbiAgICAgICk7XG4gICAgICBhZGRFdmVudExpc3RlbmVyKGVsLCBuYW1lLCBpbnZva2VyLCBvcHRpb25zKTtcbiAgICB9IGVsc2UgaWYgKGV4aXN0aW5nSW52b2tlcikge1xuICAgICAgcmVtb3ZlRXZlbnRMaXN0ZW5lcihlbCwgbmFtZSwgZXhpc3RpbmdJbnZva2VyLCBvcHRpb25zKTtcbiAgICAgIGludm9rZXJzW3Jhd05hbWVdID0gdm9pZCAwO1xuICAgIH1cbiAgfVxufVxuY29uc3Qgb3B0aW9uc01vZGlmaWVyUkUgPSAvKD86T25jZXxQYXNzaXZlfENhcHR1cmUpJC87XG5mdW5jdGlvbiBwYXJzZU5hbWUobmFtZSkge1xuICBsZXQgb3B0aW9ucztcbiAgaWYgKG9wdGlvbnNNb2RpZmllclJFLnRlc3QobmFtZSkpIHtcbiAgICBvcHRpb25zID0ge307XG4gICAgbGV0IG07XG4gICAgd2hpbGUgKG0gPSBuYW1lLm1hdGNoKG9wdGlvbnNNb2RpZmllclJFKSkge1xuICAgICAgbmFtZSA9IG5hbWUuc2xpY2UoMCwgbmFtZS5sZW5ndGggLSBtWzBdLmxlbmd0aCk7XG4gICAgICBvcHRpb25zW21bMF0udG9Mb3dlckNhc2UoKV0gPSB0cnVlO1xuICAgIH1cbiAgfVxuICBjb25zdCBldmVudCA9IG5hbWVbMl0gPT09IFwiOlwiID8gbmFtZS5zbGljZSgzKSA6IGh5cGhlbmF0ZShuYW1lLnNsaWNlKDIpKTtcbiAgcmV0dXJuIFtldmVudCwgb3B0aW9uc107XG59XG5sZXQgY2FjaGVkTm93ID0gMDtcbmNvbnN0IHAgPSAvKiBAX19QVVJFX18gKi8gUHJvbWlzZS5yZXNvbHZlKCk7XG5jb25zdCBnZXROb3cgPSAoKSA9PiBjYWNoZWROb3cgfHwgKHAudGhlbigoKSA9PiBjYWNoZWROb3cgPSAwKSwgY2FjaGVkTm93ID0gRGF0ZS5ub3coKSk7XG5mdW5jdGlvbiBjcmVhdGVJbnZva2VyKGluaXRpYWxWYWx1ZSwgaW5zdGFuY2UpIHtcbiAgY29uc3QgaW52b2tlciA9IChlKSA9PiB7XG4gICAgaWYgKCFlLl92dHMpIHtcbiAgICAgIGUuX3Z0cyA9IERhdGUubm93KCk7XG4gICAgfSBlbHNlIGlmIChlLl92dHMgPD0gaW52b2tlci5hdHRhY2hlZCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBjYWxsV2l0aEFzeW5jRXJyb3JIYW5kbGluZyhcbiAgICAgIHBhdGNoU3RvcEltbWVkaWF0ZVByb3BhZ2F0aW9uKGUsIGludm9rZXIudmFsdWUpLFxuICAgICAgaW5zdGFuY2UsXG4gICAgICA1LFxuICAgICAgW2VdXG4gICAgKTtcbiAgfTtcbiAgaW52b2tlci52YWx1ZSA9IGluaXRpYWxWYWx1ZTtcbiAgaW52b2tlci5hdHRhY2hlZCA9IGdldE5vdygpO1xuICByZXR1cm4gaW52b2tlcjtcbn1cbmZ1bmN0aW9uIHNhbml0aXplRXZlbnRWYWx1ZSh2YWx1ZSwgcHJvcE5hbWUpIHtcbiAgaWYgKGlzRnVuY3Rpb24odmFsdWUpIHx8IGlzQXJyYXkodmFsdWUpKSB7XG4gICAgcmV0dXJuIHZhbHVlO1xuICB9XG4gIHdhcm4oXG4gICAgYFdyb25nIHR5cGUgcGFzc2VkIGFzIGV2ZW50IGhhbmRsZXIgdG8gJHtwcm9wTmFtZX0gLSBkaWQgeW91IGZvcmdldCBAIG9yIDogaW4gZnJvbnQgb2YgeW91ciBwcm9wP1xuRXhwZWN0ZWQgZnVuY3Rpb24gb3IgYXJyYXkgb2YgZnVuY3Rpb25zLCByZWNlaXZlZCB0eXBlICR7dHlwZW9mIHZhbHVlfS5gXG4gICk7XG4gIHJldHVybiBOT09QO1xufVxuZnVuY3Rpb24gcGF0Y2hTdG9wSW1tZWRpYXRlUHJvcGFnYXRpb24oZSwgdmFsdWUpIHtcbiAgaWYgKGlzQXJyYXkodmFsdWUpKSB7XG4gICAgY29uc3Qgb3JpZ2luYWxTdG9wID0gZS5zdG9wSW1tZWRpYXRlUHJvcGFnYXRpb247XG4gICAgZS5zdG9wSW1tZWRpYXRlUHJvcGFnYXRpb24gPSAoKSA9PiB7XG4gICAgICBvcmlnaW5hbFN0b3AuY2FsbChlKTtcbiAgICAgIGUuX3N0b3BwZWQgPSB0cnVlO1xuICAgIH07XG4gICAgcmV0dXJuIHZhbHVlLm1hcChcbiAgICAgIChmbikgPT4gKGUyKSA9PiAhZTIuX3N0b3BwZWQgJiYgZm4gJiYgZm4oZTIpXG4gICAgKTtcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gdmFsdWU7XG4gIH1cbn1cblxuY29uc3QgaXNOYXRpdmVPbiA9IChrZXkpID0+IGtleS5jaGFyQ29kZUF0KDApID09PSAxMTEgJiYga2V5LmNoYXJDb2RlQXQoMSkgPT09IDExMCAmJiAvLyBsb3dlcmNhc2UgbGV0dGVyXG5rZXkuY2hhckNvZGVBdCgyKSA+IDk2ICYmIGtleS5jaGFyQ29kZUF0KDIpIDwgMTIzO1xuY29uc3QgcGF0Y2hQcm9wID0gKGVsLCBrZXksIHByZXZWYWx1ZSwgbmV4dFZhbHVlLCBuYW1lc3BhY2UsIHBhcmVudENvbXBvbmVudCkgPT4ge1xuICBjb25zdCBpc1NWRyA9IG5hbWVzcGFjZSA9PT0gXCJzdmdcIjtcbiAgaWYgKGtleSA9PT0gXCJjbGFzc1wiKSB7XG4gICAgcGF0Y2hDbGFzcyhlbCwgbmV4dFZhbHVlLCBpc1NWRyk7XG4gIH0gZWxzZSBpZiAoa2V5ID09PSBcInN0eWxlXCIpIHtcbiAgICBwYXRjaFN0eWxlKGVsLCBwcmV2VmFsdWUsIG5leHRWYWx1ZSk7XG4gIH0gZWxzZSBpZiAoaXNPbihrZXkpKSB7XG4gICAgaWYgKCFpc01vZGVsTGlzdGVuZXIoa2V5KSkge1xuICAgICAgcGF0Y2hFdmVudChlbCwga2V5LCBwcmV2VmFsdWUsIG5leHRWYWx1ZSwgcGFyZW50Q29tcG9uZW50KTtcbiAgICB9XG4gIH0gZWxzZSBpZiAoa2V5WzBdID09PSBcIi5cIiA/IChrZXkgPSBrZXkuc2xpY2UoMSksIHRydWUpIDoga2V5WzBdID09PSBcIl5cIiA/IChrZXkgPSBrZXkuc2xpY2UoMSksIGZhbHNlKSA6IHNob3VsZFNldEFzUHJvcChlbCwga2V5LCBuZXh0VmFsdWUsIGlzU1ZHKSkge1xuICAgIHBhdGNoRE9NUHJvcChlbCwga2V5LCBuZXh0VmFsdWUpO1xuICAgIGlmICghZWwudGFnTmFtZS5pbmNsdWRlcyhcIi1cIikgJiYgKGtleSA9PT0gXCJ2YWx1ZVwiIHx8IGtleSA9PT0gXCJjaGVja2VkXCIgfHwga2V5ID09PSBcInNlbGVjdGVkXCIpKSB7XG4gICAgICBwYXRjaEF0dHIoZWwsIGtleSwgbmV4dFZhbHVlLCBpc1NWRywgcGFyZW50Q29tcG9uZW50LCBrZXkgIT09IFwidmFsdWVcIik7XG4gICAgfVxuICB9IGVsc2UgaWYgKFxuICAgIC8vICMxMTA4MSBmb3JjZSBzZXQgcHJvcHMgZm9yIHBvc3NpYmxlIGFzeW5jIGN1c3RvbSBlbGVtZW50XG4gICAgZWwuX2lzVnVlQ0UgJiYgKC9bQS1aXS8udGVzdChrZXkpIHx8ICFpc1N0cmluZyhuZXh0VmFsdWUpKVxuICApIHtcbiAgICBwYXRjaERPTVByb3AoZWwsIGNhbWVsaXplJDEoa2V5KSwgbmV4dFZhbHVlLCBwYXJlbnRDb21wb25lbnQsIGtleSk7XG4gIH0gZWxzZSB7XG4gICAgaWYgKGtleSA9PT0gXCJ0cnVlLXZhbHVlXCIpIHtcbiAgICAgIGVsLl90cnVlVmFsdWUgPSBuZXh0VmFsdWU7XG4gICAgfSBlbHNlIGlmIChrZXkgPT09IFwiZmFsc2UtdmFsdWVcIikge1xuICAgICAgZWwuX2ZhbHNlVmFsdWUgPSBuZXh0VmFsdWU7XG4gICAgfVxuICAgIHBhdGNoQXR0cihlbCwga2V5LCBuZXh0VmFsdWUsIGlzU1ZHKTtcbiAgfVxufTtcbmZ1bmN0aW9uIHNob3VsZFNldEFzUHJvcChlbCwga2V5LCB2YWx1ZSwgaXNTVkcpIHtcbiAgaWYgKGlzU1ZHKSB7XG4gICAgaWYgKGtleSA9PT0gXCJpbm5lckhUTUxcIiB8fCBrZXkgPT09IFwidGV4dENvbnRlbnRcIikge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICAgIGlmIChrZXkgaW4gZWwgJiYgaXNOYXRpdmVPbihrZXkpICYmIGlzRnVuY3Rpb24odmFsdWUpKSB7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG4gIGlmIChrZXkgPT09IFwic3BlbGxjaGVja1wiIHx8IGtleSA9PT0gXCJkcmFnZ2FibGVcIiB8fCBrZXkgPT09IFwidHJhbnNsYXRlXCIgfHwga2V5ID09PSBcImF1dG9jb3JyZWN0XCIpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbiAgaWYgKGtleSA9PT0gXCJzYW5kYm94XCIgJiYgZWwudGFnTmFtZSA9PT0gXCJJRlJBTUVcIikge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuICBpZiAoa2V5ID09PSBcImZvcm1cIikge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuICBpZiAoa2V5ID09PSBcImxpc3RcIiAmJiBlbC50YWdOYW1lID09PSBcIklOUFVUXCIpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbiAgaWYgKGtleSA9PT0gXCJ0eXBlXCIgJiYgZWwudGFnTmFtZSA9PT0gXCJURVhUQVJFQVwiKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG4gIGlmIChrZXkgPT09IFwid2lkdGhcIiB8fCBrZXkgPT09IFwiaGVpZ2h0XCIpIHtcbiAgICBjb25zdCB0YWcgPSBlbC50YWdOYW1lO1xuICAgIGlmICh0YWcgPT09IFwiSU1HXCIgfHwgdGFnID09PSBcIlZJREVPXCIgfHwgdGFnID09PSBcIkNBTlZBU1wiIHx8IHRhZyA9PT0gXCJTT1VSQ0VcIikge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgfVxuICBpZiAoaXNOYXRpdmVPbihrZXkpICYmIGlzU3RyaW5nKHZhbHVlKSkge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuICByZXR1cm4ga2V5IGluIGVsO1xufVxuXG5jb25zdCBSRU1PVkFMID0ge307XG4vLyBAX19OT19TSURFX0VGRkVDVFNfX1xuZnVuY3Rpb24gZGVmaW5lQ3VzdG9tRWxlbWVudChvcHRpb25zLCBleHRyYU9wdGlvbnMsIF9jcmVhdGVBcHApIHtcbiAgbGV0IENvbXAgPSBkZWZpbmVDb21wb25lbnQob3B0aW9ucywgZXh0cmFPcHRpb25zKTtcbiAgaWYgKGlzUGxhaW5PYmplY3QoQ29tcCkpIENvbXAgPSBleHRlbmQoe30sIENvbXAsIGV4dHJhT3B0aW9ucyk7XG4gIGNsYXNzIFZ1ZUN1c3RvbUVsZW1lbnQgZXh0ZW5kcyBWdWVFbGVtZW50IHtcbiAgICBjb25zdHJ1Y3Rvcihpbml0aWFsUHJvcHMpIHtcbiAgICAgIHN1cGVyKENvbXAsIGluaXRpYWxQcm9wcywgX2NyZWF0ZUFwcCk7XG4gICAgfVxuICB9XG4gIFZ1ZUN1c3RvbUVsZW1lbnQuZGVmID0gQ29tcDtcbiAgcmV0dXJuIFZ1ZUN1c3RvbUVsZW1lbnQ7XG59XG5jb25zdCBkZWZpbmVTU1JDdXN0b21FbGVtZW50ID0gKC8qIEBfX05PX1NJREVfRUZGRUNUU19fICovIChvcHRpb25zLCBleHRyYU9wdGlvbnMpID0+IHtcbiAgcmV0dXJuIC8qIEBfX1BVUkVfXyAqLyBkZWZpbmVDdXN0b21FbGVtZW50KG9wdGlvbnMsIGV4dHJhT3B0aW9ucywgY3JlYXRlU1NSQXBwKTtcbn0pO1xuY29uc3QgQmFzZUNsYXNzID0gdHlwZW9mIEhUTUxFbGVtZW50ICE9PSBcInVuZGVmaW5lZFwiID8gSFRNTEVsZW1lbnQgOiBjbGFzcyB7XG59O1xuY2xhc3MgVnVlRWxlbWVudCBleHRlbmRzIEJhc2VDbGFzcyB7XG4gIGNvbnN0cnVjdG9yKF9kZWYsIF9wcm9wcyA9IHt9LCBfY3JlYXRlQXBwID0gY3JlYXRlQXBwKSB7XG4gICAgc3VwZXIoKTtcbiAgICB0aGlzLl9kZWYgPSBfZGVmO1xuICAgIHRoaXMuX3Byb3BzID0gX3Byb3BzO1xuICAgIHRoaXMuX2NyZWF0ZUFwcCA9IF9jcmVhdGVBcHA7XG4gICAgdGhpcy5faXNWdWVDRSA9IHRydWU7XG4gICAgLyoqXG4gICAgICogQGludGVybmFsXG4gICAgICovXG4gICAgdGhpcy5faW5zdGFuY2UgPSBudWxsO1xuICAgIC8qKlxuICAgICAqIEBpbnRlcm5hbFxuICAgICAqL1xuICAgIHRoaXMuX2FwcCA9IG51bGw7XG4gICAgLyoqXG4gICAgICogQGludGVybmFsXG4gICAgICovXG4gICAgdGhpcy5fbm9uY2UgPSB0aGlzLl9kZWYubm9uY2U7XG4gICAgdGhpcy5fY29ubmVjdGVkID0gZmFsc2U7XG4gICAgdGhpcy5fcmVzb2x2ZWQgPSBmYWxzZTtcbiAgICB0aGlzLl9wYXRjaGluZyA9IGZhbHNlO1xuICAgIHRoaXMuX2RpcnR5ID0gZmFsc2U7XG4gICAgdGhpcy5fbnVtYmVyUHJvcHMgPSBudWxsO1xuICAgIHRoaXMuX3N0eWxlQ2hpbGRyZW4gPSAvKiBAX19QVVJFX18gKi8gbmV3IFdlYWtTZXQoKTtcbiAgICB0aGlzLl9vYiA9IG51bGw7XG4gICAgaWYgKHRoaXMuc2hhZG93Um9vdCAmJiBfY3JlYXRlQXBwICE9PSBjcmVhdGVBcHApIHtcbiAgICAgIHRoaXMuX3Jvb3QgPSB0aGlzLnNoYWRvd1Jvb3Q7XG4gICAgfSBlbHNlIHtcbiAgICAgIGlmICghIShwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gXCJwcm9kdWN0aW9uXCIpICYmIHRoaXMuc2hhZG93Um9vdCkge1xuICAgICAgICB3YXJuKFxuICAgICAgICAgIGBDdXN0b20gZWxlbWVudCBoYXMgcHJlLXJlbmRlcmVkIGRlY2xhcmF0aXZlIHNoYWRvdyByb290IGJ1dCBpcyBub3QgZGVmaW5lZCBhcyBoeWRyYXRhYmxlLiBVc2UgXFxgZGVmaW5lU1NSQ3VzdG9tRWxlbWVudFxcYC5gXG4gICAgICAgICk7XG4gICAgICB9XG4gICAgICBpZiAoX2RlZi5zaGFkb3dSb290ICE9PSBmYWxzZSkge1xuICAgICAgICB0aGlzLmF0dGFjaFNoYWRvdyhcbiAgICAgICAgICBleHRlbmQoe30sIF9kZWYuc2hhZG93Um9vdE9wdGlvbnMsIHtcbiAgICAgICAgICAgIG1vZGU6IFwib3BlblwiXG4gICAgICAgICAgfSlcbiAgICAgICAgKTtcbiAgICAgICAgdGhpcy5fcm9vdCA9IHRoaXMuc2hhZG93Um9vdDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuX3Jvb3QgPSB0aGlzO1xuICAgICAgfVxuICAgIH1cbiAgfVxuICBjb25uZWN0ZWRDYWxsYmFjaygpIHtcbiAgICBpZiAoIXRoaXMuaXNDb25uZWN0ZWQpIHJldHVybjtcbiAgICBpZiAoIXRoaXMuc2hhZG93Um9vdCAmJiAhdGhpcy5fcmVzb2x2ZWQpIHtcbiAgICAgIHRoaXMuX3BhcnNlU2xvdHMoKTtcbiAgICB9XG4gICAgdGhpcy5fY29ubmVjdGVkID0gdHJ1ZTtcbiAgICBsZXQgcGFyZW50ID0gdGhpcztcbiAgICB3aGlsZSAocGFyZW50ID0gcGFyZW50ICYmIChwYXJlbnQucGFyZW50Tm9kZSB8fCBwYXJlbnQuaG9zdCkpIHtcbiAgICAgIGlmIChwYXJlbnQgaW5zdGFuY2VvZiBWdWVFbGVtZW50KSB7XG4gICAgICAgIHRoaXMuX3BhcmVudCA9IHBhcmVudDtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfVxuICAgIGlmICghdGhpcy5faW5zdGFuY2UpIHtcbiAgICAgIGlmICh0aGlzLl9yZXNvbHZlZCkge1xuICAgICAgICB0aGlzLl9tb3VudCh0aGlzLl9kZWYpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaWYgKHBhcmVudCAmJiBwYXJlbnQuX3BlbmRpbmdSZXNvbHZlKSB7XG4gICAgICAgICAgdGhpcy5fcGVuZGluZ1Jlc29sdmUgPSBwYXJlbnQuX3BlbmRpbmdSZXNvbHZlLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgdGhpcy5fcGVuZGluZ1Jlc29sdmUgPSB2b2lkIDA7XG4gICAgICAgICAgICB0aGlzLl9yZXNvbHZlRGVmKCk7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdGhpcy5fcmVzb2x2ZURlZigpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG4gIF9zZXRQYXJlbnQocGFyZW50ID0gdGhpcy5fcGFyZW50KSB7XG4gICAgaWYgKHBhcmVudCkge1xuICAgICAgdGhpcy5faW5zdGFuY2UucGFyZW50ID0gcGFyZW50Ll9pbnN0YW5jZTtcbiAgICAgIHRoaXMuX2luaGVyaXRQYXJlbnRDb250ZXh0KHBhcmVudCk7XG4gICAgfVxuICB9XG4gIF9pbmhlcml0UGFyZW50Q29udGV4dChwYXJlbnQgPSB0aGlzLl9wYXJlbnQpIHtcbiAgICBpZiAocGFyZW50ICYmIHRoaXMuX2FwcCkge1xuICAgICAgT2JqZWN0LnNldFByb3RvdHlwZU9mKFxuICAgICAgICB0aGlzLl9hcHAuX2NvbnRleHQucHJvdmlkZXMsXG4gICAgICAgIHBhcmVudC5faW5zdGFuY2UucHJvdmlkZXNcbiAgICAgICk7XG4gICAgfVxuICB9XG4gIGRpc2Nvbm5lY3RlZENhbGxiYWNrKCkge1xuICAgIHRoaXMuX2Nvbm5lY3RlZCA9IGZhbHNlO1xuICAgIG5leHRUaWNrKCgpID0+IHtcbiAgICAgIGlmICghdGhpcy5fY29ubmVjdGVkKSB7XG4gICAgICAgIGlmICh0aGlzLl9vYikge1xuICAgICAgICAgIHRoaXMuX29iLmRpc2Nvbm5lY3QoKTtcbiAgICAgICAgICB0aGlzLl9vYiA9IG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5fYXBwICYmIHRoaXMuX2FwcC51bm1vdW50KCk7XG4gICAgICAgIGlmICh0aGlzLl9pbnN0YW5jZSkgdGhpcy5faW5zdGFuY2UuY2UgPSB2b2lkIDA7XG4gICAgICAgIHRoaXMuX2FwcCA9IHRoaXMuX2luc3RhbmNlID0gbnVsbDtcbiAgICAgICAgaWYgKHRoaXMuX3RlbGVwb3J0VGFyZ2V0cykge1xuICAgICAgICAgIHRoaXMuX3RlbGVwb3J0VGFyZ2V0cy5jbGVhcigpO1xuICAgICAgICAgIHRoaXMuX3RlbGVwb3J0VGFyZ2V0cyA9IHZvaWQgMDtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0pO1xuICB9XG4gIF9wcm9jZXNzTXV0YXRpb25zKG11dGF0aW9ucykge1xuICAgIGZvciAoY29uc3QgbSBvZiBtdXRhdGlvbnMpIHtcbiAgICAgIHRoaXMuX3NldEF0dHIobS5hdHRyaWJ1dGVOYW1lKTtcbiAgICB9XG4gIH1cbiAgLyoqXG4gICAqIHJlc29sdmUgaW5uZXIgY29tcG9uZW50IGRlZmluaXRpb24gKGhhbmRsZSBwb3NzaWJsZSBhc3luYyBjb21wb25lbnQpXG4gICAqL1xuICBfcmVzb2x2ZURlZigpIHtcbiAgICBpZiAodGhpcy5fcGVuZGluZ1Jlc29sdmUpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLmF0dHJpYnV0ZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgIHRoaXMuX3NldEF0dHIodGhpcy5hdHRyaWJ1dGVzW2ldLm5hbWUpO1xuICAgIH1cbiAgICB0aGlzLl9vYiA9IG5ldyBNdXRhdGlvbk9ic2VydmVyKHRoaXMuX3Byb2Nlc3NNdXRhdGlvbnMuYmluZCh0aGlzKSk7XG4gICAgdGhpcy5fb2Iub2JzZXJ2ZSh0aGlzLCB7IGF0dHJpYnV0ZXM6IHRydWUgfSk7XG4gICAgY29uc3QgcmVzb2x2ZSA9IChkZWYsIGlzQXN5bmMgPSBmYWxzZSkgPT4ge1xuICAgICAgdGhpcy5fcmVzb2x2ZWQgPSB0cnVlO1xuICAgICAgdGhpcy5fcGVuZGluZ1Jlc29sdmUgPSB2b2lkIDA7XG4gICAgICBjb25zdCB7IHByb3BzLCBzdHlsZXMgfSA9IGRlZjtcbiAgICAgIGxldCBudW1iZXJQcm9wcztcbiAgICAgIGlmIChwcm9wcyAmJiAhaXNBcnJheShwcm9wcykpIHtcbiAgICAgICAgZm9yIChjb25zdCBrZXkgaW4gcHJvcHMpIHtcbiAgICAgICAgICBjb25zdCBvcHQgPSBwcm9wc1trZXldO1xuICAgICAgICAgIGlmIChvcHQgPT09IE51bWJlciB8fCBvcHQgJiYgb3B0LnR5cGUgPT09IE51bWJlcikge1xuICAgICAgICAgICAgaWYgKGtleSBpbiB0aGlzLl9wcm9wcykge1xuICAgICAgICAgICAgICB0aGlzLl9wcm9wc1trZXldID0gdG9OdW1iZXIodGhpcy5fcHJvcHNba2V5XSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAobnVtYmVyUHJvcHMgfHwgKG51bWJlclByb3BzID0gLyogQF9fUFVSRV9fICovIE9iamVjdC5jcmVhdGUobnVsbCkpKVtjYW1lbGl6ZSQxKGtleSldID0gdHJ1ZTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHRoaXMuX251bWJlclByb3BzID0gbnVtYmVyUHJvcHM7XG4gICAgICB0aGlzLl9yZXNvbHZlUHJvcHMoZGVmKTtcbiAgICAgIGlmICh0aGlzLnNoYWRvd1Jvb3QpIHtcbiAgICAgICAgdGhpcy5fYXBwbHlTdHlsZXMoc3R5bGVzKTtcbiAgICAgIH0gZWxzZSBpZiAoISEocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09IFwicHJvZHVjdGlvblwiKSAmJiBzdHlsZXMpIHtcbiAgICAgICAgd2FybihcbiAgICAgICAgICBcIkN1c3RvbSBlbGVtZW50IHN0eWxlIGluamVjdGlvbiBpcyBub3Qgc3VwcG9ydGVkIHdoZW4gdXNpbmcgc2hhZG93Um9vdDogZmFsc2VcIlxuICAgICAgICApO1xuICAgICAgfVxuICAgICAgdGhpcy5fbW91bnQoZGVmKTtcbiAgICB9O1xuICAgIGNvbnN0IGFzeW5jRGVmID0gdGhpcy5fZGVmLl9fYXN5bmNMb2FkZXI7XG4gICAgaWYgKGFzeW5jRGVmKSB7XG4gICAgICB0aGlzLl9wZW5kaW5nUmVzb2x2ZSA9IGFzeW5jRGVmKCkudGhlbigoZGVmKSA9PiB7XG4gICAgICAgIGRlZi5jb25maWd1cmVBcHAgPSB0aGlzLl9kZWYuY29uZmlndXJlQXBwO1xuICAgICAgICByZXNvbHZlKHRoaXMuX2RlZiA9IGRlZiwgdHJ1ZSk7XG4gICAgICB9KTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmVzb2x2ZSh0aGlzLl9kZWYpO1xuICAgIH1cbiAgfVxuICBfbW91bnQoZGVmKSB7XG4gICAgaWYgKCghIShwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gXCJwcm9kdWN0aW9uXCIpIHx8IF9fVlVFX1BST0RfREVWVE9PTFNfXykgJiYgIWRlZi5uYW1lKSB7XG4gICAgICBkZWYubmFtZSA9IFwiVnVlRWxlbWVudFwiO1xuICAgIH1cbiAgICB0aGlzLl9hcHAgPSB0aGlzLl9jcmVhdGVBcHAoZGVmKTtcbiAgICB0aGlzLl9pbmhlcml0UGFyZW50Q29udGV4dCgpO1xuICAgIGlmIChkZWYuY29uZmlndXJlQXBwKSB7XG4gICAgICBkZWYuY29uZmlndXJlQXBwKHRoaXMuX2FwcCk7XG4gICAgfVxuICAgIHRoaXMuX2FwcC5fY2VWTm9kZSA9IHRoaXMuX2NyZWF0ZVZOb2RlKCk7XG4gICAgdGhpcy5fYXBwLm1vdW50KHRoaXMuX3Jvb3QpO1xuICAgIGNvbnN0IGV4cG9zZWQgPSB0aGlzLl9pbnN0YW5jZSAmJiB0aGlzLl9pbnN0YW5jZS5leHBvc2VkO1xuICAgIGlmICghZXhwb3NlZCkgcmV0dXJuO1xuICAgIGZvciAoY29uc3Qga2V5IGluIGV4cG9zZWQpIHtcbiAgICAgIGlmICghaGFzT3duKHRoaXMsIGtleSkpIHtcbiAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRoaXMsIGtleSwge1xuICAgICAgICAgIC8vIHVud3JhcCByZWYgdG8gYmUgY29uc2lzdGVudCB3aXRoIHB1YmxpYyBpbnN0YW5jZSBiZWhhdmlvclxuICAgICAgICAgIGdldDogKCkgPT4gdW5yZWYoZXhwb3NlZFtrZXldKVxuICAgICAgICB9KTtcbiAgICAgIH0gZWxzZSBpZiAoISEocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09IFwicHJvZHVjdGlvblwiKSkge1xuICAgICAgICB3YXJuKGBFeHBvc2VkIHByb3BlcnR5IFwiJHtrZXl9XCIgYWxyZWFkeSBleGlzdHMgb24gY3VzdG9tIGVsZW1lbnQuYCk7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIF9yZXNvbHZlUHJvcHMoZGVmKSB7XG4gICAgY29uc3QgeyBwcm9wcyB9ID0gZGVmO1xuICAgIGNvbnN0IGRlY2xhcmVkUHJvcEtleXMgPSBpc0FycmF5KHByb3BzKSA/IHByb3BzIDogT2JqZWN0LmtleXMocHJvcHMgfHwge30pO1xuICAgIGZvciAoY29uc3Qga2V5IG9mIE9iamVjdC5rZXlzKHRoaXMpKSB7XG4gICAgICBpZiAoa2V5WzBdICE9PSBcIl9cIiAmJiBkZWNsYXJlZFByb3BLZXlzLmluY2x1ZGVzKGtleSkpIHtcbiAgICAgICAgdGhpcy5fc2V0UHJvcChrZXksIHRoaXNba2V5XSk7XG4gICAgICB9XG4gICAgfVxuICAgIGZvciAoY29uc3Qga2V5IG9mIGRlY2xhcmVkUHJvcEtleXMubWFwKGNhbWVsaXplJDEpKSB7XG4gICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkodGhpcywga2V5LCB7XG4gICAgICAgIGdldCgpIHtcbiAgICAgICAgICByZXR1cm4gdGhpcy5fZ2V0UHJvcChrZXkpO1xuICAgICAgICB9LFxuICAgICAgICBzZXQodmFsKSB7XG4gICAgICAgICAgdGhpcy5fc2V0UHJvcChrZXksIHZhbCwgdHJ1ZSwgIXRoaXMuX3BhdGNoaW5nKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfVxuICB9XG4gIF9zZXRBdHRyKGtleSkge1xuICAgIGlmIChrZXkuc3RhcnRzV2l0aChcImRhdGEtdi1cIikpIHJldHVybjtcbiAgICBjb25zdCBoYXMgPSB0aGlzLmhhc0F0dHJpYnV0ZShrZXkpO1xuICAgIGxldCB2YWx1ZSA9IGhhcyA/IHRoaXMuZ2V0QXR0cmlidXRlKGtleSkgOiBSRU1PVkFMO1xuICAgIGNvbnN0IGNhbWVsS2V5ID0gY2FtZWxpemUkMShrZXkpO1xuICAgIGlmIChoYXMgJiYgdGhpcy5fbnVtYmVyUHJvcHMgJiYgdGhpcy5fbnVtYmVyUHJvcHNbY2FtZWxLZXldKSB7XG4gICAgICB2YWx1ZSA9IHRvTnVtYmVyKHZhbHVlKTtcbiAgICB9XG4gICAgdGhpcy5fc2V0UHJvcChjYW1lbEtleSwgdmFsdWUsIGZhbHNlLCB0cnVlKTtcbiAgfVxuICAvKipcbiAgICogQGludGVybmFsXG4gICAqL1xuICBfZ2V0UHJvcChrZXkpIHtcbiAgICByZXR1cm4gdGhpcy5fcHJvcHNba2V5XTtcbiAgfVxuICAvKipcbiAgICogQGludGVybmFsXG4gICAqL1xuICBfc2V0UHJvcChrZXksIHZhbCwgc2hvdWxkUmVmbGVjdCA9IHRydWUsIHNob3VsZFVwZGF0ZSA9IGZhbHNlKSB7XG4gICAgaWYgKHZhbCAhPT0gdGhpcy5fcHJvcHNba2V5XSkge1xuICAgICAgdGhpcy5fZGlydHkgPSB0cnVlO1xuICAgICAgaWYgKHZhbCA9PT0gUkVNT1ZBTCkge1xuICAgICAgICBkZWxldGUgdGhpcy5fcHJvcHNba2V5XTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuX3Byb3BzW2tleV0gPSB2YWw7XG4gICAgICAgIGlmIChrZXkgPT09IFwia2V5XCIgJiYgdGhpcy5fYXBwKSB7XG4gICAgICAgICAgdGhpcy5fYXBwLl9jZVZOb2RlLmtleSA9IHZhbDtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgaWYgKHNob3VsZFVwZGF0ZSAmJiB0aGlzLl9pbnN0YW5jZSkge1xuICAgICAgICB0aGlzLl91cGRhdGUoKTtcbiAgICAgIH1cbiAgICAgIGlmIChzaG91bGRSZWZsZWN0KSB7XG4gICAgICAgIGNvbnN0IG9iID0gdGhpcy5fb2I7XG4gICAgICAgIGlmIChvYikge1xuICAgICAgICAgIHRoaXMuX3Byb2Nlc3NNdXRhdGlvbnMob2IudGFrZVJlY29yZHMoKSk7XG4gICAgICAgICAgb2IuZGlzY29ubmVjdCgpO1xuICAgICAgICB9XG4gICAgICAgIGlmICh2YWwgPT09IHRydWUpIHtcbiAgICAgICAgICB0aGlzLnNldEF0dHJpYnV0ZShoeXBoZW5hdGUoa2V5KSwgXCJcIik7XG4gICAgICAgIH0gZWxzZSBpZiAodHlwZW9mIHZhbCA9PT0gXCJzdHJpbmdcIiB8fCB0eXBlb2YgdmFsID09PSBcIm51bWJlclwiKSB7XG4gICAgICAgICAgdGhpcy5zZXRBdHRyaWJ1dGUoaHlwaGVuYXRlKGtleSksIHZhbCArIFwiXCIpO1xuICAgICAgICB9IGVsc2UgaWYgKCF2YWwpIHtcbiAgICAgICAgICB0aGlzLnJlbW92ZUF0dHJpYnV0ZShoeXBoZW5hdGUoa2V5KSk7XG4gICAgICAgIH1cbiAgICAgICAgb2IgJiYgb2Iub2JzZXJ2ZSh0aGlzLCB7IGF0dHJpYnV0ZXM6IHRydWUgfSk7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIF91cGRhdGUoKSB7XG4gICAgY29uc3Qgdm5vZGUgPSB0aGlzLl9jcmVhdGVWTm9kZSgpO1xuICAgIGlmICh0aGlzLl9hcHApIHZub2RlLmFwcENvbnRleHQgPSB0aGlzLl9hcHAuX2NvbnRleHQ7XG4gICAgcmVuZGVyKHZub2RlLCB0aGlzLl9yb290KTtcbiAgfVxuICBfY3JlYXRlVk5vZGUoKSB7XG4gICAgY29uc3QgYmFzZVByb3BzID0ge307XG4gICAgaWYgKCF0aGlzLnNoYWRvd1Jvb3QpIHtcbiAgICAgIGJhc2VQcm9wcy5vblZub2RlTW91bnRlZCA9IGJhc2VQcm9wcy5vblZub2RlVXBkYXRlZCA9IHRoaXMuX3JlbmRlclNsb3RzLmJpbmQodGhpcyk7XG4gICAgfVxuICAgIGNvbnN0IHZub2RlID0gY3JlYXRlVk5vZGUodGhpcy5fZGVmLCBleHRlbmQoYmFzZVByb3BzLCB0aGlzLl9wcm9wcykpO1xuICAgIGlmICghdGhpcy5faW5zdGFuY2UpIHtcbiAgICAgIHZub2RlLmNlID0gKGluc3RhbmNlKSA9PiB7XG4gICAgICAgIHRoaXMuX2luc3RhbmNlID0gaW5zdGFuY2U7XG4gICAgICAgIGluc3RhbmNlLmNlID0gdGhpcztcbiAgICAgICAgaW5zdGFuY2UuaXNDRSA9IHRydWU7XG4gICAgICAgIGlmICghIShwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gXCJwcm9kdWN0aW9uXCIpKSB7XG4gICAgICAgICAgaW5zdGFuY2UuY2VSZWxvYWQgPSAobmV3U3R5bGVzKSA9PiB7XG4gICAgICAgICAgICBpZiAodGhpcy5fc3R5bGVzKSB7XG4gICAgICAgICAgICAgIHRoaXMuX3N0eWxlcy5mb3JFYWNoKChzKSA9PiB0aGlzLl9yb290LnJlbW92ZUNoaWxkKHMpKTtcbiAgICAgICAgICAgICAgdGhpcy5fc3R5bGVzLmxlbmd0aCA9IDA7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLl9hcHBseVN0eWxlcyhuZXdTdHlsZXMpO1xuICAgICAgICAgICAgdGhpcy5faW5zdGFuY2UgPSBudWxsO1xuICAgICAgICAgICAgdGhpcy5fdXBkYXRlKCk7XG4gICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBkaXNwYXRjaCA9IChldmVudCwgYXJncykgPT4ge1xuICAgICAgICAgIHRoaXMuZGlzcGF0Y2hFdmVudChcbiAgICAgICAgICAgIG5ldyBDdXN0b21FdmVudChcbiAgICAgICAgICAgICAgZXZlbnQsXG4gICAgICAgICAgICAgIGlzUGxhaW5PYmplY3QoYXJnc1swXSkgPyBleHRlbmQoeyBkZXRhaWw6IGFyZ3MgfSwgYXJnc1swXSkgOiB7IGRldGFpbDogYXJncyB9XG4gICAgICAgICAgICApXG4gICAgICAgICAgKTtcbiAgICAgICAgfTtcbiAgICAgICAgaW5zdGFuY2UuZW1pdCA9IChldmVudCwgLi4uYXJncykgPT4ge1xuICAgICAgICAgIGRpc3BhdGNoKGV2ZW50LCBhcmdzKTtcbiAgICAgICAgICBpZiAoaHlwaGVuYXRlKGV2ZW50KSAhPT0gZXZlbnQpIHtcbiAgICAgICAgICAgIGRpc3BhdGNoKGh5cGhlbmF0ZShldmVudCksIGFyZ3MpO1xuICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgICAgdGhpcy5fc2V0UGFyZW50KCk7XG4gICAgICB9O1xuICAgIH1cbiAgICByZXR1cm4gdm5vZGU7XG4gIH1cbiAgX2FwcGx5U3R5bGVzKHN0eWxlcywgb3duZXIpIHtcbiAgICBpZiAoIXN0eWxlcykgcmV0dXJuO1xuICAgIGlmIChvd25lcikge1xuICAgICAgaWYgKG93bmVyID09PSB0aGlzLl9kZWYgfHwgdGhpcy5fc3R5bGVDaGlsZHJlbi5oYXMob3duZXIpKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIHRoaXMuX3N0eWxlQ2hpbGRyZW4uYWRkKG93bmVyKTtcbiAgICB9XG4gICAgY29uc3Qgbm9uY2UgPSB0aGlzLl9ub25jZTtcbiAgICBmb3IgKGxldCBpID0gc3R5bGVzLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAgICBjb25zdCBzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInN0eWxlXCIpO1xuICAgICAgaWYgKG5vbmNlKSBzLnNldEF0dHJpYnV0ZShcIm5vbmNlXCIsIG5vbmNlKTtcbiAgICAgIHMudGV4dENvbnRlbnQgPSBzdHlsZXNbaV07XG4gICAgICB0aGlzLnNoYWRvd1Jvb3QucHJlcGVuZChzKTtcbiAgICAgIGlmICghIShwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gXCJwcm9kdWN0aW9uXCIpKSB7XG4gICAgICAgIGlmIChvd25lcikge1xuICAgICAgICAgIGlmIChvd25lci5fX2htcklkKSB7XG4gICAgICAgICAgICBpZiAoIXRoaXMuX2NoaWxkU3R5bGVzKSB0aGlzLl9jaGlsZFN0eWxlcyA9IC8qIEBfX1BVUkVfXyAqLyBuZXcgTWFwKCk7XG4gICAgICAgICAgICBsZXQgZW50cnkgPSB0aGlzLl9jaGlsZFN0eWxlcy5nZXQob3duZXIuX19obXJJZCk7XG4gICAgICAgICAgICBpZiAoIWVudHJ5KSB7XG4gICAgICAgICAgICAgIHRoaXMuX2NoaWxkU3R5bGVzLnNldChvd25lci5fX2htcklkLCBlbnRyeSA9IFtdKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVudHJ5LnB1c2gocyk7XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICh0aGlzLl9zdHlsZXMgfHwgKHRoaXMuX3N0eWxlcyA9IFtdKSkucHVzaChzKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuICAvKipcbiAgICogT25seSBjYWxsZWQgd2hlbiBzaGFkb3dSb290IGlzIGZhbHNlXG4gICAqL1xuICBfcGFyc2VTbG90cygpIHtcbiAgICBjb25zdCBzbG90cyA9IHRoaXMuX3Nsb3RzID0ge307XG4gICAgbGV0IG47XG4gICAgd2hpbGUgKG4gPSB0aGlzLmZpcnN0Q2hpbGQpIHtcbiAgICAgIGNvbnN0IHNsb3ROYW1lID0gbi5ub2RlVHlwZSA9PT0gMSAmJiBuLmdldEF0dHJpYnV0ZShcInNsb3RcIikgfHwgXCJkZWZhdWx0XCI7XG4gICAgICAoc2xvdHNbc2xvdE5hbWVdIHx8IChzbG90c1tzbG90TmFtZV0gPSBbXSkpLnB1c2gobik7XG4gICAgICB0aGlzLnJlbW92ZUNoaWxkKG4pO1xuICAgIH1cbiAgfVxuICAvKipcbiAgICogT25seSBjYWxsZWQgd2hlbiBzaGFkb3dSb290IGlzIGZhbHNlXG4gICAqL1xuICBfcmVuZGVyU2xvdHMoKSB7XG4gICAgY29uc3Qgb3V0bGV0cyA9IHRoaXMuX2dldFNsb3RzKCk7XG4gICAgY29uc3Qgc2NvcGVJZCA9IHRoaXMuX2luc3RhbmNlLnR5cGUuX19zY29wZUlkO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgb3V0bGV0cy5sZW5ndGg7IGkrKykge1xuICAgICAgY29uc3QgbyA9IG91dGxldHNbaV07XG4gICAgICBjb25zdCBzbG90TmFtZSA9IG8uZ2V0QXR0cmlidXRlKFwibmFtZVwiKSB8fCBcImRlZmF1bHRcIjtcbiAgICAgIGNvbnN0IGNvbnRlbnQgPSB0aGlzLl9zbG90c1tzbG90TmFtZV07XG4gICAgICBjb25zdCBwYXJlbnQgPSBvLnBhcmVudE5vZGU7XG4gICAgICBpZiAoY29udGVudCkge1xuICAgICAgICBmb3IgKGNvbnN0IG4gb2YgY29udGVudCkge1xuICAgICAgICAgIGlmIChzY29wZUlkICYmIG4ubm9kZVR5cGUgPT09IDEpIHtcbiAgICAgICAgICAgIGNvbnN0IGlkID0gc2NvcGVJZCArIFwiLXNcIjtcbiAgICAgICAgICAgIGNvbnN0IHdhbGtlciA9IGRvY3VtZW50LmNyZWF0ZVRyZWVXYWxrZXIobiwgMSk7XG4gICAgICAgICAgICBuLnNldEF0dHJpYnV0ZShpZCwgXCJcIik7XG4gICAgICAgICAgICBsZXQgY2hpbGQ7XG4gICAgICAgICAgICB3aGlsZSAoY2hpbGQgPSB3YWxrZXIubmV4dE5vZGUoKSkge1xuICAgICAgICAgICAgICBjaGlsZC5zZXRBdHRyaWJ1dGUoaWQsIFwiXCIpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICBwYXJlbnQuaW5zZXJ0QmVmb3JlKG4sIG8pO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB3aGlsZSAoby5maXJzdENoaWxkKSBwYXJlbnQuaW5zZXJ0QmVmb3JlKG8uZmlyc3RDaGlsZCwgbyk7XG4gICAgICB9XG4gICAgICBwYXJlbnQucmVtb3ZlQ2hpbGQobyk7XG4gICAgfVxuICB9XG4gIC8qKlxuICAgKiBAaW50ZXJuYWxcbiAgICovXG4gIF9nZXRTbG90cygpIHtcbiAgICBjb25zdCByb290cyA9IFt0aGlzXTtcbiAgICBpZiAodGhpcy5fdGVsZXBvcnRUYXJnZXRzKSB7XG4gICAgICByb290cy5wdXNoKC4uLnRoaXMuX3RlbGVwb3J0VGFyZ2V0cyk7XG4gICAgfVxuICAgIGNvbnN0IHNsb3RzID0gLyogQF9fUFVSRV9fICovIG5ldyBTZXQoKTtcbiAgICBmb3IgKGNvbnN0IHJvb3Qgb2Ygcm9vdHMpIHtcbiAgICAgIGNvbnN0IGZvdW5kID0gcm9vdC5xdWVyeVNlbGVjdG9yQWxsKFwic2xvdFwiKTtcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZm91bmQubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgc2xvdHMuYWRkKGZvdW5kW2ldKTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIEFycmF5LmZyb20oc2xvdHMpO1xuICB9XG4gIC8qKlxuICAgKiBAaW50ZXJuYWxcbiAgICovXG4gIF9pbmplY3RDaGlsZFN0eWxlKGNvbXApIHtcbiAgICB0aGlzLl9hcHBseVN0eWxlcyhjb21wLnN0eWxlcywgY29tcCk7XG4gIH1cbiAgLyoqXG4gICAqIEBpbnRlcm5hbFxuICAgKi9cbiAgX2JlZ2luUGF0Y2goKSB7XG4gICAgdGhpcy5fcGF0Y2hpbmcgPSB0cnVlO1xuICAgIHRoaXMuX2RpcnR5ID0gZmFsc2U7XG4gIH1cbiAgLyoqXG4gICAqIEBpbnRlcm5hbFxuICAgKi9cbiAgX2VuZFBhdGNoKCkge1xuICAgIHRoaXMuX3BhdGNoaW5nID0gZmFsc2U7XG4gICAgaWYgKHRoaXMuX2RpcnR5ICYmIHRoaXMuX2luc3RhbmNlKSB7XG4gICAgICB0aGlzLl91cGRhdGUoKTtcbiAgICB9XG4gIH1cbiAgLyoqXG4gICAqIEBpbnRlcm5hbFxuICAgKi9cbiAgX2hhc1NoYWRvd1Jvb3QoKSB7XG4gICAgcmV0dXJuIHRoaXMuX2RlZi5zaGFkb3dSb290ICE9PSBmYWxzZTtcbiAgfVxuICAvKipcbiAgICogQGludGVybmFsXG4gICAqL1xuICBfcmVtb3ZlQ2hpbGRTdHlsZShjb21wKSB7XG4gICAgaWYgKCEhKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSBcInByb2R1Y3Rpb25cIikpIHtcbiAgICAgIHRoaXMuX3N0eWxlQ2hpbGRyZW4uZGVsZXRlKGNvbXApO1xuICAgICAgaWYgKHRoaXMuX2NoaWxkU3R5bGVzICYmIGNvbXAuX19obXJJZCkge1xuICAgICAgICBjb25zdCBvbGRTdHlsZXMgPSB0aGlzLl9jaGlsZFN0eWxlcy5nZXQoY29tcC5fX2htcklkKTtcbiAgICAgICAgaWYgKG9sZFN0eWxlcykge1xuICAgICAgICAgIG9sZFN0eWxlcy5mb3JFYWNoKChzKSA9PiB0aGlzLl9yb290LnJlbW92ZUNoaWxkKHMpKTtcbiAgICAgICAgICBvbGRTdHlsZXMubGVuZ3RoID0gMDtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxufVxuZnVuY3Rpb24gdXNlSG9zdChjYWxsZXIpIHtcbiAgY29uc3QgaW5zdGFuY2UgPSBnZXRDdXJyZW50SW5zdGFuY2UoKTtcbiAgY29uc3QgZWwgPSBpbnN0YW5jZSAmJiBpbnN0YW5jZS5jZTtcbiAgaWYgKGVsKSB7XG4gICAgcmV0dXJuIGVsO1xuICB9IGVsc2UgaWYgKCEhKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSBcInByb2R1Y3Rpb25cIikpIHtcbiAgICBpZiAoIWluc3RhbmNlKSB7XG4gICAgICB3YXJuKFxuICAgICAgICBgJHtjYWxsZXIgfHwgXCJ1c2VIb3N0XCJ9IGNhbGxlZCB3aXRob3V0IGFuIGFjdGl2ZSBjb21wb25lbnQgaW5zdGFuY2UuYFxuICAgICAgKTtcbiAgICB9IGVsc2Uge1xuICAgICAgd2FybihcbiAgICAgICAgYCR7Y2FsbGVyIHx8IFwidXNlSG9zdFwifSBjYW4gb25seSBiZSB1c2VkIGluIGNvbXBvbmVudHMgZGVmaW5lZCB2aWEgZGVmaW5lQ3VzdG9tRWxlbWVudC5gXG4gICAgICApO1xuICAgIH1cbiAgfVxuICByZXR1cm4gbnVsbDtcbn1cbmZ1bmN0aW9uIHVzZVNoYWRvd1Jvb3QoKSB7XG4gIGNvbnN0IGVsID0gISEocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09IFwicHJvZHVjdGlvblwiKSA/IHVzZUhvc3QoXCJ1c2VTaGFkb3dSb290XCIpIDogdXNlSG9zdCgpO1xuICByZXR1cm4gZWwgJiYgZWwuc2hhZG93Um9vdDtcbn1cblxuZnVuY3Rpb24gdXNlQ3NzTW9kdWxlKG5hbWUgPSBcIiRzdHlsZVwiKSB7XG4gIHtcbiAgICBjb25zdCBpbnN0YW5jZSA9IGdldEN1cnJlbnRJbnN0YW5jZSgpO1xuICAgIGlmICghaW5zdGFuY2UpIHtcbiAgICAgICEhKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSBcInByb2R1Y3Rpb25cIikgJiYgd2FybihgdXNlQ3NzTW9kdWxlIG11c3QgYmUgY2FsbGVkIGluc2lkZSBzZXR1cCgpYCk7XG4gICAgICByZXR1cm4gRU1QVFlfT0JKO1xuICAgIH1cbiAgICBjb25zdCBtb2R1bGVzID0gaW5zdGFuY2UudHlwZS5fX2Nzc01vZHVsZXM7XG4gICAgaWYgKCFtb2R1bGVzKSB7XG4gICAgICAhIShwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gXCJwcm9kdWN0aW9uXCIpICYmIHdhcm4oYEN1cnJlbnQgaW5zdGFuY2UgZG9lcyBub3QgaGF2ZSBDU1MgbW9kdWxlcyBpbmplY3RlZC5gKTtcbiAgICAgIHJldHVybiBFTVBUWV9PQko7XG4gICAgfVxuICAgIGNvbnN0IG1vZCA9IG1vZHVsZXNbbmFtZV07XG4gICAgaWYgKCFtb2QpIHtcbiAgICAgICEhKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSBcInByb2R1Y3Rpb25cIikgJiYgd2FybihgQ3VycmVudCBpbnN0YW5jZSBkb2VzIG5vdCBoYXZlIENTUyBtb2R1bGUgbmFtZWQgXCIke25hbWV9XCIuYCk7XG4gICAgICByZXR1cm4gRU1QVFlfT0JKO1xuICAgIH1cbiAgICByZXR1cm4gbW9kO1xuICB9XG59XG5cbmNvbnN0IHBvc2l0aW9uTWFwID0gLyogQF9fUFVSRV9fICovIG5ldyBXZWFrTWFwKCk7XG5jb25zdCBuZXdQb3NpdGlvbk1hcCA9IC8qIEBfX1BVUkVfXyAqLyBuZXcgV2Vha01hcCgpO1xuY29uc3QgbW92ZUNiS2V5ID0gLyogQF9fUFVSRV9fICovIFN5bWJvbChcIl9tb3ZlQ2JcIik7XG5jb25zdCBlbnRlckNiS2V5ID0gLyogQF9fUFVSRV9fICovIFN5bWJvbChcIl9lbnRlckNiXCIpO1xuY29uc3QgZGVjb3JhdGUgPSAodCkgPT4ge1xuICBkZWxldGUgdC5wcm9wcy5tb2RlO1xuICByZXR1cm4gdDtcbn07XG5jb25zdCBUcmFuc2l0aW9uR3JvdXBJbXBsID0gLyogQF9fUFVSRV9fICovIGRlY29yYXRlKHtcbiAgbmFtZTogXCJUcmFuc2l0aW9uR3JvdXBcIixcbiAgcHJvcHM6IC8qIEBfX1BVUkVfXyAqLyBleHRlbmQoe30sIFRyYW5zaXRpb25Qcm9wc1ZhbGlkYXRvcnMsIHtcbiAgICB0YWc6IFN0cmluZyxcbiAgICBtb3ZlQ2xhc3M6IFN0cmluZ1xuICB9KSxcbiAgc2V0dXAocHJvcHMsIHsgc2xvdHMgfSkge1xuICAgIGNvbnN0IGluc3RhbmNlID0gZ2V0Q3VycmVudEluc3RhbmNlKCk7XG4gICAgY29uc3Qgc3RhdGUgPSB1c2VUcmFuc2l0aW9uU3RhdGUoKTtcbiAgICBsZXQgcHJldkNoaWxkcmVuO1xuICAgIGxldCBjaGlsZHJlbjtcbiAgICBvblVwZGF0ZWQoKCkgPT4ge1xuICAgICAgaWYgKCFwcmV2Q2hpbGRyZW4ubGVuZ3RoKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIGNvbnN0IG1vdmVDbGFzcyA9IHByb3BzLm1vdmVDbGFzcyB8fCBgJHtwcm9wcy5uYW1lIHx8IFwidlwifS1tb3ZlYDtcbiAgICAgIGlmICghaGFzQ1NTVHJhbnNmb3JtKFxuICAgICAgICBwcmV2Q2hpbGRyZW5bMF0uZWwsXG4gICAgICAgIGluc3RhbmNlLnZub2RlLmVsLFxuICAgICAgICBtb3ZlQ2xhc3NcbiAgICAgICkpIHtcbiAgICAgICAgcHJldkNoaWxkcmVuID0gW107XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIHByZXZDaGlsZHJlbi5mb3JFYWNoKGNhbGxQZW5kaW5nQ2JzKTtcbiAgICAgIHByZXZDaGlsZHJlbi5mb3JFYWNoKHJlY29yZFBvc2l0aW9uKTtcbiAgICAgIGNvbnN0IG1vdmVkQ2hpbGRyZW4gPSBwcmV2Q2hpbGRyZW4uZmlsdGVyKGFwcGx5VHJhbnNsYXRpb24pO1xuICAgICAgZm9yY2VSZWZsb3coaW5zdGFuY2Uudm5vZGUuZWwpO1xuICAgICAgbW92ZWRDaGlsZHJlbi5mb3JFYWNoKChjKSA9PiB7XG4gICAgICAgIGNvbnN0IGVsID0gYy5lbDtcbiAgICAgICAgY29uc3Qgc3R5bGUgPSBlbC5zdHlsZTtcbiAgICAgICAgYWRkVHJhbnNpdGlvbkNsYXNzKGVsLCBtb3ZlQ2xhc3MpO1xuICAgICAgICBzdHlsZS50cmFuc2Zvcm0gPSBzdHlsZS53ZWJraXRUcmFuc2Zvcm0gPSBzdHlsZS50cmFuc2l0aW9uRHVyYXRpb24gPSBcIlwiO1xuICAgICAgICBjb25zdCBjYiA9IGVsW21vdmVDYktleV0gPSAoZSkgPT4ge1xuICAgICAgICAgIGlmIChlICYmIGUudGFyZ2V0ICE9PSBlbCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAoIWUgfHwgZS5wcm9wZXJ0eU5hbWUuZW5kc1dpdGgoXCJ0cmFuc2Zvcm1cIikpIHtcbiAgICAgICAgICAgIGVsLnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJ0cmFuc2l0aW9uZW5kXCIsIGNiKTtcbiAgICAgICAgICAgIGVsW21vdmVDYktleV0gPSBudWxsO1xuICAgICAgICAgICAgcmVtb3ZlVHJhbnNpdGlvbkNsYXNzKGVsLCBtb3ZlQ2xhc3MpO1xuICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgICAgZWwuYWRkRXZlbnRMaXN0ZW5lcihcInRyYW5zaXRpb25lbmRcIiwgY2IpO1xuICAgICAgfSk7XG4gICAgICBwcmV2Q2hpbGRyZW4gPSBbXTtcbiAgICB9KTtcbiAgICByZXR1cm4gKCkgPT4ge1xuICAgICAgY29uc3QgcmF3UHJvcHMgPSB0b1Jhdyhwcm9wcyk7XG4gICAgICBjb25zdCBjc3NUcmFuc2l0aW9uUHJvcHMgPSByZXNvbHZlVHJhbnNpdGlvblByb3BzKHJhd1Byb3BzKTtcbiAgICAgIGxldCB0YWcgPSByYXdQcm9wcy50YWcgfHwgRnJhZ21lbnQ7XG4gICAgICBwcmV2Q2hpbGRyZW4gPSBbXTtcbiAgICAgIGlmIChjaGlsZHJlbikge1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGNoaWxkcmVuLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgY29uc3QgY2hpbGQgPSBjaGlsZHJlbltpXTtcbiAgICAgICAgICBpZiAoY2hpbGQuZWwgJiYgY2hpbGQuZWwgaW5zdGFuY2VvZiBFbGVtZW50KSB7XG4gICAgICAgICAgICBwcmV2Q2hpbGRyZW4ucHVzaChjaGlsZCk7XG4gICAgICAgICAgICBzZXRUcmFuc2l0aW9uSG9va3MoXG4gICAgICAgICAgICAgIGNoaWxkLFxuICAgICAgICAgICAgICByZXNvbHZlVHJhbnNpdGlvbkhvb2tzKFxuICAgICAgICAgICAgICAgIGNoaWxkLFxuICAgICAgICAgICAgICAgIGNzc1RyYW5zaXRpb25Qcm9wcyxcbiAgICAgICAgICAgICAgICBzdGF0ZSxcbiAgICAgICAgICAgICAgICBpbnN0YW5jZVxuICAgICAgICAgICAgICApXG4gICAgICAgICAgICApO1xuICAgICAgICAgICAgcG9zaXRpb25NYXAuc2V0KGNoaWxkLCBnZXRQb3NpdGlvbihjaGlsZC5lbCkpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgY2hpbGRyZW4gPSBzbG90cy5kZWZhdWx0ID8gZ2V0VHJhbnNpdGlvblJhd0NoaWxkcmVuKHNsb3RzLmRlZmF1bHQoKSkgOiBbXTtcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgY2hpbGRyZW4ubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgY29uc3QgY2hpbGQgPSBjaGlsZHJlbltpXTtcbiAgICAgICAgaWYgKGNoaWxkLmtleSAhPSBudWxsKSB7XG4gICAgICAgICAgc2V0VHJhbnNpdGlvbkhvb2tzKFxuICAgICAgICAgICAgY2hpbGQsXG4gICAgICAgICAgICByZXNvbHZlVHJhbnNpdGlvbkhvb2tzKGNoaWxkLCBjc3NUcmFuc2l0aW9uUHJvcHMsIHN0YXRlLCBpbnN0YW5jZSlcbiAgICAgICAgICApO1xuICAgICAgICB9IGVsc2UgaWYgKCEhKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSBcInByb2R1Y3Rpb25cIikgJiYgY2hpbGQudHlwZSAhPT0gVGV4dCkge1xuICAgICAgICAgIHdhcm4oYDxUcmFuc2l0aW9uR3JvdXA+IGNoaWxkcmVuIG11c3QgYmUga2V5ZWQuYCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHJldHVybiBjcmVhdGVWTm9kZSh0YWcsIG51bGwsIGNoaWxkcmVuKTtcbiAgICB9O1xuICB9XG59KTtcbmNvbnN0IFRyYW5zaXRpb25Hcm91cCA9IFRyYW5zaXRpb25Hcm91cEltcGw7XG5mdW5jdGlvbiBjYWxsUGVuZGluZ0NicyhjKSB7XG4gIGNvbnN0IGVsID0gYy5lbDtcbiAgaWYgKGVsW21vdmVDYktleV0pIHtcbiAgICBlbFttb3ZlQ2JLZXldKCk7XG4gIH1cbiAgaWYgKGVsW2VudGVyQ2JLZXldKSB7XG4gICAgZWxbZW50ZXJDYktleV0oKTtcbiAgfVxufVxuZnVuY3Rpb24gcmVjb3JkUG9zaXRpb24oYykge1xuICBuZXdQb3NpdGlvbk1hcC5zZXQoYywgZ2V0UG9zaXRpb24oYy5lbCkpO1xufVxuZnVuY3Rpb24gYXBwbHlUcmFuc2xhdGlvbihjKSB7XG4gIGNvbnN0IG9sZFBvcyA9IHBvc2l0aW9uTWFwLmdldChjKTtcbiAgY29uc3QgbmV3UG9zID0gbmV3UG9zaXRpb25NYXAuZ2V0KGMpO1xuICBjb25zdCBkeCA9IG9sZFBvcy5sZWZ0IC0gbmV3UG9zLmxlZnQ7XG4gIGNvbnN0IGR5ID0gb2xkUG9zLnRvcCAtIG5ld1Bvcy50b3A7XG4gIGlmIChkeCB8fCBkeSkge1xuICAgIGNvbnN0IGVsID0gYy5lbDtcbiAgICBjb25zdCBzID0gZWwuc3R5bGU7XG4gICAgY29uc3QgcmVjdCA9IGVsLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICAgIGxldCBzY2FsZVggPSAxO1xuICAgIGxldCBzY2FsZVkgPSAxO1xuICAgIGlmIChlbC5vZmZzZXRXaWR0aCkgc2NhbGVYID0gcmVjdC53aWR0aCAvIGVsLm9mZnNldFdpZHRoO1xuICAgIGlmIChlbC5vZmZzZXRIZWlnaHQpIHNjYWxlWSA9IHJlY3QuaGVpZ2h0IC8gZWwub2Zmc2V0SGVpZ2h0O1xuICAgIGlmICghTnVtYmVyLmlzRmluaXRlKHNjYWxlWCkgfHwgc2NhbGVYID09PSAwKSBzY2FsZVggPSAxO1xuICAgIGlmICghTnVtYmVyLmlzRmluaXRlKHNjYWxlWSkgfHwgc2NhbGVZID09PSAwKSBzY2FsZVkgPSAxO1xuICAgIGlmIChNYXRoLmFicyhzY2FsZVggLSAxKSA8IDAuMDEpIHNjYWxlWCA9IDE7XG4gICAgaWYgKE1hdGguYWJzKHNjYWxlWSAtIDEpIDwgMC4wMSkgc2NhbGVZID0gMTtcbiAgICBzLnRyYW5zZm9ybSA9IHMud2Via2l0VHJhbnNmb3JtID0gYHRyYW5zbGF0ZSgke2R4IC8gc2NhbGVYfXB4LCR7ZHkgLyBzY2FsZVl9cHgpYDtcbiAgICBzLnRyYW5zaXRpb25EdXJhdGlvbiA9IFwiMHNcIjtcbiAgICByZXR1cm4gYztcbiAgfVxufVxuZnVuY3Rpb24gZ2V0UG9zaXRpb24oZWwpIHtcbiAgY29uc3QgcmVjdCA9IGVsLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICByZXR1cm4ge1xuICAgIGxlZnQ6IHJlY3QubGVmdCxcbiAgICB0b3A6IHJlY3QudG9wXG4gIH07XG59XG5mdW5jdGlvbiBoYXNDU1NUcmFuc2Zvcm0oZWwsIHJvb3QsIG1vdmVDbGFzcykge1xuICBjb25zdCBjbG9uZSA9IGVsLmNsb25lTm9kZSgpO1xuICBjb25zdCBfdnRjID0gZWxbdnRjS2V5XTtcbiAgaWYgKF92dGMpIHtcbiAgICBfdnRjLmZvckVhY2goKGNscykgPT4ge1xuICAgICAgY2xzLnNwbGl0KC9cXHMrLykuZm9yRWFjaCgoYykgPT4gYyAmJiBjbG9uZS5jbGFzc0xpc3QucmVtb3ZlKGMpKTtcbiAgICB9KTtcbiAgfVxuICBtb3ZlQ2xhc3Muc3BsaXQoL1xccysvKS5mb3JFYWNoKChjKSA9PiBjICYmIGNsb25lLmNsYXNzTGlzdC5hZGQoYykpO1xuICBjbG9uZS5zdHlsZS5kaXNwbGF5ID0gXCJub25lXCI7XG4gIGNvbnN0IGNvbnRhaW5lciA9IHJvb3Qubm9kZVR5cGUgPT09IDEgPyByb290IDogcm9vdC5wYXJlbnROb2RlO1xuICBjb250YWluZXIuYXBwZW5kQ2hpbGQoY2xvbmUpO1xuICBjb25zdCB7IGhhc1RyYW5zZm9ybSB9ID0gZ2V0VHJhbnNpdGlvbkluZm8oY2xvbmUpO1xuICBjb250YWluZXIucmVtb3ZlQ2hpbGQoY2xvbmUpO1xuICByZXR1cm4gaGFzVHJhbnNmb3JtO1xufVxuXG5jb25zdCBnZXRNb2RlbEFzc2lnbmVyID0gKHZub2RlKSA9PiB7XG4gIGNvbnN0IGZuID0gdm5vZGUucHJvcHNbXCJvblVwZGF0ZTptb2RlbFZhbHVlXCJdIHx8IGZhbHNlO1xuICByZXR1cm4gaXNBcnJheShmbikgPyAodmFsdWUpID0+IGludm9rZUFycmF5Rm5zKGZuLCB2YWx1ZSkgOiBmbjtcbn07XG5mdW5jdGlvbiBvbkNvbXBvc2l0aW9uU3RhcnQoZSkge1xuICBlLnRhcmdldC5jb21wb3NpbmcgPSB0cnVlO1xufVxuZnVuY3Rpb24gb25Db21wb3NpdGlvbkVuZChlKSB7XG4gIGNvbnN0IHRhcmdldCA9IGUudGFyZ2V0O1xuICBpZiAodGFyZ2V0LmNvbXBvc2luZykge1xuICAgIHRhcmdldC5jb21wb3NpbmcgPSBmYWxzZTtcbiAgICB0YXJnZXQuZGlzcGF0Y2hFdmVudChuZXcgRXZlbnQoXCJpbnB1dFwiKSk7XG4gIH1cbn1cbmNvbnN0IGFzc2lnbktleSA9IC8qIEBfX1BVUkVfXyAqLyBTeW1ib2woXCJfYXNzaWduXCIpO1xuZnVuY3Rpb24gY2FzdFZhbHVlKHZhbHVlLCB0cmltLCBudW1iZXIpIHtcbiAgaWYgKHRyaW0pIHZhbHVlID0gdmFsdWUudHJpbSgpO1xuICBpZiAobnVtYmVyKSB2YWx1ZSA9IGxvb3NlVG9OdW1iZXIodmFsdWUpO1xuICByZXR1cm4gdmFsdWU7XG59XG5jb25zdCB2TW9kZWxUZXh0ID0ge1xuICBjcmVhdGVkKGVsLCB7IG1vZGlmaWVyczogeyBsYXp5LCB0cmltLCBudW1iZXIgfSB9LCB2bm9kZSkge1xuICAgIGVsW2Fzc2lnbktleV0gPSBnZXRNb2RlbEFzc2lnbmVyKHZub2RlKTtcbiAgICBjb25zdCBjYXN0VG9OdW1iZXIgPSBudW1iZXIgfHwgdm5vZGUucHJvcHMgJiYgdm5vZGUucHJvcHMudHlwZSA9PT0gXCJudW1iZXJcIjtcbiAgICBhZGRFdmVudExpc3RlbmVyKGVsLCBsYXp5ID8gXCJjaGFuZ2VcIiA6IFwiaW5wdXRcIiwgKGUpID0+IHtcbiAgICAgIGlmIChlLnRhcmdldC5jb21wb3NpbmcpIHJldHVybjtcbiAgICAgIGVsW2Fzc2lnbktleV0oY2FzdFZhbHVlKGVsLnZhbHVlLCB0cmltLCBjYXN0VG9OdW1iZXIpKTtcbiAgICB9KTtcbiAgICBpZiAodHJpbSB8fCBjYXN0VG9OdW1iZXIpIHtcbiAgICAgIGFkZEV2ZW50TGlzdGVuZXIoZWwsIFwiY2hhbmdlXCIsICgpID0+IHtcbiAgICAgICAgZWwudmFsdWUgPSBjYXN0VmFsdWUoZWwudmFsdWUsIHRyaW0sIGNhc3RUb051bWJlcik7XG4gICAgICB9KTtcbiAgICB9XG4gICAgaWYgKCFsYXp5KSB7XG4gICAgICBhZGRFdmVudExpc3RlbmVyKGVsLCBcImNvbXBvc2l0aW9uc3RhcnRcIiwgb25Db21wb3NpdGlvblN0YXJ0KTtcbiAgICAgIGFkZEV2ZW50TGlzdGVuZXIoZWwsIFwiY29tcG9zaXRpb25lbmRcIiwgb25Db21wb3NpdGlvbkVuZCk7XG4gICAgICBhZGRFdmVudExpc3RlbmVyKGVsLCBcImNoYW5nZVwiLCBvbkNvbXBvc2l0aW9uRW5kKTtcbiAgICB9XG4gIH0sXG4gIC8vIHNldCB2YWx1ZSBvbiBtb3VudGVkIHNvIGl0J3MgYWZ0ZXIgbWluL21heCBmb3IgdHlwZT1cInJhbmdlXCJcbiAgbW91bnRlZChlbCwgeyB2YWx1ZSB9KSB7XG4gICAgZWwudmFsdWUgPSB2YWx1ZSA9PSBudWxsID8gXCJcIiA6IHZhbHVlO1xuICB9LFxuICBiZWZvcmVVcGRhdGUoZWwsIHsgdmFsdWUsIG9sZFZhbHVlLCBtb2RpZmllcnM6IHsgbGF6eSwgdHJpbSwgbnVtYmVyIH0gfSwgdm5vZGUpIHtcbiAgICBlbFthc3NpZ25LZXldID0gZ2V0TW9kZWxBc3NpZ25lcih2bm9kZSk7XG4gICAgaWYgKGVsLmNvbXBvc2luZykgcmV0dXJuO1xuICAgIGNvbnN0IGVsVmFsdWUgPSAobnVtYmVyIHx8IGVsLnR5cGUgPT09IFwibnVtYmVyXCIpICYmICEvXjBcXGQvLnRlc3QoZWwudmFsdWUpID8gbG9vc2VUb051bWJlcihlbC52YWx1ZSkgOiBlbC52YWx1ZTtcbiAgICBjb25zdCBuZXdWYWx1ZSA9IHZhbHVlID09IG51bGwgPyBcIlwiIDogdmFsdWU7XG4gICAgaWYgKGVsVmFsdWUgPT09IG5ld1ZhbHVlKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGlmIChkb2N1bWVudC5hY3RpdmVFbGVtZW50ID09PSBlbCAmJiBlbC50eXBlICE9PSBcInJhbmdlXCIpIHtcbiAgICAgIGlmIChsYXp5ICYmIHZhbHVlID09PSBvbGRWYWx1ZSkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBpZiAodHJpbSAmJiBlbC52YWx1ZS50cmltKCkgPT09IG5ld1ZhbHVlKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICB9XG4gICAgZWwudmFsdWUgPSBuZXdWYWx1ZTtcbiAgfVxufTtcbmNvbnN0IHZNb2RlbENoZWNrYm94ID0ge1xuICAvLyAjNDA5NiBhcnJheSBjaGVja2JveGVzIG5lZWQgdG8gYmUgZGVlcCB0cmF2ZXJzZWRcbiAgZGVlcDogdHJ1ZSxcbiAgY3JlYXRlZChlbCwgXywgdm5vZGUpIHtcbiAgICBlbFthc3NpZ25LZXldID0gZ2V0TW9kZWxBc3NpZ25lcih2bm9kZSk7XG4gICAgYWRkRXZlbnRMaXN0ZW5lcihlbCwgXCJjaGFuZ2VcIiwgKCkgPT4ge1xuICAgICAgY29uc3QgbW9kZWxWYWx1ZSA9IGVsLl9tb2RlbFZhbHVlO1xuICAgICAgY29uc3QgZWxlbWVudFZhbHVlID0gZ2V0VmFsdWUoZWwpO1xuICAgICAgY29uc3QgY2hlY2tlZCA9IGVsLmNoZWNrZWQ7XG4gICAgICBjb25zdCBhc3NpZ24gPSBlbFthc3NpZ25LZXldO1xuICAgICAgaWYgKGlzQXJyYXkobW9kZWxWYWx1ZSkpIHtcbiAgICAgICAgY29uc3QgaW5kZXggPSBsb29zZUluZGV4T2YobW9kZWxWYWx1ZSwgZWxlbWVudFZhbHVlKTtcbiAgICAgICAgY29uc3QgZm91bmQgPSBpbmRleCAhPT0gLTE7XG4gICAgICAgIGlmIChjaGVja2VkICYmICFmb3VuZCkge1xuICAgICAgICAgIGFzc2lnbihtb2RlbFZhbHVlLmNvbmNhdChlbGVtZW50VmFsdWUpKTtcbiAgICAgICAgfSBlbHNlIGlmICghY2hlY2tlZCAmJiBmb3VuZCkge1xuICAgICAgICAgIGNvbnN0IGZpbHRlcmVkID0gWy4uLm1vZGVsVmFsdWVdO1xuICAgICAgICAgIGZpbHRlcmVkLnNwbGljZShpbmRleCwgMSk7XG4gICAgICAgICAgYXNzaWduKGZpbHRlcmVkKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIGlmIChpc1NldChtb2RlbFZhbHVlKSkge1xuICAgICAgICBjb25zdCBjbG9uZWQgPSBuZXcgU2V0KG1vZGVsVmFsdWUpO1xuICAgICAgICBpZiAoY2hlY2tlZCkge1xuICAgICAgICAgIGNsb25lZC5hZGQoZWxlbWVudFZhbHVlKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBjbG9uZWQuZGVsZXRlKGVsZW1lbnRWYWx1ZSk7XG4gICAgICAgIH1cbiAgICAgICAgYXNzaWduKGNsb25lZCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBhc3NpZ24oZ2V0Q2hlY2tib3hWYWx1ZShlbCwgY2hlY2tlZCkpO1xuICAgICAgfVxuICAgIH0pO1xuICB9LFxuICAvLyBzZXQgaW5pdGlhbCBjaGVja2VkIG9uIG1vdW50IHRvIHdhaXQgZm9yIHRydWUtdmFsdWUvZmFsc2UtdmFsdWVcbiAgbW91bnRlZDogc2V0Q2hlY2tlZCxcbiAgYmVmb3JlVXBkYXRlKGVsLCBiaW5kaW5nLCB2bm9kZSkge1xuICAgIGVsW2Fzc2lnbktleV0gPSBnZXRNb2RlbEFzc2lnbmVyKHZub2RlKTtcbiAgICBzZXRDaGVja2VkKGVsLCBiaW5kaW5nLCB2bm9kZSk7XG4gIH1cbn07XG5mdW5jdGlvbiBzZXRDaGVja2VkKGVsLCB7IHZhbHVlLCBvbGRWYWx1ZSB9LCB2bm9kZSkge1xuICBlbC5fbW9kZWxWYWx1ZSA9IHZhbHVlO1xuICBsZXQgY2hlY2tlZDtcbiAgaWYgKGlzQXJyYXkodmFsdWUpKSB7XG4gICAgY2hlY2tlZCA9IGxvb3NlSW5kZXhPZih2YWx1ZSwgdm5vZGUucHJvcHMudmFsdWUpID4gLTE7XG4gIH0gZWxzZSBpZiAoaXNTZXQodmFsdWUpKSB7XG4gICAgY2hlY2tlZCA9IHZhbHVlLmhhcyh2bm9kZS5wcm9wcy52YWx1ZSk7XG4gIH0gZWxzZSB7XG4gICAgaWYgKHZhbHVlID09PSBvbGRWYWx1ZSkgcmV0dXJuO1xuICAgIGNoZWNrZWQgPSBsb29zZUVxdWFsKHZhbHVlLCBnZXRDaGVja2JveFZhbHVlKGVsLCB0cnVlKSk7XG4gIH1cbiAgaWYgKGVsLmNoZWNrZWQgIT09IGNoZWNrZWQpIHtcbiAgICBlbC5jaGVja2VkID0gY2hlY2tlZDtcbiAgfVxufVxuY29uc3Qgdk1vZGVsUmFkaW8gPSB7XG4gIGNyZWF0ZWQoZWwsIHsgdmFsdWUgfSwgdm5vZGUpIHtcbiAgICBlbC5jaGVja2VkID0gbG9vc2VFcXVhbCh2YWx1ZSwgdm5vZGUucHJvcHMudmFsdWUpO1xuICAgIGVsW2Fzc2lnbktleV0gPSBnZXRNb2RlbEFzc2lnbmVyKHZub2RlKTtcbiAgICBhZGRFdmVudExpc3RlbmVyKGVsLCBcImNoYW5nZVwiLCAoKSA9PiB7XG4gICAgICBlbFthc3NpZ25LZXldKGdldFZhbHVlKGVsKSk7XG4gICAgfSk7XG4gIH0sXG4gIGJlZm9yZVVwZGF0ZShlbCwgeyB2YWx1ZSwgb2xkVmFsdWUgfSwgdm5vZGUpIHtcbiAgICBlbFthc3NpZ25LZXldID0gZ2V0TW9kZWxBc3NpZ25lcih2bm9kZSk7XG4gICAgaWYgKHZhbHVlICE9PSBvbGRWYWx1ZSkge1xuICAgICAgZWwuY2hlY2tlZCA9IGxvb3NlRXF1YWwodmFsdWUsIHZub2RlLnByb3BzLnZhbHVlKTtcbiAgICB9XG4gIH1cbn07XG5jb25zdCB2TW9kZWxTZWxlY3QgPSB7XG4gIC8vIDxzZWxlY3QgbXVsdGlwbGU+IHZhbHVlIG5lZWQgdG8gYmUgZGVlcCB0cmF2ZXJzZWRcbiAgZGVlcDogdHJ1ZSxcbiAgY3JlYXRlZChlbCwgeyB2YWx1ZSwgbW9kaWZpZXJzOiB7IG51bWJlciB9IH0sIHZub2RlKSB7XG4gICAgY29uc3QgaXNTZXRNb2RlbCA9IGlzU2V0KHZhbHVlKTtcbiAgICBhZGRFdmVudExpc3RlbmVyKGVsLCBcImNoYW5nZVwiLCAoKSA9PiB7XG4gICAgICBjb25zdCBzZWxlY3RlZFZhbCA9IEFycmF5LnByb3RvdHlwZS5maWx0ZXIuY2FsbChlbC5vcHRpb25zLCAobykgPT4gby5zZWxlY3RlZCkubWFwKFxuICAgICAgICAobykgPT4gbnVtYmVyID8gbG9vc2VUb051bWJlcihnZXRWYWx1ZShvKSkgOiBnZXRWYWx1ZShvKVxuICAgICAgKTtcbiAgICAgIGVsW2Fzc2lnbktleV0oXG4gICAgICAgIGVsLm11bHRpcGxlID8gaXNTZXRNb2RlbCA/IG5ldyBTZXQoc2VsZWN0ZWRWYWwpIDogc2VsZWN0ZWRWYWwgOiBzZWxlY3RlZFZhbFswXVxuICAgICAgKTtcbiAgICAgIGVsLl9hc3NpZ25pbmcgPSB0cnVlO1xuICAgICAgbmV4dFRpY2soKCkgPT4ge1xuICAgICAgICBlbC5fYXNzaWduaW5nID0gZmFsc2U7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgICBlbFthc3NpZ25LZXldID0gZ2V0TW9kZWxBc3NpZ25lcih2bm9kZSk7XG4gIH0sXG4gIC8vIHNldCB2YWx1ZSBpbiBtb3VudGVkICYgdXBkYXRlZCBiZWNhdXNlIDxzZWxlY3Q+IHJlbGllcyBvbiBpdHMgY2hpbGRyZW5cbiAgLy8gPG9wdGlvbj5zLlxuICBtb3VudGVkKGVsLCB7IHZhbHVlIH0pIHtcbiAgICBzZXRTZWxlY3RlZChlbCwgdmFsdWUpO1xuICB9LFxuICBiZWZvcmVVcGRhdGUoZWwsIF9iaW5kaW5nLCB2bm9kZSkge1xuICAgIGVsW2Fzc2lnbktleV0gPSBnZXRNb2RlbEFzc2lnbmVyKHZub2RlKTtcbiAgfSxcbiAgdXBkYXRlZChlbCwgeyB2YWx1ZSB9KSB7XG4gICAgaWYgKCFlbC5fYXNzaWduaW5nKSB7XG4gICAgICBzZXRTZWxlY3RlZChlbCwgdmFsdWUpO1xuICAgIH1cbiAgfVxufTtcbmZ1bmN0aW9uIHNldFNlbGVjdGVkKGVsLCB2YWx1ZSkge1xuICBjb25zdCBpc011bHRpcGxlID0gZWwubXVsdGlwbGU7XG4gIGNvbnN0IGlzQXJyYXlWYWx1ZSA9IGlzQXJyYXkodmFsdWUpO1xuICBpZiAoaXNNdWx0aXBsZSAmJiAhaXNBcnJheVZhbHVlICYmICFpc1NldCh2YWx1ZSkpIHtcbiAgICAhIShwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gXCJwcm9kdWN0aW9uXCIpICYmIHdhcm4oXG4gICAgICBgPHNlbGVjdCBtdWx0aXBsZSB2LW1vZGVsPiBleHBlY3RzIGFuIEFycmF5IG9yIFNldCB2YWx1ZSBmb3IgaXRzIGJpbmRpbmcsIGJ1dCBnb3QgJHtPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwodmFsdWUpLnNsaWNlKDgsIC0xKX0uYFxuICAgICk7XG4gICAgcmV0dXJuO1xuICB9XG4gIGZvciAobGV0IGkgPSAwLCBsID0gZWwub3B0aW9ucy5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICBjb25zdCBvcHRpb24gPSBlbC5vcHRpb25zW2ldO1xuICAgIGNvbnN0IG9wdGlvblZhbHVlID0gZ2V0VmFsdWUob3B0aW9uKTtcbiAgICBpZiAoaXNNdWx0aXBsZSkge1xuICAgICAgaWYgKGlzQXJyYXlWYWx1ZSkge1xuICAgICAgICBjb25zdCBvcHRpb25UeXBlID0gdHlwZW9mIG9wdGlvblZhbHVlO1xuICAgICAgICBpZiAob3B0aW9uVHlwZSA9PT0gXCJzdHJpbmdcIiB8fCBvcHRpb25UeXBlID09PSBcIm51bWJlclwiKSB7XG4gICAgICAgICAgb3B0aW9uLnNlbGVjdGVkID0gdmFsdWUuc29tZSgodikgPT4gU3RyaW5nKHYpID09PSBTdHJpbmcob3B0aW9uVmFsdWUpKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBvcHRpb24uc2VsZWN0ZWQgPSBsb29zZUluZGV4T2YodmFsdWUsIG9wdGlvblZhbHVlKSA+IC0xO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBvcHRpb24uc2VsZWN0ZWQgPSB2YWx1ZS5oYXMob3B0aW9uVmFsdWUpO1xuICAgICAgfVxuICAgIH0gZWxzZSBpZiAobG9vc2VFcXVhbChnZXRWYWx1ZShvcHRpb24pLCB2YWx1ZSkpIHtcbiAgICAgIGlmIChlbC5zZWxlY3RlZEluZGV4ICE9PSBpKSBlbC5zZWxlY3RlZEluZGV4ID0gaTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gIH1cbiAgaWYgKCFpc011bHRpcGxlICYmIGVsLnNlbGVjdGVkSW5kZXggIT09IC0xKSB7XG4gICAgZWwuc2VsZWN0ZWRJbmRleCA9IC0xO1xuICB9XG59XG5mdW5jdGlvbiBnZXRWYWx1ZShlbCkge1xuICByZXR1cm4gXCJfdmFsdWVcIiBpbiBlbCA/IGVsLl92YWx1ZSA6IGVsLnZhbHVlO1xufVxuZnVuY3Rpb24gZ2V0Q2hlY2tib3hWYWx1ZShlbCwgY2hlY2tlZCkge1xuICBjb25zdCBrZXkgPSBjaGVja2VkID8gXCJfdHJ1ZVZhbHVlXCIgOiBcIl9mYWxzZVZhbHVlXCI7XG4gIHJldHVybiBrZXkgaW4gZWwgPyBlbFtrZXldIDogY2hlY2tlZDtcbn1cbmNvbnN0IHZNb2RlbER5bmFtaWMgPSB7XG4gIGNyZWF0ZWQoZWwsIGJpbmRpbmcsIHZub2RlKSB7XG4gICAgY2FsbE1vZGVsSG9vayhlbCwgYmluZGluZywgdm5vZGUsIG51bGwsIFwiY3JlYXRlZFwiKTtcbiAgfSxcbiAgbW91bnRlZChlbCwgYmluZGluZywgdm5vZGUpIHtcbiAgICBjYWxsTW9kZWxIb29rKGVsLCBiaW5kaW5nLCB2bm9kZSwgbnVsbCwgXCJtb3VudGVkXCIpO1xuICB9LFxuICBiZWZvcmVVcGRhdGUoZWwsIGJpbmRpbmcsIHZub2RlLCBwcmV2Vk5vZGUpIHtcbiAgICBjYWxsTW9kZWxIb29rKGVsLCBiaW5kaW5nLCB2bm9kZSwgcHJldlZOb2RlLCBcImJlZm9yZVVwZGF0ZVwiKTtcbiAgfSxcbiAgdXBkYXRlZChlbCwgYmluZGluZywgdm5vZGUsIHByZXZWTm9kZSkge1xuICAgIGNhbGxNb2RlbEhvb2soZWwsIGJpbmRpbmcsIHZub2RlLCBwcmV2Vk5vZGUsIFwidXBkYXRlZFwiKTtcbiAgfVxufTtcbmZ1bmN0aW9uIHJlc29sdmVEeW5hbWljTW9kZWwodGFnTmFtZSwgdHlwZSkge1xuICBzd2l0Y2ggKHRhZ05hbWUpIHtcbiAgICBjYXNlIFwiU0VMRUNUXCI6XG4gICAgICByZXR1cm4gdk1vZGVsU2VsZWN0O1xuICAgIGNhc2UgXCJURVhUQVJFQVwiOlxuICAgICAgcmV0dXJuIHZNb2RlbFRleHQ7XG4gICAgZGVmYXVsdDpcbiAgICAgIHN3aXRjaCAodHlwZSkge1xuICAgICAgICBjYXNlIFwiY2hlY2tib3hcIjpcbiAgICAgICAgICByZXR1cm4gdk1vZGVsQ2hlY2tib3g7XG4gICAgICAgIGNhc2UgXCJyYWRpb1wiOlxuICAgICAgICAgIHJldHVybiB2TW9kZWxSYWRpbztcbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICByZXR1cm4gdk1vZGVsVGV4dDtcbiAgICAgIH1cbiAgfVxufVxuZnVuY3Rpb24gY2FsbE1vZGVsSG9vayhlbCwgYmluZGluZywgdm5vZGUsIHByZXZWTm9kZSwgaG9vaykge1xuICBjb25zdCBtb2RlbFRvVXNlID0gcmVzb2x2ZUR5bmFtaWNNb2RlbChcbiAgICBlbC50YWdOYW1lLFxuICAgIHZub2RlLnByb3BzICYmIHZub2RlLnByb3BzLnR5cGVcbiAgKTtcbiAgY29uc3QgZm4gPSBtb2RlbFRvVXNlW2hvb2tdO1xuICBmbiAmJiBmbihlbCwgYmluZGluZywgdm5vZGUsIHByZXZWTm9kZSk7XG59XG5mdW5jdGlvbiBpbml0Vk1vZGVsRm9yU1NSKCkge1xuICB2TW9kZWxUZXh0LmdldFNTUlByb3BzID0gKHsgdmFsdWUgfSkgPT4gKHsgdmFsdWUgfSk7XG4gIHZNb2RlbFJhZGlvLmdldFNTUlByb3BzID0gKHsgdmFsdWUgfSwgdm5vZGUpID0+IHtcbiAgICBpZiAodm5vZGUucHJvcHMgJiYgbG9vc2VFcXVhbCh2bm9kZS5wcm9wcy52YWx1ZSwgdmFsdWUpKSB7XG4gICAgICByZXR1cm4geyBjaGVja2VkOiB0cnVlIH07XG4gICAgfVxuICB9O1xuICB2TW9kZWxDaGVja2JveC5nZXRTU1JQcm9wcyA9ICh7IHZhbHVlIH0sIHZub2RlKSA9PiB7XG4gICAgaWYgKGlzQXJyYXkodmFsdWUpKSB7XG4gICAgICBpZiAodm5vZGUucHJvcHMgJiYgbG9vc2VJbmRleE9mKHZhbHVlLCB2bm9kZS5wcm9wcy52YWx1ZSkgPiAtMSkge1xuICAgICAgICByZXR1cm4geyBjaGVja2VkOiB0cnVlIH07XG4gICAgICB9XG4gICAgfSBlbHNlIGlmIChpc1NldCh2YWx1ZSkpIHtcbiAgICAgIGlmICh2bm9kZS5wcm9wcyAmJiB2YWx1ZS5oYXModm5vZGUucHJvcHMudmFsdWUpKSB7XG4gICAgICAgIHJldHVybiB7IGNoZWNrZWQ6IHRydWUgfTtcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKHZhbHVlKSB7XG4gICAgICByZXR1cm4geyBjaGVja2VkOiB0cnVlIH07XG4gICAgfVxuICB9O1xuICB2TW9kZWxEeW5hbWljLmdldFNTUlByb3BzID0gKGJpbmRpbmcsIHZub2RlKSA9PiB7XG4gICAgaWYgKHR5cGVvZiB2bm9kZS50eXBlICE9PSBcInN0cmluZ1wiKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGNvbnN0IG1vZGVsVG9Vc2UgPSByZXNvbHZlRHluYW1pY01vZGVsKFxuICAgICAgLy8gcmVzb2x2ZUR5bmFtaWNNb2RlbCBleHBlY3RzIGFuIHVwcGVyY2FzZSB0YWcgbmFtZSwgYnV0IHZub2RlLnR5cGUgaXMgbG93ZXJjYXNlXG4gICAgICB2bm9kZS50eXBlLnRvVXBwZXJDYXNlKCksXG4gICAgICB2bm9kZS5wcm9wcyAmJiB2bm9kZS5wcm9wcy50eXBlXG4gICAgKTtcbiAgICBpZiAobW9kZWxUb1VzZS5nZXRTU1JQcm9wcykge1xuICAgICAgcmV0dXJuIG1vZGVsVG9Vc2UuZ2V0U1NSUHJvcHMoYmluZGluZywgdm5vZGUpO1xuICAgIH1cbiAgfTtcbn1cblxuY29uc3Qgc3lzdGVtTW9kaWZpZXJzID0gW1wiY3RybFwiLCBcInNoaWZ0XCIsIFwiYWx0XCIsIFwibWV0YVwiXTtcbmNvbnN0IG1vZGlmaWVyR3VhcmRzID0ge1xuICBzdG9wOiAoZSkgPT4gZS5zdG9wUHJvcGFnYXRpb24oKSxcbiAgcHJldmVudDogKGUpID0+IGUucHJldmVudERlZmF1bHQoKSxcbiAgc2VsZjogKGUpID0+IGUudGFyZ2V0ICE9PSBlLmN1cnJlbnRUYXJnZXQsXG4gIGN0cmw6IChlKSA9PiAhZS5jdHJsS2V5LFxuICBzaGlmdDogKGUpID0+ICFlLnNoaWZ0S2V5LFxuICBhbHQ6IChlKSA9PiAhZS5hbHRLZXksXG4gIG1ldGE6IChlKSA9PiAhZS5tZXRhS2V5LFxuICBsZWZ0OiAoZSkgPT4gXCJidXR0b25cIiBpbiBlICYmIGUuYnV0dG9uICE9PSAwLFxuICBtaWRkbGU6IChlKSA9PiBcImJ1dHRvblwiIGluIGUgJiYgZS5idXR0b24gIT09IDEsXG4gIHJpZ2h0OiAoZSkgPT4gXCJidXR0b25cIiBpbiBlICYmIGUuYnV0dG9uICE9PSAyLFxuICBleGFjdDogKGUsIG1vZGlmaWVycykgPT4gc3lzdGVtTW9kaWZpZXJzLnNvbWUoKG0pID0+IGVbYCR7bX1LZXlgXSAmJiAhbW9kaWZpZXJzLmluY2x1ZGVzKG0pKVxufTtcbmNvbnN0IHdpdGhNb2RpZmllcnMgPSAoZm4sIG1vZGlmaWVycykgPT4ge1xuICBpZiAoIWZuKSByZXR1cm4gZm47XG4gIGNvbnN0IGNhY2hlID0gZm4uX3dpdGhNb2RzIHx8IChmbi5fd2l0aE1vZHMgPSB7fSk7XG4gIGNvbnN0IGNhY2hlS2V5ID0gbW9kaWZpZXJzLmpvaW4oXCIuXCIpO1xuICByZXR1cm4gY2FjaGVbY2FjaGVLZXldIHx8IChjYWNoZVtjYWNoZUtleV0gPSAoKGV2ZW50LCAuLi5hcmdzKSA9PiB7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBtb2RpZmllcnMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGNvbnN0IGd1YXJkID0gbW9kaWZpZXJHdWFyZHNbbW9kaWZpZXJzW2ldXTtcbiAgICAgIGlmIChndWFyZCAmJiBndWFyZChldmVudCwgbW9kaWZpZXJzKSkgcmV0dXJuO1xuICAgIH1cbiAgICByZXR1cm4gZm4oZXZlbnQsIC4uLmFyZ3MpO1xuICB9KSk7XG59O1xuY29uc3Qga2V5TmFtZXMgPSB7XG4gIGVzYzogXCJlc2NhcGVcIixcbiAgc3BhY2U6IFwiIFwiLFxuICB1cDogXCJhcnJvdy11cFwiLFxuICBsZWZ0OiBcImFycm93LWxlZnRcIixcbiAgcmlnaHQ6IFwiYXJyb3ctcmlnaHRcIixcbiAgZG93bjogXCJhcnJvdy1kb3duXCIsXG4gIGRlbGV0ZTogXCJiYWNrc3BhY2VcIlxufTtcbmNvbnN0IHdpdGhLZXlzID0gKGZuLCBtb2RpZmllcnMpID0+IHtcbiAgY29uc3QgY2FjaGUgPSBmbi5fd2l0aEtleXMgfHwgKGZuLl93aXRoS2V5cyA9IHt9KTtcbiAgY29uc3QgY2FjaGVLZXkgPSBtb2RpZmllcnMuam9pbihcIi5cIik7XG4gIHJldHVybiBjYWNoZVtjYWNoZUtleV0gfHwgKGNhY2hlW2NhY2hlS2V5XSA9ICgoZXZlbnQpID0+IHtcbiAgICBpZiAoIShcImtleVwiIGluIGV2ZW50KSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBjb25zdCBldmVudEtleSA9IGh5cGhlbmF0ZShldmVudC5rZXkpO1xuICAgIGlmIChtb2RpZmllcnMuc29tZShcbiAgICAgIChrKSA9PiBrID09PSBldmVudEtleSB8fCBrZXlOYW1lc1trXSA9PT0gZXZlbnRLZXlcbiAgICApKSB7XG4gICAgICByZXR1cm4gZm4oZXZlbnQpO1xuICAgIH1cbiAgfSkpO1xufTtcblxuY29uc3QgcmVuZGVyZXJPcHRpb25zID0gLyogQF9fUFVSRV9fICovIGV4dGVuZCh7IHBhdGNoUHJvcCB9LCBub2RlT3BzKTtcbmxldCByZW5kZXJlcjtcbmxldCBlbmFibGVkSHlkcmF0aW9uID0gZmFsc2U7XG5mdW5jdGlvbiBlbnN1cmVSZW5kZXJlcigpIHtcbiAgcmV0dXJuIHJlbmRlcmVyIHx8IChyZW5kZXJlciA9IGNyZWF0ZVJlbmRlcmVyKHJlbmRlcmVyT3B0aW9ucykpO1xufVxuZnVuY3Rpb24gZW5zdXJlSHlkcmF0aW9uUmVuZGVyZXIoKSB7XG4gIHJlbmRlcmVyID0gZW5hYmxlZEh5ZHJhdGlvbiA/IHJlbmRlcmVyIDogY3JlYXRlSHlkcmF0aW9uUmVuZGVyZXIocmVuZGVyZXJPcHRpb25zKTtcbiAgZW5hYmxlZEh5ZHJhdGlvbiA9IHRydWU7XG4gIHJldHVybiByZW5kZXJlcjtcbn1cbmNvbnN0IHJlbmRlciA9ICgoLi4uYXJncykgPT4ge1xuICBlbnN1cmVSZW5kZXJlcigpLnJlbmRlciguLi5hcmdzKTtcbn0pO1xuY29uc3QgaHlkcmF0ZSA9ICgoLi4uYXJncykgPT4ge1xuICBlbnN1cmVIeWRyYXRpb25SZW5kZXJlcigpLmh5ZHJhdGUoLi4uYXJncyk7XG59KTtcbmNvbnN0IGNyZWF0ZUFwcCA9ICgoLi4uYXJncykgPT4ge1xuICBjb25zdCBhcHAgPSBlbnN1cmVSZW5kZXJlcigpLmNyZWF0ZUFwcCguLi5hcmdzKTtcbiAgaWYgKCEhKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSBcInByb2R1Y3Rpb25cIikpIHtcbiAgICBpbmplY3ROYXRpdmVUYWdDaGVjayhhcHApO1xuICAgIGluamVjdENvbXBpbGVyT3B0aW9uc0NoZWNrKGFwcCk7XG4gIH1cbiAgY29uc3QgeyBtb3VudCB9ID0gYXBwO1xuICBhcHAubW91bnQgPSAoY29udGFpbmVyT3JTZWxlY3RvcikgPT4ge1xuICAgIGNvbnN0IGNvbnRhaW5lciA9IG5vcm1hbGl6ZUNvbnRhaW5lcihjb250YWluZXJPclNlbGVjdG9yKTtcbiAgICBpZiAoIWNvbnRhaW5lcikgcmV0dXJuO1xuICAgIGNvbnN0IGNvbXBvbmVudCA9IGFwcC5fY29tcG9uZW50O1xuICAgIGlmICghaXNGdW5jdGlvbihjb21wb25lbnQpICYmICFjb21wb25lbnQucmVuZGVyICYmICFjb21wb25lbnQudGVtcGxhdGUpIHtcbiAgICAgIGNvbXBvbmVudC50ZW1wbGF0ZSA9IGNvbnRhaW5lci5pbm5lckhUTUw7XG4gICAgfVxuICAgIGlmIChjb250YWluZXIubm9kZVR5cGUgPT09IDEpIHtcbiAgICAgIGNvbnRhaW5lci50ZXh0Q29udGVudCA9IFwiXCI7XG4gICAgfVxuICAgIGNvbnN0IHByb3h5ID0gbW91bnQoY29udGFpbmVyLCBmYWxzZSwgcmVzb2x2ZVJvb3ROYW1lc3BhY2UoY29udGFpbmVyKSk7XG4gICAgaWYgKGNvbnRhaW5lciBpbnN0YW5jZW9mIEVsZW1lbnQpIHtcbiAgICAgIGNvbnRhaW5lci5yZW1vdmVBdHRyaWJ1dGUoXCJ2LWNsb2FrXCIpO1xuICAgICAgY29udGFpbmVyLnNldEF0dHJpYnV0ZShcImRhdGEtdi1hcHBcIiwgXCJcIik7XG4gICAgfVxuICAgIHJldHVybiBwcm94eTtcbiAgfTtcbiAgcmV0dXJuIGFwcDtcbn0pO1xuY29uc3QgY3JlYXRlU1NSQXBwID0gKCguLi5hcmdzKSA9PiB7XG4gIGNvbnN0IGFwcCA9IGVuc3VyZUh5ZHJhdGlvblJlbmRlcmVyKCkuY3JlYXRlQXBwKC4uLmFyZ3MpO1xuICBpZiAoISEocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09IFwicHJvZHVjdGlvblwiKSkge1xuICAgIGluamVjdE5hdGl2ZVRhZ0NoZWNrKGFwcCk7XG4gICAgaW5qZWN0Q29tcGlsZXJPcHRpb25zQ2hlY2soYXBwKTtcbiAgfVxuICBjb25zdCB7IG1vdW50IH0gPSBhcHA7XG4gIGFwcC5tb3VudCA9IChjb250YWluZXJPclNlbGVjdG9yKSA9PiB7XG4gICAgY29uc3QgY29udGFpbmVyID0gbm9ybWFsaXplQ29udGFpbmVyKGNvbnRhaW5lck9yU2VsZWN0b3IpO1xuICAgIGlmIChjb250YWluZXIpIHtcbiAgICAgIHJldHVybiBtb3VudChjb250YWluZXIsIHRydWUsIHJlc29sdmVSb290TmFtZXNwYWNlKGNvbnRhaW5lcikpO1xuICAgIH1cbiAgfTtcbiAgcmV0dXJuIGFwcDtcbn0pO1xuZnVuY3Rpb24gcmVzb2x2ZVJvb3ROYW1lc3BhY2UoY29udGFpbmVyKSB7XG4gIGlmIChjb250YWluZXIgaW5zdGFuY2VvZiBTVkdFbGVtZW50KSB7XG4gICAgcmV0dXJuIFwic3ZnXCI7XG4gIH1cbiAgaWYgKHR5cGVvZiBNYXRoTUxFbGVtZW50ID09PSBcImZ1bmN0aW9uXCIgJiYgY29udGFpbmVyIGluc3RhbmNlb2YgTWF0aE1MRWxlbWVudCkge1xuICAgIHJldHVybiBcIm1hdGhtbFwiO1xuICB9XG59XG5mdW5jdGlvbiBpbmplY3ROYXRpdmVUYWdDaGVjayhhcHApIHtcbiAgT2JqZWN0LmRlZmluZVByb3BlcnR5KGFwcC5jb25maWcsIFwiaXNOYXRpdmVUYWdcIiwge1xuICAgIHZhbHVlOiAodGFnKSA9PiBpc0hUTUxUYWcodGFnKSB8fCBpc1NWR1RhZyh0YWcpIHx8IGlzTWF0aE1MVGFnKHRhZyksXG4gICAgd3JpdGFibGU6IGZhbHNlXG4gIH0pO1xufVxuZnVuY3Rpb24gaW5qZWN0Q29tcGlsZXJPcHRpb25zQ2hlY2soYXBwKSB7XG4gIGlmIChpc1J1bnRpbWVPbmx5KCkpIHtcbiAgICBjb25zdCBpc0N1c3RvbUVsZW1lbnQgPSBhcHAuY29uZmlnLmlzQ3VzdG9tRWxlbWVudDtcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoYXBwLmNvbmZpZywgXCJpc0N1c3RvbUVsZW1lbnRcIiwge1xuICAgICAgZ2V0KCkge1xuICAgICAgICByZXR1cm4gaXNDdXN0b21FbGVtZW50O1xuICAgICAgfSxcbiAgICAgIHNldCgpIHtcbiAgICAgICAgd2FybihcbiAgICAgICAgICBgVGhlIFxcYGlzQ3VzdG9tRWxlbWVudFxcYCBjb25maWcgb3B0aW9uIGlzIGRlcHJlY2F0ZWQuIFVzZSBcXGBjb21waWxlck9wdGlvbnMuaXNDdXN0b21FbGVtZW50XFxgIGluc3RlYWQuYFxuICAgICAgICApO1xuICAgICAgfVxuICAgIH0pO1xuICAgIGNvbnN0IGNvbXBpbGVyT3B0aW9ucyA9IGFwcC5jb25maWcuY29tcGlsZXJPcHRpb25zO1xuICAgIGNvbnN0IG1zZyA9IGBUaGUgXFxgY29tcGlsZXJPcHRpb25zXFxgIGNvbmZpZyBvcHRpb24gaXMgb25seSByZXNwZWN0ZWQgd2hlbiB1c2luZyBhIGJ1aWxkIG9mIFZ1ZS5qcyB0aGF0IGluY2x1ZGVzIHRoZSBydW50aW1lIGNvbXBpbGVyIChha2EgXCJmdWxsIGJ1aWxkXCIpLiBTaW5jZSB5b3UgYXJlIHVzaW5nIHRoZSBydW50aW1lLW9ubHkgYnVpbGQsIFxcYGNvbXBpbGVyT3B0aW9uc1xcYCBtdXN0IGJlIHBhc3NlZCB0byBcXGBAdnVlL2NvbXBpbGVyLWRvbVxcYCBpbiB0aGUgYnVpbGQgc2V0dXAgaW5zdGVhZC5cbi0gRm9yIHZ1ZS1sb2FkZXI6IHBhc3MgaXQgdmlhIHZ1ZS1sb2FkZXIncyBcXGBjb21waWxlck9wdGlvbnNcXGAgbG9hZGVyIG9wdGlvbi5cbi0gRm9yIHZ1ZS1jbGk6IHNlZSBodHRwczovL2NsaS52dWVqcy5vcmcvZ3VpZGUvd2VicGFjay5odG1sI21vZGlmeWluZy1vcHRpb25zLW9mLWEtbG9hZGVyXG4tIEZvciB2aXRlOiBwYXNzIGl0IHZpYSBAdml0ZWpzL3BsdWdpbi12dWUgb3B0aW9ucy4gU2VlIGh0dHBzOi8vZ2l0aHViLmNvbS92aXRlanMvdml0ZS1wbHVnaW4tdnVlL3RyZWUvbWFpbi9wYWNrYWdlcy9wbHVnaW4tdnVlI2V4YW1wbGUtZm9yLXBhc3Npbmctb3B0aW9ucy10by12dWVjb21waWxlci1zZmNgO1xuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShhcHAuY29uZmlnLCBcImNvbXBpbGVyT3B0aW9uc1wiLCB7XG4gICAgICBnZXQoKSB7XG4gICAgICAgIHdhcm4obXNnKTtcbiAgICAgICAgcmV0dXJuIGNvbXBpbGVyT3B0aW9ucztcbiAgICAgIH0sXG4gICAgICBzZXQoKSB7XG4gICAgICAgIHdhcm4obXNnKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxufVxuZnVuY3Rpb24gbm9ybWFsaXplQ29udGFpbmVyKGNvbnRhaW5lcikge1xuICBpZiAoaXNTdHJpbmcoY29udGFpbmVyKSkge1xuICAgIGNvbnN0IHJlcyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoY29udGFpbmVyKTtcbiAgICBpZiAoISEocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09IFwicHJvZHVjdGlvblwiKSAmJiAhcmVzKSB7XG4gICAgICB3YXJuKFxuICAgICAgICBgRmFpbGVkIHRvIG1vdW50IGFwcDogbW91bnQgdGFyZ2V0IHNlbGVjdG9yIFwiJHtjb250YWluZXJ9XCIgcmV0dXJuZWQgbnVsbC5gXG4gICAgICApO1xuICAgIH1cbiAgICByZXR1cm4gcmVzO1xuICB9XG4gIGlmICghIShwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gXCJwcm9kdWN0aW9uXCIpICYmIHdpbmRvdy5TaGFkb3dSb290ICYmIGNvbnRhaW5lciBpbnN0YW5jZW9mIHdpbmRvdy5TaGFkb3dSb290ICYmIGNvbnRhaW5lci5tb2RlID09PSBcImNsb3NlZFwiKSB7XG4gICAgd2FybihcbiAgICAgIGBtb3VudGluZyBvbiBhIFNoYWRvd1Jvb3Qgd2l0aCBcXGB7bW9kZTogXCJjbG9zZWRcIn1cXGAgbWF5IGxlYWQgdG8gdW5wcmVkaWN0YWJsZSBidWdzYFxuICAgICk7XG4gIH1cbiAgcmV0dXJuIGNvbnRhaW5lcjtcbn1cbmxldCBzc3JEaXJlY3RpdmVJbml0aWFsaXplZCA9IGZhbHNlO1xuY29uc3QgaW5pdERpcmVjdGl2ZXNGb3JTU1IgPSAoKSA9PiB7XG4gIGlmICghc3NyRGlyZWN0aXZlSW5pdGlhbGl6ZWQpIHtcbiAgICBzc3JEaXJlY3RpdmVJbml0aWFsaXplZCA9IHRydWU7XG4gICAgaW5pdFZNb2RlbEZvclNTUigpO1xuICAgIGluaXRWU2hvd0ZvclNTUigpO1xuICB9XG59IDtcblxuZXhwb3J0IHsgVHJhbnNpdGlvbiwgVHJhbnNpdGlvbkdyb3VwLCBWdWVFbGVtZW50LCBjcmVhdGVBcHAsIGNyZWF0ZVNTUkFwcCwgZGVmaW5lQ3VzdG9tRWxlbWVudCwgZGVmaW5lU1NSQ3VzdG9tRWxlbWVudCwgaHlkcmF0ZSwgaW5pdERpcmVjdGl2ZXNGb3JTU1IsIG5vZGVPcHMsIHBhdGNoUHJvcCwgcmVuZGVyLCB1c2VDc3NNb2R1bGUsIHVzZUNzc1ZhcnMsIHVzZUhvc3QsIHVzZVNoYWRvd1Jvb3QsIHZNb2RlbENoZWNrYm94LCB2TW9kZWxEeW5hbWljLCB2TW9kZWxSYWRpbywgdk1vZGVsU2VsZWN0LCB2TW9kZWxUZXh0LCB2U2hvdywgd2l0aEtleXMsIHdpdGhNb2RpZmllcnMgfTtcbiIsIjxzY3JpcHQgc2V0dXAgbGFuZz1cInRzXCI+XG5kZWZpbmVQcm9wczx7XG4gIG1lc3NhZ2U6IHN0cmluZ1xufT4oKVxuPC9zY3JpcHQ+XG5cbjx0ZW1wbGF0ZT5cbiAgPGRpdiBzdHlsZT1cImJvcmRlcjogMXB4IHNvbGlkICNjY2M7IHBhZGRpbmc6IDhweFwiPlxuICAgIDxoMj5WdWVKUzwvaDI+XG4gICAg8J+RiyB7eyBtZXNzYWdlIH19XG4gIDwvZGl2PlxuPC90ZW1wbGF0ZT5cbiIsImltcG9ydCB7IGNyZWF0ZUFwcCwgcmVhY3RpdmUgfSBmcm9tICd2dWUnXG5pbXBvcnQgSGVsbG9EZWxwaGluZSBmcm9tICcuL2NvbXBvbmVudHMvSGVsbG9EZWxwaGluZS52dWUnXG5pbXBvcnQgdHlwZSB7IERlbHBoaW5lU2VydmljZXMsIFVJUGx1Z2luSW5zdGFuY2UgfSBmcm9tICdAdmNsJ1xuXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlSGVsbG9WdWVQbHVnaW4oKTogVUlQbHVnaW5JbnN0YW5jZTx7IG1lc3NhZ2U6IHN0cmluZyB9PiB7XG4gIGxldCBhcHA6IFJldHVyblR5cGU8dHlwZW9mIGNyZWF0ZUFwcD4gfCBudWxsID0gbnVsbFxuICBjb25zdCBzdGF0ZSA9IHJlYWN0aXZlPHsgbWVzc2FnZTogc3RyaW5nIH0+KHsgbWVzc2FnZTogJ0JPQk8nIH0pXG5cbiAgcmV0dXJuIHtcbiAgICBpZDogJ2hlbGxvLXZ1ZScsXG5cbiAgICBtb3VudChjb250YWluZXIsIHByb3BzLCBfc2VydmljZXM6IERlbHBoaW5lU2VydmljZXMpIHtcbiAgICAgIHN0YXRlLm1lc3NhZ2UgPSBwcm9wcy5tZXNzYWdlXG4gICAgICBhcHAgPSBjcmVhdGVBcHAoSGVsbG9EZWxwaGluZSwgc3RhdGUpXG4gICAgICBhcHAubW91bnQoY29udGFpbmVyKVxuICAgIH0sXG5cbiAgICB1cGRhdGUocHJvcHMpIHtcbiAgICAgIHN0YXRlLm1lc3NhZ2UgPSBwcm9wcy5tZXNzYWdlXG4gICAgfSxcblxuICAgIHVubW91bnQoKSB7XG4gICAgICBhcHA/LnVubW91bnQoKVxuICAgICAgYXBwID0gbnVsbFxuICAgIH0sXG4gIH1cbn1cbiIsIi8vLyA8cmVmZXJlbmNlIGxpYj1cImRvbVwiIC8+XG4vL2ltcG9ydCB7IGluc3RhbGxEZWxwaGluZVJ1bnRpbWUgfSBmcm9tIFwiLi9zcmMvZHJ0XCI7IC8vIDwtLSBUUywgcGFzIC5qc1xuY29uc29sZS5sb2coJ/CflKUgSSBBTSBaQVpBVlVFIOKAkyBFTlRSWSBFWEVDVVRFRCcpXG5cbmNvbnNvbGUubG9nKCdJIEFNIFpBWkFWVUUnKVxuXG5pbXBvcnQgeyBURm9ybSwgVENvbG9yLCBUQXBwbGljYXRpb24sIFRDb21wb25lbnQsIFRCdXR0b24sIFBsdWdpblJlZ2lzdHJ5IH0gZnJvbSAnQHZjbCdcbi8vaW1wb3J0IHsgVFBsdWdpbkhvc3QgfSBmcm9tICdAZHJ0L1VJUGx1Z2luJ1xuaW1wb3J0IHsgY3JlYXRlSGVsbG9WdWVQbHVnaW4gfSBmcm9tICcuL2NyZWF0ZUhlbGxvVnVlUGx1Z2luJ1xuXG5jb25zb2xlLmxvZygnSSBBTSBaQVpBVlVFJylcbi8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby1kZWJ1Z2dlclxuLy8gb3hsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLWRlYnVnZ2VyXG5kZWJ1Z2dlclxuXG4vL2ltcG9ydCB0eXBlIHsgRGVscGhpbmVTZXJ2aWNlcyB9IGZyb20gJ0BkcnQvVUlQbHVnaW4nIC8vIGFkYXB0ZXogbGUgY2hlbWluIGV4YWN0IGNoZXogdm91c1xuLy9pbXBvcnQgeyBDb21wb25lbnRSZWdpc3RyeSB9IGZyb20gJ0BkcnQvQ29tcG9uZW50UmVnaXN0cnknO1xuLy9pbXBvcnQgeyBUUGx1Z2luSG9zdCB9IGZyb20gJ0BkcnQvVUlQbHVnaW4nO1xuXG4vL2V4cG9ydCBmdW5jdGlvbiByZWdpc3RlclBsdWdpblR5cGVzKHJlZzogQ29tcG9uZW50VHlwZVJlZ2lzdHJ5KTogdm9pZCB7XG4vKlxuICAgICAgICAvLyBFeGFtcGxlOiBhbnkgdHlwZSBuYW1lIGNhbiBiZSBwcm92aWRlZCBieSBhIHBsdWdpbi5cbiAgICAgICAgcmVnLnJlZ2lzdGVyLnJlZ2lzdGVyVHlwZSgnY2hhcnRqcy1waWUnLCAobmFtZTogc3RyaW5nLCBmb3JtOiBURm9ybSwgcGFyZW50OiBUQ29tcG9uZW50KSA9PiB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBQbHVnaW5Ib3N0KG5hbWUsIGZvcm0sIHBhcmVudCk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHJlZy5yZWdpc3RlclR5cGUoJ3Z1ZS1oZWxsbycsIChuYW1lOiBzdHJpbmcsIGZvcm06IFRGb3JtLCBwYXJlbnQ6IFRDb21wb25lbnQpID0+IHtcbiAgICAgICAgICAgICAgICByZXR1cm4gbmV3IFBsdWdpbkhvc3QobmFtZSwgZm9ybSwgcGFyZW50KTtcbiAgICAgICAgfSk7XG4gICAgICAgICovXG4vL31cblxuY2xhc3MgWmF6YVZ1ZSBleHRlbmRzIFRGb3JtIHtcbiAgLy8gRm9ybSBjb21wb25lbnRzIC0gVGhpcyBsaXN0IGlzIGF1dG8gZ2VuZXJhdGVkIGJ5IERlbHBoaW5lXG4gIC8vIC0tLS0tLS0tLS0tLS0tLVxuICAvL2J1dHRvbjEgOiBUQnV0dG9uID0gbmV3IFRCdXR0b24oXCJidXR0b24xXCIsIHRoaXMsIHRoaXMpO1xuICAvL2J1dHRvbjIgOiBUQnV0dG9uID0gbmV3IFRCdXR0b24oXCJidXR0b24yXCIsIHRoaXMsIHRoaXMpO1xuICAvL2J1dHRvbjMgOiBUQnV0dG9uID0gbmV3IFRCdXR0b24oXCJidXR0b24zXCIsIHRoaXMsIHRoaXMpO1xuICAvLyAtLS0tLS0tLS0tLS0tLS1cblxuICBjb25zdHJ1Y3RvcihuYW1lOiBzdHJpbmcpIHtcbiAgICBzdXBlcihuYW1lKVxuICB9XG4gIC8vaW1wb3J0IHsgaW5zdGFsbERlbHBoaW5lUnVudGltZSB9IGZyb20gXCIuL2RydFwiO1xuXG4gIC8qXG5jb25zdCBydW50aW1lID0ge1xuICBoYW5kbGVDbGljayh7IGVsZW1lbnQgfTogeyBlbGVtZW50OiBFbGVtZW50IH0pIHtcbiAgICBjb25zb2xlLmxvZyhcImNsaWNrZWQhXCIsIGVsZW1lbnQpO1xuICAgIC8vKGVsZW1lbnQgYXMgSFRNTEVsZW1lbnQpLnN0eWxlLmJhY2tncm91bmRDb2xvciA9IFwicmVkXCI7XG4gIH0sXG59O1xuKi9cblxuICBwcm90ZWN0ZWQgb25NeUNyZWF0ZShfZXY6IEV2ZW50IHwgbnVsbCwgX3NlbmRlcjogVENvbXBvbmVudCkge1xuICAgIGNvbnN0IGJ0biA9IHRoaXMuY29tcG9uZW50UmVnaXN0cnkuZ2V0KCdidXR0b24xJylcbiAgICBpZiAoYnRuKSBidG4uY29sb3IgPSBUQ29sb3IucmdiKDAsIDAsIDI1NSlcbiAgfVxuXG4gIHByb3RlY3RlZCBvbk15U2hvd24oX2V2OiBFdmVudCB8IG51bGwsIF9zZW5kZXI6IFRDb21wb25lbnQpIHtcbiAgICBjb25zdCBidG4gPSB0aGlzLmNvbXBvbmVudFJlZ2lzdHJ5LmdldCgnYnV0dG9ueCcpXG4gICAgaWYgKGJ0bikgYnRuLmNvbG9yID0gVENvbG9yLnJnYigwLCAyNTUsIDI1NSlcbiAgfVxuXG4gIGJ1dHRvbjFfb25jbGljayhfZXY6IEV2ZW50IHwgbnVsbCwgX3NlbmRlcjogVENvbXBvbmVudCkge1xuICAgIGNvbnN0IGJ0biA9IHRoaXMuY29tcG9uZW50UmVnaXN0cnkuZ2V0PFRCdXR0b24+KCdidXR0b24xJylcbiAgICBpZiAoIWJ0bikge1xuICAgICAgY29uc29sZS53YXJuKCdidXR0b24xIG5vdCBmb3VuZCBpbiByZWdpc3RyeScpXG4gICAgICByZXR1cm5cbiAgICB9XG4gICAgLy9idG4uY29sb3IgPSBUQ29sb3IucmdiKDAsIDAsIDI1NSk7XG4gICAgYnRuIS5jb2xvciA9IFRDb2xvci5yZ2IoMjU1LCAwLCAwKVxuICAgIGJ0biEuc2V0Q2FwdGlvbignTUlNSScpXG4gICAgY29uc29sZS5sb2coJ0J1dHRvbjEgY2xpY2tlZCEhISEnKVxuICB9XG5cbiAgemF6YV9vbmNsaWNrKF9ldjogRXZlbnQgfCBudWxsLCBfc2VuZGVyOiBUQ29tcG9uZW50KSB7XG4gICAgY29uc3QgYnRuID0gdGhpcy5jb21wb25lbnRSZWdpc3RyeS5nZXQ8VEJ1dHRvbj4oJ2J1dHRvbngnKVxuICAgIGJ0biEuY29sb3IgPSBUQ29sb3IucmdiKDAsIDI1NSwgMClcbiAgICBjb25zb2xlLmxvZygnemF6YVZ1ZSBjbGlja2VkISEhIScpXG4gICAgLy9idG4hLmVuYWJsZWQgPSBmYWxzZTtcbiAgfVxuXG4gIC8vaW5zdGFsbERlbHBoaW5lUnVudGltZShydW50aW1lKTtcbn0gLy8gY2xhc3MgemF6YVxuXG5jbGFzcyBNeUFwcGxpY2F0aW9uIGV4dGVuZHMgVEFwcGxpY2F0aW9uIHtcbiAgemF6YVZ1ZTogWmF6YVZ1ZVxuXG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHN1cGVyKClcbiAgICB0aGlzLnphemFWdWUgPSBuZXcgWmF6YVZ1ZSgnemF6YVZ1ZScpXG4gICAgdGhpcy5tYWluRm9ybSA9IHRoaXMuemF6YVZ1ZVxuICAgIFBsdWdpblJlZ2lzdHJ5LnBsdWdpblJlZ2lzdHJ5LnJlZ2lzdGVyKCdoZWxsby12dWUnLCB7IGZhY3Rvcnk6IGNyZWF0ZUhlbGxvVnVlUGx1Z2luIH0pXG4gIH1cblxuICBydW4oKSB7XG4gICAgLy90aGlzLnphemEuY29tcG9uZW50UmVnaXN0cnkuYnVpbGRDb21wb25lbnRUcmVlKHRoaXMuemF6YSk7XG4gICAgLy90aGlzLnphemEuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snKTtcblxuICAgIC8vIGF1IGxhbmNlbWVudFxuICAgIHRoaXMucnVuV2hlbkRvbVJlYWR5KCgpID0+IHtcbiAgICAgIHRoaXMuemF6YVZ1ZS5zaG93KClcbiAgICB9KVxuICB9XG59IC8vIGNsYXNzIE15QXBwbGljYXRpb25cblxuY29uc3QgbXlBcHBsaWNhdGlvbjogTXlBcHBsaWNhdGlvbiA9IG5ldyBNeUFwcGxpY2F0aW9uKClcbm15QXBwbGljYXRpb24ucnVuKClcbiJdLCJuYW1lcyI6WyJkZWYiLCJoYXNPd25Qcm9wZXJ0eSIsImlzUmVmIiwiY29tcHV0ZWQiLCJzZWxmIiwicmVhZG9ubHkiLCJ3YXRjaCIsImVmZmVjdCIsInAiLCJyZWYiLCJyZWYyIiwiaCIsImNyZWF0ZUFwcCIsImlzTW9kZWxMaXN0ZW5lciIsImVtaXQiLCJyZW1vdmUyIiwicmVtb3ZlIiwiY2FtZWxpemUkMSIsIl9vcGVuQmxvY2siLCJfY3JlYXRlRWxlbWVudEJsb2NrIiwiX2NyZWF0ZUVsZW1lbnRWTm9kZSIsIl9jcmVhdGVUZXh0Vk5vZGUiLCJIZWxsb0RlbHBoaW5lIl0sIm1hcHBpbmdzIjoiQUFPTyxTQUFTLGlCQUFpQixPQUE4QjtBQUN2RCxRQUFNLFNBQVMsWUFBWSxTQUFTO0FBQ3BDLFFBQU0sU0FBUyxnQkFBZ0IsU0FBUztBQUdoRDtBQzBFTyxNQUFlLFdBQTRDO0FBQUEsRUFDakQsV0FBbUI7QUFBQSxFQUM1QixPQUFPO0FBQUEsRUFHUCxjQUFjO0FBQUEsRUFBQztBQUV2QjtBQWtCTyxNQUFlLHVCQUE2QyxXQUFXO0FBQUE7QUFBQTtBQUFBLEVBS3RFLGNBQWM7QUFDTixVQUFBO0FBQUEsRUFDUjtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQVNBLE9BQU8sTUFBYyxNQUFhLFFBQW9CO0FBQzlDLFdBQU8sSUFBSSxXQUFXLEtBQUssZ0JBQWdCLE1BQU0sTUFBTSxNQUFNO0FBQUEsRUFDckU7QUFBQTtBQUFBLEVBR0EsUUFBdUI7QUFDZixXQUFPLENBQUE7QUFBQSxFQUNmO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQW9CUjtBQUtPLE1BQU0sc0JBQXNCO0FBQUE7QUFBQSxFQUVWLDhCQUFjLElBQUE7QUFBQSxFQUUvQixTQUFTLE1BQTJCO0FBQzVCLFFBQUksS0FBSyxRQUFRLElBQUksS0FBSyxRQUFRLEdBQUc7QUFDN0IsWUFBTSxJQUFJLE1BQU0sc0NBQXNDLEtBQUssUUFBUSxFQUFFO0FBQUEsSUFDN0U7QUFDQSxTQUFLLFFBQVEsSUFBSSxLQUFLLFVBQVUsSUFBSTtBQUFBLEVBQzVDO0FBQUE7QUFBQSxFQUdBLElBQUksVUFBMEQ7QUFDdEQsV0FBTyxLQUFLLFFBQVEsSUFBSSxRQUFRO0FBQUEsRUFDeEM7QUFBQSxFQUVBLElBQUksVUFBMkI7QUFDdkIsV0FBTyxL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
