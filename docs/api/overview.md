# DeelRx CRM API Documentation

Welcome to the DeelRx CRM API! This comprehensive REST API allows you to integrate with and extend the DeelRx CRM platform programmatically.

## 🎯 API Overview

The DeelRx CRM API is designed with the following principles:
- **REST-compliant**: Uses standard HTTP methods and status codes
- **JSON-first**: All requests and responses use JSON format
- **Multi-tenant**: Built-in support for multi-tenant applications
- **Secure**: OAuth 2.0 authentication with role-based permissions
- **Rate-limited**: Fair usage policies to ensure system stability
- **Versioned**: Backward-compatible versioning for stability

### Base URL
```
Production: https://deelrxcrm.app/api/v1
Staging: https://staging.deelrxcrm.app/api/v1
```

### API Version
Current version: **v1**

All API endpoints are prefixed with `/api/v1/` to ensure version compatibility.

## 🔐 Authentication

DeelRx CRM API uses **OAuth 2.0** with **JWT tokens** for authentication. All API requests must include a valid authentication token.

### Authentication Methods

#### 1. API Key Authentication (Recommended for server-to-server)
```http
GET /api/v1/contacts
Authorization: Bearer your-api-key-here
```

#### 2. OAuth 2.0 Flow (Recommended for client applications)
```http
POST /api/v1/oauth/token
Content-Type: application/json

{
  "grant_type": "authorization_code",
  "client_id": "your-client-id",
  "client_secret": "your-client-secret",
  "code": "authorization-code",
  "redirect_uri": "https://yourapp.com/callback"
}
```

#### 3. Session-based (For web frontend)
Uses HTTP-only cookies set by the authentication system.

### Getting API Credentials

1. **Log in to DeelRx CRM** as an admin user
2. **Navigate to Settings** → **API & Integrations**
3. **Create API Key** or **Register OAuth Application**
4. **Set permissions** and **rate limits** as needed
5. **Copy credentials** and store securely

### Token Management

```javascript
// Example: Refreshing access token
const refreshToken = async () => {
  const response = await fetch('/api/v1/oauth/refresh', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      refresh_token: 'your-refresh-token',
      grant_type: 'refresh_token'
    })
  });
  
  const data = await response.json();
  return data.access_token;
};
```

## 📝 Request Format

### Headers
All requests should include these headers:
```http
Content-Type: application/json
Authorization: Bearer your-token-here
X-Tenant-ID: your-tenant-id (if multi-tenant)
User-Agent: YourApp/1.0
```

### Request Body
For POST, PUT, and PATCH requests:
```json
{
  "data": {
    "type": "contact",
    "attributes": {
      "first_name": "John",
      "last_name": "Doe",
      "email": "john.doe@example.com"
    },
    "relationships": {
      "organization": {
        "data": {
          "type": "organization",
          "id": "123"
        }
      }
    }
  }
}
```

## 📊 Response Format

### Success Response
```json
{
  "data": {
    "id": "12345",
    "type": "contact",
    "attributes": {
      "first_name": "John",
      "last_name": "Doe",
      "email": "john.doe@example.com",
      "created_at": "2024-12-01T10:00:00Z",
      "updated_at": "2024-12-01T10:00:00Z"
    },
    "relationships": {
      "organization": {
        "data": {
          "type": "organization",
          "id": "123"
        }
      }
    }
  },
  "meta": {
    "request_id": "req_abc123",
    "timestamp": "2024-12-01T10:00:00Z"
  }
}
```

### Collection Response
```json
{
  "data": [
    {
      "id": "12345",
      "type": "contact",
      "attributes": { ... }
    },
    {
      "id": "12346", 
      "type": "contact",
      "attributes": { ... }
    }
  ],
  "meta": {
    "total_count": 150,
    "page": 1,
    "per_page": 25,
    "total_pages": 6,
    "request_id": "req_abc123"
  },
  "links": {
    "self": "/api/v1/contacts?page=1",
    "next": "/api/v1/contacts?page=2",
    "prev": null,
    "first": "/api/v1/contacts?page=1",
    "last": "/api/v1/contacts?page=6"
  }
}
```

