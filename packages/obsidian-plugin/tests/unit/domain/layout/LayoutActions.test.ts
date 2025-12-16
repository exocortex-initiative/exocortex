import { describe, it, expect } from "@jest/globals";
import {
  isValidActionPosition,
  createCommandRefFromFrontmatter,
  createLayoutActionsFromFrontmatter,
  isLayoutActionsFrontmatter,
  isCommandFrontmatter,
  isPreconditionFrontmatter,
  isGroundingFrontmatter,
  type ActionPosition,
  type CommandRef,
} from "../../../../src/domain/layout/LayoutActions";

describe("LayoutActions", () => {
  describe("isValidActionPosition", () => {
    it("should return true for all valid positions", () => {
      const validPositions: ActionPosition[] = [
        "column",
        "inline",
        "hover",
        "contextMenu",
      ];

      for (const position of validPositions) {
        expect(isValidActionPosition(position)).toBe(true);
      }
    });

    it("should return false for invalid position strings", () => {
      expect(isValidActionPosition("invalid")).toBe(false);
      expect(isValidActionPosition("")).toBe(false);
      expect(isValidActionPosition("COLUMN")).toBe(false);
      expect(isValidActionPosition("Inline")).toBe(false);
    });

    it("should return false for non-string values", () => {
      expect(isValidActionPosition(null)).toBe(false);
      expect(isValidActionPosition(undefined)).toBe(false);
      expect(isValidActionPosition(123)).toBe(false);
      expect(isValidActionPosition(true)).toBe(false);
      expect(isValidActionPosition({})).toBe(false);
      expect(isValidActionPosition([])).toBe(false);
    });
  });

  describe("createCommandRefFromFrontmatter", () => {
    it("should create a CommandRef from valid frontmatter", () => {
      const frontmatter = {
        exo__Asset_uid: "60000000-0000-0000-0000-000000000001",
        exo__Asset_label: "Start Task",
        exo__Asset_description: "Start task execution",
        exo__Command_icon: "play-circle",
        exo__Command_shortcut: "Ctrl+Shift+S",
        exo__Command_precondition: "[[emscmd__TaskNotDoingPrecondition]]",
        exo__Command_grounding: "[[emscmd__StartTaskGrounding]]",
      };

      const result = createCommandRefFromFrontmatter(frontmatter);

      expect(result).not.toBeNull();
      expect(result!.uid).toBe("60000000-0000-0000-0000-000000000001");
      expect(result!.label).toBe("Start Task");
      expect(result!.description).toBe("Start task execution");
      expect(result!.icon).toBe("play-circle");
      expect(result!.shortcut).toBe("Ctrl+Shift+S");
      expect(result!.preconditionRef).toBe("[[emscmd__TaskNotDoingPrecondition]]");
      expect(result!.groundingRef).toBe("[[emscmd__StartTaskGrounding]]");
    });

    it("should return null when uid is missing", () => {
      const frontmatter = {
        exo__Asset_label: "Start Task",
      };

      const result = createCommandRefFromFrontmatter(frontmatter);

      expect(result).toBeNull();
    });

    it("should return null when label is missing", () => {
      const frontmatter = {
        exo__Asset_uid: "cmd-001",
      };

      const result = createCommandRefFromFrontmatter(frontmatter);

      expect(result).toBeNull();
    });

    it("should handle minimal required fields", () => {
      const frontmatter = {
        exo__Asset_uid: "cmd-001",
        exo__Asset_label: "Simple Command",
      };

      const result = createCommandRefFromFrontmatter(frontmatter);

      expect(result).not.toBeNull();
      expect(result!.uid).toBe("cmd-001");
      expect(result!.label).toBe("Simple Command");
      expect(result!.icon).toBeUndefined();
      expect(result!.shortcut).toBeUndefined();
      expect(result!.preconditionRef).toBeUndefined();
      expect(result!.groundingRef).toBeUndefined();
    });
  });

  describe("createLayoutActionsFromFrontmatter", () => {
    it("should create LayoutActions from valid frontmatter", () => {
      const frontmatter = {
        exo__Asset_uid: "70000000-0000-0000-0000-000000000001",
        exo__Asset_label: "Task Actions",
        exo__Asset_description: "Actions for tasks",
        exo__LayoutActions_commands: [
          "[[emscmd__StartTaskCommand]]",
          "[[emscmd__StopTaskCommand]]",
        ],
        exo__LayoutActions_position: "column",
        exo__LayoutActions_showLabels: true,
      };

      const result = createLayoutActionsFromFrontmatter(frontmatter);

      expect(result).not.toBeNull();
      expect(result!.uid).toBe("70000000-0000-0000-0000-000000000001");
      expect(result!.label).toBe("Task Actions");
      expect(result!.description).toBe("Actions for tasks");
      expect(result!.commandRefs).toHaveLength(2);
      expect(result!.commandRefs[0]).toBe("[[emscmd__StartTaskCommand]]");
      expect(result!.commandRefs[1]).toBe("[[emscmd__StopTaskCommand]]");
      expect(result!.position).toBe("column");
      expect(result!.showLabels).toBe(true);
    });

    it("should return null when uid is missing", () => {
      const frontmatter = {
        exo__Asset_label: "Task Actions",
        exo__LayoutActions_commands: ["[[cmd1]]"],
      };

      const result = createLayoutActionsFromFrontmatter(frontmatter);

      expect(result).toBeNull();
    });

    it("should return null when label is missing", () => {
      const frontmatter = {
        exo__Asset_uid: "actions-001",
        exo__LayoutActions_commands: ["[[cmd1]]"],
      };

      const result = createLayoutActionsFromFrontmatter(frontmatter);

      expect(result).toBeNull();
    });

    it('should default position to "column"', () => {
      const frontmatter = {
        exo__Asset_uid: "actions-001",
        exo__Asset_label: "Task Actions",
      };

      const result = createLayoutActionsFromFrontmatter(frontmatter);

      expect(result).not.toBeNull();
      expect(result!.position).toBe("column");
    });

    it("should default showLabels to false", () => {
      const frontmatter = {
        exo__Asset_uid: "actions-001",
        exo__Asset_label: "Task Actions",
      };

      const result = createLayoutActionsFromFrontmatter(frontmatter);

      expect(result).not.toBeNull();
      expect(result!.showLabels).toBe(false);
    });

    it("should handle single command as string", () => {
      const frontmatter = {
        exo__Asset_uid: "actions-001",
        exo__Asset_label: "Task Actions",
        exo__LayoutActions_commands: "[[emscmd__StartTaskCommand]]",
      };

      const result = createLayoutActionsFromFrontmatter(frontmatter);

      expect(result).not.toBeNull();
      expect(result!.commandRefs).toHaveLength(1);
      expect(result!.commandRefs[0]).toBe("[[emscmd__StartTaskCommand]]");
    });

    it("should handle empty commands array", () => {
      const frontmatter = {
        exo__Asset_uid: "actions-001",
        exo__Asset_label: "Task Actions",
        exo__LayoutActions_commands: [],
      };

      const result = createLayoutActionsFromFrontmatter(frontmatter);

      expect(result).not.toBeNull();
      expect(result!.commandRefs).toHaveLength(0);
    });

    it("should handle all valid positions", () => {
      const positions: ActionPosition[] = ["column", "inline", "hover", "contextMenu"];

      for (const position of positions) {
        const frontmatter = {
          exo__Asset_uid: `actions-${position}`,
          exo__Asset_label: `${position} Actions`,
          exo__LayoutActions_position: position,
        };

        const result = createLayoutActionsFromFrontmatter(frontmatter);

        expect(result).not.toBeNull();
        expect(result!.position).toBe(position);
      }
    });

    it('should default invalid position to "column"', () => {
      const frontmatter = {
        exo__Asset_uid: "actions-001",
        exo__Asset_label: "Task Actions",
        exo__LayoutActions_position: "invalid_position",
      };

      const result = createLayoutActionsFromFrontmatter(frontmatter);

      expect(result).not.toBeNull();
      expect(result!.position).toBe("column");
    });
  });

  describe("isLayoutActionsFrontmatter", () => {
    it("should return true for LayoutActions asset", () => {
      const frontmatter = {
        exo__Instance_class: ["[[exo__LayoutActions]]"],
      };

      expect(isLayoutActionsFrontmatter(frontmatter)).toBe(true);
    });

    it("should return true for single class string", () => {
      const frontmatter = {
        exo__Instance_class: "[[exo__LayoutActions]]",
      };

      expect(isLayoutActionsFrontmatter(frontmatter)).toBe(true);
    });

    it("should return true for class without brackets", () => {
      const frontmatter = {
        exo__Instance_class: "exo__LayoutActions",
      };

      expect(isLayoutActionsFrontmatter(frontmatter)).toBe(true);
    });

    it("should return false for non-LayoutActions asset", () => {
      const frontmatter = {
        exo__Instance_class: ["[[exo__TableLayout]]"],
      };

      expect(isLayoutActionsFrontmatter(frontmatter)).toBe(false);
    });

    it("should return false for missing instance class", () => {
      const frontmatter = {};

      expect(isLayoutActionsFrontmatter(frontmatter)).toBe(false);
    });
  });

  describe("isCommandFrontmatter", () => {
    it("should return true for Command asset", () => {
      const frontmatter = {
        exo__Instance_class: ["[[exocmd__Command]]"],
      };

      expect(isCommandFrontmatter(frontmatter)).toBe(true);
    });

    it("should return false for non-Command asset", () => {
      const frontmatter = {
        exo__Instance_class: ["[[exo__LayoutActions]]"],
      };

      expect(isCommandFrontmatter(frontmatter)).toBe(false);
    });
  });

  describe("isPreconditionFrontmatter", () => {
    it("should return true for Precondition asset", () => {
      const frontmatter = {
        exo__Instance_class: ["[[exocmd__Precondition]]"],
      };

      expect(isPreconditionFrontmatter(frontmatter)).toBe(true);
    });

    it("should return false for non-Precondition asset", () => {
      const frontmatter = {
        exo__Instance_class: ["[[exocmd__Command]]"],
      };

      expect(isPreconditionFrontmatter(frontmatter)).toBe(false);
    });
  });

  describe("isGroundingFrontmatter", () => {
    it("should return true for Grounding asset", () => {
      const frontmatter = {
        exo__Instance_class: ["[[exocmd__Grounding]]"],
      };

      expect(isGroundingFrontmatter(frontmatter)).toBe(true);
    });

    it("should return true for SparqlGrounding asset", () => {
      const frontmatter = {
        exo__Instance_class: ["[[exocmd__SparqlGrounding]]"],
      };

      expect(isGroundingFrontmatter(frontmatter)).toBe(true);
    });

    it("should return false for non-Grounding asset", () => {
      const frontmatter = {
        exo__Instance_class: ["[[exocmd__Command]]"],
      };

      expect(isGroundingFrontmatter(frontmatter)).toBe(false);
    });
  });

  describe("type safety", () => {
    it("should allow creating CommandRef with all fields", () => {
      const command: CommandRef = {
        uid: "cmd-001",
        label: "Full Command",
        description: "A fully specified command",
        icon: "play-circle",
        shortcut: "Ctrl+S",
        preconditionRef: "[[precondition]]",
        preconditionSparql: "ASK { ?s ?p ?o }",
        groundingRef: "[[grounding]]",
        groundingSparql: "INSERT { ?s ?p ?o } WHERE { ?x ?y ?z }",
      };

      expect(command.uid).toBe("cmd-001");
      expect(command.preconditionSparql).toBe("ASK { ?s ?p ?o }");
    });

    it("should allow creating CommandRef with minimal fields", () => {
      const command: CommandRef = {
        uid: "cmd-001",
        label: "Minimal Command",
      };

      expect(command.uid).toBe("cmd-001");
      expect(command.icon).toBeUndefined();
    });
  });
});
