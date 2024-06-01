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

// Use memory storage
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

app.post('/upload', upload.single('file'), (req, res) => {
    const file = req.file;
    if (!file) {
        return res.status(400).send('No file uploaded.');
    }
    const metaData = {
        'Content-Type': file.mimetype,
    };

    minioClient.putObject('temp-test', file.originalname, file.buffer, metaData, (err, etag) => {
        if (err) {
            return res.status(500).send(err);
        }
        res.send({ etag, filename: file.originalname });
    });
});

app.get('/list', (req, res) => {
    const objectsList = [];
    const stream = minioClient.listObjects('temp-test', '', true);
    stream.on('data', obj => objectsList.push(obj));
    stream.on('end', () => res.send(objectsList));
    stream.on('error', err => res.status(500).send(err));
});

app.get('/download/:filename', (req, res) => {
    const filename = req.params.filename;

    minioClient.getObject('temp-test', filename, (err, dataStream) => {
        if (err) {
            return res.status(500).send(err);
        }
        res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
        dataStream.pipe(res);
    });
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
