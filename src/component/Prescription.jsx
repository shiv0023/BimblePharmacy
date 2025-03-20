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
import { addPatientDrug, searchDrugs, clearSearchResults } from '../Redux/Slices/DrugSlice';
import CustomHeader from './CustomHeader';
import debounce from 'lodash/debounce';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';

const Prescription = ({ route, navigation }) => {
  const dispatch = useDispatch();
  const { patientDetails } = route.params;
  const [searchQuery, setSearchQuery] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDrugSelected, setIsDrugSelected] = useState(false);
  const [lastSearchQuery, setLastSearchQuery] = useState('');
  const [showLongTermOptions, setShowLongTermOptions] = useState(false);
  const [showComplianceOptions, setShowComplianceOptions] = useState(false);
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  // Initialize with default values
  const initialPrescriptionDetails = {
    indication: "",
    instructions: "", 
    duration: "",
    quantity: "",
    repeat: "",
    groupName: "",
    drugForm: "",
    dosage: "",
    startDate: new Date().toISOString().split('T')[0],
    longTerm: 'No',
    endDate: '',
    patientCompliance: patientDetails?.patientCompliance || 'Unknown',
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
    console.log('Redux drugs state:', drugs);
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

      console.log('Selected drug:', drug);

      // Get all technical reasons and their associated sigs
      const technicalReasons = drug.technical_reasons?.map(tr => ({
        indication: tr.technical_reason,
        instructions: tr.sigs?.map(sig => sig.sig) || []
      })) || [];

      setPrescriptionDetails(prev => ({
        ...prev,
        groupName: drug.group_name || '',
        drugForm: drug.dosage_form || '',
        availableIndications: technicalReasons,
        patientCompliance: patientDetails?.patientCompliance || 'Unknown',
        selectedDrugDetails: {
          din: drug.drugs?.[0]?.din || '',
          name: drug.drugs?.[0]?.name || '',
          category: drug.drug_category || ''
        }
      }));

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
    setPrescriptionDetails(prev => ({
        ...prev,
        patientCompliance: value
    }));
    setShowComplianceOptions(false);
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
    indication: false,
    instructions: false,
    quantity: false,
    duration: false,
    repeat: false,
    startDate: false
  });

  // Add validation function
  const validateForm = () => {
    const errors = {
      indication: !prescriptionDetails.indication,
      instructions: !prescriptionDetails.instructions,
      quantity: !prescriptionDetails.quantity,
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

  // Modify handleDrugSelect to work with the new state
  const handleAddDrug = () => {
    try {
      // Validate current drug details before adding
      if (!validateForm()) {
        Alert.alert('Validation Error', 'Please fill in all required fields before adding another drug');
        return;
      }

      // Create new prescription object
      const newPrescription = {
        groupName: prescriptionDetails.groupName,
        drugForm: prescriptionDetails.drugForm,
        indication: prescriptionDetails.indication,
        instructions: prescriptionDetails.instructions,
        duration: parseInt(prescriptionDetails.duration) || 0,
        quantity: parseInt(prescriptionDetails.quantity) || 0,
        repeat: parseInt(prescriptionDetails.repeat) || 0,
        startDate: prescriptionDetails.startDate,
        longTerm: prescriptionDetails.longTerm,
        selectedDrugDetails: prescriptionDetails.selectedDrugDetails
      };

      // Add to added prescriptions array
      setAddedPrescriptions(prev => [...prev, newPrescription]);
      
      // Reset only the form fields but keep the added prescriptions
      setSearchQuery('');
      setIsDrugSelected(false);
      setPrescriptionDetails(initialPrescriptionDetails);
      setValidationErrors({
        indication: false,
        instructions: false,
        quantity: false,
        duration: false,
        repeat: false,
        startDate: false
      });
      dispatch(clearSearchResults());

      Alert.alert('Success', 'Drug added to prescription');
    } catch (error) {
      console.error('Add drug error:', error);
      Alert.alert('Error', 'Failed to add drug to prescription');
    }
  };

  // Modify handleGeneratePrescription to handle multiple drugs
  const handleGeneratePrescription = async () => {
    if (!patientDetails?.demographicNo) {
      Alert.alert('Error', 'Patient information is missing');
      return;
    }

    // Validate current form if a drug is selected
    if (isDrugSelected && !validateForm()) {
      Alert.alert('Validation Error', 'Please fill in all required fields');
      return;
    }

    setIsGenerating(true);
    try {
      // Combine existing prescriptions with current drug if selected
      let allDrugs = [...addedPrescriptions];
      
      if (isDrugSelected) {
        // Validate groupName before adding
        if (!prescriptionDetails.groupName) {
          Alert.alert('Error', 'Drug name is required');
          setIsGenerating(false);
          return;
        }

        allDrugs.push({
          groupName: prescriptionDetails.groupName,
          drugForm: prescriptionDetails.drugForm,
          indication: prescriptionDetails.indication,
          instructions: prescriptionDetails.instructions,
          duration: parseInt(prescriptionDetails.duration) || 0,
          quantity: parseInt(prescriptionDetails.quantity) || 0,
          repeat: parseInt(prescriptionDetails.repeat) || 0,
          startDate: prescriptionDetails.startDate,
          longTerm: prescriptionDetails.longTerm,
          selectedDrugDetails: prescriptionDetails.selectedDrugDetails
        });
      }

      // Check if there are any drugs to submit
      if (allDrugs.length === 0) {
        Alert.alert('Error', 'Please add at least one drug to the prescription');
        setIsGenerating(false);
        return;
      }

      // Validate all drugs have groupName
      const invalidDrugs = allDrugs.filter(drug => !drug.groupName);
      if (invalidDrugs.length > 0) {
        Alert.alert('Error', 'All drugs must have a name');
        setIsGenerating(false);
        return;
      }

      const prescriptionData = {
        demographicNo: parseInt(patientDetails.demographicNo),
        drugData: allDrugs
      };

      console.log('Sending prescription data:', prescriptionData);

      const result = await dispatch(addPatientDrug(prescriptionData)).unwrap();
      console.log('Prescription Response:', result);

      if (result && result.status === "Success") {
        Alert.alert('Success', result.message || 'Prescription added successfully');
        navigation.goBack();
      }
    } catch (error) {
      console.error('Prescription Error:', error);
      Alert.alert('Error', error.message || 'Failed to generate prescription');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleReset = () => {
    try {
      setSearchQuery('');
      setIsDrugSelected(false);
      setPrescriptionDetails(initialPrescriptionDetails);
      setValidationErrors({
        indication: false,
        instructions: false,
        quantity: false,
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

  const renderPrescriptionForm = () => (
    <View style={styles.responsiveContainer}>
      {/* Drug Header with Details */}
      <View style={styles.drugHeader}>
        <Text style={styles.drugTitle}>{prescriptionDetails.groupName}</Text>
        <View style={styles.drugMetadata}>
          <Text style={styles.drugSubtitle}>
            {prescriptionDetails.drugForm} {prescriptionDetails.selectedDrugDetails?.category ? `• ${prescriptionDetails.selectedDrugDetails.category}` : ''}
          </Text>
        </View>
        <TouchableOpacity 
          style={styles.closeButton}
          onPress={handleReset}
        >
          <Text style={styles.closeButtonText}>×</Text>
        </TouchableOpacity>
      </View>
  
      {/* Indication Section */}
      <View style={styles.formSection}>
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
        <View style={styles.optionsContainer}>
          {prescriptionDetails.availableIndications?.map((item, index) => (
            <TouchableOpacity
              key={`indication-${index}`}
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
      </View>

      {/* Instructions Section */}
      <View style={styles.formSection}>
        <Text style={styles.sectionLabel}>
          Instructions<Text style={styles.required}>*</Text>
        </Text>
        <TextInput
          style={[
            styles.input, 
            styles.customInput, 
            styles.textArea,
            validationErrors.instructions && styles.inputError
          ]}
          placeholder="Type instructions here..."
          value={prescriptionDetails.instructions}
          onChangeText={(text) => {
            setPrescriptionDetails(prev => ({ ...prev, instructions: text }));
            setValidationErrors(prev => ({ ...prev, instructions: false }));
          }}
          multiline
          numberOfLines={3}
        />
        <View style={styles.optionsContainer}>
          {prescriptionDetails.availableIndications
            ?.find(item => item.indication === prescriptionDetails.indication)
            ?.instructions.map((instruction, index) => (
              <TouchableOpacity
                key={`instruction-${index}`}
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
      </View>

      {/* First Row: Long Term, Refills, Start Date */}
      <View style={styles.gridRow}>
        <View style={styles.gridCell}>
          <Text style={styles.gridLabel}>Long Term</Text>
          <TouchableOpacity
            style={styles.dropdownButton}
            onPress={() => setShowLongTermOptions(!showLongTermOptions)}
          >
            <Text style={styles.dropdownButtonText}>
              {prescriptionDetails.longTerm}
            </Text>
            <Text style={styles.dropdownIcon}>▼</Text>
          </TouchableOpacity>
          {showLongTermOptions && (
            <ScrollView style={styles.dropdownOptions}>
              {['Yes', 'No'].map((option) => (
                <TouchableOpacity
                  key={option}
                  style={styles.dropdownOption}
                  onPress={() => handleLongTermSelect(option)}
                >
                  <Text style={styles.dropdownOptionText}>{option}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>

        <View style={styles.gridCell}>
          <Text style={styles.gridLabel}>Refills<Text style={styles.required}>*</Text></Text>
          <TextInput
            style={[
              styles.gridInput,
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

        <View style={styles.gridCell}>
          <Text style={styles.gridLabel}>Start Date<Text style={styles.required}>*</Text></Text>
          <TouchableOpacity
            style={[
              styles.gridInput,
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
          
          {/* Custom Date Picker Modal */}
          <DatePickerModal
            visible={datePickerVisible}
            onClose={() => setDatePickerVisible(false)}
            onSelect={handleDateSelect}
            initialDate={prescriptionDetails.startDate || new Date().toISOString().split('T')[0]}
          />
        </View>
      </View>

      {/* Second Row: Quantity, Duration, End Date */}
      <View style={styles.gridRow}>
        <View style={styles.gridCell}>
          <Text style={styles.gridLabel}>Quantity<Text style={styles.required}>*</Text></Text>
          <TextInput
            style={[
              styles.gridInput,
              validationErrors.quantity && styles.inputError
            ]}
            value={prescriptionDetails.quantity?.toString()}
            keyboardType="numeric"
            onChangeText={(text) => {
              setPrescriptionDetails(prev => ({ ...prev, quantity: text ? parseInt(text) : '' }));
              setValidationErrors(prev => ({ ...prev, quantity: false }));
            }}
          />
        </View>

        <View style={styles.gridCell}>
          <Text style={styles.gridLabel}>Duration (days)<Text style={styles.required}>*</Text></Text>
          <TextInput
            style={[
              styles.gridInput,
              validationErrors.duration && styles.inputError
            ]}
            value={prescriptionDetails.duration?.toString()}
            keyboardType="numeric"
            onChangeText={(text) => {
              setPrescriptionDetails(prev => ({ ...prev, duration: text ? parseInt(text) : '' }));
              setValidationErrors(prev => ({ ...prev, duration: false }));
            }}
          />
        </View>

        <View style={styles.gridCell}>
          <Text style={styles.gridLabel}>End Date</Text>
          <TextInput
            style={[styles.gridInput, styles.disabledInput]}
            value={prescriptionDetails.endDate}
            editable={false}
            placeholder="Auto-calculated"
          />
        </View>
      </View>

      {/* Patient Compliance Section */}
      <View style={styles.formSection}>
        <Text style={styles.gridLabel}>Patient Compliance</Text>
        <TouchableOpacity
          style={styles.complianceButton}
          onPress={() => setShowComplianceOptions(true)}
        >
          <Text style={styles.complianceButtonText}>
            {prescriptionDetails.patientCompliance || patientDetails?.patientCompliance || 'Unknown'}
          </Text>
          <Text style={styles.dropdownIcon}>▼</Text>
        </TouchableOpacity>
        
        <ComplianceModal
          visible={showComplianceOptions}
          onClose={() => setShowComplianceOptions(false)}
          onSelect={handleComplianceSelect}
          selectedValue={prescriptionDetails.patientCompliance || patientDetails?.patientCompliance || 'Unknown'}
        />
      </View>
    </View>
  );

  const renderSearchResults = () => {
    try {
      if (!drugs || !Array.isArray(drugs.searchResults)) {
        console.log('Invalid search results state');
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
                  style={styles.deleteButton}
                  onPress={() => handleDeletePrescription(index)}
                >
                  <Text style={styles.deleteButtonText}>×</Text>
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
                <Text style={styles.detailText}>{prescription.longTerm}</Text>
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
              indication: false,
              instructions: false,
              quantity: false,
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
      padding: 8,
    },
    closeButtonText: {
      fontSize: 24,
      color: '#666',
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
      fontSize: 16,
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
    indicationsScrollView: {
      maxHeight: 150,
    },
    instructionsScrollView: {
      maxHeight: 150,
    },
    optionsScrollView: {
      maxHeight: 150,
    },
    suggestionsScrollView: {
      maxHeight: 200,
      width: '100%',
    },
    suggestionsContainer: {
      padding: 8,
      gap: 8,
    },
    suggestionButton: {
      backgroundColor: '#F8F9FA',
      borderWidth: 1,
      borderColor: '#E6E8EC',
      borderRadius: 8,
      padding: 12,
      minHeight: 40,
      justifyContent: 'center',
    },
    suggestionButtonSelected: {
      backgroundColor: '#E3F2FD',
      borderColor: '#0049F8',
    },
    suggestionText: {
      fontSize: 14,
      color: '#191919',
      lineHeight: 20,
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
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: '#FEE2E2',
      justifyContent: 'center',
      alignItems: 'center',
    },
    deleteButtonText: {
      fontSize: 24,
      color: '#DC2626',
      lineHeight: 24,
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
      // fontSize: 14,
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
          </View>
        </KeyboardAwareScrollView>
      </View>
    </SafeAreaView>
  );
};

export default Prescription; 