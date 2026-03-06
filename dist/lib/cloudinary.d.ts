import { v2 as cloudinary } from 'cloudinary';
export interface UploadResult {
    url: string;
    public_id: string;
    secure_url: string;
}
export declare const subirArchivo: (fileBuffer: Buffer, folder: string, resourceType?: "image" | "raw" | "video") => Promise<UploadResult>;
export declare const eliminarArchivo: (publicId: string) => Promise<void>;
export default cloudinary;
//# sourceMappingURL=cloudinary.d.ts.map