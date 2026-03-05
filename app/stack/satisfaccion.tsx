import { useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { Colors } from '@/constants/Colors'
import { useBitacora } from '@/hooks/useBitacora'
import { BitacorasAPI, EvidenciasAPI } from '@/lib/api'
import * as Location from 'expo-location'

export default function SatisfaccionScreen() {
  const router   = useRouter()
  const bitacora = useBitacora()
  const { calificacion, firma_url, setDatos, finalizarBitacora, reset } = bitacora

  const [guardando, setGuardando] = useState(false)

  const seleccionarEstrella = (n: number) => setDatos({ calificacion: n })

  const irAFirma = () => {
    if (calificacion === 0) {
      Alert.alert('Calificación requerida', 'Por favor califica la atención antes de firmar')
      return
    }
    router.push('/stack/firma')
  }

  const finalizarBitacoraCompleta = async () => {
    if (calificacion === 0) {
      Alert.alert('Calificación requerida', 'Selecciona una calificación')
      return
    }
    if (!firma_url) {
      Alert.alert('Firma requerida', 'El beneficiario debe firmar antes de finalizar')
      return
    }

    setGuardando(true)
    try {
      // Extraer estado actual ANTES de actualizar
      const currentState = useBitacora.getState()

      // Obtener coordenadas de cierre
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High })

      // Actualizar store con coordenadas de cierre
      finalizarBitacora(loc.coords.latitude, loc.coords.longitude)

      // Crear la bitácora en el servidor usando valores del estado
      const { data } = await BitacorasAPI.crear({
        uuid_movil:        currentState.uuid_movil,
        id_asignacion:     currentState.id_asignacion,
        fecha_hora_inicio: currentState.fecha_hora_inicio?.toISOString(),
        fecha_hora_fin:    new Date().toISOString(),
        latitud:           currentState.latitud_inicio,
        longitud:          currentState.longitud_inicio,
        latitud_fin:       loc.coords.latitude,
        longitud_fin:      loc.coords.longitude,
        precision_gps:     loc.coords.accuracy,
        tipo_bitacora:     currentState.tipo_bitacora,
        datos_extendidos: {
          ...currentState.datos_extendidos,
          calificacion:   currentState.calificacion,
          firma_url:      currentState.firma_url,
          reporte:        currentState.reporte,
        },
        dispositivo_info: { plataforma: 'expo' },
      })

      const id_bitacora = data.data.id_bitacora

      // Subir imágenes a Cloudinary
      for (const uri of currentState.imagenes) {
        const formData = new FormData()
        formData.append('id_bitacora', String(id_bitacora))
        formData.append('tipo_archivo', 'FOTO')
        formData.append('archivo', { uri, name: 'evidencia.jpg', type: 'image/jpeg' } as any)
        await EvidenciasAPI.subir(formData)
      }

      Alert.alert(
        '✅ Bitácora finalizada',
        'La visita ha sido registrada correctamente.',
        [{ text: 'Aceptar', onPress: () => { reset(); router.replace('/tabs/dashboard') } }]
      )

    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.error ?? 'No se pudo guardar. Revisa tu conexión.')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.contenido}>

        {/* Ícono de éxito */}
        <View style={styles.iconoContainer}>
          <Ionicons name="checkmark-circle" size={72} color={Colors.success} />
        </View>

        <Text style={styles.titulo}>Evaluación de la visita</Text>
        <Text style={styles.subtitulo}>
          Por favor califica la atención recibida
        </Text>

        {/* Estrellas */}
        <View style={styles.estrellasContainer}>
          {[1, 2, 3, 4, 5].map(n => (
            <TouchableOpacity
              key={n}
              onPress={() => seleccionarEstrella(n)}
              activeOpacity={0.7}
              style={styles.estrellaBtn}
            >
              <Ionicons
                name={calificacion >= n ? 'star' : 'star-outline'}
                size={44}
                color={calificacion >= n ? Colors.dorado : Colors.borde}
              />
            </TouchableOpacity>
          ))}
        </View>

        {calificacion > 0 && (
          <Text style={styles.calificacionTexto}>
            {['', 'Muy malo', 'Malo', 'Regular', 'Bueno', 'Excelente'][calificacion]}
          </Text>
        )}

        {/* Card de firma */}
        <TouchableOpacity
          style={[styles.firmaCard, firma_url && styles.firmaCardFirmada]}
          onPress={irAFirma}
          activeOpacity={0.8}
        >
          {firma_url ? (
            <>
              <Ionicons name="checkmark-circle" size={28} color={Colors.success} />
              <View style={styles.firmaInfo}>
                <Text style={styles.firmaTitulo}>Firma registrada ✅</Text>
                <Text style={styles.firmaSubtitulo}>Toca para volver a firmar</Text>
              </View>
            </>
          ) : (
            <>
              <Ionicons name="create-outline" size={28} color={Colors.guinda} />
              <View style={styles.firmaInfo}>
                <Text style={[styles.firmaTitulo, { color: Colors.guinda }]}>
                  Firma del beneficiario
                </Text>
                <Text style={styles.firmaSubtitulo}>Toca aquí para firmar</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={Colors.textoPlaceholder} />
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Botón finalizar */}
      <View style={styles.botonContainer}>
        <TouchableOpacity
          style={[
            styles.botonFinalizar,
            (guardando || calificacion === 0 || !firma_url) && styles.botonDisabled,
          ]}
          onPress={finalizarBitacoraCompleta}
          disabled={guardando || calificacion === 0 || !firma_url}
          activeOpacity={0.85}
        >
          {guardando
            ? <ActivityIndicator color={Colors.blanco} />
            : <>
                <Ionicons name="flag-outline" size={22} color={Colors.blanco} />
                <Text style={styles.botonTexto}>Finalizar Bitácora</Text>
              </>
          }
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: Colors.fondoApp },
  contenido:    { flex: 1, padding: 24, alignItems: 'center', gap: 20, justifyContent: 'center' },

  iconoContainer: { marginBottom: 4 },
  titulo:       { fontSize: 24, fontWeight: '800', color: Colors.textoMain, textAlign: 'center' },
  subtitulo:    { fontSize: 14, color: Colors.textoSecundario, textAlign: 'center' },

  estrellasContainer: { flexDirection: 'row', gap: 8, marginVertical: 8 },
  estrellaBtn:  { padding: 4 },
  calificacionTexto: {
    fontSize: 16, fontWeight: '700', color: Colors.doradoDark,
  },

  firmaCard:    {
    width: '100%', flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.blanco, borderRadius: 14, padding: 18,
    borderWidth: 1.5, borderColor: Colors.borde,
    gap: 14, marginTop: 8,
  },
  firmaCardFirmada: { borderColor: Colors.success, backgroundColor: Colors.successBg },
  firmaInfo:    { flex: 1 },
  firmaTitulo:  { fontSize: 15, fontWeight: '700', color: Colors.textoMain },
  firmaSubtitulo:{ fontSize: 12, color: Colors.textoSecundario, marginTop: 2 },

  botonContainer:{
    padding: 20, backgroundColor: Colors.blanco,
    borderTopWidth: 1, borderTopColor: Colors.borde,
  },
  botonFinalizar:{
    backgroundColor: Colors.guinda, borderRadius: 14,
    padding: 16, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center', gap: 10,
  },
  botonDisabled: { opacity: 0.4 },
  botonTexto:   { color: Colors.blanco, fontSize: 16, fontWeight: '700' },
})
