# Note App Backend

Express and MongoDB API for the Note App.

**Live API:** https://note-api.iarafathossain.me

## Demo Accounts

Use the following credentials to test the application:

### Admin

- **Email:** `maruf@gmail.com`
- **Password:** `12345678`

### User

- **Email:** `arafat@gmail.com`
- **Password:** `12345678`

## Deployment

Deployed at AWS EC2 with MongoDB Atlas, Nginx reverse proxy, and PM2 process manager.

## Tech stack

- Node.js, Express 5, and TypeScript
- MongoDB with Mongoose
- JWT authentication with HTTP-only cookies
- Zod request validation

## Local development

```bash
git clone https://github.com/iarafathossain/note-app-backend.git
cd note-app-backend
yarn install
```

Create `.env`:

```env
DATABASE_URL=mongodb://localhost:27017/note-app
PORT=8000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
ACCESS_TOKEN_SECRET=replace_with_a_long_random_secret
ACCESS_TOKEN_EXPIRES_IN=15m
REFRESH_TOKEN_SECRET=replace_with_another_long_random_secret
REFRESH_TOKEN_EXPIRES_IN=7d
ACCESS_TOKEN_COOKIE_MAX_AGE=15m
REFRESH_TOKEN_COOKIE_MAX_AGE=7d
```

Start the API:

```bash
yarn dev
```

The API runs at `http://localhost:8000`. Health check: `GET /api/health`.

## Scripts

```bash
yarn dev       # Start with watch mode
yarn build     # Compile TypeScript
yarn start     # Run the compiled server
yarn typecheck # Check types without emitting files
```

## API modules

All routes are prefixed with `/api/v1`:

- `/auth` — register, login, refresh, logout, and current user
- `/users` — admin user management and interest grouping
- `/posts` — public post browsing and authenticated management
- `/notes` — authenticated note management

Requests are validated with Zod, and protected routes use authentication and role-based authorization middleware.

## Authentication cookies

Access and refresh tokens are stored in HTTP-only cookies. Production uses secure, cross-site cookies; local development uses `lax` cookies:

```ts
const authCookieOptions = {
  httpOnly: true,
  secure: envVariables.NODE_ENV === "production",
  sameSite:
    envVariables.NODE_ENV === "production"
      ? ("none" as const)
      : ("lax" as const),
  path: "/",
};
```

`httpOnly` prevents JavaScript access, `secure` requires HTTPS in production, and `sameSite` supports the deployed frontend/backend while remaining convenient locally.

## MongoDB aggregations

### Group users by interest

This pipeline expands each user's interests, removes invalid values, deduplicates users per interest, and returns users grouped alphabetically:

```ts
UserModel.aggregate<GroupedInterest>([
  {
    $unwind: {
      path: "$interests",
      preserveNullAndEmptyArrays: false,
    },
  },
  {
    $match: {
      interests: { $type: "string", $ne: "" },
    },
  },
  {
    $sort: {
      interests: 1,
      _id: 1,
    },
  },
  {
    $group: {
      _id: {
        interest: "$interests",
        userId: "$_id",
      },
      user: {
        $first: {
          _id: "$_id",
          name: "$name",
          email: "$email",
        },
      },
    },
  },
  {
    $group: {
      _id: "$_id.interest",
      users: {
        $push: "$user",
      },
    },
  },
  {
    $project: {
      _id: 0,
      interest: "$_id",
      users: 1,
    },
  },
  {
    $sort: {
      interest: 1,
    },
  },
]);
```

### Return a user's posts

This pipeline joins a user with their posts, sorts by newest first, and returns paginated posts plus a total count:

