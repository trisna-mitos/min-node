const express = require('express');
const multer = require('multer');
const Minio = require('minio');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

const minioClient = new Minio.Client({
    endPoint: 'storage.asten.id',
    port: 80,
    useSSL: false,
    accessKey: 'w00H5i2ul6bt6Je0JMda',
    secretKey: '2I8z26ChqMVCIoSMlNTkCvLusBkT1um3ve7AFOHp'
});

const upload = multer({ dest: 'uploads/' });

app.post('/upload', upload.single('file'), (req, res) => {
    const file = req.file;
    const metaData = {
        'Content-Type': file.mimetype,
    };

    minioClient.fPutObject('my-bucket', file.filename, file.path, metaData, (err, etag) => {
        if (err) {
            return res.status(500).send(err);
        }
        res.send({ etag, filename: file.filename });
    });
});

app.get('/list', (req, res) => {
    const objectsList = [];
    const stream = minioClient.listObjects('my-bucket', '', true);
    stream.on('data', obj => objectsList.push(obj));
    stream.on('end', () => res.send(objectsList));
    stream.on('error', err => res.status(500).send(err));
});

app.get('/download/:filename', (req, res) => {
    const filename = req.params.filename;
    minioClient.fGetObject('my-bucket', filename, path.join(__dirname, 'downloads', filename), (err) => {
        if (err) {
            return res.status(500).send(err);
        }
        res.download(path.join(__dirname, 'downloads', filename));
    });
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
