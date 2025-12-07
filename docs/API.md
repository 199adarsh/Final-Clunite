# API Documentation

## Endpoints

### POST /api/upload

Upload images to Vercel Blob storage.

**Request:**
- Method: `POST`
- Content-Type: `multipart/form-data`
- Body: `file` (image file)

**Response:**
```json
{
  "url": "https://blob.vercel-storage.com/..."
}
```

**Example:**
```javascript
const formData = new FormData();
formData.append('file', imageFile);

const response = await fetch('/api/upload', {
  method: 'POST',
  body: formData
});

const { url } = await response.json();
```

---

### POST /api/send-club-pin

Send verification PIN to club email.

**Request:**
- Method: `POST`
- Content-Type: `application/json`
- Body:
```json
{
  "email": "club@college.edu",
  "clubName": "Tech Club",
  "pin": "12345678"
}
```

**Response:**
```json
{
  "success": true,
  "message": "PIN sent successfully"
}
```

**Error Response:**
```json
{
  "error": "Failed to send email"
}
```

## Authentication

All API routes use Supabase authentication. Include the session token in requests:

```javascript
const { data: { session } } = await supabase.auth.getSession();

fetch('/api/endpoint', {
  headers: {
    'Authorization': `Bearer ${session.access_token}`
  }
});
```
