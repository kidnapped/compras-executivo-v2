import subprocess
from typing import List, Dict, Union

def _executar_query_java(query: str, classe: str) -> List[Dict[str, str]]:
    result = subprocess.run(
        ["java", "-cp", "vdb:jboss-dv-6.3.0-teiid-jdbc.jar", classe, query, "--csv"],
        capture_output=True,
        text=True,
        check=True
    )

    linhas = result.stdout.strip().split("\n")
    if not linhas or len(linhas) < 2:
        return []

    headers = [h.strip() for h in linhas[0].split(",")]
    dados = []

    for linha in linhas[1:]:
        valores = [v.strip() for v in linha.split(",")]
        item = {k: v for k, v in zip(headers, valores)}
        dados.append(item)

    return dados


def _executar_query_dict(query: str, classe: str, origem: str) -> Dict[str, Union[str, int]]:
    try:
        dados = _executar_query_java(query, classe)
        if not dados:
            return {}

        return {k: int(v) if v.isdigit() else v for k, v in dados[0].items()}
    except subprocess.CalledProcessError as e:
        return {"error": f"Erro ao executar Java ({origem})", "details": e.stderr}


def executar_query_contratos(query: str) -> Dict[str, Union[str, int]]:
    return _executar_query_dict(query, "vdb.QueryContratos", "Contratos")


def executar_query_financeiro(query: str) -> Dict[str, Union[str, int]]:
    return _executar_query_dict(query, "vdb.QueryFinanceiro", "Financeiro")
