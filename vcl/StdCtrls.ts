export class TColor {
        s: string;

        constructor(s: string) {
                this.s = s;
        }
        /* factory */ static rgb(r: number, g: number, b: number): TColor {
                return new TColor(`rgb(${r}, ${g}, ${b})`);
        }
        /* factory */ static rgba(r: number, g: number, b: number, a: number): TColor {
                return new TColor(`rgba(${r}, ${g}, ${b}, ${a})`);
        }
}

class ComponentRegistry {
        private byName = new Map<string, TComponent>();

        register(name: string, c: TComponent) {
                this.byName.set(name, c);
        }

        get<T extends TComponent = TComponent>(name: string): T | undefined {
                return this.byName.get(name) as T | undefined;
        }

        clear() {
                this.byName.clear();
        }

        private resolveRoot(): HTMLElement {
                // Prefer body as the canonical root.
                if (document.body?.dataset?.component) return document.body;

                // Backward compatibility: old wrapper div.
                const legacy = document.getElementById('delphine-root');
                if (legacy) return legacy;

                // Last resort.
                return document.body ?? document.documentElement;
        }

        buildComponentTree(form: TForm) {
                this.clear();
                //const root = TDocument.body;
                //const root = (document.getElementById('delphine-root') ?? document.body) as HTMLElement;
                // English comments as requested.

                //const root = (document.body?.matches('[data-component]') ? document.body : null) ?? (document.getElementById('delphine-root') as HTMLElement | null) ?? document.body;
                const root = this.resolveRoot();

                // 1️⃣ traiter la Form elle-même
                if (root.matches('[data-component]')) {
                        //this.registerForm(root);
                        console.log('le root match');
                }

                // --- FORM ---
                // provisoirement if (root.getAttribute('data-component') === 'TForm') {
                form.elem = root;
                this.register(form.name, form);
                const toto = root.getAttribute('data-onclick');
                console.log(`toto = ${toto}`);
                //}

                // --- CHILD COMPONENTS ---
                root.querySelectorAll('[data-component]').forEach((el) => {
                        if (el === root) return;
                        const name = el.getAttribute('data-name');
                        const type = el.getAttribute('data-component');
                        const titi = el.getAttribute('data-onclick');

                        console.log(`titi = ${titi}`);

                        let comp: TComponent | null = null;

                        switch (type) {
                                case 'my-button':
                                        comp = new TButton(name!, form, form);
                                        break;
                        }

                        if (comp) {
                                comp.elem = el;
                                this.register(name!, comp);
                        }
                });
                form.addEventListener('click');
        }
}

export class TComponent {
        parent: TComponent | null = null;
        form: TForm | null = null;
        children: TComponent[] = [];

        elem: Element | null = null;
        get htmlElement(): HTMLElement | null {
                return this.elem as HTMLElement | null;
        }
        name: string;
        constructor(name: string, parent: TComponent | null, form: TForm | null) {
                this.name = name;
                this.parent = parent;
                parent?.children.push(this);
                this.form = form;
                this.name = name;
        }

        get color(): TColor {
                return new TColor(this.getStyleProp('color'));
        }
        set color(v: TColor) {
                this.setStyleProp('color', v.s);
        }

        get backgroundColor(): TColor {
                return new TColor(this.getStyleProp('background-color'));
        }
        set backgroundColor(v: TColor) {
                this.setStyleProp('background-color', v.s);
        }

        get width(): number {
                return parseInt(this.getStyleProp('width'));
        }
        set width(v: number) {
                this.setStyleProp('width', v.toString());
        }

        get height(): number {
                return parseInt(this.getStyleProp('height'));
        }
        set height(v: number) {
                this.setStyleProp('height', v.toString());
        }

        get offsetWidth(): number {
                return this.htmlElement!.offsetWidth;
        }
        get offsetHeight(): number {
                return this.htmlElement!.offsetHeight;
        }

        setStyleProp(name: string, value: string) {
                this.htmlElement!.style.setProperty(name, value);
        }

        getStyleProp(name: string) {
                return this.htmlElement!.style.getPropertyValue(name);
        }

        setProp(name: string, value: string) {
                this.htmlElement!.setAttribute(name, value);
        }

        getProp(name: string) {
                return this!.htmlElement!.getAttribute(name);
        }
}

export class TDocument {
        static document: TDocument = new TDocument(document);
        static body = document.body;

        htmlDoc: Document;
        constructor(htmlDoc: Document) {
                this.htmlDoc = htmlDoc;
        }
}

export class TForm extends TComponent {
        static forms = new Map<string, TForm>();
        componentRegistry: ComponentRegistry = new ComponentRegistry();
        constructor(name: string) {
                super(name, null, null);
                this.form = this;
                TForm.forms.set(name, this);
                //this.parent = this;
        }

        /*        findFormFromEventTarget(currentTargetElem: Element): TForm | null {
                const formName = currentTargetElem.getAttribute('data-name');
                const form: TForm = TForm.forms.get(formName!)!;
                return form;
        }
                */

        // English comments as requested.

        findFormFromEventTarget(target: Element): TForm | null {
                // 1) Find the nearest element that looks like a form container
                const formElem = target.closest('[data-component="TForm"][data-name]') as Element | null;
                if (!formElem) return null;

                // 2) Resolve the TForm instance
                const formName = formElem.getAttribute('data-name');
                if (!formName) return null;

                return TForm.forms.get(formName) ?? null;
        }

        show() {
                // TODO
        }

        addEventListener(type: string) {
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
                console.log('FOCUS STATE', {
                        hasFocus: document.hasFocus(),
                        activeElement: document.activeElement?.tagName,
                        visibility: document.visibilityState
                });

                window.addEventListener('focus', () => console.log('WINDOW FOCUS'), { capture: true, signal });
                window.addEventListener('blur', () => console.log('WINDOW BLUR'), { capture: true, signal });
                document.addEventListener('visibilitychange', () => console.log('VIS', document.visibilityState), { capture: true, signal });

                // watchdog: si vous cliquez et que rien n’arrive, regardez si hasFocus reste false
                setInterval(() => {
                        console.log('TICK', { hasFocus: document.hasFocus(), vis: document.visibilityState });
                        console.log('[probe] activeElement', document.activeElement?.tagName, (document.activeElement as any)?.id);
                        console.log('[probe] btn exists', !!document.getElementById('btn'));
                }, 2000);

                document.addEventListener('click', (e) => console.log('DOC CAPTURE', e.target), { capture: true, signal });
                document.addEventListener('click', (e) => console.log('DOC BUBBLE', e.target), { capture: false, signal });
                window.addEventListener('click', (e) => console.log('WIN', e.target), { capture: true, signal });
                document.body?.addEventListener('click', (e) => console.log('BODY', e.target), { capture: true, signal });

                document.addEventListener('pointerdown', (e) => console.log('PD', e.target), { capture: true, signal });
                document.addEventListener('pointerup', (e) => console.log('PU', e.target), { capture: true, signal });
                document.addEventListener('mousedown', (e) => console.log('MD', e.target), { capture: true, signal });
                document.addEventListener('mouseup', (e) => console.log('MU', e.target), { capture: true, signal });

                document.addEventListener('pointermove', () => console.log('PMOVE'), { capture: true, signal });

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
}

export class TButton extends TComponent {
        constructor(name: string, parent: TComponent, form: TForm) {
                super(name, parent, form);
        }
}

export class TApplication {
        constructor() {
                /* base class for the application */
        }
}
