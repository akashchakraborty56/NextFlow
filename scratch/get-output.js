const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const result = await prisma.nodeExecution.findFirst({
    where: { nodeType: 'LLM', status: 'SUCCESS' },
    orderBy: { completedAt: 'desc' },
  });
  if (result) {
    console.log('=== LLM OUTPUT ===');
    console.log(JSON.stringify(result.outputs, null, 2));
  } else {
    console.log('No LLM execution found');
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
