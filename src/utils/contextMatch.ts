export function getMatchImport(str: string, line = false) {
  // const requireRegex = /require\(['"](.+)['"]\)/
  const requireRegex2 = /.*? (.+) = require\(['"](.+)['"]\)/
  const importRegex = /import {?\s*(.+?)\s*}? from ['"](.+)['"]/
  const importRegexAll = /import {?\s*([\w\W]+?)\s*}? from ['"](.+)['"]/g

  const matchAll = str.match(importRegexAll) ?? []
  const result: any[] = []

  if (requireRegex2.test(str) && line) {
    const match = str.match(requireRegex2) ?? []
    return [match[1].trim() ?? '', match[2] ?? '']
  }
  if (importRegex.test(str) && line) {
    const match = str.match(importRegex) ?? []
    return [match[1].trim() ?? '', match[2] ?? '']
  }

  for (const item of matchAll)
    result.push(matchImport(item))

  // const importRegex2 = /import\(['"](.+)['"]\)/

  // if (requireRegex.test(str))
  //   return str.match(requireRegex)
  // if (importRegex2.test(str))
  //   return str.match(importRegex2)

  return result.length ? result : ['', '']

  function matchImport(itemImport: string) {
    const importRegex = /import {?\s*([\w\W]+?)\s*}? from ['"](.+)['"]/
    const match = itemImport.match(importRegex) ?? []
    return [match[1] ?? '', match[2] ?? '']
  }
}

export function getMatchMixins(str: string) {
  const mixinReg = /\s*mixins:\s*\[([\w\W]*?)\]\s*/

  if (mixinReg.test(str))
    return str.match(mixinReg)?.[1].split(',').map(i => i.trim()) ?? []

  return []
}

export function isMatchLangTs(str: string) {
  const langTsReg = /lang=["']ts["']|lang=["']typescript["']/g
  return langTsReg.test(str)
}

export function getMatchScriptIndex(str: string) {
  const scriptReg = /<script(?:\s[^>]*)*>/g
  const match = scriptReg.exec(str)
  if (match)
    return match.index + match[0].length
}

export function isMatchVueClass(str: string) {
  const vueClassReg = /vue-class-component|vue-property-decorator/g
  return vueClassReg.test(str)
}