### Error Response
```json
{
  "errors": [
    {
      "id": "error_123",
      "status": "400",
      "code": "VALIDATION_ERROR",
      "title": "Validation Error",
      "detail": "Email address is required",
      "source": {
        "pointer": "/data/attributes/email"
      },
      "meta": {
        "field": "email"
      }
    }
  ],
  "meta": {
    "request_id": "req_abc123",
    "timestamp": "2024-12-01T10:00:00Z"
  }
}
```

## 🔌 Core API Endpoints

### Contacts API
Manage customer contacts and leads.

```http
GET    /api/v1/contacts              # List contacts
POST   /api/v1/contacts              # Create contact
GET    /api/v1/contacts/{id}         # Get contact
PUT    /api/v1/contacts/{id}         # Update contact
DELETE /api/v1/contacts/{id}         # Delete contact
```

**Example: Create Contact**
```javascript
const createContact = async (contactData) => {
  const response = await fetch('/api/v1/contacts', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      data: {
        type: 'contact',
        attributes: {
          first_name: contactData.firstName,
          last_name: contactData.lastName,
          email: contactData.email,
          phone: contactData.phone,
          company: contactData.company,
          job_title: contactData.jobTitle,
          tags: contactData.tags
        }
      }
    })
  });
  
  return await response.json();
};
```

### Deals API
Manage sales opportunities and pipeline.

```http
GET    /api/v1/deals                 # List deals
POST   /api/v1/deals                 # Create deal
GET    /api/v1/deals/{id}            # Get deal
PUT    /api/v1/deals/{id}            # Update deal
DELETE /api/v1/deals/{id}            # Delete deal
```

