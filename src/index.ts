import type { Plugin, ResolvedConfig } from 'vite';
import type { ImportSpecifier } from 'es-module-lexer';
import type { ChangeCaseType, VitePluginOptions, LibraryNameChangeCase, Lib } from './types';
import * as changeCase from 'change-case';
import { init, parse } from 'es-module-lexer';
import { fileExists, isFunction, resolveNodeModules } from './shared';

const asRE = /\s+as\s+\w+,?/g;

export default function createImportPlugin(options: VitePluginOptions): Plugin {
  const libs = Array.isArray(options) ? options : [options];
  const libMap: Map<string, Lib> = new Map();
  libs.forEach((item) => {
    libMap.set(item.libraryName, item);
  });
  let viteConfig: ResolvedConfig;
  let needSourcemap = false;

  return {
    name: 'vitejs:importer',
    async configResolved(resolvedConfig) {
      // store the resolved config
      viteConfig = resolvedConfig;
      needSourcemap = !!viteConfig.build?.sourcemap;
    },
    async transform(code) {
      if (!code || !needTransform(code, libs)) {
        return null;
      }

      await init;
      let handledCode = code;
      let imports: readonly ImportSpecifier[] = [];
      try {
        imports = parse(code)[0];
      } catch (e) {
        console.error(e);
      }
      if (!imports.length) {
        return null;
      }

      for (const importer of imports) {
        const { n, se, ss } = importer;
        if (!n) continue;

        const lib = libMap.get(n);
        if (!lib) continue;

        const importStr = code.slice(ss, se);

        let importVariables = transformImportVar(importStr);

        importVariables = filterImportVariables(importVariables, lib.importTest);

        const importCssStrList = await transformComponentCss(lib, importVariables, viteConfig);

        const { base = '' } = lib;

        let baseImporter = base ? `\nimport '${base}';` : '\n';

        if (code.includes(base)) {
          baseImporter = '\n';
        }
        importCssStrList.unshift(baseImporter);
        handledCode = handledCode.replace(new RegExp(importStr, 'ig'), importStr + importCssStrList.join(''));
      }
      return {
        map: needSourcemap ? this.getCombinedSourcemap() : null,
        code: handledCode,
      };
    },
  };
}

function filterImportVariables(importVars: readonly string[], reg?: RegExp) {
  if (!reg) {
    return importVars;
  }
  return importVars.filter((item) => reg.test(item));
}

// Generate the corresponding component css string array
async function transformComponentCss(lib: Lib, importVariables: readonly string[], viteConfig: ResolvedConfig) {
  const { libraryName, resolveStyle, libraryNameChangeCase = 'paramCase', ensureStyleFile = false } = lib;

  const ensureStyleFileFound = ensureStyleFile || viteConfig.command === 'build';

  if (!isFunction(resolveStyle) || !libraryName) {
    return [];
  }
  const set = new Set<string>();
  for (const importVariable of importVariables) {
    const name = getChangeCaseFileName(importVariable, libraryNameChangeCase);

    let importStr = resolveStyle(name);

    if (!importStr) {
      continue;
    }
    importStr = resolveNodeModules(importStr);
    let isAdd = true;
    if (ensureStyleFileFound) {
      isAdd = fileExists(importStr);
    }

    isAdd && set.add(`import '${importStr}';\n`);
  }

  return Array.from(set);
}

// Extract import variables
function transformImportVar(importStr: string) {
  if (!importStr) {
    return [];
  }

  const exportStr = importStr.replace('import', 'export').replace(asRE, ',');
  let importVariables: readonly string[] = [];
  try {
    importVariables = parse(exportStr)[1].map((item) => item.n);
  } catch (error) {
    console.error(error);
  }
  return importVariables;
}

// File name conversion style
function getChangeCaseFileName(importedName: string, libraryNameChangeCase: LibraryNameChangeCase) {
  try {
    return changeCase[libraryNameChangeCase as ChangeCaseType](importedName);
  } catch (error) {
    return importedName;
  }
}

function needTransform(code: string, libs: Lib[]) {
  return !libs.every(({ libraryName }) => {
    return !new RegExp(`('${libraryName}')|("${libraryName}")`).test(code);
  });
}
