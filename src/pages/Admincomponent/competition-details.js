import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { db } from '../firebase';
import { doc, getDoc, collection, getDocs, updateDoc, setDoc } from 'firebase/firestore';
import Navbar from './Navbaradmin';
import Head from 'next/head';
import styles from '@/styles/CompetitionDetails.module.css';
import Table8teams from '../Tournament/Table8teams';
import Table16teams from '../Tournament/Table16teams';
import Table32teams from '../Tournament/Table32teams';
import Table4teams from '../Tournament/Table4teams';
import TableWin from '../Tournament/TableWin';
import TournamentBracket8 from '../Tournament/TournamentBracket8';
import TournamentBracket16 from '../Tournament/TournamentBracket16';
import TournamentBracket32 from '../Tournament/TournamentBracket32';

const CompetitionDetails = () => {
  const router = useRouter();
  const { id: competitionId } = router.query;
  const [competition, setCompetition] = useState(null);
  const [teams, setTeams] = useState([]);
  const [matches, setMatches] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (competitionId) {
      fetchCompetitionDetails();
      fetchTeams();
      fetchMatches();
    }
  }, [competitionId]);

  const fetchCompetitionDetails = async () => {
    setLoading(true);
    const docRef = doc(db, 'competitions', competitionId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      setCompetition(docSnap.data());
    } else {
      console.log("ไม่มีเอกสารดังกล่าว!");
    }
    setLoading(false);
  };

  const fetchTeams = async () => {
    setLoading(true);
    try {
      const querySnapshot = await getDocs(collection(db, "Register"));
      const teamList = querySnapshot.docs
        .filter(doc => doc.data().competitionId === competitionId && !doc.data().isMatched)
        .map(doc => ({
          teamName: doc.data().teamName,
          teamId: doc.id
        }));
      setTeams(teamList);
    } catch (error) {
      console.error("เกิดข้อผิดพลาดในการดึงข้อมูลทีม:", error);
    }
    setLoading(false);
  };

  const fetchMatches = async () => {
    const matchesRef = collection(db, 'Tournament');
    const querySnapshot = await getDocs(matchesRef);
  
    const fetchedMatches = {};
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      const docId = doc.id;
  
      const [docCompetitionId, matchId] = docId.split('_');
  
      if (docCompetitionId === competitionId) {
        fetchedMatches[matchId] = {
          team1: data.team1 || '',
          team2: data.team2 || '',
          score1: data.score1 || '',
          score2: data.score2 || '',
          teamwin: data.teamwin || '',
          teamlost: data.teamlost || '',
          date: data.date || '',
          time: data.time || '',
          round: data.round || '' // เพิ่มฟิลด์รอบการแข่งขัน
        };
  
        if (data.team1) removeTeamFromList(data.team1);
        if (data.team2) removeTeamFromList(data.team2);
      }
    });
  
    setMatches(fetchedMatches);
  };

  const removeTeamFromList = (teamName) => {
    setTeams(prevTeams => prevTeams.filter(team => team.teamName !== teamName));
  };

  const addTeamToList = (teamName) => {
    if (!teams.some(team => team.teamName === teamName)) {
      setTeams(prevTeams => [...prevTeams, { teamName }]);
    }
  };

  const handleRemoveTeam = (matchId, teamKey) => {
    const match = matches[matchId];

    if (match[teamKey]) {
      addTeamToList(match[teamKey]);

      const updatedMatch = {
        ...match,
        [teamKey]: '',
      };

      setMatches((prevMatches) => ({
        ...prevMatches,
        [matchId]: updatedMatch,
      }));

      addOrUpdateMatch(matchId, updatedMatch.team1, updatedMatch.score1, updatedMatch.team2, updatedMatch.score2);
    }
  };

  const handleDrop = (e, matchId, teamKey) => {
    e.preventDefault();
    const teamName = e.dataTransfer.getData('text/plain');
  
    // เพิ่มการรองรับการลากวางในคู่ที่ 1-32
    if ([...Array(32).keys()].map(i => `match${i+1}`).includes(matchId)) {
      const match = matches[matchId];
  
      const updatedMatch = {
        ...match,
        [teamKey]: teamName,
      };
  
      setMatches((prevMatches) => ({
        ...prevMatches,
        [matchId]: updatedMatch,
      }));
  
      removeTeamFromList(teamName);
      addOrUpdateMatch(matchId, updatedMatch.team1, updatedMatch.score1, updatedMatch.team2, updatedMatch.score2);
  
      saveMatchWithCompetitionId(matchId, updatedMatch, competitionId);
    }
  };  

  const saveMatchWithCompetitionId = async (matchId, matchData, competitionId) => {
    try {
      const matchRef = doc(db, 'Tournament', `${competitionId}_${matchId}`);
      const matchSnapshot = await getDoc(matchRef);
  
      const updatedData = {
        ...matchData,
        competitionId: competitionId
      };
  
      if (matchSnapshot.exists()) {
        await updateDoc(matchRef, updatedData);
      } else {
        await setDoc(matchRef, updatedData);
      }
    } catch (error) {
      console.error("เกิดข้อผิดพลาดในการบันทึกการแข่งขัน:", error);
    }
  };

  const handleDragStartFromBracket = (e, matchId, teamKey) => {
    const teamName = matches[matchId][teamKey];
    if (teamName) {
      e.dataTransfer.setData('text/plain', teamName);
      handleRemoveTeam(matchId, teamKey);
    }
  };

  const handleScoreChange = (matchId, score1, score2) => {
    const match = matches[matchId];
    let teamwin = '';
    let teamlost = '';

    if (parseInt(score1) === 2) {
      teamwin = match.team1;
      teamlost = match.team2;
    } else if (parseInt(score2) === 2) {
      teamwin = match.team2;
      teamlost = match.team1;
    }

    const updatedMatch = {
      ...match,
      score1,
      score2,
      teamwin,
      teamlost,
    };

    setMatches((prevMatches) => ({
      ...prevMatches,
      [matchId]: updatedMatch,
    }));

    addOrUpdateMatch(matchId, updatedMatch.team1, score1, updatedMatch.team2, score2);

    if (teamwin) {
      updateNextRoundTeams(matchId, teamwin);
    }
  };

  const updateNextRoundTeams = (matchId, winningTeam) => {
    const numberOfTeams = parseInt(competition?.numberOfTeams, 10);
  
    let nextRoundMapping;
  
    if (numberOfTeams === 8) {
      // แผนภูมิ 8 ทีม
      nextRoundMapping = {
        match1: { nextMatchId: 'semifinal1', teamKey: 'team1', round: 'รอบ 8 ทีม' },
        match2: { nextMatchId: 'semifinal1', teamKey: 'team2', round: 'รอบ 8 ทีม' },
        match3: { nextMatchId: 'semifinal2', teamKey: 'team1', round: 'รอบ 8 ทีม' },
        match4: { nextMatchId: 'semifinal2', teamKey: 'team2', round: 'รอบ 8 ทีม' },
        semifinal1: { nextMatchId: 'final', teamKey: 'team1', loserMatchId: 'thirdPlace', loserKey: 'team1', round: 'รอบรองชนะเลิศ' },
        semifinal2: { nextMatchId: 'final', teamKey: 'team2', loserMatchId: 'thirdPlace', loserKey: 'team2', round: 'รอบรองชนะเลิศ' },
      };
    } else if (numberOfTeams === 16) {
      // แผนภูมิ 16 ทีม
      nextRoundMapping = {
        match1: { nextMatchId: 'quarterfinal1', teamKey: 'team1', round: 'รอบ 16 ทีม' },
        match2: { nextMatchId: 'quarterfinal1', teamKey: 'team2', round: 'รอบ 16 ทีม' },
        match3: { nextMatchId: 'quarterfinal2', teamKey: 'team1', round: 'รอบ 16 ทีม' },
        match4: { nextMatchId: 'quarterfinal2', teamKey: 'team2', round: 'รอบ 16 ทีม' },
        match5: { nextMatchId: 'quarterfinal3', teamKey: 'team1', round: 'รอบ 16 ทีม' },
        match6: { nextMatchId: 'quarterfinal3', teamKey: 'team2', round: 'รอบ 16 ทีม' },
        match7: { nextMatchId: 'quarterfinal4', teamKey: 'team1', round: 'รอบ 16 ทีม' },
        match8: { nextMatchId: 'quarterfinal4', teamKey: 'team2', round: 'รอบ 16 ทีม' },
        quarterfinal1: { nextMatchId: 'semifinal1', teamKey: 'team1', round: 'รอบ 8 ทีม' },
        quarterfinal2: { nextMatchId: 'semifinal1', teamKey: 'team2', round: 'รอบ 8 ทีม' },
        quarterfinal3: { nextMatchId: 'semifinal2', teamKey: 'team1', round: 'รอบ 8 ทีม' },
        quarterfinal4: { nextMatchId: 'semifinal2', teamKey: 'team2', round: 'รอบ 8 ทีม' },
        semifinal1: { nextMatchId: 'final', teamKey: 'team1', loserMatchId: 'thirdPlace', loserKey: 'team1', round: 'รอบรองชนะเลิศ' },
        semifinal2: { nextMatchId: 'final', teamKey: 'team2', loserMatchId: 'thirdPlace', loserKey: 'team2', round: 'รอบรองชนะเลิศ' },
      };
    } else if (numberOfTeams === 32) {
      // แผนภูมิ 32 ทีม
      nextRoundMapping = {
        match1: { nextMatchId: 'round1', teamKey: 'team1', round: 'รอบ 32 ทีม' },
        match2: { nextMatchId: 'round1', teamKey: 'team2', round: 'รอบ 32 ทีม' },
        match3: { nextMatchId: 'round2', teamKey: 'team1', round: 'รอบ 32 ทีม' },
        match4: { nextMatchId: 'round2', teamKey: 'team2', round: 'รอบ 32 ทีม' },
        match5: { nextMatchId: 'round3', teamKey: 'team1', round: 'รอบ 32 ทีม' },
        match6: { nextMatchId: 'round3', teamKey: 'team2', round: 'รอบ 32 ทีม' },
        match7: { nextMatchId: 'round4', teamKey: 'team1', round: 'รอบ 32 ทีม' },
        match8: { nextMatchId: 'round4', teamKey: 'team2', round: 'รอบ 32 ทีม' },
        match9: { nextMatchId: 'round5', teamKey: 'team1', round: 'รอบ 32 ทีม' },
        match10: { nextMatchId: 'round5', teamKey: 'team2', round: 'รอบ 32 ทีม' },
        match11: { nextMatchId: 'round6', teamKey: 'team1', round: 'รอบ 32 ทีม' },
        match12: { nextMatchId: 'round6', teamKey: 'team2', round: 'รอบ 32 ทีม' },
        match13: { nextMatchId: 'round7', teamKey: 'team1', round: 'รอบ 32 ทีม' },
        match14: { nextMatchId: 'round7', teamKey: 'team2', round: 'รอบ 32 ทีม' },
        match15: { nextMatchId: 'round8', teamKey: 'team1', round: 'รอบ 32 ทีม' },
        match16: { nextMatchId: 'round8', teamKey: 'team2', round: 'รอบ 32 ทีม' },
        round1: { nextMatchId: 'quarterfinal1', teamKey: 'team1', round: 'รอบ 16 ทีม' },
        round2: { nextMatchId: 'quarterfinal1', teamKey: 'team2', round: 'รอบ 16 ทีม' },
        round3: { nextMatchId: 'quarterfinal2', teamKey: 'team1', round: 'รอบ 16 ทีม' },
        round4: { nextMatchId: 'quarterfinal2', teamKey: 'team2', round: 'รอบ 16 ทีม' },
        round5: { nextMatchId: 'quarterfinal3', teamKey: 'team1', round: 'รอบ 16 ทีม' },
        round6: { nextMatchId: 'quarterfinal3', teamKey: 'team2', round: 'รอบ 16 ทีม' },
        round7: { nextMatchId: 'quarterfinal4', teamKey: 'team1', round: 'รอบ 16 ทีม' },
        round8: { nextMatchId: 'quarterfinal4', teamKey: 'team2', round: 'รอบ 16 ทีม' },
        quarterfinal1: { nextMatchId: 'semifinal1', teamKey: 'team1', round: 'รอบ 8 ทีม' },
        quarterfinal2: { nextMatchId: 'semifinal1', teamKey: 'team2', round: 'รอบ 8 ทีม' },
        quarterfinal3: { nextMatchId: 'semifinal2', teamKey: 'team1', round: 'รอบ 8 ทีม' },
        quarterfinal4: { nextMatchId: 'semifinal2', teamKey: 'team2', round: 'รอบ 8 ทีม' },
        semifinal1: { nextMatchId: 'final', teamKey: 'team1', loserMatchId: 'thirdPlace', loserKey: 'team1', round: 'รอบรองชนะเลิศ' },
        semifinal2: { nextMatchId: 'final', teamKey: 'team2', loserMatchId: 'thirdPlace', loserKey: 'team2', round: 'รอบรองชนะเลิศ' },
      };
    }
  
    const mapping = nextRoundMapping?.[matchId]; // ตรวจสอบว่า nextRoundMapping ไม่เป็น undefined
  
    if (mapping) {
      const { nextMatchId, teamKey, loserMatchId, loserKey, round } = mapping;
  
      setMatches((prevMatches) => {
        const updatedMatches = { ...prevMatches };
  
        if (nextMatchId) {
          updatedMatches[nextMatchId] = {
            ...updatedMatches[nextMatchId],
            [teamKey]: winningTeam,
            round: round || '' // เพิ่มรอบการแข่งขัน
          };
        }
  
        if (loserMatchId && loserKey) {
          const losingTeam = matches[matchId].teamlost;
          if (losingTeam) {
            updatedMatches[loserMatchId] = {
              ...updatedMatches[loserMatchId],
              [loserKey]: losingTeam,
            };
          }
        }
  
        return updatedMatches;
      });
  
      addOrUpdateMatch(nextMatchId, winningTeam, '', '', '');
      if (loserMatchId && matches[matchId].teamlost) {
        addOrUpdateMatch(loserMatchId, matches[matchId].teamlost, '', '', '');
      }
    }
  };  

  const addOrUpdateMatch = async (matchId, teamName1, score1, teamName2, score2) => {
    const matchRef = doc(db, 'Tournament', `${competitionId}_${matchId}`);
    const matchSnapshot = await getDoc(matchRef);
  
    // เพิ่มการจัดการฟิลด์ round ที่จะถูกบันทึกใน Firebase
    const round = getRoundName(matchId);
  
    const updatedData = {
      team1: teamName1 || '',  // ถ้า teamName1 เป็น undefined ให้ใช้ค่า ''
      score1: score1 !== undefined ? score1 : '',  // ตรวจสอบ score1 ถ้าเป็น undefined
      team2: teamName2 || '',  // ถ้า teamName2 เป็น undefined ให้ใช้ค่า ''
      score2: score2 !== undefined ? score2 : '',  // ตรวจสอบ score2 ถ้าเป็น undefined
      competitionId: competitionId,
      teamwin: score1 === '2' ? teamName1 : score2 === '2' ? teamName2 : '',
      teamlost: score1 === '2' ? teamName2 : score2 === '2' ? teamName1 : '',
      round: round // เพิ่มฟิลด์ round ที่จะบันทึกใน Firebase
    };
  
    Object.keys(updatedData).forEach(key => {
      if (updatedData[key] === undefined) {
        delete updatedData[key];
      }
    });
  
    // บันทึกข้อมูลลง Firebase
    if (matchSnapshot.exists()) {
      await updateDoc(matchRef, updatedData);
    } else {
      await setDoc(matchRef, updatedData);
    }
  };  

  const getRoundName = (matchId) => {
    const numberOfTeams = parseInt(competition?.numberOfTeams, 10);
  
    const roundsByTeams = {
      8: {
        match1: 'รอบ 8 ทีม',
        match2: 'รอบ 8 ทีม',
        match3: 'รอบ 8 ทีม',
        match4: 'รอบ 8 ทีม',
        semifinal1: 'รอบรองชนะเลิศ',
        semifinal2: 'รอบรองชนะเลิศ',
        final: 'รอบชิงชนะเลิศ',
        thirdPlace: 'รอบชิงที่ 3',
      },
      16: {
        match1: 'รอบ 16 ทีม',
        match2: 'รอบ 16 ทีม',
        match3: 'รอบ 16 ทีม',
        match4: 'รอบ 16 ทีม',
        match5: 'รอบ 16 ทีม',
        match6: 'รอบ 16 ทีม',
        match7: 'รอบ 16 ทีม',
        match8: 'รอบ 16 ทีม',
        quarterfinal1: 'รอบ 8 ทีม',
        quarterfinal2: 'รอบ 8 ทีม',
        quarterfinal3: 'รอบ 8 ทีม',
        quarterfinal4: 'รอบ 8 ทีม',
        semifinal1: 'รอบรองชนะเลิศ',
        semifinal2: 'รอบรองชนะเลิศ',
        final: 'รอบชิงชนะเลิศ',
        thirdPlace: 'รอบชิงที่ 3',
      },
      32: {
        match1: 'รอบ 32 ทีม',
        match2: 'รอบ 32 ทีม',
        match3: 'รอบ 32 ทีม',
        match4: 'รอบ 32 ทีม',
        match5: 'รอบ 32 ทีม',
        match6: 'รอบ 32 ทีม',
        match7: 'รอบ 32 ทีม',
        match8: 'รอบ 32 ทีม',
        match9: 'รอบ 32 ทีม',
        match10: 'รอบ 32 ทีม',
        match11: 'รอบ 32 ทีม',
        match12: 'รอบ 32 ทีม',
        match13: 'รอบ 32 ทีม',
        match14: 'รอบ 32 ทีม',
        match15: 'รอบ 32 ทีม',
        match16: 'รอบ 32 ทีม',
        round1: 'รอบ 16 ทีม',
        round2: 'รอบ 16 ทีม',
        quarterfinal1: 'รอบ 8 ทีม',
        semifinal1: 'รอบรองชนะเลิศ',
        final: 'รอบชิงชนะเลิศ',
        thirdPlace: 'รอบชิงที่ 3',
      },
    };
  
    return roundsByTeams[numberOfTeams]?.[matchId] || 'ไม่ทราบรอบการแข่งขัน';
  };  

  const renderTournamentBracket = () => {
    const numberOfTeams = parseInt(competition?.numberOfTeams, 10);

    switch (numberOfTeams) {
      case 8:
        return <TournamentBracket8 teams={teams} matches={matches} setMatches={setMatches} removeTeamFromList={removeTeamFromList} addTeamToList={addTeamToList} onRemoveTeam={handleRemoveTeam} handleDrop={handleDrop} handleDragStartFromBracket={handleDragStartFromBracket} handleScoreChange={handleScoreChange} />;
      case 16:
        return <TournamentBracket16 teams={teams} matches={matches} setMatches={setMatches} removeTeamFromList={removeTeamFromList} addTeamToList={addTeamToList} onRemoveTeam={handleRemoveTeam} handleDrop={handleDrop} handleDragStartFromBracket={handleDragStartFromBracket} handleScoreChange={handleScoreChange} />;
      case 32:
        return <TournamentBracket32 teams={teams} matches={matches} setMatches={setMatches} competitionId={competitionId} removeTeamFromList={removeTeamFromList} addTeamToList={addTeamToList} onRemoveTeam={handleRemoveTeam} handleDrop={handleDrop} handleDragStartFromBracket={handleDragStartFromBracket} handleScoreChange={handleScoreChange} />;
      default:
        return <p>No bracket available for this number of teams.</p>;
    }
  };

  const renderTables = () => {
    const numberOfTeams = parseInt(competition?.numberOfTeams, 10);

    if (numberOfTeams === 32) {
      return (
        <>
          <Table32teams teams={teams} />
          <Table16teams teams={teams} />
          <Table8teams teams={teams} />
          <Table4teams teams={teams} />
          <TableWin teams={teams} />
        </>
      );
    } else if (numberOfTeams === 16) {
      return (
        <>
          <Table16teams teams={teams} />
          <Table8teams teams={teams} />
          <Table4teams teams={teams} />
          <TableWin teams={teams} />
        </>
      );
    } else if (numberOfTeams === 8) {
      return (
        <>
          <Table8teams teams={teams} />
          <Table4teams teams={teams} />
          <TableWin teams={teams} />
        </>
      );
    } else {
      return <p>No table available for this number of teams.</p>;
    }
  };

  const handleDropOnTeamList = (e) => {
    e.preventDefault();
    const teamName = e.dataTransfer.getData('text/plain');
    addTeamToList(teamName);

    Object.keys(matches).forEach(matchId => {
      const match = matches[matchId];
      if (match.team1 === teamName) {
        handleRemoveTeam(matchId, 'team1');
      } else if (match.team2 === teamName) {
        handleRemoveTeam(matchId, 'team2');
      }
    });
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <>
      <Head>
        <title>รายละเอียดการแข่งขัน</title>
      </Head>
      <Navbar />
      <div className={styles.container}>
        <h2 className={styles.title}>จัดการข้อมูลการจับคู่</h2>
        <div className={styles.details}>
          {competition ? (
            <>
              <p><strong>หัวข้อการแข่งขัน:</strong> {competition.title}</p>
              <p><strong>เกม:</strong> {competition.gameName}</p>
              <p><strong>ประเภท:</strong> {competition.type}</p>
              <p><strong>จำนวนทีม:</strong> {competition.numberOfTeams} ทีม</p>
            </>
          ) : (
            <p>ไม่พบข้อมูลการแข่งขัน</p>
          )}
        </div>
        <div className={styles.flexContainer}>
          <div
            className={styles.teamList}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDropOnTeamList}
          >
            <h4>รายชื่อทีม ({teams.length}):</h4>
            <ul>
              {teams.length > 0 ? (
                teams.map((team, index) => (
                  <li
                    key={index}
                    draggable
                    onDragStart={(e) => e.dataTransfer.setData('text/plain', team.teamName)}
                  >
                    {index + 1}: {team.teamName}
                  </li>
                ))
              ) : (
                <p className={styles.noTeam}>ไม่มีทีม...</p>
              )}
            </ul>
          </div>
          {renderTournamentBracket()}
        </div>
        <div>
          {renderTables()}
        </div>
      </div>
    </>
  );
};

export default CompetitionDetails;
