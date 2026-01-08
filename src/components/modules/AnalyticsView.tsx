import { BarChart3, TrendingUp, Users, Activity } from 'lucide-react';

export function AnalyticsView() {
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
          value="3"
          trend="+12%"
          trendUp={true}
        />
        <MetricCard
          icon={Activity}
          label="Appointments This Month"
          value="25"
          trend="+8%"
          trendUp={true}
        />
        <MetricCard
          icon={BarChart3}
          label="Lab Tests Completed"
          value="45"
          trend="+15%"
          trendUp={true}
        />
        <MetricCard
          icon={TrendingUp}
          label="Patient Satisfaction"
          value="94%"
          trend="+2%"
          trendUp={true}
        />
      </div>

      {/* Department Performance */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h4 className="text-lg mb-6">Department Performance</h4>
        <div className="space-y-4">
          <DepartmentBar department="General Medicine" value={85} color="blue" />
          <DepartmentBar department="Laboratory" value={92} color="green" />
          <DepartmentBar department="Pharmacy" value={88} color="purple" />
          <DepartmentBar department="Nursing" value={90} color="yellow" />
        </div>
      </div>

      {/* Weekly Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h4 className="text-lg mb-4">Weekly Appointments</h4>
          <div className="space-y-3">
            <WeekdayBar day="Monday" value={5} />
            <WeekdayBar day="Tuesday" value={8} />
            <WeekdayBar day="Wednesday" value={6} />
            <WeekdayBar day="Thursday" value={7} />
            <WeekdayBar day="Friday" value={4} />
            <WeekdayBar day="Saturday" value={3} />
            <WeekdayBar day="Sunday" value={2} />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h4 className="text-lg mb-4">Lab Test Turnaround Time</h4>
          <div className="space-y-4">
            <TestTypeBar test="Complete Blood Count" avgTime="35 min" />
            <TestTypeBar test="HbA1c" avgTime="48 min" />
            <TestTypeBar test="Lipid Panel" avgTime="42 min" />
            <TestTypeBar test="Urinalysis" avgTime="28 min" />
          </div>
        </div>
      </div>

      {/* Revenue Overview */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h4 className="text-lg mb-6">Monthly Revenue Overview</h4>
        <div className="grid grid-cols-3 gap-6">
          <RevenueCard
            label="Consultations"
            amount="$12,500"
            percentage="45%"
            color="blue"
          />
          <RevenueCard
            label="Lab Tests"
            amount="$8,300"
            percentage="30%"
            color="green"
          />
          <RevenueCard
            label="Pharmacy"
            amount="$6,900"
            percentage="25%"
            color="purple"
          />
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
