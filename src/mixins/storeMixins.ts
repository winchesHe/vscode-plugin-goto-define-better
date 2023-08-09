import { type FileStoreValue, getMatchImport, getMatchMixins, getTsconfigPaths, normalizePath } from '../utils'

/**
 * StoreMixins 类型别名
 * @typedef {Object} StoreMixins
 * @property {any[]} matchImportArr 匹配到的 import 数组
 * @property {string[]} matchMixins 匹配到的 mixins 数组
 */

/**
 * 根据文件内容和路径匹配到对应的 StoreMixins
 * @param store 待处理文件 store
 * @param fileContent 待处理文件内容
 * @param url 待处理文件路径
 * @returns {StoreMixins} 返回匹配到的 StoreMixins
 */
export function storeMixins(store: FileStoreValue, fileContent: string, url: string) {
  const matchImportArr = getMatchImport(fileContent)
  const matchMixins = getMatchMixins(fileContent)?.filter(i => i)
  const tsconfig = getTsconfigPaths(url)

  matchMixins?.forEach(item => store.mixinsSet.add(item))
  matchImportArr.forEach((item) => {
    const [_import, _importPath] = item
    // 存储import内容
    store.importMap.set(_import, _importPath)

    // 在导入路径中匹配mixins的内容
    const mixinsArr = [...store.mixinsSet].map(item => item.trim())
    if (mixinsArr.some(item => _import.includes(item))) {
      const _normalizedPath = normalizePath(_importPath, url, tsconfig)

      store.mixinsPathsMap.set(_import, _normalizedPath)
    }
  })

  return {
    matchImportArr,
    matchMixins,
  }
}
