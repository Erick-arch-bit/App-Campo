import { useState, useEffect, useRef } from 'react'
import {
  View, Text, StyleSheet, ActivityIndicator,
  TouchableOpacity, Animated,
} from 'react-native'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { Colors } from '@/constants/Colors'
import { api } from '@/lib/api'

type EstadoConexion = 'verificando' | 'conectado' | 'error' | 'sin_conexion'

export default function ConexionScreen() {
  const router = useRouter()
  const [estado, setEstado] = useState<EstadoConexion>('verificando')
  const [mensaje, setMensaje] = useState('Verificando conexión...')
  const [intentos, setIntentos] = useState(0)
  const pulseAnim = useRef(new Animated.Value(1)).current

  useEffect(() => {
    verificarConexion()
  }, [])

  // Animación de pulso para el ícono
  useEffect(() => {
    if (estado === 'verificando') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ).start()
    }
  }, [estado])

  const verificarConexion = async () => {
    setEstado('verificando')
    setMensaje('Conectando con el servidor...')
    setIntentos(prev => prev + 1)

    try {
      // Intentar hacer ping al servidor (endpoint de health check)
      const response = await api.get('/api/health', { timeout: 5000 })
      
      if (response.status === 200) {
        setEstado('conectado')
        setMensaje('¡Conexión establecida!')
        
        // Esperar un momento para mostrar el éxito y luego ir al login
        setTimeout(() => {
          router.replace('/auth/login')
        }, 1000)
      } else {
        throw new Error('Respuesta inválida del servidor')
      }
    } catch (error: any) {
      console.error('Error de conexión:', error)
      
      if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        setEstado('sin_conexion')
        setMensaje('El servidor no responde. Verifica tu conexión a internet.')
      } else if (error.response?.status === 404) {
        // El endpoint /health no existe, pero el servidor responde
        // Consideramos esto como conexión exitosa
        setEstado('conectado')
        setMensaje('¡Conexión establecida!')
        setTimeout(() => {
          router.replace('/auth/login')
        }, 1000)
      } else {
        setEstado('error')
        setMensaje('Error al conectar con el servidor. Verifica tu conexión.')
      }
    }
  }

  const reintentar = () => {
    verificarConexion()
  }

  const continuarSinConexion = () => {
    // Permitir continuar en modo offline (opcional)
    router.replace('/auth/login')
  }

  const renderIcono = () => {
    switch (estado) {
      case 'verificando':
        return (
          <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
            <Ionicons name="cloud-upload-outline" size={80} color={Colors.dorado} />
          </Animated.View>
        )
      case 'conectado':
        return <Ionicons name="checkmark-circle" size={80} color={Colors.success} />
      case 'error':
      case 'sin_conexion':
        return <Ionicons name="cloud-offline-outline" size={80} color={Colors.warning} />
    }
  }

  const renderBoton = () => {
    if (estado === 'verificando') {
      return (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={Colors.dorado} />
        </View>
      )
    }

    if (estado === 'error' || estado === 'sin_conexion') {
      return (
        <View style={styles.botonesContainer}>
          <TouchableOpacity
            style={styles.botonReintentar}
            onPress={reintentar}
            activeOpacity={0.8}
          >
            <Ionicons name="refresh" size={20} color={Colors.blanco} />
            <Text style={styles.botonTexto}>
              Reintentar {intentos > 1 ? `(${intentos})` : ''}
            </Text>
          </TouchableOpacity>

          {intentos >= 2 && (
            <TouchableOpacity
              style={styles.botonContinuar}
              onPress={continuarSinConexion}
              activeOpacity={0.8}
            >
              <Text style={styles.botonContinuarTexto}>Continuar sin conexión</Text>
            </TouchableOpacity>
          )}
        </View>
      )
    }

    return null
  }

  return (
    <View style={styles.container}>
      <View style={styles.contenido}>
        {/* Ícono de estado */}
        <View style={styles.iconoContainer}>
          {renderIcono()}
        </View>

        {/* Mensaje de estado */}
        <Text style={styles.mensaje}>{mensaje}</Text>

        {/* Información adicional según el estado */}
        {estado === 'sin_conexion' && (
          <View style={styles.infoContainer}>
            <Text style={styles.infoTexto}>
              • Verifica tu conexión WiFi o datos móviles
            </Text>
            <Text style={styles.infoTexto}>
              • Asegúrate de tener señal de internet
            </Text>
            <Text style={styles.infoTexto}>
              • El servidor puede estar temporalmente fuera de línea
            </Text>
          </View>
        )}

        {estado === 'error' && (
          <View style={styles.infoContainer}>
            <Text style={styles.infoTexto}>
              No se pudo establecer conexión con el servidor SADERH
            </Text>
          </View>
        )}

        {estado === 'conectado' && (
          <View style={styles.successBadge}>
            <Text style={styles.successTexto}>Sistema en línea</Text>
          </View>
        )}

        {/* Botones de acción */}
        {renderBoton()}
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerTexto}>
          SADERH • Gobierno del Estado de Hidalgo
        </Text>
        {intentos > 0 && estado !== 'conectado' && (
          <Text style={styles.intentosTexto}>
            Intento {intentos} de conexión
          </Text>
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.guinda,
  },

  contenido: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    gap: 24,
  },

  iconoContainer: {
    marginBottom: 16,
  },

  mensaje: {
    color: Colors.blanco,
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 26,
  },

  infoContainer: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    padding: 16,
    gap: 8,
    marginTop: 8,
  },

  infoTexto: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 13,
    lineHeight: 20,
  },

  successBadge: {
    backgroundColor: Colors.successBg,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },

  successTexto: {
    color: Colors.success,
    fontSize: 13,
    fontWeight: '700',
  },

  loaderContainer: {
    marginTop: 16,
  },

  botonesContainer: {
    width: '100%',
    gap: 12,
    marginTop: 16,
  },

  botonReintentar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: Colors.dorado,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 14,
  },

  botonTexto: {
    color: Colors.blanco,
    fontSize: 16,
    fontWeight: '700',
  },

  botonContinuar: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.3)',
  },

  botonContinuarTexto: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 14,
    fontWeight: '600',
  },

  footer: {
    paddingBottom: 32,
    paddingHorizontal: 32,
    alignItems: 'center',
    gap: 8,
  },

  footerTexto: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 11,
    textAlign: 'center',
  },

  intentosTexto: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 10,
  },
})
