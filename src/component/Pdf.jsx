import React from 'react';
import { Modal, View, TouchableOpacity, Text, StyleSheet, ScrollView, Image, Alert, ActivityIndicator } from 'react-native';
import RNHTMLtoPDF from 'react-native-html-to-pdf';
import Pdf from 'react-native-pdf';
import RNBlobUtil from 'react-native-blob-util';
import Share from 'react-native-share';

const MEDIA_URL =  'https://api.bimble.pro/media/';


const formatDate = (date) => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const d = new Date(date);
  const month = months[d.getMonth()];
  const day = d.getDate();
  const year = d.getFullYear();
  const hours = d.getHours().toString().padStart(2, '0');
  const minutes = d.getMinutes().toString().padStart(2, '0');
  return `${month} ${day}, ${year} at ${hours}:${minutes}`;
};

const PDFViewer = ({ visible, onClose, pdfContent, signature, additionalNotes }) => {
  const [loading, setLoading] = React.useState(true);
  const [pdfFile, setPdfFile] = React.useState(null);
  const [totalPages, setTotalPages] = React.useState(1);
  const [currentPage, setCurrentPage] = React.useState(1);

  React.useEffect(() => {
    if (visible && pdfContent) {
      generatePDF();
    }
    if (!visible) {
      setPdfFile(null);
      setLoading(true);
    }
  }, [visible, pdfContent]);

  const generatePDF = async () => {
    try {
      setLoading(true);
      
      // Verify logo URL
      if (pdfContent?.clinicInfo?.logo) {
        console.log('Using logo URL:', pdfContent.clinicInfo.logo);
      } else {
        console.log('No logo provided, using default');
      }

      const formatPatientDOB = (dob, age) => {
        if (!dob) return '';
        const date = new Date(dob);
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}/${age} years`;
      };

      const content = {
        patientInfo: {
          name: `${pdfContent?.patientInfo?.name}`,
          phn: pdfContent?.patientInfo?.phn,
          gender: pdfContent?.patientInfo?.gender,
          dob: formatPatientDOB(pdfContent?.patientInfo?.originalDob, pdfContent?.patientInfo?.age),
          address: pdfContent?.patientInfo?.address,
          city: pdfContent?.patientInfo?.city,
          province: pdfContent?.patientInfo?.province,
          postalCode: pdfContent?.patientInfo?.postalCode,
          phoneCell: pdfContent?.patientInfo?.phoneCell,
          phoneWork: pdfContent?.patientInfo?.phoneWork,
          phoneHome: pdfContent?.patientInfo?.phoneHome,
        },
        doctorInfo: {
          name: 'Dr.doctor oscardoc',
          license: '18560',
          signedDate: new Date().toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
          }).replace(',', '') // This will format the date like "Mar 26, 2025 at 05:27 AM"
        }
      };

      const medications = pdfContent?.medications?.map(med => ({
        ...med,
        patientCompliance: pdfContent?.patientInfo?.compliance,
        complianceFrequency: pdfContent?.patientInfo?.complianceFrequency
      }));

      const generatePages = (pdfContent, medications) => {
        const MEDS_PER_PAGE = 5;
        const totalPages = Math.ceil((medications?.length || 0) / MEDS_PER_PAGE);
        let html = '';

        for (let pageNum = 0; pageNum < totalPages; pageNum++) {
          const startIdx = pageNum * MEDS_PER_PAGE;
          const endIdx = startIdx + MEDS_PER_PAGE;
          const pageMeds = medications.slice(startIdx, endIdx);

          html += `
            <div class="page">
              <!-- Left Section -->
              <div class="left-section">
                ${generateLeftSection(pdfContent)}
              </div>

              <!-- Right Section -->
              <div class="right-section">
                ${pageNum === 0 ? generateMainContent(pdfContent) : generateContinuationHeader(pdfContent)}
                <div class="medications">
                  ${generateMedications(pageMeds, startIdx)}
                </div>
                ${generateSignatureSection(pdfContent, signature)}
              </div>

              <!-- Page Number -->
              <div class="page-number">Page ${pageNum + 1} of ${totalPages}</div>
              ${pageNum < totalPages - 1 ? '<div class="continuation-marker">Continued on next page...</div>' : ''}
            </div>
            ${pageNum < totalPages - 1 ? '<div class="page-break"></div>' : ''}
          `;
        }
        return html;
      };

      // Add these helper functions
      const generateLeftSection = (pdfContent) => `
        <img 
          src="${`${MEDIA_URL}${pdfContent?.clinicInfo?.logo}`}" 
          class="logo" 
          alt="Clinic Logo"
          onerror="this.onerror=null; this.src='${MEDIA_URL}logo.png';"
        />
        <div class="date">Date: ${formatDate(new Date())}</div>
        <div class="clinic-info">
          ${pdfContent?.clinicInfo?.name}<br/>
          ${pdfContent?.clinicInfo?.address}<br/>
          ${pdfContent?.clinicInfo?.city}, ${pdfContent?.clinicInfo?.province} ${pdfContent?.clinicInfo?.postalCode}<br/>
          Phone: ${pdfContent?.clinicInfo?.phone}<br/>
          Fax: ${pdfContent?.clinicInfo?.fax}
        </div>

        <div class="Pickup-status">${pdfContent?.deliveryOption} Requested</div>

        <div class="pharmacy-details">
          <div class="pharmacy-title">Pharmacy Details</div>
          ${pdfContent?.pharmacyDetails?.name}<br/>
          ${pdfContent?.pharmacyDetails?.address}<br/>
          ${pdfContent?.pharmacyDetails?.city}, ${pdfContent?.pharmacyDetails?.province} ${pdfContent?.pharmacyDetails?.postalCode}<br/>
          Phone: ${pdfContent?.pharmacyDetails?.phone}<br/>
          Fax: ${pdfContent?.pharmacyDetails?.fax}
        </div>
      `;

      const generateMainContent = (pdfContent) => `
        <div class="patient-info">
          <div class="patient-info-title">Patient Information</div>
          ${pdfContent?.patientInfo?.name} (PHN: ${pdfContent?.patientInfo?.phn})<br/>
          ${pdfContent?.patientInfo?.gender}/${pdfContent?.patientInfo?.dob?.split(' years')[0]} Years<br/>
          ${pdfContent?.patientInfo?.address}<br/>
          ${pdfContent?.patientInfo?.city}, ${pdfContent?.patientInfo?.province} ${pdfContent?.patientInfo?.postalCode}<br/>
          <div class="phone-numbers">
            Phone (C): ${pdfContent?.patientInfo?.phoneCell}
            Phone (W): ${pdfContent?.patientInfo?.phoneWork}
            Phone (H): ${pdfContent?.patientInfo?.phoneHome}
          </div>
        </div>

        <div class="drug-allergies">
          <div class="drug-allergies-title">Drug Allergies</div>
          ${pdfContent?.patientInfo?.allergies}
        </div>
      `;

      const generateContinuationHeader = (pdfContent) => `
        <div class="continuation-header">
          <h3>Prescription Continuation</h3>
          <p>Patient: ${pdfContent?.patientInfo?.name} (PHN: ${pdfContent?.patientInfo?.phn})</p>
        </div>
      `;

      const generateMedications = (medications, startIdx) => {
        return medications.map((med, index) => `
          ${index > 0 && index % 5 === 0 ? '<div class="page-break"></div>' : ''}
          <div class="medication">
            <div class="medication-name">${med.name} (${med.form})</div>
            <div class="medication-details">${med.instructions}
              ${med.patientCompliance?.toLowerCase() === 'no' && med.complianceFrequency ? 
                `<span class="dispense-text">(${med.complianceFrequency} Dispense)</span>` : 
                ''}
            </div>
            <div class="medication-details">${med.startDate} - ${med.endDate} (${med.duration} days)</div>
            <div class="medication-details">Total Qty: ${med.quantity} Refills: ${med.refills}</div>
          </div>
        `).join('');
      };

      const generateSignatureSection = (pdfContent, signature) => `
        <div class="signature-section">
          ${signature ? `
            <img 
              src="data:image/png;base64,${signature}" 
              class="signature-image"
              alt="Doctor's Signature"
            />
          ` : ''}
          <div class="doctor-info">
            <p>${pdfContent?.doctorInfo?.name}</p>
            <p>License #${pdfContent?.doctorInfo?.license}</p>
          </div>
          <div class="signed-date">
            Signed on ${formatDate(new Date())}
          </div>
        </div>
      `;

      // Update the CSS styles in htmlContent
      const htmlContent = `
        <html>
          <head>
            <style>
              @page {
                margin: 0;
                padding: 0;
                size: A4;
              }
              body { 
                font-family: "Product Sans", Arial, sans-serif;
                margin: 0;
                padding: 40px;
                font-size: 10px;
                line-height: 1.4;
                color: #000;
                position: relative;
                max-height: 29.7cm;
                overflow: hidden;
              }
              .container {
                display: flex;
                position: relative;
                height: calc(100% - 120px);
                max-height: calc(29.7cm - 120px);
                overflow: hidden;
              }
              .vertical-line {
                position: absolute;
                left: 30%;
                top: 0;
                height: 100%;
                width: 1px;
                background-color: #d1d5db;
              }
              .left-section {
                width: 28%;
                border-right: 2px solid #d1d5db;
                z-index: 9999;
              }

              .right-section {
                width: 68%;
                margin-left: 2%;
                padding-bottom: 100px;
              }
              .logo {
                width: 80px;
                height: 80px;
                margin-bottom: 10px;
                object-fit: contain;
                object-position: left;
                display: block;
              }
              .date {
                margin-bottom: 8px;
                font-size: 10px;
              }
              .clinic-info {
                margin-bottom: 20px;
                line-height: 1.4;
              }
              .clinic-info p {
                margin: 0;
                padding: 0;
                line-height: 1.4;
                font-size: 10px;
              }
              .pickup-status {
                margin: 4px 0;
                font-size: 10px;
                padding-top: 4px;
                border-top: 1px solid #d1d5db;
              }
              .pharmacy-title {
                font-size: 10px;
                font-weight: bold;
                margin-bottom: 4px;
              }
              .pharmacy-details p {
                margin: 0;
                padding: 0;
                line-height: 1.4;
                font-size: 10px;
              }
              .patient-info-title {
                font-size: 10px;
                font-weight: bold;
                margin-bottom: 8px;
              }
              .patient-info {
                padding-right: 10px;
                padding-top: 20px;
                font-size: 10px;
              }
              .phone-numbers {
                display: flex;
                gap: 15px;
                margin-top: 5px;
              }
              .drug-allergies {
                padding-top: 5px;
                padding-right: 10px;
                border-bottom: 1px solid #d1d5db;
                margin-bottom: 2px;
              }
              .drug-allergies-title {
                font-size: 10px;
                font-weight: bold;
                margin-bottom: 4px;
              }
              .medication {
                margin-bottom: 4px;
                border-bottom: 1px solid #e5e7eb;
              }
              .medication-name {
                font-weight: bold;
                font-size: 10px;
                margin-bottom: 4px;
                padding: 4px;
              }
              .medication-details {
                font-size: 10px;
                padding-left: 4px;
                margin: 2px 0;
                display: flex;
                flex-direction: row;
                align-items: center;
              }
              .dispense-text {
                color: #666;
                font-weight: normal;
                margin-left: 4px;
              }
              .signature-section {
                display: flex;
                flex-direction: column;
                position: absolute;
                bottom: 120px;
                left: 32%;
                width: 65%;
                text-align: left;
              
                border-top: 2px solid #d1d5db;
              }
              .signature-image {
                width: 120px;
                height: 80px;
             
                object-fit: contain;
                display: block;
              }
              .doctor-info {
                text-align: left;
                font-size: 12px;
                line-height: 1.2;
              }
              .signed-date {
                font-size: 12px;
                color: #000;
             
              }
              .page-number {
                position: fixed;
                bottom: 40px;
                right: 40px;
                font-size: 12px;
                color: #000;
              }
              .additional-notes {
                margin-top: 8px;
                padding-top: 8px;
              
                font-size: 10px;
                color: #666;
              }
              .page-break {
                page-break-before: always;
              }
              
              .medications {
                height: auto;
              }
              
              .continuation-marker {
                position: fixed;
                bottom: 40px;
                left: 40px;
                font-size: 12px;
                color: #666;
              }
              
              @media print {
                .page-break {
                  page-break-before: always;
                }
              }

              .page {
                position: relative;
                padding: 40px;
                page-break-after: always;
                height: 100vh;
              }
              .page:last-child {
                page-break-after: avoid;
              }
              .page-break {
                page-break-before: always;
              }
              .page-number {
                position: absolute;
                bottom: 20px;
                right: 40px;
                font-size: 12px;
                color: #000;
                background-color: white;
                padding: 4px 8px;
                border-radius: 4px;
              }
              .continuation-marker {
                position: absolute;
                bottom: 20px;
                left: 40px;
                font-size: 12px;
                color: #666;
              }
              .continuation-header {
                margin-bottom: 20px;
                padding-bottom: 10px;
                border-bottom: 1px solid #d1d5db;
              }
              .continuation-header h3 {
                font-size: 14px;
                margin: 0 0 8px 0;
              }
              .continuation-header p {
                font-size: 12px;
                margin: 0;
                color: #666;
              }
            </style>
          </head>
          <body>
            ${generatePages(pdfContent, pdfContent?.medications || [])}
          </body>
        </html>
      `;

      const options = {
        html: htmlContent,
        fileName: `prescription_${Date.now()}`,
        directory: 'Documents',
        height: 842, // A4 height in points
        width: 595,  // A4 width in points
        padding: 0,
        backgroundColor: '#ffffff',
        maxPageHeight: 842,
        page: {
          margin: 0,
          padding: 0,
        }
      };

      const file = await RNHTMLtoPDF.convert(options);
      console.log('PDF generated:', file.filePath);
      
      const pdfPath = Platform.OS === 'ios' ? `file://${file.filePath}` : file.filePath;
      setPdfFile(pdfPath);
      setLoading(false);
    } catch (error) {
      console.error('Error generating PDF:', error);
      Alert.alert('Error', 'Failed to generate PDF preview');
      setLoading(false);
    }
  };

  const handleLogoError = (error) => {
    console.error('Error loading logo:', error);
  };

  const handleDownload = async () => {
    try {
      if (!pdfFile) {
        Alert.alert('Error', 'Please wait for PDF to generate');
        return;
      }

      if (Platform.OS === 'ios') {
        const downloadPath = `${RNBlobUtil.fs.dirs.DownloadDir}/prescription_${Date.now()}.pdf`;
        await RNBlobUtil.fs.cp(pdfFile, downloadPath);
        await RNBlobUtil.android.addCompleteDownload({
          title: 'Prescription PDF',
          description: 'Downloading Prescription',
          mime: 'application/pdf',
          path: downloadPath,
          showNotification: true,
        });
        Alert.alert('Success', 'PDF has been downloaded to your downloads folder');
      } else {
        await Share.share({
          url: pdfFile,
          title: 'Prescription PDF',
        });
      }
    } catch (error) {
      console.error('Error downloading PDF:', error);
      Alert.alert('Error', 'Failed to download PDF');
    }
  };

  const handleDownloadConfirm = () => {
    Alert.alert(
      'Download PDF',
      'Do you want to download this PDF?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Download',
          onPress: handleDownload,
        },
      ],
      { cancelable: true }
    );
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>PDF Preview</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#0049F8" />
              <Text style={styles.loadingText}>Generating PDF preview...</Text>
            </View>
          ) : pdfFile ? (
            <View style={styles.pdfContainer}>
              <Pdf
                source={{ uri: pdfFile }}
                style={styles.pdf}
                onLoadComplete={(numberOfPages, filePath) => {
                  console.log(`PDF loaded: ${numberOfPages} pages`);
                  setTotalPages(numberOfPages);
                }}
                onPageChanged={(page) => {
                  console.log(`Current page: ${page}`);
                  setCurrentPage(page);
                }}
                enablePaging={true}
                horizontal={false}
                scale={1.0}
                spacing={0}
                fitPolicy={0}
                singlePage={false}
              />
              <View style={styles.pageIndicator}>
                <Text style={styles.pageIndicatorText}>
                  Page {currentPage} of {totalPages}
                </Text>
              </View>
            </View>
          ) : (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>Failed to generate PDF preview</Text>
            </View>
          )}

          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={[styles.button, { backgroundColor: '#fff', borderWidth: 1, borderColor: '#E6E8EC' }]}
              onPress={onClose}
            >
              <Text style={[styles.buttonText, { color: '#000' }]}>Close</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.button, styles.downloadButton]}
              onPress={handleDownload}
              disabled={loading || !pdfFile}
            >
              <Text style={styles.buttonText}>
                {loading ? 'Generating...' : 'Download PDF'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    flex: 1,
    backgroundColor: '#fff',
    margin: 20,
    marginTop: 40,
    borderRadius: 8,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E6E8EC',
    backgroundColor: '#fff',
    zIndex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#191919',
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    fontSize: 24,
    color: '#000',
  },
  pdfContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    overflow: 'hidden', // Prevent content overflow
  },
  pdf: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: '#ffffff',
    overflow: 'hidden', // Prevent content overflow
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
    fontSize: 14,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  errorText: {
    color: 'red',
    fontSize: 14,
  },
  actionButtons: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E6E8EC',
    backgroundColor: '#fff',
    justifyContent: 'space-between',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  downloadButton: {
    backgroundColor: '#0049F8',
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  pageIndicator: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 8,
    borderRadius: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  pageIndicatorText: {
    fontSize: 12,
    color: '#000',
    fontWeight: '500',
  },
});

export default PDFViewer;