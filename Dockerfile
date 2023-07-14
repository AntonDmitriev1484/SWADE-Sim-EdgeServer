FROM node:19-alpine 
# Specify Linux OS to package

EXPOSE 3000
EXPOSE 3001

COPY package.json /app/
COPY src /app/
# copy both of these into the image's container directory

WORKDIR /app/
# cd into the /app/ directory immediatley
# this is where we want to execute all of our commands from

RUN npm install 
# install everything in package.json

CMD ["node", "index.js"]
