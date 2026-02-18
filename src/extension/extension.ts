import * as vscode from 'vscode';
import { PreviewPanel } from './preview/PreviewPanel';
import { DelphineCustomEditorProvider } from './editor/DelphineCustomEditorProvider';

export function activate(context: vscode.ExtensionContext): void {
        // Command: open a preview panel next to the current editor.
        context.subscriptions.push(
                vscode.commands.registerCommand('delphine.preview', async () => {
                        const editor = vscode.window.activeTextEditor;
                        if (!editor) {
                                void vscode.window.showInformationMessage('No active editor');
                                return;
                        }
                        await PreviewPanel.createOrShow(context, editor.document.uri);
                })
        );

        context.subscriptions.push(
                vscode.commands.registerCommand('delphine.openEditor', async () => {
                        const uri = vscode.window.activeTextEditor?.document.uri;
                        if (!uri) return;
                        await vscode.commands.executeCommand('vscode.openWith', uri, 'delphine.customEditor');
                })
        );

        // Custom editor (separate from the preview panel).
        //const provider = new DelphineCustomEditorProvider(context);
        context.subscriptions.push(DelphineCustomEditorProvider.register(context));
}

export function deactivate(): void {
        // Nothing to do.
}
