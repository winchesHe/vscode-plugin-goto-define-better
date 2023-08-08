import type { TextEditorDecorationType } from 'vscode'
import { window, workspace } from 'vscode'

export class Config {
  public activeReload = false
  public activeHeight = true
  public hoverTips = true
  public alias: object = {}
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
    } = workspace.getConfiguration('mixins-helper')

    this.activeHeight = activeHeight
    this.activeReload = activeReload
    this.hoverTips = hoverTips
    this.alias = alias
    this.decorationType = window.createTextEditorDecorationType({
      color: textColor,
      textDecoration: `${textLine} ${textStyle}`,
    })
  }
}

export const vueConfig = new Config()
