const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
    mode: 'production',
    entry: './app/static/js/app.js',
    output: {
        filename: 'bundle.js',
        path: path.resolve(__dirname, 'app/static/dist'),
        clean: true, // Limpa dist/ antes de cada build
    },
    module: {
        rules: [
            {
                test: /\.css$/i,
                use: [
                    'style-loader',
                    {
                        loader: 'css-loader',
                        options: {
                            url: {
                                filter: (url, resourcePath) => {
                                    // Permite manter URLs absolutas sem erro
                                    return !url.startsWith('/static/');
                                }
                            }
                        }
                    }
                ]
            },
            {
                test: /\.(woff|woff2|eot|ttf|otf)$/i,
                type: 'asset/resource',
                generator: {
                    filename: 'fonts/[name][ext]',
                },
            },
        ],
    },
    optimization: {
        minimize: true,
        minimizer: [
            new TerserPlugin(),
            new CssMinimizerPlugin(),
        ],
    },
    plugins: [
        new CopyWebpackPlugin({
            patterns: [
                {
                    from: path.resolve(__dirname, 'app/static/fonts'),
                    to: 'fonts',
                },
            ],
        }),
    ],
    devtool: 'source-map',
    performance: {
        hints: false
    }
};
