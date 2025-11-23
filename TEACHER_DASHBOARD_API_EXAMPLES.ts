/**
 * Teacher Dashboard API Examples
 * Test these endpoints using Postman, cURL, or similar tools
 */

// ============================================
// 1. CREATE TEACHER
// ============================================

/*
POST http://localhost:3000/teachers
Authorization: Bearer {token}
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@school.com",
  "password": "SecurePassword123!",
  "teacherId": "TCH001",
  "schoolId": "school-uuid-123",
  "departmentId": "science-dept-uuid",
  "qualification": "M.Sc Physics, B.Ed",
  "experience": 8,
  "dateOfJoining": "2017-06-01",
  "salary": 65000
}

Expected Response (201 Created):
{
  "id": "teacher-uuid-123",
  "userId": "user-uuid-456",
  "teacherId": "TCH001",
  "schoolId": "school-uuid-123",
  "departmentId": "science-dept-uuid",
  "qualification": "M.Sc Physics, B.Ed",
  "experience": 8,
  "dateOfJoining": "2017-06-01T00:00:00.000Z",
  "salary": 65000,
  "isActive": true,
  "createdAt": "2025-01-20T10:30:00.000Z",
  "updatedAt": "2025-01-20T10:30:00.000Z",
  "user": {
    "id": "user-uuid-456",
    "email": "john.doe@school.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "TEACHER",
    "isActive": true,
    "createdAt": "2025-01-20T10:30:00.000Z"
  },
  "department": {
    "id": "science-dept-uuid",
    "name": "Science",
    "code": "SCI"
  }
}
*/

// ============================================
// 2. GET ALL TEACHERS
// ============================================

/*
GET http://localhost:3000/teachers?schoolId=school-uuid-123
Authorization: Bearer {token}

Expected Response (200 OK):
[
  {
    "id": "teacher-uuid-123",
    "teacherId": "TCH001",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@school.com",
    "isActive": true,
    "department": {
      "id": "science-dept-uuid",
      "name": "Science"
    },
    "teacherSubjects": [
      {
        "id": "ts-uuid-1",
        "subjectId": "physics-uuid",
        "proficiencyLevel": "ADVANCED",
        "isPrimary": true,
        "subject": {
          "id": "physics-uuid",
          "name": "Physics",
          "code": "PHY"
        }
      }
    ]
  }
]
*/

// ============================================
// 3. GET TEACHER PROFILE
// ============================================

/*
GET http://localhost:3000/teachers/teacher-uuid-123/profile
Authorization: Bearer {token}

Expected Response (200 OK):
{
  "id": "teacher-uuid-123",
  "teacherId": "TCH001",
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@school.com",
  "department": "Science",
  "qualification": "M.Sc Physics, B.Ed",
  "experience": 8,
  "dateOfJoining": "2017-06-01T00:00:00.000Z",
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
  "createdAt": "2025-01-20T10:30:00.000Z",
  "updatedAt": "2025-01-20T10:30:00.000Z"
}
*/

// ============================================
// 4. GET DASHBOARD - MONTHLY VIEW
// ============================================

