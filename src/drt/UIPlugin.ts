// delphine-ui-plugin.ts
// A framework-agnostic contract.
// Delphine never talks to React/Vue/Svelte directly — only to this interface.
//import { TComponent, TForm, ComponentFactory, Json, TMetaComponent, PropSpec } from '@vcl';
import type { Json } from '@vcl';
import { TComponent, TForm, TMetaComponent, PropSpec, TApplication, DelphineServices } from '@vcl';

// =========================================================== HTML ===============================================================

/*
<div
  data-component="TPluginHost"
  data-name="chart1"
  data-plugin="chartjs-pie"
  data-props='{"title":"Ventes","values":[10,20,30]}'
></div>
*/

//===================================================================================================================================

export type UIPluginFactory<Props extends Json = Json> = (args: { host: TPluginHost; form: TForm }) => UIPluginInstance<Props>;
//export type UIPluginFactory = (args: { host: TPluginHost; form: TForm }) => UIPluginInstance;

export interface SizeHints {
        minWidth?: number;
        minHeight?: number;
        preferredWidth?: number;
        preferredHeight?: number;
}

export interface UIPluginInstance<Props extends Json = Json> {
        readonly id: string;

        // Called exactly once after creation (for a given instance).
        mount(container: HTMLElement, props: Props, services: DelphineServices): void;

        // Called any time props change (may be frequent).
        update(props: Props): void;

        // Called exactly once before disposal.
        unmount(): void;

        // Optional ergonomics.
        getSizeHints?(): SizeHints;
        focus?(): void;

        // Optional persistence hook (Delphine may store & restore this).
        serializeState?(): Json;
}

export type UIPluginDef = {
        factory: UIPluginFactory;
        // optionnel : un schéma de props, aide au designer
        // props?: PropSchema;
};

export class PluginRegistry {
        private readonly plugins = new Map<string, UIPluginDef>();

        register(name: string, def: UIPluginDef) {
                if (this.plugins.has(name)) throw new Error(`Plugin already registered: ${name}`);
                this.plugins.set(name, def);
        }

        get(name: string): UIPluginDef | undefined {
                return this.plugins.get(name);
        }

        has(name: string): boolean {
                return this.plugins.has(name);
        }
}

// ==================================================================================== PluginHost ============================================================================================

export class TMetaPluginHost extends TMetaComponent<TPluginHost> {
        static metaClass = new TMetaPluginHost();
        getMetaClass() {
                return TMetaPluginHost.metaClass;
        }
        readonly typeName = 'TPluginHost';

        create(name: string, form: TForm, parent: TComponent) {
                return new TPluginHost(name, form, parent);
        }

        props(): PropSpec<TPluginHost>[] {
                return [];
        }
}

export class TPluginHost extends TComponent {
        static pluginRegistry = new PluginRegistry();
        private instance: UIPluginInstance | null = null;

        pluginName: string | null = null;
        pluginProps: Json = {};
        private factory: UIPluginFactory | null = null;

        constructor(name: string, form: TForm, parent: TComponent) {
                super(TMetaPluginHost.metaClass, name, form, parent);
        }

        // Called by the metaclass (or by your registry) right after creation
        setPluginFactory(factory: UIPluginFactory) {
                this.factory = factory;
        }

        mountPlugin(props: Json, services: DelphineServices) {
                const container = this.htmlElement;
                if (!container) return;

                if (!this.factory) {
                        services.log.warn('TPluginHost: no plugin factory set', { host: this.name as any });
                        return;
                }

                // Dispose old instance if any
                this.unmount();

                // Create plugin instance then mount
                this.instance = this.factory({ host: this, form: this.form! });
                this.instance!.mount(container, props, services);
        }

        // Called by buildComponentTree()
        setPluginSpec(spec: { plugin: string | null; props: any }) {
                this.pluginName = spec.plugin;
                this.pluginProps = spec.props ?? {};
        }

        // Called by buildComponentTree()
        mountPluginIfReady(services: DelphineServices) {
                const container = this.htmlElement;
                if (!container || !this.form || !this.pluginName) return;

                const app = TApplication.TheApplication; // ou un accès équivalent
                const def = TPluginHost.pluginRegistry.get(this.pluginName);

                if (!def) {
                        services.log.warn('Unknown plugin', { plugin: this.pluginName as any });
                        return;
                }

                this.unmount();
                this.instance = def.factory({ host: this, form: this.form });
                this.instance!.mount(container, this.pluginProps, services);
        }

        update(props: any) {
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

// ===========================================================  Hello  ===========================================================================

export function registerChartJsPie(app: TApplication) {
        TPluginHost.pluginRegistry.register('chartjs-pie', {
                factory: ({ host, form }) => new ChartJsPieInstance()
        });
}

//import { registerChartJsPie } from './plugins/chartjs-pie';
export function registerUserPlugins(app: TApplication) {
        registerChartJsPie(app);
}

class ChartJsPieInstance {
        readonly id: string = 'toto';

        mount(container: HTMLElement, props: Json, services: DelphineServices): void {}

        // Called any time props change (may be frequent).
        update(props: Json): void {}

        // Called exactly once before disposal.
        unmount(): void {}

        // Optional ergonomics.
        //getSizeHints?(): SizeHints {}
        //focus?(): void;

        // Optional persistence hook (Delphine may store & restore this).
        //serializeState?(): Json;
}
