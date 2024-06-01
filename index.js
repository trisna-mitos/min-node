const express = require('express');
const multer = require('multer');
const Minio = require('minio');
const path = require('path');
const fs = require('fs');

const app = express();
const port = process.env.PORT || 3000;

const minioClient = new Minio.Client({
    endPoint: 'storage.asten.id',
    port: 80,
    useSSL: false,
    accessKey: 'w00H5i2ul6bt6Je0JMda',
    secretKey: '2I8z26ChqMVCIoSMlNTkCvLusBkT1um3ve7AFOHp'
});

// Test connection to MinIO
minioClient.bucketExists('my-bucket', (err) => {
    if (err) {
        console.log('Error connecting to MinIO:', err);
    } else {
        console.log('Connected to MinIO successfully!');
    }
});

const upload = multer({ dest: 'uploads/' });

app.post('/upload', upload.single('file'), (req, res) => {
    const file = req.file;
    if (!file) {
        return res.status(400).send('No file uploaded.');
    }
    const metaData = {
        'Content-Type': file.mimetype,
    };

    minioClient.fPutObject('my-bucket', file.filename, file.path, metaData, (err, etag) => {
        fs.unlinkSync(file.path);  // Delete file after upload
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
    const filePath = path.join(__dirname, 'downloads', filename);

    minioClient.fGetObject('my-bucket', filename, filePath, (err) => {
        if (err) {
            return res.status(500).send(err);
        }
        res.download(filePath, (downloadErr) => {
            if (downloadErr) {
                return res.status(500).send(downloadErr);
            }
            fs.unlinkSync(filePath);  // Delete file after download
        });
    });
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
