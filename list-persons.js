const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const persons = await prisma.person.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10
    });
    console.log(JSON.stringify(persons, null, 2));
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
