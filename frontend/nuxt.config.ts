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
      { name: 'useConfirmDialog', from: '~/composables/useConfirmDialog' },
      { name: 'usePromptDialog', from: '~/composables/usePromptDialog' },
      { name: 'useProductStatus', from: '~/composables/useProductStatus' },
      { name: 'useCloudinaryUpload', from: '~/composables/useCloudinaryUpload' },
      { name: 'useAuthValidation', from: '~/composables/useAuthValidation' },
      { name: 'useProductDetail', from: '~/composables/useProductDetail' },
      { name: 'useAdvisorChat', from: '~/composables/useAdvisorChat' },
      { name: 'useTheme', from: '~/composables/useTheme' },
      { name: 'extractApiMessage', from: '~/utils/translateApiMessage' },
      { name: 'translateApiMessage', from: '~/utils/translateApiMessage' },
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
      title: 'TechShop - Xây dựng PC mơ ước',
      meta: [
        { name: 'description', content: 'TechShop - Cửa hàng linh kiện PC, laptop hiệu năng cao tại Việt Nam' },
      ],
      script: [
        { src: '/theme-init.js', tagPosition: 'head' },
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
