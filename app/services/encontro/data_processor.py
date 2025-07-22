from typing import List, Dict, Any
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
        # Create the format expected by the frontend (matching original endpoint)
        processed = {
            'prefixed_numero': f"{financial_data.get('unidade_prefix', '')}{empenho.get('numero', '')}",
            'empenho': self._serialize_empenho(empenho),
            'id_documento_dar': document_data.get('dar_ids', []),
            'id_documento_darf': document_data.get('darf_ids', []),
            'id_documento_gps': document_data.get('gps_ids', []),
            'documentos_dar': self._serialize_list(document_data.get('dar_documents', [])),
            'documentos_darf': self._serialize_list(document_data.get('darf_documents', [])),
            'documentos_gps': self._serialize_list(document_data.get('gps_documents', [])),
            'Orçamentário': self._serialize_list(financial_data.get('Orçamentário', [])),
            'ne_item': self._serialize_list(financial_data.get('ne_item', [])),
            'linha_evento_ob': self._serialize_list(financial_data.get('linha_evento_ob', []))
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
        
        # Calculate totals
        total_operacao = sum(float(item.get('va_operacao', 0)) for item in Orçamentário if item.get('va_operacao'))
        total_linha_evento = sum(float(item.get('va_linha_evento', 0)) for item in linha_evento_ob if item.get('va_linha_evento'))
        
        return {
            'Orçamentário': self._serialize_list(Orçamentário),
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

    def create_summary_response(self, contract_data: List[Dict]) -> Dict[str, Any]:
        """Create a summary response with aggregated data"""
        total_empenhos = len(contract_data)
        total_dar_docs = sum(len(item.get('documentos_dar', [])) for item in contract_data)
        total_darf_docs = sum(len(item.get('documentos_darf', [])) for item in contract_data)
        total_gps_docs = sum(len(item.get('documentos_gps', [])) for item in contract_data)
        total_ob_docs = sum(len(item.get('linha_evento_ob', [])) for item in contract_data)
        
        logger.info(f"Document counts - DAR: {total_dar_docs}, DARF: {total_darf_docs}, GPS: {total_gps_docs}, OB: {total_ob_docs}")
        
        total_value = sum(
            item.get('financial', {}).get('totals', {}).get('total_operacao', 0) 
            for item in contract_data
        )
        
        return {
            'data': contract_data,
            'summary': {
                'total_empenhos': total_empenhos,
                'total_documents': {
                    'dar': total_dar_docs,
                    'darf': total_darf_docs,
                    'gps': total_gps_docs,
                    'ob': total_ob_docs,
                    'total': total_dar_docs + total_darf_docs + total_gps_docs + total_ob_docs
                },
                'total_financial_value': total_value
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
