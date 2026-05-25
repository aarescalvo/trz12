#!/usr/bin/env python3
"""
Backup a Google Drive - Solemar Alimentaria

CONFIGURACIÓN INICIAL:
1. Ir a https://console.cloud.google.com/
2. Crear un proyecto nuevo
3. Habilitar Google Drive API
4. Crear credenciales OAuth 2.0 (tipo "Desktop app")
5. Descargar el JSON y guardarlo como 'credentials.json' en esta carpeta
6. Instalar dependencias: pip install google-auth-oauthlib google-auth-httplib2 google-api-python-client

USO:
    python3 upload_gdrive.py                    # Sube el último backup
    python3 upload_gdrive.py archivo.tar.gz     # Sube un archivo específico
"""

import os
import sys
import glob
from pathlib import Path

try:
    from google.oauth2.credentials import Credentials
    from google_auth_oauthlib.flow import InstalledAppFlow
    from google.auth.transport.requests import Request
    from googleapiclient.discovery import build
    from googleapiclient.http import MediaFileUpload
except ImportError:
    print("=" * 50)
    print("❌ Faltan dependencias. Instalar con:")
    print()
    print("    pip install google-auth-oauthlib google-auth-httplib2 google-api-python-client")
    print()
    print("=" * 50)
    sys.exit(1)

# Configuración
SCOPES = ['https://www.googleapis.com/auth/drive.file']
BACKUP_DIR = Path(__file__).parent.parent / 'backups'
CREDENTIALS_FILE = Path(__file__).parent / 'credentials.json'
TOKEN_FILE = Path(__file__).parent / 'token.json'

# ID de la carpeta de Google Drive (ya creada)
# https://drive.google.com/drive/folders/1PvCRIW5jiHKBg-xJLeVhZI9E7YqxFepF
FOLDER_ID = '1PvCRIW5jiHKBg-xJLeVhZI9E7YqxFepF'

def get_credentials():
    """Obtiene las credenciales de Google Drive."""
    creds = None
    
    # Cargar token existente
    if TOKEN_FILE.exists():
        creds = Credentials.from_authorized_user_file(str(TOKEN_FILE), SCOPES)
    
    # Si no hay credenciales válidas, iniciar flujo OAuth
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            if not CREDENTIALS_FILE.exists():
                print("=" * 60)
                print("❌ No se encontró credentials.json")
                print()
                print("Pasos para configurar Google Drive API:")
                print()
                print("1. Ir a: https://console.cloud.google.com/")
                print("2. Crear un proyecto nuevo")
                print("3. Ir a 'APIs y servicios' > 'Biblioteca'")
                print("4. Buscar 'Google Drive API' y habilitarla")
                print("5. Ir a 'APIs y servicios' > 'Credenciales'")
                print("6. Crear credenciales > ID de cliente OAuth")
                print("7. Tipo de aplicación: 'Aplicación de escritorio'")
                print("8. Descargar el JSON")
                print(f"9. Guardar como: {CREDENTIALS_FILE}")
                print("=" * 60)
                sys.exit(1)
            
            flow = InstalledAppFlow.from_client_secrets_file(
                str(CREDENTIALS_FILE), SCOPES)
            creds = flow.run_local_server(port=0)
        
        # Guardar token para uso futuro
        with open(TOKEN_FILE, 'w') as token:
            token.write(creds.to_json())
    
    return creds

def upload_file(service, file_path, folder_id):
    """Sube un archivo a Google Drive."""
    file_name = os.path.basename(file_path)
    
    # Verificar si ya existe y eliminarlo
    query = f"name='{file_name}' and '{folder_id}' in parents and trashed=false"
    results = service.files().list(q=query, spaces='drive', fields='files(id)').execute()
    existing = results.get('files', [])
    for file in existing:
        service.files().delete(fileId=file['id']).execute()
    
    # Subir archivo
    file_metadata = {
        'name': file_name,
        'parents': [folder_id]
    }
    media = MediaFileUpload(file_path, resumable=True)
    
    print(f"📤 Subiendo: {file_name}")
    
    file = service.files().create(
        body=file_metadata,
        media_body=media,
        fields='id, name, size'
    ).execute()
    
    return file

def get_latest_backup():
    """Obtiene el archivo de backup más reciente."""
    backups = sorted(BACKUP_DIR.glob('solemar_backup_*.tar.gz'), reverse=True)
    if not backups:
        print("❌ No hay backups disponibles. Ejecuta primero: ./scripts/backup.sh")
        return None
    return str(backups[0])

def main():
    print("=" * 50)
    print("☁️  BACKUP A GOOGLE DRIVE - SOLEMAR")
    print("=" * 50)
    print()
    
    # Determinar archivo a subir
    if len(sys.argv) > 1:
        file_path = sys.argv[1]
        if not os.path.exists(file_path):
            print(f"❌ Archivo no encontrado: {file_path}")
            sys.exit(1)
    else:
        file_path = get_latest_backup()
        if not file_path:
            sys.exit(1)
    
    print(f"📁 Archivo: {os.path.basename(file_path)}")
    print(f"📊 Tamaño: {os.path.getsize(file_path) / 1024 / 1024:.2f} MB")
    print()
    
    # Autenticar
    print("🔐 Autenticando con Google Drive...")
    creds = get_credentials()
    
    # Crear servicio
    service = build('drive', 'v3', credentials=creds)
    
    # Usar la carpeta existente
    print(f"📁 Usando carpeta: Solemar_Backups")
    
    # Subir archivo
    print()
    result = upload_file(service, file_path, FOLDER_ID)
    
    print()
    print("=" * 50)
    print("✅ BACKUP SUBIDO EXITOSAMENTE")
    print("=" * 50)
    print()
    print(f"📄 Archivo: {result['name']}")
    print(f"🔗 Ver en: https://drive.google.com/drive/folders/{FOLDER_ID}")
    print()

if __name__ == '__main__':
    main()
