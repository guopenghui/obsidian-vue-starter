import esbuild from "esbuild";
import fs from "fs";
import path from "path";
import crypto from "crypto";

import * as sfc from "@vue/compiler-sfc";
import { transform } from "@babel/core";
import vue3Jsx from "@vue/babel-plugin-jsx";
import TS from "@babel/plugin-syntax-typescript";

function getUrlParams(search) {
    let hashes = search.slice(search.indexOf('?') + 1).split('&');
    return hashes.reduce((params, hash) => {
        let [key, val] = hash.split('=');
        return Object.assign(params, { [key]: decodeURIComponent(val) });
    }, {});
}

function getFullPath(args) {
    return path.isAbsolute(args.path) ? args.path : path.join(args.resolveDir, args.path);
}

class AsyncCache {
    store = new Map();

    constructor(enabled = true) { }

    get(key, fn) {
        if (!this.enabled) {
            return fn();
        }

        let val = this.store.get(key);
        if (!val) {
            return fn().then(o => (this.store.set(key, o), o));
        }

        return val;
    }
}

async function transformVue3(code, id, options) {
    const transformOptions = {
        babelrc: false,
        configFile: false,
        plugins: [[vue3Jsx, options]],
        sourceMaps: options.sourceMap,
        sourceFileName: id,
    };
    // if (/\.tsx?$/.test(id)) {
    transformOptions.plugins.push([TS, { isTSX: true }]);
    // }

    const result = transform(code, transformOptions);
    if (!result.code) return;

    return {
        code: result.code,
        map: result.map,
    };
}


