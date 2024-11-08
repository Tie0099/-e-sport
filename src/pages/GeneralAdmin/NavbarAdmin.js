import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import styles from '@/styles/Navbaradmin.module.css';

const DownOutlined = dynamic(() => import('@ant-design/icons/DownOutlined'), { ssr: false });
const Dropdown = dynamic(() => import('antd/lib/dropdown'), { ssr: false });
const Menu = dynamic(() => import('antd/lib/menu'), { ssr: false });
const Space = dynamic(() => import('antd/lib/space'), { ssr: false });

export default function Navbar() {
  const [open, setOpen] = useState(false);

  const handleMenuClick = (e) => {
    if (e.key === '3') {
      setOpen(false);
    }
  };

  const handleOpenChange = (nextOpen) => {
    setOpen(nextOpen);
  };

  const items = [
    {
      label: (
        <Link href='/Admincomponent/ManageCompetition' legacyBehavior>
          <a className={styles.data}>จัดการข้อมูลการแข่งขัน</a>
        </Link>
      ),
      key: '1',
    },
    {
      label: (
        <Link href='/Admincomponent/ManagePairingInformation' legacyBehavior>
          <a className={styles.data}>จัดการข้อมูลการจับคู่และผลการแข่ง</a>
        </Link>
      ),
      key: '2',
    },
  ];

  const menu = (
    <Menu items={items} onClick={handleMenuClick} />
  );

  return (
    <nav className={styles.navbar}>
      <div className={styles.logo}>
        <Link href="/Admincomponent/homeadmin" legacyBehavior>
          <a>
            <Image src="/logo.png" width={60} height={69} alt="logo" />
          </a>
        </Link>
      </div>
      <div className={styles.navLinks}>
        {/* <Link href='/Admincomponent/ManageAccess' legacyBehavior>
          <a className={styles.data}>จัดการข้อมูลผู้ดูแลระบบ</a>
        </Link> */}
        <Link href='/Admincomponent/ManageUser' legacyBehavior>
          <a className={styles.data}>จัดการข้อมูลสมาชิก</a>
        </Link>
        <Link href='/Admincomponent/ManageNews' legacyBehavior>
          <a className={styles.data}>จัดการข้อมูลประชาสัมพันธ์</a>
        </Link>
        <Dropdown overlay={menu} onOpenChange={handleOpenChange} open={open}>
          <a className={styles.data} onClick={(e) => e.preventDefault()}>
            <Space>
              จัดการข้อมูลการแข่งขัน
              <DownOutlined />
            </Space>
          </a>
        </Dropdown>
      </div>
      <div className={styles.profile}>
        <Link href="/Loginadmin/login" legacyBehavior>
          <a className={styles.Logout}>ออกจากระบบ</a>
        </Link>
      </div>
    </nav>
  );
}
