import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { errorHandler } from './middlewares/errorHandler';
import { router as mainRouter } from './routes';
import foyerRoute from './routes/foyerRoute';

const app = express();

// Middlewares globaux
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());

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