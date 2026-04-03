FROM node:20-slim

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Default command — overridden per-service in docker-compose.yml
CMD ["npm", "run", "dev"]
