import UpArrow from './UpArrow'
import Tooltip from '@mui/material/Tooltip'
import React, { JSX } from 'react'

import { IconsProps } from '../../../common/types'
import AccountingIcon from './Accounting'
import AttachmentIcon from './Attachment'
import ActivateIcon from './ActivateIcon'
import ArrowRightIcon from './ArrowRight'
import ActivitiesIcon from './Activities'
import Collectables from './ActivityCollectables'
import AddNotes from './AddNotes'
import AllocatePayment from './Allocate-payments'
import BreadcrumbsArrow from './BreadcrumbsArrow'
import AssignTeam from './AssignTeam'
import BadgeCheckIcon from './BadgeCheck'
import BuildingIcon from './Building'
import BarchartIcon from './Barchart'
import CalendarIcon from './Calendar'
import CancelIcon from './Cancel'
import CardsIcon from './CardsIcon'
import CartIcon from './Cart'
import ChatIcon from './ChatIcon'
import CheckboxCheck from './CheckboxCheck'
import CheckCircleIcon from './CheckCircle'
import CheckMarkIcon from './CheckMark'
import Close from './Close'
import ClosePopupIcon from './ClosePopup'
import CloudUploadIcon from './CloudUpload'
import CustomerIcon from './Customer'
import DangerIcon from './Danger'
import DashboardIcon from './Dashboard'
import DeactivateIcon from './DeactivateIcon'
import DealIcon from './DealIcon'
import DeleteIcon from './Delete'
import DownloadIcon from './Download'
import DropArrow from './DropArrow'
import DropArrowButton from './DropArrowButton'
import DescendingIcon from './Descending'
import DiscountIcon from './Discount'
import EditIcon from './Edit'
import Edit from './EditIcon'
import EditFabIcon from './EditFab'
import EmailIcon from './Email'
import EmptyCheckMarkIcon from './EmptyCheckMark'
import ExclamationCircle from './ExclamationCircle'
import ExclamationDanger from './ExclamationDanger'
import Explorer from './Explorer'
import Expand from './Expand'
import ExportIcon from './Export'
import ExplorerCloseIcon from './ExplorerClose'
import ExternalLink from './ExternalLink'
import EyeIcon from './Eye'
import EyeCloseIcon from './EyeClose'
import Favourite from './Favourite'
import Favourited from './Favourited'
import FavouriteColored from './FavoutiteColored'
import FilterIcon from './Filter'
import ForwardArrow from './ForwardArrow'
import HeaderDropArrow from './HeaderDropDown'
import Home from './Home'
import Invoice from './Invoice'
import LeadsIcon from './leads'
import LinkIcon from './Link'
import LiveFleet from './LiveFleet'
import LocationPinIcon from './LocationPin'
import LockIcon from './Lock'
import LogoutIcon from './Logout'
import MenuFavourite from './MenuFavourite'
import MenuIcon from './menuIcon'
import MenuListIcon from './MenuListIcon'
import MenuSectionIcon from './MenuSection'
import MenuUpArrow from './MenuUpArrow'
import MergeIcon from './Merge'
import MyApprovalsIcon from './MyApprovals'
import MyTaskIcon from './MyTask'
import NextArrow from './NextArrow'
import NextMost from './NextMost'
import Notification from './Notification'
import PaperClip from './Paperclip'
import PaymentIcon from './Payment'
import PaymentApprovalsIcon from './PaymentApprovals'
import PaymentReceipt from './PaymentReceipt'
import PaymnetVerfication from './PaymentVerification'
import PhoneIcon from './Phone'
import PhoneCallingIcon from './PhoneCalling'
import PlusIcon from './Plus'
import PlusLargeIcon from './PlusLarge'
import PlusTabIcon from './PlusTab'
import PreviousArrow from './PreviousArrow'
import PreviousMost from './PreviousMost'
import ProfileIcon from './Profile'
import Prospect from './Prospect'
import QuestionCircleIcon from './QuestionCircle'
import QuoteIcon from './Quote'
import RaiseDeficiencyIcon from './RaiseDeficiency'
import RaiseMissingIcon from './RaiseMissing'
import RaiseRequest from './RaiseRequest'
import ReceiptIcon from './Receipt'
import Refresh from './Refresh'
import ReplyIcon from './ReplyIcon'
import Restore from './Restore'
import RetryIcon from './Retry'
import ReviewRequest from './ReviewRequest'
import SaveIcon from './Save'
import SaveFile from './SaveIcon'
import SalesIcon from './Sales'
import Search from './Search'
import SendIcon from './SendIcon'
import ServicesIcon from './Services'
import SettingsIcon from './Settings'
import SettingsSection from './settingsSection'
import ShareIcon from './Share'
import ShareAltIcon from './ShareAltIcon'
import SidebarArrowIcon from './SidebarArrow'
import SideMenuLogout from './SideMenuLogout'
import SortDesc from './SortDesc'
import SortIcon from './SortIcon'
import QbsSortIcon from './Sort'
import StarIcon from './StarIcon'
import SubMenuListIcon from './SubMenuListIcon'
import SubscriptionIcon from './Subscription'
import SuccessIcon from './Success'
import SupportIcon from './Support'
import TableDelete from './TableDelete'
import TableEdit from './TableEdit'
import TextFieldCancel from './TextFieldCancel'
import TextFieldDone from './TextFieldDone'
import ThreeDotIcon from './ThreeDot'
import ThreeDotHorizontal from './ThreeDotHorizontal'
import TileCartIcon from './TileCart'
import TopbarMenu from './TopbarMenu'
import TreeCollapse from './TreeCollapse'
import TreeExpand from './TreeExpand'
import UnAllocatePayment from './Un-Allocate-payments'
import UnLink from './UnLink'
import UnVerifyIcon from './Unverify'
import UpDownArrow from './UpDownArrow'
import UploadIcon from './Upload'
import UserIcon from './User'
import VerficationPayments from './Verifiy-payments'
import VerifyIcon from './VerifyIcon'
import VerifySmallIcon from './VerifySmalIcon'
import CameraIcon from './Camera'
import AsceningIcon from './Ascending'
import ExportFileIcon from './ExportFile'
import DocumentIcon from './DocumentIcon'
import CubeIcon from './CubeIcon'
import LeftArrowIcon from './LeftArrow'
import HeartRate from './HeartRate'
import BloodPressureIcon from './BloodPressure'
import SugarLevelIcon from './SugarLevelIcon'
import SleepTimeIcon from './SleepTimeIcon'
import WaterIntakeIcon from './WaterIntake'
import ClockIcon from './ClockIcon'
import Calendar from './CalendarIcon'
import ChestIcon from './chest'
import HipIcon from './hip'
import WaterBottleIcon from './waterbottle'
import WaistIcon from './WaistIcon'
import NeckIcon from './NeckIcon'
import ThighIcon from './ThighIcon'
import FatIcon from './FatIcon'
import MuscleMassIcon from './Musclemass'
import ArmIcon from './ArmIcon'
import BoneMassIcon from './BoneMass'
import NoDataIcon from './NoData'
import Plan from './Plan'
import Workout from './Workout'
import Notifications from './Notifications'
import Subscription from './Subscriptions'
import Recipe from './Recipe'
import TitleIcon from './TitleIcon'

