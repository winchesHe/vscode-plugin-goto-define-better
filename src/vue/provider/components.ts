/* eslint-disable @typescript-eslint/no-unused-vars */
import { basename, resolve } from 'path'
import { readdirSync } from 'fs'
import * as vscode from 'vscode'
import { setExtPath, transformComponentKey, transformUpperCamelCase } from '../../utils'
import { componentsResult } from '../initComponents'

const firstReg = /[\s</-]/
const endReg = /[\s>/-]/

export class ImportAllComponentsDefinitionProvider implements vscode.DefinitionProvider {
  provideDefinition(document: vscode.TextDocument, position: vscode.Position): vscode.ProviderResult<vscode.Definition | vscode.LocationLink[] | null> {
    const wordRange = document.getWordRangeAtPosition(position)

    if (!wordRange || !canMatchLineTagWord({ position }, document))
      return null

    // 判断该行内是否能匹配到组件标识值
    const lineText = document.getText(document.lineAt(position).range)
    for (const prefix in componentsResult) {
      const data = componentsResult[prefix]

      for (const [path = '', fileArr = []] of data) {
        for (const file of fileArr) {
          const _file = `${prefix}-${transformComponentKey(file)}`
          const upperCamelCase = transformUpperCamelCase(_file)
          const keyReg = new RegExp(_file, 'g')
          const upperCamelReg = new RegExp(upperCamelCase, 'g')
          const match = keyReg.exec(lineText) || upperCamelReg.exec(lineText)

          if (!match)
            continue

          let resolvePath = setExtPath(resolve(path, file))
          const lineNumber = document.lineAt(position).lineNumber
          const startPosition = new vscode.Position(lineNumber, match.index)
          const endPosition = new vscode.Position(lineNumber, match.index + match[0].length)
          const range = new vscode.Range(startPosition, endPosition)
          const baseName = basename(resolvePath)

          // 如果没有找到index后缀就分配目录下的第一个
          if (!baseName.includes('.')) {
            const file = readdirSync(resolvePath)[0]
            resolvePath = resolve(resolvePath, file)
          }

          const linkLocation: vscode.LocationLink = {
            targetUri: vscode.Uri.file(resolvePath),
            targetRange: new vscode.Range(new vscode.Position(0, 0), new vscode.Position(0, 0)),
            originSelectionRange: range,
          }

          return [linkLocation]
        }
      }
    }

    return null
  }
}

export class ImportAllComponentsHoverProvider implements vscode.HoverProvider {
  provideHover(document: vscode.TextDocument, position: vscode.Position): vscode.ProviderResult<vscode.Hover> {
    const wordRange = document.getWordRangeAtPosition(position)

    if (!wordRange || !canMatchLineTagWord({ position }, document))
      return null

    // 判断该行内是否能匹配到组件标识值
    const lineText = document.getText(document.lineAt(position).range)
    for (const prefix in componentsResult) {
      const data = componentsResult[prefix]

      for (const [_, fileArr = [], docs = ''] of data) {
        for (const file of fileArr) {
          const _file = `${prefix}-${transformComponentKey(file)}`
          const upperCamelCase = transformUpperCamelCase(_file)
          const keyReg = new RegExp(_file, 'g')
          const upperCamelReg = new RegExp(upperCamelCase, 'g')
          const match = keyReg.exec(lineText) || upperCamelReg.exec(lineText)

          if (!match)
            continue

          const lineNumber = document.lineAt(position).lineNumber
          const startPosition = new vscode.Position(lineNumber, match.index)
          const endPosition = new vscode.Position(lineNumber, match.index + match[0].length)
          const range = new vscode.Range(startPosition, endPosition)
          // 文档地址须携带http{s?}开头，否则会变成文件跳转
          const docsLink = `${docs}/${file}`
          const contents = new vscode.MarkdownString(`## ${file}\n文档地址: [${docsLink}](${docsLink})`)

          // command URIs如果想在Markdown 内容中生效, 你必须设置`isTrusted`。
          // 以便你期望的命令command URIs生效
          // contents.isTrusted = true
          const hover: vscode.Hover = {
            range,
            contents: [contents],
          }
          return hover
        }
      }
    }
    return null
  }
}

export class ImportAllComponentsCompletionItems implements vscode.CompletionItemProvider {
  provideCompletionItems(document: vscode.TextDocument, position: vscode.Position): vscode.ProviderResult<vscode.CompletionItem[] | vscode.CompletionList> {
    const result: string[] = []
    // 判断该行内是否能匹配到组件标识值
    for (const prefix in componentsResult) {
      const data = componentsResult[prefix]

      for (const [path = '', fileArr = []] of data) {
        for (const file of fileArr) {
          const snippet = `<${prefix}-${transformComponentKey(file)}>`
          result.push(snippet)
        }
      }
    }

    return [...result.map((i) => {
      const completionItem = new vscode.CompletionItem(i, vscode.CompletionItemKind.Snippet)

      completionItem.insertText = new vscode.SnippetString(`${i}$1${i.replace('<', '</')}`)

      return completionItem
    })]
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
