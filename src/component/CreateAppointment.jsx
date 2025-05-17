import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Platform,
    StatusBar,
    FlatList,
    ActivityIndicator,
    Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import CustomHeader from './CustomHeader';
import { AppointmentUserIcon } from './svgComponent';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { moderateScale, verticalScale } from 'react-native-size-matters';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useDispatch, useSelector } from 'react-redux';
import { searchPatients, clearSearchResults } from '../Redux/Slices/PatientSlice';
import debounce from 'lodash/debounce';
import {
    fetchAppointmentReasons,
    toggleReasonDropdown,
    closeReasonDropdown
} from '../Redux/Slices/AppointmentReasoSlice';

export default function CreateAppointment({ navigation, route }) {
    const dispatch = useDispatch();
    const subdomain = route.params?.subdomain;
    console.log('Received subdomain:', subdomain);
    const { searchResults, loading, error } = useSelector(state => state.auth?.patientSearch || {
        searchResults: [],
        loading: false,
        error: null
    });
    const {
        reasons = [],
        loading: reasonsLoading,
        showReasonDropdown,
        error: reasonsError
    } = useSelector(state => state.auth?.appointmentReason || {});
    console.log(reasons, 'reesults')
    
    const [showSearchResults, setShowSearchResults] = useState(false);
    const [isReasonModalVisible, setIsReasonModalVisible] = useState(false);

    const [formData, setFormData] = useState({
        patientName: '',
        reason: '',
        reasonDesc: '',
        date: new Date(),
        time: new Date(),
        duration: '30',
        type: 'Follow-up',
        status: 'To Do',
        selectedPatient: null,
    });

    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showTimePicker, setShowTimePicker] = useState(false);

    // Create a debounced search function
    const debouncedSearch = debounce((searchText) => {
        if (searchText.length >= 2) {
            dispatch(searchPatients(searchText));
            setShowSearchResults(true);
        } else {
            dispatch(clearSearchResults());
            setShowSearchResults(false);
        }
    }, 500);

    useEffect(() => {
        return () => {
            dispatch(clearSearchResults());
            debouncedSearch.cancel();
        };
    }, []);

    useEffect(() => {
        const fetchReasons = async () => {
            if (!subdomain) {
                console.error('No subdomain provided');
                return;
            }
            
            try {
                console.log('Fetching reasons with subdomain:', subdomain);
                const result = await dispatch(fetchAppointmentReasons(subdomain)).unwrap();
                console.log('API call completed. Result:', result);
                
                // Check if we got a valid response
                if (result && result.reasons) {
                    console.log('Successfully received reasons:', result.reasons);
                } else {
                    console.log('Received invalid reasons format:', result);
                }
            } catch (error) {
                console.error('Error fetching reasons:', error);
            }
        };

        if (subdomain) {
            fetchReasons();
        }
    }, [dispatch, subdomain]);

    const handlePatientSearch = (text) => {
        setFormData(prev => ({ ...prev, patientName: text }));
        debouncedSearch(text);
    };

    const handlePatientSelect = (patient) => {
        setFormData(prev => ({
            ...prev,
            patientName: `${patient.firstName} ${patient.lastName}`,
            selectedPatient: patient
        }));
        setShowSearchResults(false);
        dispatch(clearSearchResults());
    };

    const handleDateChange = (event, selectedDate) => {
        setShowDatePicker(false);
        if (selectedDate) {
            setFormData(prev => ({ ...prev, date: selectedDate }));
        }
    };

    const handleTimeChange = (event, selectedTime) => {
        setShowTimePicker(false);
        if (selectedTime) {
            setFormData(prev => ({ ...prev, time: selectedTime }));
        }
    };

    const formatDate = (date) => {
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    const formatTime = (time) => {
        return time.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
        });
    };

    const handleSubmit = () => {
        // Handle form submission here
        console.log('Form submitted:', formData);
        // Navigate back to appointments
        navigation.goBack();
    };

    const handleReasonSelect = (reason) => {
        const reasonText = typeof reason === 'object' ? reason.label || reason.value : reason;
        setFormData(prev => ({ ...prev, reason: reasonText }));
        setIsReasonModalVisible(false);
        dispatch(closeReasonDropdown());
    };

    const renderSearchResult = ({ item }) => (
        <TouchableOpacity
            style={styles.searchResultItem}
            onPress={() => handlePatientSelect(item)}
        >
            <View>
                <Text style={styles.patientName}>
                    {item.firstName} {item.lastName}
                </Text>
                <Text style={styles.patientInfo}>
                    PHN: {item.phn} | DOB: {formatSimpleDate(item.dob)}
                </Text>
            </View>
        </TouchableOpacity>
    );

    const formatSimpleDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
    };

    const calculateAge = (dob) => {
        if (!dob) return '';
        const birthDate = new Date(dob);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();

        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }

        return `${age} years`;
    };

    // Update the PatientDetailsCard component
    const PatientDetailsCard = ({ patient }) => {
        if (!patient) return null;

        return (
            <View style={styles.patientDetailsCard}>
                <Text style={styles.selectedPatientName}>
                    {patient.firstName} {patient.lastName}/
                    {patient.gender}/
                    {formatSimpleDate(patient.dob)}
                </Text>

                <View style={styles.patientDetailsRow}>
                    <Text style={styles.detailText}>
                        PHN: {patient.phn}
                    </Text>
                    <Text style={styles.detailText}>
                        Email: {patient.email}
                    </Text>
                    <Text style={styles.detailText}>
                        Allergies: {patient.allergies || 'NKA'}
                    </Text>
                </View>
            </View>
        );
    };

   

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar backgroundColor="#0049F8" barStyle="light-content" />
            <CustomHeader title="Create Appointment" IconComponent={AppointmentUserIcon} />

            <FlatList
                style={styles.content}
                data={[1]} // Single item since we just need one render
                renderItem={() => (
                    <View style={styles.card}>
                        <Text style={styles.sectionTitle}>Patient Information</Text>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Search or Create Patient</Text>
                            <View style={styles.searchContainer}>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Search by name, ID, or phone"
                                    value={formData.patientName}
                                    onChangeText={handlePatientSearch}
                                />
                                {loading && (
                                    <ActivityIndicator
                                        style={styles.searchLoader}
                                        color="#0049F8"
                                        size="small"
                                    />
                                )}
                                {showSearchResults && searchResults?.length > 0 && (
                                    <View style={styles.searchResultsContainer}>
                                        <FlatList
                                            data={searchResults}
                                            renderItem={renderSearchResult}
                                            keyExtractor={(item) => item.demographicNo.toString()}
                                            nestedScrollEnabled={false} // Disable nested scrolling
                                            style={styles.searchResultsList}
                                            scrollEnabled={false} // Disable scrolling for this list
                                            maxHeight={200} // Limit height
                                        />
                                    </View>
                                )}
                            </View>
                        </View>

                        {formData.selectedPatient && (
                            <PatientDetailsCard patient={formData.selectedPatient} />
                        )}

                        <Text style={styles.sectionTitle}>Appointment Details</Text>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Reason for Visit</Text>
                            <TouchableOpacity
                                style={[styles.input, styles.reasonInput]}
                                onPress={() => setIsReasonModalVisible(true)}
                            >
                                <Text style={[styles.inputText, !formData.reason && styles.placeholderText]}>
                                    {formData.reason || "Select reason"}
                                </Text>
                                <Icon
                                    name="chevron-down"
                                    size={20}
                                    color="#666"
                                />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Description (Optional)</Text>
                            <TextInput
                                style={[styles.input, styles.textArea]}
                                placeholder="Enter description"
                                multiline
                                numberOfLines={3}
                                value={formData.reasonDesc}
                                onChangeText={(text) => setFormData(prev => ({ ...prev, reasonDesc: text }))}
                            />
                        </View>

                        <View style={styles.dateTimeContainer}>
                            <View style={styles.dateTimeGroup}>
                                <Text style={styles.label}>Date</Text>
                                <TouchableOpacity
                                    style={styles.dateTimeButton}
                                    onPress={() => setShowDatePicker(true)}
                                >
                                    <Icon name="calendar" size={20} color="#0049F8" style={styles.icon} />
                                    <Text style={styles.dateTimeText}>{formatDate(formData.date)}</Text>
                                </TouchableOpacity>
                            </View>

                            <View style={styles.dateTimeGroup}>
                                <Text style={styles.label}>Time</Text>
                                <TouchableOpacity
                                    style={styles.dateTimeButton}
                                    onPress={() => setShowTimePicker(true)}
                                >
                                    <Icon name="clock-outline" size={20} color="#0049F8" style={styles.icon} />
                                    <Text style={styles.dateTimeText}>{formatTime(formData.time)}</Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                     
                    </View>
                )}
                keyExtractor={() => 'form'}
                contentContainerStyle={styles.contentContainer}
            />

            {showDatePicker && (
                <DateTimePicker
                    value={formData.date}
                    mode="date"
                    display="default"
                    onChange={handleDateChange}
                    minimumDate={new Date()}
                />
            )}

            {showTimePicker && (
                <DateTimePicker
                    value={formData.time}
                    mode="time"
                    display="default"
                    onChange={handleTimeChange}
                />
            )}

            <Modal
                visible={isReasonModalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setIsReasonModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Select Reason</Text>
                            <TouchableOpacity 
                                onPress={() => setIsReasonModalVisible(false)}
                                style={styles.closeButton}
                            >
                                <Icon name="close" size={24} color="#666" />
                            </TouchableOpacity>
                        </View>

                        {reasonsLoading ? (
                            <ActivityIndicator color="#0049F8" style={styles.reasonLoader} />
                        ) : reasonsError ? (
                            <View style={styles.errorContainer}>
                                <Text style={styles.errorText}>{reasonsError}</Text>
                                <TouchableOpacity 
                                    style={styles.retryButton}
                                    onPress={() => dispatch(fetchAppointmentReasons(subdomain))}
                                >
                                    <Text style={styles.retryText}>Retry</Text>
                                </TouchableOpacity>
                            </View>
                        ) : reasons && reasons.length > 0 ? (
                            <FlatList
                                data={reasons}
                                keyExtractor={(item, index) => index.toString()}
                                renderItem={({ item }) => (
                                    <TouchableOpacity
                                        style={[
                                            styles.reasonItem,
                                            formData.reason === (typeof item === 'object' ? item.label : item) && 
                                            styles.reasonItemSelected
                                        ]}
                                        onPress={() => handleReasonSelect(item)}
                                    >
                                        <Text style={[
                                            styles.reasonText,
                                            formData.reason === (typeof item === 'object' ? item.label : item) && 
                                            styles.reasonTextSelected
                                        ]}>
                                            {typeof item === 'object' ? item.label : item}
                                        </Text>
                                    </TouchableOpacity>
                                )}
                                style={styles.reasonList}
                                showsVerticalScrollIndicator={true}
                            />
                        ) : (
                            <View style={styles.noDataContainer}>
                                <Text style={styles.noDataText}>
                                    No appointment reasons available
                                </Text>
                            </View>
                        )}
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#0049F8',
    },
    content: {
        flex: 1,
        backgroundColor: '#f8f9fa',
        padding: moderateScale(16),
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 8,
        padding: moderateScale(16),
        marginBottom: verticalScale(16),
        borderColor: '#bfc9c2',
        borderWidth: 0.5,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '500',
        color: '#222',
        marginBottom: verticalScale(16),
        fontFamily: 'Product Sans Regular',
    },
    inputGroup: {
        marginBottom: verticalScale(16),
    },
    label: {
        fontSize: 14,
        color: '#222',
        marginBottom: verticalScale(8),
        fontWeight: '400',
        fontFamily: 'Product Sans Regular',
    },
    input: {
        borderWidth: 1,
        borderColor: '#E5E5E5',
        borderRadius: 8,
        padding: moderateScale(12),
        fontSize: 14,
        color: '#333',
        backgroundColor: '#FFFFFF',
    },
    textArea: {
        height: 100,
        textAlignVertical: 'top',
    },
    dateTimeContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: verticalScale(16),
    },
    dateTimeGroup: {
        flex: 1,
        marginRight: moderateScale(8),
    },
    dateTimeButton: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#bfc9c2',
        borderRadius: 8,
        padding: moderateScale(12),
        backgroundColor: '#FFFFFF',
    },
    icon: {
        marginRight: moderateScale(8),
    },
    dateTimeText: {
        fontSize: 14,
        color: '#222',
    },
    submitButton: {
        backgroundColor: '#0049F8',
        borderRadius: 30,
        padding: moderateScale(16),
        alignItems: 'center',
        marginBottom: verticalScale(32),
    },
    submitButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '400',
        fontFamily: 'Product Sans Regular',
    },
    searchContainer: {
        position: 'relative',
        zIndex: 1000,
    },
    searchLoader: {
        position: 'absolute',
        right: moderateScale(12),
        top: '50%',
        transform: [{ translateY: -10 }],
    },
    searchResultsContainer: {
        position: 'absolute',
        top: '100%',
        left: 0,
        right: 0,
        backgroundColor: '#FFFFFF',
        borderRadius: 8,
        marginTop: 4,
        borderWidth: 1,
        borderColor: '#E5E5E5',
        zIndex: 1000,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        maxHeight: 200,
    },
    searchResultsList: {
        flex: 1,
    },
    searchResultItem: {
        padding: moderateScale(16),
        borderBottomWidth: 1,
        borderBottomColor: '#E5E5E5',
        backgroundColor: '#FFFFFF',
    },
    patientName: {
        fontSize: 16,
        fontWeight: '500',
        color: '#000',
        marginBottom: 4,
        fontFamily: 'Product Sans Regular',
    },
    patientInfo: {
        fontSize: 14,
        color: '#666',
        marginBottom: 4,
        fontFamily: 'Product Sans Regular',
    },
    addressInfo: {
        fontSize: 14,
        color: '#666',
        marginBottom: 4,
        fontFamily: 'Product Sans Regular',
    },
    contactInfo: {
        marginTop: 4,
    },
    contactText: {
        fontSize: 13,
        color: '#666',
        fontFamily: 'Product Sans Regular',
    },
    allergyText: {
        fontSize: 13,
        color: '#666',
        marginTop: 2,
        fontFamily: 'Product Sans Regular',
    },
    patientDetailsCard: {
        marginTop: verticalScale(16),
        marginBottom: verticalScale(16),
    },
    selectedPatientName: {
        fontSize: 18,
        fontWeight: '500',
        color: '#000',
        marginBottom: verticalScale(8),
        fontFamily: 'Product Sans Regular',
    },
    patientDetailsRow: {
        flexDirection: 'row',
        justifyContent: 'flex-start',
        gap: moderateScale(24),
    },
    detailText: {
        fontSize: 14,
        color: '#666',
        fontFamily: 'Product Sans Regular',
    },
    reasonInput: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        minHeight: 48,
        paddingHorizontal: 16,
        backgroundColor: '#FFFFFF',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#E5E5E5',
    },
    reasonInputActive: {
        borderColor: '#0049F8',
        borderWidth: 1.5,
    },
    reasonDropdown: {
        position: 'absolute',
        top: '100%',
        left: 0,
        right: 0,
        backgroundColor: '#FFFFFF',
        borderRadius: 8,
        marginTop: 4,
        borderWidth: 1,
        borderColor: '#E5E5E5',
        zIndex: 1000,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        maxHeight: 300,
    },
    reasonList: {
        paddingVertical: 4,
    },
    reasonItem: {
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
        backgroundColor: '#FFFFFF',
    },
    reasonItemSelected: {
        backgroundColor: '#F0F7FF',
    },
    reasonText: {
        fontSize: 16,
        color: '#222222',
        fontFamily: 'Product Sans Regular',
    },
    reasonTextSelected: {
        color: '#0049F8',
        fontWeight: '500',
    },
    inputText: {
        fontSize: 16,
        color: '#222222',
        flex: 1,
        fontFamily: 'Product Sans Regular',
    },
    placeholderText: {
        color: '#999999',
    },
    contentContainer: {
        paddingBottom: verticalScale(32),
    },
    errorContainer: {
        padding: 16,
        alignItems: 'center',
    },
    errorText: {
        color: '#FF4444',
        fontSize: 14,
        textAlign: 'center',
        marginBottom: 8,
        fontFamily: 'Product Sans Regular',
    },
    retryButton: {
        backgroundColor: '#0049F8',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 8,
        marginTop: 8,
    },
    retryText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontFamily: 'Product Sans Regular',
    },
    reasonLoader: {
        padding: 20,
    },
    noDataContainer: {
        padding: 16,
        alignItems: 'center',
        justifyContent: 'center',
        height: 100,
    },
    noDataText: {
        color: '#666666',
        fontSize: 14,
        textAlign: 'center',
        fontFamily: 'Product Sans Regular',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end', // Makes modal slide up from bottom
    },
    modalContent: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingBottom: Platform.OS === 'ios' ? 40 : 20,
        maxHeight: '80%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E5E5',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '500',
        color: '#222222',
        fontFamily: 'Product Sans Regular',
    },
    closeButton: {
        padding: 8,
    },
    reasonList: {
        paddingHorizontal: 16,
    },
    reasonItem: {
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    reasonItemSelected: {
        backgroundColor: '#F0F7FF',
    },
    reasonText: {
        fontSize: 16,
        color: '#222222',
        fontFamily: 'Product Sans Regular',
    },
    reasonTextSelected: {
        color: '#0049F8',
        fontWeight: '500',
    },
    reasonInput: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        minHeight: 48,
        paddingHorizontal: 16,
        backgroundColor: '#FFFFFF',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#E5E5E5',
    },
    noDataContainer: {
        padding: 24,
        alignItems: 'center',
    },
    noDataText: {
        color: '#666666',
        fontSize: 16,
        textAlign: 'center',
        fontFamily: 'Product Sans Regular',
    },
    errorContainer: {
        padding: 24,
        alignItems: 'center',
    },
    errorText: {
        color: '#FF4444',
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 16,
        fontFamily: 'Product Sans Regular',
    },
    retryButton: {
        backgroundColor: '#0049F8',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
    },
    retryText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontFamily: 'Product Sans Regular',
    },
    reasonLoader: {
        padding: 24,
    },
});