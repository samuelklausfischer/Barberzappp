# BarberZap Core Components - Storybook Examples

> **Version:** 1.0.0  
> **Copy & paste ready examples**

---

## Table of Contents

- [Data Display Examples](#data-display-examples)
- [Form Elements Examples](#form-elements-examples)
- [Navigation & Actions Examples](#navigation--actions-examples)
- [Feedback & Overlays Examples](#feedback--overlays-examples)

---

## Data Display Examples

### StatCard

```jsx
import { StatCard, StatCardInline } from './CoreComponents';
import { DollarSign } from 'lucide-react';

// Standard Stat Card
<StatCard
  icon={DollarSign}
  value="$4,521"
  label="Total Revenue"
  trend="up"
  trendValue={12.5}
/>

// Stat Card with down trend
<StatCard
  icon={Users}
  value="128"
  label="New Customers"
  trend="down"
  trendValue={3.2}
/>

// Inline Stat Card
<StatCardInline
  icon={CheckCircle}
  value="24"
  label="Completed Today"
/>
```

### DataTable

```jsx
import { DataTable } from './CoreComponents';

const columns = [
  { key: 'name', label: 'Client', sortable: true },
  { key: 'service', label: 'Service', sortable: true },
  { key: 'barber', label: 'Barber', sortable: true },
  { key: 'time', label: 'Time', sortable: true },
  { key: 'status', label: 'Status' },
];

const data = [
  { id: 1, name: 'John Doe', service: 'Haircut', barber: 'Michael J.', time: '2:00 PM', status: 'confirmed' },
  { id: 2, name: 'Jane Smith', service: 'Beard Trim', barber: 'Thomas S.', time: '3:30 PM', status: 'pending' },
];

<DataTable
  columns={columns}
  data={data}
  onSort={(column, direction) => console.log(column, direction)}
  loading={false}
  pagination={{
    currentPage: 1,
    totalPages: 5,
    totalItems: 48,
    pageSize: 10,
  }}
  onPageChange={(page) => console.log('Page:', page)}
/>
```

### Badge

```jsx
import { Badge, StatusBadge, RoleBadge, CounterBadge } from './CoreComponents';

// Success Badge
<Badge variant="success" showDot>
  Confirmed
</Badge>

// Warning Badge with pulse
<Badge variant="warning" pulsing showDot>
  Pending
</Badge>

// Error Badge
<Badge variant="error" showDot>
  Cancelled
</Badge>

// Gold Badge (solid)
<Badge variant="gold">
  Premium
</Badge>

// Status Badge (pre-configured)
<StatusBadge status="active" />
<StatusBadge status="pending" />
<StatusBadge status="cancelled" />

// Role Badge
<RoleBadge role="admin" />
<RoleBadge role="barber" />

// Counter Badge
<CounterBadge count={3} />
<CounterBadge count={150} />
```

### Avatar

```jsx
import { Avatar, AvatarGroup, AvatarWithInfo } from './CoreComponents';

// With initials
<Avatar name="Michael Johnson" size="lg" />

// With image
<Avatar 
  src="/avatars/michael.jpg" 
  name="Michael" 
  size="xl" 
  showStatus 
  status="online" 
/>

// Avatar Group
<AvatarGroup
  avatars={[
    { name: 'Michael' },
    { name: 'Thomas' },
    { name: 'David' },
  ]}
  max={4}
/>

// Avatar with info
<AvatarWithInfo
  src="/avatars/michael.jpg"
  name="Michael Johnson"
  subtitle="Master Barber"
  status="online"
/>
```

---

## Form Elements Examples

### Input

```jsx
import { Input, Textarea, InputGroup } from './CoreComponents';
import { Mail, Lock, AlertCircle } from 'lucide-react';

// Standard Input
<Input
  label="Email Address"
  type="email"
  placeholder="Enter your email"
  required
/>

// Input with error
<Input
  label="Phone Number"
  state="error"
  errorMessage="Please enter a valid phone number"
  placeholder="(55) 99999-9999"
/>

// Input with icon
<Input
  label="Password"
  type="password"
  leftIcon={<Lock className="w-5 h-5" />}
  placeholder="Enter password"
/>

// Input Group
<InputGroup label="Contact Information" columns={2}>
  <Input label="First Name" placeholder="John" />
  <Input label="Last Name" placeholder="Doe" />
</InputGroup>

// Textarea
<Textarea
  label="Description"
  placeholder="Enter description..."
  rows={4}
  maxLength={500}
  showCharacterCount
/>
```

### Select

```jsx
import { Select } from './CoreComponents';
import { Scissors, User, CircleDot } from 'lucide-react';

const options = [
  { value: 'haircut', label: 'Haircut', icon: <Scissors className="w-4 h-4" /> },
  { value: 'beard', label: 'Beard Trim', icon: <CircleDot className="w-4 h-4" /> },
  { value: 'shave', label: 'Shave' },
];

// Single Select
<Select
  label="Select Service"
  options={options}
  value={selectedValue}
  onChange={setSelectedValue}
  searchable
/>

// Multi Select
<Select
  label="Select Services"
  options={options}
  multiple
  value={selectedValues}
  onChange={setSelectedValues}
/>
```

### DatePicker

```jsx
import { DatePicker, DateRangePicker } from './CoreComponents';

// Single Date Picker
<DatePicker
  label="Appointment Date"
  value={selectedDate}
  onChange={setSelectedDate}
  minDate={new Date()}
/>

// Date Range Picker
<DateRangePicker
  label="Select Date Range"
  value={dateRange}
  onChange={setDateRange}
/>
```

### PhoneInput

```jsx
import { PhoneInput } from './CoreComponents';

// Brazilian Phone
<PhoneInput
  label="Phone Number"
  value={phone}
  onChange={setPhone}
  type="mobile"
  includeCountryCode
/>

// Landline
<PhoneInput
  label="Landline"
  value={landline}
  onChange={setLandline}
  type="landline"
/>
```

### Toggle

```jsx
import { Toggle, ToggleGroup } from './CoreComponents';

// Basic Toggle
<Toggle
  label="Enable notifications"
  checked={enabled}
  onChange={setEnabled}
/>

// Toggle with description
<Toggle
  label="Online Booking"
  description="Allow customers to book online"
  checked={onlineBooking}
  onChange={setOnlineBooking}
/>

// Danger Toggle
<Toggle
  label="Delete Account"
  variant="danger"
  checked={deleteAccount}
  onChange={setDeleteAccount}
/>

// Toggle Group
<ToggleGroup label="Notification Preferences">
  <Toggle label="Email" checked={emailEnabled} onChange={setEmailEnabled} />
  <Toggle label="SMS" checked={smsEnabled} onChange={setSmsEnabled} />
  <Toggle label="Push" checked={pushEnabled} onChange={setPushEnabled} />
</ToggleGroup>
```

### Checkbox / Radio

```jsx
import { Checkbox, Radio, CheckboxGroup, RadioGroup } from './CoreComponents';

// Checkbox
<Checkbox
  label="Remember me"
  checked={remember}
  onChange={setRemember}
/>

// Checkbox with description
<Checkbox
  label="I agree to terms"
  description="By checking this, you accept our terms"
  checked={agreed}
  onChange={setAgreed}
/>

// Checkbox Group
<CheckboxGroup
  label="Available Services"
  options={[
    { value: 'haircut', label: 'Haircut' },
    { value: 'beard', label: 'Beard Trim' },
    { value: 'shave', label: 'Shave' },
  ]}
  value={selectedServices}
  onChange={setSelectedServices}
/>

// Radio Group
<RadioGroup
  label="Appointment Type"
  options={[
    { value: 'walkin', label: 'Walk-in' },
    { value: 'scheduled', label: 'Scheduled' },
  ]}
  value={appointmentType}
  onChange={setAppointmentType}
/>
```

### SearchBox

```jsx
import { SearchBox } from './CoreComponents';

// Full Search Box
<SearchBox
  placeholder="Search appointments..."
  value={searchQuery}
  onChange={setSearchQuery}
  onSearch={handleSearch}
  showHistory={true}
  history={['John Doe', 'Haircut', 'Today']}
  showFilters={true}
  filters={
    <div className="p-4">
      <p>Filter by status...</p>
    </div>
  }
/>

// Compact Search
<CompactSearch
  placeholder="Quick search..."
  value={quickSearch}
  onChange={setQuickSearch}
/>
```

---

## Navigation & Actions Examples

### Button

```jsx
import { Button, IconButton, ButtonGroup } from './CoreComponents';
import { Plus, Trash2, Edit, Filter, Download } from 'lucide-react';

// Primary Button
<Button variant="primary">
  Create Appointment
</Button>

// Secondary Button
<Button variant="secondary">
  Cancel
</Button>

// Outline Button
<Button variant="outline">
  Edit Details
</Button>

// Ghost Button
<Button variant="ghost">
  Close
</Button>

// Danger Button
<Button variant="danger">
  Delete
</Button>

// Button with Icon
<Button variant="primary" leftIcon={<Plus className="w-5 h-5" />}>
  New Barber
</Button>

// Loading Button
<Button variant="primary" loading>
  Saving...
</Button>

// Icon Button
<IconButton icon={<Edit className="w-5 h-5" />} tooltip="Edit" />

// Button Group
<ButtonGroup>
  <Button>Day</Button>
  <Button>Week</Button>
  <Button>Month</Button>
</ButtonGroup>
```

### Tabs

```jsx
import { Tabs, TabPanel } from './CoreComponents';
import { List, Calendar, LayoutGrid } from 'lucide-react';

const tabs = [
  { id: 'list', label: 'List View', icon: <List className="w-4 h-4" /> },
  { id: 'calendar', label: 'Calendar', icon: <Calendar className="w-4 h-4" /> },
  { id: 'grid', label: 'Grid', icon: <LayoutGrid className="w-4 h-4" /> },
];

<Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab}>
  <TabPanel activeTab={activeTab} tabId="list">
    <p>List view content</p>
  </TabPanel>
  <TabPanel activeTab={activeTab} tabId="calendar">
    <p>Calendar view content</p>
  </TabPanel>
  <TabPanel activeTab={activeTab} tabId="grid">
    <p>Grid view content</p>
  </TabPanel>
</Tabs>
```

### Breadcrumbs

```jsx
import { Breadcrumbs } from './CoreComponents';

<Breadcrumbs
  items={[
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Appointments', href: '/appointments' },
    { label: 'Today\'s Schedule' },
  ]}
  onItemClick={(item) => console.log('Navigate:', item)}
/>
```

### Dropdown

```jsx
import { Dropdown, DropdownItem, DropdownDivider } from './CoreComponents';
import { MoreVertical, Eye, Edit, Trash2, Download } from 'lucide-react';

// Using items array
<Dropdown
  trigger={
    <Button variant="ghost">
      Actions
    </Button>
  }
  items={[
    { label: 'View Details', icon: Eye, onClick: () => console.log('View') },
    { label: 'Edit', icon: Edit, onClick: () => console.log('Edit') },
    { divider: true },
    { label: 'Delete', icon: Trash2, danger: true, onClick: () => console.log('Delete') },
  ]}
/>

// Using Dropdown components
<Dropdown
  trigger={
    <button className="p-2 hover:bg-slate-700/50 rounded">
      <MoreVertical className="w-5 h-5" />
    </button>
  }
  position="bottom-right"
>
  <DropdownItem icon={<Eye className="w-4 h-4" />} onClick={handleView}>
    View Details
  </DropdownItem>
  <DropdownItem icon={<Edit className="w-4 h-4" />} onClick={handleEdit}>
    Edit
  </DropdownItem>
  <DropdownDivider />
  <DropdownItem icon={<Download className="w-4 h-4" />} onClick={handleDownload}>
    Export
  </DropdownItem>
  <DropdownItem icon={<Trash2 className="w-4 h-4" />} danger onClick={handleDelete}>
    Delete
  </DropdownItem>
</Dropdown>
```

### Pagination

```jsx
import { Pagination } from './CoreComponents';

<Pagination
  currentPage={currentPage}
  totalPages={12}
  totalItems={123}
  pageSize={10}
  onPageChange={setPage}
  showFirstLast
  showInfo
/>
```

---

## Feedback & Overlays Examples

### Alert

```jsx
import { Alert, SuccessAlert, ErrorAlert, WarningAlert, AlertGroup } from './CoreComponents';

// Success Alert
<SuccessAlert
  title="Appointment Confirmed"
  dismissible
  onDismiss={() => console.log('Dismissed')}
>
  The appointment has been successfully scheduled.
</SuccessAlert>

// Error Alert
<ErrorAlert
  title="Something went wrong"
  errorMessage="Unable to save changes. Please try again."
  dismissible
/>

// Warning Alert
<WarningAlert
  title="Payment Required"
>
  Please complete payment before your appointment date.
</WarningAlert>

// Alert Group
<AlertGroup
  alerts={[
    { variant: 'success', title: 'Changes saved', dismissible: true },
    { variant: 'warning', title: 'Unsaved changes', message: 'You have unsaved changes' },
  ]}
  onDismiss={(index) => console.log('Dismiss:', index)}
/>
```

### Toast

```jsx
import { Toast, useToast, ToastProvider } from './CoreComponents';

// Using ToastProvider (recommended)
function App() {
  const toast = useToast();
  
  return (
    <ToastProvider>
      <button onClick={() => toast.success('Changes saved!')}>
        Show Success Toast
      </button>
      <button onClick={() => toast.error('Something went wrong')}>
        Show Error Toast
      </button>
    </ToastProvider>
  );
}

// Standalone Toast
<Toast
  variant="success"
  show={show}
  onClose={() => setShow(false)}
  title="Success!"
  message="Your changes have been saved."
  duration={3000}
/>
```

### LoadingSpinner

```jsx
import { LoadingSpinner, InlineSpinner, SkeletonLoader } from './CoreComponents';

// Inline Spinner
<LoadingSpinner size="sm" />

// With Text
<LoadingSpinner text="Loading data..." />

// Full Screen Loader
<LoadingSpinner fullScreen text="Please wait..." />

// Button Loading
<Button variant="primary" loading>
  <InlineSpinner />
  Processing...
</Button>

// Skeleton Loading
<SkeletonLoader lines={4} width="100%" />
```

### EmptyState

```jsx
import { EmptyState, NoDataEmpty, NoResultsEmpty } from './CoreComponents';
import { Plus, SearchX } from './CoreComponents';

// No Data
<NoDataEmpty
  title="No appointments yet"
  description="Start by creating your first appointment."
  actionText="Create Appointment"
  onAction={() => console.log('Create')}
/>

// No Results
<NoResultsEmpty
  actionText="Clear Filters"
  onAction={() => console.log('Clear')}
/>

// Custom
<EmptyState
  icon={<Plus className="w-8 h-8" />}
  title="Create your first barber"
  description="Add barbers to start managing your shop."
  actionText="Add Barber"
  onAction={handleAddBarber}
/>
```

### Modal

```jsx
import {
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ConfirmDialog,
  DeleteConfirm
} from './CoreComponents';
import { Button } from './CoreComponents';

// Standard Modal
<Modal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="New Appointment"
  size="lg"
>
  <ModalBody>
    <Input label="Client Name" />
    <Select label="Service" options={services} />
  </ModalBody>
  <ModalFooter>
    <Button variant="ghost" onClick={() => setIsOpen(false)}>
      Cancel
    </Button>
    <Button variant="primary" onClick={handleSave}>
      Create Appointment
    </Button>
  </ModalFooter>
</Modal>

// Delete Confirmation
<DeleteConfirm
  isOpen={showDelete}
  onClose={() => setShowDelete(false)}
  onConfirm={handleDelete}
  loading={deleting}
/>

// Custom Confirmation
<ConfirmDialog
  isOpen={showConfirm}
  onClose={() => setShowConfirm(false)}
  onConfirm={handleConfirm}
  title="Are you sure?"
  description="This action cannot be undone."
  variant="warning"
  confirmText="Yes, proceed"
  cancelText="Cancel"
/>
```

---

## Complete Page Example

```jsx
import React, { useState } from 'react';
import {
  StatCard,
  DataTable,
  Button,
  Input,
  Select,
  Badge,
  Avatar,
  Modal,
  Pagination,
  Alert,
} from './CoreComponents';
import {
  DollarSign,
  Users,
  Calendar,
  TrendingUp,
  Plus,
  Search,
  Filter,
} from 'lucide-react';

function DashboardPage() {
  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const stats = [
    {
      icon: DollarSign,
      value: '$12,450',
      label: 'Total Revenue',
      trend: 'up',
      trendValue: 15.2,
    },
    {
      icon: Users,
      value: '48',
      label: 'New Customers',
      trend: 'up',
      trendValue: 8.5,
    },
    {
      icon: Calendar,
      value: '24',
      label: 'Appointments Today',
      trend: 'down',
      trendValue: 3.2,
    },
    {
      icon: TrendingUp,
      value: '92%',
      label: 'Completion Rate',
      trend: 'up',
      trendValue: 2.1,
    },
  ];

  return (
    <div className="min-h-screen bg-slate-900 p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-gray-400">Welcome back! Here's your overview.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => (
          <StatCard key={index} {...stat} />
        ))}
      </div>

      {/* Alerts */}
      <div className="mb-6">
        <Alert
          variant="warning"
          title="Upcoming maintenance"
          dismissible
        >
          The system will be under maintenance tonight from 2 AM to 4 AM.
        </Alert>
      </div>

      {/* Table Section */}
      <div className="bg-slate-800/50 rounded-xl border border-slate-700/50">
        {/* Table Header */}
        <div className="px-6 py-4 border-b border-slate-700/50 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Recent Appointments</h2>
          <div className="flex gap-3">
            <Input
              placeholder="Search..."
              value={searchQuery}
              onChange={setSearchQuery}
              leftIcon={<Search className="w-5 h-5" />}
              className="w-64"
            />
            <Button variant="outline" leftIcon={<Filter className="w-5 h-5" />}>
              Filter
            </Button>
            <Button variant="primary" leftIcon={<Plus className="w-5 h-5" />} onClick={() => setShowModal(true)}>
              New Appointment
            </Button>
          </div>
        </div>

        {/* Table */}
        <DataTable
          columns={tableColumns}
          data={appointments}
          loading={loading}
          pagination={{
            currentPage,
            totalPages: 5,
            totalItems: 48,
            pageSize: 10,
          }}
          onPageChange={setCurrentPage}
        />
      </div>

      {/* Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Create Appointment"
        size="lg"
      >
        <div className="space-y-4">
          <Input label="Client Name" placeholder="Enter client name" />
          <Select label="Service" options={serviceOptions} />
          <DatePicker label="Date" />
          <Input label="Time" type="time" />
        </div>
        <Modal.Footer>
          <Button variant="ghost" onClick={() => setShowModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleCreate}>
            Create Appointment
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

export default DashboardPage;
```

---

**End of Storybook Examples**
