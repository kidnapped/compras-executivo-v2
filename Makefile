.PHONY: help run run-mac run-win run-prod \
        migrate upgrade downgrade makemigrations \
        install install-win uninstall \
        java-build java-query-contratos java-query-financeiro java-test java-clean \
        docker-build docker-run docker-push docker-compose-up docker-deploy docker-export \
        build-static react-build restart logs status

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
	@echo "▶ Frontend (React / Vite):"
	@echo "  make react-build          - Gera o build do frontend React com Vite"
	@echo "  make build-static         - Gera o bundle.js com Webpack + compila Java (legado)"
	@echo ""
	@echo "▶ Setup / Instalação:"
	@echo "  make install              - Instala dependências Python, NPM, builda React e copia o Design System"
	@echo "  make install-win          - Mesmo que install, adaptado para Windows"
	@echo "  make uninstall            - Remove dependências e artefatos gerados (node_modules, __pycache__, dist etc)"
	@echo ""
	@echo "▶ Java / DaaS SERPRO:"
	@echo "  make java-build           - Compila os códigos Java"
	@echo "  make java-clean           - Remove arquivos .class Java compilados"
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

## ----------------------------------------
##           FASTAPI e Alembic
## ----------------------------------------

run: build-static react-build
	@echo "Executando uvicorn via módulo Python..."
	npm run dev & \
	PYTHONPATH=. python3 -c "import uvicorn; from app.core.config import settings; uvicorn.run('app.main:app', host='0.0.0.0', port=settings.APP_PORT, reload=True)"

run-win: build-static react-build
	@echo "Executando uvicorn via módulo Python..."
	set PYTHONPATH=. && npm run dev & \
	set PYTHONPATH=. && python -c "import uvicorn; from app.core.config import settings; uvicorn.run('app.main:app', host='0.0.0.0', port=settings.APP_PORT, reload=True)"

run-mac: build-static react-build
	@echo "Executando uvicorn e Vite (React)..."
	PYTHONPATH=. concurrently "npm run dev" "python3 -c 'import uvicorn; from app.core.config import settings; uvicorn.run(\"app.main:app\", host=\"0.0.0.0\", port=settings.APP_PORT, reload=True)'"

run-prod:
	@echo "Gerando bundle.js com webpack (produção)..."
	npx webpack
	@echo "Compilando arquivos Java..."
	javac -cp vdb/jboss-dv-6.3.0-teiid-jdbc.jar vdb/QueryContratos.java
	javac -cp vdb/jboss-dv-6.3.0-teiid-jdbc.jar vdb/QueryFinanceiro.java

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
	@echo "🔧 Gerando build do React com Vite..."
	npx vite build
	@echo "Instalando dependências Python..."
	python3 -m pip install --user --break-system-packages -r requirements.txt
	@echo "Copiando arquivos do Design System gov.br para app/static/govbr-ds/..."
	mkdir -p app/static/govbr-ds
	cp node_modules/@govbr-ds/core/dist/core.min.css app/static/govbr-ds/
	cp node_modules/@govbr-ds/core/dist/core.min.js app/static/govbr-ds/
	@echo "Instalando uvicorn globalmente (modo --user)..."
	python3 -m pip install --user --break-system-packages uvicorn
	@echo "Setup completo."

install-win: java-build
	@echo "Instalando pacotes NPM..."
	npm install
	@echo "🔧 Gerando build do React com Vite..."
	npx vite build
	@echo "Instalando dependências Python..."
	python -m pip install --user --break-system-packages -r requirements.txt
	@echo "Copiando arquivos do Design System gov.br para app/static/govbr-ds/..."
	mkdir app\static\govbr-ds
	copy "node_modules\@govbr-ds\core\dist\core.min.css" "app\static\govbr-ds\"
	copy "node_modules\@govbr-ds\core\dist\core.min.js" "app\static\govbr-ds\"
	@echo "Instalando uvicorn globalmente (modo --user)..."
	python -m pip install --user --break-system-packages uvicorn
	@echo "Setup completo."

react-build:
	@echo "🔧 Gerando build do React com Vite..."
	npm run build

uninstall:
	@echo "Removendo arquivos Java compilados..."
	make java-clean
	@echo "Removendo node_modules e package-lock.json..."
	chmod -R u+w node_modules || true
	rm -rf node_modules package-lock.json
	@echo "Removendo dist do React..."
	rm -rf react/dist
	@echo "Removendo __pycache__..."
	find . -type d -name '__pycache__' -exec rm -r {} +
	@echo "Removendo .DS_Store..."
	find . -type f -name '.DS_Store' -exec rm -f {} +
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
	rm -f vdb/*.class
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
##        PRA ORGANIZAR (TIRAR DAQUI)
## ----------------------------------------

restart:
	sudo systemctl restart fastapi

logs:
	sudo journalctl -u fastapi -f

status:
	sudo systemctl status fastapi	