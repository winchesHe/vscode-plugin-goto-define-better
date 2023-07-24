import path from 'path'
import os from 'os'
import { existsSync } from 'fs'
import { getTsconfigPaths } from './parse'

export function normalizedPath(targetUrl: string, activePath = '') {
  if (!targetUrl)
    return ''

  if (targetUrl.startsWith('.') && activePath) {
    const basename = path.basename(activePath)
    const convertPath = isWin ? activePath.replace(`\\${basename}`, '') : activePath.replace(`/${basename}`, '')
    const joinName = path.join(convertPath, targetUrl)
    return setExtPath(joinName)
  }

  const pathObj = getTsconfigPaths()
  let pattern = ''
  let val = ''

  const isAliasImport = Object.keys(pathObj).some((item) => {
    const convertAlias = item.replace('/*', '')
    const importUrl = targetUrl.split('/')[0]
    pattern = convertAlias
    val = pathObj[item]
    return importUrl === pattern
  })

  return isAliasImport ? targetUrl.replace(pattern, val) : targetUrl
}

function setExtPath(url: string) {
  const ext = ['.vue', '.js', '.ts']

  for (const item of ext) {
    const extPath = `${url}${item}`
    const extIndexPath = `${url}/index${ext}`

    if (existsSync(extPath))
      return extPath
    if (existsSync(extIndexPath))
      return extIndexPath
  }
  return url
}
