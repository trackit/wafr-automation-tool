FROM node:22-alpine

WORKDIR /app

RUN apk add --no-cache git bash
RUN git clone https://github.com/aquasecurity/cloudsploit.git cloudsploit

RUN npm init --yes \
    && npm install cloudsploit/ \
    && npm link /app/cloudsploit

ENV PATH="$PATH:/app/node_modules/.bin"

ENTRYPOINT ["cloudsploit-scan"]
CMD []
