import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from '../../Api/AxiosInstance';
import AsyncStorage from '@react-native-async-storage/async-storage';

const initialState = {
  data: null,
  error: null,
  loading:false
};


export const loginUser = createAsyncThunk(
  'auth/loginUser',
  async ({ requestedData }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post(
        '/authentication/loginClinic/',
        requestedData
      );
     await AsyncStorage.setItem("auth_tokens",response.data.access_token)
   const myAcesssToken=  await AsyncStorage.getItem("auth_tokens")
console.log('vvvv')
      return response.data; 
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Login failed');
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      state.data = null;
      state.loading = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.data = null
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload; 
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { logout } = authSlice.actions;
export default authSlice.reducer;
