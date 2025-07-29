FROM cloudcustodian/c7n:0.9.42.0

LABEL org.opencontainers.image.source=https://github.com/trackit/wafr-automation-tool
USER root
RUN apt update -y && apt install curl unzip -y

RUN curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
RUN unzip awscliv2.zip
RUN ./aws/install
RUN rm awscliv2.zip
RUN rm -rf aws
