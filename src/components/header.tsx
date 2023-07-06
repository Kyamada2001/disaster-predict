import { memo } from 'react'
import Image from 'next/image'
import Link from 'next/link'

export const Header = memo(function Header() {
    return (
        <header className='w-screen border-b-2 border-sky-300'>
            <div className='flex flex-row px-4 py-1 items-center'>
                <Link href="/">
                    <Image src="/favicon.ico" width={60} height={60} alt=""></Image>
                </Link>
                <p className='font-serif font-bold text-xl'>津波危険度チェッカー</p>
            </div>
        </header>
    );
})