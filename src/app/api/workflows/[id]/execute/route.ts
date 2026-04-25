import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import { tasks } from '@trigger.dev/sdk/v3';
import { z } from 'zod';

type Params = { params: Promise<{ id: string }> };

const ExecuteSchema = z.object({
  mode: z.enum(['FULL', 'PARTIAL', 'SINGLE_NODE']).default('FULL'),
  fromNodeId: z.string().optional(),
});

export async function POST(req: NextRequest, { params }: Params) {
  const user = await getAuthUser();
  const { id: workflowId } = await params;
  const body = await req.json();

  // Normalize mode to uppercase before validation
  const normalizedBody = {
    ...body,
    mode: body.mode?.toUpperCase?.(),
  };

  const parsed = ExecuteSchema.safeParse(normalizedBody);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid execution payload', details: parsed.error.format() }, { status: 400 });
  }

  const { mode, fromNodeId } = parsed.data;

  // Verify workflow ownership
  const workflow = await prisma.workflow.findUnique({
    where: { id: workflowId },
    select: { id: true, userId: true },
  });

  if (!workflow || workflow.userId !== user.id) {
    return NextResponse.json({ error: 'Workflow not found or access denied' }, { status: 404 });
  }

  // Create execution run
  const executionRun = await prisma.executionRun.create({
    data: {
      workflowId,
      userId: user.id,
      status: 'PENDING',
      mode: mode.toUpperCase() as any,
      startFromNodeId: fromNodeId,
    },
  });

  // Trigger orchestrator
  try {
    const handle = await tasks.trigger('workflow-orchestrator', {
      executionRunId: executionRun.id,
      workflowId,
    });

    await prisma.executionRun.update({
      where: { id: executionRun.id },
      data: { triggerRunId: handle.id },
    });
  } catch (error) {
    // If Trigger.dev is not configured, still return the execution ID
    console.error('Failed to trigger orchestrator:', error);
  }

  return NextResponse.json({ executionId: executionRun.id }, { status: 201 });
}
