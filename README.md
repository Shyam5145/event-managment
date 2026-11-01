# CampusPulse — Modern College Event Management Platform

CampusPulse is a collegiate event discovery, registration, schedule coordination, and organizer analytics platform powered by **React 18**, **Vite**, **Tailwind CSS**, and **Firebase** (Firebase Authentication, Cloud Firestore, Firebase Storage, Cloud Functions, and Firebase Hosting).

---

## 📁 Project Architecture (Firebase Monorepo)

```text
CampusPulse/
│
├── frontend/                     # React + Vite Client Application
│   ├── public/                   # Static assets (favicons, manifests)
│   ├── src/
│   │   ├── assets/               # Local icons and branding assets
│   │   ├── components/           # Modular UI Component Library
│   │   │   ├── common/           # Button, Input, Modal, Badge, Toast, Card, Search
│   │   │   ├── layout/           # Navbar, Sidebar, DashboardLayout, Footer
│   │   │   ├── events/           # EventCard, RegistrationModal, ShareModal, PosterUpload
│   │   │   └── dashboard/        # Metrics widgets, attendance roster, charts
│   │   ├── pages/                # Application Views
│   │   │   ├── public/           # Landing (Home), Events Catalog, Event Details, Login, Signup
│   │   │   ├── student/          # Student Dashboard, Passes, Calendar, Certificates, Notifications
│   │   │   └── organizer/        # Organizer Studio, Create Event, Edit Event, Attendance Scanner
│   │   ├── services/             # Firebase SDK Service Layer
│   │   │   ├── firebase.js       # Firebase App, Auth, Firestore, and Storage initialization
│   │   │   ├── authService.js    # Sign-up, Sign-in, Sign-out, Password reset, Error mapping
│   │   │   ├── userService.js    # Student/Organizer profile CRUD & Role immutability
│   │   │   ├── eventService.js   # Event CRUD, Lifecycle transitions, and Filter queries
│   │   │   ├── registrationService.js # Deterministic registrations, Concurrency, Cancellations
│   │   │   ├── storageService.js # 5MB limit, MIME whitelist, Poster uploads & Deletion
│   │   │   ├── notificationService.js # In-app notification center & recipient isolation
│   │   │   └── certificateService.js # Student certificates & host authorization
│   │   ├── context/              # AuthContext, EventContext, NotificationContext
│   │   ├── routes/               # Role-based protected routing (Student / Organizer / Admin)
│   │   ├── App.jsx               # Application root provider tree
│   │   └── main.jsx              # DOM entry point
│   ├── index.html                # Vite HTML entry
│   ├── package.json              # Frontend dependencies (Firebase v13, Lucide, Recharts)
│   ├── vite.config.js            # Vite bundler configuration
│   ├── tailwind.config.js        # Collegiate theme design tokens
│   └── .env.example              # Template environment variables (safe to commit)
│
├── backend/                      # Firebase Backend Infrastructure
│   ├── functions/                # Firebase Cloud Functions
│   │   ├── index.js              # Atomic transactions: register, cancel, check-in, certificates
│   │   └── package.json          # firebase-admin, firebase-functions
│   ├── firestore.rules           # Production Cloud Firestore Security Rules
│   ├── firestore.indexes.json    # Composite query indexes for sorting & filtering
│   ├── storage.rules             # Production Firebase Storage Security Rules
│   ├── package.json              # Backend package metadata
│   └── .env.example              # Backend environment template
│
├── firebase.json                 # Firebase Hosting, Firestore, Storage, Functions & Emulators config
├── .firebaserc                   # Firebase project binding (`campuspuulse`)
├── test_phase11_suite.mjs        # Automated integration test suite (25 tests)
├── package.json                  # Root monorepo scripts
└── README.md                     # Platform documentation
```

---

## ⚡ Quick Start & Local Development

### 1. Prerequisites
- **Node.js**: v18.0.0 or higher (v20+ recommended)
- **npm**: v9.0.0 or higher
- **Firebase CLI** (optional for emulator & deployment): `npm install -g firebase-tools`

### 2. Installation
Clone the repository and install root and workspace dependencies:

```bash
# Clone repository
git clone <repository-url>
cd CampusPulse

# Install frontend dependencies
npm --prefix frontend install
```

### 3. Local Development Server
Start the Vite development server:

```bash
npm run dev
# or: npm --prefix frontend run dev
```

Visit **`http://localhost:5173`** in your browser.

- **Offline Demo Mode**: Zero credentials required. Click **"Student Demo"** (Rahul Sharma) or **"Organizer Demo"** (Tech Club Lead) to test full UI workflows instantly.
- **Connected Firebase Mode**: When `frontend/.env` is populated with Firebase web configuration, the platform connects to live Cloud Firestore, Firebase Authentication, and Firebase Storage.

### 4. Running the Test Suite
Execute the 25 automated integration and security rule verification tests:

```bash
npm test
# or: node test_phase11_suite.mjs
```

### 5. Production Build
Verify production compilation without errors:

