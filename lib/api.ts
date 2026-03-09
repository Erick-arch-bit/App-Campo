/**
 * API Configuration
 * Centralized API client with all endpoints
 */

import axios from 'axios'
import * as SecureStore from 'expo-secure-store'

// Base URL - Vercel API
const BASE_URL = 'https://web-campo.vercel.app/api'

// Create axios instance
export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
})

// Inject JWT token automatically in each request
api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('auth_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Handle 401 globally - clean session
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    if (error.response?.status === 401) {
      await SecureStore.deleteItemAsync('auth_token')
      await SecureStore.deleteItemAsync('user_data')
      try {
        const { useAuth } = await import('@/hooks/useAuth')
        useAuth.getState().limpiarAuth()
      } catch (e) {
        console.error('Error cleaning auth state:', e)
      }
    }
    return Promise.reject(error)
  }
)

// ── Auth Endpoints ────────────────────────────────────────────────────────

export const AuthAPI = {
  login: (codigoAcceso: string) =>
    api.post('/app/auth/login', { codigo_acceso: codigoAcceso }),
}

// ── Perfil Endpoints ───────────────────────────────────────────────────

export const PerfilAPI = {
  obtener: () => api.get('/app/perfil'),
}

// ── Asignaciones Endpoints ─────────────────────────────────────────────

export const AsignacionesAPI = {
  listar: (soloActivas = true) =>
    api.get(`/app/asignaciones?activas=${soloActivas}`),
  
  completar: (id: number) =>
    api.post(`/app/asignaciones/${id}/completar`),
}

// ── Beneficiarios Endpoints ────────────────────────────────────────────

export const BeneficiariosAPI = {
  listar: (search?: string) => 
    api.get(search ? `/app/beneficiarios?search=${search}` : '/app/beneficiarios'),
  
  crear: (datos: any) => api.post('/app/beneficiarios', datos),
}

// ── Bitácoras Endpoints ─────────────────────────────────────────────────

export const BitacorasAPI = {
  crear: (datos: any) => api.post('/app/bitacoras', datos),
  
  listar: () => api.get('/app/bitacoras'),
}

// ── Evidencias Endpoints ────────────────────────────────────────────────

export const EvidenciasAPI = {
  subir: (formData: FormData) =>
    api.post('/app/evidencias', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
}

// ── Sync Endpoints (Offline Mode) ───────────────────────────────────────

export const SyncAPI = {
  bitacoras: (registros: any[]) =>
    api.post('/sync/bitacoras', { registros }),
  
  beneficiarios: (registros: any[]) =>
    api.post('/sync/beneficiarios', { registros }),
  
  estado: () => api.get('/sync/estado'),
}

export default api
