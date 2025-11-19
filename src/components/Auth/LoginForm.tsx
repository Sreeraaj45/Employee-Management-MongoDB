import React, { useState } from 'react';
import { Users, Eye, EyeOff, Sparkles, Mail, Lock, LogInIcon, X, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import Swal from 'sweetalert2';

export const LoginForm: React.FC = () => {
  const { login, microsoftLogin, isLoading, isMicrosoftLoading } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const showErrorAlert = (title: string, message: string) => {
  Swal.fire({
    title: `<div class="flex flex-col items-center justify-center"><div class="w-16 h-16 rounded-full bg-red-100/80 border border-red-200/50 flex items-center justify-center mb-3"><div class="w-10 h-10 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center"><div class="error-icon-container"></div></div></div><h2 class="text-xl font-bold bg-gradient-to-br from-red-700 to-red-600 bg-clip-text text-transparent">${title}</h2></div>`,
    html: `<div class="text-center"><p class="text-gray-600 text-sm leading-snug">${message}</p></div>`,
    showConfirmButton: true,
    confirmButtonText: 'Try Again',
    confirmButtonColor: '#dc2626',
    background: 'rgba(255, 255, 255, 0.95)',
    backdrop: 'rgba(0, 0, 0, 0.3)',
    showCloseButton: true,
    allowOutsideClick: true,
    allowEscapeKey: true,
    focusConfirm: false,
    returnFocus: false,
    heightAuto: false,
    didOpen: () => {
      const errorIconContainer = document.querySelector('.error-icon-container');
      if (errorIconContainer) {
        const iconSvg = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="text-white"><path d="M18 6 6 18"></path><path d="m6 6 12 12"></path></svg>`;
        errorIconContainer.innerHTML = iconSvg;
      }
      
      const swalContainer = Swal.getContainer();
      if (swalContainer) {
        swalContainer.style.pointerEvents = 'auto';
        swalContainer.style.zIndex = '9999';
        swalContainer.style.overflow = 'hidden';
      }
      const popup = Swal.getPopup();
      if (popup) {
        popup.style.pointerEvents = 'auto';
        popup.style.overflow = 'hidden';
      }
      const htmlContainer = document.querySelector('.swal2-html-container');
      if (htmlContainer) {
        (htmlContainer as HTMLElement).style.overflow = 'hidden';
      }
    },
    customClass: {
      container: 'backdrop-blur-sm',
      popup: 'rounded-2xl shadow-2xl border border-white/50 backdrop-blur-xl !py-4 no-scrollbar',
      title: '!mb-0 !p-0',
      htmlContainer: '!mt-0 !mb-3 !overflow-hidden',
      confirmButton: `!px-6 !py-2.5 !rounded-lg !font-semibold !text-sm !text-white !bg-gradient-to-r !from-red-600 !to-red-700 !shadow hover:!shadow-md transition-all duration-300 hover:!scale-105 !border !border-red-500/30`,
      closeButton: '!top-3 !right-3 !text-gray-400 hover:!text-gray-600'
    },
    width: 360,
    padding: '1.5rem',
  }).then((result) => {
    if (result.isConfirmed) {
      Swal.close();
      const emailInput = document.querySelector('input[type="email"]') as HTMLInputElement;
      emailInput?.focus();
    }
  });
};

const showSuccessAlert = (title: string, message: string) => {
  Swal.fire({
    title: `<div class="flex flex-col items-center justify-center"><div class="w-20 h-20 rounded-full bg-green-100/80 border border-green-200/50 flex items-center justify-center mb-4"><div class="w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center"><div class="success-icon-container"></div></div></div><h2 class="text-2xl font-bold bg-gradient-to-br from-green-700 to-green-600 bg-clip-text text-transparent">${title}</h2></div>`,
    html: `<div class="text-center"><p class="text-gray-600 text-base leading-relaxed">${message}</p><div class="w-16 h-1 bg-gradient-to-r from-green-400 to-green-500 rounded-full mx-auto mt-4"></div></div>`,
    showConfirmButton: false,
    timer: 2000,
    timerProgressBar: true,
    background: 'rgba(255, 255, 255, 0.95)',
    backdrop: 'rgba(0, 0, 0, 0.4)',
    didOpen: () => {
      const successIconContainer = document.querySelector('.success-icon-container');
      if (successIconContainer) {
        const iconSvg = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="text-white"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
        successIconContainer.innerHTML = iconSvg;
      }
      
      const swalContainer = Swal.getContainer();
      if (swalContainer) {
        swalContainer.style.overflow = 'hidden';
      }
      const popup = Swal.getPopup();
      if (popup) {
        popup.style.overflow = 'hidden';
      }
      const htmlContainer = document.querySelector('.swal2-html-container');
      if (htmlContainer) {
        (htmlContainer as HTMLElement).style.overflow = 'hidden';
      }
    },
    customClass: {
      container: 'backdrop-blur-sm',
      popup: 'rounded-2xl shadow-2xl border border-white/50 backdrop-blur-xl !py-6 no-scrollbar',
      title: '!mb-0 !p-0',
      htmlContainer: '!mt-0 !mb-4 !overflow-hidden',
      timerProgressBar: '!bg-gradient-to-r !from-green-400 !to-green-500 !rounded-full !h-1'
    },
    width: 420,
    padding: '2rem',
  });
};

const showInfoAlert = (title: string, message: string) => {
  Swal.fire({
    title: `<div class="flex flex-col items-center justify-center"><div class="w-16 h-16 rounded-full bg-blue-100/80 border border-blue-200/50 flex items-center justify-center mb-3"><div class="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center"><div class="info-icon-container"></div></div></div><h2 class="text-xl font-bold bg-gradient-to-br from-blue-700 to-blue-600 bg-clip-text text-transparent">${title}</h2></div>`,
    html: `<div class="text-center"><p class="text-gray-600 text-sm leading-snug">${message}</p><div class="flex justify-center mt-3"><div class="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div></div></div>`,
    showConfirmButton: false,
    allowOutsideClick: false,
    allowEscapeKey: false,
    background: 'rgba(255, 255, 255, 0.95)',
    backdrop: 'rgba(0, 0, 0, 0.4)',
    didOpen: () => {
      const infoIconContainer = document.querySelector('.info-icon-container');
      if (infoIconContainer) {
        const iconSvg = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="text-white"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`;
        infoIconContainer.innerHTML = iconSvg;
      }
      
      const swalContainer = Swal.getContainer();
      if (swalContainer) {
        swalContainer.style.overflow = 'hidden';
      }
      const popup = Swal.getPopup();
      if (popup) {
        popup.style.overflow = 'hidden';
      }
      const htmlContainer = document.querySelector('.swal2-html-container');
      if (htmlContainer) {
        (htmlContainer as HTMLElement).style.overflow = 'hidden';
      }
    },
    customClass: {
      container: 'backdrop-blur-sm',
      popup: 'rounded-2xl shadow-2xl border border-white/50 backdrop-blur-xl !py-4 no-scrollbar',
      title: '!mb-0 !p-0',
      htmlContainer: '!mt-0 !mb-3 !overflow-hidden'
    },
    width: 360,
    padding: '1.5rem',
  });
};

  // Rest of your component remains exactly the same...
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setPasswordError('');

    // Basic client-side validation
    if (!formData.email || !formData.password) {
      showErrorAlert('Missing Information', 'Please fill in all fields');
      return;
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      showErrorAlert('Invalid Email', 'Please enter a valid email address');
      return;
    }

    // Check if email ends with @ielektron.com
    if (!formData.email.toLowerCase().endsWith('@ielektron.com')) {
      showErrorAlert(
        'Invalid Email Domain', 
        'Only @ielektron.com email addresses are allowed. Please use your company email.'
      );
      setError('Only @ielektron.com email addresses are allowed.');
      return;
    }

    const result = await login(formData.email, formData.password);
    console.log('🔍 Login result:', result);
    
    if (!result.success) {
      const errorMessage = result.error || 'Invalid email or password';
      const lowerCaseError = errorMessage.toLowerCase();
      
      // Enhanced error detection
      if (lowerCaseError.includes('invalid login credentials') || 
          lowerCaseError.includes('invalid') ||
          lowerCaseError.includes('incorrect')) {
        
        showErrorAlert(
          'Invalid Credentials',
          'The email or password you entered is incorrect. Please check both fields and try again.'
        );
        
        // Set both errors to highlight both fields
        setError('Please check your email address');
        setPasswordError('Please check your password');
        
      } else if (lowerCaseError.includes('user not found') ||
                 lowerCaseError.includes('user does not exist')) {
        
        showErrorAlert(
          'Account Not Found',
          'No account found with this email address. Please check your email or contact your administrator.'
        );
        setError('No account found with this email address.');
        
      } else if (lowerCaseError.includes('password')) {
        
        showErrorAlert(
          'Incorrect Password',
          'The password you entered is incorrect. Please try again.'
        );
        setPasswordError('The password you entered is incorrect. Please try again.');
        
      } else if (lowerCaseError.includes('rate limit') ||
                 lowerCaseError.includes('too many requests')) {
        
        showErrorAlert('Too Many Attempts', 'Please wait a moment before trying again.');
        
      } else {
        
        showErrorAlert('Login Failed', errorMessage);
        setError(errorMessage);
      }

    } else {
      // Success case - show success message
      showSuccessAlert('Welcome Back!', 'You have successfully logged in.');
    }
  };

  const handleMicrosoftLogin = async () => {
    setError('');
    setPasswordError('');
    
    console.log('🚀 Initiating Microsoft Entra ID login...');
    
    // Show loading state for Microsoft login
    showInfoAlert('Redirecting to Microsoft', 'Please complete the authentication in the new window');

    const result = await microsoftLogin();
    
    if (!result.success) {
      Swal.close(); // Close the loading dialog
      showErrorAlert('Microsoft Login Failed', result.error || 'Microsoft authentication failed. Please try again.');
      console.error('Microsoft login failed:', result.error);
    }
    // If successful, the redirect will happen automatically
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPassword = e.target.value;
    setFormData({ ...formData, password: newPassword });
    
    // Clear password error when user starts typing
    if (passwordError) {
      setPasswordError('');
    }
    
    // Clear general error when user modifies any field
    if (error) {
      setError('');
    }
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEmail = e.target.value;
    setFormData({ ...formData, email: newEmail });
    
    // Clear general error when user modifies any field
    if (error) {
      setError('');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4 sm:p-4 lg:p-4 relative overflow-hidden">
      {/* Add custom styles for animations and scrollbar removal */}
      <style jsx global>{`
        @keyframes popIn {
          0% {
            opacity: 0;
            transform: scale(0.8) translateY(10px);
          }
          100% {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        
        @keyframes bounceIn {
          0% {
            opacity: 0;
            transform: scale(0.3) translateY(-20px);
          }
          50% {
            opacity: 0.9;
            transform: scale(1.1) translateY(5px);
          }
          80% {
            opacity: 1;
            transform: scale(0.89) translateY(-2px);
          }
          100% {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        
        @keyframes scaleIn {
          0% {
            transform: scale(0);
          }
          70% {
            transform: scale(1.1);
          }
          100% {
            transform: scale(1);
          }
        }
        
        @keyframes fadeIn {
          0% {
            opacity: 0;
          }
          100% {
            opacity: 1;
          }
        }
        
        @keyframes fadeInUp {
          0% {
            opacity: 0;
            transform: translateY(10px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes widthGrow {
          0% {
            width: 0;
          }
          100% {
            width: 3rem;
          }
        }
        
        .animate-pop-in {
          animation: popIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
        }
        
        .animate-bounce-in {
          animation: bounceIn 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
        }
        
        .animate-scale-in {
          animation: scaleIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
        }
        
        .animate-fade-in {
          animation: fadeIn 0.5s ease-out forwards;
          animation-delay: 0.2s;
          opacity: 0;
        }
        
        .animate-fade-in-up {
          animation: fadeInUp 0.5s ease-out forwards;
          animation-delay: 0.3s;
          opacity: 0;
        }
        
        .animate-width-grow {
          animation: widthGrow 1s ease-out forwards;
          animation-delay: 0.5s;
        }

        /* Ensure buttons are clickable */
        .animated-confirm-btn {
          opacity: 1 !important;
          cursor: pointer !important;
        }

        .swal2-close {
          opacity: 1 !important;
          cursor: pointer !important;
        }

        /* Remove scrollbars from SweetAlert */
        .no-scrollbar {
          overflow: hidden !important;
        }

        .swal2-container {
          overflow: hidden !important;
        }

        .swal2-popup {
          overflow: hidden !important;
        }

        .swal2-html-container {
          overflow: hidden !important;
          max-height: none !important;
        }
      `}</style>

      {/* Rest of your component remains exactly the same... */}
      {/* Background Elements */}
      <div className="absolute inset-0 bg-grid-pattern opacity-3"></div>

      {/* Subtle Blobs */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-blue-50 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-blob"></div>
      <div className="absolute top-40 right-10 w-72 h-72 bg-cyan-50 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-blob animation-delay-2000"></div>
      <div className="absolute -bottom-8 left-1/2 w-72 h-72 bg-slate-50 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-blob animation-delay-4000"></div>

      {/* Main Card */}
      <div className="relative bg-white rounded-3xl shadow-xl w-full max-w-sm sm:max-w-md overflow-hidden border border-slate-100 transition-all duration-500">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50/50 via-white to-blue-50/50 pointer-events-none"></div>

        {/* Header Section */}
        <div className="relative bg-gradient-to-br from-slate-600 via-blue-600 to-cyan-600 px-6 sm:px-6 py-6 sm:py-6 text-center overflow-hidden">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="absolute top-0 left-0 w-40 h-40 bg-white/10 rounded-full -translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute bottom-0 right-0 w-32 h-32 bg-white/10 rounded-full translate-x-1/3 translate-y-1/3"></div>

          <div className="relative w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg transition-all duration-300 hover:scale-110 hover:rotate-6 group">
            <Users className="h-8 w-8 text-white transition-transform duration-300 group-hover:scale-110" />
            <Sparkles className="h-4 w-4 text-white/80 absolute -top-1 -right-1 animate-pulse" />
          </div>

          <h1 className="text-2xl sm:text-2xl font-bold text-white mb-2 tracking-tight">
            EmpManage
          </h1>
          <p className="text-sm sm:text-sm text-white/90 font-medium">
            Employee Management System
          </p>
        </div>

        {/* Form Section */}
        <div className="p-6 sm:p-6 relative">
          {/* Microsoft Entra ID Button */}
          <button
            type="button"
            onClick={handleMicrosoftLogin}
            disabled={isLoading || isMicrosoftLoading}
            className="
              w-full relative overflow-hidden group
              bg-white text-gray-800 py-3 px-6 rounded-xl font-semibold text-sm mb-2
              flex items-center justify-center space-x-3
              focus:ring-4 focus:ring-blue-400/30 focus:outline-none
              disabled:opacity-40 disabled:cursor-not-allowed
              transition-all duration-300 ease-out
              hover:bg-slate-50 hover:border-slate-400 hover:shadow-lg
              active:scale-[0.99]
              shadow-md border border-slate-200
            "
          >
            <div className="relative flex items-center justify-center">
              <svg
                className="h-5 w-5 transition-transform duration-300 group-hover:scale-110"
                viewBox="0 0 23 23"
                fill="currentColor"
              >
                <path d="M0 0h11v11H0z" fill="#f35325" />
                <path d="M12 0h11v11H12z" fill="#81bc06" />
                <path d="M0 12h11v11H0z" fill="#05a6f0" />
                <path d="M12 12h11v11H12z" fill="#ffba08" />
              </svg>
            </div>

            <span className="font-semibold text-gray-700 transition-all duration-300 group-hover:text-gray-900">
              {isMicrosoftLoading ? 'Connecting to Microsoft...' : 'Continue with Microsoft'}
            </span>

            {isMicrosoftLoading && (
              <div className="absolute right-4">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent" />
              </div>
            )}
          </button>

          {/* Divider */}
          <div className="flex items-center mb-2">
            <div className="flex-1 border-t border-slate-300"></div>
            <div className="px-3 text-slate-600 text-sm font-medium bg-white py-1 rounded-lg">
              Or
            </div>
            <div className="flex-1 border-t border-slate-300"></div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div className="group">
              <label className="flex items-center text-sm font-semibold text-gray-700 mb-2 transition-all duration-300 group-focus-within:text-blue-600">
                <Mail className="h-4 w-4 mr-2 text-slate-500 transition-all duration-300 group-focus-within:text-blue-500 group-focus-within:scale-110" />
                Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleEmailChange}
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:bg-white focus:shadow-inner focus:scale-[1.02] transition-all duration-300 text-sm bg-white placeholder-slate-400 group-hover:bg-white shadow-sm ${
                    error
                      ? 'border-red-300 focus:border-red-400 focus:ring-red-400/30' 
                      : 'border-slate-200 focus:border-blue-400 focus:ring-blue-400/30 group-hover:border-slate-300'
                  }`}
                  placeholder="your.name@ielektron.com"
                />
                <div className="absolute inset-0 rounded-xl bg-gradient-to-b from-white/50 to-transparent opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 pointer-events-none" />
              </div>
            </div>

            {/* Password Field */}
            <div className="group">
              <label className="flex items-center text-sm font-semibold text-gray-700 mb-2 transition-all duration-300 group-focus-within:text-blue-600">
                <Lock className="h-4 w-4 mr-2 text-slate-500 transition-all duration-300 group-focus-within:text-blue-500 group-focus-within:scale-110" />
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={formData.password}
                  onChange={handlePasswordChange}
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:bg-white focus:shadow-inner focus:scale-[1.02] transition-all duration-300 text-sm bg-white placeholder-slate-400 group-hover:bg-white shadow-sm pr-12 ${
                    passwordError 
                      ? 'border-red-300 focus:border-red-400 focus:ring-red-400/30' 
                      : 'border-slate-200 focus:border-blue-400 focus:ring-blue-400/30 group-hover:border-slate-300'
                  }`}
                  placeholder="Enter your password"
                />
                <div className="absolute inset-0 rounded-xl bg-gradient-to-b from-white/50 to-transparent opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 pointer-events-none" />
                
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-500 hover:text-slate-700 transition-all duration-300 p-2 rounded-lg hover:bg-slate-100 hover:scale-110 border border-transparent hover:border-slate-200 z-10 backdrop-blur-sm"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              
              {passwordError && (
                <div className="mt-2 p-4 bg-red-50/80 border border-red-200/50 rounded-xl text-red-700 text-sm flex items-start space-x-3 animate-in fade-in duration-300 shadow-lg backdrop-blur-sm">
                  <div className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <X className="w-3 h-3 text-white" strokeWidth={3} />
                  </div>
                  <div>
                    <span className="font-semibold text-red-800">Password Error</span>
                    <p className="text-red-700 mt-1">{passwordError}</p>
                  </div>
                </div>
              )}
            </div>

            {error && !passwordError && (
              <div className="p-4 bg-red-50/80 border border-red-200/50 rounded-xl text-red-700 text-sm flex items-start space-x-3 animate-in fade-in duration-300 shadow-lg backdrop-blur-sm">
                <div className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <X className="w-3 h-3 text-white" strokeWidth={3} />
                </div>
                <div>
                  <span className="font-semibold text-red-800">Authentication Error</span>
                  <p className="text-red-700 mt-1">{error}</p>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || isMicrosoftLoading}
              className="w-full bg-gradient-to-r from-slate-600 via-blue-600 to-cyan-600 text-white py-3 px-4 rounded-xl font-bold hover:from-slate-700 hover:via-blue-700 hover:to-cyan-700 focus:ring-4 focus:ring-blue-400/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-500 flex items-center justify-center space-x-3 text-sm shadow-2xl relative overflow-hidden group mt-4"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-slate-500 via-blue-500 to-cyan-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              <div className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-cyan-400 to-blue-400 rounded-full transition-all duration-1000 transform scale-x-0 group-hover:scale-x-110" style={{ width: '100%' }} />
              
              <div className="absolute right-6 opacity-0 group-hover:opacity-100 transition-all duration-500 transform translate-x-4 group-hover:translate-x-0">
                <LogInIcon className="h-5 w-5 text-white" />
              </div>

              {isLoading ? (
                <div className="flex items-center space-x-2 relative z-10">
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                  <span>Signing In...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-3 relative z-10 transition-all duration-500 group-hover:translate-x-12">
                  <span className="transition-all duration-500 font-semibold">
                    Access Dashboard
                  </span>
                </div>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Custom Animations */}
      <style jsx>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
};