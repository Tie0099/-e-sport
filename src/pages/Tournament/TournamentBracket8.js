import React from 'react';
import styles from '@/styles/TournamentBracket8.module.css';

const TournamentBracket8 = ({ matches = {}, handleDrop, handleDragStartFromBracket, handleScoreChange }) => {
  
  // ฟังก์ชันเพื่อกรองค่าให้เป็นตัวเลขระหว่าง 0-2 เท่านั้น
  const handleInputFilter = (e, matchId, scoreKey, otherScore) => {
    const { value } = e.target;
    // ตรวจสอบว่าเป็นตัวเลขและอยู่ระหว่าง 0-2 เท่านั้น
    if (/^[0-2]$/.test(value) || value === '') {
      handleScoreChange(matchId, scoreKey === 'score1' ? value : otherScore, scoreKey === 'score2' ? value : otherScore);
    }
  };

  return (
    <div className={styles.tournament}>
      <div className={styles.round}>
        {[1, 2, 3, 4].map((num) => (
          <div key={num} className={styles[`Pair1_${num}`]}>
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => handleDrop(e, `match${num}`, 'team1')}
            >
              <input
                type="text"
                placeholder="ชื่อทีม"
                value={matches[`match${num}`]?.team1 || ''}
                readOnly
                className={styles.match}
                draggable
                onDragStart={(e) => handleDragStartFromBracket(e, `match${num}`, 'team1')}
              />
              <input
                type="text"
                placeholder="ผล"
                value={matches[`match${num}`]?.score1 || ''}
                onChange={(e) => handleInputFilter(e, `match${num}`, 'score1', matches[`match${num}`]?.score2)}
                className={styles.score}
              />
            </div>
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => handleDrop(e, `match${num}`, 'team2')}
            >
              <input
                type="text"
                placeholder="ชื่อทีม"
                value={matches[`match${num}`]?.team2 || ''}
                readOnly
                className={styles.match}
                draggable
                onDragStart={(e) => handleDragStartFromBracket(e, `match${num}`, 'team2')}
              />
              <input
                type="text"
                placeholder="ผล"
                value={matches[`match${num}`]?.score2 || ''}
                onChange={(e) => handleInputFilter(e, `match${num}`, 'score2', matches[`match${num}`]?.score1)}
                className={styles.score}
              />
            </div>
          </div>
        ))}
      </div>
      <div className={styles.connectors}>
        {[1, 2].map((num) => (
          <div key={num} className={styles[`Pair2_${num}`]}>
            <div>
              <input
                type="text"
                placeholder="ชื่อทีม"
                value={matches[`semifinal${num}`]?.team1 || ''}
                readOnly
                className={styles.match}
              />
              <input
                type="text"
                placeholder="ผล"
                value={matches[`semifinal${num}`]?.score1 || ''}
                onChange={(e) => handleInputFilter(e, `semifinal${num}`, 'score1', matches[`semifinal${num}`]?.score2)}
                className={styles.score}
              />
            </div>
            <div>
              <input
                type="text"
                placeholder="ชื่อทีม"
                value={matches[`semifinal${num}`]?.team2 || ''}
                readOnly
                className={styles.match}
              />
              <input
                type="text"
                placeholder="ผล"
                value={matches[`semifinal${num}`]?.score2 || ''}
                onChange={(e) => handleInputFilter(e, `semifinal${num}`, 'score2', matches[`semifinal${num}`]?.score1)}
                className={styles.score}
              />
            </div>
          </div>
        ))}
      </div>
      <div className={styles.finalRounds}>
        <div className={styles.Pair3_1}>
          <div>
            <input
              type="text"
              placeholder="ชิงชนะเลิศ"
              value={matches.final?.team1 || ''}
              readOnly
              className={styles.match}
            />
            <input
              type="text"
              placeholder="ผล"
              value={matches.final?.score1 || ''}
              onChange={(e) => handleInputFilter(e, 'final', 'score1', matches.final?.score2)}
              className={styles.score}
            />
          </div>
          <div>
            <input
              type="text"
              placeholder="ชิงชนะเลิศ"
              value={matches.final?.team2 || ''}
              readOnly
              className={styles.match}
            />
            <input
              type="text"
              placeholder="ผล"
              value={matches.final?.score2 || ''}
              onChange={(e) => handleInputFilter(e, 'final', 'score2', matches.final?.score1)}
              className={styles.score}
            />
          </div>
        </div>
        <div className={styles.Pair3_2}>
          <div>
            <input
              type="text"
              placeholder="ชิงที่ 3"
              value={matches.thirdPlace?.team1 || ''}
              readOnly
              className={styles.match}
            />
            <input
              type="text"
              placeholder="ผล"
              value={matches.thirdPlace?.score1 || ''}
              onChange={(e) => handleInputFilter(e, 'thirdPlace', 'score1', matches.thirdPlace?.score2)}
              className={styles.score}
            />
          </div>
          <div>
            <input
              type="text"
              placeholder="ชิงที่ 3"
              value={matches.thirdPlace?.team2 || ''}
              readOnly
              className={styles.match}
            />
            <input
              type="text"
              placeholder="ผล"
              value={matches.thirdPlace?.score2 || ''}
              onChange={(e) => handleInputFilter(e, 'thirdPlace', 'score2', matches.thirdPlace?.score1)}
              className={styles.score}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default TournamentBracket8;
