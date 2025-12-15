# MEO Online Services System - Complete Architecture Analysis

## Executive Summary

**System Name:** MEO (Municipal Engineering Office) Online Services System  
**Stack:** MERN (MongoDB, Express.js, React, Node.js)  
**Purpose:** Building permit and occupancy permit application management system for San Vicente, Palawan  
**Architecture Type:** Full-stack web application with RESTful API, JWT authentication, and role-based access control

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Backend Architecture](#backend-architecture)
3. [Frontend Architecture](#frontend-architecture)
4. [Data Flow & Integration](#data-flow--integration)
5. [Security Analysis](#security-analysis)
6. [Issues & Risks Identified](#issues--risks-identified)
7. [Recommendations](#recommendations)

---

## 1. System Overview

### 1.1 Project Structure
```
meo-system-v2/
├── backend/              # Node.js/Express API server
│   ├── config/          # Database configuration
│   ├── controllers/     # Business logic handlers
│   ├── middleware/      # Auth & file upload middleware
│   ├── models/          # Mongoose schemas
│   ├── routes/          # API route definitions
│   ├── utils/           # Email utilities (NodeMailer & SendGrid)
│   └── uploads/         # File storage (deprecated, now using MongoDB)
└── frontend/            # React/Vite SPA
    ├── src/
    │   ├── api/         # Axios instances
    │   ├── config/      # API configuration
    │   ├── context/     # React Context (Auth, Language)
    │   ├── hooks/       # Custom hooks (auth, axios)
    │   ├── lang/        # Translations (EN/Tagalog)
    │   └── pages/       # React components & pages
    └── public/          # Static assets (forms, images)
```

### 1.2 Key Technologies

**Backend:**
- Node.js v18+ with ES modules
- Express.js v5.1.0
- MongoDB with Mongoose v8.19.2
- JWT authentication (access & refresh tokens)
- Bcrypt for password hashing
- Multer for file uploads (memory storage)
- PDF-lib for PDF generation
- SendGrid & Nodemailer for emails

**Frontend:**
- React v19.1.1
- Vite v7.1.7 (build tool)
- TailwindCSS v4.1.16
- React Router v7.9.5
- Axios v1.13.1
- Heroicons & Lucide React (icons)
- i18next (internationalization)

### 1.3 User Roles
1. **user** - Regular citizens applying for permits
2. **meoadmin** - Municipal Engineering Office administrator
3. **bfpadmin** - Bureau of Fire Protection administrator
4. **mayoradmin** - Mayor's office administrator

---

## 2. Backend Architecture

### 2.1 Server Configuration (`server.js`)

**Purpose:** Entry point that initializes Express server, middleware, and routes.

**Key Features:**
- Port: 5000 (default) or environment variable
- CORS enabled for localhost:5173, 5174, and production domains
- Cookie parser for refresh token handling
- Content Security Policy headers
- Health check endpoint: `GET /health`
- Static file serving disabled (files now in MongoDB)
- Production: Serves React build from `/frontend/dist`

**Middleware Chain:**
```
1. express.json() - Parse JSON bodies
2. express.urlencoded() - Parse URL-encoded bodies
3. cookieParser() - Parse cookies
4. cors() - Cross-origin resource sharing
5. CSP headers - Content security policy
```

**Route Mounting:**
- `/api/auth` → Authentication routes
- `/api/users` → User management routes
- `/api/documents` → Document upload routes
- `/api/applications` → Application CRUD routes
- `/api/events` → Calendar events routes

---

### 2.2 Database Configuration (`config/db.js`)

**MongoDB Connection:**
- Connection string from `process.env.MONGO_URI`
- Connection pool: max 10 connections
- Timeouts: 5s server selection, 45s socket
- Event listeners: error, disconnected, reconnected
- Graceful error handling with process.exit(1) on failure

---

### 2.3 Data Models (Mongoose Schemas)

#### 2.3.1 User Model (`models/User.js`)

**Schema Fields:**
```javascript
{
  username: String (unique, required, trim)
  first_name: String (required, trim)
  last_name: String (required, trim)
  email: String (unique, required, lowercase, trim)
  password: String (required, hashed with bcrypt)
  phone_number: Number (required)
  role: Enum ['meoadmin', 'bfpadmin', 'mayoradmin', 'user']
  profileImage: String (base64 encoded)
  profileImageType: String (mime type)
  isVerified: Boolean (default: false)
  verificationToken: String
  verificationTokenExpires: Date
  resetPasswordToken: String
  resetPasswordExpires: Date
  timestamps: true (createdAt, updatedAt)
}
```

**Methods:**
- `pre('save')` hook: Auto-hash password on creation/modification
- `comparePassword(candidatePassword)`: Bcrypt comparison for login

**Security Concerns:**
- ⚠️ Excessive console logging in production
- ✅ Proper bcrypt salting (10 rounds)

---

#### 2.3.2 BuildingApplication Model

**Purpose:** Building permit applications with workflow tracking.

**Core Fields:**
```javascript
{
  applicant: ObjectId → User (required)
  applicationType: 'Building' (constant)
  referenceNo: String (unique, auto: "B-YYMM######")
  status: Enum [
    'Submitted', 'Pending MEO', 'Pending BFP', 
    'Pending Mayor', 'Approved', 'Rejected',
    'Payment Pending', 'Payment Submitted', 'Permit Issued'
  ]
}
```

**Application Form Data (6 Boxes):**
- **box1**: Owner info, enterprise, location, scope, occupancy, project details
- **box2**: Architect/Engineer credentials (PRC, PTR, TIN)
- **box3**: Applicant signature details (CTC)
- **box4**: Lot owner consent (TCT, Tax Dec)
- **box5**: MEO assessment (assessor, reviewer, notary)
- **box6**: Fee breakdown and total amount due

**Document Management:**
```javascript
documents: [{
  requirementName: String
  fileName: String
  filePath: String (legacy)
  fileContent: String (base64)
  mimeType: String
  fileSize: Number
  uploadedAt: Date
  uploadedBy: Enum ['user', 'system']
}]
```

**Admin Checklist:**
- 8 categories: unifiedApplicationForms, additionalLocationalClearance, ownershipLandDocuments, specialDocuments, buildingSurveyPlans, professionalDocuments, constructionDetails, others
- Each item: `{ item, checked, flagged, resolvedBy, resolvedAt }`

**Payment Tracking:**
```javascript
paymentDetails: {
  method: Enum ['Walk-In', 'Online']
  status: Enum ['Pending', 'Verified', 'Failed']
  referenceNumber: String
  paymentProof: { fileName, fileContent (base64), mimeType, fileSize }
  dateSubmitted: Date
  amountPaid: Number
}
```

**Audit Trail:**
```javascript
workflowHistory: [{
  status: String
  comments: String
  updatedBy: ObjectId → User
  timestamp: Date
}]
```

**Permit Issuance:**
```javascript
permit: {
  permitNumber: String (format: "YYMM######")
  issuedAt: Date
  issuedBy: ObjectId → User
}
```

---

#### 2.3.3 OccupancyApplication Model

**Purpose:** Certificate of Occupancy (requires existing building permit).

**Relationship:**
```javascript
buildingPermit: ObjectId → BuildingApplication (required, foreign key)
```

**Core Fields:**
```javascript
{
  applicant: ObjectId → User (required)
  buildingPermit: ObjectId → BuildingApplication
  applicationType: 'Occupancy'
  referenceNo: String (unique, auto: "O-YYMM######")
  status: Enum [similar to BuildingApplication]
  
  permitInfo: {
    buildingPermitNo: String (required)
    buildingPermitDate: Date (required)
    fsecNo: String (required)
    fsecDate: Date (required)
  }
  
  ownerDetails: { lastName, givenName, middleInitial, address, zip, telNo }
  requirementsSubmitted: [String]
  projectDetails: { projectName, projectLocation, occupancyUse, ... }
  signatures: { owner, inspector, engineer credentials }
  assessmentDetails: { assessedBy, reviewedBy, notedBy, date }
  feesDetails: { fees: [{particular, amount}], totalAmountDue }
  
  // Same structure as BuildingApplication:
  rejectionDetails, adminChecklist, documents, workflowHistory, paymentDetails, permit
}
```

---

#### 2.3.4 Document Model ⚠️ DEPRECATED

**Schema:**
```javascript
{
  application_id: ObjectId
  requirement_name: String
  status: Enum ['Pending', 'Submitted', 'Approved', 'Rejected']
  file_url: String
  uploaded_at: Date
}
```

**Issue:** Not used in current codebase. Documents are embedded in application models.

---

#### 2.3.5 Event Model

**Purpose:** Calendar events for MEO office.

```javascript
{
  title: String (required)
  description: String
  start: Date (required)
  end: Date (required)
  location: String
  createdBy: ObjectId → User
  createdAt: Date
  updatedAt: Date (auto-updated via pre-save hook)
}
```

---

### 2.4 Middleware

#### 2.4.1 Authentication Middleware (`authMiddleware.js`)

**`verifyToken(req, res, next)`:**
- Extracts JWT from `Authorization: Bearer <token>`
- Verifies with `process.env.ACCESS_TOKEN_SECRET`
- Attaches `req.user = { userId, role }` to request
- Returns 401/403 on failure

**`verifyRole(roles)`:**
- Accepts single role or array
- Checks `req.user.role` against allowed roles
- Returns 403 if unauthorized

**Usage:**
```javascript
router.get('/admin', verifyToken, verifyRole(['meoadmin']), handler);
```

---

#### 2.4.2 Upload Middleware (`uploadMiddleware.js`)

**Three Multer Configurations:**

1. **documentUpload** - Application documents
   - Types: PDF, DOC, DOCX, JPG, PNG
   - Storage: Memory (base64)

2. **imageUpload** - Payment proofs
   - Types: JPG, PNG
   - Storage: Memory (base64)

3. **profileUpload** - User avatars
   - Types: JPG, PNG
   - Storage: Memory (base64)

**Migration:** From disk storage to MongoDB storage (base64 encoded).

---

### 2.5 Controllers (Business Logic)

#### 2.5.1 authController.js

**Purpose:** User authentication, registration, and account management.

**Endpoints Implemented:**

1. **egister(req, res)** - POST /api/auth/register
   - Creates new user with hashed password
   - Generates verification token (JWT, 24h expiry)
   - Sends verification email
   - Returns user data (password excluded)
   - ⚠️ Issue: Password sent in plain text via email

2. **erifyEmail(req, res)** - GET /api/auth/verify/:token
   - Verifies email verification token
   - Sets user.isVerified = true
   - Clears verification token
   - Returns success message

3. **login(req, res)** - POST /api/auth/login
   - Validates credentials with bcrypt
   - Checks if email is verified
   - Generates access token (15min) and refresh token (7d)
   - Sets refresh token in HTTP-only cookie
   - Returns access token and user data

4. **logout(req, res)** - POST /api/auth/logout
   - Clears refresh token cookie
   - Returns success message

5. **efresh(req, res)** - POST /api/auth/refresh
   - Reads refresh token from cookie
   - Verifies with REFRESH_TOKEN_SECRET
   - Generates new access token (15min)
   - Returns new access token

6. **orgotPassword(req, res)** - POST /api/auth/forgot-password
   - Generates reset token (1h expiry)
   - Sends password reset email with link
   - Returns success message

7. **esetPassword(req, res)** - POST /api/auth/reset-password/:token
   - Verifies reset token and expiry
   - Updates password (auto-hashed by pre-save hook)
   - Clears reset token
   - Returns success message

**Security Analysis:**
- ✅ HTTP-only cookies for refresh tokens
- ✅ Token expiry times appropriate
- ✅ Password hashing with bcrypt
- ⚠️ Email verification token sent via URL (potential leak)
- ⚠️ No rate limiting on login/reset attempts
- ⚠️ Password sent in registration email (security risk)

---

#### 2.5.2 userController.js

**Purpose:** User profile management and admin user operations.

**Endpoints:**

1. **getUserProfile(req, res)** - GET /api/users/me
   - Returns logged-in user's profile
   - Excludes password field
   - Uses req.user.userId from verifyToken middleware

2. **updateUserProfile(req, res)** - PUT /api/users/me
   - Updates user profile fields
   - Handles profile image upload (base64)
   - Excludes password from response
   - ⚠️ Allows updating any field (potential security risk)

3. **getAllUsers(req, res)** - GET /api/users (admin only)
   - Returns all users except passwords
   - Protected by verifyRole(['meoadmin'])
   - No pagination implemented

4. **updateUser(req, res)** - PUT /api/users/:id (admin only)
   - Admin can update any user
   - Supports role changes
   - Excludes password from response
   - ⚠️ No validation on role changes

5. **deleteUser(req, res)** - DELETE /api/users/:id (admin only)
   - Deletes user by ID
   - No cascade delete for user's applications
   - ⚠️ Risk: Orphaned applications if user deleted

---

#### 2.5.3 applicationController.js

**Purpose:** CRUD operations for building and occupancy applications.

**Key Functions:**

1. **createBuildingApplication(req, res)** - POST /api/applications/building
   - Creates BuildingApplication with all form data
   - Auto-generates reference number
   - Sets initial status: 'Submitted'
   - Sends confirmation email
   - Returns created application with populated applicant

2. **createOccupancyApplication(req, res)** - POST /api/applications/occupancy
   - Validates buildingPermit reference exists
   - Creates OccupancyApplication
   - Auto-generates reference number
   - Sends confirmation email
   - Returns created application

3. **getApplications(req, res)** - GET /api/applications
   - Returns all applications (both types) for logged-in user
   - Uses req.user.userId
   - Populates applicant fields
   - Sorts by createdAt descending

4. **getApplicationById(req, res)** - GET /api/applications/:id
   - Returns single application by ID
   - Supports both Building and Occupancy types
   - Populates applicant and buildingPermit (for occupancy)
   - ⚠️ No authorization check (any authenticated user can view any application)

5. **updateApplicationStatus(req, res)** - PUT /api/applications/:id/status (admin)
   - Updates application status
   - Appends to workflowHistory
   - Sends status change email to applicant
   - Protected by verifyRole(['meoadmin', 'bfpadmin', 'mayoradmin'])

6. **updateApplication(req, res)** - PUT /api/applications/:id
   - Updates application fields
   - Handles file uploads (documents, payment proofs)
   - Converts files to base64
   - Returns updated application
   - ⚠️ No restriction on which fields can be updated

7. **deleteApplication(req, res)** - DELETE /api/applications/:id (admin)
   - Deletes application by ID
   - No soft delete implemented
   - Protected by verifyRole(['meoadmin'])

8. **getAllApplications(req, res)** - GET /api/applications/all (admin)
   - Returns all applications across all users
   - Populates applicant fields
   - Used for admin dashboards
   - ⚠️ No pagination (performance issue with large datasets)

9. **uploadDocuments(req, res)** - POST /api/applications/:id/documents
   - Uploads multiple documents to existing application
   - Converts to base64 and stores in documents array
   - Returns updated application

10. **updatePaymentDetails(req, res)** - PUT /api/applications/:id/payment
    - Updates payment information
    - Handles payment proof upload (base64)
    - Updates payment status
    - Sends payment confirmation email

11. **updateAdminChecklist(req, res)** - PUT /api/applications/:id/checklist (admin)
    - Updates admin checklist items
    - Marks items as checked/flagged
    - Records resolvedBy and resolvedAt
    - Protected by verifyRole(['meoadmin'])

12. **issuePermit(req, res)** - POST /api/applications/:id/issue-permit (admin)
    - Generates permit number
    - Sets permit.issuedAt and permit.issuedBy
    - Updates status to 'Permit Issued'
    - Sends permit issuance email
    - Protected by verifyRole(['meoadmin'])

13. **getApplicationByReferenceNo(req, res)** - GET /api/applications/track/:referenceNo
    - Public endpoint (no auth required)
    - Searches by reference number (B-XXXXXXXX or O-XXXXXXXX)
    - Returns application with workflow history
    - Used for public tracking feature

**Critical Issues:**
- ⚠️ No authorization on getApplicationById (privacy leak)
- ⚠️ No pagination on getAllApplications
- ⚠️ Missing validation on status transitions
- ⚠️ Email sending errors not handled gracefully
- ⚠️ Large base64 files may exceed MongoDB document size limit (16MB)

---

#### 2.5.4 documentController.js

**Purpose:** Standalone document uploads (deprecated/legacy).

**Endpoints:**

1. **uploadDocument(req, res)** - POST /api/documents/upload
   - Handles single file upload
   - Stores in uploads/documents folder
   - Returns file URL
   - ⚠️ Not used in current application flow

2. **uploadPaymentProof(req, res)** - POST /api/documents/payment
   - Uploads payment proof image
   - Stores in uploads/payments folder
   - Returns file URL
   - ⚠️ Replaced by embedded payment proof in applications

**Status:** Legacy endpoints, should be removed or deprecated.

---

#### 2.5.5 eventController.js

**Purpose:** Calendar event management for MEO office.

**Endpoints:**

1. **createEvent(req, res)** - POST /api/events
   - Creates new calendar event
   - Sets createdBy from req.user.userId
   - Protected by verifyToken

2. **getEvents(req, res)** - GET /api/events
   - Returns all events
   - Populates createdBy user details
   - No date filtering implemented

3. **getEventById(req, res)** - GET /api/events/:id
   - Returns single event
   - Populates createdBy

4. **updateEvent(req, res)** - PUT /api/events/:id
   - Updates event fields
   - Auto-updates updatedAt via pre-save hook

5. **deleteEvent(req, res)** - DELETE /api/events/:id
   - Deletes event by ID

**Issues:**
- No authorization checks (any authenticated user can CRUD events)
- No date range filtering for calendar views
- No recurring event support

---

### 2.6 API Routes

#### 2.6.1 auth.js

`
POST   /api/auth/register          → authController.register
GET    /api/auth/verify/:token     → authController.verifyEmail
POST   /api/auth/login             → authController.login
POST   /api/auth/logout            → authController.logout
POST   /api/auth/refresh           → authController.refresh
POST   /api/auth/forgot-password   → authController.forgotPassword
POST   /api/auth/reset-password/:token → authController.resetPassword
`

---

#### 2.6.2 users.js

`
GET    /api/users/me               → userController.getUserProfile (auth required)
PUT    /api/users/me               → userController.updateUserProfile (auth required)
GET    /api/users                  → userController.getAllUsers (meoadmin only)
PUT    /api/users/:id              → userController.updateUser (meoadmin only)
DELETE /api/users/:id              → userController.deleteUser (meoadmin only)
`

---

#### 2.6.3 applications.js

`
# User endpoints (authenticated)
POST   /api/applications/building              → createBuildingApplication
POST   /api/applications/occupancy             → createOccupancyApplication
GET    /api/applications                       → getApplications (user's apps)
GET    /api/applications/:id                   → getApplicationById
PUT    /api/applications/:id                   → updateApplication
POST   /api/applications/:id/documents         → uploadDocuments
PUT    /api/applications/:id/payment           → updatePaymentDetails

# Admin endpoints (role-based)
GET    /api/applications/all                   → getAllApplications (admin)
PUT    /api/applications/:id/status            → updateApplicationStatus (admin)
PUT    /api/applications/:id/checklist         → updateAdminChecklist (meoadmin)
POST   /api/applications/:id/issue-permit      → issuePermit (meoadmin)
DELETE /api/applications/:id                   → deleteApplication (meoadmin)

# Public endpoint (no auth)
GET    /api/applications/track/:referenceNo    → getApplicationByReferenceNo
`

---

#### 2.6.4 documents.js (Legacy)

`
POST   /api/documents/upload       → documentController.uploadDocument
POST   /api/documents/payment      → documentController.uploadPaymentProof
`

---

#### 2.6.5 events.js

`
POST   /api/events                 → eventController.createEvent (auth required)
GET    /api/events                 → eventController.getEvents (auth required)
GET    /api/events/:id             → eventController.getEventById (auth required)
PUT    /api/events/:id             → eventController.updateEvent (auth required)
DELETE /api/events/:id             → eventController.deleteEvent (auth required)
`

---

### 2.7 Utilities

#### 2.7.1 sendEmail.js (Nodemailer)

**Purpose:** Send emails via SMTP (Gmail).

**Configuration:**
- Host: smtp.gmail.com
- Port: 587
- Auth: process.env.EMAIL_USER, process.env.EMAIL_PASS
- TLS: required

**Function:** sendEmail(to, subject, html)

**Usage:**
- Email verification
- Password reset
- Application status updates
- Payment confirmations

---

#### 2.7.2 sendEmailSendGrid.js (SendGrid)

**Purpose:** Alternative email sending via SendGrid API.

**Configuration:**
- API Key: process.env.SENDGRID_API_KEY
- From: process.env.SENDGRID_FROM_EMAIL

**Function:** sendEmail(to, subject, html)

**Status:** Alternative to Nodemailer (not actively used based on imports).

---



## 3. Frontend Architecture

### 3.1 Application Entry Points

#### 3.1.1 main.jsx
**Purpose:** React application entry point with context providers.

**Provider Hierarchy:**
1. BrowserRouter - React Router navigation
2. AuthProvider - Authentication state management
3. LanguageProvider - i18n (English/Tagalog)

#### 3.1.2 App.jsx
**Purpose:** Route definitions and application layout.

**Route Structure:**
```
Public Routes:
/                     → Home
/login               → Login
/register            → Register
/forgot-password     → ForgotPassword
/reset-password/:token → ResetPassword
/verify-email/:token → VerifyEmail

Protected Routes (authenticated):
/me                  → User Dashboard
/building-application → BuildingApplication Form
/occupancy-application → OccupancyApplication Form
/track-application   → TrackApplication (public tracking)
/document-upload     → DocumentUpload
/payment             → PaymentPage
/reupload            → ReuploadPage
/checklist           → Checklist (downloadable forms)
/calendar            → CalendarPage

Admin Routes (role-based):
/meo-dashboard       → MeoDashboard (meoadmin only)
/bfp-dashboard       → BfpDashboard (bfpadmin only)
/mayor-dashboard     → MayorDashboard (mayoradmin only)
/admin/users         → UserListPage (meoadmin only)
```

---

### 3.2 State Management

#### 3.2.1 AuthContext.jsx

**Global Authentication State:**
```javascript
{
  user: null,              // Current user object
  accessToken: null,       // JWT access token (15min)
  isAuthenticated: false,  // Auth status boolean
  loading: true            // Initial load state
}
```

**Key Functions:**
- **login(accessToken, userData)** - Set authenticated state
- **logout()** - Clear state and call API logout endpoint
- **updateUser(userData)** - Update current user profile
- **refreshAccessToken()** - Get new access token from refresh token cookie

**Token Refresh on Mount:**
- Attempts to refresh token from HTTP-only cookie
- Sets loading=false after attempt
- Enables automatic session restoration

**⚠️ Security Issue:** Access token stored in memory (vulnerable to XSS).

---

#### 3.2.2 LanguageContext.jsx

**Internationalization State:**
```javascript
{
  language: 'en',  // Current language (en or tl)
  translations: {} // Translation strings from translations.js
}
```

**Functions:**
- **toggleLanguage()** - Switch between English and Tagalog
- **t(key)** - Get translated string by key

**Translations Source:** src/lang/translations.js

---

### 3.3 Custom Hooks

#### 3.3.1 useRefreshToken.js

**Purpose:** Refresh JWT access token using refresh token cookie.

**Flow:**
```javascript
const refresh = async () => {
  const response = await axios.post('/api/auth/refresh', {}, {
    withCredentials: true // Include HTTP-only cookie
  });
  setAuth(prev => ({ ...prev, accessToken: response.data.accessToken }));
  return response.data.accessToken;
};
```

**Usage:** Called by AuthContext on mount and by useAxiosPrivate on 401 errors.

---

#### 3.3.2 useAxiosPrivate.js

**Purpose:** Axios instance with automatic JWT injection and token refresh.

**Features:**
1. **Request Interceptor:** Adds Authorization: Bearer header with accessToken
2. **Response Interceptor:** On 401 error, refreshes token and retries request once
3. **Loop Prevention:** Tracks retry attempts to prevent infinite loops

**Usage Pattern:**
```javascript
const axiosPrivate = useAxiosPrivate();
const response = await axiosPrivate.get('/api/users/me');
```

**⚠️ Issues:**
- Only retries once (may fail if refresh also fails)
- No handling for 403 (forbidden) errors

---

### 3.4 API Configuration

#### 3.4.1 apiConfig.js

**Environment-Based API URL:**
```javascript
const API_BASE_URL = import.meta.env.VITE_API_URL || 
  (import.meta.env.MODE === 'production' 
    ? 'https://meo-backup.onrender.com' 
    : 'http://localhost:5000');
```

**Configuration:**
- Development: localhost:5000
- Production: meo-backup.onrender.com
- Override with VITE_API_URL environment variable

---

#### 3.4.2 axios.js

**Default Axios Instance:**
```javascript
axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Include cookies
  headers: { 'Content-Type': 'application/json' }
});
```

**Usage:** Public endpoints (login, register, verify, track application).

---

### 3.5 Key Pages & Components

#### 3.5.1 Authentication Pages

**Home.jsx:**
- Landing page with hero section and features
- Navigation to login/register
- Language switcher integration
- Features showcase: building permits, occupancy certificates, document submission

**Login.jsx:**
- Email/password form
- Calls POST /api/auth/login
- Stores accessToken in AuthContext
- Role-based redirect to dashboard
- Links to forgot password and registration

**Register.jsx:**
- Registration form: username, email, password, first_name, last_name, phone_number
- Calls POST /api/auth/register
- Success message with email verification prompt
- Auto-redirect to login after 3 seconds

**ForgotPassword.jsx:**
- Email input form
- Calls POST /api/auth/forgot-password
- Sends password reset link via email
- Success/error messaging

**ResetPassword.jsx:**
- New password form with confirmation
- Extracts token from URL params
- Calls POST /api/auth/reset-password/:token
- Redirects to login on success

**VerifyEmail.jsx:**
- Extracts token from URL params
- Calls GET /api/auth/verify/:token on component mount
- Shows success/error message
- Auto-redirects to login after verification

---

#### 3.5.2 User Dashboard (Me.jsx)

**Sections:**

1. **Profile Section:**
   - Profile picture upload (base64)
   - Display: name, email, phone, username, role
   - Edit profile modal

2. **Applications Section:**
   - Table of user's applications (building & occupancy)
   - Columns: reference number, type, status, submission date, actions
   - Click row to view details

3. **Quick Actions:**
   - "Apply for Building Permit" button
   - "Apply for Certificate of Occupancy" button
   - "Track Application" link (public tracking)

**API Calls:**
- GET /api/users/me - Fetch user profile
- GET /api/applications - Fetch user's applications
- PUT /api/users/me - Update profile (with profile image)

---

#### 3.5.3 Admin Dashboards

**MeoDashboard.jsx (Municipal Engineering Office Admin):**

**Capabilities:**
- View ALL applications (building + occupancy)
- Full workflow management
- Document verification via admin checklist
- Payment verification
- Permit issuance

**Features:**
- ApplicationTable with filters (status, type, date range)
- Search by reference number or applicant name
- WorkflowModal for detailed application view
- Status transition buttons with comments
- Document checklist verification
- Payment proof viewing and approval
- Permit PDF generation and download

**Workflow Actions:**
- Move to: Pending MEO, Pending BFP, Pending Mayor, Approved, Rejected
- Issue Permit (generates permit number)
- Update admin checklist (flag/unflag documents)

**Navigation:**
- Link to user management (/admin/users)
- Link to calendar (/calendar)

---

**BfpDashboard.jsx (Bureau of Fire Protection Admin):**

**Scope:** Fire safety verification only.

**Capabilities:**
- View applications with status "Pending BFP"
- Review fire safety documents (FSIC, fire escape plans)
- Approve → moves to "Pending Mayor"
- Reject → moves to "Rejected" with comments

**Limitations:**
- Cannot issue permits
- Cannot modify other workflow stages
- Read-only view of MEO and Mayor stages

---

**MayorDashboard.jsx (Mayor's Office Admin):**

**Scope:** Final approval authority.

**Capabilities:**
- View applications with status "Pending Mayor"
- Final review before permit issuance
- Approve → moves to "Approved"
- Reject → moves to "Rejected" with comments

**Limitations:**
- Cannot issue permits (MEO's responsibility)
- Cannot modify BFP or MEO stages

---

**Common Dashboard Components:**
- **ApplicationTable** - Sortable, filterable data table
- **WorkflowModal** - Application details modal with tabs
- **WorkflowActions** - Status transition buttons
- **WorkflowHistory** - Timeline of status changes
- **DocumentChecklist** - Admin document verification UI
- **ApplicationFormView** - Read-only form display
- **StatusBadge** - Color-coded status indicators

---

#### 3.5.4 Application Forms

**BuildingApplication.jsx:**

**Structure:** Multi-step form matching backend schema (6 boxes).

**Box 1 - Project Information:**
- Owner details (last name, first name, MI, TIN)
- Enterprise info (form of ownership, project title, address)
- Location details (lot no, block no, TCT no, tax dec no, street, barangay, city)
- Scope of work (checkboxes: new construction, renovation, etc.)
- Occupancy classification (group and classified)
- Project details (units, estimated cost, floor area, lot area, construction type, completion date)

**Box 2 - Architect/Engineer:**
- Name, date, address
- PRC number and validity
- PTR number, date, issued at
- TIN number

**Box 3 - Applicant Signature:**
- Name, date, address
- CTC number, date issued, place issued

**Box 4 - Lot Owner Consent:**
- Name, date, address
- TCT number, tax declaration number, place issued

**Box 5 - MEO Assessment (Admin-only):**
- Assessed by, reviewed by, noted by
- Date, document number, page number, book number, series
- Notary public date

**Box 6 - Fees (Admin-only):**
- Fee breakdown (array of {particular, amount})
- Total amount due (calculated)

**Document Upload:**
- Multiple file upload (PDF, DOC, DOCX, images)
- Document categorization
- File validation (type, size)

**Form Actions:**
- Save as draft (local storage)
- Submit application (POST /api/applications/building)
- Clear form

**Validation:**
- Required field checking
- Format validation (email, phone, numbers)
- File type and size validation

---

**OccupancyApplication.jsx:**

**Prerequisites:** Must have existing building permit.

**Permit Information:**
- Building permit number (required)
- Building permit date (required)
- FSEC number (Fire Safety Evaluation Clearance)
- FSEC date

**Owner Details:**
- Last name, given name, middle initial
- Address, ZIP code, telephone number

**Project Details:**
- Project name (required)
- Project location (required)
- Occupancy use (required)
- Number of storeys (required)
- Number of units
- Total floor area
- Date of completion (required)

**Requirements Submitted:**
- Checklist of documents (checkboxes)
- Other documents field (text area)

**Signatures:**
- Owner signature details (name, CTC number, date, place)
- Inspector name
- Engineer details (name, PRC, PTR, TIN, CTC)

**Assessment Details (Admin-only):**
- Assessed by, reviewed by, noted by, date

**Fees (Admin-only):**
- Fee breakdown
- Total amount due

**Form Submission:**
- Validates building permit exists
- Calls POST /api/applications/occupancy
- Links to buildingPermit via ObjectId reference

---

#### 3.5.5 Application Tracking

**TrackApplication.jsx:**

**Purpose:** Public application status tracking (no authentication required).

**Features:**
- Reference number input (B-YYMM###### or O-YYMM######)
- Search button
- Display application details:
  - Application type
  - Current status
  - Submission date
  - Workflow history timeline

**API Call:**
- GET /api/applications/track/:referenceNo (public endpoint)

**Security:**
- No authentication required
- Limited data exposure (no documents, payment details, or personal info)
- Only shows: referenceNo, type, status, submittedAt, workflowHistory

**UI:**
- Timeline visualization of workflow stages
- Color-coded status badges
- Estimated completion date (if available)

---

#### 3.5.6 Document Management

**DocumentUpload.jsx:**

**Purpose:** Upload supporting documents to existing applications.

**Features:**
- Select application from dropdown (user's applications)
- Multiple file upload with drag-and-drop
- Document categorization (requirement name)
- File type validation (PDF, DOC, DOCX, JPG, PNG)
- File size validation
- Preview uploaded files
- Remove files before submission

**API Calls:**
- GET /api/applications - List user's applications
- POST /api/applications/:id/documents - Upload documents

**File Handling:**
- Files converted to base64 in backend
- Stored in application.documents array
- Each document: {requirementName, fileName, fileContent, mimeType, fileSize, uploadedAt}

---

**PaymentPage.jsx:**

**Purpose:** Submit payment details and proof for applications.

**Features:**
- Select application (only those with status "Payment Pending")
- View payment amount (from application.box6.totalAmountDue)
- Payment method selection: Walk-In or Online
- Payment reference number input
- Amount paid input
- Upload payment proof (receipt image: JPG, PNG)
- Image preview before upload

**API Call:**
- PUT /api/applications/:id/payment

**Payment Status Flow:**
1. User submits payment details → status: "Payment Submitted"
2. Admin verifies payment → status: "Verified" or "Failed"
3. If verified, application proceeds to next workflow stage

---

**ReuploadPage.jsx:**

**Purpose:** Re-upload documents flagged as missing or incorrect by admin.

**Features:**
- List of applications with flagged documents
- View admin comments on flagged items
- Re-upload specific flagged documents
- Mark as resolved after reupload
- Notify admin of reupload

**Workflow:**
1. Admin flags document in DocumentChecklist
2. User notified via email
3. User goes to ReuploadPage
4. User reuploads corrected document
5. Admin reviews and marks as resolved

---

**Checklist.jsx:**

**Purpose:** Display required documents and downloadable forms.

**Content:**
1. **Building Permit Checklist:**
   - Unified application forms
   - Locational clearance
   - Ownership documents (TCT, tax declaration)
   - Building survey plans
   - Professional documents (architect/engineer credentials)
   - Construction details
   - Downloadable PDF checklist

2. **Occupancy Permit Checklist:**
   - Certificate of completion
   - As-built plans
   - FSIC (Fire Safety Inspection Certificate)
   - Sanitary permit
   - Electrical inspection certificate
   - Downloadable PDF checklist

**Public Assets:**
- Forms stored in /frontend/public/checklists/
- Served statically
- Downloadable via browser

---



#### 3.5.7 Supporting Components

**NavBar.jsx:**
- Main navigation bar with logo and branding
- Navigation links (role-based visibility)
- Language switcher (EN/Tagalog)
- User menu (profile, logout)
- Responsive mobile menu (hamburger)

**PrivateRoute.jsx:**
- Higher-order component for protected routes
- Checks AuthContext.isAuthenticated
- Redirects to /login if not authenticated
- Shows loading spinner during auth check
- Used to wrap all protected routes

**CalendarPage.jsx:**
- Calendar view for MEO office events
- Month/week/day views
- Create/Edit/Delete events (admin only)
- Event details modal with description and location
- Integration with Event API

**API Calls:**
- GET /api/events - Fetch all events
- POST /api/events - Create event
- PUT /api/events/:id - Update event
- DELETE /api/events/:id - Delete event

---

**LanguageSwitcher.jsx:**
- Toggle between English (en) and Tagalog (tl)
- Dropdown or button-based UI
- Uses LanguageContext.toggleLanguage()
- Persists selection in localStorage

---

**ApplicationTable.jsx:**
- Reusable data table component for applications
- Features:
  - Sorting (by date, status, reference number, applicant name)
  - Filtering (by status, application type, date range)
  - Search (by reference number, applicant name)
  - Client-side pagination
  - Row actions (view, edit, delete)
  - Responsive design (collapses on mobile)

**Props:**
- applications: Array of application objects
- onRowClick: Handler for row selection
- showActions: Boolean for action buttons
- roleBasedActions: Object defining actions per role

---

**StatusBadge.jsx:**
- Visual status indicators with color coding
- Status colors:
  - Submitted: Blue (bg-blue-100 text-blue-800)
  - Pending MEO/BFP/Mayor: Yellow (bg-yellow-100 text-yellow-800)
  - Approved: Green (bg-green-100 text-green-800)
  - Rejected: Red (bg-red-100 text-red-800)
  - Payment Pending/Submitted: Orange (bg-orange-100 text-orange-800)
  - Permit Issued: Purple (bg-purple-100 text-purple-800)

---

**StatusFilter.jsx:**
- Dropdown filter for application status
- Multi-select capability with checkboxes
- Reset filter option
- Emit filtered status array to parent component

---

**SearchBar.jsx:**
- Search input component with icon
- Real-time filtering as user types
- Debounced search (300ms delay)
- Search by reference number or applicant name
- Clear button

---

**WorkflowModal.jsx:**
- Large modal for viewing/updating applications
- Tab-based interface:
  1. **Application Details** - Read-only form view
  2. **Documents** - List of uploaded documents with download
  3. **Workflow History** - Timeline of status changes
  4. **Admin Checklist** - Document verification (admin only)
  5. **Payment Details** - Payment info and proof (admin only)
- Role-based action buttons at footer
- Close button

---

**WorkflowActions.jsx:**
- Action buttons for status transitions
- Role-based button visibility:
  - **MEO Admin:** All status transitions, issue permit
  - **BFP Admin:** Approve/Reject from "Pending BFP"
  - **Mayor Admin:** Approve/Reject from "Pending Mayor"
- Comment textarea for each action
- Confirmation dialogs before status change
- Loading state during API call

---

**WorkflowHistory.jsx:**
- Timeline view of application status changes
- Each entry shows:
  - Status name
  - Comments from admin
  - Updated by (admin name)
  - Timestamp (formatted)
- Sorted chronologically (newest first)
- Visual timeline with connecting lines
- Icon per status

---

**DocumentChecklist.jsx:**
- Admin document verification interface
- 8 categories (matching adminChecklist schema):
  1. Unified Application Forms
  2. Additional Locational Clearance
  3. Ownership & Land Documents
  4. Special Documents
  5. Building Survey Plans
  6. Professional Documents
  7. Construction Details
  8. Others
- Each item has:
  - Checkbox (checked/unchecked)
  - Flag button (for missing/incorrect)
  - Comment field
  - Resolved by and resolved at (if previously flagged)
- Save button to update backend
- Visual indicators for flagged items

---

**ApplicantDetails.jsx:**
- Display applicant information card
- Shows: profile picture, name, email, phone, username
- Link to applicant's other applications
- Contact applicant button (opens email client)

---

**ApplicationFormView.jsx:**
- Read-only view of application form data
- Displays all 6 boxes with proper formatting
- Expandable/collapsible sections
- Matches form structure exactly
- PDF generation button (print view)

---

**ConfirmationModal.jsx:**
- Generic confirmation dialog component
- Props: title, message, onConfirm, onCancel
- Used for delete confirmations, status changes
- Customizable button text and colors

---

**SuccessModal.jsx:**
- Success message modal with checkmark icon
- Auto-close after timeout (3 seconds)
- Used for form submissions, updates
- Props: message, onClose

---

**DeleteModal.jsx:**
- Specialized confirmation for deletions
- Warning icon and red color scheme
- Requires explicit "DELETE" text input confirmation
- Props: itemName, onConfirm, onCancel

---

**UserListPage.jsx:**
- Admin user management page (meoadmin only)
- User table with columns:
  - Username
  - Email
  - Full name
  - Role
  - Verified status
  - Created at
  - Actions (edit, delete)
- Edit role modal (change user role)
- Delete user confirmation
- Search and filter users

**API Calls:**
- GET /api/users - Fetch all users
- PUT /api/users/:id - Update user (role change)
- DELETE /api/users/:id - Delete user

---

**DashboardHeader.jsx:**
- Common header for admin dashboards
- Title and breadcrumbs
- Quick stats cards:
  - Total applications
  - Pending applications
  - Approved this month
  - Rejected this month
- Date range filter controls
- Refresh button

---

**DashboardSidebar.jsx:**
- Sidebar navigation for admin pages
- Links:
  - Dashboard home
  - All applications
  - Pending review
  - User management (meoadmin only)
  - Calendar
  - Settings (if implemented)
- Role-based menu visibility
- Active link highlighting
- Collapsible on mobile

---

## 4. Data Flow & Integration

### 4.1 Authentication Flow

#### 4.1.1 Registration Flow

```
User fills Register.jsx form
  ↓
POST /api/auth/register
  Body: { username, email, password, first_name, last_name, phone_number }
  ↓
authController.register()
  ↓
User.create() - Password hashed with bcrypt (10 rounds)
  ↓
Generate verificationToken (JWT, 24h expiry)
  ↓
sendEmail() - Verification link sent
  ⚠️ SECURITY ISSUE: Plain text password included in email
  ↓
Response: { message: 'User registered. Please verify email.', user }
  ↓
Register.jsx shows success message
  ↓
Auto-redirect to /login after 3 seconds
```

**Email Verification:**
```
User clicks link in email
  ↓
Browser navigates to /verify-email/:token
  ↓
VerifyEmail.jsx component mounts
  ↓
useEffect() triggers GET /api/auth/verify/:token
  ↓
authController.verifyEmail()
  ↓
jwt.verify(token, ACCESS_TOKEN_SECRET)
  ↓
Find user by verificationToken
  ↓
Set user.isVerified = true
  ↓
Clear verificationToken and verificationTokenExpires
  ↓
user.save()
  ↓
Response: { message: 'Email verified successfully' }
  ↓
VerifyEmail.jsx shows success
  ↓
Auto-redirect to /login
```

---

#### 4.1.2 Login Flow

```
User fills Login.jsx form (email, password)
  ↓
POST /api/auth/login
  Body: { email, password }
  ↓
authController.login()
  ↓
User.findOne({ email })
  ↓
user.comparePassword(password) - bcrypt.compare()
  ↓
Check user.isVerified === true
  ↓
Generate accessToken (JWT, 15min, includes userId and role)
  ↓
Generate refreshToken (JWT, 7d, includes userId and role)
  ↓
Set refreshToken in HTTP-only cookie:
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  })
  ↓
Response: {
  message: 'Login successful',
  accessToken,
  user: { _id, username, email, first_name, last_name, role }
}
  ↓
Login.jsx receives response
  ↓
AuthContext.login(accessToken, user)
  ↓
Set state: { user, accessToken, isAuthenticated: true }
  ↓
Navigate to role-based dashboard:
  - meoadmin → /meo-dashboard
  - bfpadmin → /bfp-dashboard
  - mayoradmin → /mayor-dashboard
  - user → /me
```

---

#### 4.1.3 Token Refresh Flow

**Scenario 1: On Application Mount**
```
App.jsx renders
  ↓
AuthContext useEffect() runs
  ↓
refreshAccessToken() called
  ↓
useRefreshToken.refresh()
  ↓
POST /api/auth/refresh
  Headers: { Cookie: refreshToken }
  withCredentials: true
  ↓
authController.refresh()
  ↓
Read refreshToken from req.cookies.refreshToken
  ↓
jwt.verify(refreshToken, REFRESH_TOKEN_SECRET)
  ↓
Generate new accessToken (15min)
  ↓
Response: { accessToken }
  ↓
AuthContext updates: { accessToken, isAuthenticated: true }
  ↓
Set loading = false
  ↓
App renders protected routes
```

**Scenario 2: Access Token Expired During API Call**
```
Component calls useAxiosPrivate().get('/api/users/me')
  ↓
Request interceptor adds: Authorization: Bearer <accessToken>
  ↓
Backend verifyToken middleware
  ↓
jwt.verify(accessToken, ACCESS_TOKEN_SECRET)
  ↓
Token expired → Response: 401 Unauthorized
  ↓
Response interceptor catches 401
  ↓
useRefreshToken.refresh() called
  ↓
POST /api/auth/refresh (same flow as above)
  ↓
New accessToken received
  ↓
AuthContext.accessToken updated
  ↓
Retry original request with new token
  ↓
Request succeeds with fresh token
  ↓
Return response to component
```

---

#### 4.1.4 Logout Flow

```
User clicks Logout button
  ↓
AuthContext.logout() called
  ↓
POST /api/auth/logout
  ↓
authController.logout()
  ↓
res.clearCookie('refreshToken')
  ↓
Response: { message: 'Logged out successfully' }
  ↓
AuthContext clears state:
  { user: null, accessToken: null, isAuthenticated: false }
  ↓
Navigate to /login
```

**⚠️ Security Gap:** Access token still valid until expiry (15 min) - no server-side invalidation.

---

### 4.2 Application Submission Flow

#### 4.2.1 Building Permit Application

```
User navigates to /building-application
  ↓
BuildingApplication.jsx renders form
  ↓
User fills all 6 boxes:
  - Box 1: Owner, location, project details
  - Box 2: Architect/Engineer credentials
  - Box 3: Applicant signature
  - Box 4: Lot owner consent
  (Boxes 5 & 6 filled by admin later)
  ↓
User uploads documents (PDF, DOC, images)
  - Files stored in browser memory
  ↓
User clicks Submit button
  ↓
Form validation runs
  ↓
POST /api/applications/building
  Headers: { Authorization: Bearer <accessToken> }
  Body: {
    box1: {...},
    box2: {...},
    box3: {...},
    box4: {...},
    documents: [] // Will be uploaded separately
  }
  ↓
Backend: verifyToken middleware
  - Extracts req.user = { userId, role }
  ↓
applicationController.createBuildingApplication()
  ↓
Create BuildingApplication document:
  - applicant: req.user.userId
  - applicationType: 'Building'
  - status: 'Submitted'
  - box1, box2, box3, box4 from request body
  - workflowHistory: [{ status: 'Submitted', timestamp: now }]
  ↓
Pre-save hook generates referenceNo:
  - Format: B-YYMM######
  - Example: B-2501000001
  ↓
application.save() to MongoDB
  ↓
Populate applicant fields
  ↓
sendEmail() to user:
  - Subject: 'Building Permit Application Submitted'
  - Body: Reference number, next steps
  ↓
Response: {
  message: 'Application submitted successfully',
  application: {...}
}
  ↓
BuildingApplication.jsx receives response
  ↓
Show SuccessModal with reference number
  ↓
Navigate to /document-upload with application ID
  ↓
User uploads supporting documents
  ↓
POST /api/applications/:id/documents
  Body: FormData with multiple files
  ↓
applicationController.uploadDocuments()
  ↓
Multer memory storage → req.files array
  ↓
For each file:
  - Convert buffer to base64
  - Create document object: {
      requirementName,
      fileName,
      fileContent: base64String,
      mimeType,
      fileSize,
      uploadedAt: Date.now(),
      uploadedBy: 'user'
    }
  ↓
Push to application.documents array
  ↓
application.save()
  ↓
Response: { message: 'Documents uploaded', application }
  ↓
Navigate to /me (user dashboard)
```

---

#### 4.2.2 Payment Submission

```
Application status: 'Payment Pending'
  ↓
User receives email notification with amount due
  ↓
User navigates to /payment
  ↓
PaymentPage.jsx loads
  ↓
GET /api/applications
  - Filter applications with paymentDetails.status === 'Pending'
  ↓
User selects application from dropdown
  ↓
Display totalAmountDue from application.box6.totalAmountDue
  ↓
User fills payment form:
  - Payment method: Walk-In or Online
  - Reference number
  - Amount paid
  - Upload payment proof (receipt image)
  ↓
User clicks Submit Payment
  ↓
PUT /api/applications/:id/payment
  Headers: { Authorization: Bearer <accessToken> }
  Body: FormData {
    paymentDetails: { method, referenceNumber, amountPaid },
    paymentProof: File (image)
  }
  ↓
Backend: verifyToken middleware
  ↓
applicationController.updatePaymentDetails()
  ↓
Multer imageUpload → req.file
  ↓
Convert payment proof to base64
  ↓
Update application.paymentDetails:
  {
    method,
    status: 'Pending', // Admin will verify
    referenceNumber,
    paymentProof: {
      fileName,
      fileContent: base64,
      mimeType,
      fileSize
    },
    dateSubmitted: Date.now(),
    amountPaid
  }
  ↓
Update application.status: 'Payment Submitted'
  ↓
Append to workflowHistory: {
    status: 'Payment Submitted',
    comments: 'Payment details submitted by user',
    updatedBy: req.user.userId,
    timestamp: Date.now()
  }
  ↓
application.save()
  ↓
sendEmail() to user: Payment confirmation
  ↓
Response: { message: 'Payment submitted', application }
  ↓
PaymentPage.jsx shows SuccessModal
  ↓
User waits for admin verification
```

---



### 4.3 Admin Workflow Processing

#### 4.3.1 MEO Admin Review & Verification

```
MEO Admin logs in → /meo-dashboard
  ↓
GET /api/applications/all
  Headers: { Authorization: Bearer <accessToken> }
  ↓
Backend: verifyToken + verifyRole(['meoadmin', 'bfpadmin', 'mayoradmin'])
  ↓
applicationController.getAllApplications()
  ↓
Find all BuildingApplication and OccupancyApplication documents
  ↓
Populate applicant fields
  ↓
Sort by createdAt descending
  ↓
Response: { applications: [...] }
  ↓
MeoDashboard.jsx renders ApplicationTable
  ↓
Admin clicks on application row
  ↓
WorkflowModal opens with application details
  ↓
**DOCUMENT VERIFICATION TAB**
Admin clicks "Verify Documents"
  ↓
DocumentChecklist.jsx loads application.adminChecklist
  ↓
Admin reviews each document category:
  - Unified Application Forms
  - Locational Clearance
  - Ownership Documents
  - Building Survey Plans
  - Professional Documents
  - etc.
  ↓
For each document item:
  - Check if submitted → mark as checked
  - If missing/incorrect → flag it and add comment
  ↓
Admin clicks Save Checklist
  ↓
PUT /api/applications/:id/checklist
  Headers: { Authorization: Bearer <accessToken> }
  Body: { adminChecklist: {...} }
  ↓
Backend: verifyToken + verifyRole(['meoadmin'])
  ↓
applicationController.updateAdminChecklist()
  ↓
Update application.adminChecklist with new values
  ↓
application.save()
  ↓
Response: { message: 'Checklist updated', application }
  ↓
If documents flagged:
  - sendEmail() to user with list of flagged items
  - User receives notification to reupload documents
  ↓
**PAYMENT VERIFICATION TAB**
Admin clicks "Payment Details"
  ↓
View payment proof image (base64 decoded)
  ↓
Verify amount matches totalAmountDue
  ↓
Admin clicks "Approve Payment"
  ↓
PUT /api/applications/:id/payment
  Body: { paymentDetails: { status: 'Verified' } }
  ↓
Update application.paymentDetails.status = 'Verified'
  ↓
application.save()
  ↓
**STATUS TRANSITION**
Admin clicks "Move to Pending BFP"
  ↓
WorkflowActions.jsx shows comment textarea
  ↓
Admin enters comments (optional)
  ↓
Admin confirms action
  ↓
PUT /api/applications/:id/status
  Headers: { Authorization: Bearer <accessToken> }
  Body: {
    status: 'Pending BFP',
    comments: 'Documents and payment verified. Forwarded to BFP for fire safety review.'
  }
  ↓
Backend: verifyToken + verifyRole(['meoadmin', 'bfpadmin', 'mayoradmin'])
  ↓
applicationController.updateApplicationStatus()
  ↓
Update application.status = 'Pending BFP'
  ↓
Append to workflowHistory: {
    status: 'Pending BFP',
    comments: '...',
    updatedBy: req.user.userId,
    timestamp: Date.now()
  }
  ↓
application.save()
  ↓
sendEmail() to applicant:
  - Subject: 'Application Status Updated'
  - Body: 'Your application has moved to Pending BFP stage'
  ↓
Response: { message: 'Status updated', application }
  ↓
MeoDashboard refreshes application list
  ↓
Application now visible in BFP Admin dashboard
```

---

#### 4.3.2 BFP Admin Review (Fire Safety)

```
BFP Admin logs in → /bfp-dashboard
  ↓
GET /api/applications/all
  ↓
BfpDashboard.jsx filters: status === 'Pending BFP'
  ↓
BFP Admin clicks application
  ↓
WorkflowModal opens
  ↓
Admin reviews fire safety documents:
  - FSIC (Fire Safety Inspection Certificate)
  - Fire escape plans
  - Fire extinguisher locations
  - Sprinkler systems
  - Emergency exits
  ↓
Admin decision: Approve or Reject
  ↓
**IF APPROVED:**
Admin clicks "Approve"
  ↓
WorkflowActions shows comment field
  ↓
Admin enters: "Fire safety requirements met. FSIC verified."
  ↓
PUT /api/applications/:id/status
  Body: {
    status: 'Pending Mayor',
    comments: 'Fire safety requirements met. FSIC verified.'
  }
  ↓
updateApplicationStatus()
  ↓
application.status = 'Pending Mayor'
  ↓
Append to workflowHistory
  ↓
sendEmail() to applicant: 'Application moved to Pending Mayor'
  ↓
Application now visible in Mayor's dashboard
  ↓
**IF REJECTED:**
Admin clicks "Reject"
  ↓
Admin enters: "Missing FSIC. Fire escape plan insufficient."
  ↓
PUT /api/applications/:id/status
  Body: {
    status: 'Rejected',
    comments: 'Missing FSIC. Fire escape plan insufficient.'
  }
  ↓
application.status = 'Rejected'
  ↓
application.rejectionDetails = {
    comments: '...',
    missingDocuments: ['FSIC', 'Fire Escape Plan'],
    status: 'Rejected',
    isResolved: false
  }
  ↓
sendEmail() to applicant: Rejection notice with reasons
  ↓
User must fix issues and resubmit or reupload documents
```

---

#### 4.3.3 Mayor Final Approval

```
Mayor Admin logs in → /mayor-dashboard
  ↓
GET /api/applications/all
  ↓
MayorDashboard.jsx filters: status === 'Pending Mayor'
  ↓
Mayor clicks application
  ↓
WorkflowModal shows full application details
  ↓
Mayor reviews:
  - All form data (6 boxes)
  - MEO verification status
  - BFP approval
  - Payment verification
  - Workflow history
  ↓
Mayor decision: Approve or Reject
  ↓
**IF APPROVED:**
Mayor clicks "Approve"
  ↓
PUT /api/applications/:id/status
  Body: {
    status: 'Approved',
    comments: 'Approved by Mayor. Ready for permit issuance.'
  }
  ↓
application.status = 'Approved'
  ↓
Append to workflowHistory
  ↓
sendEmail() to applicant: 'Application APPROVED! Permit will be issued soon.'
  ↓
Application now ready for permit issuance by MEO
  ↓
**IF REJECTED:**
Mayor clicks "Reject"
  ↓
Mayor enters reason
  ↓
application.status = 'Rejected'
  ↓
sendEmail() to applicant with rejection reason
```

---

#### 4.3.4 Permit Issuance (MEO Admin Only)

```
MEO Admin views approved applications
  ↓
Filter: status === 'Approved'
  ↓
Admin clicks on approved application
  ↓
WorkflowModal shows "Issue Permit" button
  ↓
Admin clicks "Issue Permit"
  ↓
ConfirmationModal: "Are you sure you want to issue permit for B-2501000001?"
  ↓
Admin confirms
  ↓
POST /api/applications/:id/issue-permit
  Headers: { Authorization: Bearer <accessToken> }
  ↓
Backend: verifyToken + verifyRole(['meoadmin'])
  ↓
applicationController.issuePermit()
  ↓
Generate permit number:
  - Format: YYMM######
  - Example: 2501000001
  - Sequential counter per month
  ↓
Update application.permit:
  {
    permitNumber: '2501000001',
    issuedAt: Date.now(),
    issuedBy: req.user.userId
  }
  ↓
Update application.status = 'Permit Issued'
  ↓
Append to workflowHistory: {
    status: 'Permit Issued',
    comments: 'Permit issued by MEO Admin',
    updatedBy: req.user.userId,
    timestamp: Date.now()
  }
  ↓
application.save()
  ↓
sendEmail() to applicant:
  - Subject: 'Building Permit Issued'
  - Body: Permit number, issuance date, validity period
  - Attach PDF permit (if generated)
  ↓
Response: {
  message: 'Permit issued successfully',
  application,
  permit: { permitNumber, issuedAt }
}
  ↓
MeoDashboard.jsx shows success
  ↓
Admin can now generate PDF permit:
  - Uses pdf-lib to fill permit form template
  - Includes all application data
  - QR code with reference number
  - Download as PDF
  ↓
User receives email notification
  ↓
User logs in to /me
  ↓
Views application status: "Permit Issued"
  ↓
Downloads permit PDF
```

---

### 4.4 Public Tracking Flow

```
Anyone (no auth) visits /track-application
  ↓
TrackApplication.jsx renders
  ↓
User enters reference number: B-2501000001
  ↓
User clicks "Track Application"
  ↓
GET /api/applications/track/B-2501000001
  No Authorization header
  ↓
Backend: NO verifyToken middleware (public endpoint)
  ↓
applicationController.getApplicationByReferenceNo()
  ↓
Find application where referenceNo === 'B-2501000001'
  ↓
Populate applicant (limited fields: first_name, last_name only)
  ↓
Return limited data:
  {
    referenceNo,
    applicationType,
    status,
    submittedAt: createdAt,
    workflowHistory: [
      { status, timestamp, comments },
      ...
    ],
    // NO sensitive data: documents, payment, personal info
  }
  ↓
Response: { application: {...} }
  ↓
TrackApplication.jsx receives data
  ↓
Display:
  - Reference Number: B-2501000001
  - Application Type: Building Permit
  - Current Status: Pending BFP
  - Submitted: Jan 1, 2025
  - Timeline:
    ✓ Submitted (Jan 1, 2025)
    ✓ Pending MEO (Jan 2, 2025) - "Documents verified"
    → Pending BFP (Jan 3, 2025) - Current
    ○ Pending Mayor
    ○ Approved
    ○ Permit Issued
  ↓
User sees current status without logging in
```

---

### 4.5 Calendar Event Management

```
MEO Admin navigates to /calendar
  ↓
CalendarPage.jsx loads
  ↓
GET /api/events
  Headers: { Authorization: Bearer <accessToken> }
  ↓
Backend: verifyToken middleware
  ↓
eventController.getEvents()
  ↓
Event.find().populate('createdBy', 'first_name last_name')
  ↓
Response: { events: [...] }
  ↓
CalendarPage renders month view with events
  ↓
**CREATE EVENT:**
Admin clicks on date (e.g., Jan 15, 2025)
  ↓
"Create Event" modal opens
  ↓
Admin fills:
  - Title: "Building Inspection Schedule"
  - Description: "Inspect construction sites in Barangay 1"
  - Start: Jan 15, 2025 9:00 AM
  - End: Jan 15, 2025 5:00 PM
  - Location: "Barangay 1, San Vicente"
  ↓
Admin clicks Save
  ↓
POST /api/events
  Headers: { Authorization: Bearer <accessToken> }
  Body: { title, description, start, end, location }
  ↓
Backend: verifyToken middleware
  ↓
eventController.createEvent()
  ↓
Create Event document:
  {
    title,
    description,
    start,
    end,
    location,
    createdBy: req.user.userId,
    createdAt: Date.now()
  }
  ↓
event.save()
  ↓
Response: { message: 'Event created', event }
  ↓
CalendarPage refreshes → new event appears on calendar
  ↓
**EDIT EVENT:**
Admin clicks on existing event
  ↓
Event details modal opens
  ↓
Admin clicks "Edit"
  ↓
Modify fields
  ↓
PUT /api/events/:id
  Body: { updated fields }
  ↓
eventController.updateEvent()
  ↓
Event.findByIdAndUpdate()
  ↓
Pre-save hook updates updatedAt timestamp
  ↓
Response: { message: 'Event updated', event }
  ↓
**DELETE EVENT:**
Admin clicks "Delete" on event
  ↓
DeleteModal confirmation
  ↓
DELETE /api/events/:id
  ↓
eventController.deleteEvent()
  ↓
Event.findByIdAndDelete()
  ↓
Response: { message: 'Event deleted' }
  ↓
Calendar refreshes → event removed
```

---

### 4.6 User Management Flow

```
MEO Admin navigates to /admin/users
  ↓
UserListPage.jsx loads
  ↓
GET /api/users
  Headers: { Authorization: Bearer <accessToken> }
  ↓
Backend: verifyToken + verifyRole(['meoadmin'])
  ↓
userController.getAllUsers()
  ↓
User.find().select('-password')
  ↓
Response: { users: [...] }
  ↓
UserListPage renders table:
  - Username | Email | Name | Role | Verified | Created | Actions
  ↓
**CHANGE USER ROLE:**
Admin clicks "Edit Role" on user
  ↓
Modal opens with role dropdown
  ↓
Admin selects new role: 'bfpadmin'
  ↓
PUT /api/users/:id
  Headers: { Authorization: Bearer <accessToken> }
  Body: { role: 'bfpadmin' }
  ↓
Backend: verifyToken + verifyRole(['meoadmin'])
  ↓
userController.updateUser()
  ↓
User.findByIdAndUpdate(userId, { role: 'bfpadmin' })
  ↓
Response: { message: 'User updated', user }
  ↓
UserListPage refreshes → role updated in table
  ↓
**DELETE USER:**
Admin clicks "Delete" on user
  ↓
DeleteModal: "This will permanently delete the user. Type DELETE to confirm."
  ↓
Admin types "DELETE" and confirms
  ↓
DELETE /api/users/:id
  Headers: { Authorization: Bearer <accessToken> }
  ↓
Backend: verifyToken + verifyRole(['meoadmin'])
  ↓
userController.deleteUser()
  ↓
User.findByIdAndDelete(userId)
  ↓
⚠️ WARNING: No cascade delete!
  - User's applications remain in database
  - application.applicant reference becomes invalid (orphaned)
  ↓
Response: { message: 'User deleted successfully' }
  ↓
UserListPage refreshes → user removed from table
```

**⚠️ Critical Issue:** Deleting a user orphans their applications. This is a data integrity bug.

---

## 5. Security Analysis

### 5.1 Authentication & Authorization

#### ✅ Strengths:

1. **JWT-based Authentication:**
   - Industry standard token-based auth
   - Stateless authentication (no server-side sessions)

2. **Access Token Short-Lived (15 minutes):**
   - Limits exposure window if token stolen
   - Forces regular refresh

3. **Refresh Token in HTTP-Only Cookie:**
   - Protected from JavaScript access (XSS protection)
   - 7-day expiry for convenience vs. security balance

4. **Bcrypt Password Hashing:**
   - Industry standard (10 salt rounds)
   - Properly hashed on registration and password change

5. **Role-Based Access Control (RBAC):**
   - verifyRole middleware enforces permissions
   - Clear role definitions (user, meoadmin, bfpadmin, mayoradmin)
   - Role checked on every protected endpoint

6. **Email Verification:**
   - Prevents fake account creation
   - Ensures valid email addresses

7. **Password Reset Flow:**
   - Time-limited tokens (1 hour)
   - One-time use tokens

---

#### ⚠️ Critical Security Vulnerabilities:

1. **PASSWORD SENT IN REGISTRATION EMAIL (CRITICAL)**
   - **Location:** authController.js - register function
   - **Issue:** Plain text password sent via insecure email channel
   - **Risk:** Email intercepted = account compromised
   - **Impact:** Complete breach of user account security
   - **Fix:** Immediately remove password from email. Only send verification link.

2. **MISSING AUTHORIZATION ON getApplicationById (CRITICAL)**
   - **Location:** applicationController.js - getApplicationById
   - **Issue:** Any authenticated user can view any application by guessing ID
   - **Risk:** Privacy breach, unauthorized data access
   - **Impact:** GDPR violation, exposure of sensitive personal data (TIN, addresses, documents)
   - **Proof:** User A can access User B's application via GET /api/applications/:userB_application_id
   - **Fix:** Add ownership check:
   ```javascript
   const isOwner = application.applicant._id.toString() === req.user.userId;
   const isAdmin = ['meoadmin', 'bfpadmin', 'mayoradmin'].includes(req.user.role);
   if (!isOwner && !isAdmin) {
     return res.status(403).json({ error: 'Unauthorized' });
   }
   ```

3. **NO RATE LIMITING (HIGH RISK)**
   - **Location:** All authentication endpoints
   - **Issue:** No protection against brute force attacks
   - **Risk:** Attacker can attempt unlimited login attempts
   - **Impact:** Account takeover via password guessing
   - **Endpoints at risk:**
     - POST /api/auth/login
     - POST /api/auth/forgot-password
     - POST /api/auth/register
     - POST /api/auth/verify/:token
   - **Fix:** Implement express-rate-limit:
   ```javascript
   const loginLimiter = rateLimit({
     windowMs: 15 * 60 * 1000, // 15 minutes
     max: 5, // 5 attempts per window
     message: 'Too many login attempts, please try again after 15 minutes'
   });
   app.use('/api/auth/login', loginLimiter);
   ```

4. **ACCESS TOKEN IN MEMORY (XSS RISK)**
   - **Location:** AuthContext.jsx, useAxiosPrivate.js
   - **Issue:** Access token stored in React context (JavaScript-accessible memory)
   - **Risk:** XSS attack can steal token via document.cookie or memory inspection
   - **Impact:** Complete session hijacking
   - **Fix:** Store access token in HTTP-only cookie (same as refresh token)

5. **NO CSRF PROTECTION (HIGH RISK)**
   - **Location:** server.js - no CSRF middleware
   - **Issue:** Cookies used without CSRF token validation
   - **Risk:** Cross-Site Request Forgery attacks
   - **Impact:** Attacker can perform unauthorized actions on behalf of logged-in user
   - **Fix:** Implement csurf middleware OR use SameSite=Strict cookie attribute

6. **EMAIL VERIFICATION TOKEN IN URL (MEDIUM RISK)**
   - **Location:** authController.js - verifyEmail endpoint
   - **Issue:** Token sent as URL parameter: /verify-email/:token
   - **Risk:** Token exposure via:
     - Browser history
     - Server logs
     - Referrer headers
     - Shoulder surfing
   - **Fix:** Use POST request with token in body, or shorter token lifetime

7. **NO TOKEN BLACKLISTING (MEDIUM RISK)**
   - **Issue:** Logout doesn't invalidate access token
   - **Risk:** Access token valid for 15 min after logout
   - **Impact:** Brief window for session hijacking after logout
   - **Fix:** Implement Redis-based token blacklist or reduce access token lifetime

8. **NO ACCOUNT LOCKOUT (MEDIUM RISK)**
   - **Issue:** No lockout after failed login attempts
   - **Risk:** Enables sustained brute force attacks
   - **Fix:** Lock account for 30 min after 5 failed attempts

---



### 5.2 Data Security

#### ✅ Strengths:

1. **MongoDB Connection Security:**
   - Connection string from environment variable
   - Authentication required

2. **Password Hashing:**
   - Bcrypt with 10 salt rounds
   - Automatic hashing via pre-save hook

3. **Sensitive Fields Excluded from Responses:**
   - Password field never returned in API responses
   - .select('-password') used consistently

4. **Files in Database:**
   - Base64 encoding in MongoDB
   - No file system exposure
   - No direct file access via URLs

---

#### ⚠️ Data Security Vulnerabilities:

1. **NO INPUT VALIDATION (CRITICAL)**
   - **Issue:** Controllers accept raw user input without sanitization
   - **Risk:** NoSQL injection attacks possible
   - **Impact:** Bypass authentication, unauthorized data access
   - **Fix:** Use express-validator or Joi for all inputs

2. **EXCESSIVE CONSOLE LOGGING (MEDIUM)**
   - **Location:** User model pre-save hook
   - **Issue:** Logs password hashing details in production
   - **Risk:** Sensitive info in production logs
   - **Fix:** Remove or gate behind environment check

3. **NO FIELD-LEVEL ENCRYPTION (LOW)**
   - **Issue:** Sensitive PII stored in plain text (TIN, CTC numbers, addresses)
   - **Risk:** Database breach exposes all PII
   - **Recommendation:** Consider field-level encryption for highly sensitive fields

4. **LARGE DOCUMENT SIZE RISK (MEDIUM)**
   - **Issue:** Base64 encoding increases file size by ~33%
   - **Risk:** MongoDB document limit is 16MB; multiple large files could exceed
   - **Impact:** Save operation fails, application submission fails
   - **Fix:** Implement file size limits, use GridFS for large files, or migrate to cloud storage

5. **NO DATABASE CONNECTION ENCRYPTION (MEDIUM)**
   - **Location:** config/db.js
   - **Issue:** No TLS/SSL enforcement for MongoDB connection
   - **Risk:** Data in transit can be intercepted
   - **Fix:** Add ssl: true to connection options for production

---

### 5.3 API Security

#### ✅ Strengths:

1. **CORS Properly Configured:**
   - Whitelist of allowed origins
   - credentials: true for cookie support

2. **Content Security Policy:**
   - CSP headers set in server.js

3. **Express 5:**
   - Latest version with security improvements

4. **Cookie Parser:**
   - Secure cookie handling

---

#### ⚠️ API Security Issues:

1. **NO REQUEST SIZE LIMITS (HIGH)**
   - **Location:** server.js
   - **Issue:** express.json() and express.urlencoded() have no size limits
   - **Risk:** DOS attack via large payloads
   - **Impact:** Server memory exhaustion, crash
   - **Fix:** Add size limits

2. **WEAK CSP CONFIGURATION (MEDIUM)**
   - **Issue:** unsafe-inline and unsafe-eval in script-src defeats CSP purpose
   - **Risk:** XSS attacks not prevented by CSP
   - **Fix:** Use nonce-based CSP for inline scripts

3. **NO SECURITY HEADERS MIDDLEWARE (MEDIUM)**
   - **Missing:** X-Frame-Options, X-Content-Type-Options, Strict-Transport-Security
   - **Fix:** Use helmet.js

4. **NO API VERSIONING (LOW)**
   - **Issue:** No version prefix (should be /api/v1/)
   - **Risk:** Breaking changes affect all clients

5. **INCONSISTENT ERROR MESSAGES (LOW)**
   - **Issue:** Some errors expose internal details
   - **Risk:** Information leakage aids attackers

6. **NO REQUEST LOGGING (MEDIUM)**
   - **Issue:** No audit trail for API requests
   - **Risk:** Cannot investigate security incidents
   - **Fix:** Implement morgan or winston

---

### 5.4 File Upload Security

#### ✅ Strengths:

1. **File Type Validation:**
   - MIME type checking in Multer config

2. **Memory Storage:**
   - No disk write vulnerabilities

---

#### ⚠️ File Upload Vulnerabilities:

1. **MIME TYPE SPOOFING (HIGH)**
   - **Issue:** Only checks MIME type from HTTP header
   - **Risk:** Attacker can fake MIME type
   - **Impact:** Malicious file uploaded and stored
   - **Fix:** Use file-type library to verify actual file content

2. **NO FILE SIZE LIMITS (HIGH)**
   - **Issue:** Multer configs have no size limits
   - **Risk:** Memory exhaustion, DOS attack
   - **Fix:** Add limits to Multer configs (e.g., 10MB)

3. **NO VIRUS SCANNING (MEDIUM)**
   - **Issue:** Uploaded files not scanned for malware
   - **Risk:** Malware distribution
   - **Fix:** Integrate antivirus (ClamAV)

4. **NO FILENAME SANITIZATION (MEDIUM)**
   - **Issue:** Original filenames stored without sanitization
   - **Risk:** Path traversal, XSS in filename
   - **Fix:** Sanitize or generate random names

---

## 6. Issues & Risks Summary

### 6.1 CRITICAL (Priority 1 - Fix Immediately)

1. **Password in Registration Email** - Account compromise risk
2. **Missing Authorization on getApplicationById** - Privacy breach
3. **No Rate Limiting** - Brute force attacks possible
4. **No Input Validation** - NoSQL injection risk
5. **Access Token in Memory** - XSS vulnerability
6. **No CSRF Protection** - Cross-site request forgery

### 6.2 HIGH (Priority 2 - Fix Soon)

1. **No Pagination** - Performance issues
2. **Orphaned Applications** - Data integrity loss
3. **No File Size Limits** - DOS risk
4. **No Request Size Limits** - DOS risk
5. **MIME Type Spoofing** - Malicious file uploads
6. **Reference Number Collision** - Duplicate IDs
7. **No Transactions** - Inconsistent data
8. **Large Base64 Payloads** - Slow responses

### 6.3 MEDIUM (Priority 3)

1. No database indexing
2. N+1 query problems
3. Inconsistent error handling
4. Email failures not handled
5. Deprecated code
6. No caching
7. Excessive logging

### 6.4 LOW (Priority 4)

1. No real-time updates
2. No document versioning
3. No bulk operations
4. No email templates
5. No search functionality
6. No export functionality
7. Basic monitoring

---

## 7. Recommendations Timeline

### Week 1: Critical Security
- Remove password from email
- Add authorization checks
- Implement rate limiting
- Add input validation
- CSRF protection
- File size limits

### Month 1: Performance & Stability
- Pagination
- Database indexes
- Error handling
- Logging
- Transactions
- Remove deprecated code

### Months 2-3: Features
- Real-time updates
- Search functionality
- Export features
- Email templates
- Caching
- Monitoring

### Months 4-6: Scale
- Cloud storage
- Mobile app
- Advanced features
- CI/CD
- GDPR compliance

---

## 8. Architecture Strengths

1. ✅ Modern MERN stack
2. ✅ Clean separation of concerns
3. ✅ Comprehensive workflow
4. ✅ Role-based access control
5. ✅ Audit trail
6. ✅ Internationalization
7. ✅ Public tracking
8. ✅ JWT authentication

---

## 9. Final Assessment

**Code Quality:** B+ (Well-structured, needs improvements)
**Security:** C (Critical vulnerabilities exist)
**Performance:** C+ (Works but not optimized)
**UX:** A- (Comprehensive and intuitive)
**Maintainability:** B (Good structure, needs documentation)

**Overall:** B (Solid foundation, needs security work)

---

## 10. Conclusion

The MEO Online Services System is a well-architected application with comprehensive permit management functionality. With the critical security issues addressed and performance optimizations implemented, this system will serve the Municipal Engineering Office effectively.

**System Architecture Memorized ✅**

Ready to assist with:
- Bug fixes
- Security enhancements
- Feature implementations
- Performance optimizations
- Code refactoring
- Questions about any system component

---

**End of Analysis**
