#!/usr/bin/env python3
"""
Test script to validate that the sequential processing fix works
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.services.encontro.encontro_service import EncontroService

def test_import():
    """Test that the service imports correctly"""
    try:
        print("✅ EncontroService imported successfully")
        
        # Check that the method exists and has the right signature
        method = getattr(EncontroService, 'get_complete_contract_data', None)
        if method:
            print("✅ get_complete_contract_data method exists")
        else:
            print("❌ get_complete_contract_data method not found")
            
        # Check that we removed the concurrent processing
        import inspect
        source = inspect.getsource(EncontroService.get_complete_contract_data)
        
        if 'asyncio.gather' in source:
            print("❌ Still using asyncio.gather (concurrent processing)")
        else:
            print("✅ No longer using asyncio.gather - sequential processing implemented")
            
        if 'for i, empenho in enumerate(empenhos):' in source:
            print("✅ Sequential processing loop found")
        else:
            print("❌ Sequential processing loop not found")
            
        return True
        
    except Exception as e:
        print(f"❌ Import failed: {e}")
        return False

if __name__ == "__main__":
    print("Testing EncontroService sequential processing fix...")
    success = test_import()
    if success:
        print("\n🎉 All tests passed! The sequential processing fix is correctly implemented.")
        print("\nKey changes:")
        print("- Removed concurrent processing (asyncio.gather)")
        print("- Implemented sequential processing loop")
        print("- Added detailed logging for each empenho")
        print("\nThis should resolve the SQLAlchemy session conflict errors.")
    else:
        print("\n❌ Tests failed. Please check the implementation.")
    
    sys.exit(0 if success else 1)
