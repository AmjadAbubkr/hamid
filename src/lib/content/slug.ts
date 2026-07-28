export function normalizeSlugInput(value: string) {
  return value.trimStart().replace(/\s+/g, "-");
}
