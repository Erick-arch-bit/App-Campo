import { create } from 'zustand'
import * as SecureStore from 'expo-secure-store'
import { AuthAPI } from '@/lib/api'

interface Usuario {
  id_usuario: number
  nombre_completo: string
  email: string
  rol: string
  especialidad?: string
  puede_registrar_beneficiarios?: boolean
}

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
      const response = await AuthAPI.login(codigoAcceso)
      const data = response.data

      // La respuesta ahora tiene: success, rol, user, token
      if (data.success) {
        const user = data.user
        const token = data.token || ''

        await SecureStore.setItemAsync('auth_token', token)
        await SecureStore.setItemAsync('user_data', JSON.stringify(user))

        set({ token, usuario: user, cargando: false })

        // Precargar datos en segundo plano
        try {
          const { usePreload } = await import('./usePreload')
          usePreload.getState().precargarDatos()
        } catch (preloadErr) {
          console.log('Precarga iniciada')
        }
      } else {
        set({ error: 'Credenciales inválidas', cargando: false })
      }
    } catch (err: any) {
      console.error('Error login:', err)
      const msg = err.response?.data?.message ?? err.response?.data?.error ?? err.message ?? 'Error de conexión'
      set({ error: msg, cargando: false })
    }
  },

  logout: async () => {
    await SecureStore.deleteItemAsync('auth_token')
    await SecureStore.deleteItemAsync('user_data')
    set({ usuario: null, token: null })

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