```ts
const { skip } = getPagination(page, limit);

const [result] = await UserModel.aggregate<GroupedPostsAggregation>([
  {
    $match: {
      _id: new Types.ObjectId(userId),
    },
  },
  {
    $project: {
      _id: 1,
      name: 1,
      email: 1,
    },
  },
  {
    $lookup: {
      from: PostModel.collection.name,
      let: { ownerId: "$_id" },
      pipeline: [
        {
          $match: {
            $expr: {
              $eq: ["$userId", "$$ownerId"],
            },
          },
        },
        { $sort: { createdAt: -1 } },
        {
          $facet: {
            posts: [{ $skip: skip }, { $limit: limit }],
            metadata: [{ $count: "total" }],
          },
        },
      ],
      as: "postData",
    },
  },
  {
    $project: {
      _id: 1,
      name: 1,
      email: 1,
      postData: { $arrayElemAt: ["$postData", 0] },
    },
  },
]);
```




###############৳৳#




I'll structure this as a compact Care Guide Skill Test – Engineering Playbook that you can save as a public GitHub Markdown file.

The goal is to make it useful as an offline reference: when you forget a business rule, you can quickly find the flow, understand the edge cases, and translate the pseudocode into TypeScript, Express, and Mongoose.

I'll include your `AuditLog` model throughout the important operations.

# Care Guide – Engineering Playbook

**Stack:** TypeScript, Express.js, MongoDB, Mongoose, Next.js
**Architecture:** Modular / Layered Architecture
**Frontend:** Next.js, shadcn/ui (Base UI)
**Models:** User, Patient, Coordinator, Caregiver, Visit, CoordinatorAssignment, AuditLog

---

# 1. System Architecture

## User Roles

- ADMIN: Manages users, assignments and system resources.
- COORDINATOR: Manages assigned patients and schedules visits.
- PATIENT: Receives healthcare visits.
- CAREGIVER: Handles assigned visits and attendance.

## Main Relationships

```text
User
 ├── Patient
 ├── Coordinator
 └── Caregiver

Coordinator ── CoordinatorAssignment
Patient     ── CoordinatorAssignment (by number range)

Visit
 ├── Patient
 ├── Coordinator
 └── Caregiver

AuditLog
 └── Actor (User)
```

## Core Rules

1. User authentication and authorization are mandatory.
2. Every role-specific profile references a User.
3. Patient numbers are unique and generated by the backend.
4. Coordinator assignments support future patient creation.
5. Different coordinators cannot own overlapping patient ranges.
6. Caregiver and patient visits cannot overlap.
7. All attendance actions are validated on the backend.
8. Important mutations generate audit logs.
9. Store timestamps in UTC; convert only at application boundaries.

---

# 2. Authentication Flow

## Login

```text
INPUT: email, password

1. Find active user by email.
2. If user not found → reject.
3. Compare password hash.
4. If password invalid → reject.
5. Generate short-lived access token.
6. Generate refresh token.
7. Store refresh session/token securely.
8. Set HTTP-only cookies.
9. Return sanitized user information.

EDGE CASES:
- Invalid credentials.
- Inactive user.
- Expired or revoked refresh token.
- Deleted user.
- Token reuse.
- Multiple login sessions.
- Cookie expiration and CSRF protection.
```

## Refresh Token

```text
1. Read refresh token from cookie.
2. Verify signature and expiration.
3. Find corresponding active session.
4. Verify user still exists and is active.
5. Rotate refresh token.
6. Update stored token/session.
7. Set new cookies.
8. Return success.

ON FAILURE:
- Revoke invalid/reused session when appropriate.
- Clear authentication cookies.
- Return unauthorized.
```

## Logout

```text
1. Identify current session.
2. Revoke refresh session.
3. Clear access and refresh cookies.
4. Record logout audit event if required.
5. Return success.
```

---

# 3. Admin User Creation

## A. Create Coordinator (Transaction)

