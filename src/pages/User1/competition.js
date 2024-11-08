import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router'; // นำเข้า useRouter สำหรับการจัดการเส้นทาง
import styles from '@/styles/competition.module.css';
import { db, auth } from '../firebase'; // นำเข้า auth และ db จาก firebase.js
import { collection, getDocs, query, where, doc, updateDoc, addDoc, getDoc } from 'firebase/firestore';
import Head from 'next/head';
import Favbar from '../component/Favbar';
import { onAuthStateChanged } from 'firebase/auth';
import { message, Modal } from 'antd'; // เพิ่ม Modal จาก antd

// ฟังก์ชันแปลงวันที่เป็นพุทธศักราช
const convertToBuddhistYear = (dateStr) => {
    const date = new Date(dateStr);
    const buddhistYear = date.getFullYear() + 543;
    const formattedDate = `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${buddhistYear}`;
    return formattedDate;
};

// ดึงข้อมูลการแข่งขัน
const fetchCompetitionsData = async (setCompetitions) => {
    try {
        const today = new Date(); // วันที่ปัจจุบัน
        const querySnapshot = await getDocs(collection(db, 'competitions'));
        const competitionsData = await Promise.all(querySnapshot.docs.map(async (doc) => {
            const data = doc.data();
            const endDate = new Date(data.competitionEndDate); // แปลง competitionEndDate ให้เป็นรูปแบบวันที่

            // ตรวจสอบว่าการแข่งขันสิ้นสุดแล้วหรือยัง ถ้าเลยวันปัจจุบันไปแล้วจะไม่แสดง
            if (endDate >= today) {
                const registerQuery = query(collection(db, 'Register'), where('competitionId', '==', doc.id));
                const registerSnapshot = await getDocs(registerQuery);
                const registeredTeams = registerSnapshot.size;

                return {
                    id: doc.id,
                    ...data,
                    registeredTeams,
                    numberOfTeams: data.numberOfTeams || '??'
                };
            } else {
                return null; // ถ้าการแข่งขันจบไปแล้วจะ return null
            }
        }));

        // กรองข้อมูลเพื่อเอาการแข่งขันที่เป็น null ออก
        let filteredCompetitions = competitionsData.filter(competition => competition !== null);

        // เรียงลำดับการแข่งขันตามวันที่เริ่มต้น (registrationStartDate)
        filteredCompetitions = filteredCompetitions.sort((a, b) => new Date(a.registrationStartDate) - new Date(b.registrationStartDate));

        // ตั้งค่าลิสต์การแข่งขันที่ผ่านการเรียงแล้ว
        setCompetitions(filteredCompetitions);
    } catch (error) {
        console.error("Error fetching competitions data: ", error);
    }
};


// ฟังก์ชันกรองทีมที่ลงทะเบียนแล้วในรายการที่ยังไม่สิ้นสุด
const fetchRegisteredTeams = async (setTeams, userUid) => {
    try {
        const today = new Date(); // วันที่ปัจจุบัน
        const teamsQuerySnapshot = await getDocs(query(collection(db, 'teams'), where('uid', '==', userUid)));
        const teamsData = [];

        await Promise.all(teamsQuerySnapshot.docs.map(async (teamDoc) => {
            const team = teamDoc.data();
            const registerQuery = query(collection(db, 'Register'), where('teamId', '==', teamDoc.id));
            const registerSnapshot = await getDocs(registerQuery);

            // ตรวจสอบว่าทีมนี้มีการแข่งขันที่ยังไม่สิ้นสุดหรือไม่
            let isTeamActive = false;
            await Promise.all(registerSnapshot.docs.map(async (registerDoc) => {
                const competitionId = registerDoc.data().competitionId;
                const competitionDoc = await getDoc(doc(db, 'competitions', competitionId));

                if (competitionDoc.exists()) {
                    const competitionData = competitionDoc.data();
                    const endDate = new Date(competitionData.competitionEndDate); // ใช้ competitionEndDate ในการตรวจสอบ

                    // ถ้าการแข่งขันยังไม่สิ้นสุด ทีมนี้จะถือว่ายัง active อยู่
                    if (endDate >= today) {
                        isTeamActive = true;
                    }
                }
            }));

            // ถ้าทีมนี้ไม่ได้มีการลงแข่งในรายการที่ยังไม่จบ ให้แสดงในลิสต์ทีม
            if (!isTeamActive) {
                teamsData.push({ id: teamDoc.id, ...team });
            }
        }));

        setTeams(teamsData);
    } catch (error) {
        console.error("Error fetching teams data: ", error);
    }
};


// ฟังก์ชันตรวจสอบว่าผู้ใช้สมัครแข่งขันแล้วหรือยัง
const checkUserAlreadyRegistered = async (competitionId, userUid) => {
    try {
        const q = query(collection(db, 'Register'), where('competitionId', '==', competitionId), where('userId', '==', userUid));
        const querySnapshot = await getDocs(q);
        return querySnapshot.size > 0; // ถ้ามีข้อมูลใน Register แสดงว่าผู้ใช้ได้สมัครแล้ว
    } catch (error) {
        console.error("Error checking registration: ", error);
        return false;
    }
};

