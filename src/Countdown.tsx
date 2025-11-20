import { useState, useEffect } from 'react';

interface CountdownProps {
  onComplete: () => void;
  startCount?: number;
}

export default function Countdown({ onComplete, startCount = 3 }: CountdownProps) {
  const [countdown, setCountdown] = useState(startCount);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      onComplete();
    }
  }, [countdown, onComplete]);

  return (
    <div className="countdown-screen">
      <div className="countdown-number">{countdown}</div>
    </div>
  );
}
