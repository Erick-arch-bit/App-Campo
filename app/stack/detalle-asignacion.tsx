import { useEffect, useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Platform } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import MapView, { Marker } from 'react-native-maps'
import * as Location from 'expo-location'
import { Ionicons } from '@expo/vector-icons'
import { Colors } from '@/constants/Colors'
import { useBitacora } from '@/hooks/useBitacora'
import { usePreload } from '@/hooks/usePreload'
import type { Asignacion } from '@/types/models'

export default function DetalleAsignacionScreen() {
  const params     = useLocalSearchParams()
  const router     = useRouter()
  const { iniciarBitacora } = useBitacora()
  const { asignaciones } = usePreload()

  const [ubicacion, setUbicacion] = useState<{ lat: number; lng: number } | null>(null)
  const [cargandoGPS, setCargandoGPS] = useState(true)

  // Falla 3 + 9: Obtener la asignación desde el store en lugar de parsear JSON de params
  const item: Asignacion | null = (() => {
    // Normalizar params.id a string (puede ser string | string[])
    const idParam = Array.isArray(params.id) ? params.id[0] : params.id
    
    // Primero intentar obtener del estado temporal del store
    const seleccionada = usePreload.getState()._asignacionSeleccionada as Asignacion | undefined
    if (seleccionada && String(seleccionada.id_asignacion) === idParam) {
      return seleccionada
    }
    // Fallback: buscar en la lista de asignaciones por ID
    const id = Number(idParam)
    if (!isNaN(id)) {
      return asignaciones.find(a => a.id_asignacion === id) ?? null
    }
    return null
  })()

  const esBeneficiario = item?.tipo_asignacion === 'BENEFICIARIO'
  // Coordenadas del predio - usar objeto anidado o campos planos (legacy)
  const latPredio = item?.beneficiario?.latitud 
    ? parseFloat(item.beneficiario.latitud) 
    : item?.beneficiario_lat 
      ? parseFloat(item.beneficiario_lat) 
      : null
  const lngPredio = item?.beneficiario?.longitud 
    ? parseFloat(item.beneficiario.longitud) 
    : item?.beneficiario_lng 
      ? parseFloat(item.beneficiario_lng) 
      : null

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status !== 'granted') { setCargandoGPS(false); return }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High })
      setUbicacion({ lat: loc.coords.latitude, lng: loc.coords.longitude })
      setCargandoGPS(false)
    })()
  }, [])

  // Si no se encontró la asignación, mostrar error
  if (!item) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={64} color={Colors.warning} />
        <Text style={styles.errorTitulo}>Asignación no encontrada</Text>
        <Text style={styles.errorMensaje}>
          No se pudo cargar la información de esta asignación.
        </Text>
        <TouchableOpacity style={styles.botonVolver} onPress={() => router.back()}>
          <Text style={styles.botonVolverTexto}>Volver</Text>
        </TouchableOpacity>
      </View>
    )
  }

  const comenzarBitacora = async () => {
    if (!ubicacion) return

    iniciarBitacora(
      item.id_asignacion,
      esBeneficiario ? 'BENEFICIARIO' : 'ACTIVIDAD_GENERAL',
      ubicacion.lat,
      ubicacion.lng
    )

    router.push({
      pathname: '/stack/formulario-bitacora',
      params: { asignacionId: String(item.id_asignacion), nombre: item.beneficiario_nombre ?? item.descripcion_actividad ?? '' },
    })
  }

  const coordsMapa = latPredio && lngPredio
    ? { latitude: latPredio, longitude: lngPredio }
    : ubicacion
    ? { latitude: ubicacion.lat, longitude: ubicacion.lng }
    : { latitude: 20.0911, longitude: -98.7624 } // Centro Hidalgo

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>

        {/* Header con tipo */}
        <View style={styles.tipoBadge}>
          <Text style={styles.tipoTexto}>
            {esBeneficiario ? '🌾 Visita a Beneficiario' : '⚙️ Actividad General'}
          </Text>
        </View>

        {/* Nombre principal */}
        <Text style={styles.nombre}>
          {esBeneficiario ? item.beneficiario_nombre : item.descripcion_actividad}
        </Text>

        {/* Folio */}
        {item.beneficiario_folio && (
          <View style={styles.folioRow}>
            <Ionicons name="document-text-outline" size={16} color={Colors.dorado} />
            <Text style={styles.folioTexto}>Folio SADERH: {item.beneficiario_folio}</Text>
          </View>
        )}

        {/* Datos adicionales */}
        <View style={styles.datosCard}>
          {item.beneficiario_municipio && (
            <View style={styles.datoRow}>
              <Ionicons name="location-outline" size={16} color={Colors.guinda} />
              <Text style={styles.datoTexto}>{item.beneficiario_municipio}{item.beneficiario_localidad ? `, ${item.beneficiario_localidad}` : ''}</Text>
            </View>
          )}
          {item.beneficiario_telefono && (
            <View style={styles.datoRow}>
              <Ionicons name="call-outline" size={16} color={Colors.guinda} />
              <Text style={styles.datoTexto}>{item.beneficiario_telefono}</Text>
            </View>
          )}
          {item.cadena_productiva && (
            <View style={styles.datoRow}>
              <Ionicons name="leaf-outline" size={16} color={Colors.guinda} />
              <Text style={styles.datoTexto}>{item.cadena_productiva}</Text>
            </View>
          )}
          <View style={styles.datoRow}>
            <Ionicons name="calendar-outline" size={16} color={Colors.guinda} />
            <Text style={styles.datoTexto}>
              Límite: {new Date(item.fecha_limite).toLocaleDateString('es-MX')}
            </Text>
          </View>
        </View>

        {/* Mapa - Solo en plataformas nativas */}
        <Text style={styles.mapaLabel}>Ubicación del predio</Text>
        <View style={styles.mapaContainer}>
          {Platform.OS !== 'web' ? (
            <MapView
              style={styles.mapa}
              initialRegion={{ ...coordsMapa, latitudeDelta: 0.01, longitudeDelta: 0.01 }}
            >
              <Marker coordinate={coordsMapa} title={item.beneficiario_nombre ?? 'Ubicación'} />
            </MapView>
          ) : (
            <View style={styles.mapaWeb}>
              <Ionicons name="map-outline" size={48} color={Colors.guinda} />
              <Text style={styles.mapaWebTexto}>El mapa está disponible en la app móvil</Text>
              <Text style={styles.mapaWebCoords}>
                Lat: {coordsMapa.latitude.toFixed(6)}, Lng: {coordsMapa.longitude.toFixed(6)}
              </Text>
            </View>
          )}
        </View>

        {/* Espacio para el botón fijo */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Botón fijo al fondo */}
      <View style={styles.botonContainer}>
        <TouchableOpacity
          style={[styles.botonComenzar, (!ubicacion || cargandoGPS) && styles.botonDisabled]}
          onPress={comenzarBitacora}
          disabled={!ubicacion || cargandoGPS}
          activeOpacity={0.85}
        >
          <Ionicons name="play-circle" size={22} color={Colors.blanco} />
          <Text style={styles.botonTexto}>
            {cargandoGPS ? 'Obteniendo ubicación...' : 'Comenzar Bitácora'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container:     { flex: 1, backgroundColor: Colors.fondoApp },
  scroll:        { flex: 1 },
  scrollContent: { padding: 20, gap: 14 },

  // Error state
  errorContainer: {
    flex: 1, backgroundColor: Colors.fondoApp,
    justifyContent: 'center', alignItems: 'center',
    padding: 32, gap: 16,
  },
  errorTitulo:  { fontSize: 20, fontWeight: '800', color: Colors.textoMain },
  errorMensaje: { fontSize: 14, color: Colors.textoSecundario, textAlign: 'center' },
  botonVolver:  {
    backgroundColor: Colors.guinda, borderRadius: 12,
    paddingVertical: 12, paddingHorizontal: 24,
  },
  botonVolverTexto: { color: Colors.blanco, fontWeight: '700', fontSize: 15 },

  tipoBadge:     {
    backgroundColor: Colors.guinda50, borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 6, alignSelf: 'flex-start',
  },
  tipoTexto:     { color: Colors.guinda, fontWeight: '700', fontSize: 13 },

  nombre:        { fontSize: 24, fontWeight: '800', color: Colors.textoMain, lineHeight: 30 },

  folioRow:      { flexDirection: 'row', alignItems: 'center', gap: 8 },
  folioTexto:    { fontSize: 14, color: Colors.doradoDark, fontWeight: '600' },

  datosCard:     {
    backgroundColor: Colors.blanco, borderRadius: 12, padding: 16,
    gap: 12, borderWidth: 1, borderColor: Colors.borde,
  },
  datoRow:       { flexDirection: 'row', alignItems: 'center', gap: 10 },
  datoTexto:     { fontSize: 14, color: Colors.textoSecundario, flex: 1 },

  mapaLabel:     { fontSize: 15, fontWeight: '700', color: Colors.textoMain },
  mapaContainer: {
    borderRadius: 12, overflow: 'hidden',
    borderWidth: 1, borderColor: Colors.borde, height: 220,
  },
  mapa:          { flex: 1 },
  mapaWeb:       {
    flex: 1, justifyContent: 'center', alignItems: 'center',
    backgroundColor: Colors.fondoApp, gap: 8, padding: 20,
  },
  mapaWebTexto:  { fontSize: 14, color: Colors.textoSecundario, textAlign: 'center' },
  mapaWebCoords: { fontSize: 12, color: Colors.textoSecundario, fontFamily: Platform.OS === 'web' ? 'monospace' : undefined },

  botonContainer:{
    position: 'absolute', bottom: 0, left: 0, right: 0,
    padding: 20, backgroundColor: Colors.blanco,
    borderTopWidth: 1, borderTopColor: Colors.borde,
  },
  botonComenzar: {
    backgroundColor: Colors.guinda, borderRadius: 14,
    padding: 16, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center', gap: 10,
  },
  botonDisabled: { opacity: 0.5 },
  botonTexto:    { color: Colors.blanco, fontSize: 16, fontWeight: '700' },
})
