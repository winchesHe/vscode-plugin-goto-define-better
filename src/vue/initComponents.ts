import { resolve } from 'path'
import { existsSync, readdirSync } from 'fs'
import * as vscode from 'vscode'
import { vueConfig } from '../utils'

const root = vscode.workspace.rootPath!
/** components的值{ prefix: [文件路径，文件名数组, 文档位置]  } */
export const componentsResult: Record<string, [string, string[], string]> = {}

export function initComponents() {
  const components = vueConfig.components
  const convertComponents: Record<string, [string, string[]]>[] = []

  for (const key in components) {
    const element = components[key].fileArr
    const docs = components[key].docs

    if (!element.includes('components-path1'))
      convertComponents.push({ [key]: [docs, element] })
  }

  if (!convertComponents.length)
    return

  for (const item of convertComponents) {
    for (const [prefix, [docs, paths]] of Object.entries(item)) {
      componentsResult[prefix] = [] as unknown as [string, string[], string]

      for (const path of paths) {
        const _normalizedPath = normalizePath(path)

        if (existsSync(_normalizedPath)) {
          const fileArr = readdirSync(_normalizedPath)
          componentsResult[prefix].push([_normalizedPath, fileArr as unknown as string, docs])
        }
      }
    }
  }
}

function normalizePath(path: string) {
  return resolve(root, path)
}
