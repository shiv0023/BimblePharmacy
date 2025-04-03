import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  StatusBar,
  Alert,
  ActivityIndicator,
  Modal,
  Platform,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { addPatientDrug, searchDrugs, clearSearchResults, fetchPatientDrugs } from '../Redux/Slices/DrugSlice';
import CustomHeader from './CustomHeader';
import debounce from 'lodash/debounce';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import PrescriptionPreview from '../components/PrescriptionPreview';

// Add this tableStyles definition before the PatientDrugsTable component
const tableStyles = StyleSheet.create({
  // Legend styles
  legendContainer: {
    padding: 16,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    marginBottom: 16,
  },
  legendLabel: {
    fontSize: 16,
    color: '#191919',
    marginBottom: 12,
  },
  legendItems: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  legendItem: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 4,
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E6E8EC',
  },
  legendItemSelected: {
    backgroundColor: '#0049F8',
  },
  legendItemText: {
    color: '#666',
  },
  legendItemTextSelected: {
    color: '#fff',
  },

  // Container styles
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    overflow: 'hidden',
  },
  tableContainer: {
    flex: 1,
  },

  // Medication card styles
  medicationCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E6E8EC',
  },
  medicationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  medicationInfo: {
    flex: 1,
    marginRight: 16,
  },
  medicationName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#191919',
    marginBottom: 4,
  },
  durationText: {
    fontSize: 11,
    color: '#666666',
  },
  medicationMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityText: {
    fontSize: 14,
    color: '#191919',
    marginRight: 8,
  },
  ltMedText: {
    fontSize: 14,
    color: '#0049F8',
    fontWeight: '500',
  },
  reasonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  reasonLabel: {
    fontSize: 14,
    color: '#666666',
    marginRight: 8,
  },
  reasonText: {
    fontSize: 14,
    color: '#191919',
    flex: 1,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  actionButton: {
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 6,
    borderWidth: 1,
  },
  represcribeButton: {
    backgroundColor: '#E3F2FD',
    borderColor: '#0049F8',
  },
  deleteButton: {
    backgroundColor: '#FEE2E2',
    borderColor: '#DC2626',
  },
  discontinueButton: {
    backgroundColor: '#FFF3CD',
    borderColor: '#FFC107',
  },
  represcribeText: {
    color: '#0049F8',
    fontSize: 14,
    fontWeight: '500',
  },
  deleteText: {
    color: '#DC2626',
    fontSize: 14,
    fontWeight: '500',
  },
  discontinueText: {
    color: '#B45309',
    fontSize: 14,
    fontWeight: '500',
  },
  rxDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    // marginTop: 4,  // Add some space between reason and Rx date
  },
  rxDateLabel: {
    fontSize: 14,
    color: '#666666',
    marginRight: 8,
  },
  rxDateText: {
    fontSize: 14,
    color: '#191919',
  
  },
});

