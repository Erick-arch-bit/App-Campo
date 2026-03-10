import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import config from './config'

// Importar rutas
import authRoutes from './routes/auth'
import perfilRoutes from './routes/perfil'
import asignacionesRoutes from './routes/asignaciones'
import beneficiariosRoutes from './routes/beneficiarios'
import bitacorasRoutes from './routes/bitacoras'
import evidenciasRoutes from './routes/evidencias'
import syncRoutes from './routes/sync'

const app = express()
const PORT = config.port

// Middleware de seguridad
app.use(helmet())

// Configuración de CORS
app.use(cors({
  origin: config.allowedOrigins,
  credentials: true,
}))

// Rate limiting
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
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
app.use('/api/app/auth', authRoutes)
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
    version: '2.0.0',
    description: 'API para la aplicación móvil de SADERH Campo Hidalgo',
    baseUrl: '/api/app',
    endpoints: {
      auth: {
        login: 'POST /api/auth/login',
        registro: 'POST /api/auth/registrar',
      },
      app: {
        perfil: 'GET /api/app/perfil',
        asignaciones: 'GET /api/app/asignaciones?activas=true',
        completarAsignacion: 'POST /api/app/asignaciones/:id/completar',
        beneficiaries: 'GET /api/app/beneficiarios?search=texto',
        crearBeneficiario: 'POST /api/app/beneficiarios',
        bitacoras: 'GET /api/app/bitacoras?limit=50&offset=0',
        crearBitacora: 'POST /api/app/bitacoras',
        crearEvidencia: 'POST /api/app/evidencias',
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
    message: config.nodeEnv === 'development' ? err.message : 'Algo salió mal',
  })
})

// Iniciar servidor
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

export default app
