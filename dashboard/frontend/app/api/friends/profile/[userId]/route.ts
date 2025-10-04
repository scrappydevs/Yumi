import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    
    // Get current_user_id from query params if provided
    const searchParams = request.nextUrl.searchParams;
    const currentUserId = searchParams.get('current_user_id');
    
    // Fetch user profile and preferences from backend
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
    const url = currentUserId 
      ? `${backendUrl}/api/friends/profile/${userId}?current_user_id=${currentUserId}`
      : `${backendUrl}/api/friends/profile/${userId}`;
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Backend error:', errorText);
      return NextResponse.json(
        { error: 'Failed to fetch user profile' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

