FROM node:20-slim

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

RUN apt update \
  && apt install -y --no-install-recommends \
    wget \
    gnupg \
    firefox-esr \
    fonts-ipafont-gothic fonts-wqy-zenhei fonts-thai-tlwg fonts-khmeros fonts-kacst fonts-freefont-ttf \
    libxss1

WORKDIR /app

# Copy the rest of the app
COPY container_src/ .

RUN npm install

EXPOSE 5000

ENTRYPOINT ["node", "script.mjs"]