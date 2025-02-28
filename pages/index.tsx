import { useAuth } from '@/context/AuthContext';
import PhoneLogin from '@/components/PhoneLogin';
import Image from 'next/image';
import { samsungSharpSans } from '@/styles/fonts';
import { useRouter } from 'next/router';
import { useEffect } from 'react';

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();
  
  useEffect(() => {
    if (user && !loading) {
      console.log("User is logged in, redirecting to quiz page");
      router.push('/quiz');
    }
  }, [user, loading, router]);
  
  return (
    <div className={`login-page ${samsungSharpSans.variable}`}>
      <div className="background-image">
        <Image 
          src="/images/Background.png" 
          alt="Background" 
          fill
          style={{ objectFit: 'cover' }}
          priority
        />
      </div>
      
      <div className="content">
        <PhoneLogin />
      </div>
      
      <style jsx>{`
        .login-page {
          min-height: 100vh;
          display: flex;
          justify-content: center;
          align-items: center;
          position: relative;
        }
        
        .background-image {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          z-index: -1;
        }
        
        .content {
          width: 100%;
          max-width: 500px;
          padding: 2rem;
          z-index: 1;
          position: relative;
        }
      `}</style>
    </div>
  );
}