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
            // Validate drug data before formatting
            if (!drugData.drugData || !Array.isArray(drugData.drugData)) {
                return rejectWithValue('Invalid drug data format');
            }

            // Validate each drug in the array
            const invalidDrugs = drugData.drugData.filter(drug => !drug.groupName);
            if (invalidDrugs.length > 0) {
                return rejectWithValue('All drugs must have a group name');
            }

            // Format the data with only required fields
            const formattedData = {
                ...drugData,
                demographicNo: parseInt(drugData.demographicNo),
                drugData: drugData.drugData.map(drug => {
                    if (!drug.groupName) {
                        throw new Error('Group name is required for all drugs');
                    }
                    
                    return {
                        groupName: drug.groupName,
                        drugForm: drug.drugForm || '',
                        dosage: drug.dosage || drug.selectedDrugDetails?.strength || '',
                        indication: drug.indication || '',
                        instructions: drug.instructions || '',
                        duration: parseInt(drug.duration) || 0,
                        quantity: parseInt(drug.quantity) || 0,
                        repeat: parseInt(drug.repeat) || 0,
                        longTerm: drug.longTerm === 'Yes' ? true : false,
                        startDate: drug.startDate || new Date().toISOString().split('T')[0]
                    };
                })
            };

            // Additional validation before sending
            if (!formattedData.drugData.every(drug => drug.groupName)) {
                return rejectWithValue('Missing group name for one or more drugs');
            }

            console.log('Sending formatted drug data:', formattedData);

            const response = await axiosInstance.post('/drugs/addPatientDrug/', formattedData);
            
            console.log('API Response:', response.data);

            if (response.data && response.data.status === "Success") {
                return {
                    status: response.data.status,
                    message: response.data.message,
                    drugData: formattedData.drugData
                };
            }

            return rejectWithValue(response.data?.message || 'Invalid response format');
        } catch (error) {
            logError(error);
            return rejectWithValue(
                error.response?.data?.message || 
                error.message || 
                'Failed to add prescription'
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
                console.log('No data in response');
                return [];
            }

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

const initialState = {
  prescriptionData: null,
  loading: false,
  searchResults: [],
  searchLoading: false,
  errorMessage: null,
  successMessage: null,
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
            })
            .addCase(addPatientDrug.fulfilled, (state, action) => {
                state.loading = false;
                state.successMessage = action.payload.message;
                state.errorMessage = null;
                state.prescriptionData = action.payload;
              console.log('action.payload',  state.prescriptionData)
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
            });
    },
});

export const { clearMessages, clearSearchResults, setSearchError } = drugSlice.actions;
export default drugSlice.reducer;
