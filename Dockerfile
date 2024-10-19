# Build stage
FROM node:lts-slim AS build

WORKDIR /usr/src/app

# Install necessary dependencies for Puppeteer and Chrome in the build stage
RUN apt-get update && apt-get install -y \
  libx11-6 \
  libx11-xcb1 \
  libxcb1 \
  libxcomposite1 \
  libxdamage1 \
  libxext6 \
  libxi6 \
  libxtst6 \
  fonts-liberation \
  libnss3 \
  libnspr4 \
  libatk1.0-0 \
  libatk-bridge2.0-0 \
  libasound2 \
  libpangocairo-1.0-0 \
  libxrandr2 \
  libcups2 \
  libpangoft2-1.0-0 \
  libjpeg-dev \
  libx11-dev \
  libxkbcommon-x11-0 \
  libgbm1 \
  libpango1.0-0 \
  xdg-utils \
  wget \
  libxcursor1 \
  libxss1 \
  libgtk-3-0 \
  libgdk-pixbuf2.0-0 \
  libglib2.0-0 \
  --no-install-recommends && rm -rf /var/lib/apt/lists/*

# Copy package.json and install node dependencies
COPY package*.json ./
RUN npm install

# Copy remaining application files
COPY --chown=node:node . .

# Run the build process
RUN npm run build

# Production stage
FROM node:lts-slim

# Install dumb-init in the production stage
RUN apt-get update && apt-get install -y --no-install-recommends dumb-init && rm -rf /var/lib/apt/lists/*

# Set environment variables
ENV NODE_ENV=production
ENV TZ="America/Chicago"

WORKDIR /usr/src/app

# Copy built assets from the build stage
COPY --chown=node:node --from=build /usr/src/app/package*.json ./
COPY --chown=node:node --from=build /usr/src/app/index.js ./
COPY --chown=node:node --from=build /usr/src/app/html ./html
COPY --chown=node:node --from=build /usr/src/app/util ./util
COPY --chown=node:node --from=build /usr/src/app/routes ./routes
COPY --chown=node:node --from=build /usr/src/app/node_modules ./node_modules

# Expose the application port
EXPOSE 3000/tcp

# Run the application using dumb-init for proper signal handling
CMD ["dumb-init", "node", "index.js"]
