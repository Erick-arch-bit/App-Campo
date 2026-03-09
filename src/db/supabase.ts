import { createClient } from '@supabase/supabase-js'
import type { SupabaseClient } from '@supabase/supabase-js'
import config from '../config'

// Cliente público (para operaciones desde el cliente)
export const supabase: SupabaseClient = createClient(config.supabase.url, config.supabase.anonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
  },
})

// Cliente con rol de servicio (para operaciones del servidor)
export const supabaseAdmin: SupabaseClient = createClient(config.supabase.url, config.supabase.serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

// Tipos de tabla
export interface TablaUsuario {
  id_usuario: number
  nombre_completo: string
  email: string
  password_hash: string
  rol: string
  especialidad: 'AGRICOLA' | 'AGROPECUARIO' | 'ACTIVIDAD_GENERAL' | null
  puede_registrar_beneficiarios: boolean
  bloqueado_revision: boolean
  zona_nombre: string | null
  created_at: string
  updated_at: string
}

export interface TablaAsignacion {
  id_asignacion: number
  id_usuario: number
  tipo_asignacion: 'BENEFICIARIO' | 'ACTIVIDAD'
  descripcion_actividad: string | null
  fecha_limite: string
  completado: boolean
  id_beneficiario: number | null
  created_at: string
  updated_at: string
}

export interface TablaBeneficiario {
  id_beneficiario: number
  nombre: string
  paterno: string
  materno: string
  telefono: string
  municipio: string
  localidad: string
  folio: string | null
  latitud: string | null
  longitud: string | null
  cadena_productiva: string | null
  created_at: string
  updated_at: string
}

export interface TablaBitacora {
  id_bitacora: number
  id_usuario: number
  id_asignacion: number | null
  uuid_movil: string | null
  fecha_hora_inicio: string
  fecha_hora_fin: string
  latitud: number | null
  longitud: number | null
  latitud_fin: number | null
  longitud_fin: number | null
  precision_gps: number | null
  tipo_bitacora: 'BENEFICIARIO' | 'ACTIVIDAD_GENERAL'
  datos_extendidos: Record<string, any>
  dispositivo_info: Record<string, any>
  calificacion: number | null
  reporte: string | null
  firma_url: string | null
  foto_confirmacion: string | null
  sincronizado: boolean
  created_at: string
  updated_at: string
}

export interface TablaEvidencia {
  id_evidencia: number
  id_bitacora: number | null
  uuid_movil: string | null
  tipo_archivo: 'FOTO' | 'DOCUMENTO'
  url: string
  public_id: string | null
  sincronizado: boolean
  created_at: string
}
