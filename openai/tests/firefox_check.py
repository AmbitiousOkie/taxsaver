"""Firefox/GeckoDriver smoke checks against the offline file, using W3C WebDriver."""
import base64,json,time,urllib.request,subprocess,os
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'verification'
SESSION=json.loads((OUT/'firefox-session.json').read_text())
BASE='http://127.0.0.1:4449/session/'+SESSION['sessionId']
def call(method,path,data=None):
    req=urllib.request.Request(BASE+path,data=json.dumps(data).encode() if data is not None else None,method=method,headers={'Content-Type':'application/json'})
    with urllib.request.urlopen(req,timeout=30) as response: return json.load(response)['value']
def js(script,*args):return call('POST','/execute/sync',{'script':script,'args':list(args)})
def element(selector):return call('POST','/element',{'using':'css selector','value':selector})['element-6066-11e4-a52e-4f735466cecf']
def click(selector):call('POST','/element/'+element(selector)+'/click',{})
def shot(name,selector=None):
    time.sleep(.35)
    endpoint='/element/'+element(selector)+'/screenshot' if selector else '/screenshot'
    (OUT/name).write_bytes(base64.b64decode(call('GET',endpoint)))
def viewport(width,height):
    call('POST','/window/rect',{'width':max(width,500),'height':height})
    subprocess.run([os.environ.get('NODE_BINARY','node'),str(ROOT/'tests/firefox_viewport.mjs'),str(width),str(height)],check=True)
