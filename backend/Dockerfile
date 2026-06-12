FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY prisma ./prisma
RUN npx prisma generate

COPY . .

EXPOSE 3000

# En arrencar: sincronitza l'esquema, crea els professors inicials i engega l'API
CMD ["sh", "-c", "npx prisma db push && node prisma/seed.js && node src/index.js"]
