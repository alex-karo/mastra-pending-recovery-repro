# Mastra pending task recovery reproduction

This example shows a background task recovery problem in `@mastra/core@1.79.0`.

## Run

Use Node.js 22.13.0 or later. The example was tested with Node.js 26.11.1 on macOS arm64.

```sh
npm ci
npm run repro
```

No API key, agent, LLM provider, or external service is required.

## Expected result

Both tasks complete, one at a time:

```text
[ 'completed', 'completed' ]
```

## Actual result

The first task completes. The second task stays pending:

```text
[ 'completed', 'pending' ]
```

The assertion fails and the process exits with code 1. This failure reproduces the bug.

## What the example tests

The script saves two pending tasks in `InMemoryStore` before it starts the background task manager. The manager uses `globalConcurrency: 1`.

This setup tests startup recovery from an existing storage state. It does not test persistence across process restarts. All steps run in one process.

## Possible cause

`recoverStaleTasks()` skips tasks when the concurrency limit is reached. It does not add these tasks to `localPendingTaskIds`.

After the active task completes, `drainPending()` checks this local set. It does not find the remaining saved task.
