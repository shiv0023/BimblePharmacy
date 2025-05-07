import React, { useState, useRef, useEffect } from 'react';
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
  Share,
  KeyboardAvoidingView,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import Signature from 'react-native-signature-capture';
import { fetchClinicDetails } from '../Redux/Slices/ClinicDetails';
import PDFViewer from '../component/Pdf';
import { useNavigation, useRoute } from '@react-navigation/native';
import { fetchPatientDetails, fetchEncounterNotes, saveRxEncounterNotes } from '../Redux/Slices/PatientDetailsSlice';


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
  patientDetails: initialPatientDetails,

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
  const [pdfContent, setPdfContent] = useState(null);
  const [pdfUri, setPdfUri] = useState(null);
  const [showPdfViewer, setShowPdfViewer] = useState(false);
  const navigation = useNavigation();
  const route = useRoute();

  const demographicNo = initialPatientDetails?.demographicNo;
  const patientData = useSelector(
    state => demographicNo ? state.auth.patientDetails.data[demographicNo] : initialPatientDetails
  ) || initialPatientDetails;

  // console.log('Patient Data:', patientData);
  

  const formatDate = (date) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const d = new Date(date);
    const month = months[d.getMonth()];
    const day = d.getDate();
    const year = d.getFullYear();
    return ` ${month} ${day}, ${year}`;
  };

  const formatDateForDOB = (dateString) => {
    if (!dateString) return '';
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const date = new Date(dateString);
    const month = months[date.getMonth()];
    const day = date.getDate();
    const year = date.getFullYear();
    return `${month} ${day}, ${year}`;
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

  const getBatchId = () => {
    if (prescriptionData?.data?.prescriptionBatchId) {
      return prescriptionData.data.prescriptionBatchId;
    }
    return `batch_${Math.floor(100000 + Math.random() * 900000)}`;
  };

  // Fetch clinic details when component mounts
  React.useEffect(() => {
    if (visible) {
      dispatch(fetchClinicDetails());
    }
  }, [dispatch, visible]);

  // Add this useEffect for debugging
  React.useEffect(() => {
    if (clinicDetails?.logo) {
      console.log('Clinic Logo URL:', `https://api.bimble.pro/media/${clinicDetails.logo}`);
      // Test if the image is accessible
      fetch(`https://api.bimble.pro/media/${clinicDetails.logo}`)
        .then(response => {
          if (!response.ok) {
            console.error('Logo fetch failed:', response.status);
          }
        })
        .catch(error => console.error('Error fetching logo:', error));
    }
  }, [clinicDetails]);

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

  // First, add a function to validate required fields
  const validateFields = () => {
    const requiredFields = [
      { value: signature, message: 'Please add your signature' },
      { value: patientData?.firstName, message: 'Patient first name is required' },
      { value: patientData?.lastName, message: 'Patient last name is required' },
      { value: patientData?.phn, message: 'Patient PHN is required' },
      { value: prescriptionData?.data?.drugData?.length, message: 'At least one medication is required' },
    ];

    for (const field of requiredFields) {
      if (!field.value) {
        return field.message;
      }
    }

    return null;
  };

  // Update the handleGeneratePDF function
  const handleGeneratePDF = async () => {
    try {
      // Set loading state to true when starting
      setIsGeneratingPdf(true);

      // Validate fields
      const validationError = validateFields();
      if (validationError) {
        Alert.alert('Required Fields', validationError);
        setIsGeneratingPdf(false); // Reset loading state if validation fails
        return;
      }

      // Show loading state
      Alert.alert(
        'Generating PDF',
        'Please wait while we generate your prescription...',
        [],
        { cancelable: false }
      );

      // Log allergies before PDF generation
      console.log('Allergies for PDF:', patientData.allergies);

      // Format the data for PDF generation
      // const content = {
      //   orderId: prescriptionData?.data?.prescriptionBatchId ||'',
      //   clinicInfo: {
      //     logo: clinicDetails?.logo,
      //     date: formatDate(new Date()),
      //     name: clinicDetails?.clinicName,
      //     address: clinicDetails?.address,
      //     city: clinicDetails?.city,
      //     province: getProvinceAbbreviation(clinicDetails?.province),
      //     postalCode: clinicDetails?.postalCode,
      //     phone: formatPhoneNumber(clinicDetails?.phoneNo),
      //     fax: formatPhoneNumber(clinicDetails?.faxNo)
      //   },
      //   pharmacyDetails: {
      //     name: patientData.pharmacyName,
      //     address: patientData.address,
      //     city: patientData.city,
      //     province: getProvinceAbbreviation(patientData.province),
      //     postalCode: patientData.postalCode,
      //     phone: formatPhoneNumber(patientData.ext_data?.demo_cell),
      //     fax: formatPhoneNumber(patientData.phoneWork)
      //   },
       
      //   medications: prescriptionData?.data?.drugData?.map(drug => ({
      //     name: drug.groupName,
      //     route: drug.route || 'Topical',
      //     form: drug.drugForm || '',
      //     instructions: drug.instructions,
      //     startDate: formatDate(drug.startDate),
      //     endDate: formatDate(drug.endDate),
      //     duration: drug.duration || '1',
      //     quantity: drug.quantity || '2',
      //     refills: drug.repeat || '0',
      //     indication: drug.indication,
      //     drugForm: drug.drugForm || ''
      //   })) || [],
      //   deliveryOption: deliveryOption,
      //   signature: signature,
      //   doctorInfo: {
      //     name: 'Dr.doctor oscardoc',
      //     license: '98765',
      //     signedDate: new Date().toLocaleString()
      //   }
      // };

      // Set the content and show the PDF viewer
      setPdfContent(content);
      setShowPdfViewer(true);
    } catch (error) {
      console.error('Error generating PDF:', error);
      Alert.alert('Error', 'Failed to generate PDF');
    } finally {
      // Reset loading state when done
      setIsGeneratingPdf(false);
    }
  };

  // Add this debug log for patientDetails
  // console.log('PrescriptionPreview patientDetails:', patientData);

  // Update the Drug Allergies section
  const renderAllergies = () => {
    console.log('Rendering allergies:', patientData.allergies);
    
    if (!patientData.allergies) {
      return (
        <View style={styles.allergyItem}>
          <Text style={styles.allergiesText}>No Known Allergies</Text>
        </View>
      );
    }

    if (Array.isArray(patientData.allergies)) {
      return patientData.allergies.map((allergy, index) => (
        <View key={index} style={styles.allergyItem}>
          <Text style={styles.allergiesText}>
            {allergy}
            {index < patientData.allergies.length - 1 ? ', ' : ''}
          </Text>
        </View>
      ));
    }

    // Handle string case
    return (
      <View style={styles.allergyItem}>
        <Text style={styles.allergiesText}>{patientData.allergies}</Text>
      </View>
    );
  };

  useEffect(() => {
    if (visible && demographicNo) {
      dispatch(fetchPatientDetails({ demographicNo }));
    }
  }, [visible, demographicNo, dispatch]);

  if (!visible) return null;

  // if (patientDetailsState?.loading) {
  //   return (
  //     <Modal visible={visible} animationType="slide" transparent={true}>
  //       <View style={styles.modalOverlay}>
  //         <View style={styles.modalContent}>
  //           <View style={styles.loadingContainer}>
  //             <ActivityIndicator size="large" color="#0049F8" />
  //             <Text style={styles.loadingText}>Loading patient details...</Text>
  //           </View>
  //         </View>
  //       </View>
  //     </Modal>
  //   );
  // }

  const renderPatientInfo = () => (
    <View style={styles.patientInfo}>
      <Text style={styles.patientName}>
        {patientData?.firstName || ''} {patientData?.lastName || ''} 
        </Text>
        <Text style={{fontSize:14,fontWeight:300,}}>
        {patientData?.phn ? ` PHN: ${patientData.phn}` : ''}

  
      </Text>
      <Text style={styles.patientDetails}>
        {patientData?.gender || ''}/
        {formatDateForDOB(patientData?.dob)}/
        {calculateAge(patientData?.dob)} years
      </Text>
      <Text style={styles.patientDetails}>
        {patientData?.address || ''}
      </Text>
      <Text style={styles.patientDetails}>
        {patientData?.city || ''}, {getProvinceAbbreviation(patientData?.province)} {patientData?.postalCode || ''}
      </Text>
      <View style={styles.phoneContainer}>
        {patientData?.phoneHome && (
          <Text style={styles.patientDetails}>
            Phone (H): {formatPhoneNumber(patientData.phoneHome)}
          </Text>
        )}
        {patientData?.ext_data?.demo_cell && (
          <Text style={styles.patientDetails}>
            Phone (C): {formatPhoneNumber(patientData.ext_data.demo_cell)}
          </Text>
        )}
        {patientData?.phoneWork && (
          <Text style={styles.patientDetails}>
            Phone (W): {formatPhoneNumber(patientData.phoneWork)}
          </Text>
        )}
      </View>

  
    </View>
  );

  const renderMedications = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Medications</Text>
      {prescriptionData?.data?.drugData?.map((drug, index) => (
        <View key={`medication-${index}`} style={styles.medicationCard}>
          <View style={styles.medicationHeader}>
            <Text style={styles.medicationName}>
              {drug.groupName} ({drug.drugForm}) ({drug.route})
            </Text>
          </View>
          <Text style={styles.cityProvinceText}>{drug.indication}</Text>
          <Text style={styles.cityProvinceText}>
            {drug.instructions}
            {drug.patientCompliance?.toLowerCase() === 'no' && drug.complianceFrequency && (
              <Text style={styles.dispenseText}>
                {' '}({drug.complianceFrequency} Dispense)
              </Text>
            )}
          </Text>
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
  );

  const handlePrintAndPaste = async () => {
    console.log ('pressingss')
    try {
      // Only include allowed fields in drugData
      const allowedDrugFields = [
        'indication',
        'instructions',
        'duration',
        'quantity',
        'repeat',
        'groupName',
        'drugForm',
        'startDate'
      ];

      // Filter each drug object to only include allowed fields
      const filteredDrugData = (prescriptionData?.data?.drugData || []).map(drug => {
        const filtered = {};
        allowedDrugFields.forEach(field => {
          if (drug[field] !== undefined) filtered[field] = drug[field];
        });
        return filtered;
      });
console.log ( prescriptionData?.data?.appointmentNo,'Appointment NO')
      const payload = {
    
        demographicNo: Number(patientData.demographicNo),
        appointmentNo: Number(prescriptionData?.data?.appointmentNo),
        drugData: filteredDrugData
      };

      // Debug: log the payload to verify structure
      console.log('Saving Rx Encounter Notes payload:', payload);

      const result = await dispatch(saveRxEncounterNotes(payload)).unwrap();

      Alert.alert('Success', result.message || 'Record saved successfully!');
      if (onPrintAndPaste) {
        onPrintAndPaste();
      }
      setShowPreview(false);
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', error?.message || 'Failed to save Rx encounter notes');
    }
  };

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
                    <View style={styles.clinicHeader}>
                      <View style={styles.clinicLogoContainer}>
                        {clinicDetails.logo && (
                          <Image
                            source={{ 
                              uri: `https://api.bimble.pro/media/${clinicDetails.logo}`,
                              headers: {
                                'Cache-Control': 'no-cache'
                              }
                            }}
                            style={styles.clinicLogo}
                            resizeMode="contain"
                            onError={(e) => {
                              console.error('Error loading logo:', e.nativeEvent.error);
                            }}
                            onLoad={() => console.log('Logo loaded successfully')}
                          />
                        )}
                      </View>
                      <Text style={styles.batchId}>Order #{getBatchId()}</Text>
                    </View>
                    <Text style={styles.date}>{formatDate(new Date())}</Text>
                
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
              {/* <View style={styles.section}>
                <Text style={styles.recipientTitle}>Recipient</Text>
                <View style={styles.pharmacyContainer}>
                  {patientData?.pharmacyName && (
                    <>
                      <Text style={styles.cityProvinceText}>
                        {patientData.pharmacyName}
                      </Text>
                      <Text style={styles.cityProvinceText}>
                        {patientData.address}
                      </Text>
                      <Text style={styles.cityProvinceText}>
                        {patientData.city}, {getProvinceAbbreviation(patientData.province)} {patientData.postalCode}
                      </Text>
                      <Text style={styles.cityProvinceText}>
                        Phone: {formatPhoneNumber(patientData.ext_data?.demo_cell)}
                      </Text>
                    </>
                  )}
                </View>
              </View> */}

              {/* Patient Details */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Patient Information</Text>
                </View>
                {renderPatientInfo()}
              </View>

              {/* Drug Allergies */}
              {/* <View style={styles.section}>
                <Text style={styles.sectionTitle}>Drug Allergies</Text>
                <View style={styles.allergiesContainer}>
                  <Text style={styles.allergiesText}>
                    {patientData?.allergies && Array.isArray(patientData.allergies) && patientData.allergies.length > 0
                      ? patientData.allergies.filter(allergy => allergy).join(', ')
                      : 'No Known Drug Allergies (NKDA)'}
                  </Text>
                </View>
              </View> */}

              {/* Medications */}
              {renderMedications()}

              {/* Delivery Options */}
              {/* <View style={styles.section}>
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
              </View> */}

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
                <KeyboardAvoidingView 
                  behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                  keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 20}
                >
                  <TextInput
                    style={[styles.notesInput, { marginBottom: Platform.OS === 'ios' ? 120 : 80 }]}
                    multiline
                    placeholder="Add any additional notes..."
                    value={additionalNotes}
                    onChangeText={setAdditionalNotes}
                  />
                </KeyboardAvoidingView>
              </View>
            </ScrollView>

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
       
              <TouchableOpacity 
                style={[styles.actionButton, styles.printButton]}
                onPress={handlePrintAndPaste}
              >
                <Text style={styles.actionButtonText}> Print & paste into EMR</Text>
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
        onClose={() => {
          setShowPdfViewer(false);
          setPdfContent(null);
        }}
        pdfContent={pdfContent}
        signature={signature}
        additionalNotes={additionalNotes}
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
 
    
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#191919',
    marginBottom: 10,
    fontWeight:500
  },
  date: {
    fontSize: 16,
    color: '#000',
   fontWeight:'300',
   
    // marginBottom: 6,
  },
  clinicLogo: {
    width: 120,
    height: 110,
  
  },
  clinicName: {
    fontSize: 16,
    color: '#000',
    

  },
  addressContainer: {
  
  
  },
  addressText: {
    fontSize: 16,
    color: '#000',
    fontWeight:'300',
    
  },
  cityProvinceText: {
    fontSize: 16,
    marginBottom: 4,
    fontWeight: '300',
  },
  orderNumber: {
    fontSize: 14,
    color: '#0049F8',
    fontWeight: '500',
  },
  patientInfo: {
    fontSize: 16,
    marginBottom: 4,
    fontWeight: '300',
  },
  patientName: {
    fontSize: 16,
    marginBottom: 4,
    fontWeight: '300',
  },
  patientDetails: {
    fontSize: 16,
    marginBottom: 4,
    fontWeight: '300',
  },
  phoneContainer: {
    marginTop: 8,
    gap: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  allergiesText: {
    fontSize: 14,
    color: '#191919',
  },
  medicationCard: {
  
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  medicationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: 8,
    fontWeight:300
  },
  medicationName: {
    fontSize: 16,
    fontWeight: '400',
    color: '#191919',
    marginRight: 4,
  },
  dispenseText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '400',
    marginLeft: 4,
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
    maxHeight: 150,
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
    opacity: (props) => props.disabled ? 0.7 : 1,
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
  complianceInfo: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E6E8EC',
  },
  complianceContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E6E8EC',
  },
  complianceTitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  complianceValue: {
    fontSize: 16,
    color: '#191919',
    fontWeight: '500',
  },
  complianceNo: {
    color: '#191919',
  },
  frequencyContainer: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E6E8EC',
  },
  clinicHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  clinicLogoContainer: {
    flex: 1,
  },
  batchId: {
    fontSize: 14,
    color: '#0049F8',
    fontWeight: '500',
  },
  loaderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  loaderText: {
    marginLeft: 8,
  },
  disabledButton: {
    opacity: 0.7,
  },
  allergiesContainer: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },
  allergyItem: {
    marginBottom: 4,
  },
  patientInfoText: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  phnLabel: {
    fontWeight: '500',
  },
  phnValue: {
    fontWeight: '300',
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