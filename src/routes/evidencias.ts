import { Router, Response } from 'express'
import { autenticar, AuthRequest } from '../middleware/auth'
import { supabaseAdmin } from '../db/supabase'

const router = Router()

// POST /api/app/evidencias - Crear evidencia desde JSON (app móvil)
// Request: { "id_bitacora": 1, "url_archivo": "...", "cloudinary_public_id": "...", "tipo_archivo": "FOTO", "descripcion": "...", "orden": 1 }
router.post('/', autenticar, async (req: AuthRequest, res: Response) => {
  try {
    const id_usuario = req.usuario?.id_usuario

    if (!id_usuario) {
      return res.status(401).json({
        error: 'No autorizado',
        message: 'Usuario no identificado',
      })
    }

    const { id_bitacora, url_archivo, cloudinary_public_id, tipo_archivo, descripcion, orden } = req.body

    if (!url_archivo || !tipo_archivo) {
      return res.status(400).json({
        error: 'Datos inválidos',
        message: 'URL del archivo y tipo de archivo son requeridos',
      })
    }

    // Guardar en la base de datos
    const { data: evidencia, error } = await supabaseAdmin
      .from('evidencias')
      .insert({
        id_bitacora: id_bitacora || null,
        url: url_archivo,
        public_id: cloudinary_public_id || null,
        tipo_archivo: tipo_archivo || 'FOTO',
        descripcion: descripcion || null,
        orden: orden || null,
        sincronizado: true,
      })
      .select()
      .single()

    if (error) {
      throw error
    }

    res.status(201).json({
      success: true,
      message: 'Evidencia subida',
      data: {
        id_evidencia: evidencia.id_evidencia,
        id_bitacora: evidencia.id_bitacora,
      },
    })
  } catch (error) {
    console.error('Error creando evidencia:', error)
    res.status(500).json({
      error: 'Error interno',
      message: 'Error al crear evidencia',
    })
  }
})

export default router
