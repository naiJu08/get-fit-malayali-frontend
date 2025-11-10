// import AssessorSummary from '../pages/assessor/details/summary'
import React, { lazy } from 'react'
import { Route, Routes } from 'react-router-dom'

// import TabularLoader from '../components/common/tabularLoader'
import { router_config } from '../configs/route.config'
import ResetPassword from '../pages/userManagement/resetPasswords'
// import ResetPassword from '../pages/userManagement/resetpassword'
import ChildRoute from './components/childRoute'
// import ChildRoute from './components/childRoute'
import GuestRoute from './components/guestRoute'
import UserRoute from './components/userRoute'
import SubscriptionDetailsMain from '../pages/Subscriptions/Details'
// Users sample page is no longer used for the Users route; using AdminUser instead

const Login = lazy(() => import('../pages/userManagement/login'))
const ForgetPassword = lazy(
  () => import('../pages/userManagement/forgetPassword')
)

const AdminUser = lazy(() => import('../pages/AdminUser'))
const Subscriptions = lazy(() => import('../pages/Subscriptions'))
const Workout = lazy(() => import('../pages/Workout'))
const Plans = lazy(() => import('../pages/Plans'))
const PlanDetails = lazy(() => import('../pages/Plans/Details/index'))
const WorkoutPlanDetails = lazy(
  () => import('../pages/Plans/Details/WorkoutPlan/details')
)
const DietPlanDetails = lazy(
  () => import('../pages/Plans/Details/DietPlan/details')
)
const Recipe = lazy(() => import('../pages/Recipe'))
const Notifications = lazy(() => import('../pages/Notifications'))
const RecipeDetail = lazy(() => import('../pages/Recipe/Detail'))
const UserDetails = lazy(() => import('../pages/AdminUser/Details'))
const WorkoutDetails = lazy(() => import('../pages/Workout/Details'))

// Dashboard

const Dashboard = lazy(() => import('../pages/dashboard/dashboard'))
const Settings = lazy(() => import('../pages/samples/Settings'))
// const Users = lazy(() => import('../pages/samples/Users'))
const Discount = lazy(() => import('../pages/samples/Discount'))
const Payment = lazy(() => import('../pages/samples/Payment'))
const ExportPage = lazy(() => import('../pages/samples/Export'))
const Support = lazy(() => import('../pages/samples/Support'))

const routes: any = [
  { slug: 'DASHBOARD', component: <Dashboard /> },
  { slug: 'SETTINGS_SAMPLE', component: <Settings /> },
  { slug: 'ADMIN_USER', component: <AdminUser /> },
  { slug: 'WORKOUT', component: <Workout /> },
  { slug: 'PLANS', component: <Plans /> },
  { slug: 'PLAN_DETAILS', component: <PlanDetails /> },
  { slug: 'WORKOUT_PLAN_DETAILS', component: <WorkoutPlanDetails /> },
  { slug: 'DIET_DETAILS', component: <DietPlanDetails /> },
  { slug: 'RECIPE', component: <Recipe /> },
  { slug: 'NOTIFICATIONS', component: <Notifications /> },
  { slug: 'RECIPE_DETAILS', component: <RecipeDetail /> },
  { slug: 'SUBSCRIPTIONS', component: <Subscriptions /> },
  { slug: 'SUBSCRIPTIONS_DETAILS', component: <SubscriptionDetailsMain /> },
  { slug: 'DISCOUNT_SAMPLE', component: <Discount /> },
  { slug: 'PAYMENT_SAMPLE', component: <Payment /> },
  { slug: 'EXPORT_SAMPLE', component: <ExportPage /> },
  { slug: 'SUPPORT_SAMPLE', component: <Support /> },
  { slug: 'WORKOUT_DETAILS', component: <WorkoutDetails /> },
  { slug: 'PLAN_DETAILS_WORKOUT', component: <PlanDetails /> },
  { slug: 'PLAN_DETAILS_DIET', component: <PlanDetails /> },

  {
    isAuthRoute: true,
    slug: 'LOGIN',
    component: <Login />,
  },

  {
    isAuthRoute: true,
    slug: 'FORGET_PASSWORD',
    component: <ForgetPassword />,
  },
  {
    isAuthRoute: true,
    slug: 'RESET_PASSWORD',
    component: <ResetPassword />,
  },
  // {
  //   slug: 'USER_PROFILE',
  //   component: <Profile />,
  // },

  { slug: 'ADMIN_USER', component: <AdminUser /> },
  { slug: 'WORKOUT_DETAILS', component: <WorkoutDetails /> },
]

