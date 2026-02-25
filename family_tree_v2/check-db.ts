import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const users = await prisma.user.count()
  const trees = await prisma.tree.count()
  const persons = await prisma.person.count()
  const relationships = await prisma.relationship.count()

  console.log({ users, trees, persons, relationships })

  const allTrees = await prisma.tree.findMany({
    include: {
        _count: {
            select: { persons: true }
        }
    }
  })
  console.log('Trees:', allTrees)
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
