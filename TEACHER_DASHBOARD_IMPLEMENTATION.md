# Teacher Dashboard Implementation

## Overview
Complete teacher dashboard system with role-based access control, real-time statistics, student performance tracking, and attendance management.

## Endpoints

### 1. Teacher Management

#### Create Teacher
```
POST /teachers
Authorization: Bearer {token}
Role: SUPER_ADMIN, SCHOOL_ADMIN

Request:
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@school.com",
  "password": "securePassword123",
  "teacherId": "TCH001",
  "schoolId": "school-123",
  "departmentId": "dept-123",
  "qualification": "M.Sc Physics",
  "experience": 5,
  "dateOfJoining": "2020-01-15",
  "salary": 50000
}

Response: 201 Created
{
  "id": "teacher-123",
  "userId": "user-456",
  "teacherId": "TCH001",
  "schoolId": "school-123",
  "departmentId": "dept-123",
  "qualification": "M.Sc Physics",
  "experience": 5,
  "dateOfJoining": "2020-01-15",
  "salary": 50000,
  "isActive": true,
  "createdAt": "2025-01-15T10:00:00Z",
  "updatedAt": "2025-01-15T10:00:00Z",
  "user": { ... },
  "department": { ... }
}
```

#### Get All Teachers
```
GET /teachers?schoolId={schoolId}
Authorization: Bearer {token}
Role: SUPER_ADMIN, SCHOOL_ADMIN, TEACHER

Response: 200 OK
[
  {
    "id": "teacher-123",
    "teacherId": "TCH001",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@school.com",
    "department": { ... },
    "teacherSubjects": [ ... ],
    "isActive": true
  }
]
```

#### Get Teacher by ID
```
GET /teachers/{id}
Authorization: Bearer {token}
Role: SUPER_ADMIN, SCHOOL_ADMIN, TEACHER

Response: 200 OK
{
  "id": "teacher-123",
  "teacherId": "TCH001",
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@school.com",
  "department": { ... },
  "classSubjects": [ ... ],
  "teacherSubjects": [ ... ],
  "isActive": true
}
```

#### Update Teacher
```
PATCH /teachers/{id}
Authorization: Bearer {token}
Role: SUPER_ADMIN, SCHOOL_ADMIN, TEACHER (self only)

Request:
{
  "qualification": "M.Tech Physics",
  "experience": 6,
  "salary": 55000
}

Response: 200 OK
```

#### Delete Teacher (Soft Delete)
```
DELETE /teachers/{id}
Authorization: Bearer {token}
Role: SUPER_ADMIN, SCHOOL_ADMIN

Response: 204 No Content
```

---

### 2. Dashboard Endpoints

#### Get Dashboard
```
GET /teachers/{id}/dashboard?period=month
Authorization: Bearer {token}
Role: TEACHER, SUPER_ADMIN, SCHOOL_ADMIN

Query Parameters:
- period: 'week' | 'month' | 'term' | 'year' (default: 'month')
- classId: (optional) Filter by specific class
- startDate: (optional) YYYY-MM-DD
- endDate: (optional) YYYY-MM-DD

Response: 200 OK
{
  "stats": {
    "totalClasses": 4,
    "totalStudents": 160,
    "totalSubjects": 3,
    "upcomingExams": 5,
    "pendingAssignments": 8
  },
  
  "classesOverview": [
    {
      "classId": "class-123",
      "className": "Class 10-A",
      "grade": 10,
      "section": "A",
      "totalStudents": 40,
      "presentToday": 38,
      "absentToday": 2,
      "attendancePercentage": 95.0
    }
  ],
  
  "upcomingExams": [
    {
      "examId": "exam-123",
      "title": "Physics Final Exam",
      "subject": "Physics",
      "className": "Class 10-A",
      "examDate": "2025-02-15T14:00:00Z",
      "totalStudents": 40,
      "gradedCount": 10,
      "pendingCount": 30
    }
  ],
  
  "recentAttendance": [
    {
      "date": "2025-01-20T00:00:00Z",
      "classId": "class-123",
      "className": "Class 10-A",
      "presentCount": 38,
      "absentCount": 2,
      "lateCount": 0,
      "attendancePercentage": 95.0
    }
  ],
  
  "todayTimetable": [
    {
      "slotId": "slot-123",
      "day": "MONDAY",
      "periodNumber": 1,
      "startTime": "09:00",
      "endTime": "10:00",
      "subject": "Physics",
      "className": "Class 10-A",
      "room": "Lab 1",
      "note": "Practical on gravitation"
    }
  ]
}
```

