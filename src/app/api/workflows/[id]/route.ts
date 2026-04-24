import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import { z } from 'zod';

type Params = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  const user = await getAuthUser();
  const { id } = await params;

  const workflow = await prisma.workflow.findUnique({
    where: { id, userId: user.id },
    include: {
      nodes: { orderBy: { createdAt: 'asc' } },
      edges: true,
    },
  });

  if (!workflow) {
    return NextResponse.json({ error: 'Workflow not found' }, { status: 404 });
  }

  return NextResponse.json(workflow);
}

const UpdateWorkflowSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  canvasState: z.any().optional(),
  nodes: z.array(z.any()).optional(),
  edges: z.array(z.any()).optional(),
});

export async function PUT(req: NextRequest, { params }: Params) {
  const user = await getAuthUser();
  const { id } = await params;
  const body = await req.json();

  const parsed = UpdateWorkflowSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid workflow data', details: parsed.error.format() }, { status: 400 });
  }

  const { name, description, canvasState, nodes, edges } = parsed.data;

  await prisma.$transaction(async (tx) => {
    await tx.workflow.update({
      where: { id, userId: user.id },
      data: { name, description, canvasState },
    });

    await tx.workflowEdge.deleteMany({ where: { workflowId: id } });
    await tx.workflowNode.deleteMany({ where: { workflowId: id } });

    if (nodes?.length) {
      await tx.workflowNode.createMany({
        data: nodes.map((n: any) => ({
          id: n.id,
          workflowId: id,
          nodeType: (n.data?.type ?? n.type ?? '').toUpperCase().replace('-', '_'),
          label: n.data?.label ?? 'Node',
          positionX: n.position?.x ?? 0,
          positionY: n.position?.y ?? 0,
          inputs: n.data?.inputs ?? [],
          outputs: n.data?.outputs ?? [],
          config: n.data?.config ?? {},
        })),
      });
    }

    if (edges?.length) {
      await tx.workflowEdge.createMany({
        data: edges.map((e: any) => ({
          id: e.id,
          workflowId: id,
          sourceNodeId: e.source,
          targetNodeId: e.target,
          sourceHandle: e.sourceHandle,
          targetHandle: e.targetHandle,
        })),
      });
    }
  });

  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const user = await getAuthUser();
  const { id } = await params;

  await prisma.workflow.delete({ where: { id, userId: user.id } });

  return NextResponse.json({ success: true });
}
