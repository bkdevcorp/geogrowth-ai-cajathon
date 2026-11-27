#!/usr/bin/env python3
"""Agrega exclusivamente estadísticas sin PII de las licencias La Convención.
Uso: python scripts/aggregate_licencias_convencion.py entrada.csv salida.json
El CSV original no se almacena en el repositorio público.
"""
from __future__ import annotations
import argparse
import collections
import csv
from datetime import datetime
import hashlib
import json
from pathlib import Path

TARGET_ENTITY = "300748"
CSV_UBIGEO = "070901"  # código RENIEC consignado como INEI en la fuente
NORMALIZED_INEI = "080901"  # Santa Ana, La Convención, Cusco
SOURCE_URL = ("https://www.datosabiertos.gob.pe/dataset/"
              "licencias-de-funcionamiento-de-municipalidad-provincial-la-convenci%C3%B3n/"
              "resource/bce103e8-e3ae")

def summarize(source: Path) -> dict:
    raw = source.read_bytes()
    # La fuente de 2026 está codificada como ISO-8859-1.
    with source.open(encoding="latin-1", newline="") as stream:
        records = [{k.replace("\r\n", "\n").replace("\r", "\n") if k else k: v for k,v in row.items()} for row in csv.DictReader(stream, delimiter=";")]
    if not records:
        raise ValueError("No hay registros para procesar")
    month_counts = collections.Counter()
    codes = collections.Counter()
    ids = set()
    beyond = []
    for record in records:
        rid = str(record["ID"]).strip()
        if not rid or rid in ids:
            raise ValueError("ID vacío o duplicado")
        ids.add(rid)
        if str(record["CODIGO DE \nLA ENTIDAD"]).strip() != TARGET_ENTITY:
            raise ValueError("Entidad municipal ajena al conjunto esperado")
        if str(record["CODIGO \nUBIGEO INEI"]).strip() != CSV_UBIGEO:
            raise ValueError("UBIGEO municipal distinto del origen verificado")
        issued = datetime.strptime(record["FECHA DE EMISION"].strip(), "%d/%m/%Y")
        giro = str(record["GIRO"]).strip()
        if not giro.isdigit() or len(giro) != 4:
            raise ValueError("Giro no compatible con código numérico de cuatro dígitos")
        if issued.year == 2026 and issued.month in (4, 5, 6):
            month_counts[issued.strftime("%Y-%m")] += 1
            codes[giro] += 1
        else:
            beyond.append(issued.strftime("%Y-%m"))
    q2 = sum(month_counts.values())
    return {
        "version": "1.0",
        "municipio": "Municipalidad Provincial de La Convención",
        "codigo_entidad": TARGET_ENTITY,
        "ubicacion": {
            "departamento": "Cusco", "provincia": "La Convención",
            "distrito": "Santa Ana (Quillabamba)",
            "ubigeo_inei": NORMALIZED_INEI,
            "ubigeo_original_csv": CSV_UBIGEO,
            "nota_homologacion": "La columna del CSV señala INEI 070901, que corresponde al código RENIEC de Santa Ana. Se enlaza mediante INEI 080901; se conserva el valor original.",
        },
        "origen": {
            "archivo": "Licencias de Funcionamiento Segundo Trimestre 2026.csv",
            "sha256": hashlib.sha256(raw).hexdigest(),
            "url_publica": SOURCE_URL,
            "contenido": "Solo agregaciones: sin RUC, nombres ni identificadores individuales.",
        },
        "calidad": {
            "registros_originales": len(records),
            "registros_q2_2026": q2,
            "registros_fuera_de_periodo": len(beyond),
            "meses_fuera_periodo": dict(collections.Counter(beyond)),
            "giros_distintos_q2": len(codes),
            "ubicacion_puntual_disponible": False,
            "estado_actual_operacion_verificado": False,
            "clasificacion_de_giro_por_validar": True,
        },
        "q2_2026": {
            "por_mes": {m: month_counts.get(m, 0) for m in ("2026-04", "2026-05", "2026-06")},
            "por_codigo_giro": dict(codes.most_common()),
        },
        "advertencia": "La fecha de licencia no acredita apertura del negocio, actividad vigente, demanda ni elegibilidad de crédito.",
    }

def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("entrada", type=Path)
    parser.add_argument("salida", type=Path)
    args = parser.parse_args()
    result = summarize(args.entrada)
    args.salida.parent.mkdir(parents=True, exist_ok=True)
    args.salida.write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print("Agregación segura:", result["calidad"], result["ubicacion"]["ubigeo_inei"])

if __name__ == "__main__":
    main()
