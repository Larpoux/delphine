/* src/webview/types/grapesjs.d.ts */
/* Minimal-but-useful GrapesJS typings for a VSCode webview UMD build */

declare namespace GrapesJS {
  // --- Common helpers --------------------------------------------------------

  type Dict<T = any> = Record<string, T>;

  // --- Traits ----------------------------------------------------------------

  export type TraitType = 'text' | 'number' | 'checkbox' | 'select' | 'color' | 'button';

  export interface TraitOption {
    id: string;
    name?: string;
    label?: string;
    value?: any;
  }

  export interface Trait {
    type?: TraitType;
    name: string;
    label?: string;
    placeholder?: string;
    options?: TraitOption[];
    changeProp?: boolean;
    [k: string]: any;
  }

  // --- Blocks ----------------------------------------------------------------

  export interface Block {
    label?: string;
    category?: string;
    attributes?: Dict;
    content?: string | Dict; // In GrapesJS content can be HTML string or component definition
    media?: string;
    select?: boolean;
    activate?: boolean;
    [k: string]: any;
  }

  export interface BlockManager {
    add(id: string, block: Block): any;
    get(id: string): any;
    remove(id: string): void;
    getAll(): any;
  }

  // --- Components / DOM ------------------------------------------------------

  export interface Component {
    get(key: string): any;
    set(key: string, value: any): void;
    addAttributes(attrs: Dict): void;

    // Components collection
    components(): ComponentCollection;

    // Optional helpers (not always present depending on build/version)
    toHTML?(): string;
    find?(selector: string): Component[];
    findType?(type: string): Component[];
    [k: string]: any;
  }

  export interface ComponentCollection {
    length: number;
    at(index: number): Component | undefined;
    models: Component[];
    [k: string]: any;
  }

  export interface ComponentTypeDefinition {
    isComponent?: (el: HTMLElement) => false | { type?: string } | Dict;
    model?: {
      defaults?: Dict & { traits?: Trait[] };
      prototype?: { defaults?: Dict & { traits?: Trait[] } };
      [k: string]: any;
    };
    view?: Dict;
    [k: string]: any;
  }

  export interface DomComponents {
    addType(type: string, def: ComponentTypeDefinition): void;
    getType(type: string): ComponentTypeDefinition | undefined;
    [k: string]: any;
  }

  // --- CSS -------------------------------------------------------------------

  export interface CssComposer {
    clear(): void;
    [k: string]: any;
  }

  // --- Editor ----------------------------------------------------------------

  export type EditorEvent =
    | 'load'
    | 'component:add'
    | 'component:remove'
    | 'component:update'
    | 'style:property:update'
    | 'rte:enable'
    | 'rte:disable'
    | string;

  export interface Editor {
    BlockManager: BlockManager;
    DomComponents: DomComponents;
    CssComposer: CssComposer;

    on(event: EditorEvent, cb: (...args: any[]) => void): void;
    off?(event?: EditorEvent, cb?: (...args: any[]) => void): void;

    getWrapper(): Component;
    getHtml(): string;
    getCss(): string;

    setComponents(components: string | Dict): void;
    setStyle(style: string | Dict): void;

    // Optional helpers you might use later
    getContainer?(): HTMLElement;
    destroy?(): void;

    [k: string]: any;
  }

  // --- Config ----------------------------------------------------------------

  export interface StyleManagerSector {
    name: string;
    open?: boolean;
    buildProps?: string[];
    [k: string]: any;
  }

  export interface StyleManagerConfig {
    sectors?: StyleManagerSector[];
    [k: string]: any;
  }

  export interface StorageManagerConfig {
    autoload?: boolean | number;
    [k: string]: any;
  }

  export interface EditorConfig {
    container: string | HTMLElement;
    height?: string | number;
    fromElement?: boolean;
    showOffsets?: boolean | number;
    noticeOnUnload?: boolean | number;
    storageManager?: StorageManagerConfig | false;
    styleManager?: StyleManagerConfig;
    [k: string]: any;
  }

  // --- GrapesJS global UMD entry --------------------------------------------

  export interface GrapesJSEntry {
    init(config: EditorConfig): Editor;
    version?: string;
    editors?: Editor[];
    plugins?: any;
    usePlugin?: (...args: any[]) => any;
    [k: string]: any;
  }
}

/**
 * In the webview UMD build, GrapesJS exposes a global `grapesjs`.
 * We map it to a typed global const.
 */
declare const grapesjs: GrapesJS.GrapesJSEntry;

