# Google OAuth Setup for iOS App

**⚠️ DEPRECATED: This guide has been superseded by GOOGLE_OAUTH_IOS_NATIVE_SETUP.md which provides a better native implementation.**

This guide explains how to configure Google OAuth for the Aegis iOS app using Supabase.

## iOS App Changes ✅

The following changes have been made to the iOS app:

1. **Info.plist** - Added URL scheme `davidjr.aegis` for OAuth callback
2. **AuthService.swift** - Added Google OAuth methods:
   - `signInWithGoogle()` - Initiates Google OAuth flow
   - `handleOAuthCallback(url:)` - Processes OAuth callback
3. **AuthView.swift** - Added "Continue with Google" button
4. **aegisApp.swift** - Added URL handler to process OAuth callbacks

## Supabase Configuration Required

You need to configure Google OAuth in your Supabase dashboard:

### Step 1: Create Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Navigate to **APIs & Services** > **Credentials**
4. Click **Create Credentials** > **OAuth client ID**
5. Select **Web application** as the application type
6. Configure:
   - **Authorized JavaScript origins**: Add your Supabase project URL
     ```
     https://ocwyjzrgxgpfwruobjfh.supabase.co
     ```
   - **Authorized redirect URIs**: Add your Supabase auth callback URL
     ```
     https://ocwyjzrgxgpfwruobjfh.supabase.co/auth/v1/callback
     ```
7. Click **Create** and save your **Client ID** and **Client Secret**

### Step 2: Configure Supabase

1. Go to your [Supabase Dashboard](https://app.supabase.com/)
2. Select your project
3. Navigate to **Authentication** > **Providers**
4. Find **Google** in the list and click to configure
5. Enable Google provider
6. Enter your Google OAuth credentials:
   - **Client ID**: Paste from Google Cloud Console
   - **Client Secret**: Paste from Google Cloud Console
7. In **Redirect URL**, add your iOS app URL scheme:
   ```
   davidjr.aegis://login-callback
   ```
8. Click **Save**

### Step 3: Test the Integration

1. Build and run the iOS app
2. Tap the "Continue with Google" button
3. Safari will open with Google's sign-in page
4. Complete the Google authentication
5. You'll be redirected back to the app automatically
6. The app will process the OAuth token and sign you in

## How It Works

1. User taps "Continue with Google" in the app
2. App calls `signInWithGoogle()` which gets an OAuth URL from Supabase
3. App opens Safari with the Google OAuth URL
4. User authenticates with Google
5. Google redirects to Supabase callback URL
6. Supabase processes the OAuth and redirects to `davidjr.aegis://login-callback`
7. iOS opens the app with the callback URL
8. App calls `handleOAuthCallback()` to extract the session
9. User is now authenticated

## Troubleshooting

### OAuth not working?

1. Verify your Google OAuth credentials in Supabase dashboard
2. Check that redirect URLs are correctly configured in Google Cloud Console
3. Ensure the URL scheme in Info.plist matches your redirect URL
4. Check Xcode console for error messages

### App not opening after OAuth?

1. Verify the URL scheme `davidjr.aegis` is in Info.plist
2. Make sure the redirect URL in Supabase matches: `davidjr.aegis://login-callback`
3. Try uninstalling and reinstalling the app

### Session not persisting?

- The Supabase client automatically handles session persistence
- Check that `checkSession()` is being called in AuthService init

## Additional Notes

- The current implementation uses the bundle identifier as the URL scheme
- You can customize the redirect URL if needed, but ensure it matches in both Info.plist and the AuthService
- Google OAuth requires the app to open Safari for authentication (Apple's requirement for OAuth flows)
- After successful authentication, the session is stored securely by Supabase and persists across app launches

