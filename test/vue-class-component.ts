import type { ModifierableNode, SourceFile, Type } from 'ts-morph'
import { Project, ts } from 'ts-morph'
const str = `
import Vue from 'vue'
import Component from 'vue-class-component'

@Component
export default class HelloWorld extends Vue {
  private firstName = 'John'
  protected firstName = 'John'
  lastName = 'Doe'

  // Declared as computed property getter
  get name() {
    return this.firstName + ' ' + this.lastName
  }

  // Declared as computed property setter
  set name(value) {
    const splitted = value.split(' ')
    this.firstName = splitted[0]
    this.lastName = splitted[1] || ''
  }
  hello() {
    console.log('Hello World!')
  }
}`

const vueClassKindType = ['PropertyDeclaration', 'GetAccessor', 'MethodDeclaration']

function getVueClassMixinsData(filePath: string) {
  const project = new Project()
  const file: SourceFile = project.addSourceFileAtPath('/Users/hewancong/Desktop/project/code/go-to-better/test/test.ts')
  const result = {}

  const classNode = file.getChildrenOfKind(ts.SyntaxKind.ClassDeclaration)[0]
  classNode?.forEachChild((node) => {
    const name = node.getSymbol()?.getEscapedName()
    const kindName = node.getKindName()

    if (vueClassKindType.includes(kindName) && name) {
      const modifiers = (node as unknown as ModifierableNode).getModifiers?.()?.[0]?.getKindName()

      // 如果是 private 属性则不处理
      if (modifiers !== 'PrivateKeyword')
        result[name] = [node.getText(), node.getStart()]
    }
  })

  return result
}

getVueClassMixinsData()
console.log('🚀 ~ file: vue-class-component.ts:53 ~ getVueClassMixinsData():', getVueClassMixinsData())
