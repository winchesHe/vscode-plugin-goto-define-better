import path from 'path'
import { existsSync, readFileSync } from 'fs'
import { simple } from 'acorn-walk'
import { parse } from 'acorn'
import { workspace } from 'vscode'
import type { MethodDeclaration, Node, PropertyAssignment, SourceFile, Type } from 'ts-morph'
import { Project, ts } from 'ts-morph'
import { storeMixins } from '../mixins'
import { vueConfig } from './getConfig'
import type { MixinsValue } from './store'
import { fileStore } from './store'

export const targetProperties = ['data', 'computed', 'methods']
// 获取对象和函数形式的 targetProperties tsNode 值
const targetNodeType = ['PropertyAssignment', 'MethodDeclaration']

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
    const getMixinsFn = url.endsWith('.ts') ? getTsMixinsData : getMixinsData
    const getMixinsFnParams = url.endsWith('.ts') ? url : fileContent

    // 当第一次加载或者activeReload时才执行（无配置判断，因为前面会初始化）
    if (fileStore.isEmpty(store, 'mixinsPathsMap')) {
      storeMixins(store, fileContent, url)

      // 解析当前页面的mixins路径
      const mixinsValArr = [...store.mixinsPathsMap.values()]
      for (const path of mixinsValArr) {
        let mixinsFile: Record<string, MixinsValue>
        const _store = fileStore.getFileStore(path)

        if (_store) {
          // 当第一次加载或者activeReload时才执行
          if (fileStore.isEmpty(_store, 'mixinsValueMap') || vueConfig.activeReload)
            mixinsFile = scanMixin(path)
          else
            mixinsFile = _store.mixinsValueMap.get(path)!
        }
        else {
          mixinsFile = scanMixin(path)
        }

        result = {
          ...result,
          ...mixinsFile,
        }
      }
    }
    else {
      // 直接返回缓存过的mixins值
      return {
        ...(store.mixinsValueMap.get(url) || {}),
      }
    }

    try {
      targetProperties.forEach((item) => {
        result[url] = {}
        result[url][item] = {
          ...(result[url][item] || {}),
          ...(getMixinsFn(getMixinsFnParams)[item] || {}),
        }
      })
      store.mixinsValueMap.set(url, result)

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

function getTsMixinsData(filePath: string): MixinsValue {
  const project = new Project()
  const file: SourceFile = project.addSourceFileAtPath(filePath)
  const methodsPropertyAssignment = {}

  file.forEachDescendant((node: Node) => {
    const name = node.getSymbol()?.getEscapedName() as string
    if (targetNodeType.includes(node.getKindName()) && targetProperties.includes(name))
      methodsPropertyAssignment[name] = extractNodeVal(node as PropertyAssignment, name)
  })

  return methodsPropertyAssignment as MixinsValue
}

function extractNodeVal(node: PropertyAssignment | MethodDeclaration, key: string): MixinsValue {
  const result = {}
  // 解析对象形式
  if (node.getKindName() === 'PropertyAssignment') {
    ((node as PropertyAssignment).getInitializer() as unknown as Type)?.getProperties()?.forEach((item: any) => {
      result[item.getSymbol()?.getEscapedName()] = [item.getText(), item.getStart()]
    })
  }
  // 解析函数形式
  else if (node.getKindName() === 'MethodDeclaration' && key === 'data') {
    const returnBody = (node as MethodDeclaration).getBody()
    const returnNode = returnBody?.getChildrenOfKind(ts.SyntaxKind.ReturnStatement)[0]
    const returnValNode = returnNode?.getDescendantsOfKind(ts.SyntaxKind.ObjectLiteralExpression)[0]

    for (const item of (returnValNode?.getProperties() || [])) {
      // 若data返回值里有对象字面量则需获取对应的值
      if (item.getKindName() === 'ShorthandPropertyAssignment') {
        returnBody?.forEachChild((bodyNode) => {
          // 获取block内除return的节点
          if (bodyNode.getKindName() !== 'ReturnStatement') {
            bodyNode?.forEachDescendant((declareNode) => {
              // Identifier节点没有想要的value
              if (declareNode.getKindName() !== 'Identifier') {
                // 获取定义在return里的对象字面量的值
                const name = declareNode.getSymbol()?.getEscapedName()
                if (name && name === item.getSymbol()?.getEscapedName())
                  result[name] = [declareNode.getText(), item.getStart()]
              }
            })
          }
        })
        continue
      }
      const name = item.getSymbol()?.getEscapedName()
      if (name)
        result[name] = [item.getText(), item.getStart()]
    }
  }
  return result as MixinsValue
}

function getMixinsData(code: string) {
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

function extractScriptText(ctx: string) {
  const scriptRegex = /<script(?:\s[^>]*)*>([\s\S]*?)<\/script\s*>/gi
  return scriptRegex.exec(ctx)?.[1] || ctx
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
