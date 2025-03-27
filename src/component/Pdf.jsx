import React from 'react';
import { Modal, View, TouchableOpacity, Text, StyleSheet, ScrollView, Image, Alert, ActivityIndicator } from 'react-native';
import RNHTMLtoPDF from 'react-native-html-to-pdf';
import Pdf from 'react-native-pdf';

const MEDIA_URL =  'https://api.bimble.pro/media/';

const PDFViewer = ({ visible, onClose, pdfContent, signature, additionalNotes, onDownload }) => {
  const [loading, setLoading] = React.useState(true);
  const [pdfFile, setPdfFile] = React.useState(null);

  React.useEffect(() => {
    if (visible && pdfContent) {
      console.log('Logo URL:', pdfContent?.clinicInfo?.logo);
      generatePDF();
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
                min-height: 29.7cm;
              }
              .container {
                display: flex;
                position: relative;
                height: calc(100% - 120px);
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
              }
              .signature-section {
                position: absolute;
                bottom: 120px;
                left: 5%;
                width: 100%;
                text-align: left;
                padding: 0;
                margin: 0;
                border-top: 2px solid #d1d5db;
              }
              .signature-image {
                width: 100px;
                height: 40px;
                margin: 0 auto 15px;
                object-fit: contain;
                display: block;
              }
              .doctor-info {
                text-align: center;
                font-size: 10px;
                line-height: 1.4;
              }
              .doctor-info p {
                margin: 0;
                padding: 0;
                margin-bottom: 3px;
              }
              .doctor-name {
                font-weight: normal;
              }
              .page-number {
                position: absolute;
                bottom: 30px;
                right: 30px;
                font-size: 9px;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <!-- Left Section -->
              <div class="left-section">
                <img 
                  src="${`${MEDIA_URL}${pdfContent?.clinicInfo?.logo}`}" 
                  class="logo" 
                  alt="Clinic Logo"
                  onerror="this.onerror=null; this.src='${MEDIA_URL}logo.png';"
                />
                <div class="date">Date: ${pdfContent?.clinicInfo?.date}</div>
                <div class="clinic-info">
                  ${pdfContent?.clinicInfo?.name}<br/>
                  ${pdfContent?.clinicInfo?.address}<br/>
                  ${pdfContent?.clinicInfo?.city}, ${pdfContent?.clinicInfo?.province} ${pdfContent?.clinicInfo?.postalCode}<br/>
                  Phone: ${pdfContent?.clinicInfo?.phone}<br/>
                  Fax: ${pdfContent?.clinicInfo?.fax}
                </div>

                <div class="pickup-status">${pdfContent?.deliveryOption} Requested</div>

                <div class="pharmacy-details">
                  <div class="pharmacy-title">Pharmacy Details</div>
                  ${pdfContent?.pharmacyDetails?.name}<br/>
                  ${pdfContent?.pharmacyDetails?.address}<br/>
                  ${pdfContent?.pharmacyDetails?.city}, ${pdfContent?.pharmacyDetails?.province} ${pdfContent?.pharmacyDetails?.postalCode}<br/>
                  Phone: ${pdfContent?.pharmacyDetails?.phone}<br/>
                  Fax: ${pdfContent?.pharmacyDetails?.fax}
                </div>
              </div>

              <div class="vertical-line"></div>

              <!-- Right Section -->
              <div class="right-section">
                <div class="patient-info">
                  <div class="patient-info-title">Patient Information</div>
                  ${pdfContent?.patientInfo?.name} (PHN: ${pdfContent?.patientInfo?.phn})<br/>
                  ${pdfContent?.patientInfo?.gender}/${pdfContent?.patientInfo?.dob}<br/>
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

                <div class="medications">
                  ${pdfContent?.medications?.map(med => `
                    <div class="medication">
                      <div class="medication-name">${med.name} (${med.form})</div>
                      <div class="medication-details">${med.instructions}</div>
                      <div class="medication-details">${med.startDate} - ${med.endDate} (${med.duration} days)</div>
                      <div class="medication-details">Total Qty: ${med.quantity} Refills: ${med.refills}</div>
                    </div>
                  `).join('')}
                </div>
              </div>
            </div>

            <!-- Signature Section -->
            <div class="signature-section">
              ${signature ? `
                <img 
                  src="data:image/png;base64,${signature}" 
                  class="signature-image"
                  alt="Doctor's Signature"
                />
              ` : ''}
              <div class="doctor-info">
                <p style="margin-bottom: 3px;">${pdfContent?.doctorInfo?.name }</p>
                <p style="margin-bottom: 3px;">License #${pdfContent?.doctorInfo?.license}</p>
                <p style="margin-bottom: 3px;">Signed on ${pdfContent?.doctorInfo?.signedDate }</p>
              </div>
            </div>

            <div class="page-number">Page 1 of 1</div>
          </body>
        </html>
      `;

      const options = {
        html: htmlContent,
        fileName: `prescription_${Date.now()}`,
        directory: 'Documents',
        height: 842, // A4 height
        width: 595,  // A4 width
        padding: 0,
        backgroundColor: '#ffffff',
      };

      const file = await RNHTMLtoPDF.convert(options);
      setPdfFile(file.filePath);
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
            <Text style={styles.headerTitle}>Prescription Preview</Text>
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
                source={{ uri: `file://${pdfFile}` }}
            style={styles.pdf}
                onLoadComplete={(numberOfPages, filePath) => {
                  console.log(`PDF loaded: ${numberOfPages} pages`);
            }}
            onError={(error) => {
                  console.log('PDF Error:', error);
                  Alert.alert('Error', 'Failed to load PDF preview');
                }}
                enablePaging={true}
                horizontal={false}
                scale={1.0}
                spacing={0}
                fitPolicy={0}
                renderActivityIndicator={() => (
                  <ActivityIndicator size="large" color="#0049F8" />
                )}
              />
            </View>
          ) : (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>Failed to generate PDF preview</Text>
            </View>
          )}

          <View style={styles.downloadSection}>
            <TouchableOpacity 
              style={styles.downloadButton}
              onPress={onDownload}
              disabled={loading || !pdfFile}
            >
              <Text style={styles.downloadButtonText}>
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
  },
  pdf: {
    flex: 1,
    backgroundColor: '#ffffff',
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
  downloadSection: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E6E8EC',
    backgroundColor: '#fff',
  },
  downloadButton: {
    backgroundColor: '#0049F8',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  downloadButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
});

export default PDFViewer;