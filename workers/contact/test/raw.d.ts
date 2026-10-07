// Vite's ?raw import returns a file's text. Used to read wrangler.toml in tests.
declare module '*?raw' {
  const content: string;
  export default content;
}
