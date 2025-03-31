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
      
      // Add validation for required content
      if (!pdfContent?.medications || pdfContent.medications.length === 0) {
        throw new Error('No medications to display');
      }

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
        },
        medications: pdfContent?.medications?.map(med => ({
          ...med,
          patientCompliance: pdfContent?.patientInfo?.compliance,
          complianceFrequency: pdfContent?.patientInfo?.complianceFrequency
        })) || [],
      };

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
                font-family: Arial, sans-serif;
                margin: 0;
                padding: 20;
                font-size: 12px;
                line-height: 1.4;
                color: #000;
              }
              .page {
                position: relative;
                min-height: 227mm;
                page-break-after: auto;
                background-color: black;
              }
              .page-content {
                display: flex;
                height: 100%;
                background-color: blue;
              }
              .left-sidebar {
                width: 30%;
                padding-right: 20px;
                border-right: 1px solid #dee2e6;
                background-color: yellow;
              }
              .main-content {
                width: 70%;
                padding-left: 20px;
                position: relative;
                background-color: green;
              }
              .clinic-logo {
                width: 120px;
                height: auto;
                margin-bottom: 10px;
              }
              .virtual-clinic {
                font-weight: bold;
                color: #002B5C;
                margin-bottom: 20px;
                font-size: 14px;
              }
              .clinic-info {
                margin-bottom: 20px;
                line-height: 1.6;
              }
              .pharmacy-info {
                margin-top: 20px;
                padding-top: 20px;
                border-top: 1px solid #dee2e6;
              }
              .patient-info {
                margin-bottom: 20px;
                padding-bottom: 15px;
               
              }
              .order-number {
                position: absolute;
                top: 0;
                right: 40px;
                font-size: 12px;
                color: #0049F8;
              }
              .medication {
                padding: 12px;
                background-color: #F8F9FA;
                border-radius: 8px;
                border-bottom: 1px solid #E6E8EC;
                page-break-inside: avoid;
              }
              .medication:last-child {
                border-bottom: none;
              }
              .medication-name {
                font-size: 16px;
                font-weight: 600;
                color: #191919;
                margin-bottom: 4px;
              }
              .medication-details {
                font-size: 14px;
                color: #191919;
                margin-bottom: 4px;
              }
              .dispense-text {
                font-size: 14px;
                color: #666;
                font-weight: 400;
                margin-left: 4px;
              }
              .signature-section {
                position: absolute;
                bottom: 2;
                left: 37%;
                width: 60%;
                padding-top: 20px;
                border-top: 1px solid #dee2e6;
                background-color: yellow;
              }
              .signature-image {
                width: 120px;
                height: auto;
              }
              .doctor-info {
                font-size: 12px;
                line-height: 1.4;
              }
              .page-number {
                position: absolute;
                right: 40px;
                font-size: 10px;
              }
              .drug-allergies {
                margin-bottom: 20px;
                padding-bottom: 10px;
                border-bottom: 1px solid #dee2e6;
              }
              .medications-list {
                page-break-inside: avoid;
              }
              .additional-notes {
                margin-top: 20px;
                padding: 12px;
                background-color: #F8F9FA;
                border-radius: 8px;
                border: 1px solid #E6E8EC;
                page-break-inside: avoid;
              }
              .notes-title {
                font-size: 16px;
                font-weight: 600;
                color: #191919;
                margin-bottom: 8px;
              }
              .notes-content {
                font-size: 14px;
                color: #191919;
                line-height: 1.4;
                white-space: pre-wrap;
              }
              @media print {
                .page-break {
                  page-break-before: always;
                }
              }
            </style>
          </head>
          <body>
            ${generatePages(pdfContent, content.medications)}
          </body>
        </html>
      `;

      const options = {
        html: htmlContent,
        fileName: `prescription_${Date.now()}`,
        directory: 'Documents',
        height: 842,
        width: 595,
        padding: 0,
        backgroundColor: '#ffffff',
        enablePaging: true,
      };

      const file = await RNHTMLtoPDF.convert(options);
      const pdfPath = Platform.OS === 'ios' ? `file://${file.filePath}` : file.filePath;
      setPdfFile(pdfPath);
    } catch (error) {
      console.error('Error generating PDF:', error);
      Alert.alert('Error', 'Failed to generate PDF preview');
      setLoading(false);
    }
  };

  const generatePages = (content, medications) => {
    if (!medications || medications.length === 0) {
      return '';
    }

    const MEDS_PER_PAGE = 4;
    const totalPages = Math.ceil(medications.length / MEDS_PER_PAGE);
    
    return Array.from({ length: totalPages }, (_, pageIndex) => {
      const startIdx = pageIndex * MEDS_PER_PAGE;
      const pageMeds = medications.slice(startIdx, startIdx + MEDS_PER_PAGE);
      
      if (pageMeds.length === 0) return '';

      return `
        <div class="page">
          <div class="page-content">
            <div class="left-sidebar">
              <img src="${MEDIA_URL}${content.clinicInfo.logo}" class="clinic-logo" alt="Clinic Logo" />
              <div class="virtual-clinic">VIRTUAL CLINIC</div>
              <div class="clinic-info">
                <div>Date: ${formatDate(new Date()).split(' at')[0]}</div>
                <div>${content.clinicInfo.name}</div>
                <div>${content.clinicInfo.address}</div>
                <div>Phone: ${content.clinicInfo.phone}</div>
                <div>Fax: ${content.clinicInfo.fax}</div>
              </div>
              
              <div>${content.deliveryOption === 'delivery' ? 'Delivery' : 'Pickup'} Requested</div>
              
              <div class="pharmacy-info">
                <strong>Pharmacy Details</strong><br/>
                ${content.pharmacyDetails.name}<br/>
                ${content.pharmacyDetails.address}<br/>
                ${content.pharmacyDetails.city}, ${content.pharmacyDetails.province} ${content.pharmacyDetails.postalCode}<br/>
                Phone: ${content.pharmacyDetails.phone}<br/>
                Fax: ${content.pharmacyDetails.fax}
              </div>
            </div>

            <div class="main-content">
              <div class="order-number">Order #${content.orderId}</div>
              
              ${pageIndex === 0 ? `
                <div class="patient-info">
                  <strong>Patient Details</strong><br/>
                  ${content.patientInfo.name} (PHN: ${content.patientInfo.phn})<br/>
                  ${content.patientInfo.gender}/${content.patientInfo.dob}<br/>
                  ${content.patientInfo.address}<br/>
                  ${content.patientInfo.city}, ${content.patientInfo.province} ${content.patientInfo.postalCode}<br/>
                  Phone (C): ${content.patientInfo.phoneCell}    Phone (H): ${content.patientInfo.phoneHome}
                </div>

                <div class="drug-allergies">
                  <strong>Drug Allergies</strong><br/>
                  ${content.patientInfo.allergies || 'No Known Allergies'}
                </div>
              ` : ''}

              <div class="medications-list">
                ${pageMeds.map((med, idx) => generateMedicationHTML(med)).join('')}
              </div>

              ${pageIndex === totalPages - 1 ? `
                <div class="additional-notes">
                  <div class="notes-title">Additional Notes</div>
                  <div class="notes-content">${content.additionalNotes || 'Please Note it'}</div>
                </div>
              ` : ''}
            </div>
          </div>

          <div class="signature-section">
            ${signature ? `<img src="data:image/png;base64,${signature}" class="signature-image" />` : ''}
            <div class="doctor-info">
              <div>${content.doctorInfo.name}</div>
              <div>License #${content.doctorInfo.license}</div>
              <div>Signed on ${formatDate(new Date())}</div>
            </div>
          </div>

        </div>
      `;
    }).filter(Boolean).join('');
  };

  const generateMedicationHTML = (medication) => `
    <div class="medication">
      <div class="medication-name">${medication.name}</div>
      <div class="medication-details">
        ${medication.instructions}
        ${medication.patientCompliance?.toLowerCase() === 'no' && medication.complianceFrequency 
          ? `<span class="dispense-text"> (${medication.complianceFrequency} Dispense)</span>` 
          : ''}
      </div>
      <div class="medication-details">
        <span>Quantity: ${medication.quantity}</span>
        <span style="margin-left: 20px;">Refills: ${medication.refills}</span>
      </div>
      <div class="medication-details">
        Duration: ${medication.duration} Days (${medication.startDate} - ${medication.endDate})
      </div>
    </div>
  `;

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
                  setCurrentPage(page);
                }}
                onError={(error) => {
                  console.error('PDF Error:', error);
                  Alert.alert('Error', 'Failed to load PDF preview');
                }}
                enablePaging={true}
                horizontal={false}
                scale={1.0}
                spacing={0}
                fitPolicy={0}
                singlePage={false}
                maxScale={2.0}
                minScale={1.0}
                renderActivityIndicator={() => (
                  <ActivityIndicator size="large" color="#0049F8" />
                )}
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
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    padding: 8,
    borderRadius: 4,
  },
  pageIndicatorText: {
    fontSize: 12,
    color: '#000',
  },
});

export default PDFViewer;