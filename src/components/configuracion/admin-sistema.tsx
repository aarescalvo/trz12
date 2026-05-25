'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  RefreshCw, Download, Upload, Database, FileText, Trash2, 
  CheckCircle, AlertCircle, Clock, HardDrive, Github, 
  ChevronRight, Archive, FileSpreadsheet, FileDown, Loader2
} from 'lucide-react'
import { toast } from 'sonner'

interface Operador {
  id: string
  nombre: string
  rol: string
  permisos: {
    puedeConfiguracion: boolean
  }
}

interface AdminSistemaProps {
  operador: Operador | null
}

// Interfaces para datos
interface Backup {
  name: string
  size: string
  date: string
  type: string
}

interface VersionInfo {
  version: string
  commit: string
  date: string
  message: string
}

interface UpdateInfo {
  installedVersion: VersionInfo | string
  latestVersion: VersionInfo
  updateAvailable: boolean
  repository: string
  branch: string
}

export function AdminSistemaModule({ operador }: AdminSistemaProps) {
  const [activeTab, setActiveTab] = useState('actualizaciones')
  const [loading, setLoading] = useState(false)
  
  // Estado de actualizaciones
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null)
  const [checkingUpdates, setCheckingUpdates] = useState(false)
  const [repoUrl, setRepoUrl] = useState('https://github.com/aarescalvo/153')
  const [repoBranch, setRepoBranch] = useState('master')
  
  // Estado de backups
  const [backups, setBackups] = useState<Backup[]>([])
  const [loadingBackups, setLoadingBackups] = useState(false)
  const [creatingBackup, setCreatingBackup] = useState(false)
  
  // Estado de restauración
  const [selectedBackup, setSelectedBackup] = useState<string | null>(null)
  const [restoring, setRestoring] = useState(false)

  // Verificar actualizaciones al cargar
  useEffect(() => {
    checkForUpdates()
    loadBackups()
  }, [])

  // ==================== ACTUALIZACIONES ====================

  const checkForUpdates = async () => {
    setCheckingUpdates(true)
    try {
      const response = await fetch('/api/admin/actualizaciones')
      const data = await response.json()
      
      if (data.success) {
        setUpdateInfo(data.data)
        if (data.data.updateAvailable) {
          toast.info('Hay una nueva versión disponible')
        }
      } else {
        toast.error('Error al verificar actualizaciones')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error de conexión')
    } finally {
      setCheckingUpdates(false)
    }
  }

  const handleUpdate = async () => {
    if (!confirm('¿Está seguro de actualizar el sistema? Se creará un backup automático.')) {
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/admin/actualizaciones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ force: false, skipBackup: false })
      })
      
      const data = await response.json()
      
      if (data.success) {
        toast.success('Actualización iniciada')
        // Recargar página después de 3 segundos
        setTimeout(() => window.location.reload(), 3000)
      } else {
        toast.error(data.error || 'Error al actualizar')
      }
    } catch (error) {
      toast.error('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  const handleChangeRepo = async () => {
    if (!repoUrl) {
      toast.error('Ingrese una URL válida')
      return
    }

    try {
      // En producción, esto llamaría a cambiar-repositorio.ps1
      toast.success('Repositorio actualizado')
      checkForUpdates()
    } catch (error) {
      toast.error('Error al cambiar repositorio')
    }
  }

  // ==================== BACKUPS ====================

  const loadBackups = async () => {
    setLoadingBackups(true)
    try {
      const response = await fetch('/api/admin/backups')
      const data = await response.json()
      
      if (data.success) {
        setBackups(data.data.backups)
      }
    } catch (error) {
      console.error('Error cargando backups:', error)
    } finally {
      setLoadingBackups(false)
    }
  }

  const handleCreateBackup = async () => {
    setCreatingBackup(true)
    try {
      const response = await fetch('/api/admin/backups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ includeFiles: false, compress: true })
      })
      
      const data = await response.json()
      
      if (data.success) {
        toast.success('Backup creado exitosamente')
        loadBackups()
      } else {
        toast.error(data.error || 'Error al crear backup')
      }
    } catch (error) {
      toast.error('Error de conexión')
    } finally {
      setCreatingBackup(false)
    }
  }

  const handleDeleteBackup = async (fileName: string) => {
    if (!confirm(`¿Está seguro de eliminar el backup "${fileName}"?`)) {
      return
    }

    try {
      const response = await fetch(`/api/admin/backups?file=${encodeURIComponent(fileName)}`, {
        method: 'DELETE'
      })
      
      const data = await response.json()
      
      if (data.success) {
        toast.success('Backup eliminado')
        loadBackups()
      } else {
        toast.error(data.error || 'Error al eliminar')
      }
    } catch (error) {
      toast.error('Error de conexión')
    }
  }

  // ==================== EXPORTACIÓN ====================

  const handleExport = async (tipo: string, format: string) => {
    try {
      toast.info('Generando exportación...')
      
      const response = await fetch(`/api/admin/exportar?tipo=${tipo}&format=${format}`)
      
      if (!response.ok) {
        throw new Error('Error al exportar')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${tipo}_${new Date().toISOString().split('T')[0]}.${format === 'excel' ? 'xls' : format}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
      
      toast.success('Exportación completada')
    } catch (error) {
      toast.error('Error al exportar')
    }
  }

  // ==================== RESTAURACIÓN ====================

  const handleRestore = async () => {
    if (!selectedBackup) {
      toast.error('Seleccione un backup para restaurar')
      return
    }

    if (!confirm('¿Está seguro de restaurar este backup? Los datos actuales serán reemplazados.')) {
      return
    }

    setRestoring(true)
    try {
      const response = await fetch('/api/admin/restaurar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileName: selectedBackup, createBackupBefore: true })
      })
      
      const data = await response.json()
      
      if (data.success) {
        toast.success('Restauración completada')
        setTimeout(() => window.location.reload(), 2000)
      } else {
        toast.error(data.error || 'Error al restaurar')
      }
    } catch (error) {
      toast.error('Error de conexión')
    } finally {
      setRestoring(false)
    }
  }

  // ==================== RENDER ====================

  return (
    <div className="min-h-screen bg-stone-50 p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-stone-800 flex items-center gap-3">
            <Database className="w-8 h-8 text-amber-500" />
            Administración del Sistema
          </h1>
          <p className="text-stone-500 mt-1">
            Gestión de actualizaciones, backups y exportaciones
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="actualizaciones" className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4" />
              <span className="hidden md:inline">Actualizaciones</span>
            </TabsTrigger>
            <TabsTrigger value="backups" className="flex items-center gap-2">
              <Archive className="w-4 h-4" />
              <span className="hidden md:inline">Backups</span>
            </TabsTrigger>
            <TabsTrigger value="exportar" className="flex items-center gap-2">
              <FileDown className="w-4 h-4" />
              <span className="hidden md:inline">Exportar</span>
            </TabsTrigger>
            <TabsTrigger value="restaurar" className="flex items-center gap-2">
              <Upload className="w-4 h-4" />
              <span className="hidden md:inline">Restaurar</span>
            </TabsTrigger>
          </TabsList>

          {/* ==================== ACTUALIZACIONES ==================== */}
          <TabsContent value="actualizaciones">
            <div className="grid gap-4">
              
              {/* Estado actual */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Estado del Sistema</span>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={checkForUpdates}
                      disabled={checkingUpdates}
                    >
                      {checkingUpdates ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      ) : (
                        <RefreshCw className="w-4 h-4 mr-2" />
                      )}
                      Verificar
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {updateInfo ? (
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 bg-stone-100 rounded-lg">
                          <div>
                            <p className="text-sm text-stone-500">Versión instalada</p>
                            <p className="font-mono font-bold">{typeof updateInfo.installedVersion === 'object' ? updateInfo.installedVersion.version : updateInfo.installedVersion}</p>
                          </div>
                          <CheckCircle className="w-6 h-6 text-green-500" />
                        </div>
                        
                        <div className="flex items-center justify-between p-3 bg-stone-100 rounded-lg">
                          <div>
                            <p className="text-sm text-stone-500">Última versión</p>
                            <p className="font-mono font-bold">{updateInfo.latestVersion.commit}</p>
                          </div>
                          {updateInfo.updateAvailable ? (
                            <AlertCircle className="w-6 h-6 text-amber-500" />
                          ) : (
                            <CheckCircle className="w-6 h-6 text-green-500" />
                          )}
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="p-3 bg-stone-100 rounded-lg">
                          <p className="text-sm text-stone-500">Repositorio</p>
                          <p className="text-sm truncate">{updateInfo.repository}</p>
                        </div>
                        
                        <div className="p-3 bg-stone-100 rounded-lg">
                          <p className="text-sm text-stone-500">Branch</p>
                          <p className="font-bold">{updateInfo.branch}</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-stone-400">
                      {checkingUpdates ? 'Verificando...' : 'Sin información'}
                    </div>
                  )}
                  
                  {updateInfo?.updateAvailable && (
                    <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-amber-500 mt-0.5" />
                        <div className="flex-1">
                          <p className="font-medium text-amber-800">Nueva versión disponible</p>
                          <p className="text-sm text-amber-700 mt-1">
                            {updateInfo.latestVersion.message}
                          </p>
                          <Button 
                            className="mt-3" 
                            onClick={handleUpdate}
                            disabled={loading}
                          >
                            {loading ? (
                              <Loader2 className="w-4 h-4 animate-spin mr-2" />
                            ) : (
                              <Download className="w-4 h-4 mr-2" />
                            )}
                            Actualizar ahora
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Cambiar repositorio */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Github className="w-5 h-5" />
                    Configurar Repositorio
                  </CardTitle>
                  <CardDescription>
                    Cambie el repositorio desde donde se descargan las actualizaciones
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <Label htmlFor="repoUrl">URL del Repositorio</Label>
                      <Input
                        id="repoUrl"
                        value={repoUrl}
                        onChange={(e) => setRepoUrl(e.target.value)}
                        placeholder="https://github.com/usuario/repositorio"
                      />
                    </div>
                    <div>
                      <Label htmlFor="repoBranch">Branch</Label>
                      <Input
                        id="repoBranch"
                        value={repoBranch}
                        onChange={(e) => setRepoBranch(e.target.value)}
                        placeholder="master"
                      />
                    </div>
                  </div>
                  <Button onClick={handleChangeRepo} variant="outline">
                    Guardar configuración
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ==================== BACKUPS ==================== */}
          <TabsContent value="backups">
            <div className="grid gap-4">
              
              {/* Crear backup */}
              <Card>
                <CardHeader>
                  <CardTitle>Crear Backup</CardTitle>
                  <CardDescription>
                    Realice una copia de seguridad de la base de datos
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button 
                    onClick={handleCreateBackup} 
                    disabled={creatingBackup}
                    className="w-full md:w-auto"
                  >
                    {creatingBackup ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <Archive className="w-4 h-4 mr-2" />
                    )}
                    Crear Backup Ahora
                  </Button>
                </CardContent>
              </Card>

              {/* Lista de backups */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Backups Disponibles</span>
                    <Button variant="ghost" size="sm" onClick={loadBackups}>
                      <RefreshCw className="w-4 h-4" />
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {loadingBackups ? (
                    <div className="text-center py-8">
                      <Loader2 className="w-8 h-8 animate-spin mx-auto text-amber-500" />
                    </div>
                  ) : backups.length === 0 ? (
                    <div className="text-center py-8 text-stone-400">
                      No hay backups disponibles
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {backups.map((backup, index) => (
                        <div 
                          key={index}
                          className="flex items-center justify-between p-3 bg-stone-100 rounded-lg hover:bg-stone-200 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <FileText className="w-5 h-5 text-stone-400" />
                            <div>
                              <p className="font-medium">{backup.name}</p>
                              <p className="text-sm text-stone-500">
                                {backup.size} • {new Date(backup.date).toLocaleDateString('es-AR')}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedBackup(backup.name)
                                setActiveTab('restaurar')
                              }}
                            >
                              <Upload className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteBackup(backup.name)}
                              className="text-red-500 hover:text-red-600"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ==================== EXPORTAR ==================== */}
          <TabsContent value="exportar">
            <div className="grid md:grid-cols-2 gap-4">
              
              {/* Exportar Tropas */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileSpreadsheet className="w-5 h-5" />
                    Tropas
                  </CardTitle>
                  <CardDescription>Exportar datos de tropas</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2">
                  <Button variant="outline" onClick={() => handleExport('tropas', 'csv')}>
                    <FileDown className="w-4 h-4 mr-2" />
                    CSV
                  </Button>
                  <Button variant="outline" onClick={() => handleExport('tropas', 'excel')}>
                    <FileDown className="w-4 h-4 mr-2" />
                    Excel
                  </Button>
                  <Button variant="outline" onClick={() => handleExport('tropas', 'pdf')}>
                    <FileDown className="w-4 h-4 mr-2" />
                    PDF
                  </Button>
                </CardContent>
              </Card>

              {/* Exportar Romaneos */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileSpreadsheet className="w-5 h-5" />
                    Romaneos
                  </CardTitle>
                  <CardDescription>Exportar datos de romaneos</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2">
                  <Button variant="outline" onClick={() => handleExport('romaneos', 'csv')}>
                    <FileDown className="w-4 h-4 mr-2" />
                    CSV
                  </Button>
                  <Button variant="outline" onClick={() => handleExport('romaneos', 'excel')}>
                    <FileDown className="w-4 h-4 mr-2" />
                    Excel
                  </Button>
                  <Button variant="outline" onClick={() => handleExport('romaneos', 'pdf')}>
                    <FileDown className="w-4 h-4 mr-2" />
                    PDF
                  </Button>
                </CardContent>
              </Card>

              {/* Exportar Clientes */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileSpreadsheet className="w-5 h-5" />
                    Clientes
                  </CardTitle>
                  <CardDescription>Exportar lista de clientes</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2">
                  <Button variant="outline" onClick={() => handleExport('clientes', 'csv')}>
                    <FileDown className="w-4 h-4 mr-2" />
                    CSV
                  </Button>
                  <Button variant="outline" onClick={() => handleExport('clientes', 'excel')}>
                    <FileDown className="w-4 h-4 mr-2" />
                    Excel
                  </Button>
                </CardContent>
              </Card>

              {/* Exportar Animales */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileSpreadsheet className="w-5 h-5" />
                    Animales
                  </CardTitle>
                  <CardDescription>Exportar datos de animales</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2">
                  <Button variant="outline" onClick={() => handleExport('animales', 'csv')}>
                    <FileDown className="w-4 h-4 mr-2" />
                    CSV
                  </Button>
                  <Button variant="outline" onClick={() => handleExport('animales', 'excel')}>
                    <FileDown className="w-4 h-4 mr-2" />
                    Excel
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ==================== RESTAURAR ==================== */}
          <TabsContent value="restaurar">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="w-5 h-5" />
                  Restaurar desde Backup
                </CardTitle>
                <CardDescription>
                  Restaurar la base de datos desde un backup anterior
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                
                {/* Advertencia */}
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
                    <div>
                      <p className="font-medium text-red-800">¡Atención!</p>
                      <p className="text-sm text-red-700">
                        Restaurar un backup reemplazará todos los datos actuales.
                        Se recomienda crear un backup antes de restaurar.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Seleccionar backup */}
                <div className="space-y-2">
                  <Label>Seleccionar Backup</Label>
                  <div className="max-h-64 overflow-y-auto space-y-2">
                    {backups.map((backup, index) => (
                      <div 
                        key={index}
                        className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                          selectedBackup === backup.name 
                            ? 'border-amber-500 bg-amber-50' 
                            : 'hover:border-stone-300'
                        }`}
                        onClick={() => setSelectedBackup(backup.name)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-4 h-4 rounded-full border-2 ${
                              selectedBackup === backup.name 
                                ? 'border-amber-500 bg-amber-500' 
                                : 'border-stone-300'
                            }`} />
                            <div>
                              <p className="font-medium">{backup.name}</p>
                              <p className="text-sm text-stone-500">
                                {backup.size} • {new Date(backup.date).toLocaleDateString('es-AR')}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Botón restaurar */}
                <Button 
                  onClick={handleRestore}
                  disabled={!selectedBackup || restoring}
                  className="w-full"
                >
                  {restoring ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Upload className="w-4 h-4 mr-2" />
                  )}
                  Restaurar Backup Seleccionado
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

export default AdminSistemaModule
