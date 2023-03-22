import axios from 'axios';
import moment from 'moment';
import { ChangeEvent, ErrorInfo, FormEvent, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import CountDown from '../components/CountDown';
import { Votes } from '../types/votes';

export const STATE_NOT_STARTED = 'STATE_NOT_STARTED',
  STATE_STARTED = 'STATE_STARTED',
  STATE_ENDED = 'STATE_ENDED',
  STATE_LOADING = 'STATE_LOADING';

const Vote = ({ user }: { user: any | undefined }) => {
  const [vote, setVote] = useState<Votes>();
  const { code } = useParams();
  const navigate = useNavigate();
  const [currentState, setCurrentState] = useState(STATE_LOADING);
  const [selectedOption, setSelectedOption] = useState('');
  const [isVote, setIsVote] = useState<boolean>(false);

  const handleOptionChange = (event: ChangeEvent<HTMLInputElement>) => {
    setSelectedOption(event.target.value);
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
      console.log(data.result);
    } catch (error: any) {
      console.error(error.message);
    }
    return true;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:3000/api/participant', {
        candidate: selectedOption,
        code: code,
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

  // useEffect(() => {
  //   if (vote && user) {
  //     const candidate = vote?.candidates?.find((c) => c.name === user?.candidate);
  //     if (candidate) {
  //       setSelectedCandidate(candidate);
  //     }
  //   }
  // }, [user, vote]);

  useEffect(() => {
    getVote(String(code));
    getParticipantVote(String(code));
  }, []);

  return (
    <div>
      {vote?.startDateTime && vote?.endDateTime && <CountDown start={vote?.startDateTime} end={vote?.endDateTime} currentState={currentState} />}
      {isVote && <p>Kamu sudah melakukan voting</p>}
      <form onSubmit={handleSubmit}>
        {vote?.candidates.map((c, index) => (
          <div key={index}>
            <div>
              <p>{c.name}</p>
              <p>{c.votes}</p>
            </div>
            <input type="radio" value={c.name} checked={selectedOption === c.name} disabled={user.emails[0].value === vote?.publisher || isVote} onChange={handleOptionChange} />
          </div>
        ))}
        {user.emails[0].value !== vote?.publisher && !isVote && <button type="submit">Kirim</button>}
      </form>
      {user.emails[0].value === vote?.publisher && <p className="text-red-500 text-center py-2 px-3">Pembuat vote tidak dapat melakukan voting</p>}
    </div>
  );
};

export default Vote;
