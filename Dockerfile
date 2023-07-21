FROM node:16-alpine
# Downgrading from 19 -> 16 (more stable) fixed the python issue I was getting
# Specify Linux OS to package

EXPOSE 3000

COPY package.json /app/
COPY src /app/src
COPY RNG /app/RNG
COPY data /app/data

# copy both of these into the image's container directory

WORKDIR /app/
# cd into the /app/ directory immediatley
# this is where we want to execute all of our commands from

RUN npm install 
# install everything in package.json

CMD ["npm", "start"]
