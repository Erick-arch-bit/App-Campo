import { useState } from 'react'
import {
  View, Text, TextInput, ScrollView, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Colors } from '@/constants/Colors'
import { BeneficiariosAPI } from '@/lib/api'

export default function AltaBeneficiarioScreen() {
  const [guardando, setGuardando] = useState(false)
  const [nombre,    setNombre]    = useState('')
  const [paterno,   setPaterno]   = useState('')
  const [materno,   setMaterno]   = useState('')
  const [telefono,  setTelefono]  = useState('')
  const [municipio, setMunicipio] = useState('')
  const [localidad, setLocalidad] = useState('')

  const handleGuardar = async () => {
    if (!nombre || !paterno) {
      Alert.alert('Campos requeridos', 'Ingresa al menos nombre y apellido paterno')
      return
    }

    setGuardando(true)
    try {
      // Construir nombre completo y mapear campos al formato esperado por el backend
      const nombreCompleto = `${nombre} ${paterno} ${materno || ''}`.trim()
      
      await BeneficiariosAPI.crear({
        nombre_completo: nombreCompleto,
        telefono_contacto: telefono,
        municipio,
        localidad,
      })
      Alert.alert(
        '✅ Beneficiario registrado',
        'El beneficiario ha sido dado de alta correctamente',
        [{ text: 'OK', onPress: limpiarFormulario }]
      )
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.error ?? 'No se pudo registrar')
    } finally {
      setGuardando(false)
    }
  }

  const limpiarFormulario = () => {
    setNombre('')
    setPaterno('')
    setMaterno('')
    setTelefono('')
    setMunicipio('')
    setLocalidad('')
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Ionicons name="person-add" size={32} color={Colors.guinda} />
        <Text style={styles.titulo}>Alta de Beneficiario</Text>
        <Text style={styles.subtitulo}>
          Registra un nuevo beneficiario en el programa
        </Text>
      </View>

      {/* Nombre */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Nombre(s) *</Text>
        <TextInput
          style={styles.input}
          placeholder="Nombre completo"
          placeholderTextColor={Colors.textoPlaceholder}
          value={nombre}
          onChangeText={setNombre}
        />
      </View>

      {/* Apellidos */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Apellido Paterno *</Text>
        <TextInput
          style={styles.input}
          placeholder="Apellido paterno"
          placeholderTextColor={Colors.textoPlaceholder}
          value={paterno}
          onChangeText={setPaterno}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Apellido Materno</Text>
        <TextInput
          style={styles.input}
          placeholder="Apellido materno"
          placeholderTextColor={Colors.textoPlaceholder}
          value={materno}
          onChangeText={setMaterno}
        />
      </View>

      {/* Teléfono */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Teléfono</Text>
        <TextInput
          style={styles.input}
          placeholder="10 dígitos"
          placeholderTextColor={Colors.textoPlaceholder}
          value={telefono}
          onChangeText={setTelefono}
          keyboardType="phone-pad"
          maxLength={10}
        />
      </View>

      {/* Ubicación */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Municipio</Text>
        <TextInput
          style={styles.input}
          placeholder="Ej: Pachuca"
          placeholderTextColor={Colors.textoPlaceholder}
          value={municipio}
          onChangeText={setMunicipio}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Localidad</Text>
        <TextInput
          style={styles.input}
          placeholder="Ej: San Miguel"
          placeholderTextColor={Colors.textoPlaceholder}
          value={localidad}
          onChangeText={setLocalidad}
        />
      </View>

      {/* Botones */}
      <View style={styles.botonesContainer}>
        <TouchableOpacity
          style={styles.btnLimpiar}
          onPress={limpiarFormulario}
          disabled={guardando}
        >
          <Ionicons name="refresh-outline" size={18} color={Colors.guinda} />
          <Text style={styles.btnLimpiarTexto}>Limpiar</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.btnGuardar, guardando && styles.btnDisabled]}
          onPress={handleGuardar}
          disabled={guardando}
        >
          {guardando ? (
            <ActivityIndicator color={Colors.blanco} />
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={20} color={Colors.blanco} />
              <Text style={styles.btnGuardarTexto}>Guardar</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.fondoApp },
  content:   { padding: 20, gap: 18 },

  header:    { alignItems: 'center', gap: 8, marginBottom: 12 },
  titulo:    { fontSize: 22, fontWeight: '800', color: Colors.textoMain },
  subtitulo: { fontSize: 14, color: Colors.textoSecundario, textAlign: 'center' },

  inputGroup: { gap: 6 },
  label:     { fontSize: 13, fontWeight: '600', color: Colors.textoMain },
  input:     {
    borderWidth: 1.5, borderColor: Colors.borde,
    borderRadius: 10, padding: 14,
    fontSize: 15, color: Colors.textoMain,
    backgroundColor: Colors.blanco,
  },

  botonesContainer: { flexDirection: 'row', gap: 12, marginTop: 12 },
  btnLimpiar: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, padding: 14, borderRadius: 12,
    borderWidth: 1.5, borderColor: Colors.guinda, backgroundColor: Colors.guinda50,
  },
  btnLimpiarTexto: { color: Colors.guinda, fontWeight: '700', fontSize: 15 },
  btnGuardar: {
    flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, padding: 14, borderRadius: 12, backgroundColor: Colors.guinda,
  },
  btnGuardarTexto: { color: Colors.blanco, fontWeight: '700', fontSize: 15 },
  btnDisabled: { opacity: 0.5 },
})
