export interface Lib {
  importTest?: RegExp;
  /**
   * Dependent library name
   */
  libraryName: string;
  /**
   * Custom imported component style conversion
   */
  resolveStyle?: (name: string) => string;

  /**
   * There may be some component libraries that are not very standardized.
   * You can turn on this to ignore to determine whether the file exists. Prevent errors when importing non-existent css files.
   * Performance may be slightly reduced after it is turned on, but the impact is not significant
   * @default: false
   */
  ensureStyleFile?: boolean;

  /**
   * Customize imported component file name style conversion
   * @default: paramCase
   */
  libraryNameChangeCase?: LibraryNameChangeCase;
  /**
   * Whether to introduce base style
   */
  base?: string;
}

export type VitePluginOptions = Lib | Lib[];

export interface Source {
  opts: { libs: Lib[]; cacheDir: string };
}

export type LibraryNameChangeCase = ChangeCaseType | ((name: string) => string);

export type ChangeCaseType =
  | 'camelCase'
  | 'capitalCase'
  | 'constantCase'
  | 'dotCase'
  | 'headerCase'
  | 'noCase'
  | 'paramCase'
  | 'pascalCase'
  | 'pathCase'
  | 'sentenceCase'
  | 'snakeCase';
