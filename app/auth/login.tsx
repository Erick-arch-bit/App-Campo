import { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform,
  ActivityIndicator, Alert,
} from 'react-native'
import { Colors } from '@/constants/Colors'
import { useAuth } from '@/hooks/useAuth'
import { Ionicons } from '@expo/vector-icons'

export default function LoginScreen() {
  const { login, cargando, error } = useAuth()
  const [codigoAcceso, setCodigoAcceso] = useState('')

  const handleLogin = async () => {
    if (!codigoAcceso || codigoAcceso.length !== 5) {
      Alert.alert('Código requerido', 'Ingresa tu código de acceso de 5 dígitos')
      return
    }
    await login(codigoAcceso.trim())
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.subtitulo}>Gobierno del Estado de Hidalgo</Text>
        <Text style={styles.titulo}>SADERH</Text>
        <Text style={styles.descripcion}>Sistema de Gestión de Campo</Text>
      </View>

      {/* Formulario */}
      <View style={styles.form}>
        <Text style={styles.bienvenida}>Iniciar Sesión</Text>
        <Text style={styles.instruccion}>Ingresa tu código de acceso</Text>

        {/* Código de acceso */}
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.input}
            placeholder="Código de acceso"
            placeholderTextColor={Colors.textoPlaceholder}
            value={codigoAcceso}
            onChangeText={(text) => setCodigoAcceso(text.replace(/[^0-9]/g, ''))}
            keyboardType="number-pad"
            maxLength={5}
            secureTextEntry
          />
        </View>

        {/* Error */}
        {error && (
          <View style={styles.errorBox}>
            <Ionicons name="warning" size={16} color={Colors.danger} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Botón login */}
        <TouchableOpacity
          style={[styles.botonLogin, cargando && styles.botonDisabled]}
          onPress={handleLogin}
          disabled={cargando}
          activeOpacity={0.85}
        >
          {cargando
            ? <ActivityIndicator color={Colors.blanco} />
            : <Text style={styles.botonTexto}>Entrar</Text>
          }
        </TouchableOpacity>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerTexto}>Secretaría de Agricultura de Hidalgo</Text>
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: Colors.guinda },
  header:       {
    flex: 0.35, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 32, paddingTop: 60,
  },
  subtitulo:    {
    color: Colors.dorado, fontSize: 11, letterSpacing: 2,
    textTransform: 'uppercase', marginBottom: 6, fontWeight: '500',
  },
  titulo:       {
    color: Colors.blanco, fontSize: 42, fontWeight: '700', letterSpacing: 1,
  },
  descripcion:  { color: 'rgba(255,255,255,0.7)', fontSize: 14, marginTop: 4 },

  form:         {
    flex: 0.55, backgroundColor: Colors.blanco,
    borderTopLeftRadius: 32, borderTopRightRadius: 32,
    paddingHorizontal: 28, paddingTop: 36, paddingBottom: 24,
  },
  bienvenida:   { fontSize: 22, fontWeight: '700', color: Colors.guinda, marginBottom: 4 },
  instruccion:  { fontSize: 13, color: Colors.textoSecundario, marginBottom: 28 },

  inputWrapper: { marginBottom: 18 },
  input:        {
    borderWidth: 1.5, borderColor: Colors.borde,
    borderRadius: 10, padding: 14,
    fontSize: 18, color: Colors.textoMain, textAlign: 'center',
    backgroundColor: Colors.fondoApp, letterSpacing: 8,
  },

  errorBox:     {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Colors.dangerBg, borderRadius: 8,
    padding: 12, marginBottom: 16,
  },
  errorText:    { color: Colors.danger, fontSize: 13, flex: 1 },

  botonLogin:   {
    backgroundColor: Colors.guinda, borderRadius: 12,
    padding: 16, alignItems: 'center', marginTop: 8,
  },
  botonDisabled:{ opacity: 0.6 },
  botonTexto:   { color: Colors.blanco, fontSize: 16, fontWeight: '700' },

  footer:       {
    flex: 0.1, backgroundColor: Colors.blanco,
    alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 24,
  },
  footerTexto:  { color: Colors.textoPlaceholder, fontSize: 11 },
})
