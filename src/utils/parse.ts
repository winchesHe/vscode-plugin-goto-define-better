import path from 'path'
import { existsSync, readFileSync } from 'fs'
import { simple } from 'acorn-walk'
import { parse } from 'acorn'
import { workspace } from 'vscode'
import type { MethodDeclaration, ModifierableNode, Node, PropertyAssignment, SourceFile, Type } from 'ts-morph'
import { Project, ts } from 'ts-morph'
import { convertMixinsDataFn, storeMixins } from '../mixins'
import type { ArrayToUnion } from '../types'
import { vueConfig } from './getConfig'
import type { MixinsValue } from './store'
import { fileStore } from './store'
import { getMatchScriptIndex, isMatchVueClass } from './contextMatch'
import { transformRedundantSpace } from './transform'

export const targetProperties = ['data', 'computed', 'methods', 'props', 'components'] as const
// 获取对象和函数形式的 targetProperties tsNode 值
const targetNodeType = ['PropertyAssignment', 'MethodDeclaration']
// 获取 vue-class-component 的值
const vueClassMethodsType = ['GetAccessor', 'MethodDeclaration']
const vueClassDataType = ['PropertyDeclaration']

export type TargetProperties = ArrayToUnion<typeof targetProperties>

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

    const result = {}
    const store = fileStore.getFileStore(url, true)
    const origContent = readFileSync(url, 'utf8')
    const fileContent = extractScriptText(origContent)
    const matchVueClass = isMatchVueClass(origContent)
    let getMixinsFn = getMixinsData
    let getMixinsFnParams = fileContent

    /**
     * 1. 默认则用 getMixinsData
     * 2. 匹配到matchVueClass则用vue-class-component解析函数
     * 3. 匹配到.ts后缀的则用 ts 类型解析
     * 4. 匹配到.vue后缀的则需加上 getMatchScriptIndex(origContent)
     * */
    if (matchVueClass) {
      setMixinsFn(getVueClassMixinsData, [url, fileContent, {
        overwrite: true,
        scriptKind: ts.ScriptKind.TSX,
      }, getMatchScriptIndex(origContent)])
    }
    else if (url.endsWith('.ts')) {
      setMixinsFn(getTsMixinsData, url)
    }
    else if (url.endsWith('.vue')) {
      setMixinsFn(getMixinsData, [fileContent, getMatchScriptIndex(origContent)])
    }

    // 当第一次加载或者activeReload时才执行（无配置判断，因为前面会初始化）
    if (fileStore.isEmpty(store, 'mixinsPathsMap')) {
      storeMixins(store, fileContent, url)

      // 解析当前页面的mixins路径
      const mixinsValArr = [...store.mixinsPathsMap.values()]
      for (const path of mixinsValArr) {
        let mixinsFile: Record<string, MixinsValue>
        const _store = fileStore.getFileStore(path)

        if (_store) {
          // activeReload或者不存在mixins值时才执行
          if (fileStore.isEmpty(_store, 'mixinsValueMap') || vueConfig.activeReload)
            mixinsFile = scanMixin(path)
          else
            mixinsFile = _store.mixinsValueMap.get(path)!
        }
        else {
          // 当第一次加载
          mixinsFile = scanMixin(path)
        }

        for (const path of Object.keys(mixinsFile)) {
          if (!result[path])
            result[path] = {}
          for (const item of targetProperties) {
            result[path][item] = {
              ...(result[path][item] || {}),
              ...(mixinsFile[path][item] || {}),
            }
          }
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
      const mixinsData = getMixinsFn(getMixinsFnParams)
      const convertMixinsData = convertMixinsDataFn(mixinsData, store, url)

      for (const item of targetProperties) {
        if (!result[url])
          result[url] = {}

        result[url][item] = {
          ...(result[url][item] || {}),
          ...(convertMixinsData[item] || {}),
        }
      }
      store.mixinsValueMap.set(url, result)

      return result as Record<string, MixinsValue>
    }
    catch (error) {
      // mixins解析错误，已知不支持：ts，带ts的vue
      // eslint-disable-next-line no-console
      console.log(error)
      return {} as Record<string, MixinsValue>
    }

    function setMixinsFn(fn: any, params: any) {
      getMixinsFn = fn
      getMixinsFnParams = params
    }
  }

  return {} as Record<string, MixinsValue>
}

