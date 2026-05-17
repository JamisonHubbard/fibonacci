import { useState, useEffect } from 'react';
import axios from 'axios';

function Fib() {
  const [seenIndices, setSeenIndices] = useState([]);
  const [values, setValues] = useState({});
  const [index, setIndex] = useState('');

  useEffect(() => {
    fetchValues();
    fetchIndices();
  }, []);

  // Subscribe to real-time updates via SSE
  useEffect(() => {
    const eventSource = new EventSource('/api/events');

    eventSource.addEventListener('index', (e) => {
      const data = JSON.parse(e.data);
      setSeenIndices((prev) => [...prev, data]);
    });

    eventSource.addEventListener('result', (e) => {
      const data = JSON.parse(e.data);
      setValues((prev) => ({ ...prev, [data.index]: data.value }));
    });

    return () => eventSource.close();
  }, []);

  async function fetchValues() {
    const response = await axios.get('/api/values/current');
    setValues(response.data);
  }

  async function fetchIndices() {
    const response = await axios.get('/api/values/all');
    setSeenIndices(response.data);
  }

  async function handleSubmit(event) {
    event.preventDefault();

    await axios.post('/api/values', { index });
    setIndex('');
  }

  function renderSeenIndices() {
    return seenIndices.map(({ number }) => number).join(', ');
  }

  function renderValues() {
    const entries = [];
    for (let key in values) {
      entries.push(
        <div key={key}>
          For index {key} I calculated {values[key]}
        </div>
      );
    }
    return entries;
  }

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <label>Enter your index:</label>
        <input
          value={index}
          onChange={(event) => setIndex(event.target.value)}
        />
        <button>Submit</button>
      </form>

      <h3>Indices I Have Seen:</h3>
      {renderSeenIndices()}

      <h3>Calculated Values</h3>
      {renderValues()}
    </div>
  );
}

export default Fib;
