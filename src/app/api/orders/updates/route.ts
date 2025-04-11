import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const responseStream = new TransformStream()
    const writer = responseStream.writable.getWriter()
    const encoder = new TextEncoder()

    // Set up SSE headers
    const response = new Response(responseStream.readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    })

    // Function to send updates
    const sendUpdate = async () => {
      const orders = await prisma.order.findMany({
        where: {
          userId: session.user.id,
        },
        select: {
          id: true,
          status: true,
          updatedAt: true,
        },
      })

      const data = encoder.encode(`data: ${JSON.stringify(orders)}\n\n`)
      await writer.write(data)
    }

    // Send initial update
    await sendUpdate()

    // Set up interval for periodic updates
    const interval = setInterval(sendUpdate, 30000) // Update every 30 seconds

    // Clean up on client disconnect
    req.signal.addEventListener("abort", () => {
      clearInterval(interval)
      writer.close()
    })

    return response
  } catch (error) {
    console.error("[ORDER_UPDATES_GET]", error)
    return new NextResponse("Internal error", { status: 500 })
  }
} 