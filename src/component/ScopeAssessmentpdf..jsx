import React from 'react';
import { StyleSheet } from 'react-native';
import RNFS from 'react-native-fs';
import { renderClinicAndPatientHeader, renderAssessmentTable } from './PdfCommon';

const MEDIA_URL = 'https://api.bimble.pro/media/';

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
  resultTitle: { fontWeight: "bold", marginBottom: 4 },
  statusBox: {
    padding: 16,
    borderRadius: 4,
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 28,
    textAlign: 'center',
    lineHeight: 1.1,
    letterSpacing: 0.5,
    boxSizing: 'border-box',
    border: 'none',
    display: 'inline-block',
    marginBottom: 0
  },
  statusBoxInscope: { background: '#4CAF50 !important' },
  statusBoxRefer: { background: '#E53935 !important' },
  statusDate: {
    display: 'block',
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111',
    marginTop: 12,
    textAlign: 'center',
    letterSpacing: 0.5,
    fontFamily: 'Helvetica, Arial, sans-serif'
  },
  patientInfo: { margin: 18, 0: 10 },
  patientInfoBold: { fontSize: 12, fontWeight: 'bold', color: '#000', display: 'block', marginBottom: 2 },
  patientInfoSpan: { display: 'block', fontSize: 10, color: '#333', marginBottom: 2 },
  assessmentTable: {
    width: '100%',
    borderCollapse: 'collapse',
    marginTop: 10
  },
  assessmentTableTh: { background: '#f5f5f5', fontWeight: 'bold' },
  assessmentTableTd: { background: '#fff' },
  resultBox: { marginTop: 18, border: '1.5px solid #bbb', background: '#f9f9f9', padding: 12, borderRadius: 4 },
  resultBoxBold: { fontSize: 11 },
  footer: { marginTop: 30, color: '#888', fontSize: 10, textAlign: 'center' }
});

