"""Close only the isolated Firefox WebDriver test session."""
import json,urllib.request
from pathlib import Path
path=Path(__file__).resolve().parents[1]/'verification/firefox-session.json'
session=json.loads(path.read_text())
request=urllib.request.Request('http://127.0.0.1:4449/session/'+session['sessionId'],method='DELETE')
with urllib.request.urlopen(request) as response:json.load(response)
path.unlink()
print('Isolated Firefox session closed.')
