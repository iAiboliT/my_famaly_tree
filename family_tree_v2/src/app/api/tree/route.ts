import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userId = (session.user as any).id;

    const ownedTrees = await prisma.tree.findMany({
        where: { ownerId: userId },
        include: {
            _count: { select: { persons: true } }
        }
    });

    const sharedTrees = await prisma.treeAccess.findMany({
        where: { userId },
        include: {
            tree: {
                include: {
                    _count: { select: { persons: true } }
                }
            }
        }
    });

    return NextResponse.json({
        owned: ownedTrees,
        shared: sharedTrees.map(s => ({ ...s.tree, canEdit: s.canEdit }))
    });
}

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userId = (session.user as any).id;

    try {
        const { name } = await req.json();
        const tree = await prisma.tree.create({
            data: {
                ownerId: userId,
                name: name || "Новое семейное древо",
            },
        });
        return NextResponse.json(tree);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PATCH(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userId = (session.user as any).id;
    const { searchParams } = new URL(req.url);
    const treeId = searchParams.get("treeId");

    if (!treeId) return NextResponse.json({ error: "Tree ID required" }, { status: 400 });

    try {
        const { name } = await req.json();

        const tree = await prisma.tree.findFirst({
            where: { id: treeId, ownerId: userId }
        });

        if (!tree) return NextResponse.json({ error: "Tree not found or access denied" }, { status: 404 });

        const updated = await prisma.tree.update({
            where: { id: tree.id },
            data: { name },
        });

        return NextResponse.json(updated);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
export async function DELETE(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userId = (session.user as any).id;
    const { searchParams } = new URL(req.url);
    const treeId = searchParams.get("treeId");

    if (!treeId) return NextResponse.json({ error: "Tree ID required" }, { status: 400 });

    try {
        const tree = await prisma.tree.findFirst({
            where: { id: treeId, ownerId: userId }
        });

        if (!tree) return NextResponse.json({ error: "Tree not found or access denied" }, { status: 404 });

        await prisma.tree.delete({
            where: { id: treeId }
        });

        return NextResponse.json({ message: "Tree deleted successfuly" });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
