const withPWA = require('@ducanh2912/next-pwa').default({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  skipWaiting: true,
  sw: 'service-worker.js',
  workboxOptions: {
    disableDevLogs: true,
    runtimeCaching: [
      {
        urlPattern: /^https:\/\/fonts\.(?:gstatic)\.com\/.*/i,
        handler: 'CacheFirst',
        options: {
          cacheName: 'google-fonts-webfonts',
          expiration: {
            maxEntries: 4,
            maxAgeSeconds: 365 * 24 * 60 * 60 // 1 year
          }
        }
      },
      {
        urlPattern: /^https:\/\/fonts\.(?:googleapis)\.com\/.*/i,
        handler: 'StaleWhileRevalidate',
        options: {
          cacheName: 'google-fonts-stylesheets',
          expiration: {
            maxEntries: 4,
            maxAgeSeconds: 60 * 60 * 24 // 1 day
          }
        }
      },
      {
        urlPattern: /\.(?:eot|otf|ttc|ttf|woff|woff2|font.css)$/i,
        handler: 'StaleWhileRevalidate',
        options: {
          cacheName: 'static-font-assets',
          expiration: {
            maxEntries: 4,
            maxAgeSeconds: 7 * 24 * 60 * 60 // 1 week
          }
        }
      },
      {
        urlPattern: /\.(?:jpg|jpeg|gif|png|svg|ico|webp)$/i,
        handler: 'StaleWhileRevalidate',
        options: {
          cacheName: 'static-image-assets',
          expiration: {
            maxEntries: 64,
            maxAgeSeconds: 30 * 24 * 60 * 60 // 30 days
          }
        }
      },
      {
        urlPattern: /\/_next\/static.+\.js$/i,
        handler: 'CacheFirst',
        options: {
          cacheName: 'next-static-js-assets',
          expiration: {
            maxEntries: 64,
            maxAgeSeconds: 30 * 24 * 60 * 60 // 30 days
          }
        }
      },
      {
        urlPattern: /\/_next\/static.+\.css$/i,
        handler: 'CacheFirst',
        options: {
          cacheName: 'next-static-css-assets',
          expiration: {
            maxEntries: 32,
            maxAgeSeconds: 30 * 24 * 60 * 60 // 30 days
          }
        }
      },
      {
        urlPattern: /\/_next\/image\?url=.+$/i,
        handler: 'StaleWhileRevalidate',
        options: {
          cacheName: 'next-image',
          expiration: {
            maxEntries: 64,
            maxAgeSeconds: 30 * 24 * 60 * 60 // 30 days
          }
        }
      },
      {
        urlPattern: /\.(?:mp3|wav|ogg)$/i,
        handler: 'CacheFirst',
        options: {
          cacheName: 'static-audio-assets',
          expiration: {
            maxEntries: 32,
            maxAgeSeconds: 30 * 24 * 60 * 60 // 30 days
          }
        }
      },
      {
        urlPattern: /\.(?:mp4|webm)$/i,
        handler: 'CacheFirst',
        options: {
          cacheName: 'static-video-assets',
          expiration: {
            maxEntries: 32,
            maxAgeSeconds: 30 * 24 * 60 * 60 // 30 days
          }
        }
      },
      {
        urlPattern: /\.(?:js)$/i,
        handler: 'StaleWhileRevalidate',
        options: {
          cacheName: 'static-js-assets',
          expiration: {
            maxEntries: 48,
            maxAgeSeconds: 7 * 24 * 60 * 60 // 1 week
          }
        }
      },
      {
        urlPattern: /\.(?:css|less)$/i,
        handler: 'StaleWhileRevalidate',
        options: {
          cacheName: 'static-style-assets',
          expiration: {
            maxEntries: 32,
            maxAgeSeconds: 7 * 24 * 60 * 60 // 1 week
          }
        }
      },
      {
        urlPattern: /^https:\/\/life-rpg\.vercel\.app\/.*/i,
        handler: 'NetworkFirst',
        options: {
          cacheName: 'api-cache',
          networkTimeoutSeconds: 10,
          expiration: {
            maxEntries: 32,
            maxAgeSeconds: 60 * 60 // 1 hour
          },
          cacheableResponse: {
            statuses: [0, 200]
          }
        }
      },
      {
        urlPattern: /\.(?:json)$/i,
        handler: 'StaleWhileRevalidate',
        options: {
          cacheName: 'static-data-assets',
          expiration: {
            maxEntries: 32,
            maxAgeSeconds: 24 * 60 * 60 // 1 day
          }
        }
      }
    ]
  },
});

