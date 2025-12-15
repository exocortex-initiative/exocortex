import { test, expect } from "@playwright/test";
import { ObsidianLauncher } from "../utils/obsidian-launcher";
import * as path from "path";

/**
 * E2E tests for Issue #941: Column misalignment in virtualized mode (>50 rows)
 *
 * When DailyTasksTable has more than 50 rows, it switches to virtualized rendering
 * using @tanstack/react-virtual. In this mode, the header and body are rendered
 * as SEPARATE tables:
 * - Header table: .exocortex-tasks-table-header
 * - Body table: .exocortex-virtual-table (inside .exocortex-virtual-scroll-container)
 *
 * The issue is that column widths can become misaligned between the two tables
 * because:
 * 1. The "Name" column has no fixed width (uses "remaining space")
 * 2. table-layout: fixed calculates "remaining space" independently per table
 * 3. Scroll container width may differ from header table width
 *
 * This test suite verifies that:
 * 1. Header and body columns remain aligned in virtualized mode
 * 2. The Name column maintains proper width
 * 3. Text content is not truncated unexpectedly
 */
test.describe("Virtualized Table Column Alignment (#941)", () => {
  let launcher: ObsidianLauncher;

  test.beforeEach(async () => {
    const vaultPath = path.join(__dirname, "../test-vault");
    launcher = new ObsidianLauncher(vaultPath);
    await launcher.launch();
  });

  test.afterEach(async () => {
    await launcher.close();
  });

  test("should align header and body columns when virtualization is active", async () => {
    // Open a daily note that triggers virtualization (>50 tasks)
    // For this test to be meaningful, we need a daily note with >50 tasks
    // If no such file exists, the test will be skipped
    await launcher.openFile("Daily Notes/2025-10-16.md");

    const window = await launcher.getWindow();
    await launcher.waitForModalsToClose(10000);
    await window.waitForTimeout(3000);

    // Look for virtualized container which indicates >50 rows mode
    const virtualizedContainer = window.locator(".exocortex-virtualized");
    const isVirtualized = await virtualizedContainer.isVisible({ timeout: 5000 }).catch(() => false);

    if (!isVirtualized) {
      console.log("Test skipped: No virtualized table found (needs >50 rows)");
      test.skip();
      return;
    }

    // Get the header table and body table
    const headerTable = virtualizedContainer.locator(".exocortex-tasks-table-header").first();
    const bodyTable = virtualizedContainer.locator(".exocortex-virtual-scroll-container .exocortex-virtual-table").first();

    const headerVisible = await headerTable.isVisible({ timeout: 5000 }).catch(() => false);
    const bodyVisible = await bodyTable.isVisible({ timeout: 5000 }).catch(() => false);

    expect(headerVisible).toBe(true);
    expect(bodyVisible).toBe(true);

    // Get header cells
    const headerCells = headerTable.locator("thead th");
    const headerCount = await headerCells.count();

    // Get first visible body row cells
    const bodyCells = bodyTable.locator("tbody tr:first-child td");
    const bodyCount = await bodyCells.count();

    // Header and body should have same number of columns
    expect(headerCount).toBe(bodyCount);
    expect(headerCount).toBeGreaterThan(0);

    console.log(`Columns count: header=${headerCount}, body=${bodyCount}`);

    // Compare positions of each column between header and body tables
    for (let i = 0; i < headerCount; i++) {
      const headerCell = headerCells.nth(i);
      const bodyCell = bodyCells.nth(i);

      const headerBox = await headerCell.boundingBox();
      const bodyBox = await bodyCell.boundingBox();

      expect(headerBox).toBeTruthy();
      expect(bodyBox).toBeTruthy();

      if (headerBox && bodyBox) {
        // X positions should align within tolerance
        // Due to separate tables, there might be slight differences
        // The critical issue is when they're significantly off (>10px)
        const xDiff = Math.abs(headerBox.x - bodyBox.x);
        const widthDiff = Math.abs(headerBox.width - bodyBox.width);

        console.log(
          `Column ${i}: ` +
          `Header(x=${headerBox.x.toFixed(1)}, w=${headerBox.width.toFixed(1)}) ` +
          `Body(x=${bodyBox.x.toFixed(1)}, w=${bodyBox.width.toFixed(1)}) ` +
          `Diff(x=${xDiff.toFixed(1)}, w=${widthDiff.toFixed(1)})`
        );

        // Issue #941: Columns should be aligned
        // Using 10px tolerance for virtualized mode (more lenient than non-virtualized 2px)
        expect(xDiff).toBeLessThanOrEqual(10);
        expect(widthDiff).toBeLessThanOrEqual(10);
      }
    }
  });

  test("should have Name column with substantial width in virtualized mode", async () => {
    await launcher.openFile("Daily Notes/2025-10-16.md");

    const window = await launcher.getWindow();
    await launcher.waitForModalsToClose(10000);
    await window.waitForTimeout(3000);

    const virtualizedContainer = window.locator(".exocortex-virtualized");
    const isVirtualized = await virtualizedContainer.isVisible({ timeout: 5000 }).catch(() => false);

    if (!isVirtualized) {
      console.log("Test skipped: No virtualized table found (needs >50 rows)");
      test.skip();
      return;
    }

    // Name column is the first column (index 0)
    const headerNameCell = virtualizedContainer.locator(".exocortex-tasks-table-header thead th").first();
    const bodyNameCell = virtualizedContainer.locator(".exocortex-virtual-scroll-container .exocortex-virtual-table tbody tr:first-child td").first();

    const headerBox = await headerNameCell.boundingBox();
    const bodyBox = await bodyNameCell.boundingBox();

    // Name column should have substantial width in both tables
    // Issue #941: The name column was collapsing or truncating
    const MIN_NAME_COLUMN_WIDTH = 100; // Minimum acceptable width in pixels

    if (headerBox) {
      console.log(`Header Name column width: ${headerBox.width}px`);
      expect(headerBox.width).toBeGreaterThanOrEqual(MIN_NAME_COLUMN_WIDTH);
    }

    if (bodyBox) {
      console.log(`Body Name column width: ${bodyBox.width}px`);
      expect(bodyBox.width).toBeGreaterThanOrEqual(MIN_NAME_COLUMN_WIDTH);
    }
  });

  test("should have visible text content in Name column cells", async () => {
    await launcher.openFile("Daily Notes/2025-10-16.md");

    const window = await launcher.getWindow();
    await launcher.waitForModalsToClose(10000);
    await window.waitForTimeout(3000);

    const virtualizedContainer = window.locator(".exocortex-virtualized");
    const isVirtualized = await virtualizedContainer.isVisible({ timeout: 5000 }).catch(() => false);

    if (!isVirtualized) {
      console.log("Test skipped: No virtualized table found (needs >50 rows)");
      test.skip();
      return;
    }

    // Get first few visible rows and check their Name column content
    const rows = virtualizedContainer.locator(".exocortex-virtual-scroll-container .exocortex-virtual-table tbody tr");
    const rowCount = await rows.count();

    console.log(`Visible rows in virtualized table: ${rowCount}`);
    expect(rowCount).toBeGreaterThan(0);

    // Check first 5 rows (or all if less than 5)
    const checkCount = Math.min(5, rowCount);
    for (let i = 0; i < checkCount; i++) {
      const row = rows.nth(i);
      const nameCell = row.locator("td").first();

      // Check if cell has visible content
      const cellBox = await nameCell.boundingBox();
      const cellText = await nameCell.textContent();

      console.log(`Row ${i} Name: "${cellText?.trim().substring(0, 50)}..." width=${cellBox?.width}px`);

      // Cell should have content
      expect(cellText?.trim().length).toBeGreaterThan(0);

      // Cell should have reasonable width
      if (cellBox) {
        expect(cellBox.width).toBeGreaterThan(50);
      }
    }
  });

  test("should maintain alignment after scrolling in virtualized table", async () => {
    await launcher.openFile("Daily Notes/2025-10-16.md");

    const window = await launcher.getWindow();
    await launcher.waitForModalsToClose(10000);
    await window.waitForTimeout(3000);

    const virtualizedContainer = window.locator(".exocortex-virtualized");
    const isVirtualized = await virtualizedContainer.isVisible({ timeout: 5000 }).catch(() => false);

    if (!isVirtualized) {
      console.log("Test skipped: No virtualized table found (needs >50 rows)");
      test.skip();
      return;
    }

    // Get scroll container
    const scrollContainer = virtualizedContainer.locator(".exocortex-virtual-scroll-container");

    // Scroll down to load different rows
    await scrollContainer.evaluate((el) => {
      el.scrollTop = 200; // Scroll down 200px
    });

    // Wait for virtualization to update
    await window.waitForTimeout(500);

    // Now check alignment after scroll
    const headerTable = virtualizedContainer.locator(".exocortex-tasks-table-header").first();
    const bodyTable = virtualizedContainer.locator(".exocortex-virtual-scroll-container .exocortex-virtual-table").first();

    const headerFirstCell = headerTable.locator("thead th").first();
    const bodyFirstCell = bodyTable.locator("tbody tr:first-child td").first();

    const headerBox = await headerFirstCell.boundingBox();
    const bodyBox = await bodyFirstCell.boundingBox();

    if (headerBox && bodyBox) {
      const xDiff = Math.abs(headerBox.x - bodyBox.x);
      console.log(`After scroll - Header X: ${headerBox.x.toFixed(1)}, Body X: ${bodyBox.x.toFixed(1)}, Diff: ${xDiff.toFixed(1)}px`);

      // Columns should still be aligned after scrolling
      expect(xDiff).toBeLessThanOrEqual(10);
    }
  });

  test("should have consistent widths between header and body tables", async () => {
    await launcher.openFile("Daily Notes/2025-10-16.md");

    const window = await launcher.getWindow();
    await launcher.waitForModalsToClose(10000);
    await window.waitForTimeout(3000);

    const virtualizedContainer = window.locator(".exocortex-virtualized");
    const isVirtualized = await virtualizedContainer.isVisible({ timeout: 5000 }).catch(() => false);

    if (!isVirtualized) {
      console.log("Test skipped: No virtualized table found (needs >50 rows)");
      test.skip();
      return;
    }

    // Get header table and body table
    const headerTable = virtualizedContainer.locator(".exocortex-tasks-table-header").first();
    const bodyTable = virtualizedContainer.locator(".exocortex-virtual-scroll-container .exocortex-virtual-table").first();

    const headerBox = await headerTable.boundingBox();
    const bodyBox = await bodyTable.boundingBox();

    if (headerBox && bodyBox) {
      const widthDiff = Math.abs(headerBox.width - bodyBox.width);
      console.log(`Header table width: ${headerBox.width}px, Body table width: ${bodyBox.width}px, Diff: ${widthDiff}px`);

      // Both tables should have the same width
      // This is critical for column alignment
      expect(widthDiff).toBeLessThanOrEqual(5);
    }
  });
});
