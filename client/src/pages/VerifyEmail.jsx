import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api, { errorMessage } from '../api/axios.js';

export default function VerifyEmail() {
  const { token } = useParams();
  const [state, setState] = useState({ status: 'loading', message: '' });
  const sent = useRef(false); // the token works once, so never send it twice (StrictMode runs effects twice in dev)

  useEffect(() => {
    if (sent.current) return;
    sent.current = true;
    api
      .get(`/auth/verify/${token}`)
      .then((res) => setState({ status: 'ok', message: res.data.message }))
      .catch((err) => setState({ status: 'error', message: errorMessage(err) }));
  }, [token]);

  return (
    <div className="card form">
      <h1>Email verification</h1>
      {state.status === 'loading' && <p className="muted">Verifying...</p>}
      {state.status === 'ok' && <p className="alert alert-success">{state.message}</p>}
      {state.status === 'error' && <p className="alert alert-error">{state.message}</p>}
      {state.status !== 'loading' && (
        <Link to="/login" className="btn btn-primary">
          Go to sign in
        </Link>
      )}
    </div>
  );
}
