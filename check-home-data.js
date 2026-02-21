const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const userId = 'admin-user-id';
    let tree = await prisma.tree.findFirst({
        where: { ownerId: userId },
        include: {
            persons: {
                where: { status: 'APPROVED' },
                include: {
                    relationships1: { where: { status: 'APPROVED' }, include: { person1: true, person2: true } },
                    relationships2: { where: { status: 'APPROVED' }, include: { person1: true, person2: true } },
                },
            },
        },
    });

    if (!tree) {
        console.log("No tree found");
        return;
    }

    const allPersons = tree.persons || [];
    console.log(`Total persons found: ${allPersons.length}`);

    const relsMap = new Map();
    allPersons.forEach(p => {
        [...(p.relationships1 || []), ...(p.relationships2 || [])].forEach(r => {
            relsMap.set(r.id, r);
        });
    });
    console.log(`Total relationships found: ${relsMap.size}`);

    allPersons.forEach(p => {
        console.log(`- ${p.firstName} ${p.lastName} (${p.id}) POS: ${p.positionX}, ${p.positionY}`);
    });
}

main().catch(console.error).finally(() => prisma.$disconnect());
