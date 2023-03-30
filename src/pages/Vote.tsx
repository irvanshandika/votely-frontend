import axios from 'axios';
import moment from 'moment';
import { FormEvent, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import CountDown from '../components/CountDown';
import VoteSkeleton from '../components/VoteSkeleton';
import { User } from '../types/user';
import { Votes } from '../types/votes';

export const STATE_NOT_STARTED = 'STATE_NOT_STARTED',
  STATE_STARTED = 'STATE_STARTED',
  STATE_ENDED = 'STATE_ENDED',
  STATE_LOADING = 'STATE_LOADING';

const Vote = ({ user }: { user: User | undefined }) => {
  const [vote, setVote] = useState<Votes>();
  const { code } = useParams();
  const navigate = useNavigate();
  const [currentState, setCurrentState] = useState(STATE_LOADING);
  const [selectedOption, setSelectedOption] = useState('');
  const [isVote, setIsVote] = useState<boolean>(false);

  const handleOptionChange = (candidate: string) => {
    setSelectedOption(candidate);
  };

  const getVote = async (code: string) => {
    try {
      const { data } = await axios.get(`http://localhost:3000/api/votes/${code}`);
      setVote(data.result);
    } catch (error: any) {
      if (error.response?.data.code === 404) {
        navigate('/');
      }
      console.error(error.message);
    }
  };

  const getParticipantVote = async (code: string) => {
    try {
      const { data } = await axios.get(`http://localhost:3000/api/participant/${code}`);
      if (!data.result) return setIsVote(false);
      setIsVote(true);
    } catch (error: any) {
      console.error(error.message);
    }
    return true;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (selectedOption === '') {
      toast.error('Pilih salah satu kandidat', {
        position: 'top-right',
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: 'colored',
      });
      return;
    }
    try {
      await axios.post('http://localhost:3000/api/participant', {
        candidate: selectedOption,
        code: code,
      });
      toast.success('Berhasil melakukan voting!', {
        position: 'top-right',
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: 'colored',
      });
      navigate('/');
    } catch (error: any) {
      console.error(error.message);
    }
  };

  useEffect(() => {
    if (vote) {
      if (currentState === STATE_ENDED) {
        return;
      }
      const start = moment(vote?.startDateTime);
      const end = moment(vote?.endDateTime);

      const interval = setInterval(async () => {
        const now = moment();

        if (now.isBefore(start)) {
          setCurrentState(STATE_NOT_STARTED);
        } else if (now.isAfter(start) && now.isBefore(end)) {
          setCurrentState(STATE_STARTED);
        } else if (now.isAfter(end)) {
          setCurrentState(STATE_ENDED);
        }
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [vote]);

  useEffect(() => {
    getVote(String(code));
    getParticipantVote(String(code));
  }, []);

  return (
    <div className="flex flex-col items-center ">
      {currentState === 'STATE_LOADING' ? (
        <VoteSkeleton />
      ) : (
        <>
          <h2 className="text-3xl font-semibold text-[#3C3C3C]">{vote?.title}</h2>
          {vote?.startDateTime && vote?.endDateTime && <CountDown start={vote?.startDateTime} end={vote?.endDateTime} currentState={currentState} />}
          {isVote && <p className="flex justify-center my-4 py-2 px-4 bg-[#eadeff] text-[#4A1B9D]">Terima kasih sudah melakukan voting</p>}
          <div className="flex justify-center lg:w-1/3 my-4 w-full">
            <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
              {vote?.candidates.map((c, index) => (
                <div key={index} className="flex border border-gray-200 rounded-md justify-between px-4 py-2 items-center  ">
                  <div className="w-full flex flex-col gap-2">
                    <div>
                      <h3 className="text-xl font-semibold text-[#3C3C3C]">{c.name}</h3>
                      <p>Kandidat {index + 1}</p>
                    </div>

                    <div className="w-full bg-gray-200 rounded-full h-2 ">
                      <div className="bg-[#4A1B9D] h-2 rounded-full" style={{ width: `${c.votes}%` }}></div>
                    </div>
                  </div>

                  <div className={selectedOption === c.name ? 'text-[#4A1B9D]' : 'text-[#3C3C3C]'} onClick={() => handleOptionChange(c.name)}>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-20 h-20">
                      <path
                        fillRule="evenodd"
                        d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                </div>
              ))}
              {user?.emails[0].value !== vote?.publisher && !isVote && (
                <button type="submit" className="bg-[#4A1B9D] px-4 py-2 rounded-sm text-white text-base font-semibold">
                  Kirim
                </button>
              )}
            </form>
          </div>

          <div className="w-full lg:w-1/3">{user?.emails[0].value === vote?.publisher && <p className="bg-red-50 text-red-600 text-center py-2 px-3 text-base">Pembuat vote tidak dapat melakukan voting</p>}</div>
        </>
      )}
    </div>
  );
};

export default Vote;
