#!/bin/bash
cd /home/ubuntu/app

echo copying nginx conf
sudo cp nginx.conf /etc/nginx/nginx.conf

echo starting nginx
sudo systemctl enable nginx
sudo systemctl start nginx
sudo systemctl reload nginx

echo load .env file
sudo sh -c "aws secretsmanager get-secret-value --secret-id $STACK_ENV/zerocore --region us-west-2 --query SecretString --output text | sudo jq -r 'to_entries|map(\"\(.key)=\(.value)\")|.[]' > .env"

echo starting pm2
sudo pm2 start yarn --name core -- start
sudo pm2 startup
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u ubuntu --hp /home/ubuntu
sudo pm2 save