# --- Estágio 1: Dependências (TODAS) ---
# Usamos uma imagem base leve do Node.js (Alpine)
FROM node:18-alpine AS dependencies
WORKDIR /app

# Copia apenas os arquivos de gerenciamento de pacotes
COPY package.json package-lock.json* ./
# Se você usa pnpm ou yarn, ajuste os arquivos acima (ex: pnpm-lock.yaml)

# Instala TODAS as dependências (prod + dev)
# Esta é a principal mudança!
RUN npm install

# --- Estágio 2: Build da Aplicação ---
FROM node:18-alpine AS builder
WORKDIR /app

# Copia TODAS as dependências já instaladas
COPY --from=dependencies /app/node_modules ./node_modules

# Copia todo o código-fonte da aplicação
COPY . .

# (Opcional) Se você precisar de variáveis de ambiente NO BUILD:
# ARG NEXT_PUBLIC_API_URL
# ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}

# Executa o script de build (agora deve funcionar)
RUN npm run build

# --- Estágio 3: Imagem Final de Produção ---
# Usamos a mesma imagem base leve
FROM node:18-alpine AS runner
WORKDIR /app

# Define o ambiente como produção
ENV NODE_ENV=production

# Copia os arquivos otimizados do modo 'standalone' do estágio de build
# O 'standalone' já inclui um 'node_modules' mínimo e correto
COPY --from=builder /app/.next/standalone ./

# Copia as pastas 'public' e 'static'
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/static ./.next/static

# Expõe a porta que o Next.js usa por padrão
EXPOSE 3000

# Correção do aviso "LegacyKeyValueFormat" que você mencionou
ENV PORT=3000

# Comando para iniciar o servidor Next.js otimizado
CMD ["node", "server.js"]