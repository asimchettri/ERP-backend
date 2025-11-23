# Backend DASS - Comprehensive API Documentation
## Complete Guide for Frontend Integration & Testing

**Version:** 1.0.0  
**Last Updated:** November 18, 2025  
**Base URL:** `http://localhost:3000` (Development) | `https://your-domain.com` (Production)

---

## 📋 Table of Contents

1. [Authentication Module](#authentication-module)
2. [Attendance Module](#attendance-module)
3. [Classes & Subjects Module](#classes--subjects-module)
4. [Exam & Grading Module](#exam--grading-module)
5. [Fee Management Module](#fee-management-module)
6. [Teacher Management Module](#teacher-management-module)
7. [Parent Management Module](#parent-management-module)
8. [Timetable Module](#timetable-module)
9. [Holiday Module](#holiday-module)
10. [Student Management Module](#student-management-module)
11. [Common Headers & Authentication](#common-headers--authentication)

---

## 🔐 Common Headers & Authentication

### Required Headers for All Protected Endpoints

```bash
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

### Authentication Roles

- **SUPER_ADMIN** - System-level access
- **SCHOOL_ADMIN** - School-level administrative access
- **TEACHER** - Teacher access to specific endpoints
- **STUDENT** - Student access (limited)
- **PARENT** - Parent access (view-only for students)

---

## 🔑 Authentication Module

**Base URL:** `/auth`

### 1. Login
**Endpoint:** `POST /auth/login`  
**Authentication:** ❌ Public (No JWT required)  
**Role Required:** None

**Request Body:**
```json
{
  "email": "admin@school.edu",
  "password": "password123"
}
```

**Response (200 OK):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "admin@school.edu",
    "role": "SUPER_ADMIN",
    "firstName": "Admin",
    "lastName": "User",
    "schoolId": "uuid",
    "isActive": true
  }
}
```

**Test Credentials:**
- **Super Admin:** email: `admin@school.edu`, password: `admin123`
- **School Admin:** email: `admin@school.com`, password: `school123`
- **Teacher:** email: `teacher@school.edu`, password: `teacher123`
- **Student:** email: `student@school.edu`, password: `student123`

---

### 2. Refresh Token
**Endpoint:** `POST /auth/refresh`  
**Authentication:** ❌ Public  
**Role Required:** None

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response (200 OK):**
```json
{
  "accessToken": "new_access_token",
  "refreshToken": "new_refresh_token"
}
```

---

### 3. Get Current User Profile
**Endpoint:** `GET /auth/me`  
**Authentication:** ✅ Required (JWT)  
**Role Required:** All roles

**Response (200 OK):**
```json
{
  "id": "uuid",
  "email": "user@school.edu",
  "role": "TEACHER",
  "firstName": "John",
  "lastName": "Doe",
  "schoolId": "uuid",
  "isActive": true
}
```

---

### 4. Change Password
**Endpoint:** `POST /auth/change-password`  
**Authentication:** ✅ Required (JWT)  
**Role Required:** All roles

**Request Body:**
```json
{
  "oldPassword": "password123",
  "newPassword": "newpassword456"
}
```

**Response (200 OK):**
```json
{
  "message": "Password changed successfully"
}
```

---

### 5. Logout
**Endpoint:** `POST /auth/logout`  
**Authentication:** ✅ Required (JWT)  
**Role Required:** All roles

**Response (200 OK):**
```json
{
  "message": "Logged out successfully"
}
```

---

## 📚 Attendance Module

**Base URL:** `/attendance`

### 1. Mark Attendance (Single Student)
**Endpoint:** `POST /attendance`  
**Authentication:** ✅ Required  
**Role Required:** TEACHER, SCHOOL_ADMIN

**Request Body:**
```json
{
  "studentId": "uuid",
  "classId": "uuid",
  "date": "2025-11-18",
  "status": "PRESENT",
  "remarks": "Optional remarks"
}
```

**Response (201 Created):**
```json
{
  "id": "uuid",
  "studentId": "uuid",
  "classId": "uuid",
  "date": "2025-11-18",
  "status": "PRESENT",
  "remarks": "Optional remarks",
  "createdAt": "2025-11-18T10:00:00Z"
}
```

**Status Values:** `PRESENT`, `ABSENT`, `LATE`, `EXCUSED`

---

### 2. Mark Attendance (Bulk - Multiple Students)
**Endpoint:** `POST /attendance/bulk`  
**Authentication:** ✅ Required  
**Role Required:** TEACHER, SCHOOL_ADMIN

**Request Body:**
```json
{
  "classId": "uuid",
  "date": "2025-11-18",
  "attendanceRecords": [
    {
      "studentId": "uuid1",
      "status": "PRESENT"
    },
    {
      "studentId": "uuid2",
      "status": "ABSENT"
    },
    {
      "studentId": "uuid3",
      "status": "LATE"
    }
  ]
}
```

**Response (201 Created):**
```json
{
  "message": "Bulk attendance marked successfully",
  "count": 3
}
```

---

### 3. Get Attendance with Filters & Pagination
**Endpoint:** `GET /attendance/search`  
**Authentication:** ✅ Required  
**Role Required:** STUDENT, TEACHER, SCHOOL_ADMIN

**Query Parameters:**
```
?classId=uuid&studentId=uuid&startDate=2025-11-01&endDate=2025-11-30&status=PRESENT&page=1&limit=10
```

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": "uuid",
      "studentId": "uuid",
      "classId": "uuid",
      "date": "2025-11-18",
      "status": "PRESENT",
      "createdAt": "2025-11-18T10:00:00Z"
    }
  ],
  "meta": {
    "total": 50,
    "page": 1,
    "limit": 10,
    "totalPages": 5,
    "hasNextPage": true,
    "hasPreviousPage": false
  }
}
```

---

### 4. Get Attendance for a Class
**Endpoint:** `GET /attendance/class/:classId`  
**Authentication:** ✅ Required  
**Role Required:** TEACHER, SCHOOL_ADMIN

**Response (200 OK):**
```json
{
  "classId": "uuid",
  "className": "Class 10-A",
  "totalStudents": 45,
  "presentCount": 42,
  "absentCount": 3,
  "attendancePercentage": 93.33,
  "attendanceRecords": [
    {
      "studentId": "uuid",
      "studentName": "Alice Johnson",
      "status": "PRESENT",
      "date": "2025-11-18"
    }
  ]
}
```

---

### 5. Get Attendance Report
**Endpoint:** `GET /attendance/report`  
**Authentication:** ✅ Required  
**Role Required:** TEACHER, SCHOOL_ADMIN

**Query Parameters:**
```
?classId=uuid&studentId=uuid&month=11&year=2025
```

**Response (200 OK):**
```json
{
  "period": "November 2025",
  "totalDays": 22,
  "students": [
    {
      "studentId": "uuid",
      "studentName": "Alice Johnson",
      "presentDays": 20,
      "absentDays": 2,
      "attendancePercentage": 90.9,
      "status": "Good"
    }
  ]
}
```

---

## 🏫 Classes & Subjects Module

**Base URL:** `/classes`, `/subjects`, `/class-subjects`, `/departments`

### Classes Endpoints

#### 1. Create Class
**Endpoint:** `POST /classes`  
**Authentication:** ✅ Required  
**Role Required:** SUPER_ADMIN, SCHOOL_ADMIN

**Request Body:**
```json
{
  "grade": 10,
  "section": "A",
  "academicYearId": "uuid",
  "classTeacherId": "uuid",
  "capacity": 45,
  "roomId": "uuid"
}
```

**Response (201 Created):**
```json
{
  "id": "uuid",
  "grade": 10,
  "section": "A",
  "academicYearId": "uuid",
  "classTeacherId": "uuid",
  "capacity": 45,
  "roomId": "uuid",
  "studentCount": 0,
  "createdAt": "2025-11-18T10:00:00Z"
}
```

---

#### 2. Get All Classes
**Endpoint:** `GET /classes`  
**Authentication:** ✅ Required  
**Role Required:** SUPER_ADMIN, SCHOOL_ADMIN, TEACHER

**Query Parameters:**
```
?grade=10&section=A&academicYearId=uuid&page=1&limit=10&sortBy=grade&sortOrder=asc
```

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": "uuid",
      "grade": 10,
      "section": "A",
      "studentCount": 45,
      "classTeacher": {
        "id": "uuid",
        "firstName": "John",
        "lastName": "Doe"
      }
    }
  ],
  "meta": {
    "total": 12,
    "page": 1,
    "limit": 10,
    "totalPages": 2,
    "hasNextPage": true
  }
}
```

---

#### 3. Get Class by ID
**Endpoint:** `GET /classes/:id`  
**Authentication:** ✅ Required  
**Role Required:** SUPER_ADMIN, SCHOOL_ADMIN, TEACHER

**Response (200 OK):**
```json
{
  "id": "uuid",
  "grade": 10,
  "section": "A",
  "academicYear": {
    "id": "uuid",
    "year": 2024
  },
  "classTeacher": {
    "id": "uuid",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@school.edu"
  },
  "room": {
    "id": "uuid",
    "name": "Room 101"
  },
  "studentCount": 45,
  "subjects": 8
}
```

---

#### 4. Update Class
**Endpoint:** `PATCH /classes/:id`  
**Authentication:** ✅ Required  
**Role Required:** SUPER_ADMIN, SCHOOL_ADMIN

**Request Body:**
```json
{
  "section": "B",
  "capacity": 50,
  "classTeacherId": "uuid"
}
```

**Response (200 OK):**
```json
{
  "id": "uuid",
  "grade": 10,
  "section": "B",
  "capacity": 50,
  "updatedAt": "2025-11-18T11:00:00Z"
}
```

---

#### 5. Delete Class
**Endpoint:** `DELETE /classes/:id`  
**Authentication:** ✅ Required  
**Role Required:** SUPER_ADMIN, SCHOOL_ADMIN

**Response (204 No Content)**

---

### Subjects Endpoints

#### 1. Create Subject
**Endpoint:** `POST /subjects`  
**Authentication:** ✅ Required  
**Role Required:** SUPER_ADMIN, SCHOOL_ADMIN

**Request Body:**
```json
{
  "name": "English",
  "code": "ENG101",
  "description": "English Language",
  "subjectType": "THEORY",
  "maxMarks": 100
}
```

**Response (201 Created):**
```json
{
  "id": "uuid",
  "name": "English",
  "code": "ENG101",
  "maxMarks": 100,
  "createdAt": "2025-11-18T10:00:00Z"
}
```

---

#### 2. Get All Subjects
**Endpoint:** `GET /subjects`  
**Authentication:** ✅ Required  
**Role Required:** SUPER_ADMIN, SCHOOL_ADMIN, TEACHER

**Query Parameters:**
```
?subjectType=THEORY&page=1&limit=20
```

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "English",
      "code": "ENG101",
      "maxMarks": 100,
      "subjectType": "THEORY"
    }
  ],
  "meta": {
    "total": 12,
    "page": 1,
    "limit": 20,
    "totalPages": 1
  }
}
```

---

#### 3. Update Subject
**Endpoint:** `PUT /subjects/:id`  
**Authentication:** ✅ Required  
**Role Required:** SUPER_ADMIN, SCHOOL_ADMIN

**Request Body:**
```json
{
  "maxMarks": 150,
  "description": "Updated description"
}
```

**Response (200 OK):**
```json
{
  "id": "uuid",
  "name": "English",
  "maxMarks": 150,
  "updatedAt": "2025-11-18T11:00:00Z"
}
```

---

### Class-Subjects Endpoints

#### 1. Assign Subject to Class
**Endpoint:** `POST /class-subjects/assign`  
**Authentication:** ✅ Required  
**Role Required:** SUPER_ADMIN, SCHOOL_ADMIN

**Request Body:**
```json
{
  "classId": "uuid",
  "subjectId": "uuid",
  "teacherId": "uuid",
  "periodsPerWeek": 4,
  "maxMarks": 100,
  "weightage": 0.1,
  "isOptional": false,
  "displayOrder": 1
}
```

**Response (201 Created):**
```json
{
  "id": "uuid",
  "classId": "uuid",
  "subjectId": "uuid",
  "subject": {
    "id": "uuid",
    "name": "English",
    "code": "ENG101"
  },
  "teacher": {
    "id": "uuid",
    "firstName": "Jane",
    "lastName": "Smith"
  },
  "periodsPerWeek": 4,
  "maxMarks": 100
}
```

---

#### 2. Get Class Subjects
**Endpoint:** `GET /class-subjects/:classId`  
**Authentication:** ✅ Required  
**Role Required:** SUPER_ADMIN, SCHOOL_ADMIN, TEACHER

**Response (200 OK):**
```json
{
  "classId": "uuid",
  "className": "Class 10-A",
  "subjects": [
    {
      "id": "uuid",
      "subjectName": "English",
      "teacherName": "Jane Smith",
      "maxMarks": 100,
      "periodsPerWeek": 4,
      "isOptional": false
    }
  ]
}
```

---

#### 3. Update Class Subject
**Endpoint:** `PATCH /class-subjects/:id`  
**Authentication:** ✅ Required  
**Role Required:** SUPER_ADMIN, SCHOOL_ADMIN

**Request Body:**
```json
{
  "teacherId": "uuid",
  "periodsPerWeek": 5,
  "maxMarks": 120
}
```

**Response (200 OK):**
```json
{
  "id": "uuid",
  "periodsPerWeek": 5,
  "maxMarks": 120,
  "updatedAt": "2025-11-18T11:00:00Z"
}
```

---

## 📝 Exam & Grading Module

**Base URL:** `/exam-grading`

### 1. Create Exam Type
**Endpoint:** `POST /exam-grading/exam-types`  
**Authentication:** ✅ Required  
**Role Required:** SUPER_ADMIN, SCHOOL_ADMIN

**Request Body:**
```json
{
  "name": "Midterm",
  "code": "MID",
  "description": "Midterm examination"
}
```

**Response (201 Created):**
```json
{
  "id": "uuid",
  "name": "Midterm",
  "code": "MID",
  "description": "Midterm examination",
  "createdAt": "2025-11-18T10:00:00Z"
}
```

---

### 2. Get All Exam Types
**Endpoint:** `GET /exam-grading/exam-types`  
**Authentication:** ✅ Required  
**Role Required:** SUPER_ADMIN, SCHOOL_ADMIN, TEACHER

**Response (200 OK):**
```json
[
  {
    "id": "uuid",
    "name": "Midterm",
    "code": "MID",
    "description": "Midterm examination"
  }
]
```

---

### 3. Create Exam
**Endpoint:** `POST /exam-grading/exams`  
**Authentication:** ✅ Required  
**Role Required:** SUPER_ADMIN, SCHOOL_ADMIN, TEACHER

**Request Body:**
```json
{
  "classId": "uuid",
  "subjectId": "uuid",
  "examTypeId": "uuid",
  "date": "2025-12-01",
  "startTime": "09:00",
  "endTime": "11:00",
  "maxMarks": 100,
  "passingMarks": 40,
  "totalQuestions": 50
}
```

**Response (201 Created):**
```json
{
  "id": "uuid",
  "classId": "uuid",
  "subjectId": "uuid",
  "date": "2025-12-01",
  "maxMarks": 100,
  "passingMarks": 40,
  "createdAt": "2025-11-18T10:00:00Z"
}
```

---

### 4. Get All Exams
**Endpoint:** `GET /exam-grading/exams`  
**Authentication:** ✅ Required  
**Role Required:** SUPER_ADMIN, SCHOOL_ADMIN, TEACHER

**Query Parameters:**
```
?classId=uuid&subjectId=uuid&examTypeId=uuid&page=1&limit=10
```

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": "uuid",
      "className": "Class 10-A",
      "subjectName": "English",
      "examType": "Midterm",
      "date": "2025-12-01",
      "maxMarks": 100,
      "gradesCount": 42,
      "pendingCount": 3
    }
  ],
  "meta": {
    "total": 24,
    "page": 1,
    "limit": 10
  }
}
```

---

### 5. Enter Grade for Student
**Endpoint:** `POST /exam-grading/grades`  
**Authentication:** ✅ Required  
**Role Required:** SUPER_ADMIN, SCHOOL_ADMIN, TEACHER

**Request Body:**
```json
{
  "examId": "uuid",
  "studentId": "uuid",
  "marksObtained": 85,
  "remarks": "Good performance"
}
```

**Response (201 Created):**
```json
{
  "id": "uuid",
  "examId": "uuid",
  "studentId": "uuid",
  "marksObtained": 85,
  "grade": "A",
  "status": "PASSED",
  "remarks": "Good performance",
  "createdAt": "2025-11-18T10:00:00Z"
}
```

---

### 6. Bulk Grade Entry
**Endpoint:** `POST /exam-grading/bulk-grades`  
**Authentication:** ✅ Required  
**Role Required:** SUPER_ADMIN, SCHOOL_ADMIN, TEACHER

**Request Body:**
```json
{
  "examId": "uuid",
  "grades": [
    {
      "studentId": "uuid1",
      "marksObtained": 85
    },
    {
      "studentId": "uuid2",
      "marksObtained": 92
    }
  ]
}
```

**Response (201 Created):**
```json
{
  "message": "Grades entered successfully",
  "count": 2
}
```

---

### 7. Get Student Marksheet
**Endpoint:** `GET /exam-grading/student/:studentId/marksheet`  
**Authentication:** ✅ Required  
**Role Required:** SUPER_ADMIN, SCHOOL_ADMIN, TEACHER, STUDENT

**Query Parameters:**
```
?academicYearId=uuid
```

**Response (200 OK):**
```json
{
  "studentName": "Alice Johnson",
  "studentId": "uuid",
  "className": "Class 10-A",
  "academicYear": 2024,
  "exams": [
    {
      "examType": "Midterm",
      "subjectName": "English",
      "marksObtained": 85,
      "maxMarks": 100,
      "percentage": 85,
      "grade": "A",
      "status": "PASSED"
    }
  ],
  "totalMarks": 500,
  "totalObtained": 425,
  "overallPercentage": 85,
  "overallGrade": "A"
}
```

---

### 8. Get Class Result
**Endpoint:** `GET /exam-grading/class/:classId/result`  
**Authentication:** ✅ Required  
**Role Required:** SUPER_ADMIN, SCHOOL_ADMIN, TEACHER

**Query Parameters:**
```
?examTypeId=uuid&academicYearId=uuid
```

**Response (200 OK):**
```json
{
  "classId": "uuid",
  "className": "Class 10-A",
  "totalStudents": 45,
  "results": [
    {
      "studentId": "uuid",
      "studentName": "Alice Johnson",
      "marksObtained": 425,
      "maxMarks": 500,
      "percentage": 85,
      "grade": "A",
      "status": "PASSED"
    }
  ],
  "statistics": {
    "passCount": 42,
    "failCount": 3,
    "passPercentage": 93.33,
    "averageMarks": 405
  }
}
```

---

## 💰 Fee Management Module

**Base URL:** `/fee-management`

### 1. Create Fee Type
**Endpoint:** `POST /fee-management/fee-types`  
**Authentication:** ✅ Required  
**Role Required:** SUPER_ADMIN, SCHOOL_ADMIN

**Request Body:**
```json
{
  "name": "Tuition Fee",
  "code": "TUITION",
  "description": "Monthly tuition fee",
  "amount": 5000
}
```

**Response (201 Created):**
```json
{
  "id": "uuid",
  "name": "Tuition Fee",
  "code": "TUITION",
  "amount": 5000,
  "createdAt": "2025-11-18T10:00:00Z"
}
```

---

### 2. Get All Fee Types
**Endpoint:** `GET /fee-management/fee-types`  
**Authentication:** ✅ Required  
**Role Required:** SUPER_ADMIN, SCHOOL_ADMIN, TEACHER

**Query Parameters:**
```
?includeInactive=false
```

**Response (200 OK):**
```json
[
  {
    "id": "uuid",
    "name": "Tuition Fee",
    "code": "TUITION",
    "amount": 5000,
    "isActive": true
  }
]
```

---

### 3. Create Fee Structure
**Endpoint:** `POST /fee-management/fee-structures`  
**Authentication:** ✅ Required  
**Role Required:** SUPER_ADMIN, SCHOOL_ADMIN

**Request Body:**
```json
{
  "name": "Class 10-A Fee Structure 2024-25",
  "classId": "uuid",
  "academicYearId": "uuid",
  "installmentType": "QUARTERLY",
  "items": [
    {
      "feeTypeId": "uuid",
      "amount": 5000,
      "isOptional": false
    }
  ]
}
```

**Response (201 Created):**
```json
{
  "id": "uuid",
  "name": "Class 10-A Fee Structure 2024-25",
  "totalAmount": 5000,
  "installmentType": "QUARTERLY",
  "items": [
    {
      "id": "uuid",
      "feeTypeName": "Tuition Fee",
      "amount": 5000,
      "isOptional": false
    }
  ],
  "installments": [
    {
      "id": "uuid",
      "installmentNumber": 1,
      "dueDate": "2025-06-30",
      "amount": 1250
    }
  ],
  "createdAt": "2025-11-18T10:00:00Z"
}
```

---

### 4. Assign Fee to Student
**Endpoint:** `POST /fee-management/student-fees`  
**Authentication:** ✅ Required  
**Role Required:** SUPER_ADMIN, SCHOOL_ADMIN

**Request Body:**
```json
{
  "studentId": "uuid",
  "feeStructureId": "uuid",
  "discountAmount": 0
}
```

**Response (201 Created):**
```json
{
  "id": "uuid",
  "studentId": "uuid",
  "feeStructureId": "uuid",
  "totalAmount": 5000,
  "discountAmount": 0,
  "payableAmount": 5000,
  "paidAmount": 0,
  "dueAmount": 5000,
  "createdAt": "2025-11-18T10:00:00Z"
}
```

---

### 5. Create Fee Payment
**Endpoint:** `POST /fee-management/payments`  
**Authentication:** ✅ Required  
**Role Required:** SUPER_ADMIN, SCHOOL_ADMIN

**Request Body:**
```json
{
  "studentFeeId": "uuid",
  "amount": 1250,
  "paymentDate": "2025-11-18",
  "paymentMode": "CASH",
  "transactionId": "TXN123456",
  "remarks": "First installment payment"
}
```

**Response (201 Created):**
```json
{
  "id": "uuid",
  "studentFeeId": "uuid",
  "amount": 1250,
  "paymentDate": "2025-11-18",
  "paymentMode": "CASH",
  "status": "SUCCESS",
  "receipt": {
    "receiptNumber": "REC/2025/001",
    "receiptDate": "2025-11-18",
    "amount": 1250
  },
  "createdAt": "2025-11-18T10:00:00Z"
}
```

---

### 6. Get Student Fee Summary
**Endpoint:** `GET /fee-management/student/:studentId/summary`  
**Authentication:** ✅ Required  
**Role Required:** SUPER_ADMIN, SCHOOL_ADMIN, TEACHER, STUDENT

**Query Parameters:**
```
?academicYearId=uuid
```

**Response (200 OK):**
```json
{
  "studentName": "Alice Johnson",
  "studentId": "uuid",
  "className": "Class 10-A",
  "totalFeeAmount": 60000,
  "paidAmount": 15000,
  "dueAmount": 45000,
  "paymentStatus": "PARTIAL",
  "feeStructures": [
    {
      "id": "uuid",
      "name": "Quarterly Fee",
      "totalAmount": 60000,
      "paidAmount": 15000,
      "dueAmount": 45000,
      "installments": [
        {
          "installmentNumber": 1,
          "dueDate": "2025-06-30",
          "amount": 15000,
          "paidAmount": 15000,
          "status": "PAID"
        }
      ]
    }
  ]
}
```

---

### 7. Get Fee Dashboard Summary
**Endpoint:** `GET /fee-management/dashboard/summary`  
**Authentication:** ✅ Required  
**Role Required:** SUPER_ADMIN, SCHOOL_ADMIN

**Query Parameters:**
```
?academicYearId=uuid
```

**Response (200 OK):**
```json
{
  "totalFeeCollected": 500000,
  "totalFeeStructures": 12,
  "studentsWithPendingFee": 15,
  "totalPendingFee": 125000,
  "collectionPercentage": 80,
  "paymentModeBreakdown": {
    "CASH": 250000,
    "CHEQUE": 150000,
    "ONLINE": 100000
  }
}
```

---

### 8. Outstanding Fee Report
**Endpoint:** `GET /fee-management/reports/outstanding-fee`  
**Authentication:** ✅ Required  
**Role Required:** SUPER_ADMIN, SCHOOL_ADMIN

**Query Parameters:**
```
?classId=uuid&academicYearId=uuid&daysOverdue=30
```

**Response (200 OK):**
```json
{
  "reportDate": "2025-11-18",
  "totalOutstanding": 125000,
  "totalDefaulters": 15,
  "defaulters": [
    {
      "studentId": "uuid",
      "studentName": "Bob Williams",
      "className": "Class 10-A",
      "dueAmount": 15000,
      "daysOverdue": 45,
      "parentName": "Bob Senior",
      "parentPhone": "+1-555-1234"
    }
  ]
}
```

---

## 👨‍🏫 Teacher Management Module

**Base URL:** `/teachers`

### 1. Create Teacher
**Endpoint:** `POST /teachers`  
**Authentication:** ✅ Required  
**Role Required:** SUPER_ADMIN, SCHOOL_ADMIN

**Request Body:**
```json
{
  "email": "jane.doe@school.edu",
  "password": "secure_password",
  "firstName": "Jane",
  "lastName": "Doe",
  "schoolId": "uuid",
  "qualification": "M.Sc",
  "experience": 5,
  "departmentId": "uuid",
  "dateOfBirth": "1990-05-15",
  "phone": "+1-555-1234",
  "gender": "FEMALE",
  "address": "123 Main St"
}
```

**Response (201 Created):**
```json
{
  "id": "uuid",
  "email": "jane.doe@school.edu",
  "firstName": "Jane",
  "lastName": "Doe",
  "qualification": "M.Sc",
  "experience": 5,
  "department": {
    "id": "uuid",
    "name": "Science"
  },
  "createdAt": "2025-11-18T10:00:00Z"
}
```

---

### 2. Get All Teachers
**Endpoint:** `GET /teachers`  
**Authentication:** ✅ Required  
**Role Required:** SUPER_ADMIN, SCHOOL_ADMIN, TEACHER

**Query Parameters:**
```
?schoolId=uuid&departmentId=uuid&page=1&limit=10
```

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": "uuid",
      "firstName": "Jane",
      "lastName": "Doe",
      "email": "jane@school.edu",
      "experience": 5,
      "departmentName": "Science",
      "isActive": true
    }
  ],
  "meta": {
    "total": 25,
    "page": 1,
    "limit": 10
  }
}
```

---

### 3. Get Teacher by ID
**Endpoint:** `GET /teachers/:id`  
**Authentication:** ✅ Required  
**Role Required:** SUPER_ADMIN, SCHOOL_ADMIN, TEACHER

**Response (200 OK):**
```json
{
  "id": "uuid",
  "firstName": "Jane",
  "lastName": "Doe",
  "email": "jane@school.edu",
  "qualification": "M.Sc",
  "experience": 5,
  "department": {
    "id": "uuid",
    "name": "Science"
  },
  "subjects": [
    {
      "id": "uuid",
      "name": "Physics",
      "code": "PHY101"
    }
  ],
  "isActive": true
}
```

---

### 4. Update Teacher
**Endpoint:** `PATCH /teachers/:id`  
**Authentication:** ✅ Required  
**Role Required:** SUPER_ADMIN, SCHOOL_ADMIN, TEACHER

**Request Body:**
```json
{
  "qualification": "PhD",
  "experience": 6,
  "phone": "+1-555-5678"
}
```

**Response (200 OK):**
```json
{
  "id": "uuid",
  "firstName": "Jane",
  "lastName": "Doe",
  "qualification": "PhD",
  "experience": 6,
  "updatedAt": "2025-11-18T11:00:00Z"
}
```

---

### 5. Delete Teacher
**Endpoint:** `DELETE /teachers/:id`  
**Authentication:** ✅ Required  
**Role Required:** SUPER_ADMIN, SCHOOL_ADMIN

**Response (204 No Content)**

---

### 6. Get Teacher Dashboard
**Endpoint:** `GET /teachers/:id/dashboard`  
**Authentication:** ✅ Required  
**Role Required:** SUPER_ADMIN, SCHOOL_ADMIN, TEACHER

**Query Parameters:**
```
?period=month
```

**Response (200 OK):**
```json
{
  "teacherId": "uuid",
  "teacherName": "Jane Doe",
  "stats": {
    "totalClasses": 5,
    "totalStudents": 220,
    "totalSubjects": 2,
    "upcomingExams": 3,
    "pendingGrades": 12
  },
  "classesOverview": [
    {
      "classId": "uuid",
      "className": "Class 10-A",
      "enrollment": 45,
      "presentToday": 42,
      "attendancePercentage": 93.33
    }
  ],
  "upcomingExams": [
    {
      "examId": "uuid",
      "examType": "Midterm",
      "subjectName": "Physics",
      "date": "2025-12-01",
      "totalStudents": 45,
      "gradedCount": 0
    }
  ],
  "recentAttendance": [
    {
      "date": "2025-11-18",
      "classId": "uuid",
      "className": "Class 10-A",
      "presentCount": 42,
      "totalStudents": 45,
      "percentage": 93.33
    }
  ],
  "todayTimetable": [
    {
      "slotTime": "09:00-10:00",
      "className": "Class 10-A",
      "subjectName": "Physics",
      "roomName": "Room 201"
    }
  ]
}
```

---

### 7. Get Student Performance
**Endpoint:** `GET /teachers/:id/students/performance`  
**Authentication:** ✅ Required  
**Role Required:** SUPER_ADMIN, SCHOOL_ADMIN, TEACHER

**Response (200 OK):**
```json
{
  "teacherId": "uuid",
  "period": "month",
  "students": [
    {
      "studentId": "uuid",
      "studentName": "Alice Johnson",
      "averageMarks": 85,
      "attendancePercentage": 95,
      "status": "excellent",
      "totalExams": 3,
      "averageGrade": "A"
    }
  ]
}
```

---

### 8. Get Attendance Records
**Endpoint:** `GET /teachers/:id/classes/:classId/attendance`  
**Authentication:** ✅ Required  
**Role Required:** SUPER_ADMIN, SCHOOL_ADMIN, TEACHER

**Query Parameters:**
```
?startDate=2025-11-01&endDate=2025-11-30
```

**Response (200 OK):**
```json
{
  "classId": "uuid",
  "className": "Class 10-A",
  "period": "November 2025",
  "attendanceRecords": [
    {
      "studentId": "uuid",
      "studentName": "Alice Johnson",
      "presentDays": 20,
      "absentDays": 2,
      "attendancePercentage": 90.9,
      "status": "Good"
    }
  ]
}
```

---

## 👨‍👩‍👧 Parent Management Module

**Base URL:** `/parents`

### 1. Create Parent
**Endpoint:** `POST /parents`  
**Authentication:** ✅ Required  
**Role Required:** SUPER_ADMIN, SCHOOL_ADMIN

**Request Body:**
```json
{
  "email": "john.parent@email.com",
  "password": "secure_password",
  "firstName": "John",
  "lastName": "Parent",
  "phone": "+1-555-1234",
  "occupation": "Engineer",
  "address": "123 Maple St",
  "schoolId": "uuid"
}
```

**Response (201 Created):**
```json
{
  "id": "uuid",
  "email": "john.parent@email.com",
  "firstName": "John",
  "lastName": "Parent",
  "phone": "+1-555-1234",
  "occupation": "Engineer",
  "createdAt": "2025-11-18T10:00:00Z"
}
```

---

### 2. Get All Parents
**Endpoint:** `GET /parents`  
**Authentication:** ✅ Required  
**Role Required:** SUPER_ADMIN, SCHOOL_ADMIN

**Query Parameters:**
```
?search=john&schoolId=uuid&page=1&limit=10&isActive=true
```

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": "uuid",
      "firstName": "John",
      "lastName": "Parent",
      "email": "john@email.com",
      "phone": "+1-555-1234",
      "studentsCount": 2,
      "isActive": true
    }
  ],
  "meta": {
    "total": 150,
    "page": 1,
    "limit": 10
  }
}
```

---

### 3. Get Parent by ID
**Endpoint:** `GET /parents/:id`  
**Authentication:** ✅ Required  
**Role Required:** SUPER_ADMIN, SCHOOL_ADMIN

**Response (200 OK):**
```json
{
  "id": "uuid",
  "firstName": "John",
  "lastName": "Parent",
  "email": "john@email.com",
  "phone": "+1-555-1234",
  "occupation": "Engineer",
  "address": "123 Maple St",
  "students": [
    {
      "studentId": "uuid",
      "studentName": "Alice Johnson",
      "className": "Class 10-A",
      "relation": "Daughter",
      "isPrimary": true
    }
  ],
  "isActive": true
}
```

---

### 4. Update Parent
**Endpoint:** `PATCH /parents/:id`  
**Authentication:** ✅ Required  
**Role Required:** SUPER_ADMIN, SCHOOL_ADMIN

**Request Body:**
```json
{
  "phone": "+1-555-5678",
  "occupation": "Manager",
  "address": "456 Oak Ave"
}
```

**Response (200 OK):**
```json
{
  "id": "uuid",
  "firstName": "John",
  "lastName": "Parent",
  "phone": "+1-555-5678",
  "occupation": "Manager",
  "updatedAt": "2025-11-18T11:00:00Z"
}
```

---

### 5. Link Student to Parent
**Endpoint:** `POST /parents/:id/students`  
**Authentication:** ✅ Required  
**Role Required:** SUPER_ADMIN, SCHOOL_ADMIN

**Request Body:**
```json
{
  "studentId": "uuid",
  "relation": "Father",
  "isPrimary": true
}
```

**Response (201 Created):**
```json
{
  "message": "Student linked to parent successfully",
  "parentId": "uuid",
  "studentId": "uuid"
}
```

---

### 6. Unlink Student from Parent
**Endpoint:** `DELETE /parents/:id/students/:studentId`  
**Authentication:** ✅ Required  
**Role Required:** SUPER_ADMIN, SCHOOL_ADMIN

**Response (204 No Content)**

---

### 7. Soft Delete Parent
**Endpoint:** `DELETE /parents/:id`  
**Authentication:** ✅ Required  
**Role Required:** SUPER_ADMIN, SCHOOL_ADMIN

**Response (200 OK):**
```json
{
  "message": "Parent deactivated successfully"
}
```

---

### 8. Hard Delete Parent (Permanent)
**Endpoint:** `DELETE /parents/:id/hard`  
**Authentication:** ✅ Required  
**Role Required:** SUPER_ADMIN

**Response (200 OK):**
```json
{
  "message": "Parent deleted permanently"
}
```

---

## 📅 Timetable Module

**Base URL:** `/timetable`

### 1. Create Room
**Endpoint:** `POST /timetable/rooms`  
**Authentication:** ✅ Required  
**Role Required:** SUPER_ADMIN, SCHOOL_ADMIN

**Request Body:**
```json
{
  "name": "Room 101",
  "roomType": "CLASSROOM",
  "capacity": 45,
  "floor": 1,
  "description": "Main classroom"
}
```

**Response (201 Created):**
```json
{
  "id": "uuid",
  "name": "Room 101",
  "roomType": "CLASSROOM",
  "capacity": 45,
  "floor": 1,
  "createdAt": "2025-11-18T10:00:00Z"
}
```

---

### 2. Get All Rooms
**Endpoint:** `GET /timetable/rooms`  
**Authentication:** ✅ Required  
**Role Required:** SUPER_ADMIN, SCHOOL_ADMIN, TEACHER

**Query Parameters:**
```
?roomType=CLASSROOM&floor=1&page=1&limit=20
```

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Room 101",
      "roomType": "CLASSROOM",
      "capacity": 45,
      "utilization": 80
    }
  ],
  "meta": {
    "total": 15,
    "page": 1,
    "limit": 20
  }
}
```

---

### 3. Create Timetable
**Endpoint:** `POST /timetable/timetables`  
**Authentication:** ✅ Required  
**Role Required:** SUPER_ADMIN, SCHOOL_ADMIN

**Request Body:**
```json
{
  "classId": "uuid",
  "academicYearId": "uuid",
  "validFrom": "2025-11-20",
  "validUpto": "2026-03-31",
  "description": "Regular timetable"
}
```

**Response (201 Created):**
```json
{
  "id": "uuid",
  "classId": "uuid",
  "validFrom": "2025-11-20",
  "validUpto": "2026-03-31",
  "status": "ACTIVE",
  "createdAt": "2025-11-18T10:00:00Z"
}
```

---

### 4. Create Timetable Slot
**Endpoint:** `POST /timetable/slots`  
**Authentication:** ✅ Required  
**Role Required:** SUPER_ADMIN, SCHOOL_ADMIN

**Request Body:**
```json
{
  "timetableId": "uuid",
  "dayOfWeek": "MONDAY",
  "slotNumber": 1,
  "startTime": "09:00",
  "endTime": "09:45",
  "classSubjectId": "uuid",
  "teacherId": "uuid",
  "roomId": "uuid"
}
```

**Response (201 Created):**
```json
{
  "id": "uuid",
  "dayOfWeek": "MONDAY",
  "slotNumber": 1,
  "startTime": "09:00",
  "endTime": "09:45",
  "subject": "Physics",
  "teacher": "Jane Doe",
  "room": "Room 101",
  "createdAt": "2025-11-18T10:00:00Z"
}
```

---

### 5. Bulk Create Timetable Slots
**Endpoint:** `POST /timetable/slots/bulk`  
**Authentication:** ✅ Required  
**Role Required:** SUPER_ADMIN, SCHOOL_ADMIN

**Request Body:**
```json
{
  "timetableId": "uuid",
  "slots": [
    {
      "dayOfWeek": "MONDAY",
      "slotNumber": 1,
      "startTime": "09:00",
      "endTime": "09:45",
      "classSubjectId": "uuid",
      "teacherId": "uuid",
      "roomId": "uuid"
    }
  ]
}
```

**Response (201 Created):**
```json
{
  "message": "Timetable slots created successfully",
  "count": 25
}
```

---

### 6. Get Class Schedule
**Endpoint:** `GET /timetable/class/:classId/schedule`  
**Authentication:** ✅ Required  
**Role Required:** SUPER_ADMIN, SCHOOL_ADMIN, TEACHER

**Query Parameters:**
```
?date=2025-11-18
```

**Response (200 OK):**
```json
{
  "classId": "uuid",
  "className": "Class 10-A",
  "date": "2025-11-18",
  "dayOfWeek": "MONDAY",
  "slots": [
    {
      "slotNumber": 1,
      "startTime": "09:00",
      "endTime": "09:45",
      "subject": "Physics",
      "teacher": "Jane Doe",
      "room": "Room 201"
    }
  ]
}
```

---

### 7. Get Teacher Schedule
**Endpoint:** `GET /timetable/teacher/:teacherId/schedule`  
**Authentication:** ✅ Required  
**Role Required:** SUPER_ADMIN, SCHOOL_ADMIN, TEACHER

**Query Parameters:**
```
?date=2025-11-18
```

**Response (200 OK):**
```json
{
  "teacherId": "uuid",
  "teacherName": "Jane Doe",
  "date": "2025-11-18",
  "schedule": [
    {
      "slotNumber": 1,
      "startTime": "09:00",
      "endTime": "09:45",
      "subject": "Physics",
      "className": "Class 10-A",
      "room": "Room 201"
    }
  ]
}
```

---

### 8. Check Room Availability
**Endpoint:** `POST /timetable/rooms/check-availability`  
**Authentication:** ✅ Required  
**Role Required:** SUPER_ADMIN, SCHOOL_ADMIN, TEACHER

**Request Body:**
```json
{
  "roomId": "uuid",
  "dayOfWeek": "MONDAY",
  "startTime": "10:00",
  "endTime": "10:45"
}
```

**Response (200 OK):**
```json
{
  "isAvailable": true,
  "roomName": "Room 101",
  "dayOfWeek": "MONDAY",
  "timeSlot": "10:00-10:45"
}
```

---

## 🏖️ Holiday Module

**Base URL:** `/holidays`

### 1. Create Holiday
**Endpoint:** `POST /holidays`  
**Authentication:** ✅ Required  
**Role Required:** SCHOOL_ADMIN

**Request Body:**
```json
{
  "name": "Thanksgiving",
  "date": "2025-11-27",
  "description": "Thanksgiving holiday",
  "type": "NATIONAL",
  "isSchoolWide": true
}
```

**Response (201 Created):**
```json
{
  "id": "uuid",
  "name": "Thanksgiving",
  "date": "2025-11-27",
  "description": "Thanksgiving holiday",
  "type": "NATIONAL",
  "createdAt": "2025-11-18T10:00:00Z"
}
```

---

### 2. Get All Holidays
**Endpoint:** `GET /holidays`  
**Authentication:** ✅ Required  
**Role Required:** SCHOOL_ADMIN, TEACHER, STUDENT

**Query Parameters:**
```
?academicYearId=uuid&type=NATIONAL&page=1&limit=20
```

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Thanksgiving",
      "date": "2025-11-27",
      "description": "Thanksgiving holiday",
      "type": "NATIONAL"
    }
  ],
  "meta": {
    "total": 15,
    "page": 1,
    "limit": 20
  }
}
```

