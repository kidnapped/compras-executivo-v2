import path from "path"
import { fileURLToPath } from "url"

import TerserPlugin from "terser-webpack-plugin"
import CssMinimizerPlugin from "css-minimizer-webpack-plugin"
import CopyWebpackPlugin from "copy-webpack-plugin"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export default {
    mode: "production",
    cache: false,
    entry: "./app/static/js/app.js",
    output: {
        filename: "bundle.js",
        path: path.resolve(__dirname, "app/static/dist"),
        clean: true,
    },
    module: {
        rules: [
            {
                test: /\.css$/i,
                use: [
                    "style-loader",
                    {
                        loader: "css-loader",
                        options: {
                            url: {
                                filter: (url) => {
                                    return !url.startsWith("/static/")
                                },
                            },
                        },
                    },
                ],
            },
            {
                test: /\.(woff|woff2|eot|ttf|otf)$/i,
                type: "asset/resource",
                generator: {
                    filename: "fonts/[name][ext]",
                },
            },
        ],
    },
    optimization: {
        minimize: true,
        minimizer: [new TerserPlugin(), new CssMinimizerPlugin()],
    },
    plugins: [
        new CopyWebpackPlugin({
            patterns: [
                {
                    from: path.resolve(__dirname, "app/static/fonts"),
                    to: "fonts",
                },
            ],
        }),
    ],
    devtool: "source-map",
    performance: {
        hints: false,
    },
}
