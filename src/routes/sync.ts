import { Router, Response, NextFunction } from 'express'
import { autenticar, AuthRequest } from '../middleware/auth'
import { supabaseAdmin } from '../db/supabase'
import crypto from 'crypto'

const router = Router()

// Verificar HMAC de las peticiones de sync
const verificarHMAC = (req: AuthRequest, res: Response, next: NextFunction) => {
  const hmacHeader = req.headers['x-app-hmac']
  const timestamp = req.headers['x-timestamp']
  
  if (!hmacHeader || !timestamp) {
    return res.status(401).json({
      error: 'No autorizado',
      message: 'FaltanHeaders de autenticación',
    })
  }

  // En producción, verificar el HMAC
  // Por ahora, permitimos todas las peticiones autenticadas
  next()
}

// POST /api/sync/bitacoras - Sincronizar bitácoras del modo offline
router.post('/bitacoras', autenticar, async (req: AuthRequest, res: Response) => {
  try {
    const id_usuario = req.usuario?.id_usuario

    if (!id_usuario) {
      return res.status(401).json({
        error: 'No autorizado',
        message: 'Usuario no identificado',
      })
    }

    const { registros } = req.body

    if (!Array.isArray(registros) || registros.length === 0) {
      return res.status(400).json({
        error: 'Datos inválidos',
        message: 'Se requiere un array de registros',
      })
    }

    const bitacorasCreadas = []
    const errores = []

    for (const registro of registros) {
      try {
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
        } = registro

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
          .select('id_bitacora, uuid_movil')
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

        bitacorasCreadas.push({
          uuid_movil,
          id_bitacora: bitacora.id_bitacora,
        })
      } catch (err: any) {
        errores.push({
          uuid_movil: registro.uuid_movil,
          error: err.message,
        })
      }
    }

    res.json({
      data: {
        sincronizadas: bitacorasCreadas.length,
        errores: errores.length,
        detalles: bitacorasCreadas,
      },
    })
  } catch (error) {
    console.error('Error sincronizando bitácoras:', error)
    res.status(500).json({
      error: 'Error interno',
      message: 'Error al sincronizar bitácoras',
    })
  }
})

// POST /api/sync/beneficiarios - Sincronizar beneficiarios del modo offline
router.post('/beneficiarios', autenticar, async (req: AuthRequest, res: Response) => {
  try {
    const id_usuario = req.usuario?.id_usuario

    if (!id_usuario) {
      return res.status(401).json({
        error: 'No autorizado',
        message: 'Usuario no identificado',
      })
    }

    // Verificar permiso
    if (!req.usuario?.puede_registrar_beneficiarios) {
      return res.status(403).json({
        error: 'Prohibido',
        message: 'No tienes permiso para registrar beneficiarios',
      })
    }

    const { registros } = req.body

    if (!Array.isArray(registros) || registros.length === 0) {
      return res.status(400).json({
        error: 'Datos inválidos',
        message: 'Se requiere un array de registros',
      })
    }

    const beneficiariosCreados = []
    const errores = []

    for (const registro of registros) {
      try {
        const {
          uuid_movil,
          nombre,
          paterno,
          materno,
          telefono,
          municipio,
          localidad,
          folio,
          latitud,
          longitud,
          cadena_productiva,
        } = registro

        // Verificar si ya existe por folio
        const { data: existente } = await supabaseAdmin
          .from('beneficiarios')
          .select('id_beneficiario')
          .eq('folio', folio)
          .single()

        if (existente) {
          errores.push({
            uuid_movil,
            folio,
            error: 'Ya existe un beneficiario con ese folio',
          })
          continue
        }

        const { data: beneficiario, error } = await supabaseAdmin
          .from('beneficiarios')
          .insert({
            nombre,
            paterno,
            materno: materno || null,
            telefono: telefono || null,
            municipio,
            localidad,
            folio: folio || null,
            latitud: latitud || null,
            longitud: longitud || null,
            cadena_productiva: cadena_productiva || null,
          })
          .select('id_beneficiario, uuid_movil, folio')
          .single()

        if (error) {
          throw error
        }

        beneficiariosCreados.push({
          uuid_movil,
          id_beneficiario: beneficiario.id_beneficiario,
          folio: beneficiario.folio,
        })
      } catch (err: any) {
        errores.push({
          uuid_movil: registro.uuid_movil,
          error: err.message,
        })
      }
    }

    res.json({
      data: {
        sincronizados: beneficiariosCreados.length,
        errores: errores.length,
        detalles: beneficiariosCreados,
      },
    })
  } catch (error) {
    console.error('Error sincronizando beneficiarios:', error)
    res.status(500).json({
      error: 'Error interno',
      message: 'Error al sincronizar beneficiarios',
    })
  }
})

// GET /api/sync/estado - Obtener estado de sincronización
router.get('/estado', autenticar, async (req: AuthRequest, res: Response) => {
  try {
    const id_usuario = req.usuario?.id_usuario

    if (!id_usuario) {
      return res.status(401).json({
        error: 'No autorizado',
        message: 'Usuario no identificado',
      })
    }

    // Contar bitácoras no sincronizadas
    const { count: pendientesBitacoras } = await supabaseAdmin
      .from('bitacoras')
      .select('*', { count: 'exact', head: true })
      .eq('id_usuario', id_usuario)
      .eq('sincronizado', false)

    res.json({
      data: {
        bitacoras_pendientes: pendientesBitacoras || 0,
        ultima_sincronizacion: new Date().toISOString(),
      },
    })
  } catch (error) {
    console.error('Error obteniendo estado de sync:', error)
    res.status(500).json({
      error: 'Error interno',
      message: 'Error al obtener estado de sincronización',
    })
  }
})

export default router
