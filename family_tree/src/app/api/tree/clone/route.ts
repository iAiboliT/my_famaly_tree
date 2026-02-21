import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const { treeId } = await req.json();
        const userId = (session.user as any).id;

        // Fetch source tree with all persons and relationships
        const sourceTree = await prisma.tree.findUnique({
            where: { id: treeId },
            include: {
                persons: {
                    include: {
                        relationships1: true,
                    }
                }
            }
        });

        if (!sourceTree) return NextResponse.json({ error: "Source tree not found" }, { status: 404 });

        // 1. Create new tree
        const newTree = await prisma.tree.create({
            data: {
                name: `${sourceTree.name} (Копия)`,
                ownerId: userId,
            }
        });

        // 2. Clone all persons
        const personMapping: Record<string, string> = {};
        const persons = await prisma.person.findMany({
            where: { treeId: sourceTree.id, status: 'APPROVED' }
        });

        for (const p of persons) {
            const newPerson = await prisma.person.create({
                data: {
                    firstName: p.firstName,
                    middleName: p.middleName,
                    lastName: p.lastName,
                    gender: p.gender,
                    birthDate: p.birthDate,
                    deathDate: p.deathDate,
                    biography: p.biography,
                    photos: p.photos,
                    mainPhotoIndex: p.mainPhotoIndex,
                    positionX: p.positionX,
                    positionY: p.positionY,
                    status: 'APPROVED',
                    treeId: newTree.id,
                    ownerId: userId,
                }
            });
            personMapping[p.id] = newPerson.id;
        }

        // 3. Clone all relationships
        const relationships = await prisma.relationship.findMany({
            where: {
                person1: { treeId: sourceTree.id },
                status: 'APPROVED'
            }
        });

        for (const r of relationships) {
            // Only clone if both persons are in our mapping
            if (personMapping[r.person1Id] && personMapping[r.person2Id]) {
                await prisma.relationship.create({
                    data: {
                        person1Id: personMapping[r.person1Id],
                        person2Id: personMapping[r.person2Id],
                        relationType: r.relationType,
                        status: 'APPROVED'
                    }
                });
            }
        }

        return NextResponse.json(newTree);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
