//import * as crypto from 'crypto';
//import * as vscode from 'vscode';
//import * as fs from 'node:fs';
//import * as path from 'node:path';

//type Disposer = { dispose(): void };

import { parse, serialize } from 'parse5';
import type { Document as DefaultTreeDocument, Element as DefaultTreeElement, Node as DefaultTreeNode, TextNode as DefaultTreeTextNode } from 'parse5/dist/tree-adapters/default';

export interface GrapesInput {
        cssText: string;
        bodyInnerHtml: string;
        bodyAttrs: string;
}

// --- Helpers (parse5 default tree) ---

function isElement(n: DefaultTreeNode, tag: string): n is DefaultTreeElement {
        return (n as any).nodeName === tag;
}

function childNodes(n: DefaultTreeNode): DefaultTreeNode[] {
        return ((n as any).childNodes ?? []) as DefaultTreeNode[];
}

function findFirst(node: DefaultTreeNode, pred: (n: DefaultTreeNode) => boolean): DefaultTreeNode | null {
        if (pred(node)) return node;
        for (const ch of childNodes(node)) {
                const found = findFirst(ch, pred);
                if (found) return found;
        }
        return null;
}

function findAll(node: DefaultTreeNode, pred: (n: DefaultTreeNode) => boolean, acc: DefaultTreeNode[] = []): DefaultTreeNode[] {
        if (pred(node)) acc.push(node);
        for (const ch of childNodes(node)) findAll(ch, pred, acc);
        return acc;
}

function extractStyleText(styleEl: DefaultTreeElement): string {
        // In parse5 default tree, <style> content is usually TextNodes with `.value`.
        const texts = childNodes(styleEl).filter((n) => (n as any).nodeName === '#text') as DefaultTreeTextNode[];
        return texts.map((t) => t.value ?? '').join('');
}

function attrsToString(el: DefaultTreeElement): string {
        // Serialize attributes back to HTML-ish string:  foo="bar" baz
        const attrs = ((el as any).attrs ?? []) as Array<{ name: string; value: string }>;
        if (!attrs.length) return '';

        const parts: string[] = [];
        for (const a of attrs) {
                // Boolean attrs show as name="" sometimes; keep minimal form when empty.
                if (a.value === '') parts.push(a.name);
                else parts.push(`${a.name}="${escapeAttr(a.value)}"`);
        }
        return parts.join(' ');
}

function escapeAttr(s: string): string {
        // Minimal escaping for attributes.
        return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
}

function removeNodesRecursive(root: DefaultTreeNode, pred: (el: DefaultTreeElement) => boolean): void {
        // Walk the tree and remove matching elements from any childNodes array.
        const kids = childNodes(root);
        if (!kids.length) return;

        // Mutate in place.
        const kept: DefaultTreeNode[] = [];
        for (const k of kids) {
                if ((k as any).nodeName && typeof (k as any).nodeName === 'string') {
                        if (isElement(k, (k as any).nodeName) && pred(k)) {
                                continue; // drop it
                        }
                }
                kept.push(k);
        }
        (root as any).childNodes = kept;

        // Recurse.
        for (const k of kept) removeNodesRecursive(k, pred);
}

function bodyInnerHtmlFromTree(bodyEl: DefaultTreeElement): string {
        // IMPORTANT: do NOT use textContent. We serialize the body children as HTML.
        const fragment: any = {
                nodeName: '#document-fragment',
                childNodes: childNodes(bodyEl)
        };
        return serialize(fragment).trim();
}

// --- Main ---

export function splitHtmlForGrapes(fullHtml: string): GrapesInput {
        const doc = parse(fullHtml) as DefaultTreeDocument;

        const headEl = findFirst(doc as any, (n) => isElement(n, 'head')) as DefaultTreeElement | null;
        const bodyEl = findFirst(doc as any, (n) => isElement(n, 'body')) as DefaultTreeElement | null;

        // 1) CSS from <style> in <head>
        const styleNodes = headEl ? (findAll(headEl, (n) => isElement(n, 'style')) as DefaultTreeElement[]) : [];
        const cssText = styleNodes
                .map((el) => extractStyleText(el).trim())
                .filter(Boolean)
                .join('\n\n')
                .trim();

        // 2) Remove "annoying" <script> tags from body (and optionally head)
        //    You can tune the predicate later (e.g. keep scripts with data-keep="1").
        const isAnnoyingScript = (el: DefaultTreeElement) => {
                if (!isElement(el, 'script')) return false;
                const attrs = ((el as any).attrs ?? []) as Array<{ name: string; value: string }>;
                const src = attrs.find((a) => a.name === 'src')?.value ?? '';
                // Typical cases to remove for Grapes/VSCode preview split:
                // - dev entry scripts pointing to /src/...
                // - module scripts you don't want Grapes to execute
                const type = attrs.find((a) => a.name === 'type')?.value ?? '';
                if (type === 'module') return true;
                if (src.startsWith('/src/') || src.includes('vite') || src.includes('@vite')) return true;
                return false;
        };

        if (bodyEl) removeNodesRecursive(bodyEl, isAnnoyingScript);
        if (headEl) removeNodesRecursive(headEl, isAnnoyingScript);

        // 3) Serialize body attrs and inner html
        const bodyAttrs = bodyEl ? attrsToString(bodyEl) : '';
        const bodyInnerHtml = bodyEl ? bodyInnerHtmlFromTree(bodyEl) : fullHtml.trim();

        return { cssText, bodyInnerHtml, bodyAttrs };
}
