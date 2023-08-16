import type { FileStoreValue, MixinsValue, TargetProperties } from '../utils'
import { fileStore, targetProperties } from '../utils'

// 将data: { key: value }等转换成{ key: value }
export function transformMixins(obj: Record<string, any> = {}) {
  const result = {}

  Object.values(obj)?.forEach((item = {}, index, arr) => {
    Object.keys(item)?.forEach((key) => {
      result[key] = arr[index][key]
    })
  })

  return result
}

// 获取mixins的key value值[[key, value]]
export function convertMixinsObjVal(store: FileStoreValue) {
  let mixinsObj: Record<string, any> = {}

  // 获取mixins的key val值
  for (const item of store.mixinsPathsMap.values()) {
    const store = fileStore.getFileStore(item)!
    const mixinsVal = transformMixinsValuesPath(store.mixinsValueMap.get(item))
    mixinsObj = {
      ...mixinsObj,
      ...transformMixins(mixinsVal),
    }
  }

  return mixinsObj
}

// 去除mixins值的路径，获取全部的key value
export function transformMixinsValuesPath(target: Record<string, MixinsValue> | undefined) {
  if (!target)
    return

  const result = {} as MixinsValue

  for (const key in target) {
    const _target = target[key]

    targetProperties.forEach((item) => {
      result[item] = {
        ...(result[item] || {}),
        ...(_target[item] || {}),
      }
    })
  }
  return result
}

/**
 * 转化parse后的mixins值
 */
export function convertMixinsDataFn(mixinsData: Record<TargetProperties, any>, store: FileStoreValue, activeUrl: string) {
  // components: { component1: [ undefined, 545 ] }
  const componentsData = mixinsData.components

  if (componentsData) {
    const componentsKeyArr = Object.keys(componentsData)
    // 转化为 { component: path }
    const _convertComponentsData = fileStore.getImportUrl(store, componentsKeyArr, activeUrl)

    for (const key of Object.keys(_convertComponentsData)) {
      const value = _convertComponentsData[key]

      // 为undefined赋值importUrl
      componentsData[key][0] = value
    }
  }

  return mixinsData
}
