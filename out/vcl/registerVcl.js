"use strict";
// English comments as requested.
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerBuiltins = registerBuiltins;
//import { ComponentTypeRegistry } from '@drt';
const _vcl_1 = require("@vcl");
//import { TMetaPluginHost } from '../drt/UIPlugin'; // NOT GOOD ! import VCL!
// English comments as requested.
function registerBuiltins(types) {
    types.register(_vcl_1.TMetaButton.metaClass);
    types.register(_vcl_1.TMetaPluginHost.metaClass);
    // types.register(TEditClass);
    // types.register(TLabelClass);
}
//# sourceMappingURL=registerVcl.js.map