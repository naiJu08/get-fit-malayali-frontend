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
import PaymentHistory from '../pages/PaymentHistory'
import DietTemplateDetails from '../pages/DietTemplate/Details'
import MealTimingMain from '../pages/MealTiming'
import MealTimingDetails from '../pages/MealTiming/Details'
//
// Users sample page is no longer used for the Users route; using AdminUser instead

const Login = lazy(() => import('../pages/userManagement/login'))
const ForgetPassword = lazy(
  () => import('../pages/userManagement/forgetPassword')
)

const AdminUser = lazy(() => import('../pages/AdminUser'))
const InactiveUsers = lazy(() => import('../pages/AdminUser/InactiveUsers'))
const Subscriptions = lazy(() => import('../pages/Subscriptions'))
const Workout = lazy(() => import('../pages/Workout'))
const Plans = lazy(() => import('../pages/Plans'))
const PlanDetails = lazy(() => import('../pages/Plans/Details/index'))
const DietPlanDetails = lazy(
  () => import('../pages/DietTemplate/Details/DietPlanTab/details')
)
// const YogaplanDetails = lazy(
//   () => import('../pages/Plans/Details/YogaPlan/index')
// )
const Recipe = lazy(() => import('../pages/Recipe'))
const Meals = lazy(() => import('../pages/Meals'))
const MealsDetails = lazy(() => import('../pages/Meals/Detail'))
const Notifications = lazy(() => import('../pages/Notifications'))
const BatchHistoryDetail = lazy(
  () => import('../pages/Notifications/HistoryDetail')
)
const RecipeDetail = lazy(() => import('../pages/Recipe/Detail'))
const UserDetails = lazy(() => import('../pages/AdminUser/Details'))
// const SubscriptionHistory = lazy(() => import('../pages/AdminUser/Details/SubscriptionHistory'))
const WorkoutDetails = lazy(() => import('../pages/Workout/Details'))
const CategoriesMain = lazy(() => import('../pages/Categories'))
const CategoriesDetails = lazy(() => import('../pages/Categories/Details'))
// const PlanDetailsContent=lazy(() => import('../pages/Plans/Details/DetailsInfo'))

// Dashboard

const Dashboard = lazy(() => import('../pages/dashboard'))
const Settings = lazy(() => import('../pages/samples/Settings'))
// const Users = lazy(() => import('../pages/samples/Users'))
const Discount = lazy(() => import('../pages/samples/Discount'))
const Payment = lazy(() => import('../pages/samples/Payment'))
const ExportPage = lazy(() => import('../pages/samples/Export'))
const Support = lazy(() => import('../pages/samples/Support'))
const YogaDetails = lazy(() => import('../pages/Yoga/Details'))
const YogaMain = lazy(() => import('../pages/Yoga'))
const MeditationMain = lazy(() => import('../pages/Meditation'))
const MeditationDetails = lazy(() => import('../pages/Meditation/Details'))
const DietTemplateMain = lazy(() => import('../pages/DietTemplate'))
const WorkoutTemplateMain = lazy(() => import('../pages/WorkoutTemplate'))
const WorkoutTemplateDetails = lazy(
  () => import('../pages/WorkoutTemplate/Details')
)
const WorkoutTemplateDayDetails = lazy(
  () => import('../pages/WorkoutTemplate/DayDetails')
)
const YogaTemplateMain = lazy(() => import('../pages/YogaTemplate'))
const YogaTemplateDetails = lazy(() => import('../pages/YogaTemplate/Details'))
const YogaTemplateDayDetails = lazy(
  () => import('../pages/YogaTemplate/DayDetails')
)
const DietTemplateCategories = lazy(
  () => import('../pages/DietTemplateCategories')
)
const AssessmentCategory = lazy(() => import('../pages/AssessmentCategory'))
const MarketingForms = lazy(() => import('../pages/Marketing/Forms'))
const MarketingFormEditor = lazy(() => import('../pages/Marketing/FormEditor'))
const MarketingFormDetails = lazy(
  () => import('../pages/Marketing/FormDetails')
)
const MarketingCampaigns = lazy(() => import('../pages/Marketing/Campaigns'))
const MarketingCampaignDetails = lazy(
  () => import('../pages/Marketing/CampaignDetails')
)
const MarketingLeadDetails = lazy(
  () => import('../pages/Marketing/LeadDetails')
)
const PublicCampaign = lazy(() => import('../pages/Marketing/PublicCampaign'))
const SalesPackages = lazy(() => import('../pages/Sales/Packages'))
const SalesLeads = lazy(() => import('../pages/Sales/Leads'))
const SalesLeadDetails = lazy(() => import('../pages/Sales/LeadDetails'))
const SalesClients = lazy(() => import('../pages/Sales/Clients'))
const SalesClientDetails = lazy(() => import('../pages/Sales/ClientDetails'))
const SalesPayments = lazy(() => import('../pages/Sales/Payments'))
const PublicLeadConfirmation = lazy(
  () => import('../pages/Sales/PublicConfirmation')
)
const PublicClientRegistration = lazy(
  () => import('../pages/Sales/PublicClientRegistration')
)

