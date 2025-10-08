// lib/appwrite.ts
import {
  Client,
  Account,
  Databases,
  Storage,
  Avatars,
  ID,
  Query,
  Permission,
  Role,
} from "appwrite";

export { ID, Query, Permission, Role };

let _client: Client | null = null;

export function getClient() {
  if (_client) return _client;
  const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
  const project = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;

  if (!endpoint || (!project && process.env.NODE_ENV !== "production")) {
    console.warn(
      "[Appwrite] Missing NEXT_PUBLIC_APPWRITE_ENDPOINT or NEXT_PUBLIC_APPWRITE_PROJECT_ID"
    );
  }

  _client = new Client().setEndpoint(endpoint ?? "").setProject(project ?? "");
  return _client;
}

export function getAccount() {
  return new Account(getClient());
}

export function getDatabases() {
  return new Databases(getClient());
}

export function getStorage() {
  return new Storage(getClient());
}

export function getAvatars() {
  return new Avatars(getClient());
}
