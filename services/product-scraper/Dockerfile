FROM mcr.microsoft.com/playwright:v1.58.2-noble
WORKDIR /app
COPY services/product-scraper/runtime-package.json ./package.json
COPY services/product-scraper/package.json ./services/product-scraper/package.json
# The service uses an exact Playwright version and the base image already supplies
# Chromium. It intentionally has no separate lockfile, so npm ci is not usable.
RUN cd services/product-scraper && npm install --omit=dev --ignore-scripts --package-lock=false
COPY server/config/env.js ./server/config/env.js
COPY server/utils/size-table.js ./server/utils/size-table.js
COPY server/services/product-metadata ./server/services/product-metadata
COPY server/services/size-table ./server/services/size-table
COPY server/services/size-extraction/*.mjs ./server/services/size-extraction/
COPY services/product-scraper/src ./services/product-scraper/src
ENV NODE_ENV=production
ENV PORT=10000
USER pwuser
EXPOSE 10000
CMD ["node", "services/product-scraper/src/server.mjs"]
