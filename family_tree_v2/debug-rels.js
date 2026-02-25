const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const rels = await prisma.relationship.findMany({
        include: {
            person1: true,
            person2: true
        }
    });

    console.log('--- RELATIONSHIPS ---');
    rels.forEach(r => {
        console.log(`ID: ${r.id} | ${r.person1.lastName} ${r.person1.firstName} --[${r.relationType}]--> ${r.person2.lastName} ${r.person2.firstName} (${r.status})`);
    });
}

main().catch(e => console.error(e)).finally(() => prisma.$disconnect());
