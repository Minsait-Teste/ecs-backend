# =========================
# Stage 1 — Build
# =========================
FROM node:18-alpine AS build

WORKDIR /app

# Copia manifests
COPY package*.json ./
COPY tsconfig.json ./

# Instala TODAS as dependências (inclui devDependencies)
RUN npm install

# Copia o código fonte
COPY src ./src

# Compila TypeScript -> dist/
RUN npm run build


# =========================
# Stage 2 — Runtime
# =========================
FROM node:18-alpine

WORKDIR /app

# Copia apenas o necessário para rodar
COPY package*.json ./

# Instala SOMENTE dependências de produção
RUN npm install --omit=dev

# Copia o código compilado
COPY --from=build /app/dist ./dist

# Porta da aplicação
EXPOSE 3000

# Comando de start
CMD ["node", "dist/index.js"]
