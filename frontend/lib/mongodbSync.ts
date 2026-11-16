// DEPRECATED: Database synchronization logic has been migrated exclusively to Express Backend (backend/src).
// Frontend components must call Express API endpoints at http://localhost:5001/api/v1/...

export async function syncUserToMongoDB(userData: any) {
  console.log("ℹ️ [DEPRECATED] syncUserToMongoDB called in frontend. Data operations are managed by Express Backend.");
  return;
}
