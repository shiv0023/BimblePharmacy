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
    reasonDesc,
  
    allergies,
    scope,
    scopeAnswers,
    followUpAnswers,
    medications,
   
  
  } = route.params;
  
  console.log (route.params,'hello world')
  const { loading, soapNote, error } = useSelector(state => state.auth.soapNotes);
  const [pdfVisible, setPdfVisible] = useState(false);
  const [pdfSource, setPdfSource] = useState(null);
  const [soapPdfLoading, setSoapPdfLoading] = useState(false);
  const [parPdfLoading, setParPdfLoading] = useState(false);
  const {   pdfData: parPdfData } = useSelector(state => state.auth?.parPdf);
console.log (parPdfData,'par pdf ')
  const HIGHLIGHT = 'highlight';
  const [isParPdf, setIsParPdf] = useState(false);
  const [pdfPath, setPdfPath] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPDF, setShowPDF] = useState(false);
  const [pdfData, setPdfData] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  // Fallback if reason is missing
  const safeReason = reason || 'General'; // or any default value your API accepts

  console.log('SoapNotes params:', route.params);

  useEffect(() => {
    dispatch(fetchSoapNotes({
      gender: gender,
      dob: dob,
      appointmentNo: appointmentNo,
      reason: reason,
      reasonDescription: reasonDesc , 
      allergies: allergies,
      scope: scope,
      scopeAnswers: scopeAnswers,
      followUpAnswers: followUpAnswers,
      medications: medications,
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
    const initPDFTron = async () => {
      try {
        await RNPdftron.initialize("");
        console.log('PDFTron initialized successfully');
      } catch (error) {
        console.error('PDFTron initialization failed:', error);
      }
    };
    initPDFTron();
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
        reason: route.params.reason ,
    
      };
      
      // Log the request body for debugging
      console.log('Request body:', JSON.stringify(requestBody, null, 2));

      const response = await axiosInstance.post('/appointment/generateAndSaveSoapNotePdf/', requestBody);
      
      console.log('API Response:', response);
      console.log('Response data:', response.data);
      console.log('PDF data:', response.data?.pdf || response.data?.data);
      console.log('Base64 data length:', response?.data?.data?.length);

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

      console.log('File path:', filePath);
      try {
        const exists = await RNPdftron.fileExists(filePath);
        console.log('File exists:', exists);
      } catch (error) {
        // console.error('Error checking file:', error);
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
      console.log("Generating PAR PDF...");
      
      const { 
        demographicNo, 
        appointmentNo,
        scopeAnswers,
        followUpAnswers,
        allergies,
        reasonDescription,
        reasonDesc,
        reason,
        clinicContact
      } = route.params;

      const demographicNoInt = parseInt(demographicNo, 10);
      const appointmentNoInt = parseInt(appointmentNo, 10);

      // Format followUpAnswers into an object instead of an array
      const formattedFollowUpAnswers = {};
      followUpAnswers.forEach(answer => {
        formattedFollowUpAnswers[answer.questionId] = answer.answer;
      });

      // Format scopeAnswers
      const formattedScopeAnswers = {
        condition: scopeAnswers.condition || reason,
        status: scopeAnswers.status || scope
      };

      const requestBody = {
        demographicNo: demographicNoInt,
        mobile: parseInt(clinicContact ),
        scopeAnswers: formattedScopeAnswers,
        appointmentNo: appointmentNoInt,
        allergies: allergies,
        reasonDescription: reasonDesc,
        followUpAnswers: formattedFollowUpAnswers,
        soapNotes: htmlContent,
        reason: reason
      };

      console.log('Request Body:', JSON.stringify(requestBody, null, 2));

      const response = await axiosInstance.post('/appointment/generateParPdf/', requestBody, {
        timeout: 30000,
        maxBodyLength: Infinity,
        maxContentLength: Infinity,
        headers: {
          'Content-Type': 'application/json',
        }
      });

      console.log('PAR PDF Response:', response.data);

      if (response.data && (response.data.data || response.data.pdf)) {
        setIsParPdf(true);
        const base64Pdf = response.data.pdf || response.data.data;
        
        const fileName = `PAR_Notes_${Date.now()}.pdf`;
        const filePath = Platform.OS === 'ios' 
          ? `${RNFS.DocumentDirectoryPath}/${fileName}`
          : `${RNFS.DownloadDirectoryPath}/${fileName}`;

        await RNFS.writeFile(filePath, base64Pdf, 'base64');
        
        setPdfSource({
          uri: Platform.OS === 'ios' ? filePath : `file://${filePath}`
        });

        const fileExists = await RNFS.exists(filePath);
        console.log('PDF file exists:', fileExists);
        console.log('PDF file path:', filePath);
        
        if (fileExists) {
          setPdfVisible(true);
          
          if (Platform.OS === 'android') {
            await RNFS.scanFile(filePath);
          }
        } else {
          throw new Error('PDF file was not created successfully');
        }

        if (route.params?.onDone) {
          route.params.onDone();
        }
      } else {
        throw new Error('No PDF data in response');
      }
    } catch (error) {
      console.error('Generate PAR PDF error:', error);
      Alert.alert(
        'Error',
        'Failed to generate PDF. Please try again.'
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
     

        if (!viewer.current) {
          throw new Error('PDF viewer not initialized');
        }

        const { demographicNo, appointmentNo } = route.params;
        const demographicNoInt = parseInt(demographicNo);
        const appointmentNoInt = parseInt(appointmentNo);

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

  // Function to convert base64 to file path
  // const saveBase64AsPDF = async (base64Data) => {
  //   try {
  //     const fileName = 'soap_note.pdf';
  //     const path = Platform.OS === 'ios' 
  //       ? `${RNPdftron.getDocumentDirectory()}/${fileName}`
  //       : `${RNPdftron.getDocumentDirectory()}/${fileName}`;
        
  //     await RNPdftron.saveDocument(base64Data, path);
  //     return path;
  //   } catch (error) {
  //     console.error('Error saving PDF:', error);
  //     return null;
  //   }
  // };

  const handleGeneratePDF = async () => {
    try {
      setIsLoading(true);
      const response = await yourPDFGenerationAPI(); // Your API call
      
      if (response?.data?.data) {
        setPdfData(response.data.data);
        setShowPDF(true);
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const pdfViewerConfig = {
    showLeadingNavButton: true,
    leadingNavButtonIcon: Platform.OS === 'ios' ? 'back' : 'arrow_back',
    nightModeEnabled: false,
    documentSliderEnabled: true,
    pageNumberIndicatorEnabled: true,
    readOnly: true,
  };

  const generatePDFHandler = async () => {
    try {
      const response = await yourGeneratePDFAPI(); // Your API call
      if (response?.data?.data) {
        await handleGeneratePDF(response);
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
    }
  };

  // Handle the PDF response
  const handlePDFResponse = async (response) => {
    try {
      setIsLoading(true);
      console.log("Handling PDF response");

      // Get base64 data
      const base64Data = response?.data?.data;
      if (!base64Data) {
        console.error("No PDF data found");
        return;
      }

      // Create file path
      const fileName = `soap_note_${Date.now()}.pdf`;
      const documentsDir = await RNPdftron.getDocumentDirectory();
      const filePath = `${documentsDir}/${fileName}`;

      console.log("Saving PDF to:", filePath);

      // Save the document
      await RNPdftron.saveDocument(base64Data, filePath);
      console.log("PDF saved successfully");

      // Set the path to display PDF
      setPdfPath(filePath);
    } catch (error) {
      console.error("Error handling PDF:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Call this function when you get the PDF response
  // useEffect(() => {
  //   if (response?.data?.data) {
  //     handlePDFResponse(response);
  //   }
  // }, [response]);

  const handleSaveDocument = async () => {
    try {
      setIsSaving(true);
      
      const { demographicNo, appointmentNo } = route.params;
      const demographicNoInt = parseInt(demographicNo, 10);
      const appointmentNoInt = parseInt(appointmentNo, 10);

      if (!pdfSource || !pdfSource.uri) {
        throw new Error('No PDF document to save');
      }

      // Create a file object from the PDF source
      const fileName = `PAR_Notes_${demographicNoInt}_${Date.now()}.pdf`;
      const pdfFile = {
        uri: pdfSource.uri,
        type: 'application/pdf',
        name: fileName
      };

      // Create form data
      const formData = new FormData();
      formData.append('demographicNo', demographicNoInt.toString());
      formData.append('appointmentNo', appointmentNoInt.toString());
      formData.append('pdfFile', pdfFile);

      // Call the save document API
      const result = await dispatch(savePdfDocument({
        demographicNo: demographicNoInt,
        appointmentNo: appointmentNoInt,
        pdfFile
      })).unwrap();

      if (result.status === 'Success') {
        Alert.alert(
          'Success',
          'Document saved successfully',
          [
            {
              text: 'OK',
              onPress: () => {
                setPdfVisible(false);
                setPdfSource(null);
                if (route.params?.onDone) {
                  route.params.onDone();
                }
              }
            }
          ]
        );
      } else {
        throw new Error('Failed to save document');
      }

    } catch (error) {
      console.error('Save document error:', error);
      Alert.alert(
        'Error',
        'Failed to save document. Please try again.'
      );
    } finally {
      setIsSaving(false);
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
          {isLoading ? (
            <ActivityIndicator size="large" color="#0000ff" style={styles.loader} />
          ) : pdfSource ? (
            <View style={styles.pdfContainer}>
              <DocumentView
                document={pdfSource.uri}
                showLeadingNavButton={true}
                leadingNavButtonIcon={Platform.OS === 'ios' ? 'back' : 'arrow_back'}
                onLeadingNavButtonPressed={() => {
                  setPdfVisible(false);
                  setPdfSource(null);
                }}
                showBottomToolbar={true}
                showTopToolbar={true}
                readOnly={false}
                annotationAuthor="User"
                pageChangeOnTap={true}
                useStylusAsPen={true}
                bottomToolbarEnabled={true}
                hideToolbarsOnTap={true}
                maintainZoomLevel={true}
                documentSliderEnabled={true}
                pageNumberIndicatorEnabled={true}
                onDocumentLoaded={() => {
                  console.log('PDF loaded successfully');
                }}
                onError={(error) => {
                  console.error('PDF viewer error:', error);
                }}
                style={styles.pdfViewer}
              />
              <View style={styles.pdfButtonContainer}>
                <TouchableOpacity
                  style={[styles.saveButton, isSaving && styles.buttonDisabled]}
                  onPress={handleSaveDocument}
                  disabled={isSaving}
                >
                  <Text style={styles.saveButtonText}>
                    {isSaving ? 'Saving...' : 'Save Document'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => {
                    setPdfVisible(false);
                    setPdfSource(null);
                  }}
                >
                  <Text style={styles.closeButtonText}>Close</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : null}
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
    left: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    backgroundColor: 'transparent',
    zIndex: 999,
  },
  saveButton: {
    backgroundColor: '#2E7D32', // Green color for save button
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    flex: 1,
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  closeButton: {
    backgroundColor: '#666',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    width: 100,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  buttonDisabled: {
    backgroundColor: '#A0A0A0',
    opacity: 0.7,
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
  pdfViewer: {
    flex: 1,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pdfContainer: {
    flex: 1,
  },
});

export default SoapNotes;

