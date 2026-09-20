    import { useEffect, useState } from 'react';

    const CountUp = ({ end, duration = 800 }) => {
    const target = Number(end) || 0;
    const [count, setCount] = useState(0);

    useEffect(() => {
        let startTime;
        let animationFrame;

        const animate = (timestamp) => {
        if (!startTime) startTime = timestamp;
        const progress = Math.min((timestamp - startTime) / duration, 1);
        setCount(Math.floor(progress * target));
        if (progress < 1) animationFrame = requestAnimationFrame(animate);
        else setCount(target);
        };

        animationFrame = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(animationFrame);
    }, [duration, target]);

    return <span>{count.toLocaleString()}</span>;
    };

    export default CountUp;
