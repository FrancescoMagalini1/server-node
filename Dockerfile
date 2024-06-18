FROM node:20 AS build

WORKDIR /srv

# Bundle app source
COPY . .

RUN npm install


# For runtime
FROM node:20-alpine as runtime

WORKDIR /srv

COPY --from=build /srv .

EXPOSE 3000

CMD [ "node", "--experimental-wasm-modules", "app.js" ]