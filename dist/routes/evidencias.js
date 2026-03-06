"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const auth_1 = require("../middleware/auth");
const supabase_1 = require("../db/supabase");
const cloudinary_1 = require("../lib/cloudinary");
const router = (0, express_1.Router)();
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB max
    },
});
// POST /api/app/evidencias - Subir evidencia (foto/documento)
router.post('/', auth_1.autenticar, upload.single('archivo'), async (req, res) => {
    try {
        const id_usuario = req.usuario?.id_usuario;
        if (!id_usuario) {
            return res.status(401).json({
                error: 'No autorizado',
                message: 'Usuario no identificado',
            });
        }
        if (!req.file) {
            return res.status(400).json({
                error: 'Archivo requerido',
                message: 'Debe enviar un archivo',
            });
        }
        const { id_bitacora, uuid_movil, tipo_archivo, descripcion } = req.body;
        // Determinar tipo de recurso
        const mimeType = req.file.mimetype;
        const resourceType = mimeType.startsWith('image/') ? 'image' : 'raw';
        // Subir a Cloudinary
        const result = await (0, cloudinary_1.subirArchivo)(req.file.buffer, 'evidencias', resourceType);
        // Guardar en la base de datos
        const { data: evidencia, error } = await supabase_1.supabaseAdmin
            .from('evidencias')
            .insert({
            id_bitacora: id_bitacora ? parseInt(id_bitacora) : null,
            uuid_movil: uuid_movil || null,
            tipo_archivo: tipo_archivo || 'FOTO',
            descripcion: descripcion || null,
            url: result.secure_url,
            public_id: result.public_id,
            sincronizado: true,
        })
            .select()
            .single();
        if (error) {
            throw error;
        }
        res.status(201).json({
            data: {
                url: evidencia.url,
                public_id: evidencia.public_id,
                tipo_archivo: evidencia.tipo_archivo,
            },
        });
    }
    catch (error) {
        console.error('Error subiendo evidencia:', error);
        res.status(500).json({
            error: 'Error interno',
            message: 'Error al subir evidencia',
        });
    }
});
// POST /api/app/evidencias/firma - Subir firma
router.post('/firma', auth_1.autenticar, upload.single('firma'), async (req, res) => {
    try {
        const id_usuario = req.usuario?.id_usuario;
        if (!id_usuario) {
            return res.status(401).json({
                error: 'No autorizado',
                message: 'Usuario no identificado',
            });
        }
        if (!req.file) {
            return res.status(400).json({
                error: 'Archivo requerido',
                message: 'Debe enviar la firma',
            });
        }
        // Subir a Cloudinary
        const result = await (0, cloudinary_1.subirArchivo)(req.file.buffer, 'firmas', 'image');
        res.status(201).json({
            data: {
                url: result.secure_url,
                public_id: result.public_id,
            },
        });
    }
    catch (error) {
        console.error('Error subiendo firma:', error);
        res.status(500).json({
            error: 'Error interno',
            message: 'Error al subir firma',
        });
    }
});
// POST /api/app/evidencias/foto - Subir foto de confirmación
router.post('/foto', auth_1.autenticar, upload.single('foto'), async (req, res) => {
    try {
        const id_usuario = req.usuario?.id_usuario;
        if (!id_usuario) {
            return res.status(401).json({
                error: 'No autorizado',
                message: 'Usuario no identificado',
            });
        }
        if (!req.file) {
            return res.status(400).json({
                error: 'Archivo requerido',
                message: 'Debe enviar la foto',
            });
        }
        // Subir a Cloudinary
        const result = await (0, cloudinary_1.subirArchivo)(req.file.buffer, 'fotos-confirmacion', 'image');
        res.status(201).json({
            data: {
                url: result.secure_url,
                public_id: result.public_id,
            },
        });
    }
    catch (error) {
        console.error('Error subiendo foto:', error);
        res.status(500).json({
            error: 'Error interno',
            message: 'Error al subir foto',
        });
    }
});
exports.default = router;
//# sourceMappingURL=evidencias.js.map