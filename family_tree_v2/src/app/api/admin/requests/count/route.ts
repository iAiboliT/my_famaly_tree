import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import { Status } from "@prisma/client";

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userId = (session.user as any).id;

    // Count pending requests for trees owned by user
    const count = await prisma.changeRequest.count({
        where: {
            tree: { ownerId: userId },
            status: Status.PENDING
        }
    });

    return NextResponse.json({ count });
}
