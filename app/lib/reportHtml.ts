/**
 * Professional report / receipt HTML used by expo-print (print + PDF export).
 *
 * Layout follows the specification:
 *   Header  → lab logo, name, address, contact, GST, QR
 *   Patient → name, age, gender, patient id, ref. doctor, dates
 *   Table   → parameter, result, unit, normal range, alert (H/L)
 *   Footer  → QR code, barcode, signatures, generated date, PAID/UNPAID stamp
 */
import { barcodeSvg, qrSvg, svgDataUri } from './qr';
import { groupParams, type ParamRow } from './testParams';
import { currentSettings, type LabSettings } from './settings';

export const esc = (s: any) =>
  String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const money = (n: any) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

export type ReportLike = {
  _id?: string;
  reportId?: string;
  patient?: any;
  doctor?: string;
  test?: string;
  date?: string;
  time?: string;
  sampleDate?: string;
  reportDate?: string;
  amount?: number;
  discount?: number;
  paidAmount?: number;
  pendingAmount?: number;
  paymentMode?: string;
  paid?: boolean;
  status?: string;
  technician?: string;
  verified?: boolean;
  verifiedBy?: string;
  remarks?: string;
  values?: ParamRow[];
};

/** Payload encoded in the report QR — scan to verify / open the report. */
export function verifyPayload(report: ReportLike, lab: LabSettings) {
  const id = report.reportId || report._id || '';
  return `https://pathonexa.in/verify/${encodeURIComponent(id)}?lab=${encodeURIComponent(lab.labId || '')}`;
}

