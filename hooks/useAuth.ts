import { create } from 'zustand'
import * as SecureStore from 'expo-secure-store'
import { AuthAPI } from '@/lib/api'
import type { Usuario } from '@/types/models'

interface AuthStore {
  usuario:      Usuario | null
  token:        string | null
  cargando:     boolean
  error:        string | null
  login:        (codigoAcceso: string) => Promise<void>
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
      await SecureStore.deleteItemAsync('auth_token')
      await SecureStore.deleteItemAsync('user_data')
      set({ token: null, usuario: null })
    }
  },

  login: async (codigoAcceso) => {
    set({ cargando: true, error: null })
    try {
      const { data } = await AuthAPI.login(codigoAcceso)
      const { token, user } = data.data

      await SecureStore.setItemAsync('auth_token', token)
      await SecureStore.setItemAsync('user_data', JSON.stringify(user))

      set({ token, usuario: user, cargando: false })

      // Precargar datos en segundo plano después del login
      try {
        const { usePreload } = await import('./usePreload')
        usePreload.getState().precargarDatos()
      } catch (preloadErr) {
        console.log('Precarga en segundo plano iniciada')
      }
    } catch (err: any) {
      const msg = err.response?.data?.message ?? err.response?.data?.error ?? 'Error de conexión'
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

  limpiarAuth: () => {
    set({ usuario: null, token: null })
  },
}))
