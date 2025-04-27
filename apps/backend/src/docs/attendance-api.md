# Attendance API Documentation

## Overview

The Attendance API provides endpoints for teachers to manage attendance for their courses. Teachers can create attendance sessions, mark attendance for students, and view attendance statistics.

## Authentication

All attendance routes require authentication using a JWT token, which should be included in:

- An HTTP-only cookie named `accessToken`, or
- The Authorization header in the format `Bearer <token>`

## Endpoints

### Get Components for a Specific Day

```
GET /api/v1/teacher/components/:day
```

Get all course components assigned to the teacher for a specific day of the week. Use this endpoint to get the correct component IDs for creating attendance sessions.

**Path Parameters:**

- `day`: Day of the week (`MONDAY`, `TUESDAY`, `WEDNESDAY`, `THURSDAY`, `FRIDAY`, `SATURDAY`, `SUNDAY`)

**Response:**

```json
[
  {
    "id": "string",
    "componentType": "LABORATORY",
    "course": {
      "id": "string",
      "code": "ADA_LAB",
      "name": "Algorithm Design and Analysis Lab"
    },
    "section": {
      "id": "string",
      "name": "CSE6B"
    },
    "group": {
      "id": "string",
      "name": "G1"
    },
    "schedules": [
      {
        "day": "MONDAY",
        "startTime": "2025-01-01T09:40:00.000Z",
        "endTime": "2025-01-01T10:30:00.000Z",
        "roomNumber": "G4"
      }
    ]
  }
]
```

### Create Attendance Session

```
POST /api/v1/attendance/session
```

Create a new attendance session for a course component.

**Important Notes:**

1. Use the `/api/v1/teacher/components/:day` endpoint to get the correct component ID for the day.
2. The system validates that the component has a scheduled class on the specified day.
3. If a session already exists with the same componentId, date, and startTime, the existing session will be returned.

**Request Body:**

```json
{
  "componentId": "string",   // ID of the course component
  "date": "2024-02-15",      // Date for the attendance session
  "startTime": "2024-02-15T09:00:00.000Z",  // Start time
  "endTime": "2024-02-15T10:30:00.000Z",    // End time
  "topic": "string"          // Optional topic covered in the session
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "string",
    "date": "2024-02-15",
    "startTime": "2024-02-15T09:00:00.000Z",
    "endTime": "2024-02-15T10:30:00.000Z",
    "topic": "string",
    "componentId": "string",
    "componentType": "LECTURE",
    "course": {
      "id": "string",
      "code": "CSE101",
      "name": "Introduction to Programming"
    },
    "section": {
      "id": "string",
      "name": "CSE6B"
    },
    "group": {
      "id": "string",
      "name": "G1"
    },
    "statistics": {
      "totalStudents": 0,
      "presentCount": 0,
      "absentCount": 0,
      "lateCount": 0,
      "attendancePercentage": 0
    }
  }
}
```

### Mark Attendance

```
POST /api/v1/attendance/mark
```

Mark attendance for students in a session. By default, all students are initially marked as ABSENT. Use this endpoint to update their status.

**Request Body:**

```json
{
  "sessionId": "string",
  "attendanceRecords": [
    {
      "studentId": "string",
      "status": "PRESENT",
      "remark": "string"  // Optional
    }
  ]
}
```

**Example:**

```json
{
  "sessionId": "285056e8-3b1f-4dd5-bfd6-ceba84507218",
  "attendanceRecords": [
    { "studentId": "4e740795-bdcb-4ba2-9235-96ebcd89ce14", "status": "ABSENT" },
    { "studentId": "8d616bfa-b634-4190-92f0-59d43b988785", "status": "ABSENT" },
    { "studentId": "6c468528-820c-4182-a2d3-9feeb7c0deb6", "status": "PRESENT" }
  ]
}
```

**Response:**

```json
{
  "success": true,
  "updated": 3,
  "total": 3
}
```

### Get Students for Attendance

```
GET /api/v1/attendance/students/:componentId
```

Get a list of students for a specific course component. This endpoint returns the students who are enrolled in the course component, based on their section and group assignments.

**Response:**

```json
[
  {
    "id": "string",
    "name": "John Doe",
    "rollNo": "2K22CSUN01074",
    "group": {
      "id": "string",
      "name": "G1"
    }
  }
]
```

### Get Attendance Sessions by Date Range

```
GET /api/v1/attendance/sessions?startDate=2024-02-01&endDate=2024-02-28
```

Get attendance sessions for a teacher within a specified date range.

**Query Parameters:**

- `startDate`: Start date in YYYY-MM-DD format
- `endDate`: End date in YYYY-MM-DD format

**Response:**

