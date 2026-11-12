const { act, render, screen } = require('@testing-library/react');
const React = require('react');

const SLOW_THRESHOLD_MS = 30000;

/**
 * Shows "slow" when creation takes longer than the threshold, then "created" once it completes.
 * Clears its own timer on completion and on unmount, so no timers should be left afterwards.
 */
function CreationRoute({ create }) {
  const [status, setStatus] = React.useState('creating');

  React.useEffect(() => {
    let isMounted = true;
    const slowTimer = setTimeout(() => setStatus('slow'), SLOW_THRESHOLD_MS);
    create()
      .then(({ complete }) => complete)
      .then(() => {
        clearTimeout(slowTimer);
        isMounted && setStatus('created');
      });
    return () => {
      isMounted = false;
      clearTimeout(slowTimer);
    };
  }, [create]);

  return React.createElement('p', null, status);
}

function createDeferred() {
  let resolve = () => {};
  const promise = new Promise((resolvePromise) => {
    resolve = resolvePromise;
  });
  return { promise, resolve };
}

async function renderSlowCreationThatCompletes() {
  const completion = createDeferred();
  const create = jest.fn().mockResolvedValue({ complete: completion.promise });
  render(React.createElement(CreationRoute, { create }));
  await act(async () => {
    await Promise.resolve();
  });
  act(() => {
    jest.advanceTimersByTime(SLOW_THRESHOLD_MS);
  });
  expect(screen.getByText('slow')).toBeTruthy();
  await act(async () => {
    completion.resolve();
    await completion.promise;
  });
  expect(screen.getByText('created')).toBeTruthy();
}

describe(`React ${React.version}: slow creation recovery leaves no timers`, () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  test('with default fake timers', async () => {
    jest.useFakeTimers();

    await renderSlowCreationThatCompletes();

    expect(jest.getTimerCount()).toBe(0);
  });

  test("with doNotFake: ['queueMicrotask', 'nextTick']", async () => {
    jest.useFakeTimers({ doNotFake: ['queueMicrotask', 'nextTick'] });

    await renderSlowCreationThatCompletes();

    expect(jest.getTimerCount()).toBe(0);
  });

  test('with legacyFakeTimers: true', async () => {
    jest.useFakeTimers({ legacyFakeTimers: true });

    await renderSlowCreationThatCompletes();

    expect(jest.getTimerCount()).toBe(0);
  });
});
