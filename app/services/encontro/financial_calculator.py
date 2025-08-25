"""
Financial Value Calculator for Encontro de Contas

Provides corrected implementation for computing total_financial_value with explicit rules
for partial vs nominal values, reversal handling, and deduplication.
"""

from decimal import Decimal, ROUND_HALF_UP, InvalidOperation
from typing import Dict, List, Optional, Set, Any
from dataclasses import dataclass
from datetime import date
import logging

logger = logging.getLogger(__name__)

@dataclass
class TotalFilters:
    """Filters for financial value computation"""
    contrato_id: Optional[int] = None
    empenho_ids: Optional[List[int]] = None
    unidade_ids: Optional[List[int]] = None
    date_from: Optional[date] = None
    date_to: Optional[date] = None
    include_docs: Optional[Set[str]] = None  # e.g., {"OB", "DARF", "GPS", "DAR"}

@dataclass
class FinancialBreakdown:
    """Breakdown of financial values by document type"""
    dar: Decimal
    darf: Decimal
    gps: Decimal
    ob: Decimal
    total: Decimal

class FinancialCalculator:
    """
    Handles financial value calculations with explicit rules for:
    - Partial vs nominal amounts
    - Status-based reversals
    - Deduplication
    - Decimal precision
    """
    
    # Status values that indicate cancellation/reversal
    NEGATIVE_STATUSES = {
        "DE CANCELAMENTO", 
        "ESTORNO", 
        "CANCELADO",
        "ANULADO"
    }
    
    # Settled/paid status whitelist (implementation specific)
    SETTLED_STATUSES = {
        "PAGO",
        "LIQUIDADO", 
        "EFETIVADO",
        "PROCESSADO"
    }

    def compute_total_financial_value(
        self,
        contract_data: List[Dict[str, Any]],
        use_partial: bool = False,
        filters: Optional[TotalFilters] = None
    ) -> Decimal:
        """
        Returns the aggregated financial value for the given scope.
        
        Args:
            contract_data: List of processed empenho data
            use_partial: If True, use partial paid fields; if False, use nominal/settled
            filters: Optional filters (for future extension)
            
        Returns:
            Decimal: Total financial value
        """
        breakdown = self.compute_financial_breakdown(contract_data, use_partial, filters)
        return breakdown.total

    def compute_financial_breakdown(
        self,
        contract_data: List[Dict[str, Any]],
        use_partial: bool = False,
        filters: Optional[TotalFilters] = None
    ) -> FinancialBreakdown:
        """
        Compute detailed breakdown of financial values by document type.
        
        THIS METHOD NOW ALWAYS USES FRONTEND-COMPATIBLE LOGIC:
        - DAR: Always prefer va_celula, fallback to components
        - DARF: Always prefer va_celula, fallback to components  
        - GPS: Always prefer va_celula, fallback to va_inss
        - OB: Always prefer va_linha_evento_individual, fallback to va_linha_evento
        
        The use_partial parameter is kept for compatibility but doesn't change the logic.
        
        Args:
            contract_data: List of processed empenho data
            use_partial: Kept for compatibility, logic now always matches frontend
            filters: Optional filters
            
        Returns:
            FinancialBreakdown: Detailed breakdown by document type
        """
        logger.info(f"Computing financial breakdown (frontend-compatible) - use_partial: {use_partial}")
        
        dar_total = Decimal('0')
        darf_total = Decimal('0')
        gps_total = Decimal('0')
        ob_total = Decimal('0')
        
        # Track unique document IDs to prevent double counting
        processed_docs = {
            'dar': set(),
            'darf': set(),
            'gps': set(),
            'ob': set()
        }
        
        for empenho_data in contract_data:
            financas = empenho_data.get('Finanças', {})
            
            # Process DAR documents
            dar_docs = financas.get('documentos_dar', [])
            for doc in dar_docs:
                doc_id = doc.get('id_doc_dar')
                if doc_id and doc_id not in processed_docs['dar']:
                    processed_docs['dar'].add(doc_id)
                    amount = self._calculate_dar_amount(doc, use_partial)
                    dar_total += amount
                    
            # Process DARF documents  
            darf_docs = financas.get('documentos_darf', [])
            for doc in darf_docs:
                doc_id = doc.get('id_doc_darf')
                if doc_id and doc_id not in processed_docs['darf']:
                    processed_docs['darf'].add(doc_id)
                    amount = self._calculate_darf_amount(doc, use_partial)
                    darf_total += amount
                    
            # Process GPS documents
            gps_docs = financas.get('documentos_gps', [])
            for doc in gps_docs:
                doc_id = doc.get('id_doc_gps')
                if doc_id and doc_id not in processed_docs['gps']:
                    processed_docs['gps'].add(doc_id)
                    amount = self._calculate_gps_amount(doc, use_partial)
                    gps_total += amount
                    
            # Process OB documents
            ob_docs = financas.get('linha_evento_ob', [])
            for doc in ob_docs:
                doc_id = doc.get('id_doc_ob')
                if doc_id and doc_id not in processed_docs['ob']:
                    processed_docs['ob'].add(doc_id)
                    amount = self._calculate_ob_amount(doc, use_partial)
                    ob_total += amount

        total = dar_total + darf_total + gps_total + ob_total
        
        logger.info(f"Financial breakdown - DAR: {dar_total}, DARF: {darf_total}, GPS: {gps_total}, OB: {ob_total}, Total: {total}")
        
        return FinancialBreakdown(
            dar=dar_total,
            darf=darf_total,
            gps=gps_total,
            ob=ob_total,
            total=total
        )

    def _calculate_dar_amount(self, doc: Dict[str, Any], use_partial: bool) -> Decimal:
        """Calculate effective amount for DAR document - MATCHES FRONTEND LOGIC"""
        # ALWAYS use va_celula if available (same as frontend logic)
        if doc.get('va_celula') is not None:
            amount = self._to_decimal(doc.get('va_celula', 0))
        else:
            # Fallback to component calculation if va_celula not available
            multa = self._to_decimal(doc.get('va_multa', 0))
            juros = self._to_decimal(doc.get('va_juros', 0))
            principal = self._to_decimal(doc.get('va_principal', 0))
            amount = multa + juros + principal
            
        # Apply reversal if document is cancelled
        if self._is_negative_document(doc):
            amount = -amount if amount != 0 else Decimal('0')
            
        return amount

    def _calculate_darf_amount(self, doc: Dict[str, Any], use_partial: bool) -> Decimal:
        """Calculate effective amount for DARF document - MATCHES FRONTEND LOGIC"""
        # ALWAYS use va_celula if available (same as frontend logic)
        if doc.get('va_celula') is not None:
            amount = self._to_decimal(doc.get('va_celula', 0))
        else:
            # Fallback to component calculation if va_celula not available
            receita = self._to_decimal(doc.get('va_receita', 0))
            juros = self._to_decimal(doc.get('va_juros', 0))
            multa = self._to_decimal(doc.get('va_multa', 0))
            amount = receita + juros + multa
            
        # Apply reversal if document is cancelled
        if self._is_negative_document(doc):
            amount = -amount if amount != 0 else Decimal('0')
            
        return amount

    def _calculate_gps_amount(self, doc: Dict[str, Any], use_partial: bool) -> Decimal:
        """Calculate effective amount for GPS document - MATCHES FRONTEND LOGIC"""
        # ALWAYS use va_celula if available (same as frontend logic)
        if doc.get('va_celula') is not None:
            amount = self._to_decimal(doc.get('va_celula', 0))
        else:
            # Fallback to va_inss if va_celula not available
            amount = self._to_decimal(doc.get('va_inss', 0))
            
        # Apply reversal if document is cancelled
        if self._is_negative_document(doc):
            amount = -amount if amount != 0 else Decimal('0')
            
        return amount

    def _calculate_ob_amount(self, doc: Dict[str, Any], use_partial: bool) -> Decimal:
        """Calculate effective amount for OB document - MATCHES FRONTEND LOGIC"""
        # ALWAYS use va_linha_evento_individual if available (same as frontend logic)
        if doc.get('va_linha_evento_individual') is not None:
            amount = self._to_decimal(doc.get('va_linha_evento_individual', 0))
        else:
            # Fallback to va_linha_evento if va_linha_evento_individual not available
            # but log this as it might indicate data structure issues
            amount = self._to_decimal(doc.get('va_linha_evento', 0))
            if amount != 0:
                logger.warning(f"⚠️ va_linha_evento_individual not found for OB {doc.get('id_doc_ob', 'unknown')}, using va_linha_evento")
            
        # Apply reversal if OB document is cancelled
        is_cancelled = doc.get('is_cancelled', False)
        if is_cancelled:
            amount = -amount if amount != 0 else Decimal('0')
            
        return amount

    def _is_negative_document(self, doc: Dict[str, Any]) -> bool:
        """Check if document should be treated as negative (reversal)"""
        # Check explicit flag first
        if doc.get('is_negative_value') is True:
            return True
            
        # Check status
        status = doc.get('no_situacao_doc', '').upper()
        return status in self.NEGATIVE_STATUSES

    def _to_decimal(self, value: Any) -> Decimal:
        """Convert value to Decimal safely"""
        if value is None:
            return Decimal('0')
        
        try:
            # Handle string values
            if isinstance(value, str):
                value = value.replace(',', '.')  # Handle BR decimal format
                
            return Decimal(str(value)).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
        except (ValueError, TypeError, InvalidOperation):
            logger.warning(f"Could not convert to Decimal: {value}")
            return Decimal('0')

    def validate_calculation(
        self,
        contract_data: List[Dict[str, Any]],
        expected_total: Optional[Decimal] = None,
        tolerance: Decimal = Decimal('0.01')
    ) -> Dict[str, Any]:
        """
        Validate the calculation against expected results or consistency checks.
        
        Args:
            contract_data: Data to validate
            expected_total: Expected total value
            tolerance: Acceptable difference
            
        Returns:
            Dict with validation results
        """
        partial_total = self.compute_total_financial_value(contract_data, use_partial=True)
        nominal_total = self.compute_total_financial_value(contract_data, use_partial=False)
        
        partial_breakdown = self.compute_financial_breakdown(contract_data, use_partial=True)
        nominal_breakdown = self.compute_financial_breakdown(contract_data, use_partial=False)
        
        result = {
            'partial_total': partial_total,
            'nominal_total': nominal_total,
            'partial_breakdown': partial_breakdown,
            'nominal_breakdown': nominal_breakdown,
            'difference': abs(partial_total - nominal_total),
            'consistent': True,
            'messages': []
        }
        
        if expected_total is not None:
            diff_partial = abs(partial_total - expected_total)
            diff_nominal = abs(nominal_total - expected_total)
            
            result['expected_total'] = expected_total
            result['partial_matches_expected'] = diff_partial <= tolerance
            result['nominal_matches_expected'] = diff_nominal <= tolerance
            
            if not result['partial_matches_expected'] and not result['nominal_matches_expected']:
                result['consistent'] = False
                result['messages'].append(f"Neither partial ({partial_total}) nor nominal ({nominal_total}) totals match expected ({expected_total})")
        
        return result

    def generate_sanity_check_sql(self) -> str:
        """
        Generate SQL query for independent validation of totals.
        
        Returns:
            str: SQL query for validation
        """
        return """
        -- Sanity Check Query for Financial Totals
        -- This query independently calculates totals to validate Python calculations
        
        WITH contract_empenhos AS (
            SELECT DISTINCT ce.empenho_id, e.numero, e.unidade_id, u.codigo as uasg_codigo
            FROM contratoempenhos ce
            JOIN empenhos e ON ce.empenho_id = e.id
            JOIN unidades u ON e.unidade_id = u.id
            WHERE ce.contrato_id = :contrato_id
        ),
        
        dar_totals AS (
            SELECT 
                'DAR' as doc_type,
                COUNT(DISTINCT dar.id_doc_dar) as doc_count,
                -- Nominal total (component values)
                SUM(CASE 
                    WHEN wsd.no_situacao_doc = 'DE CANCELAMENTO' THEN -(COALESCE(dar.va_principal, 0) + COALESCE(dar.va_juros, 0) + COALESCE(dar.va_multa, 0))
                    ELSE (COALESCE(dar.va_principal, 0) + COALESCE(dar.va_juros, 0) + COALESCE(dar.va_multa, 0))
                END) as nominal_total,
                -- Partial total (va_celula)
                SUM(CASE 
                    WHEN wsd.no_situacao_doc = 'DE CANCELAMENTO' THEN -COALESCE(dof.va_celula, 0)
                    ELSE COALESCE(dof.va_celula, 0)
                END) as partial_total
            FROM contract_empenhos ce
            JOIN wd_deta_orca_fina_dar dof ON dof.id_documento_ne = CONCAT(u.codigo, u.gestao, ce.numero)
            JOIN wd_doc_dar dar ON dar.id_doc_dar = dof.id_documento_dar
            LEFT JOIN wd_documento wds ON dar.id_doc_dar = wds.id_doc_dar
            LEFT JOIN wd_situacao_doc wsd ON wds.id_situacao_doc = wsd.id_situacao_doc AND wsd.id_tp_documento = 'DR'
            JOIN unidades u ON u.id = ce.unidade_id
        ),
        
        darf_totals AS (
            SELECT 
                'DARF' as doc_type,
                COUNT(DISTINCT darf.id_doc_darf) as doc_count,
                -- Nominal total (component values)
                SUM(CASE 
                    WHEN wsd.no_situacao_doc = 'DE CANCELAMENTO' THEN -(COALESCE(darf.va_receita, 0) + COALESCE(darf.va_juros, 0) + COALESCE(darf.va_multa, 0))
                    ELSE (COALESCE(darf.va_receita, 0) + COALESCE(darf.va_juros, 0) + COALESCE(darf.va_multa, 0))
                END) as nominal_total,
                -- Partial total (va_celula)  
                SUM(CASE 
                    WHEN wsd.no_situacao_doc = 'DE CANCELAMENTO' THEN -COALESCE(dof.va_celula, 0)
                    ELSE COALESCE(dof.va_celula, 0)
                END) as partial_total
            FROM contract_empenhos ce
            JOIN wd_deta_orca_fina_darf dof ON dof.id_documento_ne = CONCAT(u.codigo, u.gestao, ce.numero)
            JOIN wd_doc_darf darf ON darf.id_doc_darf = dof.id_documento_darf
            LEFT JOIN wd_documento wds ON darf.id_doc_darf = wds.id_doc_darf
            LEFT JOIN wd_situacao_doc wsd ON wds.id_situacao_doc = wsd.id_situacao_doc AND wsd.id_tp_documento = 'DF'
            JOIN unidades u ON u.id = ce.unidade_id
        ),
        
        gps_totals AS (
            SELECT 
                'GPS' as doc_type,
                COUNT(DISTINCT gps.id_doc_gps) as doc_count,
                -- Nominal total (va_inss)
                SUM(CASE 
                    WHEN wsd.no_situacao_doc = 'DE CANCELAMENTO' THEN -COALESCE(gps.va_inss, 0)
                    ELSE COALESCE(gps.va_inss, 0)
                END) as nominal_total,
                -- Partial total (va_celula)
                SUM(CASE 
                    WHEN wsd.no_situacao_doc = 'DE CANCELAMENTO' THEN -COALESCE(dof.va_celula, 0)
                    ELSE COALESCE(dof.va_celula, 0)
                END) as partial_total
            FROM contract_empenhos ce
            JOIN wd_deta_orca_fina_gps dof ON dof.id_documento_ne = CONCAT(u.codigo, u.gestao, ce.numero)
            JOIN wd_doc_gps gps ON gps.id_doc_gps = dof.id_documento_gps
            LEFT JOIN wd_documento wds ON gps.id_doc_gps = wds.id_doc_gps
            LEFT JOIN wd_situacao_doc wsd ON wds.id_situacao_doc = wsd.id_situacao_doc AND wsd.id_tp_documento = 'GP'
            JOIN unidades u ON u.id = ce.unidade_id
        ),
        
        ob_totals AS (
            SELECT 
                'OB' as doc_type,
                COUNT(DISTINCT wdo.id_doc_ob) as doc_count,
                -- Nominal total (full payment amounts, deduplicated by OB document)
                SUM(CASE 
                    WHEN wdo.id_doc_ob_cancelada IS NOT NULL AND wdo.id_doc_ob_cancelada != '-9' THEN -COALESCE(ob.va_linha_evento, 0)
                    ELSE COALESCE(ob.va_linha_evento, 0)
                END) as nominal_total,
                -- For OB, "partial" is the individual empenho amount (same as va_linha_evento in this context)
                SUM(CASE 
                    WHEN wdo.id_doc_ob_cancelada IS NOT NULL AND wdo.id_doc_ob_cancelada != '-9' THEN -COALESCE(ob.va_linha_evento, 0)
                    ELSE COALESCE(ob.va_linha_evento, 0)
                END) as partial_total
            FROM contract_empenhos ce
            JOIN wd_linha_evento_ob ob ON ob.co_inscricao_1 = ce.numero AND ob.id_ug_ne = ce.uasg_codigo  
            JOIN wd_doc_ob wdo ON ob.id_documento_ob = wdo.id_doc_ob
        )
        
        SELECT 
            doc_type,
            doc_count,
            nominal_total,
            partial_total,
            nominal_total - partial_total as difference
        FROM dar_totals
        UNION ALL
        SELECT * FROM darf_totals  
        UNION ALL
        SELECT * FROM gps_totals
        UNION ALL
        SELECT * FROM ob_totals
        UNION ALL
        SELECT 
            'TOTAL' as doc_type,
            (SELECT SUM(doc_count) FROM (SELECT doc_count FROM dar_totals UNION ALL SELECT doc_count FROM darf_totals UNION ALL SELECT doc_count FROM gps_totals UNION ALL SELECT doc_count FROM ob_totals) x) as doc_count,
            (SELECT SUM(nominal_total) FROM (SELECT nominal_total FROM dar_totals UNION ALL SELECT nominal_total FROM darf_totals UNION ALL SELECT nominal_total FROM gps_totals UNION ALL SELECT nominal_total FROM ob_totals) x) as nominal_total,
            (SELECT SUM(partial_total) FROM (SELECT partial_total FROM dar_totals UNION ALL SELECT partial_total FROM darf_totals UNION ALL SELECT partial_total FROM gps_totals UNION ALL SELECT partial_total FROM ob_totals) x) as partial_total,
            (SELECT SUM(nominal_total) - SUM(partial_total) FROM (SELECT nominal_total, partial_total FROM dar_totals UNION ALL SELECT nominal_total, partial_total FROM darf_totals UNION ALL SELECT nominal_total, partial_total FROM gps_totals UNION ALL SELECT nominal_total, partial_total FROM ob_totals) x) as difference
        ORDER BY 
            CASE doc_type 
                WHEN 'DAR' THEN 1
                WHEN 'DARF' THEN 2  
                WHEN 'GPS' THEN 3
                WHEN 'OB' THEN 4
                WHEN 'TOTAL' THEN 5
            END;
        """
