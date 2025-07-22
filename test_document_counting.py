#!/usr/bin/env python3
"""
Test document counting functionality
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

def test_document_counting():
    """Test that document counting works correctly with the new structure"""
    try:
        from app.services.encontro.data_processor import DataProcessor
        
        # Create test data that matches the actual structure
        test_data = [
            {
                'documentos_dar': [{'id': 1}, {'id': 2}],  # 2 DAR docs
                'documentos_darf': [{'id': 3}],            # 1 DARF doc
                'documentos_gps': [],                      # 0 GPS docs
                'linha_evento_ob': [{'id': 4}, {'id': 5}, {'id': 6}]  # 3 OB docs
            },
            {
                'documentos_dar': [{'id': 7}],             # 1 DAR doc
                'documentos_darf': [{'id': 8}, {'id': 9}], # 2 DARF docs
                'documentos_gps': [{'id': 10}],            # 1 GPS doc
                'linha_evento_ob': []                      # 0 OB docs
            }
        ]
        
        processor = DataProcessor()
        result = processor.create_summary_response(test_data)
        
        # Expected counts:
        # DAR: 2 + 1 = 3
        # DARF: 1 + 2 = 3  
        # GPS: 0 + 1 = 1
        # OB: 3 + 0 = 3
        # Total: 3 + 3 + 1 + 3 = 10
        
        total_docs = result['summary']['total_documents']
        
        print("📊 Document Count Test Results:")
        print(f"  DAR documents: {total_docs['dar']} (expected: 3)")
        print(f"  DARF documents: {total_docs['darf']} (expected: 3)")
        print(f"  GPS documents: {total_docs['gps']} (expected: 1)")
        print(f"  OB documents: {total_docs['ob']} (expected: 3)")
        print(f"  Total documents: {total_docs['total']} (expected: 10)")
        
        # Verify counts
        success = (
            total_docs['dar'] == 3 and
            total_docs['darf'] == 3 and
            total_docs['gps'] == 1 and
            total_docs['ob'] == 3 and
            total_docs['total'] == 10
        )
        
        if success:
            print("✅ All document counts are correct!")
            print("✅ OB documents are now included in the total")
            print("✅ Document structure matches actual data format")
            return True
        else:
            print("❌ Document counts are incorrect")
            return False
            
    except Exception as e:
        print(f"❌ Test failed: {e}")
        return False

if __name__ == "__main__":
    print("Testing document counting with OB inclusion...")
    success = test_document_counting()
    sys.exit(0 if success else 1)
