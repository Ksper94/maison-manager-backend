// src/routes/uploadRoutes.ts
import { Router } from 'express';
import { Request, Response } from 'express';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';

/**
 * Configuration de Cloudinary
 * (Remplacez ces valeurs par les vôtres si vous ne les chargez pas via variables d'environnement)
 */
cloudinary.config({
  cloud_name: 'dunhhyfis',         // Votre Cloud Name
  api_key: '922713258614472',      // Votre API Key
  api_secret: 'wLJ0LPTUpCd6ae0rAhiYnLHl7UM', // Votre API Secret
});

/**
 * Configuration de Multer pour stocker les fichiers
 * directement sur Cloudinary (multer-storage-cloudinary).
 * On utilise une fonction pour `params` pour contourner
 * les limitations de typage.
 */
const storage = new CloudinaryStorage({
  cloudinary,
  params: (req, file) => ({
    folder: 'avatars',                   // Dossier Cloudinary
    allowed_formats: ['jpg', 'png'],     // Formats autorisés
    transformation: [{ width: 150, height: 150, crop: 'fill' }], // Redimensionnement
  }),
});

// On crée un middleware Multer basé sur ce storage Cloudinary
const upload = multer({ storage });

// Notre router Express pour les endpoints d’upload
const router = Router();

/**
 * POST /api/upload/avatar
 *  -> Upload du champ "avatar" vers Cloudinary
 *  -> Retourne l'URL Cloudinary dans { url: "..." }
 */
router.post('/avatar', upload.single('avatar'), (req: Request, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ message: 'Aucune image fournie' });
  }

  // Sur multer-storage-cloudinary, req.file.path = l’URL Cloudinary finale
  // (req.file est typé, mais on utilise `as any` si besoin pour accéder à `path`)
  const imageUrl = (req.file as any).path;

  return res.status(200).json({ url: imageUrl });
});

export default router;