/*
GET http://localhost:3000/teachers/teacher-uuid-123/dashboard?period=month
Authorization: Bearer {token}

Expected Response (200 OK):
{
  "stats": {
    "totalClasses": 4,
    "totalStudents": 156,
    "totalSubjects": 3,
    "upcomingExams": 7,
    "pendingAssignments": 12
  },
  
  "classesOverview": [
    {
      "classId": "class-uuid-1",
      "className": "Class 10-A",
      "grade": 10,
      "section": "A",
      "totalStudents": 42,
      "presentToday": 40,
      "absentToday": 2,
      "attendancePercentage": 95.24
    },
    {
      "classId": "class-uuid-2",
      "className": "Class 10-B",
      "grade": 10,
      "section": "B",
      "totalStudents": 39,
      "presentToday": 37,
      "absentToday": 2,
      "attendancePercentage": 94.87
    },
    {
      "classId": "class-uuid-3",
      "className": "Class 12-A",
      "grade": 12,
      "section": "A",
      "totalStudents": 38,
      "presentToday": 36,
      "absentToday": 2,
      "attendancePercentage": 94.74
    },
    {
      "classId": "class-uuid-4",
      "className": "Class 12-B",
      "grade": 12,
      "section": "B",
      "totalStudents": 37,
      "presentToday": 35,
      "absentToday": 2,
      "attendancePercentage": 94.59
    }
  ],
  
  "upcomingExams": [
    {
      "examId": "exam-uuid-1",
      "title": "Physics Mid-Term",
      "subject": "Physics",
      "className": "Class 10-A",
      "examDate": "2025-02-10T14:00:00.000Z",
      "totalStudents": 42,
      "gradedCount": 8,
      "pendingCount": 34
    },
    {
      "examId": "exam-uuid-2",
      "title": "Physics Final Exam",
      "subject": "Physics",
      "className": "Class 10-B",
      "examDate": "2025-02-15T14:00:00.000Z",
      "totalStudents": 39,
      "gradedCount": 5,
      "pendingCount": 34
    },
    {
      "examId": "exam-uuid-3",
      "title": "Chemistry Mid-Term",
      "subject": "Chemistry",
      "className": "Class 10-A",
      "examDate": "2025-02-12T10:00:00.000Z",
      "totalStudents": 42,
      "gradedCount": 0,
      "pendingCount": 42
    }
  ],
  
  "recentAttendance": [
    {
      "date": "2025-01-20T00:00:00.000Z",
      "classId": "class-uuid-1",
      "className": "Class 10-A",
      "presentCount": 40,
      "absentCount": 2,
      "lateCount": 0,
      "attendancePercentage": 95.24
    },
    {
      "date": "2025-01-20T00:00:00.000Z",
      "classId": "class-uuid-2",
      "className": "Class 10-B",
      "presentCount": 37,
      "absentCount": 2,
      "lateCount": 0,
      "attendancePercentage": 94.87
    }
  ],
  
  "todayTimetable": [
    {
      "slotId": "slot-uuid-1",
      "day": "MONDAY",
      "periodNumber": 1,
      "startTime": "09:00",
      "endTime": "10:00",
      "subject": "Physics",
      "className": "Class 10-A",
      "room": "Lab 1",
      "note": "Practical on gravitation"
    },
    {
      "slotId": "slot-uuid-2",
      "day": "MONDAY",
      "periodNumber": 3,
      "startTime": "10:30",
      "endTime": "11:30",
      "subject": "Chemistry",
      "className": "Class 10-B",
      "room": "Lab 2",
      "note": "Periodic table revision"
    },
    {
      "slotId": "slot-uuid-3",
      "day": "MONDAY",
      "periodNumber": 2,
      "startTime": "10:00",
      "endTime": "10:30",
      "subject": "Break",
      "className": "N/A",
      "room": "Staff Room",
      "note": null
    }
  ]
}
*/

// ============================================
// 5. GET STUDENT PERFORMANCE
// ============================================

/*
GET http://localhost:3000/teachers/teacher-uuid-123/students/performance?classId=class-uuid-1
Authorization: Bearer {token}

Expected Response (200 OK):
[
  {
    "studentId": "student-uuid-1",
    "studentName": "Rahul Kumar",
    "rollNumber": "10A-001",
    "className": "Class 10-A",
    "averageMarks": 85.5,
    "grade": "A+",
    "attendance": 96.5,
    "status": "excellent"
  },
  {
    "studentId": "student-uuid-2",
    "studentName": "Priya Singh",
    "rollNumber": "10A-002",
    "className": "Class 10-A",
    "averageMarks": 72.3,
    "grade": "A",
    "attendance": 92.0,
    "status": "good"
  },
  {
    "studentId": "student-uuid-3",
    "studentName": "Arjun Patel",
    "rollNumber": "10A-003",
    "className": "Class 10-A",
    "averageMarks": 58.2,
    "grade": "B",
    "attendance": 88.5,
    "status": "average"
  },
  {
    "studentId": "student-uuid-4",
    "studentName": "Anjali Verma",
    "rollNumber": "10A-004",
    "className": "Class 10-A",
    "averageMarks": 42.1,
    "grade": "B",
    "attendance": 85.0,
    "status": "needs_improvement"
  }
]
*/

