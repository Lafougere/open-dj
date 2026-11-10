import * as mm from '@yuanliwei/music-metadata-browser-es'

export function getMetaFromUrl(url: string): Promise<any> {
    return (mm as any).default.fetchFromUrl(url)
}
