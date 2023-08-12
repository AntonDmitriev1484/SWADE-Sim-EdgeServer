FROM node:14-alpine
# Downgrading from 19 -> 16 (more stable) fixed the python issue I was getting
# Specify Linux OS to package

EXPOSE 3000

COPY package.json /app/
COPY src /app/src
COPY RNG /app/RNG
COPY data /app/data
COPY mock-client /app/mock-client
COPY mock-client-data /app/mock-client-data
COPY util /app/util

# copy both of these into the image's container directory

WORKDIR /app/
# cd into the /app/ directory immediatley
# this is where we want to execute all of our commands from

RUN npm install 
# install everything in package.json

CMD ["npm", "start"]
