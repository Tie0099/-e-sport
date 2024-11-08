import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import Navbar from '@/pages/Admincomponent/Navbaradmin';
import { FiEdit, FiTrash2 } from 'react-icons/fi';
import { MdClose } from 'react-icons/md';
import { message } from 'antd';
import styles from '@/styles/manageAccess.module.css';
import { collection, addDoc, onSnapshot, deleteDoc, doc, updateDoc, setDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { useAuth } from '@/auth/authContext'; // Assuming you have an AuthContext for user authentication
import { useRouter } from 'next/router';
import { v4 as uuidv4 } from 'uuid';
import { createUserWithEmailAndPassword } from 'firebase/auth';

export default function ManageUser() {
  const { currentUser } = useAuth(); // Use auth context
  const router = useRouter();
  const [confirmDeleteItem, setConfirmDeleteItem] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [items, setItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [newItem, setNewItem] = useState({ name: '', email: '', studentId: '', classGroup: '' });

  const [alertMessage, setAlertMessage] = useState('');
  const [showAlert, setShowAlert] = useState(false);
  
  const [messageApi, contextHolder] = message.useMessage();

  const handleEdit = (item) => {
    setSelectedItem({ ...item, password: item.studentId });
  };

  const showAlertModal = (message) => {
    setAlertMessage(message);
    setShowAlert(true);
  };

  const closeAlertModal = () => {
    setShowAlert(false);
    setAlertMessage('');
  };

  // Add Database
  const addItem = async (e) => {
    e.preventDefault();
    const { name, email, studentId, classGroup } = newItem;

    if (!name || !email || !studentId || !classGroup) {
      showAlertModal('กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }

    if (!email.endsWith('@lru.ac.th')) {
      showAlertModal('กรุณาใส่อีเมลของมหาวิทยาลัย');
      return;
    }

    if (!/^\d{10}$/.test(studentId)) {
      showAlertModal('กรุณาใส่รหัสนักศึกษาให้ครบ');
      return;
    }

    const duplicateEmail = items.some(item => item.email === email);
    if (duplicateEmail) {
      showAlertModal('อีเมลนี้ได้ถูกใช้งานอยู่แล้ว');
      return;
    }

    const duplicateStudentId = items.some(item => item.studentId === studentId);
    if (duplicateStudentId) {
      showAlertModal('รหัสนักศึกษานี้ได้ถูกใช้งานอยู่แล้ว');
      return;
    }

    try {
      // สร้างผู้ใช้ใน Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(auth, email, studentId);

      // เพิ่มข้อมูลใน Firestore
      await addDoc(collection(db, 'Admin'), {
        name: name.trim(),
        email: email.trim(),
        studentId: studentId,
        classGroup: classGroup,
        password: studentId, // Set the password as the student ID initially
        uid: userCredential.user.uid, // ใช้ UID จาก Authentication
      });

      messageApi.success('เพิ่มข้อมูลสำเร็จ');
      setNewItem({ name: '', email: '', studentId: '', classGroup: '' });
      setShowForm(false);
    } catch (error) {
      messageApi.error('เกิดข้อผิดพลาดในการเพิ่มข้อมูล');
      console.error('Error adding document: ', error);
    }
  };

  // Read Database
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'Admin'), (querySnapshot) => {
      let itemsArr = [];
      querySnapshot.forEach((doc) => {
        itemsArr.push({ ...doc.data(), id: doc.id });
      });
      setItems(itemsArr);
    });
    return () => unsubscribe();
  }, []);

  // Delete Database
  const deleteUser = async (item) => {
    console.log("Current User UID:", currentUser?.uid);
    console.log("Item UID to delete:", item.uid);

    if (!currentUser) {
      messageApi.error('ไม่พบข้อมูลผู้ใช้ที่กำลังใช้งานอยู่');
      return;
    }

    if (item.uid === currentUser.uid) {
      messageApi.error('ไม่สามารถลบชื่อผู้ใช้ที่กำลังใช้งานอยู่ได้');
      return;
    }

    if (confirmDeleteItem !== item) {
      console.error('Invalid item to delete:', item);
      return;
    }

    try {
      await deleteDoc(doc(db, 'Admin', item.id));
      messageApi.success('ลบข้อมูลสำเร็จ');
      setConfirmDeleteItem(null);
    } catch (error) {
      messageApi.error('เกิดข้อผิดพลาดในการลบข้อมูล');
      console.error('Error deleting document: ', error);
    }
  };

  // Edit Database
  const updateItem = async () => {
    if (selectedItem) {
      const { id, email, studentId, password, ...rest } = selectedItem;

      const duplicateEmail = items.some(item => item.email === email && item.id !== id);
      if (duplicateEmail) {
        showAlertModal('อีเมลนี้ได้ถูกใช้งานอยู่แล้ว');
        return;
      }

      const duplicateStudentId = items.some(item => item.studentId === studentId && item.id !== id);
      if (duplicateStudentId) {
        showAlertModal('รหัสนักศึกษานี้ได้ถูกใช้งานอยู่แล้ว');
        return;
      }

      if (!email.endsWith('@lru.ac.th')) {
        showAlertModal('กรุณาใส่อีเมลของมหาวิทยาลัย');
        return;
      }

      if (!/^\d{10}$/.test(studentId)) {
        showAlertModal('กรุณาใส่รหัสนักศึกษาให้ครบ');
        return;
      }

      try {
        await updateDoc(doc(db, 'Admin', id), { email, studentId, password, ...rest });
        messageApi.success('แก้ไขข้อมูลสำเร็จ');
        setSelectedItem(null);
      } catch (error) {
        messageApi.error('เกิดข้อผิดพลาดในการแก้ไขข้อมูล');
        console.error('Error updating document: ', error);
      }
    }
  };

  // Handle search
  const handleSearch = (event) => {
    setSearchTerm(event.target.value);
  };

  const filteredItems = items.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.studentId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <Head>
        <title>จัดการข้อมูลผู้ดูแลระบบ</title>
      </Head>
      <Navbar />
      <div className={styles.container}>
        {contextHolder}
        <h1 className={styles.h1}>จัดการข้อมูลผู้ดูแลระบบ</h1>
        <div className={styles.search}>
          <div>
            <button onClick={() => setShowForm(!showForm)} className={styles.addIcon}>+ เพิ่มข้อมูลผู้ดูแลระบบ</button>
            <input
              type="text"
              className={styles.searchInput}
              placeholder="ค้นหารายชื่อผู้ดูเเลระบบ"
              value={searchTerm}
              onChange={handleSearch}
            />
          </div>
          {showForm && (
            <div className={styles.modalOverlay}>
              <div className={styles.modalContent}>
                <form onSubmit={addItem} className={styles.userForm}>
                  <h2 className={styles.h1}>เพิ่มผู้ดูเเลระบบ</h2>
                  <label className={styles.label}>ชื่อ-นามสกุล</label>
                  <input
                    value={newItem.name}
                    onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                    className={styles.dataadmin}
                    name="name"
                    required
                    placeholder="ชื่อ-นามสกุล"
                  />
                  <label className={styles.label}>อีเมลนักศึกษา</label>
                  <input
                    value={newItem.email}
                    onChange={(e) => setNewItem({ ...newItem, email: e.target.value })}
                    className={styles.dataadmin}
                    name="email"
                    required
                    placeholder="อีเมลนักศึกษา"
                  />
                  <label className={styles.label}>รหัสนักศึกษา</label>
                  <input
                    value={newItem.studentId}
                    onChange={(e) => setNewItem({ ...newItem, studentId: e.target.value })}
                    className={styles.dataadmin}
                    name="studentId"
                    required
                    placeholder="รหัสนักศึกษา"
                  />
                  <label className={styles.label}>หมู่เรียน</label>
                  <input
                    value={newItem.classGroup}
                    onChange={(e) => setNewItem({ ...newItem, classGroup: e.target.value })}
                    className={styles.dataadmin}
                    name="classGroup"
                    required
                    placeholder="หมู่เรียน"
                  />
                  <div className={styles.formButtons}>
                    <button type="submit" className={styles.addButton}>เพิ่มข้อมูล</button>
                    <button type="button" onClick={() => setShowForm(false)} className={styles.cancelButton}>ยกเลิก</button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {selectedItem && (
            <div className={styles.modalOverlay}>
              <div className={styles.modalContent}>
                <form className={styles.userForm}>
                  <h2 className={styles.h1}>แก้ไขข้อมูลผู้ดูเเลระบบ</h2>
                  <label className={styles.label}>ชื่อ-นามสกุล</label>
                  <input
                    value={selectedItem.name}
                    onChange={(e) => setSelectedItem({ ...selectedItem, name: e.target.value })}
                    className={styles.dataadmin}
                    name="name"
                    required
                    placeholder="ชื่อ-นามสกุล"
                  />
                  <label className={styles.label}>รหัสนักศึกษา</label>
                  <input
                    value={selectedItem.studentId}
                    onChange={(e) => setSelectedItem({ ...selectedItem, studentId: e.target.value })}
                    className={styles.dataadmin}
                    name="studentId"
                    required
                    placeholder="รหัสนักศึกษา"
                  />
                  <label className={styles.label}>อีเมลนักศึกษา</label>
                  <input
                    value={selectedItem.email}
                    onChange={(e) => setSelectedItem({ ...selectedItem, email: e.target.value })}
                    className={styles.dataadmin}
                    name="email"
                    required
                    placeholder="อีเมลนักศึกษา"
                  />
                  <label className={styles.label}>หมู่เรียน</label>
                  <input
                    value={selectedItem.classGroup}
                    onChange={(e) => setSelectedItem({ ...selectedItem, classGroup: e.target.value })}
                    className={styles.dataadmin}
                    name="classGroup"
                    required
                    placeholder="หมู่เรียน"
                  />
                  <label className={styles.label}>รหัสผ่าน</label>
                  <input
                    value={selectedItem.password}
                    onChange={(e) => setSelectedItem({ ...selectedItem, password: e.target.value })}
                    className={styles.dataadmin}
                    name="password"
                    required
                    placeholder="รหัสผ่าน"
                  />
                  <div className={styles.formButtons}>
                    <button type="button" onClick={updateItem} className={styles.addButton}>บันทึก</button>
                    <button type="button" onClick={() => setSelectedItem(null)} className={styles.cancelButton}>ยกเลิก</button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {confirmDeleteItem && (
            <div className={styles.modalOverlay}>
              <div className={styles.confirmDeleteModal}>
                <MdClose className={styles.icon} />
                <h2>ยืนยันการลบ</h2>
                <p>คุณต้องการลบผู้ดูแลระบบนี้หรือไม่?</p>
                <p>ถ้าลบแล้วข้อมูลจะหายไปอย่างถาวร</p>
                <div className={styles.confirmButtons}>
                  <button className={styles.cancelButton} onClick={() => setConfirmDeleteItem(null)}>ยกเลิก</button>
                  <button className={styles.confirmDeleteButton} onClick={() => deleteUser(confirmDeleteItem)}>ยืนยัน</button>
                </div>
              </div>
            </div>
          )}
          <table className={styles.userTable}>
            <thead>
              <tr>
                <th>ชื่อ-นามสกุล</th>
                <th>รหัสนักศึกษา</th>
                <th>อีเมลนักศึกษา</th>
                <th>หมู่เรียน</th>
                <th>เเก้ไข</th>
                <th>ลบ</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map(item => (
                <tr className={styles.userRow} key={item.id}>
                  <td>{item.name}</td>
                  <td>{item.studentId}</td>
                  <td>{item.email}</td>
                  <td>{item.classGroup}</td>
                  <td>
                    <button className={styles.editIcon} onClick={() => handleEdit(item)}><FiEdit /></button>
                  </td>
                  <td>
                    <button className={styles.deleteIcon} onClick={() => setConfirmDeleteItem(item)}><FiTrash2 /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Alert Modal */}
        {showAlert && (
          <div className={styles.modalOverlay}>
            <div className={styles.alertModalContent}>
              <MdClose className={styles.icon} />
              <p>{alertMessage}</p>
              <div className={styles.confirmButtons}>
                <button onClick={closeAlertModal}>ตกลง</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
