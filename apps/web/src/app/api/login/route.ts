// Next Imports
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const arsyApiUrl = process.env.ARSY_API_URL?.replace(/\/$/, '')

  if (!arsyApiUrl) {
    return NextResponse.json({ message: ['Arsy authentication is not configured.'] }, { status: 503 })
  }

  try {
    const response = await fetch(`${arsyApiUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: await req.text()
    })

    const result = await response.json().catch(() => ({ message: ['Authentication failed.'] }))

    return NextResponse.json(result, { status: response.status })
  } catch {
    return NextResponse.json({ message: ['The Arsy authentication service could not be reached.'] }, { status: 502 })
  }
}
