// API functions para el módulo de Rótulos Mejoras

import type { Rotulo, RotuloElement } from './types'

const API_BASE = '/api/rotulos'

// Obtener todos los rótulos
export async function getRotulos(): Promise<Rotulo[]> {
  const res = await fetch(API_BASE)
  const data = await res.json()
  if (!data.success) throw new Error(data.error || 'Error al obtener rótulos')
  return data.data
}

// Obtener un rótulo por ID
export async function getRotuloById(id: string): Promise<Rotulo> {
  const res = await fetch(`${API_BASE}?id=${id}`)
  const data = await res.json()
  if (!data.success) throw new Error(data.error || 'Error al obtener rótulo')
  return data.data
}

// Crear un nuevo rótulo
export async function createRotulo(rotulo: Partial<Rotulo>): Promise<Rotulo> {
  const res = await fetch(API_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(rotulo)
  })
  const data = await res.json()
  if (!data.success) throw new Error(data.error || 'Error al crear rótulo')
  return data.data
}

// Actualizar un rótulo existente
export async function updateRotulo(id: string, rotulo: Partial<Rotulo>): Promise<Rotulo> {
  const res = await fetch(API_BASE, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, ...rotulo })
  })
  const data = await res.json()
  if (!data.success) throw new Error(data.error || 'Error al actualizar rótulo')
  return data.data
}

