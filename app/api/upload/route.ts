import { createClient } from "@supabase/supabase-js"
import { type NextRequest, NextResponse } from "next/server"

// Create Supabase client with service role key for server-side operations
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// Initialize supabase only if we have the required configuration
const supabase = supabaseUrl && supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  : null

export async function POST(request: NextRequest) {
  console.log("Upload API called")
  
  try {
    console.log("Parsing form data...")
    const formData = await request.formData()
    const file = formData.get("file") as File
    const userId = formData.get("userId") as string
    const bucket = (formData.get("bucket") as string) || "Club Banner" // Default to Club Banner

    console.log("File received:", file ? `${file.name} (${file.size} bytes)` : "No file")
    console.log("User ID:", userId)
    console.log("Target bucket:", bucket)

    if (!file) {
      console.error("No file provided in request")
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Validate file type
    const validImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
    if (!validImageTypes.includes(file.type.toLowerCase())) {
      return NextResponse.json({ 
        error: "Invalid file type. Please upload an image (JPEG, PNG, WebP, or GIF)." 
      }, { status: 400 })
    }

    // Validate file size (10MB limit)
    const MAX_SIZE = 10 * 1024 * 1024 // 10MB
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ 
        error: "File too large. Maximum size is 10MB." 
      }, { status: 400 })
    }

    // Generate unique filename
    const timestamp = Date.now()
    const randomString = Math.random().toString(36).substring(2, 15)
    const fileExtension = file.name.split('.').pop()?.toLowerCase() || 'jpg'
    const filename = `${timestamp}-${randomString}.${fileExtension}`

    console.log("Generated filename:", filename)

    // Convert File to Buffer for Supabase upload
    console.log("Converting file to buffer...")
    const arrayBuf = await file.arrayBuffer()
    const fileBuffer = Buffer.from(arrayBuf)
    console.log("Buffer size:", fileBuffer.byteLength)

    // Validate bucket name
    const validBuckets = ["Club Banner", "Event Banner"]
    if (!validBuckets.includes(bucket)) {
      return NextResponse.json({ 
        error: `Invalid bucket. Must be one of: ${validBuckets.join(", ")}` 
      }, { status: 400 })
    }

    // Try to upload to Supabase Storage
    if (supabase) {
      console.log(`Uploading to Supabase Storage bucket: ${bucket}...`)
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(filename, fileBuffer, {
          contentType: file.type,
          cacheControl: "3600",
          upsert: false,
        })

      if (error) {
        console.error("Supabase upload error:", error)
        // Fall back to placeholder if upload fails
        const placeholderUrl = `https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&h=400&fit=crop`
        return NextResponse.json({
          url: placeholderUrl,
          path: filename,
          size: file.size,
          type: file.type,
          message: "Using placeholder (upload failed)"
        })
      }

      console.log("Upload successful, data:", data)

      // Get the public URL
      const { data: publicUrlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(filename)
      
      const publicUrl = publicUrlData?.publicUrl

      if (publicUrl) {
        console.log("Generated public URL:", publicUrl)
        return NextResponse.json({
          url: publicUrl,
          path: filename,
          size: file.size,
          type: file.type,
        })
      }
    }

    // Fallback if Supabase is not configured
    const placeholderUrl = `https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&h=400&fit=crop`
    return NextResponse.json({
      url: placeholderUrl,
      path: filename,
      size: file.size,
      type: file.type,
      message: "Using placeholder (Supabase not configured)"
    })
  } catch (error) {
    console.error("Upload error:", error)
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({ 
      error: "Upload failed. Please try again.",
      details: errorMessage 
    }, { status: 500 })
  }
}