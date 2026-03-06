import { Router, Response } from 'express'
import { autenticar, AuthRequest } from '../middleware/auth'
import { supabaseAdmin } from '../db/supabase'

const router = Router()

// GET /api/app/perfil - Obtener perfil del usuario autenticado
router.get('/', autenticar, async (req: AuthRequest, res: Response) => {
  try {
    const id_usuario = req.usuario?.id_usuario

    if (!id_usuario) {
      return res.status(401).json({
        error: 'No autorizado',
        message: 'Usuario no identificado',
      })
    }

    const { data: usuario, error } = await supabaseAdmin
      .from('usuarios')
      .select('id_usuario, nombre_completo, email, rol, especialidad, puede_registrar_beneficiarios, bloqueado_revision, zona_nombre')
      .eq('id_usuario', id_usuario)
      .single()

    if (error || !usuario) {
      return res.status(404).json({
        error: 'Usuario no encontrado',
        message: 'No se encontró el usuario',
      })
    }

    res.json({
      data: usuario,
    })
  } catch (error) {
    console.error('Error obteniendo perfil:', error)
    res.status(500).json({
      error: 'Error interno',
      message: 'Error al obtener perfil',
    })
  }
})

// PUT /api/app/perfil - Actualizar perfil del usuario
router.put('/', autenticar, async (req: AuthRequest, res: Response) => {
  try {
    const id_usuario = req.usuario?.id_usuario
    const { nombre_completo, telefono } = req.body

    if (!id_usuario) {
      return res.status(401).json({
        error: 'No autorizado',
        message: 'Usuario no identificado',
      })
    }

    const { data: usuario, error } = await supabaseAdmin
      .from('usuarios')
      .update({
        nombre_completo: nombre_completo || undefined,
      })
      .eq('id_usuario', id_usuario)
      .select('id_usuario, nombre_completo, email, rol, especialidad, puede_registrar_beneficiarios, bloqueado_revision, zona_nombre')
      .single()

    if (error) {
      throw error
    }

    res.json({
      data: usuario,
    })
  } catch (error) {
    console.error('Error actualizando perfil:', error)
    res.status(500).json({
      error: 'Error interno',
      message: 'Error al actualizar perfil',
    })
  }
})

export default router
