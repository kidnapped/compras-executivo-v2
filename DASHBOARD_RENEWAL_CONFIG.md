# Configuração da Coluna Renovação no Dashboard

Este documento explica como controlar a exibição da coluna "Renovação" no grid do dashboard.

## Como Configurar

A configuração é feita através do arquivo `app/core/config.py`, na variável:

```python
DASHBOARD_SHOW_RENEWAL_COLUMN: bool = True
```

### Valores possíveis:

- **`True`** (padrão): A coluna "Renovação" é exibida no dashboard
- **`False`**: A coluna "Renovação" é completamente oculta

## Funcionalidade

Quando a configuração está habilitada (`True`):
- O cabeçalho da tabela inclui a coluna "Renovação"
- Cada linha do contrato mostra as barras de renovação (120, 90, 45 dias)
- O JavaScript inicializa as barras de renovação

Quando a configuração está desabilitada (`False`):
- O cabeçalho da tabela não inclui a coluna "Renovação"
- As células de renovação não são renderizadas
- O JavaScript não inicializa as barras de renovação
- A coluna desaparece completamente da interface

## Implementação Técnica

### Backend (Python)
1. **config.py**: Define a variável `DASHBOARD_SHOW_RENEWAL_COLUMN`
2. **dashboard.py**: Passa a configuração para o template via context

### Frontend (HTML/JavaScript)
1. **dashboard.html**: Usa condicionais Jinja2 para mostrar/ocultar o cabeçalho
2. **dashboard.js**: Verifica `window.dashboardConfig.showRenewalColumn` para renderizar células condicionalmente

### Arquivos modificados:
- `app/core/config.py` - Adicionada configuração
- `app/api/v1/endpoints/dashboard.py` - Passa configuração para template
- `app/templates/dashboard.html` - Cabeçalho condicional + configuração JS
- `app/static/js/contrato/dashboard.js` - Renderização condicional das células

## Como Testar

1. Execute o script de teste:
```bash
python test_renewal_config.py
```

2. Altere a configuração no `config.py`:
```python
DASHBOARD_SHOW_RENEWAL_COLUMN: bool = False
```

3. Reinicie o servidor e acesse o dashboard para verificar que a coluna desapareceu

4. Volte para `True` e verifique que a coluna reaparece

## Observações

- A mudança na configuração requer restart do servidor
- A configuração afeta apenas a interface do usuário
- Os dados de renovação continuam sendo processados no backend independentemente da configuração
- É uma configuração global que afeta todos os usuários
