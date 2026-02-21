import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import FamilyTreeDashboard from "@/components/dashboard/FamilyTreeDashboard";
import LandingPage from "./landing/page";

export const dynamic = "force-dynamic";

export default async function Home() {
  const session = await getServerSession(authOptions);

  if (!session) {
    return <LandingPage />;
  }

  const userId = (session.user as any).id;

  try {
    let tree = await prisma.tree.findFirst({
      where: { ownerId: userId },
      include: {
        persons: {
          where: { status: 'APPROVED' },
          include: {
            relationships1: { where: { status: 'APPROVED' }, include: { person1: true, person2: true } },
            relationships2: { where: { status: 'APPROVED' }, include: { person1: true, person2: true } },
          },
        },
      },
    });

    if (!tree) {
      tree = await prisma.tree.create({
        data: {
          ownerId: userId,
          name: "Моё семейное древо",
        },
        include: {
          persons: {
            where: { status: 'APPROVED' },
            include: {
              relationships1: { where: { status: 'APPROVED' }, include: { person1: true, person2: true } },
              relationships2: { where: { status: 'APPROVED' }, include: { person1: true, person2: true } },
            },
          },
        },
      });
    }

    const allPersons = tree?.persons || [];

    if (allPersons.length === 0) {
      return <LandingPage />;
    }

    // Extract unique relationships
    const relsMap = new Map();
    allPersons.forEach(p => {
      [...(p.relationships1 || []), ...(p.relationships2 || [])].forEach(r => {
        relsMap.set(r.id, r);
      });
    });

    return (
      <FamilyTreeDashboard
        initialPersons={allPersons}
        initialRelationships={Array.from(relsMap.values())}
        initialTree={tree}
      />
    );
  } catch (error) {
    console.error("Home Page Error:", error);
    redirect("/login");
  }
}