function plugin(opts = {}) {
    return {
        name: "my-esbuild-plugin",
        async setup({ initialOptions: buildOpts, ...build }) {
            const cache = new AsyncCache(true);
            const transforms = {};
            build.onResolve(
                { filter: /\.vue/ },
                async (args) => {
                    let params = getUrlParams(args.path);
                    return {
                        path: getFullPath(args),
                        namespace: (params.type === "script" ? "sfc-script"
                            : params.type === "style" ? "sfc-style"
                                : params.type === "template" ? "sfc-template" : "file"),
                        pluginData: {
                            ...args.pluginData,
                            index: params.index
                        }
                    };
                }
            );

            build.onLoad({ filter: /\.tsx$/ }, (args) => cache.get([args.path, args.namespace], async () => {
                const source = await fs.promises.readFile(args.path, "utf-8");
                let res = await transformVue3(source, "", {});
                if (!res?.code) {
                    return source;
                }
                return {
                    contents: res.code,
                    resolveDir: path.dirname(args.path),
                    watchFiles: [args.path]
                };

            }));

            build.onLoad({ filter: /\.vue$/ }, (args) => cache.get([args.path, args.namespace], async () => {
                const encPath = args.path.replace(/\\/g, "\\\\");
                const source = await fs.promises.readFile(args.path, "utf-8");
                const filename = path.join(process.cwd(), args.path);

                const id = !opts.scopeId || opts.scopeId === "hash"
                    ? crypto.createHash("md5").update(filename).digest().toString("hex").substring(0, 8)
                    : random(4).toString("hex");

                const { descriptor } = sfc.parse(source, {
                    filename
                });
                const script = (descriptor.script || descriptor.scriptSetup) ? sfc.compileScript(descriptor, { id }) : undefined;

                const dataId = "data-v-" + id;
                let code = "";

                if (descriptor.script || descriptor.scriptSetup) {
                    code += `import script from "${encPath}?type=script";`;
                } else {
                    code += "const script = {};";
                }

                for (const style in descriptor.styles) {
                    code += `import "${encPath}?type=style&index=${style}";`;
                }

                const renderFuncName = opts.renderSSR ? "ssrRender" : "render";

                code += `import { ${renderFuncName} } from "${encPath}?type=template"; script.${renderFuncName} = ${renderFuncName};`;

                code += `script.__file = ${JSON.stringify(filename)};`;
                if (descriptor.styles.some(o => o.scoped)) {
                    code += `script.__scopeId = ${JSON.stringify(dataId)};`;
                }
                if (opts.renderSSR) {
                    code += "script.__ssrInlineRender = true;";
                }

                code += "export default script;";

                return {
                    contents: code,
                    resolveDir: path.dirname(args.path),
                    pluginData: { descriptor, id: dataId, script },
                    watchFiles: [args.path]
                };
            }));

            build.onLoad({ filter: /.*/, namespace: "sfc-template" }, (args) => cache.get([args.path, args.namespace], async () => {
                const { descriptor, id, script } = args.pluginData;
                if (!descriptor.template) {
                    throw new Error("Missing template");
                }

                let source = descriptor.template.content;
                const result = sfc.compileTemplate({
                    id,
                    source,
                    filename: args.path,
                    scoped: descriptor.styles.some(o => o.scoped),
                    slotted: descriptor.slotted,
                    ssr: opts.renderSSR,
                    ssrCssVars: [],
                    isProd: (process.env.NODE_ENV === "production") || buildOpts.minify || opts.isProd,
                    compilerOptions: {
                        inSSR: opts.renderSSR,
                        directiveTransforms: transforms,
                        bindingMetadata: script?.bindings
                    }
                });

                if (result.errors.length > 0) {
                    return {
                        errors: result.errors.map < esbuild.PartialMessage > (o => typeof o === "string" ? { text: o } : {
                            text: o.message,
                            location: o.loc && {
                                column: o.loc.start.column,
                                file: descriptor.filename,
                                line: o.loc.start.line + descriptor.template.loc.start.line + 1,
                                lineText: o.loc.source
                            }
                        })
                    };
                }

                return {
                    contents: result.code,
                    warnings: result.tips.map(o => ({ text: o })),
                    loader: "jsx",
                    resolveDir: path.dirname(args.path),
                };


            }));
            build.onLoad({ filter: /.*/, namespace: "sfc-script" }, (args) => cache.get([args.path, args.namespace], async () => {
                const { script } = args.pluginData;

                if (script) {
                    let code = script.content;

                    if (buildOpts.sourcemap && script.map) {
                        const sourceMap = Buffer.from(JSON.stringify(script.map)).toString("base64");

                        code += "\n\n//@ sourceMappingURL=data:application/json;charset=utf-8;base64," + sourceMap;
                    }
                    if (script.lang === "tsx") {
                        let res = await transformVue3(code, "", {});
                        code = res.code;
                    }
                    return {
                        contents: code,
                        loader: script.lang === "ts" ? "ts" : "js",
                        resolveDir: path.dirname(args.path),
                    };
                }
            }));

            build.onLoad({ filter: /.*/, namespace: "sfc-style" }, (args) => cache.get([args.path, args.namespace], async () => {
                const { descriptor, index, id } = args.pluginData;

                const style = descriptor.styles[index];
                let includedFiles = [];

                const result = await sfc.compileStyleAsync({
                    filename: args.path,
                    id,
                    source: style.content,
                    postcssOptions: opts.postcss?.options,
                    postcssPlugins: opts.postcss?.plugins,
                    preprocessLang: style.lang,
                    preprocessOptions: {
                        includePaths: [
                            path.dirname(args.path)
                        ],
                        importer: [
                            (url) => {
                                const modulePath = path.join(process.cwd(), "node_modules", url);

                                if (fs.existsSync(modulePath)) {
                                    return { file: modulePath };
                                }

                                return null;
                            },
                            (url) => ({ file: replaceRules(url) })
                        ]
                    },
                    scoped: style.scoped,
                });

                if (result.errors.length > 0) {
                    const errors = result.errors;

                    return {
                        errors: errors.map(o => ({
                            text: o.message,
                            location: {
                                column: o.column,
                                line: o.file === args.path ? style.loc.start.line + o.line - 1 : o.line,
                                file: o.file.replace(/\?.*?$/, ""),
                                namespace: "file"
                            }
                        }))
                    };
                }

                return {
                    contents: result.code,
                    loader: "css",
                    resolveDir: path.dirname(args.path),
                    watchFiles: includedFiles
                };
            }));
        }
    };
}

export {
    plugin as default,
};