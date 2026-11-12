# React 19 `act(async)` leaves a pending fake timer

Minimal reproduction: on React 19, `await act(async () => {})` leaves one
pending entry that `jest.getTimerCount()` counts under Jest's default fake
timers. React 18 leaves none.

Tests that assert `expect(jest.getTimerCount()).toBe(0)` to check for timer
leaks therefore fail after upgrading to React 19, even when the component
under test cleans up correctly.

## Run

```bash
npm install
npm test               # both React versions
npm run test:react19   # 2 failures: Expected 0, Received 1
npm run test:react18   # all pass
```

| Test | React 18.3.1 | React 19.2.0 |
| --- | --- | --- |
| sync `act()` | 0 | 0 |
| `await act(async () => {})` | 0 | **1** |
| render + unmount + `await act(async)` | 0 | **1** |
| fix: `doNotFake: ['queueMicrotask']` | 0 | 0 |
| fix: `jest.runAllTicks()` before counting | 0 | 0 |

Versions: Jest 30, jest-environment-jsdom 30, @testing-library/react 16.3.0.

## Cause

React 19's async `act()` queues a nested microtask that warns if the test
forgot to `await` the `act` call
([`ReactAct.js`](https://github.com/facebook/react/blob/v19.2.0/packages/react/src/ReactAct.js#L361-L366)):

```js
const queueSeveralMicrotasks =
  typeof queueMicrotask === 'function'
    ? (callback) => {
        queueMicrotask(() => queueMicrotask(callback));
      }
    : queueMacrotask;
```

Jest's modern fake timers fake `queueMicrotask` by default, so those
microtasks sit in the fake clock's queue and `jest.getTimerCount()` includes
them. React 18's `act()` never calls `queueMicrotask`.

This is a development-only warning check, not a leak in the component under
test.

## Workarounds

Either leave `queueMicrotask` real:

```js
jest.useFakeTimers({ doNotFake: ['queueMicrotask'] });
```

Or flush faked microtasks before counting:

```js
await act(async () => {});
jest.runAllTicks();
expect(jest.getTimerCount()).toBe(0);
```
