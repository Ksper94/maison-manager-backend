import { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';

// Configuration de Multer pour stocker les fichiers
const storage = multer.diskStorage({
  destination: './uploads/', // Dossier où les images seront stockées
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`); // Nom unique pour chaque fichier
  },
});

const upload = multer({ storage });

// Endpoint pour uploader un avatar
export const uploadAvatar = [
  upload.single('avatar'), // 'avatar' est le nom du champ dans le FormData envoyé par le frontend
  (req: Request, res: Response) => {
    if (!req.file) {
      return res.status(400).json({ message: 'Aucune image fournie' });
    }

    // Générer l'URL de l'image
    const imageUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
    return res.status(200).json({ url: imageUrl });
  },
];