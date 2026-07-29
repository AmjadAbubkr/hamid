// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { CanonicalFooter } from "./canonical-footer";

const originalSiteUrl = process.env.NEXT_PUBLIC_SITE_URL;

afterEach(() => {
  if (originalSiteUrl === undefined) {
    delete process.env.NEXT_PUBLIC_SITE_URL;
  } else {
    process.env.NEXT_PUBLIC_SITE_URL = originalSiteUrl;
  }
});

describe("CanonicalFooter", () => {
  it("does not expose the local or canonical URL in the visible footer", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://hamid.example/";

    render(
      <CanonicalFooter pathname="/fr/career/inspecteur-technique" locale="fr" />,
    );

    expect(screen.getByTestId("canonical-footer")).not.toHaveTextContent("localhost:3000");
    expect(screen.getByTestId("canonical-footer")).not.toHaveTextContent("hamid.example");
  });
});
