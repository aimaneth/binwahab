import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { BulkOperationType, BulkOperationStatus } from "@prisma/client";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const type = searchParams.get("type");

    const where: any = {};
    if (status) {
      where.status = status as BulkOperationStatus;
    }
    if (type) {
      where.type = type as BulkOperationType;
    }

    const operations = await prisma.bulkOperation.findMany({
      where,
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(operations);
  } catch (error) {
    console.error("[BULK_OPERATIONS_GET]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { type, data } = body;

    if (!type) {
      return new NextResponse("Operation type is required", { status: 400 });
    }

    const operation = await prisma.bulkOperation.create({
      data: {
        type: type as BulkOperationType,
        status: BulkOperationStatus.PENDING,
        data: data || null,
        createdBy: session.user.id,
      },
    });

    return NextResponse.json(operation);
  } catch (error) {
    console.error("[BULK_OPERATIONS_POST]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { id, status, result } = body;

    if (!id) {
      return new NextResponse("Operation ID is required", { status: 400 });
    }

    const operation = await prisma.bulkOperation.update({
      where: {
        id,
      },
      data: {
        status: status as BulkOperationStatus,
        result: result || null,
        completedAt: status === BulkOperationStatus.COMPLETED ? new Date() : null,
      },
    });

    return NextResponse.json(operation);
  } catch (error) {
    console.error("[BULK_OPERATIONS_PATCH]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
} 