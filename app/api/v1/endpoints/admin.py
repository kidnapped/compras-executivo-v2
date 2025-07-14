from fastapi import APIRouter, Request, Depends, Form, Query
from fastapi.responses import HTMLResponse, RedirectResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func

from app.db.session import get_session_blocok
from app.db.models.user import User
from app.core.templates import templates

router = APIRouter()

@router.get("/admin", response_class=HTMLResponse)
async def admin_index(request: Request):
    return templates.TemplateResponse("admin.html", {"request": request})

# Página HTML
@router.get("/admin/usuarios", response_class=HTMLResponse)
async def admin_usuarios_html(request: Request):
    return templates.TemplateResponse("admin_usuarios.html", {"request": request})

# API JSON para listagem paginada
@router.get("/admin/usuarios/lista")
async def listar_usuarios(
    pagina: int = Query(1, ge=1),
    limite: int = Query(10, ge=1, le=100),
    db: AsyncSession = Depends(get_session_blocok)
):
    offset = (pagina - 1) * limite
    total = await db.scalar(select(func.count()).select_from(User))
    result = await db.execute(select(User).offset(offset).limit(limite))
    usuarios = result.scalars().all()

    return {
        "total": total,
        "pagina": pagina,
        "limite": limite,
        "usuarios": [
            {
                "id": u.id,
                "nome": u.nome,
                "cpf": u.cpf,
                "email": u.email,
                "usuario": u.usuario,
                "origem_login": u.origem_login,
                "ativo": u.ativo,
            }
            for u in usuarios
        ]
    }


# Criar usuário via formulário
@router.post("/admin/usuarios/criar")
async def criar_usuario(
    request: Request,
    nome: str = Form(...),
    cpf: str = Form(...),
    email: str = Form(None),
    usuario: str = Form(...),
    senha: str = Form(None),
    ativo: str = Form("true"),
    db: AsyncSession = Depends(get_session_blocok)
):
    novo = User(
        nome=nome,
        cpf=cpf,
        email=email,
        usuario=usuario,
        senha=senha,
        origem_login="manual",
        ativo=(ativo == "true")
    )
    db.add(novo)
    await db.commit()
    return RedirectResponse(url="/admin/usuarios", status_code=303)


# Excluir usuário
@router.post("/admin/usuarios/excluir/{usuario_id}")
async def excluir_usuario(usuario_id: int, db: AsyncSession = Depends(get_session_blocok)):
    user = await db.get(User, usuario_id)
    if user:
        await db.delete(user)
        await db.commit()
    return RedirectResponse(url="/admin/usuarios", status_code=303)


# Editar usuário
@router.post("/admin/usuarios/editar/{usuario_id}")
async def editar_usuario(
    usuario_id: int,
    nome: str = Form(...),
    email: str = Form(None),
    ativo: str = Form("true"),
    db: AsyncSession = Depends(get_session_blocok)
):
    user = await db.get(User, usuario_id)
    if user:
        user.nome = nome
        user.email = email
        user.ativo = (ativo == "true")
        await db.commit()
    return RedirectResponse(url="/admin/usuarios", status_code=303)


# Outras páginas administrativas
@router.get("/admin/perfis", response_class=HTMLResponse)
async def admin_perfis(request: Request):
    return templates.TemplateResponse("admin.html", {
        "request": request,
        "titulo": "Perfis",
        "descricao": "Em desenvolvimento",
        "icone": "fas fa-id-badge"
    })

@router.get("/admin/permissoes", response_class=HTMLResponse)
async def admin_permissoes(request: Request):
    return templates.TemplateResponse("admin.html", {
        "request": request,
        "titulo": "Permissões",
        "descricao": "Em desenvolvimento", 
        "icone": "fas fa-user-shield"
    })

@router.get("/admin/logs", response_class=HTMLResponse)
async def admin_logs(request: Request):
    return templates.TemplateResponse("admin.html", {
        "request": request,
        "titulo": "Logs",
        "descricao": "Em desenvolvimento",
        "icone": "fas fa-file-alt"
    })

@router.get("/admin/sistema", response_class=HTMLResponse)
async def admin_sistema(request: Request):
    return templates.TemplateResponse("admin.html", {
        "request": request,
        "titulo": "Sistema",
        "descricao": "Em desenvolvimento",
        "icone": "fas fa-cogs"
    })

@router.get("/admin/etl", response_class=HTMLResponse)
async def admin_etl(request: Request):
    return templates.TemplateResponse("admin.html", {
        "request": request,
        "titulo": "ETL",
        "descricao": "Em desenvolvimento",
        "icone": "fas fa-database"
    })

@router.get("/admin/uasgs", response_class=HTMLResponse)
async def admin_uasgs(request: Request):
    return templates.TemplateResponse("admin.html", {
        "request": request,
        "titulo": "UASGs",
        "descricao": "Em desenvolvimento",
        "icone": "fas fa-university"
    })

@router.get("/admin/parametros", response_class=HTMLResponse)
async def admin_parametros(request: Request):
    return templates.TemplateResponse("admin.html", {
        "request": request,
        "titulo": "Parâmetros",
        "descricao": "Em desenvolvimento",
        "icone": "fas fa-sliders-h"
    })

@router.get("/admin/integracoes", response_class=HTMLResponse)
async def admin_integracoes(request: Request):
    return templates.TemplateResponse("admin.html", {
        "request": request,
        "titulo": "Integrações",
        "descricao": "Em desenvolvimento",
        "icone": "fas fa-plug"
    })
