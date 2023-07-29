type Data = Record<string, [string, number]>

export interface MixinsValue {
  data: Data
  computer: Data
  methods: Data
}

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
}

export const fileStore = new StoreClass()