```bash
npm run build
# or: npm --prefix frontend run build
```

---

## 🔥 Firebase Configuration & Setup

CampusPulse uses **Cloud Firestore**, **Firebase Authentication**, **Firebase Storage**, and **Firebase Hosting** under the Firebase project `campuspuulse`.

### Step 1: Firebase Project Configuration
1. Open the [Firebase Console](https://console.firebase.google.com/).
2. Select your project (e.g., `campuspuulse`).
3. Under **Project Settings > General > Your Apps**, copy your Web App configuration keys.

### Step 2: Environment Variables
Create `frontend/.env` locally (this file is ignored by Git):

```env
# CampusPulse Frontend Environment Variables
VITE_APP_TITLE=CampusPulse
VITE_CAMPUS_NAME=University Event Hub

# Firebase Configuration
VITE_FIREBASE_API_KEY=your_web_api_key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_web_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

Never commit `.env`, service-account JSON files, private keys, or other credentials.
Firebase web configuration is browser-side configuration, so restrict authorized
domains and rely on Firebase Authentication and security rules for protection.
Cloud Functions should use runtime credentials or a locally ignored
`GOOGLE_APPLICATION_CREDENTIALS` path; never add an admin key to this repository.

---

## 🔐 Firebase Authentication Setup

1. In the Firebase Console, navigate to **Build > Authentication > Sign-in method**.
2. Enable **Email/Password** provider.
3. Features configured in `frontend/src/services/authService.js`:
   - **Student Signup**: Automatically provisions a corresponding Firestore document in `/users/{uid}`.
   - **Role Tamper Protection**: All public signups are strictly defaulted to role `student`. Users cannot self-assign `organizer` or `admin`.
   - **Friendly Error Formatting**: All error codes (`auth/email-already-in-use`, `auth/wrong-password`, etc.) are converted to human-readable collegiate notices.
   - **Session Persistence**: Browser local persistence with auth state listeners (`onAuthStateChanged`).
   - **Role-Aware Route Protection**: Custom route guards redirect unauthorized students away from organizer dashboards.

---

## 🗄️ Cloud Firestore Database Model

Cloud Firestore is the only database for CampusPulse. The schema is organized into 5 secured collections:

### 1. `users` (`/users/{uid}`)
- **Document ID**: Firebase Auth UID
- **Fields**: `uid`, `name`, `email`, `photoURL`, `role` (`student` | `organizer` | `admin`), `department`, `year`, `bio`, `createdAt`, `updatedAt`.
- **Integrity**: Role and UID cannot be modified through client-side profile updates.

### 2. `events` (`/events/{eventId}`)
- **Document ID**: Auto-generated ID
- **Fields**: `title`, `description`, `category`, `organizerId`, `organizerName`, `venue`, `eventDate`, `startTime`, `endTime`, `registrationDeadline`, `capacity`, `registeredCount`, `posterURL`, `status` (`draft` | `published` | `cancelled` | `completed`), `createdAt`, `updatedAt`.
- **Integrity**: Only the owning organizer can edit/cancel an event. Students can only adjust `registeredCount` atomically during registrations.

### 3. `registrations` (`/registrations/{eventId}_{studentId}`)
- **Document ID**: Deterministic `${eventId}_${studentId}` prevents duplicate registrations.
- **Fields**: `eventId`, `studentId`, `studentName`, `studentEmail`, `status` (`registered` | `cancelled` | `waitlisted`), `attendanceStatus` (`notMarked` | `present` | `absent`), `checkedIn` (bool), `registeredAt`, `updatedAt`.
- **Integrity**: Concurrency-safe transactions prevent exceeding `capacity`. Students cannot self-mark attendance.

### 4. `notifications` (`/notifications/{notificationId}`)
- **Document ID**: Auto-generated ID
- **Fields**: `recipientId`, `title`, `message`, `type`, `relatedEventId`, `isRead`, `createdAt`.
- **Integrity**: Students can only query and mark notifications where `recipientId == request.auth.uid`.

### 5. `certificates` (`/certificates/{certificateId}`)
- **Document ID**: Auto-generated ID
- **Fields**: `eventId`, `eventTitle`, `studentId`, `studentName`, `certificateURL`, `issuedAt`, `issuedBy`.
- **Integrity**: Only event host organizers or admins can create certificates. Students are restricted to read-only access for their own certificates.

---

## 📁 Firebase Storage Setup

1. In the Firebase Console, navigate to **Build > Storage**.
2. Bucket: `campuspuulse.firebasestorage.app`
3. Storage Paths:
   - Event Posters: `events/{eventId}/posters/{fileName}`
   - Student Certificates: `certificates/{studentId}/{fileName}`
   - User Avatars: `avatars/{userId}/{fileName}`
4. File Validation Constraints:
   - **Size Limit**: Maximum 5 MB per file.
   - **Allowed Poster Formats**: `image/jpeg`, `image/png`, `image/webp`, `image/gif`.
   - **Certificate Formats**: Images + `application/pdf`.

---

## 🛡️ Security Rules

### Deploying Rules & Indexes
Deploy Firestore rules, Storage rules, and Firestore indexes using the Firebase CLI:

```bash
# Deploy Firestore security rules
firebase deploy --only firestore:rules

# Deploy Storage security rules
firebase deploy --only storage

# Deploy Firestore composite indexes
firebase deploy --only firestore:indexes

# Deploy all rules and indexes together
npm run deploy:rules
npm run deploy:indexes
```

### Security Rules Highlights
- **No Insecure Wildcards**: Never uses `allow read, write: if true;`.
- **User Ownership Verification**: Users can only update their own profiles and can never tamper with `role`, `uid`, `email`, or `createdAt`.
- **Cross-Organizer Isolation**: Organizers can only inspect participant lists and mark attendance for events they created.
- **Attendance Locking**: Students are strictly prevented from self-marking attendance.
- **Certificate Protection**: Students are strictly prevented from self-issuing certificates.

---

## 🧪 Firebase Emulator Suite

To develop and test with local Firebase Emulators:

```bash
# Start all configured emulators
npm run emulators
# or: firebase emulators:start
```

### Emulator Port Allocations
| Service | Port | Description |
| :--- | :--- | :--- |
| **Emulator UI** | `4000` | Local Web Dashboard (`http://localhost:4000`) |
| **Authentication** | `9099` | Local Auth Emulator |
| **Cloud Firestore** | `8080` | Local Firestore Database |
| **Cloud Functions** | `5001` | Local Functions Emulator |
| **Cloud Storage** | `9199` | Local Storage Emulator |

---

## 🚀 Production Deployment Instructions

Follow these steps to deploy CampusPulse to Firebase Hosting and Cloud Infrastructure:

### 1. Build the Production Client
```bash
npm run build
```
This compiles the minified React/Vite application into `frontend/dist`.

### 2. Authenticate with Firebase CLI
```bash
firebase login
```

### 3. Verify Project Association
Verify that `.firebaserc` targets `campuspuulse`:
```bash
firebase use campuspuulse
```

### 4. Deploy Services
Deploy all assets or individual components:

```bash
# Option A: Deploy everything (Hosting + Rules + Storage + Functions + Indexes)
firebase deploy

# Option B: Deploy frontend application to Firebase Hosting only
npm run deploy:hosting
# (runs: firebase deploy --only hosting)

# Option C: Deploy Security Rules only
npm run deploy:rules
# (runs: firebase deploy --only firestore:rules,storage)
```

### 5. Access Live Application
After deployment, your application is live at:
- **`https://campuspuulse.web.app`**
- **`https://campuspuulse.firebaseapp.com`**

---

## 🧪 Verified Integration Tests

All 25 integration tests have been executed and verified in Phase 11:

```text
================================================================
 TEST EXECUTION SUMMARY: 25 PASSED, 0 FAILED
================================================================
  [PASS] Auth: Formats known Firebase Auth errors to student-friendly messages
  [PASS] Auth: Student Profile Validation rejects invalid / missing inputs
  [PASS] Auth: Student Profile Validation accepts complete student details
  [PASS] Auth: Protected Route guard blocks unauthenticated and wrong-role visitors
  [PASS] Events: validateEventData rejects incomplete or invalid event payloads
  [PASS] Events: validateEventData accepts valid event configuration
  [PASS] Events: Status transitions conform strictly to permitted lifecycles
  [PASS] Events: Unauthorized cross-organizer modification is strictly rejected
  [PASS] Registrations: Deterministic Document ID enforces single pass per student per event
  [PASS] Registrations: Rejects duplicate registration attempt for the same student
  [PASS] Registrations: Rejects registration for cancelled events
  [PASS] Registrations: Rejects registration when deadline has passed
  [PASS] Registrations: Rejects registration when event has reached capacity
  [PASS] Registrations & Concurrency: Simultaneous registration attempts allocate seats atomically
  [PASS] Registrations: Cancellation properly decrements capacity and updates pass status
  [PASS] Security: Public signup strictly forces role to "student" preventing self-elevation
  [PASS] Security: Profile update strips privileged fields (role, uid, email, createdAt)
  [PASS] Security: Students are strictly forbidden from self-marking gate attendance
  [PASS] Security: Cross-organizer participant list access is isolated
  [PASS] Security: Students cannot self-issue certificates
  [PASS] Security: Multi-tenant notification isolation ensures recipients only view their own notifications
  [PASS] Storage: validatePosterFile accepts valid JPEG, PNG, WebP, GIF files <= 5MB
  [PASS] Storage: validatePosterFile rejects unapproved MIME types (PDF, TXT, EXE, MP4)
  [PASS] Storage: validatePosterFile rejects oversized files (> 5MB)
  [PASS] Storage: Constructs canonical poster path matching Storage Security Rules
================================================================
```

---

## 📜 License
MIT License. Created for collegiate clubs, student councils, and campus communities.
