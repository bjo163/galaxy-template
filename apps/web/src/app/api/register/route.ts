import { NextResponse } from 'next/server'

type RegistrationBody = {
  displayName?: unknown
  email?: unknown
  password?: unknown
}

export async function POST(request: Request) {
  let body: RegistrationBody

  try {
    body = (await request.json()) as RegistrationBody
  } catch {
    return NextResponse.json({ message: 'Please provide valid registration details.' }, { status: 400 })
  }

  const displayName = typeof body.displayName === 'string' ? body.displayName.trim() : ''
  const email = typeof body.email === 'string' ? body.email.trim() : ''
  const password = typeof body.password === 'string' ? body.password : ''

  if (!displayName || !email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || password.length < 12) {
    return NextResponse.json(
      { message: 'Enter your name, a valid email address, and a password with at least 12 characters.' },
      { status: 400 }
    )
  }

  const arsyApiUrl = process.env.ARSY_API_URL?.replace(/\/$/, '')

  if (!arsyApiUrl) {
    return NextResponse.json({ message: 'Account registration is not configured. Set ARSY_API_URL.' }, { status: 503 })
  }

  try {
    const response = await fetch(`${arsyApiUrl}/api/v1/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ displayName, email, password })
    })

    if (!response.ok) {
      const errorBody = (await response.json().catch(() => ({}))) as { message?: string; detail?: string }
      const message =
        response.status === 409
          ? 'An account with this email already exists. Try signing in instead.'
          : response.status === 400
            ? (errorBody.message ?? errorBody.detail ?? 'Please check your registration details.')
            : 'The Arsy registration service is unavailable. Try again shortly.'

      return NextResponse.json({ message }, { status: response.status === 409 ? 409 : response.status === 400 ? 400 : 502 })
    }

    const result = (await response.json()) as { account?: { id: string; email: string; displayName: string } }

    if (!result.account?.id || !result.account.email || !result.account.displayName) {
      return NextResponse.json({ message: 'Arsy returned an invalid registration response.' }, { status: 502 })
    }

    return NextResponse.json({ account: result.account }, { status: 201 })
  } catch {
    return NextResponse.json({ message: 'Could not reach the Arsy registration service. Check that it is running.' }, { status: 502 })
  }
}
