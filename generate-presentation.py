#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Generador de Presentación PDF - Sistema de Trazabilidad Frigorífica
Presentación Gerencial Profesional
"""

from reportlab.lib.pagesizes import A4
from reportlab.lib.units import cm, inch
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_JUSTIFY
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Image, Table, TableStyle,
    PageBreak, KeepTogether, ListFlowable, ListItem
)
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfbase.pdfmetrics import registerFontFamily
from reportlab.platypus.tableofcontents import TableOfContents
import os

# ===== CONFIGURACIÓN DE FUENTES =====
# Registrar fuentes
pdfmetrics.registerFont(TTFont('Times New Roman', '/usr/share/fonts/truetype/english/Times-New-Roman.ttf'))
pdfmetrics.registerFont(TTFont('Calibri', '/usr/share/fonts/truetype/english/calibri-regular.ttf'))
pdfmetrics.registerFont(TTFont('DejaVuSans', '/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf'))

# Registrar familias de fuentes para permitir <b>, <super>, <sub>
registerFontFamily('Times New Roman', normal='Times New Roman', bold='Times New Roman')
registerFontFamily('Calibri', normal='Calibri', bold='Calibri')

# ===== COLORES CORPORATIVOS =====
DARK_BLUE = colors.HexColor('#1F4E79')
LIGHT_BLUE = colors.HexColor('#2E75B6')
ACCENT_BLUE = colors.HexColor('#5B9BD5')
LIGHT_GRAY = colors.HexColor('#F5F5F5')
DARK_GRAY = colors.HexColor('#333333')
WHITE = colors.white

# ===== ESTILOS =====
def create_styles():
    styles = getSampleStyleSheet()
    
    # Portada - Título principal
    styles.add(ParagraphStyle(
        name='CoverTitle',
        fontName='Times New Roman',
        fontSize=36,
        leading=44,
        alignment=TA_CENTER,
        textColor=DARK_BLUE,
        spaceAfter=20
    ))
    
    # Portada - Subtítulo
    styles.add(ParagraphStyle(
        name='CoverSubtitle',
        fontName='Times New Roman',
        fontSize=18,
        leading=24,
        alignment=TA_CENTER,
        textColor=LIGHT_BLUE,
        spaceAfter=12
    ))
    
    # Portada - Info
    styles.add(ParagraphStyle(
        name='CoverInfo',
        fontName='Times New Roman',
        fontSize=14,
        leading=20,
        alignment=TA_CENTER,
        textColor=DARK_GRAY,
        spaceAfter=8
    ))
    
    # Título de sección
    styles.add(ParagraphStyle(
        name='SectionTitle',
        fontName='Times New Roman',
        fontSize=20,
        leading=26,
        alignment=TA_LEFT,
        textColor=DARK_BLUE,
        spaceBefore=20,
        spaceAfter=12
    ))
    
    # Subtítulo
    styles.add(ParagraphStyle(
        name='SubTitle',
        fontName='Times New Roman',
        fontSize=14,
        leading=18,
        alignment=TA_LEFT,
        textColor=LIGHT_BLUE,
        spaceBefore=12,
        spaceAfter=8
    ))
    
    # Cuerpo de texto - modificar estilo existente
    styles['BodyText'].fontName = 'Times New Roman'
    styles['BodyText'].fontSize = 11
    styles['BodyText'].leading = 16
    styles['BodyText'].alignment = TA_JUSTIFY
    styles['BodyText'].textColor = DARK_GRAY
    styles['BodyText'].spaceBefore = 4
    styles['BodyText'].spaceAfter = 8
    
    # Texto destacado
    styles.add(ParagraphStyle(
        name='Highlight',
        fontName='Times New Roman',
        fontSize=12,
        leading=18,
        alignment=TA_LEFT,
        textColor=DARK_BLUE,
        spaceBefore=8,
        spaceAfter=8,
        leftIndent=20
    ))
    
    # Pie de imagen
    styles.add(ParagraphStyle(
        name='ImageCaption',
        fontName='Times New Roman',
        fontSize=10,
        leading=14,
        alignment=TA_CENTER,
        textColor=DARK_GRAY,
        spaceBefore=4,
        spaceAfter=12
    ))
    
    # Viñeta
    styles.add(ParagraphStyle(
        name='BulletItem',
        fontName='Times New Roman',
        fontSize=11,
        leading=16,
        alignment=TA_LEFT,
        textColor=DARK_GRAY,
        leftIndent=20,
        bulletIndent=10,
        spaceBefore=2,
        spaceAfter=4
    ))
    
    # Tabla - Encabezado
    styles.add(ParagraphStyle(
        name='TableHeader',
        fontName='Times New Roman',
        fontSize=10,
        leading=14,
        alignment=TA_CENTER,
        textColor=WHITE
    ))
    
    # Tabla - Celda
    styles.add(ParagraphStyle(
        name='TableCell',
        fontName='Times New Roman',
        fontSize=10,
        leading=14,
        alignment=TA_CENTER,
        textColor=DARK_GRAY
    ))
    
    # Tabla - Celda izquierda
    styles.add(ParagraphStyle(
        name='TableCellLeft',
        fontName='Times New Roman',
        fontSize=10,
        leading=14,
        alignment=TA_LEFT,
        textColor=DARK_GRAY
    ))
    
    return styles

# ===== FUNCIÓN PARA CREAR TABLA PROFESIONAL =====
def create_table(data, col_widths, header_rows=1):
    """Crear tabla con estilo profesional"""
    table = Table(data, colWidths=col_widths)
    
    style_commands = [
        # Encabezados
        ('BACKGROUND', (0, 0), (-1, header_rows-1), DARK_BLUE),
        ('TEXTCOLOR', (0, 0), (-1, header_rows-1), WHITE),
        ('FONTNAME', (0, 0), (-1, header_rows-1), 'Times New Roman'),
        ('FONTSIZE', (0, 0), (-1, header_rows-1), 10),
        # Cuerpo
        ('FONTNAME', (0, header_rows), (-1, -1), 'Times New Roman'),
        ('FONTSIZE', (0, header_rows), (-1, -1), 10),
        # Alineación
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        # Padding
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        # Grilla
        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
    ]
    
    # Filas alternas
    for i in range(header_rows, len(data)):
        if i % 2 == 0:
            style_commands.append(('BACKGROUND', (0, i), (-1, i), LIGHT_GRAY))
        else:
            style_commands.append(('BACKGROUND', (0, i), (-1, i), WHITE))
    
    table.setStyle(TableStyle(style_commands))
    return table

# ===== CONTENIDO DEL PDF =====
def build_content(styles, assets_dir):
    story = []
    
    # ========================================
    # PORTADA
    # ========================================
    story.append(Spacer(1, 80))
    
    # Imagen de portada
    cover_img_path = os.path.join(assets_dir, 'cover.png')
    if os.path.exists(cover_img_path):
        img = Image(cover_img_path, width=16*cm, height=9*cm)
        story.append(img)
    
    story.append(Spacer(1, 30))
    
    # Título
    story.append(Paragraph('<b>SISTEMA DE TRAZABILIDAD</b>', styles['CoverTitle']))
    story.append(Paragraph('Frigorífico - Gestión Integral del Ciclo Productivo', styles['CoverSubtitle']))
    
    story.append(Spacer(1, 20))
    
    # Línea decorativa
    line_data = [['', '', '']]
    line_table = Table(line_data, colWidths=[5*cm, 6*cm, 5*cm])
    line_table.setStyle(TableStyle([
        ('LINEBELOW', (1, 0), (1, 0), 2, DARK_BLUE),
    ]))
    story.append(line_table)
    
    story.append(Spacer(1, 30))
    
    # Información de la empresa
    story.append(Paragraph('Presentación Gerencial', styles['CoverInfo']))
    story.append(Paragraph('Solemar Alimentaria S.A.', styles['CoverInfo']))
    story.append(Paragraph('2025', styles['CoverInfo']))
    
    story.append(PageBreak())
    
    # ========================================
    # ÍNDICE
    # ========================================
    story.append(Paragraph('<b>ÍNDICE</b>', styles['SectionTitle']))
    story.append(Spacer(1, 20))
    
    toc_items = [
        ('1. Descripción del Sistema', '3'),
        ('2. Funcionalidades Principales', '4'),
        ('3. Ventajas Competitivas', '6'),
        ('4. Funcionamiento Online y Offline', '7'),
        ('5. Flujo del Proceso Productivo', '8'),
        ('6. Interfaces del Sistema', '9'),
        ('7. Acceso Móvil y Estadísticas', '11'),
        ('8. Mejoras Futuras', '12'),
        ('9. Conclusión', '13'),
    ]
    
    for item, page in toc_items:
        toc_data = [[
            Paragraph(item, styles['BodyText']),
            Paragraph(page, styles['BodyText'])
        ]]
        toc_table = Table(toc_data, colWidths=[14*cm, 2*cm])
        toc_table.setStyle(TableStyle([
            ('ALIGN', (0, 0), (0, 0), 'LEFT'),
            ('ALIGN', (1, 0), (1, 0), 'RIGHT'),
            ('LINEBELOW', (0, 0), (0, 0), 0.5, colors.lightgrey),
        ]))
        story.append(toc_table)
        story.append(Spacer(1, 4))
    
    story.append(PageBreak())
    
    # ========================================
    # 1. DESCRIPCIÓN DEL SISTEMA
    # ========================================
    story.append(Paragraph('<b>1. DESCRIPCIÓN DEL SISTEMA</b>', styles['SectionTitle']))
    
    story.append(Paragraph(
        'El <b>Sistema de Trazabilidad Frigorífica</b> es una plataforma integral diseñada para gestionar '
        'y controlar todo el ciclo productivo de la industria frigorífica, desde la recepción de animales '
        'hasta el despacho de productos terminados.',
        styles['BodyText']
    ))
    
    story.append(Spacer(1, 12))
    story.append(Paragraph('<b>Objetivos Principales:</b>', styles['SubTitle']))
    
    objectives = [
        'Control total del proceso productivo en tiempo real',
        'Trazabilidad completa desde el origen hasta el destino final',
        'Cumplimiento de normativas SENASA y estándares de calidad',
        'Optimización de recursos y reducción de errores',
        'Generación automática de documentación oficial',
        'Acceso a información estadística para toma de decisiones'
    ]
    
    for obj in objectives:
        story.append(Paragraph(f'• {obj}', styles['BulletItem']))
    
    story.append(Spacer(1, 12))
    story.append(Paragraph('<b>Módulos del Sistema:</b>', styles['SubTitle']))
    
    story.append(Paragraph(
        'El sistema está organizado en módulos especializados que cubren todas las etapas del proceso:',
        styles['BodyText']
    ))
    
    modules_data = [
        [Paragraph('<b>CICLO I</b>', styles['TableHeader']), Paragraph('<b>CICLO II</b>', styles['TableHeader']), Paragraph('<b>SUBPRODUCTOS</b>', styles['TableHeader'])],
        [Paragraph('Pesaje Camiones', styles['TableCell']), Paragraph('Cuarteo', styles['TableCell']), Paragraph('Menudencias', styles['TableCell'])],
        [Paragraph('Pesaje Individual', styles['TableCell']), Paragraph('Despostada', styles['TableCell']), Paragraph('Cueros', styles['TableCell'])],
        [Paragraph('Movimiento Hacienda', styles['TableCell']), Paragraph('Cortes', styles['TableCell']), Paragraph('Grasa', styles['TableCell'])],
        [Paragraph('Lista de Faena', styles['TableCell']), Paragraph('Empaque', styles['TableCell']), Paragraph('Desperdicios', styles['TableCell'])],
        [Paragraph('Ingreso a Cajón', styles['TableCell']), Paragraph('', styles['TableCell']), Paragraph('', styles['TableCell'])],
        [Paragraph('Romaneo', styles['TableCell']), Paragraph('', styles['TableCell']), Paragraph('', styles['TableCell'])],
        [Paragraph('Expedición', styles['TableCell']), Paragraph('', styles['TableCell']), Paragraph('', styles['TableCell'])],
    ]
    
    story.append(Spacer(1, 8))
    story.append(create_table(modules_data, [5.5*cm, 5.5*cm, 5.5*cm]))
    story.append(Paragraph('Tabla 1: Módulos principales del sistema', styles['ImageCaption']))
    
    story.append(PageBreak())
    
    # ========================================
    # 2. FUNCIONALIDADES PRINCIPALES
    # ========================================
    story.append(Paragraph('<b>2. FUNCIONALIDADES PRINCIPALES</b>', styles['SectionTitle']))
    
    story.append(Paragraph('<b>2.1 Gestión de Tropas y Animales</b>', styles['SubTitle']))
    story.append(Paragraph(
        'Sistema completo para el registro y seguimiento de tropas de animales, incluyendo:'
    , styles['BodyText']))
    
    features_tropas = [
        'Registro de datos de origen: productor, DTE, guía de tránsito',
        'Asignación automática de corrales con control de capacidad',
        'Seguimiento individual de cada animal mediante caravanas/aretes',
        'Control de tipos de animales: novillos, vaquillonas, toros, etc.',
        'Historial completo de movimientos y estados'
    ]
    for f in features_tropas:
        story.append(Paragraph(f'• {f}', styles['BulletItem']))
    
    story.append(Spacer(1, 10))
    story.append(Paragraph('<b>2.2 Pesaje Individual</b>', styles['SubTitle']))
    story.append(Paragraph(
        'Módulo de pesaje individual con integración a balanzas electrónicas:'
    , styles['BodyText']))
    
    features_pesaje = [
        'Conexión directa con balanzas digitales mediante protocolo serial',
        'Lectura automática de caravanas RFID',
        'Registro instantáneo de peso con validación de rangos',
        'Cálculo automático de peso promedio por tropa',
        'Reportes de rendimiento y variación de peso'
    ]
    for f in features_pesaje:
        story.append(Paragraph(f'• {f}', styles['BulletItem']))
    
    story.append(Spacer(1, 10))
    story.append(Paragraph('<b>2.3 Lista de Faena</b>', styles['SubTitle']))
    story.append(Paragraph(
        'Planificación y control de la faena diaria:'
    , styles['BodyText']))
    
    features_faena = [
        'Selección de animales por tropa para faena',
        'Control de cantidad máxima diaria',
        'Generación de listados ordenados por garrón',
        'Impresión de planillas de faena',
        'Seguimiento del progreso en tiempo real'
    ]
    for f in features_faena:
        story.append(Paragraph(f'• {f}', styles['BulletItem']))
    
    story.append(Spacer(1, 10))
    story.append(Paragraph('<b>2.4 Ingreso a Cajón</b>', styles['SubTitle']))
    story.append(Paragraph(
        'Asignación de números de garrón a cada animal:'
    , styles['BodyText']))
    
    features_cajon = [
        'Asignación correlativa automática de garrones',
        'Vinculación animal-garrón para trazabilidad',
        'Control de ingreso a línea de faena',
        'Registro de hora de ingreso',
        'Validación de animales pendientes'
    ]
    for f in features_cajon:
        story.append(Paragraph(f'• {f}', styles['BulletItem']))
    
    story.append(PageBreak())
    
    story.append(Paragraph('<b>2.5 Romaneo</b>', styles['SubTitle']))
    story.append(Paragraph(
        'Registro de pesos de medias reses y tipificación:'
    , styles['BodyText']))
    
    features_romaneo = [
        'Pesaje de media res izquierda y derecha',
        'Registro de tipificación (dentición, categoría)',
        'Cálculo automático de rinde porcentual',
        'Generación de etiquetas con código de barras',
        'Envío automático de informes por email',
        'Integración con balanzas de plataforma'
    ]
    for f in features_romaneo:
        story.append(Paragraph(f'• {f}', styles['BulletItem']))
    
    story.append(Spacer(1, 10))
    story.append(Paragraph('<b>2.6 Gestión de Stock en Cámaras</b>', styles['SubTitle']))
    story.append(Paragraph(
        'Control de inventario en cámaras frigoríficas:'
    , styles['BodyText']))
    
    features_stock = [
        'Seguimiento de medias reses por cámara',
        'Control de temperatura en tiempo real',
        'Gestión de ubicaciones y ganchos',
        'Movimientos entre cámaras',
        'Alertas de capacidad máxima',
        'Trazabilidad completa por lote/tropa'
    ]
    for f in features_stock:
        story.append(Paragraph(f'• {f}', styles['BulletItem']))
    
    story.append(Spacer(1, 10))
    story.append(Paragraph('<b>2.7 Reportes y Documentación</b>', styles['SubTitle']))
    story.append(Paragraph(
        'Generación automática de documentación oficial:'
    , styles['BodyText']))
    
    features_reportes = [
        'Planilla 01 SENASA automatizada',
        'Rótulos con código de barras EAN-128',
        'Reportes de rinde por tropa y usuario',
        'Declaraciones juradas automatizadas',
        'Certificados CCIR para exportación',
        'Estadísticas de producción diaria/semanal/mensual'
    ]
    for f in features_reportes:
        story.append(Paragraph(f'• {f}', styles['BulletItem']))
    
    story.append(PageBreak())
    
    # ========================================
    # 3. VENTAJAS COMPETITIVAS
    # ========================================
    story.append(Paragraph('<b>3. VENTAJAS COMPETITIVAS</b>', styles['SectionTitle']))
    
    story.append(Paragraph('<b>3.1 Eficiencia Operativa</b>', styles['SubTitle']))
    
    advantages_data = [
        [Paragraph('<b>Aspecto</b>', styles['TableHeader']), 
         Paragraph('<b>Sin Sistema</b>', styles['TableHeader']), 
         Paragraph('<b>Con Sistema</b>', styles['TableHeader'])],
        [Paragraph('Registro de datos', styles['TableCellLeft']), 
         Paragraph('Manual en planillas', styles['TableCell']), 
         Paragraph('Automático digital', styles['TableCell'])],
        [Paragraph('Búsqueda de información', styles['TableCellLeft']), 
         Paragraph('Minutos/Horas', styles['TableCell']), 
         Paragraph('Segundos', styles['TableCell'])],
        [Paragraph('Generación de reportes', styles['TableCellLeft']), 
         Paragraph('Manual, días', styles['TableCell']), 
         Paragraph('Automático, instantáneo', styles['TableCell'])],
        [Paragraph('Errores de registro', styles['TableCellLeft']), 
         Paragraph('Frecuentes', styles['TableCell']), 
         Paragraph('Mínimos', styles['TableCell'])],
        [Paragraph('Trazabilidad', styles['TableCellLeft']), 
         Paragraph('Parcial/Difícil', styles['TableCell']), 
         Paragraph('Completa/Inmediata', styles['TableCell'])],
    ]
    
    story.append(Spacer(1, 8))
    story.append(create_table(advantages_data, [5*cm, 5.5*cm, 5.5*cm]))
    story.append(Paragraph('Tabla 2: Comparativa de eficiencia operativa', styles['ImageCaption']))
    
    story.append(Spacer(1, 12))
    story.append(Paragraph('<b>3.2 Cumplimiento Normativo</b>', styles['SubTitle']))
    story.append(Paragraph(
        'El sistema garantiza el cumplimiento de todas las normativas vigentes:'
    , styles['BodyText']))
    
    compliance_items = [
        'Resolución SENASA 423/2017 - Trazabilidad Animal',
        'Protocolos de Bienestar Animal',
        'Normativas de Higiene y Seguridad Alimentaria',
        'Requisitos de exportación (UE, China, Chile)',
        'Documentación fiscal y comercial'
    ]
    for item in compliance_items:
        story.append(Paragraph(f'• {item}', styles['BulletItem']))
    
    story.append(Spacer(1, 12))
    story.append(Paragraph('<b>3.3 Toma de Decisiones</b>', styles['SubTitle']))
    story.append(Paragraph(
        'Información en tiempo real para decisiones estratégicas:'
    , styles['BodyText']))
    
    decision_items = [
        'Dashboard con KPIs actualizados',
        'Análisis de rindes por proveedor',
        'Comparativas de producción histórica',
        'Alertas automáticas de desviaciones',
        'Proyecciones basadas en datos históricos'
    ]
    for item in decision_items:
        story.append(Paragraph(f'• {item}', styles['BulletItem']))
    
    story.append(PageBreak())
    
    # ========================================
    # 4. FUNCIONAMIENTO ONLINE Y OFFLINE
    # ========================================
    story.append(Paragraph('<b>4. FUNCIONAMIENTO ONLINE Y OFFLINE</b>', styles['SectionTitle']))
    
    story.append(Paragraph('<b>4.1 Modo Online</b>', styles['SubTitle']))
    story.append(Paragraph(
        'En condiciones normales, el sistema opera conectado a la red local/Internet, '
        'permitiendo:'
    , styles['BodyText']))
    
    online_features = [
        'Sincronización en tiempo real entre todos los terminales',
        'Acceso remoto desde cualquier ubicación autorizada',
        'Respaldo automático de datos en la nube',
        'Actualizaciones de sistema centralizadas',
        'Impresión remota de rótulos y documentos',
        'Notificaciones push a supervisores'
    ]
    for f in online_features:
        story.append(Paragraph(f'• {f}', styles['BulletItem']))
    
    story.append(Spacer(1, 12))
    story.append(Paragraph('<b>4.2 Modo Offline</b>', styles['SubTitle']))
    story.append(Paragraph(
        'El sistema está diseñado para operar sin conexión a Internet, lo cual es crítico '
        'en entornos industriales donde la conectividad puede ser intermitente:'
    , styles['BodyText']))
    
    offline_features = [
        'Base de datos local en cada terminal',
        'Funcionamiento completo sin conexión',
        'Cola de sincronización pendiente',
        'Resolución automática de conflictos',
        'Continuidad operativa garantizada',
        'Sincronización automática al recuperar conexión'
    ]
    for f in offline_features:
        story.append(Paragraph(f'• {f}', styles['BulletItem']))
    
    story.append(Spacer(1, 12))
    story.append(Paragraph('<b>4.3 Arquitectura Híbrida</b>', styles['SubTitle']))
    
    arch_data = [
        [Paragraph('<b>Componente</b>', styles['TableHeader']), 
         Paragraph('<b>Ubicación</b>', styles['TableHeader']), 
         Paragraph('<b>Función</b>', styles['TableHeader'])],
        [Paragraph('Base de Datos', styles['TableCellLeft']), 
         Paragraph('Servidor Local', styles['TableCell']), 
         Paragraph('Almacenamiento principal', styles['TableCell'])],
        [Paragraph('Aplicación Web', styles['TableCellLeft']), 
         Paragraph('Servidor Local', styles['TableCell']), 
         Paragraph('Interfaz de usuario', styles['TableCell'])],
        [Paragraph('Cache Local', styles['TableCellLeft']), 
         Paragraph('Terminales', styles['TableCell']), 
         Paragraph('Operación offline', styles['TableCell'])],
        [Paragraph('Backup Remoto', styles['TableCellLeft']), 
         Paragraph('Nube (opcional)', styles['TableCell']), 
         Paragraph('Respaldo/sincronización', styles['TableCell'])],
    ]
    
    story.append(Spacer(1, 8))
    story.append(create_table(arch_data, [4*cm, 5*cm, 6*cm]))
    story.append(Paragraph('Tabla 3: Arquitectura del sistema', styles['ImageCaption']))
    
    story.append(PageBreak())
    
    # ========================================
    # 5. FLUJO DEL PROCESO PRODUCTIVO
    # ========================================
    story.append(Paragraph('<b>5. FLUJO DEL PROCESO PRODUCTIVO</b>', styles['SectionTitle']))
    
    story.append(Paragraph(
        'El siguiente diagrama muestra el flujo completo del proceso productivo, desde '
        'la recepción de animales hasta el despacho de productos:',
        styles['BodyText']
    ))
    
    story.append(Spacer(1, 12))
    
    # Imagen del diagrama de flujo
    flowchart_path = os.path.join(assets_dir, 'flowchart.png')
    if os.path.exists(flowchart_path):
        img = Image(flowchart_path, width=16*cm, height=9*cm)
        story.append(img)
        story.append(Paragraph('Figura 1: Diagrama de flujo del proceso productivo', styles['ImageCaption']))
    
    story.append(Spacer(1, 12))
    story.append(Paragraph('<b>Etapas del Proceso:</b>', styles['SubTitle']))
    
    process_steps = [
        ('Recepción', 'Ingreso de tropas con documentación (DTE, guía)'),
        ('Corrales', 'Alojamiento temporal y control sanitario'),
        ('Pesaje Individual', 'Registro de peso vivo por animal'),
        ('Lista de Faena', 'Selección y programación de faena'),
        ('Ingreso a Cajón', 'Asignación de número de garrón'),
        ('Faena', 'Proceso de faena y obtención de medias reses'),
        ('Romaneo', 'Pesaje de medias reses y tipificación'),
        ('Cámaras', 'Almacenamiento refrigerado'),
        ('Despacho', 'Expedición a clientes'),
    ]
    
    for i, (step, desc) in enumerate(process_steps, 1):
        story.append(Paragraph(f'<b>{i}. {step}:</b> {desc}', styles['BodyText']))
    
    story.append(PageBreak())
    
    # ========================================
    # 6. INTERFACES DEL SISTEMA
    # ========================================
    story.append(Paragraph('<b>6. INTERFACES DEL SISTEMA</b>', styles['SectionTitle']))
    
    story.append(Paragraph('<b>6.1 Panel de Control Principal</b>', styles['SubTitle']))
    story.append(Paragraph(
        'El dashboard principal proporciona una visión general del estado operativo:',
        styles['BodyText']
    ))
    
    story.append(Spacer(1, 8))
    dashboard_path = os.path.join(assets_dir, 'dashboard.png')
    if os.path.exists(dashboard_path):
        img = Image(dashboard_path, width=15*cm, height=8.5*cm)
        story.append(img)
        story.append(Paragraph('Figura 2: Panel de control con estadísticas en tiempo real', styles['ImageCaption']))
    
    story.append(Paragraph(
        'Elementos del dashboard: KPIs de producción, tropas en proceso, alertas, '
        'gráficos de rendimiento y accesos rápidos a módulos.',
        styles['BodyText']
    ))
    
    story.append(Spacer(1, 12))
    story.append(Paragraph('<b>6.2 Interfaz de Pesaje Individual</b>', styles['SubTitle']))
    story.append(Paragraph(
        'Diseñada para operación rápida en ambiente industrial:',
        styles['BodyText']
    ))
    
    story.append(Spacer(1, 8))
    pesaje_path = os.path.join(assets_dir, 'pesaje.png')
    if os.path.exists(pesaje_path):
        img = Image(pesaje_path, width=11*cm, height=11*cm)
        story.append(img)
        story.append(Paragraph('Figura 3: Interfaz de pesaje individual con balanza integrada', styles['ImageCaption']))
    
    story.append(PageBreak())
    
    story.append(Paragraph('<b>6.3 Gestión de Stock en Cámaras</b>', styles['SubTitle']))
    story.append(Paragraph(
        'Control visual del inventario en cámaras frigoríficas:',
        styles['BodyText']
    ))
    
    story.append(Spacer(1, 8))
    stock_path = os.path.join(assets_dir, 'stock-camara.png')
    if os.path.exists(stock_path):
        img = Image(stock_path, width=15*cm, height=8.5*cm)
        story.append(img)
        story.append(Paragraph('Figura 4: Interfaz de gestión de stock en cámaras', styles['ImageCaption']))
    
    story.append(Spacer(1, 12))
    story.append(Paragraph('<b>6.4 Características de Diseño</b>', styles['SubTitle']))
    
    design_features = [
        'Interfaz responsive adaptable a diferentes resoluciones',
        'Tema claro/oscuro para reducción de fatiga visual',
        'Botones grandes para operación con guantes',
        'Atajos de teclado para operaciones frecuentes',
        'Feedback visual y sonoro para confirmaciones',
        'Accesibilidad para usuarios con discapacidades'
    ]
    for f in design_features:
        story.append(Paragraph(f'• {f}', styles['BulletItem']))
    
    story.append(PageBreak())
    
    # ========================================
    # 7. ACCESO MÓVIL Y ESTADÍSTICAS
    # ========================================
    story.append(Paragraph('<b>7. ACCESO MÓVIL Y ESTADÍSTICAS</b>', styles['SectionTitle']))
    
    story.append(Paragraph('<b>7.1 Aplicación Móvil</b>', styles['SubTitle']))
    story.append(Paragraph(
        'El sistema ofrece acceso completo desde dispositivos móviles, permitiendo '
        'a gerentes y supervisores monitorear las operaciones desde cualquier ubicación:',
        styles['BodyText']
    ))
    
    story.append(Spacer(1, 8))
    mobile_path = os.path.join(assets_dir, 'mobile-app.png')
    if os.path.exists(mobile_path):
        img = Image(mobile_path, width=6*cm, height=10.5*cm)
        story.append(img)
        story.append(Paragraph('Figura 5: Aplicación móvil con estadísticas en tiempo real', styles['ImageCaption']))
    
    story.append(Spacer(1, 12))
    story.append(Paragraph('<b>7.2 Funcionalidades Móviles</b>', styles['SubTitle']))
    
    mobile_features = [
        'Dashboard ejecutivo con KPIs principales',
        'Gráficos de producción en tiempo real',
        'Alertas y notificaciones push',
        'Aprobación de documentos pendientes',
        'Consulta de trazabilidad por código',
        'Reportes descargables en PDF/Excel'
    ]
    for f in mobile_features:
        story.append(Paragraph(f'• {f}', styles['BulletItem']))
    
    story.append(Spacer(1, 12))
    story.append(Paragraph('<b>7.3 Estadísticas Disponibles</b>', styles['SubTitle']))
    
    stats_data = [
        [Paragraph('<b>Área</b>', styles['TableHeader']), 
         Paragraph('<b>Métricas</b>', styles['TableHeader'])],
        [Paragraph('Producción', styles['TableCellLeft']), 
         Paragraph('Animales faenados, kg producidos, rinde promedio', styles['TableCell'])],
        [Paragraph('Calidad', styles['TableCellLeft']), 
         Paragraph('Tipificación, conformación, distribución por categorías', styles['TableCell'])],
        [Paragraph('Eficiencia', styles['TableCellLeft']), 
         Paragraph('Tiempos de proceso, utilización de capacidad', styles['TableCell'])],
        [Paragraph('Comercial', styles['TableCellLeft']), 
         Paragraph('Despachos por cliente, stock disponible', styles['TableCell'])],
        [Paragraph('Trazabilidad', styles['TableCellLeft']), 
         Paragraph('Origen de productos, tiempo en cámara, rutas', styles['TableCell'])],
    ]
    
    story.append(Spacer(1, 8))
    story.append(create_table(stats_data, [4*cm, 12*cm]))
    story.append(Paragraph('Tabla 4: Métricas estadísticas disponibles', styles['ImageCaption']))
    
    story.append(PageBreak())
    
    # ========================================
    # 8. MEJORAS FUTURAS
    # ========================================
    story.append(Paragraph('<b>8. MEJORAS FUTURAS</b>', styles['SectionTitle']))
    
    story.append(Paragraph(
        'El sistema está diseñado con una arquitectura escalable que permite incorporar '
        'nuevas funcionalidades según las necesidades del negocio:',
        styles['BodyText']
    ))
    
    story.append(Spacer(1, 12))
    story.append(Paragraph('<b>8.1 Corto Plazo (6-12 meses)</b>', styles['SubTitle']))
    
    short_term = [
        'Integración con lectores RFID para identificación automática',
        'Módulo de mantenimiento predictivo de equipos',
        'Dashboard de bienestar animal',
        'Integración con sistemas de gestión contable',
        'Notificaciones por WhatsApp/SMS'
    ]
    for item in short_term:
        story.append(Paragraph(f'• {item}', styles['BulletItem']))
    
    story.append(Spacer(1, 12))
    story.append(Paragraph('<b>8.2 Mediano Plazo (12-24 meses)</b>', styles['SubTitle']))
    
    medium_term = [
        'Inteligencia artificial para predicción de rindes',
        'Sistema de visión artificial para clasificación',
        'Blockchain para trazabilidad inmutable',
        'Integración con plataformas de e-commerce',
        'Módulo de gestión de calidad integrado (ISO 22000)'
    ]
    for item in medium_term:
        story.append(Paragraph(f'• {item}', styles['BulletItem']))
    
    story.append(Spacer(1, 12))
    story.append(Paragraph('<b>8.3 Largo Plazo (24+ meses)</b>', styles['SubTitle']))
    
    long_term = [
        'Gemelo digital de la planta frigorífica',
        'Automatización completa de reportes regulatorios',
        'Marketplace B2B integrado',
        'Sistema de trazabilidad de carbono (huella de carbono)',
        'Integración con sistemas de agricultura de precisión'
    ]
    for item in long_term:
        story.append(Paragraph(f'• {item}', styles['BulletItem']))
    
    story.append(PageBreak())
    
    # ========================================
    # 9. CONCLUSIÓN
    # ========================================
    story.append(Paragraph('<b>9. CONCLUSIÓN</b>', styles['SectionTitle']))
    
    story.append(Paragraph(
        'El <b>Sistema de Trazabilidad Frigorífica</b> representa una solución integral y moderna '
        'para la gestión de operaciones en la industria cárnica. Sus principales fortalezas son:',
        styles['BodyText']
    ))
    
    story.append(Spacer(1, 12))
    
    conclusions = [
        ('Control Total', 'Visibilidad completa del proceso productivo en tiempo real'),
        ('Trazabilidad', 'Seguimiento desde el origen hasta el consumidor final'),
        ('Cumplimiento', 'Alineación con normativas nacionales e internacionales'),
        ('Eficiencia', 'Reducción de errores y optimización de recursos'),
        ('Flexibilidad', 'Operación online y offline para continuidad operativa'),
        ('Escalabilidad', 'Arquitectura preparada para crecimiento futuro'),
    ]
    
    for title, desc in conclusions:
        story.append(Paragraph(f'<b>• {title}:</b> {desc}', styles['BodyText']))
    
    story.append(Spacer(1, 20))
    
    # Cita final
    quote_style = ParagraphStyle(
        name='Quote',
        fontName='Times New Roman',
        fontSize=12,
        leading=18,
        alignment=TA_CENTER,
        textColor=LIGHT_BLUE,
        leftIndent=30,
        rightIndent=30,
        spaceBefore=20,
        spaceAfter=20
    )
    story.append(Paragraph(
        '"La trazabilidad no es solo un requisito regulatorio, es una herramienta '
        'estratégica para la excelencia operativa y la confianza del consumidor."',
        quote_style
    ))
    
    story.append(Spacer(1, 30))
    
    # Información de contacto
    story.append(Paragraph('<b>Información de Contacto</b>', styles['SubTitle']))
    story.append(Paragraph('Solemar Alimentaria S.A.', styles['BodyText']))
    story.append(Paragraph('Ruta 9 KM 45, Córdoba, Argentina', styles['BodyText']))
    story.append(Paragraph('Tel: +54 351 456-7890', styles['BodyText']))
    story.append(Paragraph('Email: contacto@solemar.com.ar', styles['BodyText']))
    
    return story

# ===== FUNCIÓN PRINCIPAL =====
def main():
    # Configuración
    output_file = '/home/z/my-project/public/Sistema-Trazabilidad-Presentacion.pdf'
    assets_dir = '/home/z/my-project/presentation-assets'
    
    # Crear estilos
    styles = create_styles()
    
    # Crear documento
    doc = SimpleDocTemplate(
        output_file,
        pagesize=A4,
        leftMargin=2*cm,
        rightMargin=2*cm,
        topMargin=2*cm,
        bottomMargin=2*cm,
        title='Sistema de Trazabilidad - Presentación Gerencial',
        author='Z.ai',
        creator='Z.ai',
        subject='Presentación del Sistema de Trazabilidad Frigorífica'
    )
    
    # Construir contenido
    story = build_content(styles, assets_dir)
    
    # Generar PDF
    doc.build(story)
    
    print(f"PDF generado exitosamente: {output_file}")
    return output_file

if __name__ == '__main__':
    main()
