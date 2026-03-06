import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'

// Importar rutas
import authRoutes from './routes/auth'
import perfilRoutes from './routes/perfil'
import asignacionesRoutes from './routes/asignaciones'
import beneficiariosRoutes from './routes/beneficiarios'
import bitacorasRoutes from './routes/bitacoras'
import evidenciasRoutes from './routes/evidencias'
import syncRoutes from './routes/sync'

const app = express()
const PORT = process.env.PORT || 3001

// Middleware de seguridad
app.use(helmet())

// Configuración de CORS
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000']
app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}))

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // límite de 100 peticiones por IP
  message: {
    error: 'Demasiadas peticiones',
    message: 'Por favor, intenta de nuevo más tarde',
  },
})
app.use('/api/', limiter)

// Middleware para parsing de JSON
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Rutas de la API
app.use('/api/auth', authRoutes)
app.use('/api/app/perfil', perfilRoutes)
app.use('/api/app/asignaciones', asignacionesRoutes)
app.use('/api/app/beneficiarios', beneficiariosRoutes)
app.use('/api/app/bitacoras', bitacorasRoutes)
app.use('/api/app/evidencias', evidenciasRoutes)
app.use('/api/sync', syncRoutes)

// Endpoint de salud
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'CampoApp API',
    version: '1.0.0',
  })
})

// Endpoint de información
app.get('/api', (req, res) => {
  res.json({
    name: 'CampoApp API',
    version: '1.0.0',
    description: 'API para la aplicación móvil de SADERH Campo Hidalgo',
    endpoints: {
      auth: {
        login: 'POST /api/auth/login',
        registro: 'POST /api/auth/registrar',
      },
      app: {
        perfil: 'GET /api/app/perfil',
        asignaciones: 'GET /api/app/asignaciones',
        beneficiaries: 'GET /api/app/beneficiarios',
        bitacoras: 'GET /api/app/bitacoras',
        evidencias: 'POST /api/app/evidencias',
      },
      sync: {
        bitacoras: 'POST /api/sync/bitacoras',
        beneficiaries: 'POST /api/sync/beneficiarios',
        estado: 'GET /api/sync/estado',
      },
    },
  })
})

// Manejo de errores 404
app.use((req, res) => {
  res.status(404).json({
    error: 'No encontrado',
    message: `Ruta ${req.method} ${req.path} no encontrada`,
  })
})

// Manejo de errores globales
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error no manejado:', err)
  res.status(500).json({
    error: 'Error interno del servidor',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Algo salió mal',
  })
})

// Exportar para Vercel
module.exports = app

// Handler de Vercel
export default async function (req: any, res: any) {
  // Responder directamente para health check
  if (req.url === '/api/health') {
    return res.status(200).json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'CampoApp API',
      version: '1.0.0',
    })
  }
  
  // Para otras rutas, usar Express
  return new Promise((resolve, reject) => {
    app(req, res, (err: any) => {
      if (err) {
        reject(err)
      } else {
        resolve(undefined)
      }
    })
  })
}

// Solo iniciar el servidor si no estamos en Vercel
if (process.env.VERCEL !== '1' && process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`
  ╔═══════════════════════════════════════════════════════════╗
  ║                                                           ║
  ║   🏡 CampoApp API Server                                 ║
  ║                                                           ║
  ║   ✅ Servidor corriendo en el puerto ${PORT}                 ║
  ║   🌐 URL: http://localhost:${PORT}                          ║
  ║   📡 API:   http://localhost:${PORT}/api                     ║
  ║   💚 Health: http://localhost:${PORT}/api/health             ║
  ║                                                           ║
  ╚═══════════════════════════════════════════════════════════╝
    `)
  })
}
