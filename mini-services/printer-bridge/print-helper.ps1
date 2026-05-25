<#
.SYNOPSIS
    Helper para enviar datos RAW a impresora Windows.
    Usado por Printer Bridge (index.js).

    Estrategia en 5 pasos:
    1) StartDocPrinter con datatype "RAW" (Unicode) - Zebra
    2) StartDocPrinter con datatype "RAW" (ANSI) - Datamax (el driver reconoce RAW en ASCII)
    3) StartDocPrinter con datatype null (ANSI) - fallback
    4) OpenPrinter con PRINTER_DEFAULTS (ANSI) + WritePrinter
    5) Comando print.exe

.PARAMETER PrinterName
    Nombre exacto de la impresora en Windows.
.PARAMETER FilePath
    Path al archivo temporal con los datos a imprimir.
.OUTPUTS
    OK:1234        (exitos, 1234 bytes escritos)
    ERROR:mensaje  (error con descripcion)
#>
param(
    [Parameter(Mandatory=$true)]
    [string]$PrinterName,
    [Parameter(Mandatory=$true)]
    [string]$FilePath
)

if (-not (Test-Path $FilePath)) {
    Write-Output "ERROR:Archivo no encontrado: $FilePath"
    exit 1
}

$fileSize = (Get-Item $FilePath).Length
if ($fileSize -eq 0) {
    Write-Output "ERROR:Archivo vacio: $FilePath"
    exit 1
}

$data = [System.IO.File]::ReadAllBytes($FilePath)

# ============================================================
# Cargar Win32 API (Unicode + ANSI)
# ============================================================
try {
    $code = @'
using System;
using System.Runtime.InteropServices;

public class SpoolerPrint
{
    // DOC_INFO_1 Unicode
    [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Unicode)]
    public struct DOC_INFO_1W
    {
        public string pDocName;
        public string pOutputFile;
        public string pDatatype;
    }

    // DOC_INFO_1 ANSI - El driver Datamax reconoce "RAW" en ASCII
    [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Ansi)]
    public struct DOC_INFO_1A
    {
        public string pDocName;
        public string pOutputFile;
        public string pDatatype;
    }

    // OpenPrinter Unicode
    [DllImport("winspool.drv", CharSet = CharSet.Unicode, SetLastError = true)]
    public static extern bool OpenPrinter(string pPrinterName, out IntPtr phPrinter, IntPtr pDefault);

    // OpenPrinter ANSI
    [DllImport("winspool.drv", CharSet = CharSet.Ansi, SetLastError = true)]
    public static extern bool OpenPrinterA(string pPrinterName, out IntPtr phPrinter, IntPtr pDefault);

    // StartDocPrinter Unicode
    [DllImport("winspool.drv", CharSet = CharSet.Unicode, SetLastError = true)]
    public static extern bool StartDocPrinter(IntPtr hPrinter, int Level, ref DOC_INFO_1W pDocInfo);

    // StartDocPrinter ANSI
    [DllImport("winspool.drv", CharSet = CharSet.Ansi, SetLastError = true)]
    public static extern bool StartDocPrinterA(IntPtr hPrinter, int Level, ref DOC_INFO_1A pDocInfo);

    [DllImport("winspool.drv", SetLastError = true)]
    public static extern bool StartPagePrinter(IntPtr hPrinter);

    [DllImport("winspool.drv", SetLastError = true)]
    public static extern bool WritePrinter(IntPtr hPrinter, byte[] pBytes, int dwCount, out int dwWritten);

    [DllImport("winspool.drv", SetLastError = true)]
    public static extern bool EndPagePrinter(IntPtr hPrinter);

    [DllImport("winspool.drv", SetLastError = true)]
    public static extern bool EndDocPrinter(IntPtr hPrinter);

    [DllImport("winspool.drv", SetLastError = true)]
    public static extern bool ClosePrinter(IntPtr hPrinter);

    [DllImport("kernel32.dll")]
    public static extern uint GetLastError();
}
'@
    if (-not ([System.Management.Automation.PSTypeName]'SpoolerPrint').Type) {
        Add-Type -TypeDefinition $code -Language CSharp | Out-Null
    }
} catch {
    Write-Output "ERROR:Cargando Win32 API: $($_.Exception.Message)"
    exit 1
}

