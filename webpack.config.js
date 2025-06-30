import webpack from "webpack";
import path from "path"
import { fileURLToPath } from "url"

import dotenv from "dotenv"
import TerserPlugin from "terser-webpack-plugin"
import CssMinimizerPlugin from "css-minimizer-webpack-plugin"
import CopyWebpackPlugin from "copy-webpack-plugin"
import MiniCssExtractPlugin from "mini-css-extract-plugin";

dotenv.config()  // Carrega .env

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const isProd = process.env.ENVIRONMENT === "production"

export default {
    mode: isProd ? "production" : "development",
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
                    isProd ? MiniCssExtractPlugin.loader : "style-loader",
                    {
                        loader: "css-loader",
                        options: {
                            url: {
                                filter: (url) => !url.startsWith("/static/"),
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
        new webpack.DefinePlugin({
            'process.env.ENVIRONMENT': JSON.stringify(process.env.ENVIRONMENT || "development"),
        }),
        new MiniCssExtractPlugin({
            filename: "bundle.css",
        }),
    ],
    devtool: "source-map",
    performance: {
        hints: false,
    },
}
