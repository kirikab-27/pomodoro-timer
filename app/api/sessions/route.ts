import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  try {
    const mockSessions = [
      {
        id: '1',
        type: 'work',
        duration: 25,
        completedAt: new Date().toISOString(),
        isCompleted: true,
      },
      {
        id: '2',
        type: 'shortBreak',
        duration: 5,
        completedAt: new Date().toISOString(),
        isCompleted: true,
      },
    ]

    return NextResponse.json({ sessions: mockSessions })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch sessions' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, duration, startedAt } = body

    const newSession = {
      id: Date.now().toString(),
      type,
      duration,
      startedAt,
      completedAt: null,
      isCompleted: false,
    }

    return NextResponse.json({ session: newSession }, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create session' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, completedAt, isCompleted } = body

    const updatedSession = {
      id,
      completedAt,
      isCompleted,
    }

    return NextResponse.json({ session: updatedSession })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update session' },
      { status: 500 }
    )
  }
}