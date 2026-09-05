# EchoraOS — Private AI-Powered Journal & Reflection System

> **Google Cloud Gen AI Academy APAC Ideathon Submission**  
> *“Your story, understood over time.”*

EchoraOS is a production-quality, private AI-powered personal reflection companion. Unlike superficial AI wrappers or simple CRUD diary apps, EchoraOS helps users understand their lived experiences over time. 

Users write entries naturally, while **Gemini 2.5 Flash** discovers recurring themes, tracks implicit goals, synthesizes longitudinal trends, and conducts genuine multi-turn inquiry sessions—**grounded strictly in the user's authorized journal archive with verified interactive source citations and zero cross-tenant leakage**.

---

## 🏛️ System Architecture Diagram

```text
                                  +---------------------------------------+
                                  |         End-User Web Browser          |
                                  +---------------------------------------+
                                           |                     |
                  1. Firebase Auth (JWT)   |                     | 2. Direct Isolated Reads/Writes
                                           v                     v    (users/{uid}/*)
             +-------------------------------+        +-------------------------------+
             |     Firebase Authentication    |        |        Cloud Firestore        |
             |   (Google Sign-In / Email)    |        |    (Strict Security Rules)    |
             +-------------------------------+        +-------------------------------+
                                                                 ^
                                                                 |
                                        3. Scoped Journal Archive| (Passed securely via backend)
                                                                 |
                                  +---------------------------------------+
                                  |     Google Cloud Run Container        |
                                  |        (Express + Vite SPA)           |
                                  |      Health Check: /api/health        |
                                  +---------------------------------------+
                                           |                     ^
                     4. Request Secret     |                     | 5. Injected Key
                                           v                     |
             +-------------------------------+        +-------------------------------+
             |  Google Cloud Secret Manager  |        |    Gemini API (@google/genai) |
             |     (GEMINI_API_KEY Secret)   |------->|      (gemini-2.5-flash)       |
             |  Role: secretmanager.accessor |        |   Multi-turn & Reflection     |
             +-------------------------------+        +-------------------------------+
```

## 🔐 Privacy, Security & GDPR-Aligned Design

EchoraOS is designed around key GDPR principles such as privacy by design, data minimization, data portability, and user control.

| Principle | EchoraOS Implementation |
| :--- | :--- |
| **Data Access & Portability** | Users can export their profile, journal entries, conversations, and generated insights as a structured, machine-readable JSON archive. |
| **Right to Erasure** | A protected Delete All Data workflow permanently removes the user's application data from the supported Firestore collections and clears locally stored application data. |
| **Privacy by Design** | Firestore uses UID-scoped data paths and default-deny Security Rules. Access requires an authenticated Firebase user whose UID matches the requested user's data path. |
| **Data Minimization** | EchoraOS does not include advertising pixels or unnecessary marketing trackers. Journal data is collected for the application's core journaling and reflection functionality. |
| **User Control** | Users can review, export, and delete their stored journal data from Settings. |
| **AI Transparency** | AI-generated reflections are distinguished from source journal content, and grounded responses can reference the underlying journal entries. |

---

## 🔑 Secure Gemini Architecture

### Development

```text
Local .env
    ↓
Express Backend
    ↓
Gemini API
```

The Gemini API key is available only to the server process and is excluded from the frontend bundle and source repository.

### Production

```text
Google Cloud Secret Manager
        ↓
Cloud Run + Least-Privilege IAM
        ↓
Express Backend
        ↓
Gemini API
```

In production, the Gemini credential is supplied to the Cloud Run runtime through Google Cloud Secret Manager. The React/Vite frontend never imports `@google/genai` and never receives the Gemini API credential.

---

## 🛡️ Data Isolation

EchoraOS uses a user-scoped Firestore architecture:

```text
users/{uid}/journalEntries/{entryId}
users/{uid}/conversations/{conversationId}
users/{uid}/insights/{insightId}
```

Firestore Security Rules enforce authentication and UID/path matching, with unauthorized access denied by default.

This means the security boundary is enforced at the database layer, rather than relying solely on frontend filtering.

---

## 🚀 Key Technical Highlights

1. **Zero-Leakage Firestore Data Isolation**:
   - Every single document is strictly scoped:
     - `users/{uid}/journalEntries/{entryId}`
     - `users/{uid}/conversations/{conversationId}`
     - `users/{uid}/conversations/{conversationId}/messages/{messageId}`
     - `users/{uid}/insights/{insightId}`
   - Firestore Security Rules enforce `request.auth != null && request.auth.uid == userId` with default-deny rules across all database collections.

2. **Real Multi-Turn Gemini Conversations with Source Citations**:
   - Powered by `@google/genai` with model `gemini-2.5-flash`.
   - The AI answers questions about past entries (e.g. *"Was I feeling overwhelmed last week?"*, *"What goals did I record?"*).
   - Responses generate interactive citation tokens (`[[REF:entryId|title|date]]`) allowing users to click and inspect the exact source entry that informed the reflection.
   - Strict hallucination controls: The model is instructed to never invent dates or memories, explicitly distinguish evidence from interpretations, state when journal data is missing, and avoid diagnostic/medical claims.

