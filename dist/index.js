"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
// Importar rutas
const auth_1 = __importDefault(require("./routes/auth"));
const perfil_1 = __importDefault(require("./routes/perfil"));
const asignaciones_1 = __importDefault(require("./routes/asignaciones"));
const beneficiarios_1 = __importDefault(require("./routes/beneficiarios"));
const bitacoras_1 = __importDefault(require("./routes/bitacoras"));
const evidencias_1 = __importDefault(require("./routes/evidencias"));
const sync_1 = __importDefault(require("./routes/sync"));
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3001;
// Middleware de seguridad
app.use((0, helmet_1.default)());
// Configuración de CORS
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'];
app.use((0, cors_1.default)({
    origin: allowedOrigins,
    credentials: true,
}));
// Rate limiting
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100, // límite de 100 peticiones por IP
    message: {
        error: 'Demasiadas peticiones',
        message: 'Por favor, intenta de nuevo más tarde',
    },
});
app.use('/api/', limiter);
// Middleware para parsing de JSON
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
// Rutas de la API
app.use('/api/auth', auth_1.default);
app.use('/api/app/perfil', perfil_1.default);
app.use('/api/app/asignaciones', asignaciones_1.default);
app.use('/api/app/beneficiarios', beneficiarios_1.default);
app.use('/api/app/bitacoras', bitacoras_1.default);
app.use('/api/app/evidencias', evidencias_1.default);
app.use('/api/sync', sync_1.default);
// Endpoint de salud
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        service: 'CampoApp API',
        version: '1.0.0',
    });
});
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
    });
});
// Manejo de errores 404
app.use((req, res) => {
    res.status(404).json({
        error: 'No encontrado',
        message: `Ruta ${req.method} ${req.path} no encontrada`,
    });
});
// Manejo de errores globales
app.use((err, req, res, next) => {
    console.error('Error no manejado:', err);
    res.status(500).json({
        error: 'Error interno del servidor',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Algo salió mal',
    });
});
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
  `);
});
exports.default = app;
//# sourceMappingURL=index.js.map