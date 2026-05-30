# WhatsApp Integration - Component Structure

## File Organization

```
Barberzap SITE/
├── Framework/
│   ├── CoreComponents/
│   │   ├── Alert.jsx              ✅ Used
│   │   ├── Badge.jsx              ✅ Used
│   │   ├── Button.jsx             ✅ Used
│   │   ├── DataTable.jsx          ✅ Used
│   │   ├── Input.jsx              ✅ Used
│   │   ├── Modal.jsx              ✅ Used
│   │   ├── StatCard.jsx           ✅ Used
│   │   ├── Toggle.jsx             ✅ Used
│   │   └── index.js               ✅ Exports
│   ├── Logic/
│   │   ├── autoReply.js           ✅ NEW
│   │   ├── evolutionAPI.js        ✅ NEW
│   │   ├── WHATSAPP_README.md     ✅ NEW
│   │   └── index.js               ✅ NEW (exports)
│   └── Pages/
│       ├── WhatsAppPage.jsx       ✅ NEW
│       └── index.js               ✅ NEW (exports)
└── Barberzap-Dev/
    └── src/
        └── pages/
            └── DashboardPages.jsx  ✅ MODIFIED
```

## Component Hierarchy

```
WhatsAppPage (Main Page)
├── ConnectionStatusPanel
│   ├── StatusIndicator (Badge)
│   ├── InstanceInfo
│   ├── ConnectionStateInfo
│   ├── QRCodeDisplay
│   └── ActionButtons
│       ├── RefreshButton
│       ├── ConnectButton
│       └── DisconnectButton
├── Section: StatCards
│   ├── StatCard (Messages received)
│   ├── StatCard (Active rules)
│   └── StatCard (Active instance)
├── Section: Test Message
│   ├── PhoneInput
│   ├── MessageTextarea
│   ├── SendButton
│   └── ResultAlert
├── Section: Webhook Logs
│   ├── DataTable (logs)
│   └── SimulateButton
└── Section: Auto-Reply Rules
    ├── AddRuleButton
    └── DataTable (rules)
        └── Row Actions
            ├── Toggle (enable/disable)
            ├── EditButton
            └── DeleteButton

Modals
├── APIConfigModal
│   ├── APIBaseUrlInput
│   ├── APIKeyInput
│   ├── InstanceNameInput
│   ├── WebhookURLDisplay (readonly)
│   └── CopyURLButton
└── RuleModal
    ├── RuleNameInput
    ├── KeywordsInput
    ├── ReplyTemplateTextarea
    ├── EnabledToggle
    ├── UseAIToggle
    └── ActionButtons
```

## Data Flow

```
User Interaction
       ↓
Component State
       ↓
Service Call (evolutionAPI / autoReplyService)
       ↓
localStorage / Evolution API
       ↓
Response
       ↓
Update State
       ↓
Re-render Component
```

## State Management

### WhatsAppPage State

```javascript
// Configuration
{
  config: { apiBaseUrl, apiKey, instanceName, webhookUrl },
  showConfig: boolean
}

// Connection
{
  connectionStatus: { connected, state, instance, lastChecked },
  isLoadingConnection: boolean,
  qrCode: string | null,
  pollingInterval: number | null
}

// Test Message
{
  testPhone: string,
  testMessage: string,
  isSendingMessage: boolean,
  sendResult: { type, message } | null
}

// Webhook Logs
{
  webhookLogs: Array<{ id, timestamp, from, fromName, message }>
}

// Auto-Reply Rules
{
  autoReplyRules: Array<{
    id, name, triggerKeywords,
    replyTemplate, enabled, useAI,
    category, priority
  }>,
  showRuleModal: boolean,
  editingRule: object | null,
  ruleForm: { name, triggerKeywords, replyTemplate, enabled, useAI, category }
}

// Development
{
  useMock: boolean
}
```

### localStorage Schema

```json
{
  "barberzap_whatsapp_config": {
    "apiBaseUrl": "http://localhost:8080",
    "apiKey": "your-api-key",
    "instanceName": "barberzap01",
    "webhookUrl": "http://your-app.com/api/whatsapp/webhook/barberzap01"
  },
  "barberzap_whatsapp_status": {
    "state": "open",
    "connected": true,
    "lastChecked": "2025-02-25T20:00:00.000Z"
  },
  "barberzap_webhook_logs": [
    {
      "id": "1234567890",
      "timestamp": "2025-02-25T20:00:00.000Z",
      "from": "5511987654321@s.whatsapp.net",
      "fromName": "Cliente Teste",
      "message": "Olá, gostaria de agendar",
      "status": "received"
    }
  ],
  "barberzap_auto_reply_rules": [
    {
      "id": "1",
      "name": "Bem-vindo",
      "triggerKeywords": ["oi", "olá", "hello"],
      "replyTemplate": "Olá! Bem-vindo...",
      "enabled": true,
      "useAI": false,
      "category": "greeting",
      "priority": 1
    }
  ]
}
```

