import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
const manual=readFileSync(new URL('../src/features/manual/components/ManualPage.tsx',import.meta.url),'utf8')
test('manual explains automatic routing, labels, selection and explicit save',()=>{
  for(const text of ['leer las flechas y destacar una ruta','cuatro lados','línea fina discontinua','Las demás siguen visibles','espacio vacío del lienzo','Arrastrar una tarjeta sí cambia','no los recorridos gráficos']) assert.ok(manual.includes(text),text)
})
test('manual retains resource references, permissions and private export documentation',()=>{
  for(const text of ['Recursos relacionados en el guion privado','biblioteca reutilizable','Consultar ficha','no lo publica ni cambia sus permisos','descripción y nota privada','La exportación compartida no añade estas referencias ni secretos']) assert.ok(manual.includes(text),text)
})
