import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const origin = requestUrl.origin

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (error) {
      console.error('Error exchanging code for session:', error)
      // Redirect to home with error
      return NextResponse.redirect(`${origin}/?error=auth_failed`)
    }
    
    // Check if user has completed onboarding
    const { data: { user } } = await supabase.auth.getUser()
    
    if (user) {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('onboarded')
        .eq('id', user.id)
        .single()
      
      // If profile doesn't exist or not onboarded, send to home for onboarding
      if (profileError || !profile?.onboarded) {
        return NextResponse.redirect(`${origin}/`)
      }
      
      // User is fully set up, send to overview
      return NextResponse.redirect(`${origin}/overview`)
    }
  }

  // No code provided, redirect to home
  return NextResponse.redirect(`${origin}/`)
}

