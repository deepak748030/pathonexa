const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const ts = require('typescript');

function loadReportDocument() {
  const source = fs.readFileSync(path.join(__dirname, '../src/reportDocument.ts'), 'utf8');
  const javascript = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const module = { exports: {} };
  // The module only imports TypeScript types, so no runtime project imports are needed.
  new Function('exports', 'module', 'require', 'Blob', javascript)(module.exports, module, require, Blob);
  return module.exports;
}

const report = {
  _id: 'report-1',
  reportId: 'RP260821001',
  test: 'Complete Blood Count',
  amount: 500,
  status: 'Completed',
  patient: {
    _id: 'patient-1',
    pid: 'PT260821001',
    name: 'A <Patient>',
    age: 32,
    gender: 'Female',
  },
  values: [{ name: 'Hemoglobin', value: '14.2', unit: 'g/dL', range: '12-16' }],
};

const settings = {
  name: 'PathoNexa & Lab',
  address: 'Indore, Madhya Pradesh',
  phone: '+91 98765 43210',
};

test('report exports produce escaped HTML, readable text, and a structurally valid PDF', async () => {
  const { reportHtml, reportTextLines, reportPdfBlob } = loadReportDocument();
  const html = reportHtml(report, settings);
  assert.match(html, /A &lt;Patient&gt;/);
  assert.match(html, /PathoNexa &amp; Lab/);
  assert.doesNotMatch(html, /A <Patient>/);

  const text = reportTextLines(report, settings).join('\n');
  assert.match(text, /RP260821001/);
  assert.match(text, /Hemoglobin \| 14\.2 \| g\/dL \| 12-16/);

  const blob = reportPdfBlob(report, settings);
  assert.equal(blob.type, 'application/pdf');
  const pdf = Buffer.from(await blob.arrayBuffer()).toString('latin1');
  assert.ok(pdf.startsWith('%PDF-1.4'));
  assert.match(pdf, /Hemoglobin/);
  assert.match(pdf, /xref\n0 6/);
  assert.match(pdf, /trailer/);
  assert.match(pdf, /%%EOF/);
});
