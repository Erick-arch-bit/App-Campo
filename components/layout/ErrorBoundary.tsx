import React, { Component, ErrorInfo, ReactNode } from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { Colors } from '@/constants/Colors'
import { Ionicons } from '@expo/vector-icons'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <Ionicons name="warning-outline" size={64} color={Colors.warning} />
          <Text style={styles.titulo}>Algo salió mal</Text>
          <Text style={styles.mensaje}>
            La aplicación encontró un error inesperado.
          </Text>
          {__DEV__ && this.state.error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>
                {this.state.error.message}
              </Text>
            </View>
          )}
          <TouchableOpacity style={styles.boton} onPress={this.handleReset}>
            <Ionicons name="refresh" size={18} color={Colors.blanco} />
            <Text style={styles.botonTexto}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      )
    }

    return this.props.children
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.fondoApp,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    gap: 16,
  },
  titulo: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.textoMain,
  },
  mensaje: {
    fontSize: 14,
    color: Colors.textoSecundario,
    textAlign: 'center',
    lineHeight: 20,
  },
  errorBox: {
    backgroundColor: Colors.dangerBg,
    borderRadius: 8,
    padding: 12,
    width: '100%',
  },
  errorText: {
    color: Colors.danger,
    fontSize: 12,
    fontFamily: 'monospace',
  },
  boton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.guinda,
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 12,
    marginTop: 8,
  },
  botonTexto: {
    color: Colors.blanco,
    fontWeight: '700',
    fontSize: 15,
  },
})
