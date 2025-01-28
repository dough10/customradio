# Build stage
FROM node:lts-slim AS build

WORKDIR /usr/src/app

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
COPY --chown=node:node --from=build /usr/src/app/public ./public
COPY --chown=node:node --from=build /usr/src/app/util ./util
COPY --chown=node:node --from=build /usr/src/app/routes ./routes
COPY --chown=node:node --from=build /usr/src/app/node_modules ./node_modules

# Expose the application port
EXPOSE 3000/tcp

# Run the application using dumb-init for proper signal handling
CMD ["dumb-init", "node", "index.js"]
