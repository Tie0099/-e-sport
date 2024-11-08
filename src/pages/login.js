import { useRouter } from 'next/router';
import React, { useState } from 'react';
import Head from 'next/head';
import { db, auth } from './firebase';
import { collection, query, where, getDocs, addDoc, doc, updateDoc } from 'firebase/firestore';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import styles from '@/styles/Loginuser.module.css';
import { message } from 'antd';
import Navbar from './component/Navbar';

const Login = () => {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    affiliation: '',
    phone: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();

  const handleTogglePassword = () => {
    setShowPassword(!showPassword);
  };

  const handleShowForm = (event) => {
    event.preventDefault();
    setShowForm(true);
  };

  const handleCloseForm = (event) => {
    event.preventDefault();
    setShowForm(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevState) => ({
      ...prevState,
      [name]: value
    }));
  };

  // ฟังก์ชั่นสำหรับอัปเดตรหัสผ่านใหม่ใน Firestore
  const updatePasswordInFirestore = async (newPassword, userId) => {
    try {
      const userDocRef = doc(db, 'users', userId);  // อ้างอิงไปยังเอกสารของผู้ใช้
      await updateDoc(userDocRef, {
        password: newPassword  // อัปเดตรหัสผ่านใหม่ใน field password
      });
      console.log('อัปเดตรหัสผ่านใน Firestore สำเร็จ');
    } catch (error) {
      console.error('เกิดข้อผิดพลาดในการอัปเดตรหัสผ่านใน Firestore:', error);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
  
    // ตรวจสอบเบอร์โทรว่ามีความยาว 10 หลัก
    if (!/^\d{10}$/.test(formData.phone)) {
      messageApi.error('เบอร์โทรต้องเป็นตัวเลขจำนวน 10 หลัก');
      return;
    }
  
    // ตรวจสอบรหัสผ่านและยืนยันรหัสผ่าน
    if (formData.password !== formData.confirmPassword) {
      messageApi.error('รหัสผ่านไม่ตรงกัน');
      return;
    }
  
    // ตรวจสอบว่าอีเมลนี้มีอยู่ในฐานข้อมูลหรือไม่
    const emailQuery = query(collection(db, 'users'), where('email', '==', formData.email));
    const emailQuerySnapshot = await getDocs(emailQuery);
  
    // ถ้ามีอีเมลนี้อยู่ในฐานข้อมูล ให้แสดงข้อความแจ้งเตือน
    if (!emailQuerySnapshot.empty) {
      messageApi.error('อีเมลนี้ได้ถูกใช้งานไปแล้ว');
      return;
    }
  
    // ตรวจสอบว่าเบอร์โทรนี้มีอยู่ในฐานข้อมูลหรือไม่
    const phoneQuery = query(collection(db, 'users'), where('phone', '==', formData.phone));
    const phoneQuerySnapshot = await getDocs(phoneQuery);
  
    // ถ้ามีเบอร์โทรนี้อยู่ในฐานข้อมูล ให้แสดงข้อความแจ้งเตือน
    if (!phoneQuerySnapshot.empty) {
      messageApi.error('เบอร์โทรนี้ได้ถูกใช้งานไปแล้ว');
      return;
    }
  
    // ลงทะเบียนผู้ใช้ใหม่
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      console.log('ลงทะเบียนผู้ใช้สำเร็จ:', userCredential.user);
  
      // บันทึกข้อมูลผู้ใช้ใหม่ลงใน Firestore
      const docRef = await addDoc(collection(db, 'users'), {
        uid: userCredential.user.uid,
        name: formData.name,
        email: formData.email,
        affiliation: formData.affiliation,
        phone: formData.phone,
        password: formData.password
      });
  
      console.log('สร้างเอกสารใน Firestore ด้วย ID:', docRef.id);
      setShowForm(false);
      messageApi.success('ลงทะเบียนสำเร็จ');
    } catch (e) {
      console.error('เกิดข้อผิดพลาดในการลงทะเบียนผู้ใช้:', e);
      messageApi.error('เกิดข้อผิดพลาดในการลงทะเบียน');
    }
  };  

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    const { email, password } = formData;

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log('เข้าสู่ระบบผู้ใช้สำเร็จ:', userCredential.user);

      // ตรวจสอบ UID ของผู้ใช้ใน collection 'Admin'
      const adminQuery = query(collection(db, 'Admin'), where('uid', '==', userCredential.user.uid));
      const adminQuerySnapshot = await getDocs(adminQuery);

      if (!adminQuerySnapshot.empty) {
        messageApi.success('เข้าสู่ระบบสำเร็จ');
        router.push('/Admincomponent/homeadmin');
      } else {
        // ตรวจสอบ UID ของผู้ใช้ใน collection 'users'
        const userQuery = query(collection(db, 'users'), where('uid', '==', userCredential.user.uid));
        const userQuerySnapshot = await getDocs(userQuery);

        if (!userQuerySnapshot.empty) {
          messageApi.success('เข้าสู่ระบบสำเร็จ');
          router.push('/User/profile');
        } else {
          messageApi.error('ไม่มีผู้ใช้นี้ในระบบ');
        }
      }
    } catch (error) {
      console.error('เกิดข้อผิดพลาดในการเข้าสู่ระบบ:', error);
      console.log('รหัสข้อผิดพลาด:', error.code);
      console.log('ข้อความข้อผิดพลาด:', error.message);
      if (error.code === 'auth/user-not-found') {
        messageApi.error('ไม่มีผู้ใช้นี้ในระบบ');
      } else if (error.code === 'auth/wrong-password') {
        messageApi.error('รหัสผ่านไม่ถูกต้อง');
      } else {
        messageApi.error(`เกิดข้อผิดพลาด`);
      }
    }
  };

  const handleForgotPassword = async () => {
    if (!formData.email) {
      messageApi.error('กรุณากรอกอีเมลที่ใช้สำหรับรีเซ็ตรหัสผ่าน');
      return;
    }
  
    try {
      await sendPasswordResetEmail(auth, formData.email);
      messageApi.success('ลิงก์รีเซ็ตรหัสผ่านถูกส่งไปยังอีเมลของคุณ');
  
      // ขอให้ผู้ใช้กรอกรหัสผ่านใหม่ผ่านฟอร์ม
      const newPassword = formData.newPassword; // รับค่าจากฟอร์มที่ผู้ใช้กรอกรหัสผ่านใหม่
  
      // ค้นหาเอกสารผู้ใช้ใน Firestore โดยใช้ email เพื่ออัปเดตรหัสผ่านใหม่
      const userQuery = query(collection(db, 'users'), where('email', '==', formData.email));
      const userQuerySnapshot = await getDocs(userQuery);
  
      if (!userQuerySnapshot.empty) {
        const userDocId = userQuerySnapshot.docs[0].id; // ได้รับ ID ของเอกสารที่ตรงกัน
        await updatePasswordInFirestore(newPassword, userDocId); // อัปเดตรหัสผ่านจริงแทนการใช้ "รหัสผ่านใหม่"
      }
  
    } catch (error) {
      console.error('เกิดข้อผิดพลาดในการส่งลิงก์รีเซ็ตรหัสผ่าน:', error);
      messageApi.error('เกิดข้อผิดพลาดในการส่งลิงก์รีเซ็ตรหัสผ่าน');
    }
  };  

  return (
    <>
      <Head>
        <title>เข้าสู่ระบบ</title>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css" />
      </Head>
      <Navbar />
      <div className={styles['login-box']}>
        {contextHolder}
        <p>Login</p>
        <form onSubmit={handleLoginSubmit}>
          <div className={styles['user-box']}>
            <input
              required
              type="text"
              name="email"
              value={formData.email}
              onChange={handleChange}
            />
            <label>Email</label>
          </div>
          <div className={styles['user-box']} style={{ position: 'relative' }}>
            <input
              required
              type={showPassword ? 'text' : 'password'}
              name="password"
              value={formData.password}
              onChange={handleChange}
            />
            <label>Password</label>
            <i
              className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'} ${styles.passwordIcon}`}
              onClick={handleTogglePassword}
            ></i>
          </div>
          <button type="submit" className={styles.login}>
            <span></span>
            <span></span>
            <span></span>
            <span></span>
            เข้าสู่ระบบ
          </button>
        </form>

        {/* ลืมรหัสผ่าน */}
        <p>
          <a href="#" onClick={handleForgotPassword} className={styles.a2}>
            ลืมรหัสผ่าน?
          </a>
        </p>

        <p>
          คุณยังไม่มีบัญชีใช่ไหม?
          <a href="#" onClick={handleShowForm} className={styles.a2}>
            ลงทะเบียน
          </a>
        </p>

        {showForm && (
          <div className={`${styles['register-form']} register-form`}>
            <form onSubmit={handleRegisterSubmit}>
              <h2 className={styles.rong}>ลงทะเบียน</h2>
              <div className={styles['user-box']}>
                <input
                  required
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                />
                <label>ชื่อผู้ใช้</label>
              </div>
              <div className={styles['user-box']}>
                <input
                  required
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                />
                <label>อีเมล</label>
              </div>
              <div className={styles['user-box']}>
                <input
                  required
                  type="text"
                  name="affiliation"
                  value={formData.affiliation}
                  onChange={handleChange}
                />
                <label>สังกัด</label>
              </div>
              <div className={styles['user-box']} style={{ position: 'relative' }}>
                <input
                  required
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                />
                <label>รหัสผ่าน</label>
                <i
                  className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'} ${styles.passwordIcon}`}
                  onClick={handleTogglePassword}
                ></i>
              </div>
              <div className={styles['user-box']} style={{ position: 'relative' }}>
                <input
                  required
                  type={showPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                />
                <label>ยืนยันรหัสผ่าน</label>
                <i
                  className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'} ${styles.passwordIcon}`}
                  onClick={handleTogglePassword}
                ></i>
              </div>
              <div className={styles['user-box']}>
                <input
                  required
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                />
                <label>เบอร์โทร</label>
              </div>
              <button className={styles.submit} type="submit">ลงทะเบียน</button>
              <button className={styles.off} onClick={handleCloseForm}>ปิด</button>
            </form>
          </div>
        )}
      </div>
    </>
  );
};

export default Login;