function getVueClassMixinsData(args: any[]): MixinsValue {
  const project = new Project()
  const [filePath, fileContent, options, scriptIndex = 0] = args
  const file: SourceFile = project.createSourceFile(filePath, fileContent, options)
  const result = {} as any

  const classNode = file.getChildrenOfKind(ts.SyntaxKind.ClassDeclaration)[0]
  classNode?.forEachChild((node) => {
    const name = node.getSymbol()?.getEscapedName() || (node as unknown as any).getName?.()
    const kindName = node.getKindName()
    const modifiers = (node as unknown as ModifierableNode).getModifiers?.()?.[0]?.getKindName()

    // 如果是 private 属性则不处理
    if (modifiers !== 'PrivateKeyword') {
      if (name && vueClassMethodsType.includes(kindName)) {
        result.methods = {
          [name]: [transformRedundantSpace(node.getText()), node.getStart() + scriptIndex],
        }
      }
      else if (name && vueClassDataType.includes(kindName)) {
        result.data = {
          [name]: [transformRedundantSpace(node.getText()), node.getStart() + scriptIndex],
        }
      }
    }
  })

  return result as MixinsValue
}

function getTsMixinsData(filePath: string): MixinsValue {
  const project = new Project()
  const file: SourceFile = project.addSourceFileAtPath(filePath)
  const methodsPropertyAssignment = {}

  file.forEachDescendant((node: Node) => {
    const name = node.getSymbol()?.getEscapedName() as TargetProperties
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
      result[item.getSymbol()?.getEscapedName()] = [transformRedundantSpace(item.getText()), item.getStart()]
    })
  }
  // 解析函数形式
  else if (node.getKindName() === 'MethodDeclaration' && key === 'data') {
    const returnBody = (node as MethodDeclaration).getBody()
    const returnNode = returnBody?.getChildrenOfKind(ts.SyntaxKind.ReturnStatement)[0]
    const returnValNode = returnNode?.getDescendantsOfKind(ts.SyntaxKind.ObjectLiteralExpression)[0]
    const returnBodyArr = returnBody?.forEachChildAsArray()
    const bodyChildrenArr = returnBodyArr?.map(i => i?.forEachDescendantAsArray())

    for (const item of (returnValNode?.getProperties() || [])) {
      // 若data返回值里有对象字面量则需获取对应的值
      if (item.getKindName() === 'ShorthandPropertyAssignment') {
        returnBodyArr?.forEach((bodyNode, index) => {
          // 获取block内除return的节点
          if (bodyNode.getKindName() !== 'ReturnStatement') {
            // 函数形式的字面量，直接在这里获取
            const name = bodyNode.getSymbol()?.getEscapedName()
            if (name && name === item.getSymbol()?.getEscapedName())
              result[name] = [transformRedundantSpace(bodyNode.getText()), item.getStart()]
            bodyChildrenArr?.[index]?.forEach((declareNode) => {
              // Identifier节点没有想要的value
              if (declareNode.getKindName() !== 'Identifier') {
                // 获取定义在return里的对象字面量的值
                const name = declareNode.getSymbol()?.getEscapedName()
                if (name && name === item.getSymbol()?.getEscapedName())
                  result[name] = [transformRedundantSpace(declareNode.getText()), item.getStart()]
              }
            })
          }
        })
        continue
      }
      const name = item.getSymbol()?.getEscapedName()
      if (name)
        result[name] = [transformRedundantSpace(item.getText()), item.getStart()]
    }
  }
  return result as MixinsValue
}

function getMixinsData(options: string | any[]): Record<TargetProperties, any> {
  let code: string
  let scriptIndex = 0
  if (Array.isArray(options))
    [code, scriptIndex] = options
  else
    code = options

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
    if (node.type === 'ObjectExpression' && name === 'props') {
      const value = {}
      node.properties.forEach((property) => {
        if (property.key?.type === 'Identifier')
          value[property.key.name] = [transformRedundantSpace(code.substring(property.start, property.end)), property.key.start + scriptIndex]
      })
      return value
    }
    else if (node.type === 'ObjectExpression') {
      const value = {}
      node.properties.forEach((property) => {
        if (property.key?.type === 'Identifier')
          value[property.key.name] = [evaluatePropertyValue(property.value), property.key.start + scriptIndex]
      })
      return value
    }
    else if (node.type === 'FunctionExpression' || node.type === 'ArrowFunctionExpression') {
      if (node.body.type === 'BlockStatement' && name === 'data') {
        const property = node.body.body.find(item => item.type === 'ReturnStatement')?.argument
        if (property)
          return evaluatePropertyValue(property)
      }
      return transformRedundantSpace(code.substring(node.start, node.end))
    }
    else if (node.type === 'ArrayExpression') {
      return transformRedundantSpace(code.substring(node.start, node.end))
    }
    else {
      return node.value
    }
  }
  return properties as Record<TargetProperties, any>
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
