/**
 * LayoutActions - Domain model for action buttons in layouts
 *
 * Defines the set of command buttons displayed for each row in a table layout.
 * Commands can be filtered based on preconditions evaluated via SPARQL ASK queries.
 *
 * Maps to ontology class: exo__LayoutActions
 *
 * @module domain/layout
 * @since 1.0.0
 */

/**
 * Position of action buttons in the layout.
 *
 * Maps to exo__LayoutActions_position property.
 */
export type ActionPosition = "column" | "inline" | "hover" | "contextMenu";

/**
 * Command reference within LayoutActions.
 *
 * Represents a command that can be executed on an asset.
 * Maps to exocmd__Command class.
 *
 * @example
 * ```typescript
 * const startCommand: CommandRef = {
 *   uid: "60000000-0000-0000-0000-000000000001",
 *   label: "Start Task",
 *   icon: "play-circle",
 *   preconditionSparql: "ASK { $target ems:Effort_status ?s . FILTER(?s != ems:EffortStatusDoing) }",
 *   groundingSparql: "DELETE { $target ems:Effort_status ?old } INSERT { $target ems:Effort_status ems:EffortStatusDoing } WHERE { ... }",
 * };
 * ```
 */
export interface CommandRef {
  /**
   * Unique identifier for the command.
   * Corresponds to exo__Asset_uid in frontmatter.
   */
  uid: string;

  /**
   * Human-readable label for the command.
   * Corresponds to exo__Asset_label in frontmatter.
   */
  label: string;

  /**
   * Description of the command.
   * Corresponds to exo__Asset_description in frontmatter.
   */
  description?: string;

  /**
   * Lucide icon name for the button.
   * Maps to exo__Command_icon property.
   * @example "play-circle", "square", "check-circle"
   */
  icon?: string;

  /**
   * Keyboard shortcut for the command.
   * Maps to exo__Command_shortcut property.
   * @example "Ctrl+Shift+S"
   */
  shortcut?: string;

  /**
   * Reference to the precondition definition.
   * Maps to exo__Command_precondition property.
   * Contains the URI/wikilink to the precondition asset.
   */
  preconditionRef?: string;

  /**
   * SPARQL ASK query for checking if command is applicable.
   * Resolved from the precondition asset's exo__Precondition_sparql property.
   * Use $target placeholder for the asset URI.
   *
   * If ASK returns true → command is available
   * If ASK returns false → command is hidden/disabled
   */
  preconditionSparql?: string;

  /**
   * Reference to the grounding definition.
   * Maps to exo__Command_grounding property.
   * Contains the URI/wikilink to the grounding asset.
   */
  groundingRef?: string;

  /**
   * SPARQL UPDATE query to execute the command.
   * Resolved from the grounding asset's exo__Grounding_sparql property.
   * Use $target placeholder for the asset URI.
   * Use $now placeholder for current timestamp.
   */
  groundingSparql?: string;
}

/**
 * LayoutActions interface.
 *
 * Defines a set of action buttons for a layout.
 *
 * Maps to ontology class: exo__LayoutActions
 *
 * Properties from ontology:
 * - exo__LayoutActions_commands: List of command references
 * - exo__LayoutActions_position: Where to display buttons
 * - exo__LayoutActions_showLabels: Whether to show text labels
 *
 * @example
 * ```typescript
 * const taskActions: LayoutActions = {
 *   uid: "70000000-0000-0000-0000-000000000001",
 *   label: "Task Actions",
 *   commands: [startCommand, stopCommand, completeCommand],
 *   position: "column",
 *   showLabels: false,
 * };
 * ```
 */
export interface LayoutActions {
  /**
   * Unique identifier for the LayoutActions definition.
   * Corresponds to exo__Asset_uid in frontmatter.
   */
  uid: string;

  /**
   * Human-readable label for the LayoutActions.
   * Corresponds to exo__Asset_label in frontmatter.
   */
  label: string;

  /**
   * Description of the LayoutActions.
   * Corresponds to exo__Asset_description in frontmatter.
   */
  description?: string;

  /**
   * Array of command references.
   * Order determines button order (left to right).
   * Maps to exo__LayoutActions_commands property.
   */
  commands: CommandRef[];

  /**
   * Position of action buttons.
   * Maps to exo__LayoutActions_position property.
   * @default "column"
   */
  position: ActionPosition;

  /**
   * Whether to show text labels alongside icons.
   * Maps to exo__LayoutActions_showLabels property.
   * @default false
   */
  showLabels: boolean;
}

/**
 * Check if a value is a valid ActionPosition.
 *
 * @param value - The value to check
 * @returns True if the value is a valid ActionPosition
 */
export function isValidActionPosition(value: unknown): value is ActionPosition {
  return (
    value === "column" ||
    value === "inline" ||
    value === "hover" ||
    value === "contextMenu"
  );
}

/**
 * Create a CommandRef from frontmatter data.
 *
 * Note: This creates a basic CommandRef without resolved SPARQL queries.
 * Use LayoutParser to fully resolve precondition/grounding queries.
 *
 * @param frontmatter - The YAML frontmatter object from a Command note
 * @returns A CommandRef object or null if required fields are missing
 *
 * @example
 * ```typescript
 * const frontmatter = {
 *   exo__Asset_uid: "60000000-0000-0000-0000-000000000001",
 *   exo__Asset_label: "Start Task",
 *   exo__Command_icon: "play-circle",
 *   exo__Command_precondition: "[[emscmd__TaskNotDoingPrecondition]]",
 *   exo__Command_grounding: "[[emscmd__StartTaskGrounding]]",
 * };
 * const command = createCommandRefFromFrontmatter(frontmatter);
 * ```
 */
