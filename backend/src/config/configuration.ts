import { registerAs } from '@nestjs/config';
import { stripEnvQuotes } from '../common/utils/env.util';

function env(key: string, fallback = ''): string {
  return stripEnvQuotes(process.env[key]) || fallback;
}

export default registerAs('app', () => ({
  nodeEnv: env('NODE_ENV', 'development'),
  port: Number(process.env.PORT || 3000),
  logLevel: env('LOG_LEVEL', 'info'),
  databaseUrl: env('DATABASE_URL'),
  jwt: {
    secret: env('JWT_SECRET', 'dev-jwt-secret-change-in-production'),
    refreshSecret: env('JWT_REFRESH_SECRET', 'dev-refresh-secret-change-in-production'),
    expiresIn: env('JWT_EXPIRES_IN', '15m'),
    refreshExpiresIn: env('JWT_REFRESH_EXPIRES_IN', '7d'),
  },
  frontendUrl: env('FRONTEND_URL', 'http://localhost:3001').replace(/\/+$/, ''),
  redis: {
    url: env('REDIS_URL'),
    productsCacheTtl: Number(process.env.REDIS_PRODUCTS_CACHE_TTL || 300),
  },
  mail: {
    resendApiKey: env('RESEND_API_KEY'),
    from: env('MAIL_FROM'),
  },
  sepay: {
    env: env('SEPAY_ENV', 'sandbox'),
    merchantId: env('SEPAY_MERCHANT_ID'),
    secretKey: env('SEPAY_SECRET_KEY'),
    checkoutUrl: env('SEPAY_CHECKOUT_URL'),
    successUrl: env('SEPAY_SUCCESS_URL'),
    errorUrl: env('SEPAY_ERROR_URL'),
    cancelUrl: env('SEPAY_CANCEL_URL'),
    paymentMethod: env('SEPAY_PAYMENT_METHOD'),
    ipnWhitelist: env('SEPAY_IPN_WHITELIST'),
    debug: env('SEPAY_DEBUG') === 'true' || env('SEPAY_DEBUG') === '1',
  },
  cloudinary: {
    cloudName: env('CLOUDINARY_CLOUD_NAME'),
    apiKey: env('CLOUDINARY_API_KEY'),
    apiSecret: env('CLOUDINARY_API_SECRET'),
    folder: env('CLOUDINARY_FOLDER', 'techshop/products'),
    userFolder: env('CLOUDINARY_USER_FOLDER', 'techshop/user-uploads'),
  },
  google: {
    clientId: env('GOOGLE_CLIENT_ID'),
    clientSecret: env('GOOGLE_CLIENT_SECRET'),
    callbackUrl: env(
      'GOOGLE_CALLBACK_URL',
      'http://localhost:3000/api/v1/auth/google/callback',
    ),
  },
  sentryDsn: env('SENTRY_DSN'),
  unpaidOrderTimeoutHours: Number(process.env.UNPAID_ORDER_TIMEOUT_HOURS || 24),
  aiInternalApiKey: env('AI_INTERNAL_API_KEY'),
}));
