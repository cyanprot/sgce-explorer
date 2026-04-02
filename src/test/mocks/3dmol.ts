import { vi } from "vitest";

function createMockModel() {
  return {
    selectedAtoms: vi.fn().mockReturnValue([{ x: 10, y: 20, z: 30 }]),
    setStyle: vi.fn(),
    addStyle: vi.fn(),
    removeAllBonds: vi.fn(),
  };
}

function createMockViewer() {
  const mockModel = createMockModel();
  return {
    addModel: vi.fn().mockReturnValue(mockModel),
    setStyle: vi.fn(),
    addStyle: vi.fn(),
    removeAllModels: vi.fn(),
    removeAllShapes: vi.fn(),
    removeAllLabels: vi.fn(),
    addSphere: vi.fn(),
    addLabel: vi.fn(),
    zoomTo: vi.fn(),
    render: vi.fn(),
    spin: vi.fn(),
    resize: vi.fn(),
    clear: vi.fn(),
    _mockModel: mockModel,
  };
}

export const createViewer = vi.fn().mockImplementation(() => createMockViewer());
export { createMockViewer, createMockModel };
