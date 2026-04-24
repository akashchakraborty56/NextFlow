import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import { z } from 'zod';

type Params = { params: Promise<{ id: string }> };

const QuerySchema = z.object({
  limit: z.coerce.number().min(1).max(100).default(20),
  offset: z.coerce.number().min(0).default(0),
});

export async function GET(req: NextRequest, { params }: Params) {
  const user = await getAuthUser();
  const { id: workflowId } = await params;

  // Verify workflow ownership
  const workflow = await prisma.workflow.findUnique({
    where: { id: workflowId, userId: user.id },
    select: { id: true },
  });

  if (!workflow) {
    return NextResponse.json({ error: 'Workflow not found' }, { status: 404 });
  }

  const { searchParams } = new URL(req.url);
  const query = QuerySchema.safeParse({
    limit: searchParams.get('limit'),
    offset: searchParams.get('offset'),
  });

  if (!query.success) {
    return NextResponse.json({ error: 'Invalid query parameters', details: query.error.format() }, { status: 400 });
  }

  const { limit, offset } = query.data;

  const [executions, total] = await Promise.all([
    prisma.executionRun.findMany({
      where: { workflowId, userId: user.id },
      orderBy: { startedAt: 'desc' },
      take: limit,
      skip: offset,
      include: {
        nodeExecutions: {
          select: {
            id: true,
            workflowNodeId: true,
            nodeType: true,
            status: true,
            resolvedInputs: true,
            outputs: true,
            error: true,
            startedAt: true,
            completedAt: true,
            durationMs: true,
          },
        },
      },
    }),
    prisma.executionRun.count({
      where: { workflowId, userId: user.id },
    }),
  ]);

  return NextResponse.json({ executions, total });
}
