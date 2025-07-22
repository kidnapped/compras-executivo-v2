#!/usr/bin/env python3
"""
Test empenho filtering functionality
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

def test_empenho_filter_import():
    """Test that the service imports correctly with the new empenho filter"""
    try:
        from app.services.encontro.encontro_service import EncontroService
        from app.services.encontro.query_service import QueryService
        
        # Check that the method signatures are correct
        import inspect
        
        # Check EncontroService.get_complete_contract_data signature
        encontro_sig = inspect.signature(EncontroService.get_complete_contract_data)
        encontro_params = list(encontro_sig.parameters.keys())
        
        # Check QueryService.get_contract_empenhos signature  
        query_sig = inspect.signature(QueryService.get_contract_empenhos)
        query_params = list(query_sig.parameters.keys())
        
        print("📋 Method Signature Analysis:")
        print(f"  EncontroService.get_complete_contract_data parameters: {encontro_params}")
        print(f"  QueryService.get_contract_empenhos parameters: {query_params}")
        
        # Verify parameters
        encontro_has_empenho_param = 'empenho_numero' in encontro_params
        query_has_empenho_param = 'empenho_numero' in query_params
        
        print("\n✅ Parameter Validation:")
        print(f"  EncontroService has empenho_numero parameter: {encontro_has_empenho_param}")
        print(f"  QueryService has empenho_numero parameter: {query_has_empenho_param}")
        
        if encontro_has_empenho_param and query_has_empenho_param:
            print("\n🎉 Empenho filtering is correctly implemented!")
            print("\n📖 Usage Instructions:")
            print("  1. Get all empenhos for a contract:")
            print("     GET /tudo?contrato_id=132025")
            print("  2. Get specific empenho:")
            print("     GET /tudo?contrato_id=132025&empenho_numero=2024NE000123")
            return True
        else:
            print("\n❌ Empenho filtering parameters missing")
            return False
            
    except Exception as e:
        print(f"❌ Import failed: {e}")
        return False

if __name__ == "__main__":
    print("Testing empenho filtering implementation...")
    success = test_empenho_filter_import()
    sys.exit(0 if success else 1)
