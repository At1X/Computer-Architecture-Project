# Use the official Node.js image as the base
FROM node:18-alpine

# Set the working directory
WORKDIR /app

# # Install dependencies
COPY package.json ./
RUN npm install

# Copy the built Next.js app
COPY . .

# Build the Next.js app
RUN npm run build

# Expose the port that the Next.js app will listen on
EXPOSE 5173

# Start the Next.js app
CMD ["npm", "run", "dev"]
