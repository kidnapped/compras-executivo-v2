import asyncio
import logging
from typing import List, Dict, Any, Tuple
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

logger = logging.getLogger(__name__)

class QueryService:
    def __init__(self, db_contratos: AsyncSession, db_financeiro: AsyncSession):
        self.db_contratos = db_contratos
        self.db_financeiro = db_financeiro

    async def get_contract_empenhos(self, contrato_id: int, unidadeempenho_id: int = None, empenho_numero: str = None) -> List[Dict]:
        """Get all empenhos for a contract, optionally filtered by empenho number"""
        
        import time
        start_time = time.time()
        
        # Debug logging for parameters
        logger.info(f"🔍 Empenho Query Debug:")
        logger.info(f"  - contrato_id: {contrato_id}")
        logger.info(f"  - unidadeempenho_id: {unidadeempenho_id}")
        logger.info(f"  - empenho_numero: '{empenho_numero}' (length: {len(empenho_numero) if empenho_numero else 0})")
        
        if unidadeempenho_id:
            # Use the same query structure as the working endpoint
            logger.info(f"Querying empenhos for contrato_id={contrato_id}, unidadeempenho_id={unidadeempenho_id}, empenho_numero={empenho_numero}")
            
            if empenho_numero:
                # Filter by specific empenho number
                query = text("""
                    SELECT e.*
                    FROM contratoempenhos ce
                    JOIN empenhos e ON ce.empenho_id = e.id
                    WHERE ce.unidadeempenho_id = :unidadeempenho_id 
                      AND ce.contrato_id = :contrato_id
                      AND e.numero = :empenho_numero
                    ORDER BY e.id;
                """)
                
                # Debug: Let's also check what empenhos exist for this contract
                debug_query = text("""
                    SELECT e.id, e.numero
                    FROM contratoempenhos ce
                    JOIN empenhos e ON ce.empenho_id = e.id
                    WHERE ce.unidadeempenho_id = :unidadeempenho_id 
                      AND ce.contrato_id = :contrato_id
                    ORDER BY e.id;
                """)
                debug_result = await self.db_contratos.execute(debug_query, {
                    "contrato_id": contrato_id, 
                    "unidadeempenho_id": unidadeempenho_id
                })
                debug_empenhos = [dict(row) for row in debug_result.mappings().all()]
                logger.info(f"📋 Available empenhos for this contract: {[emp['numero'] for emp in debug_empenhos]}")
                
                result = await self.db_contratos.execute(query, {
                    "contrato_id": contrato_id, 
                    "unidadeempenho_id": unidadeempenho_id,
                    "empenho_numero": empenho_numero
                })
            else:
                # Get all empenhos for the contract
                query = text("""
                    SELECT e.*
                    FROM contratoempenhos ce
                    JOIN empenhos e ON ce.empenho_id = e.id
                    WHERE ce.unidadeempenho_id = :unidadeempenho_id 
                      AND ce.contrato_id = :contrato_id
                    ORDER BY e.id;
                """)
                result = await self.db_contratos.execute(query, {"contrato_id": contrato_id, "unidadeempenho_id": unidadeempenho_id})
        else:
            # Fallback to simpler query if no unidadeempenho_id provided
            logger.info(f"Querying empenhos for contrato_id={contrato_id} (no unidadeempenho_id filter), empenho_numero={empenho_numero}")
            
            if empenho_numero:
                # Filter by specific empenho number
                query = text("""
                    SELECT e.*
                    FROM empenhos e
                    JOIN contratoempenhos ce ON ce.empenho_id = e.id
                    WHERE ce.contrato_id = :contrato_id
                      AND e.numero = :empenho_numero
                    ORDER BY e.id;
                """)
                result = await self.db_contratos.execute(query, {"contrato_id": contrato_id, "empenho_numero": empenho_numero})
            else:
                # Get all empenhos for the contract
                query = text("""
                    SELECT e.*
                    FROM empenhos e
                    JOIN contratoempenhos ce ON ce.empenho_id = e.id
                    WHERE ce.contrato_id = :contrato_id
                    ORDER BY e.id;
                """)
                result = await self.db_contratos.execute(query, {"contrato_id": contrato_id})
        
        empenhos = [dict(row) for row in result.mappings().all()]
        
        end_time = time.time()
        query_duration = round((end_time - start_time) * 1000, 2)  # Convert to milliseconds
        
        logger.info(f"⏱️ Query completed in {query_duration}ms - returned {len(empenhos)} empenhos")
        
        return empenhos

    async def get_document_ids(self, full_numero: str) -> Dict[str, List[int]]:
        """Get all document IDs for an empenho"""
        # Execute queries sequentially to avoid session conflicts
        dar_ids = await self._get_dar_ids(full_numero)
        darf_ids = await self._get_darf_ids(full_numero)
        gps_ids = await self._get_gps_ids(full_numero)
        
        return {
            'dar_ids': dar_ids,
            'darf_ids': darf_ids,
            'gps_ids': gps_ids
        }

    async def get_financial_data(self, full_numero: str, numero: str, unidade_prefix: str, uasg_codigo: str = None) -> Dict[str, List[Dict]]:
        """Get all financial data for an empenho"""
        # Execute queries sequentially to avoid session conflicts
        ne_item_operacao = await self._get_ne_item_operacao(full_numero)
        ne_item = await self._get_ne_item(full_numero)
        linha_evento_ob = await self._get_linha_evento_ob(numero, uasg_codigo or unidade_prefix)
        
        return {
            'Orçamentário': ne_item_operacao,
            'ne_item': ne_item,
            'linha_evento_ob': linha_evento_ob
        }

    async def get_full_documents(self, document_ids: Dict[str, List[int]]) -> Dict[str, List[Dict]]:
        """Get full document data"""
        # Execute queries sequentially to avoid session conflicts
        dar_docs = []
        if document_ids['dar_ids']:
            dar_docs = await self._get_full_dar_documents(document_ids['dar_ids'])
            
        darf_docs = []
        if document_ids['darf_ids']:
            darf_docs = await self._get_full_darf_documents(document_ids['darf_ids'])
            
        gps_docs = []
        if document_ids['gps_ids']:
            gps_docs = await self._get_full_gps_documents(document_ids['gps_ids'])
        
        return {
            'dar_documents': dar_docs,
            'darf_documents': darf_docs,
            'gps_documents': gps_docs
        }

    # Private methods for individual queries
    async def _get_dar_ids(self, full_numero: str) -> List[int]:
        query = text("SELECT id_documento_dar FROM wd_deta_orca_fina_dar WHERE id_documento_ne = :numero_empenho")
        result = await self.db_financeiro.execute(query, {"numero_empenho": full_numero})
        return [row[0] for row in result.fetchall()]

    async def _get_darf_ids(self, full_numero: str) -> List[int]:
        query = text("SELECT id_documento_darf FROM wd_deta_orca_fina_darf WHERE id_documento_ne = :numero_empenho")
        result = await self.db_financeiro.execute(query, {"numero_empenho": full_numero})
        return [row[0] for row in result.fetchall()]

    async def _get_gps_ids(self, full_numero: str) -> List[int]:
        query = text("SELECT id_documento_gps FROM wd_deta_orca_fina_gps WHERE id_documento_ne = :numero_empenho")
        result = await self.db_financeiro.execute(query, {"numero_empenho": full_numero})
        return [row[0] for row in result.fetchall()]

    async def _get_full_dar_documents(self, dar_ids: List[int]) -> List[Dict]:
        query = text("SELECT * FROM wd_doc_dar WHERE id_doc_dar = ANY(:dar_ids)")
        result = await self.db_financeiro.execute(query, {"dar_ids": dar_ids})
        return [dict(row) for row in result.mappings().all()]

    async def _get_full_darf_documents(self, darf_ids: List[int]) -> List[Dict]:
        query = text("SELECT * FROM wd_doc_darf WHERE id_doc_darf = ANY(:darf_ids)")
        result = await self.db_financeiro.execute(query, {"darf_ids": darf_ids})
        return [dict(row) for row in result.mappings().all()]

    async def _get_full_gps_documents(self, gps_ids: List[int]) -> List[Dict]:
        query = text("SELECT * FROM wd_doc_gps WHERE id_doc_gps = ANY(:gps_ids)")
        result = await self.db_financeiro.execute(query, {"gps_ids": gps_ids})
        return [dict(row) for row in result.mappings().all()]

    async def _get_ne_item_operacao(self, full_numero: str) -> List[Dict]:
        query = text("""
            SELECT dt_operacao, va_operacao, no_operacao, qt_item, va_unitario, id_item
            FROM wd_doc_ne_item_operacao
            WHERE id_doc_ne = :numero_empenho
        """)
        result = await self.db_financeiro.execute(query, {"numero_empenho": full_numero})
        return [dict(row) for row in result.mappings().all()]

    async def _get_ne_item(self, full_numero: str) -> List[Dict]:
        query = text("""
            SELECT id_item, ds_item
            FROM wd_doc_ne_item
            WHERE id_doc_ne = :numero_empenho
        """)
        result = await self.db_financeiro.execute(query, {"numero_empenho": full_numero})
        return [dict(row) for row in result.mappings().all()]

    async def _get_linha_evento_ob(self, numero: str, uasg_codigo: str) -> List[Dict]:
        logger.info(f"OB Query - numero: '{numero}', uasg_codigo: '{uasg_codigo}'")
        query = text("""
            SELECT ob.va_linha_evento, wdo.id_doc_ob, wdo.nr_ordem_pagamento, wdo.id_tp_ob, wdo.id_doc_ob_cancelada, wdo.id_dia_saque_bacen, wdo.id_mes_saque_bacen,wdo.id_ano_saque_bacen
            FROM wd_linha_evento_ob ob
            LEFT JOIN wd_doc_ob wdo ON ob.id_documento_ob = wdo.id_doc_ob
            WHERE ob.co_inscricao_1 = :numero_empenho
              AND ob.id_ug_ne = :uasg_codigo
        """)
        result = await self.db_financeiro.execute(query, {"numero_empenho": numero, "uasg_codigo": uasg_codigo})
        ob_data = [dict(row) for row in result.mappings().all()]
        logger.info(f"OB Query returned {len(ob_data)} results")
        if len(ob_data) == 0:
            # Try a broader query to see if there's any OB data with just the numero
            logger.info(f"No OB data found, trying broader search with numero: '{numero}'")
            broad_query = text("""
                SELECT ob.va_linha_evento, ob.co_inscricao_1, ob.id_ug_ne, wdo.id_doc_ob, wdo.nr_ordem_pagamento
                FROM wd_linha_evento_ob ob
                LEFT JOIN wd_doc_ob wdo ON ob.id_documento_ob = wdo.id_doc_ob
                WHERE ob.co_inscricao_1 = :numero_empenho
            """)
            broad_result = await self.db_financeiro.execute(broad_query, {"numero_empenho": numero})
            broad_data = [dict(row) for row in broad_result.mappings().all()]
            logger.info(f"Broader OB search found {len(broad_data)} results")
            if broad_data:
                logger.info(f"Sample OB data: {broad_data[0] if broad_data else 'None'}")
        return ob_data
