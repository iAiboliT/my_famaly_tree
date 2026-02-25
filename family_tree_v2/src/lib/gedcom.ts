
// Простая реализация генерации и парсинга GEDCOM для нужд проекта
// В будущем можно расширить за счет использования полноценных библиотек

export function generateGEDCOM(persons: any[], relationships: any[], treeName: string) {
    let ged = `0 HEAD
1 CHAR UTF-8
1 SOUR GenealogyOS
1 GEDC
2 VERS 5.5.1
2 FORM LINEAGE-LINKED
0 @T1@ SUBM
1 NAME Admin
0 @TREE1@ NOTE ${treeName}\n`;

    // 1. Сначала добавляем всех людей (INDI)
    persons.forEach((p) => {
        ged += `0 @I${p.id}@ INDI\n`;
        ged += `1 NAME ${p.firstName} /${p.lastName || ''}/\n`;
        ged += `1 GIVN ${p.firstName}\n`;
        ged += `1 SURN ${p.lastName || ''}\n`;
        ged += `1 SEX ${p.gender === 'MALE' ? 'M' : 'F'}\n`;

        if (p.birthDate) {
            const date = new Date(p.birthDate);
            ged += `1 BIRT\n2 DATE ${date.getDate()} ${getMonthName(date.getMonth())} ${date.getFullYear()}\n`;
        }
        if (p.deathDate) {
            const date = new Date(p.deathDate);
            ged += `1 DEAT\n2 DATE ${date.getDate()} ${getMonthName(date.getMonth())} ${date.getFullYear()}\n`;
        }
        if (p.biography) {
            ged += `1 NOTE ${p.biography.replace(/\n/g, ' ')}\n`;
        }
    });

    // 2. Добавляем семьи (FAM)
    // Группируем детей по родителям
    const families: { [key: string]: { husband?: string, wife?: string, children: string[] } } = {};

    relationships.forEach(r => {
        if (r.relationType === 'PARENT') {
            // person1: parent, person2: child
            const parent = persons.find(p => p.id === r.person1Id);
            const childId = r.person2Id;

            // Находим или создаем семью для этого родителя
            // Для простоты: если у ребенка один родитель, это отдельная семья
            // Если два - объединяем (позже можно усложнить)
            const familyKey = `FAM_${r.person1Id}`;
            if (!families[familyKey]) families[familyKey] = { children: [] };

            if (parent?.gender === 'MALE') families[familyKey].husband = r.person1Id;
            else families[familyKey].wife = r.person1Id;

            if (!families[familyKey].children.includes(childId)) {
                families[familyKey].children.push(childId);
            }
        }
    });

    Object.entries(families).forEach(([id, data], index) => {
        ged += `0 @F${index}@ FAM\n`;
        if (data.husband) ged += `1 HUSB @I${data.husband}@\n`;
        if (data.wife) ged += `1 WIFE @I${data.wife}@\n`;
        data.children.forEach(cId => {
            ged += `1 CHIL @I${cId}@\n`;
        });
    });

    ged += "0 TRLR";
    return ged;
}

function getMonthName(m: number) {
    const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
    return months[m];
}