**Example: Update Deal Stage**
```javascript
const updateDealStage = async (dealId, stage) => {
  const response = await fetch(`/api/v1/deals/${dealId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      data: {
        type: 'deal',
        id: dealId,
        attributes: {
          stage: stage,
          updated_at: new Date().toISOString()
        }
      }
    })
  });
  
  return await response.json();
};
```

### Tasks API
Manage tasks and activities.

```http
GET    /api/v1/tasks                 # List tasks
POST   /api/v1/tasks                 # Create task
GET    /api/v1/tasks/{id}            # Get task
PUT    /api/v1/tasks/{id}            # Update task
DELETE /api/v1/tasks/{id}            # Delete task
```

### Organizations API
Manage tenant organizations (multi-tenant).

```http
GET    /api/v1/organizations         # List organizations
POST   /api/v1/organizations         # Create organization
GET    /api/v1/organizations/{id}    # Get organization
PUT    /api/v1/organizations/{id}    # Update organization
```

### Users API
Manage user accounts and permissions.

```http
GET    /api/v1/users                 # List users
POST   /api/v1/users                 # Create user
GET    /api/v1/users/{id}            # Get user
PUT    /api/v1/users/{id}            # Update user
DELETE /api/v1/users/{id}            # Delete user
```

### Reports API
Generate and retrieve reports.

```http
GET    /api/v1/reports               # List available reports
POST   /api/v1/reports/generate      # Generate report
GET    /api/v1/reports/{id}          # Get report results
```

## 🔍 Filtering and Searching

### Query Parameters

**Filtering:**
```http
GET /api/v1/contacts?filter[company]=Acme Corp
GET /api/v1/deals?filter[stage]=qualified&filter[value_gte]=1000
```

**Search:**
```http
GET /api/v1/contacts?search=john.doe@example.com
GET /api/v1/deals?search=Acme Corp Marketing
```

**Sorting:**
```http
GET /api/v1/contacts?sort=last_name
GET /api/v1/deals?sort=-created_at  # Descending
```

**Pagination:**
```http
GET /api/v1/contacts?page=2&per_page=50
```

**Field Selection:**
```http
GET /api/v1/contacts?fields=id,first_name,last_name,email
```

**Including Relationships:**
```http
GET /api/v1/deals?include=contact,organization
```

### Advanced Filtering

**Date Ranges:**
```http
GET /api/v1/deals?filter[created_at_gte]=2024-01-01&filter[created_at_lt]=2024-02-01
```

**Multiple Values:**
```http
GET /api/v1/contacts?filter[stage]=qualified,negotiation,closed_won
```

**Text Search:**
```http
GET /api/v1/contacts?q=john&fields=first_name,last_name,email
```

## ⚡ Rate Limiting

API requests are rate-limited to ensure fair usage and system stability.

### Rate Limit Headers
```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999  
X-RateLimit-Reset: 1640995200
X-RateLimit-Window: 3600
```

### Rate Limit Tiers

| Tier | Requests/Hour | Burst Limit |
|------|---------------|-------------|
| Free | 100 | 10 |
| Basic | 1,000 | 50 |
| Pro | 5,000 | 100 |
| Enterprise | 50,000 | 500 |

### Handling Rate Limits
```javascript
const apiCall = async (url, options) => {
  const response = await fetch(url, options);
  
  if (response.status === 429) {
    const resetTime = response.headers.get('X-RateLimit-Reset');
    const waitTime = resetTime - Math.floor(Date.now() / 1000);
    
    console.log(`Rate limited. Waiting ${waitTime} seconds...`);
    await new Promise(resolve => setTimeout(resolve, waitTime * 1000));
    
    // Retry the request
    return apiCall(url, options);
  }
  
  return response;
};
```

## 🔔 Webhooks

DeelRx CRM supports webhooks for real-time event notifications.

### Supported Events

| Event | Description |
|-------|-------------|
| `contact.created` | New contact created |
| `contact.updated` | Contact information updated |
| `contact.deleted` | Contact deleted |
| `deal.created` | New deal created |
| `deal.updated` | Deal information updated |
| `deal.stage_changed` | Deal moved to different stage |
| `deal.closed` | Deal marked as won or lost |
| `task.created` | New task created |
| `task.completed` | Task marked as complete |
| `user.created` | New user added |

### Webhook Configuration

**Register Webhook Endpoint:**
```javascript
const registerWebhook = async () => {
  const response = await fetch('/api/v1/webhooks', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      data: {
        type: 'webhook',
        attributes: {
          url: 'https://yourapp.com/webhooks/deelrx',
          events: ['contact.created', 'deal.updated'],
          secret: 'your-webhook-secret'
        }
      }
    })
  });
  
  return await response.json();
};
```

### Webhook Payload
```json
{
  "id": "evt_123",
  "type": "contact.created",
  "data": {
    "id": "12345",
    "type": "contact",
    "attributes": {
      "first_name": "John",
      "last_name": "Doe",
      "email": "john.doe@example.com"
    }
  },
  "timestamp": "2024-12-01T10:00:00Z",
  "organization_id": "org_123"
}
```

### Webhook Security
```javascript
const crypto = require('crypto');

const verifyWebhook = (payload, signature, secret) => {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
    
  return crypto.timingSafeEqual(
    Buffer.from(signature, 'hex'),
    Buffer.from(expectedSignature, 'hex')
  );
};
```

## 📚 SDK and Libraries

### Official SDKs

**JavaScript/Node.js:**
```bash
npm install deelrx-crm-sdk
```

```javascript
import { DeelRxCRM } from 'deelrx-crm-sdk';

const crm = new DeelRxCRM({
  apiKey: 'your-api-key',
  baseUrl: 'https://deelrxcrm.app/api/v1'
});

// Create a contact
const contact = await crm.contacts.create({
  first_name: 'John',
  last_name: 'Doe',
  email: 'john.doe@example.com'
});

// List deals
const deals = await crm.deals.list({
  filter: { stage: 'qualified' },
  sort: '-created_at'
});
```

**Python:**
```bash
pip install deelrx-crm-python
```

```python
from deelrx_crm import DeelRxCRM

crm = DeelRxCRM(api_key='your-api-key')

# Create a contact
contact = crm.contacts.create({
    'first_name': 'John',
    'last_name': 'Doe', 
    'email': 'john.doe@example.com'
})

