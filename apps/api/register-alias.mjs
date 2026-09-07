import { extname, resolve } from 'node:path';
import { registerHooks } from 'node:module';
import { pathToFileURL } from 'node:url';

const distRoot = resolve(import.meta.dirname, 'dist');

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith('@/')) {
      const relativePath = specifier.slice(2);
      const emittedPath = extname(relativePath) === '' ? `${relativePath}.js` : relativePath;
      const resolvedUrl = pathToFileURL(resolve(distRoot, emittedPath)).href;

      return nextResolve(resolvedUrl, context);
    }

    if (
      context.parentURL?.startsWith(pathToFileURL(distRoot).href) &&
      (specifier.startsWith('./') || specifier.startsWith('../')) &&
      extname(specifier) === ''
    ) {
      return nextResolve(new URL(`${specifier}.js`, context.parentURL).href, context);
    }

    return nextResolve(specifier, context);
  },
});
