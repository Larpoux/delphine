"use strict";
// English comments as requested.
Object.defineProperty(exports, "__esModule", { value: true });
exports.ComponentRegistry = void 0;
class ComponentRegistry {
    factories = new Map();
    registerType(typeName, factory) {
        this.factories.set(typeName, factory);
    }
    has(typeName) {
        return this.factories.has(typeName);
    }
    create(typeName, name, form, owner) {
        const f = this.factories.get(typeName);
        return f ? f(name, form, owner) : null;
    }
}
exports.ComponentRegistry = ComponentRegistry;
//# sourceMappingURL=ComponentRegistry.js.map