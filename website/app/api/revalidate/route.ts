import { revalidateTag } from 'next/cache'
import { NextRequest, NextResponse } from 'next/server'

const ALLOWED_TAGS = ['chiusure', 'orari', 'agenda', 'menu', 'media', 'faq', 'localita', 'blog']

export async function POST(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get('secret')
  const tag    = req.nextUrl.searchParams.get('tag')

  if (secret !== process.env.REVALIDATE_SECRET) {
    return NextResponse.json({ success: false, error: 'Non autorizzato' }, { status: 401 })
  }
  if (!tag || !ALLOWED_TAGS.includes(tag)) {
    return NextResponse.json({ success: false, error: 'Tag non valido' }, { status: 400 })
  }

  revalidateTag(tag)
  return NextResponse.json({ success: true, revalidated: tag })
}
