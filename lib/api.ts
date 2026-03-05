import axios from 'axios'
import * as SecureStore from 'expo-secure-store'
import type {
  CrearBeneficiarioPayload,
  CrearBitacoraPayload,
  ApiResponse,
  LoginResponse,
  AsignacionesResponse,
  BeneficiariosResponse,
  BitacoraCreatedResponse,
} from '@/types/models'

// URL del API - DEBE configurarse en .env
// @ts-ignore - Expo defines process.env.EXPO_PUBLIC_* at runtime
const BASE_URL = process.env.EXPO_PUBLIC_API_URL

if (!BASE_URL) {
  console.error('CRITICAL: EXPO_PUBLIC_API_URL no está configurada en el archivo .env')
}

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
})

// Inyectar JWT automáticamente en cada request
api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('auth_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Manejar 401 globalmente → limpiar sesión Y estado de Zustand
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    if (error.response?.status === 401) {
      // Limpiar storage
      await SecureStore.deleteItemAsync('auth_token')
      await SecureStore.deleteItemAsync('user_data')

      // Limpiar estado de Zustand para que el auth guard redirija
      try {
        const { useAuth } = await import('@/hooks/useAuth')
        useAuth.getState().limpiarAuth()
      } catch (e) {
        console.error('Error limpiando auth state en interceptor:', e)
      }
    }
    return Promise.reject(error)
  }
)

// ── Funciones de la API ───────────────────────────────────────────────

export const AuthAPI = {
  login: (email: string, password: string) =>
    api.post<ApiResponse<LoginResponse>>('/api/auth/login', { email, password, source: 'app' }),
}

export const PerfilAPI = {
  obtener: () => api.get('/api/app/perfil'),
}

export const AsignacionesAPI = {
  listar: (soloActivas = true) =>
    api.get<ApiResponse<AsignacionesResponse>>(`/api/app/asignaciones?activas=${soloActivas}`),
  completar: (id: number) =>
    api.post(`/api/app/asignaciones/${id}/completar`),
}

export const BeneficiariosAPI = {
  listar: () =>
    api.get<ApiResponse<BeneficiariosResponse>>('/api/app/beneficiarios'),
  crear: (datos: CrearBeneficiarioPayload) =>
    api.post('/api/app/beneficiarios', datos),
}

export const BitacorasAPI = {
  crear: (datos: CrearBitacoraPayload) =>
    api.post<ApiResponse<BitacoraCreatedResponse>>('/api/app/bitacoras', datos),
  historial: () =>
    api.get('/api/app/bitacoras'),
}

export const EvidenciasAPI = {
  subir: (formData: FormData) =>
    api.post('/api/app/evidencias', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
}

export const SyncAPI = {
  bitacoras: (registros: CrearBitacoraPayload[]) =>
    api.post('/api/sync/bitacoras', { registros }),
  beneficiarios: (registros: CrearBeneficiarioPayload[]) =>
    api.post('/api/sync/beneficiarios', { registros }),
}
