const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");

module.exports = [{
    entry: {
        client: "./src/client/index.tsx",
    },
    target: "web",
    mode: "development",
    output: {
        path: path.resolve(__dirname, "build", "public"),
        filename: "[name].bundle.js",
    },
    resolve: {
        extensions: [".js", ".jsx", ".json", ".ts", ".tsx"],
    },
    module: {
        rules: [
            {
                test: /\.(ts|tsx)$/,
                loader: "awesome-typescript-loader",
            },
            {
                enforce: "pre",
                test: /\.js$/,
                loader: "source-map-loader",
            },
            {
                test: /\.css$/,
                loader: "css-loader",
            },
        ],
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: path.resolve(__dirname, "src", "client", "index.html"),
            filename: "./index.html"
        })
    ],
}];