import { Router, Response } from 'express'
import { autenticar, AuthRequest, requierePermisoBeneficiarios } from '../middleware/auth'
import { supabaseAdmin } from '../db/supabase'

const router = Router()

// GET /api/app/beneficiarios - Listar todos los beneficiarios
router.get('/', autenticar, async (req: AuthRequest, res: Response) => {
  try {
    const { data: beneficiarios, error } = await supabaseAdmin
      .from('beneficiarios')
      .select('id_beneficiario, nombre, paterno, materno, municipio, localidad, folio, telefono')
      .order('created_at', { ascending: false })

    if (error) {
      throw error
    }

    const beneficiariosTransformados = beneficiarios?.map(b => ({
      id_beneficiario: b.id_beneficiario,
      nombre_completo: `${b.nombre} ${b.paterno} ${b.materno || ''}`.trim(),
      municipio: b.municipio,
      localidad: b.localidad,
      folio: b.folio,
    })) || []

    res.json({
      data: {
        beneficiarios: beneficiariosTransformados,
      },
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
    const { nombre, paterno, materno, telefono, municipio, localidad, folio, latitud, longitud, cadena_productiva } = req.body

    if (!nombre || !paterno || !municipio || !localidad) {
      return res.status(400).json({
        error: 'Datos inválidos',
        message: 'Nombre, paterno, municipio y localidad son requeridos',
      })
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
      .select()
      .single()

    if (error) {
      if (error.message.includes('duplicate')) {
        return res.status(400).json({
          error: 'Beneficiario ya existe',
          message: 'Ya existe un beneficiario con ese folio',
        })
      }
      throw error
    }

    res.status(201).json({
      data: {
        id_beneficiario: beneficiario.id_beneficiario,
        nombre_completo: `${beneficiario.nombre} ${beneficiario.paterno} ${beneficiario.materno || ''}`.trim(),
        municipio: beneficiario.municipio,
        localidad: beneficiario.localidad,
        folio: beneficiario.folio,
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