// Eliminar un rótulo
export async function deleteRotulo(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}?id=${id}`, {
    method: 'DELETE'
  })
  const data = await res.json()
  if (!data.success) throw new Error(data.error || 'Error al eliminar rótulo')
}

// Duplicar un rótulo
export async function duplicarRotulo(id: string): Promise<Rotulo> {
  const original = await getRotuloById(id)
  return createRotulo({
    ...original,
    id: undefined,
    nombre: `${original.nombre} (copia)`,
    codigo: `${original.codigo}-copia`,
    esDefault: false
  })
}

// Establecer como default
export async function setRotuloDefault(id: string): Promise<void> {
  await updateRotulo(id, { esDefault: true })
}

// Agregar elemento a un rótulo
export async function agregarElemento(rotuloId: string, elemento: Partial<RotuloElement>): Promise<Rotulo> {
  const rotulo = await getRotuloById(rotuloId)
  const nuevoElemento: RotuloElement = {
    id: `el-${Date.now()}`,
    tipo: elemento.tipo || 'TEXTO',
    posX: elemento.posX || 0,
    posY: elemento.posY || 0,
    ancho: elemento.ancho || 100,
    alto: elemento.alto || 30,
    fuente: elemento.fuente || '0',
    tamano: elemento.tamano || 10,
    negrita: elemento.negrita || false,
    alineacion: elemento.alineacion || 'LEFT',
    orden: rotulo.elementos.length,
    ...elemento
  }
  return updateRotulo(rotuloId, {
    elementos: [...rotulo.elementos, nuevoElemento]
  })
}

// Actualizar elemento
export async function actualizarElemento(rotuloId: string, elemento: RotuloElement): Promise<Rotulo> {
  const rotulo = await getRotuloById(rotuloId)
  const elementos = rotulo.elementos.map(el => 
    el.id === elemento.id ? elemento : el
  )
  return updateRotulo(rotuloId, { elementos })
}

// Eliminar elemento
export async function eliminarElemento(rotuloId: string, elementoId: string): Promise<Rotulo> {
  const rotulo = await getRotuloById(rotuloId)
  const elementos = rotulo.elementos.filter(el => el.id !== elementoId)
  return updateRotulo(rotuloId, { elementos })
}

// Importar archivo ZPL/DPL
export async function importarRotulo(archivo: File): Promise<Rotulo> {
  const formData = new FormData()
  formData.append('archivo', archivo)
  
  const res = await fetch(`${API_BASE}/importar`, {
    method: 'POST',
    body: formData
  })
  const data = await res.json()
  if (!data.success) throw new Error(data.error || 'Error al importar rótulo')
  return data.data
}

// Exportar rótulo a ZPL/DPL
export async function exportarRotulo(id: string): Promise<string> {
  const res = await fetch(`${API_BASE}/exportar?id=${id}`)
  const data = await res.json()
  if (!data.success) throw new Error(data.error || 'Error al exportar rótulo')
  return data.data.contenido
}

// Vista previa del rótulo
export async function previewRotulo(id: string, datos: Record<string, string>): Promise<string> {
  const res = await fetch(`${API_BASE}/preview`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, datos })
  })
  const data = await res.json()
  if (!data.success) throw new Error(data.error || 'Error al generar vista previa')
  return data.data.preview
}

// Imprimir rótulo de prueba
export async function imprimirPrueba(id: string, impresoraIp: string, puerto: number): Promise<void> {
  const res = await fetch(`${API_BASE}/imprimir`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, impresoraIp, puerto, esPrueba: true })
  })
  const data = await res.json()
  if (!data.success) throw new Error(data.error || 'Error al imprimir prueba')
}

// Generar ZPL desde elementos visuales
export function generarZPL(elementos: RotuloElement[], ancho: number, alto: number, dpi: number): string {
  let zpl = '^XA\n'
  zpl += `^PW${Math.round(ancho * dpi / 25.4)}\n`  // Page width
  zpl += `^LL${Math.round(alto * dpi / 25.4)}\n`   // Label length
  
  for (const el of elementos.sort((a, b) => a.orden - b.orden)) {
    switch (el.tipo) {
      case 'TEXTO':
        zpl += `^FO${el.posX},${el.posY}\n`
        zpl += `^A${el.fuente}N,${el.tamano},${el.tamano}\n`
        zpl += `^FD${el.textoFijo || `{{${el.campo}}}`}\n`
        zpl += `^FS\n`
        break
      case 'CODIGO_BARRAS':
        zpl += `^FO${el.posX},${el.posY}\n`
        zpl += `^BY2,3,${el.altoCodigo || 60}\n`
        zpl += `^B${el.tipoCodigo === 'CODE128' ? 'C' : '3'}N,${el.altoCodigo || 60},${el.mostrarTexto ? 'N' : 'Y'}\n`
        zpl += `^FD${el.textoFijo || `{{${el.campo}}}`}\n`
        zpl += `^FS\n`
        break
      case 'LINEA':
        zpl += `^FO${el.posX},${el.posY}\n`
        zpl += `^GB${el.ancho},${el.grosorLinea || 2},${el.grosorLinea || 2}^FD${el.color || 'B'}^FS\n`
        break
      case 'RECTANGULO':
        zpl += `^FO${el.posX},${el.posY}\n`
        zpl += `^GB${el.ancho},${el.alto},${el.grosorLinea || 2}^FD${el.color || 'B'}^FS\n`
        break
      case 'QR':
        zpl += `^FO${el.posX},${el.posY}\n`
        zpl += `^BQN,2,${Math.round(el.tamano / 5)}\n`
        zpl += `^FD${el.textoFijo || `{{${el.campo}}}`}\n`
        zpl += `^FS\n`
        break
    }
  }
  
  zpl += '^XZ'
  return zpl
}

// Generar DPL desde elementos visuales
export function generarDPL(elementos: RotuloElement[], ancho: number, alto: number, dpi: number): string {
  let dpl = 'STX ESC A\n'
  dpl += `ESC Q ${Math.round(ancho * dpi / 25.4)}\n`
  dpl += `ESC q ${Math.round(alto * dpi / 25.4)}\n`
  
  for (const el of elementos.sort((a, b) => a.orden - b.orden)) {
    switch (el.tipo) {
      case 'TEXTO':
        dpl += `ESC T ${el.fuente};${el.posX};${el.posY};${el.tamano};${el.tamano}\n`
        dpl += `${el.textoFijo || `{{${el.campo}}}`}\n`
        break
      case 'CODIGO_BARRAS':
        dpl += `ESC B ${el.posX};${el.posY};0;${el.tipoCodigo === 'CODE128' ? 'CODE128' : 'CODE39'};${el.altoCodigo || 60}\n`
        dpl += `${el.textoFijo || `{{${el.campo}}}`}\n`
        break
      case 'LINEA':
        dpl += `ESC L ${el.posX};${el.posY};${el.posX + el.ancho};${el.posY};${el.grosorLinea || 2}\n`
        break
      case 'RECTANGULO':
        dpl += `ESC R ${el.posX};${el.posY};${el.posX + el.ancho};${el.posY + el.alto};${el.grosorLinea || 2}\n`
        break
    }
  }
  
  dpl += 'ETX'
  return dpl
}
