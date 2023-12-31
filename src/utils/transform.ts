/**
 * @returns $_test --> \\$_test
 */
export function transformRegKey(str: string) {
  return str.replace('$', '\\$')
}

export function transformEndLineKey(str: string) {
  return str.replace(/\r\n|\n|\r/, '')
}

/**
 * @returns IfaceComponent --> iface-component
 */
export function transformComponentKey(str: string) {
  if (!str)
    return ''

  return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase()
}

/**
 * @returns iface-component --> IfaceComponent
 */
export function transformUpperCamelCase(str: string) {
  if (!str)
    return ''
  const parts = str.split('-')
  return parts.map(word => word.charAt(0).toUpperCase() + word.slice(1)).join('')
}

/**
 * 去除掉多余的空格
 */

export function transformRedundantSpace(str: string) {
  // return str.replace(/(?<=[\n|\r|\r\n])\s+(?=}$)/, '')
  return str
}
