/**
 * @returns $_test --> \\$_test
 */
export function transformRegKey(str: string) {
  return str.replace('$', '\\$')
}

export function transformEndLineKey(str: string) {
  return str.replace(/\n\r|\n|\r/, '')
}

/**
 * @returns IfaceComponent --> iface-component
 */
export function transformComponentKey(str: string) {
  if (!str)
    return ''

  return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase()
}
