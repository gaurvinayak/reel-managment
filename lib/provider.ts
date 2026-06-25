import type { Provider } from "./types";
import { MockProvider } from "./mock";
import { GraphApiProvider } from "./instagram";

export function dataSource(): "mock" | "graph" {
  return process.env.DATA_SOURCE === "graph" ? "graph" : "mock";
}

export function getProvider(): Provider {
  if (dataSource() === "graph") {
    return new GraphApiProvider();
  }
  return new MockProvider();
}
