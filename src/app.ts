import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { errorHandler } from './middlewares/errorHandler';
import { router as mainRouter } from './routes';
import foyerRoute from './routes/foyerRoutes';

// Import du router pour Cloudinary
import uploadRoutes from './routes/uploadRoutes';

const app = express();

// Middlewares globaux
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());

// ⛔️ SUPPRIMER la configuration locale de Multer diskStorage
// ⛔️ SUPPRIMER app.use('/uploads', express.static(...));
// Comme on veut des URLs Cloudinary, on n'a plus besoin de servir en local.

// Endpoint pour l'upload d'avatar (vers Cloudinary)
app.use('/api/upload', uploadRoutes);

// Middleware (exemple) pour l'authentification
app.use((req: Request, res: Response, next: NextFunction) => {
  // Exemple : Ajouter un userId fictif
  (req as any).userId = 'someUserId';
  next();
});

// Routes principales
app.use('/api', mainRouter);

// Routes spécifiques aux foyers
app.use('/api/foyer', foyerRoute);

// Gestion des erreurs
app.use(errorHandler);

export default app;
