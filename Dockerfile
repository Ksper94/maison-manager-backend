# Étape 1 : Build
FROM node:18-alpine AS builder
WORKDIR /app

# 1) Installer les dépendances
COPY package*.json ./
RUN npm install

# 2) Copier le code
COPY tsconfig.json ./
COPY src ./src
COPY prisma ./prisma

# 3) Générer Prisma + build
RUN npx prisma generate
RUN npm run build

# Étape 2 : Exécution (image finale)
FROM node:18-alpine
WORKDIR /app

# 4) Copie le package.json pour info (pas obligatoire si on ne refait pas npm install)
COPY --from=builder /app/package*.json ./

# 5) Recopier directement node_modules du builder
COPY --from=builder /app/node_modules ./node_modules

# 6) Copier le dist compilé et le dossier prisma
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

# 7) Copier le .env si nécessaire
COPY .env ./.env

EXPOSE 4000
CMD ["node", "dist/server.js"]
