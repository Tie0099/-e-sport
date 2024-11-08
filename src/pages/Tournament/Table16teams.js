import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { db } from '../firebase';
import { collection, doc, onSnapshot, setDoc } from 'firebase/firestore';
import DatePicker, { registerLocale } from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import TimePicker from 'react-time-picker';
import 'react-time-picker/dist/TimePicker.css';
import th from 'date-fns/locale/th';
import styles from '@/styles/TableTeams.module.css';

// ลงทะเบียน locale ภาษาไทย
registerLocale('th', th);

const MatchTable16Teams = () => {
  const [matches, setMatches] = useState({});
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { id: competitionId } = router.query;

  useEffect(() => {
    if (!competitionId) return;

    const unsubscribe = onSnapshot(collection(db, 'Tournament'), (querySnapshot) => {
      const fetchedMatches = {};
      console.log("Fetching data...");

      querySnapshot.forEach((doc) => {
        const matchData = doc.data();
        const docIdParts = doc.id.split('_');

        if (docIdParts.length < 2) {
          console.error(`Invalid document ID format: ${doc.id}`);
          return;
        }

        const [docCompetitionId, matchId] = docIdParts;

        // ตรวจสอบว่า competitionId ตรงกันและเป็นรอบ 16 ทีม
        if (docCompetitionId === competitionId && matchData.round === 'รอบ 16 ทีม') {
          if (!fetchedMatches[docCompetitionId]) {
            fetchedMatches[docCompetitionId] = {};
          }
          fetchedMatches[docCompetitionId][matchId] = matchData;
          console.log(`Match Data: ${JSON.stringify(matchData)}`);
        }
      });

      setMatches(fetchedMatches);
      setLoading(false);
    });

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

  // สร้างแถวคงที่ 8 แถว
  const rows = [...Array(8)].map((_, index) => {
    const matchId = `round${index + 1}`; // ตรวจสอบว่า matchId นี้ตรงกับโครงสร้างข้อมูลที่ถูกต้องใน Firestore
    const match = matches[competitionId] && matches[competitionId][matchId] ? matches[competitionId][matchId] : {};

    return (
      <tr key={index}>
        <td className={styles.cell}>{index + 1}</td>
        <td className={styles.cell}>
          <DatePicker
            selected={match.date ? new Date(match.date) : null}
            onChange={(date) => handleInputChange('date', matchId, date.toISOString())}
            dateFormat="dd/MM/yyyy"
            locale="th"
            placeholderText="เลือกวันที่"
            className={styles.date}
          />
        </td>
        <td className={styles.cell}>
          <TimePicker
            onChange={(time) => handleInputChange('time', matchId, time)}
            value={match.time || ''}
            format="HH:mm"
            className={styles.time}
          />
        </td>
        <td className={styles.cell}>
          {match.team1 ? `${match.team1} VS ${match.team2 || '???'}` : 'รอการจัดทีม'}
        </td>
        <td className={styles.cell}>
          {match.score1 !== undefined && match.score2 !== undefined ? `${match.score1} - ${match.score2}` : 'ยังไม่มีผล'}
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
            onChange={(e) => handleInputChange('notes', matchId, e.target.value)}
          />
        </td>
      </tr>
    );
});

  return (
    <div className={styles.container}>
      <h1>โปรแกรมการแข่งขัน รอบ 16 ทีม</h1>
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
          {rows}
        </tbody>
      </table>
    </div>
  );
};

export default MatchTable16Teams;
