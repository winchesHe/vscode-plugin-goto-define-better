import { type FileStoreValue, getMatchImport, getMatchMixins, normalizePath } from '../utils'

export function storeMixins(store: FileStoreValue, fileContent: string, url: string) {
  const matchImportArr = getMatchImport(fileContent)
  const matchMixins = getMatchMixins(fileContent)?.filter(i => i)

  matchMixins?.forEach(item => store.mixinsSet.add(item))
  matchImportArr.forEach((item) => {
    const [_import, _importPath] = item
    // 存储import内容
    store.importMap.set(_import, _importPath)

    // 在导入路径中匹配mixins的内容
    const mixinsArr = [...store.mixinsSet].map(item => item.trim())
    if (mixinsArr.some(item => _import.includes(item))) {
      const _normalizedPath = normalizePath(_importPath, url)

      store.mixinsPathsMap.set(_import, _normalizedPath)
    }
  })

  return {
    matchImportArr,
    matchMixins,
  }
}
