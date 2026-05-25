'use client';

import { useState } from 'react';
import { Download, FileText, FileSpreadsheet, Printer, ChevronDown, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';

export interface ExportButtonProps {
  onExportPDF?: () => void | Promise<void>;
  onExportExcel?: () => void | Promise<void>;
  onPrint?: () => void | Promise<void>;
  filename?: string;
  showPrint?: boolean;
  showExcel?: boolean;
  showPDF?: boolean;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  label?: string;
  disabled?: boolean;
  className?: string;
}

export function ExportButton({
  onExportPDF,
  onExportExcel,
  onPrint,
  filename = 'reporte',
  showPrint = true,
  showExcel = true,
  showPDF = true,
  variant = 'outline',
  size = 'default',
  label = 'Exportar',
  disabled = false,
  className = '',
}: ExportButtonProps) {
  const [loading, setLoading] = useState<'pdf' | 'excel' | 'print' | null>(null);

  const handleExport = async (type: 'pdf' | 'excel' | 'print', handler?: () => void | Promise<void>) => {
    if (!handler || loading) return;

    setLoading(type);
    try {
      await handler();
      if (type === 'pdf') {
        toast.success('PDF generado correctamente');
      } else if (type === 'excel') {
        toast.success('Excel generado correctamente');
      }
    } catch (error) {
      console.error(`Error al exportar ${type}:`, error);
      toast.error(`Error al generar ${type.toUpperCase()}`);
    } finally {
      setLoading(null);
    }
  };

  const availableOptions = [
    { type: 'pdf' as const, show: showPDF, handler: onExportPDF, icon: FileText, label: 'Exportar PDF' },
    { type: 'excel' as const, show: showExcel, handler: onExportExcel, icon: FileSpreadsheet, label: 'Exportar Excel' },
    { type: 'print' as const, show: showPrint, handler: onPrint, icon: Printer, label: 'Imprimir' },
  ].filter(opt => opt.show && opt.handler);

  if (availableOptions.length === 0) {
    return null;
  }

  if (availableOptions.length === 1) {
    const option = availableOptions[0];
    const Icon = option.icon;
    return (
      <Button
        variant={variant}
        size={size}
        onClick={() => handleExport(option.type, option.handler)}
        disabled={disabled || loading !== null}
        className={className}
      >
        {loading === option.type ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Icon className="w-4 h-4" />
        )}
        {size !== 'icon' && <span className="ml-2">{option.label}</span>}
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} size={size} disabled={disabled || loading !== null} className={className}>
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Download className="w-4 h-4" />
          )}
          {size !== 'icon' && (
            <>
              <span className="ml-2">{label}</span>
              <ChevronDown className="w-4 h-4 ml-1" />
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {showPDF && onExportPDF && (
          <DropdownMenuItem
            onClick={() => handleExport('pdf', onExportPDF)}
            disabled={loading !== null}
          >
            <FileText className="w-4 h-4 mr-2 text-red-500" />
            Exportar PDF
          </DropdownMenuItem>
        )}
        {showExcel && onExportExcel && (
          <DropdownMenuItem
            onClick={() => handleExport('excel', onExportExcel)}
            disabled={loading !== null}
          >
            <FileSpreadsheet className="w-4 h-4 mr-2 text-green-600" />
            Exportar Excel
          </DropdownMenuItem>
        )}
        {showPrint && onPrint && showPDF && showExcel && (
          <DropdownMenuSeparator />
        )}
        {showPrint && onPrint && (
          <DropdownMenuItem
            onClick={() => handleExport('print', onPrint)}
            disabled={loading !== null}
          >
            <Printer className="w-4 h-4 mr-2 text-blue-500" />
            Imprimir
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function PDFDownloadButton({
  onDownload,
  disabled = false,
  variant = 'outline',
  size = 'default',
  label = 'Descargar PDF',
  className = '',
}: {
  onDownload: () => void | Promise<void>;
  disabled?: boolean;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  label?: string;
  className?: string;
}) {
  const [loading, setLoading] = useState(false);

  const handleDownload = async () => {
    setLoading(true);
    try {
      await onDownload();
      toast.success('PDF descargado correctamente');
    } catch (error) {
      console.error('Error al descargar PDF:', error);
      toast.error('Error al descargar PDF');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleDownload}
      disabled={disabled || loading}
      className={className}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <FileText className="w-4 h-4" />
      )}
      {size !== 'icon' && <span className="hidden sm:inline ml-2">{label}</span>}
    </Button>
  );
}

export function ExcelDownloadButton({
  onDownload,
  disabled = false,
  variant = 'outline',
  size = 'default',
  label = 'Descargar Excel',
  className = '',
}: {
  onDownload: () => void | Promise<void>;
  disabled?: boolean;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  label?: string;
  className?: string;
}) {
  const [loading, setLoading] = useState(false);

  const handleDownload = async () => {
    setLoading(true);
    try {
      await onDownload();
      toast.success('Excel descargado correctamente');
    } catch (error) {
      console.error('Error al descargar Excel:', error);
      toast.error('Error al descargar Excel');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleDownload}
      disabled={disabled || loading}
      className={className}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <FileSpreadsheet className="w-4 h-4" />
      )}
      {size !== 'icon' && <span className="hidden sm:inline ml-2">{label}</span>}
    </Button>
  );
}

export default ExportButton;
