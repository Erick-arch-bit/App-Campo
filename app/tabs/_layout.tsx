import { Tabs } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { Colors } from '@/constants/Colors'
import { useAuth } from '@/hooks/useAuth'

export default function TabsLayout() {
  const { usuario } = useAuth()
  const puedeRegistrar = usuario?.puede_registrar_beneficiarios ?? false

  return (
    <Tabs
      screenOptions={{
        headerStyle:        { backgroundColor: Colors.guinda },
        headerTintColor:    Colors.blanco,
        headerTitleStyle:   { fontWeight: '700', fontSize: 18 },
        tabBarActiveTintColor:   Colors.guinda,
        tabBarInactiveTintColor: Colors.textoPlaceholder,
        tabBarStyle: {
          borderTopColor:   Colors.borde,
          backgroundColor:  Colors.blanco,
          paddingBottom:    8,
          height:           60,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Mis Asignaciones',
          tabBarLabel: 'Inicio',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />
      {puedeRegistrar && (
        <Tabs.Screen
          name="alta-beneficiario"
          options={{
            title: 'Alta Beneficiario',
            tabBarLabel: 'Alta',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="person-add" size={size} color={color} />
            ),
          }}
        />
      )}
      <Tabs.Screen
        name="informacion"
        options={{
          title: 'Información',
          tabBarLabel: 'Info',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="information-circle" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  )
}
