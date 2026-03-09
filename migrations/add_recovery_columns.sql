-- Migration: Add recovery code columns to usuarios table
-- Run this SQL in Supabase SQL Editor to enable password recovery functionality

-- Add columns for password recovery
ALTER TABLE usuarios 
ADD COLUMN IF NOT EXISTS codigo_recuperacion VARCHAR(6),
ADD COLUMN IF NOT EXISTS codigo_recuperacion_expira TIMESTAMP WITH TIME ZONE;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_usuarios_codigo_recuperacion 
ON usuarios(codigo_recuperacion) 
WHERE codigo_recuperacion IS NOT NULL;

COMMENT ON COLUMN usuarios.codigo_recuperacion IS 'Código de recuperación de 6 dígitos';
COMMENT ON COLUMN usuarios.codigo_recuperacion_expira IS 'Fecha de expiración del código de recuperación';
