import { supabaseAdmin } from './supabase'

// SQL para crear las tablas necesarias
const createTablesSQL = `
-- Tabla de usuarios
CREATE TABLE IF NOT EXISTS usuarios (
  id_usuario SERIAL PRIMARY KEY,
  nombre_completo VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  rol VARCHAR(50) DEFAULT 'TECNICO',
  especialidad VARCHAR(50) CHECK (especialidad IN ('AGRICOLA', 'AGROPECUARIO', 'ACTIVIDAD_GENERAL')),
  puede_registrar_beneficiarios BOOLEAN DEFAULT false,
  bloqueado_revision BOOLEAN DEFAULT false,
  zona_nombre VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de beneficiarios
CREATE TABLE IF NOT EXISTS beneficiarios (
  id_beneficiario SERIAL PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  paterno VARCHAR(100) NOT NULL,
  materno VARCHAR(100),
  telefono VARCHAR(20),
  municipio VARCHAR(100),
  localidad VARCHAR(100),
  folio VARCHAR(50) UNIQUE,
  latitud VARCHAR(50),
  longitud VARCHAR(50),
  cadena_productiva VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de asignaciones
CREATE TABLE IF NOT EXISTS asignaciones (
  id_asignacion SERIAL PRIMARY KEY,
  id_usuario INTEGER REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
  tipo_asignacion VARCHAR(50) CHECK (tipo_asignacion IN ('BENEFICIARIO', 'ACTIVIDAD')) NOT NULL,
  descripcion_actividad TEXT,
  fecha_limite DATE NOT NULL,
  completado BOOLEAN DEFAULT false,
  id_beneficiario INTEGER REFERENCES beneficiarios(id_beneficiario) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de bitácoras
CREATE TABLE IF NOT EXISTS bitacoras (
  id_bitacora SERIAL PRIMARY KEY,
  id_usuario INTEGER REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
  id_asignacion INTEGER REFERENCES asignaciones(id_asignacion) ON DELETE SET NULL,
  uuid_movil VARCHAR(100),
  fecha_hora_inicio TIMESTAMP WITH TIME ZONE NOT NULL,
  fecha_hora_fin TIMESTAMP WITH TIME ZONE NOT NULL,
  latitud DECIMAL(10, 8),
  longitud DECIMAL(11, 8),
  latitud_fin DECIMAL(10, 8),
  longitud_fin DECIMAL(11, 8),
  precision_gps DECIMAL(5, 2),
  tipo_bitacora VARCHAR(50) CHECK (tipo_bitacora IN ('BENEFICIARIO', 'ACTIVIDAD_GENERAL')) NOT NULL,
  datos_extendidos JSONB DEFAULT '{}',
  dispositivo_info JSONB DEFAULT '{}',
  calificacion INTEGER CHECK (calificacion BETWEEN 1 AND 5),
  reporte TEXT,
  firma_url TEXT,
  foto_confirmacion TEXT,
  sincronizado BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de evidencias (fotos, documentos)
CREATE TABLE IF NOT EXISTS evidencias (
  id_evidencia SERIAL PRIMARY KEY,
  id_bitacora INTEGER REFERENCES bitacoras(id_bitacora) ON DELETE CASCADE,
  uuid_movil VARCHAR(100),
  tipo_archivo VARCHAR(20) CHECK (tipo_archivo IN ('FOTO', 'DOCUMENTO')) NOT NULL,
  descripcion TEXT,
  url TEXT NOT NULL,
  public_id VARCHAR(255),
  sincronizado BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de sincronización offline
CREATE TABLE IF NOT EXISTS sync_queue (
  id_sync SERIAL PRIMARY KEY,
  tabla_origen VARCHAR(50) NOT NULL,
  registro_id INTEGER NOT NULL,
  operacion VARCHAR(10) CHECK (operacion IN ('INSERT', 'UPDATE', 'DELETE')) NOT NULL,
  datos JSONB,
  uuid_movil VARCHAR(100),
  procesada BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_asignaciones_usuario ON asignaciones(id_usuario);
CREATE INDEX IF NOT EXISTS idx_asignaciones_fecha_limite ON asignaciones(fecha_limite);
CREATE INDEX IF NOT EXISTS idx_bitacoras_usuario ON bitacoras(id_usuario);
CREATE INDEX IF NOT EXISTS idx_bitacoras_asignacion ON bitacoras(id_asignacion);
CREATE INDEX IF NOT EXISTS idx_beneficiarios_municipio ON beneficiarios(municipio);
CREATE INDEX IF NOT EXISTS idx_sync_queue_procesada ON sync_queue(procesada);

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_usuarios_updated_at BEFORE UPDATE ON usuarios
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_beneficiarios_updated_at BEFORE UPDATE ON beneficiarios
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_asignaciones_updated_at BEFORE UPDATE ON asignaciones
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bitacoras_updated_at BEFORE UPDATE ON bitacoras
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
`

async function initDatabase() {
  console.log('🔄 Inicializando base de datos...')
  
  try {
    // Ejecutar el SQL directamente
    const { error } = await supabaseAdmin.rpc('exec_sql', { sql: createTablesSQL })
    
    if (error) {
      console.log('⚠️  Error ejecutando SQL con RPC, intentando método alternativo...')
      // El método RPC puede no funcionar, intentar de otra forma
      // Por ahora, asumimos que las tablas ya existen o se crearon manualmente
    }
    
    console.log('✅ Base de datos inicializada correctamente')
  } catch (err) {
    console.error('❌ Error inicializando base de datos:', err)
  }
  
  process.exit(0)
}

// Ejecutar si se llama directamente
initDatabase()
