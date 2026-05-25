'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  Monitor,
  Download,
  ClipboardCheck,
  Printer,
  Wifi,
  Settings,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  AlertTriangle,
  Shield,
  Zap,
  FileText,
  ArrowRight,
  Copy,
  Check,
  HelpCircle,
} from 'lucide-react'

interface StepProps {
  number: number
  title: string
  icon: React.ReactNode
  children: React.ReactNode
  completed?: boolean
  warning?: string
}

function StepHeader({ number, title, icon, completed, onClick, isOpen }: StepProps & { onClick?: () => void; isOpen: boolean }) {
  return (
    <div
      className="flex items-start gap-4 cursor-pointer group"
      onClick={onClick}
    >
      <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-lg transition-colors ${
        completed ? 'bg-emerald-500' : 'bg-stone-700 group-hover:bg-stone-600'
      }`}>
        {completed ? <CheckCircle2 className="w-5 h-5" /> : number}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-lg">{icon}</span>
          <h3 className="text-lg font-semibold text-stone-800">{title}</h3>
        </div>
      </div>
      {onClick && (
        <div className="flex-shrink-0 mt-1">
          {isOpen ? <ChevronDown className="w-5 h-5 text-stone-400" /> : <ChevronRight className="w-5 h-5 text-stone-400" />}
        </div>
      )}
    </div>
  )
}

function DownloadLink({ url, label, size }: { url: string; label: string; size?: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(url).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex items-center gap-2 bg-stone-50 rounded-lg p-3 border border-stone-200 group">
      <Download className="w-4 h-4 text-stone-400 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-stone-700 truncate">{label}</p>
        <p className="text-xs text-stone-400 truncate">{url}</p>
      </div>
      {size && <Badge variant="outline" className="text-xs flex-shrink-0">{size}</Badge>}
      <Button variant="ghost" size="sm" className="flex-shrink-0 h-7 px-2" onClick={handleCopy}>
        {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-stone-400" />}
      </Button>
      <a href={url} target="_blank" rel="noopener noreferrer" className="flex-shrink-0">
        <Button variant="ghost" size="sm" className="h-7 px-2">
          <ExternalLink className="w-3.5 h-3.5 text-stone-400" />
        </Button>
      </a>
    </div>
  )
}

function CodeBlock({ children }: { children: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(children).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="relative group">
      <pre className="bg-stone-900 text-stone-100 rounded-lg p-3 text-sm font-mono overflow-x-auto">
        {children}
      </pre>
      <Button
        variant="ghost"
        size="sm"
        className="absolute top-2 right-2 h-7 px-2 bg-stone-800 hover:bg-stone-700 text-stone-300 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={handleCopy}
      >
        {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
      </Button>
    </div>
  )
}

function InfoBox({ type, children }: { type: 'info' | 'warning' | 'danger' | 'success'; children: React.ReactNode }) {
  const styles = {
    info: 'bg-sky-50 border-sky-200 text-sky-800',
    warning: 'bg-amber-50 border-amber-200 text-amber-800',
    danger: 'bg-red-50 border-red-200 text-red-800',
    success: 'bg-emerald-50 border-emerald-200 text-emerald-800',
  }
  const icons = {
    info: <HelpCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />,
    warning: <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />,
    danger: <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />,
    success: <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />,
  }

  return (
    <div className={`flex gap-2 rounded-lg border p-3 text-sm ${styles[type]}`}>
      {icons[type]}
      <div>{children}</div>
    </div>
  )
}

interface TroubleshootItemProps {
  symptom: string
  cause: string
  solution: string
}

function TroubleshootItem({ symptom, cause, solution }: TroubleshootItemProps) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border border-stone-200 rounded-lg overflow-hidden">
      <button
        className="w-full text-left p-3 flex items-start gap-2 hover:bg-stone-50 transition-colors"
        onClick={() => setOpen(!open)}
      >
        <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
        <span className="text-sm font-medium text-stone-700 flex-1">{symptom}</span>
        {open ? <ChevronDown className="w-4 h-4 text-stone-400" /> : <ChevronRight className="w-4 h-4 text-stone-400" />}
      </button>
      {open && (
        <div className="px-3 pb-3 ml-6 space-y-2 text-sm">
          <div>
            <p className="text-stone-500 text-xs font-medium uppercase">Causa probable:</p>
            <p className="text-stone-700">{cause}</p>
          </div>
          <div>
            <p className="text-stone-500 text-xs font-medium uppercase">Solución:</p>
            <p className="text-stone-700">{solution}</p>
          </div>
        </div>
      )}
    </div>
  )
}

export function PrinterBridgeGuide() {
  const [completedSteps, setCompletedSteps] = useState<number[]>([])
  const [openSteps, setOpenSteps] = useState<number[]>([0, 1, 2, 3, 4, 5])
  const [showTroubleshooting, setShowTroubleshooting] = useState(false)

  const toggleStep = (num: number) => {
    setOpenSteps(prev =>
      prev.includes(num) ? prev.filter(n => n !== num) : [...prev, num]
    )
  }

  const toggleCompleted = (num: number) => {
    setCompletedSteps(prev =>
      prev.includes(num) ? prev.filter(n => n !== num) : [...prev, num]
    )
  }

  const allCompleted = completedSteps.length >= 9

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 to-stone-100">
      <div className="max-w-4xl mx-auto p-4 md:p-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-stone-800 p-2.5 rounded-xl">
              <Printer className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-stone-800">
                Guía de Instalación — Printer Bridge
              </h1>
              <p className="text-stone-500 text-sm">
                Datamax Mark II · Windows 7 · PC de Pesaje
              </p>
            </div>
          </div>

          {allCompleted && (
            <InfoBox type="success">
              <p className="font-semibold">Todos los pasos completados</p>
              <p>El bridge debería estar funcionando. Probá imprimir desde TrazAlan.</p>
            </InfoBox>
          )}

          {!allCompleted && (
            <div className="mt-3 bg-stone-800 text-stone-100 rounded-lg p-3 flex items-center gap-3">
              <div className="flex-1">
                <div className="flex items-center justify-between text-xs text-stone-400 mb-1">
                  <span>Progreso</span>
                  <span>{completedSteps.length}/9 pasos</span>
                </div>
                <div className="w-full bg-stone-700 rounded-full h-2">
                  <div
                    className="bg-emerald-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${(completedSteps.length / 9) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ============================== */}
        {/* FASE 0: PREPARACIÓN           */}
        {/* ============================== */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Badge variant="secondary" className="bg-amber-100 text-amber-700 border-amber-200">
              FASE 0
            </Badge>
            <h2 className="text-lg font-bold text-stone-700">Preparación — Desde otra PC con internet</h2>
          </div>
          <InfoBox type="warning">
            <p className="font-semibold">La PC de pesaje NO tiene internet.</p>
            <p>Tenés que descargar todos los archivos desde otra PC y pasarlos con un pendrive.</p>
          </InfoBox>
        </div>

        {/* PASO 0: Verificar Windows 7 */}
        <Card className="mb-3 border-l-4 border-l-red-400">
          <CardHeader className="pb-2">
            <div className="flex items-start gap-3">
              <button
                className="flex-shrink-0 mt-1"
                onClick={() => toggleCompleted(0)}
                title="Marcar como completado"
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors ${
                  completedSteps.includes(0)
                    ? 'bg-emerald-500 border-emerald-500 text-white'
                    : 'border-stone-300 hover:border-stone-400'
                }`}>
                  {completedSteps.includes(0) ? <Check className="w-4 h-4" /> : <span className="text-sm font-medium text-stone-500">0</span>}
                </div>
              </button>
              <div className="flex-1 cursor-pointer" onClick={() => toggleStep(0)}>
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-red-500" />
                  <CardTitle className="text-base">Preparar Windows 7 (SP1 + KB2999226)</CardTitle>
                </div>
                <p className="text-xs text-stone-500 mt-1">OBLIGATORIO — Sin esto, Python no se instala</p>
              </div>
              <button className="flex-shrink-0 mt-1" onClick={() => toggleStep(0)}>
                {openSteps.includes(0) ? <ChevronDown className="w-5 h-5 text-stone-400" /> : <ChevronRight className="w-5 h-5 text-stone-400" />}
              </button>
            </div>
          </CardHeader>
          {openSteps.includes(0) && (
            <CardContent className="pt-0 space-y-4">
              <InfoBox type="danger">
                <p className="font-semibold">Si Python muestra &quot;setup failed&quot;, faltan estos requisitos:</p>
                <ul className="list-disc ml-4 mt-1 space-y-1">
                  <li><strong>Service Pack 1</strong> — Actualización obligatoria de Windows 7</li>
                  <li><strong>KB2999226</strong> — Universal C Runtime (necesario para Python 3.8+)</li>
                </ul>
              </InfoBox>

              <div>
                <h4 className="text-sm font-semibold text-stone-700 mb-2 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-red-500" />
                  Instalar Service Pack 1
                </h4>
                <div className="space-y-2 ml-6">
                  <p className="text-sm text-stone-600">
                    <strong>Opción A — LegacyUpdate.net (recomendado):</strong> Microsoft borró los links oficiales. Usá este sitio comunitario que tiene los instaladores:
                  </p>
                  <DownloadLink
                    url="https://legacyupdate.net/download-center/download/5842/windows-7-and-windows-server-2008-r2-sp1-kb976932"
                    label="Windows 7 SP1 (32-bit) — LegacyUpdate.net"
                    size="~537 MB"
                  />
                  <DownloadLink
                    url="https://legacyupdate.net/download-center/download/5842/windows-7-and-windows-server-2008-r2-sp1-kb976932"
                    label="Windows 7 SP1 (64-bit) — mismo link, elegir X64 en la página"
                    size="~903 MB"
                  />
                  <p className="text-sm text-stone-600">
                    <strong>Opción B — Windows Update:</strong> Ir a Inicio → Windows Update → Buscar actualizaciones → Instalar todo → Reiniciar (puede que no funcione si Win7 está muy desactualizado)
                  </p>
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="text-sm font-semibold text-stone-700 mb-2 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-500" />
                  Instalar KB2999226 (Universal C Runtime)
                </h4>
                <div className="space-y-2 ml-6">
                  <p className="text-sm text-stone-600">
                    <strong>Opción A — Descarga directa (64-bit):</strong>
                  </p>
                  <DownloadLink
                    url="https://download.microsoft.com/download/1/1/5/11565A9A-EA09-4F0A-A57E-520D5D138140/Windows6.1-KB2999226-x64.msu"
                    label="KB2999226 (64-bit: Windows6.1-KB2999226-x64.msu) — Directo Microsoft"
                    size="~1 MB"
                  />
                  <p className="text-sm text-stone-600">
                    <strong>Opción B — Si la PC es 32-bit:</strong> Microsoft borró el link del instalador x86. Usá:
                  </p>
                  <DownloadLink
                    url="https://www.catalog.update.microsoft.com/Search.aspx?q=KB2999226"
                    label="Windows Update Catalog — buscá KB2999226, filtrá por x86"
                  />
                  <InfoBox type="info">
                    <p><strong>Alternativa recomendada para 32-bit:</strong> Instalar el <em>Convenience Rollup KB3125574</em> que incluye KB2999226 y muchas más actualizaciones en un solo paquete. Descargalo desde LegacyUpdate.net o Windows Update.</p>
                  </InfoBox>
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="text-sm font-semibold text-stone-700 mb-2 flex items-center gap-2">
                  <ClipboardCheck className="w-4 h-4 text-emerald-500" />
                  Verificar que se instalaron correctamente
                </h4>
                <div className="ml-6 space-y-2">
                  <p className="text-sm text-stone-600">Abrí CMD y ejecutá:</p>
                  <CodeBlock>{`systeminfo | findstr /C:"Service Pack"
wmic qfe list | findstr "KB2999226"`}</CodeBlock>
                  <p className="text-sm text-stone-600">
                    Tiene que mostrar <strong>&quot;Service Pack 1&quot;</strong> y el parche <strong>&quot;KB2999226&quot;</strong>.
                  </p>
                </div>
              </div>

              <div>
                <p className="text-sm text-stone-600 ml-6">
                  <strong>Opcional:</strong> Ejecutá <code className="bg-stone-100 px-1.5 py-0.5 rounded text-xs">setup-prep.bat</code> para un diagnóstico automático completo de prerequisitos.
                </p>
              </div>
            </CardContent>
          )}
        </Card>

        {/* ============================== */}
        {/* PASO 1: Descargar archivos     */}
        {/* ============================== */}
        <Card className="mb-3 border-l-4 border-l-sky-400">
          <CardHeader className="pb-2">
            <div className="flex items-start gap-3">
              <button
                className="flex-shrink-0 mt-1"
                onClick={() => toggleCompleted(1)}
                title="Marcar como completado"
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors ${
                  completedSteps.includes(1)
                    ? 'bg-emerald-500 border-emerald-500 text-white'
                    : 'border-stone-300 hover:border-stone-400'
                }`}>
                  {completedSteps.includes(1) ? <Check className="w-4 h-4" /> : <span className="text-sm font-medium text-stone-500">1</span>}
                </div>
              </button>
              <div className="flex-1 cursor-pointer" onClick={() => toggleStep(1)}>
                <div className="flex items-center gap-2">
                  <Download className="w-5 h-5 text-sky-500" />
                  <CardTitle className="text-base">Descargar los archivos necesarios</CardTitle>
                </div>
                <p className="text-xs text-stone-500 mt-1">Desde una PC con internet</p>
              </div>
              <button className="flex-shrink-0 mt-1" onClick={() => toggleStep(1)}>
                {openSteps.includes(1) ? <ChevronDown className="w-5 h-5 text-stone-400" /> : <ChevronRight className="w-5 h-5 text-stone-400" />}
              </button>
            </div>
          </CardHeader>
          {openSteps.includes(1) && (
            <CardContent className="pt-0 space-y-4">
              <p className="text-sm text-stone-600">
                Descargá estos <strong>3 archivos</strong> y copialos a un pendrive:
              </p>

              <div className="space-y-2">
                <div className="flex items-center gap-2 mb-1">
                  <Badge className="bg-stone-700 text-white">1</Badge>
                  <span className="text-sm font-semibold text-stone-700">Python 3.8.10</span>
                  <Badge variant="outline" className="text-xs">~25 MB</Badge>
                </div>
                <div className="ml-7 space-y-2">
                  <p className="text-xs text-stone-500">Ultima version de Python compatible con Windows 7. NO descargues Python 3.9+.</p>
                  <DownloadLink
                    url="https://www.python.org/ftp/python/3.8.10/python-3.8.10.exe"
                    label="Python 3.8.10 (32-bit)"
                    size="25 MB"
                  />
                  <InfoBox type="info">
                    <p>Si la PC de pesaje es <strong>64-bit</strong>, descargá este en su lugar:</p>
                  </InfoBox>
                  <DownloadLink
                    url="https://www.python.org/ftp/python/3.8.10/python-3.8.10-amd64.exe"
                    label="Python 3.8.10 (64-bit) — Solo si Win7 es 64-bit"
                    size="26 MB"
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <div className="flex items-center gap-2 mb-1">
                  <Badge className="bg-stone-700 text-white">2</Badge>
                  <span className="text-sm font-semibold text-stone-700">pywin32 (librería de impresión)</span>
                  <Badge variant="outline" className="text-xs">~12 MB</Badge>
                </div>
                <div className="ml-7 space-y-2">
                  <p className="text-xs text-stone-500">Permite que Python se comunique con la impresora por USB.</p>
                  <DownloadLink
                    url="https://github.com/mhammond/pywin32/releases/download/b301/pywin32-301.win32-py3.8.exe"
                    label="pywin32 301 (32-bit)"
                    size="12 MB"
                  />
                  <InfoBox type="info">
                    <p>Si la PC de pesaje es <strong>64-bit</strong>, descargá este en su lugar:</p>
                  </InfoBox>
                  <DownloadLink
                    url="https://github.com/mhammond/pywin32/releases/download/b301/pywin32-301.win-amd64.py3.8.exe"
                    label="pywin32 301 (64-bit) — Solo si Win7 es 64-bit"
                    size="14 MB"
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <div className="flex items-center gap-2 mb-1">
                  <Badge className="bg-stone-700 text-white">3</Badge>
                  <span className="text-sm font-semibold text-stone-700">Printer Bridge (carpeta completa)</span>
                </div>
                <div className="ml-7 space-y-2">
                  <p className="text-xs text-stone-500">Descargá todo el repo o solo la carpeta del bridge:</p>
                  <DownloadLink
                    url="https://github.com/aarescalvo/trz6"
                    label="Repositorio completo (trz6)"
                  />
                  <p className="text-xs text-stone-500">La carpeta que necesitás es: <code className="bg-stone-100 px-1.5 py-0.5 rounded">mini-services/printer-bridge/python/</code></p>
                  <CodeBlock>{`python/
├── index.py
├── install.bat
├── start.bat
├── install-service.bat
├── uninstall-service.bat
├── requirements.txt
├── README.md
└── INSTRUCTIVO-INSTALACION.md`}</CodeBlock>
                </div>
              </div>

              <InfoBox type="warning">
                <p><strong>Paso 2:</strong> Copiá los 3 archivos al pendrive y conectalo a la PC de pesaje. Copiá todo al escritorio o a una carpeta accesible.</p>
              </InfoBox>
            </CardContent>
          )}
        </Card>

        {/* ============================== */}
        {/* PASO 2: Instalar Python         */}
        {/* ============================== */}
        <Card className="mb-3 border-l-4 border-l-emerald-400">
          <CardHeader className="pb-2">
            <div className="flex items-start gap-3">
              <button
                className="flex-shrink-0 mt-1"
                onClick={() => toggleCompleted(2)}
                title="Marcar como completado"
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors ${
                  completedSteps.includes(2)
                    ? 'bg-emerald-500 border-emerald-500 text-white'
                    : 'border-stone-300 hover:border-stone-400'
                }`}>
                  {completedSteps.includes(2) ? <Check className="w-4 h-4" /> : <span className="text-sm font-medium text-stone-500">2</span>}
                </div>
              </button>
              <div className="flex-1 cursor-pointer" onClick={() => toggleStep(2)}>
                <div className="flex items-center gap-2">
                  <Monitor className="w-5 h-5 text-emerald-500" />
                  <CardTitle className="text-base">Instalar Python 3.8.10 en la PC de pesaje</CardTitle>
                </div>
                <p className="text-xs text-stone-500 mt-1">En la PC de pesaje (Windows 7)</p>
              </div>
              <button className="flex-shrink-0 mt-1" onClick={() => toggleStep(2)}>
                {openSteps.includes(2) ? <ChevronDown className="w-5 h-5 text-stone-400" /> : <ChevronRight className="w-5 h-5 text-stone-400" />}
              </button>
            </div>
          </CardHeader>
          {openSteps.includes(2) && (
            <CardContent className="pt-0 space-y-4">
              <div className="space-y-3">
                <div className="flex gap-3">
                  <Badge className="bg-stone-700 text-white h-6 w-6 flex items-center justify-center">a</Badge>
                  <p className="text-sm text-stone-700">Hacé <strong>doble clic</strong> en <code className="bg-stone-100 px-1.5 py-0.5 rounded text-xs">python-3.8.10.exe</code></p>
                </div>
                <div className="flex gap-3">
                  <Badge className="bg-stone-700 text-white h-6 w-6 flex items-center justify-center">b</Badge>
                  <div className="text-sm text-stone-700">
                    <InfoBox type="danger">
                      <p><strong>MUY IMPORTANTE:</strong> Tildá la casilla <strong>&quot;Add Python 3.8 to PATH&quot;</strong> (abajo a la izquierda del instalador). Si no lo hacés, Python no funciona desde la consola.</p>
                    </InfoBox>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Badge className="bg-stone-700 text-white h-6 w-6 flex items-center justify-center">c</Badge>
                  <p className="text-sm text-stone-700">Click en <strong>&quot;Install Now&quot;</strong> y esperá 1-2 minutos</p>
                </div>
                <div className="flex gap-3">
                  <Badge className="bg-stone-700 text-white h-6 w-6 flex items-center justify-center">d</Badge>
                  <p className="text-sm text-stone-700">Click en <strong>&quot;Close&quot;</strong></p>
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="text-sm font-semibold text-stone-700 mb-2">Verificar que se instaló bien:</h4>
                <div className="space-y-2 ml-2">
                  <p className="text-sm text-stone-600">Abrí CMD (Inicio → Todos los programas → Accesorios → Símbolo del sistema) y ejecutá:</p>
                  <CodeBlock>{`python --version`}</CodeBlock>
                  <p className="text-sm text-stone-600">Tiene que responder: <Badge variant="outline" className="text-xs">Python 3.8.10</Badge></p>
                </div>
              </div>

              <TroubleshootItem
                symptom='Dice "python no se reconoce como comando"'
                cause="No tildaste 'Add Python to PATH' durante la instalación"
                solution="Desinstalá Python (Panel de Control → Programas → Desinstalar) y volvé a instalar, esta vez tildando 'Add Python to PATH'"
              />
              <TroubleshootItem
                symptom='Dice "setup failed"'
                cause="Falta Service Pack 1 o KB2999226 (ver Paso 0)"
                solution="Instalá SP1 y KB2999226, reiniciá la PC, y volvé a intentar"
              />
            </CardContent>
          )}
        </Card>

        {/* ============================== */}
        {/* PASO 3: Instalar pywin32        */}
        {/* ============================== */}
        <Card className="mb-3 border-l-4 border-l-emerald-400">
          <CardHeader className="pb-2">
            <div className="flex items-start gap-3">
              <button
                className="flex-shrink-0 mt-1"
                onClick={() => toggleCompleted(3)}
                title="Marcar como completado"
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors ${
                  completedSteps.includes(3)
                    ? 'bg-emerald-500 border-emerald-500 text-white'
                    : 'border-stone-300 hover:border-stone-400'
                }`}>
                  {completedSteps.includes(3) ? <Check className="w-4 h-4" /> : <span className="text-sm font-medium text-stone-500">3</span>}
                </div>
              </button>
              <div className="flex-1 cursor-pointer" onClick={() => toggleStep(3)}>
                <div className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-emerald-500" />
                  <CardTitle className="text-base">Instalar pywin32</CardTitle>
                </div>
                <p className="text-xs text-stone-500 mt-1">Librería de impresión para Python</p>
              </div>
              <button className="flex-shrink-0 mt-1" onClick={() => toggleStep(3)}>
                {openSteps.includes(3) ? <ChevronDown className="w-5 h-5 text-stone-400" /> : <ChevronRight className="w-5 h-5 text-stone-400" />}
              </button>
            </div>
          </CardHeader>
          {openSteps.includes(3) && (
            <CardContent className="pt-0 space-y-4">
              <div className="space-y-3">
                <div className="flex gap-3">
                  <Badge className="bg-stone-700 text-white h-6 w-6 flex items-center justify-center">a</Badge>
                  <p className="text-sm text-stone-700">Hacé <strong>doble clic</strong> en <code className="bg-stone-100 px-1.5 py-0.5 rounded text-xs">pywin32-301.win32-py3.8.exe</code> (o el amd64)</p>
                </div>
                <div className="flex gap-3">
                  <Badge className="bg-stone-700 text-white h-6 w-6 flex items-center justify-center">b</Badge>
                  <p className="text-sm text-stone-700">Click en <strong>&quot;Siguiente&quot;</strong> → <strong>&quot;Siguiente&quot;</strong> → <strong>&quot;Instalar&quot;</strong></p>
                </div>
                <div className="flex gap-3">
                  <Badge className="bg-stone-700 text-white h-6 w-6 flex items-center justify-center">c</Badge>
                  <p className="text-sm text-stone-700">Click en <strong>&quot;Finalizar&quot;</strong></p>
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="text-sm font-semibold text-stone-700 mb-2">Verificar:</h4>
                <div className="space-y-2 ml-2">
                  <CodeBlock>{`python -c "import win32print; print('OK')"`}</CodeBlock>
                  <p className="text-sm text-stone-600">Tiene que responder: <Badge variant="outline" className="text-xs">OK</Badge></p>
                </div>
              </div>

              <TroubleshootItem
                symptom='Error: "No module named win32print"'
                cause="pywin32 no se instaló correctamente"
                solution={`Ejecutá en CMD:\npip install pywin32\no\npython -m pip install pywin32`}
              />
            </CardContent>
          )}
        </Card>

        {/* ============================== */}
        {/* PASO 4: Verificar impresora     */}
        {/* ============================== */}
        <Card className="mb-3 border-l-4 border-l-emerald-400">
          <CardHeader className="pb-2">
            <div className="flex items-start gap-3">
              <button
                className="flex-shrink-0 mt-1"
                onClick={() => toggleCompleted(4)}
                title="Marcar como completado"
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors ${
                  completedSteps.includes(4)
                    ? 'bg-emerald-500 border-emerald-500 text-white'
                    : 'border-stone-300 hover:border-stone-400'
                }`}>
                  {completedSteps.includes(4) ? <Check className="w-4 h-4" /> : <span className="text-sm font-medium text-stone-500">4</span>}
                </div>
              </button>
              <div className="flex-1 cursor-pointer" onClick={() => toggleStep(4)}>
                <div className="flex items-center gap-2">
                  <Printer className="w-5 h-5 text-emerald-500" />
                  <CardTitle className="text-base">Verificar que la Datamax está instalada en Windows</CardTitle>
                </div>
                <p className="text-xs text-stone-500 mt-1">Impresora USB detectada por Windows</p>
              </div>
              <button className="flex-shrink-0 mt-1" onClick={() => toggleStep(4)}>
                {openSteps.includes(4) ? <ChevronDown className="w-5 h-5 text-stone-400" /> : <ChevronRight className="w-5 h-5 text-stone-400" />}
              </button>
            </div>
          </CardHeader>
          {openSteps.includes(4) && (
            <CardContent className="pt-0 space-y-4">
              <div className="space-y-3">
                <div className="flex gap-3">
                  <Badge className="bg-stone-700 text-white h-6 w-6 flex items-center justify-center">a</Badge>
                  <p className="text-sm text-stone-700">Conectá la Datamax por USB (si no estaba conectada)</p>
                </div>
                <div className="flex gap-3">
                  <Badge className="bg-stone-700 text-white h-6 w-6 flex items-center justify-center">b</Badge>
                  <p className="text-sm text-stone-700">Andá a <strong>Inicio → Dispositivos e impresoras</strong> (o Panel de Control → Dispositivos e impresoras)</p>
                </div>
                <div className="flex gap-3">
                  <Badge className="bg-stone-700 text-white h-6 w-6 flex items-center justify-center">c</Badge>
                  <p className="text-sm text-stone-700">Buscá la Datamax. Puede aparecer como:</p>
                </div>
                <div className="ml-9 space-y-1">
                  <p className="text-sm text-stone-500 pl-2">• <code className="bg-stone-100 px-1.5 py-0.5 rounded text-xs">Datamax Mark II</code></p>
                  <p className="text-sm text-stone-500 pl-2">• <code className="bg-stone-100 px-1.5 py-0.5 rounded text-xs">Datamax-O&apos;Neil Mark II</code></p>
                  <p className="text-sm text-stone-500 pl-2">• Otro nombre similar</p>
                </div>
              </div>

              <InfoBox type="warning">
                <p><strong>Anotá el NOMBRE EXACTO</strong> de la impresora tal como aparece en la lista. Lo necesitás en el paso siguiente. Tiene que coincidir exactamente, incluyendo espacios.</p>
              </InfoBox>

              <TroubleshootItem
                symptom="La Datamax no aparece en la lista"
                cause="Driver no instalado o impresora apagada/desconectada"
                solution="1) Verificá que esté encendida y conectada por USB\n2) Desconectá y reconectá el cable\n3) Probá otro puerto USB\n4) Instalá el driver de Datamax (CD o descarga del fabricante)\n5) Reiniciá la PC"
              />
            </CardContent>
          )}
        </Card>

        {/* ============================== */}
        {/* PASO 5: Ejecutar install.bat    */}
        {/* ============================== */}
        <Card className="mb-3 border-l-4 border-l-emerald-400">
          <CardHeader className="pb-2">
            <div className="flex items-start gap-3">
              <button
                className="flex-shrink-0 mt-1"
                onClick={() => toggleCompleted(5)}
                title="Marcar como completado"
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors ${
                  completedSteps.includes(5)
                    ? 'bg-emerald-500 border-emerald-500 text-white'
                    : 'border-stone-300 hover:border-stone-400'
                }`}>
                  {completedSteps.includes(5) ? <Check className="w-4 h-4" /> : <span className="text-sm font-medium text-stone-500">5</span>}
                </div>
              </button>
              <div className="flex-1 cursor-pointer" onClick={() => toggleStep(5)}>
                <div className="flex items-center gap-2">
                  <Settings className="w-5 h-5 text-emerald-500" />
                  <CardTitle className="text-base">Ejecutar el instalador del Bridge</CardTitle>
                </div>
                <p className="text-xs text-stone-500 mt-1">install.bat — como Administrador</p>
              </div>
              <button className="flex-shrink-0 mt-1" onClick={() => toggleStep(5)}>
                {openSteps.includes(5) ? <ChevronDown className="w-5 h-5 text-stone-400" /> : <ChevronRight className="w-5 h-5 text-stone-400" />}
              </button>
            </div>
          </CardHeader>
          {openSteps.includes(5) && (
            <CardContent className="pt-0 space-y-4">
              <div className="space-y-3">
                <div className="flex gap-3">
                  <Badge className="bg-stone-700 text-white h-6 w-6 flex items-center justify-center">a</Badge>
                  <p className="text-sm text-stone-700">Abrí la carpeta <code className="bg-stone-100 px-1.5 py-0.5 rounded text-xs">python/</code> que copiaste del pendrive</p>
                </div>
                <div className="flex gap-3">
                  <Badge className="bg-stone-700 text-white h-6 w-6 flex items-center justify-center">b</Badge>
                  <p className="text-sm text-stone-700">Hacé <strong>click derecho</strong> en <code className="bg-stone-100 px-1.5 py-0.5 rounded text-xs">install.bat</code> → <strong>&quot;Ejecutar como administrador&quot;</strong></p>
                </div>
                <div className="flex gap-3">
                  <Badge className="bg-stone-700 text-white h-6 w-6 flex items-center justify-center">c</Badge>
                  <p className="text-sm text-stone-700">Se abre una ventana negra. El instalador verifica automáticamente:</p>
                </div>
                <div className="ml-9 space-y-1">
                  <div className="flex items-center gap-2 text-sm text-stone-500">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    SP1 instalado
                  </div>
                  <div className="flex items-center gap-2 text-sm text-stone-500">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    KB2999226 instalado
                  </div>
                  <div className="flex items-center gap-2 text-sm text-stone-500">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    Python disponible
                  </div>
                  <div className="flex items-center gap-2 text-sm text-stone-500">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    pywin32 disponible
                  </div>
                </div>
                <div className="flex gap-3">
                  <Badge className="bg-stone-700 text-white h-6 w-6 flex items-center justify-center">d</Badge>
                  <p className="text-sm text-stone-700">Te muestra una <strong>lista de impresoras detectadas</strong>. Escribí el nombre exacto de la Datamax y presioná Enter</p>
                </div>
                <div className="flex gap-3">
                  <Badge className="bg-stone-700 text-white h-6 w-6 flex items-center justify-center">e</Badge>
                  <p className="text-sm text-stone-700">El instalador copia los archivos, configura el firewall y muestra un resumen</p>
                </div>
              </div>

              <InfoBox type="warning">
                <p><strong>Anotá la IP</strong> que muestra el instalador (ej: <code className="bg-stone-100 px-1.5 py-0.5 rounded text-xs">192.168.1.50</code>). La necesitás para configurar TrazAlan.</p>
              </InfoBox>

              <div>
                <h4 className="text-sm font-semibold text-stone-700 mb-2">Ejemplo de salida del instalador:</h4>
                <CodeBlock>{`============================================================
  PRINTER BRIDGE v3.1 - Solemar Alimentaria
  Instalador para Windows 7
