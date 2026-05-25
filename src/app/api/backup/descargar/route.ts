import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import fs from 'fs';
import path from 'path';
import { checkPermission } from '@/lib/auth-helpers'

// GET - Descargar archivo de backup
export async function GET(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeConfiguracion')
  if (authError) return authError

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'ID de backup requerido' }, { status: 400 });
    }
    
    const backup = await db.historialBackup.findUnique({
      where: { id }
    });
    
    if (!backup) {
      return NextResponse.json({ error: 'Backup no encontrado' }, { status: 404 });
    }
    
    // Validar que la ruta del archivo está dentro del directorio de backups (previene arbitrary file read)
    const backupDir = path.resolve(path.join(process.cwd(), 'backups'));
    const resolvedRutaArchivo = path.resolve(backup.rutaArchivo);
    if (!resolvedRutaArchivo.startsWith(backupDir)) {
      return NextResponse.json({ error: 'Ruta de archivo no autorizada' }, { status: 403 });
    }
    
    // Verificar si el archivo existe
    if (!fs.existsSync(backup.rutaArchivo)) {
      return NextResponse.json({ error: 'Archivo de backup no encontrado' }, { status: 404 });
    }
    
    // Leer archivo
    const fileBuffer = fs.readFileSync(resolvedRutaArchivo);
    
    // Devolver como descarga
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${backup.nombreArchivo}"`,
        'Content-Length': (backup.tamanio || 0).toString()
      }
    });
  } catch (error) {
    console.error('Error al descargar backup:', error);
    return NextResponse.json({ error: 'Error al descargar backup' }, { status: 500 });
  }
}
