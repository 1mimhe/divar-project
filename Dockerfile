# Node 22.6+ runs the TypeScript sources natively (--experimental-strip-types),
# so the image needs no compile step: install production deps and run.
FROM node:22-slim

ENV NODE_ENV=production

WORKDIR /srv/app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev --no-fund --no-audit

COPY src ./src
COPY public ./public
COPY scripts ./scripts
COPY divar-store.categories.json ./

# Uploads live on a volume in production (see docker-compose.yml / render.yaml).
RUN mkdir -p public/uploads && chown -R node:node /srv/app

USER node

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/health').then((r) => { if (!r.ok) process.exit(1) }).catch(() => process.exit(1))"

CMD ["node", "--experimental-strip-types", "src/server.ts"]
