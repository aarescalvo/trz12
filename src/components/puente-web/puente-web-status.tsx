'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  RefreshCw, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle,
  Database,
  Globe,
  ArrowRightLeft
} from 'lucide-react';
import { createLogger } from '@/lib/logger';
const log = createLogger('components.puente-web.puente-web-status');

interface PuenteEstado {
  estado: {
    afip: { conectado: boolean; ultimoAcceso: string | null; error: string | null };
    sigica: { conectado: boolean; ultimoAcceso: string | null; error: string | null };
  };
  conexion: {
    afip: { ok: boolean; mensaje: string };
    sigica: { ok: boolean; mensaje: string };
  };
  timestamp: string;
}

export function PuenteWebStatus() {
  const [estado, setEstado] = useState<PuenteEstado | null>(null);
  const [loading, setLoading] = useState(true);
  const [sincronizando, setSincronizando] = useState(false);

  const cargarEstado = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/puente-web/estado');
      const data = await res.json();
      setEstado(data);
    } catch (error) {
      console.error('Error cargando estado:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarEstado();
    const interval = setInterval(cargarEstado, 60000); // Actualizar cada minuto
    return () => clearInterval(interval);
  }, []);

  const sincronizar = async (servicio?: 'afip' | 'sigica') => {
    setSincronizando(true);
    try {
      const res = await fetch('/api/puente-web/sincronizar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ servicio }),
      });
      const data = await res.json();
      log.info(`Sincronización: ${data}`);
      await cargarEstado();
    } catch (error) {
      console.error('Error sincronizando:', error);
    } finally {
      setSincronizando(false);
    }
  };

  const StatusBadge = ({ ok, error }: { ok: boolean; error?: string | null }) => {
    if (ok) {
      return (
        <Badge variant="default" className="bg-green-600">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          Conectado
        </Badge>
      );
    }
    if (error) {
      return (
        <Badge variant="destructive">
          <XCircle className="h-3 w-3 mr-1" />
          Error
        </Badge>
      );
    }
    return (
      <Badge variant="secondary">
        <AlertTriangle className="h-3 w-3 mr-1" />
        No configurado
      </Badge>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ArrowRightLeft className="h-5 w-5" />
          Puente Web
        </CardTitle>
        <CardDescription>
          Estado de conexión con AFIP y SIGICA
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* AFIP Status */}
              <div className="p-4 border rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Database className="h-5 w-5 text-blue-600" />
                    <span className="font-medium">AFIP</span>
                  </div>
                  <StatusBadge 
                    ok={estado?.conexion.afip.ok ?? false} 
                    error={estado?.estado.afip.error}
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  {estado?.conexion.afip.mensaje || 'No configurado'}
                </p>
                {estado?.estado.afip.error && (
                  <p className="text-xs text-destructive">{estado.estado.afip.error}</p>
                )}
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => sincronizar('afip')}
                  disabled={sincronizando}
                >
                  <RefreshCw className={`h-3 w-3 mr-1 ${sincronizando ? 'animate-spin' : ''}`} />
                  Sincronizar
                </Button>
              </div>

              {/* SIGICA Status */}
              <div className="p-4 border rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Globe className="h-5 w-5 text-green-600" />
                    <span className="font-medium">SIGICA</span>
                  </div>
                  <StatusBadge 
                    ok={estado?.conexion.sigica.ok ?? false} 
                    error={estado?.estado.sigica.error}
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  {estado?.conexion.sigica.mensaje || 'No configurado'}
                </p>
                {estado?.estado.sigica.error && (
                  <p className="text-xs text-destructive">{estado.estado.sigica.error}</p>
                )}
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => sincronizar('sigica')}
                  disabled={sincronizando}
                >
                  <RefreshCw className={`h-3 w-3 mr-1 ${sincronizando ? 'animate-spin' : ''}`} />
                  Sincronizar
                </Button>
              </div>
            </div>

            <div className="flex justify-between items-center pt-2 border-t">
              <span className="text-xs text-muted-foreground">
                Última actualización: {estado?.timestamp ? new Date(estado.timestamp).toLocaleString() : '-'}
              </span>
              <Button 
                size="sm" 
                variant="ghost"
                onClick={() => sincronizar()}
                disabled={sincronizando}
              >
                <RefreshCw className={`h-3 w-3 mr-1 ${sincronizando ? 'animate-spin' : ''}`} />
                Sincronizar todo
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
