import type { Disposable } from 'vscode'
import { languages } from 'vscode'
import { vueConfig } from './utils'
import { ImportAllComponentsCompletionItems, ImportAllComponentsDefinitionProvider, ImportAllComponentsHoverProvider } from './vue'
import { ImportHoverProvider } from '.'

let changeTextDisposables: Disposable | false
let hoverDisposables: Disposable | false
let allCompHoverDisposables: Disposable | false
let allCompCompletionDisposables: Disposable | false
let allCompDefinitionDisposables: Disposable | false

export function updateProvider() {
  // 暂时取消activeTextChange事件
  // if (vueConfig.activeReload) {
  //   removeProvider('activeReload')
  //   changeTextDisposables = vscode.workspace.onDidChangeTextDocument((event) => {
  //     if (activeEditor && event.document === activeEditor.document)
  //       init()
  //   }, null, context.subscriptions)
  // }
  // else {
  //   removeProvider('activeReload')
  // }

  if (vueConfig.hoverTips) {
    removeProvider('hoverTips')
    hoverDisposables = languages.registerHoverProvider([
      { scheme: 'file', language: 'vue' },
    ], new ImportHoverProvider())
  }
  else {
    removeProvider('hoverTips')
  }
  if (vueConfig.componentsGotoDefinition) {
    removeProvider('componentsGotoDefinition')
    allCompDefinitionDisposables = languages.registerDefinitionProvider([
      { scheme: 'file', language: 'vue' },
    ], new ImportAllComponentsDefinitionProvider())
  }
  else {
    removeProvider('componentsGotoDefinition')
  }
  if (vueConfig.componentsHoverTips) {
    removeProvider('componentsHoverTips')
    allCompHoverDisposables = languages.registerHoverProvider([
      { scheme: 'file', language: 'vue' },
    ], new ImportAllComponentsHoverProvider())
  }
  else {
    removeProvider('componentsHoverTips')
  }
  if (vueConfig.componentsCompletion) {
    removeProvider('componentsCompletion')
    allCompCompletionDisposables = languages.registerCompletionItemProvider([
      { scheme: 'file', language: 'vue' },
    ], new ImportAllComponentsCompletionItems(), '<', '-')
  }
  else {
    removeProvider('componentsCompletion')
  }

  function removeProvider(type: keyof typeof vueConfig) {
    switch (type) {
      case 'hoverTips':
        changeTextDisposables && changeTextDisposables.dispose()
        changeTextDisposables = false
        break
      case 'activeReload':
        hoverDisposables && hoverDisposables.dispose()
        hoverDisposables = false
        break
      case 'componentsHoverTips':
        allCompHoverDisposables && allCompHoverDisposables.dispose()
        allCompHoverDisposables = false
        break
      case 'componentsCompletion':
        allCompCompletionDisposables && allCompCompletionDisposables.dispose()
        allCompCompletionDisposables = false
        break
      case 'componentsGotoDefinition':
        allCompDefinitionDisposables && allCompDefinitionDisposables.dispose()
        allCompDefinitionDisposables = false
        break
      default:
        break
    }
  }
}
