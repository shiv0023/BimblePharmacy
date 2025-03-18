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
} from 'react-native';
import CustomHeader from './CustomHeader';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';

const { width, height } = Dimensions.get('window');

const Assessment = ({ route, navigation }) => {
  const {
    patientId,
    patientName,
    appointmentReason,
    appointmentDesc,
    appointmentDate,
    chatType
  } = route.params;

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [error, setError] = useState('');
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showOtherInput, setShowOtherInput] = useState(false);

  // Function to generate questions based on appointment reason
  const generateQuestionsForCondition = (condition) => {
    const baseQuestions = {
      'RAI': [
        {
          id: 1,
          question: "Besides the initial symptoms, have you developed any new symptoms in the last few days?",
          type: "multiple",
          options: [
            "No new symptoms",
            "Ear pain or pressure",
            "Chest pain or difficulty breathing",
            "High fever (above 102°F/39°C)",
            "Severe headache",
            "Other"
          ]
        },
        {
          id: 2,
          question: "What is your most prominent symptom currently?",
          type: "multiple",
          options: [
            "Runny or blocked nose",
            "Sore throat",
            "Persistent cough",
            "High fever",
            "Body aches",
            "Other"
          ]
        },
        {
          id: 3,
          question: "When did your symptoms first appear?",
          type: "multiple",
          options: [
            "Within the last 24 hours",
            "2-3 days ago",
            "4-7 days ago",
            "More than a week ago",
            "More than two weeks ago",
            "Other"
          ]
        }
      ],
      'default': [
        {
          id: 1,
          question: "How would you rate the severity of your symptoms?",
          type: "multiple",
          options: [
            "Mild - barely noticeable",
            "Moderate - noticeable but manageable",
            "Severe - affecting daily activities",
            "Very severe - cannot perform normal activities",
            "Other"
          ]
        }
      ]
    };

    // Common questions for all conditions
    const commonQuestions = [
      {
        id: 6,
        question: "Have you taken any medications for these symptoms?",
        type: "multiple",
        options: [
          "No medications taken",
          "Over-the-counter pain relievers",
          "Prescribed medications",
          "Home remedies",
          "Traditional medicines",
          "Other"
        ]
      },
      {
        id: 7,
        question: "How are your symptoms affecting your daily activities?",
        type: "multiple",
        options: [
          "No effect on daily activities",
          "Mild interference with work/study",
          "Difficulty sleeping",
          "Unable to work/study",
          "Requiring bed rest",
          "Other"
        ]
      }
    ];

    // Get condition-specific questions or default questions
    const conditionQuestions = baseQuestions[condition] || baseQuestions['default'];
    return [...conditionQuestions, ...commonQuestions];
  };

  useEffect(() => {
    try {
      const reason = appointmentReason?.trim() || '';
      const generatedQuestions = generateQuestionsForCondition(reason);
      if (Array.isArray(generatedQuestions) && generatedQuestions.length > 0) {
        setQuestions(generatedQuestions);
      } else {
        setQuestions([]);
        setError('No questions available for this condition');
      }
    } catch (err) {
      console.error('Error generating questions:', err);
      setQuestions([]);
      setError('Error generating questions');
    } finally {
      setLoading(false);
    }
  }, [appointmentReason]);

  const isCurrentQuestionAnswered = () => {
    if (!questions || !questions[currentQuestionIndex]) {
      return false;
    }

    const currentQuestion = questions[currentQuestionIndex];
    const currentAnswer = answers[currentQuestion.id];

    switch (currentQuestion.type) {
      case 'text':
        return currentAnswer && currentAnswer.trim().length > 0;
      case 'scale':
        return typeof currentAnswer !== 'undefined';
      case 'boolean':
        return typeof currentAnswer !== 'undefined';
      case 'multiple':
        return Array.isArray(currentAnswer) && currentAnswer.length > 0;
      default:
        return false;
    }
  };

  const handleAnswer = (questionId, answer) => {
    setError('');
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const handleNavigation = async (direction) => {
    if (direction === 'next') {
      if (!isCurrentQuestionAnswered()) {
        setError('Please answer the question before proceeding');
        return;
      }
      
      if (currentQuestionIndex === questions.length - 1) {
        try {
          setIsSubmitting(true);
          console.log('Assessment answers:', answers);
          // Simulate API call with setTimeout
          await new Promise(resolve => setTimeout(resolve, 1500));
          navigation.goBack();
        } catch (error) {
          setError('Failed to submit assessment');
        } finally {
          setIsSubmitting(false);
        }
      } else {
        setCurrentQuestionIndex(prev => prev + 1);
        setError('');
      }
    } else {
      setCurrentQuestionIndex(prev => prev - 1);
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

  const renderQuestion = (question) => {
    switch (question.type) {
      case 'text':
        return (
          <TextInput
            style={styles.input}
            placeholder="Type your answer here"
            multiline
            value={answers[question.id] || ''}
            onChangeText={(text) => handleAnswer(question.id, text)}
          />
        );

      case 'scale':
        return (
          <View style={styles.scaleContainer}>
            {question.options.map((option) => (
              <TouchableOpacity
                key={option}
                style={[
                  styles.scaleButton,
                  answers[question.id] === option && styles.selectedScale
                ]}
                onPress={() => handleAnswer(question.id, option)}
              >
                <Text style={styles.scaleText}>{option}</Text>
              </TouchableOpacity>
            ))}
          </View>
        );

      case 'boolean':
        return (
          
          <View style={styles.booleanContainer}>
            {question.options.map((option) => (
              <TouchableOpacity
                key={option}
                style={[
                  styles.booleanButton,
                  answers[question.id] === option && styles.selectedBoolean
                ]}
                onPress={() => handleAnswer(question.id, option)}
              >
                <Text style={styles.booleanText}>{option}</Text>
              </TouchableOpacity>
            ))}
          </View>
        );

      case 'multiple':
        return (
          <View>
            <View style={styles.multipleContainer}>
              {question.options.map((option) => {
                const isSelected = (answers[question.id] || []).includes(option);
                return (
                  <TouchableOpacity
                    key={option}
                    style={[
                      styles.multipleButton,
                      isSelected && styles.selectedMultiple
                    ]}
                    onPress={() => {
                      handleAnswer(question.id, [option]);
                      if (option === "Other") {
                        setShowOtherInput(true);
                      } else {
                        setShowOtherInput(false);
                      }
                    }}
                  >
                    <View style={styles.radioOuter}>
                      {isSelected && <View style={styles.radioInner} />}
                    </View>
                    <Text style={[
                      styles.multipleText,
                      isSelected && styles.selectedMultipleText
                    ]}>
                      {option}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            {renderOtherInput(question.id)}
          </View>
        );
    }
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

  const renderQuestionSection = (question) => (
    <View style={styles.questionSection}>
      <View style={styles.questionHeader}>
        <Text style={styles.doctorLabel}>Dr's Question:</Text>
        <Text style={styles.questionNumber}>
          {currentQuestionIndex + 1} of {questions.length}
        </Text>
      </View>
      <Text style={styles.questionText}>
        {question?.question || 'No question available'}
      </Text>
      <Text style={styles.patientLabel}>Your Answer:</Text>
      {renderQuestion(question)}
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );

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
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#0049F8" />
            <Text style={styles.loadingText}>Preparing doctor's questions...</Text>
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

        {!loading && questions.length > 0 && (
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
    fontSize: 18,
    color: '#191919',
    marginBottom: 16,
    fontFamily: 'Product Sans Regular',
    lineHeight: 24,
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
    backgroundColor: '#00A811',
  },
  navButtonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Product Sans Regular',
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 14,
    marginTop: 8,
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
});

export default Assessment; 