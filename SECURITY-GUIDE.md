# MHM UBA Security Best Practices Guide

**Document Version:** 1.0  
**Last Updated:** November 22, 2025  
**Status:** ⚠️ Critical Security Issues Present

---

## Table of Contents
1. [Critical Vulnerabilities](#1-critical-vulnerabilities)
2. [Security Hardening Checklist](#2-security-hardening-checklist)
3. [Authentication Security](#3-authentication-security)
4. [Input Validation & Sanitization](#4-input-validation--sanitization)
5. [XSS Prevention](#5-xss-prevention)
6. [CSRF Protection](#6-csrf-protection)
7. [Security Headers](#7-security-headers)
8. [Data Encryption](#8-data-encryption)
9. [API Security](#9-api-security)
10. [Logging & Monitoring](#10-logging--monitoring)

---

## 1. CRITICAL VULNERABILITIES

### 🔴 SEVERITY: CRITICAL - Immediate Action Required

#### 1.1 No Real Authentication
**Current State:** Guest mode only, no real user authentication  
**Risk:** Anyone can access all data  
**Impact:** Complete system compromise  

**Fix Required:**
```javascript
// CURRENT (INSECURE):
const session = {
  userId: 'user-guest',
  isAuthenticated: false  // ❌ No real auth
};

// REQUIRED (SECURE):
// Implement proper JWT-based authentication
// See section 3 for details
```

---

#### 1.2 Plain Text Password Storage
**Current State:** Passwords stored in localStorage without hashing  
**Risk:** CRITICAL - Password exposure  
**Impact:** Account takeover, credential theft  

**Location:** `assets/js/data-layer.js`

**Current Code:**
```javascript
// ❌ INSECURE - DO NOT USE
const user = {
  email: 'user@example.com',
  password: 'plaintextpassword123'  // Stored in plain text!
};
```

**Required Fix:**
```javascript
// ✅ SECURE - Use bcrypt or argon2
import bcrypt from 'bcryptjs';

// On registration:
const hashedPassword = await bcrypt.hash(password, 10);
const user = {
  email: 'user@example.com',
  passwordHash: hashedPassword  // Never store plain text
};

// On login:
const isValid = await bcrypt.compare(inputPassword, user.passwordHash);
```

---

#### 1.3 XSS Vulnerabilities (270+ instances)
**Current State:** Widespread use of innerHTML without sanitization  
**Risk:** CRITICAL - Code injection  
**Impact:** Session hijacking, data theft, malware  

**Vulnerable Patterns Found:**
```javascript
// ❌ VULNERABLE - Found 270+ times in codebase
element.innerHTML = userInput;
container.innerHTML = `<div>${userData}</div>`;
document.querySelector('.msg').innerHTML = messageText;
```

**Required Fixes:**

**Option 1: Use textContent (preferred for plain text)**
```javascript
// ✅ SAFE - Use textContent for plain text
element.textContent = userInput;
```

**Option 2: Use DOMPurify for HTML**
```javascript
// ✅ SAFE - Sanitize HTML before inserting
import DOMPurify from 'dompurify';

element.innerHTML = DOMPurify.sanitize(userInput);
```

**Option 3: Use createElement**
```javascript
// ✅ SAFE - Build DOM programmatically
const div = document.createElement('div');
div.textContent = userInput;
container.appendChild(div);
```

---

#### 1.4 No Security Headers
**Current State:** No security headers in HTML files  
**Risk:** HIGH - Multiple attack vectors  
**Impact:** Clickjacking, XSS, data leakage  

**Required Action:**
Add meta tags to all HTML files OR configure server headers.

**Add to `<head>` section:**
```html
<!-- Content Security Policy -->
<meta http-equiv="Content-Security-Policy" 
      content="default-src 'self'; 
               script-src 'self' 'unsafe-inline' cdn.jsdelivr.net; 
               style-src 'self' 'unsafe-inline'; 
               img-src 'self' data: https:; 
               font-src 'self' data:; 
               connect-src 'self' https://*.supabase.co;">

<!-- Prevent clickjacking -->
<meta http-equiv="X-Frame-Options" content="DENY">

<!-- Prevent MIME sniffing -->
<meta http-equiv="X-Content-Type-Options" content="nosniff">

<!-- XSS Protection -->
<meta http-equiv="X-XSS-Protection" content="1; mode=block">

<!-- Referrer Policy -->
<meta name="referrer" content="strict-origin-when-cross-origin">
```

**Server-side headers (Node.js/Express):**
```javascript
const helmet = require('helmet');
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "cdn.jsdelivr.net"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://*.supabase.co"]
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));
```

---

#### 1.5 No Input Validation
**Current State:** No validation on user inputs  
**Risk:** HIGH - Data corruption, injection attacks  
**Impact:** Database corruption, XSS, SQL injection  

**Required Actions:**
Implement validation for all user inputs.

**Example - Client Form Validation:**
```javascript
// ❌ CURRENT (NO VALIDATION):
function saveClient(data) {
  localStorage.setItem('client', JSON.stringify(data));
}

// ✅ REQUIRED (WITH VALIDATION):
function saveClient(data) {
  // Validate required fields
  if (!data.name || typeof data.name !== 'string') {
    throw new Error('Invalid client name');
  }
  
  // Sanitize and validate email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!data.email || !emailRegex.test(data.email)) {
    throw new Error('Invalid email address');
  }
  
  // Sanitize strings
  const sanitized = {
    name: DOMPurify.sanitize(data.name.trim()),
    email: data.email.trim().toLowerCase(),
    phone: data.phone ? data.phone.replace(/[^0-9+\-\s()]/g, '') : '',
    // ... other fields
  };
  
  localStorage.setItem('client', JSON.stringify(sanitized));
}
```

---

#### 1.6 No HTTPS Enforcement
**Current State:** No HTTPS requirement  
**Risk:** HIGH - Man-in-the-middle attacks  
**Impact:** Data interception, session hijacking  

**Required Actions:**
```javascript
// Add to main app.js
if (window.location.protocol !== 'https:' && 
    window.location.hostname !== 'localhost') {
  window.location.href = 'https:' + window.location.href.substring(window.location.protocol.length);
}
```

**Server configuration (nginx):**
```nginx
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;
    
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    
    # Your app configuration
}
```

---

## 2. SECURITY HARDENING CHECKLIST

### Before Production Deployment

- [ ] **Authentication & Authorization**
  - [ ] Implement proper user authentication
  - [ ] Add password hashing (bcrypt/argon2)
  - [ ] Implement JWT or session tokens
  - [ ] Add role-based access control (RBAC)
  - [ ] Implement MFA/2FA
  - [ ] Add account lockout after failed attempts
  - [ ] Implement password reset flow
  - [ ] Add email verification

- [ ] **Input Validation**
  - [ ] Validate all user inputs (client + server)
  - [ ] Sanitize all HTML inputs
  - [ ] Implement file upload validation
  - [ ] Add rate limiting
  - [ ] Validate API requests

- [ ] **XSS Prevention**
  - [ ] Replace all innerHTML with textContent or sanitized HTML
  - [ ] Implement Content Security Policy
  - [ ] Use DOMPurify for HTML sanitization
  - [ ] Escape user data in templates

- [ ] **Security Headers**
  - [ ] Add Content-Security-Policy
  - [ ] Add X-Frame-Options
  - [ ] Add X-Content-Type-Options
  - [ ] Add Strict-Transport-Security
  - [ ] Add X-XSS-Protection
  - [ ] Add Referrer-Policy

- [ ] **HTTPS & Encryption**
  - [ ] Enforce HTTPS everywhere
  - [ ] Use strong TLS configuration
  - [ ] Encrypt sensitive data at rest
  - [ ] Use secure cookies (httpOnly, secure, sameSite)

- [ ] **API Security**
  - [ ] Implement authentication for all endpoints
  - [ ] Add rate limiting
  - [ ] Implement CORS properly
  - [ ] Add request signing
  - [ ] Validate all API inputs

- [ ] **Database Security**
  - [ ] Implement Row Level Security (RLS)
  - [ ] Use parameterized queries
  - [ ] Encrypt sensitive columns
  - [ ] Limit database user permissions
  - [ ] Enable audit logging

- [ ] **Error Handling**
  - [ ] Never expose stack traces to users
  - [ ] Log errors securely
  - [ ] Return generic error messages
  - [ ] Implement error monitoring

- [ ] **Dependencies**
  - [ ] Audit npm packages for vulnerabilities
  - [ ] Keep dependencies up to date
  - [ ] Remove unused dependencies
  - [ ] Use npm audit regularly

- [ ] **Monitoring & Logging**
  - [ ] Implement security event logging
  - [ ] Set up intrusion detection
  - [ ] Monitor for suspicious activity
  - [ ] Set up alerting for security events

---

## 3. AUTHENTICATION SECURITY

### 3.1 Secure Registration Flow

```javascript
// Registration with proper security
async function register(userData) {
  // 1. Validate input
  if (!validateEmail(userData.email)) {
    throw new Error('Invalid email');
  }
  
  if (!validatePassword(userData.password)) {
    throw new Error('Password must be at least 12 characters with uppercase, lowercase, number, and special character');
  }
  
  // 2. Check if email already exists
  const existingUser = await checkUserExists(userData.email);
  if (existingUser) {
    throw new Error('Email already registered');
  }
  
  // 3. Hash password
  const passwordHash = await bcrypt.hash(userData.password, 12);
  
  // 4. Generate verification token
  const verificationToken = crypto.randomBytes(32).toString('hex');
  
  // 5. Create user
  const user = {
    id: generateId('user'),
    email: userData.email.toLowerCase().trim(),
    passwordHash: passwordHash,
    emailVerified: false,
    verificationToken: verificationToken,
    createdAt: new Date().toISOString(),
    // Never store plain password!
  };
  
  // 6. Save user
  await saveUser(user);
  
  // 7. Send verification email
  await sendVerificationEmail(user.email, verificationToken);
  
  return { success: true, message: 'Please check your email to verify your account' };
}
```

### 3.2 Secure Login Flow

```javascript
async function login(email, password) {
  // 1. Rate limiting check
  const attempts = await getLoginAttempts(email);
  if (attempts >= 5) {
    throw new Error('Account temporarily locked. Try again in 15 minutes.');
  }
  
  // 2. Fetch user
  const user = await getUserByEmail(email.toLowerCase().trim());
  if (!user) {
    await incrementLoginAttempts(email);
    throw new Error('Invalid credentials'); // Generic error
  }
  
  // 3. Verify password
  const isValid = await bcrypt.compare(password, user.passwordHash);
  if (!isValid) {
    await incrementLoginAttempts(email);
    throw new Error('Invalid credentials'); // Generic error
  }
  
  // 4. Check email verification
  if (!user.emailVerified) {
    throw new Error('Please verify your email first');
  }
  
  // 5. Generate JWT token
  const token = jwt.sign(
    { userId: user.id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
  
  // 6. Clear login attempts
  await clearLoginAttempts(email);
  
  // 7. Log successful login
  await logSecurityEvent('login_success', user.id);
  
  return {
    token: token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name
      // Don't return passwordHash!
    }
  };
}
```

### 3.3 Password Requirements

```javascript
function validatePassword(password) {
  // Minimum 12 characters
  if (password.length < 12) {
    return false;
  }
  
  // Must contain uppercase
  if (!/[A-Z]/.test(password)) {
    return false;
  }
  
  // Must contain lowercase
  if (!/[a-z]/.test(password)) {
    return false;
  }
  
  // Must contain number
  if (!/[0-9]/.test(password)) {
    return false;
  }
  
  // Must contain special character
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    return false;
  }
  
  // Check against common passwords
  const commonPasswords = ['password123', 'qwerty123', ...]; // Load from file
  if (commonPasswords.includes(password.toLowerCase())) {
    return false;
  }
  
  return true;
}
```

---

## 4. INPUT VALIDATION & SANITIZATION

### 4.1 Client-side Validation

```javascript
// Validation utilities
const validators = {
  email(value) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(value);
  },
  
  phone(value) {
    const regex = /^[\d\s+\-()]+$/;
    return regex.test(value);
  },
  
  alphanumeric(value) {
    const regex = /^[a-zA-Z0-9\s]+$/;
    return regex.test(value);
  },
  
  url(value) {
    try {
      new URL(value);
      return true;
    } catch {
      return false;
    }
  },
  
  currency(value) {
    const regex = /^\d+(\.\d{2})?$/;
    return regex.test(value);
  }
};

// Sanitization utilities
const sanitizers = {
  html(value) {
    return DOMPurify.sanitize(value);
  },
  
  text(value) {
    return String(value).trim();
  },
  
  number(value) {
    const num = parseFloat(value);
    return isNaN(num) ? 0 : num;
  },
  
  email(value) {
    return String(value).toLowerCase().trim();
  }
};
```

### 4.2 Form Validation Example

```javascript
function validateClientForm(formData) {
  const errors = {};
  
  // Name validation
  if (!formData.name || formData.name.trim().length === 0) {
    errors.name = 'Name is required';
  } else if (formData.name.length > 100) {
    errors.name = 'Name must be less than 100 characters';
  }
  
  // Email validation
  if (!formData.email) {
    errors.email = 'Email is required';
  } else if (!validators.email(formData.email)) {
    errors.email = 'Invalid email format';
  }
  
  // Phone validation (optional)
  if (formData.phone && !validators.phone(formData.phone)) {
    errors.phone = 'Invalid phone format';
  }
  
  // Website validation (optional)
  if (formData.website && !validators.url(formData.website)) {
    errors.website = 'Invalid URL format';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors: errors
  };
}

// Usage
function handleClientSubmit(event) {
  event.preventDefault();
  
  const formData = new FormData(event.target);
  const data = Object.fromEntries(formData);
  
  // Validate
  const validation = validateClientForm(data);
  if (!validation.isValid) {
    displayErrors(validation.errors);
    return;
  }
  
  // Sanitize
  const sanitized = {
    name: sanitizers.text(data.name),
    email: sanitizers.email(data.email),
    phone: data.phone ? sanitizers.text(data.phone) : '',
    website: data.website ? sanitizers.text(data.website) : '',
    notes: sanitizers.html(data.notes)
  };
  
  // Save
  saveClient(sanitized);
}
```

---

## 5. XSS PREVENTION

### 5.1 Safe Rendering Patterns

```javascript
// ❌ NEVER DO THIS:
element.innerHTML = userInput;
element.innerHTML = `<div>${userInput}</div>`;

// ✅ DO THIS INSTEAD:

// For plain text:
element.textContent = userInput;

// For HTML content:
import DOMPurify from 'dompurify';
element.innerHTML = DOMPurify.sanitize(userInput);

// For building DOM:
const div = document.createElement('div');
div.textContent = userInput;
element.appendChild(div);

// For templates:
const template = document.createElement('template');
template.innerHTML = DOMPurify.sanitize(`
  <div class="card">
    <h3></h3>
    <p></p>
  </div>
`);
const clone = template.content.cloneNode(true);
clone.querySelector('h3').textContent = userInput.title;
clone.querySelector('p').textContent = userInput.description;
element.appendChild(clone);
```

### 5.2 DOMPurify Configuration

```javascript
import DOMPurify from 'dompurify';

// Configure DOMPurify
const cleanConfig = {
  ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'a', 'ul', 'ol', 'li'],
  ALLOWED_ATTR: ['href', 'target', 'rel'],
  ALLOW_DATA_ATTR: false,
  KEEP_CONTENT: true
};

// Use it
function sanitizeHTML(html) {
  return DOMPurify.sanitize(html, cleanConfig);
}

// For rich text editor content
function sanitizeRichText(html) {
  return DOMPurify.sanitize(html, {
    ...cleanConfig,
    ALLOWED_TAGS: [...cleanConfig.ALLOWED_TAGS, 'h1', 'h2', 'h3', 'blockquote', 'code', 'pre'],
    ALLOWED_ATTR: [...cleanConfig.ALLOWED_ATTR, 'class']
  });
}
```

---

## 6. CSRF PROTECTION

### 6.1 CSRF Token Implementation

```javascript
// Generate CSRF token on page load
function generateCSRFToken() {
  const token = crypto.randomBytes(32).toString('hex');
  sessionStorage.setItem('csrf-token', token);
  return token;
}

// Add CSRF token to all forms
document.addEventListener('DOMContentLoaded', () => {
  const token = generateCSRFToken();
  
  // Add hidden input to all forms
  document.querySelectorAll('form').forEach(form => {
    const input = document.createElement('input');
    input.type = 'hidden';
    input.name = 'csrf_token';
    input.value = token;
    form.appendChild(input);
  });
});

// Add CSRF token to AJAX requests
async function apiRequest(url, options = {}) {
  const token = sessionStorage.getItem('csrf-token');
  
  return fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      'X-CSRF-Token': token
    }
  });
}

// Server-side validation (Express.js example)
const csrf = require('csurf');
const csrfProtection = csrf({ cookie: true });

app.use(csrfProtection);

app.post('/api/clients', (req, res) => {
  // Token automatically validated by middleware
  // Process request
});
```

---

## 7. SECURITY HEADERS

### 7.1 Implementation Guide

**Option 1: Meta Tags (Static Sites)**
```html
<!-- Add to all HTML pages -->
<head>
  <meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'unsafe-inline' cdn.jsdelivr.net; style-src 'self' 'unsafe-inline'">
  <meta http-equiv="X-Frame-Options" content="DENY">
  <meta http-equiv="X-Content-Type-Options" content="nosniff">
  <meta http-equiv="X-XSS-Protection" content="1; mode=block">
  <meta name="referrer" content="strict-origin-when-cross-origin">
</head>
```

**Option 2: Server Headers (Recommended)**

**Express.js:**
```javascript
const helmet = require('helmet');

app.use(helmet());

// Or customize:
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "cdn.jsdelivr.net"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://*.supabase.co"],
      fontSrc: ["'self'", "data:"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"]
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));
```

**Nginx:**
```nginx
add_header Content-Security-Policy "default-src 'self'; script-src 'self' cdn.jsdelivr.net; style-src 'self' 'unsafe-inline';" always;
add_header X-Frame-Options "DENY" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Permissions-Policy "geolocation=(), microphone=(), camera=()" always;
```

---

## 8. DATA ENCRYPTION

### 8.1 Encryption at Rest

```javascript
// Encrypt sensitive data before storing
const crypto = require('crypto');

// Encryption key (store in environment variable!)
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY; // 32 bytes
const ALGORITHM = 'aes-256-gcm';

function encrypt(text) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  return {
    encrypted: encrypted,
    iv: iv.toString('hex'),
    authTag: authTag.toString('hex')
  };
}

function decrypt(encryptedData) {
  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    Buffer.from(ENCRYPTION_KEY, 'hex'),
    Buffer.from(encryptedData.iv, 'hex')
  );
  
  decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'));
  
  let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}

// Usage
const sensitiveData = 'credit card number';
const encrypted = encrypt(sensitiveData);
// Store encrypted data
const decrypted = decrypt(encrypted);
```

### 8.2 Secure Cookie Configuration

```javascript
// Express.js
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,      // Prevent JavaScript access
    secure: true,        // HTTPS only
    sameSite: 'strict',  // CSRF protection
    maxAge: 86400000     // 24 hours
  }
}));

// Set secure cookies
res.cookie('token', jwtToken, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 86400000
});
```

---

## 9. API SECURITY

### 9.1 Rate Limiting

```javascript
const rateLimit = require('express-rate-limit');

// General API rate limit
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: 'Too many requests, please try again later'
});

// Stricter limit for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many login attempts, please try again later'
});

app.use('/api/', apiLimiter);
app.use('/api/auth/', authLimiter);
```

### 9.2 API Authentication

```javascript
// JWT verification middleware
const jwt = require('jsonwebtoken');

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }
  
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    
    req.user = user;
    next();
  });
}

// Use on protected routes
app.get('/api/clients', authenticateToken, (req, res) => {
  // req.user contains authenticated user info
});
```

### 9.3 CORS Configuration

```javascript
const cors = require('cors');

// Configure CORS
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS.split(','), // ['https://yourdomain.com']
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  maxAge: 86400 // 24 hours
}));
```

---

## 10. LOGGING & MONITORING

### 10.1 Security Event Logging

```javascript
// Security event logger
const winston = require('winston');

const securityLogger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'security.log' }),
    new winston.transports.Console()
  ]
});

function logSecurityEvent(eventType, details) {
  securityLogger.info({
    timestamp: new Date().toISOString(),
    eventType: eventType,
    ...details
  });
}

// Log important events
logSecurityEvent('login_success', { userId: user.id, ip: req.ip });
logSecurityEvent('login_failure', { email: email, ip: req.ip });
logSecurityEvent('password_reset', { userId: user.id });
logSecurityEvent('permission_denied', { userId: user.id, resource: resource });
```

### 10.2 Error Handling (Don't Expose Details)

```javascript
// ❌ NEVER expose stack traces to users
app.use((err, req, res, next) => {
  console.error(err.stack); // ❌ DON'T send this to client!
  res.status(500).json({ error: err.message }); // ❌ DON'T send detailed errors!
});

// ✅ PROPER error handling
app.use((err, req, res, next) => {
  // Log error securely
  securityLogger.error({
    timestamp: new Date().toISOString(),
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userId: req.user?.id
  });
  
  // Return generic error to user
  res.status(500).json({
    error: 'An error occurred. Please try again later.',
    errorId: generateErrorId() // For support reference
  });
});
```

---

## IMPLEMENTATION PRIORITY

### Phase 1: Critical (Do First - 1-2 weeks)
1. Fix all XSS vulnerabilities (replace innerHTML)
2. Add security headers
3. Implement input validation
4. Add HTTPS enforcement

### Phase 2: High Priority (2-4 weeks)
1. Implement proper authentication
2. Add password hashing
3. Implement CSRF protection
4. Add rate limiting

### Phase 3: Medium Priority (4-6 weeks)
1. Add encryption for sensitive data
2. Implement security logging
3. Add monitoring and alerting
4. Security audit

---

## SECURITY RESOURCES

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [OWASP Cheat Sheet Series](https://cheatsheetseries.owasp.org/)
- [MDN Web Security](https://developer.mozilla.org/en-US/docs/Web/Security)
- [Security Headers](https://securityheaders.com/)
- [CSP Evaluator](https://csp-evaluator.withgoogle.com/)

---

**Document End**  
**Next Steps:** Review and implement security fixes based on priority
