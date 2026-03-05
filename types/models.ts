// types/models.ts — Interfaces centralizadas de la aplicación

// ── Autenticación ─────────────────────────────────────────────────────
export interface Usuario {
  id_usuario:                    number
  nombre_completo:               string
  email:                         string
  rol:                           string
  especialidad:                  'AGRICOLA' | 'AGROPECUARIO' | 'ACTIVIDAD_GENERAL' | null
  puede_registrar_beneficiarios: boolean
  bloqueado_revision:            boolean
  zona_nombre:                   string | null
}

// ── Asignaciones ──────────────────────────────────────────────────────
export interface Asignacion {
  id_asignacion:          number
  tipo_asignacion:        'BENEFICIARIO' | 'ACTIVIDAD'
  descripcion_actividad:  string | null
  fecha_limite:           string
  completado:             boolean
  beneficiario_nombre:    string | null
  beneficiario_municipio: string | null
  beneficiario_localidad?: string | null
  beneficiario_folio:     string | null
  beneficiario_telefono?: string | null
  beneficiario_lat?:      string | null
  beneficiario_lng?:      string | null
  cadena_productiva:      string | null
}

// ── Beneficiarios ─────────────────────────────────────────────────────
export interface Beneficiario {
  id_beneficiario: number
  nombre_completo: string
  municipio:       string
  localidad:       string
  folio:           string
}

export interface CrearBeneficiarioPayload {
  nombre:    string
  paterno:   string
  materno:   string
  telefono:  string
  municipio: string
  localidad: string
}

// ── Bitácoras ─────────────────────────────────────────────────────────
export type TipoBitacora = 'BENEFICIARIO' | 'ACTIVIDAD_GENERAL'

export interface CrearBitacoraPayload {
  uuid_movil:        string | null
  id_asignacion:     number | null
  fecha_hora_inicio: string | undefined
  fecha_hora_fin:    string
  latitud:           number | null
  longitud:          number | null
  latitud_fin:       number
  longitud_fin:      number
  precision_gps:     number | null
  tipo_bitacora:     TipoBitacora
  datos_extendidos:  Record<string, any>
  dispositivo_info:  { plataforma: string }
}

// ── Evidencias ────────────────────────────────────────────────────────
export type TipoArchivo = 'FOTO' | 'DOCUMENTO'

// ── Respuestas de API ─────────────────────────────────────────────────
export interface ApiResponse<T> {
  data: T
  error?: string
}

export interface LoginResponse {
  token: string
  user:  Usuario
}

export interface AsignacionesResponse {
  asignaciones: Asignacion[]
}

export interface BeneficiariosResponse {
  beneficiarios: Beneficiario[]
}

export interface BitacoraCreatedResponse {
  id_bitacora: number
}

// ── Notificaciones ────────────────────────────────────────────────────
export interface NotificationSettings {
  enabled:                boolean
  nuevasAsignaciones:     boolean
  recordatoriosFechas:    boolean
  actualizacionesEstado:  boolean
  horaRecordatorio:       string
}
