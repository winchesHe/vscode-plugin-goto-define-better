import type { TextEditorDecorationType } from 'vscode'
import { window, workspace } from 'vscode'

export interface ComponentsValue {
  docs: string
  fileArr: string[]
}

export class Config {
  public activeReload = false
  public activeHeight = true
  public hoverTips = true
  public componentsCompletion = true
  public componentsHoverTips = true
  public componentsGotoDefinition = true
  public tree = true
  public alias: object = {}
  public components: Record<string, ComponentsValue> = {}
  public decorationType!: TextEditorDecorationType

  /** 刷新标识 */
  public refresh = false

  constructor() {
    this.update()
  }

  public update() {
    const {
      activeReload = false,
      activeHeight = true,
      hoverTips = true,
      componentsCompletion = true,
      componentsHoverTips = true,
      componentsGotoDefinition = true,
      tree = true,
      alias = {},
      textLine = 'underline',
      textStyle = 'wavy',
      textColor = '#5074b3',
      components = {
        sf: {
          docs: '',
          fileArr: ['components-path1'],
        },
      },
    } = workspace.getConfiguration('mixins-helper')

    this.activeHeight = activeHeight
    this.activeReload = activeReload
    this.hoverTips = hoverTips
    this.componentsCompletion = componentsCompletion
    this.componentsHoverTips = componentsHoverTips
    this.componentsGotoDefinition = componentsGotoDefinition
    this.alias = alias
    this.components = components
    this.tree = tree
    this.decorationType = window.createTextEditorDecorationType({
      color: textColor,
      textDecoration: `${textLine} ${textStyle}`,
    })
  }

  public activeRefresh() {
    return this.activeReload || this.refresh
  }
}

export const vueConfig = new Config()
