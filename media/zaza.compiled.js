var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);

// src/vcl/registerVcl.ts
function registerBuiltins(types) {
  types.register(TMetaButton.metaClass);
}

// src/vcl/StdCtrls.ts
var TMetaComponent2 = class {
  constructor() {
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
    return _TMetaForm.metaClass;
  }
  create(name, form, parent) {
    return new TForm2(name);
  }
  props() {
    return [];
  }
};
__publicField(_TMetaForm, "metaClass", new _TMetaForm());
var TMetaForm = _TMetaForm;
var _TForm = class _TForm extends TComponent2 {
  constructor(name) {
    super(TMetaForm.metaClass, name, null, null);
    __publicField(this, "_mounted", false);
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

// examples/zaza/zaza.ts
function registerPluginTypes(reg) {
}
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
  onMyCreate(ev, sender) {
    const btn = this.componentRegistry.get("button2");
    if (btn) btn.color = TColor.rgb(0, 0, 255);
  }
  onMyShown(ev, sender) {
    const btn = this.componentRegistry.get("button3");
    if (btn) btn.color = TColor.rgb(0, 255, 255);
  }
  button1_onclick(ev, sender) {
    const btn = this.componentRegistry.get("button1");
    if (!btn) {
      console.warn("button1 not found in registry");
      return;
    }
    btn.color = TColor.rgb(255, 0, 0);
    btn.setCaption("MIMI");
    console.log("Button1 clicked!!!!");
  }
  zaza_onclick(ev, sender) {
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
export {
  registerPluginTypes
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vc3JjL3ZjbC9yZWdpc3RlclZjbC50cyIsICIuLi9zcmMvdmNsL1N0ZEN0cmxzLnRzIiwgIi4uL2V4YW1wbGVzL3phemEvemF6YS50cyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiLy8gRW5nbGlzaCBjb21tZW50cyBhcyByZXF1ZXN0ZWQuXG5cbi8vaW1wb3J0IHsgQ29tcG9uZW50VHlwZVJlZ2lzdHJ5IH0gZnJvbSAnQGRydCc7XG5pbXBvcnQgeyBUQnV0dG9uLCBUTWV0YUNvbXBvbmVudCwgVEZvcm0sIFRDb21wb25lbnQsIENvbXBvbmVudFR5cGVSZWdpc3RyeSwgVE1ldGFCdXR0b24gfSBmcm9tICdAdmNsJztcblxuLy8gRW5nbGlzaCBjb21tZW50cyBhcyByZXF1ZXN0ZWQuXG5leHBvcnQgZnVuY3Rpb24gcmVnaXN0ZXJCdWlsdGlucyh0eXBlczogQ29tcG9uZW50VHlwZVJlZ2lzdHJ5KSB7XG4gICAgICAgIHR5cGVzLnJlZ2lzdGVyKFRNZXRhQnV0dG9uLm1ldGFDbGFzcyk7XG4gICAgICAgIC8vIHR5cGVzLnJlZ2lzdGVyKFRFZGl0Q2xhc3MpO1xuICAgICAgICAvLyB0eXBlcy5yZWdpc3RlcihUTGFiZWxDbGFzcyk7XG59XG4iLCAiLy9pbXBvcnQgeyBDb21wb25lbnRUeXBlUmVnaXN0cnkgfSBmcm9tICcuLi9kcnQvVUlQbHVnaW4nOyAvLyBQQVMgXCJpbXBvcnQgdHlwZVwiXG4vLyAvL2ltcG9ydCB0eXBlIHsgSnNvbiwgRGVscGhpbmVTZXJ2aWNlcywgQ29tcG9uZW50VHlwZVJlZ2lzdHJ5IH0gZnJvbSAnLi4vZHJ0L1VJUGx1Z2luJztcbi8vaW1wb3J0IHsgcmVnaXN0ZXJWY2xUeXBlcyB9IGZyb20gJy4vcmVnaXN0ZXJWY2wnO1xuLy9pbXBvcnQgeyBCdXR0b24gfSBmcm9tICdncmFwZXNqcyc7XG5pbXBvcnQgeyByZWdpc3RlckJ1aWx0aW5zIH0gZnJvbSAnLi9yZWdpc3RlclZjbCc7XG5cbmV4cG9ydCB0eXBlIENvbXBvbmVudEZhY3RvcnkgPSAobmFtZTogc3RyaW5nLCBmb3JtOiBURm9ybSwgb3duZXI6IFRDb21wb25lbnQpID0+IFRDb21wb25lbnQ7XG5cbi8vaW1wb3J0IHR5cGUgeyBKc29uIH0gZnJvbSAnLi9Kc29uJztcbmV4cG9ydCB0eXBlIEpzb24gPSBudWxsIHwgYm9vbGVhbiB8IG51bWJlciB8IHN0cmluZyB8IEpzb25bXSB8IHsgW2tleTogc3RyaW5nXTogSnNvbiB9O1xuXG50eXBlIFByb3BLaW5kID0gJ3N0cmluZycgfCAnbnVtYmVyJyB8ICdib29sZWFuJyB8ICdjb2xvcic7XG5leHBvcnQgdHlwZSBQcm9wU3BlYzxULCBWID0gdW5rbm93bj4gPSB7XG4gICAgICAgIG5hbWU6IHN0cmluZztcbiAgICAgICAga2luZDogUHJvcEtpbmQ7XG4gICAgICAgIGFwcGx5OiAob2JqOiBULCB2YWx1ZTogVikgPT4gdm9pZDtcbn07XG5cbmV4cG9ydCBpbnRlcmZhY2UgSVBsdWdpbkhvc3Qge1xuICAgICAgICBzZXRQbHVnaW5TcGVjKHNwZWM6IHsgcGx1Z2luOiBzdHJpbmcgfCBudWxsOyBwcm9wczogYW55IH0pOiB2b2lkO1xuICAgICAgICBtb3VudFBsdWdpbklmUmVhZHkoc2VydmljZXM6IERlbHBoaW5lU2VydmljZXMpOiB2b2lkO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIERlbHBoaW5lTG9nZ2VyIHtcbiAgICAgICAgZGVidWcobXNnOiBzdHJpbmcsIGRhdGE/OiBKc29uKTogdm9pZDtcbiAgICAgICAgaW5mbyhtc2c6IHN0cmluZywgZGF0YT86IEpzb24pOiB2b2lkO1xuICAgICAgICB3YXJuKG1zZzogc3RyaW5nLCBkYXRhPzogSnNvbik6IHZvaWQ7XG4gICAgICAgIGVycm9yKG1zZzogc3RyaW5nLCBkYXRhPzogSnNvbik6IHZvaWQ7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgRGVscGhpbmVFdmVudEJ1cyB7XG4gICAgICAgIC8vIFN1YnNjcmliZSB0byBhbiBhcHAgZXZlbnQuXG4gICAgICAgIG9uKGV2ZW50TmFtZTogc3RyaW5nLCBoYW5kbGVyOiAocGF5bG9hZDogSnNvbikgPT4gdm9pZCk6ICgpID0+IHZvaWQ7XG5cbiAgICAgICAgLy8gUHVibGlzaCBhbiBhcHAgZXZlbnQuXG4gICAgICAgIGVtaXQoZXZlbnROYW1lOiBzdHJpbmcsIHBheWxvYWQ6IEpzb24pOiB2b2lkO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIERlbHBoaW5lU3RvcmFnZSB7XG4gICAgICAgIGdldChrZXk6IHN0cmluZyk6IFByb21pc2U8SnNvbiB8IHVuZGVmaW5lZD47XG4gICAgICAgIHNldChrZXk6IHN0cmluZywgdmFsdWU6IEpzb24pOiBQcm9taXNlPHZvaWQ+O1xuICAgICAgICByZW1vdmUoa2V5OiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+O1xufVxuZXhwb3J0IGludGVyZmFjZSBEZWxwaGluZVNlcnZpY2VzIHtcbiAgICAgICAgbG9nOiB7XG4gICAgICAgICAgICAgICAgZGVidWcobXNnOiBzdHJpbmcsIGRhdGE/OiBhbnkpOiB2b2lkO1xuICAgICAgICAgICAgICAgIGluZm8obXNnOiBzdHJpbmcsIGRhdGE/OiBhbnkpOiB2b2lkO1xuICAgICAgICAgICAgICAgIHdhcm4obXNnOiBzdHJpbmcsIGRhdGE/OiBhbnkpOiB2b2lkO1xuICAgICAgICAgICAgICAgIGVycm9yKG1zZzogc3RyaW5nLCBkYXRhPzogYW55KTogdm9pZDtcbiAgICAgICAgfTtcblxuICAgICAgICBidXM6IHtcbiAgICAgICAgICAgICAgICBvbihldmVudDogc3RyaW5nLCBoYW5kbGVyOiAocGF5bG9hZDogYW55KSA9PiB2b2lkKTogKCkgPT4gdm9pZDtcbiAgICAgICAgICAgICAgICBlbWl0KGV2ZW50OiBzdHJpbmcsIHBheWxvYWQ6IGFueSk6IHZvaWQ7XG4gICAgICAgIH07XG5cbiAgICAgICAgc3RvcmFnZToge1xuICAgICAgICAgICAgICAgIGdldChrZXk6IHN0cmluZyk6IFByb21pc2U8YW55PiB8IG51bGw7XG4gICAgICAgICAgICAgICAgc2V0KGtleTogc3RyaW5nLCB2YWx1ZTogYW55KTogUHJvbWlzZTx2b2lkPiB8IG51bGw7XG4gICAgICAgICAgICAgICAgcmVtb3ZlKGtleTogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB8IG51bGw7XG4gICAgICAgIH07XG5cbiAgICAgICAgLy8gZnV0dXJcbiAgICAgICAgLy8gaTE4bj86IC4uLlxuICAgICAgICAvLyBuYXY/OiAuLi5cbn1cblxuLy8gRW5nbGlzaCBjb21tZW50cyBhcyByZXF1ZXN0ZWQuXG5leHBvcnQgYWJzdHJhY3QgY2xhc3MgVE1ldGFDb21wb25lbnQ8VCBleHRlbmRzIFRDb21wb25lbnQgPSBUQ29tcG9uZW50PiB7XG4gICAgICAgIC8vIFRoZSBzeW1ib2xpYyBuYW1lIHVzZWQgaW4gSFRNTDogZGF0YS1jb21wb25lbnQ9XCJUQnV0dG9uXCIgb3IgXCJteS1idXR0b25cIlxuICAgICAgICBhYnN0cmFjdCByZWFkb25seSB0eXBlTmFtZTogc3RyaW5nO1xuICAgICAgICBjb25zdHJ1Y3RvcigpIHt9XG5cbiAgICAgICAgYWJzdHJhY3QgZ2V0TWV0YUNsYXNzKCk6IFRNZXRhQ29tcG9uZW50PFQ+O1xuXG4gICAgICAgIC8vIENyZWF0ZSB0aGUgcnVudGltZSBpbnN0YW5jZSBhbmQgYXR0YWNoIGl0IHRvIHRoZSBET00gZWxlbWVudC5cbiAgICAgICAgYWJzdHJhY3QgY3JlYXRlKG5hbWU6IHN0cmluZywgZm9ybTogVEZvcm0sIHBhcmVudDogVENvbXBvbmVudDxhbnk+KTogVDtcblxuICAgICAgICAvKiogUHJvcGVydHkgc2NoZW1hIGZvciB0aGlzIGNvbXBvbmVudCB0eXBlICovXG4gICAgICAgIHByb3BzKCk6IFByb3BTcGVjPFQ+W10ge1xuICAgICAgICAgICAgICAgIHJldHVybiBbXTtcbiAgICAgICAgfVxuXG4gICAgICAgIGRvbUV2ZW50cz8oKTogc3RyaW5nW107IC8vIGRlZmF1bHQgW107XG5cbiAgICAgICAgLypcbiAgICAgICAgLy8gT3B0aW9uYWw6IHBhcnNlIEhUTUwgYXR0cmlidXRlcyAtPiBwcm9wcy9zdGF0ZVxuICAgICAgICAvLyBFeGFtcGxlOiBkYXRhLWNhcHRpb249XCJPS1wiIC0+IHsgY2FwdGlvbjogXCJPS1wiIH1cbiAgICAgICAgcGFyc2VQcm9wcz8oZWxlbTogSFRNTEVsZW1lbnQpOiBKc29uO1xuXG4gICAgICAgIC8vIE9wdGlvbmFsOiBhcHBseSBwcm9wcyB0byB0aGUgY29tcG9uZW50IChjYW4gYmUgY2FsbGVkIGFmdGVyIGNyZWF0ZSlcbiAgICAgICAgYXBwbHlQcm9wcz8oYzogVCwgcHJvcHM6IEpzb24pOiB2b2lkO1xuXG4gICAgICAgIC8vIE9wdGlvbmFsOiBEZXNpZ24tdGltZSBtZXRhZGF0YSAocGFsZXR0ZSwgaW5zcGVjdG9yLCBldGMuKVxuICAgICAgICBkZXNpZ25UaW1lPzoge1xuICAgICAgICAgICAgICAgIHBhbGV0dGVHcm91cD86IHN0cmluZztcbiAgICAgICAgICAgICAgICBkaXNwbGF5TmFtZT86IHN0cmluZztcbiAgICAgICAgICAgICAgICBpY29uPzogc3RyaW5nOyAvLyBsYXRlclxuICAgICAgICAgICAgICAgIC8vIHByb3BlcnR5IHNjaGVtYSBjb3VsZCBsaXZlIGhlcmVcbiAgICAgICAgfTtcbiAgICAgICAgKi9cbn1cblxuLy9pbXBvcnQgdHlwZSB7IFRDb21wb25lbnRDbGFzcyB9IGZyb20gJy4vVENvbXBvbmVudENsYXNzJztcbi8vaW1wb3J0IHR5cGUgeyBUQ29tcG9uZW50IH0gZnJvbSAnQHZjbCc7XG5cbmV4cG9ydCBjbGFzcyBDb21wb25lbnRUeXBlUmVnaXN0cnkge1xuICAgICAgICAvLyBXZSBzdG9yZSBoZXRlcm9nZW5lb3VzIG1ldGFzLCBzbyB3ZSBrZWVwIHRoZW0gYXMgVE1ldGFDb21wb25lbnQ8YW55Pi5cbiAgICAgICAgcHJpdmF0ZSByZWFkb25seSBjbGFzc2VzID0gbmV3IE1hcDxzdHJpbmcsIFRNZXRhQ29tcG9uZW50PGFueT4+KCk7XG5cbiAgICAgICAgcmVnaXN0ZXI8VCBleHRlbmRzIFRDb21wb25lbnQ+KG1ldGE6IFRNZXRhQ29tcG9uZW50PFQ+KSB7XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuY2xhc3Nlcy5oYXMobWV0YS50eXBlTmFtZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgQ29tcG9uZW50IHR5cGUgYWxyZWFkeSByZWdpc3RlcmVkOiAke21ldGEudHlwZU5hbWV9YCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHRoaXMuY2xhc3Nlcy5zZXQobWV0YS50eXBlTmFtZSwgbWV0YSk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBJZiB5b3UganVzdCBuZWVkIFwic29tZXRoaW5nIG1ldGFcIiwgcmV0dXJuIGFueS1tZXRhLlxuICAgICAgICBnZXQodHlwZU5hbWU6IHN0cmluZyk6IFRNZXRhQ29tcG9uZW50PGFueT4gfCB1bmRlZmluZWQge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmNsYXNzZXMuZ2V0KHR5cGVOYW1lKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGhhcyh0eXBlTmFtZTogc3RyaW5nKTogYm9vbGVhbiB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuY2xhc3Nlcy5oYXModHlwZU5hbWUpO1xuICAgICAgICB9XG5cbiAgICAgICAgbGlzdCgpOiBzdHJpbmdbXSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIFsuLi50aGlzLmNsYXNzZXMua2V5cygpXS5zb3J0KCk7XG4gICAgICAgIH1cbn1cblxuLypcblxuLy9leHBvcnQgdHlwZSBDb21wb25lbnRGYWN0b3J5ID0gKG5hbWU6IHN0cmluZywgZm9ybTogVEZvcm0sIHBhcmVudDogVENvbXBvbmVudCkgPT4gVENvbXBvbmVudDtcblxuZXhwb3J0IGNsYXNzIENvbXBvbmVudFR5cGVSZWdpc3RyeSB7XG4gICAgICAgIHByaXZhdGUgZmFjdG9yaWVzID0gbmV3IE1hcDxzdHJpbmcsIENvbXBvbmVudEZhY3Rvcnk+KCk7XG5cbiAgICAgICAgZ2V0KG5hbWU6IHN0cmluZyk6IENvbXBvbmVudEZhY3RvcnkgfCBudWxsIHwgdW5kZWZpbmVkIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5mYWN0b3JpZXMuZ2V0KG5hbWUpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmVnaXN0ZXJUeXBlKHR5cGVOYW1lOiBzdHJpbmcsIGZhY3Rvcnk6IENvbXBvbmVudEZhY3RvcnkpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmZhY3Rvcmllcy5zZXQodHlwZU5hbWUsIGZhY3RvcnkpO1xuICAgICAgICB9XG5cbiAgICAgICAgY3JlYXRlKG5hbWU6IHN0cmluZywgZm9ybTogVEZvcm0sIHBhcmVudDogVENvbXBvbmVudCk6IFRDb21wb25lbnQgfCBudWxsIHtcbiAgICAgICAgICAgICAgICBjb25zdCBmID0gdGhpcy5mYWN0b3JpZXMuZ2V0KG5hbWUpO1xuICAgICAgICAgICAgICAgIHJldHVybiBmID8gZihuYW1lLCBmb3JtLCBwYXJlbnQpIDogbnVsbDtcbiAgICAgICAgfVxufVxuXG4qL1xuXG5leHBvcnQgY2xhc3MgVENvbG9yIHtcbiAgICAgICAgczogc3RyaW5nO1xuXG4gICAgICAgIGNvbnN0cnVjdG9yKHM6IHN0cmluZykge1xuICAgICAgICAgICAgICAgIHRoaXMucyA9IHM7XG4gICAgICAgIH1cbiAgICAgICAgLyogZmFjdG9yeSAqLyBzdGF0aWMgcmdiKHI6IG51bWJlciwgZzogbnVtYmVyLCBiOiBudW1iZXIpOiBUQ29sb3Ige1xuICAgICAgICAgICAgICAgIHJldHVybiBuZXcgVENvbG9yKGByZ2IoJHtyfSwgJHtnfSwgJHtifSlgKTtcbiAgICAgICAgfVxuICAgICAgICAvKiBmYWN0b3J5ICovIHN0YXRpYyByZ2JhKHI6IG51bWJlciwgZzogbnVtYmVyLCBiOiBudW1iZXIsIGE6IG51bWJlcik6IFRDb2xvciB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBUQ29sb3IoYHJnYmEoJHtyfSwgJHtnfSwgJHtifSwgJHthfSlgKTtcbiAgICAgICAgfVxufVxuXG5leHBvcnQgY2xhc3MgQ29tcG9uZW50UmVnaXN0cnkge1xuICAgICAgICBwcml2YXRlIGluc3RhbmNlcyA9IG5ldyBNYXA8c3RyaW5nLCBUQ29tcG9uZW50PigpO1xuXG4gICAgICAgIGxvZ2dlciA9IHtcbiAgICAgICAgICAgICAgICBkZWJ1Zyhtc2c6IHN0cmluZywgZGF0YT86IEpzb24pOiB2b2lkIHt9LFxuICAgICAgICAgICAgICAgIGluZm8obXNnOiBzdHJpbmcsIGRhdGE/OiBKc29uKTogdm9pZCB7fSxcbiAgICAgICAgICAgICAgICB3YXJuKG1zZzogc3RyaW5nLCBkYXRhPzogSnNvbik6IHZvaWQge30sXG4gICAgICAgICAgICAgICAgZXJyb3IobXNnOiBzdHJpbmcsIGRhdGE/OiBKc29uKTogdm9pZCB7fVxuICAgICAgICB9O1xuXG4gICAgICAgIGV2ZW50QnVzID0ge1xuICAgICAgICAgICAgICAgIG9uKGV2ZW50OiBzdHJpbmcsIGhhbmRsZXI6IChwYXlsb2FkOiBhbnkpID0+IHZvaWQpOiAoKSA9PiB2b2lkIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAoKSA9PiB2b2lkIHt9O1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgZW1pdChldmVudDogc3RyaW5nLCBwYXlsb2FkOiBhbnkpOiB2b2lkIHt9XG4gICAgICAgIH07XG5cbiAgICAgICAgc3RvcmFnZSA9IHtcbiAgICAgICAgICAgICAgICBnZXQoa2V5OiBzdHJpbmcpOiBQcm9taXNlPGFueT4gfCBudWxsIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgc2V0KGtleTogc3RyaW5nLCB2YWx1ZTogYW55KTogUHJvbWlzZTx2b2lkPiB8IG51bGwge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICByZW1vdmUoa2V5OiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHwgbnVsbCB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgIH07XG5cbiAgICAgICAgY29uc3RydWN0b3IoKSB7fVxuXG4gICAgICAgIHJlZ2lzdGVySW5zdGFuY2UobmFtZTogc3RyaW5nLCBjOiBUQ29tcG9uZW50KSB7XG4gICAgICAgICAgICAgICAgdGhpcy5pbnN0YW5jZXMuc2V0KG5hbWUsIGMpO1xuICAgICAgICB9XG4gICAgICAgIGdldDxUIGV4dGVuZHMgVENvbXBvbmVudCA9IFRDb21wb25lbnQ+KG5hbWU6IHN0cmluZyk6IFQgfCB1bmRlZmluZWQge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmluc3RhbmNlcy5nZXQobmFtZSkgYXMgVCB8IHVuZGVmaW5lZDtcbiAgICAgICAgfVxuXG4gICAgICAgIHNlcnZpY2VzOiBEZWxwaGluZVNlcnZpY2VzID0ge1xuICAgICAgICAgICAgICAgIGxvZzogdGhpcy5sb2dnZXIsXG4gICAgICAgICAgICAgICAgYnVzOiB0aGlzLmV2ZW50QnVzLFxuICAgICAgICAgICAgICAgIHN0b3JhZ2U6IHRoaXMuc3RvcmFnZVxuICAgICAgICB9O1xuXG4gICAgICAgIGNsZWFyKCkge1xuICAgICAgICAgICAgICAgIHRoaXMuaW5zdGFuY2VzLmNsZWFyKCk7XG4gICAgICAgIH1cblxuICAgICAgICByZXNvbHZlUm9vdCgpOiBIVE1MRWxlbWVudCB7XG4gICAgICAgICAgICAgICAgLy8gUHJlZmVyIGJvZHkgYXMgdGhlIGNhbm9uaWNhbCByb290LlxuICAgICAgICAgICAgICAgIGlmIChkb2N1bWVudC5ib2R5Py5kYXRhc2V0Py5jb21wb25lbnQpIHJldHVybiBkb2N1bWVudC5ib2R5O1xuXG4gICAgICAgICAgICAgICAgLy8gQmFja3dhcmQgY29tcGF0aWJpbGl0eTogb2xkIHdyYXBwZXIgZGl2LlxuICAgICAgICAgICAgICAgIGNvbnN0IGxlZ2FjeSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdkZWxwaGluZS1yb290Jyk7XG4gICAgICAgICAgICAgICAgaWYgKGxlZ2FjeSkgcmV0dXJuIGxlZ2FjeTtcblxuICAgICAgICAgICAgICAgIC8vIExhc3QgcmVzb3J0LlxuICAgICAgICAgICAgICAgIHJldHVybiBkb2N1bWVudC5ib2R5ID8/IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudDtcbiAgICAgICAgfVxuXG4gICAgICAgIHByaXZhdGUgcmVhZFByb3BzKGVsOiBFbGVtZW50LCBtZXRhOiBUTWV0YUNvbXBvbmVudDxhbnk+KSB7XG4gICAgICAgICAgICAgICAgY29uc3Qgb3V0OiBSZWNvcmQ8c3RyaW5nLCBhbnk+ID0ge307XG4gICAgICAgICAgICAgICAgZm9yIChjb25zdCBzcGVjIG9mIG1ldGEucHJvcHMoKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgcmF3ID0gZWwuZ2V0QXR0cmlidXRlKGBkYXRhLSR7c3BlYy5uYW1lfWApO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHJhdyA9PSBudWxsKSBjb250aW51ZTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgb3V0W3NwZWMubmFtZV0gPSB0aGlzLmNvbnZlcnQocmF3LCBzcGVjLmtpbmQpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gb3V0O1xuICAgICAgICB9XG5cbiAgICAgICAgcHJpdmF0ZSBjb252ZXJ0KHJhdzogc3RyaW5nLCBraW5kOiBQcm9wS2luZCkge1xuICAgICAgICAgICAgICAgIHN3aXRjaCAoa2luZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSAnc3RyaW5nJzpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJhdztcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgJ251bWJlcic6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBOdW1iZXIocmF3KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgJ2Jvb2xlYW4nOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmF3ID09PSAndHJ1ZScgfHwgcmF3ID09PSAnMScgfHwgcmF3ID09PSAnJztcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgJ2NvbG9yJzpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJhdzsgLy8gb3UgcGFyc2UgZW4gVENvbG9yIHNpIHZvdXMgYXZlelxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGFwcGx5UHJvcHMoY2hpbGQ6IFRDb21wb25lbnQsIGNsczogVE1ldGFDb21wb25lbnQpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBwcm9wcyA9IHRoaXMucmVhZFByb3BzKGNoaWxkLmVsZW0hLCBjbHMpO1xuICAgICAgICAgICAgICAgIGZvciAoY29uc3Qgc3BlYyBvZiBjbHMucHJvcHMoKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHByb3BzW3NwZWMubmFtZV0gIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzcGVjLmFwcGx5KGNoaWxkLCBwcm9wc1tzcGVjLm5hbWVdKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBidWlsZENvbXBvbmVudFRyZWUoZm9ybTogVEZvcm0sIGNvbXBvbmVudDogVENvbXBvbmVudCkge1xuICAgICAgICAgICAgICAgIHRoaXMuY2xlYXIoKTtcbiAgICAgICAgICAgICAgICAvLyByZXNvbHZlUm9vdCBlc3QgbWFpbnRlbmFudCBhcHBlbFx1MDBFOSBwYXIgVEZvcm06OnNob3coKS4gSW51dGlsZSBkZSBsZSBmYWlyZSBpY2lcbiAgICAgICAgICAgICAgICAvL2NvbnN0IHJvb3QgPSBURG9jdW1lbnQuYm9keTtcbiAgICAgICAgICAgICAgICAvL2NvbnN0IHJvb3QgPSAoZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2RlbHBoaW5lLXJvb3QnKSA/PyBkb2N1bWVudC5ib2R5KSBhcyBIVE1MRWxlbWVudDtcbiAgICAgICAgICAgICAgICAvL2NvbnN0IHJvb3QgPSAoZG9jdW1lbnQuYm9keT8ubWF0Y2hlcygnW2RhdGEtY29tcG9uZW50XScpID8gZG9jdW1lbnQuYm9keSA6IG51bGwpID8/IChkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnZGVscGhpbmUtcm9vdCcpIGFzIEhUTUxFbGVtZW50IHwgbnVsbCkgPz8gZG9jdW1lbnQuYm9keTtcbiAgICAgICAgICAgICAgICAvL2NvbnN0IHJvb3QgPSB0aGlzLnJlc29sdmVSb290KCk7XG5cbiAgICAgICAgICAgICAgICAvLyAtLS0gRk9STSAtLS1cbiAgICAgICAgICAgICAgICAvLyBwcm92aXNvaXJlbWVudCBpZiAocm9vdC5nZXRBdHRyaWJ1dGUoJ2RhdGEtY29tcG9uZW50JykgPT09ICdURm9ybScpIHtcblxuICAgICAgICAgICAgICAgIHRoaXMucmVnaXN0ZXJJbnN0YW5jZShjb21wb25lbnQubmFtZSwgZm9ybSk7XG4gICAgICAgICAgICAgICAgLy99XG4gICAgICAgICAgICAgICAgY29uc3Qgcm9vdCA9IGNvbXBvbmVudC5lbGVtITtcblxuICAgICAgICAgICAgICAgIC8vIC0tLSBDSElMRCBDT01QT05FTlRTIC0tLVxuICAgICAgICAgICAgICAgIHJvb3QucXVlcnlTZWxlY3RvckFsbCgnOnNjb3BlID4gW2RhdGEtY29tcG9uZW50XScpLmZvckVhY2goKGVsKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoZWwgPT09IHJvb3QpIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IG5hbWUgPSBlbC5nZXRBdHRyaWJ1dGUoJ2RhdGEtbmFtZScpO1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgdHlwZSA9IGVsLmdldEF0dHJpYnV0ZSgnZGF0YS1jb21wb25lbnQnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vY29uc3QgdGl0aSA9IGVsLmdldEF0dHJpYnV0ZSgnZGF0YS1vbmNsaWNrJyk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIC8vY29uc29sZS5sb2coYHRpdGkgPSAke3RpdGl9YCk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIC8vbGV0IGNvbXA6IFRDb21wb25lbnQgfCBudWxsID0gbnVsbDtcblxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gVGhlIGZvbGxvd2luZyBzd2l0Y2ggaXMganVzdCBmb3Igbm93LiBJbiB0aGUgZnV0dXJlIGl0IHdpbGwgbm90IGJlIG5lY2Vzc2FyeVxuICAgICAgICAgICAgICAgICAgICAgICAgLypcbiAgICAgICAgICAgICAgICAgICAgICAgIHN3aXRjaCAodHlwZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYXNlICdteS1idXR0b24nOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbXAgPSBuZXcgVEJ1dHRvbihuYW1lISwgZm9ybSwgZm9ybSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSAnZGVscGhpbmUtcGx1Z2luJzpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvL2NvbXAgPSBuZXcgUGx1Z2luSG9zdChuYW1lLCBmb3JtLCBmb3JtKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSovXG4gICAgICAgICAgICAgICAgICAgICAgICAvL2NvbnN0IGFwcGxpY2F0aW9uOiBUQXBwbGljYXRpb24gPSBuZXcgVEFwcGxpY2F0aW9uKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAvL2NvbnN0IGZhY3RvcnkgPSBUQXBwbGljYXRpb24uVGhlQXBwbGljYXRpb24udHlwZXMuZ2V0KHR5cGUhKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8qXG4gICAgICAgICAgICAgICAgICAgICAgICBsZXQgY29tcDogVENvbXBvbmVudCB8IG51bGwgPSBudWxsO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGZhY3RvcnkpIGNvbXAgPSBmYWN0b3J5KG5hbWUhLCBmb3JtLCBmb3JtKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGNvbXApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29tcC5lbGVtID0gZWw7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucmVnaXN0ZXIobmFtZSEsIGNvbXApO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAqL1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBjbHMgPSBUQXBwbGljYXRpb24uVGhlQXBwbGljYXRpb24udHlwZXMuZ2V0KHR5cGUhKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghY2xzKSByZXR1cm47XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGNoaWxkID0gY2xzLmNyZWF0ZShuYW1lISwgZm9ybSwgY29tcG9uZW50KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIG5hbWU6IHN0cmluZywgZm9ybTogVEZvcm0sIHBhcmVudDogVENvbXBvbmVudCwgZWxlbTogSFRNTEVsZW1lbnRcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghY2hpbGQpIHJldHVybjtcblxuICAgICAgICAgICAgICAgICAgICAgICAgLy9jaGlsZC5wYXJlbnQgPSBjb21wb25lbnQ7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGNoaWxkLmVsZW0gPSBlbDtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vY2hpbGQuZm9ybSA9IGZvcm07XG4gICAgICAgICAgICAgICAgICAgICAgICAvL2NoaWxkLm5hbWUgPSBuYW1lITtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIE9wdGlvbmFsIHByb3BzXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmFwcGx5UHJvcHMoY2hpbGQsIGNscyk7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnJlZ2lzdGVySW5zdGFuY2UobmFtZSEsIGNoaWxkKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbXBvbmVudC5jaGlsZHJlbi5wdXNoKGNoaWxkKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IG1heWJlSG9zdCA9IGNoaWxkIGFzIHVua25vd24gYXMgUGFydGlhbDxJUGx1Z2luSG9zdD47XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAobWF5YmVIb3N0ICYmIHR5cGVvZiBtYXliZUhvc3Quc2V0UGx1Z2luU3BlYyA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBwbHVnaW4gPSBlbC5nZXRBdHRyaWJ1dGUoJ2RhdGEtcGx1Z2luJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHJhdyA9IGVsLmdldEF0dHJpYnV0ZSgnZGF0YS1wcm9wcycpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBwcm9wcyA9IHJhdyA/IEpTT04ucGFyc2UocmF3KSA6IHt9O1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1heWJlSG9zdC5zZXRQbHVnaW5TcGVjKHsgcGx1Z2luLCBwcm9wcyB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbWF5YmVIb3N0Lm1vdW50UGx1Z2luSWZSZWFkeSEodGhpcy5zZXJ2aWNlcyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vbWF5YmVIb3N0Lm1vdW50RnJvbVJlZ2lzdHJ5KHNlcnZpY2VzKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGNoaWxkLmFsbG93c0NoaWxkcmVuKCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5idWlsZENvbXBvbmVudFRyZWUoZm9ybSwgY2hpbGQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG59XG5cbmV4cG9ydCBjbGFzcyBUQ29tcG9uZW50PFRTZWxmIGV4dGVuZHMgVENvbXBvbmVudDxhbnk+ID0gYW55PiB7XG4gICAgICAgIHJlYWRvbmx5IG1ldGFDbGFzczogVE1ldGFDb21wb25lbnQ8VFNlbGY+O1xuICAgICAgICByZWFkb25seSBuYW1lOiBzdHJpbmc7XG4gICAgICAgIHJlYWRvbmx5IHBhcmVudDogVENvbXBvbmVudDxhbnk+IHwgbnVsbCA9IG51bGw7XG4gICAgICAgIGZvcm06IFRGb3JtIHwgbnVsbCA9IG51bGw7XG4gICAgICAgIGNoaWxkcmVuOiBUQ29tcG9uZW50W10gPSBbXTtcblxuICAgICAgICBlbGVtOiBFbGVtZW50IHwgbnVsbCA9IG51bGw7XG4gICAgICAgIGdldCBodG1sRWxlbWVudCgpOiBIVE1MRWxlbWVudCB8IG51bGwge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmVsZW0gYXMgSFRNTEVsZW1lbnQgfCBudWxsO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0cnVjdG9yKG1ldGFDbGFzczogVE1ldGFDb21wb25lbnQ8VFNlbGY+LCBuYW1lOiBzdHJpbmcsIGZvcm06IFRGb3JtIHwgbnVsbCwgcGFyZW50OiBUQ29tcG9uZW50IHwgbnVsbCkge1xuICAgICAgICAgICAgICAgIHRoaXMubWV0YUNsYXNzID0gbWV0YUNsYXNzO1xuICAgICAgICAgICAgICAgIHRoaXMubmFtZSA9IG5hbWU7XG4gICAgICAgICAgICAgICAgdGhpcy5wYXJlbnQgPSBwYXJlbnQ7XG4gICAgICAgICAgICAgICAgcGFyZW50Py5jaGlsZHJlbi5wdXNoKHRoaXMpO1xuICAgICAgICAgICAgICAgIHRoaXMuZm9ybSA9IGZvcm07XG4gICAgICAgICAgICAgICAgdGhpcy5uYW1lID0gbmFtZTtcbiAgICAgICAgICAgICAgICAvL3RoaXMubWV0YUNsYXNzID0gbWV0YUNsYXNzO1xuICAgICAgICB9XG5cbiAgICAgICAgLyoqIE1heSBjb250YWluIGNoaWxkIGNvbXBvbmVudHMgKi9cbiAgICAgICAgYWxsb3dzQ2hpbGRyZW4oKTogYm9vbGVhbiB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cblxuICAgICAgICBnZXQgY29sb3IoKTogVENvbG9yIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gbmV3IFRDb2xvcih0aGlzLmdldFN0eWxlUHJvcCgnY29sb3InKSk7XG4gICAgICAgIH1cbiAgICAgICAgc2V0IGNvbG9yKHY6IFRDb2xvcikge1xuICAgICAgICAgICAgICAgIHRoaXMuc2V0U3R5bGVQcm9wKCdjb2xvcicsIHYucyk7XG4gICAgICAgIH1cblxuICAgICAgICBnZXQgYmFja2dyb3VuZENvbG9yKCk6IFRDb2xvciB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBUQ29sb3IodGhpcy5nZXRTdHlsZVByb3AoJ2JhY2tncm91bmQtY29sb3InKSk7XG4gICAgICAgIH1cbiAgICAgICAgc2V0IGJhY2tncm91bmRDb2xvcih2OiBUQ29sb3IpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnNldFN0eWxlUHJvcCgnYmFja2dyb3VuZC1jb2xvcicsIHYucyk7XG4gICAgICAgIH1cblxuICAgICAgICBnZXQgd2lkdGgoKTogbnVtYmVyIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcGFyc2VJbnQodGhpcy5nZXRTdHlsZVByb3AoJ3dpZHRoJykpO1xuICAgICAgICB9XG4gICAgICAgIHNldCB3aWR0aCh2OiBudW1iZXIpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnNldFN0eWxlUHJvcCgnd2lkdGgnLCB2LnRvU3RyaW5nKCkpO1xuICAgICAgICB9XG5cbiAgICAgICAgZ2V0IGhlaWdodCgpOiBudW1iZXIge1xuICAgICAgICAgICAgICAgIHJldHVybiBwYXJzZUludCh0aGlzLmdldFN0eWxlUHJvcCgnaGVpZ2h0JykpO1xuICAgICAgICB9XG4gICAgICAgIHNldCBoZWlnaHQodjogbnVtYmVyKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5zZXRTdHlsZVByb3AoJ2hlaWdodCcsIHYudG9TdHJpbmcoKSk7XG4gICAgICAgIH1cblxuICAgICAgICBnZXQgb2Zmc2V0V2lkdGgoKTogbnVtYmVyIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5odG1sRWxlbWVudCEub2Zmc2V0V2lkdGg7XG4gICAgICAgIH1cbiAgICAgICAgZ2V0IG9mZnNldEhlaWdodCgpOiBudW1iZXIge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmh0bWxFbGVtZW50IS5vZmZzZXRIZWlnaHQ7XG4gICAgICAgIH1cblxuICAgICAgICBzZXRTdHlsZVByb3AobmFtZTogc3RyaW5nLCB2YWx1ZTogc3RyaW5nKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5odG1sRWxlbWVudCEuc3R5bGUuc2V0UHJvcGVydHkobmFtZSwgdmFsdWUpO1xuICAgICAgICB9XG5cbiAgICAgICAgZ2V0U3R5bGVQcm9wKG5hbWU6IHN0cmluZykge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmh0bWxFbGVtZW50IS5zdHlsZS5nZXRQcm9wZXJ0eVZhbHVlKG5hbWUpO1xuICAgICAgICB9XG5cbiAgICAgICAgc2V0UHJvcChuYW1lOiBzdHJpbmcsIHZhbHVlOiBzdHJpbmcpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmh0bWxFbGVtZW50IS5zZXRBdHRyaWJ1dGUobmFtZSwgdmFsdWUpO1xuICAgICAgICB9XG5cbiAgICAgICAgZ2V0UHJvcChuYW1lOiBzdHJpbmcpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcyEuaHRtbEVsZW1lbnQhLmdldEF0dHJpYnV0ZShuYW1lKTtcbiAgICAgICAgfVxufVxuXG5leHBvcnQgY2xhc3MgVERvY3VtZW50IHtcbiAgICAgICAgc3RhdGljIGRvY3VtZW50OiBURG9jdW1lbnQgPSBuZXcgVERvY3VtZW50KGRvY3VtZW50KTtcbiAgICAgICAgc3RhdGljIGJvZHkgPSBkb2N1bWVudC5ib2R5O1xuICAgICAgICBodG1sRG9jOiBEb2N1bWVudDtcbiAgICAgICAgY29uc3RydWN0b3IoaHRtbERvYzogRG9jdW1lbnQpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmh0bWxEb2MgPSBodG1sRG9jO1xuICAgICAgICB9XG59XG5cbmV4cG9ydCBjbGFzcyBUTWV0YUZvcm0gZXh0ZW5kcyBUTWV0YUNvbXBvbmVudDxURm9ybT4ge1xuICAgICAgICBzdGF0aWMgbWV0YUNsYXNzOiBUTWV0YUZvcm0gPSBuZXcgVE1ldGFGb3JtKCk7XG4gICAgICAgIGdldE1ldGFDbGFzcygpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gVE1ldGFGb3JtLm1ldGFDbGFzcztcbiAgICAgICAgfVxuICAgICAgICByZWFkb25seSB0eXBlTmFtZSA9ICdURm9ybSc7XG5cbiAgICAgICAgY3JlYXRlKG5hbWU6IHN0cmluZywgZm9ybTogVEZvcm0sIHBhcmVudDogVENvbXBvbmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBuZXcgVEZvcm0obmFtZSk7XG4gICAgICAgIH1cblxuICAgICAgICBwcm9wcygpOiBQcm9wU3BlYzxURm9ybT5bXSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIFtdO1xuICAgICAgICB9XG59XG5cbmV4cG9ydCBjbGFzcyBURm9ybSBleHRlbmRzIFRDb21wb25lbnQge1xuICAgICAgICBzdGF0aWMgZm9ybXMgPSBuZXcgTWFwPHN0cmluZywgVEZvcm0+KCk7XG4gICAgICAgIHByaXZhdGUgX21vdW50ZWQgPSBmYWxzZTtcbiAgICAgICAgY29tcG9uZW50UmVnaXN0cnk6IENvbXBvbmVudFJlZ2lzdHJ5ID0gbmV3IENvbXBvbmVudFJlZ2lzdHJ5KCk7XG4gICAgICAgIGNvbnN0cnVjdG9yKG5hbWU6IHN0cmluZykge1xuICAgICAgICAgICAgICAgIHN1cGVyKFRNZXRhRm9ybS5tZXRhQ2xhc3MsIG5hbWUsIG51bGwsIG51bGwpO1xuICAgICAgICAgICAgICAgIHRoaXMuZm9ybSA9IHRoaXM7XG4gICAgICAgICAgICAgICAgVEZvcm0uZm9ybXMuc2V0KG5hbWUsIHRoaXMpO1xuICAgICAgICAgICAgICAgIC8vdGhpcy5wYXJlbnQgPSB0aGlzO1xuICAgICAgICB9XG5cbiAgICAgICAgZ2V0IGFwcGxpY2F0aW9uKCk6IFRBcHBsaWNhdGlvbiB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuZm9ybT8uYXBwbGljYXRpb24gPz8gVEFwcGxpY2F0aW9uLlRoZUFwcGxpY2F0aW9uO1xuICAgICAgICB9XG5cbiAgICAgICAgLyogICAgICAgIGZpbmRGb3JtRnJvbUV2ZW50VGFyZ2V0KGN1cnJlbnRUYXJnZXRFbGVtOiBFbGVtZW50KTogVEZvcm0gfCBudWxsIHtcbiAgICAgICAgICAgICAgICBjb25zdCBmb3JtTmFtZSA9IGN1cnJlbnRUYXJnZXRFbGVtLmdldEF0dHJpYnV0ZSgnZGF0YS1uYW1lJyk7XG4gICAgICAgICAgICAgICAgY29uc3QgZm9ybTogVEZvcm0gPSBURm9ybS5mb3Jtcy5nZXQoZm9ybU5hbWUhKSE7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZvcm07XG4gICAgICAgIH1cbiAgICAgICAgICAgICAgICAqL1xuXG4gICAgICAgIC8vIEVuZ2xpc2ggY29tbWVudHMgYXMgcmVxdWVzdGVkLlxuXG4gICAgICAgIGZpbmRGb3JtRnJvbUV2ZW50VGFyZ2V0KHRhcmdldDogRWxlbWVudCk6IFRGb3JtIHwgbnVsbCB7XG4gICAgICAgICAgICAgICAgLy8gMSkgRmluZCB0aGUgbmVhcmVzdCBlbGVtZW50IHRoYXQgbG9va3MgbGlrZSBhIGZvcm0gY29udGFpbmVyXG4gICAgICAgICAgICAgICAgY29uc3QgZm9ybUVsZW0gPSB0YXJnZXQuY2xvc2VzdCgnW2RhdGEtY29tcG9uZW50PVwiVEZvcm1cIl1bZGF0YS1uYW1lXScpIGFzIEVsZW1lbnQgfCBudWxsO1xuICAgICAgICAgICAgICAgIGlmICghZm9ybUVsZW0pIHJldHVybiBudWxsO1xuXG4gICAgICAgICAgICAgICAgLy8gMikgUmVzb2x2ZSB0aGUgVEZvcm0gaW5zdGFuY2VcbiAgICAgICAgICAgICAgICBjb25zdCBmb3JtTmFtZSA9IGZvcm1FbGVtLmdldEF0dHJpYnV0ZSgnZGF0YS1uYW1lJyk7XG4gICAgICAgICAgICAgICAgaWYgKCFmb3JtTmFtZSkgcmV0dXJuIG51bGw7XG5cbiAgICAgICAgICAgICAgICByZXR1cm4gVEZvcm0uZm9ybXMuZ2V0KGZvcm1OYW1lKSA/PyBudWxsO1xuICAgICAgICB9XG5cbiAgICAgICAgcHJpdmF0ZSBfYWM6IEFib3J0Q29udHJvbGxlciB8IG51bGwgPSBudWxsO1xuXG4gICAgICAgIGluc3RhbGxFdmVudFJvdXRlcigpIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9hYz8uYWJvcnQoKTtcbiAgICAgICAgICAgICAgICB0aGlzLl9hYyA9IG5ldyBBYm9ydENvbnRyb2xsZXIoKTtcbiAgICAgICAgICAgICAgICBjb25zdCB7IHNpZ25hbCB9ID0gdGhpcy5fYWM7XG5cbiAgICAgICAgICAgICAgICBjb25zdCByb290ID0gdGhpcy5lbGVtIGFzIEVsZW1lbnQgfCBudWxsO1xuICAgICAgICAgICAgICAgIGlmICghcm9vdCkgcmV0dXJuO1xuXG4gICAgICAgICAgICAgICAgLy8gc2FtZSBoYW5kbGVyIGZvciBldmVyeWJvZHlcbiAgICAgICAgICAgICAgICBjb25zdCBoYW5kbGVyID0gKGV2OiBFdmVudCkgPT4gdGhpcy5kaXNwYXRjaERvbUV2ZW50KGV2KTtcblxuICAgICAgICAgICAgICAgIGZvciAoY29uc3QgdHlwZSBvZiBbJ2NsaWNrJywgJ2lucHV0JywgJ2NoYW5nZScsICdrZXlkb3duJ10pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJvb3QuYWRkRXZlbnRMaXN0ZW5lcih0eXBlLCBoYW5kbGVyLCB7IGNhcHR1cmU6IHRydWUsIHNpZ25hbCB9KTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBmb3IgKGNvbnN0IHR5cGUgaW4gdGhpcy5tZXRhQ2xhc3MuZG9tRXZlbnRzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByb290LmFkZEV2ZW50TGlzdGVuZXIodHlwZSwgaGFuZGxlciwgeyBjYXB0dXJlOiB0cnVlLCBzaWduYWwgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgZGlzcG9zZUV2ZW50Um91dGVyKCkge1xuICAgICAgICAgICAgICAgIHRoaXMuX2FjPy5hYm9ydCgpO1xuICAgICAgICAgICAgICAgIHRoaXMuX2FjID0gbnVsbDtcbiAgICAgICAgfVxuXG4gICAgICAgIHByaXZhdGUgaGFuZGxlRXZlbnQoZXY6IEV2ZW50LCBlbDogRWxlbWVudCwgYXR0cmlidXRlOiBzdHJpbmcpOiBib29sZWFuIHtcbiAgICAgICAgICAgICAgICBjb25zdCBoYW5kbGVyTmFtZSA9IGVsLmdldEF0dHJpYnV0ZShhdHRyaWJ1dGUpO1xuXG4gICAgICAgICAgICAgICAgLy8gSWYgd2UgZm91bmQgYSBoYW5kbGVyIG9uIHRoaXMgZWxlbWVudCwgZGlzcGF0Y2ggaXRcbiAgICAgICAgICAgICAgICBpZiAoaGFuZGxlck5hbWUgJiYgaGFuZGxlck5hbWUgIT09ICcnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBuYW1lID0gZWwuZ2V0QXR0cmlidXRlKCdkYXRhLW5hbWUnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHNlbmRlciA9IG5hbWUgPyAodGhpcy5jb21wb25lbnRSZWdpc3RyeS5nZXQobmFtZSkgPz8gbnVsbCkgOiBudWxsO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBtYXliZU1ldGhvZCA9ICh0aGlzIGFzIGFueSlbaGFuZGxlck5hbWVdO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBtYXliZU1ldGhvZCAhPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnTk9UIEEgTUVUSE9EJywgaGFuZGxlck5hbWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIElmIHNlbmRlciBpcyBtaXNzaW5nLCBmYWxsYmFjayB0byB0aGUgZm9ybSBpdHNlbGYgKHNhZmUpXG4gICAgICAgICAgICAgICAgICAgICAgICAobWF5YmVNZXRob2QgYXMgKGV2ZW50OiBFdmVudCwgc2VuZGVyOiBhbnkpID0+IGFueSkuY2FsbCh0aGlzLCBldiwgc2VuZGVyID8/IHRoaXMpO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFdlIHJlY2VpdmVkIGFuIERPTSBFdmVudC4gRGlzcGF0Y2ggaXRcbiAgICAgICAgcHJpdmF0ZSBkaXNwYXRjaERvbUV2ZW50KGV2OiBFdmVudCkge1xuICAgICAgICAgICAgICAgIGNvbnN0IHRhcmdldEVsZW0gPSBldi50YXJnZXQgYXMgRWxlbWVudCB8IG51bGw7XG4gICAgICAgICAgICAgICAgaWYgKCF0YXJnZXRFbGVtKSByZXR1cm47XG5cbiAgICAgICAgICAgICAgICBjb25zdCBldlR5cGUgPSBldi50eXBlO1xuXG4gICAgICAgICAgICAgICAgbGV0IGVsOiBFbGVtZW50IHwgbnVsbCA9IHRhcmdldEVsZW0uY2xvc2VzdCgnW2RhdGEtY29tcG9uZW50XScpO1xuICAgICAgICAgICAgICAgIHdoaWxlIChlbCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMuaGFuZGxlRXZlbnQoZXYsIGVsLCBgZGF0YS1vbiR7ZXZUeXBlfWApKSByZXR1cm47XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIC8vZWwgPSB0aGlzLm5leHRDb21wb25lbnRFbGVtZW50VXAoZWwpO1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgbmFtZSA9IGVsLmdldEF0dHJpYnV0ZSgnZGF0YS1uYW1lJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBjb21wID0gbmFtZSA/IHRoaXMuY29tcG9uZW50UmVnaXN0cnkuZ2V0KG5hbWUpIDogbnVsbDtcblxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gUHJlZmVyIHlvdXIgVkNMLWxpa2UgcGFyZW50IGNoYWluIHdoZW4gYXZhaWxhYmxlXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBuZXh0ID0gY29tcD8ucGFyZW50Py5lbGVtID8/IG51bGw7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIEZhbGxiYWNrOiBzdGFuZGFyZCBET00gcGFyZW50XG4gICAgICAgICAgICAgICAgICAgICAgICBlbCA9IG5leHQgPz8gZWwucGFyZW50RWxlbWVudD8uY2xvc2VzdCgnW2RhdGEtY29tcG9uZW50XScpID8/IG51bGw7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLy8gTm8gaGFuZGxlciBoZXJlOiB0cnkgZ29pbmcgXCJ1cFwiIHVzaW5nIHlvdXIgY29tcG9uZW50IHRyZWUgaWYgcG9zc2libGVcbiAgICAgICAgfVxuXG4gICAgICAgIHNob3coKSB7XG4gICAgICAgICAgICAgICAgLy8gTXVzdCBiZSBkb25lIGJlZm9yZSBidWlsZENvbXBvbmVudFRyZWUoKSBiZWNhdXNlIGBidWlsZENvbXBvbmVudFRyZWUoKWAgZG9lcyBub3QgZG8gYHJlc29sdmVSb290KClgIGl0c2VsZi5cbiAgICAgICAgICAgICAgICBpZiAoIXRoaXMuZWxlbSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5lbGVtID0gdGhpcy5jb21wb25lbnRSZWdpc3RyeS5yZXNvbHZlUm9vdCgpOyAvLyBvdSB0aGlzLnJlc29sdmVSb290KClcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKCF0aGlzLl9tb3VudGVkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmNvbXBvbmVudFJlZ2lzdHJ5LmJ1aWxkQ29tcG9uZW50VHJlZSh0aGlzLCB0aGlzKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMub25DcmVhdGUoKTsgLy8gTWF5YmUgY291bGQgYmUgZG9uZSBhZnRlciBpbnN0YWxsRXZlbnRSb3V0ZXIoKVxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5pbnN0YWxsRXZlbnRSb3V0ZXIoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vbW91bnRQbHVnaW5JZlJlYWR5KCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAvL3RoaXMuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vdGhpcy5hZGRFdmVudExpc3RlbmVyKCdpbnB1dCcpO1xuICAgICAgICAgICAgICAgICAgICAgICAgLy90aGlzLmFkZEV2ZW50TGlzdGVuZXIoJ2NoYW5nZScpO1xuICAgICAgICAgICAgICAgICAgICAgICAgLy90aGlzLmFkZEV2ZW50TGlzdGVuZXIoJ2tleWRvd24nKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX21vdW50ZWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB0aGlzLm9uU2hvd24oKTtcblxuICAgICAgICAgICAgICAgIC8vIFRPRE9cbiAgICAgICAgfVxuXG4gICAgICAgIC8qXG4gICAgICAgIGFkZEV2ZW50TGlzdGVuZXJ4eHgodHlwZTogc3RyaW5nKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ2FkZEV2ZW50TGlzdGVuZXIgRU5URVInLCB7IGhhc0JvZHk6ICEhZG9jdW1lbnQuYm9keSwgaGFzRWxlbTogISF0aGlzLmVsZW0gfSk7XG4gICAgICAgICAgICAgICAgY29uc3QgZyA9IHdpbmRvdyBhcyBhbnk7XG5cbiAgICAgICAgICAgICAgICAvLyBBYm9ydCBvbGQgbGlzdGVuZXJzIChpZiBhbnkpXG4gICAgICAgICAgICAgICAgaWYgKGcuX19kZWxwaGluZV9hYm9ydF9jb250cm9sbGVyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBnLl9fZGVscGhpbmVfYWJvcnRfY29udHJvbGxlci5hYm9ydCgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBjb25zdCBhYyA9IG5ldyBBYm9ydENvbnRyb2xsZXIoKTtcbiAgICAgICAgICAgICAgICBnLl9fZGVscGhpbmVfYWJvcnRfY29udHJvbGxlciA9IGFjO1xuICAgICAgICAgICAgICAgIGNvbnN0IHsgc2lnbmFsIH0gPSBhYztcblxuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdJbnN0YWxsaW5nIGdsb2JhbCBkZWJ1ZyBsaXN0ZW5lcnMgKHJlc2V0K3JlaW5zdGFsbCknKTtcblxuICAgICAgICAgICAgICAgIGNvbnN0IHJvb3QgPSB0aGlzLmVsZW07XG4gICAgICAgICAgICAgICAgaWYgKCFyb290KSByZXR1cm47XG5cbiAgICAgICAgICAgICAgICAvLyBWb3RyZSBoYW5kbGVyIHN1ciBsZSByb290XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuZWxlbSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gRW5nbGlzaCBjb21tZW50cyBhcyByZXF1ZXN0ZWQuXG5cbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIEVuZ2xpc2ggY29tbWVudHMgYXMgcmVxdWVzdGVkLlxuXG4gICAgICAgICAgICAgICAgICAgICAgICByb290LmFkZEV2ZW50TGlzdGVuZXIoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIChldjogRXZlbnQpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCB0YXJnZXRFbGVtID0gZXYudGFyZ2V0IGFzIEVsZW1lbnQgfCBudWxsO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICghdGFyZ2V0RWxlbSkgcmV0dXJuO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgZm9ybSA9IHRoaXMuZmluZEZvcm1Gcm9tRXZlbnRUYXJnZXQodGFyZ2V0RWxlbSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFmb3JtKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnTm8gZm9ybSByZXNvbHZlZDsgZXZlbnQgaWdub3JlZCcpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGV2VHlwZSA9IGV2LnR5cGU7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBTdGFydCBmcm9tIHRoZSBjbGlja2VkIGNvbXBvbmVudCAob3IgYW55IGNvbXBvbmVudCB3cmFwcGVyKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxldCB0MTogRWxlbWVudCB8IG51bGwgPSB0YXJnZXRFbGVtLmNsb3Nlc3QoJ1tkYXRhLWNvbXBvbmVudF0nKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB3aGlsZSAodDEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGhhbmRsZXJOYW1lID0gdDEuZ2V0QXR0cmlidXRlKGBkYXRhLW9uJHtldlR5cGV9YCk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIElmIHdlIGZvdW5kIGEgaGFuZGxlciBvbiB0aGlzIGVsZW1lbnQsIGRpc3BhdGNoIGl0XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoaGFuZGxlck5hbWUgJiYgaGFuZGxlck5hbWUgIT09ICcnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IG5hbWUgPSB0MS5nZXRBdHRyaWJ1dGUoJ2RhdGEtbmFtZScpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBzZW5kZXIgPSBuYW1lID8gKGZvcm0uY29tcG9uZW50UmVnaXN0cnkuZ2V0KG5hbWUpID8/IG51bGwpIDogbnVsbDtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBtYXliZU1ldGhvZCA9IChmb3JtIGFzIGFueSlbaGFuZGxlck5hbWVdO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAodHlwZW9mIG1heWJlTWV0aG9kICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ05PVCBBIE1FVEhPRCcsIGhhbmRsZXJOYW1lKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBJZiBzZW5kZXIgaXMgbWlzc2luZywgZmFsbGJhY2sgdG8gdGhlIGZvcm0gaXRzZWxmIChzYWZlKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAobWF5YmVNZXRob2QgYXMgKHRoaXM6IFRGb3JtLCBzZW5kZXI6IGFueSkgPT4gYW55KS5jYWxsKGZvcm0sIHNlbmRlciA/PyBmb3JtKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBObyBoYW5kbGVyIGhlcmU6IHRyeSBnb2luZyBcInVwXCIgdXNpbmcgeW91ciBjb21wb25lbnQgdHJlZSBpZiBwb3NzaWJsZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgbmFtZSA9IHQxLmdldEF0dHJpYnV0ZSgnZGF0YS1uYW1lJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBjb21wID0gbmFtZSA/IGZvcm0uY29tcG9uZW50UmVnaXN0cnkuZ2V0KG5hbWUpIDogbnVsbDtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gUHJlZmVyIHlvdXIgVkNMLWxpa2UgcGFyZW50IGNoYWluIHdoZW4gYXZhaWxhYmxlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBuZXh0ID0gY29tcD8ucGFyZW50Py5lbGVtID8/IG51bGw7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEZhbGxiYWNrOiBzdGFuZGFyZCBET00gcGFyZW50XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0MSA9IG5leHQgPz8gdDEucGFyZW50RWxlbWVudD8uY2xvc2VzdCgnW2RhdGEtY29tcG9uZW50XScpID8/IG51bGw7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ0V2ZW50IG5vdCBoYW5kbGVkJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRydWVcbiAgICAgICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgICAgICAgICAgKi9cblxuICAgICAgICBwcm90ZWN0ZWQgb25DcmVhdGUoKSB7XG4gICAgICAgICAgICAgICAgLy9jb25zdCBidG4gPSB0aGlzLmNvbXBvbmVudFJlZ2lzdHJ5LmdldCgnYnV0dG9uMicpO1xuICAgICAgICAgICAgICAgIGNvbnN0IG9uU2hvd25OYW1lID0gdGhpcy5lbGVtIS5nZXRBdHRyaWJ1dGUoJ2RhdGEtb25jcmVhdGUnKTtcbiAgICAgICAgICAgICAgICBpZiAob25TaG93bk5hbWUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHF1ZXVlTWljcm90YXNrKCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgZm4gPSAodGhpcyBhcyBhbnkpW29uU2hvd25OYW1lXTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBmbiA9PT0gJ2Z1bmN0aW9uJykgZm4uY2FsbCh0aGlzLCBudWxsLCB0aGlzKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAvL2lmIChidG4pIGJ0bi5jb2xvciA9IFRDb2xvci5yZ2IoMCwgMCwgMjU1KTtcbiAgICAgICAgfVxuXG4gICAgICAgIHByb3RlY3RlZCBvblNob3duKCkge1xuICAgICAgICAgICAgICAgIC8vY29uc3QgYnRuID0gdGhpcy5jb21wb25lbnRSZWdpc3RyeS5nZXQoJ2J1dHRvbjMnKTtcbiAgICAgICAgICAgICAgICAvL2lmIChidG4pIGJ0bi5jb2xvciA9IFRDb2xvci5yZ2IoMCwgMjU1LCAyNTUpO1xuICAgICAgICAgICAgICAgIGNvbnN0IG9uU2hvd25OYW1lID0gdGhpcy5lbGVtIS5nZXRBdHRyaWJ1dGUoJ2RhdGEtb25zaG93bicpO1xuICAgICAgICAgICAgICAgIGlmIChvblNob3duTmFtZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcXVldWVNaWNyb3Rhc2soKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBmbiA9ICh0aGlzIGFzIGFueSlbb25TaG93bk5hbWVdO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAodHlwZW9mIGZuID09PSAnZnVuY3Rpb24nKSBmbi5jYWxsKHRoaXMsIG51bGwsIHRoaXMpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICB9XG59XG5cbmV4cG9ydCBjbGFzcyBUQnV0dG9uIGV4dGVuZHMgVENvbXBvbmVudDxUQnV0dG9uPiB7XG4gICAgICAgIHByaXZhdGUgX2NhcHRpb246IHN0cmluZyA9ICcnO1xuXG4gICAgICAgIGh0bWxCdXR0b24oKTogSFRNTEJ1dHRvbkVsZW1lbnQge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmh0bWxFbGVtZW50ISBhcyBIVE1MQnV0dG9uRWxlbWVudDtcbiAgICAgICAgfVxuXG4gICAgICAgIGdldCBjYXB0aW9uKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLl9jYXB0aW9uO1xuICAgICAgICB9XG4gICAgICAgIHNldCBjYXB0aW9uKGNhcHRpb24pIHtcbiAgICAgICAgICAgICAgICB0aGlzLnNldENhcHRpb24oY2FwdGlvbik7XG4gICAgICAgIH1cbiAgICAgICAgc2V0Q2FwdGlvbihzOiBzdHJpbmcpIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9jYXB0aW9uID0gcztcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5odG1sRWxlbWVudCkgdGhpcy5odG1sRWxlbWVudC50ZXh0Q29udGVudCA9IHM7XG4gICAgICAgIH1cblxuICAgICAgICBwcml2YXRlIF9lbmFibGVkOiBib29sZWFuID0gdHJ1ZTtcbiAgICAgICAgZ2V0IGVuYWJsZWQoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2VuYWJsZWQ7XG4gICAgICAgIH1cbiAgICAgICAgc2V0IGVuYWJsZWQoZW5hYmxlZCkge1xuICAgICAgICAgICAgICAgIHRoaXMuc2V0RW5hYmxlZChlbmFibGVkKTtcbiAgICAgICAgfVxuICAgICAgICBzZXRFbmFibGVkKGVuYWJsZWQ6IGJvb2xlYW4pIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9lbmFibGVkID0gZW5hYmxlZDtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5odG1sRWxlbWVudCkgdGhpcy5odG1sQnV0dG9uKCkuZGlzYWJsZWQgPSAhZW5hYmxlZDtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0cnVjdG9yKG5hbWU6IHN0cmluZywgZm9ybTogVEZvcm0sIHBhcmVudDogVENvbXBvbmVudCkge1xuICAgICAgICAgICAgICAgIHN1cGVyKFRNZXRhQnV0dG9uLm1ldGFDbGFzcywgbmFtZSwgZm9ybSwgcGFyZW50KTtcbiAgICAgICAgICAgICAgICAvL3N1cGVyKG5hbWUsIGZvcm0sIHBhcmVudCk7XG4gICAgICAgICAgICAgICAgLy90aGlzLm5hbWUgPSBuYW1lO1xuICAgICAgICAgICAgICAgIC8vdGhpcy5mb3JtID0gZm9ybTtcbiAgICAgICAgICAgICAgICAvL3RoaXMucGFyZW50ID0gcGFyZW50O1xuICAgICAgICB9XG4gICAgICAgIGFsbG93c0NoaWxkcmVuKCk6IGJvb2xlYW4ge1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxufVxuXG5leHBvcnQgY2xhc3MgVE1ldGFCdXR0b24gZXh0ZW5kcyBUTWV0YUNvbXBvbmVudDxUQnV0dG9uPiB7XG4gICAgICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICAgICAgICAgIHN1cGVyKCk7XG4gICAgICAgIH1cbiAgICAgICAgc3RhdGljIG1ldGFDbGFzczogVE1ldGFCdXR0b24gPSBuZXcgVE1ldGFCdXR0b24oKTtcbiAgICAgICAgZ2V0TWV0YUNsYXNzKCk6IFRNZXRhQ29tcG9uZW50PFRCdXR0b24+IHtcbiAgICAgICAgICAgICAgICByZXR1cm4gVE1ldGFCdXR0b24ubWV0YUNsYXNzO1xuICAgICAgICB9XG4gICAgICAgIHJlYWRvbmx5IHR5cGVOYW1lID0gJ1RCdXR0b24nO1xuXG4gICAgICAgIGNyZWF0ZShuYW1lOiBzdHJpbmcsIGZvcm06IFRGb3JtLCBwYXJlbnQ6IFRDb21wb25lbnQ8YW55Pikge1xuICAgICAgICAgICAgICAgIHJldHVybiBuZXcgVEJ1dHRvbihuYW1lLCBmb3JtLCBwYXJlbnQpO1xuICAgICAgICB9XG5cbiAgICAgICAgcHJvcHMoKTogUHJvcFNwZWM8VEJ1dHRvbj5bXSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIFtcbiAgICAgICAgICAgICAgICAgICAgICAgIHsgbmFtZTogJ2NhcHRpb24nLCBraW5kOiAnc3RyaW5nJywgYXBwbHk6IChvLCB2KSA9PiAoby5jYXB0aW9uID0gU3RyaW5nKHYpKSB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgeyBuYW1lOiAnZW5hYmxlZCcsIGtpbmQ6ICdib29sZWFuJywgYXBwbHk6IChvLCB2KSA9PiAoby5lbmFibGVkID0gQm9vbGVhbih2KSkgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHsgbmFtZTogJ2NvbG9yJywga2luZDogJ2NvbG9yJywgYXBwbHk6IChvLCB2KSA9PiAoby5jb2xvciA9IHYgYXMgYW55KSB9XG4gICAgICAgICAgICAgICAgXTtcbiAgICAgICAgfVxufVxuXG5leHBvcnQgY2xhc3MgVEFwcGxpY2F0aW9uIHtcbiAgICAgICAgc3RhdGljIFRoZUFwcGxpY2F0aW9uOiBUQXBwbGljYXRpb247XG4gICAgICAgIC8vc3RhdGljIHBsdWdpblJlZ2lzdHJ5ID0gbmV3IFBsdWdpblJlZ2lzdHJ5KCk7XG4gICAgICAgIC8vcGx1Z2luczogSVBsdWdpblJlZ2lzdHJ5O1xuICAgICAgICBwcml2YXRlIGZvcm1zOiBURm9ybVtdID0gW107XG4gICAgICAgIHJlYWRvbmx5IHR5cGVzID0gbmV3IENvbXBvbmVudFR5cGVSZWdpc3RyeSgpO1xuICAgICAgICBtYWluRm9ybTogVEZvcm0gfCBudWxsID0gbnVsbDtcblxuICAgICAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgICAgICAgICBUQXBwbGljYXRpb24uVGhlQXBwbGljYXRpb24gPSB0aGlzO1xuICAgICAgICAgICAgICAgIHJlZ2lzdGVyQnVpbHRpbnModGhpcy50eXBlcyk7XG4gICAgICAgIH1cblxuICAgICAgICBjcmVhdGVGb3JtPFQgZXh0ZW5kcyBURm9ybT4oY3RvcjogbmV3ICguLi5hcmdzOiBhbnlbXSkgPT4gVCwgbmFtZTogc3RyaW5nKTogVCB7XG4gICAgICAgICAgICAgICAgY29uc3QgZiA9IG5ldyBjdG9yKG5hbWUpO1xuICAgICAgICAgICAgICAgIHRoaXMuZm9ybXMucHVzaChmKTtcbiAgICAgICAgICAgICAgICBpZiAoIXRoaXMubWFpbkZvcm0pIHRoaXMubWFpbkZvcm0gPSBmO1xuICAgICAgICAgICAgICAgIHJldHVybiBmO1xuICAgICAgICB9XG5cbiAgICAgICAgcnVuKCkge1xuICAgICAgICAgICAgICAgIHRoaXMucnVuV2hlbkRvbVJlYWR5KCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLm1haW5Gb3JtKSB0aGlzLm1haW5Gb3JtLnNob3coKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsc2UgdGhpcy5hdXRvU3RhcnQoKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIHByb3RlY3RlZCBhdXRvU3RhcnQoKSB7XG4gICAgICAgICAgICAgICAgLy8gZmFsbGJhY2s6IGNob2lzaXIgdW5lIGZvcm0gZW5yZWdpc3RyXHUwMEU5ZSwgb3UgY3JcdTAwRTllciB1bmUgZm9ybSBpbXBsaWNpdGVcbiAgICAgICAgfVxuXG4gICAgICAgIHJ1bldoZW5Eb21SZWFkeShmbjogKCkgPT4gdm9pZCkge1xuICAgICAgICAgICAgICAgIGlmIChkb2N1bWVudC5yZWFkeVN0YXRlID09PSAnbG9hZGluZycpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdET01Db250ZW50TG9hZGVkJywgZm4sIHsgb25jZTogdHJ1ZSB9KTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgZm4oKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgIH1cbn1cblxuLypcblxuZXhwb3J0IGNsYXNzIFZ1ZUNvbXBvbmVudCBleHRlbmRzIFRDb21wb25lbnQge31cblxuZXhwb3J0IGNsYXNzIFJlYWN0Q29tcG9uZW50IGV4dGVuZHMgVENvbXBvbmVudCB7fVxuXG5leHBvcnQgY2xhc3MgU3ZlbHRlQ29tcG9uZW50IGV4dGVuZHMgVENvbXBvbmVudCB7fVxuXG5leHBvcnQgY2xhc3MgUGx1Z2luSG9zdDxQcm9wcyBleHRlbmRzIEpzb24gPSBKc29uPiBleHRlbmRzIFRDb21wb25lbnQge1xuICAgICAgICBwcml2YXRlIHBsdWdpbjogUGx1Z2luPFByb3BzPjtcbiAgICAgICAgcHJpdmF0ZSBzZXJ2aWNlczogRGVscGhpbmVTZXJ2aWNlcztcbiAgICAgICAgcHJpdmF0ZSBtb3VudGVkID0gZmFsc2U7XG5cbiAgICAgICAgY29uc3RydWN0b3IocGx1Z2luOiBVSVBsdWdpbjxQcm9wcz4sIHNlcnZpY2VzOiBEZWxwaGluZVNlcnZpY2VzKSB7XG4gICAgICAgICAgICAgICAgc3VwZXIoJ3RvdG8nLCBudWxsLCBudWxsKTtcbiAgICAgICAgICAgICAgICB0aGlzLnBsdWdpbiA9IHBsdWdpbjtcbiAgICAgICAgICAgICAgICB0aGlzLnNlcnZpY2VzID0gc2VydmljZXM7XG4gICAgICAgIH1cblxuICAgICAgICBtb3VudChwcm9wczogUHJvcHMpIHtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5tb3VudGVkKSB0aHJvdyBuZXcgRXJyb3IoJ1BsdWdpbiBhbHJlYWR5IG1vdW50ZWQnKTtcbiAgICAgICAgICAgICAgICAvL3RoaXMucGx1Z2luLm1vdW50KHRoaXMuaHRtbEVsZW1lbnQsIHByb3BzLCB0aGlzLnNlcnZpY2VzKTtcbiAgICAgICAgICAgICAgICB0aGlzLm1vdW50ZWQgPSB0cnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgdXBkYXRlKHByb3BzOiBQcm9wcykge1xuICAgICAgICAgICAgICAgIGlmICghdGhpcy5tb3VudGVkKSB0aHJvdyBuZXcgRXJyb3IoJ1BsdWdpbiBub3QgbW91bnRlZCcpO1xuICAgICAgICAgICAgICAgIHRoaXMucGx1Z2luLnVwZGF0ZShwcm9wcyk7XG4gICAgICAgIH1cblxuICAgICAgICB1bm1vdW50KCkge1xuICAgICAgICAgICAgICAgIGlmICghdGhpcy5tb3VudGVkKSByZXR1cm47XG4gICAgICAgICAgICAgICAgdGhpcy5wbHVnaW4udW5tb3VudCgpO1xuICAgICAgICAgICAgICAgIHRoaXMubW91bnRlZCA9IGZhbHNlO1xuICAgICAgICB9XG59XG4gICAgICAgICovXG4iLCAiLy8vIDxyZWZlcmVuY2UgbGliPVwiZG9tXCIgLz5cbi8vaW1wb3J0IHsgaW5zdGFsbERlbHBoaW5lUnVudGltZSB9IGZyb20gXCIuL3NyYy9kcnRcIjsgLy8gPC0tIFRTLCBwYXMgLmpzXG5pbXBvcnQgeyBURm9ybSwgVENvbG9yLCBUQXBwbGljYXRpb24sIFRDb21wb25lbnQsIFRCdXR0b24gfSBmcm9tICdAdmNsJztcbmltcG9ydCB7IENvbXBvbmVudFR5cGVSZWdpc3RyeSB9IGZyb20gJ0B2Y2wvU3RkQ3RybHMnO1xuLy9pbXBvcnQgeyBDb21wb25lbnRSZWdpc3RyeSB9IGZyb20gJ0BkcnQvQ29tcG9uZW50UmVnaXN0cnknO1xuaW1wb3J0IHsgVFBsdWdpbkhvc3QgfSBmcm9tICdAZHJ0L1VJUGx1Z2luJztcblxuZXhwb3J0IGZ1bmN0aW9uIHJlZ2lzdGVyUGx1Z2luVHlwZXMocmVnOiBDb21wb25lbnRUeXBlUmVnaXN0cnkpOiB2b2lkIHtcbiAgICAgICAgLypcbiAgICAgICAgLy8gRXhhbXBsZTogYW55IHR5cGUgbmFtZSBjYW4gYmUgcHJvdmlkZWQgYnkgYSBwbHVnaW4uXG4gICAgICAgIHJlZy5yZWdpc3Rlci5yZWdpc3RlclR5cGUoJ2NoYXJ0anMtcGllJywgKG5hbWU6IHN0cmluZywgZm9ybTogVEZvcm0sIHBhcmVudDogVENvbXBvbmVudCkgPT4ge1xuICAgICAgICAgICAgICAgIHJldHVybiBuZXcgUGx1Z2luSG9zdChuYW1lLCBmb3JtLCBwYXJlbnQpO1xuICAgICAgICB9KTtcblxuICAgICAgICByZWcucmVnaXN0ZXJUeXBlKCd2dWUtaGVsbG8nLCAobmFtZTogc3RyaW5nLCBmb3JtOiBURm9ybSwgcGFyZW50OiBUQ29tcG9uZW50KSA9PiB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBQbHVnaW5Ib3N0KG5hbWUsIGZvcm0sIHBhcmVudCk7XG4gICAgICAgIH0pO1xuICAgICAgICAqL1xufVxuXG5jbGFzcyBaYXphIGV4dGVuZHMgVEZvcm0ge1xuICAgICAgICAvLyBGb3JtIGNvbXBvbmVudHMgLSBUaGlzIGxpc3QgaXMgYXV0byBnZW5lcmF0ZWQgYnkgRGVscGhpbmVcbiAgICAgICAgLy8gLS0tLS0tLS0tLS0tLS0tXG4gICAgICAgIC8vYnV0dG9uMSA6IFRCdXR0b24gPSBuZXcgVEJ1dHRvbihcImJ1dHRvbjFcIiwgdGhpcywgdGhpcyk7XG4gICAgICAgIC8vYnV0dG9uMiA6IFRCdXR0b24gPSBuZXcgVEJ1dHRvbihcImJ1dHRvbjJcIiwgdGhpcywgdGhpcyk7XG4gICAgICAgIC8vYnV0dG9uMyA6IFRCdXR0b24gPSBuZXcgVEJ1dHRvbihcImJ1dHRvbjNcIiwgdGhpcywgdGhpcyk7XG4gICAgICAgIC8vIC0tLS0tLS0tLS0tLS0tLVxuXG4gICAgICAgIGNvbnN0cnVjdG9yKG5hbWU6IHN0cmluZykge1xuICAgICAgICAgICAgICAgIHN1cGVyKG5hbWUpO1xuICAgICAgICB9XG4gICAgICAgIC8vaW1wb3J0IHsgaW5zdGFsbERlbHBoaW5lUnVudGltZSB9IGZyb20gXCIuL2RydFwiO1xuXG4gICAgICAgIC8qXG5jb25zdCBydW50aW1lID0geyAgIFxuICBoYW5kbGVDbGljayh7IGVsZW1lbnQgfTogeyBlbGVtZW50OiBFbGVtZW50IH0pIHtcbiAgICBjb25zb2xlLmxvZyhcImNsaWNrZWQhXCIsIGVsZW1lbnQpO1xuICAgIC8vKGVsZW1lbnQgYXMgSFRNTEVsZW1lbnQpLnN0eWxlLmJhY2tncm91bmRDb2xvciA9IFwicmVkXCI7XG4gIH0sXG59OyBcbiovXG5cbiAgICAgICAgcHJvdGVjdGVkIG9uTXlDcmVhdGUoZXY6IEV2ZW50IHwgbnVsbCwgc2VuZGVyOiBUQ29tcG9uZW50KSB7XG4gICAgICAgICAgICAgICAgY29uc3QgYnRuID0gdGhpcy5jb21wb25lbnRSZWdpc3RyeS5nZXQoJ2J1dHRvbjInKTtcbiAgICAgICAgICAgICAgICBpZiAoYnRuKSBidG4uY29sb3IgPSBUQ29sb3IucmdiKDAsIDAsIDI1NSk7XG4gICAgICAgIH1cblxuICAgICAgICBwcm90ZWN0ZWQgb25NeVNob3duKGV2OiBFdmVudCB8IG51bGwsIHNlbmRlcjogVENvbXBvbmVudCkge1xuICAgICAgICAgICAgICAgIGNvbnN0IGJ0biA9IHRoaXMuY29tcG9uZW50UmVnaXN0cnkuZ2V0KCdidXR0b24zJyk7XG4gICAgICAgICAgICAgICAgaWYgKGJ0bikgYnRuLmNvbG9yID0gVENvbG9yLnJnYigwLCAyNTUsIDI1NSk7XG4gICAgICAgIH1cblxuICAgICAgICBidXR0b24xX29uY2xpY2soZXY6IEV2ZW50IHwgbnVsbCwgc2VuZGVyOiBUQ29tcG9uZW50KSB7XG4gICAgICAgICAgICAgICAgY29uc3QgYnRuID0gdGhpcy5jb21wb25lbnRSZWdpc3RyeS5nZXQ8VEJ1dHRvbj4oJ2J1dHRvbjEnKTtcbiAgICAgICAgICAgICAgICBpZiAoIWJ0bikge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS53YXJuKCdidXR0b24xIG5vdCBmb3VuZCBpbiByZWdpc3RyeScpO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAvL2J0bi5jb2xvciA9IFRDb2xvci5yZ2IoMCwgMCwgMjU1KTtcbiAgICAgICAgICAgICAgICBidG4hLmNvbG9yID0gVENvbG9yLnJnYigyNTUsIDAsIDApO1xuICAgICAgICAgICAgICAgIGJ0biEuc2V0Q2FwdGlvbignTUlNSScpO1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdCdXR0b24xIGNsaWNrZWQhISEhJyk7XG4gICAgICAgIH1cblxuICAgICAgICB6YXphX29uY2xpY2soZXY6IEV2ZW50IHwgbnVsbCwgc2VuZGVyOiBUQ29tcG9uZW50KSB7XG4gICAgICAgICAgICAgICAgY29uc3QgYnRuID0gdGhpcy5jb21wb25lbnRSZWdpc3RyeS5nZXQ8VEJ1dHRvbj4oJ2J1dHRvbngnKTtcbiAgICAgICAgICAgICAgICBidG4hLmNvbG9yID0gVENvbG9yLnJnYigwLCAyNTUsIDApO1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCd6YXphIGNsaWNrZWQhISEhJyk7XG4gICAgICAgICAgICAgICAgLy9idG4hLmVuYWJsZWQgPSBmYWxzZTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vaW5zdGFsbERlbHBoaW5lUnVudGltZShydW50aW1lKTtcbn0gLy8gY2xhc3MgemF6YVxuXG5jbGFzcyBNeUFwcGxpY2F0aW9uIGV4dGVuZHMgVEFwcGxpY2F0aW9uIHtcbiAgICAgICAgemF6YTogWmF6YTtcblxuICAgICAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgICAgICAgICBzdXBlcigpO1xuICAgICAgICAgICAgICAgIHRoaXMuemF6YSA9IG5ldyBaYXphKCd6YXphJyk7XG4gICAgICAgICAgICAgICAgdGhpcy5tYWluRm9ybSA9IHRoaXMuemF6YTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJ1bigpIHtcbiAgICAgICAgICAgICAgICAvL3RoaXMuemF6YS5jb21wb25lbnRSZWdpc3RyeS5idWlsZENvbXBvbmVudFRyZWUodGhpcy56YXphKTtcbiAgICAgICAgICAgICAgICAvL3RoaXMuemF6YS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycpO1xuXG4gICAgICAgICAgICAgICAgLy8gYXUgbGFuY2VtZW50XG4gICAgICAgICAgICAgICAgdGhpcy5ydW5XaGVuRG9tUmVhZHkoKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy56YXphLnNob3coKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgfVxufSAvLyBjbGFzcyBNeUFwcGxpY2F0aW9uXG5cbmNvbnN0IG15QXBwbGljYXRpb246IE15QXBwbGljYXRpb24gPSBuZXcgTXlBcHBsaWNhdGlvbigpO1xubXlBcHBsaWNhdGlvbi5ydW4oKTtcbiJdLAogICJtYXBwaW5ncyI6ICI7Ozs7O0FBTU8sU0FBUyxpQkFBaUIsT0FBOEI7QUFDdkQsUUFBTSxTQUFTLFlBQVksU0FBUztBQUc1Qzs7O0FDMERPLElBQWVBLGtCQUFmLE1BQWlFO0FBQUEsRUFHaEUsY0FBYztBQUFBLEVBQUM7QUFBQTtBQUFBLEVBUWYsUUFBdUI7QUFDZixXQUFPLENBQUM7QUFBQSxFQUNoQjtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFvQlI7QUFLTyxJQUFNQyx5QkFBTixNQUE0QjtBQUFBLEVBQTVCO0FBRUM7QUFBQSx3QkFBaUIsV0FBVSxvQkFBSSxJQUFpQztBQUFBO0FBQUEsRUFFaEUsU0FBK0IsTUFBeUI7QUFDaEQsUUFBSSxLQUFLLFFBQVEsSUFBSSxLQUFLLFFBQVEsR0FBRztBQUM3QixZQUFNLElBQUksTUFBTSxzQ0FBc0MsS0FBSyxRQUFRLEVBQUU7QUFBQSxJQUM3RTtBQUNBLFNBQUssUUFBUSxJQUFJLEtBQUssVUFBVSxJQUFJO0FBQUEsRUFDNUM7QUFBQTtBQUFBLEVBR0EsSUFBSSxVQUFtRDtBQUMvQyxXQUFPLEtBQUssUUFBUSxJQUFJLFFBQVE7QUFBQSxFQUN4QztBQUFBLEVBRUEsSUFBSSxVQUEyQjtBQUN2QixXQUFPLEtBQUssUUFBUSxJQUFJLFFBQVE7QUFBQSxFQUN4QztBQUFBLEVBRUEsT0FBaUI7QUFDVCxXQUFPLENBQUMsR0FBRyxLQUFLLFFBQVEsS0FBSyxDQUFDLEVBQUUsS0FBSztBQUFBLEVBQzdDO0FBQ1I7QUF5Qk8sSUFBTSxTQUFOLE1BQU0sUUFBTztBQUFBLEVBR1osWUFBWSxHQUFXO0FBRnZCO0FBR1EsU0FBSyxJQUFJO0FBQUEs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