export function createCommandRefFromFrontmatter(
  frontmatter: Record<string, unknown>,
): CommandRef | null {
  const uid = frontmatter["exo__Asset_uid"] as string | undefined;
  const label = frontmatter["exo__Asset_label"] as string | undefined;

  if (!uid || !label) {
    return null;
  }

  return {
    uid,
    label,
    description: frontmatter["exo__Asset_description"] as string | undefined,
    icon: frontmatter["exo__Command_icon"] as string | undefined,
    shortcut: frontmatter["exo__Command_shortcut"] as string | undefined,
    preconditionRef: frontmatter["exo__Command_precondition"] as string | undefined,
    groundingRef: frontmatter["exo__Command_grounding"] as string | undefined,
  };
}

/**
 * Create a LayoutActions from frontmatter data.
 *
 * Note: This creates a basic LayoutActions without resolved commands.
 * Use LayoutParser to fully resolve command definitions.
 *
 * @param frontmatter - The YAML frontmatter object from a LayoutActions note
 * @returns A partial LayoutActions object or null if required fields are missing
 *
 * @example
 * ```typescript
 * const frontmatter = {
 *   exo__Asset_uid: "70000000-0000-0000-0000-000000000001",
 *   exo__Asset_label: "Task Actions",
 *   exo__LayoutActions_commands: [
 *     "[[emscmd__StartTaskCommand]]",
 *     "[[emscmd__StopTaskCommand]]",
 *   ],
 *   exo__LayoutActions_position: "column",
 *   exo__LayoutActions_showLabels: false,
 * };
 * const actions = createLayoutActionsFromFrontmatter(frontmatter);
 * ```
 */
export function createLayoutActionsFromFrontmatter(
  frontmatter: Record<string, unknown>,
): Omit<LayoutActions, "commands"> & { commandRefs: string[] } | null {
  const uid = frontmatter["exo__Asset_uid"] as string | undefined;
  const label = frontmatter["exo__Asset_label"] as string | undefined;

  if (!uid || !label) {
    return null;
  }

  // Get command references as wikilinks
  const commandsValue = frontmatter["exo__LayoutActions_commands"];
  const commandRefs = normalizeToStringArray(commandsValue);

  // Get position with default
  const positionValue = frontmatter["exo__LayoutActions_position"];
  const position: ActionPosition = isValidActionPosition(positionValue)
    ? positionValue
    : "column";

  // Get showLabels with default
  const showLabels = Boolean(frontmatter["exo__LayoutActions_showLabels"]);

  return {
    uid,
    label,
    description: frontmatter["exo__Asset_description"] as string | undefined,
    commandRefs,
    position,
    showLabels,
  };
}

/**
 * Check if a frontmatter object represents a LayoutActions asset.
 *
 * @param frontmatter - The frontmatter object to check
 * @returns True if this is a LayoutActions asset
 */
export function isLayoutActionsFrontmatter(
  frontmatter: Record<string, unknown>,
): boolean {
  const instanceClass = frontmatter["exo__Instance_class"];
  return instanceClassContains(instanceClass, "exo__LayoutActions");
}

/**
 * Check if a frontmatter object represents a Command asset.
 *
 * @param frontmatter - The frontmatter object to check
 * @returns True if this is a Command asset
 */
export function isCommandFrontmatter(
  frontmatter: Record<string, unknown>,
): boolean {
  const instanceClass = frontmatter["exo__Instance_class"];
  return instanceClassContains(instanceClass, "exocmd__Command");
}

/**
 * Check if a frontmatter object represents a Precondition asset.
 *
 * @param frontmatter - The frontmatter object to check
 * @returns True if this is a Precondition asset
 */
export function isPreconditionFrontmatter(
  frontmatter: Record<string, unknown>,
): boolean {
  const instanceClass = frontmatter["exo__Instance_class"];
  return instanceClassContains(instanceClass, "exocmd__Precondition");
}

/**
 * Check if a frontmatter object represents a Grounding asset.
 *
 * @param frontmatter - The frontmatter object to check
 * @returns True if this is a Grounding or SparqlGrounding asset
 */
export function isGroundingFrontmatter(
  frontmatter: Record<string, unknown>,
): boolean {
  const instanceClass = frontmatter["exo__Instance_class"];
  return (
    instanceClassContains(instanceClass, "exocmd__Grounding") ||
    instanceClassContains(instanceClass, "exocmd__SparqlGrounding")
  );
}

// ============================================
// Helper Functions
// ============================================

/**
 * Normalize a value to an array of strings.
 */
function normalizeToStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((v): v is string => typeof v === "string");
  }
  if (typeof value === "string") {
    return [value];
  }
  return [];
}

/**
 * Check if instance class contains a specific class name.
 */
function instanceClassContains(instanceClass: unknown, className: string): boolean {
  const classes = Array.isArray(instanceClass) ? instanceClass : [instanceClass];

  for (const cls of classes) {
    if (typeof cls !== "string") continue;

    // Extract class name from wikilink
    const match = cls.match(/\[\[([^\]]+)\]\]/);
    const extractedClassName = match ? match[1] : cls;

    if (extractedClassName === className) {
      return true;
    }
  }

  return false;
}
