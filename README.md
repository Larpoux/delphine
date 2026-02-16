# Delphine (clean skeleton)

This is a cleaned-up skeleton based on your current codebase.

## What was removed

- All references to the Microsoft **catScratch / catCustoms** sample.
- The huge sample HTML (GrapesJS demo) and commented dead code.
- The repeated `panel.webview.html = html` assignments.
- Multiple duplicated `onDidReceiveMessage` handlers.
- Reveal / focus timer storms that were causing **Webview is disposed** errors.

## What you get

- **Preview panel** (reliable): command `Delphine: Open Preview Panel`
- **Custom editor** (optional): viewType `delphine.previewEditor` with `priority: option`
     - Use _Open With…_ on an `.html` file to choose it.

## Files / structure

- `src/extension.ts` — registers commands + custom editor provider
- `src/preview/PreviewPanel.ts` — webview panel (separate from custom editor)
- `src/preview/html.ts` — HTML builder + CSP (nonce + webview.cspSource)
- `src/editor/DelphineEditorProvider.ts` — optional custom editor provider

## Notes for your media scripts

The preview HTML expects these files in your extension folder:

- `media/boot.js`
- `media/zaza.compiled.js`

If you want to load scripts from somewhere else (workspace folder, generated output, etc.), change the URIs in `src/preview/html.ts`.

## Build

```bash
npm install
npm run compile
```

Then run the extension in VS Code (F5).
