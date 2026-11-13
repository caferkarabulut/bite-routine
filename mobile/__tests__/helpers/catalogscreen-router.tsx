// jest mock for expo-router used by the catalog screen tests:
// jest.mock("expo-router", () => require("./helpers/catalogscreen-router"))
export const router = {
  push: jest.fn(),
  back: jest.fn(),
  replace: jest.fn(),
  dismissTo: jest.fn(),
};

export const params: { current: Record<string, string> } = { current: {} };

export function useLocalSearchParams() {
  return params.current;
}

export const titles: string[] = [];

export const Stack = {
  Screen: ({ options }: { options?: { title?: string } }) => {
    titles.push(options?.title ?? "");
    return null;
  },
};
