import AsyncStorage from '@react-native-async-storage/async-storage'
import { create } from 'zustand'
import type { NotificationSettings } from '@/types/models'

interface NotificationStore {
  settings:                       NotificationSettings
  expoPushToken:                  string | null
  notificationPermission:         boolean
  inicializarNotificaciones:      () => Promise<void>
  solicitarPermisos:              () => Promise<boolean>
  guardarConfiguracion:           (settings: Partial<NotificationSettings>) => Promise<void>
  enviarNotificacionLocal:        (titulo: string, cuerpo: string, data?: any) => Promise<void>
  programarRecordatoriosDiarios:  () => Promise<void>
  cancelarTodosLosRecordatorios:  () => Promise<void>
}

const SETTINGS_KEY = '@saderh_notification_settings'

const DEFAULT_SETTINGS: NotificationSettings = {
  enabled:               false,
  nuevasAsignaciones:    false,
  recordatoriosFechas:   false,
  actualizacionesEstado: false,
  horaRecordatorio:      '09:00',
}

export const useNotifications = create<NotificationStore>((set, get) => ({
  settings:                DEFAULT_SETTINGS,
  expoPushToken:           null,
  notificationPermission:  false,

  inicializarNotificaciones: async () => {
    try {
      const settingsJson = await AsyncStorage.getItem(SETTINGS_KEY)
      if (settingsJson) {
        set({ settings: JSON.parse(settingsJson) })
      }
      set({ notificationPermission: false, expoPushToken: null })
    } catch (error) {
      console.error('Error inicializando configuración local:', error)
    }
  },

  solicitarPermisos: async () => {
    // TODO: Implementar con expo-notifications cuando se integre
    set({ notificationPermission: false, expoPushToken: null })
    return false
  },

  guardarConfiguracion: async (newSettings) => {
    const settings = { ...get().settings, ...newSettings }
    set({ settings })
    await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
  },

  // TODO: Implementar con expo-notifications
  enviarNotificacionLocal: async (_titulo: string, _cuerpo: string, _data?: any) => {
    console.warn('enviarNotificacionLocal: No implementado aún')
  },
  programarRecordatoriosDiarios: async () => {
    console.warn('programarRecordatoriosDiarios: No implementado aún')
  },
  cancelarTodosLosRecordatorios: async () => {
    console.warn('cancelarTodosLosRecordatorios: No implementado aún')
  },
}))

export function useNotificationObserver() {
  // TODO: Implementar observer de notificaciones
}

export const notificacionUtils = {
  nuevaAsignacion:           async () => { /* TODO */ },
  fechaLimiteProxima:        async () => { /* TODO */ },
  cambioEstado:              async () => { /* TODO */ },
  sincronizacionCompletada:  async () => { /* TODO */ },
  errorSincronizacion:       async () => { /* TODO */ },
}
