import { PrismaClient, NodeType } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Find or create a system user for templates
  let systemUser = await prisma.user.findUnique({
    where: { email: 'system@nextflow.local' },
  });

  if (!systemUser) {
    systemUser = await prisma.user.create({
      data: {
        clerkId: 'system_user',
        email: 'system@nextflow.local',
        name: 'System',
      },
    });
  }

  // Check if template already exists
  const existing = await prisma.workflow.findFirst({
    where: { isTemplate: true, name: 'Product Marketing Kit Generator' },
  });

  if (existing) {
    console.log('Template already exists:', existing.id);
    return;
  }

  const workflow = await prisma.workflow.create({
    data: {
      name: 'Product Marketing Kit Generator',
      description: 'Sample workflow: Generate product marketing content from image + video inputs',
      userId: systemUser.id,
      isTemplate: true,
    },
  });

  const nodeSpacingX = 280;
  const nodeSpacingY = 160;

  const nodes = await prisma.workflowNode.createMany({
    data: [
      // Branch A — Image + Text → LLM
      {
        id: 'upload-image-node',
        workflowId: workflow.id,
        nodeType: NodeType.UPLOAD_IMAGE,
        label: 'Upload Image',
        positionX: 0,
        positionY: 0,
        inputs: [],
        outputs: [{ key: 'imageUrl', label: 'Image URL', type: 'image', handleId: 'image-out', value: null }],
        config: {},
      },
      {
        id: 'crop-image-node',
        workflowId: workflow.id,
        nodeType: NodeType.CROP_IMAGE,
        label: 'Crop Image',
        positionX: nodeSpacingX,
        positionY: 0,
        inputs: [{ key: 'imageUrl', label: 'Image', type: 'file-image', required: true, handleId: 'image-in', value: null, connected: false }],
        outputs: [{ key: 'croppedImageUrl', label: 'Cropped Image', type: 'image', handleId: 'image-out', value: null }],
        config: { xPercent: 10, yPercent: 10, widthPercent: 80, heightPercent: 80 },
      },
      {
        id: 'text-system-prompt',
        workflowId: workflow.id,
        nodeType: NodeType.TEXT,
        label: 'System Prompt',
        positionX: 0,
        positionY: nodeSpacingY,
        inputs: [],
        outputs: [{ key: 'text', label: 'Text', type: 'text', handleId: 'text-out', value: null }],
        config: { text: 'You are an expert product marketer. Write compelling, concise product descriptions.' },
      },
      {
        id: 'text-product-details',
        workflowId: workflow.id,
        nodeType: NodeType.TEXT,
        label: 'Product Details',
        positionX: 0,
        positionY: nodeSpacingY * 2,
        inputs: [],
        outputs: [{ key: 'text', label: 'Text', type: 'text', handleId: 'text-out', value: null }],
        config: { text: 'Premium wireless noise-canceling headphones with 30-hour battery life.' },
      },
      {
        id: 'llm-1',
        workflowId: workflow.id,
        nodeType: NodeType.LLM,
        label: 'LLM #1 — Product Description',
        positionX: nodeSpacingX * 2,
        positionY: nodeSpacingY,
        inputs: [
          { key: 'system_prompt', label: 'System Prompt', type: 'textarea', required: false, handleId: 'system-prompt-in', value: null, connected: false },
          { key: 'user_message', label: 'User Message', type: 'textarea', required: true, handleId: 'user-message-in', value: null, connected: false },
          { key: 'images', label: 'Images', type: 'file-image', required: false, handleId: 'image-in', value: null, connected: false },
        ],
        outputs: [{ key: 'generatedText', label: 'Generated Text', type: 'text', handleId: 'text-out', value: null }],
        config: { model: 'gemini-1.5-flash', temperature: 0.7 },
      },

      // Branch B — Video Processing
      {
        id: 'upload-video-node',
        workflowId: workflow.id,
        nodeType: NodeType.UPLOAD_VIDEO,
        label: 'Upload Video',
        positionX: 0,
        positionY: nodeSpacingY * 3.5,
        inputs: [],
        outputs: [{ key: 'videoUrl', label: 'Video URL', type: 'video', handleId: 'video-out', value: null }],
        config: {},
      },
      {
        id: 'extract-frame-node',
        workflowId: workflow.id,
        nodeType: NodeType.EXTRACT_FRAME,
        label: 'Extract Frame (50%)',
        positionX: nodeSpacingX,
        positionY: nodeSpacingY * 3.5,
        inputs: [{ key: 'videoUrl', label: 'Video', type: 'file-video', required: true, handleId: 'video-in', value: null, connected: false }],
        outputs: [{ key: 'frameImageUrl', label: 'Frame Image', type: 'image', handleId: 'image-out', value: null }],
        config: { timestamp: 50, timestampMode: 'percentage' },
      },

      // Convergence — Final LLM
      {
        id: 'llm-2',
        workflowId: workflow.id,
        nodeType: NodeType.LLM,
        label: 'LLM #2 — Marketing Post',
        positionX: nodeSpacingX * 3,
        positionY: nodeSpacingY * 1.75,
        inputs: [
          { key: 'system_prompt', label: 'System Prompt', type: 'textarea', required: false, handleId: 'system-prompt-in', value: null, connected: false },
          { key: 'user_message', label: 'User Message', type: 'textarea', required: true, handleId: 'user-message-in', value: null, connected: false },
          { key: 'images', label: 'Images', type: 'file-image', required: false, handleId: 'image-in', value: null, connected: false },
        ],
        outputs: [{ key: 'generatedText', label: 'Generated Text', type: 'text', handleId: 'text-out', value: null }],
        config: { model: 'gemini-1.5-flash', temperature: 0.8 },
      },
    ],
  });

  const edges = await prisma.workflowEdge.createMany({
    data: [
      // Branch A connections
      { workflowId: workflow.id, sourceNodeId: 'upload-image-node', targetNodeId: 'crop-image-node', sourceHandle: 'image-out', targetHandle: 'image-in' },
      { workflowId: workflow.id, sourceNodeId: 'text-system-prompt', targetNodeId: 'llm-1', sourceHandle: 'text-out', targetHandle: 'system-prompt-in' },
      { workflowId: workflow.id, sourceNodeId: 'text-product-details', targetNodeId: 'llm-1', sourceHandle: 'text-out', targetHandle: 'user-message-in' },
      { workflowId: workflow.id, sourceNodeId: 'crop-image-node', targetNodeId: 'llm-1', sourceHandle: 'image-out', targetHandle: 'image-in' },

      // Branch B connections
      { workflowId: workflow.id, sourceNodeId: 'upload-video-node', targetNodeId: 'extract-frame-node', sourceHandle: 'video-out', targetHandle: 'video-in' },

      // Convergence connections
      { workflowId: workflow.id, sourceNodeId: 'llm-1', targetNodeId: 'llm-2', sourceHandle: 'text-out', targetHandle: 'user-message-in' },
      { workflowId: workflow.id, sourceNodeId: 'crop-image-node', targetNodeId: 'llm-2', sourceHandle: 'image-out', targetHandle: 'image-in' },
      { workflowId: workflow.id, sourceNodeId: 'extract-frame-node', targetNodeId: 'llm-2', sourceHandle: 'image-out', targetHandle: 'image-in' },
    ],
  });

  console.log('Created Product Marketing Kit Generator template:', workflow.id);
  console.log('Nodes:', nodes.count, 'Edges:', edges.count);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

