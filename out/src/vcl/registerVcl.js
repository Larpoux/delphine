"use strict";
// English comments as requested.
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerVclTypes = registerVclTypes;
const _vcl_1 = require("@vcl");
function registerVclTypes(reg) {
    // Note: "TForm" is typically instantiated by the App, not by DOM scanning.
    // But registering it can still be useful for consistency/testing.
    reg.registerType('TForm', (name, form, parent) => {
        const f = new _vcl_1.TForm(name); // adjust ctor to your real signature
        return f;
    });
    reg.registerType('TButton', (name, form, parent) => new _vcl_1.TButton(name, form, parent));
    //reg.registerType('TLabel', (name, form, owner) => new TLabel(name, form, owner));
    //reg.registerType('TEdit', (name, form, owner) => new TEdit(name, form, owner));
    // Your existing alias:
    reg.registerType('my-button', (name, form, parent) => new _vcl_1.TButton(name, form, parent));
}
//# sourceMappingURL=registerVcl.js.map