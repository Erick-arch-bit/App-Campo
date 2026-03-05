import { Stack } from 'expo-router'
import { Colors } from '@/constants/Colors'

export default function StackLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle:      { backgroundColor: Colors.guinda },
        headerTintColor:  Colors.blanco,
        headerTitleStyle: { fontWeight: '700', fontSize: 18 },
      }}
    >
      <Stack.Screen
        name="detalle-asignacion"
        options={{ title: 'Detalle de Asignación' }}
      />
      <Stack.Screen
        name="formulario-bitacora"
        options={{ title: 'Formulario de Bitácora' }}
      />
      <Stack.Screen
        name="satisfaccion"
        options={{ title: 'Evaluación' }}
      />
      <Stack.Screen
        name="firma"
        options={{ title: 'Firma y Confirmación' }}
      />
      <Stack.Screen
        name="configuracion-notificaciones"
        options={{ title: 'Notificaciones' }}
      />
    </Stack>
  )
}
