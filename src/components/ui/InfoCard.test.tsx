import { render, screen } from "@testing-library/react";
import { InfoCard } from "./InfoCard";

describe("InfoCard", () => {
  const items = ["First item", "Second item", "Third item"];

  it("renders the title", () => {
    render(<InfoCard title="Test Title" items={items} />);
    expect(screen.getByText("Test Title")).toBeInTheDocument();
  });

  it("renders all items", () => {
    render(<InfoCard title="Title" items={items} />);
    expect(screen.getByText("First item")).toBeInTheDocument();
    expect(screen.getByText("Second item")).toBeInTheDocument();
    expect(screen.getByText("Third item")).toBeInTheDocument();
  });

  it("renders the correct number of items", () => {
    const { container } = render(<InfoCard title="Title" items={items} />);
    // Each item is a div with the bullet span + text
    const bulletSpans = container.querySelectorAll("span");
    expect(bulletSpans).toHaveLength(items.length);
  });
});
