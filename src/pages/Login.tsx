import React, { useState, useEffect } from 'react';
import { 
  RecaptchaVerifier, 
  signInWithPhoneNumber,
  ConfirmationResult
} from 'firebase/auth';
import { auth } from '../firebase';
import { useNavigate } from 'react-router-dom';
import { Phone } from 'lucide-react';

declare global {
  interface Window {
    recaptchaVerifier: any;
  }
}

export const Login = () => {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  
  const navigate = useNavigate();

  useEffect(() => {
    // Inisialisasi RecaptchaVerifier
    if (auth && !window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible'
      });
    }
  }, []);

  const formatPhoneNumber = (phoneNumber: string) => {
    // 1. Hapus spasi dan tanda strip
    let formatted = phoneNumber.replace(/[\s-]/g, '');
    
    // 2. Ubah awalan 0 menjadi +62
    if (formatted.startsWith('0')) {
      formatted = '+62' + formatted.substring(1);
    } else if (formatted.startsWith('62')) {
      formatted = '+' + formatted;
    } else if (!formatted.startsWith('+')) {
      // Jika tidak ada awalan yang sesuai, tambahkan +
      formatted = '+' + formatted;
    }
    
    return formatted;
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (!auth) {
      setError('Firebase Auth belum diinisialisasi.');
      setIsLoading(false);
      return;
    }

    try {
      const formattedPhone = formatPhoneNumber(phone);
      const appVerifier = window.recaptchaVerifier;
      const result = await signInWithPhoneNumber(auth, formattedPhone, appVerifier);
      setConfirmationResult(result);
      setShowOtpInput(true);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Gagal mengirim kode OTP.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (!confirmationResult) {
       setError('Sesi OTP tidak valid. Silakan kirim ulang.');
       setIsLoading(false);
       return;
    }

    try {
      await confirmationResult.confirm(otp);
      // User akan otomatis tersimpan ke AuthContext melalui onAuthStateChanged
      navigate('/');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Kode OTP salah.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center text-green-600 mb-4">
          <Phone className="w-12 h-12" />
        </div>
        <h2 className="mt-2 text-center text-3xl font-extrabold text-gray-900">
          Masuk dengan Nomor HP
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-gray-100">
          
          <div className="space-y-6">
            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">
                {error}
              </div>
            )}

            {!showOtpInput ? (
              <form onSubmit={handleSendOtp} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Nomor Handphone</label>
                  <div className="mt-1">
                    <input 
                      required 
                      type="tel" 
                      value={phone} 
                      onChange={(e) => setPhone(e.target.value)}
                      className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                      placeholder="Misal: 0812345678"
                    />
                  </div>
                </div>
                <button
                  type="submit" 
                  disabled={isLoading}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 transition-colors"
                >
                  {isLoading ? 'Mengirim...' : 'Kirim Kode OTP'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Kode OTP</label>
                  <div className="mt-1">
                    <input 
                      required 
                      type="text" 
                      value={otp} 
                      onChange={(e) => setOtp(e.target.value)}
                      className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 text-center tracking-widest text-lg"
                      placeholder="• • • • • •"
                      maxLength={6}
                    />
                  </div>
                </div>
                <button
                  type="submit" 
                  disabled={isLoading}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 transition-colors"
                >
                  {isLoading ? 'Memverifikasi...' : 'Verifikasi OTP'}
                </button>
                <button
                  type="button" 
                  onClick={() => setShowOtpInput(false)}
                  className="w-full text-center text-sm text-green-600 hover:text-green-500 font-medium"
                >
                  Ganti Nomor HP
                </button>
              </form>
            )}
            
            {/* Div ini wajib ada untuk reCAPTCHA Firebase */}
            <div id="recaptcha-container"></div>
          </div>
        </div>
      </div>
    </div>
  );
};
