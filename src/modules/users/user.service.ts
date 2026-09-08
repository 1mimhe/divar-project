import { ApiError } from "../../common/errors/ApiError.ts";
import { User, type UserDoc } from "./user.model.ts";

/** Admin user list. Secrets never leave the DB (`toJSON` strips them). */
export async function listUsers(): Promise<UserDoc[]> {
  return User.find({}, {}, { sort: { _id: -1 } });
}

/** Finds by id or throws 404. */
export async function getUserById(id: string): Promise<UserDoc> {
  const user = await User.findById(id);
  if (!user) throw ApiError.notFound("User Not Found.");
  return user;
}