# ============================================================
# Imprimir via ANSI (metodo principal para Datamax)
# ============================================================
function Print-ANSI {
    param([string]$Printer, [byte[]]$Bytes, [string]$Datatype)

    $hPrinter = [IntPtr]::Zero
    $result = [SpoolerPrint]::OpenPrinterA($Printer, [ref]$hPrinter, [IntPtr]::Zero)
    if (-not $result) { throw "OpenPrinterA codigo:$([SpoolerPrint]::GetLastError())" }

    try {
        $docInfo = New-Object SpoolerPrint+DOC_INFO_1A
        $docInfo.pDocName = "PrinterBridge"
        $docInfo.pOutputFile = $null
        $docInfo.pDatatype = $Datatype

        $written = 0

        $result = [SpoolerPrint]::StartDocPrinterA($hPrinter, 1, [ref]$docInfo)
        if (-not $result) {
            $errCode = [SpoolerPrint]::GetLastError()
            throw "StartDocPrinterA codigo:$errCode"
        }

        $result = [SpoolerPrint]::StartPagePrinter($hPrinter)
        if (-not $result) {
            $errCode = [SpoolerPrint]::GetLastError()
            [SpoolerPrint]::EndDocPrinter($hPrinter) | Out-Null
            throw "StartPagePrinter codigo:$errCode"
        }

        $result = [SpoolerPrint]::WritePrinter($hPrinter, $Bytes, $Bytes.Length, [ref]$written)
        if (-not $result) {
            $errCode = [SpoolerPrint]::GetLastError()
            [SpoolerPrint]::EndPagePrinter($hPrinter) | Out-Null
            [SpoolerPrint]::EndDocPrinter($hPrinter) | Out-Null
            throw "WritePrinter codigo:$errCode"
        }

        [SpoolerPrint]::EndPagePrinter($hPrinter) | Out-Null
        [SpoolerPrint]::EndDocPrinter($hPrinter) | Out-Null
        return @{ success = $true; bytes = $written }
    } finally {
        if ($hPrinter -ne [IntPtr]::Zero) { [SpoolerPrint]::ClosePrinter($hPrinter) | Out-Null }
    }
}

# ============================================================
# Imprimir via Unicode (metodo para Zebra)
# ============================================================
function Print-Unicode {
    param([string]$Printer, [byte[]]$Bytes, [string]$Datatype)

    $hPrinter = [IntPtr]::Zero
    $result = [SpoolerPrint]::OpenPrinter($Printer, [ref]$hPrinter, [IntPtr]::Zero)
    if (-not $result) { throw "OpenPrinter codigo:$([SpoolerPrint]::GetLastError())" }

    try {
        $docInfo = New-Object SpoolerPrint+DOC_INFO_1W
        $docInfo.pDocName = "PrinterBridge"
        $docInfo.pOutputFile = $null
        $docInfo.pDatatype = $Datatype

        $written = 0

        $result = [SpoolerPrint]::StartDocPrinter($hPrinter, 1, [ref]$docInfo)
        if (-not $result) {
            $errCode = [SpoolerPrint]::GetLastError()
            throw "StartDocPrinter codigo:$errCode"
        }

        $result = [SpoolerPrint]::StartPagePrinter($hPrinter)
        if (-not $result) {
            $errCode = [SpoolerPrint]::GetLastError()
            [SpoolerPrint]::EndDocPrinter($hPrinter) | Out-Null
            throw "StartPagePrinter codigo:$errCode"
        }

        $result = [SpoolerPrint]::WritePrinter($hPrinter, $Bytes, $Bytes.Length, [ref]$written)
        if (-not $result) {
            $errCode = [SpoolerPrint]::GetLastError()
            [SpoolerPrint]::EndPagePrinter($hPrinter) | Out-Null
            [SpoolerPrint]::EndDocPrinter($hPrinter) | Out-Null
            throw "WritePrinter codigo:$errCode"
        }

        [SpoolerPrint]::EndPagePrinter($hPrinter) | Out-Null
        [SpoolerPrint]::EndDocPrinter($hPrinter) | Out-Null
        return @{ success = $true; bytes = $written }
    } finally {
        if ($hPrinter -ne [IntPtr]::Zero) { [SpoolerPrint]::ClosePrinter($hPrinter) | Out-Null }
    }
}

# ============================================================
# Ejecucion principal
# ============================================================
$errors = @()

# --- 1. Unicode + RAW (Zebra) ---
try {
    $r = Print-Unicode -Printer $PrinterName -Bytes $data -Datatype "RAW"
    if ($r.success) { Write-Output "OK:$($r.bytes)"; exit 0 }
} catch { $errors += "Uni+RAW: $($_.Exception.Message)" }

# --- 2. ANSI + RAW (Datamax) ---
try {
    $r = Print-ANSI -Printer $PrinterName -Bytes $data -Datatype "RAW"
    if ($r.success) { Write-Output "OK:$($r.bytes)"; exit 0 }
} catch { $errors += "ANSI+RAW: $($_.Exception.Message)" }

# --- 3. ANSI + null ---
try {
    $r = Print-ANSI -Printer $PrinterName -Bytes $data -Datatype $null
    if ($r.success) { Write-Output "OK:$($r.bytes)"; exit 0 }
} catch { $errors += "ANSI+null: $($_.Exception.Message)" }

# --- 4. Unicode + null ---
try {
    $r = Print-Unicode -Printer $PrinterName -Bytes $data -Datatype $null
    if ($r.success) { Write-Output "OK:$($r.bytes)"; exit 0 }
} catch { $errors += "Uni+null: $($_.Exception.Message)" }

# --- 5. print.exe ---
try {
    $out = cmd /c "print /d:`"$PrinterName`" `"$FilePath`"" 2>&1
    if ($LASTEXITCODE -le 1) { Write-Output "OK:$fileSize"; exit 0 }
    $errors += "print.exe: exit $LASTEXITCODE"
} catch { $errors += "print.exe: $($_.Exception.Message)" }

# Todos fallaron
Write-Output "ERROR:Ningun metodo funciono. Detalles:"
foreach ($e in $errors) { Write-Output "  $e" }
exit 1
