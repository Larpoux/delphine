// delphine-ui-plugin.ts
// A framework-agnostic contract.
// Delphine never talks to React/Vue/Svelte directly — only to this interface.
import '@vcl';
import { TComponent, TForm, ComponentFactory } from '@vcl';

export type Json = null | boolean | number | string | Json[] | { [key: string]: Json };

export interface DelphineLogger {
        debug(msg: string, data?: Json): void;
        info(msg: string, data?: Json): void;
        warn(msg: string, data?: Json): void;
        error(msg: string, data?: Json): void;
}

export interface DelphineEventBus {
        // Subscribe to an app event.
        on(eventName: string, handler: (payload: Json) => void): () => void;

        // Publish an app event.
        emit(eventName: string, payload: Json): void;
}

export interface DelphineStorage {
        get(key: string): Promise<Json | undefined>;
        set(key: string, value: Json): Promise<void>;
        remove(key: string): Promise<void>;
}

export interface DelphineServices {
        log: DelphineLogger;
        bus: DelphineEventBus;
        storage: DelphineStorage;

        // Optional future services
        // i18n?: { t(key: string, vars?: Record<string, string | number>): string };
        // nav?: { go(route: string): void; current(): string };
}

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

// English comments as requested.
export class PluginHost extends TComponent {
        private instance: UIPluginInstance | null = null;

        constructor(name: string, form: TForm, parent: TComponent) {
                super(name, form, parent);
                //this.form = form;
                //this.parent = parent;
                // you likely add this to parent's children elsewhere
        }

        mountPlugin(factory: ComponentFactory, props: any, services: any) {
                const container = this.htmlElement;
                if (!container) return;

                //this.instance = factory.mount(container, props, services);
        }

        update(props: any) {
                this.instance?.update?.(props);
        }

        unmount() {
                this.instance?.unmount?.();
                this.instance = null;
        }
}
