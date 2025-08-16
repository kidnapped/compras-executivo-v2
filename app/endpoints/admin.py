from fastapi import APIRouter, Request, Depends, Form, Query
from fastapi.responses import HTMLResponse, RedirectResponse, JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func
import subprocess
import json
from pathlib import Path

from app.db.session import get_session_blocok
from app.db.models.user import User
from app.core.templates import templates
from app.core.config import settings
from app.utils.spa_utils import spa_route_handler, get_page_scripts, add_spa_context

router = APIRouter()

def executar_java(vdb_tipo: str, query: str):
    """Execute Java VDB query using configuration from settings"""
    # Escape query for shell
    escaped_query = query.replace('"', '\\"')
    
    # Build command with all configuration parameters
    cmd = (
        f"cd {settings.VDB_JAVA_DIR} && "
        f"java -cp .:{settings.VDB_JAR_DIR}/{settings.VDB_JAR_FILE} {vdb_tipo} "
        f'"{escaped_query}" '
        f'"{settings.VDB_FINANCEIRO_JDBC_URL}" '
        f'"{settings.VDB_TEIID_USER}" '
        f'"{settings.VDB_TEIID_PASSWORD}" '
        f'"{settings.VDB_JAR_DIR}" '
        f'"{settings.VDB_KEYSTORE_FILE}" '
        f'"{settings.VDB_TRUSTSTORE_TYPE}"'
    )
    
    result = subprocess.run(cmd, shell=True, stdout=subprocess.PIPE, text=True)
    return result.stdout.strip().splitlines()

@router.get("/admin", response_class=HTMLResponse)
async def admin_index(request: Request):
    context = {
        "request": request, 
        "template_name": "admin"
    }
    
    context = add_spa_context(context, request)
    
    return spa_route_handler(
        template_name="admin/admin.html",
        context=context,
        templates=templates,
        request=request,
        title="Administração - Compras Executivo",
        scripts=get_page_scripts("admin")
    )

# Página HTML
@router.get("/admin/usuarios", response_class=HTMLResponse)
async def admin_usuarios_html(request: Request):
    return templates.TemplateResponse("admin/admin_usuarios.html", {"request": request, "template_name": "admin"})

# API JSON para listagem paginada
@router.get("/admin/usuarios/lista")
async def listar_usuarios(
    pagina: int = Query(1, ge=1),
    limite: int = Query(10, ge=1, le=100),
    db: AsyncSession = Depends(get_session_blocok)
):
    offset = (pagina - 1) * limite
    total = await db.scalar(select(func.count()).select_from(User))
    result = await db.execute(select(User).offset(offset).limit(limite))
    usuarios = result.scalars().all()

    return {
        "total": total,
        "pagina": pagina,
        "limite": limite,
        "usuarios": [
            {
                "id": u.id,
                "nome": u.nome,
                "cpf": u.cpf,
                "email": u.email,
                "usuario": u.usuario,
                "origem_login": u.origem_login,
                "ativo": u.ativo,
            }
            for u in usuarios
        ]
    }


# Criar usuário via formulário
@router.post("/admin/usuarios/criar")
async def criar_usuario(
    request: Request,
    nome: str = Form(...),
    cpf: str = Form(...),
    email: str = Form(None),
    usuario: str = Form(...),
    senha: str = Form(None),
    ativo: str = Form("true"),
    db: AsyncSession = Depends(get_session_blocok)
):
    novo = User(
        nome=nome,
        cpf=cpf,
        email=email,
        usuario=usuario,
        senha=senha,
        origem_login="manual",
        ativo=(ativo == "true")
    )
    db.add(novo)
    await db.commit()
    return RedirectResponse(url="/admin/usuarios", status_code=303)


# Excluir usuário
@router.post("/admin/usuarios/excluir/{usuario_id}")
async def excluir_usuario(usuario_id: int, db: AsyncSession = Depends(get_session_blocok)):
    user = await db.get(User, usuario_id)
    if user:
        await db.delete(user)
        await db.commit()
    return RedirectResponse(url="/admin/usuarios", status_code=303)


# Editar usuário
@router.post("/admin/usuarios/editar/{usuario_id}")
async def editar_usuario(
    usuario_id: int,
    nome: str = Form(...),
    email: str = Form(None),
    ativo: str = Form("true"),
    db: AsyncSession = Depends(get_session_blocok)
):
    user = await db.get(User, usuario_id)
    if user:
        user.nome = nome
        user.email = email
        user.ativo = (ativo == "true")
        await db.commit()
    return RedirectResponse(url="/admin/usuarios", status_code=303)


# Outras páginas administrativas
@router.get("/admin/perfis", response_class=HTMLResponse)
async def admin_perfis(request: Request):
    return templates.TemplateResponse("admin/admin.html", {
        "request": request,
        "titulo": "Perfis",
        "descricao": "Em desenvolvimento",
        "icone": "fas fa-id-badge",
        "template_name": "admin"
    })

