import { PrismaClient } from '@prisma/client'
const p = new PrismaClient()
async function main() {
    const persons = await p.person.findMany({
        select: { id: true, firstName: true, treeId: true, status: true }
    })
    const trees = await p.tree.findMany()
    console.log('Trees:', trees)
    console.log('Persons:', persons)
}
main().finally(() => p.$disconnect())
