import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { db, storage } from '../firebase';
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import styles from '@/styles/ManageNews.module.css';
import Navbar from './Navbaradmin';
import Head from 'next/head';
import { FiEdit, FiTrash2 } from 'react-icons/fi';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faTrash } from '@fortawesome/free-solid-svg-icons';
import { message } from 'antd';
import { MdClose } from 'react-icons/md';

const ManageNews = () => {
  const router = useRouter();
  const [news, setNews] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingNews, setEditingNews] = useState(null);
  const [newNews, setNewNews] = useState({ title: '', details: '', date: '', imageUrls: [] });
  const [editNews, setEditNews] = useState({ title: '', details: '', date: '', imageUrls: [] });
  const [images, setImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [newsToDelete, setNewsToDelete] = useState(null);

  const [messageApi, contextHolder] = message.useMessage();

  useEffect(() => {
    fetchNews();
  }, []);

  const fetchNews = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'news'));
      const newsData = querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
      setNews(newsData);
    } catch (error) {
      console.error('Error fetching news:', error);
    }
  };

  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + images.length > 3) {
      alert('คุณสามารถอัปโหลดรูปภาพได้สูงสุด 3 รูปเท่านั้น');
      return;
    }

    setImages(prevImages => [...prevImages, ...files]);
    const previews = files.map(file => URL.createObjectURL(file));
    setImagePreviews(prevPreviews => [...prevPreviews, ...previews]);
  };

  const handleAddFormChange = (e) => {
    const { name, value } = e.target;
    setNewNews(prevState => ({ ...prevState, [name]: value }));
  };

  const handleEditFormChange = (e) => {
    const { name, value } = e.target;
    setEditNews(prevState => ({ ...prevState, [name]: value }));
  };

  const handleAddFormSubmit = async (e) => {
    e.preventDefault();

    let imageUrls = [];
    for (let image of images) {
      const imageRef = ref(storage, `images/${image.name}`);
      try {
        await uploadBytes(imageRef, image);
        const imageUrl = await getDownloadURL(imageRef);
        imageUrls.push(imageUrl);
      } catch (error) {
        console.error('Error uploading image:', error);
        return;
      }
    }

    try {
      const newsData = {
        ...newNews,
        imageUrls,
        date: new Date().toLocaleDateString('th-TH')
      };

      await addDoc(collection(db, 'news'), newsData);

      messageApi.success('เพิ่มข้อมูลประชาสัมพันธ์สำเร็จ');
      setNewNews({ title: '', details: '', date: '', imageUrls: [] });
      setImages([]);
      setImagePreviews([]);
      setShowAddForm(false);
      fetchNews();
    } catch (error) {
      messageApi.error('เกิดข้อผิดพลาดในการเพิ่มข้อมูล');
      console.error('Error adding news:', error);
    }
  };

  const handleEditFormSubmit = async (e) => {
    e.preventDefault();

    let imageUrls = editNews.imageUrls;
    for (let image of images) {
      const imageRef = ref(storage, `images/${image.name}`);
      try {
        await uploadBytes(imageRef, image);
        const imageUrl = await getDownloadURL(imageRef);
        imageUrls.push(imageUrl);
      } catch (error) {
        console.error('Error uploading image:', error);
        return;
      }
    }

    try {
      const newsData = {
        ...editNews,
        imageUrls,
        date: new Date().toLocaleDateString('th-TH')
      };

      await updateDoc(doc(db, 'news', editingNews.id), newsData);

      messageApi.success('แก้ไขข้อมูลประชาสัมพันธ์สำเร็จ');
      setEditNews({ title: '', details: '', date: '', imageUrls: [] });
      setImages([]);
      setImagePreviews([]);
      setShowEditForm(false);
      setEditingNews(null);
      fetchNews();
    } catch (error) {
      messageApi.error('เกิดข้อผิดพลาดในการแก้ไขข้อมูล');
      console.error('Error updating news:', error);
    }
  };

  const handleEdit = (newsItem) => {
    setEditNews(newsItem);
    setImagePreviews(newsItem.imageUrls || []); // ตรวจสอบ imageUrls ว่ามีค่าหรือไม่
    setShowEditForm(true);
    setEditingNews(newsItem);
  };

  const handleDeleteImage = (index, isAddForm = false) => {
    if (isAddForm) {
      const updatedImages = [...images];
      updatedImages.splice(index, 1);
      setImages(updatedImages);

      const updatedImagePreviews = [...imagePreviews];
      updatedImagePreviews.splice(index, 1);
      setImagePreviews(updatedImagePreviews);
    } else {
      const imageRef = ref(storage, editNews.imageUrls[index]);
      deleteObject(imageRef)
        .then(() => {
          const updatedImageUrls = editNews.imageUrls.filter((_, i) => i !== index);
          setEditNews((prevState) => ({ ...prevState, imageUrls: updatedImageUrls }));
          setImagePreviews(updatedImageUrls);
        })
        .catch((error) => {
          if (error.code === 'storage/object-not-found') {
            console.log('Image not found, it may have been deleted already.');
          } else {
            console.error('Error deleting image:', error);
          }
        });
    }
  };

  const handleDelete = async () => {
    try {
      const newsDoc = doc(db, 'news', newsToDelete.id);
      await deleteDoc(newsDoc);

      for (let url of newsToDelete.imageUrls) {
        const imageRef = ref(storage, url);
        try {
          await deleteObject(imageRef);
        } catch (error) {
          if (error.code === 'storage/object-not-found') {
            console.log('Image not found, it may have been deleted already.');
          } else {
            console.error('Error deleting image:', error);
          }
        }
      }

      messageApi.success('ลบข้อมูลประชาสัมพันธ์สำเร็จ');
      setShowDeleteConfirm(false);
      setNewsToDelete(null);
      fetchNews();
    } catch (error) {
      messageApi.error('เกิดข้อผิดพลาดในการลบข้อมูล');
      console.error('Error deleting news:', error);
    }
  };

  const handleView = (newsItem) => {
    router.push(`/news2/${newsItem.id}`);
  };
  
  const filteredNews = news.filter(item =>
    item.title.toLowerCase().includes(searchQuery.toLowerCase())
  );


  return (
    <>
      <Head>
        <title>จัดการข้อมูลประชาสัมพันธ์</title>
      </Head>
      <Navbar />
      <div className={styles.container}>
        {contextHolder}
        <h2 className={styles.title}>จัดการข้อมูลประชาสัมพันธ์</h2>
        <input
          type="text"
          placeholder="ค้นหารายชื่อข่าว"
          value={searchQuery}
          onChange={handleSearchChange}
          className={styles.searchInput}
        />
        <button className={styles.addButton} onClick={() => setShowAddForm(!showAddForm)}>
          + เพิ่มข้อมูลประชาสัมพันธ์
        </button>
        {showAddForm && (
          <div className={styles.modalOverlay}>
            <div className={styles.modalContent}>
              <form onSubmit={handleAddFormSubmit} className={styles.newsForm}>
                <h2 className={styles.title}>เพิ่มข้อมูลประชาสัมพันธ์</h2>
                <label className={styles.label}>อัปโหลดรูปประชาสัมพันธ์</label>
                <input
                  type="file"
                  multiple
                  onChange={handleImageChange}
                  className={styles.input}
                />
                <div className={styles.imagePreviewContainer}>
                  {imagePreviews.map((preview, index) => (
                    <div key={index} className={styles.imageWrapper}>
                      <img src={preview} alt={`Preview ${index}`} className={styles.imagePreview} />
                      <button type="button" className={styles.deleteImageButton} onClick={() => handleDeleteImage(index, true)}>
                        <FontAwesomeIcon icon={faTrash} />
                      </button>
                    </div>
                  ))}
                </div>
                <label className={styles.label}>หัวข้อการประชาสัมพันธ์</label>
                <input
                  type="text"
                  name="title"
                  placeholder="หัวข้อการประชาสัมพันธ์"
                  value={newNews.title}
                  onChange={handleAddFormChange}
                  className={styles.input}
                  required
                />
                <label className={styles.label}>รายละเอียดการประชาสัมพันธ์</label>
                <textarea
                  name="details"
                  placeholder="รายละเอียดการประชาสัมพันธ์"
                  value={newNews.details}
                  onChange={handleAddFormChange}
                  className={styles.input}
                  required
                ></textarea>
                <button type="submit" className={styles.submitButton}>
                  บันทึกข้อมูลประชาสัมพันธ์
                </button>
                <button type="button" onClick={() => { setShowAddForm(false); }} className={styles.cancelButton}>
                  ยกเลิก
                </button>
              </form>
            </div>
          </div>
        )}
        {showEditForm && (
          <div className={styles.modalOverlay}>
            <div className={styles.modalContent}>
              <form onSubmit={handleEditFormSubmit} className={styles.newsForm}>
                <h2 className={styles.title}>แก้ไขข้อมูลประชาสัมพันธ์</h2>
                <label className={styles.label}>อัปโหลดรูปประชาสัมพันธ์</label>
                <input
                  type="file"
                  multiple
                  onChange={handleImageChange}
                  className={styles.input}
                />
                <div className={styles.imagePreviewContainer}>
                  {imagePreviews.map((preview, index) => (
                    <div key={index} className={styles.imageWrapper}>
                      <img src={preview} alt={`Preview ${index}`} className={styles.imagePreview} />
                      <button type="button" className={styles.deleteImageButton} onClick={() => handleDeleteImage(index)}>
                        <FontAwesomeIcon icon={faTrash} />
                      </button>
                    </div>
                  ))}
                </div>
                <label className={styles.label}>หัวข้อการประชาสัมพันธ์</label>
                <input
                  type="text"
                  name="title"
                  placeholder="หัวข้อการประชาสัมพันธ์"
                  value={editNews.title}
                  onChange={handleEditFormChange}
                  className={styles.input}
                  required
                />
                <label className={styles.label}>รายละเอียดการประชาสัมพันธ์</label>
                <textarea
                  name="details"
                  placeholder="รายละเอียดการประชาสัมพันธ์"
                  value={editNews.details}
                  onChange={handleEditFormChange}
                  className={styles.input}
                  required
                ></textarea>
                <button type="submit" className={styles.submitButton}>
                  บันทึกการแก้ไข
                </button>
                <button type="button" onClick={() => { setShowEditForm(false); setEditingNews(null); }} className={styles.cancelButton}>
                  ยกเลิก
                </button>
              </form>
            </div>
          </div>
        )}
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.th}>ชื่อรายการประชาสัมพันธ์</th>
              <th className={styles.th}>วันที่โพสต์</th>
              <th className={styles.th}>แก้ไข</th>
              <th className={styles.th}>ลบ</th>
              <th className={styles.th}>ดู</th>
            </tr>
          </thead>
          <tbody>
            {filteredNews.map((item, index) => (
              <tr key={index} className={styles.tr}>
                <td className={styles.td}>{item.title}</td>
                <td className={styles.td}>{item.date}</td>
                <td className={styles.td}>
                  <button className={styles.editButton} onClick={() => handleEdit(item)}><FiEdit /></button>
                </td>
                <td className={styles.td}>
                  <button className={styles.deleteButton} onClick={() => { setShowDeleteConfirm(true); setNewsToDelete(item); }}><FiTrash2 /></button>
                </td>
                <td className={styles.td}>
                  <button className={styles.viewButton} onClick={() => handleView(item)}>
                    <FontAwesomeIcon icon={faEye} size="lg" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showDeleteConfirm && (
        <div className={styles.modalOverlay}>
          <div className={styles.confirmDeleteModal}>
            <MdClose className={styles.icon} />
            <h2>ยืนยันการลบ</h2>
            <p>คุณต้องการลบข่าวประชาสัมพันธ์นี้หรือไม่?</p>
            <p>ถ้าลบแล้วข้อมูลจะหายไปอย่างถาวร</p>
            <div className={styles.confirmButtons}>
              <button className={styles.cancelButton} onClick={() => setShowDeleteConfirm(false)}>ยกเลิก</button>
              <button className={styles.confirmDeleteButton} onClick={handleDelete}>ยืนยัน</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ManageNews;
