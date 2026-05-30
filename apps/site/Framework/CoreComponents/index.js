/**
 * BarberZap Admin Panel - Core Components Library
 *
 * Export all 26 core UI components
 */

// Layout Components
export { DashboardContainer, default as DashboardContainer } from './DashboardContainer.jsx';

// Data Display Components
export { Card, CardGrid, ActionCard, MetricCard, default as Card } from './Card.jsx';
export { StatCard, StatCardInline, default as StatCard } from './StatCard.jsx';
export { DataTable, DataTableCompact, default as DataTable } from './DataTable.jsx';
export { CardList, CardListHorizontal, CardListVertical, CardListGrid, CardItem } from './CardList.jsx';
export { Badge, StatusBadge, RoleBadge, CounterBadge, BadgeOutline, BadgeGhost, default as Badge } from './Badge.jsx';
export { Avatar, AvatarGroup, AvatarWithInfo, AvatarSkeleton, default as Avatar } from './Avatar.jsx';

// Form Elements
export { Input, Textarea, InputGroup, SearchInput, default as Input } from './Input.jsx';
export { Select, NativeSelect, default as Select } from './Select.jsx';
export { DatePicker, DateRangePicker, NativeDatePicker, default as DatePicker } from './DatePicker.jsx';
export { PhoneInput, PhoneInputMask, default as PhoneInput } from './PhoneInput.jsx';
export { Toggle, ToggleGroup, ToggleSwitch, Switch, default as Toggle } from './Toggle.jsx';
export { Checkbox, CheckboxGroup, CheckboxCard, Radio, RadioGroup, default as Checkbox } from './Checkbox.jsx';
export { Slider, RangeSlider, default as Slider } from './Slider.jsx';
export { SearchBox, CompactSearch, SearchWithButton, default as SearchBox } from './SearchBox.jsx';

// Navigation & Actions
export {
  Button,
  IconButton,
  ButtonGroup,
  PrimaryButton,
  SecondaryButton,
  OutlineButton,
  GhostButton,
  DangerButton,
  DangerButtonFilled,
  default as Button,
} from './Button.jsx';
export { Tabs, TabPanel, VerticalTabs, default as Tabs } from './Tabs.jsx';
export {
  Breadcrumbs,
  BreadcrumbItem,
  BreadcrumbSeparator,
  CompactBreadcrumbs,
  default as Breadcrumbs,
} from './Breadcrumbs.jsx';
export {
  Dropdown,
  DropdownMenu,
  DropdownItem,
  DropdownDivider,
  DropdownHeader,
  SelectDropdown,
  SplitButton,
  default as Dropdown,
} from './Dropdown.jsx';
export { Pagination, CompactPagination, SimplePagination, default as Pagination } from './Pagination.jsx';

// Feedback & Overlays
export {
  Alert,
  SuccessAlert,
  WarningAlert,
  ErrorAlert,
  InfoAlert,
  InlineAlert,
  AlertGroup,
  default as Alert,
} from './Alert.jsx';
export {
  Toast,
  ToastContainer,
  ToastProvider,
  ToastContext,
  useToast,
  toast,
  default as Toast,
} from './Toast.jsx';
export {
  LoadingSpinner,
  DotsSpinner,
  PulseSpinner,
  BarSpinner,
  InlineSpinner,
  SkeletonLoader,
  PageLoader,
  ButtonLoader,
  default as LoadingSpinner,
} from './LoadingSpinner.jsx';
export {
  EmptyState,
  NoDataEmpty,
  NoResultsEmpty,
  NoConnectionEmpty,
  ErrorEmpty,
  CompactEmpty,
  EmptyList,
  EmptyPage,
  IllustratedEmpty,
  default as EmptyState,
} from './EmptyState.jsx';
export {
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ConfirmDialog,
  DeleteConfirm,
  AlertDialog,
  default as Modal,
} from './Modal.jsx';

// Version info
export const COMPONENTS_VERSION = '1.0.0';
export const TOTAL_COMPONENTS = 26;
