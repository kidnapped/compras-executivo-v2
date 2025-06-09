#!/bin/bash

ZIP_NAME="py-app.zip"

echo "Apagando zip antigo (se existir)..."
rm -f $ZIP_NAME

echo "Compactando projeto em $ZIP_NAME..."

zip -r $ZIP_NAME . \
    -x "*.venv*" \
    -x "venv*" \
    -x "**/__pycache__/*" \
    -x "**/__pycache__/" \
    -x "__init__.py" \
    -x "*.pyc" \
    -x "*.pyo" \
    -x "*.DS_Store" \
    -x "*.zip" \
    -x "*.egg-info*" \
    -x "*.log" \
    -x ".git/*" \
    -x ".gitignore" \
    -x ".idea/*" \
    -x "*.sqlite3" \
    -x "*.db" \
    -x "node_modules/**" \
    -x "**/node_modules/**" \
    -x "**/dist/*" \
    -x "**/build/*" \
    -x "*.coverage" \
    -x ".pytest_cache/*" \
    -x "*.mypy_cache/*" \
    -x ".vscode/*" \
    -x "**/*.map" \
    -x "**/*.tmp" \
    -x "**/*.pdf" \
    -x "**/*.bak" \
    -x "**/*.swp" \
    -x "**/*.pug" \
    -x "**/*.jpg" \
    -x "**/*.jpeg" \
    -x "**/*.jks" \
    -x "**/*.jar" \
    -x "**/*.png" \
    -x "**/*.svg" \
    -x "**/*.webp" \
    -x "**/*.woff2" \
    -x "**/*.ttf" \
    -x "**/*.gif" \
    -x "**/*.class" \
    -x "frontend/.*" \
    -x "**/*.ico" \
    -x "resources/**"

echo "Compactação concluída."
