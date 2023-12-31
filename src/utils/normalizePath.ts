import path from 'path'
import os from 'os'
import { existsSync } from 'node:fs'
import { workspace } from 'vscode'
import { getTsconfigPaths } from './parse'

const isWin = os.platform() === 'win32'
const rootUrl = workspace.rootPath!

export function normalizePath(targetUrl: string, activePath: string, tsconfig?: Record<string, any>) {
  if (!targetUrl)
    return ''

  const basename = path.basename(activePath)
  const convertPath = isWin ? activePath.replace(`\\${basename}`, '') : activePath.replace(`/${basename}`, '')

  if (targetUrl.startsWith('.') && activePath) {
    const joinName = setExtPath(path.join(convertPath, targetUrl))
    return joinName
  }

  let pattern = ''
  let val = ''
  const { pathVal, transformPath } = tsconfig ?? getTsconfigPaths(activePath)

  const isAliasImport = Object.keys(pathVal).some((item) => {
    const convertAlias = item.replace('/*', '')
    const importUrl = targetUrl.split('/')[0]
    pattern = convertAlias
    val = pathVal[item].replace('/*', '')
    return importUrl === pattern
  })
  const _targetUrl = isAliasImport ? targetUrl.replace(pattern, val) : targetUrl
  const transformUrl = setExtPath(path.join(transformPath, _targetUrl))
  const rootTransformUrl = setExtPath(path.join(rootUrl, _targetUrl))

  if (existsSync(transformUrl))
    return transformUrl

  if (existsSync(rootTransformUrl))
    return rootTransformUrl

  return targetUrl
}

export function setExtPath(url: string) {
  const ext = ['.vue', '.js', '.ts']

  for (const item of ext) {
    const extPath = `${url}${item}`
    const extIndexPath = `${url}${isWin ? '\\' : '/'}index${item}`

    if (existsSync(extPath))
      return extPath
    if (existsSync(extIndexPath))
      return extIndexPath
  }
  return url
}
