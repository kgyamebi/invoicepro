import { describe, expect, it } from "vitest";
import { parseQuickEntry } from "@/lib/documents/quick-entry";

describe("quick entry", () => {
  it("parses quantity name price", () => {
    const [line] = parseQuickEntry("50 LED floodlights 180");
    expect(line.quantity).toBe("50");
    expect(line.name).toBe("LED floodlights");
    expect(line.unitPrice).toBe("180");
    expect(line.uncertain).toBe(false);
  });
});