export function buildReportHtml(report: ReportLike, rows: ParamRow[], settings?: LabSettings): string {
  const lab = settings || currentSettings();
  const patient = report.patient && typeof report.patient === 'object' ? report.patient : { name: report.patient };
  const reportId = report.reportId || '—';
  const groups = groupParams(rows);
  const paid = report.paid || Number(report.pendingAmount || 0) === 0;

  const tables = groups.map((g) => `
    <div class="grp">${esc(g.group)}</div>
    <table>
      <tr><th style="width:40%">Test Name</th><th>Result</th><th>Unit</th><th>Reference Range</th><th style="width:34px">Alert</th></tr>
      ${g.rows.map((c: any) => `
        <tr>
          <td${c.bold ? ' class="b"' : ''}>${esc(c.name)}${c.short ? ` <span class="mut">(${esc(c.short)})</span>` : ''}</td>
          <td class="res${c.flag ? ' flag' : ''}${c.highlight ? ' hl' : ''}">${esc(c.value)}</td>
          <td>${esc(c.unit)}</td>
          <td>${esc(c.range)}</td>
          <td class="alert ${c.flag === 'H' ? 'hi' : c.flag === 'L' ? 'lo' : ''}">${esc(c.flag || '')}</td>
        </tr>`).join('')}
    </table>`).join('');

  const qr = svgDataUri(qrSvg(verifyPayload(report, lab), 120));
  const barcode = svgDataUri(barcodeSvg(reportId, 220, 44));

  return `<!DOCTYPE html><html><head><meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>${esc(reportId)}</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: Arial, Helvetica, sans-serif; color:#0F172A; margin:24px; font-size:12px; }
  .head { display:flex; justify-content:space-between; align-items:flex-start; border-bottom:2px solid #1668E3; padding-bottom:10px; }
  .brand { font-size:22px; font-weight:800; color:#1668E3; letter-spacing:-0.4px; margin:0; }
  .brand small { display:block; font-size:9px; letter-spacing:2px; color:#64748B; font-weight:600; }
  .lab { text-align:right; font-size:10px; color:#475569; line-height:1.5; }
  .lab b { color:#0F172A; font-size:11px; }
  .qr { width:66px; height:66px; margin-left:12px; }
  .info { display:flex; flex-wrap:wrap; background:#F5F8FF; border:1px solid #E2E8F0; border-radius:8px; padding:10px 12px; margin:12px 0; }
  .cell { width:33.33%; padding:3px 0; font-size:10.5px; }
  .cell span { color:#64748B; display:inline-block; min-width:82px; }
  .cell b { color:#0F172A; }
  .title { text-align:center; font-size:13px; font-weight:800; letter-spacing:1px; color:#0E2A6B; margin:14px 0 6px; }
  .grp { font-size:11px; font-weight:700; color:#1668E3; margin:10px 0 4px; }
  table { width:100%; border-collapse:collapse; }
  th { background:#F1F5F9; text-align:left; padding:5px 8px; border:1px solid #E2E8F0; font-size:10px; color:#475569; }
  td { padding:5px 8px; border:1px solid #E2E8F0; font-size:10.5px; }
  td.b { font-weight:700; }
  td.res { font-weight:700; }
  td.res.hl { background:#FFF7ED; }
  td.alert { text-align:center; font-weight:800; }
  td.alert.hi { color:#EF4444; }
  td.alert.lo { color:#F59E0B; }
  .mut { color:#94A3B8; font-weight:400; }
  .remarks { margin-top:10px; font-size:10.5px; }
  .remarks b { display:block; color:#1668E3; margin-bottom:2px; }
  .bill { width:100%; margin-top:12px; border:1px solid #E2E8F0; border-radius:8px; padding:8px 12px; font-size:10.5px; background:#FAFCFF; }
  .bill span { color:#64748B; }
  .foot { margin-top:18px; display:flex; justify-content:space-between; align-items:flex-end; }
  .sign { text-align:center; font-size:10px; color:#475569; }
  .sign img { height:34px; display:block; margin:0 auto 2px; }
  .sign b { display:block; color:#0F172A; font-size:10.5px; }
  .stamp { border:2px solid ${paid ? '#16A34A' : '#EF4444'}; color:${paid ? '#16A34A' : '#EF4444'};
           font-weight:800; font-size:13px; letter-spacing:2px; padding:6px 14px; border-radius:6px;
           transform:rotate(-8deg); }
  .codes { display:flex; align-items:center; justify-content:space-between; margin-top:16px;
           border-top:1px dashed #CBD5E1; padding-top:10px; }
  .codes img { height:44px; }
  .note { text-align:center; color:#64748B; font-size:9.5px; margin-top:8px; line-height:1.5; }
</style></head>
<body>
  <div class="head">
    <div>
      <p class="brand">${esc(lab.name || 'PathoNexa')}<small>DIAGNOSTIC LABORATORY</small></p>
      <div style="font-size:10px;color:#64748B;margin-top:4px">Accurate Today, Healthy Tomorrow</div>
    </div>
    <div style="display:flex;align-items:flex-start">
      <div class="lab">
        <b>${esc(lab.shortName || lab.name)}</b><br/>
        ${esc(lab.address)}<br/>
        Ph: ${esc(lab.phone)}${lab.altPhone ? ` / ${esc(lab.altPhone)}` : ''}<br/>
        ${esc(lab.email)}${lab.gst ? `<br/>GSTIN: ${esc(lab.gst)}` : ''}
      </div>
      <img class="qr" src="${qr}" alt="QR"/>
    </div>
  </div>

  <div class="info">
    <div class="cell"><span>Patient Name</span> <b>${esc(patient?.name || '—')}</b></div>
    <div class="cell"><span>Ref. Doctor</span> <b>${esc(report.doctor || 'Direct')}</b></div>
    <div class="cell"><span>Report ID</span> <b>${esc(reportId)}</b></div>
    <div class="cell"><span>Patient ID</span> <b>${esc(patient?.pid || '—')}</b></div>
    <div class="cell"><span>Age / Gender</span> <b>${esc(patient?.age ?? '—')} Yrs / ${esc(patient?.gender || '—')}</b></div>
    <div class="cell"><span>Blood Group</span> <b>${esc(patient?.blood || '—')}</b></div>
    <div class="cell"><span>Sample Collected</span> <b>${esc(report.sampleDate || report.date || '—')}</b></div>
    <div class="cell"><span>Report Date</span> <b>${esc(report.reportDate || `${report.date || ''} ${report.time || ''}`)}</b></div>
    <div class="cell"><span>Technician</span> <b>${esc(report.technician || '—')}</b></div>
  </div>

  <div class="title">${esc(String(report.test || 'REPORT').toUpperCase())}</div>
  ${tables}

  ${report.remarks ? `<div class="remarks"><b>Remarks / Comments</b>${esc(report.remarks)}</div>` : ''}

  <div class="bill">
    <span>Invoice</span> <b>${money(report.amount)}</b> &nbsp;·&nbsp;
    <span>Discount</span> <b>${money(report.discount)}</b> &nbsp;·&nbsp;
    <span>Paid</span> <b>${money(report.paidAmount)}</b> &nbsp;·&nbsp;
    <span>Pending</span> <b>${money(report.pendingAmount)}</b> &nbsp;·&nbsp;
    <span>Mode</span> <b>${esc(report.paymentMode || 'Cash')}</b>
  </div>

  <div class="foot">
    <div class="sign">
      ${lab.signature ? `<img src="${esc(lab.signature)}"/>` : ''}
      <b>${esc(lab.pathologist || 'Consultant Pathologist')}</b>
      Verified By${report.verifiedBy ? ` · ${esc(report.verifiedBy)}` : ''}
    </div>
    <div class="stamp">${paid ? 'PAID' : 'UNPAID'}</div>
    <div class="sign">
      ${lab.stamp ? `<img src="${esc(lab.stamp)}"/>` : ''}
      <b>${esc(lab.shortName || lab.name)}</b>
      Authorised Signatory
    </div>
  </div>

  <div class="codes">
    <img src="${barcode}" alt="barcode"/>
    <div style="text-align:right;font-size:9.5px;color:#64748B">
      Generated: ${esc(new Date().toLocaleString('en-IN'))}<br/>
      Lab ID: ${esc(lab.labId || '—')}
    </div>
  </div>

  <div class="note">
    ${esc(lab.reportNote || '')}<br/>${esc(lab.footer || '')}
  </div>
</body></html>`;
}

