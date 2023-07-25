import path from 'path'
import { existsSync, readFileSync } from 'fs'
import { simple } from 'acorn-walk'
import { parse } from 'acorn'
import { workspace } from 'vscode'
import { mixinsConfig } from './getConfig'


export function getTsconfigPaths(activePath = ''): Record<string, any> {
  const rootList = workspace.workspaceFolders
  let pathVal = {}
  let transformPath = activePath

  rootList?.forEach((root) => {
    const rootPath = root.uri.fsPath
    transformPath = activePath?.replace(/(packages[\\/]\w+[\\/]).*/, '$1')!

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

  if (mixinsConfig.alias) {
    pathVal = {
      ...pathVal,
      ...mixinsConfig.alias
    }
  }

  return {
    pathVal,
    transformPath
  }
}

export function scanMixin(url: string) {
  if (existsSync(url)) {
    let fileContent = readFileSync(url, 'utf8');
    const scriptRegex = /<script(?:\s[^>]*)*>([\s\S]*?)<\/script\s*>/gi;

    fileContent = scriptRegex.exec(fileContent)?.[1] || fileContent

    return getMixinData(fileContent)
  }

  return ''
}

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

export function transformRegKey(str: string) {
  return str.replace('$', '\\$')
}

function getMixinData(code: string) {
  const ast = parse(code, { sourceType: 'module', ecmaVersion: 'latest' })
  const targetProperties = ['data', 'computed', 'methods']
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
      return code.substring(node.body.start + 1, node.body.end - 1)
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
