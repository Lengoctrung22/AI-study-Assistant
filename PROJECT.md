# Project: AI Study Assistant Security Fixes

## Architecture
- **Backend Stack:** Node.js (CommonJS), Express 5.2.1, MongoDB via Mongoose 9.7.3, JWT Authentication.
- **Key Controllers:**
  - `Backend/controllers/quizController.js`: Quiz creation, retake, retrieval, submission, analytics.
  - `Backend/controllers/adminController.js`: Admin user management, roles, system health diagnostics.
- **Frontend Clients:**
  - `Frontend/src/pages/QuizPage.jsx`: Consumes quiz generate/retake/get/submit APIs.
  - `Frontend/src/pages/AdminDashboardPage.jsx`: Consumes admin user role update and system health metrics (`storage`).

## Code Layout
- `Backend/controllers/quizController.js`: Quiz controller functions and response serialization.
- `Backend/controllers/adminController.js`: Admin controller functions (user role management & health check).
- `Backend/models/Quiz.js`: Question schema and Quiz model.
- `Backend/models/User.js`: User schema with role enum `['user', 'admin']`.
- `Backend/scratch/testQuizSanitization.js`: Quiz sanitization verification test suite.
- `Backend/scratch/testAdminSecurity.js`: Admin security & native statfs verification test suite.
- `Backend/scratch/challengeQuizSecurity.js`: Adversarial stress test suite for quiz security.
- `Backend/scratch/challengeAdminSecurity.js`: Adversarial stress test suite for admin security & native health diagnostics.

## Feature Inventory
Every feature from the Survey phase with its assigned milestone:
| # | Feature | Description | Milestone | Status | Source |
|---|---------|-------------|-----------|--------|--------|
| 1 | Quiz Generation Answer Sanitization (R1) | Sanitize created quiz in `generateFromDocument` so answer keys and explanations are omitted when `status !== 'completed'` | M1 | DONE | ORIGINAL_REQUEST §R1, survey |
| 2 | Quiz Retake Answer Sanitization (R1) | Sanitize retaken quiz in `retakeQuiz` so answer keys and explanations are omitted when `status !== 'completed'` | M1 | DONE | ORIGINAL_REQUEST §R1, survey |
| 3 | Single Quiz Sanitization Consistency (R1) | Ensure `getQuiz` applies the exact same sanitization whitelist when `status !== 'completed'` | M1 | DONE | controllers/quizController.js, survey |
| 4 | Multi-Question Type Answer Masking (R1) | Mask all 5 answer fields (`correctAnswer`, `explanation`, `blankAnswer`, `correctBoolean`, `shortAnswer`) across all 4 question types (`mcq`, `fill_blank`, `true_false`, `short_answer`) | M1 | DONE | models/Quiz.js, survey |
| 5 | Admin Self-Demotion Prevention (R2) | Guard `updateUserRole` against admin demoting own role to `'user'`, returning 400 Bad Request with informative message | M2 | DONE | ORIGINAL_REQUEST §R2, survey |
| 6 | Admin Role Update for Other Users (R2) | Allow admin to promote/demote other users to `'admin'` or `'user'` | M2 | DONE | controllers/adminController.js, survey |
| 7 | Native Cross-Platform Disk Health Check (R3) | Replace `child_process.exec` (wmic/df) in `getHealth` with native `fs.promises.statfs(process.cwd())` | M3 | DONE | ORIGINAL_REQUEST §R3, survey |
| 8 | Disk Health Formatting Compatibility (R3) | Maintain storage health payload format (`status: 'healthy'`, `freeSpace: '... available'`, `percentFree: '...%'`) | M3 | DONE | controllers/adminController.js, survey |
| 9 | Comprehensive Security & Regression Verification | Automated test suites and adversarial challenge harnesses verifying R1, R2, R3, edge cases, and ensuring 0 regressions | M4 | DONE | ORIGINAL_REQUEST Acceptance Criteria |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Quiz Answer Sanitization (R1) | `Backend/controllers/quizController.js` (`sanitizeQuiz`, `generateFromDocument`, `retakeQuiz`, `getQuiz`) | none | DONE |
| M2 | Admin Self-Demotion Guard (R2) | `Backend/controllers/adminController.js` (`updateUserRole`) | none | DONE |
| M3 | Native Disk Health Inspection (R3) | `Backend/controllers/adminController.js` (`getHealth`, remove `child_process`) | none | DONE |
| M4 | Comprehensive Verification & Auditing | Automated test suites (`testQuizSanitization.js`, `testAdminSecurity.js`, `challengeQuizSecurity.js`, `challengeAdminSecurity.js`), multi-agent review, challenge, and forensic audit | M1, M2, M3 | DONE |

## Interface Contracts
### Quiz Controller ↔ Client API
- **Sanitized Question Whitelist:** `{ _id, question, type, options, topic }`
- **Sanitized Response Conditions:** Whenever `quiz.status !== 'completed'`.
- **Post-Submission Response:** Full question details including `correctAnswer`, `explanation`, `blankAnswer`, `correctBoolean`, `shortAnswer` returned upon grading completion (`submitQuiz`).

### Admin Controller ↔ Client API
- **Self-Demotion Attempt (`userId === req.user._id.toString() && role === 'user'`):** HTTP `400 Bad Request` `{ message: 'Bạn không thể tự hạ quyền tài khoản của chính mình' }`.
- **Health Check Response (`GET /api/admin/health`):** HTTP `200 OK` `{ database, geminiApi, storage: { status, freeSpace, percentFree }, timestamp }`. No child process execution.
