# Stage 1: Build the frontend application
FROM node:18 AS build

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# Stage 2: Serve the frontend application with Nginx
FROM nginx:alpine

COPY --from=build /usr/src/app/dist /usr/share/nginx/html/

# Copy the Nginx configuration
COPY default.conf /etc/nginx/conf.d/default.conf

# Copy Let's Encrypt certificates
COPY fullchain.pem /etc/nginx/fullchain.pem
COPY privkey.pem /etc/nginx/privkey.pem
#COPY /etc/letsencrypt/options-ssl-nginx.conf /etc/letsencrypt/options-ssl-nginx.conf
#COPY /etc/letsencrypt/ssl-dhparams.pem /etc/letsencrypt/ssl-dhparams.pem

EXPOSE 80
EXPOSE 443

CMD ["nginx", "-g", "daemon off;"]
