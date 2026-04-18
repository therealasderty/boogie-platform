import { NextResponse } from 'next/server'
import { fetchMedia } from '@/lib/media'

export async function GET(req: Request) {
  const tag = new URL(req.url).searchParams.get('tag') || ''
  const items = await fetchMedia(tag)
  return NextResponse.json({ tag, count: items.length, items })
}
