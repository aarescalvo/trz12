import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import fs from 'fs';
import path from 'path';
import archiver from 'archiver';
import { checkPermission } from '@/lib/auth-helpers'

// Allowlist de tipos de backup válidos (previene path traversal)
const VALID_BACKUP_TYPES = ['MANUAL', 'AUTOMATICO', 'DIARIO', 'SEMANAL', 'MENSUAL', 'PRE_RESTORE']

// POST - Ejecutar backup manual
export async function POST(request: NextRequest) {
  const authError = await checkPermission(request, 'puedeConfiguracion')
  if (authError) return authError

  try {
    const body = await request.json();
    const tipo = body.tipo || 'MANUAL';
    
    // Validar que el tipo de backup esté en la allowlist (previene path traversal en el nombre de archivo)
    if (!VALID_BACKUP_TYPES.includes(tipo)) {
      return NextResponse.json({ 
        error: `Tipo de backup inválido. Tipos permitidos: ${VALID_BACKUP_TYPES.join(', ')}` 
      }, { status: 400 });
    }
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
    const nombreArchivo = `backup-${tipo.toLowerCase()}-${timestamp}.zip`;
    const backupDir = path.join(process.cwd(), 'backups');
    
    // Crear directorio si no existe
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    
    const rutaArchivo = path.join(backupDir, nombreArchivo);
    
    // Ruta de la base de datos
    const dbPath = path.join(process.cwd(), 'db', 'custom.db');
    
    // Verificar si la base de datos existe
    if (!fs.existsSync(dbPath)) {
      return NextResponse.json({ error: 'Base de datos no encontrada' }, { status: 404 });
    }
    
    // Crear archivo ZIP
    const output = fs.createWriteStream(rutaArchivo);
    const archive = archiver('zip', { zlib: { level: 9 } });
    
    // Promise para manejar la creación del ZIP
    const createZip = new Promise<void>((resolve, reject) => {
      output.on('close', () => resolve());
      archive.on('error', (err) => reject(err));
      
      archive.pipe(output);
      
      // Agregar archivo de base de datos
      const dbStats = fs.statSync(dbPath);
      archive.file(dbPath, { 
        name: 'database.sqlite',
        date: new Date(),
        mode: 0o644
      });
      
      // Agregar archivo de información del backup
      const backupInfo = {
        fecha: new Date().toISOString(),
        tipo: tipo,
        version: '1.0.0',
        sistema: 'Solemar Alimentaria - Sistema de Gestión Frigorífica',
        baseDatos: {
          archivo: 'database.sqlite',
          tamanoOriginal: dbStats.size
        }
      };
      
      archive.append(JSON.stringify(backupInfo, null, 2), { 
        name: 'backup-info.json' 
      });
      
      // Agregar prisma schema si existe
      const schemaPath = path.join(process.cwd(), 'prisma', 'schema.prisma');
      if (fs.existsSync(schemaPath)) {
        archive.file(schemaPath, { name: 'schema.prisma' });
      }
      
      archive.finalize();
    });
    
    await createZip;
    
    const stats = fs.statSync(rutaArchivo);
    
    // Contar registros en la base de datos para el reporte
    const tablasIncluidas = [
      'Animales',
      'Clientes', 
      'Corrales',
      'Camaras',
      'Facturas',
      'Tropas',
      'Despachos'
    ];
    
    // Registrar en historial
    const historial = await db.historialBackup.create({
      data: {
        tipo,
        nombreArchivo,
        rutaArchivo,
        tamanio: stats.size,
        tablasIncluidas: tablasIncluidas.join(','),
        estado: 'COMPLETADO'
      }
    });
    
    // Actualizar configuración
    const config = await db.configuracionBackup.findFirst();
    if (config) {
      await db.configuracionBackup.update({
        where: { id: config.id },
        data: {
          ultimoBackup: new Date(),
          ultimoExitoso: true,
          tamanoUltimo: stats.size
        }
      });
    } else {
      await db.configuracionBackup.create({
        data: {
          ultimoBackup: new Date(),
          ultimoExitoso: true,
          tamanoUltimo: stats.size,
          backupDiario: true,
          horaBackup: '02:00',
          retenerDias: 30,
          nubeHabilitado: false
        }
      });
    }
    
    return NextResponse.json({
      success: true,
      historial: {
        id: historial.id,
        nombreArchivo: historial.nombreArchivo,
        tamanio: historial.tamanio,
        fecha: historial.fecha,
        estado: historial.estado
      },
      mensaje: 'Backup creado exitosamente',
      tamano: stats.size,
      tamanoFormateado: formatSize(stats.size)
    });
  } catch (error) {
    console.error('Error al ejecutar backup:', error);
    
    // Registrar error
    try {
      await db.historialBackup.create({
        data: {
          tipo: 'MANUAL',
          nombreArchivo: 'error',
          rutaArchivo: '',
          tamanio: 0,
          estado: 'ERROR',
          mensajeError: String(error)
        }
      });
    } catch (dbError) {
      console.error('Error al registrar fallo:', dbError);
    }
    
    return NextResponse.json({ error: 'Error al ejecutar backup' }, { status: 500 });
  }
}

// Helper para formatear tamaño
function formatSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}
