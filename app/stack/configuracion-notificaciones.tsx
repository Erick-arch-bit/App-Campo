import { View, Text } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Colors } from '@/constants/Colors'

export default function ConfiguracionNotificacionesScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
        <Text style={{ fontSize: 18, fontWeight: '700', color: Colors.guinda, marginBottom: 8 }}>
          Notificaciones desactivadas
        </Text>
        <Text style={{ fontSize: 14, color: Colors.textoSecundario, textAlign: 'center' }}>
          Esta versión de prueba funciona sin el módulo de notificaciones.
        </Text>
      </View>
    </SafeAreaView>
  )
}
