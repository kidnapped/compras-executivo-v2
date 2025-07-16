import logging
from fastapi import APIRouter, Request, Depends, HTTPException, Query
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Any, Dict, List

from app.utils.session_utils import get_uasgs_str
from app.db.session import get_session_contratos, get_session_financeiro

logger = logging.getLogger(__name__)

router = APIRouter()

@router.get("/tudo")
async def get_tudo_data(
    request: Request,
    contrato_id: int = Query(..., description="ID do contrato"),
    db_contratos: AsyncSession = Depends(get_session_contratos),
    db_financeiro: AsyncSession = Depends(get_session_financeiro)
):
    """
    Retorna todos os dados de empenhos e documentos relacionados para um contrato específico
    
    - contrato_id: ID do contrato (query parameter obrigatório)
    
    A unidade_id é obtida automaticamente da sessão do usuário (UASG).
    
    Utiliza duas sessões de banco de dados:
    - db_contratos: Para consultar dados de contratos, empenhos e unidades
    - db_financeiro: Para consultar dados de DAR, DARF e GPS
    """
    try:
        # Step 1: Get unidade_id from user session
        uasgs = get_uasgs_str(request)
        if not uasgs:
            raise HTTPException(status_code=403, detail="UASG não definida")
        
        # Descobre os ID_UASG com base nos códigos
        result = await db_contratos.execute(
            text("SELECT id FROM unidades WHERE codigo = ANY(:uasg)"),
            {"uasg": uasgs}
        )
        ids_uasg = [row[0] for row in result.fetchall()]  # Access by index instead of name
        
        if not ids_uasg:
            raise HTTPException(status_code=404, detail="Unidade não encontrada para as UASGs da sessão")
            
        unidade_id = ids_uasg[0]  # Usa a primeira UASG encontrada

        # Step 2: Get unidade prefix (codigo + gestao)
        unidade_query = text("""
            SELECT COALESCE(codigo, '') || COALESCE(gestao, '') AS unidade_code
            FROM unidades
            WHERE id = :unidade_id
        """)
        unidade_result = await db_contratos.execute(unidade_query, {"unidade_id": unidade_id})
        unidade_prefix = unidade_result.scalar()

        if not unidade_prefix:
            raise HTTPException(
                status_code=404, 
                detail=f"Unidade {unidade_id} não encontrada"
            )

        # Step 3: Get all empenho fields for the given contract
        empenhos_query = text("""
            SELECT e.*
            FROM empenhos e
            JOIN contratoempenhos ce ON ce.empenho_id = e.id
            WHERE ce.contrato_id = :contrato_id
            ORDER BY e.id;
        """)
        empenhos_result = await db_contratos.execute(empenhos_query, {"contrato_id": contrato_id})
        empenhos = empenhos_result.mappings().all()

        if not empenhos:
            raise HTTPException(
                status_code=404, 
                detail=f"Nenhum empenho encontrado para o contrato {contrato_id}"
            )

        # Step 4: Prepare document ID-only queries
        dar_query = text("""
            SELECT id_documento_dar
            FROM t_export_wd_deta_orca_fina_dar
            WHERE id_documento_ne = :numero_empenho
        """)
        darf_query = text("""
            SELECT id_documento_darf
            FROM t_export_wd_deta_orca_fina_darf
            WHERE id_documento_ne = :numero_empenho
        """)
        gps_query = text("""
            SELECT id_documento_gps
            FROM t_export_wd_deta_orca_fina_gps
            WHERE id_documento_ne = :numero_empenho
        """)

        # Step 5: Prepare full document queries
        dar_full_query = text("""
            SELECT * FROM t_export_wd_documento 
            WHERE id_doc_dar = ANY(:dar_ids)
        """)
        darf_full_query = text("""
            SELECT * FROM t_export_wd_doc_darf 
            WHERE id_doc_darf = ANY(:darf_ids)
        """)
        gps_full_query = text("""
            SELECT * FROM t_export_wd_doc_gps 
            WHERE id_doc_gps = ANY(:gps_ids)
        """)

        # Step 6: Build response
        results = []

        for empenho in empenhos:
            full_numero = f"{unidade_prefix}{empenho['numero']}"

            # Execute document ID queries
            dar_result = await db_financeiro.execute(dar_query, {"numero_empenho": full_numero})
            dar_ids = [row[0] for row in dar_result.fetchall()]  # Access by index

            darf_result = await db_financeiro.execute(darf_query, {"numero_empenho": full_numero})
            darf_ids = [row[0] for row in darf_result.fetchall()]  # Access by index

            gps_result = await db_financeiro.execute(gps_query, {"numero_empenho": full_numero})
            gps_ids = [row[0] for row in gps_result.fetchall()]  # Access by index

            # Fetch full document data if IDs exist
            dar_documents = []
            if dar_ids:
                dar_full_result = await db_financeiro.execute(dar_full_query, {"dar_ids": dar_ids})
                dar_documents = [dict(row) for row in dar_full_result.mappings().all()]

            darf_documents = []
            if darf_ids:
                darf_full_result = await db_financeiro.execute(darf_full_query, {"darf_ids": darf_ids})
                darf_documents = [dict(row) for row in darf_full_result.mappings().all()]

            gps_documents = []
            if gps_ids:
                gps_full_result = await db_financeiro.execute(gps_full_query, {"gps_ids": gps_ids})
                gps_documents = [dict(row) for row in gps_full_result.mappings().all()]

            # Convert empenho to dict and handle datetime serialization
            empenho_dict = dict(empenho)
            
            # Convert datetime objects to ISO format strings
            for key, value in empenho_dict.items():
                if hasattr(value, 'isoformat'):
                    empenho_dict[key] = value.isoformat()
                elif value is None:
                    empenho_dict[key] = None

            # Convert datetime objects in document data
            for doc_list in [dar_documents, darf_documents, gps_documents]:
                for doc in doc_list:
                    for key, value in doc.items():
                        if hasattr(value, 'isoformat'):
                            doc[key] = value.isoformat()
                        elif value is None:
                            doc[key] = None

            results.append({
                "prefixed_numero": full_numero,
                "empenho": empenho_dict,  # All empenho fields
                "id_documento_dar": dar_ids,
                "id_documento_darf": darf_ids,
                "id_documento_gps": gps_ids,
                "documentos_dar": dar_documents,  # Full DAR document data
                "documentos_darf": darf_documents,  # Full DARF document data
                "documentos_gps": gps_documents  # Full GPS document data
            })

        response_data = {
            "contrato_id": contrato_id,
            "unidade_id": unidade_id,
            "unidade_prefix": unidade_prefix,
            "total_empenhos": len(results),
            "empenhos_data": results
        }

        logger.info(f"Returning tudo data for contrato {contrato_id}: {len(results)} empenhos found with prefix {unidade_prefix}")
        return response_data

    except Exception as e:
        logger.error(f"Error in get_tudo_data for contrato {contrato_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro interno do servidor: {str(e)}")
