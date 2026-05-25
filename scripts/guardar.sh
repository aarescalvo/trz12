#!/bin/bash

# ============================================
# GUARDAR CAMBIOS - SOLEMAR ALIMENTARIA
# ============================================
# Ejecutar al final de cada sesión de trabajo

set -e

echo "════════════════════════════════════════════════════"
echo "  💾 GUARDANDO CAMBIOS - SOLEMAR ALIMENTARIA"
echo "════════════════════════════════════════════════════"
echo ""

# Pedir mensaje de commit
if [ -z "$1" ]; then
    echo -n "📝 Mensaje de commit: "
    read COMMIT_MSG
else
    COMMIT_MSG="$1"
fi

if [ -z "$COMMIT_MSG" ]; then
    echo "❌ Error: Se requiere un mensaje de commit"
    exit 1
fi

echo ""
echo "📦 1/4 Verificando cambios..."
git status

echo ""
echo "📦 2/4 Haciendo commit..."
git add -A
git commit -m "$COMMIT_MSG"

echo ""
echo "📦 3/4 Subiendo a GitHub..."
git push origin master

echo ""
echo "📦 4/4 Creando backup local..."
bash scripts/backup.sh

echo ""
echo "════════════════════════════════════════════════════"
echo "  ✅ GUARDADO COMPLETADO"
echo "════════════════════════════════════════════════════"
echo ""
echo "🔗 GitHub: https://github.com/aarescalvo/903"
echo "📁 Google Drive: https://drive.google.com/drive/folders/1PvCRIW5jiHKBg-xJLeVhZI9E7YqxFepF"
echo ""
echo "💡 Para subir a Google Drive, ejecuta:"
echo "   python3 scripts/upload_gdrive.py"
echo ""
