const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const trees = await prisma.tree.findMany({
        include: { _count: { select: { persons: true } } }
    });
    console.log(JSON.stringify(trees, null, 2));
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
