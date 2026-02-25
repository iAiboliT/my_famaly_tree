import { PrismaClient, Gender, RelationType } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
    const passwordHash = await bcrypt.hash('password123', 10)

    const user = await prisma.user.upsert({
        where: { email: 'admin@example.com' },
        update: {},
        create: {
            id: 'admin-user-id',
            email: 'admin@example.com',
            passwordHash,
            role: 'ADMIN',
        },
    })

    // Create a Tree for the user
    const tree = await prisma.tree.upsert({
        where: { id: 'default-tree-id' }, // We can use a stable ID for seeding
        update: {},
        create: {
            id: 'default-tree-id',
            name: 'Родословная Ивановых',
            ownerId: user.id,
        }
    })

    const person1 = await prisma.person.create({
        data: {
            firstName: 'Иван',
            middleName: 'Иванович',
            lastName: 'Иванов',
            gender: Gender.MALE,
            birthDate: new Date('1950-01-01'),
            photos: [
                'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=800',
                'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=800'
            ],
            mainPhotoIndex: 0,
            ownerId: user.id,
            treeId: tree.id,
        },
    })

    const person2 = await prisma.person.create({
        data: {
            firstName: 'Мария',
            middleName: 'Петровна',
            lastName: 'Иванова',
            gender: Gender.FEMALE,
            birthDate: new Date('1955-05-15'),
            photos: [
                'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=800',
                'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=800'
            ],
            mainPhotoIndex: 0,
            ownerId: user.id,
            treeId: tree.id,
        },
    })

    const child = await prisma.person.create({
        data: {
            firstName: 'Петр',
            middleName: 'Иванович',
            lastName: 'Иванов',
            gender: Gender.MALE,
            birthDate: new Date('1980-10-20'),
            photos: [
                'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800'
            ],
            mainPhotoIndex: 0,
            ownerId: user.id,
            treeId: tree.id,
        },
    })

    // Create relationships
    await prisma.relationship.create({
        data: {
            person1Id: person1.id,
            person2Id: person2.id,
            relationType: RelationType.SPOUSE,
        },
    })

    await prisma.relationship.create({
        data: {
            person1Id: person1.id,
            person2Id: child.id,
            relationType: RelationType.PARENT,
        },
    })

    await prisma.relationship.create({
        data: {
            person1Id: person2.id,
            person2Id: child.id,
            relationType: RelationType.PARENT,
        },
    })

    console.log('Seed completed!')
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
