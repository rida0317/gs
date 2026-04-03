import React from 'react'
import { StatCard, ChartCard, QuickActionCard } from './Dashboard'
import { Button } from './ui'

const DashboardModern: React.FC = () => {
  // Sample data - replace with real data from your stores
  const stats = {
    students: 1250,
    teachers: 85,
    classes: 42,
    attendance: 94.5,
  }

  const quickActions = [
    { title: 'Add Student', icon: '👨‍🎓', color: '#1e3a8a', onClick: () => console.log('Add Student') },
    { title: 'Add Teacher', icon: '👨‍🏫', color: '#10b981', onClick: () => console.log('Add Teacher') },
    { title: 'Create Class', icon: '🏫', color: '#f59e0b', onClick: () => console.log('Create Class') },
    { title: 'New Attendance', icon: '📅', color: '#ef4444', onClick: () => console.log('New Attendance') },
    { title: 'Add Grade', icon: '📊', color: '#8b5cf6', onClick: () => console.log('Add Grade') },
    { title: 'Send Message', icon: '💬', color: '#0ea5e9', onClick: () => console.log('Send Message') },
  ]

  return (
    <div className="space-y-8 animation-fade-in">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted mt-1">Welcome back! Here's what's happening today.</p>
        </div>
        <Button variant="primary" size="lg">
          📥 Download Report
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Students"
          value={stats.students}
          icon="👨‍🎓"
          trend={{ value: 12.5, isPositive: true }}
          color="primary"
        />
        <StatCard
          title="Total Teachers"
          value={stats.teachers}
          icon="👨‍🏫"
          trend={{ value: 8.2, isPositive: true }}
          color="success"
        />
        <StatCard
          title="Total Classes"
          value={stats.classes}
          icon="🏫"
          trend={{ value: 3.1, isPositive: true }}
          color="warning"
        />
        <StatCard
          title="Attendance Rate"
          value={`${stats.attendance}%`}
          icon="📅"
          trend={{ value: 2.4, isPositive: false }}
          color="danger"
        />
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-semibold text-foreground mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {quickActions.map((action) => (
            <QuickActionCard
              key={action.title}
              {...action}
            />
          ))}
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard
          title="Attendance Overview"
          icon="📊"
        >
          <div className="h-64 flex items-center justify-center text-muted">
            <p>Chart placeholder - Integrate with Recharts</p>
          </div>
        </ChartCard>

        <ChartCard
          title="Student Performance"
          icon="📈"
        >
          <div className="h-64 flex items-center justify-center text-muted">
            <p>Chart placeholder - Integrate with Recharts</p>
          </div>
        </ChartCard>
      </div>

      {/* Recent Activity */}
      <ChartCard
        title="Recent Activity"
        icon="🔔"
      >
        <div className="space-y-4">
          {[1, 2, 3, 4].map((item) => (
            <div key={item} className="flex items-center gap-4 p-3 rounded-lg hover:bg-hover transition-colors">
              <div className="w-10 h-10 rounded-full bg-primary-light text-primary flex items-center justify-center font-semibold">
                {item}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">Activity item {item}</p>
                <p className="text-xs text-muted">2 hours ago</p>
              </div>
              <Button variant="ghost" size="sm">View</Button>
            </div>
          ))}
        </div>
      </ChartCard>
    </div>
  )
}

export default DashboardModern
