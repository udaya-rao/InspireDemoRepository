/* eslint-disable react-refresh/only-export-components */
// Separate file just for the Toast context so the provider file
// can export only components (for React Fast Refresh).

import { createContext } from "react";

const ToastContext = createContext(null);

export default ToastContext;

