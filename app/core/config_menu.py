# Configuração de menus por scope/perfil de usuário

# Menu completo com todos os itens disponíveis
MENU_ITEMS = {
    "contratos": {"texto": "Contratos", "url": "/dashboard", "icone": "fas fa-chart-line"},
    "filtro_uasg": {"texto": "Filtro UASG", "url": "/uasg-filter", "icone": "fas fa-filter"},
    "indicadores_old": {"texto": "Indicadores Old", "url": "/kpis", "icone": "fas fa-tachometer-alt"},
    "indicadores": {"texto": "Indicadores", "url": "/indicadores", "icone": "fas fa-tachometer-alt"},
    "administracao": {"texto": "Administração", "url": "/admin", "icone": "fas fa-cogs"},
    "minha_conta": {"texto": "Minha Conta", "url": "/minha-conta", "icone": "fas fa-user-circle"},
    "suporte": {"texto": "Suporte", "url": "/suporte", "icone": "fas fa-headset"},
    "ajuda": {"texto": "Ajuda", "url": "/ajuda", "icone": "fas fa-question-circle"},
    "dev_ops": {"texto": "dev-ops", "url": "/dev-ops", "icone": "fas fa-tools"},
    "sair": {"texto": "Sair", "url": "/logout", "icone": "fas fa-sign-out-alt"}
}

# Configuração de menus por scope de usuário
MENU_CONFIG = {
    "root": [
        "minha_conta",
        "contratos", 
        "filtro_uasg",
        "indicadores_old",
        "indicadores",
        "suporte",
        "ajuda",
        "administracao",
        "dev_ops",
    ],
    "admin": [
        "minha_conta",
        "contratos",
        "indicadores",
        "suporte",
        "ajuda",
        "administracao",
        "sair"
    ],
    "global": [
        "minha_conta",
        "contratos",
        "indicadores",
        "suporte", 
        "ajuda",
        "sair"
    ],
    "orgao": [
        "minha_conta",
        "contratos",
        "suporte",
        "ajuda", 
        "sair"
    ],
    "unidade": [
        "minha_conta",
        "contratos",
        "suporte",
        "ajuda",
        "sair"
    ]
}

def get_menu_for_scope(scope):
    """
    Retorna o menu correspondente ao scope do usuário
    
    Args:
        scope (str): O scope do usuário (root, admin, global, orgao, unidade)
        
    Returns:
        list: Lista de itens do menu para o scope especificado
    """
    if scope not in MENU_CONFIG:
        # Se o scope não for reconhecido, retorna menu básico
        scope = "unidade"
    
    menu_keys = MENU_CONFIG[scope]
    menu = []
    
    for key in menu_keys:
        if key in MENU_ITEMS:
            menu.append(MENU_ITEMS[key])
    
    return menu
