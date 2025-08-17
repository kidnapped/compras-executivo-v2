.PHONY: help run run-mac run-win run-prod \
		migrate upgrade downgrade makemigrations \
		install install-win install-verbose uninstall \
		java-build java-query-contratos java-query-financeiro java-test java-clean \
		docker-build docker-run docker-push docker-compose-up docker-deploy docker-export \
		build-static restart logs status \
		prepare-release create-release-package create-deploy-scripts generate-release-docs \
		validate-env release clean-build

ENVIRONMENT := $(shell grep ^ENVIRONMENT= .env | cut -d '=' -f2)

# Variáveis para versionamento
VERSION ?= $(shell git describe --tags --always --dirty 2>/dev/null || echo "dev")
TIMESTAMP := $(shell date +%Y%m%d_%H%M%S)
RELEASE_DIR := build/release-$(VERSION)
CHANGELOG_FILE := CHANGELOG.md

# Diretório de instalação em produção
INSTALL_DIR := /home/ec2-user/compras-executivo

## ----------------------------------------
##            AJUDA / HELP
## ----------------------------------------

help:
	@echo ""
	@echo "==== Comandos disponíveis no projeto ===="
	@echo ""
	@echo "▶ Python / FastAPI:"
	@echo "  make run                  - Inicia o servidor FastAPI com reload (Linux)"
	@echo "  make run-mac              - Inicia o servidor FastAPI no macOS"
	@echo "  make run-win              - Inicia o servidor FastAPI no Windows"
	@echo "  make run-prod             - Gera os bundles e compila Java (produção)"
	@echo ""
	@echo "  make migrate              - Cria nova migration Alembic automaticamente"
	@echo "  make upgrade              - Aplica as migrations pendentes no banco de dados"
	@echo "  make downgrade            - Reverte a última migration"
	@echo "  make makemigrations       - Alias para 'make migrate'"
	@echo ""
	@echo "▶ Frontend:"
	@echo "  make build-static         - Gera o bundle.js com Webpack + compila Java (legado)"
	@echo ""
	@echo "▶ Setup / Instalação:"
	@echo "  make install              - Instala dependências Python, NPM e copia o Design System (modo silencioso)"
	@echo "  make install-verbose      - Mesmo que install, mas mostra detalhes completos do pip"
	@echo "  make install-win          - Mesmo que install, adaptado para Windows"
	@echo "  make uninstall            - Remove dependências e artefatos gerados (node_modules, .class, __pycache__, webpack, govbr-ds, build, etc)"
	@echo ""
	@echo "▶ Java / DaaS SERPRO:"
	@echo "  make java-build           - Compila os códigos Java (vdb/ e app/java/)"
	@echo "  make java-clean           - Remove todos os arquivos .class Java compilados (busca recursiva)"
	@echo "  make java-test            - Testa conexão com QueryContratos (SELECT 1)"
	@echo "  make java-query-contratos QUERY=\"...\""
	@echo "                            - Executa uma query SQL no DaaS Contratos"
	@echo "  make java-query-financeiro QUERY=\"...\""
	@echo "                            - Executa uma query SQL no DaaS Financeiro"
	@echo ""
	@echo "▶ Docker:"
	@echo "  make docker-build         - Cria a imagem Docker com tag compras-executivo:prod"
	@echo "  make docker-run           - Executa o container localmente na porta 80"
	@echo "  make docker-push REGISTRY=\"user/imagem:tag\""
	@echo "                            - Envia a imagem Docker para um registry remoto"
	@echo "  make docker-compose-up    - Sobe os serviços definidos no docker-compose.yml"
	@echo "  make docker-deploy        - Gera imagem, executa e exporta em build/compras_executivo.tar"
	@echo "  make docker-export        - Exporta a imagem Docker para build/minha-imagem.tar"
	@echo ""
	@echo "▶ Serviços (FastAPI no systemd):"
	@echo "  make restart              - Reinicia o serviço fastapi via systemctl"
	@echo "  make logs                 - Exibe logs ao vivo com journalctl"
	@echo "  make status               - Mostra status do serviço fastapi"
	@echo ""
	@echo "▶ Release / Deploy:"
	@echo "  make release              - Cria pacote completo de release com scripts e docs"
	@echo "  make clean-build          - Limpa o diretório de build"
	@echo "  make validate-env         - Valida dependências necessárias para release"
	@echo ""
	@echo "==========================================="
	@echo ""

