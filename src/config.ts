/**
 * Configuración de la aplicación
 * Variables de entorno centralizadas en un archivo TypeScript
 */

// Configuración del servidor
export const config = {
  // Puerto del servidor
  port: process.env.PORT || 3001,

  // Entorno
  nodeEnv: process.env.NODE_ENV || 'development',

  // URLs permitidas para CORS (separadas por coma)
  allowedOrigins: (process.env.ALLOWED_ORIGINS || 'http://localhost:3000').split(','),

  // Supabase
  supabase: {
    url: process.env.SUPABASE_URL || 'https://gvuzyszsflujzinykqom.supabase.co',
    anonKey: process.env.SUPABASE_ANON_KEY || '',
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  },

  // JWT
  jwt: {
    secret: process.env.JWT_SECRET_APP || 'campo-app-secret-key-2024',
    expiresIn: '7d',
  },

  // Cloudinary
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
    apiKey: process.env.CLOUDINARY_API_KEY || '',
    apiSecret: process.env.CLOUDINARY_API_SECRET || '',
    folder: process.env.CLOUDINARY_FOLDER || 'campoapp',
  },

  // Rate limiting
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100, // límite de peticiones por IP
  },
}

export default config
