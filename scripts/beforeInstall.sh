#!/bin/bash

echo install awscli
sudo apt  install awscli -y
sudo apt  install jq -y

echo installing node
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -

sudo apt-get install nodejs -y


echo installing yarn
sudo npm install --global yarn

echo installing pm2
sudo npm install -g pm2
sudo pm2 delete all

echo installing nginx
sudo apt-get install nginx -y