## ----------------------------------------
##            WEBPACK / STATIC
## ----------------------------------------

build-static:
	@echo "Gerando bundle.js com webpack..."
	npx webpack
	@echo "Compilando arquivos Java"
	javac -cp vdb/jboss-dv-6.3.0-teiid-jdbc.jar vdb/QueryContratos.java
	javac -cp vdb/jboss-dv-6.3.0-teiid-jdbc.jar vdb/QueryFinanceiro.java

build-static-if-needed:
ifeq ($(ENVIRONMENT),development)
	@echo "🌱 Ambiente de desenvolvimento..."
else
	@$(MAKE) build-static
endif

## ----------------------------------------
##           FASTAPI e Alembic
## ----------------------------------------

run: build-static-if-needed
	PYTHONPATH=. python3 -c "import uvicorn; from app.core.config import settings; uvicorn.run('app.main:app', host='0.0.0.0', port=settings.APP_PORT, reload=True)"

run-mac: build-static-if-needed
	PYTHONPATH=. python3 -c 'import uvicorn; from app.core.config import settings; uvicorn.run("app.main:app", host="0.0.0.0", port=settings.APP_PORT, reload=True)'

run-win: build-static-if-needed
	@set PYTHONPATH=. && python -m uvicorn app.main:app --host=0.0.0.0 --port=8001 --reload

run-prod:
	@echo "Iniciando FastAPI com Uvicorn (produção com SSL)..."
	python3 -m uvicorn app.main:app --host 0.0.0.0 --port 443 --ssl-keyfile /etc/pki/tls/private/server.key --ssl-certfile /etc/pki/tls/certs/server.crt --workers 4 --log-level info

migrate:
	alembic revision --autogenerate -m "nova migration"

upgrade:
	alembic upgrade head

downgrade:
	alembic downgrade -1

makemigrations: migrate

## ----------------------------------------
##           SETUP / UNINSTALL
## ----------------------------------------

install: java-build
	@echo "Instalando pacotes NPM..."
	npm install
	@echo "Instalando dependências Python..."
	python3 -m pip install --user --break-system-packages -r requirements.txt -q
	@echo "Copiando arquivos do Design System gov.br para app/static/govbr-ds/..."
	mkdir -p app/static/govbr-ds
	cp node_modules/@govbr-ds/core/dist/core.min.css app/static/govbr-ds/
	cp node_modules/@govbr-ds/core/dist/core.min.js app/static/govbr-ds/
	@echo "Instalando uvicorn globalmente (modo --user)..."
	python3 -m pip install --user --break-system-packages uvicorn -q
	@echo "Setup completo."

install-win: java-build
	@echo "Instalando pacotes NPM..."
	npm install
	@echo "Instalando dependências Python..."
	python -m pip install --user --break-system-packages -r requirements.txt
	@echo "Copiando arquivos do Design System gov.br para app/static/govbr-ds/..."
	mkdir app\static\govbr-ds
	copy "node_modules\@govbr-ds\core\dist\core.min.css" "app\static\govbr-ds\"
	copy "node_modules\@govbr-ds\core\dist\core.min.js" "app\static\govbr-ds\"
	@echo "Instalando uvicorn globalmente (modo --user)..."
	python -m pip install --user --break-system-packages uvicorn
	@echo "Setup completo."

install-verbose: java-build
	@echo "Instalando pacotes NPM..."
	npm install
	@echo "Instalando dependências Python (verbose)..."
	python3 -m pip install --user --break-system-packages -r requirements.txt
	@echo "Copiando arquivos do Design System gov.br para app/static/govbr-ds/..."
	mkdir -p app/static/govbr-ds
	cp node_modules/@govbr-ds/core/dist/core.min.css app/static/govbr-ds/
	cp node_modules/@govbr-ds/core/dist/core.min.js app/static/govbr-ds/
	@echo "Instalando uvicorn globalmente (modo --user)..."
	python3 -m pip install --user --break-system-packages uvicorn
	@echo "Setup completo."