3. **Enterprise Secret Manager & Cloud Run Ready**:
   - Zero secrets are ever exposed in client-side code, frontend bundles, or public environment variables.
   - The Express backend reads secrets via environment variables injected directly by Google Cloud Secret Manager.
   - Includes a production multi-stage `Dockerfile` and automated health check `/api/health`.

4. **Longitudinal Journal Intelligence**:
   - Synthesizes user experiences across 7-day, 14-day, 30-day, or custom timeframes into structured JSON schemas.
   - Identifies recurring themes, meaningful milestones, goals, friction points, reflection questions, and gentle next steps.

---

## 🛠️ Local Development Quickstart

### Prerequisites
- Node.js 20+ or 22+
- Gemini API key (from Google Cloud Vertex AI or Google AI Studio) for local environment testing. *(Note: For production, this key is provisioned exclusively through Google Cloud Secret Manager to Cloud Run).*

### Step 1: Clone and Install
```bash
git clone https://github.com/your-org/echoraos.git
cd echoraos
npm install
```

### Step 2: Configure Environment
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Edit `.env` and provide your Gemini API key:
```env
GEMINI_API_KEY="your-actual-gemini-api-key"
```

### Step 3: Run Development Server
```bash
npm run dev
```
The application will boot at `http://localhost:3000`.

---

## 🔒 Firestore Security Rules (`firestore.rules`)

EchoraOS enforces strict per-user scoping at the database level:

```rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Default deny all access
    match /{document=**} {
      allow read, write: if false;
    }

    // User-scoped isolation: every document must belong to the authenticated UID
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;

      match /journalEntries/{entryId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }

      match /conversations/{conversationId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;

        match /messages/{messageId} {
          allow read, write: if request.auth != null && request.auth.uid == userId;
        }
      }

      match /insights/{insightId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }

      match /settings/{settingId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }
  }
}
```

To deploy rules to Firebase:
```bash
firebase deploy --only firestore:rules
```

---

## ☁️ Google Cloud Run & Secret Manager Deployment

### 1. Set Google Cloud Project
```bash
export PROJECT_ID="your-google-cloud-project-id"
export REGION="asia-southeast1" # Or us-central1
gcloud config set project $PROJECT_ID
```

### 2. Enable Required Google Cloud APIs
```bash
gcloud services enable \
  run.googleapis.com \
  secretmanager.googleapis.com \
  artifactregistry.googleapis.com \
  cloudbuild.googleapis.com
```

### 3. Store the Gemini API Key in Google Cloud Secret Manager
```bash
printf "%s" "YOUR_ACTUAL_GEMINI_API_KEY" | \
  gcloud secrets create GEMINI_API_KEY \
  --data-file=- \
  --replication-policy="automatic"
```

### 4. Create Dedicated Least-Privilege Service Account for Cloud Run
```bash
# Create service account
gcloud iam service-accounts create echoraos-runner \
  --display-name="EchoraOS Cloud Run Runner"

# Grant Secret Manager Secret Accessor role ONLY to this service account
gcloud secrets add-iam-policy-binding GEMINI_API_KEY \
  --member="serviceAccount:echoraos-runner@${PROJECT_ID}.iam.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

### 5. Build and Deploy to Cloud Run
```bash
gcloud run deploy echoraos \
  --source . \
  --region $REGION \
  --platform managed \
  --allow-unauthenticated \
  --port 3000 \
  --service-account "echoraos-runner@${PROJECT_ID}.iam.gserviceaccount.com" \
  --set-secrets="GEMINI_API_KEY=GEMINI_API_KEY:latest"
```

Cloud Run will build the Docker container and output your production HTTPS URL.

---

## 🔍 Verification & Testing Checklist

- [x] **Firebase Authentication**: Supports Google Sign-In, Email/Password, and Showcase Mode.
- [x] **Protected Navigation**: Unauthenticated users cannot access private journal routes.
- [x] **Strict Data Scoping**: All documents are partitioned by `users/{uid}` with deployed security rules.
- [x] **Real Multi-Turn Gemini AI**: Conversation turns persist and use `gemini-2.5-flash`.
- [x] **Grounding & Transparency**: Direct citations link back to underlying journal entries.
- [x] **No Medical/Clinical Claims**: Strict system instructions ensure empathetic self-inquiry without clinical diagnoses.
- [x] **Zero Secret Leakage**: `GEMINI_API_KEY` is only processed server-side.
- [x] **GDPR & Privacy Compliance**: Full JSON data export and "Wipe All Data" functionality.
- [x] **Health Check**: Native `/api/health` for Cloud Run readiness and liveness probes.

---

## 📄 License
Licensed under Apache 2.0. Built for the Google Cloud Gen AI Academy APAC Ideathon.
