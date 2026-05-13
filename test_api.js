const test = async () => {
  try {
    const res = await fetch('http://localhost:3000/api/ask', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ question: 'Test question' })
    });
    const data = await res.json();
    console.log("Response:", data);
  } catch(e) {
    console.error("Fetch error:", e);
  }
};

test();
