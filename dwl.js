import ytdl from 'ytdl-core'
import { createWriteStream } from 'node:fs'

async function main(){
    const ytUrl = 'https://www.youtube.com/watch?v=dElRVQFqj-k'
        const info = await ytdl.getInfo(ytUrl)
        const audioFormats = info.formats.filter(f => f.mimeType.startsWith('audio'))
        audioFormats.sort((a, b) => b.audioBitrate - a.audioBitrate)
        const [bestFormat] = audioFormats
        const format = ytdl.chooseFormat(info.formats, { quality: bestFormat.itag })
        const stream = ytdl(ytUrl, {format})
        console.log(bestFormat)
        const w = createWriteStream('./"Bruno Mars - Marry you.mp3"')
        w.on('close', () => {
            console.log('done')
        })
        stream.pipe(w)
}
main()