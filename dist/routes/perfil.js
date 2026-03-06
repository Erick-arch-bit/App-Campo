"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const supabase_1 = require("../db/supabase");
const router = (0, express_1.Router)();
// GET /api/app/perfil - Obtener perfil del usuario autenticado
router.get('/', auth_1.autenticar, async (req, res) => {
    try {
        const id_usuario = req.usuario?.id_usuario;
        if (!id_usuario) {
            return res.status(401).json({
                error: 'No autorizado',
                message: 'Usuario no identificado',
            });
        }
        const { data: usuario, error } = await supabase_1.supabaseAdmin
            .from('usuarios')
            .select('id_usuario, nombre_completo, email, rol, especialidad, puede_registrar_beneficiarios, bloqueado_revision, zona_nombre')
            .eq('id_usuario', id_usuario)
            .single();
        if (error || !usuario) {
            return res.status(404).json({
                error: 'Usuario no encontrado',
                message: 'No se encontró el usuario',
            });
        }
        res.json({
            data: usuario,
        });
    }
    catch (error) {
        console.error('Error obteniendo perfil:', error);
        res.status(500).json({
            error: 'Error interno',
            message: 'Error al obtener perfil',
        });
    }
});
// PUT /api/app/perfil - Actualizar perfil del usuario
router.put('/', auth_1.autenticar, async (req, res) => {
    try {
        const id_usuario = req.usuario?.id_usuario;
        const { nombre_completo, telefono } = req.body;
        if (!id_usuario) {
            return res.status(401).json({
                error: 'No autorizado',
                message: 'Usuario no identificado',
            });
        }
        const { data: usuario, error } = await supabase_1.supabaseAdmin
            .from('usuarios')
            .update({
            nombre_completo: nombre_completo || undefined,
        })
            .eq('id_usuario', id_usuario)
            .select('id_usuario, nombre_completo, email, rol, especialidad, puede_registrar_beneficiarios, bloqueado_revision, zona_nombre')
            .single();
        if (error) {
            throw error;
        }
        res.json({
            data: usuario,
        });
    }
    catch (error) {
        console.error('Error actualizando perfil:', error);
        res.status(500).json({
            error: 'Error interno',
            message: 'Error al actualizar perfil',
        });
    }
});
exports.default = router;
//# sourceMappingURL=perfil.js.map