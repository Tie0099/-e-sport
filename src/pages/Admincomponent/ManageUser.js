import React, { Component } from 'react';
import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';
import styles from '@/styles/ManageUser.module.css';
import Navbar from './Navbaradmin';
import Head from 'next/head';
import { FiEye } from 'react-icons/fi';
import Modal from 'react-modal';

Modal.setAppElement('#__next'); // ตั้งค่า AppElement

class ManageUser extends Component {
  // กำหนด state เริ่มต้น
  state = {
    users: [], // เก็บข้อมูลผู้ใช้ที่ดึงมาจากฐานข้อมูล
    teams: [], // เก็บข้อมูลทีมที่ดึงมาจากฐานข้อมูล
    searchQuery: '', // เก็บคำค้นหาจากผู้ใช้
    currentPage: 1, // เก็บหมายเลขหน้าปัจจุบัน
    usersPerPage: 10, // กำหนดจำนวนผู้ใช้ที่แสดงต่อหน้า
    modalIsOpen: false, // สถานะการเปิด/ปิด modal
    selectedUser: null, // เก็บข้อมูลผู้ใช้ที่ถูกเลือกเพื่อแสดงใน modal
    selectedTeam: null // เก็บข้อมูลทีมที่ถูกเลือกเพื่อแสดงตาราง
  };

  // เมื่อ component ถูก mount จะเรียกใช้ฟังก์ชั่น fetchUsers และ fetchTeams
  componentDidMount() {
    this.fetchUsers();
    this.fetchTeams();
  }

