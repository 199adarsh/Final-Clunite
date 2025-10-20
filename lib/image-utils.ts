import { supabase } from './supabase'

/**
 * Upload an image to Supabase Storage with user-specific folder structure
 * @param file - The image file to upload
 * @param userId - The authenticated user's ID
 * @param folder - The folder path in the storage bucket (default: 'event-banners')
 * @returns Promise with the public URL of the uploaded image
 */
export async function uploadImageToSupabase(
  file: File, 
  userId: string,
  folder: string = 'event-banners'
): Promise<{ url: string; path: string }> {
  // Validate file type
  if (!file.type.startsWith('image/')) {
    throw new Error('Please select a valid image file')
  }

  // Validate file size (10MB limit)
  if (file.size > 10 * 1024 * 1024) {
    throw new Error('Image must be less than 10MB')
  }

  // Generate unique filename with user ID folder structure
  const timestamp = Date.now()
  const randomString = Math.random().toString(36).substring(2, 15)
  const fileExtension = file.name.split('.').pop()
  const filename = `${userId}/${folder}/${timestamp}-${randomString}.${fileExtension}`

  // Convert File to ArrayBuffer
  const fileBuffer = await file.arrayBuffer()

  // Upload to Supabase Storage
  const { data, error } = await supabase.storage
    .from('images')
    .upload(filename, fileBuffer, {
      contentType: file.type,
      cacheControl: '3600',
      upsert: false
    })

  if (error) {
    console.error('Supabase upload error:', error)
    throw new Error(`Upload failed: ${error.message}`)
  }

  // Get the public URL
  const { data: { publicUrl } } = supabase.storage
    .from('images')
    .getPublicUrl(filename)

  return {
    url: publicUrl,
    path: filename
  }
}

/**
 * Delete an image from Supabase Storage
 * @param path - The file path in the storage bucket
 * @returns Promise<boolean> - Success status
 */
export async function deleteImageFromSupabase(path: string): Promise<boolean> {
  try {
    const { error } = await supabase.storage
      .from('images')
      .remove([path])

    if (error) {
      console.error('Error deleting image:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error deleting image:', error)
    return false
  }
}

/**
 * Get the public URL for an image in Supabase Storage
 * @param path - The file path in the storage bucket
 * @returns The public URL
 */
export function getImageUrl(path: string): string {
  const { data: { publicUrl } } = supabase.storage
    .from('images')
    .getPublicUrl(path)
  
  return publicUrl
}

/**
 * Check if a URL is a Supabase Storage URL
 * @param url - The URL to check
 * @returns boolean
 */
export function isSupabaseStorageUrl(url: string): boolean {
  return url.includes('supabase') && url.includes('/storage/v1/object/public/')
}

/**
 * Extract the file path from a Supabase Storage URL
 * @param url - The Supabase Storage URL
 * @returns The file path or null if not a valid Supabase URL
 */
export function extractPathFromSupabaseUrl(url: string): string | null {
  if (!isSupabaseStorageUrl(url)) {
    return null
  }

  const match = url.match(/\/storage\/v1\/object\/public\/images\/(.+)$/)
  return match ? match[1] : null
}
