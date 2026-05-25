#!/usr/bin/env node
/**
 * Script de corrección para problemas de módulos nativos con Turbopack
 * Este script:
 * 1. Copia los bindings nativos de lightningcss al lugar correcto
 * 2. Elimina node_modules anidados que causan conflictos
 * 3. Elimina tailwind.config.ts (no se usa en TailwindCSS v4)
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const rootDir = path.join(__dirname, '..');
const nodeModulesPath = path.join(rootDir, 'node_modules');

console.log('🔧 Ejecutando correcciones para TailwindCSS v4 + Turbopack...\n');

// 1. Eliminar tailwind.config.ts si existe (no se usa en v4)
const tailwindConfigPath = path.join(rootDir, 'tailwind.config.ts');
if (fs.existsSync(tailwindConfigPath)) {
  fs.unlinkSync(tailwindConfigPath);
  console.log('✓ Eliminado tailwind.config.ts (no se usa en TailwindCSS v4)');
}

// 2. Eliminar node_modules anidados en @tailwindcss
const tailwindcssPackages = ['@tailwindcss/node', '@tailwindcss/postcss', '@tailwindcss/oxide'];
tailwindcssPackages.forEach(pkg => {
  const nestedNodeModules = path.join(nodeModulesPath, pkg, 'node_modules');
  if (fs.existsSync(nestedNodeModules)) {
    fs.rmSync(nestedNodeModules, { recursive: true, force: true });
    console.log(`✓ Eliminado node_modules anidado en ${pkg}`);
  }
});

// 3. Copiar bindings nativos de lightningcss
const lightningcssPath = path.join(nodeModulesPath, 'lightningcss');

// Detectar plataforma
let platformSuffix;
try {
  const platform = process.platform;
  const arch = process.arch;

  if (platform === 'linux') {
    try {
      const detectLibc = require('detect-libc');
      const { MUSL, familySync } = detectLibc;
      const family = familySync();
      if (family === MUSL) {
        platformSuffix = `${platform}-${arch}-musl`;
      } else if (arch === 'arm') {
        platformSuffix = `${platform}-${arch}-gnueabihf`;
      } else {
        platformSuffix = `${platform}-${arch}-gnu`;
      }
    } catch {
      platformSuffix = `${platform}-${arch}-gnu`;
    }
  } else if (platform === 'win32') {
    platformSuffix = `${platform}-${arch}-msvc`;
  } else if (platform === 'darwin') {
    platformSuffix = `${platform}-${arch}`;
  }

  if (platformSuffix) {
    const nativePackage = `lightningcss-${platformSuffix}`;
    const sourceFile = path.join(nodeModulesPath, nativePackage, `lightningcss.${platformSuffix}.node`);
    const destFile = path.join(lightningcssPath, `lightningcss.${platformSuffix}.node`);

    if (fs.existsSync(sourceFile)) {
      // Crear directorio si no existe
      if (!fs.existsSync(lightningcssPath)) {
        fs.mkdirSync(lightningcssPath, { recursive: true });
      }
      
      if (!fs.existsSync(destFile)) {
        fs.copyFileSync(sourceFile, destFile);
        console.log(`✓ Copiado binding nativo: ${nativePackage}`);
      } else {
        console.log(`✓ Binding nativo ya existe: ${nativePackage}`);
      }
    } else {
      console.log(`⚠ No se encontró binding para ${platformSuffix}`);
    }
  }
} catch (error) {
  console.log(`⚠ Error detectando plataforma: ${error.message}`);
}

// 4. Verificar que @tailwindcss/postcss está instalado
const postcssPluginPath = path.join(nodeModulesPath, '@tailwindcss', 'postcss');
if (!fs.existsSync(postcssPluginPath)) {
  console.log('\n⚠ @tailwindcss/postcss no está instalado. Ejecuta:');
  console.log('   npm install @tailwindcss/postcss --save-dev');
}

console.log('\n✅ Correcciones aplicadas.');
console.log('\n📝 Si el problema persiste en Windows:');
console.log('   1. Elimina node_modules y package-lock.json');
console.log('   2. Ejecuta: npm install');
console.log('   3. Ejecuta: npm run build (no uses npm run dev)');
console.log('   4. Ejecuta: npm run start');
