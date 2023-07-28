import { transformMixins } from './parse'

export interface FileStoreValue {
  /** 导入路径值[import, importPath] */
  importMap: Map<string, any>
  /** mixins的Key值数组 */
  mixinsSet: Set<string>
  /** mixins的路径值[mixinsImport, importPath] */
  mixinsPathsMap: Map<string, any>
  /** mixins的值[path, value] */
  mixinsValueMap: Map<string, any>
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

  public getFileStore(fileUrl: string) {
    return this.fileStore.get(fileUrl)
  }

  public clear() {
    this.fileStore.clear()
  }
}

export const fileStore = new StoreClass()

export function convertMixinsObjVal(store: FileStoreValue) {
  let mixinsObj: Record<string, any> = {}

  // 获取mixins的key val值
  for (const item of store.mixinsPathsMap.values()) {
    const store = fileStore.getFileStore(item)
    const mixinsVal = store?.mixinsValueMap.get(item)
    mixinsObj = {
      ...mixinsObj,
      ...transformMixins(mixinsVal),
    }
  }

  return mixinsObj
}
