import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  ActivityIndicator,
  StatusBar,
  Platform,
  Dimensions,
  Alert,
} from 'react-native';
import CustomHeader from './CustomHeader';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { useDispatch, useSelector } from 'react-redux';
import { fetchAssessmentQuestions } from '../Redux/Slices/GenerateAssessmentslice';
import { getScopeStatus } from '../Redux/Slices/GenerateAssessmentSlice';

const { width, height } = Dimensions.get('window');

const isReferralQuestion = (question, answer) => {
  if (!question.note) return false;
  if (answer === 'Yes' && question.note.includes("'Yes' will Refer")) return true;
  if (answer === 'No' && question.note.includes("'No' will Refer")) return true;
  if (question.type === 'checkbox' && 
      question.note.includes("any option other than 'Face'") && 
      answer.length > 0 && 
      !answer.includes('Face')) return true;
  return false;
};

const Assessment = ({ route, navigation }) => {
  const {
    patientId,
    patientName,
    appointmentReason,
    appointmentDesc,
    appointmentDate,
    chatType,
    gender,
    age
  } = route.params;

  const dispatch = useDispatch();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showOtherInput, setShowOtherInput] = useState(false);

  // Get questions from Redux store
  const { questions, questionsLoading, questionsError } = useSelector(
    (state) => state.generateAssessment
  );

  // Fetch questions when component mounts
  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        await dispatch(fetchAssessmentQuestions({
          condition: appointmentReason,
          gender,
          age
        })).unwrap();
      } catch (error) {
        setError('Failed to load questions');
      }
    };

    fetchQuestions();
  }, [appointmentReason, gender, age, dispatch]);

  const handleAnswer = (questionId, answer) => {
    setError('');
    const question = questions.find(q => q.question === questionId);
    
    // Check if this answer should trigger a referral
    if (question?.note) {
      if (
        (answer === 'Yes' && question.note.includes("'Yes' will Refer")) ||
        (answer === 'No' && question.note.includes("'No' will Refer")) ||
        (question.type === 'checkbox' && 
         question.note.includes("any option other than 'Face'") && 
         !answer.includes('Face'))
      ) {
        Alert.alert(
          'Referral Required',
          'Based on your answer, this condition requires a referral to a healthcare provider.',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
        return;
      }
    }

    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const isCurrentQuestionAnswered = () => {
    if (!questions || !questions[currentQuestionIndex]) {
      return false;
    }

    const currentQuestion = questions[currentQuestionIndex];
    const currentAnswer = answers[currentQuestion.question];

    // If the question is optional, always return true
    if (currentQuestion.optional === true) {
      return true;
    }

    // If it's a dependent question and dependency is not met, return true
    if (currentQuestion.dependsOn) {
      const dependentAnswer = answers[currentQuestion.dependsOn.questionId];
      if (dependentAnswer !== currentQuestion.dependsOn.answer) {
        return true;
      }
    }

    // Check answer based on question type
    switch (currentQuestion.type) {
      case 'text':
        return Boolean(currentAnswer && currentAnswer.trim().length > 0);
      case 'scale':
        return typeof currentAnswer !== 'undefined';
      case 'boolean':
        return typeof currentAnswer !== 'undefined';
      case 'multiple':
        return Array.isArray(currentAnswer) ? currentAnswer.length > 0 : Boolean(currentAnswer);
      default:
        return true;
    }
  };

  const handleNavigation = async (direction) => {
    if (direction === 'next') {
      // Check if current question needs to be answered
      if (!isCurrentQuestionAnswered()) {
        setError('Please answer the question before proceeding');
        return;
      }
      
      if (currentQuestionIndex === questions.length - 1) {
        try {
          setIsSubmitting(true);
          
          // Prepare answers for submission
          const finalAnswers = {};
          questions.forEach((q) => {
            // For optional questions or questions with unmet dependencies, use empty string
            if (q.optional || (q.dependsOn && !shouldShowQuestion(q))) {
              finalAnswers[q.question] = '';
            } else {
              finalAnswers[q.question] = answers[q.question] || '';
            }
          });

          // Submit assessment
          await dispatch(getScopeStatus({
            reason: appointmentReason,
            gender,
            scopeAnswers: finalAnswers,
            dob: appointmentDate,
            appointmentNo: patientId
          })).unwrap();

          navigation.goBack();
        } catch (error) {
          setError('Failed to submit assessment');
        } finally {
          setIsSubmitting(false);
        }
      } else {
        let nextIndex = currentQuestionIndex + 1;
        while (nextIndex < questions.length && !shouldShowQuestion(questions[nextIndex])) {
          nextIndex++;
        }
        setCurrentQuestionIndex(nextIndex);
        setError('');
      }
    } else {
      let prevIndex = currentQuestionIndex - 1;
      while (prevIndex >= 0 && !shouldShowQuestion(questions[prevIndex])) {
        prevIndex--;
      }
      setCurrentQuestionIndex(prevIndex);
      setError('');
    }
  };

  const renderOtherInput = (questionId) => {
    const hasOtherSelected = (answers[questionId] || []).includes('Other');
    
    if (hasOtherSelected && showOtherInput) {
      return (
        <TextInput
          style={[styles.input, styles.otherInput]}
          placeholder="Please specify..."
          value={answers[`${questionId}_other`] || ''}
          onChangeText={(text) => handleAnswer(`${questionId}_other`, text)}
        />
      );
    }
    return null;
  };

  const shouldShowQuestion = (question, index) => {
    // For the first question, always show
    if (index === 0) return true;

    // Get previous question's answer
    const prevQuestion = questions[index - 1];
    const prevAnswer = answers[prevQuestion.question];

    // If previous question wasn't answered or was answered 'No', don't show this question
    if (!prevAnswer || prevAnswer === 'No') return false;

    // For checkbox type questions, check if Face was selected
    if (prevQuestion.type === 'checkbox' && 
        prevQuestion.note?.includes("'Face'")) {
      return prevAnswer.includes('Face');
    }

    return true;
  };

  const renderQuestion = (question) => {
    return (
      <View style={styles.questionContainer} key={question.question}>
        <Text style={styles.questionText}>{question.question}</Text>
        {question.note && (
          <Text style={styles.noteText}>{question.note}</Text>
        )}
        {question.type === 'button' && (
          <View style={styles.buttonGroup}>
            {question.options.map((option) => (
              <TouchableOpacity
                key={option}
                style={[
                  styles.button,
                  answers[question.question] === option && styles.selectedButton
                ]}
                onPress={() => handleAnswer(question.question, option)}
              >
                <Text style={[
                  styles.buttonText,
                  answers[question.question] === option && styles.selectedButtonText
                ]}>
                  {option}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
        {question.type === 'checkbox' && (
          <View style={styles.checkboxGroup}>
            {question.options.map((option) => {
              const isSelected = (answers[question.question] || []).includes(option);
              return (
                <TouchableOpacity
                  key={option}
                  style={styles.checkboxRow}
                  onPress={() => {
                    const currentAnswers = answers[question.question] || [];
                    const newAnswers = isSelected
                      ? currentAnswers.filter(a => a !== option)
                      : [...currentAnswers, option];
                    handleAnswer(question.question, newAnswers);
                  }}
                >
                  <View style={[styles.checkbox, isSelected && styles.selectedCheckbox]}>
                    {isSelected && <Text style={styles.checkmark}>✓</Text>}
                  </View>
                  <Text style={styles.checkboxText}>{option}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </View>
    );
  };

  const renderHeader = () => (
    <View style={styles.headerSection}>
      <View style={styles.reasonContainer}>
        <Text style={styles.reasonLabel}>Patient's Reason for Visit:</Text>
        <Text style={styles.reasonText}>
          {appointmentReason}
          {appointmentDesc ? ` - ${appointmentDesc}` : ''}
        </Text>
      </View>
      <View style={styles.doctorNote}>
        <Text style={styles.doctorNoteText}>
          Please answer the following questions to help your doctor better understand your condition.
        </Text>
      </View>
    </View>
  );

  const renderQuestionSection = (question) => {
    if (!question || !shouldShowQuestion(question, currentQuestionIndex)) {
      return null;
    }

    return (
      <View style={styles.questionSection}>
        <View style={styles.questionHeader}>
          <Text style={styles.doctorLabel}>Dr's Question:</Text>
          <Text style={styles.questionNumber}>
            {currentQuestionIndex + 1} of {questions.length}
          </Text>
        </View>
        <Text style={styles.questionText}>
          {question.question || 'No question available'}
        </Text>
        <Text style={styles.patientLabel}>Your Answer:</Text>
        {renderQuestion(question)}
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
      </View>
    );
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      
      // Format answers for API
      const scopeAnswers = {};
      questions.forEach(question => {
        // Initialize with empty string
        scopeAnswers[question.question] = '';
        
        // If answer exists, format it properly
        if (answers[question.question]) {
          if (question.type === 'checkbox') {
            scopeAnswers[question.question] = answers[question.question].join(', ');
          } else {
            scopeAnswers[question.question] = answers[question.question];
          }
        }
      });

      console.log('Submitting answers:', scopeAnswers);

      const result = await dispatch(getScopeStatus({
        reason: appointmentReason,
        gender,
        scopeAnswers,
        dob: appointmentDate,
        appointmentNo: patientId
      })).unwrap();

      if (result) {
        navigation.goBack();
      }
    } catch (error) {
      console.error('Submit error:', error);
      Alert.alert('Error', 'Failed to submit assessment');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        backgroundColor="#0049F8"
        barStyle="light-content"
        translucent={false}
      />
      <View style={styles.statusBarBackground} />
      <CustomHeader 
        title={`Medical Assessment`}
        onBack={() => navigation.goBack()}
      />
      
      <View style={styles.mainContainer}>
        {questionsLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#0049F8" />
            <Text style={styles.loadingText}>Loading questions...</Text>
          </View>
        ) : questionsError ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{questionsError}</Text>
          </View>
        ) : questions.length > 0 ? (
          <KeyboardAwareScrollView
            style={styles.scrollContent}
            contentContainerStyle={styles.scrollContentContainer}
            showsVerticalScrollIndicator={false}
            bounces={true}
            enableOnAndroid={true}
            enableAutomaticScroll={true}
            keyboardShouldPersistTaps="handled"
            extraScrollHeight={Platform.OS === 'ios' ? 20 : 80}
            extraHeight={120}
            enableResetScrollToCoords={false}
          >
            {renderHeader()}
            <View style={styles.questionContainer}>
              {renderQuestionSection(questions[currentQuestionIndex])}
            </View>
            <View style={styles.bottomPadding} />
          </KeyboardAwareScrollView>
        ) : (
          <View style={styles.loadingContainer}>
            <Text style={styles.errorText}>No questions available</Text>
          </View>
        )}

        {!questionsLoading && questions.length > 0 && (
          <View style={styles.navigationButtonsContainer}>
            <View style={styles.navigationButtons}>
              <TouchableOpacity
                style={[
                  styles.navButton,
                  currentQuestionIndex === 0 && styles.disabledButton
                ]}
                onPress={() => handleNavigation('previous')}
                disabled={currentQuestionIndex === 0 || isSubmitting}
              >
                <Text style={[
                  styles.navButtonText,
                  currentQuestionIndex === 0 && styles.disabledButtonText
                ]}>Previous</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.navButton,
                  !isCurrentQuestionAnswered() && styles.disabledButton,
                  currentQuestionIndex === questions.length - 1 && 
                    isCurrentQuestionAnswered() && styles.submitButton
                ]}
                onPress={() => handleNavigation('next')}
                disabled={!isCurrentQuestionAnswered() || isSubmitting}
              >
                {isSubmitting && currentQuestionIndex === questions.length - 1 ? (
                  <View style={styles.submitLoader}>
                    <ActivityIndicator size="small" color="#FFFFFF" />
                    <Text style={[styles.navButtonText, styles.submitLoadingText]}>
                      Submitting...
                    </Text>
                  </View>
                ) : (
                  <Text style={[
                    styles.navButtonText,
                    !isCurrentQuestionAnswered() && styles.disabledButtonText
                  ]}>
                    {currentQuestionIndex === questions.length - 1 ? 'Submit' : 'Next'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  statusBarBackground: {
    height: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    backgroundColor: '#0049F8',
  },
  mainContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    flex: 1,
  },
  scrollContentContainer: {
    flexGrow: 1,
    paddingBottom: Platform.OS === 'ios' ? 120 : 100,
  },
  bottomPadding: {
    height: Platform.OS === 'ios' ? 120 : 100,
  },
  navigationButtonsContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E6E8EC',
    paddingBottom: Platform.OS === 'ios' ? 20 : 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  navigationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
  },
  headerSection: {
    backgroundColor: 'rgba(223, 233, 252, 1)',
    paddingBottom: 16,
  },
  reasonContainer: {
    padding: 16,
    paddingBottom: 8,
  },
  reasonLabel: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 4,
    fontFamily: 'Product Sans Regular',
  },
  reasonText: {
    fontSize: 16,
    color: '#191919',
    fontFamily: 'Product Sans Regular',
    fontWeight: '500',
  },
  doctorNote: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  doctorNoteText: {
    fontSize: 14,
    color: '#666666',
    fontStyle: 'italic',
    fontFamily: 'Product Sans Regular',
  },
  content: {
    flex: 1,
  },
  questionContainer: {
    padding: 16,
    paddingBottom: 0,
  },
  questionSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  questionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  doctorLabel: {
    fontSize: 14,
    color: '#0049F8',
    fontWeight: '500',
    fontFamily: 'Product Sans Regular',
  },
  patientLabel: {
    fontSize: 14,
    color: '#666666',
    marginTop: 16,
    marginBottom: 8,
    fontFamily: 'Product Sans Regular',
  },
  questionNumber: {
    fontSize: 14,
    color: '#666666',
    fontFamily: 'Product Sans Regular',
  },
  questionText: {
    fontSize: 16,
    color: '#191919',
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E6E8EC',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: 'top',
    backgroundColor: '#F8F9FA',
  },
  scaleContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  scaleButton: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E6E8EC',
    minWidth: 44,
    alignItems: 'center',
  },
  selectedScale: {
    backgroundColor: '#0049F8',
    borderColor: '#0049F8',
  },
  scaleText: {
    fontSize: 16,
    color: '#191919',
  },
  booleanContainer: {
    flexDirection: 'row',
    gap: 16,
  },
  booleanButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E6E8EC',
    alignItems: 'center',
  },
  selectedBoolean: {
    backgroundColor: '#0049F8',
    borderColor: '#0049F8',
  },
  booleanText: {
    fontSize: 16,
    color: '#191919',
  },
  multipleContainer: {
    width: '100%',
    flexDirection: 'column',
    gap: 12,
  },
  multipleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E6E8EC',
    width: '100%',
    backgroundColor: '#FFFFFF',
  },
  radioOuter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#0049F8',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#0049F8',
  },
  selectedMultiple: {
    borderColor: '#0049F8',
    backgroundColor: '#F5F8FF',
  },
  multipleText: {
    flex: 1,
    fontSize: 16,
    color: '#191919',
    fontFamily: 'Product Sans Regular',
  },
  selectedMultipleText: {
    color: '#0049F8',
    fontWeight: '500',
  },
  navButton: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#0049F8',
    minWidth: 120,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  disabledButton: {
    backgroundColor: '#E6E8EC',
  },
  disabledButtonText: {
    color: '#666666',
  },
  submitButton: {
    backgroundColor: '#4CAF50',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginVertical: 24,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  navButtonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Product Sans Regular',
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 16,
    textAlign: 'center',
    fontFamily: 'Product Sans Regular',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666666',
    fontFamily: 'Product Sans Regular',
  },
  submitLoader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  submitLoadingText: {
    marginLeft: 8,
  },
  otherInput: {
    marginTop: 8,
    minHeight: 40,
    backgroundColor: '#FFFFFF',
    maxHeight: 100,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  noteText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    marginBottom: 12,
  },
  buttonGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  button: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  selectedButton: {
    backgroundColor: '#0049F8',
    borderColor: '#0049F8',
  },
  buttonText: {
    fontSize: 14,
    color: '#191919',
  },
  selectedButtonText: {
    color: '#fff',
  },
  checkboxGroup: {
    marginTop: 8,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#ddd',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedCheckbox: {
    backgroundColor: '#0049F8',
    borderColor: '#0049F8',
  },
  checkmark: {
    color: '#fff',
    fontSize: 16,
  },
  checkboxText: {
    fontSize: 14,
    color: '#191919',
    flex: 1,
  },
});

export default Assessment; 