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

/**
 * Comprehensive client validation with business rules
 */
function validateClient(clientData, existingClients = [], editingId = null) {
    const errors = {};
    const warnings = [];
    
    // Required field validation
    if (!clientData.name || clientData.name.trim().length === 0) {
        errors.name = 'Client name is required';
    } else if (clientData.name.trim().length < 2) {
        errors.name = 'Client name must be at least 2 characters';
    } else if (clientData.name.trim().length > 100) {
        errors.name = 'Client name must be less than 100 characters';
    }
    
    // Email validation (optional but must be valid if provided)
    if (clientData.email && clientData.email.trim().length > 0) {
        if (!validateEmail(clientData.email.trim())) {
            errors.email = 'Invalid email format';
        }
    }
    
    // Phone validation (optional but must be valid if provided)
    if (clientData.phone && clientData.phone.trim().length > 0) {
        if (!validatePhone(clientData.phone.trim())) {
            errors.phone = 'Invalid phone number format';
        }
    }
    
    // Website URL validation (optional)
    if (clientData.website && clientData.website.trim().length > 0) {
        if (!validateURL(clientData.website.trim())) {
            errors.website = 'Invalid website URL format';
        }
    }
    
    // Company validation (optional but reasonable limits)
    if (clientData.company && clientData.company.trim().length > 200) {
        errors.company = 'Company name must be less than 200 characters';
    }
    
    // Notes validation (optional but reasonable limits)
    if (clientData.notes && clientData.notes.trim().length > 1000) {
        errors.notes = 'Notes must be less than 1000 characters';
    }
    
    // Duplicate detection
    const duplicates = findClientDuplicates(clientData, existingClients, editingId);
    if (duplicates.length > 0) {
        errors.duplicate = `Similar client found: ${duplicates[0].name} (${duplicates[0].email || duplicates[0].phone || 'no contact'})`;
    }
    
    // Business logic warnings
    if (clientData.email && existingClients.some(c => c.id !== editingId && c.email === clientData.email.trim())) {
        warnings.push('Email address is already used by another client');
    }
    
    if (clientData.phone && existingClients.some(c => c.id !== editingId && c.phone === clientData.phone.trim())) {
        warnings.push('Phone number is already used by another client');
    }
    
    return {
        isValid: Object.keys(errors).length === 0,
        errors: errors,
        warnings: warnings
    };
}

/**
 * Find potential duplicate clients
 */
function findClientDuplicates(clientData, existingClients, excludeId = null) {
    const duplicates = [];
    const clientName = clientData.name ? clientData.name.trim().toLowerCase() : '';
    const clientEmail = clientData.email ? clientData.email.trim().toLowerCase() : '';
    const clientPhone = clientData.phone ? cleanPhoneNumber(clientData.phone) : '';
    
    existingClients.forEach(existing => {
        if (existing.id === excludeId) return;
        
        const existingName = existing.name ? existing.name.trim().toLowerCase() : '';
        const existingEmail = existing.email ? existing.email.trim().toLowerCase() : '';
        const existingPhone = existing.phone ? cleanPhoneNumber(existing.phone) : '';
        
        // Exact name match
        if (clientName && existingName === clientName) {
            duplicates.push({ ...existing, matchType: 'name' });
            return;
        }
        
        // Exact email match
        if (clientEmail && existingEmail === clientEmail) {
            duplicates.push({ ...existing, matchType: 'email' });
            return;
        }
        
        // Exact phone match
        if (clientPhone && existingPhone === clientPhone) {
            duplicates.push({ ...existing, matchType: 'phone' });
            return;
        }
        
        // Fuzzy name match (similar names)
        if (clientName && existingName && calculateStringSimilarity(clientName, existingName) > 0.85) {
            duplicates.push({ ...existing, matchType: 'similar_name' });
        }
    });
    
    return duplicates;
}

/**
 * Clean phone number for comparison
 */
function cleanPhoneNumber(phone) {
    return phone.replace(/[^\d]/g, '');
}

/**
 * Calculate string similarity using Levenshtein distance
 */
function calculateStringSimilarity(str1, str2) {
    const len1 = str1.length;
    const len2 = str2.length;
    const matrix = Array(len2 + 1).fill(null).map(() => Array(len1 + 1).fill(null));
    
    for (let i = 0; i <= len1; i++) matrix[0][i] = i;
    for (let j = 0; j <= len2; j++) matrix[j][0] = j;
    
    for (let j = 1; j <= len2; j++) {
        for (let i = 1; i <= len1; i++) {
            const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
            matrix[j][i] = Math.min(
                matrix[j][i - 1] + 1,
                matrix[j - 1][i] + 1,
                matrix[j - 1][i - 1] + indicator
            );
        }
    }
    
    const distance = matrix[len2][len1];
    return 1 - distance / Math.max(len1, len2);
}

/**
 * Validate URL format
 */
function validateURL(url) {
    try {
        const urlObj = new URL(url.startsWith('http') ? url : 'https://' + url);
        return ['http:', 'https:'].includes(urlObj.protocol);
    } catch {
        return false;
    }
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
    validateClient,
    findClientDuplicates,
    validateURL,
    showFieldError,
    clearFieldError,
    clearAllErrors,
    showFormErrors,
    validateAndShowErrors
};