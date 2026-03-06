"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.eliminarArchivo = exports.subirArchivo = void 0;
const cloudinary_1 = require("cloudinary");
// Configurar Cloudinary
cloudinary_1.v2.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});
const subirArchivo = async (fileBuffer, folder, resourceType = 'image') => {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary_1.v2.uploader.upload_stream({
            folder: `${process.env.CLOUDINARY_FOLDER}/${folder}`,
            resource_type: resourceType,
        }, (error, result) => {
            if (error) {
                reject(error);
                return;
            }
            if (!result) {
                reject(new Error('No se recibió resultado de Cloudinary'));
                return;
            }
            resolve({
                url: result.url,
                public_id: result.public_id,
                secure_url: result.secure_url,
            });
        });
        uploadStream.end(fileBuffer);
    });
};
exports.subirArchivo = subirArchivo;
const eliminarArchivo = async (publicId) => {
    await cloudinary_1.v2.uploader.destroy(publicId);
};
exports.eliminarArchivo = eliminarArchivo;
exports.default = cloudinary_1.v2;
//# sourceMappingURL=cloudinary.js.map