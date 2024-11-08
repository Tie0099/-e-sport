import React from 'react'
// import Login from './Login';
// import SignUp from './SignUp';
import styles from "@/styles/homeadmin.module.css"
import Head from "next/head"
import Image from "next/image"
import Link from "next/link"
import Navbar from '@/pages/Admincomponent/Navbaradmin'
export default function ManageCompetition() {
    return (
        <>
        <Head>
        <title>E-sport</title>
      </Head>
      <Navbar />
        <div className={styles.container}>
        <div className={styles.managedata}>
          <a href='/Admincomponent/ManageCompetition' className={styles.data}>จัดการข้อมูลการเเข่งขัน</a>
          <a href='/Admincomponent/ManagPeairingInformation' className={styles.data}>จัดการข้อมูลการจับคู่เเละผลการเเข่ง</a>
        </div>
      </div>
      </>
      );
    }