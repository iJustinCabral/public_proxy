import { describe, it, expect } from "vitest";
import { inferBillStatus } from "@/lib/congress";

describe("Congress Bill Status Inference", () => {
  it("returns 'introduced' for undefined action", () => {
    expect(inferBillStatus(undefined)).toBe("introduced");
  });

  it("returns 'introduced' for empty string", () => {
    expect(inferBillStatus("")).toBe("introduced");
  });

  it("detects 'enacted' from 'became public law'", () => {
    expect(inferBillStatus("Became Public Law No: 118-50")).toBe("enacted");
  });

  it("detects 'enacted' from 'signed by president'", () => {
    expect(inferBillStatus("Signed by President on 2024-01-15")).toBe("enacted");
  });

  it("detects 'vetoed'", () => {
    expect(inferBillStatus("Vetoed by President")).toBe("vetoed");
  });

  it("detects 'passed_senate'", () => {
    expect(inferBillStatus("Passed Senate with an amendment")).toBe("passed_senate");
  });

  it("detects 'passed_house'", () => {
    expect(inferBillStatus("Passed House by voice vote")).toBe("passed_house");
  });

  it("detects 'passed_both'", () => {
    expect(inferBillStatus("Passed House and Passed Senate")).toBe("passed_both");
  });

  it("detects 'in_committee'", () => {
    expect(inferBillStatus("Referred to the Committee on Energy")).toBe("in_committee");
  });

  it("defaults to 'introduced' for unrecognized text", () => {
    expect(inferBillStatus("Something random happened")).toBe("introduced");
  });
});
