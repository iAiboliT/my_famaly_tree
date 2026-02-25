import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import { Status, ActionType } from "@prisma/client";

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userId = (session.user as any).id;

    try {
        const { treeId } = await req.json();

        // Check if already has access
        const existing = await prisma.treeAccess.findFirst({
            where: { treeId, userId }
        });
        if (existing) return NextResponse.json({ message: "У вас уже есть доступ к этому дереву" });

        // Check if there is already a pending request
        // Since we don't have a specific ActionType for ACCESS, we'll use a specific targetModel convention
        const pending = await prisma.changeRequest.findFirst({
            where: {
                treeId,
                requesterId: userId,
                targetModel: "ACCESS_REQUEST",
                status: Status.PENDING
            }
        });

        if (pending) return NextResponse.json({ message: "Запрос уже отправлен и ожидает подтверждения" });

        // Create a change request that the owner can approve
        await prisma.changeRequest.create({
            data: {
                treeId,
                requesterId: userId,
                type: ActionType.UPDATE, // Generic "grant access" procedure
                targetModel: "ACCESS_REQUEST",
                targetId: userId, // Reusing ID to reference the requesting user
                data: { email: session.user.email },
                status: Status.PENDING
            }
        });

        return NextResponse.json({ message: "Запрос на доступ отправлен владельцу!" });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
