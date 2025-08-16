from sqlalchemy import text
from app.db.session import get_async_session, get_session_contratos, get_session_blocok
from app.core.config import settings
from typing import Optional, Dict, Any, List


class LoginResult:
    """Classe para representar o resultado do login"""
    def __init__(self, success: bool, user_data: Optional[Dict[str, Any]] = None, error: Optional[str] = None):
        self.success = success
        self.user_data = user_data or {}
        self.error = error


async def check_alias_authentication(cpf: str, password: str) -> Optional[str]:
    """
    Verifica se existe um alias para o CPF e senha fornecidos na tabela cpf_alias do banco blocok
    
    Args:
        cpf: CPF do alias (usado para login)
        password: Senha do alias
        
    Returns:
        CPF real (alias) se a autenticação for bem-sucedida, None caso contrário
    """
    cpf_normalized = cpf.replace(".", "").replace("-", "")
    
    try:
        async for session in get_session_blocok():
            stmt = text("""
                SELECT alias FROM cpf_alias
                WHERE cpf = :cpf AND senha = crypt(:senha, senha)
                  AND ativo IS TRUE
                LIMIT 1
            """)
            result = await session.execute(stmt, {
                "cpf": cpf_normalized,
                "senha": password
            })
            row = result.fetchone()
            
            if row:
                return row[0]  # Retorna o CPF real (alias)
    except Exception as e:
        print(f"⚠️ Erro ao verificar alias authentication: {e}")
        # Se a tabela não existir ou houver erro, continua sem alias
        pass
    
    return None


async def login(cpf: str, password: str) -> LoginResult:
    """
    Autentica o usuário e retorna todas as informações necessárias
    
    Args:
        cpf: CPF do usuário (será normalizado internamente)
        password: Senha do usuário
        
    Returns:
        LoginResult: Objeto contendo o resultado da autenticação e dados do usuário
    """
    # Normalizar CPF removendo formatação
    cpf_normalized = cpf.replace(".", "").replace("-", "")
    
    # Se USE_ALIAS_LOGIN estiver habilitado, tentar autenticação por alias primeiro
    real_cpf = None
    if settings.USE_ALIAS_LOGIN:
        real_cpf = await check_alias_authentication(cpf_normalized, password)
        if real_cpf:
            print(f"✅ ALIAS AUTHENTICATION: CPF {cpf_normalized} autenticado como {real_cpf}")
            # Usar o CPF real para continuar o processo
            cpf_normalized = real_cpf.replace(".", "").replace("-", "")
    
    # Se não foi autenticado por alias, verificar credenciais no banco principal
    if not real_cpf:
        async for session in get_async_session():
            stmt = text("""
                SELECT cpf FROM usuario
                WHERE cpf = :cpf AND senha = crypt(:senha, senha)
                  AND ativo IS TRUE
                LIMIT 1
            """)
            result = await session.execute(stmt, {
                "cpf": cpf_normalized,
                "senha": password
            })
            row = result.fetchone()
        
        if not row:
            return LoginResult(success=False, error="CPF ou senha incorretos.")
        
        cpf_logged = row[0]
    else:
        # Se foi autenticado por alias, usar o CPF real
        cpf_logged = cpf_normalized
    
    # Se CPF for de teste (00000000000), usar valores padrão
    if cpf_logged == "00000000000":
        user_data = {
            "cpf": "31352752808",
            "uasgs": [393003],
            "usuario_id": 198756,
            "usuario_role": "Admin Root",
            "usuario_scope": "root",
            "usuario_name": "Root",
            "usuario_email": "root@comprasexecutivo.sistema.gov.br"
        }
        return LoginResult(success=True, user_data=user_data)
    
    # Para usuários reais, buscar dados nos outros bancos
    user_data = {
        "cpf": cpf_logged,
        "uasgs": [],
        "usuario_id": None,
        "usuario_role": None,
        "usuario_scope": None,
        "usuario_name": None,
        "usuario_email": None
    }
    
    # Buscar dados no banco "contratos"
    cpf_formatted = f"{cpf_logged[:3]}.{cpf_logged[3:6]}.{cpf_logged[6:9]}-{cpf_logged[9:]}"
    
    async for contratos_session in get_session_contratos():
        # Buscar UASGs - tentar primeiro com CPF formatado
        stmt_uasgs = text("""
            SELECT u3.codigosiafi 
            FROM users u 
            JOIN unidadesusers u2 ON u.id = u2.user_id
            JOIN unidades u3 ON u2.unidade_id = u3.id
            WHERE u.cpf = :cpf
        """)
        
        # Tentar primeiro com CPF formatado
        result_uasgs = await contratos_session.execute(stmt_uasgs, {
            "cpf": cpf_formatted
        })
        uasgs_rows = result_uasgs.fetchall()
        
        # Se não encontrar, tentar sem formatação
        if not uasgs_rows:
            result_uasgs = await contratos_session.execute(stmt_uasgs, {
                "cpf": cpf_logged
            })
            uasgs_rows = result_uasgs.fetchall()
        
        user_data["uasgs"] = [row[0] for row in uasgs_rows] if uasgs_rows else []
        
        # Buscar dados do usuário - usar mesmo CPF que funcionou acima
        cpf_for_search = cpf_formatted if user_data["uasgs"] else cpf_logged
        stmt_user_id = text("""
            SELECT id, name, email FROM users WHERE cpf = :cpf LIMIT 1
        """)
        result_user_id = await contratos_session.execute(stmt_user_id, {
            "cpf": cpf_for_search
        })
        user_id_row = result_user_id.fetchone()
        
        if user_id_row:
            user_data["usuario_id"] = user_id_row[0]
            user_data["usuario_name"] = user_id_row[1]
            user_data["usuario_email"] = user_id_row[2]
        
        # Buscar roles
        stmt_roles = text("""
            SELECT r.name 
            FROM model_has_roles mhr
            JOIN roles r ON mhr.role_id = r.id
            JOIN users u ON mhr.model_id::numeric = u.id
            WHERE u.cpf = :cpf
        """)
        result_roles = await contratos_session.execute(stmt_roles, {
            "cpf": cpf_for_search
        })
        roles_rows = result_roles.fetchall()
        roles = [row[0] for row in roles_rows] if roles_rows else []
        # Se tiver múltiplas roles, pegar a primeira
        user_data["usuario_role"] = roles[0] if roles else None
    
    # Buscar scope no banco "blocok"
    async for blocok_session in get_session_blocok():
        scopes = []
        current_role = user_data["usuario_role"]
        if current_role:
            stmt_scope = text("""
                SELECT abrangencia FROM perfil_acesso WHERE perfil = :perfil
            """)
            result_scope = await blocok_session.execute(stmt_scope, {
                "perfil": current_role
            })
            scope_rows = result_scope.fetchall()
            for scope_row in scope_rows:
                if scope_row[0] not in scopes:
                    scopes.append(scope_row[0])
        
        # Se tiver múltiplos scopes, pegar o primeiro
        user_data["usuario_scope"] = scopes[0] if scopes else None
    
    return LoginResult(success=True, user_data=user_data)