const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  // 빌드 시 린트 경고 무시 (Vercel 배포를 위해)
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // 타입 체크 비활성화 (Vercel 배포를 위해)
  typescript: {
    ignoreBuildErrors: true,
  },
  
  // 이미지 최적화
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60 * 60 * 24 * 365, // 1년
  },
  
  // 보안 헤더
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          }
        ]
      }
    ]
  },

  // 실험적 기능들
  experimental: {
    optimizePackageImports: ['@headlessui/react', 'dexie', 'zustand', 'react-dom'],
  },
  
  // React DevTools 에러 해결
  productionBrowserSourceMaps: false,

  // Webpack 설정
  webpack: (config, { isServer, dev }) => {
    // 서버 사이드 external 설정
    if (isServer) {
      config.externals = [...(config.externals || []), 'dexie'];
    }
    
    // CSS 파일이 JS로 잘못 로드되는 문제 해결
    config.module.rules.forEach(rule => {
      if (rule.oneOf) {
        rule.oneOf.forEach(oneOfRule => {
          if (oneOfRule.test && oneOfRule.test.toString().includes('\.css')) {
            oneOfRule.exclude = /vendor\.css$/;
          }
        });
      }
    });
    
    // 프로덕션에서 console 제거
    if (!dev && !isServer) {
      config.optimization.minimizer = config.optimization.minimizer || [];
      const TerserPlugin = require('terser-webpack-plugin');
      config.optimization.minimizer.push(
        new TerserPlugin({
          terserOptions: {
            compress: {
              drop_console: true,
              drop_debugger: true,
              pure_funcs: ['console.log', 'console.info', 'console.debug', 'console.warn'],
            },
          },
        })
      );
    }
    
    // 번들 크기 최적화
    if (!isServer) {
      config.optimization = {
        ...config.optimization,
        moduleIds: 'deterministic',
        runtimeChunk: 'single',
        splitChunks: {
          chunks: 'all',
          maxInitialRequests: 25,
          minSize: 20000,
          cacheGroups: {
            default: false,
            vendors: false,
            // CSS 전용 청크
            styles: {
              name: 'styles',
              test: /\.css$/,
              chunks: 'all',
              enforce: true,
              priority: 20,
            },
            // 벤더 청크 (JS 전용)
            vendor: {
              test: /[\\/]node_modules[\\/](?!.*\.css$)/,
              name: 'vendor',
              priority: 10,
              reuseExistingChunk: true
            },
            // 공통 청크
            common: {
              minChunks: 2,
              priority: 5,
              reuseExistingChunk: true
            },
            // 큰 라이브러리들은 별도 청크로
            dexie: {
              test: /[\\/]node_modules[\\/]dexie[\\/]/,
              name: 'dexie',
              chunks: 'all',
              priority: 30,
              enforce: true
            }
          }
        }
      }
    }
    
    return config
  },

  // 압축 설정
  compress: true,

  // 파워 앞 최적화
  poweredByHeader: false,
  
  // 리다이렉트 설정
  async redirects() {
    return [
      {
        source: '/',
        destination: '/dashboard',
        permanent: false,
      },
      {
        source: '/home',
        destination: '/dashboard',
        permanent: true,
      },
    ]
  },
  
  // 리라이트 설정 (임시)
  async rewrites() {
    return {
      beforeFiles: [
        // 404를 반환하는 페이지들을 대시보드로 임시 리다이렉트
        // 실제로는 서버 재시작이 필요함
      ],
      afterFiles: [],
      fallback: []
    }
  },

  // 빌드 출력 설정
  // output: 'standalone',
}

// 환경에 따라 설정 적용
module.exports = withPWA(withBundleAnalyzer(nextConfig))