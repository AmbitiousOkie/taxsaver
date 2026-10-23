# Tax Saver · 2026

A private, offline household federal tax planner written in plain JavaScript.

## Open the app

Double-click `index.html` in this folder, or open it from your browser's File menu. Keep `styles.css`, `rules.js`, `engine.js`, `xlsx.js`, `charts.js`, and `app.js` beside it. No installation, server, account, or internet connection is needed. The same files are packaged in `Tax-Saver-2026.zip` for copying to another computer.

An **example household** is loaded initially. Choose **start blank** or replace the example numbers. All inputs are annual, except the explicitly labeled minimum monthly cash target. The Year/Month switch changes displayed results, not the inputs.

1. **Household:** choose a filing status, ages, dependents, and relevant credit eligibility.
2. **Income:** enter expected gross wages, bonuses, investments, net business profit, or retirement income. Add jobs as needed.
3. **Benefits:** enter contributions and payroll costs. Mark benefits actually offered by your employer. Expand optional sections for IRAs, HSA eligibility, insurance, other deductions, or reviewed adjustments.
4. **Plan:** save a baseline, choose your cash target and additional contribution budget, and find contribution opportunities. Review the proposed tax and cash effects before applying. Undo is available.

**Save plan** downloads a JSON file containing both the current scenario and baseline. **Open plan** restores it. **Export Excel** creates a seven-sheet XLSX snapshot with inputs, tax results, brackets, comparison, assumptions, and sources. It contains values, not formulas. **Remember on this browser** is optional; a local save is the more reliable backup for a local-file app.

The results panel opens with an area-proportional **Treemap**. Switch to **Doughnut** above the chart. Select a treemap block to see its amount and income share. Both views update as you edit inputs and switch between Year and Month. Small blocks keep their true proportions; the legend always shows every amount.

## What the results mean

- **Cash income:** the cash amounts entered, including nontaxable distributions where entered. Roth conversions and noncash taxable fringe benefits do not inflate cash.
- **Federal taxes:** estimated annual federal liability, after modeled credits. Includes income tax, employee Social Security and Medicare, self-employment tax, Additional Medicare Tax, NIIT, and modeled AMT.
- **Retirement & HSA:** your contributions. Employer contributions appear separately and are not deducted from your cash.
- **Spendable cash:** cash income less federal liability, contributions, and selected costs. It is not actual paycheck cash, and does not subtract all living expenses. The entered dependent-care expenses establish tax eligibility; only the FSA contribution is deducted in the allocation chart.
- **Bracket chart:** the taxable dollars in each ordinary income bracket and the tax on those dollars. Preferential investment tax is listed separately. Deductions are not cash expenses.
- **Refund/balance:** shown only if you elect to enter federal income-tax withholding and estimated payments. Include additional Medicare withholding in that input, but exclude regular employee FICA. Estimated excess Social Security withholding across jobs is included as a credit.

The suggestions recalculate the whole modeled return and respect eligibility, contribution limits, the cash floor, and the contribution budget. They show the best combination evaluated, not a mathematical guarantee of a global optimum. Standalone savings from different suggestions are not additive. Pretax contributions can create taxes on future withdrawals; Roth accounts may be useful even without a current deduction. FSA suggestions are limited by entered eligible expenses.

## Supported scope and limitations

Supports single, joint, separate, and head-of-household returns; configurable children/dependents; standard and age/blindness deductions; ordinary and preferential investment income; simple sole-proprietor income and QBI below the simplified-method threshold; taxable retirement distributions and Social Security; common retirement/HSA/FSA contributions; relevant nonitemizer deductions; and child, care, earned-income and saver credits based on confirmed eligibility.

Contributions include traditional/Roth 401(k), 403(b), TSP, governmental 457(b), Oklahoma TRS pension contributions, traditional/Roth IRAs, SEP IRA and solo 401(k). Plan limits, catch-up amounts, Roth catch-up requirements, employer funding, IRA phaseouts, HSA eligibility, and shared family limits are checked. The default supplemental workplace plan is 401(k); change it to **No 401(k), 403(b) or TSP** when appropriate, including when TRS is your only retirement plan.

This is a planning estimator, not tax preparation software. It uses continuous brackets rather than IRS tax-table lookup rounding. Complex situations produce a visible review notice and disable suggestions rather than silently appear complete:

- Itemized deductions, including the special MFS restriction when a spouse itemizes.
- Community-property allocation even when the entered income has been allocated: actual payroll wages and contribution allocation need separate review.
- High-income QBI limitations, rental/passive losses, partnerships/S corporations, foreign income, unusual capital gains, stock-option AMT preferences, special early distributions, and specialized credits.
- Coordinated Social Security/IRA/student-interest worksheets, differing spousal HSA eligibility periods.
- Plan-specific 403(b)/457 service catch-ups, SIMPLE and nonqualified executive deferred compensation, controlled-employer annual-additions coordination, and additional plan restrictions.

Use **Special cases & reviewed adjustments** for externally calculated amounts. These fixed adjustments make recommendations unreliable, so recommendations are disabled. State/local taxes are not calculated, though an optional cash outflow can be entered. Eligibility checkboxes are assertions by the household; the app does not collect identity documents or prove eligibility.

## Business reimbursements and employer education support

Open **Benefits > Business reimbursements & education assistance** under each job. Enter these employer payments separately from salary, bonuses, taxable fringe benefits and other income so they are counted once.

