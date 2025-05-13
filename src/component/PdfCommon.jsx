// const MEDIA_URL = 'https://api.bimble.pro/media/';

// // Renders the clinic and patient info header for PDF
// export function renderClinicAndPatientHeader({ clinic, patient, statusText, statusClass, statusDate, logoBase64 }) {
//   let logoHtml = '';
//   if (logoBase64) {
//     logoHtml = `<img src="data:image/png;base64,${logoBase64}" alt="Clinic Logo" style="max-width:100px;max-height:100px;vertical-align:top;" />`;
//   } else if (clinic?.logo) {
//     const isAbsolute = clinic.logo.startsWith('http://') || clinic.logo.startsWith('https://');
//     const logoUrl = isAbsolute ? clinic.logo : MEDIA_URL + clinic.logo;
//     logoHtml = `<img src="${logoUrl}" alt="Clinic Logo" style="max-width:100px;max-height:100px;vertical-align:top;" />`;
//   }

//   return `
//     <table class="header-table">
//       <tr>
//         <td class="logo-cell">${logoHtml}</td>
//         <td class="clinic-info-cell">
//           <b>${clinic?.clinicName || 'Clinic Name'}</b>
//           ${clinic?.address || ''}<br/>
//           ${clinic?.city || ''}<br/>
//           ${clinic?.province || ''} ${clinic?.postalCode || ''}<br/>
//           ${clinic?.phone ? `Phone: ${clinic.phone}` : ''}${clinic?.fax ? ` | Fax: ${clinic.fax}` : ''}
//         </td>
//         <td class="status-cell">
//           <div class="status-box ${statusClass}">
//             ${statusText}
//           </div>
//           <span class="status-date">${statusDate}</span>
//         </td>
//       </tr>
//     </table>
//     <div class="patient-info">
//       <b>${patient.name}</b>
//       <span>DOB: ${patient.dob}</span>
//       <span>PHN: ${patient.phn}</span>
//       <span>${patient.address}</span>
//       <span>Reason of Appointment: ${patient.reason}</span>
//     </div>
//   `;
// }

// // Renders the Q/A table for PDF
// export function renderAssessmentTable({ questions, answers }) {
//   return `
//     <table class="assessment-table">
//       <thead>
//         <tr>
//           <th><div class="cell-content">Question</div></th>
//           <th><div class="cell-content">Answer</div></th>
//         </tr>
//       </thead>
//       <tbody>
//         ${questions.map((q, idx) => {
//           const answer = Array.isArray(answers[idx]) ? answers[idx].join(', ') : (answers[idx] || 'N/A');
//           return `
//             <tr>
//               <td><div class="cell-content">${q}</div></td>
//               <td><div class="cell-content">${answer}</div></td>
//             </tr>
//           `;
//         }).join('')}
//       </tbody>
//     </table>
//   `;
// }