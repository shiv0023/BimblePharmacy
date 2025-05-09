import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  StatusBar,
  Platform,
  Button,
  Modal,
  Alert,
  TouchableOpacity,
  PermissionsAndroid,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { fetchSoapNotes } from '../Redux/Slices/SoapNotesSlice';
import CustomHeader from './CustomHeader';
import { RichEditor, RichToolbar, actions } from 'react-native-pell-rich-editor';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import Pdf from 'react-native-pdf';
import RNFS from 'react-native-fs';
import axiosInstance from '../Api/AxiosInstance';

const SoapNotes = ({ route, navigation }) => {
  const dispatch = useDispatch();
  const richText = useRef();
  const [htmlContent, setHtmlContent] = useState('');
  const {
    gender,
    dob,
    appointmentNo,
    reason,
    reasonDescription,
    allergies,
    scope,
    scopeAnswers,
    followUpAnswers,
    medications
  } = route.params;
  const { loading, soapNote, error } = useSelector(state => state.auth.soapNotes);
  const [pdfVisible, setPdfVisible] = useState(false);
  const [pdfSource, setPdfSource] = useState(null);
  const [pdfLoading, setPdfLoading] = useState(false);

  const HIGHLIGHT = 'highlight';

  // Fallback if reason is missing
  const safeReason = reason || 'General'; // or any default value your API accepts

  console.log('SoapNotes params:', route.params);

  useEffect(() => {
    dispatch(fetchSoapNotes({
      gender: gender || '',
      dob: dob || '',
      appointmentNo: appointmentNo || '',
      reason: reason || 'General',
      reasonDescription: reasonDescription || '',
      allergies: allergies || '',
      scope: scope || '',
      scopeAnswers: scopeAnswers || {},
      followUpAnswers: followUpAnswers || [],
      medications: medications || [],
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

  // Function to fetch PDF from backend
  const handleGeneratePdf = async () => {
    setPdfLoading(true);
    try {
      console.log('Starting PDF generation...');
      
      // Ensure all required parameters are present and properly formatted
      const requestBody = {
        demographicNo: parseInt(route.params.demographicNo),
  
        soapNote: htmlContent,

        scope: route.params.scope,
        reason: route.params.reason || 'General',
    
      };
      
      // Log the request body for debugging
      console.log('Request body:', JSON.stringify(requestBody, null, 2));

      const response = await axiosInstance.post('/appointment/generateAndSaveSoapNotePdf/', requestBody);
      
      console.log('API Response:', response.data);
      console.log('API Response status:', response.data.status);
      console.log('PDF data received:', response.data.pdf ? 'Yes' : 'No');

      if (response.data.status === 'Success' && response.data.pdf) {
        await handleDownloadPdf(
          response.data.pdf,
          route.params?.firstName,
          route.params?.lastName
        );
        if (route.params?.onDone) {
          route.params.onDone();
        }
      } else {
        console.error('Invalid response:', response.data);
        Alert.alert('Error', 'No valid PDF data received from server');
      }
    } catch (error) {
      console.error('Generate PDF error:', error.response?.data || error.message);
      Alert.alert(
        'Error', 
        error.response?.data?.detail || 'Failed to generate PDF: ' + error.message
      );
    } finally {
      setPdfLoading(false);
    }
  };

  const handleDownloadPdf = async (base64Pdf, firstName, lastName) => {
    try {
      console.log('Starting PDF download process...');
      console.log('Base64 PDF length:', base64Pdf?.length);
      
      const fileName = `SOAP_Notes_${firstName || 'First'}_${lastName || 'Last'}_${new Date().toISOString().split("T")[0]}.pdf`;
      console.log('File name:', fileName);
      
      let filePath;

      if (Platform.OS === 'android') {
        console.log('Android platform detected');
        
        // Check if we have permission
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
          {
            title: 'Storage Permission Required',
            message: 'App needs access to your storage to download the PDF',
          }
        );
        console.log('Permission status:', granted);
        
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          Alert.alert('Permission Denied', 'Storage permission is required to save the PDF.');
          return;
        }

        // Check if download directory exists
        const dirExists = await RNFS.exists(RNFS.DownloadDirectoryPath);
        console.log('Download directory exists:', dirExists);
        
        filePath = `${RNFS.DownloadDirectoryPath}/${fileName}`;
        console.log('Attempting to write file to:', filePath);
        
        await RNFS.writeFile(filePath, base64Pdf, 'base64');
        console.log('File written successfully');
        
        // Trigger media scan
        await RNFS.scanFile(filePath);
        console.log('Media scan completed');
        
        Alert.alert('Success', `PDF saved to Downloads: ${fileName}`);
      } else {
        console.log('iOS platform detected');
        filePath = `${RNFS.DocumentDirectoryPath}/${fileName}`;
        console.log('Attempting to write file to:', filePath);
        
        await RNFS.writeFile(filePath, base64Pdf, 'base64');
        console.log('File written successfully');
        
        try {
          await Share.open({
            url: `file://${filePath}`,
            type: 'application/pdf',
            filename: fileName,
            showAppsToView: true,
            failOnCancel: false,
          });
          console.log('Share dialog opened successfully');
        } catch (shareError) {

        }
      }

      // Verify file exists after writing
      const fileExists = await RNFS.exists(filePath);
      console.log('File exists after writing:', fileExists);
      
      if (fileExists) {
        setPdfSource({ uri: `file://${filePath}` });
        setPdfVisible(true);
        console.log('PDF source set and modal should be visible');
      } else {
        console.error('File does not exist after writing!');
        Alert.alert('Error', 'File was not created successfully');
      }

    } catch (error) {
      console.error('Download error:', error);
      Alert.alert('Error', 'Failed to download PDF: ' + error.message);
    }
  };

  return (
    <>
      <StatusBar backgroundColor="#0049F8" barStyle="light-content" />
      {Platform.OS === 'ios' && <View style={{ height: 44, backgroundColor: '#0049F8' }} />}
      
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
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
          <TouchableOpacity
            style={[
              styles.customPdfButton,
              pdfLoading && styles.customPdfButtonDisabled
            ]}
            onPress={handleGeneratePdf}
            disabled={pdfLoading}
            activeOpacity={0.7}
          >
            <Text style={styles.customPdfButtonText}>
              {pdfLoading ? 'Generating PDF...' : 'Generate SOAP Notes PDF'}
            </Text>
          </TouchableOpacity>
        </SafeAreaView>
      </TouchableWithoutFeedback>

      {/* Modal to show PDF */}
      <Modal visible={pdfVisible} onRequestClose={() => setPdfVisible(false)}>
        <View style={{ flex: 1 }}>
  
          <View style={{ flex: 1 }}>
            {pdfSource && (
              <Pdf
                source={pdfSource}
                style={{ flex: 1 }}
                onError={error => {
                  Alert.alert('PDF Error', error.message);
                }}
              />
            )}
            <TouchableOpacity
              onPress={() => setPdfVisible(false)}
              style={{
                backgroundColor: '#0049F8',
                paddingVertical: 14,
                alignItems: 'center',
                justifyContent: 'center',
                margin: 16,
                borderRadius: 8,
              }}
            >
              <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' ,marginBottom:10}}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  customPdfButton: {
    backgroundColor: '#0049F8',
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginVertical: 18,
  margin:10
  },
  customPdfButtonDisabled: {
    backgroundColor: '#A0A0A0',
  },
  customPdfButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
});

export default SoapNotes;
