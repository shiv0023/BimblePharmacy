import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput, ActivityIndicator, Alert, Platform } from 'react-native';
import CustomHeader from './CustomHeader';
import { useDispatch, useSelector } from 'react-redux';
import { getScopeStatus } from '../Redux/Slices/GenerateAssessmentslice';
import RNFS from 'react-native-fs';
import FileViewer from 'react-native-file-viewer';
import RNHTMLtoPDF from 'react-native-html-to-pdf';
import ScopeAssessmentPdf from '../component/ScopeAssessmentpdf.'; // fix the import path if needed
import { fetchClinicDetails } from '../Redux/Slices/ClinicDetails'; // adjust path as needed
import { getStaticScopeAssessmentHtml } from './ScopeAssessmentpdf..jsx';
import { fetchPatientDetails } from '../Redux/Slices/PatientDetailsSlice';
import { savePdfDocument } from '../Redux/Slices/SoapNotesSlice';

function calculateFullAge(year, month, day) {
  if (!year || !month || !day) return null;
  const today = new Date();
  const birthDate = new Date(year, month - 1, day); // month is 0-indexed
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

function getAgeString(year, month, day) {
  if (!year || !month || !day) return '';
  const today = new Date();
  const birthDate = new Date(year, month - 1, day);
  let years = today.getFullYear() - birthDate.getFullYear();
  let months = today.getMonth() - birthDate.getMonth();
  if (today.getDate() < birthDate.getDate()) {
    months--;
  }
  if (months < 0) {
    years--;
    months += 12;
  }
  return `${years} years${months > 0 ? ` ${months} months` : ''}`;
}

const AcneScopeAssessment = ({
  questions,
  onSubmit,
  onCancel,
  gender,
  reason,
  ageString,
  year_of_birth,
  month_of_birth,
  date_of_birth,
  dob,
  previousAnswers,
  demographicNo,
  appointmentNo,
  remarks,
  subdomain
}) => {
  const dispatch = useDispatch();

  console.log('Subdomain in Scope Assessment page:', subdomain);
  const scopeStatusLoading = useSelector(
    state => state.generateAssessment?.scopeStatusLoading || false
  );

  const clinic = useSelector(state => state.auth?.clinicDetails?.data);
  console.log(clinic,'hii')
  const patientDetails = useSelector(state => state.auth?.patientDetails?.dataaaa || {});

  const [assessmentDataState, setAssessmentDataState] = useState({});
  const [localLoading, setLocalLoading] = useState(false);

  const appointment = useSelector(state => state.appointment?.selectedAppointment);

  const authData = useSelector(state => state.auth?.userData || {});
console.log (authData,'subdoomain')
  const computedAgeString = ageString || getAgeString(year_of_birth, month_of_birth, date_of_birth);

  // Add this console log to debug demographicNo
  console.log('DemographicNo from props:', demographicNo);
  console.log('PatientDetails:', patientDetails);
  useEffect(() => {
    if (!clinic) {
      dispatch(fetchClinicDetails());
    }
  }, [clinic, dispatch]);

  useEffect(() => {
    const initialState = {};
    questions.forEach((q, idx) => {
      if (previousAnswers && previousAnswers[q.question] !== undefined) {
        initialState[`question_${idx}`] = previousAnswers[q.question];
      } else if (remarks) {
        initialState[`question_${idx}`] = q.type === 'checkbox' ? [] : '';
      } else if (q.type === 'checkbox') {
        initialState[`question_${idx}`] = [];
      } else {
        initialState[`question_${idx}`] = '';
      }
    });
    setAssessmentDataState(initialState);
  }, [questions, previousAnswers, remarks]);

  useEffect(() => {
    if (demographicNo) {
      dispatch(fetchPatientDetails({ demographicNo }));
    }
  }, [demographicNo, dispatch]);

  const renderQuestion = (question, index) => {
    switch (question.type) {
      case 'text':
        return (
          <View style={styles.questionContainer} key={index}>
            <Text style={styles.questionText}>{question.question}</Text>
            <TextInput 
              style={styles.input}
              value={assessmentDataState[`question_${index}`] || ''}
              onChangeText={(text) => setAssessmentDataState({...assessmentDataState, [`question_${index}`]: text})}
              keyboardType="numeric"
              placeholder="Enter your answer"
            />
          </View>
        );

      case 'button':
        return (
          <View style={styles.questionContainer} key={index}>
            <Text style={styles.questionText}>{question.question}</Text>
            {question.note && (
              <Text style={styles.noteText}>{question.note}</Text>
            )}
            <View style={styles.buttonGroup}>
              {question.options.map((option, optionIndex) => (
                <TouchableOpacity 
                  key={optionIndex}
                  style={[
                    styles.button,
                    assessmentDataState[`question_${index}`] === option && styles.buttonSelected
                  ]}
                  onPress={() => setAssessmentDataState({
                    ...assessmentDataState,
                    [`question_${index}`]: option
                  })}
                >
                  <Text style={[
                    styles.buttonText,
                    assessmentDataState[`question_${index}`] === option && styles.buttonTextSelected
                  ]}>{option}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );

      case 'checkbox':
        return (
          <View style={styles.questionContainer} key={index}>
            <Text style={styles.questionText}>{question.question}</Text>
            {question.note && (
              <Text style={styles.noteText}>{question.note}</Text>
            )}
            <View style={styles.checkboxGroup}>
              {question.options.map((option, optionIndex) => {
                const isSelected = assessmentDataState[`question_${index}`]?.includes(option);
                return (
                  <TouchableOpacity 
                    key={optionIndex}
                    style={styles.checkboxRow}
                    onPress={() => {
                      const currentSelections = assessmentDataState[`question_${index}`] || [];
                      const newSelections = isSelected
                        ? currentSelections.filter(item => item !== option)
                        : [...currentSelections, option];
                      setAssessmentDataState({
                        ...assessmentDataState,
                        [`question_${index}`]: newSelections
                      });
                    }}
                  >
                    <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                      {isSelected && (
                        <Text style={styles.checkmark}>✓</Text>
                      )}
                    </View>
                    <Text style={styles.checkboxText}>{option}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        );

      default:
        return null;
    }
  };

  // Update shouldShowQuestion to handle dependencies properly
  const shouldShowQuestion = (question, index) => {
    // If question has a dependency
    if (question.dependsOn) {
      // Find the parent question by key
      const parentQuestion = questions.find(q => q.key === question.dependsOn.key);
      if (!parentQuestion) return false;

      // Find the index of the parent question
      const parentIndex = questions.indexOf(parentQuestion);
      if (parentIndex === -1) return false;

      // Get the parent question's answer
      const parentAnswer = assessmentDataState[`question_${parentIndex}`];
      
      // Show this question only if parent's answer matches the required value
      return parentAnswer === question.dependsOn.value;
    }

    // If no dependencies, show the question
    return true;
  };

  const handleCheckScope = async () => {
    // Only validate visible questions
    const visibleQuestions = questions.filter((q, idx) => shouldShowQuestion(q, idx));

    const missing = visibleQuestions.filter((q, idx) => {
      const answer = assessmentDataState[`question_${questions.indexOf(q)}`];
      return typeof answer === 'undefined' || answer === null || answer === '' || 
             (Array.isArray(answer) && answer.length === 0);
    });

    if (missing.length > 0) {
      Alert.alert('Please answer all questions before submitting.');
      return;
    }

    setLocalLoading(true);

    // Build scopeAnswers with the exact structure needed
    const scopeAnswers = {};
    questions.forEach((q, idx) => {
      const isVisible = shouldShowQuestion(q, idx);
      let answer = isVisible ? assessmentDataState[`question_${idx}`] : '';
      
      // Convert answers to lowercase
      if (q.type === 'checkbox') {
        // For checkbox, convert each array item to lowercase
        answer = Array.isArray(answer) ? answer.map(item => item.toLowerCase()) : [];
        scopeAnswers[q.question] = answer;
      } else {
        // For other types (button, text, etc), convert string to lowercase
        answer = (typeof answer === 'string' ? answer.toLowerCase() : '');
        scopeAnswers[q.question] = answer;
      }
    });

    // Format DOB if not provided directly
    const formattedDob = dob || `${year_of_birth}-${month_of_birth}-${date_of_birth}`;

    const payload = {
   
      scopeAnswers: scopeAnswers, // This will now contain all lowercase answers
      reason: reason,
      gender: gender,
      dob: formattedDob,
      appointmentNo: appointmentNo,
      subdomainBimble: subdomain
    };

    console.log('Payload:', payload);

    try {
      const result = await dispatch(getScopeStatus(payload)).unwrap();
      
      // Get the scope status from the result or use remarks
      const scopeStatus = result?.scopeStatus || result?.status || remarks || 'In Scope';
      console.log('Scope status:', scopeStatus);

      // Use the clinic and patientDetails from the component level
      const patient = {
        name: `${patientDetails?.firstName || ''} ${patientDetails?.lastName || ''}${patientDetails?.gender ? '/' + (patientDetails.gender === 'M' ? 'Male' : 'Female') : ''}`,
        dob: patientDetails?.dob || '',
        phn: patientDetails?.phn || '',
        address: [
          patientDetails?.address,
          patientDetails?.city,
          patientDetails?.province,
          patientDetails?.postalCode
        ].filter(Boolean).join(', '),
        reason: reason || ''
      };

      const questionsArr = questions.map(q => q.question);
      const answersArr = questions.map((q, idx) => scopeAnswers[q.question] || '');

      // Generate PDF
      const htmlContent = getStaticScopeAssessmentHtml({
        clinic,
        patient,
        questions: questionsArr,
        answers: answersArr,
        assessmentResult: result?.assessmentResult || '',
        scopeStatus: result?.scopeStatus || '',
        scopeStatusReason: result?.scopeStatusReason || '',
      });

      // Create PDF file
      const options = {
        html: htmlContent,
        fileName: `Scope_Assessment_${patientDetails?.firstName || ''}_${patientDetails?.lastName || ''}_${new Date().toISOString().split("T")[0]}.pdf`,
        directory: Platform.OS === 'android' ? 'Download' : 'Documents',
        base64: false
      };

      try {
        const file = await RNHTMLtoPDF.convert(options);
        console.log('PDF generated:', file);

        // Validate and convert demographicNo to integer
        const numericDemographicNo = parseInt(demographicNo, 10);
        if (isNaN(numericDemographicNo)) {
          console.error('Invalid demographicNo:', demographicNo);
          Alert.alert('Warning', 'Invalid patient information format');
          return;
        }

        // Log the parameters being sent
        console.log('Saving PDF with params:', {
          demographicNo: numericDemographicNo,
          fileName: options.fileName,
          filePath: file.filePath
        });

        // Save PDF to document storage
        try {
          const saveDocumentResponse = await dispatch(savePdfDocument({
            demographicNo: numericDemographicNo, // Send as integer
            pdfFile: {
              uri: Platform.OS === 'ios' ? file.filePath : `file://${file.filePath}`,
              name: options.fileName,
              type: 'application/pdf'
            }
          })).unwrap();
          
          console.log('PDF saved to document storage:', saveDocumentResponse);
        } catch (saveError) {
          console.error('Error saving PDF to document storage:', saveError);
          console.error('DemographicNo value:', numericDemographicNo);
          Alert.alert('Warning', 'PDF generated but failed to save to document storage');
        }

        // Show the PDF regardless of save status
        await FileViewer.open(file.filePath, {
          showOpenWithDialog: true,
          onDismiss: () => {
            console.log('PDF viewer dismissed');
          }
        });

        // Continue with the existing onSubmit callback
        onSubmit && onSubmit({
          result,
          formattedPayload: {
            reason: reason || '',
            scopeAnswers: scopeAnswers,
            gender: gender || '',
            dob: formattedDob,
            appointmentNo: appointmentNo
          },
          scopeStatus: scopeStatus
        });

      } catch (pdfError) {
        console.error('PDF generation or viewing error:', pdfError);
        Alert.alert('Error', 'Failed to generate or view PDF');
      }

    } catch (error) {
      console.error('Failed to get scope status:', error);
      Alert.alert('Error', 'Failed to process assessment');
    } finally {
      setLocalLoading(false);
    }
  };

  const fullAge = appointment?.age !== undefined && appointment?.age !== null
    ? appointment.age
    : calculateFullAge(
        appointment?.year_of_birth,
        appointment?.month_of_birth,
        appointment?.date_of_birth
      );

  return (
    <View style={styles.container}>
      <CustomHeader title=" Scope Assessment" />
      <ScrollView style={styles.scrollView}>
        {/* <Text style={styles.assessmentTitle}>Acne Scope Assessment</Text> */}
        
        {questions.map((question, index) => {
          // Only render if the question should be shown
          if (!shouldShowQuestion(question, index)) {
            return null;
          }
          return renderQuestion(question, index);
        })}

        <TouchableOpacity 
          style={styles.submitButton} 
          onPress={handleCheckScope}
          disabled={scopeStatusLoading || localLoading}
        >
          {(scopeStatusLoading || localLoading) ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>Check Scope</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.cancelButton} 
          onPress={onCancel}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>

      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  
  },
  scrollView: {
    flex: 1,
    padding: 20,
  },
  assessmentTitle: {
    fontSize: 24,
    fontWeight: '400',
    paddingTop: 2,
    marginBottom: 20,
 
  },
  questionContainer: {
    marginBottom: 20,
  },
  questionText: {
    fontSize: 14,
    marginBottom: 10,
    fontWeight: '200',
    marginLeft:2
  },
  noteText: {
    fontWeight: '200',
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    marginBottom: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    backgroundColor: '#fff',
  },
  buttonGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    
  },
  button: {
    flex: 1,
    padding: 5,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginHorizontal: 6,
    alignItems: 'center',
  },
  buttonSelected: {
    backgroundColor: '#0049F8',
    borderColor: '#0049F8',
  },
  buttonText: {
    fontSize: 14,
    color: '#222',
    fontWeight: '200',
  },
  buttonTextSelected: {
    color: '#fff',
  },
  checkboxGroup: {
    marginTop: 10,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#ddd',
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  checkboxSelected: {
    borderColor: '#0049F8',
    backgroundColor: '#0049F8',
  },
  checkmark: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    lineHeight: 18,

 
  },
  checkboxText: {
    fontSize: 16,
    color: '#222',
    flex: 1,
    fontWeight:'200',

    
  
   
  },
  submitButton: {
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  cancelButton: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  cancelButtonText: {
    color: '#222',
    fontSize: 18,
    fontWeight: '500',
  },
});

export default AcneScopeAssessment;