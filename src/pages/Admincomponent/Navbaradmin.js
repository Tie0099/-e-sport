import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { Modal } from 'antd';
import { useRouter } from 'next/router';
import { auth, db } from '../firebase'; // นำเข้า Firebase auth และ db
import { doc, getDoc } from 'firebase/firestore'; // นำเข้า getDoc จาก Firestore
import styles from '@/styles/Navbaradmin.module.css';

const DownOutlined = dynamic(() => import('@ant-design/icons/DownOutlined'), { ssr: false });
const Dropdown = dynamic(() => import('antd/lib/dropdown'), { ssr: false });
const Menu = dynamic(() => import('antd/lib/menu'), { ssr: false });
const Space = dynamic(() => import('antd/lib/space'), { ssr: false });

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [currentUserName, setCurrentUserName] = useState(''); // State สำหรับชื่อผู้ใช้
  const [loading, setLoading] = useState(true); // เพิ่ม state สำหรับจัดการโหลดข้อมูล
  const router = useRouter();

  // ฟังก์ชันดึงข้อมูลผู้ใช้ปัจจุบันจาก collection 'Admin'
  useEffect(() => {
    const fetchAdminName = async () => {
      const user = auth.currentUser;
      
      if (user) {
        console.log('Current user UID:', user.uid); // ตรวจสอบ uid ของผู้ใช้
        
        try {
          const docRef = doc(db, 'Admin', user.uid); // ใช้ uid ที่ดึงมาจาก auth.currentUser
          const docSnap = await getDoc(docRef);
          
          if (docSnap.exists()) {
            console.log('Admin document found:', docSnap.data()); // Log ข้อมูลของเอกสารที่เจอ
            setCurrentUserName(docSnap.data().name); // ดึงชื่อผู้ใช้มาแสดง
            setLoading(false); // ปิดสถานะโหลดเมื่อดึงข้อมูลสำเร็จ
          } else {
            console.log('ไม่มีข้อมูลผู้ใช้นี้');
            setLoading(false); // ปิดสถานะโหลดเมื่อดึงข้อมูลไม่สำเร็จ
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
          setLoading(false);
        }
      } else {
        console.log('ยังไม่มีผู้ใช้ล็อกอิน');
        setLoading(false);
      }
    };
    
    fetchAdminName();
  }, []);  

  const handleMenuClick = (e) => {
    if (e.key === '3') {
      setOpen(false);
    }
  };

  const handleOpenChange = (nextOpen) => {
    setOpen(nextOpen);
  };

  const handleLogout = () => {
    setShowLogoutModal(true); 
  };

  const confirmLogout = () => {
    console.log('ออกจากระบบ');
    auth.signOut(); // ทำการล็อกเอาท์
    setShowLogoutModal(false);
    router.push('/');
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
        <Link href='/Admincomponent/PairingsAndResults' legacyBehavior>
          <a className={styles.data}>จัดการข้อมูลการจับคู่และผลการแข่ง</a>
        </Link>
      ),
      key: '2',
    },
  ];

  const menu = <Menu items={items} onClick={handleMenuClick} />;

  return (
    <>
    <nav className={styles.navbar}>
      <div className={styles.logo}>
        <Link href="/Admincomponent/homeadmin" legacyBehavior>
          <a>
            <Image src="/logo.png" width={60} height={69} alt="logo" />
          </a>
        </Link>
      </div>
      <div className={styles.navLinks}>
        <Link href='/Admincomponent/ManageAccess' legacyBehavior>
          <a className={styles.data}>จัดการข้อมูลผู้ดูแลระบบ</a>
        </Link>
        <Link href='/Admincomponent/ManageUser' legacyBehavior>
          <a className={styles.data}>ข้อมูลสมาชิก</a>
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
        <a className={styles.Logout} onClick={handleLogout}>
          ออกจากระบบ
        </a>
      </div>
      
      <Modal
        title="ยืนยันการออกจากระบบ"
        visible={showLogoutModal}
        onOk={confirmLogout}
        onCancel={() => setShowLogoutModal(false)}
        okText="ออกจากระบบ"
        cancelText="ยกเลิก"
      >
        <p>คุณแน่ใจหรือว่าต้องการออกจากระบบ?</p>
      </Modal>
    </nav>
    
    {/* Display admin name in this section */}
    {/* <div className={styles.nameadmin}>
      คุณ : {!loading && currentUserName ? currentUserName : 'กำลังโหลด...'}
    </div> */}
    </>
  );
}
