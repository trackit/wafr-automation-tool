FROM node:22-alpine

LABEL org.opencontainers.image.source=https://github.com/trackit/wafr-automation-tool
WORKDIR /app

RUN apk add --no-cache git bash aws-cli
RUN git clone https://github.com/aquasecurity/cloudsploit.git cloudsploit
RUN git -C cloudsploit checkout 9512e0a3a1499e95ffc9605baba16e8c2c9e1522

RUN npm init --yes \
    && npm install cloudsploit/ \
    && npm link /app/cloudsploit

ENV PATH="$PATH:/app/node_modules/.bin"

ENTRYPOINT ["cloudsploit-scan"]
CMD []
