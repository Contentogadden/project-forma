import { readdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import prettier from '../frontend/node_modules/prettier/index.mjs';
import tsPlugin from '../frontend/node_modules/prettier/plugins/typescript.mjs';
import babelPlugin from '../frontend/node_modules/prettier/plugins/babel.mjs';
import javaPlugin from '../frontend/node_modules/prettier-plugin-java/dist/index.mjs';
import ts from '../frontend/node_modules/typescript/lib/typescript.js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const check = process.argv.includes('--check');
const clean = process.argv.includes('--clean');
const sourceRoots = ['frontend/src', 'frontend/tests', 'src/main/java', 'src/test/java', 'scripts'];
const extensions = new Set(['.ts', '.tsx', '.mjs', '.css', '.java']);

async function organizeImports() {
  const files = (await filesIn(join(root, 'frontend/src'))).filter((file) => /\.tsx?$/.test(file));
  const options = {
    module: ts.ModuleKind.ESNext,
    jsx: ts.JsxEmit.ReactJSX,
    target: ts.ScriptTarget.ES2022,
  };
  const service = ts.createLanguageService({
    getCompilationSettings: () => options,
    getScriptFileNames: () => files,
    getScriptVersion: () => '0',
    getScriptSnapshot: (file) => {
      const source = ts.sys.readFile(file);
      return source === undefined ? undefined : ts.ScriptSnapshot.fromString(source);
    },
    getCurrentDirectory: () => join(root, 'frontend'),
    getDefaultLibFileName: ts.getDefaultLibFilePath,
    fileExists: ts.sys.fileExists,
    readFile: ts.sys.readFile,
    readDirectory: ts.sys.readDirectory,
  });
  for (const file of files) {
    const edits = service.organizeImports({ type: 'file', fileName: file }, {}, {});
    let source = await readFile(file, 'utf8');
    for (const edit of edits
      .flatMap((change) => change.textChanges)
      .sort((a, b) => b.span.start - a.span.start)) {
      source =
        source.slice(0, edit.span.start) +
        edit.newText +
        source.slice(edit.span.start + edit.span.length);
    }
    await writeFile(file, source);
  }
  service.dispose();
}

async function filesIn(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await filesIn(path)));
    else if (extensions.has(extname(path))) files.push(path);
  }
  return files;
}

function withoutComments(parser, java = false) {
  return {
    ...parser,
    async parse(...args) {
      const ast = await parser.parse(...args);
      ast.comments = (ast.comments ?? []).filter((comment) =>
        /@license|@preserve|<reference|@ts-|sourceMappingURL/.test(
          java ? comment.value : (comment.value ?? ''),
        ),
      );
      return ast;
    },
  };
}

function splitDeclarations(source, path) {
  const ast = ts.createSourceFile(path, source, ts.ScriptTarget.Latest, true);
  const edits = [];
  function visit(node) {
    if (ts.isVariableStatement(node) && node.declarationList.declarations.length > 1) {
      const list = node.declarationList;
      const keyword =
        list.flags & ts.NodeFlags.Const ? 'const' : list.flags & ts.NodeFlags.Let ? 'let' : 'var';
      const modifiers = node.modifiers?.map((modifier) => modifier.getText(ast)).join(' ') ?? '';
      const prefix = modifiers ? `${modifiers} ${keyword}` : keyword;
      const text = list.declarations
        .map((declaration) => `${prefix} ${declaration.getText(ast)};`)
        .join('\n');
      edits.push({ start: node.getStart(ast), end: node.end, text });
    } else ts.forEachChild(node, visit);
  }
  visit(ast);
  for (const edit of edits.sort((a, b) => b.start - a.start)) {
    source = source.slice(0, edit.start) + edit.text + source.slice(edit.end);
  }
  return source;
}

const parsers = {
  typescript: withoutComments(tsPlugin.parsers.typescript),
  babel: withoutComments(babelPlugin.parsers.babel),
  java: withoutComments(javaPlugin.parsers.java, true),
};
let changed = 0;
let inspected = 0;
if (clean && !check) await organizeImports();
for (const sourceRoot of sourceRoots) {
  for (const path of await filesIn(join(root, sourceRoot))) {
    const original = await readFile(path, 'utf8');
    const extension = extname(path);
    const source =
      clean && ['.ts', '.tsx', '.mjs'].includes(extension)
        ? splitDeclarations(original, path)
        : original;
    const config = await prettier.resolveConfig(path);
    const plugins = clean ? [...config.plugins, { parsers }] : config.plugins;
    const formatted = await prettier.format(source, { ...config, plugins, filepath: path });
    inspected++;
    if (formatted !== original) {
      changed++;
      if (!check) await writeFile(path, formatted);
      else console.error(path.slice(root.length + 1));
    }
  }
}
console.log(`${inspected} files checked, ${changed} ${check ? 'need formatting' : 'updated'}`);
if (check && changed) process.exitCode = 1;