```json
[
  {
    "id": "string",
    "date": "2024-02-15",
    "startTime": "2024-02-15T09:00:00.000Z",
    "endTime": "2024-02-15T10:30:00.000Z",
    "topic": "string",
    "componentId": "string",
    "componentType": "LECTURE",
    "course": {
      "id": "string",
      "code": "CSE101",
      "name": "Introduction to Programming"
    },
    "section": {
      "id": "string",
      "name": "CSE6B"
    },
    "group": {
      "id": "string",
      "name": "G1"
    },
    "statistics": {
      "totalStudents": 25,
      "presentCount": 20,
      "absentCount": 5,
      "lateCount": 0,
      "attendancePercentage": 80
    }
  }
]
```

### Get Attendance Session Details

```
GET /api/v1/attendance/session/:sessionId
```

Get detailed information about a specific attendance session, including all student records.

**Response:**

```json
{
  "id": "string",
  "date": "2024-02-15",
  "startTime": "2024-02-15T09:00:00.000Z",
  "endTime": "2024-02-15T10:30:00.000Z",
  "topic": "string",
  "course": {
    "id": "string",
    "code": "CSE101",
    "name": "Introduction to Programming"
  },
  "componentType": "LECTURE",
  "section": {
    "id": "string",
    "name": "CSE6B"
  },
  "group": {
    "id": "string",
    "name": "G1"
  },
  "teacher": {
    "id": "string",
    "name": "Dr. Jane Smith"
  },
  "statistics": {
    "totalStudents": 25,
    "presentCount": 20,
    "absentCount": 4,
    "lateCount": 1,
    "leaveCount": 0,
    "excusedCount": 0,
    "attendancePercentage": 84
  },
  "records": [
    {
      "id": "string",
      "studentId": "string",
      "status": "PRESENT",
      "remark": "string",
      "student": {
        "id": "string",
        "name": "John Doe",
        "rollNo": "2K22CSUN01074",
        "group": {
          "id": "string",
          "name": "G1"
        }
      }
    }
  ]
}
```

### Get Component Attendance Summary

```
GET /api/v1/attendance/summary/component/:componentId
```

Get a summary of attendance for a specific course component, including overall statistics, session statistics, and student statistics.

**Response:**

```json
{
  "component": {
    "id": "string",
    "type": "LECTURE",
    "course": {
      "id": "string",
      "code": "CSE101",
      "name": "Introduction to Programming"
    },
    "section": {
      "id": "string",
      "name": "CSE6B"
    },
    "group": {
      "id": "string",
      "name": "G1"
    },
    "teacher": {
      "id": "string",
      "name": "Dr. Jane Smith"
    }
  },
  "overallStats": {
    "totalSessions": 10,
    "averageAttendance": 87.5
  },
  "sessionStats": [
    {
      "sessionId": "string",
      "date": "2024-02-15",
      "startTime": "2024-02-15T09:00:00.000Z",
      "endTime": "2024-02-15T10:30:00.000Z",
      "topic": "string",
      "statistics": {
        "totalStudents": 25,
        "presentCount": 22,
        "absentCount": 3,
        "lateCount": 0,
        "leaveCount": 0,
        "excusedCount": 0,
        "attendancePercentage": 88
      }
    }
  ],
  "studentStats": [
    {
      "student": {
        "id": "string",
        "name": "John Doe",
        "rollNo": "2K22CSUN01074",
        "group": {
          "id": "string",
          "name": "G1"
        }
      },
      "statistics": {
        "totalSessions": 10,
        "presentCount": 8,
        "absentCount": 1,
        "lateCount": 1,
        "leaveCount": 0,
        "excusedCount": 0,
        "attendancePercentage": 90
      }
    }
  ]
}
```

### Get Student Course Attendance

```
GET /api/v1/attendance/summary/student/:studentId/course/:courseId
```

Get attendance summary for a specific student in a specific course.

**Response:**

```json
{
  "student": {
    "id": "string",
    "name": "John Doe",
    "rollNo": "2K22CSUN01074",
    "group": {
      "id": "string",
      "name": "G1"
    },
    "section": {
      "id": "string",
      "name": "CSE6B"
    }
  },
  "course": {
    "id": "string",
    "code": "CSE101",
    "name": "Introduction to Programming"
  },
  "overallAttendance": 87.5,
  "components": [
    {
      "componentId": "string",
      "componentType": "LECTURE",
      "group": {
        "id": "string",
        "name": "G1"
      },
      "statistics": {
        "totalSessions": 10,
        "presentCount": 8,
        "absentCount": 1,
        "lateCount": 1,
        "leaveCount": 0,
        "excusedCount": 0,
        "attendancePercentage": 90
      },
      "sessions": [
        {
          "sessionId": "string",
          "date": "2024-02-15",
          "startTime": "2024-02-15T09:00:00.000Z",
          "endTime": "2024-02-15T10:30:00.000Z",
          "topic": "string",
          "status": "PRESENT",
          "remark": null
        }
      ]
    }
  ]
}
```