---

### 3. Check if Date is Holiday
**Endpoint:** `GET /holidays/check`  
**Authentication:** ✅ Required  
**Role Required:** SCHOOL_ADMIN, TEACHER, STUDENT

**Query Parameters:**
```
?date=2025-11-27
```

**Response (200 OK):**
```json
{
  "date": "2025-11-27",
  "isHoliday": true,
  "holiday": {
    "name": "Thanksgiving",
    "description": "Thanksgiving holiday",
    "type": "NATIONAL"
  }
}
```

---

### 4. Update Holiday
**Endpoint:** `PATCH /holidays/:id`  
**Authentication:** ✅ Required  
**Role Required:** SCHOOL_ADMIN

**Request Body:**
```json
{
  "description": "Updated description"
}
```

**Response (200 OK):**
```json
{
  "id": "uuid",
  "name": "Thanksgiving",
  "date": "2025-11-27",
  "description": "Updated description",
  "updatedAt": "2025-11-18T11:00:00Z"
}
```

---

### 5. Delete Holiday
**Endpoint:** `DELETE /holidays/:id`  
**Authentication:** ✅ Required  
**Role Required:** SCHOOL_ADMIN

**Response (204 No Content)**

---

## 👨‍🎓 Student Management Module

**Base URL:** `/students`

