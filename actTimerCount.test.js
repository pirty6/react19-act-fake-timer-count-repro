const { act, renderHook } = require('@testing-library/react');
const React = require('react');

function useValueSetByEffect() {
  const [value, setValue] = React.useState(0);
  React.useEffect(() => setValue(1), []);
  return value;
}

describe(`React ${React.version}: jest.getTimerCount() after async act()`, () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  test('sync act() leaves no pending fake timers', () => {
    jest.useFakeTimers();

    act(() => {});

    expect(jest.getTimerCount()).toBe(0);
  });

  test('async act() leaves no pending fake timers', async () => {
    jest.useFakeTimers();

    await act(async () => {});

    expect(jest.getTimerCount()).toBe(0);
  });

  test('render + unmount + async act() leaves no pending fake timers', async () => {
    jest.useFakeTimers();
    const { unmount } = renderHook(() => useValueSetByEffect());
    unmount();

    await act(async () => {
      await Promise.resolve();
    });

    expect(jest.getTimerCount()).toBe(0);
  });

  test('workaround: not faking queueMicrotask leaves no pending fake timers', async () => {
    jest.useFakeTimers({ doNotFake: ['queueMicrotask'] });

    await act(async () => {});

    expect(jest.getTimerCount()).toBe(0);
  });

  test('workaround: flushing faked microtasks with jest.runAllTicks() leaves no pending fake timers', async () => {
    jest.useFakeTimers();

    await act(async () => {});
    jest.runAllTicks();

    expect(jest.getTimerCount()).toBe(0);
  });
});
