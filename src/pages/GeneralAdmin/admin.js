import React from 'react';
import styles from "@/styles/homeadmin.module.css";
import Head from "next/head";
import Link from "next/link";
import dynamic from 'next/dynamic';
import { Row, Col } from 'antd';
import Navbar from '@/pages/GeneralAdmin/NavbarAdmin';

const Card = dynamic(() => import('antd/lib/card'), { ssr: false });

const summaryData = [
  { title: "จำนวนผู้ใช้", value: 1500 },
  { title: "จำนวนการแข่งขัน", value: 50 },
  { title: "จำนวนข่าวประชาสัมพันธ์", value: 20 },
];

export default function homeadmin() {
  return (
    <>
      <Head>
        <title>E-sport</title>
      </Head>
      <Navbar />
      <div className={styles.container}>
        <h1 className={styles.title}>Welcome, Admin</h1>
        <Row gutter={[16, 16]}>
          {summaryData.map((item, index) => (
            <Col key={index} span={8}>
              <Card title={item.title} bordered={false}>
                <p className={styles.cardValue}>{item.value}</p>
              </Card>
            </Col>
          ))}
        </Row>
        {/* <h2 className={styles.subtitle}>Quick Links</h2> */}
        {/* <div className={styles.managedata}>
          {links.map((link, index) => (
            <Link key={index} href={link.href} legacyBehavior>
              <a className={styles.data}>{link.label}</a>
            </Link>
          ))}
        </div> */}
      </div>
    </>
  );
}
