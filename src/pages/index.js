import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import styles from "@/styles/Home.module.css";
import Navbar from './component/Navbar';
import { db } from './firebase';
import { collection, getDocs } from 'firebase/firestore';
import Link from 'next/link';
import Carousel from '@/pages/component/carousel';
import { Spin } from 'antd';

export default function IndexPage() {
  const [newsItems, setNewsItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNews();
  }, []);

  const fetchNews = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'news'));
      const newsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setNewsItems(newsData);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching news:', error);
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>หน้าแรก</title>
      </Head>
      <Navbar />
      <Carousel />
      <div className={styles.container}>
        <header className={styles.header}>
          <h1 className={styles.title}>ข่าวประชาสัมพันธ์</h1>
        </header>
        <main className={styles.main}>
          {loading ? (
            <div className={styles.loading}>
              <Spin size="large" />
            </div>
          ) : (
            newsItems.length === 0 ? (
              <p className={styles.noNews}>ไม่มีข่าวประชาสัมพันธ์</p>
            ) : (
              newsItems.map((item) => (
                <Link key={item.id} href={`/news/${item.id}`} legacyBehavior>
                  <a className={styles.newsLink}>
                    <div className={styles.newsItem}>
                      <div className={styles.newsContent}>
                        <h2 className={styles.newsTitle}>{item.title}</h2>
                        <p className={styles.newsDate}>โพสต์วันที่ : {item.date}</p>
                      </div>
                    </div>
                  </a>
                </Link>
              ))
            )
          )}
        </main>
      </div>
    </>
  );
}
