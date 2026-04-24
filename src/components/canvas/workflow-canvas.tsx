'use client';
import { useCallback, useRef, useState } from 'react';
import {
  ReactFlow, Background, BackgroundVariant, Controls, MiniMap,
  ReactFlowProvider, useReactFlow, applyNodeChanges, applyEdgeChanges,
  type NodeTypes, type EdgeTypes, type Connection,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useStore } from '@/store';
import { TextNode } from '@/components/nodes/text-node';
import { UploadImageNode } from '@/components/nodes/upload-image-node';
import { UploadVideoNode } from '@/components/nodes/upload-video-node';
import { LLMNode } from '@/components/nodes/llm-node';
import { CropImageNode } from '@/components/nodes/crop-image-node';
import { ExtractFrameNode } from '@/components/nodes/extract-frame-node';
import { CustomEdge } from './custom-edge';
import { NODE_REGISTRY } from '@/lib/node-registry';
import type { NodeType } from '@/types/nodes';

const nodeTypes: NodeTypes = {
  'text': TextNode,
  'upload-image': UploadImageNode,
  'upload-video': UploadVideoNode,
  'llm': LLMNode,
  'crop-image': CropImageNode,
  'extract-frame': ExtractFrameNode,
};

const edgeTypes: EdgeTypes = { default: CustomEdge };

function WorkflowCanvasInner() {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { screenToFlowPosition } = useReactFlow();
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; nodeId: string } | null>(null);

  const nodes = useStore((s) => s.nodes);
  const edges = useStore((s) => s.edges);
  const setNodes = useStore((s) => s.setNodes);
  const setEdges = useStore((s) => s.setEdges);
  const addNode = useStore((s) => s.addNode);
  const addEdgeAction = useStore((s) => s.addEdge);
  const isValidConnection = useStore((s) => s.isValidConnection);
  const selectNode = useStore((s) => s.selectNode);
  const removeNode = useStore((s) => s.removeNode);
  const executeNode = useStore((s) => s.executeNode);
  const executeWorkflow = useStore((s) => s.executeWorkflow);
  const isExecuting = useStore((s) => s.isExecuting);

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    const type = event.dataTransfer.getData('application/nextflow-node') as NodeType;
    if (!type || !NODE_REGISTRY[type]) return;
    const position = screenToFlowPosition({ x: event.clientX, y: event.clientY });
    addNode(type, position);
  }, [screenToFlowPosition, addNode]);

  const onConnect = useCallback((connection: Connection) => {
    addEdgeAction(connection);
  }, [addEdgeAction]);

  const onNodeClick = useCallback((_: React.MouseEvent, node: any) => {
    selectNode(node.id);
  }, [selectNode]);

  const onPaneClick = useCallback(() => {
    selectNode(null);
    setContextMenu(null);
  }, [selectNode]);

  const onNodesChange = useCallback((changes: any) => {
    const updated = applyNodeChanges(changes, nodes);
    setNodes(updated as any);
  }, [nodes, setNodes]);

  const onEdgesChange = useCallback((changes: any) => {
    const updated = applyEdgeChanges(changes, edges);
    setEdges(updated);
  }, [edges, setEdges]);

  const onNodeContextMenu = useCallback((event: React.MouseEvent, node: any) => {
    event.preventDefault();
    setContextMenu({ x: event.clientX, y: event.clientY, nodeId: node.id });
    selectNode(node.id);
  }, [selectNode]);

  const handleContextMenuAction = useCallback((action: 'runSingle' | 'runPartial' | 'delete') => {
    if (!contextMenu) return;
    const nodeId = contextMenu.nodeId;
    setContextMenu(null);

    switch (action) {
      case 'runSingle':
        if (!isExecuting) executeNode(nodeId);
        break;
      case 'runPartial':
        if (!isExecuting) executeWorkflow('partial', nodeId);
        break;
      case 'delete':
        removeNode(nodeId);
        selectNode(null);
        break;
    }
  }, [contextMenu, executeNode, executeWorkflow, removeNode, selectNode, isExecuting]);

  return (
    <div ref={reactFlowWrapper} className="h-full w-full relative">
      <ReactFlow
        nodes={nodes} edges={edges} nodeTypes={nodeTypes} edgeTypes={edgeTypes}
        onNodesChange={onNodesChange} onEdgesChange={onEdgesChange}
        onConnect={onConnect} onDrop={onDrop} onDragOver={onDragOver}
        onNodeClick={onNodeClick} onPaneClick={onPaneClick}
        onNodeContextMenu={onNodeContextMenu}
        isValidConnection={isValidConnection as any}
        fitView snapToGrid snapGrid={[16, 16]}
        deleteKeyCode={['Backspace', 'Delete']}
        className="bg-zinc-950"
        proOptions={{ hideAttribution: true }}
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="rgba(255,255,255,0.05)" />
        <Controls className="!bg-zinc-800 !border-zinc-700 !shadow-xl [&>button]:!bg-zinc-800 [&>button]:!border-zinc-700 [&>button]:!text-zinc-300 [&>button:hover]:!bg-zinc-700" position="bottom-right" />
        <MiniMap className="!bg-zinc-900 !border-zinc-700" maskColor="rgba(0,0,0,0.7)" position="bottom-right" />
      </ReactFlow>

      {contextMenu && (
        <div
          className="absolute z-50 bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl py-1 min-w-[140px]"
          style={{ top: contextMenu.y, left: contextMenu.x }}
        >
          <button
            onClick={() => handleContextMenuAction('runSingle')}
            disabled={isExecuting}
            className="w-full text-left px-3 py-1.5 text-xs text-zinc-200 hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            ⚡ Run Single
          </button>
          <button
            onClick={() => handleContextMenuAction('runPartial')}
            disabled={isExecuting}
            className="w-full text-left px-3 py-1.5 text-xs text-zinc-200 hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            ▶ Run Partial
          </button>
          <div className="border-t border-zinc-800 my-1" />
          <button
            onClick={() => handleContextMenuAction('delete')}
            className="w-full text-left px-3 py-1.5 text-xs text-red-400 hover:bg-red-500/10 transition-colors"
          >
            🗑 Delete Node
          </button>
        </div>
      )}
    </div>
  );
}

export function WorkflowCanvas() {
  return (
    <ReactFlowProvider>
      <WorkflowCanvasInner />
    </ReactFlowProvider>
  );
}