```text
INPUT:
name, email, password, coordinator details

START TRANSACTION

1. Validate input.
2. Check duplicate email.
3. Hash password.
4. Create User:
   role = COORDINATOR
5. Create Coordinator:
   userId = User._id
6. Create AuditLog:
   action = COORDINATOR_CREATED
   actor = Admin._id
   entityId = Coordinator._id
7. Commit transaction.

IF ANY STEP FAILS:
   Abort transaction.
   Rollback User, Coordinator and AuditLog.
   Return error.

EDGE CASES:
- Duplicate email.
- Invalid role.
- Missing required fields.
- Coordinator creation failure.
- AuditLog creation failure.
- Concurrent duplicate account creation.
```

## B. Create Patient (Transaction)

```text
START TRANSACTION

1. Validate patient information.
2. Generate next unique patientNumber.
3. Create User:
   role = PATIENT
4. Create Patient:
   userId = User._id
   patientNumber = generated number
5. Create AuditLog:
   action = PATIENT_CREATED
6. Commit.

IF FAILURE:
   Rollback everything.

EDGE CASES:
- Duplicate email.
- Patient number collision.
- Concurrent patient creation.
- Patient number generator failure.
- Invalid patient information.
```

**Patient Number Generation**

```text
1. Maintain a Counter document.
2. Atomically increment patient counter.
3. Use returned sequence as patientNumber.
4. Enforce unique database index.
5. If account creation fails, number gaps are acceptable.

NEVER rely on:
Patient.countDocuments() + 1
```

## C. Create Caregiver (Transaction)

```text
START TRANSACTION

1. Validate input.
2. Check duplicate email.
3. Hash password.
4. Create User with role CAREGIVER.
5. Create Caregiver with userId.
6. Create AuditLog.
7. Commit.

ON FAILURE:
   Rollback all operations.
```

---

# 4. Coordinator Patient Range Assignment

## Create Assignment

INPUT:

```json
{
  "coordinatorId": "ID",
  "startPatientNumber": 20,
  "endPatientNumber": 30
}
```

PSEUDOCODE:

```text
1. Verify Admin permission.
2. Validate start <= end.
3. Verify coordinator exists and is active.

4. Find overlapping assignment:

   existing.start <= new.end
   AND
   existing.end >= new.start

5. If overlapping assignment belongs to another
   coordinator → reject.

6. Create CoordinatorAssignment.
7. Create AuditLog.
8. Return success.
```

## Overlap Examples

```text
Coordinator X: 20 - 30

Y: 25 - 40  → REJECT
Y: 30 - 40  → REJECT
Y: 31 - 40  → ALLOW
Y: 10 - 19  → ALLOW
```

## Get Coordinator Patients

```text
INPUT: authenticated coordinatorId

1. Fetch active assignments.
2. Extract assigned patient ranges.
3. Query patients matching ANY range.
4. Apply pagination.
5. Return patients.

QUERY:
patientNumber >= range.start
AND
patientNumber <= range.end

EDGE CASES:
- No assignments → empty array.
- No patients exist in assigned range → empty array.
- Future patient creation → automatically included.
- Coordinator inactive → deny access.
- Patient inactive → apply agreed visibility policy.
- Overlapping ranges → should be prevented.
```

**Important:** Do not store a static patient list inside the coordinator document. Derive access from assignments.

## Update / Delete Assignment

```text
1. Verify Admin.
2. Fetch existing assignment.
3. Validate new range.
4. Check conflicts.
5. Update or deactivate assignment.
6. Write AuditLog with before/after values.
7. Commit.

EDGE CASES:
- Assignment does not exist.
- Coordinator has existing visits.
- Range reduction excludes existing patients.
- Existing scheduled visits become inaccessible.

RULE:
Never silently delete historical assignment data.
Use soft deletion or effective dates if history matters.
```

For simultaneous assignment changes, use transaction-based conflict checks with an appropriate serialization strategy. A query alone does not prevent concurrent overlapping inserts.

---

# 5. Visit Scheduling Flow

## Create Visit (Coordinator)

INPUT:

```json
{
  "patientId": "ID",
  "caregiverId": "ID",
  "scheduledStart": "local datetime",
  "scheduledEnd": "local datetime",
  "timeZone": "business timezone"
}
```

