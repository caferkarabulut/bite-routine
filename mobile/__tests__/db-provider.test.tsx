import { fireEvent, render, screen } from "@testing-library/react-native";
import { Text } from "react-native";
import { DatabaseProvider, migrate, useDb } from "../src/db";
import type { Db } from "../src/db";
import { createNodeDb } from "./helpers/db-node-sqlite";

jest.mock("expo-sqlite", () => ({ openDatabaseAsync: jest.fn() }));

function Probe() {
  const db = useDb();
  return <Text>{db ? "has-db" : "no-db"}</Text>;
}

async function readyDb(): Promise<Db> {
  const db = createNodeDb();
  await migrate(db);
  return db;
}

describe("DatabaseProvider", () => {
  it("shows the fallback, then children once the database is ready", async () => {
    const db = await readyDb();
    let release: (d: Db) => void = () => {};
    const gate = new Promise<Db>((resolve) => {
      release = resolve;
    });
    await render(
      <DatabaseProvider open={() => gate} fallback={<Text>loading</Text>}>
        <Probe />
      </DatabaseProvider>,
    );
    expect(screen.getByText("loading")).toBeTruthy();
    release(db);
    expect(await screen.findByText("has-db")).toBeTruthy();
    expect(screen.queryByText("loading")).toBeNull();
  });

  it("renders the error and retries", async () => {
    const db = await readyDb();
    const open = jest.fn<Promise<Db>, []>().mockRejectedValueOnce(new Error("disk full")).mockResolvedValue(db);
    await render(
      <DatabaseProvider
        open={open}
        renderError={(error, retry) => (
          <Text onPress={retry}>{`failed: ${error.message}`}</Text>
        )}
      >
        <Probe />
      </DatabaseProvider>,
    );
    const err = await screen.findByText("failed: disk full");
    await fireEvent.press(err);
    expect(await screen.findByText("has-db")).toBeTruthy();
    expect(open).toHaveBeenCalledTimes(2);
  });

  it("useDb throws a clear error outside the provider", async () => {
    const spy = jest.spyOn(console, "error").mockImplementation(() => {});
    await expect(render(<Probe />)).rejects.toThrow(/inside <DatabaseProvider>/);
    spy.mockRestore();
  });
});
