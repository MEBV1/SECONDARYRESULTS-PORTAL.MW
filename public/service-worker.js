// public/service-worker.js
// Purpose: Network-only Service Worker to bypass local client caching entirely

const CACHE_NAME = 'results-portal-cache-v1';

// Install event: Force immediate activation
self.addEventListener('install', (event) => {
    self.skipWaiting();
});

// Activate event: Take control of all clients immediately
self.addEventListener('activate', (event) => {
    event.waitUntil(
        self.clients.claim().then(() => {
            // Clear any old caches if they exist
            return caches.keys().then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cache) => {
                        if (cache !== CACHE_NAME) {
                            return caches.delete(cache);
                        }
                    })
                );
            });
        })
    );
});

// Fetch event: Network-only strategy
// Ensures no asset or API payload is ever cached locally, so edits and uploads are 100% instant
self.addEventListener('fetch', (event) => {
    // Intercept and load directly from network
    event.respondWith(
        fetch(event.request).catch(() => {
            // Fallback if user is completely offline
            return new Response(
                "<h1>Connection Offline</h1><p>The Results Portal requires an active internet connection to retrieve live assessment records.</p>", 
                {
                    headers: { 'Content-Type': 'text/html' }
                }
            );
        })
    );
});