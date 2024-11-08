import React, { useState } from 'react';
import Head from "next/head"
import Navbar from './component/Navbar';

const Register = () => {
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: ''
    });
    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };
    const handleSubmit = (e) => {
        e.preventDefault();
        console.log('Form submitted:', formData);
    };

    return (
        <>
        <Head>
        <title className='text-center'>ลงทะเบียน</title>
        </Head>
        <Navbar/>
        <div className='box'>
            <h2>ลงทะเบียน  </h2>
            <form onSubmit={handleSubmit} className='flex justify-items-center items-center text-center'>
                <div>
                    <label htmlFor="username">Username:</label>
                    <input type="text" id="username" name="username" value={formData.username} onChange={handleChange} required />
                </div>
                <div>
                    <label htmlFor="email">Email:</label>
                    <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} required />
                </div>
                <div>
                    <label htmlFor="password">Password:</label>
                    <input type="password" id="password" name="password" value={formData.password} onChange={handleChange} required />
                </div>
                <div>
                    <button type="submit" href="/register">ลงทะเบียน</button>
                </div>
                
            </form>
        </div>
        </>
    );
};

export default Register;