### 1. Create Student (New Admission)
**Endpoint:** `POST /students`  
**Authentication:** ✅ Required  
**Role Required:** SUPER_ADMIN, SCHOOL_ADMIN

**Request Body:**
```json
{
  "firstName": "Alice",
  "lastName": "Johnson",
  "email": "alice.johnson@school.edu",
  "password": "password123",
  "studentId": "STU001",
  "dateOfBirth": "2010-05-15",
  "gender": "F",
  "classId": "uuid",
  "rollNumber": "01",
  "admissionNumber": "ADM001",
  "admissionDate": "2025-09-01",
  "bloodGroup": "O+",
  "guardianName": "Robert Johnson",
  "guardianEmail": "robert.johnson@email.com",
  "guardianPhone": "+1234567890",
  "guardianRelation": "FATHER",
  "address": "123 Main St, City",
  "city": "New York",
  "state": "NY",
  "pinCode": "10001",
  "phoneNumber": "+1987654321"
}
```

**Response (201 Created):**
```json
{
  "id": "uuid",
  "userId": "uuid",
  "studentId": "STU001",
  "firstName": "Alice",
  "lastName": "Johnson",
  "email": "alice.johnson@school.edu",
  "dateOfBirth": "2010-05-15",
  "gender": "F",
  "classId": "uuid",
  "rollNumber": "01",
  "admissionNumber": "ADM001",
  "admissionDate": "2025-09-01",
  "bloodGroup": "O+",
  "guardianName": "Robert Johnson",
  "guardianEmail": "robert.johnson@email.com",
  "guardianPhone": "+1234567890",
  "isActive": true,
  "createdAt": "2025-11-18T10:00:00Z"
}
```

