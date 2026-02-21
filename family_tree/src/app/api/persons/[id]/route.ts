import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import { Gender, Status, ActionType } from "@prisma/client";
import { revalidatePath } from "next/cache";

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const person = await prisma.person.findUnique({
        where: { id },
        include: {
            relationships1: { where: { status: Status.APPROVED }, include: { person2: true } },
            relationships2: { where: { status: Status.APPROVED }, include: { person1: true } }
        }
    });

    if (!person) return NextResponse.json({ error: "Not found" }, { status: 404 });

    return NextResponse.json(person);
}

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userId = (session.user as any).id;

    try {
        const body = await req.json();
        const person = await prisma.person.findUnique({ where: { id }, include: { tree: true } });

        if (!person) return NextResponse.json({ error: "Not found" }, { status: 404 });

        const isOwner = person.tree?.ownerId === userId;

        const parseSafeDate = (dateStr: string | null | undefined) => {
            if (!dateStr || (typeof dateStr === 'string' && dateStr.trim() === "")) return null;
            const parsed = new Date(dateStr);
            if (isNaN(parsed.getTime())) return null;
            const year = parsed.getUTCFullYear();
            if (year < 1000 || year > 9999) return null;
            return parsed;
        };

        if (isOwner) {
            const updated = await prisma.person.update({
                where: { id },
                data: {
                    ...body,
                    birthDate: parseSafeDate(body.birthDate),
                    deathDate: parseSafeDate(body.deathDate),
                },
            });
            revalidatePath("/");
            return NextResponse.json(updated);
        } else {
            // Create Change Request instead of updating
            const request = await prisma.changeRequest.create({
                data: {
                    type: ActionType.UPDATE,
                    targetModel: "PERSON",
                    targetId: id,
                    data: body,
                    requesterId: userId,
                    treeId: person.treeId!,
                }
            });
            return NextResponse.json({ message: "Предложение об изменении отправлено на одобрение", requestId: request.id });
        }
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userId = (session.user as any).id;

    try {
        const person = await prisma.person.findUnique({ where: { id }, include: { tree: true } });
        if (!person) return NextResponse.json({ error: "Not found" }, { status: 404 });

        const isOwner = person.tree?.ownerId === userId;

        if (isOwner) {
            await prisma.person.delete({ where: { id } });
            revalidatePath("/");
            return NextResponse.json({ message: "Deleted" });
        } else {
            const request = await prisma.changeRequest.create({
                data: {
                    type: ActionType.DELETE,
                    targetModel: "PERSON",
                    targetId: id,
                    data: {},
                    requesterId: userId,
                    treeId: person.treeId!,
                }
            });
            return NextResponse.json({ message: "Запрос на удаление отправлен на одобрение", requestId: request.id });
        }
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
