from fastapi import APIRouter, Request, Depends
from fastapi.responses import HTMLResponse, RedirectResponse
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.templates import templates
from app.db.session import get_session_contratos

router = APIRouter()

@router.get("/indicadores", response_class=HTMLResponse)
async def indicadores(request: Request):
    # Check if user is logged in
    cpf = request.session.get("cpf")
    if not cpf:
        return RedirectResponse(url="/login?next=/indicadores")
    
    return templates.TemplateResponse("indicadores.html", {
        "request": request,
        "template_name": "indicadores"
    })

@router.get("/indicadores/mapa-estados")
async def get_indicadores_mapa_estados(
    db: AsyncSession = Depends(get_session_contratos)
):
    query = """
        WITH estados AS (
          SELECT * FROM (VALUES
            (11, 'RO'), (12, 'AC'), (13, 'AM'), (14, 'RR'), (15, 'PA'), (16, 'AP'), (17, 'TO'),
            (21, 'MA'), (22, 'PI'), (23, 'CE'), (24, 'RN'), (25, 'PB'), (26, 'PE'),
            (27, 'AL'), (28, 'SE'), (29, 'BA'),
            (31, 'MG'), (32, 'ES'), (33, 'RJ'), (35, 'SP'),
            (41, 'PR'), (42, 'SC'), (43, 'RS'),
            (50, 'MS'), (51, 'MT'), (52, 'GO'), (53, 'DF')
          ) AS e(estado_id, uf)
        )
        SELECT 
          e.uf,
          COUNT(DISTINCT c.id) AS total_contratos
        FROM contratos c
        JOIN unidades u ON u.id = c.unidade_id
        JOIN municipios m ON m.id = u.municipio_id
        JOIN estados e ON e.estado_id = m.estado_id
        WHERE c.deleted_at IS null and c.unidade_id is not null
        GROUP BY e.uf
        ORDER BY total_contratos DESC;
    """
    result = await db.execute(text(query))
    rows = result.mappings().all() or []

    estados = [
        {
            "uf": row.get("uf"),
            "total_contratos": row.get("total_contratos", 0) or 0
        }
        for row in rows
    ]

    return {
        "estados": estados
    }

@router.get("/indicadores/contratos-por-regiao")
async def get_indicadores_contratos_por_regiao(
    db: AsyncSession = Depends(get_session_contratos)
):
    query = """
        WITH regioes AS (
            SELECT * FROM (VALUES
                (11, 'Norte'), (12, 'Norte'), (13, 'Norte'), (14, 'Norte'), (15, 'Norte'), (16, 'Norte'), (17, 'Norte'),
                (21, 'Nordeste'), (22, 'Nordeste'), (23, 'Nordeste'), (24, 'Nordeste'), (25, 'Nordeste'), (26, 'Nordeste'),
                (27, 'Nordeste'), (28, 'Nordeste'), (29, 'Nordeste'),
                (31, 'Sudeste'), (32, 'Sudeste'), (33, 'Sudeste'), (35, 'Sudeste'),
                (41, 'Sul'), (42, 'Sul'), (43, 'Sul'),
                (50, 'Centro-Oeste'), (51, 'Centro-Oeste'), (52, 'Centro-Oeste'), (53, 'Centro-Oeste')
            ) AS r(estado_id, regiao)
        )
        SELECT r.regiao,
               COUNT(DISTINCT c.id) AS total_contratos
        FROM contratos c
        JOIN unidades u ON u.id = c.unidade_id
        JOIN municipios m ON m.id = u.municipio_id
        JOIN regioes r ON r.estado_id = m.estado_id
        WHERE c.deleted_at IS NULL
        GROUP BY r.regiao
        ORDER BY total_contratos DESC;
    """
    result = await db.execute(text(query))
    rows = result.mappings().all() or []

    regioes = [
        {
            "regiao": row.get("regiao"),
            "total_contratos": row.get("total_contratos", 0) or 0
        }
        for row in rows
    ]

    return {
        "regioes": regioes
    }
