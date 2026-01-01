function buildContext(results) {
  return results
    .map((r, i) => `${i + 1}. ${r.content}`)
    .join('\n\n');
}
