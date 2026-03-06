import { v2 as cloudinary } from 'cloudinary'

// Configurar Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
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
        folder: `${process.env.CLOUDINARY_FOLDER}/${folder}`,
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
