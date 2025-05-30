import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from '../../Api/AxiosInstance';

// Improved error logging
const logError = (error) => {
  console.error('API Error:', {
    message: error.message,
    response: error.response?.data,
    status: error.response?.status,
    config: error.config
  });
};

// Async Thunk to Add Patient Drug
export const addPatientDrug = createAsyncThunk(
    'drugs/addPatientDrug',
    async (drugData, { rejectWithValue }) => {
        try {
            console.log('Starting API call with data:', JSON.stringify(drugData, null, 2));
            
            const response = await axiosInstance.post('/drugs/addPatientDrug/', drugData);
            console.log('Raw API Response:', response);

            // Handle 204 No Content response
            if (response.status === 204) {
                return {
                    status: 'Success',
                    message: 'Prescriptions added successfully',
                    data: {}
                };
            }

            // Handle response with data
            if (response.data) {
                const status = response.data.status || response.data.Status;
                if (status === 'Success' || status === 'success') {
                    return {
                        status: 'Success',
                        message: response.data.message || 'Prescriptions added successfully',
                        data: response.data.data || {}
                    };
                }
            }

            return rejectWithValue('Failed to add prescriptions');
        } catch (error) {
            console.error('API Call Error:', {
                message: error.message,
                response: error.response?.data,
                status: error.response?.status,
                config: error.config
            });
            
            return rejectWithValue(
                error.response?.data?.message || 
                error.message || 
                'Failed to add prescriptions'
            );
        }
    }
);

// Update the searchDrugs thunk
export const searchDrugs = createAsyncThunk(
    'drugs/searchDrugs',
    async (searchQuery, { rejectWithValue }) => {
        try {
            if (!searchQuery || searchQuery.length < 2) {
                return [];
            }

            // console.log('Searching for:', searchQuery);

            const response = await axiosInstance.get(
                `https://oatrx.ca/api/fetch-drug-data?search=${encodeURIComponent(searchQuery)}`
            );

            // Validate response
            if (!response?.data) {
                // console.log('No data in response');
                return [];
            }
            console.log('API Response:', response.data);
            // Get the data array
            const responseData = response.data?.data || response.data;
            // console.log('Raw API Response:', responseData);

            // Ensure we have an array
            const drugsArray = Array.isArray(responseData) ? responseData : [responseData];

            // Map and validate each drug object
            const formattedData = drugsArray
                .filter(drug => drug && typeof drug === 'object')
                .map(drug => ({
                    id: drug?.id || '',
                    group_name: drug?.group_name || '',
                    drug_category: drug?.drug_category || '',
                    dosage_form: drug?.dosage_form || '',
                    drugs: Array.isArray(drug?.drugs) ? drug.drugs : [],
                    route: drug?.route || '',
                    active_ingredients: Array.isArray(drug?.active_ingredients) 
                        ? drug.active_ingredients 
                        : [],
                    technical_reasons: Array.isArray(drug?.technical_reasons)
                        ? drug.technical_reasons.map(reason => ({
                            technical_reason: reason?.technical_reason || '',
                            sigs: Array.isArray(reason?.sigs)
                                ? reason.sigs.map(sig => ({
                                    sig: sig?.sig || ''
                                }))
                                : []
                        }))
                        : []
                }));

            // console.log('Formatted data:', formattedData);
            return formattedData;

        } catch (error) {
            console.error('Search API Error:', error);
            return rejectWithValue(error.message || 'Failed to search drugs');
        }
    }
);

// Update the fetchPatientDrugs thunk
export const fetchPatientDrugs = createAsyncThunk(
    'drugs/fetchPatientDrugs',
    async (demographicNo, { rejectWithValue }) => {
        try {
            const response = await axiosInstance.post('/drugs/fetchPatientDrugs/', {
                demographicNo: parseInt(demographicNo)
            });

            // Check if response exists and has the correct structure
            if (!response?.data) {
                return rejectWithValue('No data received from server');
            }

            // Check if response.data is an array, if not, check for data property
            const drugsData = Array.isArray(response.data) ? response.data : 
                            Array.isArray(response.data.data) ? response.data.data : [];

            // Transform the response data to match the UI structure
            const formattedData = drugsData.map(drug => ({
                Medication: drug.groupName || '',
                duration: drug.duration || '',
                quantity: drug.quantity || '',
                rxDate: drug.rxDate || '',
                daysToExpire: calculateDaysToExpire(drug.endDate),
                ltMed: drug.longTerm ? 'Yes' : 'No',
                reason: drug.reason || '',
                dosage: drug.dosage || '',
                startDate: drug.startDate || '',
                endDate: drug.endDate || '',
                // additionalNotes: drug.additionalNotes || '',
                deliveryOption: drug.deliveryOption || 'pickup'
            }));

            // console.log('Formatted patient drugs:', formattedData);
            return formattedData;

        } catch (error) {
            console.error('Fetch patient drugs error:', error);
            return rejectWithValue(error.message || 'Failed to fetch patient drugs');
        }
    }
);

// Update the calculateDaysToExpire helper function
const calculateDaysToExpire = (endDate) => {
    if (!endDate) return '0';
    const today = new Date();
    const expireDate = new Date(endDate);
    const diffTime = expireDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays.toString() : '0';
};

const initialState = {
    prescriptionData: {
        data: {
            prescriptionBatchId: null // Initialize with nested structure
        }
    },
    loading: false,
    searchResults: [],
    searchLoading: false,
    errorMessage: null,
    successMessage: null,
    patientDrugs: [],
    error: null,
    batchId: null
};

const drugSlice = createSlice({
    name: 'drugs',
    initialState,
    reducers: {
        clearMessages: (state) => {
            state.successMessage = null;
            state.errorMessage = null;
            state.prescriptionData = null;
        },
        clearSearchResults: (state) => {
            state.searchResults = [];
            state.searchLoading = false;
        },
        setSearchError: (state, action) => {
            state.errorMessage = action.payload;
            state.searchLoading = false;
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(addPatientDrug.pending, (state) => {
                state.loading = true;
                state.successMessage = null;
                state.errorMessage = null;
                state.prescriptionData = null;
                state.batchId = null;
            })
            .addCase(addPatientDrug.fulfilled, (state, action) => {
                state.loading = false;
                state.successMessage = action.payload.message;
                state.errorMessage = null;
                state.prescriptionData = action.payload;
                // console.log('Updated prescription data:', state.prescriptionData);
            })
            .addCase(addPatientDrug.rejected, (state, action) => {
                state.loading = false;
                state.successMessage = null;
                state.errorMessage = action.payload;
                state.prescriptionData = null;
                console.error('Prescription Error:', action.payload);
            })
            // Add cases for searchDrugs
            .addCase(searchDrugs.pending, (state) => {
                state.searchLoading = true;
                state.errorMessage = null;
            })
            .addCase(searchDrugs.fulfilled, (state, action) => {
                state.searchLoading = false;
                state.searchResults = action.payload || [];
                state.errorMessage = null;
            })
            .addCase(searchDrugs.rejected, (state, action) => {
                state.searchLoading = false;
                state.searchResults = [];
                state.errorMessage = action.payload;
            })
            .addCase(fetchPatientDrugs.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchPatientDrugs.fulfilled, (state, action) => {
                state.loading = false;
                state.patientDrugs = action.payload;
                state.error = null;
            })
            .addCase(fetchPatientDrugs.rejected, (state, action) => {
                state.loading = false;
                state.patientDrugs = [];
                state.error = action.payload;
            });
    },
});

export const { clearMessages, clearSearchResults, setSearchError } = drugSlice.actions;
export default drugSlice.reducer;
