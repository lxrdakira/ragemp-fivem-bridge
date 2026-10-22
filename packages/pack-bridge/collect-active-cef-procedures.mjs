// Production Webpack replaces imported executeServer with `(0,module.fn)`.
// A name merely occurring in the bundle is insufficient: another component
// might send that same name to the client instead of the server.
export function collectActiveCefServerProcedures(sources, bundle) {
  const sourceExecuteServerNames = new Set();
  for (const source of sources) {
    const withoutComments = source
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/^\s*\/\/.*$/gm, "");
    for (const match of withoutComments.matchAll(/\bexecuteServer\(\s*["']([^"']+)["']/g)) {
      sourceExecuteServerNames.add(match[1]);
    }
  }

  // Binds-SetKey is a live imported executeServer call in the current UI.
  // Use it to resolve Webpack's minified export name, and fail rather than
  // silently omit all imported calls if the generated shape changes.
  const importedExport = /\(0,\s*[A-Za-z_$][\w$]*\.([A-Za-z_$][\w$]*)\)\(\s*["']Binds-SetKey["']/.exec(bundle)?.[1];
  if (!sourceExecuteServerNames.has("Binds-SetKey") || !importedExport) {
    throw new Error("cannot identify production executeServer calls; update the CEF contract extractor");
  }

  const procedures = new Set();
  const importedCall = new RegExp(`\\(0,\\s*[A-Za-z_$][\\w$]*\\.${importedExport}\\)\\(\\s*["']([^"']+)["']`, "g");
  for (const match of bundle.matchAll(importedCall)) {
    if (sourceExecuteServerNames.has(match[1])) procedures.add(match[1]);
  }
  for (const match of bundle.matchAll(/\.callServer\(\s*["']([^"']+)["']/g)) {
    procedures.add(match[1]);
  }
  return procedures;
}
