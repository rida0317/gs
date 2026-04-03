// Attendance Dashboard Widget
// src/components/attendance/AttendanceDashboardWidget.tsx

import React, { useState, useEffect } from 'react';
import { useSchoolStore } from '../../store/schoolStore';
import { useAttendanceStore } from '../../store/attendanceStore';
import { t } from '../../utils/translations';
import './AttendanceDashboardWidget.css';

export const AttendanceDashboardWidget: React.FC = () => {
  const { language } = useSchoolStore();
  const { getClassAttendanceSummary, getSchoolStats } = useAttendanceStore();
  const [todayStats, setTodayStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [lowAttendanceStudents, setLowAttendanceStudents] = useState<any[]>([]);

  useEffect(() => {
    loadTodayStats();
  }, []);

  const loadTodayStats = async () => {
    try {
      setLoading(true);
      const today = new Date().toISOString().split('T')[0];
      
      // Get school-wide stats for today
      // const stats = await getSchoolStats(today);
      // setTodayStats(stats.data);

      // Mock data for demo
      setTodayStats({
        total_students: 450,
        total_present: 420,
        total_absent: 25,
        overall_rate: 93.3
      });

      // Get low attendance alerts
      // const lowAtt = await attendanceService.getLowAttendanceStudents(75);
      // setLowAttendanceStudents(lowAtt.data.slice(0, 5));

      // Mock low attendance
      setLowAttendanceStudents([
        { student_name: 'Ahmed Ali', class_name: '1AC-1', attendance_rate: 65.5 },
        { student_name: 'Fatima Zahra', class_name: '2AC-2', attendance_rate: 68.2 },
        { student_name: 'Mohammed Idrissi', class_name: '3AC-1', attendance_rate: 71.0 }
      ]);
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="attendance-widget loading">
        <div className="spinner"></div>
        <p>Loading attendance data...</p>
      </div>
    );
  }

  return (
    <div className="attendance-widget">
      <div className="widget-header">
        <h3>📊 {t('attendance.today', language) || 'Today\'s Attendance'}</h3>
        <span className="date">{new Date().toLocaleDateString()}</span>
      </div>

      {/* Today's Stats */}
      <div className="today-stats">
        <div className="stat-card large">
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <div className="stat-value">{todayStats?.total_students || 0}</div>
            <div className="stat-label">Total Students</div>
          </div>
        </div>

        <div className="stat-card present">
          <div className="stat-icon">✓</div>
          <div className="stat-content">
            <div className="stat-value">{todayStats?.total_present || 0}</div>
            <div className="stat-label">Present</div>
          </div>
        </div>

        <div className="stat-card absent">
          <div className="stat-icon">✗</div>
          <div className="stat-content">
            <div className="stat-value">{todayStats?.total_absent || 0}</div>
            <div className="stat-label">Absent</div>
          </div>
        </div>

        <div className={`stat-card rate ${todayStats?.overall_rate >= 90 ? 'excellent' : todayStats?.overall_rate >= 75 ? 'good' : 'warning'}`}>
          <div className="stat-icon">📈</div>
          <div className="stat-content">
            <div className="stat-value">{todayStats?.overall_rate || 0}%</div>
            <div className="stat-label">Attendance Rate</div>
          </div>
        </div>
      </div>

      {/* Low Attendance Alerts */}
      {lowAttendanceStudents.length > 0 && (
        <div className="low-attendance-alerts">
          <div className="alert-header">
            <h4>⚠️ {t('attendance.lowAttendance', language) || 'Low Attendance Alerts'}</h4>
            <span className="badge">{lowAttendanceStudents.length}</span>
          </div>

          <div className="alerts-list">
            {lowAttendanceStudents.map((student, index) => (
              <div key={index} className="alert-item">
                <div className="student-info">
                  <div className="avatar">
                    {student.student_name.split(' ').map((n: string) => n[0]).join('').substring(0, 2)}
                  </div>
                  <div className="details">
                    <div className="name">{student.student_name}</div>
                    <div className="class">{student.class_name}</div>
                  </div>
                </div>
                <div className={`rate-badge ${student.attendance_rate < 70 ? 'critical' : 'warning'}`}>
                  {student.attendance_rate}%
                </div>
              </div>
            ))}
          </div>

          <button className="btn btn-link btn-block">
            View All Alerts →
          </button>
        </div>
      )}

      {/* Quick Actions */}
      <div className="quick-actions">
        <button className="action-btn">
          <span className="icon">📝</span>
          <span>Mark Attendance</span>
        </button>
        <button className="action-btn">
          <span className="icon">📊</span>
          <span>View Reports</span>
        </button>
        <button className="action-btn">
          <span className="icon">📱</span>
          <span>Send SMS</span>
        </button>
      </div>
    </div>
  );
};

export default AttendanceDashboardWidget;
