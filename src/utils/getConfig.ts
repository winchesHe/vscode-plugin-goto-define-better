import { workspace } from 'vscode';

export class Config {
  public activeReload: boolean = false;
  public activeHeight: boolean= false;
  public hoverTips: boolean= true;
  public alias: object = {};

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

export const mixinsConfig = new Config()
