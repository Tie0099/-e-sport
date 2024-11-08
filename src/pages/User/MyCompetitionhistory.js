import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { db, auth } from '../firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import Favbar from '../component/Favbar';
import { message, Modal } from 'antd';
import styles from '@/styles/MyCompetitionhistory.module.css';
import '@fortawesome/fontawesome-free/css/all.min.css';

const formatDateThai = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

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
    console.error("Error fetching registrations: ", error);
    return [];
  }
};

const fetchCompetitionData = async (uid, setCompetitions) => {
  try {
    const competitionIds = await fetchUserRegistrations(uid);
    if (competitionIds.length === 0) {
      setCompetitions([]);
      return;
    }

    let competitionsData = [];

    const q = query(collection(db, 'competitions'), where('__name__', 'in', competitionIds));
    const querySnapshot = await getDocs(q);
    querySnapshot.forEach((doc) => {
      competitionsData.push({ id: doc.id, ...doc.data() });
    });

    const today = new Date();
    competitionsData = competitionsData.filter((competition) => {
      return new Date(competition.competitionEndDate) >= today;
    });

    competitionsData.sort((a, b) => {
      return new Date(a.competitionStartDate) - new Date(b.competitionStartDate);
    });

    setCompetitions(competitionsData);
  } catch (error) {
    console.error("Error fetching competitions data: ", error);
  }
};

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
    console.error("Error fetching tournament data: ", error);
  }
};

export default function MyCompetitionhistory() {
  const [competitions, setCompetitions] = useState([]);
  const [selectedCompetitionId, setSelectedCompetitionId] = useState(null);
  const [matches, setMatches] = useState([]);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
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

  const handleViewDetails = async (id) => {
    if (selectedCompetitionId === id) {
      setSelectedCompetitionId(null);
    } else {
      setSelectedCompetitionId(id);
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

  return (
    <>
      <Head>
        <title>ตารางการแข่งขัน</title>
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
                {competitions.length === 0 ? (
                  <tr>
                    <td colSpan="4">ไม่มีรายการการแข่งขันที่จะแสดง</td>
                  </tr>
                ) : (
                  competitions.map((competition) => (
                    <React.Fragment key={competition.id}>
                      <tr onClick={() => handleViewDetails(competition.id)} className={styles.row}>
                        <td>{competition.title}</td>
                        <td>{formatDateThai(competition.competitionStartDate)}</td> {/* เปลี่ยนเป็น competitionStartDate */}
                        <td>{formatDateThai(competition.competitionEndDate)}</td> {/* เปลี่ยนเป็น competitionEndDate */}
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
                                    <th>ผลการแข่ง</th>
                                    <th>ทีมที่ชนะ</th>
                                    <th>หมายเหตุ</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {matches.map((match) => (
                                    <tr key={match.id}>
                                      <td>{`${match.team1} VS ${match.team2}`}</td>
                                      <td>{match.round}</td>
                                      <td>{match.date ? formatDateThai(match.date) : ''}</td> {/* ตรวจสอบวันที่ ถ้าไม่มี ให้แสดงช่องว่าง */}
                                      <td>{match.time}</td>
                                      <td>{`${match.score1} - ${match.score2}`}</td>
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
