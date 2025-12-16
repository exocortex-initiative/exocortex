/**
 * ActionButtons Unit Tests
 *
 * Tests for the ActionButtons component including:
 * - Basic rendering
 * - Position variants
 * - Disabled state
 */

import React from "react";
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";

import { ActionButtons } from "@plugin/presentation/renderers/action-buttons";
import { LayoutActions, CommandRef } from "@plugin/domain/layout";

// Sample command data
const startCommand: CommandRef = {
  uid: "cmd-start",
  label: "Start",
  description: "Start the task",
  icon: "play-circle",
  preconditionSparql: "ASK { $target a ems:Task }",
  groundingSparql: "INSERT { $target ems:status ems:Doing } WHERE { }",
};

const stopCommand: CommandRef = {
  uid: "cmd-stop",
  label: "Stop",
  icon: "square",
  groundingSparql: "DELETE { $target ems:status ?s } WHERE { }",
};

const completeCommand: CommandRef = {
  uid: "cmd-complete",
  label: "Complete",
  icon: "check-circle",
};

// Sample LayoutActions data
const sampleActions: LayoutActions = {
  uid: "actions-001",
  label: "Task Actions",
  commands: [startCommand, stopCommand],
  position: "column",
  showLabels: false,
};

describe("ActionButtons", () => {
  describe("rendering", () => {
    it("should render action buttons for each command", () => {
      render(
        <ActionButtons
          actions={sampleActions}
          targetUri="obsidian://vault/task.md"
        />
      );

      expect(screen.getByRole("button", { name: "Start" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Stop" })).toBeInTheDocument();
    });

    it("should render with correct container class for position", () => {
      const { container } = render(
        <ActionButtons
          actions={{ ...sampleActions, position: "hover" }}
          targetUri="obsidian://vault/task.md"
        />
      );

      expect(container.querySelector(".exo-action-buttons-hover")).toBeInTheDocument();
    });

    it("should apply custom className", () => {
      const { container } = render(
        <ActionButtons
          actions={sampleActions}
          targetUri="obsidian://vault/task.md"
          className="custom-class"
        />
      );

      expect(container.querySelector(".custom-class")).toBeInTheDocument();
    });

    it("should render nothing when commands array is empty", () => {
      const { container } = render(
        <ActionButtons
          actions={{ ...sampleActions, commands: [] }}
          targetUri="obsidian://vault/task.md"
        />
      );

      expect(container.querySelector(".exo-action-buttons")).toBeNull();
    });

    it("should show title with description when available", () => {
      render(
        <ActionButtons
          actions={sampleActions}
          targetUri="obsidian://vault/task.md"
        />
      );

      const startButton = screen.getByRole("button", { name: "Start" });
      expect(startButton).toHaveAttribute("title", "Start the task");
    });
  });

  describe("disabled state", () => {
    it("should disable all buttons when disabled prop is true", () => {
      render(
        <ActionButtons
          actions={sampleActions}
          targetUri="obsidian://vault/task.md"
          disabled={true}
        />
      );

      expect(screen.getByRole("button", { name: "Start" })).toBeDisabled();
      expect(screen.getByRole("button", { name: "Stop" })).toBeDisabled();
    });

    it("should disable button without grounding SPARQL", () => {
      const actionsWithNoGrounding: LayoutActions = {
        ...sampleActions,
        commands: [completeCommand],
      };

      render(
        <ActionButtons
          actions={actionsWithNoGrounding}
          targetUri="obsidian://vault/task.md"
        />
      );

      expect(screen.getByRole("button", { name: "Complete" })).toBeDisabled();
    });
  });

  describe("position variants", () => {
    const positions = ["column", "inline", "hover", "contextMenu"] as const;

    for (const position of positions) {
      it(`should apply correct class for ${position} position`, () => {
        const { container } = render(
          <ActionButtons
            actions={{ ...sampleActions, position }}
            targetUri="obsidian://vault/task.md"
          />
        );

        expect(
          container.querySelector(`.exo-action-buttons-${position}`)
        ).toBeInTheDocument();
      });
    }
  });

  describe("accessibility", () => {
    it("should have aria-label on buttons", () => {
      render(
        <ActionButtons
          actions={sampleActions}
          targetUri="obsidian://vault/task.md"
        />
      );

      const startButton = screen.getByRole("button", { name: "Start" });
      expect(startButton).toHaveAttribute("aria-label", "Start");
    });
  });
});