/** Payment receipt (Receptionist workflow: payment entry → receipt print). */
export function buildReceiptHtml(txn: any, settings?: LabSettings): string {
  const lab = settings || currentSettings();
  const qr = svgDataUri(qrSvg(`${txn.txnId || ''}|${txn.amount || 0}|${lab.labId || ''}`, 100));
  return `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>Receipt ${esc(txn.txnId)}</title>
<style>
  body { font-family: Arial, Helvetica, sans-serif; margin:22px; color:#0F172A; font-size:12px; max-width:420px; }
  h1 { color:#1668E3; font-size:18px; margin:0; }
  .mut { color:#64748B; font-size:10px; }
  .row { display:flex; justify-content:space-between; padding:6px 0; border-bottom:1px dashed #E2E8F0; font-size:11.5px; }
  .row b { font-weight:700; }
  .total { background:#F1F5F9; padding:10px; border-radius:8px; margin-top:10px; display:flex; justify-content:space-between; font-size:14px; font-weight:800; }
  .foot { text-align:center; margin-top:14px; }
</style></head><body>
  <h1>${esc(lab.name)}</h1>
  <div class="mut">${esc(lab.address)}<br/>${esc(lab.phone)} · ${esc(lab.email)}${lab.gst ? ` · GSTIN ${esc(lab.gst)}` : ''}</div>
  <h2 style="font-size:13px;letter-spacing:1px;text-align:center;margin:14px 0 6px">PAYMENT RECEIPT</h2>
  <div class="row"><span>Receipt No.</span><b>${esc(txn.txnId || '—')}</b></div>
  <div class="row"><span>Date</span><b>${esc(txn.date || new Date().toLocaleDateString('en-GB'))} ${esc(txn.time || '')}</b></div>
  <div class="row"><span>Patient</span><b>${esc(txn.patient || '—')}</b></div>
  <div class="row"><span>Report ID</span><b>${esc(txn.reportId || '—')}</b></div>
  <div class="row"><span>Payment Mode</span><b>${esc(txn.mode || 'Cash')}</b></div>
  <div class="row"><span>Type</span><b>${esc(txn.type || 'Collection')}</b></div>
  ${txn.note ? `<div class="row"><span>Note</span><b>${esc(txn.note)}</b></div>` : ''}
  <div class="total"><span>Amount Received</span><span>${money(txn.amount)}</span></div>
  <div class="foot"><img src="${qr}" style="height:84px"/><div class="mut">${esc(lab.footer || '')}</div></div>
</body></html>`;
}

