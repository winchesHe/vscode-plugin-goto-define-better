import { simple } from 'acorn-walk'
import acorn from 'acorn'

const code = `
'import store from '@/store'

const { body } = document
const WIDTH = 992 // refer to Bootstrap's responsive design
export default {
  watch: {
    $route(route) {
      if (this.device === 'mobile' && this.sidebar.opened) {
        store.dispatch('app/closeSideBar', { withoutAnimation: false })
      }
    }
  },
  beforeMount() {
    window.addEventListener('resize', this.$_resizeHandler)
  beforeDestroy() {
    window.removeEventListener('resize', this.$_resizeHandler)
  mounted() {
    const isMobile = this.$_isMobile()
    if (isMobile) {
      store.dispatch('app/toggleDevice', 'mobile')
      store.dispatch('app/closeSideBar', { withoutAnimation: true })
  methods: {
    test() {
      return 'test'
    },
    // use $_ for mixins properties
    // https://vuejs.org/v2/style-guide/index.html#Private-property-names-essential
    $_isMobile() {
      const rect = body.getBoundingClientRect()
      return rect.width - 1 < WIDTH
    $_resizeHandler() {
      if (!document.hidden) {
        const isMobile = this.$_isMobile()
        store.dispatch('app/toggleDevice', isMobile ? 'mobile' : 'desktop')
        if (isMobile) {
          store.dispatch('app/closeSideBar', { withoutAnimation: true })
        }
  }
}'
`

const ast = acorn.parse(code, { sourceType: 'module', ecmaVersion: 'latest' })
const targetProperties = ['data', 'computed', 'methods']
const properties = {}
simple(ast, {
  ObjectExpression(node: any) {
    node.properties.forEach((property) => {
      if (
        property.key.type === 'Identifier'
        && targetProperties.includes(property.key.name)
      ) {
        const value = evaluatePropertyValue(property.value, property.key.name)
        properties[property.key.name] = value
      }
    })
  },
})
function evaluatePropertyValue(node, name?) {
  if (node.type === 'ObjectExpression') {
    const value = {}
    node.properties.forEach((property) => {
      if (property.key.type === 'Identifier')
        value[property.key.name] = [evaluatePropertyValue(property.value), property.key.start]
    })
    return value
  }
  else if (node.type === 'FunctionExpression' || node.type === 'ArrowFunctionExpression') {
    if (node.body.type === 'BlockStatement' && name === 'data') {
      const property = node.body.body.find(item => item.type === 'ReturnStatement')?.argument
      if (property)
        return evaluatePropertyValue(property)
    }
    return code.substring(node.body.start + 1, node.body.end - 1)
  }
  else if (node.type === 'ArrayExpression') {
    return code.substring(node.start, node.end)
  }
  else {
    return node.value
  }
}

console.log(properties)
