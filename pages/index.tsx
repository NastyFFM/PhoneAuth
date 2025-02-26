import PhoneLogin from '../src/components/PhoneLogin';
import { AuthProvider } from '../src/context/AuthContext';

export default function Home() {
  return (
    <AuthProvider>
      <PhoneLogin />
    </AuthProvider>
  );
}