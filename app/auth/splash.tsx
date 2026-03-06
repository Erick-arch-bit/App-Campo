import { useEffect, useRef } from 'react'
import { View, Text, StyleSheet, Animated, Easing, Image } from 'react-native'
import { useRouter } from 'expo-router'
import Constants from 'expo-constants'
import { Colors } from '@/constants/Colors'

// Importar logo desde assets
const LOGO_CAMPO = require('../../assets/logos/Logo-campo 2.svg')

export default function SplashScreen() {
  const router = useRouter()
  const fadeAnim = useRef(new Animated.Value(0)).current
  const scaleAnim = useRef(new Animated.Value(0.3)).current

  useEffect(() => {
    // Animación de entrada
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 20,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start()

    // Después de 2.5 segundos, ir a verificación de conexión
    const timer = setTimeout(() => {
      router.replace('/auth/conexion')
    }, 2500)

    return () => clearTimeout(timer)
  }, [])

  return (
    <View style={styles.container}>
      {/* Logo principal animado */}
      <Animated.View
        style={[
          styles.logoContainer,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        {/* Logo de SADERH Campo */}
        <Image 
          source={require('../../assets/logos/Logo-campo 2.svg') as any}
          style={styles.logoSaderh}
          resizeMode="contain"
        />
        
        <Text style={styles.subtitulo}>Gobierno del Estado de Hidalgo</Text>
        <Text style={styles.titulo}>SADERH</Text>
        <Text style={styles.descripcion}>Sistema de Gestión de Campo</Text>
      </Animated.View>

      {/* Footer */}
      <Animated.View style={[styles.footer, { opacity: fadeAnim }]}>
        <Text style={styles.footerTexto}>
          Secretaría de Agricultura y Desarrollo Rural
        </Text>
        <Text style={styles.versionTexto}>v{Constants.expoConfig?.version ?? '1.0.0'}</Text>
      </Animated.View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.guinda,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },

  logoContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },

  logoSaderh: {
    width: 200,
    height: 200,
    marginBottom: 10,
  },

  iconCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(179, 142, 93, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 3,
    borderColor: Colors.dorado,
  },

  subtitulo: {
    color: Colors.dorado,
    fontSize: 12,
    letterSpacing: 3,
    textTransform: 'uppercase',
    fontWeight: '600',
    textAlign: 'center',
  },

  titulo: {
    color: Colors.blanco,
    fontSize: 52,
    fontWeight: '900',
    letterSpacing: 2,
    textAlign: 'center',
  },

  descripcion: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 8,
  },

  footer: {
    paddingBottom: 40,
    alignItems: 'center',
    gap: 8,
  },

  footerTexto: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 16,
  },

  versionTexto: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 10,
  },
})
