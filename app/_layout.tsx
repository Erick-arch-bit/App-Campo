import { useEffect, useState } from 'react'
import { View, ActivityIndicator, StyleSheet } from 'react-native'
import { Stack } from 'expo-router'
import { useRouter, useSegments } from 'expo-router'
import { useAuth } from '@/hooks/useAuth'
import { StatusBar } from 'expo-status-bar'
import { Colors } from '@/constants/Colors'
import { ErrorBoundary } from '@/components/layout/ErrorBoundary'

export default function RootLayout() {
  const { usuario, cargarSesion } = useAuth()
  const segments = useSegments()
  const router   = useRouter()
  const [sesionCargada, setSesionCargada] = useState(false)

  // Cargar sesión al inicio y esperar a que termine
  useEffect(() => {
    const inicializar = async () => {
      try {
        await cargarSesion()
      } catch (err) {
        console.error('Error cargando sesión:', err)
      } finally {
        setSesionCargada(true)
      }
    }
    inicializar()
  }, [])

  // Guard de autenticación — solo se ejecuta DESPUÉS de cargar la sesión
  useEffect(() => {
    if (!sesionCargada) return // No evaluar hasta que la sesión se haya cargado

    const segmentArray = segments as string[]
    const enAuth = segmentArray[0] === 'auth'
    const esIndex = segmentArray.length === 0

    // Permitir index y pantallas de auth sin usuario
    if (esIndex || enAuth) {
      // Si está autenticado y está en auth (excepto splash/conexion), ir a dashboard
      if (usuario && enAuth) {
        const authScreen = segmentArray[1]
        if (authScreen && authScreen !== 'splash' && authScreen !== 'conexion') {
          router.replace('/tabs/dashboard')
        }
      }
      return
    }

    // Si no está autenticado y no está en auth, redirigir a splash
    if (!usuario) {
      router.replace('/auth/splash')
    }
  }, [usuario, segments, sesionCargada])

  // Mostrar loading mientras se carga la sesión
  if (!sesionCargada) {
    return (
      <View style={styles.loading}>
        <StatusBar style="light" backgroundColor={Colors.guinda} />
        <ActivityIndicator size="large" color={Colors.dorado} />
      </View>
    )
  }

  return (
    <ErrorBoundary>
      <StatusBar style="light" backgroundColor={Colors.guinda} />
      <Stack screenOptions={{ headerShown: false }} />
    </ErrorBoundary>
  )
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    backgroundColor: Colors.guinda,
    justifyContent: 'center',
    alignItems: 'center',
  },
})
