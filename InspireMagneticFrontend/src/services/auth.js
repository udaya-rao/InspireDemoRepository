// src/services/auth.js
import axios from "axios";
import { auth } from "../utils/url";
import {
  buildAuthHeaders,
  buildAuthHeadersWithoutAccessToken,
} from "../utils/authHeaders";


// -------------------------------
// LOGIN
// -------------------------------
export const loginApi = async (loginID, password) => {
  try {
    const response = await axios.post(
      `${auth.login}`,
      { loginID, password },
      {
        // No Authorization header for login
        headers: buildAuthHeadersWithoutAccessToken(),
      }
    );
    return response;
  } catch (error) {
    console.error("loginApi error:", error);
    throw error;
  }
};

// -------------------------------
// OTP VERIFY / RESEND
// -------------------------------
export const verifyOrResendOtpApi = async ({
  loginID,
  otpNumber,
  paramType, // "ValidateOTP" | "ResendOTP"
}) => {
  try {
    const response = await axios.post(
      `${auth.verify_resend_otp}`,
      {
        loginID,
        otpNumber,
        paramType,
      },
      {
        // Auto token handled inside buildAuthHeaders()
        headers: buildAuthHeaders(),
      }
    );
    return response;
  } catch (error) {
    console.error("verifyOrResendOtpApi error:", error);
    throw error;
  }
};

// -------------------------------
// CHANGE PASSWORD (NO PARAM TOKEN)
// -------------------------------
export const changePasswordApi = async ({
  employeeID,
  oldPassword,
  newPassword,
  confirmPassword,
}) => {

  try {
    const response = await axios.post(
      `${auth.change_password}`,
      {
        employeeID,
        oldPassword,
        newPassword,
        confirmPassword,
      },
      {
        // Auto token picked from buildAuthHeaders()
        headers: buildAuthHeaders(),
      }
    );
    return response;
  } catch (error) {
    console.error("changePasswordApi error:", error);
    throw error;
  }
};

// -------------------------------
// FORGOT PASSWORD
// -------------------------------
export const forgotPasswordApi = async (loginID) => {
  try {
    return await axios.post(
      `${auth.forgot_password}`,
      { loginID },
      {
        headers: buildAuthHeadersWithoutAccessToken(),
        timeout: 15000,
      }
    );
  } catch (error) {
    console.error("forgotPasswordApi error:", error);
    throw error;
  }
};

// -------------------------------
// RESET PASSWORD
// -------------------------------
export const resetPasswordApi = async ({
  loginID,
  newPassword,
  confirmPassword,
}) => {
  
  try {
    return await axios.post(
      `${auth.reset_password}`,
      {
        loginID,
        newPassword,
        confirmPassword,
      },
      {
        // Reset password usually does NOT require Bearer token
        headers: buildAuthHeadersWithoutAccessToken(),
      }
    );
  } catch (error) {
    console.error("resetPasswordApi error:", error);
    throw error;
  }
};
