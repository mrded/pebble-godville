FROM node:20-alpine

WORKDIR /app

COPY pebble/src/js/ pebble/src/js/
COPY test/ test/

CMD ["node", "test/test.js"]
