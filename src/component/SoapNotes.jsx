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
import { fetchSoapNotes, savePdfDocument } from '../Redux/Slices/SoapNotesSlice';
import CustomHeader from './CustomHeader';
import { RichEditor, RichToolbar, actions } from 'react-native-pell-rich-editor';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import RNFS from 'react-native-fs';
import axiosInstance from '../Api/AxiosInstance';
import { generateParPdf } from '../Redux/Slices/ParPdfSlices';
import { DocumentView, RNPdftron, Config } from '@pdftron/react-native-pdf';
import Pdf from 'react-native-pdf';

const SoapNotes = ({ route, navigation }) =>{ 
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
  const [soapPdfLoading, setSoapPdfLoading] = useState(false);
  const [parPdfLoading, setParPdfLoading] = useState(false);
  const {   pdfData: parPdfData } = useSelector(state => state.auth?.parPdf);
console.log (parPdfData,'par pdf ')
  const HIGHLIGHT = 'highlight';
  const [isParPdf, setIsParPdf] = useState(false);

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

  useEffect(() => {
    console.log('parPdfData changed:', parPdfData);
  }, [parPdfData]);

  // Add this useEffect for PDFTron initialization
  useEffect(() => {
    RNPdftron.initialize("");  // Add your license key if you have one
  }, []);

  useEffect(() => {
    if (Platform.OS === 'android') {
      requestStoragePermission();
    }
  }, []);

  const requestStoragePermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const permissions = [
          PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
          PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
        ];
        const granted = await PermissionsAndroid.requestMultiple(permissions);
        const allGranted = Object.values(granted).every(
          permission => permission === PermissionsAndroid.RESULTS.GRANTED
        );
        if (!allGranted) {
          throw new Error('Storage permissions required');
        }
      } catch (error) {
        throw new Error('Storage permissions are required to save the document');
      }
    }
  };

  const handleCustomAction = (action) => {
    if (action === HIGHLIGHT) {
      richText.current?.commandDOM(`document.execCommand("backColor", false, "yellow");`);
    }
  };

  // Function to fetch PDF from backend
  const handleGeneratePdf = async () => {
    setSoapPdfLoading(true);
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
      
      console.log('API Response:', response);
      console.log('Response data:', response.data);
      console.log('PDF data:', response.data?.pdf || response.data?.data);

      if (response.data.status === 'Success' && response.data.pdf) {
        setIsParPdf(false);
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
      setSoapPdfLoading(false);
    }
  };

  const handleDownloadPdf = async (base64Pdf, firstName, lastName) => {
    try {
      const fileName = `PAR_Notes_${firstName || 'Unknown'}_${lastName || 'Patient'}_${new Date().toISOString().split('T')[0]}.pdf`;
      let filePath;

      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE
        );
        
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          throw new Error('Storage permission denied');
        }
        
        filePath = `${RNFS.DownloadDirectoryPath}/${fileName}`;
      } else {
        filePath = `${RNFS.DocumentDirectoryPath}/${fileName}`;
      }

      await RNFS.writeFile(filePath, base64Pdf, 'base64');
      
      const fileExists = await RNFS.exists(filePath);
      if (fileExists) {
        // Use the correct format for PDFTron
        setPdfSource({ 
          uri: Platform.OS === 'ios' ? filePath : `file://${filePath}`
        });
        setPdfVisible(true);
        
        if (Platform.OS === 'android') {
          await RNFS.scanFile(filePath);
        }
      } else {
        throw new Error('File was not created successfully');
      }

    } catch (error) {
      console.error('PDF Download error:', error);
      Alert.alert('Error', `Failed to download PDF: ${error.message}`);
    }
  };

  // Update the handleGenerateParPdf function
  const handleGenerateParPdf = async () => {
    try {
      setParPdfLoading(true);
      console.log("iam here inside pdf")
      // Get and validate parameters early
      const { demographicNo, appointmentNo } = route.params;
      
      // Convert to integers early
      const demographicNoInt = parseInt(demographicNo, 10);
      const appointmentNoInt = parseInt(appointmentNo, 10);

      // Validate the conversions
      if (isNaN(demographicNoInt) || isNaN(appointmentNoInt)) {
        throw new Error('Invalid demographic number or appointment number');
      }

      const requestBody = {
        demographicNo: demographicNoInt,
        mobile: parseInt(route.params.mobile || '0'),
        scopeAnswers: {
          condition: scopeAnswers?.condition || '',
          status: scopeAnswers?.status || ''
        },
        appointmentNo: appointmentNoInt,
        allergies: allergies || '',
        reasonDescription: reasonDescription || '',
        followUpAnswers: followUpAnswers,  // Send as is, don't format
        soapNotes: htmlContent,
        reason: route.params.reason || reason || 'General'
      };

      // Make the API call with increased timeout
      const response = await axiosInstance.post('/appointment/generateParPdf/', requestBody, {
        timeout: 30000, // 30 seconds timeout
        maxBodyLength: Infinity,
        maxContentLength: Infinity,
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (response.data && (response.data.pdf || response.data.data)) {
        setIsParPdf(true);
        const base64Pdf = response.data.pdf || response.data.data;
        
        // Compress the PDF data if it's too large
        const compressedPdf = base64Pdf.length > 1000000 ? 
          await compressPdf(base64Pdf) : base64Pdf;

        await handleDownloadPdf(
          compressedPdf,
          route.params?.firstName,
          route.params?.lastName
        );

        // Save the initial PDF document
        if (pdfSource) {
          // Log before creating pdfFile
          console.log('[DEBUG] PDF Source:', pdfSource);

          const pdfFile = {
            uri: pdfSource.uri,
            name: `PAR_Notes_${route.params?.firstName || 'Unknown'}_${route.params?.lastName || 'Patient'}_${new Date().getTime()}.pdf`,
            type: 'application/pdf'
          };

          // Log before dispatch with validated integers
          console.log('[DEBUG] Dispatching savePdfDocument with:', {
            demographicNo: demographicNoInt,
            appointmentNo: appointmentNoInt,
            pdfFile: {
              name: pdfFile.name,
              type: pdfFile.type,
              uri: pdfFile.uri
            }
          });

          // Use the validated integer values when dispatching
          const result = await dispatch(savePdfDocument({
            demographicNo: demographicNoInt,
            appointmentNo: appointmentNoInt, // Now properly passing the appointment number
            pdfFile
          })).unwrap();

          // Log the result
          console.log('[DEBUG] Save PDF Result:', result);

          if (result.status === 'Success') {
            setSaveStatus('success');
            Alert.alert(
              'Success',
              'Document saved and uploaded successfully',
              [{ text: 'OK', onPress: () => setSaveStatus('') }]
            );

            if (Platform.OS === 'android') {
              await RNFS.scanFile(pdfSource.uri);
            }
          } else {
            throw new Error('Server upload failed');
          }
        } else {
          console.log('[DEBUG] No PDF source available');
        }

        if (route.params?.onDone) {
          route.params.onDone();
        }
      } else {
        throw new Error('No PDF data in response');
      }

    } catch (error) {
      console.error('[DEBUG] PAR PDF Generation error:', error);
      Alert.alert(
        'Error',
        'Failed to generate PDF. The file might be too large. Please try again with less content.'
      );
    } finally {
      setParPdfLoading(false);
    }
  };

  // Add this useEffect for debugging
  useEffect(() => {
    console.log('Current route params:', route.params);
    console.log('Current scopeAnswers:', scopeAnswers);
    console.log('Current followUpAnswers:', followUpAnswers);
  }, []);

  console.log('Current htmlContent:', htmlContent);

  // Regular PDF viewer for SOAP Notes
  const SimplePdfViewer = ({ pdfPath }) => {
    return (
      <View style={{ flex: 1 }}>
        <Pdf
          source={pdfPath}
          onLoadComplete={(numberOfPages, filePath) => {
            console.log(`Number of pages: ${numberOfPages}`);
          }}
          onPageChanged={(page, numberOfPages) => {
            console.log(`Current page: ${page}`);
          }}
          onError={(error) => {
            console.log(error);
          }}
          style={{ flex: 1 }}
        />
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => setPdfVisible(false)}
        >
          <Text style={styles.closeButtonText}>Close</Text>
        </TouchableOpacity>
      </View>
    );
  };

  // PDFTron viewer for PAR PDF with editing capabilities
  const EditablePdfViewer = ({ pdfPath }) => {
    const viewer = useRef(null);
    const dispatch = useDispatch();
    const [isSaving, setIsSaving] = useState(false);
    const [isViewerReady, setIsViewerReady] = useState(false);
    const [saveStatus, setSaveStatus] = useState('');

    // Initialize PDFTron once when component mounts
    useEffect(() => {
      const initializePDFTron = async () => {
        try {
          await RNPdftron.initialize("");
          console.log('[DEBUG] PDFTron initialized successfully');
        } catch (error) {
          console.error('[DEBUG] PDFTron initialization error:', error);
        }
      };

      initializePDFTron();
    }, []);

    const handleDocumentLoaded = () => {
      setIsViewerReady(true);
      console.log('[DEBUG] Document loaded successfully');
    };

    const handleSaveChanges = async () => {
      try {
        setIsSaving(true);
        setSaveStatus('');

        if (!viewer.current) {
          throw new Error('PDF viewer not initialized');
        }

        const { demographicNo, appointmentNo } = route.params;
        const demographicNoInt = parseInt(demographicNo, 10);
        const appointmentNoInt = parseInt(appointmentNo, 10);

        // Create a new file name
        const timestamp = new Date().getTime();
        const newFileName = `PAR_PDF_${appointmentNoInt}_${timestamp}.pdf`;
        let savePath;

        // Set up the save path
        if (Platform.OS === 'android') {
          await requestStoragePermission();
          savePath = `${RNFS.DownloadDirectoryPath}/${newFileName}`;
        } else {
          savePath = `${RNFS.DocumentDirectoryPath}/${newFileName}`;
        }

        // Save the document with proper options
        const saveOptions = {
          saveAsNew: true,
          annotationManagerEnabled: true,
          flags: Platform.OS === 'ios' ? 1 : undefined
        };

        try {
          // Ensure viewer is ready
          if (!isViewerReady) {
            throw new Error('PDF viewer not ready');
          }

          // Save document
          await viewer.current.saveDocument(savePath, saveOptions);
          
          // Verify file exists and get stats
          const fileStats = await RNFS.stat(savePath);
          
          // Create form data
          const formData = new FormData();
          formData.append('data', JSON.stringify({
            demographicNo: demographicNoInt,
            appointmentNo: appointmentNoInt
          }));
          
          formData.append('pdfFile', {
            uri: Platform.OS === 'ios' ? savePath : `file://${savePath}`,
            name: newFileName,
            type: 'application/pdf',
            size: fileStats.size
          });

          // Upload with increased timeout and chunk size
          const result = await dispatch(savePdfDocument({
            demographicNo: demographicNoInt,
            appointmentNo: appointmentNoInt,
            pdfFile: {
              uri: Platform.OS === 'ios' ? savePath : `file://${savePath}`,
              name: newFileName,
              type: 'application/pdf'
            }
          })).unwrap();

          if (result.status === 'Success') {
            setSaveStatus('success');
            Alert.alert('Success', 'Document saved successfully');
          }

        } catch (error) {
          throw new Error(`Failed to save document: ${error.message}`);
        }

      } catch (error) {
        console.error('[DEBUG] Save document error:', error);
        setSaveStatus('error');
        Alert.alert('Error', 'Failed to save changes. Please try again.');
      } finally {
        setIsSaving(false);
      }
    };

    return (
      <View style={{ flex: 1 }}>
        <DocumentView
          ref={viewer}
          document={pdfPath.uri}
          readOnly={false}
          isBase64String={false}
          enableAnnotationEditing={true}
          enableAnnotations={true}
          showSavedSignatures={true}
          topToolbarEnabled={true}
          bottomToolbarEnabled={true}
          pageIndicatorEnabled={true}
          annotationAuthor="BimblePro User"
          defaultAnnotationUsername="BimblePro User"
          annotationPermissionCheckEnabled={false}
          saveStateEnabled={true}
          autoSaveEnabled={false}
          padStatusBar={Platform.OS === 'ios'}
          showLeadingNavButton={true}
          leadingNavButtonIcon={Platform.OS === 'ios' ? 'back' : 'close'}
          useStylusAsPen={true}
          maintainZoomLevel={true}
          enableDocumentEditingFromJS={true}
          saveInBackground={false}
          annotationManagerEnabled={true}
          enableAntialiasing={true}
          documentSliderEnabled={true}
          onDocumentLoaded={handleDocumentLoaded}
          onError={(error) => {
            console.error('[DEBUG] PDFTron error:', error);
            setIsViewerReady(false);
          }}
          style={{ flex: 1 }}
        />
        <View style={styles.pdfButtonContainer}>
          <TouchableOpacity
            style={[
              styles.saveButton,
              (!isViewerReady || isSaving) && styles.buttonDisabled,
              saveStatus === 'success' && styles.successButton,
              saveStatus === 'error' && styles.errorButton
            ]}
            onPress={handleSaveChanges}
            disabled={!isViewerReady || isSaving}
          >
            <Text style={styles.saveButtonText}>
              {isSaving ? 'Saving...' : 
               !isViewerReady ? 'Loading...' : 
               saveStatus === 'success' ? 'Saved!' :
               saveStatus === 'error' ? 'Retry Save' :
               'Save Changes'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setPdfVisible(false)}
          >
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
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
          
          {/* Button Container */}
          <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[
              styles.customPdfButton,
                soapPdfLoading && styles.customPdfButtonDisabled,
            ]}
            onPress={handleGeneratePdf}
              disabled={soapPdfLoading}
              activeOpacity={0.7}
            >
              <Text style={styles.customPdfButtonText}>
                {soapPdfLoading ? 'Generating...' : 'Generate SOAP Notes'}
              </Text>
            </TouchableOpacity>

            {/* PAR PDF Button */}
            <TouchableOpacity
              style={[
                styles.customPdfButton,
                styles.parButton,
                parPdfLoading && styles.customPdfButtonDisabled,
              ]}
              onPress={handleGenerateParPdf}
              disabled={parPdfLoading}
            activeOpacity={0.7}
          >
            <Text style={styles.customPdfButtonText}>
                {parPdfLoading ? 'Generating PAR...' : 'Generate PAR PDF'}
            </Text>
          </TouchableOpacity>
          </View>
        </SafeAreaView>
      </TouchableWithoutFeedback>

      {/* Modal to show PDF */}
      <Modal 
        visible={pdfVisible} 
        onRequestClose={() => setPdfVisible(false)}
        animationType="slide"
      >
        <SafeAreaView style={{ flex: 1 }}>
            {pdfSource && (
            isParPdf ? (
              <EditablePdfViewer pdfPath={pdfSource} />
            ) : (
              <SimplePdfViewer pdfPath={pdfSource} />
            )
          )}
        </SafeAreaView>
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
  buttonContainer: {
    flexDirection: 'column',
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: '#fff',
  },
  customPdfButton: {
    backgroundColor: '#0049F8',
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginVertical: 8,
    width: '100%',
  },
  parButton: {
    backgroundColor: '#2E7D32',
    marginTop: 8,
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
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    padding: 16,
  },
  modalButton: {
    backgroundColor: '#0049F8',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  pdf: {
    flex: 1,
    width: '100%',
    backgroundColor: '#f0f0f0',
  },
  pdfButtonContainer: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 10,
    zIndex: 999,
  },
  saveButton: {
    backgroundColor: '#0049F8',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    minWidth: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButton: {
    backgroundColor: '#666',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    minWidth: 100,
    alignItems: 'center',
    justifyContent: 'center',
    
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  buttonDisabled: {
    backgroundColor: '#A0A0A0',
  },
  successButton: {
    backgroundColor: '#2E7D32',
  },
  errorButton: {
    backgroundColor: '#D32F2F',
  },
  successText: {
    color: '#fff',
  },
});

export default SoapNotes;

