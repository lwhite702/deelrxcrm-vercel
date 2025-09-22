# Dual Blob Storage Configuration

This document describes the implementation of dual blob storage using Vercel Blob, separating private and public file storage for enhanced security and access control.

## Overview

The system now supports two distinct blob storage configurations:

- **Private Store**: For sensitive documents, user data, private files
- **Public Store**: For public assets, downloadable resources, shared content

## Configuration

### Environment Variables

```bash
# Main Vercel Blob token (fallback)
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_...

# Optional: Separate tokens for private/public stores
BLOB_READ_WRITE_TOKEN_PRIVATE=vercel_blob_rw_...
BLOB_READ_WRITE_TOKEN_PUBLIC=vercel_blob_rw_...
```

If separate tokens are not provided, the system falls back to the main `BLOB_READ_WRITE_TOKEN`.

### File Storage Structure

```
private/
├── kb-files/
│   └── {teamId}/
│       └── {timestamp}-{random}.{ext}
├── user-uploads/
├── invoices/
└── legal-docs/

public/
├── kb-files/
│   └── {teamId}/
│       └── {timestamp}-{random}.{ext}
├── assets/
└── downloads/
```

## API Usage

### Basic File Upload

```typescript
import { uploadFileToBlob, BlobStoreType } from "@/lib/blob-utils";

const result = await uploadFileToBlob(file, {
  teamId: "123",
  filename: generateUniqueFilename(file.name, teamId),
  contentType: file.type,
  storeType: "private" // or "public"
});
```

### Smart Store Type Selection

```typescript
import { determineStoreType } from "@/lib/blob-utils";

const storeType = determineStoreType(file.type, "invoice"); // Returns "private"
const storeType2 = determineStoreType(file.type, "public-asset"); // Returns "public"
```

### File Management Operations

```typescript
// List files from specific store
const files = await listBlobFiles("kb-files/", "private");

// Delete file with store type
await deleteFileFromBlob(fileUrl, "private");

// Migrate file between stores
const result = await migrateFileBetweenStores(
  sourceUrl,
  "public",
  "private",
  "private/sensitive/newfile.pdf"
);
```

## Store Type Determination Logic

The `determineStoreType()` function automatically selects the appropriate store based on context:

| Context | Store Type | Reason |
|---------|------------|---------|
| `invoice` | private | Sensitive financial data |
| `receipt` | private | Sensitive financial data |
| `legal-doc` | private | Confidential legal documents |
| `user-upload` | private | Default security for user content |
| `kb-article` | public | Generally shareable content |
| `public-asset` | public | Explicitly public resources |

## API Endpoints

### Knowledge Base Uploads
- **POST** `/api/help/uploads`
- Supports both private and public storage
- Uses `context` parameter to determine store type
- Optional `isPublic` parameter to override

### Admin Blob Management
- **GET** `/api/admin/blob-management` - List files by store
- **POST** `/api/admin/blob-management` - Migrate files between stores
- **DELETE** `/api/admin/blob-management` - Delete files

## Security Considerations

1. **Private Store Access**: Private files require authentication and authorization
2. **Public Store Access**: Public files are directly accessible via URL
3. **Token Isolation**: Separate tokens prevent cross-store access vulnerabilities
4. **Path Prefixing**: Store type is enforced via path prefixes

## Migration from Single Store

Existing files can be migrated using the admin API:

```bash
# Migrate sensitive file to private store
curl -X POST /api/admin/blob-management \
  -H "Content-Type: application/json" \
  -d '{
    "sourceUrl": "https://blob.vercel-storage.com/public/old-invoice.pdf",
    "sourceStoreType": "public",
    "targetStoreType": "private",
    "newPath": "private/invoices/team-123/invoice-2024.pdf"
  }'
```

## Background Job Integration

The Inngest cleanup jobs automatically detect store type based on file path:

```typescript
// In cleanup job
const storeType: BlobStoreType = 
  upload.filename?.startsWith('private/') ? 'private' : 'public';
await deleteFileFromBlob(upload.storageUrl, storeType);
```

## Best Practices

1. **Default to Private**: When in doubt, use private storage for better security
2. **Validate Context**: Always provide meaningful context for store type determination
3. **Monitor Storage Usage**: Track usage across both stores for cost management
4. **Regular Audits**: Periodically review file classification and move as needed
5. **Backup Strategy**: Ensure both stores are included in backup procedures

## Troubleshooting

### Common Issues

1. **Token Mismatch**: Ensure correct token is used for each store type
2. **Path Conflicts**: Private and public prefixes prevent cross-store access
3. **Migration Failures**: Check source file accessibility and target permissions

### Debug Commands

```bash
# List files in private store
curl "/api/admin/blob-management?storeType=private&prefix=kb-files/"

# Check file accessibility
curl -I "https://blob.vercel-storage.com/private/file.pdf"
```

## Future Enhancements

1. **Signed URLs**: Implement temporary access URLs for private files
2. **Access Logging**: Track file access patterns and usage
3. **Automatic Classification**: ML-based file content analysis for store selection
4. **Batch Operations**: Bulk file migration and management tools
5. **Compliance Features**: GDPR/CCPA compliant file handling and deletion