============================================================

[OK] Windows 7 SP1 detectado
[OK] KB2999226 detectado
[OK] Python encontrado: 3.8.10
[OK] pywin32 instalado

Instalando en: C:\\SolemarAlimentaria\\printer-bridge
[OK] Archivos copiados.

============================================================
  IMPRESORAS DETECTADAS
============================================================

  [0] Datamax Mark II
  [1] Microsoft XPS Document Writer

============================================================
  CONFIGURACION
============================================================

Escribi el nombre EXACTO de la impresora: Datamax Mark II

[OK] Configuracion guardada.
[OK] Puerto TCP 9100 abierto.
[OK] Puerto HTTP 9101 abierto.

============================================================
  INSTALACION COMPLETADA
============================================================

  Impresora:   Datamax Mark II
  Puerto TCP:  9100
  Panel Web:   http://192.168.1.50:9101
  Archivos:    C:\\SolemarAlimentaria\\printer-bridge`}</CodeBlock>
              </div>
            </CardContent>
          )}
        </Card>

        {/* ============================== */}
        {/* PASO 6: Iniciar y probar        */}
        {/* ============================== */}
        <Card className="mb-3 border-l-4 border-l-emerald-400">
          <CardHeader className="pb-2">
            <div className="flex items-start gap-3">
              <button
                className="flex-shrink-0 mt-1"
                onClick={() => toggleCompleted(6)}
                title="Marcar como completado"
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors ${
                  completedSteps.includes(6)
                    ? 'bg-emerald-500 border-emerald-500 text-white'
                    : 'border-stone-300 hover:border-stone-400'
                }`}>
                  {completedSteps.includes(6) ? <Check className="w-4 h-4" /> : <span className="text-sm font-medium text-stone-500">6</span>}
                </div>
              </button>
              <div className="flex-1 cursor-pointer" onClick={() => toggleStep(6)}>
                <div className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-emerald-500" />
                  <CardTitle className="text-base">Iniciar el Bridge y hacer prueba de impresión</CardTitle>
                </div>
                <p className="text-xs text-stone-500 mt-1">start.bat + panel web</p>
              </div>
              <button className="flex-shrink-0 mt-1" onClick={() => toggleStep(6)}>
                {openSteps.includes(6) ? <ChevronDown className="w-5 h-5 text-stone-400" /> : <ChevronRight className="w-5 h-5 text-stone-400" />}
              </button>
            </div>
          </CardHeader>
          {openSteps.includes(6) && (
            <CardContent className="pt-0 space-y-4">
              <div className="space-y-3">
                <div className="flex gap-3">
                  <Badge className="bg-stone-700 text-white h-6 w-6 flex items-center justify-center">a</Badge>
                  <p className="text-sm text-stone-700">Entrá a <code className="bg-stone-100 px-1.5 py-0.5 rounded text-xs">C:\SolemarAlimentaria\printer-bridge\</code></p>
                </div>
                <div className="flex gap-3">
                  <Badge className="bg-stone-700 text-white h-6 w-6 flex items-center justify-center">b</Badge>
                  <p className="text-sm text-stone-700">Hacé doble clic en <strong><code className="bg-stone-100 px-1.5 py-0.5 rounded text-xs">start.bat</code></strong></p>
                </div>
                <div className="flex gap-3">
                  <Badge className="bg-stone-700 text-white h-6 w-6 flex items-center justify-center">c</Badge>
                  <p className="text-sm text-stone-700">Se abre una ventana negra. <strong>Esta ventana TIENE que quedar abierta</strong> mientras querés imprimir</p>
                </div>
                <div className="flex gap-3">
                  <Badge className="bg-stone-700 text-white h-6 w-6 flex items-center justify-center">d</Badge>
                  <p className="text-sm text-stone-700">Abrí el navegador y entrá a: <code className="bg-stone-100 px-1.5 py-0.5 rounded text-xs">http://localhost:9101</code></p>
                </div>
                <div className="flex gap-3">
                  <Badge className="bg-stone-700 text-white h-6 w-6 flex items-center justify-center">e</Badge>
                  <p className="text-sm text-stone-700">En el panel web, verificá que la Datamax esté seleccionada y el formato sea <strong>DPL (Datamax)</strong></p>
                </div>
                <div className="flex gap-3">
                  <Badge className="bg-stone-700 text-white h-6 w-6 flex items-center justify-center">f</Badge>
                  <p className="text-sm text-stone-700">Hacé clic en <strong>&quot;Imprimir prueba&quot;</strong></p>
                </div>
              </div>

              <InfoBox type="success">
                <p>Si la Datamax imprime una etiqueta que dice &quot;SOLEMAR ALIMENTARIA — PRUEBA&quot;, el bridge funciona correctamente.</p>
              </InfoBox>
            </CardContent>
          )}
        </Card>

        {/* ============================== */}
        {/* PASO 7: Configurar TrazAlan     */}
        {/* ============================== */}
        <Card className="mb-3 border-l-4 border-l-violet-400">
          <CardHeader className="pb-2">
            <div className="flex items-start gap-3">
              <button
                className="flex-shrink-0 mt-1"
                onClick={() => toggleCompleted(7)}
                title="Marcar como completado"
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors ${
                  completedSteps.includes(7)
                    ? 'bg-emerald-500 border-emerald-500 text-white'
                    : 'border-stone-300 hover:border-stone-400'
                }`}>
                  {completedSteps.includes(7) ? <Check className="w-4 h-4" /> : <span className="text-sm font-medium text-stone-500">7</span>}
                </div>
              </button>
              <div className="flex-1 cursor-pointer" onClick={() => toggleStep(7)}>
                <div className="flex items-center gap-2">
                  <Wifi className="w-5 h-5 text-violet-500" />
                  <CardTitle className="text-base">Configurar la impresora en TrazAlan</CardTitle>
                </div>
                <p className="text-xs text-stone-500 mt-1">Desde la PC donde corre TrazAlan</p>
              </div>
              <button className="flex-shrink-0 mt-1" onClick={() => toggleStep(7)}>
                {openSteps.includes(7) ? <ChevronDown className="w-5 h-5 text-stone-400" /> : <ChevronRight className="w-5 h-5 text-stone-400" />}
              </button>
            </div>
          </CardHeader>
          {openSteps.includes(7) && (
            <CardContent className="pt-0 space-y-4">
              <div className="space-y-3">
                <div className="flex gap-3">
                  <Badge className="bg-stone-700 text-white h-6 w-6 flex items-center justify-center">a</Badge>
                  <p className="text-sm text-stone-700">Primero verificá la IP de la PC de pesaje. Abrí CMD y ejecutá:</p>
                </div>
                <div className="ml-9">
                  <CodeBlock>{`ipconfig`}</CodeBlock>
                </div>
                <p className="text-sm text-stone-600 ml-9">Buscá la línea &quot;IPv4&quot;. Va a ser algo como <code className="bg-stone-100 px-1.5 py-0.5 rounded text-xs">192.168.1.50</code></p>

                <div className="flex gap-3 mt-3">
                  <Badge className="bg-stone-700 text-white h-6 w-6 flex items-center justify-center">b</Badge>
                  <p className="text-sm text-stone-700">Entrá a TrazAlan → <strong>Configuración</strong> → <strong>Puestos de Trabajo</strong></p>
                </div>

                <div className="flex gap-3">
                  <Badge className="bg-stone-700 text-white h-6 w-6 flex items-center justify-center">c</Badge>
                  <p className="text-sm text-stone-700">Editá el puesto de pesaje o creá una nueva impresora con estos datos:</p>
                </div>
              </div>

              {/* Configuration table */}
              <div className="bg-stone-50 rounded-lg border p-3">
                <h4 className="text-sm font-semibold text-stone-700 mb-3">Datos de configuración:</h4>
                <div className="space-y-2">
                  {[
                    { label: 'Nombre', value: 'Datamax Pesaje' },
                    { label: 'Marca', value: 'DATAMAX' },
                    { label: 'Modelo', value: 'Mark II' },
                    { label: 'Tipo conexión', value: 'RED / TCP/IP' },
                    { label: 'IP', value: '192.168.1.50 (la IP real de la PC de pesaje)' },
                    { label: 'Puerto', value: '9100' },
                    { label: 'DPI', value: '203' },
                    { label: 'Ancho etiqueta', value: '90 mm' },
                    { label: 'Alto etiqueta', value: '60 mm' },
                  ].map((item) => (
                    <div key={item.label} className="flex items-start gap-3 text-sm">
                      <span className="text-stone-500 min-w-[100px] font-medium">{item.label}:</span>
                      <span className="text-stone-800 font-mono text-xs bg-white px-2 py-0.5 rounded border">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          )}
        </Card>

        {/* ============================== */}
        {/* PASO 8: Prueba final            */}
        {/* ============================== */}
        <Card className="mb-3 border-l-4 border-l-emerald-400">
          <CardHeader className="pb-2">
            <div className="flex items-start gap-3">
              <button
                className="flex-shrink-0 mt-1"
                onClick={() => toggleCompleted(8)}
                title="Marcar como completado"
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors ${
                  completedSteps.includes(8)
                    ? 'bg-emerald-500 border-emerald-500 text-white'
                    : 'border-stone-300 hover:border-stone-400'
                }`}>
                  {completedSteps.includes(8) ? <Check className="w-4 h-4" /> : <span className="text-sm font-medium text-stone-500">8</span>}
                </div>
              </button>
              <div className="flex-1 cursor-pointer" onClick={() => toggleStep(8)}>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  <CardTitle className="text-base">Probar impresión desde TrazAlan</CardTitle>
                </div>
                <p className="text-xs text-stone-500 mt-1">Prueba final de integración</p>
              </div>
              <button className="flex-shrink-0 mt-1" onClick={() => toggleStep(8)}>
                {openSteps.includes(8) ? <ChevronDown className="w-5 h-5 text-stone-400" /> : <ChevronRight className="w-5 h-5 text-stone-400" />}
              </button>
            </div>
          </CardHeader>
          {openSteps.includes(8) && (
            <CardContent className="pt-0 space-y-4">
              <div className="space-y-3">
                <div className="flex gap-3">
                  <Badge className="bg-stone-700 text-white h-6 w-6 flex items-center justify-center">a</Badge>
                  <p className="text-sm text-stone-700">Asegurate que el <strong>bridge esté corriendo</strong> en la PC de pesaje (start.bat abierto)</p>
                </div>
                <div className="flex gap-3">
                  <Badge className="bg-stone-700 text-white h-6 w-6 flex items-center justify-center">b</Badge>
                  <p className="text-sm text-stone-700">Entrá a TrazAlan → <strong>Pesaje Individual</strong></p>
                </div>
                <div className="flex gap-3">
                  <Badge className="bg-stone-700 text-white h-6 w-6 flex items-center justify-center">c</Badge>
                  <p className="text-sm text-stone-700">Pesá un animal de prueba</p>
                </div>
                <div className="flex gap-3">
                  <Badge className="bg-stone-700 text-white h-6 w-6 flex items-center justify-center">d</Badge>
                  <p className="text-sm text-stone-700">Al registrar el peso, la Datamax debería <strong>imprimir la etiqueta automáticamente</strong></p>
                </div>
              </div>

              <InfoBox type="success">
                <p className="font-semibold">Si la etiqueta se imprime correctamente, la instalación está completa.</p>
                <p>El bridge está listo para uso en producción.</p>
              </InfoBox>
            </CardContent>
          )}
        </Card>

        {/* ============================== */}
        {/* AUTO-INICIO OPCIONAL            */}
        {/* ============================== */}
        <div className="mb-6 mt-8">
          <div className="flex items-center gap-2 mb-3">
            <Badge variant="secondary" className="bg-stone-200 text-stone-600 border-stone-300">
              OPCIONAL
            </Badge>
            <h2 className="text-lg font-bold text-stone-700">Auto-inicio con Windows</h2>
          </div>
        </div>

        <Card className="mb-3 border border-dashed border-stone-300">
          <CardHeader className="pb-2">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-1">
                <div className="w-8 h-8 rounded-full flex items-center justify-center border-2 border-dashed border-stone-300">
                  <Settings className="w-4 h-4 text-stone-400" />
                </div>
              </div>
              <div className="flex-1 cursor-pointer" onClick={() => toggleStep(9)}>
                <div className="flex items-center gap-2">
                  <CardTitle className="text-base text-stone-600">Configurar inicio automático</CardTitle>
                  <Badge variant="outline" className="text-xs">Opcional</Badge>
                </div>
                <p className="text-xs text-stone-400 mt-1">Para que el bridge arranque solo al prender la PC</p>
              </div>
              <button className="flex-shrink-0 mt-1" onClick={() => toggleStep(9)}>
                {openSteps.includes(9) ? <ChevronDown className="w-5 h-5 text-stone-400" /> : <ChevronRight className="w-5 h-5 text-stone-400" />}
              </button>
            </div>
          </CardHeader>
          {openSteps.includes(9) && (
            <CardContent className="pt-0 space-y-3">
              <p className="text-sm text-stone-600">
                Para que no tengas que ejecutar <code className="bg-stone-100 px-1.5 py-0.5 rounded text-xs">start.bat</code> manualmente cada vez:
              </p>
              <div className="space-y-2">
                <div className="flex gap-3">
                  <Badge className="bg-stone-700 text-white h-6 w-6 flex items-center justify-center">a</Badge>
                  <p className="text-sm text-stone-700">Hacé click derecho en <code className="bg-stone-100 px-1.5 py-0.5 rounded text-xs">install-service.bat</code> → <strong>&quot;Ejecutar como administrador&quot;</strong></p>
                </div>
                <div className="flex gap-3">
                  <Badge className="bg-stone-700 text-white h-6 w-6 flex items-center justify-center">b</Badge>
                  <p className="text-sm text-stone-700">Se configura una tarea programada de Windows</p>
                </div>
                <div className="flex gap-3">
                  <Badge className="bg-stone-700 text-white h-6 w-6 flex items-center justify-center">c</Badge>
                  <p className="text-sm text-stone-700">Para verificar: reiniciá la PC y abrí <code className="bg-stone-100 px-1.5 py-0.5 rounded text-xs">http://localhost:9101</code> en el navegador</p>
                </div>
              </div>
              <p className="text-xs text-stone-400">Para desinstalar: ejecutá <code className="bg-stone-100 px-1.5 py-0.5 rounded text-xs">uninstall-service.bat</code> como Administrador</p>
            </CardContent>
          )}
        </Card>

        {/* ============================== */}
        {/* RESOLUCION DE PROBLEMAS         */}
        {/* ============================== */}
        <div className="mb-6 mt-8">
          <Button
            variant="outline"
            className="w-full justify-between"
            onClick={() => setShowTroubleshooting(!showTroubleshooting)}
          >
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              <span className="font-semibold">Resolución de Problemas</span>
            </div>
            {showTroubleshooting ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </Button>
        </div>

        {showTroubleshooting && (
          <Card className="mb-6">
            <CardContent className="pt-4 space-y-3">
              <TroubleshootItem
                symptom='No se puede conectar a python.org'
                cause="La PC de pesaje no tiene internet"
                solution="No hace falta internet. Todos los archivos se descargan desde otra PC (Pasos 0-1)."
              />
              <TroubleshootItem
                symptom='pip no funciona o falla al instalar pywin32'
                cause="Sin internet o pip roto"
                solution="Instalá pywin32 manualmente con el archivo .exe que bajaste en el Paso 1."
              />
              <TroubleshootItem
                symptom='La impresora no se detecta'
                cause="Driver no instalado, cable USB desconectado o impresora apagada"
                solution="1) Verificá que esté encendida\n2) Desconectá y reconectá el USB\n3) Probá otro puerto USB\n4) Instalá el driver de la Datamax\n5) Revisá en Panel de Control → Dispositivos e impresoras"
              />
              <TroubleshootItem
                symptom='El bridge arranca pero no imprime'
                cause="Nombre de impresora incorrecto o permisos"
                solution="1) Abrí http://localhost:9101\n2) Ejecutá el diagnóstico\n3) Verificá que el nombre coincida EXACTAMENTE\n4) Probá imprimir la etiqueta de prueba"
              />
              <TroubleshootItem
                symptom='El bridge se cierra solo'
                cause="Antivirus bloqueando python.exe"
                solution="Agregá una excepción en el antivirus para python.exe y la carpeta del bridge."
              />
              <TroubleshootItem
                symptom='No puedo acceder al panel web desde otra PC'
                cause="Firewall bloqueando los puertos o PCs en redes distintas"
                solution="1) Verificá el firewall de Windows (puertos 9100 y 9101)\n2) Verificá que ambas PCs estén en la misma red\n3) Ejecutá install.bat de nuevo para reabrir los puertos"
              />
              <TroubleshootItem
                symptom='Las etiquetas salen en blanco o con garabatos'
                cause="Formato de plantilla incorrecto"
                solution="La Datamax Mark II usa DPL, NO ZPL. Verificá que en TrazAlan la plantilla sea tipo DPL para Datamax."
              />
              <TroubleshootItem
                symptom='Puerto 9100 ya en uso'
                cause="Otra instancia del bridge corriendo"
                solution='Ejecutá: taskkill /F /IM python.exe\nO verificá que otro programa no use el puerto 9100.'
              />
              <TroubleshootItem
                symptom='Acceso denegado al imprimir'
                cause="Permisos insuficientes en Windows"
                solution="Ejecutá start.bat como Administrador (click derecho → Ejecutar como administrador)"
              />
            </CardContent>
          </Card>
        )}

        {/* Resumen técnico */}
        <Card className="mb-6 border border-stone-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2 text-stone-600">
              <FileText className="w-4 h-4" />
              Resumen técnico
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <h4 className="font-semibold text-stone-700 mb-2">Puertos</h4>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-stone-500">TCP 9100</span>
                    <span className="text-stone-700">Recibe datos de TrazAlan (DPL/ZPL)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-500">HTTP 9101</span>
                    <span className="text-stone-700">Panel de control web</span>
                  </div>
                </div>
              </div>
              <div>
                <h4 className="font-semibold text-stone-700 mb-2">Formatos soportados</h4>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-stone-500">DPL</span>
                    <span className="text-stone-700">Datamax (nativo)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-500">ZPL</span>
                    <span className="text-stone-700">Zebra (compatible)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-500">RAW</span>
                    <span className="text-stone-700">Cualquier dato directo</span>
                  </div>
                </div>
              </div>
              <div>
                <h4 className="font-semibold text-stone-700 mb-2">Archivos instalados</h4>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-stone-500">Carpeta</span>
                    <code className="text-xs text-stone-700">C:\SolemarAlimentaria\printer-bridge\</code>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-500">Config</span>
                    <code className="text-xs text-stone-700">printer-config.json</code>
                  </div>
                </div>
              </div>
              <div>
                <h4 className="font-semibold text-stone-700 mb-2">Flujo de impresión</h4>
                <div className="flex items-center gap-1 text-xs flex-wrap">
                  <Badge variant="outline" className="text-xs">TrazAlan</Badge>
                  <ArrowRight className="w-3 h-3 text-stone-400" />
                  <Badge variant="outline" className="text-xs">:9100</Badge>
                  <ArrowRight className="w-3 h-3 text-stone-400" />
                  <Badge variant="outline" className="text-xs">Bridge</Badge>
                  <ArrowRight className="w-3 h-3 text-stone-400" />
                  <Badge variant="outline" className="text-xs">USB</Badge>
                  <ArrowRight className="w-3 h-3 text-stone-400" />
                  <Badge variant="outline" className="text-xs">Datamax</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-xs text-stone-400 py-4">
          <p>Printer Bridge v3.1 — Solemar Alimentaria</p>
          <p className="mt-1">Datamax Mark II · Windows 7 · Python 3.8.10 · pywin32</p>
        </div>
      </div>
    </div>
  )
}