@router.get("/admin/permissoes", response_class=HTMLResponse)
async def admin_permissoes(request: Request):
    return templates.TemplateResponse("admin/admin.html", {
        "request": request,
        "titulo": "Permissões",
        "descricao": "Em desenvolvimento", 
        "icone": "fas fa-user-shield",
        "template_name": "admin"
    })

@router.get("/admin/logs", response_class=HTMLResponse)
async def admin_logs(request: Request):
    return templates.TemplateResponse("admin/admin.html", {
        "request": request,
        "titulo": "Logs",
        "descricao": "Em desenvolvimento",
        "icone": "fas fa-file-alt",
        "template_name": "admin"
    })

@router.get("/admin/sistema", response_class=HTMLResponse)
async def admin_sistema(request: Request):
    return templates.TemplateResponse("admin/admin.html", {
        "request": request,
        "titulo": "Sistema",
        "descricao": "Em desenvolvimento",
        "icone": "fas fa-cogs",
        "template_name": "admin"
    })

@router.get("/admin/etl", response_class=HTMLResponse)
async def admin_etl(request: Request):
    return templates.TemplateResponse("admin/admin_etl.html", {"request": request, "template_name": "etl"})

@router.get("/admin/uasgs", response_class=HTMLResponse)
async def admin_uasgs(request: Request):
    return templates.TemplateResponse("admin/admin.html", {
        "request": request,
        "titulo": "UASGs",
        "descricao": "Em desenvolvimento",
        "icone": "fas fa-university",
        "template_name": "admin"
    })

@router.get("/admin/parametros", response_class=HTMLResponse)
async def admin_parametros(request: Request):
    return templates.TemplateResponse("admin/admin.html", {
        "request": request,
        "titulo": "Parâmetros",
        "descricao": "Em desenvolvimento",
        "icone": "fas fa-sliders-h",
        "template_name": "admin"
    })

@router.get("/admin/integracoes", response_class=HTMLResponse)
async def admin_integracoes(request: Request):
    return templates.TemplateResponse("admin/admin.html", {
        "request": request,
        "titulo": "Integrações",
        "descricao": "Em desenvolvimento",
        "icone": "fas fa-plug",
        "template_name": "admin"
    })

# ETL Endpoints
@router.get("/admin/etl/dw-tesouro", response_class=HTMLResponse)
async def admin_etl_dw_tesouro(request: Request):
    return templates.TemplateResponse("admin/admin_dw_tesouro.html", {"request": request, "template_name": "dw_tesouro"})

@router.get("/admin/etl/vdb-compras", response_class=HTMLResponse)
async def admin_etl_vdb_compras(request: Request):
    return templates.TemplateResponse("admin/admin_vdb_compras.html", {"request": request, "template_name": "vdb_compras"})

@router.get("/admin/etl/postgres-local", response_class=HTMLResponse)
async def admin_etl_postgres_local(request: Request):
    return templates.TemplateResponse("admin/admin_postgres_local.html", {"request": request, "template_name": "postgres_local"})

@router.get("/admin/etl/import-dw-tesouro", response_class=HTMLResponse)
async def admin_etl_import_dw_tesouro(request: Request):
    return templates.TemplateResponse("admin/admin_import_dw_tesouro.html", {"request": request, "template_name": "import_dw_tesouro"})

@router.get("/admin/etl/import-compras", response_class=HTMLResponse)
async def admin_etl_import_compras(request: Request):
    return templates.TemplateResponse("admin/admin_import_compras.html", {"request": request, "template_name": "import_compras"})

@router.get("/admin/etl/atualizar-compras", response_class=HTMLResponse)
async def admin_etl_atualizar_compras(request: Request):
    return templates.TemplateResponse("admin/admin_atualizar_compras.html", {"request": request, "template_name": "atualizar_compras"})

@router.get("/admin/etl/comparar-origem", response_class=HTMLResponse)
async def admin_etl_comparar_origem(request: Request):
    return templates.TemplateResponse("admin/admin_comparar_origem.html", {"request": request, "template_name": "comparar_origem"})

# VDB DW Tesouro table listing endpoint
@router.get("/admin/etl/dw-tesouro/lista-tabelas")
def listar_tabelas_dw_tesouro():
    """List tables from DW Tesouro VDB - returns JSON data"""
    
    # Check if emulation mode is enabled
    if settings.VDB_TEIID_EMULATION_MODE:
        # Return mock data from JSON file
        json_file_path = Path(settings.VDB_TEIID_JSON_MOCK_DIR) / "QueryFinanceiro_lista-tabelas.json"
        try:
            with open(json_file_path, 'r', encoding='utf-8') as f:
                return json.load(f)
        except FileNotFoundError:
            return {"error": "Arquivo de emulação não encontrado", "schemas": {}}
        except json.JSONDecodeError:
            return {"error": "Erro ao ler arquivo de emulação", "schemas": {}}
    
    # Normal VDB query execution
    query = (
        "SELECT t.schemaName, t.name FROM SYS.Tables t "
        "WHERE t.schemaName NOT LIKE 'SYS%' ORDER BY t.schemaName, t.name;"
    )
    linhas = executar_java("QueryFinanceiro", query)

    schemas = {}
    for i, linha in enumerate(linhas):
        if i == 0:
            continue
        try:
            schema, tabela = map(str.strip, linha.split(" | "))
            schemas.setdefault(schema, []).append(tabela)
        except:
            continue

    return {"schemas": schemas}

