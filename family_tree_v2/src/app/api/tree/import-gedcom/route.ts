import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
const gedcom = require('parse-gedcom');

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userId = (session.user as any).id;

    try {
        const { gedcomData, treeName } = await req.json();
        const parsed = gedcom.parse(gedcomData);

        // 1. Создаем новое дерево
        const tree = await prisma.tree.create({
            data: {
                name: treeName || "Импортированное дерево",
                ownerId: userId
            }
        });

        const individuals = parsed.filter((node: any) => node.tag === 'INDI');
        const families = parsed.filter((node: any) => node.tag === 'FAM');

        const gedIdToPrismaId: { [key: string]: string } = {};

        // 2. Импортируем людей
        for (const indi of individuals) {
            const gedId = indi.pointer;
            const nameNode = indi.tree.find((n: any) => n.tag === 'NAME');
            const sexNode = indi.tree.find((n: any) => n.tag === 'SEX');
            const birthNode = indi.tree.find((n: any) => n.tag === 'BIRT');
            const deathNode = indi.tree.find((n: any) => n.tag === 'DEAT');

            let firstName = "Без имени";
            let lastName = "";

            if (nameNode) {
                const fullValue = nameNode.data || "";
                const parts = fullValue.split('/');
                firstName = parts[0]?.trim() || "Без имени";
                lastName = parts[1]?.trim() || "";
            }

            const person = await prisma.person.create({
                data: {
                    firstName,
                    lastName,
                    gender: sexNode?.data === 'F' ? 'FEMALE' : 'MALE',
                    treeId: tree.id,
                    ownerId: userId,
                    positionX: Math.random() * 500,
                    positionY: Math.random() * 500,
                    status: 'APPROVED'
                }
            });

            gedIdToPrismaId[gedId] = person.id;
        }

        // 3. Импортируем связи из FAM
        for (const fam of families) {
            const husbandNode = fam.tree.find((n: any) => n.tag === 'HUSB');
            const wifeNode = fam.tree.find((n: any) => n.tag === 'WIFE');
            const childrenNodes = fam.tree.filter((n: any) => n.tag === 'CHIL');

            const hId = husbandNode ? gedIdToPrismaId[husbandNode.data] : null;
            const wId = wifeNode ? gedIdToPrismaId[wifeNode.data] : null;

            // Супруги
            if (hId && wId) {
                await prisma.relationship.upsert({
                    where: { person1Id_person2Id_relationType: { person1Id: hId, person2Id: wId, relationType: 'SPOUSE' } },
                    update: {},
                    create: { person1Id: hId, person2Id: wId, relationType: 'SPOUSE', status: 'APPROVED' }
                });
            }

            // Дети
            for (const childNode of childrenNodes) {
                const cId = gedIdToPrismaId[childNode.data];
                if (!cId) continue;

                if (hId) {
                    await prisma.relationship.create({
                        data: { person1Id: hId, person2Id: cId, relationType: 'PARENT', status: 'APPROVED' }
                    });
                }
                if (wId) {
                    await prisma.relationship.create({
                        data: { person1Id: wId, person2Id: cId, relationType: 'PARENT', status: 'APPROVED' }
                    });
                }
            }
        }

        return NextResponse.json({ success: true, treeId: tree.id });
    } catch (error: any) {
        console.error("IMPORT ERROR:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
