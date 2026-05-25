'use client';

import { useEffect } from 'react';
import { createLogger } from '@/lib/logger'
const log = createLogger('components.pwa.service-worker-registration')

export function ServiceWorkerRegistration() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          log.info(`'Service Worker registered:' registration.scope`);
        })
        .catch((error) => {
          console.error('Service Worker registration failed:', error);
        });
    }
  }, []);

  return null;
}
