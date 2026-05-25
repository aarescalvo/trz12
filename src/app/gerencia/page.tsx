'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  Activity, 
  Package, 
  Truck, 
  FileText, 
  TrendingUp, 
  AlertTriangle,
  RefreshCw,
  Wifi,
  WifiOff,
  ChevronDown
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { motion, AnimatePresence } from 'framer-motion';

interface KPIData {
  kpis: {
    faenaHoy: number;
    kgProducidosHoy: number;
    totalStockMedias: number;
    totalStockKg: number;
    facturasPendientes: number;
    totalAnimalesSemana: number;
    rindePromedio: number;
  };
  faenaHoy: {
    id: string;
    cantidad: number;
    estado: string;
  } | null;
  stock: Array<{
    camara: string;
    cantidad: number;
    pesoTotal: number;
    especie: string;
  }>;
  despachosPendientes?: number;
  alertas?: Array<{
    tipo: string;
    mensaje: string;
    severidad: 'alta' | 'media' | 'baja';
  }>;
  fecha: string;
}

export default function GerenciaPage() {
  const [data, setData] = useState<KPIData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [pullDistance, setPullDistance] = useState(0);
  const [isPulling, setIsPulling] = useState(false);

  const fetchData = useCallback(async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    
    try {
      const res = await fetch('/api/gerencia/resumen');
      if (!res.ok) throw new Error('Error al obtener datos');
      const json = await res.json();
      setData(json);
      setError(null);
      setLastUpdate(new Date());
      
      // Guardar en localStorage para offline
      localStorage.setItem('gerencia-data', JSON.stringify(json));
      localStorage.setItem('gerencia-data-timestamp', new Date().toISOString());
    } catch (err) {
      setError('No se pudieron cargar los datos');
      
      // Intentar cargar datos offline
      const cachedData = localStorage.getItem('gerencia-data');
      if (cachedData) {
        setData(JSON.parse(cachedData));
        setError('Mostrando datos offline');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();

    // Auto-refresh cada 2 minutos (evita re-renders excesivos cada 30s)
    const interval = setInterval(() => {
      if (navigator.onLine) {
        fetchData();
      }
    }, 120000);

    // Escuchar cambios de conexión
    const handleOnline = () => {
      setIsOffline(false);
      fetchData();
    };
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      clearInterval(interval);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [fetchData]);

  // Pull to refresh
  useEffect(() => {
    let startY = 0;

    const handleTouchStart = (e: TouchEvent) => {
      if (window.scrollY === 0) {
        startY = e.touches[0].clientY;
        setIsPulling(true);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isPulling) return;
      const currentY = e.touches[0].clientY;
      const diff = Math.max(0, currentY - startY);
      setPullDistance(Math.min(diff, 100));
    };

    const handleTouchEnd = () => {
      if (pullDistance > 80 && navigator.onLine) {
        fetchData(true);
      }
      setPullDistance(0);
      setIsPulling(false);
    };

    document.addEventListener('touchstart', handleTouchStart);
    document.addEventListener('touchmove', handleTouchMove);
    document.addEventListener('touchend', handleTouchEnd);

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isPulling, pullDistance, fetchData]);

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('es-AR').format(num);
  };

  const formatWeight = (kg: number) => {
    if (kg >= 1000) {
      return `${(kg / 1000).toFixed(1)} tn`;
    }
    return `${formatNumber(Math.round(kg))} kg`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-100 p-4">
        <div className="max-w-lg mx-auto space-y-4">
          <Skeleton className="h-16 w-full rounded-2xl" />
          <div className="grid grid-cols-2 gap-3">
            <Skeleton className="h-32 rounded-2xl" />
            <Skeleton className="h-32 rounded-2xl" />
            <Skeleton className="h-32 rounded-2xl" />
            <Skeleton className="h-32 rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-100">
      {/* Pull indicator */}
      <div 
        className="fixed top-0 left-0 right-0 z-50 flex justify-center transition-all duration-200"
        style={{ 
          transform: `translateY(${pullDistance * 0.5}px)`,
          opacity: pullDistance > 0 ? 1 : 0 
        }}
      >
        <div className="bg-amber-500 text-white rounded-b-full p-3 shadow-lg">
          <RefreshCw 
            className={`w-6 h-6 ${refreshing ? 'animate-spin' : ''}`} 
            style={{ transform: `rotate(${pullDistance * 1.8}deg)` }}
          />
        </div>
      </div>

      {/* Header */}
      <div className="bg-gradient-to-br from-amber-500 to-amber-600 text-white px-4 pt-8 pb-6 rounded-b-3xl shadow-lg">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold">Solemar Gerencia</h1>
              <p className="text-amber-100 text-sm">
                {new Date().toLocaleDateString('es-AR', { 
                  weekday: 'long', 
                  day: 'numeric', 
                  month: 'long' 
                })}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {isOffline ? (
                <Badge variant="destructive" className="gap-1">
                  <WifiOff className="w-3 h-3" />
                  Offline
                </Badge>
              ) : (
                <Badge variant="secondary" className="bg-amber-400/30 text-white gap-1">
                  <Wifi className="w-3 h-3" />
                  Online
                </Badge>
              )}
            </div>
          </div>

          {lastUpdate && (
            <p className="text-xs text-amber-100">
              Actualizado: {lastUpdate.toLocaleTimeString('es-AR')}
            </p>
          )}
        </div>
      </div>

      {/* Error Banner */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="max-w-lg mx-auto px-4 mt-2"
          >
            <div className={`p-3 rounded-xl text-sm flex items-center gap-2 ${
              error.includes('offline') ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'
            }`}>
              <AlertTriangle className="w-4 h-4" />
              {error}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content */}
      <div className="max-w-lg mx-auto p-4 space-y-4">
        {/* KPIs Grid */}
        <div className="grid grid-cols-2 gap-3">
          {/* Faena del Día */}
          <Card className="bg-white border-none shadow-md rounded-2xl overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-stone-500 mb-2">
                <Activity className="w-4 h-4" />
                <span className="text-xs font-medium uppercase">Faena Hoy</span>
              </div>
              <div className="text-3xl font-bold text-stone-800">
                {formatNumber(data?.kpis.faenaHoy || 0)}
              </div>
              <p className="text-xs text-stone-500 mt-1">cabezas</p>
            </CardContent>
          </Card>

          {/* KG Producidos */}
          <Card className="bg-white border-none shadow-md rounded-2xl overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-stone-500 mb-2">
                <TrendingUp className="w-4 h-4" />
                <span className="text-xs font-medium uppercase">Producido</span>
              </div>
              <div className="text-3xl font-bold text-stone-800">
                {formatWeight(data?.kpis.kgProducidosHoy || 0)}
              </div>
              <p className="text-xs text-stone-500 mt-1">hoy</p>
            </CardContent>
          </Card>

          {/* Stock Cámaras */}
          <Card className="bg-white border-none shadow-md rounded-2xl overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-amber-500 mb-2">
                <Package className="w-4 h-4" />
                <span className="text-xs font-medium uppercase">Stock</span>
              </div>
              <div className="text-3xl font-bold text-stone-800">
                {formatNumber(data?.kpis.totalStockMedias || 0)}
              </div>
              <p className="text-xs text-stone-500 mt-1">
                medias · {formatWeight(data?.kpis.totalStockKg || 0)}
              </p>
            </CardContent>
          </Card>

          {/* Despachos Pendientes */}
          <Card className="bg-white border-none shadow-md rounded-2xl overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-blue-500 mb-2">
                <Truck className="w-4 h-4" />
                <span className="text-xs font-medium uppercase">Despachos</span>
              </div>
              <div className="text-3xl font-bold text-stone-800">
                {formatNumber(data?.despachosPendientes || 0)}
              </div>
              <p className="text-xs text-stone-500 mt-1">pendientes</p>
            </CardContent>
          </Card>

          {/* Facturas Pendientes */}
          <Card className="bg-white border-none shadow-md rounded-2xl overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-red-500 mb-2">
                <FileText className="w-4 h-4" />
                <span className="text-xs font-medium uppercase">Facturas</span>
              </div>
              <div className="text-3xl font-bold text-stone-800">
                {formatNumber(data?.kpis.facturasPendientes || 0)}
              </div>
              <p className="text-xs text-stone-500 mt-1">pendientes de cobro</p>
            </CardContent>
          </Card>

          {/* Rendimiento */}
          <Card className="bg-gradient-to-br from-amber-50 to-white border border-amber-100 shadow-md rounded-2xl overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-amber-600 mb-2">
                <TrendingUp className="w-4 h-4" />
                <span className="text-xs font-medium uppercase">Rinde</span>
              </div>
              <div className="text-3xl font-bold text-amber-600">
                {data?.kpis.rindePromedio.toFixed(1) || '0'}%
              </div>
              <p className="text-xs text-stone-500 mt-1">promedio semanal</p>
            </CardContent>
          </Card>
        </div>

        {/* Stock por Cámara */}
        {data?.stock && data.stock.length > 0 && (
          <Card className="bg-white border-none shadow-md rounded-2xl overflow-hidden">
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-sm font-medium text-stone-600 flex items-center gap-2">
                <Package className="w-4 h-4 text-amber-500" />
                Stock por Cámara
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {data.stock.map((s, i) => (
                  <div 
                    key={i}
                    className="flex items-center justify-between py-2 border-b border-stone-100 last:border-0"
                  >
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${
                          s.especie === 'BOVINO' 
                            ? 'border-amber-200 text-amber-700' 
                            : 'border-stone-200 text-stone-600'
                        }`}
                      >
                        {s.especie === 'BOVINO' ? 'Bov' : 'Equ'}
                      </Badge>
                      <span className="text-sm text-stone-700">{s.camara || 'Sin cámara'}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-semibold text-stone-800">
                        {formatNumber(s.cantidad)}
                      </span>
                      <span className="text-xs text-stone-500 ml-1">
                        ({formatWeight(s.pesoTotal)})
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Alertas */}
        {data?.alertas && data.alertas.length > 0 && (
          <Card className="bg-white border-none shadow-md rounded-2xl overflow-hidden">
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-sm font-medium text-stone-600 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                Alertas
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="space-y-2">
                {data.alertas.map((alerta, i) => (
                  <div 
                    key={i}
                    className={`p-3 rounded-xl flex items-start gap-3 ${
                      alerta.severidad === 'alta' 
                        ? 'bg-red-50 border border-red-100' 
                        : alerta.severidad === 'media'
                          ? 'bg-amber-50 border border-amber-100'
                          : 'bg-stone-50 border border-stone-100'
                    }`}
                  >
                    <AlertTriangle className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                      alerta.severidad === 'alta' 
                        ? 'text-red-500' 
                        : alerta.severidad === 'media'
                          ? 'text-amber-500'
                          : 'text-stone-400'
                    }`} />
                    <div>
                      <p className={`text-sm font-medium ${
                        alerta.severidad === 'alta' 
                          ? 'text-red-800' 
                          : alerta.severidad === 'media'
                            ? 'text-amber-800'
                            : 'text-stone-700'
                      }`}>
                        {alerta.tipo}
                      </p>
                      <p className="text-xs text-stone-500">{alerta.mensaje}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Resumen Semanal */}
        <Card className="bg-gradient-to-br from-stone-800 to-stone-900 text-white shadow-lg rounded-2xl overflow-hidden">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-stone-300">Resumen Semanal</h3>
              <ChevronDown className="w-4 h-4 text-stone-400" />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold">
                  {formatNumber(data?.kpis.totalAnimalesSemana || 0)}
                </p>
                <p className="text-sm text-stone-400">animales faenados</p>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-2 text-green-400">
                  <TrendingUp className="w-4 h-4" />
                  <span className="text-lg font-semibold">
                    {data?.kpis.rindePromedio.toFixed(1) || 0}%
                  </span>
                </div>
                <p className="text-xs text-stone-400">rendimiento</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer con versión */}
        <div className="text-center py-4">
          <p className="text-xs text-stone-400">
            Solemar Alimentaria · v1.0.0
          </p>
        </div>
      </div>

      {/* Botón Actualizar flotante */}
      <button
        onClick={() => fetchData(true)}
        disabled={refreshing || isOffline}
        className="fixed bottom-6 right-6 bg-amber-500 text-white p-4 rounded-full shadow-lg disabled:opacity-50 active:scale-95 transition-transform"
      >
        <RefreshCw className={`w-6 h-6 ${refreshing ? 'animate-spin' : ''}`} />
      </button>
    </div>
  );
}
