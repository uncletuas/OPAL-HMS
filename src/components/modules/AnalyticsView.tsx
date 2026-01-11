import { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Users, Activity, Loader2, AlertCircle } from 'lucide-react';
import { projectId, publicAnonKey } from '../../utils/supabase/info';

export function AnalyticsView() {
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const session = JSON.parse(localStorage.getItem('session') || '{}');
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-a210bd47/analytics`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      const data = await response.json();
      if (data.success) {
        setAnalytics(data.analytics);
      } else {
        setError('Failed to load analytics data');
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
      setError('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="size-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
        <div className="flex items-center gap-2">
          <AlertCircle className="size-5" />
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl mb-1">Analytics & Reports</h3>
        <p className="text-gray-600">Hospital performance metrics and insights</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <MetricCard
          icon={Users}
          label="Total Patients"
          value={analytics?.metrics?.totalPatients?.toString() || '0'}
          trend="+12%"
          trendUp={true}
        />
        <MetricCard
          icon={Activity}
          label="Appointments This Month"
          value={analytics?.metrics?.appointmentsThisMonth?.toString() || '0'}
          trend="+8%"
          trendUp={true}
        />
        <MetricCard
          icon={BarChart3}
          label="Lab Tests Completed"
          value={analytics?.metrics?.labTestsCompleted?.toString() || '0'}
          trend="+15%"
          trendUp={true}
        />
        <MetricCard
          icon={TrendingUp}
          label="Active Staff"
          value={analytics?.metrics?.activeStaff?.toString() || '0'}
          trend="+2%"
          trendUp={true}
        />
      </div>

      {/* Department Performance */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h4 className="text-lg mb-6">Department Performance</h4>
        <div className="space-y-4">
          {analytics?.departmentPerformance?.map((dept: any, index: number) => {
            const colors = ['blue', 'green', 'purple', 'yellow'];
            return (
              <DepartmentBar
                key={dept.department}
                department={dept.department}
                value={dept.performance}
                color={colors[index % colors.length]}
              />
            );
          }) || []}
        </div>
      </div>

      {/* Weekly Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h4 className="text-lg mb-4">Weekly Appointments</h4>
          <div className="space-y-3">
            {analytics?.weeklyAppointments?.map((day: any) => (
              <WeekdayBar key={day.day} day={day.day} value={day.appointments} />
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h4 className="text-lg mb-4">Lab Test Turnaround Time</h4>
          <div className="space-y-4">
            {analytics?.labTurnaroundTimes?.map((test: any) => (
              <TestTypeBar key={test.test} test={test.test} avgTime={test.avgTime} />
            ))}
          </div>
        </div>
      </div>

      {/* Revenue Overview */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h4 className="text-lg mb-6">Monthly Revenue Overview</h4>
        <div className="grid grid-cols-3 gap-6">
          {analytics?.revenueOverview && (
            <>
              <RevenueCard
                label="Consultations"
                amount={`$${analytics.revenueOverview.consultations.amount.toLocaleString()}`}
                percentage={`${analytics.revenueOverview.consultations.percentage}%`}
                color="blue"
              />
              <RevenueCard
                label="Lab Tests"
                amount={`$${analytics.revenueOverview.labTests.amount.toLocaleString()}`}
                percentage={`${analytics.revenueOverview.labTests.percentage}%`}
                color="green"
              />
              <RevenueCard
                label="Pharmacy"
                amount={`$${analytics.revenueOverview.pharmacy.amount.toLocaleString()}`}
                percentage={`${analytics.revenueOverview.pharmacy.percentage}%`}
                color="purple"
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function MetricCard({ icon: Icon, label, value, trend, trendUp }: {
  icon: React.ElementType;
  label: string;
  value: string;
  trend: string;
  trendUp: boolean;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-start justify-between mb-3">
        <div className="inline-flex p-3 rounded-lg bg-blue-50 text-blue-600">
          <Icon className="size-6" />
        </div>
        <span className={`text-sm ${trendUp ? 'text-green-600' : 'text-red-600'}`}>
          {trend}
        </span>
      </div>
      <p className="text-2xl mb-1">{value}</p>
      <p className="text-sm text-gray-600">{label}</p>
    </div>
  );
}

function DepartmentBar({ department, value, color }: {
  department: string;
  value: number;
  color: string;
}) {
  const colorClasses = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    purple: 'bg-purple-500',
    yellow: 'bg-yellow-500'
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm">{department}</span>
        <span className="text-sm">{value}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className={`h-2 rounded-full ${colorClasses[color as keyof typeof colorClasses]}`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

function WeekdayBar({ day, value }: { day: string; value: number }) {
  const maxValue = 10;
  const percentage = (value / maxValue) * 100;

  return (
    <div className="flex items-center gap-4">
      <span className="text-sm w-24">{day}</span>
      <div className="flex-1 bg-gray-200 rounded-full h-6 relative">
        <div
          className="h-6 rounded-full bg-blue-500 flex items-center justify-end pr-2"
          style={{ width: `${percentage}%` }}
        >
          <span className="text-xs text-white">{value}</span>
        </div>
      </div>
    </div>
  );
}

function TestTypeBar({ test, avgTime }: { test: string; avgTime: string }) {
  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
      <span className="text-sm">{test}</span>
      <span className="text-sm px-3 py-1 bg-blue-100 text-blue-700 rounded">{avgTime}</span>
    </div>
  );
}

function RevenueCard({ label, amount, percentage, color }: {
  label: string;
  amount: string;
  percentage: string;
  color: string;
}) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600'
  };

  return (
    <div className={`rounded-xl p-6 ${colorClasses[color as keyof typeof colorClasses]}`}>
      <p className="text-sm mb-2">{label}</p>
      <p className="text-2xl mb-1">{amount}</p>
      <p className="text-sm">{percentage} of total</p>
    </div>
  );
}
