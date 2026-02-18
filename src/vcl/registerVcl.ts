// English comments as requested.

import { ComponentTypeRegistry } from '@drt';
import { TButton, TForm, TComponent } from '@vcl';

export function registerVclTypes(reg: ComponentTypeRegistry): void {
        // Note: "TForm" is typically instantiated by the App, not by DOM scanning.
        // But registering it can still be useful for consistency/testing.

        reg.registerType('TForm', (name: string, form: TForm, parent: TComponent) => {
                const f = new TForm(name); // adjust ctor to your real signature
                return f;
        });

        reg.registerType('TButton', (name: string, form: TForm, parent: TComponent) => new TButton(name, form, parent));
        //reg.registerType('TLabel', (name, form, owner) => new TLabel(name, form, owner));
        //reg.registerType('TEdit', (name, form, owner) => new TEdit(name, form, owner));

        // Your existing alias:
        reg.registerType('my-button', (name: string, form: TForm, parent: TComponent) => new TButton(name, form, parent));
}
