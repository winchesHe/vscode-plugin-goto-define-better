import type { ExtensionContext, HoverProvider, TextEditor } from 'vscode'
import * as vscode from 'vscode'
import { getMatchImport, normalizedPath, scanMixin, transformMixins } from './utils'
import type { FileStoreValue } from './utils/store'
import { fileStore } from './utils/store'

let activeEditor: TextEditor | undefined
let store: FileStoreValue

export function activate(context: ExtensionContext) {
  activeEditor = vscode.window.activeTextEditor

  context.subscriptions.push(
    vscode.window.onDidChangeActiveTextEditor((editor) => {
      activeEditor = editor!
      if (activeEditor)
        init()
      //   updateProviders()
    }, null, context.subscriptions),
  )

  // context.subscriptions.push(
  //   workspace.onDidChangeTextDocument((event) => {
  //     if (activeEditor && event.document === activeEditor.document)
  //       updateProviders()
  //   }, null, context.subscriptions),
  // )

  context.subscriptions.push(
    vscode.languages.registerHoverProvider([
      { scheme: 'file', language: 'javascript' },
      { scheme: 'file', language: 'vue' },
    ], new ImportHoverProvider()),
  )

  init()
}

function init() {
  if (activeEditor) {
    const document = activeEditor.document
    const lineCount = document.lineCount
    const fileUrl = document.uri.fsPath
    let importStartIndex = 0
    let importEndIndex = 0

    fileStore.addFileStore(fileUrl)
    store = fileStore.getFileStore(fileUrl)!

    // 获取当前活跃编辑器import和mixins内容
    for (let index = 0; index < lineCount; index++) {
      const lineText = document.lineAt(index)
      const text = lineText.text
      if (!text)
        continue

      const [_import, _importPath] = getMatchImport(text)

      if (_import && _importPath) {
        importStartIndex = importStartIndex === 0 ? index : importStartIndex
        store.importMap.set(_import, _importPath)
        importEndIndex = index
        continue
      }

      const mixinReg = /\s*mixins:\s*\[(.*?)\]\s*/

      if (mixinReg.test(text)) {
        const mixinsArr = text.match(mixinReg)?.[1].split(',')
        mixinsArr?.forEach(item => store.mixinsSet.add(item))
        continue
      }
    }

    // 在导入路径中匹配mixins的内容
    for (let index = importStartIndex; index < importEndIndex; index++) {
      const lineText = document.lineAt(index)
      const text = lineText.text
      if (!text)
        continue

      const [_import, _importPath] = getMatchImport(text)
      const mixinsArr = [...store.mixinsSet].map(item => item.trim())
      if (mixinsArr.some(item => _import.includes(item)))
        store.mixinsPathsMap.set(_import, normalizedPath(_importPath, fileUrl))
    }

    // 解析当前页面的mixins路径
    const mixinsValArr = [...store.mixinsPathsMap.values()]
    for (const path of mixinsValArr) {
      fileStore.addFileStore(path)

      const store = fileStore.getFileStore(path)!
      const mixinsFile = scanMixin(path)

      store.mixinsValueMap.set(path, mixinsFile)
    }
  }
}

class ImportHoverProvider implements HoverProvider {
  provideHover(document: vscode.TextDocument, position: vscode.Position): vscode.ProviderResult<vscode.Hover> {
    const wordRange = document.getWordRangeAtPosition(position)

    if (!wordRange)
      return null

    let mixinsObj: Record<string, any> = {}

    // 获取mixins的key val值
    for (const item of store.mixinsPathsMap.values()) {
      const store = fileStore.getFileStore(item)
      const mixinsVal = store?.mixinsValueMap.get(item)
      mixinsObj = transformMixins(mixinsVal)
    }

    // 判断该行内是否能匹配到mixins值
    for (const [key = '', value = []] of Object.entries(mixinsObj)) {
      // const lineText = document.getText(document.lineAt(position).range).trim()
      // const lineNumber = position.line

      // const newPosition = new vscode.Position(lineNumber - 1, lineText.length)
      // const wordRange = document.getWordRangeAtPosition(newPosition)
      // const word = document.getText(wordRange)
      const _key = key.replace('$', '')
      const keyReg = new RegExp(_key)
      const matchMixinsRange = document.getWordRangeAtPosition(position, keyReg)

      if (!matchMixinsRange)
        continue

      const hover: vscode.Hover = {
        range: matchMixinsRange,
        // contents: [
        //   { language: 'markdown', value: `value: "${value[0]}"` },
        // ],
        contents: [
          `value: "${value[0]}"`,
        ],
      }
      return hover
    }

    return null
  }
}

export function deactivate() {

}
