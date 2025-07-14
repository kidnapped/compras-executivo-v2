from fastapi import APIRouter, Request, Query, Form
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
import subprocess

router = APIRouter()
templates = Jinja2Templates(directory="app/templates")

# JAVA_DIR = "/Users/leo/Development/ws-blocok/comprasexecutivo/vdb"
JAVA_DIR = "/home/ec2-user/py-app/vdb"
JAR_FILE = "jboss-dv-6.3.0-teiid-jdbc.jar"

def executar_java(vdb_tipo: str, query: str):
    cmd = f"cd {JAVA_DIR} && java -cp .:{JAR_FILE} {vdb_tipo} \"{query}\""
    result = subprocess.run(cmd, shell=True, stdout=subprocess.PIPE, text=True)
    return result.stdout.strip().splitlines()

# Página principal
@router.get("/vdb", response_class=HTMLResponse)
def render_vdb_page(request: Request):
    return templates.TemplateResponse("vdb.html", {"request": request})

# Menu lateral
@router.get("/vdb/menu", response_class=HTMLResponse)
def listar_menu(request: Request, vdb: str = Query(default=None)):
    vdb = vdb or "QueryContratos"

    query = (
        "SELECT t.schemaName, t.name FROM SYS.Tables t "
        "WHERE t.schemaName NOT LIKE 'SYS%' ORDER BY t.schemaName, t.name;"
    )
    linhas = executar_java(vdb, query)

    html = ""
    schemas = {}
    for i, linha in enumerate(linhas):
        if i == 0:
            continue
        try:
            schema, tabela = map(str.strip, linha.split(" | "))
            schemas.setdefault(schema, []).append(tabela)
        except:
            continue

    for schema, tabelas in schemas.items():
        html += f"<li class='schema'>{schema}<ul>"
        for tabela in tabelas:
            html += (
                f"<li class='tabela' onclick=\"selecionarTabela(this, '{schema}', '{tabela}')\">{tabela}</li>"
            )
        html += "</ul></li>"

    return HTMLResponse(html)

