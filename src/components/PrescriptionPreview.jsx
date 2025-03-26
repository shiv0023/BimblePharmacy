import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Platform,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import Signature from 'react-native-signature-capture';
import { fetchClinicDetails } from '../Redux/Slices/ClinicDetails';
import PDFViewer from '../component/Pdf';
import { useNavigation } from '@react-navigation/native';

const getProvinceAbbreviation = (provinceName) => {
  const provinceMap = {
    'British Columbia': 'BC',
    'Alberta': 'AB',
    'Saskatchewan': 'SK',
    'Manitoba': 'MB',
    'Ontario': 'ON',
    'Quebec': 'QC',
    'New Brunswick': 'NB',
    'Nova Scotia': 'NS',
    'Prince Edward Island': 'PE',
    'Newfoundland and Labrador': 'NL',
    'Yukon': 'YT',
    'Northwest Territories': 'NT',
    'Nunavut': 'NU'
  };
  
  return provinceMap[provinceName] || provinceName;
};

const PrescriptionPreview = ({ 
  visible, 
  onClose, 
  prescriptionData, 
  patientDetails,

  additionalNotes,
  setAdditionalNotes,

  onPrintAndPaste,
  onFaxAndPaste,
}) => {
  const dispatch = useDispatch();
  const clinicDetails = useSelector(state => state?.auth?.clinicDetails?.data);
  
  const clinicLoading = useSelector(state => state?.auth?.clinicDetails?.loading);
  const clinicError = useSelector(state => state?.auth?.clinicDetails?.error);
  const [deliveryOption, setDeliveryOption] = useState('pickup');
  const [signature, setSignature] = useState(null);
  const signatureRef = useRef();
  const [pdfContent, setPdfContent] = useState(null); // add this
  const [pdfUri, setPdfUri] = useState(null);
  const [showPdfViewer, setShowPdfViewer] = useState(false);
  const navigation = useNavigation();
  const formatDate = (date) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const d = new Date(date);
    const month = months[d.getMonth()];
    const day = d.getDate();
    const year = d.getFullYear();
    return `Date: ${month} ${day}, ${year}`;
  };

  const calculateAge = (dob) => {
    if (!dob) return 'N/A';
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  // Fetch clinic details when component mounts
  React.useEffect(() => {
    if (visible) {
      dispatch(fetchClinicDetails());
    }
  }, [dispatch, visible]);

  // Handle signature
  const handleSignature = (result) => {
    setSignature(result.encoded);
  };

  // Handle clear signature
  const handleClear = () => {
    signatureRef.current?.resetImage();
    setSignature(null);
  };

  const formatPhoneNumber = (number) => {
    if (!number) return '';
    // Remove any non-digit characters
    const cleaned = number.toString().replace(/\D/g, '');
    // Format as XXX-XXX-XXXX
    if (cleaned.length === 10) {
      return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
    return number; // Return original if not 10 digits
  };

const handleGeneratePDF = async () => {
  try {
    const content = {
      clinicInfo: {
        logo: clinicDetails?.logo,
        date: formatDate(new Date()),
        clinicName: clinicDetails?.clinicName,
        address: clinicDetails?.address,
        city: clinicDetails?.city,
        province: getProvinceAbbreviation(clinicDetails?.province),
        postalCode: clinicDetails?.postalCode,
        phone: clinicDetails?.phoneNo,
        fax: clinicDetails?.faxNo
      },
      pharmacyInfo: patientDetails?.patientAddress?.preferredPharmacy ? {
        name: patientDetails.patientAddress.preferredPharmacy.split(',')[0].trim(),
        address: patientDetails.patientAddress.preferredPharmacy.split(',')[1].trim(),
        city: patientDetails.patientAddress.preferredPharmacy.split(',')[2].trim(),
        province: patientDetails.patientAddress.preferredPharmacy.split(',')[3].trim(),
        postalCode: patientDetails.patientAddress.preferredPharmacy.split(',')[4].trim(),
        phone: patientDetails.patientAddress.preferredPharmacy.split(',')[5]?.trim(),
        fax: patientDetails.patientAddress.preferredPharmacy.split(',')[6]?.trim()
      } : null,
      patientInfo: {
        name: `${patientDetails?.firstName} ${patientDetails?.lastName}`,
        phn: patientDetails?.phn,
        gender: patientDetails?.gender,
        age: calculateAge(patientDetails?.dob),
        address: patientDetails?.patientAddress?.address,
        city: patientDetails?.patientAddress?.city,
        province: getProvinceAbbreviation(patientDetails?.patientAddress?.province),
        postalCode: patientDetails?.patientAddress?.postalCode,
        phoneCell: patientDetails?.phoneCell,
        phoneWork: patientDetails?.phoneWork,
        phoneHome: patientDetails?.phoneHome
      },
      medications: prescriptionData?.drugData?.map(drug => ({
        name: drug.groupName,
        indication: drug.indication,
        instructions: drug.instructions,
        quantity: drug.quantity,
        repeats: drug.repeat,
        duration: drug.duration,
        startDate: formatDate(drug.startDate),
        endDate: formatDate(drug.endDate)
      })),
      allergies: patientDetails?.allergies || 'No Known Allergies',
      deliveryOption: deliveryOption,
      signature: signature,
      additionalNotes: additionalNotes
    };

    setPdfContent(content);
    setShowPdfViewer(true);
  } catch (error) {
    console.error('Error generating PDF:', error);
    Alert.alert('Error', 'Failed to generate PDF');
  }
};


  if (!visible) return null;

  return (
    <>
      <Modal
        visible={visible}
        animationType="slide"
        transparent={true}
        onRequestClose={onClose}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.headerTitle}>Prescription Preview</Text>
              <TouchableOpacity 
                style={styles.closeHeaderButton}
                onPress={onClose}
              >
                <Text style={styles.closeHeaderText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.scrollView}>
              {/* Clinic Info */}
              <View style={styles.section}>
              
                {clinicLoading ? (
                  <ActivityIndicator size="small" color="#0049F8" />
                ) : clinicError ? (
                  <Text style={styles.errorText}>{clinicError}</Text>
                ) : clinicDetails ? (
                  <View>
                    {clinicDetails.logo && (
                      <Image
                        source={{ uri: `https://api.bimble.pro/media/${clinicDetails.logo}` }}
                        style={styles.clinicLogo}
                        resizeMode="contain"
                      />
                    )}
                      <Text style={styles.date}>{formatDate(new Date())}</Text>
                    <Text style={styles.clinicName}>
                      {clinicDetails.clinicName}
                    </Text>
                    <View style={styles.addressContainer}>
                      <Text style={styles.addressText}>
                        {clinicDetails.address}
                      </Text>
                      <Text style={styles.cityProvinceText}>
                        {clinicDetails.city}, {getProvinceAbbreviation(clinicDetails.province)} {clinicDetails.postalCode}
                      </Text>
                      <Text style={styles.cityProvinceText}>
                        Phone: {formatPhoneNumber(clinicDetails?.phoneNo) }
                      </Text>
                      <Text style={styles.cityProvinceText}>
                        Fax: {formatPhoneNumber(clinicDetails?.faxNo) }
                      </Text>
                    </View>
                  </View>
                ) : (
                  <Text style={styles.errorText}>No clinic details available</Text>
                )}
              </View>

              {/* Recipient/Pharmacy Section */}
              <View style={styles.section}>
                <Text style={styles.recipientTitle}>Recipient</Text>
                <View style={styles.pharmacyContainer}>
                  {patientDetails?.patientAddress?.preferredPharmacy ? (
                    <>
                      <Text style={styles.cityProvinceText}>
                        {patientDetails.patientAddress.preferredPharmacy.split(',')[0].trim()}
                      </Text>
                      <Text style={styles.cityProvinceText}>
                        {patientDetails.patientAddress.preferredPharmacy.split(',')[1].trim()}
                      </Text>
                      <Text style={styles.cityProvinceText}>
                        {patientDetails.patientAddress.preferredPharmacy.split(',')[2].trim()}, {patientDetails.patientAddress.preferredPharmacy.split(',')[3].trim()} {patientDetails.patientAddress.preferredPharmacy.split(',')[4].trim()}
                      </Text>
                      <Text style={styles.cityProvinceText}>
                        Phone: {formatPhoneNumber(patientDetails.patientAddress.preferredPharmacy.split(',')[5]?.trim()) || '604-543-6677'}
                      </Text>
                      <Text style={styles.cityProvinceText}>
                        Fax: {formatPhoneNumber(patientDetails.patientAddress.preferredPharmacy.split(',')[6]?.trim()) || '604-543-4433'}
                      </Text>
                    </>
                  ) : (
                    <>
                      {/* <Text style={styles.pharmacyName}>PROSPER PHARMACY 24</Text>
                      <Text style={styles.pharmacyAddress}>12818 72 Avenue</Text>
                      <Text style={styles.pharmacyCityProvince}>Surrey, BC V3W 2M9</Text>
                      <Text style={styles.pharmacyContact}>Phone: 604-543-6677</Text>
                      <Text style={styles.pharmacyContact}>Fax: 604-543-443333</Text> */}
                    </>
                  )}
                </View>
              </View>

              {/* Patient Details */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Patient Details</Text>
                  <Text style={styles.orderNumber}>
                    Order #{prescriptionData?.orderNumber || '_010162'}
                  </Text>
                </View>
                <View style={styles.patientInfo}>
                  <Text style={styles.cityProvinceText}>
                    {patientDetails?.firstName} {patientDetails?.lastName} (PHN {patientDetails?.phn})
                  </Text>
                  <Text style={styles.cityProvinceText}>
                    {patientDetails?.gender || 'M'}/{calculateAge(patientDetails?.dob)} years
                  </Text>
                  <Text style={styles.cityProvinceText}>
                    {patientDetails?.patientAddress?.address || patientDetails?.address || 'Curzon Road Street# 34'}
                  </Text>
                  <Text style={styles.cityProvinceText}>
                    {patientDetails?.patientAddress?.city || patientDetails?.city || 'Delta'}, {patientDetails?.patientAddress?.province || patientDetails?.province || 'BC'} {patientDetails?.patientAddress?.postalCode || patientDetails?.postalCode || 'V3W 2M9'}
                  </Text>
                  <View style={styles.cityProvinceText}>
                    <Text style={styles.cityProvinceText}>
                      Phone (C): {patientDetails?.phoneCell || '659-862-3548'} Phone (W): {patientDetails?.phoneWork || '635-489-2455'}
                    </Text>
                    <Text style={styles.cityProvinceText}>
                      Phone (H): {patientDetails?.phoneHome || '685-942-6666'}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Drug Allergies */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Drug Allergies</Text>
                <Text style={styles.allergiesText}>
                  {patientDetails?.allergies || 'No Known Allergies'}
                </Text>
              </View>

              {/* Medications */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Medications</Text>
                {prescriptionData?.drugData?.map((drug, index) => (
                  <View key={index} style={styles.medicationCard}>
                    <Text style={styles.medicationName}>{drug.groupName}</Text>
                    <Text style={styles.cityProvinceText}>{drug.indication}</Text>
                    <Text style={styles.cityProvinceText}>{drug.instructions}</Text>
                    <View style={styles.cityProvinceText}>
                      <Text style={styles.cityProvinceText}>Quantity: {drug.quantity}</Text>
                      <Text style={styles.cityProvinceText}>Repeats: {drug.repeat}</Text>
                    </View>
                    <Text style={styles.cityProvinceText}>
                      Duration: {drug.duration} Days{'\n'}
                      ({formatDate(drug.startDate)} - {formatDate(drug.endDate)})
                    </Text>
                  </View>
                ))}
              </View>

              {/* Delivery Options */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Delivery Option</Text>
                <View style={styles.deliveryOptions}>
                  <TouchableOpacity 
                    style={[
                      styles.deliveryOption,
                      deliveryOption === 'delivery' && styles.deliveryOptionSelected
                    ]}
                    onPress={() => setDeliveryOption('delivery')}
                  >
                    <Text style={[
                      styles.deliveryOptionText,
                      deliveryOption === 'delivery' && styles.deliveryOptionTextSelected
                    ]}>Delivery</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[
                      styles.deliveryOption,
                      deliveryOption === 'pickup' && styles.deliveryOptionSelected
                    ]}
                    onPress={() => setDeliveryOption('pickup')}
                  >
                    <Text style={[
                      styles.deliveryOptionText,
                      deliveryOption === 'pickup' && styles.deliveryOptionTextSelected
                    ]}>Pickup</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Signature Section */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Doctor's Signature</Text>
                <View style={styles.signatureContainer}>
                  {signature ? (
                    <View style={styles.signatureImageContainer}>
                      <Image
                        source={{ uri: `data:image/png;base64,${signature}` }}
                        style={styles.signatureImage}
                        resizeMode="contain"
                      />
                      <TouchableOpacity 
                        style={styles.clearButton}
                        onPress={handleClear}
                      >
                        <Text style={styles.clearButtonText}>Clear Signature</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <View style={styles.signaturePad}>
                      <Signature
                        ref={signatureRef}
                        onSaveEvent={handleSignature}
                        saveImageFileInExtStorage={false}
                        showNativeButtons={false}
                        showTitleLabel={false}
                        backgroundColor="#F8F9FA"
                        strokeColor="#000000"
                        minStrokeWidth={2}
                        maxStrokeWidth={3}
                        style={styles.signatureCanvas}
                      />
                      <View style={styles.signatureButtons}>
                        <TouchableOpacity 
                          style={styles.signatureButton}
                          onPress={handleClear}
                        >
                          <Text style={styles.signatureButtonText}>Clear</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                          style={styles.signatureButton}
                          onPress={() => signatureRef.current?.saveImage()}
                        >
                          <Text style={styles.signatureButtonText}>Save</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}
                </View>
              </View>

              {/* Additional Notes */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Additional Notes</Text>
                <TextInput
                  style={styles.notesInput}
                  multiline
                  placeholder="Add any additional notes..."
                  value={additionalNotes}
                  onChangeText={setAdditionalNotes}
                />
              </View>
            </ScrollView>

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              <TouchableOpacity 
                style={[styles.actionButton, styles.generateButton]}
               
              >
                <Text style={styles.actionButtonText}>Generate PDF</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.actionButton, styles.printButton]}
                onPress={onPrintAndPaste}
              >
                <Text style={styles.actionButtonText}>paste into EMR</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.actionButton, styles.faxButton]}
                onPress={onFaxAndPaste}
              >
                <Text style={styles.actionButtonText}>Fax & paste into EMR</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      <PDFViewer
  visible={showPdfViewer}
  onClose={() => setShowPdfViewer(false)}
  pdfContent={pdfContent}
/>

    </>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding:10,
    borderRadius:10,
  },
  modalContent: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    marginTop: Platform.OS === 'ios' ? 40 : 0,
    
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E6E8EC',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#191919',
  },
  closeHeaderButton: {
    padding: 8,
  },
  closeHeaderText: {
    fontSize: 20,
    color: '#666',
  },
  scrollView: {
    flex: 1,
  },
  section: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E6E8EC',
  },
  sectionHeader: {
  
    justifyContent: 'space-between',
 
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#191919',
    marginBottom: 10,
  },
  date: {
    fontSize: 16,
    color: '#000',
   
    marginBottom: 6,
  },
  clinicLogo: {
    width: 120,
    height: 110,
    marginBottom: 12,
 
  },
  clinicName: {
    fontSize: 16,
    color: '#000',
    

  },
  addressContainer: {
  
    marginTop: 8,
  },
  addressText: {
    fontSize: 16,
    color: '#000',
    lineHeight: 24,
  },
  cityProvinceText: {
    fontSize: 16,
    marginBottom: 4,
    fontWeight: '300',
  },
  orderNumber: {
    fontSize: 14,
    color: '#0049F8',
  },
  patientInfo: {
    gap: 4,
  },
  patientName: {
    fontSize: 16,
    color: '#000',
    marginBottom: 2,
  },
  patientDetails: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  patientAddress: {
    fontSize: 14,
    color: '#000',
    marginBottom: 2,
  },
  allergiesText: {
    fontSize: 14,
    color: '#191919',
  },
  medicationCard: {
    backgroundColor: '#F8F9FA',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  medicationName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#191919',
    marginBottom: 4,
  },
  medicationIndication: {
    fontSize: 14,
    color: '#191919',
    marginBottom: 4,
  },
  medicationInstructions: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  medicationDetails: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 4,
  },
  detailText: {
    fontSize: 14,
    color: '#191919',
  },
  durationText: {
    fontSize: 14,
    color: '#666',
  },
  deliveryOptions: {
    flexDirection: 'row',
    gap: 12,
  },
  deliveryOption: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E6E8EC',
    alignItems: 'center',
  },
  deliveryOptionSelected: {
    backgroundColor: '#0049F8',
    borderColor: '#0049F8',
  },
  deliveryOptionText: {
    fontSize: 14,
    color: '#191919',
  },
  deliveryOptionTextSelected: {
    color: '#fff',
  },
  notesInput: {
    borderWidth: 1,
    borderColor: '#E6E8EC',
    borderRadius: 8,
    padding: 12,
    minHeight: 100,
    fontSize: 14,
    textAlignVertical: 'top',
    backgroundColor: '#fff',
  },
  actionButtons: {
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E6E8EC',
    gap: 12,
  },
  actionButton: {
    paddingVertical: 12,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
  },
  generateButton: {
    backgroundColor: '#0049F8',
  },
  printButton: {
    backgroundColor: '#7C3AED',
  },
  faxButton: {
    backgroundColor: '#666666',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  signatureContainer: {
    marginTop: 8,
    borderRadius: 8,
    overflow: 'hidden',
  },
  signaturePad: {
    height: 200,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E6E8EC',
    overflow: 'hidden',
  },
  signatureCanvas: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  signatureButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 8,
    gap: 8,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E6E8EC',
  },
  signatureButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E6E8EC',
    backgroundColor: '#fff',
  },
  signatureButtonText: {
    fontSize: 14,
    color: '#666',
  },
  signatureImageContainer: {
    height: 200,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E6E8EC',
    overflow: 'hidden',
  },
  signatureImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F8F9FA',
  },
  clearButton: {
    position: 'absolute',
    right: 8,
    bottom: 8,
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E6E8EC',
  },
  clearButtonText: {
    fontSize: 12,
    color: '#666',
  },
  errorText: {
    color: 'red',
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  qrCode: {
    width: 80,
    height: 80,
    alignSelf: 'center',
    marginTop: 12,
  },

  pharmacySection: {
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E6E8EC',
    paddingTop: 8,
  },
  pharmacyLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#191919',
    marginBottom: 4,
  },
  pharmacyDetails: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  addressSection: {
    marginTop: 8,
    marginBottom: 8,
    gap: 4,
  },
  addressLine: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  postalCode: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  contactSection: {
    marginBottom: 8,
  },
  phoneSection: {
    marginTop: 8,
  },
  contactText: {
    fontSize: 16,
    color: '#000',
    lineHeight: 24,
  },
  recipientTitle: {
    fontSize: 20,
    fontWeight: '500',
    color: '#000',
    marginBottom: 12,
  },
  pharmacyContainer: {
    gap: 6,
  },
  pharmacyName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
    marginBottom: 4,
  },
  pharmacyAddress: {
    fontSize: 16,
    color: '#000',
    lineHeight: 24,
   
  },
  pharmacyCityProvince: {
    fontSize: 14,
    fontWeight: '300',
    marginBottom: 4,
  },
  pharmacyContact: {
    fontSize: 16,
    color: '#000',
    lineHeight: 24,
  },
});

const pdfStyles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
  },
  leftColumn: {
    width: '30%',
    padding: 20,
    borderRightWidth: 1,
    borderColor: '#E6E8EC',
  },
  rightColumn: {
    width: '70%',
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  text: {
    fontSize: 16,
    marginBottom: 5,
  },
  medicationCard: {
    marginBottom: 15,
    padding: 10,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
  },
  logo: {
    width: 120,
    height: 50,
    marginBottom: 20,
  },
  divider: {
    height: 1,
    backgroundColor: '#E6E8EC',
    marginVertical: 15,
  }
});

export default PrescriptionPreview; 