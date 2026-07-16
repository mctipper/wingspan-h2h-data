#!/bin/bash
set -e

cd /home/mog/wingspan-h2h-data/
git pull origin main
sudo systemctl restart wingspan
