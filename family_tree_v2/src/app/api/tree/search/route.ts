import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userId = (session.user as any).id;

    try {
        const { query } = await req.json();
        if (!query || query.length < 3) {
            return NextResponse.json({ trees: [] });
        }

        const trees = await prisma.tree.findMany({
            where: {
                OR: [
                    { name: { contains: query, mode: 'insensitive' } },
                    { owner: { email: { contains: query, mode: 'insensitive' } } }
                ],
                // Don't show trees already owned by user
                NOT: { ownerId: userId }
            },
            include: {
                owner: { select: { email: true } },
                _count: { select: { persons: true } }
            },
            take: 10
        });

        return NextResponse.json({ trees });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
