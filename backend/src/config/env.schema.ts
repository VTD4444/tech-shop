import * as Joi from 'joi';

const isProduction = process.env.NODE_ENV === 'production';

export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  PORT: Joi.string().default('3000'),
  LOG_LEVEL: Joi.string().default('info'),
  DATABASE_URL: Joi.string().required(),
  JWT_SECRET: isProduction
    ? Joi.string().min(32).required()
    : Joi.string().default('dev-jwt-secret-change-in-production'),
  JWT_REFRESH_SECRET: isProduction
    ? Joi.string().min(32).required()
    : Joi.string().default('dev-refresh-secret-change-in-production'),
  JWT_EXPIRES_IN: Joi.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: Joi.string().default('7d'),
  FRONTEND_URL: isProduction
    ? Joi.string().uri().required()
    : Joi.string().uri().default('http://localhost:3001'),
  REDIS_URL: Joi.string().allow('').optional(),
  REDIS_PRODUCTS_CACHE_TTL: Joi.string().default('300'),
  RESEND_API_KEY: Joi.string().allow('').optional(),
  MAIL_FROM: Joi.string().allow('').optional(),
  SEPAY_ENV: Joi.string().valid('sandbox', 'production').default('sandbox'),
  SEPAY_MERCHANT_ID: Joi.string().allow('').optional(),
  SEPAY_SECRET_KEY: Joi.string().allow('').optional(),
  SEPAY_CHECKOUT_URL: Joi.string().uri().allow('').optional(),
  SEPAY_SUCCESS_URL: Joi.string().uri().allow('').optional(),
  SEPAY_ERROR_URL: Joi.string().uri().allow('').optional(),
  SEPAY_CANCEL_URL: Joi.string().uri().allow('').optional(),
  SEPAY_PAYMENT_METHOD: Joi.string().allow('').optional(),
  SEPAY_IPN_WHITELIST: Joi.string().allow('').optional(),
  SEPAY_DEBUG: Joi.string().allow('').optional(),
  CLOUDINARY_CLOUD_NAME: Joi.string().allow('').optional(),
  CLOUDINARY_API_KEY: Joi.string().allow('').optional(),
  CLOUDINARY_API_SECRET: Joi.string().allow('').optional(),
  CLOUDINARY_FOLDER: Joi.string().default('techshop/products'),
  AI_SERVICE_URL: Joi.string().uri().allow('').optional(),
  GOOGLE_CLIENT_ID: Joi.string().allow('').optional(),
  GOOGLE_CLIENT_SECRET: Joi.string().allow('').optional(),
  GOOGLE_CALLBACK_URL: Joi.string().uri().allow('').optional(),
  SENTRY_DSN: Joi.string().allow('').optional(),
  UNPAID_ORDER_TIMEOUT_HOURS: Joi.string().default('24'),
  RUN_SEED: Joi.string().allow('').optional(),
});
