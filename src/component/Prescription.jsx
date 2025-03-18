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
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { addPatientDrug, searchDrugs, clearSearchResults } from '../Redux/Slices/DrugSlice';
import CustomHeader from './CustomHeader';
import debounce from 'lodash/debounce';

const Prescription = ({ route, navigation }) => {
  const dispatch = useDispatch();
  const { patientDetails } = route.params;
  const [searchQuery, setSearchQuery] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDrugSelected, setIsDrugSelected] = useState(false);
  const [lastSearchQuery, setLastSearchQuery] = useState('');
  const [showLongTermOptions, setShowLongTermOptions] = useState(false);
  const [showComplianceOptions, setShowComplianceOptions] = useState(false);
  
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
    patientCompliance: 'Unknown'
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
      
      // Get default values from first technical reason
      const defaultTechnicalReason = technicalReasons[0] || {};
      const defaultInstruction = defaultTechnicalReason.instructions?.[0] || '';

      setPrescriptionDetails(prev => ({
        ...prev,
        groupName: drug.group_name || '',
        drugForm: drug.dosage_form || '',
        instructions: defaultInstruction,
        indication: defaultTechnicalReason.indication || '',
        availableIndications: technicalReasons,
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

  const handleGeneratePrescription = async () => {
    if (!patientDetails?.demographicNo) {
      Alert.alert('Error', 'Patient information is missing');
      return;
    }

    // Validate form before proceeding
    if (!validateForm()) {
      Alert.alert('Validation Error', 'Please fill in all required fields');
      return;
    }

    setIsGenerating(true);
    try {
      // Only include the required fields in the prescription data
      const prescriptionData = {
        demographicNo: parseInt(patientDetails.demographicNo),
        drugData: [{
          groupName: prescriptionDetails.groupName,
          drugForm: prescriptionDetails.drugForm,
          indication: prescriptionDetails.indication,
          instructions: prescriptionDetails.instructions,
          duration: parseInt(prescriptionDetails.duration) || 0,
          quantity: parseInt(prescriptionDetails.quantity) || 0,
          repeat: parseInt(prescriptionDetails.repeat) || 0,
          startDate: prescriptionDetails.startDate,
          longTerm: prescriptionDetails.longTerm
        }]
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

  const renderPrescriptionForm = () => (
    <View style={styles.responsiveContainer}>
      {/* Drug Header with Details */}
      <View style={styles.drugHeader}>
        <Text style={styles.drugTitle}>{prescriptionDetails.groupName}</Text>
        <View style={styles.drugMetadata}>
          <Text style={styles.drugSubtitle}>
            {prescriptionDetails.drugForm} • {prescriptionDetails.selectedDrugDetails.category}
          </Text>
          <Text style={styles.drugDIN}>
            DIN: {prescriptionDetails.selectedDrugDetails.din}
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
        <View style={styles.optionsContainer}>
          {/* Custom Indication Input */}
          <TextInput
            style={[
              styles.input, 
              styles.customInput,
              validationErrors.indication && styles.inputError
            ]}
            placeholder="Type indication here..."
            value={prescriptionDetails.indication}
            onChangeText={(text) => {
              setPrescriptionDetails(prev => ({ ...prev, indication: text }));
              setValidationErrors(prev => ({ ...prev, indication: false }));
            }}
          />
          
          {prescriptionDetails.availableIndications?.length > 0 && (
            <>
              <Text style={styles.optionsLabel}>Or select from available options:</Text>
              <ScrollView 
                style={styles.suggestionsScrollView}
                showsVerticalScrollIndicator={true}
                nestedScrollEnabled={true}
              >
                <View style={styles.suggestionsContainer}>
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
              </ScrollView>
            </>
          )}
        </View>
      </View>

      {/* Instructions Section */}
      <View style={styles.formSection}>
        <Text style={styles.sectionLabel}>
          Instructions<Text style={styles.required}>*</Text>
        </Text>
        <View style={styles.optionsContainer}>
          {/* Custom Instructions Input */}
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
          
          {prescriptionDetails.availableIndications
            ?.find(item => item.indication === prescriptionDetails.indication)
            ?.instructions.length > 0 && (
            <>
              <Text style={styles.optionsLabel}>Or select from available options:</Text>
              <ScrollView 
                style={styles.suggestionsScrollView}
                showsVerticalScrollIndicator={true}
                nestedScrollEnabled={true}
              >
                <View style={styles.suggestionsContainer}>
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
              </ScrollView>
            </>
          )}
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
          <TextInput
            style={[
              styles.gridInput,
              validationErrors.startDate && styles.inputError
            ]}
            value={prescriptionDetails.startDate}
            onChangeText={(text) => {
              setPrescriptionDetails(prev => ({ ...prev, startDate: text }));
              setValidationErrors(prev => ({ ...prev, startDate: false }));
            }}
            placeholder="YYYY-MM-DD"
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
            {prescriptionDetails.patientCompliance}
          </Text>
          <Text style={styles.dropdownIcon}>▼</Text>
        </TouchableOpacity>
        
        <ComplianceModal
          visible={showComplianceOptions}
          onClose={() => setShowComplianceOptions(false)}
          onSelect={handleComplianceSelect}
          selectedValue={prescriptionDetails.patientCompliance}
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

        if (searchLoading) {
            return (
                <View style={styles.searchResults}>
                    <ActivityIndicator size="small" color="#0049F8" />
                </View>
            );
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
                                    {drug?.dosage_form && (
                                        <Text style={styles.drugForm}>
                                            {drug.dosage_form}
                                        </Text>
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
  const ComplianceModal = ({ visible, onClose, onSelect, selectedValue }) => (
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
          <Text style={styles.modalTitle}>Select Patient Compliance</Text>
          {['Unknown', 'No', 'Yes', ].map((option) => (
            <TouchableOpacity
              key={option}
              style={[
                styles.modalOption,
                selectedValue === option && styles.modalOptionSelected
              ]}
              onPress={() => {
                onSelect(option);
                onClose();
              }}
            >
              <Text style={[
                styles.modalOptionText,
                selectedValue === option && styles.modalOptionTextSelected
              ]}>
                {option}
              </Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity 
            style={styles.modalCloseButton}
            onPress={onClose}
          >
            <Text style={styles.modalCloseButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );

  // Add these new styles to your StyleSheet
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
      shadowOffset: {
        width: 0,
        height: 2,
      },
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
  };

  // Update the styles object
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#fff',
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
      flexDirection: 'row',
      padding: 16,
      gap: 12,
    },
    generateButton: {
      flex: 1,
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

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        backgroundColor="#0049F8"
        barStyle="light-content"
        translucent={false}
      />
      <CustomHeader
        title={`${patientDetails?.firstName || ''} ${patientDetails?.lastName || ''}`}
        onBack={() => navigation.goBack()}
      />

      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={true}
        nestedScrollEnabled={true}
      >
        <View style={styles.responsiveContainer}>
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search for Drugs"
              value={searchQuery}
              onChangeText={handleSearchChange}
            />
            {renderSearchResults()}
          </View>

          {isDrugSelected && renderPrescriptionForm()}

          {isDrugSelected && (
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.generateButton, isGenerating && styles.disabledButton]}
                onPress={handleGeneratePrescription}
                disabled={isGenerating}
              >
                <Text style={styles.generateButtonText}>
                  {isGenerating ? 'Generating...' : 'Generate Prescription'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.resetButton}
                onPress={handleReset}
              >
                <Text style={styles.resetButtonText}>Reset</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Prescription; 