PSEUDOCODE:

```text
1. Authenticate coordinator.
2. Validate request.
3. Find patient.
4. Find caregiver.
5. Verify both are active.
6. Verify patient belongs to coordinator's range.
7. Convert scheduled local times to UTC.
8. Validate start < end.
9. Check caregiver scheduling conflict.
10. Check patient scheduling conflict.
11. Create Visit:
      patientId
      coordinatorId
      caregiverId
      scheduledStartUTC
      scheduledEndUTC
      status = SCHEDULED
12. Create AuditLog:
      action = VISIT_CREATED
      before = null
      after = visit snapshot
13. Return visit.

EDGE CASES:
- Patient does not exist.
- Caregiver does not exist.
- Patient belongs to another coordinator.
- Inactive patient/caregiver.
- Start >= end.
- Scheduling in the past.
- Caregiver already has overlapping visit.
- Patient already has overlapping visit.
- Concurrent scheduling requests.
- Invalid timezone.
```

## Double Booking Prevention

Existing visit overlaps new visit when:

```text
existing.start < new.end
AND
existing.end > new.start
```

Example:

```text
Existing: 09:00 - 11:00

New:      08:00 - 09:00  → ALLOW
New:      09:00 - 10:00  → ALLOW
New:      10:00 - 12:00  → REJECT
New:      11:00 - 12:00  → ALLOW
New:      08:00 - 12:00  → REJECT
```

Check both caregiverId and patientId.

Use a transaction or another concurrency-safe scheduling strategy so two simultaneous requests cannot create conflicting visits.

---

# 6. Timezone Conversion

## Golden Rule

```text
DATABASE = UTC
API INPUT = Explicit local datetime + IANA timezone
API OUTPUT = UTC ISO timestamp + display timezone
FRONTEND = Display in configured business timezone
```

Never manually add/subtract timezone offsets.

Use a timezone-aware library such as date-fns-tz or Luxon.

## Local Time → UTC

Example:

```text
Business timezone: Asia/Dhaka
Local visit start: 2026-11-20 09:00
Local visit end:   2026-11-20 13:00

Convert:
09:00 BD → 03:00 UTC
13:00 BD → 07:00 UTC

Save:
scheduledStart = 2026-11-20T03:00:00.000Z
scheduledEnd   = 2026-11-20T07:00:00.000Z
```

## UTC → Local Display

```text
1. Fetch UTC timestamps.
2. Convert using configured timezone.
3. Format date and time.
4. Display in calendar.
```

## Timezone Edge Cases

```text
- Never assume server timezone.
- Never trust browser timezone for business rules.
- Validate IANA timezone identifier.
- Handle daylight-saving transitions.
- Reject nonexistent local times.
- Resolve ambiguous local times using an explicit policy.
- Store UTC timestamps, not formatted strings.
- Preserve the intended business timezone for display.
- Compare Date timestamps, not formatted strings.
```

Note: Asia/Dhaka currently uses UTC+06:00 without daylight saving, but do not hardcode that offset. Use the IANA timezone identifier.

---

# 7. Caregiver Dashboard

## Get Caregiver Visits

```text
INPUT:
authenticated caregiverId
date range

1. Authenticate caregiver.
2. Fetch visits where caregiverId matches.
3. Filter by requested UTC date range.
4. Resolve current status where needed.
5. Return visit information.
6. Frontend displays calendar.

NEVER accept caregiverId from an untrusted request
when determining ownership.
```

## Calendar Visual Rules

```text
IF visit date < today:
    Previous visit → Gray

ELSE IF visit date = today:
    Today's visit → Highlight + subtle pulse

ELSE:
    Future visit → Blue

STATUS OVERRIDES:
COMPLETED → Green
MISSED → Red
CANCELLED → Muted
IN_PROGRESS → Highlighted active state
```

Compare calendar dates in the business timezone, not the server timezone.

The pulse effect is a frontend-only animation.

---

