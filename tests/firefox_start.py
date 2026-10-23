"""Create an isolated session on a running GeckoDriver at localhost:4449."""
import json,os,urllib.request
from pathlib import Path
root=Path(__file__).resolve().parents[1]
options={'args':['-headless'],'prefs':{'app.update.disabledForTesting':True,'browser.download.folderList':2,'browser.download.dir':str(root/'verification/firefox-downloads'),'browser.helperApps.neverAsk.saveToDisk':'application/json,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'}}
if os.environ.get('FIREFOX_BINARY'):options['binary']=os.environ['FIREFOX_BINARY']
body={'capabilities':{'alwaysMatch':{'browserName':'firefox','webSocketUrl':True,'moz:firefoxOptions':options}}}
request=urllib.request.Request('http://127.0.0.1:4449/session',data=json.dumps(body).encode(),headers={'Content-Type':'application/json'})
with urllib.request.urlopen(request) as response:session=json.load(response)['value']
(root/'verification/firefox-session.json').write_text(json.dumps(session))
print('Firefox '+session['capabilities']['browserVersion']+' ready.')
