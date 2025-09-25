/**
 * CDN and Caching Configuration for DeelRx CRM
 * 
 * Optimizes content delivery and caching strategies for production
 * performance and user experience.
 */

// Cache configuration for different resource types
export const cacheConfig = {
  // Static assets (images, fonts, etc.)
  staticAssets: {
    maxAge: 31536000, // 1 year
    staleWhileRevalidate: 86400, // 1 day
    cacheControl: 'public, max-age=31536000, immutable'
  },
  
  // JavaScript and CSS bundles
  bundles: {
    maxAge: 31536000, // 1 year (with hash-based filenames)
    staleWhileRevalidate: 86400, // 1 day
    cacheControl: 'public, max-age=31536000, immutable'
  },
  
  // API responses
  api: {
    maxAge: 300, // 5 minutes
    staleWhileRevalidate: 60, // 1 minute
    cacheControl: 'public, max-age=300, s-maxage=300, stale-while-revalidate=60'
  },
  
  // Dynamic pages
  pages: {
    maxAge: 60, // 1 minute
    staleWhileRevalidate: 30, // 30 seconds
    cacheControl: 'public, max-age=60, s-maxage=60, stale-while-revalidate=30'
  },
  
  // User-specific content
  userContent: {
    maxAge: 0, // No caching
    cacheControl: 'private, no-cache, no-store, must-revalidate'
  }
};

// Content-Type specific optimizations
export const contentTypeOptimizations = {
  'text/html': {
    compress: true,
    minify: true,
    cacheControl: cacheConfig.pages.cacheControl
  },
  
  'text/css': {
    compress: true,
    minify: true,
    cacheControl: cacheConfig.bundles.cacheControl
  },
  
  'application/javascript': {
    compress: true,
    minify: true,
    cacheControl: cacheConfig.bundles.cacheControl
  },
  
  'application/json': {
    compress: true,
    cacheControl: cacheConfig.api.cacheControl
  },
  
  'image/jpeg': {
    compress: false, // Already compressed
    optimize: true,
    cacheControl: cacheConfig.staticAssets.cacheControl
  },
  
  'image/png': {
    compress: false,
    optimize: true,
    cacheControl: cacheConfig.staticAssets.cacheControl
  },
  
  'image/webp': {
    compress: false,
    optimize: true,
    cacheControl: cacheConfig.staticAssets.cacheControl
  },
  
  'font/woff2': {
    compress: false,
    cacheControl: cacheConfig.staticAssets.cacheControl
  }
};

// Vercel Edge Cache configuration
export const vercelCacheConfig = {
  // Static files from /public
  '/(.*\\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot|webp|avif))$': {
    headers: {
      'Cache-Control': cacheConfig.staticAssets.cacheControl,
      'X-Content-Type-Options': 'nosniff'
    }
  },
  
  // Next.js static assets from /_next/static
  '/_next/static/(.*)': {
    headers: {
      'Cache-Control': cacheConfig.bundles.cacheControl,
      'X-Content-Type-Options': 'nosniff'
    }
  },
  
  // API routes
  '/api/(.*)': {
    headers: {
      'Cache-Control': cacheConfig.api.cacheControl,
      'Vary': 'Accept-Encoding, Authorization'
    }
  },
  
  // Dynamic pages
  '/(.*)': {
    headers: {
      'Cache-Control': cacheConfig.pages.cacheControl,
      'Vary': 'Accept-Encoding'
    }
  }
};

// Image optimization configuration
export const imageOptimization = {
  domains: ['localhost', 'deelrxcrm.app', 'cdn.deelrxcrm.app'],
  formats: ['image/webp', 'image/avif'],
  sizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
  quality: 75,
  minimumCacheTTL: 60,
  dangerouslyAllowSVG: false,
  contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;"
};