uninstall:
	@echo "Removendo arquivos Java compilados..."
	make java-clean
	@echo "Removendo node_modules e package-lock.json..."
	-chmod -R u+w node_modules 2>/dev/null
	-rm -rf node_modules package-lock.json 2>/dev/null
	@echo "Removendo dist do React..."
	rm -rf react/dist
	@echo "Removendo webpack output..."
	rm -rf app/static/webpack
	@echo "Removendo govbr-ds copiados..."
	rm -rf app/static/govbr-ds
	@echo "Removendo __pycache__..."
	find . -type d -name '__pycache__' -exec rm -rf {} + 2>/dev/null || true
	@echo "Removendo .pyc e .pyo..."
	find . -name "*.pyc" -o -name "*.pyo" | xargs rm -f 2>/dev/null || true
	@echo "Removendo .DS_Store..."
	find . -type f -name '.DS_Store' -exec rm -f {} + 2>/dev/null || true
	@echo "Removendo .pytest_cache..."
	find . -type d -name '.pytest_cache' -exec rm -rf {} + 2>/dev/null || true
	@echo "Removendo .mypy_cache..."
	find . -type d -name '.mypy_cache' -exec rm -rf {} + 2>/dev/null || true
	@echo "Removendo *.egg-info..."
	find . -name "*.egg-info" -exec rm -rf {} + 2>/dev/null || true
	@echo "Removendo build..."
	rm -rf build
	@echo "Uninstall completo."

## ----------------------------------------
##              JAVA
## ----------------------------------------

java-build:
	@echo "Compilando código Java..."
	cd vdb && javac -cp jboss-dv-6.3.0-teiid-jdbc.jar QueryContratos.java
	cd vdb && javac -cp jboss-dv-6.3.0-teiid-jdbc.jar QueryFinanceiro.java
	cd app/java && javac -cp ../../vdb/jboss-dv-6.3.0-teiid-jdbc.jar QueryFinanceiro.java
	cd ..
	@echo "Compilação Java concluída."

