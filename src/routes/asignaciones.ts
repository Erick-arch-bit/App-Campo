import { Router, Response } from 'express'
import { autenticar, AuthRequest } from '../middleware/auth'
import { supabaseAdmin } from '../db/supabase'

const router = Router()

// Helper para normalizar query params de Express
const getQueryString = (param: string | string[] | undefined): string | undefined => {
  if (!param) return undefined
  return Array.isArray(param) ? param[0] : param
}

// GET /api/app/asignaciones - Listar asignaciones del usuario
router.get('/', autenticar, async (req: AuthRequest, res: Response) => {
  try {
    const id_usuario = req.usuario?.id_usuario
    const soloActivas = getQueryString(req.query.activas as string | string[] | undefined) === 'true'

    if (!id_usuario) {
      return res.status(401).json({
        error: 'No autorizado',
        message: 'Usuario no identificado',
      })
    }

    let query = supabaseAdmin
      .from('asignaciones')
      .select(`
        id_asignacion,
        id_tecnico,
        id_beneficiario,
        id_usuario_creo,
        tipo_asignacion,
        descripcion_actividad,
        prioridad,
        fecha_limite,
        completado,
        fecha_completado,
        fecha_creacion,
        beneficiarios!inner(
          id_beneficiario,
          nombre_completo,
          municipio,
          localidad,
          latitud_predio,
          longitud_predio,
          cadena_productiva,
          telefono_contacto
        )
      `)
      .eq('id_tecnico', id_usuario)

    // Filtrar solo activas si se pide
    if (soloActivas) {
      query = query.eq('completado', false)
    }

    const { data: asignaciones, error } = await query.order('fecha_limite', { ascending: true })

    if (error) {
      throw error
    }

    // Transformar datos para el formato requerido por la app (compatibilidad hacia atrás)
    const asignacionesTransformadas = asignaciones?.map((a: any) => ({
      id_asignacion: a.id_asignacion,
      id_tecnico: a.id_tecnico,
      id_beneficiario: a.id_beneficiario,
      id_usuario_creo: a.id_usuario_creo,
      tipo_asignacion: a.tipo_asignacion,
      descripcion_actividad: a.descripcion_actividad,
      prioridad: a.prioridad,
      fecha_limite: a.fecha_limite,
      completado: a.completado,
      fecha_completado: a.fecha_completado,
      fecha_creacion: a.fecha_creacion,
      // Nueva estructura (anidada)
      beneficiario: a.beneficiarios ? {
        id_beneficiario: a.beneficiarios.id_beneficiario,
        nombre_completo: a.beneficiarios.nombre_completo,
        municipio: a.beneficiarios.municipio,
        localidad: a.beneficiarios.localidad,
        latitud_predio: a.beneficiarios.latitud_predio?.toString(),
        longitud_predio: a.beneficiarios.longitud_predio?.toString(),
        cadena_productiva: a.beneficiarios.cadena_productiva,
        telefono_contacto: a.beneficiarios.telefono_contacto,
      } : null,
      // Estructura plana (compatibilidad hacia atrás)
      beneficiario_nombre: a.beneficiarios?.nombre_completo || null,
      beneficiario_municipio: a.beneficiarios?.municipio || null,
      beneficiario_localidad: a.beneficiarios?.localidad || null,
      beneficiario_folio: a.beneficiarios?.folio_saderh || null,
      beneficiario_telefono: a.beneficiarios?.telefono_contacto || null,
      beneficiario_lat: a.beneficiarios?.latitud_predio?.toString() || null,
      beneficiario_lng: a.beneficiarios?.longitud_predio?.toString() || null,
      cadena_productiva: a.beneficiarios?.cadena_productiva || null,
    })) || []

    res.json({
      success: true,
      data: asignacionesTransformadas,
    })
  } catch (error) {
    console.error('Error obteniendo asignaciones:', error)
    res.status(500).json({
      error: 'Error interno',
      message: 'Error al obtener asignaciones',
    })
  }
})

// POST /api/app/asignaciones/:id/completar - Marcar asignación como completada
router.post('/:id/completar', autenticar, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params
    const id_usuario = req.usuario?.id_usuario

    if (!id_usuario) {
      return res.status(401).json({
        error: 'No autorizado',
        message: 'Usuario no identificado',
      })
    }

    // Normalizar id params a string
    const idParam = Array.isArray(id) ? id[0] : id
    
    // Actualizar asignación como completada
    const { error } = await supabaseAdmin
      .from('asignaciones')
      .update({ 
        completado: true,
        fecha_completado: new Date().toISOString()
      })
      .eq('id_asignacion', parseInt(idParam))
      .eq('id_tecnico', id_usuario)

    if (error) {
      throw error
    }

    res.json({
      success: true,
      message: 'Asignación completada',
      data: { 
        id_asignacion: parseInt(idParam), 
        completado: true 
      },
    })
  } catch (error) {
    console.error('Error completando asignación:', error)
    res.status(500).json({
      error: 'Error interno',
      message: 'Error al completar asignación',
    })
  }
})

export default router
