// Controllable stand-in for expo-router's usePreventRemove. Use in an expo-router mock factory:
//   usePreventRemove: require("./helpers/prevent-remove").usePreventRemove
// `attemptLeave()` plays a back press: it reports whether the screen was allowed to go straight away.
type Callback = (options: { data: { action: unknown }; repeat: () => void }) => void;

export const guard: { active: boolean; callback: Callback | undefined; disable: jest.Mock; repeat: jest.Mock } = {
  active: false,
  callback: undefined,
  disable: jest.fn(),
  repeat: jest.fn(),
};

export function resetGuard(): void {
  guard.active = false;
  guard.callback = undefined;
  guard.disable.mockReset();
  guard.repeat.mockReset();
  guard.disable.mockImplementation(() => {
    guard.active = false;
  });
}

export function usePreventRemove(active: boolean, callback?: Callback): () => void {
  guard.active = active;
  guard.callback = callback;
  return guard.disable;
}

/** Simulates a back attempt. Returns true when navigation would proceed without a prompt. */
export function attemptLeave(): boolean {
  if (!guard.active || !guard.callback) return true;
  guard.callback({ data: { action: { type: "GO_BACK" } }, repeat: guard.repeat });
  return false;
}
