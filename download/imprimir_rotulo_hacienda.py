#!/usr/bin/env python3
"""
==============================================
 IMPRESION DE ROTULO DE INGRESO DE HACIENDA
 Impresora Zebra en red (ZPL sobre TCP/IP)
==============================================

USO:
  python imprimir_rotulo_hacienda.py

REQUISITOS:
  - Python 3.x
  - Impresora Zebra accesible en la red (puerto 9100)
"""

import socket
import time
import sys

# ============================================================
# CONFIGURACION — Modifica estos valores segun tu necesidad
# ============================================================
IMPRESORA_IP = "192.168.1.81"
IMPRESORA_PUERTO = 9100   # Puerto estandar para Zebra
TIMEOUT = 10              # Segundos de espera para conexion

# ============================================================
# DATOS SIMULADOS DEL INGRESO DE HACIENDA
# ============================================================
datos = {
    "nro_ingreso":    "2025-00012345",
    "fecha":          "19/05/2026",
    "contribuyente":  "EMPRESA ABC S.R.L.",
    "ruc_cedula":     "901234567-8",
    "concepto":       "IMPUESTO A LAS RENTAS DEL EJERCICIO",
    "periodo_fiscal": "MAYO 2026",
    "monto_letras":   "UN MILLON CIENTO VEINTE MIL GUARANIES",
    "monto_numero":   "G. 1.120.000",
    "caja":           "Caja Nro. 03",
    "cajero":         "Juan Perez",
    "forma_pago":     "EFECTIVO",
    "estado":         "PAGADO",
}


# ============================================================
# GENERADOR DE CODIGO ZPL
# ============================================================
def generar_zpl(d):
    """
    Genera el codigo ZPL para un rotulo de ingreso de hacienda.
    Dimensiones aproximadas: 100mm ancho x 150mm alto (203 dpi)
    """
    zpl = []

    # --- Inicio de formato ---
    zpl.append("^XA")                          # Inicia la etiqueta
    zpl.append("^CI28")                        # Codificacion UTF-8

    # --- Tamano de etiqueta ---
    zpl.append("^PW400")                       # 400 dots (~100mm a 203dpi)
    zpl.append("^LL600")                       # 600 dots (~150mm)

    # ================================================================
    #  ENCABEZADO
    # ================================================================
    # Linea superior gruesa
    zpl.append("^FO10,10^GB380,4,4,B^FS")

    # Titulo principal centrado
    zpl.append("^A0N,40,40^FB380,1,0,C^FO10,25^FDMINISTERIO DE HACIENDA^FS")

    # Subtitulo
    zpl.append("^A0N,28,28^FB380,1,0,C^FO10,75^FDADMINISTRACION TRIBUTARIA^FS")

    # Linea divisoria
    zpl.append("^FO10,110^GB380,2,2,B^FS")

    # Titulo del comprobante
    zpl.append("^A0N,30,30^FB380,1,0,C^FO10,120^FD** COMPROBANTE DE INGRESO **^FS")

    # Linea divisoria
    zpl.append("^FO10,158^GB380,2,2,B^FS")

    # ================================================================
    #  DATOS DEL INGRESO
    # ================================================================
    y = 172
    salto = 38

    # Nro. de Ingreso
    zpl.append(f"^A0N,22,22^FO10,{y}^FDDocumento Nro.:^FS")
    zpl.append(f"^A0B,24,24^FO200,{y}^FD{d['nro_ingreso']}^FS")
    y += salto

    # Fecha y Caja
    zpl.append(f"^A0N,22,22^FO10,{y}^FDFecha:^FS")
    zpl.append(f"^A0B,22,22^FO90,{y}^FD{d['fecha']}^FS")
    zpl.append(f"^A0N,22,22^FO210,{y}^FD{d['caja']}^FS")
    y += salto

    # Contribuyente
    zpl.append(f"^A0N,22,22^FO10,{y}^FDContribuyente:^FS")
    zpl.append(f"^A0B,22,22^FO200,{y}^FD{d['contribuyente']}^FS")
    y += salto

    # RUC / Cedula
    zpl.append(f"^A0N,22,22^FO10,{y}^FDRUC / Cedula:^FS")
    zpl.append(f"^A0B,22,22^FO200,{y}^FD{d['ruc_cedula']}^FS")
    y += salto + 5

    # Linea divisoria
    zpl.append(f"^FO10,{y}^GB380,1,1,B^FS")
    y += 10

    # Concepto
    zpl.append(f"^A0N,20,20^FO10,{y}^FDConcepto:^FS")
    y += 28
    zpl.append(f"^A0B,22,22^FB380,2,0,L^FO10,{y}^FD{d['concepto']}^FS")
    y += 55

    # Periodo Fiscal
    zpl.append(f"^A0N,22,22^FO10,{y}^FDPeriodo Fiscal:^FS")
    zpl.append(f"^A0B,22,22^FO200,{y}^FD{d['periodo_fiscal']}^FS")
    y += salto

    # Forma de Pago
    zpl.append(f"^A0N,22,22^FO10,{y}^FDForma de Pago:^FS")
    zpl.append(f"^A0B,22,22^FO200,{y}^FD{d['forma_pago']}^FS")
    y += salto + 5

    # Linea divisoria
    zpl.append(f"^FO10,{y}^GB380,1,1,B^FS")
    y += 12

    # ================================================================
    #  MONTO — Destacado
    # ================================================================
    # Caja con borde grueso para el monto
    zpl.append(f"^FO10,{y}^GB380,70,70,B^FS")     # Borde negro grueso
    zpl.append(f"^FO15,{y+3}^GB370,64,64,W^FS")   # Interior blanco

    zpl.append(f"^A0N,20,20^FO20,{y+5}^FDMONTO TOTAL:^FS")
    zpl.append(f"^A0B,30,30^FB370,1,0,R^FO20,{y+28}^FD{d['monto_numero']}^FS")

    y += 80

    # Monto en letras
    zpl.append(f"^A0N,16,16^FB380,2,0,C^FO10,{y}^FD({d['monto_letras']})^FS")
    y += 48

    # Linea divisoria
    zpl.append(f"^FO10,{y}^GB380,1,1,B^FS")
    y += 12

    # ================================================================
    #  PIE — Cajero y Estado
    # ================================================================
    zpl.append(f"^A0N,18,18^FO10,{y}^FDCajero:^FS")
    zpl.append(f"^A0B,18,18^FO100,{y}^FD{d['cajero']}^FS")

    # Estado (a la derecha)
    zpl.append(f"^A0B,20,20^FO300,{y-1}^FD{d['estado']}^FS")

    # Linea inferior gruesa
    zpl.append("^FO10,580^GB380,4,4,B^FS")

    # Pie de pagina
    zpl.append("^A0N,14,14^FB380,1,0,C^FO10,555^FDEste documento no tiene validez fiscal | Solo para pruebas^FS")

    # --- Fin de formato ---
    zpl.append("^XZ")

    return "\n".join(zpl)


