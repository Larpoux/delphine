// English comments as requested.

//import { ComponentTypeRegistry } from '@drt';
import { TButton, TMetaComponent, TForm, TComponent, ComponentTypeRegistry, TMetaButton } from '@vcl';

// English comments as requested.
export function registerBuiltins(types: ComponentTypeRegistry) {
        types.register(new TMetaButton());
        // types.register(TEditClass);
        // types.register(TLabelClass);
}
