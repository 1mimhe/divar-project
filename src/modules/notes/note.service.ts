import { ApiError } from "../../common/errors/ApiError.ts";
import { getAdById } from "../ads/ad.service.ts";
import { Note, type NoteDoc } from "./note.model.ts";

/** Creates or replaces the caller's note on an ad (one note per user+ad). */
export async function upsertNote(
  userId: string,
  adId: string,
  content: string,
): Promise<{ note: NoteDoc; created: boolean }> {
  const ad = await getAdById(adId);
  const existing = await Note.findOne({ user: userId, ad: ad._id });
  if (existing) {
    existing.content = content;
    existing.adTitle = ad.title;
    await existing.save();
    return { note: existing, created: false };
  }
  const note = await Note.create({ user: userId, ad: ad._id, content, adTitle: ad.title });
  return { note, created: true };
}

/** Deletes the caller's note on an ad or throws 404. */
export async function deleteNote(userId: string, adId: string): Promise<void> {
  const { deletedCount } = await Note.deleteOne({ user: userId, ad: adId });
  if (deletedCount === 0) throw ApiError.notFound("Note not found.");
}

/** All notes of one user, newest first. Empty answers `[]`. */
export async function listNotes(userId: string): Promise<NoteDoc[]> {
  return Note.find({ user: userId }, {}, { sort: { createdAt: -1 } }).populate(
    "ad",
    "title price city",
  );
}

/** The caller's note on one ad or throws 404. */
export async function getNote(userId: string, adId: string): Promise<NoteDoc> {
  const note = await Note.findOne({ user: userId, ad: adId });
  if (!note) throw ApiError.notFound("Note not found.");
  return note;
}
