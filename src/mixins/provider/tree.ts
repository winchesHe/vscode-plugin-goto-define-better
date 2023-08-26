import * as path from 'path'
import * as vscode from 'vscode'
import type { FileStoreValue, TargetProperties } from '../../utils'
import { extRoot, fileStore, vueConfig } from '../../utils'
import type { DataTuple } from '../transform'
import { omitPathMixinsData } from '../transform'

export class MixinsTree implements vscode.TreeDataProvider<Dependency> {
  private store: FileStoreValue | undefined
  private _onDidChangeTreeData: vscode.EventEmitter<Dependency | undefined | void> = new vscode.EventEmitter<Dependency | undefined | void>()
  readonly onDidChangeTreeData: vscode.Event<Dependency | undefined | void> = this._onDidChangeTreeData.event

  refresh() {
    this._onDidChangeTreeData.fire()
    // 清空刷新标识
    vueConfig.refresh = false
  }

  async gotoDefinition(node: Dependency) {
    const { fileUrl, mixinsData, label } = node
    if (fileUrl && mixinsData) {
      if (mixinsData[2] === 'components') {
        const args: [vscode.Uri] = [
          vscode.Uri.file(mixinsData[0]),
        ]

        return vscode.commands.executeCommand('vscode.open', ...args)
      }
      const newDocument = await vscode.workspace.openTextDocument(fileUrl)

      const args: [vscode.Uri, vscode.TextDocumentShowOptions] = [
        vscode.Uri.file(fileUrl),
        {
          selection: new vscode.Range(newDocument.positionAt(mixinsData[1]), newDocument.positionAt(mixinsData[1] + label.length)),
        },
      ]

      vscode.commands.executeCommand('vscode.open', ...args)
    }
  }

  getTreeItem(element: Dependency): vscode.TreeItem | Thenable<vscode.TreeItem> {
    return element
  }

  getChildren(element?: any): vscode.ProviderResult<Dependency[]> {
    const document = vscode.window.activeTextEditor?.document
    const fileUrl = document!.uri.fsPath
    const store = fileStore.getFileStore(fileUrl)
    this.store = store

    const valueMap = store?.mixinsValueMap.get(fileUrl)

    if (valueMap) {
      const valueObj = omitPathMixinsData(valueMap)
      const result: Dependency[] = []

      if (!element) {
        for (const key of Object.keys(valueObj))
          result.push(new Dependency(key, vscode.TreeItemCollapsibleState.Expanded))

        return result
      }
      else {
        const label = element.label as TargetProperties
        for (const path of Object.keys(valueMap)) {
          const valueObj = valueMap[path]
          for (const key of Object.keys(valueObj[label])) {
            const mixinsData = valueObj[label][key] as unknown as DataTuple
            result.push(new Dependency(key, vscode.TreeItemCollapsibleState.None, mixinsData, undefined, path))
          }
        }

        return result
      }
    }
  }
}

export class Dependency extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly mixinsData?: DataTuple,
    public readonly command?: vscode.Command,
    public readonly fileUrl?: string,
  ) {
    super(label, collapsibleState)

    try {
      const valueType = typeof mixinsData?.[0] === 'object' ? `${JSON.stringify(mixinsData?.[0])}` : `${mixinsData?.[0]}`
      const value = valueType?.replace(/function\s?/, '') || '空值'

      if (mixinsData) {
        this.contextValue = 'dependency'
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
    catch (error) {
      console.error(error)
    }
  }

  iconPath = {
    light: path.resolve(extRoot, 'res/light/dependency.svg'),
    dark: path.resolve(extRoot, 'res/dark/dependency.svg'),
  }
}

export const mixinsTreeProvider = new MixinsTree()

export function updateTree() {
  mixinsTreeProvider.refresh()
}
