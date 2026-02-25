import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import { generateGEDCOM } from "@/lib/gedcom";

export async function GET(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const treeId = searchParams.get('treeId');

    if (!treeId) return NextResponse.json({ error: "No tree ID" }, { status: 400 });

    try {
        const tree = await prisma.tree.findUnique({
            where: { id: treeId },
            include: {
                persons: { where: { status: 'APPROVED' } },
            }
        });

        if (!tree) return NextResponse.json({ error: "Tree not found" }, { status: 404 });

        const relationships = await prisma.relationship.findMany({
            where: {
                person1Id: { in: tree.persons.map(p => p.id) },
                status: 'APPROVED'
            }
        });

        const gedcom = generateGEDCOM(tree.persons, relationships, tree.name);

        return new Response(gedcom, {
            headers: {
                'Content-Type': 'text/plain; charset=utf-8',
                'Content-Disposition': `attachment; filename="${encodeURIComponent(tree.name)}.ged"`,
            },
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
