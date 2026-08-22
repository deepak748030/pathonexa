import type { LabSettings, Report, ReportValue } from './api';

function escapeHtml(value: unknown) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function printableDate(value?: string) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : `${date.toLocaleDateString('en-GB')} ${date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`;
}

function groupValues(report: Report) {
  const groups = new Map<string, ReportValue[]>();
  (report.values || report.parameters || []).forEach((value) => {
    const group = value.group || value.test || 'Results';
    groups.set(group, [...(groups.get(group) || []), value]);
  });
  return [...groups].map(([title, values]) => ({ title, values }));
}

export function reportTextLines(report: Report, lab: LabSettings) {
  const lines = [
    lab.name || 'My Pathology Lab',
    [lab.address, lab.city].filter(Boolean).join(', '),
    [lab.phone, lab.email].filter(Boolean).join(' | '),
    '',
    report.test || 'PATHOLOGY REPORT',
    `Report ID: ${report.reportId}`,
    `Patient: ${report.patient?.name || '—'}`,
    `PID: ${report.patient?.pid || '—'}    Age/Gender: ${report.patient?.age ?? '—'} / ${report.patient?.gender || '—'}`,
    `Ref. Doctor: ${report.doctor || 'Direct'}`,
    `Sample: ${printableDate(report.sampleDate || report.createdAt)}`,
    `Reported: ${printableDate(report.reportDate || report.createdAt)}`,
    '',
  ];
  groupValues(report).forEach((group) => {
    lines.push(group.title.toUpperCase());
    lines.push('Test | Result | Unit | Reference Range');
    group.values.forEach((value) => lines.push(`${value.name} | ${value.value || '—'} | ${value.unit || '—'} | ${value.range || '—'}`));
    lines.push('');
  });
  lines.push(`Remarks: ${report.remarks || 'No remarks added.'}`);
  lines.push(`Verified by: ${report.verifiedBy || lab.pathologist || 'Pending verification'}`);
  lines.push('');
  lines.push(lab.footer || 'This is a computer generated report and does not require physical signature.');
  return lines.filter((line, index, all) => line !== '' || all[index - 1] !== '');
}

export function reportHtml(report: Report, lab: LabSettings) {
  const groupHtml = groupValues(report).map((group) => `
    <section>
      <h2>${escapeHtml(group.title)}</h2>
      <table>
        <thead><tr><th>Test Name</th><th>Result</th><th>Unit</th><th>Reference Range</th></tr></thead>
        <tbody>${group.values.map((value) => `<tr><td>${escapeHtml(value.name)}</td><td class="result">${escapeHtml(value.value || '—')}</td><td>${escapeHtml(value.unit || '—')}</td><td>${escapeHtml(value.range || '—')}</td></tr>`).join('')}</tbody>
      </table>
    </section>`).join('');
  return `<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(report.reportId)}</title><style>
    @page{size:A4;margin:14mm}*{box-sizing:border-box}body{font-family:Arial,sans-serif;color:#101d35;font-size:11px;margin:0}.head{display:flex;justify-content:space-between;border-bottom:2px solid #1467e8;padding-bottom:10px}.lab h1{color:#1467e8;font-size:21px;margin:0 0 4px}.muted{color:#66748e;line-height:1.5}.title{text-align:center;color:#1467e8;font-size:16px;letter-spacing:.8px;margin:18px 0 8px}.info{width:100%;border-collapse:collapse;margin:12px 0}.info td{width:50%;padding:6px;border:1px solid #e5e7eb}.label{color:#66748e;display:inline-block;width:36%}.value{font-weight:700}h2{font-size:12px;color:#1467e8;margin:14px 0 4px}table{width:100%;border-collapse:collapse;page-break-inside:auto}thead{display:table-header-group}tr{page-break-inside:avoid}th{background:#f1f5fb;color:#66748e;text-align:left}th,td{padding:6px;border-bottom:1px solid #eef2f6}.result{font-weight:700}.remarks{margin-top:15px}.signatures{display:flex;justify-content:space-between;text-align:center;margin-top:42px}.signature{width:35%;border-top:1px solid #66748e;padding-top:5px}.footer{text-align:center;color:#66748e;border-top:1px solid #eef2f6;padding-top:8px;margin-top:28px;font-size:9px}</style></head><body>
    <div class="head"><div class="lab"><h1>${escapeHtml(lab.name || 'My Pathology Lab')}</h1><div class="muted">${escapeHtml([lab.address, lab.city].filter(Boolean).join(', '))}<br>${escapeHtml([lab.phone, lab.altPhone].filter(Boolean).join(' / '))}<br>${escapeHtml(lab.email || '')}</div></div><div class="muted">Lab ID: ${escapeHtml(lab.labId || '—')}<br>Report ID: ${escapeHtml(report.reportId)}</div></div>
    <h1 class="title">${escapeHtml((report.test || 'Pathology Report').toUpperCase())}</h1>
    <table class="info"><tr><td><span class="label">Patient Name</span><span class="value">${escapeHtml(report.patient?.name || '—')}</span></td><td><span class="label">Ref. Doctor</span><span class="value">${escapeHtml(report.doctor || 'Direct')}</span></td></tr><tr><td><span class="label">PID</span><span class="value">${escapeHtml(report.patient?.pid || '—')}</span></td><td><span class="label">Lab No.</span><span class="value">${escapeHtml(report.reportId)}</span></td></tr><tr><td><span class="label">Age / Gender</span><span class="value">${escapeHtml(`${report.patient?.age ?? '—'} / ${report.patient?.gender || '—'}`)}</span></td><td><span class="label">Sample Date</span><span class="value">${escapeHtml(printableDate(report.sampleDate || report.createdAt))}</span></td></tr><tr><td><span class="label">Blood Group</span><span class="value">${escapeHtml(report.patient?.blood || '—')}</span></td><td><span class="label">Report Date</span><span class="value">${escapeHtml(printableDate(report.reportDate || report.createdAt))}</span></td></tr></table>
    ${groupHtml || '<p>No report values have been entered.</p>'}
    <div class="remarks"><strong>Remarks / Comments</strong><p>${escapeHtml(report.remarks || 'No remarks added.')}</p></div>
    <div class="signatures"><div class="signature"><strong>${escapeHtml(report.verifiedBy || lab.pathologist || 'Pending verification')}</strong><br><span class="muted">${report.verified ? 'Verified report' : 'Not yet verified'}</span></div><div class="signature"><strong>Lab Incharge</strong><br><span class="muted">${escapeHtml(lab.name || 'My Pathology Lab')}</span></div></div>
    <div class="footer">${escapeHtml(lab.footer || 'This is a computer generated report and does not require physical signature.')}</div>
  </body></html>`;
}

