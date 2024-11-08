import React from 'react';
import styles from '@/styles/TournamentBracket16.module.css';

const TournamentBracket16 = ({ matches = {}, handleDrop, handleDragStartFromBracket, handleScoreChange }) => {
  
  // ฟังก์ชันเพื่อกรองค่าให้เป็นตัวเลขระหว่าง 0-2 เท่านั้น
  const handleInputFilter = (e, matchId, scoreKey, otherScore) => {
    const { value } = e.target;
    if (/^[0-2]$/.test(value) || value === '') {
      handleScoreChange(matchId, scoreKey === 'score1' ? value : otherScore, scoreKey === 'score2' ? value : otherScore);
    }
  };

  return (
    <div className={styles.tournament}>
      {/* รอบ 16 ทีม */}
      <div className={styles.round}>
        {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
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

      {/* รอบ 8 ทีม */}
      <div className={styles.connectors}>
        {[1, 2, 3, 4].map((num) => (
          <div key={num} className={styles[`Pair2_${num}`]}>
            <div>
              <input
                type="text"
                placeholder="ชื่อทีม"
                value={matches[`quarterfinal${num}`]?.team1 || ''}
                readOnly
                className={styles.match}
                draggable
                onDragStart={(e) => handleDragStartFromBracket(e, `quarterfinal${num}`, 'team1')}
              />
              <input
                type="text"
                placeholder="ผล"
                value={matches[`quarterfinal${num}`]?.score1 || ''}
                onChange={(e) => handleInputFilter(e, `quarterfinal${num}`, 'score1', matches[`quarterfinal${num}`]?.score2)}
                className={styles.score}
              />
            </div>
            <div>
              <input
                type="text"
                placeholder="ชื่อทีม"
                value={matches[`quarterfinal${num}`]?.team2 || ''}
                readOnly
                className={styles.match}
                draggable
                onDragStart={(e) => handleDragStartFromBracket(e, `quarterfinal${num}`, 'team2')}
              />
              <input
                type="text"
                placeholder="ผล"
                value={matches[`quarterfinal${num}`]?.score2 || ''}
                onChange={(e) => handleInputFilter(e, `quarterfinal${num}`, 'score2', matches[`quarterfinal${num}`]?.score1)}
                className={styles.score}
              />
            </div>
          </div>
        ))}
      </div>

      {/* รอบ 4 ทีม (รอบรองชนะเลิศ) */}
      <div className={styles.Semifinals}>
        {[1, 2].map((num) => (
          <div key={num} className={styles[`Pair3_${num}`]}>
            <div>
              <input
                type="text"
                placeholder="ชื่อทีม"
                value={matches[`semifinal${num}`]?.team1 || ''}
                readOnly
                className={styles.match}
                draggable
                onDragStart={(e) => handleDragStartFromBracket(e, `semifinal${num}`, 'team1')}
              />
              <input
                type="text"
                placeholder="ผล"
                value={matches[`semifinal${num}`]?.score1 || ''}
                onChange={(e) => handleInputFilter(e, `semifinal${num}`, 'score1', matches[`semifinal${num}`]?.score2)}
                className={styles.score}
              />
            </div>
            <div className={styles.OOO}>
              <input
                type="text"
                placeholder="ชื่อทีม"
                value={matches[`semifinal${num}`]?.team2 || ''}
                readOnly
                className={styles.match}
                draggable
                onDragStart={(e) => handleDragStartFromBracket(e, `semifinal${num}`, 'team2')}
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

      {/* รอบชิงชนะเลิศและชิงที่ 3 */}
      <div className={styles.finalRounds}>
        <div className={styles.Pair4_1}>
          <div>
            <input
              type="text"
              placeholder="ชิงชนะเลิศ"
              value={matches.final?.team1 || ''}
              readOnly
              className={styles.match}
              draggable
              onDragStart={(e) => handleDragStartFromBracket(e, 'final', 'team1')}
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
              draggable
              onDragStart={(e) => handleDragStartFromBracket(e, 'final', 'team2')}
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
        <div className={styles.Pair4_2}>
          <div>
            <input
              type="text"
              placeholder="ชิงที่ 3"
              value={matches.thirdPlace?.team1 || ''}
              readOnly
              className={styles.match}
              draggable
              onDragStart={(e) => handleDragStartFromBracket(e, 'thirdPlace', 'team1')}
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
              draggable
              onDragStart={(e) => handleDragStartFromBracket(e, 'thirdPlace', 'team2')}
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

export default TournamentBracket16;
