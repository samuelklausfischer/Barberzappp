# WhatsApp Integration - BarberZap Admin Panel

Complete WhatsApp integration management interface using Evolution API.

## Components

### 1. Evolution API Wrapper (`evolutionAPI.js`)

Handles all communication with Evolution API:

- **Connection Management**: Check status, connect/disconnect instances
- **QR Code**: Generate QR codes for pairing devices
- **Messaging**: Send text messages
- **Webhooks**: Configure and manage webhooks
- **Logging**: Store and retrieve incoming message logs

### 2. Auto-Reply Service (`autoReply.js`)

Manages automatic response rules:

- **CRUD Operations**: Create, read, update, delete rules
- **Keyword Matching**: Find matching rules for incoming messages
- **Template System**: Replace placeholders with dynamic values
- **AI Toggle**: Configure rules to use AI enhancement
- **Import/Export**: Backup and restore rules
- **Statistics**: Track rule usage

### 3. WhatsApp Page (`WhatsAppPage.jsx`)

Main UI component with:

- Connection status panel with visual indicator
- QR code display for device pairing
- API configuration modal
- Test message sender
- Webhook logs table
- Auto-reply rules management
- Real-time status polling (60s interval)

## Features

### Connection Status Panel
- Visual connection indicator (Connected/Disconnected)
- Instance name display
- Connection state with last checked timestamp
- QR code area for pairing
- Connect/Disconnect buttons
- Auto-refresh button

### API Configuration
- Base URL input
- API key authentication
- Instance name configuration
- Auto-generated webhook URL
- Copy webhook URL button

### Test Message Sender
- Phone input (Brazil format)
- Message textarea
- Send button with loading state
- Success/error feedback alerts

### Webhook Logs
- Table of inbound messages
- Timestamp, sender, and message preview
- Last 5 messages shown by default
- Simulate webhook button for testing

### Auto-Reply Rules
- Create/edit/delete rules
- Keyword triggers (comma-separated)
- Reply templates with placeholders
- Active/inactive toggle
- AI assistant toggle
- Category and priority management
- Pre-configured default rules

## Default Auto-Reply Rules

1. **Bem-vindo** - Greeting for new contacts
2. **Horários** - Business hours information
3. **Agendamento** - Appointment booking flow (AI-enabled)
4. **Valores** - Service pricing
5. **Endereço** - Location and map
6. **Cancelar Agendamento** - Cancellation flow (AI-enabled)

## Placeholders

Available placeholders for reply templates:

- `{BARBERSHOP_NAME}` - Shop name
- `{PHONE}` - Contact phone
- `{WHATSAPP_NUMBER}` - WhatsApp number
- `{OPEN_TIME}` - Opening time
- `{CLOSE_TIME}` - Closing time
- `{SATURDAY_HOURS}` - Saturday hours
- `{ADDRESS}` - Shop address
- `{REFERENCE_POINT}` - Location reference
- `{MAPS_URL}` - Google Maps link
- `{SERVICES_LIST}` - Services pricing

## Mock Mode

For development without actual Evolution API:

1. Toggle "Modo Mock" button in the page header
2. Mock mode simulates:
   - Connection status checking
   - QR code generation
   - Message sending
   - Instance logout

3. Real mode requires:
   - Running Evolution API server
   - Valid API key
   - Configured instance

## Evolution API Endpoints Used

- `GET /instance/connectionState/{instance}` - Check status
- `GET /instance/connect/{instance}` - Get QR code
- `DELETE /instance/logout/{instance}` - Disconnect
- `POST /message/sendText/{instance}` - Send message
- `GET /webhook/find/{instance}` - Get webhook config
- `POST /webhook/set/{instance}` - Configure webhook

## Storage

All data stored in localStorage:

- `barberzap_whatsapp_config` - API configuration
- `barberzap_whatsapp_status` - Connection status cache
- `barberzap_webhook_logs` - Incoming message logs
- `barberzap_auto_reply_rules` - Auto-reply rules

## Browser Support

All modern browsers with localStorage support.

## Dependencies

- React 18+
- Lucide React (icons)

## Usage Example

```jsx
import { WhatsAppPage } from '../Framework/Pages';

// In route configuration
<Route path="/dashboard/whatsapp" element={<WhatsAppPage />} />

// Direct import
import { WhatsAppPage } from '/root/Barberzap SITE/Framework/Pages/WhatsAppPage';
```

## Future Enhancements

- [ ] Message templates library
- [ ] Bulk message sending
- [ ] Contact list management
- [ ] Chat history viewer
- [ ] Media message support
- [ ] Message scheduling
- [ ] Analytics and statistics dashboard
- [ ] Multi-instance support
- [ ] Team collaboration features

## Troubleshooting

### Connection Issues
1. Verify API base URL is correct
2. Check API key is valid
3. Ensure instance name matches Evolution API
4. Check network connectivity to API server

### QR Code Not Showing
1. Status must be "disconnected"
2. Click "Conectar" button
3. Wait for QR code to generate
4. Scan with WhatsApp on your phone
5. Wait 30-60 seconds for connection confirmation

### Auto-Reply Not Working
1. Verify rules are enabled (active status)
2. Check keyword matching (case-insensitive)
3. Ensure rule priority is correct
4. Test with "Simular" button

### Messages Not Sending
1. Check connection status
2. Verify phone number format (with country code)
3. Ensure message text is not empty
4. Check Evolution API logs for errors
