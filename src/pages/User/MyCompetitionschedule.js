import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { db, auth } from '../firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import Favbar from '../component/Favbar';
import { message, Modal } from 'antd';
import '@fortawesome/fontawesome-free/css/all.min.css';
import styles from '@/styles/MyCompetitionschedule.module.css';

// ฟังก์ชันสำหรับแปลงวันที่เป็นรูปแบบไทย
const formatDateThai = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

// ฟังก์ชันสำหรับดึงข้อมูลการแข่งขันที่ผู้ใช้ลงทะเบียน
const fetchUserRegistrations = async (uid) => {
  try {
    const q = query(collection(db, 'Register'), where('userId', '==', uid));
    const querySnapshot = await getDocs(q);
    const competitionIds = [];
    querySnapshot.forEach((doc) => {
      competitionIds.push(doc.data().competitionId);
    });
    return competitionIds;
  } catch (error) {
    console.error('Error fetching registrations: ', error);
    return [];
  }
};

// ฟังก์ชันสำหรับดึงข้อมูลการแข่งขันที่สิ้นสุดแล้ว และเรียงลำดับตามวันที่สิ้นสุด
const fetchCompetitionData = async (uid, setCompetitions) => {
  try {
    const competitionIds = await fetchUserRegistrations(uid);
    if (competitionIds.length === 0) {
      setCompetitions([]); // ถ้าผู้ใช้ไม่มีการแข่งขันที่ลงทะเบียน
      return;
    }

    let competitionsData = [];
    const batchSize = 30;

    for (let i = 0; i < competitionIds.length; i += batchSize) {
      const batchIds = competitionIds.slice(i, i + batchSize);
      const q = query(collection(db, 'competitions'), where('__name__', 'in', batchIds));
      const querySnapshot = await getDocs(q);
      querySnapshot.forEach((doc) => {
        if (!competitionsData.some((comp) => comp.id === doc.id)) {
          competitionsData.push({ id: doc.id, ...doc.data() });
        }
      });
    }

    const today = new Date();
    competitionsData = competitionsData.filter((competition) => {
      return new Date(competition.competitionEndDate) < today; // แสดงเฉพาะการแข่งขันที่สิ้นสุดแล้ว
    });

    competitionsData.sort((a, b) => {
      return new Date(b.competitionEndDate) - new Date(a.competitionEndDate); // เรียงลำดับจากการแข่งขันที่สิ้นสุดล่าสุด
    });

    setCompetitions(competitionsData);
  } catch (error) {
    console.error('เกิดข้อผิดพลาดในการดึงข้อมูลการแข่งขัน: ', error);
  }
};

// ฟังก์ชันสำหรับดึงข้อมูล Tournament (รายละเอียดแมทช์การแข่งขัน)
const fetchTournamentData = async (competitionId, setMatches) => {
  try {
    const q = query(collection(db, 'Tournament'), where('competitionId', '==', competitionId));
    const querySnapshot = await getDocs(q);
    let matchesData = [];
    querySnapshot.forEach((doc) => {
      matchesData.push({ id: doc.id, ...doc.data() });
    });

    matchesData.sort((a, b) => {
      return new Date(a.date) - new Date(b.date);
    });

    setMatches(matchesData);
  } catch (error) {
    console.error('Error fetching tournament data: ', error);
  }
};

