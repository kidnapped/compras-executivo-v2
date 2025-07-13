#!/usr/bin/env python3
"""
Script para testar a configuração da coluna de renovação no dashboard
"""

import sys
import os

# Adicionar o diretório do app ao path
sys.path.append(os.path.join(os.path.dirname(__file__), 'app'))

try:
    from app.core.config import settings
    
    print("=== Teste de Configuração da Coluna Renovação ===")
    print(f"DASHBOARD_SHOW_RENEWAL_COLUMN: {settings.DASHBOARD_SHOW_RENEWAL_COLUMN}")
    
    # Teste mudando o valor
    original_value = settings.DASHBOARD_SHOW_RENEWAL_COLUMN
    
    # Simular mudança de configuração
    print(f"\nValor original: {original_value}")
    print("Para alterar a configuração, modifique o arquivo app/core/config.py")
    print("Altere a linha: DASHBOARD_SHOW_RENEWAL_COLUMN: bool = True")
    print("Para: DASHBOARD_SHOW_RENEWAL_COLUMN: bool = False")
    
    print("\n=== Como usar ===")
    print("1. True: A coluna 'Renovação' aparece no dashboard")
    print("2. False: A coluna 'Renovação' é completamente oculta")
    
except ImportError as e:
    print(f"Erro ao importar configurações: {e}")
    print("Certifique-se de que o arquivo config.py está configurado corretamente")

except Exception as e:
    print(f"Erro: {e}")
