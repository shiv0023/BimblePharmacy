import React from 'react';
import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  page: { padding: 24, fontSize: 12, fontFamily: 'Helvetica' },
  header: { fontSize: 18, fontWeight: 'bold', marginBottom: 8 },
  subHeader: { fontSize: 14, marginBottom: 4 },
  table: { display: "table", width: "auto", marginVertical: 12 },
  tableRow: { flexDirection: "row" },
  tableColQ: { width: "65%", border: "1px solid #ccc", padding: 4 },
  tableColA: { width: "35%", border: "1px solid #ccc", padding: 4 },
  tableHeader: { backgroundColor: "#f0f0f0", fontWeight: "bold" },
  resultBox: { marginTop: 16, padding: 8, border: "1px solid #aaa", backgroundColor: "#f9f9f9" },
  resultTitle: { fontWeight: "bold", marginBottom: 4 }
});

export default function getScopeAssessmentHtml({
  clinic,
  patient,
  questions,
  answers,
  assessmentResult,
  scopeStatus,
  logoBase64,
}) {
  // Status box logic
  const statusClass =
    scopeStatus && scopeStatus.toLowerCase().includes('refer')
      ? 'refer'
      : scopeStatus && scopeStatus.toLowerCase().includes('in scope')
      ? 'inscope'
      : '';
  const statusText =
    scopeStatus && scopeStatus.toLowerCase().includes('refer')
      ? 'Refer'
      : scopeStatus && scopeStatus.toLowerCase().includes('in scope')
      ? 'In Scope'
      : '';
  const statusDate = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  // Logo HTML
  let logoHtml = '';
  if (logoBase64) {
    logoHtml = `<img src="data:image/png;base64,${logoBase64}" alt="Clinic Logo" style="max-width:70px;max-height:70px;vertical-align:top;" />`;
  } else if (clinic?.logo) {
    logoHtml = `<img src="${clinic.logo}" alt="Clinic Logo" style="max-width:70px;max-height:70px;vertical-align:top;" />`;
  }

  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8">
    <style>
      @page { size: letter; margin: 0.7in; }
      body { font-family: Helvetica, Arial, sans-serif; font-size: 10pt; color: #222; background: #fff; }
      .header-table { width: 100%; border-collapse: collapse; border-bottom: 1.5px solid #E0E0E0; margin-bottom: 10px; }
      .logo-cell { width: 80px; vertical-align: top; }
      .clinic-info-cell { vertical-align: top; font-size: 11pt; color: #222; }
      .clinic-info-cell b { font-size: 13pt; font-weight: bold; color: #000; }
      .status-cell { width: 90px; text-align: right; vertical-align: top; }
      .status-box { border: 1.5px solid; padding: 5px 10px; color: #fff; font-weight: bold; border-radius: 3px; font-size: 11pt; text-align: center; background: #888; display: inline-block; }
      .status-box.refer { border-color: #A00000; background: #D9534F; }
      .status-box.inscope { border-color: #006400; background: #5CB85C; }
      .status-date { display: block; font-size: 8pt; font-weight: normal; margin-top: 2px; color: #fff; }
      .patient-info { margin: 18px 0 10px 0; }
      .patient-info b { font-size: 12pt; font-weight: bold; color: #000; }
      .patient-info span { display: block; font-size: 10pt; color: #333; }
      .assessment-table { width: 100%; border-collapse: collapse; margin-top: 10px; }
      .assessment-table th, .assessment-table td { border: 1px solid #bbb; padding: 8px 6px; text-align: left; font-size: 10pt; }
      .assessment-table th { background: #f5f5f5; font-weight: bold; }
      .result-box { margin-top: 18px; border: 1.5px solid #bbb; background: #f9f9f9; padding: 12px; border-radius: 4px; }
      .result-box b { font-size: 11pt; }
    </style>
    <title>Scope Assessment Report</title>
  </head>
  <body>
    <table class="header-table">
      <tr>
        <td class="logo-cell">${logoHtml}</td>
        <td class="clinic-info-cell">
          <b>${clinic?.clinicName || 'Clinic Name'}</b><br/>
          ${clinic?.address || ''}${clinic?.city ? ', ' + clinic.city : ''}${clinic?.province ? ', ' + clinic.province : ''}${clinic?.postalCode ? ', ' + clinic.postalCode : ''}<br/>
          ${clinic?.phone ? `Phone: ${clinic.phone}` : ''}${clinic?.fax ? ` | Fax: ${clinic.fax}` : ''}
        </td>
        <td class="status-cell">
          <div class="status-box ${statusClass}">
            ${statusText}
            <span class="status-date">${statusDate}</span>
          </div>
        </td>
      </tr>
    </table>
    <div class="patient-info">
      <b>${patient.name}</b>
      <span>DOB: ${patient.dob} (${patient.age ? patient.age + ' years' : ''})</span>
      <span>PHN: ${patient.phn}</span>
      <span>${patient.address}</span>
      <span>Reason of Appointment: ${patient.reason}</span>
    </div>
    <table class="assessment-table">
      <thead>
        <tr>
          <th>Question</th>
          <th>Answer</th>
        </tr>
      </thead>
      <tbody>
        ${questions.map((q, idx) => `
          <tr>
            <td>${q}</td>
            <td>${Array.isArray(answers[idx]) ? answers[idx].join(', ') : answers[idx] || 'N/A'}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
    <div class="result-box">
      <b>Assessment Result</b><br/>
      ${assessmentResult || ''}
    </div>
  </body>
  </html>
  `;
}

export function getStaticScopeAssessmentHtml({
  clinic,
  patient,
  questions,
  answers,
  assessmentResult,
  scopeStatus,
  logoBase64 // optional, if you want to embed logo as base64
}) {
  // Status box logic
  const statusClass =
    scopeStatus && scopeStatus.toLowerCase().includes('refer')
      ? 'refer'
      : scopeStatus && scopeStatus.toLowerCase().includes('in scope')
      ? 'inscope'
      : '';
  const statusText =
    scopeStatus && scopeStatus.toLowerCase().includes('refer')
      ? 'Refer'
      : scopeStatus && scopeStatus.toLowerCase().includes('in scope')
      ? 'In Scope'
      : '';
  const statusDate = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  // Logo HTML
  let logoHtml = '';
  if (logoBase64) {
    logoHtml = `<img src="data:image/png;base64,${logoBase64}" alt="Clinic Logo" style="max-width:70px;max-height:70px;vertical-align:top;" />`;
  } else if (clinic?.logo) {
    logoHtml = `<img src="${clinic.logo}" alt="Clinic Logo" style="max-width:70px;max-height:70px;vertical-align:top;" />`;
  }

  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8">
    <style>
      @page { size: letter; margin: 0.7in; }
      body { font-family: Helvetica, Arial, sans-serif; font-size: 10pt; color: #222; background: #fff; }
      .header-table { width: 100%; border-collapse: collapse; border-bottom: 1.5px solid #E0E0E0; margin-bottom: 10px; }
      .logo-cell { width: 80px; vertical-align: top; }
      .clinic-info-cell { vertical-align: top; font-size: 11pt; color: #222; }
      .clinic-info-cell b { font-size: 13pt; font-weight: bold; color: #000; }
      .status-cell { width: 90px; text-align: right; vertical-align: top; }
      .status-box { border: 1.5px solid; padding: 5px 10px; color: #fff; font-weight: bold; border-radius: 3px; font-size: 11pt; text-align: center; background: #888; display: inline-block; }
      .status-box.refer { border-color: #A00000; background: #D9534F; }
      .status-box.inscope { border-color: #006400; background: #5CB85C; }
      .status-date { display: block; font-size: 8pt; font-weight: normal; margin-top: 2px; color: #fff; }
      .patient-info { margin: 18px 0 10px 0; }
      .patient-info b { font-size: 12pt; font-weight: bold; color: #000; }
      .patient-info span { display: block; font-size: 10pt; color: #333; }
      .assessment-table { width: 100%; border-collapse: collapse; margin-top: 10px; }
      .assessment-table th, .assessment-table td { border: 1px solid #bbb; padding: 8px 6px; text-align: left; font-size: 10pt; }
      .assessment-table th { background: #f5f5f5; font-weight: bold; }
      .result-box { margin-top: 18px; border: 1.5px solid #bbb; background: #f9f9f9; padding: 12px; border-radius: 4px; }
      .result-box b { font-size: 11pt; }
    </style>
    <title>Scope Assessment Report</title>
  </head>
  <body>
    <table class="header-table">
      <tr>
        <td class="logo-cell">${logoHtml}</td>
        <td class="clinic-info-cell">
          <b>${clinic?.clinicName || 'Clinic Name'}</b><br/>
          ${clinic?.address || ''}${clinic?.city ? ', ' + clinic.city : ''}${clinic?.province ? ', ' + clinic.province : ''}${clinic?.postalCode ? ', ' + clinic.postalCode : ''}<br/>
          ${clinic?.phone ? `Phone: ${clinic.phone}` : ''}${clinic?.fax ? ` | Fax: ${clinic.fax}` : ''}
        </td>
        <td class="status-cell">
          <div class="status-box ${statusClass}">
            ${statusText}
            <span class="status-date">${statusDate}</span>
          </div>
        </td>
      </tr>
    </table>
    <div class="patient-info">
      <b>${patient.name}</b>
      <span>DOB: ${patient.dob} (${patient.age} years)</span>
      <span>PHN: ${patient.phn}</span>
      <span>${patient.address}</span>
      <span>Reason of Appointment: ${patient.reason}</span>
    </div>
    <table class="assessment-table">
      <thead>
        <tr>
          <th>Question</th>
          <th>Answer</th>
        </tr>
      </thead>
      <tbody>
        ${questions.map((q, idx) => `
          <tr>
            <td>${q}</td>
            <td>${Array.isArray(answers[idx]) ? answers[idx].join(', ') : answers[idx] || 'N/A'}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
    <div class="result-box">
      <b>Assessment Result</b><br/>
      ${assessmentResult || ''}
    </div>
  </body>
  </html>
  `;
}