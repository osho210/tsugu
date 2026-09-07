import { extname, resolve } from 'node:path';
import { registerHooks } from 'node:module';
import { pathToFileURL } from 'node:url';

const distRoot = resolve(import.meta.dirname, 'dist');
const runtimeExtensions = new Set(['.js', '.mjs', '.cjs', '.json', '.node']);

function withRuntimeExtension(specifier) {
  return runtimeExtensions.has(extname(specifier)) ? specifier : `${specifier}.js`;
}

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith('@/')) {
      const relativePath = specifier.slice(2);
      const resolvedUrl = pathToFileURL(
        resolve(distRoot, withRuntimeExtension(relativePath)),
      ).href;

      return nextResolve(resolvedUrl, context);
    }

    if (
      context.parentURL?.startsWith(pathToFileURL(distRoot).href) &&
      (specifier.startsWith('./') || specifier.startsWith('../'))
    ) {
      return nextResolve(
        new URL(withRuntimeExtension(specifier), context.parentURL).href,
        context,
      );
    }

    return nextResolve(specifier, context);
  },
});
