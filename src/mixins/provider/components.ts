import * as vscode from 'vscode'
import { fileStore, transformComponentKey } from '../../utils'

const firstReg = /[\s</-]/
const endReg = /[\s>/-]/

export class ImportComponentsDefinitionProvider implements vscode.DefinitionProvider {
  provideDefinition(document: vscode.TextDocument, position: vscode.Position): vscode.ProviderResult<vscode.Definition | vscode.LocationLink[] | null> {
    const wordRange = document.getWordRangeAtPosition(position)
    const fileUrl = document.uri.fsPath
    const store = fileStore.getFileStore(fileUrl)!

    if (!wordRange || !canMatchLineTagWord({ position }, document))
      return null

    const mixinsObj: Record<string, any> = {}

    // 获取mixins的file的key val值
    for (const item of store.mixinsPathsMap.values()) {
      const store = fileStore.getFileStore(item)
      const mixinsVal = store?.mixinsValueMap.get(item)

      for (const path in mixinsVal)
        mixinsObj[path] = mixinsVal[path].components
    }

    // 判断该行内是否能匹配到mixins值
    const lineText = document.getText(document.lineAt(position).range)
    for (const path in mixinsObj) {
      const obj = mixinsObj[path]

      for (const [key = '', value = []] of Object.entries(obj) as any) {
        const _key = transformComponentKey(key)
        const lowerKey = key.toLowerCase()
        const keyReg = new RegExp(_key, 'g')
        const lowerKeyReg = new RegExp(lowerKey, 'g')
        const match = keyReg.exec(lineText) || lowerKeyReg.exec(lineText)

        if (!match)
          continue

        const lineNumber = document.lineAt(position).lineNumber
        const startPosition = new vscode.Position(lineNumber, match.index)
        const endPosition = new vscode.Position(lineNumber, match.index + match[0].length)
        const range = new vscode.Range(startPosition, endPosition)
        const linkLocation: vscode.LocationLink = {
          targetUri: vscode.Uri.file(value[0]),
          targetRange: new vscode.Range(new vscode.Position(0, 0), new vscode.Position(0, 0)),
          originSelectionRange: range,
        }

        return [linkLocation]
      }
    }

    return null
  }
}

function canMatchLineTagWord(
  { position }: { position: vscode.Position },
  document: vscode.TextDocument,
) {
  const wordRange = document.getWordRangeAtPosition(position)!
  const word = document.getText(wordRange)
  const lineText = document.getText(document.lineAt(position).range).trim()
  const matchWordReg = new RegExp(word, 'g')
  const match = matchWordReg.exec(lineText)

  if (match) {
    const startPos = match.index - 1
    const endPos = match.index + match[0].length
    const firstText = lineText[startPos]
    const lastText = lineText[endPos] || '-'

    return firstReg.test(firstText) && endReg.test(lastText)
  }
  return false
}