export default function MyCompetitionschedule() {
  const [competitions, setCompetitions] = useState([]);
  const [selectedCompetitionId, setSelectedCompetitionId] = useState(null);
  const [matches, setMatches] = useState([]);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState(''); // สร้าง state สำหรับค้นหา
  const router = useRouter();
  const [messageApi, contextHolder] = message.useMessage();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        await fetchCompetitionData(user.uid, setCompetitions);
      } else {
        router.push('/');
      }
    });

    return () => unsubscribe();
  }, [router]);

  // ฟังก์ชันสำหรับจัดการการค้นหา
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleViewDetails = async (id) => {
    setSelectedCompetitionId(id === selectedCompetitionId ? null : id);
    if (id !== selectedCompetitionId) {
      await fetchTournamentData(id, setMatches);
    }
  };

  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = async () => {
    await auth.signOut();
    setShowLogoutModal(false);
    router.push('/');
  };

  // กรองข้อมูลตาม searchTerm
  const filteredCompetitions = competitions.filter((competition) =>
    competition.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <Head>
        <title>ประวัติการแข่งขัน</title>
      </Head>
      <Favbar />
      <div className={styles.pageContainer}>
        <div className={styles.sidebar}>
          <button className={`${styles.sidebarButton} ${router.pathname === '/profile' ? styles.active : ''}`} onClick={() => router.push('/User/profile')}>โปรไฟล์</button>
          <button className={`${styles.sidebarButton} ${router.pathname === '/User/MyTeam' ? styles.active : ''}`} onClick={() => router.push('/User/MyTeam')}>ทีมของคุณ</button>
          <button className={`${styles.sidebarButton} ${router.pathname === '/User1/competition' ? styles.active : ''}`} onClick={() => router.push('/User1/competition')}>สมัครการเเข่งขัน</button>
          <button className={`${styles.sidebarButton} ${router.pathname === '/schedule' ? styles.active : ''}`} onClick={() => router.push('/User/MyCompetitionhistory')}>ตารางการแข่งขัน</button>
          <button className={`${styles.sidebarButton} ${router.pathname === '/history' ? styles.active : ''}`} onClick={() => router.push('/User/MyCompetitionschedule')}>ประวัติการแข่งขัน</button>
          <button className={styles.logoutButton} onClick={handleLogout}>ออกจากระบบ</button>
        </div>
        <div className={styles.mainContent}>
          <div className={styles.teamBox}>
            <div className={styles.searchContainer}>
              <input
                type="text"
                placeholder="Search..."
                className={styles.searchInput}
                value={searchTerm}
                onChange={handleSearchChange}
              />
              <i className={`fas fa-search ${styles.searchIcon}`}></i>
            </div>
            <table className={styles.competitionTable}>
              <thead>
                <tr>
                  <th>ชื่อรายการแข่งขัน</th>
                  <th>วันเริ่ม</th>
                  <th>วันสิ้นสุด</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filteredCompetitions.length === 0 ? (
                  <tr>
                    <td colSpan="4">ไม่มีรายการการแข่งขันที่จะแสดง</td>
                  </tr>
                ) : (
                  filteredCompetitions.map((competition) => (
                    <React.Fragment key={competition.id}>
                      <tr onClick={() => handleViewDetails(competition.id)} className={styles.row}>
                        <td>{competition.title}</td>
                        <td>{competition.competitionStartDate ? formatDateThai(competition.competitionStartDate) : ''}</td> {/* ใช้ competitionStartDate */}
                        <td>{competition.competitionEndDate ? formatDateThai(competition.competitionEndDate) : ''}</td> {/* ใช้ competitionEndDate */}
                        <td>
                          <i className={`fas fa-chevron-${selectedCompetitionId === competition.id ? 'up' : 'down'}`}></i>
                        </td>
                      </tr>

                      {selectedCompetitionId === competition.id && (
                        <tr>
                          <td colSpan="4">
                            <div className={styles.detailsSection}>
                              <table>
                                <thead>
                                  <tr>
                                    <th>ทีม</th>
                                    <th>รอบ</th>
                                    <th>วันแข่ง</th>
                                    <th>เวลา</th>
                                    <th>ทีมที่ชนะ</th>
                                    <th>หมายเหตุ</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {matches.map((match) => (
                                    <tr key={match.id}>
                                      <td>{`${match.team1} VS ${match.team2}`}</td>
                                      <td>{match.round}</td>
                                      <td>{match.date ? formatDateThai(match.date) : ''}</td> {/* ตรวจสอบวันที่ ถ้าไม่มีให้แสดงช่องว่าง */}
                                      <td>{match.time}</td>
                                      <td>{match.teamwin}</td>
                                      <td>{match.notes}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
        <Modal title="ยืนยันการออกจากระบบ" visible={showLogoutModal} onOk={confirmLogout} onCancel={() => setShowLogoutModal(false)} okText="ออกจากระบบ" cancelText="ยกเลิก">
          <p>คุณแน่ใจหรือว่าต้องการออกจากระบบ?</p>
        </Modal>
      </div>
    </>
  );
}
