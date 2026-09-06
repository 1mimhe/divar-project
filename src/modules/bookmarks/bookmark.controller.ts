import type { NextFunction, Request, Response } from "express";
import { bookmarkAd, listBookmarks, unbookmarkAd } from "./bookmark.service.ts";

/** Bookmarks an ad (idempotent). */
export async function add(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const bookmark = await bookmarkAd(req.user!.id, req.params.adId);
    res.status(200).json({ message: "Ad bookmarked.", bookmark });
  } catch (err) {
    next(err);
  }
}

/** Removes a bookmark. */
export async function remove(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await unbookmarkAd(req.user!.id, req.params.adId);
    res.status(200).json({ message: "Ad unbookmarked." });
  } catch (err) {
    next(err);
  }
}

/** Lists the caller's bookmarks. */
export async function listMine(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    res.status(200).json({ bookmarks: await listBookmarks(req.user!.id) });
  } catch (err) {
    next(err);
  }
}
