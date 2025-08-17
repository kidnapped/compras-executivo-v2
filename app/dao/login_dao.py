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
    
    # Se USE_ALIAS_LOGIN estiver habilitado, autenticar APENAS no banco blocok
    if settings.USE_ALIAS_LOGIN:
        real_cpf = await check_alias_authentication(cpf_normalized, password)
        if real_cpf:
            print(f"✅ ALIAS AUTHENTICATION: CPF {cpf_normalized} autenticado como {real_cpf}")
            # Normalizar o CPF real (alias) removendo formatação, caso tenha
            cpf_logged = real_cpf.replace(".", "").replace("-", "").strip()
            print(f"🔧 CPF normalizado: {cpf_logged}")
        else:
            # Se USE_ALIAS_LOGIN = True e não autenticou no blocok, falha imediatamente
            return LoginResult(success=False, error="CPF ou senha incorretos.")
    else:
        # Se USE_ALIAS_LOGIN = False, usar autenticação tradicional no banco principal
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
    print(f"🔍 BUSCANDO DADOS NO BANCO CONTRATOS:")
    print(f"  CPF logado: '{cpf_logged}'")
    print(f"  CPF formatado: '{cpf_formatted}'")
    
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
        print(f"🔍 Tentando buscar UASGs com CPF formatado: {cpf_formatted}")
        result_uasgs = await contratos_session.execute(stmt_uasgs, {
            "cpf": cpf_formatted
        })
        uasgs_rows = result_uasgs.fetchall()
        print(f"  Resultado: {len(uasgs_rows)} UASGs encontradas")
        
        # Se não encontrar, tentar sem formatação
        if not uasgs_rows:
            print(f"🔍 Tentando buscar UASGs com CPF sem formatação: {cpf_logged}")
            result_uasgs = await contratos_session.execute(stmt_uasgs, {
                "cpf": cpf_logged
            })
            uasgs_rows = result_uasgs.fetchall()
            print(f"  Resultado: {len(uasgs_rows)} UASGs encontradas")
        
        user_data["uasgs"] = [row[0] for row in uasgs_rows] if uasgs_rows else []
        print(f"📊 UASGs finais: {user_data['uasgs']}")
        
        # Buscar dados do usuário - usar mesmo CPF que funcionou acima
        cpf_for_search = cpf_formatted if user_data["uasgs"] else cpf_logged
        print(f"🔍 Buscando dados do usuário com CPF: {cpf_for_search}")
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
            print(f"✅ Dados do usuário encontrados: ID={user_id_row[0]}, Name={user_id_row[1]}")
        else:
            print(f"❌ Nenhum dado de usuário encontrado para CPF: {cpf_for_search}")
        
        # Buscar roles
        print(f"🔍 Buscando roles para CPF: {cpf_for_search}")
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
        print(f"📋 Roles encontradas: {roles}")
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
    
    print(f"📊 DADOS FINAIS DO USUÁRIO:")
    print(f"  CPF: {user_data['cpf']}")
    print(f"  UASGs: {user_data['uasgs']} (quantidade: {len(user_data['uasgs'])})")
    print(f"  ID: {user_data['usuario_id']}")
    print(f"  Nome: {user_data['usuario_name']}")
    print(f"  Email: {user_data['usuario_email']}")
    print(f"  Role: {user_data['usuario_role']}")
    print(f"  Scope: {user_data['usuario_scope']}")
    
    return LoginResult(success=True, user_data=user_data)
