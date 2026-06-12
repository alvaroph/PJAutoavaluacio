FROM node:20-slim

# Prisma necessita OpenSSL al sistema; amb Alpine/musl la detecció falla
RUN apt-get update -y \
  && apt-get install -y --no-install-recommends openssl \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY prisma ./prisma
RUN npx prisma generate

COPY . .

EXPOSE 3000

# En arrencar: sincronitza l'esquema, crea els professors inicials i engega l'API
CMD ["sh", "-c", "npx prisma db push && node prisma/seed.js && node src/index.js"]
