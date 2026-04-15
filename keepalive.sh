#!/bin/bash
# Keepalive script for SocialPilot AI dev server
while true; do
  if ! ss -tlnp | grep -q ":3000 "; then
    echo "[$(date)] Next.js server not running, starting..."
    cd /home/z/my-project
    nohup npx next dev -p 3000 >> /home/z/my-project/dev.log 2>&1 &
    echo "[$(date)] Started Next.js (PID: $!)"
  fi
  sleep 10
done
