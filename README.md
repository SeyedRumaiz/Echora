# ECHORA — Private AI-Powered Journal & Reflection System

> **Google Cloud Gen AI Academy APAC Ideathon Submission**  
> *“Your story, understood over time.”*

ECHORA is a production-quality, private AI-powered personal reflection companion. Unlike superficial AI wrappers or simple CRUD diary apps, ECHORA helps users understand their lived experiences over time. 

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
- Google Cloud Gemini API key (or Google AI Studio key)

### Step 1: Clone and Install
```bash
git clone https://github.com/your-org/echora.git
cd echora
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

ECHORA enforces strict per-user scoping at the database level:

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
gcloud iam service-accounts create echora-runner \
  --display-name="ECHORA Cloud Run Runner"

# Grant Secret Manager Secret Accessor role ONLY to this service account
gcloud secrets add-iam-policy-binding GEMINI_API_KEY \
  --member="serviceAccount:echora-runner@${PROJECT_ID}.iam.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

### 5. Build and Deploy to Cloud Run
```bash
gcloud run deploy echora \
  --source . \
  --region $REGION \
  --platform managed \
  --allow-unauthenticated \
  --port 3000 \
  --service-account "echora-runner@${PROJECT_ID}.iam.gserviceaccount.com" \
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