---

### 2. Get All Students (with Filters & Pagination)
**Endpoint:** `GET /students`  
**Authentication:** ✅ Required  
**Role Required:** SUPER_ADMIN, SCHOOL_ADMIN, TEACHER

**Query Parameters:**
```
?classId=uuid&searchTerm=alice&rollNumber=01&admissionNumber=ADM001&sortBy=firstName&sortOrder=ASC&page=1&limit=20
```

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": "uuid",
      "studentId": "STU001",
      "firstName": "Alice",
      "lastName": "Johnson",
      "email": "alice.johnson@school.edu",
      "classId": "uuid",
      "className": "Class 10-A",
      "rollNumber": "01",
      "admissionNumber": "ADM001",
      "dateOfBirth": "2010-05-15",
      "gender": "F",
      "bloodGroup": "O+",
      "isActive": true,
      "createdAt": "2025-11-18T10:00:00Z"
    }
  ],
  "meta": {
    "total": 450,
    "page": 1,
    "limit": 20,
    "totalPages": 23,
    "hasNextPage": true,
    "hasPreviousPage": false
  }
}
```

---

### 3. Get Student by ID
**Endpoint:** `GET /students/:id`  
**Authentication:** ✅ Required  
**Role Required:** ALL authenticated users (SUPER_ADMIN, SCHOOL_ADMIN, TEACHER, STUDENT, PARENT)

**Response (200 OK):**
```json
{
  "id": "uuid",
  "userId": "uuid",
  "studentId": "STU001",
  "firstName": "Alice",
  "lastName": "Johnson",
  "email": "alice.johnson@school.edu",
  "dateOfBirth": "2010-05-15",
  "gender": "F",
  "classId": "uuid",
  "className": "Class 10-A",
  "rollNumber": "01",
  "admissionNumber": "ADM001",
  "admissionDate": "2025-09-01",
  "bloodGroup": "O+",
  "guardianName": "Robert Johnson",
  "guardianEmail": "robert.johnson@email.com",
  "guardianPhone": "+1234567890",
  "guardianRelation": "FATHER",
  "address": "123 Main St, City",
  "city": "New York",
  "state": "NY",
  "pinCode": "10001",
  "phoneNumber": "+1987654321",
  "isActive": true,
  "createdAt": "2025-11-18T10:00:00Z"
}
```

**Error Response (404 Not Found):**
```json
{
  "statusCode": 404,
  "message": "Student not found",
  "error": "Not Found"
}
```

---

### 4. Update Student Information
**Endpoint:** `PATCH /students/:id`  
**Authentication:** ✅ Required  
**Role Required:** SUPER_ADMIN, SCHOOL_ADMIN

**Request Body (Partial Update):**
```json
{
  "firstName": "Alicia",
  "guardianPhone": "+1987654322",
  "address": "456 Oak Ave, City",
  "classId": "new-class-uuid"
}
```

**Response (200 OK):**
```json
{
  "id": "uuid",
  "studentId": "STU001",
  "firstName": "Alicia",
  "lastName": "Johnson",
  "email": "alice.johnson@school.edu",
  "classId": "new-class-uuid",
  "guardianPhone": "+1987654322",
  "address": "456 Oak Ave, City",
  "updatedAt": "2025-11-18T11:00:00Z"
}
```

---

### 5. Soft Delete Student
**Endpoint:** `DELETE /students/:id`  
**Authentication:** ✅ Required  
**Role Required:** SUPER_ADMIN, SCHOOL_ADMIN

**Response (204 No Content)**

**Note:** Soft delete marks student as inactive but preserves data for records.

---

### 6. Hard Delete Student (Permanent)
**Endpoint:** `DELETE /students/:id/hard`  
**Authentication:** ✅ Required  
**Role Required:** SUPER_ADMIN only

**Response (200 OK):**
```json
{
  "message": "Student permanently deleted",
  "id": "uuid"
}
```

**⚠️ Warning:** This permanently removes all student data including grades, attendance, and assignments. Cannot be undone.

---

### 7. Bulk Import Students (CSV)
**Endpoint:** `POST /students/bulk-import`  
**Authentication:** ✅ Required  
**Role Required:** SUPER_ADMIN, SCHOOL_ADMIN  
**Content-Type:** `multipart/form-data`

**Request:**
```
POST /students/bulk-import
Content-Type: multipart/form-data

