import http from 'http';
import app from './app';
import { config } from './config/env';

const server = http.createServer(app);

const PORT = config.PORT || 4000;
server.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
});
