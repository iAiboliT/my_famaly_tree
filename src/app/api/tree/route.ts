import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    let tree = await prisma.tree.findFirst({
        where: { ownerId: (session.user as any).id },
    });

    if (!tree) {
        tree = await prisma.tree.create({
            data: {
                ownerId: (session.user as any).id,
                name: "Моё семейное древо",
            },
        });
    }

    return NextResponse.json(tree);
}

export async function PATCH(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const { name } = await req.json();
        const tree = await prisma.tree.findFirst({
            where: { ownerId: (session.user as any).id },
        });

        if (!tree) return NextResponse.json({ error: "Not found" }, { status: 404 });

        const updated = await prisma.tree.update({
            where: { id: tree.id },
            data: { name },
        });

        return NextResponse.json(updated);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
