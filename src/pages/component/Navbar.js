import Link from "next/link"
import Image from "next/image"
import React from 'react';

export default function Navbar(){
    return(
        <>
        <nav>
            <div className="logo">
                <Link href="/">
                   <Image src="/logo.png" width={60} height={69} alt="logo"/>
                </Link>
            </div>
            <div className="link">
            <Link  href="/" >หน้าเเรก</Link>
            <Link  href="/login" >การเเข่งขัน</Link>
            <Link className="login" href="/login">ลงทะเบียน / เข้าสู่ระบบ</Link>
            </div>
        </nav>
        </>
    )
}
