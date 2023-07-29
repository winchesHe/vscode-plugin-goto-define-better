export function transformRegKey(str: string) {
  return str.replace('$', '\\$')
}
