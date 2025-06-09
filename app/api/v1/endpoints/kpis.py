from fastapi import APIRouter

router = APIRouter()

@router.get("/")
def list_kpis():
    return [{"kpi_id": 1, "name": "Performance"}]
