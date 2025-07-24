from typing import List, Optional
from fastapi import Request

def get_uasgs_str(request: Request) -> List[str]:
    return [str(x) for x in request.session.get("uasgs", [])]

def get_usuario_id(request: Request) -> Optional[int]:
    # Try multiple possible session keys for user ID
    return (request.session.get("user_id") or 
            request.session.get("usuario_id") or 
            None)

def get_usuario_cpf(request: Request) -> Optional[str]:
    return request.session.get("cpf")
