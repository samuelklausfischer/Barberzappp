# BarberZap CRM & Client Management

Complete Customer Relationship Management feature for the BarberZap Admin Panel.

## 📋 Overview

The CRM feature provides barbershop managers with a comprehensive tool to:
- Manage client base with full profiles
- Track appointment history and spending
- Search and filter clients
- Add/Edit/Delete clients with validation
- Export client data to CSV
- Send WhatsApp messages directly to clients

## 📁 Structure

### Working Implementation (Barberzap-Dev)
```
Barberzap-Dev/src/
├── logic/
│   ├── clientLogic.js       # Business logic, validation, utilities
│   └── index.js             # Logic exports
├── components/crm/
│   ├── ClientCard.jsx       # Client card component
│   ├── ClientCardCompact.jsx # Compact client card
│   ├── ClientDetailModal.jsx # Client detail modal
│   ├── ClientHistoryTable.jsx # History table
│   ├── ClientForm.jsx       # Add/Edit form
│   └── index.js             # Component exports
└── pages/
    └── DashboardPages.jsx   # Clientes page (full CRM implementation)
```

### Reference Implementation (Framework)
```
Barberzap SITE/Framework/
├── Logic/
│   └── clientLogic.js       # Business logic reference
├── Components/CRM/
│   ├── ClientCard.jsx       # Component references
│   ├── ClientDetailModal.jsx
│   ├── ClientHistoryTable.jsx
│   ├── ClientForm.jsx
│   └── index.js
└── Pages/
    └── ClientesPage.jsx     # Standalone page reference
```

## 🎯 Features

### 1. Client List View
- **Search** by name, email, or phone
- **Filter** by status (Active, Inactive, Pending, Archived)
- **Grid/List view** toggle
- **Statistics dashboard** showing:
  - Total clients
  - Active clients
  - Inactive clients
  - Pending registrations

### 2. Client Detail View
- **Profile information:**
  - Avatar with initials
  - Name, email, phone
  - Birthdate
  - Full address
  - Notes and observations
  
- **Metrics:**
  - Total appointments
  - Total spent (BRL)
  - Average visit value
  - Last visit date
  
- **Tabs:**
  - Profile tab
  - History tab (appointment list)
  - Notes tab

### 3. Client History
- **Appointment history table** with:
  - Date
  - Service
  - Barber
  - Price
  - Status
  - Notes
  
- **Summary stats:**
  - Total appointments
  - Completed appointments
  - Total spent

### 4. Add/Edit Client Form
- **Fields:**
  - Name (required)
  - Email
  - Phone (required, Brazilian format)
  - Birthdate
  - Address (street, number, neighborhood, city, state, CEP)
  - Notes
  - Status

- **Validation:**
  - Required fields
  - Email format
  - Phone format
  - CEP format
  - Duplicate check (email/phone)

### 5. Bulk Actions
- **Select multiple clients**
- **Export to CSV**
- **Send WhatsApp messages**

### 6. Client Actions
- Edit client
- Delete client (with confirmation)
- Archive client (soft delete)
- Send WhatsApp message
- Favorite (toggle)

## 🧠 Business Logic

### Client Status
- **Active**: Has appointment in last 3 months
- **Inactive**: No appointments in 3+ months
- **Pending**: New signup, no appointments yet
- **Archived**: Manually archived (not deleted)

### Validation Rules
- Name: Required, min 3 characters
- Email: Valid format, unique across clients
- Phone: Required, Brazilian format +55 XX XXXXX-XXXX, unique across clients
- CEP: Format 00000-000 (when provided)

### Duplicate Detection
- Email must be unique
- Phone must be unique

### Data Structure

```javascript
{
  id: "uuid",
  name: "String",
  email: "String",
  phone: "String (BR format: +55 XX XXXXX-XXXX)",
  birthdate: "Date (ISO string)",
  address: {
    street: "String",
    number: "String",
    neighborhood: "String",
    city: "String",
    state: "String",
    cep: "String"
  },
  notes: "String",
  status: "active|inactive|pending|archived",
  totalAppointments: Number,
  totalSpent: Number,
  averageVisitValue: Number,
  lastVisit: "Date (ISO string)",
  createdAt: "Date (ISO string)"
}
```

## 🔧 Utilities

### clientLogic Functions

```javascript
// Get initials from name
getInitials('João Silva') // 'JS'

// Format phone to Brazilian format
formatPhone('5511987654321') // '+55 11 98765-4321'

// Format currency to BRL
formatCurrency(80.00) // 'R$ 80,00'

// Format date to Brazilian format
formatDate('2024-02-25') // '25/02/2024'

// Format relative time
formatRelativeTime(new Date() - 2 * day) // 'Ontem'

// Calculate client status
calculateClientStatus(client) // 'active'|'inactive'|'archived'
```

### Status Colors & Labels

```javascript
STATUS_COLORS = {
  active: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  inactive: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  pending: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  archived: 'bg-gray-500/15 text-gray-400 border-gray-500/30'
}

STATUS_LABELS = {
  active: 'Ativo',
  inactive: 'Inativo',
  pending: 'Pendente',
  archived: 'Arquivado'
}
```

## 🎨 Components Used

From Core Components:
- **StatCard** - Display metrics in the dashboard
- **DataTable** - Table component for client list and history
- **CardList** - List/card layout for clients

From Design System:
- **Button** (Primary, Secondary, Ghost)
- **Input** (Text, Email, Tel, Date, Select)
- **Badge** - Status indicators
- **Modal** - Detail modal and form modal
- **Toggle** - View mode toggle
- **Avatar** - Profile pictures with initials

## 📱 Mobile Responsiveness

- Single-thumb accessible design
- Responsive grid (1 column mobile, 2 tablet, 3 desktop)
- Touch-friendly buttons (min 44x44px)
- Scrollable tables and lists
- Bottom sheet style modals on mobile

## 🚀 Usage

### Access the CRM Page

Navigate to: `/dashboard/clientes`

### In Your Components

```javascript
import { clientService, getInitials, formatCurrency } from '../logic/clientLogic';
import { ClientCard, ClientDetailModal, ClientForm } from '../components/crm';

// Get all clients
const clients = await clientService.getClients();

// Create new client
const newClient = await clientService.createClient({
  name: 'João Silva',
  phone: '+55 11 98765-4321',
  email: 'joao@email.com',
  // ...
});

// Export to CSV
const csv = await clientService.exportToCSV([client.id, client.id2]);
```

## 🔐 Security & Validation

- All inputs are validated client-side
- Duplicate detection prevents data conflicts
- Soft delete (archive) preserves data integrity
- Form validation prevents invalid submissions
- Confirmation dialogs for destructive actions

## 📦 Dependencies

- `uuid` - Generate unique IDs for clients
- `lucide-react` - Icons

## 🎯 Roadmap

Potential future enhancements:
- Integration with backend API
- Client photos (upload to S3)
- Appointment scheduling from client view
- Client loyalty program
- SMS notifications
- Advanced analytics & reports
- Client segmentation
- Automated follow-up reminders

## 📄 License

Part of BarberZap Admin Panel
