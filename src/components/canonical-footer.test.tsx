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
  it("server-renders the complete canonical URL for the supplied public route", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://hamid.example/";

    render(
      <CanonicalFooter pathname="/fr/career/inspecteur-technique" />,
    );

    expect(screen.getByTestId("canonical-footer")).toHaveTextContent(
      "https://hamid.example/fr/career/inspecteur-technique",
    );
  });
});
