#!/bin/bash

exec > >(tee -a /var/log/provision.log | logger -t provision) 2>&1
set -euxo pipefail

log() {
  echo ">>> $1"
}

log "Updating system packages"
sudo apt update -y
sudo apt upgrade -y

log "Installing core tools"
sudo apt install -y curl git gnupg build-essential

log "Installing MongoDB 6"
curl -fsSL https://pgp.mongodb.com/server-6.0.asc | sudo gpg -o /usr/share/keyrings/mongodb-server-6.0.gpg --dearmor
echo "deb [ signed-by=/usr/share/keyrings/mongodb-server-6.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt update
sudo apt install -y mongodb-org
sudo systemctl enable mongod
sudo systemctl start mongod
sudo systemctl is-active --quiet mongod || (echo "Mongo failed to start"; exit 1)

log "Installing Node.js 18 and PM2"
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm install -g pm2
pm2 -v || (echo "PM2 install failed"; exit 1)

log "Cloning ChatUI"
sudo git clone https://github.com/huggingface/chat-ui.git /opt/chatui || true
sudo chown -R ubuntu:ubuntu /opt/chatui
cd /opt/chatui

log "Patching vite to bind to all interfaces"
sed -i 's|"dev": "vite dev"|"dev": "vite dev --host 0.0.0.0"|' package.json

log "Setting up .env.local"
cp .env .env.local
echo "MONGODB_URL=mongodb://localhost:27017" >> .env.local
echo "HF_TOKEN=your_token_here" >> .env.local

log "Installing ChatUI dependencies"
npm install

log "Starting ChatUI with PM2"
pm2 start "npm run dev" --name chatui
pm2 save

log "Installing NGINX"
sudo apt install -y nginx
sudo systemctl enable nginx
sudo systemctl start nginx

log "Configuring NGINX reverse proxy"
sudo tee /etc/nginx/sites-available/chatui
