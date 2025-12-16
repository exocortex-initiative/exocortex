/**
 * ActionButtons Component
 *
 * Renders action buttons based on LayoutActions configuration.
 * Supports precondition checking, command execution, and various display positions.
 *
 * @module presentation/renderers/action-buttons
 * @since 1.0.0
 */
import React, { useState, useEffect, useCallback, useMemo } from "react";
import type { LayoutActions, CommandRef } from "../../../domain/layout";

/**
 * SPARQL query execution interface
 */
export interface SparqlEngine {
  /**
   * Execute a SPARQL ASK query
   * @param query - The SPARQL ASK query string
   * @returns Promise resolving to boolean result
   */
  ask(query: string): Promise<boolean>;

  /**
   * Execute a SPARQL UPDATE query
   * @param query - The SPARQL UPDATE query string
   * @returns Promise resolving when complete
   */
  update(query: string): Promise<void>;
}

/**
 * Props for the ActionButtons component
 */
export interface ActionButtonsProps {
  /**
   * The LayoutActions configuration
   */
  actions: LayoutActions;

  /**
   * URI of the target asset (for substitution in SPARQL queries)
   */
  targetUri: string;

  /**
   * SPARQL engine for precondition checks and command execution
   */
  sparqlEngine?: SparqlEngine;

  /**
   * Callback when a command is executed successfully
   */
  onCommandExecuted?: (command: CommandRef) => void;

  /**
   * Callback when a command execution fails
   */
  onCommandError?: (command: CommandRef, error: Error) => void;

  /**
   * Custom CSS class name
   */
  className?: string;

  /**
   * Whether to disable all buttons
   */
  disabled?: boolean;
}

/**
 * State for a single command button
 */
interface CommandButtonState {
  isVisible: boolean;
  isLoading: boolean;
  isDisabled: boolean;
}

/**
 * Substitute placeholders in SPARQL query
 */
function substituteQueryPlaceholders(
  query: string,
  targetUri: string,
): string {
  let result = query;

  // Replace $target with the actual URI (wrapped in angle brackets if not already)
  const formattedUri = targetUri.startsWith("<") ? targetUri : `<${targetUri}>`;
  result = result.replace(/\$target/g, formattedUri);

  // Replace $now with current timestamp
  const now = new Date().toISOString();
  result = result.replace(/\$now/g, `"${now}"^^xsd:dateTime`);

  return result;
}

/**
 * Get icon class for a command (supports Lucide icon names)
 */
function getIconClass(icon?: string): string {
  if (!icon) return "lucide-circle";

  // Map common icon names to Lucide classes
  const iconMap: Record<string, string> = {
    "play-circle": "lucide-play-circle",
    "play": "lucide-play",
    "stop": "lucide-square",
    "square": "lucide-square",
    "stop-circle": "lucide-stop-circle",
    "check": "lucide-check",
    "check-circle": "lucide-check-circle",
    "x": "lucide-x",
    "x-circle": "lucide-x-circle",
    "pause": "lucide-pause",
    "pause-circle": "lucide-pause-circle",
    "rotate-cw": "lucide-rotate-cw",
    "refresh": "lucide-rotate-cw",
    "trash": "lucide-trash-2",
    "edit": "lucide-pencil",
    "pencil": "lucide-pencil",
  };

  return iconMap[icon] || `lucide-${icon}`;
}

/**
 * ActionButtons Component
 *
 * Renders a row of action buttons based on LayoutActions configuration.
 * Each button's visibility is determined by evaluating its precondition SPARQL ASK query.
 * Clicking a button executes its grounding SPARQL UPDATE query.
 *
 * @example
 * ```tsx
 * <ActionButtons
 *   actions={layoutActions}
 *   targetUri="obsidian://vault/Tasks/MyTask.md"
 *   sparqlEngine={engine}
 *   onCommandExecuted={(cmd) => console.log("Executed:", cmd.label)}
 * />
 * ```
 */
