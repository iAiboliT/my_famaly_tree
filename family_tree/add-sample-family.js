const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const bio = `Иван Иванович Иванов — выдающийся представитель своего рода. Он родился в небольшом городке и с самого детства проявлял интерес к истории своей семьи. Профессионально занимался архитектурой, что позволило ему спроектировать несколько знаковых зданий в родном городе. Иван всегда ценил семейные узы и старался сохранить каждую фотографию, каждую историю о своих предках. Его коллеги вспоминают его как человека невероятной честности и трудолюбия. В свободное время он увлекался садоводством, особенно любил выращивать вековые дубы, видя в них символ долголетия и крепости семейных корней. Его жизнь была наполнена смыслом и любовью к близким. Он оставил после себя огромное наследие в виде чертежей, мемуаров и прекрасного сада, который до сих пор радует его внуков и правнуков. Его биография — это пример того, как важно помнить свои корни и созидать для будущего.`;

async function main() {
    const admin = await prisma.user.findFirst({ where: { email: 'admin@example.com' } });
    if (!admin) throw new Error("Admin not found");

    const tree = await prisma.tree.findFirst({ where: { ownerId: admin.id } });
    if (!tree) throw new Error("Tree not found");

    const persons = [
        {
            firstName: "Иван", lastName: "Петров", gender: "MALE",
            photos: [
                "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=400",
                "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=400"
            ],
            mainPhotoIndex: 0,
            biography: bio,
            positionX: 100, positionY: 100
        },
        {
            firstName: "Анна", lastName: "Петрова", gender: "FEMALE",
            photos: [
                "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=400",
                "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=400"
            ],
            mainPhotoIndex: 0,
            biography: bio,
            positionX: 300, positionY: 100
        },
        {
            firstName: "Михаил", lastName: "Петров", gender: "MALE",
            photos: [
                "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=400"
            ],
            mainPhotoIndex: 0,
            biography: bio,
            positionX: 100, positionY: 300
        },
        {
            firstName: "Ольга", lastName: "Петрова", gender: "FEMALE",
            photos: [
                "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=400"
            ],
            mainPhotoIndex: 0,
            biography: bio,
            positionX: 300, positionY: 300
        }
    ];

    console.log("Creating persons...");
    const createdPersons = [];
    for (const p of persons) {
        const cp = await prisma.person.create({
            data: {
                ...p,
                ownerId: admin.id,
                treeId: tree.id,
                status: 'APPROVED'
            }
        });
        createdPersons.push(cp);
    }

    console.log("Creating relationships...");
    // Ivan & Anna -> Spouses
    await prisma.relationship.create({
        data: {
            person1Id: createdPersons[0].id,
            person2Id: createdPersons[1].id,
            relationType: 'SPOUSE',
            status: 'APPROVED'
        }
    });

    // Children
    await prisma.relationship.create({
        data: {
            person1Id: createdPersons[0].id,
            person2Id: createdPersons[2].id,
            relationType: 'PARENT',
            status: 'APPROVED'
        }
    });
    await prisma.relationship.create({
        data: {
            person1Id: createdPersons[0].id,
            person2Id: createdPersons[3].id,
            relationType: 'PARENT',
            status: 'APPROVED'
        }
    });

    console.log("Done! Added 4 persons and 3 relationships.");
}

main().catch(console.error).finally(() => prisma.$disconnect());
