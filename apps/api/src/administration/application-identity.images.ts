import { BadRequestException } from '@nestjs/common'
// The project uses legacy CommonJS resolution; sharp publishes separate ESM/CJS declarations.
const sharp: typeof import('sharp').default = require('sharp')

export const MAX_ICON_BYTES = 5 * 1024 * 1024

export async function generateApplicationIcons(bytes: Buffer) {
  try {
    const image = sharp(bytes, { limitInputPixels: 16_000_000, failOn: 'warning', animated: false })
    const metadata = await image.metadata()
    if (!['png', 'jpeg', 'webp'].includes(metadata.format ?? '') || (metadata.pages ?? 1) !== 1 || !metadata.width || !metadata.height) throw new Error('Unsupported image')
    const source = await image.rotate().png().toBuffer()
    const background = '#171013'
    const resize = (size: number) => sharp(source).resize(size, size, { fit: 'contain', background }).flatten({ background }).png().toBuffer()
    const [icon180, icon192, icon512, maskable] = await Promise.all([
      resize(180), resize(192), resize(512),
      sharp(source).resize(352, 352, { fit: 'contain', background }).flatten({ background })
        .extend({ top: 80, bottom: 80, left: 80, right: 80, background }).png().toBuffer(),
    ])
    return { icon180, icon192, icon512, maskable }
  } catch {
    throw new BadRequestException({ code: 'APPLICATION_ICON_INVALID', message: 'Usa una imagen PNG, JPEG o WebP estática de hasta 16 megapíxeles.' })
  }
}
