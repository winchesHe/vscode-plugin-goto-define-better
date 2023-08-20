import * as path from 'path'
import * as vscode from 'vscode'
import type { FileStoreValue, TargetProperties } from '../../utils'
import { extRoot, fileStore } from '../../utils'
import type { DataTuple } from '../transform'
import { omitPathMixinsData } from '../transform'

export class MixinsTree implements vscode.TreeDataProvider<Dependency> {
  private store: FileStoreValue | undefined

  getTreeItem(element: Dependency): vscode.TreeItem | Thenable<vscode.TreeItem> {
    return element
  }

  getChildren(element?: any): vscode.ProviderResult<Dependency[]> {
    const document = vscode.window.activeTextEditor?.document
    const fileUrl = document!.uri.fsPath
    const store = fileStore.getFileStore(fileUrl)
    this.store = store

    const valueMap = store?.mixinsValueMap.get(fileUrl)
    const valueObj = omitPathMixinsData(valueMap)
    const result: Dependency[] = []

    if (!element) {
      for (const key of Object.keys(valueObj))
        result.push(new Dependency(key, vscode.TreeItemCollapsibleState.Expanded))

      return result
    }
    else {
      const label = element.label
      for (const key of Object.keys(valueObj[label])) {
        const mixinsData = valueObj[label][key]
        result.push(new Dependency(key, vscode.TreeItemCollapsibleState.None, mixinsData))
      }

      return result
    }
  }
}

export class Dependency extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly mixinsData?: DataTuple,
    public readonly command?: vscode.Command,
  ) {
    super(label, collapsibleState)

    const value = mixinsData?.[0].replace(/function\s?/, '')

    if (value) {
      const type = mixinsData?.[2] as TargetProperties
      const tooltip = /\n/.test(value)
        ? type === 'props'
          ? `${value}`
          : new RegExp(label).test(value)
            ? `function ${value}`
            : `function ${label}${value}`
        : `value: ${value}`
      this.tooltip = new vscode.MarkdownString().appendCodeblock(`${tooltip || '未知'}`, 'typescript')
      this.description = type === 'data' ? `${value || ''}` : ''
    }
  }

  iconPath = {
    light: path.resolve(extRoot, 'res/light/dependency.svg'),
    dark: path.resolve(extRoot, 'res/dark/dependency.svg'),
  }

  contextValue = 'dependency'
}
