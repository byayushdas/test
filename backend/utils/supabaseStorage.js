const { createClient } = require('@supabase/supabase-js');

// Must use the SERVICE_ROLE_KEY on the backend to bypass RLS for administrative uploads
// and to access private buckets securely without relying on frontend Supabase Auth.
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

let supabase = null;
if (supabaseUrl && supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

/**
 * Uploads a base64 encoded string to Supabase Storage.
 * @param {string} base64Data - The full data URL or raw base64 string.
 * @param {string} bucketName - Target bucket (e.g., 'public-images' or 'kyc-documents')
 * @param {string} path - The folder/filename to store it as (e.g., `user-123/profile.png`)
 * @returns {Promise<string>} - The public URL or the private storage path.
 */
async function uploadBase64(base64Data, bucketName, path) {
  if (!supabase) {
    console.warn('Supabase is not configured. Skipping upload.');
    return base64Data; // fallback for local dev if not configured
  }

  // Check if it's already a URL (e.g., during updates where the image wasn't changed)
  if (base64Data.startsWith('http')) {
    return base64Data;
  }

  const matches = base64Data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
  
  let contentType = 'application/octet-stream';
  let buffer;

  if (matches && matches.length === 3) {
    contentType = matches[1];
    buffer = Buffer.from(matches[2], 'base64');
  } else {
    buffer = Buffer.from(base64Data, 'base64');
  }

  const { data, error } = await supabase
    .storage
    .from(bucketName)
    .upload(path, buffer, {
      contentType,
      upsert: true
    });

  if (error) {
    throw new Error(`Supabase upload failed: ${error.message}`);
  }

  // Public bucket: return full URL
  if (bucketName === 'public-images') {
    const { data: publicUrlData } = supabase.storage.from(bucketName).getPublicUrl(data.path);
    return publicUrlData.publicUrl;
  }

  // Private bucket: return internal storage path (DO NOT expose public URLs for KYC)
  return data.path; 
}

/**
 * Generates a signed URL for temporary access to a private file.
 * Used when admins need to review KYC documents.
 */
async function getSignedUrl(bucketName, path, expiresIn = 3600) {
  if (!supabase) return path;
  
  // If it's somehow already a full URL, return it
  if (path.startsWith('http')) return path;

  const { data, error } = await supabase.storage.from(bucketName).createSignedUrl(path, expiresIn);
  if (error) throw error;
  return data.signedUrl;
}

module.exports = {
  uploadBase64,
  getSignedUrl,
  supabase
};
