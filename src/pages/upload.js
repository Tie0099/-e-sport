// pages/upload.js
import React, { useState } from 'react';
import Head from 'next/head';
import styles from '@/styles/Home.module.css';
import Navbar from '../components/Navbar';

export default function UploadPage() {
  const [file, setFile] = useState(null);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });

    if (res.ok) {
      alert('Upload successful!');
    } else {
      alert('Upload failed.');
    }
  };

  return (
    <>
      <Head>
        <title>Upload Image</title>
      </Head>
      <Navbar />
      <div className={styles.container}>
        <h1 className={styles.title}>Upload Image</h1>
        <form onSubmit={handleSubmit}>
          <input type="file" onChange={handleFileChange} />
          <button type="submit">Upload</button>
        </form>
      </div>
    </>
  );
}
