// FiveM can start client scripts before the NUI host frame exists. A create
// message sent in that gap is discarded, so retry only while the browser has
// not reported DOM readiness. The manager ignores duplicate create messages.
export function retryBrowserCreateUntilReady(
  isFinished: () => boolean,
  resend: () => void,
  delays: readonly number[] = [1000, 2000, 4000, 8000],
): void {
  let attempt = 0;

  const scheduleNext = (): void => {
    if (attempt >= delays.length || isFinished()) return;
    const delay = delays[attempt++];
    setTimeout(() => {
      if (isFinished()) return;
      resend();
      scheduleNext();
    }, delay);
  };

  scheduleNext();
}
