export default defineNuxtConfig({
  devtools: { enabled: true },
  modules: [
    '@nuxtjs/tailwindcss',
    '@pinia/nuxt',
    ...(process.env.NUXT_PUBLIC_SENTRY_DSN ? ['@sentry/nuxt/module'] : []),
  ],
  imports: {
    dirs: ['stores', 'composables'],
    imports: [
      { name: 'useFormatPrice', from: '~/composables/useFormatPrice' },
      { name: 'useToast', from: '~/composables/useToast' },
      { name: 'useProductStatus', from: '~/composables/useProductStatus' },
      { name: 'useCloudinaryUpload', from: '~/composables/useCloudinaryUpload' },
      { name: 'useAuthValidation', from: '~/composables/useAuthValidation' },
      { name: 'useProductDetail', from: '~/composables/useProductDetail' },
      { name: 'useAdvisorChat', from: '~/composables/useAdvisorChat' },
    ],
  },
  components: [
    {
      path: '~/components',
      pathPrefix: false,
    },
  ],
  sentry: {
    dsn: process.env.NUXT_PUBLIC_SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
  },
  app: {
    head: {
      charset: 'utf-8',
      viewport: 'width=device-width, initial-scale=1',
      title: 'TechShop - Build Your Dream PC',
      meta: [
        { name: 'description', content: 'TechShop - High-performance tech e-commerce for PC components and laptops' },
      ],
    },
  },
  runtimeConfig: {
    public: {
      apiBaseUrl: process.env.NUXT_PUBLIC_API_BASE_URL || 'http://localhost:3000/api/v1',
      aiApiUrl: process.env.NUXT_PUBLIC_AI_API_URL || '/api/ai',
      sentryDsn: process.env.NUXT_PUBLIC_SENTRY_DSN || '',
    },
  },
  css: ['~/assets/css/main.css'],
  postcss: {
    plugins: {
      tailwindcss: {},
      autoprefixer: {},
    },
  },
  compatibilityDate: '2026-05-27',
  routeRules: {
    '/login': { ssr: false },
    '/register': { ssr: false },
    '/forgot-password': { ssr: false },
    '/reset-password': { ssr: false },
    '/admin/**': { ssr: false },
    '/api/ai/**': { proxy: 'http://127.0.0.1:8000/api/v1/**' },
  },
});