file: students.csv
```

**CSV Format (Expected Headers):**
```csv
firstName,lastName,email,studentId,dateOfBirth,gender,classId,rollNumber,admissionNumber,admissionDate,bloodGroup,guardianName,guardianEmail,guardianPhone,guardianRelation,address,city,state,pinCode
Alice,Johnson,alice.johnson@school.edu,STU001,2010-05-15,F,class-uuid-1,01,ADM001,2025-09-01,O+,Robert Johnson,robert@email.com,+1234567890,FATHER,123 Main St,New York,NY,10001
Bob,Smith,bob.smith@school.edu,STU002,2010-08-22,M,class-uuid-1,02,ADM002,2025-09-01,A+,John Smith,john@email.com,+1234567891,FATHER,456 Oak Ave,Boston,MA,02101
```

**Response (201 Created):**
```json
{
  "message": "Students imported successfully",
  "importedCount": 2,
  "failedCount": 0,
  "details": [
    {
      "row": 1,
      "status": "SUCCESS",
      "studentId": "STU001",
      "message": "Student created successfully"
    },
    {
      "row": 2,
      "status": "SUCCESS",
      "studentId": "STU002",
      "message": "Student created successfully"
    }
  ]
}
```

---

### 8. Bulk Promote Students (Class/Grade Promotion)
**Endpoint:** `POST /students/bulk-promote`  
**Authentication:** ✅ Required  
**Role Required:** SUPER_ADMIN, SCHOOL_ADMIN

**Request Body:**
```json
{
  "currentClassId": "uuid",
  "newClassId": "uuid",
  "academicYearId": "uuid",
  "promoteAllStudents": true,
  "studentIds": []
}
```

**Response (200 OK):**
```json
{
  "message": "Students promoted successfully",
  "promotedCount": 45,
  "classPromotionDetails": {
    "from": "Class 9-A",
    "to": "Class 10-A",
    "count": 45
  }
}
```

---

### 9. Transfer Student to Another School
**Endpoint:** `POST /students/:id/transfer`  
**Authentication:** ✅ Required  
**Role Required:** SUPER_ADMIN, SCHOOL_ADMIN

**Request Body:**
```json
{
  "transferToSchoolId": "new-school-uuid",
  "transferDate": "2025-12-15",
  "transferReason": "Parent relocation",
  "issueTCCertificate": true,
  "remarks": "Good academic performance"
}
```

**Response (200 OK):**
```json
{
  "message": "Student transfer initiated",
  "studentId": "uuid",
  "transferDate": "2025-12-15",
  "fromSchool": "Current School",
  "toSchool": "New School",
  "tcCertificateNumber": "TC001-2025"
}
```

---

### 10. Get Student Dashboard
**Endpoint:** `GET /students/:id/dashboard`  
**Authentication:** ✅ Required  
**Role Required:** STUDENT, PARENT, TEACHER, SCHOOL_ADMIN, SUPER_ADMIN

**Query Parameters:**
```
?period=month
```

**Period Options:** `week`, `month`, `term`, `year`

**Response (200 OK):**
```json
{
  "studentInfo": {
    "id": "uuid",
    "name": "Alice Johnson",
    "studentId": "STU001",
    "class": "Class 10-A",
    "rollNumber": "01",
    "email": "alice.johnson@school.edu",
    "profileImage": "url"
  },
  "academicOverview": {
    "averageGPA": 3.85,
    "totalGradesRecorded": 12,
    "subjectCount": 6,
    "recentGrades": [
      {
        "subject": "Mathematics",
        "grade": "A+",
        "percentage": 95,
        "examType": "Midterm"
      }
    ]
  },
  "attendanceOverview": {
    "attendancePercentage": 96.5,
    "presentDays": 145,
    "absentDays": 5,
    "lateDays": 2,
    "totalDays": 152
  },
  "assignmentOverview": {
    "totalAssignments": 24,
    "submittedAssignments": 23,
    "pendingAssignments": 1,
    "submissionPercentage": 95.83
  },
  "upcomingExams": [
    {
      "examId": "uuid",
      "examName": "Final Exams",
      "examDate": "2025-12-10",
      "examType": "FINAL",
      "daysUntilExam": 22
    }
  ],
  "quickStats": {
    "feesStatus": "PAID",
    "feesPending": 0,
    "leaveRequestsPending": 0,
    "behaviorReportsCount": 0
  }
}
```

---

### 11. Get Student Complete Profile
**Endpoint:** `GET /students/:id/profile`  
**Authentication:** ✅ Required  
**Role Required:** STUDENT, PARENT, TEACHER, SCHOOL_ADMIN, SUPER_ADMIN

**Response (200 OK):**
```json
{
  "personalDetails": {
    "id": "uuid",
    "firstName": "Alice",
    "lastName": "Johnson",
    "email": "alice.johnson@school.edu",
    "dateOfBirth": "2010-05-15",
    "gender": "F",
    "bloodGroup": "O+",
    "phoneNumber": "+1987654321",
    "address": "123 Main St, City",
    "city": "New York",
    "state": "NY",
    "pinCode": "10001",
    "profileImage": "url"
  },
  "academicDetails": {
    "studentId": "STU001",
    "admissionNumber": "ADM001",
    "admissionDate": "2025-09-01",
    "classId": "uuid",
    "className": "Class 10-A",
    "rollNumber": "01",
    "section": "A",
    "houseName": "Green House"
  },
  "guardianDetails": {
    "guardianName": "Robert Johnson",
    "guardianEmail": "robert.johnson@email.com",
    "guardianPhone": "+1234567890",
    "guardianRelation": "FATHER",
    "guardianAddress": "Same as student"
  },
  "systemDetails": {
    "isActive": true,
    "createdAt": "2025-11-18T10:00:00Z",
    "updatedAt": "2025-11-18T10:00:00Z",
    "lastLogin": "2025-11-18T09:30:00Z"
  }
}
```

---

### 12. Get Student Grades & Marksheet
**Endpoint:** `GET /students/:id/grades`  
**Authentication:** ✅ Required  
**Role Required:** STUDENT, PARENT, TEACHER, SCHOOL_ADMIN, SUPER_ADMIN

**Query Parameters:**
```
?academicYearId=uuid&examTypeId=uuid&subjectId=uuid
```

**Response (200 OK):**
```json
{
  "studentInfo": {
    "id": "uuid",
    "name": "Alice Johnson",
    "class": "Class 10-A"
  },
  "examDetails": {
    "academicYear": "2025-2026",
    "examType": "Midterm",
    "examDate": "2025-11-10"
  },
  "gradesBreakdown": [
    {
      "subject": "Mathematics",
      "subjectId": "uuid",
      "maximumMarks": 100,
      "obtainedMarks": 95,
      "percentage": 95,
      "grade": "A+",
      "gradePoints": 4.0,
      "remarks": "Excellent performance",
      "teacherName": "Dr. Smith"
    },
    {
      "subject": "English",
      "subjectId": "uuid",
      "maximumMarks": 100,
      "obtainedMarks": 88,
      "percentage": 88,
      "grade": "A",
      "gradePoints": 3.9,
      "remarks": "Good work",
      "teacherName": "Ms. Brown"
    }
  ],
  "summary": {
    "totalMarksObtained": 543,
    "totalMaximumMarks": 600,
    "aggregatePercentage": 90.5,
    "aggregateGrade": "A+",
    "aggregateGPA": 3.95,
    "subjectsCount": 6
  }
}
```

---

### 13. Get Student Performance Analytics
**Endpoint:** `GET /students/:id/performance`  
**Authentication:** ✅ Required  
**Role Required:** STUDENT, PARENT, TEACHER, SCHOOL_ADMIN, SUPER_ADMIN

**Query Parameters:**
```
?period=term&compareWithClass=true
```

**Period Options:** `term`, `year`

**Response (200 OK):**
```json
{
  "studentPerformance": {
    "studentId": "uuid",
    "studentName": "Alice Johnson",
    "currentGPA": 3.85,
    "percentile": 92,
    "performanceRank": 5,
    "totalStudentsInClass": 45
  },
  "subjectWisePerformance": [
    {
      "subject": "Mathematics",
      "examCount": 3,
      "averagePercentage": 93.5,
      "averageGrade": "A+",
      "trend": "IMPROVING",
      "recentExams": [
        {
          "examName": "Unit Test 1",
          "percentage": 90,
          "rank": 1
        },
        {
          "examName": "Unit Test 2",
          "percentage": 95,
          "rank": 1
        }
      ]
    }
  ],
  "classComparison": {
    "studentPercentage": 90.5,
    "classAveragePercentage": 78.3,
    "studentPerformanceVsClass": "+12.2%",
    "studentPosition": "Top 5"
  },
  "performanceTrend": {
    "overallTrend": "STABLE",
    "previousTermGPA": 3.80,
    "currentTermGPA": 3.85,
    "improvement": "+0.05"
  },
  "strengthsAndWeaknesses": {
    "strengths": ["Mathematics", "Science"],
    "areasForImprovement": ["History", "Geography"]
  }
}
```

---

### 14. Get Student Attendance Records
**Endpoint:** `GET /students/:id/attendance`  
**Authentication:** ✅ Required  
**Role Required:** STUDENT, PARENT, TEACHER, SCHOOL_ADMIN, SUPER_ADMIN

**Query Parameters:**
```
?startDate=2025-11-01&endDate=2025-11-30&subjectId=uuid
```

**Response (200 OK):**
```json
{
  "studentInfo": {
    "id": "uuid",
    "name": "Alice Johnson",
    "class": "Class 10-A",
    "rollNumber": "01"
  },
  "attendanceSummary": {
    "totalDays": 22,
    "presentDays": 21,
    "absentDays": 1,
    "lateDays": 0,
    "attendancePercentage": 95.45,
    "status": "GOOD"
  },
  "subjectWiseAttendance": [
    {
      "subject": "Mathematics",
      "totalClasses": 4,
      "presentClasses": 4,
      "attendancePercentage": 100
    },
    {
      "subject": "English",
      "totalClasses": 3,
      "presentClasses": 3,
      "attendancePercentage": 100
    }
  ],
  "attendanceRecords": [
    {
      "date": "2025-11-18",
      "day": "Monday",
      "status": "PRESENT",
      "markedAt": "08:45:00"
    },
    {
      "date": "2025-11-17",
      "day": "Sunday",
      "status": "HOLIDAY"
    },
    {
      "date": "2025-11-16",
      "day": "Saturday",
      "status": "ABSENT",
      "markedAt": "08:50:00",
      "remarks": "Sick leave"
    }
  ]
}
```

---

### 15. Get Student Timetable
**Endpoint:** `GET /students/:id/timetable`  
**Authentication:** ✅ Required  
**Role Required:** STUDENT, PARENT, TEACHER, SCHOOL_ADMIN, SUPER_ADMIN

**Query Parameters:**
```
?date=2025-11-18&week=current
```

**Response (200 OK):**
```json
{
  "studentInfo": {
    "id": "uuid",
    "name": "Alice Johnson",
    "class": "Class 10-A"
  },
  "timetableDetails": {
    "weekStartDate": "2025-11-17",
    "weekEndDate": "2025-11-23"
  },
  "weeklySchedule": [
    {
      "day": "Monday",
      "date": "2025-11-17",
      "classes": [
        {
          "period": 1,
          "startTime": "08:00",
          "endTime": "09:00",
          "subject": "Mathematics",
          "teacher": "Dr. Smith",
          "room": "101",
          "roomNumber": "101"
        },
        {
          "period": 2,
          "startTime": "09:00",
          "endTime": "10:00",
          "subject": "English",
          "teacher": "Ms. Brown",
          "room": "102"
        }
      ]
    },
    {
      "day": "Tuesday",
      "date": "2025-11-18",
      "classes": [
        {
          "period": 1,
          "startTime": "08:00",
          "endTime": "09:00",
          "subject": "Science",
          "teacher": "Mr. Johnson",
          "room": "103"
        }
      ]
    }
  ]
}
```

---

### 16. Get Student Subjects with Teacher Information
**Endpoint:** `GET /students/:id/subjects`  
**Authentication:** ✅ Required  
**Role Required:** STUDENT, PARENT, TEACHER, SCHOOL_ADMIN, SUPER_ADMIN

**Response (200 OK):**
```json
{
  "studentInfo": {
    "id": "uuid",
    "name": "Alice Johnson",
    "class": "Class 10-A"
  },
  "subjects": [
    {
      "subjectId": "uuid",
      "subjectName": "Mathematics",
      "subjectCode": "MATH101",
      "credits": 4,
      "teacher": {
        "id": "uuid",
        "firstName": "John",
        "lastName": "Smith",
        "email": "john.smith@school.edu",
        "phoneNumber": "+1234567890",
        "qualification": "M.Sc. Mathematics",
        "experience": 12
      },
      "isOptional": false,
      "practicalTeacher": {
        "id": "uuid",
        "firstName": "Sarah",
        "lastName": "Davis",
        "email": "sarah.davis@school.edu"
      }
    },
    {
      "subjectId": "uuid",
      "subjectName": "English",
      "subjectCode": "ENG101",
      "credits": 3,
      "teacher": {
        "id": "uuid",
        "firstName": "Emma",
        "lastName": "Brown",
        "email": "emma.brown@school.edu",
        "phoneNumber": "+1234567891",
        "qualification": "M.A. English",
        "experience": 8
      },
      "isOptional": false
    }
  ],
  "totalSubjects": 6,
  "totalCredits": 22
}
```

---

### 17. Get Class-wise Student Report
**Endpoint:** `GET /students/reports/class/:classId`  
**Authentication:** ✅ Required  
**Role Required:** TEACHER, SCHOOL_ADMIN, SUPER_ADMIN

**Query Parameters:**
```
?academicYearId=uuid&includePerformance=true&includeAttendance=true
```

**Response (200 OK):**
```json
{
  "classInfo": {
    "classId": "uuid",
    "className": "Class 10-A",
    "section": "A",
    "totalStudents": 45,
    "academicYear": "2025-2026"
  },
  "classStatistics": {
    "averageAttendancePercentage": 92.5,
    "averageGPA": 3.72,
    "toppers": [
      {
        "rank": 1,
        "name": "Alice Johnson",
        "gpa": 3.95,
        "percentage": 95.2
      },
      {
        "rank": 2,
        "name": "Bob Smith",
        "gpa": 3.90,
        "percentage": 94.8
      }
    ],
    "needsAttention": [
      {
        "name": "Charlie Brown",
        "attendancePercentage": 68.5,
        "gpa": 2.15,
        "remarks": "Irregular attendance and low performance"
      }
    ]
  },
  "studentDetailedReport": [
    {
      "studentId": "uuid",
      "name": "Alice Johnson",
      "rollNumber": "01",
      "attendance": 95.5,
      "gpa": 3.95,
      "percentage": 95.2,
      "performanceStatus": "EXCELLENT"
    }
  ]
}
```

---

### 18. Generate Student Report Card (PDF)
**Endpoint:** `GET /students/:id/report-card`  
**Authentication:** ✅ Required  
**Role Required:** STUDENT, PARENT, TEACHER, SCHOOL_ADMIN, SUPER_ADMIN

**Query Parameters:**
```
?academicYearId=uuid&examTypeId=uuid
```

**Response (200 OK - PDF File):**
```
Content-Type: application/pdf
Content-Disposition: attachment; filename="ReportCard_Alice_Johnson_2025-2026.pdf"

