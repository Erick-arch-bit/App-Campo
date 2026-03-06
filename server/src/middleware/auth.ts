import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET_APP || ''

export interface AuthRequest extends Request {
  usuario?: {
    id_usuario: number
    codigo_acceso: string
    nombre_completo: string
    rol: string
    especialidad: string | null
    puede_registrar_beneficiarios: boolean
    zona_nombre: string | null
  }
}

// Middleware para verificar el token JWT
export const autenticar = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'No autorizado',
      message: 'Token de autenticación requerido',
    })
  }

  const token = authHeader.substring(7)

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any
    
    req.usuario = {
      id_usuario: decoded.id_usuario,
      codigo_acceso: decoded.codigo_acceso,
      nombre_completo: decoded.nombre_completo,
      rol: decoded.rol,
      especialidad: decoded.especialidad,
      puede_registrar_beneficiarios: decoded.puede_registrar_beneficiarios,
      zona_nombre: decoded.zona_nombre,
    }

    next()
  } catch (error) {
    return res.status(401).json({
      error: 'No autorizado',
      message: 'Token inválido o expirado',
    })
  }
}

// Middleware para verificar rol de administrador
export const requiereAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.usuario?.rol !== 'SUPER_ADMIN' && req.usuario?.rol !== 'ADMIN') {
    return res.status(403).json({
      error: 'Prohibido',
      message: 'Se requiere rol de administrador',
    })
  }
  next()
}

// Middleware para verificar que el usuario puede registrar beneficiarios
export const requierePermisoBeneficiarios = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.usuario?.puede_registrar_beneficiarios) {
    return res.status(403).json({
      error: 'Prohibido',
      message: 'No tienes permiso para registrar beneficiarios',
    })
  }
  next()
}

// Generar token JWT (v2.0 - usa código de acceso)
export const generarToken = (payload: {
  id_usuario: number
  codigo_acceso: string
  nombre_completo: string
  rol: string
  especialidad: string | null
  puede_registrar_beneficiarios: boolean
  zona_nombre: string | null
}): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' })
}
