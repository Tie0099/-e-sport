import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import Head from 'next/head';
import styles from '@/styles/NewsDetail.module.css';
import Navbar from '../component/Navbar';

const NewsDetail = () => {
  const router = useRouter();
  const { id } = router.query;
  const [newsItem, setNewsItem] = useState(null);

  useEffect(() => {
    if (id) {
      fetchNewsDetail();
    }
  }, [id]);

  const fetchNewsDetail = async () => {
    try {
      const docRef = doc(db, 'news', id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setNewsItem(docSnap.data());
      } else {
        console.log('No such document!');
      }
    } catch (error) {
      console.error('Error fetching news detail:', error);
    }
  };

  return (
    <>
      <Head>
        <title>{newsItem ? newsItem.title : 'Loading...'}</title>
      </Head>
      <Navbar />
      <div className={styles.container}>
        {newsItem ? (
          <>
            <h1 className={styles.title}>{newsItem.title}</h1>
            <p className={styles.date}>โพสต์วันที่ :  {newsItem.date}</p>
            <div className={styles.imageContainer}>
              {newsItem.imageUrls && newsItem.imageUrls.map((url, index) => (
                <img key={index} src={url} alt={`News Image ${index + 1}`} className={styles.newsImage} />
              ))}
            </div>
            <p className={styles.details}>{newsItem.details}</p>
          </>
        ) : (
          <p>Loading...</p>
        )}
      </div>
    </>
  );
};

export default NewsDetail;
