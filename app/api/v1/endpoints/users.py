from fastapi import APIRouter

router = APIRouter()

@router.get("/")
def list_users():
    return [{"user_id": 1, "name": "Admin"}]
