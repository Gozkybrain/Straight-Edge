import React, { useState, useEffect } from 'react';
import '../styles/TapTap.css';
import tapCoin from '../images/tap-coin.png';
import waitingCoin from '../images/robo-greet.png';

const TapTap = ({ onIncrease }) => {
    const [newBalance, setNewBalance] = useState(0);
    const [flyOuts, setFlyOuts] = useState([]);
    const [clicks, setClicks] = useState(0);
    const [isWaiting, setIsWaiting] = useState(false);
    const [remainingTime, setRemainingTime] = useState(0);

    useEffect(() => {
        // Check if there's a saved waiting period from previous sessions
        const savedTime = localStorage.getItem('waitEndTime');
        if (savedTime) {
            const timeDiff = Math.floor((savedTime - Date.now()) / 1000);
            if (timeDiff > 0) {
                setIsWaiting(true);
                setRemainingTime(timeDiff);
            } else {
                localStorage.removeItem('waitEndTime');
            }
        }
    }, []);

    const handleClick = () => {
        if (isWaiting) return;

        setClicks(prev => prev + 1);
        setNewBalance(prev => prev + 1);
        onIncrease();

        const newFlyOut = { id: Date.now() };
        setFlyOuts(prevFlyOuts => [...prevFlyOuts, newFlyOut]);

        setTimeout(() => {
            setFlyOuts(prevFlyOuts => prevFlyOuts.filter(flyOut => flyOut.id !== newFlyOut.id));
        }, 2000);

        if (clicks + 1 === 18) {
            setIsWaiting(true);
            const waitEndTime = Date.now() + 60000; // 60 seconds from now
            localStorage.setItem('waitEndTime', waitEndTime);
            setRemainingTime(60);
        }
    };

    useEffect(() => {
        if (isWaiting && remainingTime > 0) {
            const timer = setInterval(() => {
                setRemainingTime(prev => {
                    const newTime = prev - 1;
                    if (newTime <= 0) {
                        clearInterval(timer);
                        localStorage.removeItem('waitEndTime');
                        setIsWaiting(false);
                        setClicks(0);
                        setNewBalance(0);
                    }
                    return newTime;
                });
            }, 1000);

            return () => clearInterval(timer);
        }
    }, [isWaiting, remainingTime]);

    return (
        <div className="taptap-container">
            <p className="balance-display">
                {newBalance === 0 ? "Start tapping" : `+${newBalance}`}
            </p>

            <div className="coin-container" onClick={handleClick}>
                <img src={isWaiting ? waitingCoin : tapCoin} alt="Tap Coin" className="coinImage" />
                <div className="sparkEffect"></div>

                {flyOuts.map(flyOut => (
                    <div key={flyOut.id} className="flyOut">+1</div>
                ))}
            </div>

            {isWaiting && (
                <p className="waiting-message">Wait for {remainingTime} seconds to start tapping again.</p>
            )}
        </div>
    );
};

export default TapTap;
