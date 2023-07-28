import { workspace } from 'vscode'

export class Config {
  public activeReload = false
  public activeHeight = false
  public hoverTips = true
  public alias: object = {}

  constructor() {
    this.update()
  }

  public update() {
    const {
      activeReload = false,
      activeHeight = false,
      hoverTips = true,
      alias = {},
    } = workspace.getConfiguration('mixins-helper')

    this.activeHeight = activeHeight
    this.activeReload = activeReload
    this.hoverTips = hoverTips
    this.alias = alias
  }
}

export const vueConfig = new Config()
