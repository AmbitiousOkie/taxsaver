/* Federal tax year 2026. Final IRS inflation tables; no network access at runtime. */
(function (root) {
'use strict';
const rules = {
 year: 2026, version: '2026.2', verified: '2026-10-22',
 rates: [.10,.12,.22,.24,.32,.35,.37],
 brackets: {single:[12400,50400,105700,201775,256225,640600],joint:[24800,100800,211400,403550,512450,768700],separate:[12400,50400,105700,201775,256225,384350],head:[17700,67450,105700,201750,256200,640600]},
 standard:{single:16100,joint:32200,separate:16100,head:24150},
 gains:{single:[49450,545500],joint:[98900,613700],separate:[49450,306850],head:[66200,579600]},
 medicareThreshold:{single:200000,joint:250000,separate:125000,head:200000},
 ssCap:184500, ssRate:.062, medicareRate:.0145,
 retirement:24500, catchup:8000, superCatchup:11250, rothCatchupWages:150000, totalPlan:72000,
 ira:7500, iraCatchup:1100, hsa:{self:4400,family:8750,none:0}, hsaCatchup:1000, fsa:3400,
 trsMemberRate:.07, educationAssistance:5250, dependentFsa:7500, childCredit:2200, refundableChild:1700, otherDependentCredit:500,
 amt:{single:[90100,500000],joint:[140200,1000000],separate:[70100,500000],head:[90100,500000]},
 eitc:{max:[664,4427,7316,8231],inRate:[.0765,.34,.40,.45],outRate:[.0765,.1598,.2106,.2106],start:[10860,23890,23890,23890],jointStart:[18140,31160,31160,31160],investment:12200},
 sources:[
 ['Oklahoma TRS member contributions and 401(a) pension','https://www.oklahoma.gov/content/dam/ok/en/trs/documents/memberhandbook/2025.Member.Handbook.pdf'],
 ['Oklahoma TRS employer manual and pretax contributions','https://oklahoma.gov/content/dam/ok/en/trs/documents/FINAL_FY2025_Employer_Manual__1_.pdf'],
 ['Government pension pick-up contributions and payroll taxes','https://www.irs.gov/government-entities/federal-state-local-governments/employer-pick-up-contributions-to-benefit-plans'],
 ['Eligible voluntary contributions for the saver credit','https://www.irs.gov/retirement-plans/plan-participant-employee/retirement-savings-contributions-credit-savers-credit'],
 ['2026 brackets, deductions, credits, AMT and gains','https://www.irs.gov/irb/2025-45_IRB'],
 ['2026 retirement limits and IRA phaseouts','https://www.irs.gov/newsroom/401k-limit-increases-to-24500-for-2026-ira-limit-increases-to-7500'],
 ['Retirement COLA details (Notice 2025-67)','https://www.irs.gov/pub/irs-drop/n-25-67.pdf'],
 ['Business expense reimbursements and accountable plans','https://www.irs.gov/publications/p463'],
 ['2026 payroll benefits, education assistance, HSA and FSA','https://www.irs.gov/publications/p15b'],
 ['2026 estimated tax worksheets','https://www.irs.gov/publications/p505'],
 ['Social Security wage base','https://www.ssa.gov/OACT/cola/cbb.html'],
 ['Self-employment tax','https://www.irs.gov/taxtopics/tc554'],
 ['Additional Medicare Tax','https://www.irs.gov/businesses/small-businesses-self-employed/questions-and-answers-for-the-additional-medicare-tax'],
 ['Net Investment Income Tax','https://www.irs.gov/taxtopics/tc559'],
 ['2026 dependent care credit','https://www.irs.gov/credits-deductions/individuals/child-and-dependent-care-credit-information'],
 ['New deductions available without itemizing','https://www.irs.gov/newsroom/new-and-enhanced-deductions-for-individuals'],
 ['Qualified business income deduction','https://www.irs.gov/newsroom/qualified-business-income-deduction'],
 ['Social Security benefit taxation','https://www.irs.gov/publications/p915'],
 ['IRA deduction worksheets','https://www.irs.gov/publications/p590a']
 ]
};
root.TaxRules=rules;
if(typeof module!=='undefined') module.exports=rules;
})(typeof globalThis!=='undefined'?globalThis:this);
