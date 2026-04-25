import {
  textTask
} from "./chunk-BHDMR3AN.mjs";
import {
  uploadImageTask
} from "./chunk-OBWGT5UK.mjs";
import {
  uploadVideoTask
} from "./chunk-KLM55JOO.mjs";
import {
  cropImageTask
} from "./chunk-YOY3UNJN.mjs";
import {
  extractFrameTask
} from "./chunk-QA7N5TDR.mjs";
import "./chunk-BSAJI3GC.mjs";
import {
  llmTask
} from "./chunk-XFMBKXCH.mjs";
import {
  logger,
  task
} from "./chunk-ZPSUHUO6.mjs";
import "./chunk-3RZUX6AI.mjs";
import {
  __name,
  init_esm
} from "./chunk-GWEPR3K4.mjs";

// src/trigger/orchestrator.ts
init_esm();
import { PrismaClient } from "@prisma/client";
var prisma = new PrismaClient();
function hasCycle(nodes, edges) {
  const inDegree = /* @__PURE__ */ new Map();
  const adjacency = /* @__PURE__ */ new Map();
  for (const node of nodes) {
    inDegree.set(node.id, 0);
    adjacency.set(node.id, []);
  }
  for (const edge of edges) {
    inDegree.set(edge.targetNodeId, (inDegree.get(edge.targetNodeId) ?? 0) + 1);
    adjacency.get(edge.sourceNodeId)?.push(edge.targetNodeId);
  }
  const queue = [...inDegree.entries()].filter(([, d]) => d === 0).map(([id]) => id);
  let processed = 0;
  while (queue.length > 0) {
    const nodeId = queue.shift();
    processed++;
    for (const neighbor of adjacency.get(nodeId) ?? []) {
      inDegree.set(neighbor, (inDegree.get(neighbor) ?? 0) - 1);
      if (inDegree.get(neighbor) === 0) queue.push(neighbor);
    }
  }
  return processed !== nodes.length;
}
__name(hasCycle, "hasCycle");
var orchestratorTask = task({
  id: "workflow-orchestrator",
  maxDuration: 600,
  retry: {
    maxAttempts: 1
  },
  run: /* @__PURE__ */ __name(async (payload) => {
    try {
      logger.info("Orchestrator started", { ...payload });
      const executionRun = await prisma.executionRun.update({
        where: { id: payload.executionRunId },
        data: { status: "RUNNING" }
      });
      const workflow = await prisma.workflow.findUnique({
        where: { id: payload.workflowId },
        include: { nodes: true, edges: true }
      });
      if (!workflow) throw new Error("Workflow not found");
      if (hasCycle(workflow.nodes, workflow.edges)) {
        throw new Error("Workflow contains a cycle. Execution aborted.");
      }
      if (hasCycle(workflow.nodes, workflow.edges)) {
        const errorMsg = "Workflow contains a cycle. Execution aborted.";
        await prisma.executionRun.update({
          where: { id: payload.executionRunId },
          data: { status: "FAILED", error: errorMsg, completedAt: /* @__PURE__ */ new Date() }
        });
        throw new Error(errorMsg);
      }
      const allAdjacency = /* @__PURE__ */ new Map();
      for (const node of workflow.nodes) {
        allAdjacency.set(node.id, []);
      }
      for (const edge of workflow.edges) {
        allAdjacency.get(edge.sourceNodeId)?.push(edge.targetNodeId);
      }
      const validNodes = /* @__PURE__ */ new Set();
      if (executionRun.mode === "PARTIAL" && executionRun.startFromNodeId) {
        const dfs = /* @__PURE__ */ __name((id) => {
          validNodes.add(id);
          for (const next of allAdjacency.get(id) ?? []) dfs(next);
        }, "dfs");
        dfs(executionRun.startFromNodeId);
      } else if (executionRun.mode === "SINGLE_NODE" && executionRun.startFromNodeId) {
        validNodes.add(executionRun.startFromNodeId);
      } else {
        workflow.nodes.forEach((n) => validNodes.add(n.id));
      }
      const inDegree = /* @__PURE__ */ new Map();
      const adjacency = /* @__PURE__ */ new Map();
      const edgeMap = /* @__PURE__ */ new Map();
      for (const nodeId of validNodes) {
        inDegree.set(nodeId, 0);
        adjacency.set(nodeId, []);
      }
      for (const edge of workflow.edges) {
        if (!validNodes.has(edge.sourceNodeId) || !validNodes.has(edge.targetNodeId)) continue;
        inDegree.set(edge.targetNodeId, (inDegree.get(edge.targetNodeId) ?? 0) + 1);
        adjacency.get(edge.sourceNodeId)?.push(edge.targetNodeId);
        if (!edgeMap.has(edge.targetNodeId)) edgeMap.set(edge.targetNodeId, []);
        edgeMap.get(edge.targetNodeId).push({
          sourceHandle: edge.sourceHandle,
          targetHandle: edge.targetHandle,
          sourceNodeId: edge.sourceNodeId
        });
      }
      const levels = [];
      let queue = [...inDegree.entries()].filter(([, d]) => d === 0).map(([id]) => id);
      while (queue.length > 0) {
        levels.push([...queue]);
        const nextQueue = [];
        for (const nodeId of queue) {
          for (const neighbor of adjacency.get(nodeId) ?? []) {
            inDegree.set(neighbor, (inDegree.get(neighbor) ?? 0) - 1);
            if (inDegree.get(neighbor) === 0) nextQueue.push(neighbor);
          }
        }
        queue = nextQueue;
      }
      for (const node of workflow.nodes) {
        await prisma.nodeExecution.create({
          data: {
            executionRunId: payload.executionRunId,
            workflowNodeId: node.id,
            nodeType: node.nodeType,
            status: validNodes.has(node.id) ? "PENDING" : "SKIPPED"
          }
        });
      }
      const nodeOutputs = /* @__PURE__ */ new Map();
      let hasFailure = false;
      for (const level of levels) {
        if (hasFailure) {
          for (const nodeId of level) {
            await prisma.nodeExecution.updateMany({
              where: { executionRunId: payload.executionRunId, workflowNodeId: nodeId },
              data: { status: "SKIPPED" }
            });
          }
          continue;
        }
        const nodesToExecute = level.filter((id) => validNodes.has(id));
        for (const nodeId of nodesToExecute) {
          if (hasFailure) break;
          const node = workflow.nodes.find((n) => n.id === nodeId);
          const config = node.config;
          const inputs = node.inputs;
          const startedAt = /* @__PURE__ */ new Date();
          await prisma.nodeExecution.updateMany({
            where: { executionRunId: payload.executionRunId, workflowNodeId: nodeId },
            data: { status: "RUNNING", startedAt }
          });
          try {
            const resolvedInputs = {};
            for (const inp of inputs) {
              resolvedInputs[inp.key] = inp.value;
            }
            for (const edge of edgeMap.get(nodeId) ?? []) {
              const sourceOutputs = nodeOutputs.get(edge.sourceNodeId);
              if (sourceOutputs) {
                const sourceKey = edge.sourceHandle.replace("-out", "");
                const targetKey = edge.targetHandle.replace("-in", "").replace(/-/g, "_");
                for (const [key, value] of Object.entries(sourceOutputs)) {
                  if (key.toLowerCase().includes(sourceKey.toLowerCase())) {
                    if (targetKey === "images" || targetKey === "image") {
                      if (!Array.isArray(resolvedInputs["images"])) resolvedInputs["images"] = [];
                      resolvedInputs["images"].push(value);
                    } else {
                      resolvedInputs[targetKey] = value;
                    }
                  }
                }
              }
            }
            for (const inp of inputs) {
              const normalizedKey = inp.key.replace(/-/g, "_");
              if (!resolvedInputs[normalizedKey]) {
                resolvedInputs[normalizedKey] = inp.value;
              }
            }
            let outputs = {};
            switch (node.nodeType) {
              case "TEXT": {
                const result = await textTask.triggerAndWait({
                  text: config.text ?? ""
                });
                if (result.ok) {
                  outputs = result.output;
                } else {
                  throw new Error("Text task failed");
                }
                break;
              }
              case "UPLOAD_IMAGE": {
                const result = await uploadImageTask.triggerAndWait({
                  imageUrl: config.fileUrl ?? ""
                });
                if (result.ok) {
                  outputs = result.output;
                } else {
                  throw new Error("Upload image task failed");
                }
                break;
              }
              case "UPLOAD_VIDEO": {
                const result = await uploadVideoTask.triggerAndWait({
                  videoUrl: config.fileUrl ?? ""
                });
                if (result.ok) {
                  outputs = result.output;
                } else {
                  throw new Error("Upload video task failed");
                }
                break;
              }
              case "LLM": {
                const result = await llmTask.triggerAndWait({
                  system_prompt: resolvedInputs.system_prompt,
                  user_message: resolvedInputs.user_message ?? "",
                  images: Array.isArray(resolvedInputs.images) ? resolvedInputs.images : resolvedInputs.images ? [resolvedInputs.images] : [],
                  model: config.model ?? "gemini-1.5-flash",
                  temperature: config.temperature ?? 0.7
                });
                if (result.ok) {
                  outputs = result.output;
                } else {
                  throw new Error("LLM task failed");
                }
                break;
              }
              case "CROP_IMAGE": {
                const imageUrl = resolvedInputs.imageUrl ?? resolvedInputs.image ?? (Array.isArray(resolvedInputs.images) ? resolvedInputs.images[0] : "");
                const result = await cropImageTask.triggerAndWait({
                  imageUrl: imageUrl ?? "",
                  xPercent: config.xPercent ?? 0,
                  yPercent: config.yPercent ?? 0,
                  widthPercent: config.widthPercent ?? 100,
                  heightPercent: config.heightPercent ?? 100
                });
                if (result.ok) {
                  outputs = result.output;
                } else {
                  throw new Error("Crop task failed");
                }
                break;
              }
              case "EXTRACT_FRAME": {
                const videoUrl = resolvedInputs.videoUrl ?? resolvedInputs.video ?? (Array.isArray(resolvedInputs.videos) ? resolvedInputs.videos[0] : "");
                const result = await extractFrameTask.triggerAndWait({
                  videoUrl: videoUrl ?? "",
                  timestamp: config.timestamp ?? 0,
                  timestampMode: config.timestampMode ?? "seconds"
                });
                if (result.ok) {
                  outputs = result.output;
                } else {
                  throw new Error("Extract frame task failed");
                }
                break;
              }
            }
            const completedAt2 = /* @__PURE__ */ new Date();
            nodeOutputs.set(nodeId, outputs);
            await prisma.nodeExecution.updateMany({
              where: { executionRunId: payload.executionRunId, workflowNodeId: nodeId },
              data: {
                status: "SUCCESS",
                outputs,
                resolvedInputs,
                completedAt: completedAt2,
                durationMs: completedAt2.getTime() - startedAt.getTime()
              }
            });
          } catch (error) {
            const completedAt2 = /* @__PURE__ */ new Date();
            await prisma.nodeExecution.updateMany({
              where: { executionRunId: payload.executionRunId, workflowNodeId: nodeId },
              data: {
                status: "FAILED",
                error: error.message,
                completedAt: completedAt2,
                durationMs: completedAt2.getTime() - startedAt.getTime()
              }
            });
            hasFailure = true;
            logger.error("Node execution failed", { nodeId, reason: error.message });
          }
        }
      }
      const completedAt = /* @__PURE__ */ new Date();
      const startedAtRecord = await prisma.executionRun.findUnique({
        where: { id: payload.executionRunId },
        select: { startedAt: true }
      });
      const durationMs = startedAtRecord ? completedAt.getTime() - startedAtRecord.startedAt.getTime() : 0;
      if (!hasFailure) {
        await prisma.executionRun.update({
          where: { id: payload.executionRunId },
          data: {
            status: "SUCCESS",
            completedAt,
            durationMs
          }
        });
      } else {
        await prisma.executionRun.update({
          where: { id: payload.executionRunId },
          data: {
            status: "FAILED",
            completedAt,
            durationMs,
            error: "Workflow execution failed in one or more nodes"
          }
        });
      }
      logger.info("Orchestrator completed", { status: hasFailure ? "FAILED" : "SUCCESS" });
      if (hasFailure) {
        throw new Error("Workflow execution failed in one or more nodes");
      }
    } catch (error) {
      logger.error("Orchestrator error", { error: error.message });
      if (!error.message.includes("Workflow execution failed") && !error.message.includes("Workflow contains a cycle")) {
        await prisma.executionRun.update({
          where: { id: payload.executionRunId },
          data: { status: "FAILED", error: error.message, completedAt: /* @__PURE__ */ new Date() }
        });
      }
      throw error;
    }
  }, "run")
});
export {
  orchestratorTask
};
//# sourceMappingURL=orchestrator.mjs.map
