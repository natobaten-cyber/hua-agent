#!/bin/bash
export PATH="/Users/mac/.nvm/versions/node/v22.22.2/bin:$PATH"
cd /Users/mac/Downloads/hua-agent
exec node_modules/.bin/vite src/renderer --port 5173
