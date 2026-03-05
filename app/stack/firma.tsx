import { useRef, useState } from 'react'
import {
  View, Text, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, Dimensions,
} from 'react-native'
import { useRouter } from 'expo-router'
import SignatureCanvas from 'react-native-signature-canvas'
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera'
import { Ionicons } from '@expo/vector-icons'
import { Colors } from '@/constants/Colors'
import { useBitacora } from '@/hooks/useBitacora'
import { EvidenciasAPI } from '@/lib/api'

const { width } = Dimensions.get('window')

type Paso = 'firma' | 'camara' | 'completado'

export default function FirmaScreen() {
  const router   = useRouter()
  const { setDatos, uuid_movil } = useBitacora()

  const [paso,         setPaso]         = useState<Paso>('firma')
  const [firmaBase64,  setFirmaBase64]  = useState<string | null>(null)
  const [guardando,    setGuardando]    = useState(false)
  const [permission,   requestPermission] = useCameraPermissions()

  const cameraRef = useRef<CameraView>(null)
  const sigRef    = useRef<any>(null)

  // ── PASO 1: Firma ─────────────────────────────────────────────────
  const onFirmaOK = (signature: string) => {
    // signature llega como data:image/png;base64,...
    setFirmaBase64(signature)
  }

  const limpiarFirma = () => {
    sigRef.current?.clearSignature()
    setFirmaBase64(null)
  }

  const continuarDeFirma = async () => {
    if (!firmaBase64) {
      Alert.alert('Firma requerida', 'Por favor realiza la firma antes de continuar')
      return
    }

    // Solicitar permiso de cámara para la foto frontal
    if (!permission?.granted) {
      const { granted } = await requestPermission()
      if (!granted) {
        Alert.alert('Permiso requerido', 'Necesitamos la cámara para la foto de confirmación')
        return
      }
    }
    setPaso('camara')
  }

  // ── PASO 2: Foto frontal ──────────────────────────────────────────
  const tomarFotoFrontal = async () => {
    if (!cameraRef.current) return
    setGuardando(true)
    try {
      const foto = await cameraRef.current.takePictureAsync({ quality: 0.7 })

      // Subir firma (base64) a Cloudinary
      const formFirma = new FormData()
      formFirma.append('id_bitacora', '0') // se actualiza en satisfaccion.tsx al crear la bitácora
      formFirma.append('tipo_archivo', 'DOCUMENTO')
      formFirma.append('descripcion', 'firma_beneficiario')
      formFirma.append('base64', firmaBase64!)

      // Subir foto de confirmación
      const formFoto = new FormData()
      formFoto.append('id_bitacora', '0')
      formFoto.append('tipo_archivo', 'FOTO')
      formFoto.append('descripcion', 'foto_confirmacion_beneficiario')
      formFoto.append('archivo', {
        uri:  foto!.uri,
        name: 'confirmacion.jpg',
        type: 'image/jpeg',
      } as any)

      // Guardar en el store para subirlos junto con la bitácora
      setDatos({
        firma_url:        firmaBase64!,
        foto_confirmacion:foto!.uri,
      })

      setPaso('completado')
    } catch (err) {
      Alert.alert('Error', 'No se pudo tomar la foto. Intenta de nuevo.')
    } finally {
      setGuardando(false)
    }
  }

  // ── PASO 3: Completado → regresa a satisfacción ───────────────────
  const continuar = () => router.back()

  // ── RENDER ────────────────────────────────────────────────────────
  if (paso === 'firma') {
    return (
      <View style={styles.container}>
        <Text style={styles.titulo}>Firma del Beneficiario</Text>
        <Text style={styles.instruccion}>
          Solicita al beneficiario que firme en el recuadro
        </Text>

        {/* Canvas de firma */}
        <View style={styles.canvasContainer}>
          <SignatureCanvas
            ref={sigRef}
            onOK={onFirmaOK}
            onEmpty={() => setFirmaBase64(null)}
            descriptionText=""
            clearText="Limpiar"
            confirmText="Guardar firma"
            webStyle={`
              .m-signature-pad { box-shadow: none; border: none; }
              .m-signature-pad--body { border: 1.5px solid ${Colors.borde}; border-radius: 12px; }
              .m-signature-pad--footer { display: none; }
              body { background: ${Colors.fondoApp}; }
            `}
            style={{ flex: 1 }}
          />
        </View>

        {firmaBase64 && (
          <View style={styles.firmaOKBadge}>
            <Ionicons name="checkmark-circle" size={18} color={Colors.success} />
            <Text style={styles.firmaOKTexto}>Firma registrada</Text>
          </View>
        )}

        {/* Botones */}
        <View style={styles.botones}>
          <TouchableOpacity style={styles.btnLimpiar} onPress={limpiarFirma}>
            <Ionicons name="refresh-outline" size={18} color={Colors.guinda} />
            <Text style={styles.btnLimpiarTexto}>Limpiar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.btnContinuar, !firmaBase64 && styles.btnDisabled]}
            onPress={continuarDeFirma}
            disabled={!firmaBase64}
          >
            <Text style={styles.btnContinuarTexto}>Continuar</Text>
            <Ionicons name="arrow-forward" size={18} color={Colors.blanco} />
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  if (paso === 'camara') {
    return (
      <View style={styles.container}>
        <Text style={styles.titulo}>Foto de confirmación</Text>
        <Text style={styles.instruccion}>
          Se tomará una foto del beneficiario como confirmación de la visita
        </Text>

        <View style={styles.cameraContainer}>
          <CameraView
            ref={cameraRef}
            style={styles.camera}
            facing="front"
          />
          {/* Overlay guía */}
          <View style={styles.cameraOverlay}>
            <View style={styles.cameraMarco} />
          </View>
        </View>

        <TouchableOpacity
          style={[styles.btnFoto, guardando && styles.btnDisabled]}
          onPress={tomarFotoFrontal}
          disabled={guardando}
          activeOpacity={0.85}
        >
          {guardando
            ? <ActivityIndicator color={Colors.blanco} />
            : <>
                <Ionicons name="camera" size={22} color={Colors.blanco} />
                <Text style={styles.btnContinuarTexto}>Tomar foto</Text>
              </>
          }
        </TouchableOpacity>
      </View>
    )
  }

  // Paso completado
  return (
    <View style={[styles.container, styles.completadoContainer]}>
      <Ionicons name="checkmark-circle" size={80} color={Colors.success} />
      <Text style={styles.completadoTitulo}>¡Todo listo!</Text>
      <Text style={styles.completadoSubtitulo}>
        Firma y foto de confirmación registradas correctamente
      </Text>
      <TouchableOpacity style={styles.btnFinalizar} onPress={continuar}>
        <Text style={styles.btnContinuarTexto}>Volver a evaluación</Text>
        <Ionicons name="arrow-back" size={18} color={Colors.blanco} />
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: Colors.fondoApp, padding: 20, gap: 16 },
  titulo:       { fontSize: 22, fontWeight: '800', color: Colors.textoMain },
  instruccion:  { fontSize: 14, color: Colors.textoSecundario, lineHeight: 20 },

  canvasContainer:{
    flex: 1, backgroundColor: Colors.blanco,
    borderRadius: 12, overflow: 'hidden',
    borderWidth: 1.5, borderColor: Colors.borde, minHeight: 300,
  },

  firmaOKBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: Colors.successBg, padding: 10, borderRadius: 8,
  },
  firmaOKTexto: { color: Colors.success, fontWeight: '600', fontSize: 13 },

  botones:      { flexDirection: 'row', gap: 12 },
  btnLimpiar:   {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, padding: 14, borderRadius: 12,
    borderWidth: 1.5, borderColor: Colors.guinda, backgroundColor: Colors.guinda50,
  },
  btnLimpiarTexto: { color: Colors.guinda, fontWeight: '700', fontSize: 15 },
  btnContinuar: {
    flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, padding: 14, borderRadius: 12, backgroundColor: Colors.guinda,
  },
  btnDisabled:  { opacity: 0.4 },
  btnContinuarTexto: { color: Colors.blanco, fontWeight: '700', fontSize: 15 },

  cameraContainer:{
    flex: 1, borderRadius: 16, overflow: 'hidden', minHeight: 360,
  },
  camera:       { flex: 1 },
  cameraOverlay:{ ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  cameraMarco:  {
    width: 200, height: 240, borderRadius: 16,
    borderWidth: 2, borderColor: Colors.dorado,
  },
  btnFoto:      {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, padding: 16, borderRadius: 14, backgroundColor: Colors.guinda,
  },

  completadoContainer: { alignItems: 'center', justifyContent: 'center', gap: 20 },
  completadoTitulo:    { fontSize: 28, fontWeight: '800', color: Colors.textoMain },
  completadoSubtitulo: { fontSize: 15, color: Colors.textoSecundario, textAlign: 'center' },
  btnFinalizar: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    padding: 16, borderRadius: 14, backgroundColor: Colors.guinda,
    paddingHorizontal: 28,
  },
})
