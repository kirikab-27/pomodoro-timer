import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // For now, fetching all sessions. In production, you'd want to filter by userId
    const sessions = await prisma.session.findMany({
      orderBy: {
        createdAt: 'desc'
      },
      take: 100, // Limit to last 100 sessions
    })

    return NextResponse.json({ sessions })
  } catch (error) {
    console.error('Error fetching sessions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch sessions' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, durationMinutes, startedAt, userId } = body

    // For demo purposes, create a default user if userId is not provided
    let actualUserId = userId
    if (!actualUserId) {
      const defaultUser = await prisma.user.findFirst({
        where: { email: 'demo@example.com' }
      })

      if (!defaultUser) {
        const newUser = await prisma.user.create({
          data: {
            email: 'demo@example.com',
            username: 'demo_user',
            displayName: 'Demo User'
          }
        })
        actualUserId = newUser.id
      } else {
        actualUserId = defaultUser.id
      }
    }

    const newSession = await prisma.session.create({
      data: {
        userId: actualUserId,
        type,
        durationMinutes: durationMinutes || 25,
        startedAt: startedAt ? new Date(startedAt) : new Date(),
        isCompleted: false,
      }
    })

    return NextResponse.json({ session: newSession }, { status: 201 })
  } catch (error) {
    console.error('Error creating session:', error)
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

    const updatedSession = await prisma.session.update({
      where: { id },
      data: {
        completedAt: completedAt ? new Date(completedAt) : undefined,
        isCompleted: isCompleted !== undefined ? isCompleted : undefined,
      }
    })

    return NextResponse.json({ session: updatedSession })
  } catch (error) {
    console.error('Error updating session:', error)
    return NextResponse.json(
      { error: 'Failed to update session' },
      { status: 500 }
    )
  }
}