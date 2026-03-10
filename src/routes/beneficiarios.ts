import { Router, Response } from 'express'
import { autenticar, AuthRequest, requierePermisoBeneficiarios } from '../middleware/auth'
import { supabaseAdmin } from '../db/supabase'

const router = Router()

// Helper para normalizar query params de Express
const getQueryString = (param: string | string[] | undefined): string | undefined => {
  if (!param) return undefined
  return Array.isArray(param) ? param[0] : param
}

// GET /api/app/beneficiarios - Listar todos los beneficiarios
router.get('/', autenticar, async (req: AuthRequest, res: Response) => {
  try {
    const search = getQueryString(req.query.search as string | string[] | undefined)
    const limit = parseInt(getQueryString(req.query.limit as string | string[] | undefined) || '50')
    const offset = parseInt(getQueryString(req.query.offset as string | string[] | undefined) || '0')

    let query = supabaseAdmin
      .from('beneficiarios')
      .select('id_beneficiario, folio_saderh, curp, nombre_completo, municipio, localidad, cadena_productiva, telefono_contacto, latitud_predio, longitud_predio, origen_registro, estatus_beneficiario, created_at', { count: 'exact' })

    // Búsqueda por texto
    if (search) {
      query = query.or(`nombre_completo.ilike.%${search}%,municipio.ilike.%${search}%,folio_saderh.ilike.%${search}%`)
    }

    const { data: beneficiarios, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      throw error
    }

    // Transformar datos para el formato requerido por la app
    const beneficiariosTransformados = beneficiarios?.map((b: any) => ({
      id_beneficiario: b.id_beneficiario,
      folio_saderh: b.folio_saderh,
      curp: b.curp,
      nombre_completo: b.nombre_completo,
      municipio: b.municipio,
      localidad: b.localidad,
      cadena_productiva: b.cadena_productiva,
      telefono_contacto: b.telefono_contacto,
      latitud_predio: b.latitud_predio?.toString(),
      longitud_predio: b.longitud_predio?.toString(),
      origen_registro: b.origen_registro,
      estatus_beneficiario: b.estatus_beneficiario,
      total_visitas: 0, // Se puede calcular dinámicamente si se necesita
      fecha_registro: b.created_at,
    })) || []

    res.json({
      success: true,
      data: beneficiariosTransformados,
    })
  } catch (error) {
    console.error('Error obteniendo beneficiarios:', error)
    res.status(500).json({
      error: 'Error interno',
      message: 'Error al obtener beneficiarios',
    })
  }
})

// POST /api/app/beneficiarios - Crear nuevo beneficiario
router.post('/', autenticar, requierePermisoBeneficiarios, async (req: AuthRequest, res: Response) => {
  try {
    const id_usuario = req.usuario?.id_usuario
    
    const { 
      nombre_completo, 
      municipio, 
      localidad, 
      curp, 
      cadena_productiva, 
      telefono_contacto, 
      latitud_predio, 
      longitud_predio 
    } = req.body

    if (!nombre_completo || !municipio || !localidad) {
      return res.status(400).json({
        error: 'Datos inválidos',
        message: 'Nombre completo, municipio y localidad son requeridos',
      })
    }

    // Parsear latitud y longitud si vienen como string
    const latitud = latitud_predio ? parseFloat(latitud_predio) : null
    const longitud = longitud_predio ? parseFloat(longitud_predio) : null

    const { data: beneficiario, error } = await supabaseAdmin
      .from('beneficiarios')
      .insert({
        nombre_completo,
        municipio,
        localidad,
        curp: curp || null,
        cadena_productiva: cadena_productiva || null,
        telefono_contacto: telefono_contacto || null,
        latitud_predio: latitud,
        longitud_predio: longitud,
        origen_registro: 'APP',
        estatus_beneficiario: 'ACTIVO',
        id_usuario_registro: id_usuario,
      })
      .select()
      .single()

    if (error) {
      if (error.message.includes('duplicate') || error.code === '23505') {
        return res.status(409).json({
          error: 'Conflicto',
          message: 'Ya existe un beneficiario con esos datos',
        })
      }
      throw error
    }

    res.status(201).json({
      success: true,
      message: 'Beneficiario creado',
      data: {
        id_beneficiario: beneficiario.id_beneficiario,
        nombre_completo: beneficiario.nombre_completo,
      },
    })
  } catch (error) {
    console.error('Error creando beneficiario:', error)
    res.status(500).json({
      error: 'Error interno',
      message: 'Error al crear beneficiario',
    })
  }
})

// GET /api/app/beneficiarios/:id - Obtener beneficiario por ID
router.get('/:id', autenticar, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params

    const { data: beneficiario, error } = await supabaseAdmin
      .from('beneficiarios')
      .select('*')
      .eq('id_beneficiario', id)
      .single()

    if (error || !beneficiario) {
      return res.status(404).json({
        error: 'Beneficiario no encontrado',
        message: 'No se encontró el beneficiario',
      })
    }

    res.json({
      data: beneficiario,
    })
  } catch (error) {
    console.error('Error obteniendo beneficiario:', error)
    res.status(500).json({
      error: 'Error interno',
      message: 'Error al obtener beneficiario',
    })
  }
})

export default router
