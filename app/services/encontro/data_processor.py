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
        
        # Process documents and merge va_celula values directly into document objects
        enhanced_financas = self._merge_va_celula_into_documents(document_data, financial_data)
        
        # Create the format expected by the frontend (matching original endpoint)
        processed = {
            'prefixed_numero': f"{financial_data.get('unidade_prefix', '')}{empenho.get('numero', '')}",
            'empenho': self._serialize_empenho(empenho),
            'Finanças': enhanced_financas,
            'Orçamentário': {
                'operacoes': processed_financial.get('Orçamentário', []),  # Use processed data with negative values
                'items': processed_financial.get('ne_item', [])
            },
            
        }
        return processed

    def _merge_va_celula_into_documents(self, document_data: Dict, financial_data: Dict) -> Dict[str, Any]:
        """Merge va_celula values directly into document objects for easier frontend access"""
        enhanced_financas = {
            'linha_evento_ob': self._serialize_list(financial_data.get('linha_evento_ob', []))
        }

        # Note: OB grouping now happens at the contract level in create_summary_response
        # to properly group OBs across all empenhos with the same id_doc_ob
        
        # Process each document type and merge va_celula values
        for doc_type in ['dar', 'darf', 'gps']:
            documents_key = f'{doc_type}_documents'
            va_celula_key = f'{doc_type}_va_celula'
            
            documents = document_data.get(documents_key, [])
            va_celula_data = document_data.get(va_celula_key, [])
            
            # Create a mapping of document ID to va_celula value
            va_celula_map = {item['id']: item['va_celula'] for item in va_celula_data}
            
            # Merge va_celula into each document
            enhanced_documents = []
            for doc in documents:
                # Handle different document object types
                if hasattr(doc, '_mapping'):
                    # SQLAlchemy Row object
                    doc_dict = dict(doc._mapping)
                elif hasattr(doc, '__dict__'):
                    # SQLAlchemy model object
                    doc_dict = {key: getattr(doc, key) for key in doc.__dict__.keys() if not key.startswith('_')}
                elif isinstance(doc, dict):
                    # Already a dictionary
                    doc_dict = dict(doc)
                else:
                    # Fallback - convert to dict
                    doc_dict = dict(doc)
                
                # Serialize the document
                doc_dict = self._serialize_dict(doc_dict)
                
                # Find the document ID field (different naming conventions)
                doc_id = None
                possible_id_fields = [f'id_doc_{doc_type}', f'id_documento_{doc_type}', 'id']
                for id_field in possible_id_fields:
                    if id_field in doc_dict:
                        doc_id = doc_dict[id_field]
                        break
                
                # Add va_celula value if it exists for this document
                if doc_id and doc_id in va_celula_map:
                    doc_dict['va_celula'] = va_celula_map[doc_id]
                else:
                    doc_dict['va_celula'] = None
                    
                enhanced_documents.append(doc_dict)
            
            enhanced_financas[f'documentos_{doc_type}'] = enhanced_documents
        
        return enhanced_financas

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
                calculation_value = original_value
                operation_type = item.get('no_operacao', '').upper()
                
                # Check if this is an RP operation
                is_rp_operation = ('RP' in operation_type or 
                                 'INSCRICAO' in operation_type or 
                                 'RESTOS A PAGAR' in operation_type)
                is_oldest_operation = processed_item.get('is_oldest_operation', False)
                
                # Always preserve the original value for display
                processed_item['va_operacao_display'] = original_value
                
                # Apply RP logic: If it's an RP operation and NOT the oldest, count as 0
                if is_rp_operation and not is_oldest_operation:
                    calculation_value = 0  # Count as zero to avoid double-counting budget
                    processed_item['va_operacao'] = 0  # Set calculation value to 0
                    processed_item['is_rp_excluded'] = True  # Mark for frontend recognition
                    logger.info(f"🔄 RP operation excluded from budget: {operation_type} - Display: {original_value}, Calculation: 0")
                else:
                    # Apply negative value for cancellation/annulment operations
                    # Use substring matching to catch all variations (CANCELAMENTO, CANCELAMENTO DE RP, etc.)
                    if 'ANULACAO' in operation_type or 'CANCELAMENTO' in operation_type:
                        calculation_value = -calculation_value
                        # Update the processed item's va_operacao to reflect the negative value
                        processed_item['va_operacao'] = calculation_value
                        processed_item['is_rp_excluded'] = False
                        logger.info(f"❌ Negative operation applied: {operation_type} - Value: {calculation_value}")
                    else:
                        processed_item['va_operacao'] = calculation_value
                        processed_item['is_rp_excluded'] = False
                        logger.info(f"✅ Normal operation included: {operation_type} - Value: {calculation_value}")
                    
                total_operacao += calculation_value
            
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
            # Include va_celula data for partial payments
            'dar_va_celula': self._serialize_list(document_data.get('dar_va_celula', [])),
            'darf_va_celula': self._serialize_list(document_data.get('darf_va_celula', [])),
            'gps_va_celula': self._serialize_list(document_data.get('gps_va_celula', [])),
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
        # First, create cross-empenho OB groupings and apply them to each empenho
        self._apply_cross_empenho_ob_grouping(contract_data)
        
        total_empenhos = len(contract_data)

        # Count documents from the correct nested structure
        total_dar_docs = sum(
            len(item.get('Finanças', {}).get('documentos_dar', [])) for item in contract_data
        )
        total_darf_docs = sum(
            len(item.get('Finanças', {}).get('documentos_darf', [])) for item in contract_data
        )
        total_gps_docs = sum(
            len(item.get('Finanças', {}).get('documentos_gps', [])) for item in contract_data
        )
        total_ob_docs = sum(
            len(item.get('Finanças', {}).get('linha_evento_ob', [])) for item in contract_data
        )

        logger.info(
            f"Document counts - DAR: {total_dar_docs}, DARF: {total_darf_docs}, GPS: {total_gps_docs}, OB: {total_ob_docs}"
        )

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
                # The operations have already been processed with RP logic in _process_financial_data
                # Just sum the processed va_operacao values directly
                for op in operacoes:
                    if op.get('va_operacao') is not None:
                        value = float(op.get('va_operacao', 0))
                        total_orcamentario += value
                        logger.info(
                            f"📊 Summary: Adding processed operation value: {op.get('no_operacao', 'N/A')} - Value: {value}"
                        )

        logger.info(f"Total Orçamentário calculated: {total_orcamentario}")

        # Debug: Print a sample of processed operations to verify RP handling
        if contract_data:
            sample_empenho = contract_data[0]
            orcamentario_ops = sample_empenho.get('Orçamentário', {}).get('operacoes', [])
            if orcamentario_ops:
                logger.info(
                    f"🔍 Sample operations from first empenho ({len(orcamentario_ops)} total operations):"
                )
                for i, op in enumerate(orcamentario_ops[:3]):  # Show first 3 operations
                    logger.info(
                        f"  Op {i+1}: {op.get('no_operacao', 'N/A')} - va_operacao: {op.get('va_operacao', 'N/A')} - is_oldest: {op.get('is_oldest_operation', False)}"
                    )

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
                dar_value = (
                    float(dar_doc.get('va_principal', 0) or 0)
                    + float(dar_doc.get('va_juros', 0) or 0)
                    + float(dar_doc.get('va_multa', 0) or 0)
                )
                total_dar_value += dar_value
                total_value += dar_value

            # Sum DARF documents
            for darf_doc in financas.get('documentos_darf', []):
                darf_value = (
                    float(darf_doc.get('va_receita', 0) or 0)
                    + float(darf_doc.get('va_juros', 0) or 0)
                    + float(darf_doc.get('va_multa', 0) or 0)
                )
                total_darf_value += darf_value
                total_value += darf_value

            # Sum GPS documents
            for gps_doc in financas.get('documentos_gps', []):
                gps_value = float(gps_doc.get('va_inss', 0) or 0)
                total_gps_value += gps_value
                total_value += gps_value

            # Sum OB documents: prefer grouped totals if available to avoid double-counting
            ob_grouped = financas.get('ob_grouped')
            if ob_grouped:
                for ob_doc in ob_grouped:
                    ob_value = float(ob_doc.get('va_linha_evento', 0) or 0)
                    total_ob_value += ob_value
                    total_value += ob_value
            else:
                for ob_doc in financas.get('linha_evento_ob', []):
                    ob_value = float(ob_doc.get('va_linha_evento', 0) or 0)
                    total_ob_value += ob_value
                    total_value += ob_value

        logger.info(
            f"Total financial values - DAR: {total_dar_value}, DARF: {total_darf_value}, GPS: {total_gps_value}, OB: {total_ob_value}, Total: {total_value}"
        )

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

    def _apply_cross_empenho_ob_grouping(self, contract_data: List[Dict]) -> None:
        """Group OB lines across all empenhos by id_doc_ob and apply grouped totals to each empenho"""
        try:
            # Step 1: Collect all OB lines across all empenhos
            all_ob_lines = []
            for empenho_data in contract_data:
                financas = empenho_data.get('Finanças', {})
                ob_lines = financas.get('linha_evento_ob', []) or []
                for ob_line in ob_lines:
                    all_ob_lines.append(ob_line)

            # Step 2: Group all OB lines by id_doc_ob
            groups: Dict[str, Dict[str, Any]] = {}

            def _parse_ob_date(ln: Dict[str, Any]) -> Optional[datetime]:
                y = ln.get('id_ano_saque_bacen')
                m = ln.get('id_mes_saque_bacen')
                d = ln.get('id_dia_saque_bacen')
                try:
                    if y and m and d:
                        return datetime(int(y), int(m), int(d))
                except Exception:
                    return None
                return None

            for ln in all_ob_lines:
                # Identify the OB document id
                id_doc_ob = (
                    ln.get('id_doc_ob')
                    or ln.get('id_documento_pagamento')
                    or ln.get('documento')
                )
                if not id_doc_ob:
                    # Skip grouping for lines without an identifiable OB id
                    continue

                grp = groups.setdefault(
                    id_doc_ob,
                    {
                        'id_doc_ob': id_doc_ob,
                        'va_linha_evento': 0.0,  # store total under same key for frontend compatibility
                        'count': 0,
                        'first_date': None,
                        'last_date': None,
                    },
                )

                try:
                    value = float(ln.get('va_linha_evento', 0) or 0)
                except Exception:
                    value = 0.0
                grp['va_linha_evento'] += value
                grp['count'] += 1

                dt = _parse_ob_date(ln)
                if dt is not None:
                    grp['first_date'] = dt if grp['first_date'] is None or dt < grp['first_date'] else grp['first_date']
                    grp['last_date'] = dt if grp['last_date'] is None or dt > grp['last_date'] else grp['last_date']

            # Step 3: Build serializable grouped list with representative saque_bacen date (use last_date)
            ob_grouped: List[Dict[str, Any]] = []
            for g in groups.values():
                grouped_entry: Dict[str, Any] = {
                    'id_doc_ob': g['id_doc_ob'],
                    # Keep using va_linha_evento so frontend value extraction remains unchanged
                    'va_linha_evento': g['va_linha_evento'],
                    'count': g['count'],
                }
                last_dt: Optional[datetime] = g.get('last_date')
                if last_dt:
                    grouped_entry['id_ano_saque_bacen'] = last_dt.year
                    grouped_entry['id_mes_saque_bacen'] = last_dt.month
                    grouped_entry['id_dia_saque_bacen'] = last_dt.day
                ob_grouped.append(grouped_entry)

            # Step 4: Apply the grouped OB data to all empenhos that have OB lines
            # This ensures that every empenho shows the same cross-empenho grouped totals
            if ob_grouped:
                for empenho_data in contract_data:
                    financas = empenho_data.get('Finanças', {})
                    ob_lines = financas.get('linha_evento_ob', []) or []
                    if ob_lines:  # Only add ob_grouped to empenhos that have OB lines
                        financas['ob_grouped'] = self._serialize_list(ob_grouped)
                        
            logger.info(f"Cross-empenho OB grouping: found {len(groups)} unique OB documents across {len(contract_data)} empenhos")

        except Exception as e:
            logger.warning(f"Failed to apply cross-empenho OB grouping: {e}")

    def handle_processing_error(self, error: Exception, context: str) -> Dict[str, Any]:
        """Handle errors during data processing"""
        return {
            'error': True,
            'message': f"Error processing {context}: {str(error)}",
            'context': context,
            'data': None
        }
