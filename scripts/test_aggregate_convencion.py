"""Test aislado del ETL agregado con registros totalmente sintéticos."""
import csv
from pathlib import Path
import sys
import tempfile
import unittest

ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT))
from aggregate_licencias_convencion import summarize

HEADERS = ["ID", "CODIGO DE \nLA ENTIDAD", "CODIGO \nUBIGEO INEI",
           "RUC COMERCIAL", "RAZON SOCIAL", "GIRO",
           "TIPO DE LICENCIA", "FECHA DE EMISION"]

class AggregatorTests(unittest.TestCase):
    def create_csv(self, directory):
        dest = Path(directory) / "fuente_sintetica.csv"
        with dest.open("w", encoding="latin-1", newline="") as stream:
            writer = csv.DictWriter(stream, delimiter=";", fieldnames=HEADERS)
            writer.writeheader()
            for i, giro, fecha in [(1,"5610","07/04/2026"),
                                    (2,"5630","10/06/2026"),
                                    (3,"4520","22/02/2024")]:
                writer.writerow({
                    "ID":str(i), "CODIGO DE \nLA ENTIDAD":"300748",
                    "CODIGO \nUBIGEO INEI":"070901",
                    "RUC COMERCIAL":"00000000000",
                    "RAZON SOCIAL":"NOMBRE DE PRUEBA PRIVADO",
                    "GIRO":giro,"TIPO DE LICENCIA":"Licencia de Funcionamiento",
                    "FECHA DE EMISION":fecha})
        return dest

    def test_safe_aggregation(self):
        with tempfile.TemporaryDirectory() as folder:
            result = summarize(self.create_csv(folder))
            self.assertEqual(result["ubicacion"]["ubigeo_inei"],"080901")
            self.assertEqual(result["ubicacion"]["ubigeo_original_csv"],"070901")
            self.assertEqual(result["calidad"]["registros_originales"],3)
            self.assertEqual(result["calidad"]["registros_q2_2026"],2)
            self.assertEqual(result["calidad"]["registros_fuera_de_periodo"],1)
            self.assertEqual(result["q2_2026"]["por_codigo_giro"],{"5610":1,"5630":1})
            data = repr(result)
            self.assertNotIn("00000000000",data)
            self.assertNotIn("NOMBRE DE PRUEBA PRIVADO",data)

    def test_rejects_unexpected_ubigeo(self):
        with tempfile.TemporaryDirectory() as folder:
            p = self.create_csv(folder)
            p.write_text(p.read_text(encoding="latin-1").replace("070901","070902"),
                         encoding="latin-1")
            with self.assertRaisesRegex(ValueError,"UBIGEO"):
                summarize(p)

if __name__=="__main__":
    unittest.main()
