import { useEffect, useRef, useState } from 'react';

interface SkillData {
  skill: string;
  expectation: number;
  selfRating: number;
  managerRating: number;
}

interface SkillRadarProps {
  skills: SkillData[];
  title?: string;
  width?: number;
  height?: number;
}

export default function SkillRadar({ skills, title, width = 400, height = 400 }: SkillRadarProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // State for toggling visibility of each data series
  const [showExpectation, setShowExpectation] = useState(true);
  const [showSelfRating, setShowSelfRating] = useState(true);
  const [showManagerRating, setShowManagerRating] = useState(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || skills.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Adjust padding based on number of skills to prevent label overlap
    const labelPadding = skills.length > 15 ? 100 : skills.length > 10 ? 80 : 60;

    // Set canvas size for high DPI displays
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(dpr, dpr);

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    const centerX = width / 2;
    const centerY = height / 2;
    const maxRadius = Math.min(width, height) / 2 - labelPadding;
    const levels = 5;
    const angleStep = (Math.PI * 2) / skills.length;

    // Draw background circles (levels)
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;
    for (let i = 1; i <= levels; i++) {
      const radius = (maxRadius / levels) * i;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Draw axes and labels
    ctx.strokeStyle = '#d1d5db';
    ctx.lineWidth = 1;
    ctx.fillStyle = '#374151';

    // Adjust font size based on number of skills
    const fontSize = skills.length > 20 ? 9 : skills.length > 15 ? 10 : 11;
    ctx.font = `${fontSize}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    skills.forEach((skill, i) => {
      const angle = angleStep * i - Math.PI / 2;
      const x = centerX + Math.cos(angle) * maxRadius;
      const y = centerY + Math.sin(angle) * maxRadius;

      // Draw axis line
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(x, y);
      ctx.stroke();

      // Draw label with dynamic positioning
      const labelDistance = maxRadius + (skills.length > 15 ? 40 : 30);
      const labelX = centerX + Math.cos(angle) * labelDistance;
      const labelY = centerY + Math.sin(angle) * labelDistance;

      // Adjust text alignment based on position to prevent overlap
      const normalizedAngle = ((angle + Math.PI / 2) % (Math.PI * 2));
      if (normalizedAngle > Math.PI * 0.25 && normalizedAngle < Math.PI * 0.75) {
        ctx.textAlign = 'left';
      } else if (normalizedAngle > Math.PI * 1.25 && normalizedAngle < Math.PI * 1.75) {
        ctx.textAlign = 'right';
      } else {
        ctx.textAlign = 'center';
      }

      // Wrap long skill names
      const maxWidth = skills.length > 15 ? 60 : 80;
      const words = skill.skill.split(' ');
      let line = '';
      let lineY = labelY;
      const lineHeight = fontSize + 2;

      words.forEach((word, idx) => {
        const testLine = line + (line ? ' ' : '') + word;
        const metrics = ctx.measureText(testLine);
        if (metrics.width > maxWidth && line) {
          ctx.fillText(line, labelX, lineY);
          line = word;
          lineY += lineHeight;
        } else {
          line = testLine;
        }
        if (idx === words.length - 1) {
          ctx.fillText(line, labelX, lineY);
        }
      });
    });

    // Helper function to draw a polygon
    const drawPolygon = (data: number[], color: string, fillOpacity: number, lineWidth: number) => {
      if (data.length === 0) return;

      ctx.beginPath();
      data.forEach((value, i) => {
        const angle = angleStep * i - Math.PI / 2;
        const radius = (value / 5) * maxRadius;
        const x = centerX + Math.cos(angle) * radius;
        const y = centerY + Math.sin(angle) * radius;
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });
      ctx.closePath();

      // Fill
      ctx.fillStyle = color.replace('rgb', 'rgba').replace(')', `, ${fillOpacity})`);
      ctx.fill();

      // Stroke
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
      ctx.stroke();
    };

    // Draw expectation (green) - only if visible
    if (showExpectation) {
      const expectations = skills.map(s => s.expectation);
      drawPolygon(expectations, 'rgb(16, 185, 129)', 0.1, 2);
    }

    // Draw self rating (yellow) - only if visible
    if (showSelfRating) {
      const selfRatings = skills.map(s => s.selfRating);
      drawPolygon(selfRatings, 'rgb(251, 191, 36)', 0.15, 2);
    }

    // Draw manager rating (blue) - only if rated and visible
    if (showManagerRating) {
      const managerRatings = skills.map(s => s.managerRating);
      if (managerRatings.some(r => r > 0)) {
        drawPolygon(managerRatings, 'rgb(59, 130, 246)', 0.2, 2.5);
      }
    }

    // Draw points on each axis
    skills.forEach((skill, i) => {
      const angle = angleStep * i - Math.PI / 2;

      // Expectation point - only if visible
      if (showExpectation && skill.expectation > 0) {
        const radius = (skill.expectation / 5) * maxRadius;
        const x = centerX + Math.cos(angle) * radius;
        const y = centerY + Math.sin(angle) * radius;
        ctx.fillStyle = 'rgb(16, 185, 129)';
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fill();
      }

      // Self rating point - only if visible
      if (showSelfRating && skill.selfRating > 0) {
        const radius = (skill.selfRating / 5) * maxRadius;
        const x = centerX + Math.cos(angle) * radius;
        const y = centerY + Math.sin(angle) * radius;
        ctx.fillStyle = 'rgb(251, 191, 36)';
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fill();
      }

      // Manager rating point - only if visible
      if (showManagerRating && skill.managerRating > 0) {
        const radius = (skill.managerRating / 5) * maxRadius;
        const x = centerX + Math.cos(angle) * radius;
        const y = centerY + Math.sin(angle) * radius;
        ctx.fillStyle = 'rgb(59, 130, 246)';
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, Math.PI * 2);
        ctx.fill();
      }
    });
  }, [skills, width, height, showExpectation, showSelfRating, showManagerRating]);

  if (skills.length === 0) {
    return (
      <div className="flex items-center justify-center p-8 text-gray-500">
        No skills to display
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center">
      {title && <h3 className="text-lg font-bold text-gray-800 mb-4">{title}</h3>}
      <canvas id="canvas" ref={canvasRef} className="max-w-full" />
      <div className="flex gap-6 mt-4 text-sm flex-wrap justify-center">
        <button
          onClick={() => setShowExpectation(!showExpectation)}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all border-2 ${
            showExpectation
              ? 'bg-emerald-50 border-emerald-500 shadow-sm'
              : 'bg-gray-100 border-gray-300 opacity-50'
          }`}
        >
          <div
            className={`w-4 h-4 rounded-full ${
              showExpectation ? 'bg-emerald-500' : 'bg-gray-400'
            }`}
          ></div>
          <span
            className={`font-medium ${
              showExpectation ? 'text-emerald-700' : 'text-gray-500'
            }`}
          >
            Expectation
          </span>
        </button>
        <button
          onClick={() => setShowSelfRating(!showSelfRating)}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all border-2 ${
            showSelfRating
              ? 'bg-amber-50 border-amber-400 shadow-sm'
              : 'bg-gray-100 border-gray-300 opacity-50'
          }`}
        >
          <div
            className={`w-4 h-4 rounded-full ${
              showSelfRating ? 'bg-amber-400' : 'bg-gray-400'
            }`}
          ></div>
          <span
            className={`font-medium ${
              showSelfRating ? 'text-amber-700' : 'text-gray-500'
            }`}
          >
            Self Rating
          </span>
        </button>
        <button
          onClick={() => setShowManagerRating(!showManagerRating)}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all border-2 ${
            showManagerRating
              ? 'bg-blue-50 border-blue-500 shadow-sm'
              : 'bg-gray-100 border-gray-300 opacity-50'
          }`}
        >
          <div
            className={`w-4 h-4 rounded-full ${
              showManagerRating ? 'bg-blue-500' : 'bg-gray-400'
            }`}
          ></div>
          <span
            className={`font-medium ${
              showManagerRating ? 'text-blue-700' : 'text-gray-500'
            }`}
          >
            Manager Rating
          </span>
        </button>
      </div>
    </div>
  );
}
