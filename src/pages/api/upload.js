// pages/api/upload.js
import formidable from 'formidable';
import fs from 'fs';
import path from 'path';

export const config = {
  api: {
    bodyParser: false,
  },
};

const uploadDir = path.join(process.cwd(), '/public/uploads');

const handler = async (req, res) => {
  const form = new formidable.IncomingForm();
  form.uploadDir = uploadDir;
  form.keepExtensions = true;

  form.parse(req, (err, fields, files) => {
    if (err) {
      console.error(err);
      res.status(500).json({ message: 'Upload failed' });
      return;
    }

    const file = files.file;
    const newFilePath = path.join(uploadDir, file.originalFilename);

    fs.rename(file.filepath, newFilePath, (err) => {
      if (err) {
        console.error(err);
        res.status(500).json({ message: 'Upload failed' });
        return;
      }
      res.status(200).json({ message: 'Upload successful', filePath: `/uploads/${file.originalFilename}` });
    });
  });
};

export default handler;
