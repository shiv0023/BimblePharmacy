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
  const isRefer = statusClass === 'refer';
  
  let logoHtml = '';
  if (clinic?.logo) {
    if (clinic.logo.startsWith('http://') || clinic.logo.startsWith('https://')) {
      logoHtml = `<img src="${clinic.logo}" alt="Clinic Logo" style="max-width:80px; height:auto; border: 1px solid #ddd; padding: 5px;" />`;
    } else {
      logoHtml = `<img src="${MEDIA_URL}${clinic.logo}" alt="Clinic Logo" style="max-width:80px; height:auto; border: 1px solid #ddd; padding: 5px;" />`;
    }
  } else if (logoBase64) {
    logoHtml = `<img src="data:image/png;base64,${logoBase64}" alt="Clinic Logo" style="max-width:80px; height:auto; border: 1px solid #ddd; padding: 5px;" />`;
  }

  const headerHtml = `
    <table class="header-table">
      <tr>
        <td class="logo-cell">
          ${logoHtml}
        </td>
        <td class="clinic-info-cell">
          <div class="clinic-name">${clinic?.clinicName || ''}</div>
          <div class="clinic-line">${clinic?.address || ''}</div>
          <div class="clinic-line">${clinic?.city || ''}, ${clinic?.province || ''} ${clinic?.postalCode || ''}</div>
          <div class="clinic-line">Phone: ${clinic?.phone || ''}${clinic?.fax ? ' | Fax: ' + clinic?.fax : ''}</div>
        </td>
        <td class="status-cell">
          <div style="text-align: right;">
            <div style="display: inline-block;">
              <div style="
                background: ${isRefer ? '#ff1a1a !important' : '#3b9437 !important'}; 
                color: #FFFFFF; 
                padding: 3px 8px; 
                font-weight: bold; 
                border-radius: 3px; 
                font-size: 9pt; 
                text-align: center; 
                line-height: 1.1; 
                min-width: 85px;
                display: inline-block;
                box-shadow: none;
                margin-left:20px;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              ">
                ${isRefer ? 'Refer' : 'In Scope'}
              </div>
              <div style="
                font-size: 7.5pt; 
                font-weight: normal; 
            
                color: #000000;
                text-align: center;
              ">
                ${followUpDate}
              </div>
            </div>
          </div>
        </td>
      </tr>
    </table>
  `;

  const patientInfoHtml = `
    <div class="patient-info">
      <div class="patient-name">${patient.name || ''}</div>
      <div class="patient-details">DOB: ${patient.dob || ''}</div>
      <div class="patient-details">PHN: ${patient.phn || ''}</div>
      ${patient.address ? `<div class="patient-details">Address: ${patient.address}</div>` : ''}
      <div class="patient-details">Reason of Appointment: ${patient.reason || ''}</div>
    </div>
  `;

  const tableHtml = `
    <div class="assessment-content">
      ${questions.map((question, index) => `
        <div class="qa-section">
          <div class="question">${question}</div>
          <div class="answer">${answers[index] || ''}</div>
        </div>
      `).join('')}
    </div>
  `;

  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8">
    <style>
      @page {
        size: letter;
        margin: 0.3in;
      }
      body {
        font-family: Arial, sans-serif;
        margin: 0;
        padding: 0;
        color: #333;
        
      }
      .header-table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 10px;
        padding:20px;
        margin:20px;
      }
      .logo-cell {
        width: 90px;
        vertical-align: top;
        padding: 0 15px 15px 0;
      }
      .logo-cell img {
        max-width: 80px;
        height: auto;
        border: 1px solid #ddd;
        padding: 5px;
      }
      .clinic-info-cell {
        vertical-align: top;
        padding: 0;
      }
      .clinic-name {
        font-size: 14px;
        font-weight: bold;
        margin-bottom: 3px;
      }
      .clinic-line {
        font-size: 11px;
        
        color: #000;
      }
      .status-cell {
        width: 85px;
        vertical-align: top;
        text-align: right;
        padding: 0;
      }
      
      .patient-info {
       
        padding: 20px;
        background-color: #f8f9fa;
        border-radius: 4px;
      }
      
      .patient-name {
        font-size: 14px;
        font-weight: bold;

        color: #000;
      }
      
      .patient-details {
        font-size: 12px;
   
        color: #000;
      }
      
      .assessment-content {
     
        padding:20px;
      }
      
      .qa-section {
        margin-bottom: 0;
        border-top: 1px solid #eee;
        padding: 8px 0;
      }
      
      .question {
        font-size: 11px;
        font-weight: normal;
        color: #000;
        margin-bottom: 4px;
      }
      
      .answer {
        font-size: 11px;
        color: #000;
        margin-left: 0;
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
    ${headerHtml}
    ${patientInfoHtml}
    ${tableHtml}
    <div class="footer">
      This follow-up assessment was completed electronically.
    </div>
  </body>
  </html>
  `;
}