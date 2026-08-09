import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { GoogleBusinessClient } from "../client.js";
import { DEFAULT_READ_MASK } from "../client.js";
import { fail, ok, READ_ONLY, WRITE } from "./util.js";

/** FACTORY (see util.ts): a fresh schema per field avoids `$ref` dedup in the JSON schema. */
const readMask = () =>
  z
    .string()
    .optional()
    .describe(
      "Comma-separated FieldMask of Location fields to return, e.g. " +
        '"name,title,storefrontAddress,regularHours,metadata". The API requires it; ' +
        `omit to use the default "${DEFAULT_READ_MASK}".`,
    );

const locationId = () =>
  z
    .string()
    .min(1)
    .describe('Location id — bare "123", "locations/123" or "accounts/1/locations/123" all work.');

export function registerLocationTools(server: McpServer, client: GoogleBusinessClient): void {
  server.registerTool(
    "list_locations",
    {
      title: "List locations of an account",
      annotations: READ_ONLY,
      description:
        "Lists the business locations under an account (Business Information API). Each location's name is " +
        "locations/{id} — that id feeds locationId everywhere else (including the Performance API and, together " +
        "with the account id, the v4 reviews/posts tools). totalSize is only present when filter is set. " +
        "Fields are limited by readMask; ask for metadata to get mapsUri/placeId/newReviewUri.",
      inputSchema: {
        accountId: z
          .string()
          .min(1)
          .describe('Account id — bare "123" or "accounts/123" (get it from list_accounts).'),
        readMask: readMask(),
        pageSize: z.number().int().min(1).max(100).optional().describe("Locations per page (1..100; default 10)."),
        pageToken: z.string().optional().describe("nextPageToken from the previous page."),
        filter: z
          .string()
          .optional()
          .describe('Filter expression, e.g. \'title="Coffee Corner"\'. Also enables totalSize in the response.'),
        orderBy: z
          .string()
          .optional()
          .describe('Sort order, e.g. "title" or "title, storeCode desc".'),
      },
    },
    async ({ accountId, readMask, pageSize, pageToken, filter, orderBy }) => {
      try {
        return ok(await client.listLocations({ accountId, readMask, pageSize, pageToken, filter, orderBy }));
      } catch (e) {
        return fail(e);
      }
    },
  );

  server.registerTool(
    "get_location",
    {
      title: "Get a location",
      annotations: READ_ONLY,
      description:
        "Returns one location by id (Business Information API; v1 uses the bare locations/{id} name, no account " +
        "prefix). The readMask picks which fields come back: title, categories, storefrontAddress, phoneNumbers, " +
        "websiteUri, regularHours, specialHours, openInfo, profile (description), storeCode, latlng, " +
        "metadata (mapsUri, newReviewUri, placeId).",
      inputSchema: {
        locationId: locationId(),
        readMask: readMask(),
      },
    },
    async ({ locationId, readMask }) => {
      try {
        return ok(await client.getLocation({ locationId, readMask }));
      } catch (e) {
        return fail(e);
      }
    },
  );

  server.registerTool(
    "update_location",
    {
      title: "Update a location",
      annotations: WRITE,
      description:
        "Updates fields of a location (PATCH with a required updateMask — only masked fields change). Pass the new " +
        "values in `location`, e.g. {\"title\": \"New name\"} with updateMask \"title\". Set validateOnly to " +
        "check the change without applying it. Note: every profile has a hard cap of 10 edits per minute " +
        "(not raisable) — batch your changes into one call where possible. Returns the updated Location.",
      inputSchema: {
        locationId: locationId(),
        updateMask: z
          .string()
          .min(1)
          .describe('Comma-separated FieldMask of the fields to overwrite, e.g. "title,phoneNumbers.primaryPhone".'),
        location: z
          .record(z.any())
          .describe("Location object with the new field values (only fields named in updateMask are applied)."),
        validateOnly: z.boolean().optional().describe("If true, validate the update without applying it."),
      },
    },
    async ({ locationId, updateMask, location, validateOnly }) => {
      try {
        return ok(await client.updateLocation({ locationId, updateMask, location, validateOnly }));
      } catch (e) {
        return fail(e);
      }
    },
  );

  server.registerTool(
    "list_categories",
    {
      title: "Search business categories",
      annotations: READ_ONLY,
      description:
        "Lists/searches the reference taxonomy of business categories (e.g. gcid:restaurant). Category names " +
        "(categories/gcid:...) feed location.categories on update_location and categoryName on " +
        "list_attribute_metadata. view=FULL also returns serviceTypes and moreHoursTypes per category; " +
        'filter narrows by display name, e.g. "displayName=coffee".',
      inputSchema: {
        regionCode: z
          .string()
          .length(2)
          .describe('ISO 3166-1 alpha-2 country code the categories should be valid in, e.g. "US".'),
        languageCode: z.string().min(2).describe('BCP 47 language for display names, e.g. "en".'),
        view: z
          .enum(["BASIC", "FULL"])
          .optional()
          .describe("BASIC (default) returns name + displayName; FULL adds serviceTypes and moreHoursTypes."),
        filter: z.string().optional().describe('Filter, e.g. "displayName=coffee".'),
        pageSize: z.number().int().min(1).max(100).optional().describe("Categories per page (1..100; default 100)."),
        pageToken: z.string().optional().describe("nextPageToken from the previous page."),
      },
    },
    async ({ regionCode, languageCode, view, filter, pageSize, pageToken }) => {
      try {
        return ok(
          await client.listCategories({
            regionCode,
            languageCode,
            view: view ?? "BASIC",
            filter,
            pageSize,
            pageToken,
          }),
        );
      } catch (e) {
        return fail(e);
      }
    },
  );

  server.registerTool(
    "list_attribute_metadata",
    {
      title: "List available attributes",
      annotations: READ_ONLY,
      description:
        "Lists which attributes (e.g. wheelchair accessibility, wi-fi, payment options) are legal for a location " +
        "or for a category+region. Pass locationId for a concrete location, OR categoryName+regionCode to explore. " +
        "Each entry has parent (the attribute id for update_location_attributes), valueType (BOOL / ENUM / " +
        "REPEATED_ENUM / URL), displayName, repeatable and valueMetadata (legal values).",
      inputSchema: {
        locationId: z
          .string()
          .optional()
          .describe("Location id to list attributes for (alternative to categoryName+regionCode)."),
        categoryName: z
          .string()
          .optional()
          .describe('Category, e.g. "gcid:restaurant" or "categories/gcid:restaurant".'),
        regionCode: z.string().optional().describe("ISO 3166-1 alpha-2 country code (with categoryName)."),
        languageCode: z.string().optional().describe("BCP 47 language for display names."),
        showAll: z
          .boolean()
          .optional()
          .describe("Return the whole attribute catalog (requires regionCode + languageCode)."),
        pageSize: z.number().int().min(1).max(200).optional().describe("Attributes per page (default 200)."),
        pageToken: z.string().optional().describe("nextPageToken from the previous page."),
      },
    },
    async ({ locationId, categoryName, regionCode, languageCode, showAll, pageSize, pageToken }) => {
      try {
        return ok(
          await client.listAttributeMetadata({
            locationId,
            categoryName,
            regionCode,
            languageCode,
            showAll,
            pageSize,
            pageToken,
          }),
        );
      } catch (e) {
        return fail(e);
      }
    },
  );

  server.registerTool(
    "update_location_attributes",
    {
      title: "Update location attributes",
      annotations: WRITE,
      description:
        "Updates attributes of a location (PATCH). Each attribute needs its name (attributes/{attribute_id} from " +
        "list_attribute_metadata's parent field) plus values (BOOL/ENUM), uriValues (URL) or repeatedEnumValue " +
        "({setValues, unsetValues}). attributeMask defaults to the names of the attributes you pass; name an " +
        "attribute in the mask with no values to clear it. Counts against the 10 edits/min per-profile cap.",
      inputSchema: {
        locationId: locationId(),
        attributes: z
          .array(
            z
              .object({ name: z.string().min(1).describe("attributes/{attribute_id}") })
              .passthrough(),
          )
          .describe(
            "Attribute objects to set, e.g. " +
              '[{"name": "attributes/wi_fi", "repeatedEnumValue": {"setValues": ["free_wi_fi"]}}].',
          ),
        attributeMask: z
          .string()
          .optional()
          .describe("Comma-separated attribute names to update. Defaults to the names of `attributes`."),
      },
    },
    async ({ locationId, attributes, attributeMask }) => {
      try {
        return ok(await client.updateLocationAttributes({ locationId, attributes, attributeMask }));
      } catch (e) {
        return fail(e);
      }
    },
  );

  server.registerTool(
    "search_chains",
    {
      title: "Search chains",
      annotations: READ_ONLY,
      description:
        "Searches business chains by name (exact/partial/fuzzy), ranked by relevance. Each chain has name " +
        "(chains/{chain_id}), chainNames, websites and locationCount. Use the chain name when relating a " +
        "location to its brand (location.relationshipData).",
      inputSchema: {
        chainName: z.string().min(1).describe('Chain name to search for, e.g. "walmart".'),
        pageSize: z.number().int().min(1).max(500).optional().describe("Matches to return (1..500; default 10)."),
      },
    },
    async ({ chainName, pageSize }) => {
      try {
        return ok(await client.searchChains({ chainName, pageSize }));
      } catch (e) {
        return fail(e);
      }
    },
  );
}
