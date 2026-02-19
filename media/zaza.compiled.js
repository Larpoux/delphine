var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);

// src/vcl/registerVcl.ts
function registerBuiltins(types) {
  types.register(new TMetaButton());
}

// src/vcl/StdCtrls.ts
var TMetaComponent2 = class {
  /** Property schema for this component type */
  props() {
    return [];
  }
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
      const props = this.readProps(el, cls);
      for (const spec of cls.props()) {
        if (props[spec.name] !== void 0) {
          spec.apply(child, props[spec.name]);
        }
      }
      this.registerInstance(name, child);
      component.children.push(child);
      if (child.allowsChildren()) {
        this.buildComponentTree(form, child);
      }
    });
    form.addEventListener("click");
  }
};
var TComponent2 = class {
  constructor(name, form, parent) {
    __publicField(this, "parent", null);
    __publicField(this, "form", null);
    __publicField(this, "children", []);
    __publicField(this, "elem", null);
    __publicField(this, "name");
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
var _TForm = class _TForm extends TComponent2 {
  constructor(name) {
    super(name, null, null);
    __publicField(this, "_mounted", false);
    __publicField(this, "componentRegistry", new ComponentRegistry());
    this.form = this;
    _TForm.forms.set(name, this);
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
  show() {
    if (!this.elem) {
      this.elem = this.componentRegistry.resolveRoot();
    }
    if (!this._mounted) {
      this.componentRegistry.buildComponentTree(this, this);
      this._mounted = true;
    }
  }
  addEventListener(type) {
    console.log("addEventListener ENTER", { hasBody: !!document.body, hasElem: !!this.elem });
    const g = window;
    if (g.__delphine_abort_controller) {
      g.__delphine_abort_controller.abort();
    }
    const ac = new AbortController();
    g.__delphine_abort_controller = ac;
    const { signal } = ac;
    console.log("Installing global debug listeners (reset+reinstall)");
    const root = this.elem;
    if (!root) return;
    if (this.elem) {
      root.addEventListener(
        type,
        (ev) => {
          const targetElem = ev.target;
          if (!targetElem) return;
          const form = this.findFormFromEventTarget(targetElem);
          if (!form) {
            console.log("No form resolved; event ignored");
            return;
          }
          const evType = ev.type;
          let t1 = targetElem.closest("[data-component]");
          while (t1) {
            const handlerName = t1.getAttribute(`data-on${evType}`);
            if (handlerName && handlerName !== "") {
              const name2 = t1.getAttribute("data-name");
              const sender = name2 ? form.componentRegistry.get(name2) ?? null : null;
              const maybeMethod = form[handlerName];
              if (typeof maybeMethod !== "function") {
                console.log("NOT A METHOD", handlerName);
                return;
              }
              maybeMethod.call(form, sender ?? form);
              return;
            }
            const name = t1.getAttribute("data-name");
            const comp = name ? form.componentRegistry.get(name) : null;
            const next = comp?.parent?.elem ?? null;
            t1 = next ?? t1.parentElement?.closest("[data-component]") ?? null;
          }
          console.log("Event not handled");
        },
        true
      );
    }
  }
};
__publicField(_TForm, "forms", /* @__PURE__ */ new Map());
var TForm2 = _TForm;
var TButton2 = class extends TComponent2 {
  constructor(name, form, parent) {
    super(name, form, parent);
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
var TMetaButton = class extends TMetaComponent2 {
  constructor() {
    super(...arguments);
    __publicField(this, "typeName", "TButton");
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
var _TApplication = class _TApplication {
  constructor() {
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
  button1_onclick() {
    const btn = this.componentRegistry.get("button1");
    if (!btn) {
      console.warn("button1 not found in registry");
      return;
    }
    btn.color = TColor.rgb(255, 0, 0);
    btn.setCaption("MIMI");
    console.log("Button1 clicked!!!!");
  }
  zaza_onclick() {
    const btn = this.componentRegistry.get("button1");
    btn.color = TColor.rgb(0, 255, 0);
    console.log("zaza clicked!!!!");
    btn.enabled = false;
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vc3JjL3ZjbC9yZWdpc3RlclZjbC50cyIsICIuLi9zcmMvdmNsL1N0ZEN0cmxzLnRzIiwgIi4uL2V4YW1wbGVzL3phemEvemF6YS50cyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiLy8gRW5nbGlzaCBjb21tZW50cyBhcyByZXF1ZXN0ZWQuXG5cbi8vaW1wb3J0IHsgQ29tcG9uZW50VHlwZVJlZ2lzdHJ5IH0gZnJvbSAnQGRydCc7XG5pbXBvcnQgeyBUQnV0dG9uLCBUTWV0YUNvbXBvbmVudCwgVEZvcm0sIFRDb21wb25lbnQsIENvbXBvbmVudFR5cGVSZWdpc3RyeSwgVE1ldGFCdXR0b24gfSBmcm9tICdAdmNsJztcblxuLy8gRW5nbGlzaCBjb21tZW50cyBhcyByZXF1ZXN0ZWQuXG5leHBvcnQgZnVuY3Rpb24gcmVnaXN0ZXJCdWlsdGlucyh0eXBlczogQ29tcG9uZW50VHlwZVJlZ2lzdHJ5KSB7XG4gICAgICAgIHR5cGVzLnJlZ2lzdGVyKG5ldyBUTWV0YUJ1dHRvbigpKTtcbiAgICAgICAgLy8gdHlwZXMucmVnaXN0ZXIoVEVkaXRDbGFzcyk7XG4gICAgICAgIC8vIHR5cGVzLnJlZ2lzdGVyKFRMYWJlbENsYXNzKTtcbn1cbiIsICIvL2ltcG9ydCB7IENvbXBvbmVudFR5cGVSZWdpc3RyeSB9IGZyb20gJy4uL2RydC9VSVBsdWdpbic7IC8vIFBBUyBcImltcG9ydCB0eXBlXCJcbi8vIC8vaW1wb3J0IHR5cGUgeyBKc29uLCBEZWxwaGluZVNlcnZpY2VzLCBDb21wb25lbnRUeXBlUmVnaXN0cnkgfSBmcm9tICcuLi9kcnQvVUlQbHVnaW4nO1xuLy9pbXBvcnQgeyByZWdpc3RlclZjbFR5cGVzIH0gZnJvbSAnLi9yZWdpc3RlclZjbCc7XG5pbXBvcnQgeyBCdXR0b24gfSBmcm9tICdncmFwZXNqcyc7XG5pbXBvcnQgeyByZWdpc3RlckJ1aWx0aW5zIH0gZnJvbSAnLi9yZWdpc3RlclZjbCc7XG5cbmV4cG9ydCB0eXBlIENvbXBvbmVudEZhY3RvcnkgPSAobmFtZTogc3RyaW5nLCBmb3JtOiBURm9ybSwgb3duZXI6IFRDb21wb25lbnQpID0+IFRDb21wb25lbnQ7XG5cbi8vaW1wb3J0IHR5cGUgeyBKc29uIH0gZnJvbSAnLi9Kc29uJztcbmV4cG9ydCB0eXBlIEpzb24gPSBudWxsIHwgYm9vbGVhbiB8IG51bWJlciB8IHN0cmluZyB8IEpzb25bXSB8IHsgW2tleTogc3RyaW5nXTogSnNvbiB9O1xuXG50eXBlIFByb3BLaW5kID0gJ3N0cmluZycgfCAnbnVtYmVyJyB8ICdib29sZWFuJyB8ICdjb2xvcic7XG50eXBlIFByb3BTcGVjPFQsIFYgPSB1bmtub3duPiA9IHtcbiAgICAgICAgbmFtZTogc3RyaW5nO1xuICAgICAgICBraW5kOiBQcm9wS2luZDtcbiAgICAgICAgYXBwbHk6IChvYmo6IFQsIHZhbHVlOiBWKSA9PiB2b2lkO1xufTtcbi8vIEVuZ2xpc2ggY29tbWVudHMgYXMgcmVxdWVzdGVkLlxuZXhwb3J0IGFic3RyYWN0IGNsYXNzIFRNZXRhQ29tcG9uZW50PFQgZXh0ZW5kcyBUQ29tcG9uZW50ID0gVENvbXBvbmVudD4ge1xuICAgICAgICAvLyBUaGUgc3ltYm9saWMgbmFtZSB1c2VkIGluIEhUTUw6IGRhdGEtY29tcG9uZW50PVwiVEJ1dHRvblwiIG9yIFwibXktYnV0dG9uXCJcbiAgICAgICAgYWJzdHJhY3QgcmVhZG9ubHkgdHlwZU5hbWU6IHN0cmluZztcblxuICAgICAgICAvLyBDcmVhdGUgdGhlIHJ1bnRpbWUgaW5zdGFuY2UgYW5kIGF0dGFjaCBpdCB0byB0aGUgRE9NIGVsZW1lbnQuXG4gICAgICAgIGFic3RyYWN0IGNyZWF0ZShuYW1lOiBzdHJpbmcsIGZvcm06IFRGb3JtLCBwYXJlbnQ6IFRDb21wb25lbnQpOiBUO1xuXG4gICAgICAgIC8qKiBQcm9wZXJ0eSBzY2hlbWEgZm9yIHRoaXMgY29tcG9uZW50IHR5cGUgKi9cbiAgICAgICAgcHJvcHMoKTogUHJvcFNwZWM8VD5bXSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIFtdO1xuICAgICAgICB9XG5cbiAgICAgICAgLypcbiAgICAgICAgLy8gT3B0aW9uYWw6IHBhcnNlIEhUTUwgYXR0cmlidXRlcyAtPiBwcm9wcy9zdGF0ZVxuICAgICAgICAvLyBFeGFtcGxlOiBkYXRhLWNhcHRpb249XCJPS1wiIC0+IHsgY2FwdGlvbjogXCJPS1wiIH1cbiAgICAgICAgcGFyc2VQcm9wcz8oZWxlbTogSFRNTEVsZW1lbnQpOiBKc29uO1xuXG4gICAgICAgIC8vIE9wdGlvbmFsOiBhcHBseSBwcm9wcyB0byB0aGUgY29tcG9uZW50IChjYW4gYmUgY2FsbGVkIGFmdGVyIGNyZWF0ZSlcbiAgICAgICAgYXBwbHlQcm9wcz8oYzogVCwgcHJvcHM6IEpzb24pOiB2b2lkO1xuXG4gICAgICAgIC8vIE9wdGlvbmFsOiBEZXNpZ24tdGltZSBtZXRhZGF0YSAocGFsZXR0ZSwgaW5zcGVjdG9yLCBldGMuKVxuICAgICAgICBkZXNpZ25UaW1lPzoge1xuICAgICAgICAgICAgICAgIHBhbGV0dGVHcm91cD86IHN0cmluZztcbiAgICAgICAgICAgICAgICBkaXNwbGF5TmFtZT86IHN0cmluZztcbiAgICAgICAgICAgICAgICBpY29uPzogc3RyaW5nOyAvLyBsYXRlclxuICAgICAgICAgICAgICAgIC8vIHByb3BlcnR5IHNjaGVtYSBjb3VsZCBsaXZlIGhlcmVcbiAgICAgICAgfTtcbiAgICAgICAgKi9cbn1cblxuLy9pbXBvcnQgdHlwZSB7IFRDb21wb25lbnRDbGFzcyB9IGZyb20gJy4vVENvbXBvbmVudENsYXNzJztcbi8vaW1wb3J0IHR5cGUgeyBUQ29tcG9uZW50IH0gZnJvbSAnQHZjbCc7XG5cbmV4cG9ydCBjbGFzcyBDb21wb25lbnRUeXBlUmVnaXN0cnkge1xuICAgICAgICAvLyBXZSBzdG9yZSBoZXRlcm9nZW5lb3VzIG1ldGFzLCBzbyB3ZSBrZWVwIHRoZW0gYXMgVE1ldGFDb21wb25lbnQ8YW55Pi5cbiAgICAgICAgcHJpdmF0ZSByZWFkb25seSBjbGFzc2VzID0gbmV3IE1hcDxzdHJpbmcsIFRNZXRhQ29tcG9uZW50PGFueT4+KCk7XG5cbiAgICAgICAgcmVnaXN0ZXI8VCBleHRlbmRzIFRDb21wb25lbnQ+KG1ldGE6IFRNZXRhQ29tcG9uZW50PFQ+KSB7XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuY2xhc3Nlcy5oYXMobWV0YS50eXBlTmFtZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgQ29tcG9uZW50IHR5cGUgYWxyZWFkeSByZWdpc3RlcmVkOiAke21ldGEudHlwZU5hbWV9YCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHRoaXMuY2xhc3Nlcy5zZXQobWV0YS50eXBlTmFtZSwgbWV0YSk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBJZiB5b3UganVzdCBuZWVkIFwic29tZXRoaW5nIG1ldGFcIiwgcmV0dXJuIGFueS1tZXRhLlxuICAgICAgICBnZXQodHlwZU5hbWU6IHN0cmluZyk6IFRNZXRhQ29tcG9uZW50PGFueT4gfCB1bmRlZmluZWQge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmNsYXNzZXMuZ2V0KHR5cGVOYW1lKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGhhcyh0eXBlTmFtZTogc3RyaW5nKTogYm9vbGVhbiB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuY2xhc3Nlcy5oYXModHlwZU5hbWUpO1xuICAgICAgICB9XG5cbiAgICAgICAgbGlzdCgpOiBzdHJpbmdbXSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIFsuLi50aGlzLmNsYXNzZXMua2V5cygpXS5zb3J0KCk7XG4gICAgICAgIH1cbn1cblxuLypcblxuLy9leHBvcnQgdHlwZSBDb21wb25lbnRGYWN0b3J5ID0gKG5hbWU6IHN0cmluZywgZm9ybTogVEZvcm0sIHBhcmVudDogVENvbXBvbmVudCkgPT4gVENvbXBvbmVudDtcblxuZXhwb3J0IGNsYXNzIENvbXBvbmVudFR5cGVSZWdpc3RyeSB7XG4gICAgICAgIHByaXZhdGUgZmFjdG9yaWVzID0gbmV3IE1hcDxzdHJpbmcsIENvbXBvbmVudEZhY3Rvcnk+KCk7XG5cbiAgICAgICAgZ2V0KG5hbWU6IHN0cmluZyk6IENvbXBvbmVudEZhY3RvcnkgfCBudWxsIHwgdW5kZWZpbmVkIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5mYWN0b3JpZXMuZ2V0KG5hbWUpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmVnaXN0ZXJUeXBlKHR5cGVOYW1lOiBzdHJpbmcsIGZhY3Rvcnk6IENvbXBvbmVudEZhY3RvcnkpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmZhY3Rvcmllcy5zZXQodHlwZU5hbWUsIGZhY3RvcnkpO1xuICAgICAgICB9XG5cbiAgICAgICAgY3JlYXRlKG5hbWU6IHN0cmluZywgZm9ybTogVEZvcm0sIHBhcmVudDogVENvbXBvbmVudCk6IFRDb21wb25lbnQgfCBudWxsIHtcbiAgICAgICAgICAgICAgICBjb25zdCBmID0gdGhpcy5mYWN0b3JpZXMuZ2V0KG5hbWUpO1xuICAgICAgICAgICAgICAgIHJldHVybiBmID8gZihuYW1lLCBmb3JtLCBwYXJlbnQpIDogbnVsbDtcbiAgICAgICAgfVxufVxuXG4qL1xuXG5leHBvcnQgY2xhc3MgVENvbG9yIHtcbiAgICAgICAgczogc3RyaW5nO1xuXG4gICAgICAgIGNvbnN0cnVjdG9yKHM6IHN0cmluZykge1xuICAgICAgICAgICAgICAgIHRoaXMucyA9IHM7XG4gICAgICAgIH1cbiAgICAgICAgLyogZmFjdG9yeSAqLyBzdGF0aWMgcmdiKHI6IG51bWJlciwgZzogbnVtYmVyLCBiOiBudW1iZXIpOiBUQ29sb3Ige1xuICAgICAgICAgICAgICAgIHJldHVybiBuZXcgVENvbG9yKGByZ2IoJHtyfSwgJHtnfSwgJHtifSlgKTtcbiAgICAgICAgfVxuICAgICAgICAvKiBmYWN0b3J5ICovIHN0YXRpYyByZ2JhKHI6IG51bWJlciwgZzogbnVtYmVyLCBiOiBudW1iZXIsIGE6IG51bWJlcik6IFRDb2xvciB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBUQ29sb3IoYHJnYmEoJHtyfSwgJHtnfSwgJHtifSwgJHthfSlgKTtcbiAgICAgICAgfVxufVxuXG5leHBvcnQgY2xhc3MgQ29tcG9uZW50UmVnaXN0cnkge1xuICAgICAgICBwcml2YXRlIGluc3RhbmNlcyA9IG5ldyBNYXA8c3RyaW5nLCBUQ29tcG9uZW50PigpO1xuXG4gICAgICAgIGNvbnN0cnVjdG9yKCkge31cblxuICAgICAgICByZWdpc3Rlckluc3RhbmNlKG5hbWU6IHN0cmluZywgYzogVENvbXBvbmVudCkge1xuICAgICAgICAgICAgICAgIHRoaXMuaW5zdGFuY2VzLnNldChuYW1lLCBjKTtcbiAgICAgICAgfVxuICAgICAgICBnZXQ8VCBleHRlbmRzIFRDb21wb25lbnQgPSBUQ29tcG9uZW50PihuYW1lOiBzdHJpbmcpOiBUIHwgdW5kZWZpbmVkIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5pbnN0YW5jZXMuZ2V0KG5hbWUpIGFzIFQgfCB1bmRlZmluZWQ7XG4gICAgICAgIH1cblxuICAgICAgICBjbGVhcigpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmluc3RhbmNlcy5jbGVhcigpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmVzb2x2ZVJvb3QoKTogSFRNTEVsZW1lbnQge1xuICAgICAgICAgICAgICAgIC8vIFByZWZlciBib2R5IGFzIHRoZSBjYW5vbmljYWwgcm9vdC5cbiAgICAgICAgICAgICAgICBpZiAoZG9jdW1lbnQuYm9keT8uZGF0YXNldD8uY29tcG9uZW50KSByZXR1cm4gZG9jdW1lbnQuYm9keTtcblxuICAgICAgICAgICAgICAgIC8vIEJhY2t3YXJkIGNvbXBhdGliaWxpdHk6IG9sZCB3cmFwcGVyIGRpdi5cbiAgICAgICAgICAgICAgICBjb25zdCBsZWdhY3kgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnZGVscGhpbmUtcm9vdCcpO1xuICAgICAgICAgICAgICAgIGlmIChsZWdhY3kpIHJldHVybiBsZWdhY3k7XG5cbiAgICAgICAgICAgICAgICAvLyBMYXN0IHJlc29ydC5cbiAgICAgICAgICAgICAgICByZXR1cm4gZG9jdW1lbnQuYm9keSA/PyBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQ7XG4gICAgICAgIH1cblxuICAgICAgICBwcml2YXRlIHJlYWRQcm9wcyhlbDogRWxlbWVudCwgbWV0YTogVE1ldGFDb21wb25lbnQ8YW55Pikge1xuICAgICAgICAgICAgICAgIGNvbnN0IG91dDogUmVjb3JkPHN0cmluZywgYW55PiA9IHt9O1xuICAgICAgICAgICAgICAgIGZvciAoY29uc3Qgc3BlYyBvZiBtZXRhLnByb3BzKCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHJhdyA9IGVsLmdldEF0dHJpYnV0ZShgZGF0YS0ke3NwZWMubmFtZX1gKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChyYXcgPT0gbnVsbCkgY29udGludWU7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIG91dFtzcGVjLm5hbWVdID0gdGhpcy5jb252ZXJ0KHJhdywgc3BlYy5raW5kKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIG91dDtcbiAgICAgICAgfVxuXG4gICAgICAgIHByaXZhdGUgY29udmVydChyYXc6IHN0cmluZywga2luZDogUHJvcEtpbmQpIHtcbiAgICAgICAgICAgICAgICBzd2l0Y2ggKGtpbmQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgJ3N0cmluZyc6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiByYXc7XG4gICAgICAgICAgICAgICAgICAgICAgICBjYXNlICdudW1iZXInOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gTnVtYmVyKHJhdyk7XG4gICAgICAgICAgICAgICAgICAgICAgICBjYXNlICdib29sZWFuJzpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJhdyA9PT0gJ3RydWUnIHx8IHJhdyA9PT0gJzEnIHx8IHJhdyA9PT0gJyc7XG4gICAgICAgICAgICAgICAgICAgICAgICBjYXNlICdjb2xvcic6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiByYXc7IC8vIG91IHBhcnNlIGVuIFRDb2xvciBzaSB2b3VzIGF2ZXpcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBidWlsZENvbXBvbmVudFRyZWUoZm9ybTogVEZvcm0sIGNvbXBvbmVudDogVENvbXBvbmVudCkge1xuICAgICAgICAgICAgICAgIHRoaXMuY2xlYXIoKTtcbiAgICAgICAgICAgICAgICAvLyByZXNvbHZlUm9vdCBlc3QgbWFpbnRlbmFudCBhcHBlbFx1MDBFOSBwYXIgVEZvcm06OnNob3coKS4gSW51dGlsZSBkZSBsZSBmYWlyZSBpY2lcbiAgICAgICAgICAgICAgICAvL2NvbnN0IHJvb3QgPSBURG9jdW1lbnQuYm9keTtcbiAgICAgICAgICAgICAgICAvL2NvbnN0IHJvb3QgPSAoZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2RlbHBoaW5lLXJvb3QnKSA/PyBkb2N1bWVudC5ib2R5KSBhcyBIVE1MRWxlbWVudDtcbiAgICAgICAgICAgICAgICAvL2NvbnN0IHJvb3QgPSAoZG9jdW1lbnQuYm9keT8ubWF0Y2hlcygnW2RhdGEtY29tcG9uZW50XScpID8gZG9jdW1lbnQuYm9keSA6IG51bGwpID8/IChkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnZGVscGhpbmUtcm9vdCcpIGFzIEhUTUxFbGVtZW50IHwgbnVsbCkgPz8gZG9jdW1lbnQuYm9keTtcbiAgICAgICAgICAgICAgICAvL2NvbnN0IHJvb3QgPSB0aGlzLnJlc29sdmVSb290KCk7XG5cbiAgICAgICAgICAgICAgICAvLyAtLS0gRk9STSAtLS1cbiAgICAgICAgICAgICAgICAvLyBwcm92aXNvaXJlbWVudCBpZiAocm9vdC5nZXRBdHRyaWJ1dGUoJ2RhdGEtY29tcG9uZW50JykgPT09ICdURm9ybScpIHtcblxuICAgICAgICAgICAgICAgIHRoaXMucmVnaXN0ZXJJbnN0YW5jZShjb21wb25lbnQubmFtZSwgZm9ybSk7XG4gICAgICAgICAgICAgICAgLy99XG4gICAgICAgICAgICAgICAgY29uc3Qgcm9vdCA9IGNvbXBvbmVudC5lbGVtITtcblxuICAgICAgICAgICAgICAgIC8vIC0tLSBDSElMRCBDT01QT05FTlRTIC0tLVxuICAgICAgICAgICAgICAgIHJvb3QucXVlcnlTZWxlY3RvckFsbCgnOnNjb3BlID4gW2RhdGEtY29tcG9uZW50XScpLmZvckVhY2goKGVsKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoZWwgPT09IHJvb3QpIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IG5hbWUgPSBlbC5nZXRBdHRyaWJ1dGUoJ2RhdGEtbmFtZScpO1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgdHlwZSA9IGVsLmdldEF0dHJpYnV0ZSgnZGF0YS1jb21wb25lbnQnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vY29uc3QgdGl0aSA9IGVsLmdldEF0dHJpYnV0ZSgnZGF0YS1vbmNsaWNrJyk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIC8vY29uc29sZS5sb2coYHRpdGkgPSAke3RpdGl9YCk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIC8vbGV0IGNvbXA6IFRDb21wb25lbnQgfCBudWxsID0gbnVsbDtcblxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gVGhlIGZvbGxvd2luZyBzd2l0Y2ggaXMganVzdCBmb3Igbm93LiBJbiB0aGUgZnV0dXJlIGl0IHdpbGwgbm90IGJlIG5lY2Vzc2FyeVxuICAgICAgICAgICAgICAgICAgICAgICAgLypcbiAgICAgICAgICAgICAgICAgICAgICAgIHN3aXRjaCAodHlwZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYXNlICdteS1idXR0b24nOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbXAgPSBuZXcgVEJ1dHRvbihuYW1lISwgZm9ybSwgZm9ybSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSAnZGVscGhpbmUtcGx1Z2luJzpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvL2NvbXAgPSBuZXcgUGx1Z2luSG9zdChuYW1lLCBmb3JtLCBmb3JtKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSovXG4gICAgICAgICAgICAgICAgICAgICAgICAvL2NvbnN0IGFwcGxpY2F0aW9uOiBUQXBwbGljYXRpb24gPSBuZXcgVEFwcGxpY2F0aW9uKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAvL2NvbnN0IGZhY3RvcnkgPSBUQXBwbGljYXRpb24uVGhlQXBwbGljYXRpb24udHlwZXMuZ2V0KHR5cGUhKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8qXG4gICAgICAgICAgICAgICAgICAgICAgICBsZXQgY29tcDogVENvbXBvbmVudCB8IG51bGwgPSBudWxsO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGZhY3RvcnkpIGNvbXAgPSBmYWN0b3J5KG5hbWUhLCBmb3JtLCBmb3JtKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGNvbXApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29tcC5lbGVtID0gZWw7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucmVnaXN0ZXIobmFtZSEsIGNvbXApO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAqL1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBjbHMgPSBUQXBwbGljYXRpb24uVGhlQXBwbGljYXRpb24udHlwZXMuZ2V0KHR5cGUhKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghY2xzKSByZXR1cm47XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGNoaWxkID0gY2xzLmNyZWF0ZShuYW1lISwgZm9ybSwgY29tcG9uZW50KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIG5hbWU6IHN0cmluZywgZm9ybTogVEZvcm0sIHBhcmVudDogVENvbXBvbmVudCwgZWxlbTogSFRNTEVsZW1lbnRcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghY2hpbGQpIHJldHVybjtcblxuICAgICAgICAgICAgICAgICAgICAgICAgLy9jaGlsZC5wYXJlbnQgPSBjb21wb25lbnQ7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGNoaWxkLmVsZW0gPSBlbDtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vY2hpbGQuZm9ybSA9IGZvcm07XG4gICAgICAgICAgICAgICAgICAgICAgICAvL2NoaWxkLm5hbWUgPSBuYW1lITtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIE9wdGlvbmFsIHByb3BzXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBwcm9wcyA9IHRoaXMucmVhZFByb3BzKGVsLCBjbHMpO1xuICAgICAgICAgICAgICAgICAgICAgICAgZm9yIChjb25zdCBzcGVjIG9mIGNscy5wcm9wcygpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChwcm9wc1tzcGVjLm5hbWVdICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzcGVjLmFwcGx5KGNoaWxkLCBwcm9wc1tzcGVjLm5hbWVdKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5yZWdpc3Rlckluc3RhbmNlKG5hbWUhLCBjaGlsZCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb21wb25lbnQuY2hpbGRyZW4ucHVzaChjaGlsZCk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChjaGlsZC5hbGxvd3NDaGlsZHJlbigpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuYnVpbGRDb21wb25lbnRUcmVlKGZvcm0sIGNoaWxkKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICBmb3JtLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJyk7XG4gICAgICAgIH1cbn1cblxuZXhwb3J0IGNsYXNzIFRDb21wb25lbnQge1xuICAgICAgICBwYXJlbnQ6IFRDb21wb25lbnQgfCBudWxsID0gbnVsbDtcbiAgICAgICAgZm9ybTogVEZvcm0gfCBudWxsID0gbnVsbDtcbiAgICAgICAgY2hpbGRyZW46IFRDb21wb25lbnRbXSA9IFtdO1xuXG4gICAgICAgIGVsZW06IEVsZW1lbnQgfCBudWxsID0gbnVsbDtcbiAgICAgICAgZ2V0IGh0bWxFbGVtZW50KCk6IEhUTUxFbGVtZW50IHwgbnVsbCB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuZWxlbSBhcyBIVE1MRWxlbWVudCB8IG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgbmFtZTogc3RyaW5nO1xuICAgICAgICBjb25zdHJ1Y3RvcihuYW1lOiBzdHJpbmcsIGZvcm06IFRGb3JtIHwgbnVsbCwgcGFyZW50OiBUQ29tcG9uZW50IHwgbnVsbCkge1xuICAgICAgICAgICAgICAgIHRoaXMubmFtZSA9IG5hbWU7XG4gICAgICAgICAgICAgICAgdGhpcy5wYXJlbnQgPSBwYXJlbnQ7XG4gICAgICAgICAgICAgICAgcGFyZW50Py5jaGlsZHJlbi5wdXNoKHRoaXMpO1xuICAgICAgICAgICAgICAgIHRoaXMuZm9ybSA9IGZvcm07XG4gICAgICAgICAgICAgICAgdGhpcy5uYW1lID0gbmFtZTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8qKiBNYXkgY29udGFpbiBjaGlsZCBjb21wb25lbnRzICovXG4gICAgICAgIGFsbG93c0NoaWxkcmVuKCk6IGJvb2xlYW4ge1xuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgZ2V0IGNvbG9yKCk6IFRDb2xvciB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBUQ29sb3IodGhpcy5nZXRTdHlsZVByb3AoJ2NvbG9yJykpO1xuICAgICAgICB9XG4gICAgICAgIHNldCBjb2xvcih2OiBUQ29sb3IpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnNldFN0eWxlUHJvcCgnY29sb3InLCB2LnMpO1xuICAgICAgICB9XG5cbiAgICAgICAgZ2V0IGJhY2tncm91bmRDb2xvcigpOiBUQ29sb3Ige1xuICAgICAgICAgICAgICAgIHJldHVybiBuZXcgVENvbG9yKHRoaXMuZ2V0U3R5bGVQcm9wKCdiYWNrZ3JvdW5kLWNvbG9yJykpO1xuICAgICAgICB9XG4gICAgICAgIHNldCBiYWNrZ3JvdW5kQ29sb3IodjogVENvbG9yKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5zZXRTdHlsZVByb3AoJ2JhY2tncm91bmQtY29sb3InLCB2LnMpO1xuICAgICAgICB9XG5cbiAgICAgICAgZ2V0IHdpZHRoKCk6IG51bWJlciB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHBhcnNlSW50KHRoaXMuZ2V0U3R5bGVQcm9wKCd3aWR0aCcpKTtcbiAgICAgICAgfVxuICAgICAgICBzZXQgd2lkdGgodjogbnVtYmVyKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5zZXRTdHlsZVByb3AoJ3dpZHRoJywgdi50b1N0cmluZygpKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGdldCBoZWlnaHQoKTogbnVtYmVyIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcGFyc2VJbnQodGhpcy5nZXRTdHlsZVByb3AoJ2hlaWdodCcpKTtcbiAgICAgICAgfVxuICAgICAgICBzZXQgaGVpZ2h0KHY6IG51bWJlcikge1xuICAgICAgICAgICAgICAgIHRoaXMuc2V0U3R5bGVQcm9wKCdoZWlnaHQnLCB2LnRvU3RyaW5nKCkpO1xuICAgICAgICB9XG5cbiAgICAgICAgZ2V0IG9mZnNldFdpZHRoKCk6IG51bWJlciB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuaHRtbEVsZW1lbnQhLm9mZnNldFdpZHRoO1xuICAgICAgICB9XG4gICAgICAgIGdldCBvZmZzZXRIZWlnaHQoKTogbnVtYmVyIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5odG1sRWxlbWVudCEub2Zmc2V0SGVpZ2h0O1xuICAgICAgICB9XG5cbiAgICAgICAgc2V0U3R5bGVQcm9wKG5hbWU6IHN0cmluZywgdmFsdWU6IHN0cmluZykge1xuICAgICAgICAgICAgICAgIHRoaXMuaHRtbEVsZW1lbnQhLnN0eWxlLnNldFByb3BlcnR5KG5hbWUsIHZhbHVlKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGdldFN0eWxlUHJvcChuYW1lOiBzdHJpbmcpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5odG1sRWxlbWVudCEuc3R5bGUuZ2V0UHJvcGVydHlWYWx1ZShuYW1lKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHNldFByb3AobmFtZTogc3RyaW5nLCB2YWx1ZTogc3RyaW5nKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5odG1sRWxlbWVudCEuc2V0QXR0cmlidXRlKG5hbWUsIHZhbHVlKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGdldFByb3AobmFtZTogc3RyaW5nKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMhLmh0bWxFbGVtZW50IS5nZXRBdHRyaWJ1dGUobmFtZSk7XG4gICAgICAgIH1cbn1cblxuZXhwb3J0IGNsYXNzIFREb2N1bWVudCB7XG4gICAgICAgIHN0YXRpYyBkb2N1bWVudDogVERvY3VtZW50ID0gbmV3IFREb2N1bWVudChkb2N1bWVudCk7XG4gICAgICAgIHN0YXRpYyBib2R5ID0gZG9jdW1lbnQuYm9keTtcblxuICAgICAgICBodG1sRG9jOiBEb2N1bWVudDtcbiAgICAgICAgY29uc3RydWN0b3IoaHRtbERvYzogRG9jdW1lbnQpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmh0bWxEb2MgPSBodG1sRG9jO1xuICAgICAgICB9XG59XG5cbmV4cG9ydCBjbGFzcyBURm9ybSBleHRlbmRzIFRDb21wb25lbnQge1xuICAgICAgICBzdGF0aWMgZm9ybXMgPSBuZXcgTWFwPHN0cmluZywgVEZvcm0+KCk7XG4gICAgICAgIHByaXZhdGUgX21vdW50ZWQgPSBmYWxzZTtcbiAgICAgICAgY29tcG9uZW50UmVnaXN0cnk6IENvbXBvbmVudFJlZ2lzdHJ5ID0gbmV3IENvbXBvbmVudFJlZ2lzdHJ5KCk7XG4gICAgICAgIGNvbnN0cnVjdG9yKG5hbWU6IHN0cmluZykge1xuICAgICAgICAgICAgICAgIHN1cGVyKG5hbWUsIG51bGwsIG51bGwpO1xuICAgICAgICAgICAgICAgIHRoaXMuZm9ybSA9IHRoaXM7XG4gICAgICAgICAgICAgICAgVEZvcm0uZm9ybXMuc2V0KG5hbWUsIHRoaXMpO1xuICAgICAgICAgICAgICAgIC8vdGhpcy5wYXJlbnQgPSB0aGlzO1xuICAgICAgICB9XG5cbiAgICAgICAgLyogICAgICAgIGZpbmRGb3JtRnJvbUV2ZW50VGFyZ2V0KGN1cnJlbnRUYXJnZXRFbGVtOiBFbGVtZW50KTogVEZvcm0gfCBudWxsIHtcbiAgICAgICAgICAgICAgICBjb25zdCBmb3JtTmFtZSA9IGN1cnJlbnRUYXJnZXRFbGVtLmdldEF0dHJpYnV0ZSgnZGF0YS1uYW1lJyk7XG4gICAgICAgICAgICAgICAgY29uc3QgZm9ybTogVEZvcm0gPSBURm9ybS5mb3Jtcy5nZXQoZm9ybU5hbWUhKSE7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZvcm07XG4gICAgICAgIH1cbiAgICAgICAgICAgICAgICAqL1xuXG4gICAgICAgIC8vIEVuZ2xpc2ggY29tbWVudHMgYXMgcmVxdWVzdGVkLlxuXG4gICAgICAgIGZpbmRGb3JtRnJvbUV2ZW50VGFyZ2V0KHRhcmdldDogRWxlbWVudCk6IFRGb3JtIHwgbnVsbCB7XG4gICAgICAgICAgICAgICAgLy8gMSkgRmluZCB0aGUgbmVhcmVzdCBlbGVtZW50IHRoYXQgbG9va3MgbGlrZSBhIGZvcm0gY29udGFpbmVyXG4gICAgICAgICAgICAgICAgY29uc3QgZm9ybUVsZW0gPSB0YXJnZXQuY2xvc2VzdCgnW2RhdGEtY29tcG9uZW50PVwiVEZvcm1cIl1bZGF0YS1uYW1lXScpIGFzIEVsZW1lbnQgfCBudWxsO1xuICAgICAgICAgICAgICAgIGlmICghZm9ybUVsZW0pIHJldHVybiBudWxsO1xuXG4gICAgICAgICAgICAgICAgLy8gMikgUmVzb2x2ZSB0aGUgVEZvcm0gaW5zdGFuY2VcbiAgICAgICAgICAgICAgICBjb25zdCBmb3JtTmFtZSA9IGZvcm1FbGVtLmdldEF0dHJpYnV0ZSgnZGF0YS1uYW1lJyk7XG4gICAgICAgICAgICAgICAgaWYgKCFmb3JtTmFtZSkgcmV0dXJuIG51bGw7XG5cbiAgICAgICAgICAgICAgICByZXR1cm4gVEZvcm0uZm9ybXMuZ2V0KGZvcm1OYW1lKSA/PyBudWxsO1xuICAgICAgICB9XG5cbiAgICAgICAgc2hvdygpIHtcbiAgICAgICAgICAgICAgICAvLyBNdXN0IGJlIGRvbmUgYmVmb3JlIGJ1aWxkQ29tcG9uZW50VHJlZSgpIGJlY2F1c2UgYGJ1aWxkQ29tcG9uZW50VHJlZSgpYCBkb2VzIG5vdCBkbyBgcmVzb2x2ZVJvb3QoKWAgaXRzZWxmLlxuICAgICAgICAgICAgICAgIGlmICghdGhpcy5lbGVtKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmVsZW0gPSB0aGlzLmNvbXBvbmVudFJlZ2lzdHJ5LnJlc29sdmVSb290KCk7IC8vIG91IHRoaXMucmVzb2x2ZVJvb3QoKVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoIXRoaXMuX21vdW50ZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuY29tcG9uZW50UmVnaXN0cnkuYnVpbGRDb21wb25lbnRUcmVlKHRoaXMsIHRoaXMpO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5fbW91bnRlZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLy8gVE9ET1xuICAgICAgICB9XG5cbiAgICAgICAgYWRkRXZlbnRMaXN0ZW5lcih0eXBlOiBzdHJpbmcpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnYWRkRXZlbnRMaXN0ZW5lciBFTlRFUicsIHsgaGFzQm9keTogISFkb2N1bWVudC5ib2R5LCBoYXNFbGVtOiAhIXRoaXMuZWxlbSB9KTtcbiAgICAgICAgICAgICAgICBjb25zdCBnID0gd2luZG93IGFzIGFueTtcblxuICAgICAgICAgICAgICAgIC8vIEFib3J0IG9sZCBsaXN0ZW5lcnMgKGlmIGFueSlcbiAgICAgICAgICAgICAgICBpZiAoZy5fX2RlbHBoaW5lX2Fib3J0X2NvbnRyb2xsZXIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGcuX19kZWxwaGluZV9hYm9ydF9jb250cm9sbGVyLmFib3J0KCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGNvbnN0IGFjID0gbmV3IEFib3J0Q29udHJvbGxlcigpO1xuICAgICAgICAgICAgICAgIGcuX19kZWxwaGluZV9hYm9ydF9jb250cm9sbGVyID0gYWM7XG4gICAgICAgICAgICAgICAgY29uc3QgeyBzaWduYWwgfSA9IGFjO1xuXG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ0luc3RhbGxpbmcgZ2xvYmFsIGRlYnVnIGxpc3RlbmVycyAocmVzZXQrcmVpbnN0YWxsKScpO1xuXG4gICAgICAgICAgICAgICAgY29uc3Qgcm9vdCA9IHRoaXMuZWxlbTtcbiAgICAgICAgICAgICAgICBpZiAoIXJvb3QpIHJldHVybjtcblxuICAgICAgICAgICAgICAgIC8vIFZvdHJlIGhhbmRsZXIgc3VyIGxlIHJvb3RcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5lbGVtKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBFbmdsaXNoIGNvbW1lbnRzIGFzIHJlcXVlc3RlZC5cblxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gRW5nbGlzaCBjb21tZW50cyBhcyByZXF1ZXN0ZWQuXG5cbiAgICAgICAgICAgICAgICAgICAgICAgIHJvb3QuYWRkRXZlbnRMaXN0ZW5lcihcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKGV2OiBFdmVudCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHRhcmdldEVsZW0gPSBldi50YXJnZXQgYXMgRWxlbWVudCB8IG51bGw7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCF0YXJnZXRFbGVtKSByZXR1cm47XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBmb3JtID0gdGhpcy5maW5kRm9ybUZyb21FdmVudFRhcmdldCh0YXJnZXRFbGVtKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoIWZvcm0pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdObyBmb3JtIHJlc29sdmVkOyBldmVudCBpZ25vcmVkJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgZXZUeXBlID0gZXYudHlwZTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFN0YXJ0IGZyb20gdGhlIGNsaWNrZWQgY29tcG9uZW50IChvciBhbnkgY29tcG9uZW50IHdyYXBwZXIpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbGV0IHQxOiBFbGVtZW50IHwgbnVsbCA9IHRhcmdldEVsZW0uY2xvc2VzdCgnW2RhdGEtY29tcG9uZW50XScpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHdoaWxlICh0MSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgaGFuZGxlck5hbWUgPSB0MS5nZXRBdHRyaWJ1dGUoYGRhdGEtb24ke2V2VHlwZX1gKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gSWYgd2UgZm91bmQgYSBoYW5kbGVyIG9uIHRoaXMgZWxlbWVudCwgZGlzcGF0Y2ggaXRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChoYW5kbGVyTmFtZSAmJiBoYW5kbGVyTmFtZSAhPT0gJycpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgbmFtZSA9IHQxLmdldEF0dHJpYnV0ZSgnZGF0YS1uYW1lJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHNlbmRlciA9IG5hbWUgPyAoZm9ybS5jb21wb25lbnRSZWdpc3RyeS5nZXQobmFtZSkgPz8gbnVsbCkgOiBudWxsO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IG1heWJlTWV0aG9kID0gKGZvcm0gYXMgYW55KVtoYW5kbGVyTmFtZV07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgbWF5YmVNZXRob2QgIT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnTk9UIEEgTUVUSE9EJywgaGFuZGxlck5hbWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIElmIHNlbmRlciBpcyBtaXNzaW5nLCBmYWxsYmFjayB0byB0aGUgZm9ybSBpdHNlbGYgKHNhZmUpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIChtYXliZU1ldGhvZCBhcyAodGhpczogVEZvcm0sIHNlbmRlcjogYW55KSA9PiBhbnkpLmNhbGwoZm9ybSwgc2VuZGVyID8/IGZvcm0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIE5vIGhhbmRsZXIgaGVyZTogdHJ5IGdvaW5nIFwidXBcIiB1c2luZyB5b3VyIGNvbXBvbmVudCB0cmVlIGlmIHBvc3NpYmxlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBuYW1lID0gdDEuZ2V0QXR0cmlidXRlKCdkYXRhLW5hbWUnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGNvbXAgPSBuYW1lID8gZm9ybS5jb21wb25lbnRSZWdpc3RyeS5nZXQobmFtZSkgOiBudWxsO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBQcmVmZXIgeW91ciBWQ0wtbGlrZSBwYXJlbnQgY2hhaW4gd2hlbiBhdmFpbGFibGVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IG5leHQgPSBjb21wPy5wYXJlbnQ/LmVsZW0gPz8gbnVsbDtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gRmFsbGJhY2s6IHN0YW5kYXJkIERPTSBwYXJlbnRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHQxID0gbmV4dCA/PyB0MS5wYXJlbnRFbGVtZW50Py5jbG9zZXN0KCdbZGF0YS1jb21wb25lbnRdJykgPz8gbnVsbDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnRXZlbnQgbm90IGhhbmRsZWQnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdHJ1ZVxuICAgICAgICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgIH1cbn1cblxuZXhwb3J0IGNsYXNzIFRCdXR0b24gZXh0ZW5kcyBUQ29tcG9uZW50IHtcbiAgICAgICAgcHJpdmF0ZSBfY2FwdGlvbjogc3RyaW5nID0gJyc7XG5cbiAgICAgICAgaHRtbEJ1dHRvbigpOiBIVE1MQnV0dG9uRWxlbWVudCB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuaHRtbEVsZW1lbnQhIGFzIEhUTUxCdXR0b25FbGVtZW50O1xuICAgICAgICB9XG5cbiAgICAgICAgZ2V0IGNhcHRpb24oKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2NhcHRpb247XG4gICAgICAgIH1cbiAgICAgICAgc2V0IGNhcHRpb24oY2FwdGlvbikge1xuICAgICAgICAgICAgICAgIHRoaXMuc2V0Q2FwdGlvbihjYXB0aW9uKTtcbiAgICAgICAgfVxuICAgICAgICBzZXRDYXB0aW9uKHM6IHN0cmluZykge1xuICAgICAgICAgICAgICAgIHRoaXMuX2NhcHRpb24gPSBzO1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLmh0bWxFbGVtZW50KSB0aGlzLmh0bWxFbGVtZW50LnRleHRDb250ZW50ID0gcztcbiAgICAgICAgfVxuXG4gICAgICAgIHByaXZhdGUgX2VuYWJsZWQ6IGJvb2xlYW4gPSB0cnVlO1xuICAgICAgICBnZXQgZW5hYmxlZCgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5fZW5hYmxlZDtcbiAgICAgICAgfVxuICAgICAgICBzZXQgZW5hYmxlZChlbmFibGVkKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5zZXRFbmFibGVkKGVuYWJsZWQpO1xuICAgICAgICB9XG4gICAgICAgIHNldEVuYWJsZWQoZW5hYmxlZDogYm9vbGVhbikge1xuICAgICAgICAgICAgICAgIHRoaXMuX2VuYWJsZWQgPSBlbmFibGVkO1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLmh0bWxFbGVtZW50KSB0aGlzLmh0bWxCdXR0b24oKS5kaXNhYmxlZCA9ICFlbmFibGVkO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3RydWN0b3IobmFtZTogc3RyaW5nLCBmb3JtOiBURm9ybSwgcGFyZW50OiBUQ29tcG9uZW50KSB7XG4gICAgICAgICAgICAgICAgc3VwZXIobmFtZSwgZm9ybSwgcGFyZW50KTtcbiAgICAgICAgICAgICAgICAvL3N1cGVyKG5hbWUsIGZvcm0sIHBhcmVudCk7XG4gICAgICAgICAgICAgICAgLy90aGlzLm5hbWUgPSBuYW1lO1xuICAgICAgICAgICAgICAgIC8vdGhpcy5mb3JtID0gZm9ybTtcbiAgICAgICAgICAgICAgICAvL3RoaXMucGFyZW50ID0gcGFyZW50O1xuICAgICAgICB9XG4gICAgICAgIGFsbG93c0NoaWxkcmVuKCk6IGJvb2xlYW4ge1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxufVxuXG5leHBvcnQgY2xhc3MgVE1ldGFCdXR0b24gZXh0ZW5kcyBUTWV0YUNvbXBvbmVudDxUQnV0dG9uPiB7XG4gICAgICAgIHJlYWRvbmx5IHR5cGVOYW1lID0gJ1RCdXR0b24nO1xuXG4gICAgICAgIGNyZWF0ZShuYW1lOiBzdHJpbmcsIGZvcm06IFRGb3JtLCBwYXJlbnQ6IFRDb21wb25lbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gbmV3IFRCdXR0b24obmFtZSwgZm9ybSwgcGFyZW50KTtcbiAgICAgICAgfVxuXG4gICAgICAgIHByb3BzKCk6IFByb3BTcGVjPFRCdXR0b24+W10ge1xuICAgICAgICAgICAgICAgIHJldHVybiBbXG4gICAgICAgICAgICAgICAgICAgICAgICB7IG5hbWU6ICdjYXB0aW9uJywga2luZDogJ3N0cmluZycsIGFwcGx5OiAobywgdikgPT4gKG8uY2FwdGlvbiA9IFN0cmluZyh2KSkgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHsgbmFtZTogJ2VuYWJsZWQnLCBraW5kOiAnYm9vbGVhbicsIGFwcGx5OiAobywgdikgPT4gKG8uZW5hYmxlZCA9IEJvb2xlYW4odikpIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICB7IG5hbWU6ICdjb2xvcicsIGtpbmQ6ICdjb2xvcicsIGFwcGx5OiAobywgdikgPT4gKG8uY29sb3IgPSB2IGFzIGFueSkgfVxuICAgICAgICAgICAgICAgIF07XG4gICAgICAgIH1cbn1cblxuZXhwb3J0IGNsYXNzIFRBcHBsaWNhdGlvbiB7XG4gICAgICAgIHN0YXRpYyBUaGVBcHBsaWNhdGlvbjogVEFwcGxpY2F0aW9uO1xuICAgICAgICBwcml2YXRlIGZvcm1zOiBURm9ybVtdID0gW107XG4gICAgICAgIHJlYWRvbmx5IHR5cGVzID0gbmV3IENvbXBvbmVudFR5cGVSZWdpc3RyeSgpO1xuICAgICAgICBtYWluRm9ybTogVEZvcm0gfCBudWxsID0gbnVsbDtcblxuICAgICAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgICAgICAgICBUQXBwbGljYXRpb24uVGhlQXBwbGljYXRpb24gPSB0aGlzO1xuICAgICAgICAgICAgICAgIHJlZ2lzdGVyQnVpbHRpbnModGhpcy50eXBlcyk7XG4gICAgICAgIH1cblxuICAgICAgICBjcmVhdGVGb3JtPFQgZXh0ZW5kcyBURm9ybT4oY3RvcjogbmV3ICguLi5hcmdzOiBhbnlbXSkgPT4gVCwgbmFtZTogc3RyaW5nKTogVCB7XG4gICAgICAgICAgICAgICAgY29uc3QgZiA9IG5ldyBjdG9yKG5hbWUpO1xuICAgICAgICAgICAgICAgIHRoaXMuZm9ybXMucHVzaChmKTtcbiAgICAgICAgICAgICAgICBpZiAoIXRoaXMubWFpbkZvcm0pIHRoaXMubWFpbkZvcm0gPSBmO1xuICAgICAgICAgICAgICAgIHJldHVybiBmO1xuICAgICAgICB9XG5cbiAgICAgICAgcnVuKCkge1xuICAgICAgICAgICAgICAgIHRoaXMucnVuV2hlbkRvbVJlYWR5KCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLm1haW5Gb3JtKSB0aGlzLm1haW5Gb3JtLnNob3coKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsc2UgdGhpcy5hdXRvU3RhcnQoKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIHByb3RlY3RlZCBhdXRvU3RhcnQoKSB7XG4gICAgICAgICAgICAgICAgLy8gZmFsbGJhY2s6IGNob2lzaXIgdW5lIGZvcm0gZW5yZWdpc3RyXHUwMEU5ZSwgb3UgY3JcdTAwRTllciB1bmUgZm9ybSBpbXBsaWNpdGVcbiAgICAgICAgfVxuXG4gICAgICAgIHJ1bldoZW5Eb21SZWFkeShmbjogKCkgPT4gdm9pZCkge1xuICAgICAgICAgICAgICAgIGlmIChkb2N1bWVudC5yZWFkeVN0YXRlID09PSAnbG9hZGluZycpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdET01Db250ZW50TG9hZGVkJywgZm4sIHsgb25jZTogdHJ1ZSB9KTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgZm4oKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgIH1cbn1cblxuLypcblxuZXhwb3J0IGNsYXNzIFZ1ZUNvbXBvbmVudCBleHRlbmRzIFRDb21wb25lbnQge31cblxuZXhwb3J0IGNsYXNzIFJlYWN0Q29tcG9uZW50IGV4dGVuZHMgVENvbXBvbmVudCB7fVxuXG5leHBvcnQgY2xhc3MgU3ZlbHRlQ29tcG9uZW50IGV4dGVuZHMgVENvbXBvbmVudCB7fVxuXG5leHBvcnQgY2xhc3MgUGx1Z2luSG9zdDxQcm9wcyBleHRlbmRzIEpzb24gPSBKc29uPiBleHRlbmRzIFRDb21wb25lbnQge1xuICAgICAgICBwcml2YXRlIHBsdWdpbjogUGx1Z2luPFByb3BzPjtcbiAgICAgICAgcHJpdmF0ZSBzZXJ2aWNlczogRGVscGhpbmVTZXJ2aWNlcztcbiAgICAgICAgcHJpdmF0ZSBtb3VudGVkID0gZmFsc2U7XG5cbiAgICAgICAgY29uc3RydWN0b3IocGx1Z2luOiBVSVBsdWdpbjxQcm9wcz4sIHNlcnZpY2VzOiBEZWxwaGluZVNlcnZpY2VzKSB7XG4gICAgICAgICAgICAgICAgc3VwZXIoJ3RvdG8nLCBudWxsLCBudWxsKTtcbiAgICAgICAgICAgICAgICB0aGlzLnBsdWdpbiA9IHBsdWdpbjtcbiAgICAgICAgICAgICAgICB0aGlzLnNlcnZpY2VzID0gc2VydmljZXM7XG4gICAgICAgIH1cblxuICAgICAgICBtb3VudChwcm9wczogUHJvcHMpIHtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5tb3VudGVkKSB0aHJvdyBuZXcgRXJyb3IoJ1BsdWdpbiBhbHJlYWR5IG1vdW50ZWQnKTtcbiAgICAgICAgICAgICAgICAvL3RoaXMucGx1Z2luLm1vdW50KHRoaXMuaHRtbEVsZW1lbnQsIHByb3BzLCB0aGlzLnNlcnZpY2VzKTtcbiAgICAgICAgICAgICAgICB0aGlzLm1vdW50ZWQgPSB0cnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgdXBkYXRlKHByb3BzOiBQcm9wcykge1xuICAgICAgICAgICAgICAgIGlmICghdGhpcy5tb3VudGVkKSB0aHJvdyBuZXcgRXJyb3IoJ1BsdWdpbiBub3QgbW91bnRlZCcpO1xuICAgICAgICAgICAgICAgIHRoaXMucGx1Z2luLnVwZGF0ZShwcm9wcyk7XG4gICAgICAgIH1cblxuICAgICAgICB1bm1vdW50KCkge1xuICAgICAgICAgICAgICAgIGlmICghdGhpcy5tb3VudGVkKSByZXR1cm47XG4gICAgICAgICAgICAgICAgdGhpcy5wbHVnaW4udW5tb3VudCgpO1xuICAgICAgICAgICAgICAgIHRoaXMubW91bnRlZCA9IGZhbHNlO1xuICAgICAgICB9XG59XG4gICAgICAgICovXG4iLCAiLy8vIDxyZWZlcmVuY2UgbGliPVwiZG9tXCIgLz5cbi8vaW1wb3J0IHsgaW5zdGFsbERlbHBoaW5lUnVudGltZSB9IGZyb20gXCIuL3NyYy9kcnRcIjsgLy8gPC0tIFRTLCBwYXMgLmpzXG5pbXBvcnQgeyBURm9ybSwgVENvbG9yLCBUQXBwbGljYXRpb24sIFRDb21wb25lbnQsIFRCdXR0b24gfSBmcm9tICdAdmNsJztcbmltcG9ydCB7IENvbXBvbmVudFR5cGVSZWdpc3RyeSB9IGZyb20gJ0B2Y2wvU3RkQ3RybHMnO1xuLy9pbXBvcnQgeyBDb21wb25lbnRSZWdpc3RyeSB9IGZyb20gJ0BkcnQvQ29tcG9uZW50UmVnaXN0cnknO1xuaW1wb3J0IHsgUGx1Z2luSG9zdCB9IGZyb20gJ0BkcnQvVUlQbHVnaW4nO1xuXG5leHBvcnQgZnVuY3Rpb24gcmVnaXN0ZXJQbHVnaW5UeXBlcyhyZWc6IENvbXBvbmVudFR5cGVSZWdpc3RyeSk6IHZvaWQge1xuICAgICAgICAvKlxuICAgICAgICAvLyBFeGFtcGxlOiBhbnkgdHlwZSBuYW1lIGNhbiBiZSBwcm92aWRlZCBieSBhIHBsdWdpbi5cbiAgICAgICAgcmVnLnJlZ2lzdGVyLnJlZ2lzdGVyVHlwZSgnY2hhcnRqcy1waWUnLCAobmFtZTogc3RyaW5nLCBmb3JtOiBURm9ybSwgcGFyZW50OiBUQ29tcG9uZW50KSA9PiB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBQbHVnaW5Ib3N0KG5hbWUsIGZvcm0sIHBhcmVudCk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHJlZy5yZWdpc3RlclR5cGUoJ3Z1ZS1oZWxsbycsIChuYW1lOiBzdHJpbmcsIGZvcm06IFRGb3JtLCBwYXJlbnQ6IFRDb21wb25lbnQpID0+IHtcbiAgICAgICAgICAgICAgICByZXR1cm4gbmV3IFBsdWdpbkhvc3QobmFtZSwgZm9ybSwgcGFyZW50KTtcbiAgICAgICAgfSk7XG4gICAgICAgICovXG59XG5cbmNsYXNzIFphemEgZXh0ZW5kcyBURm9ybSB7XG4gICAgICAgIC8vIEZvcm0gY29tcG9uZW50cyAtIFRoaXMgbGlzdCBpcyBhdXRvIGdlbmVyYXRlZCBieSBEZWxwaGluZVxuICAgICAgICAvLyAtLS0tLS0tLS0tLS0tLS1cbiAgICAgICAgLy9idXR0b24xIDogVEJ1dHRvbiA9IG5ldyBUQnV0dG9uKFwiYnV0dG9uMVwiLCB0aGlzLCB0aGlzKTtcbiAgICAgICAgLy9idXR0b24yIDogVEJ1dHRvbiA9IG5ldyBUQnV0dG9uKFwiYnV0dG9uMlwiLCB0aGlzLCB0aGlzKTtcbiAgICAgICAgLy9idXR0b24zIDogVEJ1dHRvbiA9IG5ldyBUQnV0dG9uKFwiYnV0dG9uM1wiLCB0aGlzLCB0aGlzKTtcbiAgICAgICAgLy8gLS0tLS0tLS0tLS0tLS0tXG5cbiAgICAgICAgY29uc3RydWN0b3IobmFtZTogc3RyaW5nKSB7XG4gICAgICAgICAgICAgICAgc3VwZXIobmFtZSk7XG4gICAgICAgIH1cbiAgICAgICAgLy9pbXBvcnQgeyBpbnN0YWxsRGVscGhpbmVSdW50aW1lIH0gZnJvbSBcIi4vZHJ0XCI7XG5cbiAgICAgICAgLypcbmNvbnN0IHJ1bnRpbWUgPSB7ICAgXG4gIGhhbmRsZUNsaWNrKHsgZWxlbWVudCB9OiB7IGVsZW1lbnQ6IEVsZW1lbnQgfSkge1xuICAgIGNvbnNvbGUubG9nKFwiY2xpY2tlZCFcIiwgZWxlbWVudCk7XG4gICAgLy8oZWxlbWVudCBhcyBIVE1MRWxlbWVudCkuc3R5bGUuYmFja2dyb3VuZENvbG9yID0gXCJyZWRcIjtcbiAgfSxcbn07IFxuKi9cblxuICAgICAgICBidXR0b24xX29uY2xpY2soKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgYnRuID0gdGhpcy5jb21wb25lbnRSZWdpc3RyeS5nZXQ8VEJ1dHRvbj4oJ2J1dHRvbjEnKTtcbiAgICAgICAgICAgICAgICBpZiAoIWJ0bikge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS53YXJuKCdidXR0b24xIG5vdCBmb3VuZCBpbiByZWdpc3RyeScpO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAvL2J0bi5jb2xvciA9IFRDb2xvci5yZ2IoMCwgMCwgMjU1KTtcbiAgICAgICAgICAgICAgICBidG4hLmNvbG9yID0gVENvbG9yLnJnYigyNTUsIDAsIDApO1xuICAgICAgICAgICAgICAgIGJ0biEuc2V0Q2FwdGlvbignTUlNSScpO1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdCdXR0b24xIGNsaWNrZWQhISEhJyk7XG4gICAgICAgIH1cblxuICAgICAgICB6YXphX29uY2xpY2soKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgYnRuID0gdGhpcy5jb21wb25lbnRSZWdpc3RyeS5nZXQ8VEJ1dHRvbj4oJ2J1dHRvbjEnKTtcbiAgICAgICAgICAgICAgICBidG4hLmNvbG9yID0gVENvbG9yLnJnYigwLCAyNTUsIDApO1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCd6YXphIGNsaWNrZWQhISEhJyk7XG4gICAgICAgICAgICAgICAgYnRuIS5lbmFibGVkID0gZmFsc2U7XG4gICAgICAgIH1cblxuICAgICAgICAvL2luc3RhbGxEZWxwaGluZVJ1bnRpbWUocnVudGltZSk7XG59IC8vIGNsYXNzIHphemFcblxuY2xhc3MgTXlBcHBsaWNhdGlvbiBleHRlbmRzIFRBcHBsaWNhdGlvbiB7XG4gICAgICAgIHphemE6IFphemE7XG5cbiAgICAgICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgICAgICAgICAgc3VwZXIoKTtcbiAgICAgICAgICAgICAgICB0aGlzLnphemEgPSBuZXcgWmF6YSgnemF6YScpO1xuICAgICAgICAgICAgICAgIHRoaXMubWFpbkZvcm0gPSB0aGlzLnphemE7XG4gICAgICAgIH1cblxuICAgICAgICBydW4oKSB7XG4gICAgICAgICAgICAgICAgLy90aGlzLnphemEuY29tcG9uZW50UmVnaXN0cnkuYnVpbGRDb21wb25lbnRUcmVlKHRoaXMuemF6YSk7XG4gICAgICAgICAgICAgICAgLy90aGlzLnphemEuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snKTtcblxuICAgICAgICAgICAgICAgIC8vIGF1IGxhbmNlbWVudFxuICAgICAgICAgICAgICAgIHRoaXMucnVuV2hlbkRvbVJlYWR5KCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuemF6YS5zaG93KCk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbn0gLy8gY2xhc3MgTXlBcHBsaWNhdGlvblxuXG5jb25zdCBteUFwcGxpY2F0aW9uOiBNeUFwcGxpY2F0aW9uID0gbmV3IE15QXBwbGljYXRpb24oKTtcbm15QXBwbGljYXRpb24ucnVuKCk7XG4iXSwKICAibWFwcGluZ3MiOiAiOzs7OztBQU1PLFNBQVMsaUJBQWlCLE9BQThCO0FBQ3ZELFFBQU0sU0FBUyxJQUFJLFlBQVksQ0FBQztBQUd4Qzs7O0FDUU8sSUFBZUEsa0JBQWYsTUFBaUU7QUFBQTtBQUFBLEVBUWhFLFFBQXVCO0FBQ2YsV0FBTyxDQUFDO0FBQUEsRUFDaEI7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQWtCUjtBQUtPLElBQU1DLHlCQUFOLE1BQTRCO0FBQUEsRUFBNUI7QUFFQztBQUFBLHdCQUFpQixXQUFVLG9CQUFJLElBQWlDO0FBQUE7QUFBQSxFQUVoRSxTQUErQixNQUF5QjtBQUNoRCxRQUFJLEtBQUssUUFBUSxJQUFJLEtBQUssUUFBUSxHQUFHO0FBQzdCLFlBQU0sSUFBSSxNQUFNLHNDQUFzQyxLQUFLLFFBQVEsRUFBRTtBQUFBLElBQzdFO0FBQ0EsU0FBSyxRQUFRLElBQUksS0FBSyxVQUFVLElBQUk7QUFBQSxFQUM1QztBQUFBO0FBQUEsRUFHQSxJQUFJLFVBQW1EO0FBQy9DLFdBQU8sS0FBSyxRQUFRLElBQUksUUFBUTtBQUFBLEVBQ3hDO0FBQUEsRUFFQSxJQUFJLFVBQTJCO0FBQ3ZCLFdBQU8sS0FBSyxRQUFRLElBQUksUUFBUTtBQUFBLEVBQ3hDO0FBQUEsRUFFQSxPQUFpQjtBQUNULFdBQU8sQ0FBQyxHQUFHLEtBQUssUUFBUSxLQUFLLENBQUMsRUFBRSxLQUFLO0FBQUEsRUFDN0M7QUFDUjtBQXlCTyxJQUFNLFNBQU4sTUFBTSxRQUFPO0FBQUEsRUFHWixZQUFZLEdBQVc7QUFGdkI7QUFHUSxTQUFLLElB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RUFFQSxNQUFNO0FBQ0UsU0FBSyxnQkFBZ0IsTUFBTTtBQUNuQixVQUFJLEtBQUssU0FBVSxNQUFLLFNBQVMsS0FBSztBQUFBLFVBQ2pDLE1BQUssVUFBVTtBQUFBLElBQzVCLENBQUM7QUFBQSxFQUNUO0FBQUEsRUFFVSxZQUFZO0FBQUEsRUFFdEI7QUFBQSxFQUVBLGdCQUFnQixJQUFnQjtBQUN4QixRQUFJLFNBQVMsZUFBZSxXQUFXO0FBQy9CLGFBQU8saUJBQWlCLG9CQUFvQixJQUFJLEVBQUUsTUFBTSxLQUFLLENBQUM7QUFBQSxJQUN0RSxPQUFPO0FBQ0MsU0FBRztBQUFBLElBQ1g7QUFBQSxFQUNSO0FBQ1I7QUFuQ1EsY0FESyxlQUNFO0FBRFIsSUFBTSxlQUFOOzs7QUN6ZkEsU0FBUyxvQkFBb0IsS0FBa0M7QUFXdEU7QUFFQSxJQUFNLE9BQU4sY0FBbUJLLE9BQU07QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQVFqQixZQUFZLE1BQWM7QUFDbEIsVUFBTSxJQUFJO0FBQUEsRUFDbEI7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQVlBLGtCQUFrQjtBQUNWLFVBQU0sTUFBTSxLQUFLLGtCQUFrQixJQUFhLFNBQVM7QUFDekQsUUFBSSxDQUFDLEtBQUs7QUFDRixjQUFRLEtBQUssK0JBQStCO0FBQzVDO0FBQUEsSUFDUjtBQUVBLFFBQUssUUFBUSxPQUFPLElBQUksS0FBSyxHQUFHLENBQUM7QUFDakMsUUFBSyxXQUFXLE1BQU07QUFDdEIsWUFBUSxJQUFJLHFCQUFxQjtBQUFBLEVBQ3pDO0FBQUEsRUFFQSxlQUFlO0FBQ1AsVUFBTSxNQUFNLEtBQUssa0JBQWtCLElBQWEsU0FBUztBQUN6RCxRQUFLLFFBQVEsT0FBTyxJQUFJLEdBQUcsS0FBSyxDQUFDO0FBQ2pDLFlBQVEsSUFBSSxrQkFBa0I7QUFDOUIsUUFBSyxVQUFVO0FBQUEsRUFDdkI7QUFBQTtBQUdSO0FBRUEsSUFBTSxnQkFBTixjQUE0QixhQUFhO0FBQUEsRUFHakMsY0FBYztBQUNOLFVBQU07QUFIZDtBQUlRLFNBQUssT0FBTyxJQUFJLEtBQUssTUFBTTtBQUMzQixTQUFLLFdBQVcsS0FBSztBQUFBLEVBQzdCO0FBQUEsRUFFQSxNQUFNO0FBS0UsU0FBSyxnQkFBZ0IsTUFBTTtBQUNuQixXQUFLLEtBQUssS0FBSztBQUFBLElBQ3ZCLENBQUM7QUFBQSxFQUNUO0FBQ1I7QUFFQSxJQUFNLGdCQUErQixJQUFJLGNBQWM7QUFDdkQsY0FBYyxJQUFJOyIsCiAgIm5hbWVzIjogWyJUTWV0YUNvbXBvbmVudCIsICJDb21wb25lbnRUeXBlUmVnaXN0cnkiLCAiVENvbXBvbmVudCIsICJuYW1lIiwgIlRGb3JtIiwgIlRCdXR0b24iLCAiVEZvcm0iXQp9Cg==
