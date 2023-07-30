export function transformRegKey(str: string) {
  return str.replace('$', '\\$')
}

export function transformEndLineKey(str: string) {
  return str.replace(/\n\r|\n|\r/, '')
}