[PDF Binary Data]
```

**The PDF includes:**
- Student personal details
- Class and academic information
- Subject-wise grades and marks
- Performance summary
- Attendance records
- Teacher remarks
- Principal's signature

---

### 19. Search Students (Advanced Search)
**Endpoint:** `GET /students/search`  
**Authentication:** ✅ Required  
**Role Required:** SUPER_ADMIN, SCHOOL_ADMIN

**Query Parameters:**
```
?firstName=alice&lastName=johnson&email=alice&classId=uuid&admissionYear=2025&gender=F&bloodGroup=O+&rollNumber=01&page=1&limit=20
```

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": "uuid",
      "studentId": "STU001",
      "firstName": "Alice",
      "lastName": "Johnson",
      "email": "alice.johnson@school.edu",
      "class": "Class 10-A",
      "rollNumber": "01",
      "gender": "F",
      "bloodGroup": "O+",
      "admissionDate": "2025-09-01",
      "isActive": true
    }
  ],
  "meta": {
    "total": 1,
    "page": 1,
    "limit": 20,
    "totalPages": 1,
    "hasNextPage": false,
    "hasPreviousPage": false
  }
}
```

---

### 20. Get Students in a Specific Class
**Endpoint:** `GET /students/class/:classId`  
**Authentication:** ✅ Required  
**Role Required:** SUPER_ADMIN, SCHOOL_ADMIN, TEACHER

