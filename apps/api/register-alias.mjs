import { extname, resolve } from 'node:path';
import { registerHooks } from 'node:module';
import { pathToFileURL } from 'node:url';

const distRoot = resolve(import.meta.dirname, 'dist');

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (!specifier.startsWith('@/')) {
      return nextResolve(specifier, context);
    }

    const relativePath = specifier.slice(2);
    const emittedPath = extname(relativePath) === '' ? `${relativePath}.js` : relativePath;
    const resolvedUrl = pathToFileURL(resolve(distRoot, emittedPath)).href;

    return nextResolve(resolvedUrl, context);
  },
});
