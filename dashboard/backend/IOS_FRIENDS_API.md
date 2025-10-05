# iOS Friends API Endpoints

This document describes the friends management API endpoints for the iOS app.

## Endpoints

### 1. Get My Profile
```
GET /api/profiles/me
Authorization: Bearer {token}
```

Returns the current user's profile including:
- `id`: User UUID
- `username`: Username
- `display_name`: Display name (optional)
- `avatar_url`: Avatar URL (optional)
- `bio`: User bio (optional)
- `friends`: Array of friend UUIDs
- `preferences`: Taste preferences
- `created_at`, `updated_at`: Timestamps
- `phone`, `phone_verified`, `onboarded`: Phone/onboarding info

### 2. Get Friends List
```
GET /api/friends
Authorization: Bearer {token}
```

Returns array of friend profiles (excludes sensitive fields).

### 3. Search Users
```
GET /api/users/search?q={query}
Authorization: Bearer {token}
```

Search for users by username. Returns up to 20 matching profiles.

**Parameters:**
- `q` (required): Search query string

### 4. Add Friend
```
POST /api/friends/add
Authorization: Bearer {token}
Content-Type: application/json

{
  "friend_id": "uuid-of-friend"
}
```

Adds a user as a friend (mutual - both users become friends).

**Request Body:**
- `friend_id` (required): UUID of user to add as friend

**Returns:**
```json
{
  "message": "Friend added successfully",
  "status": "success"
}
```

### 5. Remove Friend
```
POST /api/friends/remove
Authorization: Bearer {token}
Content-Type: application/json

{
  "friend_id": "uuid-of-friend"
}
```

Removes a friend (mutual - removes friendship for both users).

**Request Body:**
- `friend_id` (required): UUID of user to remove as friend

**Returns:**
```json
{
  "message": "Friend removed successfully",
  "status": "success"
}
```

## Error Responses

All endpoints return standard HTTP error codes:

- `400 Bad Request`: Invalid request (e.g., trying to add yourself as friend)
- `401 Unauthorized`: Invalid or missing JWT token
- `404 Not Found`: Profile/user not found
- `500 Internal Server Error`: Server error

## Testing

1. **Start the backend:**
   ```bash
   cd dashboard/backend
   python main.py
   ```

2. **Test with curl:**
   ```bash
   # Get my profile
   curl -H "Authorization: Bearer YOUR_TOKEN" \
     http://localhost:8000/api/profiles/me
   
   # Search users
   curl -H "Authorization: Bearer YOUR_TOKEN" \
     "http://localhost:8000/api/users/search?q=john"
   
   # Get friends
   curl -H "Authorization: Bearer YOUR_TOKEN" \
     http://localhost:8000/api/friends
   
   # Add friend
   curl -X POST \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"friend_id": "uuid-here"}' \
     http://localhost:8000/api/friends/add
   ```

3. **View API docs:**
   - Open http://localhost:8000/docs in your browser
   - Look for the `profiles`, `friends`, and `users` sections

## iOS Integration

The iOS app (`FriendsViewModel.swift`) calls these endpoints automatically when you:
- Open the Friends tab → calls `/api/friends`
- Search for users → calls `/api/users/search?q=...`
- Tap "Add" button → calls `/api/friends/add`
- Tap "Remove" button → calls `/api/friends/remove`

## Database Schema

These endpoints work with the `profiles` table:
```sql
profiles (
  id uuid PRIMARY KEY,
  username text UNIQUE NOT NULL,
  display_name text,
  avatar_url text,
  bio text,
  friends uuid[] DEFAULT '{}',  -- Array of friend UUIDs
  preferences text,
  ...
)
```

The `friends` field is a PostgreSQL array that stores UUIDs of friends.
