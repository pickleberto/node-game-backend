# Using a standard Node.js image instead of Alpine
FROM node:18

# Install required libraries for sharp
RUN apt-get update && apt-get install -y \
    libvips-dev \
    fftw-dev \
    build-essential

# Set up app directory
WORKDIR /app

# Copy package and yarn lock files
COPY ./backend/package.json ./backend/yarn.lock ./

# Explicitly install a compatible version of sharp
RUN yarn add sharp@latest

# Increase npm logging for debugging (optional)
ENV npm_config_loglevel verbose

# Install other dependencies
RUN yarn config set network-timeout 600000 -g && yarn install

# Copy the rest of the application files
COPY ./.env ./
COPY ./backend/src ./src  
COPY ./backend ./
COPY ./backend/tsconfig.json ./tsconfig.json


# Environment variables
ENV PUBLIC_URL ${PUBLIC_URL}
ENV NODE_ENV ${NODE_ENV}

# Build the Strapi application
RUN yarn build

# Expose Strapi port
EXPOSE 1337

# Start the application
CMD ["yarn", "start"]