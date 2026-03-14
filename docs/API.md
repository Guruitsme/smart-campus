# 📡 Smart Campus — API Documentation

**Base URL:** `http://localhost:5000/api`

All protected routes require: `Authorization: Bearer <token>`

---

## 🔐 Authentication

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/auth/register` | Public | Register new user |
| POST | `/auth/login` | Public | Login & get JWT |
| POST | `/auth/refresh` | Public | Refresh access token |
| GET | `/auth/me` | Private | Get current user profile |
| PUT | `/auth/profile` | Private | Update profile |
| PUT | `/auth/change-password` | Private | Change password |
| POST | `/auth/logout` | Private | Logout |

### Login Request
```json
POST /auth/login
{
  "email": "student@campus.edu",
  "password": "Student@123"
}
```

### Login Response
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1...",
  "refreshToken": "eyJhbGciOiJIUzI1...",
  "user": {
    "_id": "...",
    "name": "Arjun Mehta",
    "email": "student@campus.edu",
    "role": "student",
    "department": "Computer Science",
    "semester": 5
  }
}
```

---

## 👨‍🎓 Students

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/students/dashboard` | Student | Dashboard summary |
| GET | `/students/marks` | Student | Internal marks |
| GET | `/students/timetable` | Student | Class timetable |

---

## 👩‍🏫 Faculty

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/faculty/dashboard` | Faculty | Dashboard summary |
| POST | `/faculty/marks` | Faculty | Upload internal marks |
| GET | `/faculty/performance/:subjectId` | Faculty | Student performance |

---

## 🔧 Admin

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/admin/dashboard` | Admin | Platform statistics |
| GET | `/admin/students` | Admin | All students (paginated) |
| GET | `/admin/faculty` | Admin | All faculty |
| POST | `/admin/users` | Admin | Create user |
| PUT | `/admin/users/:id` | Admin | Update user |
| PUT | `/admin/users/:id/toggle-status` | Admin | Activate/deactivate |
| DELETE | `/admin/users/:id` | Admin | Delete user |
| GET | `/admin/subjects` | Admin | All subjects |
| POST | `/admin/subjects` | Admin | Create subject |
| PUT | `/admin/subjects/:id` | Admin | Update subject |
| DELETE | `/admin/subjects/:id` | Admin | Delete subject |
| POST | `/admin/timetable` | Admin | Upload timetable |

---

## 📚 Notes

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/notes` | Private | List notes (with filters) |
| GET | `/notes/:id` | Private | Get single note |
| POST | `/notes` | Faculty/Admin | Upload note file |
| PUT | `/notes/:id` | Faculty/Admin | Update metadata |
| DELETE | `/notes/:id` | Faculty/Admin | Delete note |

### Query Parameters for GET /notes
- `search` — Full-text search
- `subject` — Filter by subject ID
- `department` — Filter by department
- `semester` — Filter by semester
- `page`, `limit` — Pagination

---

## 📅 Attendance

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/attendance` | Faculty | Mark attendance |
| GET | `/attendance/my-attendance` | Student | My attendance summary |
| GET | `/attendance/subject/:subjectId` | Faculty/Admin | Subject attendance |
| PUT | `/attendance/:id` | Faculty | Update attendance |

### Mark Attendance Request
```json
POST /attendance
{
  "subjectId": "...",
  "date": "2024-12-01",
  "semester": 5,
  "department": "Computer Science",
  "records": [
    { "studentId": "...", "status": "present" },
    { "studentId": "...", "status": "absent" }
  ]
}
```

---

## 📝 Assignments

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/assignments` | Private | List assignments |
| POST | `/assignments` | Faculty | Create assignment |
| POST | `/assignments/:id/submit` | Student | Submit assignment |
| GET | `/assignments/:id/submissions` | Faculty | View all submissions |
| PUT | `/assignments/submissions/:id/grade` | Faculty | Grade submission |
| DELETE | `/assignments/:id` | Faculty | Delete assignment |

---

## ⭐ Feedback

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/feedback` | Student | Submit anonymous feedback |
| GET | `/feedback/analytics/:facultyId` | Faculty/Admin | Faculty analytics |
| GET | `/feedback/analytics` | Admin | All faculty analytics |

---

## 📢 Announcements

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/announcements` | Private | List announcements |
| GET | `/announcements/:id` | Private | Get single announcement |
| POST | `/announcements` | Admin/Faculty | Create announcement |
| PUT | `/announcements/:id` | Admin | Update |
| DELETE | `/announcements/:id` | Admin | Delete |

---

## 🔔 Notifications

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/notifications` | Private | Get notifications |
| PUT | `/notifications/mark-all-read` | Private | Mark all read |
| PUT | `/notifications/:id/read` | Private | Mark one read |
| DELETE | `/notifications/:id` | Private | Delete notification |

---

## 📊 Subjects

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/subjects` | Private | List subjects |

---

## Error Response Format

```json
{
  "success": false,
  "message": "Human readable error message"
}
```

## Success Response Format

```json
{
  "success": true,
  "data": { ... },
  "count": 10,
  "total": 50,
  "totalPages": 5,
  "currentPage": 1
}
```
