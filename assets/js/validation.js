/**
 * Centralized Form Validation Module
 * Provides consistent validation across all forms in the UBA application
 */

// Core validation functions
function validateRequired(value) {
    if (typeof value === 'string') {
        return value.trim().length > 0;
    }
    return value !== null && value !== undefined && value !== '';
}

function validateEmail(value) {
    if (!value) return true; // Allow empty if not required
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value.trim());
}

function validateNumber(value, options = {}) {
    if (!value && !options.required) return true;
    
    const num = parseFloat(value);
    if (isNaN(num)) return false;
    
    if (options.min !== undefined && num < options.min) return false;
    if (options.max !== undefined && num > options.max) return false;
    if (options.integer && !Number.isInteger(num)) return false;
    
    return true;
}

function validateDate(value) {
    if (!value) return true; // Allow empty if not required
    const date = new Date(value);
    return !isNaN(date.getTime());
}

function validateUrl(value) {
    if (!value) return true; // Allow empty if not required
    try {
        new URL(value);
        return true;
    } catch {
        return false;
    }
}

function validatePhone(value) {
    if (!value) return true; // Allow empty if not required
    // Basic phone validation - allows various formats
    const phoneRegex = /^[\+]?[0-9\s\-\(\)]{7,}$/;
    return phoneRegex.test(value.trim());
}

// Generic form validation
function validateForm(schema, formData) {
    const errors = {};
    let isValid = true;
    
    for (const field in schema) {
        if (schema.hasOwnProperty(field)) {
            const rules = schema[field];
            const value = formData[field];
            const fieldErrors = [];
            
            // Required validation
            if (rules.required && !validateRequired(value)) {
                fieldErrors.push('This field is required');
            }
            
            // Type-specific validation (only if value exists)
            if (value && value.toString().trim()) {
                switch (rules.type) {
                    case 'email':
                        if (!validateEmail(value)) {
                            fieldErrors.push('Please enter a valid email address');
                        }
                        break;
                    case 'number':
                        if (!validateNumber(value, rules.options || {})) {
                            const opts = rules.options || {};
                            if (opts.min !== undefined && opts.max !== undefined) {
                                fieldErrors.push(`Must be a number between ${opts.min} and ${opts.max}`);
                            } else if (opts.min !== undefined) {
                                fieldErrors.push(`Must be at least ${opts.min}`);
                            } else if (opts.max !== undefined) {
                                fieldErrors.push(`Must be no more than ${opts.max}`);
                            } else {
                                fieldErrors.push('Must be a valid number');
                            }
                        }
                        break;
                    case 'date':
                        if (!validateDate(value)) {
                            fieldErrors.push('Please enter a valid date');
                        }
                        break;
                    case 'url':
                        if (!validateUrl(value)) {
                            fieldErrors.push('Please enter a valid URL');
                        }
                        break;
                    case 'phone':
                        if (!validatePhone(value)) {
                            fieldErrors.push('Please enter a valid phone number');
                        }
                        break;
                }
            }
            
            // Custom validation function
            if (rules.validator && value) {
                const customResult = rules.validator(value);
                if (customResult !== true) {
                    fieldErrors.push(customResult || 'Invalid value');
                }
            }
            
            if (fieldErrors.length > 0) {
                errors[field] = fieldErrors;
                isValid = false;
            }
        }
    }
    
    return { isValid: isValid, errors: errors };
}

// UI helper functions
function showFieldError(fieldId, message) {
    clearFieldError(fieldId);
    
    const field = document.getElementById(fieldId);
    if (!field) return;
    
    // Add error class to field
    field.classList.add('uba-input-error');
    
    // Create error message element
    const errorEl = document.createElement('div');
    errorEl.className = 'uba-field-error';
    errorEl.textContent = message;
    errorEl.id = `${fieldId}-error`;
    
    // Insert after the field
    field.parentNode.insertBefore(errorEl, field.nextSibling);
}

function clearFieldError(fieldId) {
    const field = document.getElementById(fieldId);
    if (field) {
        field.classList.remove('uba-input-error');
    }
    
    const errorEl = document.getElementById(`${fieldId}-error`);
    if (errorEl) {
        errorEl.remove();
    }
}

function clearAllErrors(formId) {
    const form = document.getElementById(formId);
    if (!form) return;
    
    // Remove all error classes and error messages
    const errorFields = form.querySelectorAll('.uba-input-error');
    errorFields.forEach(field => field.classList.remove('uba-input-error'));
    
    const errorMessages = form.querySelectorAll('.uba-field-error');
    errorMessages.forEach(msg => msg.remove());
}

function showFormErrors(errors) {
    for (const field in errors) {
        if (errors.hasOwnProperty(field)) {
            const fieldErrors = errors[field];
            if (fieldErrors.length > 0) {
                showFieldError(field, fieldErrors[0]); // Show first error only
            }
        }
    }
}

function validateAndShowErrors(schema, formData, formId) {
    clearAllErrors(formId);
    const result = validateForm(schema, formData);
    
    if (!result.isValid) {
        showFormErrors(result.errors);
    }
    
    return result.isValid;
}

// Export functions for global access
window.UBAValidation = {
    validateRequired,
    validateEmail,
    validateNumber,
    validateDate,
    validateUrl,
    validatePhone,
    validateForm,
    showFieldError,
    clearFieldError,
    clearAllErrors,
    showFormErrors,
    validateAndShowErrors
};