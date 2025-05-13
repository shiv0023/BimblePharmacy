import { renderClinicAndPatientHeader, renderAssessmentTable } from './PdfCommon';

const MEDIA_URL = 'https://api.bimble.pro/media/';

export function getFollowUpAssessmentHtml({
  clinic,
  patient,
  questions,
  answers,
  followUpDate,
  statusText,
  statusClass,
  logoBase64,
  reason
}) {
  // Format the header HTML with clinic and patient details
  const headerHtml = `
    <table class="header-table">
      <tr>
        <td class="logo-cell">
          ${clinic.logo ? `<img src="${clinic.logo}" alt="Clinic Logo" />` : ''}
        </td>
        <td class="clinic-info-cell">
          <div class="clinic-line clinic-name"><b>${clinic.clinicName || ''}</b></div>
          <div class="clinic-line">${clinic.address || ''}</div>
          <div class="clinic-line">${clinic.city || ''}</div>
          <div class="clinic-line">${clinic.province || ''} ${clinic.postalCode || ''}</div>
          <div class="clinic-line">Phone: ${clinic.phone || ''}${clinic.fax ? ' | Fax: ' + clinic.fax : ''}</div>
        </td>
        <td class="status-cell">
          <div class="status-box ${statusClass}">
            ${statusText}
            <span class="status-date">${followUpDate}</span>
          </div>
        </td>
      </tr>
    </table>
    <div class="patient-info">
      <b>${patient?.firstName || ''} ${patient?.lastName || ''}${patient?.gender ? '/' + (patient.gender === 'M' ? 'Male' : 'Female') : ''}</b>
      <span>DOB: ${patient?.dob || 'N/A'}${patient?.ageString ? ` (${patient.ageString})` : ''}</span>
      <span>PHN: ${patient?.phn || 'N/A'}</span>
      <span>Reason of Appointment: ${reason || patient?.reason || 'N/A'}</span>
      <span>Address: ${[
        patient?.address,
        patient?.city,
        patient?.province,
        patient?.postalCode
      ].filter(Boolean).join(', ')}</span>
    </div>
  `;

  // Format the assessment table
  const tableHtml = `
    <table class="assessment-table">
      <tbody>
        ${questions.map((question, index) => `
          <tr>
            <td colspan="2" class="question-cell"><b>${question}</b></td>
          </tr>
          <tr>
            <td colspan="2" class="answer-cell">${answers[index] || 'N/A'}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
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
      }
      table.header-table {
        width: 100%;
        border-collapse: collapse;
        border-bottom: 1px solid #E0E0E0;
        margin-bottom: 8px;
      }
      td.logo-cell {
        width: 90px;
        vertical-align: top;
        padding: 0 10px 0 0;
      }
      td.logo-cell img {
        max-width: 80px;
        max-height: 80px;
        vertical-align: top;
      }
      td.clinic-info-cell {
        vertical-align: top;
        text-align: left;
        font-size: 11pt;
        color: #222;
        padding: 0 10px 0 0;
        line-height: 1.0;
      margin-bottom: 5px;
      }
      .clinic-line {
        margin-bottom: 5px;
      }
      .clinic-name {
        font-size: 13pt;
        font-weight: bold;
        color: #000;
        margin-bottom: 4px;
      }
               td.status-cell {
                width: 85px; /* Keep status width */
                // text-align: right;
                vertical-align: top;
                border: none;
                padding: 0 0 2px 0; /* Reduced bottom padding */
            }
            /* Status Box Styles (Keep as before) */
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
      .status-date {
        display: block;
        font-size: 9pt;
        font-weight: normal;
        color: #222;
        background: none;
        margin-top: 2px;
      }
      .patient-info {
        margin: 10px 0;
        padding: 5px 0;
      }
      .patient-info b {
        font-size: 10.5pt;
        font-weight: bold;
        display: block;
        margin-bottom: 2px;
      }
      .patient-info span {
        display: block;
        margin-bottom: 1px;
        font-size: 9pt;
      }
      table.assessment-table {
        width: 100%;
        border-collapse: collapse;
      
      }
      .assessment-table td {
        border: none;
     
        font-size: 11pt;
        vertical-align: top;
      }
      .question-cell {
        font-weight: bold;
        background: #fff;
        border-top: 1px solid #ccc;
        color: #666;
       font-weight: bold;
      }
      .answer-cell {
        color: #222;
        padding-bottom: 2px;
        padding-left: 8px;
      }
      .footer {
        margin-top: 5px;
        text-align: center;
        font-size: 8pt;
        color: #666;
      }
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