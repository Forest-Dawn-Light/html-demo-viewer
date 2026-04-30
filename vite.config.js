import { defineConfig } from 'vite';
import { copyFileSync, mkdirSync, readdirSync, statSync, existsSync } from 'fs';
import { join } from 'path';

function copyDirSync(src, dest) {
  if (!existsSync(src)) return;
  mkdirSync(dest, { recursive: true });
  for (const entry of readdirSync(src)) {
    const srcPath = join(src, entry);
    const destPath = join(dest, entry);
    if (statSync(srcPath).isDirectory()) {
      copyDirSync(srcPath, destPath);
    } else {
      copyFileSync(srcPath, destPath);
    }
  }
}

/** Copy the demos/ folder into dist/ after each build */
function copyDemosPlugin() {
  return {
    name: 'copy-demos',
    apply: 'build',
    closeBundle() {
      copyDirSync('demos', 'dist/demos');
      console.log('[copy-demos] demos/ → dist/demos/');
    },
  };
}

export default defineConfig({
  plugins: [copyDemosPlugin()],
});
