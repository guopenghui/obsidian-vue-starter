## Develop your own plugins with Vue3


**Init steps**

1. Copy this directory to your `.obsidian\plugins` directory, and move into it.

2. Run `npm install` to install all the stuff you need, Including: 
   + vue
   + naive-ui: a component library for vue3
   + v-icon: an icon library for vue3
   + esbuild-plugin-vue3: let esbuild get the power to compile `.vue` files.

3. Run `npm run dev` to compile code and generate a `main.js`, which is the final product. Your `main.js` will be updated simultaneously with the change of your source code files.

If above steps work, you can turn on 'Vue Template' plugin. Click the *dice* like button on the left, a new tab will open on the right and says *"Hello,Developer!"*.