import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';

import { prisma } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import { z } from 'zod';

const CreateWorkflowSchema = z.object({
  name: z.string().min(1).max(100).default('Untitled Workflow'),
  description: z.string().max(500).optional(),
  templateId: z.string().optional(),
});

export async function GET(req: NextRequest) {
  console.log('[API] GET /api/workflows - Starting');
  const user = await getAuthUser();
  const { searchParams } = new URL(req.url);
  const isTemplate = searchParams.get('template') === 'true';

  const workflows = await prisma.workflow.findMany({
    where: isTemplate ? { isTemplate: true } : { userId: user.id },
    orderBy: { updatedAt: 'desc' },
    select: {
      id: true,
      name: true,
      description: true,
      updatedAt: true,
      isTemplate: true,
      _count: { select: { nodes: true, executionRuns: true } },
    },
  });

  return NextResponse.json(workflows);
}

export async function POST(req: NextRequest) {
  console.log('[API] POST /api/workflows - Starting');
  const user = await getAuthUser();
  const body = await req.json();
  const data = CreateWorkflowSchema.parse(body);

  if (data.templateId) {
    const template = await prisma.workflow.findUnique({
      where: { id: data.templateId },
      include: { nodes: true, edges: true },
    });

    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    const workflow = await prisma.$transaction(async (tx) => {
      const wf = await tx.workflow.create({
        data: {
          name: data.name,
          description: data.description ?? template.description,
          userId: user.id,
          canvasState: template.canvasState as any,
        },
      });

      const idMap = new Map<string, string>();
      for (const node of template.nodes) {
        const newNode = await tx.workflowNode.create({
          data: {
            workflowId: wf.id,
            nodeType: node.nodeType,
            label: node.label,
            positionX: node.positionX,
            positionY: node.positionY,
            inputs: node.inputs as any,
            outputs: node.outputs as any,
            config: node.config as any,
          },
        });
        idMap.set(node.id, newNode.id);
      }

      for (const edge of template.edges) {
        await tx.workflowEdge.create({
          data: {
            workflowId: wf.id,
            sourceNodeId: idMap.get(edge.sourceNodeId)!,
            targetNodeId: idMap.get(edge.targetNodeId)!,
            sourceHandle: edge.sourceHandle,
            targetHandle: edge.targetHandle,
          },
        });
      }

      return wf;
    });

    return NextResponse.json(workflow, { status: 201 });
  }

  const workflow = await prisma.workflow.create({
    data: { name: data.name, description: data.description, userId: user.id },
  });

  return NextResponse.json(workflow, { status: 201 });
}
