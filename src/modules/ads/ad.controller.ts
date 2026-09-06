import type { NextFunction, Request, Response } from "express";
import { createAd, deleteAdById, getAdById, listAds, listMyAds } from "./ad.service.ts";
import type { CreateAdDto, ListAdsQuery } from "./ad.schema.ts";
import { toWebPath } from "../uploads/upload.ts";

/** Creates an ad from multipart fields; images are optional. */
export async function create(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const dto = req.body as CreateAdDto;
    const files = (req.files as Express.Multer.File[] | undefined) ?? [];
    const ad = await createAd({
      ownerId: req.user!.id,
      dto,
      images: files.map((file) => toWebPath(file.path)),
    });
    res.status(201).json({ message: "Ad created.", ad });
  } catch (err) {
    next(err);
  }
}

/** Searches ads. Answers the pagination envelope directly. */
export async function list(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    res.status(200).json(await listAds(req.query as unknown as ListAdsQuery));
  } catch (err) {
    next(err);
  }
}

/** Shows one ad. */
export async function show(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    res.status(200).json({ ad: await getAdById(req.params.id) });
  } catch (err) {
    next(err);
  }
}

/** Ads of the caller. */
export async function mine(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    res.status(200).json({ ads: await listMyAds(req.user!.id) });
  } catch (err) {
    next(err);
  }
}

/** Deletes an ad (owner or admin). */
export async function remove(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const ad = await deleteAdById(req.params.id, { id: req.user!.id, isAdmin: req.user!.isAdmin });
    res.status(200).json({ message: "Ad deleted.", ad });
  } catch (err) {
    next(err);
  }
}
