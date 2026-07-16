# Deployment Instructions

## Update code

Remote into host and manaully pull (cbf building a pipeline for this) and then just restart the service
> ssh <user>@<host>  
> cd /home/<user>/wingspan-h2h-data  
> git pull  
> sudo systemctl restart wingspan

## Updating data

Data entered will just collect and can be committed and pushed when ready.  

# Setting up a service using docker container

Set up a service to handle this

> /etc/systemd/system/wingspan.service

```bash
[Unit]
Description=Wingspan H2H Docker Compose
After=docker.service
Requires=docker.service

[Service]
WorkingDirectory=/home/<user>/wingspan-h2h-data
ExecStart=/usr/bin/docker compose up --build
ExecStop=/usr/bin/docker compose down
Restart=always

[Install]
WantedBy=multi-user.target
```

## Enable

> sudo systemctl enable wingspan  
> sudo systemctl start wingspan

# Github Pages

Configured to simply update via the gh-pages package
> npm run deploy