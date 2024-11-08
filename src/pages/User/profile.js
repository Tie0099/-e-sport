import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { message, Modal } from 'antd';
import { db, auth, storage } from '../firebase';
import { collection, getDocs, doc, updateDoc, where, query } from 'firebase/firestore';
import { signOut, updatePassword, updateProfile } from 'firebase/auth';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import Favbar from '../component/Favbar';
import styles from '@/styles/profile.module.css';
import '@fortawesome/fontawesome-free/css/all.min.css';


const fetchUserData = async (uid, setUserDocId, setUserData, setFormData) => {
  try {
    const q = query(collection(db, 'users'), where('uid', '==', uid));
    const querySnapshot = await getDocs(q);
    querySnapshot.forEach((doc) => {
      setUserDocId(doc.id);
      setUserData(doc.data());
      setFormData(doc.data());
    });
  } catch (error) {
    console.error('Error fetching user data: ', error);
  }
};

export default function Profile() {
  const [userData, setUserData] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({});
  const [userDocId, setUserDocId] = useState('');
  const [profileImage, setProfileImage] = useState(null);
  const [profileImageUrl, setProfileImageUrl] = useState('/pro.jpg');
  const [oldImageRef, setOldImageRef] = useState(null);
  const [previewImage, setPreviewImage] = useState(null); // สำหรับแสดงภาพ preview
  const [showLogoutModal, setShowLogoutModal] = useState(false); // สำหรับ modal ออกจากระบบ
  const router = useRouter();
  const [messageApi, contextHolder] = message.useMessage();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        await fetchUserData(user.uid, setUserDocId, setUserData, setFormData);
        if (user.photoURL) {
          setProfileImageUrl(user.photoURL);
          setOldImageRef(ref(storage, user.photoURL));
        }
      } else {
        router.push('/');
      }
    });

    return () => unsubscribe();
  }, [router]);

  const handleLogout = async () => {
    setShowLogoutModal(true); // เปิด modal ยืนยันออกจากระบบ
  };

  const confirmLogout = async () => {
    await signOut(auth);
    router.push('/');
  };

  const handleEditClick = () => {
    setShowForm(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();

    const userDoc = doc(db, 'users', userDocId);
    await updateDoc(userDoc, formData);
    setUserData(formData);

    if (auth.currentUser) {
      try {
        await updatePassword(auth.currentUser, formData.password);
      } catch (error) {
        console.error('Error updating password: ', error);
        message.error('เกิดข้อผิดพลาดในการอัปเดตรหัสผ่าน');
      }
    }

    messageApi.success('แก้ไขโปรไฟล์สำเร็จ');
    setShowForm(false);
  };

  const handleCancelClick = () => {
    setShowForm(false);
    setFormData(userData);
  };

  const handleImageChange = async (e) => {
    if (e.target.files[0]) {
      const file = e.target.files[0];
      setProfileImage(file);

      // แสดง preview ของรูปภาพ
      setPreviewImage(URL.createObjectURL(file));

      // Display loading message
      messageApi.open({
        type: 'loading',
        content: 'กำลังอัปโหลดรูป...',
        duration: 2.5,
      });

      const storageRef = ref(storage, `profileImages/${file.name}`);
      await uploadBytes(storageRef, file);
      const imageUrl = await getDownloadURL(storageRef);

      if (oldImageRef) {
        await deleteObject(oldImageRef);
      }

      const userDoc = doc(db, 'users', userDocId);
      await updateDoc(userDoc, { photoURL: imageUrl });
      await updateProfile(auth.currentUser, {
        photoURL: imageUrl,
      });
      setProfileImageUrl(imageUrl);
      setOldImageRef(storageRef);

      messageApi.success('เปลี่ยนรูปสำเร็จ');
    }
  };

  if (!userData) {
    return <div>Loading...</div>;
  }

  return (
    <>
      <Head>
        <title>โปรไฟล์</title>
      </Head>
      <Favbar />
      <div className={styles.profileContainer}>
        {contextHolder}
        <div className={styles.sidebar}>
          <button className={`${styles.sidebarButton} ${router.pathname === '/profile' ? styles.active : ''}`} onClick={() => router.push('/User/profile')}>โปรไฟล์</button>
          <button className={`${styles.sidebarButton} ${router.pathname === '/User/MyTeam' ? styles.active : ''}`} onClick={() => router.push('/User/MyTeam')}>ทีมของคุณ</button>
          <button className={`${styles.sidebarButton} ${router.pathname === '/User1/competition' ? styles.active : ''}`} onClick={() => router.push('/User1/competition')}>สมัครการเเข่งขัน</button>
          <button className={`${styles.sidebarButton} ${router.pathname === '/schedule' ? styles.active : ''}`} onClick={() => router.push('/User/MyCompetitionhistory')}>ตารางการแข่งขัน</button>
          <button className={`${styles.sidebarButton} ${router.pathname === '/history' ? styles.active : ''}`} onClick={() => router.push('/User/MyCompetitionschedule')}>ประวัติการแข่งขัน</button>
          <button className={styles.logoutButton} onClick={handleLogout}>ออกจากระบบ</button>
        </div>
        <div className={styles.mainContent}>
          <div className={styles.profileHeader}>
            <label htmlFor="profileImage" className={styles.imageLabel}>
              <div className={styles.imageUploadContainer} title="เปลี่ยนรูปโปรไฟล์">
                <Image
                  src={previewImage || profileImageUrl} // แสดง preview ถ้ามีการเลือกภาพ
                  alt="รูปโปรไฟล์"
                  width={100}
                  height={100}
                  className={styles.avatar}
                />
                <span className={styles.imageLabelText}>เปลี่ยนรูปโปรไฟล์</span>
              </div>
            </label>
            <input
              type="file"
              id="profileImage"
              onChange={handleImageChange}
              className={styles.imageInput}
            />
          </div>

          {showForm ? (
            <form className={styles.editForm} onSubmit={handleFormSubmit}>
              <h2>แก้ไขโปรไฟล์</h2>
              <div className={styles.formGroup}>
                <label>ชื่อ-นามสกุล</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  placeholder="ชื่อ-นามสกุล"
                  onChange={handleInputChange}
                />
              </div>
              <div className={styles.formGroup}>
                <label>อีเมล</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  placeholder="อีเมล"
                  onChange={handleInputChange}
                />
              </div>
              <div className={styles.formGroup}>
                <label>เบอร์โทร</label>
                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  placeholder="เบอร์โทร"
                  onChange={handleInputChange}
                />
              </div>
              <div className={styles.formGroup}>
                <label>สังกัด</label>
                <input
                  type="text"
                  name="affiliation"
                  value={formData.affiliation}
                  placeholder="สังกัด"
                  onChange={handleInputChange}
                />
              </div>
              <div className={styles.formGroup} style={{ position: 'relative' }}>
                <label>รหัสผ่าน</label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  placeholder="รหัสผ่าน"
                  onChange={handleInputChange}
                />
                <i
                  className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'} ${styles.passwordIcon}`}
                  onClick={() => setShowPassword(!showPassword)}
                ></i>
              </div>
              <div className={styles.formButtons}>
                <button type="submit" className={styles.submitButton}>
                  ยืนยัน
                </button>
                <button type="button" className={styles.cancelButton} onClick={handleCancelClick}>
                  ยกเลิก
                </button>
              </div>
            </form>
          ) : (
            <div className={styles.profileInfo}>
              <div className={styles.infoRow}>
                <strong>ชื่อ-นามสกุล:</strong>
                <span>{userData.name}</span>
              </div>
              <div className={styles.infoRow}>
                <strong>อีเมล:</strong>
                <span>{userData.email}</span>
              </div>
              <div className={styles.infoRow}>
                <strong>เบอร์โทร:</strong>
                <span>{userData.phone}</span>
              </div>
              <div className={styles.infoRow}>
                <strong>สังกัด:</strong>
                <span>{userData.affiliation}</span>
              </div>
              <button className={styles.editButton} onClick={handleEditClick}>
                แก้ไขโปรไฟล์
              </button>
            </div>
          )}
        </div>

        {/* Modal สำหรับยืนยันออกจากระบบ */}
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
      </div>
    </>
  );
}
