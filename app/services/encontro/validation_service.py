from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from typing import List, Dict, Optional, Any
from app.utils.session_utils import get_uasgs_str
import logging

logger = logging.getLogger(__name__)

class ValidationService:
    """Handles validation logic for encontro operations"""
    
    def __init__(self, db_contratos: AsyncSession):
        self.db_contratos = db_contratos

    async def validate_contract_access(self, contrato_id: int, user_id: int, request=None) -> Dict[str, Any]:
        """
        Validate if a user has access to a specific contract
        Uses the same validation logic as existing endpoints
        Returns contract info if valid, None if access denied
        """
        if not request:
            # If no request provided, assume access (for backward compatibility)
            return {'valid': True, 'unidade_id': None}
            
        # Get UASGs from session (same as other endpoints)
        uasgs = get_uasgs_str(request)
        if not uasgs:
            return {'valid': False, 'message': 'No UASGs in session'}
        
        # Convert UASG codes to IDs
        result = await self.db_contratos.execute(
            text("SELECT id FROM unidades WHERE codigo = ANY(:uasg)"),
            {"uasg": uasgs}
        )
        ids_uasg = [row[0] for row in result.fetchall()]
        
        if not ids_uasg:
            return {'valid': False, 'message': 'No valid UASGs found'}
            
        # Validate that the contract belongs to one of the user's UASGs
        # (Same logic as the original endpoint)
        contrato_validation_query = text("""
            SELECT c.id, c.unidade_id, u.codigo as uasg_codigo
            FROM contratos c
            JOIN unidades u ON c.unidade_id = u.id
            WHERE c.id = :contrato_id AND c.unidade_id = ANY(:ids_uasg)
        """)
        
        validation_result = await self.db_contratos.execute(
            contrato_validation_query, 
            {"contrato_id": contrato_id, "ids_uasg": ids_uasg}
        )
        
        contract_row = validation_result.mappings().first()
        if contract_row:
            # Return both the contract's unidade_id and the first UASG ID
            # The UASG ID should be used for empenhos query (unidadeempenho_id)
            result = {
                'valid': True, 
                'unidade_id': contract_row['unidade_id'],
                'uasg_codigo': contract_row['uasg_codigo'],
                'unidadeempenho_id': ids_uasg[0] if ids_uasg else None  # Use first UASG ID
            }
            logger.info(f"Contract validation successful: {result}")
            return result
        else:
            logger.warning(f"Contract {contrato_id} not accessible to user with UASGs: {ids_uasg}")
            return {'valid': False, 'message': 'Contract not accessible to user'}

    async def get_user_accessible_contracts(self, user_id: int, request=None, limit: Optional[int] = None) -> List[Dict]:
        """Get all contracts accessible to a user"""
        if not request:
            return []
            
        # Get UASGs from session
        uasgs = get_uasgs_str(request)
        if not uasgs:
            return []
        
        # Convert UASG codes to IDs
        result = await self.db_contratos.execute(
            text("SELECT id FROM unidades WHERE codigo = ANY(:uasg)"),
            {"uasg": uasgs}
        )
        user_uasgs = [row[0] for row in result.fetchall()]
        
        if not user_uasgs:
            return []
            
        query = text("""
            SELECT c.id, c.numero, c.unidade_id, u.codigo as uasg_codigo
            FROM contratos c
            JOIN unidades u ON c.unidade_id = u.id
            WHERE c.unidade_id = ANY(:user_uasgs)
            ORDER BY c.id
        """)
        
        if limit:
            query = text(str(query) + f" LIMIT {limit}")
            
        result = await self.db_contratos.execute(query, {"user_uasgs": user_uasgs})
        return [dict(row) for row in result.mappings().all()]

    async def get_uasg_id_from_unidade(self, unidade_id: int) -> Optional[int]:
        """Get UASG ID from unidade ID - in this case they're the same"""
        return unidade_id

    async def get_unidade_prefix(self, unidade_id: int) -> Optional[str]:
        """Get the unidade prefix (codigo + gestao) for financial queries"""
        query = text("""
            SELECT COALESCE(codigo, '') || COALESCE(gestao, '') AS unidade_code
            FROM unidades
            WHERE id = :unidade_id
        """)
        
        result = await self.db_contratos.execute(query, {"unidade_id": unidade_id})
        return result.scalar()
