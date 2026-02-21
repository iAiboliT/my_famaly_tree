import { PrismaClient, Gender, Status } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('--- STARTING MANUAL DATA INSERTION ---')

    // 1. Get the target tree
    let tree = await prisma.tree.findFirst({
        where: { ownerId: 'admin-user-id' }
    })

    if (!tree) {
        tree = await prisma.tree.create({
            data: {
                id: 'default-tree-id',
                name: 'Родословная Ивановых',
                ownerId: 'admin-user-id',
            }
        })
    }

    const treeId = tree.id
    const ownerId = 'admin-user-id'

    const personsData = [
        {
            firstName: 'Александр',
            lastName: 'Верный',
            middleName: 'Сергеевич',
            gender: Gender.MALE,
            birthDate: new Date('1950-05-15'),
            deathDate: null,
            biography: 'Инженер-конструктор, любитель шахмат и классической музыки.',
            photos: ['https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400'],
            mainPhotoIndex: 0,
            positionX: 100,
            positionY: 100,
            status: Status.APPROVED,
        },
        {
            firstName: 'Елена',
            lastName: 'Верная',
            middleName: 'Николаевна',
            gender: Gender.FEMALE,
            birthDate: new Date('1955-08-22'),
            deathDate: null,
            biography: 'Учительница истории, коллекционирует антиквариат.',
            photos: ['https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400'],
            mainPhotoIndex: 0,
            positionX: 300,
            positionY: 100,
            status: Status.APPROVED,
        },
        {
            firstName: 'Михаил',
            lastName: 'Верный',
            middleName: 'Александрович',
            gender: Gender.MALE,
            birthDate: new Date('1982-11-10'),
            deathDate: null,
            biography: 'Программист, живет в Санкт-Петербурге, увлекается альпинизмом.',
            photos: ['https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400'],
            mainPhotoIndex: 0,
            positionX: 200,
            positionY: 350,
            status: Status.APPROVED,
        }
    ]

    console.log(`Inserting ${personsData.length} records into tree: ${treeId}`)

    for (const data of personsData) {
        const p = await prisma.person.create({
            data: {
                ...data,
                treeId,
                ownerId,
            }
        })
        console.log(`Created: ${p.firstName} ${p.lastName} (ID: ${p.id})`)
    }

    console.log('--- INSERTION COMPLETE ---')
}

main()
    .catch(e => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
