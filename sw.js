const CACHE_NAME = 'estuda-plus-v5'
const CDN_CACHE = 'estuda-plus-cdn-v1'

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/src/styles/reset.css',
  '/src/styles/variables.css',
  '/src/styles/layout.css',
  '/src/styles/components.css',
  '/src/styles/pages.css',
  '/src/styles/utilities.css',
  '/src/styles/main.css',
  '/src/app.js',
  '/src/router.js',
  '/src/state.js',
  '/src/store/local-storage.js',
  '/src/store/schema.js',
  '/src/store/migrations.js',
  '/src/services/storage-service.js',
  '/src/services/stats-service.js',
  '/src/services/achievement-service.js',
  '/src/services/export-service.js',
  '/src/utils/constants.js',
  '/src/utils/event-bus.js',
  '/src/utils/date-utils.js',
  '/src/utils/id-generator.js',
  '/src/utils/helpers.js',
  '/src/utils/validators.js',
  '/src/components/app-shell.js',
  '/src/components/sidebar.js',
  '/src/components/install-prompt.js',
  '/src/components/header.js',
  '/src/components/card.js',
  '/src/components/button.js',
  '/src/components/progress-bar.js',
  '/src/components/empty-state.js',
  '/src/components/chart.js',
  '/src/components/study-timer.js',
  '/src/pages/dashboard.js',
  '/src/pages/studies.js',
  '/src/pages/subjects.js',
  '/src/pages/subject-detail.js',
  '/src/pages/study-session.js',
  '/src/pages/tasks.js',
  '/src/pages/calendar.js',
  '/src/pages/goals.js',
  '/src/pages/pomodoro.js',
  '/src/pages/achievements.js',
  '/src/pages/export.js',
  '/src/pages/reports.js',
  '/src/pages/settings.js',
  '/assets/icons/icon.svg',
  '/assets/icons/icon-maskable.svg',
  '/assets/icons/icon-72x72.png',
  '/assets/icons/icon-96x96.png',
  '/assets/icons/icon-128x128.png',
  '/assets/icons/icon-144x144.png',
  '/assets/icons/icon-152x152.png',
  '/assets/icons/icon-192x192.png',
  '/assets/icons/icon-384x384.png',
  '/assets/icons/icon-512x512.png',
  '/assets/icons/icon-maskable-512x512.png'
]

const CDN_URLS = [
  'https://cdn.jsdelivr.net/npm/chart.js@4',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.3/jspdf.plugin.autotable.min.js'
]

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME)
    await cache.addAll(STATIC_ASSETS)

    const cdnCache = await caches.open(CDN_CACHE)
    for (const url of CDN_URLS) {
      try {
        const response = await fetch(url, { mode: 'cors' })
        if (response.ok) {
          await cdnCache.put(url, response)
        }
      } catch (e) {
      }
    }
  })())
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const cacheNames = await caches.keys()
    await Promise.all(
      cacheNames
        .filter((name) => name !== CACHE_NAME && name !== CDN_CACHE)
        .map((name) => caches.delete(name))
    )
    await self.clients.claim()
  })())
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  if (request.mode === 'navigate') {
    event.respondWith(navStrategy(request))
    return
  }

  if (CDN_URLS.some((cdn) => url.href.startsWith(cdn))) {
    event.respondWith(cdnStrategy(request))
    return
  }

  if (url.origin === self.location.origin) {
    event.respondWith(staticStrategy(request))
    return
  }

  event.respondWith(networkStrategy(request))
})

async function navStrategy(request) {
  try {
    const networkResponse = await fetch(request)
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME)
      cache.put('/index.html', networkResponse.clone())
      return networkResponse
    }
  } catch (e) {
  }

  const cached = await caches.match('/index.html')
  if (cached) return cached

  return new Response('Offline', { status: 503, statusText: 'Service Unavailable' })
}

async function staticStrategy(request) {
  const cached = await caches.match(request)
  if (cached) return cached

  try {
    const networkResponse = await fetch(request)
    if (networkResponse && networkResponse.status === 200) {
      const cache = await caches.open(CACHE_NAME)
      cache.put(request, networkResponse.clone())
      return networkResponse
    }
    return networkResponse
  } catch (e) {
    return new Response('', { status: 408, statusText: 'Offline' })
  }
}

async function cdnStrategy(request) {
  const cached = await caches.match(request)
  if (cached) return cached

  const networkResponse = await fetch(request)
  if (networkResponse.ok) {
    const cache = await caches.open(CDN_CACHE)
    cache.put(request, networkResponse.clone())
  }
  return networkResponse
}

async function networkStrategy(request) {
  try {
    return await fetch(request)
  } catch (e) {
    const cached = await caches.match(request)
    return cached || new Response('', { status: 408 })
  }
}
