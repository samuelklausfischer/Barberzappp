# Example Webhook Payloads

This directory contains example webhook payloads for testing the BarberZap webhook system.

## Files

### appointments_insert.json
Example INSERT event for appointments table.

### appointments_update.json
Example UPDATE event (status change) for appointments table.

### client_insert.json
Example INSERT event for clients table.

### services_update.json
Example UPDATE event for services table.

### employee_update.json
Example UPDATE event for employees table.

## Usage

```bash
# Test with specific payload
python -m barber.webhooks webhook simulate \
  --payload example_webhooks/appointments_insert.json \
  --dry-run

# Check which cache patterns will be invalidated
python -m barber.webhooks webhook simulate \
  --payload example_webhooks/appointments_update.json
```

## Signature Generation

To generate a valid signature for testing:

```bash
# Using openssl
echo -n "$(cat appointments_insert.json)" | \
  openssl dgst -sha256 -hmac "your-webhook-secret" | \
  awk '{print "sha256="$2}'
```

## Expected Cache Patterns

### appointments_insert.json
- `barberzap:appointments:shop_barber_123:2026-03-04`
- `barberzap:tenant:shop_barber_123`

### appointments_update.json
- `barberzap:appointments:shop_barber_123:2026-03-04`
- `barberzap:client:stats:client_john_456` (if status changed)

### client_insert.json
- `barberzap:client:client_john_456`
- `barberzap:tenant:shop_barber_123`

### services_update.json
- `barberzap:services:shop_barber_123`
- `barberzap:tenant:shop_barber_123`

### employee_update.json
- `barberzap:tenant:shop_barber_123`
