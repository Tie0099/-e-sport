import { useState, useEffect } from 'react';
import { collection, doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import DatePicker, { registerLocale } from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css'; // ต้อง import ไฟล์ CSS ของ react-datepicker
import { useRouter } from 'next/router'; // ใช้ในการดึงค่า competitionId จาก URL
import th from 'date-fns/locale/th'; // นำเข้า locale ภาษาไทยสำหรับ react-datepicker
import TimePicker from 'react-time-picker'; // สำหรับการเลือกเวลา
import 'react-time-picker/dist/TimePicker.css'; // นำเข้า CSS ของ react-time-picker
import styles from '@/styles/TableTeams.module.css';

// ลงทะเบียน locale ภาษาไทย
registerLocale('th', th);

const MatchTableSemifinal = () => {
  const [matches, setMatches] = useState({});
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { id: competitionId } = router.query; // ดึง competitionId จาก URL

  useEffect(() => {
    if (!competitionId) return;

    const unsubscribe = onSnapshot(collection(db, 'Tournament'), (querySnapshot) => {
      const fetchedMatches = {};

      querySnapshot.forEach((doc) => {
        const matchData = doc.data();
        const docIdParts = doc.id.split('_'); // แยก competitionId และ matchId จาก doc.id

        if (docIdParts.length !== 2) {
          console.error(`Invalid document ID format: ${doc.id}`);
          return;
        }

        const [docCompetitionId, matchId] = docIdParts;

        if (docCompetitionId === competitionId && matchId.includes('semifinal')) {
          if (!fetchedMatches[docCompetitionId]) {
            fetchedMatches[docCompetitionId] = {}; // สร้าง object สำหรับ competitionId ใหม่
          }
          fetchedMatches[docCompetitionId][matchId] = matchData; // เก็บข้อมูลการแข่งขันไว้ภายใต้ competitionId
        }
      });

      setMatches(fetchedMatches);
      setLoading(false);
    });

    // Cleanup subscription เมื่อ component ถูก unmount
    return () => unsubscribe();
  }, [competitionId]);

  const handleInputChange = async (field, matchId, value) => {
    const matchRef = doc(db, 'Tournament', `${competitionId}_${matchId}`);
    await setDoc(matchRef, { [field]: value }, { merge: true });
    setMatches((prevMatches) => ({
      ...prevMatches,
      [competitionId]: {
        ...prevMatches[competitionId],
        [matchId]: {
          ...prevMatches[competitionId][matchId],
          [field]: value,
        },
      },
    }));
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  const currentMatches = matches[competitionId] || {};

  return (
    <div className={styles.container}>
      <h1>โปรแกรมการแข่งขัน รอบ 4 ทีม</h1>
      <table className={styles.table}>
        <thead>
          <tr>
            <th className={styles.headerCell}>ลำดับ</th>
            <th className={styles.headerCell}>วันที่</th>
            <th className={styles.headerCell}>เวลา</th>
            <th className={styles.headerCell}>ระหว่าง</th>
            <th className={styles.headerCell}>ผลการแข่งขัน</th>
            <th className={styles.headerCell}>ทีมชนะ</th>
            <th className={styles.headerCell}>หมายเหตุ</th>
          </tr>
        </thead>
        <tbody>
          {[...Array(2)].map((_, index) => {
            const match = currentMatches[`semifinal${index + 1}`] || {};
            return (
              <tr key={index}>
                <td className={styles.cell}>{index + 1}</td> {/* ลำดับ */}
                <td className={styles.cell}>
                  <DatePicker
                    selected={match.date ? new Date(match.date) : null}
                    onChange={(date) => handleInputChange('date', `semifinal${index + 1}`, date.toISOString())}
                    dateFormat="dd/MM/yyyy" // รูปแบบ วว/ดด/ปปป
                    locale="th" // ใช้ภาษาไทย
                    placeholderText="เลือกวันที่"
                    className={styles.date}
                  />
                </td>
                <td className={styles.cell}>
                  <TimePicker
                    onChange={(time) => handleInputChange('time', `semifinal${index + 1}`, time)}
                    value={match.time || ''}
                    format="HH:mm" // แสดงเวลาแบบ 24 ชั่วโมง
                    className={styles.time}
                  />
                </td>
                <td className={styles.cell}>
                  {match.team1
                    ? `${match.team1} VS ${match.team2 || '???'}`
                    : 'รอการจัดทีม'}
                </td>
                <td className={styles.cell}>
                  {match.score1 !== undefined && match.score2 !== undefined
                    ? `${match.score1} - ${match.score2}`
                    : 'ยังไม่มีผล'}
                </td>
                <td className={styles.cell}>
                  {match.teamwin ? match.teamwin : 'ยังไม่มีทีมชนะ'}
                </td>
                <td className={styles.cell}>
                  <input
                    className={styles.input}
                    type="text"
                    placeholder="หมายเหตุ"
                    value={match.notes || ''}
                    onChange={(e) => handleInputChange('notes', `semifinal${index + 1}`, e.target.value)}
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default MatchTableSemifinal;
