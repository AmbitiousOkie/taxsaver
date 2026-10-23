/* Pure calculation engine: UI-independent, annual dollars, unrounded intermediate values. */
(function(root){
'use strict';
const R=root.TaxRules || require('./rules.js');
const n=v=>Number.isFinite(Number(v))?Number(v):0, pos=v=>Math.max(0,n(v));
const sum=(a,f=x=>x)=>a.reduce((s,x)=>s+n(f(x)),0), clone=x=>JSON.parse(JSON.stringify(x));
const phase=(m,start,width)=>Math.max(0,Math.min(1,(start+width-m)/width));
const money=x=>Math.round(x*100)/100;
function job(){return {label:'Main job',wages:0,bonus:0,plan:'401k',traditional:0,roth:0,government457:0,roth457:0,employerMatch:0,employer457:0,priorWages:0,has457:false,hasHsa:false,hasHealthFsa:false,hasDependentFsa:false,hsa:0,fsa:0,fsaType:'limited',dependentFsa:0,medical:0,dental:0,vision:0,insurancePretax:true,life:0,disability:0,other:0,imputed:0,businessReimbursement:0,taxableReimbursement:0,reimbursementExpenses:0,tuitionAssistance:0,loanAssistance:0,educationQualified:false,trsMember:false,trsEmployee:0,trsEmployer:0};}
function person(label='You'){return {label,age:35,blind:false,student:false,claimed:false,covered:false,jobs:[job()],interest:0,dividends:0,qualifiedDividends:0,shortGains:0,longGains:0,shortCarry:0,longCarry:0,taxExempt:0,investmentCashOverride:false,investmentCash:0,business:0,businessPlan:'none',soloEmployee:0,businessEmployer:0,businessInsurance:0,qbi:true,retirementCash:0,retirementTaxable:0,rothCash:0,conversion:0,socialBenefits:0,otherIncome:0,traditionalIra:0,rothIra:0,hsaCoverage:'none',hsaMonths:12,hsaDirect:0,hsaEmployer:0,medicareEnrolled:false,medicalExpenses:0,studentInterest:0,charity:0,tips:0,overtime:0,carInterest:0,specialEligible:false,saverEligible:false,recentDistributions:0,eitcEligible:false,creditIdentity:true,careExpenses:0,careEligible:false,separatedException:false,amtAdjustment:0,extraTax:0,nonrefCredit:0,refCredit:0,manualQbi:false,qbiOverride:0,unsupported:false,withholding:0,estimated:0,stateCash:0};}
function defaults(){return {schema:1,status:'joint',people:[person('You'),person('Spouse')],dependents:[],hohEligible:false,livedApart:false,communityProperty:false,allocationConfirmed:false,spouseItemizes:false,paymentsEntered:false,minMonthly:0,additionalBudget:10000,budgetEnabled:true,cashTargetSet:false};}
function demo(){const s=defaults();s.people[0].jobs[0].wages=110000;s.people[1].jobs[0].wages=70000;s.people[0].jobs[0].traditional=9000;s.people[1].jobs[0].traditional=5000;s.people[0].jobs[0].medical=4800;s.people[0].hsaCoverage='family';s.people[0].jobs[0].hsa=3000;s.people[0].jobs[0].hasHsa=true;s.people[0].hsaEmployer=1000;s.people[0].interest=600;s.minMonthly=9000;s.cashTargetSet=true;return s;}
function activePeople(s){return s.people.slice(0,['joint','separate'].includes(s.status)?2:1);}
function retirementLimit(p){return R.retirement+(p.age>=60&&p.age<=63?R.superCatchup:p.age>=50?R.catchup:0);}
function iraLimit(p){return R.ira+(p.age>=50?R.iraCatchup:0);}
function hsaLimit(p){return (R.hsa[p.hsaCoverage]+(p.hsaCoverage!=='none'&&p.age>=55?R.hsaCatchup:0))*Math.min(12,pos(p.hsaMonths))/12;}
function brackets(income,status){let low=0;return [...R.brackets[status],Infinity].map((high,i)=>{const dollars=Math.max(0,Math.min(income,high)-low),r={low,high,rate:R.rates[i],dollars,tax:dollars*R.rates[i]};low=high;return r;});}
function gainsTax(ordinary,gains,status){const [zero,fifteen]=R.gains[status];const free=Math.min(gains,Math.max(0,zero-ordinary)),mid=Math.min(gains-free,Math.max(0,fifteen-Math.max(zero,ordinary)));return {tax:mid*.15+(gains-free-mid)*.2,free,mid,top:gains-free-mid};}
function socialTaxable(benefits,other,status,livedApart){if(status==='separate'&&!livedApart)return benefits*.85;const lo=status==='joint'?32000:25000,hi=status==='joint'?44000:34000,provisional=other+benefits/2;return Math.min(benefits*.85,Math.max(0,provisional-hi)*.85+Math.min(benefits/2,(hi-lo)/2,Math.max(0,provisional-lo)/2));}
function normalize(raw){
 if(!raw||raw.schema!==1||!Object.hasOwn(R.brackets,raw.status)||!Array.isArray(raw.people)||raw.people.length!==2)throw Error('This is not a supported Tax Saver scenario.');
 const s=defaults();
 for(const k of Object.keys(s)){if(['people','dependents'].includes(k))continue;const v=raw[k];if(typeof s[k]==='boolean')s[k]=v===true;else if(typeof s[k]==='number'){if(v!==undefined&&(!Number.isFinite(v)||Math.abs(v)>1e9))throw Error('Invalid number in scenario.');if(v!==undefined)s[k]=v;}else if(typeof v==='string')s[k]=v;}
 s.people=raw.people.map((input,i)=>{const p=person(i?'Spouse':'You');for(const k of Object.keys(p)){if(k==='jobs')continue;const v=input[k];if(typeof p[k]==='number'){if(v!==undefined&&(!Number.isFinite(v)||Math.abs(v)>1e9))throw Error('Invalid income or contribution.');if(v!==undefined)p[k]=v;}else if(typeof p[k]==='boolean')p[k]=v===true;else if(typeof v==='string')p[k]=v.slice(0,100);}if(!Array.isArray(input.jobs)||input.jobs.length<1||input.jobs.length>10)throw Error('Use one to ten jobs per person.');p.jobs=input.jobs.map(x=>{const j=job();for(const k of Object.keys(j)){const v=x[k];if(typeof j[k]==='number'){if(v!==undefined&&(!Number.isFinite(v)||v<0||v>1e9))throw Error('Invalid job amount.');if(v!==undefined)j[k]=v;}else if(typeof j[k]==='boolean')j[k]=v===true;else if(typeof v==='string')j[k]=v.slice(0,100);}if(!['none','401k','403b','tsp'].includes(j.plan)||!['limited','general'].includes(j.fsaType))throw Error('Unknown workplace plan.');return j;});if(!['none','self','family'].includes(p.hsaCoverage)||!['none','sep','solo'].includes(p.businessPlan))throw Error('Unknown benefit plan.');return p;});
 if(!Array.isArray(raw.dependents)||raw.dependents.length>20)throw Error('Use at most 20 dependents.');
 s.dependents=raw.dependents.map(d=>({label:String(d.label||'Dependent').slice(0,100),age:pos(d.age),owner:d.owner===1?1:0,child:d.child===true,other:d.other===true,eitc:d.eitc===true,care:d.care===true}));return s;
}
function calculate(s){
 const people=activePeople(s),errors=[],warnings=[],issues=[];
 const error=t=>errors.push(t),warn=t=>warnings.push(t),issue=t=>issues.push(t);
 if(s.status==='head'&&!s.hohEligible)error('Confirm head-of-household eligibility before using this estimate.');
 if(s.status==='separate'&&s.spouseItemizes)issue('A spouse itemizes. Standard deductions are set to zero; this version cannot calculate the itemizing return.');
 if(s.status==='separate'&&s.communityProperty)issue(s.allocationConfirmed?'Community-property income allocation is confirmed, but separate actual payroll-wage and deduction allocation still needs review; the estimate remains provisional.':'Community-property income must be allocated between returns. Confirm the entered allocation; payroll-tax allocation also needs separate review.');
 if(s.minMonthly<0||s.additionalBudget<0)error('Planning budgets cannot be negative.');
 if(s.dependents.some(d=>d.owner>=people.length||d.age<0||d.age>120||(!['joint','separate'].includes(s.status)&&d.owner!==0)))error('Check dependent age and assigned taxpayer.');
 s.dependents.forEach(d=>{if(d.child&&d.age>=17)error(`${d.label}: child tax credit requires a qualifying child under 17.`);if(d.child&&d.other)error(`${d.label}: choose child credit or other-dependent credit, not both.`);});
 const rows=people.map((p,i)=>{
 const label=p.label||`Taxpayer ${i+1}`;
 if(p.age<18||p.age>120)issue(`${label}: adult dependents/minors and ages outside 18–120 require a separate calculation.`);
 for(const [k,v] of Object.entries(p))if(typeof v==='number'&&(!Number.isFinite(v)||v<0&&!['business','shortGains','longGains','investmentCash','amtAdjustment'].includes(k)))error(`${label}: ${k} cannot be negative or invalid.`);
 if(p.claimed)issue(`${label}: a taxpayer claimed on another return has special deduction and credit rules outside this model.`);
 if(p.unsupported)issue(`${label}: specialized tax circumstances selected; the displayed subtotal excludes unentered adjustments.`);
 if(p.jobs.some(j=>j.plan==='403b')&&p.businessEmployer>0)issue(`${label}: 403(b) and controlled-business plan annual-additions coordination needs review.`);
 if(p.business<0)issue(`${label}: business loss limitations and carryovers need review; automatic QBI and suggestions are disabled.`);
 if(p.amtAdjustment||p.extraTax||p.nonrefCredit||p.refCredit||p.manualQbi)issue(`${label}: manual adjustments are held fixed; contribution recommendations are disabled.`);
 let wages=0,payrollExcluded=0,traditional=0,retirement=0,costs=0,hsa=pos(p.hsaDirect),ficaWages=0,employeeSS=0,employeeMedicare=0,ssWithheld=0,dc=0,imputed=0,pretaxWork=0;
 const jtotal=k=>sum(p.jobs,j=>j[k]);
 const trsEmployee=jtotal('trsEmployee'),trsEmployer=jtotal('trsEmployer');
 const educationTotal=jtotal('tuitionAssistance')+jtotal('loanAssistance'),qualifiedEducation=sum(p.jobs,j=>j.educationQualified?pos(j.tuitionAssistance)+pos(j.loanAssistance):0),educationExcluded=Math.min(R.educationAssistance,qualifiedEducation),educationTaxable=educationTotal-educationExcluded;
 const businessReimbursement=jtotal('businessReimbursement'),taxableReimbursement=jtotal('taxableReimbursement'),reimbursementExpenses=jtotal('reimbursementExpenses');
 if(businessReimbursement>reimbursementExpenses)warn(`${label}: tax-free business reimbursements exceed entered cash expenses. Confirm accountable-plan/per-diem eligibility and enter expenses so spendable cash is not overstated.`);
 if(educationTotal)warn(`${label}: education assistance is employer-paid support, not additional spendable cash. Do not include these payments again in wages, bonuses or taxable fringe benefits. Student loan interest reimbursed tax-free by the employer cannot also be deducted.`);
 if(educationTaxable)warn(`${label}: $${money(educationTaxable).toLocaleString('en-US')} of education assistance is taxable. Working-condition education exceptions require a reviewed adjustment.`);
 for(const j of p.jobs){
 for(const [key,value] of Object.entries(j))if(typeof value==='number'&&(!Number.isFinite(value)||value<0))error(`${label}, ${j.label}: ${key} must be a nonnegative number.`);
 const gross=pos(j.wages)+pos(j.bonus),health=pos(j.medical)+pos(j.dental)+pos(j.vision),excl=pos(j.hsa)+pos(j.fsa)+pos(j.dependentFsa)+(j.insurancePretax?health:0),trad=pos(j.traditional)+pos(j.government457),ret=trad+pos(j.roth)+pos(j.roth457)+pos(j.trsEmployee);
 if(excl+ret+health*(j.insurancePretax?0:1)+pos(j.life)+pos(j.disability)+pos(j.other)>gross)error(`${label}, ${j.label}: payroll elections exceed gross pay.`);
 if(!j.trsMember&&(j.trsEmployee||j.trsEmployer))error(`${label}, ${j.label}: confirm Oklahoma TRS participation for pension contributions.`);
 if(j.plan==='none'&&(j.traditional||j.roth))error(`${label}: select an available workplace plan before contributing.`);
 if(j.fsa>R.fsa)error(`${label}: health FSA exceeds the $3,400 limit per employer.`);
 if(j.fsa>p.medicalExpenses)warn(`${label}: FSA funding exceeds entered eligible health expenses; unused funds may be forfeited.`);
 if(j.priorWages>R.rothCatchupWages&&(j.traditional>R.retirement||j.government457>R.retirement))error(`${label}: catch-up amounts at this employer must be Roth because 2025 wages exceeded $150,000.`);
 const education=pos(j.tuitionAssistance)+pos(j.loanAssistance),educationExempt=j.educationQualified&&qualifiedEducation?education*educationExcluded/qualifiedEducation:0,educationTax=education-educationExempt;
 const fw=Math.max(0,gross+pos(j.imputed)+pos(j.taxableReimbursement)+educationTax-excl);
 ssWithheld+=Math.min(R.ssCap,fw)*R.ssRate;wages+=gross+pos(j.taxableReimbursement);payrollExcluded+=excl;traditional+=trad+pos(j.trsEmployee);pretaxWork+=pos(j.traditional);retirement+=ret;costs+=health+pos(j.life)+pos(j.disability)+pos(j.other)+pos(j.fsa)+pos(j.dependentFsa);hsa+=pos(j.hsa);dc+=pos(j.dependentFsa);imputed+=pos(j.imputed)+educationTax;ficaWages+=fw;
 if(j.traditional+j.roth+j.employerMatch>Math.min(gross,R.totalPlan+Math.min(retirementLimit(p)-R.retirement,Math.max(0,j.traditional+j.roth-R.retirement))))error(`${label}: workplace employee/employer additions exceed the plan limit.`);
 }
 costs+=reimbursementExpenses;
 employeeSS=Math.min(R.ssCap,ficaWages)*R.ssRate;employeeMedicare=ficaWages*R.medicareRate;
 if(jtotal('traditional')+jtotal('roth')+pos(p.soloEmployee)>retirementLimit(p))error(`${label}: combined workplace/solo employee contributions exceed the age-based limit.`);
 if(jtotal('government457')+jtotal('roth457')+jtotal('employer457')>Math.min(retirementLimit(p),wages))error(`${label}: governmental 457(b) contributions exceed the separate age-based limit.`);
 if(p.hsaMonths<0||p.hsaMonths>12)error(`${label}: HSA eligible months must be 0–12.`);
 if(hsa+pos(p.hsaEmployer)>hsaLimit(p)+.01)error(`${label}: combined employee/employer HSA funding exceeds eligible coverage limits.`);
 if(p.medicareEnrolled&&(hsa||p.hsaEmployer))error(`${label}: do not include HSA contributions for Medicare-enrolled months; clear the flag only when the entered eligible months exclude all Medicare months.`);
 if((hsa||p.hsaEmployer)&&people.some(a=>a.jobs.some(j=>j.fsaType==='general'&&j.fsa>0)))error(`${label}: a general-purpose health FSA can disqualify HSA contributions, including spousal coverage.`);
 const seBase=pos(p.business)*.9235, seSS=seBase>=400?Math.min(seBase,Math.max(0,R.ssCap-ficaWages))*.124:0,seMed=seBase>=400?seBase*.029:0,seTax=seSS+seMed,halfSE=seTax/2;
 const netBiz=Math.max(0,p.business-halfSE),empMax=Math.min(R.totalPlan,netBiz*.2);
 if(p.businessPlan==='none'&&(p.soloEmployee||p.businessEmployer))error(`${label}: select a business retirement plan.`);
 if(p.businessPlan==='sep'&&p.soloEmployee)error(`${label}: SEP IRA does not have an employee elective deferral.`);
 if(p.businessEmployer>empMax+.01||p.businessEmployer+p.soloEmployee>Math.min(netBiz,R.totalPlan+Math.min(retirementLimit(p)-R.retirement,Math.max(0,p.soloEmployee+sum(p.jobs,j=>j.traditional+j.roth)-R.retirement)))+.01)error(`${label}: self-employed plan funding exceeds the calculated profit or contribution limit.`);
 if(p.soloEmployee>netBiz)error(`${label}: solo employee deferral exceeds available net earnings.`);
 const bizRet=pos(p.soloEmployee)+pos(p.businessEmployer),bizInsurance=Math.min(pos(p.businessInsurance),Math.max(0,netBiz-bizRet));
 if(p.businessInsurance>bizInsurance)warn(`${label}: self-employed health insurance deduction is limited by business earnings.`);
 retirement+=bizRet+pos(p.traditionalIra)+pos(p.rothIra);costs+=pos(p.businessInsurance)+pos(p.studentInterest)+pos(p.charity)+pos(p.carInterest)+pos(p.stateCash);
 if(p.traditionalIra+p.rothIra>iraLimit(p))error(`${label}: combined traditional/Roth IRA contributions exceed the age-based limit.`);
 if(p.qualifiedDividends>p.dividends)error(`${label}: qualified dividends must be part of total ordinary dividends.`);
 if(p.retirementTaxable>p.retirementCash)error(`${label}: taxable distributions cannot exceed gross pension/traditional distributions.`);
 if(p.retirementCash&&p.age<60)issue(`${label}: retirement distributions before age 59½ may carry additional tax; enter any applicable additional tax and verify exceptions.`);
 const short=n(p.shortGains)-pos(p.shortCarry),long=n(p.longGains)-pos(p.longCarry);
 const income=wages+imputed-payrollExcluded-traditional+n(p.business)+pos(p.interest)+pos(p.dividends)+pos(p.retirementTaxable)+pos(p.conversion)+pos(p.otherIncome);
 const gainCash=p.investmentCashOverride?n(p.investmentCash):n(p.shortGains)+n(p.longGains);
 const cash=wages+businessReimbursement+n(p.business)+pos(p.interest)+pos(p.dividends)+pos(p.taxExempt)+gainCash+pos(p.retirementCash)+pos(p.rothCash)+pos(p.socialBenefits)+pos(p.otherIncome);
 if((p.shortGains||p.longGains)&&!p.investmentCashOverride)warn(`${label}: cash flow uses realized gains/losses; enter investment cash separately to include returned principal.`);
 const earned=Math.max(0,wages+imputed-payrollExcluded-traditional+p.business-halfSE),compensation=Math.max(0,earned-bizRet);
 if(p.socialBenefits&&(p.studentInterest||p.traditionalIra))issue(`${label}: Social Security with IRA/student-interest deductions requires the coordinated IRS worksheet; amounts are provisional.`);
 return {p,i,label,trsEmployee,trsEmployer,educationTotal,educationExcluded,educationTaxable,businessReimbursement,taxableReimbursement,reimbursementExpenses,wages,imputed,payrollExcluded,traditional,retirement,costs,hsa,ficaWages,employeeSS,employeeMedicare,ssWithheld,dc,seBase,seTax,halfSE,bizRet,bizInsurance,income,cash,short,long,earned,compensation,covered:p.covered||p.jobs.some(j=>j.trsMember||pos(j.trsEmployee)+pos(j.trsEmployer)>0)||p.jobs.some(j=>j.traditional+j.roth+j.government457+j.roth457+j.employerMatch+j.employer457>0)||bizRet>0};
 });
 if(people.length===2&&people.some(p=>p.hsaCoverage==='family')){const baseMax=Math.max(...people.map(p=>R.hsa[p.hsaCoverage]*p.hsaMonths/12)),catchups=sum(people,p=>p.age>=55&&p.hsaCoverage!=='none'?1000*p.hsaMonths/12:0);if(sum(rows,r=>r.hsa+r.p.hsaEmployer)>baseMax+catchups+.01)error('Spouses share the family HSA base limit; catch-up funding must go into each eligible spouse’s own HSA.');if(people[0].hsaMonths!==people[1].hsaMonths&&sum(rows,r=>r.hsa)>0)issue('Different spousal HSA eligibility periods need month-by-month family-limit allocation.');}
 if(sum(rows,r=>r.dc)>(s.status==='separate'?7500:R.dependentFsa))error('Household dependent-care FSA contributions exceed the shared limit.');
 const groups=s.status==='separate'?rows.map(r=>[r]):[rows];
 const returns=groups.map(group=>{
 const status=s.status,label=status==='separate'?group[0].label:status==='joint'?'Joint return':'Your return',idx=group[0].i;
 const deps=s.dependents.filter(d=>status==='joint'||d.owner===idx),total=k=>sum(group,r=>r[k]),pv=k=>sum(group,r=>r.p[k]);
 const st=total('short'),lt=total('long'),netGain=st+lt,capitalIncome=netGain<0?Math.max(netGain,status==='separate'?-1500:-3000):netGain,preferred=Math.max(0,Math.min(lt,netGain))+pv('qualifiedDividends');
 const lossCarry=Math.max(0,-netGain+(capitalIncome<0?capitalIncome:0));
 const base=total('income')+capitalIncome-total('halfSE')-total('bizRet')-total('bizInsurance')-pv('hsaDirect');
 const benefits=pv('socialBenefits'),ssBeforeIra=socialTaxable(benefits,base+pv('taxExempt'),status,s.livedApart);
 let iraDeduction=0;
 group.forEach(r=>{
 const p=r.p,other=rows.find(x=>x.i!==r.i),magi=base+ssBeforeIra;
 let factor=1;
 if(r.covered){factor=status==='joint'?phase(magi,129000,20000):status==='separate'&&!s.livedApart?phase(magi,0,10000):phase(magi,81000,10000);}
 else if(other&&other.covered){factor=status==='joint'?phase(magi,242000,10000):status==='separate'&&!s.livedApart?phase(magi,0,10000):1;}
 const ceiling=factor===1?iraLimit(p):factor===0?0:Math.max(200,Math.ceil(iraLimit(p)*factor/10)*10);
 r.iraDeduction=Math.min(pos(p.traditionalIra),ceiling);iraDeduction+=r.iraDeduction;
 const compensation=status==='joint'?Math.max(0,total('compensation')):r.compensation;
 if(p.traditionalIra+p.rothIra>compensation)error(`${r.label}: IRA contributions exceed eligible earned compensation.`);
 });
 if(status==='joint'&&pv('traditionalIra')+pv('rothIra')>total('compensation'))error('Combined spousal IRA contributions exceed eligible household compensation.');
 const studentMagi=base+ssBeforeIra-iraDeduction,studentDeduction=status==='separate'?0:Math.min(2500,pv('studentInterest'))*phase(studentMagi,status==='joint'?175000:85000,status==='joint'?30000:15000);
 const ssTaxable=socialTaxable(benefits,base-iraDeduction-studentDeduction+pv('taxExempt'),status,s.livedApart),agi=base-iraDeduction-studentDeduction+ssTaxable;
 // IRA MAGI adds back student interest and the IRA deduction; Roth conversion is excluded for Roth eligibility.
 group.forEach(r=>{const m=agi+iraDeduction+studentDeduction-pv('conversion'),f=status==='joint'?phase(m,242000,10000):status==='separate'&&!s.livedApart?phase(m,0,10000):phase(m,153000,15000),cap=f===1?iraLimit(r.p):f===0?0:Math.max(200,Math.ceil(iraLimit(r.p)*f/10)*10);r.rothLimit=Math.max(0,Math.min(cap,iraLimit(r.p)-r.p.traditionalIra));if(r.p.rothIra>r.rothLimit+.01)error(`${r.label}: Roth IRA contribution exceeds the income-based limit ($${Math.floor(r.rothLimit).toLocaleString('en-US')}).`);});
 let standard=R.standard[status]+sum(group,r=>((r.p.age>=65?1:0)+(r.p.blind?1:0))*(['joint','separate'].includes(status)?1650:2050));
 if(status==='separate'&&s.spouseItemizes)standard=0;
 const senior=status==='separate'?0:sum(group,r=>r.p.age>=65?Math.max(0,6000-Math.max(0,agi-(status==='joint'?150000:75000))*.06):0);
 const eligible=group.filter(r=>r.p.specialEligible),specialMagi=agi,step=Math.ceil(Math.max(0,specialMagi-(status==='joint'?300000:150000))/1000);
 const tips=status==='separate'?0:Math.max(0,Math.min(25000,sum(eligible,r=>r.p.tips))-step*100);
 const overtime=status==='separate'?0:Math.max(0,Math.min(status==='joint'?25000:12500,sum(eligible,r=>r.p.overtime))-step*100);
 const car=status==='separate'?0:Math.max(0,Math.min(10000,sum(eligible,r=>r.p.carInterest))-Math.ceil(Math.max(0,agi-(status==='joint'?200000:100000))/1000)*200);
 group.forEach(r=>{if((r.p.tips||r.p.overtime||r.p.carInterest)&&!r.p.specialEligible)error(`${r.label}: confirm eligibility for the entered special deductions.`);if(r.p.tips+r.p.overtime>r.wages+pos(r.p.business))error(`${r.label}: qualifying tips/overtime must already be included in earned income.`);});
 const charity=Math.min(pv('charity'),status==='joint'?2000:1000),special=senior+tips+overtime+car+charity;
 const preQbi=Math.max(0,agi-standard-special),qbiBase=sum(group,r=>r.p.qbi?Math.max(0,r.p.business-r.halfSE-r.bizRet-r.bizInsurance):0),qbiThreshold=status==='joint'?403500:status==='separate'?201775:201750;
 let qbi=Math.min(qbiBase*.2,Math.max(0,preQbi-preferred)*.2);
 if(qbiBase>=1000)qbi=Math.max(qbi,400); // 2026 minimum for active qualified business income.
 qbi=Math.min(preQbi,qbi);
 if(qbiBase&&preQbi>qbiThreshold&&!group.every(r=>r.p.business<=0||r.p.manualQbi)){issue(`${label}: QBI exceeds the simple-method income threshold; provisional QBI deduction is zero until a reviewed override is entered.`);qbi=0;}
 if(group.some(r=>r.p.manualQbi))qbi=Math.min(preQbi,pv('qbiOverride'));
 const taxable=Math.max(0,preQbi-qbi),prefTaxable=Math.min(taxable,preferred),ordinary=Math.max(0,taxable-prefTaxable),bands=brackets(ordinary,status),ordinaryTax=sum(bands,b=>b.tax),capital=gainsTax(ordinary,prefTaxable,status);
 capital.tax=Math.min(capital.tax,Math.max(0,sum(brackets(taxable,status),b=>b.tax)-ordinaryTax));
 const regular=ordinaryTax+capital.tax;
 // Simplified AMT for supported income, with explicit optional preference adjustment.
 let amti=Math.max(0,agi-special+senior-qbi+pv('amtAdjustment'));
 if(status==='separate')amti+=Math.min(70100,Math.max(0,amti-640200)*.5);
 const [exempt,start]=R.amt[status],amtExemption=Math.max(0,exempt-Math.max(0,amti-start)*.5),amtBase=Math.max(0,amti-amtExemption),amtPref=Math.min(amtBase,preferred),amtOrd=amtBase-amtPref,amtBreak=status==='separate'?122250:244500;
 const tentative=Math.min(Math.min(amtOrd,amtBreak)*.26+Math.max(0,amtOrd-amtBreak)*.28+gainsTax(ordinary,amtPref,status).tax,Math.min(amtBase,amtBreak)*.26+Math.max(0,amtBase-amtBreak)*.28),amt=Math.max(0,tentative-regular);
 const dc=total('dc'),carePeople=deps.filter(d=>d.care).length,careExpenses=pv('careExpenses'),earnedLimit=status==='joint'?Math.min(...group.map(r=>r.earned)):group[0].earned;
 if(dc>(status==='separate'?3750:7500)||dc>careExpenses||dc>earnedLimit||dc&&(!carePeople||!group.some(r=>r.p.careEligible)))error(`${label}: dependent-care FSA requires qualifying care, expenses, and sufficient earnings for both spouses when applicable.`);
 const careAllowed=status!=='separate'||group[0].p.separatedException;
 const careRate=Math.max(.2,Math.max(.35,.5-Math.ceil(Math.max(0,agi-15000)/2000)*.01)-Math.ceil(Math.max(0,agi-(status==='joint'?150000:75000))/(status==='joint'?4000:2000))*.01);
 const care=careAllowed&&carePeople&&group.some(r=>r.p.careEligible)?Math.max(0,Math.min(careExpenses-dc,Math.min(2,carePeople)*3000-dc,earnedLimit-dc))*careRate:0;
 const saverThresholds=status==='joint'?[48500,52500,80500]:status==='head'?[36375,39375,60375]:[24250,26250,40250],saverRate=agi<=saverThresholds[0]?.5:agi<=saverThresholds[1]?.2:agi<=saverThresholds[2]?.1:0;
 const saver=sum(group,r=>r.p.saverEligible&&!r.p.student&&!r.p.claimed&&r.p.age>=18?Math.min(2000,Math.max(0,r.retirement-r.trsEmployee-r.p.businessEmployer-r.p.recentDistributions))*saverRate:0);
 let remaining=regular+amt,careUsed=Math.min(remaining,care);remaining-=careUsed;const saverUsed=Math.min(remaining,saver);remaining-=saverUsed;
 const identity=group.every(r=>r.p.creditIdentity),children=identity?deps.filter(d=>d.child&&d.age<17).length:0,others=deps.filter(d=>d.other).length,ctcRaw=children*R.childCredit+others*500,ctc=Math.max(0,ctcRaw-Math.ceil(Math.max(0,agi-(status==='joint'?400000:200000))/1000)*50),childUsed=Math.min(remaining,ctc);remaining-=childUsed;
 const manualUsed=Math.min(remaining,pv('nonrefCredit'));remaining-=manualUsed;
 const earned=total('earned');
 const eitcChildren=Math.min(3,deps.filter(d=>d.eitc).length),investment=Math.max(0,pv('interest')+pv('taxExempt')+pv('dividends')+Math.max(0,netGain)),eitcAge=eitcChildren>0||group.some(r=>r.p.age>=25&&r.p.age<65),eitcAllowed=group.every(r=>r.p.eitcEligible&&!r.p.claimed)&&(status!=='separate'||group[0].p.separatedException)&&eitcAge&&investment<=R.eitc.investment;
 const eitc=eitcAllowed?Math.max(0,Math.min(R.eitc.max[eitcChildren],earned*R.eitc.inRate[eitcChildren])-Math.max(0,Math.max(earned,agi)-(status==='joint'?R.eitc.jointStart[eitcChildren]:R.eitc.start[eitcChildren]))*R.eitc.outRate[eitcChildren]):0;
 const additionalMedicare=Math.max(0,total('ficaWages')+sum(group,r=>r.seBase>=400?r.seBase:0)-R.medicareThreshold[status])*.009;
 const niit=Math.min(Math.max(0,pv('interest')+pv('dividends')+capitalIncome),Math.max(0,agi-R.medicareThreshold[status]))*.038;
 const payrollAlternative=Math.max(0,total('employeeSS')+total('employeeMedicare')+total('halfSE')+additionalMedicare-eitc);
 const refundableChild=Math.min(Math.max(0,ctc-childUsed),children*1700,Math.max(Math.max(0,earned-2500)*.15,children>=3?payrollAlternative:0));
 const refundable=refundableChild+eitc+pv('refCredit'),netIncomeTax=remaining-refundable,ss=total('employeeSS'),medicare=total('employeeMedicare'),selfEmployment=total('seTax'),extra=pv('extraTax'),tax=netIncomeTax+ss+medicare+selfEmployment+additionalMedicare+niit+extra;
 const cash=total('cash'),retirement=total('retirement'),hsa=total('hsa'),costs=total('costs'),takeHome=cash-retirement-hsa-costs-tax,payments=pv('withholding')+pv('estimated'),settlement=payments-(netIncomeTax+selfEmployment+additionalMedicare+niit+extra)+Math.max(0,total('ssWithheld')-ss);
 return {label,status,trsEmployee:total('trsEmployee'),trsEmployer:total('trsEmployer'),educationTotal:total('educationTotal'),educationExcluded:total('educationExcluded'),educationTaxable:total('educationTaxable'),businessReimbursement:total('businessReimbursement'),taxableReimbursement:total('taxableReimbursement'),reimbursementExpenses:total('reimbursementExpenses'),agi,standard,special,senior,tips,overtime,car,charity,iraDeduction,studentDeduction,ssTaxable,lossCarry,qbi,taxable,ordinary,prefTaxable,bands,ordinaryTax,capitalTax:capital.tax,capital,regular,amt,care:careUsed,saver:saverUsed,childCredit:childUsed,manualCredit:manualUsed,refundableChild,eitc,refundable,netIncomeTax,ss,medicare,selfEmployment,additionalMedicare,niit,extra,tax,cash,retirement,hsa,costs,takeHome,payments,settlement,noncash:total('imputed')+pv('conversion'),adjustments:total('halfSE')+total('bizRet')+total('bizInsurance')+pv('hsaDirect')+iraDeduction+studentDeduction,seniorCount:group.filter(r=>r.p.age>=65).length};
 });
 const aggregate={};for(const k of ['trsEmployee','trsEmployer','educationTotal','educationExcluded','educationTaxable','businessReimbursement','taxableReimbursement','reimbursementExpenses','agi','standard','special','taxable','ordinaryTax','capitalTax','amt','care','saver','childCredit','refundable','netIncomeTax','ss','medicare','selfEmployment','additionalMedicare','niit','extra','tax','cash','retirement','hsa','costs','takeHome','payments','settlement','qbi','adjustments','noncash','iraDeduction','studentDeduction','ssTaxable','lossCarry'])aggregate[k]=sum(returns,r=>r[k]);
 return {...aggregate,returns,people:rows,errors:[...new Set(errors)],warnings:[...new Set(warnings)],issues:[...new Set(issues)],valid:errors.length===0,complete:errors.length===0&&issues.length===0};
}
function candidates(s){const a=[];activePeople(s).forEach((p,i)=>{p.jobs.forEach((j,k)=>{if(j.plan!=='none')a.push({path:['people',i,'jobs',k,'traditional'],name:`${p.label} · traditional ${j.plan==='tsp'?'TSP':j.plan==='403b'?'403(b)':'401(k)'}`,max:Math.max(j.traditional,retirementLimit(p)-sum(p.jobs,x=>x.traditional+x.roth)+j.traditional-p.soloEmployee),step:100});if(j.has457||j.government457||j.roth457)a.push({path:['people',i,'jobs',k,'government457'],name:`${p.label} · governmental 457(b)`,max:retirementLimit(p)-sum(p.jobs,x=>x.government457+x.roth457+x.employer457)+j.government457,step:100});if(p.hsaCoverage!=='none'&&!p.medicareEnrolled&&k===0&&(j.hasHsa||j.hsa))a.push({path:['people',i,'jobs',k,'hsa'],name:`${p.label} · payroll HSA`,max:Math.max(j.hsa,hsaLimit(p)-p.hsaEmployer-p.hsaDirect-sum(p.jobs,x=>x.hsa)+j.hsa),step:50});if((j.hasHealthFsa||j.fsa)&&p.medicalExpenses>j.fsa)a.push({path:['people',i,'jobs',k,'fsa'],name:`${p.label} · health FSA`,max:Math.min(R.fsa,p.medicalExpenses),step:50});if((j.hasDependentFsa||j.dependentFsa)&&p.careEligible&&p.careExpenses>j.dependentFsa)a.push({path:['people',i,'jobs',k,'dependentFsa'],name:`${p.label} · dependent-care FSA`,max:Math.min(s.status==='separate'?3750:7500,p.careExpenses),step:50});});if(p.hsaCoverage!=='none'&&!p.medicareEnrolled&&!p.jobs.some(j=>j.hasHsa||j.hsa))a.push({path:['people',i,'hsaDirect'],name:`${p.label} · direct HSA`,max:Math.max(p.hsaDirect,hsaLimit(p)-p.hsaEmployer-sum(p.jobs,j=>j.hsa)),step:50});a.push({path:['people',i,'traditionalIra'],name:`${p.label} · traditional IRA`,max:iraLimit(p)-p.rothIra,step:100});if(p.businessPlan!=='none')a.push({path:['people',i,'businessEmployer'],name:`${p.label} · ${p.businessPlan==='solo'?'solo 401(k) employer':'SEP IRA'}`,max:Math.min(R.totalPlan,Math.max(0,p.business)*.2),step:100});});return a;}
function get(s,path){return path.reduce((v,k)=>v[k],s);}function set(s,path,v){let o=s;for(const k of path.slice(0,-1))o=o[k];o[path.at(-1)]=v;}
function suggest(s){
 const base=calculate(s);if(!base.complete)return {blocked:true,reason:'Resolve invalid inputs and cases needing review before using contribution suggestions.',options:[]};
 const original=clone(s),work=clone(s),options=[],eligible=candidates(s);let current=base;
 const feasible=r=>r.complete&&(!s.cashTargetSet||r.takeHome/12>=s.minMonthly-.005)&&(!s.budgetEnabled||r.retirement+r.hsa+r.costs-(base.retirement+base.hsa+base.costs)<=s.additionalBudget+.005);
 // Greedy coordinate search with full-return recalculation. Refine the best sampled amount to $10.
 for(let round=0;round<8;round++){
 let best=null;
 for(const c of eligible){const start=get(work,c.path),room=Math.max(0,c.max-start);if(room<1)continue;const vals=new Set([c.max]);const step=Math.max(c.step,Math.ceil(room/40/50)*50);for(let v=start+step;v<c.max;v+=step)vals.add(v);
 // Also test budget/cash boundary; this avoids rejecting a feasible partial contribution.
 let lo=start,hi=c.max;for(let k=0;k<18;k++){const m=(lo+hi)/2,t=clone(work);set(t,c.path,m);const r=calculate(t);if(feasible(r))lo=m;else hi=m;}vals.add(Math.floor(lo));vals.add(Math.round(lo));
 let local=null;for(const v of vals){if(v<=start)continue;const t=clone(work);set(t,c.path,v);const r=calculate(t),saved=current.tax-r.tax;if(feasible(r)&&saved>.5&&(!local||saved>local.saved)){local={c,value:v,saved,r,state:t};}}
 if(local){const center=local.value;for(let v=Math.max(start+1,center-step);v<=Math.min(c.max,center+step);v+=10){const t=clone(work);set(t,c.path,v);const r=calculate(t),saved=current.tax-r.tax;if(feasible(r)&&saved>local.saved+.01)local={c,value:v,saved,r,state:t};}if(!best||local.saved/(local.value-start)>best.saved/(best.value-get(work,best.c.path))+.00001)best=local;}
 }
 if(!best)break;set(work,best.c.path,best.value);current=best.r;
 }
 for(const c of eligible){const before=get(original,c.path),after=get(work,c.path);if(after>before+.01){const alone=clone(original);set(alone,c.path,after);const ar=calculate(alone);options.push({name:c.name,path:c.path,before,after,added:after-before,standaloneSaving:base.tax-ar.tax,standaloneCashReduction:base.takeHome-ar.takeHome});}}
 return {blocked:false,options,scenario:work,result:current,saved:base.tax-current.tax,added:current.retirement+current.hsa+current.costs-base.retirement-base.hsa-base.costs,cashReduction:base.takeHome-current.takeHome};
}
const api={R,defaults,demo,person,job,calculate,normalize,activePeople,retirementLimit,iraLimit,hsaLimit,brackets,gainsTax,socialTaxable,suggest,clone,money};root.TaxEngine=api;if(typeof module!=='undefined')module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this);
