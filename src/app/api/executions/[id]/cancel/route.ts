import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

type Params = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  const user = await getAuthUser();
  const { id } = await params;

  const execution = await prisma.executionRun.findUnique({
    where: { id, userId: user.id },
  });

  if (!execution) {
    return NextResponse.json({ error: 'Execution not found' }, { status: 404 });
  }

  if (execution.status !== 'RUNNING' && execution.status !== 'PENDING') {
    return NextResponse.json({ error: 'Execution is not active' }, { status: 400 });
  }

  const updated = await prisma.executionRun.update({
    where: { id },
    data: { status: 'CANCELLED', completedAt: new Date() },
  });

  await prisma.nodeExecution.updateMany({
    where: { executionRunId: id, status: { in: ['PENDING', 'RUNNING'] } },
    data: { status: 'SKIPPED' },
  });

  return NextResponse.json(updated);
}

