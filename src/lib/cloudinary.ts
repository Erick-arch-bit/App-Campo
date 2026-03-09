import { v2 as cloudinary } from 'cloudinary'
import config from '../config'

// Configurar Cloudinary
cloudinary.config({
  cloud_name: config.cloudinary.cloudName,
  api_key: config.cloudinary.apiKey,
  api_secret: config.cloudinary.apiSecret,
})

export interface UploadResult {
  url: string
  public_id: string
  secure_url: string
}

export const subirArchivo = async (
  fileBuffer: Buffer,
  folder: string,
  resourceType: 'image' | 'raw' | 'video' = 'image'
): Promise<UploadResult> => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: `${config.cloudinary.folder}/${folder}`,
        resource_type: resourceType,
      },
      (error, result) => {
        if (error) {
          reject(error)
          return
        }
        
        if (!result) {
          reject(new Error('No se recibió resultado de Cloudinary'))
          return
        }
        
        resolve({
          url: result.url,
          public_id: result.public_id,
          secure_url: result.secure_url,
        })
      }
    )

    uploadStream.end(fileBuffer)
  })
}

export const eliminarArchivo = async (publicId: string): Promise<void> => {
  await cloudinary.uploader.destroy(publicId)
}

export default cloudinary
