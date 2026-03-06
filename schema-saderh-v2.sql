-- ═══════════════════════════════════════════════════════════════════════════
-- SCHEMA SADERH v2.0 — SUPABASE POSTGRESQL
-- Sistema de Gestión de Campo · Secretaría de Agricultura · Hidalgo
-- ─────────────────────────────────────────────────────────────────────────
-- Instrucciones:
--   1. Abrir Supabase Dashboard → SQL Editor
--   2. Pegar este archivo COMPLETO
--   3. Ejecutar (Run)
--   4. Verificar en Table Editor que aparecen las 16 tablas
-- ═══════════════════════════════════════════════════════════════════════════

-- ── LIMPIEZA (orden inverso de dependencias) ──────────────────────────────
DROP TABLE IF EXISTS error_log                   CASCADE;
DROP TABLE IF EXISTS password_reset_tokens       CASCADE;
DROP TABLE IF EXISTS sesiones_app                CASCADE;
DROP TABLE IF EXISTS evidencias                  CASCADE;
DROP TABLE IF EXISTS bitacoras                   CASCADE;
DROP TABLE IF EXISTS sync_log                    CASCADE;
DROP TABLE IF EXISTS asignaciones                CASCADE;
DROP TABLE IF EXISTS notificaciones              CASCADE;
DROP TABLE IF EXISTS beneficiarios               CASCADE;
DROP TABLE IF EXISTS auditoria                   CASCADE;
DROP TABLE IF EXISTS configuracion_sistema       CASCADE;
DROP TABLE IF EXISTS periodos_cierre             CASCADE;
DROP TABLE IF EXISTS usuarios                    CASCADE;
DROP TABLE IF EXISTS zonas                       CASCADE;
DROP TABLE IF EXISTS plantillas_bitacora         CASCADE;
DROP TABLE IF EXISTS formularios_beneficiario    CASCADE;


-- ═══════════════════════════════════════════════════════════════════════════
-- 1. ZONAS
-- ═══════════════════════════════════════════════════════════════════════════
CREATE TABLE zonas (
  id_zona     INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  nombre      VARCHAR(100) NOT NULL UNIQUE,
  descripcion TEXT
);

CREATE INDEX idx_zonas_nombre ON zonas(nombre);

COMMENT ON TABLE  zonas             IS 'Regiones geográficas de operación — Hidalgo';
COMMENT ON COLUMN zonas.nombre      IS 'Nombre único de la zona (ej: Zona Norte)';
COMMENT ON COLUMN zonas.descripcion IS 'Descripción opcional de la región';