// ============================================
// 6. GET ATTENDANCE RECORDS
// ============================================

/*
GET http://localhost:3000/teachers/teacher-uuid-123/classes/class-uuid-1/attendance?date=2025-01-20
Authorization: Bearer {token}

Expected Response (200 OK):
[
  {
    "studentId": "student-uuid-1",
    "studentName": "Rahul Kumar",
    "rollNumber": "10A-001",
    "date": "2025-01-20T00:00:00.000Z",
    "status": "PRESENT",
    "remarks": null
  },
  {
    "studentId": "student-uuid-2",
    "studentName": "Priya Singh",
    "rollNumber": "10A-002",
    "date": "2025-01-20T00:00:00.000Z",
    "status": "PRESENT",
    "remarks": null
  },
  {
    "studentId": "student-uuid-3",
    "studentName": "Arjun Patel",
    "rollNumber": "10A-003",
    "date": "2025-01-20T00:00:00.000Z",
    "status": "ABSENT",
    "remarks": "Medical leave"
  },
  {
    "studentId": "student-uuid-4",
    "studentName": "Anjali Verma",
    "rollNumber": "10A-004",
    "date": "2025-01-20T00:00:00.000Z",
    "status": "LATE",
    "remarks": "Traffic issue"
  }
]
*/

// ============================================
// 7. UPDATE TEACHER
// ============================================

/*
PATCH http://localhost:3000/teachers/teacher-uuid-123
Authorization: Bearer {token}
Content-Type: application/json

{
  "qualification": "M.Tech Physics, B.Ed",
  "experience": 9,
  "salary": 70000
}

Expected Response (200 OK):
{
  "id": "teacher-uuid-123",
  "userId": "user-uuid-456",
  "teacherId": "TCH001",
  "schoolId": "school-uuid-123",
  "departmentId": "science-dept-uuid",
  "qualification": "M.Tech Physics, B.Ed",
  "experience": 9,
  "dateOfJoining": "2017-06-01T00:00:00.000Z",
  "salary": 70000,
  "isActive": true,
  "updatedAt": "2025-01-20T15:45:00.000Z"
}
*/

// ============================================
// 8. DELETE TEACHER (SOFT DELETE)
// ============================================

/*
DELETE http://localhost:3000/teachers/teacher-uuid-123
Authorization: Bearer {token}

Expected Response (204 No Content):
(No body - just status code 204)
*/

// ============================================
// CURL EXAMPLES
// ============================================

/*
# Get Dashboard (cURL)
curl -X GET "http://localhost:3000/teachers/teacher-uuid-123/dashboard?period=month" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"

# Get Student Performance (cURL)
curl -X GET "http://localhost:3000/teachers/teacher-uuid-123/students/performance?classId=class-uuid-1" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"

# Get Attendance (cURL)
curl -X GET "http://localhost:3000/teachers/teacher-uuid-123/classes/class-uuid-1/attendance?date=2025-01-20" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"

# Create Teacher (cURL)
curl -X POST "http://localhost:3000/teachers" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@school.com",
    "password": "SecurePassword123!",
    "teacherId": "TCH001",
    "schoolId": "school-uuid-123",
    "departmentId": "science-dept-uuid",
    "qualification": "M.Sc Physics",
    "experience": 8
  }'
*/
