import * as path from 'path'
import * as vscode from 'vscode'

export function activate(context: vscode.ExtensionContext) {
  console.log(1)

  const definitionProvider = new ImportDefinitionProvider()
  context.subscriptions.push(
    vscode.languages.registerDefinitionProvider(
      { scheme: 'file', language: 'javascript' },
      definitionProvider,
    ),
    vscode.languages.registerDefinitionProvider(
      { scheme: 'file', language: 'typescript' },
      definitionProvider,
    ),
  )

  vscode.window.showInformationMessage('Import Definition Jump extension is now active!')
}

class ImportDefinitionProvider implements vscode.DefinitionProvider {
  provideDefinition(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken): vscode.ProviderResult<vscode.Definition> {
    const wordRange = document.getWordRangeAtPosition(position)

    if (!wordRange)
      return null

    const word = document.getText(wordRange)
    const importStatement = document.lineAt(position.line).text
    const importRegex = /import\s+.*\s+from\s+['"](.+)['"]/
    const importMatch = importStatement.match(importRegex)

    if (importMatch && importMatch[1] === word) {
      const importPath = importMatch[1]
      const importUri = vscode.Uri.file(resolveImportPath(document, importPath))
      const definitionPosition = new vscode.Position(0, 0) // 跳转到定义处的位置（此处为文件开头）
      const definitionLocation = new vscode.Location(importUri, definitionPosition)
      return definitionLocation
    }

    return new vscode.Location(vscode.Uri.file(resolveImportPath(document, '/Users/hewancong/Desktop/project/pratice/vue-demo1/src/App.vue')), new vscode.Position(0, 0))
  }
}

function resolveImportPath(document: vscode.TextDocument, importPath: string): string {
  const workspaceFolder = vscode.workspace.getWorkspaceFolder(document.uri)

  if (workspaceFolder) {
    const documentPath = path.dirname(document.uri.fsPath)
    const absolutePath = path.resolve(documentPath, importPath)
    return absolutePath
  }

  return ''
}

export function deactivate() {}