function pdfSafe(value: string) {
  return value
    .replace(/₹/g, 'Rs. ')
    .normalize('NFKD')
    .replace(/[^\x20-\x7E]/g, '?')
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)');
}

/** Creates a dependency-free, valid PDF for browser download/share. Native uses expo-print for full HTML rendering. */
export function reportPdfBlob(report: Report, lab: LabSettings) {
  const wrapped: string[] = [];
  reportTextLines(report, lab).forEach((line) => {
    const safe = pdfSafe(line);
    if (!safe) wrapped.push('');
    else for (let start = 0; start < safe.length; start += 94) wrapped.push(safe.slice(start, start + 94));
  });
  const pages = Array.from({ length: Math.max(1, Math.ceil(wrapped.length / 55)) }, (_, page) => wrapped.slice(page * 55, (page + 1) * 55));
  const pageObjectIds = pages.map((_, index) => 4 + index * 2);
  const objects: string[] = [];
  objects[1] = '<< /Type /Catalog /Pages 2 0 R >>';
  objects[2] = `<< /Type /Pages /Kids [${pageObjectIds.map((id) => `${id} 0 R`).join(' ')}] /Count ${pages.length} >>`;
  objects[3] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>';
  pages.forEach((lines, index) => {
    const pageId = pageObjectIds[index];
    const contentId = pageId + 1;
    const commands = `BT\n/F1 9 Tf\n12 TL\n40 800 Td\n${lines.map((line) => `(${line}) Tj T*`).join('\n')}\nET`;
    objects[pageId] = `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 3 0 R >> >> /Contents ${contentId} 0 R >>`;
    objects[contentId] = `<< /Length ${commands.length} >>\nstream\n${commands}\nendstream`;
  });
  let pdf = '%PDF-1.4\n';
  const offsets = [0];
  for (let id = 1; id < objects.length; id += 1) {
    offsets[id] = pdf.length;
    pdf += `${id} 0 obj\n${objects[id]}\nendobj\n`;
  }
  const xref = pdf.length;
  pdf += `xref\n0 ${objects.length}\n0000000000 65535 f \n`;
  for (let id = 1; id < objects.length; id += 1) pdf += `${String(offsets[id]).padStart(10, '0')} 00000 n \n`;
  pdf += `trailer\n<< /Size ${objects.length} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return new Blob([pdf], { type: 'application/pdf' });
}
