#!/bin/bash

# Script de verificação do sistema de release
# Para uso após implementação da Opção 3

echo "=== Verificação do Sistema de Release ==="
echo ""

echo "1. Verificando dependências..."
command -v git >/dev/null 2>&1 && echo "  ✅ git instalado" || echo "  ❌ git não encontrado"
command -v rsync >/dev/null 2>&1 && echo "  ✅ rsync instalado" || echo "  ❌ rsync não encontrado"
command -v zip >/dev/null 2>&1 && echo "  ✅ zip instalado" || echo "  ❌ zip não encontrado"
command -v sha256sum >/dev/null 2>&1 && echo "  ✅ sha256sum instalado" || echo "  ❌ sha256sum não encontrado"

echo ""
echo "2. Verificando arquivos necessários..."
[ -f requirements.txt ] && echo "  ✅ requirements.txt existe" || echo "  ❌ requirements.txt não encontrado"
[ -f alembic.ini ] && echo "  ✅ alembic.ini existe" || echo "  ❌ alembic.ini não encontrado"
[ -f .env.example ] && echo "  ✅ .env.example existe" || echo "  ❌ .env.example não encontrado"
[ -f CHANGELOG.md ] && echo "  ✅ CHANGELOG.md existe" || echo "  ❌ CHANGELOG.md não encontrado"
[ -d app ] && echo "  ✅ diretório app existe" || echo "  ❌ diretório app não encontrado"
[ -d vdb ] && echo "  ✅ diretório vdb existe" || echo "  ❌ diretório vdb não encontrado"
[ -d app/db/migrations ] && echo "  ✅ diretório migrations existe" || echo "  ❌ diretório migrations não encontrado"

echo ""
echo "3. Comandos disponíveis:"
echo "  make release              - Cria pacote completo"
echo "  make clean-build          - Limpa diretório build"
echo "  make validate-env         - Valida dependências"
echo ""

echo "4. Como usar:"
echo "  # Release simples (usa versão do git)"
echo "  make release"
echo ""
echo "  # Com tag específica"
echo "  git tag -a v1.0.0 -m 'Release v1.0.0'"
echo "  make release"
echo ""

echo "5. Estrutura gerada:"
echo "  build/"
echo "  ├── compras-executivo-VERSAO.tar.gz"
echo "  ├── compras-executivo-VERSAO.zip"
echo "  ├── compras-executivo-VERSAO.tar.gz.sha256"
echo "  └── compras-executivo-VERSAO.zip.sha256"
echo ""

echo "=== Verificação concluída ==="
