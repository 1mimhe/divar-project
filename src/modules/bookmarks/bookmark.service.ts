import { ApiError } from "../../common/errors/ApiError.ts";
import { getAdById } from "../ads/ad.service.ts";
import { Bookmark, type BookmarkDoc } from "./bookmark.model.ts";

/** Bookmarks an ad. Idempotent: re-bookmarking answers 200, not a duplicate. */
export async function bookmarkAd(userId: string, adId: string): Promise<BookmarkDoc> {
  const ad = await getAdById(adId);
  const bookmark = await Bookmark.findOneAndUpdate(
    { user: userId, ad: ad._id },
    { $setOnInsert: { user: userId, ad: ad._id, adTitle: ad.title } },
    { upsert: true, new: true },
  );
  if (!bookmark) throw ApiError.notFound("Ad not found.");
  return bookmark;
}

/** Removes a bookmark or throws 404. */
export async function unbookmarkAd(userId: string, adId: string): Promise<void> {
  const { deletedCount } = await Bookmark.deleteOne({ user: userId, ad: adId });
  if (deletedCount === 0) throw ApiError.notFound("Bookmark not found.");
}

/** All bookmarks of one user, newest first. Empty answers `[]`. */
export async function listBookmarks(userId: string): Promise<BookmarkDoc[]> {
  return Bookmark.find({ user: userId }, {}, { sort: { createdAt: -1 } }).populate(
    "ad",
    "title price city images",
  );
}
