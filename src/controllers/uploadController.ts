import { Request, Response } from 'express';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';

// Configuration de Cloudinary avec vos identifiants
cloudinary.config({
  cloud_name: 'dunhhyfis', // Remplacez par votre Cloud Name
  api_key: '922713258614472', // Remplacez par votre API Key
  api_secret: 'wLJ0LPTUpCd6ae0rAhiYnLHl7UM', // Remplacez par votre API Secret
});

// Configuration de Multer pour uploader vers Cloudinary
// Utilisation d'une fonction pour 'params' afin de contourner les erreurs de typage TypeScript
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: (req, file) => ({
    folder: 'avatars', // Dossier où les avatars seront stockés sur Cloudinary
    allowed_formats: ['jpg', 'png'], // Formats autorisés (avec underscore, selon la spec)
    transformation: [{ width: 150, height: 150, crop: 'fill' }], // Redimensionne l'image (optionnel)
  }),
});

const upload = multer({ storage });

// Endpoint pour uploader un avatar
export const uploadAvatar = [
  upload.single('avatar'), // 'avatar' est le nom du champ dans le FormData envoyé par le frontend
  (req: Request, res: Response) => {
    if (!req.file) {
      return res.status(400).json({ message: 'Aucune image fournie' });
    }

    // Cloudinary fournit l'URL publique de l'image uploadée
    const imageUrl = (req.file as any).path; // Assertion temporaire pour accéder à 'path'
    return res.status(200).json({ url: imageUrl });
  },
];