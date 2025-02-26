// src/routes/uploadRoutes.ts
import { Router } from 'express';
import multer from 'multer';
import { Request, Response } from 'express';

const router = Router();

// Configuration de Multer pour stocker les fichiers
const storage = multer.diskStorage({
  destination: './uploads/', // Dossier où les avatars seront stockés
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`); // Nom unique pour chaque fichier
  },
});

const upload = multer({ storage });

// Endpoint pour uploader un avatar
router.post('/avatar', upload.single('avatar'), (req: Request, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ message: 'Aucune image fournie' });
  }

  // Générer l'URL de l'image
  const imageUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
  return res.status(200).json({ url: imageUrl });
});

export default router;