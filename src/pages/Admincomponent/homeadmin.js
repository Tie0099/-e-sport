import React, { useEffect, useState } from 'react';
import styles from "@/styles/homeadmin.module.css";
import Head from "next/head";
import dynamic from 'next/dynamic';
import { Row, Col, Spin } from 'antd';
import Navbar from '@/pages/Admincomponent/Navbaradmin';
import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';
import { PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';

// ใช้ dynamic import เพื่อให้โหลดไลบรารีเฉพาะ client-side
const Card = dynamic(() => import('antd/lib/card'), { ssr: false });

export default function HomeAdmin() {
  const [summaryData, setSummaryData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const usersCount = await getDocs(collection(db, 'users'));
      const competitionsCount = await getDocs(collection(db, 'competitions'));
      const newsCount = await getDocs(collection(db, 'news'));

      setSummaryData([
        { name: "ผู้ใช้", value: usersCount.size },
        { name: "การแข่งขัน", value: competitionsCount.size },
        { name: "ประชาสัมพันธ์", value: newsCount.size },
      ]);
      setLoading(false);
    };

    fetchData();
  }, []);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28'];

  return (
    <>
      <Head>
        <title>E-sport Admin Dashboard</title>
      </Head>
      <Navbar />
      <div className={styles.container}>
        <h1 className={styles.title}>Welcome, Admin</h1>
        
        {/* แสดงกราฟหากโหลดเสร็จ */}
        {loading ? (
          <Spin tip="Loading..." size="large">
            <div className={styles.loadingContent} />
          </Spin>
        ) : (
          <>
            <Row gutter={[16, 16]}>
              {summaryData.map((item, index) => (
                <Col key={index} span={8}>
                  <Card title={item.name} bordered={false}>
                    <p className={styles.cardValue}>{item.value}</p>
                  </Card>
                </Col>
              ))}
            </Row>

            {/* Pie Chart สำหรับแสดงข้อมูล */}
            <div className={styles.chartContainer}>
              <PieChart width={300} height={300}>
                <Pie
                  data={summaryData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  fill="#8884d8"
                >
                  {summaryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </div>
          </>
        )}
      </div>
    </>
  );
}
