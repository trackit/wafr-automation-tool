import { getCurrentUser, signOut } from 'aws-amplify/auth';
import { CircleHelp, LogOut, ChevronDown } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router';

import logo from '../assets/logo.png';

const Topbar = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState<string>('');

  useEffect(() => {
    getCurrentUser()
      .then((user) => {
        console.log(user);
        setUsername(user.signInDetails?.loginId || '');
      })
      .catch(console.error);
  }, []);

  const handleSignOut = useCallback(async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  }, []);

  return (
    <div className="w-full h-16 flex items-center justify-between py-2 border-b border-neutral-content">
      <div
        className="flex items-center gap-2 ml-8 prose cursor-pointer"
        onClick={() => navigate('/')}
      >
        <img
          src={logo}
          alt="WAFR Automation"
          className={'h-[30px] mt-0 mb-[10px]'}
        />
        <h2 className="ml-3 mt-0 mb-0 text-[#9CA3AF] font-semibold text-xl">
          WAFR Automation
        </h2>
      </div>
      <div className="flex items-center mr-8">
        {/* <ThemeSwitcher /> */}

        <div className="dropdown dropdown-end">
          <button className="btn btn-link no-underline">
            <div className="w-6 h-6 rounded-full bg-primary text-primary-content flex items-center justify-center text-sm font-semibold">
              {username.charAt(0).toUpperCase()}
            </div>
            <span className="hidden md:block font-bold text-base-content">
              {username}
            </span>
            <ChevronDown className="w-4 h-4 text-base-content" />
          </button>
          <ul
            tabIndex={0}
            className="dropdown-content z-[1] menu shadow bg-base-100 rounded-box shadow w-[130px]"
          >
            <li className="w-full">
              <button className="btn btn-link w-full" onClick={handleSignOut}>
                <LogOut className="w-4 h-4" />
                Sign out
              </button>
            </li>
          </ul>
        </div>
        <button
          className="btn btn-ghost btn-xs p-1"
          onClick={(e) => {
            navigate('/faq');
          }}
        >
          <CircleHelp className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default Topbar;