# ============================================================
# FUNCION DE IMPRESION
# ============================================================
def enviar_a_impresora(ip, puerto, zpl_data, timeout=TIMEOUT):
    """Envia datos ZPL a la impresora Zebra via TCP/IP"""
    print(f"Conectando a {ip}:{puerto}...")
    try:
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(timeout)
        sock.connect((ip, puerto))
        print("✅ Conexion establecida.")

        sock.sendall(zpl_data.encode("utf-8"))
        print(f"📤 Datos enviados correctamente ({len(zpl_data)} bytes).")

        time.sleep(1)
        sock.close()
        print("🔌 Conexion cerrada.")
        return True

    except socket.timeout:
        print(f"❌ TIMEOUT: No se pudo conectar en {timeout} segundos.")
        print("   → Verifica que la impresora este encendida.")
        print("   → Verifica que la IP sea correcta.")
        print("   → Verifica que el puerto 9100 este habilitado.")
        return False
    except ConnectionRefusedError:
        print(f"❌ CONEXION RECHAZADA en {ip}:{puerto}.")
        print("   → La impresora puede estar apagada o no escuchar en el puerto 9100.")
        return False
    except Exception as e:
        print(f"❌ ERROR: {type(e).__name__}: {e}")
        return False


# ============================================================
# PROGRAMA PRINCIPAL
# ============================================================
def main():
    print("=" * 56)
    print("  IMPRESION ROTULO INGRESO DE HACIENDA - ZEBRA ZPL")
    print("=" * 56)
    print()

    # Mostrar datos simulados
    print("📋 DATOS DEL INGRESO:")
    print("-" * 40)
    for clave, valor in datos.items():
        etiqueta = clave.replace("_", " ").title()
        print(f"   {etiqueta:18s}: {valor}")
    print("-" * 40)
    print()

    # Generar ZPL
    print("🔧 Generando codigo ZPL...")
    zpl = generar_zpl(datos)
    print(f"   ZPL generado: {len(zpl)} caracteres, {zpl.count(chr(10))+1} lineas.")
    print()

    # Guardar ZPL en archivo para referencia
    zpl_file = "/home/z/my-project/download/rotulo_hacienda.zpl"
    with open(zpl_file, "w", encoding="utf-8") as f:
        f.write(zpl)
    print(f"💾 Codigo ZPL guardado en: {zpl_file}")
    print()

    # Enviar a impresora
    print("🖨️  Enviando a impresora...")
    print("-" * 40)
    exito = enviar_a_impresora(IMPRESORA_IP, IMPRESORA_PUERTO, zpl)
    print("-" * 40)
    print()

    if exito:
        print("🎉 ¡Rotulo enviado exitosamente! Revisa la impresora.")
    else:
        print("⚠️  No se pudo imprimir. Revisa la conexion con la impresora.")
        print()
        print("📋 SOLUCION DE PROBLEMAS:")
        print("   1. ¿La impresora esta encendida?")
        print("   2. ¿La IP 192.168.1.81 es correcta?")
        print("      (Verifica en el display/panel de la Zebra)")
        print("   3. ¿Estas en la misma red? (misma subred 192.168.1.x)")
        print("   4. ¿El firewall permite el puerto 9100?")
        print("   5. Copia este script a tu PC local y ejecutalo:")
        print("      python imprimir_rotulo_hacienda.py")


if __name__ == "__main__":
    main()