# 8. Caregiver Check-in Flow

## Business Rules

```text
Scheduled start = 09:00
Check-in opens  = 08:50

Allowed:
08:50 and later, subject to visit validity.

Official attendance:
09:00

Actual recorded action:
Actual click timestamp.
```

## Check-in Pseudocode

```text
1. Authenticate caregiver.
2. Fetch visit.
3. Verify caregiver owns visit.
4. Verify visit is not cancelled/missed/completed.
5. Verify no previous check-in.
6. Get trusted server time in UTC.
7. Calculate:

   checkInOpens = scheduledStart - 10 minutes

8. If now < checkInOpens:
      Reject.

9. If checkout deadline has passed:
      Mark missed where appropriate.
      Reject.

10. Atomically update visit only if:
      status = SCHEDULED
      checkInTime does not exist
      now >= checkInOpens

11. Save:
      checkInTime = scheduledStart
      checkInRecordedAt = now
      status = IN_PROGRESS

12. Create AuditLog.
13. Return updated visit.
```

## Check-in Edge Cases

```text
- Check-in at 08:49 → Reject.
- Check-in at 08:50 → Allow.
- Check-in at 09:00 → Allow.
- Duplicate check-in → Reject.
- Another caregiver → Reject.
- Cancelled visit → Reject.
- Missed visit → Reject.
- Already completed → Reject.
- Concurrent check-in requests → Only one succeeds.
- Client sends fake timestamp → Ignore it.
```

---

# 9. Caregiver Checkout Flow

## Business Rules

```text
Scheduled end = 13:00
Checkout deadline = 13:30

Before 13:00 → Reject
13:00 - 13:30 → Allow
After 13:30 → Reject / Missed

Official checkout = 13:00
Actual recorded action = Real click time
```

## Checkout Pseudocode

```text
1. Authenticate caregiver.
2. Fetch visit.
3. Verify caregiver owns visit.
4. Verify status = IN_PROGRESS.
5. Verify check-in exists.
6. Get trusted server time.
7. Calculate:

   checkoutOpens = scheduledEnd
   checkoutDeadline = scheduledEnd + 30 minutes

8. If now < checkoutOpens:
      Reject.

9. If now > checkoutDeadline:
      Mark MISSED.
      Reject.

10. Atomically update visit if:
      status = IN_PROGRESS
      checkOutTime does not exist
      now >= checkoutOpens
      now <= checkoutDeadline

11. Save:
      checkOutTime = scheduledEnd
      checkOutRecordedAt = now
      status = COMPLETED

12. Create AuditLog.
13. Return updated visit.
```

## Checkout Edge Cases

```text
- Checkout at 12:59 → Reject.
- Checkout at 13:00 → Allow.
- Checkout at 13:15 → Allow.
- Checkout at 13:30 → Allow.
- Checkout at 13:31 → Missed.
- No check-in → Reject.
- Duplicate checkout → Reject.
- Visit cancelled → Reject.
- Visit already missed → Reject.
- Concurrent checkout → Only one succeeds.
```

Boundary convention: The 13:30 deadline is inclusive. Use the same convention in every service and background job.

---

# 10. Missed Visit Background Job

Use node-cron or another job scheduler.

Run periodically, for example every minute.

## Pseudocode

```text
1. Get current UTC time.
2. Find visits where:
      status IN (SCHEDULED, IN_PROGRESS)
      scheduledEnd + 30 minutes <= now
      checkOutTime does not exist

3. Atomically update matching visits:
      status = MISSED

4. Create corresponding AuditLogs.
5. Record job execution result.
```

## Important Edge Cases

```text
- Caregiver never checked in.
- Caregiver checked in but never checked out.
- Caregiver already completed visit.
- Visit cancelled.
- Job runs multiple times.
- Job crashes midway.
- Server restarts.
- Multiple job instances execute simultaneously.
```

Use conditional atomic updates so repeated job execution cannot repeatedly change the same visit.

