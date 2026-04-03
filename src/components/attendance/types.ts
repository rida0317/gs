// Attendance Component Types
// src/components/attendance/types.ts

export interface AttendanceCalendarProps {
  classId: string;
  date: string;
  onAttendanceMarked?: () => void;
}

export interface StudentAttendanceRecord {
  id: string;
  student_id: string;
  student_name?: string;
  code_massar?: string;
  status: 'present' | 'absent' | 'late' | 'excused';
  notes?: string;
  check_in_time?: string;
  check_out_time?: string;
}

export interface AttendanceStats {
  total: number;
  present: number;
  absent: number;
  late: number;
  excused: number;
  rate: number;
}

export interface DailyAttendanceProps {
  classId: string;
  date: string;
}

export interface AttendanceReportProps {
  classId: string;
  startDate: string;
  endDate: string;
}

export interface StudentAttendanceHistoryProps {
  studentId: string;
  academicYear?: string;
}

export interface AbsenceJustificationFormProps {
  studentId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export interface JustificationReviewProps {
  justificationId: string;
  onSuccess?: () => void;
}
