import React from 'react';
import { StyleSheet, View, Dimensions } from 'react-native';
import Pdf from 'react-native-pdf';

export default function PDFViewer({ route }) {
  const { uri } = route.params;
  const placeholderPdf = 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf';
  const pdfUri = uri || placeholderPdf;
  return (
    <View style={styles.container}>
      <Pdf
        source={{ uri:pdfUri, cache: true }}
        onLoadComplete={(numberOfPages) => {
          console.log(`Loaded ${numberOfPages} pages`);
        }}
        onError={(error) => {
          console.error(error);
        }}
        style={styles.pdf}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pdf: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
  },
});
