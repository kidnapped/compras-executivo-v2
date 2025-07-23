# Changelog

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/),
e este projeto adere ao [Versionamento Semântico](https://semver.org/lang/pt-BR/).

## [Não Lançado]

### Adicionado
- N/A

### Alterado
- N/A

### Removido
- N/A

### Corrigido
- N/A

## [1.1.0] - 2025-07-22

### Adicionado
- Sistema de empacotamento para produção (make release)
- Scripts automatizados de deploy
- Validação de ambiente para releases
- Documentação automática de releases
- Arquivo `.env.example` com template de configuração
- Script de verificação do sistema (`check_release_system.sh`)

### Alterado
- Melhorias no Makefile para suporte a releases profissionais
- Atualização do `.gitignore` para excluir builds
- Correção do caminho das migrações no processo de release

### Tecnologias
- Sistema de versionamento baseado em Git tags
- Empacotamento em .tar.gz e .zip
- Checksums SHA256 para validação
- Scripts de deploy automatizados

## [1.0.0] - 2025-07-22

### Adicionado
- Versão inicial do sistema Compras Executivo
- Interface web para visualização de dados
- Integração com DaaS SERPRO
- Sistema de autenticação
- Dashboard executivo
- Relatórios financeiros

### Tecnologias
- FastAPI (Backend)
- JavaScript/Webpack (Frontend)
- PostgreSQL (Banco de dados)
- Alembic (Migrações)
- Docker (Containerização)
