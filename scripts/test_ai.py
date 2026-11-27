import sys,pathlib
sys.path.insert(0,str(pathlib.Path(__file__).resolve().parent))
import io,json,unittest
from serve_ai import analyze
class TestAI(unittest.TestCase):
    def test_response(self):
        def transport(req,timeout):
            self.assertEqual(req.full_url,"https://api.openai.com/v1/responses")
            self.assertEqual(req.get_header("Authorization"),"Bearer TEST")
            body=json.loads(req.data)
            self.assertFalse(body["store"])
            self.assertIn("Nuevos negocios",body["input"])
            return io.BytesIO(json.dumps({"model":"mock","output":[{"type":"message","content":[{"type":"output_text","text":"Ejemplo de prueba"}]}]}).encode())
        result=analyze({"data":{"module":"Nuevos negocios","mode":"demo","total":6},"question":"Qué investigar"},"TEST",transport)
        self.assertEqual(result["text"],"Ejemplo de prueba")
    def test_reject_individual(self):
        with self.assertRaises(ValueError):analyze({"data":{"module":"Nuevos negocios","mode":"demo","total":1,"focus":{"name":"Ficticio"}}},"TEST")
    def test_invalid(self):
        with self.assertRaises(ValueError):analyze({"data":{"module":"otro","mode":"demo","total":1}},"TEST")
if __name__=="__main__":unittest.main()
