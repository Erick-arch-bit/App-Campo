"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generarToken = exports.requierePermisoBeneficiarios = exports.requiereAdmin = exports.autenticar = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const JWT_SECRET = process.env.JWT_SECRET_APP || '';
// Middleware para verificar el token JWT
const autenticar = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
            error: 'No autorizado',
            message: 'Token de autenticación requerido',
        });
    }
    const token = authHeader.substring(7);
    try {
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        req.usuario = {
            id_usuario: decoded.id_usuario,
            codigo_acceso: decoded.codigo_acceso,
            nombre_completo: decoded.nombre_completo,
            rol: decoded.rol,
            especialidad: decoded.especialidad,
            puede_registrar_beneficiarios: decoded.puede_registrar_beneficiarios,
            zona_nombre: decoded.zona_nombre,
        };
        next();
    }
    catch (error) {
        return res.status(401).json({
            error: 'No autorizado',
            message: 'Token inválido o expirado',
        });
    }
};
exports.autenticar = autenticar;
// Middleware para verificar rol de administrador
const requiereAdmin = (req, res, next) => {
    if (req.usuario?.rol !== 'SUPER_ADMIN' && req.usuario?.rol !== 'ADMIN') {
        return res.status(403).json({
            error: 'Prohibido',
            message: 'Se requiere rol de administrador',
        });
    }
    next();
};
exports.requiereAdmin = requiereAdmin;
// Middleware para verificar que el usuario puede registrar beneficiarios
const requierePermisoBeneficiarios = (req, res, next) => {
    if (!req.usuario?.puede_registrar_beneficiarios) {
        return res.status(403).json({
            error: 'Prohibido',
            message: 'No tienes permiso para registrar beneficiarios',
        });
    }
    next();
};
exports.requierePermisoBeneficiarios = requierePermisoBeneficiarios;
// Generar token JWT (v2.0 - usa código de acceso)
const generarToken = (payload) => {
    return jsonwebtoken_1.default.sign(payload, JWT_SECRET, { expiresIn: '7d' });
};
exports.generarToken = generarToken;
//# sourceMappingURL=auth.js.map