const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

async function subirFoto(dataUrl, { actaId, itemId }) {
  const res = await cloudinary.uploader.upload(dataUrl, {
    folder: `acta-inteligente/${actaId}/${itemId}`,
    resource_type: 'image',
  });
  return { url: res.secure_url, publicId: res.public_id };
}

async function eliminarFoto(publicId) {
  await cloudinary.uploader.destroy(publicId);
}

module.exports = { subirFoto, eliminarFoto };
