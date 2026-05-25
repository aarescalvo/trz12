import type { NextConfig } from "next";

// Obtener origins permitidos desde variable de entorno, con fallback para desarrollo
const getAllowedOrigins = (): string[] => {
  const envOrigins = process.env.NEXT_PUBLIC_APP_URL;
  if (envOrigins) {
    return envOrigins.split(',').map(o => o.trim());
  }
  // En desarrollo permitir localhost
  return [
    'http://localhost:3000',
    'http://localhost:3001',
  ];
};

// Version: 3.18.0 - Security hardening + quality improvements
const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: false,
  },
  reactStrictMode: false,
  // Permitir requests cross-origin en desarrollo (red local, IP dinámica)
  allowedDevOrigins: ['http://192.168.1.153:3000'],
  experimental: {
    serverActions: {
      allowedOrigins: getAllowedOrigins(),
    },
  },
  // Fix: evitar que React se externalice en el server bundle
  // Sin esto, los componentes del servidor obtienen null al llamar useContext()
  webpack: (config, { isServer }) => {
    if (isServer) {
      const externalPackages = ['react', 'react-dom', 'scheduler'];
      if (Array.isArray(config.externals)) {
        config.externals = config.externals.filter(
          (e: string | RegExp | Function) => {
            if (typeof e === 'string') return !externalPackages.includes(e);
            if (e instanceof RegExp) return !externalPackages.some(p => e.test(p));
            return true;
          }
        );
      } else if (typeof config.externals === 'function') {
        const originalFn = config.externals;
        config.externals = (
          ...args: Parameters<typeof originalFn>
        ): ReturnType<typeof originalFn> => {
          const result = originalFn(...args);
          // Normalize to array and filter
          if (Array.isArray(result)) {
            return result.filter(
              (e: string | RegExp | Function) => {
                if (typeof e === 'string') return !externalPackages.includes(e);
                if (e instanceof RegExp) return !externalPackages.some(p => e.test(p));
                return true;
              }
            ) as any;
          }
          return result;
        };
      } else if (typeof config.externals === 'object' && config.externals !== null) {
        externalPackages.forEach(pkg => delete (config.externals as Record<string, string>)[pkg]);
      }
    }
    return config;
  },
};

export default nextConfig;
