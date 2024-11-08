import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { db, storage } from '../firebase';
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import styles from '@/styles/ManageCompetition.module.css';
import Navbar from './Navbaradmin';
import Head from 'next/head';
import { FiEdit, FiTrash2 } from 'react-icons/fi';
import { message } from 'antd'; // เพิ่มการนำเข้า message จาก antd

const ManageCompetition = () => {
    const router = useRouter();
    const [competitions, setCompetitions] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [editingCompetition, setEditingCompetition] = useState(null);
    const [newCompetition, setNewCompetition] = useState({
        title: '',
        gameName: '',
        type: '',
        teamSize: '', 
        numberOfTeams: '', 
        imageUrl: ''
    });
    const [image, setImage] = useState(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [competitionToDelete, setCompetitionToDelete] = useState(null);

    // แยกวันที่สำหรับเปิดรับสมัคร, ปิดรับสมัคร, เริ่มการเเข่งขัน, สิ้นสุดการเเข่งขัน
    const [registrationStartDate, setRegistrationStartDate] = useState('');
    const [registrationEndDate, setRegistrationEndDate] = useState('');
    const [competitionStartDate, setCompetitionStartDate] = useState('');
    const [competitionEndDate, setCompetitionEndDate] = useState('');

    const [messageApi, contextHolder] = message.useMessage(); // สร้าง messageApi

    // State สำหรับการแบ่งหน้า
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 6; // จำนวนรายการที่จะแสดงต่อหน้า

    useEffect(() => {
        fetchCompetitions();
    }, []);

    const fetchCompetitions = async () => {
        try {
            const querySnapshot = await getDocs(collection(db, 'competitions'));
            let competitionData = querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
    
            // Sorting by the date field to show the newest first
            competitionData = competitionData.sort((a, b) => {
                const aDate = new Date(a.date); // Use 'date' field
                const bDate = new Date(b.date);
    
                return bDate - aDate; // Sorting from newest to oldest
            });
    
            setCompetitions(competitionData);
        } catch (error) {
            console.error('Error fetching competitions:', error);
        }
    };         

    const handleSearchChange = (event) => {
        setSearchQuery(event.target.value);
    };

    const handleImageChange = (e) => {
        if (e.target.files[0]) {
            setImage(e.target.files[0]);
        }
    };

    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setNewCompetition(prevState => ({ ...prevState, [name]: value }));
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
    
        let imageUrl = newCompetition.imageUrl;
        if (image) {
            const imageRef = ref(storage, `images/${image.name}`);
            await uploadBytes(imageRef, image);
            imageUrl = await getDownloadURL(imageRef);
        }
    
        const competitionData = {
            ...newCompetition,
            registrationStartDate,
            registrationEndDate,
            competitionStartDate,
            competitionEndDate,
            imageUrl,
            date: new Date().toLocaleDateString('th-TH')
        };
    
        try {
            if (editingCompetition) {
                await updateDoc(doc(db, 'competitions', editingCompetition.id), competitionData);
                messageApi.success('แก้ไขข้อมูลการแข่งขันสำเร็จ');
            } else {
                await addDoc(collection(db, 'competitions'), competitionData);
                messageApi.success('เพิ่มข้อมูลการแข่งขันสำเร็จ');
            }
        } catch (error) {
            messageApi.error('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
        }
    
        setNewCompetition({ title: '', gameName: '', type: '', teamSize: '', numberOfTeams: '', imageUrl: '' });
        setRegistrationStartDate('');
        setRegistrationEndDate('');
        setCompetitionStartDate('');
        setCompetitionEndDate('');
        setImage(null);
        setShowForm(false);
        setEditingCompetition(null);
        fetchCompetitions();
    };    

    const handleEdit = (competitionItem) => {
        setNewCompetition(competitionItem);
        setRegistrationStartDate(competitionItem.registrationStartDate);
        setRegistrationEndDate(competitionItem.registrationEndDate);
        setCompetitionStartDate(competitionItem.competitionStartDate);
        setCompetitionEndDate(competitionItem.competitionEndDate);
        setShowForm(true);
        setEditingCompetition(competitionItem);
    };

    const handleDelete = async () => {
        try {
            await deleteDoc(doc(db, 'competitions', competitionToDelete.id));
            messageApi.success('ลบข้อมูลการแข่งขันสำเร็จ');
        } catch (error) {
            messageApi.error('เกิดข้อผิดพลาดในการลบข้อมูล');
        }
        setShowDeleteConfirm(false);
        setCompetitionToDelete(null);
        fetchCompetitions();
    };

    const handleView = (competitionItem) => {
        router.push({
            pathname: '/',
            query: { id: competitionItem.id },
        });
    };

    // คำนวณรายการที่จะแสดงในแต่ละหน้า
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentCompetitions = competitions.slice(indexOfFirstItem, indexOfLastItem);

    // คำนวณจำนวนหน้าทั้งหมด
    const totalPages = Math.ceil(competitions.length / itemsPerPage);

    const handlePageChange = (pageNumber) => {
        setCurrentPage(pageNumber);
    };

    const filteredCompetitions = currentCompetitions.filter(item =>
        item.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const formatDate = (dateString) => {
        const options = { day: '2-digit', month: '2-digit', year: 'numeric' };
        return new Date(dateString).toLocaleDateString('th-TH', options);
    };

    return (
        <>
            <Head>
                <title>จัดการการแข่งขัน</title>
            </Head>
            <Navbar />
            {contextHolder}
            <div className={styles.container}>
                <h2 className={styles.title}>จัดการการแข่งขัน</h2>
                <input
                    type="text"
                    placeholder="ค้นหารายการการแข่งขัน"
                    value={searchQuery}
                    onChange={handleSearchChange}
                    className={styles.searchInput}
                />
                <button className={styles.addButton} onClick={() => setShowForm(!showForm)}>
                    + เพิ่มข้อมูลการแข่งขัน
                </button>
                {showForm && (
                    <div className={styles.modalOverlay}>
                        <div className={styles.modalContent}>
                            <form onSubmit={handleFormSubmit} className={styles.competitionForm}>
                                <h2 className={styles.title}>ข้อมูลการแข่งขัน</h2>
                                {/* Form Inputs */}
                                <label className={styles.label}>หัวข้อการแข่งขัน</label>
                                <input
                                    type="text"
                                    name="title"
                                    placeholder="หัวข้อการแข่งขัน"
                                    value={newCompetition.title}
                                    onChange={handleFormChange}
                                    className={styles.input}
                                    required
                                />
                                <label className={styles.label}>ชื่อเกม</label>
                                <input
                                    type="text"
                                    name="gameName"
                                    placeholder="ชื่อเกม"
                                    value={newCompetition.gameName}
                                    onChange={handleFormChange}
                                    className={styles.input}
                                    required
                                />
                                <label className={styles.label}>ประเภทการแข่งขัน</label>
                                <select
                                    name="type"
                                    placeholder="ประเภทการเเข่งขัน"
                                    value={newCompetition.type}
                                    onChange={handleFormChange}
                                    className={styles.input}
                                    required
                                >
                                    <option value="">ประเภทการแข่งขัน</option>
                                    <option value="เดี่ยว">เดี่ยว</option>
                                    <option value="คู่">คู่</option>
                                    <option value="ทีม">ทีม</option>
                                </select>
                                {newCompetition.type === 'ทีม' && (
                                    <div>
                                        <label className={styles.label}>จำนวนคนในทีม</label>
                                        <select
                                            name="teamSize"
                                            value={newCompetition.teamSize}
                                            onChange={handleFormChange}
                                            className={styles.input}
                                            required
                                        >
                                            <option value="">เลือกจำนวนคน</option>
                                            <option value="4">4 คน</option>
                                            <option value="5">5 คน</option>
                                        </select>
                                    </div>
                                )}
                                <div>
                                    <label className={styles.label}>จำนวนทีมที่รับสมัคร</label>
                                    <select
                                        name="numberOfTeams"
                                        value={newCompetition.numberOfTeams}
                                        onChange={handleFormChange}
                                        className={styles.input}
                                        required
                                    >
                                        <option value="">เลือกจำนวนทีมที่รับสมัคร</option>
                                        <option value="8">8 ทีม</option>
                                        <option value="16">16 ทีม</option>
                                        <option value="32">32 ทีม</option>
                                    </select>
                                </div>
                                <div className={styles.dateContainer}>
                                    <div className={styles.dateInput}>
                                        <label className={styles.label}>เปิดรับสมัคร</label>
                                        <input
                                            type="date"
                                            name="registrationStartDate"
                                            placeholder="เปิดรับสมัคร"
                                            value={registrationStartDate}
                                            onChange={(e) => setRegistrationStartDate(e.target.value)}
                                            className={styles.input}
                                            required
                                            min={new Date().toISOString().split('T')[0]}
                                        />
                                    </div>
                                    <div className={styles.dateInput}>
                                        <label className={styles.label}>ปิดรับสมัคร</label>
                                        <input
                                            type="date"
                                            name="registrationEndDate"
                                            placeholder="ปิดรับสมัคร"
                                            value={registrationEndDate}
                                            onChange={(e) => setRegistrationEndDate(e.target.value)}
                                            className={styles.input}
                                            required
                                            min={registrationStartDate}
                                        />
                                    </div>
                                </div>
                                <div className={styles.dateContainer}>
                                    <div className={styles.dateInput}>
                                        <label className={styles.label}>เริ่มการเเข่งขัน</label>
                                        <input
                                            type="date"
                                            name="competitionStartDate"
                                            placeholder="เริ่มการเเข่งขัน"
                                            value={competitionStartDate}
                                            onChange={(e) => setCompetitionStartDate(e.target.value)}
                                            className={styles.input}
                                            required
                                            min={registrationEndDate}
                                        />
                                    </div>
                                    <div className={styles.dateInput}>
                                        <label className={styles.label}>สิ้นสุดการเเข่งขัน </label>
                                        <input
                                            type="date"
                                            name="competitionEndDate"
                                            placeholder="สิ้นสุดการเเข่งขัน "
                                            value={competitionEndDate}
                                            onChange={(e) => setCompetitionEndDate(e.target.value)}
                                            className={styles.input}
                                            required
                                            min={competitionStartDate}
                                        />
                                    </div>
                                </div>
                                <button type="submit" className={styles.submitButton}>
                                    บันทึกข้อมูลการแข่งขัน
                                </button>
                                <button type="button" onClick={() => { setShowForm(false); setEditingCompetition(null); }} className={styles.cancelButton}>
                                    ยกเลิก
                                </button>
                            </form>
                        </div>
                    </div>
                )}
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th className={styles.th}>หัวข้อการแข่งขัน</th>
                            <th className={styles.th}>เกม</th>
                            <th className={styles.th}>ประเภท</th>
                            <th className={styles.th}>ช่วงรับสมัคร</th>
                            <th className={styles.th}>ช่วงเเข่งขัน</th>
                            <th className={styles.th}>จำนวนทีม</th>
                            <th className={styles.th}>แก้ไข</th>
                            <th className={styles.th}>ลบ</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredCompetitions.map((item, index) => (
                            <tr key={index} className={styles.tr}>
                                <td className={styles.td}>{item.title}</td>
                                <td className={styles.td}>{item.gameName}</td>
                                <td className={styles.td}>{item.type}</td>
                                <td className={styles.td}>{formatDate(item.registrationStartDate)} - {formatDate(item.registrationEndDate)}</td>
                                <td className={styles.td}>{formatDate(item.competitionStartDate)} - {formatDate(item.competitionEndDate)}</td>
                                <td className={styles.td}>{item.numberOfTeams}</td>
                                <td className={styles.td}>
                                    <button className={styles.editButton} onClick={() => handleEdit(item)}><FiEdit /></button>
                                </td>
                                <td className={styles.td}>
                                    <button className={styles.deleteButton} onClick={() => { setShowDeleteConfirm(true); setCompetitionToDelete(item); }}><FiTrash2 /></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {/* Pagination */}
                <div className={styles.pagination}>
                    {Array.from({ length: totalPages }, (_, i) => (
                        <button
                            key={i}
                            className={`${styles.pageButton} ${currentPage === i + 1 ? styles.activePage : ''}`}
                            onClick={() => handlePageChange(i + 1)}
                        >
                            {i + 1}
                        </button>
                    ))}
                </div>
            </div>

            {showDeleteConfirm && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modalContent}>
                        <p>คุณต้องการลบการแข่งขันนี้หรือไม่?</p>
                        <button className={styles.confirmButton} onClick={handleDelete}>ยืนยัน</button>
                        <button className={styles.cancelButton} onClick={() => setShowDeleteConfirm(false)}>ยกเลิก</button>
                    </div>
                </div>
            )}
        </>
    );
};

export default ManageCompetition;
