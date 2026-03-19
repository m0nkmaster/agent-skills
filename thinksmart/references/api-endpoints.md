# ThinkSmart Portal API Reference

## Base URL
```
https://www.thinksmartsoftwareuk.com/customer_portal_backend/
```

## Authentication

All API calls (except login) require prior authentication.

### POST /login
Authenticates user with the portal.

**Request Body:**
```json
{
  "username": "string",
  "password": "string"
}
```

**Response:**
```json
{
  "success": true,
  "session_id": "string",
  "user_info": {
    "client_id": "string",
    "name": "string"
  }
}
```

## Core API Endpoints

### POST /get_class_sessions
Retrieves all class sessions for the authenticated user.

**Response Structure:**
```json
[
  {
    "session_id": "string",
    "student_name": "string",
    "date": "YYYY-MM-DD",
    "time": "HH:MM",
    "duration": "minutes",
    "instructor_name": "string",
    "location": "string",
    "status": "scheduled|completed|cancelled",
    "lesson_type": "theory|practical|assessment"
  }
]
```

### POST /get_enrollments
Gets enrollment information for all students under the account.

**Response Structure:**
```json
[
  {
    "enrollment_id": "string",
    "student_name": "string",
    "course_type": "string",
    "enrollment_date": "YYYY-MM-DD",
    "status": "active|completed|suspended",
    "progress": {
      "lessons_completed": "number",
      "total_lessons": "number",
      "hours_completed": "number"
    }
  }
]
```

### POST /get_client_details
Retrieves client/account information.

**Response Structure:**
```json
{
  "client_id": "string",
  "name": "string",
  "email": "string",
  "phone": "string",
  "address": {
    "street": "string",
    "city": "string",
    "postcode": "string"
  },
  "account_status": "active|suspended|closed",
  "created_date": "YYYY-MM-DD"
}
```

## Payment APIs

### POST /get_payment_details
Gets current payment and balance information.

**Response Structure:**
```json
{
  "current_balance": "number",
  "total_paid": "number",
  "credit_limit": "number",
  "payment_method": "string",
  "last_payment_date": "YYYY-MM-DD",
  "account_status": "current|overdue|paid_up"
}
```

### POST /get_invoices
Retrieves invoice history.

**Response Structure:**
```json
[
  {
    "invoice_id": "string",
    "date": "YYYY-MM-DD",
    "amount": "number",
    "status": "paid|unpaid|partial",
    "due_date": "YYYY-MM-DD",
    "description": "string",
    "payment_date": "YYYY-MM-DD"
  }
]
```

### POST /get_balance_history
Gets complete balance transaction history.

**Response Structure:**
```json
[
  {
    "transaction_id": "string",
    "date": "YYYY-MM-DD",
    "type": "payment|charge|adjustment",
    "amount": "number",
    "balance_after": "number",
    "description": "string"
  }
]
```

### POST /get_upcoming_payments
Retrieves scheduled future payments.

**Response Structure:**
```json
[
  {
    "payment_id": "string",
    "due_date": "YYYY-MM-DD",
    "amount": "number",
    "description": "string",
    "status": "scheduled|pending"
  }
]
```

## Other APIs

### POST /get_agreements
Retrieves signed legal agreements.

**Response Structure:**
```json
[
  {
    "agreement_id": "string",
    "type": "terms|privacy|contract",
    "signed_date": "YYYY-MM-DD",
    "version": "string",
    "status": "active|expired"
  }
]
```

### POST /get_notifications
Gets portal notifications and announcements.

**Response Structure:**
```json
[
  {
    "notification_id": "string",
    "title": "string",
    "message": "string",
    "date": "YYYY-MM-DD",
    "type": "info|warning|urgent",
    "read": true|false
  }
]
```

### POST /get_company_config
Retrieves portal configuration and settings.

**Response Structure:**
```json
{
  "company_name": "string",
  "portal_version": "string",
  "features": {
    "online_booking": true|false,
    "payment_processing": true|false,
    "theory_test_booking": true|false
  },
  "contact_info": {
    "phone": "string",
    "email": "string",
    "address": "string"
  }
}
```

## Error Responses

All endpoints may return error responses:

```json
{
  "success": false,
  "error": {
    "code": "string",
    "message": "string",
    "details": "string"
  }
}
```

### Common Error Codes

- `AUTH_REQUIRED` - Authentication needed
- `INVALID_CREDENTIALS` - Login failed
- `SESSION_EXPIRED` - Re-authentication required
- `ACCESS_DENIED` - Insufficient permissions
- `NOT_FOUND` - Resource not found
- `SERVER_ERROR` - Internal server error

## Rate Limiting

- API calls limited to 60 requests per minute
- Authentication calls limited to 5 per minute
- Exceeding limits returns HTTP 429 status

## Data Formats

### Dates
- Format: `YYYY-MM-DD`
- Timezone: UTC (convert as needed)

### Times
- Format: `HH:MM` (24-hour)
- Timezone: Local to portal

### Currency
- All amounts in GBP (£)
- Format: Decimal with 2 places

## Response Codes

| Status | Meaning |
|--------|---------|
| 200 | Success |
| 401 | Authentication required |
| 403 | Access denied |
| 404 | Not found |
| 429 | Rate limit exceeded |
| 500 | Server error |
