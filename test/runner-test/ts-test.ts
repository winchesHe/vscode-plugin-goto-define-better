import type { MethodDeclaration, Node, PropertyAssignment, SourceFile, Type } from 'ts-morph'
import { Project, ts } from 'ts-morph'

const a = ['methods', 'data', 'computed']
const b = ['PropertyAssignment', 'MethodDeclaration']

function getMethodsFunctions(filePath: string) {
  const project = new Project()
  const file: SourceFile = project.addSourceFileAtPath(filePath)
  const methodsPropertyAssignment: PropertyAssignment[] = []

  file.forEachDescendant((node: Node) => {
    const name = node.getSymbol()?.getEscapedName() as string
    if (b.includes(node.getKindName()) && a.includes(name))
      methodsPropertyAssignment.push(extractNodeVal(node as PropertyAssignment, name))
  })

  return methodsPropertyAssignment
}

function extractNodeVal(node: PropertyAssignment | MethodDeclaration, key: string) {
  const result = {}
  // 解析对象形式
  if (node.getKindName() === 'PropertyAssignment') {
    ((node as PropertyAssignment).getInitializer() as unknown as Type)?.getProperties()?.forEach((item: any) => {
      result[item.getSymbol()?.getEscapedName()] = [item.getText(), item.getStart()]
    })
  }
  // 解析函数形式
  else if (node.getKindName() === 'MethodDeclaration' && key === 'data') {
    const returnBody = (node as MethodDeclaration).getBody()
    const returnNode = returnBody?.getChildrenOfKind(ts.SyntaxKind.ReturnStatement)[0]
    const returnValNode = returnNode?.getDescendantsOfKind(ts.SyntaxKind.ObjectLiteralExpression)[0]

    for (const item of (returnValNode?.getProperties() || [])) {
      // 若data返回值里有对象字面量则需获取对应的值
      if (item.getKindName() === 'ShorthandPropertyAssignment') {
        returnBody?.forEachChild((bodyNode) => {
          // 获取block内除return的节点
          if (bodyNode.getKindName() !== 'ReturnStatement') {
            bodyNode?.forEachDescendant((declareNode) => {
              // Identifier节点没有想要的value
              if (declareNode.getKindName() !== 'Identifier') {
                // 获取定义在return里的对象字面量的值
                const name = declareNode.getSymbol()?.getEscapedName()
                if (name && name === item.getSymbol()?.getEscapedName())
                  result[name] = [declareNode.getText(), item.getStart()]
              }
            })
          }
        })
        continue
      }
      const name = item.getSymbol()?.getEscapedName()
      if (name)
        result[name] = [item.getText(), item.getStart()]
    }
  }
  return result
}

const filePath = '/Users/hewancong/Desktop/project/code/go-to-better/test.ts' // 替换成你的 TypeScript 文件路径
const methodsFunctions = getMethodsFunctions(filePath)
console.log('🚀 ~ file: ts-test.ts:32 ~ methodsFunctions:', methodsFunctions)
