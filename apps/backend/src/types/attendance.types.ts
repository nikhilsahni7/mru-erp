import { AttendanceStatus } from "../lib/prisma";

export interface AttendanceRecordDTO {
  id: string;
  studentId: string;
  status: AttendanceStatus;
  remark?: string | null;
  student?: {
    id: string;
    name: string;
    rollNo: string;
    group?: {
      id: string;
      name: string;
    } | null;
  };
}

export interface AttendanceSessionDTO {
  id: string;
  date: Date;
  startTime: Date;
  endTime: Date;
  topic?: string | null;
  componentId: string;
  componentType: string;
  course: {
    id: string;
    code: string;
    name: string;
  };
  section: {
    id: string;
    name: string;
  };
  group?: {
    id: string;
    name: string;
  } | null;
  statistics: {
    totalStudents: number;
    presentCount: number;
    absentCount: number;
    lateCount: number;
    attendancePercentage: number;
  };
}

export interface StudentAttendanceDTO {
  student: {
    id: string;
    name: string;
    rollNo: string;
    group?: {
      id: string;
      name: string;
    } | null;
  };
  statistics: {
    totalSessions: number;
    presentCount: number;
    absentCount: number;
    lateCount: number;
    leaveCount: number;
    excusedCount: number;
    attendancePercentage: number;
  };
}

export interface ComponentAttendanceSummaryDTO {
  component: {
    id: string;
    type: string;
    course: {
      id: string;
      code: string;
      name: string;
    };
    section: {
      id: string;
      name: string;
    };
    group?: {
      id: string;
      name: string;
    } | null;
    teacher?: {
      id: string;
      name: string;
    } | null;
  };
  overallStats: {
    totalSessions: number;
    averageAttendance: number;
  };
  sessionStats: Array<{
    sessionId: string;
    date: Date;
    startTime: Date;
    endTime: Date;
    topic?: string | null;
    statistics: {
      totalStudents: number;
      presentCount: number;
      absentCount: number;
      lateCount: number;
      leaveCount: number;
      excusedCount: number;
      attendancePercentage: number;
    };
  }>;
  studentStats: StudentAttendanceDTO[];
}

export interface DateRangeAttendanceDTO {
  component: {
    id: string;
    type: string;
    course: {
      id: string;
      code: string;
      name: string;
    };
    section: {
      id: string;
      name: string;
    };
    group?: {
      id: string;
      name: string;
    } | null;
    teacher?: {
      id: string;
      name: string;
    } | null;
  };
  dateRange: {
    startDate: Date;
    endDate: Date;
  };
  sessions: Array<{
    id: string;
    date: Date;
    startTime: Date;
    endTime: Date;
    topic?: string | null;
    statistics: {
      totalStudents: number;
      presentCount: number;
      absentCount: number;
      lateCount: number;
      attendancePercentage: number;
    };
    students: Array<{
      id: string;
      name: string;
      rollNo: string;
      status: AttendanceStatus;
      remark?: string | null;
      recordId: string;
    }>;
  }>;
  studentAttendance: StudentAttendanceDTO[];
}

export interface CreateAttendanceSessionParams {
  componentId: string;
  date: Date;
  startTime: Date;
  endTime: Date;
  topic?: string;
}

export interface MarkAttendanceParams {
  sessionId: string;
  attendanceRecords: Array<{
    studentId: string;
    status: AttendanceStatus;
    remark?: string;
  }>;
}

export interface UpdateAttendanceRecordParams {
  recordId: string;
  status: AttendanceStatus;
  remark?: string;
}
