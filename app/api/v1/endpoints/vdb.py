from fastapi import APIRouter, Request, Query, Form
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
import subprocess

router = APIRouter()
templates = Jinja2Templates(directory="app/templates")

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

# Query automática (por schema + tabela)
@router.get("/vdb/query", response_class=HTMLResponse)
def executar_query_automatica(
    request: Request,
    schema: str = Query(...),
    tabela: str = Query(...),
    page: int = Query(default=1),
    vdb: str = Query(default=None),
    debug: bool = Query(default=False),
):
    vdb = vdb or "QueryContratos"
    filtros = {
        k: v for k, v in request.query_params.items()
        if k.startswith("f") and v.strip()
    }

    limit = 20
    offset = (page - 1) * limit

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

    # 2. WHERE com filtros
    where_clauses = []
    for key, value in filtros.items():
        try:
            idx = int(key[1:])
            col = headers[idx]
            val = value.replace("'", "''")
            where_clauses.append(f"UPPER(\"{col}\") LIKE UPPER('%{val}%')")
        except (IndexError, ValueError):
            continue

    where_sql = " WHERE " + " AND ".join(where_clauses) if where_clauses else ""

    # 3. Query paginada
    colunas_quoted = ", ".join(f'"{c}"' for c in headers)
    coluna_ordem = headers[0] if headers else "1"
    row_ini = offset + 1
    row_fim = offset + limit

    query = f'''
        SELECT * FROM (
            SELECT {colunas_quoted}, ROW_NUMBER() OVER (ORDER BY "{coluna_ordem}") AS rn
            FROM "{schema}"."{tabela}" {where_sql}
        ) AS sub
        WHERE rn BETWEEN {row_ini} AND {row_fim};
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

    # 5. Paginação
    count_query = f'SELECT COUNT(*) FROM "{schema}"."{tabela}" {where_sql};'
    count_result = executar_java(vdb, count_query)
    total = int(count_result[1].strip()) if len(count_result) > 1 else 0
    total_paginas = max(1, (total + limit - 1) // limit)

    html += "<div style='margin-top:10px; display:flex; gap:5px; flex-wrap:wrap;'>"

    # Intervalo de páginas vizinhas
    start = max(1, page - 3)
    end = min(total_paginas, page + 3)

    # Renderiza intervalo
    for p in range(start, end + 1):
        if p == page:
            html += f"<button disabled style='font-weight:bold; background:#b0e0ff'>{p}</button>"
        else:
            html += f"<button onclick=\"carregarTabela('{schema}', '{tabela}', {p}, {filtros})\">{p}</button>"

    # Adiciona botão final se ainda não estiver incluído
    if end < total_paginas:
        html += f"<button onclick=\"carregarTabela('{schema}', '{tabela}', {total_paginas}, {filtros})\">{total_paginas}</button>"

    html += "</div>"

    return HTMLResponse(html)

# Query manual (via POST)
@router.post("/vdb/query", response_class=HTMLResponse)
def executar_query_manual(
    request: Request,
    query: str = Form(...),
    vdb: str = Query(default=None)
):
    vdb = vdb or "QueryContratos"
    linhas = executar_java(vdb, query)

    if not linhas:
        return HTMLResponse("<p>Nenhum dado retornado.</p>", status_code=200)

    # Mostrar a query em destaque
    html = "<pre style='background:#f4f4f4; border:1px solid #ccc; padding:10px; font-size:12px; margin-bottom:10px; overflow:auto; white-space:pre-wrap;'><code>"
    html += query
    html += "</code></pre>"

    # Tabela de resultados
    html += "<table><thead><tr>"
    headers = linhas[0].split(" | ")
    for h in headers:
        html += f"<th>{h}</th>"
    html += "</tr></thead><tbody>"

    for linha in linhas[1:]:
        html += "<tr>" + "".join(f"<td>{c}</td>" for c in linha.split(" | ")) + "</tr>"
    html += "</tbody></table>"

    return HTMLResponse(html)
