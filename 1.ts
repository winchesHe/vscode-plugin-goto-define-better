const acorn = require('acorn')
const walk = require('acorn-walk')

const code = `const a = 
{
  "compilerOptions": {
    "outDir": "dist",
    "target": "es2018",
    "module": "esnext",
    "baseUrl": ".",
    "sourceMap": false,
    "moduleResolution": "node",
    "allowJs": false,
    "strict": true,
    "noUnusedLocals": true,
    "resolveJsonModule": true,
    "allowSyntheticDefaultImports": true,
    "esModuleInterop": true,
    "removeComments": false,
    "rootDir": ".",
    "types": [],
    "paths": {
      "@element-plus/*": ["packages/*"]
    }
  }
}
`

const ast = acorn.parse(code, { sourceType: 'module' })

let pathsValue = null

walk.simple(ast, {
  Property(node) {
    if (node.key.type === 'Literal' && node.key.value === 'paths') {
      if (node.value.type === 'ObjectExpression')
        pathsValue = extractPathsValue(node.value)
    }
  },
})

console.log(pathsValue)

function extractPathsValue(node) {
  const paths = {}

  node.properties.forEach((property) => {
    if (property.value.type === 'ArrayExpression' && property.value.elements.length === 1) {
      const pathKey = property.key.value
      const pathValue = property.value.elements[0].value
      paths[pathKey] = pathValue
    }
  })

  return paths
}
