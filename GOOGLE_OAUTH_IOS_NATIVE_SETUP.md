# Google OAuth Native Setup for iOS App

This guide explains how to properly configure Google OAuth for the iOS app using native authentication while keeping web OAuth working separately.

## What Changed?

The iOS app now uses `ASWebAuthenticationSession` (Apple's native OAuth flow) instead of opening Safari directly. This provides:
- ✅ Better user experience (in-app browser)
- ✅ Automatic return to app after authentication
- ✅ Separate from web OAuth configuration
- ✅ Works alongside web Google OAuth

## iOS App Implementation ✅

The following changes have been implemented:

1. **AuthService.swift**
   - Uses `ASWebAuthenticationSession` for native OAuth presentation
   - Handles OAuth callback automatically within the session
   - No longer requires URL handler in app delegate

2. **AuthView.swift**
   - Updated to provide window context for OAuth presentation
   - Better error handling

3. **aegisApp.swift**
   - Simplified (OAuth callback now handled internally)

4. **Info.plist**
   - URL scheme `davidjr.aegis` configured for OAuth callbacks

## Supabase Configuration

### Option 1: Use Same Google OAuth Client (Recommended)

You can use the same Google OAuth client for both web and iOS. The key is that the redirect URL is handled differently:

1. **Web**: Redirects to `https://ocwyjzrgxgpfwruobjfh.supabase.co/auth/v1/callback`
2. **iOS**: Redirects to `davidjr.aegis://login-callback`

Both can work with the same Google OAuth client because Supabase handles the routing.

#### Setup Steps:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Navigate to **APIs & Services** > **Credentials**
4. Select your existing OAuth 2.0 Client ID (or create one if you don't have it)
5. Under **Authorized redirect URIs**, make sure you have BOTH:
   ```
   https://ocwyjzrgxgpfwruobjfh.supabase.co/auth/v1/callback
   ```

6. In your Supabase Dashboard:
   - Go to **Authentication** > **Providers** > **Google**
   - Enable Google provider
   - Enter your **Client ID** and **Client Secret**
   - Save

That's it! Both web and iOS will use the same Google OAuth configuration.

### Option 2: Separate Google OAuth Clients (Advanced)

If you want completely separate configurations:

#### For Web:
1. Create OAuth Client ID as **Web application**
2. Add redirect URI: `https://ocwyjzrgxgpfwruobjfh.supabase.co/auth/v1/callback`

#### For iOS:
1. Create OAuth Client ID as **iOS**
2. Add your bundle identifier: `davidjr.aegis`
3. Configure in Supabase with the iOS client credentials

## How It Works

### Authentication Flow:

1. User taps "Continue with Google"
2. App creates `ASWebAuthenticationSession` with Supabase OAuth URL
3. System presents an in-app browser (secure authentication context)
4. User authenticates with Google
5. Google redirects to Supabase: `https://ocwyjzrgxgpfwruobjfh.supabase.co/auth/v1/callback`
6. Supabase processes OAuth and redirects to: `davidjr.aegis://login-callback?access_token=...`
7. `ASWebAuthenticationSession` captures the callback URL automatically
8. App extracts session and authenticates user
9. User is now signed in!

### Key Differences from Web:

- **Web**: Browser stays on web app domain
- **iOS**: App receives callback via URL scheme, then app opens
- Both use the same Supabase auth endpoint
- Supabase handles the redirect based on the `redirectTo` parameter

## Testing

1. Build and run the iOS app
2. Tap "Continue with Google"
3. An in-app browser will appear (not Safari)
4. Sign in with your Google account
5. Browser closes automatically
6. App shows authenticated state

## Troubleshooting

### Authentication session doesn't appear?

- Check that URL scheme `davidjr.aegis` is in Info.plist
- Verify the presentation anchor (window) is valid
- Check Xcode console for errors

### Returns to app but not authenticated?

- Verify Google OAuth is enabled in Supabase dashboard
- Check that Client ID and Client Secret are correct
- Ensure the redirect URI includes your Supabase callback URL
- Look for errors in Xcode console

### "Invalid redirect URL" error?

- Make sure Supabase callback URL is in Google Console authorized redirect URIs
- The format should be: `https://YOUR-PROJECT.supabase.co/auth/v1/callback`

### Web OAuth stopped working?

- Both redirect URIs should be in Google Console:
  - Supabase callback for both web and mobile
- Don't remove the web redirect URI when adding mobile support

## Session Persistence

The Supabase SDK automatically persists the session:
- Stored securely in iOS Keychain
- Survives app restarts
- Automatically refreshes tokens
- Cleared on sign out

## Security Notes

- `ASWebAuthenticationSession` provides secure authentication context
- Credentials never pass through your app
- Uses system browser cookies when appropriate (`prefersEphemeralWebBrowserSession = false`)
- URL scheme is protected by iOS (only your app can register it)

## Additional Resources

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Apple ASWebAuthenticationSession](https://developer.apple.com/documentation/authenticationservices/aswebauthenticationsession)
- [Google OAuth for iOS](https://developers.google.com/identity/protocols/oauth2/native-app)

