import http from 'node:http'
import ytdl from 'ytdl-core'

const srv = http.createServer(async (req, res) => {
    if (req.url.startsWith('/?info=')){
        const ytUrl = req.url.replace('/?info=', '')
        const info = await ytdl.getInfo(ytUrl)
        res.setHeader('content-type', 'application/json')
        res.setHeader('access-control-allow-origin', 'http://localhost:8000')
        res.write(JSON.stringify(info))
        res.end()
    }
    else {
        const ytUrl = req.url.replace('/?url=', '')
        const info = await ytdl.getInfo(ytUrl)
        const audioFormats = info.formats.filter(f => f.mimeType.startsWith('audio'))
        audioFormats.sort((a, b) => b.audioBitrate - a.audioBitrate)
        const [bestFormat] = audioFormats
        const format = ytdl.chooseFormat(info.formats, { quality: bestFormat.itag })
        const stream = ytdl(ytUrl, {format})
        console.log(bestFormat)
        res.setHeader('access-control-allow-origin', 'http://localhost:8000')
        stream.pipe(res)
    }
})

srv.listen(5555, () => {
    console.log('ytld proxy listening on 5555')
})