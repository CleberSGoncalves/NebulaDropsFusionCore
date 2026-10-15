export default {
  base: './', // Mandatory for CrazyGames - strictly relative asset paths
  server: {
    port: 3015,
    host: true
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    minify: 'esbuild',
    rollupOptions: {
      output: {
        manualChunks: undefined
      }
    }
  }
};
