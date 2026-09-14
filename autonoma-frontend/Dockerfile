FROM node:20-alpine
WORKDIR /app
COPY package.json package-lock.json ./
ENV PUPPETEER_SKIP_DOWNLOAD=true
RUN npm install
COPY . .
EXPOSE 3001
ENV VITE_BACKEND_URL=http://host.docker.internal:8081
CMD ["npm", "start"]
