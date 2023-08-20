import { resolve } from 'path'
import { workspace } from 'vscode'

export const rootPath = workspace && workspace.rootPath
export const extRoot = resolve(__dirname, '..')
