import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { errorHandler } from './middlewares/errorHandler';
import { router as mainRouter } from './routes';
import foyerRoute from './routes/foyerRoutes';
import multer from 'multer';
import path from 'path';

const app = express();

// Middlewares globaux
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());

// Configuration de Multer pour stocker les fichiers uploadés
const storage = multer.diskStorage({
  destination: './uploads/', // Dossier de destination des avatars
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`); // Nom unique basé sur la date
  },
});
const upload = multer({ storage });

// Servir les fichiers statiques du dossier uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Endpoint pour uploader un avatar
app.post('/api/upload/avatar', upload.single('avatar'), (req: Request, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ message: 'Aucune image fournie' });
  }

  // Générer l'URL publique de l'image
  const imageUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
  return res.status(200).json({ url: imageUrl });
});

// Middleware pour l'authentification (simplifié)
app.use((req: Request, res: Response, next: NextFunction) => {
  // Ici, vous pourriez vérifier le token JWT dans le header Authorization
  // et extraire l'userId pour l'ajouter à req
  // Pour l'instant, on simule l'ajout d'un userId
  (req as any).userId = 'someUserId'; // Remplacez par la logique d'authentification réelle
  next();
});

// Routes principales
app.use('/api', mainRouter);

// Routes spécifiques aux foyers
app.use('/api/foyer', foyerRoute);

// Gestion des erreurs
app.use(errorHandler);

export default app;