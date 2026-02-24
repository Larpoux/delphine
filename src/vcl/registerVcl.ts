// English comments as requested.

//import { ComponentTypeRegistry } from '@drt';
import { TButton, TMetaComponent, TForm, TComponent, TComponentTypeRegistry, TMetaButton, TMetaPluginHost } from '@vcl';
//import { TMetaPluginHost } from '../drt/UIPlugin'; // NOT GOOD ! import VCL!

// English comments as requested.
export function registerBuiltins(types: TComponentTypeRegistry) {
        types.register(TMetaButton.metaclass);
        types.register(TMetaPluginHost.metaClass);
        // types.register(TEditClass);
        // types.register(TLabelClass);
}