export default function Competition() {
    const [competitions, setCompetitions] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [selectedCompetition, setSelectedCompetition] = useState(null);
    const [currentCompetitionTitle, setCurrentCompetitionTitle] = useState(''); // State ใหม่สำหรับเก็บชื่อการแข่งขัน
    const [imagePreview, setImagePreview] = useState(null);
    const [teams, setTeams] = useState([]);
    const [selectedTeam, setSelectedTeam] = useState(null);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [messageApi, contextHolder] = message.useMessage();
    const [showLogoutModal, setShowLogoutModal] = useState(false); // เพิ่ม State สำหรับ modal logout
    const [showConfirmModal, setShowConfirmModal] = useState(false); // สำหรับ Modal ยืนยันการสมัคร
    const router = useRouter(); // ใช้ useRouter สำหรับการจัดการเส้นทาง

    useEffect(() => {
        const fetchData = async () => {
            onAuthStateChanged(auth, async (user) => {
                if (user) {
                    setUser(user);
                    await fetchRegisteredTeams(setTeams, user.uid); // ดึงทีมที่ลงทะเบียนแล้ว และกรองทีมที่มีการแข่งขันยังไม่จบ
                } else {
                    console.error("No user logged in");
                }
            });
            await fetchCompetitionsData(setCompetitions);
            setLoading(false);
        };
        fetchData();
    }, []);
    

    const handleLogout = () => {
        setShowLogoutModal(true); // เปิด modal logout
    };

    const confirmLogout = async () => {
        await auth.signOut();
        setShowLogoutModal(false); // ปิด modal หลังจาก logout
        router.push('/');
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        
        if (!selectedCompetition || !selectedTeam) {
            messageApi.error('กรุณาเลือกทีม.'); // ใช้ messageApi เพื่อแสดงข้อผิดพลาด
            return;
        }
    
        // ตรวจสอบขนาดทีมตามประเภทการแข่งขัน
        if (selectedCompetition.type === 'ทีม') {
            const teamSize = selectedTeam.members.length;
            if (teamSize < selectedCompetition.teamSize || teamSize > (parseInt(selectedCompetition.teamSize) + 1)) {
                messageApi.error(`ทีมต้องมีสมาชิก ${selectedCompetition.teamSize} คน (รวมสำรองไม่เกิน ${parseInt(selectedCompetition.teamSize) + 1} คน)`);
                return;
            }
        } else if (selectedCompetition.type === 'เดี่ยว') {
            if (selectedTeam.members.length !== 1) {
                messageApi.error('การแข่งขันเดี่ยวต้องมีสมาชิก 1 คนเท่านั้น');
                return;
            }
        } else if (selectedCompetition.type === 'คู่') {
            if (selectedTeam.members.length < 2 || selectedTeam.members.length > 3) {
                messageApi.error('การแข่งขันคู่ต้องมีสมาชิก 2 คน (รวมสำรองไม่เกิน 3 คน)');
                return;
            }
        }
    
        // ตรวจสอบว่าผู้ใช้สมัครการแข่งขันนี้แล้วหรือยัง
        const alreadyRegistered = await checkUserAlreadyRegistered(selectedCompetition.id, user.uid);
        if (alreadyRegistered) {
            messageApi.error('คุณได้สมัครการแข่งขันนี้แล้ว ไม่สามารถสมัครซ้ำได้');
            return;
        }
    
        // หากผ่านการตรวจสอบทั้งหมด สมัครเข้าร่วมการแข่งขัน
        try {
            const registrationDate = convertToBuddhistYear(new Date().toISOString());
            await addDoc(collection(db, 'Register'), {
                competitionId: selectedCompetition.id,
                competitionTitle: selectedCompetition.title,
                teamId: selectedTeam.id,
                teamName: selectedTeam.team_name,
                userId: user.uid,
                registrationDate
            });
    
            // อัปเดตจำนวนทีมที่ลงทะเบียน
            const newRegisteredTeams = selectedCompetition.registeredTeams + 1;
            await updateDoc(doc(db, 'competitions', selectedCompetition.id), {
                registeredTeams: newRegisteredTeams
            });
    
            setShowForm(false);
            setSelectedCompetition(null);
            setImagePreview(null);
            setSelectedTeam(null);
            await fetchCompetitionsData(setCompetitions);
            messageApi.success('สมัครการแข่งขันสำเร็จ');
        } catch (error) {
            console.error('Error submitting form:', error);
            messageApi.error('เกิดข้อผิดพลาดในการสมัครแข่งขัน');
        }
    };    

    const handleShowForm = (competition) => {
        setSelectedCompetition(competition);
        setCurrentCompetitionTitle(competition.title); // อัพเดตชื่อการแข่งขันที่เลือก
        setShowForm(true);
    };

    const handleTeamChange = (e) => {
        const teamId = e.target.value;
        const team = teams.find(t => t.id === teamId);
        setSelectedTeam(team);
        setImagePreview(team ? team.imageUrl : null);
    };

    const handleConfirmSubmit = () => {
        // เปิด Modal ยืนยันเมื่อผู้ใช้กดยืนยันการสมัคร
        if (!selectedCompetition || !selectedTeam) {
            alert('กรุณาเลือกทีม.');
            return;
        }
        setShowConfirmModal(true);
    };

    if (loading) {
        return <div>Loading...</div>;
    }

    return (
        <>
            <Head>
                <title>การแข่งขัน</title>
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
                <div className={styles.mainContainer}>
                    <h1 className={styles.title}>รายการแข่งขัน</h1>
                    <div className={styles.competitionContainer}>
                        {competitions.map((competition) => (
                            <div key={competition.id} className={styles.competitionCard}>
                                <div className={styles.competitionDetailsRow}>  {/* เพิ่ม div สำหรับจัดกลุ่มข้อมูล */}
                                    <span className={styles.competitionTitle}>{competition.title}</span>
                                    <span>{competition.game}</span>
                                    <span>- {competition.type} -</span>
                                    <span>เวลาลงทะเบียน: {convertToBuddhistYear(competition.registrationStartDate)} - {convertToBuddhistYear(competition.registrationEndDate)}</span>
                                    <span>จำนวนทีมที่ลงเเข่ง: {`${competition.registeredTeams}/${competition.numberOfTeams}`}</span>
                                    <button onClick={() => handleShowForm(competition)} className={styles.registerButton}>สมัครการแข่งขัน</button>
                                </div>
                            </div>

                        ))}
                    </div>
                </div>

                {showForm && (
                    <div className={styles.formOverlay}>
                        <div className={styles.formContainer}>
                            <h2 className={styles.formTitle}>สมัครการแข่งขัน: {currentCompetitionTitle}</h2> {/* แสดงชื่อการแข่งขันที่กำลังสมัคร */}
                            <p className={styles.competitionDates}>
                                การแข่งขันระหว่างวันที่: {convertToBuddhistYear(selectedCompetition?.competitionStartDate)} - {convertToBuddhistYear(selectedCompetition?.competitionEndDate)}
                            </p> {/* แสดงวันที่เริ่มและสิ้นสุดการแข่งขัน */}
                            <form onSubmit={(e) => e.preventDefault()}>
                                <div className={styles.imageUploadContainer}>
                                    {imagePreview ? (
                                        <img src={imagePreview} alt="Preview" className={styles.imagePreview} />
                                    ) : (
                                        <div className={styles.imagePlaceholder}>รูปทีม</div>
                                    )}
                                </div>
                                {teams.length > 0 ? (
                                    <select value={selectedTeam ? selectedTeam.id : ''} onChange={handleTeamChange} className={styles.input}>
                                        <option value="" disabled hidden>เลือกทีม</option>
                                        {teams.map((team) => (
                                            <option key={team.id} value={team.id}>{team.team_name}</option>
                                        ))}
                                    </select>
                                ) : (
                                    <select className={styles.input} disabled>
                                        <option value="" hidden>ไม่มีทีมให้เลือก</option>
                                    </select>
                                )}
                                <button type="button" onClick={handleConfirmSubmit} className={styles.submitButton}>ยืนยัน</button>
                                <button type="button" onClick={() => setShowForm(false)} className={styles.cancelButton}>ยกเลิก</button>
                            </form>
                        </div>
                    </div>
                )}
            </div>

            {/* Modal สำหรับยืนยันการสมัครการแข่งขัน */}
            <Modal
                title="ยืนยันการสมัครการแข่งขัน"
                visible={showConfirmModal}
                onOk={handleFormSubmit}
                onCancel={() => setShowConfirmModal(false)}
                okText="ยืนยัน"
                cancelText="ยกเลิก"
            >
                <p>เมื่อคุณลงทะเบียนทีมในการแข่งขันนี้แล้ว คุณจะไม่สามารถใช้ทีมนี้สมัครการแข่งขันอื่นได้จนกว่าการแข่งขันจะสิ้นสุดลง</p>
            </Modal>

            {/* Modal สำหรับยืนยันการออกจากระบบ */}
            <Modal
                title="ยืนยันการออกจากระบบ"
                visible={showLogoutModal}
                onOk={confirmLogout}
                onCancel={() => setShowLogoutModal(false)}
                okText="ออกจากระบบ"
                cancelText="ยกเลิก"
            >
                <p>คุณแน่ใจหรือไม่ว่าต้องการออกจากระบบ?</p>
            </Modal>
        </>
    );
}