For audit logging, make the status transition and its audit event atomic where possible. Use an outbox pattern if audit delivery is asynchronous.

Never mark a completed visit as missed.

---

# 11. Visit Update / Cancellation

## Update Visit

```text
1. Authenticate coordinator.
2. Fetch visit.
3. Verify coordinator owns patient/visit.
4. Verify visit is still editable.
5. Validate new schedule.
6. Convert new local time to UTC.
7. Check caregiver conflict.
8. Check patient conflict.
9. Update visit.
10. Create AuditLog:
      action = VISIT_UPDATED
      before = previous values
      after = updated values
11. Commit.
```

If caregiver changes, revalidate the new caregiver's availability.

Never modify historical attendance timestamps when changing the schedule.

## Cancel Visit

```text
1. Authenticate coordinator/admin.
2. Fetch visit.
3. Verify authorization.
4. Reject if completed, unless an explicit correction workflow exists.
5. Set status = CANCELLED.
6. Record cancellation reason.
7. Create AuditLog.
8. Return success.
```

---

# 12. AuditLog Flow

## Suggested AuditLog Structure

```typescript
{
  actorId: ObjectId,
  actorRole: string,

  action: string,
  entityType: string,
  entityId: ObjectId,

  before: Object,
  after: Object,

  metadata: {
    requestId: string,
    ipAddress: string,
    userAgent: string
  },

  createdAt: Date
}
```

## Audit Logging Rules

```text
CREATE:
before = null
after = created data

UPDATE:
before = previous data
after = updated data

DELETE:
before = previous data
after = null

LOGIN:
action = USER_LOGIN

CHECK-IN:
action = VISIT_CHECKED_IN

CHECK-OUT:
action = VISIT_CHECKED_OUT

MISSED:
action = VISIT_MARKED_MISSED
```

## Audit Logging Pseudocode

```text
1. Identify authenticated actor.
2. Capture entity before mutation.
3. Perform business operation.
4. Capture entity after mutation.
5. Create AuditLog.
6. Commit mutation and log together.

IF TRANSACTION FAILS:
   Rollback both.
```

## AuditLog Edge Cases

```text
- Never allow normal users to edit/delete audit logs.
- Do not store passwords, access tokens or refresh tokens.
- Minimize sensitive patient information in snapshots.
- Audit failed critical operations where appropriate.
- Store timestamps in UTC.
- Preserve actor and entity identifiers.
- Avoid logging duplicate events on job retries.
- Use immutable audit records.
- Add pagination and filters to audit history.
```

Audit logs are different from application error logs. Keep both.

---

# 13. Authorization Rules

```text
ADMIN:
- Create users.
- Manage assignments.
- Manage all patients and caregivers.
- View system visits.
- Access audit logs.

COORDINATOR:
- View assigned patients.
- View caregivers.
- Create visits for assigned patients.
- Update/cancel authorized visits.
- View own visit records.

CAREGIVER:
- View own visits.
- Check in to own scheduled visits.
- Check out from own active visits.
- View own attendance history.

PATIENT:
- Access only permitted personal information.
```

## Authorization Pseudocode

```text
1. Verify access token.
2. Fetch active user.
3. Check role permission.
4. Fetch requested resource.
5. Verify resource ownership or assignment.
6. Execute operation.
```

Frontend route protection is not a substitute for backend authorization.

---

# 14. API Development Checklist

## Admin

```text
POST   /users/patients
POST   /users/coordinators
POST   /users/caregivers

GET    /users
GET    /users/:id

POST   /coordinator-assignments
GET    /coordinator-assignments
PATCH  /coordinator-assignments/:id
```

## Coordinator

```text
GET    /coordinator/patients
GET    /coordinator/caregivers

POST   /visits
GET    /visits/coordinator
PATCH  /visits/:id
PATCH  /visits/:id/cancel
```

## Caregiver

