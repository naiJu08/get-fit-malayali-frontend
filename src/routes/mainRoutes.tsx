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
// Users sample page is no longer used for the Users route; using AdminUser instead

const Login = lazy(() => import('../pages/userManagement/login'))
const ForgetPassword = lazy(
  () => import('../pages/userManagement/forgetPassword')
)

const AdminUser = lazy(() => import('../pages/AdminUser'))

// Dashboard

const Dashboard = lazy(() => import('../pages/dashboard/dashboard'))
const Settings = lazy(() => import('../pages/samples/Settings'))
// const Users = lazy(() => import('../pages/samples/Users'))
const Subscription = lazy(() => import('../pages/samples/Subscription'))
const Discount = lazy(() => import('../pages/samples/Discount'))
const Payment = lazy(() => import('../pages/samples/Payment'))
const ExportPage = lazy(() => import('../pages/samples/Export'))
const Support = lazy(() => import('../pages/samples/Support'))

const routes: any = [
  { slug: 'DASHBOARD', component: <Dashboard /> },
  { slug: 'SETTINGS_SAMPLE', component: <Settings /> },
  { slug: 'ADMIN_USER', component: <AdminUser /> },
  { slug: 'SUBSCRIPTION_SAMPLE', component: <Subscription /> },
  { slug: 'DISCOUNT_SAMPLE', component: <Discount /> },
  { slug: 'PAYMENT_SAMPLE', component: <Payment /> },
  { slug: 'EXPORT_SAMPLE', component: <ExportPage /> },
  { slug: 'SUPPORT_SAMPLE', component: <Support /> },

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
          <UserRoute slug_key="SUBSCRIPTION_SAMPLE">
            <Subscription />
          </UserRoute>
        }
        path="/subscription"
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
    </Routes>
  )
}