if __name__=='__main__':
    viewport(1440,1100)
    call('POST','/url',{'url':(ROOT/'index.html').as_uri()})
    assert js('return typeof TaxSaver')=='object'
    assert js('return document.querySelectorAll(".treemap-tile").length')==4
    shot('firefox-desktop.png')
    shot('firefox-treemap.png','.results')
    print(json.dumps(js('return {width:innerWidth,height:innerHeight,overflow:document.documentElement.scrollWidth>innerWidth,tax:TaxSaver.results().tax}')))
    js('window.browserErrors=[]; addEventListener("error",e=>browserErrors.push(e.message)); addEventListener("unhandledrejection",e=>browserErrors.push(String(e.reason)))')
    click('[data-allocation="1"]')
    assert 'Federal taxes' in js('return document.querySelector("#chart-detail").textContent')
    click('[data-chart="doughnut"]')
    assert js('return !!document.querySelector(".donut svg")')
    js('document.querySelector(".results").scrollIntoView()')
    shot('firefox-doughnut.png')
    click('[data-chart="treemap"]')
    js('document.querySelector(".results").scrollIntoView()')
    shot('firefox-treemap.png')
    before=js('return JSON.stringify(TaxSaver.snapshot())')
    click('#monthly')
    assert '$10,696' in js('return document.querySelector(".treemap-color-0").textContent')
    assert before==js('return JSON.stringify(TaxSaver.snapshot())')
    click('#annual')
    click('[data-tab="income"]')
    field=element('#f-people-0-jobs-0-wages')
    call('POST','/element/'+field+'/clear',{})
    call('POST','/element/'+field+'/value',{'text':'120000'})
    assert js('return TaxSaver.snapshot().people[0].jobs[0].wages')==120000
    assert js('return Number(document.querySelector(".treemap-color-0").dataset.annualValue)===TaxSaver.results().takeHome')
    click('[data-tab="benefits"]')
    slider=element('input[type="range"][data-path="people.0.jobs.0.traditional"]')
    call('POST','/element/'+slider+'/value',{'text':'\ue014'})
    assert js('return Number(document.querySelector("#f-people-0-jobs-0-traditional").value)===TaxSaver.snapshot().people[0].jobs[0].traditional')
    # Exercise employer payments as separate additions to salary.
    for key,value in [('businessReimbursement',2000),('reimbursementExpenses',2000),('tuitionAssistance',3000),('loanAssistance',4000)]:
        js('const el=document.querySelector(arguments[0]); el.closest("details").open=true', '#f-people-0-jobs-0-'+key)
        field=element('#f-people-0-jobs-0-'+key)
        call('POST','/element/'+field+'/clear',{})
        call('POST','/element/'+field+'/value',{'text':str(value)})
    click('[data-path="people.0.jobs.0.educationQualified"]')
    assert js('return TaxSaver.results().educationExcluded')==5250
    assert js('return TaxSaver.results().educationTaxable')==1750
    assert js('return TaxSaver.results().cash')==192600
    js('document.querySelector("#f-people-0-jobs-0-businessReimbursement").closest("details").scrollIntoView()')
    shot('firefox-employer-benefits.png')
    viewport(390,844)
    js('document.querySelector("#f-people-0-jobs-0-businessReimbursement").closest("details").scrollIntoView()')
    shot('firefox-mobile-employer-benefits.png')
    assert not js('return document.documentElement.scrollWidth>innerWidth')
    viewport(1440,1100)
    js('const d=[...document.querySelectorAll("#results details")].find(d=>d.querySelector("summary").textContent==="Employer assistance & reimbursements");d.open=true;d.scrollIntoView()')
    shot('firefox-employer-results.png')
    # Oklahoma TRS is a pension, separate from supplemental workplace plans.
    pre_trs=js('return {tax:TaxSaver.results().tax,ss:TaxSaver.results().ss,medicare:TaxSaver.results().medicare}')
    js('document.querySelector("[data-action=estimate-trs]").closest("details").open=true')
    click('[data-action="estimate-trs"][data-person="0"]')
    assert js('return TaxSaver.snapshot().people[0].jobs[0].trsEmployee')==8400
    assert js('return TaxSaver.snapshot().people[0].jobs[0].trsMember')
    assert js('return TaxSaver.results().tax')<pre_trs['tax']
    assert js('return TaxSaver.results().ss')==pre_trs['ss']
    assert js('return TaxSaver.results().medicare')==pre_trs['medicare']
    field=element('#f-people-0-jobs-0-trsEmployer')
    call('POST','/element/'+field+'/clear',{})
    call('POST','/element/'+field+'/value',{'text':'11400'})
    js('const s=document.querySelector("#f-people-0-jobs-0-plan");s.value="403b";s.dispatchEvent(new Event("change",{bubbles:true}))')
    js('document.querySelector("#f-people-0-jobs-0-government457").closest("details").open=true')
    click('[data-path="people.0.jobs.0.has457"]')
    field=element('#f-people-0-jobs-0-government457')
    call('POST','/element/'+field+'/clear',{})
    call('POST','/element/'+field+'/value',{'text':'3000'})
    assert js('return TaxSaver.results().complete')
    assert js('return TaxSaver.results().trsEmployer')==11400
    js('document.querySelector("#f-people-0-jobs-0-trsEmployee").closest("details").scrollIntoView()')
    shot('firefox-trs.png')
    viewport(390,844)
    js('document.querySelector("#f-people-0-jobs-0-trsEmployee").closest("details").scrollIntoView()')
    shot('firefox-mobile-trs.png')
    assert not js('return document.documentElement.scrollWidth>innerWidth')
    viewport(1440,1100)
    js('const d=[...document.querySelectorAll("#results details")].find(d=>d.querySelector("summary").textContent==="Oklahoma TRS pension summary");d.open=true;d.scrollIntoView()')
    shot('firefox-trs-results.png')
    click('[data-tab="planning"]')
    click('[data-action="suggest"]')
    time.sleep(.3)
    assert js('return !!document.querySelector("[data-action=apply]")')
    before_suggestions=js('return TaxSaver.results().tax')
    click('[data-action="apply"]')
    assert js('return TaxSaver.results().tax')<before_suggestions
    click('[data-action="undo"]')
    assert js('return TaxSaver.results().tax')==before_suggestions
    downloads=OUT/'firefox-downloads'
    previous=set(downloads.glob('*')) if downloads.exists() else set()
    (OUT/'firefox-expected-export.json').write_text(json.dumps(js('return TaxSaver.sheets()')))
    click('#save')
    click('#export')
    for attempt in range(40):
        plans=[p for p in downloads.glob('*.json') if p not in previous]; books=[p for p in downloads.glob('*.xlsx') if p not in previous]
        if plans and books:break
        time.sleep(.1)
    assert plans and books,'Real browser downloads did not complete'
    saved=json.loads(plans[-1].read_text());assert saved['scenario']['people'][0]['jobs'][0]['wages']==120000
    assert books[-1].read_bytes().startswith(b'PK')
    call('POST','/element/'+element('#file')+'/value',{'text':str(plans[-1])})
    time.sleep(.2)
    assert js('return document.querySelector("#toast").textContent')=='Plan opened.'
    assert js('return TaxSaver.snapshot().people[0].jobs[0].wages')==120000
    assert js('return TaxSaver.results().educationTaxable')==1750
    assert js('return TaxSaver.results().trsEmployee')==8400
    assert js('return TaxSaver.results().trsEmployer')==11400
    assert js('return TaxSaver.snapshot().people[0].jobs[0].government457')==3000
    click('[data-tab="household"]')
    js('const s=document.querySelector("#f-status"); s.value="separate"; s.dispatchEvent(new Event("change",{bubbles:true}))')
    assert js('return TaxSaver.results().returns.length')==2
    assert js('return browserErrors')==[]
    # Reload the example for reproducible viewport screenshots.
    call('POST','/refresh',{})
    viewport(390,844)
    js('scrollTo(0,0)')
    shot('firefox-mobile-top.png')
    assert not js('return document.documentElement.scrollWidth>innerWidth')
    js('document.querySelector(".results").scrollIntoView()')
    shot('firefox-mobile-treemap.png')
    assert js('return document.querySelectorAll(".treemap-tile").length')==4
    click('[data-allocation="3"]')
    assert 'Benefits' in js('return document.querySelector("#chart-detail").textContent')
    click('[data-chart="doughnut"]')
    shot('firefox-mobile-doughnut.png')
    click('[data-chart="treemap"]')
    assert not js('return document.documentElement.scrollWidth>innerWidth')
    report={'browser':SESSION['capabilities']['browserVersion'],'driver':SESSION['capabilities']['moz:geckodriverVersion'],'desktopWidth':1440,'mobileViewport':js('return {width:innerWidth,height:innerHeight}'),'checks':['file:// startup','treemap default and selection','doughnut toggle','annual/monthly values','gross input with real keystrokes','contribution slider keyboard interaction','suggest/apply/undo','employer reimbursement and education inputs','shared education exclusion and cash treatment','employer-benefit desktop/mobile screenshots','JSON download and file-input import','XLSX download','MFS two returns','desktop/mobile no horizontal overflow'],'downloads':[p.name for p in plans+books]}
    report['checks'] += ['TRS 7% salary estimate and payroll tax treatment','TRS alongside 403(b) and governmental 457(b)','TRS employer funding and JSON restoration','TRS desktop/mobile screenshots']
    (OUT/'firefox-results.json').write_text(json.dumps(report,indent=2)+'\n')
    print(json.dumps(report))
