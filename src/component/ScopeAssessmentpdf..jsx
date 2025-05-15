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

      /* Status Cell and Box Styles */
      td.status-cell {
        width: 85px;
        text-align: right;
        vertical-align: top;
        border: none;
        padding: 0 0 2px 0;
      }
      .status-box { 
        border: 1px solid; 
        padding: 3px 5px; 
        color: white; 
        font-weight: bold; 
        border-radius: 3px; 
        background-color: #888888; 
        font-size: 9pt; 
        text-align: center; 
        line-height: 1.1; 
        display: inline-block; 
        margin-top: 0; 
        box-sizing: border-box; 
      }
      .status-box span.status-date { 
        display: block; 
        font-size: 7.5pt; 
        font-weight: normal; 
        margin-top: 1px; 
        color: black; 
        background-color: transparent; 
      }
      .status-box.refer { 
        border-color: #A00000; 
        background-color: #D9534F; 
      }
      .status-box.inscope { 
        border-color: #006400; 
        background-color: #5CB85C; 
        color: white; 
      }

      .patient-info {
        margin: 18px 0 4px 0;
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
    
      }
      .assessment-table th, .assessment-table td {
        border: 0.5px solid #bbb;
 
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
   
        border-radius: 4px;
      }
      .result-box b {
        font-size: 11pt;
      }
      .footer {
        margin-top: 10px;
        color: #888;
        font-size: 10pt;
        text-align: center;
      }
    </style>
    <title>Scope Assessment Report</title>
  </head>
  <body>
    <table class="header-table">
      <tr>
        <td class="logo-cell">
          ${logoHtml}
        </td>
        <td class="clinic-info-cell">
          <b>${clinic?.entityName}</b>
          ${clinic?.address || ''}<br/>
          ${clinic?.city || ''}<br/>
          ${clinic?.province || ''} ${clinic?.postalCode || ''}<br/>
          ${clinic?.phone ? `Phone: ${clinic.phone}` : ''}
        </td>
        <td class="status-cell">
          <div class="status-box ${scopeStatus?.toLowerCase().includes('refer') ? 'refer' : 'inscope'}">
            ${scopeStatus?.toLowerCase().includes('refer') ? 'Refer' : 'In Scope'}
            <span class="status-date">
              ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
          </div>
        </td>
      </tr>
    </table>

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
  scopeStatusReason,
  logoBase64
}) {
  let logoHtml = '';
  if (logoBase64) {
    logoHtml = `<img src="data:image/png;base64,${logoBase64}" alt="Clinic Logo" style="max-width:100px;max-height:100px;" />`;
  } else if (clinic?.logo) {
    const isAbsolute = clinic.logo.startsWith('http://') || clinic.logo.startsWith('https://');
    const logoUrl = isAbsolute ? clinic.logo : MEDIA_URL + clinic.logo;
    logoHtml = `<img src="${logoUrl}" alt="Clinic Logo" style="max-width:100px;max-height:100px;" />`;
  }

  const isRefer = scopeStatus?.toLowerCase().includes('refer');
  const statusDate = new Date().toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric' 
  });

  // Status HTML with separated date
  const statusHtml = `
    <div style="text-align: right;">
      <div style="display: inline-block;">
        <div style="
          background: ${isRefer ? '#ff1a1a !important' : '#3b9437 !important'}; 
        
          color: #FFFFFF; 
          padding-top:10px; 
          font-weight: bold; 
          border-radius: 3px; 
          font-size: 9pt; 
          text-align: center; 
          line-height: 1.1; 
          min-width: 85px;
          display: inline-block;
          box-shadow: none;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        ">
          ${isRefer ? 'Refer' : 'In Scope'}
        </div>
        <div style="
          font-size: 7.5pt; 
          font-weight: normal; 
          margin-top: 4px; 
          color: #000000;
          text-align: center;
        ">
          ${statusDate}
        </div>
      </div>
    </div>
  `;

  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8">
    <style>
      body {
        font-family: Arial, sans-serif;
        margin: 40px;
        color: #333;
        line-height: 1.4;
      }
      
      .header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 30px;
        border-bottom: 1px solid #ddd;
        padding-bottom: 20px;
      }
      
      .logo-section {
        display: flex;
        gap: 20px;
      }
      
      .logo {
        width: 100px;
      }
      
      .clinic-info {
        font-size: 14px;
      }
      
      .clinic-name {
        font-size: 16px;
        font-weight: bold;
        margin-bottom: 5px;
      }
      
      .status {
        text-align: right;
      }
      

      
      .status-date {
        margin-top: 5px;
        font-size: 16px;
        color: #000;
        font-weight: bold;
        text-align: center;
      }
      
      .patient-info {
        margin-bottom: 20px;
      }
      
      .patient-name {
        font-size: 16px;
        font-weight: bold;
        margin-bottom: 5px;
      }
      
      .patient-details {
        font-size: 14px;
        margin-bottom: 3px;
      }
      
      .assessment-table {
        width: 100%;
        border-collapse: collapse;
        margin-bottom: 20px;
      }
      
      .assessment-table th,
      .assessment-table td {
        border: 1px solid #ddd;
        padding: 6px;
        text-align: left;
        font-size: 12px;
      }
      
      .assessment-table th {
        background-color: #f8f8f8;
      }
      
      .assessment-table td:first-child {
        width: 70%;
      }
      
      .result-section {
        margin-top: 2px;
            border: 1px solid #ddd;
      }
      
      .result-title {
        font-size: 16px;
        font-weight: bold;
        margin-bottom: 10px;
      }
      
      .result-content {
        font-size: 14px;
      }
      
      .footer {
        margin-top: 10px;
        text-align: center;
        font-size: 12px;
        color: #666;
        font-style: italic;
      }
    </style>
  </head>
  <body>
    <div class="header">
      <div class="logo-section">
        <div class="logo">
          ${logoHtml}
        </div>
        <div class="clinic-info">
          <div class="clinic-name">${clinic?.entityName || ''}</div>
          <div>${clinic?.address || ''}</div>
          <div>${clinic?.city || ''}, ${clinic?.province || ''} ${clinic?.postalCode || ''}</div>
          <div>Phone: ${clinic?.phoneNo || ''} | Fax: ${clinic?.faxNo || ''}</div>
        </div>
      </div>
      <div class="status">
        ${statusHtml}
      </div>
    </div>

    <div class="patient-info">
      <div class="patient-name">${patient.name}</div>
      <div class="patient-details">DOB: ${patient.dob}</div>
      <div class="patient-details">PHN: ${patient.phn}</div>
      <div class="patient-details">Reason of Appointment: ${patient.reason}</div>
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
            <td>${answers[idx] || 'N/A'}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>

    <div class="result-section">
      <div class="result-title">Assessment Result</div>
      <div class="result-content" style="
 
        border-radius: 4px;
        padding: 10px;
      
      ">
        ${assessmentResult}
        ${scopeStatus?.toLowerCase().includes('refer') && scopeStatusReason ? `
          <div style="
        
            
            background-color: #ffebee;
            border-radius: 4px;
            color: #000000;
          
          ">
            <strong>Reason for Referral:</strong> ${scopeStatusReason}
          </div>
        ` : ''}
      </div>
    </div>

    <div class="footer">
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