#### Get Teacher Profile
```
GET /teachers/{id}/profile
Authorization: Bearer {token}
Role: TEACHER, SUPER_ADMIN, SCHOOL_ADMIN

Response: 200 OK
{
  "id": "teacher-123",
  "teacherId": "TCH001",
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@school.com",
  "department": "Science",
  "qualification": "M.Sc Physics",
  "experience": 5,
  "dateOfJoining": "2020-01-15T00:00:00Z",
  "subjects": [
    {
      "name": "Physics",
      "proficiency": "ADVANCED"
    },
    {
      "name": "Chemistry",
      "proficiency": "INTERMEDIATE"
    }
  ],
  "isActive": true,
  "createdAt": "2025-01-15T10:00:00Z",
  "updatedAt": "2025-01-15T10:00:00Z"
}
```

---

### 3. Student Performance Endpoints

#### Get Student Performance
```
GET /teachers/{id}/students/performance?classId={classId}
Authorization: Bearer {token}
Role: TEACHER, SUPER_ADMIN, SCHOOL_ADMIN

Query Parameters:
- classId: (optional) Filter by specific class

Response: 200 OK
[
  {
    "studentId": "student-123",
    "studentName": "Rahul Kumar",
    "rollNumber": "10A-001",
    "className": "Class 10-A",
    "averageMarks": 85.5,
    "grade": "A+",
    "attendance": 96.5,
    "status": "excellent"
  },
  {
    "studentId": "student-124",
    "studentName": "Priya Singh",
    "rollNumber": "10A-002",
    "className": "Class 10-A",
    "averageMarks": 72.3,
    "grade": "A",
    "attendance": 92.0,
    "status": "good"
  }
]
```

---

### 4. Attendance Endpoints

#### Get Attendance Records
```
GET /teachers/{id}/classes/{classId}/attendance?date=2025-01-20
Authorization: Bearer {token}
Role: TEACHER, SUPER_ADMIN, SCHOOL_ADMIN

Query Parameters:
- date: (optional) YYYY-MM-DD format

Response: 200 OK
[
  {
    "studentId": "student-123",
    "studentName": "Rahul Kumar",
    "rollNumber": "10A-001",
    "date": "2025-01-20T00:00:00Z",
    "status": "PRESENT",
    "remarks": null
  },
  {
    "studentId": "student-124",
    "studentName": "Priya Singh",
    "rollNumber": "10A-002",
    "date": "2025-01-20T00:00:00Z",
    "status": "ABSENT",
    "remarks": "Medical leave"
  }
]
```

---

## Data Models

### TeacherDashboardResponseDto
Complete dashboard response with all key metrics and data.

### TeacherProfileDto
Teacher information including qualifications, experience, subjects, and department.

### ClassOverviewDto
Overview of each class taught by the teacher with attendance statistics.

### StudentPerformanceDto
Individual student performance metrics including marks, grades, attendance, and status.

### UpcomingExamDto
Upcoming exams with grading progress.

### AttendanceSummaryDto
Daily attendance summary for each class.

### TimetableSlotDto
Today's timetable schedule for the teacher.

---

## Features

✅ **Real-time Dashboard**
- Total classes, students, subjects count
- Upcoming exams with grading progress
- Pending assignments
- Today's timetable schedule

✅ **Class Management**
- Overview of all classes with attendance
- Student strength and attendance percentage
- Class-wise performance tracking

✅ **Student Performance Tracking**
- Average marks and grades
- Attendance percentage
- Performance status (excellent/good/average/needs improvement)
- Optional class filtering

✅ **Attendance Management**
- Daily attendance records
- Attendance summaries
- Date-wise filtering
- Status tracking (Present/Absent/Late/Excused/Holiday)

✅ **Time-based Analytics**
- Period-based filtering (week/month/term/year)
- Custom date range support
- Trend analysis

✅ **Role-based Access**
- Teachers: View own dashboard and teaching details
- School Admins: View all teacher dashboards
- Super Admins: Full access across all schools

---

## Integration Points

1. **Prisma Service**: Database operations
2. **JWT Auth Guard**: Authentication
3. **Roles Guard**: Authorization
4. **Current User Decorator**: Get authenticated teacher info
5. **Swagger/OpenAPI**: API documentation

---

## Error Handling

- 404 Not Found: Teacher, class, or student not found
- 403 Forbidden: Insufficient permissions
- 400 Bad Request: Invalid input data
- 500 Internal Server Error: Database or server error

