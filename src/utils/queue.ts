type TaskData = {
  index: number;
  getTotal: () => number;
};
type Task<T> = (data: TaskData) => Promise<T>;

export const createTaskQueue = (concurrency = 1, onError?: (error: unknown) => void) => {
  let running = 0;
  let completed = 0;
  let total = 0;
  const queue: (() => void)[] = [];

  const next = () => {
    if (running >= concurrency) return;
    const job = queue.shift();
    job?.();
  };

  const add = <T2>(task: Task<T2>) => {
    total++;

    return new Promise<T2 | undefined>((resolve) => {
      const run = async () => {
        running++;
        try {
          const result = await task({ index: completed + 1, getTotal: () => total });
          completed++;
          resolve(result);
        } catch (err) {
          onError?.(err);
          resolve(undefined);
        } finally {
          running--;
          next();
        }
      };
      queue.push(run);
      next();
    });
  };

  return { add };
};
