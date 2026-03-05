import { useEffect, useState, useCallback, useRef } from 'react'
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, RefreshControl, ActivityIndicator,
} from 'react-native'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { Colors } from '@/constants/Colors'
import { useAuth } from '@/hooks/useAuth'
import { usePreload } from '@/hooks/usePreload'
import { AsignacionesAPI } from '@/lib/api'
import type { Asignacion } from '@/types/models'

export default function DashboardScreen() {
  const { usuario } = useAuth()
  const router      = useRouter()
  const { asignaciones: asignacionesCache, cargando: cargandoPreload, actualizarAsignaciones } = usePreload()
  const [asignaciones, setAsignaciones] = useState<Asignacion[]>([])
  const [cargando,     setCargando]     = useState(true)
  const [refresc,      setRefresc]      = useState(false)
  const [usandoCache,  setUsandoCache]  = useState(false)

  // Flag para evitar loop infinito: solo cargar desde cache una vez al montar
  const cargaInicialHecha = useRef(false)

  const especialidad = usuario?.especialidad

  const cargar = useCallback(async () => {
    try {
      // Si hay datos en cache y es la primera carga, usarlos primero
      if (!cargaInicialHecha.current && asignacionesCache.length > 0) {
        setAsignaciones(asignacionesCache)
        setUsandoCache(true)
        setCargando(false)
      }

      // Luego actualizar desde el servidor
      const { data } = await AsignacionesAPI.listar(true)
      setAsignaciones(data.data.asignaciones)
      setUsandoCache(false)
    } catch (e) {
      console.error(e)
      // Si falla y tenemos cache, seguir usándolo
      if (asignacionesCache.length > 0) {
        setAsignaciones(asignacionesCache)
        setUsandoCache(true)
      }
    } finally {
      setCargando(false)
      setRefresc(false)
      cargaInicialHecha.current = true
    }
  }, [asignacionesCache])

  // Solo cargar al montar el componente, NO cuando cambie asignacionesCache
  useEffect(() => {
    cargar()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Filtrar por especialidad del técnico
  const asignacionesFiltradas = asignaciones.filter(a => {
    if (especialidad === 'AGRICOLA')      return a.cadena_productiva === 'AGRICOLA'
    if (especialidad === 'AGROPECUARIO')  return a.cadena_productiva === 'AGROPECUARIO'
    return true // ACTIVIDAD_GENERAL ve todo
  })

  // Falla 9: Solo pasar el ID, no el objeto completo serializado
  const irADetalle = (item: Asignacion) => {
    // Guardar la asignación seleccionada en el store para que detalle-asignacion la lea
    usePreload.setState({ _asignacionSeleccionada: item })
    router.push({
      pathname: '/stack/detalle-asignacion',
      params: { id: String(item.id_asignacion) },
    })
  }

  const renderItem = ({ item }: { item: Asignacion }) => {
    const esBeneficiario = item.tipo_asignacion === 'BENEFICIARIO'
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => irADetalle(item)}
        activeOpacity={0.8}
      >
        {/* Borde izquierdo de color */}
        <View style={[
          styles.cardBorde,
          { backgroundColor: esBeneficiario ? Colors.guinda : Colors.dorado }
        ]} />

        <View style={styles.cardContenido}>
          <View style={styles.cardHeader}>
            <View style={[
              styles.badge,
              { backgroundColor: esBeneficiario ? Colors.guinda50 : Colors.dorado100 }
            ]}>
              <Text style={[
                styles.badgeTexto,
                { color: esBeneficiario ? Colors.guinda : Colors.doradoDark }
              ]}>
                {esBeneficiario ? '🌾 Beneficiario' : '⚙️ Actividad'}
              </Text>
            </View>
            <Text style={styles.fechaLimite}>
              📅 {new Date(item.fecha_limite).toLocaleDateString('es-MX')}
            </Text>
          </View>

          <Text style={styles.nombrePrincipal}>
            {esBeneficiario ? item.beneficiario_nombre : item.descripcion_actividad}
          </Text>

          {esBeneficiario && item.beneficiario_municipio && (
            <Text style={styles.municipio}>
              📍 {item.beneficiario_municipio}
            </Text>
          )}

          {item.beneficiario_folio && (
            <Text style={styles.folio}>Folio: {item.beneficiario_folio}</Text>
          )}
        </View>

        <Ionicons name="chevron-forward" size={20} color={Colors.textoPlaceholder} />
      </TouchableOpacity>
    )
  }

  if (cargando) {
    return (
      <View style={styles.centrado}>
        <ActivityIndicator size="large" color={Colors.guinda} />
        <Text style={styles.cargandoTexto}>Cargando asignaciones...</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      {/* Resumen */}
      <View style={styles.resumen}>
        <View style={styles.resumenLeft}>
          <Text style={styles.resumenTexto}>
            {asignacionesFiltradas.length} asignaciones pendientes
          </Text>
          {usandoCache && (
            <View style={styles.cacheBadge}>
              <Ionicons name="cloud-done-outline" size={12} color={Colors.info} />
              <Text style={styles.cacheTexto}>Datos locales</Text>
            </View>
          )}
        </View>
        {especialidad && (
          <View style={styles.especialidadBadge}>
            <Text style={styles.especialidadTexto}>{especialidad}</Text>
          </View>
        )}
      </View>

      <FlatList
        data={asignacionesFiltradas}
        keyExtractor={(item) => String(item.id_asignacion)}
        renderItem={renderItem}
        contentContainerStyle={styles.lista}
        refreshControl={
          <RefreshControl
            refreshing={refresc}
            onRefresh={() => { setRefresc(true); cargar() }}
            colors={[Colors.guinda]}
            tintColor={Colors.guinda}
          />
        }
        ListEmptyComponent={
          <View style={styles.vacio}>
            <Text style={styles.vacioEmoji}>✅</Text>
            <Text style={styles.vacioTexto}>No hay asignaciones pendientes</Text>
          </View>
        }
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container:  { flex: 1, backgroundColor: Colors.fondoApp },
  centrado:   { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  cargandoTexto: { color: Colors.textoSecundario, fontSize: 14 },

  resumen:    {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: Colors.blanco, borderBottomWidth: 1, borderBottomColor: Colors.borde,
  },
  resumenLeft:  { flex: 1, gap: 4 },
  resumenTexto: { fontSize: 14, color: Colors.textoSecundario },
  cacheBadge:   {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    alignSelf: 'flex-start',
  },
  cacheTexto:   { fontSize: 10, color: Colors.info },
  especialidadBadge: {
    backgroundColor: Colors.guinda50, paddingHorizontal: 10,
    paddingVertical: 4, borderRadius: 20,
  },
  especialidadTexto: { color: Colors.guinda, fontSize: 11, fontWeight: '700' },

  lista:  { padding: 16, gap: 12 },

  card:   {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.fondoCard, borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  cardBorde:    { width: 4, alignSelf: 'stretch' },
  cardContenido:{ flex: 1, padding: 14, gap: 6 },
  cardHeader:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },

  badge:        { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  badgeTexto:   { fontSize: 11, fontWeight: '700' },
  fechaLimite:  { fontSize: 11, color: Colors.textoSecundario },

  nombrePrincipal: { fontSize: 15, fontWeight: '700', color: Colors.textoMain },
  municipio:    { fontSize: 12, color: Colors.textoSecundario },
  folio:        { fontSize: 11, color: Colors.textoPlaceholder },

  vacio:        { alignItems: 'center', paddingTop: 80, gap: 12 },
  vacioEmoji:   { fontSize: 48 },
  vacioTexto:   { fontSize: 15, color: Colors.textoSecundario },
})