/** Monthly doctor commission statement (spec: Doctor Ledger → PDF export). */
export function buildLedgerHtml(ledger: any, settings?: LabSettings): string {
  const lab = settings || currentSettings();
  const d = ledger.doctor || {};
  return `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>Statement ${esc(d.name)}</title>
<style>
  body { font-family: Arial, Helvetica, sans-serif; margin:24px; color:#0F172A; font-size:12px; }
  h1 { color:#1668E3; font-size:18px; margin:0 0 2px; }
  .mut { color:#64748B; font-size:10px; }
  table { width:100%; border-collapse:collapse; margin-top:12px; }
  th { background:#F1F5F9; text-align:left; padding:6px 8px; border:1px solid #E2E8F0; font-size:10px; }
  td { padding:6px 8px; border:1px solid #E2E8F0; font-size:10.5px; }
  .cards { display:flex; gap:8px; margin-top:12px; }
  .card { flex:1; border:1px solid #E2E8F0; border-radius:8px; padding:8px 10px; }
  .card b { display:block; font-size:14px; margin-top:2px; }
</style></head><body>
  <h1>${esc(lab.name)}</h1>
  <div class="mut">${esc(lab.address)} · ${esc(lab.phone)}</div>
  <h2 style="font-size:14px;margin:14px 0 0">Doctor Commission Statement</h2>
  <div class="mut">${esc(d.name)} · ${esc(d.specialization || d.degree || '')} · Commission ${esc(d.commission || 0)}%</div>
  <div class="cards">
    <div class="card"><span class="mut">Total Reports</span><b>${esc(ledger.totalReports)}</b></div>
    <div class="card"><span class="mut">Business</span><b>${money(ledger.totalBusiness)}</b></div>
    <div class="card"><span class="mut">Commission</span><b>${money(ledger.totalCommission)}</b></div>
    <div class="card"><span class="mut">Paid</span><b>${money(ledger.paidCommission)}</b></div>
    <div class="card"><span class="mut">Pending</span><b>${money(ledger.pendingCommission)}</b></div>
  </div>
  <table>
    <tr><th>Month</th><th>Reports</th><th>Business</th><th>Commission</th></tr>
    ${(ledger.monthly || []).map((m: any) => `<tr><td>${esc(m.label)}</td><td>${esc(m.reports)}</td><td>${money(m.business)}</td><td>${money(m.commission)}</td></tr>`).join('')}
  </table>
  <table>
    <tr><th>Report ID</th><th>Patient</th><th>Test</th><th>Date</th><th>Amount</th><th>Commission</th></tr>
    ${(ledger.reports || []).map((r: any) => `<tr><td>${esc(r.reportId)}</td><td>${esc(r.patient)}</td><td>${esc(r.test)}</td><td>${esc(r.date)}</td><td>${money(r.amount)}</td><td>${money(r.commission)}</td></tr>`).join('')}
  </table>
  <p class="mut" style="margin-top:14px">Generated ${esc(new Date().toLocaleString('en-IN'))} · ${esc(lab.footer || '')}</p>
</body></html>`;
}
