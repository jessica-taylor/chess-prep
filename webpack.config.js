
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { performance} = require('perf_hooks');
global.performance = performance;


const mode = process.env.NODE_ENV || 'development';
const prod = mode === 'production';

module.exports = {
  entry: './src/index.ts',
  mode: 'development',
  module: {
    rules: [

      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },

			{
				test: /\.svelte$/,
				use: {
					loader: 'svelte-loader',
					options: {
						compilerOptions: {
							dev: !prod
						},
						emitCss: prod,
						hotReload: !prod
					}
				}
			},
      // {
      //   // required to prevent errors from Svelte on Webpack 5+, omit on Webpack 4
      //   test: /node_modules\/svelte\/.*\.mjs$/,
      //   resolve: {
      //     fullySpecified: false
      //   }
      // }
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js', '.svelte'],
    alias: {
      svelte: path.resolve('node_modules', 'svelte/src/runtime') // Svelte 3: path.resolve('node_modules', 'svelte')
    },
    mainFields: ['svelte', 'browser', 'module', 'main'],
    conditionNames: ['svelte', 'browser', 'import']
  },
  output: {
    filename: 'index.js',
    path: path.resolve(__dirname, 'dist'),
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: 'static/index.html',
    }),
  ],
  devServer: {
    static: {
      directory: path.join(__dirname, 'static'),
    },
    compress: true,
    port: 9000,
  },
};
