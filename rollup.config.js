const { join } = require("path");
const buble = require("rollup-plugin-buble");
const babel = require("rollup-plugin-babel");
const cjs = require("rollup-plugin-commonjs");
const { terser } = require("rollup-plugin-terser");
const resolve = require("rollup-plugin-node-resolve");
const typescript = require("rollup-plugin-typescript2");

const isProduction = process.env.NODE_ENV === "production";
const cwd = __dirname;

/**
 * @type {import("rollup").RollupOptions}
 */
const baseConfig = {
    "input": join(cwd, "src/index.ts"),
    "output": [
        {
            "file": join(cwd, "dist/index.js")
            , "format": "cjs"
            , "sourcemap": true
            , "exports": "named"
        }
    ]
    , "external": ["@x-drive/utils"]
    , "plugins": [
        resolve({
            "preferBuiltins": false
        })
        , cjs()
        , babel({
            "babelrc": false
            ,"presets": [
                ["@babel/preset-env", {
                    "modules": false
                }]
            ]
        })
        , typescript({
            "tsconfigOverride": {
                "compilerOptions": {
                    "preserveConstEnums": true
                }
            }
        })
        ,buble()
    ]
}

const esmConfig = Object.assign({}, baseConfig, {
    output: Object.assign({}, baseConfig.output, {
        "sourcemap": true
        ,"format": "es"
        ,"file": join(cwd, "dist/index.esm.js")
    })
    ,"external": ["@x-drive/utils"]
    ,"plugins": [
        babel({
            "babelrc": false,
            "presets": [
                ['@babel/preset-env', {
                    "modules": false
                }]
            ]

        })
        ,typescript()
    ]
})

function rollup() {
    const target = process.env.TARGET

    if (target === "umd") {
        return baseConfig
    } else if (target === "esm") {
        return esmConfig
    } else {
        return [baseConfig, esmConfig]
    }
}
module.exports = rollup()