**Query Parameters:**
```
?page=1&limit=50
```

**Response (200 OK):**
```json
{
  "classInfo": {
    "classId": "uuid",
    "className": "Class 10-A",
    "section": "A",
    "totalStudents": 45
  },
  "data": [
    {
      "id": "uuid",
      "studentId": "STU001",
      "firstName": "Alice",
      "lastName": "Johnson",
      "email": "alice.johnson@school.edu",
      "rollNumber": "01",
      "gender": "F",
      "dateOfBirth": "2010-05-15",
      "bloodGroup": "O+",
      "guardianName": "Robert Johnson",
      "guardianPhone": "+1234567890",
      "isActive": true
    }
  ],
  "meta": {
    "total": 45,
    "page": 1,
    "limit": 50,
    "totalPages": 1
  }
}
```

---

## 📊 Error Handling & Status Codes

### Standard HTTP Status Codes

| Code | Meaning | Example |
|------|---------|---------|
| 200 | OK | Successful GET, PUT, PATCH |
| 201 | Created | Successful POST |
| 204 | No Content | Successful DELETE |
| 400 | Bad Request | Invalid input data |
| 401 | Unauthorized | Missing/invalid JWT token |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource not found |
| 409 | Conflict | Duplicate resource |
| 500 | Server Error | Internal server error |

### Error Response Format

```json
{
  "statusCode": 400,
  "message": "Bad Request",
  "error": "Validation failed",
  "details": [
    {
      "field": "email",
      "message": "Invalid email format"
    }
  ]
}
```

---

## 🧪 Testing Guide

### Using Postman

1. **Import Collections:**
   - Download all endpoints as Postman collection
   - Set `base_url` variable to `http://localhost:3000`
   - Set `token` variable after login

2. **Authentication Flow:**
   - Call `/auth/login` with test credentials
   - Copy `accessToken` from response
   - Add to header: `Authorization: Bearer {accessToken}`

3. **Test Each Module:**
   - Start with Authentication
   - Then Classes & Subjects
   - Follow with Exam, Fee, Attendance
   - Finally Teacher, Parent, Timetable, Holiday

### cURL Examples

**Login:**
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@school.edu",
    "password": "admin123"
  }'
```

**Get All Classes:**
```bash
curl -X GET http://localhost:3000/classes \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Create Teacher:**
```bash
curl -X POST http://localhost:3000/teachers \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "teacher@school.edu",
    "password": "teacher123",
    "firstName": "John",
    "lastName": "Teacher",
    "schoolId": "uuid"
  }'
```

**Create Student (Admission):**
```bash
curl -X POST http://localhost:3000/students \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Alice",
    "lastName": "Johnson",
    "email": "alice.johnson@school.edu",
    "password": "password123",
    "studentId": "STU001",
    "dateOfBirth": "2010-05-15",
    "gender": "F",
    "classId": "class-uuid",
    "rollNumber": "01",
    "admissionNumber": "ADM001",
    "admissionDate": "2025-09-01",
    "bloodGroup": "O+",
    "guardianName": "Robert Johnson",
    "guardianEmail": "robert.johnson@email.com",
    "guardianPhone": "+1234567890",
    "guardianRelation": "FATHER",
    "address": "123 Main St, City",
    "city": "New York",
    "state": "NY",
    "pinCode": "10001",
    "phoneNumber": "+1987654321"
  }'
```

**Get All Students with Pagination:**
```bash
curl -X GET "http://localhost:3000/students?page=1&limit=20&classId=class-uuid" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Get Student Dashboard:**
```bash
curl -X GET "http://localhost:3000/students/student-id/dashboard?period=month" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Get Student Grades:**
```bash
curl -X GET "http://localhost:3000/students/student-id/grades?academicYearId=uuid&examTypeId=uuid" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Get Student Attendance:**
```bash
curl -X GET "http://localhost:3000/students/student-id/attendance?startDate=2025-11-01&endDate=2025-11-30" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Bulk Import Students from CSV:**
```bash
curl -X POST http://localhost:3000/students/bulk-import \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "file=@students.csv"
```

**Promote Students to Next Class:**
```bash
curl -X POST http://localhost:3000/students/bulk-promote \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "currentClassId": "current-class-uuid",
    "newClassId": "new-class-uuid",
    "academicYearId": "academic-year-uuid",
    "promoteAllStudents": true
  }'
```

**Update Student Information:**
```bash
curl -X PATCH http://localhost:3000/students/student-id \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Alicia",
    "guardianPhone": "+1987654322",
    "address": "456 Oak Ave, City"
  }'
```

**Generate Student Report Card (PDF):**
```bash
curl -X GET "http://localhost:3000/students/student-id/report-card?academicYearId=uuid" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -o report_card.pdf
```

**Soft Delete Student:**
```bash
curl -X DELETE http://localhost:3000/students/student-id \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## 📱 Frontend Integration Checklist

- [ ] Authentication (Login, Refresh, Logout)
- [ ] Teacher Dashboard
- [ ] Student Management
- [ ] Class Management
- [ ] Subject Assignment
- [ ] Attendance Marking
- [ ] Exam & Grading
- [ ] Fee Management
- [ ] Timetable View
- [ ] Holiday Calendar
- [ ] Parent Portal
- [ ] Report Generation

---

## 🚀 Deployment Notes

1. **Environment Variables:**
   ```
   NODE_ENV=production
   DATABASE_URL=postgresql://user:pass@host:5432/dbname
   JWT_SECRET=your_secret_key
   JWT_EXPIRES_IN=15m
   JWT_REFRESH_SECRET=refresh_secret_key
   JWT_REFRESH_EXPIRES_IN=7d
   ```

2. **Database Migration:**
   ```bash
   npx prisma migrate deploy
   npx prisma db seed
   ```

3. **Start Server:**
   ```bash
   npm run start:prod
   ```

---

## 📞 Support

For issues or questions:
- Check API logs: `npm run start:dev`
- Review Swagger docs: `http://localhost:3000/api/docs`
- Contact: support@school.edu

---

**Version History:**
- v1.0.0 (Nov 18, 2025) - Initial comprehensive API documentation




📋 Test Credentials:
===================
Super Admin:
  Email: superadmin@schoolerp.com
  Password: Password123!

School Admin:
  Email: admin@greenwood.edu
  Password: Password123!

Teachers:
  Physics: dr.smith@greenwood.edu
  Math: mr.wilson@greenwood.edu
  Password for all: Password123!

Students:
  Alice: alice.johnson@student.greenwood.edu
  Bob: bob.williams@student.greenwood.edu
  Password for all: Password123!



