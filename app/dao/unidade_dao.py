from typing import Iterable, List, Literal, Sequence, Dict, Any

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession


ReturnType = Literal["ids", "codigo_nome", "mappings"]


async def get_unidades_by_codigo(
    db: AsyncSession,
    codigos: Iterable[str],
    return_type: ReturnType = "ids",
) -> Sequence[Any]:
    """Fetch unidades by UASG codes with selectable return shape.

    Args:
        db: Async SQLAlchemy session connected to the contratos database.
        codigos: Iterable of UASG codes (strings).
        return_type: One of:
            - "ids": returns List[int] of unidade IDs.
            - "codigo_nome": returns List[Dict[str, Any]] with keys 'codigo', 'nomeresumido'.
            - "mappings": returns List[Dict[str, Any]] with available columns for advanced use.

    Returns:
        A sequence matching the selected return_type.
    """
    codes_list = list(codigos or [])
    if not codes_list:
        return []

    # Decide columns to fetch
    if return_type == "ids":
        columns = ["id"]
    elif return_type == "codigo_nome":
        columns = ["codigo", "nomeresumido"]
    else:  # "mappings" - return common useful columns
        columns = ["id", "codigo", "nomeresumido"]

    cols_sql = ", ".join(columns)
    order_clause = " ORDER BY codigo" if "codigo" in columns else ""

    query = text(
        f"SELECT {cols_sql} FROM unidades WHERE codigo = ANY(:codigos){order_clause}"
    )
    result = await db.execute(query, {"codigos": codes_list})

    if return_type == "ids":
        return list(result.scalars().all())

    rows = result.mappings().all()
    if return_type == "codigo_nome":
        # Normalize to only required keys
        return [
            {"codigo": r["codigo"], "nomeresumido": r["nomeresumido"]}
            for r in rows
        ]

    # mappings: return as-is (id, codigo, nomeresumido)
    return rows


# Wrapper removed as requested; use get_unidades_by_codigo(..., return_type="ids") directly
