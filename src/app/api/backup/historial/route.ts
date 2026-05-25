import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import fs from 'fs';
import { checkPermission } from '@/lib/auth-helpers'

// GET - Historial de backups
export async function GET(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeConfiguracion')
  if (authError) return authError

  try {
    const { searchParams } = new URL(request.url);
    const limite = parseInt(searchParams.get('limite') || '50');
    const tipo = searchParams.get('tipo');
    
    const where: any = {};
    if (tipo) where.tipo = tipo;
    
    const historial = await db.historialBackup.findMany({
      where,
      orderBy: { fecha: 'desc' },
      take: limite
    });
    
    return NextResponse.json(historial);
  } catch (error) {
    console.error('Error al obtener historial:', error);
    return NextResponse.json({ error: 'Error al obtener historial' }, { status: 500 });
  }
}

// DELETE - Eliminar un backup
export async function DELETE(request: NextRequest) {
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
    
    // Eliminar archivo físico si existe
    try {
      if (fs.existsSync(backup.rutaArchivo)) {
        fs.unlinkSync(backup.rutaArchivo);
      }
    } catch (fileError) {
      console.error('Error al eliminar archivo:', fileError);
      // Continuar aunque falle la eliminación del archivo
    }
    
    // Eliminar registro de la base de datos
    await db.historialBackup.delete({
      where: { id }
    });
    
    return NextResponse.json({ success: true, message: 'Backup eliminado correctamente' });
  } catch (error) {
    console.error('Error al eliminar backup:', error);
    return NextResponse.json({ error: 'Error al eliminar backup' }, { status: 500 });
  }
}