# List deals
deals = crm.deals.list(
    filter={'stage': 'qualified'},
    sort='-created_at'
)
```

### Community SDKs

- **PHP**: `composer require deelrx/crm-php-sdk`
- **Ruby**: `gem install deelrx-crm`
- **Go**: `go get github.com/deelrx/crm-go-sdk`

## 🐛 Error Handling

### HTTP Status Codes

| Code | Meaning | Description |
|------|---------|-------------|
| 200 | OK | Request successful |
| 201 | Created | Resource created successfully |
| 204 | No Content | Request successful, no content returned |
| 400 | Bad Request | Invalid request format or parameters |
| 401 | Unauthorized | Authentication required or invalid |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource not found |
| 409 | Conflict | Resource conflict (duplicate, etc.) |
| 422 | Unprocessable Entity | Validation errors |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server error |
| 503 | Service Unavailable | Service temporarily unavailable |

### Error Response Format
```json
{
  "errors": [
    {
      "id": "err_validation_001",
      "status": "422",
      "code": "REQUIRED_FIELD_MISSING",
      "title": "Validation Error",
      "detail": "The email field is required",
      "source": {
        "pointer": "/data/attributes/email",
        "parameter": "email"
      },
      "meta": {
        "field": "email",
        "constraint": "required"
      }
    }
  ],
  "meta": {
    "request_id": "req_abc123",
    "timestamp": "2024-12-01T10:00:00Z",
    "documentation_url": "https://docs.deelrxcrm.app/api/errors"
  }
}
```

### Error Handling Best Practices

```javascript
const handleApiResponse = async (response) => {
  if (!response.ok) {
    const errorData = await response.json();
    
    switch (response.status) {
      case 400:
        throw new Error(`Bad Request: ${errorData.errors[0].detail}`);
      case 401:
        // Refresh token or redirect to login
        await refreshAuthToken();
        break;
      case 403:
        throw new Error('Insufficient permissions');
      case 404:
        throw new Error('Resource not found');
      case 422:
        // Handle validation errors
        const validationErrors = errorData.errors.map(err => ({
          field: err.source.pointer,
          message: err.detail
        }));
        throw new ValidationError(validationErrors);
      case 429:
        // Handle rate limiting
        const retryAfter = response.headers.get('Retry-After');
        await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
        // Retry request
        break;
      default:
        throw new Error(`API Error: ${response.status}`);
    }
  }
  
  return await response.json();
};
```

## 🔄 API Versioning

### Version Strategy
- **Current Version**: v1
- **Versioning Method**: URL path (`/api/v1/`)
- **Backward Compatibility**: Maintained for 2 years minimum
- **Deprecation Notice**: 6 months minimum before removal

### Version Migration
```javascript
// Gradually migrate to new version
const apiClient = {
  v1: new DeelRxCRM({ baseUrl: '/api/v1' }),
  v2: new DeelRxCRM({ baseUrl: '/api/v2' })
};

// Use new version where available, fallback to v1
const getContact = async (id) => {
  try {
    return await apiClient.v2.contacts.get(id);
  } catch (error) {
    if (error.status === 404 && error.code === 'ENDPOINT_NOT_FOUND') {
      return await apiClient.v1.contacts.get(id);
    }
    throw error;
  }
};
```

## 📖 Additional Resources

### API Reference Links
- **[Authentication Guide](./authentication.md)** - Detailed authentication setup
- **[Endpoints Reference](./endpoints.md)** - Complete endpoint documentation  
- **[Webhooks Guide](./webhooks.md)** - Event-driven integration setup
- **[SDK Examples](./sdk-examples.md)** - Code examples for all SDKs
- **[Rate Limits](./rate-limits.md)** - Usage limits and optimization

### Developer Tools
- **API Explorer**: Interactive API testing tool
- **Postman Collection**: Pre-configured API requests
- **OpenAPI Spec**: Machine-readable API specification
- **Code Generators**: Auto-generate SDK code

### Support Resources
- **Developer Portal**: [developers.deelrxcrm.app](https://developers.deelrxcrm.app)
- **API Status Page**: [status.deelrxcrm.app](https://status.deelrxcrm.app)
- **Developer Community**: [community.deelrxcrm.app](https://community.deelrxcrm.app)
- **Email Support**: [api-support@deelrxcrm.app](mailto:api-support@deelrxcrm.app)

---

**Ready to get started?** Check out our [Quick Start Guide](./quickstart.md) or explore the [Complete API Reference](./endpoints.md).

*Last updated: December 2024*