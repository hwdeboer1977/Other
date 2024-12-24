# Custom made wallet extension for Chrome

- This is a custom made wallet extension for Chrome.
- It uses a random private key to derive the public key and wallet address.
- The wallet extension then shows the connected wallet address, chain and balance.
- The wallet extension allows for sending and receiving tokens.
  This version is not for production! The keys in chrome storage are not encrypted yet!

# How to run?

- npm init -y
- npm install ethereum-cryptography
- npm install --save-dev webpack webpack-cli babel-loader @babel/core @babel/preset-env
- npx webpack --config webpack.config.js
  This runs with Webpack, it bundles the JavaScript files into a single file that can be referenced in your HTML.
  The goal of bundling is to reduce the number of HTTP requests required to load your app and to optimize the loading process.
  This is particularly useful when you're dealing with large or modular codebases.

Note: Whenever you make changes to popup.js (or any other code that you’ve specified in your Webpack entry), you need to regenerate the popup.bundle.js file. This is because Webpack takes your source files (e.g., popup.js, any other JS files, styles, etc.), processes them (e.g., transpiling, bundling, minifying), and outputs a new popup.bundle.js file that reflects all the changes.

Regenerate after changes made:

- npx webpack --config webpack.config.js

# How to install in Chrome?

- go to chrome://extensions
- load unpacked ==> select folder (where code is located).
