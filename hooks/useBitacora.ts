import { create } from 'zustand'
import * as Crypto from 'expo-crypto'
import type { TipoBitacora } from '@/types/models'

// Interfaz para imagen con comentario
interface ImagenEvidencia {
  uri: string
  comentario: string
}

interface BitacoraStore {
  // Datos de la bitácora activa
  uuid_movil:         string | null
  id_asignacion:      number | null
  tipo_bitacora:      TipoBitacora
  fecha_hora_inicio:  Date | null
  fecha_hora_fin:     Date | null
  latitud_inicio:     number | null
  longitud_inicio:    number | null
  latitud_fin:        number | null
  longitud_fin:       number | null
  // Formulario
  datos_extendidos:   Record<string, any>
  imagenes:           ImagenEvidencia[]   // URIs locales con comentarios
  reporte:            string
  calificacion:       number               // 1-5 estrellas
  firma_url:          string | null        // URL Cloudinary
  foto_confirmacion:  string | null        // URL Cloudinary - selfie del beneficiario

  // Acciones
  iniciarBitacora:    (id_asignacion: number | null, tipo: TipoBitacora, lat: number, lng: number) => void
  finalizarBitacora:  (lat: number, lng: number) => void
  setDatos:           (datos: Partial<BitacoraStore>) => void
  agregarImagen:      (uri: string, comentario?: string) => void
  actualizarComentario: (uri: string, comentario: string) => void
  quitarImagen:       (uri: string) => void
  reset:              () => void
}

const estadoInicial = {
  uuid_movil:        null as string | null,
  id_asignacion:     null as number | null,
  tipo_bitacora:     'BENEFICIARIO' as TipoBitacora,
  fecha_hora_inicio: null as Date | null,
  fecha_hora_fin:    null as Date | null,
  latitud_inicio:    null as number | null,
  longitud_inicio:   null as number | null,
  latitud_fin:       null as number | null,
  longitud_fin:      null as number | null,
  datos_extendidos:  {} as Record<string, any>,
  imagenes:          [] as ImagenEvidencia[],
  reporte:           '',
  calificacion:      0,
  firma_url:         null as string | null,
  foto_confirmacion: null as string | null,
}

export const useBitacora = create<BitacoraStore>((set, get) => ({
  ...estadoInicial,

  iniciarBitacora: (id_asignacion, tipo, lat, lng) => {
    set({
      uuid_movil:        Crypto.randomUUID(),
      id_asignacion,
      tipo_bitacora:     tipo,
      fecha_hora_inicio: new Date(),
      latitud_inicio:    lat,
      longitud_inicio:   lng,
    })
  },

  finalizarBitacora: (lat, lng) => {
    set({ fecha_hora_fin: new Date(), latitud_fin: lat, longitud_fin: lng })
  },

  setDatos: (datos) => set((state) => ({ ...state, ...datos })),

  agregarImagen: (uri, comentario = '') =>
    set((state) => ({ imagenes: [...state.imagenes, { uri, comentario }] })),

  actualizarComentario: (uri, comentario) =>
    set((state) => ({
      imagenes: state.imagenes.map(img => 
        img.uri === uri ? { ...img, comentario } : img
      )
    })),

  quitarImagen: (uri) =>
    set((state) => ({ imagenes: state.imagenes.filter(i => i.uri !== uri) })),

  reset: () => set(estadoInicial),
}))
