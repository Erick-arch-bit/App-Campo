import { create } from 'zustand'
import * as SecureStore from 'expo-secure-store'
import { AuthAPI } from '@/lib/api'
import type { Usuario } from '@/types/models'

interface AuthStore {
  usuario:      Usuario | null
  token:        string | null
  cargando:     boolean
  error:        string | null
  login:        (email: string, password: string) => Promise<void>
  logout:       () => Promise<void>
  cargarSesion: () => Promise<void>
  limpiarAuth:  () => void
}

export const useAuth = create<AuthStore>((set) => ({
  usuario:  null,
  token:    null,
  cargando: false,
  error:    null,

  cargarSesion: async () => {
    try {
      const token    = await SecureStore.getItemAsync('auth_token')
      const userData = await SecureStore.getItemAsync('user_data')
      if (token && userData) {
        set({ token, usuario: JSON.parse(userData) })
      }
    } catch (err) {
      console.error('Error cargando sesión:', err)
      // Si hay error parseando, limpiar datos corruptos
      await SecureStore.deleteItemAsync('auth_token')
      await SecureStore.deleteItemAsync('user_data')
      set({ token: null, usuario: null })
    }
  },

  login: async (email, password) => {
    set({ cargando: true, error: null })
    try {
      const { data } = await AuthAPI.login(email, password)
      const { token, user } = data.data

      await SecureStore.setItemAsync('auth_token', token)
      await SecureStore.setItemAsync('user_data', JSON.stringify(user))

      set({ token, usuario: user, cargando: false })

      // Precargar datos en segundo plano después del login
      // No esperar a que termine para no bloquear la navegación
      try {
        const { usePreload } = await import('./usePreload')
        usePreload.getState().precargarDatos()
      } catch (preloadErr) {
        console.log('Precarga en segundo plano iniciada')
      }
    } catch (err: any) {
      const msg = err.response?.data?.error ?? 'Error de conexión'
      set({ error: msg, cargando: false })
    }
  },

  logout: async () => {
    await SecureStore.deleteItemAsync('auth_token')
    await SecureStore.deleteItemAsync('user_data')
    set({ usuario: null, token: null })

    // Limpiar cache de datos al cerrar sesión
    try {
      const { usePreload } = await import('./usePreload')
      await usePreload.getState().limpiarCache()
    } catch (err) {
      console.log('Cache limpiado')
    }
  },

  // Método para limpiar auth desde el interceptor 401 sin efectos secundarios async
  limpiarAuth: () => {
    set({ usuario: null, token: null })
  },
}))