## API Integration

### Evolution API Endpoints

```
GET  /instance/connectionState/{instance}
     → Check connection status

GET  /instance/connect/{instance}
     → Get QR code for pairing

DELETE /instance/logout/{instance}
     → Disconnect instance

POST /message/sendText/{instance}
     → Send text message
     Body: { number: "5511987654321@c.us", text: "message" }

GET  /webhook/find/{instance}
     → Get webhook configuration

POST /webhook/set/{instance}
     → Configure webhook
     Body: { url: "http://...", webhook_by_events: ["MESSAGES_UPSERT"] }
```

### Webhook Events

```javascript
// Incoming webhook payload
{
  "event": "messages.upsert",
  "data": [
    {
      "key": {
        "remoteJid": "5511987654321@s.whatsapp.net"
      },
      "pushName": "Cliente Teste",
      "message": {
        "conversation": "Olá, gostaria de agendar"
      },
      "messageTimestamp": 1706280000
    }
  ]
}
```

## Auto-Reply Logic

### Rule Matching Algorithm

```javascript
1. Get all enabled rules (filtered by enabled: true)
2. Sort rules by priority (lower number = higher priority)
3. Check each rule's keywords:
   - Match if ANY keyword is in message
   - Case-insensitive
   - Supports partial matches
4. Return first matching rule
5. If no match, return null
```

### Placeholder Replacement

```javascript
// Template input
"Olá! Bem-vindo à {BARBERSHOP_NAME}. Nossos horários: {OPEN_TIME} - {CLOSE_TIME}"

// Context input
{
  barbershopName: "BarberZap",
  openTime: "09:00",
  closeTime: "20:00"
}

// Result output
"Olá! Bem-vindo à BarberZap. Nossos horários: 09:00 - 20:00"
```

## Icon Usage

```javascript
// Connection Status
Wifi, WifiOff, RefreshCw

// Configuration
Settings, QrCode, Copy, Link

// Messaging
Send, MessageSquare, Phone

// Rules
Bot, Plus, Trash2, Eye, EyeOff, Power, PowerOff

// Status & Feedback
CheckCircle, XCircle, AlertTriangle, Clock, Download
```

## Color Scheme

```css
/* Status Colors */
Connected:   bg-emerald-500/15, text-emerald-400
Disconnected:bg-amber-500/15,  text-amber-500
Error:       bg-red-500/15,    text-red-400

/* Component Colors */
Primary:     bg-amber-500,     text-slate-900
Secondary:   bg-slate-700/50,  text-white
Ghost:       bg-transparent,   text-gray-400

/* Badges */
Success:     bg-emerald-500/15, text-emerald-400
Warning:     bg-amber-500/15,  text-amber-500
Info:        bg-blue-500/15,   text-blue-400
Default:     bg-slate-700,     text-gray-400
```

## Responsive Breakpoints

```javascript
// Mobile First Approach
< 640px   → Mobile layout (single column)
640-1023px → Tablet layout (adjust columns)
≥ 1024px  → Desktop layout (full features)

// Specific Components
StatCards: 1 col (mobile) → 3 col (desktop)
Tables:   scrollable horizontal (mobile) → full width (desktop)
Modals:   full screen (mobile) → centered dialog (desktop)
```

## Component Props Reference

### StatCard

```javascript
<StatCard
  icon={MessageSquare}      // Lucide icon
  value={123}              // Number to display
  label="Mensagens"        // Description text
/>
```

### DataTable

```javascript
<DataTable
  columns={[
    { key: 'name', label: 'Nome', render: (value, row) => ... },
    { key: 'status', label: 'Status' }
  ]}
  data={rowsArray}
  actions={(row) => <button>Edit</button>}
  emptyMessage="No data"
/>
```

### Badge

```javascript
<Badge
  variant="success"         // success | warning | error | info | default
  showDot={true}           // Show colored dot
  size="sm"                // xs | sm | base | lg
>
  Text
</Badge>
```

### Button

```javascript
<Button
  variant="primary"         // primary | secondary | outline | ghost | danger
  size="base"               // sm | base | lg
  loading={false}           // Show spinner
  disabled={false}
  onClick={handler}
  leftIcon={<Icon />}
>
  Button Text
</Button>
```

### Modal

```javascript
<Modal
  isOpen={true}
  onClose={handler}
  title="Modal Title"
  size="lg"                 // sm | md | lg | xl | 2xl | full
  footer={<Buttons />}
>
  Content
</Modal>
```

### Input

```javascript
<Input
  label="Field Label"
  placeholder="Placeholder"
  type="text"
  state="default"           // default | error | success
  value={value}
  onChange={handler}
  leftIcon={<Icon />}
/>
```

### Toggle

```javascript
<Toggle
  checked={true}
  onChange={handler}
  label="Toggle Label"
  description="Description text"
  size="base"               // sm | base | lg
/>
```

---

This structure guide provides a comprehensive overview of the WhatsApp integration implementation.
