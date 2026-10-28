import assert from 'node:assert/strict';
import { setTimeout as delay } from 'node:timers/promises';
import { Mastra } from '@mastra/core';
import { InMemoryStore } from '@mastra/core/storage';
import { createTool } from '@mastra/core/tools';

const storage = new InMemoryStore();
await storage.init();
const tasks = await storage.getStore('backgroundTasks');
for (const id of ['a', 'b']) {
  await tasks.createTask({
    id, status: 'pending', toolName: 'work', toolCallId: id,
    agentId: 'agent', runId: 'batch', args: {}, createdAt: new Date(),
    retryCount: 0, maxRetries: 0, timeoutMs: 10_000,
  });
}

const mastra = new Mastra({
  storage,
  tools: {
    work: createTool({
      id: 'work', description: 'Wait briefly.',
      execute: async () => { await delay(50); return 'done'; },
    }),
  },
  backgroundTasks: { enabled: true, globalConcurrency: 1 },
});
await mastra.backgroundTaskManager.init(mastra.pubsub);
await delay(1_000);
const { tasks: saved } = await tasks.listTasks({ runId: 'batch' });
const statuses = saved.map(task => task.status);
await mastra.shutdown();
console.log(statuses);
assert.deepEqual(statuses, ['completed', 'completed']);
