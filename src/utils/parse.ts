import path from 'path'
import { existsSync, readFileSync } from 'fs'
import { simple } from 'acorn-walk'
import { parse } from 'acorn'
import { workspace } from 'vscode'
import { storeMixins } from '../mixins'
import { vueConfig } from './getConfig'
import type { MixinsValue } from './store'
import { fileStore } from './store'

export const targetProperties = ['data', 'computed', 'methods']

export function getTsconfigPaths(activePath = ''): Record<string, any> {
  const rootList = workspace.workspaceFolders
  let pathVal = {}
  let transformPath = activePath

  rootList?.forEach((root) => {
    const rootPath = root.uri.fsPath
    transformPath = activePath?.replace(/(packages[\\/]\w+[\\/]).*/, '$1')

    const tsPath = [
      path.join(transformPath, 'tsconfig.json'),
      path.join(rootPath, 'tsconfig.json'),
    ]

    for (const path of tsPath) {
      if (existsSync(path)) {
        const context = readFileSync(path, 'utf8')
        const ast = parse(`const a = ${context}`, { ecmaVersion: 2016 })

        simple(ast, {
          Property(node: any) {
            if (node.key?.type === 'Literal' && node.key.value === 'paths') {
              if (node.value.type === 'ObjectExpression') {
                pathVal = {
                  ...extractPathsValue(node.value),
                  ...pathVal,
                }
              }
            }
          },
        })
      }
    }
  })

  if (vueConfig.alias) {
    pathVal = {
      ...pathVal,
      ...vueConfig.alias,
    }
  }

  return {
    pathVal,
    transformPath,
  }
}

export function scanMixin(url: string): Record<string, MixinsValue> {
  if (existsSync(url)) {
    if (vueConfig.activeReload)
      fileStore.initFileStore(url)

    let result = {}
    const store = fileStore.getFileStore(url, true)
    const fileContent = extractScriptText(readFileSync(url, 'utf8'))

    if (fileStore.isEmpty(store, 'mixinsPathsMap'))
      storeMixins(store, fileContent, url)

    // 解析当前页面的mixins路径
    const mixinsValArr = [...store.mixinsPathsMap.values()]
    for (const path of mixinsValArr) {
      const mixinsFile = scanMixin(path)

      store.mixinsValueMap.set(path, mixinsFile)
      result = mixinsFile
    }

    try {
      targetProperties.forEach((item) => {
        result[url] = {}
        result[url][item] = {
          ...(result[url][item] || {}),
          ...(getMixinData(fileContent)[item] || {}),
        }
      })
      return result as Record<string, MixinsValue>
    }
    catch (error) {
      // mixins解析错误，已知不支持：ts，带ts的vue
      // eslint-disable-next-line no-console
      console.log(error)
      return {} as Record<string, MixinsValue>
    }
  }

  return {} as Record<string, MixinsValue>
}

function extractScriptText(ctx: string) {
  const scriptRegex = /<script(?:\s[^>]*)*>([\s\S]*?)<\/script\s*>/gi
  return scriptRegex.exec(ctx)?.[1] || ctx
}

function getMixinData(code: string) {
  const ast = parse(code, { sourceType: 'module', ecmaVersion: 'latest' })
  const properties = {}
  simple(ast, {
    ObjectExpression(node: any) {
      node.properties.forEach((property) => {
        if (
          property.key?.type === 'Identifier'
          && targetProperties.includes(property.key.name)
        ) {
          const value = evaluatePropertyValue(property.value, property.key.name)
          properties[property.key.name] = value
        }
      })
    },
  })
  function evaluatePropertyValue(node, name?) {
    if (node.type === 'ObjectExpression') {
      const value = {}
      node.properties.forEach((property) => {
        if (property.key?.type === 'Identifier')
          value[property.key.name] = [evaluatePropertyValue(property.value), property.key.start]
      })
      return value
    }
    else if (node.type === 'FunctionExpression' || node.type === 'ArrowFunctionExpression') {
      if (node.body.type === 'BlockStatement' && name === 'data') {
        const property = node.body.body.find(item => item.type === 'ReturnStatement')?.argument
        if (property)
          return evaluatePropertyValue(property)
      }
      return code.substring(node.start, node.end)
    }
    else if (node.type === 'ArrayExpression') {
      return code.substring(node.start, node.end)
    }
    else {
      return node.value
    }
  }
  return properties
}

function extractPathsValue(node) {
  const paths = {}

  node.properties.forEach((property) => {
    if (property.value.type === 'ArrayExpression' && property.value.elements.length === 1) {
      const pathKey = property.key.value
      const pathValue = property.value.elements[0].value
      paths[pathKey] = pathValue
    }
  })

  return paths
}