// Service Worker configuration for client-side caching
export const serviceWorkerConfig = {
  enabled: true,
  cacheStrategies: {
    // Cache First - for static assets
    static: {
      urlPattern: /\.(js|css|woff2?|png|jpg|jpeg|gif|svg|ico)$/,
      strategy: 'CacheFirst',
      cacheName: 'static-assets',
      expiration: {
        maxEntries: 100,
        maxAgeSeconds: 31536000 // 1 year
      }
    },
    
    // Network First - for API calls
    api: {
      urlPattern: /^\/api\//,
      strategy: 'NetworkFirst',
      cacheName: 'api-cache',
      networkTimeoutSeconds: 3,
      expiration: {
        maxEntries: 50,
        maxAgeSeconds: 300 // 5 minutes
      }
    },
    
    // Stale While Revalidate - for pages
    pages: {
      urlPattern: /^\/(?!api)/,
      strategy: 'StaleWhileRevalidate',
      cacheName: 'pages-cache',
      expiration: {
        maxEntries: 30,
        maxAgeSeconds: 3600 // 1 hour
      }
    }
  }
};

// Edge Functions configuration for dynamic caching
export const edgeFunctionsConfig = {
  regions: ['iad1', 'fra1', 'sfo1'], // US East, Europe, US West
  
  middleware: {
    // Cache middleware for dynamic content
    dynamicCache: {
      enabled: true,
      rules: [
        {
          path: '/dashboard/*',
          cacheKey: (request: Request) => {
            const url = new URL(request.url);
            const userId = request.headers.get('x-user-id');
            return `dashboard:${userId}:${url.pathname}`;
          },
          ttl: 300 // 5 minutes
        },
        {
          path: '/api/teams/*/customers',
          cacheKey: (request: Request) => {
            const url = new URL(request.url);
            const teamId = url.pathname.split('/')[3];
            return `customers:${teamId}:${url.search}`;
          },
          ttl: 60 // 1 minute
        }
      ]
    }
  }
};

// Performance monitoring for cache effectiveness
export const cacheMetrics = {
  enabled: true,
  trackingEvents: [
    'cache_hit',
    'cache_miss',
    'cache_stale',
    'cache_revalidate'
  ],
  
  performance: {
    trackTTFB: true, // Time to First Byte
    trackFCP: true,  // First Contentful Paint
    trackLCP: true,  // Largest Contentful Paint
    trackCLS: true,  // Cumulative Layout Shift
    trackFID: true   // First Input Delay
  }
};

// Compression configuration
export const compressionConfig = {
  enabled: true,
  algorithms: ['gzip', 'brotli'],
  minSize: 1024, // Only compress files larger than 1KB
  
  // File types to compress
  compressibleTypes: [
    'text/html',
    'text/css',
    'text/javascript',
    'application/javascript',
    'application/json',
    'text/xml',
    'application/xml',
    'image/svg+xml'
  ],
  
  // Compression levels (1-9 for gzip, 1-11 for brotli)
  levels: {
    gzip: 6,
    brotli: 6
  }
};

// CDN purge configuration
export const cdnPurgeConfig = {
  enabled: true,
  
  // Automatic purge triggers
  triggers: [
    'deployment',
    'content_update',
    'cache_invalidation'
  ],
  
  // Purge strategies
  strategies: {
    // Full purge - clears entire cache
    full: {
      enabled: false, // Use sparingly
      triggers: ['deployment']
    },
    
    // Tag-based purge - clears specific content types
    tagged: {
      enabled: true,
      tags: ['pages', 'api', 'assets', 'user-content']
    },
    
    // URL-based purge - clears specific URLs
    selective: {
      enabled: true,
      patterns: [
        '/api/teams/*/customers',
        '/dashboard/*',
        '/_next/static/*'
      ]
    }
  }
};

// Generate Vercel configuration
export function generateVercelConfig() {
  return {
    version: 2,
    
    // Build configuration
    build: {
      env: {
        NODE_ENV: 'production'
      }
    },
    
    // Headers configuration
    headers: Object.entries(vercelCacheConfig).map(([source, config]) => ({
      source,
      headers: Object.entries(config.headers).map(([key, value]) => ({ key, value }))
    })),
    
    // Redirects for performance
    redirects: [
      {
        source: '/home',
        destination: '/',
        permanent: true
      }
    ],
    
    // Functions configuration
    functions: {
      'app/api/**': {
        maxDuration: 10
      }
    },
    
    // Regions for edge functions
    regions: edgeFunctionsConfig.regions
  };
}

export default {
  cacheConfig,
  contentTypeOptimizations,
  vercelCacheConfig,
  imageOptimization,
  serviceWorkerConfig,
  edgeFunctionsConfig,
  cacheMetrics,
  compressionConfig,
  cdnPurgeConfig,
  generateVercelConfig
};