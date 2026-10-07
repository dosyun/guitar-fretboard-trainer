import ts from 'typescript';
import { dictionary } from './index';

// Localize presentation literals before Vite compiles JSX. Types, property names,
// and the persisted practice model remain untouched. The source-language text
// is the dictionary key, so a new UI string is caught by the coverage test.
export function localizeSource(source: string, fileName: string) {
  const file = ts.createSourceFile(fileName, source, ts.ScriptTarget.Latest, true,
    fileName.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
  const messages = new Set<string>();
  // \u301c (U+301C) \u306f\u7bc4\u56f2\u8868\u8a18\uff080\u301c12F\uff09\u306b\u4f7f\u3046\u305f\u3081\u3001\u304b\u306a\u30fb\u6f22\u5b57\u3068\u540c\u3058\u304f\u7ffb\u8a33\u5bfe\u8c61\u306b\u3059\u308b
  const japanese = /[\u301c\u3040-\u30ff\u4e00-\u9fff]/;
  const needsTranslation = (key: string) => japanese.test(key) || (/[。＝]/.test(key) && key in dictionary.en);
  const normalize = (text: string) => text.trim().replace(/\s+/g, ' ');
  let used = false;

  function call(key: string, expressions: string[] = []) {
    messages.add(key);
    used = true;
    return `__gftText(${JSON.stringify(key)}${expressions.map((e) => ', ' + e).join('')})`;
  }

  function rewrite(node: ts.Node): string {
    const start = node.getStart(file);
    const original = source.slice(start, node.end);
    if (ts.isTypeNode(node) || ts.isImportDeclaration(node)) return original;
    // These level values are semantic IDs used by LEVEL_STYLE. Translate the
    // badge when rendering, rather than altering the IDs. fretBucket likewise
    // uses a display-like string as a lookup key; translate its diagnostic text.
    if (ts.isVariableDeclaration(node) && ['CHAPTER_LEVEL', 'fretBucket'].includes(node.name.getText(file))) return original;
    if (ts.isJsxText(node)) {
      const text = normalize(node.text);
      if (!needsTranslation(text)) return original;
      // Keep spaces around adjacent expressions (for example, counts and units).
      const leading = /^[ \t]/.test(node.text) ? ' ' : '';
      const trailing = /[ \t]$/.test(node.text) ? ' ' : '';
      return `${leading}{${call(text)}}${trailing}`;
    }
    if (ts.isTemplateExpression(node)) {
      const key = node.head.text + node.templateSpans.map((span, i) => `{${i}}${span.literal.text}`).join('');
      if (needsTranslation(key)) return call(key, node.templateSpans.map((span) => rewrite(span.expression)));
    }
    if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
      const isName = ts.isPropertyAssignment(node.parent) && node.parent.name === node;
      if (!isName && needsTranslation(node.text)) {
        const translated = call(node.text);
        return ts.isJsxAttribute(node.parent) ? `{${translated}}` : translated;
      }
    }
    const edits: { start: number; end: number; text: string }[] = [];
    ts.forEachChild(node, (child) => {
      const text = rewrite(child);
      if (text !== source.slice(child.getStart(file), child.end)) {
        edits.push({ start: child.getStart(file), end: child.end, text });
      }
    });
    let result = original;
    for (const edit of edits.reverse()) {
      result = result.slice(0, edit.start - start) + edit.text + result.slice(edit.end - start);
    }
    return result;
  }

  const code = rewrite(file);
  return {
    code: used ? `import { t as __gftText } from '/src/i18n/index.ts';\n${code}` : source,
    messages: [...messages],
  };
}
