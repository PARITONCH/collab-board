export function throttle<Args extends unknown[]>(fn: (...args: Args) => void, wait: number) {
  let last = 0;
  let timer: ReturnType<typeof setTimeout> | null = null;
  let pending: Args | null = null;

  const run = (args: Args) => {
    last = Date.now();
    pending = null;
    fn(...args);
  };

  const throttled = (...args: Args) => {
    const remaining = wait - (Date.now() - last);
    if (remaining <= 0) {
      if (timer) clearTimeout(timer);
      timer = null;
      run(args);
      return;
    }
    pending = args;
    if (!timer) {
      timer = setTimeout(() => {
        timer = null;
        if (pending) run(pending);
      }, remaining);
    }
  };

  throttled.cancel = () => {
    if (timer) clearTimeout(timer);
    timer = null;
    pending = null;
  };

  return throttled;
}
