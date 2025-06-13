APP_PORT = 80

.PHONY: help run migrate upgrade downgrade makemigrations \
        setup uninstall java-build java-query-contratos java-query-financeiro java-test java-clean \
        docker-build docker-run docker-push docker-compose-up

## ----------------------------------------
##            AJUDA / HELP
## ----------------------------------------

help:
	@echo ""
	@echo "==== Comandos disponíveis no projeto ===="
	@echo ""
	@echo "Python / FastAPI:"
	@echo "  make run                                    - Inicia o servidor FastAPI com reload"
	@echo "  make migrate                                - Cria nova migration Alembic automaticamente"
	@echo "  make upgrade                                - Aplica as migrations pendentes no banco de dados"
	@echo "  make downgrade                              - Reverte a última migration"
	@echo "  make makemigrations                         - Atalho que chama make migrate"
	@echo ""
	@echo "Java / DaaS SERPRO:"
	@echo "  make java-build                             - Compila os códigos Java"
	@echo "  make java-query-contratos QUERY=\"SQL\"     - Executa uma query nos Contratos (use aspas na query)"
	@echo "  make java-query-financeiro QUERY=\"SQL\"    - Executa uma query no Financeiro (use aspas na query)"
	@echo "  make java-test                              - Executa um teste simples no Java (SELECT 1)"
	@echo "  make java-clean                             - Remove arquivos .class compilados em Java"
	@echo ""
	@echo "Setup e manutenção:"
	@echo "  make setup                                  - Instala dependências Python, NPM, copia Design System e uvicorn"
	@echo "  make uninstall                              - Remove dependências e arquivos gerados"
	@echo ""
	@echo "Docker:"
	@echo "  make docker-build                           - Cria a imagem Docker com tag compras-executivo:prod"
	@echo "  make docker-run                             - Executa o container Docker na porta 8000"
	@echo "  make docker-push REGISTRY=...               # Envia a imagem para um registry remoto"
	@echo "  make docker-compose-up                      - Sobe os serviços com docker-compose"
	@echo "  make docker-deploy                          - Deploy de produção"
	@echo "  make docker-export                          - Cria um pacote .tar"
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

run: build-static
	@echo "Executando uvicorn via módulo Python..."
	@PYTHONPATH=. python3 -c "import uvicorn; from app.core.config import settings; uvicorn.run('app.main:app', host='0.0.0.0', port=settings.APP_PORT, reload=True)"

run-win: build-static
	@echo "Executando uvicorn via módulo Python..."
	set PYTHONPATH=. && python -c "import uvicorn; from app.core.config import settings; uvicorn.run('app.main:app', host='0.0.0.0', port=settings.APP_PORT, reload=True)"

run-mac: build-static
	@echo "Executando uvicorn em ambiente macOS (sem -c)..."
	python3 -m uvicorn app.main:app --host 0.0.0.0 --port 80 --reload

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

setup: java-build
	@echo "Instalando dependências Python..."
	python3 -m pip install --user --break-system-packages -r requirements.txt
	@echo "Instalando pacotes NPM..."
	npm install
	@echo "Copiando arquivos do Design System gov.br para app/static/govbr-ds/..."
	mkdir -p app/static/govbr-ds
	cp node_modules/@govbr-ds/core/dist/core.min.css app/static/govbr-ds/
	cp node_modules/@govbr-ds/core/dist/core.min.js app/static/govbr-ds/
	@echo "Instalando uvicorn globalmente (modo --user)..."
	python3 -m pip install --user --break-system-packages uvicorn
	@echo "Setup completo."

setup-win: java-build
	@echo "Instalando dependências Python..."
	python -m pip install --user --break-system-packages -r requirements.txt
	@echo "Instalando pacotes NPM..."
	npm install
	@echo "Copiando arquivos do Design System gov.br para app/static/govbr-ds/..."
	mkdir app\static\govbr-ds
	copy "node_modules\@govbr-ds\core\dist\core.min.css" "app\static\govbr-ds\"
	copy "node_modules\@govbr-ds\core\dist\core.min.js" "app\static\govbr-ds\"
	@echo "Instalando uvicorn globalmente (modo --user)..."
	python -m pip install --user --break-system-packages uvicorn
	@echo "Setup completo."

uninstall:
	@echo "Removendo arquivos Java compilados..."
	make java-clean
	@echo "Removendo node_modules e package-lock.json..."
	chmod -R u+w node_modules || true
	rm -rf node_modules package-lock.json
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