import React, { useState } from 'react';
import { StyleSheet, View, Dimensions, TouchableOpacity, Text } from 'react-native';
import Pdf from 'react-native-pdf';
import { FileIcon } from "./svgComponent"; // Assuming FileIcon is available

export default function PDFViewer({ route }) {
  const { uri: initialUri, title } = route.params;
  const placeholderPdf = 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf';
  const [currentPdf, setCurrentPdf] = useState(initialUri || placeholderPdf);

  return (
    <View style={styles.container}>
      {/* Main Content Area */}
      <View style={styles.contentArea}>
        <Pdf
           source={{ uri: currentPdf, cache: false }}
           onLoadComplete={(numberOfPages) => {
             console.log(`Loaded ${numberOfPages} pages`);
           }}
           onError={(error) => {
             console.error('Error loading PDF:', error);
             alert('Failed to load PDF. Please try again.');
           }}
           style={styles.pdf}
        />
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <FooterButton text="CBC.pdf"  uri="https://example.com/cbc.pdf" onPress={setCurrentPdf} />
        <FooterButton text="Outbundle.zip" uri="https://example.com/outbundle.pdf"
 onPress={setCurrentPdf} />
        <FooterButton text="KFReport.pdf" uri="https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf" onPress={setCurrentPdf} />
      </View>
    </View>
  );
}

// Footer Button Component
const FooterButton = ({ text, uri, onPress }) => (
  <TouchableOpacity style={styles.footerButton} onPress={() => onPress(uri)}>
    <FileIcon />
    <Text style={styles.footerButtonText}>{text}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000', // Black background for the container
  },
  contentArea: {
    flex: 1, // Take up all remaining space except the footer
    backgroundColor: '#fff', // White background for the content area
    padding: 20,
    marginTop: 20,
  },
  pdf: {
    flex: 1,
    width: Dimensions.get('window').width - 40, // Adjust width to account for padding
    alignSelf: 'center', // Center the PDF viewer
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between', // Even spacing between buttons
    alignItems: 'center',
    height: 70, // Match height to the image footer
    backgroundColor: 'rgba(25, 25, 25, 1)', // Dark grey background for the footer
    paddingHorizontal: 15, // Add padding for spacing
  },
  footerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: 110, // Set fixed width for buttons to align like the image
    height: 40, // Set fixed height for buttons
    backgroundColor: '#fff', // White background for the button
    borderRadius: 8, // Rounded corners for buttons
    marginHorizontal: 5, // Spacing between buttons
  },
  footerButtonText: {
    marginLeft: 5, // Space between icon and text
    color: '#333', // Dark text color for button text
    fontSize: 12,
    fontWeight: 'bold',
  },
});
