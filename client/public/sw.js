const CACHE_NAME = 'edvanta-v1';
const OFFLINE_DATA_CACHE = 'edvanta-offline-data-v1';

// Assets to cache for offline functionality
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/src/main.jsx',
  '/src/App.jsx',
  '/src/App.css',
  '/src/index.css',
  '/edvanta-logo.png',
  '/manifest.json'
];

// API endpoints that should be cached for offline access
const CACHEABLE_API_PATTERNS = [
  '/api/user/profile',
  '/api/user/stats',
  '/api/dashboard',
  '/api/quizzes/recent'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Caching static assets...');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('Static assets cached successfully');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('Error caching static assets:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME && cacheName !== OFFLINE_DATA_CACHE) {
              console.log('Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('Service Worker activated');
        return self.clients.claim();
      })
  );
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Handle different types of requests
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(request));
  } else {
    event.respondWith(handleStaticRequest(request));
  }
});

// Handle API requests with network-first strategy
async function handleApiRequest(request) {
  const url = new URL(request.url);
  const isCacheableApi = CACHEABLE_API_PATTERNS.some(pattern => 
    url.pathname.includes(pattern)
  );

  if (!isCacheableApi) {
    // Non-cacheable API - network only
    try {
      return await fetch(request);
    } catch (error) {
      return new Response(
        JSON.stringify({ error: 'Network error, please try again' }),
        {
          status: 503,
          statusText: 'Service Unavailable',
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
  }

  // Cacheable API - network first, then cache
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Cache successful response
      const cache = await caches.open(OFFLINE_DATA_CACHE);
      cache.put(request, networkResponse.clone());
      
      // Also store in localStorage for offline hooks
      if (networkResponse.headers.get('Content-Type')?.includes('application/json')) {
        const data = await networkResponse.clone().json();
        storeOfflineData(url.pathname, data);
      }
      
      return networkResponse;
    } else {
      throw new Error('Network response was not ok');
    }
  } catch (error) {
    console.log('Network failed, trying cache for:', request.url);
    
    // Try to get from cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline error response
    return new Response(
      JSON.stringify({ 
        error: 'No cached data available',
        offline: true 
      }),
      {
        status: 503,
        statusText: 'Service Unavailable',
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

// Handle static requests with cache-first strategy
async function handleStaticRequest(request) {
  // Try cache first
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }

  // Try network
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Cache the response
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    // Return offline page for navigation requests
    if (request.mode === 'navigate') {
      const offlineResponse = await caches.match('/index.html');
      return offlineResponse || new Response('Offline', { status: 503 });
    }
    
    throw error;
  }
}

// Store data in localStorage for offline hooks
function storeOfflineData(pathname, data) {
  try {
    if (pathname.includes('/user/profile')) {
      localStorage.setItem('offline_user_profile', JSON.stringify({
        ...data,
        lastSync: new Date().toISOString()
      }));
    } else if (pathname.includes('/user/stats')) {
      localStorage.setItem('offline_user_stats', JSON.stringify({
        ...data,
        lastUpdated: new Date().toISOString()
      }));
    } else if (pathname.includes('/dashboard')) {
      localStorage.setItem('offline_dashboard_data', JSON.stringify({
        ...data,
        lastSync: new Date().toISOString()
      }));
    } else if (pathname.includes('/quizzes/recent')) {
      // Store only last 5 quizzes without answers
      const sanitizedData = {
        quizzes: (data.quizzes || []).slice(-5).map(quiz => ({
          ...quiz,
          questions: (quiz.questions || []).map(q => ({
            id: q.id,
            question: q.question,
            type: q.type,
            options: q.options || []
            // No answers, explanations, or user responses
          }))
        })),
        lastSync: new Date().toISOString(),
        totalCount: data.totalCount || 0
      };
      localStorage.setItem('offline_last_5_quizzes', JSON.stringify(sanitizedData));
    }
  } catch (error) {
    console.error('Error storing offline data:', error);
  }
}

// Listen for messages from the main thread
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Background sync for when online again
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

async function doBackgroundSync() {
  try {
    // Notify main thread that we're back online
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({
        type: 'BACK_ONLINE'
      });
    });
  } catch (error) {
    console.error('Background sync failed:', error);
  }
}

console.log('Edvanta Service Worker loaded');