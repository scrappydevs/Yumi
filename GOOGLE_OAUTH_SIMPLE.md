# Google OAuth - Simple Implementation

This is a simplified implementation of Google OAuth for iOS that uses Safari for authentication.

## How It Works (Simple!)

### 1. User Taps "Continue with Google"
- App gets OAuth URL from Supabase
- Opens Safari with that URL

### 2. User Authenticates in Safari
- User signs in with Google
- Google redirects to Supabase
- Supabase processes authentication

### 3. Safari Redirects Back to App
- URL: `davidjr.aegis://login-callback?access_token=...`
- App captures the callback via `onOpenURL`
- App extracts the session and signs in

## Files Changed

### 1. AuthService.swift (Simplified!)
```swift
// Just get the URL
func signInWithGoogle() async throws -> URL {
    let redirectURL = URL(string: "davidjr.aegis://login-callback")!
    return try await client.auth.getOAuthSignInURL(
        provider: .google,
        redirectTo: redirectURL
    )
}

// Handle callback when returning from Safari
func handleOAuthCallback(url: URL) async throws {
    try await client.auth.session(from: url)
    await checkSession()
}
```

### 2. AuthView.swift
```swift
private func handleGoogleSignIn() {
    Task {
        let url = try await authService.signInWithGoogle()
        await UIApplication.shared.open(url) // Opens Safari
    }
}
```

### 3. aegisApp.swift
```swift
ContentView()
    .onOpenURL { url in
        Task {
            try await AuthService.shared.handleOAuthCallback(url: url)
        }
    }
```

### 4. Info.plist
```xml
<key>CFBundleURLTypes</key>
<array>
    <dict>
        <key>CFBundleURLSchemes</key>
        <array>
            <string>davidjr.aegis</string>
        </array>
    </dict>
</array>
```

## Advantages of This Approach

✅ **Simple** - No complex continuation handling
✅ **Reliable** - Uses standard Safari OAuth flow
✅ **No crashes** - No continuation misuse errors
✅ **Works with web** - Both web and mobile use same OAuth config
✅ **Proven pattern** - Standard iOS OAuth implementation

## Setup in Supabase

1. Go to **Authentication** → **Providers** → **Google**
2. Enable Google
3. Add your Client ID and Client Secret from Google Cloud Console
4. Done!

## Setup in Google Cloud Console

1. Go to **APIs & Services** → **Credentials**
2. Add authorized redirect URI:
   ```
   https://ocwyjzrgxgpfwruobjfh.supabase.co/auth/v1/callback
   ```
3. Done!

## Testing

1. Build and run the app
2. Tap "Continue with Google"
3. Safari opens with Google login
4. Sign in with Google
5. Safari says "Open in aegis?" → Tap Open
6. You're signed in! ✅

## Why This Works Better

The previous approach tried to use `ASWebAuthenticationSession` which required:
- Complex continuation handling
- Managing session lifecycle
- Handling multiple resume scenarios
- Presentation context providers

This simple approach:
- Just opens Safari
- Lets iOS handle the callback
- No continuations to manage
- No crashes!

## Troubleshooting

### "No active session" message?
This is normal when not logged in. It's just a debug print.

### Safari not redirecting back?
- Check that `davidjr.aegis` is in Info.plist
- Verify Google OAuth is enabled in Supabase
- Make sure the redirect URI is correct in Google Console

### Authentication works but session not saved?
The session is automatically saved by Supabase SDK. Just make sure `checkSession()` is called in `handleOAuthCallback()`.

