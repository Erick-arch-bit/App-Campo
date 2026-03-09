/**
 * API Configuration
 * Centralized API client with all endpoints
 */

import axios from 'axios'
import * as SecureStore from 'expo-secure-store'

// Base URL - Vercel
const BASE_URL = 'https://web-campo.vercel.app'

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
    api.post('/api/app/auth/login', { codigo_acceso: codigoAcceso }),
}

// ── Perfil Endpoints ───────────────────────────────────────────────────

export const PerfilAPI = {
  obtener: () => api.get('/api/app/perfil'),
}

// ── Asignaciones Endpoints ─────────────────────────────────────────────

export const AsignacionesAPI = {
  listar: (soloActivas = true) =>
    api.get(`/api/app/asignaciones?activas=${soloActivas}`),
  
  completar: (id: number) =>
    api.post(`/api/app/asignaciones/${id}/completar`),
}

// ── Beneficiarios Endpoints ────────────────────────────────────────────

export const BeneficiariosAPI = {
  listar: (search?: string) => 
    api.get(search ? `/api/app/beneficiarios?search=${search}` : '/api/app/beneficiarios'),
  
  crear: (datos: any) => api.post('/api/app/beneficiarios', datos),
}

// ── Bitácoras Endpoints ─────────────────────────────────────────────────

export const BitacorasAPI = {
  crear: (datos: any) => api.post('/api/app/bitacoras', datos),
  
  listar: () => api.get('/api/app/bitacoras'),
}

// ── Evidencias Endpoints ────────────────────────────────────────────────

export const EvidenciasAPI = {
  subir: (formData: FormData) =>
    api.post('/api/app/evidencias', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
}

// ── Sync Endpoints (Offline Mode) ───────────────────────────────────────

export const SyncAPI = {
  bitacoras: (registros: any[]) =>
    api.post('/api/sync/bitacoras', { registros }),
  
  beneficiarios: (registros: any[]) =>
    api.post('/api/sync/beneficiarios', { registros }),
  
  estado: () => api.get('/api/sync/estado'),
}

export default api
