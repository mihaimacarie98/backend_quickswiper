FROM node:18

# Set the working directory
WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install node-pre-gyp globally to avoid permission issues
#RUN npm install -g node-pre-gyp

# Install dependencies
RUN npm install

# Rebuild bcrypt from source to ensure compatibility
#RUN npm rebuild bcrypt --build-from-source

# Copy the rest of the application code
COPY . .

# Expose the port the app runs on
EXPOSE 5000

# Command to run the application
CMD ["npm", "start"]
