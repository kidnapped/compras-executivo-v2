from typing import List, Dict, Any, Optional
from datetime import datetime
import json
import logging

logger = logging.getLogger(__name__)

class DataProcessor:
    """Handles data transformation and serialization for encontro responses"""
    
    def __init__(self):
        self.processed_data = {}

    def process_empenho_data(self, empenho: Dict, financial_data: Dict, document_data: Dict) -> Dict[str, Any]:
        """Process and combine empenho data with financial and document information"""
        # First process the financial data to apply negative values for ANULACAO/CANCELAMENTO
        processed_financial = self._process_financial_data(financial_data)
        
        # Create the format expected by the frontend (matching original endpoint)
        processed = {
            'prefixed_numero': f"{financial_data.get('unidade_prefix', '')}{empenho.get('numero', '')}",
            'empenho': self._serialize_empenho(empenho),
            'Finanças': {
                'documentos_dar': self._serialize_list(document_data.get('dar_documents', [])),
                'documentos_darf': self._serialize_list(document_data.get('darf_documents', [])),
                'documentos_gps': self._serialize_list(document_data.get('gps_documents', [])),
                'linha_evento_ob': self._serialize_list(financial_data.get('linha_evento_ob', [])),
            },
            'Orçamentário': {
                'operacoes': processed_financial.get('Orçamentário', []),  # Use processed data with negative values
                'items': processed_financial.get('ne_item', [])
            },
            
        }
        return processed

    def _serialize_empenho(self, empenho: Dict) -> Dict[str, Any]:
        """Serialize empenho data with proper type conversion"""
        serialized = {}
        for key, value in empenho.items():
            if isinstance(value, datetime):
                serialized[key] = value.isoformat()
            elif hasattr(value, '__dict__'):
                # Handle SQLAlchemy objects
                serialized[key] = str(value)
            else:
                serialized[key] = value
        return serialized

    def _process_financial_data(self, financial_data: Dict) -> Dict[str, Any]:
        """Process financial data and calculate totals"""
        Orçamentário = financial_data.get('Orçamentário', [])
        ne_item = financial_data.get('ne_item', [])
        linha_evento_ob = financial_data.get('linha_evento_ob', [])
        
        # First pass: Find the oldest operation date
        oldest_operation = None
        oldest_date = None
        
        for item in Orçamentário:
            if item.get('dt_operacao'):
                operation_date = self._parse_date_for_comparison(item.get('dt_operacao'))
                if operation_date and (oldest_date is None or operation_date < oldest_date):
                    oldest_date = operation_date
                    oldest_operation = item
        
        # Second pass: Process operations and mark the oldest one
        total_operacao = 0
        processed_orcamentario = []
        
        for item in Orçamentário:
            # Create a copy of the item to avoid modifying the original
            processed_item = dict(item)
            
            # Mark if this is the oldest operation (for RP exception handling)
            processed_item['is_oldest_operation'] = (oldest_operation is not None and item is oldest_operation)
            
            if item.get('va_operacao'):
                original_value = float(item.get('va_operacao', 0))
                value = original_value
                operation_type = item.get('no_operacao', '').upper()
                
                # Apply negative value for cancellation/annulment operations
                # Use substring matching to catch all variations (CANCELAMENTO, CANCELAMENTO DE RP, etc.)
                if 'ANULACAO' in operation_type or 'CANCELAMENTO' in operation_type:
                    value = -value
                    # Update the processed item's va_operacao to reflect the negative value
                    processed_item['va_operacao'] = value
                    
                total_operacao += value
            
            processed_orcamentario.append(processed_item)
        
        total_linha_evento = sum(float(item.get('va_linha_evento', 0)) for item in linha_evento_ob if item.get('va_linha_evento'))
        
        return {
            'Orçamentário': self._serialize_list(processed_orcamentario),
            'ne_item': self._serialize_list(ne_item),
            'linha_evento_ob': self._serialize_list(linha_evento_ob),
            'totals': {
                'total_operacao': total_operacao,
                'total_linha_evento': total_linha_evento
            }
        }

    def _process_document_data(self, document_data: Dict) -> Dict[str, Any]:
        """Process document data with counts and summaries"""
        dar_docs = document_data.get('dar_documents', [])
        darf_docs = document_data.get('darf_documents', [])
        gps_docs = document_data.get('gps_documents', [])
        
        return {
            'dar_documents': self._serialize_list(dar_docs),
            'darf_documents': self._serialize_list(darf_docs),
            'gps_documents': self._serialize_list(gps_docs),
            'counts': {
                'dar_count': len(dar_docs),
                'darf_count': len(darf_docs),
                'gps_count': len(gps_docs)
            }
        }

    def _serialize_list(self, data_list: List[Dict]) -> List[Dict]:
        """Serialize a list of dictionaries with proper type conversion"""
        return [self._serialize_dict(item) for item in data_list]

    def _serialize_dict(self, data_dict: Dict) -> Dict[str, Any]:
        """Serialize a dictionary with proper type conversion"""
        serialized = {}
        for key, value in data_dict.items():
            if isinstance(value, datetime):
                serialized[key] = value.isoformat()
            elif hasattr(value, '__dict__'):
                # Handle SQLAlchemy objects
                serialized[key] = str(value)
            elif value is None:
                serialized[key] = None
            else:
                serialized[key] = value
        return serialized

    def _parse_date_for_comparison(self, date_string: Any) -> Optional[datetime]:
        """Parse date string to datetime object for comparison purposes"""
        if not date_string:
            return None

        # If it's already a datetime object, return it
        if isinstance(date_string, datetime):
            return date_string

        try:
            str_date = str(date_string).strip()
            
            # Handle YYYYMMDD format (8 digits)
            if len(str_date) == 8 and str_date.isdigit():
                year = int(str_date[:4])
                month = int(str_date[4:6])
                day = int(str_date[6:8])
                return datetime(year, month, day)
            
            # Handle DD/MM/YYYY format (Brazilian format)
            if '/' in str_date and len(str_date) == 10:
                parts = str_date.split('/')
                if len(parts) == 3:
                    day, month, year = map(int, parts)
                    return datetime(year, month, day)
            
            # Handle YYYY-MM-DD format (ISO format)
            if '-' in str_date:
                parts = str_date.split('-')
                if len(parts) == 3:
                    year, month, day = map(int, parts)
                    return datetime(year, month, day)
            
            # Try to parse as datetime directly
            return datetime.fromisoformat(str_date) if hasattr(datetime, 'fromisoformat') else None
            
        except (ValueError, TypeError) as e:
            logger.warning(f"Failed to parse date for comparison: {date_string}, error: {e}")
            return None

    def create_summary_response(self, contract_data: List[Dict]) -> Dict[str, Any]:
        """Create a summary response with aggregated data"""
        total_empenhos = len(contract_data)
        
        # Count documents from the correct nested structure
        total_dar_docs = sum(len(item.get('Finanças', {}).get('documentos_dar', [])) for item in contract_data)
        total_darf_docs = sum(len(item.get('Finanças', {}).get('documentos_darf', [])) for item in contract_data)
        total_gps_docs = sum(len(item.get('Finanças', {}).get('documentos_gps', [])) for item in contract_data)
        total_ob_docs = sum(len(item.get('Finanças', {}).get('linha_evento_ob', [])) for item in contract_data)
        
        logger.info(f"Document counts - DAR: {total_dar_docs}, DARF: {total_darf_docs}, GPS: {total_gps_docs}, OB: {total_ob_docs}")
        
        # Calculate total empenhado value from all empenhos
        total_empenhado = 0.0
        for item in contract_data:
            empenho_data = item.get('empenho', {})
            empenhado_value = empenho_data.get('empenhado', 0)
            if empenhado_value:
                total_empenhado += float(empenhado_value)
        
        logger.info(f"Total empenhado calculated: {total_empenhado}")
        
        # Calculate total Orçamentário value from all operations with RP logic
        total_orcamentario = 0.0
        for item in contract_data:
            orcamentario_data = item.get('Orçamentário', {})
            operacoes = orcamentario_data.get('operacoes', [])
            
            if operacoes:
                # Apply the same RP logic as in _process_financial_data
                # First pass: Find the oldest operation date
                oldest_operation = None
                oldest_date = None
                
                for op in operacoes:
                    if op.get('dt_operacao'):
                        operation_date = self._parse_date_for_comparison(op.get('dt_operacao'))
                        if operation_date and (oldest_date is None or operation_date < oldest_date):
                            oldest_date = operation_date
                            oldest_operation = op
                
                # Second pass: Calculate total with RP logic
                for op in operacoes:
                    if op.get('va_operacao') is not None:
                        value = float(op.get('va_operacao', 0))
                        operation_type = op.get('no_operacao', '').upper()
                        
                        # Check if this is an RP operation
                        is_rp_operation = 'RP' in operation_type
                        
                        # Check if this is the oldest operation
                        is_oldest_operation = (oldest_operation is not None and op is oldest_operation)
                        
                        # Apply RP logic: If it's an RP operation and NOT the oldest, count as 0
                        if is_rp_operation and not is_oldest_operation:
                            value = 0  # Count as zero to avoid double-counting budget
                        
                        # Apply negative value for cancellation/annulment operations
                        if 'ANULACAO' in operation_type or 'CANCELAMENTO' in operation_type:
                            value = -value
                        
                        total_orcamentario += value
        
        logger.info(f"Total Orçamentário calculated: {total_orcamentario}")
        
        # Calculate total financial value from documents
        total_value = 0.0
        total_dar_value = 0.0
        total_darf_value = 0.0
        total_gps_value = 0.0
        total_ob_value = 0.0
        
        for item in contract_data:
            financas = item.get('Finanças', {})
            
            # Sum DAR documents
            for dar_doc in financas.get('documentos_dar', []):
                dar_value = (float(dar_doc.get('va_principal', 0) or 0) + 
                           float(dar_doc.get('va_juros', 0) or 0) + 
                           float(dar_doc.get('va_multa', 0) or 0))
                total_dar_value += dar_value
                total_value += dar_value
            
            # Sum DARF documents
            for darf_doc in financas.get('documentos_darf', []):
                darf_value = (float(darf_doc.get('va_receita', 0) or 0) + 
                            float(darf_doc.get('va_juros', 0) or 0) + 
                            float(darf_doc.get('va_multa', 0) or 0))
                total_darf_value += darf_value
                total_value += darf_value
            
            # Sum GPS documents
            for gps_doc in financas.get('documentos_gps', []):
                gps_value = float(gps_doc.get('va_inss', 0) or 0)
                total_gps_value += gps_value
                total_value += gps_value
            
            # Sum OB documents
            for ob_doc in financas.get('linha_evento_ob', []):
                ob_value = float(ob_doc.get('va_linha_evento', 0) or 0)
                total_ob_value += ob_value
                total_value += ob_value
        
        logger.info(f"Total financial values - DAR: {total_dar_value}, DARF: {total_darf_value}, GPS: {total_gps_value}, OB: {total_ob_value}, Total: {total_value}")
        
        return {
            'data': contract_data,
            'summary': {
                'total_empenhos': total_empenhos,
                'total_empenhado': total_empenhado,
                'total_orcamentario': total_orcamentario,
                'total_documents': {
                    'dar': total_dar_docs,
                    'darf': total_darf_docs,
                    'gps': total_gps_docs,
                    'ob': total_ob_docs,
                    'total': total_dar_docs + total_darf_docs + total_gps_docs + total_ob_docs
                },
                'total_financial_value': total_value,
                'total_financial_by_type': {
                    'dar': total_dar_value,
                    'darf': total_darf_value,
                    'gps': total_gps_value,
                    'ob': total_ob_value
                }
            }
        }

    def handle_processing_error(self, error: Exception, context: str) -> Dict[str, Any]:
        """Handle errors during data processing"""
        return {
            'error': True,
            'message': f"Error processing {context}: {str(error)}",
            'context': context,
            'data': None
        }
