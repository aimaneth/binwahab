import localFont from 'next/font/local';

export const fontSans = localFont({
  src: [
    {
      path: '../../public/fonts/Inter-Regular.woff2',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../../public/fonts/Inter-Medium.woff2',
      weight: '500',
      style: 'normal',
    },
    {
      path: '../../public/fonts/Inter-SemiBold.woff2',
      weight: '600',
      style: 'normal',
    },
    {
      path: '../../public/fonts/Inter-Bold.woff2',
      weight: '700',
      style: 'normal',
    },
  ],
  variable: '--font-sans',
  display: 'swap',
  preload: true,
  fallback: ['system-ui', 'arial']
});

// Times New Roman is a web-safe font, so we can use it directly
export const fontTimesNewRoman = {
  variable: '--font-times-new-roman',
  className: 'font-times-new-roman',
};