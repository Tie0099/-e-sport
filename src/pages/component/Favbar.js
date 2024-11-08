import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { auth, db, storage } from '../firebase'; // นำเข้า Firebase Authentication, Firestore และ Storage
import { doc, getDoc } from "firebase/firestore"; // ฟังก์ชันสำหรับดึงข้อมูลจาก Firestore
import { ref, getDownloadURL } from 'firebase/storage'; // ดึงรูปโปรไฟล์จาก Firebase Storage
import styles from '@/styles/Favbar.module.css';

export default function Favbar() {
  const [photoURL, setPhotoURL] = useState('/pro.jpg'); // รูปโปรไฟล์เริ่มต้น
  const [isLoading, setIsLoading] = useState(true); // เพิ่มสถานะโหลด

  useEffect(() => {
    const fetchUserPhotoURL = async () => {
      const unsubscribe = auth.onAuthStateChanged(async (user) => {
        if (user) {
          try {
            // ดึงข้อมูลจาก Firestore โดยใช้ UID ของผู้ใช้ปัจจุบัน
            const userDocRef = doc(db, "users", user.uid);
            const userDocSnap = await getDoc(userDocRef);

            if (userDocSnap.exists()) {
              const userData = userDocSnap.data();
              console.log("User Data:", userData);  // ตรวจสอบข้อมูลผู้ใช้

              if (userData.photoURL) {
                // ดึง URL ของรูปโปรไฟล์จาก Firebase Storage
                const profileImageRef = ref(storage, userData.photoURL);
                const downloadURL = await getDownloadURL(profileImageRef);
                setPhotoURL(downloadURL); // ตั้งค่า URL ของรูปโปรไฟล์
                console.log("Profile Image URL:", downloadURL); // ตรวจสอบ photoURL
              } else {
                console.log("ไม่มีฟิลด์ photoURL ในเอกสารผู้ใช้");
              }
            }
          } catch (error) {
            console.error("Error fetching user profile:", error);
          }
        }
        setIsLoading(false); // เสร็จสิ้นการโหลดไม่ว่าจะพบหรือไม่พบข้อมูล
      });

      return () => unsubscribe(); // ยกเลิกการสมัครรับเมื่อ component ถูก unmount
    };

    fetchUserPhotoURL(); // เรียกใช้ฟังก์ชันเมื่อ component mount
  }, []);

  return (
    <nav className={styles.nav}>
      <div className={styles.logo}>
        <Link href="/User1/Home">
          <Image src="/logo.png" width={60} height={69} alt="logo" priority />
        </Link>
      </div>
      <div className={styles.link}>
        <Link href="/User1/Home">หน้าเเรก</Link>
        <Link href="/User1/competition">สมัครการเเข่งขัน</Link>
      </div>
      <div className={styles.profile}>
        <Link href="/User/profile">
          {isLoading ? (
            <div className={styles.profileImagePlaceholder}></div> // เพิ่มตัวโหลดเมื่อข้อมูลยังไม่ถูกดึงมา
          ) : (
            <Image 
              src={photoURL} // ใช้ URL ของรูปโปรไฟล์ที่ได้จาก Firestore
              width={35} 
              height={35} 
              alt="โปรไฟล์" 
              className={styles.profileImage} 
              priority 
              onError={() => setPhotoURL('/pro.jpg')} // ใช้รูปโปรไฟล์เริ่มต้นหากมีปัญหาในการโหลดรูป
            />
          )}
        </Link>
      </div>
    </nav>
  );
}
