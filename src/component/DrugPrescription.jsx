import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, SafeAreaView, Alert, ActivityIndicator,
  FlatList, Modal, StatusBar, Platform, KeyboardAvoidingView
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useDispatch, useSelector } from 'react-redux';
import { addPatientDrug } from '../Redux/Slices/DrugSlice';
import { getMedicationList } from '../Redux/Slices/MedicationlistSlice';
import CustomHeader from './CustomHeader';
import PrescriptionPreview from '../components/PrescriptionPreview';

const DrugPrescription = ({ route, navigation }) => {
  const dispatch = useDispatch();
  const { 
    demographicNo, 
    condition,
    firstName,
    lastName,
    phn,
    dob,
    gender,
    allergies,
    address,
    city,
    province,
    postalCode,
    phoneCell,
    phoneWork,
    phoneHome,
    preferredPharmacy
  } = route.params;
  
  // Update selectors to match the state structure from MedicationlistSlice
  const medicationState = useSelector((state) => state.auth.medication);
  const medications = medicationState?.medications || [];
  const loading = medicationState?.loading;

  const [drugs, setDrugs] = useState([]);

  const [drugData, setDrugData] = useState({
    drugName: '',
    startDate: new Date(),
    duration: '',
    quantity: '',
    refills: '',
    instructions: '',
  });

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showDrugDropdown, setShowDrugDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [endDate, setEndDate] = useState('');
  
  // Filter medications based on search query
  const filteredMedications = medications.filter(med => 
    med.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Show SIG (instructions) for the selected drug
  const selectedMedication = medications.find(med => med.name === drugData.drugName);

  const [showPreview, setShowPreview] = useState(false);
  const [additionalNotes, setAdditionalNotes] = useState('');

  const [editingDrugIndex, setEditingDrugIndex] = useState(null);

  const [submitLoading, setSubmitLoading] = useState(false);

  const [prescriptionBatchId, setPrescriptionBatchId] = useState(null);

  const [isOtherDrug, setIsOtherDrug] = useState(false);

  useEffect(() => {
    // Fetch medications when component mounts
    const fetchMedications = async () => {
      try {
        await dispatch(getMedicationList(condition)).unwrap();
      } catch (error) {
        console.error('Error fetching medications:', error);
        Alert.alert('Error', 'Failed to fetch medication list');
      }
    };

    fetchMedications();
  }, [dispatch, condition]);

  useEffect(() => {
    if (drugData.startDate && drugData.duration) {
      setEndDate(calculateEndDate(drugData.startDate, drugData.duration));
    } else {
      setEndDate('');
    }
  }, [drugData.startDate, drugData.duration]);

  useEffect(() => {
    let baseSig = selectedMedication?.sig || '';
    let customSig = drugData.instructions;

    // Remove any previous auto-generated lines from the end
    customSig = customSig
      .replace(/Follow up in \d+ days\.?/gi, '')
      .replace(/\d+\s*Refills allowed\.?/gi, '')
      .replace(/Quantity allowed: \d+\.?/gi, '')
      .trim();

    // Compose the auto-generated part
    let autoSig = '';
    if (drugData.duration) {
      autoSig += ` Follow up in ${drugData.duration} days.`;
    }
    if (drugData.refills) {
      // Format refills with leading zero if less than 10
      const refillsStr = drugData.refills.toString().padStart(2, '');
      autoSig += ` ${refillsStr} Refills allowed.`;
    }

    // Combine the custom SIG and auto-generated part
    let finalSig = customSig + autoSig;

    setDrugData(prev => ({
      ...prev,
      instructions: finalSig.trim()
    }));
    // eslint-disable-next-line
  }, [drugData.duration, drugData.refills]);

  // Render each medication item in the dropdown
  const renderMedicationItem = ({ item }) => (
    <TouchableOpacity
      style={styles.dropdownItem}
      onPress={() => {
        if (editingDrugIndex !== null) {
          handleEditDrug(editingDrugIndex, 'drugName', item.name);
          handleEditDrug(editingDrugIndex, 'instructions', item.sig || '');
          setEditingDrugIndex(null);
        } else {
          setDrugData({
            ...drugData,
            drugName: item.name,
            instructions: item.sig || '',
            startDate: new Date(),
            duration: '',
            quantity: '',
            refills: '',
          });
        }
        setShowDrugDropdown(false);
        setSearchQuery('');
      }}
    >
      <Text style={styles.dropdownItemText}>{item.name}</Text>
    </TouchableOpacity>
  );

  // Drug search dropdown modal
  const DrugDropdownModal = () => (
    <Modal
      visible={showDrugDropdown}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setShowDrugDropdown(false)}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Medication</Text>
            <TouchableOpacity
              style={styles.cancelIconButton}
              onPress={() => setShowDrugDropdown(false)}
            >
              <Text style={styles.cancelIconText}>✕</Text>
            </TouchableOpacity>
          </View>
          <TextInput
            style={styles.searchInput}
            placeholder="Search medications..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <ScrollView>
            {filteredMedications.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={styles.dropdownItem}
                onPress={() => {
                  setIsOtherDrug(false);
                  if (editingDrugIndex !== null) {
                    handleEditDrug(editingDrugIndex, 'drugName', item.name);
                    handleEditDrug(editingDrugIndex, 'instructions', item.sig || '');
                    setEditingDrugIndex(null);
                  } else {
                    setDrugData({
                      ...drugData,
                      drugName: item.name,
                      instructions: item.sig || '',
                      startDate: new Date(),
                      duration: '',
                      quantity: '',
                      refills: '',
                    });
                  }
                  setShowDrugDropdown(false);
                  setSearchQuery('');
                }}
              >
                <Text style={styles.dropdownItemText}>{item.name}</Text>
              </TouchableOpacity>
            ))}
            {/* Add the "Other" option */}
            <TouchableOpacity
              style={styles.dropdownItem}
              onPress={() => {
                setIsOtherDrug(true);
                setShowDrugDropdown(false);
                setDrugData({
                  ...drugData,
                  drugName: '',
                  instructions: '',
                  startDate: new Date(),
                  duration: '',
                  quantity: '',
                  refills: '',
                });
              }}
            >
              <Text style={[styles.dropdownItemText, { fontStyle: 'italic', color: 'black' }]}>Other</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  const DrugCard = ({ drug, onDelete, index, onEdit, calculateEndDate }) => (
    <View style={styles.drugCard}>
      <View style={styles.drugCardHeader}>
        <TextInput
          style={[styles.input, styles.drugInput]}
          value={drug.drugName}
          onChangeText={(text) => onEdit(index, 'drugName', text)}
          placeholder="Select or type medication..."
          onFocus={() => {
            setShowDrugDropdown(true);
            setEditingDrugIndex(index);
          }}
        />
        <TouchableOpacity onPress={() => onDelete(index)} style={styles.deleteButton}>
          <Text style={styles.deleteButtonText}>✕</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.drugCardContent}>
        <View style={styles.row}>
          <View style={styles.halfInput}>
            <Text style={styles.label}>Start Date</Text>
            <TextInput
              style={styles.input}
              value={drug.startDate ? drug.startDate.toISOString().split('T')[0] : ''}
              onChangeText={(text) => onEdit(index, 'startDate', new Date(text))}
              placeholder="YYYY-MM-DD"
            />
          </View>
          <View style={styles.halfInput}>
            <Text style={styles.label}>Duration (Days)</Text>
            <TextInput
              style={styles.input}
              value={drug.duration}
              onChangeText={(text) => onEdit(index, 'duration', text)}
              keyboardType="numeric"
              placeholder="Duration"
            />
          </View>
        </View>
        <View style={styles.row}>
          <View style={styles.halfInput}>
            <Text style={styles.label}>End Date</Text>
            <TextInput
              style={styles.input}
              value={
                drug.startDate && drug.duration
                  ? calculateEndDate(drug.startDate, drug.duration)
                  : ''
              }
              editable={false}
              placeholder="Auto-calculated"
              placeholderTextColor="#999"
            />
          </View>
        </View>
        <View style={styles.row}>
          <View style={styles.halfInput}>
            <Text style={styles.label}>Quantity</Text>
            <TextInput
              style={styles.input}
              value={drug.quantity}
              onChangeText={(text) => onEdit(index, 'quantity', text)}
              keyboardType="numeric"
              placeholder="Quantity"
            />
          </View>
          <View style={styles.halfInput}>
            <Text style={styles.label}>Refills</Text>
            <TextInput
              style={styles.input}
              value={drug.refills}
              onChangeText={(text) => onEdit(index, 'refills', text)}
              keyboardType="numeric"
              placeholder="Refills"
            />
          </View>
        </View>
        <Text style={styles.label}>Instructions (SIG)</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={drug.instructions}
          onChangeText={(text) => onEdit(index, 'instructions', text)}
          multiline
          placeholder="Instructions"
        />
      </View>
    </View>
  );

  const handleSubmit = async () => {
    try {
      setSubmitLoading(true);
      // Validate if there's any data to submit
      if (!drugData.drugName && drugs.length === 0) {
        Alert.alert('Error', 'Please add at least one medication');
        return;
      }
  
      // Get all drugs including the current one if it has data
      let allDrugs = [...drugs];
      if (drugData.drugName) {
        // Validate current drug data
        if (!drugData.duration || !drugData.quantity) {
          Alert.alert('Error', 'Please fill in all required fields for the current medication');
          return;
        }
        allDrugs.push(drugData);
      }
  
      // Format drugs data
      const formattedDrugs = allDrugs.map(drug => ({
        indication: condition || '',
        instructions: drug.instructions || '',
        duration: parseInt(drug.duration) || 0,
        quantity: parseInt(drug.quantity) || 0,
        repeat: parseInt(drug.refills) || 0,
        groupName: drug.drugName,
        drugForm: "",
        dosage: "",
        startDate: drug.startDate.toISOString().split('T')[0],
        longTerm: false
      }));
  
      const payload = {
        demographicNo: parseInt(demographicNo),
        appointmentNo: parseInt(route.params.appointmentNo),
        drugData: formattedDrugs
      };
  
      console.log('Submitting payload:', JSON.stringify(payload, null, 2));
  
      const result = await dispatch(addPatientDrug(payload)).unwrap();
      console.log('API Response:', result);
  
      // Store the prescriptionBatchId from the API response
      if (result?.data?.prescriptionBatchId) {
        setPrescriptionBatchId(result.data.prescriptionBatchId);
      }
  
      // Success case - both 204 and Success status
      if (result && (result.status === 'Success' || result.status === 204)) {
        if (route.params?.onDone) {
          route.params.onDone();
        }
        setShowPreview(true);
      } else {
        throw new Error('Failed to add prescriptions');
      }
    } catch (error) {
      console.error('Error in handleSubmit:', error);
      Alert.alert(
        'Error',
        error?.message || 'Failed to add prescriptions. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleAddOrUpdateDrug = () => {
    if (!drugData.drugName) {
      Alert.alert('Error', 'Please fill in the current drug details first');
      return;
    }
    if (editingDrugIndex !== null) {
      // Update existing drug
      const updatedDrugs = [...drugs];
      updatedDrugs[editingDrugIndex] = { ...drugData };
      setDrugs(updatedDrugs);
      setEditingDrugIndex(null);
    } else {
      // Add new drug
      setDrugs([...drugs, drugData]);
    }
    // Reset form and isOtherDrug
    setDrugData({
      drugName: '',
      startDate: new Date(),
      duration: '',
      quantity: '',
      refills: '',
      instructions: '',
    });
    setIsOtherDrug(false);
  };

  // Add function to handle deleting a drug
  const handleDeleteDrug = (index) => {
    const newDrugs = drugs.filter((_, i) => i !== index);
    setDrugs(newDrugs);
  };

  const calculateEndDate = (start, duration) => {
    if (!start || !duration) return '';
    const startDt = new Date(start);
    const days = parseInt(duration, 10);
    if (isNaN(days)) return '';
    const result = new Date(startDt);
    result.setDate(result.getDate() + days);
    return result.toISOString().split('T')[0];
  };

  // Add these handler functions for the PrescriptionPreview
  const handlePrintAndPaste = () => {
    setShowPreview(false);
    navigation.goBack();
  };

  const handleFaxAndPaste = () => {
    setShowPreview(false);
    navigation.goBack();
  };

  const handleEditDrug = (index, field, value) => {
    const updatedDrugs = [...drugs];
    updatedDrugs[index] = {
      ...updatedDrugs[index],
      [field]: field === 'startDate' ? new Date(value) : value
    };

    // If duration or refills changed, update instructions (SIG)
    if (field === 'duration' || field === 'refills') {
      const baseSig = updatedDrugs[index].instructions
        // Remove previous auto-generated lines
        .replace(/Follow up in \d+ days\.?/gi, '')
        .replace(/\d+\s*Refills allowed\.?/gi, '')
        .replace(/Quantity allowed: \d+\.?/gi, '')
        .trim();

      let autoSig = '';
      if (updatedDrugs[index].duration) {
        autoSig += ` Follow up in ${updatedDrugs[index].duration} days.`;
      }
      if (updatedDrugs[index].refills !== undefined && updatedDrugs[index].refills !== '') {
        const refillsStr = updatedDrugs[index].refills.toString();
        autoSig += ` ${refillsStr} Refills allowed.`;
      }

      updatedDrugs[index].instructions = (baseSig + autoSig).trim();
    }

    setDrugs(updatedDrugs);
  };

  const handleEditDrugClick = (index) => {
    setDrugData({ ...drugs[index] });
    setEditingDrugIndex(index);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <CustomHeader title="Drug Prescription" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0049F8" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <>
      <StatusBar
        backgroundColor="#0049F8"
        barStyle="light-content"
        translucent={false}
      />
      {Platform.OS === 'ios' && (
        <View style={{ height: 44, backgroundColor: '#0049F8' }}>
          <StatusBar barStyle="light-content" />
        </View>
      )}
      {Platform.OS === 'android' && (
        <StatusBar backgroundColor="#0049F8" barStyle="light-content" />
      )}
      <SafeAreaView style={styles.container}>
        <CustomHeader title="Drug Prescription" />
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
        >
          <ScrollView style={styles.scrollView} keyboardShouldPersistTaps="handled">
            <View style={styles.formContainer}>
              <TouchableOpacity style={styles.closeButton} onPress={() => navigation.goBack()}>
                {/* <Text style={styles.closeText}>✕</Text> */}
              </TouchableOpacity>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Drug Name</Text>
                <View style={styles.drugInputContainer}>
                  {isOtherDrug ? (
                    <TextInput
                      style={[styles.input, styles.drugInput]}
                      value={drugData.drugName}
                      onChangeText={(text) => setDrugData({ ...drugData, drugName: text })}
                      placeholder="Enter custom drug name"
                    />
                  ) : (
                    <TextInput
                      style={[styles.input, styles.drugInput]}
                      value={drugData.drugName}
                      onChangeText={(text) => setDrugData({ ...drugData, drugName: text })}
                      placeholder="Select or type medication..."
                      onFocus={() => setShowDrugDropdown(true)}
                    />
                  )}
                </View>
              </View>

              <DrugDropdownModal />

              {/* Show SIG if a drug is selected */}
   

              <Text style={styles.label}>Start Date</Text>
              <TouchableOpacity
                style={styles.input}
                onPress={() => setShowDatePicker(true)}
              >
                <Text style={{fontSize:14}}>{drugData.startDate.toISOString().split('T')[0]}</Text>
              </TouchableOpacity>

              {showDatePicker && (
                <DateTimePicker
                  value={editingDrugIndex !== null ? drugs[editingDrugIndex].startDate : drugData.startDate}
                  mode="date"
                  display="default"
                  onChange={(event, selectedDate) => {
                    setShowDatePicker(false);
                    if (selectedDate) {
                      if (editingDrugIndex !== null) {
                        handleEditDrug(editingDrugIndex, 'startDate', selectedDate);
                        setEditingDrugIndex(null);
                      } else {
                        setDrugData({ ...drugData, startDate: selectedDate });
                      }
                    }
                  }}
                />
              )}

              <View style={styles.row}>
                <View style={styles.halfInput}>
                  <Text style={styles.label}>Duration (Days)</Text>
                  <TextInput
                    style={styles.input}
                    value={drugData.duration}
                    onChangeText={(text) => setDrugData({ ...drugData, duration: text })}
                    keyboardType="numeric"
                  />
                </View>

                <View style={styles.halfInput}>
                  <Text style={styles.label}>End Date</Text>
                  <TextInput
                    style={styles.input}
                    value={endDate || 'Auto-calculated'}
                    editable={false}
                    placeholder="Auto-calculated"
                    placeholderTextColor="#999"
                  />
                </View>
              </View>

              <View style={styles.row}>
                <View style={styles.halfInput}>
                  <Text style={styles.label}>Quantity</Text>
                  <TextInput
                    style={styles.input}
                    value={drugData.quantity}
                    onChangeText={(text) => setDrugData({ ...drugData, quantity: text })}
                    keyboardType="numeric"
                    placeholder="Quantity"
                  />
                </View>
                <View style={styles.halfInput}>
                  <Text style={styles.label}>Refills</Text>
                  <TextInput
                    style={styles.input}
                    value={drugData.refills}
                    onChangeText={(text) => setDrugData({ ...drugData, refills: text })}
                    keyboardType="numeric"
                    placeholder="Refills"
                  />
                </View>
              </View>

              <Text style={styles.label}>Instructions (SIG)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={drugData.instructions}
                onChangeText={(text) => setDrugData({ ...drugData, instructions: text })}
                multiline
                placeholder="Apply a thin layer to affected area..."
              />

              <TouchableOpacity 
                style={styles.secondaryButton}
                onPress={handleAddOrUpdateDrug}
              >
                <Text style={styles.secondaryText}>
                  {editingDrugIndex !== null ? 'Save Changes' : '+ Add Another Drug'}
                </Text>
              </TouchableOpacity>

              {drugs.length > 0 && (
                <View style={styles.drugsList}>
                  <Text style={styles.drugsListTitle}>Added Medications</Text>
                  {drugs.map((drug, index) => (
                    <DrugCard
                      key={index}
                      drug={drug}
                      onDelete={handleDeleteDrug}
                      onEdit={handleEditDrug}
                      index={index}
                      calculateEndDate={calculateEndDate}
                    />
                  ))}
                </View>
              )}

              <View style={styles.buttonRow}>
                {/* <TouchableOpacity style={styles.blueButton}>
                  <Text style={styles.buttonText}>Generate SOAP Note</Text>
                </TouchableOpacity> */}
                <TouchableOpacity style={styles.greenButton} onPress={handleSubmit} disabled={submitLoading}>
                  {submitLoading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.buttonText}>Write Prescription</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
        <PrescriptionPreview
          visible={showPreview}
          onClose={() => setShowPreview(false)}
          prescriptionData={{
            data: {
              appointmentNo: Number(route.params.appointmentNo),
              prescriptionBatchId: prescriptionBatchId,
              drugData: [...drugs, ...(drugData.drugName ? [drugData] : [])].map(drug => ({
                groupName: drug.drugName,
                drugForm: "",
                route: "",
                dosage: "",
                instructions: drug.instructions,
                startDate: drug.startDate.toISOString().split('T')[0],
                endDate: calculateEndDate(drug.startDate, drug.duration),
                duration: parseInt(drug.duration) || 0,
                quantity: parseInt(drug.quantity) || 0,
                repeat: parseInt(drug.refills) || 0,
                indication: condition || '',
                patientCompliance: 'Yes',
                longTerm: false
              }))
            }
          }}
          patientDetails={{
            demographicNo: demographicNo,
            appointmentNo: route.params.appointmentNo,
            firstName: firstName,
            lastName: lastName,
            phn: phn,
            dob: dob,
            gender: gender,
            allergies: allergies,
            patientAddress: {
              address: address,
              city: city,
              province: province,
              postalCode: postalCode,
              phoneCell: phoneCell,
              phoneWork: phoneWork,
              phoneHome: phoneHome,
              preferredPharmacy: preferredPharmacy,
            }
          }}
          additionalNotes={additionalNotes}
          setAdditionalNotes={setAdditionalNotes}
          onPrintAndPaste={handlePrintAndPaste}
          onFaxAndPaste={handleFaxAndPaste}
        />
      </SafeAreaView>
    </>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  scrollView: { flex: 1 },
  formContainer: { padding: 16 },
  label: { fontSize: 14, fontWeight: '250', marginVertical: 4 },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    backgroundColor: '#fff',
    color: '#333',
  },
  textArea: {
    height: 100, textAlignVertical: 'top'
  },
  // closeButton: { alignItems: 'flex-end', marginBottom: 10,borderRadius:10,paddingBottom:10 },
  // closeText: { fontSize: 24, color: '#e74c3c',padding:6,textAlign:'center' },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  halfInput: { flex: 0.48 },
  secondaryButton: {
    backgroundColor: '#f8f9fa',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginVertical: 20,
    borderWidth: 1,
    borderColor: '#0049F8',
    borderStyle: 'dashed',
  },
  secondaryText: {
    fontSize: 16,
    color: '#0049F8',
    fontWeight: '500',
  },
  buttonRow: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: 12,
    marginTop: 20,
    marginBottom: 30,
  },
  blueButton: {
    backgroundColor: '#0049F8',
    padding: 14,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',

 
  },
  greenButton: {
    backgroundColor: '#27ae60',
    padding: 14,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#000',
 
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingTop: 15,
    paddingBottom: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '500',
    color: '#333',
  },
  cancelIconButton: {
    padding: 8,
  },
  cancelIconText: {
    fontSize: 22,
    color: '#e74c3c',
    fontWeight: 'bold',
  },
  dropdownItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  dropdownItemText: {
    fontSize: 16,
    color: '#333',
  },
  selectedDrugText: {
    color: '#333',
    fontSize: 16,
  },
  placeholderText: {
    color: '#999',
    fontSize: 16,
  },
  sigContainer: {
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    padding: 10,
    marginVertical: 8,
  },
  sigLabel: {
    fontWeight: '400',
    color: '#333',
    marginBottom: 2,
  },
  sigText: {
    color: '#444',
    fontSize: 12,
  },
  drugsList: {
    marginTop: 20,
    marginBottom: 10,
  },
  drugsListTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 15,
    color: '#333',
  marginLeft:2
  },
  drugCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,

    marginBottom: 15,
    
    borderColor: '#e0e0e0',
   
 
   
  },
  drugCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingBottom: 8,
  },
  drugCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0049F8',
    flex: 1,
  },
  drugCardContent: {
    
  },
  drugCardRow: {
    flexDirection: 'row',
    alignItems: 'center',

  },
  drugCardLabel: {
    width: 100,
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  drugCardInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    padding: 8,
    fontSize: 14,
    backgroundColor: '#fff',
  },
  drugCardTextArea: {
    height: 60,
    
  },
  drugCardText: {
    fontSize: 14,
    color: '#333',
  },
  deleteButton: {
    padding: 8,
    backgroundColor: '#fff0f0',
    borderRadius: 20,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButtonText: {
    fontSize: 16,
    color: '#ff4444',
    fontWeight: '600',
  },
  searchInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    margin: 16,
    fontSize: 14,
    backgroundColor: '#fff',
  },
  inputContainer: {
    marginBottom: 16,
  },
  drugInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  drugInput: {
    flex: 1,
    marginRight: 8,
  },
  selectButton: {
    backgroundColor: '#0049F8',
    padding: 12,
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  selectButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
});

export default DrugPrescription;
