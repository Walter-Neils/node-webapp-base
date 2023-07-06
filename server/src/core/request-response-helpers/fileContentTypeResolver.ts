import path from 'path';
export function getContentType(requestedPath: string)
{
    const ext = path.extname(requestedPath);
    switch (ext)
    {
        case '.html':
            return 'text/html';
        case '.js':
            return 'text/javascript';
        case '.css':
            return 'text/css';
        case '.json':
            return 'application/json';
        case '.png':
            return 'image/png';
        case '.jpg':
            return 'image/jpg';
        default:
            return 'text/plain';
    }
}