# Query automática (por schema + tabela) - Uses VDB selection from UI
@router.get("/vdb/query", response_class=HTMLResponse)
def executar_query_automatica(
    request: Request,
    schema: str = Query(...),
    tabela: str = Query(...),
    vdb: str = Query(default=None),
    debug: bool = Query(default=False),
):
    vdb = vdb or "QueryContratos"
    filtros = {
        k: v for k, v in request.query_params.items()
        if k.startswith("f") and v.strip()
    }

    # 1. Obter colunas da tabela
    query_cols = f"SELECT c.name FROM SYS.Columns c WHERE c.SchemaName = '{schema}' AND c.TableName = '{tabela}' ORDER BY c.name;"

    # Início do HTML mostrando a query das colunas
    html = ""
    if debug:
        html += "<pre style='background:#eef; border:1px solid #88f; padding:10px; font-size:12px; margin-bottom:10px; overflow:auto; white-space:pre-wrap;'>"
        html += f"<code>{query_cols}</code></pre>"

    colunas = executar_java(vdb, query_cols)

    # Adiciona DEBUG da resposta da query das colunas
    if debug:
        html += "<div style='background:#fdfce2; border:1px solid #aa0; padding:10px; font-size:12px; margin-bottom:10px;'>"
        html += "<strong>Debug: Saída da query das colunas</strong><br><br>"
        html += "<pre style='white-space:pre-wrap; overflow:auto; max-height:200px;'><code>"
        html += "\n".join(colunas)
        html += "</code></pre></div>"

    headers = [h.strip() for h in colunas[1:] if h.strip()]  # Ignora cabeçalho da resposta
    
    # Reorganiza colunas: 'id' primeiro, depois alfabético
    if 'id' in headers:
        headers.remove('id')
        headers.sort()  # Ordena alfabeticamente
        headers.insert(0, 'id')  # Coloca 'id' no início
    else:
        headers.sort()  # Apenas ordena alfabeticamente se não houver 'id'

    # 2. WHERE com filtros
    where_clauses = []
    for key, value in filtros.items():
        try:
            idx = int(key[1:])
            col = headers[idx]
            val = value.replace("'", "''")
            
            # User can type their own wildcards like "test%" or "%test" or "%test%"
            if '%' in val:
                where_clauses.append(f"UPPER(\"{col}\") LIKE UPPER('{val}')")
            else:
                where_clauses.append(f"UPPER(\"{col}\") = UPPER('{val}')")  # exact match if no wildcards

        except (IndexError, ValueError):
            continue

    where_sql = " WHERE " + " AND ".join(where_clauses) if where_clauses else ""

    # 3. Query com limite de 20 registros - Adaptive approach for large tables
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
                FROM "{schema}"."{tabela}" {where_sql}
            ) AS sub
            WHERE rn <= 20;
        '''.strip()
    else:
        # Keep the current approach for smaller tables
        coluna_ordem = headers[0] if headers else "1"
        query = f'''
            SELECT {colunas_quoted} FROM (
                SELECT {colunas_quoted}, ROW_NUMBER() OVER (ORDER BY "{coluna_ordem}") AS rn
                FROM "{schema}"."{tabela}" {where_sql}
            ) AS sub
            WHERE rn <= 20;
        '''.strip()

    # Adiciona query principal ao HTML
    html += "<pre style='background:#f4f4f4; border:1px solid #ccc; padding:10px; font-size:12px; margin-bottom:10px; overflow:auto; white-space:pre-wrap;'><code>"
    html += query
    html += "</code></pre>"

    try:
        linhas = executar_java(vdb, query)
        if not linhas or any("Erro:" in l for l in linhas):
            raise RuntimeError("\n".join(linhas))
    except Exception as e:
        erro_html = html
        erro_html += "<div style='background:#fee; border:1px solid #f00; padding:10px;'>"
        erro_html += "<strong>Erro ao executar a query:</strong><br><br>"
        erro_html += f"<pre style='color:#c00'><code>{str(e)}</code></pre>"
        erro_html += "</div>"
        return HTMLResponse(erro_html, status_code=500)

    # 4. Renderizar tabela
    html += "<table><thead><tr>"
    campos = linhas[0].split(" | ")
    for i, campo in enumerate(campos):
        val = filtros.get(f"f{i}", "")
        html += f"<th><div>{campo}</div><input value=\"{val}\" data-col-index=\"{i}\"></th>"
    html += "</tr></thead><tbody>"

    for linha in linhas[1:]:
        html += "<tr>" + "".join(f"<td>{c}</td>" for c in linha.split(" | ")) + "</tr>"
    html += "</tbody></table>"

    return HTMLResponse(html)

def detect_vdb_from_query(query: str) -> str:
    """
    Detect which VDB/Java file to use based on the actual schema names in the SQL query.
    Looks for specific schema identifiers to determine the appropriate database connection.
    """
    query_upper = query.upper()
    
    # Actual schema names used in the databases
    financeiro_schema = "DWTG_COLUNAR_AFINCO_VBL"
    contratos_schema = "CONTRATOSGOV_USR_COMPRASEXECUTIVO_VBL"
    
    # Count occurrences of each schema in the query
    financeiro_count = query_upper.count(financeiro_schema)
    contratos_count = query_upper.count(contratos_schema)
    
    # Also check for partial schema patterns (fallback)
    if financeiro_count == 0 and contratos_count == 0:
        # Check for common schema components
        if "DWTG_COLUNAR" in query_upper or "AFINCO_VBL" in query_upper:
            financeiro_count += 1
        
        if "CONTRATOSGOV" in query_upper or "COMPRASEXECUTIVO" in query_upper:
            contratos_count += 1
    
    # Return the VDB based on which schema appears more frequently
    # Default to Contratos if no specific schema is detected
    if financeiro_count > contratos_count:
        return "QueryFinanceiro"
    else:
        return "QueryContratos"

# Query manual (via POST) - Separate endpoint with intelligent VDB detection
@router.post("/vdb/manual-query", response_class=HTMLResponse)
def executar_query_manual(
    request: Request,
    query: str = Form(...),
    debug: bool = Query(default=False)
):
    # Intelligently detect which VDB to use based on query content
    vdb_detectado = detect_vdb_from_query(query)
    
    html = ""
    
    # Show debug info if requested
    if debug:
        query_upper = query.upper()
        financeiro_schema = "DWTG_COLUNAR_AFINCO_VBL"
        contratos_schema = "CONTRATOSGOV_USR_COMPRASEXECUTIVO_VBL"
        
        financeiro_count = query_upper.count(financeiro_schema)
        contratos_count = query_upper.count(contratos_schema)
        
        html += "<div style='background:#e6f3ff; border:1px solid #0066cc; padding:10px; font-size:12px; margin-bottom:10px;'>"
        html += f"<strong>Debug: VDB Auto-detectado:</strong> {vdb_detectado}<br>"
        html += f"<strong>Schema Financeiro detectado:</strong> {financeiro_count} ocorrências<br>"
        html += f"<strong>Schema Contratos detectado:</strong> {contratos_count} ocorrências<br>"
        html += f"<strong>Query analisada:</strong> {query[:100]}{'...' if len(query) > 100 else ''}"
        html += "</div>"
    
    # Show the query
    html += "<pre style='background:#f4f4f4; border:1px solid #ccc; padding:10px; font-size:12px; margin-bottom:10px; overflow:auto; white-space:pre-wrap;'><code>"
    html += query
    html += "</code></pre>"
    
    # Show which VDB is being used
    vdb_name = "Financeiro" if vdb_detectado == "QueryFinanceiro" else "Contratos"
    html += f"<div style='background:#f0f8f0; border:1px solid #4caf50; padding:8px; font-size:12px; margin-bottom:10px;'>"
    html += f"<strong>Executando com VDB:</strong> {vdb_name} ({vdb_detectado})"
    html += "</div>"

    try:
        linhas = executar_java(vdb_detectado, query)
        
        if not linhas:
            return HTMLResponse(html + "<p>Nenhum dado retornado.</p>", status_code=200)
        
        # Check for errors in response
        if any("Erro:" in l or "Exception" in l or "Error" in l for l in linhas):
            error_output = "\n".join(linhas)
            html += "<div style='background:#fee; border:1px solid #f00; padding:10px;'>"
            html += "<strong>Erro ao executar a query:</strong><br><br>"
            html += f"<pre style='color:#c00; white-space:pre-wrap;'><code>{error_output}</code></pre>"
            html += "</div>"
            return HTMLResponse(html, status_code=500)
    
    except Exception as e:
        html += "<div style='background:#fee; border:1px solid #f00; padding:10px;'>"
        html += "<strong>Erro ao executar a query:</strong><br><br>"
        html += f"<pre style='color:#c00'><code>{str(e)}</code></pre>"
        html += "</div>"
        return HTMLResponse(html, status_code=500)

    # Build results table
    html += "<table><thead><tr>"
    headers = linhas[0].split(" | ")
    for h in headers:
        html += f"<th>{h}</th>"
    html += "</tr></thead><tbody>"

    for linha in linhas[1:]:
        html += "<tr>" + "".join(f"<td>{c}</td>" for c in linha.split(" | ")) + "</tr>"
    html += "</tbody></table>"

    return HTMLResponse(html)
