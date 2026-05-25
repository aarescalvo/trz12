// Service Worker para funcionamiento offline
// Instalado automáticamente por la aplicación

const CACHE_NAME = 'solemar-frigorifico-v1'
const OFFLINE_URL = '/offline.html'

// Recursos a cachear durante la instalación
const PRECACHE_RESOURCES = [
  '/',
  '/manifest.json',
  '/logo.png',
  '/offline.html'
]

// Instalación del service worker
self.addEventListener('install', (event: any) => {
  console.log('[SW] Instalando service worker...')
  
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Cacheando recursos iniciales')
      return cache.addAll(PRECACHE_RESOURCES)
    }).then(() => {
      console.log('[SW] Service worker instalado')
      // @ts-ignore
      return self.skipWaiting()
    })
  )
})

// Activación del service worker
self.addEventListener('activate', (event: any) => {
  console.log('[SW] Activando service worker...')
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Eliminando cache antiguo:', cacheName)
            return caches.delete(cacheName)
          }
        })
      )
    }).then(() => {
      console.log('[SW] Service worker activado')
      // @ts-ignore
      return self.clients.claim()
    })
  )
})

// Interceptar peticiones de red
self.addEventListener('fetch', (event: any) => {
  const { request } = event
  const url = new URL(request.url)

  // Solo manejar peticiones HTTP/HTTPS
  if (!url.protocol.startsWith('http')) {
    return
  }

  // Estrategia: Network First con fallback a cache
  // Para APIs: Intentar red, si falla usar cache
  // Para recursos estáticos: Cache First

  if (url.pathname.startsWith('/api/')) {
    // API calls - Network First
    event.respondWith(networkFirst(request))
  } else {
    // Recursos estáticos - Cache First
    event.respondWith(cacheFirst(request))
  }
})

// Estrategia Network First
async function networkFirst(request: Request): Promise<Response> {
  try {
    const networkResponse = await fetch(request)
    
    // Si la respuesta es OK, guardar en cache
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME)
      cache.put(request, networkResponse.clone())
    }
    
    return networkResponse
  } catch (error) {
    // Si falla la red, buscar en cache
    console.log('[SW] Red no disponible, usando cache para:', request.url)
    const cachedResponse = await caches.match(request)
    
    if (cachedResponse) {
      return cachedResponse
    }
    
    // Si no hay cache, devolver respuesta de error offline
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Sin conexión - Los datos se guardarán localmente',
        offline: true 
      }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
}

// Estrategia Cache First
async function cacheFirst(request: Request): Promise<Response> {
  const cachedResponse = await caches.match(request)
  
  if (cachedResponse) {
    return cachedResponse
  }
  
  try {
    const networkResponse = await fetch(request)
    
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME)
      cache.put(request, networkResponse.clone())
    }
    
    return networkResponse
  } catch (error) {
    // Si es una navegación, mostrar página offline
    if (request.mode === 'navigate') {
      const offlineResponse = await caches.match(OFFLINE_URL)
      if (offlineResponse) {
        return offlineResponse
      }
    }
    
    return new Response('Contenido no disponible offline', {
      status: 503,
      headers: { 'Content-Type': 'text/plain' }
    })
  }
}

// Escuchar mensajes del cliente
self.addEventListener('message', (event: any) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    // @ts-ignore
    self.skipWaiting()
  }
  
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_NAME })
  }
})

// Sincronización en background (cuando se recupera la conexión)
// @ts-ignore
self.addEventListener('sync', (event: any) => {
  console.log('[SW] Evento de sincronización:', event.tag)
  
  if (event.tag === 'sync-romaneos') {
    event.waitUntil(syncRomaneos())
  }
})

// Función para sincronizar romaneos pendientes
async function syncRomaneos() {
  console.log('[SW] Sincronizando romaneos pendientes...')
  
  try {
    // Los datos se sincronizan desde el cliente usando IndexedDB
    // Este evento solo notifica a los clientes
    const clients = await (self as any).clients.matchAll()
    
    clients.forEach((client: any) => {
      client.postMessage({
        type: 'SYNC_REQUIRED',
        message: 'Conexión recuperada, sincronizar datos'
      })
    })
  } catch (error) {
    console.error('[SW] Error en sincronización:', error)
  }
}

console.log('[SW] Service worker cargado')
