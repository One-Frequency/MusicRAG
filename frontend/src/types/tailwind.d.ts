declare module '@tailwindcss/vite' {
  import { Plugin } from 'vite'

  function tailwindcss(options?: object): Plugin
  export default tailwindcss
}