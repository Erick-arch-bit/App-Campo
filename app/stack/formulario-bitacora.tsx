import { useState } from 'react'
import {
  View, Text, TextInput, ScrollView, TouchableOpacity,
  StyleSheet, Image, Alert, ActivityIndicator,
} from 'react-native'
import { useRouter, useLocalSearchParams } from 'expo-router'
import * as ImagePicker from 'expo-image-picker'
import { Ionicons } from '@expo/vector-icons'
import { Colors } from '@/constants/Colors'
import { useBitacora } from '@/hooks/useBitacora'

const TIPOS_ACTIVIDAD = [
  'Visita técnica', 'Diagnóstico', 'Asesoría', 'Entrega de insumos',
  'Capacitación', 'Supervisión', 'Otro',
]

export default function FormularioBitacoraScreen() {
  const router    = useRouter()
  const params    = useLocalSearchParams()
  const { setDatos, agregarImagen, quitarImagen, imagenes, reporte } = useBitacora()

  const [tipoActividad,  setTipoActividad]  = useState('')
  const [observaciones,  setObservaciones]  = useState(reporte)
  const [hectareas,      setHectareas]      = useState('')
  const [productos,      setProductos]      = useState('')
  const [subiendo,       setSubiendo]       = useState(false)

  const seleccionarImagen = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (status !== 'granted') {
      Alert.alert('Permiso requerido', 'Necesitamos acceso a tu galería')
      return
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      allowsMultipleSelection: true,
    })
    if (!result.canceled) {
      result.assets.forEach(a => agregarImagen(a.uri))
    }
  }

  const tomarFoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync()
    if (status !== 'granted') {
      Alert.alert('Permiso requerido', 'Necesitamos acceso a la cámara')
      return
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.7 })
    if (!result.canceled) agregarImagen(result.assets[0].uri)
  }

  const continuar = () => {
    if (!tipoActividad) {
      Alert.alert('Campo requerido', 'Selecciona el tipo de actividad')
      return
    }
    if (!observaciones.trim()) {
      Alert.alert('Campo requerido', 'Escribe el reporte de la visita')
      return
    }

    setDatos({
      reporte:          observaciones,
      datos_extendidos: { tipo_actividad: tipoActividad, hectareas, productos },
    })

    router.push('/stack/satisfaccion')
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>

      {/* Nombre de quien se visita */}
      <View style={styles.headerInfo}>
        <Text style={styles.visitandoLabel}>Registrando visita a:</Text>
        <Text style={styles.visitandoNombre}>{params.nombre}</Text>
      </View>

      {/* Tipo de actividad */}
      <View style={styles.seccion}>
        <Text style={styles.seccionTitulo}>Tipo de actividad *</Text>
        <View style={styles.tiposGrid}>
          {TIPOS_ACTIVIDAD.map(tipo => (
            <TouchableOpacity
              key={tipo}
              style={[styles.tipoBtn, tipoActividad === tipo && styles.tipoBtnActivo]}
              onPress={() => setTipoActividad(tipo)}
            >
              <Text style={[styles.tipoBtnTexto, tipoActividad === tipo && styles.tipoBtnTextoActivo]}>
                {tipo}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Hectáreas */}
      <View style={styles.seccion}>
        <Text style={styles.seccionTitulo}>Hectáreas atendidas</Text>
        <TextInput
          style={styles.input}
          placeholder="Ej: 2.5"
          placeholderTextColor={Colors.textoPlaceholder}
          value={hectareas}
          onChangeText={setHectareas}
          keyboardType="decimal-pad"
        />
      </View>

      {/* Productos / insumos */}
      <View style={styles.seccion}>
        <Text style={styles.seccionTitulo}>Productos o insumos entregados</Text>
        <TextInput
          style={[styles.input, styles.inputMultiline]}
          placeholder="Ej: Fertilizante NPK 20kg, semillas..."
          placeholderTextColor={Colors.textoPlaceholder}
          value={productos}
          onChangeText={setProductos}
          multiline
          numberOfLines={3}
        />
      </View>

      {/* Reporte / observaciones */}
      <View style={styles.seccion}>
        <Text style={styles.seccionTitulo}>Reporte de la visita *</Text>
        <TextInput
          style={[styles.input, styles.inputReporte]}
          placeholder="Describe detalladamente las actividades realizadas, condiciones del cultivo, recomendaciones..."
          placeholderTextColor={Colors.textoPlaceholder}
          value={observaciones}
          onChangeText={setObservaciones}
          multiline
          numberOfLines={6}
          textAlignVertical="top"
        />
      </View>

      {/* Evidencias fotográficas */}
      <View style={styles.seccion}>
        <Text style={styles.seccionTitulo}>Evidencias fotográficas</Text>
        <View style={styles.botonesImagen}>
          <TouchableOpacity style={styles.btnImagen} onPress={tomarFoto}>
            <Ionicons name="camera" size={20} color={Colors.guinda} />
            <Text style={styles.btnImagenTexto}>Cámara</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.btnImagen} onPress={seleccionarImagen}>
            <Ionicons name="images" size={20} color={Colors.guinda} />
            <Text style={styles.btnImagenTexto}>Galería</Text>
          </TouchableOpacity>
        </View>

        {/* Grid de imágenes seleccionadas */}
        {imagenes.length > 0 && (
          <View style={styles.imagenesGrid}>
            {imagenes.map((uri: string, i: number) => (
              <View key={i} style={styles.imagenWrapper}>
                <Image source={{ uri }} style={styles.imagenPreview} />
                <TouchableOpacity
                  style={styles.imagenEliminar}
                  onPress={() => quitarImagen(uri)}
                >
                  <Ionicons name="close-circle" size={22} color={Colors.danger} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Botón continuar */}
      <TouchableOpacity
        style={styles.botonContinuar}
        onPress={continuar}
        activeOpacity={0.85}
      >
        <Text style={styles.botonTexto}>Continuar</Text>
        <Ionicons name="arrow-forward" size={20} color={Colors.blanco} />
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: Colors.fondoApp },
  content:      { padding: 20, gap: 20 },

  headerInfo:   {
    backgroundColor: Colors.guinda, borderRadius: 12,
    padding: 16, gap: 4,
  },
  visitandoLabel:  { color: 'rgba(255,255,255,0.7)', fontSize: 12 },
  visitandoNombre: { color: Colors.blanco, fontSize: 18, fontWeight: '700' },

  seccion:      { gap: 10 },
  seccionTitulo:{ fontSize: 14, fontWeight: '700', color: Colors.textoMain },

  tiposGrid:    { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tipoBtn:      {
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 20, borderWidth: 1.5, borderColor: Colors.borde,
    backgroundColor: Colors.blanco,
  },
  tipoBtnActivo:{ borderColor: Colors.guinda, backgroundColor: Colors.guinda50 },
  tipoBtnTexto: { fontSize: 13, color: Colors.textoSecundario },
  tipoBtnTextoActivo: { color: Colors.guinda, fontWeight: '700' },

  input:        {
    borderWidth: 1.5, borderColor: Colors.borde,
    borderRadius: 10, padding: 14,
    fontSize: 15, color: Colors.textoMain,
    backgroundColor: Colors.blanco,
  },
  inputMultiline:{ height: 80, textAlignVertical: 'top' },
  inputReporte:  { height: 140, textAlignVertical: 'top' },

  botonesImagen:{ flexDirection: 'row', gap: 12 },
  btnImagen:    {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, padding: 14, borderRadius: 10,
    borderWidth: 1.5, borderColor: Colors.guinda, backgroundColor: Colors.guinda50,
  },
  btnImagenTexto:{ color: Colors.guinda, fontWeight: '600', fontSize: 14 },

  imagenesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  imagenWrapper:{ position: 'relative' },
  imagenPreview:{ width: 90, height: 90, borderRadius: 10 },
  imagenEliminar:{
    position: 'absolute', top: -6, right: -6,
    backgroundColor: Colors.blanco, borderRadius: 12,
  },

  botonContinuar:{
    backgroundColor: Colors.guinda, borderRadius: 14,
    padding: 16, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center', gap: 10,
    marginTop: 8,
  },
  botonTexto:   { color: Colors.blanco, fontSize: 16, fontWeight: '700' },
})