**file structure**


backend_dass/
│
├── src/
│   ├── app.controller.spec.ts          # Main app controller tests
│   ├── app.controller.ts               # Main app controller
│   ├── app.module.ts                   # Root module with all imports
│   ├── app.service.ts                  # Main app service
│   ├── main.ts                         # Application entry point
│   │
│   ├── attendance/                     # Attendance Management Module
│   │   ├── attendance.controller.spec.ts
│   │   ├── attendance.controller.ts    # Endpoints for attendance CRUD
│   │   ├── attendance.module.ts
│   │   ├── attendance.service.spec.ts
│   │   ├── attendance.service.ts       # Attendance business logic
│   │   ├── attendance.report.controller.spec.ts
│   │   ├── attendance.report.controller.ts  # Report generation endpoints
│   │   ├── attendance.report.service.spec.ts
│   │   ├── attendance.report.service.ts     # Report generation logic
│   │   ├── dto/
│   │   │   ├── create-attendance.dto.ts
│   │   │   ├── report-query.dto.spec.ts
│   │   │   ├── report-query.dto.ts
│   │   │   └── update-attendance.dto.ts
│   │   ├── entities/
│   │   │   └── attendance.entity.ts    # Attendance entity definition
│   │   └── utils/
│   │       └── date-range.ts           # Date utility functions
│   │
│   ├── auth/                           # Authentication Module
│   │   ├── auth.controller.ts          # Login/logout/refresh endpoints
│   │   ├── auth.module.ts
│   │   ├── auth.service.ts             # Auth business logic
│   │   ├── auth.types.ts               # Auth type definitions
│   │   ├── jwt.strategy.ts             # JWT authentication strategy
│   │   └── refresh.strategy.ts         # JWT refresh token strategy
│   │
│   ├── class_and_subject_management/   # Classes & Subjects Module
│   │   ├── class_and_subject_management.controller.spec.ts
│   │   ├── class_and_subject_management.controller.ts
│   │   │   # Endpoints for:
│   │   │   # - Classes CRUD
│   │   │   # - Subjects CRUD
│   │   │   # - Class-Subject mappings
│   │   │   # - Teacher assignments
│   │   ├── class_and_subject_management.module.ts
│   │   ├── class_and_subject_management.service.spec.ts
│   │   ├── class_and_subject_management.service.ts
│   │   │   # Services:
│   │   │   # - ClassesService (CRUD, stats, student management)
│   │   │   # - SubjectsService (CRUD, statistics)
│   │   │   # - ClassSubjectsService (mapping, teacher assignment)
│   │   │   # - TeacherSubjectsService (teacher-subject linking)
│   │   │   # - DepartmentsService (department management)
│   │   ├── dto/
│   │   │   ├── create-class_and_subject_management.dto.ts
│   │   │   ├── update-class_and_subject_management.dto.ts
│   │   │   └── ... (other DTOs)
│   │   └── entities/
│   │       └── class_and_subject_management.entity.ts
│   │
│   ├── common/                         # Shared/Common Utilities Module
│   │   ├── decorators/
│   │   │   ├── roles.decorator.ts      # @Roles() decorator for RBAC
│   │   │   └── ... (other decorators)
│   │   ├── filters/
│   │   │   └── ... (exception filters)
│   │   ├── guard/
│   │   │   ├── jwt-auth.guard.ts       # JWT authentication guard
│   │   │   ├── roles.guard.ts          # Role-based access control guard
│   │   │   └── index.ts
│   │   ├── interceptors/
│   │   │   └── ... (response interceptors)
│   │   ├── middleware/
│   │   │   └── ... (custom middleware)
│   │   └── pipes/
│   │       └── ... (validation pipes)
│   │
│   ├── exam-grading/                   # Exam & Grading Module
│   │   ├── exam-grading.controller.spec.ts
│   │   ├── exam-grading.controller.ts  # Exam CRUD & grading endpoints
│   │   ├── exam-grading.module.ts
│   │   ├── exam-grading.service.spec.ts
│   │   ├── exam-grading.service.ts     # Exam & grading logic
│   │   ├── dto/
│   │   │   └── ... (exam & grading DTOs)
│   │   └── entities/
│   │       └── ... (exam entities)
│   │
│   ├── fee/                            # Fee Management Module
│   │   ├── fee.controller.spec.ts
│   │   ├── fee.controller.ts           # Fee CRUD endpoints
│   │   ├── fee.module.ts
│   │   ├── fee.service.spec.ts
│   │   ├── fee.service.ts              # Fee business logic
│   │   ├── dto/
│   │   │   └── ... (fee DTOs)
│   │   └── entities/
│   │       └── ... (fee entities)
│   │
│   ├── holiday/                        # Holiday Management Module
│   │   ├── holiday.controller.spec.ts
│   │   ├── holiday.controller.ts       # Holiday CRUD endpoints
│   │   ├── holiday.module.ts
│   │   ├── holiday.service.spec.ts
│   │   ├── holiday.service.ts          # Holiday business logic
│   │   ├── dto/
│   │   │   └── ... (holiday DTOs)
│   │   └── entities/
│   │       └── ... (holiday entities)
│   │
│   ├── parent/                         # Parent Management Module
│   │   ├── parent.controller.spec.ts
│   │   ├── parent.controller.ts        # Parent CRUD & linking endpoints
│   │   ├── parent.module.ts
│   │   ├── parent.service.spec.ts
│   │   ├── parent.service.ts           # Parent business logic
│   │   ├── dto/
│   │   │   ├── create-parent.dto.ts
│   │   │   ├── update-parent.dto.ts
│   │   │   └── ... (other parent DTOs)
│   │   └── entities/
│   │       └── parent.entity.ts
│   │
│   ├── prisma/                         # Database Access Layer
│   │   ├── prisma.module.ts            # Prisma module definition
│   │   └── prisma.service.ts           # Prisma client wrapper service
│   │
│   ├── teacher/                        # Teacher Management Module ⭐ (NEW)
│   │   ├── teacher.controller.spec.ts
│   │   ├── teacher.controller.ts       # Teacher CRUD & dashboard endpoints
│   │   │   # Endpoints:
│   │   │   # - POST /teachers (create)
│   │   │   # - GET /teachers (list all)
│   │   │   # - GET /teachers/:id (get one)
│   │   │   # - PATCH /teachers/:id (update)
│   │   │   # - DELETE /teachers/:id (soft delete)
│   │   │   # - GET /teachers/:id/dashboard (teacher dashboard)
│   │   │   # - GET /teachers/:id/performance (student performance)
│   │   │   # - GET /teachers/:id/attendance (attendance records)
│   │   │   # - GET /teachers/:id/profile (teacher profile)
│   │   ├── teacher.module.ts
│   │   ├── teacher.service.spec.ts
│   │   ├── teacher.service.ts          # Teacher business logic & dashboard
│   │   │   # Methods:
│   │   │   # - CRUD operations
│   │   │   # - getDashboard() - comprehensive overview
│   │   │   # - getDashboardStats() - statistics
│   │   │   # - getClassesOverview() - classes with attendance
│   │   │   # - getUpcomingExams() - exam schedule
│   │   │   # - getRecentAttendance() - attendance summary
│   │   │   # - getTodayTimetable() - today's schedule
│   │   │   # - getStudentPerformance() - performance data
│   │   │   # - getAttendanceRecords() - detailed attendance
│   │   │   # - getProfile() - teacher profile info
│   │   ├── dto/
│   │   │   ├── create-teacher.dto.ts   # Create teacher DTO
│   │   │   ├── update-teacher.dto.ts   # Update teacher DTO
│   │   │   ├── teacher-dashboard-query.dto.ts
│   │   │   ├── teacher-dashboard-response.dto.ts
│   │   │   ├── teacher-profile.dto.ts
│   │   │   ├── class-overview.dto.ts
│   │   │   ├── upcoming-exam.dto.ts
│   │   │   ├── attendance-summary.dto.ts
│   │   │   ├── timetable-slot.dto.ts
│   │   │   ├── student-performance.dto.ts
│   │   │   └── attendance-record.dto.ts
│   │   └── entities/
│   │       └── teacher.entity.ts       # Teacher entity definition
│   │
│   ├── timetable/                      # Timetable Management Module
│   │   ├── timetable.controller.spec.ts
│   │   ├── timetable.controller.ts     # Timetable CRUD endpoints
│   │   ├── timetable.module.ts
│   │   ├── timetable.service.spec.ts
│   │   ├── timetable.service.ts        # Timetable business logic
│   │   ├── dto/
│   │   │   └── ... (timetable DTOs)
│   │   └── entities/
│   │       └── ... (timetable entities)
│   │
│   ├── users/                          # User Management Module
│   │   ├── users.controller.ts         # User endpoints
│   │   ├── users.module.ts
│   │   ├── users.service.ts            # User business logic
│   │   └── users.types.ts              # User type definitions
│   │
│   └── utils/                          # Global Utilities
│       └── date-range.ts               # Shared date utilities
│
├── test/
│   ├── app.e2e-spec.ts                 # End-to-end tests
│   └── jest-e2e.json                   # E2E test configuration
│
├── .env                                # Environment variables
├── .env.example                        # Environment template
├── .gitignore
├── .prettierrc                         # Code formatting config
├── docker-compose.yml                  # Docker configuration
├── jest.config.js                      # Unit test configuration
├── package.json                        # Dependencies & scripts
├── package-lock.json
├── prisma/
│   ├── schema.prisma                   # Prisma database schema
│   └── migrations/                     # Database migrations
├── README.md
└── tsconfig.json                       # TypeScript configuration


**few uuid from backend seedfile**
teacherid:7035f3d4-911a-4c41-bd71-bebc749bdaef
roomid:21c429d4-d88b-4df4-ad04-4fd1a03ef776
timetableid:7fce44f2-6166-4a55-b28b-51a23fa2ef92
studentid:45f11b5e-c357-4f5d-86a2-b6c74681467d











**Notifications ❌ NOT COVERED**


**future perorities**
**High Priority (Must Have)**
Document Upload System - For admission docs, assignments
Notifications System - Email/SMS for fees, grades
CRUD for schooladmin(onlysuper admin),

**Medium Priority (Should Have)**
Assignment/Homework module
Communication module (announcements)
Payment gateway integration
Mobile API optimization

**Low Priority (Nice to Have)**
Library management
Transport management
Hostel management
Alumni management

