import { memo } from 'react'
import Image from 'next/image'

export const Header = memo(function Header() {
    return (
        <header className='w-screen border-b-2 border-sky-300'>
            <div className='flex flex-row px-4 py-1 items-center'>
                <Image src="/favicon.ico" width={60} height={60} alt=""></Image>
                <p className='font-serif font-bold text-xl'>津波想定被害チェッカー</p>
            </div>
        </header>
    );
})