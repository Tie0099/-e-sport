import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { Modal, message } from 'antd'; // เพิ่ม Modal ตรงนี้
import { db, auth, storage } from '../firebase';
import { collection, getDocs, doc, updateDoc, where, query, addDoc, deleteDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { signOut } from 'firebase/auth';
import Favbar from '../component/Favbar';
import styles from '@/styles/MyTeam.module.css';
import '@fortawesome/fontawesome-free/css/all.min.css';

const fetchTeamsData = async (uid, setTeams) => {
  try {
    const q = query(collection(db, 'teams'), where('uid', '==', uid));
    const querySnapshot = await getDocs(q);
    const teamsData = [];
    querySnapshot.forEach((doc) => {
      teamsData.push({ id: doc.id, ...doc.data() });
    });
    setTeams(teamsData);
  } catch (error) {
    console.error("Error fetching teams data: ", error);
  }
};

export default function MyTeam() {
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false); // เพิ่ม state สำหรับ Modal ลบทีม
  const [teamToDelete, setTeamToDelete] = useState(null); // state สำหรับเก็บทีมที่ต้องการลบ
  const [teams, setTeams] = useState([]);
  const [showAddTeamForm, setShowAddTeamForm] = useState(false);
  const [showEditTeamForm, setShowEditTeamForm] = useState(false);
  const [showAddMemberForm, setShowAddMemberForm] = useState(false);
  const [teamImage, setTeamImage] = useState(null);
  const [members, setMembers] = useState([]);
  const [editingTeam, setEditingTeam] = useState(null);
  const [newTeamName, setNewTeamName] = useState('');
  const [expandedTeamId, setExpandedTeamId] = useState(null);
  const router = useRouter();
  const [messageApi, contextHolder] = message.useMessage();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        await fetchTeamsData(user.uid, setTeams);
      } else {
        router.push('/');
      }
    });

    return () => unsubscribe();
  }, [router]);

  const handleLogout = async () => {
    setShowLogoutModal(true); // เปิด Modal เมื่อคลิกที่ปุ่มออกจากระบบ
  };

  const confirmLogout = async () => {
    await signOut(auth);
    router.push('/');
  };

  const handleAddTeamClick = () => {
    setEditingTeam(null);
    setShowAddTeamForm(true);
    setShowEditTeamForm(false);
    setShowAddMemberForm(false);
  };

  const handleEditClick = (team) => {
    setEditingTeam(team);
    setMembers(team.members || []);
    setNewTeamName(team.team_name);
    setShowAddTeamForm(false);
    setShowEditTeamForm(true);
    setShowAddMemberForm(false);
  };

  const handleAddMemberClick = (team) => {
    setEditingTeam(team);
    setMembers(team.members || []);
    setShowAddTeamForm(false);
    setShowEditTeamForm(false);
    setShowAddMemberForm(true);
  };

  const handleDeleteClick = (team) => {
    setTeamToDelete(team); // กำหนดทีมที่ต้องการลบ
    setShowDeleteModal(true); // เปิด Modal ลบทีม
  };

  const confirmDeleteTeam = async () => {
    if (teamToDelete) {
      try {
        await deleteDoc(doc(db, 'teams', teamToDelete.id));
        setTeams((prevTeams) => prevTeams.filter((team) => team.id !== teamToDelete.id));
        messageApi.success(`ลบทีม ${teamToDelete.team_name} สำเร็จ`);
        setShowDeleteModal(false); // ปิด Modal หลังจากลบเสร็จ
      } catch (error) {
        console.error("Error deleting team: ", error);
      }
    }
  };

  const handleAddTeamSubmit = async (e) => {
    e.preventDefault();
    if (newTeamName.trim() === '') {
      messageApi.error('ชื่อทีมต้องไม่ว่างเปล่า');
      return;
    }

    try {
      let imageUrl = '';
      if (teamImage) {
        const imageRef = ref(storage, `teamImages/${teamImage.name}`);
        await uploadBytes(imageRef, teamImage);
        imageUrl = await getDownloadURL(imageRef);
      }

      const newTeam = {
        uid: auth.currentUser.uid,
        team_name: newTeamName,
        imageUrl: imageUrl,
        members: []
      };

      const docRef = await addDoc(collection(db, 'teams'), newTeam);
      setTeams([...teams, { id: docRef.id, ...newTeam }]);
      messageApi.success('เพิ่มทีมสำเร็จ');

      setShowAddTeamForm(false);
      setTeamImage(null);
      setMembers([]);
    } catch (error) {
      console.error("Error adding team: ", error);
    }
  };

  const handleEditTeamSubmit = async (e) => {
    e.preventDefault();
    if (newTeamName.trim() === '') {
      messageApi.error('ชื่อทีมต้องไม่ว่างเปล่า');
      return;
    }

    for (let member of members) {
      if (member.name.trim() === '' || member.gameName.trim() === '') {
        messageApi.error('ข้อมูลสมาชิกต้องไม่ว่างเปล่า');
        return;
      }
    }

    try {
      const teamDoc = doc(db, 'teams', editingTeam.id);
      await updateDoc(teamDoc, {
        team_name: newTeamName,
        members: members
      });
      setTeams((prevTeams) =>
        prevTeams.map((team) =>
          team.id === editingTeam.id
            ? { ...team, team_name: newTeamName, members: members }
            : team
        )
      );

      messageApi.success('แก้ไขข้อมูลทีมสำเร็จ');
      setShowEditTeamForm(false);
      setTeamImage(null);
      setMembers([]);
    } catch (error) {
      console.error("Error editing team: ", error);
    }
  };

  const handleAddMemberSubmit = async (e) => {
    e.preventDefault();

    for (let member of members) {
      if (member.name.trim() === '' || member.gameName.trim() === '') {
        messageApi.error('ข้อมูลสมาชิกต้องไม่ว่างเปล่า');
        return;
      }
    }

    try {
      const teamDoc = doc(db, 'teams', editingTeam.id);
      await updateDoc(teamDoc, { members });

      setTeams((prevTeams) =>
        prevTeams.map((team) =>
          team.id === editingTeam.id
            ? { ...team, members }
            : team
        )
      );

      messageApi.success('เพิ่มสมาชิกทีมสำเร็จ');
      setShowAddMemberForm(false);
      setMembers([]);
    } catch (error) {
      console.error("Error adding member:", error);
      messageApi.error('เกิดข้อผิดพลาดในการเพิ่มสมาชิกทีม');
    }
  };

  const handleImageChange = (e) => {
    if (e.target.files[0]) {
      setTeamImage(e.target.files[0]);
    }
  };

  const handleAddMember = () => {
    setMembers([...members, { name: '', gameName: '' }]);
  };

  const handleMemberChange = (index, field, value) => {
    const updatedMembers = members.map((member, i) =>
      i === index ? { ...member, [field]: value } : member
    );
    setMembers(updatedMembers);
  };

  const handleRemoveMember = (index) => {
    const updatedMembers = members.filter((_, i) => i !== index);
    setMembers(updatedMembers);
  };

  const handleRowClick = (teamId) => {
    setExpandedTeamId((prevTeamId) => (prevTeamId === teamId ? null : teamId));
  };

  return (
    <>
      <Head>
        <title>ทีมของคุณ</title>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css" />
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
        <div className={styles.mainContent}>
          <div className={styles.teamBox}>
            <table className={styles.teamTable}>
              <thead>
                <tr>
                  <th>รูปทีม</th>
                  <th>ชื่อทีม</th>
                  <th>จำนวนสมาชิก</th>
                  <th><button onClick={handleAddTeamClick} className={styles.addButton}><i className="fas fa-plus"></i></button></th>
                </tr>
              </thead>
              <tbody>
                {teams.map((team) => (
                  <React.Fragment key={team.id}>
                    <tr onClick={() => handleRowClick(team.id)} className={styles.teamRow}>
                      <td>
                        <img src={team.imageUrl || "/path-to-avatar.png"} alt="รูปทีม" className={styles.teamAvatar} />
                      </td>
                      <td>{team.team_name}</td>
                      <td>{team.members?.length || 0}</td>
                      <td className={styles.iconColumn}>
                        <i className={`fas fa-user-plus ${styles.icon} ${styles.userPlus}`} onClick={(e) => { e.stopPropagation(); handleAddMemberClick(team); }}></i>
                        <i className={`fas fa-edit ${styles.icon} ${styles.edit}`} onClick={(e) => { e.stopPropagation(); handleEditClick(team); }}></i>
                        <i className={`fas fa-trash-alt ${styles.icon} ${styles.trash}`} onClick={(e) => { e.stopPropagation(); handleDeleteClick(team); }}></i>
                      </td>
                    </tr>
                    {expandedTeamId === team.id && (
                      <tr className={styles.membersRow}>
                        <td colSpan="4">
                          <ul className={styles.memberList}>
                            {team.members.map((member, index) => (
                              <li key={index}>{member.name} &nbsp; &nbsp; &nbsp; {member.gameName}</li>
                            ))}
                          </ul>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
          {showAddTeamForm && (
            <div className={styles.formOverlay}>
              <div className={styles.formContainer}>
                <h2>เพิ่มทีมของคุณ</h2>
                <form onSubmit={handleAddTeamSubmit} className={styles.addTeamForm}>
                  <div className={styles.formGroup}>
                    <label htmlFor="teamImage" className={styles.imageLabel}>
                      <div className={styles.imageUploadContainer}>
                        {teamImage ? (
                          <img src={URL.createObjectURL(teamImage)} alt="Team" className={styles.uploadedImage} />
                        ) : (
                          <div className={styles.imagePlaceholder}>
                            <i className="fas fa-cloud-upload-alt"></i>
                            <span>อัปโหลดรูปทีม</span>
                          </div>
                        )}
                      </div>
                    </label>
                    <input type="file" id="teamImage" onChange={handleImageChange} className={styles.imageInput} />
                  </div>
                  <div className={styles.formGroup}>
                    <label>ชื่อทีม</label>
                    <input type="text" value={newTeamName} onChange={(e) => setNewTeamName(e.target.value)} required placeholder="ชื่อทีม" />
                  </div>
                  <div className={styles.formButtons}>
                    <button type="submit" className={styles.submitButton}>ยืนยัน</button>
                    <button type="button" className={styles.cancelButton} onClick={() => setShowAddTeamForm(false)}>ยกเลิก</button>
                  </div>
                </form>
              </div>
            </div>
          )}
          {showEditTeamForm && (
            <div className={styles.formOverlay}>
              <div className={styles.formContainer}>
                <h2>แก้ไขข้อมูลทีม</h2>
                <form onSubmit={handleEditTeamSubmit} className={styles.addTeamForm}>
                  <div className={styles.formGroup}>
                    <label>ชื่อทีม</label>
                    <input type="text" value={newTeamName} onChange={(e) => setNewTeamName(e.target.value)} required placeholder="ชื่อทีม" />
                  </div>
                  <div className={styles.formGroup}>
                    <label>สมาชิกทีม</label>
                    {members.map((member, index) => (
                      <div key={index} className={styles.memberRow}>
                        <div>
                          <label>ชื่อ-นามสกุล</label>
                          <input
                            type="text"
                            placeholder="ชื่อ-นามสกุล"
                            value={member.name}
                            onChange={(e) => handleMemberChange(index, 'name', e.target.value)}
                            required
                          />
                        </div>
                        <div>
                          <label>ชื่อในเกม</label>
                          <input
                            type="text"
                            placeholder="ชื่อในเกม"
                            value={member.gameName}
                            onChange={(e) => handleMemberChange(index, 'gameName', e.target.value)}
                            required
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className={styles.formButtons}>
                    <button type="submit" className={styles.submitButton}>ยืนยัน</button>
                    <button type="button" className={styles.cancelButton} onClick={() => setShowEditTeamForm(false)}>ยกเลิก</button>
                  </div>
                </form>
              </div>
            </div>
          )}
          {showAddMemberForm && (
            <div className={styles.formOverlay}>
              <div className={styles.formContainer}>
                <h2>เพิ่มสมาชิกทีม</h2>
                <form onSubmit={handleAddMemberSubmit} className={styles.addTeamForm}>
                  <div className={styles.formGroup}>
                    <label htmlFor="teamImageDisplay" className={styles.imageLabel}>
                      <div className={styles.imageUploadContainer}>
                        <img src={editingTeam?.imageUrl || "/path-to-avatar.png"} alt="Team" className={styles.uploadedImage} />
                      </div>
                    </label>
                  </div>
                  <div className={styles.formGroup}>
                    <label>สมาชิกทีม</label>
                    <button type="button" onClick={handleAddMember} className={styles.addmember}>+ เพิ่มสมาชิก</button>
                    {members.map((member, index) => (
                      <div key={index} className={styles.memberRow}>
                        <div>
                          <label>ชื่อ-นามสกุล</label>
                          <input
                            type="text"
                            placeholder="ชื่อ-นามสกุล"
                            value={member.name}
                            onChange={(e) => handleMemberChange(index, 'name', e.target.value)}
                            required
                          />
                        </div>
                        <div>
                          <label>ชื่อในเกม</label>
                          <input
                            type="text"
                            placeholder="ชื่อในเกม"
                            value={member.gameName}
                            onChange={(e) => handleMemberChange(index, 'gameName', e.target.value)}
                            required
                          />
                        </div>
                        <button type="button" onClick={() => handleRemoveMember(index)}>ลบ</button>
                      </div>
                    ))}
                  </div>
                  <div className={styles.formButtons}>
                    <button type="submit" className={styles.submitButton}>ยืนยัน</button>
                    <button type="button" className={styles.cancelButton} onClick={() => setShowAddMemberForm(false)}>ยกเลิก</button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
        {/* Modal สำหรับยืนยันการออกจากระบบ */}
        <Modal
          title="ยืนยันการออกจากระบบ"
          visible={showLogoutModal} // ใช้ state ควบคุมการเปิดปิด Modal
          onOk={confirmLogout}
          onCancel={() => setShowLogoutModal(false)} // ปิด Modal
          okText="ออกจากระบบ"
          cancelText="ยกเลิก"
        >
          <p>คุณแน่ใจหรือว่าต้องการออกจากระบบ?</p>
        </Modal>
        {/* Modal สำหรับยืนยันการลบทีม */}
        <Modal
          title={`ยืนยันการลบทีม ${teamToDelete?.team_name}`}
          visible={showDeleteModal}
          onOk={confirmDeleteTeam}
          onCancel={() => setShowDeleteModal(false)}
          okText="ลบ"
          cancelText="ยกเลิก"
        >
          <p>คุณแน่ใจหรือว่าต้องการลบทีมนี้?</p>
        </Modal>
      </div>
    </>
  );
}
