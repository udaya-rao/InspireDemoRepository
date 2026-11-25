export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const MOBILE_REGEX = /^\d{10}$/;
export const INDIAN_MOBILE_REGEX = /^[6-9]\d{9}$/;
// Standard password: at least 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char
export const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;
// Strip spaces and hyphens from phone/mobile numbers
export const PHONE_STRIP_REGEX = /[\s-]/g;

// Quantity input regex: Up to 8 digits, no decimals (used for NOS)
export const INTEGER_QTY_REGEX = /^\d{0,8}$/;
// Quantity input regex: Up to 8 digits, optional up to 4 decimal places
export const DECIMAL_QTY_REGEX = /^\d{0,8}(\.\d{0,4})?$/;
