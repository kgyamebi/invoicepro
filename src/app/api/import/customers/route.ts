import { errorResponse, json } from "@/server/http";
import { prisma } from "@/server/db";
import { getActiveContext } from "@/server/tenant";

export async function POST(request: Request) {
  try {
    const context = await getActiveContext();
    const body = (await request.json()) as {
      rows: { name: string; email?: string; phone?: string; company?: string }[];
    };
    let created = 0;
    for (const row of body.rows) {
      if (!row.name) continue;
      await prisma.customer.create({
        data: {
          businessId: context.business.id,
          name: row.name,
          email: row.email,
          phone: row.phone,
          company: row.company,
        },
      });
      created += 1;
    }
    return json({ created });
  } catch (error) {
    return errorResponse(error);
  }
}