const Icons: React.FC<IconsProps> = ({
  name,
  className = '',
  onClick = undefined,
  toolTip,
}) => {
  const getIcons = (): JSX.Element => {
    switch (name) {
      case 'plus':
        return <PlusIcon />
      case 'attachment':
        return <AttachmentIcon />
      case 'arrow-right':
        return <ArrowRightIcon />
      case 'breadcrumbs-arrow':
        return <BreadcrumbsArrow />
      case 'edit':
        return <EditIcon />
      case 'edit-icon':
        return <Edit />
      case 'expand-icon':
        return <Expand />
      case 'textfield-done':
        return <TextFieldDone />
      case 'barchart-icon':
        return <BarchartIcon />
      case 'textfield-cancel':
        return <TextFieldCancel />
      case 'three_dot':
        return <ThreeDotIcon />
      case 'three_dot_horizontal':
        return <ThreeDotHorizontal />
      case 'eye':
        return <EyeIcon />
      case 'eye-close':
        return <EyeCloseIcon />
      case 'home':
        return <Home />
      case 'document-icon':
        return <DocumentIcon />
      case 'favourite':
        return <Favourite />
      case 'livefleet':
        return <LiveFleet />
      case 'explorer':
        return <Explorer />
      case 'export-icon':
        return <ExportIcon />
      case 'forward-arrow':
        return <ForwardArrow />
      case 'menu-list':
        return <MenuListIcon />
      case 'side-menu-list':
        return <SubMenuListIcon />
      case 'menu-section':
        return <MenuSectionIcon />
      case 'menu-up-arrow':
        return <MenuUpArrow />
      case 'danger':
        return <DangerIcon />
      case 'success':
        return <SuccessIcon />
      case 'close-popup':
        return <ClosePopupIcon />
      case 'favourited':
        return <Favourited />
      case 'menu-favourite':
        return <MenuFavourite />
      case 'previous-most':
        return <PreviousMost />
      case 'previous-arrow':
        return <PreviousArrow />
      case 'next-most':
        return <NextMost />
      case 'next-arrow':
        return <NextArrow />
      case 'drop-arrow':
        return <DropArrow />
      case 'descending-icon':
        return <DescendingIcon />
      case 'up-arrow':
        return <UpArrow />
      case 'updown-arrow':
        return <UpDownArrow />
      case 'btn-drop-arrow':
        return <DropArrowButton />
      case 'discount-icon':
        return <DiscountIcon />
      case 'close':
        return <Close />
      case 'camera':
        return <CameraIcon />
      case 'customer-icon':
        return <CustomerIcon />
      case 'close-explorer':
        return <ExplorerCloseIcon />
      case 'cube-icon':
        return <CubeIcon />
      case 'sidemenu-logout':
        return <SideMenuLogout />
      case 'support-icon':
        return <SupportIcon />
      case 'topbar-menu':
        return <TopbarMenu />
      case 'header-drop-arrow':
        return <HeaderDropArrow />
      case 'fab-edit':
        return <EditFabIcon />
      case 'plus-tab':
        return <PlusTabIcon />
      case 'sort-icon':
        return <SortIcon />
      case 'sort-desc':
        return <SortDesc />
      case 'search':
        return <Search />
      case 'sales-icon':
        return <SalesIcon />
      case 'star-icon':
        return <StarIcon />
      case 'external-link':
        return <ExternalLink />
      case 'table-edit':
        return <TableEdit />
      case 'table-delete':
        return <TableDelete />
      case 'sidebar-arrow':
        return <SidebarArrowIcon />
      case 'save-file':
        return <SaveFile />
      case 'subscription-icon':
        return <SubscriptionIcon />
      case 'qbs-sort-icon':
        return <QbsSortIcon />
      case 'ascending-icon':
        return <AsceningIcon />
      case 'export-file-icon':
        return <ExportFileIcon />
      case 'cancel':
        return <CancelIcon />
      case 'save':
        return <SaveIcon />
      case 'menu':
        return <MenuIcon />
      case 'phone-calling':
        return <PhoneCallingIcon />
      case 'location-pin':
        return <LocationPinIcon />
      case 'user':
        return <UserIcon />
      case 'upload':
        return <UploadIcon />
      case 'exclamation-circle':
        return <ExclamationCircle />
      case 'exclamation-danger':
        return <ExclamationDanger />
      case 'dashboard-icon':
        return <DashboardIcon />
      case 'mytasks-icon':
        return <MyTaskIcon />
      case 'myaprrovals-icon':
        return <MyApprovalsIcon />
      case 'paymentapproval-icon':
        return <PaymentApprovalsIcon />
      case 'building-icon':
        return <BuildingIcon />
      case 'receipt-icon':
        return <ReceiptIcon />
      case 'invoice':
        return <Invoice />
      case 'allocate-payment':
        return <AllocatePayment />
      case 'add-notes':
        return <AddNotes />
      case 'un-allocate-payment':
        return <UnAllocatePayment />
      case 'verification-payment':
        return <VerficationPayments />
      case 'payment-icon':
        return <PaymentIcon />
      case 'cart-icon':
        return <CartIcon />
      case 'services-icon':
        return <ServicesIcon />
      case 'settings':
        return <SettingsIcon />
      case 'calendar':
        return <CalendarIcon />
      case 'badge-check':
        return <BadgeCheckIcon />
      case 'phone':
        return <PhoneIcon />
      case 'merge':
        return <MergeIcon />
      case 'check-circle':
        return <CheckCircleIcon />
      case 'leads-icon':
        return <LeadsIcon />
      case 'email':
        return <EmailIcon />
      case 'checkbox-check':
        return <CheckboxCheck />
      case 'share':
        return <ShareIcon />
      case 'share-alt':
        return <ShareAltIcon />
      case 'download':
        return <DownloadIcon />
      case 'retry':
        return <RetryIcon />
      case 'tile-cart':
        return <TileCartIcon />
      case 'favourite-colored':
        return <FavouriteColored />
      case 'link':
        return <LinkIcon />
      case 'lock-icon':
        return <LockIcon />
      case 'delete':
        return <DeleteIcon />
      case 'question-circle':
        return <QuestionCircleIcon />
      case 'cloud-upload':
        return <CloudUploadIcon />
      case 'paper-clip':
        return <PaperClip />
      case 'cards':
        return <CardsIcon />
      case 'send':
        return <SendIcon />
      case 'chat':
        return <ChatIcon />
      case 'reply':
        return <ReplyIcon />
      case 'filter-icon':
        return <FilterIcon />
      case 'deals':
        return <DealIcon />
      case 'prospect':
        return <Prospect />
      case 'quote':
        return <QuoteIcon />
      case 'activities':
        return <ActivitiesIcon />
      case 'settings-secion':
        return <SettingsSection />
      case 'collectable-secion':
        return <Collectables />
      case 'review':
        return <ReviewRequest />
      case 'un-link':
        return <UnLink />
      case 'raise-request':
        return <RaiseRequest />
      case 'assign-team':
        return <AssignTeam />
      case 'payment-receipt':
        return <PaymentReceipt />
      case 'restore':
        return <Restore />
      case 'refresh':
        return <Refresh />
      case 'payment-verify':
        return <PaymnetVerfication />
      case 'check-mark':
        return <CheckMarkIcon />
      case 'empty-check-mark':
        return <EmptyCheckMarkIcon />
      case 'raise-deficiency':
        return <RaiseDeficiencyIcon />
      case 'verify':
        return <VerifyIcon />
      case 'raise-missing':
        return <RaiseMissingIcon />
      case 'tree_colapse':
        return <TreeCollapse />
      case 'tree_expand':
        return <TreeExpand />
      case 'un_verify':
        return <UnVerifyIcon />
      case 'verify_small':
        return <VerifySmallIcon />
      case 'profile_icon':
        return <ProfileIcon />
      case 'logout_icon':
        return <LogoutIcon />
      case 'deactivate-icon':
        return <DeactivateIcon />
      case 'activate-icon':
        return <ActivateIcon />
      case 'plus-lg':
        return <PlusLargeIcon />
      case 'notify-icon':
        return <Notification />
      case 'accounting-icon':
        return <AccountingIcon />
      case 'left-arrow-icon':
        return <LeftArrowIcon />
      case 'heart-rate-icon':
        return <HeartRate />
      case 'blood-pressure-icon':
        return <BloodPressureIcon />
      case 'sugar-level-icon':
        return <SugarLevelIcon />
      case 'sleep-time-icon':
        return <SleepTimeIcon />
      case 'water-intake-icon':
        return <WaterIntakeIcon />
      case 'clock-icon':
        return <ClockIcon />
      case 'calendar-icon':
        return <Calendar />
      case 'chest-icon':
        return <ChestIcon />
      case 'hip-icon':
        return <HipIcon />
      case 'water-bottle-icon':
        return <WaterBottleIcon />
      case 'waist-icon':
        return <WaistIcon />
      case 'neck-icon':
        return <NeckIcon />
      case 'thigh-icon':
        return <ThighIcon />
      case 'fat-icon':
        return <FatIcon />
      case 'muscle-mass-icon':
        return <MuscleMassIcon />
      case 'arm-icon':
        return <ArmIcon />
      case 'bone-icon':
        return <BoneMassIcon />
      case 'no-data-icon':
        return <NoDataIcon />
      case 'plan':
        return <Plan />
      case 'workout':
        return <Workout />
      case 'notification':
        return <Notifications />
      case 'subscription':
        return <Subscription />
      case 'recipe':
        return <Recipe />

      case 'title-icon':
        return <TitleIcon />
      default:
        return <></>
    }
  }
  return (
    <Tooltip title={toolTip}>
      <span
        data-testid={name}
        onClick={onClick}
        className={`${className ?? ' text-center text-white'}`}
      >
        {getIcons()}
      </span>
    </Tooltip>
  )
}

export default Icons
