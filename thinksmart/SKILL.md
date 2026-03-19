---
name: kpsd
description: Answer questions about Katie Philpott School of Dance (KPSD) — the kids' dance school. Use this skill whenever the user asks about dance lessons, classes, teachers, schedules, payments, invoices, or anything related to KPSD or the kids' dancing. Trigger phrases include: "dance lesson", "KPSD", "Esme/Florrie/Alice's class", "is the lesson on", "who is the teacher", "when is dance", "have we paid", "next payment", "dance school", or any question about the kids' schedules or dance school finances.
---

# KPSD — Katie Philpott School of Dance

This skill answers questions about the family's KPSD account using the ThinkSmart
customer portal API.

## Students & Account

| Name | StudentID |
|---|---|
| Esme MacDonald | 606 |
| Florrie MacDonald | 607 |
| Alice MacDonald | 777 |

Parent: Rob MacDonald (ClientID: 50169)

---

## API Reference

**Base URL:** `https://www.thinksmartsoftwareuk.com/customer_portal_backend`

**Auth:** `Token` request header. The token is long-lived. If it has expired,
follow the login flow below to get a fresh one. Prompt the user for their password
only if absolutely necessary.

**Responses:** All responses are **base64-encoded JSON**. Always decode before parsing:
```python
import base64, json
decoded = json.loads(base64.b64decode(response_text).decode('utf-8'))
```

### Standard request pattern

All calls are `POST` with these base params in the body, plus endpoint-specific params:

```
p=dancebiz
c=5E9597F66CF86
cp_version=1.17.8
cp_housing_version=1175
```

Headers required on all calls:
```
Content-Type: application/x-www-form-urlencoded; charset=UTF-8
Accept: application/json, text/plain, */*
Token: <session_token>
Origin: https://www.thinksmartsoftwareuk.com
Referer: https://www.thinksmartsoftwareuk.com/customer_portal_v2/
User-Agent: Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148
```

---

## Login Flow (only if token expired)

**Call 1** — POST `/login` with base params + credentials:
```
Email=rob@robmacdonald.com
Password=<hashed_password>
```
Returns `Data.Clients[]` — array of `{ Name, Token }`. Extract `Token` for call 2.

**Call 2** — POST `/login` with base params and the token from call 1 in the `Token` header.
Returns `Data.Token` (URL-encoded session token) and full client/config data.

> Note: The password stored by the app is an MD5 hash, base64-encoded. Claude should
> not attempt to derive it. If the token is expired and login is needed, ask the user
> to log in to the KPSD app briefly with HTTP Catcher running, then share the fresh
> Token header value.

---

## Endpoints

### `get_enrollments`
Returns all classes (current and historical) for one student.

**Extra params:** `StudentID=<id>`

**Key response fields:**
- `Data.Student.FirstName`, `LastName`, `StudentID`
- `Data.Student.scheduled_classes[]` — all classes ever enrolled in
  - `IsCurrent` (bool) — in the current term
  - `displayedFields` — nested object; flatten to get named fields (see below)
  - `ClassID` — needed for `get_class_sessions`

**Parsing displayedFields:**
```python
fields = {}
for group in cls['displayedFields'].values():
    for f in group:
        fields[f['Name']] = f['Value']
# Available fields: 'Lesson format', 'Day', 'Time', 'Duration', 'Teacher',
#                   'Date range', 'Venue', 'Next session', 'Price'
```

**"Next session"** values:
- `"DD/MM/YYYY"` — next upcoming date
- `"No classes remaining"` — term ended, no more sessions

**To find active lessons:** filter `scheduled_classes` where `IsCurrent == True`
AND `Next session != "No classes remaining"`.

---

### `get_class_sessions`
Returns session-level detail for a specific class, including cancellation status.

**Extra params:** `ClassID=<id>` + `StudentID=<id>`
⚠️ Both params are required — omitting StudentID causes a 500 error.

