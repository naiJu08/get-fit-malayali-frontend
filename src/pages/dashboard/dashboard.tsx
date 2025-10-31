import { useEffect } from 'react'
import { useLayoutStore } from '../../store/layoutStore'
import Icons from '../../components/common/icons'

export default function Dashboard() {
  const { setLayoutType } = useLayoutStore()

  useEffect(() => {
    setLayoutType('sideNav')
  }, [setLayoutType])

  // Enhanced stats data with premium colors
  const statsData = [
    {
      title: 'Total Users',
      value: '2,847',
      change: '+12%',
      trend: 'up',
      gradient: 'from-cyan-500 to-blue-600',
      iconBg: 'bg-gradient-to-br from-cyan-500/20 to-blue-600/20',
      iconColor: 'text-cyan-600',
      iconName: 'user',
    },
    {
      title: 'Revenue',
      value: '$24,500',
      change: '+8%',
      trend: 'up',
      gradient: 'from-emerald-500 to-green-600',
      iconBg: 'bg-gradient-to-br from-emerald-500/20 to-green-600/20',
      iconColor: 'text-emerald-600',
      iconName: 'payment-icon',
    },
    {
      title: 'Orders',
      value: '1,234',
      change: '-3%',
      trend: 'down',
      gradient: 'from-violet-500 to-purple-600',
      iconBg: 'bg-gradient-to-br from-violet-500/20 to-purple-600/20',
      iconColor: 'text-violet-600',
      iconName: 'cart-icon',
    },
    {
      title: 'Activity',
      value: '89%',
      change: '+5%',
      trend: 'up',
      gradient: 'from-amber-500 to-orange-600',
      iconBg: 'bg-gradient-to-br from-amber-500/20 to-orange-600/20',
      iconColor: 'text-amber-600',
      iconName: 'activities',
    },
  ]

  const notifications = [
    {
      id: 1,
      type: 'success',
      title: 'Payment Received',
      message: 'New payment of $299 received from John Doe',
      time: '5 min ago',
      unread: true,
      icon: 'success',
      iconColor: 'text-emerald-600',
      bgColor: 'bg-emerald-50/80',
      borderColor: 'border-emerald-200',
    },
    {
      id: 2,
      type: 'warning',
      title: 'Server Maintenance',
      message: 'Scheduled maintenance in 2 hours',
      time: '30 min ago',
      unread: true,
      icon: 'exclamation-danger',
      iconColor: 'text-amber-600',
      bgColor: 'bg-amber-50/80',
      borderColor: 'border-amber-200',
    },
    {
      id: 3,
      type: 'info',
      title: 'New User Registered',
      message: 'Sarah Johnson just signed up',
      time: '1 hour ago',
      unread: false,
      icon: 'user-add',
      iconColor: 'text-blue-600',
      bgColor: 'bg-blue-50/60',
      borderColor: 'border-blue-200',
    },
    {
      id: 4,
      type: 'info',
      title: 'New Message',
      message: 'You have 3 unread messages',
      time: '2 hours ago',
      unread: false,
      icon: 'message',
      iconColor: 'text-indigo-600',
      bgColor: 'bg-indigo-50/60',
      borderColor: 'border-indigo-200',
    },
  ]

  const recentActivities = [
    {
      id: 1,
      user: 'Alice Johnson',
      action: 'created new project',
      time: '2 min ago',
      avatar: 'AJ',
      color: 'from-cyan-500 to-blue-500',
    },
    {
      id: 2,
      user: 'Bob Smith',
      action: 'updated profile',
      time: '15 min ago',
      avatar: 'BS',
      color: 'from-emerald-500 to-teal-500',
    },
    {
      id: 3,
      user: 'Carol Davis',
      action: 'completed task',
      time: '1 hour ago',
      avatar: 'CD',
      color: 'from-violet-500 to-purple-500',
    },
    {
      id: 4,
      user: 'David Wilson',
      action: 'uploaded files',
      time: '2 hours ago',
      avatar: 'DW',
      color: 'from-amber-500 to-orange-500',
    },
    {
      id: 5,
      user: 'Eva Brown',
      action: 'commented on post',
      time: '3 hours ago',
      avatar: 'EB',
      color: 'from-rose-500 to-pink-500',
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 w-full">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Enhanced Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                Dashboard
              </h1>
              <p className="text-gray-600 mt-2 text-lg">
                Welcome back! Here`s what`s happening today.
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-lg blur opacity-25"></div>
                <button className="relative bg-white px-6 py-2.5 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 font-medium text-gray-700 hover:text-gray-900">
                  <div className="flex items-center space-x-2">
                    <Icons name="download" className="w-4 h-4" />
                    <span>Export Report</span>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Stats Grid with Glass Morphism */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statsData.map((stat, index) => (
            <div key={index} className="relative group">
              {/* Background Glow Effect */}
              <div
                className={`absolute -inset-0.5 bg-gradient-to-r ${stat.gradient} rounded-2xl blur opacity-30 group-hover:opacity-50 transition duration-300`}
              ></div>

              <div className="relative bg-white/80 backdrop-blur-sm rounded-xl border border-white/20 shadow-sm hover:shadow-lg transition-all duration-300 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      {stat.title}
                    </p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      {stat.value}
                    </p>
                    <div
                      className={`flex items-center mt-2 ${
                        stat.trend === 'up'
                          ? 'text-emerald-600'
                          : 'text-rose-600'
                      }`}
                    >
                      <Icons
                        name={
                          stat.trend === 'up' ? 'trending-up' : 'trending-down'
                        }
                        className="w-4 h-4 mr-1"
                      />
                      <span className="text-sm font-medium">{stat.change}</span>
                      <span className="text-sm text-gray-500 ml-1">
                        from last month
                      </span>
                    </div>
                  </div>
                  <div className={`${stat.iconBg} p-3 rounded-xl`}>
                    <Icons
                      name={stat.iconName}
                      className={`w-6 h-6 ${stat.iconColor}`}
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Enhanced Notifications Panel */}
          <div className="lg:col-span-2">
            <div className="relative">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl blur opacity-20"></div>
              <div className="relative bg-white/80 backdrop-blur-sm rounded-xl border border-white/20 shadow-sm p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">
                    Notifications
                  </h2>
                  <div className="flex items-center space-x-2">
                    <Icons
                      name="notify-icon"
                      className="w-5 h-5 text-gray-600"
                    />
                    <span className="bg-gradient-to-r from-rose-500 to-pink-600 text-white text-xs px-2.5 py-1 rounded-full font-medium">
                      {notifications.filter((n) => n.unread).length} new
                    </span>
                  </div>
                </div>

                <div className="space-y-4">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`flex items-start space-x-4 p-4 rounded-xl border transition-all duration-200 hover:scale-[1.02] ${
                        notification.unread
                          ? `${notification.bgColor} ${notification.borderColor} shadow-sm`
                          : 'bg-gray-50/60 border-gray-200'
                      }`}
                    >
                      <div
                        className={`p-2.5 rounded-xl ${notification.bgColor}`}
                      >
                        <Icons
                          name={notification.icon}
                          className={`w-4 h-4 ${notification.iconColor}`}
                        />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold text-gray-900">
                            {notification.title}
                          </h3>
                          {notification.unread && (
                            <span className="bg-gradient-to-r from-blue-500 to-cyan-500 w-2.5 h-2.5 rounded-full animate-pulse"></span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-500 mt-2 flex items-center gap-3">
                          <Icons name="calendar" className="w-3 mr-1 " />
                          <p>{notification.time}</p>
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <button className="w-full mt-6 py-3 text-sm font-medium text-gray-600 hover:text-gray-800 border border-gray-300 rounded-xl hover:border-gray-400 transition-all duration-200 hover:bg-white/50">
                  View All Notifications
                </button>
              </div>
            </div>
          </div>

          {/* Enhanced Recent Activities */}
          <div className="relative">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-2xl blur opacity-20"></div>
            <div className="relative bg-white/80 backdrop-blur-sm rounded-xl border border-white/20 shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  Recent Activities
                </h2>
                <Icons name="activity" className="w-5 h-5 text-gray-600" />
              </div>

              <div className="space-y-4">
                {recentActivities.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-center space-x-3 p-3 rounded-lg hover:bg-white/50 transition-all duration-200 group"
                  >
                    <div
                      className={`w-10 h-10 bg-gradient-to-r ${activity.color} rounded-xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-200`}
                    >
                      <span className="text-white text-xs font-bold">
                        {activity.avatar}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900 truncate">
                        <span className="font-semibold">{activity.user}</span>{' '}
                        {activity.action}
                      </p>
                      <p className="text-xs text-gray-500 mt-1 flex items-center">
                        <Icons name="clock" className="w-3 h-3 mr-1" />
                        {activity.time}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <button className="w-full mt-6 py-3 text-sm font-medium text-gray-600 hover:text-gray-800 border border-gray-300 rounded-xl hover:border-gray-400 transition-all duration-200 hover:bg-white/50">
                View All Activities
              </button>
            </div>
          </div>
        </div>

        {/* Enhanced Quick Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-2xl blur opacity-70 group-hover:opacity-100 transition duration-300"></div>
            <div className="relative bg-gradient-to-r from-blue-600 to-cyan-700 rounded-xl p-6 text-white shadow-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium">
                    Active Sessions
                  </p>
                  <p className="text-3xl font-bold mt-1">143</p>
                  <div className="flex items-center mt-2 text-blue-200">
                    <Icons name="trending-up" className="w-4 h-4 mr-1" />
                    <span className="text-sm">+8% this week</span>
                  </div>
                </div>
                <div className="p-3 bg-white/10 rounded-xl backdrop-blur-sm">
                  <Icons name="activities" className="w-8 h-8 opacity-90" />
                </div>
              </div>
            </div>
          </div>

          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500 to-green-600 rounded-2xl blur opacity-70 group-hover:opacity-100 transition duration-300"></div>
            <div className="relative bg-gradient-to-r from-emerald-600 to-green-700 rounded-xl p-6 text-white shadow-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-emerald-100 text-sm font-medium">
                    Tasks Completed
                  </p>
                  <p className="text-3xl font-bold mt-1">89%</p>
                  <div className="flex items-center mt-2 text-emerald-200">
                    <Icons name="trending-up" className="w-4 h-4 mr-1" />
                    <span className="text-sm">+12% this month</span>
                  </div>
                </div>
                <div className="p-3 bg-white/10 rounded-xl backdrop-blur-sm">
                  <Icons name="check-circle" className="w-8 h-8 opacity-90" />
                </div>
              </div>
            </div>
          </div>

          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-violet-500 to-purple-600 rounded-2xl blur opacity-70 group-hover:opacity-100 transition duration-300"></div>
            <div className="relative bg-gradient-to-r from-violet-600 to-purple-700 rounded-xl p-6 text-white shadow-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-violet-100 text-sm font-medium">
                    Storage Used
                  </p>
                  <p className="text-3xl font-bold mt-1">65%</p>
                  <div className="flex items-center mt-2 text-violet-200">
                    <Icons name="trending-up" className="w-4 h-4 mr-1" />
                    <span className="text-sm">+5% this week</span>
                  </div>
                </div>
                <div className="p-3 bg-white/10 rounded-xl backdrop-blur-sm">
                  <Icons name="barchart-icon" className="w-8 h-8 opacity-90" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
