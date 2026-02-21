import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import { Status, ActionType } from "@prisma/client";
import { revalidatePath } from "next/cache";

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userId = (session.user as any).id;

    const requests = await prisma.changeRequest.findMany({
        where: {
            tree: { ownerId: userId },
            status: Status.PENDING
        },
        include: {
            requester: { select: { email: true } },
            tree: { select: { name: true } }
        },
        orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(requests);
}

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userId = (session.user as any).id;

    try {
        const { requestId, approve } = await req.json();

        const request = await prisma.changeRequest.findUnique({
            where: { id: requestId },
            include: { tree: true }
        });

        if (!request) return NextResponse.json({ error: "Request not found" }, { status: 404 });
        if (request.tree.ownerId !== userId) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

        const parseSafeDate = (dateStr: string | null | undefined) => {
            if (!dateStr || (typeof dateStr === 'string' && dateStr.trim() === "")) return null;
            const parsed = new Date(dateStr);
            if (isNaN(parsed.getTime())) return null;
            const year = parsed.getUTCFullYear();
            if (year < 1000 || year > 9999) return null;
            return parsed;
        };

        if (!approve) {
            await prisma.changeRequest.update({
                where: { id: requestId },
                data: { status: Status.REJECTED }
            });
            // If it was a CREATE request, we might want to delete the pending object or mark it rejected
            if (request.type === ActionType.CREATE && request.targetId) {
                if (request.targetModel === "PERSON") {
                    await prisma.person.update({ where: { id: request.targetId }, data: { status: Status.REJECTED } });
                } else {
                    await prisma.relationship.update({ where: { id: request.targetId }, data: { status: Status.REJECTED } });
                }
            }
            return NextResponse.json({ message: "Rejected" });
        }

        // --- APPROVE LOGIC ---
        const data = request.data as any;

        if (request.targetModel === "PERSON") {
            if (request.type === ActionType.CREATE && request.targetId) {
                await prisma.person.update({
                    where: { id: request.targetId },
                    data: { status: Status.APPROVED }
                });
            } else if (request.type === ActionType.UPDATE && request.targetId) {
                await prisma.person.update({
                    where: { id: request.targetId },
                    data: {
                        ...data,
                        birthDate: parseSafeDate(data.birthDate),
                        deathDate: parseSafeDate(data.deathDate),
                    }
                });
            } else if (request.type === ActionType.DELETE && request.targetId) {
                await prisma.person.delete({ where: { id: request.targetId } });
            }
        } else if (request.targetModel === "RELATIONSHIP") {
            if (request.type === ActionType.CREATE && request.targetId) {
                await prisma.relationship.update({
                    where: { id: request.targetId },
                    data: { status: Status.APPROVED }
                });
            } else if (request.type === ActionType.DELETE && request.targetId) {
                await prisma.relationship.delete({ where: { id: request.targetId } });
            }
        }

        await prisma.changeRequest.update({
            where: { id: requestId },
            data: { status: Status.APPROVED }
        });

        revalidatePath("/");
        return NextResponse.json({ message: "Approved and Applied" });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
