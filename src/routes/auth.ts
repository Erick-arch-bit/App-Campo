import { Router, Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import { supabaseAdmin } from '../db/supabase'
import { generarToken } from '../middleware/auth'

const router = Router()

// POST /api/auth/login - Iniciar sesión con código de acceso (v2.0)
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { codigo_acceso, source } = req.body

    if (!codigo_acceso) {
      return res.status(400).json({
        error: 'Datos inválidos',
        message: 'El código de acceso es requerido',
      })
    }

    // Buscar usuario por código de acceso
    const { data: usuarios, error: userError } = await supabaseAdmin
      .from('usuarios')
      .select('*')
      .eq('codigo_acceso', codigo_acceso)
      .limit(1)

    if (userError || !usuarios || usuarios.length === 0) {
      return res.status(401).json({
        error: 'Credenciales inválidas',
        message: 'Código de acceso incorrecto',
      })
    }

    const usuario = usuarios[0]

    // Verificar que el usuario esté activo
    if (!usuario.activo) {
      return res.status(401).json({
        error: 'Usuario inactivo',
        message: 'Tu cuenta está desactivada. Contacta al administrador.',
      })
    }

    // Generar token JWT
    const token = generarToken({
      id_usuario: usuario.id_usuario,
      codigo_acceso: usuario.codigo_acceso,
      nombre_completo: usuario.nombre_completo,
      rol: usuario.rol,
      especialidad: usuario.especialidad,
      puede_registrar_beneficiarios: usuario.puede_registrar_beneficiarios,
      zona_nombre: usuario.zona_nombre,
    })

    // Actualizar último acceso
    await supabaseAdmin
      .from('usuarios')
      .update({ ultimo_acceso: new Date().toISOString() })
      .eq('id_usuario', usuario.id_usuario)

    // Responder con token y datos del usuario
    res.json({
      data: {
        token,
        user: {
          id_usuario: usuario.id_usuario,
          nombre_completo: usuario.nombre_completo,
          email: usuario.email,
          codigo_acceso: usuario.codigo_acceso,
          rol: usuario.rol,
          especialidad: usuario.especialidad,
          puede_registrar_beneficiarios: usuario.puede_registrar_beneficiarios,
          bloqueado_revision: usuario.bloqueado_revision,
          zona_nombre: usuario.zona_nombre,
          foto_perfil_url: usuario.foto_perfil_url,
        },
      },
    })
  } catch (error) {
    console.error('Error en login:', error)
    res.status(500).json({
      error: 'Error interno',
      message: 'Error al iniciar sesión',
    })
  }
})

// POST /api/auth/registrar - Registrar nuevo usuario (solo admin)
// Genera automáticamente un código de acceso de 5 dígitos único
router.post('/registrar', async (req: Request, res: Response) => {
  try {
    const { nombre_completo, email, rol, especialidad, zona_nombre } = req.body

    if (!nombre_completo || !email) {
      return res.status(400).json({
        error: 'Datos inválidos',
        message: 'Nombre y email son requeridos',
      })
    }

    // Generar código de acceso único de 5 dígitos
    const generarCodigoAcceso = (): string => {
      return Math.floor(10000 + Math.random() * 90000).toString()
    }

    let nuevoCodigo = generarCodigoAcceso()
    let codigoUnico = false
    let intentos = 0
    
    // Verificar que el código sea único (máximo 10 intentos)
    while (!codigoUnico && intentos < 10) {
      const { data: existing } = await supabaseAdmin
        .from('usuarios')
        .select('id_usuario')
        .eq('codigo_acceso', nuevoCodigo)
        .limit(1)
      
      if (!existing || existing.length === 0) {
        codigoUnico = true
      } else {
        nuevoCodigo = generarCodigoAcceso()
        intentos++
      }
    }

    if (!codigoUnico) {
      return res.status(500).json({
        error: 'Error al generar código',
        message: 'No se pudo generar un código único. Intenta de nuevo.',
      })
    }

    // Hash del código de acceso
    const codigoHash = await bcrypt.hash(nuevoCodigo, 10)

    // Crear usuario
    const { data: usuario, error } = await supabaseAdmin
      .from('usuarios')
      .insert({
        nombre_completo,
        email,
        codigo_acceso: nuevoCodigo,
        codigo_acceso_hash: codigoHash,
        rol: rol || 'TECNICO',
        especialidad: especialidad || null,
        puede_registrar_beneficiarios: rol === 'COORDINADOR' || rol === 'SUPER_ADMIN',
        bloqueado_revision: false,
      })
      .select()
      .single()

    if (error) {
      if (error.message.includes('duplicate')) {
        return res.status(400).json({
          error: 'Usuario ya existe',
          message: 'Ya existe un usuario con ese email',
        })
      }
      throw error
    }

    res.status(201).json({
      data: {
        ...usuario,
        codigo_acceso: nuevoCodigo, // Devolver el código en texto plano solo al crear
      },
    })
  } catch (error) {
    console.error('Error en registro:', error)
    res.status(500).json({
      error: 'Error interno',
      message: 'Error al registrar usuario',
    })
  }
})

export default router
