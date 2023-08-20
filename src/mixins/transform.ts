import type { Data, FileStoreValue, MixinsValue, TargetProperties } from '../utils'
import { fileStore, targetProperties } from '../utils'

/** [value, value的位置，类型] */
export type DataTuple = [string, number, TargetProperties]
/** 添加上类型后的Mixins的值，name: [value, value的位置，类型] */
export type transformMixinsData = Record<string, DataTuple>

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

// 转化为Mixins值，变成{key: value}
export function convertMixinsObjVal(store: FileStoreValue) {
  let mixinsObj: Record<string, DataTuple> = {}

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

  const result = {} as transformMixinsData

  for (const key in target) {
    const _target = target[key]

    targetProperties.forEach((item) => {
      addMixinsTypes(_target[item], item)
      result[item] = {
        ...(result[item] || {}),
        ...(_target[item] || {}),
      }
    })
  }
  return result
}

/**
 * 为mixins值添加上类型
 */
function addMixinsTypes(target: Data, type: string) {
  for (const key of Object.keys(target || {})) {
    const val = target[key] || []
    val.push(type)
  }
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

/**
 * 去掉path值，将values合并
 * path: mixinsValue ==> { data: value }
 */
export function omitPathMixinsData(target: Record<string, MixinsValue> | undefined) {
  const result = {} as Record<TargetProperties, any>

  if (!target)
    return result

  for (const val of Object.values(target)) {
    for (const item of targetProperties) {
      result[item] = {
        ...(result[item] || {}),
        ...(val[item] || {}),
      }
    }
  }

  return result
}

/**
 * 将Mixins值，拷贝到目标对象
 */
export function copyMixinsData(target: Record<string, MixinsValue>, mixinsData: Record<string, MixinsValue>) {
  for (const url of Object.keys(mixinsData || {})) {
    const data = mixinsData[url]

    for (const item of targetProperties) {
      if (!target[url])
        target[url] = {} as MixinsValue

      target[url][item] = {
        ...(target[url][item] || {}),
        ...(data[item] || {}),
      }
    }
  }
}
