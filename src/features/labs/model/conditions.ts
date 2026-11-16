/**
 * A deliberately small condition evaluator for mock/schema labs. It supports structured
 * `{left, op, right}` conditions and simple string expressions such as `field.risk_rating >= 4`
 * or `choice.stop_work == "yes"`. It never evaluates arbitrary JavaScript.
 */
import type { LabCondition } from "../api/contract";

export type ConditionContext = Record<string, unknown>;

const OPS = ["gte", "lte", "neq", "eq", "gt", "lt", "in", "contains", "exists"] as const;

function readPath(context: ConditionContext, path: string): unknown {
  const parts = path.split(".").filter(Boolean);
  let current: unknown = context;
  for (const part of parts) {
    if (current == null || typeof current !== "object") return undefined;
    current = (current as Record<string, unknown>)[part];
  }
  return current;
}

function compare(left: unknown, op: string, right: unknown): boolean {
  switch (op) {
    case "eq":
      return left === right;
    case "neq":
      return left !== right;
    case "gt":
      return Number(left) > Number(right);
    case "gte":
      return Number(left) >= Number(right);
    case "lt":
      return Number(left) < Number(right);
    case "lte":
      return Number(left) <= Number(right);
    case "in":
      return Array.isArray(right) ? right.includes(left) : false;
    case "contains":
      if (Array.isArray(left)) return left.includes(right);
      return String(left ?? "").includes(String(right ?? ""));
    case "exists":
      return left !== undefined && left !== null;
    default:
      return false;
  }
}

export function evaluateCondition(condition: LabCondition | undefined, context: ConditionContext): boolean {
  if (!condition) return true;
  if (typeof condition === "string") {
    const match = condition.trim().match(/^([\w.]+)\s*(>=|<=|==|!=|>|<)\s*(.+)$/);
    if (!match) return false;
    const [, left, operator, rawRight] = match;
    const rightText = rawRight.trim().replace(/^["']|["']$/g, "");
    const right = /^-?\d+(\.\d+)?$/.test(rightText) ? Number(rightText) : rightText === "true" ? true : rightText === "false" ? false : rightText;
    const op = ({ ">=": "gte", "<=": "lte", "==": "eq", "!=": "neq", ">": "gt", "<": "lt" } as const)[operator as ">=" | "<=" | "==" | "!=" | ">" | "<"];
    return compare(readPath(context, left), op, right);
  }

  const { left, op, right } = condition;
  if (!OPS.includes(op as (typeof OPS)[number])) return false;
  return compare(readPath(context, left), op, right);
}

export function evaluateConditions(conditions: readonly LabCondition[] | undefined, context: ConditionContext): boolean {
  return (conditions ?? []).every((condition) => evaluateCondition(condition, context));
}
