export interface FileStoreValue {
  importMap: Map<string, any>
  mixinsSet: Set<string>
  mixinsPathsMap: Map<string, any>
  mixinsValueMap: Map<string, any>
}

class StoreClass {
  private fileStore = new Map<string, FileStoreValue>()

  public addFileStore(fileUrl: string) {
    const importMap = new Map()
    const mixinsSet = new Set<string>()
    const mixinsPathsMap = new Map()
    const mixinsValueMap = new Map()

    const file = this.fileStore.get(fileUrl)

    if (!file) {
      this.fileStore.set(fileUrl, {
        importMap,
        mixinsSet,
        mixinsPathsMap,
        mixinsValueMap,
      })
    }
  }

  public getFileStore(fileUrl: string) {
    return this.fileStore.get(fileUrl)
  }

  public clear() {
    this.fileStore.clear()
  }
}

export const fileStore = new StoreClass()
