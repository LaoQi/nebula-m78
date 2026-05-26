#!/bin/bash
set -e
python3 gen_index.py
echo "Serving at http://localhost:8080 ..."
cd docs && python3 -m http.server 8080