const PatientDrugsTable = ({ drugs, onReprescribe, onDelete, onDiscontinue }) => {
  const [selectedFilter, setSelectedFilter] = useState('current');

  const filteredDrugs = React.useMemo(() => {
    try {
      switch (selectedFilter) {
        case 'current':
          return drugs.filter(drug => {
            const endDate = new Date(drug.endDate);
            return endDate >= new Date();
          });
        case 'active':
          return drugs.filter(drug => drug.ltMed === 'Yes');
        case 'expired':
          return drugs.filter(drug => {
            const endDate = new Date(drug.endDate);
            return endDate < new Date();
          });
        case 'longterm':
          return drugs.filter(drug => drug.ltMed === 'Yes');
        case 'all':
        default:
          return drugs;
      }
    } catch (error) {
      console.error('Error filtering drugs:', error);
      return drugs;
    }
  }, [drugs, selectedFilter]);

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-CA', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      return dateString;
    }
  };

  const getDurationText = (startDate, endDate) => {
    try {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const diffTime = Math.abs(end - start);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return `${diffDays} days (${formatDate(startDate)} - ${formatDate(endDate)})`;
    } catch (error) {
      return 'Invalid duration';
    }
  };

  return (
    <View style={tableStyles.container}>
      <ProfileLegend
        selectedFilter={selectedFilter}
        onFilterChange={setSelectedFilter}
      />
      
      <ScrollView style={tableStyles.tableContainer}>
        {filteredDrugs.map((drug, index) => (
          <View key={index} style={tableStyles.medicationCard}>
            <View style={tableStyles.medicationHeader}>
              <View style={tableStyles.medicationInfo}>
                <Text style={tableStyles.medicationName}>{drug.Medication}</Text>
                <Text style={tableStyles.durationText}>
                  {getDurationText(drug.startDate, drug.endDate)}
                </Text>
              </View>
              <View style={tableStyles.medicationMeta}>
                <Text style={tableStyles.quantityText}>Qty: {drug.quantity}</Text>
                {drug.ltMed === 'Yes' && (
                  <Text style={tableStyles.ltMedText}>• Long Term</Text>
                )}
              </View>
            </View>

            {drug.reason && (
              <>
                <View style={tableStyles.reasonContainer}>
                  <Text style={tableStyles.reasonLabel}>Reason:</Text>
                  <Text style={tableStyles.reasonText}>{drug.reason}</Text>
                </View>
                {drug.rxDate && (
                  <View style={tableStyles.rxDateContainer}>
                    <Text style={tableStyles.rxDateLabel}>Rx Date:</Text>
                    <Text style={tableStyles.rxDateText}>
                      {formatDate(drug.rxDate)}
                    </Text>
                  </View>
                )}
              </>
            )}

            <View style={tableStyles.actionsContainer}>
              <TouchableOpacity
                style={[tableStyles.actionButton, tableStyles.represcribeButton]}
                onPress={() => onReprescribe(drug)}
              >
                <Text style={tableStyles.represcribeText}>Represcribe</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[tableStyles.actionButton, tableStyles.deleteButton]}
                onPress={() => onDelete(drug)}
              >
                <Text style={tableStyles.deleteText}>Delete</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[tableStyles.actionButton, tableStyles.discontinueButton]}
                onPress={() => onDiscontinue(drug)}
              >
                <Text style={tableStyles.discontinueText}>Discontinue</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const ProfileLegend = ({ selectedFilter, onFilterChange }) => {
  const filters = [
    { id: 'current', label: 'Current' },
    { id: 'all', label: 'All' },
    { id: 'active', label: 'Active' },
    { id: 'expired', label: 'Expired' },
    { id: 'longterm', label: 'Longterm/Acute' },
  ];

  return (
    <View style={tableStyles.legendContainer}>
      <Text style={tableStyles.legendLabel}>Profile Legend:</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={tableStyles.legendItems}>
          {filters.map((filter) => (
            <TouchableOpacity
              key={filter.id}
              style={[
                tableStyles.legendItem,
                selectedFilter === filter.id && tableStyles.legendItemSelected
              ]}
              onPress={() => onFilterChange(filter.id)}
            >
              <Text style={[
                tableStyles.legendItemText,
                selectedFilter === filter.id && tableStyles.legendItemTextSelected
              ]}>
                {filter.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

const Prescription = ({ route, navigation }) => {
  const dispatch = useDispatch();
  const { patientDetails, appointmentNo } = route.params; // Add appointmentNo here
  const [searchQuery, setSearchQuery] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDrugSelected, setIsDrugSelected] = useState(false);
  const [lastSearchQuery, setLastSearchQuery] = useState('');
  const [showLongTermOptions, setShowLongTermOptions] = useState(false);
  const [showComplianceOptions, setShowComplianceOptions] = useState(false);
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [frequency, setFrequency] = useState('BID');
  const [dose, setDose] = useState('');
  const [showFrequencyOptions, setShowFrequencyOptions] = useState(false);
  const [complianceFrequency, setComplianceFrequency] = useState('Monthly');
  //  console.log('patientDetails here ', patientDetails);
  // Initialize with default values
  const initialPrescriptionDetails = {
    indication: "",
    instructions: "", 
    duration: "",
    quantity: "",
    repeat: "",
    route: "",
    groupName: "",
    drugForm: "",
    dosage: "",
    startDate: new Date().toISOString().split('T')[0],
    longTerm: 'No',
    endDate: '',
    patientCompliance: patientDetails?.patientAddress?.patientCompliance?.toLowerCase(),
    complianceFrequency: patientDetails?.patientAddress?.frequency?.toLowerCase() ,
    
    selectedDrugDetails: {
      din: '',
      name: '',
      category: ''
    }
  };

  const [prescriptionDetails, setPrescriptionDetails] = useState(initialPrescriptionDetails);

  // Access the drugs slice of the Redux state
  const drugs = useSelector(state => {
    try {
        return state?.auth?.drugs || { searchResults: [], searchLoading: false };
    } catch (error) {
        console.error('Redux selector error:', error);
        return { searchResults: [], searchLoading: false };
    }
  });
  const { searchResults = [], searchLoading = false } = drugs;

  // Log the Redux state for debugging
  useEffect(() => {
    // console.log('Redux drugs state:', drugs);
  }, [drugs]);

  const debouncedSearch = React.useCallback(
    debounce(async (query) => {
      if (query.length >= 2 && query !== lastSearchQuery) {
        try {
          setLastSearchQuery(query);
          await dispatch(searchDrugs(query));
        } catch (error) {
          console.error('Search error:', error);
          Alert.alert('Search Error', 'Unable to search drugs at this time');
        }
      }
    }, 300),
    [dispatch, lastSearchQuery]
  );

  const handleSearchChange = (text) => {
    try {
      setSearchQuery(text);
      if (text.length >= 2) {
        debouncedSearch(text);
      } else {
        dispatch(clearSearchResults());
      }
    } catch (error) {
      console.error('Search input error:', error);
      setSearchQuery(text);
    }
  };

  const handleDrugSelect = (drug) => {
    try {
      if (!drug) return;

      // Get all technical reasons and their associated sigs
      const technicalReasons = drug.technical_reasons?.map(tr => ({
        indication: tr.technical_reason,
        instructions: tr.sigs?.map(sig => sig.sig) || []
      })) || [];

      // Get compliance and frequency from API data
      const apiCompliance = patientDetails?.patientAddress?.patientCompliance?.toLowerCase() || 'unknown';
      const apiFrequency = patientDetails?.patientAddress?.frequency?.toLowerCase() || 'monthly';

      // Update prescription details WITHOUT setting the indication
      setPrescriptionDetails(prev => ({
        ...prev,
        indication: "", // Keep indication empty initially
        groupName: drug.group_name || '',
        drugForm: drug.dosage_form || '',
        route: drug.route || '',
        availableIndications: technicalReasons, // Store available indications for suggestions
        patientCompliance: apiCompliance,
        complianceFrequency: apiCompliance === 'no' ? apiFrequency : 'monthly',
        selectedDrugDetails: {
          din: drug.drugs?.[0]?.din || '',
          name: drug.drugs?.[0]?.name || '',
          category: drug.drug_category || '',
        }
      }));
console.log('prescriptionDetails', prescriptionDetails)
      setSearchQuery('');
      setIsDrugSelected(true);
      dispatch(clearSearchResults());

    } catch (error) {
      console.error('Drug selection error:', error);
      Alert.alert('Error', 'Failed to select drug. Please try again.');
    }
  };

  const handleIndicationSelect = (selectedIndication) => {
    try {
        const technicalReason = prescriptionDetails.availableIndications.find(
            tr => tr.indication === selectedIndication
        );

        if (technicalReason) {
            setPrescriptionDetails(prev => ({
                ...prev,
                indication: technicalReason.indication,
                availableInstructions: technicalReason.instructions,
                instructions: technicalReason.instructions[0] || prev.instructions
            }));
        }
    } catch (error) {
        console.error('Indication selection error:', error);
    }
  };

  const handleInstructionSelect = (instruction) => {
    setPrescriptionDetails(prev => ({
        ...prev,
        instructions: instruction
    }));
  };

  const handleLongTermSelect = (value) => {
    setPrescriptionDetails(prev => ({
        ...prev,
        longTerm: value
    }));
    setShowLongTermOptions(false);
  };

  const handleComplianceSelect = (value) => {
    const lowerValue = value.toLowerCase();
    setPrescriptionDetails(prev => ({
      ...prev,
      patientCompliance: lowerValue
    }));
    setShowComplianceOptions(false);
    
    if (lowerValue === 'no') {
      // When selecting "No", use the API frequency
      const apiFrequency = patientDetails?.patientAddress?.frequency?.toLowerCase() || 'monthly';
      setComplianceFrequency(apiFrequency);
    } else {
      // Reset frequency when selecting anything other than "No"
      setComplianceFrequency('monthly');
    }
  };

  const calculateEndDate = (startDate, duration) => {
    if (!startDate || !duration) return '';
    const date = new Date(startDate);
    date.setDate(date.getDate() + parseInt(duration));
    return date.toISOString().split('T')[0];
  };

  useEffect(() => {
    if (prescriptionDetails.startDate && prescriptionDetails.duration) {
        const endDate = calculateEndDate(
            prescriptionDetails.startDate,
            prescriptionDetails.duration
        );
        setPrescriptionDetails(prev => ({
            ...prev,
            endDate
        }));
    }
  }, [prescriptionDetails.startDate, prescriptionDetails.duration]);

  useEffect(() => {
    if (route.params?.prescriptionData?.drugData?.[0]) {
      const drugData = route.params.prescriptionData.drugData[0];
      setPrescriptionDetails(drugData);
      setSearchQuery(drugData.groupName);
    }
  }, [route.params]);

  // Add new state for validation
  const [validationErrors, setValidationErrors] = useState({
    dose: false,
    frequency: false,
    indication: false,
    instructions: false,
    duration: false,
    repeat: false,
    startDate: false
  });

  // Add validation function
  const validateForm = () => {
    const errors = {
      dose: !dose,
      frequency: !frequency,
      indication: !prescriptionDetails.indication,
      instructions: !prescriptionDetails.instructions,
      duration: !prescriptionDetails.duration,
      repeat: prescriptionDetails.repeat === undefined || prescriptionDetails.repeat === '',
      startDate: !prescriptionDetails.startDate
    };

    setValidationErrors(errors);
    return !Object.values(errors).some(error => error);
  };

  // Add this new state to track multiple drugs
  const [prescriptionDrugs, setPrescriptionDrugs] = useState([]);

  // Add a new state to track added prescriptions
  const [addedPrescriptions, setAddedPrescriptions] = useState([]);

  // Add this function to calculate total quantity based on dose, frequency and duration
  const calculateTotalQuantity = (dose, freq, duration) => {
    const frequencyMap = {
      'OD': 1,  // Once daily
      'BID': 2, // Twice daily
      'TID': 3, // Three times daily
      'QID': 4  // Four times daily
    };

    if (!dose || !freq || !duration) return '';
    
    const doseNum = parseFloat(dose) || 0;
    const durationNum = parseInt(duration) || 0;
    const frequencyNum = frequencyMap[freq] || 0;
    
    return (doseNum * frequencyNum * durationNum).toString();
  };

  // Add this effect to auto-calculate quantity when dose, frequency or duration changes
  useEffect(() => {
    const totalQty = calculateTotalQuantity(
      dose,
      frequency,
      prescriptionDetails.duration
    );
    
    setPrescriptionDetails(prev => ({
      ...prev,
      quantity: totalQty
    }));
  }, [dose, frequency, prescriptionDetails.duration]);

  // Modify handleDrugSelect to work with the new state
  const handleAddDrug = async () => {
    try {
      // Validate current drug details before adding
      if (!validateForm()) {
        Alert.alert('Validation Error', 'Please fill in all required fields before adding another drug');
        return;
      }

      if (!prescriptionDetails.groupName) {
        Alert.alert('Error', 'Drug name is required');
        return;
      }

      // Get appointmentNo from route params
      const appointmentNo = route.params?.appointmentNo;
      
      // Log for debugging
      console.log('Adding drug with appointment number:', appointmentNo);

      if (!appointmentNo) {
        Alert.alert('Error', 'Appointment number is missing');
        return;
      }

      // Create new prescription object with appointmentNo
      const prescriptionData = {
        demographicNo: parseInt(patientDetails.demographicNo),
        appointmentNo: parseInt(appointmentNo),
        drugData: [{
          ...prescriptionDetails,
          dose: dose || '',
          frequency: frequency || 'BID',
          complianceFrequency: complianceFrequency || 'Monthly',
          route: prescriptionDetails.route || 'Oral',
          groupName: prescriptionDetails.groupName,
          drugForm: prescriptionDetails.drugForm || '',
          duration: parseInt(prescriptionDetails.duration) || 0,
          quantity: parseInt(prescriptionDetails.quantity) || 0,
          repeat: parseInt(prescriptionDetails.repeat) || 0,
          startDate: prescriptionDetails.startDate || new Date().toISOString().split('T')[0],
          longTerm: prescriptionDetails.longTerm || 'No', // Keep as string 'Yes' or 'No'
          allergies: patientDetails?.allergies
        }]
      };

      // Call the API
      const result = await dispatch(addPatientDrug(prescriptionData)).unwrap();
      
      if (result && result.status === "Success") {
        setAddedPrescriptions(prev => [...prev, prescriptionData.drugData[0]]);
        
        // Reset form fields but keep the drug selection
        setDose('');
        setFrequency('BID');
        setPrescriptionDetails(initialPrescriptionDetails);
        setValidationErrors({
          dose: false,
          frequency: false,
          indication: false,
          instructions: false,
          duration: false,
          repeat: false,
          startDate: false
        });
        
        dispatch(clearSearchResults());
        setSearchQuery('');
        setIsDrugSelected(false);

        Alert.alert('Success', 'Drug added successfully');
      }
    } catch (error) {
      console.error('Add drug error:', error);
      Alert.alert('Error', error.message || 'Failed to add drug. Please try again.');
    }
  };

  // Modify handleGeneratePrescription to handle multiple drugs
  const [showPreview, setShowPreview] = useState(false);
  const [additionalNotes, setAdditionalNotes] = useState('');

  const handleGeneratePrescription = async () => {
    if (!patientDetails?.demographicNo || !appointmentNo) {
      Alert.alert('Error', 'Patient information or appointment number is missing');
      return;
    }

    // Validate current form if a drug is selected
    if (isDrugSelected && !validateForm()) {
      Alert.alert('Validation Error', 'Please fill in all required fields');
      return;
    }

    try {
      // Combine existing prescriptions with current drug if selected
      let allDrugs = [...addedPrescriptions];
      
      if (isDrugSelected) {
        if (!prescriptionDetails.groupName) {
          Alert.alert('Error', 'Drug name is required');
          return;
        }

        allDrugs.push({
          ...prescriptionDetails,
          dose,
          frequency,
          complianceFrequency
        });
      }

      if (allDrugs.length === 0) {
        Alert.alert('Error', 'Please add at least one drug to the prescription');
        return;
      }

      // Instead of immediately submitting, show the preview
      setShowPreview(true);
    } catch (error) {
      console.error('Prescription Error:', error);
      Alert.alert('Error', 'Failed to prepare prescription preview');
    }
  };

  // Add these handlers for the preview actions
  const handlePrintAndPaste = async () => {
    setIsGenerating(true);
    try {
      const prescriptionData = {
        demographicNo: parseInt(patientDetails.demographicNo),
        appointmentNo: parseInt(appointmentNo),
        drugData: addedPrescriptions,
        additionalNotes: additionalNotes
      };
      const result = await dispatch(addPatientDrug(prescriptionData)).unwrap();
      // console.log('batch result', result)
      if (result && result.status === "Success") {
        Alert.alert('Success', 'Prescription printed and pasted to EMR');
        navigation.goBack();
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to print and paste prescription');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleFaxAndPaste = async () => {
    setIsGenerating(true);
    try {
      const prescriptionData = {
        demographicNo: parseInt(patientDetails.demographicNo),
        appointmentNo: parseInt(appointmentNo),
        drugData: addedPrescriptions,
      };
      const result = await dispatch(addPatientDrug(prescriptionData)).unwrap();
      if (result && result.status === "Success") {
        Alert.alert('Success', 'Prescription faxed and pasted to EMR');
        navigation.goBack();
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to fax and paste prescription');
    } finally {
      setIsGenerating(false);
    }
  };

  // const handleGeneratePDF = async () => {
  //   setIsGenerating(true);
  //   try {
  //     const prescriptionData = {
  //       demographicNo: parseInt(patientDetails.demographicNo),
  //       drugData: addedPrescriptions,
  //       // additionalNotes: additionalNotes
  //     };
  //     const result = await dispatch(addPatientDrug(prescriptionData)).unwrap();
  //     if (result && result.status === "Success") {
  //       Alert.alert('Success', 'PDF generated successfully');
  //       navigation.goBack();
  //     }
  //   } catch (error) {
  //     Alert.alert('Error', 'Failed to generate PDF');
  //   } finally {
  //     setIsGenerating(false);
  //   }
  // };

  const handleReset = () => {
    try {
      setSearchQuery('');
      setIsDrugSelected(false);
      setPrescriptionDetails(initialPrescriptionDetails);
      setValidationErrors({
        dose: false,
        frequency: false,
        indication: false,
        instructions: false,
        duration: false,
        repeat: false,
        startDate: false
      });
      dispatch(clearSearchResults());
    } catch (error) {
      console.error('Reset error:', error);
    }
  };

  // Modified functions for date handling
  const handleDateSelect = (date) => {
    // Ensure we're working with a date object
    const selectedDate = new Date(date);
    selectedDate.setHours(12, 0, 0, 0); // Set to noon to avoid timezone issues
    
    // Format the date as YYYY-MM-DD using local timezone
    const formattedDate = selectedDate.toLocaleDateString('en-CA');
    
    setPrescriptionDetails(prev => ({
      ...prev,
      startDate: formattedDate
    }));
    setValidationErrors(prev => ({ ...prev, startDate: false }));
  };

  // Create a custom date picker component using Modal
  const DatePickerModal = ({ visible, onClose, onSelect, initialDate }) => {
    const [tempDate, setTempDate] = useState(new Date(initialDate));
    const [year, setYear] = useState(tempDate.getFullYear());
    const [month, setMonth] = useState(tempDate.getMonth());
    
    // Calendar generation helpers
    const getDaysInMonth = (year, month) => {
      return new Date(year, month + 1, 0).getDate();
    };
    
    const getFirstDayOfMonth = (year, month) => {
      return new Date(year, month, 1).getDay();
    };
    
    const generateCalendarDays = () => {
      const daysInMonth = getDaysInMonth(year, month);
      const firstDay = getFirstDayOfMonth(year, month);
      const days = [];
      
      // Add empty spaces for days before the first day of month
      for (let i = 0; i < firstDay; i++) {
        days.push({ day: '', empty: true });
      }
      
      // Add the days of the month
      for (let i = 1; i <= daysInMonth; i++) {
        days.push({ day: i, empty: false });
      }
      
      return days;
    };
    
    const calendarDays = generateCalendarDays();
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                        'July', 'August', 'September', 'October', 'November', 'December'];
    
    const goToPreviousMonth = () => {
      if (month === 0) {
        setMonth(11);
        setYear(year - 1);
      } else {
        setMonth(month - 1);
      }
    };
    
    const goToNextMonth = () => {
      if (month === 11) {
        setMonth(0);
        setYear(year + 1);
      } else {
        setMonth(month + 1);
      }
    };
    
    const selectDay = (dayNum) => {
      // Create date at noon to avoid timezone issues
      const newSelectedDate = new Date(year, month, dayNum, 12, 0, 0);
      
      // Check if date is before today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (newSelectedDate < today) {
        Alert.alert('Invalid Date', 'Please select today or a future date');
        return;
      }
      
      // Update the selected date
      setSelectedDate(newSelectedDate);
      setTempDate(newSelectedDate);
      
      // Format date as YYYY-MM-DD ensuring we use local timezone
      const formattedDate = newSelectedDate.toLocaleDateString('en-CA');
      
      // Call onSelect with the formatted date string
      onSelect(newSelectedDate);
      
      // Automatically close the calendar after selection
      onClose();
    };

    const handleConfirm = () => {
      // Only close the modal when user confirms the selection
      onClose();
    };

    const isSelectedDate = (dayNum) => {
      return selectedDate.getDate() === dayNum && 
             selectedDate.getMonth() === month && 
             selectedDate.getFullYear() === year;
    };

    const isToday = (dayNum) => {
      const today = new Date();
      const currentDate = new Date(year, month, dayNum);
      return currentDate.getDate() === today.getDate() && 
             currentDate.getMonth() === today.getMonth() && 
             currentDate.getFullYear() === today.getFullYear();
    };

    if (!visible) return null;

    return (
      <Modal
        visible={visible}
        transparent={true}
        animationType="slide"
        onRequestClose={onClose}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={onClose}
        >
          <View style={styles.calendarContainer}>
            <View style={styles.calendarHeader}>
              <Text style={styles.calendarTitle}>Select Date</Text>
              <TouchableOpacity 
                style={styles.calendarCloseButton} 
                onPress={handleConfirm}
              >
                <Text style={styles.calendarCloseText}>Confirm</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.monthSelector}>
              <TouchableOpacity onPress={goToPreviousMonth} style={styles.monthButton}>
                <Text style={styles.monthButtonText}>{'<'}</Text>
              </TouchableOpacity>
              <Text style={styles.monthYearText}>{`${monthNames[month]} ${year}`}</Text>
              <TouchableOpacity onPress={goToNextMonth} style={styles.monthButton}>
                <Text style={styles.monthButtonText}>{'>'}</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.weekdayLabels}>
              {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day, index) => (
                <Text key={index} style={styles.weekdayLabel}>{day}</Text>
              ))}
            </View>
            
            <View style={styles.calendarGrid}>
              {calendarDays.map((item, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.calendarDay,
                    item.empty ? styles.emptyDay : null,
                    isSelectedDate(item.day) && styles.selectedDay,
                    isToday(item.day) && styles.todayDay
                  ]}
                  onPress={() => !item.empty && selectDay(item.day)}
                  disabled={item.empty}
                >
                  <Text style={[
                    styles.calendarDayText,
                    isSelectedDate(item.day) && styles.selectedDayText,
                    isToday(item.day) && styles.todayDayText
                  ]}>
                    {item.day}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            
            <View style={styles.calendarFooter}>
              <TouchableOpacity 
                style={styles.todayButton}
                onPress={() => {
                  const today = new Date();
                  setYear(today.getFullYear());
                  setMonth(today.getMonth());
                  setTempDate(today);
                  selectDay(today.getDate());
                }}
              >
                <Text style={styles.todayButtonText}>Today</Text>
              </TouchableOpacity>
              
             
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    );
  };

  // Add this array for frequency options
  const frequencyOptions = ['OD', 'BID', 'TID', 'QID'];
console.log('prescriptionDetails', prescriptionDetails)
  // Update the form fields layout in renderPrescriptionForm
  const renderPrescriptionForm = () => (
    <View style={styles.responsiveContainer}>
      {/* Drug Header with Details */}
      <View style={styles.drugHeader}>
        <View style={styles.drugTitleContainer}>
          <Text style={styles.drugTitle}>{prescriptionDetails.groupName}</Text>
          <Text style={styles.drugSubtitle}>
            {prescriptionDetails.drugForm} 
          
            {prescriptionDetails.selectedDrugDetails?.category ? ` • ${prescriptionDetails.selectedDrugDetails.category}` : ''}
          </Text>
        </View>
        <TouchableOpacity 
          style={styles.closeButton}
          onPress={handleReset}
        >
          <Text style={styles.closeButtonText}>×</Text>
        </TouchableOpacity>
      </View>
      
      {/* Indication Field */}
      <View style={styles.formField}>
        <Text style={styles.sectionLabel}>
          Indication<Text style={styles.required}>*</Text>
        </Text>
        <TextInput
          style={[
            styles.input,
            styles.customInput,
            validationErrors.indication && styles.inputError
          ]}
          placeholder="Type or select indication"
          value={prescriptionDetails.indication}
          onChangeText={(text) => {
            setPrescriptionDetails(prev => ({ ...prev, indication: text }));
            setValidationErrors(prev => ({ ...prev, indication: false }));
          }}
        />
        {/* Show suggestions only if we have available indications and the field is focused or has content */}
        {prescriptionDetails.availableIndications && (
          <ScrollView style={[styles.suggestionsScrollView, { maxHeight: 120 }]}>
            <View style={styles.suggestionsContainer}>
              {prescriptionDetails.availableIndications.map((item, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.suggestionButton,
                    prescriptionDetails.indication === item.indication && styles.suggestionButtonSelected
                  ]}
                  onPress={() => handleIndicationSelect(item.indication)}
                >
                  <Text style={[
                    styles.suggestionText,
                    prescriptionDetails.indication === item.indication && styles.suggestionTextSelected
                  ]}>
                    {item.indication}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        )}
      </View>

      {/* Instructions Field */}
      <View style={styles.formField}>
        <Text style={styles.sectionLabel}>
          Instructions<Text style={styles.required}>*</Text>
        </Text>
        <TextInput
          style={[
            styles.input,
            styles.customInput,
            validationErrors.instructions && styles.inputError
          ]}
          placeholder="Type instructions here..."
          value={prescriptionDetails.instructions}
          onChangeText={(text) => {
            setPrescriptionDetails(prev => ({ ...prev, instructions: text }));
            setValidationErrors(prev => ({ ...prev, instructions: false }));
          }}
        />
        {prescriptionDetails.availableInstructions && (
          <ScrollView style={styles.suggestionsScrollView}>
            <View style={styles.suggestionsContainer}>
              {prescriptionDetails.availableInstructions.map((instruction, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.suggestionButton,
                    prescriptionDetails.instructions === instruction && styles.suggestionButtonSelected
                  ]}
                  onPress={() => handleInstructionSelect(instruction)}
                >
                  <Text style={[
                    styles.suggestionText,
                    prescriptionDetails.instructions === instruction && styles.suggestionTextSelected
                  ]}>
                    {instruction}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        )}
      </View>

      {/* Row for Dose and Frequency */}
      <View style={styles.formRow}>
        <View style={styles.formColumn}>
          <Text style={styles.sectionLabel}>
            Dose<Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={[
              styles.input,
              styles.customInput,
              validationErrors.dose && styles.inputError
            ]}
            value={dose}
            keyboardType="numeric"
            onChangeText={(text) => {
              setDose(text);
              setValidationErrors(prev => ({ ...prev, dose: false }));
            }}
            placeholder="Enter dose"
          />
        </View>

        <View style={styles.formColumn}>
          <Text style={styles.sectionLabel}>
            Frequency<Text style={styles.required}>*</Text>
          </Text>
          <TouchableOpacity
            style={[styles.dropdownButton, { height: 48 }]}
            onPress={() => setShowFrequencyOptions(!showFrequencyOptions)}
          >
            <Text style={styles.dropdownButtonText}>{frequency}</Text>
            <Text style={styles.dropdownIcon}>▼</Text>
          </TouchableOpacity>
          {showFrequencyOptions && (
            <View style={styles.frequencyDropdown}>
              {frequencyOptions.map((option) => (
                <TouchableOpacity
                  key={option}
                  style={styles.frequencyOption}
                  onPress={() => {
                    setFrequency(option);
                    setShowFrequencyOptions(false);
                  }}
                >
                  <Text style={[
                    styles.frequencyOptionText,
                    frequency === option && styles.frequencyOptionSelected
                  ]}>
                    {option}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </View>

      {/* Row 3: Duration and Quantity */}
      <View style={styles.formRow}>
        <View style={styles.formColumn}>
          <Text style={styles.sectionLabel}>
            Duration (days)<Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={[
              styles.input,
              styles.customInput,
              validationErrors.duration && styles.inputError
            ]}
            value={prescriptionDetails.duration?.toString()}
            keyboardType="numeric"
            onChangeText={(text) => {
              setPrescriptionDetails(prev => ({
                ...prev,
                duration: text ? parseInt(text) : ''
              }));
              setValidationErrors(prev => ({ ...prev, duration: false }));
            }}
          />
        </View>

        <View style={styles.formColumn}>
          <Text style={styles.sectionLabel}>Total Quantity</Text>
          <TextInput
            style={[styles.input, styles.customInput, styles.disabledInput]}
            value={prescriptionDetails.quantity?.toString()}
            editable={false}
            placeholder="Auto-calculated"
          />
        </View>
      </View>

      {/* Row 4: Start Date and End Date */}
      <View style={styles.formRow}>
        <View style={styles.formColumn}>
          <Text style={styles.sectionLabel}>
            Start Date<Text style={styles.required}>*</Text>
          </Text>
          <TouchableOpacity
            style={[
              styles.input,
              styles.customInput,
              validationErrors.startDate && styles.inputError,
              styles.datePickerButton
            ]}
            onPress={() => setDatePickerVisible(true)}
          >
            <Text style={styles.datePickerButtonText}>
              {prescriptionDetails.startDate || 'Select Date'}
            </Text>
            <Text style={styles.calendarIcon}>📅</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.formColumn}>
          <Text style={styles.sectionLabel}>End Date</Text>
          <TextInput
            style={[styles.input, styles.customInput, styles.disabledInput]}
            value={prescriptionDetails.endDate}
            editable={false}
            placeholder="Auto-calculated"
          />
        </View>
      </View>

      {/* Row 5: Refills */}
      <View style={styles.formRow}>
        <View style={styles.formColumn}>
          <Text style={styles.sectionLabel}>
            Refills<Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={[
              styles.input,
              styles.customInput,
              validationErrors.repeat && styles.inputError
            ]}
            value={prescriptionDetails.repeat?.toString()}
            keyboardType="numeric"
            onChangeText={(text) => {
              setPrescriptionDetails(prev => ({ ...prev, repeat: parseInt(text) || '' }));
              setValidationErrors(prev => ({ ...prev, repeat: false }));
            }}
          />
        </View>
      </View>

      {/* Row 5: Long Term and Patient Compliance */}
      <View style={styles.formRow}>
        <View style={styles.formColumn}>
          <Text style={styles.sectionLabel}>Long Term</Text>
          <TouchableOpacity
            style={[styles.dropdownButton, { height: 48 }]}
            onPress={() => setShowLongTermOptions(!showLongTermOptions)}
          >
            <Text style={styles.dropdownButtonText}>
              {prescriptionDetails.longTerm}
            </Text>
            <Text style={styles.dropdownIcon}>▼</Text>
          </TouchableOpacity>
          {showLongTermOptions && (
            <View style={styles.optionsDropdown}>
              {['Yes', 'No'].map((option) => (
                <TouchableOpacity
                  key={option}
                  style={[
                    styles.optionItem,
                    prescriptionDetails.longTerm === option && styles.optionItemSelected
                  ]}
                  onPress={() => {
                    handleLongTermSelect(option);
                    setShowLongTermOptions(false);
                  }}
                >
                  <Text style={[
                    styles.optionText,
                    prescriptionDetails.longTerm === option && styles.optionTextSelected
                  ]}>
                    {option}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Patient Compliance Dropdown */}
        <View style={styles.formColumn}>
          <Text style={styles.sectionLabel}>Patient Compliance</Text>
          <TouchableOpacity
            style={[styles.dropdownButton, { height: 48 }]}
            onPress={() => setShowComplianceOptions(!showComplianceOptions)}
          >
            <Text style={styles.dropdownButtonText}>
              {(prescriptionDetails.patientCompliance || 'Unknown').charAt(0).toUpperCase() + 
               (prescriptionDetails.patientCompliance || 'Unknown').slice(1).toLowerCase()}
            </Text>
            <Text style={styles.dropdownIcon}>▼</Text>
          </TouchableOpacity>
          {showComplianceOptions && (
            <View style={styles.optionsDropdown}>
              {['Unknown', 'No', 'Yes'].map((option) => (
                <TouchableOpacity
                  key={option}
                  style={[
                    styles.optionItem,
                    prescriptionDetails.patientCompliance === option.toLowerCase() && 
                    styles.optionItemSelected
                  ]}
                  onPress={() => handleComplianceSelect(option)}
                >
                  <Text style={[
                    styles.optionText,
                    prescriptionDetails.patientCompliance === option.toLowerCase() && 
                    styles.optionTextSelected
                  ]}>
                    {option}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </View>

      {/* Show Compliance Frequency only when compliance is "no" */}
      {prescriptionDetails.patientCompliance === 'no' && (
        <View style={styles.formField}>
          <Text style={styles.sectionLabel}>Compliance Frequency</Text>
          <View style={styles.radioGroup}>
            {['daily', 'weekly', 'bi-weekly', 'monthly'].map((frequency) => {
              const isSelected = complianceFrequency === frequency;
              return (
                <TouchableOpacity 
                  key={frequency}
                  style={styles.radioOption}
                  onPress={() => setComplianceFrequency(frequency)}
                >
                  <View style={[
                    styles.radioButton,
                    isSelected && styles.radioButtonSelected
                  ]}>
                    {isSelected && <View style={styles.radioButtonInner} />}
                  </View>
                  <Text style={styles.radioLabel}>
                    {frequency.charAt(0).toUpperCase() + frequency.slice(1)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      )}

      {/* ... rest of your existing form code ... */}
    </View>
  );

  const renderSearchResults = () => {
    try {
      if (!drugs || !Array.isArray(drugs.searchResults)) {
        // console.log('Invalid search results state');
        return null;
      }

     

      const hasValidResults = drugs.searchResults.length > 0;

      if (hasValidResults && searchQuery.length >= 2) {
        return (
          <View style={styles.searchResults}>
            <ScrollView
              style={styles.searchResultsScroll}
              keyboardShouldPersistTaps="handled"
              nestedScrollEnabled={true}
              showsVerticalScrollIndicator={true}
            >
              {drugs.searchResults.map((drug, index) => (
                <TouchableOpacity
                  key={`drug-${drug?.id || index}`}
                  style={styles.searchResultItem}
                  onPress={() => handleDrugSelect(drug)}
                >
                  <View style={styles.drugItemContainer}>
                    <Text style={styles.drugName}>
                      {drug?.group_name || 'Unknown Drug'}
                    </Text>
                    {drug?.active_ingredients?.length > 0 && (
                      <View style={styles.activeIngredientsContainer}>
                        {drug.active_ingredients.map((ingredient, idx) => (
                          <Text
                            key={`${ingredient?.ingredient_name}-${idx}`}
                            style={styles.activeIngredientText}
                          >
                            {ingredient?.ingredient_name}
                            {ingredient?.strength && (
                              <Text style={styles.activeIngredientText}>
                                {` ${ingredient.strength}${ingredient.strength_unit}`}
                              </Text>
                            )}
                            {idx < drug.active_ingredients.length - 1 ? ', ' : ''}
                          </Text>
                        ))}
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        );
      }

      return null;
    } catch (error) {
      console.error('Render search results error:', error);
      return null;
    }
  };

  useEffect(() => {
    return () => {
      dispatch(clearSearchResults());
    };
  }, [dispatch]);

  // Add this new component for the modal
  const ComplianceModal = ({ visible, onClose, onSelect, selectedValue }) => {
    // Get initial compliance from patient details
    const initialCompliance = patientDetails?.patientCompliance || 'Unknown';

    return (
      <Modal
        visible={visible}
        transparent={true}
        animationType="fade"
        onRequestClose={onClose}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={onClose}
        >
          <View style={styles.modalContent}>
            <Text variant="" style={styles.modalTitle}>Patient Compliance: {initialCompliance}</Text>
            {['Unknown', 'No', 'Yes'].map((option) => (
              <TouchableOpacity
                key={option}
                style={[
                  styles.modalOption,
                  selectedValue.toLowerCase() === option.toLowerCase() && styles.modalOptionSelected
                ]}
                onPress={() => {
                  onSelect(option);
                  onClose();
                }}
              >
                <Text style={[
                  styles.modalOptionText,
                  selectedValue.toLowerCase() === option.toLowerCase() && styles.modalOptionTextSelected
                ]}>
                  {option}
                </Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity 
              style={styles.modalCloseButton}
              onPress={onClose}
            >
              <Text variant="subheading" style={styles.modalCloseButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    );
  };

  // Add a component to render previous prescriptions
  const renderPreviousPrescriptions = () => {
    if (addedPrescriptions.length === 0) return null;

    const handleEditPrescription = (prescription, index) => {
      // Set the current prescription details to the selected prescription
      setPrescriptionDetails(prescription);
      setIsDrugSelected(true);
      // Remove the prescription from added prescriptions
      setAddedPrescriptions(prev => prev.filter((_, i) => i !== index));
      // Scroll to the form
      // You might want to add a ref to the form container and scroll to it
    };

    const handleDeletePrescription = (index) => {
      Alert.alert(
        'Delete Drug',
        'Are you sure you want to remove this drug?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            onPress: () => {
              setAddedPrescriptions(prev => prev.filter((_, i) => i !== index));
            },
            style: 'destructive',
          },
        ]
      );
    };

    return (
      <View style={styles.previousPrescriptionsContainer}>
        <Text variant="paragraph" style={styles.previousPrescriptionsTitle}>Added Drugs</Text>
        {addedPrescriptions.map((prescription, index) => (
          <View key={index} style={styles.previousPrescriptionCard}>
            <View style={styles.prescriptionHeader}>
              <View style={styles.prescriptionTitleContainer}>
                <Text style={styles.prescriptionTitle} numberOfLines={2}>
                  {prescription.groupName}
                </Text>
                <Text style={styles.prescriptionSubtitle}>
                  {prescription.drugForm} {prescription.selectedDrugDetails?.category ? `• ${prescription.selectedDrugDetails.category}` : ''}
                </Text>
              </View>
              <View style={styles.actionButtons}>
                <TouchableOpacity 
                  style={styles.editButton}
                  onPress={() => handleEditPrescription(prescription, index)}
                >
                  <Text style={styles.editButtonText}>✎</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.editButton}
                  onPress={() => handleDeletePrescription(index)}
                >
                  <Text style={styles.deleteButtonText}>✕</Text>
                </TouchableOpacity>
              </View>
            </View>
            <View style={styles.prescriptionDetails}>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Indication:</Text>
                <View style={styles.detailContentContainer}>
                  <Text style={styles.detailContent}>{prescription.indication}</Text>
                </View>
              </View>
              
              <View style={styles.detailItem}>
                <Text variant="subheading" style={styles.detailLabel}>Instructions:</Text>
                <View style={styles.detailContentContainer}>
                  <Text style={styles.detailContent}>{prescription.instructions}</Text>
                </View>
              </View>

              <View style={styles.detailRow}>
                <Text variant="subheading" style={styles.detailLabel}>Quantity:</Text>
                <Text style={styles.detailText}>{prescription.quantity}</Text>
              </View>

              <View style={styles.detailRow}>
                <Text variant="subheading" style={styles.detailLabel}>Duration:</Text>
                <Text style={styles.detailText}>{prescription.duration} days</Text>
              </View>

              <View style={styles.detailRow}>
                <Text variant="subheading" style={styles.detailLabel}>Refills:</Text>
                <Text style={styles.detailText}>{prescription.repeat}</Text>
              </View>

              <View style={styles.detailRow}>
                <Text variant="subheading" style={styles.detailLabel}>Start Date:</Text>
                <Text style={styles.detailText}>{prescription.startDate}</Text>
              </View>

              <View style={styles.detailRow}>
                <Text variant="subheading" style={styles.detailLabel}>Long Term:</Text>
                <Text style={styles.detailText}>
                  {typeof prescription.longTerm === 'boolean' 
                    ? (prescription.longTerm ? 'Yes' : 'No')
                    : prescription.longTerm}
                </Text>
              </View>
            </View>
          </View>
        ))}
      </View>
    );
  };

  // Add this function before the return statement
  const handleFullReset = () => {
    Alert.alert(
      'Reset All',
      'Are you sure you want to reset all prescriptions?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Reset',
          onPress: () => {
            // Reset all prescriptions
            setAddedPrescriptions([]);
            // Reset current form
            setSearchQuery('');
            setIsDrugSelected(false);
            setPrescriptionDetails(initialPrescriptionDetails);
            setValidationErrors({
              dose: false,
              frequency: false,
              indication: false,
              instructions: false,
              duration: false,
              repeat: false,
              startDate: false
            });
            dispatch(clearSearchResults());
          },
          style: 'destructive',
        },
      ]
    );
  };

  // Add these new styles
  const additionalStyles = {
    searchResults: {
      maxHeight: 200,
      borderWidth: 1,
      borderColor: '#E6E8EC',
      borderRadius: 8,
      marginTop: 8,
      backgroundColor: '#fff',
      zIndex: 1000,
    },
    searchResultsScroll: {
      flexGrow: 0,
    },
    searchResultItem: {
      padding: 12,
      borderBottomWidth: 1,
      borderBottomColor: '#E6E8EC',
    },
    drugItemContainer: {
      gap: 4,
    },
    drugName: {
      fontSize: 16,
      fontWeight: '600',
      color: '#191919',
    },
    drugForm: {
      fontSize: 14,
      color: '#666',
      marginTop: 2,
    },
    drugStrength: {
      fontSize: 14,
      color: '#0049F8',
      fontWeight: '500',
    },
    drugIndication: {
      fontSize: 12,
      color: '#666',
      fontStyle: 'italic',
      marginTop: 2,
    },
    noResultsText: {
      padding: 16,
      textAlign: 'center',
      color: '#666',
      fontSize: 14,
    },
    drugHeader: {
      marginBottom: 20,
      position: 'relative',
    },
    drugTitle: {
      fontSize: 20,
      fontWeight: '600',
      color: '#000',
    },
    drugSubtitle: {
      fontSize: 14,
      color: '#666',
      marginTop: 4,
    },
    closeButton: {
      position: 'absolute',
      right: 0,
      top: 0,
      width: 32,
      height: 32,
      borderRadius: 16,  // Make it fully rounded
      backgroundColor: '#FEE2E2',
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: '#DC2626',
    },
    closeButtonText: {
      fontSize: 24,
      color: '#DC2626',
      lineHeight: 24,
      textAlign: 'center',
    },
    formSection: {
      marginBottom: 24,
      width: '100%',
      backgroundColor: '#FFFFFF',
      borderRadius: 12,
      padding: 16,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 2,
      maxHeight: 400,
      overflow: 'scroll',
    },
    sectionLabel: {
      fontSize: 13,
      color: '#0066CC',
      marginBottom: 12,
      fontWeight: '500',
    },
    required: {
      color: 'red',
    },
    optionsContainer: {
      maxHeight: 200,
      gap: 16,
      width: '100%',
    },
    customInput: {
      backgroundColor: '#FFFFFF',
      borderWidth: 1,
      borderColor: '#E6E8EC',
      borderRadius: 8,
      padding: 12,
      fontSize: 16,
      width: '100%',
      minHeight: 48,
      marginBottom: 8,
    },
    optionsLabel: {
      fontSize: 14,
      color: '#666',
      marginTop: 8,
      marginBottom: 8,
      fontStyle: 'italic',
    },
    optionsButtonsContainer: {
      maxHeight: 150,
      gap: 8,
      width: '100%',
    },
    optionButton: {
      backgroundColor: '#F8F9FA',
      padding: 12,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: '#E6E8EC',
      width: '100%',
      minHeight: 48,
    },
    optionButtonSelected: {
      backgroundColor: '#E3F2FD',
      borderColor: '#0049F8',
    },
    optionText: {
      color: '#191919',
      fontSize: 14,
    },
    optionTextSelected: {
      color: '#0049F8',
    },
    input: {
      backgroundColor: '#F8F9FA',
      borderWidth: 1,
      borderColor: '#E6E8EC',
      borderRadius: 8,
      padding: 12,
      fontSize: 14,
      width: '100%',
    },
    textArea: {
      minHeight: 80,
      textAlignVertical: 'top',
    },
    gridRow: {
      flexDirection: 'column',
      marginBottom: 16,
      width: '100%',
      '@media (min-width: 768px)': {
        flexDirection: 'row',
      },
    },
    gridCell: {
      marginBottom: 12,
      width: '100%',
      '@media (min-width: 768px)': {
        flex: 1,
        marginBottom: 0,
        marginRight: 12,
      },
    },
    gridLabel: {
      fontSize: 14,
      color: '#0066CC',
      marginBottom: 8,
    },
    gridInput: {
      backgroundColor: '#F8F9FA',
      borderWidth: 1,
      borderColor: '#E6E8EC',
      borderRadius: 8,
      padding: 12,
      fontSize: 16,
      width: '100%',
      minHeight: 48,
    },
    dropdownButton: {
      backgroundColor: '#F8F9FA',
      borderWidth: 1,
      borderColor: '#E6E8EC',
      borderRadius: 8,
      padding: 12,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      minHeight: 48,
      width: '100%',
    },
    dropdownButtonText: {
      fontSize: 16,
      color: '#191919',
    },
    dropdownIcon: {
      fontSize: 12,
      color: '#666',
    },
    dropdownOptions: {
      position: 'absolute',
      top: '100%',
      left: 0,
      right: 0,
      backgroundColor: '#FFFFFF',
      borderWidth: 1,
      borderColor: '#E6E8EC',
      borderRadius: 8,
      marginTop: 4,
      zIndex: 1000,
      elevation: 5,
      maxHeight: 150,
    },
    dropdownOption: {
      padding: 12,
      borderBottomWidth: 1,
      borderBottomColor: '#E6E8EC',
    },
    dropdownOptionText: {
      fontSize: 16,
      color: '#191919',
    },
    disabledInput: {
      backgroundColor: '#F0F0F0',
      color: '#666',
    },
    responsiveContainer: {
      width: '100%',
      maxWidth: 600,
      alignSelf: 'center',
      padding: 12,
    },
    suggestionsScrollView: {
      maxHeight: 150, // Reduced height for suggestions
      marginTop: 4,
    },
    suggestionsContainer: {
      padding: 4,
      gap: 4,
    },
    suggestionButton: {
      backgroundColor: '#F8F9FA',
      borderWidth: 1,
      borderColor: '#E6E8EC',
      borderRadius: 6,
      padding: 8, // Reduced padding
      minHeight: 32, // Reduced height
      justifyContent: 'center',
    },
    suggestionButtonSelected: {
      backgroundColor: '#E3F2FD',
      borderColor: '#0049F8',
    },
    suggestionText: {
      fontSize: 12, // Smaller font size
      color: '#191919',
      lineHeight: 16,
    },
    suggestionTextSelected: {
      color: '#0049F8',
      fontWeight: '500',
    },
    customInput: {
      backgroundColor: '#FFFFFF',
      borderWidth: 1,
      borderColor: '#E6E8EC',
      borderRadius: 8,
      padding: 12,
      fontSize: 16,
      width: '100%',
      minHeight: 48,
      marginBottom: 16,
    },
    textArea: {
      minHeight: 80,
      textAlignVertical: 'top',
    },
    optionsLabel: {
      fontSize: 14,
      color: '#666',
      marginBottom: 12,
      fontStyle: 'italic',
    },
    formSection: {
      marginBottom: 24,
      width: '100%',
      backgroundColor: '#FFFFFF',
      borderRadius: 12,
      padding: 16,
      shadowColor: '#000',
     
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 2,
    },
    optionsContainer: {
      width: '100%',
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContent: {
      backgroundColor: '#FFFFFF',
      borderRadius: 12,
      padding: 20,
      width: '90%',
      maxWidth: 400,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.25,
      shadowRadius: 4,
      elevation: 5,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: '#191919',
      marginBottom: 16,
      textAlign: 'center',
    },
    modalOption: {
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: '#E6E8EC',
      backgroundColor: '#F8F9FA',
      marginVertical: 4,
      borderRadius: 8,
    },
    modalOptionSelected: {
      backgroundColor: '#E3F2FD',
      borderColor: '#0049F8',
    },
    modalOptionText: {
      fontSize: 16,
      color: '#191919',
      textAlign: 'center',
    },
    modalOptionTextSelected: {
      color: '#0049F8',
      fontWeight: '500',
    },
    modalCloseButton: {
      marginTop: 16,
      padding: 12,
      backgroundColor: '#F8F9FA',
      borderRadius: 8,
      borderWidth: 1,
      borderColor: '#E6E8EC',
    },
    modalCloseButtonText: {
      fontSize: 16,
      color: '#666',
      textAlign: 'center',
    },
    complianceButton: {
      backgroundColor: '#F8F9FA',
      borderWidth: 1,
      borderColor: '#E6E8EC',
      borderRadius: 8,
      padding: 12,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      minHeight: 48,
    },
    complianceButtonText: {
      fontSize: 16,
      color: '#191919',
    },
    inputError: {
      borderColor: '#FF4444',
      borderWidth: 2,
    },
    errorText: {
      color: '#FF4444',
      fontSize: 12,
      marginTop: 4,
    },
    startDateButton: {
      backgroundColor: '#F8F9FA',
      borderWidth: 1,
      borderColor: '#E6E8EC',
      borderRadius: 8,
      padding: 12,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      minHeight: 48,
      width: '100%',
    },
    startDateButtonText: {
      fontSize: 16,
      color: '#191919',
    },
    showStartDatePicker: {
      display: 'none',
    },
    datePickerButton: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    datePickerButtonText: {
      fontSize: 16,
      color: '#191919',
    },
    calendarIcon: {
      fontSize: 18,
    },
    datePickerContainer: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: '#FFFFFF',
      zIndex: 1000,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: -2,
      },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5,
      borderTopLeftRadius: 16,
      borderTopRightRadius: 16,
    },
    datePickerHeader: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      padding: 12,
      borderBottomWidth: 1,
      borderBottomColor: '#E6E8EC',
    },
    datePickerCloseButton: {
      paddingHorizontal: 12,
      paddingVertical: 8,
    },
    datePickerCloseText: {
      color: '#0049F8',
      fontSize: 16,
      fontWeight: '500',
    },
    iosDatePicker: {
      height: 200,
    },
    calendarContainer: {
      backgroundColor: '#FFFFFF',
      borderRadius: 12,
      padding: 16,
      width: '90%',
      maxWidth: 360,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5,
    },
    calendarHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
      paddingBottom: 8,
      borderBottomWidth: 1,
      borderBottomColor: '#E6E8EC',
    },
    calendarTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: '#191919',
    },
    calendarCloseButton: {
      padding: 8,
    },
    calendarCloseText: {
      color: '#0049F8',
      fontWeight: '500',
    },
    monthSelector: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    monthButton: {
      padding: 8,
      width: 40,
      alignItems: 'center',
    },
    monthButtonText: {
      fontSize: 18,
      color: '#0049F8',
      fontWeight: '600',
    },
    monthYearText: {
      fontSize: 16,
      fontWeight: '500',
      color: '#191919',
    },
    weekdayLabels: {
      flexDirection: 'row',
      marginBottom: 8,
    },
    weekdayLabel: {
      flex: 1,
      textAlign: 'center',
      color: '#666',
      fontWeight: '500',
    },
    calendarGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
    },
    calendarDay: {
      width: '14.28%', // 100% ÷ 7 days
      aspectRatio: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 4,
      marginVertical: 2,
    },
    emptyDay: {
      backgroundColor: 'transparent',
    },
    selectedDay: {
      backgroundColor: '#0049F8',
      borderRadius: 20,
    },
    calendarDayText: {
      color: '#191919',
      fontWeight: '400',
    },
    selectedDayText: {
      color: '#FFFFFF',
      fontWeight: '600',
    },
    todayButton: {
      backgroundColor: '#F8F9FA',
      borderRadius: 8,
      padding: 12,
      alignItems: 'center',
      marginTop: 16,
      borderWidth: 1,
      borderColor: '#E6E8EC',
    },
    todayButtonText: {
      color: '#0049F8',
      fontWeight: '500',
    },
    todayDay: {
      backgroundColor: '#E3F2FD',
      borderWidth: 1,
      borderColor: '#0049F8',
      borderRadius: 20,
    },
    todayDayText: {
      color: '#0049F8',
      fontWeight: '700',
    },
    calendarFooter: {
      marginTop: 16,
      gap: 8,
    },
    confirmButton: {
      backgroundColor: '#0049F8',
      borderRadius: 8,
      padding: 12,
      alignItems: 'center',
    },
    confirmButtonText: {
      color: '#FFFFFF',
      fontWeight: '500',
      fontSize: 16,
    },
    buttonContainer: {
      padding: 16,
      gap: 12,
      flexDirection: 'column',
    },
    addDrugButton: {
      backgroundColor: '#4CAF50',
      padding: 16,
      borderRadius: 8,
      alignItems: 'center',
      width: '100%',
    },
    generateButton: {
      backgroundColor: '#0049F8',
      padding: 16,
      borderRadius: 8,
      alignItems: 'center',
      width: '100%',
    },
    resetButton: {
      padding: 16,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: '#E6E8EC',
      alignItems: 'center',
      width: '100%',
      backgroundColor: '#fff',
    },
    addDrugButtonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '500',
    },
    generateButtonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '500',
    },
    resetButtonText: {
      color: '#191919',
      fontSize: 16,
      fontWeight: '500',
    },
    previousPrescriptionsContainer: {
      backgroundColor: '#F8F9FA',
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
    },
    previousPrescriptionsTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: '#191919',
      marginBottom: 12,
    },
    previousPrescriptionCard: {
      backgroundColor: '#FFFFFF',
      borderRadius: 8,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: '#E6E8EC',
    },
    prescriptionHeader: {
      flexDirection: 'row',
      position: 'relative',
      marginBottom: 8,
    },
    prescriptionTitleContainer: {
      flex: 1,
      marginRight: 40, // Make space for delete button
    },
    prescriptionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: '#191919',
      flexWrap: 'wrap', // Allow text to wrap
    },
    prescriptionSubtitle: {
      fontSize: 14,
      color: '#666',
      marginTop: 4,
    },
    actionButtons: {
      position: 'absolute',
      right: 0,
      top: 0,
      flexDirection: 'row',
      gap: 8,
    },
    editButton: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: '#E3F2FD',
      justifyContent: 'center',
      alignItems: 'center',
    },
    editButtonText: {
      fontSize: 18,
      color: '#0049F8',
      lineHeight: 24,
      
    },
    deleteButton: {

      width: 52,
      height: 52,
      borderRadius: 26,
      backgroundColor: 'green',
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: '#DC2626',
    },
    deleteButtonText: {
      
      fontSize: 16,  // Reduced size for better appearance
      color: '#DC2626',
      fontWeight: '600',
      textAlign: 'center',
      textAlignVertical: 'center',
      includeFontPadding: false,
    },
    prescriptionDetails: {
      marginTop: 12,
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: '#E6E8EC',
    },
    detailItem: {
      marginBottom: 12,
    },
    detailLabel: {
      fontSize: 14,
      color: '#666',
     
    },
    detailContentContainer: {
      backgroundColor: '#F8F9FA',
      borderRadius: 8,
      padding: 8,
      marginLeft: 8,
    },
    detailContent: {
      fontSize: 14,
      color: '#191919',
      lineHeight: 20,
      flexWrap: 'wrap',
    },
    detailRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
    },
    detailText: {
      fontSize: 14,
      color: '#191919',
      marginLeft: 8,
    },
    prescriptionMetadata: {
      marginTop: 8,
      flexDirection: 'column',
      gap: 4,
    },
    metadataText: {
      fontSize: 14,
      color: '#666',
    },
    activeIngredientsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginTop: 4,
    },
    activeIngredientText: {
      fontSize: 14,
      color: '#666',
    },
    searchInputContainer: {
      position: 'relative',
    },
    loaderContainer: {
      position: 'absolute',
      right: 12,
      top: 0,
      bottom: 0,
      justifyContent: 'center',
      alignItems: 'center',
    },
    searchInput: {
      backgroundColor: '#F8F9FA',
      borderWidth: 1,
      borderColor: '#E6E8EC',
      borderRadius: 8,
      padding: 12,
      fontSize: 16,
    },
    noDataContainer: {
      padding: 20,
      alignItems: 'center',
      justifyContent: 'center',
    },
    noDataText: {
      fontSize: 16,
      color: '#666',
    },
    tableContainer: {
      marginTop: 16,
      backgroundColor: '#fff',
      borderRadius: 8,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: '#E6E8EC',
    },
    tableHeader: {
      flexDirection: 'row',
      padding: 12,
      borderBottomWidth: 1,
      borderBottomColor: '#E6E8EC',
    },
    headerCell: {
      flex: 1,
    },
    headerText: {
      fontSize: 16,
      fontWeight: '600',
      color: '#191919',
    },
    tableRow: {
      flexDirection: 'row',
      padding: 12,
      borderBottomWidth: 1,
      borderBottomColor: '#E6E8EC',
    },
    cell: {
      flex: 1,
    },
    medicationName: {
      fontSize: 16,
      fontWeight: '600',
      color: '#191919',
    },
    durationText: {
      fontSize: 14,
      color: '#666',
    },
    actionButton: {
      padding: 8,
      borderRadius: 8,
      backgroundColor: '#F8F9FA',
      borderWidth: 1,
      borderColor: '#E6E8EC',
    },
    represcribeButton: {
      backgroundColor: '#E3F2FD',
      borderColor: '#0049F8',
    },
    deleteButton: {
      backgroundColor: '#FEE2E2',
      borderColor: '#DC2626',
    },
    discontinueButton: {
      backgroundColor: '#FFF3CD',
      borderColor: '#FFC107',
    },
    buttonText: {
      fontSize: 12,
      fontWeight: '500',
      color: '#191919',
      textAlign: 'center',
    },
    loadingContainer: {
      padding: 20,
      alignItems: 'center',
      justifyContent: 'center',
    },
    frequencyOption: {
      padding: 12,
      borderBottomWidth: 1,
      borderBottomColor: '#E6E8EC',
    },
    frequencyOptionText: {
      fontSize: 16,
      color: '#191919',
    },
    frequencyDropdown: {
      position: 'absolute',
      top: '100%',
      left: 0,
      right: 0,
      backgroundColor: '#FFFFFF',
      borderWidth: 1,
      borderColor: '#E6E8EC',
      borderRadius: 8,
      marginTop: 4,
      zIndex: 1000,
      elevation: 5,
    },
    formRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 16,
      gap: 12,
    },
    formColumn: {
      flex: 1,
    },
    formField: {
      marginBottom: 16,
      width: '100%',
    },
    frequencyDropdown: {
      position: 'absolute',
      top: '100%',
      left: 0,
      right: 0,
      backgroundColor: '#FFFFFF',
      borderWidth: 1,
      borderColor: '#E6E8EC',
      borderRadius: 8,
      marginTop: 4,
      zIndex: 1000,
      elevation: 5,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
    },
    frequencyOption: {
      padding: 12,
      borderBottomWidth: 1,
      borderBottomColor: '#E6E8EC',
    },
    frequencyOptionText: {
      fontSize: 14,
      color: '#191919',
    },
    frequencyOptionSelected: {
      color: '#0049F8',
      fontWeight: '500',
    },
    suggestionsScrollView: {
      maxHeight: 120,
      marginTop: 4,
      backgroundColor: '#FFFFFF',
      borderWidth: 1,
      borderColor: '#E6E8EC',
      borderRadius: 8,
    },
    suggestionsContainer: {
      padding: 8,
      gap: 4,
    },
    suggestionButton: {
      backgroundColor: '#F8F9FA',
      borderWidth: 1,
      borderColor: '#E6E8EC',
      borderRadius: 6,
      padding: 8,
      minHeight: 32,
    },
    optionsDropdown: {
      position: 'absolute',
      top: '100%',
      left: 0,
      right: 0,
      backgroundColor: '#FFFFFF',
      borderWidth: 1,
      borderColor: '#E6E8EC',
      borderRadius: 8,
      marginTop: 4,
      zIndex: 1000,
      elevation: 5,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
    },
    optionItem: {
      padding: 12,
      borderBottomWidth: 1,
      borderBottomColor: '#E6E8EC',
      backgroundColor: '#F8F9FA',
    },
    optionItemSelected: {
      backgroundColor: '#E3F2FD',
    },
    optionText: {
      fontSize: 14,
      color: '#191919',
    },
    optionTextSelected: {
      color: '#0049F8',
      fontWeight: '500',
    },
    dropdownButton: {
      backgroundColor: '#FFFFFF',
      borderWidth: 1,
      borderColor: '#E6E8EC',
      borderRadius: 8,
      padding: 12,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      minHeight: 48,
    },
    dropdownButtonText: {
      fontSize: 14,
      color: '#191919',
    },
    dropdownIcon: {
      fontSize: 12,
      color: '#666',
    },
    radioGroup: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 16,
      marginTop: 8,
    },
    radioOption: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    radioButton: {
      width: 24,
      height: 24,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: '#E6E8EC',
      justifyContent: 'center',
      alignItems: 'center',
    },
    radioButtonSelected: {
      borderColor: '#0049F8',
    },
    radioButtonInner: {
      width: 12,
      height: 12,
      borderRadius: 6,
      backgroundColor: '#0049F8',
    },
    radioLabel: {
      fontSize: 14,
      color: '#191919',
    },
  };

  // Update the styles object
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#fff',
      paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    },
    patientInfoCard: {
      backgroundColor: '#fff',
      padding: 16,
      margin: 16,
      borderRadius: 12,
      flexDirection: 'row',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    avatarContainer: {
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: '#0049F8',
      justifyContent: 'center',
      alignItems: 'center',
    },
    avatarText: {
      color: '#fff',
      fontSize: 24,
      fontWeight: '500',
    },
    patientDetails: {
      marginLeft: 16,
      flex: 1,
    },
    patientName: {
      fontSize: 20,
      fontWeight: '500',
      color: '#191919',
    },
    patientSubInfo: {
      fontSize: 14,
      color: '#666',
      marginTop: 4,
    },
    infoRow: {
      flexDirection: 'row',
      marginTop: 8,
      justifyContent: 'space-between',
    },
    infoItem: {
      flex: 1,
    },
    infoLabel: {
      fontSize: 12,
      color: '#666',
    },
    infoValue: {
      fontSize: 14,
      color: '#191919',
      fontWeight: '500',
    },
    searchContainer: {
      padding: 16,
    },
    searchInput: {
      backgroundColor: '#F8F9FA',
      borderWidth: 1,
      borderColor: '#E6E8EC',
      borderRadius: 8,
      padding: 12,
      fontSize: 16,
    },
    buttonContainer: {
      padding: 16,
      gap: 12,
      flexDirection: 'column',
    },
    generateButton: {
      backgroundColor: '#0049F8',
      padding: 12,
      borderRadius: 8,
      alignItems: 'center',
    },
    generateButtonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '500',
    },
    resetButton: {
      padding: 12,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: '#E6E8EC',
    },
    resetButtonText: {
      color: '#191919',
      fontSize: 16,
    },
    content: {
      flex: 1,
    },
    contentContainer: {
      flexGrow: 1,
    },
    profileLegend: {
      padding: 16,
    },
    legendTitle: {
      fontSize: 16,
      color: '#191919',
      marginBottom: 12,
    },
    legendItems: {
      flexDirection: 'row',
      gap: 12,
    },
    legendItem: {
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: 4,
    },
    legendItemActive: {
      backgroundColor: '#E3F2FD',
    },
    legendItemSelected: {
      backgroundColor: '#0049F8',
    },
    legendItemText: {
      color: '#666',
    },
    legendItemTextSelected: {
      color: '#fff',
    },
    medicationTable: {
      padding: 16,
    },
    noMedicationsText: {
      textAlign: 'center',
      color: '#666',
      fontSize: 14,
      marginTop: 20,
    },
    formContainer: {
      padding: 16,
      backgroundColor: '#fff',
      width: '100%',
    },
    rowContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: 12,
    },
    halfInput: {
      flex: 1,
    },
    disabledButton: {
      opacity: 0.7,
    },
    ...additionalStyles
  });

  // Update the useEffect for StatusBar
  useEffect(() => {
    const setStatusBarConfig = () => {
      StatusBar.setBarStyle('light-content');
      if (Platform.OS === 'android') {
        StatusBar.setBackgroundColor('#0049F8');
        StatusBar.setTranslucent(false);
      }
    };

    setStatusBarConfig();
    return () => {
      // Reset when component unmounts
      if (Platform.OS === 'android') {
        StatusBar.setBackgroundColor('#FFFFFF');
        StatusBar.setBarStyle('dark-content');
      }
    };
  }, []);

  const patientDrugs = useSelector(state => state.auth.drugs.patientDrugs);
  const loading = useSelector(state => state.auth.drugs.loading);

  useEffect(() => {
    if (patientDetails?.demographicNo) {
        // console.log('Fetching drugs for patient:', patientDetails.demographicNo);
        dispatch(fetchPatientDrugs(patientDetails.demographicNo))
            .unwrap()
            .then(result => {
                // console.log('Successfully fetched patient drugs:', result);
            })
            .catch(error => {
                console.error('Failed to fetch patient drugs:', error);
                Alert.alert(
                    'Error',
                    'Failed to fetch patient medications. Please try again.'
                );
            });
    }
  }, [dispatch, patientDetails]);

  const handleReprescribe = (drug) => {
    // Pre-fill the prescription form with the selected drug's data
    setPrescriptionDetails({
      ...initialPrescriptionDetails,
      groupName: drug.Medication,
      indication: drug.reason,
      quantity: drug.quantity,
      duration: drug.duration,
      longTerm: drug.ltMed === 'Yes' ? 'Yes' : 'No',
    });
    setIsDrugSelected(true);
  };

  const handleDelete = (drug) => {
    Alert.alert(
      'Delete Prescription',
      'Are you sure you want to delete this prescription?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => {
            // Add delete logic here
            // console.log('Delete:', drug);
          }
        },
      ]
    );
  };

  const handleDiscontinue = (drug) => {
    Alert.alert(
      'Discontinue Prescription',
      'Are you sure you want to discontinue this prescription?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Discontinue',
          onPress: () => {
            // Add discontinue logic here
            // console.log('Discontinue:', drug);
          }
        },
      ]
    );
  };

  const renderPatientDrugsTable = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0049F8" />
        </View>
      );
    }

    if (!patientDrugs || patientDrugs.length === 0) {
      return (
        <View style={styles.noDataContainer}>
          <Text style={styles.noDataText}>No medications found</Text>
        </View>
      );
    }

    return (
      <PatientDrugsTable
        drugs={patientDrugs}
        onReprescribe={handleReprescribe}
        onDelete={handleDelete}
        onDiscontinue={handleDiscontinue}
      />
    );
  };

  useEffect(() => {
    if (patientDetails?.patientAddress) {
      const apiCompliance = patientDetails.patientAddress.patientCompliance?.toLowerCase();
      const apiFrequency = patientDetails.patientAddress.frequency?.toLowerCase();
      
      setPrescriptionDetails(prev => ({
        ...prev,
        patientCompliance: apiCompliance || 'unknown'
      }));
      
      if (apiCompliance === 'no') {
        setComplianceFrequency(apiFrequency || 'monthly');
      }
    }
  }, [patientDetails]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: '#0049F8' }]}>
      <StatusBar
        backgroundColor="#0049F8"
        barStyle="light-content"
        translucent={Platform.OS === 'ios'}
      />
      <View style={{ flex: 1, backgroundColor: '#fff' }}>
        <CustomHeader
          title={`${patientDetails?.firstName || ''} ${patientDetails?.lastName || ''}`}
          onBack={() => navigation.goBack()}
        />
        
        <KeyboardAwareScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={true}
          enableOnAndroid={true}
          enableAutomaticScroll={true}
          keyboardShouldPersistTaps="handled"
          extraScrollHeight={100}
        >
          <View style={styles.responsiveContainer}>
            {/* Show added prescriptions at the top */}
            {renderPreviousPrescriptions()}

            <View style={styles.searchContainer}>
              <View style={styles.searchInputContainer}>
                <TextInput
                  style={[styles.searchInput, { paddingRight: 40 }]}
                  placeholder="Search for Drugs"
                  value={searchQuery}
                  onChangeText={handleSearchChange}
                />
                {searchLoading && (
                  <View style={styles.loaderContainer}>
                    <ActivityIndicator size="small" color="#0049F8" />
                  </View>
                )}
              </View>
              {renderSearchResults()}
            </View>

            {isDrugSelected && renderPrescriptionForm()}

            {/* Show action buttons */}
            <View style={styles.buttonContainer}>
              {isDrugSelected && (
                <TouchableOpacity
                  style={styles.addDrugButton}
                  onPress={handleAddDrug}
                >
                  <Text style={styles.addDrugButtonText}>Add Drug</Text>
                </TouchableOpacity>
              )}
              
              {/* Show Generate button if there are added prescriptions or current selection */}
              {(addedPrescriptions.length > 0 || isDrugSelected) && (
                <TouchableOpacity
                  style={[styles.generateButton, isGenerating && styles.disabledButton]}
                  onPress={handleGeneratePrescription}
                  disabled={isGenerating}
                >
                  <Text style={styles.generateButtonText}>
                    {isGenerating ? 'Generating...' : 'Generate Prescription'}
                  </Text>
                </TouchableOpacity>
              )}

              {/* Show Reset button if there are added prescriptions or current selection */}
              {(addedPrescriptions.length > 0 || isDrugSelected) && (
                <TouchableOpacity
                  style={styles.resetButton}
                  onPress={handleFullReset}
                >
                  <Text style={styles.resetButtonText}>Reset All</Text>
                </TouchableOpacity>
              )}
            </View>

            {renderPatientDrugsTable()}
          </View>
        </KeyboardAwareScrollView>
      </View>
      {/* Add the DatePickerModal here, right before the closing tag of renderPrescriptionForm */}
      <DatePickerModal
        visible={datePickerVisible}
        onClose={() => setDatePickerVisible(false)}
        onSelect={handleDateSelect}
        initialDate={prescriptionDetails.startDate || new Date()}
      />
      
      <PrescriptionPreview
        visible={showPreview}
        onClose={() => setShowPreview(false)}
        prescriptionData={{
          drugData: [...addedPrescriptions, ...(isDrugSelected ? [{
            ...prescriptionDetails,
            dose,
            frequency,
            complianceFrequency,
            allergies: patientDetails?.allergies  // Allergies are passed here
          }] : [])]
        }}
        patientDetails={patientDetails}  // And here as well
        additionalNotes={additionalNotes}
        setAdditionalNotes={setAdditionalNotes}
        // onGeneratePDF={handleGeneratePDF}
        onPrintAndPaste={handlePrintAndPaste}
        onFaxAndPaste={handleFaxAndPaste}
      />
    </SafeAreaView>
  );
};

export default Prescription; 