FROM node:24-slim

WORKDIR /app

RUN apt-get update && \
    apt-get install -y python3 make g++ && \
    rm -rf /var/lib/apt/lists/*

EXPOSE 3000

CMD ["npm", "run", "dev"]
