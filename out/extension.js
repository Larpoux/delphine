"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
const PreviewPanel_1 = require("./preview/PreviewPanel");
const DelphineCustomEditorProvider_1 = require("./editor/DelphineCustomEditorProvider");
function activate(context) {
    // Command: open a preview panel next to the current editor.
    context.subscriptions.push(vscode.commands.registerCommand('delphine.preview', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            void vscode.window.showInformationMessage('No active editor');
            return;
        }
        await PreviewPanel_1.PreviewPanel.createOrShow(context, editor.document.uri);
    }));
    context.subscriptions.push(vscode.commands.registerCommand('delphine.openEditor', async () => {
        const uri = vscode.window.activeTextEditor?.document.uri;
        if (!uri)
            return;
        await vscode.commands.executeCommand('vscode.openWith', uri, 'delphine.customEditor');
    }));
    // Custom editor (separate from the preview panel).
    //const provider = new DelphineCustomEditorProvider(context);
    context.subscriptions.push(DelphineCustomEditorProvider_1.DelphineCustomEditorProvider.register(context));
}
function deactivate() {
    // Nothing to do.
}
//# sourceMappingURL=extension.js.map