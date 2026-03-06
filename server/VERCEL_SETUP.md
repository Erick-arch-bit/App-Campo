# Configuración para desplegar en Vercel

## Estructura del proyecto

```
server/
├── src/
│   ├── index.ts          # Servidor Express
│   ├── db/               # Configuración de base de datos
│   ├── routes/           # Rutas de la API
│   └── ...
├── vercel.json           # Configuración de Vercel
├── package.json          # Dependencias
└── tsconfig.json         # Configuración de TypeScript
```

## Archivos de configuración

### vercel.json
Configura Vercel para usar Express como servidor Node.js:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "src/index.ts",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/src/index.ts"
    },
    {
      "src": "/(.*)",
      "dest": "/src/index.ts"
    }
  ]
}
```

### package.json
Scripts necesarios:

```json
{
  "scripts": {
    "dev": "ts-node-dev --respawn --transpile-only src/index.ts",
    "build": "npx tsc",
    "start": "node dist/index.js",
    "db:init": "ts-node src/db/init.ts"
  }
}
```

### src/index.ts
El servidor debe exportar una función handler para Vercel:

```typescript
import express from 'express'

const app = express()

// ... configuración de rutas y middleware

// Exportar para Vercel
module.exports = app

// Handler de Vercel
export default async function (req: any, res: any) {
  return new Promise((resolve, reject) => {
    app(req, res, (err: any) => {
      if (err) reject(err)
      else resolve(undefined)
    })
  })
}
```

## Pasos para desplegar

### 1. Preparar el repositorio
- El código debe estar en GitHub
- La carpeta `server/` debe contener todos los archivos del servidor

### 2. Importar en Vercel
1. Ve a [vercel.com](https://vercel.com)
2. Click en "Add New..." > "Project"
3. Importa `Erick-arch-bit/Servicio-App-campo`
4. En "Configure Project", selecciona la carpeta `server/`
5. Framework Preset: Other

### 3. Configurar variables de entorno
En Settings > Environment Variables, agrega:

```
SUPABASE_URL=https://gvuzyszsflujzinykqom.supabase.co
SUPABASE_ANON_KEY=tu_anon_key
SUPABASE_SERVICE_ROLE_KEY=tu_service_key
JWT_SECRET=tu_jwt_secret
JWT_SECRET_APP=tu_jwt_app
JWT_SECRET_ADMIN=tu_jwt_admin
APP_HMAC_SECRET=tu_hmac_secret
CLOUDINARY_CLOUD_NAME=api-campo
CLOUDINARY_API_KEY=tu_api_key
CLOUDINARY_API_SECRET=tu_api_secret
ALLOWED_ORIGINS=http://localhost:3000,https://servicio-app-campo.vercel.app
```

### 4. Desplegar
- Click en "Deploy"
- Espera a que termine el build

## URLs de la API

Una vez desplegado:
- **API Base:** `https://servicio-app-campo.vercel.app`
- **Health:** `https://servicio-app-campo.vercel.app/api/health`
- **Auth:** `https://servicio-app-campo.vercel.app/api/auth/login`

## Notas importantes

1. **Express en Vercel:** Vercel usa Serverless Functions, por lo que Express funciona como una función serverless, no como un servidor tradicional persistente.

2. **Tiempo de ejecución:** Las funciones tienen un límite de tiempo (10 segundos en el plan gratuito).

3. **Archivos estáticos:** No se pueden servir archivos estáticos directamente desde Express en Vercel. Necesitarías usar Vercel Storage u otro servicio.

4. **Variables de entorno:** Asegúrate de configurar todas las variables en el panel de Vercel.
