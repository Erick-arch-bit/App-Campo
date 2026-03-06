import { Router, Response } from 'express'
import { autenticar, AuthRequest } from '../middleware/auth'
import { supabaseAdmin } from '../db/supabase'

const router = Router()

// GET /api/app/bitacoras - Obtener historial de bitácoras
router.get('/', autenticar, async (req: AuthRequest, res: Response) => {
  try {
    const id_usuario = req.usuario?.id_usuario

    if (!id_usuario) {
      return res.status(401).json({
        error: 'No autorizado',
        message: 'Usuario no identificado',
      })
    }

    const { data: bitacoras, error } = await supabaseAdmin
      .from('bitacoras')
      .select(`
        id_bitacora,
        id_asignacion,
        uuid_movil,
        fecha_hora_inicio,
        fecha_hora_fin,
        latitud,
        longitud,
        tipo_bitacora,
        reporte,
        calificacion,
        sincronizado,
        created_at
      `)
      .eq('id_usuario', id_usuario)
      .order('created_at', { ascending: false })

    if (error) {
      throw error
    }

    res.json({
      data: {
        bitacoras: bitacoras || [],
      },
    })
  } catch (error) {
    console.error('Error obteniendo bitácoras:', error)
    res.status(500).json({
      error: 'Error interno',
      message: 'Error al obtener bitácoras',
    })
  }
})

// POST /api/app/bitacoras - Crear nueva bitácora
router.post('/', autenticar, async (req: AuthRequest, res: Response) => {
  try {
    const id_usuario = req.usuario?.id_usuario

    if (!id_usuario) {
      return res.status(401).json({
        error: 'No autorizado',
        message: 'Usuario no identificado',
      })
    }

    const {
      uuid_movil,
      id_asignacion,
      fecha_hora_inicio,
      fecha_hora_fin,
      latitud,
      longitud,
      latitud_fin,
      longitud_fin,
      precision_gps,
      tipo_bitacora,
      datos_extendidos,
      dispositivo_info,
      reporte,
      calificacion,
      firma_url,
      foto_confirmacion,
    } = req.body

    if (!fecha_hora_inicio || !fecha_hora_fin || !tipo_bitacora) {
      return res.status(400).json({
        error: 'Datos inválidos',
        message: 'Fecha de inicio, fecha de fin y tipo de bitácora son requeridos',
      })
    }

    const { data: bitacora, error } = await supabaseAdmin
      .from('bitacoras')
      .insert({
        id_usuario,
        id_asignacion: id_asignacion || null,
        uuid_movil: uuid_movil || null,
        fecha_hora_inicio,
        fecha_hora_fin,
        latitud: latitud || null,
        longitud: longitud || null,
        latitud_fin: latitud_fin || null,
        longitud_fin: longitud_fin || null,
        precision_gps: precision_gps || null,
        tipo_bitacora,
        datos_extendidos: datos_extendidos || {},
        dispositivo_info: dispositivo_info || {},
        reporte: reporte || null,
        calificacion: calificacion || null,
        firma_url: firma_url || null,
        foto_confirmacion: foto_confirmacion || null,
        sincronizado: true,
      })
      .select('id_bitacora')
      .single()

    if (error) {
      throw error
    }

    // Si hay una asignación vinculada, marcarla como completada
    if (id_asignacion) {
      await supabaseAdmin
        .from('asignaciones')
        .update({ completado: true })
        .eq('id_asignacion', id_asignacion)
    }

    res.status(201).json({
      data: {
        id_bitacora: bitacora.id_bitacora,
      },
    })
  } catch (error) {
    console.error('Error creando bitácora:', error)
    res.status(500).json({
      error: 'Error interno',
      message: 'Error al crear bitácora',
    })
  }
})

// GET /api/app/bitacoras/:id - Obtener bitácora por ID
router.get('/:id', autenticar, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params
    const id_usuario = req.usuario?.id_usuario

    if (!id_usuario) {
      return res.status(401).json({
        error: 'No autorizado',
        message: 'Usuario no identificado',
      })
    }

    const { data: bitacora, error } = await supabaseAdmin
      .from('bitacoras')
      .select('*')
      .eq('id_bitacora', id)
      .eq('id_usuario', id_usuario)
      .single()

    if (error || !bitacora) {
      return res.status(404).json({
        error: 'Bitácora no encontrada',
        message: 'No se encontró la bitácora',
      })
    }

    // Obtener evidencias asociadas
    const { data: evidencias } = await supabaseAdmin
      .from('evidencias')
      .select('*')
      .eq('id_bitacora', id)

    res.json({
      data: {
        ...bitacora,
        evidencias: evidencias || [],
      },
    })
  } catch (error) {
    console.error('Error obteniendo bitácora:', error)
    res.status(500).json({
      error: 'Error interno',
      message: 'Error al obtener bitácora',
    })
  }
})

export default router
