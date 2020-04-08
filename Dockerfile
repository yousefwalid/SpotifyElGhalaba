# The Basic Image
FROM node:13-alpine3.11

# Define our working directory where the code will be
WORKDIR  /usr/src/app

# Copy dep files
COPY package*.json ./

# Install deps for production
RUN npm ci --only=production --cache .npm --prefer-offline

# Bundle the app
COPY . .

# Open the app to port 80
EXPOSE 80

# Initial command
CMD npm i; node .
