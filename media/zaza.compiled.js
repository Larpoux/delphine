var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);

// src/vcl/registerVcl.ts
function registerBuiltins(types) {
  types.register(TButtonClass);
}

// src/vcl/StdCtrls.ts
var ComponentTypeRegistry2 = class {
  constructor() {
    __publicField(this, "classes", /* @__PURE__ */ new Map());
  }
  register(cls) {
    if (this.classes.has(cls.typeName)) {
      throw new Error(`Component type already registered: ${cls.typeName}`);
    }
    this.classes.set(cls.typeName, cls);
  }
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
      const child = cls.create(name, form, component, el);
      if (!child) return;
      child.parent = component;
      child.elem = el;
      child.form = form;
      if (cls.parseProps && cls.applyProps) {
        const props = cls.parseProps(el);
        cls.applyProps(child, props);
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
    __publicField(this, "caption", "");
  }
  allowsChildren() {
    return false;
  }
  setCaption(s) {
    this.caption = s;
    if (this.htmlElement) this.htmlElement.textContent = s;
  }
};
var TButtonClass = {
  typeName: "TButton",
  create(name, form, parent, elem) {
    const b = new TButton2(name, form, parent);
    b.elem = elem;
    return b;
  },
  parseProps(elem) {
    const caption = elem.getAttribute("data-caption") ?? "";
    return { caption };
  },
  applyProps(b, props) {
    const o = props;
    if (typeof o.caption === "string") b.setCaption(o.caption);
  },
  designTime: {
    paletteGroup: "Standard",
    displayName: "Button"
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vc3JjL3ZjbC9yZWdpc3RlclZjbC50cyIsICIuLi9zcmMvdmNsL1N0ZEN0cmxzLnRzIiwgIi4uL2V4YW1wbGVzL3phemEvemF6YS50cyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiLy8gRW5nbGlzaCBjb21tZW50cyBhcyByZXF1ZXN0ZWQuXG5cbi8vaW1wb3J0IHsgQ29tcG9uZW50VHlwZVJlZ2lzdHJ5IH0gZnJvbSAnQGRydCc7XG5pbXBvcnQgeyBUQnV0dG9uLCBUQnV0dG9uQ2xhc3MsIFRGb3JtLCBUQ29tcG9uZW50LCBDb21wb25lbnRUeXBlUmVnaXN0cnkgfSBmcm9tICdAdmNsJztcblxuLy8gRW5nbGlzaCBjb21tZW50cyBhcyByZXF1ZXN0ZWQuXG5leHBvcnQgZnVuY3Rpb24gcmVnaXN0ZXJCdWlsdGlucyh0eXBlczogQ29tcG9uZW50VHlwZVJlZ2lzdHJ5KSB7XG4gICAgICAgIHR5cGVzLnJlZ2lzdGVyKFRCdXR0b25DbGFzcyk7XG4gICAgICAgIC8vIHR5cGVzLnJlZ2lzdGVyKFRFZGl0Q2xhc3MpO1xuICAgICAgICAvLyB0eXBlcy5yZWdpc3RlcihUTGFiZWxDbGFzcyk7XG59XG4iLCAiLy9pbXBvcnQgeyBDb21wb25lbnRUeXBlUmVnaXN0cnkgfSBmcm9tICcuLi9kcnQvVUlQbHVnaW4nOyAvLyBQQVMgXCJpbXBvcnQgdHlwZVwiXG4vLyAvL2ltcG9ydCB0eXBlIHsgSnNvbiwgRGVscGhpbmVTZXJ2aWNlcywgQ29tcG9uZW50VHlwZVJlZ2lzdHJ5IH0gZnJvbSAnLi4vZHJ0L1VJUGx1Z2luJztcbi8vaW1wb3J0IHsgcmVnaXN0ZXJWY2xUeXBlcyB9IGZyb20gJy4vcmVnaXN0ZXJWY2wnO1xuaW1wb3J0IHsgcmVnaXN0ZXJCdWlsdGlucyB9IGZyb20gJy4vcmVnaXN0ZXJWY2wnO1xuXG5leHBvcnQgdHlwZSBDb21wb25lbnRGYWN0b3J5ID0gKG5hbWU6IHN0cmluZywgZm9ybTogVEZvcm0sIG93bmVyOiBUQ29tcG9uZW50KSA9PiBUQ29tcG9uZW50O1xuXG4vL2ltcG9ydCB0eXBlIHsgSnNvbiB9IGZyb20gJy4vSnNvbic7XG5leHBvcnQgdHlwZSBKc29uID0gbnVsbCB8IGJvb2xlYW4gfCBudW1iZXIgfCBzdHJpbmcgfCBKc29uW10gfCB7IFtrZXk6IHN0cmluZ106IEpzb24gfTtcblxuLy8gRW5nbGlzaCBjb21tZW50cyBhcyByZXF1ZXN0ZWQuXG5leHBvcnQgaW50ZXJmYWNlIFRDb21wb25lbnRDbGFzczxUIGV4dGVuZHMgVENvbXBvbmVudCA9IFRDb21wb25lbnQ+IHtcbiAgICAgICAgLy8gVGhlIHN5bWJvbGljIG5hbWUgdXNlZCBpbiBIVE1MOiBkYXRhLWNvbXBvbmVudD1cIlRCdXR0b25cIiBvciBcIm15LWJ1dHRvblwiXG4gICAgICAgIHJlYWRvbmx5IHR5cGVOYW1lOiBzdHJpbmc7XG5cbiAgICAgICAgLy8gQ3JlYXRlIHRoZSBydW50aW1lIGluc3RhbmNlIGFuZCBhdHRhY2ggaXQgdG8gdGhlIERPTSBlbGVtZW50LlxuICAgICAgICBjcmVhdGUobmFtZTogc3RyaW5nLCBmb3JtOiBURm9ybSwgcGFyZW50OiBUQ29tcG9uZW50LCBlbGVtZW50OiBIVE1MRWxlbWVudCk6IFQ7XG5cbiAgICAgICAgLy8gT3B0aW9uYWw6IHBhcnNlIEhUTUwgYXR0cmlidXRlcyAtPiBwcm9wcy9zdGF0ZVxuICAgICAgICAvLyBFeGFtcGxlOiBkYXRhLWNhcHRpb249XCJPS1wiIC0+IHsgY2FwdGlvbjogXCJPS1wiIH1cbiAgICAgICAgcGFyc2VQcm9wcz8oZWxlbTogSFRNTEVsZW1lbnQpOiBKc29uO1xuXG4gICAgICAgIC8vIE9wdGlvbmFsOiBhcHBseSBwcm9wcyB0byB0aGUgY29tcG9uZW50IChjYW4gYmUgY2FsbGVkIGFmdGVyIGNyZWF0ZSlcbiAgICAgICAgYXBwbHlQcm9wcz8oYzogVCwgcHJvcHM6IEpzb24pOiB2b2lkO1xuXG4gICAgICAgIC8vIE9wdGlvbmFsOiBEZXNpZ24tdGltZSBtZXRhZGF0YSAocGFsZXR0ZSwgaW5zcGVjdG9yLCBldGMuKVxuICAgICAgICBkZXNpZ25UaW1lPzoge1xuICAgICAgICAgICAgICAgIHBhbGV0dGVHcm91cD86IHN0cmluZztcbiAgICAgICAgICAgICAgICBkaXNwbGF5TmFtZT86IHN0cmluZztcbiAgICAgICAgICAgICAgICBpY29uPzogc3RyaW5nOyAvLyBsYXRlclxuICAgICAgICAgICAgICAgIC8vIHByb3BlcnR5IHNjaGVtYSBjb3VsZCBsaXZlIGhlcmVcbiAgICAgICAgfTtcbn1cblxuLy9pbXBvcnQgdHlwZSB7IFRDb21wb25lbnRDbGFzcyB9IGZyb20gJy4vVENvbXBvbmVudENsYXNzJztcbi8vaW1wb3J0IHR5cGUgeyBUQ29tcG9uZW50IH0gZnJvbSAnQHZjbCc7XG5cbi8vIEVuZ2xpc2ggY29tbWVudHMgYXMgcmVxdWVzdGVkLlxuZXhwb3J0IGNsYXNzIENvbXBvbmVudFR5cGVSZWdpc3RyeSB7XG4gICAgICAgIHByaXZhdGUgcmVhZG9ubHkgY2xhc3NlcyA9IG5ldyBNYXA8c3RyaW5nLCBUQ29tcG9uZW50Q2xhc3M+KCk7XG5cbiAgICAgICAgcmVnaXN0ZXI8VCBleHRlbmRzIFRDb21wb25lbnQ+KGNsczogVENvbXBvbmVudENsYXNzPFQ+KSB7XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuY2xhc3Nlcy5oYXMoY2xzLnR5cGVOYW1lKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBDb21wb25lbnQgdHlwZSBhbHJlYWR5IHJlZ2lzdGVyZWQ6ICR7Y2xzLnR5cGVOYW1lfWApO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB0aGlzLmNsYXNzZXMuc2V0KGNscy50eXBlTmFtZSwgY2xzKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGdldCh0eXBlTmFtZTogc3RyaW5nKTogVENvbXBvbmVudENsYXNzIHwgdW5kZWZpbmVkIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5jbGFzc2VzLmdldCh0eXBlTmFtZSk7XG4gICAgICAgIH1cblxuICAgICAgICBoYXModHlwZU5hbWU6IHN0cmluZyk6IGJvb2xlYW4ge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmNsYXNzZXMuaGFzKHR5cGVOYW1lKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGxpc3QoKTogc3RyaW5nW10ge1xuICAgICAgICAgICAgICAgIHJldHVybiBbLi4udGhpcy5jbGFzc2VzLmtleXMoKV0uc29ydCgpO1xuICAgICAgICB9XG59XG5cbi8qXG5cbi8vZXhwb3J0IHR5cGUgQ29tcG9uZW50RmFjdG9yeSA9IChuYW1lOiBzdHJpbmcsIGZvcm06IFRGb3JtLCBwYXJlbnQ6IFRDb21wb25lbnQpID0+IFRDb21wb25lbnQ7XG5cbmV4cG9ydCBjbGFzcyBDb21wb25lbnRUeXBlUmVnaXN0cnkge1xuICAgICAgICBwcml2YXRlIGZhY3RvcmllcyA9IG5ldyBNYXA8c3RyaW5nLCBDb21wb25lbnRGYWN0b3J5PigpO1xuXG4gICAgICAgIGdldChuYW1lOiBzdHJpbmcpOiBDb21wb25lbnRGYWN0b3J5IHwgbnVsbCB8IHVuZGVmaW5lZCB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuZmFjdG9yaWVzLmdldChuYW1lKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJlZ2lzdGVyVHlwZSh0eXBlTmFtZTogc3RyaW5nLCBmYWN0b3J5OiBDb21wb25lbnRGYWN0b3J5KSB7XG4gICAgICAgICAgICAgICAgdGhpcy5mYWN0b3JpZXMuc2V0KHR5cGVOYW1lLCBmYWN0b3J5KTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNyZWF0ZShuYW1lOiBzdHJpbmcsIGZvcm06IFRGb3JtLCBwYXJlbnQ6IFRDb21wb25lbnQpOiBUQ29tcG9uZW50IHwgbnVsbCB7XG4gICAgICAgICAgICAgICAgY29uc3QgZiA9IHRoaXMuZmFjdG9yaWVzLmdldChuYW1lKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gZiA/IGYobmFtZSwgZm9ybSwgcGFyZW50KSA6IG51bGw7XG4gICAgICAgIH1cbn1cblxuKi9cblxuZXhwb3J0IGNsYXNzIFRDb2xvciB7XG4gICAgICAgIHM6IHN0cmluZztcblxuICAgICAgICBjb25zdHJ1Y3RvcihzOiBzdHJpbmcpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnMgPSBzO1xuICAgICAgICB9XG4gICAgICAgIC8qIGZhY3RvcnkgKi8gc3RhdGljIHJnYihyOiBudW1iZXIsIGc6IG51bWJlciwgYjogbnVtYmVyKTogVENvbG9yIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gbmV3IFRDb2xvcihgcmdiKCR7cn0sICR7Z30sICR7Yn0pYCk7XG4gICAgICAgIH1cbiAgICAgICAgLyogZmFjdG9yeSAqLyBzdGF0aWMgcmdiYShyOiBudW1iZXIsIGc6IG51bWJlciwgYjogbnVtYmVyLCBhOiBudW1iZXIpOiBUQ29sb3Ige1xuICAgICAgICAgICAgICAgIHJldHVybiBuZXcgVENvbG9yKGByZ2JhKCR7cn0sICR7Z30sICR7Yn0sICR7YX0pYCk7XG4gICAgICAgIH1cbn1cblxuZXhwb3J0IGNsYXNzIENvbXBvbmVudFJlZ2lzdHJ5IHtcbiAgICAgICAgcHJpdmF0ZSBpbnN0YW5jZXMgPSBuZXcgTWFwPHN0cmluZywgVENvbXBvbmVudD4oKTtcblxuICAgICAgICBjb25zdHJ1Y3RvcigpIHt9XG5cbiAgICAgICAgcmVnaXN0ZXJJbnN0YW5jZShuYW1lOiBzdHJpbmcsIGM6IFRDb21wb25lbnQpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmluc3RhbmNlcy5zZXQobmFtZSwgYyk7XG4gICAgICAgIH1cbiAgICAgICAgZ2V0PFQgZXh0ZW5kcyBUQ29tcG9uZW50ID0gVENvbXBvbmVudD4obmFtZTogc3RyaW5nKTogVCB8IHVuZGVmaW5lZCB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuaW5zdGFuY2VzLmdldChuYW1lKSBhcyBUIHwgdW5kZWZpbmVkO1xuICAgICAgICB9XG5cbiAgICAgICAgY2xlYXIoKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5pbnN0YW5jZXMuY2xlYXIoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJlc29sdmVSb290KCk6IEhUTUxFbGVtZW50IHtcbiAgICAgICAgICAgICAgICAvLyBQcmVmZXIgYm9keSBhcyB0aGUgY2Fub25pY2FsIHJvb3QuXG4gICAgICAgICAgICAgICAgaWYgKGRvY3VtZW50LmJvZHk/LmRhdGFzZXQ/LmNvbXBvbmVudCkgcmV0dXJuIGRvY3VtZW50LmJvZHk7XG5cbiAgICAgICAgICAgICAgICAvLyBCYWNrd2FyZCBjb21wYXRpYmlsaXR5OiBvbGQgd3JhcHBlciBkaXYuXG4gICAgICAgICAgICAgICAgY29uc3QgbGVnYWN5ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2RlbHBoaW5lLXJvb3QnKTtcbiAgICAgICAgICAgICAgICBpZiAobGVnYWN5KSByZXR1cm4gbGVnYWN5O1xuXG4gICAgICAgICAgICAgICAgLy8gTGFzdCByZXNvcnQuXG4gICAgICAgICAgICAgICAgcmV0dXJuIGRvY3VtZW50LmJvZHkgPz8gZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50O1xuICAgICAgICB9XG5cbiAgICAgICAgYnVpbGRDb21wb25lbnRUcmVlKGZvcm06IFRGb3JtLCBjb21wb25lbnQ6IFRDb21wb25lbnQpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmNsZWFyKCk7XG4gICAgICAgICAgICAgICAgLy8gcmVzb2x2ZVJvb3QgZXN0IG1haW50ZW5hbnQgYXBwZWxcdTAwRTkgcGFyIFRGb3JtOjpzaG93KCkuIEludXRpbGUgZGUgbGUgZmFpcmUgaWNpXG4gICAgICAgICAgICAgICAgLy9jb25zdCByb290ID0gVERvY3VtZW50LmJvZHk7XG4gICAgICAgICAgICAgICAgLy9jb25zdCByb290ID0gKGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdkZWxwaGluZS1yb290JykgPz8gZG9jdW1lbnQuYm9keSkgYXMgSFRNTEVsZW1lbnQ7XG4gICAgICAgICAgICAgICAgLy9jb25zdCByb290ID0gKGRvY3VtZW50LmJvZHk/Lm1hdGNoZXMoJ1tkYXRhLWNvbXBvbmVudF0nKSA/IGRvY3VtZW50LmJvZHkgOiBudWxsKSA/PyAoZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2RlbHBoaW5lLXJvb3QnKSBhcyBIVE1MRWxlbWVudCB8IG51bGwpID8/IGRvY3VtZW50LmJvZHk7XG4gICAgICAgICAgICAgICAgLy9jb25zdCByb290ID0gdGhpcy5yZXNvbHZlUm9vdCgpO1xuXG4gICAgICAgICAgICAgICAgLy8gLS0tIEZPUk0gLS0tXG4gICAgICAgICAgICAgICAgLy8gcHJvdmlzb2lyZW1lbnQgaWYgKHJvb3QuZ2V0QXR0cmlidXRlKCdkYXRhLWNvbXBvbmVudCcpID09PSAnVEZvcm0nKSB7XG5cbiAgICAgICAgICAgICAgICB0aGlzLnJlZ2lzdGVySW5zdGFuY2UoY29tcG9uZW50Lm5hbWUsIGZvcm0pO1xuICAgICAgICAgICAgICAgIC8vfVxuICAgICAgICAgICAgICAgIGNvbnN0IHJvb3QgPSBjb21wb25lbnQuZWxlbSE7XG5cbiAgICAgICAgICAgICAgICAvLyAtLS0gQ0hJTEQgQ09NUE9ORU5UUyAtLS1cbiAgICAgICAgICAgICAgICByb290LnF1ZXJ5U2VsZWN0b3JBbGwoJzpzY29wZSA+IFtkYXRhLWNvbXBvbmVudF0nKS5mb3JFYWNoKChlbCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGVsID09PSByb290KSByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBuYW1lID0gZWwuZ2V0QXR0cmlidXRlKCdkYXRhLW5hbWUnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHR5cGUgPSBlbC5nZXRBdHRyaWJ1dGUoJ2RhdGEtY29tcG9uZW50Jyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAvL2NvbnN0IHRpdGkgPSBlbC5nZXRBdHRyaWJ1dGUoJ2RhdGEtb25jbGljaycpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAvL2NvbnNvbGUubG9nKGB0aXRpID0gJHt0aXRpfWApO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAvL2xldCBjb21wOiBUQ29tcG9uZW50IHwgbnVsbCA9IG51bGw7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIFRoZSBmb2xsb3dpbmcgc3dpdGNoIGlzIGp1c3QgZm9yIG5vdy4gSW4gdGhlIGZ1dHVyZSBpdCB3aWxsIG5vdCBiZSBuZWNlc3NhcnlcbiAgICAgICAgICAgICAgICAgICAgICAgIC8qXG4gICAgICAgICAgICAgICAgICAgICAgICBzd2l0Y2ggKHR5cGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSAnbXktYnV0dG9uJzpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb21wID0gbmV3IFRCdXR0b24obmFtZSEsIGZvcm0sIGZvcm0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgJ2RlbHBoaW5lLXBsdWdpbic6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy9jb21wID0gbmV3IFBsdWdpbkhvc3QobmFtZSwgZm9ybSwgZm9ybSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgIH0qL1xuICAgICAgICAgICAgICAgICAgICAgICAgLy9jb25zdCBhcHBsaWNhdGlvbjogVEFwcGxpY2F0aW9uID0gbmV3IFRBcHBsaWNhdGlvbigpO1xuICAgICAgICAgICAgICAgICAgICAgICAgLy9jb25zdCBmYWN0b3J5ID0gVEFwcGxpY2F0aW9uLlRoZUFwcGxpY2F0aW9uLnR5cGVzLmdldCh0eXBlISk7XG4gICAgICAgICAgICAgICAgICAgICAgICAvKlxuICAgICAgICAgICAgICAgICAgICAgICAgbGV0IGNvbXA6IFRDb21wb25lbnQgfCBudWxsID0gbnVsbDtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChmYWN0b3J5KSBjb21wID0gZmFjdG9yeShuYW1lISwgZm9ybSwgZm9ybSk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChjb21wKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbXAuZWxlbSA9IGVsO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnJlZ2lzdGVyKG5hbWUhLCBjb21wKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKi9cblxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgY2xzID0gVEFwcGxpY2F0aW9uLlRoZUFwcGxpY2F0aW9uLnR5cGVzLmdldCh0eXBlISk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIWNscykgcmV0dXJuO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBjaGlsZCA9IGNscy5jcmVhdGUobmFtZSEsIGZvcm0sIGNvbXBvbmVudCwgZWwgYXMgSFRNTEVsZW1lbnQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gbmFtZTogc3RyaW5nLCBmb3JtOiBURm9ybSwgcGFyZW50OiBUQ29tcG9uZW50LCBlbGVtOiBIVE1MRWxlbWVudFxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFjaGlsZCkgcmV0dXJuO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBjaGlsZC5wYXJlbnQgPSBjb21wb25lbnQ7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGNoaWxkLmVsZW0gPSBlbDtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNoaWxkLmZvcm0gPSBmb3JtO1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gT3B0aW9uYWwgcHJvcHNcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChjbHMucGFyc2VQcm9wcyAmJiBjbHMuYXBwbHlQcm9wcykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBwcm9wcyA9IGNscy5wYXJzZVByb3BzKGVsIGFzIEhUTUxFbGVtZW50KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2xzLmFwcGx5UHJvcHMoY2hpbGQsIHByb3BzKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5yZWdpc3Rlckluc3RhbmNlKG5hbWUhLCBjaGlsZCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb21wb25lbnQuY2hpbGRyZW4ucHVzaChjaGlsZCk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChjaGlsZC5hbGxvd3NDaGlsZHJlbigpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuYnVpbGRDb21wb25lbnRUcmVlKGZvcm0sIGNoaWxkKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICBmb3JtLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJyk7XG4gICAgICAgIH1cbn1cblxuZXhwb3J0IGNsYXNzIFRDb21wb25lbnQge1xuICAgICAgICBwYXJlbnQ6IFRDb21wb25lbnQgfCBudWxsID0gbnVsbDtcbiAgICAgICAgZm9ybTogVEZvcm0gfCBudWxsID0gbnVsbDtcbiAgICAgICAgY2hpbGRyZW46IFRDb21wb25lbnRbXSA9IFtdO1xuXG4gICAgICAgIGVsZW06IEVsZW1lbnQgfCBudWxsID0gbnVsbDtcbiAgICAgICAgZ2V0IGh0bWxFbGVtZW50KCk6IEhUTUxFbGVtZW50IHwgbnVsbCB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuZWxlbSBhcyBIVE1MRWxlbWVudCB8IG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgbmFtZTogc3RyaW5nO1xuICAgICAgICBjb25zdHJ1Y3RvcihuYW1lOiBzdHJpbmcsIGZvcm06IFRGb3JtIHwgbnVsbCwgcGFyZW50OiBUQ29tcG9uZW50IHwgbnVsbCkge1xuICAgICAgICAgICAgICAgIHRoaXMubmFtZSA9IG5hbWU7XG4gICAgICAgICAgICAgICAgdGhpcy5wYXJlbnQgPSBwYXJlbnQ7XG4gICAgICAgICAgICAgICAgcGFyZW50Py5jaGlsZHJlbi5wdXNoKHRoaXMpO1xuICAgICAgICAgICAgICAgIHRoaXMuZm9ybSA9IGZvcm07XG4gICAgICAgICAgICAgICAgdGhpcy5uYW1lID0gbmFtZTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8qKiBNYXkgY29udGFpbiBjaGlsZCBjb21wb25lbnRzICovXG4gICAgICAgIGFsbG93c0NoaWxkcmVuKCk6IGJvb2xlYW4ge1xuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgZ2V0IGNvbG9yKCk6IFRDb2xvciB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBUQ29sb3IodGhpcy5nZXRTdHlsZVByb3AoJ2NvbG9yJykpO1xuICAgICAgICB9XG4gICAgICAgIHNldCBjb2xvcih2OiBUQ29sb3IpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnNldFN0eWxlUHJvcCgnY29sb3InLCB2LnMpO1xuICAgICAgICB9XG5cbiAgICAgICAgZ2V0IGJhY2tncm91bmRDb2xvcigpOiBUQ29sb3Ige1xuICAgICAgICAgICAgICAgIHJldHVybiBuZXcgVENvbG9yKHRoaXMuZ2V0U3R5bGVQcm9wKCdiYWNrZ3JvdW5kLWNvbG9yJykpO1xuICAgICAgICB9XG4gICAgICAgIHNldCBiYWNrZ3JvdW5kQ29sb3IodjogVENvbG9yKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5zZXRTdHlsZVByb3AoJ2JhY2tncm91bmQtY29sb3InLCB2LnMpO1xuICAgICAgICB9XG5cbiAgICAgICAgZ2V0IHdpZHRoKCk6IG51bWJlciB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHBhcnNlSW50KHRoaXMuZ2V0U3R5bGVQcm9wKCd3aWR0aCcpKTtcbiAgICAgICAgfVxuICAgICAgICBzZXQgd2lkdGgodjogbnVtYmVyKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5zZXRTdHlsZVByb3AoJ3dpZHRoJywgdi50b1N0cmluZygpKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGdldCBoZWlnaHQoKTogbnVtYmVyIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcGFyc2VJbnQodGhpcy5nZXRTdHlsZVByb3AoJ2hlaWdodCcpKTtcbiAgICAgICAgfVxuICAgICAgICBzZXQgaGVpZ2h0KHY6IG51bWJlcikge1xuICAgICAgICAgICAgICAgIHRoaXMuc2V0U3R5bGVQcm9wKCdoZWlnaHQnLCB2LnRvU3RyaW5nKCkpO1xuICAgICAgICB9XG5cbiAgICAgICAgZ2V0IG9mZnNldFdpZHRoKCk6IG51bWJlciB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuaHRtbEVsZW1lbnQhLm9mZnNldFdpZHRoO1xuICAgICAgICB9XG4gICAgICAgIGdldCBvZmZzZXRIZWlnaHQoKTogbnVtYmVyIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5odG1sRWxlbWVudCEub2Zmc2V0SGVpZ2h0O1xuICAgICAgICB9XG5cbiAgICAgICAgc2V0U3R5bGVQcm9wKG5hbWU6IHN0cmluZywgdmFsdWU6IHN0cmluZykge1xuICAgICAgICAgICAgICAgIHRoaXMuaHRtbEVsZW1lbnQhLnN0eWxlLnNldFByb3BlcnR5KG5hbWUsIHZhbHVlKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGdldFN0eWxlUHJvcChuYW1lOiBzdHJpbmcpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5odG1sRWxlbWVudCEuc3R5bGUuZ2V0UHJvcGVydHlWYWx1ZShuYW1lKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHNldFByb3AobmFtZTogc3RyaW5nLCB2YWx1ZTogc3RyaW5nKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5odG1sRWxlbWVudCEuc2V0QXR0cmlidXRlKG5hbWUsIHZhbHVlKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGdldFByb3AobmFtZTogc3RyaW5nKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMhLmh0bWxFbGVtZW50IS5nZXRBdHRyaWJ1dGUobmFtZSk7XG4gICAgICAgIH1cbn1cblxuZXhwb3J0IGNsYXNzIFREb2N1bWVudCB7XG4gICAgICAgIHN0YXRpYyBkb2N1bWVudDogVERvY3VtZW50ID0gbmV3IFREb2N1bWVudChkb2N1bWVudCk7XG4gICAgICAgIHN0YXRpYyBib2R5ID0gZG9jdW1lbnQuYm9keTtcblxuICAgICAgICBodG1sRG9jOiBEb2N1bWVudDtcbiAgICAgICAgY29uc3RydWN0b3IoaHRtbERvYzogRG9jdW1lbnQpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmh0bWxEb2MgPSBodG1sRG9jO1xuICAgICAgICB9XG59XG5cbmV4cG9ydCBjbGFzcyBURm9ybSBleHRlbmRzIFRDb21wb25lbnQge1xuICAgICAgICBzdGF0aWMgZm9ybXMgPSBuZXcgTWFwPHN0cmluZywgVEZvcm0+KCk7XG4gICAgICAgIHByaXZhdGUgX21vdW50ZWQgPSBmYWxzZTtcbiAgICAgICAgY29tcG9uZW50UmVnaXN0cnk6IENvbXBvbmVudFJlZ2lzdHJ5ID0gbmV3IENvbXBvbmVudFJlZ2lzdHJ5KCk7XG4gICAgICAgIGNvbnN0cnVjdG9yKG5hbWU6IHN0cmluZykge1xuICAgICAgICAgICAgICAgIHN1cGVyKG5hbWUsIG51bGwsIG51bGwpO1xuICAgICAgICAgICAgICAgIHRoaXMuZm9ybSA9IHRoaXM7XG4gICAgICAgICAgICAgICAgVEZvcm0uZm9ybXMuc2V0KG5hbWUsIHRoaXMpO1xuICAgICAgICAgICAgICAgIC8vdGhpcy5wYXJlbnQgPSB0aGlzO1xuICAgICAgICB9XG5cbiAgICAgICAgLyogICAgICAgIGZpbmRGb3JtRnJvbUV2ZW50VGFyZ2V0KGN1cnJlbnRUYXJnZXRFbGVtOiBFbGVtZW50KTogVEZvcm0gfCBudWxsIHtcbiAgICAgICAgICAgICAgICBjb25zdCBmb3JtTmFtZSA9IGN1cnJlbnRUYXJnZXRFbGVtLmdldEF0dHJpYnV0ZSgnZGF0YS1uYW1lJyk7XG4gICAgICAgICAgICAgICAgY29uc3QgZm9ybTogVEZvcm0gPSBURm9ybS5mb3Jtcy5nZXQoZm9ybU5hbWUhKSE7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZvcm07XG4gICAgICAgIH1cbiAgICAgICAgICAgICAgICAqL1xuXG4gICAgICAgIC8vIEVuZ2xpc2ggY29tbWVudHMgYXMgcmVxdWVzdGVkLlxuXG4gICAgICAgIGZpbmRGb3JtRnJvbUV2ZW50VGFyZ2V0KHRhcmdldDogRWxlbWVudCk6IFRGb3JtIHwgbnVsbCB7XG4gICAgICAgICAgICAgICAgLy8gMSkgRmluZCB0aGUgbmVhcmVzdCBlbGVtZW50IHRoYXQgbG9va3MgbGlrZSBhIGZvcm0gY29udGFpbmVyXG4gICAgICAgICAgICAgICAgY29uc3QgZm9ybUVsZW0gPSB0YXJnZXQuY2xvc2VzdCgnW2RhdGEtY29tcG9uZW50PVwiVEZvcm1cIl1bZGF0YS1uYW1lXScpIGFzIEVsZW1lbnQgfCBudWxsO1xuICAgICAgICAgICAgICAgIGlmICghZm9ybUVsZW0pIHJldHVybiBudWxsO1xuXG4gICAgICAgICAgICAgICAgLy8gMikgUmVzb2x2ZSB0aGUgVEZvcm0gaW5zdGFuY2VcbiAgICAgICAgICAgICAgICBjb25zdCBmb3JtTmFtZSA9IGZvcm1FbGVtLmdldEF0dHJpYnV0ZSgnZGF0YS1uYW1lJyk7XG4gICAgICAgICAgICAgICAgaWYgKCFmb3JtTmFtZSkgcmV0dXJuIG51bGw7XG5cbiAgICAgICAgICAgICAgICByZXR1cm4gVEZvcm0uZm9ybXMuZ2V0KGZvcm1OYW1lKSA/PyBudWxsO1xuICAgICAgICB9XG5cbiAgICAgICAgc2hvdygpIHtcbiAgICAgICAgICAgICAgICAvLyBNdXN0IGJlIGRvbmUgYmVmb3JlIGJ1aWxkQ29tcG9uZW50VHJlZSgpIGJlY2F1c2UgYGJ1aWxkQ29tcG9uZW50VHJlZSgpYCBkb2VzIG5vdCBkbyBgcmVzb2x2ZVJvb3QoKWAgaXRzZWxmLlxuICAgICAgICAgICAgICAgIGlmICghdGhpcy5lbGVtKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmVsZW0gPSB0aGlzLmNvbXBvbmVudFJlZ2lzdHJ5LnJlc29sdmVSb290KCk7IC8vIG91IHRoaXMucmVzb2x2ZVJvb3QoKVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoIXRoaXMuX21vdW50ZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuY29tcG9uZW50UmVnaXN0cnkuYnVpbGRDb21wb25lbnRUcmVlKHRoaXMsIHRoaXMpO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5fbW91bnRlZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLy8gVE9ET1xuICAgICAgICB9XG5cbiAgICAgICAgYWRkRXZlbnRMaXN0ZW5lcih0eXBlOiBzdHJpbmcpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnYWRkRXZlbnRMaXN0ZW5lciBFTlRFUicsIHsgaGFzQm9keTogISFkb2N1bWVudC5ib2R5LCBoYXNFbGVtOiAhIXRoaXMuZWxlbSB9KTtcbiAgICAgICAgICAgICAgICBjb25zdCBnID0gd2luZG93IGFzIGFueTtcblxuICAgICAgICAgICAgICAgIC8vIEFib3J0IG9sZCBsaXN0ZW5lcnMgKGlmIGFueSlcbiAgICAgICAgICAgICAgICBpZiAoZy5fX2RlbHBoaW5lX2Fib3J0X2NvbnRyb2xsZXIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGcuX19kZWxwaGluZV9hYm9ydF9jb250cm9sbGVyLmFib3J0KCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGNvbnN0IGFjID0gbmV3IEFib3J0Q29udHJvbGxlcigpO1xuICAgICAgICAgICAgICAgIGcuX19kZWxwaGluZV9hYm9ydF9jb250cm9sbGVyID0gYWM7XG4gICAgICAgICAgICAgICAgY29uc3QgeyBzaWduYWwgfSA9IGFjO1xuXG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ0luc3RhbGxpbmcgZ2xvYmFsIGRlYnVnIGxpc3RlbmVycyAocmVzZXQrcmVpbnN0YWxsKScpO1xuXG4gICAgICAgICAgICAgICAgY29uc3Qgcm9vdCA9IHRoaXMuZWxlbTtcbiAgICAgICAgICAgICAgICBpZiAoIXJvb3QpIHJldHVybjtcblxuICAgICAgICAgICAgICAgIC8vIFZvdHJlIGhhbmRsZXIgc3VyIGxlIHJvb3RcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5lbGVtKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBFbmdsaXNoIGNvbW1lbnRzIGFzIHJlcXVlc3RlZC5cblxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gRW5nbGlzaCBjb21tZW50cyBhcyByZXF1ZXN0ZWQuXG5cbiAgICAgICAgICAgICAgICAgICAgICAgIHJvb3QuYWRkRXZlbnRMaXN0ZW5lcihcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKGV2OiBFdmVudCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHRhcmdldEVsZW0gPSBldi50YXJnZXQgYXMgRWxlbWVudCB8IG51bGw7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCF0YXJnZXRFbGVtKSByZXR1cm47XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBmb3JtID0gdGhpcy5maW5kRm9ybUZyb21FdmVudFRhcmdldCh0YXJnZXRFbGVtKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoIWZvcm0pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdObyBmb3JtIHJlc29sdmVkOyBldmVudCBpZ25vcmVkJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgZXZUeXBlID0gZXYudHlwZTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFN0YXJ0IGZyb20gdGhlIGNsaWNrZWQgY29tcG9uZW50IChvciBhbnkgY29tcG9uZW50IHdyYXBwZXIpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbGV0IHQxOiBFbGVtZW50IHwgbnVsbCA9IHRhcmdldEVsZW0uY2xvc2VzdCgnW2RhdGEtY29tcG9uZW50XScpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHdoaWxlICh0MSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgaGFuZGxlck5hbWUgPSB0MS5nZXRBdHRyaWJ1dGUoYGRhdGEtb24ke2V2VHlwZX1gKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gSWYgd2UgZm91bmQgYSBoYW5kbGVyIG9uIHRoaXMgZWxlbWVudCwgZGlzcGF0Y2ggaXRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChoYW5kbGVyTmFtZSAmJiBoYW5kbGVyTmFtZSAhPT0gJycpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgbmFtZSA9IHQxLmdldEF0dHJpYnV0ZSgnZGF0YS1uYW1lJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHNlbmRlciA9IG5hbWUgPyAoZm9ybS5jb21wb25lbnRSZWdpc3RyeS5nZXQobmFtZSkgPz8gbnVsbCkgOiBudWxsO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IG1heWJlTWV0aG9kID0gKGZvcm0gYXMgYW55KVtoYW5kbGVyTmFtZV07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgbWF5YmVNZXRob2QgIT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnTk9UIEEgTUVUSE9EJywgaGFuZGxlck5hbWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIElmIHNlbmRlciBpcyBtaXNzaW5nLCBmYWxsYmFjayB0byB0aGUgZm9ybSBpdHNlbGYgKHNhZmUpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIChtYXliZU1ldGhvZCBhcyAodGhpczogVEZvcm0sIHNlbmRlcjogYW55KSA9PiBhbnkpLmNhbGwoZm9ybSwgc2VuZGVyID8/IGZvcm0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIE5vIGhhbmRsZXIgaGVyZTogdHJ5IGdvaW5nIFwidXBcIiB1c2luZyB5b3VyIGNvbXBvbmVudCB0cmVlIGlmIHBvc3NpYmxlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBuYW1lID0gdDEuZ2V0QXR0cmlidXRlKCdkYXRhLW5hbWUnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGNvbXAgPSBuYW1lID8gZm9ybS5jb21wb25lbnRSZWdpc3RyeS5nZXQobmFtZSkgOiBudWxsO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBQcmVmZXIgeW91ciBWQ0wtbGlrZSBwYXJlbnQgY2hhaW4gd2hlbiBhdmFpbGFibGVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IG5leHQgPSBjb21wPy5wYXJlbnQ/LmVsZW0gPz8gbnVsbDtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gRmFsbGJhY2s6IHN0YW5kYXJkIERPTSBwYXJlbnRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHQxID0gbmV4dCA/PyB0MS5wYXJlbnRFbGVtZW50Py5jbG9zZXN0KCdbZGF0YS1jb21wb25lbnRdJykgPz8gbnVsbDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnRXZlbnQgbm90IGhhbmRsZWQnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdHJ1ZVxuICAgICAgICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgIH1cbn1cblxuZXhwb3J0IGNsYXNzIFRCdXR0b24gZXh0ZW5kcyBUQ29tcG9uZW50IHtcbiAgICAgICAgY2FwdGlvbiA9ICcnO1xuICAgICAgICBjb25zdHJ1Y3RvcihuYW1lOiBzdHJpbmcsIGZvcm06IFRGb3JtLCBwYXJlbnQ6IFRDb21wb25lbnQpIHtcbiAgICAgICAgICAgICAgICBzdXBlcihuYW1lLCBmb3JtLCBwYXJlbnQpO1xuICAgICAgICAgICAgICAgIC8vc3VwZXIobmFtZSwgZm9ybSwgcGFyZW50KTtcbiAgICAgICAgICAgICAgICAvL3RoaXMubmFtZSA9IG5hbWU7XG4gICAgICAgICAgICAgICAgLy90aGlzLmZvcm0gPSBmb3JtO1xuICAgICAgICAgICAgICAgIC8vdGhpcy5wYXJlbnQgPSBwYXJlbnQ7XG4gICAgICAgIH1cbiAgICAgICAgYWxsb3dzQ2hpbGRyZW4oKTogYm9vbGVhbiB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG5cbiAgICAgICAgc2V0Q2FwdGlvbihzOiBzdHJpbmcpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmNhcHRpb24gPSBzO1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLmh0bWxFbGVtZW50KSB0aGlzLmh0bWxFbGVtZW50LnRleHRDb250ZW50ID0gcztcbiAgICAgICAgfVxufVxuXG4vLyBFbmdsaXNoIGNvbW1lbnRzIGFzIHJlcXVlc3RlZC5cbmV4cG9ydCBjb25zdCBUQnV0dG9uQ2xhc3M6IFRDb21wb25lbnRDbGFzczxUQnV0dG9uPiA9IHtcbiAgICAgICAgdHlwZU5hbWU6ICdUQnV0dG9uJyxcblxuICAgICAgICBjcmVhdGUobmFtZTogc3RyaW5nLCBmb3JtOiBURm9ybSwgcGFyZW50OiBUQ29tcG9uZW50LCBlbGVtOiBIVE1MRWxlbWVudCkge1xuICAgICAgICAgICAgICAgIGNvbnN0IGIgPSBuZXcgVEJ1dHRvbihuYW1lLCBmb3JtLCBwYXJlbnQpO1xuICAgICAgICAgICAgICAgIGIuZWxlbSA9IGVsZW07XG4gICAgICAgICAgICAgICAgcmV0dXJuIGI7XG4gICAgICAgIH0sXG5cbiAgICAgICAgcGFyc2VQcm9wcyhlbGVtKSB7XG4gICAgICAgICAgICAgICAgLy8gTWluaW1hbCBleGFtcGxlOiBkYXRhLWNhcHRpb249XCJPS1wiXG4gICAgICAgICAgICAgICAgY29uc3QgY2FwdGlvbiA9IGVsZW0uZ2V0QXR0cmlidXRlKCdkYXRhLWNhcHRpb24nKSA/PyAnJztcbiAgICAgICAgICAgICAgICByZXR1cm4geyBjYXB0aW9uIH07XG4gICAgICAgIH0sXG5cbiAgICAgICAgYXBwbHlQcm9wcyhiLCBwcm9wcykge1xuICAgICAgICAgICAgICAgIC8vIE5vdGU6IHByb3BzIGlzIEpzb247IG5hcnJvdyBpdCBzYWZlbHkuXG4gICAgICAgICAgICAgICAgY29uc3QgbyA9IHByb3BzIGFzIGFueTtcbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIG8uY2FwdGlvbiA9PT0gJ3N0cmluZycpIGIuc2V0Q2FwdGlvbihvLmNhcHRpb24pO1xuICAgICAgICB9LFxuXG4gICAgICAgIGRlc2lnblRpbWU6IHtcbiAgICAgICAgICAgICAgICBwYWxldHRlR3JvdXA6ICdTdGFuZGFyZCcsXG4gICAgICAgICAgICAgICAgZGlzcGxheU5hbWU6ICdCdXR0b24nXG4gICAgICAgIH1cbn07XG5cbmV4cG9ydCBjbGFzcyBUQXBwbGljYXRpb24ge1xuICAgICAgICBzdGF0aWMgVGhlQXBwbGljYXRpb246IFRBcHBsaWNhdGlvbjtcbiAgICAgICAgcHJpdmF0ZSBmb3JtczogVEZvcm1bXSA9IFtdO1xuICAgICAgICByZWFkb25seSB0eXBlcyA9IG5ldyBDb21wb25lbnRUeXBlUmVnaXN0cnkoKTtcbiAgICAgICAgbWFpbkZvcm06IFRGb3JtIHwgbnVsbCA9IG51bGw7XG5cbiAgICAgICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgICAgICAgICAgVEFwcGxpY2F0aW9uLlRoZUFwcGxpY2F0aW9uID0gdGhpcztcbiAgICAgICAgICAgICAgICByZWdpc3RlckJ1aWx0aW5zKHRoaXMudHlwZXMpO1xuICAgICAgICB9XG5cbiAgICAgICAgY3JlYXRlRm9ybTxUIGV4dGVuZHMgVEZvcm0+KGN0b3I6IG5ldyAoLi4uYXJnczogYW55W10pID0+IFQsIG5hbWU6IHN0cmluZyk6IFQge1xuICAgICAgICAgICAgICAgIGNvbnN0IGYgPSBuZXcgY3RvcihuYW1lKTtcbiAgICAgICAgICAgICAgICB0aGlzLmZvcm1zLnB1c2goZik7XG4gICAgICAgICAgICAgICAgaWYgKCF0aGlzLm1haW5Gb3JtKSB0aGlzLm1haW5Gb3JtID0gZjtcbiAgICAgICAgICAgICAgICByZXR1cm4gZjtcbiAgICAgICAgfVxuXG4gICAgICAgIHJ1bigpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnJ1bldoZW5Eb21SZWFkeSgoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5tYWluRm9ybSkgdGhpcy5tYWluRm9ybS5zaG93KCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlIHRoaXMuYXV0b1N0YXJ0KCk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cblxuICAgICAgICBwcm90ZWN0ZWQgYXV0b1N0YXJ0KCkge1xuICAgICAgICAgICAgICAgIC8vIGZhbGxiYWNrOiBjaG9pc2lyIHVuZSBmb3JtIGVucmVnaXN0clx1MDBFOWUsIG91IGNyXHUwMEU5ZXIgdW5lIGZvcm0gaW1wbGljaXRlXG4gICAgICAgIH1cblxuICAgICAgICBydW5XaGVuRG9tUmVhZHkoZm46ICgpID0+IHZvaWQpIHtcbiAgICAgICAgICAgICAgICBpZiAoZG9jdW1lbnQucmVhZHlTdGF0ZSA9PT0gJ2xvYWRpbmcnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignRE9NQ29udGVudExvYWRlZCcsIGZuLCB7IG9uY2U6IHRydWUgfSk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGZuKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICB9XG59XG5cbi8qXG5cbmV4cG9ydCBjbGFzcyBWdWVDb21wb25lbnQgZXh0ZW5kcyBUQ29tcG9uZW50IHt9XG5cbmV4cG9ydCBjbGFzcyBSZWFjdENvbXBvbmVudCBleHRlbmRzIFRDb21wb25lbnQge31cblxuZXhwb3J0IGNsYXNzIFN2ZWx0ZUNvbXBvbmVudCBleHRlbmRzIFRDb21wb25lbnQge31cblxuZXhwb3J0IGNsYXNzIFBsdWdpbkhvc3Q8UHJvcHMgZXh0ZW5kcyBKc29uID0gSnNvbj4gZXh0ZW5kcyBUQ29tcG9uZW50IHtcbiAgICAgICAgcHJpdmF0ZSBwbHVnaW46IFBsdWdpbjxQcm9wcz47XG4gICAgICAgIHByaXZhdGUgc2VydmljZXM6IERlbHBoaW5lU2VydmljZXM7XG4gICAgICAgIHByaXZhdGUgbW91bnRlZCA9IGZhbHNlO1xuXG4gICAgICAgIGNvbnN0cnVjdG9yKHBsdWdpbjogVUlQbHVnaW48UHJvcHM+LCBzZXJ2aWNlczogRGVscGhpbmVTZXJ2aWNlcykge1xuICAgICAgICAgICAgICAgIHN1cGVyKCd0b3RvJywgbnVsbCwgbnVsbCk7XG4gICAgICAgICAgICAgICAgdGhpcy5wbHVnaW4gPSBwbHVnaW47XG4gICAgICAgICAgICAgICAgdGhpcy5zZXJ2aWNlcyA9IHNlcnZpY2VzO1xuICAgICAgICB9XG5cbiAgICAgICAgbW91bnQocHJvcHM6IFByb3BzKSB7XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMubW91bnRlZCkgdGhyb3cgbmV3IEVycm9yKCdQbHVnaW4gYWxyZWFkeSBtb3VudGVkJyk7XG4gICAgICAgICAgICAgICAgLy90aGlzLnBsdWdpbi5tb3VudCh0aGlzLmh0bWxFbGVtZW50LCBwcm9wcywgdGhpcy5zZXJ2aWNlcyk7XG4gICAgICAgICAgICAgICAgdGhpcy5tb3VudGVkID0gdHJ1ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIHVwZGF0ZShwcm9wczogUHJvcHMpIHtcbiAgICAgICAgICAgICAgICBpZiAoIXRoaXMubW91bnRlZCkgdGhyb3cgbmV3IEVycm9yKCdQbHVnaW4gbm90IG1vdW50ZWQnKTtcbiAgICAgICAgICAgICAgICB0aGlzLnBsdWdpbi51cGRhdGUocHJvcHMpO1xuICAgICAgICB9XG5cbiAgICAgICAgdW5tb3VudCgpIHtcbiAgICAgICAgICAgICAgICBpZiAoIXRoaXMubW91bnRlZCkgcmV0dXJuO1xuICAgICAgICAgICAgICAgIHRoaXMucGx1Z2luLnVubW91bnQoKTtcbiAgICAgICAgICAgICAgICB0aGlzLm1vdW50ZWQgPSBmYWxzZTtcbiAgICAgICAgfVxufVxuICAgICAgICAqL1xuIiwgIi8vLyA8cmVmZXJlbmNlIGxpYj1cImRvbVwiIC8+XG4vL2ltcG9ydCB7IGluc3RhbGxEZWxwaGluZVJ1bnRpbWUgfSBmcm9tIFwiLi9zcmMvZHJ0XCI7IC8vIDwtLSBUUywgcGFzIC5qc1xuaW1wb3J0IHsgVEZvcm0sIFRDb2xvciwgVEFwcGxpY2F0aW9uLCBUQ29tcG9uZW50LCBUQnV0dG9uIH0gZnJvbSAnQHZjbCc7XG5pbXBvcnQgeyBDb21wb25lbnRUeXBlUmVnaXN0cnkgfSBmcm9tICdAdmNsL1N0ZEN0cmxzJztcbi8vaW1wb3J0IHsgQ29tcG9uZW50UmVnaXN0cnkgfSBmcm9tICdAZHJ0L0NvbXBvbmVudFJlZ2lzdHJ5JztcbmltcG9ydCB7IFBsdWdpbkhvc3QgfSBmcm9tICdAZHJ0L1VJUGx1Z2luJztcblxuZXhwb3J0IGZ1bmN0aW9uIHJlZ2lzdGVyUGx1Z2luVHlwZXMocmVnOiBDb21wb25lbnRUeXBlUmVnaXN0cnkpOiB2b2lkIHtcbiAgICAgICAgLypcbiAgICAgICAgLy8gRXhhbXBsZTogYW55IHR5cGUgbmFtZSBjYW4gYmUgcHJvdmlkZWQgYnkgYSBwbHVnaW4uXG4gICAgICAgIHJlZy5yZWdpc3Rlci5yZWdpc3RlclR5cGUoJ2NoYXJ0anMtcGllJywgKG5hbWU6IHN0cmluZywgZm9ybTogVEZvcm0sIHBhcmVudDogVENvbXBvbmVudCkgPT4ge1xuICAgICAgICAgICAgICAgIHJldHVybiBuZXcgUGx1Z2luSG9zdChuYW1lLCBmb3JtLCBwYXJlbnQpO1xuICAgICAgICB9KTtcblxuICAgICAgICByZWcucmVnaXN0ZXJUeXBlKCd2dWUtaGVsbG8nLCAobmFtZTogc3RyaW5nLCBmb3JtOiBURm9ybSwgcGFyZW50OiBUQ29tcG9uZW50KSA9PiB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBQbHVnaW5Ib3N0KG5hbWUsIGZvcm0sIHBhcmVudCk7XG4gICAgICAgIH0pO1xuICAgICAgICAqL1xufVxuXG5jbGFzcyBaYXphIGV4dGVuZHMgVEZvcm0ge1xuICAgICAgICAvLyBGb3JtIGNvbXBvbmVudHMgLSBUaGlzIGxpc3QgaXMgYXV0byBnZW5lcmF0ZWQgYnkgRGVscGhpbmVcbiAgICAgICAgLy8gLS0tLS0tLS0tLS0tLS0tXG4gICAgICAgIC8vYnV0dG9uMSA6IFRCdXR0b24gPSBuZXcgVEJ1dHRvbihcImJ1dHRvbjFcIiwgdGhpcywgdGhpcyk7XG4gICAgICAgIC8vYnV0dG9uMiA6IFRCdXR0b24gPSBuZXcgVEJ1dHRvbihcImJ1dHRvbjJcIiwgdGhpcywgdGhpcyk7XG4gICAgICAgIC8vYnV0dG9uMyA6IFRCdXR0b24gPSBuZXcgVEJ1dHRvbihcImJ1dHRvbjNcIiwgdGhpcywgdGhpcyk7XG4gICAgICAgIC8vIC0tLS0tLS0tLS0tLS0tLVxuXG4gICAgICAgIGNvbnN0cnVjdG9yKG5hbWU6IHN0cmluZykge1xuICAgICAgICAgICAgICAgIHN1cGVyKG5hbWUpO1xuICAgICAgICB9XG4gICAgICAgIC8vaW1wb3J0IHsgaW5zdGFsbERlbHBoaW5lUnVudGltZSB9IGZyb20gXCIuL2RydFwiO1xuXG4gICAgICAgIC8qXG5jb25zdCBydW50aW1lID0geyAgIFxuICBoYW5kbGVDbGljayh7IGVsZW1lbnQgfTogeyBlbGVtZW50OiBFbGVtZW50IH0pIHtcbiAgICBjb25zb2xlLmxvZyhcImNsaWNrZWQhXCIsIGVsZW1lbnQpO1xuICAgIC8vKGVsZW1lbnQgYXMgSFRNTEVsZW1lbnQpLnN0eWxlLmJhY2tncm91bmRDb2xvciA9IFwicmVkXCI7XG4gIH0sXG59OyBcbiovXG5cbiAgICAgICAgYnV0dG9uMV9vbmNsaWNrKCkge1xuICAgICAgICAgICAgICAgIGNvbnN0IGJ0biA9IHRoaXMuY29tcG9uZW50UmVnaXN0cnkuZ2V0PFRCdXR0b24+KCdidXR0b24xJyk7XG4gICAgICAgICAgICAgICAgaWYgKCFidG4pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybignYnV0dG9uMSBub3QgZm91bmQgaW4gcmVnaXN0cnknKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgLy9idG4uY29sb3IgPSBUQ29sb3IucmdiKDAsIDAsIDI1NSk7XG4gICAgICAgICAgICAgICAgdGhpcy5jb21wb25lbnRSZWdpc3RyeS5nZXQoJ2J1dHRvbjEnKSEuY29sb3IgPSBUQ29sb3IucmdiKDI1NSwgMCwgMCk7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ0J1dHRvbjEgY2xpY2tlZCEhISEnKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHphemFfb25jbGljaygpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmNvbXBvbmVudFJlZ2lzdHJ5LmdldCgnYnV0dG9uMScpIS5jb2xvciA9IFRDb2xvci5yZ2IoMCwgMjU1LCAwKTtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnemF6YSBjbGlja2VkISEhIScpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy9pbnN0YWxsRGVscGhpbmVSdW50aW1lKHJ1bnRpbWUpO1xufSAvLyBjbGFzcyB6YXphXG5cbmNsYXNzIE15QXBwbGljYXRpb24gZXh0ZW5kcyBUQXBwbGljYXRpb24ge1xuICAgICAgICB6YXphOiBaYXphO1xuXG4gICAgICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICAgICAgICAgIHN1cGVyKCk7XG4gICAgICAgICAgICAgICAgdGhpcy56YXphID0gbmV3IFphemEoJ3phemEnKTtcbiAgICAgICAgICAgICAgICB0aGlzLm1haW5Gb3JtID0gdGhpcy56YXphO1xuICAgICAgICB9XG5cbiAgICAgICAgcnVuKCkge1xuICAgICAgICAgICAgICAgIC8vdGhpcy56YXphLmNvbXBvbmVudFJlZ2lzdHJ5LmJ1aWxkQ29tcG9uZW50VHJlZSh0aGlzLnphemEpO1xuICAgICAgICAgICAgICAgIC8vdGhpcy56YXphLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJyk7XG5cbiAgICAgICAgICAgICAgICAvLyBhdSBsYW5jZW1lbnRcbiAgICAgICAgICAgICAgICB0aGlzLnJ1bldoZW5Eb21SZWFkeSgoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnphemEuc2hvdygpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG59IC8vIGNsYXNzIE15QXBwbGljYXRpb25cblxuY29uc3QgbXlBcHBsaWNhdGlvbjogTXlBcHBsaWNhdGlvbiA9IG5ldyBNeUFwcGxpY2F0aW9uKCk7XG5teUFwcGxpY2F0aW9uLnJ1bigpO1xuIl0sCiAgIm1hcHBpbmdzIjogIjs7Ozs7QUFNTyxTQUFTLGlCQUFpQixPQUE4QjtBQUN2RCxRQUFNLFNBQVMsWUFBWTtBQUduQzs7O0FDNEJPLElBQU1BLHlCQUFOLE1BQTRCO0FBQUEsRUFBNUI7QUFDQyx3QkFBaUIsV0FBVSxvQkFBSSxJQUE2QjtBQUFBO0FBQUEsRUFFNUQsU0FBK0IsS0FBeUI7QUFDaEQsUUFBSSxLQUFLLFFBQVEsSUFBSSxJQUFJLFFBQVEsR0FBRztB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QUFBQTtBQUFBO0FBQUEsRUFZQSxrQkFBa0I7QUFDVixVQUFNLE1BQU0sS0FBSyxrQkFBa0IsSUFBYSxTQUFTO0FBQ3pELFFBQUksQ0FBQyxLQUFLO0FBQ0YsY0FBUSxLQUFLLCtCQUErQjtBQUM1QztBQUFBLElBQ1I7QUFFQSxTQUFLLGtCQUFrQixJQUFJLFNBQVMsRUFBRyxRQUFRLE9BQU8sSUFBSSxLQUFLLEdBQUcsQ0FBQztBQUNuRSxZQUFRLElBQUkscUJBQXFCO0FBQUEsRUFDekM7QUFBQSxFQUVBLGVBQWU7QUFDUCxTQUFLLGtCQUFrQixJQUFJLFNBQVMsRUFBRyxRQUFRLE9BQU8sSUFBSSxHQUFHLEtBQUssQ0FBQztBQUNuRSxZQUFRLElBQUksa0JBQWtCO0FBQUEsRUFDdEM7QUFBQTtBQUdSO0FBRUEsSUFBTSxnQkFBTixjQUE0QixhQUFhO0FBQUEsRUFHakMsY0FBYztBQUNOLFVBQU07QUFIZDtBQUlRLFNBQUssT0FBTyxJQUFJLEtBQUssTUFBTTtBQUMzQixTQUFLLFdBQVcsS0FBSztBQUFBLEVBQzdCO0FBQUEsRUFFQSxNQUFNO0FBS0UsU0FBSyxnQkFBZ0IsTUFBTTtBQUNuQixXQUFLLEtBQUssS0FBSztBQUFBLElBQ3ZCLENBQUM7QUFBQSxFQUNUO0FBQ1I7QUFFQSxJQUFNLGdCQUErQixJQUFJLGNBQWM7QUFDdkQsY0FBYyxJQUFJOyIsCiAgIm5hbWVzIjogWyJDb21wb25lbnRUeXBlUmVnaXN0cnkiLCAiVENvbXBvbmVudCIsICJuYW1lIiwgIlRGb3JtIiwgIlRCdXR0b24iLCAiVEZvcm0iXQp9Cg==