### Get Today's Attendance Sessions

```
GET /api/v1/attendance/today
```

Get attendance sessions for the current day for the authenticated teacher.

**Response:**
Same format as `/api/v1/attendance/sessions`.

### Update Attendance Record

```
PUT /api/v1/attendance/record/:recordId
```

Update an attendance record for a student.

**Request Body:**

```json
{
  "status": "PRESENT",
  "remark": "string"
}
```

**Response:**

```json
{
  "id": "string",
  "status": "PRESENT",
  "remark": "string",
  "student": {
    "id": "string",
    "name": "John Doe",
    "rollNo": "2K22CSUN01074"
  },
  "course": {
    "code": "CSE101",
    "name": "Introduction to Programming"
  },
  "session": {
    "id": "string",
    "date": "2024-02-15",
    "componentType": "LECTURE"
  }
}
```

### Get Attendance by Date Range

```
GET /api/v1/attendance/range/:componentId?startDate=2024-02-01&endDate=2024-02-28
```

Get attendance data for a specific course component within a specified date range.

**Query Parameters:**

- `startDate`: Start date in YYYY-MM-DD format
- `endDate`: End date in YYYY-MM-DD format

**Response:**

```json
{
  "component": {
    "id": "string",
    "type": "LECTURE",
    "course": {
      "id": "string",
      "code": "CSE101",
      "name": "Introduction to Programming"
    },
    "section": {
      "id": "string",
      "name": "CSE6B"
    },
    "group": {
      "id": "string",
      "name": "G1"
    },
    "teacher": {
      "id": "string",
      "name": "Dr. Jane Smith"
    }
  },
  "dateRange": {
    "startDate": "2024-02-01",
    "endDate": "2024-02-28"
  },
  "sessions": [
    {
      "id": "string",
      "date": "2024-02-15",
      "startTime": "2024-02-15T09:00:00.000Z",
      "endTime": "2024-02-15T10:30:00.000Z",
      "topic": "string",
      "statistics": {
        "totalStudents": 25,
        "presentCount": 20,
        "absentCount": 4,
        "lateCount": 1,
        "attendancePercentage": 84
      },
      "students": [
        {
          "id": "string",
          "name": "John Doe",
          "rollNo": "2K22CSUN01074",
          "status": "PRESENT",
          "remark": null,
          "recordId": "string"
        }
      ]
    }
  ],
  "studentAttendance": [
    {
      "student": {
        "id": "string",
        "name": "John Doe",
        "rollNo": "2K22CSUN01074",
        "group": {
          "id": "string",
          "name": "G1"
        }
      },
      "statistics": {
        "totalSessions": 4,
        "presentCount": 3,
        "absentCount": 1,
        "lateCount": 0,
        "leaveCount": 0,
        "excusedCount": 0,
        "attendancePercentage": 75
      }
    }
  ]
}
```

## Status Codes

The following status codes are used in the API:

- 200: Success
- 201: Created
- 400: Bad request
- 401: Unauthorized
- 403: Forbidden
- 404: Not found
- 500: Server error

## Attendance Status Types

The following attendance status types are available:

- `PRESENT`: Student attended the class
- `ABSENT`: Student did not attend the class
- `LATE`: Student was late to class
- `LEAVE`: Student was on approved leave
- `EXCUSED`: Student's absence was excused

## Frontend Integration Guide

### Recommended Workflow for Marking Attendance

1. **Get the Correct Component ID**:
   - Use the `/api/v1/teacher/components/MONDAY` endpoint (replace `MONDAY` with the current day) to get the list of course components scheduled for that day.
   - Select the appropriate component for which you want to mark attendance.

2. **Create an Attendance Session**:
   - Use the component ID from step 1 to create a new attendance session with the `/api/v1/attendance/session` endpoint.
   - Note: If a session already exists for the same component, date, and time, the existing session will be returned.

3. **Get Students List**:
   - Fetch the list of students for the component using `/api/v1/attendance/students/:componentId`.
   - This will give you the complete list of students who should be in the class.

4. **Mark Attendance**:
   - Create a UI that allows teachers to mark students as PRESENT, ABSENT, LATE, etc.
   - Send the attendance data to the `/api/v1/attendance/mark` endpoint.
   - Remember that all students are initially marked as ABSENT, so you only need to update the status for students who are PRESENT or have a different status.

5. **View Attendance Data**:
   - Use the various summary endpoints to display attendance statistics and history.

### Common Error Scenarios

1. **Wrong Component for Day**: If you try to create a session for a component that doesn't have a scheduled class on that day, you'll receive a 400 error with a message indicating the invalid schedule.

2. **Duplicate Session**: The API prevents creating duplicate sessions for the same component, date, and time. Instead, it will return the existing session.

3. **Missing Required Fields**: Ensure all required fields are included in your requests, especially for creating sessions and marking attendance.
