import { useEffect } from 'react'
import { View, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import { Colors } from '@/constants/Colors'

// Pantalla inicial que redirige al splash
export default function Index() {
  const router = useRouter()

  useEffect(() => {
    // Pequeño delay para mostrar la pantalla inicial
    const timer = setTimeout(() => {
      router.replace('/auth/splash')
    }, 100)

    return () => clearTimeout(timer)
  }, [])

  return <View style={styles.container} />
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.guinda,
  },
})
