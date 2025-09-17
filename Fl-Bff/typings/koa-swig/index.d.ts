declare module "koa-swig" {
  import { Context } from "koa";

  interface KoaSwigOptions {
    /**
     * Views root directory
     * @default 'views'
     */
    root?: string;

    /**
     * Cache control, 'memory' or false
     * @default 'memory'
     */
    cache?: "memory" | false;

    /**
     * Default extension for your views
     * @default 'html'
     */
    ext?: string;

    /**
     * Whether to automatically write rendered result to ctx.body
     * @default true
     */
    writeBody?: boolean;

    /**
     * Whether to autoescape template variables
     * @default true
     */
    autoescape?: boolean;

    /**
     * Template variables that are always available
     */
    locals?: { [key: string]: any };

    /**
     * Custom filters for swig
     */
    filters?: {
      [name: string]: (...args: any[]) => any;
    };

    /**
     * Custom tags for swig
     */
    tags?: {
      [name: string]: {
        parse: (...args: any[]) => any;
        compile: (...args: any[]) => any;
        ends: boolean;
        blockLevel: boolean;
      };
    };

    /**
     * Custom extensions for swig
     */
    extensions?: {
      [name: string]: any;
    };

    /**
     * Variable control tokens
     */
    varControls?: [string, string];

    /**
     * Tag control tokens
     */
    tagControls?: [string, string];

    /**
     * Comment control tokens
     */
    cmtControls?: [string, string];
  }

  interface RenderedSwig {
    /**
     * Set local variables
     */
    setLocals(args: { [key: string]: any }): void;

    /**
     * Get local variable by key
     */
    getLocals(key: string): any;
  }

  interface SwigRenderer {
    (view: string, options?: { [key: string]: any }): Promise<string>;
  }

  interface KoaSwigRenderer {
    (settings?: KoaSwigOptions): (
      ctx: Context
    ) => Generator<Promise<string>, void, unknown>;
  }

  const renderer: KoaSwigRenderer & {
    swig: RenderedSwig;
  };

  export = renderer;
}
