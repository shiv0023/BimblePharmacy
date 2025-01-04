import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  Dimensions,
  SafeAreaView,
  StatusBar
} from "react-native";
import { CareCenterIcon, FileIcon, PdfIcon } from "./svgComponent";


const { width, height } = Dimensions.get('window');

export default function PatientReport() {
  return (
    <View style={{backgroundColor:'black',flex:1}}>
    <SafeAreaView style={styles.container}>



    
      <ScrollView style={styles.content}>

        <View style={styles.clinicInfo}>
          <CareCenterIcon />
          <View style={styles.clinicDetails}>
            <Text style={styles.clinicTitle}>Care Center</Text>
            <Text style={styles.clinicTiming}>Timing: Mon, 10 AM - 5 PM</Text>
            <Text style={styles.clinicAddress}>Address: Lorem Ipsum Ipsum</Text>
            <Text style={styles.clinicEmail}>carecenter@gmail.com</Text>
          </View>
        </View>

        {/* Patient Information */}
        <Text style={styles.sectionTitle}>Patient Information:</Text>
        <View style={styles.infoSection}>
          <InfoRow label="Name" value="Aiden Sheppard" />
          <InfoRow label="Gender" value="M" />
          <InfoRow label="Contact" value="9678564378" />
          <InfoRow label="Email" value="LoremIpsum@gmail.com" />
        </View>

        {/* Diagnosis Report */}
        <Text style={styles.sectionTitle}>Diagnosis Report:</Text>
        <View style={styles.reportSection}>
          <Text style={styles.reportDate}>Thu, Nov 7, 2024</Text>
          <Text style={styles.reportText}>
            Lorem Ipsum available, but the majority have suffered alteration in some form, by injected humor, or randomized words which don't look even slightly believable.
          </Text>
          <Text style={styles.reportText}>
            The patient is prescribed to take the following medications:
          </Text>
          <Text style={styles.medication}>- Alageric, 450 mg</Text>
          <Text style={styles.medication}>- Paracetamol, 500 mg</Text>
        </View>

        {/* Authorized By */}
        <Text style={styles.authorizedBy}>Authorized By:</Text>
        <Text style={styles.authorizedName}>Dr. Lorem Ipsum</Text>
      </ScrollView>

      {/* Footer Buttons */}
      <View style={styles.footer}>
        <FooterButton text="CBC.pdf" />
        <FooterButton text="Outbundle.zip" />
        <FooterButton text="KFReport.pdf" />
      </View>
    </SafeAreaView>
    </View>
  );
}

// InfoRow Component
const InfoRow = ({ label, value }) => (
  <View style={styles.infoRow}>
    <Text style={styles.infoLabel}>{label}:</Text>
    <Text style={styles.infoValue}>{value}</Text>
  </View>
);

// Footer Button Component
const FooterButton = ({ text }) => (
  <TouchableOpacity style={styles.footerButton}>
    <FileIcon />
    <Text style={styles.footerButtonText}>{text}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    margin:20,
  },

  content: {
    flex: 1,
    padding: width < 375 ? 10 : 15,
   
    
  },
  clinicInfo: {
    flexDirection: "row",
    justifyContent: 'space-between',
    alignItems: "center",
    marginBottom: 20,
  },
  clinicDetails: {
    marginLeft: 10,
  },
  clinicTitle: {
    fontSize: width < 375 ? 20 : 22,
    fontWeight: "bold",
    color: "#333",
    textAlign: 'center',
    marginLeft:20
  },
  clinicTiming: {
    fontSize: 14,
    color: "rgba(25,25,25,1)",
    marginLeft:Platform.OS==='ios'?18:20
  },
  clinicAddress: {
    fontSize: 14,
    color: "#666",
    marginLeft:6
  },
  clinicEmail: {
    fontSize: 14,
    alignSelf: 'center',
    color: "rgba(25,25,25,1)",
    marginLeft:40
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: 'rgba(25, 25, 25, 1)',
    marginLeft: 5,
  },
  infoSection: {
    marginBottom: 30,
    marginTop: 20,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: 'center',
    marginBottom: 5,
    borderBottomWidth: 0.5,
    gap: 15,
  },
  infoLabel: {
    fontWeight: "bold",
    fontSize: 14,
    color: "#333",
    padding: 10,
  },
  infoValue: {
    fontSize: 14,
    color: 'rgba(25,25,25,1)',
  },
  reportSection: {
    marginBottom: 20,
  },
  reportDate: {
    fontSize: 14,
    fontWeight: 500,
    marginBottom: 5,
    marginTop:30
  },
  reportText: {
    fontSize: 14,
    color: 'rgba(25, 25, 25, 1)',
    marginBottom: 10,
  },
  medication: {
    fontSize: 14,
    color: 'rgba(25,25,25,1)',
    marginLeft: 10,
    fontWeight: 500,
  },
  authorizedBy: {
    fontSize: 14,
    fontWeight: "bold",
    textAlign: "right",
    marginTop: 70,
  },
  authorizedName: {
    color: "#333",
    fontWeight: 450,
    textAlign: 'right',
    marginTop:3
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 7,
    backgroundColor: 'rgba(25, 25, 25, 1)',
  },
  footerButton: {
    flexDirection: 'row',
    marginHorizontal: 5,
    paddingVertical: 10,
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 7,
  },
  footerButtonText: {
    color: 'rgba(25, 25, 25, 1)',
    fontSize: Platform.OS === 'ios' ? 10 : 12,
    fontWeight: "bold",
  },
});

