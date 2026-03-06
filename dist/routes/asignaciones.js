"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const supabase_1 = require("../db/supabase");
const router = (0, express_1.Router)();
// GET /api/app/asignaciones - Listar asignaciones del usuario
router.get('/', auth_1.autenticar, async (req, res) => {
    try {
        const id_usuario = req.usuario?.id_usuario;
        const especialidad = req.usuario?.especialidad;
        const soloActivas = req.query.activas !== 'false';
        if (!id_usuario) {
            return res.status(401).json({
                error: 'No autorizado',
                message: 'Usuario no identificado',
            });
        }
        let query = supabase_1.supabaseAdmin
            .from('asignaciones')
            .select(`
        id_asignacion,
        tipo_asignacion,
        descripcion_actividad,
        fecha_limite,
        completado,
        id_beneficiario,
        beneficiaries:beneficiarios(
          nombre,
          paterno,
          materno,
          municipio,
          localidad,
          folio,
          telefono,
          latitud,
          longitud,
          cadena_productiva
        )
      `)
            .eq('id_usuario', id_usuario);
        // Filtrar por especialidad del técnico (seguridad adicional en servidor)
        if (especialidad && especialidad !== 'ACTIVIDAD_GENERAL') {
            query = query.eq('beneficiaries.cadena_productiva', especialidad);
        }
        // Filtrar solo activas si se pide
        if (soloActivas) {
            query = query.eq('completado', false);
        }
        const { data: asignaciones, error } = await query.order('fecha_limite', { ascending: true });
        if (error) {
            throw error;
        }
        // Transformar datos para el formato requerido por la app
        const asignacionesTransformadas = asignaciones?.map((a) => ({
            id_asignacion: a.id_asignacion,
            tipo_asignacion: a.tipo_asignacion,
            descripcion_actividad: a.descripcion_actividad,
            fecha_limite: a.fecha_limite,
            completado: a.completado,
            beneficiario_nombre: a.beneficiaries
                ? `${a.beneficiaries.nombre || ''} ${a.beneficiaries.paterno || ''} ${a.beneficiaries.materno || ''}`.trim()
                : null,
            beneficiario_municipio: a.beneficiaries?.municipio || null,
            beneficiario_localidad: a.beneficiaries?.localidad || null,
            beneficiario_folio: a.beneficiaries?.folio || null,
            beneficiario_telefono: a.beneficiaries?.telefono || null,
            beneficiario_lat: a.beneficiaries?.latitud || null,
            beneficiario_lng: a.beneficiaries?.longitud || null,
            cadena_productiva: a.beneficiaries?.cadena_productiva || null,
        })) || [];
        res.json({
            data: {
                asignaciones: asignacionesTransformadas,
            },
        });
    }
    catch (error) {
        console.error('Error obteniendo asignaciones:', error);
        res.status(500).json({
            error: 'Error interno',
            message: 'Error al obtener asignaciones',
        });
    }
});
// POST /api/app/asignaciones/:id/completar - Marcar asignación como completada
router.post('/:id/completar', auth_1.autenticar, async (req, res) => {
    try {
        const { id } = req.params;
        const id_usuario = req.usuario?.id_usuario;
        if (!id_usuario) {
            return res.status(401).json({
                error: 'No autorizado',
                message: 'Usuario no identificado',
            });
        }
        const { error } = await supabase_1.supabaseAdmin
            .from('asignaciones')
            .update({ completado: true })
            .eq('id_asignacion', id)
            .eq('id_usuario', id_usuario);
        if (error) {
            throw error;
        }
        res.json({
            data: { mensaje: 'Asignación completada correctamente' },
        });
    }
    catch (error) {
        console.error('Error completando asignación:', error);
        res.status(500).json({
            error: 'Error interno',
            message: 'Error al completar asignación',
        });
    }
});
exports.default = router;
//# sourceMappingURL=asignaciones.js.map