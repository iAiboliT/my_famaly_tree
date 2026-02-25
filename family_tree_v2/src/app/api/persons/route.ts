import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import { Gender, Status, ActionType } from "@prisma/client";
import { revalidatePath } from "next/cache";

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userId = (session.user as any).id;

    // Get trees user has access to or owns
    const accessedTrees = await prisma.treeAccess.findMany({
        where: { userId },
        select: { treeId: true }
    });
    const treeIds = accessedTrees.map(a => a.treeId);

    const persons = await prisma.person.findMany({
        where: {
            OR: [
                { ownerId: userId },
                { treeId: { in: treeIds } }
            ],
            status: Status.APPROVED // Only show approved by default
        },
        orderBy: { createdAt: 'asc' }
    });

    return NextResponse.json(persons);
}

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userId = (session.user as any).id;

    try {
        const body = await req.json();
        const {
            firstName, middleName, lastName,
            birthDate, deathDate,
            gender, biography,
            photos, mainPhotoIndex,
            treeId,
            positionX, positionY
        } = body;

        let targetTreeId = treeId;

        // Обработка строковых null/undefined из некоторых клиентов
        if (targetTreeId === "null" || targetTreeId === "undefined") targetTreeId = null;

        if (!targetTreeId) {
            let tree = await prisma.tree.findFirst({ where: { ownerId: userId } });
            if (!tree) {
                tree = await prisma.tree.create({ data: { ownerId: userId, name: "Моё семейное древо" } });
            }
            targetTreeId = tree.id;
        }

        const tree = await prisma.tree.findUnique({ where: { id: targetTreeId } });
        if (!tree) {
            return NextResponse.json({
                error: "Tree not found",
                details: `ID ${targetTreeId} не найден в базе данных.`
            }, { status: 404 });
        }

        const isOwner = tree.ownerId === userId;
        const status = isOwner ? Status.APPROVED : Status.PENDING;

        const parseSafeDate = (dateStr: string | null | undefined) => {
            if (!dateStr || dateStr.trim() === "") return null;
            const parsed = new Date(dateStr);
            if (isNaN(parsed.getTime())) return null;

            // Prisma/Postgres date range check (roughly 1000-9999)
            const year = parsed.getUTCFullYear();
            if (year < 1000 || year > 9999) return null;

            return parsed;
        };

        const person = await prisma.person.create({
            data: {
                firstName,
                middleName,
                lastName,
                birthDate: parseSafeDate(birthDate),
                deathDate: parseSafeDate(deathDate),
                gender: gender as Gender,
                biography,
                photos: photos || [],
                mainPhotoIndex: mainPhotoIndex || 0,
                positionX: positionX !== undefined ? positionX : (Math.random() * 200),
                positionY: positionY !== undefined ? positionY : (Math.random() * 200),
                ownerId: userId,
                treeId: targetTreeId,
                status,
                documents: body.documents ? {
                    create: body.documents.map((d: any) => ({
                        title: d.title,
                        url: d.url,
                        type: d.type || "Документ"
                    }))
                } : undefined,
            },
        });

        // If not owner, create a ChangeRequest
        if (!isOwner) {
            await prisma.changeRequest.create({
                data: {
                    type: ActionType.CREATE,
                    targetModel: "PERSON",
                    targetId: person.id,
                    data: body,
                    requesterId: userId,
                    treeId: targetTreeId,
                    status: Status.PENDING
                }
            });
        }

        revalidatePath("/");
        return NextResponse.json(person);
    } catch (error: any) {
        console.error("API POST PERSON ERROR:", error);
        return NextResponse.json({
            error: "Internal Server Error",
            message: error.message,
            details: error.stack // Для отладки в alert
        }, { status: 500 });
    }
}
