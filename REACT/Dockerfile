# Step 1: Build the React application
FROM node:20-alpine AS build

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy source code and build
COPY . .
RUN npm run build


# Step 2: Serve using Nginx
FROM nginx:stable-alpine

# Create the directory structure explicitly to avoid pathing errors
RUN mkdir -p /usr/share/nginx/html/energymatrix/uat

# Copy the built React app to the UAT subfolder
COPY --from=build /app/dist /usr/share/nginx/html/energymatrix/uat

# Copy custom Nginx configuration
COPY nginx/default.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]