import localFont from 'next/font/local';

export const samsungSharpSans = localFont({
  src: [
    {
      path: '../../public/fonts/SamsungSharpSans-Bold.ttf',
      weight: '700',
      style: 'normal',
    },
    {
      path: '../../public/fonts/SamsungSharpSans-Medium.ttf',
      weight: '500',
      style: 'normal',
    },
  ],
  variable: '--font-samsung-sharp-sans',
}); 