export const ActionButtons: React.FC<ActionButtonsProps> = ({
  actions,
  targetUri,
  sparqlEngine,
  onCommandExecuted,
  onCommandError,
  className,
  disabled = false,
}) => {
  // Track state for each command
  const [commandStates, setCommandStates] = useState<Map<string, CommandButtonState>>(
    new Map()
  );

  // Initialize command states
  useEffect(() => {
    const initialStates = new Map<string, CommandButtonState>();
    for (const cmd of actions.commands) {
      initialStates.set(cmd.uid, {
        isVisible: true, // Start visible, hide after precondition check fails
        isLoading: false,
        isDisabled: false,
      });
    }
    setCommandStates(initialStates);
  }, [actions.commands]);

  // Check preconditions for all commands
  useEffect(() => {
    if (!sparqlEngine) return;

    const checkPreconditions = async () => {
      const newStates = new Map(commandStates);

      for (const cmd of actions.commands) {
        if (!cmd.preconditionSparql) {
          // No precondition means always visible
          continue;
        }

        const state = newStates.get(cmd.uid);
        if (!state) continue;

        try {
          // Set loading state
          newStates.set(cmd.uid, { ...state, isLoading: true });
          setCommandStates(new Map(newStates));

          // Execute precondition query
          const query = substituteQueryPlaceholders(cmd.preconditionSparql, targetUri);
          const result = await sparqlEngine.ask(query);

          // If precondition returns true, command is available (visible and enabled)
          newStates.set(cmd.uid, {
            isVisible: true,
            isLoading: false,
            isDisabled: !result, // Disable if precondition fails
          });
        } catch {
          // On error, keep button visible but disabled
          newStates.set(cmd.uid, {
            isVisible: true,
            isLoading: false,
            isDisabled: true,
          });
        }
      }

      setCommandStates(new Map(newStates));
    };

    checkPreconditions();
    // Re-check preconditions when target changes
  }, [targetUri, sparqlEngine, actions.commands, commandStates]);

  // Handle button click
  const handleClick = useCallback(
    async (cmd: CommandRef) => {
      if (!sparqlEngine || !cmd.groundingSparql) return;

      const currentState = commandStates.get(cmd.uid);
      if (!currentState || currentState.isLoading || currentState.isDisabled) return;

      // Set loading state
      setCommandStates((prev) => {
        const newStates = new Map(prev);
        newStates.set(cmd.uid, { ...currentState, isLoading: true });
        return newStates;
      });

      try {
        // Execute grounding query
        const query = substituteQueryPlaceholders(cmd.groundingSparql, targetUri);
        await sparqlEngine.update(query);

        // Success callback
        onCommandExecuted?.(cmd);

        // Reset loading state
        setCommandStates((prev) => {
          const newStates = new Map(prev);
          newStates.set(cmd.uid, { ...currentState, isLoading: false });
          return newStates;
        });
      } catch (error) {
        // Error callback
        onCommandError?.(cmd, error instanceof Error ? error : new Error(String(error)));

        // Reset loading state
        setCommandStates((prev) => {
          const newStates = new Map(prev);
          newStates.set(cmd.uid, { ...currentState, isLoading: false });
          return newStates;
        });
      }
    },
    [commandStates, targetUri, sparqlEngine, onCommandExecuted, onCommandError]
  );

  // Filter visible commands
  const visibleCommands = useMemo(() => {
    return actions.commands.filter((cmd) => {
      const state = commandStates.get(cmd.uid);
      return state?.isVisible !== false;
    });
  }, [actions.commands, commandStates]);

  // Determine container class based on position
  const containerClass = useMemo(() => {
    const baseClass = "exo-action-buttons";
    const positionClass = `exo-action-buttons-${actions.position}`;
    return `${baseClass} ${positionClass} ${className || ""}`.trim();
  }, [actions.position, className]);

  // Render nothing if no visible commands
  if (visibleCommands.length === 0) {
    return null;
  }

  return (
    <div className={containerClass}>
      {visibleCommands.map((cmd) => {
        const state = commandStates.get(cmd.uid);
        const isButtonDisabled =
          disabled || state?.isLoading || state?.isDisabled || !cmd.groundingSparql;
        const buttonClass = [
          "exo-action-button",
          state?.isLoading ? "exo-action-button-loading" : "",
          state?.isDisabled ? "exo-action-button-disabled" : "",
        ]
          .filter(Boolean)
          .join(" ");

        return (
          <button
            key={cmd.uid}
            className={buttonClass}
            onClick={() => handleClick(cmd)}
            disabled={isButtonDisabled}
            title={cmd.description || cmd.label}
            aria-label={cmd.label}
          >
            <span className={`exo-action-icon ${getIconClass(cmd.icon)}`} />
            {actions.showLabels && (
              <span className="exo-action-label">{cmd.label}</span>
            )}
            {state?.isLoading && (
              <span className="exo-action-spinner lucide-loader-2" />
            )}
          </button>
        );
      })}
    </div>
  );
};

/**
 * Default export for easier importing
 */
export default ActionButtons;