java-query-contratos:
	ifndef QUERY
		$(error Você precisa informar QUERY=\"SELECT ...\")
	endif
		@echo "Executando QueryContratos com a query..."
		cd vdb && java -cp .:jboss-dv-6.3.0-teiid-jdbc.jar QueryContratos "$(QUERY)"

java-query-financeiro:
	ifndef QUERY
		$(error Você precisa informar QUERY=\"SELECT ...\")
	endif
		@echo "Executando QueryFinanceiro com a query..."
		cd vdb && java -cp .:jboss-dv-6.3.0-teiid-jdbc.jar QueryFinanceiro "$(QUERY)"

java-test:
	@echo "Executando teste simples com QueryContratos..."
	cd vdb && java -cp .:jboss-dv-6.3.0-teiid-jdbc.jar QueryContratos "SELECT 1"

java-clean:
	@echo "Removendo arquivos Java compilados (.class)..."
	find . -name "*.class" -type f -exec rm -f {} +
	@echo "Arquivos .class removidos."

## ----------------------------------------
##              DOCKER
## ----------------------------------------

docker-build:
	docker build --build-arg APP_PORT=80 -t compras-executivo:prod .

docker-run:
	docker run -p 80:80 compras-executivo:prod

docker-push:
	ifndef REGISTRY
		$(error Você precisa informar REGISTRY="usuario/imagem:tag")
	endif
		docker tag compras-executivo:prod $(REGISTRY)
		docker push $(REGISTRY)

docker-compose-up:
	docker-compose up -d

docker-deploy: docker-build
	docker run -p $(HOST_PORT):80 compras-executivo:prod
	mkdir -p build
	docker save compras-executivo:prod -o build/compras_executivo.tar
	@echo "🎉 Deploy + Export realizados com sucesso na pasta build/"

docker-export:
	mkdir -p build
	docker save compras-executivo:prod -o build/minha-imagem.tar
	@echo "🎉 Arquivo build/minha-imagem.tar gerado com sucesso."

## ----------------------------------------
##              RELEASE / PACKAGE
## ----------------------------------------

prepare-release: validate-env clean-build
	@echo "🔍 Validando ambiente de release..."
	@test -f requirements.txt || (echo "❌ requirements.txt não encontrado" && exit 1)
	@test -d app || (echo "❌ Diretório app não encontrado" && exit 1)
	@echo "✅ Validação concluída"

create-release-package: prepare-release build-static java-build
	@echo "📦 Preparando release $(VERSION)..."
	@mkdir -p $(RELEASE_DIR)/{app,config,scripts,docs}
	
	# Remove arquivos .DS_Store antes de continuar
	@find . -name '.DS_Store' -delete 2>/dev/null || true
	
	# Arquivos da aplicação
	@rsync -av --exclude='__pycache__' --exclude='*.pyc' --exclude='.DS_Store' \
		app/ $(RELEASE_DIR)/app/
	@cp -r vdb $(RELEASE_DIR)/
	@mkdir -p $(RELEASE_DIR)/migrations
	@cp -r app/db/migrations/* $(RELEASE_DIR)/migrations/ 2>/dev/null || echo "⚠️  Diretório migrations não encontrado"
	@cp requirements.txt $(RELEASE_DIR)/
	@cp alembic.ini $(RELEASE_DIR)/
	
	# Copia o .env atual como base e ajusta para produção
	@echo 'ENVIRONMENT=production' > $(RELEASE_DIR)/config/.env
	
	# README de configuração
	@echo "# Configuração de Produção" > $(RELEASE_DIR)/config/README.md
	@echo "" >> $(RELEASE_DIR)/config/README.md
	@echo "## ⚠️  IMPORTANTE: Configure antes do deploy!" >> $(RELEASE_DIR)/config/README.md
	@echo "" >> $(RELEASE_DIR)/config/README.md
	@echo "1. Edite o arquivo \`.env\` com as configurações de produção" >> $(RELEASE_DIR)/config/README.md
	@echo "2. O arquivo já está setado como ENVIRONMENT=production" >> $(RELEASE_DIR)/config/README.md
	@echo "3. Configure o resto das variáveis conforme necessário" >> $(RELEASE_DIR)/config/README.md
	@echo "" >> $(RELEASE_DIR)/config/README.md
	@echo "## Scripts Disponíveis:" >> $(RELEASE_DIR)/config/README.md
	@echo "" >> $(RELEASE_DIR)/config/README.md
	@echo "### \`./scripts/deploy.sh\`" >> $(RELEASE_DIR)/config/README.md
	@echo "- Faz deploy completo da aplicação" >> $(RELEASE_DIR)/config/README.md
	@echo "- Cria backup da versão anterior" >> $(RELEASE_DIR)/config/README.md
	@echo "- Instala dependências e roda migrations" >> $(RELEASE_DIR)/config/README.md
	@echo "" >> $(RELEASE_DIR)/config/README.md
	@echo "### \`./scripts/start.sh\`" >> $(RELEASE_DIR)/config/README.md
	@echo "- Inicia a aplicação diretamente" >> $(RELEASE_DIR)/config/README.md
	@echo "- Use quando quiser rodar manualmente" >> $(RELEASE_DIR)/config/README.md
	@echo "" >> $(RELEASE_DIR)/config/README.md
	@echo "### \`./scripts/install-service.sh\`" >> $(RELEASE_DIR)/config/README.md
	@echo "- Instala como serviço systemd" >> $(RELEASE_DIR)/config/README.md
	@echo "- Recomendado para produção" >> $(RELEASE_DIR)/config/README.md
	
	# Scripts de deploy
	@$(MAKE) create-deploy-scripts
	@$(MAKE) create-server-scripts
	
	# Documentação
	@$(MAKE) generate-release-docs
	
	# Empacota - sem atributos estendidos do macOS
	@cd build && COPYFILE_DISABLE=1 tar --no-xattrs -czf compras-executivo-$(VERSION).tar.gz release-$(VERSION)/ 2>/dev/null || tar -czf compras-executivo-$(VERSION).tar.gz release-$(VERSION)/
	@cd build && zip -r compras-executivo-$(VERSION).zip release-$(VERSION)/
	
	# Gera checksums
	@cd build && sha256sum compras-executivo-$(VERSION).tar.gz > compras-executivo-$(VERSION).tar.gz.sha256
	@cd build && sha256sum compras-executivo-$(VERSION).zip > compras-executivo-$(VERSION).zip.sha256

	# Remove o diretório temporário após criar os pacotes
	@rm -rf $(RELEASE_DIR)

	@echo "✅ Release criada com sucesso!"
	@echo "📦 Arquivos gerados:"
	@echo "   - build/compras-executivo-$(VERSION).tar.gz"
	@echo "   - build/compras-executivo-$(VERSION).zip"
	@echo "   - Checksums SHA256"

create-deploy-scripts:
	@echo '#!/bin/bash' > $(RELEASE_DIR)/scripts/deploy.sh
	@echo 'set -e' >> $(RELEASE_DIR)/scripts/deploy.sh
	@echo '' >> $(RELEASE_DIR)/scripts/deploy.sh
	@echo '# Script de Deploy - Compras Executivo $(VERSION)' >> $(RELEASE_DIR)/scripts/deploy.sh
	@echo '' >> $(RELEASE_DIR)/scripts/deploy.sh
	@echo '# Verifica se o arquivo de configuração existe' >> $(RELEASE_DIR)/scripts/deploy.sh
	@echo 'if [ ! -f "config/.env" ]; then' >> $(RELEASE_DIR)/scripts/deploy.sh
	@echo '    echo "❌ Erro: config/.env não encontrado!"' >> $(RELEASE_DIR)/scripts/deploy.sh
	@echo '    echo "Configure o arquivo antes de executar o deploy."' >> $(RELEASE_DIR)/scripts/deploy.sh
	@echo '    exit 1' >> $(RELEASE_DIR)/scripts/deploy.sh
	@echo 'fi' >> $(RELEASE_DIR)/scripts/deploy.sh
	@echo '' >> $(RELEASE_DIR)/scripts/deploy.sh
	@echo '# Backup da versão anterior (renomeia para .<versao>)' >> $(RELEASE_DIR)/scripts/deploy.sh
	@echo 'if [ -d "$(INSTALL_DIR)" ]; then' >> $(RELEASE_DIR)/scripts/deploy.sh
	@echo '    echo "📦 Fazendo backup da versão anterior..."' >> $(RELEASE_DIR)/scripts/deploy.sh
	@echo '    echo "💾 Fazendo dump da tabela blocok..."' >> $(RELEASE_DIR)/scripts/deploy.sh
	@echo '    pg_dump -h localhost -U postgres -t blocok compras > $(INSTALL_DIR)/backup_blocok_$$(date +%Y%m%d_%H%M%S).sql || echo "⚠️  Erro no dump da tabela blocok"' >> $(RELEASE_DIR)/scripts/deploy.sh
	@echo '    sudo mv $(INSTALL_DIR) $(INSTALL_DIR).$(VERSION)' >> $(RELEASE_DIR)/scripts/deploy.sh
	@echo 'fi' >> $(RELEASE_DIR)/scripts/deploy.sh
	@echo '' >> $(RELEASE_DIR)/scripts/deploy.sh
	@echo '# Instalação' >> $(RELEASE_DIR)/scripts/deploy.sh
	@echo 'echo "📂 Criando diretório de instalação..."' >> $(RELEASE_DIR)/scripts/deploy.sh
	@echo 'sudo mkdir -p $(INSTALL_DIR)' >> $(RELEASE_DIR)/scripts/deploy.sh
	@echo 'echo "📋 Copiando arquivos..."' >> $(RELEASE_DIR)/scripts/deploy.sh
	@echo 'sudo cp -r * $(INSTALL_DIR)/' >> $(RELEASE_DIR)/scripts/deploy.sh
	@echo '' >> $(RELEASE_DIR)/scripts/deploy.sh
	@echo '# Copia o arquivo de configuração' >> $(RELEASE_DIR)/scripts/deploy.sh
	@echo 'echo "🔧 Configurando ambiente..."' >> $(RELEASE_DIR)/scripts/deploy.sh
	@echo 'sudo cp config/.env $(INSTALL_DIR)/.env' >> $(RELEASE_DIR)/scripts/deploy.sh
	@echo '' >> $(RELEASE_DIR)/scripts/deploy.sh
	@echo '# Configuração do ambiente' >> $(RELEASE_DIR)/scripts/deploy.sh
	@echo 'cd $(INSTALL_DIR)' >> $(RELEASE_DIR)/scripts/deploy.sh
	@echo '' >> $(RELEASE_DIR)/scripts/deploy.sh
	@echo '# Detecta a versão do Python' >> $(RELEASE_DIR)/scripts/deploy.sh
	@echo 'PYTHON_CMD=""' >> $(RELEASE_DIR)/scripts/deploy.sh
	@echo 'if command -v python3.12 &> /dev/null; then' >> $(RELEASE_DIR)/scripts/deploy.sh
	@echo '    PYTHON_CMD="python3.12"' >> $(RELEASE_DIR)/scripts/deploy.sh
	@echo '    echo "✅ Usando Python 3.12"' >> $(RELEASE_DIR)/scripts/deploy.sh
	@echo 'elif command -v python3.11 &> /dev/null; then' >> $(RELEASE_DIR)/scripts/deploy.sh
	@echo '    PYTHON_CMD="python3.11"' >> $(RELEASE_DIR)/scripts/deploy.sh
	@echo '    echo "✅ Usando Python 3.11"' >> $(RELEASE_DIR)/scripts/deploy.sh
	@echo 'elif command -v python3.9 &> /dev/null; then' >> $(RELEASE_DIR)/scripts/deploy.sh
	@echo '    PYTHON_CMD="python3.9"' >> $(RELEASE_DIR)/scripts/deploy.sh
	@echo '    echo "✅ Usando Python 3.9"' >> $(RELEASE_DIR)/scripts/deploy.sh
	@echo 'else' >> $(RELEASE_DIR)/scripts/deploy.sh
	@echo '    PYTHON_CMD="python3"' >> $(RELEASE_DIR)/scripts/deploy.sh
	@echo '    echo "⚠️  Usando Python padrão"' >> $(RELEASE_DIR)/scripts/deploy.sh
	@echo 'fi' >> $(RELEASE_DIR)/scripts/deploy.sh
	@echo '' >> $(RELEASE_DIR)/scripts/deploy.sh
	@echo 'echo "📦 Instalando dependências..."' >> $(RELEASE_DIR)/scripts/deploy.sh
	@echo 'sudo $$PYTHON_CMD -m pip install -r requirements.txt' >> $(RELEASE_DIR)/scripts/deploy.sh
	@echo '' >> $(RELEASE_DIR)/scripts/deploy.sh
	@echo '# Carrega as variáveis de ambiente' >> $(RELEASE_DIR)/scripts/deploy.sh
	@echo 'echo "🔄 Executando migrations..."' >> $(RELEASE_DIR)/scripts/deploy.sh
	@echo 'export $$(cat .env | grep -v "^#" | xargs)' >> $(RELEASE_DIR)/scripts/deploy.sh
	@echo '' >> $(RELEASE_DIR)/scripts/deploy.sh
	@echo '# Migrations' >> $(RELEASE_DIR)/scripts/deploy.sh
	@echo 'sudo -E $$PYTHON_CMD -m alembic upgrade head || echo "⚠️  Erro nas migrations, verifique a configuração do banco"' >> $(RELEASE_DIR)/scripts/deploy.sh
	@echo '' >> $(RELEASE_DIR)/scripts/deploy.sh
	@echo '# Restart do serviço' >> $(RELEASE_DIR)/scripts/deploy.sh
	@echo 'echo "🔄 Reiniciando serviço..."' >> $(RELEASE_DIR)/scripts/deploy.sh
	@echo 'sudo systemctl restart compras-executivo || echo "⚠️  Serviço não encontrado, configure manualmente"' >> $(RELEASE_DIR)/scripts/deploy.sh
	@echo '' >> $(RELEASE_DIR)/scripts/deploy.sh
	@echo 'echo "✅ Deploy concluído!"' >> $(RELEASE_DIR)/scripts/deploy.sh
	@echo 'echo "📍 Aplicação instalada em: $(INSTALL_DIR)"' >> $(RELEASE_DIR)/scripts/deploy.sh
	@echo 'echo "🔧 Verifique o arquivo .env se houver problemas"' >> $(RELEASE_DIR)/scripts/deploy.sh
	@chmod +x $(RELEASE_DIR)/scripts/deploy.sh

create-server-scripts:
	@echo '#!/bin/bash' > $(RELEASE_DIR)/scripts/start.sh
	@echo 'set -e' >> $(RELEASE_DIR)/scripts/start.sh
	@echo '' >> $(RELEASE_DIR)/scripts/start.sh
	@echo '# Script de Inicialização - Compras Executivo' >> $(RELEASE_DIR)/scripts/start.sh
	@echo 'cd "$(INSTALL_DIR)"' >> $(RELEASE_DIR)/scripts/start.sh
	@echo '' >> $(RELEASE_DIR)/scripts/start.sh
	@echo '# Carrega as variáveis de ambiente' >> $(RELEASE_DIR)/scripts/start.sh
	@echo 'echo "🔧 Carregando configurações do .env..."' >> $(RELEASE_DIR)/scripts/start.sh
	@echo 'export $$(cat .env | grep -v "^#" | xargs)' >> $(RELEASE_DIR)/scripts/start.sh
	@echo '' >> $(RELEASE_DIR)/scripts/start.sh
	@echo '# Detecta a versão do Python' >> $(RELEASE_DIR)/scripts/start.sh
	@echo 'PYTHON_CMD=""' >> $(RELEASE_DIR)/scripts/start.sh
	@echo 'if command -v python3.12 &> /dev/null; then' >> $(RELEASE_DIR)/scripts/start.sh
	@echo '    PYTHON_CMD="python3.12"' >> $(RELEASE_DIR)/scripts/start.sh
	@echo '    echo "✅ Usando Python 3.12"' >> $(RELEASE_DIR)/scripts/start.sh
	@echo 'elif command -v python3.11 &> /dev/null; then' >> $(RELEASE_DIR)/scripts/start.sh
	@echo '    PYTHON_CMD="python3.11"' >> $(RELEASE_DIR)/scripts/start.sh
	@echo '    echo "✅ Usando Python 3.11"' >> $(RELEASE_DIR)/scripts/start.sh
	@echo 'elif command -v python3.9 &> /dev/null; then' >> $(RELEASE_DIR)/scripts/start.sh
	@echo '    PYTHON_CMD="python3.9"' >> $(RELEASE_DIR)/scripts/start.sh
	@echo '    echo "✅ Usando Python 3.9"' >> $(RELEASE_DIR)/scripts/start.sh
	@echo 'else' >> $(RELEASE_DIR)/scripts/start.sh
	@echo '    PYTHON_CMD="python3"' >> $(RELEASE_DIR)/scripts/start.sh
	@echo '    echo "⚠️  Usando Python padrão"' >> $(RELEASE_DIR)/scripts/start.sh
	@echo 'fi' >> $(RELEASE_DIR)/scripts/start.sh
	@echo '' >> $(RELEASE_DIR)/scripts/start.sh
	@echo '# Inicia o servidor' >> $(RELEASE_DIR)/scripts/start.sh
	@echo 'echo "🚀 Iniciando Compras Executivo..."' >> $(RELEASE_DIR)/scripts/start.sh
	@echo 'echo "📍 Diretório: $$(pwd)"' >> $(RELEASE_DIR)/scripts/start.sh
	@echo 'echo "🌐 URL: http://localhost:$${APP_PORT:-80}"' >> $(RELEASE_DIR)/scripts/start.sh
	@echo 'echo "🛑 Para parar, pressione Ctrl+C"' >> $(RELEASE_DIR)/scripts/start.sh
	@echo 'echo ""' >> $(RELEASE_DIR)/scripts/start.sh
	@echo 'PYTHONPATH=. $$PYTHON_CMD -m uvicorn app.main:app --host 0.0.0.0 --port $${APP_PORT:-80} --workers 4' >> $(RELEASE_DIR)/scripts/start.sh
	@chmod +x $(RELEASE_DIR)/scripts/start.sh
	
	# Script de systemd
	@echo '[Unit]' > $(RELEASE_DIR)/scripts/compras-executivo.service
	@echo 'Description=FastAPI com Uvicorn (root via python3 -m)' >> $(RELEASE_DIR)/scripts/compras-executivo.service
	@echo 'After=network.target' >> $(RELEASE_DIR)/scripts/compras-executivo.service
	@echo '' >> $(RELEASE_DIR)/scripts/compras-executivo.service
	@echo '[Service]' >> $(RELEASE_DIR)/scripts/compras-executivo.service
	@echo 'Type=simple' >> $(RELEASE_DIR)/scripts/compras-executivo.service
	@echo 'User=root' >> $(RELEASE_DIR)/scripts/compras-executivo.service
	@echo 'WorkingDirectory=$(INSTALL_DIR)' >> $(RELEASE_DIR)/scripts/compras-executivo.service
	@echo 'ExecStartPre=/usr/bin/make -C $(INSTALL_DIR) run-prod' >> $(RELEASE_DIR)/scripts/compras-executivo.service
	@echo 'ExecStart=/usr/bin/python3 -m uvicorn app.main:app --host 0.0.0.0 --port 443 \' >> $(RELEASE_DIR)/scripts/compras-executivo.service
	@echo '  --ssl-keyfile /etc/pki/tls/private/server.key \' >> $(RELEASE_DIR)/scripts/compras-executivo.service
	@echo '  --ssl-certfile /etc/pki/tls/certs/server.crt \' >> $(RELEASE_DIR)/scripts/compras-executivo.service
	@echo '  --workers 4 --log-level info' >> $(RELEASE_DIR)/scripts/compras-executivo.service
	@echo 'Restart=always' >> $(RELEASE_DIR)/scripts/compras-executivo.service
	@echo '' >> $(RELEASE_DIR)/scripts/compras-executivo.service
	@echo '[Install]' >> $(RELEASE_DIR)/scripts/compras-executivo.service
	@echo 'WantedBy=multi-user.target' >> $(RELEASE_DIR)/scripts/compras-executivo.service
	
	# Script para instalar o serviço systemd
	@echo '#!/bin/bash' > $(RELEASE_DIR)/scripts/install-service.sh
	@echo 'echo "📦 Instalando serviço systemd..."' >> $(RELEASE_DIR)/scripts/install-service.sh
	@echo 'sudo cp scripts/compras-executivo.service /etc/systemd/system/' >> $(RELEASE_DIR)/scripts/install-service.sh
	@echo 'sudo systemctl daemon-reload' >> $(RELEASE_DIR)/scripts/install-service.sh
	@echo 'sudo systemctl enable compras-executivo' >> $(RELEASE_DIR)/scripts/install-service.sh
	@echo 'echo "✅ Serviço instalado!"' >> $(RELEASE_DIR)/scripts/install-service.sh
	@echo 'echo "▶️  Para iniciar: sudo systemctl start compras-executivo"' >> $(RELEASE_DIR)/scripts/install-service.sh
	@echo 'echo "📊 Para status:  sudo systemctl status compras-executivo"' >> $(RELEASE_DIR)/scripts/install-service.sh
	@echo 'echo "📝 Para logs:    sudo journalctl -u compras-executivo -f"' >> $(RELEASE_DIR)/scripts/install-service.sh
	@chmod +x $(RELEASE_DIR)/scripts/install-service.sh

generate-release-docs:
	@echo "# Release Notes - v$(VERSION)" > $(RELEASE_DIR)/docs/RELEASE_NOTES.md
	@echo "Data: $$(date +%Y-%m-%d)" >> $(RELEASE_DIR)/docs/RELEASE_NOTES.md
	@echo "" >> $(RELEASE_DIR)/docs/RELEASE_NOTES.md
	@if [ -f $(CHANGELOG_FILE) ]; then \
		head -n 20 $(CHANGELOG_FILE) >> $(RELEASE_DIR)/docs/RELEASE_NOTES.md; \
	fi
	@echo "" >> $(RELEASE_DIR)/docs/RELEASE_NOTES.md
	@echo "## Instruções de Deploy" >> $(RELEASE_DIR)/docs/RELEASE_NOTES.md
	@echo "1. Extraia o arquivo em um diretório temporário" >> $(RELEASE_DIR)/docs/RELEASE_NOTES.md
	@echo "2. Configure o arquivo config/.env" >> $(RELEASE_DIR)/docs/RELEASE_NOTES.md
	@echo "3. Execute: ./scripts/deploy.sh" >> $(RELEASE_DIR)/docs/RELEASE_NOTES.md

validate-env:
	@command -v git >/dev/null 2>&1 || { echo "❌ git não está instalado"; exit 1; }
	@command -v rsync >/dev/null 2>&1 || { echo "❌ rsync não está instalado"; exit 1; }

clean-build:
	@echo "🧹 Limpando diretório de build..."
	@rm -rf build

# Target principal para release
release: create-release-package
	@echo "🎉 Release $(VERSION) criada com sucesso!"

## ----------------------------------------
##        PRA ORGANIZAR (TIRAR DAQUI)
## ----------------------------------------

restart:
	sudo systemctl restart fastapi

logs:
	sudo journalctl -u fastapi -f

status:
	sudo systemctl status fastapi
