"""
Utilitários para suporte ao SPA (Single Page Application)
"""

from fastapi import Request
from fastapi.responses import JSONResponse
from fastapi.templating import Jinja2Templates
from typing import Dict, Any, List, Optional


def is_spa_request(request: Request) -> bool:
    """
    Verifica se a requisição é feita via SPA (AJAX)
    """
    return (
        request.headers.get("X-SPA-Request") == "true" or
        request.headers.get("X-Requested-With") == "XMLHttpRequest"
    )


def create_spa_response(
    template_name: str,
    context: Dict[str, Any],
    templates: Jinja2Templates,
    request: Request,
    title: Optional[str] = None,
    scripts: Optional[List[Dict[str, str]]] = None
) -> JSONResponse:
    """
    Cria uma resposta JSON apropriada para SPA
    
    Args:
        template_name: Nome do template a ser renderizado
        context: Contexto para o template
        templates: Instância do Jinja2Templates
        request: Requisição FastAPI
        title: Título da página (opcional)
        scripts: Lista de scripts a serem carregados (opcional)
    """
    
    # Renderizar apenas o conteúdo do bloco {% block content %}
    template = templates.get_template(template_name)
    
    # Renderizar o template completo para extrair apenas o conteúdo
    full_html = template.render(context)
    
    # Extrair apenas o conteúdo entre {% block content %} e {% endblock %}
    content = extract_content_block(full_html)
    
    # Extrair título da página se não fornecido
    if not title:
        title = extract_title_from_html(full_html)
    
    response_data = {
        "content": content,
        "title": title,
        "route": str(request.url.path) + (str(request.url.query) and f"?{request.url.query}" or ""),
        "scripts": scripts or []
    }
    
    return JSONResponse(content=response_data)


def extract_content_block(html: str) -> str:
    """
    Extrai o conteúdo do bloco principal de um template renderizado
    """
    import re
    
    # Tentar encontrar o conteúdo entre tags {% block content %} e {% endblock %}
    # Para isso, vamos procurar pelo conteúdo dentro da div com id="main-content"
    patterns = [
        # Padrão 1: div com id="main-content"
        r'<div[^>]*id="main-content"[^>]*>(.*?)</div>(?=\s*</main>)',
        # Padrão 2: div com class container-lg dentro de main
        r'<main[^>]*>.*?<div[^>]*class="[^"]*container-lg[^"]*"[^>]*>(.*?)</div>\s*</main>',
        # Padrão 3: qualquer div dentro de main.br-main
        r'<main[^>]*class="[^"]*br-main[^"]*"[^>]*>.*?<div[^>]*>(.*?)</div>\s*</main>',
        # Padrão 4: conteúdo direto de main
        r'<main[^>]*>(.*?)</main>',
    ]
    
    for pattern in patterns:
        match = re.search(pattern, html, re.DOTALL | re.IGNORECASE)
        if match:
            content = match.group(1).strip()
            
            # Limpar conteúdo: remover divs container desnecessárias
            content = re.sub(r'^\s*<div[^>]*class="[^"]*container[^"]*"[^>]*>\s*', '', content)
            content = re.sub(r'\s*</div>\s*$', '', content)
            
            # Se o conteúdo ainda está muito encapsulado, tentar extrair mais
            if content.startswith('<div') and content.count('<div') == 1:
                inner_match = re.search(r'<div[^>]*>(.*?)</div>$', content, re.DOTALL)
                if inner_match:
                    content = inner_match.group(1).strip()
            
            return content
    
    # Fallback: procurar por bloco content específico nos templates Jinja2
    content_block_match = re.search(
        r'{% block content %}(.*?){% endblock %}', 
        html, 
        re.DOTALL | re.IGNORECASE
    )
    if content_block_match:
        return content_block_match.group(1).strip()
    
    # Fallback final: retornar todo o body se não encontrar padrões específicos
    body_match = re.search(r'<body[^>]*>(.*?)</body>', html, re.DOTALL | re.IGNORECASE)
    if body_match:
        body_content = body_match.group(1).strip()
        # Remover scripts e elementos de navegação/menu
        body_content = re.sub(r'<script[^>]*>.*?</script>', '', body_content, flags=re.DOTALL)
        body_content = re.sub(r'<div[^>]*id="header-dynamic-container"[^>]*>.*?</div>', '', body_content, flags=re.DOTALL)
        body_content = re.sub(r'<div[^>]*id="menu-dynamic-container"[^>]*>.*?</div>', '', body_content, flags=re.DOTALL)
        body_content = re.sub(r'<div[^>]*id="footer-dynamic-container"[^>]*>.*?</div>', '', body_content, flags=re.DOTALL)
        body_content = re.sub(r'<div[^>]*id="page-loader"[^>]*>.*?</div>', '', body_content, flags=re.DOTALL)
        return body_content.strip()
    
    return html


def extract_title_from_html(html: str) -> str:
    """
    Extrai o título de um HTML renderizado
    """
    import re
    
    title_match = re.search(r'<title[^>]*>([^<]+)</title>', html, re.IGNORECASE)
    if title_match:
        return title_match.group(1).strip()
    
    return "Compras Executivo"


def spa_route_handler(
    template_name: str,
    context: Dict[str, Any],
    templates: Jinja2Templates,
    request: Request,
    title: Optional[str] = None,
    scripts: Optional[List[Dict[str, str]]] = None
):
    """
    Handler genérico para rotas que suportam SPA
    
    Retorna JSONResponse para requisições SPA ou TemplateResponse para requisições normais
    """
    
    if is_spa_request(request):
        return create_spa_response(
            template_name=template_name,
            context=context,
            templates=templates,
            request=request,
            title=title,
            scripts=scripts
        )
    else:
        return templates.TemplateResponse(template_name, context)


def get_page_scripts(page_type: str) -> List[Dict[str, str]]:
    """
    Retorna a lista de scripts específicos para cada tipo de página
    """
    
    scripts_map = {
        "dashboard": [
            {"src": "/static/js/contrato/dashboard.js", "type": "module"},
        ],
        "kpis": [
            {"src": "/static/js/kpi/kpis.js", "type": "module"},
            {"src": "/static/js/kpi/card.js", "type": "module"},
        ],
        "indicadores": [
            {"src": "/static/js/indicadores.js", "type": "module"},
        ],
        "admin": [
            {"src": "/static/js/admin/admin_etl.js", "type": "module"},
        ],
        "uasg-filter": [
            # Não há arquivo específico ainda, mas endpoint existe
        ],
        "dev-ops": [
            {"src": "/static/js/dev-ops/dev-ops.js", "type": "module"},
        ],
        "encontro_contas": [
            {"src": "/static/js/encontro_contas.js", "type": "module"},
        ],
        "vdb": [
            {"src": "/static/js/admin/vdb_compras.js", "type": "module"},
        ]
    }
    
    return scripts_map.get(page_type, [])


def add_spa_context(context: Dict[str, Any], request: Request) -> Dict[str, Any]:
    """
    Adiciona informações específicas do SPA ao contexto do template
    """
    context.update({
        "is_spa_request": is_spa_request(request),
        "current_route": str(request.url.path) + (str(request.url.query) and f"?{request.url.query}" or ""),
        "spa_enabled": True
    })
    
    return context
