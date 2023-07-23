import * as vscode from 'vscode'

export function activate(context: vscode.ExtensionContext) {
  const decorationType = vscode.window.createTextEditorDecorationType({
    color: '#5074b3',
    textDecoration: 'underline wavy',
  })

  const activeEditor = vscode.window.activeTextEditor
  if (activeEditor)
    triggerUpdateDecorations(activeEditor, decorationType)

  vscode.window.onDidChangeActiveTextEditor(
    (editor) => {
      if (editor)
        triggerUpdateDecorations(editor, decorationType)
    },
    null,
    context.subscriptions,
  )

  vscode.workspace.onDidChangeTextDocument((event) => {
    if (activeEditor && event.document === activeEditor.document)
      triggerUpdateDecorations(activeEditor, decorationType)
  }, null, context.subscriptions)
}

function triggerUpdateDecorations(editor: vscode.TextEditor, decorationType: vscode.TextEditorDecorationType) {
  const text = editor.document.getText()
  const regex = /test/g
  const decorations: vscode.DecorationOptions[] = []
  let match
  while ((match = regex.exec(text))) {
    const startPos = editor.document.positionAt(match.index)
    const endPos = editor.document.positionAt(match.index + match[0].length)
    const decoration = { range: new vscode.Range(startPos, endPos) }
    decorations.push(decoration)
  }
  editor.setDecorations(decorationType, decorations)
}

export function deactivate() {}
