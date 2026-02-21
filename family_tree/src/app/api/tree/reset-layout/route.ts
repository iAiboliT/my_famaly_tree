import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userId = (session.user as any).id;

    try {
        const tree = await prisma.tree.findFirst({ where: { ownerId: userId } });
        if (!tree) return NextResponse.json({ error: "Tree not found" }, { status: 404 });

        // Reset positions for all persons in this tree
        await prisma.person.updateMany({
            where: { treeId: tree.id },
            data: {
                positionX: null,
                positionY: null,
            },
        });

        const { revalidatePath } = await import("next/cache");
        revalidatePath("/");

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error(error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
