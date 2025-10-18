FROM node:18-alpine
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install --production
COPY . ./
RUN npm run prisma:generate || true
EXPOSE 4000
CMD ["node","index.js"]
