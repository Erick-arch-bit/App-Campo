import axios from 'axios'
import * as SecureStore from 'expo-secure-store'
import Constants from 'expo-constants'
import { Platform } from 'react-native'
import type {
  CrearBeneficiarioPayload,
  CrearBitacoraPayload,
  ApiResponse,
  LoginResponse,
  AsignacionesResponse,
  BeneficiariosResponse,
  BitacoraCreatedResponse,
} from '@/types/models'

const DEFAULT_API_PORT = '3001'

const normalizeApiUrl = (url: string) => {
  // Android emulator cannot access localhost of the host machine directly.
  if (Platform.OS === 'android' && /localhost|127\.0\.0\.1/.test(url)) {
    return url.replace(/localhost|127\.0\.0\.1/g, '10.0.2.2')
  }
  return url
}

const getDevHostFromExpo = () => {
  const hostUri =
    Constants.expoConfig?.hostUri ||
    (Constants.manifest2 as any)?.extra?.expoGo?.debuggerHost ||
    (Constants.manifest as any)?.debuggerHost

  if (!hostUri) return undefined
  return hostUri.split(':')[0]
}

const buildFallbackBaseUrl = () => {
  if (__DEV__) {
    const expoHost = getDevHostFromExpo()
    if (expoHost) return `http://${expoHost}:${DEFAULT_API_PORT}`

    if (Platform.OS === 'android') return `http://10.0.2.2:${DEFAULT_API_PORT}`
    return `http://localhost:${DEFAULT_API_PORT}`
  }

  return undefined
}

const resolveBaseUrl = () => {
  // @ts-ignore - Expo injects EXPO_PUBLIC_* at runtime
  const envUrl = process.env.EXPO_PUBLIC_API_URL?.trim()
  if (envUrl) return normalizeApiUrl(envUrl)

  const fallback = buildFallbackBaseUrl()
  if (fallback) {
    console.warn(`EXPO_PUBLIC_API_URL no configurada. Usando fallback: ${fallback}`)
    return fallback
  }

  console.error('CRITICAL: EXPO_PUBLIC_API_URL no está configurada en el archivo .env')
  return ''
}

const BASE_URL = resolveBaseUrl()

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
  login: (codigoAcceso: string) =>
    api.post<ApiResponse<LoginResponse>>('/api/auth/login', { codigo_acceso: codigoAcceso, source: 'app' }),
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
