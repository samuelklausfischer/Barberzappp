# CRM Feature Testing Guide

## Quick Testing Steps

### 1. Access the Page
```
URL: http://localhost:5173/dashboard/clientes
```

### 2. Test Client List

**View Stats:**
- Total clients count
- Active clients count
- Inactive clients count
- Pending clients count

**Search:**
- Type "João" → Should show "João Silva"
- Type email→ Filter by email
- Type phone → Filter by phone

**Filter by Status:**
- Select "Ativos" → Show only active clients
- Select "Inativos" → Show only inactive clients
- Select "Pendentes" → Show pending clients
- Select "Todos Status" → Show all

**View Modes:**
- Click grid icon → Grid card layout
- Click list icon → Compact list layout

### 3. Test Client Details

**Click any client card** to open detail modal:

**Profile Tab:**
- ✓ Avatar with initials (color-coded)
- ✓ Contact info (email, phone)
- ✓ Address fields
- ✓ Metrics (appointments, spent, avg)
- ✓ Favorite button toggle
- ✓ Edit button → Opens form
- ✓ Archive button → Archives client

**History Tab:**
- ✓ Table with past appointments
- ✓ Status badges (Concluído, Cancelado, etc.)
- ✓ Service names and barbers
- ✓ Prices in BRL format
- ✓ Summary stats at top

**Notes Tab:**
- ✓ Client notes display
- ✓ Add Note button → Opens form

### 4. Test Add Client

**Click "Novo Cliente"** button:

**Form Fields:**
- Name (required) - Try empty → Error "Nome é obrigatório"
- Email - Try invalid format → Error "E-mail inválido"
- Phone (required) - Auto-formats to +55 XX XXXXX-XXXX
- Birthdate - Date picker
- Address - Full address form
- Notes - Textarea
- Status - Dropdown

**Duplicate Detection:**
- Use existing client's email → Error "Já existe um cliente com este e-mail"
- Use existing client's phone → Error "Já existe um cliente com este telefone"

**Save:**
- Click "Cadastrar" → Client added and form closes
- New client appears in list

### 5. Test Edit Client

1. Open any client detail
2. Click "Editar Cliente"
3. Modify fields
4. Click "Atualizar"
5. Changes saved and list updates

### 6. Test Delete Client

1. Open any client detail
2. Click trash icon or use card delete button
3. Confirm modal appears
4. Click "Sim, Excluir"
5. Client removed from list

### 7. Test Archive

1. Open any client detail
2. Click Archive button
3. Client status changes to "archived"
4. Filter by "Arquivados" to view

### 8. Test Bulk Actions

**Select Multiple Clients:**
- Click checkboxes on client cards
- Bulk actions bar appears

**Export CSV:**
- Click "Exportar" button
- CSV file downloads

**Send WhatsApp:**
- Click "WhatsApp" button
- Opens WhatsApp web/message

### 9. Test WhatsApp Link

**From client detail:**
- Modal or detail view → WhatsApp button
- Opens `https://wa.me/55XXXXXXXXXXX` with pre-filled message

---

## Mock Data Included

The system includes 5 mock clients:

1. **João Silva** (Active) - 24 appointments, R$ 1.920 spent
2. **Maria Santos** (Active) - 36 appointments, R$ 2.880 spent
3. **Pedro Oliveira** (Inactive) - 8 appointments, R$ 640 spent
4. **Ana Costa** (Pending) - New signup, no history
5. **Carlos Ferreira** (Active) - 45 appointments, R$ 3.600 spent

Plus 4 mock appointments for history.

---

## Responsive Testing

### Desktop (1024px+)
- 3-column grid
- Full modals
- All filters visible

### Tablet (768px - 1023px)
- 2-column grid
- Stacked filters
- Modals adjusted

### Mobile (< 768px)
- 1-column grid or list
- Bottom sheet style modals
- Stacked search and filters
- Touch-optimized buttons

---

## Known Limitations (Due to Demo)

1. No backend persistence - data resets on refresh
2. No image upload - uses avatar with initials
3. WhatsApp opens external app
4. Favorites are not persisted
5. Bulk WhatsApp is placeholder

---

## Next Steps for Production

1. **API Integration**
   - Replace `clientService` mock methods with real API calls
   - Configure endpoints: `/api/clients`, `/api/appointments`

2. **Authentication**
   - Ensure user is logged in (already using ProtectedRoute)
   - Add role-based access if needed

3. **Image Upload**
   - Implement profile photo upload to S3/cloud storage
   - Update ClientDetailModal to show uploaded image

4. **Notifications**
   - Add in-app notifications for client actions
   - Email notifications for new signups

5. **Analytics**
   - Add charts for client retention
   - Revenue trends per client

---

## Browser Support

Tested on:
- Chrome (latest) ✅
- Firefox (latest) ✅
- Safari (latest) ✅
- Edge (latest) ✅
- Mobile browsers ✅

---

## Performance Notes

- Debounced search (300ms) for better UX
- Pagination ready (25 items per page)
- Skeleton loading states
- Optimized re-renders with React hooks

---

## Support

For issues or questions, check:
- `/root/Barberzap SITE/Framework/CRM_README.md` - Full documentation
- `/root/Barberzap SITE/Framework/CRM_DELIVERABLES.md` - Deliverables summary
- `/root/Barberzap SITE/Framework/Logic/clientLogic.js` - Business logic
