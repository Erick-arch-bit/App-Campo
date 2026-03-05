import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import Constants from 'expo-constants'
import { Colors } from '@/constants/Colors'
import { useAuth } from '@/hooks/useAuth'

export default function InformacionScreen() {
  const { usuario, logout } = useAuth()
  const router = useRouter()

  const handleLogout = () => {
    Alert.alert(
      'Cerrar Sesión',
      '¿Estás seguro de que deseas salir?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Salir', onPress: logout, style: 'destructive' },
      ]
    )
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Perfil del usuario */}
      <View style={styles.perfilCard}>
        <View style={styles.avatarContainer}>
          <Ionicons name="person-circle" size={80} color={Colors.guinda} />
        </View>
        <Text style={styles.nombreUsuario}>{usuario?.nombre_completo}</Text>
        <Text style={styles.emailUsuario}>{usuario?.email}</Text>
        
        {usuario?.especialidad && (
          <View style={styles.especialidadBadge}>
            <Text style={styles.especialidadTexto}>{usuario.especialidad}</Text>
          </View>
        )}

        {usuario?.zona_nombre && (
          <View style={styles.infoRow}>
            <Ionicons name="map-outline" size={16} color={Colors.textoSecundario} />
            <Text style={styles.infoTexto}>Zona: {usuario.zona_nombre}</Text>
          </View>
        )}

        <View style={styles.infoRow}>
          <Ionicons name="briefcase-outline" size={16} color={Colors.textoSecundario} />
          <Text style={styles.infoTexto}>Rol: {usuario?.rol}</Text>
        </View>
      </View>

      {/* Información de la app */}
      <View style={styles.seccion}>
        <Text style={styles.seccionTitulo}>Acerca de la App</Text>
        
        <View style={styles.infoCard}>
          <View style={styles.infoCardRow}>
            <Ionicons name="information-circle-outline" size={20} color={Colors.guinda} />
            <Text style={styles.infoCardTexto}>SADERH App v{Constants.expoConfig?.version ?? '1.0.0'}</Text>
          </View>
          <Text style={styles.descripcion}>
            Sistema de gestión de campo para técnicos de la Secretaría de Agricultura
            del Estado de Hidalgo.
          </Text>
        </View>

        <View style={styles.infoCard}>
          <View style={styles.infoCardRow}>
            <Ionicons name="shield-checkmark-outline" size={20} color={Colors.success} />
            <Text style={styles.infoCardTexto}>Datos Seguros</Text>
          </View>
          <Text style={styles.descripcion}>
            Tu información está protegida con cifrado de extremo a extremo.
          </Text>
        </View>

        <View style={styles.infoCard}>
          <View style={styles.infoCardRow}>
            <Ionicons name="cloud-offline-outline" size={20} color={Colors.info} />
            <Text style={styles.infoCardTexto}>Modo Offline</Text>
          </View>
          <Text style={styles.descripcion}>
            Trabaja sin conexión. Los datos se sincronizarán automáticamente cuando
            recuperes la señal.
          </Text>
        </View>
      </View>

      {/* Botón cerrar sesión */}
      <TouchableOpacity style={styles.btnLogout} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={20} color={Colors.danger} />
        <Text style={styles.btnLogoutTexto}>Cerrar Sesión</Text>
      </TouchableOpacity>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerTexto}>Gobierno del Estado de Hidalgo</Text>
        <Text style={styles.footerTexto}>Secretaría de Agricultura y Desarrollo Rural</Text>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.fondoApp },
  content:   { padding: 20, gap: 24 },

  perfilCard: {
    backgroundColor: Colors.blanco,
    borderRadius: 16, padding: 24,
    alignItems: 'center', gap: 10,
    borderWidth: 1, borderColor: Colors.borde,
  },
  avatarContainer: { marginBottom: 8 },
  nombreUsuario:  { fontSize: 20, fontWeight: '800', color: Colors.textoMain },
  emailUsuario:   { fontSize: 14, color: Colors.textoSecundario },
  especialidadBadge: {
    backgroundColor: Colors.guinda50,
    paddingHorizontal: 16, paddingVertical: 6,
    borderRadius: 20, marginTop: 4,
  },
  especialidadTexto: { color: Colors.guinda, fontSize: 12, fontWeight: '700' },
  infoRow:      { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  infoTexto:    { fontSize: 13, color: Colors.textoSecundario },

  seccion:      { gap: 12 },
  seccionTitulo:{ fontSize: 16, fontWeight: '700', color: Colors.textoMain },

  configCard: {
    backgroundColor: Colors.blanco,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: Colors.borde,
  },
  configCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.guinda50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  configCardText: {
    flex: 1,
  },
  configCardTitulo: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textoMain,
  },
  configCardDescripcion: {
    fontSize: 12,
    color: Colors.textoSecundario,
    marginTop: 2,
  },

  infoCard:     {
    backgroundColor: Colors.blanco,
    borderRadius: 12, padding: 16,
    borderWidth: 1, borderColor: Colors.borde,
    gap: 8,
  },
  infoCardRow:  { flexDirection: 'row', alignItems: 'center', gap: 10 },
  infoCardTexto:{ fontSize: 15, fontWeight: '700', color: Colors.textoMain },
  descripcion:  { fontSize: 13, color: Colors.textoSecundario, lineHeight: 18 },

  btnLogout:    {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, padding: 16, borderRadius: 12,
    borderWidth: 1.5, borderColor: Colors.danger,
    backgroundColor: Colors.dangerBg,
  },
  btnLogoutTexto: { color: Colors.danger, fontWeight: '700', fontSize: 15 },

  footer:       { alignItems: 'center', gap: 4, marginTop: 16 },
  footerTexto:  { fontSize: 11, color: Colors.textoPlaceholder, textAlign: 'center' },
})
