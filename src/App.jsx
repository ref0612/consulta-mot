import React, { useState } from 'react';
import './App.css';

const OPERATORS = [
  { value: 'pullman', label: 'Pullman Costa' },
  { value: 'rutabus', label: 'Ruta Bus 78' },
  { value: 'tacoha', label: 'Tacoha' }
];

function App() {
  const [operador, setOperador] = useState('pullman');
  const [cupon, setCupon] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleTabClick = (value) => {
    setOperador(value);
    setResult(null);
    setError('');
    setCupon('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const res = await fetch('/api/consulta', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ operador, cupon })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error desconocido');
      setResult(data);
      setCupon('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <h2>Consulta de Boletos Abiertos</h2>
      <div className="tabs">
        {OPERATORS.map(op => (
          <button
            key={op.value}
            className={`tab${operador === op.value ? ' active' : ''}`}
            onClick={() => handleTabClick(op.value)}
            type="button"
          >
            {op.label}
          </button>
        ))}
      </div>
      <form onSubmit={handleSubmit} className="consulta-form">
        <input
          type="text"
          placeholder="Código de cupón"
          value={cupon}
          onChange={e => setCupon(e.target.value)}
          required
        />
        <button type="submit" disabled={loading || !cupon}>
          {loading ? 'Consultando...' : 'Consultar'}
        </button>
      </form>
      {error && <div className="error">{error}</div>}
      {result && (
        <div className="result">
          <h3>Resultado</h3>
          <table className="result-table">
            <tbody>
              <tr><th>Código</th><td>{result.coupon_code}</td></tr>
              <tr><th>Pasajero</th><td>{result.passenger_name}</td></tr>
              <tr><th>Creado</th><td>{result.created_at}</td></tr>
              <tr><th>Expira</th><td>{result.expiry_date}</td></tr>
              <tr><th>Email</th><td>{result.email}</td></tr>
              <tr><th>Teléfono</th><td>{result.mobile_number}</td></tr>
              <tr><th>Origen</th><td>{result.origin}</td></tr>
              <tr><th>Destino</th><td>{result.destination}</td></tr>
              <tr><th>Zona</th><td>{result.zone}</td></tr>
              <tr><th>Estado</th><td>{result.status}</td></tr>
              <tr><th>Usado en</th><td>{result.used_on}</td></tr>
              <tr><th>PNR</th><td>{result.used_by_pnr}</td></tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default App;
