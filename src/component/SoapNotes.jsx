import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  StatusBar,
  Platform,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { fetchSoapNotes } from '../Redux/Slices/SoapNotesSlice';
import CustomHeader from './CustomHeader';
import { RichEditor, RichToolbar, actions } from 'react-native-pell-rich-editor';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';

const SoapNotes = ({ route }) => {
  const dispatch = useDispatch();
  const richText = useRef();
  const [htmlContent, setHtmlContent] = useState('');
  const { gender, dob, reason, scope, scopeAnswers, followUpAnswers, medications, appointmentNo } = route.params;
  const { loading, soapNote, error } = useSelector(state => state.auth.soapNotes);

  const HIGHLIGHT = 'highlight';

  // Fallback if reason is missing
  const safeReason = reason || 'General'; // or any default value your API accepts

  console.log('SoapNotes params:', route.params);

  useEffect(() => {
    dispatch(fetchSoapNotes({
      gender,
      dob,
      reason: safeReason,
      scope,
      scopeAnswers,
      followUpAnswers,
      medications: medications || '',
      reasonDescription: " ",
      allergies: [],
      appointmentNo,
    }));
  }, [dispatch]);

  useEffect(() => {
    if (soapNote) setHtmlContent(soapNote);
  }, [soapNote]);

  const handleCustomAction = (action) => {
    if (action === HIGHLIGHT) {
      richText.current?.commandDOM(`document.execCommand("backColor", false, "yellow");`);
    }
  };

  return (
    <>
      <StatusBar backgroundColor="#0049F8" barStyle="light-content" />
      {Platform.OS === 'ios' && <View style={{ height: 44, backgroundColor: '#0049F8' }} />}
      
      <SafeAreaView style={styles.container}>
        <CustomHeader title="SOAP Notes" />
        <RichToolbar
                editor={richText}
                actions={[
                  actions.setBold,
                  actions.setItalic,
                  actions.insertBulletsList,
                  actions.insertOrderedList,
                  actions.setUnderline,
                  actions.insertLink,
                  HIGHLIGHT,
                ]}
                iconMap={{
                  [HIGHLIGHT]: () => <Text style={{ fontWeight: 'bold', color: 'orange' }}>HL</Text>,
                }}
                onPressAddImage={() => {}}
                onPress={handleCustomAction}
                style={styles.toolbar}
              />
        <KeyboardAwareScrollView
          contentContainerStyle={styles.contentContainer}
          keyboardShouldPersistTaps="handled"
          extraScrollHeight={Platform.OS === 'ios' ? 80 : 100}
        >
          {loading && <ActivityIndicator size="large" color="#0049F8" />}
          {error && <Text style={styles.errorText}>{error}</Text>}
          {!loading && (
            <>
              <RichEditor
                ref={richText}
                initialContentHTML={htmlContent}
                onChange={setHtmlContent}
                style={styles.richEditor}
                placeholder="Write SOAP notes here..."
                editorStyle={{
                  backgroundColor: '#fff',
                  color: '#222',
                  placeholderColor: '#aaa',
                  contentCSSText: 'font-size: 16px; padding: 8px;',
                }}
              />
            
            </>
          )}
        </KeyboardAwareScrollView>
      </SafeAreaView>
    </>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  contentContainer: { padding: 15 },
  richEditor: {
    borderColor: '#ccc',
  
    borderRadius: 10,
    minHeight: 300,
    marginBottom: 10,
  },
  toolbar: {
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    marginBottom: 20,
  },
  errorText: { color: 'red', margin: 16, fontWeight: '400' },
});

export default SoapNotes;
