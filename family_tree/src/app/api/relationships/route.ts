import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import { RelationType, Status, ActionType } from "@prisma/client";

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userId = (session.user as any).id;

    try {
        const body = await req.json();
        const { person1Id, person2Id, relationType } = body;

        const person1 = await prisma.person.findUnique({ where: { id: person1Id }, include: { tree: true } });
        if (!person1) return NextResponse.json({ error: "Person not found" }, { status: 404 });

        const isOwner = person1.tree?.ownerId === userId;
        const targetStatus = isOwner ? Status.APPROVED : Status.PENDING;

        // Check if relationship already exists in any direction to avoid duplicates or conflicts
        const existing = await prisma.relationship.findFirst({
            where: {
                OR: [
                    { person1Id, person2Id, relationType: relationType as RelationType },
                    { person1Id: person2Id, person2Id: person1Id, relationType: relationType === 'PARENT' ? 'CHILD' : (relationType === 'CHILD' ? 'PARENT' : relationType) as RelationType }
                ]
            }
        });
        if (existing) {
            return NextResponse.json({ error: "Такая связь или её обратный эквивалент уже существует." }, { status: 400 });
        }

        // Validation for circular/conflicting relationships
        if (relationType === RelationType.PARENT) {
            const reverseParent = await prisma.relationship.findFirst({
                where: { person1Id: person2Id, person2Id: person1Id, relationType: RelationType.PARENT }
            });
            if (reverseParent) {
                return NextResponse.json({
                    error: "Ошибка иерархии: человек не может быть родителем собственного родителя. Обнаружена циклическая связь. Пожалуйста, проверьте существующую структуру семьи."
                }, { status: 400 });
            }
        }

        if (relationType === RelationType.CHILD) {
            const reverseChild = await prisma.relationship.findFirst({
                where: { person1Id: person2Id, person2Id: person1Id, relationType: RelationType.CHILD }
            });
            if (reverseChild) {
                return NextResponse.json({
                    error: "Ошибка иерархии: человек не может быть ребенком собственного ребенка. Нарушение логической иерархии."
                }, { status: 400 });
            }
        }

        const relationship = await prisma.relationship.create({
            data: {
                person1Id,
                person2Id,
                relationType: relationType as RelationType,
                status: targetStatus,
            },
        });

        if (!isOwner) {
            await prisma.changeRequest.create({
                data: {
                    type: ActionType.CREATE,
                    targetModel: "RELATIONSHIP",
                    targetId: relationship.id,
                    data: body,
                    requesterId: userId,
                    treeId: person1.treeId!,
                }
            });
        }

        return NextResponse.json(relationship);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userId = (session.user as any).id;

    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");
        if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

        const relationship = await prisma.relationship.findUnique({
            where: { id },
            include: { person1: { include: { tree: true } } }
        });

        if (!relationship) return NextResponse.json({ error: "Not found" }, { status: 404 });

        const isOwner = relationship.person1.tree?.ownerId === userId;

        if (isOwner) {
            await prisma.relationship.delete({ where: { id } });
            return NextResponse.json({ message: "Deleted" });
        } else {
            await prisma.changeRequest.create({
                data: {
                    type: ActionType.DELETE,
                    targetModel: "RELATIONSHIP",
                    targetId: id,
                    data: {},
                    requesterId: userId,
                    treeId: relationship.person1.treeId!,
                }
            });
            return NextResponse.json({ message: "Запрос на удаление отправлен на одобрение" });
        }
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
