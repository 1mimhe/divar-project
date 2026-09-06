import type { NextFunction, Request, Response } from "express";
import { deleteNote, getNote, listNotes, upsertNote } from "./note.service.ts";
import type { UpsertNoteDto } from "./note.schema.ts";

/** Creates or replaces the caller's note on an ad. */
export async function save(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { content } = req.body as UpsertNoteDto;
    const { note, created } = await upsertNote(req.user!.id, req.params.adId, content);
    res.status(created ? 201 : 200).json({ message: "Note saved.", note });
  } catch (err) {
    next(err);
  }
}

/** Deletes the caller's note on an ad. */
export async function remove(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await deleteNote(req.user!.id, req.params.adId);
    res.status(200).json({ message: "Note deleted." });
  } catch (err) {
    next(err);
  }
}

/** Shows the caller's note on one ad. */
export async function show(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    res.status(200).json({ note: await getNote(req.user!.id, req.params.adId) });
  } catch (err) {
    next(err);
  }
}

/** Lists the caller's notes. */
export async function listMine(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    res.status(200).json({ notes: await listNotes(req.user!.id) });
  } catch (err) {
    next(err);
  }
}