const AssessmentCategoryDetails = lazy(
  () => import('../pages/AssessmentCategory/Details')
)

const routes: any = [
  { slug: 'DASHBOARD', component: <Dashboard /> },
  { slug: 'SETTINGS_SAMPLE', component: <Settings /> },
  { slug: 'ADMIN_USER', component: <AdminUser /> },
  { slug: 'WORKOUT', component: <Workout /> },
  { slug: 'PLANS', component: <Plans /> },
  { slug: 'PLAN_DETAILS', component: <PlanDetails /> },
  { slug: 'CATEGORIES', component: <CategoriesMain /> },
  { slug: 'CATEGORIES_DETAILS', component: <CategoriesDetails /> },
  { slug: 'DIET_TEMPLATE', component: <DietTemplateMain /> },
  { slug: 'WORKOUT_TEMPLATE', component: <WorkoutTemplateMain /> },
  { slug: 'WORKOUT_TEMPLATE_DETAILS', component: <WorkoutTemplateDetails /> },
  { slug: 'WORKOUT_TEMPLATE_DAY', component: <WorkoutTemplateDayDetails /> },
  { slug: 'YOGA_TEMPLATE', component: <YogaTemplateMain /> },
  { slug: 'YOGA_TEMPLATE_DETAILS', component: <YogaTemplateDetails /> },
  { slug: 'YOGA_TEMPLATE_DAY', component: <YogaTemplateDayDetails /> },
  { slug: 'DIET_TEMPLATE_CATEGORIES', component: <DietTemplateCategories /> },
  { slug: 'DIET_TEMPLATE_DETAILS', component: <DietTemplateDetails /> },
  { slug: 'DIET_TEMPLATE_DIET_PLAN', component: <DietTemplateDetails /> },
  { slug: 'DIET_DETAILS', component: <DietPlanDetails /> },
  { slug: 'MEDITATIONPLAN', component: <PlanDetails /> },
  { slug: 'RECIPE', component: <Recipe /> },
  { slug: 'MEALS', component: <Meals /> },
  { slug: 'MEALS_DETAILS', component: <MealsDetails /> },
  { slug: 'NOTIFICATIONS', component: <Notifications /> },
  { slug: 'RECIPE_DETAILS', component: <RecipeDetail /> },
  { slug: 'SUBSCRIPTIONS', component: <Subscriptions /> },
  { slug: 'SUBSCRIPTIONS_DETAILS', component: <SubscriptionDetailsMain /> },
  { slug: 'DISCOUNT_SAMPLE', component: <Discount /> },
  { slug: 'PAYMENT_SAMPLE', component: <Payment /> },
  { slug: 'EXPORT_SAMPLE', component: <ExportPage /> },
  { slug: 'SUPPORT_SAMPLE', component: <Support /> },
  { slug: 'WORKOUT_DETAILS', component: <WorkoutDetails /> },
  { slug: 'YOGA_DETAILS', component: <YogaDetails /> },
  { slug: 'MEDITATION_DETAILS', component: <MeditationDetails /> },
  { slug: 'PLAN_DETAILS_DIET', component: <PlanDetails /> },
  { slug: 'PAYMENT_HISTORY', component: <PaymentHistory /> },
  { slug: 'REMINDER_SETTINGS', component: <UserDetails /> },
  { slug: 'MEAL_TIMING', component: <MealTimingMain /> },
  { slug: 'MEAL_TIMING_DETAILS', component: <MealTimingDetails /> },
  { slug: 'ASSESSMENT_CATEGORY', component: <AssessmentCategory /> },
  { slug: 'MARKETING_FORMS', component: <MarketingForms /> },
  { slug: 'MARKETING_FORM_EDITOR', component: <MarketingFormEditor /> },
  { slug: 'MARKETING_CAMPAIGNS', component: <MarketingCampaigns /> },
  { slug: 'SALES_PACKAGES', component: <SalesPackages /> },
  { slug: 'SALES_LEADS', component: <SalesLeads /> },
  { slug: 'SALES_CLIENTS', component: <SalesClients /> },
  { slug: 'SALES_PAYMENTS', component: <SalesPayments /> },
  {
    slug: 'MARKETING_CAMPAIGN_DETAILS',
    component: <MarketingCampaignDetails />,
  },
  {
    slug: 'ASSESSMENT_CATEGORY_DETAILS',
    component: <AssessmentCategoryDetails />,
  },

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
  { slug: 'YOGA', component: <YogaMain /> },
  { slug: 'MEDITATION', component: <MeditationMain /> },
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

      <Route
        element={
          <UserRoute slug_key="MARKETING_FORMS">
            <MarketingForms />
          </UserRoute>
        }
        path="/marketing/forms"
      />
      <Route
        element={
          <UserRoute slug_key="MARKETING_FORM_EDITOR">
            <MarketingFormEditor />
          </UserRoute>
        }
        path="/marketing/forms/:id/edit"
      />
      <Route
        element={
          <UserRoute slug_key="MARKETING_FORM_EDITOR">
            <MarketingFormEditor />
          </UserRoute>
        }
        path="/marketing/forms/new"
      />
      <Route
        element={
          <UserRoute slug_key="MARKETING_FORMS">
            <MarketingFormDetails />
          </UserRoute>
        }
        path="/marketing/forms/:id"
      />
      <Route
        element={
          <UserRoute slug_key="MARKETING_CAMPAIGNS">
            <MarketingCampaigns />
          </UserRoute>
        }
        path="/marketing/campaigns"
      />
      <Route
        element={
          <UserRoute slug_key="MARKETING_CAMPAIGN_DETAILS">
            <MarketingCampaignDetails />
          </UserRoute>
        }
        path="/marketing/campaigns/:id"
      />
      <Route
        element={
          <UserRoute slug_key="MARKETING_CAMPAIGN_DETAILS">
            <MarketingCampaignDetails />
          </UserRoute>
        }
        path="/marketing/campaigns/:id/details"
      />
      <Route
        element={
          <UserRoute slug_key="MARKETING_CAMPAIGN_DETAILS">
            <MarketingCampaignDetails />
          </UserRoute>
        }
        path="/marketing/campaigns/:id/leads"
      />
      <Route
        element={
          <UserRoute slug_key="MARKETING_CAMPAIGN_DETAILS">
            <MarketingCampaignDetails />
          </UserRoute>
        }
        path="/users/marketing/:userId/campaigns/:id"
      />
      <Route
        element={
          <UserRoute slug_key="MARKETING_CAMPAIGN_DETAILS">
            <MarketingCampaignDetails />
          </UserRoute>
        }
        path="/users/marketing/:userId/campaigns/:id/details"
      />
      <Route
        element={
          <UserRoute slug_key="MARKETING_CAMPAIGN_DETAILS">
            <MarketingCampaignDetails />
          </UserRoute>
        }
        path="/users/marketing/:userId/campaigns/:id/leads"
      />
      <Route
        element={
          <UserRoute slug_key="MARKETING_CAMPAIGN_DETAILS">
            <MarketingLeadDetails />
          </UserRoute>
        }
        path="/marketing/campaigns/:campaignId/leads/:leadId"
      />
      <Route
        element={
          <UserRoute slug_key="MARKETING_CAMPAIGN_DETAILS">
            <MarketingLeadDetails />
          </UserRoute>
        }
        path="/marketing/campaigns/:campaignId/leads/:leadId/:tab"
      />
      <Route
        element={
          <UserRoute slug_key="MARKETING_CAMPAIGN_DETAILS">
            <MarketingLeadDetails />
          </UserRoute>
        }
        path="/marketing/leads/:leadId"
      />
      <Route
        element={
          <UserRoute slug_key="MARKETING_CAMPAIGN_DETAILS">
            <MarketingLeadDetails />
          </UserRoute>
        }
        path="/marketing/leads/:leadId/:tab"
      />

      <Route element={<PublicCampaign />} path="/public/campaigns/:token" />
      <Route
        element={<PublicLeadConfirmation />}
        path="/public/lead-confirmations/:token"
      />
      <Route
        element={<PublicClientRegistration />}
        path="/public/client-registration/:token"
      />
      <Route
        element={
          <UserRoute slug_key="SALES_PACKAGES">
            <SalesPackages />
          </UserRoute>
        }
        path="/sales/packages"
      />
      <Route
        element={
          <UserRoute slug_key="SALES_LEADS">
            <SalesLeads />
          </UserRoute>
        }
        path="/sales/leads"
      />
      <Route
        element={
          <UserRoute slug_key="SALES_LEADS">
            <SalesLeadDetails />
          </UserRoute>
        }
        path="/sales/leads/:id"
      />
      <Route
        element={
          <UserRoute slug_key="SALES_CLIENTS">
            <SalesClients />
          </UserRoute>
        }
        path="/sales/clients"
      />
      <Route
        element={
          <UserRoute slug_key="SALES_CLIENTS">
            <SalesClientDetails />
          </UserRoute>
        }
        path="/sales/clients/:id"
      />
      <Route
        element={
          <UserRoute slug_key="SALES_PAYMENTS">
            <SalesPayments />
          </UserRoute>
        }
        path="/sales/payments"
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
        path="/users/nutritionist"
      />
      <Route
        element={
          <UserRoute slug_key="ADMIN_USER">
            <AdminUser />
          </UserRoute>
        }
        path="/users/physiotherapist"
      />
      <Route
        element={
          <UserRoute slug_key="ADMIN_USER">
            <AdminUser />
          </UserRoute>
        }
        path="/users/yogist"
      />
      <Route
        element={
          <UserRoute slug_key="ADMIN_USER">
            <AdminUser />
          </UserRoute>
        }
        path="/users/sales"
      />
      <Route
        element={
          <UserRoute slug_key="ADMIN_USER">
            <AdminUser />
          </UserRoute>
        }
        path="/users/marketing"
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
        path="/users/nutritionist/:id"
      />
      <Route
        element={
          <UserRoute slug_key="ADMIN_USER">
            <UserDetails />
          </UserRoute>
        }
        path="/users/physiotherapist/:id"
      />
      <Route
        element={
          <UserRoute slug_key="ADMIN_USER">
            <UserDetails />
          </UserRoute>
        }
        path="/users/yogist/:id"
      />
      <Route
        element={
          <UserRoute slug_key="ADMIN_USER">
            <UserDetails />
          </UserRoute>
        }
        path="/users/sales/:id"
      />
      <Route
        element={
          <UserRoute slug_key="ADMIN_USER">
            <UserDetails />
          </UserRoute>
        }
        path="/users/marketing/:id"
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
        path="/users/nutritionist/:id/details"
      />
      <Route
        element={
          <UserRoute slug_key="ADMIN_USER">
            <UserDetails />
          </UserRoute>
        }
        path="/users/physiotherapist/:id/details"
      />
      <Route
        element={
          <UserRoute slug_key="ADMIN_USER">
            <UserDetails />
          </UserRoute>
        }
        path="/users/yogist/:id/details"
      />
      <Route
        element={
          <UserRoute slug_key="ADMIN_USER">
            <UserDetails />
          </UserRoute>
        }
        path="/users/sales/:id/details"
      />
      <Route
        element={
          <UserRoute slug_key="ADMIN_USER">
            <UserDetails />
          </UserRoute>
        }
        path="/users/marketing/:id/details"
      />
      <Route
        element={
          <UserRoute slug_key="ADMIN_USER">
            <UserDetails />
          </UserRoute>
        }
        path="/users/marketing/:id/forms"
      />
      <Route
        element={
          <UserRoute slug_key="ADMIN_USER">
            <UserDetails />
          </UserRoute>
        }
        path="/users/marketing/:id/campaigns"
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
        path="/users/:id/additional-info"
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
        path="/users/:id/diet-history"
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
        path="/users/nutritionist/:id/diet-history"
      />
      <Route
        element={
          <UserRoute slug_key="ADMIN_USER">
            <UserDetails />
          </UserRoute>
        }
        path="/users/nutritionist/:id/clients"
      />
      <Route
        element={
          <UserRoute slug_key="ADMIN_USER">
            <UserDetails />
          </UserRoute>
        }
        path="/users/physiotherapist/:id/clients"
      />
      <Route
        element={
          <UserRoute slug_key="ADMIN_USER">
            <UserDetails />
          </UserRoute>
        }
        path="/users/yogist/:id/clients"
      />
      <Route
        element={
          <UserRoute slug_key="ADMIN_USER">
            <UserDetails />
          </UserRoute>
        }
        path="/users/sales/:id/clients"
      />
      <Route
        element={
          <UserRoute slug_key="ADMIN_USER">
            <UserDetails />
          </UserRoute>
        }
        path="/users/marketing/:id/clients"
      />
      <Route
        element={
          <UserRoute slug_key="ADMIN_USER">
            <InactiveUsers />
          </UserRoute>
        }
        path="/admin/inactive-users"
      />
      <Route
        element={
          <UserRoute slug_key="ADMIN_USER">
            <UserDetails />
          </UserRoute>
        }
        path="/admin/inactive-users/:id"
      />
      <Route
        element={
          <UserRoute slug_key="ADMIN_USER">
            <UserDetails />
          </UserRoute>
        }
        path="/users/:id/reminders"
      />

      <Route
        element={
          <UserRoute slug_key="ADMIN_USER">
            <UserDetails />
          </UserRoute>
        }
        path="/users/:id/recipes"
      />

      <Route
        element={
          <UserRoute slug_key="ADMIN_USER">
            <UserDetails />
          </UserRoute>
        }
        path="/users/:id/subscription-history"
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
          <UserRoute slug_key="SUBSCRIPTIONS_DETAILS">
            <SubscriptionDetailsMain />
          </UserRoute>
        }
        path="/subscriptions/:id/details"
      />
      <Route
        element={
          <UserRoute slug_key="SUBSCRIPTIONS_DETAILS">
            <SubscriptionDetailsMain />
          </UserRoute>
        }
        path="/subscriptions/:id/subscriptions"
      />
      <Route
        element={
          <UserRoute slug_key="SUBSCRIPTIONS_DETAILS">
            <SubscriptionDetailsMain />
          </UserRoute>
        }
        path="/subscriptions/:id/body"
      />
      <Route
        element={
          <UserRoute slug_key="SUBSCRIPTIONS_DETAILS">
            <SubscriptionDetailsMain />
          </UserRoute>
        }
        path="/subscriptions/:id/body-composition"
      />
      <Route
        element={
          <UserRoute slug_key="SUBSCRIPTIONS_DETAILS">
            <SubscriptionDetailsMain />
          </UserRoute>
        }
        path="/subscriptions/:id/vitals"
      />
      <Route
        element={
          <UserRoute slug_key="SUBSCRIPTIONS_DETAILS">
            <SubscriptionDetailsMain />
          </UserRoute>
        }
        path="/subscriptions/:id/additional-information"
      />
      <Route
        element={
          <UserRoute slug_key="SUBSCRIPTIONS_DETAILS">
            <SubscriptionDetailsMain />
          </UserRoute>
        }
        path="/subscriptions/:id/reminders"
      />

      <Route
        element={
          <UserRoute slug_key="SUBSCRIPTIONS_DETAILS">
            <SubscriptionDetailsMain />
          </UserRoute>
        }
        path="/subscriptions/:id/reports"
      />
      <Route
        element={
          <UserRoute slug_key="SUBSCRIPTIONS_DETAILS">
            <SubscriptionDetailsMain />
          </UserRoute>
        }
        path="/subscriptions/:id/diet-history"
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
      <Route
        element={
          <UserRoute slug_key="NOTIFICATIONS">
            <Notifications />
          </UserRoute>
        }
        path="/notifications/history"
      />
      <Route
        element={
          <UserRoute slug_key="NOTIFICATIONS">
            <BatchHistoryDetail />
          </UserRoute>
        }
        path="/notifications/history/:id"
      />
    </Routes>
  )
}
