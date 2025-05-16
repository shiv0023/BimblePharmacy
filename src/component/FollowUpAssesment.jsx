import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  ActivityIndicator, 
  ScrollView, 
  Alert,
  StyleSheet,
  SafeAreaView,
  Pressable,
  StatusBar
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { generateFollowupAssessment } from '../Redux/Slices/FollowUpAssessmentSlice';
import { getMedicationList } from '../Redux/Slices/MedicationlistSlice';
import { useNavigation, useRoute } from '@react-navigation/native';
import CustomHeader from './CustomHeader';
import RNHTMLtoPDF from 'react-native-html-to-pdf';
import FileViewer from 'react-native-file-viewer';
import { getFollowUpAssessmentHtml } from './FollowupAssessmentpdf'; // Make sure the import path is correct
import { getScopeAssessmentHtml } from './ScopeAssessmentpdf'; // Make sure the import path is correct
import { fetchClinicDetails } from '../Redux/Slices/ClinicDetails';
import { fetchPatientDetails } from '../Redux/Slices/PatientDetailsSlice';
import { savePdfDocument } from '../Redux/Slices/SoapNotesSlice';


const FollowUpAssessment = () => {
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const route = useRoute();
  
  const { 
    gender, 
    dob, 
    condition, 
    appointmentNo, 
    scope,
    answers: initialAnswers = [],
    patient
  } = route.params || {};

  const followupAssessment = useSelector(state => state.auth.followupAssessment || {});
  const clinicDetails = useSelector(state => state.auth?.clinicDetails.data);
console.log(clinicDetails,'hello')
  const patientDetails = useSelector(state => state.auth?.patientDetails.dataaaa);
  console.log(patientDetails,'hellogx')
  const questions = followupAssessment.data || [];
  const loading = followupAssessment.loading || false;
  const error = followupAssessment.error;

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [isDataLoading, setIsDataLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchQuestions = async () => {
      // Get scope from remarks or other sources
      const currentScope = scope || 
                         route.params?.scopeAssessment?.scope || 
                         route.params?.remarks;

      // Get scope answers from pre-assessment or create default ones from remarks
      const scopeAnswers = route.params?.scopeAssessment?.scopeAnswers || 
                          (route.params?.remarks ? {
                            condition: condition,
                            status: route.params.remarks
                          } : {});

      try {
        setIsDataLoading(true);
        const result = await dispatch(generateFollowupAssessment({
          gender,
          dob,
          condition,
          appointmentNo,
          scope: currentScope,
          scopeAnswers: scopeAnswers
        })).unwrap();

        console.log('Follow-up questions result:', result);
        
        // Initialize answers if we have initial answers
        if (initialAnswers?.length > 0) {
          const initialAnswersMap = {};
          initialAnswers.forEach((answer, index) => {
            initialAnswersMap[index] = answer;
          });
          setAnswers(initialAnswersMap);
        }

      } catch (error) {
        console.error('Error fetching follow-up questions:', error);
        Alert.alert(
          'Error',
          error.message || 'Failed to load follow-up questions'
        );
        navigation.goBack();
      } finally {
        setIsDataLoading(false);
      }
    };

    fetchQuestions();
  }, [dispatch, navigation, gender, dob, condition, appointmentNo, scope, route.params]);

  useEffect(() => {
    dispatch(fetchClinicDetails());
    if (route.params?.demographicNo) {
      dispatch(fetchPatientDetails({ demographicNo: route.params.demographicNo }));
    }
  }, [dispatch, route.params?.demographicNo]);

  const handleAnswerSelect = (answer) => {
    setAnswers(prev => ({
      ...prev,
      [currentQuestionIndex]: answer
    }));
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    try {
      setIsLoading(true);
      
      const answersArray = Object.entries(answers).map(([index, answer]) => ({
        questionId: parseInt(index) + 1,
        answer: answer
      }));

      const currentScope = scope || route.params?.scope;

      // Map clinic details to expected keys
      const mappedClinic = {
        clinicName: clinicDetails?.entityName || '',
        address: clinicDetails?.address || '',
        city: clinicDetails?.city || '',
        province: clinicDetails?.province || '',
        postalCode: clinicDetails?.postalCode || '',
        phone: clinicDetails?.phoneNo || '',
        fax: clinicDetails?.faxNo || '',
        logo: clinicDetails?.logo ? `https://api.bimble.pro/media/${clinicDetails.logo}` : '',
        // add more fields as needed
      };

      // Format patient details properly
      const formattedPatient = {
        name: `${patientDetails?.firstName || ''} ${patientDetails?.lastName || ''}${patientDetails?.gender ? '/' + (patientDetails.gender === 'M' ? 'Male' : 'Female') : ''}`,
        dob: patientDetails?.dob || dob || '',
        phn: patientDetails?.phn || route.params?.phn || '',
        address: [
          patientDetails?.address,
          patientDetails?.city,
          patientDetails?.province,
          patientDetails?.postalCode
        ].filter(Boolean).join(', '),
        reason: condition || ''
      };

      // Generate HTML with the formatted patient data
      const htmlContent = getFollowUpAssessmentHtml({
        clinic: mappedClinic,
        patient: formattedPatient, // Use the formatted patient details
        questions: questions.map(q => q.question),
        answers: questions.map((q, idx) => answers[idx] || ''),
        followUpDate: new Date().toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric', 
          year: 'numeric' 
        }),
        statusText: currentScope && currentScope.toLowerCase().includes('refer') ? 'Refer' : 'In Scope',
        statusClass: currentScope && currentScope.toLowerCase().includes('refer') ? 'refer' : 'inscope',
        logoBase64: mappedClinic.logo,
        reason: condition
      });

      // Generate PDF
      const options = {
        html: htmlContent,
        fileName: `FollowUp_Assessment_${patientDetails?.firstName}_${patientDetails?.lastName}_${new Date().toISOString().split("T")[0]}.pdf`,
        directory: Platform.OS === 'android' ? 'Download' : 'Documents',
        base64: false
      };

      const file = await RNHTMLtoPDF.convert(options);
      
      // Get and validate both numbers
      const numericDemographicNo = parseInt(route.params?.demographicNo, 10);
      const numericAppointmentNo = parseInt(route.params?.appointmentNo, 10);

      console.log('[DEBUG] Save document values:', {
        demographicNo: numericDemographicNo,
        appointmentNo: numericAppointmentNo
      });

      // Save PDF to document storage
      const saveDocumentResponse = await dispatch(savePdfDocument({
        demographicNo: numericDemographicNo,
        appointmentNo: numericAppointmentNo,
        pdfFile: {
          uri: Platform.OS === 'ios' ? file.filePath : `file://${file.filePath}`,
          name: options.fileName,
          type: 'application/pdf'
        }
      })).unwrap();
      
      console.log('[DEBUG] PDF saved to document storage:', saveDocumentResponse);

      // Show the PDF regardless of save status
      await FileViewer.open(file.filePath, {
        showOpenWithDialog: true,
        onDismiss: () => {
          console.log('PDF viewer dismissed');
        }
      });

      // Handle the result
      if (route.params?.onDone) {
        route.params.onDone({
          scopeStatus: currentScope,
          followUpAnswers: answersArray,
          scopeAnswers: route.params?.scopeAssessment?.scopeAnswers,
          appointmentNo,
          scope: currentScope,
        });
      }

      navigation.goBack();
    } catch (error) {
      console.error('Submit error:', error);
      Alert.alert('Error', 'Failed to submit assessment');
    } finally {
      setIsLoading(false);
    }
  };

  if (isDataLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <CustomHeader title="Follow-up Assessment" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0049F8" />
        </View>
      </SafeAreaView>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];

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
    <SafeAreaView style={{ flex: 1, }}>
    
      <CustomHeader title="Follow-up Assessment" />
      <ScrollView style={styles.scrollView}>
        {/* <Text style={styles.title}>Follow-up Assessment</Text>
         */}
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>
              {typeof error === 'string' ? error : error?.message || 'An error occurred'}
            </Text>
          </View>
        )}
        
        {questions.length > 0 && currentQuestion && (
          <View style={styles.questionContainer}>
            <Text style={styles.questionText}>
              {currentQuestion.question}
            </Text>
            <View style={styles.optionsContainer}>
              {currentQuestion.options.map((option, index) => (
                <Pressable
                  key={index}
                  style={[
                    styles.optionButton,
                    answers[currentQuestionIndex] === option && styles.selectedOption
                  ]}
                  onPress={() => handleAnswerSelect(option)}
                >
                  <Text style={[
                    styles.optionText,
                    answers[currentQuestionIndex] === option && styles.selectedOptionText
                  ]}>
                    {option}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {questions.length === 0 && !loading && !error && (
          <View style={styles.messageContainer}>
            <Text style={styles.messageText}>No questions available</Text>
          </View>
        )}

        <View style={styles.navigationContainer}>
          <TouchableOpacity 
            style={[styles.navButton, currentQuestionIndex === 0 && styles.disabledButton]}
            onPress={handlePrevious}
            disabled={currentQuestionIndex === 0}
          >
            <Text style={styles.navButtonText}>Previous</Text>
          </TouchableOpacity>

          {currentQuestionIndex === questions.length - 1 ? (
            <TouchableOpacity 
              style={[
                styles.navButton,
                styles.submitButton,
                isLoading && styles.disabledButton
              ]}
              onPress={handleSubmit}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
              <Text style={styles.submitButtonText}>Submit</Text>
              )}
            </TouchableOpacity>
          ) : (
            <TouchableOpacity 
              style={[styles.navButton, !answers[currentQuestionIndex] && styles.disabledButton]}
              onPress={handleNext}
              disabled={!answers[currentQuestionIndex]}
            >
              <Text style={styles.navButtonText}>Next</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  questionContainer: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  questionText: {
    fontSize: 14,
    color: '#222',
    fontWeight:400
  },
  optionsContainer: {
    marginTop: 12,
  },
  optionButton: {
    padding: 16,
    borderRadius: 8,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    marginBottom: 8,
  },
  selectedOption: {
    backgroundColor: '#0049F8',
    borderColor: '#0049F8',
  },
  optionText: {
    fontSize: 14,
    color: '#222',
    fontWeight:'300'
  },
  selectedOptionText: {
    color: '#fff',
  },
  navigationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginTop: 24,
    marginBottom: 32,
   
  },
  navButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    backgroundColor: '#0049F8',
    minWidth: 120,
    alignItems: 'center',
  
  },
  navButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '400',
    
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  submitButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    backgroundColor: '#4CAF50',
    minWidth: 120,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 16,
  },
  errorContainer: {
    padding: 16,
    backgroundColor: '#ffebee',
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    color: '#c62828',
    fontSize: 14,
  },
  messageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageText: {
    color: '#222',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default FollowUpAssessment;