**Key response fields:**
- `Data.Class.new_sessions[]`
  - `Date` (YYYY-MM-DD), `StartTime`, `EndTime`
  - `isInFuture` (bool)
  - `Active` (1 = on, 0 = cancelled)
  - `Notes` — cancellation message or empty string
  - `staff[]` — `{ FirstName, LastName }` per teacher
  - `venue` — `{ Name }`

---

### `get_invoices`
Returns all invoices for the account.

**Extra params:** none (token-scoped to account)

**Key fields per invoice:** `InvoiceNo`, `InvoiceDate`, `Total`, `amountPaid`, `totalDue`, `Paid`

---

### `get_upcoming_payments`
Returns scheduled recurring direct debit charges.

**Extra params:** none

**Key fields:** `Data.recurring_charges[]` — `Amount`, `nextChargeDate`, `ChargeVia`, `Status`

---

### `get_balance_history`
Returns full credit/debit history.

**Key fields:** `Data.BalanceHistoryItems[]` — `Description`, `Amount`, `Date`, `AccountBalance`

---

### `get_notifications`
Returns in-app notifications from the school.

**Key fields:** `Data.NotificationContacts[]` — `Status` (Viewed/Unread), `notification.ClientInAppTitle`, `notification.ClientInAppContent`

---

## Answering Common Questions

### "What's the next lesson / what's on this week?"
1. Call `get_enrollments` for each student (3 calls, StudentIDs 606, 607, 777)
2. Filter to `IsCurrent == True` and `Next session` is a date (not "No classes remaining")
3. Parse `displayedFields` for Day, Time, Teacher, Venue, Next session
4. Sort by next session date and present all upcoming lessons

### "When is [student]'s lesson?"
1. Call `get_enrollments` for that student
2. Find current active classes, parse fields
3. Return Day, Time, Venue, Teacher, next date

### "Is the lesson on?" / "Is it cancelled?"
1. Get the student's current ClassID from `get_enrollments`
2. Call `get_class_sessions` with `ClassID` + `StudentID`
3. Filter `new_sessions` to `isInFuture == True`
4. Check `Active` (1 = on, 0 = cancelled) and `Notes`
5. Report the next session date/time, status, and any notes

### "Who is [student]'s teacher tonight / this week?"
1. Call `get_enrollments` → parse `Teacher` field from `displayedFields`
2. Optionally confirm via `get_class_sessions` → `staff[]` on the next future session

### "How much have we paid?" / "Total spend"
1. Call `get_invoices`
2. Sum `amountPaid` across all invoices
3. Return total, number of invoices, and date range

### "Are we all paid up?" / "Do we owe anything?"
1. Call `get_invoices`
2. Sum `totalDue` — if £0.00, all paid up
3. If not, list unpaid invoices with dates and amounts

### "When's the next payment?"
1. Call `get_upcoming_payments`
2. Sort `recurring_charges` by `nextChargeDate`
3. Return each with amount, date, and payment method

---

## Live-Tested Known State (as of 19 March 2026)

- **Esme**: Modern Seniors, Thursday 6:30PM, Sophie Clayton, Zion Baptist Church
  - Next session: 19/03/2026 ✅ ON
- **Florrie**: No current active classes this term
- **Alice**: Street Juniors Level 2, Wednesday 4:45PM, Rachel Bowers, Zion Baptist Church
  - Next session: 25/03/2026 ✅ ON
- **Invoices**: 65 total | £3,796.05 paid | £0.00 outstanding ✅
- **Upcoming DDs**: £49.50 on 01/04/2026, £8.00 on 28/04/2026 (both GoCardless)

---

## Response Style

Conversational and concise. For lesson info:

> **Esme** — Modern Seniors, Thursday 6:30PM at Zion Baptist Church
> Teacher: Sophie Clayton | Next: 19 March ✅ On

For financials:

> You're all paid up — £0 outstanding across 65 invoices (£3,796.05 total paid).
> Next direct debit: £49.50 on 1 April via GoCardless.
