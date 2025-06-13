import React, { useEffect, useState, useCallback } from "react";

const API_BASE = "http://localhost:3001";

function App() {
  const [slaughterNumber, setSlaughterNumber] = useState("");
  const [currentAction, setCurrentAction] = useState(null);
  const [inputValue, setInputValue] = useState("");
  const [photo, setPhoto] = useState(null);
  const [history, setHistory] = useState([1]);
  const [animalInfo, setAnimalInfo] = useState(null);
  const [stationInfo, setStationInfo] = useState(null);
  const [done, setDone] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [resetting, setResetting] = useState(false);
  const [sessionStatus, setSessionStatus] = useState("unknown");
  const [clock, setClock] = useState(new Date());
  const [showOfflineAlert, setShowOfflineAlert] = useState(false);

  const fetchNextAction = useCallback(async (number) => {
    const res = await fetch(`${API_BASE}/next-action?slaughter=${number}`);
    const data = await res.json();
    if (data.finished) {
      setCurrentAction(null);
      setDone(true);
      setCountdown(5);
    } else {
      setCurrentAction(data);
    }
  }, []);

  const fetchStationInfo = async () => {
    const res = await fetch(`${API_BASE}/station`);
    const data = await res.json();
    setStationInfo(data);
  };

  const fetchAnimalInfo = async (number) => {
    const res = await fetch(`${API_BASE}/animal-info?number=${number}`);
    const data = await res.json();
    setAnimalInfo(data);
    setSlaughterNumber(number);
    await fetchNextAction(number);
  };

  const startSessionWatchdog = () => {
    setInterval(async () => {
      try {
        const res = await fetch(`${API_BASE}/session`);
        const data = await res.json();
        setSessionStatus(data.status);
        setShowOfflineAlert(data.status !== 'ok');
      } catch {
        setSessionStatus("offline");
        setShowOfflineAlert(true);
      }
    }, 3000);
  };

  useEffect(() => {
    fetchStationInfo();
    startSessionWatchdog();
    const timer = setInterval(() => setClock(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    let resetTimer;
    if (done && countdown > 0) {
      resetTimer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    } else if (done && countdown === 0) {
      setResetting(true);
      fetch(`${API_BASE}/reset?slaughter=${slaughterNumber}`, { method: "POST" })
        .then(() => resetWizard())
        .catch(() => resetWizard());
    }
    return () => clearTimeout(resetTimer);
  }, [done, countdown, slaughterNumber]);

  // When a new action arrives, prefill values if necessary
  useEffect(() => {
    if (currentAction?.type === "select" && Array.isArray(currentAction.options) && currentAction.options.length > 0) {
      setInputValue(currentAction.options[0]);
    } else if (currentAction?.type === "textarea") {
      setInputValue("");
    }
  }, [currentAction]);

  async function handleSubmit(eventOrValue = null) {
    const value = typeof eventOrValue === 'string' || eventOrValue === null ? (eventOrValue ?? inputValue) : inputValue;

    if (eventOrValue?.target instanceof HTMLButtonElement) {
      eventOrValue.preventDefault?.();
    }

    if (photo) {
      const formData = new FormData();
      formData.append("photo", photo);
      formData.append("slaughterNumber", slaughterNumber);
      formData.append("action", currentAction?.id);
      await fetch(`${API_BASE}/upload-photo`, {
        method: "POST",
        body: formData,
      });
    } else if (currentAction) {
      const payload = {
        slaughterNumber,
        action: currentAction.id,
        value,
      };
      await fetch(`${API_BASE}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    }

    if (currentAction) {
      setHistory([...history, {
        action: {
          id: currentAction.id,
          description: currentAction.description,
          type: currentAction.type,
          lastStep: currentAction.lastStep,
        },
        inputValue: value,
      }]);
    }

    setInputValue("");
    setPhoto(null);

    if (!done) {
      fetchNextAction(slaughterNumber);
    }
  }

  function resetWizard() {
    setSlaughterNumber("");
    setCurrentAction(null);
    setHistory([]);
    setAnimalInfo(null);
    setDone(false);
    setCountdown(5);
    setResetting(false);
  }

  function goBack() {
    if (history.length > 0) {
      const last = history[history.length - 1];
      setHistory(history.slice(0, -1));
      setCurrentAction(last.action);
      setInputValue(last.inputValue || "");
      setDone(false);
    }
  }

  const renderHeader = () => (
    <header className="w-full bg-black text-white p-4 flex flex-wrap justify-between items-start">
      <div className="bg-gray-800 p-3 m-1 rounded">
        <strong>Station:</strong><br />
        {stationInfo?.name || 'Loading...'}<br />
        <strong>Printer:</strong><br />
        {stationInfo?.printer || 'N/A'}
      </div>
      <div className="bg-gray-800 p-3 m-1 rounded">
        <strong>Connection:</strong><br />
        <span className={sessionStatus === 'ok' ? 'text-green-400' : 'text-red-400'}>{sessionStatus}</span>
      </div>
      <div className="bg-gray-800 p-3 m-1 rounded">
        <strong>Time:</strong><br /> {clock.toLocaleTimeString()}<br />
        <strong>Date:</strong><br /> {clock.toLocaleDateString()}
      </div>
    </header>
  );

  const renderAnimalInfo = () => (
    animalInfo && (
      <div className="sticky top-0 z-10 bg-white border-b w-full shadow p-4">
        <div className="max-w-md mx-auto bg-gray-100 p-3 rounded">
          <strong>Animal Info:</strong><br />
          ID: {animalInfo.id} <br />
          Type: {animalInfo.type} <br />
          Date: {animalInfo.date}
        </div>
      </div>
    )
  );

  const step = history.length + 1;
  const totalSteps = done ? history.length : history.length + (currentAction ? 1 : 0);

  return (
    <div className="h-screen flex flex-col">
      {renderHeader()}
      {showOfflineAlert && (
        <div className="bg-red-500 text-white p-2 text-center font-bold">⚠ Connection to server lost!</div>
      )}
      {renderAnimalInfo()}
      <div className="flex-grow flex flex-col items-center justify-start overflow-y-auto pt-4">
        <div className="p-4 w-full max-w-md">
          {!animalInfo && (
            <>
              <h1 className="text-xl mb-2 text-center">Scan or enter Slaughter Number</h1>
              <input
                className="border p-2 w-full"
                value={slaughterNumber}
                onChange={(e) => setSlaughterNumber(e.target.value)}
              />
              <button className="bg-blue-500 text-white px-4 py-2 mt-2 w-full" onClick={() => fetchAnimalInfo(slaughterNumber)}>Start</button>
            </>
          )}

          {animalInfo && (
            <>
              {!done && currentAction && (
                <>
                  {/* <h2 className="text-xl font-bold mb-1 text-center">Stap {step} van {totalSteps}</h2> */}
                  <h3 className="text-md font-semibold mb-4 text-center">{currentAction.description}</h3>

                  {currentAction.type === "confirm" && (
                    <button className="bg-green-500 text-white px-4 py-2 w-full" onClick={handleSubmit}>Confirm</button>
                  )}

                  {currentAction.type === "input" && (
                    <div>
                      <input
                        className="border p-2 w-full"
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                      />
                      <button className="bg-blue-500 text-white px-4 py-2 mt-2 w-full" onClick={handleSubmit}>Submit</button>
                    </div>
                  )}

                  {currentAction.type === "select" && (
                    <div>
                      <select
                        className="border p-2 w-full"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                      >
                        {currentAction.options?.map(option => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                      <button className="bg-blue-500 text-white px-4 py-2 mt-2 w-full" onClick={handleSubmit}>Submit</button>
                    </div>
                  )}

                  {currentAction.type === "textarea" && (
                    <div>
                      <textarea
                        className="border p-2 w-full"
                        rows="4"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                      />
                      <button className="bg-blue-500 text-white px-4 py-2 mt-2 w-full" onClick={handleSubmit}>Submit</button>
                    </div>
                  )}

                  {currentAction.type === "photo" && (
                    <div>
                      <input
                        type="file"
                        accept="image/*"
                        className="w-full"
                        onChange={(e) => setPhoto(e.target.files[0])}
                      />
                      <button className="bg-blue-500 text-white px-4 py-2 mt-2 w-full" onClick={handleSubmit}>Upload</button>
                    </div>
                  )}

                  {currentAction.type === "labels" && (
                    <div>
                      <label className="block mb-2">Select number of labels:</label>
                      <div className="flex gap-4">
                        {[2, 4].map(num => (
                          <button
                            key={num}
                            className="bg-blue-500 text-white px-4 py-2 w-full"
                            onClick={() => handleSubmit(num.toString())}
                          >
                            {num}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}

              {done && (
                <div className="text-center mt-4 text-green-600">
                  <div className="text-5xl mb-2">✔</div>
                  {resetting ? (
                    <div className="text-lg animate-pulse text-gray-700">Resetting...</div>
                  ) : (
                    <div className="text-lg">Resetting in {countdown}...</div>
                  )}
                </div>
              )}

              {history.length > 0 && !done && (
                <button className="bg-gray-400 text-white px-4 py-2 mt-4 w-full" onClick={goBack}>Back</button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
