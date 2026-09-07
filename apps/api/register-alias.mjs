import { existsSync } from 'node:fs';
import { extname, resolve } from 'node:path';
import { registerHooks } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';

const distRoot = resolve(import.meta.dirname, 'dist');
const distRootUrl = pathToFileURL(distRoot).href;
const runtimeExtensions = new Set(['.js', '.mjs', '.cjs', '.json', '.node']);

function resolveRuntimePath(candidatePath) {
  if (runtimeExtensions.has(extname(candidatePath))) {
    return candidatePath;
  }

  const fileCandidate = `${candidatePath}.js`;
  if (existsSync(fileCandidate)) {
    return fileCandidate;
  }

  const indexCandidate = resolve(candidatePath, 'index.js');
  if (existsSync(indexCandidate)) {
    return indexCandidate;
  }

  return fileCandidate;
}

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith('@/')) {
      const relativePath = specifier.slice(2);
      const resolvedPath = resolveRuntimePath(resolve(distRoot, relativePath));

      return nextResolve(pathToFileURL(resolvedPath).href, context);
    }

    if (
      context.parentURL?.startsWith(distRootUrl) &&
      (specifier.startsWith('./') || specifier.startsWith('../'))
    ) {
      const candidatePath = fileURLToPath(new URL(specifier, context.parentURL));
      const resolvedPath = resolveRuntimePath(candidatePath);

      return nextResolve(pathToFileURL(resolvedPath).href, context);
    }

    return nextResolve(specifier, context);
  },
});
