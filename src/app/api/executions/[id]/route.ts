import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

type Params = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  const user = await getAuthUser();
  const { id } = await params;

  const execution = await prisma.executionRun.findUnique({
    where: { id, userId: user.id },
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
  });

  if (!execution) {
    return NextResponse.json({ error: 'Execution not found' }, { status: 404 });
  }

  return NextResponse.json(execution);
}
