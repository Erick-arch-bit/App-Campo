import { Router, Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import { supabaseAdmin } from '../db/supabase'
import { generarToken } from '../middleware/auth'

const router = Router()

// Almacén en memoria para intentos de login (en producción usar Redis o similar)
const intentosLogin: Record<string, { intentos: number; ultimoIntento: number }> = {}
const MAX_INTENTOS = 5
const BLOQUEO_TIEMPO = 15 * 60 * 1000 // 15 minutos

// Función para verificar si está bloqueado
const verificarBloqueo = (codigoAcceso: string): { bloqueado: boolean; mensaje: string } => {
  const intento = intentosLogin[codigoAcceso]
  if (!intento) return { bloqueado: false, mensaje: '' }
  
  if (intento.intentos >= MAX_INTENTOS) {
    const tiempoTranscurrido = Date.now() - intento.ultimoIntento
    if (tiempoTranscurrido < BLOQUEO_TIEMPO) {
      const minutosRestantes = Math.ceil((BLOQUEO_TIEMPO - tiempoTranscurrido) / 60000)
      return { bloqueado: true, mensaje: `Demasiados intentos. Intenta de nuevo en ${minutosRestantes} minutos.` }
    } else {
      // Resetear intentos después del tiempo de bloqueo
      delete intentosLogin[codigoAcceso]
    }
  }
  return { bloqueado: false, mensaje: '' }
}

// Función para registrar intento fallido
const registrarIntentoFallido = (codigoAcceso: string) => {
  if (!intentosLogin[codigoAcceso]) {
    intentosLogin[codigoAcceso] = { intentos: 0, ultimoIntento: 0 }
  }
  intentosLogin[codigoAcceso].intentos++
  intentosLogin[codigoAcceso].ultimoIntento = Date.now()
}

// Función para resetear intentos después de login exitoso
const resetearIntentos = (codigoAcceso: string) => {
  delete intentosLogin[codigoAcceso]
}

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

  // Verificar bloqueo por intentos fallidos
    const bloqueo = verificarBloqueo(codigo_acceso)
    if (bloqueo.bloqueado) {
      return res.status(429).json({
        error: 'Demasiados intentos',
        message: bloqueo.mensaje,
      })
    }

    // Buscar usuario por código de acceso (primero por texto plano para compatibilidad)
    const { data: usuarios, error: userError } = await supabaseAdmin
      .from('usuarios')
      .select('*')
      .eq('codigo_acceso', codigo_acceso)
      .limit(1)

    if (userError || !usuarios || usuarios.length === 0) {
      // Registrar intento fallido
      registrarIntentoFallido(codigo_acceso)
      return res.status(401).json({
        error: 'Código de acceso inválido',
      })
    }

    const usuario = usuarios[0]

    // Verificar el hash del código de acceso si existe
    if (usuario.codigo_acceso_hash) {
      const codigoValido = await bcrypt.compare(codigo_acceso, usuario.codigo_acceso_hash)
      if (!codigoValido) {
        // Registrar intento fallido
        registrarIntentoFallido(codigo_acceso)
        return res.status(401).json({
          error: 'Código de acceso inválido',
        })
      }
    }

    // Resetear intentos después de login exitoso
    resetearIntentos(codigo_acceso)

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

    // Responder con token y datos del usuario (formato spec)
    res.json({
      success: true,
      rol: usuario.rol,
      token,
      user: {
        id_usuario: usuario.id_usuario,
        nombre_completo: usuario.nombre_completo,
        email: usuario.email,
        rol: usuario.rol,
        especialidad: usuario.especialidad,
        puede_registrar_beneficiarios: usuario.puede_registrar_beneficiarios,
        zona_nombre: usuario.zona_nombre,
        foto_perfil_url: usuario.foto_perfil_url,
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

// POST /api/auth/logout - Cerrar sesión
router.post('/logout', async (req: Request, res: Response) => {
  try {
    // El logout se maneja del lado del cliente (elimina token del SecureStore)
    // Opcional: registrar logout en logs o invalidar token en DB
    res.json({
      data: {
        success: true,
        message: 'Sesión cerrada correctamente',
      },
    })
  } catch (error) {
    console.error('Error en logout:', error)
    res.status(500).json({
      error: 'Error interno',
      message: 'Error al cerrar sesión',
    })
  }
})

// POST /api/auth/forgot-password - Recuperar contraseña (código de acceso)
router.post('/forgot-password', async (req: Request, res: Response) => {
  try {
    const { codigo_acceso, email } = req.body

    if (!codigo_acceso && !email) {
      return res.status(400).json({
        error: 'Datos inválidos',
        message: 'Código de acceso o email son requeridos',
      })
    }

    // Buscar usuario por código de acceso o email
    let usuario = null

    if (codigo_acceso) {
      const { data: usuarios } = await supabaseAdmin
        .from('usuarios')
        .select('*')
        .eq('codigo_acceso', codigo_acceso)
        .limit(1)

      if (usuarios && usuarios.length > 0) {
        usuario = usuarios[0]
      }
    } else if (email) {
      const { data: usuarios } = await supabaseAdmin
        .from('usuarios')
        .select('*')
        .eq('email', email)
        .limit(1)

      if (usuarios && usuarios.length > 0) {
        usuario = usuarios[0]
      }
    }

    if (!usuario) {
      return res.status(404).json({
        error: 'Usuario no encontrado',
        message: 'No se encontró un usuario con esos datos',
      })
    }

    // Generar código de recuperación temporal (6 dígitos)
    const codigoRecuperacion = Math.floor(100000 + Math.random() * 900000).toString()

    // Guardar código de recuperación en la base de datos
    const { error: updateError } = await supabaseAdmin
      .from('usuarios')
      .update({
        codigo_recuperacion: codigoRecuperacion,
        codigo_recuperacion_expira: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 minutos
      })
      .eq('id_usuario', usuario.id_usuario)

    if (updateError) {
      throw updateError
    }

    // Responder con éxito
    // NOTA: En producción, enviar el código por email usando un servicio como Resend, SendGrid, etc.
    // IMPORTANTE: NO devolver el código en la respuesta API por seguridad
    res.json({
      data: {
        success: true,
        message: 'Código de recuperación enviado',
        // En desarrollo: mostrar código. En producción: enviar por email
        // NOTA: Descomenta la línea abajo solo en desarrollo
        // codigo_recuperacion: codigoRecuperacion,
        expiresIn: '30 minutos',
        email: usuario.email, // Mostrar email parcialmente para verificación
      },
    })
  } catch (error) {
    console.error('Error en forgot-password:', error)
    res.status(500).json({
      error: 'Error interno',
      message: 'Error al procesar solicitud de recuperación',
    })
  }
})

// POST /api/auth/reset-password - Restablecer contraseña con código de recuperación
router.post('/reset-password', async (req: Request, res: Response) => {
  try {
    const { codigo_recuperacion, nuevo_codigo } = req.body

    if (!codigo_recuperacion || !nuevo_codigo) {
      return res.status(400).json({
        error: 'Datos inválidos',
        message: 'Código de recuperación y nuevo código son requeridos',
      })
    }

    // Buscar usuario por código de recuperación
    const { data: usuarios, error: userError } = await supabaseAdmin
      .from('usuarios')
      .select('*')
      .eq('codigo_recuperacion', codigo_recuperacion)
      .limit(1)

    if (userError || !usuarios || usuarios.length === 0) {
      return res.status(401).json({
        error: 'Código inválido',
        message: 'El código de recuperación no es válido',
      })
    }

    const usuario = usuarios[0]

    // Verificar que el código no haya expirado
    if (usuario.codigo_recuperacion_expira) {
      const expira = new Date(usuario.codigo_recuperacion_expira)
      if (expira < new Date()) {
        return res.status(401).json({
          error: 'Código expirado',
          message: 'El código de recuperación ha expirado. Solicita uno nuevo.',
        })
      }
    }

    // Hash del nuevo código de acceso
    const nuevoCodigoHash = await bcrypt.hash(nuevo_codigo, 10)

    // Actualizar código de acceso (solo hash, NO guardar en texto plano)
    const { error: updateError } = await supabaseAdmin
      .from('usuarios')
      .update({
        codigo_acceso_hash: nuevoCodigoHash,
        codigo_recuperacion: null,
        codigo_recuperacion_expira: null,
      })
      .eq('id_usuario', usuario.id_usuario)

    if (updateError) {
      throw updateError
    }

    res.json({
      data: {
        success: true,
        message: 'Código de acceso actualizado correctamente',
      },
    })
  } catch (error) {
    console.error('Error en reset-password:', error)
    res.status(500).json({
      error: 'Error interno',
      message: 'Error al restablecer el código de acceso',
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

    // Hash del código de acceso (NO guardar en texto plano)
    const codigoHash = await bcrypt.hash(nuevoCodigo, 10)

    // Crear usuario
    const { data: usuario, error } = await supabaseAdmin
      .from('usuarios')
      .insert({
        nombre_completo,
        email,
        codigo_acceso: nuevoCodigo, // Temporalmente necesario para compatibilidad
        codigo_acceso_hash: codigoHash,
        rol: rol || 'TECNICO',
        especialidad: especialidad || null,
        puede_registrar_beneficiarios: rol === 'COORDINADOR' || rol === 'SUPER_ADMIN',
        zona_nombre: zona_nombre || null,
        activo: true,
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
