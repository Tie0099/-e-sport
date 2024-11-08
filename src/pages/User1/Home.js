import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import styles from "@/styles/Home.module.css";
import Favber from '@/pages/component/Favbar';
import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';
import Link from 'next/link';
import Carousel from '@/pages/component/carousel';

export default function IndexPage() {
  const [newsItems, setNewsItems] = useState([]);

  useEffect(() => {
    fetchNews();
  }, []);

  const fetchNews = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'news'));
      const newsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setNewsItems(newsData);
    } catch (error) {
      console.error('Error fetching news:', error);
    }
  };

  return (
    <>
      <Head>
        <title>หน้าเเรก</title>
      </Head>
      <Favber/>
      <Carousel/>
      <div className={styles.container}>
        <header className={styles.header}>
          <h1 className={styles.title}>ข่าวประชาสัมพันธ์</h1>
        </header>
        <main className={styles.main}>
          {newsItems.map((item) => (
            <Link key={item.id} href={`/news1/${item.id}`} legacyBehavior>
              <a className={styles.newsLink}>
                <div className={styles.newsItem}>
                  <div className={styles.newsContent}>
                    <h2 className={styles.newsTitle}>{item.title}</h2>
                    <p className={styles.newsDate}>โพสต์วันที่ :  {item.date}</p>
                  </div>
                </div>
              </a>
            </Link>
          ))}
        </main>
      </div>
    </>
  );
}
