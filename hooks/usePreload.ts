import { create } from 'zustand'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { AsignacionesAPI, BeneficiariosAPI } from '@/lib/api'
import type { Asignacion, Beneficiario } from '@/types/models'

interface PreloadStore {
  _asignacionSeleccionada?: Asignacion
  asignaciones:         Asignacion[]
  beneficiarios:        Beneficiario[]
  ultimaActualizacion:  Date | null
  cargando:             boolean
  error:                string | null

  precargarDatos:         () => Promise<void>
  actualizarAsignaciones: () => Promise<void>
  actualizarBeneficiarios:() => Promise<void>
  limpiarCache:           () => Promise<void>
}

const CACHE_KEY_ASIGNACIONES  = '@saderh_asignaciones_cache'
const CACHE_KEY_BENEFICIARIOS = '@saderh_beneficiarios_cache'
const CACHE_KEY_TIMESTAMP     = '@saderh_cache_timestamp'

export const usePreload = create<PreloadStore>((set, get) => ({
  _asignacionSeleccionada: undefined,
  asignaciones:        [],
  beneficiarios:       [],
  ultimaActualizacion: null,
  cargando:            false,
  error:               null,

  precargarDatos: async () => {
    set({ cargando: true, error: null })

    try {
      // Primero intentar cargar desde cache
      const cachedAsignaciones  = await AsyncStorage.getItem(CACHE_KEY_ASIGNACIONES)
      const cachedBeneficiarios = await AsyncStorage.getItem(CACHE_KEY_BENEFICIARIOS)
      const cachedTimestamp     = await AsyncStorage.getItem(CACHE_KEY_TIMESTAMP)

      if (cachedAsignaciones && cachedBeneficiarios) {
        set({
          asignaciones:        JSON.parse(cachedAsignaciones),
          beneficiarios:       JSON.parse(cachedBeneficiarios),
          ultimaActualizacion: cachedTimestamp ? new Date(cachedTimestamp) : null,
        })
      }

      // Luego descargar datos frescos del servidor
      const [asignacionesRes, beneficiariosRes] = await Promise.all([
        AsignacionesAPI.listar(true),
        BeneficiariosAPI.listar(),
      ])

      const asignaciones  = asignacionesRes.data.data.asignaciones || []
      const beneficiarios = beneficiariosRes.data.data.beneficiarios || []
      const ahora = new Date()

      // Guardar en cache
      await AsyncStorage.multiSet([
        [CACHE_KEY_ASIGNACIONES,  JSON.stringify(asignaciones)],
        [CACHE_KEY_BENEFICIARIOS, JSON.stringify(beneficiarios)],
        [CACHE_KEY_TIMESTAMP,     ahora.toISOString()],
      ])

      set({
        asignaciones,
        beneficiarios,
        ultimaActualizacion: ahora,
        cargando: false,
      })
    } catch (err: any) {
      console.error('Error precargando datos:', err)
      set({
        error: err.response?.data?.error ?? 'Error al descargar datos',
        cargando: false,
      })
    }
  },

  actualizarAsignaciones: async () => {
    try {
      // Obtener asignaciones anteriores del estado
      const asignacionesAnteriores = get().asignaciones

      const { data } = await AsignacionesAPI.listar(true)
      const asignaciones = data.data.asignaciones || []

      // Detectar nuevas asignaciones
      if (asignacionesAnteriores.length > 0) {
        const idsAnteriores = new Set(asignacionesAnteriores.map(a => a.id_asignacion))
        const nuevas = asignaciones.filter((a: Asignacion) => !idsAnteriores.has(a.id_asignacion))

        console.log(`✅ ${nuevas.length} nuevas asignaciones detectadas`)
      }

      await AsyncStorage.setItem(CACHE_KEY_ASIGNACIONES, JSON.stringify(asignaciones))
      await AsyncStorage.setItem(CACHE_KEY_TIMESTAMP, new Date().toISOString())

      set({ asignaciones, ultimaActualizacion: new Date() })
    } catch (err) {
      console.error('Error actualizando asignaciones:', err)
    }
  },

  actualizarBeneficiarios: async () => {
    try {
      const { data } = await BeneficiariosAPI.listar()
      const beneficiarios = data.data.beneficiarios || []

      await AsyncStorage.setItem(CACHE_KEY_BENEFICIARIOS, JSON.stringify(beneficiarios))
      await AsyncStorage.setItem(CACHE_KEY_TIMESTAMP, new Date().toISOString())

      set({ beneficiarios, ultimaActualizacion: new Date() })
    } catch (err) {
      console.error('Error actualizando beneficiarios:', err)
    }
  },

  limpiarCache: async () => {
    await AsyncStorage.multiRemove([
      CACHE_KEY_ASIGNACIONES,
      CACHE_KEY_BENEFICIARIOS,
      CACHE_KEY_TIMESTAMP,
    ])
    set({
      asignaciones:        [],
      beneficiarios:       [],
      ultimaActualizacion: null,
    })
  },
}))
