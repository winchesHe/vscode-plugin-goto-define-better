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
  public alias: object = {}
  public components: Record<string, ComponentsValue> = {}
  public decorationType!: TextEditorDecorationType

  constructor() {
    this.update()
  }

  public update() {
    const {
      activeReload = false,
      activeHeight = true,
      hoverTips = true,
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
    this.alias = alias
    this.components = components
    this.decorationType = window.createTextEditorDecorationType({
      color: textColor,
      textDecoration: `${textLine} ${textStyle}`,
    })
  }
}

export const vueConfig = new Config()
