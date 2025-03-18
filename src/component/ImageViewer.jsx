import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  StatusBar,
  TouchableOpacity,
  SafeAreaView,
  Text,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import ImageZoom from 'react-native-image-zoom-viewer';

const ImageViewer = ({ route }) => {
  const { uri } = route.params;
  const navigation = useNavigation();
  const [isLoading, setIsLoading] = useState(true);

  const images = [
    {
      url: uri,
      props: {
        onLoadStart: () => setIsLoading(true),
        onLoadEnd: () => setIsLoading(false),
      },
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="black" barStyle="light-content" />
      <TouchableOpacity 
        style={styles.closeButton} 
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.closeButtonText}>✕</Text>
      </TouchableOpacity>

      <ImageZoom
        imageUrls={images}
        enableSwipeDown={true}
        onSwipeDown={() => navigation.goBack()}
        enableImageZoom={true}
        maxOverflow={300}
        renderIndicator={() => null}
        loadingRender={() => (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#FFFFFF" />
          </View>
        )}
      />
{/* 
      <View style={styles.instructionsContainer}>
        <Text style={styles.instructionsText}>
          Pinch to zoom • Swipe down to close
        </Text>
      </View> */}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  closeButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    zIndex: 2,
    padding: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: 'white',
    fontSize: 24,
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 1,
  },
  instructionsContainer: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingVertical: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  instructionsText: {
    color: 'white',
    fontSize: 14,
    fontFamily: 'Product Sans Regular',
  },
});

export default ImageViewer;