# ThinkSmart Driving School Portal Skill

This AgenticSkill provides integration with the ThinkSmart driving school customer portal, enabling queries about lessons, payments, instructors, and account information.

## Capabilities

### Lesson Information
- **Next lesson queries**: "What lesson is next?", "When is the next lesson?"
- **Student-specific lessons**: "When is Esme's lesson?", "Is the lesson on?"
- **Instructor information**: "Who is Alice's lesson with tonight?"
- **Multi-student overview**: "Find out what lesson is next, across all kids"

### Payment Information  
- **Payment status**: "How much have we paid?", "Are we all paid up?"
- **Balance inquiries**: "What's our current balance?"
- **Upcoming payments**: "When is the next payment due?"

### Account Management
- **Account details**: Student information, contact details
- **Enrollment status**: Current enrollments and progress
- **Notifications**: Portal notifications and announcements

## API Endpoints

The skill integrates with the following ThinkSmart portal APIs:

| Endpoint | Purpose | Key Data |
|----------|---------|----------|
| `login` | Authentication | Session credentials |
| `get_class_sessions` | Lesson schedules | Dates, times, instructors, locations |
| `get_enrollments` | Student enrollments | Enrollment status, student details |
| `get_client_details` | Account information | Personal details, contact info |
| `get_payment_details` | Payment status | Balance, payment history |
| `get_invoices` | Invoice history | Billing records, amounts |
| `get_balance_history` | Transaction history | All balance changes |
| `get_upcoming_payments` | Scheduled payments | Future payment dates/amounts |
| `get_agreements` | Legal agreements | Signed terms and conditions |
| `get_notifications` | Portal messages | Announcements, alerts |

## Usage Examples

### Example 1: Next Lesson Query
```
User: "What lesson is next for Alice?"
Skill Response: "Alice's next lesson is on 2026-03-25 at 4:30 PM with John Smith"
```

### Example 2: Payment Status
```
User: "Are we all paid up?"
Skill Response: "Current balance: £0.00, Total paid: £450.00. Account is fully paid up ✓"
```

### Example 3: Multi-Student Overview
```
User: "Find out what lesson is next, across all kids"
Skill Response: "Upcoming lessons:
- Alice: 2026-03-25 at 4:30 PM with John Smith
- Esme: 2026-03-27 at 5:00 PM with Sarah Davis
- Tom: 2026-03-28 at 3:30 PM with Mike Wilson"
```

### Example 4: Instructor Query
```
User: "Who is Alice's lesson with tonight?"
Skill Response: "Alice's lesson tonight is with John Smith"
```

## Implementation Details

### Authentication Flow
1. User provides portal credentials
2. Skill authenticates via `login` endpoint
3. Session credentials stored for subsequent API calls
4. Automatic re-authentication on session expiry

### Data Processing
- Cross-references session data with enrollment information
- Handles multiple students under single account
- Normalizes date/time formats for consistent responses
- Filters and sorts data based on query context

### Error Handling
- Graceful handling of authentication failures
- Network timeout management
- API response validation
- User-friendly error messages

## Security Considerations

- Credentials handled securely and not stored persistently
- API calls limited to user's authorized data scope
- No logging of sensitive personal information
- Session timeout and automatic credential clearing

## Requirements

- Access to ThinkSmart customer portal credentials
- Network connectivity to `thinksmartsoftwareuk.com`
- Python 3.7+ (for reference implementation)
- Requests library for HTTP client operations

## Installation

1. Ensure you have valid ThinkSmart portal credentials
2. Install required dependencies: `pip install requests`
3. Configure authentication credentials securely
4. Use the skill through your AgenticSkill-compatible agent

## Configuration

The skill requires the following configuration:

```python
config = {
    "portal_url": "https://www.thinksmartsoftwareuk.com/customer_portal_backend/",
    "username": "your_portal_username",
    "password": "your_portal_password"
}
```

## Troubleshooting

### Common Issues

**Authentication Failures**
- Verify portal credentials are correct
- Check if account is active and not locked
- Ensure portal accessibility

**No Data Returned**
- Confirm student enrollments are active
- Check if there are scheduled lessons
- Verify payment information is available

**Network Issues**
- Check internet connectivity
- Verify portal domain accessibility
- Confirm firewall/proxy settings

## Support

For issues related to:
- **Portal access**: Contact ThinkSmart support
- **Skill functionality**: Check skill documentation
- **API changes**: Review ThinkSmart portal updates

## Version History

- **v1.0**: Initial release with core lesson and payment query capabilities
