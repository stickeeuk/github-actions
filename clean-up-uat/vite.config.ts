/** @type {import('vite').UserConfig} */
export default {
  build: {
    target: 'esnext',
    rollupOptions: {
      output: {
        entryFileNames: "[name].mjs",
      },
    },
  },
}
