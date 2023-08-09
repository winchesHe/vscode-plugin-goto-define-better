import { normalizePath } from './normalizePath'
import type { TargetProperties } from './parse'
import { getTsconfigPaths } from './parse'

type Data = Record<string, [string, number]>

export type MixinsValue = Record<TargetProperties, Data>

export interface FileStoreValue {
  /** 导入路径值[import, importPath] */
  importMap: Map<string, any>
  /** mixins的Key值数组 */
  mixinsSet: Set<string>
  /** mixins的路径值[mixinsImport, importPath] */
  mixinsPathsMap: Map<string, any>
  /** mixins的值{ path: { mixinsPath: MixinsValue } } */
  mixinsValueMap: Map<string, Record<string, MixinsValue>>
}

class StoreClass {
  private fileStore = new Map<string, FileStoreValue>()

  public initFileStore(fileUrl: string) {
    const importMap = new Map()
    const mixinsSet = new Set<string>()
    const mixinsPathsMap = new Map()
    const mixinsValueMap = new Map()

    this.fileStore.set(fileUrl, {
      importMap,
      mixinsSet,
      mixinsPathsMap,
      mixinsValueMap,
    })
  }

  public addFileStore(fileUrl: string) {
    const file = this.fileStore.get(fileUrl)

    if (!file)
      this.initFileStore(fileUrl)
  }

  public getFileStore<T extends boolean>(fileUrl: string, addStore?: T): T extends true ? FileStoreValue : FileStoreValue | undefined {
    if (addStore) {
      this.addFileStore(fileUrl)
      return this.fileStore.get(fileUrl)!
    }
    return this.fileStore.get(fileUrl) as T extends true ? FileStoreValue : FileStoreValue | undefined
  }

  public clear() {
    this.fileStore.clear()
  }

  public isEmpty(store: FileStoreValue, storeKey?: keyof FileStoreValue) {
    if (storeKey)
      return !store[storeKey].size

    return !Object.values(store).some(item => item.size)
  }

  public getImportUrl(store: FileStoreValue, matchImportArr: string[], activeUrl: string) {
    const importEntries = store.importMap.entries() || []
    const result: Record<string, string> = {}
    const tsconfig = getTsconfigPaths(activeUrl)

    for (const [_import = '', _importPath = ''] of importEntries) {
      for (const item of matchImportArr) {
        if (_import.includes(item))
          result[item] = normalizePath(_importPath, activeUrl, tsconfig)
      }
    }

    return result
  }
}

export const fileStore = new StoreClass()