- **Tax-free business reimbursements:** qualifying accountable-plan payments are added to cash but excluded from income-tax and payroll-tax wages. Confirm business purpose, documentation, return of excess advances and any per-diem/mileage rules with your employer.
- **Taxable business allowances / reimbursements:** added to cash and taxable wages, including Social Security and Medicare wages.
- **Business expenses you paid:** actual related employee cash expenses reduce spendable cash only. They are not treated as an employee business-expense tax deduction. Do not enter employer-paid bills or duplicate expenses elsewhere. Reimbursements above entered cash expenses produce a reminder, since qualifying per-diem/mileage reimbursements can differ from cash spending.
- **Employer tuition / education assistance and student-loan assistance:** share a $5,250 annual Section 127 exclusion per employee across jobs. Each spouse has a separate limit. Check the qualified-plan box only after confirming eligibility. Excess or unqualified amounts increase taxable wages and payroll taxes.
- Education assistance is shown as employer support outside cash income: direct payments to schools/lenders and reimbursements offset by the education costs they repay do not add spendable cash. Their taxable portion can reduce take-home cash through higher tax. This is a net planning view, not a bank-transaction ledger.
- Exclude tax-free employer-reimbursed interest from the student-loan interest deduction input. Specialized working-condition education exclusions and education-credit coordination require separate review. Employer benefits are held fixed during contribution suggestions.

These fields and their calculated totals are included in saved plans and Excel snapshots. Older plans load with zero amounts. The existing **Clear all data** button resets them too. Rules: [IRS Publication 15-B](https://www.irs.gov/publications/p15b) and [IRS Publication 463](https://www.irs.gov/publications/p463).

## Oklahoma TRS pension and supplemental savings

Open **Benefits > Oklahoma TRS pension (401(a))** under the teacher's job and confirm participation.

- Enter the TRS contribution actually deducted from your pay. **Estimate 7% of entered salary** fills a starting amount from annual salary, excluding the separate bonus input. It does not update automatically when salary changes. Actual pensionable compensation, state credits and employer-paid member contributions can change your payroll deduction; use your expected calendar-year payroll amount.
- Enter gross salary before the TRS deduction, not W-2 Box 1 wages. Your pretax TRS deduction reduces federal taxable income and spendable cash, but does not reduce Social Security or Medicare wages.
- Enter employer-paid TRS separately, only for funding outside your gross cash salary. This can include a school-paid member share. It is informational and creates no second personal deduction or cash expense. If the school pays your entire member share, your employee deduction is zero. Do not also enter the same employer funding as a workplace match.
- Choose 403(b), 401(k), or TSP separately if offered. The **457(b) deferred compensation & employer details** section supports traditional and Roth governmental 457(b) contributions. Traditional 457(b) contributions reduce current federal taxable income; Roth contributions do not. TRS does not consume either supplemental employee deferral limit.
- TRS participation counts as employer pension coverage when determining IRA deductibility. Mandatory TRS contributions do not qualify for the saver's credit and are held fixed when the app suggests additional contributions.

TRS amounts appear in saved plans, Excel snapshots and the pension summary. Your payroll contribution is included in the retirement allocation; employer funding stays outside the cash chart. Older saved plans default to no TRS participation and zero amounts. **Clear all data** resets these inputs too.

This models the pension's federal tax and cash effects, not future pension benefits, service purchases or refunds. It assumes entered employment wages are covered by Social Security and Medicare; special public-employee payroll-tax exemptions are outside the model. Oklahoma state income tax is not calculated. Sources are linked in the app's assumptions panel.

## Privacy and portability

There are no analytics, remote fonts, runtime libraries, uploads, or network requests. Source links open online only if clicked. The app starts in memory; saving to browser storage is opt-in. Saved files and browser storage are not encrypted. Clear all data removes the current scenario and saved browser data; downloaded files remain under your control.

All application and development files are inside `openai`. `PLAN.md` in the parent folder is the pre-existing plan and was not modified. The Excel writer is a small local snapshot-only OOXML writer, avoiding a runtime dependency entirely.

## Development and checks

The application has no build step. Calculation logic lives in `engine.js`; 2026 constants and sources live in `rules.js`; the interface is in `app.js`; treemap layout is in `charts.js`; the snapshot-only ZIP/OOXML exporter is `xlsx.js`.

With Node.js 22+ and Bun available:

```sh
bun install --frozen-lockfile
npm test
```

The engine-only checks do not need dependencies:

```sh
node --test tests/engine.test.cjs
```

The DOM tests use a pinned development-only `happy-dom` package and write a sample XLSX and expected cell values into `verification`. An independent export check uses Python with `openpyxl`:

```sh
python3 tests/verify_export.py
```

See `verification/REPORT.md` for results and screenshots. Firefox 158.0 with GeckoDriver 0.37.1 was used for browser checks at 1440 x 1100 and 390 x 844 content viewports, including local-file startup, chart interactions, contribution suggestions, JSON save/open, and XLSX downloads. The phone-sized check uses desktop Firefox with a constrained viewport, not a physical phone.

To repeat browser checks, install Firefox, GeckoDriver, Node.js 22+, and Python 3. From this folder, start GeckoDriver in a separate terminal:

```sh
geckodriver --port 4449 --host 127.0.0.1 --profile-root "$PWD/verification"
```

Then run:

```sh
python3 tests/firefox_start.py
python3 tests/firefox_check.py
python3 tests/firefox_stop.py
```

Optional environment variables: `FIREFOX_BINARY` selects Firefox; `NODE_BINARY` selects Node. If a pending Firefox update prevents startup, prefix the GeckoDriver command with `MOZ_DISABLE_UPDATE_PROCESSING=1` for that test process. Tests use a separate profile and example data. Screenshots and downloads stay in `verification`. Stop GeckoDriver after closing the test session.