  // ฟังก์ชั่นดึงข้อมูลทีมจาก Firebase
  fetchTeams = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'teams')); // ดึงข้อมูลจาก collection 'teams'
      const teams = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })); // map ข้อมูลที่ดึงมาเพื่อรวม id และ data
      this.setState({ teams }); // อัพเดท state ด้วยข้อมูลทีมที่ดึงมา
    } catch (error) {
      console.error('Error fetching teams:', error); // แสดงข้อผิดพลาดถ้ามี
    }
  };

  // ฟังก์ชั่นดึงข้อมูลผู้ใช้จาก Firebase
  fetchUsers = async () => {
    try {
      // ดึงข้อมูลทีม
      const teamSnapshot = await getDocs(collection(db, 'teams'));
      const teams = teamSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // ดึงข้อมูลผู้ใช้
      const userSnapshot = await getDocs(collection(db, 'users'));
      const users = userSnapshot.docs.map(doc => {
        const userId = doc.id;

        // หาทีมที่มี uid ตรงกับ id ของผู้ใช้
        const userTeams = teams.filter(team => team.uid === doc.data().uid); // เช็ค uid ใน team และ user ให้ตรงกัน

        return {
          id: userId,
          ...doc.data(),
          teamCount: userTeams.length  // นับจำนวนทีมที่ผู้ใช้เป็นเจ้าของหรือเกี่ยวข้อง
        };
      });

      this.setState({ users, teams }); // อัพเดท state ของ users และ teams
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  // ฟังก์ชั่นจัดการการเปลี่ยนแปลงของ input ค้นหา
  handleSearchChange = (event) => {
    this.setState({ searchQuery: event.target.value, currentPage: 1 }); // อัพเดท searchQuery และ reset currentPage เป็นหน้า 1
  };

  // ฟังก์ชั่นจัดการการเปลี่ยนหน้าของตาราง
  handlePageChange = (pageNumber) => {
    this.setState({ currentPage: pageNumber }); // อัพเดท currentPage ด้วยหมายเลขหน้าที่ถูกเลือก
  };

  // ฟังก์ชั่นจัดการการคลิกปุ่มดูรายละเอียด
  handleViewDetails = (userId) => {
    const selectedUser = this.state.users.find(user => user.id === userId); // หาผู้ใช้ที่ถูกเลือกโดย userId
    this.setState({ modalIsOpen: true, selectedUser }); // เปิด modal และเก็บข้อมูลผู้ใช้ที่ถูกเลือกใน selectedUser
  };

  // ฟังก์ชั่นปิด modal
  closeModal = () => {
    this.setState({ modalIsOpen: false, selectedUser: null, selectedTeam: null }); // ปิด modal และ reset selectedUser และ selectedTeam
  };

  // ฟังก์ชั่นจัดการการเลือกทีมจาก dropdown
  handleTeamSelect = (event) => {
    const selectedTeam = this.state.teams.find(team => team.id === event.target.value);
    this.setState({ selectedTeam });
  };

  // ฟังก์ชั่นเน้นข้อความที่ตรงกับคำค้นหา
  highlightText = (text, highlight) => {
    if (!highlight) return text; // ถ้าไม่มีคำค้นหาก็คืนค่า text เดิม
    const parts = text.split(new RegExp(`(${highlight})`, 'gi')); // แยก text ตามคำค้นหา
    return parts.map((part, index) =>
      part.toLowerCase() === highlight.toLowerCase() ? <span key={index} className={styles.highlight}>{part}</span> : part // เน้นข้อความที่ตรงกับคำค้นหา
    );
  };

  render() {
    const { users, searchQuery, currentPage, usersPerPage, modalIsOpen, selectedUser, selectedTeam } = this.state;

    // กรองข้อมูลผู้ใช้ตามคำค้นหา
    const filteredUsers = users.filter(user =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.affiliation.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // คำนวณข้อมูลที่จะแสดงในแต่ละหน้า
    const indexOfLastUser = currentPage * usersPerPage;
    const indexOfFirstUser = indexOfLastUser - usersPerPage;
    const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);

    // คำนวณจำนวนหน้าทั้งหมด
    const pageNumbers = [];
    for (let i = 1; i <= Math.ceil(filteredUsers.length / usersPerPage); i++) {
      pageNumbers.push(i);
    }

    return (
      <>
        <Head>
          <title>ข้อมูลผู้จัดการทีม</title>
        </Head>
        <Navbar />
        <div className={styles.container}>
          <h2 className={styles.h2}>ข้อมูลผู้จัดการทีม</h2>
          <input
            type="text"
            placeholder="ค้นหารายชื่อ..."
            value={searchQuery}
            onChange={this.handleSearchChange}
            className={styles.searchInput}
          />
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.th}>No.</th>
                <th className={styles.th}>รายชื่อ</th>
                <th className={styles.th}>สังกัด</th>
                <th className={styles.th}>อีเมล</th>
                <th className={styles.th}>จำนวนทีม</th>
                <th className={styles.th}>ดูรายละเอียด</th>
              </tr>
            </thead>
            <tbody>
              {currentUsers.map((user, index) => (
                <tr key={user.id} className={styles.tr}>
                  <td className={styles.td}>{indexOfFirstUser + index + 1}</td>
                  <td className={styles.td}>{this.highlightText(user.name, searchQuery)}</td>
                  <td className={styles.td}>{this.highlightText(user.affiliation, searchQuery)}</td>
                  <td className={styles.td}>{this.highlightText(user.email, searchQuery)}</td>
                  <td className={styles.td}>{user.teamCount}</td>
                  <td className={styles.td}>
                    <button
                      onClick={() => this.handleViewDetails(user.id)}
                      className={styles.viewButton}
                    >
                      <FiEye />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className={styles.pagination}>
            {pageNumbers.map(number => (
              <button
                key={number}
                onClick={() => this.handlePageChange(number)}
                className={styles.pageButton}
              >
                {number}
              </button>
            ))}
          </div>
        </div>

        {selectedUser && (
          <Modal
            isOpen={modalIsOpen}
            onRequestClose={this.closeModal}
            className={styles.modal}
            overlayClassName={styles.overlay}
            contentLabel="User Details"
          >
            <h2>ข้อมูลผู้จัดการทีม</h2>
            <p>ชื่อ: {selectedUser.name}</p>
            <label>ทีม: </label>
            <select onChange={this.handleTeamSelect} className={styles.selectDropdown}>
              <option value="">เลือกทีม</option>
              {this.state.teams.filter(team => team.uid === selectedUser.uid).map(team => (
                <option key={team.id} value={team.id}>{team.team_name}</option>
              ))}
            </select>

            {selectedTeam && (
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th className={styles.th}>ชื่อผู้เล่น</th>
                    <th className={styles.th}>ชื่อในเกม</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedTeam.members.map((member, index) => (
                    <tr key={index} className={styles.tr}>
                      <td className={styles.td}>{member.name}</td>
                      <td className={styles.td}>{member.gameName}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            <button onClick={this.closeModal} className={styles.closeButton}>ปิด</button>
          </Modal>
        )}
      </>
    );
  }
}

export default ManageUser;
