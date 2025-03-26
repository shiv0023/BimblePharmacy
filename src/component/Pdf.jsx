import React from 'react';
import { Modal, View, TouchableOpacity, Text, StyleSheet, ScrollView, Image } from 'react-native';

const PDFViewer = ({ visible, onClose, pdfContent }) => {
  console.log('PDFViewer props:', { visible, pdfContent });

  if (!visible) return null;

  if (!pdfContent) {
    return (
      <Modal
        visible={visible}
        animationType="slide"
        transparent={true}
        onRequestClose={onClose}
      >
        <View style={styles.container}>
          <View style={styles.modalContent}>
            <View style={styles.header}>
              <Text style={styles.headerTitle}>Error</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>
            <View style={[styles.section, { alignItems: 'center' }]}>
              <Text style={styles.errorText}>No PDF content available</Text>
            </View>
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
      presentationStyle="fullScreen"
    >
      <View style={styles.container}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Prescription PDF</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* PDF Content */}
          <ScrollView style={styles.pdfContainer}>
            {/* Clinic Info Section */}
            <View style={styles.section}>
              {pdfContent?.clinicInfo?.logo && (
                <Image
                  source={{ uri: `https://api.bimble.pro/media/${pdfContent.clinicInfo.logo}` }}
                  style={styles.logo}
                  resizeMode="contain"
                />
              )}
              <Text style={styles.date}>{pdfContent?.clinicInfo?.date}</Text>
              <Text style={styles.clinicName}>{pdfContent?.clinicInfo?.clinicName}</Text>
              <Text style={styles.address}>{pdfContent?.clinicInfo?.address}</Text>
              <Text style={styles.address}>
                {pdfContent?.clinicInfo?.city}, {pdfContent?.clinicInfo?.province} {pdfContent?.clinicInfo?.postalCode}
              </Text>
              <Text style={styles.contact}>Phone: {pdfContent?.clinicInfo?.phone}</Text>
              <Text style={styles.contact}>Fax: {pdfContent?.clinicInfo?.fax}</Text>
            </View>

            {/* Pharmacy Info Section */}
            {pdfContent?.pharmacyInfo && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Pharmacy Details</Text>
                <Text style={styles.pharmacyName}>{pdfContent.pharmacyInfo.name}</Text>
                <Text style={styles.address}>{pdfContent.pharmacyInfo.address}</Text>
                <Text style={styles.address}>
                  {pdfContent.pharmacyInfo.city}, {pdfContent.pharmacyInfo.province} {pdfContent.pharmacyInfo.postalCode}
                </Text>
                <Text style={styles.contact}>Phone: {pdfContent.pharmacyInfo.phone}</Text>
                <Text style={styles.contact}>Fax: {pdfContent.pharmacyInfo.fax}</Text>
              </View>
            )}

            {/* Patient Info Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Patient Information</Text>
              <Text style={styles.patientName}>{pdfContent?.patientInfo?.name}</Text>
              <Text style={styles.patientDetails}>
                {pdfContent?.patientInfo?.gender}/{pdfContent?.patientInfo?.age} years (PHN: {pdfContent?.patientInfo?.phn})
              </Text>
              <Text style={styles.address}>{pdfContent?.patientInfo?.address}</Text>
              <Text style={styles.address}>
                {pdfContent?.patientInfo?.city}, {pdfContent?.patientInfo?.province} {pdfContent?.patientInfo?.postalCode}
              </Text>
              <Text style={styles.contact}>Cell: {pdfContent?.patientInfo?.phoneCell}</Text>
              <Text style={styles.contact}>Work: {pdfContent?.patientInfo?.phoneWork}</Text>
              <Text style={styles.contact}>Home: {pdfContent?.patientInfo?.phoneHome}</Text>
            </View>

            {/* Allergies Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Drug Allergies</Text>
              <Text style={styles.allergies}>{pdfContent?.allergies}</Text>
            </View>

            {/* Medications Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Medications</Text>
              {pdfContent?.medications?.map((med, index) => (
                <View key={index} style={styles.medicationCard}>
                  <Text style={styles.medicationName}>{med.name}</Text>
                  <Text style={styles.medicationDetails}>{med.indication}</Text>
                  <Text style={styles.medicationDetails}>{med.instructions}</Text>
                  <Text style={styles.medicationDetails}>Quantity: {med.quantity}</Text>
                  <Text style={styles.medicationDetails}>Repeats: {med.repeats}</Text>
                  <Text style={styles.medicationDetails}>
                    Duration: {med.duration} Days ({med.startDate} - {med.endDate})
                  </Text>
                </View>
              ))}
            </View>

            {/* Delivery Option */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Delivery Option</Text>
              <Text style={styles.deliveryOption}>
                {pdfContent?.deliveryOption === 'delivery' ? 'Delivery' : 'Pickup'}
              </Text>
            </View>

            {/* Signature Section */}
            {pdfContent?.signature && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Doctor's Signature</Text>
                <Image
                  source={{ uri: `data:image/png;base64,${pdfContent.signature}` }}
                  style={styles.signature}
                  resizeMode="contain"
                />
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
   backgroundColor: 'red',
  },
  modalContent: {
    flex: 1,
    backgroundColor: '#fff',
    margin: 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212529',
  },
  closeButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#e9ecef',
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 18,
    color: '#495057',
    fontWeight: '600',
  },
  pdfContainer: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 20,
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  logo: {
    width: 120,
    height: 60,
    marginBottom: 12,
  },
  date: {
    fontSize: 14,
    color: '#212529',
    marginBottom: 8,
  },
  clinicName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 12,
  },
  address: {
    fontSize: 14,
    color: '#495057',
    marginBottom: 4,
  },
  contact: {
    fontSize: 14,
    color: '#495057',
    marginBottom: 4,
  },
  patientName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#212529',
    marginBottom: 4,
  },
  patientDetails: {
    fontSize: 14,
    color: '#495057',
    marginBottom: 8,
  },
  allergies: {
    fontSize: 14,
    color: '#495057',
  },
  medicationCard: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  medicationName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#212529',
    marginBottom: 4,
  },
  medicationDetails: {
    fontSize: 14,
    color: '#495057',
    marginBottom: 4,
  },
  deliveryOption: {
    fontSize: 14,
    color: '#495057',
  },
  signature: {
    width: '100%',
    height: 100,
    backgroundColor: '#f8f9fa',
    marginTop: 8,
  },
  pharmacyName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#212529',
    marginBottom: 8,
  },
  errorText: {
    fontSize: 16,
    color: 'red',
    textAlign: 'center',
    padding: 20,
  },
});

export default PDFViewer;