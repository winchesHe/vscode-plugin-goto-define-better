import type { ExtensionContext } from 'vscode'
import { commands, window } from 'vscode'

export function activate(cxt: ExtensionContext) {
  const disposable = commands.registerTextEditorCommand('importToRequire', (textEdit, edit) => {
    const document = textEdit.document
    const selection = textEdit.selection
    const text = document.getText(selection)
    const newText = convert(text)

    edit.replace(selection, newText)
  })
  window.showInformationMessage('Congratulations, your extension "import-to-require" is already finished!')
  cxt.subscriptions.push(disposable)
}

function convert(text: string): string {
  const requireRegex = /require\(['"](.+)['"]\)/
  const requireRegex2 = /.*? (.+) = require\(['"](.+)['"]\)/
  const importRegex = /import (.+) from ['"](.+)['"]/
  const importRegex2 = /import\(['"](.+)['"]\)/

  const lines = text.split('\n')
  const newLines = lines.map((line) => {
    if (requireRegex2.test(line))
      return line.replace(requireRegex2, 'import $1 from \'$2\'')

    else if (importRegex.test(line))
      return line.replace(importRegex, 'const $1 = require(\'$2\')')

    else if (requireRegex.test(line))
      return line.replace(requireRegex, 'import(\'$1\')')
    else if (importRegex2.test(line))
      return line.replace(importRegex2, 'require(\'$1\')')
    else
      return line
  })

  return newLines.join('\n')
}

export function deactivate() {

}
