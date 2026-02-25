import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userId = (session.user as any).id;
    const { searchParams } = new URL(req.url);
    const treeId = searchParams.get('treeId');

    if (!treeId) return NextResponse.json({ error: "treeId required" }, { status: 400 });

    try {
        const tree = await prisma.tree.findUnique({
            where: { id: treeId },
            select: { ownerId: true }
        });

        if (!tree || tree.ownerId !== userId) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const accessors = await prisma.treeAccess.findMany({
            where: { treeId },
            include: {
                user: {
                    select: {
                        id: true,
                        email: true
                    }
                }
            }
        });

        return NextResponse.json(accessors);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userId = (session.user as any).id;

    try {
        const { treeId, email, canEdit } = await req.json();

        const tree = await prisma.tree.findUnique({
            where: { id: treeId },
            select: { ownerId: true }
        });

        if (!tree || tree.ownerId !== userId) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const targetUser = await prisma.user.findUnique({
            where: { email }
        });

        if (!targetUser) {
            return NextResponse.json({ error: "Пользователь с таким email не найден" }, { status: 404 });
        }

        const access = await prisma.treeAccess.upsert({
            where: {
                treeId_userId: {
                    treeId,
                    userId: targetUser.id
                }
            },
            update: { canEdit },
            create: {
                treeId,
                userId: targetUser.id,
                canEdit
            }
        });

        return NextResponse.json(access);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userId = (session.user as any).id;

    try {
        const { treeId, targetUserId } = await req.json();

        const tree = await prisma.tree.findUnique({
            where: { id: treeId },
            select: { ownerId: true }
        });

        if (!tree || tree.ownerId !== userId) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        await prisma.treeAccess.delete({
            where: {
                treeId_userId: {
                    treeId,
                    userId: targetUserId
                }
            }
        });

        return NextResponse.json({ message: "Access removed" });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
