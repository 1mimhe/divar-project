/** String id from a populated doc or a raw ObjectId/string. */
export function idOf(ref: unknown): string {
  if (typeof ref === "object" && ref !== null && "_id" in ref) {
    return String((ref as { _id: unknown })._id);
  }
  return String(ref);
}
