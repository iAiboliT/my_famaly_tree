import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import FamilyTreeDashboardNEW from "@/components/dashboard/FamilyTreeDashboardNEW";
import LandingPage from "./landing/page";


export const dynamic = "force-dynamic";

export default async function Home(props: { searchParams: Promise<{ treeId?: string }> }) {
  const searchParams = await props.searchParams;
  const session = await getServerSession(authOptions);

  if (!session) {
    return <LandingPage />;
  }

  const userId = (session.user as any).id;
  const { treeId } = searchParams;

  // If no treeId is provided in URL, always go to the tree list management page
  if (!treeId) {
    redirect("/trees");
  }

  try {
    const tree = await prisma.tree.findUnique({
      where: { id: treeId },
      include: {
        accessors: { where: { userId } }
      },
    });

    if (!tree || (tree.ownerId !== userId && tree.accessors.length === 0)) {
      redirect("/trees");
    }

    const [persons, relationships] = await Promise.all([
      prisma.person.findMany({
        where: { treeId: tree.id, status: 'APPROVED' }
      }),
      prisma.relationship.findMany({
        where: {
          status: 'APPROVED',
          person1: { treeId: tree.id },
          person2: { treeId: tree.id }
        }
      })
    ]);

    return (
      <FamilyTreeDashboardNEW
        initialPersons={persons}
        initialRelationships={relationships}
        initialTree={tree}
      />
    );
  } catch (error) {
    console.error("Home Page Error:", error);
    redirect("/trees");
  }
}