export function getScopeAssessmentHtml({
  clinic,
  patient,
  questions,
  answers,
  assessmentResult,
  scopeStatus,
  logoBase64
}) {
  // Set status
  const statusText = scopeStatus && scopeStatus.toLowerCase().includes('refer') ? 'Refer' : 'In Scope';
  const statusClass = scopeStatus && scopeStatus.toLowerCase().includes('refer') ? 'refer' : 'inscope';
  const statusDate = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  const headerHtml = renderClinicAndPatientHeader({
    clinic,
    patient,
    statusText,
    statusClass,
    statusDate,
    logoBase64
  });

  const tableHtml = renderAssessmentTable({ questions, answers });

  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8">
    <style>
      @page {
        size: letter;
        margin: 0.7in;
      }
      body {
        font-family: Helvetica, Arial, sans-serif;
        font-size: 11pt;
        color: #222;
        background: #fff;
      }
      table.header-table {
        width: 100%;
        border-collapse: collapse;
        border-bottom: 2px solid #E0E0E0;
        margin-bottom: 18px;
      }
      td.logo-cell {
        width: 90px;
        vertical-align: top;
        padding-right: 10px;
      }
      td.logo-cell img {
        max-width: 70px;
        max-height: 70px;
        vertical-align: top;
      }
      td.clinic-info-cell {
        vertical-align: top;
        font-size: 12pt;
        color: #222;
        text-align: left;
        padding: 0;
      }
      td.clinic-info-cell b {
        font-size: 14pt;
        font-weight: bold;
        color: #000;
        display: block;
        margin-bottom: 2px;
      }
      td.status-cell {
        width: 85px;
        text-align: right;
        vertical-align: top;
        border: none;
        padding: 0 0 2px 0;
      }
      .status-box {
        border: 1px solid;
        padding: 8px 20px;
        color: #fff;
        font-weight: bold;
        border-radius: 4px;
        font-size: 18pt;
        text-align: center;
        line-height: 1.1;
        display: inline-block;
        margin-top: 0;
        box-sizing: border-box;
      }
      .status-box.refer {
        border-color: #A00000;
        background-color: #D9534F;
      }
      .status-box.inscope {
        border-color: #006400;
        background-color: #4CAF50;
      }
      .status-date {
        display: block;
        font-size: 12pt;
        font-weight: normal;
        margin-top: 8px;
        color: #111;
        background-color: transparent;
      }
      .patient-info {
        margin: 18px 0 10px 0;
      }
      .patient-info b {
        font-size: 12pt;
        font-weight: bold;
        color: #000;
        display: block;
        margin-bottom: 2px;
      }
      .patient-info span {
        display: block;
        font-size: 10pt;
        color: #333;
        margin-bottom: 2px;
      }
      .assessment-table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 10px;
      }
      .assessment-table th, .assessment-table td {
        border: 0.5px solid #bbb;
        padding: 8px 6px;
        text-align: left;
        font-size: 10pt;
      }
      .assessment-table th {
        background: #f5f5f5;
        font-weight: bold;
      }
      .assessment-table td {
        background: #fff;
      }
      .result-box {
        margin-top: 18px;
        border: 1.5px solid #bbb;
        background: #f9f9f9;
        padding: 12px;
        border-radius: 4px;
      }
      .result-box b {
        font-size: 11pt;
      }
      .footer {
        margin-top: 30px;
        color: #888;
        font-size: 10pt;
        text-align: center;
      }
      .status-box span {
        background: #E53935;
        padding: 4px 12px;
        border-radius: 4px;
      }
    </style>
    <title>Scope Assessment Report</title>
  </head>
  <body>
    ${headerHtml}
    ${tableHtml}
    <div class="assessment-result">
      <b>Assessment Result</b>
      ${assessmentResult || ''}
    </div>
    <div class="footer" style="margin-top: 30px;">
      This scope assessment was completed electronically.
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
  logoBase64
}) {
  let logoHtml = '';
  if (logoBase64) {
    logoHtml = `<img src="data:image/png;base64,${logoBase64}" alt="Clinic Logo" style="max-width:70px;max-height:70px;vertical-align:top;" />`;
  } else if (clinic?.logo) {
    const isAbsolute = clinic.logo.startsWith('http://') || clinic.logo.startsWith('https://');
    const logoUrl = isAbsolute ? clinic.logo : MEDIA_URL + clinic.logo;
    logoHtml = `<img src="${logoUrl}" alt="Clinic Logo" style="max-width:70px;max-height:70px;vertical-align:top;" />`;
  }

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

  const statusHtml = `
    <td class="status-cell">
      <div class="status-box ${statusClass}">
        ${statusText}
        <span class="status-date">${statusDate}</span>
      </div>
    </td>
  `;

  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8">
    <style>
      @page {
        size: letter;
        margin: 0.7in;
      }
      body {
        font-family: Helvetica, Arial, sans-serif;
        font-size: 9pt;
        line-height: 1.2;
        color: #222222;
        margin:35px;
      }
      table.header-table {
        width: 100%;
        border: none;
        border-collapse: collapse;
        margin: 0 0 2px 0;
        padding: 0;
        border-bottom: 1px solid #E0E0E0;
        vertical-align: top;
      }
      td.logo-cell {
        width: 100px;
        padding: 0 5px 5px 0;
        vertical-align: top;
        border: none;
      }
      td.logo-cell img {
        max-width: 100px;
        max-height: 100px;
        vertical-align: top;
      }
      td.clinic-info-cell {
        vertical-align: top;
        padding: 0 2px 0px 0;
        border: none;
        font-size: 8.5pt;
        line-height: 1.3;
        color: #333333;
        margin-left: 2px;
      }
      td.clinic-info-cell b {
        font-size: 10pt;
        font-weight: bold;
        color: #000000;
        display: block;
        margin-bottom: 0px;
      }
  
      .status-box {
        padding: 16px 32px 12px 32px;
        border-radius: 4px;
        color: #fff;
        font-weight: bold;
        font-size: 28px;
        text-align: center;
        line-height: 1.1;
        letter-spacing: 0.5px;
        box-sizing: border-box;
        border: none;
        display: inline-block;
        margin-bottom: 0;
      }
      .status-box.inscope {
        background: #4CAF50;
      }
      .status-box.refer {
        background: #E53935;
      }
      .status-date {
        display: block;
        font-size: 22px;
        font-weight: 600;
        color: #111;
        margin-top: 16px;
        text-align: center;
        letter-spacing: 0.5px;
        font-family: Helvetica, Arial, sans-serif;
      }
      .patient-info { margin-bottom: 2px; padding-bottom: 2px;}
      .patient-info b { font-size: 10.5pt; font-weight: bold; color: #000000; display: block; margin-bottom: 0px; }
      .patient-info span { display: block; margin-bottom: 0px; font-size: 9pt; color: #333333; }
      table.assessment-table {
        width: 100%;
        border-collapse: separate;
        border-spacing: 0;
        margin-bottom: 15px;
        border: 1px solid #A0A0A0;
      }
      .assessment-table th {
        border: none;
        padding: 4px 5px;
        text-align: left;
        vertical-align: top;
        font-size: 8.5pt;
        font-weight: bold;
        color: #000000;
        background-color: transparent;
        border-bottom: 1.5px solid #AAAAAA;
      }
      .assessment-table td {
        border: 1px solid black;
        padding: 3px 5px;
        text-align: left;
        vertical-align: top;
        font-size: 8.5pt;
        line-height: 1.2;
      }
      .assessment-table td:first-child { width: 65%; }
      .assessment-table td:last-child { width: 35%; color: #333; }
      .assessment-result { border: 1px solid #CCCCCC; padding: 8px 10px; background-color: #F9F9F9; margin-top: 15px; font-size: 9pt; border-radius: 0px; }
      .assessment-result b { display: block; font-size: 10pt; font-weight: bold; color: #000000; }
      .footer { font-size: 7.5pt; color: #999999; text-align: center; }
      .status-box span {
        background: #E53935;
        padding: 4px 12px;
        border-radius: 4px;
      }
    </style>
    <title>Scope Assessment Report</title>
  </head>
  <body>
    <table class="header-table">
      <tr>
        <td class="logo-cell">${logoHtml}</td>
        <td class="clinic-info-cell">
          <b>${clinic?.entityName }</b>
          ${clinic?.address || ''}<br/>
          ${clinic?.city || ''}<br/>
          ${clinic?.province || ''} ${clinic?.postalCode || ''}<br/>
          ${clinic?.phone ? `Phone: ${clinic.phone}` : ''}${clinic?.fax ? ` | Fax: ${clinic.fax}` : ''}
        </td>
        ${statusHtml}
      </tr>
    </table>
    <div class="patient-info">
      <b>${patient.name}</b>
      <span>DOB: ${patient.dob}</span>
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
    <div class="assessment-result">
      <b>Assessment Result</b>
      ${assessmentResult || ''}
    </div>
    <div class="footer" style="margin-top: 30px;">
      This scope assessment was completed electronically.
    </div>
  </body>
  </html>
  `;
}

async function convertImageToBase64(path) {
  const base64 = await RNFS.readFile(path, 'base64');
  return base64;
}

export function getFollowUpAssessmentHtml({
  clinic,
  patient,
  questions,
  answers,
  followUpDate,
  statusText,
  statusClass,
  logoBase64
}) {
  const headerHtml = renderClinicAndPatientHeader({
    clinic,
    patient,
    statusText,
    statusClass,
    statusDate: followUpDate,
    logoBase64
  });

  const tableHtml = renderAssessmentTable({ questions, answers });

  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8">
    <style>
      /* ... your CSS from previous steps ... */
    </style>
    <title>Follow-up Assessment Report</title>
  </head>
  <body>
    ${headerHtml}
    ${tableHtml}
    <div class="footer">
      This follow-up assessment was completed electronically.
    </div>
  </body>
  </html>
  `;
}