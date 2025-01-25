import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { errorHandler } from './middlewares/errorHandler';
import { router as mainRouter } from './routes';

const app = express();

// Middlewares globaux
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());

// Routes principales
app.use('/api', mainRouter);

// Gestion des erreurs
app.use(errorHandler);

export default app;
