export function getMatchImport(str: string) {
  // const requireRegex = /require\(['"](.+)['"]\)/
  const requireRegex2 = /.*? (.+) = require\(['"](.+)['"]\)/
  const importRegex = /import {?\s*(.+?)\s*}? from ['"](.+)['"]/
  // const importRegex2 = /import\(['"](.+)['"]\)/

  // if (requireRegex.test(str))
  //   return str.match(requireRegex)
  if (requireRegex2.test(str)) {
    const match = str.match(requireRegex2) ?? []
    return [match[1] ?? '', match[2] ?? '']
  }
  if (importRegex.test(str)) {
    const match = str.match(importRegex) ?? []
    return [match[1] ?? '', match[2] ?? '']
  }
  return ['', '']
  // if (importRegex2.test(str))
  //   return str.match(importRegex2)
}
