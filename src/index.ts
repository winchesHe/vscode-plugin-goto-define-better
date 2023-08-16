import type { ExtensionContext, HoverProvider, TextEditor } from 'vscode'
import * as vscode from 'vscode'
import { getMatchImport, getMatchMixins, getTsconfigPaths, normalizePath, scanMixin, transformEndLineKey, transformRegKey, vueConfig } from './utils'
import type { FileStoreValue } from './utils/store'
import { fileStore } from './utils/store'
import { convertMixinsObjVal, transformMixins, transformMixinsValuesPath } from './mixins'
import { ImportComponentsDefinitionProvider } from './mixins/provider/components'
import { initComponents } from './vue'
import { updateProvider } from './provider'

let activeEditor: TextEditor | undefined
let store: FileStoreValue

const runLanguage = ['vue']
export const firstReg = /[:-\w/\\\u4E00-\u9FA5\s'(]/
export const endReg = /[:-\w/\\\u4E00-\u9FA5\s']/

export function activate(context: ExtensionContext) {
  activeEditor = vscode.window.activeTextEditor

  context.subscriptions.push(
    vscode.window.onDidChangeActiveTextEditor((editor) => {
      activeEditor = editor!
      if (activeEditor) {
        updateFileStore()
        vueConfig.activeHeight && initColor()
      }
    }, null, context.subscriptions),
    vscode.workspace.onDidChangeConfiguration((event) => {
      if (event.affectsConfiguration('mixins-helper')) {
        vueConfig.update()
        initComponents()
        updateProvider()
      }
    }),
  )

  context.subscriptions.push(
    vscode.languages.registerDefinitionProvider([
      { scheme: 'file', language: 'vue' },
    ], new ImportDefinitionProvider()),
    vscode.languages.registerDefinitionProvider([
      { scheme: 'file', language: 'vue' },
    ], new ImportComponentsDefinitionProvider()),
    vscode.languages.registerCompletionItemProvider([
      { scheme: 'file', language: 'vue' },
    ], new ImportCompletionItems()),
  )

  init()
  initComponents()
  updateProvider()
}

function init() {
  initFileStore()
  vueConfig.activeHeight && initColor()
}

function initFileStore() {
  if (activeEditor) {
    const document = activeEditor.document

    if (!runLanguage.includes(document.languageId))
      return

    const fileUrl = document.uri.fsPath

    fileStore.initFileStore(fileUrl)
    store = fileStore.getFileStore(fileUrl)!

    // 获取当前活跃编辑器import和mixins内容
    const documentText = document.getText()
    const matchImportArr = getMatchImport(documentText)
    const matchMixins = getMatchMixins(documentText)

    matchMixins?.forEach(item => store.mixinsSet.add(item))
    matchImportArr.forEach((item) => {
      const [_import, _importPath] = item
      // 存储import内容
      store.importMap.set(_import, _importPath)

      // 在导入路径中匹配mixins的内容
      const mixinsArr = [...store.mixinsSet].map(item => item.trim())
      const tsconfig = getTsconfigPaths(fileUrl)
      if (mixinsArr.some(item => _import.includes(item))) {
        const _normalizedPath = normalizePath(_importPath, fileUrl, tsconfig)

        store.mixinsPathsMap.set(_import, _normalizedPath)
      }
    })

    // 解析当前页面的mixins路径
    const mixinsValArr = [...store.mixinsPathsMap.values()]
    for (const path of mixinsValArr) {
      try {
        const mixinsFile = scanMixin(path)
        const store = fileStore.getFileStore(path, true)

        store.mixinsValueMap.set(path, mixinsFile)
      }
      catch (error) {
        // mixins解析错误，已知不支持：ts，带ts的vue
        // eslint-disable-next-line no-console
        console.log(error)
      }
    }
  }
}

function updateFileStore() {
  if (activeEditor) {
    const document = activeEditor.document

    if (runLanguage.includes(document.languageId)) {
      const fileUrl = document.uri.fsPath
      const _store = fileStore.getFileStore(fileUrl)

      if (!_store || vueConfig.activeReload) {
        initFileStore()
      }
      else if (_store) {
        // 更新到当前store
        store = _store
      }
    }
  }
}

function initColor() {
  if (activeEditor) {
    const document = activeEditor.document

    if (runLanguage.includes(document.languageId)) {
      const editor = activeEditor
      // 获取mixins的key val值
      const mixinsObj = convertMixinsObjVal(store)

      // 判断该行内是否能匹配到mixins值
      const decorations: vscode.DecorationOptions[] = []
      for (const [key = ''] of Object.entries(mixinsObj)) {
        const text = editor.document.getText()
        const _key = transformRegKey(key)
        const regex = new RegExp(_key, 'g')
        let match
        // eslint-disable-next-line no-cond-assign
        while ((match = regex.exec(text))) {
          const startPos = editor.document.positionAt(match.index)
          const endPos = editor.document.positionAt(match.index + match[0].length)
          const decoration = { range: new vscode.Range(startPos, endPos) }
          const firstRange = new vscode.Range(document.positionAt(match.index - 1), startPos)
          const endRange = new vscode.Range(endPos, document.positionAt(match.index + match[0].length + 1))

          if (canMatchWord({ firstRange, endRange }))
            decorations.push(decoration)
        }
      }
      editor.setDecorations(vueConfig.decorationType, decorations)
    }
  }
}

function canMatchWord(
  { firstRange, endRange, position }: { firstRange?: vscode.Range; endRange?: vscode.Range; position?: vscode.Position },
) {
  if (activeEditor) {
    const document = activeEditor.document

    if (position) {
      const wordRange = document.getWordRangeAtPosition(position)!
      const word = document.getText(wordRange)
      const lineText = document.lineAt(position.line).text.trim()
      const matchWordReg = new RegExp(word, 'g')
      const match = matchWordReg.exec(lineText)

      if (match) {
        const startPos = match.index - 1
        const endPos = match.index + match[0].length
        const firstText = lineText[startPos]
        const lastText = lineText[endPos] || ''

        return !firstReg.test(firstText) && !endReg.test(lastText)
      }
      return false
    }

    const firLineText = document.getText(firstRange)
    const LasLineText = transformEndLineKey(document.getText(endRange))

    return !firstReg.test(firLineText) && !endReg.test(LasLineText)
  }

  return false
}

export class ImportHoverProvider implements HoverProvider {
  provideHover(document: vscode.TextDocument, position: vscode.Position): vscode.ProviderResult<vscode.Hover> {
    const wordRange = document.getWordRangeAtPosition(position)

    if (!wordRange || !canMatchWord({ position }))
      return null

    // 获取mixins的key val值
    const mixinsObj: Record<string, any> = convertMixinsObjVal(store)

    // 判断该行内是否能匹配到mixins值
    for (const [key = '', value = []] of Object.entries(mixinsObj)) {
      // const lineText = document.getText(document.lineAt(position).range).trim()
      // const lineNumber = position.line

      // const newPosition = new vscode.Position(lineNumber - 1, lineText.length)
      // const wordRange = document.getWordRangeAtPosition(newPosition)
      // const word = document.getText(wordRange)
      const _key = transformRegKey(key)
      const keyReg = new RegExp(_key)
      const matchMixinsRange = document.getWordRangeAtPosition(position, keyReg)

      if (!matchMixinsRange)
        continue

      const markdown = new vscode.MarkdownString()
      const text = /\n/.test(value[0])
        ? new RegExp(_key).test(value[0])
          ? `function ${value[0]}`
          : `function ${key}${value[0]}`
        : `value: ${value[0]}`
      const hover: vscode.Hover = {
        range: matchMixinsRange,
        // contents: [
        //   { language: 'markdown', value: `value: "${value[0]}"` },
        // ],
        contents: [
          markdown.appendCodeblock(text, 'typescript'),
        ],
      }
      return hover
    }

    return null
  }
}

class ImportDefinitionProvider implements vscode.DefinitionProvider {
  async provideDefinition(document: vscode.TextDocument, position: vscode.Position): Promise<vscode.Definition | vscode.LocationLink[] | null> {
    const wordRange = document.getWordRangeAtPosition(position)

    if (!wordRange || !canMatchWord({ position }))
      return null

    const mixinsObj: Record<string, any> = {}

    // 获取mixins的file的key val值
    for (const item of store.mixinsPathsMap.values()) {
      const store = fileStore.getFileStore(item)
      const mixinsVal = store?.mixinsValueMap.get(item)

      for (const path in mixinsVal)
        mixinsObj[path] = transformMixins(mixinsVal[path])
    }

    // 判断该行内是否能匹配到mixins值
    for (const path in mixinsObj) {
      const obj = mixinsObj[path]

      for (const [key = '', value = []] of Object.entries(obj) as any) {
        const _key = transformRegKey(key)
        const keyReg = new RegExp(_key)

        const matchMixinsRange = document.getWordRangeAtPosition(position, keyReg)

        if (!matchMixinsRange)
          continue

        const newDocument = await vscode.workspace.openTextDocument(path)
        const start = newDocument.positionAt(value[1]).line
        const end = newDocument.offsetAt(matchMixinsRange.end)
        return new vscode.Location(vscode.Uri.file(path), new vscode.Position(start, end))
      }
    }

    return null
  }
}

class ImportCompletionItems implements vscode.CompletionItemProvider {
  provideCompletionItems(): vscode.ProviderResult<vscode.CompletionItem[] | vscode.CompletionList> {
    const mixinsProperty: Record<string, any> = {}
    const mixinsMethods: Record<string, any> = {}

    // 获取mixins的key val值
    for (const item of store.mixinsPathsMap.values()) {
      const store = fileStore.getFileStore(item)!
      const mixinsVal = transformMixinsValuesPath(store.mixinsValueMap.get(item))
      for (const key in mixinsVal) {
        if (['data', 'computed'].includes(key)) {
          mixinsProperty[key] = mixinsProperty[key]
            ? {
                ...mixinsProperty[key],
                ...mixinsVal[key],
              }
            : mixinsVal[key]
        }
        else {
          mixinsMethods[key] = mixinsMethods[key]
            ? {
                ...mixinsMethods[key],
                ...mixinsVal[key],
              }
            : mixinsVal[key]
        }
      }
    }

    const parsedProperty: Record<string, any> = [
      ...(Object.keys(mixinsProperty.data ?? {}) ?? []),
      ...(Object.keys(mixinsProperty.computed ?? {}) ?? []),
    ]
    const parsedMethods: Record<string, any> = [
      ...(Object.keys(mixinsMethods.methods ?? {}) ?? []),
    ]

    return [
      ...parsedProperty.map((item) => {
        return new vscode.CompletionItem(item, vscode.CompletionItemKind.Property)
      }),
      ...parsedMethods.map((item) => {
        return new vscode.CompletionItem(item, vscode.CompletionItemKind.Method)
      }),
    ]
  }
}

export function deactivate() {

}
