// =====================================================
// PRODUCTION-READY NOTIFICATION SYSTEM
// =====================================================
// Using Sonner toast for all user notifications
// NO console.log in production code!
// =====================================================

import { toast } from 'sonner@2.0.3';

// =====================================================
// SUCCESS NOTIFICATIONS
// =====================================================

export const notifySuccess = (message: string, description?: string) => {
  toast.success(message, {
    description,
    duration: 4000,
  });
};

// =====================================================
// ERROR NOTIFICATIONS
// =====================================================

export const notifyError = (message: string, error?: any) => {
  // Extract meaningful error message
  let errorMessage = message;
  
  if (error) {
    if (typeof error === 'string') {
      errorMessage = `${message}: ${error}`;
    } else if (error?.message) {
      errorMessage = `${message}: ${error.message}`;
    } else if (error?.error?.message) {
      errorMessage = `${message}: ${error.error.message}`;
    }
  }
  
  toast.error('Error', {
    description: errorMessage,
    duration: 6000,
  });
};

// =====================================================
// WARNING NOTIFICATIONS
// =====================================================

export const notifyWarning = (message: string, description?: string) => {
  toast.warning(message, {
    description,
    duration: 5000,
  });
};

// =====================================================
// INFO NOTIFICATIONS
// =====================================================

export const notifyInfo = (message: string, description?: string) => {
  toast.info(message, {
    description,
    duration: 4000,
  });
};

// =====================================================
// LOADING NOTIFICATIONS
// =====================================================

export const notifyLoading = (message: string) => {
  return toast.loading(message);
};

export const dismissNotification = (toastId: string | number) => {
  toast.dismiss(toastId);
};

// =====================================================
// PROMISE NOTIFICATIONS (Auto-loading)
// =====================================================

export const notifyPromise = async <T,>(
  promise: Promise<T>,
  messages: {
    loading: string;
    success: string;
    error: string;
  }
): Promise<T> => {
  return toast.promise(promise, {
    loading: messages.loading,
    success: messages.success,
    error: messages.error,
  });
};

// =====================================================
// SPECIFIC USE CASE NOTIFICATIONS
// =====================================================

export const notifications = {
  // Authentication
  auth: {
    loginSuccess: (userName: string) => 
      notifySuccess('Login Successful', `Welcome back, ${userName}!`),
    loginError: (error?: any) => 
      notifyError('Login failed', error),
    logoutSuccess: () => 
      notifySuccess('Logged out successfully'),
    signupSuccess: () => 
      notifySuccess('Account created', 'Please login with your credentials'),
    signupError: (error?: any) => 
      notifyError('Signup failed', error),
  },
  
  // Reservations
  reservation: {
    created: (pickupCode: string) => 
      notifySuccess('Reservation Confirmed!', `Your pickup code is: ${pickupCode}`),
    createError: (error?: any) => 
      notifyError('Failed to create reservation', error),
    cancelled: () => 
      notifySuccess('Reservation cancelled'),
    cancelError: (error?: any) => 
      notifyError('Failed to cancel reservation', error),
    verified: () => 
      notifySuccess('Pickup code verified', 'You can now proceed to fuel dispensing'),
    verifyError: (error?: any) => 
      notifyError('Invalid pickup code', error),
    completed: () => 
      notifySuccess('Fuel dispensed successfully!'),
    expired: () => 
      notifyWarning('Reservation expired', 'This reservation has passed its time slot'),
  },
  
  // Fuel Delivery
  delivery: {
    requested: () => 
      notifySuccess('Delivery request sent', 'Waiting for admin approval'),
    requestError: (error?: any) => 
      notifyError('Failed to request delivery', error),
    approved: () => 
      notifySuccess('Delivery approved', 'You can now receive the fuel'),
    rejected: (reason?: string) => 
      notifyWarning('Delivery rejected', reason),
    delivered: () => 
      notifySuccess('Fuel delivery completed', 'Inventory has been updated'),
    deliveryError: (error?: any) => 
      notifyError('Failed to update delivery', error),
  },
  
  // Station Management
  station: {
    created: (stationName: string) => 
      notifySuccess('Station created', `${stationName} has been registered`),
    createError: (error?: any) => 
      notifyError('Failed to create station', error),
    updated: () => 
      notifySuccess('Station updated successfully'),
    updateError: (error?: any) => 
      notifyError('Failed to update station', error),
    verified: () => 
      notifySuccess('Station verified', 'Station is now active'),
    timeSlotsGenerated: (count: number) => 
      notifySuccess('Time slots generated', `${count} slots created for the next 14 days`),
  },
  
  // Operator Management
  operator: {
    added: (operatorName: string) => 
      notifySuccess('Operator added', `${operatorName} can now login`),
    addError: (error?: any) => 
      notifyError('Failed to add operator', error),
    removed: () => 
      notifySuccess('Operator removed'),
    blocked: () => 
      notifyWarning('Operator blocked', 'This operator can no longer access the system'),
    unblocked: () => 
      notifySuccess('Operator unblocked'),
  },
  
  // Fuel Types
  fuelType: {
    created: () => 
      notifySuccess('Fuel type added'),
    updated: () => 
      notifySuccess('Fuel type updated'),
    updateError: (error?: any) => 
      notifyError('Failed to update fuel type', error),
  },
  
  // Inventory
  inventory: {
    lowStock: (fuelType: string, currentStock: number) => 
      notifyWarning('Low Fuel Stock', `${fuelType}: ${currentStock}L remaining`),
    outOfStock: (fuelType: string) => 
      notifyError('Out of Stock', `${fuelType} is not available`),
    updated: () => 
      notifySuccess('Inventory updated'),
  },
  
  // Payment
  payment: {
    processing: () => 
      notifyLoading('Processing payment...'),
    success: () => 
      notifySuccess('Payment successful'),
    failed: (error?: any) => 
      notifyError('Payment failed', error),
  },
  
  // General
  general: {
    saveSuccess: () => 
      notifySuccess('Changes saved'),
    saveError: (error?: any) => 
      notifyError('Failed to save changes', error),
    deleteSuccess: () => 
      notifySuccess('Deleted successfully'),
    deleteError: (error?: any) => 
      notifyError('Failed to delete', error),
    loadError: (error?: any) => 
      notifyError('Failed to load data', error),
    networkError: () => 
      notifyError('Network error', 'Please check your internet connection'),
    permissionDenied: () => 
      notifyError('Permission denied', 'You do not have access to this resource'),
  },
};

// =====================================================
// ERROR LOGGER (Development only)
// =====================================================

export const logError = (context: string, error: any) => {
  // Only log in development
  if (import.meta.env.DEV) {
    console.error(`[${context}]`, error);
  }
  
  // In production, you would send to error tracking service (e.g., Sentry)
  // Example: Sentry.captureException(error, { tags: { context } });
};
