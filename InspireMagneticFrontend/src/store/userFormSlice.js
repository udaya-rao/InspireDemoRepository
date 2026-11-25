import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  name: '',
  email: '',
  password: '',
  bio: '',
  role: '',
  interests: [],
  notifications: false,
  agreement: false,
  gender: 'male',
  skills: [],
};

const userFormSlice = createSlice({
  name: 'userForm',
  initialState,
  reducers: {
    setField: (state, action) => {
      const { field, value } = action.payload;
      state[field] = value;
    },
    resetForm: () => initialState,
  },
});

export const { setField, resetForm } = userFormSlice.actions;
export default userFormSlice.reducer; 