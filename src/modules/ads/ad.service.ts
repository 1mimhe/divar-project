import { ApiError } from "../../common/errors/ApiError.ts";
import { toPage, type Page } from "../../common/utils/pagination.ts";
import { escapeRegExp } from "../../common/utils/regex.ts";
import { Category, requireCategory } from "../categories/category.model.ts";
import { Option, type OptionDoc } from "../options/option.model.ts";
import { deleteUploads } from "../uploads/upload.ts";
import { Ad, type AdDoc } from "./ad.model.ts";
import type { CreateAdDto, ListAdsQuery } from "./ad.schema.ts";

/** Coerces one submitted value against its option definition. */
function coerceOptionValue(
  definition: OptionDoc,
  raw: unknown,
): { ok: true; value: unknown } | { ok: false; reason: string } {
  switch (definition.type) {
    case "number": {
      const value = typeof raw === "number" ? raw : Number(raw);
      if (!Number.isFinite(value)) return { ok: false, reason: "must be a number" };
      return { ok: true, value };
    }
    case "boolean": {
      if (raw === true || raw === "true") return { ok: true, value: true };
      if (raw === false || raw === "false") return { ok: true, value: false };
      return { ok: false, reason: "must be a boolean" };
    }
    case "string": {
      if (typeof raw !== "string") return { ok: false, reason: "must be a string" };
      return { ok: true, value: raw };
    }
    case "array": {
      const values = Array.isArray(raw) ? raw : [raw];
      return { ok: true, value: values };
    }
  }
}

/**
 * Strict option check: every submitted key must be declared, every required
 * key must be present, values must match the declared type and enum.
 */
export async function resolveAdOptions(
  categoryId: unknown,
  input: Record<string, unknown>,
): Promise<Map<string, unknown>> {
  const definitions = await Option.find({ category: categoryId }).lean();
  const byKey = new Map(definitions.map((definition) => [definition.key, definition]));

  for (const key of Object.keys(input)) {
    if (!byKey.has(key)) {
      throw ApiError.badRequest(`Unknown option: ${key}.`, { field: `options.${key}` });
    }
  }

  const resolved = new Map<string, unknown>();
  for (const definition of definitions) {
    const raw = input[definition.key];
    if (raw === undefined || raw === null || raw === "") {
      if (definition.required) {
        throw ApiError.badRequest(`Missing required option: ${definition.title}.`, {
          field: `options.${definition.key}`,
        });
      }
      continue;
    }
    const coerced = coerceOptionValue(definition, raw);
    if (!coerced.ok) {
      throw ApiError.badRequest(`Invalid option ${definition.title}: ${coerced.reason}.`, {
        field: `options.${definition.key}`,
      });
    }
    const value = coerced.value;
    if (definition.enum.length > 0) {
      const candidates = Array.isArray(value) ? value : [value];
      const allowed = definition.enum as unknown[];
      for (const candidate of candidates) {
        if (!allowed.some((entry) => entry === candidate || String(entry) === String(candidate))) {
          throw ApiError.badRequest(
            `Invalid option ${definition.title}: value is not allowed.`,
            { field: `options.${definition.key}` },
          );
        }
      }
    }
    resolved.set(definition.key, value);
  }
  return resolved;
}

export interface CreateAdInput {
  ownerId: string;
  dto: CreateAdDto;
  images: string[];
}

/** Creates an ad. Category must be a leaf; options are strictly validated. */
export async function createAd({ ownerId, dto, images }: CreateAdInput): Promise<AdDoc> {
  const category = await requireCategory(dto.category);
  if (await Category.exists({ parent: category._id })) {
    throw ApiError.badRequest("Ads can only be posted in leaf categories.");
  }

  try {
    const options = await resolveAdOptions(category._id, dto.options as Record<string, unknown>);
    return await Ad.create({
      title: dto.title.trim(),
      description: dto.description.trim(),
      category: category._id,
      price: dto.price,
      images,
      province: dto.province.trim(),
      city: dto.city.trim(),
      ...(dto.district ? { district: dto.district.trim() } : {}),
      ...(dto.address ? { address: dto.address.trim() } : {}),
      showNumber: dto.showNumber,
      isActiveChat: dto.isActiveChat,
      options,
      publishedBy: ownerId,
    });
  } catch (err) {
    // Don't orphan uploaded files when validation or persistence fails.
    if (images.length > 0) await deleteUploads(images);
    throw err;
  }
}

const SORTS = {
  newest: { createdAt: -1 },
  cheapest: { price: 1 },
  expensive: { price: -1 },
} as const;

/** Searches ads with escaped filters, subtree expansion and pagination. */
export async function listAds(query: ListAdsQuery): Promise<Page<AdDoc>> {
  const filter: Record<string, unknown> = {};

  if (query.search) {
    const pattern = new RegExp(escapeRegExp(query.search), "i");
    filter.$or = [{ title: pattern }, { description: pattern }];
  }
  if (query.city) {
    filter.city = new RegExp(escapeRegExp(query.city), "i");
  }
  if (query.category) {
    const category = await Category.findOne({ slug: query.category }).lean();
    if (!category) throw ApiError.notFound("Category not found.");
    const descendants = await Category.find({ parents: category._id }, { _id: 1 }).lean();
    filter.category = { $in: [category._id, ...descendants.map((doc) => doc._id)] };
  }

  const [total, ads] = await Promise.all([
    Ad.countDocuments(filter),
    Ad.find(filter, {}, { sort: SORTS[query.sort] })
      .skip((query.page - 1) * query.limit)
      .limit(query.limit)
      .populate("category", "name slug icon"),
  ]);
  return toPage(ads, total, query.page, query.limit);
}

/** One ad with its category and owner contact. */
export async function getAdById(id: string): Promise<AdDoc> {
  const ad = await Ad.findById(id)
    .populate("category", "name slug icon")
    .populate("publishedBy", "mobile");
  if (!ad) throw ApiError.notFound("Ad not found.");
  return ad;
}

/** Ads posted by one owner, newest first. */
export async function listMyAds(ownerId: string): Promise<AdDoc[]> {
  return Ad.find({ publishedBy: ownerId }, {}, { sort: { createdAt: -1 } }).populate(
    "category",
    "name slug icon",
  );
}

export interface DeleteRequester {
  id: string;
  isAdmin: boolean;
}

/** Deletes an ad (owner or admin), its files included. */
export async function deleteAdById(id: string, requester: DeleteRequester): Promise<AdDoc> {
  // Unpopulated on purpose: ownership compares raw ObjectIds.
  const ad = await Ad.findById(id);
  if (!ad) throw ApiError.notFound("Ad not found.");
  if (String(ad.publishedBy) !== requester.id && !requester.isAdmin) {
    throw ApiError.forbidden("Only the owner can delete this ad.");
  }
  const { deletedCount } = await Ad.deleteOne({ _id: id });
  if (deletedCount === 0) throw ApiError.notFound("Ad not found.");
  await deleteUploads(ad.images);
  return ad;
}
