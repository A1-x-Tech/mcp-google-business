import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";

/**
 * Calendar-date / month schema FACTORIES (not shared consts): reusing one zod
 * object across two fields makes zod-to-json-schema dedupe them into a `$ref`
 * (e.g. endDate → #/properties/startDate), which some tool-schema consumers
 * (OpenAI Apps review) don't dereference and flag as `any`. A fresh object per
 * field keeps each one inlined with its type + pattern.
 */
export const isoDate = () =>
  z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Must be a calendar date, e.g. 2026-07-01");

export const isoMonth = () =>
  z.string().regex(/^\d{4}-\d{2}$/, "Must be a calendar month, e.g. 2026-07");

/** Wraps a value as a compact-JSON tool result (compact: the consumer is an LLM). */
export function ok(data: unknown): CallToolResult {
  const text = typeof data === "string" ? data : JSON.stringify(data);
  return { content: [{ type: "text", text: text ?? "null" }] };
}

export function fail(err: unknown): CallToolResult {
  let message = err instanceof Error ? err.message : String(err);
  // Surface the underlying cause (e.g. the network error behind a timeout) — no
  // secrets live in cause, and it makes failures far easier to diagnose.
  if (err instanceof Error && err.cause instanceof Error) message += ` (${err.cause.message})`;
  return { content: [{ type: "text", text: `Error: ${message}` }], isError: true };
}

/**
 * MCP tool annotations — hints the consuming client can use to gate or label a
 * tool. Google Business Profile is a read/write API, so each tool carries the
 * constant matching what it really does. All four hints are set explicitly:
 * some clients (OpenAI Apps review) require readOnlyHint, destructiveHint and
 * openWorldHint on every tool.
 */
export const READ_ONLY = {
  readOnlyHint: true,
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: true,
} as const;

/** Masked updates and the PUT reply upsert: repeating the same call converges. */
export const WRITE = {
  readOnlyHint: false,
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: true,
} as const;

/** Creations: replaying a create duplicates the resource. */
export const CREATE = {
  readOnlyHint: false,
  destructiveHint: false,
  idempotentHint: false,
  openWorldHint: true,
} as const;

/** Deletions: destructive, but repeat-safe (deleting twice deletes once). */
export const DESTRUCTIVE = {
  readOnlyHint: false,
  destructiveHint: true,
  idempotentHint: true,
  openWorldHint: true,
} as const;

/** raw_request can express any call, including POST creates and DELETEs. */
export const RAW = {
  readOnlyHint: false,
  destructiveHint: true,
  idempotentHint: false,
  openWorldHint: true,
} as const;