# VDB DW Tesouro table data endpoint
@router.get("/admin/etl/dw-tesouro/lista-campos")
def listar_campos_tabela_dw_tesouro(schema: str = Query(...), tabela: str = Query(...)):
    """Get table columns and data from DW Tesouro VDB - returns JSON data"""
    
    # Check if emulation mode is enabled
    if settings.VDB_TEIID_EMULATION_MODE:
        # Return mock data from JSON file
        json_file_path = Path(settings.VDB_TEIID_JSON_MOCK_DIR) / "QueryFinanceiro_lista-campos.json"
        try:
            with open(json_file_path, 'r', encoding='utf-8') as f:
                mock_data = json.load(f)
                # Update schema and tabela in mock data to match request
                mock_data["schema"] = schema
                mock_data["tabela"] = tabela
                return mock_data
        except FileNotFoundError:
            return {"error": "Arquivo de emulação não encontrado", "headers": [], "data": [], "schema": schema, "tabela": tabela}
        except json.JSONDecodeError:
            return {"error": "Erro ao ler arquivo de emulação", "headers": [], "data": [], "schema": schema, "tabela": tabela}
    
    try:
        # 1. Get table columns
        query_cols = f"SELECT c.name FROM SYS.Columns c WHERE c.SchemaName = '{schema}' AND c.TableName = '{tabela}' ORDER BY c.name;"
        colunas = executar_java("QueryFinanceiro", query_cols)
        
        if not colunas:
            return {"error": "Não foi possível obter as colunas da tabela", "headers": [], "data": [], "schema": schema, "tabela": tabela}
        
        headers = [h.strip() for h in colunas[1:] if h.strip()]  # Skip header row
        
        # Reorganize columns: 'id' first, then alphabetical
        if 'id' in headers:
            headers.remove('id')
            headers.sort()  # Sort alphabetically
            headers.insert(0, 'id')  # Put 'id' first
        else:
            headers.sort()  # Just sort alphabetically if no 'id'
        
        if not headers:
            return {"error": "Nenhuma coluna encontrada para a tabela", "headers": [], "data": [], "schema": schema, "tabela": tabela}
        
        # 2. Build data query with limit of 20 records
        colunas_quoted = ", ".join(f'"{c}"' for c in headers)
        
        # List of known large schemas/tables that need special handling
        large_schemas = ["DWTG_Colunar_Afinco_VBL"]
        large_table_prefixes = ["WD_", "DW_", "FACT_", "DIM_"]
        
        is_large_table = (
            schema in large_schemas or 
            any(tabela.startswith(prefix) for prefix in large_table_prefixes)
        )
        
        if is_large_table:
            # For large tables: use ORDER BY 1 (first column by position) - faster than column name
            query = f'''
                SELECT {colunas_quoted} FROM (
                    SELECT {colunas_quoted}, ROW_NUMBER() OVER (ORDER BY 1) AS rn
                    FROM "{schema}"."{tabela}"
                ) AS sub
                WHERE rn <= 20;
            '''.strip()
        else:
            # Keep the current approach for smaller tables
            coluna_ordem = headers[0] if headers else "1"
            query = f'''
                SELECT {colunas_quoted} FROM (
                    SELECT {colunas_quoted}, ROW_NUMBER() OVER (ORDER BY "{coluna_ordem}") AS rn
                    FROM "{schema}"."{tabela}"
                ) AS sub
                WHERE rn <= 20;
            '''.strip()
        
        # Execute data query
        linhas = executar_java("QueryFinanceiro", query)
        
        if not linhas or any("Erro:" in l for l in linhas):
            return {"error": "Erro ao executar query na tabela", "headers": headers, "data": [], "schema": schema, "tabela": tabela}
        
        # Process data rows
        data = []
        for linha in linhas[1:]:  # Skip header row
            row_data = linha.split(" | ")
            data.append(row_data)
        
        return {
            "error": None,
            "headers": headers,
            "data": data,
            "schema": schema,
            "tabela": tabela,
            "total_registros": len(data),
            "query_executada": query
        }
        
    except Exception as e:
        return {
            "error": f"Erro interno: {str(e)}",
            "headers": [],
            "data": [],
            "schema": schema,
            "tabela": tabela
        }
