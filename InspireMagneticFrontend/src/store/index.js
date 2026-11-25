import { configureStore } from '@reduxjs/toolkit';
import userFormReducer from './userFormSlice';

const store = configureStore({
  reducer: {
    userForm: userFormReducer,
  },
});

export default store; 