export default function MainRoutes() {
  return (
    <Routes>
      {routes.map((route: any) => (
        <React.Fragment key={route.slug}>
          {route.isAuthRoute ? (
            <Route
              element={<GuestRoute>{route.component}</GuestRoute>}
              path={router_config[route.slug]?.path}
              key={router_config[route.slug]?.path}
            />
          ) : (
            <Route
              element={
                <UserRoute slug_key={route.slug}>{route.component}</UserRoute>
              }
              path={router_config[route.slug]?.path}
              key={router_config[route.slug]?.path}
            >
              {route.children?.length && (
                <>
                  {route.children.map((child: any) => (
                    <Route
                      element={
                        <ChildRoute slug_key={child.slug}>
                          {child.component}
                        </ChildRoute>
                      }
                      path={router_config[child.slug]?.path}
                      key={router_config[child.slug]?.path}
                    />
                  ))}
                </>
              )}
            </Route>
          )}
        </React.Fragment>
      ))}

      <Route
        element={
          <UserRoute slug_key="">
            <Dashboard />
          </UserRoute>
        }
        key="*"
        path="*"
      />

      {/* Explicit routes for sidebar sample pages */}
      <Route
        element={
          <UserRoute slug_key="SETTINGS_SAMPLE">
            <Settings />
          </UserRoute>
        }
        path="/settings"
      />
      <Route
        element={
          <UserRoute slug_key="ADMIN_USER">
            <AdminUser />
          </UserRoute>
        }
        path="/users"
      />
      <Route
        element={
          <UserRoute slug_key="ADMIN_USER">
            <AdminUser />
          </UserRoute>
        }
        path="/nutrionist"
      />
      <Route
        element={
          <UserRoute slug_key="ADMIN_USER">
            <UserDetails />
          </UserRoute>
        }
        path="/users/:id"
      />
      <Route
        element={
          <UserRoute slug_key="ADMIN_USER">
            <UserDetails />
          </UserRoute>
        }
        path="/nutritionist/:id"
      />
      <Route
        element={
          <UserRoute slug_key="ADMIN_USER">
            <UserDetails />
          </UserRoute>
        }
        path="/users/:id/details"
      />
      <Route
        element={
          <UserRoute slug_key="ADMIN_USER">
            <UserDetails />
          </UserRoute>
        }
        path="/nutritionist/:id/details"
      />
      <Route
        element={
          <UserRoute slug_key="ADMIN_USER">
            <UserDetails />
          </UserRoute>
        }
        path="/users/:id/subscriptions"
      />
      <Route
        element={
          <UserRoute slug_key="ADMIN_USER">
            <UserDetails />
          </UserRoute>
        }
        path="/users/:id/body"
      />
      <Route
        element={
          <UserRoute slug_key="ADMIN_USER">
            <UserDetails />
          </UserRoute>
        }
        path="/users/:id/body-composition"
      />
      <Route
        element={
          <UserRoute slug_key="ADMIN_USER">
            <UserDetails />
          </UserRoute>
        }
        path="/users/:id/vitals"
      />
      <Route
        element={
          <UserRoute slug_key="ADMIN_USER">
            <UserDetails />
          </UserRoute>
        }
        path="/users/:id/reports"
      />
      <Route
        element={
          <UserRoute slug_key="ADMIN_USER">
            <UserDetails />
          </UserRoute>
        }
        path="/users/:id/clients"
      />
      <Route
        element={
          <UserRoute slug_key="ADMIN_USER">
            <UserDetails />
          </UserRoute>
        }
        path="/nutritionist/:id/clients"
      />

      <Route
        element={
          <UserRoute slug_key="SUBSCRIPTIONS">
            <Subscriptions />
          </UserRoute>
        }
        path="/subscriptions"
      />
      <Route
        element={
          <UserRoute slug_key="SUBSCRIPTIONS_DETAILS">
            <SubscriptionDetailsMain />
          </UserRoute>
        }
        path="/subscriptions/:id"
      />
      <Route
        element={
          <UserRoute slug_key="DISCOUNT_SAMPLE">
            <Discount />
          </UserRoute>
        }
        path="/discount"
      />
      <Route
        element={
          <UserRoute slug_key="PAYMENT_SAMPLE">
            <Payment />
          </UserRoute>
        }
        path="/payment"
      />
      <Route
        element={
          <UserRoute slug_key="EXPORT_SAMPLE">
            <ExportPage />
          </UserRoute>
        }
        path="/export"
      />
      <Route
        element={
          <UserRoute slug_key="SUPPORT_SAMPLE">
            <Support />
          </UserRoute>
        }
        path="/support"
      />
      <Route
        element={
          <UserRoute slug_key="NOTIFICATIONS">
            <Notifications />
          </UserRoute>
        }
        path="/notifications"
      />
    </Routes>
  )
}
