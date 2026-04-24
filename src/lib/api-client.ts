const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? '';

async function fetchAPI<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!res.ok) {
    const text = await res.text();
    let errorMsg = `API error: ${res.status}`;
    try {
      const json = JSON.parse(text);
      errorMsg = json.error ?? errorMsg;
    } catch {
      // Not JSON, use a snippet of the text
      errorMsg = `${errorMsg} - ${text.substring(0, 100)}`;
    }
    throw new Error(errorMsg);
  }

  return res.json();
}

export const api = {
  // Workflows
  listWorkflows: () => fetchAPI<any[]>('/api/workflows'),
  listTemplates: () => fetchAPI<any[]>('/api/workflows?template=true'),

  getWorkflow: (id: string) =>
    fetchAPI<any>(`/api/workflows/${id}`),

  createWorkflow: (data: { name: string; templateId?: string }) =>
    fetchAPI<any>('/api/workflows', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  saveWorkflow: (id: string, data: any) =>
    fetchAPI<any>(`/api/workflows/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteWorkflow: (id: string) =>
    fetchAPI<any>(`/api/workflows/${id}`, { method: 'DELETE' }),

  // Execution
  executeWorkflow: (
    workflowId: string,
    mode: 'full' | 'partial' | 'single_node' = 'full',
    fromNodeId?: string
  ) =>
    fetchAPI<{ executionId: string }>(`/api/workflows/${workflowId}/execute`, {
      method: 'POST',
      body: JSON.stringify({ mode, fromNodeId }),
    }),

  executeNode: (workflowId: string, nodeId: string) =>
    fetchAPI<{ executionId: string }>(`/api/workflows/${workflowId}/execute`, {
      method: 'POST',
      body: JSON.stringify({ mode: 'single_node', fromNodeId: nodeId }),
    }),

  cancelExecution: (executionId: string) =>
    fetchAPI<any>(`/api/executions/${executionId}/cancel`, {
      method: 'POST',
    }),

  getExecution: (executionId: string) =>
    fetchAPI<any>(`/api/executions/${executionId}`),

  // Executions
  listExecutions: (workflowId: string, limit?: number, offset?: number) =>
    fetchAPI<{ executions: any[]; total: number }>(
      `/api/workflows/${workflowId}/executions?limit=${limit ?? 20}&offset=${offset ?? 0}`
    ),

  // Transloadit
  getTransloaditParams: (type: 'image' | 'video') =>
    fetchAPI<{ params: string; signature: string }>(
      '/api/transloadit/params',
      { method: 'POST', body: JSON.stringify({ type }) }
    ),
};

