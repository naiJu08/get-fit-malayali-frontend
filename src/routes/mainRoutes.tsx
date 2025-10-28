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

const Login = lazy(() => import('../pages/userManagement/login'))
const ForgetPassword = lazy(
  () => import('../pages/userManagement/forgetPassword')
)

const AdminUser = lazy(() => import('../pages/AdminUser'))

// Dashboard

const Dashboard = lazy(() => import('../pages/dashboard/dashboard'))

const routes: any = [
  { slug: 'DASHBOARD', component: <Dashboard /> },

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
    </Routes>
  )
}
