import asyncio
from typing import List, Dict, Any, Optional
from sqlalchemy.ext.asyncio import AsyncSession
import logging

from .validation_service import ValidationService
from .query_service import QueryService
from .data_processor import DataProcessor
from .financial_calculator import FinancialCalculator, TotalFilters

logger = logging.getLogger(__name__)

class EncontroService:
    """Main service for orchestrating encontro de contas operations"""
    
    def __init__(self, db_contratos: AsyncSession, db_financeiro: AsyncSession):
        self.validation_service = ValidationService(db_contratos)
        self.query_service = QueryService(db_contratos, db_financeiro)
        self.data_processor = DataProcessor()
        self.financial_calculator = FinancialCalculator()
        self.db_contratos = db_contratos
        self.db_financeiro = db_financeiro

    async def get_complete_contract_data(self, contrato_id: int, user_id: int, request=None, empenho_numero: str = None) -> Dict[str, Any]:
        """
        Get complete contract data including empenhos, financial data, and documents
        
        Args:
            contrato_id: The contract ID to process
            user_id: The user ID for access validation
            request: The request object for session-based validation
            empenho_numero: Optional specific empenho number to filter by
            
        Returns:
            Dict containing processed contract data or error information
        """
        try:
            # Step 1: Validate access and get contract info
            logger.info(f"Starting data retrieval for contract {contrato_id}, user {user_id}")
            
            validation_result = await self.validation_service.validate_contract_access(contrato_id, user_id, request)
            if not validation_result.get('valid', False):
                return {
                    'error': True,
                    'message': validation_result.get('message', 'Access denied to this contract'),
                    'data': None
                }

            unidade_id = validation_result.get('unidade_id')
            unidadeempenho_id = validation_result.get('unidadeempenho_id')
            uasg_codigo = validation_result.get('uasg_codigo')
            valor_acumulado = validation_result.get('valor_acumulado', 0.0)

            # Step 2: Get contract empenhos with unidadeempenho_id filter (like working endpoint)
            empenhos = await self.query_service.get_contract_empenhos(contrato_id, unidadeempenho_id, empenho_numero, request)
            
            if empenho_numero:
                logger.info(f"Found {len(empenhos)} empenhos for contract {contrato_id} filtered by empenho_numero '{empenho_numero}'")
            else:
                logger.info(f"Found {len(empenhos)} empenhos for contract {contrato_id} with unidadeempenho_id {unidadeempenho_id}")
            
            if not empenhos:
                # Try without unidade_id filter to see if that's the issue
                logger.info(f"No empenhos found with unidadeempenho_id filter, trying without filter...")
                empenhos_fallback = await self.query_service.get_contract_empenhos(contrato_id, None, None, request)
                logger.info(f"Fallback query found {len(empenhos_fallback)} empenhos")
                
                if empenhos_fallback:
                    # Use fallback empenhos for processing
                    empenhos = empenhos_fallback
                    logger.info(f"Using fallback empenhos for processing (unidadeempenho_id filter may be too restrictive)")
                else:
                    return {
                        'error': False,
                        'message': f'No empenhos found for this contract with or without unidadeempenho_id filter.',
                        'data': []
                    }

            logger.info(f"Found {len(empenhos)} empenhos for contract {contrato_id}")

            # Step 3: Process each empenho sequentially to avoid session conflicts
            successful_results = []
            for i, empenho in enumerate(empenhos):
                try:
                    logger.info(f"Processing empenho {i+1}/{len(empenhos)}: {empenho.get('id', 'unknown')}")
                    result = await self._process_single_empenho(empenho, uasg_codigo)
                    
                    if not result.get('error', False):
                        successful_results.append(result)
                        logger.info(f"Successfully processed empenho {empenho.get('id', 'unknown')}")
                    else:
                        logger.warning(f"Processing failed for empenho {empenho.get('id', 'unknown')}: {result.get('message', 'Unknown error')}")
                        
                except Exception as e:
                    logger.error(f"Failed to process empenho {empenho.get('id', 'unknown')}: {e}", exc_info=True)

            logger.info(f"Successfully processed {len(successful_results)} out of {len(empenhos)} empenhos")

            # Step 4: Create summary response
            return self.data_processor.create_summary_response(successful_results, valor_acumulado)

        except Exception as e:
            logger.error(f"Error in get_complete_contract_data: {e}", exc_info=True)
            return self.data_processor.handle_processing_error(e, f"contract {contrato_id}")

    async def _process_single_empenho(self, empenho: Dict, uasg_codigo: str) -> Dict[str, Any]:
        """Process a single empenho with all its related data"""
        try:
            empenho_id = empenho.get('id')
            numero = empenho.get('numero', '')
            unidade_id = empenho.get('unidade_id')
            
            if not all([empenho_id, numero, unidade_id]):
                return {
                    'error': True,
                    'message': 'Missing required empenho fields',
                    'data': None
                }

            # Get UASG ID and unidade prefix
            uasg_id = await self.validation_service.get_uasg_id_from_unidade(unidade_id)
            unidade_prefix = await self.validation_service.get_unidade_prefix(uasg_id)
            
            if not unidade_prefix:
                logger.warning(f"Could not get unidade prefix for empenho {empenho_id}")
                return {
                    'error': True,
                    'message': 'Could not resolve unidade information',
                    'data': None
                }

            # Create full numero for queries
            full_numero = f"{unidade_prefix}{numero}"
            
            logger.info(f"Empenho {empenho_id} - numero: '{numero}', unidade_prefix: '{unidade_prefix}', uasg_codigo: '{uasg_codigo}', full_numero: '{full_numero}'")
            
            # Execute queries sequentially to avoid session conflicts
            # Step 1: Get document IDs
            document_ids = await self.query_service.get_document_ids(full_numero)
            
            # Step 2: Get financial data (pass empenho object for correct OB filtering)
            financial_data = await self.query_service.get_financial_data(full_numero, numero, unidade_prefix, uasg_codigo, empenho)
            
            # Step 3: Get full documents if any IDs were found
            document_data = await self.query_service.get_full_documents(document_ids)
            
            # Add document IDs to document_data for backward compatibility
            document_data.update(document_ids)
            
            # Add unidade_prefix to financial_data for processing
            financial_data['unidade_prefix'] = unidade_prefix
            
            # Step 4: Process and combine all data
            return self.data_processor.process_empenho_data(
                empenho, financial_data, document_data
            )

        except Exception as e:
            logger.error(f"Error processing empenho {empenho.get('id', 'unknown')}: {e}", exc_info=True)
            return self.data_processor.handle_processing_error(e, f"empenho {empenho.get('id', 'unknown')}")

    async def get_user_contracts_summary(self, user_id: int, request=None, limit: Optional[int] = None) -> Dict[str, Any]:
        """Get a summary of all contracts accessible to a user"""
        try:
            # Get user's accessible contracts
            user_contracts = await self.validation_service.get_user_accessible_contracts(user_id, request, limit)
            
            if limit:
                user_contracts = user_contracts[:limit]
            
            # Process contracts concurrently with a reasonable batch size
            batch_size = 5  # Process 5 contracts at a time to avoid overwhelming the database
            results = []
            
            for i in range(0, len(user_contracts), batch_size):
                batch = user_contracts[i:i + batch_size]
                batch_tasks = [
                    self.get_complete_contract_data(contract['id'], user_id, request)
                    for contract in batch
                ]
                
                batch_results = await asyncio.gather(*batch_tasks, return_exceptions=True)
                
                for result in batch_results:
                    if not isinstance(result, Exception) and not result.get('error', False):
                        results.append(result)
            
            return {
                'total_contracts_processed': len(results),
                'total_contracts_accessible': len(user_contracts),
                'contracts': results
            }

        except Exception as e:
            logger.error(f"Error in get_user_contracts_summary: {e}", exc_info=True)
            return self.data_processor.handle_processing_error(e, f"user {user_id} contracts summary")

    async def compute_financial_totals(
        self,
        contrato_id: int,
        user_id: int,
        request=None,
        use_partial: bool = False,
        empenho_numero: str = None
    ) -> Dict[str, Any]:
        """
        Compute financial totals for a contract using the corrected calculator.
        
        Args:
            contrato_id: Contract ID
            user_id: User ID for access validation
            request: Request object for session validation
            use_partial: Whether to use partial amounts instead of nominal
            empenho_numero: Optional specific empenho filter
            
        Returns:
            Dict with financial breakdown and validation results
        """
        try:
            # Get contract data
            contract_result = await self.get_complete_contract_data(
                contrato_id, user_id, request, empenho_numero
            )
            
            if contract_result.get('error', False):
                return contract_result
                
            contract_data = contract_result.get('data', [])
            
            if not contract_data:
                return {
                    'error': False,
                    'message': 'No data found for calculation',
                    'breakdown': None,
                    'validation': None
                }
            
            # Compute breakdown using corrected calculator
            breakdown = self.financial_calculator.compute_financial_breakdown(
                contract_data, use_partial=use_partial
            )
            
            # Validate calculation
            validation = self.financial_calculator.validate_calculation(contract_data)
            
            return {
                'error': False,
                'contrato_id': contrato_id,
                'use_partial': use_partial,
                'empenho_count': len(contract_data),
                'breakdown': {
                    'dar': float(breakdown.dar),
                    'darf': float(breakdown.darf),
                    'gps': float(breakdown.gps),
                    'ob': float(breakdown.ob),
                    'total': float(breakdown.total)
                },
                'validation': {
                    'partial_total': float(validation['partial_total']),
                    'nominal_total': float(validation['nominal_total']),
                    'difference': float(validation['difference']),
                    'consistent': validation['consistent'],
                    'messages': validation['messages']
                },
                'sanity_check_sql': self.financial_calculator.generate_sanity_check_sql()
            }
            
        except Exception as e:
            logger.error(f"Error in compute_financial_totals: {e}", exc_info=True)
            return self.data_processor.handle_processing_error(e, f"financial totals for contract {contrato_id}")