-- ═══════════════════════════════════════════════════════════════════════════
-- 2. USUARIOS (v2.0 - Login con código de acceso)
-- ═══════════════════════════════════════════════════════════════════════════
CREATE TABLE usuarios (
  id_usuario                    INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  nombre_completo               VARCHAR(150) NOT NULL,
  email                         VARCHAR(100),        -- Solo para recuperación
  codigo_acceso                 CHAR(5) NOT NULL UNIQUE,
  codigo_acceso_hash            VARCHAR(255) NOT NULL,
  rol                           VARCHAR(20) NOT NULL
                                  CHECK (rol IN ('SUPER_ADMIN', 'COORDINADOR', 'TECNICO')),
  especialidad                  VARCHAR(30)
                                  CHECK (especialidad IN ('AGRICOLA', 'AGROPECUARIO', 'ACTIVIDAD_GENERAL')),
  id_zona                       INT REFERENCES zonas(id_zona) ON DELETE SET NULL,
  activo                        BOOLEAN DEFAULT TRUE,
  puede_registrar_beneficiarios BOOLEAN DEFAULT FALSE,
  bloqueado_revision            BOOLEAN DEFAULT FALSE,
  foto_perfil_url               VARCHAR(500),
  ultimo_acceso                 TIMESTAMP,
  push_token                    VARCHAR(255),
  fecha_creacion               TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_usuarios_email        ON usuarios(email);
CREATE INDEX idx_usuarios_codigo       ON usuarios(codigo_acceso); 
CREATE INDEX idx_usuarios_zona         ON usuarios(id_zona);
CREATE INDEX idx_usuarios_rol          ON usuarios(rol);
CREATE INDEX idx_usuarios_activo       ON usuarios(activo);

COMMENT ON TABLE  usuarios                     IS 'Técnicos, coordinadores y administradores del sistema';
COMMENT ON COLUMN usuarios.codigo_acceso       IS 'Código único de 5 dígitos — es el login Y la contraseña del técnico';
COMMENT ON COLUMN usuarios.codigo_acceso_hash  IS 'Hash bcrypt del codigo_acceso';
COMMENT ON COLUMN usuarios.email               IS 'Solo para recuperación de código olvidado';
COMMENT ON COLUMN usuarios.rol                IS 'SUPER_ADMIN | COORDINADOR | TECNICO';
COMMENT ON COLUMN usuarios.bloqueado_revision  IS 'Cuando TRUE el técnico no puede sincronizar hasta que el admin lo libere';


-- ═══════════════════════════════════════════════════════════════════════════
-- 3. BENEFICIARIOS
-- ═══════════════════════════════════════════════════════════════════════════
CREATE TABLE beneficiarios (
  id_beneficiario      INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  folio_saderh         VARCHAR(50) UNIQUE,
  curp                 VARCHAR(18) UNIQUE,
  nombre_completo      VARCHAR(150) NOT NULL,
  municipio            VARCHAR(100) NOT NULL,
  localidad            VARCHAR(100) NOT NULL,
  cadena_productiva    VARCHAR(30)
                         CHECK (cadena_productiva IN ('AGRICOLA', 'AGROPECUARIO')),
  telefono_contacto    VARCHAR(20),
  latitud_predio       DECIMAL(10,8),
  longitud_predio      DECIMAL(11,8),
  id_usuario_registro  INT REFERENCES usuarios(id_usuario) ON DELETE SET NULL,
  origen_registro      VARCHAR(20) DEFAULT 'WEB'
                         CHECK (origen_registro IN ('WEB', 'MOVIL')),
  uuid_movil_registro  UUID,
  estatus_sync         VARCHAR(20) DEFAULT 'SINCRONIZADO'
                         CHECK (estatus_sync IN ('LOCAL', 'RECIBIDO', 'SINCRONIZADO')),
  documentos          JSONB DEFAULT '{}',
  estatus_beneficiario VARCHAR(30) DEFAULT 'ACTIVO'
                         CHECK (estatus_beneficiario IN ('ACTIVO', 'INACTIVO', 'EN_PROCESO', 'COMPLETADO')),
  total_visitas       INT DEFAULT 0,
  fecha_registro      TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_beneficiarios_usuario   ON beneficiarios(id_usuario_registro);
CREATE INDEX idx_beneficiarios_uuid      ON beneficiarios(uuid_movil_registro);
CREATE INDEX idx_beneficiarios_curp      ON beneficiarios(curp);
CREATE INDEX idx_beneficiarios_folio     ON beneficiarios(folio_saderh);
CREATE INDEX idx_beneficiarios_estatus  ON beneficiarios(estatus_beneficiario);
CREATE INDEX idx_beneficiarios_municipio ON beneficiarios(municipio);
CREATE INDEX idx_beneficiarios_origen   ON beneficiarios(origen_registro);

COMMENT ON TABLE  beneficiarios                  IS 'Productores agrícolas atendidos por los técnicos';


-- ═══════════════════════════════════════════════════════════════════════════
-- 4. ASIGNACIONES
-- ═══════════════════════════════════════════════════════════════════════════
CREATE TABLE asignaciones (
  id_asignacion         INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  id_tecnico           INT NOT NULL REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
  id_beneficiario       INT REFERENCES beneficiarios(id_beneficiario) ON DELETE CASCADE,
  id_usuario_creo       INT REFERENCES usuarios(id_usuario) ON DELETE SET NULL,
  tipo_asignacion       VARCHAR(20) NOT NULL
                          CHECK (tipo_asignacion IN ('BENEFICIARIO', 'ACTIVIDAD')),
  descripcion_actividad TEXT,
  prioridad            VARCHAR(10) DEFAULT 'NORMAL'
                          CHECK (prioridad IN ('BAJA', 'NORMAL', 'ALTA', 'URGENTE')),
  fecha_limite         TIMESTAMP NOT NULL,
  completado           BOOLEAN DEFAULT FALSE,
  fecha_completado     TIMESTAMP,
  fecha_creacion       TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_asignaciones_tecnico      ON asignaciones(id_tecnico);
CREATE INDEX idx_asignaciones_beneficiario ON asignaciones(id_beneficiario);
CREATE INDEX idx_asignaciones_completado   ON asignaciones(completado);
CREATE INDEX idx_asignaciones_prioridad    ON asignaciones(prioridad);
CREATE INDEX idx_asignaciones_fecha_limite ON asignaciones(fecha_limite);

COMMENT ON TABLE  asignaciones              IS 'Tareas asignadas a técnicos por coordinadores';


-- ═══════════════════════════════════════════════════════════════════════════
-- 5. PERIODOS_CIERRE
-- ═══════════════════════════════════════════════════════════════════════════
CREATE TABLE periodos_cierre (
  id_periodo       INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  anio             INT NOT NULL CHECK (anio >= 2024),
  mes              INT NOT NULL CHECK (mes BETWEEN 1 AND 12),
  cerrado          BOOLEAN DEFAULT FALSE,
  fecha_cierre     TIMESTAMP,
  id_usuario_cerro INT REFERENCES usuarios(id_usuario) ON DELETE SET NULL,
  notas            TEXT,
  UNIQUE (anio, mes)
);

CREATE INDEX idx_periodos_anio_mes ON periodos_cierre(anio, mes);
CREATE INDEX idx_periodos_cerrado  ON periodos_cierre(cerrado);

COMMENT ON TABLE  periodos_cierre          IS 'Control mensual de períodos de registro de bitácoras';


-- ═══════════════════════════════════════════════════════════════════════════
-- 6. BITACORAS
-- ═══════════════════════════════════════════════════════════════════════════
CREATE TABLE bitacoras (
  id_bitacora             INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  uuid_movil              UUID UNIQUE NOT NULL,
  id_usuario              INT NOT NULL REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
  id_asignacion           INT REFERENCES asignaciones(id_asignacion) ON DELETE SET NULL,
  id_periodo              INT REFERENCES periodos_cierre(id_periodo) ON DELETE SET NULL,
  fecha_hora_inicio       TIMESTAMP NOT NULL,
  latitud                 DECIMAL(10,8) NOT NULL,
  longitud                DECIMAL(11,8) NOT NULL,
  precision_gps           DECIMAL(5,2),
  fecha_hora_fin          TIMESTAMP,
  latitud_fin             DECIMAL(10,8),
  longitud_fin            DECIMAL(11,8),
  precision_gps_fin       DECIMAL(5,2),
  tipo_bitacora           VARCHAR(20) NOT NULL DEFAULT 'BENEFICIARIO'
                            CHECK (tipo_bitacora IN ('BENEFICIARIO', 'ACTIVIDAD_GENERAL')),
  calificacion            SMALLINT CHECK (calificacion BETWEEN 1 AND 5),
  reporte                 TEXT,
  firma_url               VARCHAR(500),
  foto_confirmacion_url   VARCHAR(500),
  datos_extendidos        JSONB DEFAULT '{}',
  estatus_sincronizacion VARCHAR(20) DEFAULT 'RECIBIDO'
                            CHECK (estatus_sincronizacion IN ('LOCAL', 'RECIBIDO', 'SINCRONIZADO')),
  dispositivo_info        JSONB DEFAULT '{}',
  fecha_registro_servidor TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_bitacoras_fecha       ON bitacoras(fecha_hora_inicio);
CREATE INDEX idx_bitacoras_usuario     ON bitacoras(id_usuario);
CREATE INDEX idx_bitacoras_uuid        ON bitacoras(uuid_movil);
CREATE INDEX idx_bitacoras_periodo     ON bitacoras(id_periodo);
CREATE INDEX idx_bitacoras_tipo        ON bitacoras(tipo_bitacora);
CREATE INDEX idx_bitacoras_calificacion ON bitacoras(calificacion);
CREATE INDEX idx_bitacoras_asignacion  ON bitacoras(id_asignacion);

COMMENT ON TABLE  bitacoras                     IS 'Registro de visitas técnicas';


-- ═══════════════════════════════════════════════════════════════════════════
-- 7. EVIDENCIAS
-- ═══════════════════════════════════════════════════════════════════════════
CREATE TABLE evidencias (
  id_evidencia         INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  id_bitacora          INT NOT NULL REFERENCES bitacoras(id_bitacora) ON DELETE CASCADE,
  url_archivo          VARCHAR(500) NOT NULL,
  cloudinary_public_id VARCHAR(300),
  tipo_archivo         VARCHAR(20)
                         CHECK (tipo_archivo IN ('FOTO', 'VIDEO', 'DOCUMENTO')),
  descripcion          TEXT,
  orden                SMALLINT DEFAULT 0,
  fecha_subida         TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_evidencias_bitacora ON evidencias(id_bitacora);
CREATE INDEX idx_evidencias_tipo     ON evidencias(tipo_archivo);

COMMENT ON TABLE  evidencias IS 'Fotos y documentos adjuntos a cada bitácora';


-- ═══════════════════════════════════════════════════════════════════════════
-- 8. NOTIFICACIONES
-- ═══════════════════════════════════════════════════════════════════════════
CREATE TABLE notificaciones (
  id_notificacion INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  id_usuario      INT REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
  titulo          VARCHAR(150) NOT NULL,
  mensaje         TEXT NOT NULL,
  tipo            VARCHAR(20)
                    CHECK (tipo IN ('ALERTA', 'INFO', 'TAREA')),
  origen          VARCHAR(20) DEFAULT 'SISTEMA'
                    CHECK (origen IN ('SISTEMA', 'ADMIN', 'COORDINADOR')),
  leida           BOOLEAN DEFAULT FALSE,
  fecha_creacion  TIMESTAMP DEFAULT NOW(),
  fecha_lectura   TIMESTAMP
);

CREATE INDEX idx_notificaciones_usuario ON notificaciones(id_usuario);
CREATE INDEX idx_notificaciones_leida   ON notificaciones(leida);
CREATE INDEX idx_notificaciones_tipo    ON notificaciones(tipo);

COMMENT ON TABLE  notificaciones IS 'Alertas y mensajes para usuarios';


-- ═══════════════════════════════════════════════════════════════════════════
-- 9. SYNC_LOG
-- ═══════════════════════════════════════════════════════════════════════════
CREATE TABLE sync_log (
  id_sync       INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  uuid_movil    UUID NOT NULL,
  tipo_registro VARCHAR(20) DEFAULT 'BITACORA'
                  CHECK (tipo_registro IN ('BITACORA', 'BENEFICIARIO', 'EVIDENCIA')),
  id_usuario    INT REFERENCES usuarios(id_usuario) ON DELETE SET NULL,
  fecha_intento TIMESTAMP DEFAULT NOW(),
  resultado     VARCHAR(20)
                  CHECK (resultado IN ('Ok', 'DUPLICADO', 'ERROR')),
  detalle       TEXT
);

CREATE INDEX idx_sync_log_usuario ON sync_log(id_usuario);
CREATE INDEX idx_sync_log_uuid    ON sync_log(uuid_movil);
CREATE INDEX idx_sync_log_fecha   ON sync_log(fecha_intento);
CREATE INDEX idx_sync_log_resultado ON sync_log(resultado);

COMMENT ON TABLE sync_log IS 'Historial de sincronizaciones offline';


-- ═══════════════════════════════════════════════════════════════════════════
-- 10. AUDITORIA
-- ═══════════════════════════════════════════════════════════════════════════
CREATE TABLE auditoria (
  id_auditoria  INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  id_usuario    INT REFERENCES usuarios(id_usuario) ON DELETE SET NULL,
  tabla         VARCHAR(50) NOT NULL,
  id_registro   INT,
  accion        VARCHAR(20)
                  CHECK (accion IN ('INSERT', 'UPDATE', 'DELETE')),
  antes         JSONB,
  despues       JSONB,
  fecha_accion  TIMESTAMP DEFAULT NOW(),
  ip_address    VARCHAR(45)
);

CREATE INDEX idx_auditoria_usuario ON auditoria(id_usuario);
CREATE INDEX idx_auditoria_tabla   ON auditoria(tabla);
CREATE INDEX idx_auditoria_fecha   ON auditoria(fecha_accion);
CREATE INDEX idx_auditoria_accion  ON auditoria(accion);

COMMENT ON TABLE auditoria IS 'Log de cambios críticos en el sistema';


-- ═══════════════════════════════════════════════════════════════════════════
-- 11. CONFIGURACION_SISTEMA
-- ═══════════════════════════════════════════════════════════════════════════
CREATE TABLE configuracion_sistema (
  id_config           INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  clave               VARCHAR(100) UNIQUE NOT NULL,
  valor               TEXT,
  tipo                VARCHAR(20) DEFAULT 'texto'
                        CHECK (tipo IN ('texto', 'color', 'url_imagen', 'booleano', 'json')),
  descripcion         VARCHAR(255),
  fecha_actualizacion TIMESTAMP DEFAULT NOW(),
  id_usuario_modifico INT REFERENCES usuarios(id_usuario) ON DELETE SET NULL
);

CREATE INDEX idx_configuracion_clave ON configuracion_sistema(clave);

COMMENT ON TABLE  configuracion_sistema IS 'Configuración visual e institucional';


-- ═══════════════════════════════════════════════════════════════════════════
-- 12. PASSWORD_RESET_TOKENS
-- ═══════════════════════════════════════════════════════════════════════════
CREATE TABLE password_reset_tokens (
  id_token       INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  id_usuario     INT NOT NULL REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
  token          VARCHAR(128) UNIQUE NOT NULL,
  tipo           VARCHAR(20) NOT NULL DEFAULT 'EMAIL'
                   CHECK (tipo IN ('EMAIL', 'MANUAL')),
  usado          BOOLEAN DEFAULT FALSE,
  fecha_expira   TIMESTAMP NOT NULL,
  fecha_uso      TIMESTAMP,
  ip_solicitante VARCHAR(45),
  fecha_creacion TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_prt_token   ON password_reset_tokens(token);
CREATE INDEX idx_prt_usuario ON password_reset_tokens(id_usuario);
CREATE INDEX idx_prt_usado   ON password_reset_tokens(usado);

COMMENT ON TABLE  password_reset_tokens IS 'Tokens para recuperación de código';


-- ═══════════════════════════════════════════════════════════════════════════
-- 13. SESIONES_APP
-- ═══════════════════════════════════════════════════════════════════════════
CREATE TABLE sesiones_app (
  id_sesion        INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  id_usuario       INT NOT NULL REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
  token_hash       VARCHAR(64) NOT NULL,
  dispositivo      VARCHAR(200),
  push_token       VARCHAR(255),
  activa           BOOLEAN DEFAULT TRUE,
  ultima_actividad TIMESTAMP DEFAULT NOW(),
  fecha_creacion   TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_sesiones_usuario ON sesiones_app(id_usuario);
CREATE INDEX idx_sesiones_activa  ON sesiones_app(activa);
CREATE INDEX idx_sesiones_token   ON sesiones_app(token_hash);

COMMENT ON TABLE  sesiones_app IS 'Sesiones activas de la app móvil';


-- ═══════════════════════════════════════════════════════════════════════════
-- 14. ERROR_LOG
-- ═══════════════════════════════════════════════════════════════════════════
CREATE TABLE error_log (
  id_error          INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  origen            VARCHAR(20) NOT NULL
                      CHECK (origen IN ('WEB', 'MOVIL', 'API', 'SYNC', 'SISTEMA')),
  entorno           VARCHAR(10) NOT NULL DEFAULT 'production'
                      CHECK (entorno IN ('development', 'staging', 'production')),
  endpoint          VARCHAR(255),
  metodo_http       VARCHAR(10),
  mensaje_error     TEXT NOT NULL,
  stack_trace       TEXT,
  codigo_http       INT,
  id_usuario        INT REFERENCES usuarios(id_usuario) ON DELETE SET NULL,
  uuid_movil        UUID,
  payload_entrada   JSONB DEFAULT '{}',
  info_extra        JSONB DEFAULT '{}',
  ip_address        VARCHAR(45),
  user_agent        VARCHAR(500),
  resuelto          BOOLEAN DEFAULT FALSE,
  fecha_resolucion  TIMESTAMP,
  notas_resolucion  TEXT,
  fecha_error       TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_error_log_fecha    ON error_log(fecha_error);
CREATE INDEX idx_error_log_origen   ON error_log(origen);
CREATE INDEX idx_error_log_resuelto ON error_log(resuelto);
CREATE INDEX idx_error_log_codigo   ON error_log(codigo_http);

COMMENT ON TABLE  error_log IS 'Log centralizado de errores';


-- ═══════════════════════════════════════════════════════════════════════════
-- 15. PLANTILLAS_BITACORA
-- ═══════════════════════════════════════════════════════════════════════════
CREATE TABLE plantillas_bitacora (
  id_plantilla        INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  nombre              VARCHAR(100) NOT NULL UNIQUE,
  descripcion         TEXT,
  contenido_html      TEXT NOT NULL,
  es_predeterminada   BOOLEAN DEFAULT FALSE,
  activa              BOOLEAN DEFAULT TRUE,
  id_usuario_creo     INT REFERENCES usuarios(id_usuario) ON DELETE SET NULL,
  id_usuario_modifico INT REFERENCES usuarios(id_usuario) ON DELETE SET NULL,
  fecha_creacion      TIMESTAMP DEFAULT NOW(),
  fecha_modificacion  TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_plantillas_activa       ON plantillas_bitacora(activa);
CREATE INDEX idx_plantillas_predeterminada ON plantillas_bitacora(es_predeterminada);

COMMENT ON TABLE  plantillas_bitacora IS 'Plantillas HTML para generar PDFs de bitácoras';


-- ═══════════════════════════════════════════════════════════════════════════
-- 16. FORMULARIOS_BENEFICIARIO
-- ═══════════════════════════════════════════════════════════════════════════
CREATE TABLE formularios_beneficiario (
  id_formulario       INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  nombre              VARCHAR(100) NOT NULL UNIQUE,
  descripcion         TEXT,
  campo_config        JSONB NOT NULL DEFAULT '[]',
  es_activo           BOOLEAN DEFAULT FALSE,
  version             INT DEFAULT 1,
  id_usuario_creo     INT REFERENCES usuarios(id_usuario) ON DELETE SET NULL,
  id_usuario_modifico INT REFERENCES usuarios(id_usuario) ON DELETE SET NULL,
  fecha_creacion      TIMESTAMP DEFAULT NOW(),
  fecha_publicacion   TIMESTAMP
);

CREATE INDEX idx_formularios_activo ON formularios_beneficiario(es_activo);

COMMENT ON TABLE  formularios_beneficiario IS 'Configuración dinámica del formulario de alta de beneficiarios';


-- ═══════════════════════════════════════════════════════════════════════════
-- DATOS INICIALES
-- ═══════════════════════════════════════════════════════════════════════════

-- Zonas geográficas del estado de Hidalgo
INSERT INTO zonas (nombre, descripcion) VALUES
  ('Zona Norte',  'Región norte del estado de Hidalgo'),
  ('Zona Sur',    'Región sur del estado de Hidalgo'),
  ('Zona Centro', 'Región central del estado de Hidalgo'),
  ('Zona Este',   'Región este del estado de Hidalgo'),
  ('Zona Oeste',  'Región oeste del estado de Hidalgo');

-- Configuración institucional inicial
INSERT INTO configuracion_sistema (clave, valor, tipo, descripcion) VALUES
  ('logo_principal_url',  '',                    'url_imagen', 'URL del logotipo principal'),
  ('logo_secundario_url', '',                    'url_imagen', 'URL del logotipo secundario'),
  ('color_primario',      '#621132',             'color',      'Color guinda institucional'),
  ('color_secundario',   '#b38e5d',             'color',      'Color dorado institucional'),
  ('nombre_sistema',     'SADERH',             'texto',      'Nombre corto del sistema'),
  ('institucion',        'Secretaría de Agricultura y Desarrollo Rural · Hidalgo', 'texto', 'Nombre de la institución'),
  ('version_sistema',    '2.0.0',               'texto',      'Versión actual del sistema'),
  ('max_fotos_bitacora', '10',                 'texto',      'Máximo de fotos por bitácora'),
  ('modo_mantenimiento', 'false',               'booleano',   'Modo mantenimiento');

-- Período inicial (mes actual)
INSERT INTO periodos_cierre (anio, mes, cerrado) VALUES
  (2026, 3, FALSE);

-- Usuario SUPER_ADMIN inicial (código: 00001, password: admin123)
INSERT INTO usuarios (nombre_completo, email, codigo_acceso, codigo_acceso_hash, rol, especialidad, activo) VALUES
  ('Administrador SADERH', 'admin@saderh.gob.mx', '00001', '$2a$10$rXnLkqJqKqKqKqKqKqKqKuqKqKqKqKqKqKqKqKqKqKqKqKqKqKqKqKq', 'SUPER_ADMIN', NULL, TRUE);

-- Formulario de beneficiario predeterminado
INSERT INTO formularios_beneficiario (nombre, descripcion, campo_config, es_activo, version) VALUES (
  'Formulario Base SADERH 2026',
  'Formulario estándar para registro de beneficiarios',
  '[
    {"id":"campo_nombre","tipo":"text","etiqueta":"Nombre completo","placeholder":"Ej: Juan Pérez","requerido":true,"orden":1},
    {"id":"campo_curp","tipo":"text","etiqueta":"CURP","placeholder":"18 caracteres","requerido":false,"orden":2},
    {"id":"campo_municipio","tipo":"text","etiqueta":"Municipio","placeholder":"Ej: Pachuca","requerido":true,"orden":3},
    {"id":"campo_localidad","tipo":"text","etiqueta":"Localidad","placeholder":"Nombre de la localidad","requerido":true,"orden":4},
    {"id":"campo_cadena","tipo":"select","etiqueta":"Cadena productiva","requerido":true,"opciones":["AGRICOLA","AGROPECUARIO"],"orden":5},
    {"id":"campo_telefono","tipo":"tel","etiqueta":"Teléfono","placeholder":"10 dígitos","requerido":false,"orden":6},
    {"id":"campo_gps","tipo":"gps","etiqueta":"Ubicación GPS","requerido":false,"orden":7}
  ]',
  TRUE,
  '1.0.0'
);

-- Plantilla de bitácora
INSERT INTO plantillas_bitacora (nombre, descripcion, contenido_html, es_predeterminada, activa) VALUES (
  'Plantilla Estándar SADERH',
  'Plantilla oficial con colores institucionales',
  '<!DOCTYPE html><html><head><style>body{font-family:Arial;font-size:13px;}.encabezado{background:#621132;color:white;padding:16px;}</style></head><body><div class="encabezado"><h1>Bitácora de Visita Técnica</h1><p>SADERH - Gobierno del Estado de Hidalgo</p></div></body></html>',
  TRUE,
  TRUE
);

-- ═══════════════════════════════════════════════════════════════════════════
-- RESUMEN: 16 tablas creadas correctamente
-- ═══════════════════════════════════════════════════════════════════════════

