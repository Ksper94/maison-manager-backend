// src/routes/uploadRoutes.ts
import { Router } from 'express';
import multer from 'multer';
import { Request, Response } from 'express';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';

// Configuration de Cloudinary avec vos identifiants
cloudinary.config({
  cloud_name: 'dunhhyfis', // Remplacez par votre Cloud Name
  api_key: '922713258614472', // Remplacez par votre API Key
  api_secret: 'wLJ0LPTUpCd6ae0rAhiYnLHl7UM', // Remplacez par votre API Secret
});

// Configuration de Multer pour uploader vers Cloudinary
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: (req, file) => ({
    folder: 'avatars',              // Dossier où les avatars seront stockés sur Cloudinary
    allowed_formats: ['jpg', 'png'], // Formats d'image autorisés
    transformation: [{ width: 150, height: 150, crop: 'fill' }], // Redimensionnement (facultatif)
  }),
});

const upload = multer({ storage });

// Endpoint pour uploader un avatar
const router = Router();
router.post('/avatar', upload.single('avatar'), (req: Request, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ message: 'Aucune image fournie' });
  }

  // Récupérer l'URL publique générée par Cloudinary
  const imageUrl = (req.file as any).path; // L'URL est fournie par Cloudinary
  return res.status(200).json({ url: imageUrl });
});

export default router;