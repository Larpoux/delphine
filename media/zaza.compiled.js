var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);

// src/vcl/registerVcl.ts
function registerVclTypes(reg) {
  reg.registerType("TForm", (name, form, parent) => {
    const f = new TForm(name);
    return f;
  });
  reg.registerType("TButton", (name, form, parent) => new TButton(name, form, parent));
  reg.registerType("my-button", (name, form, parent) => new TButton(name, form, parent));
}

// src/vcl/StdCtrls.ts
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
    __publicField(this, "byName", /* @__PURE__ */ new Map());
  }
  register(name, c) {
    this.byName.set(name, c);
  }
  get(name) {
    return this.byName.get(name);
  }
  clear() {
    this.byName.clear();
  }
  resolveRoot() {
    if (document.body?.dataset?.component) return document.body;
    const legacy = document.getElementById("delphine-root");
    if (legacy) return legacy;
    return document.body ?? document.documentElement;
  }
  buildComponentTree(form) {
    this.clear();
    this.register(form.name, form);
    const root = form.elem;
    root.querySelectorAll("[data-component]").forEach((el) => {
      if (el === root) return;
      const name = el.getAttribute("data-name");
      const type = el.getAttribute("data-component");
      const titi = el.getAttribute("data-onclick");
      console.log(`titi = ${titi}`);
      const factory = TApplication.TheApplication.types.get(type);
      let comp = null;
      if (factory) comp = factory(name, form, form);
      if (comp) {
        comp.elem = el;
        this.register(name, comp);
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
      this.componentRegistry.buildComponentTree(this);
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
var TForm = _TForm;
var TButton = class extends TComponent2 {
  constructor(name, form, parent) {
    super(name, form, parent);
  }
};
var ComponentTypeRegistry2 = class {
  constructor() {
    __publicField(this, "factories", /* @__PURE__ */ new Map());
  }
  get(name) {
    return this.factories.get(name);
  }
  registerType(typeName, factory) {
    this.factories.set(typeName, factory);
  }
  create(name, form, parent) {
    const f = this.factories.get(name);
    return f ? f(name, form, parent) : null;
  }
};
var _TApplication = class _TApplication {
  constructor() {
    __publicField(this, "forms", []);
    __publicField(this, "types", new ComponentTypeRegistry2());
    __publicField(this, "mainForm", null);
    _TApplication.TheApplication = this;
    registerVclTypes(this.types);
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

// src/drt/UIPlugin.ts
var PluginHost = class extends TComponent2 {
  constructor(name, form, parent) {
    super(name, form, parent);
    __publicField(this, "instance", null);
  }
  mountPlugin(factory, props, services) {
    const container = this.htmlElement;
    if (!container) return;
  }
  update(props) {
    this.instance?.update?.(props);
  }
  unmount() {
    this.instance?.unmount?.();
    this.instance = null;
  }
};

// examples/zaza/zaza.ts
function registerPluginTypes(reg) {
  reg.registerType("chartjs-pie", (name, form, parent) => {
    return new PluginHost(name, form, parent);
  });
  reg.registerType("vue-hello", (name, form, parent) => {
    return new PluginHost(name, form, parent);
  });
}
var Zaza = class extends TForm {
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
    this.componentRegistry.get("button1").color = TColor.rgb(255, 0, 0);
    console.log("Button1 clicked!!!!");
  }
  zaza_onclick() {
    this.componentRegistry.get("button1").color = TColor.rgb(0, 255, 0);
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vc3JjL3ZjbC9yZWdpc3RlclZjbC50cyIsICIuLi9zcmMvdmNsL1N0ZEN0cmxzLnRzIiwgIi4uL3NyYy9kcnQvVUlQbHVnaW4udHMiLCAiLi4vZXhhbXBsZXMvemF6YS96YXphLnRzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyIvLyBFbmdsaXNoIGNvbW1lbnRzIGFzIHJlcXVlc3RlZC5cblxuLy9pbXBvcnQgeyBDb21wb25lbnRUeXBlUmVnaXN0cnkgfSBmcm9tICdAZHJ0JztcbmltcG9ydCB7IFRCdXR0b24sIFRGb3JtLCBUQ29tcG9uZW50LCBDb21wb25lbnRUeXBlUmVnaXN0cnkgfSBmcm9tICdAdmNsJztcblxuZXhwb3J0IGZ1bmN0aW9uIHJlZ2lzdGVyVmNsVHlwZXMocmVnOiBDb21wb25lbnRUeXBlUmVnaXN0cnkpOiB2b2lkIHtcbiAgICAgICAgLy8gTm90ZTogXCJURm9ybVwiIGlzIHR5cGljYWxseSBpbnN0YW50aWF0ZWQgYnkgdGhlIEFwcCwgbm90IGJ5IERPTSBzY2FubmluZy5cbiAgICAgICAgLy8gQnV0IHJlZ2lzdGVyaW5nIGl0IGNhbiBzdGlsbCBiZSB1c2VmdWwgZm9yIGNvbnNpc3RlbmN5L3Rlc3RpbmcuXG5cbiAgICAgICAgcmVnLnJlZ2lzdGVyVHlwZSgnVEZvcm0nLCAobmFtZTogc3RyaW5nLCBmb3JtOiBURm9ybSwgcGFyZW50OiBUQ29tcG9uZW50KSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3QgZiA9IG5ldyBURm9ybShuYW1lKTsgLy8gYWRqdXN0IGN0b3IgdG8geW91ciByZWFsIHNpZ25hdHVyZVxuICAgICAgICAgICAgICAgIHJldHVybiBmO1xuICAgICAgICB9KTtcblxuICAgICAgICByZWcucmVnaXN0ZXJUeXBlKCdUQnV0dG9uJywgKG5hbWU6IHN0cmluZywgZm9ybTogVEZvcm0sIHBhcmVudDogVENvbXBvbmVudCkgPT4gbmV3IFRCdXR0b24obmFtZSwgZm9ybSwgcGFyZW50KSk7XG4gICAgICAgIC8vcmVnLnJlZ2lzdGVyVHlwZSgnVExhYmVsJywgKG5hbWUsIGZvcm0sIG93bmVyKSA9PiBuZXcgVExhYmVsKG5hbWUsIGZvcm0sIG93bmVyKSk7XG4gICAgICAgIC8vcmVnLnJlZ2lzdGVyVHlwZSgnVEVkaXQnLCAobmFtZSwgZm9ybSwgb3duZXIpID0+IG5ldyBURWRpdChuYW1lLCBmb3JtLCBvd25lcikpO1xuXG4gICAgICAgIC8vIFlvdXIgZXhpc3RpbmcgYWxpYXM6XG4gICAgICAgIHJlZy5yZWdpc3RlclR5cGUoJ215LWJ1dHRvbicsIChuYW1lOiBzdHJpbmcsIGZvcm06IFRGb3JtLCBwYXJlbnQ6IFRDb21wb25lbnQpID0+IG5ldyBUQnV0dG9uKG5hbWUsIGZvcm0sIHBhcmVudCkpO1xufVxuIiwgIi8vaW1wb3J0IHsgQ29tcG9uZW50VHlwZVJlZ2lzdHJ5IH0gZnJvbSAnLi4vZHJ0L1VJUGx1Z2luJzsgLy8gUEFTIFwiaW1wb3J0IHR5cGVcIlxuLy8gLy9pbXBvcnQgdHlwZSB7IEpzb24sIERlbHBoaW5lU2VydmljZXMsIENvbXBvbmVudFR5cGVSZWdpc3RyeSB9IGZyb20gJy4uL2RydC9VSVBsdWdpbic7XG5pbXBvcnQgeyByZWdpc3RlclZjbFR5cGVzIH0gZnJvbSAnLi9yZWdpc3RlclZjbCc7XG5cbmV4cG9ydCB0eXBlIENvbXBvbmVudEZhY3RvcnkgPSAobmFtZTogc3RyaW5nLCBmb3JtOiBURm9ybSwgb3duZXI6IFRDb21wb25lbnQpID0+IFRDb21wb25lbnQ7XG5cbi8qXG5leHBvcnQgY2xhc3MgQ29tcG9uZW50UmVnaXN0cnkge1xuICAgICAgICBwcml2YXRlIGZhY3RvcmllcyA9IG5ldyBNYXA8c3RyaW5nLCBDb21wb25lbnRGYWN0b3J5PigpO1xuXG4gICAgICAgIHJlZ2lzdGVyVHlwZSh0eXBlTmFtZTogc3RyaW5nLCBmYWN0b3J5OiBDb21wb25lbnRGYWN0b3J5KTogdm9pZCB7XG4gICAgICAgICAgICAgICAgdGhpcy5mYWN0b3JpZXMuc2V0KHR5cGVOYW1lLCBmYWN0b3J5KTtcbiAgICAgICAgfVxuXG4gICAgICAgIGhhcyh0eXBlTmFtZTogc3RyaW5nKTogYm9vbGVhbiB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuZmFjdG9yaWVzLmhhcyh0eXBlTmFtZSk7XG4gICAgICAgIH1cblxuICAgICAgICBjcmVhdGUodHlwZU5hbWU6IHN0cmluZywgbmFtZTogc3RyaW5nLCBmb3JtOiBURm9ybSwgb3duZXI6IFRDb21wb25lbnQpOiBUQ29tcG9uZW50IHwgbnVsbCB7XG4gICAgICAgICAgICAgICAgY29uc3QgZiA9IHRoaXMuZmFjdG9yaWVzLmdldCh0eXBlTmFtZSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGYgPyBmKG5hbWUsIGZvcm0sIG93bmVyKSA6IG51bGw7XG4gICAgICAgIH1cbn1cbiAgICAgICAgKi9cblxuZXhwb3J0IGNsYXNzIFRDb2xvciB7XG4gICAgICAgIHM6IHN0cmluZztcblxuICAgICAgICBjb25zdHJ1Y3RvcihzOiBzdHJpbmcpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnMgPSBzO1xuICAgICAgICB9XG4gICAgICAgIC8qIGZhY3RvcnkgKi8gc3RhdGljIHJnYihyOiBudW1iZXIsIGc6IG51bWJlciwgYjogbnVtYmVyKTogVENvbG9yIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gbmV3IFRDb2xvcihgcmdiKCR7cn0sICR7Z30sICR7Yn0pYCk7XG4gICAgICAgIH1cbiAgICAgICAgLyogZmFjdG9yeSAqLyBzdGF0aWMgcmdiYShyOiBudW1iZXIsIGc6IG51bWJlciwgYjogbnVtYmVyLCBhOiBudW1iZXIpOiBUQ29sb3Ige1xuICAgICAgICAgICAgICAgIHJldHVybiBuZXcgVENvbG9yKGByZ2JhKCR7cn0sICR7Z30sICR7Yn0sICR7YX0pYCk7XG4gICAgICAgIH1cbn1cblxuZXhwb3J0IGNsYXNzIENvbXBvbmVudFJlZ2lzdHJ5IHtcbiAgICAgICAgcHJpdmF0ZSBieU5hbWUgPSBuZXcgTWFwPHN0cmluZywgVENvbXBvbmVudD4oKTtcblxuICAgICAgICByZWdpc3RlcihuYW1lOiBzdHJpbmcsIGM6IFRDb21wb25lbnQpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmJ5TmFtZS5zZXQobmFtZSwgYyk7XG4gICAgICAgIH1cblxuICAgICAgICBnZXQ8VCBleHRlbmRzIFRDb21wb25lbnQgPSBUQ29tcG9uZW50PihuYW1lOiBzdHJpbmcpOiBUIHwgdW5kZWZpbmVkIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5ieU5hbWUuZ2V0KG5hbWUpIGFzIFQgfCB1bmRlZmluZWQ7XG4gICAgICAgIH1cblxuICAgICAgICBjbGVhcigpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmJ5TmFtZS5jbGVhcigpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmVzb2x2ZVJvb3QoKTogSFRNTEVsZW1lbnQge1xuICAgICAgICAgICAgICAgIC8vIFByZWZlciBib2R5IGFzIHRoZSBjYW5vbmljYWwgcm9vdC5cbiAgICAgICAgICAgICAgICBpZiAoZG9jdW1lbnQuYm9keT8uZGF0YXNldD8uY29tcG9uZW50KSByZXR1cm4gZG9jdW1lbnQuYm9keTtcblxuICAgICAgICAgICAgICAgIC8vIEJhY2t3YXJkIGNvbXBhdGliaWxpdHk6IG9sZCB3cmFwcGVyIGRpdi5cbiAgICAgICAgICAgICAgICBjb25zdCBsZWdhY3kgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnZGVscGhpbmUtcm9vdCcpO1xuICAgICAgICAgICAgICAgIGlmIChsZWdhY3kpIHJldHVybiBsZWdhY3k7XG5cbiAgICAgICAgICAgICAgICAvLyBMYXN0IHJlc29ydC5cbiAgICAgICAgICAgICAgICByZXR1cm4gZG9jdW1lbnQuYm9keSA/PyBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQ7XG4gICAgICAgIH1cblxuICAgICAgICBidWlsZENvbXBvbmVudFRyZWUoZm9ybTogVEZvcm0pIHtcbiAgICAgICAgICAgICAgICB0aGlzLmNsZWFyKCk7XG4gICAgICAgICAgICAgICAgLy8gcmVzb2x2ZVJvb3QgZXN0IG1haW50ZW5hbnQgYXBwZWxcdTAwRTkgcGFyIFRGb3JtOjpzaG93KCkuIEludXRpbGUgZGUgbGUgZmFpcmUgaWNpXG4gICAgICAgICAgICAgICAgLy9jb25zdCByb290ID0gVERvY3VtZW50LmJvZHk7XG4gICAgICAgICAgICAgICAgLy9jb25zdCByb290ID0gKGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdkZWxwaGluZS1yb290JykgPz8gZG9jdW1lbnQuYm9keSkgYXMgSFRNTEVsZW1lbnQ7XG4gICAgICAgICAgICAgICAgLy9jb25zdCByb290ID0gKGRvY3VtZW50LmJvZHk/Lm1hdGNoZXMoJ1tkYXRhLWNvbXBvbmVudF0nKSA/IGRvY3VtZW50LmJvZHkgOiBudWxsKSA/PyAoZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2RlbHBoaW5lLXJvb3QnKSBhcyBIVE1MRWxlbWVudCB8IG51bGwpID8/IGRvY3VtZW50LmJvZHk7XG4gICAgICAgICAgICAgICAgLy9jb25zdCByb290ID0gdGhpcy5yZXNvbHZlUm9vdCgpO1xuXG4gICAgICAgICAgICAgICAgLy8gLS0tIEZPUk0gLS0tXG4gICAgICAgICAgICAgICAgLy8gcHJvdmlzb2lyZW1lbnQgaWYgKHJvb3QuZ2V0QXR0cmlidXRlKCdkYXRhLWNvbXBvbmVudCcpID09PSAnVEZvcm0nKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5yZWdpc3Rlcihmb3JtLm5hbWUsIGZvcm0pO1xuICAgICAgICAgICAgICAgIC8vfVxuICAgICAgICAgICAgICAgIGNvbnN0IHJvb3QgPSBmb3JtLmVsZW0hO1xuXG4gICAgICAgICAgICAgICAgLy8gLS0tIENISUxEIENPTVBPTkVOVFMgLS0tXG4gICAgICAgICAgICAgICAgcm9vdC5xdWVyeVNlbGVjdG9yQWxsKCdbZGF0YS1jb21wb25lbnRdJykuZm9yRWFjaCgoZWwpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChlbCA9PT0gcm9vdCkgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgbmFtZSA9IGVsLmdldEF0dHJpYnV0ZSgnZGF0YS1uYW1lJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCB0eXBlID0gZWwuZ2V0QXR0cmlidXRlKCdkYXRhLWNvbXBvbmVudCcpO1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgdGl0aSA9IGVsLmdldEF0dHJpYnV0ZSgnZGF0YS1vbmNsaWNrJyk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGB0aXRpID0gJHt0aXRpfWApO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAvL2xldCBjb21wOiBUQ29tcG9uZW50IHwgbnVsbCA9IG51bGw7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIFRoZSBmb2xsb3dpbmcgc3dpdGNoIGlzIGp1c3QgZm9yIG5vdy4gSW4gdGhlIGZ1dHVyZSBpdCB3aWxsIG5vdCBiZSBuZWNlc3NhcnlcbiAgICAgICAgICAgICAgICAgICAgICAgIC8qXG4gICAgICAgICAgICAgICAgICAgICAgICBzd2l0Y2ggKHR5cGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSAnbXktYnV0dG9uJzpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb21wID0gbmV3IFRCdXR0b24obmFtZSEsIGZvcm0sIGZvcm0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgJ2RlbHBoaW5lLXBsdWdpbic6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy9jb21wID0gbmV3IFBsdWdpbkhvc3QobmFtZSwgZm9ybSwgZm9ybSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgIH0qL1xuICAgICAgICAgICAgICAgICAgICAgICAgLy9jb25zdCBhcHBsaWNhdGlvbjogVEFwcGxpY2F0aW9uID0gbmV3IFRBcHBsaWNhdGlvbigpO1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgZmFjdG9yeSA9IFRBcHBsaWNhdGlvbi5UaGVBcHBsaWNhdGlvbi50eXBlcy5nZXQodHlwZSEpO1xuICAgICAgICAgICAgICAgICAgICAgICAgbGV0IGNvbXA6IFRDb21wb25lbnQgfCBudWxsID0gbnVsbDtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChmYWN0b3J5KSBjb21wID0gZmFjdG9yeShuYW1lISwgZm9ybSwgZm9ybSk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChjb21wKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbXAuZWxlbSA9IGVsO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnJlZ2lzdGVyKG5hbWUhLCBjb21wKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICBmb3JtLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJyk7XG4gICAgICAgIH1cbn1cblxuZXhwb3J0IGNsYXNzIFRDb21wb25lbnQge1xuICAgICAgICBwYXJlbnQ6IFRDb21wb25lbnQgfCBudWxsID0gbnVsbDtcbiAgICAgICAgZm9ybTogVEZvcm0gfCBudWxsID0gbnVsbDtcbiAgICAgICAgY2hpbGRyZW46IFRDb21wb25lbnRbXSA9IFtdO1xuXG4gICAgICAgIGVsZW06IEVsZW1lbnQgfCBudWxsID0gbnVsbDtcbiAgICAgICAgZ2V0IGh0bWxFbGVtZW50KCk6IEhUTUxFbGVtZW50IHwgbnVsbCB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuZWxlbSBhcyBIVE1MRWxlbWVudCB8IG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgbmFtZTogc3RyaW5nO1xuICAgICAgICBjb25zdHJ1Y3RvcihuYW1lOiBzdHJpbmcsIGZvcm06IFRGb3JtIHwgbnVsbCwgcGFyZW50OiBUQ29tcG9uZW50IHwgbnVsbCkge1xuICAgICAgICAgICAgICAgIHRoaXMubmFtZSA9IG5hbWU7XG4gICAgICAgICAgICAgICAgdGhpcy5wYXJlbnQgPSBwYXJlbnQ7XG4gICAgICAgICAgICAgICAgcGFyZW50Py5jaGlsZHJlbi5wdXNoKHRoaXMpO1xuICAgICAgICAgICAgICAgIHRoaXMuZm9ybSA9IGZvcm07XG4gICAgICAgICAgICAgICAgdGhpcy5uYW1lID0gbmFtZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGdldCBjb2xvcigpOiBUQ29sb3Ige1xuICAgICAgICAgICAgICAgIHJldHVybiBuZXcgVENvbG9yKHRoaXMuZ2V0U3R5bGVQcm9wKCdjb2xvcicpKTtcbiAgICAgICAgfVxuICAgICAgICBzZXQgY29sb3IodjogVENvbG9yKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5zZXRTdHlsZVByb3AoJ2NvbG9yJywgdi5zKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGdldCBiYWNrZ3JvdW5kQ29sb3IoKTogVENvbG9yIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gbmV3IFRDb2xvcih0aGlzLmdldFN0eWxlUHJvcCgnYmFja2dyb3VuZC1jb2xvcicpKTtcbiAgICAgICAgfVxuICAgICAgICBzZXQgYmFja2dyb3VuZENvbG9yKHY6IFRDb2xvcikge1xuICAgICAgICAgICAgICAgIHRoaXMuc2V0U3R5bGVQcm9wKCdiYWNrZ3JvdW5kLWNvbG9yJywgdi5zKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGdldCB3aWR0aCgpOiBudW1iZXIge1xuICAgICAgICAgICAgICAgIHJldHVybiBwYXJzZUludCh0aGlzLmdldFN0eWxlUHJvcCgnd2lkdGgnKSk7XG4gICAgICAgIH1cbiAgICAgICAgc2V0IHdpZHRoKHY6IG51bWJlcikge1xuICAgICAgICAgICAgICAgIHRoaXMuc2V0U3R5bGVQcm9wKCd3aWR0aCcsIHYudG9TdHJpbmcoKSk7XG4gICAgICAgIH1cblxuICAgICAgICBnZXQgaGVpZ2h0KCk6IG51bWJlciB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHBhcnNlSW50KHRoaXMuZ2V0U3R5bGVQcm9wKCdoZWlnaHQnKSk7XG4gICAgICAgIH1cbiAgICAgICAgc2V0IGhlaWdodCh2OiBudW1iZXIpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnNldFN0eWxlUHJvcCgnaGVpZ2h0Jywgdi50b1N0cmluZygpKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGdldCBvZmZzZXRXaWR0aCgpOiBudW1iZXIge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmh0bWxFbGVtZW50IS5vZmZzZXRXaWR0aDtcbiAgICAgICAgfVxuICAgICAgICBnZXQgb2Zmc2V0SGVpZ2h0KCk6IG51bWJlciB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuaHRtbEVsZW1lbnQhLm9mZnNldEhlaWdodDtcbiAgICAgICAgfVxuXG4gICAgICAgIHNldFN0eWxlUHJvcChuYW1lOiBzdHJpbmcsIHZhbHVlOiBzdHJpbmcpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmh0bWxFbGVtZW50IS5zdHlsZS5zZXRQcm9wZXJ0eShuYW1lLCB2YWx1ZSk7XG4gICAgICAgIH1cblxuICAgICAgICBnZXRTdHlsZVByb3AobmFtZTogc3RyaW5nKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuaHRtbEVsZW1lbnQhLnN0eWxlLmdldFByb3BlcnR5VmFsdWUobmFtZSk7XG4gICAgICAgIH1cblxuICAgICAgICBzZXRQcm9wKG5hbWU6IHN0cmluZywgdmFsdWU6IHN0cmluZykge1xuICAgICAgICAgICAgICAgIHRoaXMuaHRtbEVsZW1lbnQhLnNldEF0dHJpYnV0ZShuYW1lLCB2YWx1ZSk7XG4gICAgICAgIH1cblxuICAgICAgICBnZXRQcm9wKG5hbWU6IHN0cmluZykge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzIS5odG1sRWxlbWVudCEuZ2V0QXR0cmlidXRlKG5hbWUpO1xuICAgICAgICB9XG59XG5cbmV4cG9ydCBjbGFzcyBURG9jdW1lbnQge1xuICAgICAgICBzdGF0aWMgZG9jdW1lbnQ6IFREb2N1bWVudCA9IG5ldyBURG9jdW1lbnQoZG9jdW1lbnQpO1xuICAgICAgICBzdGF0aWMgYm9keSA9IGRvY3VtZW50LmJvZHk7XG5cbiAgICAgICAgaHRtbERvYzogRG9jdW1lbnQ7XG4gICAgICAgIGNvbnN0cnVjdG9yKGh0bWxEb2M6IERvY3VtZW50KSB7XG4gICAgICAgICAgICAgICAgdGhpcy5odG1sRG9jID0gaHRtbERvYztcbiAgICAgICAgfVxufVxuXG5leHBvcnQgY2xhc3MgVEZvcm0gZXh0ZW5kcyBUQ29tcG9uZW50IHtcbiAgICAgICAgc3RhdGljIGZvcm1zID0gbmV3IE1hcDxzdHJpbmcsIFRGb3JtPigpO1xuICAgICAgICBwcml2YXRlIF9tb3VudGVkID0gZmFsc2U7XG4gICAgICAgIGNvbXBvbmVudFJlZ2lzdHJ5OiBDb21wb25lbnRSZWdpc3RyeSA9IG5ldyBDb21wb25lbnRSZWdpc3RyeSgpO1xuICAgICAgICBjb25zdHJ1Y3RvcihuYW1lOiBzdHJpbmcpIHtcbiAgICAgICAgICAgICAgICBzdXBlcihuYW1lLCBudWxsLCBudWxsKTtcbiAgICAgICAgICAgICAgICB0aGlzLmZvcm0gPSB0aGlzO1xuICAgICAgICAgICAgICAgIFRGb3JtLmZvcm1zLnNldChuYW1lLCB0aGlzKTtcbiAgICAgICAgICAgICAgICAvL3RoaXMucGFyZW50ID0gdGhpcztcbiAgICAgICAgfVxuXG4gICAgICAgIC8qICAgICAgICBmaW5kRm9ybUZyb21FdmVudFRhcmdldChjdXJyZW50VGFyZ2V0RWxlbTogRWxlbWVudCk6IFRGb3JtIHwgbnVsbCB7XG4gICAgICAgICAgICAgICAgY29uc3QgZm9ybU5hbWUgPSBjdXJyZW50VGFyZ2V0RWxlbS5nZXRBdHRyaWJ1dGUoJ2RhdGEtbmFtZScpO1xuICAgICAgICAgICAgICAgIGNvbnN0IGZvcm06IFRGb3JtID0gVEZvcm0uZm9ybXMuZ2V0KGZvcm1OYW1lISkhO1xuICAgICAgICAgICAgICAgIHJldHVybiBmb3JtO1xuICAgICAgICB9XG4gICAgICAgICAgICAgICAgKi9cblxuICAgICAgICAvLyBFbmdsaXNoIGNvbW1lbnRzIGFzIHJlcXVlc3RlZC5cblxuICAgICAgICBmaW5kRm9ybUZyb21FdmVudFRhcmdldCh0YXJnZXQ6IEVsZW1lbnQpOiBURm9ybSB8IG51bGwge1xuICAgICAgICAgICAgICAgIC8vIDEpIEZpbmQgdGhlIG5lYXJlc3QgZWxlbWVudCB0aGF0IGxvb2tzIGxpa2UgYSBmb3JtIGNvbnRhaW5lclxuICAgICAgICAgICAgICAgIGNvbnN0IGZvcm1FbGVtID0gdGFyZ2V0LmNsb3Nlc3QoJ1tkYXRhLWNvbXBvbmVudD1cIlRGb3JtXCJdW2RhdGEtbmFtZV0nKSBhcyBFbGVtZW50IHwgbnVsbDtcbiAgICAgICAgICAgICAgICBpZiAoIWZvcm1FbGVtKSByZXR1cm4gbnVsbDtcblxuICAgICAgICAgICAgICAgIC8vIDIpIFJlc29sdmUgdGhlIFRGb3JtIGluc3RhbmNlXG4gICAgICAgICAgICAgICAgY29uc3QgZm9ybU5hbWUgPSBmb3JtRWxlbS5nZXRBdHRyaWJ1dGUoJ2RhdGEtbmFtZScpO1xuICAgICAgICAgICAgICAgIGlmICghZm9ybU5hbWUpIHJldHVybiBudWxsO1xuXG4gICAgICAgICAgICAgICAgcmV0dXJuIFRGb3JtLmZvcm1zLmdldChmb3JtTmFtZSkgPz8gbnVsbDtcbiAgICAgICAgfVxuXG4gICAgICAgIHNob3coKSB7XG4gICAgICAgICAgICAgICAgLy8gTXVzdCBiZSBkb25lIGJlZm9yZSBidWlsZENvbXBvbmVudFRyZWUoKSBiZWNhdXNlIGBidWlsZENvbXBvbmVudFRyZWUoKWAgZG9lcyBub3QgZG8gYHJlc29sdmVSb290KClgIGl0c2VsZi5cbiAgICAgICAgICAgICAgICBpZiAoIXRoaXMuZWxlbSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5lbGVtID0gdGhpcy5jb21wb25lbnRSZWdpc3RyeS5yZXNvbHZlUm9vdCgpOyAvLyBvdSB0aGlzLnJlc29sdmVSb290KClcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKCF0aGlzLl9tb3VudGVkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmNvbXBvbmVudFJlZ2lzdHJ5LmJ1aWxkQ29tcG9uZW50VHJlZSh0aGlzKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX21vdW50ZWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8vIFRPRE9cbiAgICAgICAgfVxuXG4gICAgICAgIGFkZEV2ZW50TGlzdGVuZXIodHlwZTogc3RyaW5nKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ2FkZEV2ZW50TGlzdGVuZXIgRU5URVInLCB7IGhhc0JvZHk6ICEhZG9jdW1lbnQuYm9keSwgaGFzRWxlbTogISF0aGlzLmVsZW0gfSk7XG4gICAgICAgICAgICAgICAgY29uc3QgZyA9IHdpbmRvdyBhcyBhbnk7XG5cbiAgICAgICAgICAgICAgICAvLyBBYm9ydCBvbGQgbGlzdGVuZXJzIChpZiBhbnkpXG4gICAgICAgICAgICAgICAgaWYgKGcuX19kZWxwaGluZV9hYm9ydF9jb250cm9sbGVyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBnLl9fZGVscGhpbmVfYWJvcnRfY29udHJvbGxlci5hYm9ydCgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBjb25zdCBhYyA9IG5ldyBBYm9ydENvbnRyb2xsZXIoKTtcbiAgICAgICAgICAgICAgICBnLl9fZGVscGhpbmVfYWJvcnRfY29udHJvbGxlciA9IGFjO1xuICAgICAgICAgICAgICAgIGNvbnN0IHsgc2lnbmFsIH0gPSBhYztcblxuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdJbnN0YWxsaW5nIGdsb2JhbCBkZWJ1ZyBsaXN0ZW5lcnMgKHJlc2V0K3JlaW5zdGFsbCknKTtcblxuICAgICAgICAgICAgICAgIGNvbnN0IHJvb3QgPSB0aGlzLmVsZW07XG4gICAgICAgICAgICAgICAgaWYgKCFyb290KSByZXR1cm47XG5cbiAgICAgICAgICAgICAgICAvLyBWb3RyZSBoYW5kbGVyIHN1ciBsZSByb290XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuZWxlbSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gRW5nbGlzaCBjb21tZW50cyBhcyByZXF1ZXN0ZWQuXG5cbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIEVuZ2xpc2ggY29tbWVudHMgYXMgcmVxdWVzdGVkLlxuXG4gICAgICAgICAgICAgICAgICAgICAgICByb290LmFkZEV2ZW50TGlzdGVuZXIoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIChldjogRXZlbnQpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCB0YXJnZXRFbGVtID0gZXYudGFyZ2V0IGFzIEVsZW1lbnQgfCBudWxsO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICghdGFyZ2V0RWxlbSkgcmV0dXJuO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgZm9ybSA9IHRoaXMuZmluZEZvcm1Gcm9tRXZlbnRUYXJnZXQodGFyZ2V0RWxlbSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFmb3JtKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnTm8gZm9ybSByZXNvbHZlZDsgZXZlbnQgaWdub3JlZCcpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGV2VHlwZSA9IGV2LnR5cGU7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBTdGFydCBmcm9tIHRoZSBjbGlja2VkIGNvbXBvbmVudCAob3IgYW55IGNvbXBvbmVudCB3cmFwcGVyKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxldCB0MTogRWxlbWVudCB8IG51bGwgPSB0YXJnZXRFbGVtLmNsb3Nlc3QoJ1tkYXRhLWNvbXBvbmVudF0nKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB3aGlsZSAodDEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGhhbmRsZXJOYW1lID0gdDEuZ2V0QXR0cmlidXRlKGBkYXRhLW9uJHtldlR5cGV9YCk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIElmIHdlIGZvdW5kIGEgaGFuZGxlciBvbiB0aGlzIGVsZW1lbnQsIGRpc3BhdGNoIGl0XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoaGFuZGxlck5hbWUgJiYgaGFuZGxlck5hbWUgIT09ICcnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IG5hbWUgPSB0MS5nZXRBdHRyaWJ1dGUoJ2RhdGEtbmFtZScpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBzZW5kZXIgPSBuYW1lID8gKGZvcm0uY29tcG9uZW50UmVnaXN0cnkuZ2V0KG5hbWUpID8/IG51bGwpIDogbnVsbDtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBtYXliZU1ldGhvZCA9IChmb3JtIGFzIGFueSlbaGFuZGxlck5hbWVdO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAodHlwZW9mIG1heWJlTWV0aG9kICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ05PVCBBIE1FVEhPRCcsIGhhbmRsZXJOYW1lKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBJZiBzZW5kZXIgaXMgbWlzc2luZywgZmFsbGJhY2sgdG8gdGhlIGZvcm0gaXRzZWxmIChzYWZlKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAobWF5YmVNZXRob2QgYXMgKHRoaXM6IFRGb3JtLCBzZW5kZXI6IGFueSkgPT4gYW55KS5jYWxsKGZvcm0sIHNlbmRlciA/PyBmb3JtKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBObyBoYW5kbGVyIGhlcmU6IHRyeSBnb2luZyBcInVwXCIgdXNpbmcgeW91ciBjb21wb25lbnQgdHJlZSBpZiBwb3NzaWJsZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgbmFtZSA9IHQxLmdldEF0dHJpYnV0ZSgnZGF0YS1uYW1lJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBjb21wID0gbmFtZSA/IGZvcm0uY29tcG9uZW50UmVnaXN0cnkuZ2V0KG5hbWUpIDogbnVsbDtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gUHJlZmVyIHlvdXIgVkNMLWxpa2UgcGFyZW50IGNoYWluIHdoZW4gYXZhaWxhYmxlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBuZXh0ID0gY29tcD8ucGFyZW50Py5lbGVtID8/IG51bGw7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEZhbGxiYWNrOiBzdGFuZGFyZCBET00gcGFyZW50XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0MSA9IG5leHQgPz8gdDEucGFyZW50RWxlbWVudD8uY2xvc2VzdCgnW2RhdGEtY29tcG9uZW50XScpID8/IG51bGw7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ0V2ZW50IG5vdCBoYW5kbGVkJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRydWVcbiAgICAgICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICB9XG59XG5cbmV4cG9ydCBjbGFzcyBUQnV0dG9uIGV4dGVuZHMgVENvbXBvbmVudCB7XG4gICAgICAgIGNvbnN0cnVjdG9yKG5hbWU6IHN0cmluZywgZm9ybTogVEZvcm0sIHBhcmVudDogVENvbXBvbmVudCkge1xuICAgICAgICAgICAgICAgIHN1cGVyKG5hbWUsIGZvcm0sIHBhcmVudCk7XG4gICAgICAgIH1cbn1cblxuLy9leHBvcnQgdHlwZSBDb21wb25lbnRGYWN0b3J5ID0gKG5hbWU6IHN0cmluZywgZm9ybTogVEZvcm0sIHBhcmVudDogVENvbXBvbmVudCkgPT4gVENvbXBvbmVudDtcblxuZXhwb3J0IGNsYXNzIENvbXBvbmVudFR5cGVSZWdpc3RyeSB7XG4gICAgICAgIHByaXZhdGUgZmFjdG9yaWVzID0gbmV3IE1hcDxzdHJpbmcsIENvbXBvbmVudEZhY3Rvcnk+KCk7XG5cbiAgICAgICAgZ2V0KG5hbWU6IHN0cmluZyk6IENvbXBvbmVudEZhY3RvcnkgfCBudWxsIHwgdW5kZWZpbmVkIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5mYWN0b3JpZXMuZ2V0KG5hbWUpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmVnaXN0ZXJUeXBlKHR5cGVOYW1lOiBzdHJpbmcsIGZhY3Rvcnk6IENvbXBvbmVudEZhY3RvcnkpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmZhY3Rvcmllcy5zZXQodHlwZU5hbWUsIGZhY3RvcnkpO1xuICAgICAgICB9XG5cbiAgICAgICAgY3JlYXRlKG5hbWU6IHN0cmluZywgZm9ybTogVEZvcm0sIHBhcmVudDogVENvbXBvbmVudCk6IFRDb21wb25lbnQgfCBudWxsIHtcbiAgICAgICAgICAgICAgICBjb25zdCBmID0gdGhpcy5mYWN0b3JpZXMuZ2V0KG5hbWUpO1xuICAgICAgICAgICAgICAgIHJldHVybiBmID8gZihuYW1lLCBmb3JtLCBwYXJlbnQpIDogbnVsbDtcbiAgICAgICAgfVxufVxuXG5leHBvcnQgY2xhc3MgVEFwcGxpY2F0aW9uIHtcbiAgICAgICAgc3RhdGljIFRoZUFwcGxpY2F0aW9uOiBUQXBwbGljYXRpb247XG4gICAgICAgIHByaXZhdGUgZm9ybXM6IFRGb3JtW10gPSBbXTtcbiAgICAgICAgcmVhZG9ubHkgdHlwZXMgPSBuZXcgQ29tcG9uZW50VHlwZVJlZ2lzdHJ5KCk7XG4gICAgICAgIG1haW5Gb3JtOiBURm9ybSB8IG51bGwgPSBudWxsO1xuXG4gICAgICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICAgICAgICAgIFRBcHBsaWNhdGlvbi5UaGVBcHBsaWNhdGlvbiA9IHRoaXM7XG4gICAgICAgICAgICAgICAgcmVnaXN0ZXJWY2xUeXBlcyh0aGlzLnR5cGVzKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNyZWF0ZUZvcm08VCBleHRlbmRzIFRGb3JtPihjdG9yOiBuZXcgKC4uLmFyZ3M6IGFueVtdKSA9PiBULCBuYW1lOiBzdHJpbmcpOiBUIHtcbiAgICAgICAgICAgICAgICBjb25zdCBmID0gbmV3IGN0b3IobmFtZSk7XG4gICAgICAgICAgICAgICAgdGhpcy5mb3Jtcy5wdXNoKGYpO1xuICAgICAgICAgICAgICAgIGlmICghdGhpcy5tYWluRm9ybSkgdGhpcy5tYWluRm9ybSA9IGY7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGY7XG4gICAgICAgIH1cblxuICAgICAgICBydW4oKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5ydW5XaGVuRG9tUmVhZHkoKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMubWFpbkZvcm0pIHRoaXMubWFpbkZvcm0uc2hvdygpO1xuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSB0aGlzLmF1dG9TdGFydCgpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgcHJvdGVjdGVkIGF1dG9TdGFydCgpIHtcbiAgICAgICAgICAgICAgICAvLyBmYWxsYmFjazogY2hvaXNpciB1bmUgZm9ybSBlbnJlZ2lzdHJcdTAwRTllLCBvdSBjclx1MDBFOWVyIHVuZSBmb3JtIGltcGxpY2l0ZVxuICAgICAgICB9XG5cbiAgICAgICAgcnVuV2hlbkRvbVJlYWR5KGZuOiAoKSA9PiB2b2lkKSB7XG4gICAgICAgICAgICAgICAgaWYgKGRvY3VtZW50LnJlYWR5U3RhdGUgPT09ICdsb2FkaW5nJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ0RPTUNvbnRlbnRMb2FkZWQnLCBmbiwgeyBvbmNlOiB0cnVlIH0pO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBmbigpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgfVxufVxuXG4vKlxuXG5leHBvcnQgY2xhc3MgVnVlQ29tcG9uZW50IGV4dGVuZHMgVENvbXBvbmVudCB7fVxuXG5leHBvcnQgY2xhc3MgUmVhY3RDb21wb25lbnQgZXh0ZW5kcyBUQ29tcG9uZW50IHt9XG5cbmV4cG9ydCBjbGFzcyBTdmVsdGVDb21wb25lbnQgZXh0ZW5kcyBUQ29tcG9uZW50IHt9XG5cbmV4cG9ydCBjbGFzcyBQbHVnaW5Ib3N0PFByb3BzIGV4dGVuZHMgSnNvbiA9IEpzb24+IGV4dGVuZHMgVENvbXBvbmVudCB7XG4gICAgICAgIHByaXZhdGUgcGx1Z2luOiBQbHVnaW48UHJvcHM+O1xuICAgICAgICBwcml2YXRlIHNlcnZpY2VzOiBEZWxwaGluZVNlcnZpY2VzO1xuICAgICAgICBwcml2YXRlIG1vdW50ZWQgPSBmYWxzZTtcblxuICAgICAgICBjb25zdHJ1Y3RvcihwbHVnaW46IFVJUGx1Z2luPFByb3BzPiwgc2VydmljZXM6IERlbHBoaW5lU2VydmljZXMpIHtcbiAgICAgICAgICAgICAgICBzdXBlcigndG90bycsIG51bGwsIG51bGwpO1xuICAgICAgICAgICAgICAgIHRoaXMucGx1Z2luID0gcGx1Z2luO1xuICAgICAgICAgICAgICAgIHRoaXMuc2VydmljZXMgPSBzZXJ2aWNlcztcbiAgICAgICAgfVxuXG4gICAgICAgIG1vdW50KHByb3BzOiBQcm9wcykge1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLm1vdW50ZWQpIHRocm93IG5ldyBFcnJvcignUGx1Z2luIGFscmVhZHkgbW91bnRlZCcpO1xuICAgICAgICAgICAgICAgIC8vdGhpcy5wbHVnaW4ubW91bnQodGhpcy5odG1sRWxlbWVudCwgcHJvcHMsIHRoaXMuc2VydmljZXMpO1xuICAgICAgICAgICAgICAgIHRoaXMubW91bnRlZCA9IHRydWU7XG4gICAgICAgIH1cblxuICAgICAgICB1cGRhdGUocHJvcHM6IFByb3BzKSB7XG4gICAgICAgICAgICAgICAgaWYgKCF0aGlzLm1vdW50ZWQpIHRocm93IG5ldyBFcnJvcignUGx1Z2luIG5vdCBtb3VudGVkJyk7XG4gICAgICAgICAgICAgICAgdGhpcy5wbHVnaW4udXBkYXRlKHByb3BzKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHVubW91bnQoKSB7XG4gICAgICAgICAgICAgICAgaWYgKCF0aGlzLm1vdW50ZWQpIHJldHVybjtcbiAgICAgICAgICAgICAgICB0aGlzLnBsdWdpbi51bm1vdW50KCk7XG4gICAgICAgICAgICAgICAgdGhpcy5tb3VudGVkID0gZmFsc2U7XG4gICAgICAgIH1cbn1cbiAgICAgICAgKi9cbiIsICIvLyBkZWxwaGluZS11aS1wbHVnaW4udHNcbi8vIEEgZnJhbWV3b3JrLWFnbm9zdGljIGNvbnRyYWN0LlxuLy8gRGVscGhpbmUgbmV2ZXIgdGFsa3MgdG8gUmVhY3QvVnVlL1N2ZWx0ZSBkaXJlY3RseSBcdTIwMTQgb25seSB0byB0aGlzIGludGVyZmFjZS5cbmltcG9ydCAnQHZjbCc7XG5pbXBvcnQgeyBUQ29tcG9uZW50LCBURm9ybSwgQ29tcG9uZW50RmFjdG9yeSB9IGZyb20gJ0B2Y2wnO1xuXG5leHBvcnQgdHlwZSBKc29uID0gbnVsbCB8IGJvb2xlYW4gfCBudW1iZXIgfCBzdHJpbmcgfCBKc29uW10gfCB7IFtrZXk6IHN0cmluZ106IEpzb24gfTtcblxuZXhwb3J0IGludGVyZmFjZSBEZWxwaGluZUxvZ2dlciB7XG4gICAgICAgIGRlYnVnKG1zZzogc3RyaW5nLCBkYXRhPzogSnNvbik6IHZvaWQ7XG4gICAgICAgIGluZm8obXNnOiBzdHJpbmcsIGRhdGE/OiBKc29uKTogdm9pZDtcbiAgICAgICAgd2Fybihtc2c6IHN0cmluZywgZGF0YT86IEpzb24pOiB2b2lkO1xuICAgICAgICBlcnJvcihtc2c6IHN0cmluZywgZGF0YT86IEpzb24pOiB2b2lkO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIERlbHBoaW5lRXZlbnRCdXMge1xuICAgICAgICAvLyBTdWJzY3JpYmUgdG8gYW4gYXBwIGV2ZW50LlxuICAgICAgICBvbihldmVudE5hbWU6IHN0cmluZywgaGFuZGxlcjogKHBheWxvYWQ6IEpzb24pID0+IHZvaWQpOiAoKSA9PiB2b2lkO1xuXG4gICAgICAgIC8vIFB1Ymxpc2ggYW4gYXBwIGV2ZW50LlxuICAgICAgICBlbWl0KGV2ZW50TmFtZTogc3RyaW5nLCBwYXlsb2FkOiBKc29uKTogdm9pZDtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBEZWxwaGluZVN0b3JhZ2Uge1xuICAgICAgICBnZXQoa2V5OiBzdHJpbmcpOiBQcm9taXNlPEpzb24gfCB1bmRlZmluZWQ+O1xuICAgICAgICBzZXQoa2V5OiBzdHJpbmcsIHZhbHVlOiBKc29uKTogUHJvbWlzZTx2b2lkPjtcbiAgICAgICAgcmVtb3ZlKGtleTogc3RyaW5nKTogUHJvbWlzZTx2b2lkPjtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBEZWxwaGluZVNlcnZpY2VzIHtcbiAgICAgICAgbG9nOiBEZWxwaGluZUxvZ2dlcjtcbiAgICAgICAgYnVzOiBEZWxwaGluZUV2ZW50QnVzO1xuICAgICAgICBzdG9yYWdlOiBEZWxwaGluZVN0b3JhZ2U7XG5cbiAgICAgICAgLy8gT3B0aW9uYWwgZnV0dXJlIHNlcnZpY2VzXG4gICAgICAgIC8vIGkxOG4/OiB7IHQoa2V5OiBzdHJpbmcsIHZhcnM/OiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmcgfCBudW1iZXI+KTogc3RyaW5nIH07XG4gICAgICAgIC8vIG5hdj86IHsgZ28ocm91dGU6IHN0cmluZyk6IHZvaWQ7IGN1cnJlbnQoKTogc3RyaW5nIH07XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgU2l6ZUhpbnRzIHtcbiAgICAgICAgbWluV2lkdGg/OiBudW1iZXI7XG4gICAgICAgIG1pbkhlaWdodD86IG51bWJlcjtcbiAgICAgICAgcHJlZmVycmVkV2lkdGg/OiBudW1iZXI7XG4gICAgICAgIHByZWZlcnJlZEhlaWdodD86IG51bWJlcjtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBVSVBsdWdpbkluc3RhbmNlPFByb3BzIGV4dGVuZHMgSnNvbiA9IEpzb24+IHtcbiAgICAgICAgcmVhZG9ubHkgaWQ6IHN0cmluZztcblxuICAgICAgICAvLyBDYWxsZWQgZXhhY3RseSBvbmNlIGFmdGVyIGNyZWF0aW9uIChmb3IgYSBnaXZlbiBpbnN0YW5jZSkuXG4gICAgICAgIG1vdW50KGNvbnRhaW5lcjogSFRNTEVsZW1lbnQsIHByb3BzOiBQcm9wcywgc2VydmljZXM6IERlbHBoaW5lU2VydmljZXMpOiB2b2lkO1xuXG4gICAgICAgIC8vIENhbGxlZCBhbnkgdGltZSBwcm9wcyBjaGFuZ2UgKG1heSBiZSBmcmVxdWVudCkuXG4gICAgICAgIHVwZGF0ZShwcm9wczogUHJvcHMpOiB2b2lkO1xuXG4gICAgICAgIC8vIENhbGxlZCBleGFjdGx5IG9uY2UgYmVmb3JlIGRpc3Bvc2FsLlxuICAgICAgICB1bm1vdW50KCk6IHZvaWQ7XG5cbiAgICAgICAgLy8gT3B0aW9uYWwgZXJnb25vbWljcy5cbiAgICAgICAgZ2V0U2l6ZUhpbnRzPygpOiBTaXplSGludHM7XG4gICAgICAgIGZvY3VzPygpOiB2b2lkO1xuXG4gICAgICAgIC8vIE9wdGlvbmFsIHBlcnNpc3RlbmNlIGhvb2sgKERlbHBoaW5lIG1heSBzdG9yZSAmIHJlc3RvcmUgdGhpcykuXG4gICAgICAgIHNlcmlhbGl6ZVN0YXRlPygpOiBKc29uO1xufVxuXG4vLyBFbmdsaXNoIGNvbW1lbnRzIGFzIHJlcXVlc3RlZC5cbmV4cG9ydCBjbGFzcyBQbHVnaW5Ib3N0IGV4dGVuZHMgVENvbXBvbmVudCB7XG4gICAgICAgIHByaXZhdGUgaW5zdGFuY2U6IFVJUGx1Z2luSW5zdGFuY2UgfCBudWxsID0gbnVsbDtcblxuICAgICAgICBjb25zdHJ1Y3RvcihuYW1lOiBzdHJpbmcsIGZvcm06IFRGb3JtLCBwYXJlbnQ6IFRDb21wb25lbnQpIHtcbiAgICAgICAgICAgICAgICBzdXBlcihuYW1lLCBmb3JtLCBwYXJlbnQpO1xuICAgICAgICAgICAgICAgIC8vdGhpcy5mb3JtID0gZm9ybTtcbiAgICAgICAgICAgICAgICAvL3RoaXMucGFyZW50ID0gcGFyZW50O1xuICAgICAgICAgICAgICAgIC8vIHlvdSBsaWtlbHkgYWRkIHRoaXMgdG8gcGFyZW50J3MgY2hpbGRyZW4gZWxzZXdoZXJlXG4gICAgICAgIH1cblxuICAgICAgICBtb3VudFBsdWdpbihmYWN0b3J5OiBDb21wb25lbnRGYWN0b3J5LCBwcm9wczogYW55LCBzZXJ2aWNlczogYW55KSB7XG4gICAgICAgICAgICAgICAgY29uc3QgY29udGFpbmVyID0gdGhpcy5odG1sRWxlbWVudDtcbiAgICAgICAgICAgICAgICBpZiAoIWNvbnRhaW5lcikgcmV0dXJuO1xuXG4gICAgICAgICAgICAgICAgLy90aGlzLmluc3RhbmNlID0gZmFjdG9yeS5tb3VudChjb250YWluZXIsIHByb3BzLCBzZXJ2aWNlcyk7XG4gICAgICAgIH1cblxuICAgICAgICB1cGRhdGUocHJvcHM6IGFueSkge1xuICAgICAgICAgICAgICAgIHRoaXMuaW5zdGFuY2U/LnVwZGF0ZT8uKHByb3BzKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHVubW91bnQoKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5pbnN0YW5jZT8udW5tb3VudD8uKCk7XG4gICAgICAgICAgICAgICAgdGhpcy5pbnN0YW5jZSA9IG51bGw7XG4gICAgICAgIH1cbn1cbiIsICIvLy8gPHJlZmVyZW5jZSBsaWI9XCJkb21cIiAvPlxuLy9pbXBvcnQgeyBpbnN0YWxsRGVscGhpbmVSdW50aW1lIH0gZnJvbSBcIi4vc3JjL2RydFwiOyAvLyA8LS0gVFMsIHBhcyAuanNcbmltcG9ydCB7IFRGb3JtLCBUQ29sb3IsIFRBcHBsaWNhdGlvbiwgVENvbXBvbmVudCwgVEJ1dHRvbiB9IGZyb20gJ0B2Y2wnO1xuaW1wb3J0IHsgQ29tcG9uZW50VHlwZVJlZ2lzdHJ5IH0gZnJvbSAnQHZjbC9TdGRDdHJscyc7XG4vL2ltcG9ydCB7IENvbXBvbmVudFJlZ2lzdHJ5IH0gZnJvbSAnQGRydC9Db21wb25lbnRSZWdpc3RyeSc7XG5pbXBvcnQgeyBQbHVnaW5Ib3N0IH0gZnJvbSAnQGRydC9VSVBsdWdpbic7XG5cbmV4cG9ydCBmdW5jdGlvbiByZWdpc3RlclBsdWdpblR5cGVzKHJlZzogQ29tcG9uZW50VHlwZVJlZ2lzdHJ5KTogdm9pZCB7XG4gICAgICAgIC8vIEV4YW1wbGU6IGFueSB0eXBlIG5hbWUgY2FuIGJlIHByb3ZpZGVkIGJ5IGEgcGx1Z2luLlxuICAgICAgICByZWcucmVnaXN0ZXJUeXBlKCdjaGFydGpzLXBpZScsIChuYW1lOiBzdHJpbmcsIGZvcm06IFRGb3JtLCBwYXJlbnQ6IFRDb21wb25lbnQpID0+IHtcbiAgICAgICAgICAgICAgICByZXR1cm4gbmV3IFBsdWdpbkhvc3QobmFtZSwgZm9ybSwgcGFyZW50KTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgcmVnLnJlZ2lzdGVyVHlwZSgndnVlLWhlbGxvJywgKG5hbWU6IHN0cmluZywgZm9ybTogVEZvcm0sIHBhcmVudDogVENvbXBvbmVudCkgPT4ge1xuICAgICAgICAgICAgICAgIHJldHVybiBuZXcgUGx1Z2luSG9zdChuYW1lLCBmb3JtLCBwYXJlbnQpO1xuICAgICAgICB9KTtcbn1cblxuY2xhc3MgWmF6YSBleHRlbmRzIFRGb3JtIHtcbiAgICAgICAgLy8gRm9ybSBjb21wb25lbnRzIC0gVGhpcyBsaXN0IGlzIGF1dG8gZ2VuZXJhdGVkIGJ5IERlbHBoaW5lXG4gICAgICAgIC8vIC0tLS0tLS0tLS0tLS0tLVxuICAgICAgICAvL2J1dHRvbjEgOiBUQnV0dG9uID0gbmV3IFRCdXR0b24oXCJidXR0b24xXCIsIHRoaXMsIHRoaXMpO1xuICAgICAgICAvL2J1dHRvbjIgOiBUQnV0dG9uID0gbmV3IFRCdXR0b24oXCJidXR0b24yXCIsIHRoaXMsIHRoaXMpO1xuICAgICAgICAvL2J1dHRvbjMgOiBUQnV0dG9uID0gbmV3IFRCdXR0b24oXCJidXR0b24zXCIsIHRoaXMsIHRoaXMpO1xuICAgICAgICAvLyAtLS0tLS0tLS0tLS0tLS1cblxuICAgICAgICBjb25zdHJ1Y3RvcihuYW1lOiBzdHJpbmcpIHtcbiAgICAgICAgICAgICAgICBzdXBlcihuYW1lKTtcbiAgICAgICAgfVxuICAgICAgICAvL2ltcG9ydCB7IGluc3RhbGxEZWxwaGluZVJ1bnRpbWUgfSBmcm9tIFwiLi9kcnRcIjtcblxuICAgICAgICAvKlxuY29uc3QgcnVudGltZSA9IHsgICBcbiAgaGFuZGxlQ2xpY2soeyBlbGVtZW50IH06IHsgZWxlbWVudDogRWxlbWVudCB9KSB7XG4gICAgY29uc29sZS5sb2coXCJjbGlja2VkIVwiLCBlbGVtZW50KTtcbiAgICAvLyhlbGVtZW50IGFzIEhUTUxFbGVtZW50KS5zdHlsZS5iYWNrZ3JvdW5kQ29sb3IgPSBcInJlZFwiO1xuICB9LFxufTsgXG4qL1xuXG4gICAgICAgIGJ1dHRvbjFfb25jbGljaygpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBidG4gPSB0aGlzLmNvbXBvbmVudFJlZ2lzdHJ5LmdldDxUQnV0dG9uPignYnV0dG9uMScpO1xuICAgICAgICAgICAgICAgIGlmICghYnRuKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oJ2J1dHRvbjEgbm90IGZvdW5kIGluIHJlZ2lzdHJ5Jyk7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIC8vYnRuLmNvbG9yID0gVENvbG9yLnJnYigwLCAwLCAyNTUpO1xuICAgICAgICAgICAgICAgIHRoaXMuY29tcG9uZW50UmVnaXN0cnkuZ2V0KCdidXR0b24xJykhLmNvbG9yID0gVENvbG9yLnJnYigyNTUsIDAsIDApO1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdCdXR0b24xIGNsaWNrZWQhISEhJyk7XG4gICAgICAgIH1cblxuICAgICAgICB6YXphX29uY2xpY2soKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5jb21wb25lbnRSZWdpc3RyeS5nZXQoJ2J1dHRvbjEnKSEuY29sb3IgPSBUQ29sb3IucmdiKDAsIDI1NSwgMCk7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ3phemEgY2xpY2tlZCEhISEnKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vaW5zdGFsbERlbHBoaW5lUnVudGltZShydW50aW1lKTtcbn0gLy8gY2xhc3MgemF6YVxuXG5jbGFzcyBNeUFwcGxpY2F0aW9uIGV4dGVuZHMgVEFwcGxpY2F0aW9uIHtcbiAgICAgICAgemF6YTogWmF6YTtcblxuICAgICAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgICAgICAgICBzdXBlcigpO1xuICAgICAgICAgICAgICAgIHRoaXMuemF6YSA9IG5ldyBaYXphKCd6YXphJyk7XG4gICAgICAgICAgICAgICAgdGhpcy5tYWluRm9ybSA9IHRoaXMuemF6YTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJ1bigpIHtcbiAgICAgICAgICAgICAgICAvL3RoaXMuemF6YS5jb21wb25lbnRSZWdpc3RyeS5idWlsZENvbXBvbmVudFRyZWUodGhpcy56YXphKTtcbiAgICAgICAgICAgICAgICAvL3RoaXMuemF6YS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycpO1xuXG4gICAgICAgICAgICAgICAgLy8gYXUgbGFuY2VtZW50XG4gICAgICAgICAgICAgICAgdGhpcy5ydW5XaGVuRG9tUmVhZHkoKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy56YXphLnNob3coKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgfVxufSAvLyBjbGFzcyBNeUFwcGxpY2F0aW9uXG5cbmNvbnN0IG15QXBwbGljYXRpb246IE15QXBwbGljYXRpb24gPSBuZXcgTXlBcHBsaWNhdGlvbigpO1xubXlBcHBsaWNhdGlvbi5ydW4oKTtcbiJdLAogICJtYXBwaW5ncyI6ICI7Ozs7O0FBS08sU0FBUyxpQkFBaUIsS0FBa0M7QUFJM0QsTUFBSSxhQUFhLFNBQVMsQ0FBQyxNQUFjLE1BQWEsV0FBdUI7QUFDckUsVUFBTSxJQUFJLElBQUksTUFBTSxJQUFJO0FBQ3hCLFdBQU87QUFBQSxFQUNmLENBQUM7QUFFRCxNQUFJLGFBQWEsV0FBVyxDQUFDLE1BQWMsTUFBYSxXQUF1QixJQUFJLFFBQVEsTUFBTSxNQUFNLE1BQU0sQ0FBQztBQUs5RyxNQUFJLGFBQWEsYUFBYSxDQUFDLE1BQWMsTUFBYSxXQUF1QixJQUFJLFFBQVEsTUFBTSxNQUFNLE1BQU0sQ0FBQztBQUN4SDs7O0FDS08sSUFBTSxTQUFOLE1BQU0sUUFBTztBQUFBLEVBR1osWUFBWSxHQUFXO0FBRnZCO0FBR1EsU0FBSyxJQUFJO0FBQUEsRUFDakI7QUFBQTtBQUFBLEVBQ2MsT0FBTyxJQUFJLEdBQVcsR0FBVyxHQUFtQjtBQUMxRCxXQUFPLElBQUksUUFBTyxPQUFPLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxHQUFHO0FBQUEsRUFDakQ7QUFBQTtBQUFBLEVBQ2MsT0FBTyxLQUFLLEdBQVcsR0FBVyxHQUFXLEdBQW1CO0FBQ3RFLFdBQU8sSUFBSSxRQUFPLFFBQVEsQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxHQUFHO0FBQUEsRUFDeEQ7QUFDUjtBQUVPLElBQU0sb0JBQU4sTUFBd0I7QUFBQSxFQUF4QjtBQUNDLHdCQUFR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
