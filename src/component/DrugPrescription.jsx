import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, SafeAreaView, Alert
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useDispatch } from 'react-redux';
import { addPatientDrug } from '../Redux/Slices/DrugSlice';
import CustomHeader from './CustomHeader';

const DrugPrescription = ({ route, navigation }) => {
  const dispatch = useDispatch();
  const { demographicNo, condition } = route.params;

  const [drugData, setDrugData] = useState({
    drugName: '',
    startDate: new Date(),
    duration: '',
    quantity: '',
    refills: '',
    instructions: '',
  });

  const [showDatePicker, setShowDatePicker] = useState(false);

  const handleSubmit = async () => {
    try {
      const formattedDrug = {
        demographicNo,
        appointmentNo: demographicNo,
        drugData: [{
          groupName: drugData.drugName,
          drugForm: 'Cream',
          dosage: '0.1%',
          indication: condition,
          instructions: drugData.instructions,
          duration: parseInt(drugData.duration),
          quantity: parseInt(drugData.quantity),
          repeat: parseInt(drugData.refills) || 0,
          longTerm: false,
          startDate: drugData.startDate.toISOString().split('T')[0]
        }]
      };

      const result = await dispatch(addPatientDrug(formattedDrug)).unwrap();
      if (result.status === 'Success') {
        Alert.alert('Success', 'Prescription added successfully');
      }
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to add prescription');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <CustomHeader title="Drug Prescription" />
      <ScrollView style={styles.scrollView}>
        <View style={styles.formContainer}>
          <TouchableOpacity style={styles.closeButton} onPress={() => navigation.goBack()}>
            <Text style={styles.closeText}>✕</Text>
          </TouchableOpacity>

          <Text style={styles.label}>Drug Name</Text>
          <TextInput
            style={styles.input}
            value={drugData.drugName}
            onChangeText={(text) => setDrugData({ ...drugData, drugName: text })}
            placeholder="e.g., Amcinonide 0.1% Cream"
          />

          <Text style={styles.label}>Start Date</Text>
          <TouchableOpacity
            style={styles.input}
            onPress={() => setShowDatePicker(true)}
          >
            <Text>{drugData.startDate.toISOString().split('T')[0]}</Text>
          </TouchableOpacity>

          {showDatePicker && (
            <DateTimePicker
              value={drugData.startDate}
              mode="date"
              display="default"
              onChange={(event, selectedDate) => {
                setShowDatePicker(false);
                if (selectedDate) {
                  setDrugData({ ...drugData, startDate: selectedDate });
                }
              }}
            />
          )}

          <View style={styles.row}>
            <View style={styles.halfInput}>
              <Text style={styles.label}>Duration (Days)</Text>
              <TextInput
                style={styles.input}
                value={drugData.duration}
                onChangeText={(text) => setDrugData({ ...drugData, duration: text })}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.halfInput}>
              <Text style={styles.label}>End Date</Text>
              <Text style={[styles.input, { color: '#999' }]}>
                Auto-calculated 
              </Text>
            </View>
          </View>

          <Text style={styles.label}>Quantity</Text>
          <TextInput
            style={styles.input}
            value={drugData.quantity}
            onChangeText={(text) => setDrugData({ ...drugData, quantity: text })}
            keyboardType="numeric"
          />

          <Text style={styles.label}>Refills</Text>
          <TextInput
            style={styles.input}
            value={drugData.refills}
            onChangeText={(text) => setDrugData({ ...drugData, refills: text })}
            keyboardType="numeric"
          />

          <Text style={styles.label}>Instructions (SIG)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={drugData.instructions}
            onChangeText={(text) => setDrugData({ ...drugData, instructions: text })}
            multiline
            placeholder="Apply a thin layer to affected area..."
          />

          <TouchableOpacity style={styles.secondaryButton}>
            <Text style={styles.secondaryText}>+ Add Another Drug</Text>
          </TouchableOpacity>

          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.blueButton}>
              <Text style={styles.buttonText}>Generate SOAP Note</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.greenButton} onPress={handleSubmit}>
              <Text style={styles.buttonText}>Write Prescription</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  scrollView: { flex: 1 },
  formContainer: { padding: 16 },
  label: { fontSize: 16, fontWeight: '600', marginVertical: 8 },
  input: {
    borderWidth: 1, borderColor: '#ccc', borderRadius: 8,
    padding: 12, fontSize: 16, backgroundColor: '#f9f9f9'
  },
  textArea: {
    height: 100, textAlignVertical: 'top'
  },
  closeButton: { alignItems: 'flex-end', marginBottom: 10 },
  closeText: { fontSize: 24, color: '#e74c3c' },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  halfInput: { flex: 0.48 },
  secondaryButton: {
    backgroundColor: '#f2f2f2',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginVertical: 16
  },
  secondaryText: { fontSize: 16, color: '#333' },
  buttonRow: { flexDirection: 'row', justifyContent: 'space-between' },
  blueButton: {
    backgroundColor: '#2e86de',
    padding: 14,
    borderRadius: 8,
    flex: 0.48,
    alignItems: 'center'
  },
  greenButton: {
    backgroundColor: '#27ae60',
    padding: 14,
    borderRadius: 8,
    flex: 0.48,
    alignItems: 'center'
  },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 }
});

export default DrugPrescription;