```text
GET    /visits/caregiver
GET    /visits/caregiver/calendar

PATCH  /visits/:id/check-in
PATCH  /visits/:id/check-out
```

## Audit

```text
GET    /audit-logs
GET    /audit-logs/:id
```

Admin-only access for audit history.

---

# 15. Recommended Backend Module Structure

```text
src/
├── app/
│   ├── config/
│   ├── errors/
│   ├── middlewares/
│   └── utils/
│
├── modules/
│   ├── auth/
│   ├── user/
│   ├── patient/
│   ├── coordinator/
│   ├── caregiver/
│   ├── coordinator-assignment/
│   ├── visit/
│   └── audit-log/
│
├── jobs/
│   └── missed-visit.job.ts
│
├── routes/
├── app.ts
└── server.ts
```

Each module:

```text
module/
├── module.interface.ts
├── module.model.ts
├── module.validation.ts
├── module.service.ts
├── module.controller.ts
└── module.route.ts
```

Responsibilities:

- Route → Endpoint definitions and middleware.
- Controller → Request/response handling.
- Service → Business logic.
- Model → Database schema and indexes.
- Validation → Input validation.
- Middleware → Authentication and authorization.

---

# 16. Final Testing Checklist

## User Management

- [ ] Duplicate email rejected.
- [ ] User/profile transaction rollback works.
- [ ] Patient number is unique.
- [ ] Password is never returned.

## Coordinator Assignment

- [ ] Valid range accepted.
- [ ] Overlapping range rejected.
- [ ] Future patient automatically appears.
- [ ] Unauthorized patient access rejected.

## Visit Scheduling

- [ ] Valid visit created.
- [ ] Patient ownership validated.
- [ ] Caregiver ownership/availability validated.
- [ ] Patient double booking prevented.
- [ ] Caregiver double booking prevented.
- [ ] Concurrent scheduling handled safely.

## Attendance

- [ ] Check-in 10 minutes early works.
- [ ] Check-in before allowed window rejected.
- [ ] Official check-in time is scheduled start.
- [ ] Early checkout rejected.
- [ ] Checkout within grace period works.
- [ ] Official checkout time is scheduled end.
- [ ] Missing checkout becomes missed.
- [ ] Duplicate attendance requests rejected.

## Timezone

- [ ] UTC storage verified.
- [ ] Local-to-UTC conversion verified.
- [ ] UTC-to-local display verified.
- [ ] Business timezone used consistently.
- [ ] Midnight boundary handled.
- [ ] Daylight-saving edge cases handled where applicable.

## Audit

- [ ] Creation logged.
- [ ] Updates logged with before/after.
- [ ] Attendance logged.
- [ ] Missed status logged.
- [ ] Transaction rollback includes audit event.
- [ ] Audit records cannot be modified by ordinary users.

---

# 17. Development Priority

1. Authentication and authorization.
2. User/profile creation with transactions.
3. Patient number generation.
4. Coordinator range assignments.
5. Coordinator patient dashboard.
6. Visit scheduling and conflict prevention.
7. Caregiver dashboard.
8. Check-in/check-out.
9. Missed visit job.
10. Audit logging and history.
11. Calendar UI and animations.
12. Integration testing and deployment.

**Engineering principle:** Backend is the source of truth. Never trust frontend timestamps, role information, ownership, visit status, or attendance calculations.

### How I recommend using this GitHub document

Save it as:

CARE_GUIDE_ENGINEERING_PLAYBOOK.md

Public GitHub repository · Markdown

 Copy name

One important suggestion: Keep this document generic and don't publish Care Guide's private credentials, actual patient data, internal URLs, API secrets, or confidential business information. Also check your employer's policy before publishing company-specific implementation details.

When using GPT Free without login, you can paste a particular section of this playbook and ask it to convert the pseudocode into TypeScript/Mongoose code. Treat the generated code as a suggestion, and verify it against your actual project architecture.

Your strongest learning opportunity here is understanding the business rules well enough to implement them without relying on AI.

