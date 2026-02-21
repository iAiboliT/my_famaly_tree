import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
async function main() {
    const persons = await prisma.person.findMany({
        select: { id: true, firstName: true, status: true, treeId: true, ownerId: true }
    })
    console.log(persons)
}
main().finally(() => prisma.$disconnect())
