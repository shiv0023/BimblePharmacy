import React, { useState } from 'react';
import { StyleSheet, View, Dimensions, TouchableOpacity, Text, StatusBar, ActivityIndicator, ScrollView } from 'react-native';
import Pdf from 'react-native-pdf';
import { FileIcon } from "./svgComponent";
import Svg, { G, Path, Defs, ClipPath } from "react-native-svg"
const PdfIcon = ({props}) => {
  return (
    <Svg
      width={15}
      height={20}
      viewBox="0 0 15 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <G clipPath="url(#clip0_543_547)">
        <Path
          d="M15 5.455v12.67C15 19.162 14.135 20 13.067 20H1.933C.865 20 0 19.162 0 18.125V1.875C0 .838.865 0 1.933 0h7.442"
          fill="#E31E24"
        />
        <Path
          d="M15 5.455h-4.583c-.573 0-1.042-.455-1.042-1.01V0"
          fill="#FFA1A4"
        />
        <Path
          d="M3.173 12.8V9.317h1.264c.171 0 .33.026.48.08.148.053.279.13.39.227a1.046 1.046 0 01.356.792 1.043 1.043 0 01-.357.798c-.11.097-.24.174-.39.226-.147.053-.308.081-.479.081H3.85V12.8h-.677zm1.275-1.901c.177 0 .31-.048.402-.145a.483.483 0 00.002-.67.503.503 0 00-.169-.104.644.644 0 00-.235-.039H3.85v.958h.598zM6.144 9.317h1.214c.284 0 .54.043.767.127.227.085.42.204.581.358.16.154.284.337.369.552.085.214.127.448.127.705 0 .256-.042.497-.127.71a1.521 1.521 0 01-.369.55c-.16.152-.354.27-.581.356a2.18 2.18 0 01-.767.127H6.144V9.317zm1.183 2.86c.198 0 .37-.025.52-.08.15-.053.276-.13.378-.226a.89.89 0 00.225-.354c.05-.137.075-.29.075-.46 0-.17-.025-.322-.075-.46a.944.944 0 00-.225-.353 1.005 1.005 0 00-.377-.226 1.528 1.528 0 00-.52-.08H6.82v2.238h.506v.002zM9.75 9.317h2.277v.622h-1.6v.847h1.44v.622h-1.44V12.8H9.75V9.317z"
          fill="#F9F9F9"
        />
      </G>
      <Defs>
        <ClipPath id="clip0_543_547">
          <Path fill="#fff" d="M0 0H15V20H0z" />
        </ClipPath>
      </Defs>
    </Svg>
  )
}

const PDF_LIST = [
  {
    name: 'CBC.pdf',
    uri: 'https://cag.gov.in/uploads/media/List-of-Holidays-0001-0666003cad28a12-43089420.pdf'
  },
  {
    name: 'Outbundle.pdf',
    uri: 'https://www.mha.gov.in/sites/default/files/PR_UNLOCK1Guidelines_30052020.pdf'
  },
  {
    name: 'KFTreport.pdf',
    uri: 'https://www.emhealth.org/wp-content/uploads/dlm_uploads/2018/09/Pharmacy-Report-2021.pdf'
  }
];

export default function PDFViewer({ navigation }) {
  const [currentPdf, setCurrentPdf] = useState({
    uri: PDF_LIST[0].uri,
    name: PDF_LIST[0].name
  });

  const handlePdfChange = (pdf) => {
    setCurrentPdf(pdf);
  };

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#000" barStyle="light-content" />
      
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <PdfIcon fill="#FF0000" />
          <Text style={styles.headerText}>{currentPdf.name}</Text>
        </View>
        <TouchableOpacity 
          onPress={() => navigation.goBack()} 
          style={styles.closeButton}
        >
          <Text style={styles.closeButtonText}>✕</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.contentArea}>
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={true}
          bounces={false}
        >
          <Pdf
            source={{ uri: currentPdf.uri, cache: false }}
            onLoadComplete={(numberOfPages) => {
              console.log(`Loaded ${numberOfPages} pages`);
            }}
            onError={(error) => {
              console.error('Error loading PDF:', error);
              alert('Failed to load PDF. Please try again.');
            }}
            style={styles.pdf}
            enablePaging={false}
            horizontal={false}
            enableAntialiasing={true}
            spacing={0}
            scale={1.0}
            minScale={0.5}
            maxScale={3.0}
            renderActivityIndicator={() => <ActivityIndicator />}
            enableRTL={false}
            trustAllCerts={false}
          />
        </ScrollView>
      </View>

      <View style={styles.footer}>
        {PDF_LIST.map((pdf, index) => (
          <FooterButton 
            key={index}
            text={pdf.name}
            onPress={() => handlePdfChange(pdf)}
          />
        ))}
      </View>
    </View>
  );
}

const FooterButton = ({ text, onPress }) => (
  <TouchableOpacity style={styles.footerButton} onPress={onPress}>
    <FileIcon />
    <Text style={styles.footerButtonText}>{text}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingTop: Platform.OS === 'ios' ? 70 : 20,
    paddingBottom: 15,
    backgroundColor: '#000',
    borderBottomWidth: 0,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerText: {
    color: '#fff',
    fontSize: 16,
    marginLeft: 8,
    fontWeight: '500',
  },
  closeButton: {
    padding: 5,
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '500',
  },
  contentArea: {
    flex: 1,
    backgroundColor: 'rgba(25, 25, 25, 0.8)',
    margin: 10,
    padding: 0,

  },
  scrollContainer: {
    flexGrow: 1,
  },
  pdf: {
    flex: 1,
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
    backgroundColor: 'transparent',
    
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#191919',
    paddingVertical: 15,
    paddingHorizontal: 15,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  footerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    minWidth: 100,
    justifyContent: 'center',
    marginBottom:20
  },
  footerButtonText: {
    color: '#333',
    fontSize: 12,
    marginLeft: 5,
    fontWeight: '500',
  },
});
