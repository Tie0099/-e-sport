import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';
import Navbar from './Navbaradmin';
import Head from 'next/head';
import styles from '@/styles/PairingsAndResults.module.css';

const PairingsAndResults = () => {
    const router = useRouter();
    const [competitions, setCompetitions] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(6); // แสดง 6 รายการต่อหน้า
    const [sortOrder, setSortOrder] = useState('asc'); // asc or desc สำหรับการเรียงลำดับ

    useEffect(() => {
        fetchCompetitions();
    }, []);

    const fetchCompetitions = async () => {
        try {
            const querySnapshot = await getDocs(collection(db, 'competitions'));
            const competitionData = querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));

            // จัดเรียงการแข่งขันตามวันที่เริ่มต้น
            const sortedCompetitions = competitionData.sort((a, b) => {
                return new Date(a.competitionStartDate) - new Date(b.competitionStartDate);
            });

            setCompetitions(sortedCompetitions);
        } catch (error) {
            console.error('Error fetching competitions:', error);
        }
    };

    const handleSearchChange = (event) => {
        setSearchQuery(event.target.value);
    };

    const handleViewDetails = (competition) => {
        router.push({
            pathname: '/Admincomponent/competition-details',
            query: { id: competition.id }
        });
    };

    const formatDate = (dateString) => {
        const options = { day: '2-digit', month: '2-digit', year: 'numeric' };
        return new Date(dateString).toLocaleDateString('th-TH', options);
    };

    // ฟังก์ชันสำหรับการเรียงลำดับวันที่
    const handleSortByDate = (field) => {
        const sortedCompetitions = [...competitions].sort((a, b) => {
            const dateA = new Date(a[field]);
            const dateB = new Date(b[field]);
            return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
        });
        setCompetitions(sortedCompetitions);
        setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc'); // เปลี่ยนทิศทางการเรียง
    };

    // ฟังก์ชันสำหรับการแบ่งหน้า
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentCompetitions = competitions
        .filter(item => item.title.toLowerCase().includes(searchQuery.toLowerCase()))
        .slice(indexOfFirstItem, indexOfLastItem);

    const totalPages = Math.ceil(competitions.length / itemsPerPage);

    const paginate = (pageNumber) => {
        setCurrentPage(pageNumber);
    };

    return (
        <>
            <Head>
                <title>จัดการข้อมูลการจับคู่</title>
            </Head>
            <Navbar />
            <div className={styles.container}>
                <h2 className={styles.title}>จัดการข้อมูลการจับคู่</h2>
                <input
                    type="text"
                    placeholder="ค้นหารายการการแข่งขัน"
                    value={searchQuery}
                    onChange={handleSearchChange}
                    className={styles.searchInput}
                />
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th className={styles.th}>หัวข้อการแข่งขัน</th>
                            <th className={styles.th}>เกม</th>
                            <th className={styles.th}>ประเภท</th>
                            <th className={styles.th}>จำนวนทีม</th>
                            <th className={styles.th}>
                                ช่วงแข่งขัน
                            </th>
                            <th className={styles.th}>การจัดการ</th>
                        </tr>
                    </thead>
                    <tbody>
                        {currentCompetitions.map((item, index) => (
                            <tr key={index} className={styles.tr}>
                                <td className={styles.td}>{item.title}</td>
                                <td className={styles.td}>{item.gameName}</td>
                                <td className={styles.td}>{item.type}</td>
                                <td className={styles.td}>{item.numberOfTeams}</td>
                                <td className={styles.td}>
                                    {formatDate(item.competitionStartDate)} - {formatDate(item.competitionEndDate)}
                                </td>
                                <td className={styles.td}>
                                    <button 
                                        className={styles.viewButton} 
                                        onClick={() => handleViewDetails(item)}>
                                        จับคู่เเข่งขัน
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {/* การแสดงปุ่มเปลี่ยนหน้า */}
                <div className={styles.pagination}>
                    {Array.from({ length: totalPages }, (_, index) => (
                        <button
                            key={index + 1}
                            onClick={() => paginate(index + 1)}
                            className={currentPage === index + 1 ? styles.activePage : styles.pageButton}
                        >
                            {index + 1}
                        </button>
                    ))}
                </div>
            </div>
        </>
    );
};

export default PairingsAndResults;
